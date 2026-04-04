import { Router } from 'express'
import { and, asc, desc, eq } from 'drizzle-orm'
import {
  batchUpdateResearchArgumentsSchema,
  reviewCaseResearchSchema,
  runCaseResearchSchema,
  upsertCaseResearchProfileSchema,
} from '@hukuk-takip/shared'
import { db } from '../db/index.js'
import {
  aiJobArtifacts,
  aiJobReviews,
  aiJobs,
  aiJobSources,
  aiJobSteps,
  caseBriefings,
  caseIntakeProfiles,
  caseProcedureReports,
  caseResearchProfiles,
  cases,
} from '../db/schema.js'
import { authenticate } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { createResearchTasks, saveResearchFindings } from '../utils/aiIntegration.js'
import { getOwnedCase } from '../utils/ownership.js'
import { getSingleValue } from '../utils/request.js'
import {
  buildEffectiveResearchQuestion,
  buildResearchQuestionContext,
  deriveResearchRunStatus,
  normalizeOptionalString,
  runMevzuatResearch,
  runNotebooklmResearch,
  runVectorResearch,
  runYargiResearch,
  summarizeResearchRun,
  writeResearchArtifacts,
  type ResearchSourceRun,
} from '../utils/research.js'
import {
  generatePrecheckWithAi,
  generateProcedureReportWithAi,
  hasProcedureAiConfig,
} from '../utils/procedureAi.js'
import { saveArtifactToDrive } from '../utils/workspace.js'

const router = Router()
router.use(authenticate)

function normalizeDate(value?: string | null) {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

async function getOwnedCaseRecord(userId: string, caseId: string) {
  const [caseRecord] = await db
    .select()
    .from(cases)
    .where(and(eq(cases.id, caseId), eq(cases.userId, userId)))
    .limit(1)

  return caseRecord ?? null
}

async function getOrCreateResearchJob(caseId: string, userId: string) {
  const [existingJob] = await db
    .select()
    .from(aiJobs)
    .where(and(eq(aiJobs.caseId, caseId), eq(aiJobs.jobType, 'research')))
    .orderBy(desc(aiJobs.createdAt))
    .limit(1)

  if (existingJob) {
    return existingJob
  }

  const [job] = await db
    .insert(aiJobs)
    .values({
      caseId,
      createdBy: userId,
      jobType: 'research',
      title: 'Arastirma hatti',
      status: 'draft',
      currentStepKey: 'collect_sources',
    })
    .returning()

  await db.insert(aiJobSteps).values([
    {
      jobId: job.id,
      stepKey: 'collect_sources',
      stepLabel: 'Kaynak secimini kilitle',
      stepOrder: 1,
      status: 'pending',
    },
    {
      jobId: job.id,
      stepKey: 'parallel_research',
      stepLabel: 'Paralel arastirmayi calistir',
      stepOrder: 2,
      status: 'pending',
    },
    {
      jobId: job.id,
      stepKey: 'orchestrated_research',
      stepLabel: 'Opus 4.6 orkestre arastirma',
      stepOrder: 3,
      status: 'pending',
    },
    {
      jobId: job.id,
      stepKey: 'research_merge',
      stepLabel: 'Arastirma bulgularini birlestir',
      stepOrder: 4,
      status: 'pending',
    },
    {
      jobId: job.id,
      stepKey: 'research_review',
      stepLabel: 'Arastirma kalite kontrolu',
      stepOrder: 5,
      status: 'pending',
    },
  ])

  return job
}

async function upsertResearchSource(jobId: string, source: {
  sourceType: string
  sourceName: string
  sourceLocator?: string | null
  isEnabled: boolean
  priority: number
  filterConfig?: string | null
}) {
  const [existingSource] = await db
    .select()
    .from(aiJobSources)
    .where(and(eq(aiJobSources.jobId, jobId), eq(aiJobSources.sourceType, source.sourceType)))
    .limit(1)

  if (existingSource) {
    await db
      .update(aiJobSources)
      .set({
        sourceName: source.sourceName,
        sourceLocator: normalizeOptionalString(source.sourceLocator),
        isEnabled: source.isEnabled,
        priority: source.priority,
        filterConfig: normalizeOptionalString(source.filterConfig),
      })
      .where(eq(aiJobSources.id, existingSource.id))
    return
  }

  await db.insert(aiJobSources).values({
    jobId,
    sourceType: source.sourceType,
    sourceName: source.sourceName,
    sourceLocator: normalizeOptionalString(source.sourceLocator),
    isEnabled: source.isEnabled,
    priority: source.priority,
    filterConfig: normalizeOptionalString(source.filterConfig),
  })
}

async function setResearchStep(jobId: string, stepKey: string, status: 'pending' | 'in_progress' | 'completed' | 'failed', outputSnapshot?: string | null, errorMessage?: string | null) {
  const [step] = await db
    .select()
    .from(aiJobSteps)
    .where(and(eq(aiJobSteps.jobId, jobId), eq(aiJobSteps.stepKey, stepKey)))
    .limit(1)

  if (!step) {
    // Fallback: eski job'larda orchestrated_research step'i yoksa otomatik oluştur
    if (stepKey === 'orchestrated_research') {
      await db.insert(aiJobSteps).values({
        jobId,
        stepKey,
        stepLabel: 'Opus 4.6 orkestre arastirma',
        stepOrder: 3,
        status,
        outputSnapshot: normalizeOptionalString(outputSnapshot),
        errorMessage: normalizeOptionalString(errorMessage),
        startedAt: status === 'in_progress' ? new Date() : null,
        finishedAt: status === 'completed' || status === 'failed' ? new Date() : null,
      })
    }
    return
  }

  const now = new Date()
  await db
    .update(aiJobSteps)
    .set({
      status,
      outputSnapshot: normalizeOptionalString(outputSnapshot),
      errorMessage: normalizeOptionalString(errorMessage),
      startedAt: status === 'in_progress' ? step.startedAt || now : step.startedAt,
      finishedAt: status === 'completed' || status === 'failed' ? now : null,
      updatedAt: now,
    })
    .where(eq(aiJobSteps.id, step.id))
}

async function syncResearchJobState(jobId: string, status: 'draft' | 'queued' | 'in_progress' | 'review_required' | 'completed' | 'failed', currentStepKey: string | null) {
  await db
    .update(aiJobs)
    .set({
      status,
      currentStepKey,
      updatedAt: new Date(),
      startedAt: status === 'in_progress' || status === 'completed' ? new Date() : undefined,
      finishedAt: status === 'completed' || status === 'failed' ? new Date() : null,
    })
    .where(eq(aiJobs.id, jobId))
}

async function upsertResearchArtifact(jobId: string, caseId: string, artifactType: string, title: string, storagePath?: string | null, contentPreview?: string | null, sourceStepKey?: string | null) {
  const [artifact] = await db
    .select()
    .from(aiJobArtifacts)
    .where(and(eq(aiJobArtifacts.jobId, jobId), eq(aiJobArtifacts.artifactType, artifactType)))
    .limit(1)

  if (artifact) {
    await db
      .update(aiJobArtifacts)
      .set({
        title,
        storagePath: normalizeOptionalString(storagePath),
        contentPreview: normalizeOptionalString(contentPreview),
        sourceStepKey: normalizeOptionalString(sourceStepKey),
      })
      .where(eq(aiJobArtifacts.id, artifact.id))
    return
  }

  await db.insert(aiJobArtifacts).values({
    jobId,
    caseId,
    artifactType,
    title,
    storagePath: normalizeOptionalString(storagePath),
    contentPreview: normalizeOptionalString(contentPreview),
    sourceStepKey: normalizeOptionalString(sourceStepKey),
  })
}

router.get('/cases/:id/research-profile', async (req, res) => {
  const caseId = getSingleValue(req.params.id)

  if (!caseId) {
    res.status(400).json({ error: 'Gecersiz dava id.' })
    return
  }

  const ownedCase = await getOwnedCase(req.user!.userId, caseId)
  if (!ownedCase) {
    res.status(404).json({ error: 'Dava bulunamadi.' })
    return
  }

  const [profile] = await db
    .select()
    .from(caseResearchProfiles)
    .where(eq(caseResearchProfiles.caseId, caseId))
    .limit(1)

  res.json({ profile: profile || null })
})

router.put('/cases/:id/research-profile', validate(upsertCaseResearchProfileSchema), async (req, res) => {
  const caseId = getSingleValue(req.params.id)

  if (!caseId) {
    res.status(400).json({ error: 'Gecersiz dava id.' })
    return
  }

  const caseRecord = await getOwnedCaseRecord(req.user!.userId, caseId)
  if (!caseRecord) {
    res.status(404).json({ error: 'Dava bulunamadi.' })
    return
  }

  const payload = {
    researchQuestion: normalizeOptionalString(req.body.researchQuestion),
    searchKeywords: normalizeOptionalString(req.body.searchKeywords),
    useNotebooklm: !!req.body.useNotebooklm,
    notebooklmNotebook: normalizeOptionalString(req.body.notebooklmNotebook),
    notebooklmQuestion: normalizeOptionalString(req.body.notebooklmQuestion),
    useVectorDb: !!req.body.useVectorDb,
    vectorCollections: normalizeOptionalString(req.body.vectorCollections),
    vectorQuery: normalizeOptionalString(req.body.vectorQuery),
    vectorTopK: Number.isFinite(req.body.vectorTopK) ? req.body.vectorTopK : 5,
    useYargiMcp: req.body.useYargiMcp ?? true,
    yargiQuery: normalizeOptionalString(req.body.yargiQuery),
    yargiCourtTypes: normalizeOptionalString(req.body.yargiCourtTypes),
    yargiChamber: normalizeOptionalString(req.body.yargiChamber),
    yargiDateStart: normalizeDate(req.body.yargiDateStart),
    yargiDateEnd: normalizeDate(req.body.yargiDateEnd),
    yargiResultLimit: Number.isFinite(req.body.yargiResultLimit) ? req.body.yargiResultLimit : 5,
    useMevzuatMcp: req.body.useMevzuatMcp ?? true,
    mevzuatQuery: normalizeOptionalString(req.body.mevzuatQuery),
    mevzuatScope: normalizeOptionalString(req.body.mevzuatScope),
    mevzuatLawNumbers: normalizeOptionalString(req.body.mevzuatLawNumbers),
    mevzuatResultLimit: Number.isFinite(req.body.mevzuatResultLimit) ? req.body.mevzuatResultLimit : 5,
    updatedAt: new Date(),
  }

  const [existingProfile] = await db
    .select()
    .from(caseResearchProfiles)
    .where(eq(caseResearchProfiles.caseId, caseId))
    .limit(1)

  const [profile] = existingProfile
    ? await db
        .update(caseResearchProfiles)
        .set(payload)
        .where(eq(caseResearchProfiles.id, existingProfile.id))
        .returning()
    : await db
        .insert(caseResearchProfiles)
        .values({
          caseId,
          ...payload,
        })
        .returning()

  const job = await getOrCreateResearchJob(caseId, req.user!.userId)
  await upsertResearchSource(job.id, {
    sourceType: 'yargi_mcp',
    sourceName: 'Yargi MCP',
    isEnabled: profile.useYargiMcp,
    priority: 10,
    filterConfig: JSON.stringify({
      query: profile.yargiQuery,
      courtTypes: profile.yargiCourtTypes,
      chamber: profile.yargiChamber,
      dateStart: profile.yargiDateStart,
      dateEnd: profile.yargiDateEnd,
    }),
  })
  await upsertResearchSource(job.id, {
    sourceType: 'mevzuat_mcp',
    sourceName: 'Mevzuat MCP',
    isEnabled: profile.useMevzuatMcp,
    priority: 20,
    filterConfig: JSON.stringify({
      query: profile.mevzuatQuery,
      scope: profile.mevzuatScope,
      lawNumbers: profile.mevzuatLawNumbers,
    }),
  })
  await upsertResearchSource(job.id, {
    sourceType: 'notebooklm',
    sourceName: 'NotebookLM',
    sourceLocator: profile.notebooklmNotebook,
    isEnabled: profile.useNotebooklm,
    priority: 30,
    filterConfig: JSON.stringify({
      question: profile.notebooklmQuestion,
    }),
  })
  await upsertResearchSource(job.id, {
    sourceType: 'vector_db',
    sourceName: 'Vector DB',
    sourceLocator: profile.vectorCollections,
    isEnabled: profile.useVectorDb,
    priority: 40,
    filterConfig: JSON.stringify({
      query: profile.vectorQuery,
      topK: profile.vectorTopK,
    }),
  })

  res.json(profile)
})

router.post('/cases/:id/research/run', validate(runCaseResearchSchema), async (req, res) => {
  const caseId = getSingleValue(req.params.id)

  if (!caseId) {
    res.status(400).json({ error: 'Gecersiz dava id.' })
    return
  }

  const caseRecord = await getOwnedCaseRecord(req.user!.userId, caseId)
  if (!caseRecord) {
    res.status(404).json({ error: 'Dava bulunamadi.' })
    return
  }

  // Kalite gate: kritik nokta onaylandıktan sonra araştırma başlatılabilir
  // (usul raporu zorunluluğu kaldırıldı — folder_ready ve briefing_ready de kabul edilir)
  const blockedStatuses = ['not_started']
  if (blockedStatuses.includes(caseRecord.automationStatus)) {
    res.status(400).json({
      error: 'Arastirma baslatmak icin once dava klasoru olusturulmalidir.',
      currentStatus: caseRecord.automationStatus,
    })
    return
  }

  const [[profile], [intakeProfile], [briefing]] = await Promise.all([
    db.select().from(caseResearchProfiles).where(eq(caseResearchProfiles.caseId, caseId)).limit(1),
    db.select().from(caseIntakeProfiles).where(eq(caseIntakeProfiles.caseId, caseId)).limit(1),
    db.select().from(caseBriefings).where(eq(caseBriefings.caseId, caseId)).orderBy(desc(caseBriefings.createdAt)).limit(1),
  ])

  if (!profile) {
    res.status(400).json({ error: 'Once arastirma profili kaydedilmelidir.' })
    return
  }

  const researchJob = await getOrCreateResearchJob(caseId, req.user!.userId)
  const context = buildResearchQuestionContext({
    caseRecord,
    intakeProfile: intakeProfile || null,
    briefing: briefing || null,
    profile,
  })

  await syncResearchJobState(researchJob.id, 'in_progress', 'collect_sources')
  await setResearchStep(
    researchJob.id,
    'collect_sources',
    'completed',
    `Arastirma sorusu: ${buildEffectiveResearchQuestion({ caseRecord, intakeProfile: intakeProfile || null, briefing: briefing || null, profile })}`
  )
  await setResearchStep(researchJob.id, 'parallel_research', 'in_progress')

  const sourceRuns: ResearchSourceRun[] = await Promise.all([
    runYargiResearch({ profile, query: context.yargiQuery, caseType: caseRecord.caseType, customCaseType: caseRecord.customCaseType }),
    runMevzuatResearch({ profile, query: context.mevzuatQuery, caseType: caseRecord.caseType, customCaseType: caseRecord.customCaseType }),
    runNotebooklmResearch({ profile, question: context.notebookQuestion, caseType: caseRecord.caseType }),
    runVectorResearch({ profile, query: context.vectorQuery }),
  ])

  const runStatus = deriveResearchRunStatus(sourceRuns)
  const runSummary = summarizeResearchRun(sourceRuns)

  await setResearchStep(
    researchJob.id,
    'parallel_research',
    runStatus === 'failed' ? 'failed' : 'completed',
    sourceRuns.map((item) => `${item.sourceName}: ${item.summary}`).join('\n'),
    sourceRuns.filter((item) => item.status === 'failed').map((item) => item.errorMessage).filter(Boolean).join(' | ')
  )

  await setResearchStep(researchJob.id, 'research_merge', 'in_progress')
  const artifactPaths = await writeResearchArtifacts({
    caseRecord,
    profile,
    intakeProfile: intakeProfile || null,
    briefing: briefing || null,
    sourceRuns,
  })

  await upsertResearchArtifact(
    researchJob.id,
    caseId,
    'research_note_yargi',
    'Yargi notlari',
    artifactPaths.yargi_mcp,
    sourceRuns.find((item) => item.sourceType === 'yargi_mcp')?.summary,
    'parallel_research'
  )
  await upsertResearchArtifact(
    researchJob.id,
    caseId,
    'research_note_mevzuat',
    'Mevzuat notlari',
    artifactPaths.mevzuat_mcp,
    sourceRuns.find((item) => item.sourceType === 'mevzuat_mcp')?.summary,
    'parallel_research'
  )
  await upsertResearchArtifact(
    researchJob.id,
    caseId,
    'research_note_notebooklm',
    'NotebookLM notlari',
    artifactPaths.notebooklm,
    sourceRuns.find((item) => item.sourceType === 'notebooklm')?.summary,
    'parallel_research'
  )
  await upsertResearchArtifact(
    researchJob.id,
    caseId,
    'research_note_vector',
    'Vector DB notlari',
    artifactPaths.vector_db,
    sourceRuns.find((item) => item.sourceType === 'vector_db')?.summary,
    'parallel_research'
  )
  await upsertResearchArtifact(
    researchJob.id,
    caseId,
    'research_report',
    'Arastirma raporu',
    artifactPaths.research_report,
    runSummary,
    'research_merge'
  )

  await setResearchStep(researchJob.id, 'research_merge', 'completed', runSummary)
  await syncResearchJobState(
    researchJob.id,
    runStatus === 'failed' ? 'failed' : 'review_required',
    runStatus === 'failed' ? 'parallel_research' : 'research_review'
  )

  await db
    .update(caseResearchProfiles)
    .set({
      lastRunAt: new Date(),
      lastRunStatus: runStatus,
      lastRunSummary: runSummary,
      updatedAt: new Date(),
    })
    .where(eq(caseResearchProfiles.id, profile.id))

  if (runStatus === 'completed' || runStatus === 'partial') {
    await db
      .update(cases)
      .set({
        automationStatus: 'research_ready',
        updatedAt: new Date(),
      })
      .where(eq(cases.id, caseId))
  }

  // AI entegrasyon: bulgulari not olarak kaydet
  if (runSummary) {
    await saveResearchFindings({
      userId: req.user!.userId,
      caseId,
      summary: runSummary,
    }).catch(() => {})
  }

  // AI entegrasyon: basarisiz kaynaklari gorev olarak olustur
  const failedSources = sourceRuns
    .filter((r) => r.status === 'failed')
    .map((r) => r.sourceName)
  if (failedSources.length > 0) {
    await createResearchTasks({
      userId: req.user!.userId,
      caseId,
      failedSources,
    }).catch(() => {})
  }

  const [updatedProfile] = await db
    .select()
    .from(caseResearchProfiles)
    .where(eq(caseResearchProfiles.id, profile.id))
    .limit(1)

  const steps = await db
    .select()
    .from(aiJobSteps)
    .where(eq(aiJobSteps.jobId, researchJob.id))
    .orderBy(asc(aiJobSteps.stepOrder))

  res.json({
    profile: updatedProfile,
    jobId: researchJob.id,
    jobSteps: steps,
    sourceRuns: sourceRuns.map((run) => ({
      ...run,
      artifactPath:
        run.sourceType === 'yargi_mcp'
          ? artifactPaths.yargi_mcp
          : run.sourceType === 'mevzuat_mcp'
            ? artifactPaths.mevzuat_mcp
            : run.sourceType === 'notebooklm'
              ? artifactPaths.notebooklm
              : artifactPaths.vector_db,
    })),
    report: {
      storagePath: artifactPaths.research_report,
      summary: runSummary,
      status: runStatus,
    },
  })
})

// ─── POST /cases/:id/research/orchestrate ──────────────────────────────────
// Opus 4.6 ile akıllı araştırma — tool_use ile iteratif arama

router.post('/cases/:id/research/orchestrate', async (req, res) => {
  const caseId = getSingleValue(req.params.id)
  if (!caseId) { res.status(400).json({ error: 'Gecersiz dava id.' }); return }

  const { anthropicApiKey } = req.body || {}

  const caseRecord = await getOwnedCaseRecord(req.user!.userId, caseId)
  if (!caseRecord) { res.status(404).json({ error: 'Dava bulunamadi.' }); return }

  // Gate: sadece not_started durumunda blokla (usul raporu zorunluluğu kaldırıldı)
  if (caseRecord.automationStatus === 'not_started') {
    res.status(400).json({
      error: 'Arastirma baslatmak icin once dava klasoru olusturulmalidir.',
      currentStatus: caseRecord.automationStatus,
    })
    return
  }

  const [[profile], [intakeProfile], [briefing]] = await Promise.all([
    db.select().from(caseResearchProfiles).where(eq(caseResearchProfiles.caseId, caseId)).limit(1),
    db.select().from(caseIntakeProfiles).where(eq(caseIntakeProfiles.caseId, caseId)).limit(1),
    db.select().from(caseBriefings).where(eq(caseBriefings.caseId, caseId)).orderBy(desc(caseBriefings.createdAt)).limit(1),
  ])

  if (!profile) {
    res.status(400).json({ error: 'Once arastirma profili kaydedilmelidir.' })
    return
  }

  const researchJob = await getOrCreateResearchJob(caseId, req.user!.userId)

  await syncResearchJobState(researchJob.id, 'in_progress', 'orchestrated_research')
  await setResearchStep(researchJob.id, 'orchestrated_research', 'in_progress', 'Opus 4.6 ile arastirma baslatildi')

  try {
    const { runOrchestratedResearch } = await import('../utils/researchOrchestrator.js')

    const criticalPoint = buildEffectiveResearchQuestion({
      caseRecord,
      intakeProfile: intakeProfile || null,
      briefing: briefing || null,
      profile,
    })

    const result = await runOrchestratedResearch({
      caseTitle: caseRecord.title,
      caseType: caseRecord.caseType,
      customCaseType: caseRecord.customCaseType,
      caseDescription: caseRecord.description,
      criticalPoint,
      briefingSummary: briefing?.summary,
      mainLegalAxis: intakeProfile?.mainLegalAxis,
      searchKeywords: profile.searchKeywords,
      toneStrategy: briefing?.toneStrategy,
      secondaryRisks: intakeProfile?.secondaryRisks,
      proofRisks: intakeProfile?.proofRisks,
      anthropicApiKey,
    })

    // Raporu dosyaya yaz
    const fs = await import('fs/promises')
    const path = await import('path')

    // researchPath yoksa otomatik oluştur
    let effectiveResearchPath = caseRecord.researchPath
    if (!effectiveResearchPath) {
      const baseDir = path.join(process.cwd(), 'data', 'research', caseId)
      effectiveResearchPath = path.join(baseDir, 'arastirma-raporu.md')
      await db
        .update(cases)
        .set({ researchPath: effectiveResearchPath })
        .where(eq(cases.id, caseId))
    }

    const researchDir = path.dirname(effectiveResearchPath)
    await fs.mkdir(researchDir, { recursive: true })
    await fs.writeFile(effectiveResearchPath, result.researchMarkdown, 'utf8')

    // Orkestratör raporunu ayrı dosyaya da kaydet
    const orchestratedPath = path.join(researchDir, 'orchestrated-arastirma.md')
    await fs.writeFile(orchestratedPath, result.researchMarkdown, 'utf8')

    // Artifact kaydet
    await upsertResearchArtifact(
      researchJob.id,
      caseId,
      'research_report',
      'Orkestre Arastirma Raporu (Opus 4.6)',
      effectiveResearchPath,
      `${result.decisionsFound} karar, ${result.legislationFound} mevzuat, ${result.toolCallCount} tool cagri`,
      'orchestrated_research'
    )

    const summary = `Opus 4.6 ile arastirma tamamlandi: ${result.decisionsFound} karar, ${result.legislationFound} mevzuat bulundu. ${result.toolCallCount} tool cagrisi yapildi. Token: ${result.tokensUsed.input + result.tokensUsed.output}`

    await setResearchStep(researchJob.id, 'orchestrated_research', 'completed', summary)
    await syncResearchJobState(researchJob.id, 'review_required', 'research_review')

    await db
      .update(caseResearchProfiles)
      .set({
        lastRunAt: new Date(),
        lastRunStatus: 'completed',
        lastRunSummary: summary,
        updatedAt: new Date(),
      })
      .where(eq(caseResearchProfiles.id, profile.id))

    await db
      .update(cases)
      .set({ automationStatus: 'research_ready', updatedAt: new Date() })
      .where(eq(cases.id, caseId))

    res.json({
      jobId: researchJob.id,
      summary,
      toolCallCount: result.toolCallCount,
      tokensUsed: result.tokensUsed,
      decisionsFound: result.decisionsFound,
      legislationFound: result.legislationFound,
      reportPath: effectiveResearchPath,
      reportContent: result.researchMarkdown,
      report: {
        summary,
        status: 'completed',
        storagePath: effectiveResearchPath,
      },
    })
  } catch (error: any) {
    await setResearchStep(
      researchJob.id,
      'orchestrated_research',
      'failed',
      null,
      error?.message || 'Bilinmeyen hata'
    )
    await syncResearchJobState(researchJob.id, 'failed', 'orchestrated_research')

    res.status(500).json({
      error: 'Orkestre arastirma basarisiz.',
      detail: error?.message || 'Bilinmeyen hata',
    })
  }
})

// ─── GET /cases/:id/research/qc ─────────────────────────────────────────────

router.get('/cases/:id/research/qc', async (req, res) => {
  const caseId = getSingleValue(req.params.id)
  if (!caseId) { res.status(400).json({ error: 'Gecersiz dava id.' }); return }

  const caseRecord = await getOwnedCaseRecord(req.user!.userId, caseId)
  if (!caseRecord) { res.status(404).json({ error: 'Dava bulunamadi.' }); return }

  // Get research job
  const [job] = await db
    .select()
    .from(aiJobs)
    .where(and(eq(aiJobs.caseId, caseId), eq(aiJobs.jobType, 'research')))
    .orderBy(desc(aiJobs.createdAt))
    .limit(1)

  if (!job) {
    res.json({ qc: null, artifacts: [], reviews: [], steps: [] })
    return
  }

  const [artifacts, reviews, steps] = await Promise.all([
    db.select().from(aiJobArtifacts).where(eq(aiJobArtifacts.jobId, job.id)),
    db.select().from(aiJobReviews).where(eq(aiJobReviews.jobId, job.id)),
    db.select().from(aiJobSteps).where(eq(aiJobSteps.jobId, job.id)).orderBy(asc(aiJobSteps.stepOrder)),
  ])

  // Get research_review step for overall QC status
  const reviewStep = steps.find((s) => s.stepKey === 'research_review')

  res.json({
    qc: {
      jobId: job.id,
      jobStatus: job.status,
      reviewStepStatus: reviewStep?.status || 'pending',
    },
    artifacts: artifacts.map((a) => ({
      ...a,
      // Parse metadata for argument selection state
      parsedMetadata: a.metadata ? (() => { try { return JSON.parse(a.metadata) } catch { return null } })() : null,
    })),
    reviews,
    steps,
  })
})

// ─── POST /cases/:id/research/review ────────────────────────────────────────

router.post('/cases/:id/research/review', validate(reviewCaseResearchSchema), async (req, res) => {
  const caseId = getSingleValue(req.params.id)
  if (!caseId) { res.status(400).json({ error: 'Gecersiz dava id.' }); return }

  const userId = req.user!.userId
  const caseRecord = await getOwnedCaseRecord(userId, caseId)
  if (!caseRecord) { res.status(404).json({ error: 'Dava bulunamadi.' }); return }

  const { approved, reviewNotes } = req.body as { approved: boolean; reviewNotes?: string }

  // Find the research job
  const [job] = await db
    .select()
    .from(aiJobs)
    .where(and(eq(aiJobs.caseId, caseId), eq(aiJobs.jobType, 'research')))
    .orderBy(desc(aiJobs.createdAt))
    .limit(1)

  if (!job) {
    res.status(400).json({ error: 'Incelenecek arastirma isi bulunamadi.' })
    return
  }

  if (job.status !== 'review_required' && job.status !== 'completed') {
    res.status(400).json({ error: 'Arastirma henuz inceleme asamasina gelmedi.', currentStatus: job.status })
    return
  }

  // Find the research report artifact for the review record
  const [reportArtifact] = await db
    .select()
    .from(aiJobArtifacts)
    .where(and(eq(aiJobArtifacts.jobId, job.id), eq(aiJobArtifacts.artifactType, 'research_report')))
    .limit(1)

  const now = new Date()

  // Create the review record
  await db.insert(aiJobReviews).values({
    jobId: job.id,
    artifactId: reportArtifact?.id || null,
    reviewType: 'research_qc',
    status: approved ? 'approved' : 'changes_requested',
    reviewNotes: reviewNotes?.trim() || null,
    reviewedBy: userId,
    reviewedAt: now,
  })

  // Update the research_review step
  await setResearchStep(
    job.id,
    'research_review',
    approved ? 'completed' : 'failed',
    approved ? 'Arastirma kalite kontrolu onaylandi.' : `Reddedildi: ${reviewNotes || '-'}`,
  )

  if (approved) {
    // Mark job as completed
    await syncResearchJobState(job.id, 'completed', null)

    // Update automation status to draft_ready — dilekce hatti artik baslatilabilir
    await db
      .update(cases)
      .set({
        automationStatus: 'draft_ready',
        updatedAt: now,
      })
      .where(eq(cases.id, caseId))

    // Araştırma onaylandıktan sonra otomatik usul raporu üret (arka planda)
    if (hasProcedureAiConfig()) {
      triggerAutoProcedureReport(caseId, caseRecord).catch((err) => {
        console.error(`[research] Otomatik usul raporu basarisiz (caseId=${caseId}):`, err.message)
      })
    }

    res.json({ message: 'Arastirma kalite kontrolu onaylandi. Usul raporu otomatik olusturuluyor.', approved: true })
  } else {
    // Keep job in review_required state so user can re-run or fix
    await syncResearchJobState(job.id, 'review_required', 'research_review')

    res.json({ message: 'Arastirma kalite kontrolu reddedildi.', approved: false })
  }
})

// ─── Auto Procedure Report (araştırma onayı sonrası) ────────────────────────

async function triggerAutoProcedureReport(caseId: string, caseRecord: any) {
  // Mevcut rapor var mı kontrol et
  const [existing] = await db
    .select()
    .from(caseProcedureReports)
    .where(eq(caseProcedureReports.caseId, caseId))
    .limit(1)

  // Zaten tamamlanmış rapor varsa tekrar üretme
  if (existing && existing.reportMarkdown && existing.status !== 'precheck_done') {
    console.log(`[research] Usul raporu zaten mevcut (caseId=${caseId}), atlaniyor.`)
    return
  }

  // Procedure report yoksa oluştur
  let report = existing
  if (!report) {
    const [created] = await db
      .insert(caseProcedureReports)
      .values({ caseId, status: 'not_started' })
      .returning()
    report = created
  }

  // Intake ve briefing bilgilerini al
  const [intake] = await db
    .select()
    .from(caseIntakeProfiles)
    .where(eq(caseIntakeProfiles.caseId, caseId))
    .limit(1)

  const [briefing] = await db
    .select()
    .from(caseBriefings)
    .where(eq(caseBriefings.caseId, caseId))
    .limit(1)

  // 1. Precheck üret
  console.log(`[research] Otomatik precheck baslatiliyor (caseId=${caseId})`)
  const precheck = await generatePrecheckWithAi({
    caseTitle: caseRecord.title,
    caseType: caseRecord.caseType,
    caseDescription: caseRecord.description,
    courtName: caseRecord.courtName,
    criticalPointSummary: intake?.criticalPointSummary,
    mainLegalAxis: intake?.mainLegalAxis,
  })

  await db
    .update(caseProcedureReports)
    .set({
      status: 'precheck_done',
      precheckNotes: precheck.precheckNotes,
      courtType: precheck.courtType,
      jurisdiction: precheck.jurisdiction,
      arbitrationRequired: precheck.arbitrationRequired,
      statuteOfLimitations: precheck.statuteOfLimitations,
      updatedAt: new Date(),
    })
    .where(eq(caseProcedureReports.id, report.id))

  // 2. Rapor üret
  console.log(`[research] Otomatik usul raporu uretiliyor (caseId=${caseId})`)
  await db
    .update(caseProcedureReports)
    .set({ status: 'generating', updatedAt: new Date() })
    .where(eq(caseProcedureReports.id, report.id))

  const reportMarkdown = await generateProcedureReportWithAi({
    caseTitle: caseRecord.title,
    caseType: caseRecord.caseType,
    caseDescription: caseRecord.description,
    courtName: caseRecord.courtName,
    criticalPointSummary: intake?.criticalPointSummary,
    mainLegalAxis: intake?.mainLegalAxis,
    lawyerDirection: intake?.lawyerDirection,
    briefingSummary: briefing?.summary,
    precheckNotes: precheck.precheckNotes,
    courtType: precheck.courtType,
    jurisdiction: precheck.jurisdiction,
    arbitrationRequired: precheck.arbitrationRequired,
    statuteOfLimitations: precheck.statuteOfLimitations,
  })

  await db
    .update(caseProcedureReports)
    .set({
      reportMarkdown,
      status: 'draft',
      updatedAt: new Date(),
    })
    .where(eq(caseProcedureReports.id, report.id))

  // Google Drive'a kaydet
  if (caseRecord.automationCaseCode) {
    saveArtifactToDrive(caseRecord.automationCaseCode, 'procedure', reportMarkdown).catch(() => {})
  }

  console.log(`[research] Otomatik usul raporu tamamlandi (caseId=${caseId})`)
}

// ─── PUT /cases/:id/research/arguments ──────────────────────────────────────

router.put('/cases/:id/research/arguments', validate(batchUpdateResearchArgumentsSchema), async (req, res) => {
  const caseId = getSingleValue(req.params.id)
  if (!caseId) { res.status(400).json({ error: 'Gecersiz dava id.' }); return }

  const caseRecord = await getOwnedCaseRecord(req.user!.userId, caseId)
  if (!caseRecord) { res.status(404).json({ error: 'Dava bulunamadi.' }); return }

  const { updates } = req.body as {
    updates: Array<{ artifactId: string; argumentIndex: number; selected: boolean }>
  }

  // Group updates by artifactId for efficient batch processing
  const groupedByArtifact = new Map<string, Array<{ argumentIndex: number; selected: boolean }>>()
  for (const update of updates) {
    const existing = groupedByArtifact.get(update.artifactId) || []
    existing.push({ argumentIndex: update.argumentIndex, selected: update.selected })
    groupedByArtifact.set(update.artifactId, existing)
  }

  for (const [artifactId, argumentUpdates] of groupedByArtifact) {
    // Verify artifact belongs to this case
    const [artifact] = await db
      .select()
      .from(aiJobArtifacts)
      .where(and(eq(aiJobArtifacts.id, artifactId), eq(aiJobArtifacts.caseId, caseId)))
      .limit(1)

    if (!artifact) continue

    // Parse existing metadata or initialize
    let metadata: Record<string, unknown> = {}
    if (artifact.metadata) {
      try { metadata = JSON.parse(artifact.metadata) } catch { /* ignore */ }
    }

    // Update argument selections in metadata
    const argumentSelections: Record<number, boolean> = (metadata.argumentSelections as Record<number, boolean>) || {}
    for (const { argumentIndex, selected } of argumentUpdates) {
      argumentSelections[argumentIndex] = selected
    }
    metadata.argumentSelections = argumentSelections

    await db
      .update(aiJobArtifacts)
      .set({ metadata: JSON.stringify(metadata) })
      .where(eq(aiJobArtifacts.id, artifactId))
  }

  res.json({ message: 'Arguman secimleri guncellendi.', updatedCount: updates.length })
})

export default router

import { Router } from 'express'
import { and, asc, desc, eq, inArray } from 'drizzle-orm'
import {
  createAiJobSchema,
  reviewAiJobSchema,
  runAiJobStepSchema,
  type AiJobStatus,
} from '@hukuk-takip/shared'
import { db } from '../db/index.js'
import {
  aiJobArtifacts,
  aiJobReviews,
  aiJobs,
  aiJobSources,
  aiJobSteps,
  cases,
} from '../db/schema.js'
import { authenticate } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { getOwnedCase } from '../utils/ownership.js'
import { getSingleValue } from '../utils/request.js'

const router = Router()
router.use(authenticate)

type JobSeed = {
  stepKey: string
  stepLabel: string
}

const jobStepSeeds: Record<string, JobSeed[]> = {
  intake: [
    { stepKey: 'collect_inputs', stepLabel: 'Girdileri topla' },
    { stepKey: 'extract_facts', stepLabel: 'Belge ve notlardan olgulari cikar' },
    { stepKey: 'critical_point', stepLabel: 'Hukuki kritik nokta sentezi' },
    { stepKey: 'lawyer_approval', stepLabel: 'Avukat onayi' },
  ],
  briefing: [
    { stepKey: 'draft_briefing', stepLabel: 'Briefing taslagini hazirla' },
    { stepKey: 'briefing_review', stepLabel: 'Briefing review' },
    { stepKey: 'briefing_approved', stepLabel: 'Briefing onayi' },
  ],
  procedure: [
    { stepKey: 'procedure_precheck', stepLabel: 'Usul pre-check' },
    { stepKey: 'procedure_report', stepLabel: 'Usul raporu' },
    { stepKey: 'procedure_review', stepLabel: 'Usul kalite kontrolu' },
  ],
  research: [
    { stepKey: 'collect_sources', stepLabel: 'Kaynak secimini kilitle' },
    { stepKey: 'parallel_research', stepLabel: 'Paralel arastirmayi calistir' },
    { stepKey: 'research_merge', stepLabel: 'Arastirma bulgularini birlestir' },
    { stepKey: 'research_review', stepLabel: 'Arastirma kalite kontrolu' },
  ],
  pleading: [
    { stepKey: 'draft_v1', stepLabel: 'Dilekce v1 taslagi' },
    { stepKey: 'defense_simulation', stepLabel: 'Karsi taraf savunma simulasyonu' },
    { stepKey: 'draft_v2', stepLabel: 'Dilekce v2 taslagi' },
    { stepKey: 'final_review', stepLabel: 'Son avukat review' },
  ],
  udf: [
    { stepKey: 'prepare_final_text', stepLabel: 'Final metni hazirla' },
    { stepKey: 'generate_udf', stepLabel: 'UDF uret' },
    { stepKey: 'export_package', stepLabel: 'Cikti paketini hazirla' },
  ],
}

const defaultJobTitles: Record<string, string> = {
  intake: 'Kritik nokta ve intake sureci',
  briefing: 'Briefing hazirlama',
  procedure: 'Usul raporu',
  research: 'Arastirma hatti',
  pleading: 'Dilekce hatti',
  udf: 'UDF cikti hatti',
}

function normalizeOptionalString(value?: string | null) {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

function deriveJobState(
  steps: Array<{ stepKey: string; status: string; stepOrder: number }>
): { status: AiJobStatus; currentStepKey: string | null } {
  const sortedSteps = [...steps].sort((a, b) => a.stepOrder - b.stepOrder)

  const failedStep = sortedSteps.find((step) => step.status === 'failed')
  if (failedStep) {
    return { status: 'failed', currentStepKey: failedStep.stepKey }
  }

  const blockedStep = sortedSteps.find((step) => step.status === 'blocked')
  if (blockedStep) {
    return { status: 'review_required', currentStepKey: blockedStep.stepKey }
  }

  const activeStep = sortedSteps.find((step) => step.status === 'in_progress')
  if (activeStep) {
    return { status: 'in_progress', currentStepKey: activeStep.stepKey }
  }

  if (sortedSteps.length > 0 && sortedSteps.every((step) => step.status === 'completed')) {
    return { status: 'completed', currentStepKey: null }
  }

  const nextPendingStep = sortedSteps.find((step) => step.status === 'pending')
  if (nextPendingStep) {
    const hasCompletedStep = sortedSteps.some((step) => step.status === 'completed')
    return {
      status: hasCompletedStep ? 'queued' : 'draft',
      currentStepKey: nextPendingStep.stepKey,
    }
  }

  return { status: 'draft', currentStepKey: sortedSteps[0]?.stepKey ?? null }
}

function buildSeedArtifacts(caseRecord: typeof cases.$inferSelect, jobType: string) {
  const artifacts: Array<{
    artifactType: string
    title: string
    storagePath: string | null
    contentPreview: string | null
    sourceStepKey: string | null
  }> = []

  if (jobType === 'briefing' && caseRecord.briefingPath) {
    artifacts.push({
      artifactType: 'briefing',
      title: 'Briefing dosyasi',
      storagePath: caseRecord.briefingPath,
      contentPreview: 'Workspace briefing dosyasi',
      sourceStepKey: 'draft_briefing',
    })
  }

  if (jobType === 'procedure' && caseRecord.procedurePath) {
    artifacts.push({
      artifactType: 'procedure_report',
      title: 'Usul raporu',
      storagePath: caseRecord.procedurePath,
      contentPreview: 'Workspace usul raporu dosyasi',
      sourceStepKey: 'procedure_report',
    })
  }

  if (jobType === 'research' && caseRecord.researchPath) {
    artifacts.push({
      artifactType: 'research_report',
      title: 'Arastirma raporu',
      storagePath: caseRecord.researchPath,
      contentPreview: 'Workspace arastirma raporu dosyasi',
      sourceStepKey: 'research_merge',
    })
  }

  if (jobType === 'pleading') {
    if (caseRecord.defenseSimulationPath) {
      artifacts.push({
        artifactType: 'defense_simulation',
        title: 'Savunma simulasyonu',
        storagePath: caseRecord.defenseSimulationPath,
        contentPreview: 'Workspace savunma simulasyonu dosyasi',
        sourceStepKey: 'defense_simulation',
      })
    }

    if (caseRecord.pleadingMdPath) {
      artifacts.push({
        artifactType: 'pleading_markdown',
        title: 'Dilekce markdown taslagi',
        storagePath: caseRecord.pleadingMdPath,
        contentPreview: 'Workspace dilekce markdown dosyasi',
        sourceStepKey: 'draft_v2',
      })
    }
  }

  if (jobType === 'udf' && caseRecord.pleadingUdfPath) {
    artifacts.push({
      artifactType: 'udf_output',
      title: 'UDF cikti dosyasi',
      storagePath: caseRecord.pleadingUdfPath,
      contentPreview: 'Workspace UDF cikti dosyasi',
      sourceStepKey: 'generate_udf',
    })
  }

  return artifacts
}

function buildSeedSources(caseRecord: typeof cases.$inferSelect, jobType: string) {
  if (jobType === 'research') {
    return [
      {
        sourceType: 'vector_db',
        sourceName: 'Vector DB',
        sourceLocator: null,
        isEnabled: true,
        priority: 10,
        filterConfig: null,
      },
      {
        sourceType: 'yargi_mcp',
        sourceName: 'Yargi MCP',
        sourceLocator: null,
        isEnabled: true,
        priority: 20,
        filterConfig: null,
      },
      {
        sourceType: 'mevzuat_mcp',
        sourceName: 'Mevzuat MCP',
        sourceLocator: null,
        isEnabled: true,
        priority: 30,
        filterConfig: null,
      },
      {
        sourceType: 'notebooklm',
        sourceName: 'NotebookLM',
        sourceLocator: null,
        isEnabled: false,
        priority: 40,
        filterConfig: null,
      },
      {
        sourceType: 'internal_workspace',
        sourceName: 'Dava Workspace',
        sourceLocator: caseRecord.driveFolderPath || null,
        isEnabled: !!caseRecord.driveFolderPath,
        priority: 50,
        filterConfig: null,
      },
    ]
  }

  if (jobType === 'procedure') {
    return [
      {
        sourceType: 'mevzuat_mcp',
        sourceName: 'Mevzuat MCP',
        sourceLocator: null,
        isEnabled: true,
        priority: 10,
        filterConfig: null,
      },
      {
        sourceType: 'internal_workspace',
        sourceName: 'Dava Workspace',
        sourceLocator: caseRecord.driveFolderPath || null,
        isEnabled: !!caseRecord.driveFolderPath,
        priority: 20,
        filterConfig: null,
      },
    ]
  }

  if (jobType === 'briefing' || jobType === 'pleading' || jobType === 'udf') {
    return [
      {
        sourceType: 'internal_workspace',
        sourceName: 'Dava Workspace',
        sourceLocator: caseRecord.driveFolderPath || null,
        isEnabled: !!caseRecord.driveFolderPath,
        priority: 10,
        filterConfig: null,
      },
    ]
  }

  return []
}

async function getOwnedAiJob(userId: string, jobId: string) {
  const [job] = await db
    .select({
      id: aiJobs.id,
      caseId: aiJobs.caseId,
    })
    .from(aiJobs)
    .innerJoin(cases, eq(aiJobs.caseId, cases.id))
    .where(and(eq(aiJobs.id, jobId), eq(cases.userId, userId)))
    .limit(1)

  return job ?? null
}

async function getAiJobBundles(jobIds: string[]) {
  if (jobIds.length === 0) {
    return {
      stepsByJobId: new Map<string, any[]>(),
      artifactsByJobId: new Map<string, any[]>(),
      reviewsByJobId: new Map<string, any[]>(),
      sourcesByJobId: new Map<string, any[]>(),
    }
  }

  const [steps, artifacts, reviews, sources] = await Promise.all([
    db
      .select()
      .from(aiJobSteps)
      .where(inArray(aiJobSteps.jobId, jobIds))
      .orderBy(asc(aiJobSteps.stepOrder), asc(aiJobSteps.createdAt)),
    db
      .select()
      .from(aiJobArtifacts)
      .where(inArray(aiJobArtifacts.jobId, jobIds))
      .orderBy(desc(aiJobArtifacts.createdAt)),
    db
      .select()
      .from(aiJobReviews)
      .where(inArray(aiJobReviews.jobId, jobIds))
      .orderBy(desc(aiJobReviews.createdAt)),
    db
      .select()
      .from(aiJobSources)
      .where(inArray(aiJobSources.jobId, jobIds))
      .orderBy(asc(aiJobSources.priority), asc(aiJobSources.createdAt)),
  ])

  const stepsByJobId = new Map<string, any[]>()
  const artifactsByJobId = new Map<string, any[]>()
  const reviewsByJobId = new Map<string, any[]>()
  const sourcesByJobId = new Map<string, any[]>()

  for (const step of steps) {
    const existing = stepsByJobId.get(step.jobId) || []
    existing.push(step)
    stepsByJobId.set(step.jobId, existing)
  }

  for (const artifact of artifacts) {
    const existing = artifactsByJobId.get(artifact.jobId) || []
    existing.push(artifact)
    artifactsByJobId.set(artifact.jobId, existing)
  }

  for (const review of reviews) {
    const existing = reviewsByJobId.get(review.jobId) || []
    existing.push(review)
    reviewsByJobId.set(review.jobId, existing)
  }

  for (const source of sources) {
    const existing = sourcesByJobId.get(source.jobId) || []
    existing.push(source)
    sourcesByJobId.set(source.jobId, existing)
  }

  return { stepsByJobId, artifactsByJobId, reviewsByJobId, sourcesByJobId }
}

async function buildJobResponse(jobRows: Array<typeof aiJobs.$inferSelect>) {
  const jobIds = jobRows.map((job) => job.id)
  const { stepsByJobId, artifactsByJobId, reviewsByJobId, sourcesByJobId } =
    await getAiJobBundles(jobIds)

  return jobRows.map((job) => ({
    ...job,
    steps: stepsByJobId.get(job.id) || [],
    artifacts: artifactsByJobId.get(job.id) || [],
    reviews: reviewsByJobId.get(job.id) || [],
    sources: sourcesByJobId.get(job.id) || [],
  }))
}

router.get('/cases/:id/ai-jobs', async (req, res) => {
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

  const jobs = await db
    .select()
    .from(aiJobs)
    .where(eq(aiJobs.caseId, caseId))
    .orderBy(desc(aiJobs.createdAt))

  const hydratedJobs = await buildJobResponse(jobs)

  res.json({ jobs: hydratedJobs })
})

router.post('/cases/:id/ai-jobs', validate(createAiJobSchema), async (req, res) => {
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

  const [caseRecord] = await db.select().from(cases).where(eq(cases.id, caseId)).limit(1)

  if (!caseRecord) {
    res.status(404).json({ error: 'Dava bulunamadi.' })
    return
  }

  const title = normalizeOptionalString(req.body.title) || defaultJobTitles[req.body.jobType]
  const seededSteps = jobStepSeeds[req.body.jobType] || []

  const [job] = await db
    .insert(aiJobs)
    .values({
      caseId,
      createdBy: req.user!.userId,
      jobType: req.body.jobType,
      title,
      status: 'draft',
      currentStepKey: seededSteps[0]?.stepKey || null,
    })
    .returning()

  if (seededSteps.length > 0) {
    await db.insert(aiJobSteps).values(
      seededSteps.map((step, index) => ({
        jobId: job.id,
        stepKey: step.stepKey,
        stepLabel: step.stepLabel,
        stepOrder: index + 1,
      }))
    )
  }

  const seededArtifacts = buildSeedArtifacts(caseRecord, req.body.jobType)
  if (seededArtifacts.length > 0) {
    await db.insert(aiJobArtifacts).values(
      seededArtifacts.map((artifact, index) => ({
        jobId: job.id,
        caseId,
        artifactType: artifact.artifactType,
        title: artifact.title,
        storagePath: artifact.storagePath,
        contentPreview: artifact.contentPreview,
        versionNo: index + 1,
        sourceStepKey: artifact.sourceStepKey,
      }))
    )
  }

  const seededSources = buildSeedSources(caseRecord, req.body.jobType)
  if (seededSources.length > 0) {
    await db.insert(aiJobSources).values(
      seededSources.map((source) => ({
        jobId: job.id,
        sourceType: source.sourceType,
        sourceName: source.sourceName,
        sourceLocator: source.sourceLocator,
        isEnabled: source.isEnabled,
        priority: source.priority,
        filterConfig: source.filterConfig,
      }))
    )
  }

  const [hydratedJob] = await buildJobResponse([job])

  res.status(201).json(hydratedJob)
})

router.get('/ai-jobs/:id', async (req, res) => {
  const jobId = getSingleValue(req.params.id)

  if (!jobId) {
    res.status(400).json({ error: 'Gecersiz AI job id.' })
    return
  }

  const ownedJob = await getOwnedAiJob(req.user!.userId, jobId)
  if (!ownedJob) {
    res.status(404).json({ error: 'AI job bulunamadi.' })
    return
  }

  const [job] = await db.select().from(aiJobs).where(eq(aiJobs.id, jobId)).limit(1)

  if (!job) {
    res.status(404).json({ error: 'AI job bulunamadi.' })
    return
  }

  const [hydratedJob] = await buildJobResponse([job])
  res.json(hydratedJob)
})

router.post('/ai-jobs/:id/run-step', validate(runAiJobStepSchema), async (req, res) => {
  const jobId = getSingleValue(req.params.id)

  if (!jobId) {
    res.status(400).json({ error: 'Gecersiz AI job id.' })
    return
  }

  const ownedJob = await getOwnedAiJob(req.user!.userId, jobId)
  if (!ownedJob) {
    res.status(404).json({ error: 'AI job bulunamadi.' })
    return
  }

  const [existingStep] = await db
    .select()
    .from(aiJobSteps)
    .where(and(eq(aiJobSteps.jobId, jobId), eq(aiJobSteps.stepKey, req.body.stepKey)))
    .limit(1)

  if (!existingStep) {
    res.status(404).json({ error: 'AI job adimi bulunamadi.' })
    return
  }

  const now = new Date()

  await db
    .update(aiJobSteps)
    .set({
      status: req.body.status,
      inputSnapshot: normalizeOptionalString(req.body.inputSnapshot),
      outputSnapshot: normalizeOptionalString(req.body.outputSnapshot),
      errorMessage: normalizeOptionalString(req.body.errorMessage),
      startedAt:
        req.body.status === 'in_progress'
          ? existingStep.startedAt || now
          : existingStep.startedAt,
      finishedAt:
        req.body.status === 'completed' || req.body.status === 'failed' ? now : null,
      updatedAt: now,
    })
    .where(eq(aiJobSteps.id, existingStep.id))

  const steps = await db
    .select({
      stepKey: aiJobSteps.stepKey,
      status: aiJobSteps.status,
      stepOrder: aiJobSteps.stepOrder,
    })
    .from(aiJobSteps)
    .where(eq(aiJobSteps.jobId, jobId))
    .orderBy(asc(aiJobSteps.stepOrder))

  const derivedState = deriveJobState(steps)

  const [existingJob] = await db.select().from(aiJobs).where(eq(aiJobs.id, jobId)).limit(1)

  if (!existingJob) {
    res.status(404).json({ error: 'AI job bulunamadi.' })
    return
  }

  await db
    .update(aiJobs)
    .set({
      status: derivedState.status,
      currentStepKey: derivedState.currentStepKey,
      startedAt:
        derivedState.status === 'in_progress' || derivedState.status === 'completed'
          ? existingJob.startedAt || now
          : existingJob.startedAt,
      finishedAt: derivedState.status === 'completed' ? now : null,
      updatedAt: now,
    })
    .where(eq(aiJobs.id, jobId))

  const [updatedJob] = await db.select().from(aiJobs).where(eq(aiJobs.id, jobId)).limit(1)
  const [hydratedJob] = await buildJobResponse(updatedJob ? [updatedJob] : [])

  res.json(hydratedJob)
})

router.post('/ai-jobs/:id/review', validate(reviewAiJobSchema), async (req, res) => {
  const jobId = getSingleValue(req.params.id)

  if (!jobId) {
    res.status(400).json({ error: 'Gecersiz AI job id.' })
    return
  }

  const ownedJob = await getOwnedAiJob(req.user!.userId, jobId)
  if (!ownedJob) {
    res.status(404).json({ error: 'AI job bulunamadi.' })
    return
  }

  if (req.body.artifactId) {
    const [artifact] = await db
      .select({ id: aiJobArtifacts.id })
      .from(aiJobArtifacts)
      .where(and(eq(aiJobArtifacts.id, req.body.artifactId), eq(aiJobArtifacts.jobId, jobId)))
      .limit(1)

    if (!artifact) {
      res.status(404).json({ error: 'Artifact bulunamadi.' })
      return
    }
  }

  const [review] = await db
    .insert(aiJobReviews)
    .values({
      jobId,
      artifactId: normalizeOptionalString(req.body.artifactId),
      reviewType: req.body.reviewType,
      status: req.body.status,
      reviewNotes: normalizeOptionalString(req.body.reviewNotes),
      reviewedBy: req.user!.userId,
      reviewedAt: new Date(),
    })
    .returning()

  if (req.body.status === 'changes_requested') {
    await db
      .update(aiJobs)
      .set({
        status: 'review_required',
        updatedAt: new Date(),
      })
      .where(eq(aiJobs.id, jobId))
  }

  res.status(201).json(review)
})

export default router

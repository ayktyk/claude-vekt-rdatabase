import { execFile } from 'node:child_process'
import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { Router } from 'express'
import { and, desc, eq } from 'drizzle-orm'
import {
  generatePleadingSchema,
  reviewPleadingSchema,
  updatePleadingDraftSchema,
} from '@hukuk-takip/shared'
import { db } from '../db/index.js'
import {
  aiJobArtifacts,
  aiJobReviews,
  aiJobs,
  aiJobSteps,
  caseBriefings,
  caseIntakeProfiles,
  caseProcedureReports,
  caseResearchProfiles,
  cases,
} from '../db/schema.js'
import { authenticate } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { generatePleadingWithAi, hasPleadingAiConfig } from '../utils/pleadingAi.js'
import {
  generatePleadingV2WithAi,
  generateRevisionReportWithAi,
  hasRevisionAiConfig,
} from '../utils/revisionAi.js'
import { notifyPleadingReady } from '../utils/aiIntegration.js'
import { getSingleValue } from '../utils/request.js'

const router = Router()
router.use(authenticate)

// ─── Helpers ────────────────────────────────────────────────────────────────

async function getOwnedCaseRecord(userId: string, caseId: string) {
  const [caseRecord] = await db
    .select()
    .from(cases)
    .where(and(eq(cases.id, caseId), eq(cases.userId, userId)))
    .limit(1)

  return caseRecord ?? null
}

async function getOrCreatePleadingJob(caseId: string, userId: string) {
  const [existingJob] = await db
    .select()
    .from(aiJobs)
    .where(and(eq(aiJobs.caseId, caseId), eq(aiJobs.jobType, 'pleading')))
    .orderBy(desc(aiJobs.createdAt))
    .limit(1)

  if (existingJob) return existingJob

  const [job] = await db
    .insert(aiJobs)
    .values({
      caseId,
      createdBy: userId,
      jobType: 'pleading',
      title: 'Dilekce taslagi',
      status: 'draft',
      currentStepKey: 'generate_v1',
    })
    .returning()

  await db.insert(aiJobSteps).values([
    {
      jobId: job.id,
      stepKey: 'generate_v1',
      stepLabel: 'Dilekce v1 taslagi uret',
      stepOrder: 1,
      status: 'pending',
    },
    {
      jobId: job.id,
      stepKey: 'review_v1',
      stepLabel: 'Dilekce v1 inceleme',
      stepOrder: 2,
      status: 'pending',
    },
  ])

  return job
}

// ─── GET /pleading/:caseId ──────────────────────────────────────────────────

router.get('/pleading/:caseId', async (req, res, next) => {
  try {
    const userId = req.user!.userId
    const caseId = getSingleValue(req.params.caseId)
    if (!caseId) {
      res.status(400).json({ error: 'Gecersiz dava id.' })
      return
    }

    const caseRecord = await getOwnedCaseRecord(userId, caseId)
    if (!caseRecord) {
      res.status(404).json({ error: 'Dava bulunamadi.' })
      return
    }

    // Get pleading job with its artifacts and reviews
    const [job] = await db
      .select()
      .from(aiJobs)
      .where(and(eq(aiJobs.caseId, caseId), eq(aiJobs.jobType, 'pleading')))
      .orderBy(desc(aiJobs.createdAt))
      .limit(1)

    if (!job) {
      res.json({ pleading: null })
      return
    }

    const [artifacts, steps, reviews] = await Promise.all([
      db
        .select()
        .from(aiJobArtifacts)
        .where(and(eq(aiJobArtifacts.jobId, job.id), eq(aiJobArtifacts.artifactType, 'pleading_v1')))
        .orderBy(desc(aiJobArtifacts.createdAt))
        .limit(1),
      db
        .select()
        .from(aiJobSteps)
        .where(eq(aiJobSteps.jobId, job.id))
        .orderBy(aiJobSteps.stepOrder),
      db
        .select()
        .from(aiJobReviews)
        .where(eq(aiJobReviews.jobId, job.id))
        .orderBy(desc(aiJobReviews.createdAt)),
    ])

    res.json({
      pleading: {
        job,
        artifact: artifacts[0] ?? null,
        steps,
        reviews,
      },
    })
  } catch (err) {
    next(err)
  }
})

// ─── POST /pleading/:caseId/generate ────────────────────────────────────────

router.post(
  '/pleading/:caseId/generate',
  validate(generatePleadingSchema),
  async (req, res, next) => {
    try {
      const userId = req.user!.userId
      const caseId = getSingleValue(req.params.caseId)
      if (!caseId) { res.status(400).json({ error: 'Gecersiz dava id.' }); return }
      const { forceRerun } = req.body as { forceRerun?: boolean }

      const caseRecord = await getOwnedCaseRecord(userId, caseId)
      if (!caseRecord) {
        res.status(404).json({ error: 'Dava bulunamadi.' })
        return
      }

      // Kalite gate: automationStatus en az draft_ready olmalı
      if (
        !['draft_ready', 'review_ready', 'completed'].includes(caseRecord.automationStatus)
      ) {
        res.status(400).json({
          error:
            'Dilekce uretimi icin arastirma onaylanmis olmali. Mevcut durum: ' +
            caseRecord.automationStatus,
        })
        return
      }

      if (!hasPleadingAiConfig()) {
        res.status(503).json({ error: 'AI yapilandirmasi eksik. ANTHROPIC_API_KEY gerekli.' })
        return
      }

      const job = await getOrCreatePleadingJob(caseId, userId)

      // Mevcut artifact varsa ve forceRerun değilse dön
      const [existingArtifact] = await db
        .select()
        .from(aiJobArtifacts)
        .where(
          and(eq(aiJobArtifacts.jobId, job.id), eq(aiJobArtifacts.artifactType, 'pleading_v1'))
        )
        .orderBy(desc(aiJobArtifacts.createdAt))
        .limit(1)

      if (existingArtifact && !forceRerun) {
        res.json({ pleading: { job, artifact: existingArtifact }, message: 'Dilekce taslagi zaten mevcut.' })
        return
      }

      // Step'i in_progress yap
      await db
        .update(aiJobSteps)
        .set({ status: 'in_progress', startedAt: new Date(), updatedAt: new Date() })
        .where(and(eq(aiJobSteps.jobId, job.id), eq(aiJobSteps.stepKey, 'generate_v1')))

      await db
        .update(aiJobs)
        .set({ status: 'in_progress', startedAt: new Date(), updatedAt: new Date() })
        .where(eq(aiJobs.id, job.id))

      // Tüm girdi verilerini topla
      const [intake, briefing, procedure, researchProfile] = await Promise.all([
        db
          .select()
          .from(caseIntakeProfiles)
          .where(eq(caseIntakeProfiles.caseId, caseId))
          .limit(1)
          .then((r) => r[0] ?? null),
        db
          .select()
          .from(caseBriefings)
          .where(eq(caseBriefings.caseId, caseId))
          .limit(1)
          .then((r) => r[0] ?? null),
        db
          .select()
          .from(caseProcedureReports)
          .where(eq(caseProcedureReports.caseId, caseId))
          .limit(1)
          .then((r) => r[0] ?? null),
        db
          .select()
          .from(caseResearchProfiles)
          .where(eq(caseResearchProfiles.caseId, caseId))
          .limit(1)
          .then((r) => r[0] ?? null),
      ])

      // Araştırma artifact'lerinden seçilmiş argümanları al
      const researchArtifacts = await db
        .select()
        .from(aiJobArtifacts)
        .where(and(eq(aiJobArtifacts.caseId, caseId), eq(aiJobArtifacts.artifactType, 'research_report')))

      const selectedArguments: string[] = []
      for (const art of researchArtifacts) {
        if (!art.metadata) continue
        try {
          const meta = JSON.parse(art.metadata)
          if (meta.argumentSelections) {
            for (const [idx, selected] of Object.entries(meta.argumentSelections)) {
              if (selected && meta.arguments?.[Number(idx)]) {
                selectedArguments.push(meta.arguments[Number(idx)])
              }
            }
          }
        } catch {
          // metadata parse hatası — atla
        }
      }

      // Araştırma raporunu birleştir
      let researchReportMarkdown: string | null = null
      if (researchProfile?.lastRunSummary) {
        researchReportMarkdown = researchProfile.lastRunSummary
      } else if (researchArtifacts.length > 0) {
        researchReportMarkdown = researchArtifacts
          .map((a) => `### ${a.title}\n${a.contentPreview || ''}`)
          .join('\n\n')
      }

      const pleadingMarkdown = await generatePleadingWithAi({
        caseTitle: caseRecord.title,
        caseType: caseRecord.caseType,
        caseDescription: caseRecord.description,
        courtName: caseRecord.courtName,
        criticalPointSummary: intake?.criticalPointSummary,
        mainLegalAxis: intake?.mainLegalAxis,
        lawyerDirection: intake?.lawyerDirection,
        briefingSummary: briefing?.summary,
        toneStrategy: briefing?.toneStrategy,
        procedureReportMarkdown: procedure?.reportMarkdown,
        researchReportMarkdown,
        selectedArguments: selectedArguments.length > 0 ? selectedArguments : null,
      })

      // Artifact olarak kaydet (yeni versiyon)
      const versionNo = existingArtifact ? existingArtifact.versionNo + 1 : 1

      const [artifact] = await db
        .insert(aiJobArtifacts)
        .values({
          jobId: job.id,
          caseId,
          artifactType: 'pleading_v1',
          title: `Dilekce Taslagi v1.${versionNo}`,
          contentPreview: pleadingMarkdown.slice(0, 2000),
          versionNo,
          sourceStepKey: 'generate_v1',
          metadata: JSON.stringify({
            fullContent: pleadingMarkdown,
            generatedAt: new Date().toISOString(),
            inputSources: {
              hasIntake: !!intake,
              hasBriefing: !!briefing,
              hasProcedure: !!procedure,
              hasResearch: !!researchReportMarkdown,
              selectedArgumentCount: selectedArguments.length,
            },
          }),
        })
        .returning()

      // Step'i tamamla, review step'i beklemede yap
      await db
        .update(aiJobSteps)
        .set({ status: 'completed', finishedAt: new Date(), updatedAt: new Date() })
        .where(and(eq(aiJobSteps.jobId, job.id), eq(aiJobSteps.stepKey, 'generate_v1')))

      await db
        .update(aiJobSteps)
        .set({ status: 'pending', updatedAt: new Date() })
        .where(and(eq(aiJobSteps.jobId, job.id), eq(aiJobSteps.stepKey, 'review_v1')))

      // Job durumunu review_required yap
      await db
        .update(aiJobs)
        .set({
          status: 'review_required',
          currentStepKey: 'review_v1',
          updatedAt: new Date(),
        })
        .where(eq(aiJobs.id, job.id))

      // Review kaydı oluştur
      await db.insert(aiJobReviews).values({
        jobId: job.id,
        artifactId: artifact.id,
        reviewType: 'pleading_v1_review',
        status: 'pending',
      })

      // AI entegrasyon: dilekce hazir bildirimi
      await notifyPleadingReady({ userId, caseId, version: versionNo }).catch(() => {})

      res.json({
        pleading: { job: { ...job, status: 'review_required' }, artifact },
        message: 'Dilekce taslagi uretildi.',
      })
    } catch (err) {
      // Hata durumunda step'i failed yap
      const caseId = getSingleValue(req.params.caseId)
      if (caseId) {
        const [failedJob] = await db
          .select()
          .from(aiJobs)
          .where(and(eq(aiJobs.caseId, caseId), eq(aiJobs.jobType, 'pleading')))
          .orderBy(desc(aiJobs.createdAt))
          .limit(1)
          .catch(() => [])

        if (failedJob) {
          await db
            .update(aiJobSteps)
            .set({
              status: 'failed',
              errorMessage: err instanceof Error ? err.message : 'Bilinmeyen hata',
              finishedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(and(eq(aiJobSteps.jobId, failedJob.id), eq(aiJobSteps.stepKey, 'generate_v1')))
            .catch(() => {})

          await db
            .update(aiJobs)
            .set({ status: 'failed', finishedAt: new Date(), updatedAt: new Date() })
            .where(eq(aiJobs.id, failedJob.id))
            .catch(() => {})
        }
      }

      next(err)
    }
  }
)

// ─── PUT /pleading/:caseId/draft ────────────────────────────────────────────
// Manuel düzenleme — avukat dilekçeyi editleyebilir

router.put(
  '/pleading/:caseId/draft',
  validate(updatePleadingDraftSchema),
  async (req, res, next) => {
    try {
      const userId = req.user!.userId
      const caseId = getSingleValue(req.params.caseId)
      if (!caseId) { res.status(400).json({ error: 'Gecersiz dava id.' }); return }
      const { markdownContent } = req.body as { markdownContent: string }

      const caseRecord = await getOwnedCaseRecord(userId, caseId)
      if (!caseRecord) {
        res.status(404).json({ error: 'Dava bulunamadi.' })
        return
      }

      // Mevcut artifact'i bul
      const [job] = await db
        .select()
        .from(aiJobs)
        .where(and(eq(aiJobs.caseId, caseId), eq(aiJobs.jobType, 'pleading')))
        .orderBy(desc(aiJobs.createdAt))
        .limit(1)

      if (!job) {
        res.status(404).json({ error: 'Dilekce job bulunamadi. Once dilekce uretin.' })
        return
      }

      const [artifact] = await db
        .select()
        .from(aiJobArtifacts)
        .where(
          and(eq(aiJobArtifacts.jobId, job.id), eq(aiJobArtifacts.artifactType, 'pleading_v1'))
        )
        .orderBy(desc(aiJobArtifacts.createdAt))
        .limit(1)

      if (!artifact) {
        res.status(404).json({ error: 'Dilekce taslagi bulunamadi.' })
        return
      }

      // metadata'yı güncelle (fullContent alanı)
      let existingMeta: Record<string, unknown> = {}
      try {
        if (artifact.metadata) existingMeta = JSON.parse(artifact.metadata)
      } catch {
        // parse hatası — boş meta ile devam
      }

      const [updated] = await db
        .update(aiJobArtifacts)
        .set({
          contentPreview: markdownContent.slice(0, 2000),
          metadata: JSON.stringify({
            ...existingMeta,
            fullContent: markdownContent,
            lastManualEditAt: new Date().toISOString(),
            lastManualEditBy: userId,
          }),
        })
        .where(eq(aiJobArtifacts.id, artifact.id))
        .returning()

      res.json({ artifact: updated, message: 'Dilekce taslagi guncellendi.' })
    } catch (err) {
      next(err)
    }
  }
)

// ─── POST /pleading/:caseId/review ──────────────────────────────────────────

router.post(
  '/pleading/:caseId/review',
  validate(reviewPleadingSchema),
  async (req, res, next) => {
    try {
      const userId = req.user!.userId
      const caseId = getSingleValue(req.params.caseId)
      if (!caseId) { res.status(400).json({ error: 'Gecersiz dava id.' }); return }
      const { approved, reviewNotes } = req.body as { approved: boolean; reviewNotes?: string }

      const caseRecord = await getOwnedCaseRecord(userId, caseId)
      if (!caseRecord) {
        res.status(404).json({ error: 'Dava bulunamadi.' })
        return
      }

      const [job] = await db
        .select()
        .from(aiJobs)
        .where(and(eq(aiJobs.caseId, caseId), eq(aiJobs.jobType, 'pleading')))
        .orderBy(desc(aiJobs.createdAt))
        .limit(1)

      if (!job) {
        res.status(404).json({ error: 'Dilekce job bulunamadi.' })
        return
      }

      // Pending review'ı güncelle
      const [pendingReview] = await db
        .select()
        .from(aiJobReviews)
        .where(and(eq(aiJobReviews.jobId, job.id), eq(aiJobReviews.status, 'pending')))
        .orderBy(desc(aiJobReviews.createdAt))
        .limit(1)

      if (pendingReview) {
        await db
          .update(aiJobReviews)
          .set({
            status: approved ? 'approved' : 'changes_requested',
            reviewNotes: reviewNotes?.trim() || null,
            reviewedBy: userId,
            reviewedAt: new Date(),
          })
          .where(eq(aiJobReviews.id, pendingReview.id))
      }

      if (approved) {
        // review step'i tamamla
        await db
          .update(aiJobSteps)
          .set({ status: 'completed', finishedAt: new Date(), updatedAt: new Date() })
          .where(and(eq(aiJobSteps.jobId, job.id), eq(aiJobSteps.stepKey, 'review_v1')))

        // Job'ı tamamla
        await db
          .update(aiJobs)
          .set({
            status: 'completed',
            finishedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(aiJobs.id, job.id))

        // automationStatus'u güncelle — review_ready (savunma simülasyonuna hazır)
        await db
          .update(cases)
          .set({
            automationStatus: 'review_ready',
            updatedAt: new Date(),
          })
          .where(eq(cases.id, caseId))

        res.json({ message: 'Dilekce taslagi onaylandi. Savunma simulasyonu asamasina gecildi.' })
      } else {
        // review step'i failed yap (tekrar üretim veya düzenleme gerekiyor)
        await db
          .update(aiJobSteps)
          .set({ status: 'failed', updatedAt: new Date() })
          .where(and(eq(aiJobSteps.jobId, job.id), eq(aiJobSteps.stepKey, 'review_v1')))

        // Job'ı review_required olarak bırak (yeni üretim gerekebilir)
        await db
          .update(aiJobs)
          .set({ status: 'review_required', updatedAt: new Date() })
          .where(eq(aiJobs.id, job.id))

        res.json({ message: 'Dilekce taslagi reddedildi. Duzenleme veya yeniden uretim gerekli.' })
      }
    } catch (err) {
      next(err)
    }
  }
)

// ─── POST /pleading/:caseId/revise ──────────────────────────────────────────
// v1 + savunma simülasyonu → revizyon raporu + v2 dilekçe

router.post(
  '/pleading/:caseId/revise',
  validate(generatePleadingSchema),
  async (req, res, next) => {
    try {
      const userId = req.user!.userId
      const caseId = getSingleValue(req.params.caseId)
      if (!caseId) { res.status(400).json({ error: 'Gecersiz dava id.' }); return }
      const { forceRerun } = req.body as { forceRerun?: boolean }

      const caseRecord = await getOwnedCaseRecord(userId, caseId)
      if (!caseRecord) {
        res.status(404).json({ error: 'Dava bulunamadi.' })
        return
      }

      if (!['review_ready', 'completed'].includes(caseRecord.automationStatus)) {
        res.status(400).json({
          error:
            'Dilekce v2 icin dilekce v1 onaylanmis olmali. Mevcut durum: ' +
            caseRecord.automationStatus,
        })
        return
      }

      if (!hasRevisionAiConfig()) {
        res.status(503).json({ error: 'AI yapilandirmasi eksik.' })
        return
      }

      // v1 artifact'ini al
      const v1Artifacts = await db
        .select()
        .from(aiJobArtifacts)
        .where(and(eq(aiJobArtifacts.caseId, caseId), eq(aiJobArtifacts.artifactType, 'pleading_v1')))
        .orderBy(desc(aiJobArtifacts.createdAt))
        .limit(1)

      if (!v1Artifacts[0]) {
        res.status(400).json({ error: 'v1 dilekce taslagi bulunamadi.' })
        return
      }

      let pleadingV1Markdown = ''
      try {
        const meta = v1Artifacts[0].metadata ? JSON.parse(v1Artifacts[0].metadata) : {}
        pleadingV1Markdown = meta.fullContent || v1Artifacts[0].contentPreview || ''
      } catch {
        pleadingV1Markdown = v1Artifacts[0].contentPreview || ''
      }

      // Mevcut v2 var mı kontrol
      const existingV2 = await db
        .select()
        .from(aiJobArtifacts)
        .where(and(eq(aiJobArtifacts.caseId, caseId), eq(aiJobArtifacts.artifactType, 'pleading_v2')))
        .orderBy(desc(aiJobArtifacts.createdAt))
        .limit(1)

      if (existingV2[0] && !forceRerun) {
        res.json({
          revisionReport: null,
          pleadingV2: existingV2[0],
          message: 'Dilekce v2 zaten mevcut.',
        })
        return
      }

      // Savunma simülasyonunu al
      const defenseArtifacts = await db
        .select()
        .from(aiJobArtifacts)
        .where(
          and(
            eq(aiJobArtifacts.caseId, caseId),
            eq(aiJobArtifacts.artifactType, 'defense_simulation')
          )
        )
        .orderBy(desc(aiJobArtifacts.createdAt))
        .limit(1)

      let defenseSimulationMarkdown: string | null = null
      if (defenseArtifacts[0]?.metadata) {
        try {
          const meta = JSON.parse(defenseArtifacts[0].metadata)
          defenseSimulationMarkdown = meta.fullContent || defenseArtifacts[0].contentPreview
        } catch {
          defenseSimulationMarkdown = defenseArtifacts[0].contentPreview
        }
      }

      // Briefing ve araştırma
      const [briefing, researchProfile] = await Promise.all([
        db
          .select()
          .from(caseBriefings)
          .where(eq(caseBriefings.caseId, caseId))
          .limit(1)
          .then((r) => r[0] ?? null),
        db
          .select()
          .from(caseResearchProfiles)
          .where(eq(caseResearchProfiles.caseId, caseId))
          .limit(1)
          .then((r) => r[0] ?? null),
      ])

      const commonInput = {
        caseTitle: caseRecord.title,
        caseType: caseRecord.caseType,
        pleadingV1Markdown,
        defenseSimulationMarkdown,
        researchReportMarkdown: researchProfile?.lastRunSummary,
        briefingSummary: briefing?.summary,
        toneStrategy: briefing?.toneStrategy,
      }

      // Adım 1: Revizyon raporu üret
      const revisionReportMarkdown = await generateRevisionReportWithAi(commonInput)

      // Pleading job'ını bul
      const [pleadingJob] = await db
        .select()
        .from(aiJobs)
        .where(and(eq(aiJobs.caseId, caseId), eq(aiJobs.jobType, 'pleading')))
        .orderBy(desc(aiJobs.createdAt))
        .limit(1)

      const jobId = pleadingJob?.id

      // Revizyon raporu artifact
      if (jobId) {
        await db.insert(aiJobArtifacts).values({
          jobId,
          caseId,
          artifactType: 'revision_report',
          title: 'Revizyon Raporu',
          contentPreview: revisionReportMarkdown.slice(0, 2000),
          versionNo: 1,
          sourceStepKey: 'revise',
          metadata: JSON.stringify({
            fullContent: revisionReportMarkdown,
            generatedAt: new Date().toISOString(),
          }),
        })
      }

      // Adım 2: v2 dilekçe üret
      const pleadingV2Markdown = await generatePleadingV2WithAi({
        ...commonInput,
        revisionReportMarkdown,
      })

      const v2VersionNo = existingV2[0] ? existingV2[0].versionNo + 1 : 1

      const [v2Artifact] = await db
        .insert(aiJobArtifacts)
        .values({
          jobId: jobId || v1Artifacts[0].jobId,
          caseId,
          artifactType: 'pleading_v2',
          title: `Dilekce Taslagi v2.${v2VersionNo}`,
          contentPreview: pleadingV2Markdown.slice(0, 2000),
          versionNo: v2VersionNo,
          sourceStepKey: 'revise',
          metadata: JSON.stringify({
            fullContent: pleadingV2Markdown,
            generatedAt: new Date().toISOString(),
            hasDefenseSimulation: !!defenseSimulationMarkdown,
          }),
        })
        .returning()

      // Review kaydı oluştur
      if (jobId) {
        await db.insert(aiJobReviews).values({
          jobId,
          artifactId: v2Artifact.id,
          reviewType: 'pleading_v2_review',
          status: 'pending',
        })

        await db
          .update(aiJobs)
          .set({
            status: 'review_required',
            currentStepKey: 'review_v2',
            updatedAt: new Date(),
          })
          .where(eq(aiJobs.id, jobId))
      }

      res.json({
        revisionReport: revisionReportMarkdown.slice(0, 2000),
        pleadingV2: v2Artifact,
        message: 'Revizyon raporu ve dilekce v2 uretildi.',
      })
    } catch (err) {
      next(err)
    }
  }
)

// ─── POST /pleading/:caseId/final-review ────────────────────────────────────
// v2 dilekçe final onayı — onaylanınca automationStatus → completed

router.post(
  '/pleading/:caseId/final-review',
  validate(reviewPleadingSchema),
  async (req, res, next) => {
    try {
      const userId = req.user!.userId
      const caseId = getSingleValue(req.params.caseId)
      if (!caseId) { res.status(400).json({ error: 'Gecersiz dava id.' }); return }
      const { approved, reviewNotes } = req.body as { approved: boolean; reviewNotes?: string }

      const caseRecord = await getOwnedCaseRecord(userId, caseId)
      if (!caseRecord) {
        res.status(404).json({ error: 'Dava bulunamadi.' })
        return
      }

      const [job] = await db
        .select()
        .from(aiJobs)
        .where(and(eq(aiJobs.caseId, caseId), eq(aiJobs.jobType, 'pleading')))
        .orderBy(desc(aiJobs.createdAt))
        .limit(1)

      if (!job) {
        res.status(404).json({ error: 'Dilekce job bulunamadi.' })
        return
      }

      // Pending v2 review'ı güncelle
      const [pendingReview] = await db
        .select()
        .from(aiJobReviews)
        .where(
          and(
            eq(aiJobReviews.jobId, job.id),
            eq(aiJobReviews.status, 'pending'),
            eq(aiJobReviews.reviewType, 'pleading_v2_review')
          )
        )
        .orderBy(desc(aiJobReviews.createdAt))
        .limit(1)

      if (pendingReview) {
        await db
          .update(aiJobReviews)
          .set({
            status: approved ? 'approved' : 'changes_requested',
            reviewNotes: reviewNotes?.trim() || null,
            reviewedBy: userId,
            reviewedAt: new Date(),
          })
          .where(eq(aiJobReviews.id, pendingReview.id))
      }

      if (approved) {
        await db
          .update(aiJobs)
          .set({ status: 'completed', finishedAt: new Date(), updatedAt: new Date() })
          .where(eq(aiJobs.id, job.id))

        // automationStatus → completed
        await db
          .update(cases)
          .set({ automationStatus: 'completed', updatedAt: new Date() })
          .where(eq(cases.id, caseId))

        res.json({
          message: 'Dilekce v2 onaylandi. Otomasyon hatti tamamlandi. UDF donusumune gecilebilir.',
        })
      } else {
        await db
          .update(aiJobs)
          .set({ status: 'review_required', updatedAt: new Date() })
          .where(eq(aiJobs.id, job.id))

        res.json({
          message: 'Dilekce v2 reddedildi. Yeniden revizyon veya duzenleme gerekli.',
        })
      }
    } catch (err) {
      next(err)
    }
  }
)

// ─── GET /pleading/:caseId/export-udf ───────────────────────────────────────
// Onaylanmış dilekçeyi UDF formatına çevirip indir

const execFileAsync = promisify(execFile)

router.get('/pleading/:caseId/export-udf', async (req, res, next) => {
  try {
    const userId = req.user!.userId
    const caseId = getSingleValue(req.params.caseId)
    if (!caseId) { res.status(400).json({ error: 'Gecersiz dava id.' }); return }

    const caseRecord = await getOwnedCaseRecord(userId, caseId)
    if (!caseRecord) {
      res.status(404).json({ error: 'Dava bulunamadi.' })
      return
    }

    // v2 varsa onu, yoksa v1'i al
    let artifact = null
    const [v2] = await db
      .select()
      .from(aiJobArtifacts)
      .where(and(eq(aiJobArtifacts.caseId, caseId), eq(aiJobArtifacts.artifactType, 'pleading_v2')))
      .orderBy(desc(aiJobArtifacts.createdAt))
      .limit(1)

    if (v2) {
      artifact = v2
    } else {
      const [v1] = await db
        .select()
        .from(aiJobArtifacts)
        .where(
          and(eq(aiJobArtifacts.caseId, caseId), eq(aiJobArtifacts.artifactType, 'pleading_v1'))
        )
        .orderBy(desc(aiJobArtifacts.createdAt))
        .limit(1)
      artifact = v1
    }

    if (!artifact) {
      res.status(404).json({ error: 'Dilekce taslagi bulunamadi.' })
      return
    }

    // Markdown içeriğini al
    let markdownContent = ''
    try {
      const meta = artifact.metadata ? JSON.parse(artifact.metadata) : {}
      markdownContent = meta.fullContent || artifact.contentPreview || ''
    } catch {
      markdownContent = artifact.contentPreview || ''
    }

    if (!markdownContent.trim()) {
      res.status(400).json({ error: 'Dilekce icerig bos.' })
      return
    }

    // Geçici dosyalar
    const tempDir = tmpdir()
    const timestamp = Date.now()
    const mdPath = join(tempDir, `pleading-${timestamp}.md`)
    const udfPath = join(tempDir, `pleading-${timestamp}.udf`)

    await fs.writeFile(mdPath, markdownContent, 'utf-8')

    try {
      await execFileAsync('npx', ['udf-cli', 'md2udf', mdPath, udfPath], {
        timeout: 30000,
        shell: true,
      })
    } catch (execErr) {
      // Temizle
      await fs.unlink(mdPath).catch(() => {})
      await fs.unlink(udfPath).catch(() => {})

      const msg = execErr instanceof Error ? execErr.message : 'Bilinmeyen hata'
      res.status(500).json({ error: `UDF donusumu basarisiz: ${msg.slice(0, 200)}` })
      return
    }

    // UDF dosyasını oku ve gönder
    const udfBuffer = await fs.readFile(udfPath)

    // Temizle
    await fs.unlink(mdPath).catch(() => {})
    await fs.unlink(udfPath).catch(() => {})

    const safeTitle = caseRecord.title
      .replace(/[^a-zA-Z0-9\s_-]/gu, '')
      .replace(/\s+/gu, '_')
      .slice(0, 50) || 'dilekce'

    const encodedFilename = encodeURIComponent(`${caseRecord.title}-dilekce.udf`)

    res.setHeader('Content-Type', 'application/octet-stream')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${safeTitle}-dilekce.udf"; filename*=UTF-8''${encodedFilename}`
    )
    res.send(udfBuffer)
  } catch (err) {
    next(err)
  }
})

export default router

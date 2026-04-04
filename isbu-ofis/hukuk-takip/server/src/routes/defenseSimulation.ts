import { Router } from 'express'
import { and, desc, eq } from 'drizzle-orm'
import {
  generateDefenseSimulationSchema,
  reviewDefenseSimulationSchema,
} from '@hukuk-takip/shared'
import { db } from '../db/index.js'
import {
  aiJobArtifacts,
  aiJobReviews,
  aiJobs,
  aiJobSteps,
  caseBriefings,
  caseIntakeProfiles,
  caseResearchProfiles,
  cases,
} from '../db/schema.js'
import { authenticate } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import {
  generateDefenseSimulationWithAi,
  hasDefenseSimulationAiConfig,
} from '../utils/defenseSimulationAi.js'
import { notifyDefenseRiskFlag } from '../utils/aiIntegration.js'
import { getSingleValue } from '../utils/request.js'
import { saveArtifactToDrive } from '../utils/workspace.js'

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

async function getOrCreateDefenseJob(caseId: string, userId: string) {
  const [existingJob] = await db
    .select()
    .from(aiJobs)
    .where(and(eq(aiJobs.caseId, caseId), eq(aiJobs.jobType, 'defense_simulation')))
    .orderBy(desc(aiJobs.createdAt))
    .limit(1)

  if (existingJob) return existingJob

  const [job] = await db
    .insert(aiJobs)
    .values({
      caseId,
      createdBy: userId,
      jobType: 'defense_simulation',
      title: 'Savunma simulasyonu',
      status: 'draft',
      currentStepKey: 'generate_simulation',
    })
    .returning()

  await db.insert(aiJobSteps).values([
    {
      jobId: job.id,
      stepKey: 'generate_simulation',
      stepLabel: 'Savunma simulasyonu uret',
      stepOrder: 1,
      status: 'pending',
    },
    {
      jobId: job.id,
      stepKey: 'review_simulation',
      stepLabel: 'Savunma simulasyonu inceleme',
      stepOrder: 2,
      status: 'pending',
    },
  ])

  return job
}

// ─── GET /defense-simulation/:caseId ────────────────────────────────────────

router.get('/defense-simulation/:caseId', async (req, res, next) => {
  try {
    const userId = req.user!.userId
    const caseId = getSingleValue(req.params.caseId)
    if (!caseId) { res.status(400).json({ error: 'Gecersiz dava id.' }); return }

    const caseRecord = await getOwnedCaseRecord(userId, caseId)
    if (!caseRecord) { res.status(404).json({ error: 'Dava bulunamadi.' }); return }

    const [job] = await db
      .select()
      .from(aiJobs)
      .where(and(eq(aiJobs.caseId, caseId), eq(aiJobs.jobType, 'defense_simulation')))
      .orderBy(desc(aiJobs.createdAt))
      .limit(1)

    if (!job) {
      res.json({ defenseSimulation: null })
      return
    }

    const [artifacts, steps, reviews] = await Promise.all([
      db
        .select()
        .from(aiJobArtifacts)
        .where(
          and(
            eq(aiJobArtifacts.jobId, job.id),
            eq(aiJobArtifacts.artifactType, 'defense_simulation')
          )
        )
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
      defenseSimulation: {
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

// ─── POST /defense-simulation/:caseId/generate ─────────────────────────────

router.post(
  '/defense-simulation/:caseId/generate',
  validate(generateDefenseSimulationSchema),
  async (req, res, next) => {
    try {
      const userId = req.user!.userId
      const caseId = getSingleValue(req.params.caseId)
      if (!caseId) { res.status(400).json({ error: 'Gecersiz dava id.' }); return }
      const { forceRerun } = req.body as { forceRerun?: boolean }

      const caseRecord = await getOwnedCaseRecord(userId, caseId)
      if (!caseRecord) { res.status(404).json({ error: 'Dava bulunamadi.' }); return }

      // Kalite gate: en az review_ready olmalı (dilekçe v1 onaylanmış)
      if (!['review_ready', 'completed'].includes(caseRecord.automationStatus)) {
        res.status(400).json({
          error:
            'Savunma simulasyonu icin dilekce v1 onaylanmis olmali. Mevcut durum: ' +
            caseRecord.automationStatus,
        })
        return
      }

      if (!hasDefenseSimulationAiConfig()) {
        res
          .status(503)
          .json({ error: 'AI yapilandirmasi eksik. ANTHROPIC_API_KEY gerekli.' })
        return
      }

      const job = await getOrCreateDefenseJob(caseId, userId)

      const [existingArtifact] = await db
        .select()
        .from(aiJobArtifacts)
        .where(
          and(
            eq(aiJobArtifacts.jobId, job.id),
            eq(aiJobArtifacts.artifactType, 'defense_simulation')
          )
        )
        .orderBy(desc(aiJobArtifacts.createdAt))
        .limit(1)

      if (existingArtifact && !forceRerun) {
        res.json({
          defenseSimulation: { job, artifact: existingArtifact },
          message: 'Savunma simulasyonu zaten mevcut.',
        })
        return
      }

      // Step güncelle
      await db
        .update(aiJobSteps)
        .set({ status: 'in_progress', startedAt: new Date(), updatedAt: new Date() })
        .where(
          and(eq(aiJobSteps.jobId, job.id), eq(aiJobSteps.stepKey, 'generate_simulation'))
        )

      await db
        .update(aiJobs)
        .set({ status: 'in_progress', startedAt: new Date(), updatedAt: new Date() })
        .where(eq(aiJobs.id, job.id))

      // Girdi verilerini topla
      const [intake, briefing, researchProfile] = await Promise.all([
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
          .from(caseResearchProfiles)
          .where(eq(caseResearchProfiles.caseId, caseId))
          .limit(1)
          .then((r) => r[0] ?? null),
      ])

      // Dilekçe v1 artifact'ini al
      const pleadingArtifacts = await db
        .select()
        .from(aiJobArtifacts)
        .where(
          and(eq(aiJobArtifacts.caseId, caseId), eq(aiJobArtifacts.artifactType, 'pleading_v1'))
        )
        .orderBy(desc(aiJobArtifacts.createdAt))
        .limit(1)

      let pleadingMarkdown: string | null = null
      if (pleadingArtifacts[0]?.metadata) {
        try {
          const meta = JSON.parse(pleadingArtifacts[0].metadata)
          pleadingMarkdown = meta.fullContent || pleadingArtifacts[0].contentPreview
        } catch {
          pleadingMarkdown = pleadingArtifacts[0].contentPreview
        }
      }

      const simulationMarkdown = await generateDefenseSimulationWithAi({
        caseTitle: caseRecord.title,
        caseType: caseRecord.caseType,
        caseDescription: caseRecord.description,
        courtName: caseRecord.courtName,
        criticalPointSummary: intake?.criticalPointSummary,
        mainLegalAxis: intake?.mainLegalAxis,
        briefingSummary: briefing?.summary,
        opponentExpectation: intake?.opponentInitialArguments,
        researchReportMarkdown: researchProfile?.lastRunSummary,
        pleadingMarkdown,
      })

      const versionNo = existingArtifact ? existingArtifact.versionNo + 1 : 1

      // Risk flag tespiti
      const hasRiskFlag =
        simulationMarkdown.includes('Risk flag: VAR') ||
        simulationMarkdown.includes('DOGRULANMASI GEREKIR') ||
        simulationMarkdown.includes('BULUNAMADI')

      const [artifact] = await db
        .insert(aiJobArtifacts)
        .values({
          jobId: job.id,
          caseId,
          artifactType: 'defense_simulation',
          title: `Savunma Simulasyonu v${versionNo}`,
          contentPreview: simulationMarkdown.slice(0, 2000),
          versionNo,
          sourceStepKey: 'generate_simulation',
          metadata: JSON.stringify({
            fullContent: simulationMarkdown,
            generatedAt: new Date().toISOString(),
            hasRiskFlag,
          }),
        })
        .returning()

      // Step'leri güncelle
      await db
        .update(aiJobSteps)
        .set({ status: 'completed', finishedAt: new Date(), updatedAt: new Date() })
        .where(
          and(eq(aiJobSteps.jobId, job.id), eq(aiJobSteps.stepKey, 'generate_simulation'))
        )

      await db
        .update(aiJobs)
        .set({
          status: 'review_required',
          currentStepKey: 'review_simulation',
          updatedAt: new Date(),
        })
        .where(eq(aiJobs.id, job.id))

      await db.insert(aiJobReviews).values({
        jobId: job.id,
        artifactId: artifact.id,
        reviewType: 'defense_simulation_review',
        status: 'pending',
      })

      // Risk flag varsa bildirim olustur
      if (hasRiskFlag) {
        await notifyDefenseRiskFlag({ userId, caseId, jobId: job.id }).catch(() => {})
      }

      // Google Drive'a kaydet (arka planda)
      if (caseRecord.automationCaseCode) {
        saveArtifactToDrive(caseRecord.automationCaseCode, 'defense_simulation', simulationMarkdown).catch(() => {})
      }

      res.json({
        defenseSimulation: { job: { ...job, status: 'review_required' }, artifact },
        hasRiskFlag,
        message: hasRiskFlag
          ? 'Savunma simulasyonu uretildi. Risk flag tespit edildi — dikkatli inceleme onerilir.'
          : 'Savunma simulasyonu uretildi.',
      })
    } catch (err) {
      // Hata durumunda step'i failed yap
      const caseId = getSingleValue(req.params.caseId)
      if (caseId) {
        const [failedJob] = await db
          .select()
          .from(aiJobs)
          .where(and(eq(aiJobs.caseId, caseId), eq(aiJobs.jobType, 'defense_simulation')))
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
            .where(
              and(
                eq(aiJobSteps.jobId, failedJob.id),
                eq(aiJobSteps.stepKey, 'generate_simulation')
              )
            )
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

// ─── POST /defense-simulation/:caseId/review ────────────────────────────────

router.post(
  '/defense-simulation/:caseId/review',
  validate(reviewDefenseSimulationSchema),
  async (req, res, next) => {
    try {
      const userId = req.user!.userId
      const caseId = getSingleValue(req.params.caseId)
      if (!caseId) { res.status(400).json({ error: 'Gecersiz dava id.' }); return }
      const { approved, reviewNotes } = req.body as { approved: boolean; reviewNotes?: string }

      const caseRecord = await getOwnedCaseRecord(userId, caseId)
      if (!caseRecord) { res.status(404).json({ error: 'Dava bulunamadi.' }); return }

      const [job] = await db
        .select()
        .from(aiJobs)
        .where(and(eq(aiJobs.caseId, caseId), eq(aiJobs.jobType, 'defense_simulation')))
        .orderBy(desc(aiJobs.createdAt))
        .limit(1)

      if (!job) {
        res.status(404).json({ error: 'Savunma simulasyonu job bulunamadi.' })
        return
      }

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
        await db
          .update(aiJobSteps)
          .set({ status: 'completed', finishedAt: new Date(), updatedAt: new Date() })
          .where(
            and(
              eq(aiJobSteps.jobId, job.id),
              eq(aiJobSteps.stepKey, 'review_simulation')
            )
          )

        await db
          .update(aiJobs)
          .set({ status: 'completed', finishedAt: new Date(), updatedAt: new Date() })
          .where(eq(aiJobs.id, job.id))

        // automationStatus güncelleme yok — review_ready kalır
        // v2 dilekçe fazında ayrıca ele alınacak

        res.json({
          message:
            'Savunma simulasyonu onaylandi. Dilekce v2 (revizyon) asamasina gecilebilir.',
        })
      } else {
        await db
          .update(aiJobSteps)
          .set({ status: 'failed', updatedAt: new Date() })
          .where(
            and(
              eq(aiJobSteps.jobId, job.id),
              eq(aiJobSteps.stepKey, 'review_simulation')
            )
          )

        await db
          .update(aiJobs)
          .set({ status: 'review_required', updatedAt: new Date() })
          .where(eq(aiJobs.id, job.id))

        res.json({
          message:
            'Savunma simulasyonu reddedildi. Yeniden uretim veya duzenleme gerekli.',
        })
      }
    } catch (err) {
      next(err)
    }
  }
)

export default router

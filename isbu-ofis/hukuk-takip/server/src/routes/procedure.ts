import { Router } from 'express'
import { and, eq } from 'drizzle-orm'
import {
  generateProcedurePrecheckSchema,
  generateProcedureReportSchema,
  reviewProcedureReportSchema,
} from '@hukuk-takip/shared'
import { db } from '../db/index.js'
import {
  caseBriefings,
  caseIntakeProfiles,
  caseProcedureReports,
  cases,
} from '../db/schema.js'
import { authenticate } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import {
  generatePrecheckWithAi,
  generateProcedureReportWithAi,
  hasProcedureAiConfig,
} from '../utils/procedureAi.js'
import { createProcedureTasks } from '../utils/aiIntegration.js'
import { getSingleValue } from '../utils/request.js'

const router = Router()
router.use(authenticate)

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getOwnedCaseRecord(userId: string, caseId: string) {
  const [caseRecord] = await db
    .select()
    .from(cases)
    .where(and(eq(cases.id, caseId), eq(cases.userId, userId)))
    .limit(1)

  return caseRecord ?? null
}

async function getOrCreateProcedureReport(caseId: string) {
  const [existing] = await db
    .select()
    .from(caseProcedureReports)
    .where(eq(caseProcedureReports.caseId, caseId))
    .limit(1)

  if (existing) return existing

  const [created] = await db
    .insert(caseProcedureReports)
    .values({ caseId })
    .returning()

  return created
}

// ─── GET /procedure/:caseId ──────────────────────────────────────────────────

router.get('/procedure/:caseId', async (req, res, next) => {
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

    const [report] = await db
      .select()
      .from(caseProcedureReports)
      .where(eq(caseProcedureReports.caseId, caseId))
      .limit(1)

    res.json({ procedureReport: report ?? null })
  } catch (err) {
    next(err)
  }
})

// ─── POST /procedure/:caseId/precheck ────────────────────────────────────────

router.post(
  '/procedure/:caseId/precheck',
  validate(generateProcedurePrecheckSchema),
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

      if (!hasProcedureAiConfig()) {
        res.status(503).json({ error: 'AI yapilandirmasi eksik. ANTHROPIC_API_KEY gerekli.' })
        return
      }

      const report = await getOrCreateProcedureReport(caseId)

      // Zaten precheck yapılmış ve forceRerun değilse mevcut raporu dön
      if (report.precheckPassed && !forceRerun && report.status !== 'not_started') {
        res.json({ procedureReport: report, message: 'On kontrol zaten tamamlanmis.' })
        return
      }

      // Intake profilinden kritik nokta bilgilerini al
      const [intake] = await db
        .select()
        .from(caseIntakeProfiles)
        .where(eq(caseIntakeProfiles.caseId, caseId))
        .limit(1)

      // Briefing varsa özeti al
      const [briefing] = await db
        .select()
        .from(caseBriefings)
        .where(eq(caseBriefings.caseId, caseId))
        .limit(1)

      const precheckResult = await generatePrecheckWithAi({
        caseTitle: caseRecord.title,
        caseType: caseRecord.caseType,
        caseDescription: caseRecord.description,
        courtName: caseRecord.courtName,
        criticalPointSummary: intake?.criticalPointSummary,
        mainLegalAxis: intake?.mainLegalAxis,
        lawyerDirection: intake?.lawyerDirection,
        briefingSummary: briefing?.summary,
      })

      const [updated] = await db
        .update(caseProcedureReports)
        .set({
          courtType: precheckResult.courtType,
          jurisdiction: precheckResult.jurisdiction,
          arbitrationRequired: precheckResult.arbitrationRequired,
          arbitrationBasis: precheckResult.arbitrationBasis,
          statuteOfLimitations: precheckResult.statuteOfLimitations,
          specialPowerOfAttorney: precheckResult.specialPowerOfAttorney,
          specialPowerOfAttorneyNote: precheckResult.specialPowerOfAttorneyNote,
          precheckPassed: precheckResult.precheckPassed,
          precheckNotes: precheckResult.precheckNotes,
          status: 'precheck_done',
          updatedAt: new Date(),
        })
        .where(eq(caseProcedureReports.id, report.id))
        .returning()

      // AI entegrasyon: precheck notlarindaki eksikleri gorev olarak olustur
      if (precheckResult.precheckNotes) {
        const missingItems = precheckResult.precheckNotes
          .split('\n')
          .map((line: string) => line.replace(/^[-*]\s*/, '').trim())
          .filter((line: string) => line.length > 5 && /eksik|gerekli|alinmali|toplanmali/i.test(line))
        if (missingItems.length > 0) {
          await createProcedureTasks({
            userId,
            caseId,
            missingItems,
          }).catch(() => {})
        }
      }

      res.json({ procedureReport: updated })
    } catch (err) {
      next(err)
    }
  }
)

// ─── POST /procedure/:caseId/generate ────────────────────────────────────────

router.post(
  '/procedure/:caseId/generate',
  validate(generateProcedureReportSchema),
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

      if (!hasProcedureAiConfig()) {
        res.status(503).json({ error: 'AI yapilandirmasi eksik. ANTHROPIC_API_KEY gerekli.' })
        return
      }

      const [report] = await db
        .select()
        .from(caseProcedureReports)
        .where(eq(caseProcedureReports.caseId, caseId))
        .limit(1)

      if (!report) {
        res.status(400).json({ error: 'Once on kontrol (precheck) yapilmali.' })
        return
      }

      if (report.status === 'not_started') {
        res.status(400).json({ error: 'Once on kontrol (precheck) yapilmali.' })
        return
      }

      // Zaten rapor var ve forceRerun değilse
      if (report.reportMarkdown && !forceRerun && report.status !== 'precheck_done') {
        res.json({ procedureReport: report, message: 'Usul raporu zaten mevcut.' })
        return
      }

      // Durumu generating'e çek
      await db
        .update(caseProcedureReports)
        .set({ status: 'generating', updatedAt: new Date() })
        .where(eq(caseProcedureReports.id, report.id))

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

      const reportMarkdown = await generateProcedureReportWithAi({
        caseTitle: caseRecord.title,
        caseType: caseRecord.caseType,
        caseDescription: caseRecord.description,
        courtName: caseRecord.courtName,
        criticalPointSummary: intake?.criticalPointSummary,
        mainLegalAxis: intake?.mainLegalAxis,
        lawyerDirection: intake?.lawyerDirection,
        briefingSummary: briefing?.summary,
        precheckNotes: report.precheckNotes,
        courtType: report.courtType,
        jurisdiction: report.jurisdiction,
        arbitrationRequired: report.arbitrationRequired,
        statuteOfLimitations: report.statuteOfLimitations,
      })

      const [updated] = await db
        .update(caseProcedureReports)
        .set({
          reportMarkdown,
          status: 'draft',
          updatedAt: new Date(),
        })
        .where(eq(caseProcedureReports.id, report.id))
        .returning()

      res.json({ procedureReport: updated })
    } catch (err) {
      // Hata durumunda status'u geri al
      const caseId = getSingleValue(req.params.caseId)
      if (caseId) await db
        .update(caseProcedureReports)
        .set({ status: 'precheck_done', updatedAt: new Date() })
        .where(eq(caseProcedureReports.caseId, caseId))
        .catch(() => {})

      next(err)
    }
  }
)

// ─── POST /procedure/:caseId/review ──────────────────────────────────────────

router.post(
  '/procedure/:caseId/review',
  validate(reviewProcedureReportSchema),
  async (req, res, next) => {
    try {
      const userId = req.user!.userId
      const caseId = getSingleValue(req.params.caseId)
      if (!caseId) { res.status(400).json({ error: 'Gecersiz dava id.' }); return }
      const { approved, rejectionNotes } = req.body as {
        approved: boolean
        rejectionNotes?: string
      }

      const caseRecord = await getOwnedCaseRecord(userId, caseId)
      if (!caseRecord) {
        res.status(404).json({ error: 'Dava bulunamadi.' })
        return
      }

      const [report] = await db
        .select()
        .from(caseProcedureReports)
        .where(eq(caseProcedureReports.caseId, caseId))
        .limit(1)

      if (!report || !report.reportMarkdown) {
        res.status(400).json({ error: 'Incelenecek usul raporu bulunamadi.' })
        return
      }

      if (approved) {
        const [updated] = await db
          .update(caseProcedureReports)
          .set({
            status: 'approved',
            approvedBy: userId,
            approvedAt: new Date(),
            rejectionNotes: null,
            updatedAt: new Date(),
          })
          .where(eq(caseProcedureReports.id, report.id))
          .returning()

        // automationStatus'u güncelle — araştırma artık başlatılabilir
        await db
          .update(cases)
          .set({
            automationStatus: 'research_ready',
            procedurePath: report.storagePath,
            updatedAt: new Date(),
          })
          .where(eq(cases.id, caseId))

        res.json({ procedureReport: updated, message: 'Usul raporu onaylandi.' })
      } else {
        const [updated] = await db
          .update(caseProcedureReports)
          .set({
            status: 'rejected',
            rejectionNotes: rejectionNotes?.trim() || null,
            updatedAt: new Date(),
          })
          .where(eq(caseProcedureReports.id, report.id))
          .returning()

        res.json({ procedureReport: updated, message: 'Usul raporu reddedildi.' })
      }
    } catch (err) {
      next(err)
    }
  }
)

export default router

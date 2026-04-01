import fs from 'fs/promises'
import { Router } from 'express'
import { and, desc, eq } from 'drizzle-orm'
import {
  approveCaseBriefingSchema,
  approveCaseIntakeProfileSchema,
  generateCriticalPointSchema,
  generateCaseBriefingSchema,
  upsertCaseIntakeProfileSchema,
} from '@hukuk-takip/shared'
import { db } from '../db/index.js'
import {
  aiJobArtifacts,
  aiJobs,
  caseBriefings,
  caseIntakeProfiles,
  caseResearchProfiles,
  cases,
  documents,
  notes,
} from '../db/schema.js'
import { authenticate } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { getOwnedCase } from '../utils/ownership.js'
import { getSingleValue } from '../utils/request.js'
import { buildBriefingDraft, generateIntakeDraft, generateResearchProfileDraft } from '../utils/intake.js'
import { extractDocumentForIntake } from '../utils/documentText.js'
import { generateIntakeAndResearchWithAI, hasIntakeAiConfig } from '../utils/intakeAi.js'

const router = Router()
router.use(authenticate)

function normalizeOptionalString(value?: string | null) {
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

async function syncLatestJobArtifact(options: {
  caseId: string
  jobType: string
  artifactType: string
  title: string
  storagePath?: string | null
  contentPreview?: string | null
  sourceStepKey?: string | null
}) {
  const [job] = await db
    .select({ id: aiJobs.id })
    .from(aiJobs)
    .where(and(eq(aiJobs.caseId, options.caseId), eq(aiJobs.jobType, options.jobType)))
    .orderBy(desc(aiJobs.createdAt))
    .limit(1)

  if (!job) {
    return
  }

  const [artifact] = await db
    .select()
    .from(aiJobArtifacts)
    .where(and(eq(aiJobArtifacts.jobId, job.id), eq(aiJobArtifacts.artifactType, options.artifactType)))
    .limit(1)

  if (artifact) {
    await db
      .update(aiJobArtifacts)
      .set({
        title: options.title,
        storagePath: normalizeOptionalString(options.storagePath),
        contentPreview: normalizeOptionalString(options.contentPreview),
        sourceStepKey: normalizeOptionalString(options.sourceStepKey),
      })
      .where(eq(aiJobArtifacts.id, artifact.id))
    return
  }

  await db.insert(aiJobArtifacts).values({
    jobId: job.id,
    caseId: options.caseId,
    artifactType: options.artifactType,
    title: options.title,
    storagePath: normalizeOptionalString(options.storagePath),
    contentPreview: normalizeOptionalString(options.contentPreview),
    sourceStepKey: normalizeOptionalString(options.sourceStepKey),
  })
}

router.get('/cases/:id/intake-profile', async (req, res) => {
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
    .from(caseIntakeProfiles)
    .where(eq(caseIntakeProfiles.caseId, caseId))
    .limit(1)

  const [documentCountResult, noteCountResult] = await Promise.all([
    db
      .select({ count: documents.id })
      .from(documents)
      .where(eq(documents.caseId, caseId)),
    db
      .select({ count: notes.id })
      .from(notes)
      .where(eq(notes.caseId, caseId)),
  ])

  res.json({
    profile: profile || null,
    documentCount: documentCountResult.length,
    noteCount: noteCountResult.length,
  })
})

router.put('/cases/:id/intake-profile', validate(upsertCaseIntakeProfileSchema), async (req, res) => {
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

  const payload = {
    lawyerDirection: normalizeOptionalString(req.body.lawyerDirection),
    clientInterviewNotes: normalizeOptionalString(req.body.clientInterviewNotes),
    criticalPointSummary: normalizeOptionalString(req.body.criticalPointSummary),
    mainLegalAxis: normalizeOptionalString(req.body.mainLegalAxis),
    secondaryRisks: normalizeOptionalString(req.body.secondaryRisks),
    proofRisks: normalizeOptionalString(req.body.proofRisks),
    missingInformation: normalizeOptionalString(req.body.missingInformation),
    missingDocuments: normalizeOptionalString(req.body.missingDocuments),
    opponentInitialArguments: normalizeOptionalString(req.body.opponentInitialArguments),
    approvedByLawyer: false,
    approvedBy: null,
    approvedAt: null,
    updatedAt: new Date(),
  }

  const [existingProfile] = await db
    .select()
    .from(caseIntakeProfiles)
    .where(eq(caseIntakeProfiles.caseId, caseId))
    .limit(1)

  const [profile] = existingProfile
    ? await db
        .update(caseIntakeProfiles)
        .set(payload)
        .where(eq(caseIntakeProfiles.id, existingProfile.id))
        .returning()
    : await db
        .insert(caseIntakeProfiles)
        .values({
          caseId,
          ...payload,
        })
        .returning()

  res.json(profile)
})

router.post('/cases/:id/intake-profile/generate-critical-point', validate(generateCriticalPointSchema), async (req, res) => {
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

  const [[existingProfile], caseDocuments, caseNotes] = await Promise.all([
    db.select().from(caseIntakeProfiles).where(eq(caseIntakeProfiles.caseId, caseId)).limit(1),
    db
      .select({
        fileName: documents.fileName,
        fileUrl: documents.fileUrl,
        description: documents.description,
        createdAt: documents.createdAt,
      })
      .from(documents)
      .where(eq(documents.caseId, caseId))
      .orderBy(desc(documents.createdAt)),
    db
      .select({
        content: notes.content,
        createdAt: notes.createdAt,
      })
      .from(notes)
      .where(eq(notes.caseId, caseId))
      .orderBy(desc(notes.createdAt)),
  ])

  const lawyerDirectionInput = normalizeOptionalString(req.body.lawyerDirection)
  const clientInterviewNotesInput = normalizeOptionalString(req.body.clientInterviewNotes)
  const enrichedDocuments = await Promise.all(
    caseDocuments.slice(0, 8).map(async (document) => ({
      ...document,
      ...(await extractDocumentForIntake(document.fileUrl)),
    }))
  )

  const generated = generateIntakeDraft({
    caseType: caseRecord.caseType,
    caseTitle: caseRecord.title,
    caseDescription: caseRecord.description,
    clientName: null,
    courtName: caseRecord.courtName,
    lawyerDirection: lawyerDirectionInput || existingProfile?.lawyerDirection || caseRecord.description,
    clientInterviewNotes: clientInterviewNotesInput || existingProfile?.clientInterviewNotes,
    documents: enrichedDocuments,
    notes: caseNotes,
  })

  let generatedResearch = generateResearchProfileDraft(
    {
      caseType: caseRecord.caseType,
      caseTitle: caseRecord.title,
      caseDescription: caseRecord.description,
      clientName: null,
      courtName: caseRecord.courtName,
      lawyerDirection: lawyerDirectionInput || existingProfile?.lawyerDirection || caseRecord.description,
      clientInterviewNotes: clientInterviewNotesInput || existingProfile?.clientInterviewNotes,
      documents: enrichedDocuments,
      notes: caseNotes,
    },
    generated
  )

  let finalizedGenerated = generated

  if (hasIntakeAiConfig()) {
    try {
      const aiDraft = await generateIntakeAndResearchWithAI({
        caseTitle: caseRecord.title,
        caseType: caseRecord.caseType,
        caseDescription: caseRecord.description,
        courtName: caseRecord.courtName,
        lawyerDirection: lawyerDirectionInput || existingProfile?.lawyerDirection || caseRecord.description,
        clientInterviewNotes: clientInterviewNotesInput || existingProfile?.clientInterviewNotes,
        autoDocumentSummary: generated.autoDocumentSummary,
        autoFactSummary: generated.autoFactSummary,
        documents: enrichedDocuments,
        notes: caseNotes,
      })

      finalizedGenerated = {
        ...generated,
        criticalPointSummary: aiDraft.criticalPointSummary,
        mainLegalAxis: aiDraft.mainLegalAxis,
        secondaryRisks: aiDraft.secondaryRisks,
        proofRisks: aiDraft.proofRisks,
        missingInformation: aiDraft.missingInformation,
        missingDocuments: aiDraft.missingDocuments,
        opponentInitialArguments: aiDraft.opponentInitialArguments,
      }

      generatedResearch = {
        ...generatedResearch,
        researchQuestion: aiDraft.researchQuestion,
        searchKeywords: aiDraft.searchKeywords,
      }
    } catch (error) {
      console.error('[Intake AI]', error)
    }
  }

  const payload = {
    lawyerDirection: lawyerDirectionInput || normalizeOptionalString(existingProfile?.lawyerDirection || caseRecord.description),
    clientInterviewNotes: clientInterviewNotesInput || normalizeOptionalString(existingProfile?.clientInterviewNotes),
    autoDocumentSummary: generated.autoDocumentSummary,
    autoFactSummary: generated.autoFactSummary,
    criticalPointSummary: finalizedGenerated.criticalPointSummary,
    mainLegalAxis: finalizedGenerated.mainLegalAxis,
    secondaryRisks: finalizedGenerated.secondaryRisks,
    proofRisks: finalizedGenerated.proofRisks,
    missingInformation: finalizedGenerated.missingInformation,
    missingDocuments: finalizedGenerated.missingDocuments,
    opponentInitialArguments: finalizedGenerated.opponentInitialArguments,
    approvedByLawyer: false,
    approvedBy: null,
    approvedAt: null,
    updatedAt: new Date(),
  }

  const [profile] = existingProfile
    ? await db
        .update(caseIntakeProfiles)
        .set(payload)
        .where(eq(caseIntakeProfiles.id, existingProfile.id))
        .returning()
    : await db
        .insert(caseIntakeProfiles)
        .values({
          caseId,
          ...payload,
        })
        .returning()

  const [existingResearchProfile] = await db
    .select()
    .from(caseResearchProfiles)
    .where(eq(caseResearchProfiles.caseId, caseId))
    .limit(1)

  if (existingResearchProfile) {
    await db
      .update(caseResearchProfiles)
      .set({
        researchQuestion: generatedResearch.researchQuestion,
        searchKeywords: generatedResearch.searchKeywords,
        yargiQuery: null,
        yargiCourtTypes: null,
        yargiChamber: null,
        yargiDateStart: null,
        yargiDateEnd: null,
        mevzuatQuery: null,
        mevzuatScope: null,
        mevzuatLawNumbers: null,
        notebooklmQuestion: null,
        vectorQuery: null,
        updatedAt: new Date(),
      })
      .where(eq(caseResearchProfiles.id, existingResearchProfile.id))
  } else {
    await db.insert(caseResearchProfiles).values({
      caseId,
      researchQuestion: generatedResearch.researchQuestion,
      searchKeywords: generatedResearch.searchKeywords,
      useNotebooklm: false,
      notebooklmNotebook: null,
      notebooklmQuestion: null,
      useVectorDb: false,
      vectorCollections: null,
      vectorQuery: null,
      vectorTopK: 5,
      useYargiMcp: true,
      yargiQuery: null,
      yargiCourtTypes: null,
      yargiChamber: null,
      yargiDateStart: null,
      yargiDateEnd: null,
      yargiResultLimit: 3,
      useMevzuatMcp: true,
      mevzuatQuery: null,
      mevzuatScope: null,
      mevzuatLawNumbers: null,
      mevzuatResultLimit: 3,
    })
  }

  await syncLatestJobArtifact({
    caseId,
    jobType: 'intake',
    artifactType: 'critical_point',
    title: 'Kritik nokta sentezi',
    contentPreview: finalizedGenerated.criticalPointSummary,
    sourceStepKey: 'critical_point',
  })

  res.json(profile)
})

router.post(
  '/cases/:id/intake-profile/approve',
  validate(approveCaseIntakeProfileSchema),
  async (req, res) => {
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
      .from(caseIntakeProfiles)
      .where(eq(caseIntakeProfiles.caseId, caseId))
      .limit(1)

    if (!profile) {
      res.status(404).json({ error: 'Intake profili bulunamadi.' })
      return
    }

    const [updatedProfile] = await db
      .update(caseIntakeProfiles)
      .set({
        lawyerDirection: normalizeOptionalString(req.body.lawyerDirection) ?? profile.lawyerDirection,
        clientInterviewNotes: normalizeOptionalString(req.body.clientInterviewNotes) ?? profile.clientInterviewNotes,
        criticalPointSummary: normalizeOptionalString(req.body.criticalPointSummary) ?? profile.criticalPointSummary,
        mainLegalAxis: normalizeOptionalString(req.body.mainLegalAxis) ?? profile.mainLegalAxis,
        secondaryRisks: normalizeOptionalString(req.body.secondaryRisks) ?? profile.secondaryRisks,
        proofRisks: normalizeOptionalString(req.body.proofRisks) ?? profile.proofRisks,
        missingInformation: normalizeOptionalString(req.body.missingInformation) ?? profile.missingInformation,
        missingDocuments: normalizeOptionalString(req.body.missingDocuments) ?? profile.missingDocuments,
        opponentInitialArguments:
          normalizeOptionalString(req.body.opponentInitialArguments) ?? profile.opponentInitialArguments,
        approvedByLawyer: req.body.approved,
        approvedBy: req.body.approved ? req.user!.userId : null,
        approvedAt: req.body.approved ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(caseIntakeProfiles.id, profile.id))
      .returning()

    res.json(updatedProfile)
  }
)

router.get('/cases/:id/briefing', async (req, res) => {
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

  const [briefing] = await db
    .select()
    .from(caseBriefings)
    .where(eq(caseBriefings.caseId, caseId))
    .limit(1)

  res.json({
    briefing: briefing || null,
    storagePath: caseRecord.briefingPath || null,
  })
})

router.post(
  '/cases/:id/briefing/generate',
  validate(generateCaseBriefingSchema),
  async (req, res) => {
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

    const [profile] = await db
      .select()
      .from(caseIntakeProfiles)
      .where(eq(caseIntakeProfiles.caseId, caseId))
      .limit(1)

    if (!profile) {
      res.status(400).json({ error: 'Once intake profili olusturulmalidir.' })
      return
    }

    if (!profile.approvedByLawyer) {
      res.status(400).json({ error: 'Briefing olusturmadan once kritik nokta avukat tarafindan onaylanmalidir.' })
      return
    }

    const generatedBriefing = buildBriefingDraft({
      caseTitle: caseRecord.title,
      caseType: caseRecord.caseType,
      clientName: null,
      courtName: caseRecord.courtName,
      briefingPath: caseRecord.briefingPath,
      lawyerDirection: profile.lawyerDirection,
      criticalPointSummary: profile.criticalPointSummary,
      mainLegalAxis: profile.mainLegalAxis,
      secondaryRisks: profile.secondaryRisks,
      proofRisks: profile.proofRisks,
      missingInformation: profile.missingInformation,
      missingDocuments: profile.missingDocuments,
      opponentInitialArguments: profile.opponentInitialArguments,
      requestedToneStrategy: req.body.toneStrategy,
    })

    if (caseRecord.briefingPath) {
      await fs.writeFile(caseRecord.briefingPath, generatedBriefing.markdownContent, 'utf8')
    }

    const [existingBriefing] = await db
      .select()
      .from(caseBriefings)
      .where(eq(caseBriefings.caseId, caseId))
      .limit(1)

    const versionNo = existingBriefing ? existingBriefing.versionNo + 1 : 1

    const [briefing] = existingBriefing
      ? await db
          .update(caseBriefings)
          .set({
            versionNo,
            summary: generatedBriefing.summary,
            mainGoal: generatedBriefing.mainGoal,
            secondaryGoal: generatedBriefing.secondaryGoal,
            mainProcedureRisk: generatedBriefing.mainProcedureRisk,
            mainProofRisk: generatedBriefing.mainProofRisk,
            toneStrategy: generatedBriefing.toneStrategy,
            markdownContent: generatedBriefing.markdownContent,
            storagePath: normalizeOptionalString(caseRecord.briefingPath),
            status: 'review_pending',
            approvedBy: null,
            approvedAt: null,
            updatedAt: new Date(),
          })
          .where(eq(caseBriefings.id, existingBriefing.id))
          .returning()
      : await db
          .insert(caseBriefings)
          .values({
            caseId,
            versionNo,
            summary: generatedBriefing.summary,
            mainGoal: generatedBriefing.mainGoal,
            secondaryGoal: generatedBriefing.secondaryGoal,
            mainProcedureRisk: generatedBriefing.mainProcedureRisk,
            mainProofRisk: generatedBriefing.mainProofRisk,
            toneStrategy: generatedBriefing.toneStrategy,
            markdownContent: generatedBriefing.markdownContent,
            storagePath: normalizeOptionalString(caseRecord.briefingPath),
            status: 'review_pending',
          })
          .returning()

    await syncLatestJobArtifact({
      caseId,
      jobType: 'briefing',
      artifactType: 'briefing',
      title: 'Briefing dosyasi',
      storagePath: caseRecord.briefingPath,
      contentPreview: generatedBriefing.summary,
      sourceStepKey: 'draft_briefing',
    })

    res.json(briefing)
  }
)

router.post(
  '/cases/:id/briefing/approve',
  validate(approveCaseBriefingSchema),
  async (req, res) => {
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

    const [briefing] = await db
      .select()
      .from(caseBriefings)
      .where(eq(caseBriefings.caseId, caseId))
      .limit(1)

    if (!briefing) {
      res.status(404).json({ error: 'Briefing kaydi bulunamadi.' })
      return
    }

    const [updatedBriefing] = await db
      .update(caseBriefings)
      .set({
        status: req.body.approved ? 'approved' : 'draft',
        approvedBy: req.body.approved ? req.user!.userId : null,
        approvedAt: req.body.approved ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(caseBriefings.id, briefing.id))
      .returning()

    res.json(updatedBriefing)
  }
)

export default router

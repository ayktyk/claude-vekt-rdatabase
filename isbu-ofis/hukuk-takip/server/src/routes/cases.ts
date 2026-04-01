import { Router } from 'express'
import { eq, and, ilike, or, desc, sql } from 'drizzle-orm'
import { db } from '../db/index.js'
import {
  cases,
  clients,
  caseHearings,
  tasks,
  expenses,
  collections,
  notes,
  documents,
} from '../db/schema.js'
import { validate } from '../middleware/validate.js'
import { authenticate } from '../middleware/auth.js'
import { createCaseSchema, updateCaseSchema } from '@hukuk-takip/shared'
import { getOwnedCase } from '../utils/ownership.js'
import { getPositiveInt, getSingleValue } from '../utils/request.js'
import { withAutomationDefaults } from '../utils/automation.js'
import {
  assertWorkspaceRootAccessible,
  buildWorkspaceLayout,
  deriveAutomationCaseCode,
  materializeWorkspace,
} from '../utils/workspace.js'

const router = Router()
router.use(authenticate)

function normalizeNullableString(value: unknown) {
  if (typeof value !== 'string') {
    return value
  }

  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

function normalizeCasePayload(payload: any) {
  return {
    ...payload,
    startDate: normalizeNullableString(payload.startDate),
    closeDate: normalizeNullableString(payload.closeDate),
    contractedFee: normalizeNullableString(payload.contractedFee),
    automationCaseCode: normalizeNullableString(payload.automationCaseCode),
    driveFolderPath: normalizeNullableString(payload.driveFolderPath),
    briefingPath: normalizeNullableString(payload.briefingPath),
    procedurePath: normalizeNullableString(payload.procedurePath),
    researchPath: normalizeNullableString(payload.researchPath),
    defenseSimulationPath: normalizeNullableString(payload.defenseSimulationPath),
    revisionPath: normalizeNullableString(payload.revisionPath),
    pleadingMdPath: normalizeNullableString(payload.pleadingMdPath),
    pleadingUdfPath: normalizeNullableString(payload.pleadingUdfPath),
    customCaseType: normalizeNullableString(payload.customCaseType),
  }
}

// ─── GET /api/cases — Dava listesi ───────────────────────────────────────────

router.get('/', async (req, res) => {
  const search = getSingleValue(req.query.search)
  const status = getSingleValue(req.query.status)
  const caseType = getSingleValue(req.query.caseType)
  const page = getPositiveInt(req.query.page, 1)
  const pageSize = getPositiveInt(req.query.pageSize, 20)
  const offset = (page - 1) * pageSize

  const conditions = [eq(cases.userId, req.user!.userId)]

  if (search?.trim()) {
    conditions.push(
      or(
        ilike(cases.title, `%${search.trim()}%`),
        ilike(cases.caseNumber, `%${search.trim()}%`),
        ilike(cases.courtName, `%${search.trim()}%`),
        ilike(cases.description, `%${search.trim()}%`),
        ilike(clients.fullName, `%${search.trim()}%`)
      )!
    )
  }

  if (status) {
    conditions.push(eq(cases.status, status as any))
  }

  if (caseType) {
    conditions.push(eq(cases.caseType, caseType as any))
  }

  const where = and(...conditions)

  const [data, countResult] = await Promise.all([
    db
      .select({
        id: cases.id,
        caseNumber: cases.caseNumber,
        courtName: cases.courtName,
        caseType: cases.caseType,
        status: cases.status,
        title: cases.title,
        automationCaseCode: cases.automationCaseCode,
        automationStatus: cases.automationStatus,
        driveFolderPath: cases.driveFolderPath,
        startDate: cases.startDate,
        contractedFee: cases.contractedFee,
        clientId: cases.clientId,
        clientName: clients.fullName,
        createdAt: cases.createdAt,
      })
      .from(cases)
      .leftJoin(clients, eq(cases.clientId, clients.id))
      .where(where)
      .orderBy(desc(cases.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(cases)
      .where(where),
  ])

  const total = countResult[0]?.count ?? 0

  res.json({
    data,
    total,
    page,
    pageSize,
    hasMore: offset + data.length < total,
  })
})

// ─── GET /api/cases/:id — Dava detayı ────────────────────────────────────────

router.get('/:id', async (req, res) => {
  const caseId = getSingleValue(req.params.id)

  if (!caseId) {
    res.status(400).json({ error: 'Gecersiz dava id.' })
    return
  }

  const [caseData] = await db
    .select({
      id: cases.id,
      caseNumber: cases.caseNumber,
      courtName: cases.courtName,
      caseType: cases.caseType,
      status: cases.status,
      title: cases.title,
      description: cases.description,
      startDate: cases.startDate,
      closeDate: cases.closeDate,
      automationCaseCode: cases.automationCaseCode,
      automationStatus: cases.automationStatus,
      driveFolderPath: cases.driveFolderPath,
      briefingPath: cases.briefingPath,
      procedurePath: cases.procedurePath,
      researchPath: cases.researchPath,
      defenseSimulationPath: cases.defenseSimulationPath,
      revisionPath: cases.revisionPath,
      pleadingMdPath: cases.pleadingMdPath,
      pleadingUdfPath: cases.pleadingUdfPath,
      contractedFee: cases.contractedFee,
      currency: cases.currency,
      clientId: cases.clientId,
      clientName: clients.fullName,
      clientPhone: clients.phone,
      createdAt: cases.createdAt,
      updatedAt: cases.updatedAt,
    })
    .from(cases)
    .leftJoin(clients, eq(cases.clientId, clients.id))
    .where(and(eq(cases.id, caseId), eq(cases.userId, req.user!.userId)))
    .limit(1)

  if (!caseData) {
    res.status(404).json({ error: 'Dava bulunamadı.' })
    return
  }

  res.json(caseData)
})

// ─── POST /api/cases — Yeni dava ─────────────────────────────────────────────

router.post('/', validate(createCaseSchema), async (req, res) => {
  const [newCase] = await db
    .insert(cases)
    .values({
      ...withAutomationDefaults(normalizeCasePayload(req.body)),
      userId: req.user!.userId,
    })
    .returning()

  res.status(201).json(newCase)
})

// ─── PUT /api/cases/:id — Dava güncelle ──────────────────────────────────────

router.put('/:id', validate(updateCaseSchema), async (req, res) => {
  const caseId = getSingleValue(req.params.id)

  if (!caseId) {
    res.status(400).json({ error: 'Gecersiz dava id.' })
    return
  }

  const [updated] = await db
    .update(cases)
    .set({
      ...withAutomationDefaults(normalizeCasePayload(req.body)),
      updatedAt: new Date(),
    })
    .where(and(eq(cases.id, caseId), eq(cases.userId, req.user!.userId)))
    .returning()

  if (!updated) {
    res.status(404).json({ error: 'Dava bulunamadı.' })
    return
  }

  res.json(updated)
})

// ─── DELETE /api/cases/:id ────────────────────────────────────────────────────

router.delete('/:id', async (req, res) => {
  const caseId = getSingleValue(req.params.id)

  if (!caseId) {
    res.status(400).json({ error: 'Gecersiz dava id.' })
    return
  }

  const [deleted] = await db
    .delete(cases)
    .where(and(eq(cases.id, caseId), eq(cases.userId, req.user!.userId)))
    .returning()

  if (!deleted) {
    res.status(404).json({ error: 'Dava bulunamadı.' })
    return
  }

  res.json({ message: 'Dava silindi.' })
})

// POST /api/cases/:id/initialize-workspace
router.post('/:id/initialize-workspace', async (req, res) => {
  try {
    const caseId = getSingleValue(req.params.id)

    if (!caseId) {
      res.status(400).json({ error: 'Gecersiz dava id.' })
      return
    }

    await assertWorkspaceRootAccessible()

    const [caseData] = await db
      .select({
        id: cases.id,
        userId: cases.userId,
        clientId: cases.clientId,
        title: cases.title,
        caseType: cases.caseType,
        caseNumber: cases.caseNumber,
        courtName: cases.courtName,
        description: cases.description,
        startDate: cases.startDate,
        createdAt: cases.createdAt,
        automationCaseCode: cases.automationCaseCode,
        automationStatus: cases.automationStatus,
        driveFolderPath: cases.driveFolderPath,
        briefingPath: cases.briefingPath,
        procedurePath: cases.procedurePath,
        researchPath: cases.researchPath,
        defenseSimulationPath: cases.defenseSimulationPath,
        revisionPath: cases.revisionPath,
        pleadingMdPath: cases.pleadingMdPath,
        pleadingUdfPath: cases.pleadingUdfPath,
        clientName: clients.fullName,
      })
      .from(cases)
      .leftJoin(clients, eq(cases.clientId, clients.id))
      .where(and(eq(cases.id, caseId), eq(cases.userId, req.user!.userId)))
      .limit(1)

    if (!caseData) {
      res.status(404).json({ error: 'Dava bulunamadi.' })
      return
    }

    const automationCaseCode =
      caseData.automationCaseCode ||
      deriveAutomationCaseCode({
        createdAt: caseData.createdAt,
        title: caseData.title,
        caseId: caseData.id,
      })

    const caseWorkspace = withAutomationDefaults({
      automationCaseCode,
      automationStatus: caseData.automationStatus,
      driveFolderPath: caseData.driveFolderPath || undefined,
      briefingPath: caseData.briefingPath || undefined,
      procedurePath: caseData.procedurePath || undefined,
      researchPath: caseData.researchPath || undefined,
      defenseSimulationPath: caseData.defenseSimulationPath || undefined,
      revisionPath: caseData.revisionPath || undefined,
      pleadingMdPath: caseData.pleadingMdPath || undefined,
      pleadingUdfPath: caseData.pleadingUdfPath || undefined,
    })

    const layout = buildWorkspaceLayout(caseWorkspace.driveFolderPath!)
    const workspaceResult = await materializeWorkspace(layout, {
      caseTitle: caseData.title,
      caseType: caseData.caseType,
      caseDescription: caseData.description,
      clientName: caseData.clientName,
      courtName: caseData.courtName,
      caseNumber: caseData.caseNumber,
      startDate: caseData.startDate,
      createdAt: caseData.createdAt,
      automationCaseCode,
    })

    const [updatedCase] = await db
      .update(cases)
      .set({
        automationCaseCode,
        automationStatus: 'folder_ready',
        driveFolderPath: caseWorkspace.driveFolderPath,
        briefingPath: caseWorkspace.briefingPath,
        procedurePath: caseWorkspace.procedurePath,
        researchPath: caseWorkspace.researchPath,
        defenseSimulationPath: caseWorkspace.defenseSimulationPath,
        revisionPath: caseWorkspace.revisionPath,
        pleadingMdPath: caseWorkspace.pleadingMdPath,
        pleadingUdfPath: caseWorkspace.pleadingUdfPath,
        updatedAt: new Date(),
      })
      .where(and(eq(cases.id, caseId), eq(cases.userId, req.user!.userId)))
      .returning()

    const existingTasks = await db
      .select({
        label: tasks.label,
      })
      .from(tasks)
      .where(and(eq(tasks.caseId, caseId), eq(tasks.userId, req.user!.userId)))

    const existingLabels = new Set(existingTasks.map((item) => item.label).filter(Boolean))
    const seededTasks = [
      {
        label: 'ai-briefing',
        title: 'Briefing dosyasini doldur',
        description: '00-Briefing.md uzerinden olay orgusunu ve hedef talebi netlestir.',
        priority: 'high' as const,
      },
      {
        label: 'ai-procedure',
        title: 'Usul raporunu hazirla',
        description: '01-Usul/usul-raporu.md icin sure, yetki ve dava sarti analizini yaz.',
        priority: 'medium' as const,
      },
      {
        label: 'ai-research',
        title: 'Arastirma dosyalarini hazirla',
        description: 'Arastirma raporu ve savunma simulasyonu dosyalarini doldur.',
        priority: 'medium' as const,
      },
      {
        label: 'ai-draft',
        title: 'Dilekce ve UDF ciktilarini uret',
        description: 'Markdown ve UDF dilekce ciktilarini 03-Sentez-ve-Dilekce altinda olustur.',
        priority: 'high' as const,
      },
    ].filter((taskSeed) => !existingLabels.has(taskSeed.label))

    if (seededTasks.length > 0) {
      await db.insert(tasks).values(
        seededTasks.map((taskSeed) => ({
          userId: req.user!.userId,
          caseId,
          label: taskSeed.label,
          title: taskSeed.title,
          description: taskSeed.description,
          priority: taskSeed.priority,
        }))
      )
    }

    const workspaceNotePrefix = '[AI Workspace]'
    const [existingWorkspaceNote] = await db
      .select({ id: notes.id })
      .from(notes)
      .where(
        and(
          eq(notes.caseId, caseId),
          eq(notes.userId, req.user!.userId),
          ilike(notes.content, `${workspaceNotePrefix}%`)
        )
      )
      .limit(1)

    if (!existingWorkspaceNote) {
      await db.insert(notes).values({
        caseId,
        userId: req.user!.userId,
        content: `${workspaceNotePrefix}
Drive klasoru hazirlandi.

- Root: ${caseWorkspace.driveFolderPath}
- Briefing: ${caseWorkspace.briefingPath}
- Usul: ${caseWorkspace.procedurePath}
- Arastirma: ${caseWorkspace.researchPath}
- Savunma: ${caseWorkspace.defenseSimulationPath}
- Revizyon: ${caseWorkspace.revisionPath}
- Dilekce MD: ${caseWorkspace.pleadingMdPath}
- Dilekce UDF: ${caseWorkspace.pleadingUdfPath}`,
      })
    }

    res.json({
      message: 'AI Workspace hazirlandi.',
      case: updatedCase,
      createdDirectories: workspaceResult.createdDirectories,
      createdFiles: workspaceResult.createdFiles,
      createdTasks: seededTasks.length,
    })
  } catch (error: any) {
    console.error('[AI Workspace]', error)
    res.status(500).json({
      error: error?.message || 'AI Workspace hazirlanirken beklenmeyen bir hata olustu.',
    })
  }
})

// ─── GET /api/cases/:id/hearings ──────────────────────────────────────────────

router.get('/:id/hearings', async (req, res) => {
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

  const data = await db
    .select()
    .from(caseHearings)
    .where(eq(caseHearings.caseId, caseId))
    .orderBy(desc(caseHearings.hearingDate))

  res.json(data)
})

// ─── GET /api/cases/:id/tasks ─────────────────────────────────────────────────

router.get('/:id/tasks', async (req, res) => {
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

  const data = await db
    .select()
    .from(tasks)
    .where(eq(tasks.caseId, caseId))
    .orderBy(desc(tasks.createdAt))

  res.json(data)
})

// ─── GET /api/cases/:id/expenses ──────────────────────────────────────────────

router.get('/:id/expenses', async (req, res) => {
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

  const data = await db
    .select()
    .from(expenses)
    .where(eq(expenses.caseId, caseId))
    .orderBy(desc(expenses.createdAt))

  res.json(data)
})

// ─── GET /api/cases/:id/collections ───────────────────────────────────────────

router.get('/:id/collections', async (req, res) => {
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

  const data = await db
    .select()
    .from(collections)
    .where(eq(collections.caseId, caseId))
    .orderBy(desc(collections.createdAt))

  res.json(data)
})

// ─── GET /api/cases/:id/notes ─────────────────────────────────────────────────

router.get('/:id/notes', async (req, res) => {
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

  const data = await db
    .select()
    .from(notes)
    .where(eq(notes.caseId, caseId))
    .orderBy(desc(notes.createdAt))

  res.json(data)
})

// ─── GET /api/cases/:id/documents ─────────────────────────────────────────────

router.get('/:id/documents', async (req, res) => {
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

  const data = await db
    .select()
    .from(documents)
    .where(eq(documents.caseId, caseId))
    .orderBy(desc(documents.createdAt))

  res.json(data)
})

export default router

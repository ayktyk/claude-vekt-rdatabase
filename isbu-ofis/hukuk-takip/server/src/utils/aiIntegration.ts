/**
 * AI Integration Helpers
 *
 * AI pipeline asamalarinin (usul, arastirma, dilekce, savunma simulasyonu)
 * gorev, bildirim ve not tablolarina otomatik kayit olusturmasini saglar.
 */

import { db } from '../db/index.js'
import { notifications, notes, tasks } from '../db/schema.js'

// ─── Types ──────────────────────────────────────────────────────────────────

interface CreateAiTaskParams {
  userId: string
  caseId: string
  title: string
  description?: string
  label?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  dueDate?: Date | null
}

interface CreateAiNotificationParams {
  userId: string
  type: 'hearing' | 'deadline' | 'task' | 'payment' | 'system'
  title: string
  message: string
  relatedId?: string
  relatedType?: string
}

interface CreateAiNoteParams {
  userId: string
  caseId: string
  content: string
}

// ─── Helpers ────────────────────────────────────────────────────────────────

export async function createAiTask(params: CreateAiTaskParams) {
  const [task] = await db
    .insert(tasks)
    .values({
      userId: params.userId,
      caseId: params.caseId,
      title: params.title,
      description: params.description ?? null,
      label: params.label ?? 'ai-generated',
      priority: params.priority ?? 'medium',
      status: 'pending',
      dueDate: params.dueDate ?? null,
    })
    .returning()

  return task
}

export async function createAiNotification(params: CreateAiNotificationParams) {
  const [notification] = await db
    .insert(notifications)
    .values({
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      relatedId: params.relatedId ?? null,
      relatedType: params.relatedType ?? null,
      isRead: false,
    })
    .returning()

  return notification
}

export async function createAiNote(params: CreateAiNoteParams) {
  const [note] = await db
    .insert(notes)
    .values({
      userId: params.userId,
      caseId: params.caseId,
      content: params.content,
    })
    .returning()

  return note
}

// ─── Composite Helpers ──────────────────────────────────────────────────────

/**
 * Savunma simulasyonunda risk flag tespit edildiginde bildirim olusturur.
 */
export async function notifyDefenseRiskFlag(params: {
  userId: string
  caseId: string
  jobId: string
}) {
  return createAiNotification({
    userId: params.userId,
    type: 'system',
    title: 'Savunma simulasyonunda risk tespit edildi',
    message:
      'Savunma simulasyonu risk flag iceriyor. Dilekce taslagindan once detayli inceleme onerilir.',
    relatedId: params.caseId,
    relatedType: 'case',
  })
}

/**
 * Usul raporu sonrasi eksik belge/bilgi icin gorevler olusturur.
 */
export async function createProcedureTasks(params: {
  userId: string
  caseId: string
  missingItems: string[]
}) {
  const created = []
  for (const item of params.missingItems) {
    const task = await createAiTask({
      userId: params.userId,
      caseId: params.caseId,
      title: item,
      label: 'usul-eksik',
      priority: 'high',
    })
    created.push(task)
  }
  return created
}

/**
 * Arastirma tamamlandiginda bulgulari not olarak kaydeder.
 */
export async function saveResearchFindings(params: {
  userId: string
  caseId: string
  summary: string
}) {
  return createAiNote({
    userId: params.userId,
    caseId: params.caseId,
    content: `[AI Arastirma Ozeti]\n\n${params.summary}`,
  })
}

/**
 * Arastirmada eksik kaynaklar icin gorevler olusturur.
 */
export async function createResearchTasks(params: {
  userId: string
  caseId: string
  failedSources: string[]
}) {
  const created = []
  for (const source of params.failedSources) {
    const task = await createAiTask({
      userId: params.userId,
      caseId: params.caseId,
      title: `Eksik arastirma kaynagi: ${source}`,
      description: `${source} kaynagindan veri alinamadi. Manuel kontrol gerekli.`,
      label: 'arastirma-eksik',
      priority: 'medium',
    })
    created.push(task)
  }
  return created
}

/**
 * Dilekce olusturuldugunda bildirim gonderir.
 */
export async function notifyPleadingReady(params: {
  userId: string
  caseId: string
  version: number
}) {
  return createAiNotification({
    userId: params.userId,
    type: 'task',
    title: `Dilekce v${params.version} taslagi hazir`,
    message: `Dilekce taslagi incelemenize hazir. Dava detayindan AI Calisma Alani sekmesine gidin.`,
    relatedId: params.caseId,
    relatedType: 'case',
  })
}

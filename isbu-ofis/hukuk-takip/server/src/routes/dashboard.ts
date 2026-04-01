import { Router } from 'express'
import { eq, and, gte, lte, desc, sql, ne } from 'drizzle-orm'
import { db } from '../db/index.js'
import {
  aiJobs,
  cases,
  caseHearings,
  tasks,
  collections,
  clients,
} from '../db/schema.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()
router.use(authenticate)

// ─── GET /api/dashboard — Tek aggregate endpoint ─────────────────────────────

router.get('/', async (req, res) => {
  const userId = req.user!.userId
  const now = new Date()
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const [
    caseStats,
    upcomingHearings,
    pendingTasks,
    recentCases,
    totalCollections,
    outstandingFees,
    aiAutomationStats,
    activeAiJobs,
  ] = await Promise.all([
    // Dava istatistikleri
    db
      .select({
        status: cases.status,
        count: sql<number>`count(*)::int`,
      })
      .from(cases)
      .where(eq(cases.userId, userId))
      .groupBy(cases.status),

    // Yaklaşan duruşmalar (7 gün)
    db
      .select({
        caseId: cases.id,
        id: caseHearings.id,
        hearingDate: caseHearings.hearingDate,
        courtRoom: caseHearings.courtRoom,
        caseTitle: cases.title,
        caseNumber: cases.caseNumber,
        courtName: cases.courtName,
        clientName: clients.fullName,
      })
      .from(caseHearings)
      .innerJoin(cases, eq(caseHearings.caseId, cases.id))
      .leftJoin(clients, eq(cases.clientId, clients.id))
      .where(
        and(
          eq(cases.userId, userId),
          gte(caseHearings.hearingDate, now),
          lte(caseHearings.hearingDate, sevenDaysLater),
          eq(caseHearings.result, 'pending')
        )
      )
      .orderBy(caseHearings.hearingDate)
      .limit(10),

    // Bekleyen görevler
    db
      .select({
        id: tasks.id,
        title: tasks.title,
        priority: tasks.priority,
        dueDate: tasks.dueDate,
        caseTitle: cases.title,
      })
      .from(tasks)
      .leftJoin(cases, eq(tasks.caseId, cases.id))
      .where(
        and(
          eq(tasks.userId, userId),
          eq(tasks.status, 'pending')
        )
      )
      .orderBy(tasks.dueDate)
      .limit(10),

    // Son eklenen davalar
    db
      .select({
        id: cases.id,
        title: cases.title,
        caseType: cases.caseType,
        status: cases.status,
        automationStatus: cases.automationStatus,
        clientName: clients.fullName,
        createdAt: cases.createdAt,
      })
      .from(cases)
      .leftJoin(clients, eq(cases.clientId, clients.id))
      .where(eq(cases.userId, userId))
      .orderBy(desc(cases.createdAt))
      .limit(5),

    // Toplam tahsilatlar
    db
      .select({
        total: sql<string>`COALESCE(SUM(${collections.amount}::numeric), 0)::text`,
      })
      .from(collections)
      .innerJoin(cases, eq(collections.caseId, cases.id))
      .where(eq(cases.userId, userId)),

    // Beklenen tahsilatlar — contractedFee > toplam tahsilat olan davalar
    db
      .select({
        id: cases.id,
        title: cases.title,
        clientName: clients.fullName,
        contractedFee: cases.contractedFee,
        totalCollected: sql<string>`COALESCE(SUM(${collections.amount}::numeric), 0)::text`,
        remaining: sql<string>`(${cases.contractedFee}::numeric - COALESCE(SUM(${collections.amount}::numeric), 0))::text`,
      })
      .from(cases)
      .leftJoin(clients, eq(cases.clientId, clients.id))
      .leftJoin(collections, eq(collections.caseId, cases.id))
      .where(
        and(
          eq(cases.userId, userId),
          sql`${cases.contractedFee} IS NOT NULL`,
          sql`${cases.contractedFee}::numeric > 0`,
          eq(cases.status, 'active')
        )
      )
      .groupBy(cases.id, cases.title, cases.contractedFee, clients.fullName)
      .having(sql`${cases.contractedFee}::numeric > COALESCE(SUM(${collections.amount}::numeric), 0)`)
      .orderBy(sql`${cases.contractedFee}::numeric - COALESCE(SUM(${collections.amount}::numeric), 0) DESC`)
      .limit(10),

    // AI otomasyon durumu - automationStatus dagilimi
    db
      .select({
        automationStatus: cases.automationStatus,
        count: sql<number>`count(*)::int`,
      })
      .from(cases)
      .where(and(eq(cases.userId, userId), ne(cases.automationStatus, 'not_started')))
      .groupBy(cases.automationStatus),

    // AI isler - devam eden joblar
    db
      .select({
        id: aiJobs.id,
        caseId: aiJobs.caseId,
        jobType: aiJobs.jobType,
        title: aiJobs.title,
        status: aiJobs.status,
        caseTitle: cases.title,
      })
      .from(aiJobs)
      .innerJoin(cases, eq(aiJobs.caseId, cases.id))
      .where(
        and(
          eq(cases.userId, userId),
          sql`${aiJobs.status} IN ('in_progress', 'review_required', 'queued')`
        )
      )
      .orderBy(desc(aiJobs.updatedAt))
      .limit(5),
  ])

  // Dava sayılarını düzle
  const caseCount = {
    total: 0,
    active: 0,
    won: 0,
    lost: 0,
    settled: 0,
    closed: 0,
  }

  for (const stat of caseStats) {
    caseCount[stat.status as keyof typeof caseCount] = stat.count
    caseCount.total += stat.count
  }

  // AI otomasyon sayilarini duzle
  const aiStats: Record<string, number> = {}
  let aiActiveCount = 0
  for (const stat of aiAutomationStats) {
    aiStats[stat.automationStatus] = stat.count
    aiActiveCount += stat.count
  }

  res.json({
    cases: caseCount,
    upcomingHearings,
    pendingTasks,
    recentCases,
    financials: {
      totalCollections: totalCollections[0]?.total ?? '0',
    },
    outstandingFees,
    ai: {
      totalActive: aiActiveCount,
      statusBreakdown: aiStats,
      activeJobs: activeAiJobs,
    },
  })
})

export default router

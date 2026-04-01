import './env.js' // .env'i en başta yükle — diğer tüm import'lardan önce
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import path from 'path'
import { fileURLToPath } from 'url'
import cron from 'node-cron'
import { db } from './db/index.js'
import { caseHearings, tasks, notifications, cases } from './db/schema.js'
import { eq, and, gte, lte } from 'drizzle-orm'
import authRouter from './routes/auth.js'
import clientsRouter from './routes/clients.js'
import casesRouter from './routes/cases.js'
import hearingsRouter from './routes/hearings.js'
import tasksRouter from './routes/tasks.js'
import expensesRouter from './routes/expenses.js'
import collectionsRouter from './routes/collections.js'
import dashboardRouter from './routes/dashboard.js'
import notesRouter from './routes/notes.js'
import notificationsRouter from './routes/notifications.js'
import documentsRouter from './routes/documents.js'
import aiJobsRouter from './routes/aiJobs.js'
import intakeRouter from './routes/intake.js'
import researchRouter from './routes/research.js'
import procedureRouter from './routes/procedure.js'
import pleadingRouter from './routes/pleading.js'
import defenseSimulationRouter from './routes/defenseSimulation.js'
import ictihatRouter from './routes/ictihat.js'
import mediationRouter from './routes/mediation.js'
import { errorHandler } from './middleware/errorHandler.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

// ─── Güvenlik middleware'leri ─────────────────────────────────────────────────

app.use(
  helmet({
    contentSecurityPolicy: false, // SPA için devre dışı
  })
)

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 dakika
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Çok fazla istek gönderildi. 15 dakika sonra tekrar deneyin.' },
  })
)

// ─── CORS ─────────────────────────────────────────────────────────────────────

app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'development'
        ? process.env.CLIENT_URL || 'http://localhost:5173'
        : false,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)

// ─── Body / Cookie parsers ────────────────────────────────────────────────────

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser(process.env.COOKIE_SECRET))

// ─── Routes ───────────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Auth-free araç router'ları — en üstte, auth gerektiren router'lardan ÖNCE
app.use('/api', ictihatRouter)
app.use('/api', mediationRouter)

app.use('/api/auth', authRouter)
app.use('/api/clients', clientsRouter)
app.use('/api/cases', casesRouter)
app.use('/api/hearings', hearingsRouter)
app.use('/api/tasks', tasksRouter)
app.use('/api/expenses', expensesRouter)
app.use('/api/collections', collectionsRouter)
app.use('/api/dashboard', dashboardRouter)
app.use('/api/notes', notesRouter)
app.use('/api/notifications', notificationsRouter)
app.use('/api/documents', documentsRouter)
app.use('/api', aiJobsRouter)
app.use('/api', intakeRouter)
app.use('/api', researchRouter)
app.use('/api', procedureRouter)
app.use('/api', pleadingRouter)
app.use('/api', defenseSimulationRouter)

// ─── Production: React build'i serve et ──────────────────────────────────────

if (process.env.NODE_ENV === 'production') {
  const publicPath = path.join(__dirname, 'public')
  app.use(express.static(publicPath))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'))
  })
}

// ─── Global error handler ──────────────────────────────────────────────────────

app.use(errorHandler)

// ─── Server başlat ────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`✓ Server çalışıyor: http://localhost:${PORT}`)
  console.log(`  Ortam: ${process.env.NODE_ENV || 'development'}`)
})

// ─── Günlük bildirim cron'u (her sabah 09:00) ──────────────────────────────
cron.schedule('0 9 * * *', async () => {
  try {
    const now = new Date()
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    const threeDaysStart = new Date(threeDaysLater)
    threeDaysStart.setHours(0, 0, 0, 0)
    const threeDaysEnd = new Date(threeDaysLater)
    threeDaysEnd.setHours(23, 59, 59, 999)

    // 3 gün sonraki duruşmaları bul
    const upcomingHearings = await db
      .select({
        id: caseHearings.id,
        caseId: caseHearings.caseId,
        hearingDate: caseHearings.hearingDate,
        caseTitle: cases.title,
        userId: cases.userId,
      })
      .from(caseHearings)
      .innerJoin(cases, eq(caseHearings.caseId, cases.id))
      .where(
        and(
          gte(caseHearings.hearingDate, threeDaysStart),
          lte(caseHearings.hearingDate, threeDaysEnd)
        )
      )

    for (const hearing of upcomingHearings) {
      await db.insert(notifications).values({
        userId: hearing.userId,
        type: 'hearing',
        title: 'Duruşma Hatırlatması',
        message: `"${hearing.caseTitle}" davası için 3 gün sonra duruşma var.`,
        relatedId: hearing.caseId,
        relatedType: 'case',
        isRead: false,
      })
    }

    // 3 gün sonraki görevleri bul
    const upcomingTasks = await db
      .select()
      .from(tasks)
      .where(
        and(
          gte(tasks.dueDate, threeDaysStart),
          lte(tasks.dueDate, threeDaysEnd)
        )
      )

    for (const task of upcomingTasks) {
      await db.insert(notifications).values({
        userId: task.userId,
        type: 'task',
        title: 'Görev Hatırlatması',
        message: `"${task.title}" görevi için son 3 gün kaldı.`,
        relatedId: task.id,
        relatedType: 'task',
        isRead: false,
      })
    }

    console.log(`✓ Bildirim cron: ${upcomingHearings.length} duruşma, ${upcomingTasks.length} görev bildirimi oluşturuldu.`)
  } catch (err) {
    console.error('Bildirim cron hatası:', err)
  }
})

export default app

/**
 * ictihat.ts — In-app ictihat (court decision) and mevzuat (legislation) search routes
 *
 * Provides direct backend access to yargi CLI and mevzuat CLI so users
 * don't need to copy commands to a terminal.
 *
 * Self-contained runCommand implementation to avoid circular dependency
 * with research.ts.
 */

import { Router, type Request, type Response } from 'express'
import { spawn } from 'node:child_process'
import { getSingleValue } from '../utils/request.js'

const router = Router()
// Auth kaldırıldı — araştırma araçları genel amaçlı, dava verisine erişim yok

// ─── CLI Paths ──────────────────────────────────────────────────────────────

const YARGI_CMD = 'C:\\Users\\user\\AppData\\Roaming\\npm\\yargi.cmd'
const MEVZUAT_CMD = 'C:\\Users\\user\\AppData\\Roaming\\npm\\mevzuat.cmd'

// ─── Command Runner (self-contained to avoid circular deps) ─────────────────

async function runCommand(
  command: string,
  args: string[],
  timeoutMs = 60_000,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const quotePowerShellArg = (v: string) => `'${v.replace(/'/g, "''")}'`
    const commandLine = `& ${[command, ...args].map(quotePowerShellArg).join(' ')}`
    const child = spawn(
      'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',
      ['-NoProfile', '-Command', commandLine],
      { shell: false, windowsHide: true },
    )

    let stdout = ''
    let stderr = ''
    let timedOut = false

    const timeout = setTimeout(() => {
      timedOut = true
      child.kill()
    }, timeoutMs)

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf-8')
    })
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf-8')
    })
    child.on('error', (err) => {
      clearTimeout(timeout)
      reject(err)
    })
    child.on('close', (code) => {
      clearTimeout(timeout)
      if (timedOut) {
        reject(new Error('Komut zaman asimina ugradi.'))
        return
      }
      if (code !== 0) {
        reject(new Error(stderr.trim() || stdout.trim() || `Komut hata verdi (code ${code}).`))
        return
      }
      resolve(stdout.trim().replace(/^\uFEFF/, ''))
    })
  })
}

/** Safely parse CLI JSON output */
function parseJsonOutput<T>(raw: string): T {
  return JSON.parse(raw.trim().replace(/^\uFEFF/, '')) as T
}

// ─── POST /api/ictihat/search ───────────────────────────────────────────────
// Search court decisions via yargi bedesten search
// TODO: Add dedicated rate limiter for CLI-heavy endpoints

router.post('/ictihat/search', async (req: Request, res: Response) => {
  try {
    const { query, searchTerm, courtType, chamber, dateStart, dateEnd } = req.body as {
      query?: string
      searchTerm?: string
      courtType?: string
      chamber?: string
      dateStart?: string
      dateEnd?: string
    }

    const term = (query || searchTerm || '').trim()
    if (!term) {
      res.status(400).json({ error: 'Arama terimi (query) zorunludur.' })
      return
    }

    const args = ['bedesten', 'search', term]
    if (courtType) args.push('-c', courtType)
    if (chamber) args.push('-b', chamber)
    if (dateStart) args.push('--date-start', dateStart)
    if (dateEnd) args.push('--date-end', dateEnd)

    const raw = await runCommand(YARGI_CMD, args)
    const parsed = parseJsonOutput<{
      decisions?: Array<{
        documentId: string
        birimAdi?: string | null
        esasNo?: string | null
        kararNo?: string | null
        kararTarihiStr?: string | null
      }>
    }>(raw)

    res.json({
      totalFound: parsed.decisions?.length ?? 0,
      decisions: parsed.decisions ?? [],
    })
  } catch (error: any) {
    console.error('[ictihat/search] Hata:', error?.message)
    res.status(500).json({
      error: 'Ictihat aramasi basarisiz oldu.',
      detail: error?.message || 'Bilinmeyen hata.',
    })
  }
})

// ─── GET /api/ictihat/doc/:documentId ───────────────────────────────────────
// Get full court decision text

router.get('/ictihat/doc/:documentId', async (req: Request, res: Response) => {
  try {
    const documentId = getSingleValue(req.params.documentId)
    if (!documentId) {
      res.status(400).json({ error: 'documentId parametresi zorunludur.' })
      return
    }

    const raw = await runCommand(YARGI_CMD, ['bedesten', 'doc', documentId])
    const parsed = parseJsonOutput<{
      markdownContent?: string
      sourceUrl?: string
    }>(raw)

    res.json({
      markdownContent: parsed.markdownContent || '',
      sourceUrl: parsed.sourceUrl || null,
    })
  } catch (error: any) {
    console.error('[ictihat/doc] Hata:', error?.message)
    res.status(500).json({
      error: 'Karar metni alinamadi.',
      detail: error?.message || 'Bilinmeyen hata.',
    })
  }
})

// ─── POST /api/mevzuat/search ───────────────────────────────────────────────
// Search legislation via mevzuat CLI
// TODO: Add dedicated rate limiter for CLI-heavy endpoints

router.post('/mevzuat/search', async (req: Request, res: Response) => {
  try {
    const { query, searchTerm, title, types, legislationType, lawNumber, legislationNo } = req.body as {
      query?: string
      searchTerm?: string
      title?: string
      types?: string[]
      legislationType?: string
      lawNumber?: string
      legislationNo?: string
    }

    const term = query || searchTerm || ''
    const effectiveTypes = types || (legislationType ? [legislationType] : undefined)
    const effectiveLawNo = lawNumber || legislationNo

    if (!term && !title && !effectiveLawNo) {
      res.status(400).json({ error: 'En az bir arama kriteri (query, title veya lawNumber) gereklidir.' })
      return
    }

    const args: string[] = ['search']
    if (term) args.push(term)
    if (title) args.push('--title', title)
    if (effectiveTypes && Array.isArray(effectiveTypes) && effectiveTypes.length > 0) args.push('-t', ...effectiveTypes)
    if (effectiveLawNo) args.push('-n', effectiveLawNo)

    const raw = await runCommand(MEVZUAT_CMD, args)
    const parsed = parseJsonOutput<{
      documents?: Array<{
        mevzuatId: string
        mevzuatNo?: string | number
        mevzuatAdi?: string
        resmiGazeteTarihi?: string
      }>
    }>(raw)

    res.json({
      totalFound: parsed.documents?.length ?? 0,
      documents: parsed.documents ?? [],
    })
  } catch (error: any) {
    console.error('[mevzuat/search] Hata:', error?.message)
    res.status(500).json({
      error: 'Mevzuat aramasi basarisiz oldu.',
      detail: error?.message || 'Bilinmeyen hata.',
    })
  }
})

// ─── GET /api/mevzuat/doc/:mevzuatId ───────────────────────────────────────
// Get legislation full text

router.get('/mevzuat/doc/:mevzuatId', async (req: Request, res: Response) => {
  try {
    const mevzuatId = getSingleValue(req.params.mevzuatId)
    if (!mevzuatId) {
      res.status(400).json({ error: 'mevzuatId parametresi zorunludur.' })
      return
    }

    const raw = await runCommand(MEVZUAT_CMD, ['doc', mevzuatId])
    const parsed = parseJsonOutput<{
      markdownContent?: string
    }>(raw)

    res.json({
      markdownContent: parsed.markdownContent || '',
    })
  } catch (error: any) {
    console.error('[mevzuat/doc] Hata:', error?.message)
    res.status(500).json({
      error: 'Mevzuat metni alinamadi.',
      detail: error?.message || 'Bilinmeyen hata.',
    })
  }
})

// ─── GET /api/mevzuat/tree/:mevzuatId ──────────────────────────────────────
// Get article tree for a legislation

router.get('/mevzuat/tree/:mevzuatId', async (req: Request, res: Response) => {
  try {
    const mevzuatId = getSingleValue(req.params.mevzuatId)
    if (!mevzuatId) {
      res.status(400).json({ error: 'mevzuatId parametresi zorunludur.' })
      return
    }

    const raw = await runCommand(MEVZUAT_CMD, ['tree', mevzuatId])

    // mevzuat tree returns JSON array of articles
    let articles: unknown
    try {
      articles = parseJsonOutput<unknown>(raw)
    } catch {
      // If not valid JSON, return the raw text (tree output may be plain text)
      res.json({ rawContent: raw, articles: [] })
      return
    }

    res.json({
      articles: Array.isArray(articles) ? articles : [],
    })
  } catch (error: any) {
    console.error('[mevzuat/tree] Hata:', error?.message)
    res.status(500).json({
      error: 'Madde agaci alinamadi.',
      detail: error?.message || 'Bilinmeyen hata.',
    })
  }
})

// ─── POST /api/ictihat/research ─────────────────────────────────────────────
// AI-powered orchestrated research using Claude Opus with tool_use
// Uses the existing runOrchestratedResearch from researchOrchestrator.ts
// TODO: Add dedicated rate limiter — this endpoint is expensive (multiple LLM calls)

router.post('/ictihat/research', async (req: Request, res: Response) => {
  try {
    const {
      caseTitle,
      caseType,
      customCaseType,
      caseDescription,
      criticalPoint,
      briefingSummary,
      mainLegalAxis,
      searchKeywords,
      toneStrategy,
      secondaryRisks,
      proofRisks,
      anthropicApiKey,
    } = req.body as {
      caseTitle?: string
      caseType?: string
      customCaseType?: string
      caseDescription?: string
      criticalPoint?: string
      briefingSummary?: string
      mainLegalAxis?: string
      searchKeywords?: string
      toneStrategy?: string
      secondaryRisks?: string
      proofRisks?: string
      anthropicApiKey?: string
    }

    if (!caseTitle || typeof caseTitle !== 'string' || caseTitle.trim().length === 0) {
      res.status(400).json({ error: 'Dava baslik (caseTitle) zorunludur.' })
      return
    }

    if (!criticalPoint || typeof criticalPoint !== 'string' || criticalPoint.trim().length === 0) {
      res.status(400).json({ error: 'Kritik nokta (criticalPoint) zorunludur.' })
      return
    }

    // Dynamic import to avoid loading the orchestrator (and Anthropic SDK) at startup
    const { runOrchestratedResearch } = await import('../utils/researchOrchestrator.js')

    const result = await runOrchestratedResearch({
      caseTitle: caseTitle.trim(),
      caseType: caseType || null,
      customCaseType: customCaseType || null,
      caseDescription: caseDescription || null,
      criticalPoint: criticalPoint.trim(),
      briefingSummary: briefingSummary || null,
      mainLegalAxis: mainLegalAxis || null,
      searchKeywords: searchKeywords || null,
      toneStrategy: toneStrategy || null,
      secondaryRisks: secondaryRisks || null,
      proofRisks: proofRisks || null,
      anthropicApiKey: anthropicApiKey || null,
    })

    res.json({
      researchMarkdown: result.researchMarkdown,
      toolCallCount: result.toolCallCount,
      tokensUsed: result.tokensUsed,
      decisionsFound: result.decisionsFound,
      legislationFound: result.legislationFound,
      modelUsed: result.modelUsed,
    })
  } catch (error: any) {
    console.error('[ictihat/research] Hata:', error?.message)
    res.status(500).json({
      error: 'Akilli arastirma basarisiz oldu.',
      detail: error?.message || 'Bilinmeyen hata.',
    })
  }
})

export default router

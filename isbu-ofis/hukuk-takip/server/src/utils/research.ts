import fs from 'fs/promises'
import path from 'path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { caseBriefings, caseIntakeProfiles, caseResearchProfiles, cases } from '../db/schema.js'

type CaseRecord = typeof cases.$inferSelect
type IntakeProfileRecord = typeof caseIntakeProfiles.$inferSelect | null
type BriefingRecord = typeof caseBriefings.$inferSelect | null
type ResearchProfileRecord = typeof caseResearchProfiles.$inferSelect

export type ResearchSourceStatus = 'completed' | 'failed' | 'skipped'

export type ResearchSourceRun = {
  sourceType: 'yargi_mcp' | 'mevzuat_mcp' | 'notebooklm' | 'vector_db'
  sourceName: string
  status: ResearchSourceStatus
  query: string | null
  summary: string
  markdownContent: string
  errorMessage: string | null
}

type CommandResult = {
  stdout: string
  stderr: string
}

const YARGI_CMD = 'C:\\Users\\user\\AppData\\Roaming\\npm\\yargi.cmd'
const MEVZUAT_CMD = 'C:\\Users\\user\\AppData\\Roaming\\npm\\mevzuat.cmd'
const NOTEBOOKLM_CMD = 'C:\\Users\\user\\.local\\bin\\nlm.exe'
const VECTOR_DB_PATH = 'D:\\hukuk-vektordb\\vektor-db'
const VECTOR_QUERY_SCRIPT = fileURLToPath(new URL('./vector_query.py', import.meta.url))

// ─── Dava türüne göre akıllı daire ve mevzuat eşleme ───────────────────────

type CaseTypeMapping = {
  yargiChambers: string[]
  yargiCourtType: string
  mevzuatKeyLaws: Array<{ title: string; number: number }>
  defaultKeywords: string[]
}

const CASE_TYPE_MAPPINGS: Record<string, CaseTypeMapping> = {
  iscilik_alacagi: {
    yargiChambers: ['H9', 'H22'],
    yargiCourtType: 'YARGITAYKARARI',
    mevzuatKeyLaws: [
      { title: 'iş kanunu', number: 4857 },
      { title: 'iş mahkemeleri kanunu', number: 7036 },
    ],
    defaultKeywords: ['işçilik alacağı', 'kıdem tazminatı', 'fazla mesai'],
  },
  kidem_tazminati: {
    yargiChambers: ['H9', 'H22'],
    yargiCourtType: 'YARGITAYKARARI',
    mevzuatKeyLaws: [
      { title: 'iş kanunu', number: 4857 },
      { title: 'iş kanunu', number: 1475 },
    ],
    defaultKeywords: ['kıdem tazminatı', 'haklı fesih', 'hizmet süresi'],
  },
  ise_iade: {
    yargiChambers: ['H9', 'H22'],
    yargiCourtType: 'YARGITAYKARARI',
    mevzuatKeyLaws: [
      { title: 'iş kanunu', number: 4857 },
      { title: 'iş mahkemeleri kanunu', number: 7036 },
    ],
    defaultKeywords: ['işe iade', 'feshin geçersizliği', 'iş güvencesi'],
  },
  kira: {
    yargiChambers: ['H3', 'H6'],
    yargiCourtType: 'YARGITAYKARARI',
    mevzuatKeyLaws: [
      { title: 'türk borçlar kanunu', number: 6098 },
    ],
    defaultKeywords: ['kira', 'tahliye', 'kira tespit'],
  },
  tuketici: {
    yargiChambers: ['H3', 'H13', 'H17'],
    yargiCourtType: 'YARGITAYKARARI',
    mevzuatKeyLaws: [
      { title: 'tüketicinin korunması hakkında kanun', number: 6502 },
      { title: 'sigortacılık kanunu', number: 5684 },
    ],
    defaultKeywords: ['tüketici', 'ayıplı mal', 'hizmet', 'sigorta tahkim', 'tüketici hakem heyeti'],
  },
  tuketici_sigorta: {
    yargiChambers: ['H17', 'H3', 'H11'],
    yargiCourtType: 'YARGITAYKARARI',
    mevzuatKeyLaws: [
      { title: 'tüketicinin korunması hakkında kanun', number: 6502 },
      { title: 'sigortacılık kanunu', number: 5684 },
      { title: 'türk ticaret kanunu', number: 6102 },
    ],
    defaultKeywords: ['tüketici', 'sigorta', 'sigorta tahkim komisyonu', 'tüketici hakem heyeti', 'poliçe'],
  },
  sigorta: {
    yargiChambers: ['H17', 'H11'],
    yargiCourtType: 'YARGITAYKARARI',
    mevzuatKeyLaws: [
      { title: 'sigortacılık kanunu', number: 5684 },
      { title: 'türk ticaret kanunu', number: 6102 },
    ],
    defaultKeywords: ['sigorta', 'tazminat', 'poliçe', 'hasar', 'rücu'],
  },
  aile: {
    yargiChambers: ['H2'],
    yargiCourtType: 'YARGITAYKARARI',
    mevzuatKeyLaws: [
      { title: 'türk medeni kanunu', number: 4721 },
    ],
    defaultKeywords: ['boşanma', 'velayet', 'nafaka'],
  },
  tazminat: {
    yargiChambers: ['H4', 'H17'],
    yargiCourtType: 'YARGITAYKARARI',
    mevzuatKeyLaws: [
      { title: 'türk borçlar kanunu', number: 6098 },
    ],
    defaultKeywords: ['tazminat', 'haksız fiil', 'maddi manevi'],
  },
  ticaret: {
    yargiChambers: ['H11', 'H19'],
    yargiCourtType: 'YARGITAYKARARI',
    mevzuatKeyLaws: [
      { title: 'türk ticaret kanunu', number: 6102 },
    ],
    defaultKeywords: ['ticari', 'şirket', 'fatura'],
  },
  bosanma: {
    yargiChambers: ['H2'],
    yargiCourtType: 'YARGITAYKARARI',
    mevzuatKeyLaws: [
      { title: 'türk medeni kanunu', number: 4721 },
    ],
    defaultKeywords: ['boşanma', 'kusur', 'tazminat', 'nafaka', 'velayet'],
  },
  velayet: {
    yargiChambers: ['H2'],
    yargiCourtType: 'YARGITAYKARARI',
    mevzuatKeyLaws: [
      { title: 'türk medeni kanunu', number: 4721 },
    ],
    defaultKeywords: ['velayet', 'çocuk', 'kişisel ilişki', 'velayetin değiştirilmesi'],
  },
  mal_paylasimi: {
    yargiChambers: ['H8', 'H2'],
    yargiCourtType: 'YARGITAYKARARI',
    mevzuatKeyLaws: [
      { title: 'türk medeni kanunu', number: 4721 },
    ],
    defaultKeywords: ['mal rejimi', 'katılma alacağı', 'edinilmiş mallara katılma', 'katkı payı'],
  },
  icra: {
    yargiChambers: ['H12'],
    yargiCourtType: 'YARGITAYKARARI',
    mevzuatKeyLaws: [
      { title: 'icra ve iflas kanunu', number: 2004 },
    ],
    defaultKeywords: ['icra', 'itiraz', 'haciz', 'iflas', 'takip'],
  },
  ceza: {
    yargiChambers: ['C1', 'C3', 'C5', 'CGK'],
    yargiCourtType: 'YARGITAYKARARI',
    mevzuatKeyLaws: [
      { title: 'türk ceza kanunu', number: 5237 },
      { title: 'ceza muhakemesi kanunu', number: 5271 },
    ],
    defaultKeywords: ['ceza', 'sanık', 'müşteki', 'beraat', 'mahkumiyet'],
  },
  idare: {
    yargiChambers: ['D2', 'D5', 'D10'],
    yargiCourtType: 'DANISTAYKARARI',
    mevzuatKeyLaws: [
      { title: 'idari yargılama usulü kanunu', number: 2577 },
    ],
    defaultKeywords: ['idari işlem', 'iptal', 'tam yargı', 'idari dava'],
  },
}

function getCaseTypeMapping(caseType?: string | null, customCaseType?: string | null): CaseTypeMapping | null {
  if (!caseType) return null
  const normalized = caseType.toLowerCase().replace(/[\s-]+/gu, '_')
  const direct = CASE_TYPE_MAPPINGS[normalized]
  if (direct) return direct

  // "diger" seçilip customCaseType girilmişse, onu mapping'de ara
  if ((normalized === 'diger' || normalized === 'other') && customCaseType) {
    const customNormalized = customCaseType.toLowerCase().replace(/[\s-]+/gu, '_')
    const customDirect = CASE_TYPE_MAPPINGS[customNormalized]
    if (customDirect) return customDirect

    // Kısmi eşleşme: customCaseType mapping key'lerinden birini içeriyorsa
    for (const [key, mapping] of Object.entries(CASE_TYPE_MAPPINGS)) {
      if (customNormalized.includes(key) || key.includes(customNormalized)) {
        return mapping
      }
    }
    // Keywords ile eşleşme: customCaseType mapping'in defaultKeywords'ünde geçiyorsa
    for (const mapping of Object.values(CASE_TYPE_MAPPINGS)) {
      if (mapping.defaultKeywords.some((kw) => customNormalized.includes(kw.replace(/\s+/gu, '_')))) {
        return mapping
      }
    }
  }

  return null
}

function normalizeOptionalString(value?: string | null) {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

function parseDelimitedList(value?: string | null) {
  return (value || '')
    .split(/[,\n;]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function trimForPrompt(value: string | null | undefined, maxLength = 500) {
  if (!value) {
    return null
  }

  return value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value
}

function ensureJsonValue<T>(stdout: string): T {
  const trimmed = stdout.trim().replace(/^\uFEFF/, '')
  try {
    return JSON.parse(trimmed) as T
  } catch (e) {
    console.error(`[ensureJsonValue] JSON parse hatasi. Ham cikti (ilk 300 karakter): ${trimmed.slice(0, 300)}`)
    throw e
  }
}

function excerptMarkdown(value: string | null | undefined, maxLength = 1400) {
  if (!value) {
    return ''
  }

  const normalized = value.replace(/\r\n/g, '\n').trim()
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 3)}...` : normalized
}

async function runCommand(
  command: string,
  args: string[],
  options?: { shell?: boolean; timeoutMs?: number; env?: Record<string, string> }
): Promise<CommandResult> {
  return await new Promise((resolve, reject) => {
    const spawnEnv: Record<string, string> = {
      ...process.env as Record<string, string>,
      ...(options?.env || {}),
    }

    // Windows'ta .cmd/.bat dosyaları cmd.exe üzerinden çalıştırılmalı.
    // Node.js shell:true argümanları escape etmez, boşluklu string'leri böler.
    // cmd.exe /c ile doğrudan spawn edersek argümanlar düzgün aktarılır.
    const isCmd = command.endsWith('.cmd') || command.endsWith('.bat')
    const spawnCmd = (options?.shell || isCmd) ? 'cmd.exe' : command
    const spawnArgs = (options?.shell || isCmd) ? ['/c', command, ...args] : args

    const child = spawn(spawnCmd, spawnArgs, {
      shell: false,
      windowsHide: true,
      env: spawnEnv,
    })

    let stdout = ''
    let stderr = ''
    let timedOut = false

    const timeout = setTimeout(() => {
      timedOut = true
      child.kill()
    }, options?.timeoutMs ?? 120000)

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf-8')
    })

    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf-8')
    })

    child.on('error', (error) => {
      clearTimeout(timeout)
      reject(error)
    })

    child.on('close', (code) => {
      clearTimeout(timeout)

      if (timedOut) {
        reject(new Error(`Komut zaman asimina ugradi (${(options?.timeoutMs ?? 120000) / 1000}s): ${command} ${args.join(' ')}`))
        return
      }

      if (code !== 0) {
        const errMsg = stderr.trim() || stdout.trim() || `${command} komutu hata verdi.`
        console.error(`[runCommand] Hata (code ${code}): ${command} ${args.slice(0, 3).join(' ')} → ${errMsg.slice(0, 200)}`)
        reject(new Error(errMsg))
        return
      }

      resolve({ stdout, stderr })
    })
  })
}

/**
 * Yargı CLI için kısa, odaklı sorgu üretir.
 * Uzun araştırma sorusu yerine anahtar kelimeleri veya kısa özeti kullanır.
 * Yargı CLI 3-8 kelimelik sorgularla en iyi sonuç verir.
 */
/**
 * Keywords'den birden fazla kısa Yargı sorgusu üretir.
 * Tek uzun sorgu yerine paralel kısa sorgular çok daha iyi sonuç verir.
 */
function buildYargiQueries(
  question: string,
  keywords?: string | null,
  mainLegalAxis?: string | null,
): string[] {
  if (keywords) {
    const terms = keywords.split(',').map((t) => t.trim()).filter(Boolean)
    // Her keyword'ü max 4 kelimeye kısalt ve ayrı sorgu olarak döndür
    const queries = terms.slice(0, 4).map((t) => {
      const words = t.split(/\s+/)
      return words.slice(0, 4).join(' ')
    })
    return queries.length > 0 ? queries : [question.slice(0, 60)]
  }

  if (mainLegalAxis && mainLegalAxis.length < 80) {
    return [mainLegalAxis]
  }

  // Soruyu kısalt — ilk 60 karaktere kadar anlamlı kes
  if (question.length > 60) {
    const cut = question.slice(0, 60)
    const lastSpace = cut.lastIndexOf(' ')
    return [lastSpace > 20 ? cut.slice(0, lastSpace) : cut]
  }

  return [question]
}

// Geriye uyumluluk — tek sorgu döndüren wrapper
function buildShortYargiQuery(
  question: string,
  keywords?: string | null,
  mainLegalAxis?: string | null,
): string {
  return buildYargiQueries(question, keywords, mainLegalAxis)[0]
}

/**
 * Mevzuat CLI için kısa sorgu üretir.
 * Mevzuat araması keywords ile daha iyi sonuç verir.
 */
function buildShortMevzuatQuery(
  question: string,
  keywords?: string | null,
): string {
  if (keywords) {
    const terms = keywords.split(',').map((t) => t.trim()).filter(Boolean)
    // Mevzuat araması kısa terimlerle daha iyi çalışır — ilk 2 term, max 3 kelime
    return terms.slice(0, 2).map(t => t.split(/\s+/).slice(0, 3).join(' ')).join(' ')
  }

  if (question.length > 60) {
    const cut = question.slice(0, 60)
    const lastSpace = cut.lastIndexOf(' ')
    return lastSpace > 20 ? cut.slice(0, lastSpace) : cut
  }

  return question
}

export function buildEffectiveResearchQuestion(options: {
  caseRecord: CaseRecord
  intakeProfile: IntakeProfileRecord
  briefing: BriefingRecord
  profile: ResearchProfileRecord
}) {
  return (
    normalizeOptionalString(options.profile.researchQuestion) ||
    normalizeOptionalString(options.briefing?.summary) ||
    normalizeOptionalString(options.intakeProfile?.criticalPointSummary) ||
    normalizeOptionalString(options.caseRecord.description) ||
    options.caseRecord.title
  )
}

function buildResearchQuestionContext(options: {
  caseRecord: CaseRecord
  intakeProfile: IntakeProfileRecord
  briefing: BriefingRecord
  profile: ResearchProfileRecord
}) {
  const question = buildEffectiveResearchQuestion(options)
  const keywords = normalizeOptionalString(options.profile.searchKeywords)

  return {
    question,
    keywords,
    notebookQuestion:
      normalizeOptionalString(options.profile.notebooklmQuestion) ||
      [question, trimForPrompt(options.briefing?.summary), trimForPrompt(keywords)]
        .filter(Boolean)
        .join('\n\n'),
    yargiQuery:
      normalizeOptionalString(options.profile.yargiQuery) ||
      buildShortYargiQuery(question, keywords, options.intakeProfile?.mainLegalAxis),
    mevzuatQuery:
      normalizeOptionalString(options.profile.mevzuatQuery) ||
      normalizeOptionalString(options.profile.mevzuatScope) ||
      buildShortMevzuatQuery(question, keywords),
    vectorQuery:
      normalizeOptionalString(options.profile.vectorQuery) ||
      [question, trimForPrompt(options.briefing?.summary), trimForPrompt(keywords)]
        .filter(Boolean)
        .join('\n'),
  }
}

async function executeYargiSearch(
  query: string,
  courtTypes?: string[],
  chamber?: string | null,
  dateStart?: string | null,
  dateEnd?: string | null,
): Promise<Array<{
  documentId: string
  birimAdi?: string | null
  esasNo?: string | null
  kararNo?: string | null
  kararTarihiStr?: string | null
}>> {
  const args = ['bedesten', 'search', query]
  if (courtTypes && courtTypes.length > 0) args.push('-c', ...courtTypes)
  if (chamber) args.push('-b', chamber)
  if (dateStart) args.push('--date-start', dateStart)
  if (dateEnd) args.push('--date-end', dateEnd)

  const result = ensureJsonValue<{
    decisions?: Array<{
      documentId: string
      birimAdi?: string | null
      esasNo?: string | null
      kararNo?: string | null
      kararTarihiStr?: string | null
    }>
  }>((await runCommand(YARGI_CMD, args, { shell: true })).stdout)

  return result.decisions || []
}

async function fetchYargiDocument(documentId: string): Promise<{
  markdownContent: string
  sourceUrl?: string
}> {
  const result = ensureJsonValue<{
    markdownContent?: string
    sourceUrl?: string
  }>((await runCommand(YARGI_CMD, ['bedesten', 'doc', documentId], { shell: true })).stdout)
  return { markdownContent: result.markdownContent || '', sourceUrl: result.sourceUrl }
}

export async function runYargiResearch(options: {
  profile: ResearchProfileRecord
  query: string
  caseType?: string | null
  customCaseType?: string | null
}): Promise<ResearchSourceRun> {
  if (!options.profile.useYargiMcp) {
    return {
      sourceType: 'yargi_mcp',
      sourceName: 'Yargi MCP',
      status: 'skipped',
      query: null,
      summary: 'Kaynak kapali.',
      markdownContent: '# Yargi Notlari\n\nBu kaynak bu dava icin kapali.\n',
      errorMessage: null,
    }
  }

  const effectiveQuery = normalizeOptionalString(options.query)
  if (!effectiveQuery) {
    return {
      sourceType: 'yargi_mcp',
      sourceName: 'Yargi MCP',
      status: 'skipped',
      query: null,
      summary: 'Yargi sorgusu tanimli degil.',
      markdownContent: '# Yargi Notlari\n\nYargi icin sorgu tanimlanmadi.\n',
      errorMessage: null,
    }
  }

  try {
    const mapping = getCaseTypeMapping(options.caseType, options.customCaseType)

    // Manuel filtre varsa onu kullan, yoksa dava türünden otomatik al
    const courtTypes = parseDelimitedList(options.profile.yargiCourtTypes)
    const effectiveCourtTypes = courtTypes.length > 0
      ? courtTypes
      : mapping ? [mapping.yargiCourtType] : undefined

    const chamber = normalizeOptionalString(options.profile.yargiChamber)

    // Çoklu daire araması: her daire için ayrı sorgu yap
    const chamberList = chamber
      ? [chamber]
      : mapping ? mapping.yargiChambers : []

    // Keywords'den birden fazla kısa sorgu üret
    const queries = buildYargiQueries(
      effectiveQuery,
      normalizeOptionalString(options.profile.searchKeywords),
      null,
    )
    console.log(`[Yargi] ${queries.length} sorgu uretildi: ${queries.map(q => `"${q}"`).join(', ')}`)
    console.log(`[Yargi] Daire: ${chamber || chamberList.join(',') || 'genel'}, Mahkeme tipi: ${effectiveCourtTypes?.join(',') || 'tümü'}`)

    const limit = options.profile.yargiResultLimit || 8
    const allDecisions: Array<{
      documentId: string
      birimAdi?: string | null
      esasNo?: string | null
      kararNo?: string | null
      kararTarihiStr?: string | null
    }> = []

    const seenIds = new Set<string>()

    // Her sorgu + daire kombinasyonu için paralel arama
    const searchPromises: Promise<Array<typeof allDecisions[0]>>[] = []

    for (const query of queries) {
      if (chamberList.length > 0) {
        for (const ch of chamberList) {
          searchPromises.push(
            executeYargiSearch(query, effectiveCourtTypes, ch,
              options.profile.yargiDateStart, options.profile.yargiDateEnd)
              .catch(() => [])
          )
        }
        // HGK araması
        searchPromises.push(
          executeYargiSearch(query, effectiveCourtTypes, 'HGK',
            options.profile.yargiDateStart, options.profile.yargiDateEnd)
            .catch(() => [])
        )
      } else {
        searchPromises.push(
          executeYargiSearch(query, effectiveCourtTypes, null,
            options.profile.yargiDateStart, options.profile.yargiDateEnd)
            .catch(() => [])
        )
      }
    }

    const allResults = await Promise.all(searchPromises)
    for (const decisions of allResults) {
      for (const d of decisions) {
        if (!seenIds.has(d.documentId)) {
          seenIds.add(d.documentId)
          allDecisions.push(d)
        }
      }
    }

    const decisions = allDecisions.slice(0, limit)
    console.log(`[Yargi] Toplam ${allDecisions.length} karar bulundu, ${decisions.length} tanesi isleniyor.`)

    // Belge içeriklerini paralel çek
    const documents = await Promise.all(
      decisions.map(async (decision) => {
        try {
          const doc = await fetchYargiDocument(decision.documentId)
          return { decision, ...doc }
        } catch {
          return { decision, markdownContent: '', sourceUrl: undefined }
        }
      })
    )

    const summary =
      decisions.length > 0
        ? `${decisions.length} karar bulundu (${chamberList.length > 0 ? chamberList.join(', ') + ' + HGK' : 'genel'}).`
        : 'Arama tamamlandi ancak karar bulunamadi.'

    const markdownContent = [
      '# Yargi Notlari',
      '',
      `Sorgu: ${effectiveQuery}`,
      chamberList.length > 0 ? `Daireler: ${chamberList.join(', ')} + HGK` : '',
      '',
      decisions.length === 0
        ? 'Sonuc bulunamadi.'
        : decisions
            .map((decision, index) => {
              const doc = documents[index]
              return [
                `## ${index + 1}. ${decision.birimAdi || 'Birim belirtilmedi'}`,
                '',
                `- Esas: ${decision.esasNo || '-'}`,
                `- Karar: ${decision.kararNo || '-'}`,
                `- Tarih: ${decision.kararTarihiStr || '-'}`,
                `- Belge ID: ${decision.documentId}`,
                doc?.sourceUrl ? `- Kaynak: ${doc.sourceUrl}` : null,
                '',
                excerptMarkdown(doc?.markdownContent || '', 2800),
                '',
              ]
                .filter(Boolean)
                .join('\n')
            })
            .join('\n'),
    ].join('\n')

    return {
      sourceType: 'yargi_mcp',
      sourceName: 'Yargi MCP',
      status: 'completed',
      query: effectiveQuery,
      summary,
      markdownContent,
      errorMessage: null,
    }
  } catch (error: any) {
    console.error(`[Yargi] HATA: ${error?.message?.slice(0, 300)}`)
    return {
      sourceType: 'yargi_mcp',
      sourceName: 'Yargi MCP',
      status: 'failed',
      query: effectiveQuery,
      summary: 'Yargi sorgusu hata verdi.',
      markdownContent: `# Yargi Notlari\n\nSorgu hata verdi.\n\n\`\`\`\n${error?.message || 'Bilinmeyen hata'}\n\`\`\`\n`,
      errorMessage: error?.message || 'Bilinmeyen hata',
    }
  }
}

async function executeMevzuatSearch(
  query: string,
  titleSearch?: string | null,
  exact?: boolean,
  types?: string[],
  lawNumber?: string | null,
): Promise<Array<{
  mevzuatId: string
  mevzuatNo?: string | number
  mevzuatAdi?: string
  resmiGazeteTarihi?: string
}>> {
  const args: string[] = ['search']
  if (query) args.push(query)
  if (titleSearch) args.push('--title', titleSearch)
  if (exact) args.push('--exact')
  if (types && types.length > 0) args.push('-t', ...types)
  if (lawNumber) args.push('-n', lawNumber)

  const result = ensureJsonValue<{
    documents?: Array<{
      mevzuatId: string
      mevzuatNo?: string | number
      mevzuatAdi?: string
      resmiGazeteTarihi?: string
    }>
  }>((await runCommand(MEVZUAT_CMD, args, { shell: true })).stdout)

  return result.documents || []
}

export async function runMevzuatResearch(options: {
  profile: ResearchProfileRecord
  query: string
  caseType?: string | null
  customCaseType?: string | null
}): Promise<ResearchSourceRun> {
  if (!options.profile.useMevzuatMcp) {
    return {
      sourceType: 'mevzuat_mcp',
      sourceName: 'Mevzuat MCP',
      status: 'skipped',
      query: null,
      summary: 'Kaynak kapali.',
      markdownContent: '# Mevzuat Notlari\n\nBu kaynak bu dava icin kapali.\n',
      errorMessage: null,
    }
  }

  const effectiveQuery = normalizeOptionalString(options.query)
  if (!effectiveQuery) {
    return {
      sourceType: 'mevzuat_mcp',
      sourceName: 'Mevzuat MCP',
      status: 'skipped',
      query: null,
      summary: 'Mevzuat sorgusu tanimli degil.',
      markdownContent: '# Mevzuat Notlari\n\nMevzuat icin sorgu tanimlanmadi.\n',
      errorMessage: null,
    }
  }

  try {
    console.log(`[Mevzuat] Arama basliyor — sorgu: "${effectiveQuery}", caseType: ${options.caseType}`)
    const mapping = getCaseTypeMapping(options.caseType, options.customCaseType)
    const manualLawNumbers = parseDelimitedList(options.profile.mevzuatLawNumbers)
    console.log(`[Mevzuat] Mapping: ${mapping ? `bulundu (${mapping.mevzuatKeyLaws.map(l => l.number).join(',')})` : 'yok'}, Manuel kanun no: ${manualLawNumbers.join(',') || 'yok'}`)

    const allDocuments: Array<{
      mevzuatId: string
      mevzuatNo?: string | number
      mevzuatAdi?: string
      resmiGazeteTarihi?: string
    }> = []
    const seenIds = new Set<string>()

    // 1. Dava türüne göre temel kanunları çek (title + exact ile)
    const keyLaws = mapping?.mevzuatKeyLaws || []
    if (keyLaws.length > 0) {
      const keyLawResults = await Promise.all(
        keyLaws.map((law) =>
          executeMevzuatSearch('', law.title, true, ['KANUN'])
        )
      )
      for (const docs of keyLawResults) {
        for (const d of docs) {
          if (!seenIds.has(d.mevzuatId)) {
            seenIds.add(d.mevzuatId)
            allDocuments.push(d)
          }
        }
      }
    }

    // 2. Manuel kanun numaraları varsa ekle
    if (manualLawNumbers.length > 0) {
      for (const num of manualLawNumbers) {
        try {
          const docs = await executeMevzuatSearch(effectiveQuery, null, false, ['KANUN'], num)
          for (const d of docs) {
            if (!seenIds.has(d.mevzuatId)) {
              seenIds.add(d.mevzuatId)
              allDocuments.push(d)
            }
          }
        } catch {
          // Manual law number search failed, continue
        }
      }
    }

    // 3. İçerik araması (asıl sorgu ile)
    try {
      const contentDocs = await executeMevzuatSearch(effectiveQuery, null, false, ['KANUN'])
      for (const d of contentDocs) {
        if (!seenIds.has(d.mevzuatId)) {
          seenIds.add(d.mevzuatId)
          allDocuments.push(d)
        }
      }
    } catch {
      // Content search failed, continue with key laws
    }

    const limit = options.profile.mevzuatResultLimit || 5
    const documents = allDocuments.slice(0, limit)

    // Belge içeriklerini paralel çek
    const docContents = await Promise.all(
      documents.map(async (item) => {
        try {
          const docResult = ensureJsonValue<{ markdownContent?: string }>(
            (await runCommand(MEVZUAT_CMD, ['doc', item.mevzuatId], { shell: true })).stdout
          )
          return { item, markdownContent: docResult.markdownContent || '' }
        } catch {
          return { item, markdownContent: '' }
        }
      })
    )

    const summary =
      documents.length > 0
        ? `${documents.length} mevzuat metni bulundu.`
        : 'Arama tamamlandi ancak mevzuat sonucu bulunamadi.'

    const markdownContent = [
      '# Mevzuat Notlari',
      '',
      `Sorgu: ${effectiveQuery}`,
      options.profile.mevzuatScope ? `Kapsam Notu: ${options.profile.mevzuatScope}` : null,
      keyLaws.length > 0 ? `Temel Kanunlar: ${keyLaws.map((l) => `${l.number} (${l.title})`).join(', ')}` : null,
      '',
      documents.length === 0
        ? 'Sonuc bulunamadi.'
        : documents
            .map((document, index) => {
              const content = docContents[index]
              return [
                `## ${index + 1}. ${document.mevzuatAdi || 'Baslik belirtilmedi'}`,
                '',
                `- Mevzuat ID: ${document.mevzuatId}`,
                `- Mevzuat No: ${document.mevzuatNo || '-'}`,
                `- Resmi Gazete Tarihi: ${document.resmiGazeteTarihi || '-'}`,
                '',
                excerptMarkdown(content?.markdownContent || '', 2800),
                '',
              ]
                .filter(Boolean)
                .join('\n')
            })
            .join('\n'),
    ].join('\n')

    return {
      sourceType: 'mevzuat_mcp',
      sourceName: 'Mevzuat MCP',
      status: 'completed',
      query: effectiveQuery,
      summary,
      markdownContent,
      errorMessage: null,
    }
  } catch (error: any) {
    console.error(`[Mevzuat] HATA: ${error?.message?.slice(0, 300)}`)
    return {
      sourceType: 'mevzuat_mcp',
      sourceName: 'Mevzuat MCP',
      status: 'failed',
      query: effectiveQuery,
      summary: 'Mevzuat sorgusu hata verdi.',
      markdownContent: `# Mevzuat Notlari\n\nSorgu hata verdi.\n\n\`\`\`\n${error?.message || 'Bilinmeyen hata'}\n\`\`\`\n`,
      errorMessage: error?.message || 'Bilinmeyen hata',
    }
  }
}

/**
 * Notebook adını UUID'ye çevirir.
 * NLM CLI Türkçe karakter içeren isimlerle URL encoding sorunu yaşıyor.
 * UUID zaten geçerli bir formattaysa doğrudan döndürür.
 */
async function resolveNotebookId(nameOrId: string): Promise<string | null> {
  // Zaten UUID formatındaysa doğrudan döndür
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(nameOrId)) {
    return nameOrId
  }

  try {
    const result = await runCommand(NOTEBOOKLM_CMD, ['notebook', 'list', '--json'], {
      timeoutMs: 15000,
      env: { PYTHONIOENCODING: 'utf-8', NO_COLOR: '1' },
    })

    const notebooks = JSON.parse(result.stdout.trim().replace(/^\uFEFF/, '')) as Array<{
      id: string
      title: string
    }>

    // Case-insensitive karşılaştırma
    const match = notebooks.find(
      (nb) => nb.title.toLowerCase() === nameOrId.toLowerCase()
    )
    if (match) return match.id

    // Partial match dene
    const partial = notebooks.find(
      (nb) => nb.title.toLowerCase().includes(nameOrId.toLowerCase())
    )
    return partial?.id || null
  } catch (error: any) {
    console.error(`[NotebookLM] Notebook listesi alinamadi: ${error?.message?.slice(0, 200)}`)
    return null
  }
}

/**
 * NotebookLM Çalışma Alanı — çok sorulu workspace yaklaşımı
 *
 * Tek bir soru sormak yerine, kritik noktadan 3-5 hedefli soru türetir
 * ve notebook'a sırayla sorar. Her cevap bir sonraki soruyu zenginleştirir.
 * Sonuç: yapılandırılmış bir araştırma notu.
 */
export async function runNotebooklmResearch(options: {
  profile: ResearchProfileRecord
  question: string
  caseType?: string | null
}): Promise<ResearchSourceRun> {
  if (!options.profile.useNotebooklm) {
    return {
      sourceType: 'notebooklm',
      sourceName: 'NotebookLM',
      status: 'skipped',
      query: null,
      summary: 'Kaynak kapali.',
      markdownContent: '# NotebookLM Calisma Alani\n\nBu kaynak bu dava icin kapali.\n',
      errorMessage: null,
    }
  }

  const notebookInput = normalizeOptionalString(options.profile.notebooklmNotebook)
  const criticalPoint = normalizeOptionalString(options.question)

  if (!notebookInput || !criticalPoint) {
    return {
      sourceType: 'notebooklm',
      sourceName: 'NotebookLM',
      status: 'skipped',
      query: criticalPoint,
      summary: 'Notebook adi veya kritik nokta tanimli degil.',
      markdownContent: '# NotebookLM Calisma Alani\n\nNotebook adi veya kritik nokta tanimlanmadi.\n',
      errorMessage: null,
    }
  }

  // Notebook adını UUID'ye çevir — NLM CLI Türkçe isimlerle sorun yaşıyor
  const notebook = await resolveNotebookId(notebookInput)
  if (!notebook) {
    return {
      sourceType: 'notebooklm',
      sourceName: 'NotebookLM',
      status: 'failed',
      query: criticalPoint,
      summary: `"${notebookInput}" notebook bulunamadi.`,
      markdownContent: `# NotebookLM Calisma Alani\n\n"${notebookInput}" notebook bulunamadi. Notebook adini kontrol edin.\n`,
      errorMessage: `Notebook "${notebookInput}" bulunamadi`,
    }
  }

  console.log(`[NotebookLM] Notebook: "${notebookInput}" → ID: ${notebook}`)

  // Kritik noktadan hedefli sorular türet
  const questions = generateWorkspaceQuestions(criticalPoint, options.caseType || null)
  const qaResults: { question: string; answer: string; sources: number }[] = []
  let totalSources = 0
  let failCount = 0

  for (const q of questions) {
    try {
      const result = await runCommand(NOTEBOOKLM_CMD, ['notebook', 'query', notebook, q, '--json'], {
        timeoutMs: 90000,
        shell: true,
        env: {
          PYTHONIOENCODING: 'utf-8',
          NO_COLOR: '1',
        },
      })

      let answer = ''
      let sourceCount = 0
      try {
        const raw = result.stdout.trim().replace(/^\uFEFF/, '')
        const parsed = JSON.parse(raw) as Record<string, unknown>
        const data = (parsed.value ?? parsed) as {
          answer?: string
          sources_used?: string[]
          citations?: Record<string, string>
        }
        answer = data.answer || ''
        sourceCount = data.sources_used?.length || 0
      } catch {
        answer = result.stdout.trim()
      }

      qaResults.push({ question: q, answer: answer || '(Yanit bos)', sources: sourceCount })
      totalSources += sourceCount
    } catch (error: any) {
      const errMsg = error?.message || 'Bilinmeyen hata'
      console.error(`[NotebookLM] Soru hatasi: ${errMsg.slice(0, 100)}`)

      // Auth hatası → hemen dur, geri kalan sorulara geçme
      const isAuthError = errMsg.includes('Authentication expired') || errMsg.includes('AuthenticationError')
      if (isAuthError) {
        return {
          sourceType: 'notebooklm',
          sourceName: 'NotebookLM',
          status: 'failed',
          query: criticalPoint,
          summary: 'NotebookLM oturumu suresi dolmus. Terminalde "nlm login" calistirin.',
          markdownContent: '# NotebookLM Calisma Alani\n\nOturum suresi dolmus. Terminalde `nlm login` calistirin.\n',
          errorMessage: errMsg.slice(0, 500),
        }
      }

      qaResults.push({ question: q, answer: `_Hata: ${errMsg.slice(0, 150)}_`, sources: 0 })
      failCount++
    }
  }

  // Sonuçları markdown olarak derle
  const mdParts = [
    '# NotebookLM Calisma Alani',
    '',
    `Notebook: \`${notebook}\``,
    `Toplam ${qaResults.length} soru soruldu, ${totalSources} kaynak kullanildi.`,
    '',
  ]

  for (let i = 0; i < qaResults.length; i++) {
    const qa = qaResults[i]
    mdParts.push(`## Soru ${i + 1}: ${qa.question}`)
    mdParts.push('')
    mdParts.push(qa.answer)
    if (qa.sources > 0) {
      mdParts.push(`\n_${qa.sources} kaynak kullanildi._`)
    }
    mdParts.push('')
  }

  const successCount = qaResults.length - failCount

  return {
    sourceType: 'notebooklm',
    sourceName: 'NotebookLM',
    status: successCount > 0 ? 'completed' : 'failed',
    query: criticalPoint,
    summary: `${successCount}/${qaResults.length} soru cevaplandi, ${totalSources} kaynak kullanildi.`,
    markdownContent: mdParts.join('\n'),
    errorMessage: failCount > 0 ? `${failCount} soru cevaplanalamadi.` : null,
  }
}

/** Kritik noktadan 3-5 hedefli çalışma sorusu türet */
function generateWorkspaceQuestions(criticalPoint: string, caseType: string | null): string[] {
  // criticalPoint çok uzun olabilir (birden fazla paragraf).
  // NotebookLM API kısa sorgularla daha iyi çalışır — max 150 karakter
  let shortPoint = criticalPoint
  if (shortPoint.length > 150) {
    // İlk cümleyi veya ilk 150 karakteri al
    const firstSentenceEnd = shortPoint.search(/[.?!]\s/)
    if (firstSentenceEnd > 20 && firstSentenceEnd < 200) {
      shortPoint = shortPoint.slice(0, firstSentenceEnd + 1)
    } else {
      const cut = shortPoint.slice(0, 150)
      const lastSpace = cut.lastIndexOf(' ')
      shortPoint = lastSpace > 50 ? cut.slice(0, lastSpace) : cut
    }
  }

  const questions: string[] = []

  questions.push(
    `${shortPoint} konusunda temel hukuki ilkeler ve yerlesik ictihat egilimi nedir?`
  )

  questions.push(
    `${shortPoint} konusunda ispat yuku kime duser ve hangi deliller kabul edilir?`
  )

  questions.push(
    `${shortPoint} konusunda karsi tarafin kullanabilecegi savunma hatlari ve itiraz noktalari nelerdir?`
  )

  if (caseType === 'iscilik_alacagi' || caseType === 'is_davasi') {
    questions.push(
      `Isci ve isveren arasindaki uyusmazliklarda ${shortPoint} konusunun iscilik alacaklarina etkisi nedir?`
    )
  } else if (caseType === 'bosanma' || caseType === 'aile') {
    questions.push(
      `Aile hukukunda ${shortPoint} konusunun nafaka, velayet ve mal paylasimina etkisi nedir?`
    )
  } else if (caseType === 'kira') {
    questions.push(
      `Kira hukukunda ${shortPoint} konusundaki guncel Yargitay egilimi nedir?`
    )
  } else {
    questions.push(
      `${shortPoint} konusunda emsal kararlardaki ortak arguman kaliplari nelerdir?`
    )
  }

  questions.push(
    `${shortPoint} konusunda davanin kazanilmasi icin en etkili hukuki strateji ve arguman sirasi ne olmalidir?`
  )

  return questions
}

export async function runVectorResearch(options: {
  profile: ResearchProfileRecord
  query: string
}): Promise<ResearchSourceRun> {
  if (!options.profile.useVectorDb) {
    return {
      sourceType: 'vector_db',
      sourceName: 'Vector DB',
      status: 'skipped',
      query: null,
      summary: 'Kaynak kapali.',
      markdownContent: '# Vector DB Notlari\n\nBu kaynak bu dava icin kapali.\n',
      errorMessage: null,
    }
  }

  const effectiveQuery = normalizeOptionalString(options.query)
  if (!effectiveQuery) {
    return {
      sourceType: 'vector_db',
      sourceName: 'Vector DB',
      status: 'skipped',
      query: null,
      summary: 'Vector DB sorgusu tanimli degil.',
      markdownContent: '# Vector DB Notlari\n\nVector DB icin sorgu tanimlanmadi.\n',
      errorMessage: null,
    }
  }

  try {
    const collections = parseDelimitedList(options.profile.vectorCollections)
    const result = ensureJsonValue<{
      results?: Array<{
        collection: string
        status: string
        error?: string
        hits?: Array<{ document?: string; metadata?: Record<string, unknown> | null; distance?: number | null }>
      }>
    }>(
      (
        await runCommand('python', [
          VECTOR_QUERY_SCRIPT,
          '--db',
          VECTOR_DB_PATH,
          '--collections',
          collections.join(','),
          '--query',
          effectiveQuery,
          '--top-k',
          String(options.profile.vectorTopK || 5),
        ])
      ).stdout
    )

    const entries = result.results || []
    const completedEntries = entries.filter((entry) => entry.status === 'completed')

    const markdownContent = [
      '# Vector DB Notlari',
      '',
      `Sorgu: ${effectiveQuery}`,
      collections.length > 0 ? `Koleksiyonlar: ${collections.join(', ')}` : 'Koleksiyonlar: tumu',
      '',
      entries.length === 0
        ? 'Sonuc bulunamadi.'
        : entries
            .map((entry) => {
              const section = [
                `## ${entry.collection}`,
                '',
                entry.status === 'completed'
                  ? (entry.hits || [])
                      .map((hit, index) => {
                        return [
                          `### Hit ${index + 1}`,
                          hit.distance != null ? `- Mesafe: ${hit.distance}` : null,
                          hit.metadata ? `- Metadata: ${JSON.stringify(hit.metadata)}` : null,
                          '',
                          excerptMarkdown(hit.document || '', 1800),
                          '',
                        ]
                          .filter(Boolean)
                          .join('\n')
                      })
                      .join('\n')
                  : `Hata: ${entry.error || 'Bilinmeyen hata'}`,
              ]

              return section.join('\n')
            })
            .join('\n'),
    ].join('\n')

    return {
      sourceType: 'vector_db',
      sourceName: 'Vector DB',
      status: completedEntries.length > 0 ? 'completed' : 'failed',
      query: effectiveQuery,
      summary:
        completedEntries.length > 0
          ? `${completedEntries.length} koleksiyondan sonuc alindi.`
          : 'Vector DB sorgusu sonuc vermedi.',
      markdownContent,
      errorMessage:
        completedEntries.length > 0 ? null : entries.map((entry) => entry.error).filter(Boolean).join(' | ') || null,
    }
  } catch (error: any) {
    return {
      sourceType: 'vector_db',
      sourceName: 'Vector DB',
      status: 'failed',
      query: effectiveQuery,
      summary: 'Vector DB sorgusu hata verdi.',
      markdownContent: `# Vector DB Notlari\n\nVector DB sorgusu hata verdi.\n\n\`\`\`\n${error?.message || 'Bilinmeyen hata'}\n\`\`\`\n`,
      errorMessage: error?.message || 'Bilinmeyen hata',
    }
  }
}

export async function writeResearchArtifacts(options: {
  caseRecord: CaseRecord
  profile: ResearchProfileRecord
  intakeProfile: IntakeProfileRecord
  briefing: BriefingRecord
  sourceRuns: ResearchSourceRun[]
}) {
  const researchPath = options.caseRecord.researchPath
  const researchDir = researchPath ? path.dirname(researchPath) : null
  const timestamp = new Date().toLocaleString('tr-TR')
  const question = buildEffectiveResearchQuestion({
    caseRecord: options.caseRecord,
    intakeProfile: options.intakeProfile,
    briefing: options.briefing,
    profile: options.profile,
  })
  const keywords = normalizeOptionalString(options.profile.searchKeywords)

  const artifactPaths: Record<string, string | null> = {
    yargi_mcp: null,
    mevzuat_mcp: null,
    notebooklm: null,
    vector_db: null,
    research_report: researchPath || null,
  }

  if (researchDir) {
    await fs.mkdir(researchDir, { recursive: true })

    for (const run of options.sourceRuns) {
      const fileName =
        run.sourceType === 'yargi_mcp'
          ? 'yargi-notlari.md'
          : run.sourceType === 'mevzuat_mcp'
            ? 'mevzuat-notlari.md'
            : run.sourceType === 'notebooklm'
              ? 'notebooklm-notlari.md'
              : 'vector-notlari.md'

      const targetPath = path.join(researchDir, fileName)
      await fs.writeFile(targetPath, run.markdownContent, 'utf8')
      artifactPaths[run.sourceType] = targetPath
    }

    if (researchPath) {
      const successfulSources = options.sourceRuns.filter((run) => run.status === 'completed')
      const failedSources = options.sourceRuns.filter((run) => run.status === 'failed')
      const skippedSources = options.sourceRuns.filter((run) => run.status === 'skipped')

      const reportContent = [
        `# Arastirma Raporu: ${options.caseRecord.title}`,
        '',
        `- Hazirlanma: ${timestamp}`,
        `- Arastirma Sorusu: ${question}`,
        keywords ? `- Anahtar Kelimeler: ${keywords}` : null,
        options.briefing?.summary ? `- Briefing Ozeti: ${options.briefing.summary}` : null,
        options.intakeProfile?.mainLegalAxis
          ? `- Ana Hukuki Eksen: ${options.intakeProfile.mainLegalAxis}`
          : null,
        '',
        '## Kaynak Durumu',
        '',
        ...options.sourceRuns.map(
          (run) =>
            `- ${run.sourceName}: ${run.status.toUpperCase()}${run.query ? ` | Sorgu: ${run.query}` : ''}`
        ),
        '',
        '## Hizli Sentez',
        '',
        `- Basarili kaynak sayisi: ${successfulSources.length}`,
        `- Hata veren kaynak sayisi: ${failedSources.length}`,
        `- Atlanan kaynak sayisi: ${skippedSources.length}`,
        '',
        ...options.sourceRuns.map(
          (run) =>
            `### ${run.sourceName}\n\n${run.summary}\n${
              artifactPaths[run.sourceType] ? `\nDosya: \`${artifactPaths[run.sourceType]}\`\n` : ''
            }`
        ),
        '',
        '## Sonraki Adim',
        '',
        successfulSources.length > 0
          ? '1. Basarili kaynaklardan cikartilan argumanlar usul ve dilekce hattina tasinmali.'
          : '1. Kaynak sorgulari genisletilmeli veya manuel dogrulama yapilmali.',
        failedSources.length > 0
          ? '2. Hata veren kaynaklarin baglanti/kimlik dogrulama sorunlari kontrol edilmeli.'
          : '2. Arastirma kalite kontrolu asamasina gecilebilir.',
        '',
      ]
        .filter(Boolean)
        .join('\n')

      await fs.writeFile(researchPath, reportContent, 'utf8')
    }
  }

  return artifactPaths
}

export function summarizeResearchRun(sourceRuns: ResearchSourceRun[]) {
  const completed = sourceRuns.filter((item) => item.status === 'completed').length
  const failed = sourceRuns.filter((item) => item.status === 'failed').length
  const skipped = sourceRuns.filter((item) => item.status === 'skipped').length

  if (completed > 0 && failed === 0) {
    return `Arastirma tamamlandi. ${completed} kaynak basarili, ${skipped} kaynak atlandi.`
  }

  if (completed > 0 && failed > 0) {
    return `Arastirma kismen tamamlandi. ${completed} kaynak basarili, ${failed} kaynak hata verdi, ${skipped} kaynak atlandi.`
  }

  if (failed > 0) {
    return `Arastirma basarisiz. ${failed} kaynak hata verdi, ${skipped} kaynak atlandi.`
  }

  return 'Arastirma calistirildi ancak aktif kaynak bulunamadi.'
}

export function deriveResearchRunStatus(sourceRuns: ResearchSourceRun[]) {
  const completed = sourceRuns.filter((item) => item.status === 'completed').length
  const failed = sourceRuns.filter((item) => item.status === 'failed').length

  if (completed > 0 && failed === 0) {
    return 'completed' as const
  }

  if (completed > 0 && failed > 0) {
    return 'partial' as const
  }

  if (failed > 0) {
    return 'failed' as const
  }

  return 'idle' as const
}

export { buildResearchQuestionContext, normalizeOptionalString, getCaseTypeMapping, executeYargiSearch, fetchYargiDocument, executeMevzuatSearch }
export type { CaseTypeMapping }

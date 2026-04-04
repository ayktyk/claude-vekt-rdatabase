import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const DEFAULT_ACTIVE_CASES_ROOT = "G:\\Drive'im\\Hukuk Burosu\\Aktif Davalar"
const ACTIVE_CASES_ROOT = normalizeWindowsPath(
  process.env.AI_ACTIVE_CASES_ROOT || DEFAULT_ACTIVE_CASES_ROOT
)
const CURRENT_FILE_DIRECTORY = path.dirname(fileURLToPath(import.meta.url))
const TEMPLATE_DIRECTORY_CANDIDATES = [
  path.resolve(CURRENT_FILE_DIRECTORY, '../../../../../sablonlar'),
  path.resolve(process.cwd(), 'sablonlar'),
  path.resolve(process.cwd(), '../sablonlar'),
  path.resolve(process.cwd(), '../../sablonlar'),
  path.resolve(process.cwd(), '../../../sablonlar'),
]
const CASE_TYPE_LABELS: Record<string, string> = {
  iscilik_alacagi: 'Iscilik Alacagi',
  bosanma: 'Bosanma',
  velayet: 'Velayet',
  mal_paylasimi: 'Mal Paylasimi',
  kira: 'Kira',
  tuketici: 'Tuketici',
  icra: 'Icra',
  ceza: 'Ceza',
  idare: 'Idare',
  diger: 'Diger',
}
let templateDirectoryPromise: Promise<string | null> | null = null
const CHECKLIST_AUTO_ROWS_START = '<!-- AUTO-DOCUMENT-ROWS:START -->'
const CHECKLIST_AUTO_ROWS_END = '<!-- AUTO-DOCUMENT-ROWS:END -->'
const CHECKLIST_CLASSIFIED_ROWS_START = '<!-- AUTO-CLASSIFIED-ROWS:START -->'
const CHECKLIST_CLASSIFIED_ROWS_END = '<!-- AUTO-CLASSIFIED-ROWS:END -->'
const CHECKLIST_MISSING_ROWS_START = '<!-- AUTO-MISSING-ROWS:START -->'
const CHECKLIST_MISSING_ROWS_END = '<!-- AUTO-MISSING-ROWS:END -->'

type ChecklistDocumentInput = {
  fileName: string
  createdAt?: Date | string | null
  description?: string | null
}

type ChecklistDocumentInsight = ChecklistDocumentInput & {
  normalizedSearchText: string
  category: ChecklistCategoryDefinition | null
}

type ChecklistCategoryDefinition = {
  key: string
  label: string
  folderName: string
  proof: string
  keywords: string[]
}

type ChecklistRequirement = {
  key: string
  label: string
  source: string
  urgency: 'Yuksek' | 'Orta' | 'Dusuk'
  note: string
  categoryKeys: string[]
  keywords?: string[]
}

const DOCUMENT_CATEGORY_DEFINITIONS: ChecklistCategoryDefinition[] = [
  {
    key: 'vekaletname',
    label: 'vekaletname',
    folderName: 'Vekaletname',
    proof: 'Temsil yetkisi ve dosya takip yetkisi',
    keywords: ['vekalet', 'vekâlet'],
  },
  {
    key: 'kimlik',
    label: 'kimlik',
    folderName: 'Kimlik',
    proof: 'Taraf kimligi ve temel kimlik bilgileri',
    keywords: ['kimlik', 'nufus', 'nüfus', 'ehliyet', 'pasaport', 'tc '],
  },
  {
    key: 'sgk',
    label: 'sgk',
    folderName: 'SGK',
    proof: 'Calisma sureleri, sigortalilik gecmisi veya isveren kayitlari',
    keywords: ['sgk', 'hizmet dokum', 'hizmet dökum', '4a', '4b', 'ise giris', 'ise cikis'],
  },
  {
    key: 'bordro',
    label: 'bordro-ucret',
    folderName: 'Bordro-Ucret',
    proof: 'Ucret, mesai, puantaj veya calisma duzeni',
    keywords: ['bordro', 'maas', 'maaş', 'ucret', 'ücret', 'puantaj', 'mesai'],
  },
  {
    key: 'banka',
    label: 'banka',
    folderName: 'Banka',
    proof: 'Odeme akisi, tahsilat veya hesap hareketleri',
    keywords: ['banka', 'iban', 'hesap hareket', 'ekstre', 'dekont', 'swift'],
  },
  {
    key: 'sozlesme',
    label: 'sozlesme',
    folderName: 'Sozlesme',
    proof: 'Taraflar arasindaki sozlesme veya protokol iliskisi',
    keywords: ['sozlesme', 'sözlesme', 'protokol', 'anlasma', 'anlaşma', 'taahhut', 'taahhutname'],
  },
  {
    key: 'saglik',
    label: 'saglik',
    folderName: 'Saglik',
    proof: 'Saglik durumu, rapor veya tedavi kaydi',
    keywords: ['saglik', 'sağlik', 'rapor', 'epikriz', 'hastane', 'recete', 'reçete'],
  },
  {
    key: 'tapu',
    label: 'tapu',
    folderName: 'Tapu',
    proof: 'Mulkiyet, tasinmaz veya kayit bilgisi',
    keywords: ['tapu', 'parsel', 'imar', 'rayic', 'rayiç', 'arsa'],
  },
  {
    key: 'noter',
    label: 'noter-ihtar',
    folderName: 'Noter-Ihtar',
    proof: 'Ihtar, teblig veya resmi bildirim akisi',
    keywords: ['noter', 'ihtar', 'ihtarname', 'teblig', 'tebligat', 'fesih bildir'],
  },
  {
    key: 'bilirkisi',
    label: 'bilirkisi',
    folderName: 'Bilirkisi',
    proof: 'Teknik tespit veya hesap raporu',
    keywords: ['bilirkisi', 'bilirkişi', 'uzman raporu'],
  },
  {
    key: 'durusma',
    label: 'durusma-mahkeme',
    folderName: 'Durusma-Mahkeme',
    proof: 'Yargilama sureci, tensip veya ara karar akisi',
    keywords: ['durusma', 'mahkeme', 'tensip', 'ara karar', 'uyap', 'müzekkere', 'mzekkere'],
  },
  {
    key: 'yazisma',
    label: 'yazisma',
    folderName: 'Yazisma',
    proof: 'Taraflar arasindaki iletisim ve irade aciklamalari',
    keywords: ['whatsapp', 'mail', 'e-posta', 'eposta', 'mesaj', 'sms', 'yazisma'],
  },
]

const BASE_MISSING_REQUIREMENTS: ChecklistRequirement[] = [
  {
    key: 'vekaletname',
    label: 'Vekaletname',
    source: 'Muvekkil / noter',
    urgency: 'Yuksek',
    note: 'Dosya takibi ve temsil yetkisi icin temel belge',
    categoryKeys: ['vekaletname'],
  },
  {
    key: 'kimlik',
    label: 'Kimlik fotokopisi',
    source: 'Muvekkil',
    urgency: 'Orta',
    note: 'Taraf teyidi ve ekler icin faydali temel belge',
    categoryKeys: ['kimlik'],
  },
]

const CASE_SPECIFIC_MISSING_REQUIREMENTS: Partial<Record<string, ChecklistRequirement[]>> = {
  iscilik_alacagi: [
    {
      key: 'sgk',
      label: 'SGK hizmet dokumu / ise giris-cikis kaydi',
      source: 'e-Devlet / SGK',
      urgency: 'Yuksek',
      note: 'Calisma sureleri ve sigortalilik gecmisi icin kritik',
      categoryKeys: ['sgk'],
    },
    {
      key: 'bordro',
      label: 'Bordro / puantaj / ucret kaydi',
      source: 'Muvekkil / isveren kayitlari',
      urgency: 'Yuksek',
      note: 'Ucret, mesai ve alacak hesabini destekler',
      categoryKeys: ['bordro'],
    },
    {
      key: 'banka',
      label: 'Banka hesap hareketleri / maas dekontlari',
      source: 'Banka',
      urgency: 'Orta',
      note: 'Odeme alip alinmadigi ve tutarlar icin destekleyici belge',
      categoryKeys: ['banka'],
    },
    {
      key: 'iscilik_yazisma',
      label: 'Fesih / ihtar / calisma yazismalari',
      source: 'Noter / muvekkil telefonu / e-posta',
      urgency: 'Orta',
      note: 'Hakli fesih, talep ve bildirime iliskin delil olabilir',
      categoryKeys: ['noter', 'yazisma'],
      keywords: ['fesih', 'ihtar', 'mesaj', 'mail', 'whatsapp'],
    },
  ],
  bosanma: [
    {
      key: 'bosanma_protokol',
      label: 'Anlasma protokolu veya protokol taslagi',
      source: 'Muvekkil / karsi taraf',
      urgency: 'Orta',
      note: 'Anlasmali senaryoda sureci hizlandirir',
      categoryKeys: ['sozlesme'],
      keywords: ['protokol', 'anlasma', 'anlaşma'],
    },
    {
      key: 'bosanma_yazisma',
      label: 'Taraflar arasi mesaj / e-posta kayitlari',
      source: 'Telefon / e-posta',
      urgency: 'Orta',
      note: 'Anlasmazlik basliklari ve iletisim gecmisi icin yararlidir',
      categoryKeys: ['yazisma'],
    },
  ],
  velayet: [
    {
      key: 'velayet_yazisma',
      label: 'Cocukla ilgili yazisma ve iletisim kayitlari',
      source: 'Telefon / e-posta / mesajlasma kayitlari',
      urgency: 'Orta',
      note: 'Bakim duzeni ve ebeveyn iletisimi icin destekleyici olabilir',
      categoryKeys: ['yazisma'],
    },
    {
      key: 'velayet_saglik',
      label: 'Saglik / okul / gelisim destek belgeleri',
      source: 'Okul / hastane / muvekkil',
      urgency: 'Orta',
      note: 'Cocugun ustun yarari degerlendirmesi icin yararlidir',
      categoryKeys: ['saglik'],
      keywords: ['okul', 'rehberlik', 'psikolog', 'rapor'],
    },
  ],
  mal_paylasimi: [
    {
      key: 'mal_tapu',
      label: 'Tapu / tasinmaz kayitlari',
      source: 'Tapu / e-Devlet / muvekkil',
      urgency: 'Yuksek',
      note: 'Malvarligi tespiti icin temel belge',
      categoryKeys: ['tapu'],
    },
    {
      key: 'mal_banka',
      label: 'Banka hesap hareketleri',
      source: 'Banka',
      urgency: 'Orta',
      note: 'Finansal varlik ve para hareketleri icin destekleyici',
      categoryKeys: ['banka'],
    },
    {
      key: 'mal_sozlesme',
      label: 'Satim / devir / kredi sozlesmeleri',
      source: 'Muvekkil / banka / ilgili kurum',
      urgency: 'Orta',
      note: 'Mal edinim tarihlerinin ve bedellerin ispatinda kullanilir',
      categoryKeys: ['sozlesme'],
    },
  ],
  kira: [
    {
      key: 'kira_sozlesme',
      label: 'Kira sozlesmesi',
      source: 'Muvekkil / kiraya veren',
      urgency: 'Yuksek',
      note: 'Temel hukuki iliski ve sartlar icin ana belge',
      categoryKeys: ['sozlesme'],
      keywords: ['kira sozles', 'tahliye taahhut'],
    },
    {
      key: 'kira_banka',
      label: 'Kira odeme dekontlari / hesap hareketleri',
      source: 'Banka',
      urgency: 'Orta',
      note: 'Odeme duzeni ve borc miktari icin onemli',
      categoryKeys: ['banka'],
    },
    {
      key: 'kira_ihtar',
      label: 'Ihtarname / tahliye bildirimi',
      source: 'Noter / muvekkil',
      urgency: 'Orta',
      note: 'Temerrut veya tahliye surecini destekler',
      categoryKeys: ['noter'],
    },
  ],
  tuketici: [
    {
      key: 'tuketici_fatura',
      label: 'Fatura / siparis formu / satis sozlesmesi',
      source: 'Satici / e-ticaret platformu / muvekkil',
      urgency: 'Yuksek',
      note: 'Satis iliskisi ve bedel icin temel belge',
      categoryKeys: ['sozlesme'],
      keywords: ['fatura', 'siparis', 'satis', 'garanti'],
    },
    {
      key: 'tuketici_banka',
      label: 'Odeme dekontu / kart ekstresi',
      source: 'Banka / kart ekstresi',
      urgency: 'Yuksek',
      note: 'Bedelin odendigini gosterir',
      categoryKeys: ['banka'],
    },
    {
      key: 'tuketici_yazisma',
      label: 'Servis / satici yazismalari',
      source: 'E-posta / mesajlasma / cagri merkezi kayitlari',
      urgency: 'Orta',
      note: 'Ayip bildirimi ve talep gecmisi icin onemli',
      categoryKeys: ['yazisma'],
    },
  ],
  icra: [
    {
      key: 'icra_dosya',
      label: 'Takip evraki / odeme emri / tebligat',
      source: 'UYAP / icra dosyasi / muvekkil',
      urgency: 'Yuksek',
      note: 'Takibin asamasi ve sureler icin temel belge',
      categoryKeys: ['durusma', 'noter'],
      keywords: ['odeme emri', 'takip', 'icra', 'tebligat'],
    },
    {
      key: 'icra_banka',
      label: 'Odeme dekontlari / hesap hareketleri',
      source: 'Banka',
      urgency: 'Orta',
      note: 'Borc odemesi veya tahsilat hareketi icin gerekli olabilir',
      categoryKeys: ['banka'],
    },
  ],
  ceza: [
    {
      key: 'ceza_evrak',
      label: 'Sorusturma / kovusturma evraki',
      source: 'UYAP / savcilik / mahkeme',
      urgency: 'Yuksek',
      note: 'Dosya kapsamindaki resmi surec belgeleri kritik onemdedir',
      categoryKeys: ['durusma'],
      keywords: ['iddianame', 'ifad', 'tutanak', 'mahkeme'],
    },
    {
      key: 'ceza_yazisma',
      label: 'Olaya iliskin mesaj / iletisim kayitlari',
      source: 'Telefon / e-posta / mesajlasma kayitlari',
      urgency: 'Orta',
      note: 'Olay akisina iliskin destekleyici delil olabilir',
      categoryKeys: ['yazisma'],
    },
  ],
  idare: [
    {
      key: 'idare_tebligat',
      label: 'Idari islem / ret cevabi / tebligat',
      source: 'Kurum / e-Devlet / muvekkil',
      urgency: 'Yuksek',
      note: 'Sure ve iptal konusu idari islemin tespiti icin gereklidir',
      categoryKeys: ['noter', 'durusma'],
      keywords: ['ret', 'kurum', 'islem', 'tebligat', 'karar'],
    },
    {
      key: 'idare_yazisma',
      label: 'Basvuru dilekcesi ve kurum yazismalari',
      source: 'Kurum / muvekkil',
      urgency: 'Orta',
      note: 'Basvuru gecmisi ve cevap sureci icin yararlidir',
      categoryKeys: ['yazisma', 'durusma'],
      keywords: ['basvuru', 'dilekce', 'cevap', 'kurum'],
    },
  ],
}

function normalizeWindowsPath(value: string) {
  return value.replace(/[\\/]+/g, '\\').replace(/\\$/, '')
}

function normalizeOptionalText(value?: string | null) {
  if (typeof value !== 'string') {
    return '-'
  }

  const trimmed = value.trim()
  return trimmed === '' ? '-' : trimmed
}

function formatIsoDate(value?: Date | string | null) {
  const parsed = value ? new Date(value) : new Date()
  const fallback = new Date()
  const safeDate = Number.isNaN(parsed.getTime()) ? fallback : parsed
  return safeDate.toISOString().slice(0, 10)
}

function formatCaseTypeLabel(caseType?: string | null) {
  if (!caseType) {
    return 'Diger'
  }

  return CASE_TYPE_LABELS[caseType] || caseType.replace(/_/g, ' ')
}

function normalizeSearchText(value: string) {
  return value
    .toLocaleLowerCase('tr-TR')
    .replace(/[ıİ]/g, 'i')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function fillTemplate(template: string, replacements: Record<string, string>) {
  let content = template

  for (const [placeholder, value] of Object.entries(replacements)) {
    content = content.replace(new RegExp(escapeRegExp(placeholder), 'g'), value)
  }

  return content
}

async function resolveTemplateDirectory() {
  if (!templateDirectoryPromise) {
    templateDirectoryPromise = (async () => {
      for (const candidate of TEMPLATE_DIRECTORY_CANDIDATES) {
        try {
          await fs.access(path.join(candidate, 'advanced-briefing-template.md'))
          return candidate
        } catch {
          continue
        }
      }

      return null
    })()
  }

  return templateDirectoryPromise
}

async function readTemplateFile(templateName: string) {
  const templateDirectory = await resolveTemplateDirectory()

  if (!templateDirectory) {
    return null
  }

  try {
    return await fs.readFile(path.join(templateDirectory, templateName), 'utf8')
  } catch {
    return null
  }
}

function slugify(value: string) {
  return value
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'i')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}

export function ensureWorkspaceRoot(targetPath: string) {
  const normalized = normalizeWindowsPath(targetPath)
  if (
    normalized !== ACTIVE_CASES_ROOT &&
    !normalized.toLowerCase().startsWith(`${ACTIVE_CASES_ROOT.toLowerCase()}\\`)
  ) {
    throw new Error('AI Workspace yolu izinli Drive kokunun disina cikamaz.')
  }

  return normalized
}

export function deriveAutomationCaseCode(input: {
  createdAt?: Date | string | null
  title: string
  caseId: string
}) {
  const createdAt = input.createdAt ? new Date(input.createdAt) : new Date()
  const year = Number.isNaN(createdAt.getTime()) ? new Date().getFullYear() : createdAt.getFullYear()
  const titleSlug = slugify(input.title) || 'dava'
  const shortId = input.caseId.replace(/-/g, '').slice(0, 6).toLowerCase()
  return `${year}-${titleSlug}-${shortId}`
}

export function buildWorkspaceLayout(basePath: string) {
  const root = ensureWorkspaceRoot(basePath)

  return {
    root,
    directories: [
      root,
      path.win32.join(root, '01-Usul'),
      path.win32.join(root, '02-Arastirma'),
      path.win32.join(root, '03-Sentez-ve-Dilekce'),
      path.win32.join(root, '04-Muvekkil-Belgeleri'),
      path.win32.join(root, '04-Muvekkil-Belgeleri', '00-Ham'),
      path.win32.join(root, '04-Muvekkil-Belgeleri', '01-Tasnif'),
      path.win32.join(root, '05-Durusma-Notlari'),
    ],
    files: {
      briefingPath: path.win32.join(root, '00-Briefing.md'),
      procedurePath: path.win32.join(root, '01-Usul', 'usul-raporu.md'),
      researchPath: path.win32.join(root, '02-Arastirma', 'arastirma-raporu.md'),
      defenseSimulationPath: path.win32.join(root, '02-Arastirma', 'savunma-simulasyonu.md'),
      revisionPath: path.win32.join(root, '03-Sentez-ve-Dilekce', 'revizyon-raporu-v1.md'),
      pleadingMdPath: path.win32.join(root, '03-Sentez-ve-Dilekce', 'dava-dilekcesi-v1.md'),
      pleadingUdfPath: path.win32.join(root, '03-Sentez-ve-Dilekce', 'dava-dilekcesi-v1.udf'),
      evidenceChecklistPath: path.win32.join(root, '04-Muvekkil-Belgeleri', 'evrak-listesi.md'),
    },
  }
}

function sanitizeMarkdownTableCell(value?: string | null) {
  if (typeof value !== 'string') {
    return '-'
  }

  const sanitized = value.replace(/\r?\n+/g, ' ').replace(/\|/g, '/').trim()
  return sanitized === '' ? '-' : sanitized
}

function formatChecklistDocumentDate(value?: Date | string | null) {
  if (!value) {
    return '-'
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return '-'
  }

  return parsed.toISOString().slice(0, 10)
}

function buildDocumentInsight(document: ChecklistDocumentInput): ChecklistDocumentInsight {
  const normalizedSearchText = normalizeSearchText(
    `${document.fileName} ${document.description ?? ''}`
  )
  const category =
    DOCUMENT_CATEGORY_DEFINITIONS.find((definition) =>
      definition.keywords.some((keyword) =>
        normalizedSearchText.includes(normalizeSearchText(keyword))
      )
    ) ?? null

  return {
    ...document,
    normalizedSearchText,
    category,
  }
}

function buildManagedChecklistRows(documents: ChecklistDocumentInsight[]) {
  if (documents.length === 0) {
    return ['| _Henuz otomatik kayit yok_ | - | - | - | - |']
  }

  return documents.map((document) => {
    const noteParts = [sanitizeMarkdownTableCell(document.description)]
    return `| ${sanitizeMarkdownTableCell(document.fileName)} | ${formatChecklistDocumentDate(document.createdAt)} | hukuk-takip | ${sanitizeMarkdownTableCell(document.category?.label || 'belirsiz')} | ${noteParts.join(' ')} |`
  })
}

function buildClassifiedChecklistRows(documents: ChecklistDocumentInsight[]) {
  if (documents.length === 0) {
    return ['| _Henuz otomatik tasnif yok_ | `01-Tasnif/` | - | - | - |']
  }

  return documents.map((document) => {
    const category = document.category
    const status = category ? 'MEVCUT' : 'SORULMALI'
    const proof = category
      ? category.proof
      : 'Belge icerigi otomatik olarak siniflandirilamadi; manuel kontrol gerekli'
    const followUp = category
      ? document.description?.trim()
        ? 'Otomatik tasnif yapildi; avukat kontrolu onerilir'
        : 'Otomatik tasnif yapildi; kisa belge notu eklenmeli'
      : 'Manuel tasnif edilip uygun klasore alinmali'
    const folderPath = category ? `\`01-Tasnif/${category.folderName}\`` : '`01-Tasnif/Manuel-Inceleme`'

    return `| ${sanitizeMarkdownTableCell(document.fileName)} | ${folderPath} | ${status} | ${sanitizeMarkdownTableCell(proof)} | ${sanitizeMarkdownTableCell(followUp)} |`
  })
}

function buildMissingChecklistRows(
  documents: ChecklistDocumentInsight[],
  caseType?: string | null
) {
  const requirements = [
    ...BASE_MISSING_REQUIREMENTS,
    ...(caseType ? CASE_SPECIFIC_MISSING_REQUIREMENTS[caseType] ?? [] : []),
  ]
  const presentKeys = new Set<string>()

  for (const document of documents) {
    if (document.category) {
      presentKeys.add(document.category.key)
    }
  }

  const missingRequirements = requirements.filter((requirement) => {
    const matchesCategory = requirement.categoryKeys.some((categoryKey) => presentKeys.has(categoryKey))
    if (matchesCategory) {
      return false
    }

    if (!requirement.keywords || requirement.keywords.length === 0) {
      return true
    }

    return !requirement.keywords.some((keyword) =>
      documents.some((document) =>
        document.normalizedSearchText.includes(normalizeSearchText(keyword))
      )
    )
  })

  if (missingRequirements.length === 0) {
    return ['| _Otomatik eksik evrak tespiti yok_ | - | - | Mevcut yuklemeler temel kontrolu geciyor |']
  }

  return missingRequirements.map((requirement) => {
    return `| ${sanitizeMarkdownTableCell(requirement.label)} | ${sanitizeMarkdownTableCell(requirement.source)} | ${requirement.urgency} | ${sanitizeMarkdownTableCell(requirement.note)} |`
  })
}

function ensureChecklistAutomationSections(content: string) {
  const sectionsToAppend: string[] = []

  if (!content.includes('## Muvekkilden Gelen Ham Evraklar')) {
    sectionsToAppend.push(
      `## Muvekkilden Gelen Ham Evraklar

| Dosya Adi | Tarih | Kaynak | On Tasnif | Not |
|---|---|---|---|---|
${CHECKLIST_AUTO_ROWS_START}
| [dosya] | [YYYY-MM-DD] | [muvekkil / e-posta / WhatsApp] | [belirsiz] | |
${CHECKLIST_AUTO_ROWS_END}`
    )
  }

  if (!content.includes('## Tasnif Edilmis Evraklar')) {
    sectionsToAppend.push(
      `## Tasnif Edilmis Evraklar

| Belge | Klasor | Durum | Neyi Ispatliyor | Eksik Aksiyon |
|---|---|---|---|---|
${CHECKLIST_CLASSIFIED_ROWS_START}
| [belge adi] | \`01-Tasnif/...\` | [MEVCUT / EKSIK / SORULMALI] | [ispat unsuru] | [aksiyon] |
${CHECKLIST_CLASSIFIED_ROWS_END}`
    )
  }

  if (!content.includes('## Eksik Evraklar')) {
    sectionsToAppend.push(
      `## Eksik Evraklar

| Belge | Nereden Temin Edilir | Aciliyet | Not |
|---|---|---|---|
${CHECKLIST_MISSING_ROWS_START}
| [belge adi] | [kurum/kisi] | [Yuksek / Orta / Dusuk] | |
${CHECKLIST_MISSING_ROWS_END}`
    )
  }

  if (!content.includes('## Tasnif Kurallari')) {
    sectionsToAppend.push(
      `## Tasnif Kurallari

- Kimlik, vekaletname, SGK, banka, saglik, tapu, noter, bilirkisi, durusma ve yazisma belgelerini ayri basliklarda topla.
- Her dosya tek satirda neyi ispatladigi ile kaydedilsin.
- Belge mevcut ama okunaksizsa \`SORULMALI\` yerine \`MEVCUT - okunaksiz\` yaz.`
    )
  }

  if (sectionsToAppend.length === 0) {
    return content
  }

  return `${content.trimEnd()}\n\n${sectionsToAppend.join('\n\n')}\n`
}

function upsertManagedRowsInSection(
  content: string,
  options: {
    sectionHeading: string
    startMarker: string
    endMarker: string
    managedRows: string[]
    isPlaceholderLine: (line: string) => boolean
  }
) {
  const { sectionHeading, startMarker, endMarker, managedRows, isPlaceholderLine } = options
  const sectionStart = content.indexOf(sectionHeading)

  if (sectionStart === -1) {
    return content
  }

  const nextSectionStart = content.indexOf('\n## ', sectionStart + sectionHeading.length)
  const sectionEnd = nextSectionStart === -1 ? content.length : nextSectionStart
  const section = content.slice(sectionStart, sectionEnd)
  const managedBlock = `${startMarker}\n${managedRows.join('\n')}\n${endMarker}`

  if (section.includes(startMarker) && section.includes(endMarker)) {
    const start = section.indexOf(startMarker)
    const end = section.indexOf(endMarker) + endMarker.length
    const updatedSection = `${section.slice(0, start)}${managedBlock}${section.slice(end)}`
    return `${content.slice(0, sectionStart)}${updatedSection}${content.slice(sectionEnd)}`
  }

  const lines = section.split('\n')
  const separatorLineIndex = lines.findIndex((line) => line.trim().startsWith('|---|'))
  if (separatorLineIndex === -1) {
    return content
  }

  for (let index = lines.length - 1; index > separatorLineIndex; index -= 1) {
    if (isPlaceholderLine(lines[index].trim())) {
      lines.splice(index, 1)
    }
  }

  lines.splice(separatorLineIndex + 1, 0, managedBlock)

  return `${content.slice(0, sectionStart)}${lines.join('\n')}${content.slice(sectionEnd)}`
}

export async function syncEvidenceChecklist(
  checklistPath: string,
  documents: ChecklistDocumentInput[],
  context?: {
    caseType?: string | null
  }
) {
  let currentContent: string

  try {
    currentContent = await fs.readFile(checklistPath, 'utf8')
  } catch {
    return false
  }

  const sortedDocuments = [...documents].sort((left, right) => {
    const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0
    const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0
    return rightTime - leftTime
  })
  const hydratedContent = ensureChecklistAutomationSections(currentContent)
  const documentInsights = sortedDocuments.map(buildDocumentInsight)

  const withRawRows = upsertManagedRowsInSection(
    hydratedContent,
    {
      sectionHeading: '## Muvekkilden Gelen Ham Evraklar',
      startMarker: CHECKLIST_AUTO_ROWS_START,
      endMarker: CHECKLIST_AUTO_ROWS_END,
      managedRows: buildManagedChecklistRows(documentInsights),
      isPlaceholderLine: (line) =>
        line.includes('| [dosya] | [YYYY-MM-DD] | [muvekkil / e-posta / WhatsApp] | [belirsiz] | |'),
    }
  )
  const withClassifiedRows = upsertManagedRowsInSection(
    withRawRows,
    {
      sectionHeading: '## Tasnif Edilmis Evraklar',
      startMarker: CHECKLIST_CLASSIFIED_ROWS_START,
      endMarker: CHECKLIST_CLASSIFIED_ROWS_END,
      managedRows: buildClassifiedChecklistRows(documentInsights),
      isPlaceholderLine: (line) =>
        line.includes('| [belge adi] | `01-Tasnif/...` | [MEVCUT / EKSIK / SORULMALI] | [ispat unsuru] | [aksiyon] |'),
    }
  )
  const nextContent = upsertManagedRowsInSection(
    withClassifiedRows,
    {
      sectionHeading: '## Eksik Evraklar',
      startMarker: CHECKLIST_MISSING_ROWS_START,
      endMarker: CHECKLIST_MISSING_ROWS_END,
      managedRows: buildMissingChecklistRows(documentInsights, context?.caseType),
      isPlaceholderLine: (line) =>
        line.includes('| [belge adi] | [kurum/kisi] | [Yuksek / Orta / Dusuk] | |'),
    }
  )

  if (nextContent === currentContent) {
    return false
  }

  await fs.writeFile(checklistPath, nextContent, 'utf8')
  return true
}

export async function assertWorkspaceRootAccessible() {
  try {
    await fs.access(ACTIVE_CASES_ROOT)
  } catch {
    throw new Error(
      `Google Drive klasoru bulunamadi veya erisilemiyor: ${ACTIVE_CASES_ROOT}`
    )
  }
}

async function writeFileIfMissing(filePath: string, content: string) {
  try {
    await fs.access(filePath)
    return false
  } catch {
    await fs.writeFile(filePath, content, 'utf8')
    return true
  }
}

export async function materializeWorkspace(layout: ReturnType<typeof buildWorkspaceLayout>, context: {
  caseTitle: string
  caseType?: string | null
  caseDescription?: string | null
  clientName?: string | null
  courtName?: string | null
  caseNumber?: string | null
  startDate?: string | null
  createdAt?: Date | string | null
  automationCaseCode: string
}) {
  for (const dir of layout.directories) {
    await fs.mkdir(dir, { recursive: true })
  }

  const createdFiles: string[] = []
  const preparedOn = formatIsoDate(context.startDate || context.createdAt)
  const caseDescriptionText = normalizeOptionalText(context.caseDescription) === '-'
    ? '[Avukatin stratejik notlari]'
    : context.caseDescription!.trim()
  const templateReplacements = {
    '[Dava Adi]': context.caseTitle,
    '[Dava Ozeti]': normalizeOptionalText(context.caseDescription) === '-'
      ? context.caseTitle
      : normalizeOptionalText(context.caseDescription),
    '[Dava Aciklamasi / Avukatin stratejik notlari]': caseDescriptionText,
    '[YYYY-MM-DD]': preparedOn,
    '[2026-XXX]': context.automationCaseCode,
    '[Dava Turu]': formatCaseTypeLabel(context.caseType),
    '[Muvekkil]': normalizeOptionalText(context.clientName),
    '[Mahkeme]': normalizeOptionalText(context.courtName),
    '[Esas No]': normalizeOptionalText(context.caseNumber),
    'v[N]': 'v1',
  }
  const briefingTemplate = await readTemplateFile('advanced-briefing-template.md')
  const procedureTemplate = await readTemplateFile('usul-raporu-template.md')
  const researchTemplate = await readTemplateFile('arastirma-raporu-template.md')
  const defenseTemplate = await readTemplateFile('savunma-simulasyonu-template.md')
  const revisionTemplate = await readTemplateFile('revizyon-raporu-template.md')
  const evidenceTemplate = await readTemplateFile('evrak-listesi-template.md')

  const fileDefinitions: Array<[string, string]> = [
    [
      layout.files.briefingPath,
      briefingTemplate
        ? fillTemplate(briefingTemplate, templateReplacements)
        : `# Advanced Briefing: ${context.caseTitle}\n\n**Hazirlanma Tarihi:** ${preparedOn}\n**Dava ID:** ${context.automationCaseCode}\n**Dava Turu:** ${formatCaseTypeLabel(context.caseType)}\n**Muvekkil:** ${normalizeOptionalText(context.clientName)}\n**Mahkeme:** ${normalizeOptionalText(context.courtName)}\n**Esas No:** ${normalizeOptionalText(context.caseNumber)}\n\n## 1. DAVA TEORISI\n[Dosyanin ana hukuki omurgasi]\n\n## 2. KRITIK RISK\n[En buyuk usul veya esas riski]\n\n## 3. KARSI TARAF BEKLENTISI\n[Karsi tarafin en guclu savunmasi]\n\n## 4. MUVEKKIL RISK TOLERANSI\n- [ ] Agresif\n- [ ] Dengeli\n- [ ] Muhafazakar\n\n## 5. TON TERCIHI\n- [ ] Sert ve iddiali\n- [ ] Profesyonel ve olculu\n- [ ] Uzlasma kapisi acik\n\n## 6. OLMAZSA OLMAZ TALEPLER\n- [Talep 1]\n- [Talep 2]\n\n## 7. EKSIK BILGI\n- [Eksik bilgi 1]\n- [Eksik bilgi 2]\n\n## 8. SOMUT VERILER\n- [Tarih / tutar / ada-parsel / olum tarihi / SGK bilgisi vb.]\n\n## 9. NOTLAR\n${caseDescriptionText}\n`,
    ],
    [
      layout.files.procedurePath,
      procedureTemplate
        ? fillTemplate(procedureTemplate, templateReplacements)
        : `# Usul Raporu: ${context.caseTitle}\n\n**Hazirlanma Tarihi:** ${preparedOn}\n**Dava ID:** ${context.automationCaseCode}\n**Mahkeme / Merci:** ${normalizeOptionalText(context.courtName)}\n**Esas No:** ${normalizeOptionalText(context.caseNumber)}\n**Dava Turu:** ${formatCaseTypeLabel(context.caseType)}\n\n## 1. Ilk Usul Kontrolu\n- Gorev:\n- Yetki:\n- Dava sarti:\n- Arabuluculuk / zorunlu basvuru:\n\n## 2. Sure Takvimi\n| Baslik | Tarih / Sure | Risk | Not |\n|---|---|---|---|\n| Dava acilis tarihi | ${preparedOn} | [Dusuk / Orta / Yuksek] | |\n| Ilk kritik sure | [tarih / sure] | [Dusuk / Orta / Yuksek] | |\n\n## 3. Delil ve Usul Isleri\n- Tebligat kontrolu:\n- Delil sunma stratejisi:\n- Bilirkisi / kesif ihtiyaci:\n- Ihtiyati tedbir / haciz ihtiyaci:\n\n## 4. Acil Aksiyon\n1. [Ilk usul aksiyonu]\n2. [Ikinci usul aksiyonu]\n\n## 5. Acik Sorular\n- [Netlestirilecek usul sorusu]\n`,
    ],
    [
      layout.files.researchPath,
      researchTemplate
        ? fillTemplate(researchTemplate, templateReplacements)
        : `# Arastirma Raporu: ${context.caseTitle}\n\n**Hazirlanma Tarihi:** ${preparedOn}\n**Dava ID:** ${context.automationCaseCode}\n**Dava Turu:** ${formatCaseTypeLabel(context.caseType)}\n\n## 1. Arastirma Sorusu\n- Bu dosyada yanitlanacak temel hukuki sorular:\n- Olay orgusundeki kritik dugum:\n\n## 2. Mevzuat ve Ictihat Tarama Plani\n- Ana mevzuat:\n- Ikincil mevzuat:\n- Aranacak Yargitay / BAM ekseni:\n\n## 3. Aranacak Anahtar Kelimeler\n- [anahtar kelime 1]\n- [anahtar kelime 2]\n- [anahtar kelime 3]\n\n## 4. Ilk Bulgular\n- [bulgu]\n- [bulgu]\n\n## 5. Eksik Veri / Belge\n- [eksik veri]\n- [eksik belge]\n\n## 6. Sonraki Adim\n1. [ilk arastirma aksiyonu]\n2. [ikinci arastirma aksiyonu]\n`,
    ],
    [
      layout.files.defenseSimulationPath,
      defenseTemplate
        ? fillTemplate(defenseTemplate, templateReplacements)
        : `---\nGUVEN NOTU:\n- Mevzuat referanslari: [DOGRULANMIS / DOGRULANMASI GEREKIR]\n- Yargitay kararlari: [DOGRULANMIS / DOGRULANMASI GEREKIR / BULUNAMADI]\n- Hesaplamalar: [YAPILDI / YAPILMADI / TAHMINI]\n- Dahili kaynak: [EVET - kaynak adi / HAYIR]\n- Risk flag: [VAR - aciklama / YOK]\n---\n\n# Savunma Simulasyonu - ${context.caseTitle}\n\n**Hazirlanma Tarihi:** ${preparedOn}\n**Dava ID:** ${context.automationCaseCode}\n**Muvekkil:** ${normalizeOptionalText(context.clientName)}\n**Mahkeme:** ${normalizeOptionalText(context.courtName)}\n\n## 1. En Guclu Savunma\nSavunma:\nDayanak:\nBizim Yanitimiz:\nDilekceye Eklenmeli:\n\n## 2. Ikinci Savunma\nSavunma:\nDayanak:\nBizim Yanitimiz:\nDilekceye Eklenmeli:\n\n## 3. Ucuncu Savunma\nSavunma:\nDayanak:\nBizim Yanitimiz:\nDilekceye Eklenmeli:\n\n## Genel Risk Degerlendirmesi\n[Karsi tarafin en guclu noktasi / bizim zayif noktalarimiz]\n`,
    ],
    [
      layout.files.revisionPath,
      revisionTemplate
        ? fillTemplate(revisionTemplate, templateReplacements)
        : `---\nGUVEN NOTU:\n- Mevzuat referanslari: [DOGRULANMIS / DOGRULANMASI GEREKIR]\n- Yargitay kararlari: [DOGRULANMIS / DOGRULANMASI GEREKIR / BULUNAMADI]\n- Hesaplamalar: [YAPILDI / YAPILMADI / TAHMINI]\n- Dahili kaynak: [EVET - kaynak adi / HAYIR]\n- Risk flag: [VAR - aciklama / YOK]\n---\n\n# Revizyon Raporu - ${context.caseTitle} v1\n\n**Hazirlanma Tarihi:** ${preparedOn}\n**Dava ID:** ${context.automationCaseCode}\n**Muvekkil:** ${normalizeOptionalText(context.clientName)}\n**Mahkeme:** ${normalizeOptionalText(context.courtName)}\n\n## Guclu Noktalar\n- [guclu nokta]\n\n## Duzeltilmesi Gereken Noktalar\n1. [Sorun] -> [Onerilen duzeltme]\n2. [Sorun] -> [Onerilen duzeltme]\n\n## Eklenmesi Gereken Noktalar\n- [eksik arguman veya delil]\n\n## Cikarilmasi Gereken Noktalar\n- [zayiflatan veya gereksiz kisim]\n\n## Sonraki Adim\n[v2 icin net talimat]\n`,
    ],
    [
      layout.files.pleadingMdPath,
      `# Dava Dilekcesi Taslagi\n\nBu dosya markdown dilekce taslagi icin ayrildi.\n`,
    ],
    [
      layout.files.pleadingUdfPath,
      `<!-- UDF output bu yol uzerinden uretilecek. -->\n`,
    ],
    [
      layout.files.evidenceChecklistPath,
      evidenceTemplate
        ? fillTemplate(evidenceTemplate, templateReplacements)
        : `# Evrak Listesi: ${context.caseTitle}\n\n**Hazirlanma Tarihi:** ${preparedOn}\n**Dava ID:** ${context.automationCaseCode}\n**Muvekkil:** ${normalizeOptionalText(context.clientName)}\n\n## Muvekkilden Gelen Ham Evraklar\n\n| Dosya Adi | Tarih | Kaynak | On Tasnif | Not |\n|---|---|---|---|---|\n${CHECKLIST_AUTO_ROWS_START}\n| [dosya] | [YYYY-MM-DD] | [muvekkil / e-posta / WhatsApp] | [belirsiz] | |\n${CHECKLIST_AUTO_ROWS_END}\n\n## Tasnif Edilmis Evraklar\n\n| Belge | Klasor | Durum | Neyi Ispatliyor | Eksik Aksiyon |\n|---|---|---|---|---|\n${CHECKLIST_CLASSIFIED_ROWS_START}\n| [belge adi] | \`01-Tasnif/...\` | [MEVCUT / EKSIK / SORULMALI] | [ispat unsuru] | [aksiyon] |\n${CHECKLIST_CLASSIFIED_ROWS_END}\n\n## Eksik Evraklar\n\n| Belge | Nereden Temin Edilir | Aciliyet | Not |\n|---|---|---|---|\n${CHECKLIST_MISSING_ROWS_START}\n| [belge adi] | [kurum/kisi] | [Yuksek / Orta / Dusuk] | |\n${CHECKLIST_MISSING_ROWS_END}\n\n## Tasnif Kurallari\n\n- Kimlik, vekaletname, SGK, banka, saglik, tapu, noter, bilirkisi, durusma ve yazisma belgelerini ayri basliklarda topla.\n- Her dosya tek satirda neyi ispatladigi ile kaydedilsin.\n- Belge mevcut ama okunaksizsa \`SORULMALI\` yerine \`MEVCUT - okunaksiz\` yaz.\n`,
    ],
  ]

  for (const [filePath, content] of fileDefinitions) {
    if (await writeFileIfMissing(filePath, content)) {
      createdFiles.push(filePath)
    }
  }

  return {
    createdDirectories: layout.directories,
    createdFiles,
  }
}

// ─── Save Generated Artifact to Drive ───────────────────────────────────────

type SaveArtifactType = 'procedure' | 'research' | 'pleading_v1' | 'pleading_v2' | 'defense_simulation' | 'revision'

export async function saveArtifactToDrive(
  automationCaseCode: string,
  artifactType: SaveArtifactType,
  content: string,
  filename?: string,
): Promise<string | null> {
  try {
    const basePath = path.win32.join(ACTIVE_CASES_ROOT, automationCaseCode)
    const layout = buildWorkspaceLayout(basePath)

    const fileMap: Record<SaveArtifactType, string> = {
      procedure: layout.files.procedurePath,
      research: layout.files.researchPath,
      pleading_v1: layout.files.pleadingMdPath,
      pleading_v2: path.win32.join(layout.root, '03-Sentez-ve-Dilekce', filename || 'dilekce-v2.md'),
      defense_simulation: layout.files.defenseSimulationPath,
      revision: layout.files.revisionPath,
    }

    const targetPath = fileMap[artifactType]
    if (!targetPath) return null

    // Klasörü oluştur (yoksa)
    await fs.mkdir(path.win32.dirname(targetPath), { recursive: true })
    await fs.writeFile(targetPath, content, 'utf-8')

    console.log(`[workspace] ${artifactType} kaydedildi: ${targetPath}`)
    return targetPath
  } catch (err) {
    console.error(`[workspace] Drive kaydi basarisiz (${artifactType}):`, err)
    return null
  }
}

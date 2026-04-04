import { z } from 'zod'
import { callClaudeCli, hasClaudeCliConfig } from './claudeCli.js'

// ─── Types ───────────────────────────────────────────────────────────────────

type DocumentType = 'dava_dilekcesi' | 'ihtarname' | 'cevap_dilekcesi' | 'istinaf_dilekcesi' | 'temyiz_dilekcesi' | 'basvuru_dilekcesi'

type PleadingAiInput = {
  caseTitle: string
  caseType: string
  caseDescription?: string | null
  courtName?: string | null
  documentType?: DocumentType | null
  // Intake
  criticalPointSummary?: string | null
  mainLegalAxis?: string | null
  lawyerDirection?: string | null
  // Briefing
  briefingSummary?: string | null
  toneStrategy?: string | null
  // Procedure
  procedureReportMarkdown?: string | null
  // Research
  researchReportMarkdown?: string | null
  selectedArguments?: string[] | null
}

// ─── Config ─────────────────────────────────────────────────────────────────

export function hasPleadingAiConfig() {
  return hasClaudeCliConfig()
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function stripMarkdownFences(value: string) {
  const trimmed = value.trim()
  if (trimmed.startsWith('```')) {
    return trimmed.replace(/^```(?:markdown)?\s*/u, '').replace(/\s*```$/u, '').trim()
  }
  return trimmed
}

// ─── Confidence schema ──────────────────────────────────────────────────────

const confidenceNoteSchema = z.object({
  mevzuatReferanslari: z.enum(['DOGRULANMIS', 'DOGRULANMASI_GEREKIR']),
  yargitayKararlari: z.enum(['DOGRULANMIS', 'DOGRULANMASI_GEREKIR', 'BULUNAMADI']),
  hesaplamalar: z.enum(['YAPILDI', 'YAPILMADI', 'TAHMINI']),
  dahiliKaynak: z.string(),
  riskFlag: z.string(),
})

// ─── Document type specific instructions ────────────────────────────────────

const DOCUMENT_STRUCTURES: Record<DocumentType, { label: string; structure: string; instruction: string }> = {
  dava_dilekcesi: {
    label: 'Dava Dilekcesi',
    structure: [
      '[MAHKEME ADI]',
      'DAVACI / VEKILI / DAVALI / KONU',
      'ACIKLAMALAR: I. OLAYLAR, II. HUKUKI DEGERLENDIRME, III. DELILLER, IV. HUKUKI NEDENLER, V. SONUC VE TALEP',
      'Davaci Vekili Av. imza alani',
    ].join('\n'),
    instruction: 'Eksiksiz bir dava dilekcesi taslagi yaz. Netice-i talep bolumunde her alacak kalemini ayri ayri yaz.',
  },
  ihtarname: {
    label: 'Ihtarname',
    structure: [
      'IHTARNAME',
      'IHTAR EDEN / VEKILI / MUHATAP / KONU',
      'ACIKLAMALAR: I. OLAY VE OLGULAR, II. HUKUKI DAYANAK, III. TALEP',
      'SONUC: Islerin [X] gun icinde yerine getirilmesi, aksi halde yasal yollara basvurulacagi',
      'Ihtar Eden Vekili Av. imza alani',
    ].join('\n'),
    instruction: 'Ihtarname yaz. Net, kisa, kesin ifadeler kullan. Sure ver. Yasal yollara basvuru tehdidi icersin.',
  },
  cevap_dilekcesi: {
    label: 'Cevap Dilekcesi',
    structure: [
      '[MAHKEME ADI]',
      'DOSYA NO: YYYY/XXXXX',
      'DAVALI / VEKILI / DAVACI / KONU: Dava dilekcesine cevap',
      'ACIKLAMALAR: I. USULE ILISKIN ITIRAZLAR, II. ESASA ILISKIN ITIRAZLAR, III. DELILLER, IV. HUKUKI NEDENLER, V. SONUC VE TALEP',
      'Davali Vekili Av. imza alani',
    ].join('\n'),
    instruction: 'Cevap dilekcesi yaz. Once usuli itirazlari (gorev, yetki, zamanasimi, dava sarti), sonra esasa iliskin itirazlari sun.',
  },
  istinaf_dilekcesi: {
    label: 'Istinaf Dilekcesi',
    structure: [
      'BOLGE ADLIYE MAHKEMESI ILGILI HUKUK DAIRESINE',
      'Sunulmak Uzere',
      '[YEREL MAHKEME ADI]',
      'DOSYA NO: YYYY/XXXXX E., YYYY/XXXXX K.',
      'ISTINAF BASVURUSUNDA BULUNAN / VEKILI / KARSI TARAF / KONU: Istinaf basvurusu',
      'ACIKLAMALAR: I. USULE AYKIRILIK, II. MADDI OLGU HATASI, III. HUKUKI DEGERLENDIRME HATASI, IV. SONUC VE TALEP',
      'Istinaf Eden Vekili Av. imza alani',
    ].join('\n'),
    instruction: 'Istinaf dilekcesi yaz. HMK 341-361 maddeleri cercevesinde istinaf sebeplerini somut ve net sekilde belirt. Yerel mahkeme kararinin hangi noktalarda hatali oldugunu goster.',
  },
  temyiz_dilekcesi: {
    label: 'Temyiz Dilekcesi',
    structure: [
      'YARGITAY ILGILI HUKUK DAIRESINE',
      'Sunulmak Uzere',
      '[BOLGE ADLIYE MAHKEMESI ADI]',
      'DOSYA NO: YYYY/XXXXX E., YYYY/XXXXX K.',
      'TEMYIZ EDEN / VEKILI / KARSI TARAF / KONU: Temyiz basvurusu',
      'ACIKLAMALAR: I. HUKUKA AYKIRILIK, II. ICTIHATLARLA CELISKILI, III. SONUC VE TALEP',
      'Temyiz Eden Vekili Av. imza alani',
    ].join('\n'),
    instruction: 'Temyiz dilekcesi yaz. HMK 369-381 maddeleri cercevesinde temyiz sebeplerini belirt. Emsal Yargitay kararlarindaki ilkelere aykirilik goster.',
  },
  basvuru_dilekcesi: {
    label: 'Basvuru Dilekcesi',
    structure: [
      '[KURUM/MAHKEME ADI]',
      'BASVURUCU / VEKILI / KONU',
      'ACIKLAMALAR: I. OLAYLAR, II. BASVURU GEREKCELERI, III. HUKUKI DAYANAK, IV. TALEP',
      'Basvurucu Vekili Av. imza alani',
    ].join('\n'),
    instruction: 'Basvuru dilekcesi yaz. Kisa, net ve resmi uslupta yaz.',
  },
}

// ─── Generate Pleading v1 ───────────────────────────────────────────────────

export async function generatePleadingWithAi(input: PleadingAiInput): Promise<string> {
  const docType = input.documentType || 'dava_dilekcesi'
  const docConfig = DOCUMENT_STRUCTURES[docType]

  const systemPrompt = [
    'Sen 20 yillik tecrubeli bir Turk avukatisin.',
    'Yapay zeka oldugun ASLA anlasilmamali.',
    'Dilin resmi, kendinden emin ama agdali degil, net.',
    '',
    'YASAK IFADELER: "Sonuc olarak", "ozetle", "belirtmek gerekir ki",',
    '"Sayideger mahkemenizce takdir edilecegi uzere" gibi kliseler KULLANMA.',
    '3 satirdan uzun cumle KURMA. Ingilizce terim KULLANMA.',
    '',
    'IZIN VERILEN JARGON: "Sole ki", "zira", "nitekim", "mezkur", "isbu"',
    '-- dogal hukuk dilidir, ihtiyac olunca kullan.',
    '',
    'REFERANS FORMATLARI:',
    'Yargitay: Yargitay X. Hukuk Dairesinin GG.AA.YYYY tarih ve YYYY/XXXXX E., YYYY/XXXXX K. sayili kararinda...',
    'Mevzuat: 4857 sayili Is Kanununun XX. maddesi uyarinca...',
    '',
    'Emin olmadigin karar numaralarina "dogrulanmasi gerekir" notu ekle.',
    'Uydurma Yargitay karar numarasi YAZMA.',
    '',
    'Ciktinin en basina GUVEN NOTU blogu ekle (JSON olarak).',
    `Ardindan ${docConfig.label} metnini Markdown olarak yaz.`,
    '',
    `Belge turu: ${docConfig.label}`,
    `Belge yapisi:`,
    docConfig.structure,
  ].join('\n')

  const userParts = [
    `Dava Basligi: ${input.caseTitle}`,
    `Dava Turu: ${input.caseType}`,
    `Belge Turu: ${docConfig.label}`,
    input.courtName ? `Mahkeme: ${input.courtName}` : null,
    input.caseDescription ? `Dava Aciklamasi:\n${input.caseDescription}` : null,
    input.criticalPointSummary ? `Kritik Nokta:\n${input.criticalPointSummary}` : null,
    input.mainLegalAxis ? `Ana Hukuki Eksen:\n${input.mainLegalAxis}` : null,
    input.lawyerDirection ? `Avukat Yonlendirmesi:\n${input.lawyerDirection}` : null,
    input.briefingSummary ? `Briefing Ozeti:\n${input.briefingSummary}` : null,
    input.toneStrategy ? `Ton Stratejisi: ${input.toneStrategy}` : null,
    input.procedureReportMarkdown
      ? `\n--- USUL RAPORU ---\n${input.procedureReportMarkdown}`
      : null,
    input.researchReportMarkdown
      ? `\n--- ARASTIRMA RAPORU ---\n${input.researchReportMarkdown}`
      : null,
    input.selectedArguments?.length
      ? `\n--- SECILMIS ARGUMANLAR ---\n${input.selectedArguments.map((a, i) => `${i + 1}. ${a}`).join('\n')}`
      : null,
    '',
    docConfig.instruction,
    'Arastirma raporundaki secilmis argumanlari belgeye tasi.',
    'Usul raporundaki risk noktalarini proaktif olarak karsila.',
  ]

  const userPrompt = userParts.filter(Boolean).join('\n')

  const result = await callClaudeCli({ systemPrompt, userPrompt, model: 'sonnet', timeoutMs: 180000 })
  if (!result.text) throw new Error('Claude CLI bos yanit dondu.')

  return stripMarkdownFences(result.text)
}

import { z } from 'zod'
import { callClaudeCli, hasClaudeCliConfig } from './claudeCli.js'

// ─── Types ───────────────────────────────────────────────────────────────────

type PleadingAiInput = {
  caseTitle: string
  caseType: string
  caseDescription?: string | null
  courtName?: string | null
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

// ─── Generate Pleading v1 ───────────────────────────────────────────────────

export async function generatePleadingWithAi(input: PleadingAiInput): Promise<string> {
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
    'Ardindan dilekce metnini Markdown olarak yaz.',
    '',
    'Dilekce yapisi:',
    '[MAHKEME ADI]',
    'DAVACI / VEKILI / DAVALI / KONU',
    'ACIKLAMALAR: I. OLAYLAR, II. HUKUKI DEGERLENDIRME, III. DELILLER, IV. HUKUKI NEDENLER, V. SONUC VE TALEP',
    'Davaci Vekili Av. imza alani',
  ].join('\n')

  const userParts = [
    `Dava Basligi: ${input.caseTitle}`,
    `Dava Turu: ${input.caseType}`,
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
    'Yukaridaki bilgileri kullanarak eksiksiz bir dava dilekcesi taslagi yaz.',
    'Arastirma raporundaki secilmis argumanlari dilekceye tasi.',
    'Usul raporundaki risk noktalarini proaktif olarak karsila.',
    'Netice-i talep bolumunde her alacak kalemini ayri ayri yaz.',
  ]

  const userPrompt = userParts.filter(Boolean).join('\n')

  const result = await callClaudeCli({ systemPrompt, userPrompt, model: 'sonnet', timeoutMs: 180000 })
  if (!result.text) throw new Error('Claude CLI bos yanit dondu.')

  return stripMarkdownFences(result.text)
}

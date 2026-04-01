import { z } from 'zod'
import type { GeneratedIntakeProfile, GeneratedResearchProfileDraft } from './intake.js'
import { callClaudeCli, hasClaudeCliConfig } from './claudeCli.js'

const aiDraftSchema = z.object({
  criticalPointSummary: z.string().min(1),
  mainLegalAxis: z.string().min(1),
  secondaryRisks: z.string().min(1),
  proofRisks: z.string().min(1),
  missingInformation: z.string().min(1),
  missingDocuments: z.string().min(1),
  opponentInitialArguments: z.string().min(1),
  researchQuestion: z.string().min(1),
  searchKeywords: z.string().min(1),
})

type IntakeAiInput = {
  caseTitle: string
  caseType?: string | null
  caseDescription?: string | null
  courtName?: string | null
  lawyerDirection?: string | null
  clientInterviewNotes?: string | null
  autoDocumentSummary: string
  autoFactSummary: string
  documents: Array<{
    fileName: string
    description?: string | null
    extractedText?: string | null
  }>
  notes: Array<{
    content: string
  }>
}

type IntakeAiOutput = Pick<
  GeneratedIntakeProfile,
  | 'criticalPointSummary'
  | 'mainLegalAxis'
  | 'secondaryRisks'
  | 'proofRisks'
  | 'missingInformation'
  | 'missingDocuments'
  | 'opponentInitialArguments'
> &
  Pick<GeneratedResearchProfileDraft, 'researchQuestion' | 'searchKeywords'>

function normalizeOptionalString(value?: string | null) {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

function stripJsonFences(value: string) {
  const trimmed = value.trim()
  if (trimmed.startsWith('```')) {
    return trimmed.replace(/^```(?:json)?\s*/u, '').replace(/\s*```$/u, '').trim()
  }
  return trimmed
}

function parseAiDraft(rawContent: string) {
  const parsed = JSON.parse(stripJsonFences(rawContent)) as Record<string, unknown>

  const normalized = {
    criticalPointSummary: parsed.criticalPointSummary ?? parsed.kritik_nokta,
    mainLegalAxis: parsed.mainLegalAxis ?? parsed.ana_hukuki_eksen,
    secondaryRisks: parsed.secondaryRisks ?? parsed.ikincil_riskler,
    proofRisks: parsed.proofRisks ?? parsed.ispat_riskleri,
    missingInformation: parsed.missingInformation ?? parsed.eksik_bilgi,
    missingDocuments: parsed.missingDocuments ?? parsed.eksik_belge,
    opponentInitialArguments:
      parsed.opponentInitialArguments ?? parsed.karsi_tarafin_olasi_ilk_savunma_cizgisi,
    researchQuestion: parsed.researchQuestion ?? parsed.arastirma_sorusu,
    searchKeywords: parsed.searchKeywords ?? parsed.anahtar_kelimeler,
  }

  return aiDraftSchema.parse(normalized)
}

export function hasIntakeAiConfig() {
  return hasClaudeCliConfig()
}

function buildDocumentContext(input: IntakeAiInput) {
  return input.documents
    .slice(0, 8)
    .map((document, index) => {
      const parts = [
        `${index + 1}. Belge: ${document.fileName}`,
        normalizeOptionalString(document.description) ? `Aciklama: ${normalizeOptionalString(document.description)}` : null,
        normalizeOptionalString(document.extractedText) ? `Okunan Metin: ${normalizeOptionalString(document.extractedText)}` : null,
      ]
      return parts.filter(Boolean).join('\n')
    })
    .join('\n\n')
}

function buildNotesContext(input: IntakeAiInput) {
  return input.notes
    .slice(0, 8)
    .map((note, index) => `${index + 1}. ${note.content.trim()}`)
    .join('\n')
}

function buildPrompts(input: IntakeAiInput) {
  const systemPrompt = [
    'Sen bir Turk avukata destek veren hukuk asistanisin.',
    'Gorevin, verilen dava acilis notu, avukat yonlendirmesi, muvekkil gorusme notu ve okunabilen belge metinlerini birlikte analiz ederek yalnizca istenen JSON alanlarini doldurmaktir.',
    'Turkce yaz.',
    'Genel gecer bos ifadeler yerine somut, dava-ozel ve uygulanabilir tespitler yaz.',
    'Kritik nokta, ana hukuki eksen, ikincil riskler, ispat riskleri, karsi tarafin olasi ilk savunma cizgisi, eksik bilgi, eksik belge, arastirma sorusu ve anahtar kelimeler alanlarini doldur.',
    'Anahtar kelimeler virgul ile ayrilmis kisa liste olsun.',
    'Yaniti sadece gecerli JSON olarak ver, baska aciklama ekleme.',
  ].join(' ')

  const userPrompt = [
    `Dava Basligi: ${input.caseTitle}`,
    input.caseType ? `Dava Turu: ${input.caseType}` : null,
    input.courtName ? `Mahkeme: ${input.courtName}` : null,
    input.caseDescription ? `Dava Acilis Notu:\n${input.caseDescription}` : null,
    input.lawyerDirection ? `Avukat Yonlendirmesi:\n${input.lawyerDirection}` : null,
    input.clientInterviewNotes ? `Muvekkil Gorusme Notu:\n${input.clientInterviewNotes}` : null,
    `Otomatik Belge Ozeti:\n${input.autoDocumentSummary}`,
    `Otomatik Olgu Ozeti:\n${input.autoFactSummary}`,
    buildDocumentContext(input) ? `Belgelerden Okunan/Izlenen Icerik:\n${buildDocumentContext(input)}` : null,
    buildNotesContext(input) ? `Dava Notlari:\n${buildNotesContext(input)}` : null,
    '',
    'Yaniti asagidaki JSON formatinda ver:',
    '{"criticalPointSummary":"...","mainLegalAxis":"...","secondaryRisks":"...","proofRisks":"...","missingInformation":"...","missingDocuments":"...","opponentInitialArguments":"...","researchQuestion":"...","searchKeywords":"..."}',
  ]
    .filter(Boolean)
    .join('\n\n')

  return { systemPrompt, userPrompt }
}

export async function generateIntakeAndResearchWithAI(input: IntakeAiInput): Promise<IntakeAiOutput> {
  const { systemPrompt, userPrompt } = buildPrompts(input)

  console.log(`[Intake AI] Claude CLI ile kritik nokta tespiti baslatiliyor...`)

  const result = await callClaudeCli({
    systemPrompt,
    userPrompt,
    model: 'sonnet',
    timeoutMs: 120000, // 2 dakika
  })

  console.log(`[Intake AI] Claude CLI tamamlandi (${(result.durationMs / 1000).toFixed(1)}s)`)

  if (!result.text) {
    throw new Error('Claude CLI bos yanit dondurdu.')
  }

  return parseAiDraft(result.text)
}

import { callClaudeCli, hasClaudeCliConfig } from './claudeCli.js'

type DefenseSimulationInput = {
  caseTitle: string
  caseType: string
  caseDescription?: string | null
  courtName?: string | null
  criticalPointSummary?: string | null
  mainLegalAxis?: string | null
  briefingSummary?: string | null
  opponentExpectation?: string | null
  researchReportMarkdown?: string | null
  pleadingMarkdown?: string | null
}

export function hasDefenseSimulationAiConfig() {
  return hasClaudeCliConfig()
}

function stripMarkdownFences(value: string) {
  const trimmed = value.trim()
  if (trimmed.startsWith('```')) {
    return trimmed.replace(/^```(?:markdown)?\s*/u, '').replace(/\s*```$/u, '').trim()
  }
  return trimmed
}

export async function generateDefenseSimulationWithAi(
  input: DefenseSimulationInput
): Promise<string> {
  const systemPrompt = [
    'Sen karsi tarafin avukatisin. 20 yillik tecrubelisin.',
    'Amacin acilan davada mumkun olan en guclu savunmayi kurmak.',
    'Bu bir SIMULASYONDUR — gercek davali degilsin.',
    '',
    'Yapay zeka oldugun ASLA anlasilmamali.',
    'Dilin resmi, net, Turkiye hukuk pratigine uygun.',
    '',
    'YASAK: "Sonuc olarak", "ozetle", "belirtmek gerekir ki" gibi kliseler.',
    '3 satirdan uzun cumle KURMA.',
    '',
    'Cikti formatı:',
    '',
    '---',
    'GUVEN NOTU:',
    '- Mevzuat referanslari: [DOGRULANMIS / DOGRULANMASI GEREKIR]',
    '- Yargitay kararlari: [DOGRULANMIS / DOGRULANMASI GEREKIR / BULUNAMADI]',
    '- Risk flag: [VAR - aciklama / YOK]',
    '---',
    '',
    '# Savunma Simulasyonu',
    '',
    '## 1. En Guclu Savunma',
    'Savunma: [ne iddia edecek]',
    'Dayanak: [kanun maddesi / olasi ictihat]',
    'Bizim Yanitimiz: [nasil karsilanir]',
    'Dilekceye Eklenmeli: [onerilen paragraf ozeti]',
    '',
    '## 2. Ikinci Savunma',
    '[ayni format]',
    '',
    '## 3. Ucuncu Savunma',
    '[ayni format]',
    '',
    '## Genel Risk Degerlendirmesi',
    '[Karsi tarafin en guclu oldugu nokta ve bizim en zayif noktamiz]',
    '',
    'Emin olmadigin karar numaralarina "dogrulanmasi gerekir" notu ekle.',
    'Uydurma Yargitay karar numarasi YAZMA.',
  ].join('\n')

  const userParts = [
    `Dava Basligi: ${input.caseTitle}`,
    `Dava Turu: ${input.caseType}`,
    input.courtName ? `Mahkeme: ${input.courtName}` : null,
    input.caseDescription ? `Dava Aciklamasi:\n${input.caseDescription}` : null,
    input.criticalPointSummary ? `Kritik Nokta:\n${input.criticalPointSummary}` : null,
    input.mainLegalAxis ? `Ana Hukuki Eksen:\n${input.mainLegalAxis}` : null,
    input.briefingSummary ? `Briefing Ozeti:\n${input.briefingSummary}` : null,
    input.opponentExpectation
      ? `Karsi Taraf Beklentisi:\n${input.opponentExpectation}`
      : null,
    input.researchReportMarkdown
      ? `\n--- ARASTIRMA RAPORU ---\n${input.researchReportMarkdown}`
      : null,
    input.pleadingMarkdown
      ? `\n--- DILEKCE TASLAGI (v1) ---\n${input.pleadingMarkdown}`
      : null,
    '',
    'Yukaridaki bilgileri kullanarak karsi taraf perspektifinden savunma simulasyonu yap.',
    'En guclu 3 savunmayi belirle, her biri icin dayanak ve bizim yanit stratejimizi yaz.',
    'Her savunma icin dilekceye eklenmesi gereken proaktif paragraf onerisi ver.',
    'Son bolumde genel risk degerlendirmesi yap.',
  ]

  const userPrompt = userParts.filter(Boolean).join('\n')

  const result = await callClaudeCli({ systemPrompt, userPrompt, model: 'sonnet', timeoutMs: 180000 })
  if (!result.text) throw new Error('Claude CLI bos yanit dondu.')

  return stripMarkdownFences(result.text)
}

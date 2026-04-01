import { callClaudeCli, hasClaudeCliConfig } from './claudeCli.js'

type RevisionInput = {
  caseTitle: string
  caseType: string
  pleadingV1Markdown: string
  defenseSimulationMarkdown?: string | null
  researchReportMarkdown?: string | null
  briefingSummary?: string | null
  toneStrategy?: string | null
}

export function hasRevisionAiConfig() {
  return hasClaudeCliConfig()
}

function stripMarkdownFences(value: string) {
  const trimmed = value.trim()
  if (trimmed.startsWith('```')) {
    return trimmed.replace(/^```(?:markdown)?\s*/u, '').replace(/\s*```$/u, '').trim()
  }
  return trimmed
}

async function callAnthropic(systemPrompt: string, userPrompt: string, _maxTokens: number): Promise<string> {
  const result = await callClaudeCli({ systemPrompt, userPrompt, model: 'sonnet', timeoutMs: 180000 })
  if (!result.text) throw new Error('Claude CLI bos yanit dondu.')
  return stripMarkdownFences(result.text)
}

// ─── Revizyon Raporu Üretimi ────────────────────────────────────────────────

export async function generateRevisionReportWithAi(input: RevisionInput): Promise<string> {
  const systemPrompt = [
    'Sen kidemli bir avukatin ic denetcisisin.',
    'Verilen dilekce taslagi ile savunma simulasyonunu karsilastirarak revizyon raporu olustur.',
    'Yapay zeka oldugun ASLA anlasilmamali.',
    '',
    'YASAK: "Sonuc olarak", "ozetle", "belirtmek gerekir ki" gibi kliseler.',
    '',
    'Degerlendirme kriterleri:',
    '1. ISPAT YUKU: Her iddianin ispat karsiligi var mi?',
    '2. MEVZUAT UYUMU: Atif yapilan maddeler dogru ve guncel mi?',
    '3. ICTIHAT GUCU: Kullanilan Yargitay kararlari gercekten ilgili mi?',
    '4. KARSI TARAF PERSPEKTIFI: Savunma simulasyonundaki saldiri noktallarina yanit verilmis mi?',
    '5. TON VE USLUP: Resmi, kendinden emin ama agdali degil mi?',
    '6. NETICE-I TALEP: Tutarli ve eksiksiz mi?',
    '',
    'Cikti formati:',
    '---',
    'GUVEN NOTU:',
    '- Mevzuat referanslari: [DOGRULANMIS / DOGRULANMASI GEREKIR]',
    '- Yargitay kararlari: [DOGRULANMIS / DOGRULANMASI GEREKIR / BULUNAMADI]',
    '- Risk flag: [VAR - aciklama / YOK]',
    '---',
    '',
    '# Revizyon Raporu',
    '',
    '## Guclu Noktalar',
    '- [Neyi iyi yapmis]',
    '',
    '## Duzeltilmesi Gereken Noktalar',
    '1. [Sorun] -> [Onerilen duzeltme]',
    '',
    '## Eklenmesi Gereken Noktalar',
    '- [Savunma simulasyonundaki eksik yanit]',
    '',
    '## Cikarilmasi Gereken Noktalar',
    '- [Zayiflatan veya gereksiz kisim]',
    '',
    '## Sonraki Adim',
    '[v2 icin net talimat listesi]',
  ].join('\n')

  const userParts = [
    `Dava: ${input.caseTitle} (${input.caseType})`,
    input.briefingSummary ? `Briefing: ${input.briefingSummary}` : null,
    input.toneStrategy ? `Ton stratejisi: ${input.toneStrategy}` : null,
    `\n--- DILEKCE v1 ---\n${input.pleadingV1Markdown}`,
    input.defenseSimulationMarkdown
      ? `\n--- SAVUNMA SIMULASYONU ---\n${input.defenseSimulationMarkdown}`
      : null,
    input.researchReportMarkdown
      ? `\n--- ARASTIRMA RAPORU ---\n${input.researchReportMarkdown}`
      : null,
    '',
    'Yukaridaki dilekce v1 ve savunma simulasyonunu karsilastirarak revizyon raporu olustur.',
    'Savunma simulasyonundaki her saldiri noktasinin dilekcede karsilanip karsilanmadigini kontrol et.',
  ]

  return callAnthropic(systemPrompt, userParts.filter(Boolean).join('\n'), 4000)
}

// ─── v2 Dilekçe Üretimi ────────────────────────────────────────────────────

export async function generatePleadingV2WithAi(
  input: RevisionInput & { revisionReportMarkdown: string }
): Promise<string> {
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
    '',
    'REFERANS FORMATLARI:',
    'Yargitay: Yargitay X. Hukuk Dairesinin GG.AA.YYYY tarih ve YYYY/XXXXX E., YYYY/XXXXX K. sayili kararinda...',
    'Mevzuat: 4857 sayili Is Kanununun XX. maddesi uyarinca...',
    '',
    'Emin olmadigin karar numaralarina "dogrulanmasi gerekir" notu ekle.',
    'Uydurma Yargitay karar numarasi YAZMA.',
    '',
    'Ciktinin basina GUVEN NOTU blogu ekle.',
    'Ardindan dilekce metnini Markdown olarak yaz.',
  ].join('\n')

  const userParts = [
    `Dava: ${input.caseTitle} (${input.caseType})`,
    input.toneStrategy ? `Ton stratejisi: ${input.toneStrategy}` : null,
    `\n--- DILEKCE v1 ---\n${input.pleadingV1Markdown}`,
    input.defenseSimulationMarkdown
      ? `\n--- SAVUNMA SIMULASYONU ---\n${input.defenseSimulationMarkdown}`
      : null,
    `\n--- REVIZYON RAPORU ---\n${input.revisionReportMarkdown}`,
    '',
    'Revizyon raporundaki talimatlara gore v1 dilekcesini guncelle ve v2 dilekcesi olustur.',
    'Savunma simulasyonundaki saldiri noktalarina karsi proaktif paragraflar ekle.',
    'v1 deki guclu noktalari koru, zayif noktalari duzelt.',
    'Tam dilekce metni yaz — sadece degisiklikleri degil, tum dilekceyi yeniden ver.',
  ]

  return callAnthropic(systemPrompt, userParts.filter(Boolean).join('\n'), 8000)
}

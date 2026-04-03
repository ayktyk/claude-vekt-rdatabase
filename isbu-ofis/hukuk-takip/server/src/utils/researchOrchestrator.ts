/**
 * Research Orchestrator — Claude CLI ile akıllı hukuki araştırma
 *
 * Çalışma prensibi:
 * 1. Dava bağlamını analiz eder, system prompt ve user prompt hazırlar
 * 2. Claude CLI'yi -p (print) modunda çalıştırır
 * 3. Claude CLI, yargi ve mevzuat CLI araçlarını Bash üzerinden doğrudan kullanır
 * 4. Kullanıcının Pro/Max planı kullanılır — API kredisi harcanmaz
 */

import { spawn } from 'node:child_process'
import { getCaseTypeMapping } from './research.js'

// ─── Tipler ─────────────────────────────────────────────────────────────────

type OrchestratorInput = {
  caseTitle: string
  caseType: string | null
  customCaseType?: string | null
  caseDescription?: string | null
  criticalPoint: string
  briefingSummary?: string | null
  mainLegalAxis?: string | null
  searchKeywords?: string | null
  toneStrategy?: string | null
  secondaryRisks?: string | null
  proofRisks?: string | null
  anthropicApiKey?: string | null // artık kullanılmıyor ama uyumluluk için
}

export type OrchestratorResult = {
  researchMarkdown: string
  toolCallCount: number
  tokensUsed: { input: number; output: number }
  decisionsFound: number
  legislationFound: number
  modelUsed: string
}

// ─── Claude CLI Path ────────────────────────────────────────────────────────

const CLAUDE_CLI = 'C:\\Users\\user\\.local\\bin\\claude.exe'

// ─── System Prompt Builder ──────────────────────────────────────────────────

function buildSystemPrompt(input: OrchestratorInput): string {
  const mapping = getCaseTypeMapping(input.caseType, input.customCaseType)

  const parts = [
    'Sen 20 yıllık tecrübeli bir Türk hukuk araştırmacısısın.',
    'Görevin: verilen dava bağlamında en güçlü ve güncel Yargıtay kararlarını ve mevzuat hükümlerini bulmak.',
    '',
    'ARAÇLAR:',
    'Araştırma için iki CLI aracın var. Bunları Bash ile çalıştır:',
    '',
    '1. YARGI CLI — Yargıtay/Danıştay kararı arama:',
    '   yargi bedesten search "arama terimi"                    # Genel arama',
    '   yargi bedesten search "terim" -c YARGITAYKARARI -b H9   # Daire filtresi',
    '   yargi bedesten search "terim" -b HGK                    # HGK kararları',
    '   yargi bedesten search "terim" --date-start 2024-01-01   # Tarih filtresi',
    '   yargi bedesten doc <documentId>                          # Karar tam metni',
    '',
    '2. MEVZUAT CLI — Kanun/yönetmelik/tebliğ arama:',
    '   mevzuat search "kanun adı" -t KANUN                     # Kanun ara',
    '   mevzuat search "iş kanunu" -t KANUN -n 4857             # Numara ile',
    '   mevzuat doc <mevzuatId>                                  # Tam metin',
    '   mevzuat tree <mevzuatId>                                 # Madde ağacı',
    '   mevzuat article <maddeId>                                # Tek madde',
    '',
    'ÇALIŞMA PRENSİBİ:',
    '1. Önce kritik noktayı analiz et, 3-5 farklı arama terimi türet',
    '2. Her terimle yargi bedesten search yap (doğru daire filtresi ile)',
    '3. HGK ve İBK kararlarını mutlaka ara (-b HGK ile)',
    '4. En ilgili 3-5 kararın tam metnini yargi bedesten doc ile çek',
    '5. İlgili kanun maddelerini mevzuat search + mevzuat doc ile getir',
    '6. Kararlar arasındaki tutarlılığı ve çelişkileri tespit et',
    '7. Yerleşik uygulamadan sapmayı belirle',
    '',
    'ARAMA STRATEJİSİ:',
    '- Kısa ve odaklı arama terimleri kullan (3-5 kelime)',
    '- Farklı hukuki terimleri dene: "haklı fesih" vs "haklı nedenle fesih"',
    '- Hem genel hem spesifik terimlerle ara',
    '- Son 2 yılın kararlarına öncelik ver (--date-start 2024-01-01)',
    '- Eski ama emsal niteliğinde kararlar da değerli',
    '- Mevzuat aramasında: önce kanun adıyla ara, sonuç yoksa madde içeriğiyle ara',
  ]

  if (mapping) {
    parts.push(
      '',
      `DAVA TÜRÜ BİLGİSİ (${input.caseType}):`,
      `- Öncelikli Yargıtay daireleri: ${mapping.yargiChambers.join(', ')}`,
      `  Her daire için ayrı ayrı arama yap.`,
      `- Temel kanunlar: ${mapping.mevzuatKeyLaws.map((l) => `${l.number} sayılı ${l.title}`).join(', ')}`,
      `- Anahtar kelimeler: ${mapping.defaultKeywords.join(', ')}`,
      mapping.yargiCourtType !== 'YARGITAYKARARI' ? `- Mahkeme türü: ${mapping.yargiCourtType}` : '',
    )
  }

  parts.push(
    '',
    'ÇIKTI FORMATI:',
    'Araştırma tamamlandığında aşağıdaki formatta markdown rapor yaz:',
    '',
    '---',
    'GÜVEN NOTU:',
    '- Yargıtay kararları: [DOĞRULANMIŞ / DOĞRULANMASI GEREKİR]',
    '- Mevzuat referansları: [DOĞRULANMIŞ / DOĞRULANMASI GEREKİR]',
    '- Risk flag: [VAR - açıklama / YOK]',
    '---',
    '',
    '# Araştırma Raporu: [Kritik Nokta]',
    '',
    '## İlgili Mevzuat',
    '[Kanun adı — Madde No — özet]',
    '',
    '## Güncel Yargıtay Kararları (Son 2 Yıl)',
    '[Daire | Tarih | Esas/Karar No | 2-3 cümle özet | Emsal değeri]',
    '',
    '## HGK / İBK Kararları',
    '[Varsa künyesi ve özeti. Yoksa açıkça "Tespit edilmedi" yaz.]',
    '',
    '## Çelişkili Noktalar ve Sapma Uyarıları',
    '[Kararlar arası çelişki varsa]',
    '',
    '## Dilekçeye Taşınacak Argümanlar',
    '- [Argüman: Hangi karara/mevzuata dayandırılacak]',
    '',
    'YASAK: Uydurma karar numarası YAZMA. Bulamadığını açıkça belirt.',
    'YASAK: Yapay zeka olduğun anlaşılacak ifadeler kullanma.',
  )

  return parts.filter(Boolean).join('\n')
}

function buildUserPrompt(input: OrchestratorInput): string {
  const parts = [
    `Dava: ${input.caseTitle}`,
    input.caseType ? `Dava Türü: ${input.caseType}` : null,
    input.customCaseType ? `Özel Dava Türü: ${input.customCaseType}` : null,
    input.caseDescription ? `Dava Açıklaması:\n${input.caseDescription}` : null,
    '',
    `KRİTİK NOKTA (araştırmanın odak noktası):\n${input.criticalPoint}`,
    '',
    input.briefingSummary ? `Briefing Özeti:\n${input.briefingSummary}` : null,
    input.mainLegalAxis ? `Ana Hukuki Eksen: ${input.mainLegalAxis}` : null,
    input.secondaryRisks ? `İkincil Riskler: ${input.secondaryRisks}` : null,
    input.proofRisks ? `İspat Riskleri: ${input.proofRisks}` : null,
    input.searchKeywords ? `Anahtar Kelimeler: ${input.searchKeywords}` : null,
    input.toneStrategy ? `Ton Stratejisi: ${input.toneStrategy}` : null,
    '',
    'GÖREV:',
    '1. Yukarıdaki kritik nokta için kapsamlı bir hukuki araştırma yap.',
    '2. Önce arama sorgularını planla — en az 3 farklı arama terimi türet.',
    '3. Her öncelikli daire için ayrı yargi bedesten search yap.',
    '4. HGK/İBK kararlarını -b HGK filtresiyle mutlaka ara.',
    '5. İlgili kanunları mevzuat search ile bul.',
    '6. En alakalı kararların tam metnini yargi bedesten doc ile çek.',
    '7. Sonuçları analiz edip rapor formatında yaz.',
  ]

  return parts.filter(Boolean).join('\n')
}

// ─── Claude CLI Çalıştırma ─────────────────────────────────────────────────

function runClaudeCli(options: {
  systemPrompt: string
  userPrompt: string
  model?: string
  maxBudgetUsd?: number
  timeoutMs?: number
}): Promise<{ output: string; raw: string }> {
  const {
    systemPrompt,
    userPrompt,
    model = 'opus',
    maxBudgetUsd = 0,
    timeoutMs = 300000, // 5 dakika varsayılan
  } = options

  return new Promise((resolve, reject) => {
    const args = [
      '-p',                        // print mode (non-interactive)
      '--output-format', 'json',   // JSON çıktı
      '--model', model,
      '--system-prompt', systemPrompt,
    ]

    if (maxBudgetUsd > 0) {
      args.push('--max-budget-usd', String(maxBudgetUsd))
    }

    // ÖNEMLI: prompt, variadic --allowedTools'tan ÖNCE gelmeli
    // yoksa tools flag'i prompt'u yutar
    args.push(userPrompt)

    // --allowedTools variadic olduğu için en sona koy
    args.push('--allowedTools', 'Bash', 'Read')

    // ANTHROPIC_API_KEY env'de varsa CLI bunu kullanır (bakiye yoksa hata verir).
    // Pro/Max plan (OAuth) kullanmak için: key'i env'den çıkar + --bare kullanma.
    const cleanEnv: Record<string, string> = {}
    for (const [k, v] of Object.entries(process.env)) {
      if (k.startsWith('ANTHROPIC_')) continue
      if (v !== undefined) cleanEnv[k] = v
    }

    console.log(`[orchestrator] Claude CLI başlatılıyor (model: ${model}), ANTHROPIC_API_KEY in env: ${!!cleanEnv.ANTHROPIC_API_KEY}`)
    console.log(`[orchestrator] Args: ${args.slice(0, 6).join(' ')} ...`)

    const child = spawn(CLAUDE_CLI, args, {
      shell: false,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...cleanEnv,
        PYTHONIOENCODING: 'utf-8',
      },
    })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf-8')
    })

    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf-8')
    })

    const timer = setTimeout(() => {
      child.kill('SIGTERM')
      reject(new Error(`Claude CLI zaman aşımı (${timeoutMs / 1000}s). Stderr: ${stderr.slice(0, 500)}`))
    }, timeoutMs)

    child.on('error', (err) => {
      clearTimeout(timer)
      reject(new Error(`Claude CLI başlatılamadı: ${err.message}`))
    })

    child.on('close', (code) => {
      clearTimeout(timer)

      if (code !== 0) {
        console.error(`[orchestrator] Claude CLI hata kodu ${code}`)
        console.error(`[orchestrator] Stdout (ilk 500): ${stdout.slice(0, 500)}`)
        console.error(`[orchestrator] Stderr (ilk 500): ${stderr.slice(0, 500)}`)
        reject(new Error(`Claude CLI hata kodu ${code}. Stdout: ${stdout.slice(0, 300)}. Stderr: ${stderr.slice(0, 300)}`))
        return
      }

      try {
        // JSON çıktıyı parse et
        const parsed = JSON.parse(stdout.trim())

        // CLI başarıyla çıksa bile is_error kontrolü yap
        if (parsed.is_error) {
          reject(new Error(`Claude CLI hatası: ${parsed.result || 'Bilinmeyen hata'}`))
          return
        }

        const resultText = parsed.result || parsed.text || parsed.content || ''
        resolve({ output: resultText, raw: stdout })
      } catch {
        // JSON parse başarısızsa ham çıktıyı kullan
        resolve({ output: stdout.trim(), raw: stdout })
      }
    })
  })
}

// ─── Ana Orkestratör ────────────────────────────────────────────────────────

export async function runOrchestratedResearch(input: OrchestratorInput): Promise<OrchestratorResult> {
  const systemPrompt = buildSystemPrompt(input)
  const userPrompt = buildUserPrompt(input)

  console.log(`[orchestrator] Araştırma başlatılıyor: "${input.criticalPoint.slice(0, 80)}..."`)

  const startTime = Date.now()

  const { output: researchMarkdown, raw } = await runClaudeCli({
    systemPrompt,
    userPrompt,
    model: 'opus',
    timeoutMs: 600000, // 10 dakika — araştırma uzun sürebilir
  })

  const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`[orchestrator] Claude CLI tamamlandı (${elapsedSec}s)`)

  // İstatistikleri çıkar
  const decisionsFound = (researchMarkdown.match(/Esas.*?\/.*?Karar/gu) || []).length
  const legislationFound = (researchMarkdown.match(/sayılı.*?[Kk]anun/gu) || []).length

  // JSON çıktıdan token bilgilerini çıkarmayı dene
  let inputTokens = 0
  let outputTokens = 0
  let toolCallCount = 0
  try {
    const parsed = JSON.parse(raw)
    inputTokens = parsed.input_tokens || parsed.usage?.input_tokens || 0
    outputTokens = parsed.output_tokens || parsed.usage?.output_tokens || 0
    toolCallCount = parsed.num_turns || 0
  } catch {
    // token bilgisi alınamazsa 0 kalır
  }

  return {
    researchMarkdown: stripMarkdownFences(researchMarkdown),
    toolCallCount,
    tokensUsed: { input: inputTokens, output: outputTokens },
    decisionsFound,
    legislationFound,
    modelUsed: 'claude-cli-opus',
  }
}

function stripMarkdownFences(value: string) {
  const trimmed = value.trim()
  if (trimmed.startsWith('```')) {
    return trimmed.replace(/^```(?:markdown)?\s*/u, '').replace(/\s*```$/u, '').trim()
  }
  return trimmed
}

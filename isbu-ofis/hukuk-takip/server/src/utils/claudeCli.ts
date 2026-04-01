/**
 * Claude CLI Yardımcı Modülü
 *
 * Tüm AI fonksiyonları bu modülü kullanarak Claude CLI üzerinden çalışır.
 * Kullanıcının Pro/Max planı kullanılır — API kredisi harcanmaz.
 */

import { spawn } from 'node:child_process'

const CLAUDE_CLI = 'C:\\Users\\user\\.local\\bin\\claude.exe'

export type ClaudeCliOptions = {
  systemPrompt: string
  userPrompt: string
  model?: 'opus' | 'sonnet' | 'haiku'
  tools?: string       // 'Bash,Read' gibi — varsayılan: araç yok
  maxBudgetUsd?: number
  timeoutMs?: number
  jsonSchema?: string  // yapısal çıktı için JSON schema
}

export type ClaudeCliResult = {
  text: string
  raw: string
  inputTokens: number
  outputTokens: number
  numTurns: number
  durationMs: number
}

/**
 * Claude CLI'yi non-interactive modda çalıştırır.
 * Pro/Max plan kullanır, API key gerekmez.
 */
export async function callClaudeCli(options: ClaudeCliOptions): Promise<ClaudeCliResult> {
  const {
    systemPrompt,
    userPrompt,
    model = 'sonnet',
    tools,
    maxBudgetUsd = 0,
    timeoutMs = 180000, // 3 dakika varsayılan
    jsonSchema,
  } = options

  return new Promise((resolve, reject) => {
    const args = [
      '-p',                        // print mode (non-interactive)
      '--output-format', 'json',   // JSON çıktı
      '--model', model,
      '--system-prompt', systemPrompt,
      '--bare',                    // hooks, CLAUDE.md, LSP atla
    ]

    if (tools) {
      args.push('--tools', tools)
    } else {
      args.push('--tools', '')   // araç kullanma
    }

    if (maxBudgetUsd > 0) {
      args.push('--max-budget-usd', String(maxBudgetUsd))
    }

    if (jsonSchema) {
      args.push('--json-schema', jsonSchema)
    }

    args.push(userPrompt)

    const startTime = Date.now()

    const child = spawn(CLAUDE_CLI, args, {
      shell: false,
      windowsHide: true,
      env: {
        ...process.env,
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
      const durationMs = Date.now() - startTime

      if (code !== 0) {
        reject(new Error(`Claude CLI hata kodu ${code}. Stderr: ${stderr.slice(0, 500)}`))
        return
      }

      let text = ''
      let inputTokens = 0
      let outputTokens = 0
      let numTurns = 0

      try {
        const parsed = JSON.parse(stdout.trim())
        text = parsed.result || parsed.text || parsed.content || ''
        inputTokens = parsed.input_tokens || parsed.usage?.input_tokens || 0
        outputTokens = parsed.output_tokens || parsed.usage?.output_tokens || 0
        numTurns = parsed.num_turns || 0
      } catch {
        // JSON parse başarısızsa ham çıktıyı kullan
        text = stdout.trim()
      }

      resolve({ text, raw: stdout, inputTokens, outputTokens, numTurns, durationMs })
    })
  })
}

/**
 * Claude CLI kullanılabilir mi kontrol eder.
 * Pro/Max plan ile giriş yapılmış mı bakar.
 */
export function hasClaudeCliConfig(): boolean {
  try {
    const fs = require('fs')
    return fs.existsSync(CLAUDE_CLI)
  } catch {
    return false
  }
}

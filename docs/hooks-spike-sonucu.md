# Hooks Doğrulama Spike Sonucu — Faz 1.0

**Tarih:** 2026-05-01
**Test:** `mcp__buro-hafizasi__mempalace_status` çağrısı sırasında `hooks/mcp-timing-spike.sh` PreToolUse hook'u tetiklendi mi?

## SONUÇ: **PLAN A BAŞARILI** ✅

Hook'lar Claude Code'da MCP tool call'larını deterministik yakalıyor. Plan B (session log parse) **gerekli değil**. Production'a Plan A ile devam edilir.

## Test Bulgular

### 1. Hook Tetiklenme

✅ `mcp__buro-hafizasi__mempalace_status` çağrısı yapıldı
✅ Hook script `hooks/mcp-timing-spike.sh` tetiklendi
✅ `tmp/hook-spike.log` 1 yeni entry yazdı

### 2. Hook Input Mekaniği

❌ **Eski env var pattern** (`CLAUDE_TOOL_NAME`, `CLAUDE_TOOL_INPUT`) **artık çalışmıyor** — modern Claude Code stdin JSON kullanıyor

✅ **Stdin JSON payload** (gelen veri):
```json
{
  "session_id": "7e62a9bd-b244-42b4-a3e8-76e40a8dbda3",
  "transcript_path": "C:\\Users\\user\\.claude\\projects\\<proj>\\<session>.jsonl",
  "cwd": "C:\\Users\\user\\Desktop\\projelerim\\aktif projeler\\Vektör Database li Otomasyon Claude Code",
  "permission_mode": "auto",
  "hook_event_name": "PreToolUse",
  "tool_name": "mcp__buro-hafizasi__mempalace_status",
  "tool_input": {},
  "tool_use_id": "toolu_01KPw5eCma1..."
}
```

### 3. Mevcut Env Var'lar

✅ `CLAUDE_PROJECT_DIR` set: `/c/Users/user/Desktop/projelerim/aktif projeler/Vektör Database li Otomasyon Claude Code`
✅ `CLAUDE_CODE_ENTRYPOINT=cli`, `CLAUDE_CODE_SSE_PORT=49527`
❌ `CLAUDE_TOOL_NAME`, `CLAUDE_TOOL_INPUT`, `ASAMA`, `DAVA_ID` env var olarak GELMİYOR

**Sonuç:** Tool name + tool_use_id stdin'den extract edilmeli. ASAMA + DAVA_ID Director tarafından **alt-process'in env'ine** set edilmeli (mevcut hook kontekstinde değil).

### 4. KVKK Risk

⚠️ Stdin JSON'da `tool_input` field'ı **müvekkil verisi içerebilir** (örn. arama sorgusu, dosya path). Hook **asla `tool_input`'u log'a yazmamalı**.

Production hook sadece şu alanları yazar:
- `tool_name`
- `tool_use_id`
- `ts_ns`
- `asama` + `dava_id` (env var'dan, kullanılabilirse)

`tool_input` HARİÇ.

### 5. Performance

Spike hook ~10ms ekledi (MCP call latency'sinden çok düşük). Production-ready.

## Plan A Production Implementasyonu

### Yeni dosyalar:
- `hooks/mcp-timing-pre.sh` — production PreToolUse hook (KVKK güvenli)
- `hooks/mcp-timing-post.sh` — production PostToolUse hook
- `config/profiling.json` — feature flag (true/false)

### Settings update:
- `.claude/settings.local.json` → `hooks.PreToolUse` ve `hooks.PostToolUse`'a `mcp__.*` matcher ile production hook'lar
- Spike hook'u kaldır

### Director SKILL update (Faz 1.3):
- Director her ASAMA başında `ASAMA=N DAVA_ID=...` env var'ı Bash subprocess'e set etmeli
- Bash hook'u env var'ı subprocess'e geçmediği için **alternatif**: Director her ASAMA bilgisini `tmp/current-asama.txt` dosyasına yazar, hook script bu dosyayı okur

**Karar:** `tmp/current-asama.txt` pattern kullanılır. Hook script:
```bash
ASAMA=$(cat "$PROJECT_DIR/tmp/current-asama.txt" 2>/dev/null | head -1 || echo "unknown")
DAVA_ID=$(cat "$PROJECT_DIR/tmp/current-dava-id.txt" 2>/dev/null | head -1 || echo "unknown")
```

## Spike Hook Kaldırma

Production hook'lar bağlandıktan sonra:
- `hooks/mcp-timing-spike.sh` silinmez (referans olarak kalır)
- `tmp/hook-spike.log` Faz 2 sonu silinir
- `.claude/settings.local.json`'daki spike matcher production matcher ile değiştirilir

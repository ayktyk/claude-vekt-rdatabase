# Profiling Timing Analizi — 2026-05-04 18:11 UTC


Üretildi: `python scripts/timing-report.py`


## 0. Özet (Tüm Veri)

- **Toplam LLM çağrı:** 6 (toplam 0ms)
- **Toplam MCP çağrı:** 90 (toplam 25m 10s)
- **Toplam Script çağrı:** 16 (toplam 1m 26s)
- **Toplam Avukat bekleme:** 41 idle entry (toplam 11m 32s)

**Wall-clock dağılımı:**
- LLM: 0.0%
- MCP: 66.0%
- Script: 3.8%
- Avukat bekleme: 30.2%


## 1. Per-Dava Timeline

### engin-kaya-arac-km-2026-001

| ASAMA | LLM (call) | MCP (call) | Script | Input tok | Output tok | Toplam |
|---|---|---|---|---|---|---|
| ASAMA 0 - MemPalace Wake-up | 0ms (0) | 4.5s (3) | 0ms (0) | 0 | 0 | **4.5s** |
| ASAMA 2 - Hibrit Arastirma | 0ms (0) | 25m 4s (86) | 0ms (0) | 0 | 0 | **25m 4s** |
| **TOPLAM** | | | | **0** | **0** | **25m 9s** |


## 2. Per-MCP İstatistikleri

| MCP Server | n | mean | median | p95 | max | std | total | outlier (>2σ) |
|---|---|---|---|---|---|---|---|---|
| `buro-hafizasi` | 17 | 1.5s | 1.4s | 3.1s | 3.1s | 463ms | 25.4s | 1 |
| `claude_ai_Literat_r_MCP` | 1 | 35.4s | 35.4s | 35.4s | 35.4s | 0ms | 35.4s | 0 |
| `claude_ai_Mevuzat_MCP` | 10 | 4.9s | 5.1s | 7.0s | 7.0s | 1.2s | 49.3s | 0 |
| `claude_ai_Yarg_MCP` | 13 | 7.0s | 4.3s | 22.2s | 22.2s | 6.7s | 1m 31s | 2 |
| `hukuk-kutuphanesi` | 2 | 951ms | 951ms | 1.0s | 1.0s | 72ms | 1.9s | 0 |
| `notebooklm` | 47 | 27.8s | 4.8s | 2m 2s | 2m 3s | 36.8s | 21m 47s | 4 |


## 3. Per-Tool İstatistikleri (en sık çağrılanlar)

| Tool | n | mean | p95 | total |
|---|---|---|---|---|
| `mcp__notebooklm__notebook_query` | 17 | 1m 10s | 2m 3s | 19m 55s |
| `mcp__buro-hafizasi__mempalace_search` | 12 | 1.4s | 1.7s | 17.0s |
| `mcp__notebooklm__notebook_query_status` | 12 | 2.7s | 4.8s | 32.8s |
| `mcp__claude_ai_Yarg_MCP__search_bedesten_unified` | 10 | 4.2s | 5.4s | 42.0s |
| `mcp__notebooklm__notebook_query_start` | 10 | 4.1s | 5.7s | 41.1s |
| `mcp__notebooklm__notebook_list` | 6 | 5.1s | 10.1s | 30.9s |
| `mcp__claude_ai_Mevuzat_MCP__search_mevzuat` | 4 | 3.7s | 3.9s | 14.9s |
| `mcp__claude_ai_Mevuzat_MCP__get_mevzuat_content` | 4 | 5.8s | 7.0s | 23.2s |
| `mcp__buro-hafizasi__mempalace_status` | 3 | 1.2s | 1.5s | 3.7s |
| `mcp__hukuk-kutuphanesi__hukuk_ara` | 2 | 951ms | 1.0s | 1.9s |
| `mcp__claude_ai_Yarg_MCP__check_government_servers_health` | 2 | 22.0s | 22.2s | 44.1s |
| `mcp__claude_ai_Mevuzat_MCP__get_mevzuat_madde_tree` | 2 | 5.6s | 6.0s | 11.2s |
| `mcp__buro-hafizasi__mempalace_diary_write` | 2 | 2.4s | 3.1s | 4.7s |
| `mcp__notebooklm__refresh_auth` | 2 | 3.9s | 4.0s | 7.8s |
| `mcp__claude_ai_Yarg_MCP__get_bedesten_document_markdown` | 1 | 4.4s | 4.4s | 4.4s |


## 4. Per-Model (Gemini-bridge) İstatistikleri

| Model | n | mean | p95 | input tok (sum) | output tok (sum) | retry sayısı | fallback sayısı |
|---|---|---|---|---|---|---|---|
| `gemini-3-flash-preview` | 2 | 0ms | 0ms | 0 | 0 | 0 | 0 |
| `gemini-3-pro-preview` | 4 | 0ms | 0ms | 0 | 0 | 0 | 0 |


## 5. Avukat Bekleme (Idle Time) İstatistikleri

| Tür | n | mean | median | p95 | max | total |
|---|---|---|---|---|---|---|
| Avukat düşünme/yazma | 13 | 32.8s | 0ms | 5m 50s | 5m 50s | **7m 7s** |
| AI işleme | 14 | 11.9s | 3.5s | 40.0s | 40.0s | **2m 46s** |


## 6. Run-to-Run Varyans (Aynı dava farklı koşum)
*Run-to-run karşılaştırma için aynı davanın 2+ koşumu gerekli.*

# Profiling Timing Analizi — 2026-05-01 17:54 UTC


Üretildi: `python scripts/timing-report.py`


## 0. Özet (Tüm Veri)

- **Toplam LLM çağrı:** 6 (toplam 0ms)
- **Toplam MCP çağrı:** 1 (toplam 836ms)
- **Toplam Script çağrı:** 0 (toplam 0ms)
- **Toplam Avukat bekleme:** 41 idle entry (toplam 11m 32s)

**Wall-clock dağılımı:**
- LLM: 0.0%
- MCP: 0.1%
- Script: 0.0%
- Avukat bekleme: 99.9%


## 1. Per-Dava Timeline

*Henüz hiç dava verisi yok. Dava ID'siz log entry'leri için aşağıdaki 'Genel İstatistik' bölümüne bakın.*


## 2. Per-MCP İstatistikleri

| MCP Server | n | mean | median | p95 | max | std | total | outlier (>2σ) |
|---|---|---|---|---|---|---|---|---|
| `buro-hafizasi` | 1 | 836ms | 836ms | 836ms | 836ms | 0ms | 836ms | 0 |


## 3. Per-Tool İstatistikleri (en sık çağrılanlar)

| Tool | n | mean | p95 | total |
|---|---|---|---|---|
| `mcp__buro-hafizasi__mempalace_status` | 1 | 836ms | 836ms | 836ms |


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

# Yargı-MCP-Pro Tool Envanteri

**Server:** `https://yargi-mcp-pro-production.up.railway.app/mcp`
**Transport:** HTTP
**Auth:** OAuth 2.0 (AuthKit/WorkOS staging) — tamamlandı ✓
**Kuruluş tarihi:** 2026-05-19
**Mühendis:** [staging hesabı sahibi — avukat detayını yazacak]

---

## Bağlantı Durumu

- [x] `claude mcp add yargi-mcp-pro --transport http https://...` çalıştırıldı
- [x] `claude mcp list` → **✓ Connected**
- [x] OAuth tamamlandı (AuthKit staging)
- [x] 7 tool şeması yüklendi (ToolSearch)
- [x] Pilot sorgu başarılı (aşağıda)

---

## Tool Listesi (7 tool — Discovery tamamlandı)

| # | Tool Adı | Görev | Önemli Parametreler | Dönüş Özeti | Rate-Limit Notu |
|---|---|---|---|---|---|
| 1 | `legal_research_guide` | İngilizce meta-rehber — 5 tool için Solr vs Boolean farkları, 7 worked example, hiyerarşi açıklaması | (parametre yok) | ~3000 kelime Markdown | Cached, free, rate limit yok |
| 2 | `udf_format_guide` | UYAP UDF format rehberi (udf-cli + 4 dönüşüm komutu) | (parametre yok) | ~2300 kelime Markdown | Cached, free, rate limit yok |
| 3 | `search_bedesten_unified` | **Mahkeme kararı arama** (Yargıtay + Danıştay + Yerel + İstinaf + KYB) | `phrase` (Bedesten Solr — AND/OR/NOT/+/-/"exact"/grouping, NO wildcards), `birimAdi` (H1..H23, C1..C23, HGK, CGK, D1..D17, IBK vb.), `court_types`, `kararTarihiStart/End`, `esas_no`, `karar_no`, `pageNumber`, `page_size` (1-100, default 10), `sort_direction` | `{ decisions[], total_records, requested_page, page_size, searched_courts[] }` — her decision: `documentId`, `birimAdi`, `esasNo`, `kararNo`, `kararTarihi` | Pilotta gözlenmedi (envanter sırasında 429 alınmadı) |
| 4 | `get_bedesten_document_markdown` | documentId → tam karar metni Markdown | `documentId` (search'ten alınır) | Markdown string | Cached, rate-limit cache'i atlatır |
| 5 | `search_mevzuat` | **12 mevzuat tipi global arama** (KANUN, KHK, TUZUK, YONETMELIK, CB_KARARNAME, CB_YONETMELIK, CB_KARAR, CB_GENELGE, KKY, UY, TEBLIGLER, **MULGA**) | `mevzuat_adi` (title plain), `phrase` (Mevzuat Solr — +/-/"exact"/wildcard*/fuzzy~/proximity~N/boost^N, AND/OR/NOT LİTERAL BREAK eder), `mevzuat_no`, `mevzuat_tur_list[]`, `resmi_gazete_tarihi_start/end`, `page`, `page_size` (max 20 — upstream cap) | `{ mevzuat[], total_records, ... }` — her madde: `mevzuat_id`, `mevzuat_adi`, `mevzuat_no`, `mevzuat_tur`, `resmi_gazete_*` | "20'den fazla olamaz" cap'i tool şemasında zorlanmış (CLAUDE.md eski uyarısıyla uyumlu) |
| 6 | `search_within_mevzuat` | **Tek mevzuat içinde boolean arama** (local evaluator, NOT Solr — AND/OR/NOT UPPERCASE çalışır) | `mevzuat_id` (search_mevzuat'tan), `query` (boolean), `page`, `page_size` (1-50, default 25), `sort_by` (relevance / document_order) | `{ results[], source ("tree_slice"/"sliding_window"/"pdf_full"), total_pages, ... }` — her result: `madde_id`, `madde_no`, `madde_title`, `match_count`, `snippet` | Cached, local eval |
| 7 | `get_mevzuat_document` | **Polimorfik fetch** — `id_type=mevzuat/madde/gerekce/outline` | `id`, `id_type`, `chunk` (büyük dökümanlar için, 50KB üstünde otomatik chunk) | Markdown (mevzuat/madde/gerekce) veya outline tree (madde_id'ler için) | Cached. >50KB'lık (VUK, KDV Tebliği vb.) auto-chunk. `has_outline: false` dönerse outline yok |

---

## Pilot Sorgu Sonucu

```
Test: search_bedesten_unified(phrase='"manevi tazminat" AND "TBK"', page_size=3)
Sonuç: 7438 total_records, 3 karar döndürüldü:
  1. Yargıtay 4. HD 2025/14030 E. 2026/2225 K. (26.02.2026) — documentId: 1201733100
  2. Yargıtay 11. HD 2025/3510 E. 2026/1090 K. (25.02.2026) — documentId: 1203204000
  3. Yargıtay 4. HD 2025/2028 E. 2026/2040 K. (24.02.2026) — documentId: 1204310900
Durum: ✓ Çalışıyor, documentId'ler temiz, daire/tarih meta-veri tam.
```

---

## ⚠️ KRİTİK BULGU — SENARYO B Geçerli

**Yargı-MCP-Pro TEK-SHOT TOOL DEĞİL.** 5 fonksiyonel tool ayrı:
- Mahkeme kararı arama (`search_bedesten_unified`)
- Karar tam metin (`get_bedesten_document_markdown`)
- Mevzuat arama (`search_mevzuat`)
- Mevzuat içi boolean (`search_within_mevzuat`)
- Mevzuat polimorfik fetch (`get_mevzuat_document`)

**Sonuç:** Mevcut sıralı zincir mantığı (2B → 2C) **korunur**, sadece tool isimleri güncellenir. `arastir-yargi.md` + `arastir-mevzuat.md` AYRI komut olarak kalır.

---

## Mevcut Sistemle Karşılaştırma

| Konu | Eski (`mcp__claude_ai_Yarg_MCP__*` + `mcp__claude_ai_Mevuzat_MCP__*`) | Yeni Pro |
|---|---|---|
| Court arama | `search_bedesten_unified` | **Aynı isimde, daha zengin parametre** (birimAdi enum ~90 daire, court_types[]) |
| Karar tam metin | `get_bedesten_document_markdown` | Aynı |
| Mevzuat global | `search_mevzuat` + 9 spesifik tool (`search_kanun`, `search_khk`, ...) | **Tek `search_mevzuat` + `mevzuat_tur_list` enum** — 9 ayrı tool yerine tek tool |
| Mevzuat içi arama | `search_within_mevzuat` + 9 spesifik | **Tek `search_within_mevzuat` + boolean parser** |
| Polimorfik fetch | `get_mevzuat_content` + `_madde_tree` + `_gerekce` (3 tool) | **Tek `get_mevzuat_document` + `id_type` enum** — daha kompakt |
| Meta rehber | (yok) | `legal_research_guide` + `udf_format_guide` (cached, free) |
| Rate limit | 429 yaygın — CLAUDE.md'de 3sn bekleme protokolü | Bu testte gözlenmedi — Pro tier daha rahat görünüyor |

**Avantaj:** 12+ tool → 7 tool, parametre normalize, dilektler dokümante (Bedesten Solr vs Mevzuat Solr vs local boolean — 3 farklı dialect tool şemasında uyarı olarak yazılmış).

---

## Mülga Eleme — Mevcut Durum

- `search_mevzuat` parametresi `mevzuat_tur_list=["MULGA"]` → **sadece mülga sonuçlar** dönüyor (filtre)
- HER MADDENİN otomatik `mulga: true/false` flag'i ŞEMADAN GÖZLENMEDİ — pilotta sonuç payload incelenmesi gerek
- **Sıralı zincir korunur:** 2B karar bulur → atif madde çıkarır → 2C `search_mevzuat` ile o maddeyi çağırır → Sistem manuel mülga denetimi yapar (eski protokol)

**Mühendise soru:** Her madde response'unda `mulga: true/false` veya `yururlukte_tarih_baslangic/bitis` alanı dönüyor mu?

---

## Normlar Hiyerarşisi — Mevcut Durum

`legal_research_guide` çağrısı çıktısında **7-seviye hiyerarşi açıklanıyor**:
```
Anayasa → Kanun → KHK → CB Kararnamesi → Tüzük → Yönetmelik → Tebliğ → İçtihat
```

**Ama her arama sonucunda OTOMATİK etiket DEĞİL** — `mevzuat_tur` alanı 12 enum'dan birini döner (KANUN, KHK, vb.), hiyerarşi seviyesi prompt seviyesinde mapping yapılır.

**Mühendise soru:** Bir tool response'unda `hiyerarsi_seviyesi: 3` (Kanun) gibi numerik etiket var mı, yoksa `mevzuat_tur` enum'ından mı türetilecek?

---

## Mühendise Açık Sorular (4 madde)

1. **Mülga flag:** Her madde için otomatik `mulga: true/false` var mı? Yoksa sadece type-level mi?
2. **Hiyerarşi etiketi:** Numerik veya kategorik otomatik etiket var mı?
3. **Rate limit:** Pro tier saatlik/günlük limit? Pilotta 429 gözlenmedi.
4. **Production endpoint:** Şu an staging (talented-bear-32). Production çıkışı planlı mı?

---

## Faz 2'ye Etkisi

Karar: **Senaryo B uygulanır.**
- `arastir-yargi.md` korunur, tool isimleri güncellenir (`mcp__claude_ai_Yarg_MCP__*` → `mcp__yargi-mcp-pro__*`)
- `arastir-mevzuat.md` korunur, eski 9 spesifik tool çağrısı **tek `search_mevzuat` + `mevzuat_tur_list`** ile yer değiştirir
- Mülga eleme protokolü prompt seviyesinde kalır (otomatikleşmedi)
- Hiyerarşi etiketleme prompt seviyesinde kalır (`mevzuat_tur` enum'ından map)
- Rate limit 3sn bekleme protokolü **gevşetilir** (zorunluluk değil, fallback)

`config/model-routing.json` → `yargi_mcp` + `mevzuat_mcp` task'ları **ayrı kalır** (Senaryo A'da birleşecekti, B'de değil).

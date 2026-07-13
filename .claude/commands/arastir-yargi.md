<!-- DOKTRIN-PREAMBLE v1 -->
> **0-HALÜSİNASYON + ANTI-SYCOPHANCY (zorunlu — tam metin: `prompts/_doktrin-preamble.md`):**
> - UYDURMA YARGITAY/HGK/İBK kararı atfı YASAK — her künye Bedesten documentId ile doğrulanır; doğrulanmayan "DOĞRULANMAMIŞ" damgalanır.
> - Karar metni ALINTISI UYDURULAMAZ — tırnak içi alıntı birebir kaynaktan.
> - BAĞLAM KORUNMALI — bir fıkranın cevabı başka fıkraya genellenemez.
> - Avukatı memnun etmek için LEHE YORUM YASAK; ALEYHE İÇTİHAT açıkça gösterilir, gizlenmez.
> - "KAYNAK YOK" demek dürüstlüktür — sayı doldurmak için uydurma atıf HARD FAIL.
> - Kritik kuralda ÇİFT KAYNAK şart.
> - Çıktının sonunda KAYNAK DOĞRULAMA tablosu (| İddia | Kaynak | documentId | Tam Alıntı | Doğrulama |) + "Aleyhe içtihat: VAR/YOK/ARANMADI" beyanı ZORUNLU.

# /arastir-yargi — Yargı-MCP-Pro Derin İteratif Protokolü (FIVEAGENTS ASAMA 2B)

`$ARGUMENTS` kritik noktasını **FIVEAGENTS.md ASAMA 2B** protokolüne uyarak araştır.
Mevcut kısa prompt YASAK — bu komut tam protokolü zorunlu uygular.

**FAZ 2 (2026-05-19):** Yargı-MCP-Pro (`mcp__yargi-mcp-pro__*`) aktif. Eski
`mcp__claude_ai_Yarg_MCP__*` tool'ları emekli.

## Zorunlu Referans Dokümanlar
- `.claude/skills/yargi-legal-research-guide/SKILL.md` — **sorgu lehçeleri + tuzaklar (BİRİNCİL referans, sürüm 2026-07-08b)**
- `FIVEAGENTS.md` → ASAMA 2B
- `ajanlar/arastirmaci/SKILL.md` → Bölüm 1 (Yargı-MCP-Pro Derin Protokolü, 6 Faz) + Bölüm 2.5 (2B → 2C Sıralı Zincir)

## Kanonik Çalıştırıcı

2B araştırmasını doğrudan tek model oturumunda yürütme. Model sırası ve
limitler `config/model-routing.json` içinden okunarak şu komutla çalıştırılır:

```bash
python3 scripts/yargi_model_pipeline.py --mod derin --cikti "02-Arastirma" "$ARGUMENTS"
```

Sıra: Sol ana araştırma → Terra bağımsız denetim → Luna nihai 2B raporu →
Claude kısa kalite kapısı. Claude nihai sentez yapmaz. Komut çıkış kodu `0`
olmadan 2C başlatılmaz.

## Aktif Tool'lar (Yargı-MCP-Pro — FAZ 6 2026-07-09 yeni Türkçe set)
- `mcp__yargi-mcp-pro__ictihat_ara` — mahkeme kararı arama (Yargıtay/Danıştay/Yerel/İstinaf/KYB)
- `mcp__yargi-mcp-pro__ictihat_getir` — documentId → tam metin (40K üzeri `page_number`)
- `mcp__yargi-mcp-pro__semantik_ictihat_ara` — kavramsal keşif (Faz 1 terim üretiminde; korpus ~1 yıl eski, güncel atıf YAPILMAZ)
- `mcp__yargi-mcp-pro__aym_ictihat_ara` — AYM kararları (Faz 6.5 koşullu kol; DÜZ kelime, operatör YOK)

## Ön-koşullar (otomatik)
1. `tmp/current-run-id.txt` oluştur (yoksa): `{YYYYMMDD}-{HHMMSS}-{dava-id}`
2. `02-Arastirma/.faz2-progress.jsonl` aç (append mode)
3. Health check: Pro MCP'de `check_government_servers_health` tool'u **yok** — bu adım kaldırıldı. Bağlantı `claude mcp list` ile doğrulanır

## Zorunlu Adımlar (FIVEAGENTS 6 Faz + Gap Check)

### Faz 1 — Terim Üretimi (ön-düşünme)
- 5-7 alternatif arama terimi üret (kritik nokta etrafında)
- Hangi daire(ler) (`birimAdi` enum: H1-H23 hukuk daireleri, C1-C23 ceza, HGK, CGK, D1-D17 Danıştay, IBK)
- Terim listesini progress ledger'a yaz: `phase: 2B, step: term_generation`

### Faz 2 — Geniş Tarama (Query 1-4)
- `ictihat_ara(phrase="<ana terim>")` — varsayılan
  - **Bedesten Solr dialect — ⚠️ EN KRİTİK TUZAK: çıplak terimler arası
    BOŞLUK = OR (AND değil!).** İki kavramı birlikte zorunlu kılmak için
    HER birini `+` ile işaretle: `+kamulaştırma +"bedel tespiti"`.
    Diğer operatörler: `-dışla`, `"exact phrase"`, büyük harf `AND`/`OR`/`NOT`,
    `()` grouping. **Wildcard/fuzzy/yakınlık YOK.**
  - En az bir kriter zorunlu (phrase / esas_no / birimAdi / tarih) — yalnız court_types yetmez
  - Triyajda `include_snippets: true` (kotasız, 5 cache-siz üst isabet)
- `ictihat_ara(phrase="<ana>", birimAdi="HGK")` — Hukuk Genel Kurulu
- `ictihat_ara(phrase="<ana>", birimAdi="IBK")` — İçtihatları Birleştirme
- Alternatif terim
- **Min delay:** Pro MCP'de gözlemli rate limit yok — sorgular arası bekleme **ZORUNLU değil**, 429 alınırsa exponential backoff

### Faz 3 — Daraltılmış Arama (Query 5-8)
- Tarih filtresi: `kararTarihiStart="2024-01-01"`, `kararTarihiEnd="2026-12-31"` (ISO 8601)
- Daire filtresi (`birimAdi`)
- Spesifik kavram (exact phrase)

### Faz 4 — Temporal Evolution (Query 9-14, ZORUNLU)
- **DİNAMİK yıl listesi:** içinde bulunulan yıl dahil son 5 takvim yılı,
  yıl-yıl ayrı sorgu (`kararTarihiStart/End` ile — sabit yıl YAZILMAZ)
- HGK yıl-aralığı sorguları
- `sort_direction="asc"` ile en eski → en yeni evrim takibi
- Hakim görüş kırılımı + kırılma noktası tespiti

### Faz 5 — Çelişki + Bozma + Karşı Argüman (Query 15-17, min 2)
- Karşı sonuç döndüren terim kombinasyonları
- Bozma kararı + İBK arama

### Faz 6 — Tam Metin Okuma (min 5 karar)
- `ictihat_getir(documentId="<id>")` ile en alakalı 5 kararı tam çek
- Her karardan **atıf yaptığı mevzuat maddelerini çıkar** (2C girdisi)
- Mevzuat atıfları → `02-Arastirma/atif-maddeleri.json`

### Gap Check (zorunlu son kontrol)
- HGK var mı? Son 12 ay karar var mı? Çelişki var mı? Temporal seyir tam mı?
- Eksikse → Faz'a geri dön

## Rate Limit Yönetimi (Pro MCP — Gevşetilmiş)
- **FAZ 2 değişiklik (2026-05-19):** Eski 3sn min bekleme protokolü **kaldırıldı**. Pro MCP test pilotunda 429 gözlenmedi.
- **Fallback:** 429 gelirse exponential backoff (5→15→30→60 sn), max 4 retry
- **on_429:** Avukata canlı bildirim, manuel karar
- **ASLA otomatik skip yok**

## Progress Ledger Yazımı
Her sorgu sonu `.faz2-progress.jsonl`'e satır:
```json
{"ts":"...","run_id":"...","phase":"2B","step":"yargi_search","query_no":N,"query_label":"<faz>_<terim>","tool":"mcp__yargi-mcp-pro__ictihat_ara","status":"ok","duration_ms":X,"result_count":Y,"selected_count":Z,"rate_limit_wait_ms":0}
```
60 sn sessizlikte: `STILL_WORKING: <ne yapıyorum>` satırı.

## Çıktı Dosyaları (Zorunlu)
- `02-Arastirma/yargi-bulgulari.md` — kararların tam listesi + temporal seyir
- `02-Arastirma/atif-maddeleri.json` — 2C girdisi (her karar için citations array)

## Nihai 2B Raporu ve Kalite Kapısı

- Luna (3. aşama) `02-Arastirma/yargi-bulgulari.md` ile
  `02-Arastirma/atif-maddeleri.json` dosyalarını üretir.
- Claude (4. aşama) raporu yeniden yazmaz; en fazla 2 hedefli YargıMCP çağrısı
  ve 600 kelimeyle `yargi-04-claude-kalite.md` kalite kararını verir.
- `yargi-model-pipeline.json` sıralı aşamaları ve `claude_gate` sonucunu tutar.
- 2C yalnız manifest `completed` ve kalite kararı `GECTI` ise başlar.

Kanonik rapor frontmatter'ı: `engine: codex`, model = routing'deki 3. aşama,
`mcp: yargi-mcp-pro`, `pipeline_stage: 3`, `status: TASLAK`.

## Kalite Kapısı (çıktı tamamlanmadan önce)
- [ ] 15 sorgu listesi var mı?
- [ ] 5 tam metin künyesi var mı (her biri Pro MCP `documentId` ile fetch edildi)?
- [ ] Temporal evolution (son 5 takvim yılı, dinamik) tablosu var mı?
- [ ] HGK/İBK kararı var mı (yoksa ek arama)?
- [ ] `atif-maddeleri.json` doldu mu?
- [ ] Çelişkili kararlar bölümü var mı?
- [ ] Engine frontmatter `engine: codex`, `pipeline_stage: 3`, `mcp: yargi-mcp-pro` mi?
- [ ] Claude kalite kapısı `GECTI` mi (nihai sentez yapmadan)?
- [ ] mcp_fallback_used flag'i (varsa) belirtildi mi?

Eksik varsa: ASAMA 2B yarım, sadece eksik mini-kolu tekrar çalıştır (tüm Faz 2'yi başlatma).

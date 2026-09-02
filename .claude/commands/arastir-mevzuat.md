<!-- DOKTRIN-PREAMBLE v1 -->
> **0-HALÜSİNASYON + ANTI-SYCOPHANCY (zorunlu — tam metin: `prompts/_doktrin-preamble.md`):**
> - UYDURMA YARGITAY/HGK/İBK kararı atfı YASAK — her künye Bedesten documentId ile doğrulanır; doğrulanmayan "DOĞRULANMAMIŞ" damgalanır.
> - Karar metni ALINTISI UYDURULAMAZ — tırnak içi alıntı birebir kaynaktan.
> - BAĞLAM KORUNMALI — bir fıkranın cevabı başka fıkraya genellenemez.
> - Avukatı memnun etmek için LEHE YORUM YASAK; ALEYHE İÇTİHAT açıkça gösterilir, gizlenmez.
> - "KAYNAK YOK" demek dürüstlüktür — sayı doldurmak için uydurma atıf HARD FAIL.
> - Kritik kuralda ÇİFT KAYNAK şart.
> - Çıktının sonunda KAYNAK DOĞRULAMA tablosu (| İddia | Kaynak | documentId | Tam Alıntı | Doğrulama |) + "Aleyhe içtihat: VAR/YOK/ARANMADI" beyanı ZORUNLU.

# /arastir-mevzuat — Yargı-MCP-Pro Mevzuat Derin Protokolü (5-ajan protokolü ASAMA 2C)

`$ARGUMENTS` kritik noktasının mevzuat dayanaklarını **ajanlar/perspektif/PROTOKOL.md ASAMA 2C**
protokolüne uyarak çıkar. Mevcut kısa prompt YASAK — bu komut tam protokolü
zorunlu uygular.

**FAZ 2 (2026-05-19):** Eski 9 spesifik mevzuat tool'u (`search_kanun`,
`search_khk`, `search_tuzuk`, ...) **tek `mevzuat_ara` + `mevzuat_tur_list[]`**
altında birleşti. 3 ayrı fetch tool (`get_mevzuat_content` / `_madde_tree` /
`_gerekce`) **tek `mevzuat_getir` + `id_type` enum**'a indirgendi.

## Zorunlu Referans Dokümanlar
- `.claude/skills/yargi-legal-research-guide/SKILL.md` — **sorgu lehçeleri + tuzaklar (BİRİNCİL referans, sürüm 2026-07-08b)**
- `ajanlar/perspektif/PROTOKOL.md` → ASAMA 2C + Normlar Hiyerarşisi
- `ajanlar/arastirmaci/SKILL.md` → Bölüm 2 (Mevzuat MCP Derin Protokolü, 9 Faz + Mülga) + Bölüm 2.5 (Mülga Eleme)

## Aktif Tool'lar (Yargı-MCP-Pro)
- `mcp__yargi-mcp-pro__mevzuat_ara` — 12 mevzuat tipi global arama
- `mcp__yargi-mcp-pro__mevzuat_icinde_ara` — tek kanun içi local boolean (AND/OR/NOT UPPERCASE)
- `mcp__yargi-mcp-pro__mevzuat_getir` — polimorfik fetch (`id_type=mevzuat/madde/gerekce/outline`)

## Mevzuat Tip Enum (`mevzuat_tur_list[]`)
- `KANUN` — Kanunlar
- `KHK` — Kanun Hükmünde Kararnameler
- `TUZUK` — Tüzükler
- `YONETMELIK` — Bakanlar Kurulu Yönetmelikleri
- `CB_KARARNAME` — Cumhurbaşkanlığı Kararnameleri
- `CB_YONETMELIK` — Cumhurbaşkanlığı Yönetmelikleri
- `CB_KARAR` — Cumhurbaşkanı Kararları (PDF, OCR'lı)
- `CB_GENELGE` — Cumhurbaşkanlığı Genelgeleri (PDF, OCR'lı)
- `KKY` — Kurum/Kuruluş Yönetmelikleri
- `UY` — Üniversite Yönetmelikleri
- `TEBLIGLER` — Tebliğler
- `MULGA` — Mülga Mevzuat

## Girdi (Zorunlu)
2B'nin verdiği `02-Arastirma/atif-maddeleri.json` — 2C bu olmadan başlayamaz.

## Zorunlu Adımlar (Min 8 Sorgu / 9 Faz + Mülga Denetim)

### Faz 1 — Ana Kanun Maddesi (Query 1-3)
- `mevzuat_ara(phrase="<kanun adı veya konu>", page_size=20)` — **page_size her zaman ≤ 20 (upstream cap)**
  - **Mevzuat Solr dialect:** `+`, `-`, `"exact"`, `wildcard*`, `fuzzy~`, `"a b"~5` (proximity), `^N` (boost). **AND/OR/NOT LİTERAL parser'ı BOZAR** — sadece bitişik kelimeler default AND.
- Kanun no biliniyorsa direkt: `mevzuat_ara(mevzuat_no="6098", mevzuat_tur_list=["KANUN"])` — TBK örneği
- `mevzuat_getir(id="<mevzuat_id>", id_type="outline")` — kanun başına 1 kez (cache'lenir)
- `mevzuat_getir(id="<madde_id>", id_type="madde")` — outline'dan gelen madde_id

### Faz 2 — Madde Değişiklik Geçmişi (Query 4-5)
- `mevzuat_getir(id="<gerekce_id>", id_type="gerekce")` — yasama gerekçesi (her mevzuat'ta yok)
- Olay tarihine göre doğru versiyon tespiti (`resmi_gazete_tarihi_start/end` filtreleri)

### Faz 3 — İlgili Madde Zinciri (Query 6-9)
- Önceki/sonraki madde + atıf maddeleri
- Tek kanun içi derinleşme: `mevzuat_icinde_ara(mevzuat_id=..., query="<boolean>", sort_by="document_order")`
  - **Boolean dialect:** AND/OR/NOT UPPERCASE çalışır (Solr DEĞİL — local evaluator)

### Faz 4 — Alt Mevzuat (Query 10-12)
- `mevzuat_ara(phrase=..., mevzuat_tur_list=["YONETMELIK", "TEBLIGLER"], page_size=20)`
- CB Kararnamesi varsa: `mevzuat_tur_list=["CB_KARARNAME"]`

### Faz 5 — Hiyerarşik Etiketleme (Normlar Hiyerarşisi, ZORUNLU)
- Pro MCP **otomatik hiyerarşi etiketi VERMEZ** — `mevzuat_tur` enum'undan map yapılır
- Seviye sırası (prompt seviyesinde uygulanır):
  1. Anayasa
  2. Antlaşma (m.90/5)
  3. Kanun (`KANUN`)
  4. OHAL CBK
  5. İBK (içtihatları birleştirme — Yargıtay 2B'den)
  6. CBK (`CB_KARARNAME`, `CB_YONETMELIK`, `CB_KARAR`, `CB_GENELGE`)
  7. Tüzük (`TUZUK`)
  8. Yönetmelik (`YONETMELIK`, `KKY`, `UY`)
  9. Tebliğ (`TEBLIGLER`)
- Her bulunan hüküm için seviye etiketi raporda

### Faz 6 — Norm Denetimi
- Sınır aşımı + CBK münhasır kanun alanı kontrolü

### Faz 7 — Çatışma Analizi
- Lex Superior / Specialis / Posterior

### Faz 8 — Zımni İlga Taraması

### Faz 9 — LLM Web Fallback (MCP ulaşamayan hüküm için)
- Çok yeni mevzuat / özel kurum yönetmelikleri / milletlerarası antlaşmalar / AYM norm denetimi
- WebSearch + kaynak URL + tarih ZORUNLU

## Mülga Eleme Protokolü (Kalite Kapısı)

**FAZ 2 not (2026-05-19):** Pro MCP `mevzuat_tur_list=["MULGA"]` ile mülga
*dokümanları* filtreliyor, ama her madde için otomatik `mulga: true/false` flag
şemada yok — protokol prompt seviyesinde uygulanır.

2B'den gelen her karar için atıf maddesi denetimi:
1. **Yürürlük:** madde bugün yürürlükte mi? (`mevzuat_getir` + Resmî Gazete tarihi kontrolü)
2. **Mülga tarihi:** yürürlükten kaldırıldı mı? (`mevzuat_ara(phrase=..., mevzuat_tur_list=["MULGA"])` ile karşı kontrol)
3. **Olay tarihi versiyonu:** o tarihte hangi versiyon?
4. **Zımni ilga:** yeni kanun eskiyi ilga etmiş mi? (`resmi_gazete_tarihi_start/end` filtreli arama)

Eleme kararı:
- GEÇERLİ → rapora alınır
- TARİH UYUMSUZ → "olay tarihi versiyonu Y" notuyla alınır
- MULGA ATIF → `[DEĞER YOK — mülga atıf]` ELENİR
- ZIMNİ İLGA → `[ESKİ NORM]` ELENİR

**Eleme sonrası geçerli karar < 5 ise:** 2B'ye geri dön, 3 alternatif terimle ek arama.

## Kanun Cache (Faz B'de devreye girer)
Aynı kanun ikinci sorguda cache'ten okunur:
```json
{"6098": {"mevzuat_id": "<pro_id>", "outline_fetched": true, "articles": {"344": "fetched"}}}
```

## Çıktı Dosyaları (Zorunlu)
- `02-Arastirma/mevzuat-bulgulari.md` — kanunlar + maddeler + hiyerarşi
- `02-Arastirma/mulga-eleme.json` — eleme tablosu (geçerli/elenen)

## Sentez Aşaması — Terminal Claude
2C Mevzuat bulgularının raporu **terminal Claude** tarafından yazılır;
MCP çıktıları zaten Claude oturumunda.

Çıktı: `02-Arastirma/mevzuat-bulgulari.md` + `02-Arastirma/mulga-eleme.json`.
Frontmatter: `engine: claude`, `mcp: yargi-mcp-pro`, `status: TASLAK`.

## Kalite Kapısı
- [ ] `atif-maddeleri.json` (2B çıkışı) okundu mu?
- [ ] Min 8 sorgu yapıldı mı?
- [ ] `page_size: 20` her search'te explicit verildi mi (upstream hard cap)?
- [ ] Madde ağacı (outline) kanun başına 1 kez çekildi mi (cache)?
- [ ] `mulga-eleme.json` doldu mu?
- [ ] Geçerli karar ≥ 5 mi (yoksa 2B'ye geri dön)?
- [ ] Normlar Hiyerarşisi etiketleri var mı (mevzuat_tur → seviye mapping)?
- [ ] Çatışma analizi (Lex Superior/Specialis/Posterior) yapıldı mı?
- [ ] Engine frontmatter `engine: claude`, `mcp: yargi-mcp-pro` mi?

# ARASTIRMA.md — Hızlı Araştırma Modülü (Danışma Hattı)

> **Amaç:** Avukat Aykut'a müvekkil adaylarının sorduğu hukuki soruları **hızlıca**
> ve **0-halüsinasyon** garantisi ile cevaplamak. Dava açma odaklı değil,
> danışmanlık odaklıdır.
>
> **Mevcut dava akışına (CLAUDE.md ASAMA 0-7, `arastir:` komutu) DOKUNMAZ.**
> Bağımsız ikinci bir hat olarak çalışır.
>
> **REVİZYON 2026-07-09 (avukat kararı):** Süper Stajyer (Faz 1) ve
> Argüman.ai (Faz 2) bu modülden ÇIKARILDI (arşiv: `arsiv/README.md`).
> Modül artık doğrudan **Yargı-MCP-Pro + Mevzuat** üzerinde çalışır —
> künyeler kaynağından (Bedesten) geldiği için ayrı doğrulama köprüsü
> fazına gerek kalmadı; tam-metin teyidi korunur. KVKK maskeleme zaten
> bu modülde yoktu (jenerik soru), değişmedi.

---

## 1. Felsefe ve Sınırlar

### Yapar (Scope İçi)
- Hukuki bir soruya Yargıtay içtihadı + güncel mevzuat üzerinden cevap üretir
- Müvekkil adayı görüşmesine hazırlık raporu hazırlar
- Stratejik yön gösterir (lehe-aleyhe argümanlar, riskler, başarı şansı)
- Cevabı Drive `Research/{tarih}-{slug}/` altına yazar

### Yapmaz (Scope Dışı)
- **Dava açmaz** — UYAP yüklemesi YOK
- **Dilekçe/ihtarname/sözleşme üretmez** — bunlar mevcut komutlarla (`dilekce yaz`, `ihtarname yaz`, `sozlesme yaz`) dava modunda yapılır
- **Müvekkil kimlik verisi istemez** — soru jenerik hukuki formüle çevrilerek çalışılır
- **Dava klasörü açmaz** — `Aktif Davalar/`'a dokunmaz
- **MemPalace dava drawer'ı yazmaz** — sadece `wing_arastirma` ve proje memory'sine yazar

---

## 2. Tetikleyici Komut

```
arastir danisma: {hukuki soru}
```

**Örnekler:**
- `arastir danisma: ev sahibi 3 ay kira ödememe nedeniyle tahliye davası açtı, kiracı işsiz, hangi savunma argümanları var`
- `arastir danisma: trafik kazasında %50 kusurlu yaya öldü, sürücüye tazminat davası açılabilir mi`
- `arastir danisma: 6 ay aralıksız çalışmış işçi haklı fesih ile kıdem tazminatı alabilir mi`

Slash komut karşılığı: `.claude/commands/arastir-danisma.md`. Avukat bu komutu yazdığında Director (Codex/Sol — bkz. AGENTS.md) `ARASTIRMA.md`'yi okuyup aşağıdaki 5 faz workflow'unu uygular.

---

## 3. 0-Halüsinasyon Doktrini (Modüle Özgü Özet)

Tam doktrin: `@ajanlar/0-halusinasyon-doktrini.md`. Bu modül için kritik kurallar:

### 6 Mutlak Yasak
1. **Tam metni açılmamış karara ATIF YAPILMAZ.** Search listesinde görünmek yetmez — her künye `ictihat_getir` ile açılıp konu uyumu teyit edilmeden cevaba giremez. (Mehmet Ali davası dersi, 2026-05-20: aracı kaynaklar 2/2 yanlış künye sunmuştu; bu kural aracı olmasa da geçerli — search snippet'i de yanıltabilir.)
2. **Tırnaklı alıntı (`«...»`) sadece Bedesten'den çekilmiş tam metinden** — parafraz da uydurma sayılır eğer kaynak yoksa.
3. **Karar bağlamına sadık kalınır** — sorulan soru hangi konuysa cevap o konuyu kapsar, genelleştirilmez (89/4 cevabı 89/3'e taşınamaz).
4. **"Bilmiyorum" demek dürüstlüktür** — kaynaklar yetersizse "bu konuda Bedesten'de DOĞRULANMIŞ yeterli emsal bulunamadı" yazılır.
5. **Müvekkil/avukat lehine yorumlama YASAK** — kaynak ne diyorsa o yazılır, aleyhe içtihat varsa açıkça gösterilir.
6. **Kaynaksız genel ifade YASAK** — "Yargıtay yerleşmiştir", "Doktrin baskındır" gibi iddialar mutlaka künye + tam alıntı + Bedesten documentId ile destekli olmalı.

### HARD FAIL Eşiği
- **0 DOĞRULANMAMIŞ atıf** → `arastirma-cevabi.md` Drive'a yazılır
- **1 DOĞRULANMAMIŞ atıf** → yazılır ama damgalı + avukata uyarı
- **≥2 DOĞRULANMAMIŞ atıf** → cevap YAZILMAZ, avukata "yetersiz kaynak" mesajı

### Çıktı Öncesi Checklist
- [ ] Her Yargıtay künyesi Bedesten Pro MCP documentId + tam metin ile doğrulandı mı?
- [ ] Her tırnaklı alıntı kaynaktan birebir mi?
- [ ] Atıf yapılan kanun maddeleri mülga denetiminden geçti mi?
- [ ] Aleyhe içtihat/doktrin varsa açıkça yazıldı mı?
- [ ] "Bu konuda kaynak yok" diyebileceğim yer varsa onu yazdım mı?
- [ ] Kaynak Doğrulama Tablosu sonda var mı?
- [ ] Lehe yorum dürtüsü reddedildi mi?

---

## 4. Workflow (5 Faz)

### Faz 0: Soru Kabul + Klasör Kurulumu

1. Sorudan ASCII-safe slug üret. Örnek:
   - "ev sahibi 3 ay kira ödememe tahliye" → `ev-sahibi-3-ay-kira-tahliye`
   - "trafik kazası %50 kusurlu yaya ölüm" → `trafik-50-kusur-yaya-olum`
2. Tarih önekiyle klasör adı: `{YYYY-MM-DD}-{slug}`
3. Research klasörünü oluştur — yol **platforma göre çözümlenir**:
   ```bash
   python3 scripts/paths.py research   # → .../Hukuk Bürosu/Research
   ```
   Klasör: `{research_root}/{YYYY-MM-DD}-{slug}/`
4. `00-Soru.md` dosyasını yaz. İçerik:
   ```markdown
   ---
   tarih: {YYYY-MM-DD}
   arastirma_id: {YYYY-MM-DD}-{slug}
   status: ARASTIRMA BASLIYOR
   ---

   # Soru
   {avukatın sorduğu ham soru}

   ## Doktrinal Çeviri (Faz 1 için)
   {Director'ın sorudan çıkardığı doktrinal Türkçe terimler:
    örn. "kira ödememe → tahliye davası → TBK m.315 ihtar şartı"}
   ```

### Faz 1: Yargı-MCP-Pro İçtihat Taraması (hafif protokol)

Dava akışının 2B'sinin mini versiyonu — **min 6 sorgu / 3 alt-adım**
(15-sorguluk tam protokol dava akışında; danışma hattı hız önceliklidir):

Kanonik çalıştırma:

```bash
python3 scripts/yargi_model_pipeline.py --mod hafif --cikti "{research_klasoru}" "{hukuki_soru}"
```

Model sırası `config/model-routing.json` içinden okunur: Sol ana tarama, Terra
bağımsız denetim, Sol (stage 3) `01-Ictihat-taramasi.md` + `atif-maddeleri.json`
nihai sentezini yazar, Terra yalnız kısa kalite kapısı üretir (2026-07-18
revizyonu: Luna ve Claude pipeline'dan çıkarıldı). Komut `0`
dönmeden Faz 2'ye geçilmez.

1. **Terim üretimi:** Doktrinal çeviriden 3-4 alternatif arama terimi +
   ilgili daire(ler) belirle.
2. **Tarama (min 6 sorgu):**
   ```python
   mcp__yargi-mcp-pro__ictihat_ara(
     phrase="{doktrinal terim}",
     court_types=["YARGITAYKARARI"],
     birimAdi="{ilgili daire — biliniyorsa}"
   )
   ```
   - Ana terim + en az 2 alternatif terim
   - En az 1 HGK sorgusu (`birimAdi="HGK"`)
   - En az 1 güncellik sorgusu (son 2 yıl tarih filtresi)
   - En az 1 karşı-argüman/bozma sorgusu
3. **Tam metin teyidi (ZORUNLU — atıf ön şartı):** Cevaba girecek her
   karar (min 3, hedef 5):
   ```python
   mcp__yargi-mcp-pro__ictihat_getir(documentId)
   ```
   - Tam metin **sorulan konuyla ilgili** → **DOĞRULANMIŞ** (cevaba girer)
   - Tam metin **alakasız** → **ELENDİ** (şeffaflık tablosuna yazılır)
   - Search'te görünüp tam metni açılamayan → **DOĞRULANMAMIŞ** (cevaba girmez)
4. **`01-Ictihat-taramasi.md` yaz:**
   ```markdown
   ---
   engine: codex
   pipeline_stage: 3
   mcp: yargi-mcp-pro
   total_sorgu: N
   dogrulanmis: V
   elenen: E
   ---

   # İçtihat Taraması

   ## Kullanılan Sorgular
   | # | Sorgu | Filtre | Sonuç sayısı |
   |---|---|---|---|

   ## DOĞRULANMIŞ Kararlar (tam metin açıldı, konu uyumlu)
   | Künye | documentId | Tam metin özeti + soruya ne dediği |
   |---|---|---|

   ## Elenen / Doğrulanamayan Kararlar
   | Künye | Sebep |
   |---|---|
   ```

**Kalite eşiği:** DOĞRULANMIŞ sayısı ≥ 2 olmalı. Aksi halde Faz 3'e
geçilmez → avukata "yetersiz kaynak" mesajı + bulunan ham veriler.

### Faz 2: Mevzuat + Mülga Denetimi

Faz 1 kararlarının atıf yaptığı + sorunun işaret ettiği kanun maddeleri için yürürlük kontrolü.

1. **Madde listesi çıkar:** "TBK m.315", "KTK m.97", "HMK m.107" vb.
2. **Her madde için:**
   ```python
   mcp__yargi-mcp-pro__mevzuat_ara(
     phrase='"{kanun adı}"',
     mevzuat_tur_list=["KANUN"]
   )
   mcp__yargi-mcp-pro__mevzuat_getir(
     id="{madde_id}",
     id_type="madde"
   )
   ```
   (Parametre adları OAuth sonrası gerçek şemayla teyit edilir; şüphede
   tool şeması esas alınır.)
3. **Sonuç değerlendirme:**
   - Madde **yürürlükte ve metni soruya uygun** → **GÜNCEL**
   - Madde **mülga** veya **değişmiş** → **MÜLGA/DEĞİŞMİŞ** (raporda uyarı; argüman zayıflar)
   - Madde **bulunamadı** → **DOĞRULANAMADI** (avukata manuel kontrol notu)
4. **`02-Mulga-denetim.md` yaz:**
   ```markdown
   ---
   engine: codex
   mcp: yargi-mcp-pro (mevzuat)
   total_madde_count: N
   ---

   # Mülga Denetim Sonuçları

   ## GÜNCEL Mevzuat Maddeleri
   | Kanun + Madde | Yürürlük | Tam metin özeti |
   |---|---|---|

   ## MÜLGA / DEĞİŞMİŞ Maddeler
   | Kanun + Madde | Mülga tarihi | Yerine geçen | Cevaba etkisi |
   |---|---|---|---|

   ## DOĞRULANAMAYAN Maddeler
   | Kanun + Madde | Aksiyon |
   |---|---|
   ```

### Faz 2.5 (OPSİYONEL): NotebookLM

Avukatın sorunun alanına uyan notebook'u varsa (iş hukuku, aile hukuku)
2-4 hedefli sorgu atılabilir. Her sorguda "SADECE KAYNAKLARA GÖRE CEVAP
VER, UYDURMA YAPMA" ibaresi zorunlu. Notebook yoksa faz sessizce atlanır.

### Faz 3: Sentez Cevap (Avukatın Okuyacağı Nihai Rapor)

Faz 1-2 çıktılarının nihai sentezi Sol'dadır (pipeline stage 3 çıktısı temel
alınır); Terra bağımsız künye teyidi yapar, deterministik kapı `cikti_dogrula.py`
yapısal kontrolü tamamlar. Antigravity/Gemini gerekmez (hafiflik prensibi).

**`arastirma-cevabi.md` yapısı:**
```markdown
---
engine: codex
model: {config/model-routing.json -> tasks.arastirma_sentezi.model}
task_type: arastirma_cevabi
arastirma_id: {YYYY-MM-DD}-{slug}
timestamp_utc: {ISO}
status: TASLAK
self_review: YEŞİL / SARI
---

# Hukuki Araştırma Cevabı — {Konu}

**TASLAK — Avukat onayına tabidir**

**AVUKATIN KARAR NOKTALARI:** (en fazla 5 — fiilen karar gerektirenler;
yoksa "KARAR NOKTASI YOK — rutin uygulama")
1. {seçim/onay gerektiren husus + öneri}
2. {kabul edilecek risk + büyüklüğü}
3. {eksik bilgi + nereden temin edileceği}

## 0. Sorulan Soru
> {00-Soru.md ham metni}

## 1. Doğrudan Cevap (Net, 2-3 cümle)
{Soruya en net cevap. Lehe-aleyhe karışık dağılım yok.}

## 2. Hukuki Dayanak
### 2.1. Mevzuat (Faz 2 GÜNCEL maddeleri)
- {Kanun adı m.X}: «verbatim alıntı» — kaynak: Mevzuat MCP

### 2.2. Yargıtay İçtihadı (Faz 1 DOĞRULANMIŞ kararları)
- {Daire} E. {esas} - K. {karar} ({tarih}):
  «verbatim alıntı tam metinden»
  - Bedesten documentId: {id}
  - Bağlam: {bu kararın sorduğum soruya ne dediği}

## 3. Lehe Argümanlar (her biri güven etiketli — [YERLEŞİK]/[GELİŞEN]/[AÇIK SORU])
1. {Argüman + dayanak} [ETİKET]
2. ...

## 4. Aleyhe Argümanlar / Risk Noktaları (etiketli)
1. {Aleyhe içtihat veya doktrin — açıkça yazılır, gizlenmez} [ETİKET]
2. ...

## 5. Başarı Şansı Değerlendirmesi
{Düşük / Orta / Yüksek + 2-3 cümle gerekçe. Spekülatif yorum YOK.}

## 6. Pratik Aksiyon Önerisi
- {Avukatın atması gereken adımlar — belge toplama, ihtar gönderme, ek araştırma vs}

## 7. Risk Flag'leri
- {Aleyhe içtihat: ...}
- {Doğrulanmamış varsayım: ...}
- {Kaynak eksiği: ...}

---

## Kaynak Doğrulama Tablosu

| İddia | Kaynak | Tam Alıntı | Pro MCP documentId | Durum |
|---|---|---|---|---|
| {...} | {künye} | «...» | {id} | ✓ DOĞRULANMIŞ |

## Elenen Künyeler (şeffaflık)
{Faz 1 ELENDİ listesi — tam metni konu dışı çıkanlar}
```

**DOCX üretimi:**
```bash
python3 scripts/md_to_docx.py "{research_root}/{klasör}/"
```

### Faz 4: Memory Yazımı

İki katman:

**A. MemPalace `wing_arastirma`** (yoksa oluştur):
```python
# Her araştırma sonu
mempalace_add_drawer(
  wing="wing_arastirma",
  hall="hall_danisma_sorulari",
  title="{tarih}: {konu özet}",
  body="Soru: {özet}\nBulunan kararlar: N adet\nCevap: {1 cümle}\nDrive: {klasör}"
)

# Halüsinasyon/elenen künye çıktıysa
mempalace_add_drawer(
  wing="wing_arastirma",
  hall="hall_halusinasyon_kunyeleri",
  title="ELENEN KÜNYE: {künye}",
  body="Görünen yer: {search snippet}\nGerçek konu: {Bedesten tam metin özeti}\nSebep: {konu dışı / bulunamadı}"
)
```

**B. Proje memory** (`~/.claude/projects/{proje}/memory/`):
- Yeni öğrenim yakalandıysa (örn. "X kanun maddesi Y davası için kritik") → yeni memory dosyası
- Her araştırma sonu MEMORY.md'ye 1 satır eklenmez — sadece **kalıcı öğrenim** varsa.

---

## 5. Hata Yönetimi

| Senaryo | Aksiyon |
|---|---|
| Yargı Pro MCP bağlı değil / OAuth süresi dolmuş | Avukata yetkilendirme linki göster — **Faz 1 Pro MCP'siz ÇALIŞMAZ** (HARD gereksinim) |
| Yargı Pro MCP down (bağlıyken hata) | 1 retry (5 sn), sonra `yargi` CLI fallback; o da fail → cevap yazılmaz, avukata "Pro MCP gerekiyor" |
| Mevzuat sorguları down | Faz 2 atlanır, `MULGA DENETIMI YAPILMADI` flag'i, cevap yazılır ama uyarılı |
| Faz 1'de DOĞRULANMIŞ < 2 | Cevap yazılmaz → avukata "yetersiz kaynak" + bulunan ham veriler paylaşılır |
| ≥2 DOĞRULANMAMIŞ atıf cevaba sızmış | HARD FAIL — Faz 3'e geçilmez |
| NotebookLM erişilemiyor | Faz 2.5 sessizce atlanır (opsiyonel faz) |
| Sentez sırasında çelişkili kararlar | Çelişki açıkça raporda yazılır, hangi tarafın ağır basacağı tahmin edilmez (avukat karar verir) |

---

## 6. Output Özeti

**Drive klasörü:** `{research_root}/{YYYY-MM-DD}-{slug}/`
(`research_root` = `python3 scripts/paths.py research` çıktısı)

| Dosya | İçerik | Üretici |
|---|---|---|
| `00-Soru.md` | Ham soru + doktrinal çeviri | Director/Sol (Faz 0) |
| `01-Ictihat-taramasi.md` | Sorgular + DOĞRULANMIŞ/Elenen kararlar | Sol sentez + Yargı araçları (Faz 1); Terra kısa QA kapısı |
| `02-Mulga-denetim.md` | Mevzuat madde yürürlük denetimi | Sol + Mevzuat araçları (Faz 2) |
| `arastirma-cevabi.md` ★ | NİHAİ — avukatın okuyacağı sentez | Sol (Faz 3) + Terra teyit |
| `arastirma-cevabi.docx` | DOCX export | md_to_docx.py (Faz 3) |

**Avukat sadece `arastirma-cevabi.md/.docx`'i okur.** Diğer dosyalar iz/şeffaflık için arşivde durur.

---

## 7. Komut Sözleşmesi (Hatırlatma)

```
arastir danisma: {hukuki soru}
```

Klasör adı otomatik üretilir. Müvekkil adı sorulmaz. Tek soru yeterli.

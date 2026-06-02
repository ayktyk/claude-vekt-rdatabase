# ARASTIRMA.md — Hızlı Araştırma Modülü

> **Amaç:** Avukat Aykut'a müvekkil adaylarının sorduğu hukuki soruları **hızlıca**
> ve **0-halüsinasyon** garantisi ile cevaplamak. Dava açma odaklı değil,
> danışmanlık odaklıdır.
>
> **Mevcut dava akışına (CLAUDE.md ASAMA 0-7, `arastir:` komutu) DOKUNMAZ.**
> Bağımsız ikinci bir hat olarak çalışır.

---

## 1. Felsefe ve Sınırlar

### Yapar (Scope İçi)
- Hukuki bir soruya doktrin + Yargıtay içtihadı + güncel mevzuat üzerinden cevap üretir
- Müvekkil adayı görüşmesine hazırlık raporu hazırlar
- Stratejik yön gösterir (lehe-aleyhe argümanlar, riskler, başarı şansı)
- Cevabı Drive `Research/{tarih}-{slug}/` altına yazar

### Yapmaz (Scope Dışı)
- **Dava açmaz** — UYAP yüklemesi YOK
- **Dilekçe/ihtarname/sözleşme üretmez** — bunlar mevcut komutlarla (`dilekce yaz`, `ihtarname yaz`, `sozlesme yaz`) dava modunda yapılır
- **Müvekkil verisi toplamaz** — TC, IBAN, telefon, ad-soyad asla LLM'e gönderilmez; soru jenerik formüle çevrilir
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

Slash komut karşılığı: `.claude/commands/arastir-danisma.md`. Avukat bu komutu yazdığında Claude `ARASTIRMA.md`'yi okuyup aşağıdaki 6 faz workflow'unu uygular.

---

## 3. 0-Halüsinasyon Doktrini (Modüle Özgü Özet)

Tam doktrin: `@ajanlar/0-halusinasyon-doktrini.md`. Bu modül için kritik kurallar:

### 6 Mutlak Yasak
1. **Süper Stajyer veya Argüman.ai'nin verdiği Yargıtay künyeleri Yargı Pro MCP ile doğrulanmadan rapora ATIF YAPILMAZ.** Mehmet Ali davası dersi (2026-05-20): Argüman.ai folder PDF'leri 2/2 yanlış künye sundu.
2. **Tırnaklı alıntı (`«...»`) sadece Bedesten'den çekilmiş tam metinden** — parafrazi de uydurma sayılır eğer kaynak yoksa.
3. **NotebookLM / Süper Stajyer cevabı bağlamına sadık kalınır** — sorulan soru hangi konuysa cevap o konuyu kapsar, genelleştirilmez.
4. **"Bilmiyorum" demek dürüstlüktür** — kaynaklar yetersizse "bu konuda Bedesten'de DOĞRULANMIŞ yeterli emsal bulunamadı" yazılır.
5. **Müvekkil/avukat lehine yorumlama YASAK** — kaynak ne diyorsa o yazılır, aleyhe içtihat varsa açıkça gösterilir.
6. **Kaynaksız genel ifade YASAK** — "Yargıtay yerleşmiştir", "Doktrin baskındır" gibi iddialar mutlaka künye + tam alıntı + Bedesten documentId ile destekli olmalı.

### HARD FAIL Eşiği
- **0 DOĞRULANMAMIŞ atıf** → `arastirma-cevabi.md` Drive'a yazılır
- **1 DOĞRULANMAMIŞ atıf** → yazılır ama damgalı + avukata uyarı
- **≥2 DOĞRULANMAMIŞ atıf** → cevap YAZILMAZ, avukata "yetersiz kaynak" mesajı

### Çıktı Öncesi Checklist
- [ ] Her Yargıtay künyesi Bedesten Pro MCP documentId ile doğrulandı mı?
- [ ] Her tırnaklı alıntı kaynaktan birebir mi?
- [ ] Atıf yapılan kanun maddeleri mülga eleme tablosundan geçti mi?
- [ ] Aleyhe içtihat/doktrin varsa açıkça yazıldı mı?
- [ ] "Bu konuda kaynak yok" diyebileceğim yer varsa onu yazdım mı?
- [ ] Kaynak Doğrulama Tablosu sonda var mı?
- [ ] Lehe yorum dürtüsü reddedildi mi?

---

## 4. Workflow (6 Faz)

### Faz 0: Soru Kabul + Klasör Kurulumu

1. Sorudan ASCII-safe slug üret. Örnek:
   - "ev sahibi 3 ay kira ödememe tahliye" → `ev-sahibi-3-ay-kira-tahliye`
   - "trafik kazası %50 kusurlu yaya ölüm" → `trafik-50-kusur-yaya-olum`
2. Tarih önekiyle klasör adı: `{YYYY-MM-DD}-{slug}`
3. Drive klasörünü oluştur:
   ```
   G:\Drive'ım\Hukuk Bürosu\Research\{YYYY-MM-DD}-{slug}\
   ```
4. `00-Soru.md` dosyasını yaz. İçerik:
   ```markdown
   ---
   tarih: {YYYY-MM-DD}
   arastirma_id: {YYYY-MM-DD}-{slug}
   status: ARASTIRMA BASLIYOR
   ---

   # Soru
   {avukatın sorduğu ham soru}

   ## Doktrinal Çeviri (Faz 2 için)
   {Claude'un sorudan çıkardığı doktrinal Türkçe terimler:
    örn. "kira ödememe → tahliye davası → TBK m.315 ihtar şartı"}
   ```

### Faz 1: Süper Stajyer (CDP Otomasyon)

**Atlanabilir** — CDP kapalıysa veya avukat "stajyeri atla" derse Faz 2'ye geç.

1. **CDP Health Check:** `curl -s --max-time 3 http://localhost:9222/json/version`
   - FAIL → avukata "Chrome CDP modunda değil. `scripts\launch-chrome-cdp.ps1` ile başlat veya `stajyer atla` de" mesajı
   - OK → devam
2. **Çok-turlu batch yazımı:** `tmp/danisma-stajyer-batch.md`. KVKK mask **YOK**
   (jenerik soru, müvekkil adı yok). Soru TEK mesaj değil, **2 GRUPLU tur**
   olarak `===BATCH===` ayracıyla yazılır (ASLA 1 satırlık peş peşe soru).
   Sadece SON tur "ARASTIRMA TAMAMLANDI" ile biter:
   ```
   Sorulan hukuki soru:
   {00-Soru.md içeriği}

   Bu soruyu sana 2 turda soracağım; her turu eksiksiz yaz, bir önceki
   cevaba göre derinleştir.

   TUR 1 — Türk hukuku çerçevesinde:
   1. Soruya doğrudan cevap
   2. En az 5 ilgili Yargıtay kararı (esas/karar/daire/tarih)
   3. İlgili kanun maddeleri (kanun adı + m.no)
   (Bu turu normal bitir, "ARASTIRMA TAMAMLANDI" YAZMA.)
   ===BATCH===
   TUR 2 — Tur 1 cevabını esas alarak:
   4. Karşı argüman / risk noktaları
   5. Sapma uyarıları (varsa)
   6. Tur 1'de yüzeysel kalan / şüpheli karar veya maddeyi derinleştir
   Bu son tur; en son satıra tek başına "ARASTIRMA TAMAMLANDI" yaz.
   ```
3. **Çalıştır (cok-turlu, insan-gibi, bekleyerek):**
   ```bash
   python scripts/superstajyer.py run-batch \
     --batch-file tmp/danisma-stajyer-batch.md \
     --output "G:\Drive'ım\Hukuk Bürosu\Research\{klasör}\01-Stajyer-cevap.md" \
     --config config/superstajyer.json
   ```
   Script her turdan önce "önceki üretim bitti mi" boşta-kilidi + insan-gibi
   gecikme uygular; turlar arası spam imkânsız.
   Çıkış kodları (yukarıda yorum bloğunda):
   - 0 → başarı (tüm turlar tamam), Faz 2'ye geç
   - 10/20/30/40/50 → hata, avukata bildir + fallback teklif
4. **Çıktı kontrolü:** Dosya yazıldı mı? Son turda `ARASTIRMA TAMAMLANDI` markörü var mı? Yargıtay kararı sayısı ≥3?

### Faz 2: Argüman.ai Semantik Genişletme

1. **Koleksiyon seçimi:**
   - İş hukuku / kira / aile / tazminat → `hukuk`
   - Suç davası → `ceza`
   - Vergi / belediye / kamu → `idare`
   - Temel hak ihlali → `anayasa`
2. **İlk arama** (geniş, expand=true):
   ```python
   mcp__arguman__search(
     query="<doktrinal Türkçe terim>",
     collection="hukuk",
     top_k=10,
     expand=True
   )
   ```
3. **Drift kontrolü:** Top sonuçlar gerçekten sorulan konu mu? Daire + snippet kontrol et. Drift varsa sorguyu yeniden formülleyip `expand=False` ile dene.
4. **Tam metin doğrulama** (min 3 kararda):
   ```python
   mcp__arguman__get_full_text(
     point_id=<hit.provenance.point_id>,
     collection="hukuk",
     page=1
   )
   ```
   **Snippet'tan asla atıf yapma** — tam metnin gövdesi sorulan meseleyi içeriyor mu doğrula.
5. **`02-Arguman-bulgulari.md` yaz:**
   ```markdown
   ---
   engine: claude
   mcp: arguman
   arguman_credits_used: N
   total_candidates_found: M
   ---

   # Argüman.ai Bulguları

   ## Kullanılan Sorgular
   - "{doktrinal terim}" expand=true, top_k=10 → {N} sonuç

   ## Bulunan Kararlar (Top 5-10)
   | # | Skor | Daire | Esas/Karar | Tarih | point_id |
   |---|---|---|---|---|---|
   | 1 | 0.95 | ... | ... | ... | ... |

   ## Tam Metin Okunan Kararlar (≥3)
   ### Karar 1: {künye}
   {tam metin alıntısı + bağlam yorumu}
   ```

**Maliyet notu:** Faz 2 tipik 1-3 kredi. `top_k` arttırma ek kredi getirmez. `expand=True` aynı 1 kredi.

### Faz 3: Yargı Pro Doğrulama Köprüsü (KRİTİK 0-HALÜSİNASYON KAPISI)

Faz 1 (Stajyer) + Faz 2 (Argüman) bulgularındaki **her künye** Bedesten'de var mı kontrol et.

1. **Künye listesi çıkar:** Faz 1 + Faz 2 çıktılarından eşsiz künye seti (esas_no + karar_no + daire).
2. **Her künye için:**
   ```python
   mcp__yargi-mcp-pro__search_bedesten_unified(
     court_types=["YARGITAYKARARI"],
     esas_no="{YIL/SIRA}",
     karar_no="{YIL/SIRA}",
     birimAdi="{H1-H23/C1-C23/HGK/CGK/IBK}",
     phrase="{konuyla ilgili 1-2 kelime}"
   )
   ```
3. **Sonuç değerlendirme:**
   - `total_records > 0` ve esas+karar uyuyor → `get_bedesten_document_markdown(documentId)` çağır
     - Tam metin **sorulan konuyla ilgili** → **DOĞRULANMIŞ**
     - Tam metin **alakasız** (Mehmet Ali davasında olduğu gibi vekalet ücreti vb.) → **HARD FAIL** (eleme)
   - `total_records == 0` → **DOĞRULANMAMIŞ** (Bedesten'de yok, halüsinasyon ihtimali)
4. **`03-Yargi-Pro-dogrulama.md` yaz:**
   ```markdown
   ---
   engine: claude
   mcp: yargi-mcp-pro
   total_kunye_count: N
   verified_count: V
   unverified_count: U
   hard_fail_count: H
   ---

   # Yargı Pro Doğrulama Sonuçları

   ## DOĞRULANMIŞ Kararlar (V adet)
   | Künye | Bedesten documentId | Konu uyum | Tam metin özeti |
   |---|---|---|---|
   | {Daire} E. {esas} - K. {karar} | {documentId} | ✓ | ... |

   ## DOĞRULANMAMIŞ Kararlar (U adet)
   | Künye | Sebep | Aksiyon |
   |---|---|---|
   | ... | Bedesten 0 sonuç | Cevaba dahil etme |

   ## HARD FAIL — Eleme Edilen Kararlar (H adet)
   | Künye | Gerçek konu | Stajyer/Argüman iddiası | Karar |
   |---|---|---|---|
   | ... | Sigorta tahkim vekalet ücreti | "Trafik tazminat zamanaşımı emsali" | ELENDİ |
   ```

**Kalite eşiği:** Faz 3 sonu DOĞRULANMIŞ sayısı (V) ≥ 2 olmalı. Aksi halde Faz 5'e geçilmez → avukata "yetersiz kaynak" mesajı.

### Faz 4: Mülga Denetimi

Faz 1+2'de atıf yapılan kanun maddeleri için yürürlük kontrolü.

1. **Madde listesi çıkar:** "TBK m.315", "KTK m.97", "HMK m.107" vb.
2. **Her madde için:**
   ```python
   mcp__yargi-mcp-pro__search_mevzuat(
     phrase='+"{kanun adı}" +m.{no}',
     mevzuat_tur_list=["KANUN"]
   )
   mcp__yargi-mcp-pro__get_mevzuat_document(
     id_type="madde",
     identifier="{madde_id}"
   )
   ```
3. **Sonuç değerlendirme:**
   - Madde **yürürlükte ve metni soruya uygun** → **GÜNCEL**
   - Madde **mülga** veya **değişmiş** → **MÜLGA/DEĞİŞMİŞ** (raporda uyarı; argüman zayıflar)
   - Madde **bulunamadı** → **DOĞRULANAMADI** (avukata manuel kontrol notu)
4. **`04-Mulga-denetim.md` yaz:**
   ```markdown
   ---
   engine: claude
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

### Faz 5: Sentez Cevap (Avukatın Okuyacağı Nihai Rapor)

Faz 1-4 çıktılarını Claude **terminal** sentezler. Antigravity/Gemini gerekmez — bu modül Claude tek-elden çalışır (hafiflik prensibi).

**`arastirma-cevabi.md` yapısı:**
```markdown
---
engine: claude
model: claude-opus-4-7
task_type: arastirma_cevabi
arastirma_id: {YYYY-MM-DD}-{slug}
timestamp_utc: {ISO}
status: TASLAK
self_review: YEŞİL / SARI
---

# Hukuki Araştırma Cevabı — {Konu}

**TASLAK — Avukat onayına tabidir**

## 0. Sorulan Soru
> {00-Soru.md ham metni}

## 1. Doğrudan Cevap (Net, 2-3 cümle)
{Soruya en net cevap. Lehe-aleyhe karışık dağılım yok.}

## 2. Hukuki Dayanak
### 2.1. Mevzuat (Faz 4 GÜNCEL maddeleri)
- {Kanun adı m.X}: «verbatim alıntı» — kaynak: Mevzuat MCP

### 2.2. Yargıtay İçtihadı (Faz 3 DOĞRULANMIŞ kararları)
- {Daire} E. {esas} - K. {karar} ({tarih}):
  «verbatim alıntı tam metinden»
  - Bedesten documentId: {id}
  - Bağlam: {bu kararın sorduğum soruya ne dediği}

## 3. Lehe Argümanlar
1. {Argüman + dayanak}
2. ...

## 4. Aleyhe Argümanlar / Risk Noktaları
1. {Aleyhe içtihat veya doktrin — açıkça yazılır, gizlenmez}
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

## Stajyer / Argüman.ai Bulguları — Elenen Künyeler
{Faz 3 HARD FAIL listesi — şeffaflık için}
```

**DOCX üretimi:**
```bash
python scripts/md_to_docx.py "G:\Drive'ım\Hukuk Bürosu\Research\{klasör}\"
```

### Faz 6: Memory Yazımı

İki katman:

**A. MemPalace `wing_arastirma`** (yoksa oluştur):
```python
# Wing yoksa
mempalace_add_drawer(
  wing="wing_arastirma",
  hall="hall_danisma_sorulari",
  title="{tarih}: {konu özet}",
  body="Soru: {özet}\nBulunan kararlar: N adet\nCevap: {1 cümle}\nDrive: {klasör}"
)

# Halüsinasyon çıktıysa
mempalace_add_drawer(
  wing="wing_arastirma",
  hall="hall_halusinasyon_kunyeleri",
  title="HALÜSİNASYON: {künye}",
  body="Kaynak: {Stajyer/Argüman}\nGerçek konu: {Bedesten tam metin özeti}\nIddia: {ne diye sunmuştu}"
)
```

**B. Proje memory** (`C:\Users\user\.claude\projects\C--Users-user-Desktop-Eski-Claude-ant-grav-ty\memory\`):
- Yeni öğrenim yakalandıysa (örn. "X kanun maddesi Y davası için kritik") → yeni memory dosyası
- Her araştırma sonu MEMORY.md'ye 1 satır eklenmez — sadece **kalıcı öğrenim** varsa.

---

## 5. Hata Yönetimi

| Senaryo | Aksiyon |
|---|---|
| CDP port yanıt vermiyor | Stajyer atla, raporda `STAJYER YOK` flag'i, Faz 2'den devam |
| Süper Stajyer login eksik | Avukata bildir + manuel pano fallback teklif |
| Süper Stajyer cevabında <3 karar | Avukata "yetersiz cevap, tekrar sorgu?" sor |
| Argüman.ai 0 sonuç | Faz 2 boş geçer, raporda `ARGUMAN YOK` flag'i, Yargı Pro ile devam |
| Argüman.ai re-auth gerekiyor | Avukata `mcp__arguman` yeniden bağlanma bildirimi |
| Yargı Pro MCP down | Faz 3 atlanır, AMA bu HARD FAIL → cevap yazılmaz, avukata "Pro MCP gerekiyor" |
| Mevzuat MCP down | Faz 4 atlanır, `MULGA DENETIMI YAPILMADI` flag'i, cevap yazılır ama uyarılı |
| ≥2 DOĞRULANMAMIŞ atıf | HARD FAIL — Faz 5'e geçilmez, avukata "yetersiz kaynak" + bulunan ham veriler paylaşılır |
| Sentez sırasında çelişkili kararlar | Çelişki açıkça raporda yazılır, hangi tarafın ağır basacağı tahmin edilmez (avukat karar verir) |

---

## 6. Output Özeti

**Drive klasörü:** `G:\Drive'ım\Hukuk Bürosu\Research\{YYYY-MM-DD}-{slug}\`

| Dosya | İçerik | Üretici |
|---|---|---|
| `00-Soru.md` | Ham soru + doktrinal çeviri | Claude (Faz 0) |
| `01-Stajyer-cevap.md` | Süper Stajyer ham cevap | superstajyer.py (Faz 1) |
| `02-Arguman-bulgulari.md` | Argüman.ai search + tam metin | Claude + Argüman MCP (Faz 2) |
| `03-Yargi-Pro-dogrulama.md` | DOĞRULANMIŞ/DOĞRULANMAMIŞ/HARD FAIL tablosu | Claude + Yargı Pro MCP (Faz 3) |
| `04-Mulga-denetim.md` | Mevzuat madde yürürlük denetimi | Claude + Yargı Pro Mevzuat (Faz 4) |
| `arastirma-cevabi.md` ★ | NİHAİ — avukatın okuyacağı sentez | Claude (Faz 5) |
| `arastirma-cevabi.docx` | DOCX export | md_to_docx.py (Faz 5) |

**Avukat sadece `arastirma-cevabi.md/.docx`'i okur.** Diğer 5 dosya iz/şeffaflık için arşivde durur.

---

## 7. Komut Sözleşmesi (Hatırlatma)

```
arastir danisma: {hukuki soru}
```

Klasör adı otomatik üretilir. Müvekkil adı sorulmaz, KVKK mask dict gerekmez. Tek soru yeterli.

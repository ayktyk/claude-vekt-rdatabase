# ANTIGRAVITY + CLAUDE KOORDİNASYON KILAVUZU

Bu belge, terminalde çalışan **Claude** ile sağ panelde çalışan
**Antigravity (Gemini 3.1 Pro)** asistanlarının nasıl birlikte ve uyumlu
(hibrit) çalışacağını anlatan kullanım rehberidir.

**Sistem felsefesi:**

- **Claude (Terminal):** Büyük veri tarama, MCP araçları (Yargı, Mevzuat,
  NotebookLM, MemPalace, Drive, Calendar, Gmail). Araştırma + KVKK
  - Drive yazımı + DOCX/UDF dönüşümü Claude'da kalır.
- **Antigravity (Sağ Panel):** Türk hukuku mantığıyla hukuki üretim —
  usul raporu, 5 Ajanlı stratejik analiz, dilekçe v1, savunma simülasyonu,
  dilekçe v2 NİHAİ. Her üretim sonu self-review zorunlu.

**Bridge kaldırıldı:** Önceki `scripts/gemini-bridge.sh` köprüsü
2026-05-13 itibariyla **DEPRECATED** (exit 100). Antigravity sağ panelde
zaten oturum açık — kapasite/auth sorunu yok.

---

## 7 ASAMA Akışı (Ayrım Haritası)

```
TERMINAL CLAUDE (sol panel)         | ANTIGRAVITY (sağ panel — Gemini 3.1 Pro)
------------------------------------|------------------------------------------
ASAMA 0  MemPalace Wake-up          | BATCH 1 — ASAMA 3 (Usul Raporu)
ASAMA 1  Hazırlık + Briefing        |   ↓ "ASAMA 3 bitti" + DOCX/diary
ASAMA 2  Derin Araştırma            |
  - 2B Yargı MCP                    | BATCH 2 — ASAMA 4 (5-Ajan Stratejik)
  - 2C Mevzuat MCP                  |   ↓ "ASAMA 4 bitti" + Hipotez ONAYI
  - 2D NotebookLM MCP               |
  - Faz D Arguman.ai (FAZ 3, 2026-05-19) | BATCH 3 — ASAMA 5+6+7 (TEK SOHBET):
  - 2  sentez (Claude)              |   ASAMA 5  Dilekçe v1
                                    |   ASAMA 6  Savunma Simülasyonu
                                    |   ASAMA 7  Dilekçe v2 NİHAİ
                                    |   ↓ "Hepsi bitti" + UDF + Pilot raporu
------------------------------------|------------------------------------------
+ KVKK mask/unmask (scripts/maske.py)| (maskeli token'larla çalışır)
+ md_to_docx.py / md_to_udf.py      | + Her ASAMA sonu self-review
+ MemPalace diary write             | + Batch 3'te Antigravity iç döngüsü:
+ qmd update                        |   yaz → eleştir → revize (3 çıktı tek sohbet)
+ Antigravity 3 batch devir bloğu   |
```

**3 Batch Protokolü (2026-05-14 Pilot Sonrası):** Claude **3 batch**
halinde Antigravity için copy-paste devir bloğu basar. Avukat sağ panele
yapıştırır. Antigravity batch içinde sırayla üretip Drive'a yazar.
Avukat "BATCH X bitti" (veya "ASAMA N bitti") der → Claude `qmd update` +
MemPalace diary yapar → bir sonraki batch bloğunu basar.

**Mehmet Ali 2026-003 pilot dersi:** Önceki 5 ayrı devir blok yaklaşımı
30+ dk manuel iş yarattı. ASAMA 5-6-7 zaten doğal "yaz-eleştir-revize"
döngüsü olduğu için tek sohbette birleştirildi. ASAMA 3 ve 4 ayrı kaldı
(hipotez seçimi avukat onayı gerektiriyor). Yeni akış: **5 yapıştırma →
3 yapıştırma** (%40 azalma), kalite zinciri korunur.

---

## 🚀 KULLANIM AKIŞI

### ADIM 1: ARAŞTIRMA (Terminalde Claude — ASAMA 0-1-2)

Terminalde Claude'a yeni dava komutu ver:

```
yeni dava: [MUVEKKIL_1] (kiraya veren), kira tespit
özet: Mevcut kira 13.000 TL, hedef 35.000 TL. 5 yıl dolmuş.
kritik nokta: TBK 344/3 hak nesafet uygulaması + karşı vekalet
dava-id: ornek-2026-001
```

Claude şu işleri yapar:

1. **ASAMA 0** — MemPalace wake-up (büro hafızası sorgulanır)
2. **ASAMA 1** — Drive klasörü açar, kaynak sorgulaması, briefing
3. **ASAMA 2** — Derin araştırma (Yargı MCP + Mevzuat MCP + NotebookLM
   - Akademik) ve konsolide rapor yazar

ASAMA 2 sonunda Claude **ASAMA 3 için Antigravity devir bloğu** basar.

---

### ADIM 2: HUKUKİ ÜRETİM (Sağ Panelde Antigravity — ASAMA 3-7)

Claude'un bastığı devir bloğunu sağ panele kopyala-yapıştır. Antigravity
şu sırayla çalışır:

1. **ASAMA 3** — Usul Raporu
2. **ASAMA 4** — 5 Ajanlı Stratejik Analiz (Davacı + Davalı + Bilirkişi +
   Hakim + Sentez)
3. **ASAMA 5** — Dilekçe v1
4. **ASAMA 6** — Savunma Simülasyonu
5. **ASAMA 7** — Dilekçe v2 NİHAİ (revizyon)

Her ASAMA sonunda Antigravity ayni sohbette **self-review** yapar
(`prompts/gemini/self_review.md`). KIRMIZI/SARI/YEŞİL karar verir.

Antigravity her çıktıyı **Drive'a** yazar (`G:\Drive'im\Hukuk Burosu\
Aktif Davalar\{dava-id}\...`). Sonra terminale dön ve "ASAMA N bitti" yaz.

---

### ADIM 3: TERMINALDE GERİ DÖNÜŞ (Claude — Diary + DOCX/UDF + Sonraki Batch)

Avukat terminale dönüp "BATCH X bitti" deyince Claude:

1. `qmd update` çalıştırır (yeni MD dosyalarını indexler)
2. İlgili ajan(lar)ın `wing_ajan_*/hall_diary`'sine MemPalace diary yazar
3. `python scripts/md_to_docx.py {dava-klasörü}` (DOCX zorunlu)
4. **Batch 3 sonu** ek olarak: `python scripts/md_to_udf.py dilekce-v2.md` (UDF NİHAİ)
5. Bir sonraki batch için yeni Antigravity devir bloğu basar

---

## 📋 3 BATCH DEVİR BLOĞU ŞABLONLARI

> **2026-05-14 Pilot Sonrası İyileştirme:** Mehmet Ali 2026-003 davasında
> 5 ayrı devir bloğu manuel iş yükünü artırdığı tespit edildi. ASAMA 5-6-7
> zaten doğal "yaz → eleştir → revize" döngüsü olduğu için **tek sohbette
> birleştirildi**. ASAMA 3 ve 4 ayrı kaldı (hipotez seçimi avukat onayı
> gerektiriyor). **5 yapıştırma → 3 yapıştırma** (%40 azalma).

Aşağıdaki şablonlar terminal Claude'un her batch başında üreteceği
copy-paste bloklarıdır. Şablonlar `prompts/gemini/*.md` dosyalarıyla
birlikte çalışır.

### BATCH 1 — ASAMA 3 (Usul Raporu)

```
========== ANTIGRAVITY DEVIR BLOĞU ==========
ASAMA: BATCH 1 — ASAMA 3 (Usul Raporu)
Dava-ID: {dava-id}

Sağ panele yapıştırılacak:
--------------------------------------------
Aşağıdaki dosyaları oku:
  - G:\Drive'im\Hukuk Burosu\Aktif Davalar\{dava-id}\{calisma-klasoru}\00-Briefing-ozet.md
  - G:\Drive'im\Hukuk Burosu\Aktif Davalar\{dava-id}\{calisma-klasoru}\02-Arastirma\arastirma-raporu.md
  - G:\Drive'im\Hukuk Burosu\Aktif Davalar\{dava-id}\{calisma-klasoru}\02-Arastirma\mevzuat-bulgulari.md
  - G:\Drive'im\Hukuk Burosu\Aktif Davalar\{dava-id}\{calisma-klasoru}\02-Arastirma\mulga-eleme.json
  - tmp\{dava-id}-adliye-dogrulama.md   (Claude WebSearch adliye doğrulama)
  - tmp\{dava-id}-hesaplama.md          (varsa — işçilik vs.)

Protokol: prompts/gemini/usul_raporu.md
Ortak kurallar: prompts/gemini/_ortak-kurallar.md

>>> DOKTRİN (ZORUNLU — tam metin: prompts/_doktrin-preamble.md) <<<
<!-- DOKTRIN-PREAMBLE v1 -->
- UYDURMA YARGITAY/HGK/İBK kararı atfı YASAK — sana verilen künyeler ÖNCEDEN (terminal Claude tarafından ictihat_getir ile) doğrulandı; SEN yeniden internetten/hafızadan karar arama; sana verilmeyen künye = uydurma riski → kullanma.
- Karar metni ALINTISI UYDURULAMAZ — tırnak içi alıntı («...») birebir kaynaktan.
- BAĞLAM KORUNMALI — bir kaynağın bir fıkra/dava için cevabı başka fıkra/davaya genellenemez (89/4 → 89/3 taşıma YASAK).
- Avukatı/müvekkili memnun etmek için LEHE YORUM YASAK; ALEYHE İÇTİHAT açıkça gösterilir, gizlenmez. Aşırı vaat ("kesin kazanırsınız") YASAK.
- "KAYNAK YOK" demek dürüstlüktür — sayı doldurmak için uydurma atıf eklemek HARD FAIL.
- Kritik kuralda (ispat yükü / görevli mahkeme / hak düşürücü süre) ÇİFT KAYNAK şart.
- Çıktının EN BAŞINA `<!-- DOKTRIN-PREAMBLE v1 -->` satırını AYNEN yaz (doktrin echo — yoksa cikti_dogrula.py output gate REDDEDER).
- Çıktının SONUNA KAYNAK DOĞRULAMA tablosu (| İddia | Kaynak | documentId | Tam Alıntı | Doğrulama |) + "Aleyhe içtihat: VAR/YOK/ARANMADI" beyanı + boş olmayan "Aleyhe İçtihat / Risk" bölümü ekle.
>>> DOKTRİN SONU <<<

Görev: Usul iskeletini kur — görevli mahkeme, yetkili adliye (kesin tek yer
taahhüdü YOK — seçenekler + doğrulanmamış noktalar), zamanaşımı (uzamış
ceza süresi kontrolü zorunlu), arabuluculuk + KTK 97 gibi ön şartlar,
harç tahmini, risk analizi, müvekkil + belge checklist.

Çıktı: G:\Drive'im\Hukuk Burosu\Aktif Davalar\{dava-id}\{calisma-klasoru}\01-Usul\usul-raporu.md

KVKK: tüm token'lar maskeli kalır.
Çıktı sonunda self-review yap (prompts/gemini/self_review.md):
  HARD FAIL: Zamanaşımı yanlış hesaplanırsa (uzamış süre atlanırsa)
  HARD FAIL: Yetkili adliye için kesin tek yer taahhüdü yapılırsa
  HARD FAIL: KTK 92/f gibi ZMS kapsamı dışı kalemler işlenmezse
--------------------------------------------

Antigravity tamamlayınca buraya dön ve "ASAMA 3 bitti" yaz.
Terminal Claude DOCX + diary + BATCH 2 bloğunu hazırlayacak.
=============================================
```

### BATCH 2 — ASAMA 4 (5-Ajanlı Stratejik Analiz)

```
========== ANTIGRAVITY DEVIR BLOĞU ==========
ASAMA: BATCH 2 — ASAMA 4 (5-Ajanlı Stratejik Analiz)
Dava-ID: {dava-id}

Sağ panele yapıştırılacak:
--------------------------------------------
Aşağıdaki dosyaları oku (3 dosya — dosya paketi):
  - G:\Drive'im\Hukuk Burosu\Aktif Davalar\{dava-id}\{calisma-klasoru}\00-Briefing-ozet.md
  - G:\Drive'im\Hukuk Burosu\Aktif Davalar\{dava-id}\{calisma-klasoru}\02-Arastirma\arastirma-raporu.md
  - G:\Drive'im\Hukuk Burosu\Aktif Davalar\{dava-id}\{calisma-klasoru}\01-Usul\usul-raporu.md

Ek referans (bağlama göre):
  - 02-Arastirma\yargi-bulgulari.md
  - 02-Arastirma\mevzuat-bulgulari.md

Protokol: prompts/gemini/stratejik_analiz.md
Ortak kurallar: prompts/gemini/_ortak-kurallar.md

>>> DOKTRİN (ZORUNLU — tam metin: prompts/_doktrin-preamble.md) <<<
<!-- DOKTRIN-PREAMBLE v1 -->
- UYDURMA YARGITAY/HGK/İBK kararı atfı YASAK — sana verilen künyeler ÖNCEDEN (terminal Claude tarafından ictihat_getir ile) doğrulandı; SEN yeniden internetten/hafızadan karar arama; sana verilmeyen künye = uydurma riski → kullanma.
- Karar metni ALINTISI UYDURULAMAZ — tırnak içi alıntı («...») birebir kaynaktan.
- BAĞLAM KORUNMALI — bir kaynağın bir fıkra/dava için cevabı başka fıkra/davaya genellenemez (89/4 → 89/3 taşıma YASAK).
- Avukatı/müvekkili memnun etmek için LEHE YORUM YASAK; ALEYHE İÇTİHAT açıkça gösterilir, gizlenmez. Aşırı vaat ("kesin kazanırsınız") YASAK.
- "KAYNAK YOK" demek dürüstlüktür — sayı doldurmak için uydurma atıf eklemek HARD FAIL.
- Kritik kuralda (ispat yükü / görevli mahkeme / hak düşürücü süre) ÇİFT KAYNAK şart.
- Çıktının EN BAŞINA `<!-- DOKTRIN-PREAMBLE v1 -->` satırını AYNEN yaz (doktrin echo — yoksa cikti_dogrula.py output gate REDDEDER).
- Çıktının SONUNA KAYNAK DOĞRULAMA tablosu (| İddia | Kaynak | documentId | Tam Alıntı | Doğrulama |) + "Aleyhe içtihat: VAR/YOK/ARANMADI" beyanı + boş olmayan "Aleyhe İçtihat / Risk" bölümü ekle.
>>> DOKTRİN SONU <<<

Görev: 5 perspektiften analiz yap:
  4A Davacı Avukat — lehimize en güçlü 5 argüman
  4B Davalı Avukat — en tehlikeli 5 itiraz
  4C Bilirkişi — teknik değerlendirme
  4D Hakim — muhtemel karar + bozma riski + ek sorular
  4E Sentez & Strateji — KIRMIZI/SARI/YEŞİL karar + DİLEKÇE YAZIM REHBERİ
    + birincil/ikincil/destekleyici hipotez seçimi

Hata toleransı (Promise.allSettled): 4/4 tam, 3/4 uyarılı, 2/4 sınırlı,
<2/4 DURDUR.

Çıktı: G:\Drive'im\Hukuk Burosu\Aktif Davalar\{dava-id}\{calisma-klasoru}\02-Arastirma\stratejik-analiz.md

Çıktı sonunda self-review yap (prompts/gemini/self_review.md):
  HARD FAIL: KIRMIZI karar → Drive'a yazılmaz, sohbette revize edilir
  HARD FAIL: <2/4 perspektif → DURDUR
  HARD FAIL: Lehe yorum dürtüsü (aleyhe içtihat küçümsenmiş)
  HARD FAIL: Doğrulanmamış atıf >= 2 (DOĞRULANMASI GEREKİR damgaları korunmalı)
--------------------------------------------

Antigravity tamamlayınca buraya dön ve "ASAMA 4 bitti" yaz.

⚠️ AVUKAT ONAYI ÖNEMLİ: 4E Sentez KIRMIZI/SARI/YEŞİL verdiğinde ve
birincil hipotez seçildiğinde, Terminal Claude BATCH 3'e geçmeden önce
avukatın onayını alır. KIRMIZI çıkarsa BATCH 3 BLOKLENİR.
=============================================
```

### BATCH 3 — ASAMA 5+6+7 (Dilekçe Ailesi — TEK SOHBETTE 3 ASAMA)

> **🎯 Bu batch Antigravity'nin doğal "yaz → eleştir → revize" döngüsünü
> kullanır.** ASAMA 5 dilekçe v1'i yazar, ASAMA 6 v1'i karşı taraf gözüyle
> eleştirir, ASAMA 7 v2 NİHAİ revizyon yapar — hepsi aynı sohbette, context
> kaybolmadan. Drive'a 3 ayrı dosya yazılır.

```
========== ANTIGRAVITY DEVIR BLOĞU ==========
ASAMA: BATCH 3 — ASAMA 5+6+7 (Dilekçe Ailesi — TEK SOHBETTE 3 ÜRETİM)
Dava-ID: {dava-id}

Sağ panele yapıştırılacak:
--------------------------------------------
Aşağıdaki dosyaları sırayla oku (girdi paketi):
  - G:\Drive'im\Hukuk Burosu\Aktif Davalar\{dava-id}\{calisma-klasoru}\00-Briefing-ozet.md
  - G:\Drive'im\Hukuk Burosu\Aktif Davalar\{dava-id}\{calisma-klasoru}\02-Arastirma\arastirma-raporu.md
  - G:\Drive'im\Hukuk Burosu\Aktif Davalar\{dava-id}\{calisma-klasoru}\01-Usul\usul-raporu.md
  - G:\Drive'im\Hukuk Burosu\Aktif Davalar\{dava-id}\{calisma-klasoru}\02-Arastirma\stratejik-analiz.md
     ⭐ YAZIM REHBERİ — 4E sentez "Dilekçe Yazım Rehberi" bölümü birebir takip edilecek

Protokol dosyaları:
  - prompts/gemini/dilekce_yazimi.md (ASAMA 5 için)
  - prompts/gemini/savunma_simulasyonu.md (ASAMA 6 için)
  - prompts/gemini/revizyon.md (ASAMA 7 için)
  - prompts/gemini/_ortak-kurallar.md
  - dilekce-yazim-kurallari.md (proje kökünde)

---

GÖREV: 3 ASAMA'yı sırayla aynı sohbette üret. Her ASAMA sonunda
self-review yap, çıktıyı belirtilen Drive yoluna yaz, sonraki ASAMA'ya geç.

### ADIM A — ASAMA 5: Dilekçe v1

4E Sentez "Dilekçe Yazım Rehberi"ni birebir takip et:
  - Birincil/ikincil/destekleyici hipotez sıralaması
  - Önerilen argümanları önerilen sırayla
  - DOĞRULANMIŞ Yargıtay kararları öncelikli atıf (DOĞRULANMASI GEREKİR
    damgalı kararlar metin içinde damgalı kalır)
  - TALEP AYRIŞTIRMASI (KTK 92/f varsa sigortacıdan manevi YOK, vb.)
  - wing_buro_aykut ölçülü ton (slogan/duygusal abartı YASAK)
  - KVKK Seviye 2 (tüm muvekkil verisi maskeli token)

ÇIKTI: G:\Drive'im\Hukuk Burosu\Aktif Davalar\{dava-id}\{calisma-klasoru}\03-Sentez-ve-Dilekce\dilekce-v1.md

ADIM A SONU SELF-REVIEW: YEŞİL ise B'ye geç; KIRMIZI ise sohbette revize.

### ADIM B — ASAMA 6: Savunma Simülasyonu

Az önce yazdığın dilekçe v1'i KARŞI TARAF AVUKATI gözüyle eleştir.
Amaç dilekçe yazmak DEĞİL; v1'in zayıf noktalarını ve karşı tarafın
yapabileceği en tehlikeli itirazları tespit etmek.

Çıktı içeriği:
  - En tehlikeli 5 itiraz (sıralama: en kritik başta)
  - Her itiraza karşı pozisyon önerisi (ADIM C için)
  - Hakimin olası soruları + cevap altyapısı
  - Risk flag matrisi (KIRMIZI/SARI/YEŞİL)
  - ASAMA 7 için somut iyileştirme önerileri (5 madde)

ÇIKTI: G:\Drive'im\Hukuk Burosu\Aktif Davalar\{dava-id}\{calisma-klasoru}\02-Arastirma\savunma-simulasyonu.md

ADIM B SONU SELF-REVIEW: YEŞİL ise C'ye geç.

### ADIM C — ASAMA 7: Dilekçe v2 NİHAİ (Revizyon)

V1'i savunma simülasyonu bulgularıyla revize et — 8 boyutlu denetim:
  1. Künye doğrulaması (DOĞRULANMASI GEREKİR damgaları korunur)
  2. Atıf metin doğrulaması (tırnak alıntıları birebir)
  3. Dil ve üslup (wing_buro_aykut)
  4. Format (dilekce-yazim-kurallari.md)
  5. Yapı bütünlüğü
  6. Dengeli pozisyon (savunma simülasyonundaki 5 itiraza proaktif cevap)
  7. İddiaların tutarlılığı
  8. KAYNAK AUDİTİ (doğrulanmamış atıf >= 2 ise HARD FAIL)

ASAMA 6'dan gelen 5 iyileştirme önerisi TAVİZSİZ uygulanır.

Çıktı sonuna KAYNAK DOĞRULAMA TABLOSU eklenir (zorunlu):
  - DOĞRULANMIŞ kararlar Bedesten documentId ile
  - DOĞRULANMASI GEREKİR kararlar damgalı (avukat teyit edecek)

ÇIKTI: G:\Drive'im\Hukuk Burosu\Aktif Davalar\{dava-id}\{calisma-klasoru}\03-Sentez-ve-Dilekce\dilekce-v2.md

KVKK: v2 de MASKELİ; unmask + UDF/DOCX terminal Claude'da yapılır.

ADIM C SONU SELF-REVIEW: Utandırma testi (yapay zeka dili var mı?)
  HARD FAIL: 5 iyileştirmeden 1+'i atlanmışsa
  HARD FAIL: Talep ayrıştırması bozulmuşsa
  HARD FAIL: Doğrulanmamış atıf >= 2 ve KAYNAK DOĞRULAMA TABLOSU eksikse

---

3 ÇIKTI TAMAMLANINCA: Buraya dön ve "Hepsi bitti" yaz.
Terminal Claude DOCX + UDF + diary'ler + MemPalace promotion +
PILOT-RAPORU.md hazırlayacak.
=============================================
```

---

## 🔁 Batch 3 İç Akış Diyagramı

```
TEK ANTIGRAVITY SOHBETİ:

ADIM A: Dilekçe v1 yaz → self-review → Drive'a yaz (dilekce-v1.md)
              ↓
ADIM B: Karşı taraf gözüyle v1'i eleştir → self-review → Drive'a yaz
        (savunma-simulasyonu.md)
              ↓
ADIM C: V1 + savunma sim'i alıp 8 boyutlu revizyon → v2 NİHAİ üret
        → self-review → Kaynak Doğrulama Tablosu → Drive'a yaz
        (dilekce-v2.md)
              ↓
        Avukat terminale dön: "Hepsi bitti"
              ↓
        Terminal Claude: DOCX + UDF + 3 ajan diary + wing_{dava_turu}
        promotion + PILOT-RAPORU.md
```

**Bu yaklaşımın avantajı:** Antigravity context'i 3 ASAMA boyunca
yüklü tutar; v2 üretilirken v1'in yazım kararları ve savunma
simülasyonunun bulguları "taze hafızada" — kalite düşmez, hatta
ara denetim sürtünmesi olmadığı için artar.

---

## 🔍 SELF-REVIEW PROTOKOLÜ

Antigravity her hukuki üretim ASAMA'sının sonunda **aynı sohbette**
`prompts/gemini/self_review.md` protokolünü uygular. Bridge yok, ek tool
yok — sadece sohbet içinde "şimdi kendi çıktını self-review et" yönlendirmesi.

### Self-Review Adımları

1. **Yargıtay/HGK/IBK atıf denetimi:**
   - Her künye Bedesten documentId ile doğrulanmış mı?
   - Doğrulanamayan künye: SİL veya "(varsayılan / doğrulanmamış)" notu
   - Hata: "Doğrulanmamış atıf >= 2" → **HARD FAIL** (çıktı Drive'a yazılmaz)

2. **Tırnak alıntı denetimi:**
   - `«...»` tırnak içi alıntı karar metniyle birebir mi?
   - Uyumsuz alıntı: SİL, sadece künye + sayfa referansı bırak

3. **Bağlam denetimi:**
   - NotebookLM cevabı farklı davaya genelleştirilmiş mi? (Tugba 2026-89
     hatası) → SİL, "Bu konuda doğrulanmış kaynak yok" yaz
   - Mülga karara/maddeye atıf var mı? → SİL veya "olay tarihi versiyonu" notu

4. **Format denetimi:**
   - Emoji, slogan tonu, aşırı vurgu (`**ÖNEMLİ**`), yabancı terim
     (`workflow`, `okay`) var mı? → DÜZELT
   - Avukat Aykut'un ölçülü profesyonel tonuna uygun mu?

5. **Lehe yorum denetimi:**
   - Aleyhe içtihat sırf "müvekkili memnun etmek için" gizlenmiş mi?
   - Kaynaksız genel iddia (`Yargıtay yerleşmiştir`) var mı?
   - Her iki durumda da düzeltme zorunlu.

### Karar Çıktısı

Antigravity self-review sonunda 3 sınıftan birini verir:

| Karar                     | Anlam                     | Davranış                                                                   |
| ------------------------- | ------------------------- | -------------------------------------------------------------------------- |
| **YEŞİL — KABUL**         | Tüm denetim temiz         | Çıktı Drive'a yazılır                                                      |
| **SARI — REVİZYON GEREK** | Küçük düzeltmeler         | Antigravity sohbette düzeltir veya avukatın onayını sorar                  |
| **KIRMIZI — YENİDEN YAZ** | HARD FAIL veya ağır ihlal | Antigravity sohbette revize eder, avukata sadece düzeltilmiş çıktıyı sunar |

Self-review çıktısı dilekçenin/raporun sonunda kısa bir blok olarak yer alır.

---

## 🆘 FALLBACK PROTOKOLÜ

### Antigravity erişilemez/cevap vermez

Avukat terminale dönüp **"fallback claude"** yazar. Terminal Claude o ASAMA'yı
`prompts/gemini/{task_type}.md` protokolüne göre üretir. Çıktının
frontmatter'ı işaretlenir:

```yaml
---
status: TASLAK
engine: claude
model: claude-opus-4-7
fallback_used: true
reason: antigravity_unavailable
asama: ASAMA 5
dava_id: { dava-id }
---
```

Fallback olayı `logs/model-events.jsonl`'a kaydedilir.

### `/motor-degistir` komutu

Avukat bir ASAMA'dan memnun değilse `/motor-degistir` ile alternatif motorla
yeniden üretebilir:

- Antigravity → memnun değilim → Claude ile yeniden
- Claude (fallback) → daha iyi olsun → Antigravity'ye taşı

Detay: `.claude/commands/motor-degistir.md`.

---

## 💡 İPUÇLARI VE HATIRLATMALAR

- **KVKK Kuralı:** İsimleri her zaman Maskeleme Protokolüne uygun girin
  (`[MUVEKKIL_1]`, `[KARSI_TARAF_1]`, `[TC_1]`, `[ADRES_2]`). Antigravity
  ABD sunucusundadır — ham veri göndermek YASAK.
- **Köprü Çökmeleri Bitti:** `gemini-bridge.sh` artık DEPRECATED (exit 100).
  Kapasite hatası, OAuth kopması yaşanmayacak. Gemini'nin tüm gücü
  doğrudan sağ panelde sizinledir.
- **Lehe Yorum Yasağı:** Antigravity, sizin koyduğunuz 0-Halüsinasyon
  Doktrini gereği sadece Claude'un klasöre indirdiği ve doğrulanan karar
  metinlerini kullanır. Sizi memnun etmek için uydurma karar yaratmayacak.
- **Her ASAMA Drive'a yazılır:** Antigravity çıktıları terminale geri
  kopyalanmaz — Drive'da kalır, Claude `qmd update` ile indexler.
- **Self-review zorunlu:** Antigravity hiçbir çıktıyı self-review yapmadan
  Drive'a yazmaz. KIRMIZI çıkan çıktılar sohbette revize edilir.
- **UDF sadece NİHAİ için:** v1, usul, araştırma vb. taslaklar yalnızca
  MD + DOCX üretir. v2 NİHAİ + istinaf + temyiz için UDF zorunlu (UYAP
  format_id=1.7).

---

## 📚 İlgili Dosyalar

| Dosya                                | İçerik                                                    |
| ------------------------------------ | --------------------------------------------------------- |
| `CLAUDE.md`                          | Sistem ana kuralları + Antigravity Hibrit Mimarisi bölümü |
| `FIVEAGENTS.md`                      | 7 ASAMA detayı + Hangi ASAMA Hangi Motorda tablosu        |
| `config/model-routing.json`          | engine: antigravity_manual / claude haritası              |
| `prompts/gemini/*.md`                | Antigravity'ye yapıştırılacak prompt template'leri        |
| `scripts/gemini-bridge.sh`           | DEPRECATED (rollback için korunuyor)                      |
| `hooks/check-model-regression.sh`    | DEPRECATED                                                |
| `.claude/commands/motor-degistir.md` | Antigravity ↔ Claude geçiş komutu                         |
| `.claude/commands/yeni-dava.md`      | Yeni dava açma komutu (ASAMA 0-1-2 Claude)                |

_(Bu kılavuz 2026-05-13 itibariyla Antigravity hibrit mimarisine geçişle
güncellenmiştir.)_

# Dilekçe Argüman Çerçeveleri Entegrasyonu — Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `esaterbiltavus/yapay-zeka-turkce-dilekce-skilleri` reposundaki 12 hukuki argüman çerçevesini (IRAC/CREAC aileleri, Toulmin, klasik retorik) Vega Hukuk dilekçe hattına — ASAMA 4E çerçeve seçimi, ASAMA 5 yazım, ASAMA 6 warrant saldırısı, ASAMA 7 çerçeve denetimi olarak — entegre etmek.

**Architecture:** Repo'nun *çerçeve katmanı* (argüman iskeletleri + dilekçe bölümü eşlemeleri + doğrulama listeleri) alınır; *biçim/çıktı katmanı* (bicim-ve-cikti.md) ALINMAZ çünkü bizim Tekin kuralları + uslup-aykut + md_to_docx/md_to_udf hattımızla çatışır. Çerçeve içerikleri `prompts/gemini/cerceveler/` altına uyarlanmış 13 dosya olarak konur (12 çerçeve + 1 seçim rehberi); Antigravity devir bloğu üzerinden bu dosyaları repo yolundan okur. Plugin OLARAK KURULMAZ.

**Tech Stack:** Markdown prompt dosyaları, mevcut 7-ASAMA Antigravity hattı, `scripts/doktrin_lint.py` doğrulaması.

**Kaynak:** https://github.com/esaterbiltavus/yapay-zeka-turkce-dilekce-skilleri — commit `00f0b43` (2026-06-19), MIT lisans. Yerel klon: scratchpad `dilekce-skilleri/` (uygulama sırasında yoksa yeniden `git clone --depth 1` yapılır).

---

## Tasarım Kararları (neden böyle)

1. **Çerçeve katmanı ALINIR, biçim katmanı ALINMAZ.**
   Repo'daki `bicim-ve-cikti.md` şunlarla çatışır ve bu nedenle hiçbir parçası taşınmaz:
   - "Fazlaya ilişkin her türlü talep... saklı" kalıbı → Tekin kuralı §7 (HMK m.109/3 gereği gereksiz) ile çatışır.
   - "arz ve izah edilen", etiket+iki nokta hizalı taraf bloğu, kendi hizalama/imza kuralları → `dilekce-yazim-kurallari.md` + `uslup-aykut.md` bizde geçerlidir.
   - docx/udf-cli/pdf üretim talimatları → bizim `md_to_docx.py` / `md_to_udf.py` hattımız geçerlidir.
   - Katı KVKK yer-tutucu zorunluluğu → bizde bulut LLM maskeleme ERTELENDİ (2026-07-09 avukat kararı); blog/kamu çıktısı kuralı zaten ayrıca var.

2. **Plugin kurulmaz, içerik uyarlanır.** Plugin kurulsaydı 12 skill terminal Claude'da tetiklenirdi; oysa dilekçe üretimi Antigravity'de (Gemini 3.1 Pro) çalışır ve skill'lerin biçim/akış talimatları (AskUserQuestion, udf-cli, docx skill) bizim hatla çatışır. Uyarlanmış dosyalar `prompts/gemini/cerceveler/` altında hem Antigravity hem Claude-fallback tarafından okunabilir. *(Reddedilen alternatif: `/plugin install` — çatışma + çift kaynak riski.)*

3. **Çerçeve DIŞ yapıyı değiştirmez.** Dilekçenin bölüm sırası (Makam → Taraflar → KONU → AÇIKLAMALAR → DELİLLER → HUKUKİ NEDENLER → SONUÇ VE TALEP) Tekin/HMK yapısı olarak sabittir. Çerçeve yalnızca AÇIKLAMALAR/II. HUKUKİ DEĞERLENDİRME bölümünün İÇ argüman iskeletini belirler.

4. **Çatışma önceliği (her uyarlanmış dosyanın başına yazılır):**
   `uslup-aykut.md` > `dilekce-yazim-kurallari.md` > `_ortak-kurallar.md` > çerçeve dosyası.
   Künye/atıf her zaman doktrin-preamble'a tabidir; çerçeve dosyaları künye İÇERMEZ (örnek bloklardaki `[TBK m. ...]` yer tutucuları aynen korunur).

5. **`prompts/gemini/cerceveler/` alt dizini `doktrin_lint.py` kapsamı DIŞINDA kalır** — lint glob'u `prompts/gemini/*.md` (özyinelemesiz, `scripts/doktrin_lint.py:30`). Çerçeve dosyaları prompt yüzeyi değil referans malzemedir; SENTINEL taşımaz. Doktrin, onları çağıran ana prompt'larda (dilekce_yazimi.md vb.) zaten inline'dır.

6. **Çerçeve seçimini ASAMA 4E yapar, avukat override eder.** 4E "Dilekçe Yazım Rehberi"ne çerçeve önerisi eklenir. Avukat tekil komutta doğal dille override edebilir ("Toulmin ile itiraz yaz").

## Dosya Haritası

| İşlem | Dosya | Sorumluluk |
|---|---|---|
| Create | `prompts/gemini/cerceveler/_secim-rehberi.md` | Hangi çerçeve ne zaman — 4E ve Director için seçim tablosu |
| Create | `prompts/gemini/cerceveler/{mirat,iraac,ilac,ipac,treac,crac,crupac,crexac,treat,crracc,toulmin,klasik-retorik}.md` (12 dosya) | Uyarlanmış çerçeve iskeletleri |
| Modify | `prompts/gemini/stratejik_analiz.md` | 4E rehberine çerçeve önerisi alanı |
| Modify | `prompts/gemini/dilekce_yazimi.md` | ASAMA 5: çerçeve okuma + uygulama kuralı |
| Modify | `prompts/gemini/savunma_simulasyonu.md` | ASAMA 6: Toulmin warrant saldırı adımı |
| Modify | `prompts/gemini/revizyon.md` | ASAMA 7: 7. denetim boyutu "çerçeve bütünlüğü" |
| Modify | `prompts/gemini/istinaf_temyiz.md` | Kanun yolu için çerçeve notu (CREXAC/IRAAC) |
| Modify | `CLAUDE.md` | BATCH 3 girdi listesi + kısayol tablosu notu |
| Modify | `ajanlar/dilekce-yazari/SKILL.md` | Claude-fallback: çerçeve okuma adımı |
| Modify | `ajanlar/savunma-simulatoru/SKILL.md`, `ajanlar/revizyon-ajani/SKILL.md` | Fallback işaretçileri |

---

### Task 1: Seçim rehberi — `_secim-rehberi.md`

**Files:**
- Create: `prompts/gemini/cerceveler/_secim-rehberi.md`

- [ ] **Step 1: Dosyayı aynen şu içerikle yaz**

```markdown
# Argüman Çerçevesi Seçim Rehberi

> Kaynak: esaterbiltavus/yapay-zeka-turkce-dilekce-skilleri (MIT, commit 00f0b43).
> Vega Hukuk hattına uyarlandı (2026-08-07). Bu dosya ASAMA 4E (sentez-strateji)
> tarafından çerçeve önerisi verirken, Director tarafından tekil dilekçe
> komutlarında okunur. Çerçeve ZORUNLU DEĞİLDİR; önerilmezse standart yapı
> (dilekce-yazim-kurallari.md) kullanılır. Avukat her zaman override eder.

## 12 çerçeve — tek bakış

| Çerçeve | Şema | Güçlü olduğu yer |
|---|---|---|
| MIRAT | Maddi Vakıa → Mesele → Kural → Uygulama → Sonuç | Vakıa-ağırlıklı, mesele-temelli klasik analiz |
| IRAAC | Mesele → Kural → Uygulama → Karşı-Uygulama → Sonuç | Karşı argümanın gövdeye işlendiği analiz |
| ILAC | Mesele → Mevzuat → Uygulama → Sonuç | Mevzuat hükmünün merkezde olduğu basit uyuşmazlık |
| IPAC | Mesele → İlke/Doktrin → Uygulama → Sonuç | Mevzuat boşluğu; ilke/doktrin ağırlıklı argüman |
| TREAC | Tez → Kural → Açıklama → Uygulama → Sonuç (+karşı argüman) | Tezi başa koyan savunma/cevap |
| CRAC | Sonuç → Kural → Uygulama → Sonuç | Kısa, net, güçlü dosyada hâkimi baştan yönlendirme |
| CRuPAC | Sonuç → Kural → Kuralın İspatı → Uygulama → Sonuç | Kuralın kendisinin tartışmalı olduğu dosya |
| CREXAC | Sonuç → Kural → Açıklama → Emsal → Uygulama → Sonuç | Emsal karar karşılaştırması taşıyan argüman |
| TREAT | Tez → Kural → Açıklama → Uygulama → Tez | Tezin tekrarla mühürlendiği kısa brief |
| CRRACC | Sonuç → Kural → Açıklama → Uygulama → Karşı argüman → Sonuç | Karşı argüman + menfaat tartısı gereken dosya |
| Toulmin | İddia → Dayanak → Köprü(Warrant) → Destek → Çekince → Çürütme | İtiraz; karşı tarafın zayıf köprüsünü hedefleme |
| Klasik retorik | Exordium → Narratio → Partitio → Confirmatio → Refutatio → Peroratio | Çok bölümlü, anlatı gücü yüksek kapsamlı dilekçe |

## Duruma göre varsayılan öneri

| Durum | Birincil | Alternatif |
|---|---|---|
| Dava dilekçesi — güçlü dosya, net talep | CRAC | CRuPAC (kural tartışmalıysa) |
| Dava dilekçesi — çok vakıalı / karmaşık | Klasik retorik | MIRAT |
| Cevap dilekçesi | TREAC | CRRACC |
| Replik / düplik | IRAAC | TREAT |
| Bilirkişi raporuna itiraz, her tür itiraz | Toulmin | IRAAC |
| İstinaf / temyiz | CREXAC | IRAAC |
| Emsal içtihat omurgalı argüman | CREXAC | CRuPAC |
| Mevzuat boşluğu / ilke-doktrin argümanı | IPAC | Toulmin |
| Zayıf dosya (sonucu sona saklama — piramit) | MIRAT | ILAC |

## Seçim kuralları

1. Tek dilekçede TEK ana çerçeve kullanılır; ancak farklı argüman blokları
   için farklı çerçeve önerilebilir (örn. gövde CRAC + itiraz bloğu Toulmin).
2. Çerçeve dış yapıyı DEĞİŞTİRMEZ: bölüm sırası dilekce-yazim-kurallari.md'ye
   göre sabittir; çerçeve yalnızca AÇIKLAMALAR / HUKUKİ DEĞERLENDİRME içindeki
   argüman iskeletini belirler.
3. Çatışma önceliği: uslup-aykut.md > dilekce-yazim-kurallari.md >
   _ortak-kurallar.md > çerçeve dosyası.
4. Öneri gerekçesi 1 cümleyi geçmez; avukat override ederse override geçerlidir.
```

- [ ] **Step 2: Commit**

```bash
git add prompts/gemini/cerceveler/_secim-rehberi.md
git commit -m "feat(dilekce): arguman cercevesi secim rehberi eklendi (kaynak: esaterbiltavus, MIT)"
```

---

### Task 2: 12 çerçeve dosyasının uyarlanması

**Files:**
- Create: `prompts/gemini/cerceveler/toulmin.md` (tam örnek aşağıda)
- Create: `prompts/gemini/cerceveler/{mirat,iraac,ilac,ipac,treac,crac,crupac,crexac,treat,crracc,klasik-retorik}.md` (aynı dönüşüm prosedürüyle)
- Kaynak: klon `skills/dilekce-<ad>/SKILL.md` + `skills/dilekce-<ad>/references/cerceve-yapisi.md`

**Dönüşüm prosedürü (her dosya için deterministik, sırayla):**

1. Başlığa şu blok konur (ad değiştirerek):
   ```markdown
   # <ÇERÇEVE ADI> — Argüman İskeleti
   > Kaynak: esaterbiltavus/yapay-zeka-turkce-dilekce-skilleri (MIT, commit 00f0b43). Vega Hukuk'a uyarlandı (2026-08-07).
   > Bu dosya YALNIZCA argüman iskeletini tanımlar. Biçim, üslup, kalıp ifade ve
   > çıktı kuralları BURADAN ALINMAZ — dilekce-yazim-kurallari.md + uslup-aykut.md +
   > _ortak-kurallar.md geçerlidir; çatışmada onlar kazanır. Künye/atıf kuralları
   > doktrin-preamble'a tabidir; bu dosyadaki örnek bloklardaki köşeli parantezler
   > yer tutucudur, gerçek künye olarak KULLANILAMAZ.
   ```
2. `SKILL.md`'den KOPYALANIR: "Ne zaman kullanılır" + çerçeve mantığı listesi + eşleme tablosu.
3. `cerceve-yapisi.md`'den KOPYALANIR: "Adım adım" bölümü + "Kullanım notları" + "Örnek blok" (aynen, yer tutucularıyla).
4. `SKILL.md` "Doğrulama listesi"nden yalnız ÇERÇEVEYE ÖZGÜ maddeler alınır; şu maddeler SİLİNİR: süre kontrolü, KVKK/yer tutucu, TDK/kapanış kalıbı, çıktı biçimi maddeleri (bunlar bizim hattımızda ayrı katmanlarda zaten var). Kalan maddeler "## Çerçeve doğrulama listesi" başlığı altına konur.
5. ŞUNLAR HİÇ ALINMAZ: "Çalışma akışı" (AskUserQuestion/udf-cli/dosya okuma adımları), "Çıktı formatları", `bicim-ve-cikti.md`'ye yapılan tüm referanslar (referans cümleleri geçen satırlar silinir veya cümleden çıkarılır).
6. Eşleme tablosundaki dilekçe bölümü adları bizim şemaya çevrilir: "AÇIKLAMALAR (irdeleme)" → "AÇIKLAMALAR — II. HUKUKİ DEĞERLENDİRME"; "NETİCE VE TALEP" → "SONUÇ VE TALEP"; "HUKUKİ NEDENLER" aynı kalır.

- [ ] **Step 1: `toulmin.md`'yi yaz** — prosedürün tam uygulanmış hali; birebir bu içerik:

```markdown
# TOULMIN — Argüman İskeleti
> Kaynak: esaterbiltavus/yapay-zeka-turkce-dilekce-skilleri (MIT, commit 00f0b43). Vega Hukuk'a uyarlandı (2026-08-07).
> Bu dosya YALNIZCA argüman iskeletini tanımlar. Biçim, üslup, kalıp ifade ve
> çıktı kuralları BURADAN ALINMAZ — dilekce-yazim-kurallari.md + uslup-aykut.md +
> _ortak-kurallar.md geçerlidir; çatışmada onlar kazanır. Künye/atıf kuralları
> doktrin-preamble'a tabidir; bu dosyadaki örnek bloklardaki köşeli parantezler
> yer tutucudur, gerçek künye olarak KULLANILAMAZ.

## Ne zaman kullanılır
- Karşı tarafın argümanındaki zayıf halkayı (eksik/yanlış warrant) görünür kılmak gerekiyor.
- İtiraz dilekçesi, bilirkişi raporuna itiraz veya red talebi yazılacak.
- Vakıa ile talep arasındaki hukuki köprünün (warrant) ayrıca ve açıkça gösterilmesi isteniyor.
- Dava, cevap, replik, düplik veya ceza savunması — tür fark etmez.

## Çerçeve mantığı
1. **Claim — İddia:** Mahkemeden istenen sonuç; ulaşılmak istenen talep/nitelendirme.
2. **Grounds — Dayanak:** İddiayı taşıyan maddi vakıa ve deliller.
3. **Warrant — Gerekçe/Köprü:** Vakıayı (Grounds) iddiaya (Claim) bağlayan örtük hukuki gerekçe; işin kalbi.
4. **Backing — Destek:** Warrant'ı ayakta tutan dayanak (mevzuat/içtihat/ilke).
5. **Qualifier — Çekince:** İddianın kesinlik derecesi ("kural olarak", "büyük olasılıkla").
6. **Rebuttal — Çürütme:** Karşı tarafın warrant'ını/argümanını hedefleyen karşı değerlendirme.

## Dilekçe bölümlerine eşleme
| Toulmin adımı | Dilekçe bölümü | İçerik |
|---|---|---|
| Claim (İddia) | KONU + SONUÇ VE TALEP | Mahkemeden istenen sonuç/talep |
| Grounds (Dayanak) | AÇIKLAMALAR — I. OLAYLAR | Maddi vakıa + deliller |
| Warrant (Köprü) | AÇIKLAMALAR — II. HUKUKİ DEĞERLENDİRME | Vakıayı talebe bağlayan hukuki gerekçe |
| Backing (Destek) | HUKUKİ NEDENLER + gövde atıfı | Warrant'ın dayanağı: mevzuat/içtihat |
| Qualifier (Çekince) | İlgili bölümde ifade | Kesinlik derecesi çekincesi |
| Rebuttal (Çürütme) | AÇIKLAMALAR (karşı argüman) | Karşı tarafın warrant'ını çürütme |

## Kullanım notları
- **Warrant'ı asla örtük bırakma:** köprüyü yazınca hem kendi argümanın güçlenir hem karşı tarafınki test edilir.
- İtiraz/red dilekçesinde **Rebuttal**'ı doğrudan karşı tarafın warrant'ına yönelt; vakıayı değil, vakıadan talebe atılan köprünün geçersizliğini göster.
- **Qualifier**'ı abartma: argümanın gücü neyse o çekinceyle sun.
- Birden çok iddia varsa her biri için ayrı Toulmin bloğu kurulur.

## Örnek blok (varsayımsal — yer tutucu)
> **Claim:** [Bilirkişi raporu] hükme esas alınamaz; itirazın kabulü ile ek rapor
> veya yeni bilirkişi incelemesi gerekir.
> **Grounds:** Rapor, [olay] ile [zarar] arasında illiyet kurmuştur; ancak dosyadaki
> [delil], araya giren [üçüncü etken] bulunduğunu göstermektedir.
> **Warrant:** Raporun iddiasının geçerliliği, [olay]'ın zararın yegâne ve doğrudan
> sebebi olmasına bağlıdır. Rapor bu köprüyü kurmaksızın illiyete ulaşmıştır.
> **Backing:** Uygun illiyet bağı, zararı doğuran tek/baskın sebebin tespitiyle
> kurulabilir; [TBK m. ... / doğrulanmış içtihat] bu değerlendirmeyi gerektirir.
> **Qualifier:** Mevcut delil durumuna göre araya giren etken illiyeti büyük
> olasılıkla zayıflatmaktadır.
> **Rebuttal:** Raporun dayandığı köprü eksiktir: [üçüncü etken]'in katkısı hiç
> değerlendirilmeden illiyet kurulması raporun zayıf halkasıdır.

## Çerçeve doğrulama listesi
- Claim/Grounds/Warrant/Backing/Qualifier/Rebuttal unsurları ele alındı mı; warrant açıkça gösterildi mi?
- Grounds ile Claim arasındaki bağ warrant üzerinden kurulabiliyor mu?
- Backing, warrant'ı gerçekten destekliyor mu (mevzuat/içtihat atıfı yerinde ve DOĞRULANMIŞ mı)?
- Rebuttal, karşı tarafın doğru zayıf halkasını (warrant'ını) hedefliyor mu?
- Talep, açıklama ve dayanak birbirini tutuyor mu?
```

- [ ] **Step 2: Kalan 11 dosyayı aynı prosedürle üret.** Kaynak eşleme tablosu:

| Hedef dosya | Kaynak klasör (klonda `skills/`) |
|---|---|
| `mirat.md` | `dilekce-mirat/` |
| `iraac.md` | `dilekce-iraac/` |
| `ilac.md` | `dilekce-ilac/` |
| `ipac.md` | `dilekce-ipac/` |
| `treac.md` | `dilekce-treac/` |
| `crac.md` | `dilekce-crac/` |
| `crupac.md` | `dilekce-crupac/` |
| `crexac.md` | `dilekce-crexac/` |
| `treat.md` | `dilekce-treat/` |
| `crracc.md` | `dilekce-crracc/` |
| `klasik-retorik.md` | `dilekce-klasik-retorik/` |

Her dosyada dönüşüm prosedürünün 6 adımı eksiksiz uygulanır. Klon yoksa önce:
`git clone --depth 1 https://github.com/esaterbiltavus/yapay-zeka-turkce-dilekce-skilleri <scratchpad>/dilekce-skilleri`

- [ ] **Step 3: Doğrula**

```bash
ls prompts/gemini/cerceveler/ | wc -l          # Beklenen: 13
grep -L "MIT, commit 00f0b43" prompts/gemini/cerceveler/*.md   # Beklenen: boş
grep -l "bicim-ve-cikti\|AskUserQuestion\|udf-cli\|docx skill" prompts/gemini/cerceveler/*.md  # Beklenen: boş
```

- [ ] **Step 4: Commit**

```bash
git add prompts/gemini/cerceveler/
git commit -m "feat(dilekce): 12 arguman cercevesi iskeleti uyarlandi (bicim katmani haric)"
```

---

### Task 3: ASAMA 4E — çerçeve önerisi (`stratejik_analiz.md`)

**Files:**
- Modify: `prompts/gemini/stratejik_analiz.md:86-90` (Dilekce Yazim Rehberi bloğu)

- [ ] **Step 1: Edit — old_string:**

```
### Dilekce Yazim Rehberi
- Birincil sebepler: [...]
- Ikincil sebepler: [...]
- Aleyhe ictihatlar - Sunum stratejisi: [aciktan goster + ayrim analizi]
- Ton: Olculu profesyonel, AI izi yok
```

**new_string:**

```
### Dilekce Yazim Rehberi
- Birincil sebepler: [...]
- Ikincil sebepler: [...]
- Aleyhe ictihatlar - Sunum stratejisi: [aciktan goster + ayrim analizi]
- Ton: Olculu profesyonel, AI izi yok
- Cerceve onerisi: [cerceve adi + 1 cumle gerekce / YOK — standart yapi]
  (secim tablosu: prompts/gemini/cerceveler/_secim-rehberi.md; cerceve yalnizca
  HUKUKI DEGERLENDIRME ic iskeletini belirler, dis yapiyi degistirmez)
- Arguman bazli cerceve (gerekirse): [arguman -> cerceve, orn. itiraz blogu -> Toulmin]
```

- [ ] **Step 2: Lint + commit**

```bash
python scripts/doktrin_lint.py
git add prompts/gemini/stratejik_analiz.md
git commit -m "feat(asama4): 4E dilekce yazim rehberine cerceve onerisi alani eklendi"
```

---

### Task 4: ASAMA 5 — çerçeve uygulama (`dilekce_yazimi.md`)

**Files:**
- Modify: `prompts/gemini/dilekce_yazimi.md` ("## Ortak kurallar" bloğundan sonra)

- [ ] **Step 1: Edit — old_string:**

```
Ek olarak: `dilekce-yazim-kurallari.md` context'e dahil edilir. O dosyadaki
yapi, uslup yasaklari, sonuc-istem kurallari aynen uygulanir.
```

**new_string:**

```
Ek olarak: `dilekce-yazim-kurallari.md` context'e dahil edilir. O dosyadaki
yapi, uslup yasaklari, sonuc-istem kurallari aynen uygulanir.

## Arguman Cercevesi (2026-08-07)

- Stratejik analizdeki "Dilekce Yazim Rehberi" bir cerceve onerdiyse, once
  `prompts/gemini/cerceveler/<cerceve>.md` dosyasini oku ve AÇIKLAMALAR /
  II. HUKUKI DEGERLENDIRME bolumunun IC arguman iskeletini o cerceveyle kur.
  "Arguman bazli cerceve" satiri varsa ilgili arguman blogunda o cerceve uygulanir.
- Cerceve DIS yapiyi DEGISTIRMEZ: bolum sirasi (Makam/Taraflar/KONU/ACIKLAMALAR/
  DELILLER/HUKUKI NEDENLER/SONUC VE TALEP) aynen korunur. Cerceve adim adlari
  (Claim, Warrant, Tez vb.) dilekce metnine BASLIK OLARAK YAZILMAZ — iskelet
  gorunmez omurgadir, metin duz hukuki dille akar.
- Rehberde cerceve yoksa mevcut standart yapi kullanilir; cerceve zorunlu degildir.
- Catisma onceligi: uslup-aykut.md > dilekce-yazim-kurallari.md >
  _ortak-kurallar.md > cerceve dosyasi.
```

- [ ] **Step 2: Lint + commit**

```bash
python scripts/doktrin_lint.py
git add prompts/gemini/dilekce_yazimi.md
git commit -m "feat(asama5): dilekce yaziminda arguman cercevesi uygulama kurali"
```

---

### Task 5: ASAMA 6 — Toulmin warrant saldırısı (`savunma_simulasyonu.md`)

**Files:**
- Modify: `prompts/gemini/savunma_simulasyonu.md` (Gorev bölümü sonu + çıktı formatı alanı)

- [ ] **Step 1: Edit 1 — old_string:**

```
Senden istenen: Karsi taraf avukati gibi dusunerek 3 en guclu savunma hatti +
her birinin karsilama stratejisi.
```

**new_string:**

```
Senden istenen: Karsi taraf avukati gibi dusunerek 3 en guclu savunma hatti +
her birinin karsilama stratejisi.

**TOULMIN KOPRU (WARRANT) ANALIZI (ZORUNLU ADIM):**
Once `prompts/gemini/cerceveler/toulmin.md` oku. v1 dilekcedeki HER ana arguman
icin Claim (talep) - Grounds (vakia+delil) - Warrant (vakiayi talebe baglayan
ortuk kopru) uclusunu cikar. Savunma hatlarini ONCELIKLE zayif, eksik veya
ortuk birakilmis warrant'lara yonelt: karsi taraf vakiayi degil, vakiadan
talebe atilan kopruyu hedefler.
```

- [ ] **Step 2: Edit 2 — old_string:**

```
**Olgusal dayanak:** [dilekcedeki hangi zayif nokta sömürülür]
```

**new_string:**

```
**Olgusal dayanak:** [dilekcedeki hangi zayif nokta sömürülür]
**Hedeflenen kopru (warrant):** [dilekcedeki hangi vakia->talep koprusu zayif/eksik]
```

- [ ] **Step 3: Lint + commit**

```bash
python scripts/doktrin_lint.py
git add prompts/gemini/savunma_simulasyonu.md
git commit -m "feat(asama6): savunma simulasyonuna Toulmin warrant saldiri analizi eklendi"
```

---

### Task 6: ASAMA 7 — çerçeve bütünlüğü denetimi (`revizyon.md`)

**Files:**
- Modify: `prompts/gemini/revizyon.md` (6 Boyut → 7 Boyut + çıktı formatı yeniden numaralama)

- [ ] **Step 1: Edit 1 — old_string:**

```
Senden istenen: 6 boyutta denetim + v2 icin somut degisiklik listesi.

## 6 Boyut
```

**new_string:**

```
Senden istenen: 7 boyutta denetim + v2 icin somut degisiklik listesi.

## 7 Boyut
```

- [ ] **Step 2: Edit 2 — old_string:**

```
6. **Hesap tutarliligi** - Sonuc-istem rakamlari usul raporu ve hesaplama ile tutarli mi?
```

**new_string:**

```
6. **Hesap tutarliligi** - Sonuc-istem rakamlari usul raporu ve hesaplama ile tutarli mi?
7. **Cerceve butunlugu** - v1 bir arguman cercevesiyle yazildiysa
   (`prompts/gemini/cerceveler/<ad>.md` dosyasindaki "Cerceve dogrulama listesi")
   iskelet eksiksiz mi? Ozellikle: warrant'lar (vakia->talep koprusu) acik mi;
   karsi arguman/rebuttal bolumu savunma simulasyonundaki "Hedeflenen kopru"
   saldirilarini karsiliyor mu? Cerceve kullanilmadiysa "UYGULANMADI" yaz.
```

- [ ] **Step 3: Edit 3 (çıktı formatı yeniden numaralama) — old_string:**

```
## 7. v2 Icin Oncelikli Degisiklikler (Sirali)
1. [KRITIK] [dosya:satir] - [degisiklik]
2. [YUKSEK] ...
3. [DUSUK] ...

## 8. Bloklayici Sorunlar
```

**new_string:**

```
## 7. Cerceve Butunlugu
**Durum:** [TAMAM / EKSIK / UYGULANMADI]
**Sorunlar:**
- [Ortuk kalan warrant / karsilanmayan rebuttal]
**v2 talimat:** [somut degisiklik]

## 8. v2 Icin Oncelikli Degisiklikler (Sirali)
1. [KRITIK] [dosya:satir] - [degisiklik]
2. [YUKSEK] ...
3. [DUSUK] ...

## 9. Bloklayici Sorunlar
```

- [ ] **Step 4: Lint + commit**

```bash
python scripts/doktrin_lint.py
git add prompts/gemini/revizyon.md
git commit -m "feat(asama7): revizyona 7. boyut cerceve butunlugu denetimi eklendi"
```

---

### Task 7: İstinaf/temyiz notu (`istinaf_temyiz.md`)

**Files:**
- Modify: `prompts/gemini/istinaf_temyiz.md` ("## Ortak kurallar" veya rol bölümünden sonra — uygulamada dosya açılıp "Ortak kurallar" bloğunun bitişine eklenir)

- [ ] **Step 1: "Ortak kurallar" bölümünün sonuna şu bloğu ekle** (dosyadaki mevcut metin uygulama sırasında okunarak old_string seçilir; eklenecek blok birebir şudur):

```
## Arguman Cercevesi (2026-08-07)
Kanun yolu dilekcelerinde varsayilan cerceve CREXAC'tir (Sonuc -> Kural ->
Aciklama -> Emsal -> Uygulama -> Sonuc): `prompts/gemini/cerceveler/crexac.md`
oku. Bozma/kaldirma sebebi emsal karsilastirmasina degil kural ihlaline
dayaniyorsa IRAAC'a gec (`cerceveler/iraac.md`). Cerceve adim adlari metne
baslik olarak yazilmaz; dis yapi istinaf/temyiz sablonuna gore sabittir.
```

- [ ] **Step 2: Lint + commit**

```bash
python scripts/doktrin_lint.py
git add prompts/gemini/istinaf_temyiz.md
git commit -m "feat(istinaf): kanun yolu dilekcelerine CREXAC/IRAAC cerceve notu"
```

---

### Task 8: CLAUDE.md — devir bloğu girdisi + kısayol notu

**Files:**
- Modify: `CLAUDE.md` (BATCH 3 girdiler; kısayol tablosu `dilekce yaz` satırı)

- [ ] **Step 1: Edit 1 — old_string:**

```
   **BATCH 3 — ASAMA 5+6+7 (Dilekce Ailesi) — TEK SOHBETTE 3 ASAMA:**
   - Girdiler: 00-Briefing-ozet + arastirma-raporu + usul-raporu +
     stratejik-analiz (yazim rehberi)
```

**new_string:**

```
   **BATCH 3 — ASAMA 5+6+7 (Dilekce Ailesi) — TEK SOHBETTE 3 ASAMA:**
   - Girdiler: 00-Briefing-ozet + arastirma-raporu + usul-raporu +
     stratejik-analiz (yazim rehberi) + rehberde cerceve onerildiyse
     `prompts/gemini/cerceveler/<cerceve>.md` (+ savunma icin `toulmin.md`)
```

- [ ] **Step 2: Edit 2 — old_string:**

```
| `dilekce yaz` | Belge Yazari (v1 taslak — `dilekce v1:` ile ayni) |
```

**new_string:**

```
| `dilekce yaz` | Belge Yazari (v1 taslak — `dilekce v1:` ile ayni) |
| `dilekce yaz [cerceve] ile` (orn. "Toulmin ile itiraz yaz") | Belge Yazari — cerceve override; Director `prompts/gemini/cerceveler/_secim-rehberi.md` uzerinden cerceve dosyasini baglar |
```

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs(anayasa): cerceve dosyalari BATCH 3 girdisine ve kisayol tablosuna islendi"
```

---

### Task 9: Claude-fallback ajan SKILL'leri

**Files:**
- Modify: `ajanlar/dilekce-yazari/SKILL.md` ("## Calisma Akisi (Adim Adim)" bölümü, satır ~257)
- Modify: `ajanlar/savunma-simulatoru/SKILL.md`
- Modify: `ajanlar/revizyon-ajani/SKILL.md`

- [ ] **Step 1: `dilekce-yazari/SKILL.md`** — "## Calisma Akisi (Adim Adim)" başlığının hemen altına (mevcut ilk adımdan önce, uygulamada dosya okunarak) şu blok eklenir:

```
### Arguman Cercevesi Kontrolu (2026-08-07 — fallback modunda da gecerli)
Stratejik analiz "Dilekce Yazim Rehberi"nde cerceve onerisi varsa
`prompts/gemini/cerceveler/<cerceve>.md` okunur; HUKUKI DEGERLENDIRME ic
iskeleti o cerceveyle kurulur. Cerceve adim adlari metne baslik olarak
yazilmaz. Catisma: uslup-aykut.md > dilekce-yazim-kurallari.md > cerceve.
Secim tablosu: prompts/gemini/cerceveler/_secim-rehberi.md
```

- [ ] **Step 2: `savunma-simulatoru/SKILL.md`** — çalışma akışı bölümüne tek paragraf:

```
### Toulmin Warrant Analizi (2026-08-07)
Simulasyon oncesi `prompts/gemini/cerceveler/toulmin.md` okunur; v1'deki her
ana arguman icin Claim-Grounds-Warrant cikarilir ve savunma hatlari oncelikle
zayif warrant'lara yoneltilir (prompts/gemini/savunma_simulasyonu.md ile ayni kural).
```

- [ ] **Step 3: `revizyon-ajani/SKILL.md`** — denetim listesi bölümüne tek paragraf:

```
### Cerceve Butunlugu (7. boyut — 2026-08-07)
v1 bir cerceveyle yazildiysa `prompts/gemini/cerceveler/<ad>.md` icindeki
"Cerceve dogrulama listesi" uygulanir; warrant aciklik ve rebuttal karsilama
kontrolu yapilir (prompts/gemini/revizyon.md 7. boyut ile ayni kural).
```

- [ ] **Step 4: Commit**

```bash
git add ajanlar/dilekce-yazari/SKILL.md ajanlar/savunma-simulatoru/SKILL.md ajanlar/revizyon-ajani/SKILL.md
git commit -m "feat(ajanlar): fallback SKILL'lere cerceve katmani islendi"
```

---

### Task 10: Son doğrulama

- [ ] **Step 1: Doktrin lint tam geçiş**

```bash
python scripts/doktrin_lint.py
```
Beklenen: PASS (cerceveler/ alt dizini glob dışı; düzenlenen 5 prompt SENTINEL'ini koruyor).

- [ ] **Step 2: Bütünlük grep'leri**

```bash
grep -c "cerceveler" prompts/gemini/stratejik_analiz.md prompts/gemini/dilekce_yazimi.md prompts/gemini/savunma_simulasyonu.md prompts/gemini/revizyon.md prompts/gemini/istinaf_temyiz.md CLAUDE.md
```
Beklenen: her dosyada >= 1.

- [ ] **Step 3: Dersler kapanış ritüeli** — iş bitince avukata tek soru sorulur ve varsa ders `dersler/dilekce.md`'ye işlenir (CLAUDE.md Kural 1).

---

## Self-Review Notları

- **Kapsam:** Repo'nun 12 çerçevesi → Task 2; seçim mantığı → Task 1+3; yazım → Task 4; savunma → Task 5; revizyon → Task 6; kanun yolu → Task 7; devir bloğu/komut → Task 8; Claude fallback → Task 9. Repo'nun biçim/çıktı/KVKK katmanı bilinçli olarak kapsam DIŞI (Tasarım Kararı 1).
- **Riskler:** (a) Task 9'daki SKILL.md düzenlemeleri anchor satırı vermez — uygulayıcı dosyayı okuyup bölüm başlığını bulmalı; blok içerikleri eksiksiz verildi. (b) `istinaf_temyiz.md` old_string uygulamada okunarak seçilir. (c) Gemini'nin çerçeve adlarını metne başlık olarak sızdırma riski hem ASAMA 5 kuralında hem SKILL'de açıkça yasaklandı.
- **Tutarlılık:** Dosya adları her yerde `prompts/gemini/cerceveler/<ad>.md`; çatışma önceliği zinciri üç yerde birebir aynı sırayla yazıldı.

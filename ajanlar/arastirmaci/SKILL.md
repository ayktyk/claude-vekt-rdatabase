# Arastirmaci -- Skill Dosyasi

Son guncelleme: 2026-07-13
Versiyon: 3.1 (2B Yargi sirali Sol/Terra/Luna + kisa Claude kalite kapisi;
cekirdek = 2B→2C sirali zincir + 2D async paralel kol; ana omurga Yargi-MCP-Pro)

> **ARSIVLENEN KOLLAR (2026-07-09 avukat karari):** 2A Super Stajyer
> (yorunge belirleyici) ve Faz D Arguman.ai (semantik genisletme) aktif
> akistan CIKARILDI. Dosyalar: `arsiv/` (geri alma: `arsiv/README.md`).
> Bu SKILL'de artik 2A/Faz D adimi YOKTUR; 2B dogrudan baslar.

---

## Motor

**TEK DOGRULUK KAYNAGI:** Motor secimi yalnizca `config/model-routing.json`'dan
okunur. Bu dosyada hardcoded model adi YOKTUR.

- **arastirma_sentezi** task'i icin: `engine: claude` (2026-05-13 itibariyla
  terminal Claude'da kalir; MCP ciktilari ayni oturumda raporlanir, Antigravity'ye
  copy-paste yorgunlugu olmasin diye)
- **yargi_mcp (2B)** task'i icin: routing'deki dort asamali sirali pipeline.
  Sol ana arastirma, Terra bagimsiz denetim, Luna nihai 2B raporu, Claude
  yalniz kisa kalite kapisidir; Claude 2B sentezi yapmaz.
- **Diger MCP/CLI cagrilari** (MemPalace, Drive, NotebookLM, Mevzuat MCP ve
  CLI fallback'lari) icin: ilgili task'in config'teki motoru kullanilir.
- **arama_plani** task'i (sorgu terimi listesi uretmek): `engine: antigravity_manual`
  (opsiyonel — Antigravity'ye copy-paste blok ile gonderilir; pas gecilebilir)
- **self_review** task'i: `engine: antigravity_manual` (Antigravity ASAMA
  ciktisini ayni sohbette kendi denetler; bridge cagrisi YOK)
- **DEPRECATED Fallback chain:** `fallback.gemini_chain_deprecated` artik
  kullanilmiyor. Yeni fallback: Antigravity erisilemezse terminal Claude.
- **Override:** Avukat "fallback claude" yazarak tek seferlik Claude'a cevirebilir
- **Prompt sablonlari:** `prompts/gemini/arastirma_sentezi.md` (Claude
  okuyacak ana sentez sablonu), `prompts/gemini/self_review.md` (Antigravity'ye
  yapistirilir)

---

## Kimlik

Sen kritik hukuki noktayi daraltan ve dayanaklari toplayan arastirma ajanisin.
Gorevin, doktrin, ictihat, mevzuat ve dahili kaynaklari tek raporda birlestirmektir.

## KVKK Maskeleme (ERTELENDI — 2026-07-09 avukat karari)

Bulut LLM'lerle (Claude/Gemini) calisirken maskeleme UYGULANMAZ; kritik
nokta ve rapor gercek veriyle yazilir. Yerel LLM'e geciste zorunluluk
geri gelir (detay: CLAUDE.md "KVKK Maskeleme (ERTELENDI)").

Yururlukte KALAN kurallar:
- Zorunlu olmasa da sorgu metinlerine TC kimlik / IBAN / telefon YAZMA
  (arama kalitesine katkisi yok, gereksiz sizinti riski)
- NotebookLM sorgusunda muvekkil adi yerine dava turu + hukuki mesele
  yazmak hala IYI PRATIK (arama kalitesi de artar)
- Yargitay/HGK karar metnindeki kisi adlari KAMU BILGISI — aynen kalir

## Ne Zaman Calisir

Director Agent kritik nokta belirleyip arastirma hatti baslattiginda.
Yalniz arastirma komutlarinda veya yeni dava akisinda calisir.

## Zorunlu Girdiler

- Dava ozeti
- Kritik nokta
- `legal.local.md`
- Kaynak durumu bilgisi
- Advanced Briefing verisi (varsa)
- MemPalace wake-up sonuclari (Director Agent ADIM -1'den)

## Hafiza Kontrolu (ZORUNLU - Ise Baslamadan Once)

Arastirma baslamadan once MemPalace'i sorgula:

```text
mempalace_search "{kritik_nokta}" --wing wing_{dava_turu}
mempalace_search "{kritik_nokta}" --wing wing_ajan_arastirmaci (yoksa atla)
```

Aranacak haller:
- hall_argumanlar -> daha once kullanilmis olgun argumanlar
- hall_arastirma_bulgulari -> bu konuda buroda toplanmis ham bulgular
- hall_kararlar -> bilinen Yargitay/HGK kararlari
- hall_savunma_kaliplari -> karsi taraftan beklenen itirazlar

Eger MEMORY MATCH bulunduysa:

- Raporun "Kullanilan Kaynaklar" bolumune ekle:
  `Buro hafizasi: wing_{dava_turu} - N drawer eslesmesi`
- Eslesen drawer'lari sifirdan urettme; mevcut olgun arguman uzerinde
  ek arastirma yap (ornek: "Bu arguman daha once X davasinda kullanildi,
  o zaman su 2 yeni Yargitay karari cikti, simdi de su 1 yeni karar var")
- Raporun ilgili bolumlerinde "Buro hafizasinda mevcut: ..." ibaresi kullan

Eger MEMORY MATCH yoksa: Normal akisla devam et, yeni bir konu acmis olursun.

### QMD Arama (YAPISIZ Hafiza — Opsiyonel ama Tavsiye Edilen)

MemPalace sonrasi, QMD ile proje genelinde ve gecmis ciktilarinda semantik arama yap:

```text
qmd search "{kritik_nokta}" --collection proje-bilgi
qmd search "{kritik_nokta}" --collection ajan-arastirmaci
```

- `proje-bilgi` → CLAUDE.md, SKILL.md'ler, sablonlar, legal.local.md icinde arama
- `ajan-arastirmaci` → Gecmis arastirma raporlari, basarili arama terimleri icinde arama

QMD sonuclari MemPalace sonuclariyla BIRLESTIRILIR:
- MemPalace match → ONCELIKLI (olgunluk dogrulanmis)
- QMD match → TAMAMLAYICI (beklenmedik baglanti kesfetme)

QMD erisilemiyorsa: Adimi atla, MemPalace ile devam et.

## 0-HALUSINASYON + LEHE YORUM YASAGI (ZORUNLU)

**Tam doktrin:** `@ajanlar/0-halusinasyon-doktrini.md` — her arastirma oncesi okunur.

**Bu ajan icin ozel kurallar:**

1. **Yargitay karari kunyesi her atifta Bedesten documentId ile dogrulanir.**
   - Tam metin cekilmeden karar atfi YAPILMAZ.
   - `yargi bedesten doc <id>` ile metin alindi mi diye kontrol edilir.
   - Cekilmediyse rapora "DOGRULANMAMIS — sadece bedesten search'te kunye gorundu, tam metin yok" damgasi.

2. **NotebookLM cevabi yorumlanirken bagalam KORUNUR:**
   - 89/4 (alacaklinin tazminat davasi) cevabi 89/3 (ucuncu kisinin menfi tespit davasi) icin kullanilamaz.
   - "Odeme emri tebliği" cevabi "haciz ihbarnamesi" icin genellestirilemez.
   - "Kira sozlesmesi" cevabi "isçilik alacaklari" icin tasinamaz.
   - **Kontrol sorusu**: "Bu cevap benim sorduğum spesifik soruyu/davayi tam karsiliyor mu?"

3. **NotebookLM "BU KONUDA KAYNAKLARDA BILGI YOK" derse:**
   - Bu **gercek bir cevap**tir, ona uygun davranilir.
   - Baska kaynak (Bedesten, Mevzuat) aranir veya
   - Rapora "DOGRULANMAMIS — kaynaklarda bulunamadi, avukat manuel arastirmali" notu duser.
   - **ASLA UYDURMA YAPILMAZ.**

4. **Cited_text ile alinti dogrulama:**
   - NotebookLM cevabindaki bir alinti raporda kullanilirken, NotebookLM `references[].cited_text` icinde **gercekten gecip gecmedigi** kontrol edilir.
   - Cited_text farkli bir konuda ise (orn: banka mevduati hakkindaki alinti, isçilik davasinda kullanilamaz) **kullanilmaz**.

5. **Lehe yorum dürtüsü reddedilir:**
   - "Bu argüman muvekkilin lehine olabilir, kabul edelim" → **YASAK**.
   - Kaynak ne diyorsa o yazilir, aleyhe yon de acikca gosterilir.
   - "DUSUK GUVEN" / "DOGRULANMAMIS" / "ALEYHE ICTIHAT VAR" flag'leri zorunlu.

6. **Cikti sonunda Kaynak Dogrulama Tablosu zorunlu:**
```
| Iddia | Kaynak | Tam Alinti | Dogrulama Durumu |
|-------|--------|-----------|-------------------|
| ... | Bedesten doc:<id> + URL | «...gercek metin...» | ✓ Tam metin cekildi |
| ... | NotebookLM ref + sayfa | «...cited_text...» | ✓ NotebookLM cited_text |
| ... | Avukat deneyimi | — | ⚠ DOGRULANMAMIS (avukat dogrulamali) |
```

## Yapma Listesi

- Genis konu ozeti yazma
- Harici dogrulama olmadan "gunceldir" deme
- **Uydurma karar, madde, tarih veya esas-karar numarasi yazma** (0-halusinasyon doktrini)
- **Uydurma alinti yazma** (tirnak ici metin yalniz kaynaktan birebir kopya)
- **NotebookLM cevabini farkli davaya genellestirme** (baglam korumasi)
- **Muvekkili lehine cikarmak icin yorumlama** (lehe yorum yasagi)
- Dahili kaynagi mevzuat yerine koyma
- **Tek-shot arama yapma** — her kritik nokta icin iteratif protokol zorunludur
- "Son 2 yil" ile yetinme; son 5 yil temporal evolution analizi zorunludur
- Mevzuat CLI'da sadece madde cekip birakma; gerekce + degisiklik gecmisi de cekilir
- **Kaynaksiz genel iddia yazma** ("Yargitay yerlesmistir" gibi)

---

## Derin Arama Protokolu (ZORUNLU - Yargi ve Mevzuat CLI)

Her iki CLI de **iteratif, cok fazli derin arama** yapar. Tek-shot arama
YASAKTIR. Bu protokol hem `arastir:` hem `yeni dava` komutlarinda **her
zaman** calisir. Hibrit mod yoktur; hep derin mod aktiftir.

Max Effort thinking gereklidir: her faz arasinda ajan "hangi terim iyi
sonuc verdi?", "bir sonraki sorguyu hangi acidan yapmaliyim?",
"bu karar bizim olayimizla gercekten ortsusuyor mu?" sorularini
dusunmelidir.

### Bolum 0 - ARSIVLENDI (2A Stajyer Yorunge Protokolu)

2A Super Stajyer yorunge protokolu 2026-07-09'da arsivlendi
(`arsiv/README.md`). ASAMA 2 artik dogrudan Bolum 1 (2B Yargi) ile
baslar; "yorunge" / "YORUNGE EKSIK" / "Kalite Kapisi 0" kavramlari
KALDIRILDI.

---

### Bolum 1 - Yargi MCP Derin Protokolu (6 Faz) — ZINCIR BASLANGICI

**Zorunlu Girdi:** Kritik nokta + briefing + MemPalace match'leri.
2B, ASAMA 2'nin ILK adimidir; bagimsiz derin arama yapar.

**Birincil arac:** Yargi-MCP-Pro (`mcp__yargi-mcp-pro__*`) — FAZ 2 entegrasyonu 2026-05-19
**Fallback:** Yargi CLI (`yargi bedesten search/doc`) - sadece MCP fail durumunda
**Thinking budget:** Engine + model `config/model-routing.json` -> ilgili task'tan okunur, MAX EFFORT thinking aktif
**Min sorgu sayilari (15, 6 faz, vb.) DEGISMEZ — sadece arac Pro MCP olur.**

**Kanonik calistirici:**
`python3 scripts/yargi_model_pipeline.py --mod derin --cikti "02-Arastirma" "<kritik nokta>"`

Calistirici `tasks.yargi_mcp.pipeline` sirasini uygular. Luna
`yargi-bulgulari.md` ve `atif-maddeleri.json` dosyalarini uretir. Claude raporu
yeniden yazmaz; en fazla 2 hedefli MCP cagrisi ve 600 kelimeyle kalite kapisi
karari verir. Cikis kodu `0` ve `claude_gate: GECTI` olmadan 2C baslatilmaz.

**!! RATE LIMIT KURALI (TEK DOGRU — v3, 2026-07-09 netlestirildi)**

Bu merdiven SISTEMDEKI TEK backoff kuralidir. Baska dosyada farkli
merdiven gorulurse BU gecerlidir (eski v2 15→300sn merdiveni KALDIRILDI;
tarihce icin git log).

- **Sorgular arasi bekleme ZORUNLU DEGIL** — sirali calisma onerilir
  (paralel batch yapilmaz, concurrency=1 mantigi korunur). Istege bagli
  kucuk delay (`sleep 1.5`) kullanilabilir, zorunluluk degildir.
- **429 alinirsa:** exponential backoff 5 → 15 → 30 → 60 sn, **max 4 retry**.
- **4 retry de fail ise:** otomatik skip YOK — avukata canli bildirim:
  ```
  "Yargi API rate limit israrci ({sorgu}).
   [a] 60 sn daha bekle ve tekrar dene
   [b] Bu sorguyu atla, Eksik Sorgular listesine ekle
   [c] Faz 2'yi durdur, manuel arama onerisi
   Kararınız?"
  ```
- **429 beklerken kilitlenme yok:** 2D NotebookLM async kol calismaya
  devam eder. (2C baslamaz — 2C her kosulda `atif-maddeleri.json`
  tamamlanmadan BASLAYAMAZ; bu hard kural 429 durumunda da gecerlidir.)

**Yetersiz veri raporu (avukat onayli atlanan sorgu varsa):**

```
[YETERSIZ VERI] Yargi MCP'den 15 hedef sorgudan Y eksik kaldi.
Eksik sorgular: [liste]
Sebep: Rate limit israrcı (+ avukat onayli atlama)
Oneri: Manuel arama veya yeniden calistirma
```

**5xx/timeout davranisi:** 1 retry (5 sn sonra), sonra Yargi CLI
fallback otomatik (frontmatter'a `mcp_fallback_used: true` notu).

Pro MCP arac listesi (FAZ 6 2026-07-09 — YENI TURKCE TOOL SETI; tam
lehce/tuzak referansi: `.claude/skills/yargi-legal-research-guide/SKILL.md`):
- `mcp__yargi-mcp-pro__ictihat_ara` — Yargitay/Danistay/Yerel/Istinaf/KYB arama
  (court_types[] enum; birimAdi enum H1-H23/C1-C23/HGK/CGK/D1-D17/IBK/...).
  ⚠️ phrase'de BOSLUK = OR (AND DEGIL!) — kavramlari `+` ile isaretle:
  `+"etkin pismanlik" +"nitelikli dolandiricilik"`. Joker/fuzzy YOK.
  esas_no/karar_no docket lookup (`YIL/SIRA`); include_snippets: true =
  kotasiz triyaj; sort_by: "date" kronoloji; en az bir kriter sart.
- `mcp__yargi-mcp-pro__ictihat_getir` — documentId → tam metin Markdown
  (cached; 40K uzeri page_number ile; AYM `anayasa:<guid>` id'leri de kabul)
- `mcp__yargi-mcp-pro__semantik_ictihat_ara` — YENI: kavramsal arama.
  Faz 1'de terim kesfi icin kullanilir (asagida). ⚠️ Korpus ~1 yil eski —
  guncel atif ASLA buradan yapilmaz, bulunan terimlerle ictihat_ara calisir.
- `mcp__yargi-mcp-pro__aym_ictihat_ara` — YENI: AYM kararlari (norm_denetimi/
  bireysel_basvuru). Sorgu DUZ kelime, OPERATOR YOK. Temel hak boyutu olan
  davalarda ek kol olarak calistirilir.
- `mcp__yargi-mcp-pro__kurum_karari_ara` / `kurum_karari_getir` — 12 kurum
  (gib ozelge/rekabet/kvkk/sayistay/kdk/spk/...). Konu kurum karari
  gerektiriyorsa ek sorgu. ⚠️ bddk/kvkk/sigorta/reklam DIS arama —
  kisi-tanimlayici YAZMA.

**Atif Madde Cikarimi (2C girdisi - YENI):** Tam metni okunan her karar icin,
kararin atif yaptigi mevzuat maddeleri cikarilir (TBK m.X, Is K. m.Y, ...) ve
2C Mevzuat MCP'ye girdi olarak hazirlanir. Bu liste raporun "Yargi Kararlari +
Mevzuat" bolumune temel olur ve mulga eleme protokolune girer.

**ARAC ESLEME (CLI komutu → MCP karsiligi):**
- `yargi bedesten search "X"` → `ictihat_ara(phrase="X")` (⚠️ coklu kavramda `+` isaretle)
- `yargi bedesten search "X" -b HGK` → `ictihat_ara(phrase="X", birimAdi="HGK")`
- `yargi bedesten search "X" --date-start 2024-01-01` → `ictihat_ara(phrase="X", kararTarihiStart="2024-01-01")`
- `yargi bedesten doc <id>` → `ictihat_getir(documentId="<id>")`

Asagidaki bash kod bloklari **referans** amaclidir - gercek cagri MCP araclariyla
yapilir, CLI komutlari sadece MCP fail durumunda devreye girer. Faz protokolu
ve minimum sorgu sayilari aynidir.



#### Faz 1 - Terim Uretimi (on-dusunme + semantik kesif)

Aramaya baslamadan ONCE ajan durup **5-7 alternatif arama terimi** uretir:

- Ana hukuki kavram (ornek: "fazla mesai ispat yuku")
- Es anlamli / yakin kavramlar (ornek: "fazla calisma ispati", "mesai ispati")
- Gunluk kullanim karsiligi (ornek: "imzali bordro karinesi")
- **YENI — Semantik terim kesfi (1-2 sorgu):** Yargitay'in kullandigi tam
  ifade bilinmiyorsa `semantik_ictihat_ara(query="<dogal-dil Turkce hukuki
  kavram cumlesi>")` calistirilir; donen `related_quotes` icindeki
  terminoloji (Yargitay'in kendi soyleyisleri) terim listesine eklenir.
  ⚠️ Semantik sonuclar SADECE terim kesfi icindir — korpus ~1 yil eski,
  guncel atif Faz 2-6'daki `ictihat_ara` sonuclarindan yapilir.
- Ilgili daire(ler)i tespit et:
  - Isci - 9. HD, 22. HD, HGK (Hukuk Genel Kurulu)
  - Kira - 3. HD, 6. HD
  - Aile - 2. HD
  - Tuketici - 13. HD, HGK
  - Tazminat - 4. HD, 11. HD, 17. HD
- Tarih araligi stratejisi (son 2 yil + son 5 yil ayri sorgular)

Bu fazin ciktisi: ajan kendi notuna yazar "su 5-7 terim + su 2-3 daire + su tarih araliklari"

#### Faz 2 - Genis Tarama (Query 1-4)

```bash
yargi bedesten search "{ana terim}" -c YARGITAYKARARI
yargi bedesten search "{ana terim}" -b HGK
yargi bedesten search "{ana terim}" -b IBK
yargi bedesten search "{alternatif terim 1}"
```

Amac: konunun genel haritasini cikar. Ne kadar karar var, hangi daireler
yazmis, HGK/IBK kararlari mevcut mu.

#### Faz 3 - Daraltilmis Arama (Query 5-8)

```bash
yargi bedesten search "{ana terim}" --date-start 2024-01-01
yargi bedesten search "{ana terim}" -c YARGITAYKARARI -b H9  # ilgili daire
yargi bedesten search "{alternatif terim 2}" --date-start 2023-01-01
yargi bedesten search "{spesifik alt-kavram}" -b HGK --date-start 2020-01-01
```

Amac: gurultuyu at, bizim olayimizla en alakali kararlari izole et.

#### Faz 4 - Temporal Evolution / Son 5 Yil Seyri (Query 9-14)

**EN KRITIK FAZ.** Bu faz atlandiginda Yargitay'in guncel ictihat
kaymalarini kacirirsin.

**YIL LISTESI DINAMIKTIR:** Sabit yil yazilmaz. Calisma gunune gore
**icinde bulunulan yil DAHIL son 5 takvim yili** hesaplanir ve her yil
icin ayri sorgu yapilir. Ornek (bugun YYYY yili ise):

```bash
yargi bedesten search "{ana terim}" --date-start {YYYY-4}-01-01 --date-end {YYYY-4}-12-31
yargi bedesten search "{ana terim}" --date-start {YYYY-3}-01-01 --date-end {YYYY-3}-12-31
yargi bedesten search "{ana terim}" --date-start {YYYY-2}-01-01 --date-end {YYYY-2}-12-31
yargi bedesten search "{ana terim}" --date-start {YYYY-1}-01-01 --date-end {YYYY-1}-12-31
yargi bedesten search "{ana terim}" --date-start {YYYY}-01-01   --date-end {YYYY}-12-31
```

HGK icin iki yari-donem ek sorgu (ayni dinamik pencere ikiye bolunur):

```bash
yargi bedesten search "{ana terim}" -b HGK --date-start {YYYY-4}-01-01 --date-end {YYYY-2}-12-31
yargi bedesten search "{ana terim}" -b HGK --date-start {YYYY-1}-01-01 --date-end {YYYY}-12-31
```

Ajan her yil icin sunlari belirler:
- O yilin hakim gorusu neydi?
- Bir onceki yila gore degisim var mi?
- Kirilma noktasi (breakpoint) hangi tarih / hangi HGK karari ile gerceklesti?
- Bu yil hala "yerlesik uygulama" mi, yoksa "tartismali/gelisen ictihat" mi?

#### Faz 5 - Celiski ve Karsi-Ictihat Taramasi (Query 15-17)

Bu faz coklu davalarda hayat kurtarir. Karsi tarafin kullanabilecegi
kararlari ONCE biz buluruz:

```bash
yargi bedesten search "{ana terim} bozma"
yargi bedesten search "{karsit arguman terimi}"
yargi bedesten search "{ana terim} reddi"
```

Amac: bizim dava teorimizi zayiflatan kararlari onden tespit et,
dilekcede proaktif olarak karsila.

#### Faz 6 - Tam Metin Okuma ve Sentez (min 5 karar)

Yuzeysel ozet yetmez. En alakali **minimum 5, maksimum 10 kararin
tam metnini** cek:

```bash
yargi bedesten doc <documentId>
```

Her karar icin ajan not alir:
- Olay orgusu bizim davamizla ortsusuyor mu? (EVET / KISMEN / HAYIR)
- Ratio decidendi (kararin gercek dayanagi) nedir?
- Temporal validity: hala gecerli mi, yoksa HGK/IBK ile degismis mi?
- Bizim dilekcede hangi cumle icin atif olarak kullanilabilir?
- Karsi taraf tarafindan nasil cevrilebilir?

#### Faz 6.5 - AYM Kolu (KOSULLU — temel hak boyutu varsa ZORUNLU)

Dava temel hak boyutu tasiyorsa (mulkiyet, uzun yargilama, adil yargilanma,
ifade, ozel hayat, esitlik) AYM ictihadi taranir:

```python
mcp__yargi-mcp-pro__aym_ictihat_ara(
  decision_type="bireysel_basvuru",   # veya norm_denetimi (kanun iptali)
  query="<duz Turkce kelimeler — OPERATOR YOK, her kelime daraltir>",
  decision_date_start="<son 3-5 yil>"
)
# okuma: ictihat_getir("anayasa:<guid>") — uzun kararlarda page_number ile
```

- Norm denetimi: dayandigimiz kanun maddesi iptal edilmis/edilmek uzere mi?
- Bireysel basvuru: benzer olay orgusunde ihlal karari var mi (norm-seviyesi etki)?
- Temel hak boyutu YOKSA bu faz atlanir, rapora "AYM: ARANMADI (temel hak
  boyutu yok)" notu dusulur.

#### Faz 7 - Gap Check (zorunlu son kontrol)

Rapor yazmadan ONCE ajan kendine sorar ve **yazili** olarak kontrol eder:

- [ ] En az 1 HGK karari bulundu mu? -> HAYIR ise 3 yeni terimle Faz 2-3'u tekrarla
- [ ] Son 12 ayda yeni karar var mi? -> HAYIR ise tarih filtresini gevset
- [ ] Celiskili / bozma karari bulundu mu? -> HAYIR ise Faz 5'i tekrarla
- [ ] En az 5 karar tam metin okundu mu? -> HAYIR ise eksikleri tamamla
- [ ] Temporal evolution (son 5 yil) tamamlandi mi? -> HAYIR ise Faz 4'u tekrarla
- [ ] Mevzuat degisikligi kontrol edildi mi? -> Bolum 2'ye gec

Hicbir gap kalmadiginda rapor yazimi baslar. Gap varsa, hedefli yeni sorgular.

Hard stop: 25 sorgu sonrasi hala yeterli veri yoksa rapora
"MANUEL ARAMA ONERILIR - sistem yeterli veri bulamadi" notu dusulur.
Sahte karar UYDURMA.

#### Atif Dogrulama Protokolu (2 Asamali)

Rapora giren her karar kunyesi icin su iki asama ZORUNLUDUR:

**Asama 1 — Kaynak Dogrulama:**
`yargi bedesten doc <documentId>` ile kararın tam metnini cek.
Tam metin alinabildiyse -> [DOGRULANMIS] isareti.
Alinamazsa -> [DOGRULANMASI GEREKIR] isareti.

**Asama 2 — Icerik Dogrulama:**
Tam metin alindiysa, kararin gercekten kritik noktayla ilgili oldugunu dogrula.
Ozet ile tam metin uyumsuzsa -> atfi duzelt veya cikar.

Rapora giren her karar kunyesinin yaninda GUVEN NOTU olmak ZORUNDADIR:
- `[DOGRULANMIS]` — tam metin okundu, icerik dogrulandi
- `[DOGRULANMASI GEREKIR]` — kunye bulundu ama tam metin alinamadi
- `[BULUNAMADI]` — arama sonucunda bu karar tespit edilemedi

Dilekce yazarina iletilen raporda 3+ "[DOGRULANMASI GEREKIR]" isareti varsa
Director Agent'a UYARI gonderilir.

#### Yargi CLI Zorunlu Minimum

| Metrik | Minimum |
|---|---|
| Toplam sorgu | 15 |
| Faz 4 yil-bazli sorgu | 5 (yil basina 1) |
| HGK sorgusu | min 2 |
| Alternatif arama terimi | min 5 |
| Tam metin okunan karar | min 5 |
| Celiski/bozma sorgusu | min 2 |

---

### Bolum 2 - Mevzuat MCP Derin Protokolu (9 Faz + Mulga Denetim)

**Zorunlu Girdi:** 2B'nin atif maddeleri (`atif-maddeleri.json`).
2B kararlarinin atif yaptigi maddeler bu bolumde cekilir + mulga
denetimi yapilir. `atif-maddeleri.json` olusmadan 2C BASLAYAMAZ.

**Birincil arac:** Yargi-MCP-Pro (`mcp__yargi-mcp-pro__*`) — FAZ 2 entegrasyonu 2026-05-19
**Fallback:** Mevzuat CLI (`mevzuat search/doc/article/tree/gerekce`) - sadece MCP fail durumunda
**Thinking budget:** Engine + model `config/model-routing.json` -> ilgili task'tan okunur, MAX EFFORT thinking aktif
**Min sorgu sayilari (8 sorgu, 9 faz) DEGISMEZ — sadece arac Pro MCP olur.**

**!! page_size ≤20 KURALI (ZORUNLU — Pro MCP'de de korunur)**
Pro MCP `mevzuat_ara` upstream hard cap'i `page_size <= 20`. Daha fazla `Kayit
sayisi 20'den fazla olamaz` hatasi doner. Tool schema'da `maximum: 20` enforced.
- **`page_size` parametresi HER zaman 20 veya altinda** olmali
- **Default 25 KULLANMA** — explicit `page_size: 20` ver
- Pagination kullan: `page_size: 20, page: 1`, sonra `page: 2` ...
- `ictihat_ara` icin Bedesten cap 100 (Pro MCP schema'da `maximum: 100`)
- Rate limit Pro MCP'de gozlenmedi (yukaridaki Bolum 1 v3 gevsetilmis protokolu)

Pro MCP arac listesi (3 esas tool — FAZ 2 2026-05-19):
- `mcp__yargi-mcp-pro__mevzuat_ara` — 12 mevzuat tipi global arama. Tipleri:
  KANUN, KHK, TUZUK, YONETMELIK, CB_KARARNAME, CB_YONETMELIK, CB_KARAR (PDF/OCR),
  CB_GENELGE (PDF/OCR), KKY (kurum yonetmelik), UY (universite yonetmelik), TEBLIGLER, MULGA.
  Parametreler: `mevzuat_adi` (title plain), `phrase` (Mevzuat Solr — +/-/"exact"/wildcard*/fuzzy~/"a b"~5/boost^N;
  **AND/OR/NOT literal BREAK eder**), `mevzuat_no` (direkt kanun no), `mevzuat_tur_list[]`,
  `resmi_gazete_tarihi_start/end`, `page`, `page_size` (max 20).
- `mcp__yargi-mcp-pro__mevzuat_icinde_ara` — tek mevzuat ici local boolean
  (Solr DEGIL — `AND`/`OR`/`NOT` UPPERCASE calisir + adjacent words implicit AND).
  `mevzuat_id` (mevzuat_ara'tan), `query`, `sort_by` (relevance/document_order),
  `page_size` (1-50, default 25).
- `mcp__yargi-mcp-pro__mevzuat_getir` — polimorfik fetch:
  `id_type="mevzuat"` → tam metin (auto-chunk >50KB), `id_type="madde"` → tek madde,
  `id_type="gerekce"` → yasama gerekcesi, `id_type="outline"` → bolum/madde tree (`madde_id` listesi).
  PDF tipleri (`CB_KARAR`, `CB_GENELGE`) Mistral OCR'lı.

NOT: Eski 9 tip-bazli search tool (`search_kanun`, `search_khk`, `search_tuzuk`,
`search_kurum_yonetmelik`, `search_teblig`, `search_cbk`, `search_cbyonetmelik`,
`search_cbgenelge`, `search_cbbaskankarar`) Pro MCP'de tek `mevzuat_ara` +
`mevzuat_tur_list[]` altında birlesti. Eski 3 fetch tool (`get_mevzuat_content`,
`get_mevzuat_madde_tree`, `get_mevzuat_gerekce`) tek `mevzuat_getir` +
`id_type` enum'a indirgendi.

**ARAC ESLEME (eski → Pro MCP karsiligi):**
- `mevzuat search "X" -t KANUN` → `mevzuat_ara(phrase="X", mevzuat_tur_list=["KANUN"])` veya `mevzuat_ara(mevzuat_adi="X", mevzuat_tur_list=["KANUN"])`
- `search_kanun(kanun_no=N)` → `mevzuat_ara(mevzuat_no="N", mevzuat_tur_list=["KANUN"])`
- `mevzuat tree <id>` veya `get_mevzuat_madde_tree(mevzuat_id="<id>")` → `mevzuat_getir(id="<id>", id_type="outline")`
- `mevzuat article <id>` veya `get_mevzuat_content(madde_id="<id>")` → `mevzuat_getir(id="<id>", id_type="madde")`
- `mevzuat gerekce <id>` veya `get_mevzuat_gerekce(mevzuat_id="<id>")` → `mevzuat_getir(id="<id>", id_type="gerekce")`

Mevzuat MCP de derin mod. Kanun maddesini cekip birakmak YASAK.
Gerekce + degisiklik tarihcesi + ilgili yonetmelik hep toplanir.

**2B'ye sirali bagimlilik (YENI):** 2C, 2B'nin verdigi atif maddeleri listesi
olmadan baslamaz. 2B atif madde cikarimi tamamladiktan sonra 2C devreye girer.
Detay: Bolum 2.5 - 2B → 2C Sirali Zincir.



#### Mevzuat Faz 1 - Ana Kanun Maddesi (Query 1-3)

```bash
mevzuat search "{kanun adi}" -t KANUN
mevzuat tree <kanun_id>                # madde agaci
mevzuat article <madde_id>             # ana madde tam metni
```

#### Mevzuat Faz 2 - Madde Degisiklik Gecmisi (Query 4-5)

Kritik: Bir madde son 5 yilda degismis olabilir. Eski metin hala atifta
kullanilirsa risk olusur.

```bash
mevzuat gerekce <gerekce_id>           # maddenin gerekcesi (orijinal amac)
mevzuat article <madde_id> --history   # varsa, degisiklik tarihcesi
```

Ajan kontrol eder:
- Madde son 5 yilda degisti mi?
- Degistiyse: degisiklik tarihi, eski metin, yeni metin, gerekce
- Yeni metin bizim olayimizla ortsusuyor mu? (olay tarihine gore madde versiyonu)

#### Mevzuat Faz 3 - Ilgili Madde Zinciri (Query 6-9)

Bir madde tek basina yeterli degildir. Komsu maddeleri + atif yapilan
diger maddeler de cekilir:

```bash
mevzuat article <onceki_madde_id>      # onceki madde (gorev/kapsam)
mevzuat article <sonraki_madde_id>     # sonraki madde (istisna)
mevzuat article <atif_maddesi_id>      # bu madde baska bir maddeye atif yapiyorsa
mevzuat search "{konu}" -t YONETMELIK  # ilgili yonetmelik
```

#### Mevzuat Faz 4 - Alt Mevzuat ve Teblig (Query 10-12)

```bash
mevzuat search "{konu}" -t YONETMELIK
mevzuat search "{konu}" -t TEBLIG
mevzuat search "{konu}" -t GENELGE
```

Ornek: Is hukuku davasinda sadece Is Kanunu m.41 yetmez; "Haftalik Is
Gunlerine Bolunemeyen Calisma Sureleri Yonetmeligi" de cekilir.

#### Mevzuat Faz 5 - Hiyerarsik Etiketleme (Normlar Hiyerarsisi)

Her bulunan mevzuat hukmu hiyerarsik seviyeye etiketlenir. Bu etiket
sonraki fazlardaki norm denetimi ve catisma analizi icin zorunludur.

7 kademeli piramit:

```text
1. Anayasa
2. Milletlerarasi antlasmalar (Anayasa m.90/5 - onaylanmis)
3. Kanunlar / Olaganustu hal CBK'lari / Ictihadi Birlestirme Kararlari (IBK)
4. Olagan Cumhurbaskanligi Kararnameleri (CBK)
5. Tuzukler
6. Yonetmelikler
7. Adsiz duzenleyici islemler (genelge, teblig, yonerge, karar)
```

Ajan her bulunan hukmu etiketler:

```text
[Seviye 3 - Kanun] 4857 sayili Is Kanunu m.41
[Seviye 6 - Yonetmelik] Fazla Calisma ve Fazla Surelerle Calisma Yonetmeligi m.8
[Seviye 7 - Teblig] Asgari Ucret Tespit Komisyonu Teblig 2025/1
```

#### Mevzuat Faz 6 - Norm Denetimi (Sinir Asimi ve CBK Kontrolu)

Bu faz YASAK bolgelere girilmesini engeller. Ajan her mevzuat hukmu icin
iki soru sorar:

**Soru 1 - Sinir Asimi (Alt norm ust normu asabilir mi?):**

Alt seviyedeki bir norm (ornek: yonetmelik) ust seviyedeki normun
(ornek: kanun) kapsamini **daraltabilir** veya **teknik detay ekleyebilir**
ama **hak kisitlayici duzenleme getiremez**.

Kontrol soruisi:
- Bu yonetmelik/teblig, kanunda olmayan bir yukumluluk getiriyor mu?
- Kanun bir hakki tanidigi halde, alt norm o hakki daraltiyor mu?

EVET ise: `[SINIR ASIMI SUPHESI]` flag'i eklenir. Dilekcede atif yapilirsa
"alt normun ust normla catismasi" argumani uretilebilir.

**Soru 2 - CBK Munhasir Kanun Alani Kontrolu:**

Olagan CBK (Seviye 4) Anayasa m.104/17 geregi bazi konularda duzenleme
YAPAMAZ. Munhasir kanun alani:

- Temel haklar, kisi haklari ve odevleri, siyasi haklar (Anayasa 2. kisim)
- Kanunda acikca duzenlenmesi ongorulen konular
- Kanunla duzenlenmis konular (CBK kanun ile catisirsa kanun uygulanir)

Bulunan CBK icin kontrol:
- CBK temel hak mi duzenliyor? -> `[CBK ANAYASA IHLALI SUPHESI]`
- Ayni konuda kanun var mi? -> `[CBK-KANUN CATISMASI]`

Flag cikarsa ajan raporda "Bu dayanak kullanilirsa savunma simulasyonunda
test edilmelidir" notunu ekler.

#### Mevzuat Faz 7 - Catisma Analizi (Lex Superior / Specialis / Posterior)

Iki veya daha fazla mevzuat hukmu ayni olaya uygulanabilirse, catisma
cozme ilkelerinden biri uygulanir:

| Ilke | Kural | Ornek |
|---|---|---|
| Lex Superior | Ust norm > alt norm | Kanun ile yonetmelik catisirsa kanun uygulanir |
| Lex Specialis | Ozel norm > genel norm | Is K. m.41 (ozel) TBK m.398 (genel)'e gore oncelikli |
| Lex Posterior | Yeni norm > eski norm | Ayni seviyedeki iki kanundan yeni tarihli olan uygulanir |
| CBK-Kanun istisnasi | Kanun > CBK (her durumda) | Anayasa m.104/17 - olagan CBK kanunla catisirsa kanun uygulanir |

Ajan carpismayi tespit ederse rapora yazar:

```text
CATISMA: Is Kanunu m.41 (Seviye 3) vs. Fazla Calisma Yonetmeligi m.8 (Seviye 6)
CEVAZ: Yonetmelik, kanunun tanidigi hakki daraltiyor (sinir asimi)
UYGULANACAK: Is Kanunu m.41 (Lex Superior)
DAYANAK: Anayasa m.124 (yonetmelik kanuna aykiri olamaz)
```

#### Mevzuat Faz 8 - Zimni Ilga Taramasi

Yeni kanun eski kanunu acikca yurulukten kaldirmasa dahi, ayni konuyu
duzenleyen yeni kanun eski normu zimnen ilga eder. Ajan:

- Bulunan mevzuat hukmunu kapsayan **yeni kanun** var mi kontrol eder
- Yeni kanun daha genis veya daha dar bir alan mi duzenliyor bakar
- Eski norm bugun hala uygulanabilir mi sorusunu sorar

Supheli durumda: `[ZIMNI ILGA SUPHESI]` flag'i + mevzuat.gov.tr'den dogrulama
onerisi.

#### Mevzuat Faz 9 - LLM Web Arastirmasi (Fallback)

Mevzuat CLI'nin ulasamadigi durumlar:

- Cok yeni mevzuat (Resmi Gazete'de yayinlandi ama sisteme islenmedi)
- Ozel kurum yonetmelikleri (Meslek odasi, ozel sektor duzenlemeleri)
- Milletlerarasi antlasmalar (TBMM'ce onaylanmis - Seviye 2)
- Anayasa Mahkemesi norm denetimi kararlari (mevzuat degil ama etkili)
- Kanun Hukmunde Kararname iptal kararlari

Bu durumda ajan WebSearch veya WebFetch ile arama yapar. Kaynak kurallari:

- ONCELIKLI KAYNAKLAR: resmigazete.gov.tr, anayasa.gov.tr/tr/kararlar,
  mevzuat.gov.tr, mevzuat.adalet.gov.tr
- IKINCIL KAYNAKLAR: ilgili kurum web sitesi (SGK, BDDK, KVKK, SPK vs.)
- KABUL EDILMEYEN: forum, blog, wiki, sosyal medya

**Fallback ciktisi formati:**

```text
[Seviye X - Kaynak Turu] {Kanun/Yonetmelik adi} - {madde no}
KAYNAK: LLM Web - {URL} - {Yayim tarihi}
DOGRULAMA: [DOGRULANAMADI] - avukat manuel dogrulasin
```

Fallback kullanildiginda raporda "Kullanilan Kaynaklar" bolumune
`LLM Web Arastirmasi: N hukum` ibaresi eklenir ve guven notu daima
`[DOGRULANMASI GEREKIR]` isaretlenir.

#### Mevzuat Gap Check (Hiyerarsi Dahil)

- [ ] Ana madde + gerekce cekildi mi?
- [ ] Degisiklik tarihcesi kontrol edildi mi?
- [ ] Olay tarihine gore dogru versiyon mu kullaniliyor?
- [ ] Ilgili yonetmelik/teblig cekildi mi?
- [ ] Komsu maddeler (gorev, istisna, yaptirim) dikkate alindi mi?
- [ ] **Her hukum hiyerarsik seviyeye etiketlendi mi?**
- [ ] **Sinir asimi suphesi var mi, kontrol edildi mi?**
- [ ] **CBK varsa munhasir kanun alani kontrolu yapildi mi?**
- [ ] **Catisma tespit edildiyse Lex kurallariyla cozumlendi mi?**
- [ ] **Zimni ilga suphesi varsa not dusuldu mu?**
- [ ] **Mevzuat CLI'nin ulasamadigi hukum varsa LLM Web fallback yapildi mi?**

#### Mevzuat CLI Zorunlu Minimum

| Metrik | Minimum |
|---|---|
| Toplam sorgu | 8 |
| Gerekce cekimi | min 1 |
| Degisiklik kontrolu | zorunlu |
| Ilgili yonetmelik/teblig sorgusu | min 2 |
| Atif yapilan diger maddeler | cekildi |
| **Hiyerarsik etiketleme** | **her hukum icin zorunlu** |
| **Norm denetimi (Faz 6)** | **her hukum icin zorunlu** |
| **Catisma analizi (Faz 7)** | **catisma tespitinde zorunlu** |
| **LLM Web fallback** | **CLI ulasamayan hukum icin zorunlu** |

---

### Bolum 2.5 - 2B → 2C Sirali Zincir + Mulga Eleme Protokolu (YENI)

2B Yargi MCP ve 2C Mevzuat MCP **sirali** calisir (paralelden CIKARILDI).
2C, 2B'nin atif madde ciktisi ve Claude kalite kapisi `GECTI` olmadan
baslamaz. Akis:

#### Adim 1 — 2B Yargi MCP Detayli Arama

Mevcut 6 fazli protokol (Bolum 1) calisir. ADD: Tam metni okunan her karar
icin, kararin atif yaptigi mevzuat maddeleri **cikarilir** ve liste olarak
2C'ye gecirilir.

**Cikti:** Aday karar listesi + her karar icin atif madde listesi
(ornek: "9.HD 2024/12345 → Is K. m.41 + TBK m.398 + Fazla Calisma Yon. m.8")

#### Adim 2 — 2C Mevzuat MCP Atif Maddelerini Cek

2B'nin verdigi atif madde listesi uzerinden iterasyon (Pro MCP — FAZ 2):
- `mevzuat_ara(phrase="<kanun adi>", page_size=20)` veya `mevzuat_ara(mevzuat_no="<no>", mevzuat_tur_list=["KANUN"])` → mevzuat_id
- `mevzuat_getir(id="<mevzuat_id>", id_type="outline")` → madde agaci + madde_id listesi
- `mevzuat_getir(id="<madde_id>", id_type="madde")` → bugunkü guncel metin
- `mevzuat_getir(id="<gerekce_id veya mevzuat_id>", id_type="gerekce")` → gerekce (varsa)

#### Adim 3 — Mulga / Guncel Denetimi (her madde icin ZORUNLU)

| Kontrol | Soru | Kaynak | Aksiyon |
|---|---|---|---|
| Yururluk | Madde bugun yururlukte mi? | madde_tree status | Mulga ise FLAG |
| Mulga tarihi | Ne zaman yururlukten kaldirildi? | madde_tree history | Olay tarihi sonrasi ise atif gecersiz |
| Olay tarihi versiyonu | Olay tarihinde hangi versiyon yururlukteydi? | madde history | Versiyon farkliysa "olay tarihi versiyonu Y, bugun Z" notu |
| Zimni ilga | Yeni kanun eskiyi ilga etmis mi? | mevzuat_ara (yeni kanun) | Ediyorsa atif guncellenir veya gecersiz |

#### Adim 4 — Eleme (kalite kapisi)

Her aday karar icin:

- **GECERLI:** Atif yaptigi tum maddeler bugun yururlukte ve olay tarihinde
  de gecerliydi → rapora alinir.
- **TARIH UYUMSUZ:** Atif yaptigi madde olay tarihinde farkli versiyondaydi
  → rapora "Bu karar olay tarihindeki Y versiyonuna goredir; bugun Z
  versiyonu" notuyla alinir (avukat degerlendirir).
- **MULGA ATIF:** Atif yaptigi madde mulga + alternatif yeni karar yok →
  `[DEGER YOK — mulga atif]` ELENIR, dilekceye tasinmaz.
- **ZIMNI ILGA:** Atif yaptigi kanun yeni kanun ile zimni ilga olmus →
  `[ESKI NORM]` ELENIR, ama yeni kanunda esdeger madde varsa onunla
  yeniden cekim onerilir.

**Eleme sonu sayim:** Eleme sonrasi GECERLI karar sayisi 5'in altina
duserse → 2B'ye geri don, 3 alternatif terimle ek arama. Hala 5 alti
ise rapora `[YETERSIZ KARAR]` flag + manuel arama onerisi.

#### Adim 5 — Normlar Hiyerarsisi Denetimi

Eleme sonrasi gecerli set uzerinde mevcut Mevzuat Faz 5-9 protokolu
calisir (hiyerarsi etiketleme, sinir asimi, CBK denetim, catisma
analizi, zimni ilga, LLM Web fallback).

#### 2B + 2C Cikti Formati (raporun "Yargi + Mevzuat" bolumu)

```markdown
## Yargi Kararlari + Mevzuat (Mulga Eleme Sonrasi)

### Gecerli Kararlar (rapora alinanlar)
| Karar | Atif Maddesi | Madde Yururluk | Olay Tarihi Uyum | Sonuc |
|---|---|---|---|---|
| 9.HD 2024/12345 | Is K. m.41 | YURURLUKTE | UYUMLU | GECERLI |
| HGK 2023/E.X K.Y | TBK m.344 | YURURLUKTE | UYUMLU (2021 versiyonu da ayni) | GECERLI |

### Elenen Kararlar (rapor disi)
| Karar | Sebep | Eleme Isareti |
|---|---|---|
| 9.HD 2018/9999 | Atif maddesi (Is K. m.X) 2020'de mulga | [DEGER YOK — mulga atif] |
| 22.HD 2017/8888 | Atif maddesi olay tarihi sonrasi tadil | [ESKI NORM] |

### Mevzuat Tam Metni (gecerli kararlarin atif maddeleri)
[Madde tam metni + gerekcesi + hiyerarsi etiketi + catisma analizi]
```

#### Bolum 2.5 Zorunlu Minimum

| Metrik | Minimum |
|---|---|
| 2B atif madde cikarimi | her tam metin karar icin zorunlu |
| 2C atif madde denetimi | her atif madde icin zorunlu |
| Mulga/yururluk kontrolu | her madde icin 4 kontrol zorunlu |
| Eleme sonrasi gecerli karar | min 5 (altinda 2B'ye geri donus) |
| "Gecerli/Elenen" tablolari | her ikisi de raporda zorunlu |

---

### Bolum 2.7 - 2D NotebookLM Iteratif Protokolu (Disiplinli + Async Paralel Kol)

**Zorunlu Girdi:** Avukatin kritik noktasi + briefing (varsa).
Sorgularin odagini kritik nokta + beklenen karsi taraf savunmasi belirler.

**Birincil arac:** NotebookLM MCP (`mcp__notebooklm__*`)
**Notebook:** Avukatin sectigi (`is_hukuk`, `aile_hukuku`, vb. — ADIM 0B'de belirlenir)
**Ne zaman calisir:** ASAMA 2'de **async paralel kol** olarak (2B sirali zincirini bloklamaz)

**Avukat karari (2026-05-04):** "NotebookLM arastirmasi degerli, 10 sorgu kesinlikle yapilsin.
Iteratif olsun, mevcut yonergeye sadik."

#### Sorgu Disiplini (10 Iteratif Sorgu — KORUNUR)

Mevcut FIVEAGENTS.md ASAMA 2D yonergesi degismez:

**Bolum A: Hukuki Irdeleme (en az 6 soru, iteratif)**
- Q1: Temel hukuki cerceve (kritik nokta etrafinda)
- Q2: Taraflarin sorumluluk alanlari
- Q3: Ispat yukumlulugu
- Q4: Temerrud / faiz / sure
- Q5: Celiskili noktalar / karsi argumanlar
- Q6: Emsal ictihat analizi (NotebookLM'in kaynak gosterdikleri)

**Bolum B: 5 Ajan Perspektifleri (4 soru)**
- Q+1: Davaci avukat bakis acisi
- Q+2: Davali avukat bakis acisi
- Q+3: Bilirkisi bakis acisi
- Q+4: Hakim bakis acisi

Her sorguda SABIT ibare: **"SADECE KAYNAKLARA GORE CEVAP VER, UYDURMA YAPMA"**.

#### YENI: 47 Sorguya Cikma Uyarisi (Disiplin)

Sakarya davasinda 47 sorgu yapilmisti — bu **kalite degil, balon**. Yeni kural:

- **Hard cap: 12 sorgu** (10 zorunlu + en fazla 2 takip sorusu)
- **Tekrar yasak:** Ayni temaya farkli kelimelerle 11+ sorgu yapiyorsan,
  yeni bilgi getirmiyor demektir → DUR. Mevcut bulgularla sentezle.
- **Doygunluk tespiti:** 2 ardisik sorgu cevabi onceki sorgulardan farkli sey
  getirmiyorsa "NotebookLM bulgulari doygunluga ulasti — 11. sorgu yok" notu
  rapora dusulur.

#### YENI: Async Paralel Kol (Hiz Kazanci)

NotebookLM 2D **ASLA Faz 2'yi bloklamaz**:

1. Director Agent ASAMA 2 basinda 2D'yi background task olarak baslatir
2. 2B Yargi MCP + 2C Mevzuat MCP sirali zinciri kendi temposunda ilerler
3. NotebookLM cevaplari geldikce arastirma raporuna eklenir
5. **2B+2C bitti, 2D hala devam ediyorsa:**
   - Director makul sure bekler (5 dakika)
   - Sonra mevcut NotebookLM cevaplariyla sentez yapar
   - Gec gelen cevaplar checkpoint olarak isaretlenir, raporun
     "NotebookLM Ek Bulgulari (Geç Geldi)" bolumune eklenir

#### YENI: Tek Sorgu Soft Timeout (3 dakika)

Tek bir NotebookLM sorgusu **3 dakikayi** gecerse:

- Rapora `SLOW_NOTEBOOKLM_Q{n}` flag yazilir
- **Sorgu IPTAL EDILMEZ** — polling devam eder
- Arastirmaci sonraki sorguya gecer, ama mevcut sorgunun cevabi geldiginde rapora ekler
- Bu, hizi keser ama kaliteyi kesmez

#### YENI: Toplam Soft Cap (15 dakika)

NotebookLM 2D toplam suresi 15 dakikayi gecerse:

- Mevcut tamamlanan sorgu sayisini raporda not et
- "NotebookLM 10 sorgudan X tanesi tamamlandi, kalan Y geç gelirse eklenecek" flag dus
- ASAMA 2'nin diger kollari ve ASAMA 3+ devam eder

#### KVKK Notu (NotebookLM)

NotebookLM Google ABD'dedir. Sorgularda HAM muvekkil adi/TC/adres KULLANMA.
Sadece kritik nokta + genel dava turu yaz (mevcut KVKK kuralina sadik kal).

#### 2D Cikti Formati

```markdown
## NotebookLM Iteratif Bulgular (Bolum 2D)

**Notebook:** is_hukuk
**Toplam sorgu:** 10/10 tamamlandi (veya 8/10 — 2 takipte)
**Sure:** 4 dakika 32 saniye
**Disiplin:** ✓ 11+ sorguya cikilmadi

### Bolum A — Hukuki Irdeleme
- Q1 [Temel cerceve]: [NotebookLM cevap ozeti, kaynak]
- Q2 [Sorumluluk]: [...]
- ...
- Q6 [Emsal]: [...]

### Bolum B — 5 Ajan Perspektifi
- Q+1 [Davaci]: [...]
- Q+2 [Davali]: [...]
- Q+3 [Bilirkisi]: [...]
- Q+4 [Hakim]: [...]

### Doygunluk Notu (varsa)
"11. sorgu eklenmedi cunku Q9-Q10 ayni cevap kalibini verdi."

### Geç Gelen Bulgular (varsa)
"Q4 cevabi 4 dakika sonra geldi, sentez raporuna eklenmistir."
```

#### Bolum 2.7 Zorunlu Minimum

| Metrik | Minimum |
|---|---|
| Sorgu sayisi | 10 (6 hukuki + 4 perspektif), takip dahil max 12 |
| Async paralel | 2D 2B/2C'yi bloklamaz |
| KVKK ibare | Her sorguda "SADECE KAYNAKLARA GORE CEVAP VER, UYDURMA YAPMA" |
| Tek sorgu soft timeout | 3 dakika (skip yok, polling devam) |
| Toplam soft cap | 15 dakika |
| Doygunluk tespiti | 2 ardisik benzer cevap → DUR |

---

### Max Effort Thinking Kurali

Her iki protokol de **Max Effort** thinking ile calisir. Iterasyon
arasinda ajan su karar noktalarini dusunmelidir:

- Hangi terim iyi sonuc verdi, hangisi bosta donduruldu?
- Bir sonraki sorguyu hangi daireye / hangi tarihe daraltmaliyim?
- Bu 4 karardan hangileri gercekten ratio decidendi olarak alakali?
- Karsi tarafin en guclu kozu hangi karar / hangi mevzuat?
- Temporal kirillma noktasi hangi HGK karari ile gerceklesti?

Bu, tek-shot aramada olmayan bir muhakeme katmanidir ve kalitenin temelidir.

---

## ASAMA 2 Konsolide Sentezi — Claude'da Kalir (2026-05-13)

Bu bolum 2B'nin kendi nihai raporunu degil, 2B+2C+2D bittikten sonraki genel
ASAMA 2 konsolidasyonunu anlatir. 2B'nin nihai raporunu Luna yazar; 2B
sonundaki Claude yalniz kisa kalite kapisidir.

Tum kollar (2B+2C+2D) tamamlandiktan sonra konsolide arastirma raporunu
**terminal Claude** yazar. MCP ciktilari zaten Claude oturumunda ham olarak
mevcut — copy-paste yorgunlugu olusmasin ve butunluk korunsun diye sentez
Antigravity'ye gitmez.

**Karar gerekcesi (2026-05-13):** Diger ASAMA'lar Antigravity'ye tasinirken
ASAMA 2 sentezi Claude'da birakildi. Cunku:
- MCP ciktilari (kunye, ozet, tam metin) Claude oturumunda ham veri olarak
  uretiliyor; baska panele tasimak gereksiz cevirme yapar
- Sentez teknik bir derleme isi (yapilandirilmis rapora cevirme), hukuki
  yaratici uretim degil
- Antigravity'ye gitse zincir + kol ciktilari tek dosyada toplanip
  yapistirilmali — buyuk context, hata riski

**DEPRECATED:** Eski `scripts/gemini-bridge.sh arastirma_sentezi` cagrisi
2026-05-13 itibariyla devre disi. Bridge cagrilirsa exit 100 doner.

### Akis (Yeni)

1. **Ham bulgulari topla (paralel + sirali zincir):**
   - 2B Sol/Terra/Luna + Claude QA -> bulunan kararlar + atif maddeleri + son 5 yil seyri
   - 2C Mevzuat MCP -> kanunlar + mulga eleme tablosu + normlar hiyerarsisi
   - 2D NotebookLM -> 10 iteratif sorgu cevaplari (6 irdeleme + 4 perspektif)

2. **Konsolide raporu Claude yazar:**
   - `02-Arastirma/arastirma-raporu.md` — terminal Claude doğrudan yazar
   - Format: FIVEAGENTS.md "Cikti Format Kurallari" + Kalite Kapi 1
     gereksinimlerine birebir uyar
   - Frontmatter: `engine: claude`, `model: {config/model-routing.json
     -> tasks.arastirma_sentezi.model}`, `status: TASLAK`
   - Yan dosyalar:
     - `02-Arastirma/atif-maddeleri.json` (2B → 2C zinciri girdisi)
     - `02-Arastirma/mulga-eleme.json` (eleme tablosu)

3. **Kalite Kapisi 1 (Claude self-check):**
   - [ ] 15 Yargi sorgu listesi (kunye + ozet) raporda var mi?
   - [ ] Min 5 karar tam metin kunye var mi?
   - [ ] `02-Arastirma/atif-maddeleri.json` doldu mu?
   - [ ] `02-Arastirma/mulga-eleme.json` doldu mu?
   - [ ] Normlar Hiyerarsisi etiketleri var mi?
   - [ ] Celiskili kararlar bolumu var mi?
   - [ ] NotebookLM 10 sorgu cevabi raporda var mi?
   - [ ] Mulga eleme sonrasi >= 5 GECERLI karar kaldi mi?
   - [ ] DOGRULANMAMIS atif sayisi raporda yazildi mi?
   - [ ] mcp_fallback_used flag'i (varsa) belirtildi mi?

4. **Eksik varsa:** Sadece eksik mini-kolu (orn. NotebookLM 3 sorgu eksikse,
   sadece o 3 sorguyu) tekrar calistir. Tum Faz 2'yi bastan baslatma.

5. **Avukata sun:** Rapor hazir; bir sonraki ASAMA (ASAMA 3 Usul Raporu)
   Antigravity'ye gidecek — devir blogu hazirla.

### Asla

- `gemini-bridge.sh` cagirma — DEPRECATED (exit 100)
- Sentez raporunu Antigravity'ye yaptir (MCP ciktilari Claude'da kaldi,
  copy-paste yorgunlugu olmasin)
- KVKK ihlali: rapora ham muvekkil verisi yazma (zaten Claude maskeli
  context'le calisiyor, ama ek kontrol)
- Sentez ciktisinda atif maddesi denetimi atla (mulga eleme onceden 2C'de
  yapilmis, bu noktada zaten temiz set var)
- 5 GECERLI karar altinda kalan raporu "yeterli" diye sun (geri don, 3
  alternatif terimle yeniden 2B)

## Cikti Formati

```markdown
---
GUVEN NOTU:
- Mevzuat referanslari: [DOGRULANMIS / DOGRULANMASI GEREKIR]
- Yargitay kararlari: [DOGRULANMIS / DOGRULANMASI GEREKIR / BULUNAMADI]
- Hesaplamalar: [YAPILDI / YAPILMADI / TAHMINI]
- Dahili kaynak: [EVET - kaynak adi / HAYIR]
- Risk flag: [VAR - aciklama / YOK]
---

# Arastirma Raporu - [Kritik Nokta]

## Kullanilan Kaynaklar
- Yargi MCP: [Arama terimleri ve sonuc sayisi]
- Mevzuat MCP: [Cekilen kanun maddeleri]
- Dahili: [NotebookLM notebook adi / Drive klasoru / Kullanilmadi]

## Ilgili Mevzuat (Normlar Hiyerarsisi Analizli)

Her hukum hiyerarsik seviyeye etiketlenir. Catisma tespit edildiyse
cozum kurali belirtilir. Fallback kullanildiysa kaynak URL ve tarih
zorunludur.

### Seviye 1 - Anayasa
[Madde no + tam metin + ilgili gerekce]

### Seviye 2 - Milletlerarasi Antlasmalar
[Varsa: antlasma adi, onay tarihi, ilgili madde]

### Seviye 3 - Kanunlar / OHAL CBK / IBK
[Kanun adi - Madde no - Tam metin - mevzuat CLI]
[Degisiklik tarihcesi: olay tarihinde hangi versiyon yurulukte]

### Seviye 4 - Olagan CBK (varsa)
[CBK adi - madde no - Tam metin]
[MUNHASIR KANUN ALANI KONTROLU: temiz / suphe]

### Seviye 5 - Tuzukler (varsa)
[...]

### Seviye 6 - Yonetmelikler
[Yonetmelik adi - madde no - Tam metin]
[SINIR ASIMI KONTROLU: temiz / suphe]

### Seviye 7 - Adsiz Duzenleyici Islemler (Teblig, Genelge)
[...]

### Catisma Analizi (varsa)

| Norm 1 | Norm 2 | Catisma Turu | Uygulanacak | Dayanak |
|---|---|---|---|---|
| [...] | [...] | Lex Superior/Specialis/Posterior | [...] | [Anayasa m.X] |

### LLM Web Fallback (varsa)

[Seviye X - Kaynak Turu] {Hukum adi} - {madde}
KAYNAK: LLM Web - {URL} - {Yayim tarihi}
DOGRULAMA: [DOGRULANAMADI] - avukat manuel dogrulasin


## Yargi Kararlari + Mevzuat (Mulga Eleme Sonrasi - YENI)

### Gecerli Kararlar (rapora alinanlar)
| Karar | Atif Maddesi | Madde Yururluk | Olay Tarihi Uyum | Sonuc |
|---|---|---|---|---|
| [Daire Tarih E/K] | [Kanun m.X] | YURURLUKTE | UYUMLU | GECERLI |

### Elenen Kararlar (rapor disi)
| Karar | Sebep | Eleme Isareti |
|---|---|---|
| [Daire Tarih E/K] | [aciklama] | [DEGER YOK — mulga atif] / [ESKI NORM] |

## Guncel Yargitay Kararlari (Son 2 Yil) - Gecerli Set
[Daire | Tarih | Esas/Karar No | 2-3 cumle ozet | Emsal degeri]

## HGK / IBK Kararlari
[Varsa kurnyesi ve ozeti. Yoksa: "Tespit edilmedi."]

## Son 5 Yil Ictihat Seyri Analizi

**Bu bolum ZORUNLUDUR.** Yargi CLI Faz 4 (Temporal Evolution) ciktisi
buraya islenir. Amac: Yargitay'in ayni konudaki goruisunun son 5 yilda
nasil evrildigini gormek, guncel ictihat kaymasini kacirmamak.

### 2021 — [N karar bulundu]
- Hakim gorus: [o yilin yerlesik uygulamasi, 1-2 cumle]
- Ornek karar: [Daire tarih E./K. - 1 cumle ozet]
- Not: [varsa ozel durum]

### 2022 — [N karar]
- Hakim gorus: [...]
- Degisim (2021'e gore): [YOK / KISMI / KIRILMA]
- Ornek karar: [...]

### 2023 — [N karar]
- Hakim gorus: [...]
- Degisim: [...]
- Ornek karar: [...]

### 2024 — [N karar]
- Hakim gorus: [...]
- Degisim: [...]
- Ornek karar: [...]

### 2025 — [N karar]
- Hakim gorus: [...]
- Degisim: [...]
- Ornek karar: [...]

### Seyir Yorumu (Sentez)

- **Trend:** [STABIL / KADEMELI DEGISIM / SERT KIRILMA / CELISKILI]
- **Kirillma noktasi:** [varsa tarih + HGK/IBK kunye. Yoksa: "Tespit edilmedi."]
- **Olu kararlar:** [Artik kullanilmamasi gereken eski kararlar - HGK bozmasi vs.]
- **Bugun yerlesik uygulama:** [2025 itibariyla Yargitay'in durusu - 2-3 cumle]
- **Dilekcede kullanilacak:** [En guncel + en guclu 2-3 karar, kunyeleriyle]
- **Risk:** [Yargitay'in yakin zamanda yon degistirebilecegi sinyal var mi?]

[NOT: 2E Akademik Doktrin kolu 2026-05-19'da kaldirildi; sablondaki
"Doktrin Celiskileri / Atif Zinciri / Dilekceye Tasinacak Doktrin"
basliklari da 2026-07-09'da SILINDI (dolduramayacagimiz olu basliklar).
Akademik kaynak gerekirse `arastir-notebook` (avukatin notebook'lari)
veya Yargi-MCP-Pro tam metin atifi uzerinden gelir; NotebookLM'den
gelen doktrin gorusleri "NotebookLM Bulgulari" bolumune yazilir.]

## Celiskili Noktalar ve Sapma Uyarilari
[Kararlar arasi celiski veya yerlesik uygulamadan sapma]

## Guncellik Kontrolu
[Kararlarin ve mevzuatin dogrulama durumu]

## Dilekceye Tasinacak Argumanlar
- [Arguman 1 - kaynak]
- [Arguman 2 - kaynak]
```

Kayit yolu:
- Dava akisinda: `G:\Drive'im\Hukuk Burosu\Aktif Davalar\{dava-id}\02-Arastirma\arastirma-raporu.md`
- Sadece arastirma talebinde: `G:\Drive'im\Hukuk Burosu\Bekleyen Davalar\{istek-id veya konu-adi}\01-Arastirma\arastirma-raporu.md`

## Kalite Kontrol

### Genel Kontroller (Tum Ajanlar)

- [ ] Yapay zeka oldugu belli oluyor mu?
      ("Ozetle", "Sonuc olarak", "Belirtmek gerekir ki" var mi?)
      VARSA: Yeniden yaz.
- [ ] Turkce karakter hatasi var mi?
- [ ] Referans verilen karar/mevzuat gercekten var mi?
      EMIN DEGILSEN: "dogrulanmasi gerekir" notu ekle.
      Uydurma referans YAZMA.
- [ ] KVKK: Gercek isim, TC, IBAN var mi? Maskele.

### Ajan Bazli Kontroller (Derin Protokol Minimumu)

Yargi CLI tarafi:
- [ ] Toplam en az **15 sorgu** calistirildi mi?
- [ ] Faz 4 (Temporal Evolution) icin **her yil icin ayri sorgu** (icinde bulunulan yil dahil son 5 takvim yili, min 5 + 2 HGK yari-donem) yapildi mi?
- [ ] En az **2 HGK** sorgusu yapildi mi?
- [ ] En az **5 alternatif arama terimi** denendi mi?
- [ ] **Tam metni okunan karar** min 5 mi?
- [ ] **Celiski/bozma sorgusu** min 2 yapildi mi?
- [ ] Rapora **"Son 5 Yil Ictihat Seyri Analizi"** bolumu islendi mi? (seyir yorumu + trend + kirillma noktasi dahil)

Mevzuat CLI tarafi:
- [ ] Toplam en az **8 sorgu** calistirildi mi?
- [ ] Ana madde + **gerekce** cekildi mi?
- [ ] **Madde degisiklik gecmisi** kontrol edildi mi? (olay tarihine gore dogru versiyon)
- [ ] En az **2 yonetmelik/teblig** sorgusu yapildi mi?
- [ ] **Atif yapilan diger maddeler** cekildi mi?
- [ ] **Her hukum hiyerarsik seviyeye etiketlendi mi?** (Faz 5)
- [ ] **Alt norm ust normu asiyor mu, kontrol edildi mi?** (Faz 6 - Sinir Asimi)
- [ ] **CBK varsa munhasir kanun alani denetimi yapildi mi?** (Faz 6 - CBK)
- [ ] **Catisma tespit edildiyse Lex kurallariyla cozuldu mu?** (Faz 7)
- [ ] **Zimni ilga suphesi kontrol edildi mi?** (Faz 8)
- [ ] **Mevzuat CLI'nin kapsamadigi hukum icin LLM Web fallback yapildi mi?** (Faz 9)
- [ ] **LLM Web fallback kullanildiysa kaynak URL + tarih eklendi mi?**

Sentez tarafi:
- [ ] Dahili kaynak kullanildiysa kaynagin adi acik yazildi mi?
- [ ] Celiskili uygulama varsa rapora acikca yazildi mi?
- [ ] Dilekceye Tasinacak Argumanlar bolumu temporal evolution ile uyumlu mu?

## Risk Flag'leri

- Guncel mevzuat metni dogrulanamadi
- Kararlar birbiriyle celisiyor
- Dahili kaynak var ama hukuki dayanakla uyusmuyor
- Kritik noktayi destekleyen yeterli guncel karar bulunamadi
- **Sinir asimi suphesi** - alt norm (yonetmelik/teblig) ust normu (kanun) daraltiyor
- **CBK munhasir kanun alani ihlali suphesi** - CBK temel hak duzenliyor veya kanunla catisiyor
- **Zimni ilga suphesi** - eski mevzuat yeni kanun ile ortulu olarak yurulukten kalkmis olabilir
- **LLM Web fallback** - Mevzuat CLI kapsamadi, guven notu DOGRULANMASI GEREKIR
- **Catisma cozumu tartismali** - Lex kurallari birden fazla sonuca iziin veriyor

## Diary Write (ZORUNLU - Is Bittiginde)

Arastirma raporu kaydedildikten sonra MemPalace'e iki yazim yapilir:

### 1. Ajan Diary

```text
mempalace_diary_write
  agent_name: "arastirmaci"
  content: "Bu arastirmadaki en onemli 3 ogrenme:
            1) {kritik nokta} icin {kaynak} en zengin sonucu verdi
            2) {arama terimi} {sonuc sayisi} karar dondurdu, en kullanisli {daire/tarih}
            3) {celisen karar/sapma uyarisi} not edildi"
```


**2B+2C icin ek diary (mulga eleme calistiysa):**
```text
mempalace_diary_write
  agent_name: "arastirmaci-mulga"
  content: "Mulga eleme sonucu:
            1) {N} aday karardan {M} GECERLI, {K} ELENEN
            2) Eleme sebepleri: {mulga atif: X / eski norm: Y / tarih uyumsuz: Z}
            3) Atif madde tarihce kontrolu: {kritik bulgu varsa}"
```

Diary icerigi kisa, somut ve tekrar kullanilabilir olmali. KVKK: muvekkil
adi yok, dava-id'ye atif yok, sadece hukuki oruntu.

### 2. Bulgu Drawer'i

Arastirmadan cikan **olgun** bulguyu (yani guven notu DOGRULANMIS olan ve
kritik noktayi gercekten karsilayan kisim) kalici drawer olarak yaz:

```text
mempalace_add_drawer
  wing: wing_{dava_turu}
  hall: hall_arastirma_bulgulari
  room: room_{kisa_konu_slug}
  content: "Kritik nokta: {nokta}
            Mevzuat: {kanun-madde}
            Yargitay: {daire-tarih-esas/karar} - 1 cumle ozet
            HGK/IBK: {varsa kunye}
            Arguman: {dilekceye tasinacak ana arguman, 2-3 cumle}
            Kaynak guven: DOGRULANMIS"
```

KVKK kontrolu: drawer icerigine gercek isim, TC, IBAN, dava-id KOYMA.
Drawer paylasilabilir hukuki oruntu olmali, dava ozeti olmamali.

### Promotion Notu

Arastirmaci dogrudan `hall_argumanlar`'a yazmaz. Bir bulgu:
- 2+ farkli arastirmada tekrar ederse veya
- Tam davada Belge Yazari tarafindan kullanilirsa

Revizyon Ajani veya Director Agent tarafindan `hall_arastirma_bulgulari`'ndan
`hall_argumanlar`'a promote edilir. Arastirmacinin gorevi olgun bulgu uretmektir,
promotion karari onun degildir.

## Hata Durumunda

| Senaryo | Aksiyon |
|---|---|
| **Yargi MCP basarisiz** | 5 sn bekle, 2. deneme MCP. Hala fail → Yargi CLI fallback otomatik devreye girer. CLI da fail → rapora `[MCP+CLI HATASI]` notu, manuel arama onerisi. Rapora `mcp_fallback_used: true` GUVEN NOTU. |
| **Mevzuat MCP basarisiz** | Ayni pattern: 2 MCP denemesi → Mevzuat CLI fallback → rapora `mcp_fallback_used: true` notu. |
| **Mulga eleme sonrasi 5'in altinda gecerli karar kaldi** | 2B'ye geri don, 3 alternatif terimle yeni arama. Hala 5 alti → rapora `[YETERSIZ KARAR]` flag + manuel arama onerisi. |
| MCP baglanti hatasi (MemPalace veya NotebookLM) | Director Agent'a bildir, adimi atla, rapordaki "Kullanilan Kaynaklar" bolumune `[MCP HATASI: {arac}]` notu ekle. Arastirmaya diger kaynaklarla devam et. |
| Yargi CLI sonuc donmuyor (fallback) | 3 alternatif arama terimi dene (es anlam, kanun maddesi, daire numarasi). Hala sonuc yoksa rapora "MANUEL ARAMA ONERILIR - {terim} icin sonuc bulunamadi" notu ekle. Uydurma karar YAZMA. |
| Mevzuat CLI madde bulunamadi (fallback) | Kanun numarasi ve madde numarasini ayri dene. Hala yoksa "mevzuat.gov.tr'den dogrulama onerilir" notu ekle. |
| Context siniri doldu | En alakali 5 karari tut, geri kalanlari 1 cumlelik ozet + kunye olarak birak. Detayli analizi "derinlestirme onerilir" notuyla isaretle. |
| Ajan ciktisi bos/yetersiz | Director Agent'a bildir. Alternatif arama stratejisi oner. Tekrar calistirilabilir. |
| NotebookLM uydurma cevap supehsi | NotebookLM cevabini Yargi CLI veya Mevzuat CLI ile carpraz dogrula. Dogrulanamiyorsa cevabi kullanma, "[NLBM DOGRULANMADI]" notu ekle. |

---

## Alt-Mode 1: Bilirkisi Denetleme Modu

### Tetikleyici

```text
arastir bilirkisi: [dava-id] [rapor-dosyasi-yolu]
```

Ornek: `arastir bilirkisi: 2026-042 G:\Drive'im\Hukuk Burosu\Aktif Davalar\2026-042\01-Usul\bilirkisi-raporu.pdf`

### Ne Yapar

Avukatin dosyaya koydugu bilirkisi raporunu hukuki + teknik acidan denetler.
Bu, arastirma-gorevi DEGILDIR. Yeni Yargitay karari taramasi YAPILMAZ
(o is ana akistaki arastirmacinin gorevidir). Bu modda ajan sadece raporun
**kendi icinde** mantik/hesap/yontem audit'i yapar.

### Girdi

- Dava klasorundeki bilirkisi raporu (PDF, DOCX veya metin)
- Dava kunyesi (mahkeme, esas, taraflar)
- Muvekkil pozisyonu (lehimize/aleyhimize kisimlar)
- Varsa Usul Ajani'ndan hesaplama karsilastirmasi (iscilik hesabi)

### Prompt

`prompts/gemini/bilirkisi_analizi.md`

### Cikti

Drive'a: `02-Arastirma/bilirkisi-denetim-raporu.md`

### Ozel Kurallar

- Derin arama protokolu **UYGULANMAZ** (bu bir audit, yeni karar taramasi degil)
- Rapordaki kunyelerle "emsal karar" ibaresi kullaniliyorsa kunye kontrolu zorunlu
- Hesaplama dogrulamasi icin Usul Ajani'ndan iscilik hesabi gelmisse kullan,
  yoksa "TAHMINI" isaretle, somut sayi UYDURMA
- Raporda OLMAYAN kalemi "varmis gibi" elestirme; sadece "eksik" olarak belirt
- KVKK: rapordaki [TC_NO_*], [MUVEKKIL_*], [IBAN_*] tokenlari aynen korunur

### Kalite Kontrol (Bilirkisi Moduna Ozel)

- [ ] Bilirkisinin **gorev tanimina uygunluk** degerlendirmesi yapildi mi?
- [ ] **Hesaplama kontrolu tablosu** (kalem-kalem) dolduruldu mu?
- [ ] **Maddi / hukuki / mantik hatasi** ayri basliklarda sunuldu mu?
- [ ] **Itiraz noktalari beyana-esas formatta** yazildi mi? (mahkemeye sunulabilir)
- [ ] Avukata net oneri verildi mi? (TAM ITIRAZ / KISMI ITIRAZ / KABUL)

---

## Alt-Mode 2: SWOT Strateji Modu

### Tetikleyici

```text
swot arastir: [dava-id]
```

### !! UYARI: KULLANICIYI BILGILENDIREN ZORUNLU BANNER !!

Bu mod calistirildiginda **ciktinin en ustune** su uyari **HER ZAMAN** eklenir:

```markdown
═══════════════════════════════════════════════════════════════
  **SWOT MODU AKTIF**

  Bu cikti stratejik SWOT analizidir, olagan arastirma raporu DEGILDIR.
  Amac: dava teorisini SWOT + rakip modellemesi + yol haritasi ile
  stratejik dusunce ciktisina cevirmek.

  Kullanim: Ic degerlendirme. Muvekkile veya mahkemeye sunulmaz.
  Dilekce yazimina girdi olarak kullanilabilir.
═══════════════════════════════════════════════════════════════
```

Bu banner **cikti ici warning** olarak zorunludur (avukatin modu unutmamasi icin).

### Ne Yapar

Standart arastirma raporundan farklı olarak, dava hakkinda:

1. **SWOT matrisi** — Strengths / Weaknesses / Opportunities / Threats
2. **Rakip modellemesi** — karsi tarafin en guclu 3 hamlesi, muhtemel cevap stratejisi
3. **Yol haritasi** — davanin 3 asamali (kisa/orta/uzun vadeli) plan tablosu
4. **Kritik karar noktalari** — avukatin kesin karar vermesi gereken anlar

### Girdi

- Dava ozeti (kunye + olay orgusu)
- Arastirma raporu (Ajan 2 standart ciktisi) — zorunlu onkosul
- Varsa: Advanced Briefing (risk toleransi, ton tercihi, muvekkil beklentisi)
- MemPalace: wing_{dava_turu}/hall_savunma_kaliplari + wing_buro_aykut

### Kaynak Prompt

Disaridan `C:\Users\user\Desktop\prompts\dava-strateji-analizi.md` adaptasyonu.
Sistem iclerinde henuz Gemini promptu yok (opsiyonel gelecekte `prompts/gemini/swot_strateji.md`
olarak tasinabilir; su an ana prompt Arastirmaci'nin bu bolumunden okunur).

### Cikti

Drive'a: `02-Arastirma/strateji-swot-raporu.md`

Cikti yapisi:

```markdown
[UYARI BANNER - yukaridaki kutu]

GUVEN NOTU:
- Arastirma raporu baslangic noktasi: [DOSYA YOLU]
- SWOT dort kutusu dolduruldu mu: [EVET]
- Rakip modellemesi: [3 hamle - EVET]
- Yol haritasi: [KISA/ORTA/UZUN vadeli tablo - EVET]
- Risk flag: [VAR - aciklama / YOK]

# SWOT Strateji Raporu - [Kritik Nokta]

## 0. Dava Kunyesi
[Mahkeme, esas, taraflar, muvekkil pozisyonu]

## 1. SWOT Matrisi

### Strengths (Guclu Yonler) - Ic / Lehimize
- [S1] ...
- [S2] ...

### Weaknesses (Zayif Yonler) - Ic / Aleyhimize
- [W1] ...
- [W2] ...

### Opportunities (Firsatlar) - Dis / Lehimize
- [O1] ...
- [O2] ...

### Threats (Tehditler) - Dis / Aleyhimize
- [T1] ...
- [T2] ...

## 2. Rakip Modellemesi (Karsi Tarafin En Guclu 3 Hamlesi)

### Hamle 1: [Adi]
- Beklenen icerik: ...
- Dayanak (Yargitay/kanun): ...
- Bizim cevabimiz: ...

### Hamle 2: [Adi]
- ...

### Hamle 3: [Adi]
- ...

## 3. Yol Haritasi

| Asama | Hedef | Eylem | Sure | Risk |
|---|---|---|---|---|
| Kisa vadeli (0-3 ay) | ... | ... | ... | ... |
| Orta vadeli (3-12 ay) | ... | ... | ... | ... |
| Uzun vadeli (12+ ay) | ... | ... | ... | ... |

## 4. Kritik Karar Noktalari

- [Karar 1] - [Ne zaman] - [Olasi secenekler]
- [Karar 2] - ...

## 5. Sonuc Notu

[2-3 cumlelik stratejik ozet - avukata tek bakista dusunme materyali]
```

### Ozel Kurallar

- Derin arama protokolu **UYGULANMAZ** (SWOT arastirma degil, sentezdir).
  Ancak Ajan 2 standart arastirma raporu **onkosul girdidir** — yoksa
  Director Agent'a "Once arastirma tamamlansin" uyarisi gonder, baslatma.
- SWOT kutulari **somut**, **olay-baglantili** olmali. Genel klise yasak.
  Ornek iyi: "[W2] Muvekkilin istifa dilekcesi var; haksiz fesih argumani
  ispat yuku bize aktariyor."
  Ornek kotu: "[W2] Delil durumu zayif olabilir."
- Rakip hamle modellemesinde **kunyeyi dogrula**; uydurma karar YAZMA.
- Yol haritasi tablosunda **spesifik tarihler** gerekirse "TAHMINI"
  isaretle (ornek: "Durusma: TAHMINI 2026 Q3").
- Cikti "taslak" karakterli; final karar avukatin.

### Kalite Kontrol (SWOT Moduna Ozel)

- [ ] **SWOT MODU AKTIF banner'i** en ustte ve gorunur mu?
- [ ] SWOT dort kutusu da **somut ornekle** dolu mu?
- [ ] Rakip modellemesinde **en az 3 hamle** var mi?
- [ ] Yol haritasi **3 asama** (kisa/orta/uzun) bir arada mi?
- [ ] Kritik karar noktalari **en az 2 tane** belirtildi mi?
- [ ] Sonuc notu **2-3 cumleyi** gecmiyor mu?

---

## Alt-Mode 3: Sozlesme Inceleme Modu

### Tetikleyici

```text
sozlesme incele: [sozlesme-dosyasi-yolu]
```

Ornek: `sozlesme incele: G:\Drive'im\Hukuk Burosu\Muvekkil Dosyalari\X Kira Sozlesmesi.pdf`

### Ne Yapar

Avukatin sundugu sozlesme metnini muvekkil lehine hukuki analizden gecirir.
Clause-by-clause inceleme yapar; emsal karar taramasi gerekiyorsa (ornek:
cezai sart orantililigi icin Yargitay egilimi) ana arastirma akisiyla
koordine eder.

**NOT (Scope Genisletme):** Sozlesme inceleme sistemin yeni acilmis bir
domain'idir (Tier C'den Tier A'ya tasindi - avukatin 2026-04-21 karariyla).
Ileride kullanilabilir diye sisteme dahil; dava dosyasina bagli zorunlu
adim degildir.

### Girdi

- Sozlesme metni (tam veya anlamli ozet)
- Sozlesme turu (is / kira / satis / hizmet / ortaklik / diger)
- Taraflar (PII tokenli)
- Muvekkilin pozisyonu (kiraci / isci / satici / hizmet alan / ...)
- Varsa: avukatin oncelikli sorulari

### Prompt

`prompts/gemini/sozlesme_inceleme.md`

### Cikti

Drive'a: `02-Arastirma/sozlesme-inceleme-raporu.md`
(veya sadece sozlesme analizi ise: `G:\Drive'im\Hukuk Burosu\Bekleyen Davalar\{konu}\01-Analiz\sozlesme-inceleme-raporu.md`)

### Ozel Kurallar

- Sozlesmede OLMAYAN maddeyi varmis gibi elestirme. "Sozlesmede m.15 yok,
  buraya gelmeli" seklinde **eksik tespiti** yapabilirsin.
- Revizyon onerilerinde **"Mevcut -> Onerilen -> Gerekce"** formati zorunlu.
- "Imzalamayin" / "Kesinlikle imzalayin" **YASAK**. Yerine: "Belirtilen
  revizyonlar yapilmadan imzalanmasi muvekkil icin risk tasimaktadir."
- Cezai sart orantililigi icin emsal Yargitay uygulamasi lazımsa **ana
  arastirma akisina flag dus**, atif yaparken kunye **dogrulanmis** olmali.
- KVKK: sozlesmedeki PII tokenlari aynen korunur, demask Director'un isi.
- Sozlesme 50+ sayfa ise **once kritik bolumleri** (yukumlulukler, fesih,
  cezai sart, uyusmazlik cozumu) tara, sonra digerleri icin **checklist
  bazli** inceleme yap.

### Kalite Kontrol (Sozlesme Moduna Ozel)

- [ ] **Muvekkil aleyhine maddeler tablosu** risk seviyesi ile dolduruldu mu?
- [ ] **Eksik hukumler** listesi somut onerilen metin ile birlikte verildi mi?
- [ ] **Cezai sart orantililigi** degerlendirildi mi?
- [ ] **Uyusmazlik cozumu maddeleri** (yetkili mahkeme, arabuluculuk, uygulanacak hukuk) muvekkil aleyhine mi denetlendi mi?
- [ ] Her revizyon onerisi **Mevcut -> Onerilen -> Gerekce** formatinda mi?
- [ ] Sonuc: **Imzalanabilir / Revizyon sonrasi / Imzalanmamali** acikca belirtildi mi?

---

## Ogrenilmis Dersler

Bos.

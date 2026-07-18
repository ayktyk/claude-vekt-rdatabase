# Claude for Legal vs. Hukuk Basasistani — Karsilastirmali Analiz

Son guncelleme: 2026-05-14
Kaynak: https://www.betaspacestudio.com/tr/resources/claude-for-legal-turk-hukuku
Karsilastirma hedefi: Anthropic `claude-for-legal` reposunun Turk hukuku
uygulanabilirlik analizinden bizim sisteme uyarlanabilecek ozellikleri
belirlemek; her oneri icin **fark yaratir mi**, **hiz mi kalite mi
artirir**, **uygulama maliyeti** ne kadardir sorularina net cevap vermek.

> Bu rapor TASLAK'tir. Tavsiyeler avukatin nihai degerlendirmesine tabidir.

---

## 0. Yonetici Ozeti (TL;DR)

Anthropic `claude-for-legal` repository'si **12 plugin / 151 skill** ile
**genis kapsamli ama Turkiye'ye sigh** bir yapidir. Yazinin sinifllamasinda
sadece **60 skill (~%40)** Turkiye icin "kutudan ciktigi haliyle calisir"
durumda; **75 skill (~%50)** "Turk profili + Turk MCP" ister ve manuel
playbook'lara muhtactir; **16 skill (~%10)** ABD doktriniyle (FRCP,
Delaware DGCL, USPTO) o kadar ic ice ki "yeniden yazim disinda kullanim
yok" denmis. Bizim sistem ise dar bir alanda (Turk litigation +
arastirma + dilekce) **derinligi yuksek**, **KVKK / UDF / mulga eleme /
adliye dogrulama / yetkisiz lehe yorum yasagi / Bedesten dogrulama**
gibi yarisi-ozgun yarisi-imza katmanlara sahiptir.

**Net cikarim:**
1. Litigation alaninda Anthropic'in repo'sundan ogrenecegimiz az,
   gosterecegimiz cok sey var (UDF, KVKK Seviye 2, adliye protokolu,
   Antigravity hibrit, 7 ASAMA + 4 kalite kapisi — hicbiri orada yok).
2. **Ana firsat: Anthropic'in plugin-mimarisi disiplini + alan
   genisligi.** Biz tek "dava ureten" otomatik bir sistem yapmisiz;
   onlar 12 farkli hukuk alanini ayri plugin'le modullestirmis.
   Plugin mimarisini kopyalamadan, **sik kullandigimiz "alt-mode"lari
   resmi plugin'e cevirip** her birine standardize SKILL.md frontmatter
   ve "playbook" sablonu eklersek, sistem hem genisler hem dokumante
   olur.
3. **Ana eksiklik: MarkaPatent MCP + KVKK uyumluluk modulu + Vergi
   modulu + UYAP scraping.** Bu dort modul Turkiye'deki avukat
   pazarinda real value yaratir; ilk uc tanesi 1-2 haftada eklenebilir
   bagimsiz modullerdir.
4. **Reddedilmesi gereken:** ABD-merkezli "Yargi cevresi sinifllamasi
   (A/B/C)", Anthropic'in tum plugin setini birebir kopyalama, "law-
   student" tarzi egitim modulleri, FRCP/Delaware tabanli sablon
   kutuphaneleri.

**Onceliklendirilmis bes oneri (detay Bolum 4):**

| # | Oneri | Hiz | Kalite | Effort | Oncelik |
|---|-------|-----|--------|--------|---------|
| 1 | SKILL.md standardize YAML frontmatter | Dusuk | Orta | 2 gun | **YUKSEK** |
| 2 | Playbook sistemi (sik dava turleri icin sablon) | YUKSEK | Orta | 1 hafta | **YUKSEK** |
| 3 | Plugin manifest + alt-mode'lari plugin'e cevir | Dusuk | YUKSEK | 1-2 hafta | ORTA |
| 4 | MarkaPatent MCP entegrasyonu | Yok (yeni alan) | YUKSEK | 2-3 gun (MCP varsa) | ORTA |
| 5 | KVKK uyumluluk modulu (VERBIS / DSAR / m.11 cevabi) | Yok (yeni alan) | YUKSEK | 1-2 hafta | **YUKSEK (avukat icin)** |

---

## 1. Anthropic `claude-for-legal` — Yapinin Ozeti

Yazidan cikarilan teknik haritalar:

### 1.1 Plugin Listesi (12 adet)

| Plugin | Konu | Turkiye basari orani (yazi) |
|--------|------|---|
| `legal-builder-hub` | Meta / yonetim araclari (skill kurulumu, registry-sync) | **%100** |
| `commercial-legal` | Ticari hukuk, sozlesme review (nda-review) | **%67** |
| `corporate-legal` | Sirket hukuku, M&A, board-minutes, entity-compliance | **%46** (Delaware DGCL gomulu) |
| `legal-clinic` | Genel hukuki danismanlik, ogrenci kisitlamasi | **%44** |
| `product-legal` | SaaS / urun hukuku, kullanici sozlesmesi | **%43** |
| `employment-legal` | Is hukuku, contract-review | **%35** |
| `privacy-legal` | KVKK / GDPR, dsar-response | **%33** |
| `ai-governance-legal` | AI model degerlendirme, EU AI Act | **%30** |
| `ip-legal` | Fikri mulkiyet, clearance, fto-triage, takedown | **%25** (USPTO icerigi reddediyor TR'yi) |
| `law-student` | Egitim, baro sinavi | **%23** (ABD baro sinavi gomulu) |
| `regulatory-legal` | Duzenleyici uyum (kurum veri akislari) | **%22** |
| `litigation-legal` | Dava hukuku, deposition-prep, legal-hold | **%21** (FRCP gomulu, UYAP yeniden yazim ister) |

Sayisal sonuc: **%21 ile %67 arasinda dagilan basari oranlari**;
litigation-legal'in en zayif olmasi onemli (cunku bizim odak noktamiz).

### 1.2 Skill Sinif Sistemi (Yesil / Sari / Kirmizi)

Yazi, 151 skill'i uc kategoride siniflandiriyor:

- **Yesil (n=60, %40):** Yargi cevresinden bagimsiz altyapi; tum
  ulkelerde "kutudan cikar gibi" calisir. Buyuk cogunlugu
  `legal-builder-hub` icinde.
- **Sari (n=75, %50):** Yapi var ama Turkiye'ye ozel kurallar yok.
  Kullanici CLAUDE.md profiline TBK / KVKK / Is Kanunu / TBB hukumlerini
  manuel yazip prompt mühendisligi ile baglamak zorunda. Ornek skill'ler:
  `dsar-response`, `nda-review`, `contract-review`.
- **Kirmizi (n=16, %10):** ABD hukukuna o kadar baglilar ki "Turkiye
  icin reddederim" diyor. Ornek: `clearance`, `fto-triage`, `takedown`
  (USPTO + Lanham Act), `board-minutes` + `entity-compliance` (Delaware
  DGCL), `deposition-prep` + `legal-hold` (FRCP).

### 1.3 Anthropic'in Kullandigi Soyutlamalar

Yazidan cikan kavramlar (teknik detay az, kavram cok):

1. **`CLAUDE.md` profili** — Yargi cevresini ("jurisdiction: Turkey")
   ve manuel mevzuat listesini barindiran konfigurasyon.
2. **`playbook`** — Bir skill'in calistirdigi adim adim is akisi.
   "Bos playbook" konsepti: Ust seviye semantik bos, kullanici dolurur.
   Ornek: "nda-review bos playbook'ta ABD'yi dayatmaz, YELLOW karari
   verir."
3. **MCP konektorleri** — Yazida bes Turk MCP'si referans:
   - **Mevzuat MCP:** Resmi Gazete + sektorel kurum (BDDK, SPK, EPDK,
     BTK, RTUK, SEDDK, MASAK) duzenlemeleri
   - **Yargi MCP:** Yargitay / Danistay / AYM icthadi
   - **YokTez MCP:** Tez veritabani
   - **MarkaPatent MCP:** TURKPATENT marka / patent / endustriyel
     tasarim
   - **Literatur MCP:** Hukuki literatur kaynaklari
4. **Kalite kapilari (mention)** — "Boş playbook'ta YELLOW verir"
   ifadesi quality-gate benzeri bir karar mantigi oldugunu gosteriyor
   (KIRMIZI = blokla, SARI = duzeltme gerek, YESIL = onayli) — bizim
   sistemdeki 4E sentez kararina cok benzer.

### 1.4 Yazinin Belirledigi 6 Eksiklik Modulu (Turkiye Pazari Icin)

Yazi sunu vurguluyor: Anthropic'in mevcut paket Turkiye'de **6 ana
modulden** yoksun:

1. **KVKK / VERBIS otomatik veri envanteri** ve bildirim taslagi
2. **UYAP entegrasyonu** (tevzi, safahat, e-tebligat analizi)
3. **MERSIS / Ticaret Sicili otomasyonu** (imza sirkuleri, UBO,
   VUK 529 kontrolu)
4. **Vergi / VUK / GIB risk analizi**
5. **TBB Meslek Kurallari** (reklam yasagi, etik denetim)
6. **Icra / Iflas Kanunu (IYK) sure takibi** ve takip hazirlama

Yazinin ana mesaji: "Mevcut plugin setinde **Turkiye icin hazir
kurallar yoktur** — her arac uyarlanmis profile ve Turk MCP'ye
ihtiyac duyar."

---

## 2. Bizim Sistemin Anthropic'e Gore Avantajlari (LEHTE FARK)

Asagidaki ozellikler bizde **isleniyor**, Anthropic'in repository'sinde
yok veya yetersiz. Bunlar **statu quo'mu koruyacagimiz** ve gerekirse
Anthropic'in playbook'una bile katki yapabilecegimiz alanlardir.

| # | Bizde olan | Anthropic'te durumu | Onem |
|---|---|---|---|
| 1 | **KVKK Seviye 2 maskeleme** (regex + dict, `scripts/maske.py`) | Yok — manuel CLAUDE.md profili oner | KRITIK |
| 2 | **0-Halusinasyon + Lehe Yorum Yasagi Doktrini** + Bedesten documentId zorunlu dogrulama | Yok — genel hukuki risk uyarisi var ama atif dogrulama protokolu yok | KRITIK |
| 3 | **UDF formati uretimi** (`scripts/md_to_udf.py`, format_id=1.7, UYAP-ready) | Yok | YUKSEK |
| 4 | **Yetkili Adliye Esleme Protokolu** (HSK + adalet.gov.tr WebSearch dogrulamasi, Istanbul tuzaklari haritasi) | Yok | YUKSEK |
| 5 | **Normlar Hiyerarsisi denetimi** (Anayasa > Antlasma > Kanun > OHAL CBK > IBK > CBK > Tuzuk > Yonetmelik > Teblig + Lex Superior / Specialis / Posterior) | Yok | YUKSEK |
| 6 | **Mulga eleme protokolu** (2B → 2C zinciri, olay tarihi versiyon kontrolu) | Yok | YUKSEK |
| 7 | **MemPalace buro hafizasi** (wing/hall/drawer + diary write + promotion + hakim/avukat profilleri) | Yok | YUKSEK |
| 8 | **5-ajan stratejik analiz paralel spawn** (Davaci / Davali / Bilirkisi / Hakim / Sentez) | Yok — "playbook" var ama coklu perspektif yok | YUKSEK |
| 9 | **Antigravity hibrit mimari** (terminal Claude MCP + Antigravity Gemini 3.1 Pro hukuki uretim) | Yok | OZGUN |
| 10 | **Iscilik alacaklari deterministik hesaplama modulu** (Excel formul mantigi, donem bazli kidem tavani, vergi dilimi kademeli) | Yok | YUKSEK |
| 11 | **Antigravity self-review** (her uretim sonu KIRMIZI / SARI / YESIL karar) | "playbook" oz-kontrolu var ama self-review olarak ozgun degil | ORTA |
| 12 | **7 ASAMA kullanici-kontrollu workflow** ("devam / atla / motor degistir / dur") | Yok — yazida "playbook" var ama kullanici-kontrolu adim adim degil | YUKSEK |
| 13 | **4 kalite kapisi** (post-Arastirma / post-Usul / post-Stratejik Analiz / post-Dilekce v2 UDF dogrulamasi) | Yok | YUKSEK |
| 14 | **Hata gecmisi sistemik bellek** (Tugba 2026-89, Mehmet Ali 2026-003, Selin Uyar 2026-003 dersleri SKILL.md icine gomulu) | Yok | OZGUN |
| 15 | **Aktor profilleri** (wing_hakim_{soyad}, wing_avukat_{soyad}) | Yok | OZGUN |

**Cikarim:** Bizim sistemin LITIGATION alanindaki derinligi Anthropic
litigation-legal plugin'inin %21 basarisinin ustunde. Yani Anthropic
o plugin'i bize satmaktansa, Anthropic'in bizden ogrenmesi muhtemel.
Bu nedenle "Anthropic'i bizim sisteme entegre etme" yerine **secici
adaptasyon** stratejisi mantikli — sadece bizde olmayan alanlardan
modulleri ekleyecegiz.

---

## 3. Anthropic'in Olu Sermaye Olarak Bize Sunabildigi (CARPI FARK)

Bu bolumde Anthropic'in pluginlerinden bizim icin **direkt
uyarlanabilen** veya **ilham veren** ozellikler yer aliyor. Her oneri
icin dort soru cevaplaniyor: (a) Ne yapar? (b) Bize ne fayda? (c)
Hangi metrige etkisi? (d) Uygulama maliyeti? Sonra **oncelik** atanir.

### 3.1 [YUKSEK ONCELIK] Standardize SKILL.md YAML Frontmatter Sablonu

**Ne yapar:** Anthropic'in skill formati standardize bir YAML frontmatter
ile baslar (name, description, when_to_use, allowed_tools, owner,
version). Bizim SKILL.md'lerimiz daha "serbest" formatli — ust kisimda
sadece "Son guncelleme" ve "Versiyon" var.

**Bize ne fayda:**
- Yeni ajan / alt-mode eklerken bos sablonun ne icermesi gerektigi net
- Hangi ajanin hangi MCP'leri / tool'lari kullanabildigi tek bakista
  goruluyor (yetkilendirme + audit izi)
- Director Agent komut esleme tablosunu otomatik turetebilir
- Versiyon takibi disiplinli olur, hata gecmisi annotasyonu kolaylasir

**Etki:**
- Hiz: Dusuk dogrudan etki ama yeni ozellik eklerken **2-3x hizlanma**
  saglar (bos sablonu doldur, devam et)
- Kalite: Orta — tutarlilik ve dokumantasyon iyilesir, runtime kalite
  fark etmez

**Uygulama maliyesi:** ~2 gun. 6 mevcut SKILL.md + 0-halusinasyon-doktrini
icin frontmatter uretmek + bir adet `templates/SKILL.md.template`
yazmak.

**Onerilen frontmatter:**

```yaml
---
name: dilekce-yazari
description: ASAMA 5 dilekce v1 + alt-mode (istinaf / temyiz / sozlesme)
version: 1.1
last_updated: 2026-03-27
owner: vibecosystem/buro-aykut
engine: antigravity_manual    # tek dogruluk: config/model-routing.json
model_routing_key: dilekce_yazimi
allowed_mcps:
  - mcp__claude_ai_Mevuzat_MCP__*
  - mcp__claude_ai_Yarg_MCP__*
  - mcp__buro-hafizasi__*
  - mcp__google_drive__*
forbidden_actions:
  - "Devir blogunu basmadan terminal Claude'da dilekce yazma"
  - "Uydurma Yargitay karari atfi"
  - "Maskeli token'lari unmask edip dilekceye yazma (KVKK)"
quality_gates:
  - "Gate 3 - Post-Dilekce: 0 dogrulanmamis atif, >=2 Yargitay atif, uslup-aykut.md geciyor"
  - "Gate 4 - UDF: format_id=1.7, leftMargin=70.87, content.xml YAML-free"
depends_on:
  - usul_raporu
  - arastirma_raporu
  - stratejik_analiz
hata_gecmisi:
  - "2026-05-05 Tugba 2026-89: NotebookLM cevabini farkli davaya tasidik"
  - "2026-05-06 Seydi Ahmet Baskaya: format ihlali + HARD FAIL"
---
```

**Reddedilmesi onerilen:** Anthropic'in tum frontmatter alanlarini
birebir kopyalamayalim. `tool_use_priority` / `model_family_lock` gibi
ABD-spesifik alanlari atlayalim.

---

### 3.2 [YUKSEK ONCELIK] Playbook Sistemi — Sik Dava Turleri Icin Hazir Sablon

**Ne yapar:** Anthropic'te "playbook" bir skill'in calistigi adim adim
is akisi. Bizim sistemde benzer mantik var ama davacinin **dava
turune gore** otomatik tetiklenen ozellestirilmis playbook yok. Su
anda avukat `kritik nokta` alani manuel doldurmasi gerekiyor.

**Bize ne fayda:**

Eger avukat su komutu verirse:

```
yeni dava: [MUVEKKIL_1], iscilik alacagi
playbook: iscilik-istifa-hakli-fesih
```

Sistem otomatik olarak:
1. **Kritik nokta tahmini** yapar (odenmemis fazla mesai nedeniyle istifanin
   hakli fesih sayilmasi)
2. **Dava sarti checklist** onceden dolu gelir (arabuluculuk son tutanagi,
   istifa dilekcesi, ibra sozlesmesi)
3. **Arastirma terim seti** onceden hazir (HGK kararlari + 9. HD / 22. HD
   + "haklı fesih" + "ödenmemiş fazla mesai" + "kıdem")
4. **Mevzuat seti** otomatik (Is K. m.17, m.24, m.32, m.41; HMK m.4; 7036
   s. K. m.3)
5. **Beklenen savunma kaliplari** onceden (ibra savunması, istifa
   savunması, zamanasimi 5 yil savunmasi)
6. **Hesaplama modulu** onceden tetiklenir (giydirilmis brut +
   tavan + kademeli vergi)

**Etki:**
- Hiz: **YUKSEK** — Avukatin "Advanced Briefing" doldurmasina gerek
  kalmaz, ASAMA 1'in cogu otomatik gelir, 7 ASAMA toplami **%30-40
  hizlanır**
- Kalite: Orta — kalite zaten yuksekti; playbook iceren dava turlerinde
  unutulan dava sartlari sifira iner

**Uygulama maliyesi:** ~1 hafta. 10 sik dava turu icin playbook
yazimi (`playbook/iscilik-istifa-hakli-fesih.md`,
`playbook/kira-tespit-tbk-344.md`, `playbook/tuketici-ayipli-mal.md`
vs.). Director Agent'a "playbook:" parametre tanima eklenir.

**Onerilen playbook formati:**

```yaml
---
name: iscilik-istifa-hakli-fesih
hukuk_alani: is-hukuku
oncelik_skoru: 8.5/10  # buroda kullanim sikligi
ortalama_dava_suresi: "15-18 ay"
kritik_nokta_taslagi: "Odenmemis [X] aylik fazla mesai nedeniyle iscinin istifasinin hakli fesih sayilarak kidem ve ihbar tazminatina hak kazanip kazanmadigi"
dava_sarti_checklist:
  - "Arabuluculuk son tutanagi (7036 s.K. m.3 — ZORUNLU)"
  - "Istifa dilekcesi (incelenmek uzere — hakli fesih argumani icin)"
  - "Ibra sozlesmesi (varsa fesihten 1 ay sonra mi imzalanmis)"
arastirma_terim_seti:
  yargi_terimleri:
    - "iscinin haklı fesih fazla mesai"
    - "istifanin haklı fesih sayilmasi"
    - "ibra sozlesmesi makbuz hukmu"
    - "imzalı bordro fazla mesai sutunu"
  mevzuat_maddesi:
    - "Is K. m.24/2"
    - "Is K. m.17"
    - "Is K. m.32 — fazla calisma"
    - "Is K. m.41 — fazla calisma ucreti"
    - "HMK m.4 — gorevli mahkeme"
    - "7036 s. K. m.3 — arabuluculuk"
beklenen_savunma_kaliplari:
  - kalip: "Ibra sozlesmesi ile alacak tasfiye edildi"
    karsilama: "Is K. m.34 ile uyumlu mu? Fesihten 1 ay sonra mi? Miktar gercek alacakla orantili mi?"
  - kalip: "Istifa belgesi serbest iradeyi yansitir"
    karsilama: "Y. 9.HD 2018/12345 (DOGRULANACAK): odenmemis alacak nedeniyle istifa hakli fesihtir"
hesaplama_tetigi: iscilik-hesaplama  # otomatik calisir
kalite_kapilari_ozel:
  - "Bordro imzalari kontrolu (ihtirazi kayit var mi?)"
  - "SGK donumu vs banka kayitlari kıyaslamasi"
turku_diger_aliskanliklar:
  - "Belirsiz alacak davasi vs kismi dava karari ASAMA 4'te 4D Hakim ile sentezlenir"
---
```

**Reddedilmesi onerilen:** Anthropic'in "playbook YELLOW karari ver"
mantigini bize tasimayalim — bizim 4E sentez (KIRMIZI / SARI / YESIL)
zaten cok daha karmasik bir karar mekanizmasi. Sadece playbook
sablon yapisini alalim, karar layer'lari oldugu gibi kalsin.

---

### 3.3 [ORTA ONCELIK] Plugin Manifest Disiplini — Alt-Mode'lari Plugin'e Cevir

**Ne yapar:** Bizim su anda **18 alt-mode** var ama bunlar SKILL.md
icinde "Alt-Mode:" basligi altinda dagilmis. Anthropic'in 12 plugin
formati alta-mode'lari ayri dosyalara koyup her birine bir
**plugin manifest** yazmamiza ilham veriyor.

**Mevcut alt-modlar (tespit):**

| Mevcut alt-mode | Hangi ajanda | Plugin onerisi |
|---|---|---|
| Muvekkil Bilgilendirme | Director | `iletisim-pluginli` |
| Strateji Degerlendirme (Dava vs Uzlasma) | Director | `strateji-pluginli` |
| Bilirkisi Denetleme | Arastirmaci | `bilirkisi-pluginli` |
| SWOT Strateji | Arastirmaci | `strateji-pluginli` |
| Sozlesme Inceleme | Arastirmaci | `sozlesme-pluginli` |
| Istinaf / Temyiz Yazimi | Dilekce Yazari | `ust-derece-pluginli` |
| Ihtarname / Sozlesme Yazimi | Dilekce Yazari | `belge-pluginli` |
| (Mevcut olmayan ama uyarlanabilir) | - | - |
| Iscilik hesaplama | Usul Uzmani / hesaplama modulu | `is-hukuku-pluginli` |

**Bize ne fayda:**
- Director Agent komut esleme tablosu **plugin manifest'lerinden
  otomatik turer** — yeni komut eklemek icin sadece manifest yazmak
  yetiyor
- Her plugin kendi prompts / sablonlar / kalite kapilari klasoru
  ile gelir — kod organizasyonu disiplini artar
- Plugin enable / disable yapilabilir (avukat istemiyorsa SWOT
  modulunu kapatabilir)
- Versiyonlama plugin bazinda olur, sistem ana versiyonundan bagimsiz
- Github / Drive paylasimi modul bazinda yapilabilir

**Etki:**
- Hiz: Dusuk runtime etki — derleyici dur, sadece organizasyon
- Kalite: YUKSEK uzun vadede — yeni alt-mode eklerken hata yapmak
  zorlasiyor, dokumantasyon disiplinli, regression daha az

**Uygulama maliyesi:** ~1-2 hafta. Ozellikle mevcut SKILL.md'lerden
alt-mode'lari ayrıştırma ve cross-reference linkleri guncelleme
zaman alir.

**Onerilen plugin manifest formati:**

```yaml
# plugins/strateji-pluginli/manifest.yaml
---
name: strateji-pluginli
version: 1.0.0
description: Dava strateji degerlendirmesi, SWOT analizi, uzlasma vs dava karari
owner: vibecosystem/buro-aykut
commands:
  - name: "strateji degerlendir"
    handler: prompts/strateji_degerlendirme.md
    engine: gemini  # config/model-routing.json'dan override edilebilir
  - name: "swot arastir"
    handler: prompts/swot_arastir.md
    engine: claude  # banner'li
sub_agents:
  - .claude/agents/strateji-uzmanı.md  # opsiyonel
required_inputs:
  - "arastirma-raporu.md veya hipotez listesi"
  - "usul-raporu.md (varsa)"
quality_gates:
  - "Karar matrisinde >=5 kriter"
  - "Olasilik dili (dusuk/orta/yuksek)"
  - "Karşı argument islendi"
mempalace_wings:
  read:
    - wing_buro_aykut/hall_strateji_tercihleri
    - wing_{dava_turu}
  write:
    - wing_ajan_strateji/hall_diary
    - wing_buro_aykut/hall_strateji_tercihleri (yeni tercih)
---
```

**Reddedilmesi onerilen:** Plugin sistemine **gercek modulerlik**
(npm-like package management, dependency resolution) eklemeyelim —
manifest seviyesinde kalalım. Bizim sistem 14 ajan icin halen dar bir
domain, package manager fazla muhendislik olur.

---

### 3.4 [ORTA ONCELIK] MarkaPatent MCP Entegrasyonu (TURKPATENT)

**Ne yapar:** Anthropic yazisi 5 Turk MCP'sinden bahsediyor; bizde 4
tane var (Yargi, Mevzuat, Literatur, Yoktez). **MarkaPatent MCP** yok.
TURKPATENT veritabanindan marka / patent / endustriyel tasarim arama
yapabilen bir MCP, fikri mulkiyet davalarinda kritik.

**Bize ne fayda:**
- Fikri mulkiyet ihlali davalarinda marka tescil tarihi / sinifi / sahibi
  dogrudan sorgulanabilir
- Bilirkisi denetleme alt-modunda marka karistirma analiziyle
  zenginlestirilir
- Yeni alt-mode `marka basvurusu inceleme` acilir
- Anthropic'in yazidaki %25 basari oranli `ip-legal` plugin'inin
  Turkiye yansimasi olur

**Etki:**
- Hiz: Yok (yeni alan, hizdan ziyade kapasite genislemesi)
- Kalite: YUKSEK — fikri mulkiyet davalarinda dogrudan veri kaynagi

**Uygulama maliyesi:**
- Eger MarkaPatent MCP **mevcut bir MCP** ise (Anthropic Composio / Rube
  uzerinden veya bagimsiz Open Source ise): 2-3 gun (config + Arastirmaci
  ajan icine 2F branch ekleme)
- Eger MCP **bizim yazmamiz gereken** bir sey ise: 2-3 hafta (TURKPATENT
  API'sinin acık olmamasi durumunda web scraping + KVKK + rate limit)

**Aksiyon:**
1. Once `mcp manager` / Rube / Composio'da MarkaPatent MCP var mi diye
   arastir (`RUBE_SEARCH_TOOLS "TURKPATENT marka patent"`)
2. Varsa: config'e ekle, Arastirmaci SKILL.md'ye 2F branch yaz
3. Yoksa: prioritized backlog, ip-legal alt-mode acmadan bu MCP olmali

**Reddedilmesi onerilen:** USPTO entegrasyonu, WIPO entegrasyonu — bizim
icin alaakasiz. Madrid Protokolu bilgilendirme metni manuel yazilabilir.

---

### 3.5 [YUKSEK ONCELIK — Avukatin Hukuk Pazarinda Konumu Icin] KVKK Uyumluluk Modulu

**Dikkat:** Bu KVKK Seviye 2 maskeleme (yapily, bizim ic guvenligimiz)
ile KARISTIRILMAMALI. Bu modul **avukatin musterilerine sundugu KVKK
uyumluluk hizmeti** icin — VERBIS bildirimi, Veri Sorumlusuna Basvuru,
DSAR (m.11) yaniti, ihlal bildirimi (m.12).

**Ne yapar:**
- Sirket muvekkilin veri envanteri tasimasi sirasinda otomatik VERBIS
  taslagı uretir
- KVKK m.11 erisim taleplerine standardize yanit metni hazirlar
- M.12 ihlal bildirimi taslagi (72 saat sure)
- KVKK m.7 silme / anonimlestirme talebi yanit
- KVKK Kurulu kararlari taranir (mevzuat MCP icinde zaten var)
- Aydinlatma metni + acik riza sablonu

**Anthropic'in `privacy-legal` plugin'i bu islerin GDPR/CCPA versiyonunu
yapiyor; %33 Turkiye basarisi var (yapı var, kurallar yazılmali).**

**Bize ne fayda:**
- Hukuk burosu yeni bir hizmet alanı (B2B KVKK danismanligi)
- KVKK m.18 idari para cezası riski olan musterilerde value yaratir
- Mevcut SKILL.md mimarisi ile kolayca eklenir

**Etki:**
- Hiz: Yok (yeni hizmet alani)
- Kalite: YUKSEK — bizim 0-Halusinasyon Doktrini ve atif dogrulama
  protokolu KVKK uyumlulugunda da gecerli, kalite avantaj

**Uygulama maliyesi:** ~1-2 hafta. Yeni alt-mode set'i (`kvkk verbis
hazirla`, `kvkk m11 yanit`, `kvkk m12 ihlal bildirimi`,
`kvkk aydinlatma metni hazirla`), her birine playbook +
ajan-spesifik SKILL.md.

**Reddedilmesi onerilen:** GDPR / CCPA / LGPD birebir entegrasyonu —
musteri Turkiye'de aktif degilse alaakasiz.

---

### 3.6 [DUSUK ONCELIK — Mevcut Mevzuat MCP'ye Kontrol] Sektorel Duzenleyici Kapsam

**Ne yapar:** Anthropic yazisi Mevzuat MCP'nin **BDDK, SPK, EPDK, BTK,
RTUK, SEDDK, MASAK** sektorel kurum duzenlemelerini de kapsadigini
soyluyor. Bizim Mevzuat MCP'mizde bu kurumlarin tum tebligleri /
yonetmelikleri var mi? Bunu **bilmiyoruz** — pilot dava arastirma
raporlarinda BDDK/SPK kararlari nadiren cikiyor.

**Aksiyon:** Bir pilot sorgu yap:
```
mevzuat search "BDDK" -t TEBLIG
mevzuat search "SPK" -t YONETMELIK
mevzuat search "MASAK" -t YONETMELIK
```
Eger eksikse: Mevzuat CLI fallback yetersizse, ek bir
"sektorel-duzenleme-MCP" gerekli olabilir. Eger varsa: bilgi var,
sadece arastirma terimi kullanimi disiplinlestirilebilir.

**Etki:** Pilot test sonrasi degerlendir.

---

### 3.7 [DUSUK ONCELIK / DELE — Avukat Karari] Diger Hukuk Alanlari Modulleri

Anthropic'in 12 plugin'inin bizim sistemde **direkt karsiligi olmayan**
alanlar:

| Anthropic Plugin | Bizim sistemde durum | Avukat karari |
|---|---|---|
| `corporate-legal` (M&A, board minutes) | Yok | Avukatin pazarinda var mi? Yoksa yapma. |
| `product-legal` (SaaS sozlesme) | Yok | Avukatin musteri portfoyune bagli |
| `regulatory-legal` (BDDK/SPK uyum) | Mevzuat MCP'de kismen | Pilot test sonrasi karar |
| `ai-governance-legal` (EU AI Act) | Yok | Trend olabilir, 2027+ |
| `legal-clinic` (genel danismanlik) | Director "muvekkil bilgilendir" alt-mode'unda zaten var | Eksiklik yok |
| `law-student` (egitim) | Bu sistem icin alaakasiz | RED |

**Cikarim:** Bu modulleri **avukatin pazar talebi olmadan eklemeyelim**.
Plugin manifest disiplini olunca her biri 1 haftada eklenebilir hale
gelecek; o zaman secimli ve gerektiginde eklenir.

---

### 3.8 [REDDEDILEN ONERILER]

Anthropic'in repository'sinden almamamiz gereken ozellikler:

1. **A/B/C Yargi cevresi sinifllamasi** — Bizim icin %100 Turkiye,
   bu kategori anlamsiz. Sinifllamayi dava turuyle (basit / orta /
   kompleks) yapalim, yargi cevresiyle degil.
2. **FRCP / Delaware DGCL gomulu sablon kutuphaneleri** — Direkt
   reddedilmesi gereken icerik. Yazi zaten bunlarin "Turkey'i acikca
   reddediyor" diyor.
3. **USPTO entegrasyonu / Lanham Act referanslari** — Alaakasiz.
4. **`law-student` plugin'i** — ABD baro sinavi gomulu, bizim icin
   sifir deger.
5. **`legal-builder-hub` registry-sync agent'i** — Bizim sistem
   Composio / Rube ile zaten dolu, ek bir registry mantigi gerekmiyor.
6. **Anthropic-spesifik tool_use_priority / model_family_lock**
   metadata alanlari — bizim model-routing.json yeterli.
7. **Plugin marketplace fikri** — Bizim sistemde yer yok, gereksiz
   muhendislik.

---

## 4. Onerilen Yol Haritasi

Onerileri **uygulanabilir faz**lara boldum. Her faz **kendi basina
deger uretir**, sonraki faz onceki ile yeni eklemeler yapar.

### FAZ 1 — Hizli Kazanimlar (1 hafta, dusuk risk)

**Hedef:** Plugin disiplinine on-adim, hiz icin playbook, dokumantasyon
iyilesmesi.

1. **SKILL.md frontmatter standardizasyonu** (~2 gun)
   - `templates/SKILL.md.template` yaz
   - 6 mevcut SKILL.md'ye + 0-halusinasyon-doktrini'ye frontmatter ekle
   - Director Agent'a "komut esleme tablosunu frontmatter'dan
     turetebilirsin" patch ekle (opsiyonel — manuel kalmasi da
     sorun degil)

2. **Playbook sistemi v1** (~3-4 gun)
   - `playbook/` klasoru olustur
   - 5 sik dava turu icin playbook yaz:
     - `playbook/iscilik-istifa-hakli-fesih.md`
     - `playbook/iscilik-kidem-tazminat-genel.md`
     - `playbook/kira-tespit-tbk-344.md`
     - `playbook/tuketici-ayipli-mal.md`
     - `playbook/kira-tahliye-temerrut.md`
   - Director Agent'a `playbook:` parametre tanimasi ekle
   - Avukatin Advanced Briefing'i atlamayi secebilmesi (playbook
     yeterli sayilir mi karari)

3. **Pilot test:** 2 yeni dava ile playbook kullan, hiz olcumu yap,
   `tmp/timing-faz1-vs-faz2.md` raporu uret.

**Beklenen kazanc:**
- Playbook iceren davalarda **%30-40 hizlanma** (Advanced Briefing
  + arastirma terim secimi otomatik)
- Yeni ajan / alt-mode ekleme **2-3x kolaylasir**
- Dokumantasyon disiplini artar, regression daha az

### FAZ 2 — Plugin Manifest Mimarisi (2 hafta, orta risk)

**Hedef:** Alt-mode'lari ayri plugin manifestlerine cevirmek, kod
organizasyonu disiplini.

1. **`plugins/` klasoru** olustur, 6 mevcut alt-mode'u plugin'e cevir:
   - `plugins/iletisim/`
   - `plugins/strateji/`
   - `plugins/sozlesme/`
   - `plugins/ust-derece/`  (istinaf + temyiz)
   - `plugins/bilirkisi/`
   - `plugins/hesaplama/`  (mevcut iscilik hesaplama buraya tasinir)

2. **Plugin manifest formati standardizasyonu**
   - Her plugin icin `manifest.yaml`
   - `commands.yaml`, `prompts/`, `playbook/`, `kalite-kapilari.md`
     alt klasorleri

3. **Director Agent komut esleme** plugin manifestlerinden otomatik
   turetir (yeni plugin ekleyince Director'i guncellemeye gerek
   kalmaz).

4. **Plugin enable/disable mekanizmasi** — `config/active-plugins.json`
   ile avukat secebilir.

**Beklenen kazanc:**
- Yeni plugin ekleme suresi: gun yerine **saat**
- Plugin'leri Drive'a / Github'a paylasmak mumkun olur (community)
- Sistem testleri plugin-bazli olusturulabilir (regression daha az)

### FAZ 3 — Yeni Hukuk Alani Modulleri (1 ay, secime bagli risk)

**Avukatin pazar karariyla** bu fazda hangi modul / modullerin
eklenecegi belirlenir. Onceliklendirme onerim:

1. **KVKK Uyumluluk Plugin'i** (1-2 hafta) — Avukatin musterilerine
   sundugu hizmet alanini genisletir, hukuk burosu B2B gelir
   potansiyeli.

2. **MarkaPatent MCP + IP-Plugin** (1 hafta, MCP varsa) — Fikri mulkiyet
   davasi alindiginda kritik.

3. **Vergi Plugin'i** (2-3 hafta) — VUK/GIB tebliglerine ozel
   arastirma, vergi davasi yazimi. Anthropic'te yok.

4. **Icra/Iflas Sure Takibi Plugin'i** (1-2 hafta) — Mevcut Google
   Calendar entegrasyonu + IYK sure matrisi.

5. **TBB Etik Denetim Plugin'i** (1 hafta) — Avukat icin oz-denetim
   araci (reklam yasagi kontrolu, sosyal medya postu ihlal mi).

**Beklenen kazanc:** Buronun hizmet portfoyu genisler, sistem
"litigation-only"den "tam servis hukuk asistani"na donusur.

### FAZ 4 — UYAP Scraping / Otomasyon (Uzun vadeli, yuksek risk)

**Hedef:** Anthropic'in yazida belirttigi UYAP entegrasyonu (tevzi,
safahat, e-tebligat) — bu mevcut MCP'lerle YAPILAMIYOR, browser
otomasyonu gerekiyor (Playwright + Vercel Agent Browser + KVKK).

**Bu Faz icin avukatin KARARI gerekli:**
- Hukuki sorumluluk: UYAP scraping baroya bildirilmeli mi?
- Teknik risk: e-imza akislari Playwright'la temsil edilebilir mi?
- Operasyonel: scraping ne sıklıkla? real-time vs günde 1x?

**Onerilen yol:** Once `browser-agent` ile pilot — sadece **safahat
sorgulamasi** (en az hassas islem). Basarili olursa diger islemlere
genislet.

---

## 5. Yazinin Bizim Sistem Acisindan En Onemli 3 Mesaji

1. **Anthropic Turkiye icin "boş playbook" felsefesi tutuyor — yani
   kurallari kullanici yazsin diyor.** Bizim sistem **Turkiye-ozel
   kurallari kabuga gomulu** sundugu icin lokalize bir butun. Bu bizi
   ASLA Anthropic'e direkt entegre yapacak konuma getirmiyor; sadece
   secici ozellik adaptasyonu mantikli.

2. **Anthropic'in 151 skill / 12 plugin yaklasimi modulerligi ogretiyor.**
   Bizim 18 alt-mode dagilim disiplinsiz; **plugin manifestiyle
   yeniden organize ettigimizde** yeni alan modulleri (KVKK, IP, Vergi)
   eklemek 1-2 hafta sürer, otomasyon olarak.

3. **MarkaPatent MCP eksikligi gercek bir doğru bosluk.** Geri kalan
   Anthropic kategorileri (corporate, AI governance, regulatory) bizim
   buro avukatlik profilimiz icin secime bagli; ama IP davası alip
   savunmamiz gerektigin de MarkaPatent MCP yok ise reactive arasriya
   donduk demek. Bu MCP'yi bagimsiz olarak prio'ya almaliyiz.

---

## 6. Risk Flag'leri ve Acik Sorular

Avukata sunulan acik sorular (FORLEGALCLAUDE.md'yi gozden gecirirken):

1. **Plugin mimarisini gercekten istiyor muyuz?** Mevcut sistem zaten
   18 alt-mode ile cogu hukuk alanini kapsiyor; plugin disiplini "kod
   guzelligi"nden öte ne uretir? Avukatin musteri portfoyu IP / KVKK
   uyumluluk yonunde geniseyecekse degerli; sadece litigation icin
   kalacaksa over-engineering.

2. **KVKK uyumluluk plugin'i avukatin gercekten istedigi servis mi?**
   Mevcut musteri portfoyune bakmak gerek. Eger sirket muvekkili az
   ise (cogunlukla bireysel iscilik / kira) bu plugin yok-deger.

3. **MarkaPatent MCP'yi sifirdan yazmak mantikli mi?** Once Rube /
   Composio / Anthropic Marketplace'de var mi kontrol; yoksa
   `harvest` agent ile web scraping pilot yapilabilir, ama TURKPATENT
   sitelerinde captcha + rate limit problem olabilir.

4. **Anthropic'in `legal-builder-hub` registry-sync agent'i bize ne
   sundugu** kesin degil — yazi detay vermiyor. Direkt repo
   kaynagini Github'da incelemek gerekebilir. Bu FORLEGALCLAUDE.md
   sadece yazidan turetilmis bir analiz; Anthropic repository'sinin
   gercek kaynagini gormeden tam isabet saglanmaz.

5. **Sektorel duzenleyici MCP'ler** — Bizim Mevzuat MCP'mizde gercekten
   BDDK / SPK / EPDK tebligleri var mi pilot test gerekli (Bolum 3.6).

---

## 7. Kaynak Dogrulama Tablosu

> 0-Halusinasyon Doktrini geregi her iddianin kaynak dogrulamasi:

| Iddia | Kaynak | Dogrulama durumu |
|---|---|---|
| Anthropic claude-for-legal'da 12 plugin var | betaspacestudio yazisi | **DOGRULANMIS** (yazi 2 kez teyit) |
| Toplam 151 skill var | betaspacestudio yazisi | **DOGRULANMIS** (Yesil 60 + Sari 75 + Kirmizi 16 = 151) |
| Litigation-legal Turkiye basari orani %21 | betaspacestudio yazisi | **DOGRULANMIS** |
| MarkaPatent MCP TURKPATENT'i kapsiyor | betaspacestudio yazisi | **DOGRULANMIS yazida**; ancak Rube/Composio'da varligi DOGRULANMADI |
| Mevzuat MCP BDDK/SPK/EPDK/BTK/RTUK/SEDDK/MASAK kapsiyor | betaspacestudio yazisi | **DOGRULANMASI GEREKIR** — bizim mevzuat MCP'mizde pilot sorgu yapilmadi |
| Anthropic'in SKILL.md formati YAML frontmatter ile basliyor | Genel Anthropic dokumantasyonu | **DOGRULANMASI GEREKIR** — yazi bu detayi vermiyor, sadece kavramsal |
| "Boş playbook YELLOW karari verir" konsepti var | betaspacestudio yazisi (`nda-review`) | **DOGRULANMIS yazida**; tam yapisi kaynak yetersiz |
| 6 modul eksiklik (KVKK / UYAP / MERSIS / Vergi / TBB / IYK) | betaspacestudio yazisi | **DOGRULANMIS** |
| Anthropic repository'sinin tam ic yapisi | Yazi yetersiz | **DOGRULANAMADI** — yazi yuksek seviye, Github repo'su gorulmedi |

**Risk flag'leri:**
- Bu rapor sadece **bir yazinin** turettigi analiz. Anthropic'in gercek
  `claude-for-legal` repository'sini Github'da incelemek olabilir,
  ozellikle "playbook" yapisinin formati ve plugin manifest formati
  icin. Avukatin onayi varsa: ikinci tur arastirma yapilir.
- "Anthropic SKILL.md formati" iddiası genel dokumantasyon bilgisinden
  cikarildi; betaspacestudio yazisi bu detayi vermedi.
- Onerilen frontmatter / playbook sablonlari bizim **yorum**umuzdur;
  Anthropic'in gercek formati farkli olabilir.

---

## 8. Sonuc ve Avukat Onayi Bekleyen Kararlar

**Acik soru — avukat karari:**

> **A.** Faz 1 (SKILL.md frontmatter + Playbook v1) ile baslamak ister
> misin? Bu **1 hafta** ve **hizli kazanimlar** verir, reversibledir.
>
> **B.** Faz 2 (Plugin manifest mimarisi) ile devam edilsin mi? Yoksa
> bu **over-engineering** mi sayar?
>
> **C.** Faz 3 (yeni hukuk alani modulleri) icin **hangi alan ilk**
> gelir? KVKK / IP / Vergi / Icra / TBB — bunlardan sirası nasil
> belirlenecek (musteri talebine gore mi, ilgi alanina gore mi)?
>
> **D.** Anthropic'in repository'sini Github'da inceleyip daha derin
> bir "Faz 0 — Arastirma" yapmak ister misin (1-2 gun ek arastirma,
> sonra Faz 1'e baslangic)?
>
> **E.** Reddedilen onerilerden (A/B/C sinifllama, FRCP sablonlari,
> law-student plugin'i) **hicbiri** geri alinmasi gereken oneri var mi?

**Onerim:** Avukat onaylarsa **D + A** kombini en saglikli. Yani
1-2 gun Anthropic repo'sunu Github'da incele (Faz 0); ardindan
bilgilenmis bir sekilde Faz 1'e gec. Bu, "yazidan analiz"den "kaynak
kod uzerine analiz"e gecisi saglar, FORLEGALCLAUDE.md v2 daha guvenli
oneriler icerir.

---

> TASLAK — Avukat onayina tabidir.
> Hazirlayan: Hukuk Basasistani (Claude / Antigravity hibrit; bu rapor
> Claude terminalde, MCP/arastirma asamasinda uretildi)
> Tarih: 2026-05-14

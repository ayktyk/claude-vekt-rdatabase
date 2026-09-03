# 5 Ajanli Stratejik Hukuk Analiz Sistemi - Is Diyagrami (v3)

Bu belge, bir dava arastirmasinin basindan sonuna kadar
sistemin nasil calistigini adim adim anlatir.

> UYARI: Tum ciktilar TASLAK'tir. Nihai karar avukata aittir.

---

## Felsefe

Sistem, dilekceyi **en sona birakir**. Dilekce yazilmadan once:

1. Belgeler tam anlamiyla okunur ve olgusal resim cikarilir
2. Briefing avukatla birlikte netlestirilir
3. Hukuki kritik noktalar belirlenir
4. Derin arastirma yapilir (Yargi MCP → Mevzuat MCP sirali zincir + mulga eleme; NotebookLM paralel)
5. Usul raporu araştirma bulgulariyla zenginlestirilmis halde yazilir
6. 5 ajanli stratejik analiz tum dosyaya yapilir
7. Dilekce v1 bu stratejinin yonlendirmesi altinda yazilir
8. Savunma simulasyonu ile zayif noktalar bulunur
9. Nihai dilekce v2 hem stratejik analizi hem savunma simulasyonunu
   iceren revize edilmis halde yazilir

Bu sayede dilekce, eksik bilgi uzerine kurulmus bir taslak olmaktan
cikip; arastirmayla, stratejiyle ve karsi taraf simulasyonuyla
sinanmis bir belge haline gelir.

---

## KVKK Seviye 2 Maskeleme — ZORUNLU PROTOKOL (Her Davada)

Muvekkil verisi LLM'e (bulut LLM saglayicisi (ABD), NotebookLM / Google ABD)
gitmeden ONCE yerel `scripts/maske.py` scripti uzerinden MASKELENIR. Motor
hicbir zaman ham muvekkil adi, TC kimlik, IBAN, telefon, e-posta veya tam
adresi gormez.

**Felsefe:** Muvekkil verisi -> maske.py -> [MUVEKKIL_N] / [TC_N] /
[ADRES_N] -> motor -> maskeli dilekce taslagi -> unmask -> nihai dilekce
(UYAP'a yuklenir).

### Maskelenme Kapsami

| Veri | Otomatik mi? | Token |
|------|--------------|-------|
| TC Kimlik (11 hane, algoritma dogrulu) | **Otomatik** (regex) | `[TC_N]` |
| IBAN (TR + 24 hane) | **Otomatik** (regex) | `[IBAN_N]` |
| Telefon (+90 5XX... / 05XX...) | **Otomatik** (regex) | `[TEL_N]` |
| E-posta | **Otomatik** (regex) | `[EPOSTA_N]` |
| Muvekkil adi | **Manuel** (dict) | `[MUVEKKIL_N]` |
| Karsi taraf adi | **Manuel** (dict) | `[KARSI_TARAF_N]` |
| Tam adres | **Manuel** (dict) | `[ADRES_N]` |
| Hakim / avukat adi | **Maskelenmez** — kamu bilgisi | (ham kalir) |
| Yargitay karar metinleri | **Maskelenmez** — kamuya ait | (ham kalir) |
| Noter yevmiye no | Opsiyonel | `[NOTER_N]` |
| Dava dosya no (mahkeme) | Maskelenmez | (ham kalir) |

### 4 Adimli Workflow

**ADIM 1 — Dava acilistinda dict kurulumu:**
Avukat dava acmadan once `scripts/maske.py` ile muvekkil ve karsi taraf
isimlerini, adreslerini dict'e ekler. Dict dosyasi
`config/masks/{dava-id}.json` yerel diskte saklanir — LLM saglayicisina asla
gitmez, git'e commit edilmez.

```bash
cd scripts
python maske.py --dict selin-uyar-2026-003 add \
  --muvekkil "Selin Uyar" "Recep Uyar" \
  --karsi-taraf "Hacire Karakurt" \
  --adres "Baris Mah. Palmiye Sk. No:4/7 Beylikduzu/Istanbul" \
          "Sumer Mah. 8/1 Sk. No:7 D:4 Zeytinburnu/Istanbul"
```

**ADIM 2 — Avukat motora MASKELI komut verir:**

```
yeni dava: [MUVEKKIL_1] (kiraya veren) + [MUVEKKIL_2] (tapu maliki) - Kira tespit
karsi taraf: [KARSI_TARAF_1]
tasinmaz: [ADRES_2]
mevcut kira 13.000 TL, hedef 35.000 TL
dava-id: selin-uyar-2026-003
kritik nokta: TBK 344/3 5 yil kurali + karsi vekalet yememe
```

**ADIM 3 — Motor tum ASAMA ciktilarini MASKELI verilerle uretir:**

- Briefing, usul raporu, arastirma, stratejik analiz, dilekce v1-v2 — hepsinde
  `[MUVEKKIL_1]`, `[TC_1]`, `[ADRES_2]` gibi token'lar yer alir
- NotebookLM sorgusu yaparken de maskeli token'lar kullanilir
- Yargi CLI ve Mevzuat CLI zaten Turkiye'de, ham veri onlara gidebilir (kamu veri)

**ADIM 4 — Nihai dilekceyi UYAP'a yuklerken unmask + DOCX/UDF:**

```bash
python maske.py --dict selin-uyar-2026-003 unmask dilekce-v2.md dilekce-v2.final.md
python scripts/md_to_docx.py <dava-klasoru>   # UYAP icin DOCX
python scripts/md_to_udf.py dilekce-v2.final.md  # UYAP icin UDF
```

`dilekce-v2.final.md` gercek verilerle dolu — bu dosya UYAP'a yuklenir
(DOCX/UDF'ye cevrildikten sonra). Maskeli taslaklar Drive'da arsiv olarak
kalir, gercek veri yalniz UYAP'a giden son belgede olusur.

### Muvekkil Belgeleri (JPEG, PDF, UDF) Maskeleme

Muvekkilin telefonundan cektigi fotograflar (kira sozlesmesi, vekaletname, tapu):

- **Simdilik:** bagli motor multimodal OCR ile fotografi okur — bu sirada ham
  veri LLM saglayicisina gider (Seviye 2'nin eksik noktasi, Seviye 3'te yerel
  OCR ile cozulecek).
- **Cikti sonrasi:** Motor okuma sonucunu MD dosyasi olarak kaydederken
  cikartir PII verisini; maskeli MD olarak saklar. Sonraki ASAMA'lar
  maskeli MD ile calisir.
- **Nihai hedef (Seviye 3):** Tesseract + Turkce yerel OCR ile fotograflar
  maskelenmeden once motora gonderilmez.

Detay: `arsiv/eski-notlar/BRAINSTORMING.md` § 1.5 + `docs/maskeleme-kilavuzu.md`.

### Dict Dosyasi Guvenligi

- Konum: `config/masks/{dava-id}.json` — yerel disk
- `.gitignore` ile git'e girmiyor
- Drive'a backup edilmemeli (KVKK ihlali)
- Gercek veri ile maskeli token arasindaki eslesme bu dosyada — paylasma
- `maske.py show-dict` komutu gercek veriyi gosterir, sadece debug icin kullan

### Istisnalar (Maskelenmeyen)

- Hakim isimleri — kamuya acik mahkeme kadrosu
- Karsi taraf avukatinin adi — baro sicil kamuya acik
- Yargitay / HGK / IBK karar metinlerindeki kisi adlari — kararin kendisi kamuya aittir
- Dava dosya numarasi — mahkeme sistemine kayitli
- Arabuluculuk dosya numarasi — Adalet Bakanligi sistemi

### Diger KVKK Onlemleri

- API anahtarlari yalniz `config/.env`de saklanir, hic bir ciktiya eklenmez
- Drive paylasim ayari yalniz buro hesabi
- MemPalace, QMD %100 lokal kalir (ham veri icerebilir, LLM saglayicisina gitmez)
- Saglayicinin Zero Data Retention (ZDR) secenegi — kullanilan motorun planindan kontrol edilecek
- Session bitince `config/masks/*.json` dict dosyalari gorunur olur; uzun
  vadede encrypt edilebilir (ag/loop sonrasi)

### Iyilestirme Yol Haritasi (Ozet)

- **Seviye 2 (simdi):** Manuel dict + regex otomatik maskeleme CALISIR
- **Seviye 3 (PC guclenince):** Yerel OCR (Tesseract Turkce) + yerel LLM (Ollama)
- **Seviye 4 (uzun vadeli):** Turkiye ici no-retention bulut + UYAP entegrasyonu

Detay planlar: `arsiv/eski-notlar/BRAINSTORMING.md`. Tam kullanim ornekleri: `docs/maskeleme-kilavuzu.md`.

---

## Roller ve Motor (tek motor)

Sistem **tek motorla** çalışır: oturumu hangi LLM ile açtıysanız o. Ayrım motor
ayrımı değil **görev ayrımıdır** (`config/motor-haritasi.json` → `roller`):

- **ORKESTRATOR:** MCP çağrıları, hesaplama (deterministik formül), orkestrasyon,
  Drive/MemPalace yazımı, `qmd update` / `md_to_docx.py` / `md_to_udf.py`
- **ARASTIRMACI:** Yargı / Mevzuat / NotebookLM derin araştırması, araştırma sentezi
- **MUHAKEME:** usul raporu, 5-ajan stratejik analiz, dilekçe, savunma simülasyonu, revizyon
- **DENETCI:** her hukuki çıktı sonrası sıfır bağlamlı bağımsız denetim
  (`ajanlar/denetci/SKILL.md`); KIRMIZI'da çıktı Drive'a yazılmaz

Elle devir bloğu, kopyala-yapıştır ve harici panel yoktur; ASAMA 0-7 aynı oturumda akar.
ASAMA 5-6-7 (yaz → eleştir → revize) ardışık yürür, her çıktı ayrı denetimden geçer.
Tarihçe (iki motorlu dönem): `arsiv/eski-notlar/ANTIGRAVITY.md`. <!-- vendor-ok: tarihçe kaydı -->


## Cikti Format Kurallari (Zorunlu)

Her ASAMA ciktisi UC formatta uretilebilir; **MD ve DOCX zorunlu**, **UDF
sadece nihai dilekce + istinaf/temyiz**. Avukat MD'yi tarayici/IDE'de okur
ama duzenleme ve yazdirma icin DOCX gerekir; UYAP'a yukleme icin UDF gerekir.

| Cikti | MD | DOCX | UDF | Uretim Yontemi |
|---|---|---|---|---|
| `00-Briefing.md` | ZORUNLU | ZORUNLU | - | Director + `md_to_docx.py` |
| `01-Usul/usul-raporu.md` | ZORUNLU | ZORUNLU | - | Usul Uzmani + `md_to_docx.py` |
| `02-Arastirma/arastirma-raporu.md` | ZORUNLU | ZORUNLU | - | Arastirmaci + `md_to_docx.py` |
| `02-Arastirma/stratejik-analiz.md` | ZORUNLU | ZORUNLU | - | 5 Ajan + `md_to_docx.py` |
| `02-Arastirma/savunma-simulasyonu.md` | ZORUNLU | ZORUNLU | - | Savunma Simulatoru + `md_to_docx.py` |
| `dilekce-v1.md` | ZORUNLU | ZORUNLU | - | Belge Yazari + `md_to_docx.py` |
| `dilekce-v2.md` (NIHAI) | ZORUNLU | ZORUNLU | **ZORUNLU** | Revizyon + `md_to_docx.py` + `md_to_udf.py` |
| `istinaf-dilekcesi.md` | ZORUNLU | ZORUNLU | **ZORUNLU** | Belge Yazari (alt-mod) + her iki script |
| `temyiz-dilekcesi.md` | ZORUNLU | ZORUNLU | **ZORUNLU** | Belge Yazari (alt-mod) + her iki script |
| `revizyon-raporu.md` | ZORUNLU | ZORUNLU | - | Revizyon + `md_to_docx.py` |
| `bilirkisi-denetim-raporu.md` | ZORUNLU | ZORUNLU | - | Arastirmaci (alt-mod) + `md_to_docx.py` |
| `muvekkil-bilgilendirme-{tarih}.md` | ZORUNLU | ZORUNLU | - | Director (alt-mod) + `md_to_docx.py` |
| `strateji-degerlendirme-{tarih}.md` | ZORUNLU | ZORUNLU | - | Director (alt-mod) + `md_to_docx.py` |

**Tetikleme:** Director Agent her ASAMA bitiminde **otomatik olarak**
`python scripts/md_to_docx.py {dava-klasoru}` calistirir. Klasordeki tum
yeni .md dosyalari .docx'e cevrilir (mevcut .docx'ler uzerine yazilir).
Avukat manuel olarak da calistirabilir.

**UDF tetikleme:** Sadece ASAMA 7 (dilekce-v2) ve istinaf/temyiz alt-modu.
Revizyon Ajani veya Belge Yazari (istinaf/temyiz) kendi cikti tetiklemesinde
`python scripts/md_to_udf.py <input.md>` calistirir. UDF UYAP icin
"format_id=1.7" zorunlu, scripts/md_to_udf.py structure-aware generator
(detay: `ajanlar/revizyon-ajani/SKILL.md` -> "UDF Uretimi" bolumu).

**KVKK + DOCX/UDF sirasi:** Maskeli MD -> DOCX uretilir (avukat editleyebilir
ama maskeli kalir). UYAP'a yuklenecek nihai DOCX/UDF icin avukat once
`python scripts/maske.py unmask` ile gercek veriye cevirir, **sonra**
`md_to_docx.py` veya `md_to_udf.py` calistirir. Maskeli arsivler Drive'da
kalir, gercek veri sadece UYAP'a giden son belgede olusur.

---

## Tam Akis - Kus Bakisi

```
AVUKAT
  |
  | "yeni dava: Ahmet Yilmaz, iscilik alacagi
  |  ozet: 7 yil calistiktan sonra hakli fesih yapti
  |  kritik nokta: ..."
  |
  v
=================================================================
  ASAMA 0: MEMPALACE WAKE-UP (Director Agent - Buro Hafizasi)
=================================================================
  |
  |-- mempalace_status (palace sagligi + L0/L1 context)
  |-- wing_buro_aykut'tan avukat tercihleri
  |-- wing_{dava_turu}/hall_argumanlar (olgun argumanlar)
  |-- wing_{dava_turu}/hall_arastirma_bulgulari (ham bulgular)
  |-- wing_{dava_turu}/hall_kararlar
  |-- wing_{dava_turu}/hall_usul_tuzaklari
  |-- wing_ajan_*/hall_diary (5 ajanin gecmis ogrenmeleri)
  |-- (varsa) wing_hakim_*, wing_avukat_*
  |
  |  Cikti: Buro hafizasi context'i (ajan briefing'lerine enjekte edilir)
  |  "MEMORY MATCH" varsa raporda belirtilir, sifirdan uretilmez.
  |
  v
=================================================================
  ASAMA 1: HAZIRLIK (Director Agent)
=================================================================
  |
  |-- [1.1] Belge inceleme (muvekkilin verdigi tum dosyalar)
  |-- [1.2] Olgusal kronoloji cikarma
  |-- [1.3] Dava hafizasi / Drive klasoru olustur
  |-- [1.4] Kaynak sorgulama (avukata sor)
  |-- [1.5] Advanced briefing (zorunlu degil ama tavsiye edilen)
  |-- [1.6] Hukuki kritik noktalar belirleme
  |      (birincil + ikincil + riskli noktalar)
  |
  |  Cikti: 00-Briefing.md (olgular + kritik noktalar + strateji iskeleti)
  |
  v
=================================================================
  ASAMA 2: DERIN ARASTIRMA (2B→2C sirali zincir + 2D async paralel kol)
=================================================================
  |
  |  REVIZYON 2026-07-09: 2A Suer Stajyer ve Faz D Arguman.ai
  |  ARSIVLENDI (arsiv/README.md). Ana omurga Yargi-MCP-Pro.
  |  2D paralel kol ve 2B → 2C sirali zincir AYNI ANDA baslar.
  |  Hepsi tamamlaninca tek konsolide rapor uretilir.
  |
  |  NOT (2026-05-19): 2E Akademik Doktrin kolu (DergiPark + YOK Tez)
  |  kaldirilmisti; akademik kaynak gerekirse NotebookLM veya
  |  Yargi-MCP-Pro tam metin atifi uzerinden gelir.
  |
  +-- ASYNC PARALEL KOL -------------------------------------------
  |   |
  |   `-- [2D] NotebookLM -----> buro kaynaklari (ITERATIF SORGU)
  |             |
  |             |  NotebookLM Sorgu Kurallari:
  |             |  - Her soruda "SADECE KAYNAKLARA GORE CEVAP VER,
  |             |    UYDURMA YAPMA" ibaresi ZORUNLU
  |             |  - Iteratif sorgulama: tatmin olunana kadar
  |             |    EN AZ 6 SORU + 4 PERSPEKTIF (davaci/davali/
  |             |    bilirkisi/hakim) = TOPLAM en az 10 sorgu
  |
  +-- SIRALI ZINCIR (2B → 2C, paralelden CIKARILDI) --------------
      |
      |-- [2B] YARGI-MCP-PRO (ARASTIRMACI — iteratif derin protokol)
      |       Birincil: mcp__yargi-mcp-pro__ictihat_ara, ictihat_getir
      |       Fallback: yargi CLI (MCP fail durumunda)
      |       Cikti: kararlar + her kararin atif yaptigi mevzuat maddeleri
      |       v
      |-- [2C] YARGI-MCP-PRO MEVZUAT (ARASTIRMACI (MAX EFFORT)) — FAZ 2 2026-05-19
      |       Birincil: mcp__yargi-mcp-pro__mevzuat_ara, mevzuat_icinde_ara, mevzuat_getir
      |       Fallback: mevzuat CLI (MCP fail durumunda)
      |       Girdi: 2B'nin atif maddeleri listesi
      |       v
      |-- MULGA / GUNCEL DENETIMI (her madde icin)
      |       - Yururluk: madde bugun yururlukte mi?
      |       - Mulga tarihi: yurulukten kaldirildi mi?
      |       - Olay tarihi versiyonu: o tarihte hangi versiyon yururlikteydi?
      |       - Zimni ilga: yeni kanun eskiyi ilga etmis mi?
      |       v
      |-- ELEME (kalite kapisi)
      |       GECERLI    → rapora alinir
      |       TARIH UYUMSUZ → "olay tarihi versiyonu Y" notuyla alinir
      |       MULGA ATIF → "[DEGER YOK]" ELENIR (rapora girmez)
      |       ZIMNI ILGA → "[ESKI NORM]" ELENIR
      |       Eleme sonrasi min 5 GECERLI karar sarti
      |
      `-- (SAGLIK KONTROLU: MCP istemcisinin sunucu listesiyle Pro MCP baglantisi dogrulanir.
          check_government_servers_health Pro MCP'de kaldirildi — FAZ 2 2026-05-19)

  |  Cikti: 02-Arastirma/arastirma-raporu.md
  |        - "Gecerli Kararlar" tablosu (rapora alinanlar)
  |        - "Elenen Kararlar" tablosu (rapor disi + sebep)
  |
  v
=================================================================
  ASAMA 3: USUL RAPORU (Arastirma Bulgulariyla Zenginlestirilmis)
=================================================================
  |
  |-- Ajan: Usul Ajani
  |-- Girdi: 00-Briefing.md + arastirma-raporu.md + legal.local.md
  |
  |  Icerik:
  |  - Gorevli / yetkili mahkeme
  |  - Zamanasimi hesabi (guncel ictihatla teyitli)
  |  - Arabuluculuk zorunlulugu
  |  - Harc tahmini
  |  - Risk analizi (arastirma bulgulari dahil)
  |  - Muvekkil checklist
  |  - Belge checklist
  |  - Hesaplamalar (iscilik davasiysa)
  |
  |  Cikti: 01-Usul/usul-raporu.md
  |
  v
=================================================================
  ASAMA 4: 5 AJANLI STRATEJIK ANALIZ (TUM DOSYA UZERINDEN)
=================================================================
  |
  |  Bu asamada henuz dilekce YAZILMAMISTIR.
  |  5 ajanli sistem; briefing + arastirma + usul raporu
  |  uzerinden calisarak strateji cikarir.
  |
  |  Girdi: 00-Briefing.md + arastirma-raporu.md + usul-raporu.md
  |         + muvekkilden gelen belgeler
  |         tek bir "Dosya Paketi" olarak toplanir
  |
  |              DOSYA PAKETI
  |                    |
  |     +--------------+--------------+--------------+
  |     |              |              |              |
  |     v              v              v              v
  | DAVACI AVK    DAVALI AVK    BILIRKISI       HAKIM
  | (lehimize)    (aleyhimize)  (teknik)        (karar)
  |     |              |              |              |
  |     v              v              v              v
  | guclu 5 arg   tehlikeli 5     teknik         bozma riski
  | ek delil      itiraz         degerlendirme   muhtemel karar
  | strateji      zayif nokta    eksik husus     ek sorular
  |     |              |              |              |
  |     +--------------+--------------+--------------+
  |                    |
  |                    v
  |            SENTEZ & STRATEJI AJANI
  |                    |
  |                    v
  |     +------------------------------+
  |     | 1. Dosya ozeti               |
  |     | 2. En guclu 3 arguman        |
  |     | 3. En buyuk 3 risk + cozum   |
  |     | 4. Genel strateji onerisi    |
  |     | 5. Dilekce YAZIM REHBERI     |
  |     |    (hangi argumanlar, hangi  |
  |     |     ton, hangi karar atiflari)|
  |     | 6. Durusma stratejisi        |
  |     | 7. Son tavsiye:              |
  |     |    KIRMIZI / YESIL / SARTLI  |
  |     +------------------------------+
  |
  |  Cikti: 02-Arastirma/stratejik-analiz.md
  |
  |  ONEMLI: Bu asamada dilekce henuz yazilmaz.
  |  Cikti dilekce icin "yazim rehberi" niteligindedir.
  |
  v
=================================================================
  ASAMA 5: DILEKCE v1 (Stratejik Analiz Rehberligi ile)
=================================================================
  |
  |-- Ajan: Belge Yazari
  |-- Girdi: 00-Briefing.md + arastirma-raporu.md + usul-raporu.md
  |         + stratejik-analiz.md (YAZIM REHBERI)
  |
  |  Dilekce stratejik analizin "yazim rehberi" bolumunu
  |  takip ederek yazilir. Artik bos bir sayfadan degil;
  |  karsi tarafin itirazlarini onceden gormus, hakim
  |  perspektifini dikkate almis bir stratejik zeminle baslar.
  |
  |  Icerik:
  |  - Olaylar (kronolojik, olgusal)
  |  - Hukuki degerlendirme (strateji tarafindan onerilen argumanlar)
  |  - Deliller
  |  - Hukuki nedenler
  |  - Sonuc ve talep (her kalem ayri, net tutar)
  |
  |  Cikti: 03-Sentez-ve-Dilekce/dilekce-v1.md
  |
  v
=================================================================
  ASAMA 6: SAVUNMA SIMULASYONU
=================================================================
  |
  |-- Ajan: Savunma Simulatoru
  |-- Girdi: dilekce-v1.md + arastirma-raporu.md + stratejik-analiz.md
  |
  |  Karsi tarafin gozuyle incele:
  |  - En guclu itirazlar neler?
  |  - Delil itirazlari neler?
  |  - Usul itirazi gelir mi?
  |  - Hakimin muhtemel sorusu ne?
  |  - Dilekcenin hangi bolumleri zayif kaliyor?
  |
  |  Cikti: 02-Arastirma/savunma-simulasyonu.md
  |
  v
=================================================================
  ASAMA 7: NIHAI DILEKCE v2 (Revizyon)
=================================================================
  |
  |-- Ajan: Revizyon Ajani
  |-- Girdi: dilekce-v1.md + stratejik-analiz.md + savunma-simulasyonu.md
  |
  |  Dilekce iki katmandan gelen tum bulgularla guclendirilir:
  |
  |  A) Stratejik analizden gelen:
  |     - Eksik arguman varsa eklenir
  |     - Zayif arguman varsa guclendirilir
  |     - Ton stratejiye uygun hale getirilir
  |
  |  B) Savunma simulasyonundan gelen:
  |     - Karsi tarafin en guclu itirazlari proaktif karsilanir
  |     - Delil itirazlarina karsi ek delil talebi eklenir
  |     - Usul itirazlari icin on pozisyon alinir
  |     - Hakimin muhtemel sorulari icin cevap altyapisi hazirlanir
  |
  |  Bu dilekce, "son soz dilekce" seviyesindedir.
  |
  |  Cikti: 03-Sentez-ve-Dilekce/dilekce-v2.md (NIHAI)
  |
  v
=================================================================
  CIKTI: Avukata Teslim
=================================================================

  Drive'a kaydedilen dosyalar (sirayla olusturulur):

  00-Briefing.md                        (Asama 1)
  02-Arastirma/arastirma-raporu.md      (Asama 2)
  01-Usul/usul-raporu.md                (Asama 3)
  02-Arastirma/stratejik-analiz.md      (Asama 4 - 5 ajan)
  03-Sentez-ve-Dilekce/dilekce-v1.md    (Asama 5)
  02-Arastirma/savunma-simulasyonu.md   (Asama 6)
  03-Sentez-ve-Dilekce/dilekce-v2.md    (Asama 7 - NIHAI)

  MemPalace'e yazilan diary'ler (her asama sonunda):

  wing_ajan_davaci/hall_diary           (Asama 4)
  wing_ajan_davali/hall_diary           (Asama 4)
  wing_ajan_bilirkisi/hall_diary        (Asama 4)
  wing_ajan_hakim/hall_diary            (Asama 4)
  wing_ajan_sentez/hall_diary           (Asama 4)
  wing_{dava_turu}/hall_argumanlar      (Asama 7 - basarili argumanlar)
  wing_buro_aykut/hall_avukat_tercihleri (Asama 7 - varsa yeni tercih)
```

---

## Adim Adim Detayli Akis

### ASAMA 1: Hazirlik

> **Rol:** MUHAKEME | **Routing:** `kritik_nokta_tespiti` + `arama_plani` | **Denetim:** DENETCI (`ajanlar/denetci/SKILL.md`)
> Not: Drive klasor olusturma ve kaynak sorgulama MCP cagrilari ORKESTRATOR'da kalir.

Bu asamada hic hukuki arastirma yapilmaz. Sadece olgusal
resim cikarilir ve kritik noktalar netlestirilir.

```
[1.1] BELGE INCELEME
  |
  |-- Muvekkilin verdigi tum dosyalari oku
  |     - Mailler, yazismalar, ihtarnameler
  |     - Sozlesmeler, bordrolar, SGK belgeleri
  |     - Ses kaydi, video, mesaj kaydi varsa
  |
  |-- Her belge icin kisa ozet cikar
  |-- Tarih/taraf/konu uclusunu not et
  |
[1.2] OLGUSAL KRONOLOJI
  |
  |-- Butun olaylari tarih sirasina koy
  |-- Kim ne yapti, ne zaman yapti
  |-- Celiski noktalarini isaretle
  |
[1.3] DAVA HAFIZASI / DRIVE KLASORU
  |
  |-- Google Drive'da dava klasoru olustur:
  |     G:\Drive'im\Hukuk Burosu\Aktif Davalar\
  |     {YIL}-{SIRA} {Muvekkil} - {Dava Turu}\
  |       |-- 00-Briefing.md
  |       |-- 01-Usul/
  |       |-- 02-Arastirma/
  |       |-- 03-Sentez-ve-Dilekce/
  |       |-- 04-Muvekkil-Belgeleri/
  |       `-- 05-Durusma-Notlari/
  |
[1.4] KAYNAK SORGULAMA (ZORUNLU)
  |
  |-- Avukata sor: "Hangi kaynaklar hazir?"
  |     [ ] NotebookLM notebook (adi?)
  |     [ ] Google Drive klasoru (yol?)
  |     [ ] Yerel dosya
  |     [ ] Hazir kaynak yok
  |
  |-- Cevap bekle. Cevap gelmeden ASLA ajan baslatma.
  |
[1.5] ADVANCED BRIEFING (TAVSIYE EDILEN)
  |
  |-- Dava teorisi (birincil + paralel temeller)
  |-- En buyuk risk (karsi tarafin savunacagi)
  |-- Ton tercihi (sert / olculu / uzlasma)
  |-- Olmazsa olmaz talepler
  |-- Risk tolerans seviyesi
  |-- Beklenen sonuc
  |
[1.6] HUKUKI KRITIK NOKTA BELIRLEME
  |
  |-- Birincil kritik nokta: Davanin omurgasi olan hukuki mesele
  |-- Ikincil kritik noktalar: Yardimci, destekleyici meseleler
  |-- Riskli noktalar: Karsi tarafin saldiracagi alanlar
  |
  `-- 00-Briefing.md olarak kaydet
```

### ASAMA 2: Derin Arastirma (2B→2C sirali zincir + 2D async paralel kol)

> **Motor:** 2B, `config/motor-haritasi.json -> tasks.yargi_mcp` uyarinca
> ARASTIRMACI rolü tarafindan TEK ELDEN calisir; nihai 2B raporunu da ARASTIRMACI
> yazar (iteratif derin protokol, 6 Faz + Gap Check). 2C/2D ve genel ASAMA 2
> sentezi kendi routing task'larinda kalir.

> **REVIZYON 2026-07-09:** 2A Suer Stajyer + Faz D Arguman.ai ARSIVLENDI
> (`arsiv/README.md`). Ana omurga Yargi-MCP-Pro.

**MCP-Birincil + CLI Fallback Kurali (2B + 2C — FAZ 2 2026-05-19):**
Yargi-MCP-Pro (`mcp__yargi-mcp-pro__*`) her zaman once cagrilir. Basarisiz olursa
(timeout, 5xx, ToolError) 5 sn bekle, 2. deneme. Hala fail → Yargi/Mevzuat CLI
fallback. Her fallback rapora `mcp_fallback_used: true` notu ile yazilir.
ASAMA 2 basinda Pro MCP baglantisi dogrulanir (baglanti yoksa avukata
OAuth yetkilendirme geregi bildirilir).

**Akis Yapisi:**
- **Async paralel kol:** 2D NotebookLM (zinciri bloklamaz; dahili kaynak
  secilmemisse atlanir, rapora not dusulur)
- **Sirali zincir (omurga):** 2B Yargi-MCP-Pro → 2C Yargi-MCP-Pro Mevzuat
  → Mulga/Guncel Denetimi → Eleme
- 2C, 2B'nin verdigi atif maddeleri ve ORKESTRATOR `GECTI` kapisi olmadan
  calismaya BASLAYAMAZ

Hepsi bittiginde tek bir konsolide arastirma raporu uretilir.

```
BASLATICI: Director Agent
  |
  |  2D async paralel kolu tetikler + 2B → 2C sirali zinciri yurutur:
  |
  +---> [2B] YARGI-MCP-PRO  (ARASTIRMACI: tarama -> tam metin -> sentez -> kalite kontrol)
  |        Birincil: mcp__yargi-mcp-pro__ictihat_ara
  |                  (court_types[]: YARGITAYKARARI/DANISTAYKARAR/YERELHUKUK/ISTINAFHUKUK/KYB;
  |                   birimAdi enum: H1-H23/C1-C23/HGK/CGK/D1-D17/IBK/...)
  |                  + mcp__yargi-mcp-pro__ictihat_getir (tam metin)
  |        NOT: Eski 9+ ayri tool (anayasa/emsal/kvkk/uyusmazlik/rekabet/...) Pro MCP'de
  |              ictihat_ara'a konsolide oldu (court_types[] ile filtre)
  |        Fallback: yargi CLI (yargi bedesten search/doc) - sadece MCP fail
  |        Mod: Her zaman derin, tek-shot yasak; model sirasi config pipeline'dan
  |        Minimum: 15 sorgu / 6 faz
  |
  |        Faz 1: Terim uretimi (5-7 alternatif + daire tespiti)
  |        Faz 2: Genis tarama (ana terim + HGK + IBK + alternatif)
  |        Faz 3: Daraltilmis arama (tarih + daire filtreleri)
  |        Faz 4: TEMPORAL EVOLUTION - Son 5 Yil Seyri (ZORUNLU)
  |               - DINAMIK: icinde bulunulan yil dahil son 5 takvim
  |                 yili, yil-yil ayri sorgu (sabit yil YAZILMAZ)
  |               - HGK yil-araligi ek sorgulari
  |               - Hakim gorus kirilimi + kirillma noktasi tespiti
  |        Faz 5: Celiski + bozma + karsit arguman taramasi (min 2)
  |        Faz 6: Tam metin okuma (min 5 karar)
  |        Gap Check: HGK var mi, son 12 ay karar var mi,
  |                   celiski var mi, temporal seyir tamamlandi mi
  |
  |        Cikti: kunye + ozet + tam metin + SON 5 YIL SEYRI ANALIZI
  |              (trend, kirillma noktasi, olu kararlar, bugunku
  |               yerlesik uygulama, dilekcede kullanilacak kararlar)
  |              **+ HER KARARIN ATIF YAPTIGI MEVZUAT MADDELERI** (2C girdisi)
  |
  v   (sirali zincir devami - 2C 2B'nin ciktisini bekler)
  |
  +---> [2C] YARGI-MCP-PRO MEVZUAT  (DERIN ITERATIF PROTOKOL - ZORUNLU - 2B'YE BAGIMLI) - FAZ 2 2026-05-19
  |        Birincil: mcp__yargi-mcp-pro__mevzuat_ara
  |                  (mevzuat_tur_list[]: 12 tip — KANUN/KHK/TUZUK/YONETMELIK/CB_KARARNAME/
  |                   CB_YONETMELIK/CB_KARAR/CB_GENELGE/KKY/UY/TEBLIGLER/MULGA;
  |                   mevzuat_no ile direkt kanun no lookup;
  |                   phrase Mevzuat Solr dialect — +/-/"exact"/wildcard*/fuzzy~,
  |                   AND/OR/NOT literal BREAK eder)
  |                  + mcp__yargi-mcp-pro__mevzuat_icinde_ara (tek kanun ici boolean — AND/OR/NOT UPPERCASE)
  |                  + mcp__yargi-mcp-pro__mevzuat_getir (id_type=mevzuat/madde/gerekce/outline polimorfik)
  |        NOT: Eski 9 tip-bazli search tool tek mevzuat_ara'a konsolide; 3 fetch tool
  |              tek mevzuat_getir'e indirgendi.
  |        Fallback: mevzuat CLI (mevzuat search/doc/article/tree) - sadece MCP fail
  |        Mod: Her zaman derin, tek-shot yasak, **ARASTIRMACI — MAX EFFORT thinking**
  |        Girdi: 2B'nin atif maddesi listesi (TBK m.X, Is K. m.Y, ...)
  |        Minimum: 8 sorgu / 4 faz + mulga denetim
  |
  |        Faz 1: Ana kanun - mevzuat_ara + mevzuat_getir(id_type=outline) + (id_type=madde)
  |        Faz 2: Degisiklik gecmisi - mevzuat_getir(id_type=gerekce) + history
  |               (olay tarihine gore dogru versiyon tespiti)
  |        Faz 3: Ilgili madde zinciri - onceki/sonraki madde +
  |               atif yapilan maddeler
  |        Faz 4: Alt mevzuat - yonetmelik + teblig + genelge
  |        Faz 5: Hiyerarsik etiketleme (Anayasa/Antlasma/Kanun/CBK/Tuzuk/Yonetmelik/Teblig)
  |        Faz 6: Norm denetimi (sinir asimi + CBK munhasir kanun alani)
  |        Faz 7: Catisma analizi (Lex Superior/Specialis/Posterior)
  |        Faz 8: Zimni ilga taramasi
  |        Faz 9: LLM Web fallback (CLI ulasamayan hukum icin)
  |
  |        Cikti: mevzuat tam metni + gerekce + degisiklik
  |               tarihcesi + yonetmelik/teblig + atif zinciri + hiyerarsi
  |
  v   (mulga eleme protokolu - 2C ciktisi uzerinde)
  |
  +---> [2B+2C SONUC] MULGA ELEME PROTOKOLU (YENI - kalite kapisi)
  |        Her aday karar icin (2B'nin bulduklari) atif maddesi denetimi:
  |
  |        Kontrol 1: Yururluk - madde bugun yururlukte mi? (madde_tree status)
  |        Kontrol 2: Mulga tarihi - yurulukten kaldirildi mi? (madde_tree history)
  |        Kontrol 3: Olay tarihi versiyonu - o tarihte hangi versiyon? (history)
  |        Kontrol 4: Zimni ilga - yeni kanun eskiyi ilga etmis mi? (mevzuat_ara)
  |
  |        ELEME KARARI:
  |          GECERLI       → rapora alinir (atif maddeleri yururlukte ve uyumlu)
  |          TARIH UYUMSUZ → rapora "olay tarihi versiyonu Y" notuyla alinir
  |          MULGA ATIF    → "[DEGER YOK — mulga atif]" ELENIR (rapora girmez)
  |          ZIMNI ILGA    → "[ESKI NORM]" ELENIR
  |
  |        SAYIM: Eleme sonrasi GECERLI karar < 5 ise → 2B'ye GERI DON,
  |               3 alternatif terimle ek arama. Hala 5 alti → [YETERSIZ KARAR] flag.
  |
  |        Cikti: "Gecerli Kararlar" tablosu + "Elenen Kararlar" tablosu
  |
  +---> [2D] NOTEBOOKLM
           Araclar: NotebookLM MCP
           Notebook: avukatin sectigi (ornek: "IS HUKUK CALISMA")

           Sorgu Kurallari:
           - Her sorguda SABIT ibare: "SADECE KAYNAKLARA GORE
             CEVAP VER, UYDURMA YAPMA"
           - Iteratif sorgulama (tatmin olunana kadar)
           - EN AZ 10 sorgu (6 irdeleme + 4 perspektif)

           Bolum A: Hukuki Irdeleme (en az 6 soru)
           - Q1: Temel hukuki cerceve
           - Q2: Taraflarin sorumluluk alanlari
           - Q3: Ispat yukumlulugu
           - Q4: Temerrud / faiz / sure
           - Q5: Celiskili noktalar / karsi argumanlar
           - Q6: Emsal ictihat analizi
           (tatmin olmadan diger kola gecme)

           Bolum B: 5 Ajan Perspektifleri (4 soru)
           - Q+1: Davaci avukat bakis acisi
           - Q+2: Davali avukat bakis acisi
           - Q+3: Bilirkisi bakis acisi
           - Q+4: Hakim bakis acisi

           Cikti: iteratif bulgu ozeti + perspektif yorumlari

  [NOT: 2E AKADEMIK DOKTRIN kolu 2026-05-19'da kaldirildi. Akademik
   doktrin gorusleri gerekirse `arastir-notebook` (avukatin notebooklari)
   veya Yargi-MCP-Pro kararlarinin tam metin atif zinciri uzerinden gelir.]

  |
  v
TUM KOLLAR + SIRALI ZINCIR TAMAMLANDIKTAN SONRA KONSOLIDE RAPOR
  |
  `-- 02-Arastirma/arastirma-raporu.md
      Icerik (BAGLAYICILIK MERDIVENI sirasiyla):
      - Kullanilan kaynaklar (her kolun listesi + mcp_fallback_used flag)
      - Ilgili mevzuat (+ gerekce + degisiklik gecmisi + hiyerarsi etiketi)
      - **Yargi Kararlari + Mevzuat (Mulga Eleme Sonrasi)** - YENI
        * Gecerli Kararlar tablosu (atif maddeleri yururlukte + uyumlu)
        * Elenen Kararlar tablosu (mulga atif / eski norm + sebep)
      - SON 5 YIL ICTIHAT SEYRI ANALIZI (2B Faz 4 ciktisi)
      - NotebookLM iteratif bulgu ozeti
      - Celiskili noktalar
      - Guncellik kontrolu
      - Dilekceye tasinacak argumanlar (on liste)
```

#### Normlar Hiyerarsisi: Mevzuat Arastirma Motoru (ASAMA 2C zorunlu)

Mevzuat arastirmasi normlar hiyerarsisini dikkate alarak yapilir.
Arastirmaci ajan 2C (Mevzuat CLI) sadece metin cekmekle kalmaz, hiyerarsik
denetim de yapar. Bu denetim ASAMA 2 Kalite Kapi 1'de zorunludur.

**Turk Hukukunda Normlar Hiyerarsisi (Piramit — yukaridan asagiya guc sirasi):**

```
[1] ANAYASA
       ^
       |
[2] TEMEL HAK/OZGURLUKLERE ILISKIN MILLETLERARASI ANTLASMALAR
    (Anayasa m.90/5: Kanunlarla catismada antlasma ustun)
       ^
       |
[3] KANUNLAR / OHAL CBK / ICTIHADI BIRLESTIRME KARARLARI (IBK)
    / DIGER MILLETLERARASI ANTLASMALAR
    (Bu grup esdeger - ayni basamak)
       ^
       |
[4] OLAGAN CUMHURBASKANLIGI KARARNAMELERI (CBK)
    (Kanunla duzenlenen konuda cikarilamaz)
       ^
       |
[5] TUZUKLER
    (Yeni tuzuk cikarilamaz, eskileri kanunlara aykiri olmamak sartiyla gecerli)
       ^
       |
[6] YONETMELIKLER
    (Kanun ve CBK'larin uygulanmasi icin; bunlara aykiri olamaz)
       ^
       |
[7] ADSIZ DUZENLEYICI ISLEMLER (Teblig, Genelge, Yonerge, Talimat)
    (En alt basamak - ust normlari asamaz/kisitlayamaz)
```

**Catisma Cozum Kurallari:**

| Kural | Latince | Mantik |
|-------|---------|--------|
| Ust Norm Kurali | Lex Superior | Hiyerarside ustte olan uygulanir (Yonetmelik vs Kanun -> Kanun) |
| Ozel Norm Kurali | Lex Specialis | Ayni basamakta: Ozel kanun, genel kanuna tercih edilir |
| Sonraki Norm Kurali | Lex Posterior | Ayni seviye + ayni ozel/genel: Yururluk tarihi yeni olan uygulanir |
| CBK-Kanun Istisnasi | - | Olagan CBK ile kanun ayni konuda farkli ise **HER ZAMAN KANUN** uygulanir |

**LLM'in Yorumlama Gorevi (4 Adim):**

1. **Hiyerarsik Etiketleme:** Her metni piramit seviyesine etiketle.
   Ornek: "4857 m.41" -> [Seviye 3: KANUN], "Fazla Calisma Yonetmeligi
   m.7" -> [Seviye 6: YONETMELIK].

2. **Sinir Asimi Kontrolu (Norm Denetimi):** Alt norm ust normdaki bir
   hakki daraltiyor mu? Daraltiyorsa: "Alt norm normlar hiyerarsisine
   aykiri, ust norm uygulanmalidir."

3. **CBK Denetimi:** CBK maddesi geldiyse Anayasa'ya gore munhasiran
   kanunla duzenlenmesi gereken alan mi? (Kisi haklari, suc/ceza, temel
   ozgurlukler.) Eger oyleyse CBK uygulanamaz.

4. **Catisma Tespiti ve Zimni Ilga:** Ayni konuda iki kanun varsa:
   - Tarihler: hangisi yeni? (Lex Posterior -> eski zimnen ilga)
   - Kapsam: hangisi ozel? (Lex Specialis -> genel karsisinda ustun)

**Mevzuat CLI vs LLM Web Arastirmasi:**

- **A. MEVZUAT CLI (Birincil):** Kanun, yonetmelik, CBK, teblig, IBK.
  `mevzuat search/doc/article/tree/gerekce`. Bedesten API + mevzuat.gov.tr.
- **B. LLM WEB (Fallback):** Cok yeni mevzuat, ozel kurum yonetmelikleri,
  milletlerarasi antlasmalar, AYM norm denetimi kararlari, Resmi Gazete
  yeni yayimlari. Fallback ciktisinda kaynak URL ve yayim tarihi ZORUNLU.
  Etiket: "KAYNAK: LLM Web Arastirmasi - [URL] - [Tarih]"

**Cikti Formati (arastirma raporunda):**

```
## Ilgili Mevzuat (Normlar Hiyerarsisi Analizli)

### 1. [Mevzuat Adi] m.[Madde No]
- Hiyerarsik Seviye: [Seviye 3: KANUN]
- Metin: [...]
- Kaynak: [Mevzuat CLI / LLM Web: URL]
- Yururluk: [Tarih]
- Son Degisiklik: [Varsa]

### Norm Catismasi Tespiti (varsa)
- Tespit: [Yonetmelik m.7, Kanun m.41 ispat serbestisini daraltiyor]
- Uygulanacak Norm: [Kanun m.41]
- Gerekce: [Lex Superior - Yonetmelik ust norma aykiri]

### Norm Denetimi Notu (varsa)
- [CBK m.X munhasiran kanunla duzenlenmesi gereken alani ihlal ediyor]

### Zimni Ilga Tespiti (varsa)
- [Eski X Kanunu m.5, Yeni Y Kanunu m.12 ile zimnen ilga - Lex Posterior]
- [Z ozel kanunu somut olaya uygulanir, W genel kanunu degil - Lex Specialis]
```

**Kalite Kapi 1 Normlar Hiyerarsisi Kontrolu:**

- Her mevzuat bulgusu hiyerarsik seviye ile etiketlendi mi?
- Birden fazla seviyeden norm varsa catisma analizi yapildi mi?
- CBK varsa munhasir kanun alani denetimi yapildi mi?
- Fallback kullanildiysa kaynak URL ve tarih belirtildi mi?

GECEMEZSE: Arastirma tekrar calistirilir veya eksik kisim tamamlanir.

---

### ASAMA 3: Usul Raporu

> **Rol:** MUHAKEME | **Routing:** `usul_raporu` | **Denetim:** DENETCI (`ajanlar/denetci/SKILL.md`)
> Hesaplama modulu (deterministik formul) ORKESTRATOR'da kalir.

```
USUL AJANI
  |
  |-- 00-Briefing.md oku
  |-- arastirma-raporu.md oku (guncel ictihatla zenginlestirmek icin)
  |-- legal.local.md oku (buro playbook)
  |
  v
Usul cercevesini cikar:
  - Gorevli mahkeme (dayanak madde)
  - Yetkili mahkeme (dayanak)
  - Vekaletname kontrolu (ozel yetki?)
  - Zorunlu on adimlar (arabuluculuk, ihtarname)
  - Zamanasimi hesabi (guncel ictihatla teyit)
  - Arabuluculuk zorunlulugu
  - Harc tahmini
  - Risk analizi (arastirma bulgularini dahil et)
  - Muvekkil bilgi checklist
  - Belge checklist
  - Hesaplamalar (iscilik davasiysa)
  |
  v
01-Usul/usul-raporu.md kaydet
```

### ASAMA 4: 5 Ajanli Stratejik Analiz (Tum Dosya Uzerinden)

> **Rol:** MUHAKEME | **Routing:** 4A-4D default routing, 4E `savunma_simulasyonu` | **Denetim:** DENETCI (`ajanlar/denetci/SKILL.md`)
> Promise.allSettled ile hata toleransi: 4/4 tam, 3/4 uyarili, 2/4 sinirli, <2/4 DURDUR.

Bu asamada henuz dilekce YAZILMAMISTIR. 5 ajanli sistem;
briefing + arastirma + usul raporu uzerinden bir "yazim
rehberi" ve strateji dokumani uretir.

```
TETIKLEME
  |
  v
DOSYA PAKETI OLUSTUR
  |
  |-- 00-Briefing.md
  |-- arastirma-raporu.md
  |-- usul-raporu.md
  |-- muvekkil belgeleri (varsa)
  |
  |  Hepsi tek bir JSON pakete toplanir.
  |
  v
PAKET VALIDASYONU (Hook: PreToolUse)
  |
  |-- [x] Paket ID var mi?
  |-- [x] Dava bilgileri tam mi?
  |-- [x] Kritik nokta belirli mi?
  |-- [x] En az 1 arastirma kaynagi var mi?
  |
  |  Gecersizse: DURDUR, eksikleri bildir
  |  Gecerliyse: devam
  |
  v
4 PERSPEKTIF AJANI - PARALEL CALISMA
  |
  |  Ayni dosya paketi 4 ajana AYNI ANDA gonderilir
  |  (Promise.allSettled - biri cokse digerleri devam eder)
  |
  +---> DAVACI AVUKAT AJANI
  |       "Bu dosyada bizim icin en guclu ne var?"
  |       Cikti:
  |       - Dosyanin genel gucu: Yuksek/Orta/Dusuk
  |       - En guclu 5 arguman
  |       - Ek delil talepleri
  |       - Dilekcede vurgulanmasi gerekenler
  |       - Riskli konular + guclendirme onerisi
  |       - Genel strateji (durusma/sulh/istinaf)
  |
  +---> DAVALI AVUKAT AJANI
  |       "Ben karsi taraf avukati olsam ne yapardim?"
  |       Cikti:
  |       - Dosyanin genel zayifligi (bizim acimizdan)
  |       - En tehlikeli 5 itiraz
  |       - Delil itirazlari
  |       - En guclu savunma maddeleri
  |       - Rakibin muhtemel zaafiyetleri
  |       - Savunma stratejisi
  |
  +---> BILIRKISI AJANI
  |       "Teknik olarak bu dosyada ne dogru ne yanlis?"
  |       Cikti:
  |       - Teknik degerlendirme ozeti
  |       - Guclu teknik deliller
  |       - Zayif/tartismali deliller
  |       - Eksik hususlar
  |       - Bilirkisi raporunda olmasi gerekenler
  |       - Genel teknik risk seviyesi
  |
  +---> HAKIM AJANI
          "Ben hakim olsam bu dosyaya nasil karar verirdim?"
          Cikti:
          - Dosyanin genel degerlendirmesi
          - Kabul edilecek argumanlar
          - Reddedilecek argumanlar
          - Yargitay'da bozma riski
          - Muhtemel karar ozeti
          - Hakimin muhtemel ek sorulari
          - Istinaf/Yargitay icin stratejik uyarilar
  |
  v
FORMAT KONTROLU (Hook: PostToolUse)
  |
  |-- Her ajanin ciktisi bos mu? Cok kisa mi?
  |-- En az 2/4 ajan basarili mi? (Degilse DURDUR)
  |
  v
SENTEZ & STRATEJI AJANI
  |
  |-- 4 raporu alir
  |-- Celiskileri cozer
  |-- En gercekci stratejiyi olusturur
  |-- DILEKCE YAZIM REHBERI uretir
  |
  |  Cikti:
  |  1. DOSYA OZETI
  |     Tek paragraf - davanin durumu
  |
  |  2. EN GUCLU 3 ARGUMAN
  |     Tum perspektiflerden uzlasan noktalar
  |
  |  3. EN BUYUK 3 RISK + COZUM
  |     Risk + somut cozum onerisi
  |
  |  4. ONERILEN GENEL STRATEJI
  |     Dava devam / sulh / delil tamamlama / baska yol
  |
  |  5. DILEKCE YAZIM REHBERI (ONEMLI)
  |     - Dilekcede hangi argumanlar hangi sirayla
  |     - Hangi Yargitay kararlari atif olarak kullanilmali
  |     - Hangi mevzuat maddeleri vurgulanmali
  |     - Hangi delil talepleri eklenmeli
  |     - Sonuc kisminda hangi kalemler ne tutarda
  |     - Proaktif karsi argumanlar hangi bolumde
  |     - Ton ve uslup tercihi
  |
  |  6. DURUSMA STRATEJISI
  |     - Hakime su soruyu beklemelisin
  |     - Karsi taraf bunu soracak, cevap su
  |     - Taniktan su konulari sor
  |
  |  7. SON TAVSIYE
  |     KIRMIZI ALARM: Davadan cekilmeyi dusun
  |     YESIL ISIK: Guclu dosya, devam et
  |     SARTLI ILERLEME: Su eksikleri tamamla, sonra devam
  |
  v
02-Arastirma/stratejik-analiz.md kaydet
  |
  v
MEMPALACE DIARY WRITE (Zorunlu - 5 ajan icin)
  |
  |-- mempalace_diary_write "davaci" "{en onemli 3 ogrenme}"
  |-- mempalace_diary_write "davali" "{en onemli 3 ogrenme}"
  |-- mempalace_diary_write "bilirkisi" "{en onemli 3 ogrenme}"
  |-- mempalace_diary_write "hakim" "{en onemli 3 ogrenme}"
  |-- mempalace_diary_write "sentez" "{en onemli 3 ogrenme}"
  |
  |  Her ajan kendi perspektifinde "bu davadan ne ogrendim" yazar.
  |  Bir sonraki tam davada otomatik context'e gelir.

ONEMLI: Bu asamada dilekce henuz yazilmadi.
Stratejik analiz, Asama 5'te dilekceyi yazarken
belge yazari ajanin rehberi olarak kullanilir.
```

### ASAMA 5: Dilekce v1 (Stratejik Analiz Rehberligi)

> **Rol:** MUHAKEME | **Routing:** `dilekce_yazimi` | **Denetim:** DENETCI (`ajanlar/denetci/SKILL.md`)

```
BELGE YAZARI
  |
  |-- 00-Briefing.md oku
  |-- arastirma-raporu.md oku
  |-- usul-raporu.md oku
  |-- stratejik-analiz.md oku (YAZIM REHBERI)
  |-- dilekce-yazim-kurallari.md oku
  |-- sablonlar/ klasorunden uslup referansi al
  |
  v
Dilekce taslagi yaz:
  - Stratejik analizin "Yazim Rehberi" bolumunu takip et
  - Olaylar (kronolojik, olgusal)
  - Hukuki degerlendirme:
      * Strateji tarafindan onerilen argumanlari kullan
      * Onerilen sirayla yerlestir
      * Onerilen Yargitay kararlarina atif yap
      * Onerilen mevzuat maddelerini goster
  - Deliller (strateji tarafindan onerilen ek delil taleplerini dahil et)
  - Hukuki nedenler
  - Sonuc ve talep (strateji tarafindan onerilen tutarlarla)
  |
  v
Kalite kontrol:
  [x] En az 2 Yargitay kararina atif var mi?
  [x] Stratejik analizin onerdigi argumanlarin hepsi var mi?
  [x] Tutarlar usul raporuyla ve stratejiyle tutarli mi?
  [x] Zamanasimi savunmasina karsi pozisyon var mi?
  [x] Arabuluculuk tutanagina atif var mi?
  [x] Ton stratejiyle uyumlu mu?
  |
  v
03-Sentez-ve-Dilekce/dilekce-v1.md kaydet
```

### ASAMA 6: Savunma Simulasyonu

> **Rol:** MUHAKEME | **Routing:** `savunma_simulasyonu` | **Denetim:** DENETCI (`ajanlar/denetci/SKILL.md`)

```
SAVUNMA SIMULATORU
  |
  |-- dilekce-v1.md oku
  |-- arastirma-raporu.md oku
  |-- stratejik-analiz.md oku
  |
  v
Karsi tarafin gozuyle incele:
  - En guclu itirazlar neler?
  - Delil itirazlari neler?
  - Usul itirazi gelir mi?
  - Hakimin muhtemel sorusu ne?
  - Dilekcenin hangi bolumleri zayif kaliyor?
  - Stratejik analizde belirtilen risklerden hangileri
    dilekcede yeterince karsilanmamis?
  |
  v
02-Arastirma/savunma-simulasyonu.md kaydet
  Icerik:
  - En tehlikeli 5 itiraz (siralama ile)
  - Her itiraz icin karsi pozisyon onerisi
  - Eksik delil tespiti
  - Dilekcenin guclendirilmesi gereken bolumleri
```

### ASAMA 7: Nihai Dilekce v2

> **Rol:** MUHAKEME | **Routing:** `revizyon` | **Denetim:** DENETCI (`ajanlar/denetci/SKILL.md`)
> UDF uretimi (`scripts/md_to_udf.py`) deterministik, LLM kullanmaz.

```
REVIZYON AJANI
  |
  |-- dilekce-v1.md oku
  |-- stratejik-analiz.md oku
  |-- savunma-simulasyonu.md oku
  |
  v
Iki katmandan gelen bulgularla dilekceyi revize et:

  A) Stratejik analizden:
     - Eksik arguman varsa ekle
     - Zayif arguman varsa guclendir
     - Ton stratejiye uygun hale getir
     - Strateji tarafindan onerilen ama dilekce v1'de
       eksik kalan noktalari tamamla

  B) Savunma simulasyonundan:
     - Karsi tarafin en guclu itirazlarini proaktif karsila
     - Delil itirazlarina karsi ek delil talebi ekle
     - Usul itirazlari icin on pozisyon al
     - Hakimin muhtemel sorulari icin cevap altyapisi hazirla
     - Zayif bolumleri guclendir
  |
  v
Son kalite kontrol:
  [x] Stratejik analizin tum onerileri yansitildi mi?
  [x] Savunma simulasyonundaki tum itirazlara pozisyon alindi mi?
  [x] Netice-i talep tamami net tutarlarla hazir mi?
  [x] Uslup butunlugu var mi?
  [x] "Utandirma testi" — dilekce mahkemede avukati mahcup eder mi?
  |
  v
03-Sentez-ve-Dilekce/dilekce-v2.md (NIHAI) kaydet
  |
  v
MEMPALACE PROMOTION (Argumanlari Olgunlastir)
  |
  |-- Dilekce v2'de KULLANILAN argumanlar:
  |     mempalace_add_drawer
  |       --wing wing_{dava_turu}
  |       --hall hall_argumanlar
  |       --content "Dilekceye giden olgun arguman"
  |
  |-- Dilekce v2'de KARSI TARAFTAN BEKLENEN itirazlar:
  |     mempalace_add_drawer
  |       --wing wing_{dava_turu}
  |       --hall hall_savunma_kaliplari
  |       --content "Beklenen karsi itiraz + on cevap"
  |
  |-- Hakim biliniyorsa:
  |     mempalace_add_drawer
  |       --wing wing_hakim_{soyad}
  |       --hall hall_savunma_kaliplari
  |
  |-- Karsi taraf avukati biliniyorsa:
  |     mempalace_add_drawer
  |       --wing wing_avukat_{soyad}
  |       --hall hall_savunma_kaliplari
  |
  |  KVKK: TC, isim, IBAN maskelenir. Yargitay metni icin kalir.
```

---

## Somut Ornek: Iscilik Alacagi Davasi

Avukat su komutu veriyor:

```
yeni dava: Ahmet Celebi, iscilik alacagi
ozet: Muvekkil 7 yil calistiktan sonra esasli gorev degisikligi
      ve esit islem borcu ihlali gerekcesiyle hakli fesih yapti.
      Isveren 03 (istifa) kodu ile cikis verdi.
kritik nokta: Hakli feshin kidem tazminati ve diger alacaklar
              bakimindan gecerli olup olmadigi; asil isveren -
              alt isveren muteselsil sorumlulugu.
```

Sistemin adim adim yaptiklari:

```
[ASAMA 1 - HAZIRLIK]
  1. Muvekkilin verdigi belgeler incelendi (ihtarname, mailler)
  2. Olgusal kronoloji cikarildi (2019 - 2026 yil bazli)
  3. Drive klasoru: 2026-003 Ahmet Celebi - Iscilik Alacagi
  4. Avukata kaynak soruldu: NotebookLM "IS HUKUK CALISMA"
  5. Advanced briefing tamamlandi (dava teorisi, risk, ton, talepler)
  6. Kritik noktalar belirlendi:
     - Birincil: m.22 + m.5 + m.24/II ile hakli fesih
     - Ikincil: asil isveren muteselsil sorumluluk
     - Risk: performans savunmasi, 03 kodu
  -> 00-Briefing.md kaydedildi

[ASAMA 2 - DERIN ARASTIRMA] (2B→2C sirali zincir + 2D async paralel kol)
  Async paralel kol:
  - 2D NotebookLM: iteratif 10 sorgu (6 irdeleme + 4 perspektif)
  Sirali zincir:
  - 2B Yargi MCP (ARASTIRMACI): 9. HD + HGK + IBK son 2 yil
    -> 12 aday karar bulundu, atif maddeleri: Is K. m.2/5/17/22/24/32
  - 2C Mevzuat MCP (ARASTIRMACI (MAX EFFORT)): atif maddeleri cekildi
    -> Mulga denetim: 11 GECERLI / 1 elenen (eski Is K. m.X 2020 tadili)
  -> arastirma-raporu.md kaydedildi (Gecerli + Elenen tablolari)

[ASAMA 3 - USUL RAPORU]
  - Is mahkemesi gorevli (7036 s.K.)
  - 5 yil zamanasimi
  - Arabuluculuk zorunlu
  - Kidem + yillik izin + ucret + ayrimci tazminat hesabi
  - Risk analizi (arastirma bulgulari dahil)
  -> usul-raporu.md kaydedildi

[ASAMA 4 - 5 AJANLI STRATEJIK ANALIZ]
  Dosya paketi hazirlandi (briefing + arastirma + usul)
  4 ajan paralel calisti:

  DAVACI AVUKAT:
    "Dosya gucu: YUKSEK. 6 yil ustun basari odulu performans
     savunmasini kokten curutur. M.5 ispat yuku isverende."

  DAVALI AVUKAT:
    "En tehlikeli itiraz: pozisyonun esdeger olmasi iddiasi.
     Performans degerlendirme kriterleri sorgulanabilir."

  BILIRKISI:
    "Mali hesap: kidem tavani dogru uygulanmali. Ayrimci tazminat
     icin sirket genel zam verisi gerekli."

  HAKIM:
    "Muhtemel karar: Kabul. Bozma riski: DUSUK. Ek soru:
     tenzili rutbe iddiasinin objektif kriterleri."

  SENTEZ AJANI:
    "SON TAVSIYE: YESIL ISIK (GUCLU DOSYA)
     Dilekce yazim rehberi uretildi:
     - Argumanlar su sirayla: m.22 -> m.5 -> mobbing -> asil isveren
     - 3 Yargitay karari atif olarak kullanilmali
     - Ton: SERT, IDDIALI, GUVENLI
     - Netice-i talep: 6 kalem, brut tutarlarla"
  -> stratejik-analiz.md kaydedildi

[ASAMA 5 - DILEKCE v1]
  Belge yazari, stratejik analizin "yazim rehberi"ni takip ederek
  dilekce v1'i yazdi.
  -> dilekce-v1.md kaydedildi

[ASAMA 6 - SAVUNMA SIMULASYONU]
  - "Karsi taraf 'pozisyonlar esdeger' diyecek"
  - "Performans degerlendirme kriterleri gostermemiz gerekecek"
  - "Vodafone 'alt isverenlikle ilgisi yok' diye itiraz eder"
  -> savunma-simulasyonu.md kaydedildi

[ASAMA 7 - NIHAI DILEKCE v2]
  Revizyon ajani iki katmani birlestirdi:
  - Stratejik analizden: tum argumanlar eksiksiz yer aliyor mu?
  - Savunma simulasyonundan: her itiraza proaktif pozisyon var mi?
  - Tenzili rutbe iddiasi icin objektif kriter listesi eklendi
  - Asil isveren muteselsil sorumluluk kismi guclendirildi
  -> dilekce-v2.md (NIHAI) kaydedildi
```

---

## MemPalace Entegrasyonu (Buro Ic Hafiza)

5 ajanli sistem her dava sonunda MemPalace'e diary yazimi yaparak
sessions arasi ogrenme saglar. Bu, sistemin "her seferinde sifirdan
yapma" sorununu cozer.

### Yazim Akisi

| Asama | Kim Yazar | Wing | Hall |
|---|---|---|---|
| 4 | Davaci Ajani | wing_ajan_davaci | hall_diary |
| 4 | Davali Ajani | wing_ajan_davali | hall_diary |
| 4 | Bilirkisi Ajani | wing_ajan_bilirkisi | hall_diary |
| 4 | Hakim Ajani | wing_ajan_hakim | hall_diary |
| 4 | Sentez Ajani | wing_ajan_sentez | hall_diary |
| 7 | Revizyon Ajani | wing_{dava_turu} | hall_argumanlar |
| 7 | Revizyon Ajani | wing_{dava_turu} | hall_savunma_kaliplari |
| 7 | (varsa) | wing_hakim_{soyad}, wing_avukat_{soyad} | hall_savunma_kaliplari |

### Tam Dava vs Arastirma-Talebi Akisi

5 ajanli sistem SADECE TAM DAVA AKISINDA calisir. Bu durumda:
- Hakim/karsi taraf wing'lerine yazim YAPILIR
- 5 ajanin tum diary'leri yazilir
- hall_argumanlar olgun argumanlarla beslenir

Sadece arastirma-talebi akisinda (`arastir: ...` komutu):
- 5 ajanli sistem CALISMAZ
- Sadece arastirmaci ve usul-uzmani diary'si yazar
- hall_arastirma_bulgulari'na ham bulgu dusurulur
- Aktor wing'lerine (hakim/avukat) yazim YOK

### Promotion (Olgunlasma) Kurali

Bir drawer hall_arastirma_bulgulari'nda 2+ kez kullanildigi veya
bir tam davada arguman olarak dogrulandigi anda:
-> Director Agent otomatik olarak hall_argumanlar'a kopyalar.

Bu mekanizma "ham bulgu -> olgun arguman" gecisini saglar.

### Asama 0 Wake-up Sirasi (Her Komuttan Once)

```
1. mempalace_status
2. mempalace_search wing_buro_aykut (avukat tercihleri)
3. mempalace_search wing_{dava_turu} hall_argumanlar
4. mempalace_search wing_{dava_turu} hall_arastirma_bulgulari
5. (tam dava ise) mempalace_search wing_ajan_*
6. (tam dava + biliniyorsa) mempalace_search wing_hakim_*, wing_avukat_*
```

Bulunan drawer'lar 5 ajanin briefing'ine "MEMORY MATCH" basligi
altinda enjekte edilir. Ajanlar "daha once gormus" oldugu argumani
sifirdan uretmez, mevcut olgun olani referans alarak gelistirir.

---

## Komut Referansi

### Karar Agaci (Hangi Komut?)

```
Ne yapiyorsun?
+- Yeni bir dava acacagim           -> yeni dava: ...
+- Sadece bir konu arastiracagim    -> arastir: ...
+- Usul iskeletine bakacagim        -> usul: ...
+- 5 ajanli stratejik analiz cikar  -> stratejik analiz: [dava-id]
+- Dilekce v1 (manuel tetik)        -> dilekce v1: [dava-id]
+- Dilekce/ihtarname/sozlesme       -> dilekce yaz | ihtarname yaz | sozlesme yaz
+- Iscilik tazminati hesabi         -> hesapla: ...
+- Karsi tarafi simule et           -> savunma simule et: [dava-id]
+- Dilekceyi revize et              -> revize et: [dava-id]
+- Bilirkisi raporunu denetle       -> arastir bilirkisi: [dava-id] [rapor]
+- SWOT analizi cikar               -> swot arastir: [dava-id]  (*banner'li)
+- Sozlesmeyi incele                -> sozlesme incele: [dosya-yolu]
+- Istinaf layihasi yaz             -> istinaf yaz: [dava-id]
+- Temyiz layihasi yaz              -> temyiz yaz: [dava-id]
+- Muvekkile durum mektubu          -> muvekkil bilgilendir: [dava-id]
+- Dava mi uzlasma mi karar ver     -> strateji degerlendir: [dava-id]
+- Haftalik ictihat tara            -> ictihat tara
+- Takvime sure ekle                -> sure ekle: [tarih, tur]
+- Detayli briefing gir             -> briefing: [dava-id]
+- Buroya blog yaz                  -> blog yap: [konu]
```

### Tam Komut Tablosu

| Komut | Calisan Ajan | Cikti |
|---|---|---|
| `yeni dava: [isim], [tur] / ozet: ... / kritik nokta: ...` | Director + Tam 7 ASAMA | Tum dava klasoru |
| `briefing: [dava-id]` | Director (Asama 1) | `00-Briefing.md + .docx` |
| `arastir: [konu]` | Arastirmaci (Asama 2 — Bekleyen Davalar) | `arastirma-raporu.md + .docx` |
| `arastir yargi: [konu]` | Arastirmaci 2B (Yargi MCP, CLI fallback) | Yargitay/HGK kararlari + atif maddeleri |
| `arastir mevzuat: [konu]` | Arastirmaci 2C (Mevzuat MCP, CLI fallback) | Kanun maddeleri + normlar hiyerarsisi + mulga denetim |
| `arastir notebook: [konu]` | Arastirmaci 2D (NotebookLM) | Iteratif sorgu sonuclari |
| `usul: [dava turu]` | Usul Uzmani (Asama 3) | `01-Usul/usul-raporu.md + .docx` |
| `stratejik analiz: [dava-id]` | 5 Ajan paralel + 4E Sentez (Asama 4) | `stratejik-analiz.md + .docx` |
| `dilekce v1: [dava-id]` | Belge Yazari (Asama 5) | `dilekce-v1.md + .docx` |
| `dilekce yaz` | Belge Yazari (v1 ile esdeger) | `dilekce-v1.md + .docx` |
| `ihtarname yaz` | Belge Yazari | `ihtarname.md + .docx` |
| `sozlesme yaz` | Belge Yazari | `sozlesme.md + .docx` |
| `hesapla: giris:..., cikis:..., net:..., fesih:...` | Hesaplama Modulu (ORKESTRATOR, deterministik) | Kalem-kalem net + brut tablo |
| `hesapla kidem: ...` | Hesaplama Modulu | Sadece kidem |
| `hesapla ise iade: ...` | Hesaplama Modulu | Sadece ise iade |
| `savunma simule et: [dava-id]` | Savunma Simulatoru (Asama 6) | `savunma-simulasyonu.md + .docx` |
| `revize et: [dava-id]` | Revizyon Ajani (Asama 7) | `dilekce-v2.md + .docx + .udf` (NIHAI) |
| `ictihat tara` | Otonom Dongu | `bilgi-tabani/haftalik-ictihat-{tarih}.md` |
| `sure ekle: [tarih, tur]` | Calendar MCP | Calendar event |
| `blog yap: [konu]` | Pazarlama Ajani (bagimsiz) | `blog-icerikleri/{tarih}/` |

### Alt-Mod Komutlari (2026-04 eklendi)

Ana ajanlar bazi ozel gorevler icin "alt-mod"da calisir. Alt-mod ajanin
normal davranisini degistirmez; sadece o komut icin farkli prompt ve
cikti formati kullanir.

| Komut | Ana Ajan | Alt-Mod | Cikti | Ne Zaman |
|---|---|---|---|---|
| `arastir bilirkisi: [dava-id] [rapor]` | Arastirmaci | Bilirkisi Denetleme | `bilirkisi-denetim-raporu.md + .docx` | Bilirkisi raporu geldiginde, itiraz suresi dolmadan |
| `swot arastir: [dava-id]` | Arastirmaci | SWOT Strateji (banner'li) | `strateji-swot-raporu.md + .docx` | Dava stratejisini netlestirmek icin, briefing sonrasi |
| `sozlesme incele: [dosya-yolu]` | Arastirmaci | Sozlesme Inceleme | Mevcut->Onerilen->Gerekce raporu | Sozlesme imzalanmadan once risk analizi |
| `istinaf yaz: [dava-id]` | Belge Yazari | Istinaf Layihasi | `istinaf-dilekcesi-v1.md + .docx + .udf` | Yerel mahkeme karari aleyhine, sure icinde |
| `temyiz yaz: [dava-id]` | Belge Yazari | Temyiz Layihasi | `temyiz-dilekcesi-v1.md + .docx + .udf` | Istinaf karari aleyhine, sure icinde |
| `muvekkil bilgilendir: [dava-id]` | Director | Muvekkil Bilgilendirme | `muvekkil-bilgilendirme-{tarih}.md + .docx` | Onemli gelisme sonrasi |
| `strateji degerlendir: [dava-id]` | Director | Strateji Degerlendirme (MUHAKEME) | `strateji-degerlendirme-{tarih}.md + .docx` | Dava-uzlasma karar matrisi |

**SWOT banner notu:** `swot arastir:` komutu tetiklendiginde ekrana
"SWOT MODU AKTIF" banner'i duser. Sebep: avukat "yoksa unuturum" dedi,
sistem her seferinde hatirlatir. Banner gormezse komut tetiklenmemis demektir.

**Strateji degerlendirme:** Bu alt-mod MUHAKEME rolunde uretilir, DENETCI
denetler. Diger Director alt-modlari ORKESTRATOR'da kalir.
Oyun teorisi yaklasimiyla iki senaryo modeller (dava vs uzlasma).

### Ictihat Tarama (Haftalik Otonom)

```
ictihat tara
```

Son 7 gunun yeni Yargitay/HGK/IBK kararlarini tarar. Aktif davalarla
ilgili olanları bildirir. Cikti:
`bilgi-tabani/haftalik-ictihat-{tarih}.md + .docx`

### Takvim

```
sure ekle: 15.06.2026, zamanasimi
```

Google Calendar'a hatirlatma ekler:

| Olay | Hatirlatma |
|---|---|
| Zamanasimi son tarihi | 3 ay once + 1 ay once |
| Hak dusurucu sureler | 1 hafta once |
| Arabuluculuk basvuru tarihi | 3 gun once |
| Durusma tarihi | 3 gun once |

---

## Teknik Detaylar

### Model Routing Konfigurasyonu

Tum ASAMA'larin model atamalari `config/motor-haritasi.json` dosyasindan
okunur. Avukat manuel olarak guncelleyebilir. Modlar:

- `auto` (varsayilan): Sormadan default kullanilir
- Tek motor: mod secimi yoktur; rol atamasi `config/motor-haritasi.json`'dan okunur
- `fixed`: Sadece default, fallback dahi yok

Motor bildirimi: avukat `motor: <ad>` der (`python scripts/motor.py ayarla <ad>`).
tek seferlik motor degisikligi yapar.

Model atamalarinin ASAMA bazli haritasi icin yukaridaki
"Hangi ASAMA Hangi Modelle Calisiyor (Hibrit Motor Haritasi)" tablosuna bak.

Ayrintili kurallar (DENETCI kapisi, cikti frontmatter, MemPalace
tercih kaydi vs.): `AGENTS.md` -> "Motor Mimarisi" ve "Cikti Frontmatter" bolumleri.

### Dosya Yapisi (v2 branch)

```
agents/
  prompts/
    davaci-avukat.prompt.ts     # Davaci perspektif
    davali-avukat.prompt.ts     # Davali perspektif
    bilirkisi.prompt.ts         # Bilirkisi perspektif
    hakim.prompt.ts             # Hakim perspektif
    sentez-strateji.prompt.ts   # Sentez (lider ajan)
core/
  five-agent-orchestrator.ts    # Orkestrasyon motoru
types/
  dosya-paketi.types.ts         # TypeScript tip tanimlari
```

### Hooks (Kalite Kontrol Mekanizmasi)

| Hook | Nerede | Ne Yapar |
|------|--------|----------|
| PreToolUse | Analiz baslamadan once | Dosya paketi gecerli mi kontrol eder |
| PostToolUse | Her ajan bittikten sonra | Cikti bos mu, cok kisa mi kontrol eder |
| TaskCompleted | Her ajan tamamlandiginda | Sure ve basari/basarisizlik loglar |
| BeforeSentez | Sentez oncesi | 4 raporun formatini dogrular |
| OnError | Hata durumunda | Coken ajan varsa eksik veriyle devam eder |

### Hata Toleransi (5 Ajanli Sistem)

- 4 ajandan **4/4 basarili**: Tam sentez
- 4 ajandan **3/4 basarili**: Eksik perspektifle sentez (uyari notu eklenir)
- 4 ajandan **2/4 basarili**: Sinirli sentez (avukata "eksik analiz" uyarisi)
- 4 ajandan **1/4 veya 0/4**: DURDUR, sentez yapilamaz

### 4 Kalite Kapisi (Detayli Kontrol Listesi)

Sistem her asamada kalite kontrolu yapar. Avukat beklemez, otomatik calisir.
Gecemezse Director ya tekrar calistirir ya da avukata bildirir.

#### Kapi 1: Arastirma Tamamlandiginda (ASAMA 2 sonrasi)

- Min 15 yargi + 8 mevzuat + 10 NotebookLM sorgusu yapildi mi?
- **Yargi/Mevzuat MCP birincil mi kullanildi? CLI fallback gerektiyse rapora `mcp_fallback_used: true` notu duslduldu mu?**
- **Mulga eleme protokolu calistirildi mi? Eleme sonrasi en az 5 GECERLI karar var mi? Elenen kararlarin sebebi rapora yazildi mi?**
- En az 1 HGK/IBK karari var mi?
- Normlar hiyerarsisi denetimi yapildi mi (her mevzuat seviye etiketli mi)?
- GUVEN NOTU dolduruldu mu?
- Celiski/sapma kontrolu yapildi mi?
- Son 5 yil temporal evolution analizi yapildi mi?

GECEMEZSE: Ek arama yapilir veya avukata bildirilir.

#### Kapi 2: Usul Raporu Tamamlandiginda (ASAMA 3 sonrasi)

- Gorevli mahkeme + dayanak yazildi mi?
- Yetkili adliye somut ilce/mahalle bazinda dogrulandi mi (WebSearch ile)?
- Zamanasimi hesaplandi mi?
- Arabuluculuk zorunlulugu belirtildi mi?
- Harc tahmini yapildi mi?
- Belge checklist tamamlandi mi?

GECEMEZSE: Eksik kisimlar tamamlanir.

#### Kapi 3: Stratejik Analiz Tamamlandiginda (ASAMA 4 sonrasi)

- En az 2/4 perspektif ajani basarili calisti mi?
- 4E Sentez ciktisi yazim rehberi formatina uygun mu?
- KIRMIZI/YESIL/SARTLI karari net olarak verilmis mi?
- Avukatin onayina sunulan kritik karar noktalari isaretli mi?

GECEMEZSE veya KIRMIZI ciktiysa: ASAMA 5 BLOKLENIR, avukata onay sorulur.

#### Kapi 4: Dilekce Tamamlandiginda (ASAMA 7 / v2 sonrasi)

- En az 2 Yargitay kararına atif var mi?
- Hesaplamalar usul raporuyla tutarli mi?
- "Dogrulanmasi gerekir" etiketli 2+ atif varsa -> DILEKCE BLOKLENIR
- Utandirma testi yapildi mi? (yapay zeka dili, duygusal ifade)
- Stratejik analizdeki SARTLI kosullari yansitildi mi (varsa)?
- Savunma simulasyonundaki proaktif karsi pozisyonlar yer aldi mi?
- DOCX uretildi mi? (dilekce-v2.docx Drive'da var mi?)
- UDF uretildi mi? (dilekce-v2.udf Drive'da var mi? UYAP icin zorunlu)

GECEMEZSE: Sorun duzeltilir, avukata bildirilir.

### GUVEN NOTU (Her Ciktida Bulunur)

Her rapor ve dilekce basinda su tablo zorunludur:

```
GUVEN NOTU:
- Mevzuat referanslari: [DOGRULANMIS / DOGRULANMASI GEREKIR]
- Yargitay kararlari:   [DOGRULANMIS / DOGRULANMASI GEREKIR / BULUNAMADI]
- Hesaplamalar:          [YAPILDI / YAPILMADI / TAHMINI]
- Dahili kaynak:         [EVET - kaynak adi / HAYIR]
- Risk flag:             [VAR - aciklama / YOK]
```

Avukat cikti okurken:
- "DOGRULANMASI GEREKIR" -> O atfi kendi kontrol et
- "BULUNAMADI" -> O karari bulamadik, sen bul veya cikar
- "RISK FLAG VAR" -> O noktada dikkatli ol

### Drive Cikti Yapisi

Her asamada hem `.md` hem `.docx` uretilir. Sadece NIHAI dilekce (ASAMA 7),
istinaf ve temyiz icin `.udf` de uretilir.

```
G:\Drive'im\Hukuk Burosu\Aktif Davalar\{dava-id}\
  |-- 00-Briefing.md + .docx              (Asama 1)
  |-- 01-Usul/
  |     `-- usul-raporu.md + .docx        (Asama 3)
  |-- 02-Arastirma/
  |     |-- arastirma-raporu.md + .docx   (Asama 2)
  |     |-- stratejik-analiz.md + .docx   (Asama 4 - 5 ajan)
  |     |-- savunma-simulasyonu.md + .docx (Asama 6)
  |     `-- checkpoint-*.md               (Ara kayit, uzun arastirmalarda)
  |-- 03-Sentez-ve-Dilekce/
  |     |-- dilekce-v1.md + .docx         (Asama 5)
  |     |-- dilekce-v2.md + .docx + .udf  (Asama 7 - NIHAI)
  |     `-- revizyon-raporu.md + .docx    (Iki katmanli denetim)
  |-- 04-Muvekkil-Belgeleri/
  |     |-- 00-Ham/                       (Tasnif edilmemis)
  |     |-- 01-Tasnif/                    (Tasnif edilmis)
  |     `-- evrak-listesi.md              (Belge kontrolu)
  `-- 05-Durusma-Notlari/
```

**Sadece arastirma istendiginde** (`arastir: ...`):

```
G:\Drive'im\Hukuk Burosu\Bekleyen Davalar\
  Konu Adi - Arastirma\
    00-Talep.md + .docx
    01-Arastirma\
      arastirma-raporu.md + .docx
    02-Notlar\
```

---

## Hafiza Sistemi (MemPalace + QMD)

Sistem iki hafizayla calisir. Ikisi birbirinin yerine gecmez.

### MemPalace — "Buro Deneyimi" (Yapilandirilmis)

Drawer (cekmece) bazli yapilandirilmis hafiza:

```
Wing (Kanat)     -> Dava turu veya kisi profili
  Hall (Salon)   -> Bilgi kategorisi
    Room (Oda)   -> Spesifik konu
      Drawer     -> Tek bir bilgi parcasi
```

Ornek: `wing_iscilik / hall_argumanlar / room_fazla_mesai_ispat_yuku`
-> "Imzali bordro karinesi yikilir: HGK 2023/... karari"

**Wing kategorileri (aktif):**

- **Dava turu kanatlari:** wing_iscilik, wing_kira, wing_tuketici, wing_aile, ...
- **Buro kanadi:** wing_buro_aykut (avukat tercihleri, ton, model secimi, KVKK notlari)
- **Operasyonel ajan diary'leri:** wing_ajan_arastirmaci, wing_ajan_usul_uzmani,
  wing_ajan_dilekce_yazari, wing_ajan_savunma_simulatoru, wing_ajan_revizyon
- **5 Perspektif ajan diary'leri (ASAMA 4):**
  - wing_ajan_davaci / hall_diary — 4A'nin ogrendigi arguman/delil kaliplari
  - wing_ajan_davali / hall_diary — 4B'nin tespit ettigi itiraz pattern'leri
  - wing_ajan_bilirkisi / hall_diary — 4C'nin teknik analiz bulgulari
  - wing_ajan_hakim / hall_diary — 4D'nin karar/bozma ve IBK referanslari
  - wing_ajan_sentez / hall_diary — 4E'nin KIRMIZI/YESIL/SARTLI yasanmisliklari
- **Aktor profilleri:** wing_hakim_{soyad}, wing_avukat_{soyad}

**Ne ise yarar (cevapladigi sorular):**

- "Bu konuda daha once hangi arguman tuttu?" -> hall_argumanlar
- "Hakim X hangi karar tipini seviyor?" -> wing_hakim_*
- "Karsi taraf avukati Y genelde ne savunuyor?" -> wing_avukat_* + wing_ajan_davali
- "4E Sentez daha once bu tip bir davada KIRMIZI verdi mi?" -> wing_ajan_sentez
- "4C Bilirkisi hangi teknik eksiklikleri surekli yakaliyor?" -> wing_ajan_bilirkisi

Otomatik calisir. Her ajan is bitirince diary yazar, sonraki davada
ASAMA 0 MemPalace Wake-up'da otomatik okunur.

### QMD — "Gecmis Raporlar" (Yapilandirmamis)

Yapilandirmamis semantik arama. Tum MD dosyalarini indexler:

```
310 dosya indexli:
  36 arastirma raporu
  24 dilekce
  10 usul raporu
  10 savunma simulasyonu
  5 revizyon raporu
  50 proje dosyasi
  15 bekleyen dava
  + diger
```

**Ne ise yarar:**

- "Gecen ay yazdigim arastirma raporunda bu konu hakkinda ne yazmistim?" -> BULUR
- "Hangi dilekcede bu argumani kullandim?" -> BULUR
- "Benzer davada usul raporunda ne cikmisti?" -> BULUR

**Guncelleme:** Yeni dosya Drive'a dustugunde `qmd update` calistir.

### Ikisi Birlikte (Hangi Soru Hangi Hafizaya?)

| Soru | Cevaplayan |
|------|-----------|
| "Bu arguman daha once tuttu mu?" | MemPalace |
| "Hangi dilekcede kullandim?" | QMD |
| "Avukatin ton tercihi ne?" | MemPalace |
| "Gecen ayki arastirma raporunda ne yazmistim?" | QMD |
| "Karsi taraf avukati genelde ne yapar?" | MemPalace |
| "Benzer davada usul raporu nasil cikmisti?" | QMD |

### QMD Bakim Komutlari

```bash
qmd update           # Yeni dosyalari indexle (Drive'a dosya dustugunde)
GGML_CUDA=0 qmd embed  # Embedding olustur (yeni dosyalar icin)
qmd status           # Durum kontrolu
GGML_CUDA=0 qmd search "arama terimi" -c ajan-arastirmaci -n 5  # Manuel arama
```

### QMD Koleksiyonlari

| Koleksiyon | Icerik | Dosya Sayisi |
|------------|--------|--------------|
| `proje-bilgi` | SKILL.md, AGENTS.md, sablonlar, bilgi tabani | 50 |
| `ajan-arastirmaci` | Gecmis arastirma raporlari | 36 |
| `ajan-dilekce` | Gecmis dilekceler | 24 |
| `ajan-usul` | Gecmis usul raporlari | 10 |
| `ajan-savunma` | Savunma simulasyonlari | 10 |
| `ajan-revizyon` | Revizyon raporlari | 5 |
| `bekleyen-davalar` | Bekleyen arastirmalar | 15 |

---

## Veri Kaynaklari (Nereden Ne Gelir)

| Kaynak | Ne Icin | Nasil Erisir |
|--------|---------|-------------|
| Yargi CLI | Yargitay, Danistay, HGK, IBK kararlari | `yargi bedesten search "terim"` |
| Mevzuat CLI | Kanun, yonetmelik, teblig tam metin | `mevzuat search "kanun adi"` |
| NotebookLM | Avukatin dava turune ozel notebook'lari | NotebookLM MCP otomatik |
| Google Drive | Dosya okuma/yazma, dava klasoru | Drive MCP otomatik |
| MemPalace | Buro ic deneyim hafizasi | buro-hafizasi MCP otomatik |
| QMD | Gecmis raporlarda semantik arama | qmd CLI / MCP |
| Gmail | Muvekkile belge talep maili | Gmail MCP komutla |
| Google Calendar | Sure ve durusma tarihleri | Calendar MCP komutla |
| LLM Web (fallback) | Mevzuat CLI'nin ulasamadigi yeni mevzuat | Arastirmaci ajan ic mantigi |

---

## Sik Karsilasilan Durumlar

### "Yargi CLI sonuc donmuyor"

Normal. Farkli terimlerle 2-3 kez daha dene. Hala yoksa: "Manuel arama
onerilir" notu duser. Daire bazli filtrele (iscilik -> 9. HD veya 22. HD).

### "NotebookLM erisim hatasi"

Arastirma devam eder, sadece o kaynak atlanir. Rapora "[NotebookLM HATASI]"
notu eklenir. Avukata bildirim gider.

### "Dilekce yapay zeka gibi gorunuyor"

Utandirma testi bunu yakalar. "Ozetle", "Sonuc olarak", "Belirtmek gerekir
ki" gibi ifadeler otomatik temizlenir. Ek onlem: `sablonlar/` klasorune
onaylanmis dilekceler ekle.

### "Hesaplama tutarsiz gorunuyor"

Kalite Kapi 4 bunu yakalar. Usul raporundaki rakamlarla dilekce talepleri
karsilastirilir. Tutarsizsa UYARI verilir.

### "Context window doldu / session kesildi"

Sistem her 5 sorgu sonrasi checkpoint kaydeder
(`02-Arastirma/checkpoint-{saat}.md`). Yeni session'da "arastirmaya devam et"
dersen checkpoint'tan kaldigi yerden devam eder.

### "Yeni dosya Drive'a dustu ama QMD bilmiyor"

Terminal'de `qmd update` calistir. Yeni dosyalar indexlenir.
Embedding icin: `GGML_CUDA=0 qmd embed`.

### "DOCX uretilmedi"

Director her ASAMA bitiminde otomatik `python scripts/md_to_docx.py
{dava-klasoru}` calistirmali. Eksikse manuel calistir. Klasordeki tum
yeni MD'ler DOCX'e cevrilir (idempotent).

### "MCP baglanti hatasi"

`~/.claude/settings.json` veya `.mcp.json` dosyasindaki MCP ayarlarini
kontrol et. Health check: ilgili MCP icin `mempalace_status` veya
benzer status komutu cagir.

### "Mevzuat CLI'da madde yok"

mevzuat.gov.tr'den manuel dogrulama oner. Cok yeni mevzuat ise LLM Web
fallback devreye girer (kaynak URL + yayim tarihi rapora eklenir).

---

## Hizli Referans Karti

```
TEMEL KOMUTLAR
----------------------------------------------------------------------
DAVA AC          -> yeni dava: [isim], [tur] / ozet: [...] / kritik nokta: [...]
ARASTIR          -> arastir: [konu]
USUL             -> usul: [dava turu]
STRATEJIK ANALIZ -> stratejik analiz: [dava-id]   (5 Ajan 4A-4E)
DILEKCE V1       -> dilekce v1: [dava-id]
DILEKCE          -> dilekce yaz                    (kisa yol)
IHTARNAME        -> ihtarname yaz
SOZLESME         -> sozlesme yaz
HESAPLA          -> hesapla: giris:..., cikis:..., net:..., fesih:...
SAVUNMA          -> savunma simule et: [dava-id]
REVIZYON         -> revize et: [dava-id]           (v2 NIHAI)
BRIEFING         -> briefing: [dava-id]
ICTIHAT TARA     -> ictihat tara
TAKVIM           -> sure ekle: [tarih, tur]
BLOG             -> blog yap: [konu]

ALT-MOD KOMUTLARI (2026-04 eklendi)
----------------------------------------------------------------------
BILIRKISI        -> arastir bilirkisi: [dava-id] [rapor-dosyasi]
SWOT (*banner)   -> swot arastir: [dava-id]
SOZLESME INCELE  -> sozlesme incele: [dosya-yolu]
ISTINAF          -> istinaf yaz: [dava-id]
TEMYIZ           -> temyiz yaz: [dava-id]
MUVEKKIL BILG.   -> muvekkil bilgilendir: [dava-id]
STRATEJI (G+C)   -> strateji degerlendir: [dava-id]

ALT KOMUTLAR (Hedefli arastirma)
----------------------------------------------------------------------
arastir yargi: [konu]     (sadece Yargi CLI)
arastir mevzuat: [konu]   (sadece Mevzuat CLI)
arastir notebook: [konu]  (sadece NotebookLM)

KVKK (yerel terminalde, scripts/ klasorunde)
----------------------------------------------------------------------
DICT KUR         -> python maske.py --dict <dava-id> add --muvekkil ... --karsi-taraf ...
UNMASK           -> python maske.py --dict <dava-id> unmask <input.md> <output.md>
DOCX             -> python md_to_docx.py <dava-klasoru>
UDF              -> python md_to_udf.py <input.md>  (sadece nihai)
```

---

## Dosya Haritasi (Neyi Nerede Bulursun)

| Dosya | Icerigi |
|-------|---------|
| `AGENTS.md` | Tum sistem talimatlari ve kurallar (anayasa) |
| `ajanlar/perspektif/PROTOKOL.md` | Bu dosya — sistem akisi + komut + kalite + hafiza + KVKK + normlar hiyerarsisi |
| `legal.local.md` | Buronun kendi kurallari ve tercihleri |
| `dilekce-yazim-kurallari.md` | Dilekce yazim standartlari |
| `docs/maskeleme-kilavuzu.md` | KVKK Seviye 2 maske.py kullanim ornekleri ve sorun giderme |
| `arsiv/eski-notlar/BRAINSTORMING.md` | Uzun vadeli iyilestirme planlari (Seviye 3-4) |
| `.mcp.json` | MCP sunucu konfigurasyonu |
| `config/motor-haritasi.json` | rol haritasi (ORKESTRATOR/ARASTIRMACI/MUHAKEME/DENETCI) |
| `config/masks/{dava-id}.json` | KVKK dict — yerel disk, git-disi |
| `config/.env` | API anahtarlari (gizli) |
| `ajanlar/*/SKILL.md` | Her ajanin detayli gorev talimati |
| `ajanlar/*/system-prompt.md` | Her ajanin kisa kimlik ozeti |
| `scripts/maske.py` | KVKK maske/unmask scripti |
| `scripts/md_to_docx.py` | MD -> DOCX donusturucu |
| `scripts/md_to_udf.py` | MD -> UDF donusturucu (UYAP icin) |
| `arsiv/scripts/gemini-bridge.sh` | ARSIV — eski kopru scripti (exit 100) | <!-- vendor-ok: tarihçe kaydı -->
| `AGENTS.md` | MUHAKEME rolu devir bloklari, self-review, fallback kilavuzu |
| `sablonlar/` | Rapor ve dilekce sablonlari |
| `bilgi-tabani/` | Hesaplama dogrulama, QMD rehberi, haftalik ictihat |
| `prompts/muhakeme/` | MUHAKEME prompt sablonlari |
| `logs/model-events.jsonl` | Her LLM cagrisi kayit (fallback metrigi) |

---

## Ilk Kullanimda Yapilacaklar Checklist

- [x] AGENTS.md okundu (stub'lar oraya yonlendirir)
- [x] ajanlar/perspektif/PROTOKOL.md okundu (bu dosya — ana referans)
- [x] Google Drive bagli (`G:\Drive'im\Hukuk Burosu`)
- [x] MemPalace aktif (`buro-hafizasi` MCP)
- [x] QMD kurulu ve indexli (310 dosya, 1411 chunk)
- [x] NotebookLM bagli (`notebooklm` MCP)
- [x] `scripts/maske.py` calistiriliyor (KVKK Seviye 2)
- [x] `scripts/md_to_docx.py` calistiriliyor (DOCX zorunlu)
- [x] `scripts/md_to_udf.py` calistiriliyor (UDF nihai dilekce)
- [x] `config/motor-haritasi.json` -> roller ve task->rol eslemesi
- [ ] Ilk davayi `yeni dava: ...` ile ac ve akisi gozlemle
- [ ] Briefing formunu doldurmayi dene
- [ ] Sonuclardaki GUVEN NOTU'nu kontrol et
- [ ] Begendigin dilekceyi `sablonlar/` klasorune koy (uslup referansi olur)

---

## v2'den v3'e Degisiklik Ozeti

| Eski (v2) | Yeni (v3) |
|-----------|-----------|
| "Faza" | "Asama" |
| Dilekce v1 -> Simulasyon -> Dilekce v2 -> Stratejik analiz (opsiyonel) | Arastirma -> Usul -> Stratejik Analiz -> Dilekce v1 -> Simulasyon -> Dilekce v2 |
| Stratejik analiz opsiyoneldi | Stratejik analiz zorunlu ve dilekce oncesi |
| Dilekce v1 bos sayfadan baslardi | Dilekce v1 stratejik analizin "yazim rehberi" ile baslar |
| 5 faza | 7 asama |

Temel felsefe: **Dilekce en sona kalir.** Once arastirma + strateji
olgunlasir, sonra dilekce bu zemin uzerine yazilir ve iki katmanli
revizyondan gecer.

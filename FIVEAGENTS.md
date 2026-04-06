# 5 Ajanli Stratejik Hukuk Analiz Sistemi - Is Diyagrami

Bu belge, bir dava arastirmasinin basindan sonuna kadar
sistemin nasil calistigini adim adim anlatir.

> UYARI: Tum ciktilar TASLAK'tir. Nihai karar avukata aittir.

---

## Tam Akis - Kus Bakisi

```
AVUKAT
  |
  | "yeni dava: Ahmet Yilmaz, iscilik alacagi
  |  ozet: 4 yil calistiktan sonra istifa etti, 14 ay fazla mesai odenmedi
  |  kritik nokta: istifanin hakli fesih sayilip kidem alinip alinamayacagi"
  |
  v
=================================================================
  FAZA 1: HAZIRLLIK (Director Agent)
=================================================================
  |
  |-- [ADIM 0]  Drive klasoru olustur
  |-- [ADIM 0B] Kaynak sorgulama (avukata sor)
  |-- [ADIM 0C] Advanced briefing (opsiyonel)
  |
  v
=================================================================
  FAZA 2: USUL + ARASTIRMA (Paralel)
=================================================================
  |
  |-- AJAN 1: Usul Ajani ---------> usul-raporu.md
  |      |
  |      |-- gorevli/yetkili mahkeme
  |      |-- zamanasimi hesabi
  |      |-- arabuluculuk zorunlulugu
  |      |-- harc tahmini
  |      |-- risk analizi
  |      |-- muvekkil checklist
  |      |-- belge checklist
  |      `-- hesaplamalar (iscilik ise)
  |
  |-- AJAN 2: Arastirma Ajanlari -> arastirma-raporu.md
  |      |
  |      |-- [2A] Vektor DB ------> doktrin + emsal stratejisi
  |      |-- [2B] Yargi CLI ------> Yargitay/HGK/IBK kararlari
  |      |-- [2C] Mevzuat CLI ----> kanun maddeleri
  |      `-- [2D] NotebookLM -----> buro kaynaklari
  |
  v
=================================================================
  FAZA 3: BELGE URETIMI
=================================================================
  |
  |-- AJAN 3: Belge Yazari -------> dilekce-v1.md
  |      |
  |      `-- usul raporu + arastirma raporu + briefing
  |           birlestirilir, dilekce taslagi yazilir
  |
  v
=================================================================
  FAZA 4: KALITE KONTROL
=================================================================
  |
  |-- SAVUNMA SIMULATORU ---------> savunma-simulasyonu.md
  |      |
  |      `-- karsi taraf ne der? hakim ne sorar?
  |
  |-- REVIZYON AJANI -------------> dilekce-v2.md
  |      |
  |      `-- simulasyon bulgularina gore dilekce revize edilir
  |
  v
=================================================================
* FAZA 5: 5 AJANLI STRATEJIK ANALIZ (YENI - v2) *
=================================================================
  |
  |  Tetikleyici: "stratejik analiz: [dava-id]"
  |  Varsayilan: KAPALI (avukat istediginde calisir)
  |
  |  Girdi: Tum onceki fazalarin ciktilari
  |         (usul raporu + arastirma raporu + dilekce + simulasyon)
  |         tek bir "Arastirma Paketi" olarak toplanir
  |
  |              ARASTIRMA PAKETI
  |                    |
  |     +--------------+--------------+
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
  |     | 5. Dilekce revizyon onerileri |
  |     | 6. Durusma stratejisi        |
  |     | 7. Son tavsiye:              |
  |     |    KIRMIZI / YESIL / SARTLI  |
  |     +------------------------------+
  |
  v
=================================================================
  CIKTI: Avukata Teslim
=================================================================

  Drive'a kaydedilen dosyalar:
  01-Usul/usul-raporu.md
  02-Arastirma/arastirma-raporu.md
  03-Sentez-ve-Dilekce/dilekce-v1.md
  03-Sentez-ve-Dilekce/dilekce-v2.md   (revize)
  02-Arastirma/savunma-simulasyonu.md
  02-Arastirma/stratejik-analiz.md      (5 ajan ciktisi - YENi)
```

---

## Adim Adim Detayli Akis

### FAZA 1: Hazirlik

Bu fazada hic arastirma yapilmaz. Sadece calisma alani hazirlanir
ve avukattan gerekli bilgiler toplanir.

```
ADIM 0: Dava Hafizasini Ac
|
|-- Google Drive'da dava klasoru olustur:
|     G:\Drive'im\Hukuk Burosu\Aktif Davalar\
|     2026-001 Ahmet Yilmaz - Iscilik Alacagi\
|       |-- 01-Usul/
|       |-- 02-Arastirma/
|       |-- 03-Sentez-ve-Dilekce/
|       |-- 04-Muvekkil-Belgeleri/
|       `-- 05-Durusma-Notlari/
|
|-- Avukata Drive linkini ver
|
v
ADIM 0B: Kaynak Sorgulama (ZORUNLU)
|
|-- Avukata sor: "Hangi kaynaklar hazir?"
|     [ ] NotebookLM notebook
|     [ ] Google Drive klasoru
|     [ ] Yerel dosya
|     [ ] Hazir kaynak yok
|
|-- Cevap bekle. Cevap gelmeden ASLA ajan baslatma.
|
v
ADIM 0C: Advanced Briefing (OPSIYONEL)
|
|-- Avukata sor: "Detayli briefing yapmak ister misin?"
|-- EVET ise:
|     - Dava teorisi?
|     - En buyuk risk?
|     - Karsi taraf ne der?
|     - Ton tercihi? (sert / olculu / uzlasma)
|     - Olmazsa olmaz talepler?
|
`-- Briefing verisini 00-Briefing.md olarak kaydet
```

### FAZA 2: Usul + Arastirma (Paralel)

Ajan 1 ve Ajan 2 AYNI ANDA calisir. Birbirini beklemez.

```
AJAN 1: USUL AJANI                    AJAN 2: ARASTIRMA AJANLARI
(davanin hukuki iskeleti)              (kritik noktanin derin arastirmasi)
         |                                        |
         |                              +---------+---------+----------+
         |                              |         |         |          |
         v                              v         v         v          v
  legal.local.md oku              Vektor DB   Yargi CLI  Mevzuat   NotebookLM
  dava turune gore usul             (2A)       (2B)      CLI (2C)    (2D)
  cercevesini cikar                  |         |         |          |
         |                           |  "fazla mesai     |          |
         |                           |   ispat yuku      |          |
  usul-raporu.md olustur:            |   imzali bordro"  |          |
  - Gorevli mahkeme                  |         |         |          |
  - Yetkili mahkeme                  v         v         v          v
  - Zamanasimi                    doktrin   Yargitay   kanun     buro
  - Arabuluculuk                  emsal     HGK/IBK    madde     kaynaklari
  - Harc tahmini                  strateji  kararlari  metinleri
  - Risk analizi                     |         |         |          |
  - Muvekkil checklist               +----+----+---------+----------+
  - Belge checklist                       |
  - Hesaplamalar                          v
         |                     arastirma-raporu.md olustur:
         |                     - Kullanilan kaynaklar
         |                     - Ilgili mevzuat
         |                     - Guncel Yargitay kararlari
         |                     - HGK/IBK kararlari
         |                     - Vektor DB bulgulari
         |                     - Celiskili noktalar
         |                     - Guncellik kontrolu
         |                     - Dilekceye tasinacak argumanlar
         |                              |
         +--------- IKISI DE BITTI -----+
                         |
                         v
                      FAZA 3
```

### FAZA 3: Belge Uretimi

```
AJAN 3: BELGE YAZARI
         |
         |-- usul-raporu.md oku
         |-- arastirma-raporu.md oku
         |-- 00-Briefing.md oku (varsa)
         |-- dilekce-yazim-kurallari.md oku
         |-- sablonlar/ klasorunden uslup referansi al
         |
         v
  Dilekce taslagi yaz:
  - Olaylar (kronolojik, olgusal)
  - Hukuki degerlendirme (argumanlar + kararlar)
  - Deliller
  - Hukuki nedenler
  - Sonuc ve talep (her kalem ayri, net tutar)
         |
         v
  Kalite kontrol:
  [x] En az 2 Yargitay kararina atif var mi?
  [x] Tutarlar usul raporuyla tutarli mi?
  [x] Zamanasimi savunmasina karsi pozisyon var mi?
  [x] Arabuluculuk tutanagina atif var mi?
         |
         v
  dilekce-v1.md olarak kaydet
```

### FAZA 4: Kalite Kontrol

```
SAVUNMA SIMULATORU
         |
         |-- dilekce-v1.md + arastirma-raporu.md oku
         |
         v
  Karsi tarafin gozuyle incele:
  - En guclu itirazlar neler?
  - Delil itirazlari neler?
  - Usul itirazi gelir mi?
  - Hakimin muhtemel sorusu ne?
         |
         v
  savunma-simulasyonu.md kaydet
         |
         v
REVIZYON AJANI
         |
         |-- dilekce-v1.md + savunma-simulasyonu.md oku
         |
         v
  Simulasyondaki risklere gore dilekceyi guclendir:
  - Zayif argumanlar pekistirilir
  - Eksik delil talepleri eklenir
  - Proaktif savunma eklenir
         |
         v
  dilekce-v2.md kaydet
```

### FAZA 5: 5 Ajanli Stratejik Analiz (v2 - YENi)

Bu faza mevcut sisteme EKLENEN opsiyonel bir katmandir.
Avukat `stratejik analiz: [dava-id]` dediginde calisir.

```
TETIKLEME
  |
  v
ARASTIRMA PAKETI OLUSTUR
  |
  |-- usul-raporu.md
  |-- arastirma-raporu.md
  |-- dilekce-v1.md veya v2.md
  |-- savunma-simulasyonu.md
  |-- briefing.md (varsa)
  |-- muvekkil belgeleri (varsa)
  |
  |  Hepsi tek bir JSON pakete toplanir
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
  |  Ayni arastirma paketi 4 ajana AYNI ANDA gonderilir
  |  (Promise.allSettled - biri cokse digerleri devam eder)
  |
  +---> DAVACI AVUKAT AJANI
  |       "Bu dosyada bizim icin en guclu ne var?"
  |       Cikti:
  |       - Dosyanin genel gucu: Yuksek/Orta/Dusuk
  |       - En guclu 5 arguman
  |       - Ek delil talepleri
  |       - Dilekceye eklenmesi gerekenler
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
  |
  |  Cikti:
  |  1. DOSYA OZETI
  |     Tek paragraf - davanin durumu
  |
  |  2. EN GUCLU 3 ARGUMAN
  |     Tum perspektiflerden uzlasan noktalar
  |
  |  3. EN BUYUK 3 RISK + COZUM
  |     Risk: "Bordrolarda fazla mesai sutunu dolu"
  |     Cozum: "Tanik beyanlari ve mesaj kayitlari ile destekle"
  |
  |  4. ONERILEN GENEL STRATEJI
  |     Dava devam mi? Sulh mu? Delil tamamlamasi mi?
  |
  |  5. DILEKCE REVIZYON ONERILERI
  |     - Madde 3'e su karari ekle
  |     - Delil listesine banka dokumu ekle
  |     - Sonuc kisminda X tutari guncelle
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
RAPOR KAYDET
  |
  |-- stratejik-analiz.md -> Drive'a kaydet
  |-- JSON sonucu da sakla (programatik erisim icin)
  |
  v
AVUKATA TESLIM
  "5 ajanli stratejik analiz tamamlandi.
   Son tavsiye: [YESIL ISIK / KIRMIZI ALARM / SARTLI ILERLEME]
   Rapor: [Drive linki]"
```

---

## Somut Ornek: Iscilik Alacagi Davasi

Avukat su komutu veriyor:

```
yeni dava: Ahmet Yilmaz, iscilik alacagi
ozet: Muvekkil 4 yil calistiktan sonra istifa etmis gorunuyor
      ancak odenmemis 14 aylik fazla mesai alacagi mevcut.
kritik nokta: Odenmemis fazla mesai nedeniyle iscinin istifasinin
              hakli fesih sayilarak kidem tazminatina hak kazanip
              kazanmadigi.
```

Sistemin adim adim yaptiklari:

```
[FAZA 1 - HAZIRLIK]

  1. Drive'da klasor olustur:
     2026-001 Ahmet Yilmaz - Iscilik Alacagi/

  2. Avukata sor: "Is hukuku icin kaynak var mi?"
     Avukat: "NotebookLM is hukuku notebook'u var"

  3. Briefing sor: "Detayli briefing ister misin?"
     Avukat: "Evet"
     -> Dava teorisi: Hakli fesih - odenmemis ucret
     -> Risk: Istifa dilekçesi var
     -> Ton: Profesyonel ve olculu

[FAZA 2 - USUL + ARASTIRMA] (paralel)

  AJAN 1 calistiriyor:
    - Is mahkemesi gorevli (7036 s.K.)
    - 5 yil zamanasimi (01.01.2018 sonrasi)
    - Arabuluculuk zorunlu
    - Kidem + ihbar + fazla mesai + yillik izin hesabi
    -> usul-raporu.md kaydedildi

  AJAN 2 calistiriyor:
    - Vektor DB: "fazla mesai ispat yuku bordro" sorgusu
    - Yargi CLI: "istifa hakli fesih odenmemis ucret" 9. HD kararlari
    - Mevzuat CLI: Is Kanunu m.24/II-e
    - NotebookLM: is hukuku notebook'u sorgusu
    -> arastirma-raporu.md kaydedildi

[FAZA 3 - DILEKCE]

  AJAN 3 calistiriyor:
    - Usul + arastirma + briefing birlestiriliyor
    - Dilekce taslagi yaziliyor
    - 3 Yargitay karari, Is K. m.24, m.41 atif
    -> dilekce-v1.md kaydedildi

[FAZA 4 - KALITE KONTROL]

  SAVUNMA SIMULATORU:
    - "Karsi taraf istifa dilekcesiniz var diyecek"
    - "Bordrolarda imza var, fazla mesai ispati zor"
    -> savunma-simulasyonu.md

  REVIZYON AJANI:
    - Istifa konusuna proaktif paragraf eklendi
    - Tanik stratejisi guclendirild
    -> dilekce-v2.md kaydedildi

[FAZA 5 - STRATEJIK ANALIZ] (avukat isterse)

  Avukat: "stratejik analiz: 2026-001"

  4 ajan paralel calisiyor:

  DAVACI AVUKAT:
    "Dosya gucu: ORTA-YUKSEK. En guclu arguman:
     odenmemis fazla mesai = hakli fesih (Yarg. 9.HD 2023/...)
     Ek delil talebi: banka dokumleri, mesai kayitlari"

  DAVALI AVUKAT:
    "En tehlikeli itiraz: imzali istifa dilekçesi.
     Bordrolarda fazla mesai sutunu dolu.
     Zamanasimi savunmasi 2020 oncesi icin mumkun."

  BILIRKISI:
    "Mali hesaplamada kidem tavani dogru uygulanmis.
     Fazla mesai hesabi icin banka dokumu ile teyit gerekli.
     Bordro imzalari incelenmeli."

  HAKIM:
    "Muhtemel karar: Kismi kabul.
     Bozma riski: DUSUK (yerlesik ictihat).
     Ek soru: Istifa dilekçesinin iradeyi yansitip yansitmadigi."

  SENTEZ AJANI:
    "SON TAVSIYE: SARTLI ILERLEME
     - Banka dokumleri alinmadan davaya girilmemeli
     - Istifa konusu icin tanik hazirlanmali
     - Fazla mesai icin mesaj/kamera delili toplanmali
     Bunlar tamamlanirsa dosya GUCLU."

  -> stratejik-analiz.md Drive'a kaydedildi
```

---

## Komut Referansi

| Komut | Ne Yapar |
|-------|----------|
| `yeni dava: [isim], [tur]` | Tum sistemi baslat (Faza 1-4) |
| `stratejik analiz: [dava-id]` | 5 ajanli analizi baslat (Faza 5) |
| `usul: [dava turu]` | Sadece usul raporu (Ajan 1) |
| `arastir: [kritik nokta]` | Sadece arastirma (Ajan 2) |
| `dilekce yaz` | Sadece dilekce (Ajan 3) |
| `savunma simule et: [dava-id]` | Sadece savunma simulasyonu |
| `revize et: [dava-id]` | Sadece revizyon |

---

## Teknik Detaylar

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
| PreToolUse | Analiz baslamadan once | Arastirma paketi gecerli mi kontrol eder |
| PostToolUse | Her ajan bittikten sonra | Cikti bos mu, cok kisa mi kontrol eder |
| TaskCompleted | Her ajan tamamlandiginda | Sure ve basari/basarisizlik loglar |
| BeforeSentez | Sentez oncesi | 4 raporun formatini dogrular |
| OnError | Hata durumunda | Coken ajan varsa eksik veriyle devam eder |

### Hata Toleransi

- 4 ajandan **4/4 basarili**: Tam sentez
- 4 ajandan **3/4 basarili**: Eksik perspektifle sentez (uyari notu eklenir)
- 4 ajandan **2/4 basarili**: Sinirli sentez (avukata "eksik analiz" uyarisi)
- 4 ajandan **1/4 veya 0/4**: DURDUR, sentez yapilamaz

### Drive Cikti Yapisi

```
G:\Drive'im\Hukuk Burosu\Aktif Davalar\{dava-id}\
  |-- 00-Briefing.md
  |-- 01-Usul/
  |     `-- usul-raporu.md
  |-- 02-Arastirma/
  |     |-- arastirma-raporu.md
  |     |-- savunma-simulasyonu.md
  |     `-- stratejik-analiz.md        <-- 5 ajan ciktisi (YENi)
  |-- 03-Sentez-ve-Dilekce/
  |     |-- dilekce-v1.md
  |     |-- dilekce-v2.md
  |     `-- revizyon-raporu.md
  |-- 04-Muvekkil-Belgeleri/
  `-- 05-Durusma-Notlari/
```

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
4. Derin arastirma yapilir (Yargi + Mevzuat + NotebookLM + Vektor DB)
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
  ASAMA 2: DERIN ARASTIRMA (Arastirma Ajanlari - Paralel)
=================================================================
  |
  |  Hepsi AYNI ANDA calisir. Dordu de bittiginde tek rapor uretilir.
  |
  |-- [2A] Vektor DB --------> doktrin + emsal stratejisi
  |-- [2B] Yargi CLI --------> Yargitay / HGK / IBK kararlari
  |-- [2C] Mevzuat CLI ------> kanun maddeleri (tam metin)
  |-- [2D] NotebookLM -------> buro kaynaklari (ITERATIF SORGU)
  |         |
  |         |  NotebookLM Sorgu Kurallari:
  |         |  - Her soruda "SADECE KAYNAKLARA GORE CEVAP VER,
  |         |    UYDURMA YAPMA" ibaresi ZORUNLU
  |         |  - Iteratif sorgulama: hukuki meseleyi iyice
  |         |    irdeleyip tatmin olunana kadar EN AZ 6 SORU
  |         |  - Ardindan 5 ajanli sisteme hazirlik icin
  |         |    4 EK PERSPEKTIF SORUSU:
  |         |    * Davaci avukat bakis acisi
  |         |    * Davali avukat bakis acisi
  |         |    * Bilirkisi bakis acisi
  |         |    * Hakim bakis acisi
  |         |  - TOPLAM: En az 10 sorgu (6 genel + 4 perspektif)
  |
  |  Cikti: 02-Arastirma/arastirma-raporu.md
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

### ASAMA 2: Derin Arastirma (Paralel)

Arastirma kollari AYNI ANDA calisir. Hepsi bittiginde
tek bir konsolidé arastirma raporu uretilir.

```
BASLATICI: Director Agent
  |
  |  Dort kolu ayni anda tetikler:
  |
  +---> [2A] VEKTOR DB
  |        Araclar: hukuk_ara MCP
  |        Sorgu: kritik noktanin semantik karsiligi
  |        Cikti: doktrin + emsal stratejisi + benzerlik skoru
  |
  +---> [2B] YARGI CLI  (DERIN ITERATIF PROTOKOL - ZORUNLU)
  |        Araclar: yargi bedesten search/doc
  |        Mod: Her zaman derin, tek-shot yasak, Max Effort thinking
  |        Minimum: 15 sorgu / 6 faz
  |
  |        Faz 1: Terim uretimi (5-7 alternatif + daire tespiti)
  |        Faz 2: Genis tarama (ana terim + HGK + IBK + alternatif)
  |        Faz 3: Daraltilmis arama (tarih + daire filtreleri)
  |        Faz 4: TEMPORAL EVOLUTION - Son 5 Yil Seyri (ZORUNLU)
  |               - 2021, 2022, 2023, 2024, 2025 yil-yil ayri sorgu
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
  |
  +---> [2C] MEVZUAT CLI  (DERIN ITERATIF PROTOKOL - ZORUNLU)
  |        Araclar: mevzuat search/doc/article/tree/gerekce
  |        Mod: Her zaman derin, tek-shot yasak, Max Effort thinking
  |        Minimum: 8 sorgu / 4 faz
  |
  |        Faz 1: Ana kanun - search + tree + article
  |        Faz 2: Degisiklik gecmisi - gerekce + history
  |               (olay tarihine gore dogru versiyon tespiti)
  |        Faz 3: Ilgili madde zinciri - onceki/sonraki madde +
  |               atif yapilan maddeler
  |        Faz 4: Alt mevzuat - yonetmelik + teblig + genelge
  |
  |        Cikti: mevzuat tam metni + gerekce + degisiklik
  |               tarihcesi + yonetmelik/teblig + atif zinciri
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

  |
  v
4 KOL TAMAMLANDIKTAN SONRA KONSOLIDE RAPOR
  |
  `-- 02-Arastirma/arastirma-raporu.md
      Icerik:
      - Kullanilan kaynaklar (her kolun listesi)
      - Ilgili mevzuat (+ gerekce + degisiklik gecmisi)
      - Guncel Yargitay kararlari
      - HGK / IBK kararlari
      - SON 5 YIL ICTIHAT SEYRI ANALIZI (2B Faz 4 ciktisi)
      - Vektor DB bulgulari
      - NotebookLM iteratif bulgu ozeti
      - Celiskili noktalar
      - Guncellik kontrolu
      - Dilekceye tasinacak argumanlar (on liste)
```

### ASAMA 3: Usul Raporu

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

[ASAMA 2 - DERIN ARASTIRMA] (paralel)
  Dort kol ayni anda:
  - 2A Vektor DB: "fazla mesai bordro esasli degisiklik" sorgulari
  - 2B Yargi CLI: 9. HD + HGK + IBK son 2 yil
  - 2C Mevzuat CLI: Is K. m.2, m.5, m.17, m.22, m.24, m.32
  - 2D NotebookLM: iteratif 10 sorgu (6 irdeleme + 4 perspektif)
  -> arastirma-raporu.md kaydedildi

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

| Komut | Ne Yapar |
|-------|----------|
| `yeni dava: [isim], [tur]` | Tum sistemi baslat (Asama 1-7) |
| `briefing: [dava-id]` | Sadece Asama 1 (hazirlik + briefing) |
| `arastir: [dava-id]` | Sadece Asama 2 (derin arastirma) |
| `usul: [dava-id]` | Sadece Asama 3 (usul raporu) |
| `stratejik analiz: [dava-id]` | Sadece Asama 4 (5 ajanli analiz) |
| `dilekce v1: [dava-id]` | Sadece Asama 5 (ilk taslak) |
| `savunma simule et: [dava-id]` | Sadece Asama 6 |
| `revize et: [dava-id]` | Sadece Asama 7 (nihai v2) |

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

### Drive Cikti Yapisi

```
G:\Drive'im\Hukuk Burosu\Aktif Davalar\{dava-id}\
  |-- 00-Briefing.md                       (Asama 1)
  |-- 01-Usul/
  |     `-- usul-raporu.md                 (Asama 3)
  |-- 02-Arastirma/
  |     |-- arastirma-raporu.md            (Asama 2)
  |     |-- stratejik-analiz.md            (Asama 4 - 5 ajan)
  |     `-- savunma-simulasyonu.md         (Asama 6)
  |-- 03-Sentez-ve-Dilekce/
  |     |-- dilekce-v1.md                  (Asama 5)
  |     `-- dilekce-v2.md                  (Asama 7 - NIHAI)
  |-- 04-Muvekkil-Belgeleri/
  `-- 05-Durusma-Notlari/
```

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

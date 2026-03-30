# SONYAPILANLAR

## UDF ve Pipeline Duzeltmeleri

- `udf-cli` tarafinda CDATA offset ve newline bozulmasi giderildi.
- Gercek fixture testleri tasinabilir hale getirildi; fixture dizini yoksa skip davranisi eklendi.
- HTML serializer nested list seviyelerini koruyacak sekilde gelistirildi.
- UDF okuma/yazma akisi ornek `.udf`, ornek iscilik dilekcesi ve gercek dava markdown'i ile dogrulandi.
- `vektordb_v2_pilot` tarafinda:
  - OCR metadata alanlari dinamik provider/method ile uyumlu hale getirildi.
  - `slugify` Turkce karakterleri dogru donusturecek sekilde duzeltildi.
  - `requirements.txt` eklendi.

## Repo ve Calisma Kurallari

- `REVIEWCODEX.md` olusturuldu; ilk kod inceleme bulgulari yazildi.
- `CODEXPLAN.md` olusturuldu ve entegrasyon fazlari planlandi.
- `CLAUDE.md`, `SONCLAUDE.md` ve ilgili ajan `SKILL.md` dosyalarina kalici kayit politikasi eklendi.
- Yeni dava ciktilarinin Google Drive altina yazilmasi kural haline getirildi:
  - `G:\Drive'ım\Hukuk Bürosu\Aktif Davalar`
  - `G:\Drive'ım\Hukuk Bürosu\Bekleyen Davalar`
- `.env.example` ve `.gitignore` guncellendi; hassas dosyalarin repoya girmesi sinirlandi.

## Operasyon Sablonlari

- `sablonlar/` altina reusable calisma dosyalari eklendi:
  - `advanced-briefing-template.md`
  - `usul-raporu-template.md`
  - `arastirma-raporu-template.md`
  - `evrak-listesi-template.md`
  - `savunma-simulasyonu-template.md`
  - `revizyon-raporu-template.md`
  - `dava-klasoru-checklist.md`
- Bu sablonlar merkezi talimat ve ajan dosyalarina baglandi.
- Sablon metadata alanlari zenginlestirildi:
  - hazirlanma tarihi
  - dava ID
  - muvekkil
  - mahkeme / esas no
- Evrak listesi sablonundaki bozuk `bilirkisi` yazimi duzeltildi.

## HukukTakip Teknik Saglamlastirma

- `isbu-ofis/hukuk-takip` build zinciri duzeltildi.
- `shared`, `server` ve `client` arasindaki path/export cozumleme hatalari giderildi.
- `npm run build` calisir hale getirildi.
- Route bazli sahiplik/yetki kontrolleri sertlestirildi:
  - `cases`
  - `hearings`
  - `collections`
  - `expenses`
  - `notes`
  - `tasks`
  - `notifications`
  - `clients`
- `cookies.txt` gibi hassas gelistirme kalintilari ignore edildi.
- Drizzle config ve migration scriptleri `.env` ile tutarli calisacak sekilde duzeltildi.

## HukukTakip AI Workspace Entegrasyonu

- `cases` veri modeline AI Workspace alanlari eklendi:
  - `automationCaseCode`
  - `automationStatus`
  - `driveFolderPath`
  - `briefingPath`
  - `procedurePath`
  - `researchPath`
  - `defenseSimulationPath`
  - `revisionPath`
  - `pleadingMdPath`
  - `pleadingUdfPath`
- Ilgili migration eklendi: `0003_ai_workspace_bridge.sql`
- Yeni dava veya guncellemede otomatik path turetme mantigi eklendi.
- Eski/yanlis Drive root path kayitlari yeni root ile yeniden turetilecek sekilde normalize edildi.
- Google Drive aktif dava root'u `.env` ile konfigure edilebilir hale getirildi:
  - `AI_ACTIVE_CASES_ROOT`

## HukukTakip UI Gelistirmeleri

- Case formuna AI Workspace alani eklendi.
- Case detail sayfasina AI Workspace karti eklendi.
- Case listesi ve dashboard uzerinde AI durum gorunurlugu eklendi.
- `AI ile Dava Baslat` aksiyonu eklendi.
- Dashboard'a belge ozeti ve son belgeler paneli eklendi.
- Case detail icine `Belgeler` sekmesi eklendi; dava bazli belge kayitlari ve
  AI evrak-listesi yolu artik gorunuyor.
- Case detail `Belgeler` sekmesine belge yukleme, indirme ve silme aksiyonlari
  eklendi.

## AI ile Dava Baslat Akisi

- Dava detay ekranindaki buton ile su akis calisiyor:
  - kanonik dava kodunu netlestirir
  - Drive root altinda dava klasorunu olusturur
  - alt klasor yapisini kurar
  - temel briefing/usul/arastirma/revizyon/dilekce dosyalarini olusturur
  - ilk AI gorevlerini olusturur
  - AI Workspace notunu kaydeder
- Olusan dosyalar mevcutsa ezilmez.
- Hata mesaji iyilestirildi; Drive erisim sorunlari artik acik metin olarak donuyor.
- Workspace olusturma akisi artik repo kokundeki `sablonlar/` dizinini bularak
  briefing, usul, arastirma, savunma, revizyon ve evrak dosyalarini
  template tabanli uretiyor.
- Template dosyalari bulunamazsa akisin kirilmamasi icin guvenli fallback
  icerikleri korunuyor.
- Belge yukleme akisi AI workspace ile baglandi:
  - workspace varsa dosya `04-Muvekkil-Belgeleri\00-Ham` altina yazilir
  - workspace yoksa guvenli local upload klasorune dusurulur
  - her yukleme `documents` tablosuna kaydedilir
  - belge indirme `api/documents/:id/download` uzerinden yapilir
- Belge upload/delete akisi `evrak-listesi.md` ile senkronize edildi:
  - `Muvekkilden Gelen Ham Evraklar` tablosundaki otomatik blok guncellenir
  - yuklenen belge satiri tarih ve aciklama ile eklenir
  - silinen belge satiri otomatik bloktan cikarilir
- `evrak-listesi.md` icin yari otomatik tasnif katmani eklendi:
  - dosya adi ve belge aciklamasina gore on tasnif uretilir
  - `Tasnif Edilmis Evraklar` tablosu otomatik klasor onerisi ile doldurulur
  - dava turune gore beklenen temel belgeler `Eksik Evraklar` tablosuna yazilir
  - yeni auto marker bloklari ile mevcut checklist dosyalari geriye donuk guncellenebilir
- Belge yukleme modulu UYAP ve muvekkil evragi kullanimina gore genisletildi:
  - tekli yukleme yerine toplu belge yukleme eklendi
  - `pdf`, `udf`, `zip`, `tif`, `tiff`, `jpg`, `jpeg`, `png`, `webp`, `heic`,
    `heif`, `bmp`, `doc`, `docx`, `xls`, `xlsx` uzantilari desteklenir
  - multer memory storage yerine temp disk storage kullanilarak buyuk belge
    akisi daha guvenli hale getirildi
  - belge basi limit `75 MB`, tek istekte limit `20 belge` olarak ayarlandi
  - desteklenmeyen uzanti ve limit asimi icin kullaniciya acik hata mesaji verilir
- Dava detayindaki belge sekmesi iyilestirildi:
  - coklu dosya secimi ve secilen dosya listesi eklendi
  - yuklenecek formatlar ve limitler arayuzde gorunur hale getirildi
  - tablo satirlarinda belge tipi rozeti gosterilmeye baslandi
- Legacy AI workspace checklist dosyalari da desteklenir hale getirildi:
  - eski kisa `evrak-listesi.md` dosyalari ilk senkronizasyonda yeni otomatik
    ham / tasnif / eksik evrak bolumleri ile genisletilir

## Calisma Sirasinda Yapilan Dogrulamalar

- `udf-cli` icinde test ve build dogrulamalari yapildi.
- `vektordb_v2_pilot` Python derleme kontrolu yapildi.
- `isbu-ofis/hukuk-takip` icinde tekrarli `npm run build` dogrulamasi yapildi.
- `isbu-ofis/hukuk-takip` icinde template tabanli workspace guncellemesi sonrasi
  `npm run build` tekrar basariyla gecti.
- Belge modulu dashboard ve case detail entegrasyonu sonrasi `npm run build`
  tekrar basariyla gecti.
- Belge upload / delete CRUD entegrasyonu sonrasi `npm run build` tekrar
  basariyla gecti.
- `evrak-listesi.md` otomatik senkronizasyonu sonrasi `npm run build` tekrar
  basariyla gecti.
- Localhost uzerinden:
  - dava olusturma akisi test edildi
  - migration sureci duzeltildi
  - `AI ile Dava Baslat` akisi calisir hale getirildi
- Lokal test ortami toparlandi:
  - `docker compose up -d postgres` ile PostgreSQL konteyneri ayaga kaldirildi
  - `npm run db:migrate` ile schema dogrulandi ve migration'lar uygulandi
  - `/api/auth/login` endpoint'i terminalden dogrudan test edildi
  - demo kullanicilarin sifreleri test amacli calisir hale getirildi
- Evrak checklist yari otomatik tasnif akisi dogrulandi:
  - `npm run build` tekrar basariyla gecti
  - ornek markdown checklist uzerinde ham / tasnif / eksik evrak bloklari terminalden test edildi
- Belge upload akisi canli API uzerinden dogrulandi:
  - avukat oturumu ile gercek login yapildi
  - workspace'li bir dava uzerinde toplu `pdf`, `udf`, `zip` ve `tiff`
    yuklemesi terminalden basariyla test edildi
  - yuklenen belgelerin dava belge listesine dustugu dogrulandi
  - eski formatli `evrak-listesi.md` dosyasinin yeni otomatik bolumlerle
    yukseltildigi Google Drive uzerindeki gercek dosyada kontrol edildi
  - test amacli yuklenen ornek dosyalar ve gecmis test kalintilari temizlenerek
    checklist tekrar bos baslangic durumuna getirildi
- Faz 1 `AI Jobs` omurgasi eklendi:
  - `ai_jobs`, `ai_job_steps`, `ai_job_artifacts`, `ai_job_reviews`,
    `ai_job_sources` tablolari eklendi
  - dava detayina `Arastirma` sekmesi eklendi
  - dava bazli AI job olusturma, adim takip ve artifact goruntuleme akisi acildi
  - `npm run db:generate`, `npm run db:migrate` ve tam `npm run build`
    dogrulamasi basariyla tamamlandi
- Faz 2 `Intake + Briefing` omurgasi eklendi:
  - `case_intake_profiles` ve `case_briefings` tablolari eklendi
  - kritik nokta taslagi ureten backend heuristikleri eklendi
  - avukat yonlendirmesi + muvekkil gorusme notu + dava notlari + yuklenen
    belgelerden sentez ureten endpointler eklendi
  - kritik nokta onayi olmadan briefing uretimini engelleyen akis eklendi
  - dava detayindaki `Arastirma` sekmesine `Kritik Nokta` ve `Briefing`
    kartlari eklendi
  - `intake -> approve -> briefing -> approve` zinciri API uzerinden
    terminalde uctan uca dogrulandi
- Faz 3 `Kaynak Secimi + Gercek Arastirma Runner` omurgasi eklendi:
  - `case_research_profiles` tablosu ve `research_run_status` enum'u eklendi
  - dava detayindaki `Arastirma` sekmesine kaynak secimi paneli eklendi
  - avukat artik site uzerinden:
    - arastirma sorusu
    - anahtar kelimeler
    - Yargi MCP filtreleri
    - Mevzuat MCP kapsami
    - NotebookLM notebook adi
    - Vector DB koleksiyonlari
    girip kaydedebiliyor
  - `PUT /api/cases/:id/research-profile` ve
    `GET /api/cases/:id/research-profile` endpointleri eklendi
  - `POST /api/cases/:id/research/run` endpointi eklendi
  - backend icinde gercek kaynak runner'lari eklendi:
    - `yargi.cmd`
    - `mevzuat.cmd`
    - `nlm`
    - `python + chromadb`
  - kaynak kosulari sonucu:
    - `02-Arastirma/yargi-notlari.md`
    - `02-Arastirma/mevzuat-notlari.md`
    - `02-Arastirma/notebooklm-notlari.md`
    - `02-Arastirma/vector-notlari.md`
    - `02-Arastirma/arastirma-raporu.md`
    dosyalarina yazilir hale getirildi
  - arastirma kosusunun sonucu AI job adimlarina ve artifact kayitlarina
    yansitilir hale getirildi
  - `npm run db:generate`, `npm run db:migrate` ve tam `npm run build`
    tekrar basariyla gecti
  - canli testte:
    - research profile kaydi API uzerinden dogrulandi
    - arastirma kosusu API uzerinden tetiklendi
    - Yargi ve Mevzuat CLI komutlarinin dis sandbox'da gercek sonuc dondugu
      ayrica dogrulandi
  - Windows komut cagri katmani duzeltildi:
    - `research.ts` icindeki shell wrapper'i `cmd.exe` yerine PowerShell `&`
      uzerinden calisacak sekilde guncellendi
    - boylece `yargi.cmd` ve `mevzuat.cmd` araclarinda arguman bolunmesi ve yol
      soz dizimi hatasi giderildi
  - temiz dev restart sonrasi canli test tekrar edildi:
    - `POST /api/cases/:id/research/run` basariyla calisti
    - `Yargi MCP` gercek karar cekip `yargi-notlari.md` dosyasina yazdi
    - `Mevzuat MCP` gercek kosup `mevzuat-notlari.md` dosyasina yazdi
    - `arastirma-raporu.md` `completed` statu ile uretildi
  - Kritik nokta akisi duzeltildi:
    - `Taslagi Uret` artik ekrandaki guncel `Avukat Yonlendirmesi` ve
      `Muvekkil Gorusme Notu` ile backend'e gider
    - `Kritik Noktayi Onayla` artik ekrandaki manuel revizyonlari da ayni anda
      kaydeder ve sonra onaylar
    - boylece once `Profili Kaydet` demeden de kritik nokta taslagi dogru veri
      ile uretilebilir
  - Intake sentezinde sistem notu filtresi eklendi:
    - `[AI Workspace]` gibi otomatik sistem notlari olgu ozetine ve arama
      metnine karismayacak sekilde dislandi
  - canli API testi ile dogrulandi:
    - `generate-critical-point` guncel avukat / muvekkil metniyle calisti
    - `approve` manuel revize edilmis kritik nokta metnini veritabanina yazdi
  - Kritik nokta icin belge okuma katmani eklendi:
    - `Taslagi Uret` asamasinda yuklenen belgelerin icerigi da okunup senteze
      katilmaya baslandi
    - desteklenen dogrudan okuma formatlari:
      - `pdf` (metin tabanli pdf)
      - `udf` (zip icindeki `content.xml`)
      - `txt`, `md`, `json`, `xml`, `csv`, `html`
      - `docx` ve uygun `zip` icindeki metin/xml dosyalari
    - `png`, `jpg`, `jpeg`, `tiff` / `tif`, `webp`, `bmp`, `heic`, `heif`
      gibi gorsel belgeler artik OCR ile okunuyor
    - `tiff` / `tif` dosyalari gerekiyorsa arka planda `png` formatina
      donusturulup sonra OCR'a gonderiliyor
  - Kritik nokta sentezi daha spesifik hale getirildi:
    - `kusur`, `ziynet`, `whatsapp / mesaj`, `aldatma`, `nafaka`, `velayet`
      gibi girdiler kritik nokta metnine dogrudan yansitiliyor
    - sentez artik dava acilis notu + avukat yonlendirmesi + muvekkil gorusme
      notu + okunabilen belge metinleri birlikte degerlendirilerek yaziliyor
  - `Taslagi Uret` akisi genisletildi:
    - sistem artik ayni butonda
      - kritik nokta ozet metni
      - ana hukuki eksen
      - ikincil riskler
      - ispat riskleri
      - karsi tarafin olasi ilk savunma cizgisi
      - eksik bilgi
      - eksik belge
      alanlarini otomatik dolduruyor
    - ayni anda `Arastirma Sorusu` ve `Anahtar Kelimeler` alanlari da otomatik
      dolduruluyor
    - `Yargi` / `Mevzuat` / `NotebookLM` / `Vector DB` sorgu kutulari artik
      otomatik doldurulmuyor; kaynak secimi sonraki adim olarak manuel kaldi
  - Server tarafina LLM API hazirligi eklendi:
    - `.env` icinde `OPENAI_API_KEY` varsa intake taslagi LLM ile uretilecek
    - anahtar yoksa sistem fallback sentez ile calismaya devam edecek
    - ortam degiskenleri `.env.example` icine eklendi
  - `Anthropic` direct key destegi eklendi:
    - `intakeAi.ts` artik `ANTHROPIC_API_KEY` varsa native `Anthropic Messages API`
      ile calisiyor
    - `OPENAI_API_KEY` halen alternatif / uyumlu servis secenegi olarak kaldi
    - `.env.example` icine:
      - `ANTHROPIC_API_KEY`
      - `ANTHROPIC_MODEL`
      - `ANTHROPIC_BASE_URL`
      - `ANTHROPIC_VERSION`
      alanlari eklendi
    - tam build tekrar basariyla gecti
  - canli test:
    - `generate-critical-point` akisi API uzerinden tekrar dogrulandi
    - kritik nokta kutulari dolduruldu
    - `research-profile` icinde sadece `researchQuestion` ve
      `searchKeywords` guncellendi
    - kaynak sorgu alanlarinin bos kaldigi dogrulandi
  - Gorsel OCR katmani eklendi:
    - backend tarafinda `document_text_extract.py` icine `Anthropic`
      tabanli gorsel OCR akisi baglandi
    - `png` dosyasi uzerinde canli OCR testi yapildi ve `image_ocr_png`
      source type'i ile metin cikarimi alindi
    - `tiff` dosyasi uzerinde canli OCR testi yapildi ve
      `image_ocr_png_converted:.tiff` source type'i ile metin cikarimi alindi
    - cok sayfali `tiff` dosyalarinda ilk birkac frame tek gorselde
      birlestirilerek OCR'a gonderilecek sekilde iyilestirildi
    - boylece intake sentezi artik PDF/UDF/metin dosyalari yaninda UYAP'tan
      gelen taranmis gorsel belgeleri de okuyup analiz edebiliyor
  - Turkce karakter / gosterim duzeltmeleri yapildi:
    - ortak etiketler `client/src/lib/utils.ts` icinde temizlendi
    - `DashboardPage`, `CaseDetailPage`, `CaseFormPage`,
      `useResearch`, `useIntake` ve belge yardim metinlerinde bozuk veya
      ASCII kalmis bircok ifade duzeltildi
    - belge yukleme yardim metni gorsel OCR bilgisini gosterecek sekilde
      guncellendi

## Mevcut Durum

- Dava olusturma calisiyor.
- Lokal PostgreSQL servisi Docker uzerinden calisiyor.
- AI Workspace root'u dogru `.env` ayari ile Google Drive altinda calisiyor.
- `AI ile Dava Baslat` akisi aktif.
- `AI ile Dava Baslat` artik daha zengin briefing/usul/arastirma/savunma/revizyon
  sablonlari ile dosya uretiyor.
- Dashboard artik son belgeleri ve toplam belge sayisini gosteriyor.
- Dava detayinda belge modulu gorunur hale geldi.
- Belge modulu artik dava detayindan gercek dosya yukleme, indirme ve silme
  yapabiliyor; workspace olan davalarda dosyalar dogrudan dava klasorune gidiyor.
- Belge modulu artik toplu yuklemeyi destekliyor; UYAP'tan indirilen `pdf`,
  `udf`, `zip`, `tif` / `tiff` dosyalari ile yaygin foto ve ofis belgeleri
  dogrudan yuklenebiliyor.
- Workspace olan davalarda yuklenen belgeler `evrak-listesi.md` icindeki ham
  evrak tablosuna otomatik yansiyor.
- Workspace olan davalarda yuklenen belgeler artik:
  - ham evrak listesinde on tasnif etiketi aliyor
  - tasnif tablosunda onerilen `01-Tasnif/...` klasoru ile gorunuyor
  - dava turune gore eksik temel belge listesine etki ediyor
  - eski checklist dosyalari varsa otomatik olarak yeni tablo yapisina genisliyor
- Login akisi tekrar calisiyor:
  - `avukat@buro.com / Admin123!`
  - `asistan@buro.com / Asistan123!`
- Dava detayindaki `Arastirma` sekmesi artik sadece AI job listesi degil,
  kritik nokta, briefing ve kaynak secimi girisini de tasiyor.
- Sistem artik briefing oncesi `kritik nokta` adimini ayri veri modeli ve onay
  mantigi ile yonetiyor.
- Sistem artik arastirma kaynak secimini ayri veri modeli ile kaydediyor.
- Sistem artik secilen kaynaklara gore gercek arastirma kosusu baslatabilecek
  backend endpointine sahip.
- Workspace olan davalarda arastirma kosusu sonucu kaynak bazli not dosyalari
  ve `arastirma-raporu.md` otomatik yazilabiliyor.
- Dev server su anda calisiyor:
  - uygulama: `http://localhost:5173`
  - API: `http://localhost:3001`
- Sonraki mantikli adim:
  - `Usul Pre-Check` ve `Usul Raporu` fazini yeni arastirma sekmesine baglamak
  - arastirma raporundan `dilekce v1 -> savunma simulasyonu -> v2 -> UDF`
    hattina gecmek

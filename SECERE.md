# SECERE

## Amac

Bu belge, proje boyunca uretildigi halde farkli dosyalara dagilmis bilgi ve karar
birikimini tek bir yerde toplar.

Bu dokumanin gorevi:

- bugune kadar ne yapildigini ozetlemek
- sistemin bugun gercekte hangi seviyede oldugunu ayirmak
- eksik halkalari gostermek
- bundan sonra hangi sira ile ilerlenmesi gerektigini netlestirmek

Bu belge bir fikir notu degil.
Bu belge, proje seceresidir.

## Incelenen Ana Kaynaklar

Bu ozet su ana kaynaklar okunarak cikarildi:

- `SONYAPILANLAR.md`
- `MERGE.md`
- `MERGE-BACKLOG.md`
- `HUKUKTAKIPDIAGRAM.md`
- `isbu-ofis/hukuk-takip` altindaki ana backend/frontend dosyalari
- `udf-cli` ve `vektordb_v2_pilot` altindaki yardimci araclar

## Kisa Ozet

Proje artik sadece klasik bir hukuk ofisi paneli degil.
Temel dava operasyonlarini yurutebilen, belge yukleyebilen, AI workspace
olusturabilen, kritik nokta sentezi yapabilen ve secilen kaynaklarla gercek
arastirma kosusu baslatabilen bir sisteme donusmus durumda.

Bugun itibariyla sistemin en guclu tarafi:

- dava operasyonu
- belge/workspace baglantisi
- kritik nokta sentezi
- briefing
- arastirma kaynak secimi
- gercek Yargi ve Mevzuat kosusu
- OCR destekli belge okuma

Bugun itibariyla sistemin en buyuk eksigi:

- usul pre-check ve usul raporu fazinin siteye tam baglanmamis olmasi
- arastirma kalite kontrolunun formal hale gelmemis olmasi
- dilekce v1 -> savunma simulasyonu -> v2 -> UDF hattinin site uzerinden tam
  orkestre edilmemis olmasi
- UYAP fazinin bilerek sona birakilmis olmasi

## Projenin Soy Agaci

### 1. Temel urun

En altta klasik `hukuk-takip` urunu var.
Bu katman su temel ofis ihtiyaclarini karsiliyor:

- muvekkil kaydi
- dava kaydi
- durusma
- gorev
- masraf
- tahsilat
- not
- bildirim

Bu katman, sistemin operasyon omurgasi.

### 2. AI workspace katmani

Bu klasik panelin ustune ikinci katman olarak `AI Workspace` eklenmis.

Bu katman:

- dava icin otomasyon kodu uretir
- dava klasorunu acar
- briefing/usul/arastirma/savunma/revizyon/dilekce yol bilgisini tutar
- sablonlardan markdown dosya uretir
- dava klasoru checklist yapisini kurar

Bu sayede sistem artik yalnizca veritabani kaydi degil,
ayni zamanda dosya-merkezli bir hukuk calisma alani da olusturuyor.

### 3. Belge zekasi katmani

Ucuncu katman belge tarafidir.

Bu katmanda:

- toplu belge yukleme
- UYAP uyumlu uzanti destegi
- belgeyi workspace'e yazma
- `evrak-listesi.md` ile senkronizasyon
- yari otomatik tasnif
- eksik evrak takibi
- PDF/UDF/metin dosyasi okuma
- PNG/JPG/TIFF OCR

aktif hale getirildi.

Bu katman cok kritik cunku ustteki tum AI akislari belge okuma olmadan
yuzeysel kalirdi.

### 4. Intake ve kritik nokta katmani

Dorduncu katman, davayi hukuki olarak anlamlandirma katmani.

Burada sistem:

- dava acilis notunu
- avukat yonlendirmesini
- muvekkil gorusme notunu
- yuklenen belgelerden cikan metni
- dava notlarini

bir arada degerlendirip su alanlari dolduruyor:

- kritik nokta ozet metni
- ana hukuki eksen
- ikincil riskler
- ispat riskleri
- karsi tarafin olasi ilk savunma cizgisi
- eksik bilgi
- eksik belge
- arastirma sorusu
- anahtar kelimeler

Bu artik sistemin ilk ciddi AI karar noktasi.

### 5. Briefing katmani

Kritik nokta onaylandiktan sonra briefing katmani calisiyor.

Bu katman:

- briefing taslagi uretir
- markdown artifact yazar
- onay sureci tutar

Yani dava, ham bilgi asamasindan avukat tarafindan yonetilen yapilandirilmis
strateji asamasina geciyor.

### 6. AI job ve arastirma orkestrasyonu

Bir sonraki katman `ai_jobs` omurgasi.

Bu katman:

- job
- step
- artifact
- source
- review

mantigi ile sureci izlenebilir hale getiriyor.

Arastirma tarafi burada baglanmis durumda.
Avukat site uzerinden kaynak secip gercek arastirma kosusu baslatabiliyor.

### 7. Dis araclar katmani

En ustte dis entegrasyon ve yardimci arac katmani var:

- Yargi MCP / CLI
- Mevzuat MCP / CLI
- NotebookLM
- Vector DB
- UDF CLI

Bu katmanlarin hepsi ayni olgunlukta degil.
Bugun en net dogrulanmis olanlar:

- Yargi
- Mevzuat
- UDF tarafi
- belge OCR

NotebookLM ve Vector DB hattinda altyapi var, ama urun ici tam olgunluk ve
gozle gorunur kalite kapilari henuz tamamlanmis degil.

## Bugune Kadar Yapilanlar

### 1. Altyapi ve repo saglamlastirma

Yapilanlar:

- build zinciri toparlandi
- workspace/worktree bazli yol sorunlari duzeltildi
- migration ve `.env` akisi duzeltildi
- auth ve sahiplik kontrolleri sertlestirildi
- Docker uzerinden Postgres ile lokal test ortami calisir hale getirildi

Sonuc:

- proje derlenebilir
- migration uygulanabilir
- login calisir
- demo kullanicilar ile test yapilabilir

### 2. Sablon sistemi ve workspace

Yapilanlar:

- `sablonlar/` altinda merkezi markdown sablonlari olusturuldu
- dava workspace olusturma akisi bu sablonlara baglandi
- briefing/usul/arastirma/savunma/revizyon/evrak dosyalari artik sablon
  tabanli uretiliyor

Sonuc:

- yeni bir dava acildiginda sistem sadece DB kaydi degil,
  bir dosya ekosistemi de uretebiliyor

### 3. Belge modulu

Yapilanlar:

- tekli yerine coklu upload
- buyuk dosya destekli temp disk storage
- `pdf`, `udf`, `zip`, `tif`, `tiff`, `jpg`, `jpeg`, `png`, `webp`, `bmp`,
  `heic`, `heif`, `doc`, `docx`, `xls`, `xlsx` destegi
- download ve delete
- checklist senkronu
- tasnif ve eksik evrak otomasyonu

Sonuc:

- muvekkil belgeleri gercek kullanima uygun hale geldi
- UYAP'tan inen dosyalar sisteme atilabilir hale geldi

### 4. Belge okuma ve OCR

Yapilanlar:

- PDF metin cikarma
- UDF icinden `content.xml` okuma
- DOCX/ZIP/metin tabanli dosyalardan metin okuma
- `Anthropic` tabanli gorsel OCR
- TIFF/TIF donusturme
- cok sayfali TIFF icin birlestirme

Sonuc:

- artik sadece dosya adi degil,
  belgenin icindeki metin de intake sentezine giriyor

### 5. AI intake ve kritik nokta sentezi

Yapilanlar:

- `case_intake_profiles` modeli eklendi
- `generate-critical-point` endpointi eklendi
- manuel duzenleme + onay akisi kuruldu
- `Anthropic` direct API ile AI uretim devreye alindi
- fallback sentez mekanizmasi korundu

Sonuc:

- avukat yonlendirmesi + muvekkil notu + belge icerigi -> hukuki kritik nokta
  zinciri calisiyor

### 6. Briefing

Yapilanlar:

- `case_briefings` modeli eklendi
- briefing generate / get / approve akisi eklendi
- workspace artifact senkronu eklendi

Sonuc:

- kritik nokta onayi sonrasi briefing dosyasi uretiliyor

### 7. AI job omurgasi

Yapilanlar:

- `ai_jobs`
- `ai_job_steps`
- `ai_job_artifacts`
- `ai_job_reviews`
- `ai_job_sources`

eklendi.

Sonuc:

- surec artik izlenebilir
- sadece "bir sey oldu" degil,
  hangi adimda ne cikti uretildigi kayda geciyor

### 8. Arastirma secimi ve gercek kosu

Yapilanlar:

- `case_research_profiles` modeli eklendi
- kaynak secim UI'si eklendi
- gercek arastirma kosusu endpointi eklendi
- Yargi ve Mevzuat CLI/MCP cagri katmani calistirildi
- NotebookLM ve Vector DB icin profil alanlari ve runner omurgasi eklendi
- arastirma artifact dosyalari workspace'e yazildi

Sonuc:

- site uzerinden secilen kaynaklara gore gercek arastirma kosusu
  baslatilabiliyor
- Yargi ve Mevzuat hattinin calistigi canli olarak dogrulandi

### 9. UI olgunlastirma

Yapilanlar:

- dashboard belge ozetleri
- dava detay `Belgeler` sekmesi
- dava detay `Arastirma` sekmesi
- kritik nokta, briefing ve kaynak secim kartlari
- bozuk Turkce karakterlerin onemli kisimlari temizlendi

Sonuc:

- sistem sadece API seviyesinde degil,
  tarayici uzerinden de test edilebilir bir urun formuna geldi

### 10. UDF hattina hazirlik

Yapilanlar:

- `udf-cli` tarafinda parser/serializer ve roundtrip duzeltmeleri yapildi
- gercek fixture ve roundtrip dogrulamalari yapildi

Sonuc:

- son asamadaki `markdown -> UDF` donusumu icin temel arac hazir

## Bugun Gercekte Calisan Akislar

Asagidaki akislari bugun "gercekten calisiyor" olarak kabul edebiliriz:

1. Muvekkil ekleme
2. Dava acma
3. Login
4. AI workspace olusturma
5. Belge yukleme / indirme / silme
6. Checklist senkronu
7. Belge icerigi okuma
8. Gorsel OCR
9. Kritik nokta taslagi uretme
10. Kritik nokta manuel revizyon ve onay
11. Briefing uretme
12. Arastirma kaynak plani kaydetme
13. Yargi ve Mevzuat uzerinden gercek arastirma kosusu
14. Arastirma artifactlerini workspace'e yazma

## Bugun Kismen Calisan veya Iskelet Halindeki Alanlar

### 1. NotebookLM

Durum:

- profil alanlari ve secim UI'si var
- arastirma runner omurgasi var
- urun ici kalite, hata gorunurlugu ve tam canli dogrulama seviyesi
  Yargi/Mevzuat kadar net degil

### 2. Vector DB

Durum:

- ayri pilot klasoru ve yardimci scriptler var
- arastirma profilinde alanlar mevcut
- server tarafinda runner omurgasi mevcut
- urun ici goze gorunen kalite/guven seviyesine tam ulasmis degil

### 3. AI job review sistemi

Durum:

- veri modeli var
- fakat gercek kalite kapilari ve review ekranlari henuz sinirli

### 4. Usul fazi

Durum:

- kavramsal tasarim net
- sablonu var
- path alanlari var
- ama site uzerinde `Usul Pre-Check -> Usul Raporu -> QC` zinciri tam
  orkestre degil

### 5. Dilekce hatti

Durum:

- hedef akis dokumanlarda net
- UDF araci hazir
- fakat `arastirma raporu -> dilekce v1 -> savunma simulasyonu -> v2 -> UDF`
  zinciri site icinde tam urunlesmis degil

### 6. UYAP

Durum:

- belge format ve UDF tarafinda on hazirlik var
- ama resmi/guvenli entegrasyon fazi bilincli olarak sona birakilmis

## Bugun En Kritik Eksikler

### 1. Usul paketinin urunlesmesi

Bu proje dogru yere gelmek istiyorsa,
siradaki en kritik halka usul fazidir.

Eksik olanlar:

- `procedure_precheck` artifacti
- usul veri paketinin formal yapisi
- usul kalite kontrolu
- usul review ekranlari

### 2. Arastirma kalite kontrolu

Bugun arastirma kosusu var.
Ama arastirma sonucunun "hukuken guvenilir mi, catisiyor mu, hangi arguman
alinacak" denetimi henuz formal degil.

Eksik olanlar:

- source conflict detector
- arastirma review alanlari
- al / alma isaretlemesi
- kaynak guven skoru

### 3. Dilekce yazim orkestrasyonu

Bugun sistem briefing ve arastirma uretmeye yaklasti.
Ama asil urun degeri dilekce cikisinda olacak.

Eksik olanlar:

- `pleading_v1`
- `defense_simulation`
- `pleading_v2`
- `final_approval`
- `udf_export`

### 4. Izlenebilirlik

Belgeden argumana giden zincirin daha net gorunmesi lazim.

Ihtiyac:

- hangi belge hangi kritik bulguya etki etti
- hangi bulgu hangi arastirma sorusuna donustu
- hangi kaynak hangi argumani besledi
- hangi arguman dilekceye alindi / alinmadi

## Bundan Sonra Hangi Adimlar Yapilmali

Burada oncelik sirasi cok onemli.
Gosterisli ama daginik bir agent sistemi yerine,
hukuken denetlenebilir bir zincir kurulmasi gerekiyor.

### Asama 1: Usul fazini bitir

Yapilacaklar:

- `POST /procedure/precheck`
- `POST /procedure/generate`
- `POST /procedure/review`
- `Usul` kartini dava detayina ekle
- usul artifactlerini workspace ve DB'ye yaz
- usul blokluyorsa arastirmayi baslatma

Neden once bu:

- yanlis dava turu
- yanlis mahkeme
- dava sarti eksigi
- sure riski

gibi konular arastirma ve dilekceye gecmeden once temizlenmeli.

### Asama 2: Arastirma kalite kontrolu

Yapilacaklar:

- `research_review` adimini gercek hale getir
- kaynaklar arasi celiski tespiti ekle
- "dilekceye tasinacak argumanlar" secimini formal hale getir
- avukat icin kisa bir `Arastirma QC` paneli ekle

Neden:

- arastirma kosmak tek basina degerli degil
- onemli olan guvenli sentez

### Asama 3: Dilekce v1

Yapilacaklar:

- briefing + usul + arastirma raporundan ilk taslak ureten job
- artifact preview
- manuel revizyon alani

Neden:

- sistem artik gercek "uretken hukuk asistani" davranisina burada gececek

### Asama 4: Savunma simulasyonu

Yapilacaklar:

- karsi tarafin olasi cevaplarini cikar
- usul itirazlarini cikar
- delil saldiri alanlarini cikar
- `must-answer-list` ve `weak-points` artifactleri uret

Neden:

- v2'nin degeri buradan gelir

### Asama 5: Dilekce v2 ve final onay

Yapilacaklar:

- v1 + savunma simulasyonu -> v2
- final review ekrani
- avukat onayi olmadan UDF'ye gecmeme

### Asama 6: UDF donusumu

Yapilacaklar:

- son markdown'u `udf-cli` ile UDF'ye cevir
- dava ekraninda ciktisini goster
- indirilebilir artifact yap
- gerekirse roundtrip preview ekle

### Asama 7: UYAP fazi

Bu faz bilerek en sona kalmali.

Ilk hedef:

- UYAP'a hazir paket
- evrak toplama
- UDF/PDF ek cikti
- yarı otomatik yardimci masaustu katmani

Direkt tam entegrasyon hedefiyle baslamak dogru degil.

## Onerilen Yol Haritasi

Kisa ve net en dogru sira su:

1. Usul Pre-Check
2. Usul Raporu
3. Usul QC
4. Arastirma QC
5. Dilekce v1
6. Savunma Simulasyonu
7. Dilekce v2
8. Final Avukat Onayi
9. UDF Export
10. UYAP Hazir Paket
11. En son UYAP entegrasyon fazi

## Son Hukum

Bu proje artik fikir asamasini gecmis durumda.
Elimizde:

- operasyon paneli
- belge modulu
- workspace sistemi
- kritik nokta sentezi
- briefing
- arastirma secimi
- gercek arastirma kosusu
- OCR
- UDF araci

olan ciddi bir temel var.

Bu temeli urune donusturecek son buyuk halkalar:

- usul
- arastirma kalite kontrolu
- dilekce hattinin tam orkestrasyonu
- final UDF ve UYAP fazi

Kisacasi:

`Temel bina kuruldu.`
`Simdi katlar degil, baglanti kolonlari tamamlanmali.`

# Potansiyel Gelistirmeler

Bu dosya, son iki arastirma hatti birlikte dusunulerek yeniden yazildi:

- Legal AI urunlerinden cikan pratik urun fikirleri
- Zack Shapiro'nun `input layer`, `reusable skill`, `embarrass check` ve
  `abdication trap` yaklasimi

Bu versiyonda bilincli olarak cikarilan basliklar:

- eski `6`
- eski `9`
- eski `14`

Yani bu dokuman artik:

- hakim skorculugu gibi erken ve riskli alanlara odaklanmaz
- client self-service / portal gibi ikinci urun hissi veren daginik alanlara sapmaz
- gereksiz kesinlik hissi veren hakim tahmini gibi kisimlari tasimaz

Asil hedef su:

Mevcut `Director Agent + paralel hukuk ajanlari + Vector DB + NotebookLM/Gemini`
sistemini, mevcut `HukukTakip` is takibi uygulamasi ile tek urunde birlestirmek.

Bu sayede:

- hem telefondan hem web'den buro yonetimi yapilacak
- ayni dava kaydi icinde arastirma, usul, belge yazimi ve takip bir arada yurutulecek
- AI sistemi ayrik bir demo degil, dava operasyonunun cekirdek parcasi olacak

## 1. Mevcut Durumdan Cikan Ana Tespit

### A. Hukuk AI motoru zaten guclu

Su anki hukuk otomasyon tarafinda zaten bunlar var:

- `Director Agent`
- `usul`, `mevzuat`, `ictihat`, `vector`, `NotebookLM`, `belge yazari` ajanlari
- paralel calisma mantigi
- dava klasoru bazli hafiza
- kaynak temelli arastirma ve sentez

Bu tarafin en guclu yani:

- gercek hukuki is akisini katmanli kurmasi
- tek prompt yerine ajanlara ayrilmis sorumluluk modeli kullanmasi

Bu tarafin en zayif yani:

- giris verisinin daginik olmasi
- avukatin judgment'ini reusable hale getiren skill katmaninin olmamasi
- ciktilarin guven ve kalite kontrolunun sistematik olmamasi

### B. HukukTakip uygulamasi zaten dogru urun kabugu

`http://localhost:5173/dashboard` uzerinden ayakta olan uygulama tarafinda su guclu
temel zaten mevcut:

- `dashboard`
- `clients`
- `cases`
- `hearings`
- `tasks`
- `calendar`
- `notifications`
- `notes`
- `expenses / collections`

Kaynak koddan gorulen durum:

- frontend: `Vite + React + React Query + React Router`
- backend: `Express + Drizzle + PostgreSQL`
- veri modeli: `cases`, `tasks`, `hearings`, `documents`, `notes`, `notifications`

Bu cok onemli bir avantaj:

Legal AI sistemini sifirdan yeni bir arayuze tasimak gerekmiyor.
Dogru hamle, `HukukTakip` icine bir `AI dava operasyon` katmani eklemek.

## 2. Yeni Cekirdek Vizyon

Tek cumlelik hedef:

`HukukTakip`, davalari ve gorevleri tutan bir ofis yazilimi olmaktan cikacak;
her dava kaydinin icinde AI ile calisan bir `dava uretim ve karar destek istasyonu`
haline gelecek.

Bu yeni modelde:

- `case` kaydi ana merkez olacak
- AI ajanlari o davaya bagli alt is akislari olarak calisacak
- AI ciktilari gorev, not, belge, bildirim ve timeline uretmeye baglanacak
- avukatin judgment'i `skill library` icinde birikerek sistemin asil moati olacak

## 3. Cekirdek Gelistirmeler

Asagidaki basliklar artik en oncelikli ve gercekten uygulanabilir gelistirmeler.

### 1. Advanced Briefing / Input Layer

Zack yazisindan gelen en kritik fikir bu.

Sorun:

- kisa dava ozeti ile baslanan is akisi AI'yi ortalama cevaba iter
- risk toleransi, karsi taraf karakteri, dealbreaker, ispat zorlugu, utandirici
  ihtimaller gibi gercek hukuki judgment girdiye girmeyince cikti zayif kalir

Ne yapilmali:

- yeni dava acarken klasik formun yanina `Advanced Briefing` katmani eklenmeli
- Director Agent, yeni dava acildiginda asagidaki alanlari toplamalidir:
  - dava teorisi
  - kritik hukuki risk
  - karsi tarafin beklenen savunmalari
  - muevkkilin risk toleransi
  - sulh / sert catismaci tutum tercihi
  - ton tercihi
  - olmazsa olmaz talepler
  - eksik bilgi ve belirsizlikler
  - `bu haliyle muevkkile gitse beni utandirir mi` kontrolu

Bizim sisteme katkisi:

- Director Agent daha dogru alt ajan secimi yapar
- ayni dava icin usul ve arastirma hattinin odagi netlesir
- dilekce, ihtarname ve notlar generic degil baglamsal olur

HukukTakip entegrasyonu:

- `cases/new` ve `cases/:id/edit` icine yeni bir `AI Briefing` bolumu eklenmeli
- case detail ekraninda briefing ozeti gorunmeli

### 2. Skill Library

Bu artik opsiyonel degil, cekirdek katman.

Sorun:

- bugun kurallar `CLAUDE.md`, promptlar ve daginik notlar icinde
- bunlar tekrar kullanilabilir ve ajan bazli skill dosyalarina donusmemis durumda

Ne yapilmali:

- her ajan icin `Skill.md` mantigi getirilmeli
- ornek skill siniflari:
  - `director-briefing-skill`
  - `usul-checklist-skill`
  - `dilekce-anatomisi-skill`
  - `redline-skill`
  - `eksik-evrak-analizi-skill`
  - `savunma-simulator-skill`
  - `embarrass-check-skill`

- skilller sadece sabit talimat degil, su alanlari icermeli:
  - ne zaman kullanilir
  - hangi girdileri zorunlu ister
  - hangi cikti standardini bekler
  - hangi riskleri flag eder
  - hangi durumda insana doner

Bizim sisteme katkisi:

- senin hukukcu judgment'in kopyalanabilir degil, birikimli IP'ye donusur
- ayni kalite tekrar tekrar üretilebilir
- ajanlar arasi kalite farki azalir

HukukTakip entegrasyonu:

- sol menude yeni bir `Skill Library` sayfasi olmali
- skill listeleme, gorme, duzenleme, versiyonlama ekranlari eklenmeli
- ileride skill test etme ve `plz fix` mantigi bu ekrana baglanabilir

### 3. Embarrass Check + Confidence Score + Human Review

Bu uc katman tek ozellik gibi dusunulmeli.

Sorun:

- AI guzel yazsa bile yanlis, eksik veya avukati zor durumda birakacak metin
  uretebilir
- hukukta esas risk tam burada

Ne yapilmali:

- her kritik AI ciktilarinin sonunda zorunlu kalite kapisi olmali
- kontrol sorulari:
  - bu metinde eksik somut vaka var mi
  - bu metinde dayanak zayif mi
  - bu haliyle muevkkile giderse utandirir mi
  - citation veya norm kontrolu eksik mi
  - tone davaya uygun mu

- ciktiya 3 alan eklenmeli:
  - `confidence_score`
  - `review_required`
  - `embarrass_flags`

Bizim sisteme katkisi:

- tam otomasyon yerine kontrollu otomasyon kurulur
- avukat neyi hemen kullanabilecegini anlar
- dusuk guvenli ciktilar otomatik olarak goreve donusturulebilir

HukukTakip entegrasyonu:

- case detail sayfasinda yeni `AI Ciktilari` bolumunde badge olarak gosterilmeli
- dusuk guvenli cikti varsa otomatik `task` olusturulmali
- kritik flag varsa `notification` uretilmeli

### 4. Belge Yukleme, Tasnif ve Eksik Evrak Analizi

Bu hala en kritik operasyonel eksik.

Sorun:

- dosyaya gelen PDF, tarama, ekran goruntusu, mail zinciri ham halde kaliyor
- AI hattina yapilandirilmamis girdi gidince kalite dusuyor

Ne yapilmali:

- `documents` tablosu ve dava baglantisi zaten var; bunun ustune AI tasnif katmani eklenmeli
- belge yuklenince su adimlar olmali:
  - belge turu tahmini
  - ilgili dava konusu ile eslestirme
  - kisa ozet
  - hangi vakia veya ispat unsuruna hizmet ettigi
  - eksik belge analizi
  - NotebookLM'e gidip gitmeyecegi karari

Bizim sisteme katkisi:

- girdi kalitesi artar
- dava hafizasi daha temiz kurulur
- usul ve belge yazari ajanlari eksik belgeyi erken fark eder

HukukTakip entegrasyonu:

- `cases/:id` sayfasina yeni `Belgeler / AI Tasnif` sekmesi eklenmeli
- belge yuklendikten sonra AI etiketleri ve eksik belge uyarilari gosterilmeli

### 5. Playbook Tabanli Drafting + Redline

Sorun:

- belge yazari ajaninin kuvvetli olmasi yetmez; ofis standardina tam uyum lazim

Ne yapilmali:

- `dilekce-yazim-kurallari.md` ve benzeri kurallar skill'e cevrilmeli
- AI sadece taslak yazmamalidir; ayni zamanda:
  - ofis standardina aykiri yerleri isaretlemeli
  - alternatif paragraf onermeli
  - eksik iddia / eksik delil noktalarini flag etmeli

Bizim sisteme katkisi:

- belge kalitesi kurumsallasir
- revizyon sureci hizlanir
- AI'nin neden degisiklik onerdigi daha denetlenebilir olur

HukukTakip entegrasyonu:

- case detail sayfasina `Taslaklar / Redline` alanı eklenmeli
- `v1`, `v2`, `final` belge akisi bu ekranda takip edilmeli

### 6. Arastirma Orkestrasyonu ve Sonuc Sentezi

Sorun:

- arastirma ajanlari var ama ciktilarin urun icindeki karsiligi henuz tam degil
- arastirma sonucu ile gorev, not, belge, sonraki adim baglanti kurmuyor

Ne yapilmali:

- Director Agent ciktisi sadece rapor degil, yapilandirilmis sonuc uretmeli:
  - `findings`
  - `risks`
  - `missing_inputs`
  - `recommended_tasks`
  - `drafting_strategy`

Bizim sisteme katkisi:

- arastirma sonucu operasyona baglanir
- rapor okuyup elle gorev cikarma ihtiyaci azalir

HukukTakip entegrasyonu:

- arastirma sonucu case detail icinde kartlar halinde gosterilmeli
- onerilen aksiyonlar tek tusla `task`'a donusturulmeli

### 7. Kalici AI State ve Ajan Gorev Kayitlari

Sorun:

- AI is akisi klasorlerde var ama is takibi uygulamasinin veri modeline bagli degil

Ne yapilmali:

- mevcut `tasks`, `notes`, `notifications`, `documents` yapisina ek olarak
  AI odakli tablolar dusunulmeli:
  - `agent_runs`
  - `agent_outputs`
  - `skills`
  - `skill_versions`
  - `case_briefings`
  - `document_analyses`

Bizim sisteme katkisi:

- hangi ajan ne zaman ne uretti kayda girer
- tekrar calistirma, audit, hata analizi kolaylasir
- 7/24 otonom dongu teknik olarak saglamlasir

HukukTakip entegrasyonu:

- dashboard icinde `aktif AI calismalari` karti gosterilebilir
- case detail icinde `AI zaman cizelgesi` eklenebilir

## 4. Uygulama Icinde Birlesme Modeli

Bu iki sistemi birlestirmenin dogru yolu:

`HukukTakip` ana uygulama olacak.
Legal AI orkestrator bunun icinde calisan uzman motor olacak.

### Dashboard seviyesinde

Dashboard'a su yeni bloklar eklenmeli:

- `Aktif AI Calismalari`
- `Inceleme Bekleyen AI Ciktilari`
- `Eksik Evrak Uyarilari`
- `Bugun AI Tarafindan Uretilen Gorevler`

### Case detail seviyesinde

Bugunku `hearings / tasks / expenses / collections / notes` sekmelerine ek olarak:

- `AI Workspace`
- `Belgeler ve Tasnif`
- `Arastirma`
- `Taslaklar ve Redline`
- `Skill Uygulama Gecmisi`

Burasi sistemin kalbi olmali.

Bir dava ekraninda avukat sunlari ayni yerde gorebilmeli:

- briefing
- eksik belgeler
- arastirma bulgulari
- usul checklist
- uretilen dilekce taslaklari
- embarrass check sonucu
- onay bekleyen ciktılar

### Gorev sistemi seviyesinde

AI ciktilari gorev sistemine baglanmali.

Ornek:

- `eksik veraset ilami` -> gorev
- `ehliyetsizlik delili zayif` -> gorev
- `dilekce confidence dusuk` -> review gorevi
- `harc hesaplamasi kontrol edilmeli` -> gorev

Boylece AI ayrik tavsiye ureten bir kutu degil, ofisin gunluk operasyon motoru olur.

## 5. Artik Gereksiz Gormedigimiz Ama Simdilik Ikinci Faz Olanlar

Asagidaki alanlar halen degerli; ama ilk sprintin merkezi olmamali:

### 8. Billing / Time Tracking

Katkisi:

- token, zaman ve is maliyeti takibi saglar
- ofis ici verim ve gelecekte faturalama icin anlamlidir

Neden ikinci faz:

- once AI is akislarinin veri modeli oturmali

### 9. API / Streaming / Real-Time Ajan Durumu

Katkisi:

- ajanlarin calisma asamasini canli gostermek kullanici deneyimini guclendirir

Neden ikinci faz:

- once temel islevler stabil olmali
- ilk asamada polling ile bile yeterli ilerleme saglanabilir

### 10. Tam urunlestirme ve PWA sertlestirme

Katkisi:

- telefon ve web deneyimini tek urunde guclendirir

Neden ikinci faz:

- mevcut uygulama zaten mobil kullanima uygun yone gidiyor
- once AI entegrasyon omurgasi kurulmalı

## 6. Acikca Ertelenen veya Bilincli Olarak Cikarilan Yonler

Bu dokuman artik asagidaki hatlara odaklanmaz:

- hakim / mahkeme skorculugu
- self-service muevkkil portalini oncelemek
- `bu hakim yuzde 87 kabul eder` gibi riskli kesinlik sinyalleri

Sebep:

- bunlar bugunku sistemin esas darboğazi degil
- esas kazanc `input quality + skill memory + quality gate + case workflow integration`
  dörtlusunden gelecek

## 7. Onerilen Ilk Yol Haritasi

En mantikli sira su:

1. `Advanced Briefing / Input Layer`
2. `Skill Library`
3. `Embarrass Check + Confidence Score + Human Review`
4. `Belge Tasnif + Eksik Evrak Analizi`
5. `Case detail icinde AI Workspace`
6. `Playbook tabanli drafting + redline`
7. `AI outputlarini task / note / notification sistemine baglama`
8. `Kalici AI state tablolari`

## 8. Son Karar

Bugun icin en dogru urun vizyonu su:

Bu proje artik sadece `hukuki arastirma otomasyonu` degil,
ve sadece `ofis is takibi uygulamasi` da degil.

Dogru hedef:

`AI-native hukuk ofisi paneli`

Tek uygulamada:

- dava ac
- muevkkil ve dosya yonet
- belge yukle
- AI ile briefing yap
- arastirma calistir
- dilekce taslagi uret
- redline ve quality gate uygula
- gorevleri ve durusmalari takip et
- telefondan ve web'den ayni akisi yonet

Bir sonraki adim:

Buradan secilen maddeler `GELISTIRME.md` icine tasinmali ve teknik olarak
uygulanacak ilk paket belirlenmeli.

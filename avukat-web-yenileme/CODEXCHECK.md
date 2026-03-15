# CODEXCHECK - Vega Hukuk Web Yol Haritasi

## 1) Proje Inceleme Ozeti (Mevcut Durum)
- Altyapi: Vite + React + TypeScript + Tailwind (SPA mimarisi).
- Sayfa yapisi tek sayfa: ana bolumler `src/pages/Index.tsx` icinde ard arda render ediliyor.
- Blog alani su an statik kartlardan ibaret (`src/components/ArticlesSection.tsx`), gercek yazi sayfasi yok.
- Formlar su an sadece istemci tarafinda "gonderildi" geri bildirimi veriyor; backend/mail entegrasyonu yok.
- Lovable izi kalan noktalar:
  - `lovable-tagger` bagimliligi (`package.json`)
  - `componentTagger` import/plugin (`vite.config.ts`)
  - README iceriginde Lovable baglantilari
  - `index.html` OG image URL'sinde `lovable.app` uzantili kaynak
- Teknik borc/risk:
  - Iceriklerde karakter kodlama bozulmasi goruluyor (mojibake) -> UTF-8 standardizasyonu gerekiyor.
  - Test kapsamasi cok dusuk (yalniz ornek test dosyasi).
  - Blog SEO altyapisi (article schema, sitemap, rss, canonical/slug akisi) eksik.

## 2) Hedef
Lovable bagimsiz, kendi domaininde yayinlanan, duzenli haftalik blog uretebilen, kurumsal ve guven veren bir hukuk sitesi.

## 2.1) Faz 0 Karari (09 Mart 2026)
- Secilen model: Secenek B (Headless CMS)
- Alt secim: Yonetilen CMS (panelden kolay icerik girisi)
- Gerekce: Haftalik blog yayinini teknik olmayan operasyon akisina uygun ve hizli surdurmek.

## 3) Onerilen Yol (Fazli Plan)

### Faz 0 - Karar ve Kapsam (1 gun)
- Blog yazi yonetim modeli secilecek:
  - Secenek A (hizli ve ucuz): Markdown/MDX dosyalari ile Git tabanli icerik yonetimi.
  - Secenek B (editor dostu): Headless CMS (panel uzerinden yazi girisi).
- Karar kriterleri: teknik bagimsizlik, haftalik operasyon kolayligi, SEO gereksinimi, maliyet.

Cikis kriteri:
- Tek bir icerik modeli secilmis olacak ve dokumante edilecek.

Durum:
- Tamamlandi (Secenek B + Yonetilen CMS)

### Faz 1 - Lovable'dan Ayrisma ve Temizlik (1-2 gun)
- `lovable-tagger` bagimliligi kaldirilacak.
- `vite.config.ts` icinden `componentTagger` kullanimi silinecek.
- README proje-ozel hale getirilecek (gelistirme, build, deploy adimlari).
- `index.html` icindeki Lovable kaynakli OG image URL'leri kendi asset/domain URL'sine cekilecek.
- Metin dosyalarinda UTF-8 normalizasyonu yapilacak.

Cikis kriteri:
- Kod tabaninda Lovable referansi kalmayacak (kilit dosyalarda 0 referans).

Durum:
- Devam ediyor.
- Tamamlananlar:
  - `package.json` icinden `lovable-tagger` kaldirildi.
  - `vite.config.ts` icinden `componentTagger` kaldirildi.
  - `README.md` bagimsiz proje dokumani olarak yenilendi.
  - `index.html` OG image kaynaklari `vegahukuk.com` alanina cekildi.
  - Iletisim bolumundeki gorunur karakter bozulmalari temizlendi.
  - Header, footer ve sabit CTA alanlarindaki gorunur karakter bozulmalari temizlendi.
  - `index.html` icindeki temel SEO metinleri normalize edildi.
- Bekleyen:
  - Tum metinlerde UTF-8 normalizasyonu ve lock dosyalarinin son temizligi.

### Faz 2 - Blog V1 (1 hafta)
- Router'a yeni sayfalar eklenecek:
  - `/blog` (liste)
  - `/blog/:slug` (detay)
- Icerik modeli kurulacak:
  - `slug`, `title`, `excerpt`, `publishedAt`, `author`, `category`, `seoTitle`, `seoDescription`, `coverImage`.
- Blog liste/detay UI bilesenleri eklenecek.
- Haftalik yayin akisi:
  - Yeni yazi olusturma sablonu
  - Yayina alma checklisti
- SEO V1:
  - Her yazi icin dinamik title/description/canonical
  - Article JSON-LD

Cikis kriteri:
- En az 3 gercek blog yazisi ile blog akisi uca uca calisiyor olacak.

Durum:
- Devam ediyor.
- Tamamlananlar:
  - `/blog` ve `/blog/:slug` route'lari eklendi.
  - 3 adet ornek yazi ile blog veri modeli kuruldu.
  - Ana sayfa yayinlar bolumu blog verisine baglandi.
  - SEO icin sayfa bazli title/description/canonical akisi eklendi.
  - Repository katmani `VITE_BLOG_API_URL` ile harici API/CMS kaynagina gecise hazirlandi; yerel veri fallback'i korundu.
  - Blog detay sayfasina `Article` JSON-LD eklendi.
  - Alan-yolu esleme destegi eklenerek farkli CMS JSON yapilarina kod degistirmeden uyarlanabilir hale getirildi.
- Sonraki adim:
  - Secilen yonetilen CMS endpoint/alan eslemesini netlestirip `.env` degerleriyle gercek API sozlesmesine baglamak.

### Faz 3 - Iletisim ve Donusum Altyapisi (2-3 gun)
- Iletisim formlarini gercek servise baglama (mail/API).
- Basarisiz istek, spam korumasi, rate limit ve loglama.
- Form gonderimlerinde KVKK metni/aydinlatma baglantilari.

Cikis kriteri:
- Formdan gelen talepler test e-postasina/API log'una dusuyor olacak.

Durum:
- Devam ediyor.
- Tamamlananlar:
  - Iletisim formu endpoint bazli gonderime hazirlandi (`VITE_CONTACT_FORM_ENDPOINT`).
  - KVKK onayi, honeypot alan ve istemci tarafli temel rate limit eklendi.
  - Basari/hata durumlari toast ile kullaniciya gosterilir hale getirildi.
  - KVKK, cerez ve hukuki uyari icin taslak route/sayfa iskeletleri eklendi.
  - `api/contact.ts` ile Vercel Function uzerinden Resend baglantisina hazir backend endpoint eklendi.
  - `vercel.json` ile SPA rewrite yapisi tanimlandi.
- Sonraki adim:
  - Vercel env'lerini tanimlayip Resend uzerinden test e-postasi akisini dogrulamak.

### Faz 4 - Domain ve Canliya Alma (1-2 gun)
- Domain satin alimi ve DNS yonetimi.
- Hosting secimi (bagimsiz deploy; Lovable publish disi).
- DNS kayitlari:
  - `@` (kok domain)
  - `www`
  - gerekiyorsa `mail` ve SPF/DKIM/DMARC
- SSL, HTTP->HTTPS, `www` yonlendirmesi.
- Production env degiskenleri ve build pipeline.

Cikis kriteri:
- Site kendi domaininde HTTPS ile acik ve otomatik deploy calisiyor.

### Faz 5 - Hukuk Sitesi Sertlestirme ve Kalite (3-5 gun)
- Yasal sayfalarin tamamlanmasi:
  - KVKK Aydinlatma Metni
  - Cerez Politikasi
  - Hukuki Uyari
- Teknik SEO:
  - sitemap.xml
  - robots.txt kontrol
  - Open Graph gorsellerinin kurumsal gorsellerle degisimi
- Performans ve kalite:
  - Lighthouse hedefleri (Performance/SEO >= 90)
  - temel testler (routing, blog render, form submit)

Cikis kriteri:
- Yasal + teknik SEO + temel kalite metrikleri yayin seviyesine gelmis olacak.

Durum:
- Devam ediyor.
- Tamamlananlar:
  - `robots.txt` sadelestirildi ve sitemap referansi eklendi.
  - `public/sitemap.xml` ile ana sayfa, blog, blog yazilari ve yasal sayfalar sitemap'e alindi.
  - Mevcut lint hatalari temizlendi.
- Sonraki adim:
  - Nihai yasal metinleri tamamlamak ve temel routing/render testlerini genisletmek.

## 4) Haftalik Blog Operasyon Modeli
- Pazartesi: Konu ve anahtar kelime plani.
- Sali-Carsamba: Taslak + hukuki dogruluk kontrolu.
- Persembe: SEO duzenleme (baslik, aciklama, ic link).
- Cuma: Yayina alma + sosyal dagitim.

Yayin checklist:
- Baslik ve slug uyumlu mu?
- Meta title/description eklendi mi?
- En az 1 ic link ve 1 CTA var mi?
- Hukuki sorumluluk siniri/notu dogru mu?
- Mobilde okunabilirlik kontrol edildi mi?

## 5) Baslangic Is Listesi (Ilk Sprint)
- [x] Lovable bagimliliklarini kaldir
- [x] Blog route + sayfa iskeletini kur
- [x] Icerik modeli ve 3 ornek yazi ekle
- [ ] Iletisim formunu gercek servise bagla
- [ ] Domain + DNS + SSL canliya al
- [ ] Yasal sayfalari doldur

## 6) Not
Bu plan, mevcut kod tabanini bozmadan asamali gecis icin tasarlandi. Ilk hedef: bagimsiz deploy + blog V1'i hizla acmak; ikinci hedef: operasyonu kolaylastirip kurumsal kaliteyi sabitlemek.

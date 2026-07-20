# THEMIS · Blog PR · v3 — KANONİK ÇIKTI FORMATI (Gmail draft + CMS)

Avukat "blog yaz" dediğinde üretilen Gmail PR taslağı **AYNEN bu yapıda** olur.
Kaynak: avukatın 2026-06-03 onayladığı örnek (Sahte İcra blogu). Bu format dışına çıkma.

## Zorunlu 5 bölüm (başlıklar `═` çizgisiyle)

**1) KISA ÖZET (30 saniye)** — Konu · Tier·Intent (T1-T6 · I1-I5, panel sözlüğü) · Kelime sayısı ·
Primary query · Pillar (/hizmetler/...) · Yayın önerisi · Ana argüman (2-3 cümle) ·
Kritik karar (DOĞRULANMIŞ künye).

**2) SELF-CHECK 12** — her madde `[x]`/`[~]`/`[ ]` (sahte `[x]` YASAK; doğrulanmamışı `[~]`):
1 frontmatter tam · 2 seoTitle ≤60 · 3 seoDescription 150-160 · 4 TL;DR 40-60 kelime ·
5 min 5 FAQ · 6 **min 3 Bedesten-ID'li Yargıtay atfı** · 7 min 2 mevzuat madde ·
8 her H2 doğal dil soru · 9 TBB yasak ifade temiz · 10 slug ASCII · 11 disclaimer+rozet ·
12 min 3 iç link (pillar+cluster+author). + `blog_validator.py` sonucu (PASS/FAIL).

**3) CMS PANEL FORMATI** — Decap CMS'e kopya-yapıştır:
`https://vegahukukistanbul.com/admin/#/collections/blog/new` ("Blog Yazıları" koleksiyonu).
Alan adları panel şemasıyla BİREBİR (kaynak: `/admin/cms-config.yml`, 2026-07-20):
- KİMLİK (Başlık·`title` ≤100, Slug·`slug`, Özet·`excerpt` 150-180, Kategori·`category`,
  Yazar·`author`=Vega Hukuk, Yazar Kimliği·`authorSlug`=aykut-yesilkaya)
- YAYIN (`publishedAt`, `updatedAt`, Gözden Geçiren·`reviewedBy`=aykut-yesilkaya [select, slug],
  `reviewedAt`, `nextReviewAt` +90)
- SEO (`seoTitle` ≤60, `seoDescription` 150-160, Canonical BOŞ — otomatik)
- TAKSONOMİ (Tier·`tier` T1-T6 [T3 varsayılan], Intent·`intent` I1-I5,
  Topic Anahtarları·`topics` [kebab key], Pillar·`pillars.p1/p2`)
- İÇERİK BİLEŞENLERİ → **[TL;DR·`tldr`]** (40-60 kelime) · **[SSS·`faqJson`]**
  (min 5, `[{"question","answer"}]` — site SSS bölümünü ve FAQPage schema'yı BU alandan üretir) ·
  **[CITATION]** → **[`relatedLaws`]** (code|madde|title) + **[`relatedCases`]**
  (daire|esas|karar|`date`|`summary`|`yargiMcpId`=Bedesten documentId — her biri DOĞRULANDI ✓)
- GÖRSEL (`coverImage`=kapak.png YÜKLE [WebP tercih, 1600x900], `coverAlt`;
  coverClass/ogImage BOŞ)
- İÇ LİNK (`internalLinkPriority` slug listesi, `internalLinkMatches` ifade→slug)
- DURUM (`status`=**draft** [panel varsayılanı published — düşürülür], `noindex`=false)

**4) İÇERİK (Markdown)** — panel `body` alanına yapıştırılacak gövde. 6 katman + min 5 H2 (doğal dil).
**Siteye özgü kırpma (canlı yazıdan doğrulandı 2026-07-20):** body'ye H1 KONMAZ (site `title`'dan üretir),
SSS bölümü KONMAZ (`faqJson`'dan render edilir), imza+disclaimer KONMAZ (`reviewedBy`/`reviewedAt`'ten
rozet üretilir). Gövde = TL;DR blockquote'undan "Sonuç" sonuna kadar. `blog.md` ise TAM dokuman kalır
(H1+SSS+imza dahil — validator/arşiv). Tek satırlık `[Buton](/blog)` CTA butonuna dönüşür;
iç link `[[slug|metin]]` söz dizimi geçerlidir.

**5) DOSYALAR** — Drive klasörü `G:\Drive'ım\Hukuk Bürosu\Blog\{YYYY-MM-DD}-{slug}\`
(blog.md + blog.cms.md + blog.mail.md + kapak.png). SONRAKİ ADIM listesi. Footer: THEMIS otomasyonu.

## Sabit kurallar
- Subject: `[Blog PR] {konu} — paste hazır` (THEMIS v3 etiketi eklenebilir).
- Alıcı: avukatın kendi gelen kutusu (taslak, auto-send yok).
- **0-Halüsinasyon:** [Yargı Kararları] yalnız Bedesten documentId ile DOĞRULANMIŞ künyeler.
  Doğrulanmayan künye blogda YOK; SELF-CHECK 6 dürüstçe `[~]` işaretlenir.
- `blog_validator.py` PASS olmadan draft oluşturulmaz (BLOCKING).

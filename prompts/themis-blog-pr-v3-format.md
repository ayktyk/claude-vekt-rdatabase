# THEMIS · Blog PR · v3 — KANONİK ÇIKTI FORMATI (Gmail draft + CMS)

Avukat "blog yaz" dediğinde üretilen Gmail PR taslağı **AYNEN bu yapıda** olur.
Kaynak: avukatın 2026-06-03 onayladığı örnek (Sahte İcra blogu). Bu format dışına çıkma.

## Zorunlu 5 bölüm (başlıklar `═` çizgisiyle)

**1) KISA ÖZET (30 saniye)** — Konu · Tier·Intent (T1-3 · I1-3) · Kelime sayısı ·
Primary query · Pillar (/hizmetler/...) · Yayın önerisi · Ana argüman (2-3 cümle) ·
Kritik karar (DOĞRULANMIŞ künye).

**2) SELF-CHECK 12** — her madde `[x]`/`[~]`/`[ ]` (sahte `[x]` YASAK; doğrulanmamışı `[~]`):
1 frontmatter tam · 2 seoTitle ≤60 · 3 seoDescription 150-160 · 4 TL;DR 40-60 kelime ·
5 min 5 FAQ · 6 **min 3 Bedesten-ID'li Yargıtay atfı** · 7 min 2 mevzuat madde ·
8 her H2 doğal dil soru · 9 TBB yasak ifade temiz · 10 slug ASCII · 11 disclaimer+rozet ·
12 min 3 iç link (pillar+cluster+author). + `blog_validator.py` sonucu (PASS/FAIL).

**3) CMS PANEL FORMATI** (panele kopya-yapıştır):
- KİMLİK (Başlık, Slug, Özet, Kategori, Yazar, Yazar Kimliği)
- YAYIN (Yayın/Güncelleme/Gözden Geçiren/Sonraki Gözden Geçirme tarihleri)
- SEO (SEO Başlığı [≤60], SEO Açıklaması [150-160], Canonical)
- TAKSONOMİ (Tier, Intent, Topic Anahtarları, Pillar bağlantıları)
- İÇERİK BİLEŞENLERİ → **[TL;DR]** (40 kelime) · **[SSS — JSON]** (Question/answer dizisi) ·
  **[CITATION]** → **[Kanun Referansları]** (Kanun No|Madde|Başlık) + **[Yargı Kararları]**
  (Mahkeme|Tarih|E./K.|documentId|URL|İlke|sonuç — her biri DOĞRULANDI ✓)
- GÖRSEL (Kapak Görseli yolu/Imagen prompt, Alt Text, OG Image)
- DURUM (draft | noindex)

**4) İÇERİK (Markdown)** — H1'den imzaya tam gövde (panel "İÇERİK" alanına yapıştırılır).
6 katman + min 5 H2 (doğal dil) + SSS + disclaimer + "Av. Aykut Yeşilkaya — İstanbul Barosu / Vega Hukuk İstanbul".

**5) DOSYALAR** — Drive klasörü `G:\Drive'ım\Hukuk Bürosu\Blog\{YYYY-MM-DD}-{slug}\`
(blog.md + blog.cms.md + blog.mail.md + kapak.png). SONRAKİ ADIM listesi. Footer: THEMIS otomasyonu.

## Sabit kurallar
- Subject: `[Blog PR] {konu} — paste hazır` (THEMIS v3 etiketi eklenebilir).
- Alıcı: avukatın kendi gelen kutusu (taslak, auto-send yok).
- **0-Halüsinasyon:** [Yargı Kararları] yalnız Bedesten documentId ile DOĞRULANMIŞ künyeler.
  Doğrulanmayan künye blogda YOK; SELF-CHECK 6 dürüstçe `[~]` işaretlenir.
- `blog_validator.py` PASS olmadan draft oluşturulmaz (BLOCKING).

<!-- DOKTRIN-PREAMBLE v1 -->
> **0-HALÜSİNASYON + ANTI-SYCOPHANCY (zorunlu — tam metin: `prompts/_doktrin-preamble.md`):**
> - UYDURMA YARGITAY/HGK/İBK kararı atfı YASAK — her künye Bedesten documentId ile doğrulanır; doğrulanmayan "DOĞRULANMAMIŞ" damgalanır.
> - Karar metni ALINTISI UYDURULAMAZ — tırnak içi alıntı birebir kaynaktan.
> - BAĞLAM KORUNMALI — bir fıkranın cevabı başka fıkraya genellenemez.
> - Avukatı memnun etmek için LEHE YORUM YASAK; ALEYHE İÇTİHAT açıkça gösterilir, gizlenmez.
> - "KAYNAK YOK" demek dürüstlüktür — sayı doldurmak için uydurma atıf HARD FAIL.
> - Kritik kuralda ÇİFT KAYNAK şart.
> - Çıktının sonunda KAYNAK DOĞRULAMA tablosu (| İddia | Kaynak | documentId | Tam Alıntı | Doğrulama |) + "Aleyhe içtihat: VAR/YOK/ARANMADI" beyanı ZORUNLU.

# /blog yaz — THEMIS Blog Yazari (Serbest Konu Modu)

`$ARGUMENTS` formati: `[konu]` veya bos (avukatdan istenir)

Ornek:
```
blog yaz: Kidem tazminati 2026'da nasil hesaplanir?
blog yaz: Fazla mesai ispat yuku — bordro imzali olsa bile tanik delili
```

Eger argument bossa: avukata "hangi konuyu blog yapacagiz?" diye sor.

## Zorunlu Referans Dokumanlar

- `ajanlar/blog-yazari/SKILL.md` — tam protokol
- `prompts/gemini/blog_yazimi.md` — Antigravity'ye yapistirilan prompt
- `prompts/themis-blog-pr-v3-format.md` — **Gmail PR çıktısının ZORUNLU formatı (THEMIS v3)**. Blog maili/CMS çıktısı AYNEN bu yapıda üretilir (avukat onaylı, 2026-06-03).
- `prompts/gemini/_ortak-kurallar.md` — Gemini ortak kurallari
- `ajanlar/blog-yazari/THEMIS.md` — proje kokunde tam THEMIS referansi
- `config/author.json` — Aykut sameAs URL'leri
- `config/model-routing.json` -> `tasks.blog_yazimi`

## Workflow

### ADIM -1: MemPalace Wake-up

- `mempalace_status`
- `mempalace_search "{konu}" --wing wing_buro_aykut --limit 2`
- `mempalace_search "{konu}" --wing wing_ajan_blog_yazari --limit 2`
- `mempalace_search "{konu}" --wing wing_{kategori} --limit 2`

### ADIM 0: Parametre Toplama

Avukata kisa kontrol sor (cogu zaten konudan cikarilabilir):

```
THEMIS girdi parametreleri:
- Primary keyword: [konudan cikarilan / avukat dogrular]
- Kategori: is-hukuku | tuketici | trafik | icra | aile | diger
- Intent: I (bilgilendirme) | C (ticari) | T (islem/randevu)
- Sayfa tipi: blog (1500-2500) | cluster (1500-2000) | pillar (3000+)
- Saha ornegi (anonim) eklensin mi? E/H

Onaylar misin / degistirir misin?
```

Avukat onaylasa veya degistirse parametreleri kaydet.

### ADIM 0B: Kanibalizasyon Kontrolu

```
mempalace_search "{primary_keyword}" --wing wing_buro_aykut/hall_blog_konulari --limit 5
```

Eslesme varsa avukata uyari ver:
```
DIKKAT: "{primary_keyword}" daha once /[url] yazisinda kullanildi
({yayim_tarihi}, {kelime} kelime).

Secenekler:
  1. Mevcut yaziyi guncelle (eklenti / revizyon)
  2. Farkli keyword sec (orn: "[onerilen alternatif]")
  3. Yine de yeni yazi yaz (kanibalizasyon riski)

Tercih?
```

Avukat secimini bekle. Tercih 2 ise yeni keyword ile devam et.
Tercih 3 ise rapora not dus, devam et.

### ADIM 1: Cikti Klasoru Olustur

Slug taslagi cikar (Turkce → ASCII, kebab-case, max 60 char):
```
"Kidem Tazminati 2026'da Nasil Hesaplanir?"
  → "kidem-tazminati-2026-nasil-hesaplanir"
```

Drive klasoru:
```
G:\Drive'im\Hukuk Burosu\Blog\{YYYY-MM-DD}-{slug-taslagi}\
```

Google Drive MCP ile olustur.

### ADIM 2: Author Config Oku

```
Read config/author.json
```

`sameAs` URL listesi (bos string olanlar atlanir) → devir blogu icine.

### ADIM 3: Vektor DB + Yargi/Mevzuat MCP Tarama (Hizli)

THEMIS yeni arastirma yapmaz AMA serbest konu modunda avukatin hazir
emsal karari yoksa Director Agent Antigravity'ye gonderecek minimum
context'i toplar:

- `mcp__yargi-mcp-pro__ictihat_ara` ile primary keyword
  icin 3-5 emsal karar (documentId'li) — FAZ 2 2026-05-19
- `mcp__yargi-mcp-pro__mevzuat_ara(mevzuat_no="<no>", mevzuat_tur_list=["KANUN"])`
  ile ilgili kanun maddesi (en az 2)

Sonuclar Antigravity devir bloguna gomulur.

### ADIM 4: Antigravity Devir Blogu Bas

```
========== ANTIGRAVITY DEVIR BLOGU ==========
ASAMA: Blog Yazimi (THEMIS) — SERBEST KONU
Konu: {konu}

Sag panele yapistirilacak:
--------------------------------------------
{ajanlar/blog-yazari/SKILL.md "Antigravity Devri" bolumundeki sablon}
{prompts/gemini/blog_yazimi.md PROTOKOL DOSYASINI Antigravity workspace'inde ac}

mod: serbest
primary_keyword: "{...}"
secondary_keywords: ["{...}"]
intent: {I|C|T}
kategori: {...}
sayfa_tipi: {blog|cluster|pillar}
hedef_kelime: 1500-2500

emsal_kararlar:
  {3-5 Bedesten ID'li karar — Yargi MCP'den}

mevzuat:
  {2+ kanun maddesi — Mevzuat MCP'den}

saha_ornek: |
  {avukat onayli anonim senaryo veya BOS}

entity_graph:
  pillar: "/{kategori}"
  clusters: [...]
  tools: [...]
  dis_otorite: "https://www.mevzuat.gov.tr/..."

author_sameAs:
  {config/author.json sameAs listesi}

Cikti yolu: G:\Drive'im\Hukuk Burosu\Blog\{tarih}-{slug}\
Dort dosya: blog.md + blog.cms.md + blog.mail.md + kapak.png

KURALLAR (kisa hatirlatma):
  - 6 katman OLAY-KOSAR-DERIN-SAHA-ETIK-AKSIYO zorunlu
  - Min 1500 kelime, min 3 Bedesten ID atfi, min 5 FAQ
  - KVKK: tam isim/TC/IBAN/sokak YASAK
  - TBB: "en iyi/garantili/%100/kesin basari" YASAK
  - Kapak gorseli Imagen ile uret (insan yuzu/logo/yazi YASAK)
  - Self-review yap; KIRMIZI = Drive'a YAZMA, yeniden uret
--------------------------------------------

Antigravity tamamlayinca buraya don ve "Blog bitti" yaz.
=============================================
```

### ADIM 5: Avukat Onayini Bekle

Avukat "Blog bitti" diyene kadar bir sonraki adima gecme.

### ADIM 6: Post-Production (Avukat onayi sonrasi)

1. **TRUST KAPISI — ZORUNLU, BLOCKING (`blog_validator.py`):**
   Blog Drive'dan indirildikten sonra, Gmail draft'tan ÖNCE çalıştır:
   ```
   python scripts/blog_validator.py "<blog.md yolu>" --dict {dava-id}
   ```
   - **HARD FAIL** (doğrulanmamış/uydurma emsal, KVKK sızıntı, TBB yasak ifade,
     SENTINEL yok) → **DUR. Gmail draft OLUŞTURMA, final Drive'a yazma.** Sorunları
     Antigravity'ye geri bildir, düzelttir, yeniden çalıştır.
   - **SEO-WARN** → bloklamaz; avukata raporla (yayın öncesi düzeltilebilir).
   - PASS olmadan 2. adıma GEÇİLMEZ ("opsiyonel" DEĞİL — 2026-05-17 sahte icra blog
     dersi). Yapısal kapı documentId gerçekliğini doğrulamaz; her künye ayrıca
     bağımsız reviewer ile `ictihat_getir` üzerinden teyit edilir.

1B. **WhatsApp Paketi (ZORUNLU — validator PASS sonrası):**
   ```
   python scripts/wa_paket.py "{cikti-klasoru}" --hook "satir1|satir2|satir3"
   ```
   Çıktı: `wa-durum.png` (1080x1920 WhatsApp durumu), `wa-kare.png` (1080x1080
   grup/post), `wa-metin.txt` (WhatsApp *bold* işaretli kopyala-yapıştır metin).
   Hook = yazıdan çıkarılan en pratik 3 kısa satır (TBB vaat dili YASAK; başlık,
   özet ve link frontmatter'dan otomatik okunur). Tasarım: lacivert/pirinç
   VEGA şablon dili — logo/insan yüzü yok.

2. **Gmail Draft** (YALNIZ `blog_validator.py` PASS sonrası — avukata sor):
   ```
   Gmail draft olusturulsun mu? (E/H)
   ```
   EVET → Gmail MCP `create_draft`:
   - To: avukatın kendi gelen kutusu (varsayılan, self-review için) — **auto-send YOK**.
   - Subject: `[Blog PR] [{konu}] — paste hazir`
   - Body: `blog.mail.md` (Markdown→Gmail için HTML'e render et; ham markdown
     tablo/kod blokları Gmail'de bozulur).
   - **TAM İÇERİK KURALI (avukat talebi 2026-07-20):** Panele girilecek HER ŞEY
     mailin İÇİNDE olmalı — dosya referansı YETMEZ. Maile blog.cms.md'nin tamamı
     eklenir: panel alan değerleri sıralı liste halinde, TL;DR / faqJson / gövde
     ise kopyalamada bozulmasın diye `<pre style="white-space:pre-wrap">`
     blokları içinde. Avukat MD dosyası açmadan yalnız mailden yapıştırabilmeli.

3. **MemPalace Diary Write:**
   ```
   mempalace_diary_write "blog_yazari" \
     "konu={konu}, primary_keyword={kw}, kelime={N}, bedesten_atif={N},
      self_review=YESIL|SARI, mod=serbest"
   ```

4. **Hall_blog_konulari'a Drawer (kanibalizasyon icin):**
   ```
   mempalace_add_drawer \
     --wing wing_buro_aykut \
     --hall hall_blog_konulari \
     --drawer "{slug}" \
     --content "URL: /{kategori}/{slug}, primary_keyword: {kw},
                yayim_tarihi: {YYYY-MM-DD}, kelime: {N},
                kategori: {kategori}"
   ```

5. **QMD Update** (opsiyonel):
   ```
   qmd update {drive-blog-klasoru}
   ```

6. **Avukata kapanis raporu:**
   ```
   Blog hazir:
     - Klasor: {drive-yolu}
     - Dosyalar: blog.md ({N} kelime), blog.cms.md, blog.mail.md, kapak.png
     - WhatsApp: wa-durum.png + wa-kare.png + wa-metin.txt
     - Self-review: YESIL | SARI ({varsa duzeltme notu})
     - Validator: PASS | FAIL ({detay})
     - Gmail draft: OLUSTURULDU | OLUSTURULMADI

   Sonraki adim: Avukat panele elle yapistirir →
     https://vegahukukistanbul.com/admin/#/collections/blog/new
     (alan eslemesi blog.cms.md'de — Decap semasi, ajanlar/blog-yazari/THEMIS.md Bolum 4)
   ```

## Kurallar (Avukatin Bilmesi Gerekenler)

- Muvekkil verisi blog'a TASINMAZ — tum saha ornekleri anonim takma isimle
- Kesin hukuki tavsiye verme; "yuksek ihtimalle / benzer dosyalarda" formulu
- "Kesin kazanirsiniz" / "%100 basari" / "en iyi" YASAK (TBB)
- Uydurma Yargitay karari atifi YASAK — Bedesten ID yoksa atif yapma
- Otomatik yayim YOK — Aykut elle CMS'e tasir

## Fallback

- Antigravity erisilemez → "fallback claude" → terminal Claude uretir.
  Kapak: Claude-in-Chrome + gemini.google.com (avukat oturumu) uzerinden
  "VEGA Kapak Tarz Formulu" ile uretilir (bkz. ajanlar/blog-yazari/SKILL.md);
  Gemini oturumu da yoksa prompt hazir birakilir
- Imagen tool erisilemez → metin tamamlanir, `coverImage.path: ""` birakilir
- Yargi MCP timeout → avukatdan emsal karar Bedesten ID'lerini elle iste
- Mevzuat MCP timeout → avukatdan kanun + madde no'yu elle iste

---

**Iliskili komut:** `blog yaz dava: [dava-id]` — dava arastirma raporundan
blog uretir (bkz. `.claude/commands/blog-dava.md`).

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
- `prompts/gemini/_ortak-kurallar.md` — Gemini ortak kurallari
- `TEHMIS.md` — proje kokunde tam THEMIS referansi
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

- `mcp__yargi-mcp-pro__search_bedesten_unified` ile primary keyword
  icin 3-5 emsal karar (documentId'li) — FAZ 2 2026-05-19
- `mcp__yargi-mcp-pro__search_mevzuat(mevzuat_no="<no>", mevzuat_tur_list=["KANUN"])`
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

1. **Validator** (opsiyonel ama tavsiye):
   - Eger `scripts/blog_validator.py` mevcutsa: calistir
   - Yoksa Director Agent kalite kontrol listesini el ile uygula
     (Bolum: ajanlar/blog-yazari/SKILL.md > Kalite Kontrol Listesi)

2. **Gmail Draft** (opsiyonel — avukata sor):
   ```
   Gmail draft olusturulsun mu? (E/H)
   ```
   EVET → Gmail MCP `create_draft` ile `blog.mail.md` icerigi draft olarak.
   - Subject: `[Blog PR] [{konu}] — paste hazir`
   - Body: `blog.mail.md` icerigi

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
     - Self-review: YESIL | SARI ({varsa duzeltme notu})
     - Validator: PASS | FAIL ({detay})
     - Gmail draft: OLUSTURULDU | OLUSTURULMADI

   Sonraki adim: Avukat CMS'e elle yapistirir.
   ```

## Kurallar (Avukatin Bilmesi Gerekenler)

- Muvekkil verisi blog'a TASINMAZ — tum saha ornekleri anonim takma isimle
- Kesin hukuki tavsiye verme; "yuksek ihtimalle / benzer dosyalarda" formulu
- "Kesin kazanirsiniz" / "%100 basari" / "en iyi" YASAK (TBB)
- Uydurma Yargitay karari atifi YASAK — Bedesten ID yoksa atif yapma
- Otomatik yayim YOK — Aykut elle CMS'e tasir

## Fallback

- Antigravity erisilemez → "fallback claude" → terminal Claude uretir
  (kapak gorseli URETILEMEZ, sonradan avukat elle uretir)
- Imagen tool erisilemez → metin tamamlanir, `coverImage.path: ""` birakilir
- Yargi MCP timeout → avukatdan emsal karar Bedesten ID'lerini elle iste
- Mevzuat MCP timeout → avukatdan kanun + madde no'yu elle iste

---

**Iliskili komut:** `blog yaz dava: [dava-id]` — dava arastirma raporundan
blog uretir (bkz. `.claude/commands/blog-dava.md`).

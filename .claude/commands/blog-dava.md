---
description: "Dava araştırmasından anonim blog yazısı (THEMIS dava modu); DENETCI tek denetim"
---
<!-- DOKTRIN-PREAMBLE v1 -->
> **0-HALÜSİNASYON + ANTI-SYCOPHANCY (zorunlu — tam metin: `prompts/_doktrin-preamble.md`):**
> - UYDURMA YARGITAY/HGK/İBK kararı atfı YASAK — her künye Bedesten documentId ile doğrulanır; doğrulanmayan "DOĞRULANMAMIŞ" damgalanır.
> - Karar metni ALINTISI UYDURULAMAZ — tırnak içi alıntı birebir kaynaktan.
> - BAĞLAM KORUNMALI — bir fıkranın cevabı başka fıkraya genellenemez.
> - Avukatı memnun etmek için LEHE YORUM YASAK; ALEYHE İÇTİHAT açıkça gösterilir, gizlenmez.
> - "KAYNAK YOK" demek dürüstlüktür — sayı doldurmak için uydurma atıf HARD FAIL.
> - Kritik kuralda ÇİFT KAYNAK şart.
> - ÇIKARIM GEÇERLİLİĞİ: Kaynak gerçek olsa dahi ondan çıkarılan sonuç geçersizse HARD FAIL — bağlam kayması, meşru olmayan genelleme, caiz olmayan kıyas, bilinçli susmayı boşluk sayma reddedilir.
> - Çıktının sonunda KAYNAK DOĞRULAMA tablosu (| İddia | Kaynak | documentId | Tam Alıntı | Doğrulama |) + "Aleyhe içtihat: VAR/YOK/ARANMADI" beyanı ZORUNLU.

# /blog yaz dava — THEMIS Blog Yazari (Dava Modu)

`$ARGUMENTS` formati: `[dava-id]` (orn: `selin-uyar-2026-003`)

Bir davanin arastirma raporundan SEO uyumlu hukuki blog yazisi uretir.
Muvekkil verisi blog'a TASINMAZ — sadece hukuki tezler / icithat / mevzuat.

## Zorunlu Referans Dokumanlar

- `ajanlar/blog-yazari/SKILL.md` — tam protokol
- `prompts/muhakeme/blog_yazimi.md` — MUHAKEME üretim protokolü (aynı oturum)
- `ajanlar/blog-yazari/THEMIS.md` — proje kokunde tam THEMIS referansi
- `config/author.json` — Aykut sameAs URL'leri
- `config/motor-haritasi.json` -> `tasks.blog_yazimi`

## Workflow

### ADIM -1: MemPalace Wake-up

- `mempalace_status`
- `mempalace_search "{dava-id} blog" --wing wing_buro_aykut --limit 2`
- `mempalace_search "{kritik-nokta}" --wing wing_ajan_blog_yazari --limit 2`

### ADIM 0: Dava Verilerini Topla

1. **Dava arastirma raporu oku:**
   ```
   Read G:\Drive'im\Hukuk Burosu\Aktif Davalar\{dava-id}\02-Arastirma\arastirma-raporu.md
   ```
   Bulunmazsa: avukata "Arastirma raporu eksik. Once `arastir: ...`
   komutuyla arastirmayi tamamla" de, DURDUR.

2. **(Opsiyonel) Briefing oku:**
   ```
   Read G:\Drive'im\Hukuk Burosu\Aktif Davalar\{dava-id}\00-Briefing.md
   ```
   Avukatin ton/risk tolerans tercihleri varsa al.

3. **(Opsiyonel) Stratejik analiz oku:**
   ```
   Read G:\Drive'im\Hukuk Burosu\Aktif Davalar\{dava-id}\02-Arastirma\stratejik-analiz.md
   ```
   ASAMA 4 sentez sonucu varsa "Dilekce Yazim Rehberi" disindaki hukuki
   tezleri blog ictihadi olarak kullanabilirsin.

### ADIM 0B: KVKK Kontrolu (KRITIK)

Dava muvekkil verisinin blog'a SIZMAMASI icin sertlestirilmis kontrol:

```
1. config/masks/{dava-id}.json dosyasini OKU
2. Maskeli tokenlari ([MUVEKKIL_1], [TC_1], [ADRES_1] vb.) liste cikar
3. Arastirma raporundan bu tokenlari ve gercek karsiliklarini TEMIZLE
   (THEMIS girdi paketinde olmayacaklar)
4. Sadece su veriler blog girdisine gider:
   - Yargitay kararlari (zaten kamu)
   - Mevzuat maddeleri
   - Genel hukuki tezler (dava olgusu olmadan)
   - Anonim saha senaryosu (avukat onayli, isim sembolize edilmis)
```

`config/masks/{dava-id}.json` yoksa avukati uyar:
```
DIKKAT: Bu davanin maskeleme sozlugu yok.
`python scripts/maske.py add {dava-id}` ile olustur, sonra tekrar dene.
```

### ADIM 1: THEMIS Girdi Paketi Cikar

Arastirma raporundan blog yazisina giden bilgi paketini cikar:

```yaml
mod: dava
dava_id: "{dava-id}"

# Avukata kisa sor (eksik bilgileri):
primary_keyword: "?"  # Davanin hukuki temasindan keyword cikar
secondary_keywords: ["?"]
intent: I  # default: bilgilendirme; avukat C/T diyebilir
kategori: "?"  # dava turunden cikarilir (iscilik -> is-hukuku vs.)
sayfa_tipi: blog
hedef_kelime: 1500-2500

emsal_kararlar:
  # Arastirma raporundaki "Guncel Yargitay Kararlari" bolumunden cek
  # SADECE Bedesten ID'li ve DOGRULANMIS olanlar
  - bedesten_id: "..."
    daire: "..."
    esas: "..."
    karar: "..."
    tarih: "..."
    ozet: "..."
    cited_text: "..."  # karar tam metninden birebir (varsa)

mevzuat:
  # Arastirma raporundaki "Ilgili Mevzuat" bolumunden cek
  - code: "..."
    madde: "..."
    title: "..."
    yururluk: "..."

saha_ornek: |
  # AVUKATA SOR: "Bu davadan jenerik saha ornegi cikarayim mi?
  # Tam anonim olacak: 'tekstil sektoru calisani' tarzi profil."
  # Yanit EVET ise dava olgularini jenerik takma isim ile tarif et.
  # Yanit HAYIR ise bos birak.

entity_graph:
  pillar: "/{kategori}"
  clusters:
    # MemPalace'tan ayni kategori altinda yazilmis bloglari listele
    - "/{kategori}/..."
  tools:
    # Iliskili hesaplayici varsa (kidem tazminati -> /hesapla/kidem)
    - "/hesapla/..."
  dis_otorite: "https://www.mevzuat.gov.tr/..."

author_sameAs:
  # config/author.json'dan
  - "..."
```

Eksik alanlari avukata kisa sor (max 1 cevap turunde).

### ADIM 2: Cikti Klasoru Olustur

```
G:\Drive'im\Hukuk Burosu\Aktif Davalar\{dava-id}\06-Blog\
```

Google Drive MCP ile olustur. (Davaya bagli oldugu icin dava klasoru
altinda.)

### ADIM 3: Kanibalizasyon Kontrolu

```
mempalace_search "{primary_keyword}" --wing wing_buro_aykut/hall_blog_konulari --limit 5
```

Ayni keyword baska URL'de varsa avukati uyar (`blog.md`'deki ADIM 0B
ile ayni mekanizma).

### ADIM 4: Üretim (tek motor — aynı oturum)

Elle devir bloğu, kopyala-yapıştır ve harici panel YOKTUR. Akış:
`ajanlar/blog-yazari/SKILL.md` → "Üretim Akışı (tek motor — Blog / THEMIS)".

1. ORKESTRATOR THEMIS girdi paketini hazırlar: `mod: dava`, primary_keyword,
   secondary_keywords, intent (I|C|T), kategori, sayfa_tipi, hedef_kelime 1500-2500,
   `verified: true` emsal kararlar (3-5), mevzuat (2+), saha_ornek, entity_graph, author_sameAs.
2. MUHAKEME `prompts/muhakeme/blog_yazimi.md` protokolüyle dört dosyayı üretir:
   `blog.md` + `blog.cms.md` + `blog.mail.md` + `kapak.png` → `{dava-id}/06-Blog/`
   (dava klasörü `python scripts/paths.py dava <dava-id>`). KVKK extra sert: müvekkil, karşı taraf,
   mahkeme esas no ve olay ayrıntısı anonimleştirilir.
3. DENETCI tek denetim yapar (AGENTS.md "Denetim Politikası"): `blog_validator.py` + künye
   içerik teyidi. KIRMIZI veya SARI'da yeniden üretilir (en çok 3 tur); YEŞİL olmadan Gmail taslağı ve MemPalace kaydı açılmaz. Sonuç blog klasöründe
   ayrı `denetim-sonucu.md` dosyasına yazılır; blog gövdesine, CMS ve mail sürümlerine girmez. Blog
   hattı dava akış kaydı açmaz.

KURALLAR (kısa hatırlatma):
  - 6 katman OLAY-KOSAR-DERIN-SAHA-ETIK-AKSIYON zorunlu
  - Min 1500 kelime, min 3 verified Bedesten ID atfı, min 5 FAQ
  - KVKK: tam isim/TC/IBAN/sokak YASAK
  - TBB: "en iyi/garantili/%100/kesin basari" YASAK
  - Kapak: "VEGA Kapak Tarz Formülü" (insan yüzü/logo/yazı YASAK)

### ADIM 5: Avukat Onayini Bekle

Avukat "Blog bitti" diyene kadar bekle.

### ADIM 6: Post-Production

`blog.md` komutundaki ADIM 6 ile ayni:

1. Validator (ZORUNLU, BLOCKING — PASS olmadan Gmail draft acilmaz)
1B. WhatsApp paketi: `python scripts/wa_paket.py "{klasor}" --hook "..."` →
    wa-durum.png + wa-kare.png + wa-metin.txt (KVKK: hook satirlarinda dava
    olgusu/muvekkil verisi YASAK, yalniz genel hukuki tez)
2. Gmail Draft (avukata sor) — TAM İÇERİK kurali: blog.cms.md'nin tamami
   mailin icinde (`blog.md` komutu ADIM 6/2'deki kural aynen uygulanir)
3. MemPalace diary write:
   ```
   mempalace_diary_write "blog_yazari" \
     "konu={...}, primary_keyword={...}, kelime={N}, bedesten_atif={N},
      denetim=YESIL, mod=dava, dava_id={dava-id}"
   ```
4. `hall_blog_konulari`'na drawer (kanibalizasyon icin)
5. **EK ADIM (dava modunda):** `hall_dava_blog_eslesmesi`'ne baglanti:
   ```
   mempalace_add_drawer \
     --wing wing_buro_aykut \
     --hall hall_dava_blog_eslesmesi \
     --drawer "{dava-id}-blog" \
     --content "Dava {dava-id} arastirmasindan uretilen blog: /{kategori}/{slug}.
                Yayim tarihi: {YYYY-MM-DD}."
   ```
6. QMD update
7. Avukata kapanis raporu

## Kurallar (Dava Modu Ozel)

- Muvekkil ad, TC, IBAN, sokak adi BLOG'DA YASAK (KVKK Seviye 2 sert uygulanir)
- Dava-spesifik olgular (firma adi, UYAP no, mahkeme dosya no) BLOG'DA YASAK
- Sadece HUKUKI TEZLER + KAMUYA AIT KARARLAR + MEVZUAT MADDE'LER tasinir
- Saha ornegi YALNIZ avukat onayli ve TAM ANONIM formatta
- Dava-blog eslesmesi MemPalace'ta tutulur (avukat hangi davadan hangi
  blog cikti diye sonradan baktiginda gorur)

## Hata Senaryolari

| Sorun | Yapilacak |
|-------|-----------|
| Arastirma raporu eksik | "Once `arastir: ...` calistir" de, DURDUR |
| Maskeleme sozlugu yok | "`python scripts/maske.py add {dava-id}` olustur" de, DURDUR |
| Arastirma raporunda Bedesten ID < 3 | Avukatdan ek karar Bedesten ID'leri elle iste |
| Avukat saha ornegi istemiyor | Katman 4 jenerik kalir veya kisaltilir |
| Kanibalizasyon riski | `blog.md`'deki ayni mekanizma |

## Fallback

`blog.md` komutuyla ayni:
- Görsel üretim aracı yoksa kapak `blog.md` fallback'indeki yolla üretilir
- Imagen tool erisilemez → metin tamamlanir, kapak gorseli avukat elle uretir

---

**Iliskili komut:** `blog yaz: [konu]` — serbest konu modu (bkz. `blog.md`).

# Tek Motorlu, Motor-Bağımsız Hukuk Otomasyonu — Tasarım Spec'i

**Tarih:** 2026-09-02
**Durum:** Avukat onaylı tasarım (sohbet içi onay, 2026-09-02)
**Önceki spec:** `2026-07-19-claude-gemini-donus-design.md` — bu spec onun **motor
mimarisi** bölümünü geçersiz kılar (iki motorlu / elle devir bloklu yapı kalkar);
kalite kapıları, doktrin ve ASAMA sırası aynen korunur.

---

## 1. Amaç ve Gerekçe

Avukatın kararı (2026-09-02):

> "Ben artık sadece tek bir LLM ile çalışacağım, bu zaman zaman değişecek. Bu projeye
> hangi LLM ile bağlanırsam bağlanayım o LLM ile hukuki süreçlerimi ilerletebileyim
> istiyorum; belirli bir modelin adının geçmesine gerek olmasın."

Bu karar üç sonuç doğurur:

1. **Vendor bağımlılığı kalkar.** Anayasa dosyası, prompt yüzeyleri ve config, belirli
   bir sağlayıcının adına değil **role** dayanır.
2. **İki motorlu mimari çöker.** Bugünkü akış terminal (orkestratör) + Antigravity paneli
   (muhakeme) ayrımına dayalı; ASAMA 3-7 için üç kez elle kopya-yapıştırma gerektiriyor.
   Tek motorla bu ayrım anlamını yitirir.
3. **"Bağımsız denetçi" şartı yeniden tanımlanmalıdır.** 0-Halüsinasyon doktrininin
   bel kemiği, çıktıyı üreten gözden **başka bir gözün** denetlemesidir. Bu bağımsızlık
   artık "başka firma"dan değil **"başka bağlam"dan** gelecektir.

Buna eşlik eden üç iş daha bu spec kapsamındadır:
- Kök dizindeki yaklaşık 380 KB tekrar eden anlatı dokümanının toparlanması,
- Dr. Halil Polat, *Teori ve Pratikte Hukuk Nosyonu Cilt I* (5. baskı) kitabının işlenmesi,
- TBB **DavaTek** uygulamasının keşif düzeyinde haritalanması.

**Öncelik düzeltmesi (avukat, 2026-09-02 ek talimat):** Bu üç işin ağırlığı eşit değildir.
Kitabın bütün olarak okunup **ilk dava analizi (ASAMA 1 briefing) adımına eksiksiz
yedirilmesi**, bu spec'in ana işidir (bkz. 3.4). DavaTek en düşük önceliklidir; avukat
uygulamayı deneyecek, entegrasyon ileride ayrı bir spec ile geliştirilecektir.

---

## 2. Mevcut Durum Tespiti (araştırma bulguları)

### 2.1 Doküman dağınıklığı
420 git-takipli dosya var; kanonik katman (`config/`, `prompts/`, `ajanlar/*/SKILL.md`,
`playbook/`, `dersler/`, `scripts/`) temiz ve tek-kaynak. Kirlilik yalnızca **kök dizindeki
anlatı dosyalarındadır**: `CLAUDE.md` (72 KB), `SON.md` (100 KB), `FIVEAGENTS.md` (76 KB),
`TEHMIS.md` (40 KB), `ANTIGRAVITY.md` (24 KB), `ARASTIRMA.md`, `ASAMALAR.md`,
`MANUS1`, `MANUS2`, `NEXUS.md`, `BRAINSTORMING.md`, `doctoudf.md`, `MASKELEME-KILAVUZU.md`.
Aynı 7-ASAMA akışı en az dört dosyada farklı sözcüklerle anlatılıyor.

### 2.2 LLM bağımlılığının yüzeyi
67 dosyada "Claude" geçiyor; ancak bağımlılık üç yerde **yapısaldır**:
- `config/model-routing.json` — model adları (zaten Single Source of Truth; doğru dikiş yeri),
- `prompts/gemini/` — klasör adı motora bağlı (içerik değil),
- "Antigravity devir bloğu" protokolü — `CLAUDE.md` artı yedi SKILL.md dosyasına örülmüş.

### 2.3 Tarihçe uyarısı (yanlış ders çıkarmamak için)
2026-07-18'de `AGENTS.md`'ye geçilmiş, 2026-07-19'da geri alınmıştı. İlgili spec okundu:
geri dönüş **Codex motorunun kalite yetersizliği** yüzündendir, dosya isimlendirmesi
yüzünden değil. Vendor-nötr doküman fikri denenip başarısız olmadı — hiç denenmedi.
Bu spec motor **seçimi** değil, motor **bağımsızlığı** getirir.

### 2.4 DavaTek
TBB'nin resmî masaüstü uygulaması (Windows ve macOS, ücretsiz). UYAP Avukat Portal'dan
dava dosyalarını **yerel diske indirir**; fark takibi (yerel kayıt ile Portal karşılaştırması),
toplu icra sorgusu (MERNİS/SGK/GİB/banka), Excel export sunar. Erişim UYAP kimliği artı
SMS artı e-imza ile. **Public API'si yoktur; veri yalnızca yerel cihazda durur.**
Bu makinede kurulu değildir. Mevcut UYAP hattı `dava-cli` (Yargı PRO) yoluyla
`Documents/YargiPRO/Hukuk/{mahkeme}/{dosya}/{evraklar,cikti}` altına iner.
Sonuç: entegrasyon ancak **dosya sistemi adaptörü** ile mümkündür.

### 2.5 Hukuk Nosyonu kitabı
`Teori ve Pratikte Hukuk Nosyonu — Cilt I (5. Baskı)`, Dr. Halil Polat, 306 sayfa, 45 MB.
Teknik tespit: **metin katmanı yoktur, tüm sayfalar taranmış görüntüdür** (ilk 60 sayfada
çıkarılabilen metin: 0 karakter). Kullanılabilmesi için Türkçe OCR şarttır.
Ortamda `pytesseract`, `PyMuPDF (fitz)`, `PIL` kuruludur; **Tesseract binary'si ve `tur`
dil paketi yoktur** — kurulacaktır.
`EKLENECEKKITAPLAR.md`'de bu kitap için zaten onaylı bir entegrasyon planı mevcuttur
(vektör DB'ye atılmaz; kontrol listesi, protokol, doktrin clause).

---

## 3. Tasarım

### 3.1 Doküman mimarisi — tek anayasa, sahipli dosyalar

Hiçbir dosya silinmez; **sahibine göre yerleştirilir.**

**Kök (6 dosya artı stub'lar):**

```
AGENTS.md                   <- TEK ANAYASA (rol dili, 7 ASAMA, doktrin, kalite kapıları)
README.md                   <- YENİ: hangi dosya ne işe yarar haritası
legal.local.md              <- büro playbook
dilekce-yazim-kurallari.md
EKLENECEKKITAPLAR.md
requirements.txt
CLAUDE.md · GEMINI.md · .cursor/rules/hukuk.mdc   <- üçer satırlık stub: "AGENTS.md'yi oku"
```

**Sahibine taşınanlar (arşiv değil — aktif referans):**

| Kaynak | Hedef | Gerekçe |
|---|---|---|
| `FIVEAGENTS.md` | `ajanlar/perspektif/PROTOKOL.md` | 5-ajan detayı; `.claude/agents/*` buradan okur |
| `ARASTIRMA.md` | `ajanlar/arastirmaci/danisma-hatti.md` | `arastir danisma:` komutunun kaynağı |
| `TEHMIS.md` | `ajanlar/blog-yazari/THEMIS.md` | Blog hattının protokolü |
| `doctoudf.md` | `docs/udf-format.md` | Format referansı |
| `MASKELEME-KILAVUZU.md` | `docs/maskeleme-kilavuzu.md` | Maskeleme ertelendi ama `maske.py` canlı |

**Arşive (`arsiv/eski-notlar/`, `arsiv/README.md`'ye kayıtla):**
`SON.md`, `MANUS1`, `MANUS2`, `NEXUS.md`, `BRAINSTORMING.md`, `ANTIGRAVITY.md`,
`ASAMALAR.md`. Son ikisinin içeriği AGENTS.md'ye erir; ANTIGRAVITY.md'nin devir
protokolü zaten tek motora geçişle geçersizleşir.

Beklenen sonuç: kökte yaklaşık 380 KB tekrar eden anlatı, tek anayasada yaklaşık 90 KB'ye iner.

**Taşıma kuralı:** her taşımada `git mv` kullanılır (geçmiş korunur) ve taşınan dosyaya
atıf yapan tüm referanslar aynı commit'te güncellenir. `arsiv/`'e giden her dosyanın
başına bir satır konur: `> ARŞİV — güncel kaynak: AGENTS.md (2026-09-02)`.

**Kritik yan etki (Faz 1'de mutlaka yapılacak):** `scripts/doktrin_lint.py` bugün
`CLAUDE.md` ve `ANTIGRAVITY.md`'yi doktrin yüzeyi olarak denetliyor. `CLAUDE.md`
stub'a inip `ANTIGRAVITY.md` arşive taşınınca lint'in yüzey listesi aynı commit'te
güncellenmelidir: `AGENTS.md` yüzey listesine eklenir, `ANTIGRAVITY.md` çıkarılır,
`CLAUDE.md` stub olduğu için listeden çıkarılır. Aksi hâlde Faz 1 sonunda lint FAIL verir.

### 3.2 Rol dili ve motor haritası

`config/model-routing.json` dosyası **`config/motor-haritasi.json`** olarak yeniden
adlandırılır. Model adı yerine **rol** tanımlanır:

| Rol | Sorumluluk |
|---|---|
| `ORKESTRATOR` | Komut sınıflandırma, ASAMA geçişleri, kalite kapıları, Drive/Gmail/Takvim, DOCX/UDF üretimi |
| `ARASTIRMACI` | MCP çağrıları: Yargı-MCP-Pro (2B), Mevzuat (2C), NotebookLM (2D), MemPalace |
| `MUHAKEME` | Usul raporu, 5-ajan stratejik analiz, dilekçe, savunma simülasyonu, revizyon, blog |
| `DENETCI` | Bağımsız çıktı denetimi (sıfır bağlam) — **yeni** |

Dört rolün de `aktif_motor` varsayılan değeri `"baglanan"`dır: hangi LLM ile oturum
açıldıysa o. Config, hangi motorla çalışıldığını **kaydeder** (çıktı frontmatter damgası
için), **tahmin etmez**: avukat `motor: <ad>` komutuyla bildirir; bildirilmemişse
frontmatter `engine: bildirilmedi` yazar.

Metin temizliği: `"Claude Fable 5"`, `"Antigravity"`, `"Gemini 3.1 Pro"` gibi tüm sağlayıcı
adları rol adlarıyla değiştirilir. `prompts/gemini/` dizini `prompts/muhakeme/` olur.
`scripts/gemini-bridge.sh` (zaten DEPRECATED, exit 100) `arsiv/`'e taşınır.

**Kapsam dışı (bilinçli):** `.claude/` dizini (commands, agents, skills) Claude Code'un
kendi arayüz sözleşmesidir; bir *araç adaptörüdür*, vendor bağımlılığı değildir.
Aynı içerik gerektiğinde `.gemini/` veya `.codex/` altında ince kopya olarak üretilir.
Anayasa ve prompt yüzeyleri motor-nötr kaldığı sürece bu adaptörler tek satırlık
yönlendirmeden ibarettir.

### 3.3 Tek motor akışı ve DENETÇİ kapısı  *(sistemin yeni omurgası)*

Üç batch'lik elle devir kalkar. ASAMA 0'dan 7'ye kadar akış aynı oturumda kesintisiz ilerler.
Kalite, motor ayrımından değil **kapıdan** gelir:

```
ORKESTRATOR / MUHAKEME : ASAMA N çıktısını üretir
        |
        v
DENETCI alt-ajanı çağrılır — ÜRETİM BAĞLAMINI GÖRMEZ
   girdi : yalnızca { çıktı dosyası yolu, dava-id }
   yapar : - her documentId'yi MCP'den YENİDEN çeker
           - tırnak içi alıntıları kaynakla birebir kıyaslar
           - doktrin clause sayımı + Kaynak Doğrulama Tablosu grameri
           - scripts/cikti_dogrula.py + scripts/quality_gate.py (deterministik)
   döner : KIRMIZI / SARI / YEŞİL + gerekçe listesi
        |
        v
   YEŞİL değil -> ORKESTRATOR revize eder -> DENETCI yeniden çağrılır (en çok 3 tur)
   3 turda YEŞİL yoksa -> avukata escalate; çıktı Drive'a YAZILMAZ
```

**Motor-bağımsız uygulanış** (AGENTS.md'de üçü de yazılır):

1. Alt-ajan mekanizması olan araçta (Claude Code `Agent`, Gemini CLI subagent):
   sıfır bağlamlı alt-ajan.
2. Olmayan araçta: ikinci bir oturum veya sekme açılır, yalnızca dosya yolu verilir.
3. Hiçbiri yoksa: avukat yeni sohbette `denetle: <dosya>` komutunu elle çalıştırır.

Ajan tanımı: `ajanlar/denetci/SKILL.md` (kanonik) artı `.claude/agents/denetci.md` (ince stub).

**Dürüst sınır — spec'e yazılı kayıt:** Aynı modelin kendi çıktısını denetlemesi, farklı
sağlayıcının denetiminden **zayıftır**; sistematik kör noktalar paylaşılır. Bu yüzden
DENETCI *kanaate* değil *ölçüme* dayandırılmıştır: künyeleri yeniden çekmek ve
deterministik scriptleri çalıştırmak zorundadır. Yakalamayı taahhüt ettiği şey
"kötü hukuk" değil, **uydurma künye, bozuk alıntı, eksik doktrin clause'u ve bağlam
kaymasıdır**. Hukuki isabet denetimi avukatta kalır — sistem taslak üretir.

### 3.4 Hukuk Nosyonu kitabının işlenmesi  *(bu spec'in ana işi)*

Avukatın 2026-09-02 tarihli ek talimatı:

> "Hukuk nosyonu kitabını iyice özümseyerek okuyup projemizin o baştaki dava analizi
> briefing kısmına en doğru şekilde yedirmen. Bunları en eksiksiz şekilde yap."

Bu talimat, önceki "hedefli OCR" (yalnız Bölüm 2-3) yaklaşımını geçersiz kılar.
Kitap **bütün olarak** okunur ve asıl ürün bir kontrol listesi değil, **ASAMA 1'in
yeni olay çözüm protokolüdür**.

#### 3.4.1 OCR (Faz 0 — mekanik, paralel başlar)

1. Tesseract artı `tur` dil paketi kurulumu (yerel; kitap hiçbir dış servise gönderilmez).
2. `scripts/kitap_ocr.py`: PyMuPDF ile 300 dpi sayfa görüntüsü, `pytesseract --lang tur`,
   çıktı sayfa numaralı Markdown. Parametreler: `--sayfa-baslangic`, `--sayfa-bitis`,
   `--dpi`, `--cikti`.
3. **306 sayfanın tamamı** OCR edilir (önceki tasarımdaki ~120 sayfalık kısıt kaldırıldı).
4. **OCR kalite kontrolü:** rastgele 10 sayfa, OCR metni ile sayfa görüntüsü karşılaştırılarak
   denetlenir. Bozuk çıkan sayfalar `--dpi 400` ile yeniden denenir; yine bozuksa o sayfa
   `[OCR ŞÜPHELİ]` etiketiyle işaretlenir ve o sayfaya dayanan hiçbir kural
   doğrulanmadan kullanılmaz.

#### 3.4.2 Derin okuma turu (Faz 3 — ana iş)

OCR metni bölüm bölüm okunur; her bölüm için sayfa referanslı okuma notu üretilir:

- `bilgi-tabani/nosyon-okuma-notlari.md` — çalışma dokümanı. Bölüm 1 (nosyon kavramı ve
  nosyon edinme), Bölüm 2 (yöntem/metodoloji, hukuki uyuşmazlıklarda çözüm metodolojisi),
  Bölüm 3 (pratik olay çözümleri) ayrı ayrı özetlenir. Her kayıt `[s. NNN]` taşır.

İlk iş İÇİNDEKİLER'in okunmasıdır: `EKLENECEKKITAPLAR.md`'deki içerik varsayımları
teyit edilir, sapma varsa o dosya güncellenir (doğrulama borcu kapatılır).

#### 3.4.3 Ana ürün: ASAMA 1 olay çözüm protokolü

`ajanlar/director/olay-cozum-protokolu.md` üretilir. Bu dosya, sistemin **ilk dava
inceleme** adımının yeni iskeletidir.

Bugünkü ASAMA 1, esasen bir **tercih formudur** (dava teorisi, kritik risk, ton,
olmazsa olmaz talepler). Eksik olan, ilk incelemenin **disiplinli hukuki sırasıdır**;
kitabın katkısı buradadır.

**BAĞLAYICI KURAL — kendi doktrinimizin metodoloji çalışmasına uygulanması:**
Protokoldeki her adım ya **kitaptan sayfa referanslıdır** (`[s. NNN]`), ya da açıkça
`[SİSTEM EKİ]` etiketi taşır. Kitapta bulunmayan bir adım Polat'a atfedilemez;
"kitap şöyle diyor" biçiminde kaynaksız genel ifade yazılamaz. Protokolün sırası
kitaptan çıkarılır, önceden varsayılmaz.

**Teyit turu (zorunlu):** Protokol taslağı bitince her sayfa atfı için OCR metnine
(gerekirse sayfa görüntüsüne) geri dönülür ve iddia ile kaynak karşılaştırılır.
Teyit edilemeyen atıf ya düzeltilir ya da `[SİSTEM EKİ]`'ne çevrilir. Bu tur,
DENETCI mantığının kitap çalışmasına uygulanmasıdır.

#### 3.4.4 Protokolün sisteme yedirilmesi

Protokol yazılınca şu yüzeyler yenilenir:

| Yüzey | Değişiklik |
|---|---|
| `AGENTS.md` → ASAMA 1 bölümü | Kaynak sorgulama ve briefing öncesine **olay çözüm protokolü** adımı girer |
| `sablonlar/advanced-briefing-template.md` | Tercih formu, protokolün adımlarıyla yeniden kurgulanır |
| `00-Briefing.md` şablonu | Protokolün çıktı alanlarını taşır (nitelendirme, çare envanteri, ispat planı vb.) |
| `ajanlar/director/SKILL.md` | ASAMA 1 yürütmesi protokole bağlanır |
| `playbook/_sablon.md` | Olay çözüm iskeleti, avukatın kendi muhakemesiyle dolduracağı boş form olarak eklenir |

#### 3.4.5 İkincil ürün: yorum yöntemi ve doktrin clause'u (Faz 4)

- `bilgi-tabani/hukuki-yontem-kontrol-listesi.md` — her kural sayfa referanslı.
- `ajanlar/arastirmaci/SKILL.md` içine **"Yorum Yöntemi Protokolü"**: lafzî, sistematik,
  amaçsal, tarihsel yorum sırası; kıyas mı yoksa *argumentum a contrario* mu gerektiği;
  kanun boşluğu mu bilinçli susma mı ayrımı.
- `prompts/_doktrin-preamble.md` içine **9. clause: "Çıkarım geçerliliği — kaynak gerçek
  olsa dahi ondan çıkarılan sonuç geçersizse HARD FAIL."**
- `scripts/doktrin_contract.py` içindeki `REQUIRED_CLAUSE_TOKENS` listesi 8'den 9'a çıkar.

#### 3.4.6 Sınırlar ve riskler

**Telif sınırı (bağlayıcı):** OCR tam metni yalnızca `tmp/nosyon-ocr/` altında kalır;
repo'ya commit edilmez (`.gitignore`), vektör DB'ye indekslenmez, dilekçe veya bloga
uzun pasaj kopyalanmaz. Kalıcı olan **kitap değil, kitaptan çıkan protokol ve kontrol
listesidir.** Okuma notlarındaki alıntılar kısa ve referanslı tutulur.

**Risk — OCR kalitesi:** Taranmış Türkçe metinde `ı/i`, `ş/s`, `ğ/g` karışması olağandır.
3.4.1'deki kalite kontrolü ve `[OCR ŞÜPHELİ]` etiketi bu riski karşılar; şüpheli sayfaya
dayanan kural üretilmez.

**Risk — bölünmez adım:** Bugün `doktrin_lint.py` **30 doktrin yüzeyini** denetliyor ve
tamamı PASS veriyor (2026-09-02 baseline ölçüldü): 16 muhakeme prompt'u, 5 perspektif
ajanı, 7 komut dosyası, `CLAUDE.md` ve `ANTIGRAVITY.md`. 8'den 9'a clause geçişinde bu
30 yüzey (Faz 1 sonrası güncellenmiş listesiyle) aynı commit'te güncellenmezse lint
hepsini FAIL eder ve sistem çalışmaz. Bu adım tek commit'te tamamlanır; commit öncesi
`python scripts/doktrin_lint.py` PASS vermelidir.

### 3.5 DavaTek — keşif fazı (en düşük öncelik)

Avukatın kararı (2026-09-02): "DavaTek kısmını deneyeceğim; tüm dosyalarımı planlayıp bu
projeyle bir takip sistemi kurabilmek için onu ileride geliştireceğiz."

Bu faz kritik yolun dışındadır ve avukatın denemesini bekler. Bu fazda **kod yazılmaz**;
haritalama yapılır.

- Avukat DavaTek'i kurar ve bir dava indirir.
- `docs/davatek-kesif.md` üretilir: veri klasörü mutlak yolu, dosya ve klasör adlandırma
  şeması, fark takibi Excel çıktısının sütun yapısı, evrak formatları (.udf/.pdf/.tiff),
  OCR katmanı olup olmadığı, eşzamanlılık kısıtları.
- AGENTS.md'ye tek yapısal hazırlık: **"evrak kaynağı adaptörü"** kavramı tanımlanır.
  Bugün tek adaptör `dava-cli`; DavaTek ikinci slot olarak boş durur.
- Entegrasyon kodu (`scripts/evrak_kaynagi.py` ve fark takibi ile Takvim MCP köprüsü)
  FAZ 2'ye bırakılır; klasör yapısı elde edilince ayrı spec ile planlanır.

---

## 4. Uygulama Sırası ve Bağımlılıklar

| # | Faz | Bağımlılık | Gerekçe |
|---|---|---|---|
| **0** | **OCR: 306 sayfa (`kitap_ocr.py`) — arka planda başlar** | — | Mekanik ve uzun; karar gerektirmez, beklemeden başlar ve Faz 1-2 ile paralel yürür |
| 1 | Doküman toparlama artı `AGENTS.md` | — | Riski en düşük; sonraki her fazın zemini. `doktrin_lint.py` yüzey listesi aynı commit'te güncellenir |
| 2 | Rol dili artı `motor-haritasi.json` artı stub'lar | 1 | Anayasa yerine oturmadan rol dili yazılamaz |
| **3** | **Kitabın derin okunması → ASAMA 1 olay çözüm protokolü** | 0, 1 | **Bu spec'in ana işi.** Protokol, temizlenmiş AGENTS.md'ye yerleşir (çift iş olmasın) |
| 4 | Yorum yöntemi kontrol listesi artı doktrin 9. clause | 3 | Okuma turu bitmeden clause metni yazılamaz |
| 5 | `DENETCI` ajanı artı tek motor akışı | 2 | Kalite kapısı; 9. clause'un **çıktı tarafındaki** yaptırımı burada tamamlanır |
| 6 | DavaTek keşif | — (bağımsız) | En düşük öncelik; avukatın denemesini ve klasör yapısını bildirmesini bekler |

**Paralellik notu:** Faz 0 (OCR) ile Faz 1-2 (doküman ve config işleri) birbirine
dokunmaz; OCR arka planda çalışırken toparlama yapılır. Faz 3 her ikisinin de bitmesini
bekler: OCR metnini okur, çıktısını temizlenmiş `AGENTS.md`'ye yazar.

**Faz 4 ile Faz 5 arasındaki dürüst sınır:** Faz 4 bittiğinde 9. clause prompt
yüzeylerinde vardır ve `doktrin_lint.py` bunu denetler; ancak çıktının gerçekten
geçerli çıkarım yapıp yapmadığı Faz 5'teki DENETCI kurulmadan **otomatik denetlenmez**.
Faz 4 ile Faz 5 arasında bu kontrol avukattadır.

## 5. Kabul Kriterleri

1. Kökte 6 kanonik dosya artı 3 stub kalır; taşınan hiçbir dosyaya kırık referans kalmaz
   (`grep` ile doğrulanır).
2. `AGENTS.md` içinde hiçbir sağlayıcı adı (Claude, Gemini, Antigravity, Codex, GPT)
   **rol tanımı olarak** geçmez; yalnızca tarihçe ve araç adaptörü bağlamında geçebilir.
3. `python scripts/doktrin_lint.py` PASS verir (9 clause ile).
4. `python scripts/paths.py check` ile tüm yollar çözümlenir.
5. Bir hukuki çıktı üretildiğinde DENETCI kapısı çalışır ve KIRMIZI kararda çıktı Drive'a
   yazılmaz — bu, gerçek bir dosyayla uçtan uca denenerek gösterilir.
6. Kitabın 306 sayfası OCR edilmiş, kalite kontrolü yapılmış, şüpheli sayfalar
   `[OCR ŞÜPHELİ]` ile işaretlenmiştir.
7. `bilgi-tabani/nosyon-okuma-notlari.md` üç bölümü de kapsar ve her kayıt `[s. NNN]` taşır.
8. `ajanlar/director/olay-cozum-protokolu.md` üretilmiştir ve **her adımı** ya sayfa
   referanslıdır ya da `[SİSTEM EKİ]` etiketlidir; etiketsiz tek bir adım kalmamıştır.
9. Teyit turu yapılmış; protokoldeki her sayfa atfı kaynağa dönülerek doğrulanmıştır.
10. ASAMA 1 yüzeyleri protokole bağlanmıştır: `AGENTS.md`, `sablonlar/advanced-briefing-template.md`,
    `00-Briefing.md` şablonu, `ajanlar/director/SKILL.md`, `playbook/_sablon.md`.
11. `bilgi-tabani/hukuki-yontem-kontrol-listesi.md` üretilmiş, her kural sayfa referanslıdır.
12. Kitabın OCR tam metni repo'da **yoktur** (`git ls-files | grep -i nosyon` boş döner).
13. `docs/davatek-kesif.md` mevcuttur veya "kurulum bekleniyor" durumuyla açıkça işaretlidir.

---

## 6. Kapsam Dışı (YAGNI)

- DavaTek entegrasyon kodu (ayrı spec, FAZ 2).
- Serozan *Hukukta Yöntem – Mantık* kitabı (henüz temin edilmedi;
  `EKLENECEKKITAPLAR.md` birinci bölümü bekleme kaydı olarak kalır).
- Polat Cilt II (ceza) — aktif dava profili buna uzak.
- KVKK maskelemesinin yeniden zorunlu kılınması (2026-07-09 kararıyla ertelendi;
  yerel LLM'e geçişte geri gelir).
- `isbu-ofis/` alt projesi — bağımsız web uygulaması, bu spec'in dışındadır.
- Vektör DB'ye kitap metni indeksleme — bilinçli olarak reddedildi
  (`EKLENECEKKITAPLAR.md` üçüncü bölümü).

---

## Uygulama Kaydı

**Tamamlanma:** 2026-09-02 (tek oturum)
**Plan:** `docs/superpowers/plans/2026-09-02-tek-motor-agnostik-toparlama.md`
**Kabul kriterleri:** 13/13 doğrulandı.

| # | Kriter | Sonuç |
|---|---|---|
| 1 | Kökte 6 kanonik + 3 stub | ✓ AGENTS/README/legal.local/dilekce-yazim/EKLENECEKKITAPLAR + CLAUDE/GEMINI/.cursor |
| 2 | AGENTS.md'de rol tanımı olarak sağlayıcı adı yok | ✓ vendor_lint TEMİZ (76 dosya) |
| 3 | doktrin_lint 9 clause ile PASS | ✓ 29 yüzey |
| 4 | Yollar çözümleniyor | ✓ paths.py check |
| 5 | DENETCI KIRMIZI'da yazımı engelliyor | ✓ sahte çıktı → KIRMIZI, 11 bulgu, sıfır bağlam (dersler/sistem.md) |
| 6 | 306 sayfa OCR, şüpheliler işaretli | ✓ 18 şüpheli → inceleme: boş/ayırıcı sayfalar, içerik kaybı yok |
| 7 | Okuma notları 3 bölüm, `[s. NNN]` | ✓ 118 sayfa referansı |
| 8 | Protokol adımları etiketli | ✓ 24 adım: 21 `[s.]` + 3 `[SİSTEM EKİ]` |
| 9 | Teyit turu | ✓ 36/36 atıf OCR'da doğrulandı |
| 10 | ASAMA 1 yüzeyleri bağlı | ✓ AGENTS / briefing şablonu / director SKILL / playbook şablonu |
| 11 | Yöntem kontrol listesi | ✓ — **sapma kaydı:** Polat yorum kurallarını içermiyor; §1–5 `[SİSTEM EKİ]`, Serozan bekleniyor |
| 12 | OCR tam metni repoda yok | ✓ `git ls-files` boş |
| 13 | DavaTek keşif notu | ✓ kurulum bekleniyor durumuyla |

**Sapmalar (dürüst kayıt):**
- §3.4.5 "yorum yöntemi kontrol listesi sayfa referanslı" — Polat bu kuralları vermiyor
  (s.37–38 yalnız çerçeve). Liste yazıldı ama kurallar `[SİSTEM EKİ]`; Serozan öncelikli.
- §3.2 "vendor_lint" kapsamı: JSON tarihli `_history` girdileri ve `<!-- vendor-ok -->`
  işaretli meşru mention'lar (araç adı, alt proje, tarihçe) muaf tutuldu.
- Faz sırası: Faz 3 (kitap) Faz 2'den önce yürütüldü (avukat kararı); çakışma olmadı.


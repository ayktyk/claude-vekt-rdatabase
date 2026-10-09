# Karma Mimari — Büro Dava Süreci + Yargı PRO — Tasarım Kaydı

**Tarih:** 2026-10-09
**Durum:** Uygulandı, avukat onayı bekleniyor (commit edilmedi). Varsayılan kararlar §6'da.
**Önceki spec:** `2026-09-02-tek-motor-agnostik-toparlama-design.md` — onun tek motor ilkesi,
doktrini ve 7 ASAMA sırası aynen korunur; bu kayıt yalnız (a) Yargı PRO ile ilişkiyi,
(b) çalışma modlarını, (c) denetim politikasını, (d) akış kaydını değiştirir.

---

## 1. Avukat talimatı

> "Projemizin son durumunu netleştirelim … yargı pro entegrasyonu sonrasında benim eski kurduğum
> pipeline işlemiyor gibi hissediyorum … gönlümden geçen eski kurduğum ajanlı ve çok katmanlı
> pipeline'ın yargı pro ve içindeki skill'lerle mükemmel şekilde çalışması … bağımsız denetçi
> çalışıyor birkaç defa, benim sistemimde bu yoktu nereden geldi … davacı, davalı, bilirkişi ve
> hakim bakış açısı vardı, dilekçe v1, savunma dilekçesi ve dilekçe v2 vardı, bunlar yeni durumda
> yok … karma ve güçlü bir sistem olsun istiyorum … karışıklığı giderip sistemimizi düzenleyelim."

## 2. Teşhis (kanıtlı)

| # | Bulgu | Kanıt |
|---|---|---|
| T1 | Bağımsız denetçi (DENETCI) Yargı PRO'dan gelmedi; 2026-09-02 tek motor kararının sonucu olarak projede tasarlandı ve 2026-09-03'te eklendi. İki motorlu dönemdeki iki kapının (üreticinin self-review'ı + bağımsız künye teyidi) tek alt-ajanda birleşmiş hâlidir. | spec 09-02 §3.3; commit 574d17c, 703fd11, ed20899; `config/motor-haritasi.json` `_history` |
| T2 | "Birkaç defa çalışma" tasarım gereğiydi: tam akışta 6 çağrı (ASAMA 2-7), her biri en çok 3 tur. 2026-012'de iki rapor için 7 tur koşmuş, hiçbiri YEŞİL olmamış; sonuçlar dosyaya yazılmadığından iz yok. | AGENTS.md (eski) "Akış"; `tmp/2026-012/` + `duzelt_r1..r4.py` |
| T3 | Perspektif katmanı, v1 → savunma → v2 dokümanlarda silinmedi; ama Eylül'den beri hiçbir davada üretilmedi. Nisan–Mayıs davalarında (2026-003, 2026-016) tam set var. | Drive `Aktif Davalar/*/02-Arastirma`, `03-Sentez-ve-Dilekce` envanteri |
| T4 | 7 ASAMA yalnız `yeni dava:` ile tetikleniyordu; son işler UYAP klonu + tekil dilekçe talebi olarak geldi ve tekil komutlar "tek aşama" çalıştı. | AGENTS.md (eski) "Bu protokol SADECE `yeni dava:`…" |
| T5 | Ajan SKILL'leri `Aktif Davalar/{dava-id}/0x-…` düzenini varsayıyor; dava-cli klonu (`evraklar/`, `INDEX.md`, `dava-analiz.md`) hiçbir SKILL'de tanınmıyor. | `ajanlar/*/SKILL.md` girdi/çıktı yolları |
| T6 | Yargı PRO iki ayrı "işletim sistemi" getirdi: MCP sunucu talimatı ("her hukuki işten önce `hukuk_skill` çağır, talimatlarını izle") + 107 skill'lik kütüphane (kendi yönlendiricisi 0-1, kendi kapıları 15-7/15-8/11-8) ve dava-cli'nin her klona yazdığı "izin isteme, doğrudan doldur" talimatlı `dava-analiz.md`. Projede `hukuk_skill`'e tek atıf yoktu. | `hukuk_skill` 0-1, kanonik zincir; klon klasörü `AGENTS.md`/`dava-analiz.md`; `grep hukuk_skill` |
| T7 | Kullanıcı-global `~/.claude/CLAUDE.md` (2026-05-05) eski 4-ajan / vektör DB / CLI-birincil / maskeleme-zorunlu sistemi anlatıyor; her oturumda AGENTS.md ile birlikte yükleniyor (iki anayasa). | `~/.claude/CLAUDE.md` |
| T8 | Mekanik arızalar: `config/motor-haritasi.json` geçersiz JSON (HTML yorumları; `motor: <ad>` dosyayı ezerdi) · `.claude/settings.local.json`'da var olmayan yola giden iki MCP hook'u · `/devam` `/atla` `/dur`'un okuduğu durum dosyasını hiçbir şey üretmiyordu · `cikti_dogrula.py` gerçek TC'li her dilekçeyi HARD FAIL sayıyordu (maskeleme ertelenmişken) · DENETCI alt-ajanının araç listesinde Yargı PRO MCP araçları yoktu. | `json.load` hatası; settings dosyası; `grep workflow-state`; `cikti_dogrula.py`; `.claude/agents/denetci.md` |
| T9 | Drive veri kökü `1Hukuk Bürosu` olarak yeniden adlandırılmış; `config/paths.json` eski adı gösteriyordu (Research/Biten/Blog bulunamıyordu). Eski adla kalan klasörde yalnız Yargı PRO uygulamasının `dosyalarim.json` kaydı var. | `paths.py check`; Drive kök listesi |

## 3. Tasarım

### 3.1 İki katman ve öncelik
Üst katman büronun dava sürecidir (7 ASAMA, 4A-4E, v1 → savunma → v2, DENETCI); alt katman
Yargı PRO'dur (MCP araçları, `hukuk_skill`, dava-cli, udf-cli, yargi-skill). Öncelik: avukat
talimatı > AGENTS.md + SKILL'ler > `hukuk_skill` yöntem bölümleri > sunucu/global skill/klon
yönergeleri. Skill'lerin zincir yönetimi (reçete, iade, case-state, mühür) uygulanmaz.

### 3.2 ASAMA ↔ Yargı PRO eşlemesi
AGENTS.md "Karma Mimari" tablosu. Perspektif katmanının (4A-4E) Yargı PRO'da karşılığı yoktur;
büronun özgün katmanı olarak korunur. Süre hesabı `yargi-skill sure_hesapla` ile deterministik.

### 3.3 Çalışma modları
TAM (7 ASAMA) / HIZLI (0→1→2→5→7). Varsayılan: esas belge + son güne > 7 gün → TAM; usul/ara
belge veya ≤ 7 gün → HIZLI. Mevcut davaya gelen esas belge talebi artık TAM'ı tetikler
(T4'ün çözümü). Her işin başında tek satırlık mod bildirimi.

### 3.4 Denetim politikası v2 (ikinci tur sonrası son hâli)
DENETCI üç sabit noktada çalışır: **K1** araştırma raporu, **KS** stratejik analiz (4E sentezi ve
dilekçe yazım rehberi), **K2** dışarı giden nihai belge. Havuza sonradan künye eklenirse
`kunye-havuzu-ek.md` kullanılmadan önce **EK** denetiminden geçer. Tam akışta 3 çağrı (her biri en
çok 3 tur); HIZLI modda yalnız K2. Atıf içermeyen belgede DENETCI çağrılmaz, `UYGULANMAZ` kaydı düşülür.
Ara çıktılar yapısal kapı + `scripts/havuz_kontrol.py` ile ilerler (documentId ve «…» alıntı havuzda
olmalı). Dışarı giden belge **belge + eşlik çifti**dir: UYAP'a gidecek metin temizdir; SENTINEL, Kaynak
Doğrulama tablosu, aleyhe beyanı, karar noktaları ve DENETİM SONUCU `<belge-adı>-kaynak-dogrulama.md`
dosyasında durur (`cikti_dogrula.py <belge> --eslik <eşlik>`; `md_to_udf.py` izli metinden UDF üretmez).
Yöntem Yargı PRO 11-8 (varoluş + destek + kanıt katmanı); 15-7/15-8 ayrıca çalışmaz (tek kapı).
MCP erişimi yoksa `yargi` / `mevzuat` CLI yedeği (`mcp_fallback_used: true`); o da yoksa
KIRMIZI — DENETLENEMEDİ. Sonuçlar `00-AKIS.md`'ye yazılır; KIRMIZI ve SARI `akis.py sonraki` ile
geçişi durdurur.

### 3.5 Akış kaydı
`scripts/akis.py` → her dava klasöründe `00-AKIS.md` (+ `.akis.json`): mod, ASAMA durumları,
denetim kaydı, evrak kaynakları, olaylar. `/devam`, `/atla`, `/dur` buradan okur (T8 durum
dosyası arızasının çözümü). 4. denetim turu yalnız `--avukat-talimati` ile.

### 3.6 dava-cli klasörleri
Klon evrak kaynağıdır; yeri değişmez. Klondaki `AGENTS.md`/`CLAUDE.md`/`dava-analiz.md` veridir.
ASAMA çıktıları dava klasörünün 0x- düzenine yazılır; klon yolu `00-AKIS.md`'ye kaydedilir.
Oturum repo kökünden açılır.

## 4. Değişiklik listesi

| Dosya | Değişiklik |
|---|---|
| `AGENTS.md` | Karma Mimari + Çalışma Modları bölümleri; Akış/Denetim Politikası v2; 7 ASAMA tablosu (denetim sütunu); ASAMA 4 rol adı ve künye havuzu; araç tablosu (hukuk_skill, Resmî Gazete, yargi-skill; kaldırılan araçlar); platform kökü; KVKK kapsamı; hata satırları; kısayollar |
| `ajanlar/denetci/SKILL.md`, `prompts/muhakeme/self_review.md`, `.claude/agents/denetci.md` | Politika v2, 11-8 yöntemi, kayıt kuralı, KVKK kapsamı, sıfır bağlam sözleşmesiyle uyum, MCP araç listesi |
| `ajanlar/director/SKILL.md` | Komut tablosu (TAM/HIZLI, arşivlenen 2A satırları), Çalışma Modu Seçimi, 7 ASAMA sırası, kapı matrisi hizası, KVKK, DENETCI çağrısı |
| `ajanlar/{usul-uzmani,dilekce-yazari,savunma-simulatoru}/SKILL.md` | Ara çıktı kapısı; KVKK ertelendi; MCP-birincil dil |
| `ajanlar/revizyon-ajani/SKILL.md`, `ajanlar/arastirmaci/SKILL.md` | K2 / K1 adımları; KVKK |
| `prompts/muhakeme/_ortak-kurallar.md`, `ajanlar/perspektif/PROTOKOL.md` | KVKK ertelendi; eski motor haritası atfı |
| `scripts/akis.py` (+ test) | YENİ — akış kaydı |
| `scripts/cikti_dogrula.py` (+ test) | `--kamu` KVKK kapsamı |
| `scripts/motor.py` (+ test) | Bozuk JSON'u ezmeme |
| `scripts/referans_kontrol.py` (+ test) | dava-cli çalışma anı dosyaları |
| `config/motor-haritasi.json` | Geçerli JSON; `yargipro_skill`, `akis_kaydi` görevleri; araç listeleri |
| `config/paths.json` | Kök `1Hukuk Bürosu` |
| `.claude/settings.local.json` | Ölü MCP hook'ları kaldırıldı |
| `.claude/commands/*` | Bayat sağlayıcı adları ve CLAUDE.md atıfları; yeni `/dilekce` (global `dilekce-yaz` skill'i ile çakışmasın diye), `/davayi-cek`, `/akis`; `/devam` ailesi `00-AKIS.md`'ye bağlandı |
| `.claude/skills/*` | Araştırma rehberi sunucu sürümüne (2026-09-06) güncellendi; kaldırılan sunucu araçlarına not |
| **İkinci tur (aynı gün, bağımsız inceleme sonrası)** | |
| `scripts/havuz_kontrol.py` (+ test) | YENİ — ara çıktının künye ve alıntılarını havuza bağlayan deterministik kapı |
| `scripts/cikti_dogrula.py`, `scripts/doktrin_contract.py`, `scripts/md_to_udf.py` (+ test) | `--eslik` belge + eşlik çifti; TBB ters vaat ifadeleri; künye biçimleri; `atif_iceriyor` (sözleşme "Madde N" başlıkları hariç); UDF'ye denetim izi girmez |
| `scripts/akis.py` (+ test) | Sürüm 2: iş bazlı kayıt, K1/KS/K2/EK, `sonraki` ENGEL (KIRMIZI ve SARI geçmez), UYGULANMAZ yalnız K2 + not |
| `scripts/paths.py` (+ test) | `dava` kısa id ile mevcut klasörü bulur; çoklu eşleşmede hata; hayalet klasör açmaz |
| `AGENTS.md` | Denetim politikası K1 + KS + K2 + EK; kapı tablosu; HIZLI girdi kuralı; süre şablonu bayrakları ve güven kuralı; araç tablosu düzeltmeleri; kritik nokta Adım 8; karar noktaları eşlik dosyasında |
| `prompts/_doktrin-preamble.md` (Varyant A), denetçi, director, üretici ajan SKILL'leri, `PROTOKOL.md` | Aynı politikaya hizalandı; mevzuat sorgu lehçesi (operatör yok, gerekçe yok) düzeltildi; MCP timing hook'larının bağlı olmadığı notu |
| `.claude/agents/*`, `ajanlar/*/system-prompt.md`, `prompts/muhakeme/dilekce_yazimi.md` | KVKK maskeleme kalıntıları ertelenmiş kurala hizalandı |
| `.claude/commands/*` | `description` başlığı; K1/KS/K2 ve eşlik çifti; `sure_hesapla` bayrakları; ihtarname ve sözleşmede K2 adımı; danışma sırası (DENETCI → DOCX/Drive) |
| `.gitignore` | `sablonlar/FORMAT-REFERANS-*.html` (gerçek müvekkil verisi) |
| **Üçüncü tur (tutarlılık incelemesi, 11 bulgu)** | |
| `scripts/akis.py` (+ test) | EK KIRMIZI/SARI geçişi durdurur; `--nokta ISTEK` (`denetle:` kaydı, geçişi durdurmaz); mutlak ve göreli yol aynı dosya sayılır |
| `scripts/doktrin_contract.py` (+ test) | Belgede TASLAK satırı, GÜVEN NOTU, AVUKAT İÇİN NOTLAR izi yakalanır (YAML frontmatter hariç) |
| `scripts/havuz_kontrol.py`, `scripts/referans_kontrol.py` (+ test) | "DOĞRULANMASI GEREKİR" damgası uyarı sayılır; çalışma anı dosya adları |
| `prompts/muhakeme/revizyon.md` | v2 çiftini bu rol yazar (eski "yalnız talimat ver" kaldırıldı); v2'de 1 doğrulanamayan atıf bloklar |
| `_ortak-kurallar`, `_doktrin-preamble`, `dilekce_yazimi`, `istinaf_temyiz`, `muvekkil_bilgilendirme`, PROTOKOL | TASLAK, GÜVEN NOTU ve avukat notları dışarı giden belgede eşlik dosyasına; istinaf/temyiz ve müvekkil bilgilendirme çifte bağlandı |
| `.claude/agents/*` (4A-4E), `stratejik_analiz.md` | SENTINEL + Kaynak tablosu + aleyhe satırı; yalnız havuz künyesi; KS; 4E kararı KIRMIZI / YEŞİL / ŞARTLI |
| `olay-cozum-protokolu.md`, `sablonlar/advanced-briefing-template.md` | Briefing kapanış bloğu (künyesiz tablo + `Aleyhe içtihat: ARANMADI`) |
| `blog*.md`, `blog_yazimi.md`, director blog akışı | SARI de durdurur; denetim sonucu `denetim-sonucu.md`; ikinci self-review kaldırıldı |
| **Dördüncü tur (yeniden doğrulama, 6 yeni çelişki)** | |
| `scripts/akis.py` (+ test) | Kapı dosya bazlı: her dosyanın son kararı geçer olmalı (bir belgenin YEŞİL'i diğerinin KIRMIZI'sını örtmez); YEŞİL denetim dizisini kapatır, tur sayacı yeniden 1'den başlar; `denetim_engeli()` |
| `scripts/md_to_docx.py`, `scripts/md_to_udf.py` (+ `test_denetim_engeli.py`) | Denetim noktası çıktısı YEŞİL (K2'de UYGULANMAZ) kaydı olmadan DOCX atlanır, UDF üretilmez — "Drive'a yazılmaz" kod düzeyinde |
| Metin | İhtarname eşlik adı istisnası her yerde; nihai metinde 1 doğrulanamayan atıf bloklar; istinaf/temyiz ve müvekkil satırları eşlikli; KS'den sonra diary; blog öz-kontrolü `self-review.md`, DENETCI kararı `denetim-sonucu.md`; damgalı havuz dışı alıntı uyarıdır ama dışarı giden belgeye giremez |
| `~/.claude/CLAUDE.md` | Eski sistem anlatımı kaldırıldı, doktrin + AGENTS.md yönlendirmesi kaldı (yedek alındı) |
| **Beşinci tur (107 beceri; avukatla birlikte verilen kararlar A10-A13)** | |
| `config/beceri-haritasi.json` | YENİ — 107 beceri: kol, tek cümlelik açıklama, sistemdeki yer (aşama, kol ailesi, hat, karşılık, yalnız istenince); 9 büro hattı |
| `scripts/beceri_haritasi.py` (+ test) | YENİ — aşama ve hat beceri listesi kola göre; `kontrol` (107 beceri, hat referansları) |
| `scripts/sure_kalkani.py` (+ test) | YENİ — 12-4 Süre Kalkanı deposu `00-Sure-Kalkani.json`: `girdi` önceki satırı ekler, satır silinmez, geçmişi kısaltan kayıt reddedilir, pano görünümü kesin / koşullu / tarihsiz ayrı |
| `scripts/akis.py` (+ test) | `--kol`, `kol` alt komutu, `olay --hat`; kayıtta yargı kolu |
| `config/paths.json`, `scripts/paths.py` (+ test) | `yargipro_cli` yolu ve `yargipro-cli` komutu |
| `AGENTS.md` | "Beceri Haritası ve Büro İş Hatları": kararlar, kol aile tablosu, dosya kabul, 9 hat, takip araçları ve dosya yerleri, beceri metinlerinin büro uyarlamaları, masaüstü komut satırı kuralları; eşleme tablosu ve kısayol komutları |
| `ajanlar/director/SKILL.md` | Hat komutları; çalışma modu seçiminde kol ve dosya kabul |
| `.claude/commands/` | YENİ `/dosya-kabul`, `/durusma`, `/karar-geldi`, `/muzakere`, `/vekalet-sonlandir`, `/pano`; `/davayi-cek` evrak girişi hattına çevrildi; `/yeni-dava` ve `/dilekce` kol ve beceri listesi |
| `docs/karma-mimari-yargipro.html` | YENİ — sistem haritası, büro hatları, 107 beceri sözlüğü |
| **Altıncı tur (UYAP takibi ve büyük eşitleme; avukat kararları A18-A20)** | |
| `scripts/uyap_ortak.py`, `scripts/uyap_takip.py`, `scripts/uyap_esitle.py`, `scripts/excel_takip.py` (+ `test_uyap_takip.py`) | YENİ — günlük önbellekli UYAP okuması ve pano raporu; yavaş mod büyük eşitleme (kayıttan günlük kota, ilk sınırda dur, `klonla` işi `isler`den izlenir); iş takip Excel'i (CMK hariç, yalnız boş hücre, yedekli, COM ile) |
| `scripts/sure_kalkani.py` (+ test) | İnceleme bulguları: yalnız güncel satırdan üretilen satır kabul edilir, büro alanları geçmişte korunur, senkronlu satırda tarih değişirse ESKİ, bozuk satır panoyu düşürmez, koşullu satıra ufuk yok, arşivli satır bayraksız açılmaz, UTF-16/BOM okuma, `--cikti` |
| `scripts/beceri_haritasi.py` (+ test) | Hat ↔ beceri iki yönlü tutarlılık denetimi |
| `scripts/icra_ozet.py` (+ `test_icra_ozet.py`), `excel_takip.py` | Avukat isteği: icra takiplerinde taraflar, son durum, mal varlığı. Klon evrakından çıkarım (ekler ve OCR toleransı, ihbarname metni ayrımı, Windows uzun yol); Excel "İCRA TAKİPLERİ" sayfası; yeni sorgu yapılmaz |
| `scripts/uyap_esitle.py`, `uyap_ortak.py` | UYAP CAPTCHA sonrası: başarı dışındaki her sonuçta dur, doğrulama kilidi (`devam --not`), günde 8 dosya / 10-15 dk; CMK listesi `Aktif Davalar/00-CMK-DOSYALARI.md` |
| `docs/proje-son-durum.html` | YENİ — projenin son durumu: dava araştırma ve dava iş takibi |
| Belgeler (13 tutarlılık bulgusu) | 15-2 `--bagla`, PDF önce metne, ihtarname/sözleşme dava dışı belge hattı, Kalkan atıfları, takvim kaynakları, zabıtta indirme önerisi, okuma listesi |

## 5. Kabul kriterleri

1. `python scripts/doktrin_lint.py` PASS · `vendor_lint.py` TEMİZ · `referans_kontrol.py` tabanı aşmaz.
2. `python -m pytest scripts/tests -q` tamamı geçer (yeni testler dahil).
3. `config/motor-haritasi.json` geçerli JSON; `python scripts/paths.py check` tüm kökleri VAR bulur.
4. DENETCI sahte kusurlu çıktıyla (`tmp/denetci-deneme/sahte-cikti.md`) sıfır bağlamla denenir ve
   KIRMIZI verir; künyeleri MCP'den yeniden çektiği görülür (dersler/sistem.md 2026-09-02 kuralı).
5. AGENTS.md'de tam akış başına DENETCI çağrı sayısı 3 (K1 + KS + K2) olarak yazılıdır; ara çıktı
   kapısı (`cikti_dogrula.py` + `havuz_kontrol.py`) ve belge + eşlik çifti tanımlıdır.
6. Mevcut davaya esas belge talebi TAM modu tetikler (AGENTS.md "Çalışma Modları").

## 6. Avukatın onayına sunulan varsayılan kararlar

| # | Karar | Varsayılan (uygulandı) | Alternatif |
|---|---|---|---|
| A1 | Denetim sıklığı | K1 + KS + K2 (tam akışta 3 çağrı; havuz eki varsa EK) | İlk tur: K1 + K2 (2 çağrı) · eski düzen: her ASAMA (6 çağrı) · yalnız K2 |
| A2 | TAM/HIZLI eşiği | Esas belge + son güne > 7 gün → TAM | Her esas belge TAM · her seferinde sor |
| A3 | Drive kökü | `1Hukuk Bürosu` | Klasör eski adına döndürülür, `config/paths.json` geri alınır |
| A4 | Global `~/.claude/CLAUDE.md` | Doktrin + AGENTS.md yönlendirmesi; eski anlatım yedekte | Eski hâline dön (yedekten) |
| A5 | Yargı PRO global skill'leri (`~/.claude/skills`) | Kurulu kalır, 7 ASAMA'nın yerine çalışmaz | Kaldırılır |
| A6 | Dışarı giden belgenin kaynak tablosu | Ayrı eşlik dosyası (`<belge-adı>-kaynak-dogrulama.md`) | Tablo belgenin sonunda (UYAP'a doktrin izi sızma riski) |
| A7 | İhtarnamenin eşlik dosyası | Onaylı 2026-048 standardındaki `kontrol-notlari.md` korunur, başına SENTINEL eklenir | `ihtarname-v1-kaynak-dogrulama.md` adına geçilir |
| A8 | HIZLI moddaki usul/ara belge | Yargıtay atfı zorunlu değil; atıf yoksa K2 UYGULANMAZ kaydı | Her belgede DENETCI |
| A9 | "Drive'a yazılmaz" yaptırımı | Dosya Drive klasörüne TASLAK olarak yazılır; YEŞİL'e kadar DOCX/UDF yok, dışarı gitmez, sonraki ASAMA kullanmaz (`akis.py sonraki` ENGEL) | Ayrı yerel hazırlık klasörü (`tmp/<dava-id>/`), YEŞİL'de Drive'a kopya |
| A10 | Yedi aşama dışındaki işler | **Avukat kararı:** büro iş hatları (9 hat) | Tekil Yargı PRO becerisi doğrudan |
| A11 | Yargı kolu | **Avukat kararı:** otomatik (10-7), avukat düzeltebilir | Her işte avukata sor |
| A12 | Dosya kabul paketi | **Avukat kararı:** 15-4 + 17-2 + 15-3 + 15-2 standart; 13-9 onam formu yalnız istenince | Onam formu da standart |
| A13 | Takip araçları | **Avukat kararı:** benimsendi (Kalkan, dava özeti, portföy, pano) | Kullanılmaz |
| A14 | Takip dosya yerleri | Kalkan `{dava}/00-Sure-Kalkani.json`, özet `{dava}/00-Dava-Ozeti.md`, portföy `Aktif Davalar/00-PORTFOY.md`, pano dosyasız | Büro geneli tek Kalkan dosyası · Yargı PRO'nun `DAVA-OZETI.md` ve `_buro/PORTFOY.md` adları |
| A15 | `supur` (UYAP taraması) | Yalnız günlük pano komutunda, oturumda bir kez | Hiç kendiliğinden çalışmaz · her pano çağrısında |
| A16 | Masaüstü komut satırı erişimi | Tam erişim açık; yazan komutlar yalnız açık komutla; günlük tavan avukatın ayarı | Yalnız okuma (indirme dava-cli ile) |
| A17 | Yapay zekâ kullanım bildirimi maddesi (13-9, 17-2, 13-7 önerisi) | Kendiliğinden eklenmez; gerekiyorsa eşlik dosyasında "avukat kararı bekleniyor" notu | Belge türüne göre standart madde |
| A18 | Büyük eşitleme | **Avukat kararı:** bütün UYAP dosyaları uygulamanın ağacında toplanır; aday listesi bitene kadar her gün yavaş mod (tek dosya, 10-15 dk ara, günde en çok 8, her hatada dur, UYAP doğrulaması isterse avukat onayına kadar kilit; ilk gün 15/gün hızında doğrulama istendi) | Öncelikli partiler, her parti onayla · yalnız iş geldikçe |
| A19 | İş takip Excel'i | **Avukat kararı:** `VEGA_HUKUK_Is_Takibi.xlsx` UYAP verisiyle güncellenir, CMK dosyaları girmez; ceza dosyası yalnız büro klasörüne bağlıysa girer; avukatın dolu hücresine dokunulmaz | Her ceza dosyası girer · ayrı yeni Excel |
| A20 | Takip kapsamı | **Avukat isteği:** süreler, PTT/UETS tebligatları, icra, yeni evrak, dosya durumu, sıradaki işlem; KEP UYAP dışı, kanal avukatla belirlenecek | — |

## 7. Riskler

- Ara çıktılar artık bağımsız denetimden geçmiyor; künye dışı çıkarım hataları ancak nihai metne
  taşınırsa K2'de yakalanır (AGENTS.md "Dürüst sınır").
- 7 gün eşiği tahmindir; avukatın fiili kullanımıyla ayarlanmalıdır.
- macOS yolu Drive senkronuna göre güncellendi, Mac'te doğrulanmadı; Mac'teki `~/.claude/CLAUDE.md`
  ayrı dosyadır ve bu değişiklikten etkilenmez.
- Yargı PRO sunucusu skill'lerini ve araçlarını sık güncelliyor (içerik sürümü 3ce05e48); eşleme
  tablosu skill adlarına bağlıdır, adlar değişirse tablo güncellenir.
- KS ek bir DENETCI çağrısıdır (süre ve maliyet); avukat kullanımıyla ölçülmelidir.
- Kayıtlı `denetci` alt-ajanı ilk oturumda MCP'ye erişemedi (eski tanım yüklüydü). Tanıma ToolSearch ve ek
  araçlar eklendi; yeni oturumda doğrulandı: alt-ajan künyeyi MCP'den yeniden çekti (documentId 99291800).
- Format referansı (`sablonlar/FORMAT-REFERANS-…`) gerçek müvekkil verisi içerdiği için git dışındadır;
  Mac'te bulunmaz. Anonim kopyası hazırlanırsa repoya o girer.
- `sure_hesapla` çıktısındaki güven alanları 2026-10-09'da bir örnekle doğrulandı; araç güncellenirse
  alan adları değişebilir. `sure_takvimi` satır biçimi ve `enjeksiyon_tara` çıkış kodları da aynı gün
  örnekle doğrulandı.
- Süre Kalkanı boş başlar. Mevcut aktif davaların açık süreleri kayda geçirilmeden pano bu davalar için
  süre gösteremez; pano bunu "kaydı olmayan davada süre yok sayılmaz" diye yazar. Açık süreler bir kez
  taranıp kayda geçirilmelidir.
- Masaüstü aracın `supur` komutu şemada girdisiz ve veri değiştiren komut olarak görünür; UYAP'ta neyi
  tetiklediği belgelenmemiştir. Bu yüzden yalnız pano komutunda ve oturumda bir kez çalışır.

## 8. Kapsam dışı

- `hukuk_skill` skill'lerinin yerel kopyalanması (sunucudan canlı okunur).
- DavaTek entegrasyonu, KVKK maskelemesinin geri getirilmesi, isbu-ofis.
- Perspektif ajanlarının içerik yeniden yazımı (yalnız rol adı ve atıf kuralı netleşti).

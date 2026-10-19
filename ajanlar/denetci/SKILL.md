# DENETCI — Bağımsız Çıktı Denetimi

**Rol:** `config/motor-haritasi.json` → `roller.DENETCI` (task: `self_review`)
**Spec:** `docs/superpowers/specs/2026-09-02-tek-motor-agnostik-toparlama-design.md` §3.3
**Politika v2:** `docs/superpowers/specs/2026-10-09-karma-mimari-yargipro-design.md`
**Denetim ölçütleri (kanonik liste):** `prompts/muhakeme/self_review.md`

## Neden var

Sistem tek motorla çalışır. Doktrinin bel kemiği, çıktıyı üreten gözden **başka bir
gözün** denetlemesidir. Bu bağımsızlık "başka sağlayıcı"dan değil **"başka bağlam"dan**
gelir: DENETCI, çıktının nasıl üretildiğini görmez.

Kökeni: 2026-09-02 tek motor kararı. İki motorlu dönemdeki iki kapının (üreticinin
self-review'ı ve bağımsız künye içerik teyidi) tek alt-ajanda birleşmiş hâlidir. Yargı PRO
bileşeni değildir; Yargı PRO MCP araçlarını doğrulama kaynağı olarak kullanır.

## Ne zaman çağrılır (Denetim Politikası v2 — 2026-10-09)

| Nokta | Denetlenen |
|---|---|
| **K1** | ASAMA 2 sonu: `02-Arastirma/arastirma-raporu.md` |
| **KS** | ASAMA 4 sonu: `02-Arastirma/stratejik-analiz.md` (4E sentezi + dilekçe yazım rehberi) |
| **K2** | Dışarı giden nihai belge + eşlik dosyası: ASAMA 7 `dilekce-v2.md` + `dilekce-v2-kaynak-dogrulama.md`; istinaf/temyiz, sözleşme, müvekkil bilgilendirme nihai metni + `<belge-adı>-kaynak-dogrulama.md`; ihtarname + `kontrol-notlari.md` (onaylı 2026-048 standardı) |
| **EK** | `02-Arastirma/kunye-havuzu-ek.md` — havuza sonradan giren künye, ilk kullanılmadan önce |
| Tek denetim | Danışma cevabı (`arastirma-cevabi.md`), blog |
| İsteğe bağlı | Avukatın `denetle: <dosya>` dediği dosya |

Ara çıktılar (briefing, usul raporu, 4A-4D, dilekçe v1, savunma simülasyonu) DENETCI'ye
**gönderilmez**; onların kapısı yapısal kontrol + `havuz_kontrol.py`'dir (AGENTS.md →
"DENETCI Kapısı ve Denetim Politikası"). Tam akışta toplam **3 çağrı** (K1 + KS + K2; havuz eki
açıldıysa ayrıca EK), her biri en çok 3 tur. HIZLI modda yalnız K2 çalışır; atıf içermeyen
belgede DENETCI çağrılmaz, `UYGULANMAZ` kaydı düşülür.

## Dürüst sınır

Aynı modelin kendi çıktısını denetlemesi, farklı sağlayıcının denetiminden
**zayıftır** — sistematik kör noktalar paylaşılır. Bu yüzden DENETCI *kanaate* değil
**ölçüme** dayanır. Yakalamayı taahhüt ettiği şey "kötü hukuk" değil:

- uydurma künye (documentId kaynakta yok / künye uyuşmuyor)
- bozuk veya uydurma alıntı (tırnak içi metin kaynakla birebir değil)
- aktarımın mahkemenin kendi gerekçesi gibi sunulması (kanıt katmanı hatası)
- eksik doktrin clause'u, eksik Kaynak Doğrulama Tablosu, eksik aleyhe beyanı
- bağlam kayması ve geçersiz çıkarım (9. clause — çıkarım geçerliliği)
- kamuya açık çıktıda KVKK sızıntısı (TC/IBAN) ve TBB yasak ifadeleri

**Hukuki isabet denetimi avukattadır.** Sistem taslak üretir.

## Girdi sözleşmesi

DENETCI'ye **yalnızca** şunlar verilir (`AGENTS.md` → "DENETİM ÇAĞRI BLOĞU"):

```
DENETİM TALEBİ
Dava-ID: <dava-id>
Denetim noktası: <K1 | KS | K2 | EK | tek | istek>
Denetlenecek dosya: <mutlak yol>
Eşlik dosyası: <mutlak yol — yalnız K2>
Protokol: ajanlar/denetci/SKILL.md
```

Üretim bağlamı, taslak sürümleri, "şunu şöyle yazdım çünkü..." açıklamaları
**verilmez**. Verilirse bağımsızlık kaybolur ve denetim geçersizdir. DENETCI bunları
**sormaz** da. Dava klasörü, denetlenen dosyanın yolundan türetilir.

## Denetim sırası (bağlayıcı)

1. **Deterministik kapılar** — önce makine, sonra muhakeme:
   ```bash
   python scripts/cikti_dogrula.py <dosya>                        # dava çıktısı (KVKK bulgusu = BİLGİ)
   python scripts/cikti_dogrula.py <belge.md> --eslik <eşlik.md>   # yalnız K2 (belge + eşlik çifti)
   python scripts/cikti_dogrula.py <dosya> --kamu --deny "<ad>"   # blog / mail / drawer (KVKK = HARD FAIL)
   python scripts/quality_gate.py asama2 <dava-klasoru>           # yalnız K1
   python scripts/havuz_kontrol.py <dosya> --havuz <dava-klasoru>/02-Arastirma/arastirma-raporu.md  # yalnız KS (+ varsa --havuz …/kunye-havuzu-ek.md)
   ```
   Blog çıktısında ek olarak `python scripts/blog_validator.py <blog.md>`.
   **K2 ek kuralı:** belgedeki her künye eşlik dosyasının Kaynak Doğrulama tablosunda yer
   almalıdır; tabloda olmayan künye KIRMIZI'dır. Alıntı kıyası belgedeki metin üzerinden yapılır.
2. **Künye içerik teyidi (Yargı PRO 11-8 yöntemi)** — çıktıdaki her `documentId` için
   **tek tek** (toplu "hepsi tamam" değerlendirmesi yasaktır):
   - **Varoluş:** `ictihat_getir(documentId)` ile kararı **yeniden çek**; künye (mahkeme,
     daire/kurul, tarih, esas/karar no) kaynakla uyuşuyor mu
   - **Destek:** tırnak içi alıntıyı tam metinle **karakter karakter** kıyasla; snippet,
     başlık veya özet destek kanıtı değildir
   - **Kanıt katmanı:** pasaj hüküm veren merciin **kendi gerekçesi** mi, aktarım mı (bozma
     ilamı, alt derece gerekçesi, taraf beyanı, karşı oy)? Aktarım, çıktıda aktarım olarak
     belirtilmişse (ör. "onanan BAM gerekçesinin aktarımı") doğrudur; mahkemenin kendi
     görüşü gibi sunulmuşsa bağlam kaymasıdır
   - **Sonuç:** kararın sonucu (onama / bozma / red) yalnız hüküm fıkrasından okunur
   - **Bağlam:** karar hangi fıkra/madde hakkında, çıktı onu hangi fıkraya uyguluyor
   - Mevzuat maddesi için `mevzuat_getir` ile metin ve yürürlük/mülga denetimi
   - Kurum kararı için `kurum_karari_getir`, Resmî Gazete atfı için `resmi_gazete_getir`;
     NotebookLM kaynaklı iddia için `notebook_query` ile aynı notebook'ta bağlam teyidi
3. **Doktrin clause sayımı** — `scripts/doktrin_contract.py` içindeki
   `REQUIRED_CLAUSE_TOKENS` tamamı ve Kaynak Doğrulama Tablosu grameri
4. **Çıkarım denetimi (9. clause)** — `bilgi-tabani/hukuki-yontem-kontrol-listesi.md`:
   yorum yöntemi belirtilmiş mi; bir fıkranın cevabı başka fıkraya taşınmış mı;
   sınırlı sayıda karardan "yerleşik uygulama" çıkarılmış mı; istisnai hükümde
   kıyas yapılmış mı
5. **Aleyhe beyanı** — "Aleyhe içtihat: VAR/YOK/ARANMADI" var mı; YOK deniyorsa
   raporda aleyhe arama sorgusu gerçekten görünüyor mu
6. **Üslup ve format** — `prompts/muhakeme/self_review.md` "Ton Sorunları" listesi
   (emoji, slogan tonu, yapay-zeka izi bağlaçlar, TBB yasak ifadeler); dilekçede büro
   format referansı (`sablonlar/FORMAT-REFERANS-…`)

Yargı PRO'nun 15-7-son-kontrol-denetimi ve 15-8-zorunlu-adim-denetimi **ayrıca
çalıştırılmaz** — tek denetim kapısı DENETCI'dir.

**Araç erişimi:** denetime başlamadan `ictihat_ara` ile erişim sınanır (MCP araçları ertelenmiş
yükleniyorsa önce ToolSearch ile yüklenir). MCP'ye erişim yoksa künye CLI ile yeniden çekilir
(`yargi bedesten search "<künye>"`, `yargi bedesten doc <documentId>`, `mevzuat search` /
`mevzuat article`) ve sonucun başına `mcp_fallback_used: true` yazılır. CLI de çalışmıyorsa
künye teyidi yapılmamıştır: karar **KIRMIZI — DENETLENEMEDİ** olur; el onayı doğrulama
sayılmaz. Bu durumda ORKESTRATOR aynı
DENETİM TALEBİ bloğunu, tüm araçlara erişen genel amaçlı sıfır bağlamlı alt-ajanla yeniden
çalıştırır (2026-10-09 testinde kayıtlı `denetci` adaptörü MCP'ye erişemedi, genel amaçlı
alt-ajan aynı protokolü araçlarla tamamladı).

## Karar

| Karar | Koşul | Sonuç |
|---|---|---|
| **KIRMIZI** | Doğrulanamayan künye ≥1 · uydurma/bozuk alıntı · kanıt katmanı kayması · eksik clause · eksik Kaynak tablosu · kamuya açık çıktıda KVKK sızıntısı · bağlam kayması · araç erişimi yok | Çıktı Drive'a **YAZILMAZ**; üretici rol revize eder |
| **SARI** | Format/üslup ihlali · eksik aleyhe beyanı · zayıf gerekçe · etiketsiz argüman | Düzeltilir, yeniden denetlenir |
| **YEŞİL** | Tüm kapılar temiz | Çıktı Drive'a yazılır |

En çok **3 tur**. Üçüncü turda YEŞİL yoksa avukata escalate edilir; çıktı yazılmaz.
4. tur yalnız avukatın açık talimatıyla açılır ve kayda geçer.

## Kayıt (izlenebilirlik)

Her tur sonunda ORKESTRATOR sonucu dava klasörünün akış kaydına işler:

```bash
python scripts/akis.py denetim "<dava-klasoru>" --nokta K1|KS|K2|EK|ISTEK --dosya <yol> --karar KIRMIZI|SARI|YESIL --bulgu <n>
```

Tur numarası kayıttan otomatik hesaplanır; 4. tur yalnız `--avukat-talimati` ile açılır. YEŞİL bir
denetim dizisini kapatır; dosya değişip yeniden denetlenirse (ör. havuz eki) sayaç 1'den başlar. Atıf
içermeyen dışarı giden belgede: `--nokta K2 --karar UYGULANMAZ --not "atıf yok"`. Akış kaydı
yalnız dava klasöründe tutulur; danışma ve blog hattı akış kaydı açmaz. Dava dosyasındaki
`denetle:` talebi `--nokta ISTEK` ile kaydedilir (geçişi durdurmaz); KIRMIZI veya SARI EK kaydı ise
`akis.py sonraki`yi durdurur.

DENETİM SONUCU bloğu:
- Rapor türü çıktıda (araştırma raporu, stratejik analiz, danışma cevabı) dosya sonuna eklenir.
- K2'de eşlik dosyasının (`<belge-adı>-kaynak-dogrulama.md`) sonuna eklenir. Dilekçe, ihtarname,
  sözleşme ve UDF'ye gidecek belgeye **eklenmez**.
- Blogda blog klasöründeki ayrı `denetim-sonucu.md` dosyasına yazılır; blog gövdesine girmez.

## Çıktı biçimi

```markdown
## DENETİM SONUCU: <KIRMIZI|SARI|YEŞİL>

**Denetlenen:** <dosya> (K2'de + <eşlik dosyası>) · **Nokta:** <K1|KS|K2|EK|tek|istek> · **Tur:** <n>
**Araç yolu:** MCP | CLI fallback (`mcp_fallback_used: true`)
**Deterministik kapılar:** cikti_dogrula <PASS/FAIL> · quality_gate <PASS/FAIL/uygulanmaz> · havuz_kontrol <PASS/FAIL/uygulanmaz>

### Künye teyidi
| documentId | Varoluş (künye) | Destek (alıntı) | Kanıt katmanı | Bağlam |
|---|---|---|---|---|

### Bulgular
1. [KIRMIZI|SARI] <bulgu> — <dosya:satır> — <ne yapılmalı>

### Gerekçe
<KIRMIZI/SARI ise neden; YEŞİL ise hangi kapıların geçtiği>
```

## Motor-bağımsız çağrılış

| Ortam | Yöntem |
|---|---|
| Alt-ajan mekanizması olan araç | Sıfır bağlamlı alt-ajan; yalnızca girdi sözleşmesi verilir |
| Alt-ajanı olmayan araç | İkinci oturum/sekme açılır; yalnızca dosya yolu + dava-id verilir |
| Hiçbiri yok | Avukat yeni sohbette `denetle: <dosya>` komutunu elle çalıştırır |

Hangi yol kullanıldıysa denetim çıktısının başına yazılır. Alt-ajan adaptörü Yargı PRO MCP
okuma araçlarını (`ictihat_getir`, `ictihat_ara`, `mevzuat_getir`, `mevzuat_ara`,
`mevzuat_icinde_ara`, `hukuk_skill`, `kurum_karari_getir`, `resmi_gazete_fihrist`,
`resmi_gazete_getir`) ve NotebookLM `notebook_query` aracını açıkça listeler; listede yoksa künye
teyidi MCP ile yapılamaz ve CLI yedeğine geçilir.

## Asla

- Üretim bağlamını istemek veya okumak (bağımsızlık kaybı)
- Künyeyi yeniden çekmeden "doğru görünüyor" demek
- Deterministik kapıları atlayıp doğrudan kanaat bildirmek
- KIRMIZI bulguya rağmen "genel olarak iyi" diye YEŞİL vermek — lehe yorum
  yasağı denetçi için de geçerlidir
- Denetim sonucunu dilekçe, ihtarname veya UDF'ye gidecek metne eklemek


## Büro üslup kuralı: müvekkil beyanı etiketi (2026-10-19)
Dışarı giden belgede (dilekçe, cevap, ihtarname) müvekkilin belgesiz olgularını "davacının beyanına göre" vb. kalıpla etiketlemeyi İSTEME; bu kalıbın belgede bulunması SARI üslup bulgusudur (`dilekce-yazim-kurallari.md` §4 BÜRO KURALI). Belge/beyan ayrımını eşlik dosyasında ara: belgesiz olgu eşlikte "MÜVEKKİL BEYANI" damgalı değilse SARI; belgede belgesiz olgu için ispat aracı (sunulacak / celp / tanık) gösterilmemişse SARI.

## Büro üslup kuralı: vekilin sesi (2026-10-19)
Dışarı giden belgede vekilin kendinden üçüncü şahıs olarak söz etmesi ("davacı vekili … başvurmuş") ve rapor/denetim dili ("bu olgu sabittir", "talebimiz bu biçimde kurulmuştur", "tarafımızca bilinmemektedir") SARI üslup bulgusudur (`dilekce-yazim-kurallari.md` §4 BÜRO KURALI 2026-10-19). Belgeye dürüstlük gereği konan cümleleri bu dile çevirmeyi isteme; aleyhe beyan savunma ağzıyla yazılır, kaynak/olgu ayrımı eşlikte tutulur.

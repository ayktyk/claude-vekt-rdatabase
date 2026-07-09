---
name: yargi-legal-research-guide
description: Türk hukuku veya mahkeme kararlarını Yargı MCP araçlarıyla araştırırken kullan (sürüm 2026-07-08b)
---

# Türk Hukuku Araştırma Kılavuzu (Yargı MCP)

Kılavuz sürümü: 2026-07-08b

Bu kılavuz, otonom bir yapay zekâ ajanı olan seni, Yargı MCP (Model Context Protocol) sunucusuyla Türk hukuku araştırma iş akışlarında akıcı kılar. Aşağıdaki 8 çekirdek araç (artı isteğe bağlı bir beta araç — Bölüm 6) mevzuatı, mahkeme içtihatlarını ve kurum kararlarını (özelge, BTK/Rekabet/KİK, Sayıştay, Uyuşmazlık, BDDK/KVKK/Sigorta Tahkim, Reklam Kurulu, KDK/Ombudsmanlık) çapraz sorgulayarak soruları doğru yanıtlamanı sağlar.

## 0. Bu Kılavuzu Bir Skill Olarak Kalıcılaştır (önce beni oku)

Bu kılavuz `.claude/skills/yargi-legal-research-guide/SKILL.md` olarak kaydedilmiştir (sürüm 2026-07-08b). `legal_research_guide` tool'unun açıklaması daha YENİ bir sürüm ilan ederse tool'u bir kez çağırıp bu dosyanın üzerine yaz; aynı ya da eskiyse tool'u ÇAĞIRMA, bu skill'i kullan.

## 1. Türk Hukuk Normlar Hiyerarşisi

Alt seviye bir norm, üst seviye bir normla çelişemez. **Sorun için en yüksek *işlevsel* kaynaktan başla.** Sıradan özel hukuk, vergi, iş, ceza ve idare hukuku sorularında önce ilgili Kanun'u veya düzenlemeyi belirle. Anayasa'yı; sorun temel haklar, normlar hiyerarşisi, iptal, anayasal yorum veya alt normların geçerliliği ile ilgili olduğunda kullan.

1. **Anayasa**: En üstün norm.
2. **Kanun**: TBMM tarafından çıkarılır. Çoğu sorgu için birincil başlangıç noktası.
3. **Kanun Hükmünde Kararname (KHK)**: Tarihsel olarak Bakanlar Kurulu'nca çıkarılmıştır; genellikle Kanun'a eşdeğerdir ama temel hakları düzenlemede sıkı sınırları vardır.
4. **Cumhurbaşkanlığı Kararnamesi (CBK)**: Cumhurbaşkanı'nca çıkarılır; Parlamento'nun yasama yaptığı alanlarda kesinlikle Kanun'a tabidir. Bir Kanun ile CBK çatışırsa, Kanun üstün gelir.
5. **Tüzük**: Daha eski araçlar (çoğunlukla kaldırılıyor veya değiştiriliyor).
6. **Yönetmelik**: Kanunların uygulanmasını düzenlemek için bakanlıklar, Cumhurbaşkanı veya kamu tüzel kişilerince çıkarılır.
7. **Tebliğ**: Ayrıntılı idari yönergeler ve teknik kurallar (vergi ve idare hukukunda çok yaygın).

**Milletlerarası Antlaşmalar (Anayasa m.90/5)** bu merdivende tek bir basamağa değil, merdivenin yanında konumlanır. Usulüne göre onaylanmış antlaşmalar Kanun hükmündedir ve anayasaya aykırılıkları ileri sürülemez; kritik olarak, **temel hak ve özgürlüklere** ilişkin bir antlaşma ile aynı konudaki bir Kanun çatışırsa, **antlaşma üstün gelir** (ör. AİHS). Bunlar bu 5 araçla ARANAMAZ — bir temel-hak çatışması söz konusuysa ilgisini bildir ve kullanıcıyı antlaşma metnine ve Anayasa Mahkemesi (AYM) içtihadına yönlendir.

Mahkeme İçtihatları normlar hiyerarşisinde bir basamak DEĞİLDİR. *Yargıtay* (özel hukuk/ceza) ve *Danıştay* (idari) kararları, birincil mevzuat değil, ikna edici yorumdur. İstisnalar: bağlayıcı *İçtihadı Birleştirme Kararları* ve *Anayasa Mahkemesi* iptal/bireysel-başvuru kararları norm-seviyesinde etki taşır. **Araç uyarısı**: İçtihadı Birleştirme kararları `ictihat_ara`'nın `court_types` değerleri arasında DEĞİLDİR; AYM kararları için ayrı araç `aym_ictihat_ara` vardır.

## 2. Araştırma Araçlarına Genel Bakış

Sunucu dört alanda 8 çekirdek araç sunar: **Mevzuat**, **Mahkeme Kararları (İçtihat)**, **Anayasa Mahkemesi** ve **Kurum Kararları**.

**Mevzuat Araçları:**
*   `mevzuat_ara`: Tüm mevzuat veritabanında (~27 bin belge) global arama. Kanunların, yönetmeliklerin ve tebliğlerin metadata'sını ve iç kimliklerini bulur.
*   `mevzuat_getir`: Çok-amaçlı getirme aracı. Bir belgenin tam metnini, belirli bir *Madde*'sini, *Gerekçe*'sini veya yapısal içindekiler tablosunu (outline) getirir.
*   `mevzuat_icinde_ara`: Tek bir mevzuat belgesi *içinde* odaklı, yerel Boole araması yapar. Medeni Kanun gibi devasa kodlarda gezinmek için son derece güçlüdür.

**Mahkeme Kararları Araçları:**
*   `ictihat_ara`: 5 mahkeme türünde (Yargıtay, Danıştay, yerel, istinaf, KYB) milyonlarca kararda global Solr araması.
*   `aym_ictihat_ara`: Anayasa Mahkemesi kararlarında arama — varsayılan tüm türler ya da filtreli: `norm_denetimi`, `bireysel_basvuru`, `siyasi_parti`, `yuce_divan`.
*   `ictihat_getir`: HERHANGİ bir mahkeme kararının tam metnini getirir — Bedesten `documentId`'leri ve AYM `document_id`'leri (`anayasa:<guid>`) dâhil. 40.000 karakteri aşan belgeler sayfalanır; `page_number` ile gez.

**Kurum Kararları Araçları:**
*   `kurum_karari_ara`: `kurum` parametresi ile 12 kurum üzerinde birleşik arama — `gib` (GİB özelgeleri), `btk` (BTK kurul kararları), `rekabet` (Rekabet Kurumu kararları), `uyusmazlik` (Uyuşmazlık Mahkemesi kararları), `kik` (KİK kurul kararları), `sayistay` (Sayıştay kararları), `bddk` (BDDK bankacılık kurul kararları — dış arama), `kvkk` (KVKK kişisel veri kararları — dış arama), `sigorta` (Sigorta Tahkim hakem kararları — dış arama), `reklam` (Reklam Kurulu basın bültenleri — dış arama; `document_id` = `reklam:<toplantı no>`), `kdk` (KDK/Ombudsmanlık tavsiye/ret kararları), `spk` (SPK ilke kararları + rehberler + bültenler). Filtreler kuruma özeldir (ör. `gib`: `ozelge_no`/`kanun_no`/tarih; `kik`: `karar_tipi`=uyusmazlik/duzenleyici/mahkeme; `sayistay`: genel_kurul/temyiz/daire; `kdk`: tavsiye/ret/..., `basvuru_no`, `idare_adi`, `konu`; `spk`: `arama_alani:"icerik"` PDF tam metin) — kuruma ait olmayan filtre `invalid_params` döner. ⚠️ `btk`/`rekabet`/`uyusmazlik` sonuçları belge içeriği taşımaz (PDF): alakayı filtrelerle daralt, metni yalnız gerekli kararlar için `kurum_karari_getir` ile al (OCR maliyetli). ⚠️ `uyusmazlik` yalnız 1. sayfayı döndürür. ⚠️ `bddk`/`kvkk`/`sigorta`/`reklam` HARİCİ arama (Tavily): `not_configured` dönebilir, tek sayfa, kelimeler üçüncü tarafa gider — müvekkil adı/kişi-tanımlayıcı YAZMA. Tek Sigorta dergisi içinde `sigorta_dergi_icinde_ara`; tek Reklam bülteni içinde `reklam_bulten_icinde_ara`; tek SPK bülteni içinde `spk_icinde_ara`.
*   `kurum_karari_getir`: `document_id` ile tam karar metni Markdown (`gib:...`, `kvkk:...` vb.). 40.000 karakter sayfalaması.

## 3. Kritik Tuzaklar ve Sözdizimsel Kapanlar

*   **Sorgu Hijyeni — Anahtar Kelime Çıkar, Soruyu Asla Yapıştırma**: Kullanıcının tam cümlesini bir `phrase`/`query`/`mevzuat_adi` parametresine BOŞALTMA. Uzun sorgu HER ZAMAN yanlıştır: mevzuat araçları kelimeleri AND'ler (uzun soru → sıfır sonuç), `ictihat_ara` OR'lar (uzun soru → yüz binlerce alâkasız isabet). Hukuki sorunu 2–5 terime damıt. Örnek: `+"etkin pişmanlık" +"nitelikli dolandırıcılık"`. Tek dev arama yerine birkaç dar arama.
*   **AYM Araması Üçüncü, Operatörsüz Bir Lehçedir**: `aym_ictihat_ara.query` DÜZ Türkçe kelime alır — operatör YOK. Her ek kelime sonucu DARALTIR. Tarihler ISO `YYYY-MM-DD`. Norm-denetimi `esas_no`/`karar_no`, bireysel başvuru `basvuru_no` — türe özel filtreler.
*   **Türkçe Diakritikleri Koru**: ç, ş, ğ, ı, İ, ö, ü — `karari` değil `kararı`. ASCII'ye çevirme.
*   **Solr ile Boole Sözdizimi Ayrımı**:
    *   `mevzuat_ara.phrase` içinde **AND/OR/NOT sözcükleri PARSER'I BOZAR**. Boşluk = AND. `+zorunlu`, `-dışla`, `"tam ifade"`, `kirac*` joker, `tazmin~` fuzzy, `"vergi ceza"~5` yakınlık, `istisna^2` boost.
    *   `mevzuat_icinde_ara.query` yerel Boole — operatörler BÜYÜK harf ZORUNLU: `AND`, `OR`, `NOT`, `"tam ifade"`, `()`. Kelime KÖKÜ kullan (`tazminat`, `tazminatı` değil).
    *   `ictihat_ara.phrase` (Bedesten Solr): **çıplak terimler arası boşluk = OR (AND değil!)**. Birden çok kavramı zorunlu kılmak için HER birini `+` ile işaretle veya büyük harf `AND`: `+kamulaştırma +"bedel tespiti"`. `-dışla`, `"tam ifade"`, `()` çalışır; joker/fuzzy/yakınlık YOK.
*   **Tarih Anlamları**: İki araç da ISO `YYYY-MM-DD`. `mevzuat_ara` → **Resmî Gazete yayım tarihi** (yürürlük DEĞİL — Yürürlük maddesini oku!); `ictihat_ara` → **karar tarihi**.
*   **Kimlik Kökeni**: Resmî kanun numarası = `mevzuat_no` (ör. 6698). İç işlem için önce `mevzuat_id`'ye çözülür (ör. "104383"). `mevzuat_icinde_ara`/`mevzuat_getir`'e asla `mevzuat_no` geçme. **`id_type`'ı kimliğin geldiği ALAN ADIYLA eşle, hane sayısıyla asla.** Yanlış kombinasyon `id_type_mismatch` döner ama `actual_id_type` verilir — onunla tekrar dene.
*   **`mevzuat_no`'yu Asla Uydurma**: Emin değilsen önce `mevzuat_adi` ile ara.
*   **Sayfalama Asimetrisi**: `ictihat_ara` → **`pageNumber`** (camelCase, max 100/sayfa); `mevzuat_ara` → **`page`** (max 20); `mevzuat_icinde_ara` → `page` (max 50); `kurum_karari_ara` → `page` + `results_per_page` (max 50). `ictihat_ara`'ya `page` göndermek sessizce yok sayılır.
*   **Varsayılan Mahkeme Türleri**: `ictihat_ara` varsayılanı `['YARGITAYKARARI', 'DANISTAYKARAR']`. İstinaf için `ISTINAFHUKUK`'u AÇIKÇA geç.
*   **Alâka vs Tarih Sıralaması**: `phrase` varsa varsayılan ALÂKA. Kronoloji için `sort_by: "date"` açıkça geç.
*   **En Az Bir Kriter Zorunlu (`ictihat_ara`)**: `phrase`, docket (`esas_no`/`karar_no`), `birimAdi` ya da tarih sınırından en az biri; yalnız `court_types` yetmez — arama reddedilir.
*   **İki Kademeli Snippet**: cache'li sonuçlar ücretsiz `snippet` taşır. `include_snippets: true` → 5 taneye kadar cache-siz üst isabet KOTASIZ getirilir. Triyajda aç, geniş taramada kapat.
*   **`date_suspect` Bayrağı**: işaretli tarihe güvenme — belgeyi getir, gerçek tarihi metinden oku.
*   **Docket Hedefleme**: `esas_no`/`karar_no` = `YIL/SIRA` (ör. `2025/13348`). Numara varsa phrase yerine bunlarla + `court_types` (+`birimAdi`) ile kesin arama.
*   **"Outline Yok" Tuzağı**: TEBLIGLER, CB_KARAR, CB_GENELGE çoğu zaman `has_outline: false` → tam metne düş veya `mevzuat_icinde_ara` kullan (PDF türleri `pdf_full` katmanına yönlenir).
*   **PDF OCR**: CB genelge/kararları PDF; ilk getirme yavaş (2-3 sn, Mistral OCR).
*   **Gerekçe Evrensel Değildir**: `gerekce_id` yanıtın içinde yoksa gerekçe YOK — id uydurma (örn. KVKK 6698'in gerekçesi bu kanalda yok).
*   **Mülga Kanunlar**: Tarihsel araştırmada `mevzuat_tur_list: ["MULGA"]`. **Yürürlükten kaldırma önceki içtihadı otomatik geçersiz kılmaz** — geçici maddeler + (cezada) lex mitior (TCK 5237 m.7) kontrol edilir; özel/idari işlerde varsayılan geriye yürümezlik.
*   **`madde_no` Kısayolu**: Madde numarası biliniyorsa outline'ı atla: `mevzuat_getir({id:"<mevzuat_id>", id_type:"madde", madde_no:11})` — tek çağrı (yalnız normal numaralı maddeler; EK/GEÇİCİ için outline).
*   **Chunk'lı Tam Metin**: 50KB üstü mevzuat otomatik parçalanır — ilk çağrı `chunk: {index, total}` döner, kalanı `chunk: 2..total` ile.

## 4. Strateji Sezgileri

*   **Bilindiğinde `mevzuat_no`'yu tercih et** (TTK→6102, KVKK→6698, TBK→6098, TCK→5237, VUK→213, KDV→3065).
*   **Genişten başla, sonra daralt**: önce Kanun, sonra Madde, sonra Yönetmelik/Tebliğ.
*   **Outline'ları bağlam için kullan**; devasa kanunlarda körlemesine arama kaotiktir.
*   **`mevzuat_icinde_ara`'yı acımasızca kullan** — 50.000 kelimelik kanunu getirme, hedef 3 maddeyi yalıt.
*   **Daireyi oku, otoriteyi tart (`birimAdi`)**: İBK (bağlayıcı) > HGK/CGK > tek Daire (H1-H23, C1-C23, D1-D17). Çatışmada üst kurulu tercih et.
*   **Güncelliği doğrula**: içtihadı uygulamadan önce atıf maddesinin güncel metni + değişiklik notları + yürürlük + geçici maddeler.

## 5. Uçtan Uca Desenler (özet)

1. **Kanun zinciri**: `mevzuat_ara(mevzuat_no)` → `mevzuat_getir(outline)` → `mevzuat_getir(madde)` → uygulayıcı Tebliğ için `mevzuat_ara(phrase, TEBLIGLER)`.
2. **İçtihat**: `ictihat_ara(+kavram1 +kavram2)` → snippet triyajı → `ictihat_getir(documentId)` (yalnız kazananlar).
3. **Varyant OR'lama**: Türk hukuk üslubu değişkendir — `("ihtiyaç sebebiyle tahliye" OR "ihtiyaç nedeniyle tahliye" OR gereksinim)`.
4. **Mülga karşılaştırma**: `mevzuat_ara(no, ["MULGA"])` + güncel kanun; `mevzuat_icinde_ara` ile eş maddeleri karşılaştır. Eski metinlerde Osmanlıca yazımlar (müruru zaman) OR'lanır.
5. **Gerekçe**: yanıtta `gerekce_id` varsa `mevzuat_getir(id_type="gerekce")`.
6. **Mahkemeler-arası**: aynı phrase, farklı `court_types` (YARGITAYKARARI vs ISTINAFHUKUK) — elmayla elma.
7. **İdari zincir**: Kanun → Yönetmelik → `ictihat_ara(DANISTAYKARAR, iptal/"yetki aşımı")`. Yalnız ülke-çapı düzenlemeler ilk derecede Danıştay'da; yerel düzenleme İdare Mahkemesi'nde başlar.
8. **Kota-tasarrufu triyaj**: `include_snippets: true` + alâka sıralı → snippet oku → yalnız 1-2 kazananı getir.
9. **AYM**: `aym_ictihat_ara(decision_type, düz kelimeler)` → `ictihat_getir("anayasa:<guid>")`. Uzun kararlarda `page_number` ile gez. Eski stil `/ND/2024/202`, `/BB/2021/30620` de çalışır.
10. **Kurum**: `kurum_karari_ara(kurum, filtreler)` → `kurum_karari_getir(document_id)`. Dış-arama kurumlarına kişi-tanımlayıcı yazma. Reklam/Sigorta/SPK iki kademeli: önce bülten/dergi bul, sonra `*_icinde_ara`.

## 6. Kavram Araması — `semantik_ictihat_ara` (beta, hesapta VAR)

*   **Ne yapar**: doğal-dil sorguyu gömer, kavramsal benzer kararları döner — hukuki FİKİR için içtihat gerektiğinde ve tam ifade bilinmiyorsa.
*   **Çıktı**: `documentId` (doğrudan `ictihat_getir` ile kullanılır) + `related_quotes` + daire/dosya metadata.
*   ⚠️ **Külliyat ~1 yıl eski, GÜNCELLENMEZ** — son 12 ayın kararı YOK. Güncel içtihat için ASLA tek başına güvenme; keşif aracı olarak kullan, `ictihat_ara` ile çapraz-kontrol et.
*   **Soğuk başlangıç**: ilk sorgu ~20 sn sürebilir.
*   **İş akışı**: semantik sorgu → `related_quotes` terminolojisini topla → o terimlerle `ictihat_ara` çalıştır (taze, atıflanabilir kararlar).
*   Sorgu doğal-dil odaklı Türkçe cümle: `kira sözleşmesinde tahliye taahhüdünün geçerlilik şartları` ✅; `+tahliye +taahhüt` ❌ (operatör çalışmaz); tek kelime ❌.

## Son Öğütler

1. `mevzuat_icinde_ara` kullanabiliyorken 100 sayfalık PDF okuma.
2. Kanun numarası uydurma — emin değilsen `mevzuat_adi` ile ara.
3. Cevap genellikle geniş bir *Kanun* + çok özel bir *Tebliğ* + yorumlayan *Yargıtay* kararının kesişimindedir — üçünü birleştir.
4. Kapsamlı çok-kollu araştırma için `yargi-agentic-deep-research` skill'ine bak (ayrıştır → paralel kollar → atıflı sentez).

# Yargı PRO Skill Tetikleme Haritası

Son güncelleme: 2026-09-25
Kaynak: Yargı PRO `hukuk_skill` kütüphanesi (içerik sürümü 3ce05e48, 2026-09-23, 107 skill)

Bu dosya Yargı PRO skill'lerinin **hangi durumda, hangi sırayla ve hangi ajan
tarafından** çağrılacağını tanımlar. Skill metinleri bu repoya KOPYALANMAZ;
her zaman MCP üzerinden taze çekilir:

```
mcp__claude_ai_YargiMCP__hukuk_skill  skill: "<ad>"            → tam metin
mcp__claude_ai_YargiMCP__hukuk_skill  skill: "<ad>" dosya: "<yol>" → referans dosyası
```

Neden kopyalanmıyor: Yargı PRO içeriği sürümleniyor; kopya bir ay sonra
eskir ve iki farklı kural seti oluşur. Harita repoda, içerik MCP'de yaşar.

## Genel kurallar

1. Skill çağrısı **cevap üretmeden ÖNCE** yapılır; çağrılan skill'in talimatı
   0-Halüsinasyon Doktrini ile birlikte uygulanır. Çelişkide doktrin kazanır
   (doktrin daha sert olduğu için pratikte çelişki çıkmaz).
2. Skill metni avukata aynen aktarılmaz; talimat olarak uygulanır.
3. `disable-model-invocation: true` olan skill'ler (15-2, 15-9) yalnız avukat
   açıkça isterse çağrılır.
4. Script gerektiren skill'lerde kabuk komutu: `npx -y yargi-skill <script> [args]`.
   Oturum 2026-09-25'te açık (büro hesabı). Mevcut script'ler:
   `sure_hesapla`, `sure_takvimi`, `parametre` (tarihli oran/tutar),
   `hukuki_hesap`, `icra_hesap`, `tdk_denetim` (yazım/imla), `enjeksiyon_tara`
   (PDF ve görsel desteklemez), `artik_veri_tara`, `evrak_oku`, `udf_araci`,
   `aym_form_doldur`, `belge_uret`. Oturum düşerse `npx -y yargi-skill login`.
   Script çalışmazsa skill'in manuel protokolü uygulanır, çıktıya
   `[YARGIPRO SCRIPT ÇALIŞMADI]` notu düşülür.
   Not: `parametre` ve `hukuki_hesap`, usul raporundaki harç ve işçilik
   hesaplarında `14-2` → `14-1` zinciriyle birlikte kullanılır; `tdk_denetim`
   revizyon Kapı 4'te `19-2` ile birlikte koşar.
5. Antigravity (sağ panel) MCP çağıramaz. Bu haritadaki kapılar **terminal
   Claude'da** çalışır: Antigravity çıktısı geldikten sonra ("BATCH X bitti")
   ilgili kapı Claude tarafından koşturulur.
6. Her çağrı çıktının sonundaki Kaynak Doğrulama Tablosuna şu satırla işlenir:
   `Yargı PRO skill: <ad> — uygulandı / uygulanamadı (neden)`.

## A. Tekil hukuki soru (sohbet içi, dava akışı dışı)

Tetikleyici: avukat hukuki bir soru sorar ("X davası nasıl açılır", "Yargıtay ne
diyor", "zamanaşımı ne kadar", "bu tebligat geçerli mi", "kaç günüm var" vb.).
Selamlama, kod, sistem işi tetiklemez.

Sıra:

| Adım | Ne zaman | Skill | Amaç |
|---|---|---|---|
| 1 | Her soruda | `10-7-uyusmazlik-tespiti` | Yargı kolu, aşama, rol, ihtiyaç türü (analiz / emsal / süre / hesap / belge) |
| 2 | Emsal/içtihat gerekiyorsa | `11-1-emsal-karar-bulma` → `11-2-derin-emsal-taramasi` | Bağlam + 5 alt sorgu + 1 red-team sorgu, semantik + lexical çift kanal |
| 3 | Aday karar bulunduysa | `11-3-karar-tam-metni` → `11-10-emsal-karar-okumasi` | Tam metin, ratio/obiter ayrımı, dosyayla ayırt edici noktalar |
| 4 | Mevzuat dayanağı gerekiyorsa | `11-5-kanun-maddesi-bulma` | Madde metni + yürürlük etiketi (yürürlükte / değişik / mülga + tarih) |
| 5 | Emsal kullanılacaksa | `11-4-emsal-guncellik-denetimi` | Taşıyıcı madde yürürlüğü; GÜNCEL / numara değişmiş / DEĞİŞMİŞ / MÜLGA etiketi |
| 6 | Cevapta künye veya madde numarası varsa | `11-8-atif-dogrulama` | İki eksen: varoluş + destek; kanıt katmanı; snippet yasağı |
| 7 | Süre sorusu | `12-2-tebligat-denetimi` → `12-1-sure-hesaplama` | Tebliğ geçerliliği, sonra son gün + adli tatil rejimi |
| 8 | Tarih, oran, harç, tavan gibi güncel veri | `14-2-guncel-oran-teyidi` → `14-1-hukuki-hesaplama` | Kaynaklı oran teyidi, sonra hesap |
| 9 | Strateji sorusu ("hakkımız ne", "kazanır mıyız") | `10-5-zayif-nokta-analizi` → `10-10-karsi-arguman-dongusu` | Aleyhe hususlar + çürütme matrisi; çürütülemeyen RİSK yazılır |
| 10 | Islah / talep artırımı | `19-3-islah-rehberi` | HMK 176-183, 109/4, eski 107 ayrımı |
| 11 | Arabuluculuk şartı | `15-5-arabuluculuk-sarti-denetimi` | Zorunluluk, son tutanak, dava açılabilirlik |
| 12 | Dış belge okunacaksa (karşı taraf dilekçesi, ek) | `15-2-belge-guvenlik-taramasi` (avukat açıkça isterse) | Gizli talimat taraması |

Kısa kavram sorusu (örn. "ayıp nedir") için 1. adım yeterlidir; somut dayanak
istendiği an 2-6 zorunludur.

## B. Dava akışı (7 AŞAMA) içinde ajan bazlı kapılar

| AŞAMA | Ajan | Zorunlu skill(ler) | Nerede |
|---|---|---|---|
| 1 Hazırlık | Director | `10-7-uyusmazlik-tespiti`, `15-3-vekalet-yetki-denetimi` | Briefing sırasında |
| 2B Yargı | Araştırmacı | `11-2-derin-emsal-taramasi` (5+1 red-team), `11-3-karar-tam-metni`, `11-10-emsal-karar-okumasi` | Derin Arama Protokolü ile birlikte |
| 2C Mevzuat | Araştırmacı | `11-5-kanun-maddesi-bulma`, `11-4-emsal-guncellik-denetimi` | Mülga eleme yerine dört etiketli güncellik denetimi |
| 2 sonu (Kapı 1) | Araştırmacı | `11-8-atif-dogrulama` | Rapordaki her künye |
| 3 Usul | Usul Uzmanı (Claude ön hazırlık) | `12-2-tebligat-denetimi`, `12-1-sure-hesaplama`, `15-5-arabuluculuk-sarti-denetimi`, `15-3-vekalet-yetki-denetimi` | Kritik Süreler tablosu bu çıktıdan doldurulur |
| 4 Stratejik | Perspektif ajanları / Director | `10-5-zayif-nokta-analizi`, `13-2-dava-stratejisi` | 4B Davalı ve 4E Sentez girdisi |
| 5 Dilekçe v1 (Claude ön hazırlık) | Belge Yazarı | `13-3-dilekce-turu-secimi`, `13-4-dilekce-iskeleti`, `13-5-dilekce-paragraf-plani`, `19-2-yazim-kurallari-rehberi` | Blueprint Antigravity BATCH 3 girdisine eklenir |
| 5 sonu | Belge Yazarı | `10-6-vakia-tutarlilik-denetimi` (ardıl dilekçelerde), `11-8-atif-dogrulama` | v1 geldikten sonra Claude koşturur |
| 6 Savunma | Savunma Simülatörü | `10-5-zayif-nokta-analizi` (hedef=kendi), `10-10-karsi-arguman-dongusu` | Çürütme matrisi, 3 tur sınırı |
| 7 Revizyon (Kapı 4) | Revizyon Ajanı | `11-8-atif-dogrulama`, `11-4-emsal-guncellik-denetimi`, `10-6-vakia-tutarlilik-denetimi`, `15-6-dilekce-bicim-denetimi`, `15-7-son-kontrol-denetimi` | v2 Drive'a yazılmadan önce |
| İstinaf / temyiz | Belge Yazarı alt-mod | `2-6-hukuk-istinaf-temyiz` (+ kol karşılığı), `12-1-sure-hesaplama` | Süre önce hesaplanır |
| Duruşma | (yeni) | `16-1-durusma-hazirligi`, `16-3-tanik-sorulari`, `16-2-durusma-zapti-denetimi` | 05-Durusma-Notlari |

## C. Kol seçimi (dava türüne göre ek aile)

Proje varsayılanı HMK koludur. Aşağıdaki türlerde ilgili kol ailesi de çağrılır:

| Dava türü | Analiz | Emsal | Dilekçe ailesi |
|---|---|---|---|
| Hukuk (iş, kira, tüketici, tazminat, aile) | `2-1-hukuk-dosya-analizi` | `2-2-hukuk-emsal-bulma` | `2-3` … `2-7` |
| İcra / iflas | `3-1-icra-dosya-analizi` | `3-2-icra-emsal-bulma` | `3-3` … `3-9` |
| Ceza | `1-1-ceza-dosya-analizi` | `1-2-ceza-emsal-bulma` | `1-3` … `1-8` |
| İdari / vergi | `4-1-idare-dosya-analizi` | `4-2-idare-emsal-bulma` | `4-3` … `4-6` |
| AYM bireysel başvuru | `5-1-aym-dosya-analizi` | `5-2-aym-emsal-bulma` | `5-3` … `5-5` |
| AİHM | `6-1-aihm-dosya-analizi` | `6-2-aihm-emsal-bulma` | `6-3` … `6-5` |

## D. Bilinçli olarak KULLANILMAYAN skill'ler

Bu projede karşılığı zaten var; çift zincir oluşturmamak için çağrılmaz:

- `0-1-is-yonlendirici`, `0-2-calisma-derinligi-secimi`, `0-3-dosya-baglami-tanima` → Director Agent
- `18-1` … `18-7` büro hafızası ailesi → MemPalace
- `10-3-canli-dosya-ozeti`, `10-8-dosyalar-arasi-arastirma`, `18-5`, `18-6` → Drive + Briefing + isbu-ofis
- `13-6-dilekce-yazimi` tek motor → Antigravity BATCH 3 akışı (blueprint girdisi alınır, motor alınmaz)
- `15-9-gonderim-onayi` → UYAP yüklemesi manuel, avukat yapar
- `15-1-kisisel-veri-maskeleme` → `scripts/maske.py` (KVKK Seviye 2). Skill'in "maskeleme PASS" ön koşulu bizde maske.py çıktısıyla karşılanmış sayılır.

## E. Bizim doktrinle uyum notları

- Yargı PRO `VERIFIED` = varoluş + destek + tam metin. Bizim "Bedesten documentId
  ile doğrulandı" ifadesi tek başına varoluştur. Dilekçeye giren her künye için
  destek ekseni de doldurulur; doldurulmamışsa "DOĞRULANMAMIŞ" damgası kalır.
- Bizim mülga eleme protokolü "eler"; Yargı PRO "etiketler" (GÜNCEL / numara
  değişmiş / DEĞİŞMİŞ-AŞILMIŞ OLABİLİR / MÜLGA + şerh). 2026-09-25'ten itibaren
  etiketli yaklaşım esastır: madde numarası değişikliği MÜLGA sayılmaz.
- Çürütülemeyen aleyhe husus rapordan düşürülmez, RİSK olarak yazılır ve
  dilekçede ayrı başlık açılmadan ilgili gövdeye işlenir.

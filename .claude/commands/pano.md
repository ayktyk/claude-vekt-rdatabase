---
description: "Takip hattı: günlük pano, dosya portföyü, dosyalar arası arama ve mevzuat değişikliği taraması"
---
# /pano — Günlük Pano ve Portföy

`$ARGUMENTS` = `bugun` (varsayılan) · `portfoy` · `portfoy ara: <konu>` · `mevzuat degisti: <kanun>`.

Kural kaynağı: `AGENTS.md` → "Beceri Haritası ve Büro İş Hatları" (`takip` hattı, "Takip araçları",
"Yargı PRO masaüstü komut satırı"). Beceri listesi: `python scripts/beceri_haritasi.py hat takip`.
Her becerinin yalnız yöntem bölümü `hukuk_skill` ile çekilir; zincir yönetimi uygulanmaz.

Masaüstü araç: yol `python scripts/paths.py yargipro-cli`; Windows'ta `cmd //c "<yol>" <komut>`. Araç yalnız
Yargı PRO uygulaması açıkken çalışır. Çalışmazsa UYAP bölümleri "kontrol edilemedi" diye yazılır.

## bugun (18-6 günlük pano)

1. `python scripts/uyap_takip.py oku --supur`: UYAP taraması ve canlı okuma günde bir kez yapılır, sonuç
   `Aktif Davalar/00-uyap-onbellek.json`'a yazılır. Aynı gün ikinci çağrı önbelleği kullanır. Uygulama kapalıysa veya
   UYAP sınırı alınırsa okunamayan bölüm "kontrol edilemedi" diye yazılır; "yeni evrak yok" denmez.
2. `python scripts/uyap_takip.py rapor`: Dikkat gerektiren UYAP olayları (gerekçeli karar, duruşma günü, kanun yolu,
   bilirkişi, tensip, vekil değişikliği), yaklaşan duruşmalar, uygulamada olmayan hareketli dosyalar. CMK dosyaları
   da raporda yer alır ve işaretlenir.
3. Büyük eşitleme sürüyorsa (`python scripts/uyap_esitle.py plan` kalan aday gösteriyorsa) günlük kota arka planda
   `python scripts/uyap_esitle.py calistir` ile işlenir (avukat talimatı 2026-10-09; yavaş mod). `plan` kilit
   gösteriyorsa (UYAP doğrulaması) eşitleme başlatılmaz; avukata uygulamadaki doğrulama penceresi hatırlatılır. Bitince
   `python scripts/excel_takip.py guncelle` iş takip Excel'ini yeniler.
4. Süreler: `python scripts/sure_kalkani.py liste --gun 30`.
5. Pano sırası:
   - Bugün ve yarın: kesin son günler (T-0, T-1) ve geçmiş ama arşivlenmemiş satırlar.
   - Bu hafta: duruşmalar ve T-7 eşiğindeki kesin son günler.
   - Yeni evrak ve hareketler: `00-UYAP-ESLESME-TABLOSU.md` ile dava-id'ye bağlanır; eşleşmeyen UYAP dosyası
     ayrı listelenir.
   - Koşullu süreler: "kesin son gün değil" etiketiyle; başlangıcı bağlanacak (12-2 / 12-3) satırlar.
   - Önerilen işler: yeni evrak gelen davada `/davayi-cek`, süre doğuran evrakta Kalkan kaydı, yaklaşan duruşmada
     `/durusma`. Hiçbiri kendiliğinden başlatılmaz.
6. Her satırın kaynağı yazılır (`KALKAN#<satir-id>`, araç komutu veya dosya). Pano dosyaya yazılmaz.

## portfoy (18-5)

1. Kaynaklar: `Aktif Davalar` klasörleri, her davanın `00-AKIS.md` kaydı, varsa `00-Dava-Ozeti.md`, Süre Kalkanı,
   masaüstü araçtan `dosyalarim` ve `00-UYAP-ESLESME-TABLOSU.md`.
2. Çıktı `Aktif Davalar/00-PORTFOY.md`. Sütunlar: dava-id, konu (klasör adı), kol, mahkeme ve esas, aktif iş ve aşama,
   en yakın süre (`KALKAN#…`; tarih yeniden yazılmaz), son evrak tarihi, bekleyen karar veya evrak. UYAP'ta olup
   dava klasörüyle eşleşmeyen dosyalar ayrı bölümde.
3. İlk satır SENTINEL; sonunda künyesiz kaynak tablosu ve `Aleyhe içtihat: ARANMADI` satırı.
   Kapı: `python scripts/cikti_dogrula.py <dosya>`.

## portfoy ara: <konu> (10-8)

Aktif dava klasörlerinde konu, karşı taraf, mahkeme veya hukuki soru aranır. Sonuç sohbette dava-id ve dosya
yoluyla verilir; bir davadan başka davaya bilgi taşınırken bağlam korunur (doktrin madde 3).

## mevzuat degisti: <kanun> (11-9)

1. Değişiklik metni `mevzuat_getir` / `resmi_gazete_getir` ile çekilir; yürürlük ve geçiş hükmü madde metninden
   okunur. Kaynaksız değişiklik varsayılmaz.
2. Etkilenen aktif davalar briefing, dava özeti ve akış kaydından çıkarılır; her dava için etki ve öneri yazılır.
3. Çıktı sohbette; avukat isterse `Research/` altına SENTINEL ve kaynak tablosuyla kaydedilir
   (`python scripts/cikti_dogrula.py <dosya>`).

Takip hattı yedi aşamayı başlatmaz ve dilekçe yazmaz. İndirme yalnız `/davayi-cek` ile veya avukatın büyük
eşitleme talimatı kapsamında yavaş modda yapılır. KEP tebligatları UYAP'ta yoktur; kanalı avukatla belirlenir.

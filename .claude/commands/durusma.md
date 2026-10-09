---
description: "Duruşma hazırlığı (celse kartı, tanık soruları, delil planı) ve duruşma sonrası zabıt denetimi; büro iş hattı"
---
# /durusma — Duruşma Hazırlığı ve Zabıt Denetimi

`$ARGUMENTS` = dava-id ve duruşma tarihi (ör. `2026-016 14.10.2026`) ya da `zabit <dava-id>`.

Kural kaynağı: `AGENTS.md` → "Beceri Haritası ve Büro İş Hatları" (`durusma`, `zabit` hatları).
Beceri listesi: `python scripts/beceri_haritasi.py hat durusma --kol <kol>` · `hat zabit`.
Her becerinin yalnız yöntem bölümü `hukuk_skill` ile çekilir; zincir yönetimi uygulanmaz.

## Duruşma hazırlığı (`durusma` hattı)

1. Dava klasörü: `python scripts/paths.py dava <dava-id>`; briefing, dava özeti, son evrak ve varsa önceki
   celse kartı okunur. Yeni karşı taraf evrakı varsa önce 15-2 güvenlik taraması.
2. 16-1-durusma-hazirligi: gündem, taraf ve tanık listesi, riskler, celse hedefi ve B planı. Celse kartında
   "tutanağa geçirilecek kalemler" bölümü zorunludur.
3. Tanık varsa 16-3-tanik-sorulari: sorulacak sorular ve beyan çelişki matrisi. Tanığın vereceği beyan yazılmaz.
4. Eksik delil varsa 16-4-delil-toplama-plani: hangi delil, nereden, kim, hangi taleple. Plan
   `05-Durusma-Notlari/delil-tedarik.md` dosyasında tutulur ve her celsede güncellenir; celse kartı ona atıf yapar.
5. Çıktı: `05-Durusma-Notlari/celse-karti-<YYYY-AA-GG>.md`. Künye kullanılırsa yalnız havuzdan; kapı
   `python scripts/cikti_dogrula.py <dosya>` ve `python scripts/havuz_kontrol.py <dosya> --havuz "<dava-klasoru>/02-Arastirma/arastirma-raporu.md"`.
6. Kayıt: `python scripts/akis.py olay "<dava-klasoru>" --hat durusma "celse kartı hazırlandı" --cikti <yol>`.

## Zabıt denetimi (`zabit` hattı)

1. Zabıt UYAP'tan okunur: Yargı PRO masaüstü aracı açıksa okuma komutlarıyla; evrak yerelde yoksa avukata
   `/davayi-cek` önerilir (indirme kendiliğinden başlatılmaz).
2. 16-2-durusma-zapti-denetimi: zabıt celse kartıyla karşılaştırılır; beyan, talep ve itirazlar doğru geçti mi,
   süre doğuran ara karar var mı.
3. Süre doğuran ara karar varsa son gün `sure_hesapla` ile hesaplanır ve Süre Kalkanı'na `sure_kalkani.py` ile
   işlenir. Ara kararda gün sayısı yoksa satır tarihsiz kalır, süre uydurulmaz. `00-Dava-Ozeti.md` 10-3 ile güncellenir.
4. Çıktı: `05-Durusma-Notlari/zabit-denetimi-<YYYY-AA-GG>.md`; kayıt `akis.py olay … --hat zabit …`.

Mahkemeye gidecek bir beyan veya talep yazılacaksa bu hat bitmez; `/dilekce` ile ilgili mod çalışır.

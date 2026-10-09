---
description: "Tebliğ edilen kararın çözümlemesi, süre başlangıcı ve son gün, kanun yolu önerisi; büro iş hattı"
---
# /karar-geldi — Karar Hattı

`$ARGUMENTS` = dava-id (ve varsa karar evrakının adı).

Kural kaynağı: `AGENTS.md` → "Beceri Haritası ve Büro İş Hatları" (`karar` hattı).
Beceri listesi: `python scripts/beceri_haritasi.py hat karar --kol <kol>` (kolun karar sonrası ailesi dahil).

1. Karar metni okunur. Karşı taraftan veya dışarıdan gelen evrak ise önce 15-2 güvenlik taraması.
2. Süre önce güvenceye alınır: 12-2 tebliğ başlangıcı veya 12-3 öğrenme başlangıcı, 12-1 son gün (`sure_hesapla`;
   güven alanları kesin değilse kesin son gün sayılmaz), 12-4 Süre Kalkanı kaydı (`sure_kalkani.py girdi` →
   `sure_takvimi` → `sure_kalkani.py kaydet`). AYM ya da AİHM geçişi söz konusuysa 12-5-yargi-yolu-devri.
3. 10-4-karar-cozumlemesi: kararın dayanağı, kabul ettiği vakıalar, hüküm fıkrası ve kanun yolunda hedef
   alınabilecek gerekçe satır satır çıkarılır. Sonuç yalnız hüküm fıkrasından okunur. Yalnız kısa karar varsa
   çözümleme gerekçeli karar gelince yapılır; o zamana kadar süre kaydı ve hüküm fıkrası notu yeterlidir.
4. Kolun karar sonrası ailesi gerekiyorsa uygulanır: ceza 1-7, AYM 5-5, AİHM 6-5.
5. Çıktı: `05-Durusma-Notlari/karar-cozumlemesi-<YYYY-AA-GG>.md`; `00-Dava-Ozeti.md` 10-3 ile güncellenir
   (süre tarihi özete yazılmaz, `KALKAN#<satir-id>` referansı verilir).
   Kapı: `python scripts/cikti_dogrula.py <dosya>`. Kayıt: `akis.py olay … --hat karar …`.
6. Avukata seçenekler sunulur. Kanun yoluna gidilecekse avukatın onayıyla TAM akış açılır (`istinaf yaz:` /
   `temyiz yaz:`). Müvekkile not yazılacaksa 17-1 + belge ve eşlik çifti + K2.

Kanun yolu süresi kaçmaması için son gün ve takvim kaydı bu hattın ilk çıktısıdır; çözümleme sonra derinleşir.

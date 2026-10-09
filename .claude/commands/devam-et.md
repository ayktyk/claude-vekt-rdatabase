---
description: "Dur komutuyla duraklatılmış akışı yarım kalan ASAMA'dan sürdürür"
---
# /devam-et — Duraklatılmış Akışı Sürdür

`/dur` ile durdurulan akışa kaldığı yerden devam eder. `/devam` sıradaki ASAMA'ya geçer;
`/devam-et` yarım kalan ASAMA'yı bitirir.

## Director davranışı

1. **Dava klasörü:** `$ARGUMENTS` dava-id içeriyorsa `python scripts/paths.py dava <dava-id>`.
2. **Kaydı oku:** `python scripts/akis.py goster "<dava-klasoru>"`. Kayıt yoksa MemPalace
   `wing_buro_aykut` içinde `aktif workflow` araması (limit 2); o da yoksa: "Duraklatılmış akış
   bulunamadı. `tam akış: <dava-id>` ile başlayın."
3. **Özet göster:** mod, tamamlanan ASAMA'lar, `basladi` durumundaki ASAMA ve notundaki
   "DURDURULDU: …" kaldığı yer bilgisi, son denetim kararı.
4. **Yarım ASAMA'yı tamamla:** kaldığı yer bilgisini ilgili ajana ilet; yarım dosyayı okuyup
   oradan devam et. Bitince `akis.py asama … <N> --durum bitti --cikti <yol>`.
5. **Sonra:** `/devam` ile sıradaki ASAMA önerilir.

---
description: "Akışı durdurur ve kaldığı yeri 00-AKIS.md kaydına yazar"
---
# /dur — Akışı Durdur, Kaldığı Yeri Kaydet

## Director davranışı

1. **Çalışan iş varsa:** aktif MCP çağrısının bitmesini bekle (en çok 30 sn); aktif Bash komutu
   varsa "bitsin mi, durdurayım mı?" diye sor.
2. **Kaldığı yeri kaydet:** `basladi` durumundaki ASAMA için
   `python scripts/akis.py asama "<dava-klasoru>" <N> --durum basladi --not "DURDURULDU: <kaldığı yer>"`
   (ör. "harç hesabı bitti, zamanaşımı analizi başlamadı"). Yarım dosya yolu `--cikti` ile yazılır.
3. **Avukata özet:** tamamlanan ASAMA'lar, yarım ASAMA ve kaldığı yer, yazılan dosyalar.
   "Devam etmek için: `/devam-et <dava-id>`".
4. **İsteğe bağlı:** oturumlar arası hatırlatma için MemPalace `wing_buro_aykut`'a kısa not
   (müvekkil verisi maskelenir).

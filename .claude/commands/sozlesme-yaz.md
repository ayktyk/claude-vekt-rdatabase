---
description: "Sözleşme taslağı + kaynak doğrulama eşlik dosyası (atıf varsa K2 denetimi)"
---
# /sozlesme-yaz - Sözleşme Taslağı

`$ARGUMENTS` sözleşme ihtiyacına göre taslak üret.

Yazmadan önce:
1. Taraflar
2. konu
3. bedel / süre
4. teslim / ifa yapısı
5. fesih ve uyuşmazlık çözümü

belirsizse eksik bilgi iste.

Taslakta:
- tanımlar
- taraf yükümlülükleri
- ücret / ödeme
- gizlilik / veri
- fesih
- yetki / uyuşmazlık çözümü

Çıktı ve denetim (AGENTS.md "DENETCI Kapısı ve Denetim Politikası"):
- `sozlesme-v1.md` (temiz taslak) + `sozlesme-v1-kaynak-dogrulama.md` eşlik dosyası (SENTINEL + Kaynak
  Doğrulama tablosu + "Aleyhe içtihat: VAR/YOK/ARANMADI" + avukatın karar noktaları).
- Yapısal kapı: `python scripts/cikti_dogrula.py "<klasör>/sozlesme-v1.md" --eslik "<klasör>/sozlesme-v1-kaynak-dogrulama.md"`.
- Taslak karar künyesi, kanun maddesi veya içtihat ifadesi içeriyorsa DENETCI K2'den geçer; YEŞİL olmadan
  karşı tarafa veya müvekkile gönderilmez. Sözleşmenin kendi "Madde N" başlıkları atıf sayılmaz.


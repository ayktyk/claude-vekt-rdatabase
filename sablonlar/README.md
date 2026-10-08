# Sablonlar

Bu klasor, `SONCLAUDE.md`de tarif edilen is akisinin tekrar kullanilabilir
iskelet dosyalarini tutar.

Kullanim sirasi:
- Yeni dava acilirken `advanced-briefing-template.md`
- Ilk usul iskeleti icin `usul-raporu-template.md`
- Arastirma dosyasi icin `arastirma-raporu-template.md`
- Muvekkil evraklari toplandiginda `evrak-listesi-template.md`
- Karsi taraf perspektifi calistirilirken `savunma-simulasyonu-template.md`
- v1 dilekce sonrasi `revizyon-raporu-template.md`
- Yeni dosya klasoru kurulurken `dava-klasoru-checklist.md`

Kalici hafiza referansi:
- Tum drawer yazimi oncesi `mempalace-taksonomi-referansi.md` dosyasina bak
  (Wing/Hall/Room yapisi, KVKK maskeleme, drawer icerik sablonlari)

Kalici ciktilar repo icine degil Google Drive altina yazilir:
- Yeni dava: `G:\Drive'im\Hukuk Burosu\Aktif Davalar`
- Sadece arastirma: `G:\Drive'im\Hukuk Burosu\Bekleyen Davalar`

Muvekkil bilgi formlari (`muvekkil-formlari/`):
- `iscilik-alacaklari-muvekkil-bilgi-formu.pdf/.docx` — SADE form (3 sayfa + buro kutusu),
  WhatsApp'tan gonderilen VARSAYILAN surum (2026-10: uzun surum muvekkillerce karisik bulundu)
- `...-detayli.pdf/.docx` — ayrintili surum; yalniz gorusme oncesi hazirlikli muvekkil icin
- `...-whatsapp-mesaji.txt` — formla birlikte gonderilecek mesaj kalibi
- Uretim: `python -m scripts.muvekkil_formu` (sade) / `--detayli`; semalar
  `scripts/muvekkil_formu/schema.py` ve `schema_detayli.py`; iki format ayni semadan uretilir

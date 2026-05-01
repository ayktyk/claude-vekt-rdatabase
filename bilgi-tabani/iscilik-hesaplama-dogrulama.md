# Iscilik Hesaplama Formul Dogrulama Raporu

Tarih: 2026-04-11
Kaynak: ajanlar/usul-uzmani/iscilik-hesaplama.md (167 satir)
Referans: CLAUDE.md Iscilik Alacaklari Hesaplama Modulu + Excel formulleri

---

## Dogrulama Durumu

| Modul | Durum | Not |
|---|---|---|
| MODUL 1: Hizmet Suresi | DOGRU | DATEDIF formulleri Excel ile uyumlu |
| MODUL 2: Ucret Hesabi | DIKKAT GEREKLI | Yemek istisnasi 2023'te kalmis (asagiya bkz.) |
| MODUL 3: Kidem Tavani | DOGRU | 2026 H1 tavani (64.948,77 TL) guncel |
| MODUL 4: Ihbar Tazminati | DOGRU | 4857 s.K. m.17 ile uyumlu |
| MODUL 5: Fazla Calisma | DIKKAT GEREKLI | Gelir vergisi dilimleri "2025" — 2026 kontrolu gerekli |
| MODUL 6: UBGT Ucreti | DIKKAT GEREKLI | 2024-2026 gun sayilari eksik |
| MODUL 7: Hafta Tatili | DOGRU | Formul tutarli |
| MODUL 8: Yillik Izin | DOGRU | Formul tutarli |
| MODUL 9: Ise Iade | DOGRU | Formul tutarli |
| Risk Kontrolleri | DOGRU | 5 madde yeterli |

---

## Tespit Edilen Sorunlar

### SORUN 1: Yemek Istisnasi Tablosu Stale (ORTA RISK)

**Konum:** iscilik-hesaplama.md satir 41
**Mevcut:** `(2023: 118,80 TL/gun | 2022: 51 | 2021: 25 | 2020: 23 | 2019: 19 | 2018: 16)`
**Sorun:** 2024, 2025, 2026 yemek istisnasi tutarlari EKSiK.
**Fix:** 2024-2026 yemek istisnasi tutarlarini Gelir Vergisi Genel Tebligi'nden cek ve ekle.

CLAUDE.md'deki ayni tablo da guncellenmeli (tutarlilik).

### SORUN 2: Gelir Vergisi Dilimleri 2025'te Kalmis (DUSUK RISK)

**Konum:** iscilik-hesaplama.md satir 90-92
**Mevcut:** `0-158.000 TL -> %15 | 158.000-330.000 TL -> %20 | 330.000 TL ustu -> %27`
**Sorun:** Bu dilimler "2025 dilimleri" olarak isaretlenmis. 2026 icin guncelleme gerekebilir.
**Fix:** 2026 yili gelir vergisi tarifesi (GVK Gecici 67 veya yillik tarife) ile dogrula.
Eger degismemisse "2025-2026 dilimleri" olarak guncelle.

### SORUN 3: UBGT Gun Sayilari Eksik (ORTA RISK)

**Konum:** iscilik-hesaplama.md satir 102-103
**Mevcut:** `2024: guncel kontrol` — gercek gun sayisi yazilmamis. 2025 ve 2026 HIC YOK.
**Fix:** 2024, 2025, 2026 resmi tatil takvimlerinden UBGT gun sayilarini belirle ve ekle.

### SORUN 4: CLAUDE.md ile Tutarlilik

CLAUDE.md'deki hesaplama modulu (Iscilik Alacaklari Hesaplama Modulu bolumu)
ayni formulleri iceriyor. Degisiklik yapilirsa HER IKI DOSYA DA guncellenmeli.
Tek kaynak ilkesi icin iscilik-hesaplama.md "master" dosya olmali,
CLAUDE.md ise "bkz. iscilik-hesaplama.md" referansi vermeli.

---

## Dogrulanmis Formul Tutarliliklari

| Formul | iscilik-hesaplama.md | CLAUDE.md | Tutarli? |
|---|---|---|---|
| Kidem brut = (esas x yil) + (esas/12 x ay) + (esas/365 x gun) | EVET | EVET | TUTARLI |
| Ihbar brut = giydirilmis/30 x onel gun | EVET | EVET | TUTARLI |
| FC brut = katsayi x (brut/225) x 1.5 x saat x hafta | EVET | EVET | TUTARLI |
| Damga vergisi = brut/1000 x 7.59 | EVET | EVET | TUTARLI |
| SGK + issizlik = %15 | EVET | EVET | TUTARLI |

---

## Sonuc

3 sorun tespit edildi (2 orta risk, 1 dusuk risk). Tumu STALE DATA sorunlari.
Formul mantigi dogru, guncel olmayan tutarlar guncellenmeli.
Yemek istisnasi ve UBGT gun sayilari oncelikli guncelleme gerektirir.

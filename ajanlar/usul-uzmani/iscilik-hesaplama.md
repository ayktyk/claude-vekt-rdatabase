# Iscilik Alacaklari Hesaplama

Bu modul Excel dosyasindaki hesap mantigina dayanir. Hesaplama sirasi ve formul
akisi asagidadir.

## Girdi Verileri

- Ise giris tarihi
- Isten cikis tarihi
- Son net ucret (TL)
- Yemek yardimi (aylik TL) - varsa
- Servis yardimi (aylik TL) - varsa
- Ikramiye, prim, barinma, yakacak - varsa
- Fesih nedeni
- Toplam izin hakki ve kullandirilan izin
- Fazla mesai yapiliyorsa haftalik saat sayisi ve donemler
- UBGT calismasi var mi ve hangi yillar?
- Hafta tatili calismasi var mi ve haftada kac gun?

## MODUL 1: Hizmet Suresi

```text
Yil = DATEDIF(ise_giris, isten_cikis, "y")
Ay = DATEDIF(ise_giris, isten_cikis, "ym")
Gun = DATEDIF(ise_giris, isten_cikis, "md") + 1
```

## MODUL 2: Ucret Hesabi

```text
SGK + issizlik primi = brut x %15
Gelir vergisi = (brut - SGK) x %15
Damga vergisi = brut / 1000 x 7.59
Net ucret = brut - SGK - gelir_vergisi - damga
Brut/Net katsayisi = brut / net
Brut ucret = Net ucret x Brut/Net katsayisi
```

```text
Yemek istisnasi = yila_gore_istisna_tutari / 2 x 26 gun
(2023: 118,80 TL/gun | 2022: 51 | 2021: 25 | 2020: 23 | 2019: 19 | 2018: 16)
Yemek aylik brut = aylik_yemek - yemek_istisnasi
```

```text
Giydirilmis brut = Brut_ucret + yemek_brut + servis + ikramiye + prim + diger
```

## MODUL 3: Kidem Tazminati Tavani

| Donem | Asgari Ucret (brut) | Kidem Tavani |
|---|---|---|
| 01.01.2026-30.06.2026 | 33.030 TL | 64.948,77 TL |
| 01.07.2025-31.12.2025 | 26.005,50 TL | 46.655,43 TL |
| 01.01.2025-30.06.2025 | 26.005,50 TL | 41.828,42 TL |
| 01.07.2024-31.12.2024 | 20.002,50 TL | 35.058,58 TL |
| 01.01.2024-30.06.2024 | 20.002,50 TL | 35.058,58 TL |
| 01.07.2023-31.12.2023 | 13.414,50 TL | 23.489,83 TL |
| 01.01.2023-30.06.2023 | 10.008,00 TL | 19.982,83 TL |
| 01.07.2022-31.12.2022 | 6.471,00 TL | 15.371,40 TL |
| 01.01.2022-30.06.2022 | 5.004,00 TL | 10.848,59 TL |

```text
Esas ucret = MIN(giydirilmis_brut, donem_tavani)
Kidem brut = (esas_ucret x yil) + (esas_ucret/12 x ay) + (esas_ucret/365 x gun)
Damga vergisi = kidem_brut / 1000 x 7.59
Kidem net = kidem_brut - damga_vergisi
```

## MODUL 4: Ihbar Tazminati

```text
6 ay - 1,5 yil -> 2 hafta (14 gun)
1,5 yil - 3 yil -> 4 hafta (28 gun)
3 yil - 6 yil -> 6 hafta (42 gun)
6 yildan fazla -> 8 hafta (56 gun)
```

```text
Ihbar brut = giydirilmis_brut / 30 x onel_gun_sayisi
Gelir vergisi = ihbar_brut x %15
Damga vergisi = ihbar_brut / 1000 x 7.59
Ihbar net = ihbar_brut - gelir_vergisi - damga_vergisi
```

## MODUL 5: Fazla Calisma Ucreti

```text
FC brut = asgari_ucret_katsayisi x (brut_ucret/225) x 1.5 x haftalik_saat x hafta_sayisi
0-158.000 TL -> %15
158.000-330.000 TL -> %20
330.000 TL ustu -> %27
SGK + issizlik = FC_brut x %15
Gelir vergisi matrahi = FC_brut - SGK
Damga vergisi = FC_brut / 1000 x 7.59
FC net = FC_brut - SGK - kademeli_gelir_vergisi - damga_vergisi
```

## MODUL 6: UBGT Ucreti

```text
2018: 6 gun | 2019: 6.5 gun | 2020: 6.5 gun | 2021: 7.5 gun
2022: 6.5 gun | 2023: 5 gun | 2024: guncel kontrol
UBGT brut = brut_ucret / 30 x yila_gore_gun_sayisi
SGK = UBGT_brut x %15
Gelir vergisi = (UBGT_brut - SGK) x %15
Damga vergisi = UBGT_brut / 1000 x 7.59
UBGT net = UBGT_brut - SGK - gelir_vergisi - damga_vergisi
```

## MODUL 7: Hafta Tatili Ucreti

```text
HT brut = brut_ucret / 30 x 1.5 x haftalik_gun_sayisi
SGK = HT_brut x %15
Gelir vergisi = (HT_brut - SGK) x %15
Damga vergisi = HT_brut / 1000 x 7.59
HT net = HT_brut - SGK - gelir_vergisi - damga_vergisi
```

## MODUL 8: Yillik Izin Ucreti

```text
Bakiye izin = toplam_izin_hakki - kullandirilan_izin
Yillik izin brut = giydirilmis_brut / 30 x bakiye_izin_gun
SGK = yillik_izin_brut x %15
Gelir vergisi = (yillik_izin_brut - SGK) x %15
Damga vergisi = yillik_izin_brut / 1000 x 7.59
Yillik izin net = yillik_izin_brut - SGK - gelir_vergisi - damga_vergisi
```

## MODUL 9: Ise Iade

```text
Ise baslatmama tazminati = brut_ucret x [4-8 ay arasi]
Damga vergisi = tazminat_brut / 1000 x 7.59
Tazminat net = tazminat_brut - damga_vergisi
Bosta gecen sure = brut_ucret x 4 ay
SGK + issizlik = bosta_sure x %15
Gelir vergisi = (bosta_sure - SGK) x %15
Damga vergisi = bosta_sure / 1000 x 7.59
Bosta sure net = bosta_sure - SGK - gelir_vergisi - damga_vergisi
```

## Sonuc Tablosu

```text
| Alacak Kalemi   | Net (TL) | Brut (TL) | Talep |
|---|---|---|---|
| Kidem Tazminati |          |           |       |
| Ihbar Tazminati |          |           |       |
| Fazla Calisma   |          |           |       |
| UBGT Ucreti     |          |           |       |
| Hafta Tatili    |          |           |       |
| Yillik Izin     |          |           |       |
| Ucret Alacagi   |          |           |       |
| TOPLAM          |          |           |       |
```

## Risk Kontrolleri

- Giydirilmis brut > kidem tavanini geciyorsa tavan esas alinir, bunu belirt
- Istifa belgesi varsa hakli fesih argumani gerekip gerekmedigini kontrol et
- Ibra sozlesmesi varsa fesihten en az 1 ay sonra imzalanip imzalanmadigini kontrol et
- Bordrolar imzaliysa ve fazla mesai sutunu doluysa tanik stratejisi oner
- Zamanasimi hesabinda fesih tarihinden itibaren 5 yillik sureyi kontrol et

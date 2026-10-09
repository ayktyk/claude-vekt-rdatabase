---
description: "İşçilik alacakları hesaplama modülü (kıdem, ihbar, fazla çalışma, UBGT, yıllık izin); deterministik"
---
# /hesapla — İşçilik Alacakları Hesaplama

`$ARGUMENTS` olarak verilen parametreleri al. Beklenen format:
```
giriş:[tarih], çıkış:[tarih], net:[TL], yemek:[TL], servis:[TL], fesih:[tür]
```

Modül: `ajanlar/usul-uzmani/iscilik-hesaplama.md` (AGENTS.md "Iscilik Alacaklari Hesaplama").
Dönem oranları, asgari ücret ve kıdem tavanı hesap öncesi güncel resmî kaynaktan teyit edilir
(Yargı PRO 14-2-guncel-oran-teyidi yöntemi); teyit edilemeyen değer "DOĞRULANMAMIŞ" yazılır.

Sıra:
1. Hizmet süresi (yıl, ay, gün)
2. Brüt/net katsayısı → brüt ücret
3. Giydirilmiş brüt ücret
4. Kıdem tazminatı (dönem tavanına göre)
5. İhbar tazminatı
6. Fazla çalışma ücreti (parametre verildiyse)
7. UBGT ücreti (parametre verildiyse)
8. Hafta tatili ücreti (parametre verildiyse)
9. Yıllık izin ücreti
10. Sonuç tablosu (Net + Brüt)

Risk kontrolleri:
- Giydirilmiş brüt > kıdem tavanı → tavan esas alınır, belirtilir
- Zamanaşımı (fesihten itibaren 5 yıl): tarih aritmetiği deterministik yapılır, LLM'e yaptırılmaz. Usul
  süreleri (cevap, istinaf …) için `npx -y yargi-skill sure_hesapla --kol <kol> --islem <kod> --teblig <YYYY-AA-GG> --tebligat-turu <tür> --adli-tatile-tabi <evet|hayir> --json`; `takvime_aktarilabilir: false`, `baslangic_durumu: TEYIT-BEKLIYOR` veya `guven` ≠ `yuksek` ise sonuç kesin son gün sayılmaz.
- İstifa / ibra uyarıları
- Talep yolu: büro hafıza kaydına göre HMK m.107 mülgadır (7589 s.K.) ve yeni davada kısmi dava +
  HMK m.109/4 artırım yolu izlenir; kullanmadan önce güncel madde metni `mevzuat_getir` ile teyit edilir

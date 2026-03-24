# /hesapla — İşçilik Alacakları Hesaplama

$ARGUMENTS olarak verilen parametreleri al. Beklenen format:
```
giriş:[tarih], çıkış:[tarih], net:[TL], yemek:[TL], servis:[TL], fesih:[tür]
```

CLAUDE.md'deki İşçilik Alacakları Hesaplama Modülünü kullan.

Sıra:
1. Hizmet süresini hesapla (yıl, ay, gün)
2. Brüt/Net katsayısını hesapla → brüt ücret
3. Giydirilmiş brüt ücreti hesapla
4. Kıdem tazminatı (dönem tavanına göre)
5. İhbar tazminatı
6. Fazla çalışma ücreti (parametre verildiyse)
7. UBGT ücreti (parametre verildiyse)
8. Hafta tatili ücreti (parametre verildiyse)
9. Yıllık izin ücreti
10. Sonuç tablosunu oluştur (Net + Brüt)

Risk kontrollerini otomatik yap:
- Giydirilmiş brüt > kıdem tavanı → tavan esas alınır
- Zamanaşımı kontrolü
- İstifa/ibra uyarıları

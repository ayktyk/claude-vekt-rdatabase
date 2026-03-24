# Geliştirme Notu

## Bu Davada Sistem Nasıl İşledi

1. `Director Agent` senaryoyu dava hafızasına açtı ve kritik noktaları belirledi:
   `00-Dava-Hafizasi.md`

2. `AJAN 2D NotebookLM`, `tapu iptal ve tescil davası` notebook'u üzerinde üç kritik
   soruyu araştırdı ve ilk araştırma omurgasını çıkardı:
   `02-Arastirma/notebooklm-arastirma-notlari.md`

3. `AJAN 1 Usul`, görevli mahkeme, davacı sıfatı, tedbir ve delil iskeletini kurdu:
   `01-Usul/usul-raporu.md`

4. `AJAN 2C Mevzuat`, norm omurgasını kurdu:
   `02-Arastirma/mevzuat-raporu.md`

5. `AJAN 2B Yargıtay`, içtihat çizgisini topladı:
   `02-Arastirma/yargitay-raporu.md`

6. Tüm bu çıktılar tekrar NotebookLM'e kaynak olarak yüklendi ve sentez sorguları
   çalıştırıldı:
   `03-Sentez-ve-Dilekce/notebooklm-muris-muvazaasi-arguman-omurgasi.md`

7. `AJAN 3 Belge Yazarı`, önce `v1`, sonra NotebookLM geri bildirimine göre `v2`
   dilekçesini üretti:
   - `03-Sentez-ve-Dilekce/dava-dilekcesi-v1.md`
   - `03-Sentez-ve-Dilekce/notebooklm-v2-zayif-noktalar.md`
   - `03-Sentez-ve-Dilekce/dava-dilekcesi-v2.md`

## Değerlendirme

İstanbul'da aktif çalışan bir avukat için bu sistem artık `gerçekten faydalı`
seviyede. Özellikle güçlü tarafı, tek hamlede araştırma yapmaması; iç kaynak,
usul, norm, içtihat ve sentez katmanlarını ayırmasıdır. Bu ayrım doğrudan pratik
üretime dönüşmektedir.

Ancak sistem henüz `tek başına yeterli son sistem` değildir. En kritik zayıflık,
somut veri girişindedir. Ada/parsel, ölüm tarihi, veraset, sağlık kayıtları,
banka izleri ve tanık eşleştirmesi gelmeden sistem iyi bir strateji kurmakta;
ancak dosyayı kazanacak sertlikte otomatik son ürün verememektedir.

## Geliştirme Önerileri

- `delil-toplama ajanı` eklenmeli:
  hangi kurumdan hangi belgenin isteneceğini otomatik checklist halinde çıkarmalı

- `karşı taraf savunma simülatörü` eklenmeli:
  davalının en güçlü savunmalarını ve bunlara verilecek yanıtları üretmeli

- `v2/v3 revizyon ajanı` eklenmeli:
  dilekçeyi HMK 194, ispat yükü ve içtihat riskleri bakımından otomatik eleştirmeli

- `duruşma hazırlık ajanı` eklenmeli:
  tanık sorgu soruları, ara karar talepleri ve tensip beklentisi üretmeli

- `belge yapılandırma formu` eklenmeli:
  dava açmadan önce zorunlu alanları kullanıcıdan sistematik olarak toplamalı

## Sonuç

Bu sistem şu an `çok iyi bir araştırma ve taslak üretim motoru` durumundadır.
Bir üst seviyeye çıkması için eksik olan üç ana şey şudur:

- `somut veri toplama`
- `revizyon döngüsü`
- `karşı tez simülasyonu`

Bu üç katman eklendiğinde sistem, araştırma aracından tam anlamıyla dava hazırlık
altyapısına dönüşebilir.

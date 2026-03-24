# Dava Hafızası

## Temel Bilgiler
- Dava No: `2026-002-YS-tapu-iptal-tescil`
- Müvekkil: `Yasemin`
- Dava Türü: `tapu_iptal_ve_tescil`
- Durum: `araştırma aşaması`

## Olay Özeti
- Müvekkil Yasemin, babası Aykut'un yaşlılığından faydalanıldığını ileri sürmektedir.
- Ahmet Selçuk'un, babanın tek malvarlığı olan Arnavutköy'deki taşınmazı noterde yapılan satış işlemiyle kendi üzerine geçirdiği iddia edilmektedir.
- Müvekkilin iddiası, işlemin gerçek iradeyi yansıtmadığı ve taşınmaz devrinin hukuken sakat olduğu yönündedir.
- Aykut'un `vefat etmiş olduğu` bilgisi sonradan netleşmiştir.

## Seçilen Dahili Kaynak
- NotebookLM Notebook: `tapu iptal ve tescil davası`
- Notebook ID: `b704b431-58df-4711-91bf-7b622f77c285`

## Kritik Noktalar
1. Yaşlı ve zayıf durumdaki babanın satış işlemindeki gerçek iradesinin sakatlanıp sakatlanmadığı
2. Kardeşe yapılan satışın muvazaalı bağış sayılıp sayılamayacağı
3. İşlem tarihinde babanın fiil ehliyetinin bulunup bulunmadığı

## Sistem Durumu
- Director Agent: `aktif`
- AJAN 2D NotebookLM: `tamamlandı`
- AJAN 2B Yargı: `tamamlandı`
- AJAN 2C Mevzuat: `tamamlandı`
- AJAN 1 Usul: `tamamlandı`

## NotebookLM Sonucu
- NotebookLM, bu dosyada en güçlü ilk hattın `işlem tarihindeki fiil ehliyeti` araştırması olduğunu gösterdi.
- İkinci hat olarak `gerçek iradenin sakatlanması`, `hile`, `etki altında bırakma` ve bağımlılık ilişkisi öne çıktı.
- Üçüncü hat olarak kardeşe yapılan devrin `muvazaalı bağış / muris muvazaası` niteliğinde olup olmadığı araştırılmalıdır.
- Toplanması gereken temel deliller:
  - işlem tarihine yakın sağlık kayıtları
  - Adli Tıp Kurumu incelemesi
  - bedelin ödendiğini gösteren banka kayıtları
  - taşınmazın rayiç değeri
  - tapu/noter sürecine ilişkin tanıklar

## Bir Sonraki Sistem Adımı
- Director Agent kararı: `Aykut'un vefatı` netleştiği için dosyanın ana omurgası artık `muris muvazaası`dır.
- Destekleyici ve terditli hatlar:
  - `işlem tarihinde fiil ehliyeti`
  - `irade sakatlığı / hile`
- Bir sonraki mantıklı aşama, bu omurga ile `AJAN 3 Belge Yazarı` sentezine geçmektir.

## Yeni Ajan Sonuçları
- `AJAN 1 Usul`, dosyanın en kritik usul sorununun `davacı sıfatı` olduğunu tespit etti.
- `AJAN 2C Mevzuat`, norm omurgasının iki ayrı ihtimale göre ayrıldığını doğruladı.
- `AJAN 2B Yargı`, Yargıtay çizgisinin işlem anı ehliyeti, gerçek bedel ve mal kaçırma kastı üzerinde yoğunlaştığını gösterdi.

## Son NotebookLM Sentezi
- `Aykut'un vefatı` kabulüyle NotebookLM ana omurgayı `muris muvazaası` olarak yeniden kurdu.
- Destekleyici/terditli katmanlar:
  - `ehliyetsizlik`
  - `irade sakatlığı / hile`
- NotebookLM ayrıca ilk ivedi talebin `ihtiyati tedbir / davalıdır şerhi` olması gerektiğini vurguladı.

## Sıradaki Adım
- Director Agent kararı: dosya artık `AJAN 3 Belge Yazarı` aşamasına geçebilir.
- Üretilen ilk belge: `dava-dilekcesi-v1.md`

## NotebookLM V2 Geri Bildirimi
- NotebookLM, `v1` taslağın en kritik zayıflığının `ehliyetsizlik` ile `muris muvazaası` sıralaması olduğunu belirtti.
- Ayrıca şu eksikleri vurguladı:
  - bedel ödemesizliği ve alım gücü iddiası daha net kurulmalı
  - tıbbi vakıalar soyut bırakılmamalı
  - hile/yönlendirme anlatısı olay örgüsüne bağlanmalı
  - her delil hangi vakıayı ispat ettiğiyle yazılmalı

## Yeni Sıradaki Adım
- Director Agent kararı: `dava-dilekcesi-v2.md` hazırlanmalı
- V2'nin amacı:
  - hukuki sıralamayı düzeltmek
  - vakıaları somutlaştırmak
  - delilleri HMK m. 194/2 düzeyinde eşleştirmek

## Üretilen Yeni Belge
- `dava-dilekcesi-v2.md` üretildi.
- V2'de yapılan ana revizyonlar:
  - ehliyetsizlik incelemesinin önceliği açık yazıldı
  - muris muvazaası vakıaları daha sert kuruldu
  - deliller, ispat edecekleri vakıalarla eşleştirildi

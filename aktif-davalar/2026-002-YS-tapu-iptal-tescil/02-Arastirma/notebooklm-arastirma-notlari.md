# NotebookLM Araştırma Notları

Bu dosya, `tapu iptal ve tescil davası` notebook'u üzerinde üç kritik nokta için
çalıştırılan sorguların çıktılarını bir araya getirmek için açılmıştır.

## Sorgu 1
**Kritik nokta:** Yaşlı ve zayıf durumdaki babanın satış işlemindeki gerçek iradesinin sakatlanıp sakatlanmadığı

### NotebookLM'in çıkardığı ana omurga
- Ana hukuki eksenler: `ehliyetsizlik`, `irade sakatlığı`, `hile/etki altında bırakma`, `muris muvazaası`
- En güçlü araştırma hattı, işlemin sadece görünürde satış olup olmadığı değil, satış anındaki gerçek iradenin serbestçe oluşup oluşmadığıdır.
- Bedelin hiç ödenmemesi veya taşınmazın değerine göre aşırı düşük gösterilmesi, gerçek iradenin sakatlandığına dair güçlü olgusal gösterge olarak değerlendirilmelidir.

### İspat için öne çıkan başlıklar
- İşlem tarihine yakın sağlık kayıtları, nöroloji/psikiyatri geçmişi, kullanılan ilaçlar
- Babayı notere veya tapuya kimin götürdüğü, kime bağımlı yaşadığı, günlük işlerini tek başına yapıp yapamadığı
- Satış bedeli ile rayiç/değer arasındaki fark
- Bedelin banka kanalıyla gerçekten ödenip ödenmediği

### Stratejik not
- NotebookLM, davada ilk omurganın `ehliyetsizlik veya ayırt etme gücü zayıflığı` ekseninden kurulmasını öneriyor.
- Eğer tam ehliyetsizlik ispat edilemezse, terditli hatta `irade sakatlığı + muvazaa` birlikte yürütülmelidir.

## Sorgu 2
**Kritik nokta:** Kardeşe yapılan satışın muvazaalı bağış sayılıp sayılamayacağı

### NotebookLM'in çıkardığı ana omurga
- Temel dayanak `01.04.1974 tarihli 1/2 sayılı YİBK` çizgisindeki `muris muvazaası` yaklaşımıdır.
- Bu hatta esas mesele, görünürdeki satışın gerçekte mirasçılardan mal kaçırma amaçlı bağış olup olmadığını ortaya koymaktır.

### Muvazaayı destekleyen göstergeler
- Satış bedeli ile gerçek değer arasında fahiş fark bulunması
- Ahmet Selçuk'un bu bedeli ödeyebilecek ekonomik gücünün bulunmaması
- Aykut'un taşınmazı gerçekten satmasını gerektiren makul bir ihtiyacının görünmemesi
- Aile içi ilişkiler, bölgesel teamül, murisin hayatın olağan akışına aykırı biçimde tek taşınmazını tek çocuğa devretmesi

### NotebookLM'in uyarısı
- Sadece düşük bedel tek başına yetmeyebilir; bakım emeği, minnet duygusu veya haklı paylaşım gerekçesi savunma olarak ileri sürülebilir.
- Bu nedenle muvazaa iddiası, ödeme yokluğu, ekonomik güçsüzlük ve mirasçılardan mal kaçırma kastı ile birlikte kurulmalıdır.

## Sorgu 3
**Kritik nokta:** İşlem tarihinde babanın fiil ehliyetinin bulunup bulunmadığı

### NotebookLM'in çıkardığı ana omurga
- `Ehliyetsizlik` kamu düzenine ilişkindir ve mahkemece öncelikle incelenmelidir.
- Yaşlılık tek başına yeterli değildir; odak mutlaka `işlem anı` olmalıdır.
- Eğer işlem anında ayırt etme gücü yoksa, işlem kesin hükümsüzlük/yokluk hattında değerlendirilir.

### İspat için öne çıkan başlıklar
- İşlem tarihine yakın epikrizler, muayene kayıtları, beyin görüntülemeleri, ilaç raporları
- Tanık beyanları: unutkanlık, yönelim bozukluğu, karar verme yetersizliği, bağımlılık durumu
- Adli Tıp Kurumu 4. İhtisas Kurulu raporu isteme gereği
- Düzenlenmiş tek hekim raporu varsa, bunun zihinsel değerlendirme bakımından yeterliliği ayrıca tartışılmalıdır

### Stratejik not
- NotebookLM, bu davada `işlem tarihindeki fiil ehliyeti` incelemesini ilk savunma hattı olarak kuruyor.
- Muvazaa ve irade sakatlığı başlıkları ise ehliyet hattını destekleyen veya alternatif oluşturan ikinci katman olarak görülmeli.

## Birleşik Sonuç
NotebookLM'e göre bu dosyada en güçlü dava kurgusu şu sırayla ilerlemelidir:

1. Önce `işlem tarihinde fiil ehliyetinin zayıf veya yok olduğu` araştırılmalı.
2. Bununla birlikte `irade sakatlığı` ve `etki altında bırakma` olguları kurulmalı.
3. Alternatif veya tamamlayıcı eksen olarak `muris muvazaası / muvazaalı bağış` hattı işlenmeli.
4. Tüm bu başlıklar, somut ispat araçlarına bağlanmalı:
   - sağlık kayıtları
   - ATK raporu
   - tanık anlatımları
   - ödeme/banka kayıtları
   - rayiç değer karşılaştırması
   - devir sürecindeki fiili yönlendirme ilişkisi

## Director Agent Notu
Bu aşamada yalnızca `AJAN 2D NotebookLM` çalıştırılmıştır.
Sistemin sonraki mantıklı adımları:

1. `AJAN 1 Usul` ile görevli ve yetkili mahkeme, dava türü, taraf teşkili, tedbir ve delil listesi çıkarılır.
2. `AJAN 2B Yargı` ile Yargıtay ve bölge adliye karar çizgisi toplanır.
3. `AJAN 2C Mevzuat` ile TMK, TBK ve ilgili içtihadı birleştiren norm omurgası kurulur.
4. `AJAN 3 Belge Yazarı` ancak bu üç katman tamamlandıktan sonra dilekçe omurgasına geçer.

## Güncelleme
- Sonradan gelen vakıaya göre `Aykut vefat etmiştir`.
- Bu nedenle NotebookLM çıktılarındaki üç kritik başlık içinden `muvazaalı bağış / muris muvazaası` artık ana omurga haline gelmiştir.
- `fiil ehliyeti` ve `irade sakatlığı` başlıkları ise davayı güçlendiren destekleyici katman olarak korunacaktır.

# Yeni Plan: Görseldeki Mimarîye Geçiş

Bu dosya, mevcut sistemin ilk kurulum planını ve bugün kullanılan `CLAUDE.md`
tasarımını birlikte gözden geçirerek, yüklenen görseldeki sisteme benzer bir
hedef mimariye kontrollü geçiş planını tanımlar.

Bu aşamada amaç kod yazmak değil, geçiş farklarını netleştirmek ve sıralı bir
uygulama planı çıkarmaktır.

---

## 1. Amaç

Hedef:

- mevcut vektör database + dava otomasyon sistemini korumak
- ama yapıyı daha açık bir `Director Agent` orkestrasyonuna taşımak
- araştırmayı gerçek paralel alt ajanlara bölmek
- NotebookLM'i daha sistematik bir dahili çalışma katmanı haline getirmek
- haftalık autoresearch mantığını olay tetiklemeli ve daha sürekli çalışan bir döngüye evirmek
- pazarlama, araştırma ve belge üretim hatlarını daha modüler hale getirmek

Kısa hüküm:

- mevcut sistem çöpe atılmayacak
- mevcut sistem yeniden adlandırılacak, ayrıştırılacak ve katmanlaştırılacak

---

## 2. Mevcut Durum Özeti

Bugünkü yapıda sistemin çekirdeği zaten vardır:

- Vektör DB var
- Yargı CLI ve Mevzuat CLI var
- NotebookLM dahili kaynak olarak var
- Google Drive klasör akışı var
- Usul ajanı, araştırma ajanı, dilekçe ajanı ve pazarlama ajanı var
- Haftalık içtihat taraması fikri var

Bu yüzden mesele "sıfırdan kurulum" değil, "mimariyi olgunlaştırma"dır.

---

## 3. İlk Planın Güçlü Tarafları

`PLAN.md` ilk kurulum için hâlâ değerlidir. Özellikle şu tarafları doğru:

- Vektör DB'yi sistemin ana dahili hukuk kütüphanesi olarak konumlandırması
- Kurulumu adım adım ve testli ilerletmesi
- MCP bağlantısını erken kurmayı düşünmesi
- `CLAUDE.md` ile operasyonel davranışı tek merkezde toplamaya çalışması
- İşçilik hesaplama modülünü ayrı bir modül olarak ele alması
- Yeni dava başlatma akışını klasör ve veri disipliniyle başlatması

Kısacası ilk plan, "kurulum planı" olarak işini görüyor.

---

## 4. İlk Planın Sorunlu veya Eskimiş Tarafları

İlk planın bugünkü hedef mimariye göre yetersiz kaldığı noktalar:

### 4.1 Kurulum merkezli, operasyon merkezli değil

`PLAN.md` büyük ölçüde şu soruya cevap veriyor:

- sistem nasıl kurulur?

Ama artık ihtiyacımız olan soru şu:

- sistem günlük iş akışında nasıl orkestre edilir?

### 4.2 Merkezi orkestratör açık değil

Bugünkü sistemde fiilen bir üst akıl var, ama adı ve sınırları net değil.
Görselde ise bu katman açık:

- `Director Agent (Avukat Orchestrator)`

Mevcut yapıda bu rol:

- avukat komutu
- `ADIM 0`
- kaynak sorgulama
- ajan başlatma mantığı

olarak dağınık halde bulunuyor.

### 4.3 Araştırma tek ajan içinde toplanmış

Bugünkü `AJAN 2`, aslında bir mega-ajandır.
Kendi içinde şunları tek başına yapıyor:

- vektör DB araması
- Yargı araması
- Mevzuat araması
- NotebookLM araması
- güncellik kontrolü

Görselde ise bunlar ayrı araştırma işçileri gibi düşünülmüş.
Bu ayrım kalite ve hız açısından daha doğrudur.

### 4.4 NotebookLM planı eski sürüme dayanıyordu

Eski yaklaşım `notebooklm-mcp-server` etrafında düşünülmüştü.
Yeni gerçeklik:

- `notebooklm-mcp-cli`
- `nlm`
- `notebooklm-mcp`

Bu değişiklik sadece kurulum değil, otomasyon kabiliyeti farkı da yaratır.

### 4.5 Otonom döngü zayıf

Sistemde autoresearch var, ama bugünkü hali daha çok:

- haftalık manuel/periyodik içtihat taraması

Görseldeki hedef ise:

- daha sürekli
- olay tetiklemeli
- merkezi orkestratöre veri besleyen

bir döngüdür.

### 4.6 Belge üretim ajanı dar kapsamlı

Mevcut AJAN 3 daha çok dava dilekçesine odaklı.
Görseldeki hedef ise daha geniş:

- dilekçe
- ihtarname
- sözleşme
- gerektiğinde başka yazılı hukuki metinler

### 4.7 Persistent memory katmanı açıkça modellenmemiş

Klasörler var, Drive var, bilgi tabanı var, ama bunların tek bir "kalıcı dava hafızası"
mantığında nasıl birleşeceği henüz net tanımlı değil.

---

## 5. Hedef Mimarî

Hedef sistem şu katmanlardan oluşmalı:

### 5.1 Director Agent

Tek görevi orkestrasyon olan üst katman.

Sorumlulukları:

- kullanıcı niyetini almak
- dava tipini ve iş akışını sınıflandırmak
- gerekli klasörleri ve çalışma alanını açtırmak
- hangi ajanların çalışacağını seçmek
- hangi araştırma işçilerinin devreye gireceğini belirlemek
- sonuçları birleştirip sıradaki adıma karar vermek
- otonom döngüden gelen sinyalleri yönetmek

### 5.2 Usul Checklist Ajanı

Bugünkü AJAN 1'in daha net ve ürünleştirilmiş hali.

Sorumlulukları:

- görevli/yetkili mahkeme
- dava şartları
- süreler
- harç ve masraflar
- müvekkilden alınacak bilgiler
- toplanacak belgeler

### 5.3 Esas Araştırma İşçileri

Tek ajan yerine bir araştırma kümesi:

- `vector-rag` işçisi
- `yargi` işçisi
- `mevzuat` işçisi
- `notebooklm` işçisi
- gerekirse ileride `deep-research` işçisi

Her biri ayrı sorumlulukla çalışmalı, Director Agent bunları paralel koordine etmeli.

### 5.4 Yazım Ajanı

Bugünkü AJAN 3'ün genişletilmiş hali.

Belge tipleri:

- dava dilekçesi
- ihtarname
- sözleşme taslağı
- istinaf/itiraz taslağı
- mütalaa/özet not

### 5.5 Pazarlama Ajanı

Bugünkü AJAN 4 korunmalı, ama veri kaynağı daha sistemli hale getirilmeli.

Beslendiği yerler:

- anonimleştirilmiş dava içgörüleri
- haftalık içtihat taraması
- vektör DB doktrin özeti
- gerekiyorsa NotebookLM briefing çıktıları

### 5.6 Persistent Katman

Kalıcı hafıza net ikiye ayrılmalı:

- kalıcı hukuk kütüphanesi: Vektör DB
- dava bazlı çalışma hafızası: Drive + NotebookLM notebook + dava klasörü

Bu ayrım korunursa veri karmaşası azalır.

---

## 6. Mevcut Sistem ile Hedef Sistem Arasındaki Fark Listesi

### Zaten mevcut olanlar

- Usul ajanı var
- Araştırma ajanı var
- Yazım ajanı var
- Pazarlama ajanı var
- Vektör DB var
- NotebookLM var
- Drive entegrasyonu düşünülmüş
- Haftalık autoresearch fikri var

### Eksik veya zayıf olanlar

- açık tanımlı Director Agent yok
- araştırma gerçek alt işçilere ayrılmamış
- NotebookLM dava bazlı çalışma notebook mantığı tam oturmamış
- autoresearch döngüsü 7/24 orkestrasyon düzeyine çıkmamış
- belge üretim ajanı belge türüne göre branşlaşmamış
- persistent memory modeli açık adlandırılmamış
- yeni dava açılışında "hangi ajan kombinasyonu çalışacak" kararı otomatikleşmemiş

---

## 7. Geçiş İlkeleri

Geçiş sırasında şu prensipler korunmalı:

### 7.1 Vektör DB merkezde kalacak

Vektör DB sistemin ana hukuk kütüphanesi olmaya devam etmeli.
NotebookLM bunun yerine geçmemeli.

### 7.2 NotebookLM ek dahili katman olacak

NotebookLM şunlar için kullanılmalı:

- dava bazlı çalışma notebook'u
- emsal dilekçe ve strateji hafızası
- özet/briefing üretimi
- Drive kaynaklarının NotebookLM tarafında çalışılabilir hale getirilmesi

### 7.3 Director Agent iş üretmeyecek, iş dağıtacak

Director Agent doğrudan rapor yazan ajan olmamalı.
Görevi:

- seçmek
- başlatmak
- kontrol etmek
- birleştirmek

olmalı.

### 7.4 Tek büyük prompt yerine görev odaklı ajanlar

Özellikle araştırma alanında monolitik prompt yerine küçük sorumluluklar tercih edilmeli.

### 7.5 Önce mimari netleşecek, sonra otomasyon derinleşecek

Doğrudan "tam otonom" hedeflenmemeli.
Önce karar noktaları ve ajan sınırları netleşmeli.

---

## 8. Aşamalı Geçiş Planı

## AŞAMA 1: Planların Ayrıştırılması

Amaç:

- `PLAN.md` dosyasını kurulum planı olarak bırakmak
- `YENIPLAN.md` dosyasını mimari geçiş planı olarak kullanmak

Çıktı:

- kurulum planı ile mimari plan karışmayacak

Durum:

- bu dosya ile başlatıldı

## AŞAMA 2: Director Agent Tanımı

Yapılacak:

- `CLAUDE.md` içinde yeni bir üst katman tanımlanacak
- `ADIM 0` ve kaynak sorgulama bu ajan altında yeniden yazılacak
- hangi durumda hangi ajanların çalışacağı açık kurala bağlanacak

Beklenen sonuç:

- sistem akışı "komut geldi -> Director karar verdi -> ajanlar çalıştı" şeklinde okunur hale gelecek

## AŞAMA 3: AJAN 2'nin Parçalanması

Mevcut:

- tek araştırma ajanı

Hedef:

- `vector-rag` araştırmacısı
- `yargi` araştırmacısı
- `mevzuat` araştırmacısı
- `notebooklm` araştırmacısı

Director Agent bunları paralel veya ihtiyaca göre seçmeli.

Beklenen sonuç:

- daha temiz görev dağılımı
- daha iyi izlenebilirlik
- gerektiğinde yalnızca tek işçiyi çağırabilme

## AŞAMA 4: Dava Bazlı Çalışma Hafızası

Yapılacak:

- yeni dava açılınca opsiyonel NotebookLM çalışma notebook'u tanımlanacak
- Drive klasörü + yerel klasör + notebook adı birlikte üretilecek
- dava hafızası standardı oluşturulacak

Örnek dava hafızası bileşenleri:

- dava klasörü
- dava-bilgileri.md
- kaynak listesi
- NotebookLM notebook adı
- kullanılan araştırma çıktıları

Beklenen sonuç:

- her dosyanın kalıcı çalışma yüzeyi olacak

## AŞAMA 5: Yazım Ajanının Genişletilmesi

Yapılacak:

- AJAN 3 yalnızca dava dilekçesi yazarı olmaktan çıkarılacak
- belge tipine göre şablonlanan bir yazım ajanına dönüştürülecek

Belge türleri:

- dava dilekçesi
- ihtarname
- sözleşme
- itiraz/istinaf taslağı
- hukuki görüş notu

Beklenen sonuç:

- görseldeki "Dilekçe / İhtarname / Sözleşme" yaklaşımına yaklaşılır

## AŞAMA 6: Otonom Döngünün Güçlendirilmesi

Yapılacak:

- haftalık içtihat taraması korunacak
- ama buna ek olarak olay tetiklemeli akışlar tanımlanacak

Örnek tetikler:

- yeni dava açıldı
- yeni belge Drive'a düştü
- vektör DB'ye yeni kaynak eklendi
- belirli dava türünde yeni HGK/İBK kararı geldi

Beklenen sonuç:

- sistem pasif arşiv olmaktan çıkar, aktif öneri üreten yapıya döner

## AŞAMA 7: Pazarlama Akışının Veri Hattı

Yapılacak:

- pazarlama ajanının veri girdi kaynakları netleştirilecek
- hangi verinin anonimleştirilerek pazarlamaya akacağı kurala bağlanacak

Beklenen sonuç:

- pazarlama üretimi dava akışından kontrollü beslenir
- KVKK riski düşer

---

## 9. Öncelik Sırası

Önce yapılması gerekenler:

1. Director Agent tanımı
2. AJAN 2'nin parçalanması
3. dava bazlı çalışma hafızası standardı

Sonra yapılması gerekenler:

4. yazım ajanının belge tiplerine genişletilmesi
5. otonom döngünün güçlendirilmesi
6. pazarlama veri hattının netleştirilmesi

Neden bu sıra?

- çünkü önce orkestrasyon netleşmeden otonomluk artırılırsa sistem dağılır
- önce araştırma modülerleşmeden kalite artmaz
- önce hafıza standardı kurulmadan NotebookLM ve Drive birlikte sağlıklı işlemez

---

## 10. Uygulamada Değiştirilecek Ana Dosyalar

Geçiş başladığında en çok etkilenecek dosyalar:

- `CLAUDE.md`
- `notebooklm-kurulum.md`
- yeni oluşturulacak ajan prompt dosyaları
- yeni dava başlatma scripti
- varsa dosya izleyici / otomasyon scriptleri

Kurulum planı olarak `PLAN.md` korunabilir, ama güncel operasyon planı olarak
tek başına yeterli görülmemelidir.

---

## 11. Başarı Kriterleri

Geçiş başarılı sayılacaksa aşağıdakiler sağlanmalı:

- yeni dava komutu geldiğinde Director Agent hangi hattın çalışacağını net seçebilmeli
- usul, araştırma ve yazım ayrımı kullanıcıya görünür şekilde korunmalı
- araştırma dört alt kaynakta izlenebilir olmalı
- dava bazlı NotebookLM notebook kullanımı standartlaşmalı
- Vektör DB kalıcı hukuk hafızası olarak korunmalı
- haftalık tarama dışında olay tetiklemeli öneri akışları tanımlanmış olmalı
- pazarlama üretimi anonim ve kontrollü veri hattından beslenmeli

---

## 12. Bu Planın Sonucu

Bu plana göre doğru yaklaşım şudur:

- mevcut sistemi yıkma
- ilk planı tamamen çöpe atma
- onun üstüne ikinci nesil bir orkestrasyon katmanı kur

Yani geçiş stratejisi:

- kurulum planı korunacak
- operasyon mimarisi yeniden yazılacak
- araştırma modülerleşecek
- NotebookLM daha aktif kullanılacak
- sistem görseldeki yapıya kademeli olarak yaklaşacak

---

## 13. Sonraki Adım Önerisi

Bu dosyadan sonra en doğru sıradaki iş:

1. `CLAUDE.md` için yeni mimari taslak çıkarmak
2. Director Agent bölümünü yazmak
3. AJAN 2'yi alt araştırma ajanlarına bölmek

Bu üçü yapılmadan tam otomasyona geçilmemeli.

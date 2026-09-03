# ASAMA 1 — Olay Çözüm Protokolü (İlk Dava İncelemesi)

**Kaynak:** Dr. Halil Polat, *Teori ve Pratikte Hukuk Nosyonu — Cilt I*, 5. baskı,
İkinci Kısım (s. 35–130) ve Üçüncü Kısım (s. 131 vd.).
Okuma notları: `bilgi-tabani/nosyon-okuma-notlari.md`
**Spec:** `docs/superpowers/specs/2026-09-02-tek-motor-agnostik-toparlama-design.md` §3.4.3

---

## Bu protokol ne yapar

ASAMA 1'in eski hâli bir **tercih formuydu**: dava teorisi ne, ton nasıl olsun,
olmazsa olmaz talepler neler. Bunlar avukatın tercihleridir — ama tercih, olayın
hukuki iskeleti kurulmadan sorulamaz.

Bu protokol o formun **yerine geçmez, önüne geçer.** Önce olay hukuken kurulur,
sonra tercih sorulur. **Sıra tersine çevrilemez.**

Kitabın metodolojisi A'dan P'ye 16 adımdır. Bu protokol yalnız **A–N** aralığını
(dava açılmadan önceki inceleme, s. 38–104) kapsar. Kitabın **O)** adımı
(dava türü, görevli mahkeme, husumet, hukuki sebepler, dava değeri, talep sonucu —
s. 104–127) bizde **ASAMA 3 (usul raporu) + ASAMA 5 (dilekçe)** olarak zaten vardır;
burada tekrarlanmaz.

## Etiket kuralı (bağlayıcı)

Her adım başlığı ya kitaptan sayfa referansı `[s. NNN]` taşır, ya da bizim
eklediğimizi belirten `[SİSTEM EKİ]` taşır. **Kitapta olmayan hiçbir şey kitaba
atfedilmez.** Denetim:

```
python scripts/protokol_kontrol.py ajanlar/director/olay-cozum-protokolu.md
```

## Çıktı kuralı

Her adımın cevabı `00-Briefing.md` içindeki karşılık gelen başlığa yazılır.
Cevabı bilinmeyen adım **boş bırakılmaz**: `EKSİK — müvekkilden sorulacak` yazılır
ve ASAMA 1 çıktısının **"Avukatın Karar Noktaları"** bloğuna taşınır.

Bir adım bilinçli olarak atlanıyorsa, gerekçesi briefing'e yazılır. Sessiz atlama yok.

---

# I. DİNLEME AŞAMASI

### Adım 1 — Görüşme öncesi asgari hazırlık [s. 41]

**Soru:** Bu dava türü hakkında görüşmeye girecek kadar bilgim var mı?

**Nasıl yapılır:**
- Müvekkil adayı hangi konuyla geleceğini bildirmişse, görüşmeden **önce** o konunun
  temel çerçevesi okunur.
- Bizde bu okuma `playbook/{dava-turu}.md` + `dersler/` dosyalarıdır.
- Daha önce bakılmamış bir dava türüyse, temel düzeyde kaynak taranır.

**Briefing karşılığı:** `Ön hazırlık — okunan kaynaklar`

**Atlanırsa ne olur:** Kitap açık: hazırlıksız avukat "olayı kendisi de eksik anlar,
gerekli soruları soramaz ve *maddi olayın anlaşılması* aşaması eksik kalmış olur"
`[s. 41]`. Görüşme verimsiz biter.

### Adım 2 — Müdahalesiz dinleme [s. 39]

**Soru:** Müvekkil, kesintiye uğramadan kendi anlatısını tamamladı mı?

**Nasıl yapılır:**
- Önce hiçbir müdahalede bulunmadan anlatması istenir; **önce kendi sözünü bitirmesi
  beklenir**.
- Bu sırada not alınır ama soru sorulmaz.

**Briefing karşılığı:** `Müvekkilin kendi anlatısı (ham)`

**Atlanırsa ne olur:** Kitap: "En başından soru cevap şeklinde gidilirse, bu
ayrıntıların yakalanması mümkün olmayabilir." `[s. 39–40]` Anlatı sırasında kendiliğinden
gelen ve sonradan sorulamayacak detaylar kaybolur.

### Adım 3 — Eksik ve müphem hususların açıklattırılması [s. 41]

**Soru:** Anlatının hangi noktaları belirsiz kaldı ve bunlar soruldu mu?

**Nasıl yapılır:**
- Ham anlatı bittikten sonra belirsiz kalan her nokta için soru sorulur.
- Kitabın örnekleri `[s. 42]`: "anlaşma yaptık" diyene yazılı anlaşma var mı;
  kiralananı kardeşleriyle işletene sözleşmenin tarafları kim ve kaç kişi
  (davacı/davalı sıfatını kimler alabilir); nafaka talep eden eşe diğer eşin
  maddi durumu.

**Briefing karşılığı:** `Sorulan sorular ve alınan cevaplar`

**Atlanırsa ne olur:** "Fetva anlatışa göre verilir" `[s. 41]` — olay eksik
anlatılmışsa hukukçu ne kadar iyi olursa olsun doğru yorum yapamaz.

### Adım 4 — Kritik verilerin not edilmesi [s. 42]

**Soru:** Tarihler, taraflar, süreler ve tebligatlar kayda geçti mi?

**Nasıl yapılır:** Kitabın saydığı dört küme mutlaka not edilir `[s. 42]`:
- **Tarihler**
- **Taraflara dair veriler**
- **Zamanaşımı ve hak düşürücü süreye** dayanak olabilecek olgular
- **Tebligat yapılmış süreli işler**

**Briefing karşılığı:** `Kritik veriler` tablosu

**Atlanırsa ne olur:** Adım 7 (kronoloji) ve Adım 14–15 (süre denetimi) dayanaksız kalır.

### Adım 5 — Olayın sebebinin irdelenmesi [s. 42]

**Soru:** Müvekkilin anlatmadığı, kendisinden kaynaklanan bir sebep var mı?

**Nasıl yapılır:**
- Müvekkil karşı tarafın kusurlu davranışlarını anlatır ama o davranışlara yol açan
  ve kendisinden kaynaklanan hususları anlatmayabilir `[s. 42]`.
- Kitabın örnekleri: boşanmada eşin kusurlu davranışına neden olan kendi davranışları;
  işten çıkarılan işçinin "sebepsiz çıkarıldım" beyanının ardındaki gerçek sebep.
- Bu, müvekkile karşı bir sorgu değil; **karşı tarafın elindeki malzemenin önceden
  görülmesidir.**

**Briefing karşılığı:** `Olayın arka planı / müvekkil aleyhine olgular`

**Atlanırsa ne olur:** Kitap: "Aksi hâlde karşı tarafın muhtemel hamleleri davayı
akamete uğratabilir." `[s. 42]`

---

# II. OLAYIN KURULMASI

### Adım 6 — Olayın çerçevesinin çizilmesi [s. 42]

**Soru:** Bu olay hangi hukuki kurum etrafında çerçevelenir?

**Nasıl yapılır:**
- Olay, dava veya başvuru konusu edilebilecek hukuki kurum etrafında çerçevelenir.
- Kitabın örneği `[s. 42–43]`: tahliye talebinde çerçeve "tahliye sebebi" etrafında
  çizilir; TBK birçok tahliye sebebi düzenlemiştir ve somut olayda **hangisinin
  koşullarının gerçekleştiği** titizlikle belirlenir. Müvekkil "kira geciktiriliyor,
  hemen tahliye açalım" diyebilir; oysa yazılı temerrüt ihtarı veya iki yazılı ihtar
  gibi ön koşullar gerekir.
- Bir olay birden fazla çerçeveye girebilir: ölümlü **ve** yaralamalı trafik kazasında
  hem destekten yoksun kalma hem bedensel zarar tazminatı gündeme gelir `[s. 42]`.

**Briefing karşılığı:** `Olayın hukuki çerçevesi`

**Atlanırsa ne olur:** Yanlış çerçeve, sonraki bütün adımları yanlış yere taşır.

### Adım 7 — Kronolojinin çıkarılması [s. 43]

**Soru:** Olay tarih sırasıyla nasıl gelişti?

**Nasıl yapılır:**
- Tarih bazlı olaylar sırayla yazılır: hukuki ilişki nasıl başladı, ne şekilde
  uyuşmazlığa döndü, süreçte hangi vakıalar gerçekleşti, daha önce dava konusu olan
  bir durum var mı, ihtar çekilmiş mi, kısmi de olsa ödeme yapılmış mı ve hangi
  tarihte `[s. 43]`.
- Kitap iki tam örnek kronoloji veriyor (kira uyuşmazlığı ve boşanma/mal tasfiyesi)
  `[s. 43]`.

**Briefing karşılığı:** `Kronoloji` (tarih | olay | dayanak belge)

**Atlanırsa ne olur:** Kitap: "Kronoloji, çoğu kez bir malvarlığı veya hakkın talep
edilebilip edilemeyeceği hususlarında bir veri teşkil eder." `[s. 44]` Örnek: evlenme
üzerinden bir yıl geçmemişse anlaşmalı boşanma açılamaz — bu ancak kronolojiden görülür.

### Adım 8 — Gereksiz ve çekişmesiz hususların ayıklanması [s. 44]

**Soru:** Uyuşmazlık tam olarak nerede düğümleniyor?

**Nasıl yapılır:**
- Gereksiz detaylar ile **üzerinde ihtilaf bulunmayan** olgular ayrıştırılır.
- Kitabın örnekleri `[s. 44]`: trafik kazasında kamera kaydı varsa hangi aracın
  nereden geldiğine dair anlatımın önemi kalmaz; kira ilişkisinde ödenmiş bedellerde
  uyuşmazlık yoksa onlar da ayıklanır.
- Kalan çekişmeli çekirdek, bizim **"kritik nokta"** dediğimiz şeydir.

**Briefing karşılığı:** `Çekişmeli çekirdek (kritik nokta)` + `Çekişmesiz kabul edilenler`

**Atlanırsa ne olur:** Kitap bu tespiti "hukukçunun yapacağı **en önemli**
tespitlerden biri" sayar `[s. 44]`. Ayıklanmazsa araştırma ve dilekçe, tartışma
konusu olmayan hususlara emek harcar.

> **Sistem notu (bizim):** Bugüne kadar kritik noktayı avukattan **hazır** alıyorduk.
> Kitap onu bu ayıklama işlemiyle **ürettiriyor**. Avukat kritik noktayı vermişse bu
> adım onun **doğrulanması** olarak çalışır: ayıklama sonucu aynı noktaya çıkıyor mu?

---

# III. HUKUKİ TEŞHİS

### Adım 9 — Uyuşmazlığın kaynağının belirlenmesi [s. 45]

**Soru:** Bu borç/uyuşmazlık nereden doğuyor?

**Nasıl yapılır:** TBK sistematiğine göre tasnif edilir `[s. 45]`:
- **Sözleşme** (TBK m. 1–48)
- **Haksız fiil** (TBK m. 49–76)
- **Sebepsiz zenginleşme** (TBK m. 77–82)
- **Diğer** — aile, miras, eşya vb. kendi özel kurallarına tâbidir `[s. 83, 85]`

**Kaynak birden fazla olabilir.** Kitabın örneği: kiralanan mala zarar verilmesi hem
haksız fiil hem kira sözleşmesine aykırılıktır `[s. 45]`.

**Briefing karşılığı:** `Uyuşmazlığın kaynağı`

**Atlanırsa ne olur:** Uygulanacak norm yanlış ailede aranır.

### Adım 10 — Kaynağa göre teşhis zincirinin yürütülmesi [s. 46]

**Soru:** Kaynağın kendi kontrol listesi baştan sona işletildi mi?

**Nasıl yapılır:** Adım 9'da belirlenen kaynağın zinciri sırayla yürütülür:

**Sözleşmeden doğuyorsa** `[s. 46–68]`:
sözleşme türü `[s. 48]` → uygulanacak kanun `[s. 48]` → kurulup kurulmadığı `[s. 49]`
→ geçerlilik şekline uygunluk `[s. 51]` → fiil ehliyeti `[s. 59]` → irade bozukluğu
ve aşırı yararlanma `[s. 62]` → kesin hükümsüzlük `[s. 64]` → uyuşmazlığın neye
ilişkin olduğu `[s. 68]`

**Haksız fiilden doğuyorsa** `[s. 69–75]`:
haksız fiil niteliği `[s. 70]` → kusur ehliyeti `[s. 74]` → kusur durumu `[s. 74]`
→ ilişkili kanunlar `[s. 75]`

**Sebepsiz zenginleşmeden doğuyorsa** `[s. 75–83]`: sebepsiz zenginleşmenin esasları.

**Briefing karşılığı:** `Teşhis zinciri` (her halka: sonuç + dayanak)

**Atlanırsa ne olur:** Kitap uygulamadan şikâyet ediyor: dilekçelerde aynı anda
ehliyetsizlik, vekâletin kötüye kullanılması ve hileden söz edilip hangi hukuki
sebebe dayanıldığının belirsiz bırakıldığı görülüyor `[s. 44]`.

### Adım 11 — Yabancılık unsuru denetimi [s. 85]

**Soru:** Olayda yabancılık unsuru var mı?

**Nasıl yapılır:**
- Taraflardan biri yabancı uyruklu mu, ikametgâh yurt dışında mı, yurt dışı firmayla
  sözleşme var mı, olay yurt dışında mı gerçekleşti?
- Varsa **önce uygulanacak hukuk tespit edilir, sonra hukuki analize geçilir**
  (MÖHUK) `[s. 85]`.

**Briefing karşılığı:** `Yabancılık unsuru: VAR / YOK`

**Atlanırsa ne olur:** Türk hukuku varsayımıyla yürütülen analiz baştan geçersiz olur.

### Adım 12 — Akla gelebilecek hukuki çarelerin envanteri [s. 133]

**Soru:** Bu olay için hangi hukuki çareler **mümkün**? (tek değil, hepsi)

**Nasıl yapılır:**
- Kitabın Üçüncü Kısım'daki her örneği "AKLA GELEBİLECEK HUKUKİ ÇARELER" başlığıyla
  ilerler ve bu başlık **çoğuldur**. Örnek 1'de tek olay için muris muvazaası `[s. 133]`
  **ve** tenkis `[s. 138]` yan yana analiz edilir; Örnek 2'de tapu iptali-tescil
  `[s. 144]` **ve** sebepsiz zenginleşmeye dayalı alacak `[s. 146]`.
- Her çare için kitabın kendi alt başlıkları uygulanır `[s. 133–137]`:
  1. Çareyle ilgili genel açıklamalar (unsurlar/koşullar)
  2. Somut olayın analizi — koşullar bu olayda var mı
  3. Müstakbel davacıya sorulacak ve araştırılacak hususlar
  4. Usuli hususlar
  5. Harç ve masraflara dair hususlar
- Çareler **karşılaştırılır**; hangisinin seçildiği ve **diğerlerinin neden
  seçilmediği** yazılır.

**Briefing karşılığı:** `Hukuki çare envanteri` (çare | koşullar | somut olayda | karar)

**Atlanırsa ne olur:** Tek çareye kilitlenmek, kitabın bütün örnek çözümlerinin
karşı çıktığı metodolojik hatadır. Daha lehe veya daha kolay ispatlanabilir bir
çare gözden kaçar.

### Adım 13 — Koşulları gerçekleşmemiş kural ve müesseselerin elenmesi [s. 86]

**Soru:** Akla gelen ama koşulları **oluşmayan** ne var?

**Nasıl yapılır:**
- Adım 12'de listelenen her çare için uygulanma koşullarının oluşup oluşmadığı
  irdelenir. Kitabın örneği `[s. 86]`: her kira borcunun ödenmemesi tahliye sebebi
  oluşturmaz; TBK m. 315 yazılı ihtar, m. 352/2 aynı kira döneminde iki haklı yazılı
  ihtar şartı arar.
- Ayrıca uygulamayı **tamamen engelleyen** hâller denetlenir `[s. 86–87]`:
  emredici kurallara aykırılık (TBK m. 27), ehliyetsizlik (TMK m. 9), şekil
  eksikliği, ahlâka aykırılık.

**Briefing karşılığı:** `Elenen çareler ve eleme gerekçesi`

**Atlanırsa ne olur:** Bu adım, kitabın hukuk nosyonu tanımındaki "hangi hükümlerin
uygulanabileceğini **veya uygulanmayacağını**" `[s. 21]` ifadesinin karşılığıdır.
Neyin olmayacağını göstermeden yapılan seçim, seçim değildir.

---

# IV. YAPILABİLİRLİK VE YOL HARİTASI

### Adım 14 — Zamanaşımı denetimi [s. 93]

**Soru:** Zamanaşımı doldu mu, dolmak üzere mi?

**Nasıl yapılır:** Kitap üç ayrı bakış tanımlar `[s. 93–94]`:
- **Davacı avukatı yönüyle:** müessese belirlendikten sonra zamanaşımı süresi
  öngörülmüş mü, öngörülmüşse geçmiş mi **mutlaka** incelenir. Süre dolmuşsa
  müvekkile **tüm açıklığıyla izah edilir** ve davanın buna rağmen açılıp
  açılmayacağı **birlikte kararlaştırılır** (zamanaşımı borcu eksik borç hâline
  getirir; hâkim re'sen dikkate alamaz, karşı taraf def'i ileri sürerse ret gündeme
  gelir). Süre dolmak üzereyse hızlı hareket edilir ve müvekkil net biçimde uyarılır.
- **Davalı avukatı yönüyle:** dilekçe tebliğ edilince ilk işlerden biri zamanaşımı
  kontrolüdür. Zamanaşımı **def'idir, itiraz değildir**; **ön inceleme aşamasının
  sonuna kadar** ileri sürülmelidir `[s. 94]`.
- **Hâkim yönüyle:** re'sen dikkate alamaz; ancak def'inin süresinde ve usulüne
  uygun yapılıp yapılmadığını re'sen inceler `[s. 94]`.

Alacağın **bir kısmı** zamanaşımına uğramış olabilir; bu da müvekkile bildirilir
(işçilik alacaklarında 5 yıl örneği) `[s. 93]`.

**Briefing karşılığı:** `Zamanaşımı` (süre | başlangıç | durum | müvekkile bildirim)

**Atlanırsa ne olur:** Dava, esasa hiç girilmeden def'i ile düşer; masraf müvekkilde kalır.

### Adım 15 — Hak düşürücü süre denetimi [s. 95]

**Soru:** Hak düşürücü süre var mı, geçti mi?

**Nasıl yapılır:**
- Uyuşmazlığın hak düşürücü süreye tâbi olup olmadığı denetlenir; varsa süre geçmişse
  müvekkile **açıkça** bildirilir: sonuç alınamayacağı **ve masrafların üzerinde
  bırakılacağı** net ifade edilir `[s. 95]`.
- **Zamanaşımından farkı** `[s. 95]`: zamanaşımında borç eksik borç hâline gelir,
  hak düşürücü sürede **hakkın özü** sona erer. Hak düşürücü süre **kamu düzenindendir**,
  hâkim **re'sen** dikkate alır, **yargılamanın her aşamasında** ileri sürülebilir,
  durma ve kesilme söz konusu değildir.

**Briefing karşılığı:** `Hak düşürücü süre` (kaynak madde | süre | durum)

**Atlanırsa ne olur:** Zamanaşımının aksine karşı tarafın ileri sürmesi gerekmez;
hâkim kendiliğinden reddeder.

### Adım 16 — İspat edilebilirlik tartısı [s. 96]

**Soru:** Haklıyız da — ispat edebiliyor muyuz?

**Nasıl yapılır:**
- "Dava açıldığında eldeki delillerin **ispata elverişli olup olmadığı tartılmalıdır**"
  `[s. 97]`.
- İspat yükünün kimde olduğu belirlenir (HMK m. 190); senetle ispat zorunluluğu
  (HMK m. 200) ve senede karşı tanık yasağı (HMK m. 201) denetlenir `[s. 97–98]`.
- **Delilleri düşünmek avukatın işidir.** Kitap: müvekkil çoğunlukla fatura, dekont,
  sözleşme, tanık gibi genel delilleri görür; oysa deliller bunlarla sınırlı değildir
  `[s. 98]`. Dava türü bazlı örnekler: boşanmada otel/kamera/mesaj kayıtları ve varsa
  ceza dosyası; iş davalarında maaş bilgileri, giriş-çıkış kayıtları, bordrolar,
  puantaj, SGK hizmet dökümü; muris muvazaasında murisin ve devralanın ekonomik-sosyal
  durumu, murisin satma ihtiyacı, rayiç değer ile tapudaki bedel farkı, devirler arası
  süre `[s. 98]`.
- Kazanma/kaybetme olasılığı **müvekkile açıklanır ve onun kararına göre hareket
  edilir** `[s. 99]`. Kitap uyarıyor: davacı açıkça haklı olsa bile haklılığın
  ispatı mümkün olmayabilir (elden ödeme örneği) `[s. 99]`.
- İspat zayıfsa **terditli talep** düşünülür: mutlak sebep varsa ona öncelik verilir,
  ispatı zayıfsa diğer sebepler terditli istenir `[s. 99]`.

**Briefing karşılığı:** `İspat tartısı` (vakıa | ispat yükü | elimizdeki delil | yeterli mi)

**Atlanırsa ne olur:** Kazanılabilir görünen dava, delil yokluğundan kaybedilir.

### Adım 17 — Karşı tarafın muhtemel hamlelerinin masaya yatırılması [s. 100]

**Soru:** Karşı taraf ne yapar ve biz şimdiden ne yapmalıyız?

**Nasıl yapılır:** Kitap iki tür hamle ayırıyor `[s. 100]`:
- **Fiilî hamleler** — mal kaçırma, delil karartma, taşınmazı iyiniyetli üçüncü kişiye
  devretme. Karşılığı: **ihtiyati haciz**, **ihtiyati tedbir**, el atma olgusunun
  fotoğraf/video ile tespiti. Kitap bunları **dava ile birlikte** talep etmeyi
  öngörür.
- **Hukuki hamleler** — zamanaşımı ve hak düşürücü süre savunması, ödeme def'i,
  husumet itirazı, şekle aykırılık, imza itirazı, kusura itiraz, illiyet bağı itirazı,
  ispata yönelik itirazlar (senetle ispat gereği, husumetli tanık), görev ve yetki
  itirazı, derdestlik, kesin hüküm.
- Her muhtemel itiraz için **şimdiden cevap hazırlanır** ve müvekkil bilgilendirilir
  `[s. 100]`.

**Briefing karşılığı:** `Karşı tarafın muhtemel hamleleri` (hamle | türü | önlem)

**Atlanırsa ne olur:** Kitap bu adımı **dava açılmadan önce** istiyor. Bizde savunma
simülasyonu (ASAMA 6) dilekçe yazıldıktan sonra çalışıyor — o zaman alınacak önlem
(ihtiyati tedbir/haciz) için geç kalınmış olabilir.

> **Sistem notu (bizim):** Bu adım ASAMA 6'yı iptal etmez. ASAMA 6 yazılmış dilekçeyi
> sınar; bu adım ise **dava açılmadan alınması gereken önlemleri** yakalar. İkisi
> farklı işlerdir.

### Adım 18 — Tahsil kabiliyetinin tespiti [s. 100]

**Soru:** Kazanırsak tahsil edebilir miyiz?

**Nasıl yapılır:**
- Konusu para ile ölçülebilen her işte, karşı tarafın malvarlığı ve tahsil imkânı
  değerlendirilir `[s. 100–101]`.
- Sonuç müvekkille **müzakere edilir**. Kitap müvekkilin "biz davayı açalım, onun
  haksız olduğu ortaya çıksın" veya "bu haciz tehdidi ile yaşasın" diyebileceğini,
  **bunun onun tercihi olduğunu** açıkça yazıyor `[s. 101]`.

**Briefing karşılığı:** `Tahsil kabiliyeti` (tespit | müvekkilin kararı)

**Atlanırsa ne olur:** Kazanılan dava, tahsil edilemeyen ilamla ve müvekkilin
üzerinde kalan masrafla sonuçlanır.

### Adım 19 — Yol haritasının belirlenmesi [s. 101]

**Soru:** Hangi yol? Dava mı, ihtarname mi, doğrudan icra mı?

**Nasıl yapılır:** Kitabın saydığı seçenekler `[s. 101]`:
- Dava açılması
- Dava açmadan önce **ihtarname** gönderilmesi (örnek: işçinin ödenmemiş ücretleri)
- **Doğrudan icra takibi** — elindeki belgelerle alacak kolayca kanıtlanabiliyorsa
  ilamsız takip denenebilir (itiraz hâlinde İİK m. 67 iptal / m. 68 kaldırma süreçleri
  gündeme gelir; müvekkil yine de bu yolu tercih edebilir)

Dava açılacaksa: hangi dava, **terditli talep olup olmayacağı**. İcra takibi ise:
ne kadarlık alacak için (ödenmiş miktarlarda ihtilaf varsa garanti olsun diye
**ihtilafsız kısım** talep edilebilir) `[s. 101]`.

**Briefing karşılığı:** `Yol haritası` (seçilen yol | gerekçe | terditli talep)

**Atlanırsa ne olur:** ASAMA 3 ve ASAMA 5 hangi işi ürettiğini bilmeden başlar.

### Adım 20 — Müvekkilin giderlerle bilgilendirilmesi [s. 102]

**Soru:** Müvekkil masrafın senaryolara göre ne olacağını biliyor mu?

**Nasıl yapılır:** Kitabın 8 maddelik bilgilendirme metodu `[s. 102–103]`:
1. Davanın türüne göre karar ve ilam harcı ile vekâlet ücretinin **maktu mu nisbi mi**
   olduğu belirlenir.
2. Tam ret hâlinde **her zaman maktu ret harcına** hükmedilirken **vekâlet ücretinin
   nisbi olabileceği** gözetilir (tapu iptali-tescil örneği).
3. Ret hâlinde muhtemel harç ve vekâlet ücreti tutarı hesaplanır.
4. **Usulden ret** ihtimali varsa hatırlatılır (harç ve vekâlet ücreti değişir).
5. Kısmen kabul-kısmen ret hâlinde hesabın nasıl yapılacağı ana hatlarıyla anlatılır.
6. Başlangıç masrafı dava değerine bağlı olduğundan buna göre belirleme yapılır;
   kalan masrafın **hangi aşamada (ıslah, talep artırımı)** yatırılacağı söylenir.
7. Kazanma hâlinde masrafların karşı tarafa yükleneceği; karşı tarafa yüklenen
   vekâlet ücretinin **Av.K. m. 164/5 uyarınca avukata ait olduğu** baştan belirtilir.
8. Keşif ve bilirkişi gibi işlemlerin yaklaşık masrafı ve ne zaman yatırılacağı;
   feragat veya açılmamış sayılma hâlinde harç ve vekâlet ücretinin durumu.

**Briefing karşılığı:** `Gider bilgilendirmesi` (senaryo | harç | vekâlet ücreti | toplam)

**Atlanırsa ne olur:** Müvekkil sürpriz masrafla karşılaşır; avukat-müvekkil
ilişkisinde en sık çatışma noktası budur.

### Adım 21 — Bilgi ve belgelerin temini ve sistematiğe sokulması [s. 103]

**Soru:** Hangi belgeler gerekli, hangileri elimizde, eksikler kimden gelecek?

**Nasıl yapılır:**
- Yol haritası belirlendikten **sonra** belgeler toplanır ve **bir sistematiğe
  sokulur** `[s. 103]`.
- Kitap dava türü bazlı temel listeler veriyor `[s. 103–104]`: tapu iptali-tescil
  (tapu kaydı, resmi senetler, mirasçılık belgesi, nüfus kayıt tablosu, satış vaadi,
  vekâletname, ödeme dekontları); işçilik alacakları (iş sözleşmesi, TİS, bordro,
  SGK dökümü, arabuluculuk anlaşamama tutanağı, işten ayırma tebliğ tutanağı,
  ihtarname ve cevabı); iş kazası (hastane raporları, kaza anı fotoğraf/kamera,
  müfettiş raporu, kısmi ödeme belgeleri).

**Briefing karşılığı:** `Belge listesi` (belge | elde mi | nereden temin)
Çıktı: `04-Muvekkil-Belgeleri/evrak-listesi.md`

**Atlanırsa ne olur:** Dilekçe ekleri eksik kalır; delil sonradan sunulamayabilir.

---

# V. SİSTEME ÖZGÜ ADIMLAR

Bu adımların kitapta karşılığı yoktur; sistemimizin kendi işleyişinden gelir.

### Adım 22 — Büro hafızası eşleştirmesi [SİSTEM EKİ]

**Soru:** Bu kritik nokta daha önce çalışıldı mı?

**Nasıl yapılır:** ASAMA 0 MemPalace wake-up sonuçları ve `dersler/` dosyaları
okunur; eşleşme varsa "MEMORY MATCH" olarak briefing'e yazılır.

**Gerekçe:** Kitabın "kovaya damlayan su damlaları" `[s. 22]` fikrinin dosya
sistemine yazılmış hâli — ama mekanizma bizimdir, kitapta yoktur.

### Adım 23 — Evrak kaynağının belirlenmesi [SİSTEM EKİ]

**Soru:** Dava evrakı nereden gelecek?

**Nasıl yapılır:** UYAP (`dava-cli clone`) / NotebookLM / Drive / yerel dosya /
kaynak yok seçenekleri avukata sorulur; seçilen kaynak briefing'e yazılır.
UYAP evrakı Yargı PRO `dava-cli` ile çekilir (`.claude/skills/yargi-uyap-workspace/SKILL.md`).

**Gerekçe:** Kitap 2025 basımlıdır ve dijital dosya çekme araçlarını konu almaz.

### Adım 24 — Avukatın tercihleri [SİSTEM EKİ]

**Soru:** Ton, risk toleransı, olmazsa olmaz talepler?

**Nasıl yapılır:** Advanced Briefing formunun mevcut soruları. **Bu adım en sonda
kalır** — tercih, hukuki iskelet kurulduktan sonra sorulur.

**Gerekçe:** Bu bizim üslup ve strateji katmanımızdır; kitabın kapsamı dışındadır.

---

## Kapanış kontrolü

- [ ] Adım 1–21 için briefing'de ya cevap ya `EKSİK — müvekkilden sorulacak` var
- [ ] Atlanan her adımın gerekçesi yazılı
- [ ] `EKSİK` işaretli maddeler "Avukatın Karar Noktaları" bloğuna taşındı
- [ ] Adım 12 envanterinde seçilmeyen çarelerin **neden** seçilmediği yazılı
- [ ] Adım 14–15 süre denetimi sonucu müvekkile bildirildi
- [ ] `python scripts/protokol_kontrol.py ajanlar/director/olay-cozum-protokolu.md` → TEMİZ

---

## Teyit kaydı

**Tarih:** 2026-09-02
**Yöntem:** Protokoldeki **36 benzersiz sayfa atfının her biri** için OCR metnindeki
ilgili sayfa yeniden açılıp, iddiada geçen ayırt edici ifadenin o sayfada gerçekten
bulunduğu denetlendi. Bu, DENETCI mantığının kitap çalışmasına uygulanmasıdır.

**Sonuç:** 36/36 atıf teyit edildi. Teyit edilemeyen atıf yok, düzeltme gerekmedi.

**Özel dikkat:** Üç atıf (s. 138 tenkis, s. 144 satış vaadine dayalı tapu iptali-tescil,
s. 146 sebepsiz zenginleşmeye dayalı alacak) **içindekiler sayfasından** türetilmişti;
içindekiler sayfa numaraları kaymış olabileceği için bu üçü ayrıca gövdeden gözle
doğrulandı — üçü de yerinde çıktı.

**Adım dağılımı:** 24 adım — 21'i kitaptan sayfa referanslı, 3'ü `[SİSTEM EKİ]`.
`protokol_kontrol.py` → TEMİZ (etiketsiz adım yok).

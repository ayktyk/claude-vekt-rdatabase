# VektorDB Gecis Plani

Bu plan, [VEKTORDB-YENIDEN-KUR.md](C:\Users\user\Desktop\projelerim\Vektör Database li Otomasyon Claude Code\VEKTORDB-YENIDEN-KUR.md)
icindeki dogru fikirleri koruyup riskli kisimlari ayiklayarak hazirlandi.

Amac:

- bozuk OCR ve mojibake dolu eski veri hattindan cikmak
- ama mevcut sistemi korumasiz sekilde silmemek
- temiz kaynaklari secerek yeni bir `markdown-temiz -> akilli parcala -> temiz ChromaDB`
  hattina gecmek

## 1. Mevcut Durum Tespiti

Asagidaki bulgular yerelde mevcut dosyalardan dogrudan goruldu:

- mevcut isleme hattinda `Tesseract OCR` agirlikli bir yapi var:
  - [ocr-toplu-isle.py](D:\hukuk-vektordb\ocr-toplu-isle.py)
  - [dosya-izleyici.py](D:\hukuk-vektordb\dosya-izleyici.py)

- OCR ciktilari dogrudan `islenmis/*.json` dosyalarina gidiyor
- ara temiz katman olarak `markdown-temiz/` yok
- mevcut `islenmis` dosyalarinda yaygin mojibake var:
  - `Ã§`, `Ä±`, `ÅŸ` gibi bozuk karakter dizileri acikca gorunuyor
- loglar taranmis PDF'lerin tamamen OCR ile gecildigini ve kalite riskini gosteriyor:
  - [izleyici.log](D:\hukuk-vektordb\loglar\izleyici.log)
  - [ocr-stdout.log](D:\hukuk-vektordb\loglar\ocr-stdout.log)

- mevcut vector yukleme hattinda veri dogrudan JSON'dan embed ediliyor:
  - [vektor-yukle.py](D:\hukuk-vektordb\vektor-yukle.py)

- mevcut MCP sunucusu bu bozuk veriyi servis ediyor:
  - [sunucu.py](D:\hukuk-vektordb\mcp-sunucu\sunucu.py)

Sonuc:

Eski pipeline teknik olarak calisiyor ama veri kalitesi guvenilir degil.
Bu nedenle `aynı veri üstüne makyaj` yapmak yerine, secili kaynaklarla yeni bir temiz hat kurmak gerekli.

## 2. VEKTORDB-YENIDEN-KUR.md Icin Karar

Bu dosyadaki en dogru fikirler:

- `ham kaynak` ile `islenmis chunk` arasina `markdown-temiz` katmani koymak
- OCR / metin cikarma ile chunking'i ayirmak
- belge tipine gore farkli parcalama stratejisi kullanmak
- MCP sunucusunu temiz metadata ve daha iyi filtre mantigiyla yeniden kurmak
- sifirdan temiz bir ChromaDB koleksiyonu olusturmak

Bu dosyadaki riskli veya revize edilmesi gereken kisimlar:

- mevcut DB'yi hemen silmek
- tum kaynaklari tek seferde yeniden islemek
- tamamen `D:\` yoluna hardcode olmak
- watcher'in klasor bazli toplu script tetiklemesi nedeniyle ayni dosyalari tekrar tekrar isleme riski
- mojibake duzeltme tablosunun kendisinin de bozuk karakter tasimasi
- `tek komutta her seyi calistir` yaklasiminin hata izolasyonunu zorlastirmasi

Karar:

Dosya oldugu gibi uygulanmayacak.
Mantigi alinacak, ama daha guvenli bir gecis planiyla uygulanacak.

## 3. Yeni Hedef Mimari

Yeni hedef su olmali:

1. `Kaynak secimi`
2. `Ham dosya kopyasi / referansi`
3. `Temiz markdown uretimi`
4. `Kalite kontrol`
5. `Belge tipine gore parcala`
6. `Temiz ChromaDB koleksiyonuna yukle`
7. `MCP ile test et`
8. `Eski DB'den yeni DB'ye kontrollu gecis`

Yeni klasor mantigi:

```text
D:\hukuk-vektordb\
  pdf-kaynak\
  markdown-temiz\
    doktrin\
    buro-arsivi\
    mevzuat\
    kararlar\
  islenmis-v2\
  vektor-db-v2\
  pipeline\
  mcp-sunucu\
  loglar\
```

Kritik nokta:

`vektor-db-v2` ve `islenmis-v2` ilk asamada eski sistemden AYRI tutulmali.
Eski `vektor-db` hemen silinmemeli.

## 4. Guvenli Gecis Stratejisi

### Faz 1: Donmus analiz

Ilk fazda hicbir veri silinmez.

Yapilacaklar:

- mevcut `vektor-db` sadece okunur referans olarak birakilacak
- mevcut `islenmis` klasoru korunacak
- yeni hat icin `markdown-temiz`, `islenmis-v2`, `vektor-db-v2` acilacak

Amac:

- eski sistemden kopmadan yeni hatti dogrulamak

### Faz 2: Secili kaynaklarla pilot yeniden isleme

Tum kutuphane degil, sadece senin sececegin kaynaklar islenecek.

Oncelikli pilot kaynak tipleri:

- kaliteli doktrin PDF'leri
- secili buro arsivi belgeleri
- temiz taranmis ama degerli kitaplar

Bu fazda:

- her kaynak icin once dijital mi taranmis mi tespit edilir
- dijitalse dogrudan metin cikartilir
- taranmissa Gemini OCR kullanilir
- cikti `markdown-temiz` altina kaydedilir

Amac:

- pipeline'in kalitesini kucuk bir veri setiyle kanitlamak

### Faz 3: Akilli parcala + test collection

Temiz markdown dosyalari:

- mevzuat ise madde bazli
- karar ise bolum bazli
- doktrin ise baslik / alt baslik bazli
- buro arsivi ise belge turune gore daha kisa parcali

parcalanir ve `islenmis-v2` altina JSON olarak yazilir.

Sonra:

- `vektor-db-v2` icinde yeni bir collection olusturulur
- sadece pilot veri buna yuklenir

Amac:

- sorgu kalitesini eski sistemle kiyaslamak

### Faz 4: MCP test ve kalite kontrolu

Bu fazda yeni MCP sunucusu veya mevcut MCP'nin yeni collection'a bakan versiyonu test edilir.

Kontrol sorulari:

- Turkce karakterler temiz mi
- paragraflar okunabilir mi
- ayni kaynaktan sacma kesilmeler var mi
- sorgu sonucunda gercekten isimize yarar pasajlar geliyor mu
- metadata filtreleri calisiyor mu

### Faz 5: Eski sistemden yeni sisteme gecis

Ancak pilot veri basarili oldugunda:

- `vektor-db-v2` ana DB olur
- MCP ayari yeni DB'ye cevrilir
- eski DB yedek olarak tutulur

Bu noktadan sonra istenirse eski DB temizlenebilir.

## 5. Teknik Olarak Ne Degisecek

### A. OCR katmani degisecek

Eski durum:

- agirlikli `Tesseract` OCR
- cok sayida mojibake ve kalite kaybi

Yeni durum:

- taranmis PDF'lerde Gemini OCR
- dijital PDF'lerde OCR yerine dogrudan text extraction

Karar:

`Tesseract` tamamen silinmek zorunda degil, ama birincil yol olmamali.

### B. Ara markdown katmani zorunlu olacak

Eski durum:

- PDF -> JSON -> embedding

Yeni durum:

- PDF -> temiz markdown -> kontrol -> JSON -> embedding

Bu katman zorunlu cunku:

- kalite gozle kontrol edilebilir
- yeniden chunking kolay olur
- ayni markdown farkli stratejiyle tekrar islenebilir

### C. Chunk stratejisi belge tipine gore ayrilacak

Eski durum:

- genel overlap mantigi

Yeni durum:

- mevzuat: madde bazli
- kararlar: ozet / gerekce / sonuc bolumleri
- doktrin: baslik / alt baslik
- buro arsivi: daha kisa, pratik odakli chunklar

### D. Metadata daha disiplinli olacak

Minimum metadata alani:

- `kaynak_dosya`
- `kaynak_tipi`
- `kategori`
- `bolum`
- `sayfa`
- `isleme_yontemi`
- `hash`
- `orijinal_yol`

### E. MCP katmani query/passage standardina gore duzeltilecek

`multilingual-e5-large` kullaniliyorsa:

- indexing sirasinda `passage: `
- query sirasinda `query: `

disiplini korunmali.

## 6. Google Drive Kaynaklari Nasil Islenecek

Benim tarafimdan dogrudan yapilabilecek model su:

- sen bana `Google Drive` linki degil, yerel sistemde erisilen dosya/klasor yolu verirsin
- ornek:
  - `D:\GoogleDrive\Hukuk\Doktrin\...`
  - `C:\...\Google Drive\...`
  - mount varsa `G:\...`

Ben ne yapabilirim:

- bu yerel yoldaki secili PDF veya klasoru okuyabilirim
- kopyalamadan referans olarak isleyebilirim
- veya yeni klasor yapisina kontrollu sekilde alabilirim

Ben ne yapamam:

- `drive.google.com/...` paylasim linkinden dogrudan cekme
- Google Drive API ile gizli erisim kurma, eger yerel mount veya sync yoksa

Dogru is akis modeli:

1. Sen kaynak yolunu verirsin
2. Ben o kaynagi okur ve tipini cikaririm
3. Pilot isleme listesi cikaririm
4. Onaydan sonra yeni pipeline ile islerim

## 7. Uygulama Sirasi

En dogru teknik siralama bu:

1. mevcut sistemi silmeden yeni `v2` klasorlerini ac
2. mevcut scriptleri analiz ederek yeniden yazilacak parcayi ayir
3. `pipeline/utils.py` yaz
4. `02-pdf-dijital.py` yaz
5. `01-ocr-gemini.py` yaz
6. `04-parcala.py` yaz
7. `05-yukle.py` yaz
8. `mcp-sunucu/sunucu.py` icin v2 versiyon hazirla
9. secili pilot kaynaklarla test et
10. kaliteyi gorunce `.mcp.json` gecisini yap

## 8. Ne Yapmayacagiz

Su asamada bunlari yapmayacagiz:

- eski DB'yi hemen silmek
- tum kutuphaneyi tek seferde yeniden islemek
- otomatik watcher'i ilk gunden tum sisteme acmak
- Google Drive linklerinden uzaktan dosya cekmeye calismak

Sebep:

- once dogru veri kalitesini kanitlamak gerekiyor
- aksi halde yeni sistem de eski hatalari daha pahali sekilde tekrarlar

## 9. Sonuc

Dogru yol:

`tam temiz ve kontrollu v2 pipeline`

Yanlis yol:

`eski sistemi bir gecede silip tum kutuphaneyi tekrar OCR'dan gecirmek`

Bu gecis planina gore ilk pratik is paketi su olmali:

1. `v2` klasor yapisini kurmak
2. yeni pipeline dosyalarini yazmak
3. senin verecegin ilk secili Google Drive / yerel kaynak yolunu pilot olarak islemek

Bir sonraki adim:

Bu plani [GELISTIRME.md](C:\Users\user\Desktop\projelerim\Vektör Database li Otomasyon Claude Code\GELISTIRME.md)
icine operasyonel gorevler olarak tasimak veya dogrudan `v2 pipeline` dosyalarini olusturmaya baslamak.

# Av. Aykut YESILKAYA -- Ozel Uslup Parmak Izi

Son guncelleme: 2026-04-21
Kaynak: `G:\Drive'im\17 OCAK 2026 YEDEK MASAUSTU\dava dilekçelerim\` (10 UDF)
  + `tiff2pdf.md` (TIF OCR, 3 dilekce + 1 ihtarname)
Cikarim:
- UDF tabanli: 3.udf (tapu iptal), 6.udf (deger kaybi), 9.udf (soyadi degisikligi),
  11.udf (ecrimisil), 13.udf (bedensel zarar), 2.udf (haksiz fiil tazminat),
  7.udf (itirazin iptali), 5.udf (nufus kaydi duzeltme), 10.udf, 12.udf
- TIF/OCR tabanli: Istanbul Asliye - Necibe BÜYÜK (muris muvazaasi + ihtiyati
  tedbir, 19.12.2019), Inebolu Asliye - mirasta iade/tenkis (11.11.2019),
  Istanbul Anadolu Tuketici - ayipli arac (21.10.2019), Savas TUNA Ihtarnamesi
  (03.10.2019)

Bu dosya Ajan 3 (Belge Yazari) icin zorunlu few-shot kaynagidir. Dilekce
yazmadan once okunur. Uslup her ornekten degil, **tekrar eden kaliptan**
alinir. Tek ornekte olan ozellik kural sayilmaz.

**OCR UYARISI:** TIF kaynakli 4 ornek (tiff2pdf.md) harici OCR ciktisidir.
Turkce karakterlerde bozulma (s/c/i/o/u, soft g), kaybolan harf, stray
token'lar (GPL, GPCek) icerir. **Yapisal kaliplar** (mahkeme basligi,
numaralandirma, imza bloku, EKLER formati, HARCA ESAS DEGER satiri,
karar atif cercevesi) bu kaynaktan guvenilir sekilde cikarilir. Ancak
**kelime bazli verbatim alinti** icin sadece UDF kaynakli 10 ornek
kullanilir.

---

## 1. Mahkeme Basligi

| Kural | Ornek |
|---|---|
| Tek satir, ALL CAPS | `GAZIOSMANPASA ASLIYE HUKUK MAHKEMESI` |
| Uzun unvan tek satir | `ISTANBUL ANADOLU ADLIYESI TUKETICI MAHKEMESI HAKIMLIGINE` |
| Sayin Hakimlige suffixi | `ISTANBUL ASLIYE HUKUK MAHKEMESI SAYIN HAKIMLIGINE` |
| Apostrof varyanti | `CARSAMBA ASLIYE HUKUK MAHKEMESI SAYIN HAKIMLIGI'NE` |

Suffix kullanim kurallari:
- `MAHKEMESI` tek basina: kisa/dogrudan basligi tercih eden davalar
- `MAHKEMESI HAKIMLIGINE`: tuketici/ozel mahkemelerde daha sik
- `MAHKEMESI SAYIN HAKIMLIGINE`: resmi/ciddiyet vurgusu gereken davalar (muris
  muvazaasi, tapu iptal gibi)
- `HAKIMLIGI'NE` (apostroflu): eski imla, bazi buyuk sehir ASLIYE
  mahkemelerinde

### Ihtiyati Tedbir Flag'i (Opsiyonel)

Ihtiyati tedbir/haciz talepli davalarda mahkeme basligi ile DAVACI satiri
**arasinda kendi satirinda** konur:

```text
ISTANBUL ASLIYE HUKUK MAHKEMESI SAYIN HAKIMLIGINE

IHTIYATI TEDBIR TALEPLIDIR.

DAVACI   : ...
```

- Kendi satirinda, arkasinda bir bos satir
- Tam buyuk harf, sonu nokta
- Sadece ihtiyati tedbir/ihtiyati haciz talep edilen davalarda kullanilir
- Tapu iptal, ticari plaka/arac konulu davalarda cok yaygin

YAPMA: `T.C. ... MAHKEMESI` sekilde TC ibaresi basa (kullanmiyor).
YAPMA: `Sayin Hakimligine` kucuk harfle (hep buyuk).
YAPMA: Ihtiyati tedbir talebi yokken tedbir flag'i koymak.

---

## 2. Taraf Bilgisi

Yapi:
```text
DAVACI		: [Ad SOYAD] (T.C. Kimlik No: XXXXXXXXXXX)
		  [Mahalle Mah. Sokak Sk. No:X/Y Ilce/SEHIR]

VEKILI		: Av. Aykut YESILKAYA
		  [buro adresi]
```

Format kurallari:
- Ad-soyad: **Ad Title Case, SOYAD ALL CAPS** -- `Kenan ILKAZ`, `Zeynep SEKER`
- TC formati iki seceneklidir, dava turune gore:
  - Genel: `(T.C. Kimlik No: XXXXXXXXXXX)`
  - Icra/ticari: `(TCKN: XXXXXXXXXXX)`
- Sehir genelde ALL CAPS (`ISTANBUL`, `KIRKLARELI`) ama bazen Title Case
- Kimlik yoksa "Mernis" veya "(MERNIS)" adres yerine
- Ayni taraf birden fazlaysa numarali: `1-)`, `2-)`, `3-)`

### Barosu Sicil Numarasi Varyanti (Opsiyonel)

Bazi dilekcelerde (ozellikle 2019 oncesi ve muris muvazaasi / tuketici
davalari gibi formal dosyalarda) vekil satirinda barosu sicil numarasi
parantez icinde eklenir:

```text
VEKILI   : Av. Aykut YESILKAYA (Istanbul Barosu Sicil No:61223)
           [buro adresi]
```

Kullanim:
- Istanbul, Inebolu, Carsamba baro dilekcelerinde yaygin
- Modern dilekcelerde sicil numarasiz format tercih ediliyor
- Her iki format da gecerli -- dava turune gore Ajan 3 secer

Tab karakterleri: Aykut'un orijinalinde girintiler tab ile, MD'de 2-3 bosluk
ile hizalama yapilir. UDF'ye donusunce Windows tabs'a cevrilir.

---

## 3. KONU Formati

Tipik kapanislar (sirayla en sik):

1. `... isteminden ibarettir.`
2. `... talebi/talebimizi icermektedir.`
3. `... hakkinda davadir.`
4. `... istemli dava dilekcemizdir.`
5. `... belirsiz alacak davasidir.`
6. `... istemimizden ibarettir.` (tuketici/ayipli mal davalari, muvekkilce
   vurgu -- `Malin Ayipli Cikmasi Nedeniyle Iadesi ve Bedelinin Odenmesi
   Istemimizden Ibarettir.`)

Ornek (6.udf):
> 34 FBD 443 sayili aracin surucusu davalinin, muvekkilim Yasin Kuvanci'ya
> ait 39 ADP 116 plaka sayili araca 29.09.2024 tarihinde asli kusuru ile
> carparak verdigi zarar sebebiyle, muvekkilimin aracinin deger kaybi ve
> ikame arac bedelinin kaza tarihinden itibaren isleyecek faiziyle
> birlikte tazmini isteminden ibaret belirsiz alacak davasidir.

KONU uzun olabilir; 3-5 satira kadar normal. Tek cumlede tum talep
bilesenleri yer alir.

---

## 4. HARCA ESAS DEGER

Uc varyant:
- `HARCA ESAS DEGER : 1.000,00 TL (Fazlaya iliskin haklarimiz sakli kalmak kaydiyla)`
- `HARCA TABI DEGER : 1.000,00 TL (Fazlaya iliskin haklar sakli kalmak kaydiyla)`
- `HARCA ESAS DEGER : 10.000 TL` (sade, sakli hak suffixi olmadan --
  muris muvazaasi gibi mirasla ilgili davalarda yaygin)

Sadece belirli alacak davasinda (arac trafik, deger kaybi, ecrimisil, muris
muvazaasi, tenkis) kullanir. Tapu iptal, nufus duzeltme, soyadi degisikligi
gibi maktu harcli davalarda yazmaz.

Sayi formati:
- Virgullu ondalik kurusla: `1.000,00 TL`
- Yuvarlak bin tl: `10.000 TL` (ondalik yok)
- Iki format da kullaniliyor, tercih dava turune gore degisir

---

## 5. ACIKLAMALAR Bolumu

### Numaralandirma

- Aykut `1-)`, `2-)`, `3-)` kullanir. `1.` veya `1)` degil.
- Bir paragraf = bir numara. Numaralar olay akisini veya hukuki adimi gosterir.
- Bazi dilekcelerde akis halinde (numarasiz) yazilmis olabilir, ama tazminat
  ve tapu davalarinda hemen hemen her zaman numarali.

### Ic Liste Pattern'i (Tire Ile Alt Kalem)

Numarali paragraf icinde somut kalem siralamasi gerekirse (odeme dokumu,
masraf listesi, zarar kalemi) numarali madde basliyip, ardindan tire ile
alt kalemleri yazar. Ornek (tuketici davasi, ayipli arac):

```text
5-) Muvekkil, aldigi aracla ilgili olarak;

   - Expertiz ucreti 250 TL
   - Arac bakim ve servis ucreti 1.250 TL
   - Trafik sigortasi ve kasko bedeli 2.800 TL
   - Yol guzergahindaki yakit giderleri

odemistir. Bu sebeple muvekkilin ugradigi zarar artmis olup, ...
```

Kurallar:
- Iki nokta ile numarali paragraf acilir
- Tire + bosluk + somut kalem + (varsa TL tutari)
- Alt kalemler iki-uc bosluk icerden
- Alt liste bitiminde bir bos satir ve devam cumlesi ayni paragrafta
- Bu yapi YALNIZCA somut kalem gerektigi yerde kullanilir, siradan anlatim
  icinde tire ile liste yapilmaz

### Giris kalibi (olgular)

Kronolojik. Tarih `GG.AA.YYYY` veya `GG/AA/YYYY` (ikisini de karma kullanir).
Tipik kalip:
- `[Tarih] tarihinde [olay kisa cumle].` + ardindan detaylar
- `Muvekkil [isim] ...` / `Muvekkilim ...`

Ornek (13.udf):
> Muvekkil Kenan ILKAZ yolcu olarak bulundugu 39 SL 289 plakali aracin
> 28.02.2020 tarihinde 39 TN 206 plakali aracla kaza yapmasi sonucunda
> ciddi sekilde yaralanmistir.

### Gecis bagcilari (Aykut'un kalip bagclari)

Bu bagclari ordugu dokular metni tanitir:
- `Isbu sebeple...` -- genelde son paragrafa dogru
- `Dolayisiyla...` -- hukuki sonuç balantisi
- `Nitekim...` -- emsal kararin girisi
- `Yargitay X. Hukuk Dairesi'nin ... karari` -- emsal atif
- `Yine Yargitay...` -- ikinci emsal karari
- `Hal boyle olunca...`
- `Somut olayda...` -- olgu-kurala kopru
- `Bu hususa iliskin olarak...`
- `Bu kapsamda...`
- `Tam bu duruma isaret eden;` -- bir sonraki emsal karari baglar
- `Ancak...` (cumle basinda degil, durum kirilisinda)

YASAK bagclar (bu dilekcelerde hic gecmiyor, AI-tell sinyali):
- `Ozetle,`
- `Sonuc olarak,`
- `Belirtmek gerekir ki,`
- `Sunu ifade etmek gerekir ki,`
- `Genel olarak,`
- `Oncelikle ... Ardindan ... Son olarak` (madde gibi siralama)
- `Ote yandan,` (nadiren, bagc olarak zorunlu degilse kullanmaz)

### Emsal karar alintisi

Sablonlar:

Sablon A (9.udf, 13.udf):
> Yargitay X. Hukuk Dairesi'nin YYYY/ZZZZ Es. YYYY/ZZZZ K. ve GG.AA.YYYY
> tarihli kararinda;
>
> "[alinti metni, cift tirnak, blok]"
>
> seklinde karar tesis edilmistir.

Sablon B (3.udf, 6.udf):
> [Alintinin konusuna dair 1 cumle kopru]. Nitekim konu ile alakali Yargitay
> X. Hukuk Dairesi YYYY/ZZZZ K. YYYY/ZZZZ karari "..." ifadeleri yer almaktadir.

Sablon C -- HGK icin:
> Yargitay Hukuk Genel Kurulu YYYY/XX Esas, YYYY/ZZZ Karar, GG.AA.YYYY Tarihli
> Ictihadi;
>
>     "[alinti]"
>
>     seklinde karar tesis edilmistir.

Sablon D -- ALL CAPS baslikli varyant (TIF orneklerinde, muris muvazaasi):
> Yargitay 1. Hukuk Dairesi YYYY/XXXX Es. YYYY/XXXX Karar ve GG.AA.YYYY tarihli
> kararinda
>
> "[alinti metni]"
>
> ifadeleri yer almaktadir.

Sablon D farki: baslik tek satir (`Ictihadi;` yok), alinti sonrasi `ifadeleri
yer almaktadir` (tesis edilmistir degil). Dava dilekcelerinde daire ismi uzun
olunca bu yapi tercih ediliyor.

Alinti kurallari:
- Cift tirnak (`" "` ya da Turkce tirnak `" "` karma)
- Bazen italik, bazen duz; tutarli kurali yok (MD'de duz yaz)
- Alinti oncesi 1 cumle ile konuyu baglama
- Alinti sonrasi 1 cumle ile "bu karara gore bizim davamizda..." seklinde
  olaya geri donus

---

## 6. HUKUKI SEBEPLER / HUKUKI NEDENLER

Bir satir, kisaltma listesi + "sair ilgili mevzuat":

Ornekler:
- `TMK, TBK, HMK ve sair ilgili mevzuat.`
- `KTK, TBK, HMK ve sair ilgili mevzuat`
- `IIK, TBK, HMK ve ilgili tum mevzuat`
- `Turk Medeni Kanunu, Hukuk Muhakemeleri Kanunu, Turk Ceza Kanunu ve ilgili
  sair mevzuat` (uzun yazim, nadir)

Kisaltmalar tercih edilir. Tek tek madde numaralari burada verilmez.

---

## 7. HUKUKI DELILLER / DELILLER

Iki baslik da kullanilir. Numarali liste:

```text
1-) [Somut belge adi]
2-) [Somut belge adi]
3-) [Somut belge adi]
4-) Tanik, Kesif, Bilirkisi incelemesi ve her turden delil
```

Son kalem neredeyse her zaman "tanik, kesif, bilirkisi, yemin" formati.
Varyant: `... ve sair her turlu hukuki delil` / `... ve her turden delil`.

Tamamlayici ibare:
`delile karsi delil bildirme hakkimiz sakli kalmak kaydiyla`

---

## 8. NETICE VE TALEP / NETICE-I TALEP

Baslik uc formdan biri:
- `NETICE VE TALEP :`
- `NETICE-I TALEP :`
- `SONUC VE ISTEM :` (tuketici / ayipli mal davalarinda yaygin)

Giris kalibi (secenekler):
- `Yukarida arz edilen ve re'sen gozetilecek sebeplerle;`
- `Yukarida arz ve izah edilen nedenlerle;`
- `Yukarida arz ve izah olunan nedenlerle;`
- `Yukarida izah edilen ve Mahkemenizce re'sen dikkate alinacak tum nedenlerle;`

Talep kalemleri numarali: `1-)`, `2-)` veya sade maddeli.

Her talep kaleminin sonunda virgul + yeni satir. Son kalem "karar
verilmesini ... arz ve talep ederiz." cumlesi.

Kapanis formulleri (Aykut'un kullandigi secenekler):
- `karar verilmesini sayin mahkemenizden vekaleten saygilarimizla arz ve talep ederiz.`
- `karar verilmesini vekaleten arz ve talep ederim.`
- `Saygiyla bilvekale arz ve talep ederim.`
- `saygilarimizla arz ve talep ederim/ederiz.`

Tarih: kapanis satirinin sonunda veya ayri satirda. `GG.AA.YYYY` veya `GG/AA/YYYY`.

---

## 9. Vekil Imza Bloku

Sag blok, satir sonlari:
```text
				Davaci Vekili
				Av. Aykut YESILKAYA
```

Varyantlar:
- `Davaci Vekili` / `Davacilar Vekili` / `Davaci (Alacakli) Vekili`
- Isim ALL CAPS: `AV. AYKUT YESILKAYA` veya Title Case: `Av. Aykut YESILKAYA`
  (soyad her zaman ALL CAPS)

---

## 10. EKLER

Ayri bolum. Iki format:

Format A (13.udf):
```text
Ekli belgeler:
1) Trafik kazasi tespit tutanagi ve ifadeler
2) Ceza dosyasina ve Savcilik sorusturma dosyasina verilen bilirkisi kusur raporlari

Ilgili yerlerden istenecek belgeler:
1) Luleburgaz 3.Asliye Ceza Mahkemesi 2021/216 esas no.lu dosyasi
```

Format B (3.udf):
```text
EKLER:
Olunceye kadar bakma sozlesmesi
Veraset Ilami.
Vekaletname Sureti.
```

Format C (7.udf):
```text
Ek-1: Odeme Dekontlari ve Whatsapp Konusma Dokumleri
Ek-2: ...
```

Format D (TIF ornekleri - muris muvazaasi, mirasta iade):
```text
EKLER:
1-) Veraset ilami.
2-) Vekaletname.
3-) Emsal Yargitay Kararlari.
```

Format D farki: `1-)` numaralandirma + her kalem sonu nokta. Format B
(sadece nokta) ile C (Ek-N formati) arasinda karma bir yapi. Sablon formuna
yakin olan davalarda kullanilir.

Hangi format secildigine gore dilekce ici atiflar da degisir: (EK-1), (Ek.1),
(EK 1). Ajan 3 yazim sirasinda tek bir format secmeli, dilekce icinde tutarli
kullanmalidir.

---

## 11. Cumle Yapisi ve Uzunluk

| Metrik | Gozlem |
|---|---|
| Ortalama cumle uzunlugu | 25-45 kelime |
| En uzun cumle | 80-100 kelime normal |
| Bir paragrafta cumle sayisi | 2-4 |
| Paragraf uzunlugu | 3-8 satir |

Yapi ozellikleri:
- Ic ice gecmis cumleler var, **ama suslu degil**. Her alt-cumle yeni bilgi
  ekliyor.
- "... olup, ..." ve "... olmakla birlikte, ..." ile cumle uzatma sik.
- Pasif ve aktif karisik. Resmi formda pasif; olgulari anlatirken aktif
  (`muvekkil ... yapmistir`).
- Noktalama dagilimi: nokta > virgul > noktali virgul. Iki nokta sadece
  baslik sonrasi veya karar alinti oncesi.

---

## 12. Kelime Dagarcigi (Aykut'un Karakteristik Ifadeleri)

Bu kelimeler dilekcelerinde duzenli gecer. **Kullanim sikligina ters orantili
olarak AI-tell riski dusuktur.** Anchor kelimeler:

### Cok sik (her dilekcede)
- `muvekkil`, `muvekkilim`, `muvekkilimin`
- `davaci`, `davali`
- `isbu` (bilhassa `isbu davayi`, `isbu dilekce`, `isbu sebeple`)
- `fazlaya iliskin haklarimiz sakli kalmak`
- `zaruret hasil olmustur`, `zorunluluk hasil olmustur`
- `arz ve talep ederiz/ederim`
- `saygilarimizla`

### Sik
- `asikar`, `asikar olup`, `aleni`, `aleni bir sekilde`
- `izahtan varestedir`
- `nitekim`, `dolayisiyla`
- `somut olayda`, `hal boyle olunca`
- `re'sen`, `re'sen gozetilecek`, `re'sen nazara alinacak`
- `gerektirmektedir`, `karar verilmesi gerekmektedir`
- `vekaleten`

### Ozgun / az rastlanan (karakter kazandiriyor)
- `izahtan varestedir`
- `tabiri caizse`
- `fuzuli sagil`
- `bilvekale`
- `her turden delil` / `sair her turlu delil`
- `hic bir kuskuya yer vermeyecek sekilde`
- `ihtilafa yer vermeyecek sekilde`

### Duygusal yuk (olay anlatirken)
- `agir`, `feci`, `aleni bir sekilde`, `haksiz ve kotu niyetlidir`
- `sadir`, `ihlal`, `magduriyet`
- Gercek olayda fiziksel/manevi zarar varsa duygusal kelime kullanir.
  Tamamen steril degildir.

---

## 13. YAPMA Listesi (Anti-AI-Tell Ozel Kurallar)

Ajan 3 Aykut icin yazarken asla:

1. **Markdown isareti koymasin**: `#`, `##`, `-`, `*`, `> ` (alinti haric),
   `**kalin**`. Dilekceler duz metin, kisim basliklarini ALL CAPS yapar.
2. **Emoji, special unicode isareti kullanmasin**: cince tirnak, smart quote
   disinda.
3. **"Ozetle", "Sonuc olarak", "Belirtmek gerekir ki"** baslangici yapmasin.
4. **Asiri buyuk baslik hiyerarsisi** kurmasin (Aykut en fazla 2 seviye
   kullanir: ana baslik + numarali paragraf).
5. **Bullet list** yerine numarali paragraf (`1-)`) kullansin.
6. **Asiri kisa cumleler** (8 kelime alti) arka arkaya gelmesin; en az bir
   uzun bagli cumleye intikal etsin.
7. **Tum paragraflari ayni uzunlukta** yapmasin (AI-tell). Gercek dilekce
   1 cumlelik vurguyla uzun kanit paragraf arasinda salinir.
8. **Icerik tekrari yapmasin**: ayni fikri iki cumlede cesitleyerek soylemek
   AI tell'idir. Aykut soyle der, bir sonraki cumlede baska bilgi getirir.
9. **"Bu baglamda", "Ilaveten", "Buna ilaveten"** gibi fazla akademik gecisler
   yapmasin. Aykut `Ayrica`, `Nitekim`, `Bu sebeple`, `Dolayisiyla` kullanir.
10. **Yazim "kusursuz" gorunmesin**. Nadiren yazim/noktalama tutarsizligi
    olabilir (`7.udf`: "neznide" -- dogrusu "nezdinde"). Ajan yazim hatasi
    URETMESIN ama asiri kurumsal kusursuz "Editor AI" goruntusu de vermesin.

---

## 14. Kontrol Listesi (Dilekce Tamamlanmadan Once)

Ajan 3 Aykut icin dilekceyi kaydetmeden once asagidakileri dogrular:

- [ ] Mahkeme basligi ALL CAPS, tek satir veya 2 satir
- [ ] Taraf bilgisi tab/bosluk hizali, TC formati dava turune uygun
- [ ] KONU tek cumle, yukaridaki 5 kalibin biri
- [ ] HARCA ESAS DEGER: belirli alacakta var, maktuda yok
- [ ] ACIKLAMALAR numarali (`1-)`, `2-)`) veya kronolojik akis
- [ ] En az 2 emsal karar yukaridaki 3 sablondan birini takip ediyor
- [ ] Gecis bagcilari Aykut kelime dagarcigindan (nitekim, dolayisiyla,
      isbu sebeple, hal boyle olunca, somut olayda)
- [ ] YASAK bagc yok: ozetle, sonuc olarak, belirtmek gerekir ki
- [ ] HUKUKI SEBEPLER: kisaltma listesi + sair ilgili mevzuat
- [ ] DELILLER numarali, son kalem tanik/kesif/bilirkisi
- [ ] NETICE VE TALEP girisi 4 secenekten birini takip ediyor
- [ ] Kapanis: arz ve talep ederiz/ederim + tarih
- [ ] Imza bloku: Davaci Vekili / Av. Aykut YESILKAYA (soyad ALL CAPS)
- [ ] EKLER bolumu var, dilekce ici atiflar ayni formati kullaniyor
- [ ] Markdown isareti YOK (bu kural mutlaktir)
- [ ] Bullet (`-`, `*`) YOK, numarali paragraf var
- [ ] Paragraf uzunluklari degisken (3-8 satir karma)
- [ ] Anchor kelimeler (muvekkil, isbu, fazlaya iliskin...) serpistirilmis

---

## 15. Referans Ornekler

### UDF Kaynakli (Birincil Referans)

Ham UDF metinleri: `tmp/udf_extracted/metin/*.txt`

Ozellikle referans:
- `3.txt` -- Tapu iptal, numarali AC, cok emsal karar
- `6.txt` -- Deger kaybi, belirsiz alacak, HGK karari
- `9.txt` -- Soyadi degisikligi, maktu harc, numarali AC
- `11.txt` -- Ecrimisil, birden fazla davaci/davali, kisa
- `13.txt` -- Bedensel zarar tazminat, 4 bolumlu AC ("Kazanin olusu",
  "Kusur", "Beden gucu kayip orani", "Maddi tazminat istegi")

`7.txt`, `2.txt` baska avukatlarin (Av. Mehmet OZCELIK, Av. M. Munir TUNA)
dilekceleri -- buro arsivine eklenmis emsal. Bunlarin uslubu Aykut'unkine
yakin ama kuralsal degildir. Gercek Aykut stili icin yalnizca yukaridaki
5 UDF ornegi agirlikli referans alinir.

### TIF/OCR Kaynakli (Ikincil Referans)

Ham metin: `tiff2pdf.md` (repo koku)

- Istanbul Asliye Hukuk -- Necibe BUYUK (muris muvazaasi + ihtiyati
  tedbir talebi, 19.12.2019) -- Sablon D emsal karari, tedbir flag,
  EKLER Format D
- Inebolu Asliye Hukuk -- mirasta iade / tenkis (11.11.2019) -- formal
  dilekce, barosu sicil varyanti
- Istanbul Anadolu Adliyesi Tuketici Mahkemesi -- Savas TUNA, ayipli
  arac davasi (21.10.2019) -- SONUC VE ISTEM basligi, ic liste pattern'i,
  `Istemimizden Ibarettir.` kapanisi
- Savas TUNA Ihtarnamesi (03.10.2019) -- ihtarname yapisi icin birincil
  referans (bkz. Bolum 17)

OCR uyari: TIF orneklerinden yapi ve format cikarilir, verbatim
alinti yapilmaz. Karakter bozulmasi icin dosyanin bas notuna bakin.

---

## 16. Ogrenilmis Dersler

- 2026-04-21: Kaynak havuzu 10 UDF'den 10 UDF + 4 TIF/OCR'a genisletildi.
  Yeni kaliplar: `Istemimizden Ibarettir.` (tuketici KONU), `IHTIYATI
  TEDBIR TALEPLIDIR.` flag'i, Sablon D emsal karar atfi, tire ile ic
  liste pattern'i, `SONUC VE ISTEM` baslik varyanti, EKLER Format D,
  barosu sicil numarasi varyanti. Ihtarname yapisi §17 olarak eklendi
  (Savas TUNA ihtarnamesi birincil referans). OCR uyarisi: TIF kaynakli
  verbatim alinti YASAK, sadece yapisal kalip cikarimi.

---

## 17. Ihtarname Yapisi

Ihtarname bir dilekce degil, noter araciligiyla karsi tarafa gonderilen
resmi ihtar belgesidir. Yapi dilekceden farklidir ancak Aykut'un uslup
parmak izi benzer sekilde takip edilir.

Referans: Savas TUNA -> Nursen ORS ihtarnamesi (03.10.2019), `tiff2pdf.md`.

### Yapi Iskeleti

```text
IHTARNAME

KESIDE EDEN   : [Keside eden ad-soyad] (T.C. Kimlik No: XXXXXXXXXXX)
                [Adres]

VEKILI        : Av. Aykut YESILKAYA (Istanbul Barosu Sicil No:61223)
                [buro adresi]

MUHATAP       : [Muhatap ad-soyad]
                [Adres]

KONU          : [Tek cumle ihtar konusu]

ACIKLAMALAR   :

[Numarali paragraflar, olay anlatimi]
[Hukuki dayanak]
[Talep cumleleri]

SON PARAGRAF BUYUK HARFLE VE IHTAR VURGUSUYLA: "... AKSI TAKDIRDE
HUKUKI YOLLARA BASVURULACAGI HUSUSUNU IHTAREN BILDIRIRIM."

                                        Ihtar Eden
                                        [Keside eden adi]
                                        Vekili
                                        Av. Aykut YESILKAYA
```

### Dilekceden Ayrildigi Noktalar

| Kural | Ihtarname | Dilekce |
|---|---|---|
| Baslik | `IHTARNAME` tek satir | Mahkeme basligi |
| Taraflar | `KESIDE EDEN`, `MUHATAP` | `DAVACI`, `DAVALI` |
| Son paragraf | ALL CAPS ihtar uyarisi ZORUNLU | Yok |
| Imza blogu | `Ihtar Eden / [isim] / Vekili / Av. Aykut YESILKAYA` | `Davaci Vekili / Av. Aykut YESILKAYA` |
| HUKUKI SEBEPLER | Yok (ihtarname resmi dilekce degil) | Var |
| DELILLER | Yok | Var |
| HARCA ESAS DEGER | Yok | Ozellikli |
| EKLER | Nadiren | Sik |

### Son Paragraf Ihtar Kalibi

Son paragrafin tamami ALL CAPS yazilir ve su formullerden biri ile biter:

- `... AKSI TAKDIRDE KANUNI YOLLARA BASVURACAGIMIZI IHTAREN BILDIRIRIZ.`
- `... AKSI HALDE HAKKINIZDA YASAL ISLEM BASLATILACAGINI IHTAREN BILDIRIRIM.`
- `... YASAL HAKLARIMIZ SAKLI KALMAK KAYDIYLA ISBU IHTARNAMENIN TEBLIGI
   TARIHINDEN ITIBAREN [N] GUN ICINDE [talep] ODENMESINI, AKSI HALDE
   HAKKINIZDA DAVA ACILACAGINI IHTAREN BILDIRIRIZ.`

### Ihtarname Icin Anti-AI-Tell Kurallari

§13 kurallari aynen gecerli, ilave olarak:

1. `IHTARNAME` basligi standalone, alti cizili veya kalin YOK, sadece
   ALL CAPS
2. Taraf unvanlari (`KESIDE EDEN`, `MUHATAP`) tek kelime degil,
   parantezli ek alt bilgi yok
3. Son ihtar paragrafi ALL CAPS olmadan ihtarname sayilmaz; bu kural
   mutlaktir
4. Imza blogunda `Ihtar Eden` ile vekil ayri satirlarda verilir,
   vekalette `Vekili` ibaresi zorunlu
5. Ihtarname noter araciligi ile gonderildigi icin hic bir yerde
   mahkeme atfi yapilmaz

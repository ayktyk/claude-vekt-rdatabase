# Avukat Playbook'lari — Muhakeme Kodlamasi

> Sistem SURECI kodlar (kac sorgu, hangi kapi); playbook'lar Avukat
> Aykut'un YARGISINI kodlar: her zaman kontrol ettikleri, karsi tarafin
> klasik oyunlari, yapilmayacak argumanlar, muvekkile risk anlatim tarzi.
> Kiralanamayacak tek varlik budur — vendor urununde degil, bu repoda yasar.

## Kullanim Kurali (ZORUNLU)

Bir dava turunde calisan HER ajan (arastirmaci, usul, dilekce, savunma
sim, revizyon) ve her Gemini devir blogu, ise baslamadan once ilgili
`playbook/{dava-turu}.md` dosyasini OKUR ve talimatlarini uygular.
Playbook yoksa Director avukata bildirir: "Bu dava turu icin playbook
yok — dava sirasinda 2-3 soruyla baslatalim mi?"

## Doldurma Kurali (is yapilirken — masabasi anket DEGIL)

Her aktif dava/danismada Director, isin dogal duraklarinda (briefing
sonrasi, hipotez onayinda, kapanista) avukata EN FAZLA 2-3 hedefli
muhakeme sorusu sorar; cevaplari ilgili playbook'a isler. Bos basliklar
`[AVUKAT DOLDURACAK]` etiketiyle acik birakilir — UYDURULMAZ.

## Icerik Standardi

Her playbook su bolumleri tasir:
1. **Ilk bakis kontrol listesi** — dosya gelince ilk 10 dakikada bakilanlar
2. **Hesap/deger yaklasimi** — bu dava turunde tutar nasil kurulur (kaynakli)
3. **Karsi tarafin klasik oyunlari** — beklenen savunmalar + kirilma noktalari
4. **Yapilmayacaklar** — Aykut'un bilincli olarak KULLANMADIGI argumanlar/yollar
5. **Muvekkil iletisimi** — bu dava turunde risk nasil anlatilir, ne vaat edilmez
6. **Tuzaklar** — bir kez pahaliya mal olmus / olabilecek ince noktalar
7. **Kaynak cekirdegi** — bu turde tekrar tekrar kullanilan dogrulanmis kunyeler

KVKK: muvekkil adi yazilmaz; ders/ornekler dava-id ile anilir.
Dersler dongusuyle iliski: `dersler/`e dusen dava-turu muhakemesi
dersleri buraya TERFI ettirilir.

Bolum sirasi ve dogrulama kurallari: `_SABLON.md`.

---

## 15 Dava Turu — Durum Cetveli (2026-07-24 — HEPSI YAZILDI; trafik 2 kola ayrildi → 16 dosya)

Siralama, Drive'daki ~86 dosyanin tur frekansina gore yapildi
(Aktif Davalar + Biten Davalar + 0ESKI + 02CMK klasor adlari).
Playbook'larin tamami Yargi-MCP-Pro ile dogrulanmis kaynak (mevzuat maddesi +
ictihat tam metni) uzerine yazildi. Her playbook sonunda Kaynak Dogrulama
Tablosu + acik kalem listesi var. Trafik kazasi 2 ayri playbook'a bolundu:
maddi hasar (deger kaybi/mahrumiyet) ve bedensel zarar/olum (maddi-manevi
tazminat, ZMSS, Sigorta Tahkim, Ticaret Mahkemesi).

### Katman 1 — hacmin ~%75'i

| # | Playbook | Dosya | Durum |
|---|---|---|---|
| 1 | Iscilik — isveren feshi | `iscilik-isveren-feshi.md` | ✅ YAZILDI |
| 2 | Iscilik — iscinin hakli feshi / istifa gorunumu | `iscilik-isci-hakli-fesih.md` | ✅ YAZILDI |
| 3 | Ise iade | `ise-iade.md` | ✅ YAZILDI (ictihat kolu acik) |
| 4 | CMK mudafilik — uyusturucu | `cmk-uyusturucu.md` | ✅ YAZILDI |
| 5 | CMK mudafilik — siddet suclari | `cmk-siddet.md` | ✅ YAZILDI |
| 6 | Icra + itiraz sonrasi hat | `icra-itiraz-hatti.md` | ✅ YAZILDI |

### Katman 2 — orta hacim

| # | Playbook | Dosya | Durum |
|---|---|---|---|
| 7 | Trafik kazasi — maddi hasar (deger kaybi + mahrumiyet) | `trafik-tazminat.md` | ✅ MEVCUT + is akisi/§8 + KTK m.109 dogrulandi |
| 7b | **Trafik kazasi — bedensel zarar + olum** (maddi-manevi, ZMSS, Sigorta Tahkim, Ticaret Mahkemesi) | `trafik-bedensel-olum.md` | ✅ YAZILDI (2026-07-24 genisletme) |
| 8 | Trafik kazasi — rucuen tazminat | `trafik-rucu.md` | ✅ YAZILDI |
| 9 | Kira — tahliye | `kira-tahliye.md` | ✅ YAZILDI |
| 10 | Kira — kira bedeli tespiti | `kira-tespit.md` | ✅ YAZILDI |
| 11 | Tuketici — ayipli mal / arac | `tuketici-ayipli-mal.md` | ✅ YAZILDI |

### Katman 3 — dusuk hacim, iskelet duzeyi

| # | Playbook | Dosya | Durum |
|---|---|---|---|
| 12 | Gayrimenkul (tapu iptal / ecrimisil / izale-i suyu) | `gayrimenkul.md` | ✅ YAZILDI |
| 13 | Aile (bosanma) | `aile-bosanma.md` | ✅ YAZILDI |
| 14 | Is kazasi (maddi-manevi tazminat) | `is-kazasi.md` | ✅ YAZILDI |
| 15 | Miras (reddi miras / hukmen ret) | `miras-ret.md` | ✅ YAZILDI |

### Dogrulanmis Kunye Cekirdegi (tekrar kullanilabilir — 2026-07-23/24)

Bu documentId'ler tam metin acilip alintilar birebir dogrulandi. Yeni dosyada
tekrar aramadan atif yapilabilir (ama guncellik kontrolu onerilir):

| documentId | Kunye | Playbook | Ne icin |
|---|---|---|---|
| 318276000 | Y.9.HD E.2015/9909 K.2017/2337 | iscilik | Imzali bordro kesin delil + ihtirazi kayit |
| 621990600 | Y.9.HD E.2008/16869 K.2010/3345 | iscilik hakli fesih | 6 isgunu/1 yil hak dusurucu sure + odeme sebebi dusurur |
| 1093760300 | Y.9.HD E.2024/7382 K.2024/12788 | iscilik | Ek m.3/Gecici m.8 zamanasimi + 1 gun gecikme |
| 1133339800 | Y.3.HD E.2024/1803 K.2025/1147 | icra | Icra inkar tazminati likit alacak sarti |
| 1106057700 | Y.8.CD E.2024/12779 K.2024/7122 | cmk uyusturucu | Ticaret/kullanma ayrimi (hassas terazi) |
| 1143075600 | Y.1.CD E.2023/7100 K.2025/2762 | cmk siddet | Oldurme kasti tespit olcutleri + tahrik somut fiil |
| 1108153500 | Y.4.HD E.2024/4682 K.2024/6004 + IBK 1944/37-9 | trafik rucu | Halefiyet davasi ticari dava degil |
| 1108995200 | Y.3.HD E.2024/314 K.2024/4116 | miras | Hukmen ret suresiz + tespit davasi/def'i |
| 1131856300 | Y.HGK E.2023/396 K.2025/88 + IBK 1974/1-2 | gayrimenkul | Muris muvazaasi ispat yuku + fiili karineler |
| 1070978300 | Y.4.HD E.2021/23549 K.2024/5424 | trafik bedensel | Sigortaci taraftaysa gorev Asliye Ticaret (gorev iliskisi, resen) |

### Sonraki Arastirma Blogu — acik kalemler (tum playbook'lardan)

`[SONRAKI ARASTIRMA BLOGU]` / `[METIN DOGRULANMADI]` / `[teyit]` etiketli
noktalar. Dilekce/rapor uretiminde kullanilmadan once cekilir:

**Is hukuku:** HMK belirsiz alacak/kismi dava · TBK m.420 ibra · 4857 m.19/25 ·
4857 m.46 (7553, 14.07.2025) · 4857 Ek m.2 (7578, 01.05.2026) · ise iade ictihadi
(isletmesel karar, son care, performans) · AYM 3/6/2025 E.2024/157 K.2025/121
(7036 m.3/15 iptali).
**Ceza:** TCK m.36 (gonullu vazgecme) · m.81/82/86/148/168 · CMK m.147/253 ·
5395 Cocuk Koruma · net miktar/kisisel kullanim CGK karari · m.87 lehe kanun.
**Icra:** IIK m.68/68a · TTK m.5/A ticari dava arabuluculugu · IIK m.167.
**Kira/Tuketici:** TBK Gecici m.1 (%25) · TBK m.351/355 · HMK m.4/367 · 6502 m.8-10 ·
guncel hakem heyeti parasal sinir.
**Gayrimenkul/Miras/Aile:** ecrimisil (TMK m.995 + intifadan men) · 3402 m.12/3 ·
HMK m.12 · TMK m.611-616/716 · TMK m.161-164/169/182/202 · 4787 · 6284.
**Trafik/Is kazasi:** ZMSS Genel Sartlar istisna listesi · 5510 SGK rucu/denklestirme ·
TBK m.146 · destekten yoksun kalma hesabi.
**Ortak:** guncel harc/AAUT/tarife tutarlari (her yil UYAP'tan teyit).

# Kalite Gate Sablonu

Son guncelleme: 2026-04-11
Versiyon: 1.0

Bu sablon Director Agent tarafindan her ajan gecisinde kullanilir.
Her gate'in PASS/FAIL kriteri ACIK ve OLCULEBILIR olmalidir.
Tum kriterler karsilanmadan sonraki ajana gecilmez.
Tum ciktilar TASLAK olarak isaretlenir — avukat son kontrolu yapar.

---

## Gate 1: Post-Arastirma (Arastirma Ajani -> Usul / Dilekce)

Arastirma Ajani ciktisini tamamladiktan sonra Director Agent bu kontrolleri uygular.

| # | Kriter | Kontrol | PASS | FAIL Aksiyonu |
|---|--------|---------|------|---------------|
| 1 | Min sorgu sayisi | Yargi CLI >= 15 sorgu, Mevzuat CLI >= 8 sorgu | Sayilar karsilandi | Eksik sorgulari tamamla, rapora ekle |
| 2 | HGK / IBK kapsami | En az 1 HGK veya IBK karari raporda var | Bulundu | 3 yeni terimle HGK sorgusu tekrarla |
| 3 | Temporal evolution | 2021-2025 yil-bazli analiz tamam (5 yil) | 5 yil kapsandi | Eksik yillari tara, raporu guncelle |
| 4 | Tam metin okuma | Min 5 karar tam metni okundu ve ozeti yazildi | 5+ karar | Eksik okumalari tamamla |
| 5 | Celiski taramasi | Min 2 celiski / bozma sorgusu yapildi | Yapildi | Faz 5 celiski taramasini calistir |
| 6 | Mevzuat tam metin | Ilgili kanun maddeleri tam metin olarak cekildi | Cekildi | Eksik maddeleri mevzuat CLI ile tamamla |
| 7 | Dogrulanmamis atif | Raporda "DOGRULANMASI GEREKIR" sayisi | 0 veya avukata bildirildi | Avukata bildir, onay bekle |

**Karar kurali:**
- TUM satirlar PASS -> Usul Ajanina ilet
- 1-2 satir FAIL -> FAIL aksiyonunu uygula, arastirmaci tekrar calisir, kontrol tekrarlanir (max 3 deneme)
- 3 deneme sonrasi hala FAIL -> Avukata bildir: "[kriter] karsilanamadi, devam edilsin mi?"

---

## Gate 2: Post-Usul (Usul Ajani -> Dilekce Yazari)

Usul Ajani raporunu tamamladiktan sonra Director Agent bu kontrolleri uygular.

| # | Kriter | Kontrol | PASS | FAIL Aksiyonu |
|---|--------|---------|------|---------------|
| 1 | Gorev / yetki dayanagi | Gorevli mahkeme + dayanak kanun maddesi yazildi | Yazildi | Usul ajanini ilgili bolumu tamamlamasi icin yonlendir |
| 2 | Arabuluculuk dava sarti | Zorunlu mu, son tutanak var mi? acikca belirtildi | Belirtildi | Usul ajanini 7036 s.K. m.3 kontroluyle yonlendir |
| 3 | Zamanasimi tarihi | Zamanasimi bitis tarihi hesapli ve yazili | Yazili | Tarihi hesapla, raporun "Kritik Sureler" bolumune ekle |
| 4 | Harc tahmini | Harc tablosu dolu, guncellik notu var | Dolu | "Bu hesaplama [yil] tarifesine goredir, UYAP'tan dogrulayin" notu ekle |
| 5 | Vekaletname kontrolu | Ozel yetki gerektirip gerektirmedigi belirtildi | Belirtildi | Dava turune gore ozel yetki ibaresini usul raporuna ekle |
| 6 | Eksik evrak listesi | Muvekkil ve mahkemeden toplanacak belgeler listelendi | Listelendi | Dava turune gore standart eksik evrak listesini ekle |
| 7 | Risk analizi | En az 1 somut risk + onlem onerisi yazildi | Yazildi | "Gol yenilebilecek alanlar" bolumunu tamamla |

**Karar kurali:**
- TUM satirlar PASS -> Dilekce Yazarina ilet
- 1-2 satir FAIL -> Usul Ajani eksik bolumu tamamlar, kontrol tekrarlanir (max 2 deneme)
- 2 deneme sonrasi hala FAIL -> Avukata bildir: "Usul raporu eksik, avukat tarafindan tamamlanmasi gerekiyor"

---

## Gate 3: Post-Dilekce (Dilekce Yazari -> Avukata Teslim)

Dilekce taslagi tamamlandiktan sonra Director Agent bu kontrolleri uygular.
Bu gate'in 8. kriteri HARD FAIL'dir — bloklanirsa dilekce avukata iletilmez.

| # | Kriter | Kontrol | PASS | FAIL Aksiyonu |
|---|--------|---------|------|---------------|
| 1 | Atif asgarisi | En az 2 Yargitay karari dilekce metninde atifli | Var | Arastirma raporundan karar ekle, dilekceye islet |
| 2 | Netice-i talep tutarliligi | Talep rakamlari hesaplama modulu ciktisiyla oruyor | Oruyor | Hesaplama modulu ile karsilastir, tutarsizi duzelt |
| 3 | Zamanasimi pozisyonu | Zamanasimi savunmasina karsi pozisyon alindi | Alindi | II. Hukuki Degerlendirme'ye zamanasimi paragrafi ekle |
| 4 | Arabuluculuk atfi | Arabuluculuk son tutanagina dilekcede atif var | Var | Aciklamalar bolumune "...arabuluculuk son tutanagi eklidir" ekle |
| 5 | Yapay zeka dil testi | Dilekce "utandirma testini" gecti (dogal avukat uslubu) | Gecti | Isaretlenen cumleler duzeltilir, sablon dilinden uzaklasilir |
| 6 | KVKK maskeleme | Gercek muvekkil bilgileri maskelendi (TC, IBAN, TEL) | Tamam | Maskelenmemis veriyi bul, degistir |
| 7 | Risk flag degerlendirmesi | Arastirma raporundaki risk flagler dilekce metnine yansitildi | Yansitildi | Savunma Simulatorunu oner, avukatan onay al |
| 8 | HARD FAIL — Dogrulanmamis atif | Dilekce metninde "DOGRULANMASI GEREKIR" isaretli atif sayisi | 0 | 1 = avukata bildir ve bekle / 2+ = dilekceyi BLOKLA, avukat elle duzeltmeli |

**Karar kurali:**
- Kriter 1-7 PASS + Kriter 8 = 0 -> "TASLAK hazir" mesajiyla avukata ilet
- Kriter 1-7'de FAIL var -> Dilekce Yazari eksik bolumu duzeltir, kontrol tekrarlanir (max 2 deneme)
- Kriter 8 = 1 (tek dogrulanmamis atif) -> Avukata bildir: "[atif] dogrulanmamis, onay bekleniyor"
- Kriter 8 >= 2 (birden fazla dogrulanmamis atif) -> BLOKLA: "Dilekce iletilmedi. Dogrulanmamis atif sayisi: [N]. Avukat elle duzeltmeli."

---

## Kullanim Notu

Director Agent bu sablonu her ajan gecisinde asagidaki sekilde kullanir:

1. Ilgili gate tablosunu ac.
2. Her satiri sirayla kontrol et.
3. FAIL olan satirlarin aksiyonunu uygula.
4. Tum satirlar PASS olunca sonraki ajana gecis ver.
5. 3 denemede gecilemeyen gate icin avukata kisa bildirim yaz.

Gate sonuclari dava hafizasina kaydedilmez — bu sablon operasyonel bir kontrol
listesidir, kalici arastirma ciktisi degildir.

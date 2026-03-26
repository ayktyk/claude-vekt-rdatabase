# REVIZE.md -- Hukuk Otomasyon Sistemi Iyilestirmeleri

Bu dosya Codex (Antigravity) icin yazilmistir.
Once mevcut repoyu incele (https://github.com/ayktyk/claude-vekt-rdatabase).
CLAUDE.md, .mcp.json, ajanlar/ klasoru, mevcut dashboard kodunu oku.
Sonra asagidaki revizyonlari sirayla uygula.

ALLSKILL.md klasörünü bu projeyi inşaa ederken gerektiğinde kullan.

TEMEL PRENSIP: Basit tut. Her revizyon mevcut sisteme dogal olarak oturmali.
Yeni framework, yeni veritabani, yeni deployment yontemi ekleme.
Mevcut calisan yapinin ustune insa et.

---

## ONCELIK 1: Kalite Kontrol Mekanizmasi (Embarrass Check)

Bu sistemdeki en kritik eksik. Su an ajanlar cikti uretiyor ama
ciktinin kalitesini sistematik olarak kontrol eden bir mekanizma yok.
Avukat her seyi elle kontrol etmek zorunda -- bu otomasyon amacini zayiflatiyor.

### 1A: CLAUDE.md'ye Kalite Kontrol Protokolu Ekle

CLAUDE.md dosyasindaki AJAN 3 (Dilekce Yazari) bolumunde mevcut
"Kalite kontrol" maddelerini genislet. Ayrica AJAN 1 ve AJAN 2 icin de
kalite kontrol ekle.

Her ajanin cikti bolumunun SONUNA su blogu ekle:

```
## Kalite Kontrol -- Kaydetmeden Once

Bu ciktiyi son haline getirmeden once asagidaki kontrolleri yap.
Eksik olan varsa tamamla, SONRA kaydet.

### Genel (Tum Ajanlar)
- [ ] Yapay zeka oldugu belli oluyor mu? ("Ozetle", "Sonuc olarak",
      "Belirtmek gerekir ki" gibi AI marker'lari var mi?)
      VARSA: Yeniden yaz, dogal hukuk dili kullan.
- [ ] Turkce karakter hatasi var mi? (ö, ü, ç, ğ, ı, ş kontrolu)
- [ ] Referans verilen karar veya mevzuat gercekten var mi?
      Uydurma (hallucination) riski yuksek alan:
      - Yargitay karar numaralari
      - Kanun madde numaralari
      - Tarihler
      EMIN DEGILSEN: "Bu referansin dogrulanmasi gerekir" notu ekle.
- [ ] KVKK: Ciktida gercek isim, TC, IBAN var mi? Varsa maskele.
```

#### Ajan 1 (Usul) icin ek kontroller:

```
### Usul Ozel
- [ ] Gorevli mahkeme dayanagi kanun maddesiyle birlikte yazildi mi?
- [ ] Zamanasiimi hesabi somut tarihlerle yapildi mi (sadece "5 yil" degil)?
- [ ] Harc tahmini guncel yil tarifesine gore mi?
      EMIN DEGILSEN: "UYAP'tan dogrulayin" notu ekle.
- [ ] Arabuluculuk zorunlulugu belirtildi mi ve dayanagi var mi?
```

#### Ajan 2 (Arastirma) icin ek kontroller:

```
### Arastirma Ozel
- [ ] En az 3 guncel Yargitay karari (son 2 yil) bulundu mu?
      BULUNAMADIYSA: Farkli terimlerle 2 ek arama yap.
      HALA BULUNAMADIYSA: "Yeterli guncel karar bulunamadi, manuel
      arastirma onerilir" notu ekle. Uydurma karar YAZMA.
- [ ] HGK veya IBK karari aranip sonucu belirtildi mi?
      (Bulundu / Bulunamadi -- ikisi de kabul edilebilir, aranmamis olmamali)
- [ ] Kararlar arasi celiskili nokta var mi? Varsa acikca belirtildi mi?
- [ ] Vektor DB bulgulari ile Yargi MCP sonuclari karsilastirildi mi?
      (Ayni karar her iki kaynakta da cikiyorsa guclu referans)
```

#### Ajan 3 (Dilekce) icin ek kontroller:

```
### Dilekce Ozel
- [ ] Netice-i talep rakamlari Ajan 1'in hesaplamalariyla tutarli mi?
      (Farklilik varsa KAYDETME, once Ajan 1 ciktisini tekrar kontrol et)
- [ ] En az 2 Yargitay kararina atif yapildi mi?
- [ ] Zamanasiimi savunmasina karsi proaktif pozisyon alindi mi?
- [ ] Arabuluculuk son tutanagina atif var mi?
- [ ] "Bu ciktiyi muvekkilimin karsisinda olusturdugu gibi versem
      beni utandiracak bir sey var mi?" sorusunu sor.
      EVET ISE: Sorunlu kismi belirle ve duzelt.
```

### 1B: Director Agent'e Kalite Gate Ekle

CLAUDE.md'deki Director Agent bolumune su kurali ekle:

```
## Kalite Gate Kurali

Director Agent, bir ajanin ciktisini bir sonraki ajana iletmeden once
kalite kontrolunun yapildigini dogrular.

Akis:
  Ajan 1 cikti uretti
    -> Ajan 1 kendi kalite kontrolunu yapti mi? (kontrol listesi dolu mu?)
    -> EVET: Ajan 2'ye ilet
    -> HAYIR: Ajan 1'e "kalite kontrolunu tamamla" talimati ver

  Ajan 2 cikti uretti
    -> Kalite kontrol yapildi mi?
    -> Uydurma referans riski var mi? ("dogrulanmasi gerekir" notu var mi?)
    -> EVET (risk var): Avukata bildir, otomatik Ajan 3'e iletme
    -> HAYIR (temiz): Ajan 3'e ilet

  Ajan 3 cikti uretti
    -> "Utandirma testi" yapildi mi?
    -> Netice-i talep rakamlari tutarli mi?
    -> EVET (temiz): Avukata "taslak hazir, son kontrolunuz icin" mesaji ver
    -> HAYIR: Sorunlu kismi belirle, duzelt, tekrar kontrol et

Hicbir ajan ciktisi "final" olarak isaretlenmez.
Tum ciktilar "TASLAK" ibaresiyle kaydedilir.
Avukat onaylamadan hicbir belge kullanilmaz.
```

### 1C: Confidence Notu (Basit Versiyon)

Karmasik bir skor sistemi KURMA. Bunun yerine her ajan ciktisinin
basina basit bir "guven notu" ekle:

```
---
GUVEN NOTU:
- Mevzuat referanslari: [DOGRULANMIS / DOGRULANMASI GEREKIR]
- Yargitay kararlari: [DOGRULANMIS / DOGRULANMASI GEREKIR / BULUNAMADI]
- Hesaplamalar: [YAPILDI / YAPILMADI / TAHMINI]
- Dahili kaynak kullanildi mi: [EVET - kaynak adi / HAYIR]
---
```

Bu not avukata "neye dikkat etmem lazim" sinyali verir.
%92 gibi sayi verme -- yaniltici olur. Kategorik not yeterli.

---

## ONCELIK 2: Skill.md Dosyalari (Ajan Davranisini Iyilestirme)

Mevcut sistemde ajan davranislari CLAUDE.md icinde tanimli.
Bu calisir ama iki sorunu var:

1. CLAUDE.md cok buyuk (33.9KB) -- her oturumda gereksiz context tuketiyor
2. Ajan davranislari zamanla gelisemiyor -- sabit kurallar

Cozum: Her ajan icin ayri Skill.md dosyasi olustur.
CLAUDE.md sadece routing ve genel kurallar icersin.
Ajanlar gorev aldiginda kendi Skill.md dosyasini okusun.

### 2A: Klasor Yapisi

```
ajanlar/
├── arastirmaci/
│   ├── system-prompt.md      ← mevcut (kalsin)
│   └── SKILL.md              ← YENI
├── usul-uzmani/
│   ├── system-prompt.md
│   └── SKILL.md              ← YENI
├── dilekce-yazari/
│   ├── system-prompt.md
│   └── SKILL.md              ← YENI
└── pazarlama/
    ├── system-prompt.md
    └── SKILL.md              ← YENI
```

### 2B: Skill.md Sablonu (Her Ajan Icin Uyarla)

Asagidaki sablonu temel al. Her ajan icin icerigi uyarla.

```markdown
# [Ajan Adi] -- Skill Dosyasi

Son guncelleme: [tarih]
Versiyon: 1.0

---

## Kimlik

Sen [rol tanimi]. [1-2 cumle ile gorev ozeti].

## Yapma Listesi (Bu Kurallari Asla Cignemezsin)

- [Yasak 1]
- [Yasak 2]
- [Yasak 3]

## Cikti Formati

[Ajanin uretecegi ciktinin tam sablonu -- CLAUDE.md'deki mevcut formati buraya tasi]

## Kalite Kontrol

[ONCELIK 1'deki ilgili kontrol listesini buraya koy]

## Ogrenilmis Dersler

Bu bolum zamanla buyur. Her davadan sonra avukat geri bildirim verirse buraya ekle.

- [tarih]: [Ders -- ornek: "Yargitay 9. HD'nin 2025 kararlari artik
  fazla mesaide 'yazili belge' yerine 'her turlu delil' kabul ediyor"]
- [tarih]: [Ders]
```

### 2C: Dilekce Yazari Skill.md (Tam Icerik)

Bu en kritik ajan -- tam icerigi yaz:

Dosya: `ajanlar/dilekce-yazari/SKILL.md`

```markdown
# Dilekce Yazari -- Skill Dosyasi

Son guncelleme: 2026-03-25
Versiyon: 1.0

---

## Kimlik

Sen 20 yillik tecrubeli bir Turk avukatisin.
Yapay zeka oldugun ASLA anlasilmamali.
Dilin resmi, kendinden emin ama agdali degil, net bir dildir.

## Yapma Listesi

- "Sonuc olarak", "ozetle", "belirtmek gerekir ki" KULLANMA
- "Sayideger mahkemenizce takdir edilecegi uzere" gibi klise KULLANMA
- 3 satirdan uzun cumle KURMA
- Ingilizce terim KULLANMA (zorunlu olmadikca)
- Emoji, gunluk dil KULLANMA
- Uydurma Yargitay karar numarasi YAZMA
- "Yapay zeka tarafindan hazirlanmistir" YAZMA

## Izin Verilen Hukuk Jargonu

"Sole ki", "zira", "nitekim", "mezkur", "isbu" -- bunlar dogal hukuk
dilidir, kullanabilirsin. Ama her cumlede degil, ihtiyac olunca.

## Referans Formatlari

Yargitay karari:
Yargitay X. Hukuk Dairesi'nin GG.AA.YYYY tarih ve
YYYY/XXXXX E., YYYY/XXXXX K. sayili kararinda...

Mevzuat:
4857 sayili Is Kanunu'nun XX. maddesi uyarinca...

## Cikti Yapisi

[MAHKEME ADI]
ESAS NO:
DAVACI :
VEKILI :
DAVALI :
KONU :

ACIKLAMALAR

I. OLAYLAR
[Kronolojik, olgusal. Duygusal ifade yok.]

II. HUKUKI DEGERLENDIRME
[Kritik nokta argumanlari -- mevzuat + Yargitay kararlari]
[Risk noktalari proaktif olarak karsilanir]

III. DELILLER

1. [Belge]
2. ...

IV. HUKUKI NEDENLER
[Kanun maddeleri]

V. SONUC VE TALEP
[Her alacak kalemi ayri ayri, net tutarlarla]

                                     Davaci Vekili
                                     Av. [Avukat Adi]

## Kalite Kontrol

Dilekceyi kaydetmeden once:

- [ ] Yapay zeka oldugu belli oluyor mu? EVET ISE yeniden yaz.
- [ ] En az 2 Yargitay kararina atif var mi?
- [ ] Netice-i talep rakamlari Usul Ajaninin hesaplamalariyla tutarli mi?
- [ ] Zamanasiimi savunmasina karsi pozisyon alindi mi?
- [ ] Arabuluculuk son tutanagina atif var mi?
- [ ] "Bu dilekceyi muvekkilin karsisinda olusturdugu gibi versem
      beni utandiracak bir sey var mi?"
- [ ] Uydurma referans var mi? (Emin olmadigin karar numarasini
      "dogrulanmasi gerekir" notuyla isaretle)

## Ogrenilmis Dersler

- 2026-03-25: Sistem ilk kurulum. Dersler dava deneyimleriyle eklenecek.
```

### 2D: Diger Ajanlar Icin Skill.md

Usul Uzmani, Arastirmaci ve Pazarlama ajanlari icin de ayni sablonu
kullanarak Skill.md dosyalari olustur. Iceriklerini CLAUDE.md'deki
mevcut ajan tanimlarindan al. Ozellikle:

**Usul Uzmani SKILL.md:**

- CLAUDE.md'deki "AJAN 1: Usul Ajani" bolumundeki cikti formati
- Dava turune gore ozel checklist maddeleri (iscilik alacaklari bolumu)
- Harc hesaplama formulleri BURAYA TASINMAYACAK (ayri module cikarilacak, bkz. 2E)
- Kalite kontrol listesi (1A'daki Usul Ozel kontroller)

**Arastirmaci SKILL.md:**

- CLAUDE.md'deki "AJAN 2: Arastirma Ajani" bolumundeki arama adimlari
- Vektor DB, Yargi CLI, Mevzuat CLI kullanim protokolu
- Kalite kontrol listesi (1A'daki Arastirma Ozel kontroller)

**Pazarlama SKILL.md:**

- CLAUDE.md'deki "AJAN 4: Pazarlama Uzmani" bolumundeki blog yapisi
- Sosyal medya formatlari
- Yasak listesi (hukuki tavsiye, muvekkil bilgisi vs.)

### 2E: CLAUDE.md'den Hesaplama Modulunu Cikar

CLAUDE.md'deki "Iscilik Alacaklari Hesaplama Modulu" bolumunu
(MODUL 1'den MODUL 9'a kadar + SONUC TABLOSU + Risk kontrolleri)
ayri bir dosyaya tasi:

Dosya: `ajanlar/usul-uzmani/iscilik-hesaplama.md`

CLAUDE.md'de bu bolumun yerine su referansi birak:

```
## Iscilik Alacaklari Hesaplama

Hesaplama kurallari ve formulleri icin:
@ajanlar/usul-uzmani/iscilik-hesaplama.md dosyasini oku.
```

Bu tek degisiklik CLAUDE.md'yi ~300 satir (yaklasik 8-10KB) hafifletir.

### 2F: CLAUDE.md'den Ajan Detaylarini Cikar

Skill.md dosyalari olustuktan sonra, CLAUDE.md'deki her ajan bolumunu
kisalt. Detayli cikti formati, kontrol listesi, ozel kurallar
Skill.md'ye tasindi. CLAUDE.md'de sadece su kalsin:

```
### AJAN 1: Usul Ajani
Tetikleyici: Yeni dava parametreleri girildiginde.
Gorev: Davanin usul iskeletini kurmak.
Detay: @ajanlar/usul-uzmani/SKILL.md
```

Bu yaklasimla CLAUDE.md 33.9KB'den yaklasik 15-18KB'ye duser.
Her oturumda context window tasarrufu saglanir.

---

## ONCELIK 3: Dashboard Iyilestirmeleri

Mevcut React dashboard calisiyor. Asagidaki eklemeler mevcut
yapiya minimum mudahaleyle eklenir.

### 3A: AI Durum Paneli

Dashboard'a yeni bir kart/bolum ekle: "AI Ajan Durumu"
Bu kart 4 satir gosterir:

```
Usul Ajani:       [Bosta / Calisiyor / Tamamlandi]
Arastirma Ajani:  [Bosta / Calisiyor / Tamamlandi]
Dilekce Ajani:    [Bosta / Calisiyor / Tamamlandi]
Pazarlama Ajani:  [Bosta / Calisiyor / Tamamlandi]
```

Basit bir state gostergesi. Karmasik progress bar veya WebSocket KURMA.
Sayfa yenilenince durumu kontrol etmesi yeterli.

Backend'de (mevcut proje kodunu incele, muhtemelen bir API var) her ajan
calistiginda bir status dosyasi veya DB kaydi gunceller. Dashboard bunu okur.

### 3B: Dava Tablosuna "AI Notu" Kolonu

Mevcut davalar tablosuna bir kolon ekle: "AI Notu"
Bu kolonda su bilgiler goruntulenir:

- "Taslak dilekce hazir" (Ajan 3 tamamlanmissa)
- "Arastirma tamamlandi" (Ajan 2 tamamlanmissa)
- "Dogrulanmasi gereken referans var" (kalite kontrolde isaretlenmisse)
- Bos (henuz AI calismamissa)

### 3C: Yeni Dava Olusturma Akisina AI Secenegi

Mevcut "Yeni Dava Ekle" butonunun yanina veya icine:

```
[Yeni Dava Ekle]  [AI ile Baslat]
```

"AI ile Baslat" tiklandiginda basit bir modal/form acar:

```
Dava Turu: [dropdown: iscilik_alacagi, bosaanma, kira, tuketici, diger]
Kisa Ozet: [textarea]
Kritik Nokta: [textarea]
[Baslat]
```

"Baslat" tiklandiginda Director Agent tetiklenir.
Bu akis mevcut CLAUDE.md'deki tetikleyici komut formatina uygun olmali.

NOT: Dashboard'un mevcut teknoloji stack'ini (React + muhtemelen bir backend)
once incele. Mevcut API yapisina uygun sekilde endpoint ekle.
Yeni framework EKLEME, mevcut yapiya entegre et.

---

## ONCELIK 4: Judge Analytics (Ileride)

BU REVIZYONDA UYGULANMAYACAK.
Sadece kayit olarak birakiyorum. Sistem olgunlasinca eklenecek.

Fikir: Yargi MCP'den cekilen kararlarda hakim/daire bazli
patern analizi (kabul/ret oranlari, belirli konulardaki egilimler).
Arastirma ajaninin raporuna "Bu daire bu konuda son 2 yilda
%X kabul orani gosteriyor" gibi not eklemesi.

Bu ozellik Vektor DB'deki karar verisi yeterli hacme ulastiginda
anlamli hale gelir. Simdi yapilsa yaniltici sonuclar uretir.

---

## REPO TEMIZLIGI

Bu revizyonla birlikte su dosyalari sil veya arsivle:

Silinecek (iceriklerinin tamami CLAUDE.md'ye veya Skill.md'lere tasinmis):

- CLAUDE1.md
- CLAUDETASLAK.md
- YENIPLAN.md
- GELISTIRME.md (icerigi hala gecerliyse PLAN.md ile birlestir)

Kalacak:

- CLAUDE.md (hafifletilmis versiyon)
- PLAN.md (genel yol haritasi -- gerekiyorsa guncelle)
- legal.local.md
- dilekce-yazim-kurallari.md
- vektordb-kurulum.md (veya VEKTORDB-YENIDEN-KUR.md ile degistir)
- avukat-dava-rehberi-copilot.md (hala kullaniliyorsa kalsin)
- notebooklm-kurulum.md

---

## UYGULAMA SIRASI (Codex Bu Sirayla Calistir)

```
1. Skill.md dosyalarini olustur (2B, 2C, 2D)
2. Hesaplama modulunu CLAUDE.md'den ayri dosyaya tasi (2E)
3. CLAUDE.md'yi hafiflet -- ajan detaylarini @referans ile degistir (2F)
4. Kalite kontrol protokolunu Skill.md dosyalarina ekle (1A)
5. Director Agent'e kalite gate kuralini ekle (1B)
6. Guven notu sablonunu ekle (1C)
7. Gereksiz dosyalari sil (Repo Temizligi)
8. Dashboard'a AI Notu kolonu ekle (3B)
9. Dashboard'a AI durum paneli ekle (3A)
10. Yeni dava olusturmaya AI secenegi ekle (3C)
```

Adim 1-7 saf dosya islemleri -- mevcut kodu bozmaz.
Adim 8-10 dashboard kodu degisikligi -- mevcut React kodunu inceledikten sonra yap.

---

## BU REVIZYONDA YAPILMAYACAK SEYLER

Asagidakiler Grok konusmalarinda onerilmis ama su an icin erken veya gereksiz:

- FastAPI backend olusturma (mevcut backend varsa ona ekle, yoksa simdi kurma)
- Capacitor / PWA donusumu
- Billing & Time Tracking modulu
- Sub-agent swarm mimarisi
- Next.js'e gecis
- Supabase / PostgreSQL ekleme
- Confidence Score (sayi bazli %92 gibi) -- bunun yerine kategorik guven notu kullaniyoruz
- Judge Analytics (veri yetersiz)
- "Turk Hukukunun Ilk AI-Native Avukat Orchestrator'i" pazarlama plani

Bunlar sistemin gunluk kullanilabilirligini iyilestirmez.
Once cekirdek kaliteyi yukselt, sonra buyut.

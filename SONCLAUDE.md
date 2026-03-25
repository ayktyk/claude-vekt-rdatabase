# SONCLAUDE.md -- Hukuk Otomasyon Sistemi Son Revizyon Talimati

Bu dosya Codex (Antigravity) icin yazilmistir.
Sistemin tum gecmis planlari, arastirmalari ve gercek dava deneyimlerini
tek bir uygulanabilir talimata sentezler.

Once mevcut repoyu incele: https://github.com/ayktyk/claude-vekt-rdatabase
CLAUDE.md, .mcp.json, ajanlar/, mevcut HukukTakip dashboard kodunu oku.
Sonra asagidaki revizyonlari VERILEN SIRAYLA uygula.

---

## TEMEL PRENSIP

- Basit tut. Overengineering yapma.
- Mevcut calisan yapiyi bozma, ustune insa et.
- Yeni framework, yeni veritabani, yeni deployment yontemi EKLEME.
- Her degisiklik somut bir sorunu cozmeli. "Guzel olur" yetmez.
- Yapay zeka oldugu hicbir ciktida belli olmamali.

---

## DOSYA OLUSTURMA SKILL'LERI

Projede .docx (dilekce, ihtarname), .xlsx (hesaplama tablosu), .pdf (rapor)
olusturma islemleri var. Bu islemler icin `ALLSKILL.md` dosyasindaki
Skill Gateway sistemini kullan.

`ALLSKILL.md` dosyasini projenin kok dizinine koy.

Kullanilacak skill'ler (sadece bunlar -- geri kalanini yoksay):

| Is | Kullanilacak Skill | Ne Zaman |
|---|---|---|
| Dilekce/ihtarname .docx olusturma | `docx` | Ajan 3 cikti urettiginde |
| Hesaplama tablosu .xlsx olusturma | `xlsx` | Usul Ajani iscilik hesaplamasi yaptiginda |
| PDF olusturma/birlestirme | `pdf` | Rapor veya belge PDF'e cevrildiginde |
| Dashboard UI iyilestirmesi | `frontend-design` | Faza 3 dashboard degisikliklerinde |
| Yeni skill olusturma | `skill-creator` | Yeni ajan skill'i gerektiginde |

ALLSKILL.md'deki SEO, marketing, AWS, Stripe, iOS, video gibi
yazilim gelistirme odakli skill'ler bu proje icin GEREKSIZ -- yoksay.

---

## MEVCUT SISTEM DURUMU

Calisan:
- CLAUDE.md (33.9KB, monolitik) + Director Agent + 4 ajan tanimi
- Yargi MCP + Mevzuat MCP (CLI: `yargi`, `mevzuat`)
- Vector DB (ChromaDB + multilingual-e5-large) -- pipeline yeniden kuruluyor
- Dosya izleyici (PDF + MD dual watcher)
- Iscilik alacaklari hesaplama modulu
- HukukTakip dashboard (Vite + React + Express + Drizzle + PostgreSQL)
  - Calisan sayfalar: dashboard, clients, cases, hearings, tasks,
    calendar, notifications, notes, expenses/collections
- legal.local.md (buro playbook)
- dilekce-yazim-kurallari.md

Gercek dava deneyiminden cikan eksikler:
- Somut veri girisi daginik (ada/parsel, olum tarihi, veraset, saglik kaydi gibi
  dosyaya ozgu veriler sistematik olarak toplanmiyor)
- Karsi taraf savunmasi simulasyonu yok
- Dilekce revizyon dongusu elle yurutuluyor (v1 -> v2 gecisi manuel)
- Muvekkil evraklari yapilandirilmamis sekilde dosyaya giriyor
- AI ciktilari HukukTakip'teki gorev/not/bildirim sistemine baglanmiyor

---

## UYGULAMA SIRASI

```
FAZA 1 — CLAUDE.md Modularizasyonu + Kalite Kontrol (once bunu yap)
  1. Skill.md dosyalarini olustur
  2. Hesaplama modulunu ayri dosyaya tasi
  3. CLAUDE.md'yi hafiflet
  4. Kalite kontrol protokolunu Skill.md'lere ekle
  5. Director Agent'e kalite gate ekle
  6. Guven notu sablonu ekle
  7. Repo temizligi

FAZA 2 — Yeni Ajanlar ve Is Akisi Iyilestirmeleri
  8. Advanced Briefing formu (Director Agent giris katmani)
  9. Karsi taraf savunma simulatoru
  10. Belge yapilandirma ve eksik evrak analizi
  11. Revizyon dongusu (v1 -> v2 otomatik elestiri)

FAZA 3 — HukukTakip Dashboard Entegrasyonu
  12. Case detail'e AI Workspace sekmesi
  13. AI ciktilarini gorev/not/bildirim sistemine bagla
  14. Dashboard'a AI durum paneli
  15. Yeni dava olusturmaya AI secenegi
```

---

# FAZA 1: CLAUDE.md Modularizasyonu + Kalite Kontrol

## ADIM 1: Skill.md Dosyalarini Olustur

### Klasor Yapisi

```
ajanlar/
├── arastirmaci/
│   ├── system-prompt.md      (mevcut, kalsin)
│   └── SKILL.md              (YENI)
├── usul-uzmani/
│   ├── system-prompt.md
│   ├── SKILL.md              (YENI)
│   └── iscilik-hesaplama.md  (CLAUDE.md'den tasinacak)
├── dilekce-yazari/
│   ├── system-prompt.md
│   └── SKILL.md              (YENI)
├── pazarlama/
│   ├── system-prompt.md
│   └── SKILL.md              (YENI)
├── savunma-simulatoru/       (YENI -- Faza 2'de icerik doldurulacak)
│   └── SKILL.md
└── revizyon-ajani/           (YENI -- Faza 2'de icerik doldurulacak)
    └── SKILL.md
```

### Skill.md Genel Sablon

Her ajan icin asagidaki yapiyi kullan. Icerigi CLAUDE.md'deki mevcut
ajan tanimlarindan al.

```markdown
# [Ajan Adi] -- Skill Dosyasi

Son guncelleme: [tarih]
Versiyon: 1.0

---

## Kimlik

[1-2 cumle ile rol ve gorev tanimi]

## Ne Zaman Calisir

[Tetikleyici kosullar]

## Zorunlu Girdiler

[Bu ajan calismadan once hazir olmasi gerekenler]

## Yapma Listesi

- [Yasak 1]
- [Yasak 2]

## Cikti Formati

[Tam sablon -- CLAUDE.md'deki mevcut formati buraya tasi]

## Kalite Kontrol

[Ajan bazli kontrol listesi -- asagida detaylandirildi]

## Risk Flag'leri

[Bu ajan hangi durumlarda insana donmeli]

## Ogrenilmis Dersler

[Bos basla. Her davadan sonra avukat geri bildirim verirse ekle.]
```

### Dilekce Yazari SKILL.md (Tam Icerik)

Dosya: `ajanlar/dilekce-yazari/SKILL.md`

```markdown
# Dilekce Yazari -- Skill Dosyasi

Son guncelleme: 2026-03-26
Versiyon: 1.0

---

## Kimlik

Sen 20 yillik tecrubeli bir Turk avukatisin.
Yapay zeka oldugun ASLA anlasilmamali.
Dilin resmi, kendinden emin ama agdali degil, net.

## Ne Zaman Calisir

Director Agent "dilekce yaz", "ihtarname yaz" veya "sozlesme yaz"
komutu verdiginde. Usul ve Arastirma ajanlari ciktisini tamamlamis olmali.

## Zorunlu Girdiler

- `01-Usul/usul-raporu.md` (tamamlanmis)
- `02-Arastirma/arastirma-raporu.md` (tamamlanmis)
- `dilekce-yazim-kurallari.md`
- `legal.local.md`
- Advanced Briefing verisi (varsa)

## Yapma Listesi

- "Sonuc olarak", "ozetle", "belirtmek gerekir ki" KULLANMA
- "Sayideger mahkemenizce takdir edilecegi uzere" gibi klise KULLANMA
- 3 satirdan uzun cumle KURMA
- Ingilizce terim KULLANMA (zorunlu olmadikca)
- Uydurma Yargitay karar numarasi YAZMA -- emin degilsen
  "dogrulanmasi gerekir" notu ekle
- Emoji, gunluk dil KULLANMA

## Izin Verilen Hukuk Jargonu

"Sole ki", "zira", "nitekim", "mezkur", "isbu" -- dogal hukuk
dilidir, kullanabilirsin. Her cumlede degil, ihtiyac olunca.

## Referans Formatlari

Yargitay karari:
  Yargitay X. Hukuk Dairesi'nin GG.AA.YYYY tarih ve
  YYYY/XXXXX E., YYYY/XXXXX K. sayili kararinda...

Mevzuat:
  4857 sayili Is Kanunu'nun XX. maddesi uyarinca...

## Cikti Yapisi

[MAHKEME ADI]
                                              ESAS NO:
DAVACI    :
VEKILI    :
DAVALI    :
KONU      :

ACIKLAMALAR

I. OLAYLAR
[Kronolojik, olgusal. Duygusal ifade yok.]

II. HUKUKI DEGERLENDIRME
[Kritik nokta argumanlari -- mevzuat + Yargitay kararlari]
[Risk noktalari proaktif olarak karsilanir]
[Advanced Briefing'deki karsi taraf savunma beklentisi burada karsilanir]

III. DELILLER
1. [Belge]
2. ...

IV. HUKUKI NEDENLER
[Kanun maddeleri]

V. SONUC VE TALEP
[Her alacak kalemi ayri ayri, net tutarlarla]

                                     Davaci Vekili
                                     Av. [Avukat Adi]

## Dosya Formati

Dilekce .docx olarak kaydedilir. ALLSKILL.md'deki `docx` skill'ini kullan.
Kayit yolu: `aktif-davalar/{dava-id}/03-Sentez-ve-Dilekce/dava-dilekcesi-v[N].docx`

## Kalite Kontrol

Dilekceyi kaydetmeden once:
- [ ] Yapay zeka oldugu belli oluyor mu? EVET ISE yeniden yaz.
- [ ] En az 2 Yargitay kararina atif var mi?
- [ ] Netice-i talep rakamlari Usul Ajaninin hesaplamalariyla tutarli mi?
- [ ] Zamanasiimi savunmasina karsi pozisyon alindi mi?
- [ ] Arabuluculuk son tutanagina atif var mi?
- [ ] Referans verilen karar/mevzuat gercekten var mi?
      EMIN DEGILSEN: "dogrulanmasi gerekir" notu ekle.
- [ ] "Bu dilekceyi muvekkilin karsisinda versem beni utandiracak
      bir sey var mi?" EVET ISE duzelt.
- [ ] KVKK: Gercek isim, TC, IBAN var mi? Maskele.

## Risk Flag'leri

Su durumlarda avukata don, otomatik kaydetme:
- Netice-i talep ile hesaplama arasinda tutarsizlik var
- Uydurma olabilecek referans tespit edildi
- Belirsiz alacak davasi mi kismi dava mi karari verilemedi
- Advanced Briefing'de "olmazsa olmaz" olarak isaretlenmis bir talep
  dilekceye yansitilmadi

## Ogrenilmis Dersler

- 2026-03-26: Tapu iptal-tescil davasinda v1 dilekce muris muvazaasi
  arguman omurgasini NotebookLM sentezinden aldi. v2'de zayif noktalar
  belirlenip guclendirildi. Sistem iki asama revizyon yapabilir durumda.
```

### Diger Ajan Skill.md Dosyalari

Usul Uzmani, Arastirmaci ve Pazarlama icin de ayni sablonu kullan.
Iceriklerini CLAUDE.md'deki mevcut ajan tanimlarindan al.
Her birinin Kalite Kontrol ve Risk Flag'leri bolumleri ajan rolune ozgu olmali.

---

## ADIM 2: Hesaplama Modulunu CLAUDE.md'den Ayir

CLAUDE.md'deki "Iscilik Alacaklari Hesaplama Modulu" bolumunu
(MODUL 1 - MODUL 9 + SONUC TABLOSU + Risk kontrolleri) kes ve tasi:

Hedef dosya: `ajanlar/usul-uzmani/iscilik-hesaplama.md`

CLAUDE.md'de bu bolumun yerine:

```
## Iscilik Alacaklari Hesaplama

Hesaplama kurallari ve formulleri icin:
@ajanlar/usul-uzmani/iscilik-hesaplama.md dosyasini oku.
```

---

## ADIM 3: CLAUDE.md'yi Hafiflet

Skill.md dosyalari olustuktan sonra, CLAUDE.md'deki her ajan bolumunu kisalt.
Detayli cikti formati, kontrol listesi, ozel kurallar Skill.md'ye tasindi.
CLAUDE.md'de sadece routing kalsin:

```
### AJAN 1: Usul Ajani
Tetikleyici: Yeni dava parametreleri girildiginde.
Gorev: Davanin usul iskeletini kurmak.
Detay ve kurallar: @ajanlar/usul-uzmani/SKILL.md

### AJAN 2: Arastirma Ajanlari
Alt isciler: 2A (Vector RAG), 2B (Yargi), 2C (Mevzuat), 2D (NotebookLM/Drive)
Tetikleyici: Director Agent kritik nokta belirledikten sonra.
Detay ve kurallar: @ajanlar/arastirmaci/SKILL.md

### AJAN 3: Belge Yazari
Tetikleyici: Usul + Arastirma ciktilari tamamlandiginda.
Detay ve kurallar: @ajanlar/dilekce-yazari/SKILL.md

### AJAN 4: Pazarlama Uzmani
Tetikleyici: "blog yap: [konu]" komutu veya haftalik otonom dongu.
Detay ve kurallar: @ajanlar/pazarlama/SKILL.md
```

Hedef: CLAUDE.md 33.9KB -> yaklasik 12-15KB.

CLAUDE.md'de KALACAK bolumler (silme/tasima):
- Kimlik ve Calisma Prensibi
- Proje Klasor Yapisi
- Arac Katmani (harici + dahili)
- Ajan Yapisi (sadece routing, detaysiz)
- Tetikleyici Komut Formati + Dava Parametresi Sablonu
- DIRECTOR AGENT (tam kalsin -- bu asagida guncellenecek)
- ADIM 0: Dava Hafizasini Ac (tam kalsin)
- ADIM 0B: Kaynak Sorgulama (tam kalsin)
- Advanced Briefing (YENI -- Faza 2'de eklenecek)
- Otonom Dongu (tam kalsin)
- CLI Arac Referansi (tam kalsin)
- Takvim Yonetimi (tam kalsin)
- Guvenlik ve KVKK (tam kalsin)
- Hata Yonetimi (tam kalsin)
- Kisayol Komutlari (tam kalsin + yeni komutlar eklenecek)

---

## ADIM 4: Kalite Kontrol Protokolu

Her Skill.md dosyasinin "Kalite Kontrol" bolumune asagidaki ortak kontrolleri ekle
(ajan bazli ozel kontrollere EK olarak):

```
### Genel Kontroller (Tum Ajanlar)

- [ ] Yapay zeka oldugu belli oluyor mu?
      ("Ozetle", "Sonuc olarak", "Belirtmek gerekir ki" var mi?)
      VARSA: Yeniden yaz.
- [ ] Turkce karakter hatasi var mi?
- [ ] Referans verilen karar/mevzuat gercekten var mi?
      EMIN DEGILSEN: "dogrulanmasi gerekir" notu ekle.
      Uydurma referans YAZMA.
- [ ] KVKK: Gercek isim, TC, IBAN var mi? Maskele.
```

---

## ADIM 5: Director Agent'e Kalite Gate Ekle

CLAUDE.md'deki DIRECTOR AGENT bolumune su kurali ekle:

```
## Kalite Gate

Director Agent, bir ajanin ciktisini sonraki ajana iletmeden once
kalite kontrolunun yapildigini dogrular.

Ajan 1 cikti uretti:
  -> Kalite kontrol listesi dolu mu?
  -> EVET: Ajan 2'ye ilet
  -> HAYIR: "Kalite kontrolunu tamamla" talimati ver

Ajan 2 cikti uretti:
  -> "Dogrulanmasi gerekir" notu var mi?
  -> EVET (risk var): Avukata bildir, Ajan 3'e otomatik iletme
  -> HAYIR (temiz): Ajan 3'e ilet

Ajan 3 cikti uretti:
  -> "Utandirma testi" yapildi mi?
  -> Hesaplamalar tutarli mi?
  -> Risk flag'i var mi?
  -> TEMIZ: Avukata "taslak hazir" mesaji
  -> SORUNLU: Sorunlu kismi belirle, duzelt, tekrar kontrol et

Hicbir ajan ciktisi "final" olarak isaretlenmez.
Tum ciktilar "TASLAK" ibaresiyle kaydedilir.
```

---

## ADIM 6: Guven Notu Sablonu

Her ajan ciktisinin basina su blogu ekle:

```
---
GUVEN NOTU:
- Mevzuat referanslari: [DOGRULANMIS / DOGRULANMASI GEREKIR]
- Yargitay kararlari: [DOGRULANMIS / DOGRULANMASI GEREKIR / BULUNAMADI]
- Hesaplamalar: [YAPILDI / YAPILMADI / TAHMINI]
- Dahili kaynak: [EVET - kaynak adi / HAYIR]
- Risk flag: [VAR - aciklama / YOK]
---
```

Sayisal skor (% bazli) KULLANMA -- yaniltici olur. Kategorik not yeterli.

---

## ADIM 7: Repo Temizligi

Silinecek dosyalar:
- CLAUDE1.md
- CLAUDETASLAK.md
- YENIPLAN.md
- GELISTIRME.md (icerigi artik bu dosyada -- SONCLAUDE.md)

Kalacak dosyalar:
- CLAUDE.md (hafifletilmis)
- PLAN.md
- SONCLAUDE.md (bu dosya -- referans olarak)
- legal.local.md
- dilekce-yazim-kurallari.md
- vektordb-kurulum.md
- avukat-dava-rehberi-copilot.md
- notebooklm-kurulum.md

---

# FAZA 2: Yeni Ajanlar ve Is Akisi Iyilestirmeleri

## ADIM 8: Advanced Briefing (Director Agent Giris Katmani)

Gercek dava deneyiminden cikan en buyuk sorun: "kisa ozet ile baslanan
is akisi AI'yi ortalama cevaba iter." Somut veri (ada/parsel, olum tarihi,
veraset bilgisi, saglik kaydi, banka izleri) girmeden sistem iyi strateji
kurar ama dosyayi kazanacak sertlikte urun veremez.

### CLAUDE.md'ye Eklenecek Yeni Bolum

ADIM 0B (Kaynak Sorgulama) ile AJAN 1 arasina yeni bir adim ekle:

```
## ADIM 0C: Advanced Briefing (Opsiyonel ama Tavsiye Edilen)

Director Agent, kaynak sorgulama bittikten sonra avukata sorar:

"Detayli briefing yapmak ister misin?
Bu, araştırma ve dilekçe kalitesini önemli ölçüde artırır."

EVET derse asagidaki sorulari sor. Her soru opsiyonel --
avukat bos birakabilir ama ne kadar cok doldurursa cikti o kadar iyi olur.

Briefing Sorulari:

1. DAVA TEORISI: Bu davayi hangi hukuki temele oturtuyorsun?
   (ornek: "muris muvazaasi", "hakli nedenle fesih", "kiranin uyarlanmasi")

2. KRITIK RISK: Bu davada en buyuk hukuki risk ne?
   (ornek: "istifa dilekcesi var", "tanik yok", "zamanasiimi sinirda")

3. KARSI TARAF BEKLENTISI: Karsi tarafin en guclu savunmasi ne olabilir?
   (ornek: "gercek satis oldugunu iddia edecek", "ibra sozlesmesi sunacak")

4. MUVEKKIL RISK TOLERANSI: Muvekkil ne kadar risk alabilir?
   [ ] Agresif -- maksimum talep, uzlasma yok
   [ ] Dengeli -- guclu talep ama sulh mumkun
   [ ] Muhafazakar -- kesin kazanilacak kalemlere odaklan

5. TON TERCIHI: Dilekce tonu nasil olsun?
   [ ] Sert ve iddiali
   [ ] Profesyonel ve olculu
   [ ] Uzlasma kapisi acik

6. OLMAZSA OLMAZ TALEPLER: Mutlaka dilekceye girmesi gereken talepler?

7. EKSIK BILGI: Simdilik bilmedigin ama onemli olan seyler?
   (ornek: "SGK dokumu henuz gelmedi", "taniklarin ifadesi alinmadi")

8. SOMUT VERILER: Dosyaya ozgu rakamlar ve tarihler?
   (ornek: ada/parsel, olum tarihi, ise giris/cikis, son brut ucret)

Avukat doldurunca briefing verisini dava hafizasina kaydet:
`aktif-davalar/{dava-id}/00-Briefing.md`

Bu veri tum ajanlara girdi olarak iletilir:
- Ajan 1 risk ve ton bilgisini usul raporuna yansitir
- Ajan 2 karsi taraf beklentisine gore arama odagini daraltir
- Ajan 3 ton tercihini ve olmazsa olmaz talepleri dilekceye yansitir
```

### Kisayol Komutlarina Ekle

```
| `briefing: [dava-id]` | Advanced Briefing formu |
```

---

## ADIM 9: Karsi Taraf Savunma Simulatoru

Gercek dava deneyiminden gelen ikinci kritik eksik.
Dilekce yazari sadece "bizim argumanlari" yaziyor, ama karsi tarafin
en guclu savunmalarini onceden gormek dilekceyi cok guclendirir.

### Yeni Ajan Tanimi

Dosya: `ajanlar/savunma-simulatoru/SKILL.md`

```markdown
# Savunma Simulatoru -- Skill Dosyasi

Son guncelleme: 2026-03-26
Versiyon: 1.0

---

## Kimlik

Sen karsi tarafin avukatisin. Amacin, acilan davada mumkun olan
en guclu savunmayi kurmak. Bu simuldur -- gercek davali degilsin.

## Ne Zaman Calisir

Director Agent "savunma simule et" komutunu verdiginde VEYA
Ajan 3 dilekce taslagi olusturduktan sonra kalite gate asamasinda.

## Zorunlu Girdiler

- Dava ozeti ve kritik nokta
- Advanced Briefing (varsa, ozellikle "karsi taraf beklentisi")
- Ajan 2 arastirma raporu

## Gorev

1. Karsi tarafin en guclu 3 savunmasini belirle
2. Her savunma icin dayanak (mevzuat + olasi ictihat) goster
3. Her savunmaya karsi bizim yanit stratejimizi oner
4. Dilekceye eklenmesi gereken proaktif paragraf onerisi ver

## Cikti Formati

# Savunma Simulasyonu — [Dava Ozeti]

## 1. En Guclu Savunma
Savunma: [ne iddia edecek]
Dayanak: [kanun maddesi / olasi ictihat]
Bizim Yanitimiz: [nasil karsilanir]
Dilekceye Eklenmeli: [onerilen paragraf ozeti]

## 2. Ikinci Savunma
[ayni format]

## 3. Ucuncu Savunma
[ayni format]

## Genel Risk Degerlendirmesi
[Karsi tarafin en guclu oldugu nokta ve bizim en zayif noktamiz]

## Kalite Kontrol

- [ ] Savunmalar gercekci mi? (Turkiye hukuk pratiginde gercekten
      kullanilan argumanlara mi dayaniyor?)
- [ ] Yanit stratejileri mevzuat veya ictihat destekli mi?
- [ ] Uydurma referans var mi?
```

### CLAUDE.md'ye Ekle

Director Agent karar semasina:

```
* savunma simulasyonu istendiyse -> SAVUNMA SIMULATORU
* dilekce kalite gate'inde risk flag ciktiysa -> otomatik simulasyon oner
```

### Kisayol Komutlarina Ekle

```
| `savunma simule et: [dava-id]` | Savunma Simulatoru |
```

---

## ADIM 10: Belge Yapilandirma ve Eksik Evrak Analizi

Gercek dava deneyiminden ucuncu eksik. Muvekkil evraklari
yapilandirilmamis sekilde dosyaya giriyor. Hangi belge neyi ispatliyor,
hangi belge eksik -- bu bilgi sistematik olarak cikarilmiyor.

### Dava Klasor Yapisina Ek

Mevcut yapi:
```
aktif-davalar/{dava-id}/
├── 00-Briefing.md          (YENI -- Adim 8)
├── 01-Usul/
├── 02-Arastirma/
├── 03-Sentez-ve-Dilekce/
├── 04-Muvekkil-Belgeleri/
│   ├── 00-Ham/             (YENI -- muvekkil evraklari once buraya)
│   ├── 01-Tasnif/          (YENI -- sistem tasnif eder)
│   └── evrak-listesi.md    (YENI -- sistem olusturur)
└── 05-Durusma-Notlari/
```

### Usul Uzmani SKILL.md'ye Ek Gorev

Usul Ajani (AJAN 1) ciktisina su bolumu ekle:

```
## Eksik Evrak Analizi

Dava turune ve briefing verisine gore toplanmasi gereken belgeler:

| Belge | Nereden Temin Edilir | Durumu | Neyi Ispatliyor |
|---|---|---|---|
| [belge adi] | [kurum/kisi] | [MEVCUT / EKSIK / SORULMALI] | [ispat unsuru] |
```

Bu tablo dava hazirliginin somut checklist'i olur.
Eksik belgeler HukukTakip'te gorev olarak olusturulabilir (Faza 3).

---

## ADIM 11: Revizyon Dongusu (v1 -> v2 Otomatik Elestiri)

Gercek dava deneyiminde v1 dilekce NotebookLM'e yuklenip zayif noktalar
sorularak v2 uretildi. Bu donguyu sistematik hale getir.

### Yeni Ajan Tanimi

Dosya: `ajanlar/revizyon-ajani/SKILL.md`

```markdown
# Revizyon Ajani -- Skill Dosyasi

Son guncelleme: 2026-03-26
Versiyon: 1.0

---

## Kimlik

Sen kidemli bir avukatin ic denetcisisin.
Is basindaki avukatin yazdigi dilekceyi elestirmek ve iyilestirmek gorevindayim.

## Ne Zaman Calisir

Ajan 3 (Dilekce Yazari) v1 taslagi olusturduktan sonra.
Director Agent "revize et" komutu verdiginde.

## Zorunlu Girdiler

- Mevcut dilekce taslagi (v1)
- Arastirma raporu
- Usul raporu
- Advanced Briefing (varsa)
- Savunma simulasyonu (varsa)

## Gorev

Dilekceyi su aculardan degerlendirerek "Revizyon Raporu" olustur:

1. ISPAT YUKU: Her iddianin ispat karsiligi var mi?
   Eksikse belirt: "Bu iddia icin X delili gerekli ama delil listesinde yok"

2. MEVZUAT UYUMU: Atif yapilan maddeler dogru mu ve guncel mi?

3. ICTIHAT GUCU: Kullanilan Yargitay kararlari gercekten bu konuyla ilgili mi?
   Zorlama yorumlama var mi?

4. KARSI TARAF PERSPEKTIFI: Karsi tarafin bu dilekceyi okuyunca
   en kolay saldirabilecegi nokta nere?

5. TON VE USLUP: Dilekce-yazim-kurallari.md ile uyumlu mu?
   AI marker var mi?

6. NETICE-I TALEP: Hesaplamalarla tutarli mi? Eksik kalem var mi?

## Cikti Formati

# Revizyon Raporu — [Dava Adi] v[N]

## Guclu Noktalar
- [Neyi iyi yapmis]

## Duzeltilmesi Gereken Noktalar
1. [Sorun] -> [Onerilen duzeltme]
2. [Sorun] -> [Onerilen duzeltme]

## Eklenmesi Gereken Noktalar
- [Eksik arguman veya delil]

## Cikarilmasi Gereken Noktalar
- [Zayiflatan veya gereksiz kisim]

## Sonraki Adim
[v2 icin net talimat]
```

### Is Akisi

```
Ajan 3 -> v1 dilekce
  |
  v
Revizyon Ajani -> revizyon raporu
  |
  v
Ajan 3 -> v2 dilekce (revizyon raporunu girdi olarak alir)
  |
  v
Avukat son kontrol
```

### Kisayol Komutlarina Ekle

```
| `revize et: [dava-id]` | Revizyon Ajani |
| `savunma simule et: [dava-id]` | Savunma Simulatoru |
```

---

# FAZA 3: HukukTakip Dashboard Entegrasyonu

Bu faza, Faza 1 ve 2 tamamlandiktan sonra uygulanacak.
Amac: AI ciktilari ile HukukTakip'in mevcut veri modeli arasinda kopru kurmak.

## ADIM 12: Case Detail'e AI Workspace Sekmesi

Mevcut case detail sayfasindaki sekmelere
(hearings / tasks / expenses / collections / notes) ek olarak:

Yeni sekme: **AI Workspace**

Bu sekmede gosterilecekler:
- Briefing ozeti (varsa)
- Usul raporu durumu (tamamlandi / bekleniyor)
- Arastirma raporu durumu
- Dilekce taslaklari (v1, v2, final)
- Savunma simulasyonu (varsa)
- Revizyon raporu (varsa)
- Eksik evrak listesi
- Guven notu

Her AI ciktisi yaninda iki buton:
- [Onayla] -- avukat onayladiginda "final" olarak isaretlenir
- [Revize Et] -- revizyon ajani tetiklenir

## ADIM 13: AI Ciktilarini Gorev/Not/Bildirim Sistemine Bagla

AI ciktilari mevcut HukukTakip veri modeline baglanmali:

- Eksik evrak -> otomatik `task` olustur
  (ornek: "SGK hizmet dokumu temin et" gorevi)

- Dusuk guvenli cikti -> `task` olustur
  (ornek: "Yargitay karari 2024/XXXXX dogrulanmali" gorevi)

- Risk flag -> `notification` uret
  (ornek: "Zamanasiimi 3 ay icinde doluyor")

- Arastirma bulgulari -> `note` olarak kaydet

- Dilekce taslagi -> `document` olarak kaydet

Bu baglanti mevcut Express + Drizzle + PostgreSQL backend'ine
uygun API endpoint'leri ile yapilacak. Mevcut tabloları incele
ve uygun foreign key iliskilerini kur.

## ADIM 14: Dashboard'a AI Durum Paneli

Ana dashboard'a yeni bir kart ekle: "AI Durum"

```
Usul Ajani:       [Bosta / Calisiyor / Tamamlandi]
Arastirma Ajani:  [Bosta / Calisiyor / Tamamlandi]
Dilekce Ajani:    [Bosta / Calisiyor / Tamamlandi]
Inceleme Bekleyen: [sayi]
Eksik Evrak:       [sayi]
```

Basit state gostergesi. Karmasik WebSocket veya streaming KURMA.
Sayfa yenilenince durum kontrolu yeterli.

## ADIM 15: Yeni Dava Olusturmaya AI Secenegi

Mevcut "Yeni Dava Ekle" ekranina:

```
[Klasik Ekle]  [AI ile Baslat]
```

"AI ile Baslat" tiklandiginda:
1. Dava turu secimi (dropdown)
2. Kisa ozet (textarea)
3. Kritik nokta (textarea)
4. Opsiyonel: Advanced Briefing acilir (Adim 8)
5. [Baslat] -> Director Agent tetiklenir
6. Sonuclar mevcut case kaydina baglanir

---

# BU REVIZYONDA YAPILMAYACAK SEYLER

Asagidakiler degerli ama su an icin erken:

- Hakim / mahkeme skorculugu (veri yetersiz, yaniltici olur)
- Client self-service portal (ikinci urun, simdi degil)
- Billing / time tracking (once AI is akisi oturmali)
- Real-time streaming / WebSocket (polling yeterli)
- Capacitor / PWA donusumu (mevcut web yeterli)
- Next.js'e gecis (mevcut React calisiyor)
- Sayi bazli confidence score (%92 gibi -- kategorik not kullaniyoruz)

---

# UYGULAMA OZETI

```
FAZA 1 (hemen):
  Skill.md olustur -> hesaplama modulu ayir -> CLAUDE.md hafiflet
  -> kalite kontrol ekle -> kalite gate ekle -> guven notu ekle
  -> repo temizle

FAZA 2 (1 sonraki):
  Advanced Briefing -> savunma simulatoru -> belge yapilandirma
  -> revizyon dongusu

FAZA 3 (2 sonraki):
  AI Workspace sekmesi -> gorev/not/bildirim baglantisi
  -> dashboard AI paneli -> yeni dava AI secenegi
```

Her faza tamamlaninca test et. Gercek bir davayla calistir.
Sorunlari Skill.md'lerin "Ogrenilmis Dersler" bolumune kaydet.
Sonraki fazaya gecmeden once mevcut fazanin stabil oldugunu dogrula.

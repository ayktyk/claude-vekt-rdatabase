# Playbook — İşçilik Alacakları / İşVEREN FESHİ (haksız veya geçersiz fesih)

Son güncelleme: 2026-07-23
Durum: **AKTİF — mevzuat ve içtihat MCP ile doğrulandı**
Doğrulama: Yargı-MCP-Pro · 4857 (mevzuat_id 103054), 7036 (104627), 1475 (104983)
· Yargıtay 9. HD documentId 318276000, 621990600, 1093760300 — tam metin okundu
Kapsam: İş sözleşmesi **işveren tarafından** feshedildi; müvekkil İŞÇİ.
Bitişik playbook: işçi kendi feshetmişse → `iscilik-isci-hakli-fesih.md`,
işe iade talebi varsa → `ise-iade.md`, iş kazası varsa → **bu playbook KULLANILMAZ**
(ayrı rejim: 7036 m.3/3 uyarınca arabuluculuk dava şartı DEĞİLDİR).

---

## 0. HIZLI KAPI — dosya gelince ilk 10 dakika

Bu altı soru cevaplanmadan hiçbir işlem başlatılmaz. Dördü hak kaybı üretir.

- [ ] **FESİH TARİHİ tam olarak nedir ve belgesi var mı?** Tüm süreler buradan işler.
- [ ] **İşe iade hakkı var mı?** İşyerinde **30 veya daha fazla işçi** + işçinin
      **en az 6 aylık kıdemi** + belirsiz süreli sözleşme (İş K. m.18). Varsa
      **fesih bildiriminin tebliğinden itibaren 1 AY içinde arabulucuya başvuru
      zorunlu** (m.20/1) — bu süre kaçarsa işe iade hakkı tümden kaybolur.
      → Hemen `ise-iade.md` playbook'una geç.
- [ ] **Zamanaşımı yakın mı?** Kıdem/ihbar/yıllık izin → fesihten **5 yıl**
      (İş K. Ek m.3). Ücret, fazla çalışma, hafta tatili, UBGT → **5 yıl**
      (İş K. m.32). Fesih 25.10.2017'den ÖNCE ise geçiş kuralı devrede (§4).
- [ ] **Arabuluculuk son tutanağı var mı?** Yoksa dava açılamaz (7036 m.3/1);
      açılırsa **tebliğe çıkarılmadan usulden reddedilir** (m.3/2).
- [ ] **İbraname / ikale sözleşmesi imzalandı mı?** Varsa metni ilk gün görülmeli;
      hesap kurgusu ve dava stratejisi buna göre değişir.
- [ ] **İşçi başka işe girdi mi, SGK çıkış kodu ne?** Çıkış kodu, işverenin fesih
      gerekçesini ele verir; savunmanın önünü kesmek için ilk günden bilinmelidir.

> **Kaçırılan tek gün davayı bitirir.** Doğrulanmış örnek: Yargıtay 9. HD
> E.2024/7382 K.2024/12788 (01.10.2024) — arabuluculukta ve pandemide duran
> süreler eklendiğinde bile dava, zamanaşımının dolmasından **bir gün sonra**
> açıldığı için reddedilmiş ve red onanmıştır.

---

## 1. İstenecek bilgi (müvekkilden)

| # | Bilgi | Neden |
|---|---|---|
| 1 | İşe giriş – işten çıkış tarihi | Kıdem süresi, ihbar öneli, zamanaşımı başlangıcı |
| 2 | Fesih nasıl bildirildi (yazılı/sözlü/noter/e-posta), elinde ne var | İspat yükü işverende ama fesih anını işçi kurar |
| 3 | İşverenin gösterdiği fesih sebebi | Geçerli sebep denetimi + m.18/3'teki yasak sebep var mı |
| 4 | Son brüt/net ücret + yan haklar (yemek, yol, prim, ikramiye, lojman) | Kıdem ve ihbar **giydirilmiş** ücretten hesaplanır |
| 5 | Ücret nasıl ödeniyordu (banka/elden), asgari ücret gösterimi var mı | Gerçek ücret iddiası ve ispat yolu |
| 6 | Haftalık çalışma düzeni: gün, saat, ara dinlenme, vardiya | Fazla çalışma / hafta tatili / UBGT hesabı |
| 7 | Yıllık izin kullanıldı mı, kaç gün, imzalı izin defteri var mı | Yıllık izin ücreti |
| 8 | Bordrolar imzalandı mı, fazla mesai sütunu dolu muydu, ihtirazi kayıt konuldu mu | Bordro imzalıysa ispat rejimi tamamen değişir (§8) |
| 9 | İbraname/ikale imzalandı mı, ne zaman, karşılığında ne ödendi | Savunmanın en güçlü kozu; erken görülmeli |
| 10 | İşyerinde kaç işçi çalışıyor (fesih tarihinde) | İş güvencesi eşiği (m.18) |
| 11 | Alt işveren – asıl işveren ilişkisi var mı, kim ödüyordu | Müteselsil sorumluluk, davalı tespiti |
| 12 | Tanık olabilecek mesai arkadaşları (halen çalışıyor mu?) | Fazla çalışma ispatı fiilen tanığa dayanır |
| 13 | İşsizlik ödeneği alındı mı | Feshin İŞKUR'a hangi kodla bildirildiğini gösterir |

---

## 2. Toplanacak belge

| Belge | Kaynak | Kim alır |
|---|---|---|
| SGK hizmet dökümü (uzun/işyeri unvanlı) | e-Devlet | Müvekkil |
| SGK işten ayrılış bildirgesi + **çıkış kodu** | e-Devlet / İŞKUR | Müvekkil |
| İş sözleşmesi | Müvekkil / işveren (delil olarak istenir) | Müvekkil |
| Son 1 yıl ücret bordroları | Müvekkil; yoksa mahkeme aracılığıyla işverenden | Büro |
| Banka hesap dökümü (ücret yatan hesap, tüm çalışma dönemi) | Banka / internet bankacılığı | Müvekkil |
| Fesih bildirimi / ihtarname / e-posta yazışması | Müvekkil, noter | Müvekkil |
| İbraname – ikale sözleşmesi (varsa) | Müvekkil | Müvekkil |
| Yıllık izin defteri / izin formları | İşveren (delil listesinde talep) | Büro |
| İşyeri giriş-çıkış (PDKS), kamera, nöbet çizelgesi | İşveren (delil listesinde talep) | Büro |
| **Arabuluculuk son tutanağı — aslı veya arabulucu onaylı örneği** | Arabuluculuk bürosu | Büro |
| Vekâletname (işçilik alacakları davası açmaya ve takibe yetkili) | Noter | Müvekkil |

> Son tutanağın **aslı veya arabulucu tarafından onaylanmış örneği** dava
> dilekçesine eklenmek zorundadır (7036 m.3/2). Fotokopiyle dosya açmayın.

---

## 3. Dava öncesi zorunlu adımlar

### 3.1 İhtarname — zorunlu değil, ama iki halde çekilir
İşveren feshinde ihtarname **dava şartı değildir**. Yine de:
- Ödenmemiş kalemler netse ve **temerrüt tarihini öne çekmek** isteniyorsa,
- İşveren "işçi kendi ayrıldı" diyecekse, karşı iradeyi kayda geçirmek için,
noterden çekilir. İhtarnamede talep kalemleri **ayrı ayrı** yazılır.

### 3.2 Arabuluculuk — DAVA ŞARTI (7036 m.3)

Doğrulanmış hüküm: *«Kanuna, bireysel veya toplu iş sözleşmesine dayanan işçi
veya işveren alacağı ve tazminatı ile işe iade talebiyle açılan davalarda,
arabulucuya başvurulmuş olması dava şartıdır.»* (7036 m.3/1)

| Konu | Kural | Dayanak |
|---|---|---|
| Nereye başvurulur | Karşı tarafın (birden fazlaysa birinin) yerleşim yeri **veya işin yapıldığı yer** arabuluculuk bürosu | m.3/5 |
| Süre | Arabulucu görevlendirmeden itibaren **3 hafta**; zorunlu hâlde **+1 hafta** | m.3/10 |
| Yetki itirazı | Karşı taraf **en geç ilk toplantıda** belgeyle itiraz eder; sulh hukuk **kesin** karar verir | m.3/9 |
| İlk toplantıya katılmama | Katılmayan taraf, davada haklı çıksa bile **karşı tarafın yargılama giderlerinin yarısından** sorumlu; ayrıca karşı taraf lehine **AAÜT vekâlet ücretinin yarısına** hükmedilir | m.3/12 (7531 s.K. m.28, 7.11.2024 değişikliği) |
| Süreye etkisi | Büroya başvurudan son tutanağa kadar **zamanaşımı durur, hak düşürücü süre işlemez** | m.3/17 |
| Temsil | Taraflar bizzat, kanuni temsilci veya avukatla; işverenin **yazılı yetkilendirdiği çalışanı** da temsil edip son tutanağı imzalayabilir | m.3/18 |

**Kapsam genişlemesi (28.03.2023):** *«Bu alacak ve tazminatla ilgili itirazın
iptali, menfi tespit ve istirdat davaları hakkında birinci cümle hükmü
uygulanır.»* (7036 m.3/1 ek cümle, 7445 s.K. m.41) — işçilik alacağını icraya
koyup itirazla karşılaşırsanız, **itirazın iptali davası için de arabuluculuk
şarttır.**

**Uyarı:** 7036 m.3'ün 15. fıkrası, Anayasa Mahkemesi'nin 3/6/2025 tarihli
E.2024/157, K.2025/121 sayılı kararıyla **iptal edilmiştir**. İptal edilen
hükmün içeriği ve etkisi bu araştırmada incelenmemiştir — ücret/gider
paylaşımına ilişkin bir uyuşmazlık çıkarsa önce bu karar okunmalıdır.

### 3.3 Sıralama
İş güvencesi kapsamındaki bir işçide **işe iade** ile **alacak** talepleri farklı
sürelere tabidir (işe iade: fesihten 1 ay; alacak: 5 yıl). Önce işe iade
başvurusu süresinde yapılır; alacak arabuluculuğu bununla birlikte veya sonra
yürütülür. İki dosyayı aynı anda kurgulamadan işe iade süresini harcamayın.

---

## 4. Süre haritası

| Süre | Ne kadar | Başlangıç | Dayanak | Kaçırılırsa |
|---|---|---|---|---|
| İşe iade — arabulucuya başvuru | **1 ay** | Fesih bildiriminin **tebliği** | İş K. m.20/1 | İşe iade hakkı düşer |
| İşe iade — dava | **2 hafta** | Arabuluculuk **son tutanağı** tarihi | İş K. m.20/1 | İşe iade hakkı düşer |
| Kıdem tazminatı, ihbar tazminatı, yıllık izin ücreti | **5 yıl** | Fesih (izin ücretinde: sözleşmenin sona erdiği tarih — m.59) | İş K. **Ek m.3** | Zamanaşımı def'i ile ret |
| Ücret, fazla çalışma, hafta tatili, UBGT | **5 yıl** | Her alacağın doğduğu tarih | İş K. m.32 | Geriye doğru 5 yılın dışı silinir |
| Arabuluculuk süreci | 3 hafta (+1) | Arabulucunun görevlendirilmesi | 7036 m.3/10 | — |
| Zamanaşımının durması | Başvuru → son tutanak | — | 7036 m.3/17 | — |

**Doğrulanmış madde metinleri (Yargıtay 9. HD E.2024/7382 K.2024/12788 içinden
birebir):**

İş K. Ek m.3: *«İş sözleşmesinden kaynaklanmak kaydıyla hangi kanuna tabi
olursa olsun, yıllık izin ücreti ve aşağıda belirtilen tazminatların zamanaşımı
süresi beş yıldır. a) Kıdem tazminatı. ...»*

İş K. Geçici m.8: *«Ek 3 üncü madde, bu maddenin yürürlüğe girdiği tarihten
sonra sona eren iş sözleşmelerinden kaynaklanan yıllık izin ücreti ve
tazminatlar hakkında uygulanır. Ek 3 üncü maddede belirtilen yıllık izin ücreti
ve tazminatlar için bu maddenin yürürlüğe girmesinden önce işlemeye başlamış
bulunan zamanaşımı süreleri, değişiklikten önceki hükümlere tabi olmaya devam
eder. Ancak, zamanaşımı süresinin henüz dolmamış kısmı, ek 3 üncü maddede
öngörülen süreden uzun ise, ek 3 üncü maddede öngörülen sürenin geçmesiyle
zamanaşımı süresi dolmuş olur.»*

> **Pratik sonuç:** Fesih 25.10.2017'den önceyse kıdem/ihbar için eski 10 yıllık
> süre işler; ancak kalan kısım 5 yıldan uzunsa **en geç 25.10.2022'de** dolmuş
> sayılır. 2017 öncesi fesihli eski dosyalarda bu tarih ilk kontrol edilir.

---

## 5. Görev – yetki – harç

**Görev:** İş mahkemesi. *«İş mahkemeleri; ... 4857 sayılı İş Kanununa veya
6098 sayılı Türk Borçlar Kanununun İkinci Kısmının Altıncı Bölümünde düzenlenen
hizmet sözleşmelerine tabi işçiler ile işveren veya işveren vekilleri arasında,
iş ilişkisi nedeniyle sözleşmeden veya kanundan doğan her türlü hukuk
uyuşmazlıklarına ... ilişkin dava ve işlere bakar.»* (7036 m.5/1-a)

**Yetki:** *«davalı gerçek veya tüzel kişinin davanın açıldığı tarihteki
yerleşim yeri mahkemesi ile işin veya işlemin yapıldığı yer mahkemesidir»*;
davalı birden fazlaysa birinin yerleşim yeri de yetkilidir (7036 m.6/1-2).
**Yetki sözleşmesi geçersizdir** (m.6/5) — iş sözleşmesindeki yetki şartına
itibar edilmez, karşı taraf ileri sürerse bu hüküm gösterilir.

**Adliye eşlemesi (zorunlu):** Yer yetkisi belirlendikten sonra somut
ilçe/mahallenin hangi adliyeye bağlı olduğu ayrıca doğrulanır (İstanbul gibi
çok adliyeli yerlerde UYAP yanlış yönlendirme riski). Kaynak URL + tarih
raporlanır; doğrulanamazsa `RİSK FLAG: Yetkili adliye doğrulanamadı`.

**Harç:** Başvurma harcı, peşin harç, gider avansı, vekâlet pulu.
**Tutar ve oranlar bu playbook'ta yazılmaz** — her yıl değişir; dava açılışında
güncel Harçlar Kanunu genel tebliği ve UYAP'tan teyit edilir.

**Dava tipi (belirsiz alacak / kısmi dava) kararı:** Bu playbook'ta HMK
hükümleri doğrulanmadığı için tip seçimi burada bağlanmamıştır.
`[SONRAKİ ARAŞTIRMA BLOĞU — HMK m.107/109 + güncel içtihat]`

---

## 6. Dava akışı

1. **Dilekçe + ekler** — son tutanak aslı/onaylı örneği mutlaka ekte.
2. **Delil listesi** — işverende bulunan belgeler (bordro, izin defteri, PDKS,
   kamera, özlük dosyası) mahkeme aracılığıyla celbi talep edilir. İşçi bu
   belgelere ulaşamaz; talep edilmezse ispat yükü fiilen işçiye kayar.
3. **Cevap dilekçesi** — burada gelecek üç şeye hazır olun: zamanaşımı def'i,
   ibraname, imzalı bordro.
4. **Ön inceleme** — dava şartları (arabuluculuk!), yetki-görev itirazları.
5. **Tahkikat / tanık** — fazla çalışma ve hafta tatili fiilen tanıkla ispat
   edilir; tanığın halen aynı işyerinde çalışıp çalışmadığı sorgulanır.
6. **Bilirkişi (hesap)** — rapora itiraz süresi kaçırılmaz; itiraz kalem kalem
   ve rakamla yapılır. `itiraz-bulucu` skill'i burada devreye girer.
7. **Islah / talep artırımı** — bilirkişi raporundan sonra; **ıslaha karşı
   zamanaşımı def'i** karşı tarafın standart hamlesidir (bkz. §8).
8. **Karar → istinaf** — süre ve kesinlik sınırı karar tebliğinde kontrol edilir.

---

## 7. Talep kalemleri ve hesap yaklaşımı

| Kalem | Şart | Hesap esası |
|---|---|---|
| Kıdem tazminatı | Feshin 1475 m.14'teki hallerden birine girmesi | Her tam yıl için **30 günlük** ücret; **son ücret** üzerinden; giydirilmiş ücret (para ile ölçülebilen menfaatler dahil) |
| İhbar tazminatı | İşveren önel vermeden feshetmişse | Kıdeme göre **2 / 4 / 6 / 8 hafta** (İş K. m.17) |
| Kötüniyet tazminatı | Yalnız **iş güvencesi kapsamı DIŞINDAKİ** işçide, fesih hakkı kötüye kullanılmışsa | Bildirim süresinin **üç katı** (m.17) |
| Yıllık izin ücreti | Kullandırılmayan bakiye izin | Sözleşmenin sona erdiği tarihteki ücret (m.59) |
| Fazla çalışma | Haftalık yasal süre aşımı | §8'deki ispat rejimine tabi |
| Hafta tatili / UBGT | Çalışılmışsa | — |
| Ücret alacağı | Ödenmemiş dönem | — |

**Doğrulanmış hükümler:**
- Kıdem: *«işçinin işe başladığı tarihten itibaren hizmet aktinin devamı
  süresince her geçen tam yıl için işverence işçiye 30 günlük ücreti tutarında
  kıdem tazminatı ödenir. Bir yıldan artan süreler için de aynı oran üzerinden
  ödeme yapılır.»* (1475 m.14)
- Kıdeme esas ücret: *«26 ncı maddenin birinci fıkrasında yazılı ücrete ilaveten
  işçiye sağlanmış olan para ve para ile ölçülmesi mümkün akdi ve kanundan doğan
  menfaatler de gözönünde tutulur.»* (1475 m.14)
- **Kıdem faizi:** *«Kıdem tazminatının zamanında ödenmemesi sebebiyle açılacak
  davanın sonunda hakim gecikme süresi için, ödenmeyen süreye göre mevduata
  uygulanan en yüksek faizin ödenmesine hükmeder.»* (1475 m.14) → Kıdemde
  **yasal faiz değil, mevduata uygulanan en yüksek faiz** talep edilir; talep
  edilmezse hükmedilmez.
- **Kıdem tavanı:** 1475 m.14 son fıkralarında düzenlenmiştir; **tutar bu
  playbook'ta yazılmaz**, hesap `ajanlar/usul-uzmani/iscilik-hesaplama.md`
  modülünden ve güncel tavan tablosundan yapılır.

**Madde numarası tuzağı:** 1475 m.14, kıdeme hak kazandıran halleri sayarken
mülga 1475'in *17/II* ve *16.* maddelerine atıf yapar. Bunların bugünkü
karşılıkları **4857 m.25/II (işverenin haklı feshi)** ve **4857 m.24 (işçinin
haklı feshi)**'dir. Dilekçede eski madde numarası yazılmaz.

---

## 8. Karşı tarafın klasik oyunları

| Savunma | Kırılma noktası |
|---|---|
| **"Zamanaşımı doldu"** | §4'teki tarih hesabı; arabuluculukta duran süre (7036 m.3/17) mutlaka eklenir. Islaha karşı ayrıca def'i gelir — ıslah zamanlaması buna göre kurulur. |
| **"İşçi kendi istifa etti"** | Fesih iradesini işveren gösteriyorsa ispat ondadır; SGK çıkış kodu ve İŞKUR bildirimi çelişkiyi açığa çıkarır. |
| **"İbraname imzaladı"** | İbranamenin tarihi, kapsamı ve karşılığında ödenen tutar incelenir. `[SONRAKİ ARAŞTIRMA BLOĞU — TBK m.420 ibra şartları + güncel içtihat]` |
| **"Bordrolar imzalı, fazla mesai ödendi"** | **En güçlü savunma.** Doğrulanmış kural (Yargıtay 9. HD E.2015/9909 K.2017/2337): *«İşçinin imzasını taşıyan bordro sahteliği ispat edilinceye kadar kesin delil niteliğindedir.»* ve *«İmzalı ücret bordrolarında fazla çalışma ücreti ödendiği anlaşılıyorsa, işçi tarafından gerçekte daha fazla çalışma yaptığının ileri sürülmesi mümkün değildir. Ancak, işçinin fazla çalışma alacağının daha fazla olduğu yönündeki ihtirazi kaydının bulunması halinde, bordroda görünenden daha fazla çalışmanın ispatı her türlü delille yapılabilir.»* → **İlk gün sorulacak soru: bordroya ihtirazi kayıt konuldu mu?** Konulmadıysa ve bordro imzalıysa, o aylar için tanık delili işlemez; strateji imzasız/eksik aylara ve yazılı delile kayar. |
| **"Fazla mesai yapılmadı"** | Aynı kararda doğrulanmış sıra: işyeri kayıtları → giriş-çıkış belgeleri → iç yazışmalar → **bunlar yoksa tanık**; ayrıca işin niteliği ve yoğunluğu araştırılır. |
| **"Alt işveren bizim değil"** | Asıl işveren – alt işveren ilişkisi ve müteselsil sorumluluk kurgusu; davalı sıfatı baştan doğru kurulur. |

---

## 9. Tuzaklar

1. **Bir günlük zamanaşımı.** Doğrulanmış: 9. HD E.2024/7382 K.2024/12788 —
   arabuluculuk ve pandemi durmaları eklendiğinde bile dava bir gün geç açıldığı
   için reddedildi, red onandı. **Arabuluculuk başvuru ve son tutanak tarihleri
   gün gün hesaplanır; hesap dosyaya yazılır.**
2. **İşe iade süresini alacak arabuluculuğuyla harcamak.** İşe iade için süre
   fesihten **1 ay**; alacak dosyasını hazırlarken bu süre sessizce geçer.
3. **Fotokopi son tutanakla dava açmak.** m.3/2 gereği asıl veya arabulucu
   onaylı örnek gerekir; eksiklik 1 haftalık kesin süreye, giderilmezse usulden
   redde yol açar.
4. **Arabuluculuk ilk toplantısına katılmamak.** 7.11.2024 değişikliğinden sonra
   dahi yaptırım devam ediyor: karşı tarafın yargılama giderlerinin yarısı +
   AAÜT vekâlet ücretinin yarısı (m.3/12).
5. **Kıdemde yasal faiz istemek.** 1475 m.14 mevduata uygulanan en yüksek faizi
   öngörür; dilekçede açıkça talep edilmezse kaybedilir.
6. **İhtirazi kayıt sorusunu sormadan tanık stratejisi kurmak** (§8).
7. **Yetki sözleşmesine teslim olmak.** 7036 m.6/5 uyarınca geçersizdir.
8. **Yeni mevzuat değişikliklerini atlamak.** 4857 m.46 (hafta tatili) 7553 s.K.
   ile 14.07.2025'te, Ek m.2 (mazeret izinleri) 7578 s.K. ile 01.05.2026'da
   değiştirilmiştir. **Bu iki maddenin güncel metni bu araştırmada çekilmedi
   `[METİN DOĞRULANMADI]`** — hafta tatili veya mazeret izni hesabı yapılacak
   dosyada önce güncel metin çekilir.

---

## 10. Yapılmayacaklar

`[AVUKAT DOLDURACAK]` — Aykut'un bu dava türünde bilinçli olarak kullanmadığı
argümanlar ve yollar (örn. hangi kalemleri prensip olarak talep etmiyor,
hangi tanık tipini kullanmıyor, hangi tutar bandını aşmıyor).

---

## 11. Müvekkil iletişimi

`[AVUKAT DOLDURACAK]` — Bu dava türünde süre/sonuç beklentisi nasıl anlatılıyor,
bilirkişi indirimi ve karşı vekâlet ücreti riski nasıl açıklanıyor, ne vaat
edilmiyor.

---

## 12. Kaynak Doğrulama Tablosu

| İddia | Kaynak | Kimlik | Tam alıntı / esas | Doğrulama |
|---|---|---|---|---|
| Arabuluculuk dava şartı; itirazın iptali/menfi tespit/istirdat da kapsamda | 7036 m.3/1 | mevzuat_id 104627, madde_id 1645927 | «...arabulucuya başvurulmuş olması dava şartıdır.» + 7445/41 ek cümlesi | ✓ mevzuat_getir |
| Son tutanak aslı/onaylı örneği zorunlu, aksi hâlde usulden ret | 7036 m.3/2 | aynı | «...davanın usulden reddine karar verilir.» | ✓ |
| İlk toplantıya katılmama yaptırımı (giderlerin yarısı + AAÜT'nin yarısı) | 7036 m.3/12 (7531/28, 7.11.2024) | aynı | «...karşı tarafın ödemekle yükümlü olduğu yargılama giderlerinin yarısından sorumlu tutulur.» | ✓ |
| Zamanaşımı durur / hak düşürücü süre işlemez | 7036 m.3/17 | aynı | «Arabuluculuk bürosuna başvurulmasından son tutanağın düzenlendiği tarihe kadar geçen sürede zamanaşımı durur ve hak düşürücü süre işlemez.» | ✓ |
| 7036 m.3/15 iptal | AYM 3/6/2025 E.2024/157 K.2025/121 | — | Mevzuat metnindeki iptal şerhi | ✓ şerh görüldü; **AYM kararı okunmadı** |
| Görev: iş mahkemesi | 7036 m.5/1-a | madde_id 1645933 | «İş mahkemeleri; ... her türlü hukuk uyuşmazlıklarına ... bakar.» | ✓ |
| Yetki + yetki sözleşmesi geçersiz | 7036 m.6 | madde_id 1645937 | «Bu madde hükümlerine aykırı yetki sözleşmeleri geçersizdir.» | ✓ |
| İş güvencesi eşiği 30 işçi + 6 ay kıdem | 4857 m.18 | mevzuat_id 103054, madde_id 1656918 | «Otuz veya daha fazla işçi çalıştıran işyerlerinde en az altı aylık kıdemi olan işçinin...» | ✓ |
| İşe iade: 1 ay arabulucu / 2 hafta dava; ispat yükü işverende | 4857 m.20 | madde_id 1656924 | «...bir ay içinde işe iade talebiyle ... arabulucuya başvurmak zorundadır.» / «Feshin geçerli bir sebebe dayandığını ispat yükümlülüğü işverene aittir.» | ✓ |
| İhbar önelleri 2/4/6/8 hafta; kötüniyet tazminatı 3 kat | 4857 m.17 | madde_id 1656915 | «iki hafta / dört hafta / altı hafta / sekiz hafta sonra feshedilmiş sayılır» · «bildirim süresinin üç katı tutarında tazminat» | ✓ |
| Ücret alacaklarında zamanaşımı 5 yıl | 4857 m.32 | madde_id 1656962 | «Ücret alacaklarında zamanaşımı süresi beş yıldır.» | ✓ mevzuat_icinde_ara snippet |
| Yıllık izin ücreti zamanaşımı fesihten başlar | 4857 m.59 | madde_id 1657031 | «Bu ücrete ilişkin zamanaşımı iş sözleşmesinin sona erdiği tarihten itibaren başlar.» | ✓ snippet |
| Kıdem/ihbar/izin zamanaşımı 5 yıl + geçiş kuralı | 4857 Ek m.3 ve Geçici m.8 | Yargıtay 9. HD E.2024/7382 K.2024/12788 · documentId **1093760300** | Karar metninde madde metinleri birebir aktarılmış (§4'te alıntılandı) | ✓ ictihat_getir · **madde MCP ağacında doğrudan çekilemedi, karar metninden doğrulandı** |
| Bir gün gecikme zamanaşımı def'ini işletir | aynı karar | documentId 1093760300 | «...davanın yine de zamanaşımı süresinin dolmasından bir gün sonra açıldığı gerekçesiyle...» | ✓ |
| Kıdem: 30 gün/yıl, son ücret, giydirilmiş, mevduat faizi | 1475 m.14 | mevzuat_id 104983, madde_id 1651995 | §7'de alıntılandı | ✓ |
| İmzalı bordro kesin delil; ihtirazi kayıt varsa her tür delil | Yargıtay 9. HD E.2015/9909 K.2017/2337 · documentId **318276000** | 21.02.2017 | §8'de alıntılandı | ✓ ictihat_getir |
| Fazla çalışma ispat sırası (kayıt → tanık) | aynı karar | 318276000 | «...fazla çalışmanın yazılı belgelerle kanıtlanamaması durumunda tarafların, tanık beyanları ile sonuca gidilmesi gerekir.» | ✓ |
| Hak düşürücü sürenin işleyişi (6 iş günü / 1 yıl) | Yargıtay 9. HD E.2008/16869 K.2010/3345 · documentId **621990600** | 15.02.2010 | `iscilik-isci-hakli-fesih.md` §4'te alıntılandı | ✓ |

**Aleyhe içtihat: ARANDI.** Bu playbook'un savunma bölümü (§8) doğrudan
işçi aleyhine kuralları (imzalı bordronun kesin delil olması, zamanaşımının
bir günle işlemesi) kaynağıyla göstermektedir.

**Doğrulanmayanlar (kullanılmadan önce çekilecek):** HMK belirsiz alacak/kısmi
dava hükümleri · TBK m.420 ibra · 4857 m.25 metni · 4857 m.46 (7553 değişikliği)
· 4857 Ek m.2 (7578 değişikliği) · harç ve tarife tutarları · kıdem tavanı.

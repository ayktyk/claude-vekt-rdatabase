<!-- DOKTRIN-PREAMBLE v1 -->
# İşçilik Alacakları Davası — Süreç Haritası (tensipten istinaf sonucuna)

> **0-HALÜSİNASYON + ANTI-SYCOPHANCY (zorunlu — tam metin: `prompts/_doktrin-preamble.md`):**
> - UYDURMA YARGITAY/HGK/İBK kararı atfı YASAK — her künye Bedesten documentId ile doğrulanır; doğrulanmayan "DOĞRULANMAMIŞ" damgalanır.
> - Karar metni ALINTISI UYDURULAMAZ — tırnak içi alıntı birebir kaynaktan.
> - BAĞLAM KORUNMALI — bir fıkranın cevabı başka fıkraya genellenemez.
> - Avukatı memnun etmek için LEHE YORUM YASAK; ALEYHE İÇTİHAT açıkça gösterilir, gizlenmez.
> - "KAYNAK YOK" demek dürüstlüktür — sayı doldurmak için uydurma atıf HARD FAIL.
> - Kritik kuralda ÇİFT KAYNAK şart.
> - ÇIKARIM GEÇERLİLİĞİ: Kaynak gerçek olsa dahi ondan çıkarılan sonuç geçersizse HARD FAIL — bağlam kayması, meşru olmayan genelleme, caiz olmayan kıyas, bilinçli susmayı boşluk sayma reddedilir.
> - Çıktının sonunda KAYNAK DOĞRULAMA tablosu (| İddia | Kaynak | documentId | Tam Alıntı | Doğrulama |) + "Aleyhe içtihat: VAR/YOK/ARANMADI" beyanı ZORUNLU.

TASLAK — avukat son kontrolü yapar.

**AVUKATIN KARAR NOKTALARI**
1. **KARAR VERİLDİ (avukat, 22.10.2026):** 31.07.2026'dan önce açılmış **kısmi** davalarda artırım **ıslahla** (HMK 176) yapılır; 31.07.2026 ve sonrası açılan davalarda **HMK 109/4 bedel artırımı** yapılır. İlk uygulama: 2025-005 ve 2026-011 (23.10.2026). Not: 31.07.2026'dan önce açılmış ve dilekçesinde açıkça **belirsiz alacak** yazan davalar bu kuralın dışındadır; orada mülga 107/2 talep artırımı sürer (7589 geçici m.1/10). Islah tek haktır: rapor bir kalemi hesaplamadıysa ve o kaleme itiraz edilecekse, ıslahın zamanlaması dosya bazında ayrıca düşünülür (ek rapordan sonra çıkan fark için ikinci artırım ancak 109/4 ile denenebilir).
2. 31.07.2026'dan önce **belirsiz alacak** olarak açılmış dosyalarda eski m.107 korunur (7589 geçici m.1/10); "talep artırım" dilekçesi mülga 107/2 rejimiyle sürer. Dilekçe başlığının "ıslah" yazması bu dosyalarda ıslah hakkını tüketir mi tartışması için §6.
3. Yeni açılacak her davada dava türü **kısmi dava + 109/4** olarak kurulur; belirsiz alacak seçeneği kalktı. Faiz başlangıcı (artırılan kısımda dava mı, artırım mı) için 109/4 metni sessizdir; içtihat yok. Dilekçede faiz talebi açıkça yazılır.
4. Bilirkişi raporuna itiraz süresi 2 hafta (HMK 281/1) kesin süredir; itiraz etmeme karşı taraf lehine "usuli kazanılmış hak" yaratmaz (9. HD 2026) ama rapora itiraz hakkını düşürür. Büro kuralı: rapor tebliğinden 10. güne kadar beyan + artırım dilekçesi dosyaya girer.
5. Tehir-i icra: istinaf eden borçlu yalnız İİK 36 teminatıyla durdurabilir; alacaklı tarafta biz isek teminatın nakde çevrilmesi için BAM kararını bekleriz.

Son güncelleme: 2026-10-20 · Doğrulama: Yargı PRO MCP (mevzuat_getir, ictihat_getir) · Kapsam: iş mahkemesinde görülen işçi alacağı davası (davacı işçi vekiliyiz). Dava öncesi (arabuluculuk, zamanaşımı, görev/yetki, harç) için `playbook/iscilik-isveren-feshi.md` ve `playbook/iscilik-isci-hakli-fesih.md` esastır; bu dosya **dava açıldıktan sonrasını** kodlar.

---

## 0. Aşama kodları (00-Dava-Ozeti.md ve portföy tablosunda kullanılan sabit kodlar)

| Kod | Aşama | Bitiş işareti |
|---|---|---|
| A0 | Dava açıldı — tensip bekleniyor | Tensip zaptı UYAP'a düştü |
| A1 | Tensip geldi — cevap + delil aşaması | Cevap dilekçesi geldi veya cevap süresi doldu (tebliğden 2 hafta + en çok 2 hafta ek, HMK 317/2); delil-tanık listesi sunuldu |
| A2 | Ön inceleme duruşması bekleniyor | Ön inceleme duruşması yapıldı, tutanak alındı |
| A3 | Tahkikat — tanık celsesi bekleniyor | Tanıklar dinlendi |
| A4 | Tanık beyanlarına karşı beyan + bilirkişiye sevk | Dosya bilirkişiye gönderildi |
| A5 | Bilirkişi raporu bekleniyor | Rapor tebliğ edildi |
| A6 | Rapora beyan/itiraz + ıslah / 109-4 talep artırımı | Beyan ve artırım dilekçesi sunuldu, harç yatırıldı |
| A7 | Karar celsesi bekleniyor | Hüküm tefhim edildi |
| A8 | Gerekçeli karar bekleniyor | Gerekçeli karar yazıldı |
| A9 | Tebliğ + istinaf süresi | Her iki tarafa tebliğ; 2 hafta geçti veya istinaf edildi |
| A10 | İlamlı icra takibi | İcra emri tebliğ edildi |
| A11 | İstinafta (karşı taraf veya biz) + tehir-i icra | BAM kararı tebliğ edildi |
| A12 | Temyiz (parasal sınır üstü ise) | Yargıtay kararı |
| A13 | Kesinleşme — tahsilat — kapanış | Tahsilat tamamlandı, dosya kapandı |

Bir dosyanın "hangi aşamada" olduğu bu kodla yazılır; "sıradaki işlem" o kodun satırındaki iş listesinden çıkar (§1–§9).

---

## 1. A0–A1 Tensip ve dilekçeler aşaması

**Usul:** İş mahkemesinde **basit yargılama usulü** uygulanır (7036 m.7/1). Basit usulde taraflar **tüm delillerini dilekçeleriyle birlikte** bildirir ve ellerindeki belgeleri ekler, başka yerden getirtilecekler için gerekli bilgiyi dilekçede verir (HMK 318). Cevap süresi tebliğden iki hafta, bir defalık en çok iki hafta ek süre (HMK 317/2); **cevaba cevap ve ikinci cevap dilekçesi verilemez** (HMK 317/3).

**Bizim işimiz (tensip geldiğinde):**
- Tensip ara kararlarını satır satır okuyup her birine süre bağla (celp müzekkereleri, delil avansı, tanık listesi süresi).
- **Tanık listesi** (HMK 240/2): tanıkların adı, soyadı, tebliğe elverişli adresi ve **hangi vakıa için** dinletileceği yazılır; listede olmayan tanık dinlenemez, **ikinci liste verilemez**. Tensipte süre verildiyse o süre kesin sayılır (büro kuralı: tensipte verilen süreyi kesin süre gibi işle).
- Banka kayıtları, SGK dökümü, işyeri özlük dosyası, bordro, PDKS ve izin defteri celbi — dava dilekçesinde belirtilmişse tensiple müzekkere çıkar; çıkmadıysa ara karar talebi yazılır.
- Karşı tarafın cevabı gelince üç şey aranır: **zamanaşımı def'i**, **ibraname/ikale**, **imzalı bordro**. Cevap süresinde ileri sürülmeyen zamanaşımı def'i sonradan cevabın ıslahıyla ya da davacının açık muvafakatiyle (HMK 141/2) getirilebilir (9. HD 2024/11176 E.; 9. HD 2016/30951 E.). Büro kuralı: süre geçtikten sonra gelen def'e aynı celsede/dilekçede **açıkça karşı çıkılır**, muvafakat verilmez; suskun kalmak HMK döneminde muvafakat sayılmaz ama riske atılmaz.

**Dikkat (HMK 139 ihtarı):** Ön inceleme davetiyesinde, dilekçede gösterilen ama sunulmayan belgelerin **iki haftalık kesin sürede** sunulması, yoksa o delilden vazgeçilmiş sayılacağı ihtar edilir (HMK 139/1-ç; 140/5). Basit usulde hüküm bulunmayan hâllerde yazılı usul hükümleri uygulanır (HMK 322/1); bu nedenle 139 ihtarı iş mahkemesinde de geçerlidir. Büro gözlemi (kaynaksız — dosya bazında tensip okunur): iş mahkemeleri bu ihtarı çoğunlukla tensip zaptına yazıyor; süre tensibin tebliğinden işletilir.

## 2. A2 Ön inceleme duruşması

Basit usulde mahkeme ilk duruşmada dava şartları, ilk itirazlar, hak düşürücü süre ve zamanaşımı hakkında tarafları dinler; anlaşılan/anlaşılamayan hususları tek tek tespit eder; sulh ve arabuluculuğa teşvik eder; tutanak imzalanır ve **tahkikat bu tutanak esas alınarak yürütülür** (HMK 320/2; yazılı usulde 140/1-3). Ön inceleme tamamlanmadan tahkikata geçilemez (HMK 137/2).

**Bizim işimiz:**
- Uyuşmazlık konuları tutanağa **bizim kurgumuzla** geçsin: fesih şekli, ücret miktarı, çalışma düzeni (haftalık saat, hafta tatili, UBGT), yıllık izin, ödenmemiş kalemler.
- Celse sonunda talep: "Tanıklarımızın bir sonraki celsede dinlenmesine, celp edilmeyen kayıtların celbine karar verilmesi."
- Zaptı aynı gün `zabit geldi:` hattından kontrol et: beyan tutanağa doğru geçti mi, süre başlatan ara karar var mı.
- **Duruşmalar arası süre:** Basit usulde bir ay (HMK 320/3); genel kural üç ay (HMK 147/3, 7589 ile eklendi). Bilirkişi/istinabe zorunluluğunda hâkim gerekçeyle uzatabilir. Daha uzun süre verilirse gerekçe tutanakta aranır; yoksa itiraz etmek takdirdir.

## 3. A3 Tahkikat — tanık celsesi

- Tanık dinleme usulü HMK 240–265 (bu çalışmada yalnız 240 çekildi). Tanığa soru hazırlığı: `hukuk_skill` 16-3 yöntem bölümü.
- Fazla çalışma, hafta tatili, UBGT fiilen tanıkla ispat edilir; imzalı bordro ve ihtirazi kayıt sorusu her tanığa yöneltilir.
- Celse sonunda talep: "Tanık beyanlarına karşı beyanda bulunmak üzere iki haftalık süre verilmesine; dosyanın hesap bilirkişisine tevdiine."

## 4. A4 Tanık beyanlarına karşı beyan

- Süre: mahkemenin verdiği süre (çoğunlukla iki hafta; zaptan okunur, varsayılmaz).
- İçerik: tanık anlatımlarının çelişki matrisi, karşı tanıkların menfaat birliği (9. HD kararlarında "davacıyla menfaat birliği içindeki tanık" itirazı standart savunmadır — 2023/14969 E. kararında işveren tarafı bunu ileri sürmüş), bilirkişiye verilecek hesap parametreleri (ücret, çalışma düzeni, dönem).
- Bu dilekçe aynı zamanda bilirkişinin **hesap talimatı** gibi kurulur: hangi varsayımla hesaplansın, hangi dönemler zamanaşımı dışı, hangi kalem ne tür faizle.

## 5. A5 Bilirkişi raporu

- Rapor tebliğinden itibaren **iki hafta** içinde eksik/belirsiz hususların tamamlatılması veya yeni bilirkişi istenir; süre içinde başvurulursa bir defalık, iki haftayı geçmeyen ek süre verilebilir (HMK 281/1).
- **Aleyhe/dikkat içtihadı:** İtiraz etmemenin sonucu yalnız "itiraz hakkını yitirmek"tir; karşı taraf lehine usuli kazanılmış hak doğurmaz, hâkim raporu takdiri delil olarak serbestçe değerlendirir ve gerekirse yeni rapor alabilir (9. HD 2026/1804 E. 2026/4315 K.). Bu, karşı tarafın itiraz etmemesine güvenmememiz gerektiği anlamına da gelir.
- Rapora karşı beyan hakkı verilmeden karar verilmesi bozma sebebidir (9. HD 2021/11984 E. — ek rapor tebliğinden sonra iki hafta beklenmeden hüküm kurulması hukuki dinlenilme hakkını kısıtlar).

## 6. A6 Rapora beyan + artırım: ıslah mı, 109/4 talep artırımı mı?

### 6.1 Mevzuat durumu (doğrulandı 2026-10-20)
- **HMK 107 MÜLGA** (7589/19; RG 31.07.2026). Geçiş: *«(10) Bu maddeyi ihdas eden Kanunla 6100 sayılı Kanunun yürürlükten kaldırılan 107 nci maddesi, yürürlükten kaldırılma tarihinden önce açılan davalar bakımından uygulanmaya devam olunur.»* (7589 geçici m.1/10).
- **HMK 109/4 (yeni):** *«Alacağın sadece bir kısmının dava edildiği durumlarda talep konusu, aynı davada bir defaya mahsus olmak üzere iddianın genişletilmesi yasağına tabi olmaksızın tahkikatın sona ermesine kadar artırılabilir. Bu durumda zamanaşımı, artırılan kısım bakımından da dava tarihinden itibaren kesilmiş sayılır.»* 109/4 için geçiş hükmü **yoktur**; HMK 448: *«Bu Kanun hükümleri, tamamlanmış işlemleri etkilememek kaydıyla derhâl uygulanır.»*
- **Islah:** *«Aynı davada, taraflar ancak bir kez ıslah yoluna başvurabilir.»* (176/2); *«Islah, tahkikatın sona ermesine kadar yapılabilir.»* (177/1); kısmen ıslahta işlem için bir haftalık süre, yapılmazsa ıslah hiç yapılmamış sayılır (181).

### 6.2 Karar ağacı (dosya bazında)

| Dosyanın durumu | Artırım yolu | Zamanaşımı | Faiz (artırılan kısım) | Harç |
|---|---|---|---|---|
| **31.07.2026'dan ÖNCE açılmış, dilekçede "belirsiz alacak" / m.107 yazılı** | Mülga 107/2 talep artırımı (geçici m.1/10 ile korunur) | Dava tarihinden kesilmiş sayılır; artırıma karşı zamanaşımı def'i dinlenmez (9. HD 2026/1344 E.: belirsiz alacak davasında ıslaha karşı def'e değer verilmesi bozma sebebi) | Tamamına **dava tarihinden** (9. HD 2021/13385 E. 2022/1799 K.) | Tamamlama harcı (492 m.30/32) |
| **31.07.2026'dan ÖNCE açılmış, kısmi dava (107 yazılmamış / "fazlaya ilişkin haklar saklı")** | (a) Islah 176 — yerleşik yol; (b) **109/4 talep artırımı** — HMK 448 derhâl uygulama gerekçesiyle; İstanbul 17. ATM 09.09.2026 derdest eski kısmi davada uyguladı (kesinleşmedi) | (a) Islahla artırılan kısma davalı 2 hafta içinde zamanaşımı def'i ileri sürebilir (9. HD 2024/11176 E.); (b) 109/4 metnine göre dava tarihinden kesilmiş sayılır — **henüz Yargıtay kararı yok**; karşı argüman: HMK 448 "tamamlanmış işlem" sınırı ve zamanaşımının maddi hukuk def'i niteliği (yürürlükten önce dolmuş süre dirilmez — 19-3 rehberi de aynı sınırı koyar) | (a) **ıslah tarihinden** (9. HD 2023/14969 E. 2024/378 K.) — **istisna, kıdem tazminatı:** artırılan kısım dahil tamamına **fesih tarihinden** mevduata uygulanan en yüksek faiz (1475 m.14/11; 9. HD 2015/27726 E. 2019/14459 K.; 9. HD 2026/811 E. 2026/1714 K.); **istisna, dava öncesi temerrüt:** işveren davadan önce ihtarla temerrüde düşürülmüşse artırılan kısım dahil tamamına temerrüt tarihinden (9. HD 2023/18298 E. 2023/18519 K.); (b) 109/4 sessiz — içtihat yok [AÇIK SORU] | (a) Artırılan değer üzerinden nispi harç tamamlanır; yatırılmazsa kesin süre verilir, yine yatmazsa ıslah yapılmamış sayılır (9. HD 2016/34745 E. 2020/17851 K.). (b) Aynı sonucun 109/4 artırımına uygulanması ıslah içtihadının **kıyasen** taşınmasıdır — 109/4 için içtihat yok [AÇIK SORU]; Harçlar K. m.30/32 değer artışında her hâlde harç tamamlatır |
| **31.07.2026 ve SONRASI açılan dava** | Kısmi dava + 109/4 (belirsiz alacak yolu kapalı) | Dava tarihinden kesilmiş sayılır (109/4 c.2) | [AÇIK SORU] — dilekçede "artırılan kısım dahil tamamına dava tarihinden faiz" açıkça talep edilir; mahkeme ıslah içtihadını kıyasen uygulayabilir (aleyhe risk) | Tamamlama harcı |

**Zorunlu kontroller (her artırım öncesi):**
1. Dava dilekçesini aç; dava türünü dilekçenin **kendi ifadesinden** oku (başlık/konu/sonuç). "Belirsiz alacak" veya "m.107" yazmıyorsa dava kısmi davadır. Asıl kaynak HGK 07.07.2021 E.2021/485 K.2021/971 (işçilik alacağı davası): *«Belirsiz alacak davası niteliği gereği istisnai bir dava türü olmakla davasını belirsiz alacak davası olarak açan kişi bunu açıkça dilekçesinde belirtmelidir.»*; "fazlaya ilişkin haklar saklı" ibaresi kısmi dava için yeterlidir; duruşmadaki "davamız belirsiz alacak davasıdır" beyanı türü değiştirmez. Ankara BAM 26. HD 2022/1527 E. bu HGK kararını aktarır.
2. Dava türü **ıslahla değiştirilemez**: kural BAM gerekçesinde, Yargıtay 9. HD 2025/9751 E. 2026/1032 K. ile gerekçesiz onandı (HMK 370/1); HGK 2021/485 de duruşma beyanıyla tür değişikliğini reddeder. Kısmi davayı ıslah dilekçesiyle belirsiz alacağa çevirme girişimi sonuç vermez.
3. Daha önce ıslah yapılmış mı (176/2 tek hak) — ad düzeltmesi/yanlış taraf gösterimi (HMK 124, 183 — madde metinleri bu turda çekilmedi [DOĞRULANMAMIŞ]) ıslah sayılmaz (Yargı PRO 19-3 rehberi).
4. Kalem kalem artırım tablosu: dava dilekçesindeki tutar → rapor tutarı → artırılan fark → faiz türü ve başlangıcı (kıdem: fesih tarihinden mevduata uygulanan en yüksek faiz, 1475 m.14/11 — 9. HD 2020/4492 E. 2021/1536 K.; ücret, fazla çalışma, hafta tatili, UBGT: temerrüt yoksa dava/ıslah tarihinden, kısmi davada dava–ıslah ayrımı zorunlu — 9. HD 2023/2507 E. 2023/7624 K.).
5. Harç hesabı `harc-aaut` skill'i + güncel tarife; makbuz dilekçeye eklenir.
6. Dilekçenin adı: eski 107 dosyasında **"talep artırım dilekçesi"**; kısmi davada seçilen yola göre **"ıslah dilekçesi"** veya **"HMK 109/4 uyarınca talep artırım dilekçesi"**. Yolu açıkça yazmak, karşı tarafın "ıslah hakkı tüketildi" itirazını ve mahkemenin yanlış nitelendirmesini önler.

**Büro notu:** 109/4 derdest eski kısmi davalarda zamanaşımı def'ini **düşürebilir — tartışmalı**. Lehe okuma: usul kuralı derhâl uygulanır (HMK 448), metin artırılan kısım için kesilmeyi dava tarihine bağlar. Aleyhe okuma: zamanaşımı maddi hukuk def'idir, yürürlükten önce dolmuş süre "tamamlanmış işlem" sayılıp dirilmez; 109/4 için Yargıtay görüşü yok. Tek emsal İstanbul 17. ATM 09.09.2026 (kesinleşmedi, ticaret davası) 109/4'ü yalnız dilekçeleri yeniden nitelendirmek için kullandı; zamanaşımı def'ini 109/4 ile değil "10 yıllık genel zamanaşımı" ile reddetti ve artırılan kısma yine ıslah tarihinden faiz yürüttü. Mahkeme 109/4'ü kabul etmezse yedek olarak aynı dilekçede "aksi kanaatte ıslah olarak kabulü" terditli yazılır mı — avukat kararı (karar noktası 1).

### 6.3 Artırmadan önce ret riski: karşı vekâlet ücreti ve somutlaştırma (doğrulandı 2026-10-23)

- **İndirim kaynaklı ret:** Fazla çalışmada tanık beyanına dayalı hesaptan yapılan takdiri indirim nedeniyle reddedilen kısım için davalı lehine vekâlet ücreti verilmez (9. HD 2022/343 E. 2022/918 K.; 9. HD 2022/3107 E. 2022/4180 K.).
- **İndirim dışı ret:** Reddedilen kısım için davalı lehine ücret AAÜT üçüncü kısmına göre hesaplanır, ikinci kısımdaki maktu ücretin altında kalamaz (AAÜT m.13/1), reddedilen miktarı geçemez (m.13/2). Maktu taban reddedilen miktardan büyükse ücret reddedilen miktarın tamamına eşit olur (9. HD 2022/343 E.: 3.257,48 TL ret → 3.257,48 TL ücret). Ücret hüküm tarihindeki tarifeye göre takdir edilir (m.21). Sonuç: ispatı zayıf bir kalemi ıslahla büyütmek, kalem reddedilirse yaklaşık artırılan tutar kadar karşı vekâlet ücreti riski taşır.
- **Somutlaştırma:** Dava dilekçesi fazla çalışma/UBGT istediği hâlde gün-saat vermemişse bu "iddia yükü" değil "somutlaştırma yükü" eksikliğidir. Mahkeme önce davacıya HMK m.31 çerçevesinde "yeni bir vakıa meydana getirmeden, sadece mevcut vakıa kapsamında" açıklattırır; açıklama yapılmazsa talep ispatsız kalır (9. HD 2020/5118 E. 2021/4007 K.; aynı örüntüde 9. HD 2018/456 E. 2020/20143 K.: «Somut açıklama içermeyen talepler hakkında tanık anlatımı ile hüküm kurulması hatalı»). Raporda "somutlaştırma yapılmadığı" yazıyorsa, artırımdan önce çalışma düzeni müvekkil teyidiyle somutlaştırılır; ıslah hakkı kullanılmamışsa somutlaştırma ıslah dilekçesinin içine de konabilir.

## 7. A7–A8 Karar ve gerekçeli karar

- Tahkikat bitince aynı duruşmada sözlü yargılamaya geçilir; taraflardan birinin talebiyle iki haftadan az olmamak üzere ertelenir (HMK 186/1). Basit usulde mahkeme son beyanları alır ve kararı tefhim eder, ayrıca süre vermez (HMK 321/1).
- Zorunlu hâlde yalnız hüküm özeti tefhim edilir; **gerekçeli karar en geç bir ay içinde** yazılıp tebliğe çıkarılır (HMK 321/2; 294/4).
- İş mahkemesi kararında kanun yolu süresi **ilamın tebliğinden** işler (7036 m.7/4); tefhimden değil. Bu yüzden gerekçeli kararın her iki tarafa tebliği istenir; tebliğ masrafı yatırılır.

## 8. A9–A10 Tebliğ, istinaf süresi, ilamlı icra

- İstinaf süresi **iki hafta**, ilamın usulen tebliğiyle başlar (HMK 345/1; 7036 m.7/4).
- Kesinlik sınırı: HMK 341/2 (üç bin TL — madde metninde yazılı tutar; yeniden değerleme ile güncellenen tutar her yıl UYAP/karar metninden teyit edilir). Kısmi davada sınır **alacağın tamamına** göre belirlenir (341/3).
- **İstinaf icrayı durdurmaz** (HMK 350/1); İİK 36 saklıdır. Kişiler/aile/taşınmaz ayni hak kararları kesinleşmeden icra edilemez (350/2) — işçilik alacağı bunlardan değildir, karar kesinleşmeden ilamlı takibe konur.
- İlamlı takip: icra emrinde **yedi gün** içinde ödeme, aksi hâlde tehir-i icra kararı getirilmedikçe cebri icra (İİK 32).
- Büro sırası: gerekçeli karar → tebliğ talebi → ilamın UYAP'tan alınması → ilamlı takip (İİK 32) → borçluya icra emri.

## 9. A11 İstinaf ve tehir-i icra

- **Karşı taraf istinaf ettiyse:** istinafa cevap: istinaf dilekçesinin tebliğinden **iki hafta** (HMK 347/2). Takip devam eder; borçlu İİK 36 ile durdurmak isterse teminat yatırır/gösterir ve icra müdüründen süre (mehil) alır; BAM başvuruyu kesin esastan reddederse teminat alacaklıya ödenir (İİK 36/6).
- **Biz istinaf ediyorsak (kaybedilen kalemler):** iki hafta içinde istinaf; karşı taraf lehine hükmedilen kalem varsa (vekâlet ücreti, yargılama gideri) ve karşı taraf takip açarsa İİK 36 teminatı değerlendirilir.
- Temyiz: BAM kararı tebliğinden iki hafta (HMK 361/1); parasal sınır HMK 362/1-a (madde metninde kırk bin TL; güncel tutar her yıl teyit). Kısmi davada sınır alacağın tamamına göre (362/2). 7589 ile eklenen 362/3: BAM'ın kaldırıp yeniden esas hakkında verdiği kararda temyiz edilebilirlik, kabul/ret edilen kısmın 341/2 sınırını aşmasına bağlı. İşe iade davası kararları temyiz edilemez (7036 m.8/1-a).
- İş davalarında BAM ve Yargıtay ivedilikle karar verir (7036 m.7/5) — bekleme süresi için taahhüt yok.

## 10. A13 Kesinleşme ve kapanış

- Kesinleşme şerhi (gerekirse), bakiye tahsilat, teminatın paraya çevrilmesi, dosya dersleri (`hukuk_skill` 18-4), müvekkile kapanış notu (K2).

---

## 11. Sıradaki işlem tablosu (hızlı bakış)

| Aşama | Sıradaki işlem | Süre kaynağı |
|---|---|---|
| A0 | Tensip bekle; UYAP günlük kontrol | — |
| A1 | Tensip ara kararlarına cevap; tanık listesi + delil + celp; karşı cevapta zamanaşımı/ibraname/bordro tara | Tensipteki süre (kesin say) |
| A2 | Celse kartı (16-1); uyuşmazlık tespitini yönlendir; tanık dinleme talebi | Duruşma günü |
| A3 | Tanık soruları (16-3); celse sonunda süre + bilirkişi talebi | Duruşma günü |
| A4 | Tanık beyanına karşı beyan = hesap talimatı | Zaptaki süre |
| A5 | Rapor tebliğini bekle; tebliğ günü Süre Kalkanı'na 281/1 (2 hafta) işle | HMK 281/1 |
| A6 | Beyan/itiraz + artırım dilekçesi (§6 karar ağacı) + harç | 281/1 iki hafta; artırım tahkikat sonuna kadar |
| A7 | Karar celsesi; son beyan | Duruşma günü |
| A8 | Gerekçeli kararı izle (1 ay) | HMK 321/2 |
| A9 | Tebliğ talebi; istinaf kararı (biz) | HMK 345: 2 hafta tebliğden |
| A10 | İlamlı takip aç (İİK 32) | — |
| A11 | İstinafa cevap / tehir-i icra takibi | HMK 347/2: 2 hafta; İİK 36 |
| A12 | Temyiz değerlendirmesi (362 sınırı) | HMK 361: 2 hafta |
| A13 | Tahsilat, kapanış, dersler | — |

---

## Kaynak Doğrulama Tablosu

| İddia | Kaynak | documentId / madde | Tam Alıntı | Doğrulama |
|---|---|---|---|---|
| HMK 107 mülga | 6100 s.K. m.107 | mevzuatgov:kanun:5:6100:m107 | «MADDE 107– (Mülga:16/7/2026-7589/19 md.)» | mevzuat_getir 2026-10-20 ✓ |
| Eski 107 davaları korunur | 7589 s.K. geçici m.1/10 | mevzuatgov:kanun:5:7589 | «Bu maddeyi ihdas eden Kanunla 6100 sayılı Kanunun yürürlükten kaldırılan 107 nci maddesi, yürürlükten kaldırılma tarihinden önce açılan davalar bakımından uygulanmaya devam olunur.» | mevzuat_getir ✓ |
| 109/4 talep artırımı | 6100 s.K. m.109/4 | mevzuatgov:kanun:5:6100:m109 | «Alacağın sadece bir kısmının dava edildiği durumlarda talep konusu, aynı davada bir defaya mahsus olmak üzere iddianın genişletilmesi yasağına tabi olmaksızın tahkikatın sona ermesine kadar artırılabilir. Bu durumda zamanaşımı, artırılan kısım bakımından da dava tarihinden itibaren kesilmiş sayılır.» | mevzuat_getir ✓ |
| Derhâl uygulama | HMK 448 | mevzuatgov:kanun:5:6100:m448 | «Bu Kanun hükümleri, tamamlanmış işlemleri etkilememek kaydıyla derhâl uygulanır.» | mevzuat_getir ✓ |
| Tek ıslah, tahkikat sonuna kadar | HMK 176/2, 177/1 | m176, m177 | «Aynı davada, taraflar ancak bir kez ıslah yoluna başvurabilir.» · «Islah, tahkikatın sona ermesine kadar yapılabilir.» | mevzuat_getir ✓ |
| Kısmen ıslahta 1 hafta | HMK 181 | m181 | «Kısmen ıslaha başvuran tarafa, ıslah ettiği usul işlemini yapması için bir haftalık süre verilir. Bu süre içinde ıslah edilen işlem yapılmazsa, ıslah hiç yapılmamış gibi davaya devam edilir.» | mevzuat_getir ✓ |
| Rapora itiraz 2 hafta + ek süre | HMK 281/1 | m281 | «Taraflar, bilirkişi raporunun, kendilerine tebliği tarihinden itibaren iki hafta içinde, raporda eksik gördükleri hususların, bilirkişiye tamamlattırılmasını; belirsizlik gösteren hususlar hakkında ise bilirkişinin açıklama yapmasının sağlanmasını veya yeni bilirkişi atanmasını mahkemeden talep edebilirler.» | mevzuat_getir ✓ |
| Basit usul; kanun yolu süresi tebliğden; ivedilik | 7036 s.K. m.7 | mevzuatgov:kanun:5:7036:m7 | «İş mahkemelerinde basit yargılama usulü uygulanır.» · «Kanun yoluna başvuru süresi, ilamın taraflara tebliğinden itibaren işlemeye başlar.» · «Kanun yoluna başvurulan kararlar, bölge adliye mahkemesi ve Yargıtayca ivedilikle karara bağlanır.» | mevzuat_getir ✓ |
| İşe iade kararı temyiz edilemez | 7036 m.8/1-a | m8 | «4857 sayılı Kanunun 20 nci maddesi uyarınca açılan fesih bildirimine itiraz davalarında verilen kararlar.» | mevzuat_getir ✓ |
| Basit usulde ön inceleme + 2 duruşma, 1 ay | HMK 320/2-3 | m320 | «Mahkeme, tarafların dinlenmesi, delillerin incelenmesi ve tahkikat işlemlerinin yapılmasını yukarıdaki fıkrada belirtilen duruşma hariç, iki duruşmada tamamlar. Duruşmalar arasındaki süre bir aydan daha uzun olamaz.» | mevzuat_getir ✓ |
| Delillerin dilekçeyle bildirimi | HMK 318 | m318 | «Taraflar dilekçeleri ile birlikte, tüm delillerini açıkça ve hangi vakıanın delili olduğunu da belirterek bildirmek; ellerinde bulunan delillerini dilekçelerine eklemek … zorundadır.» | mevzuat_getir ✓ |
| Ön inceleme kapsamı, tahkikata geçiş yasağı | HMK 137/2 | m137 | «Ön inceleme tamamlanmadan ve gerekli kararlar alınmadan tahkikata geçilemez ve tahkikat için duruşma günü verilemez.» | mevzuat_getir ✓ |
| Belge sunma ihtarı, 2 hafta kesin | HMK 139/1-ç; 140/5 | m139, m140 | «Davetiyenin tebliğinden itibaren iki haftalık kesin süre içinde tarafların dilekçelerinde gösterdikleri, ancak henüz sunmadıkları belgeleri mahkemeye sunmaları … bu hususların verilen süre içinde yerine getirilmemesi hâlinde o delile dayanmaktan vazgeçmiş sayılacaklarına karar verileceği.» | mevzuat_getir ✓ |
| Ön inceleme tutanağı tahkikatın esası | HMK 140/3 | m140 | «Tahkikat bu tutanak esas alınmak suretiyle yürütülür.» | mevzuat_getir ✓ |
| Duruşmalar arası en çok 3 ay (yeni) | HMK 147/3 | m147 | «Duruşmalar arasındaki süre üç aydan daha uzun olamaz. İşin niteliği gereği bilirkişi incelemesinin uzaması veya istinabe yoluyla tahkikat işlemlerinin yürütülmesi gibi zorunlu hâllerde, hâkim gerekçesini belirterek daha uzun bir süre belirleyebilir.» | mevzuat_getir ✓ |
| Tanık listesi, ikinci liste yasağı | HMK 240/2 | m240 | «Bu listede gösterilmemiş olan kimseler tanık olarak dinlenemez ve ikinci bir liste verilemez.» | mevzuat_getir ✓ |
| Sözlü yargılama, 2 hafta erteleme | HMK 186/1 | m186 | «Mahkeme, tahkikatın bittiğini tefhim ettikten sonra aynı duruşmada sözlü yargılama aşamasına geçer. Bu durumda taraflardan birinin talebi üzerine duruşma iki haftadan az olmamak üzere ertelenir.» | mevzuat_getir ✓ |
| Basit usulde hüküm; gerekçeli karar 1 ay | HMK 321/1-2 | m321 | «Tahkikatın tamamlanmasından sonra, mahkeme tarafların son beyanlarını alır ve yargılamanın sona erdiğini bildirerek kararını tefhim eder. Taraflara beyanda bulunabilmeleri için ayrıca süre verilmez.» · «Bu durumda gerekçeli kararın en geç bir ay içinde yazılarak tebliğe çıkartılması gerekir.» | mevzuat_getir ✓ |
| Gerekçeli karar 1 ay (genel) | HMK 294/4 | m294 | «Zorunlu nedenlerle sadece hüküm sonucunun tefhim edildiği hâllerde, gerekçeli kararın tefhim tarihinden başlayarak bir ay içinde yazılması gerekir.» | mevzuat_getir ✓ |
| İstinaf 2 hafta tebliğden | HMK 345/1 | m345 | «İstinaf yoluna başvuru süresi iki haftadır. Bu süre, ilamın usulen taraflardan her birine tebliğiyle işlemeye başlar.» | mevzuat_getir ✓ |
| İstinaf icrayı durdurmaz; İİK 36 saklı | HMK 350/1 | m350 | «İstinaf yoluna başvurma, kararın icrasını durdurmaz. İcra ve İflas Kanununun icranın geri bırakılmasıyla ilgili 36 ncı maddesi hükmü saklıdır.» | mevzuat_getir ✓ |
| Kesinlik sınırı kısmi davada tamamına göre | HMK 341/2-3 | m341 | «Alacağın bir kısmının dava edilmiş olması durumunda üç bin Türk Liralık kesinlik sınırı alacağın tamamına göre belirlenir.» | mevzuat_getir ✓ (tutar yeniden değerlemeyle güncellenir — madde metni sabit) |
| Temyiz 2 hafta; 362 sınırı; yeni 362/3 | HMK 361/1, 362 | m361, m362 | «…tebliğ tarihinden itibaren iki hafta içinde temyiz yoluna başvurulabilir.» · «(3) (Ek:16/7/2026-7589/25 md.) Bölge adliye mahkemesinin yaptığı inceleme sonucunda istinaf başvurusunun kısmen veya tamamen kabul edilerek yeniden esas hakkında verilen kararın kabul edilen ya da reddedilen kısmının, miktar veya değeri itibarıyla 341 inci maddenin ikinci fıkrasında düzenlenen parasal sınırın üzerinde olması halinde temyiz edilebilir.» | mevzuat_getir ✓ |
| İcra emri 7 gün | İİK 32 | mevzuatgov:kanun:3:2004:m32 | «…nihayet yedi gün içinde ödenmesi ve bu müddet içinde borç ödenmez veya hükmolunan teminat verilmezse icra mahkemesinden veya istinaf veya temyiz yahut iadei muhakeme yolu ile ait olduğu mahkemeden icranın geri bırakılmasına dair bir karar getirilmedikçe cebri icra yapılacağı…» | mevzuat_getir ✓ |
| Tehir-i icra: teminat + mehil; BAM esastan ret → teminat alacaklıya | İİK 36/1, 36/6 | m36 | «İlâma karşı istinaf veya temyiz yoluna başvuran borçlu, hükmolunan para veya eşyanın resmî bir mercie depo edildiğini ispat eder yahut … icranın geri bırakılması için takibin yapıldığı yer icra mahkemesinden karar alınmak üzere icra müdürü tarafından kendisine uygun bir süre verilir.» · «Bölge adliye mahkemesince başvurunun kesin olarak esastan reddine karar verilmesi veya Yargıtayca hükmün onanması hâlinde alacaklının istemi üzerine başkaca işleme gerek kalmaksızın teminata konu olan para alacaklıya ödenir.» | mevzuat_getir ✓ |
| 7589'un HMK değişiklikleri: 107, 109/4, 147/3, 149/4, 166, 168, 362/3 | HMK içinde "7589" taraması | mevzuat_icinde_ara | 6 madde eşleşti (166, 168, 107, 109, 147, 362) + 7589 m.22 → 149/4 (yayımdan 3 ay sonra yürürlük) | ✓ |
| Kısmi davada ıslahla artırılan kısma ıslah tarihinden faiz | Yargıtay 9. HD 15.01.2024 E.2023/14969 K.2024/378 | 1000270900 — https://mevzuat.adalet.gov.tr/ictihat/1000270900 | «ihbar tazminatı ve ücret alacağına ilişkin dava, 6100 ... Kanun'un 109 uncu maddesinde düzenlenen kısmi alacak davası türünde açılmış ve sonuçlandırılmıştır. Bu nedenle ücret alacağı ve ihbar tazminatı taleplerinin dava ile istenen miktarlarına dava tarihinden, ıslah ile artırılan miktarlara ıslah tarihinden itibaren faiz işletilmesi gerekirken alacakların tamamına dava tarihinden itibaren faiz işletilmesi isabetsizdir.» | ictihat_getir tam metin ✓ |
| Belirsiz alacakta tamamına dava tarihinden faiz; artırıma zamanaşımı işlemez | Yargıtay 9. HD 15.02.2022 E.2021/13385 K.2022/1799 | 733723500 — https://mevzuat.adalet.gov.tr/ictihat/733723500 | «Belirsiz alacak olarak talep edilen alacaklarda dava açıldıktan sonra yargılama esnasında artırılan alacak miktarları bakımından zamanaşımı süreleri işlemeyeceği gibi artırılan miktar bakımından faize hükmedilirken de kısmi davadan farklı olarak tüm alacağa dava tarihinden itibaren faiz işletilebileceği…» | ictihat_getir ✓ (eski 107 dosyaları için) |
| Belirsiz alacak davasında ıslaha karşı zamanaşımı def'ine değer verilmesi bozma | Yargıtay 9. HD 27.04.2026 E.2026/1344 K.2026/3801 | 1223633600 — https://mevzuat.adalet.gov.tr/ictihat/1223633600 | «somut dava, hüküm altına alınan kıdem ve ihbar tazminatları ile eksik ödenen ücret alacağı talepleri yönünden de belirsiz alacak davası olarak açılmış olup, davalının ıslaha karşı ileri sürdüğü zamanaşımı def'ine değer verilerek sonuca gidilmesi hatalı olduğundan hükmün bozulması gerekmiştir.» | ictihat_getir ✓ — aynı kararda Daire, koşulsuz belirsiz alacak davasının esasına girilmesini hatalı bulur (aleyhe yön) |
| Islah dilekçesine karşı 2 hafta içinde zamanaşımı def'i; def'i cevabın ıslahıyla da getirilebilir | Yargıtay 9. HD 25.09.2024 E.2024/11176 K.2024/12491 | 1079656800 — https://mevzuat.adalet.gov.tr/ictihat/1079656800 | «371/2 ve 319. maddeler uyarınca ıslah dilekçesinin davalı tarafa tebliği üzerine iki haftalık süre içinde ıslaha konu kısımlar için zamanaşımı definde bulunulabileceği kabul edilmelidir.» · «Zamanaşımı definin cevap dilekçesinin ıslahı yoluyla ileri sürülmesi de mümkündür» | ictihat_getir ✓ (Daire 2021/10852 E. ilkelerini aktarır) |
| Dava türü ıslahla değiştirilemez | Yargıtay 9. HD 09.02.2026 E.2025/9751 K.2026/1032 (onama) | 1206795500 — https://mevzuat.adalet.gov.tr/ictihat/1206795500 | BAM gerekçesi: «dava türünün ıslah dilekçesi ile değiştirilmesi mümkün olmadığından davanın kısmi dava olarak görüldüğü, ıslah edilen miktarlara karşı davalının ileri sürdüğü zamanaşımı def'i nazara alınarak … hükmedildiğinden» — Yargıtay: «usul ve kanuna uygun olup … ONANMASINA» | ictihat_getir ✓ (alıntı BAM gerekçesinden, Yargıtay onadı — kaynak katmanı etiketli) |
| Belirsiz alacak dilekçede açıkça yazılmalı; "fazlaya ilişkin haklar saklı" = kısmi dava; duruşma beyanıyla tür değişmez | Yargıtay HGK 07.07.2021 E.2021/485 K.2021/971 (işçilik alacağı) | 685303100 — https://mevzuat.adalet.gov.tr/ictihat/685303100 | «Belirsiz alacak davası niteliği gereği istisnai bir dava türü olmakla davasını belirsiz alacak davası olarak açan kişi bunu açıkça dilekçesinde belirtmelidir.» · «Her ne kadar 30.10.2014 tarihli duruşmada davacı vekili "davamız belirsiz alacak davasıdır" şeklinde beyanda bulunmuş ise de; davanın türünün bu şekilde değiştirilmesine imkân bulunmamaktadır.» | ictihat_getir tam metin ✓ |
| Aynı ilkenin BAM aktarımı | Ankara BAM 26. HD 23.06.2022 E.2022/1527 K.2022/1688 (trafik — değer kaybı) | 784167900 — https://mevzuat.adalet.gov.tr/ictihat/784167900 | «Dava dilekçesinde "belirsiz alacak davası" açıldığı yazılı değilse veya Hukuk Muhakemeleri Kanunu'nun 107. maddesine dayanılmamışsa, davanın kısmi dava olarak açıldığı kabul edilmelidir» | tam metin ✓ (DENETCI 2026-10-20); E/K no karar metninde maskeli, mahkeme/daire/tarih uyuşur; HGK 2021/485'i aktarır |
| Kıdem faizi: mevduata uygulanan en yüksek faiz (güncel metin; 2018'den beri değişmedi, 7589'da 1475/kıdem/mevduat geçmiyor) | 1475 s.K. m.14/11 | mevzuatgov:kanun:5:1475:m14 | «Kıdem tazminatının zamanında ödenmemesi sebebiyle açılacak davanın sonunda hakim gecikme süresi için, ödenmeyen süreye göre mevduata uygulanan en yüksek faizin ödenmesine hükmeder.» | mevzuat_getir 2026-10-23 ✓; değişiklik listesinde son kayıt KHK/700; mevzuat_icinde_ara (7589) 0 sonuç |
| Kısmi davada ıslahla artırılan dahil kıdemin tamamına fesih tarihinden faiz | Yargıtay 9. HD 27.06.2019 E.2015/27726 K.2019/14459 | 551683100 — https://mevzuat.adalet.gov.tr/ictihat/551683100 | «ve ayrıca kıdem tazminatı alacağının tamamına fesih tarihinden itibaren faize hükmedilmesi gerekirken, dava dilekçesi ile talep edilen kısmına fesih tarihinden bakiyesine faizsiz olarak hükmedilmesi» | ictihat_getir 2026-10-23 ✓ (Daire gerekçesi) |
| Kıdem faizi fesih tarihinden; istisna: emeklilik belgesi verilmemişse arabuluculuk son tutanak tarihinden (ıslahlı kısmi dava) | Yargıtay 9. HD 26.02.2026 E.2026/811 K.2026/1714 | 1218270900 — https://mevzuat.adalet.gov.tr/ictihat/1218270900 | «Kıdem tazminatının gününde ödenmemesi durumunda ödenmesi gereken faiz mevduata uygulanan en yüksek faizdir. Faiz başlangıcı fesih tarihi olmalıdır. Yaşlılık, malullük aylığı ya da toptan ödeme almak için işyerinden ayrılma hâlinde işçinin bağlı bulunduğu kurum ya da sandığa başvurduğunu belgelemesi şarttır. Bu hâlde faiz başlangıcı da anılan belgenin işverene verildiği tarihtir.» | ictihat_getir 2026-10-23 ✓; aynı gerekçe 9. HD 13.05.2026 E.2026/3829 K.2026/4427 (1231848400) |
| Dava öncesi temerrüt varsa ıslahla artırılan dahil tamamına temerrüt tarihinden faiz | Yargıtay 9. HD 29.11.2023 E.2023/18298 K.2023/18519 | 991966300 — https://mevzuat.adalet.gov.tr/ictihat/991966300 | «Davacı taraf; davadan önceki bir tarihte davalıya ihtarname göndererek davalıyı temerrüde düşürmüş olmakla, alacakların tamamı için ihtarname ile oluşan temerrüt tarihinden itibaren faiz yürütülmesi gerekirken yazılı şekilde temerrüt ve ıslah tarihinden faize hükmedilmesi hatalı olup bozmayı gerektirmiştir.» | ictihat_getir 2026-10-23 ✓ |
| Takdiri indirimden doğan ret için davalı lehine vekâlet ücreti yok; indirim dışı ret AAÜT 13/2 ile sınırlı | Yargıtay 9. HD 24.01.2022 E.2022/343 K.2022/918 | 732819800 — https://mevzuat.adalet.gov.tr/ictihat/732819800 | «Mahkemece ne miktarda indirim yapılacağı işçi tarafından bilinemeyeceğinden, indirimden kaynaklanan ret sebebiyle kendisini vekille temsil ettiren davalı yararına avukatlık ücretine hükmedilemez.» · «takdiri indirim sebebiyle reddedilen miktar dışında davada toplam reddine karar verilen alacak miktarı 3.257,48 TL olup … 3.257,48 TL avukatlık ücreti verilmesi gerekirken 4.080,00 TL maktu vekalet ücretine hükmedilmesi hatalı» | ictihat_getir 2026-10-23 ✓; aynı ilke 9. HD 2022/3107 E. 2022/4180 K. (750209400) |
| AAÜT: maktu taban, reddedilen miktar tavanı, hüküm tarihindeki tarife | AAÜT (RG 04.11.2025, 33067) m.13/1-2, m.21; Ek: ikinci kısım ikinci bölüm 10. sıra, üçüncü kısım 1. dilim | mevzuatgov:teblig:5:42687 | «Ancak, hükmedilen ücret kabul veya reddedilen miktarı geçemez.» · «Avukatlık ücretinin takdirinde, hukuki yardımın tamamlandığı veya dava sonunda hüküm verildiği tarihte yürürlükte olan Tarife esas alınır.» · Ek: «Asliye Mahkemelerinde takip edilen davalar için 45.000,00 TL» · «İlk 600.000,00 TL için 16,00%» | mevzuat_getir + RG eki görüntüden okundu 2026-10-23 ✓ (iş mahkemesi için ayrı satır yok) |
| Somutlaştırma eksikliği iddia yokluğu değildir; hâkim mevcut vakıa kapsamında açıklattırır | Yargıtay 9. HD 16.02.2021 E.2020/5118 K.2021/4007 | 653136400 — https://mevzuat.adalet.gov.tr/ictihat/653136400 | «önce hâkim davayı aydınlatma ödevi ve ön incelemedeki görevi gereği, somut olmayan hususların belirlenmesini (yeni bir vakıa meydana getirmeden, sadece mevcut vakıa kapsamında) davacıdan istemeli, bu eksiklik tamamlanırsa yargılamaya devam edilerek karar verilmeli, bu eksiklik tamamlanmaz, somutlaştırma gerçekleşmezse, ispatsız kalan davanın reddine karar verilmesi gereklidir.» | ictihat_getir 2026-10-23 ✓ |
| Gün-saat yazılmadan istenen fazla çalışmada önce açıklattırma | Yargıtay 9. HD 24.12.2020 E.2018/456 K.2020/20143 | 668177600 — https://mevzuat.adalet.gov.tr/ictihat/668177600 | «Somut açıklama içermeyen talepler hakkında tanık anlatımı ile hüküm kurulması hatalı olup bozmayı gerektirmiştir.» | ictihat_getir 2026-10-23 ✓ (aleyhe yön: aynı karar puantajlı dönemde puantaja göre hesabı ister) |
| Islah harcı yatırılmazsa kesin süre; yatmazsa ıslah yapılmamış sayılır | Yargıtay 9. HD 09.12.2020 E.2016/34745 K.2020/17851 | 659830700 — https://mevzuat.adalet.gov.tr/ictihat/659830700 | «ıslah harcının yatırılmaması halinde 492 sayılı Harçlar Kanunu'nun 30. maddesi gereğince işlem yapılması, davacıya ıslah ile taleplerin artırılan kısımlarının harcını yatırması için yöntemince kesin süre verilmesi, verilen kesin süre içerisinde yatırılmaması halinde ıslah hiç yapılmamış kabul edilerek yargılamaya devam edilmesi gerekirken» | ictihat_getir ✓ |
| Kıdem tazminatı faizi fesih tarihinden, mevduata uygulanan en yüksek faiz | Yargıtay 9. HD 19.01.2021 E.2020/4492 K.2021/1536 | 643306500 — https://mevzuat.adalet.gov.tr/ictihat/643306500 | «kıdem tazminatının gününde ödenmemesi durumunda mevduata uygulanan en yüksek faize karar verilmelidir. Faiz başlangıcı fesih tarihi olmalıdır.» | ictihat_getir ✓ |
| Kısmi davada fazla çalışma/UBGT faizinde dava–ıslah ayrımı | Yargıtay 9. HD 24.05.2023 E.2023/2507 K.2023/7624 | 917805200 — https://mevzuat.adalet.gov.tr/ictihat/917805200 | «Dava kısmi dava olarak açılmış olup davacının fazla çalışma alacağı ile ... ... ve genel tatil ücreti alacağına dava/ıslah ayrımı yapılarak faiz başlangıç tarihlerinin belirlenmesi gerekirken alacakların tamamına dava tarihinden itibaren faiz işletilmesi de hatalıdır.» | tam metin ✓ (DENETCI 2026-10-20) |
| Rapora itiraz etmeme karşı taraf lehine usuli kazanılmış hak doğurmaz | Yargıtay 9. HD 11.05.2026 E.2026/1804 K.2026/4315 | 1227001200 — https://mevzuat.adalet.gov.tr/ictihat/1227001200 | «bilirkişi raporuna itiraz biçimindeki usul işleminin yapılmamasının ortadan kaldırabileceği tek hak, yine usuli bir hak olan rapora itiraz etme hakkıdır.» | ictihat_getir ✓ |
| Rapora karşı beyan süresi beklenmeden karar = bozma | Yargıtay 9. HD 06.12.2021 E.2021/11984 K.2021/16145 | 715440500 — https://mevzuat.adalet.gov.tr/ictihat/715440500 | «davalının ek rapora karşı beyanda bulunması için yasal iki haftalık süresi beklenmeden 14.04.2021 günü davanın esası hakkında karar verildiği anlaşılmaktadır. Davalı tarafa bu rapora karşı beyan ve itirazlarını sunma imkanının verilmemiş olması hukuki dinlenilme hakkını temin eden savunma hakkının kısıtlanması anlamına gelmektedir.» | tam metin ✓ (DENETCI 2026-10-20) |
| 109/4'ün derdest eski kısmi davada derhâl uygulanması (ilk derece, kesinleşmedi) | İstanbul 17. ATM 09.09.2026 E.2025/403 K.2026/357 | 1230500200 — https://mevzuat.adalet.gov.tr/ictihat/1230500200 | «bu düzenlemenin usuli bir düzenleme olduğu, önceden açılmış ve tahkikatı henüz sona ermemiş eldeki kısmi dava olarak açılmış davada derhal uygulama ilkesi uyarınca uygulanması gerektiği anlaşıldığından; davacının 14/02/2019 tarihinde harcını yatırdığı ilk talebinin talep artırım dilekçesi mahiyetinde değerlendirilmesi gerektiği, 25/04/2022 tarihli dilekçesinin de ıslah dilekçesi olarak kabul edilmesi gerektiği» | ictihat_getir ✓ — KESİNLEŞMEDİ, ticaret mahkemesi, iş davası değil; emsal gücü sınırlı. Not: mahkeme hükümde artırılan kısma yine "ıslah tarihinden" faiz yürüttü |
| 109/4 hakkında Yargıtay kararı | ictihat_ara `+"109" +"talep artırım" +"7589"` (2026-07-31 sonrası, Yargıtay+BAM+yerel) | — | 1 sonuç (yukarıdaki ATM kararı). Yargıtay/BAM kararı YOK | KAYNAK YOK — avukat bilsin |
| Cevap ıslahıyla zamanaşımı def'i harçsız; açık muvafakat yolu da var | Yargıtay 9. HD 02.11.2020 E.2016/30951 K.2020/14189 | 613563700 — https://mevzuat.adalet.gov.tr/ictihat/613563700 | «Cevap dilekçesinin ıslah edilmesi harca da tabi değildir.» | tam metin ✓ (DENETCI 2026-10-20); aynı kararda süresinde ileri sürülmeyen def'in 141/son uyarınca davacının açık muvafakatiyle de getirilebileceği yazılı |
| Basit usulde cevap süresi ve cevaba cevap yasağı | HMK 317/2-3 | mevzuatgov:kanun:5:6100:m317 | «Cevap süresi, dava dilekçesinin davalıya tebliğinden itibaren iki haftadır.» · «Taraflar cevaba cevap ve ikinci cevap dilekçesi veremezler.» | mevzuat_getir ✓ |
| Basit usulde boşluk → yazılı usul hükümleri | HMK 322/1 | m322 | «Bu Kanun ve diğer kanunlarda basit yargılama usulü hakkında hüküm bulunmayan hâllerde, yazılı yargılama usulüne ilişkin hükümler uygulanır.» | mevzuat_getir ✓ |
| İstinafa cevap 2 hafta | HMK 347/2 | m347 | «Karşı taraf, tebliğden itibaren iki hafta içinde cevap dilekçesini kararı veren mahkemeye veya bu mahkemeye gönderilmek üzere başka bir yer mahkemesine verebilir.» | mevzuat_getir ✓ |
| Harçlar K. m.30/32 — noksan harç tamamlanmadan müteakip işlem yapılmaz | 492 s.K. m.30, 32 | 659830700 kararı içinden aktarım | «492 sayılı Harçlar Kanunu'nun 32. maddesi gereğince noksan harçlar tamamlanmadıkça müteakip işlemler yapılamayacağından» | madde metni bu turda çekilmedi [DOĞRULANMAMIŞ — karar aktarımı] |
| Ad düzeltmesi / taraf değişikliği ıslah değildir | HMK 124, 183 | — | — | madde metni çekilmedi [DOĞRULANMAMIŞ — Yargı PRO 19-3 rehberi] |

**Aleyhe içtihat: VAR** — (0) HGK 2021/485: belirsiz alacak davası açıkça yazılmamışsa dava kısmi davadır, sonradan beyanla değişmez (eski dosyalarımızda "belirsiz" yazılmamışsa 107 koruması YOK); (1) 9. HD 2026/1344 E.: koşulları yokken belirsiz alacak açılması esasa girilmeyi hatalı kılar (eski dosyalarımızda davalı bu yönü istinafta kullanabilir); (2) 9. HD 2025/9751 E.: kısmi dava ıslahla belirsiz alacağa çevrilemez, ıslaha karşı zamanaşımı def'i geçerli; (3) 9. HD 2023/14969 E.: kısmi davada artırılan kısma ıslah tarihinden faiz; (4) 109/4'te faiz ve geçiş konusunda Yargıtay görüşü yok — belirsizlik aleyhe de sonuçlanabilir.

**Açık kalemler:** HMK 124, 183, 243–265 (tanık dinleme usulü) ve Harçlar K. m.30/32 madde metinleri çekilmedi. Bir dilekçeye taşınmadan önce `mevzuat_getir` ile kapatılır (EK denetimi).

**Denetim kaydı:** DENETCI (istek, 2026-10-20, 1. tur) SARI — 0 KIRMIZI, 8 SARI; bulgular bu sürüme işlendi (`tmp/denetim-surec-haritasi-2026-10-20.md`). 2. tur avukat isterse `denetle:` ile.

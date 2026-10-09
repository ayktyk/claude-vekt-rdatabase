# Dersler — Sistem / Altyapı

## 2026-07-09 — smoke test (arac-mahrumiyet-bedeli-icra)
- KAÇIRILAN: Bedesten canlı indeksi sorgu anında erişilemezdi; sistem yedek
  arşive (~Nisan 2025) otomatik düştü — son 2-3 ayın kararları taranamadı.
- DÜZELTME: Rapora kaynak-tazeliği flag'i kondu; sorun değil, davranış doğruydu.
- KURAL ADAYI: `ictihat_ara` yanıtında "yedek arşiv" uyarısı görülürse rapor
  frontmatter'ına `kaynak_notu` + Risk Flag'lere tazelik notu ZORUNLU.

## 2026-07-09 — smoke test (arac-mahrumiyet-bedeli-icra)
- KAÇIRILAN: DOCX üretimi Mac'te patladı — `python-docx` kurulu değil.
- DÜZELTME: MD raporu Drive'a yazıldı, DOCX atlandı, avukata bildirildi.
- KURAL ADAYI: Yeni makine kurulumunda `pip3 install -r requirements.txt`
  onboarding adımı; DOCX üretimi öncesi import hızlı-kontrolü.

## 2026-07-18 — Benchmark revizyonu: Luna ve Claude çıkarıldı
- KAÇIRILAN: Hukuk benchmark'ında (son benchmark.jfif) pipeline'ın nihai 2B
  raporunu yazan Luna en zayıf modeldi (87/100); en güçlü kombinasyon
  Gemini 3.1 Pro + YargıPro (96) ve Sol + YargıPro (91) iken sentez zayıf
  halkadaydı. Ayrıca araç desteğinin (+YargıPro) her modele +2…+7 puan
  kattığı görüldü.
- DÜZELTME: Avukat kararıyla pipeline Sol→Terra→Sol(sentez)→Terra(kalite)
  yapıldı; Claude (Fable) orkestrasyon dahil ŞİMDİLİK tamamen çıkarıldı —
  orkestratör Codex/Sol (AGENTS.md), üretim Antigravity/Gemini 3.1 Pro.
  MemPalace/Gmail/Takvim devre dışı; hafıza dersler/+playbook/ dosya döngüsü.
  Spec: docs/superpowers/specs/2026-07-18-claudesiz-motor-revizyonu-design.md
- KURAL ADAYI: Araç erişimi olmayan motor künye YAZAMAZ; araçsız üretimde
  "ARAÇSIZ — künye içermez" damgası zorunlu (AGENTS.md doktrin md.7).

## 2026-07-19 — Codex denemesi geri alındı: Claude+Gemini dönüşü
- KAÇIRILAN: Benchmark puanı tek başına orkestratör seçimi için yeterli
  kriter değildi — Codex/Sol orkestrasyonu avukatın çalışma akışında
  (kontrol kapıları, MCP entegrasyonları, MemPalace/Gmail/Takvim
  otomasyonu) beklentiyi karşılamadı.
- DÜZELTME: Avukat kararıyla (2026-07-19) Codex TÜM projeden kaldırıldı
  (arsiv/codex-motor/). Orkestra şefi + tüm tool kullanımı Claude Fable 5;
  limit dolarsa Claude Opus 4.8 (bildirimli). Hukuki muhakeme
  Antigravity/Gemini 3.1 Pro'da kaldı. 2B tek elden Claude iteratif derin
  protokol. Spec: docs/superpowers/specs/2026-07-19-claude-gemini-donus-design.md
- KURAL ADAYI: Motor/orkestratör değişikliği kararında benchmark puanına ek
  olarak entegrasyon maliyeti (MCP, hook, hafıza katmanları) ve avukatın
  fiili kullanım deneyimi ZORUNLU kriterdir; tek metrikle motor değiştirilmez.

## 2026-07-24 — 15 dava türü playbook seti yazıldı (MCP doğrulamalı)
- KAÇIRILAN: `mevzuat_getir(id_type=madde, madde_no=X)` çağrısı, kanunların
  EK ve GEÇİCİ maddelerini BULAMIYOR (madde_no_not_found döner) — bunlar MCP
  ağacında sayısal numarayla gelmiyor. İş K. Ek m.3 (zamanaşımı) bu yüzden
  doğrudan çekilemedi.
- DÜZELTME: Ek/Geçici madde metni, o maddeyi metninde birebir aktaran güncel
  bir Yargıtay kararından (`ictihat_getir`) doğrulandı (İş K. Ek m.3 + Geçici
  m.8 → documentId 1093760300). Alıntı karar metninden alındı, uydurulmadı.
- KURAL ADAYI: Bir kanunun EK/GEÇİCİ maddesi gerektiğinde: (a) `id_type=outline`
  ile ağacı çekip madde_id bul, VEYA (b) o maddeyi aktaran güncel içtihattan
  doğrula. UYDURMA YASAK — çekilemeyen madde `[METİN DOĞRULANMADI]` damgalanır.
- İKİNCİ DERS: Playbook doğrulama disiplini — künye yazılan her karar
  `ictihat_getir` ile TAM METİN açıldı, alıntılar birebir; her mevzuat maddesi
  `mevzuat_getir` ile çekildi; tutar/oran/tarife YAZILMADI (yıllık değişir,
  "UYAP'tan teyit" formülü). Doğrulanmış künye çekirdeği playbook/README.md'de.
- ÜÇÜNCÜ DERS: Bedesten sık sık ~Nisan 2025 yedek arşivine düşüyor; snippet'ler
  tam metin okunmadan kullanıldıysa tabloda işaretlendi, son ~3 ay eksik notu
  kondu.

## 2026-09-02 — DENETCI kapısı uçtan uca doğrulandı (tek motora geçiş)

**KAÇIRILAN:** Tek motora geçerken "bağımsız denetim aynı modelle de çalışır" iddiası
kağıt üzerindeydi; çalıştığı gösterilmemişti.
**DÜZELTME:** Bilerek kusurlu çıktı (uydurma 9. HD künyesi, uydurma alıntı, "Yargıtay
yerleşmiştir", "işveren mutlaka kaybeder", İİK 89/4→89/3 taşıma) sıfır bağlamlı
DENETCI'ye yalnız dosya yolu + dava-id ile verildi. Sonuç KIRMIZI, 7 KIRMIZI + 4 SARI
bulgu; künye Bedesten docket aramasıyla, alıntı tam-ifade aramasıyla, bağlam kayması
İİK m.89 kaynak metniyle çürütüldü. Çıktı Drive'a yazılmadı.
**KURAL ADAYI:** (1) Denetim mekanizması değiştiğinde sahte-kusurlu çıktı ile uçtan uca
denenmeden canlıya alınmaz. (2) `TBB_BANNED_PHRASES` "mutlaka kaybed" kalıbını
içermiyor — denetçi muhakeme düzeyinde yakaladı; listeye "mutlaka kaybed", "kesin
kaybed" eklenmesi değerlendirilsin (ters yönlü aşırı vaat).

## 2026-10-09 — Karma mimari: pipeline neden durmuştu (Yargı PRO sonrası)

**KAÇIRILAN:** Eylül'den beri hiçbir davada 4A-4E, savunma simülasyonu ve v1→v2 üretilmedi.
Nedenler birlikte çalıştı: (1) 7 ASAMA yalnız `yeni dava:` ile tetikleniyordu, işler ise UYAP
klonu + tekil dilekçe talebi olarak geldi; (2) Yargı PRO sunucusu "her hukuki işten önce
`hukuk_skill` çağır, talimatını izle" diyor, global `~/.claude/skills/dilekce-yaz` adı proje
komutuyla çakışıyor ve 7 ASAMA'yı atlayan tek atımlık akış dayatıyordu; (3) global
`~/.claude/CLAUDE.md` eski 4-ajan sistemini anlatıyordu (iki anayasa); (4) DENETCI her ara
çıktıda 3 tura kadar çalışıyor, sonucu dosyaya yazılmıyordu; `cikti_dogrula.py` gerçek TC'li
her dilekçeyi FAIL sayıyordu; denetçi alt-ajanının araç listesinde Yargı PRO MCP yoktu;
(5) `config/motor-haritasi.json` geçersiz JSON, Drive kökü `1Hukuk Bürosu`'na taşınmış.
**DÜZELTME:** Karma mimari (AGENTS.md): öncelik sırası, ASAMA ↔ `hukuk_skill` eşlemesi,
Çalışma Modları (TAM/HIZLI; esas belge varsayılan TAM), Denetim Politikası v2 (son hâli: K1 + KS
+ K2 + EK; ara çıktıda `havuz_kontrol.py`; dışarı giden belge = belge + eşlik çifti), akış kaydı
`00-AKIS.md` (`scripts/akis.py`), `/dilekce` komutu, KVKK kapsamı `--kamu`.
Tasarım: `docs/superpowers/specs/2026-10-09-karma-mimari-yargipro-design.md`.
**KURAL ADAYI:** (1) Yeni bir araç/MCP/skill paketi bağlanınca "kendi talimatı ve orkestrasyonu
var mı, anayasayla çakışıyor mu, komut adları çakışıyor mu" kontrolü yapılmadan canlıya
alınmaz. (2) Akış durumu ve denetim sonucu sohbette değil dosyada (`00-AKIS.md`) tutulur.

## 2026-10-09 (ikinci tur) — Bağımsız inceleme: politika kağıtta kalmıştı

**KAÇIRILAN:** İlk tur düzeltmesi kendi içinde çelişkiler taşıyordu. (1) Künye havuzu kuralı
yalnız metindi; ara çıktının havuz dışına çıktığını yakalayan bir kapı yoktu. (2) Dışarı giden
belgeye SENTINEL ve Kaynak Doğrulama tablosu yazılması isteniyordu; UYAP'a doktrin izi gidecekti,
temiz belge ise yapısal kapıdan geçemiyordu. (3) `akis.py` aynı davadaki ikinci işi ayırmıyor,
geçişi durduran bir engel taşımıyordu; `paths.py dava` kısa id'de olmayan klasör yolu üretebiliyordu.
(4) Belgelerde araçla doğrulanmamış iddialar vardı: `mevzuat_ara` için operatör lehçesi (rehber:
operatör yok), `mevzuat_getir` gerekçe seçeneği (yok), dava-cli girişinde `issue_cli_login_code`
(araç tanımı: dava-cli'de çalışmaz), 12 kurum (araç tanımı: 18), MCP timing hook'larının "yazmaya
devam ettiği" (hook'lar bağlı değildi), maskeleme ertelendiği hâlde ajan dosyalarında "maskele".
**DÜZELTME:** KS denetim noktası (stratejik analiz) ve EK (havuz eki); `scripts/havuz_kontrol.py`;
`cikti_dogrula.py --eslik` ve `md_to_udf.py` koruması; `akis.py` sürüm 2 (iş bazlı kayıt, KIRMIZI
ve SARI'da ENGEL); `paths.py dava` tek eşleşme kuralı; araç tablosu ve sorgu lehçesi araç
tanımlarından, `sure_hesapla` bayrakları ve güven alanları örnek çalıştırmayla doğrulanarak düzeltildi.
**KURAL ADAYI:** (1) Bir aracın bayrağı, parametresi veya kapsamı hakkındaki iddia belgeye yazılmadan
önce aracın kendi tanımından veya örnek çalıştırmadan doğrulanır. (2) Dışarı giden metin ile denetim
izi aynı dosyada tutulmaz (belge + eşlik çifti). (3) Bir kural "zorunlu" yazılıyorsa onu zorlayan
deterministik kapı da aynı değişiklikte eklenir.

## 2026-10-09 (üçüncü tur) — Şablonlar kapıyla çelişiyordu

**KAÇIRILAN:** İkinci tur politikası 11 noktada başka dosyalarla çelişiyordu. Revizyon istemi v2'yi
hiç yazdırmıyordu ("yalnız talimat ver"). Ortak kurallar her çıktıya TASLAK satırı ve GÜVEN NOTU
koyduruyordu; bunlar dışarı giden belgeye sızabiliyordu ve kapı yakalamıyordu. İstinaf ve müvekkil
bilgilendirme eşlik dosyasına bağlanmamıştı. 4A-4E ve briefing şablonları zorunlu yapısal kapıyı hiç
geçemezdi. `akis.py` havuz eki engelini ve `denetle:` kaydını desteklemiyordu; yol yazımı farkı
yanlış ENGEL üretiyordu.
**DÜZELTME:** Bağımsız tutarlılık incelemesinin 11 bulgusu kod ve metinde kapatıldı (tasarım kaydı
§4 üçüncü tur). Briefing şablonu yapısal kapıdan örnekle geçirildi.
**KURAL ADAYI:** (1) Politika değişince her çıktı şablonu yapısal kapıdan bir örnekle geçirilir
(şablon ↔ kapı uyumu). (2) Bağımsız tutarlılık incelemesi değişiklik setinin parçasıdır, isteğe bağlı
değildir.

## 2026-10-09 (beşinci tur) — Beceri haritası: yazan komut sınama için çağrılmaz

**KAÇIRILAN:** Bayrak biçimini sınamak için Yargı PRO masaüstü aracının veri değiştiren `esitle` komutu
kuru çalışma bayrağıyla çağrıldı. Yanıt kuru çalışma olarak döndü (adet 10, iş açılmadı, indirme yok);
yine de girdi biçimi aracın `semasi` çıktısında zaten vardı, çağrı gereksiz bir riskti. Ayrıca 107
becerinin 39'u hiçbir aşamaya veya hatta bağlı değildi; takip becerilerinin büroda dosya yeri yoktu.
**DÜZELTME:** AGENTS.md "Yargı PRO masaüstü komut satırı": yazan komutlar deneme amacıyla çağrılmaz,
girdi biçimi `semasi`den okunur. Avukatla birlikte verilen dört kararla her beceriye yer verildi
(`config/beceri-haritasi.json`, 9 büro hattı); 12-4 satırları için `scripts/sure_kalkani.py` deposu
yazıldı, `sure_takvimi` çıktısı örnekle doğrulandı.
**KURAL ADAYI:** (1) Bir aracın yazan komutu biçim sınamak için bile çalıştırılmaz; önce şema veya
yardım çıktısı okunur. (2) Dış bir beceri benimsenirken çıktısı örnek çalıştırmayla doğrulanır ve kalıcı
kaydı için deterministik bir büro betiği eklenir; kayıt yapılmamışsa görünüm "yok" demez, "kayıt yok" der.

## 2026-10-09 (altıncı tur) — Büyük eşitleme: komut dönmüyordu, okuma da sınıra takılıyordu

**KAÇIRILAN:** (1) Masaüstü aracın `klonla` komutu iş uygulamada "hazır" olduktan sonra da dönmedi; ilk koşucu bu
yüzden ilk dosyada asılı kaldı. (2) `icra` gibi okuma komutları da UYAP'a canlı gider ve `UYAP_ISLEM_SINIRLI` döndü;
"okuma serbest" varsayımı yük bakımından eksikti. (3) İlk koşucu üç eşzamanlı klonlama planlıyordu; avukat "uzun da
sürse dikkatli yavaşça indir" dedi (aşırı otomatik indirme UYAP erişim yasağına yol açabilir).
**DÜZELTME:** `scripts/uyap_esitle.py`: komut boş girdiyle başlatılır, iş `isler` listesinden izlenir, iş bitip kuyruk
boşalınca komut kapatılır; tek dosya, 5-8 dk ara, günde en çok 15 dosya (kayıttan sayılır), ilk sınır uyarısında o gün
durur. `scripts/uyap_takip.py`: canlı okuma günde bir kez, sonuç önbellekte.
**KURAL ADAYI:** (1) Dış sisteme yük bindiren her toplu işte önce hız ve günlük tavan yazılır, ilk sınır sinyalinde
durulur. (2) Bir CLI komutunun bitişi çıkış koduna değil sistemin kendi iş durumuna bakılarak doğrulanır.

## 2026-10-09 (yedinci tur) — UYAP doğrulama istedi, koşucu tanımadığı için 14 kez daha denedi

**KAÇIRILAN:** 15 dosya/gün hızında, yaklaşık üç saat ve 12 klonlama işinden sonra UYAP doğrulama (CAPTCHA) istedi
(`UYAP_CAPTCHA`). Koşucunun durma kuralı bilinen sınır kodlarının listesine bağlıydı; bu kod listede olmadığı için
20.27'den 22.11'e kadar 7 dakikada bir 14 kez daha denedi. Avukat açıkça "ban yemeyelim" demişti.
**DÜZELTME:** `uyap_ortak.durma_nedeni`: başarı dışındaki HER sonuçta durulur (yalnız yerel INVALID_INPUT atlatır);
`UYAP_CAPTCHA` eşitlemeyi kilitler, avukat doğrulamayı uygulamada tamamlayıp `uyap_esitle.py devam --not` ile açıkça
onaylamadan başlamaz. Hız: günde en çok 8 dosya, 10-15 dakika ara.
**KURAL ADAYI:** Dış sistemle toplu işte durma kuralı izin listesine (bilinen hata kodları) değil başarı koşuluna
bağlanır: beklenen başarı gelmediyse dur. İnsan doğrulaması isteyen sinyal, insan onayı olmadan geçilmez.

## 2026-10-09 (sekizinci tur) — Excel'de sayfa taşıma yeni çalışma kitabı açtı

**KAÇIRILAN:** İş takip Excel'ine yeni sayfa eklerken `Move(Missing, son_sayfa)` çağrısı hedefsiz algılandı; Excel
sayfayı yeni bir çalışma kitabına taşıdı, sayfa ana dosyada kalmadı ve iki deneme hatayla bitti. Dosyaya yazılmadı
(kaydetmeden önce düştü), açılır listeler korundu.
**DÜZELTME:** `excel_takip._sayfa`: yalnız 'önüne taşı' (Before) biçimi; yeni sayfa önce son sayfanın önüne, sonra son
sayfa onun önüne alınır; referans her taşımadan sonra adla yeniden alınır. Gerçek dosyadan önce kopya üzerinde denendi;
yazmadan önce akşam yedeği alındı.
**KURAL ADAYI:** Avukatın dosyasına yazan yeni bir kod yolu önce dosyanın kopyası üzerinde çalıştırılır.

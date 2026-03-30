# GEMINI PLANI (Gelecek Vizyonu ve Eylem Haritası)

Bu doküman, `SONCLAUDE.md` içerisindeki usta vizyona ve son oturumlardaki "İsmail Kırca Dolandırıcılık Davası" interaktif tecrübelerine dayanarak Otomasyon Sisteminin (Antigravity/Claude Code/Gemini) **bundan sonra atması gereken adımları** listelemektedir. 

Sistem şu ana kadar başarıyla;
- Ajan ağacı ve iş-geçiş (pipeline) mimarisini kurdu.
- UDF formatına dönüşüm `udf-cli` aracıyla çözüldü ve lokal yama ile UYAP imleç problemi giderildi.
- Sistem çıktıları lokal depolamadan alınarak tamamen **Google Drive (`G:\`) senkronizasyonuna** kavuşturuldu.

Aşağıdaki fazlar sırasıyla icra edilecektir.

---

## FAZ 2: Gelişmiş Ajan Zekası ve Klasör-İçi Otonomi

**1. Tam Otonom "Savunma Simülatörü" (Adım 9)**
- *Mevcut Durum:* Sadece son davada yapay zekanın kendi inisiyatifiyle (system prompt vasıtasıyla) manuel oluşturuldu.
- *Hedef:* `ajanlar/savunma-simulatoru/SKILL.md` üzerinden tamamen sistematik hale getirilecek. Dilekçe yazımına geçmeden önce sistem otomatik olarak karşı tarafın (savcılık/davacı) en güçlü 3 argümanını listeleyen ve çürüten bir rapor hazırlayacak.

**2. Muvekkil Evrakları İçin Yapılandırılmış Tasnif Modülü (Adım 10)**
- *Mevcut Durum:* Dosyalar `04-Muvekkil-Belgeleri` içerisine elle atılıp, manuel brief veriliyor.
- *Hedef:* Sistem klasördeki PDF/Resim/Log verilerini otonom okuyacak. `evrak-listesi.md` oluşturup, "Eksik Evrak Analizi" tablosu sunacak (Örn: HTS kaydı var, MASAK raporu eksik).

**3. Otonom Revizyon Döngüsü (Adım 11)**
- *Hedef:* Dilekçe yazarı `v1`'i ürettiğinde, bu doğrudan avukata sunulmak yerine önce `Revizyon Ajani` (İç Denetçi) tarafından okunacak. İspat yükü, mevzuat uyumu, zayıf noktalar açısından "Utandırma Testi (Risk Flag)" yapılacak ve varsa otomatik `v2` üretilecek.

---

## FAZ 3: HukukTakip Dashboard (Arayüz) Entegrasyonu

*(Bu faz, ajanların markdown üretme yetenekleri backend ile buluşturulduğunda başlayacaktır.)*

**1. Arayüzde "AI Workspace" Sekmesi (Adım 12)**
- React/Vite arayüzündeki Dava Detay `case detail` sayfasına **Yapay Zeka Çalışma Alanı** sekmesi eklenecek. Drive'daki md dosyalarının canlı yayın (parse edilmiş) hali Dashboard üzerinden okunabilecek.
- Yanlarında `[Onayla]` ve `[Revize Et]` aksiyon butonları olacak.

**2. AI Çıktılarının Veritabanına (Drizzle/PostgreSQL) Aktarımı (Adım 13 & 14)**
- "Eksik evrak" tablosu (Örn: Tanık ifadeleri toplanmadı), backend tarafında otomatik Tasks (Görevler) tablosuna insert edilecek.
- Risk Flag'ler ve zamanaşımı uyarıları sisteme bildirim (Notification) olarak yansıtılacak.
- Ana sayfaya "AI Durum Paneli" eklenerek, hangi davada usul veya araştırma ajanının ne aşamada olduğu özetlenecek.

**3. Dashboard Üzerinden Tetikleme (Adım 15)**
- Kullanıcı terminal kullanmadan, Web arayüzündeki `[AI ile Başlat]` butonuna basarak yeni davanın parametrelerini (Briefing) girebilecek ve arka planda otonom workflow'u başlatacak.

---

## Hemen Bir Sonraki Oturumda Yapılması Tavsiye Edilenler:
- `ajanlar/savunma-simulatoru/SKILL.md` ve `ajanlar/revizyon-ajani/SKILL.md` yönergelerinin canlandırılarak sisteme test kodlarının yazılması.
- Terminal komut seti (`CLI`) ile çalışan NotebookLM entegrasyonu yerine Drive dokümanları üzerinden gelişmiş bir RAG altyapısının doğrudan ajan yetkilerine yetkilendirilmesi.

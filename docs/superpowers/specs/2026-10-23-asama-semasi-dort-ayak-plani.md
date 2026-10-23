# Aşama Şeması + Dört Ayak Planı (taslak, avukat onayına)

Tarih: 23.10.2026 · Talep (avukat, 22.10.2026): "her dava türü için güzel bir şema olsun ki elimizde hangi davada ne aşamadayız görelim; bu proje, isbu ofis, OneDrive'daki Excel ve Yargı PRO dörtgenini ne kadar aktif kullanırsak o kadar iyi … aşama aşama ilerleyelim."

## Mevcut durum (kontrol edildi)

| Ayak | Rolü (avukat kararı 22.10.2026) | Aşama bilgisi bugün nerede |
|---|---|---|
| isbu-ofis | Bütün dava ve işler (CMK, arabuluculuk dahil); telefondan takip | Her dosyada **Aşama** (serbest metin, 120 karakter), **Beklenen** ve **Kontrol tarihi** alanı var (`case_workspaces`). Çoğu dosyada boş. |
| Excel (OneDrive, Mücahit ile ortak) | Yalnız ortak dosyalar | DOSYALAR sayfasında **Aşama** sütunu, 13 sabit değerli açılır liste (LİSTELER sayfası): Hazırlık · Arabuluculuk · Soruşturma · Başvuru / tahkim · Dava açıldı · Tanık-delil · Bilirkişi · Karar bekleniyor · Karar verildi · İstinaf-temyiz · Kesinleşti · İcra · Tamamlandı. 22.10 kopyasında 99 dosyanın 99'unda dolu. |
| Yargı PRO | UYAP'ta vekil olunan bütün dosyalar | Aşama alanı yok; ama evrak listesi (tensip, ön inceleme zaptı, bilirkişi raporu, gerekçeli karar, istinaf başvurusu …) aşamayı kendiliğinden gösteriyor. |
| Proje + Drive dava klasörü | Üretim (dilekçe, araştırma, hesap) | `playbook/surec/` altında işçilik akışı A0–A13 (doğrulanmış), `_asama-modeli.md` kod sözlüğü, `Aktif Davalar/00-PORTFOY-ASAMA.md` (20.10, elle). |

Köprüler zaten var: `isbu_excel.py` Excel'deki "Aşama"yı ve "Sıradaki İş"i isbu-ofis'e öneri olarak taşıyor; `isbu_esitle.py` UYAP'tan duruşma ve süre önerisi gönderiyor. Eksik olan: **ortak bir aşama dili** ve **UYAP evrakından aşamayı kendiliğinden çıkaran adım**.

## Temel tasarım kararı (önerim)

1. **Ortak dil = Excel'deki 13 değer.** Sizin ve Mücahit'in zaten kullandığı liste; isbu-ofis'in Aşama alanına da aynen bu yazılır. Yeni kelime icat edilmez.
2. **Her dava türünün ince adımları bu 13 değerin altında durur.** Örnek işçilik: "Bilirkişi" ana değerinin altında A5 rapor bekleniyor, A6 rapora beyan ve ıslah. isbu-ofis'e "Bilirkişi · rapor geldi, beyan ve ıslah" gibi tek satır gider; A6 gibi kodlar yalnız proje dosyalarında kalır (isbu sade öneri kuralı).
3. **Aşamayı kim yazar:** ortak dosyada Excel'deki değer (insan yazdı) önceliklidir; UYAP evrakından çıkan aşama farklıysa yalnız "uyuşmazlık" önerisi gider, üzerine yazılmaz. Excel'de olmayan dosyada UYAP'tan çıkan aşama öneri olarak isbu-ofis'e gider, onayı siz verirsiniz.

İşçilik ince adımlarının 13 değere eşlemesi:

| Excel aşaması | İşçilik adımı |
|---|---|
| Hazırlık / Arabuluculuk | dava öncesi (ihtarname, arabuluculuk, dilekçe) |
| Dava açıldı | A0 tensip bekleniyor, A1 dilekçeler |
| Tanık-delil | A2 ön inceleme, A3 tanık celsesi, A4 tanığa karşı beyan |
| Bilirkişi | A5 rapor bekleniyor, A6 rapora beyan + ıslah / 109-4 |
| Karar bekleniyor | A7 karar celsesi, A8 gerekçeli karar bekleniyor |
| Karar verildi | A9 tebliğ + istinaf süresi |
| İcra | A10 ilamlı takip |
| İstinaf-temyiz | A11 istinaf + tehir-i icra, A12 temyiz |
| Kesinleşti / Tamamlandı | A13 tahsilat, kapanış |

## Aşamalar (her birinde durup onayınızı alırım)

**Adım 1 — Şema onayı (bu hafta).** 13'lü ana dil + dava türü başına ince adım listesi. İşçilik hazır. Sırayla yazılacaklar: genel hukuk davası (tüketici, kira, tazminat, itirazın iptali), icra takip hattı, ceza (CMK), aile, idare. Her biri işçilikte olduğu gibi mevzuat ve içtihatla doğrulanır. Sizden: 13 değere eklemek istediğiniz bir değer var mı (ör. "Ön inceleme" ayrı mı dursun)? Mücahit'le ortak liste olduğu için ekleme ikinizin kararı.

**Adım 2 — UYAP evrakından aşama tespiti.** Yeni betik: her dosyanın Yargı PRO evrak listesine bakıp son anlamlı evraktan (tensip zaptı, ön inceleme zaptı, bilirkişi raporu, gerekçeli karar, istinaf başvurusu, icra emri …) aşamayı ve "sıradaki işi" çıkarır. Önce 24 klonlu dosyada kuru çalışır, sonucu tablo olarak size gösteririm; doğruluğunu birkaç dosyada birlikte kontrol ederiz. Hiçbir yere yazmaz.

**Adım 3 — isbu-ofis'e aşama önerisi.** Adım 2'nin sonucu, isbu-ofis'teki mevcut Aşama / Beklenen / Kontrol tarihi alanlarına **öneri** olarak gider (öneriler sayfası, sizin onayınızla). Ortak dosyada Excel değeri esas alınır. isbu-ofis'te yeni alan veya şema değişikliği gerekmiyor.

**Adım 4 — Excel köprüsü.** Okuma çalışıyor. Canlı kopya için OneDrive'dan otomatik indirme, sizin vereceğiniz bir "bağlantıya sahip herkes görüntüleyebilir" paylaşım linkine bağlı (ya da OneDrive masaüstü uygulaması). Excel'e otomatik yazma önermiyorum: ortak dosya olduğu için Mücahit'in düzenlemesiyle çakışır. Onun yerine "Excel'de güncellenmesi gereken satırlar" listesi üretilir; siz ya da Mücahit tek tıkla düzeltirsiniz.

**Adım 5 — Drive dava klasörü ve portföy.** Her dava klasöründe `00-Dava-Ozeti.md`'nin ilk satırı aşama olur. `00-PORTFOY-ASAMA.md` elle değil, Adım 2 betiğinden üretilir. Bugün 63 klasörün 46'sında özet yok; bu adım onları da doldurur.

**Adım 6 — Günlük rutin.** `bugun` komutu: Yargı PRO'dan son hareketler → aşaması değişen dosyalar → isbu-ofis önerileri → portföy. Haftada bir "aşaması bilinmeyen ve atıl dosyalar" listesi. UYAP eşitleme hız sınırı (günde en çok 4 dosya, 20-30 dakika ara) aynen korunur.

## Bugünden kayda geçen karar

31.07.2026'dan önce açılmış kısmi davada artırım ıslahla, sonra açılanda HMK 109/4 bedel artırımıyla yapılır (avukat, 22.10.2026). Dilekçesinde açıkça belirsiz alacak yazan eski davalarda mülga 107/2 talep artırımı sürer. Islah dilekçesi yarım sayfa; kalıp: 2025-004 dosyasındaki ıslah dilekçesi. Süreç haritasına (§ karar noktası 1) ve hafızaya işlendi.

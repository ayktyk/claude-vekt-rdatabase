# Playbook Şablonu — Zorunlu Bölüm Sırası

Her `playbook/{dava-turu}.md` dosyası bu sırayı taşır. Bölüm atlanmaz;
içerik yoksa `[AVUKAT DOLDURACAK]` etiketi bırakılır — UYDURULMAZ.

| # | Bölüm | Ne içerir |
|---|---|---|
| 0 | **HIZLI KAPI** | Dosya gelince ilk 10 dakikada bakılan; kaçırılırsa dava biten şeyler (dava şartı, hak düşürücü süre, zamanaşımı, görev) |
| 1 | **İstenecek bilgi** | Müvekkile sorulacaklar — her biri neden gerektiğiyle |
| 2 | **Toplanacak belge** | Belge + nereden temin edilir + kim temin eder |
| 3 | **Dava öncesi zorunlu adımlar** | İhtarname / arabuluculuk / kuruma başvuru — sırasıyla |
| 4 | **Süre haritası** | Süre · başlangıç anı · dayanak · kaçırılırsa sonuç |
| 5 | **Görev – yetki – harç** | Mahkeme + yer + harç kalemleri (tutarlar UYAP'tan teyit) |
| 6 | **Dava akışı** | Dilekçeler teatisi → ön inceleme → tahkikat → bilirkişi → ıslah → karar → kanun yolu |
| 7 | **Talep kalemleri ve hesap yaklaşımı** | Kalem listesi + hesap mantığı + faiz türü ve başlangıcı |
| 8 | **Karşı tarafın klasik oyunları** | Beklenen savunma + kırılma noktası |
| 9 | **Tuzaklar** | Bir kez pahalıya mal olmuş / olabilecek ince noktalar |
| 10 | **Yapılmayacaklar** | Aykut'un bilinçli olarak KULLANMADIĞI argüman/yollar `[AVUKAT DOLDURACAK]` |
| 11 | **Müvekkil iletişimi** | Risk nasıl anlatılır, ne vaat edilmez `[AVUKAT DOLDURACAK]` |
| 12 | **Kaynak Doğrulama Tablosu** | İddia · kaynak · documentId/madde · tam alıntı · doğrulama durumu |

## Doğrulama kuralı (0-halüsinasyon)

- Künye yazılan her karar `ictihat_getir` ile TAM METİN açılmış olmalı; tırnak
  içi alıntı birebir kopya olmalı. Açılmamış karar künyesi YAZILMAZ.
- Mevzuat maddesi `mevzuat_getir` ile çekilmiş olmalı. Çekilemeyen madde
  (ör. MCP ağacında görünmeyen EK/GEÇİCİ maddeler) `[METİN DOĞRULANMADI]`
  etiketiyle işaretlenir ve kullanılmadan önce teyit istenir.
- **Tutar, oran, tarife yazılmaz** (harç, arabuluculuk ücreti, kıdem tavanı):
  bunlar yıllık değişir; playbook yalnız "nereden teyit edilir"i söyler.
- Her dosyanın başında son doğrulama tarihi bulunur. 12 aydan eski doğrulama
  taze araştırma gerektirir.

## Doldurma kuralı

Boş `[AVUKAT DOLDURACAK]` başlıkları masabaşı anketle değil, iş yapılırken
doldurulur: her aktif dosyada Director, doğal duraklarda (briefing sonrası,
hipotez onayında, kapanışta) en fazla 2-3 hedefli muhakeme sorusu sorar.

KVKK: müvekkil adı yazılmaz, dava-id kullanılır.

---

## Olay Cozum Iskeleti (bu dava turune ozgu)

> Kaynak iskelet: `ajanlar/director/olay-cozum-protokolu.md`.
> Buradaki alanlar **avukatin kendi muhakemesiyle** doldurulur; surec degil YARGI kodlanir.

### Bu dava turunde gorusme oncesi mutlaka okudugum/kontrol ettiklerim
-

### Ilk gorusmede mutlaka sordugum sorular (protokol Adim 3)
-

### Bu dava turunde muvekkilin genelde ANLATMADIGI seyler (protokol Adim 5)
-

### Bu dava turunde akla gelen hukuki careler ve tercih olcutum (protokol Adim 12)
| Care | Ne zaman tercih ederim | Ne zaman etmem |
|---|---|---|
|  |  |  |

### Bu dava turunde en cok gozden kacan sure (protokol Adim 14-15)
-

### Bu dava turunde ispati en zor vakia ve nasil ispatlarim (protokol Adim 16)
-

### Karsi tarafin bu dava turundeki klasik oyunlari (protokol Adim 17)
-

### Bu dava turunde muvekkile riski nasil anlatirim (protokol Adim 18, 20)
-

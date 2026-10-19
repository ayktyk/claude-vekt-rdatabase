# isbu-ofis Entegrasyon Planı — 2026-10-10

Avukatın isteği: "İşbu Ofis web uygulamasıyla sistemimizi entegre edelim; Yargı PRO gibi hem sen hem ben
kullanabilelim." Bu plan, `D:\projelerim\aktif projelerimm\isbu-ofis\hukuk-takip` kod tabanının salt okunur
incelemesine dayanır (2026-10-10). Henüz hiçbir kod yazılmadı; her aşama avukat onayıyla başlar.

## 1. Bugünkü durum (incelemeden)

| Konu | Durum |
|---|---|
| Ön yüz | React 18 + Vite, Vercel'de (`isbu-ofis.vercel.app`) |
| Arka uç | Express 5 + TypeScript, Render Free (`isbu-ofis-api.onrender.com`); 15 dk boşta uyur, ilk istek 20-50 sn |
| Veritabanı | Neon Postgres + Drizzle; RLS yok, sahiplik uygulama kodunda (`user_id`) |
| Giriş | Kendi JWT'si: e-posta + şifre → access (2 sa) + refresh (7 gün, her kullanımda döner); `Authorization: Bearer` kabul ediliyor |
| Veri modeli | müvekkil, dava (`case_number`, `court_name`, `case_type`, `status`, `is_cmk_assignment`), duruşma, iş ve süreli iş (`is_deadline`, `calculated_due_date`, `legal_basis`), masraf, tahsilat, taksit, not, belge, dava günlüğü, arabuluculuk, danışma |
| API | Neredeyse her şey için REST uçları var; en iyi örnek `POST /api/workspace/hearings/:id/review` (requestId ile tekrar güvenli, tek işlemde duruşma sonucu + sonraki duruşma + iş + günlük) |
| Eksikler | Servis anahtarı yok; dış kimlik / tekrar güvenliği alanı yok (aynı veri iki kez yazılabilir); "2026-016" büro kodu alanı yok; icra borçlu / mal varlığı alanı yok; ajanın yazdığı ile avukatın yazdığı ayırt edilemiyor |
| Güvenlik bulguları | `POST /api/mediation/generate-udf` kimlik doğrulamasız; repo kökünde anahtar içerikli görünen `_key_b64.txt`, `_convert_key.mjs` (izlenmiyor); Anthropic anahtarı tarayıcı localStorage'ında; belgeler Render'ın geçici diskinde (yeniden dağıtımda silinir) |

**Soru: API yazmak gerekir mi?** Kısmen. Uygulamanın REST API'si zaten var ve bir betik şifreyle giriş yapıp
kullanabilir. Ama güvenli ve tekrar edilebilir bir entegrasyon için arka uca küçük bir **entegrasyon katmanı**
eklenmeli: servis anahtarı, dış kimlik alanları, "varsa güncelle yoksa ekle" uçları ve işlem kaydı. Veritabanına
doğrudan yazmak (Neon `DATABASE_URL`) önerilmez: doğrulama, günlük kaydı, Google Takvim eşitlemesi ve
"fiziksel silme yok" kuralı atlanır.

## 2. Hedef mimari

```
UYAP ─► Yargı PRO uygulaması ─► büro araçları (uyap_takip, uyap_esitle, icra_ozet, sure_kalkani)
                                        │
                                        ▼
                         isbu_ofis.py (Python istemci, servis anahtarı)
                                        │  HTTPS, idempotent upsert
                                        ▼
               isbu-ofis API  /api/integration/*  ──► Neon (dava, duruşma, süreli iş, günlük, icra)
                                        ▲
            isbu-ofis MCP sunucusu ─────┘   (Claude, Yargı PRO araçları gibi okuma + korumalı yazma)
                                        ▲
                     Avukat ── tarayıcı / telefon (aynı veri)
```

- **Tek gerçek kaynak:** iş takibinde isbu-ofis olur. Excel bir süre ayna olarak kalır, sonra avukat kararıyla
  emekliye ayrılır (karar K1).
- **Süreler:** Süre Kalkanı hesap ve kanıt deposu olarak kalır (12-4 kuralları, geçmiş); kesin satırlar isbu-ofis'e
  süreli iş olarak yansır, koşullu satırlar "koşullu" etiketiyle ve son gün alanı boş gider (karar K2).
- **Ajan yazdığını imzalar:** her kayıtta `actor = asistan | avukat` ve kaynak (`uyap`, `kalkan`, `icra_ozet`).

## 3. Aşamalar

### Aşama 0 — Güvenlik ve hazırlık (yarım gün)
1. `generate-udf` ucuna kimlik doğrulama eklenir.
2. `_key_b64.txt` / `_convert_key.mjs` incelenir; anahtar içeriyorsa döndürülür (rotate), repo dışına alınır.
3. Neon yedeği (`server/scripts/snapshot.mjs`) alınır; proje CLAUDE.md kuralı gereği şema değişikliğinden önce.
4. Render uyku sorunu: ücretli planda sürekli açık örnek ya da istemcide 90 sn zaman aşımı + uyandırma (`/api/health`).

### Aşama 1 — Entegrasyon katmanı (isbu-ofis arka ucu, 1-2 gün)
Eklemeli (additive) şema, `ensureSchema` kalıbıyla:
- `api_keys` (kullanıcı, ad, özetlenmiş anahtar, kapsam: `read` / `write`, son kullanım, iptal tarihi).
- `cases.buro_kodu` ("2026-016"), `cases.external_ref` (ör. `uyap:avukat:<birim>|<esas>`, tekil indeks).
- `case_hearings.external_ref`, `tasks.external_ref` (Kalkan `satir_id`), `case_diary_entries.external_ref`.
- `case_enforcement` (dava başına icra özeti: alacaklı, borçlu, rolümüz, alacak, tahsilat, ödeme emri, itiraz,
  kesinleşme, son işlem, taşınmaz / araç / banka / SGK bulgusu ve kaynak evrakı, sorgu önerisi, güncelleme).
- `integration_events` (kim, ne zaman, hangi uç, hangi kayıt, önceki/sonraki özet) — denetim izi.
- Her tabloya `created_by_actor`, `updated_by_actor`.

Uçlar (`/api/integration/*`, yalnız servis anahtarıyla, kapsam denetimli, hepsi `requestId` ile tekrar güvenli):
- `PUT cases/by-ref` — dava varsa güncelle yoksa ekle (avukatın elle yazdığı alanlar boşsa doldurulur, doluysa dokunulmaz).
- `PUT hearings/by-ref`, `PUT deadlines/by-ref`, `POST diary` (UYAP olayı → dava günlüğü), `PUT enforcement/:caseId`.
- `GET changes?since=` — avukatın uygulamada yaptığı değişiklikler (sistemin geri okuması için).
- Hız: istek başına toplu (batch) gövde; genel 1500/15 dk sınırının altında kalacak şekilde.
- Testler: entegrasyon testi (yerel Postgres), tekrar güvenliği ve sahiplik testi.

### Aşama 2 — Büro tarafı istemci (bu repo, 1 gün)
- `scripts/isbu_ofis.py`: servis anahtarı `config/.env`'den; uyandırma, yeniden deneme, zaman aşımı, kuru çalışma.
- `scripts/isbu_esitle.py`: kaynaklardan eşleme
  - UYAP önbelleği → dava (`external_ref`), duruşmalar, hareket olayları → dava günlüğü (Dikkat etiketiyle).
  - Süre Kalkanı → süreli iş (`external_ref = satir_id`; koşullu satır ayrı etiket, kesin değilse son gün boş).
  - `icra_ozet` → `case_enforcement`.
  - CMK listesi → `is_cmk_assignment` (avukatın CMK kuralları korunur: CMK görünür ama ayrı süzgeçte).
  - Eşleşme tablosu → `buro_kodu`.
- `/pano` ve `excel_takip` akışına bağlanır: günde bir, UYAP okumasından sonra; önce kuru çalışma raporu.
- Testler: eşleme saf fonksiyonları (mevcut `test_uyap_takip.py` kalıbı).

### Aşama 3 — isbu-ofis MCP sunucusu: "hem sen hem ben" (1 gün)
- Küçük bir MCP sunucusu (bu repoda ya da isbu-ofis içinde), araçlar:
  - Okuma: `dava_ara`, `dava_getir`, `yaklasan_durusmalar`, `sureli_isler`, `bekleyen_tahsilatlar`, `gunluk`.
  - Korumalı yazma: `gunluge_yaz`, `is_ekle`, `durusma_sonucu_isle` (mevcut review ucu), `sureli_is_kaydet`.
- Yazma araçları varsayılan olarak "öneri" üretir; avukat onayından sonra uygulanır (karar K3). Her yazma
  `actor=asistan` ve kaynağıyla kaydedilir; uygulamada "asistan yazdı" rozeti görünür.
- Böylece Claude, Yargı PRO araçlarını kullandığı gibi isbu-ofis'i kullanır; avukat aynı veriyi tarayıcıdan görür.

### Aşama 4 — Geri yönde akış ve ince ayar (sürekli)
- Avukatın uygulamada kapattığı iş / girdiği duruşma sonucu → Süre Kalkanı arşivi ve dava özeti (`GET changes`).
- Yedi aşamalı akış bitince (dilekçe v2 YEŞİL) dava günlüğüne otomatik kayıt ve "sıradaki iş" oluşturma.
- `docs/proje-son-durum.html` ve AGENTS.md "Takip araçları" güncellenir.

## 4. Kurallar (değişmez)
- Avukatın elle yazdığı dolu alan değiştirilmez; fiziksel silme yok (isbu-ofis CLAUDE.md kuralı).
- Şema değişikliğinden önce yedek; üretimde `db:push` / seed yok.
- Servis anahtarı yalnız `config/.env`'de; hiçbir çıktıya ve repoya yazılmaz.
- İlk her toplu yazma kuru çalışma raporuyla avukata gösterilir; tekrar güvenliği (`requestId`, `external_ref`) olmadan yazılmaz.
- UYAP yavaş eşitleme kuralları aynen geçerli; isbu-ofis eşitlemesi UYAP'a ek yük bindirmez (önbellekten beslenir).

## 5. Avukatın kararları (2026-10-10)

- **K1:** isbu-ofis ana yer (telefondan dava, arabuluculuk ve CMK takibi). Excel şimdilik ayna olarak sürer (tek sayfada görme).
- **K2:** Süreler isbu-ofis'e girer; avukat elle düzenleyebilir. Avukatın düzenlediği süreye eşitleme dokunmaz, yalnız öneri üretir.
- **K3:** Asistanın her yazması avukatın denetiminden geçer: önce "öneri", onaydan sonra uygulama.
- **K4:** Render ücretsiz plan; mevcut uyandırma (cron-job.org birincil, GitHub Actions yedek) + istemcide uzun zaman aşımı.
- **K5 (asistan kararı):** isbu-ofis değişiklikleri `feat/entegrasyon` dalında, ayrı çalışma kopyasında (avukatın main üzerindeki
  kaydedilmemiş çalışmasına dokunulmaz). Testler geçip avukat onaylayınca: yedek → main'e birleştirme → canlı.

## 6. Kararlardan doğan tasarım eklemeleri

### 6.1 Öneri kuyruğu (K3)
- Tablo `assistant_proposals`: tür (dava, duruşma, süre, günlük, icra özeti, iş, sıradaki adım, durum), hedef kayıt,
  `external_ref`, önerilen değer ve önce/sonra farkı, kaynak (uyap, kalkan, icra_ozet, asistan), kısa gerekçe,
  durum (bekliyor / onaylandı / reddedildi / uygulandı / geçersiz), `request_id` (tekrar güvenliği).
- Entegrasyon uçları doğrudan yazmaz, öneri üretir. Aynı `external_ref` için bekleyen öneri varsa güncellenir (yığılma olmaz).
- Uygulamada mobil öncelikli "Asistan Önerileri" sayfası: tek tek ya da türe göre toplu onay / ret; onay kaydı tek
  işlemde uygular ve `actor=asistan` olarak işler; ret gerekçesi asistana geri döner.
- Avukatın elle değiştirdiği kayıt (`updated_by_actor=avukat`) için asistan üzerine yazmaz, "fark var" uyarısı üretir.

### 6.2 Dosya nabzı ve "bu dosyada ne yapılmalı"
- Her dava ve arabuluculuk dosyası için hesaplanan görünüm: son hareket (günlük, duruşma, iş, UYAP olayı), sıradaki planlı
  iş (duruşma, süre, iş, bekleme nedeni ve kontrol tarihi), açık tahsilat ve vadesi geçmiş taksit, kapanmaya hazır işareti.
- Uyarılar: **atıl** (sıradaki iş yok ve 30 günden uzun süredir hareket yok), **sıradaki iş yok**, **tahsilat bekliyor**,
  **kapanmaya hazır** (karar kesinleşti, tahsilat tamam), **süre yaklaşıyor**.
- Uygulamada "Dosya Nabzı" sayfası ve panoda özet kart; telefondan bir dokunuşla dosyaya ve sıradaki işe gidilir.
- Asistan her gün atıl ve sıradaki işi olmayan dosyalar için "sıradaki adım" önerisi üretir (öneri kuyruğuna).

### 6.3 Uygulama sırası
1. Aşama 0: güvenlik düzeltmeleri; canlıya çıkmadan hemen önce `pg_dump` yedeği (proje kuralı).
2. Aşama 1: şema (yalnız ekleme) + servis anahtarı + öneri kuyruğu + entegrasyon uçları + testler (yerel Postgres).
3. Aşama 1b: Asistan Önerileri ve Dosya Nabzı sayfaları (mobil öncelikli).
4. Aşama 2: büro tarafı istemci ve günlük eşitleme (kuru çalışma raporuyla).
5. Aşama 3: isbu-ofis MCP sunucusu (okuma + yalnız öneri yazan araçlar).
6. Aşama 4: geri akış, AGENTS.md ve proje son durum HTML'i.

# DavaTek Keşif Notu

**Durum:** KURULUM BEKLENİYOR — avukat uygulamayı deneyecek, sonra bu form doldurulacak.
**Spec:** `docs/superpowers/specs/2026-09-02-tek-motor-agnostik-toparlama-design.md` §3.5
**Öncelik:** En düşük. Entegrasyon kodu bu fazda yazılmaz; ileride ayrı spec.

## Bilinenler (2026-09-02 araştırması)

- Türkiye Barolar Birliği'nin resmî masaüstü uygulaması; Windows (v26.9.x) ve macOS;
  şimdilik ücretsiz (TBB ileride ücretlendirme hakkını saklı tutuyor)
- UYAP Avukat Portal'dan dava dosyalarını **yerel diske** indirir; mahkeme türü, yer
  ve tarih aralığına göre filtreler
- **Fark takibi:** yerel kayıt ile Portal'ı karşılaştırıp yeni gelişme/evrakı bulur;
  toplu işlem ve Excel export
- **Toplu icra sorgusu:** MERNİS / SGK / GİB / banka; sorgu geçmişi saklanır;
  duruşmalar 30 güne kadar toplu sorgulanabilir
- Erişim: UYAP kimliği + SMS + e-imza
- **Public API yok**; veri yalnızca yerel cihazda
- Otomatik yenileme yok (elle güncelleme); OCR katmanı olmayan taranmış evrakta
  metin araması çalışmaz; eşzamanlı çok cihaz kullanımı UYAP kısıtı nedeniyle yok

Kaynaklar: davatek.com.tr (sayfa içeriği kısıtlı), avukatmertcelik.com "DavaTek nedir"
makalesi (2026).

## Mevcut hattımızla karşılaştırma

| | `dava-cli` (Yargı PRO) — bugün | DavaTek — aday |
|---|---|---|
| Sahibi | Yargı PRO (üçüncü taraf) | TBB (resmî) |
| İndirme | `npx dava-cli@latest clone` → `Documents/YargiPRO/Hukuk/{mahkeme}/{dosya}/{evraklar,cikti}` | Masaüstü GUI → ? |
| Delta güncelleme | `sync` (tarayıcısız) | Fark takibi (elle tetik) |
| Manifest | `INDEX.md` üretiyor | ? |
| Toplu icra sorgu | Yok | Var (MERNİS/SGK/GİB/banka) |
| API / CLI | CLI var | Yok — yalnız dosya sistemi |

DavaTek'in bize katacağı iki şey `dava-cli`'da yok: **fark takibi** (dosya takip
sistemi için tetikleyici) ve **toplu icra sorgusu** (icra dosyalarında malvarlığı).

## Doldurulacak (kurulumdan sonra — avukat)

| Soru | Cevap |
|---|---|
| Veri klasörünün mutlak yolu (Windows) | |
| Dava klasörü adlandırma şeması (mahkeme/esas no?) | |
| Evrak dosyası adlandırma şeması | |
| Evrak formatları (.udf / .pdf / .tiff oranı) | |
| Bir INDEX / manifest dosyası üretiyor mu | |
| Fark raporu Excel sütunları | |
| Fark raporu nereye kaydediliyor | |
| Yerel veritabanı var mı (SQLite vb.), yolu | |
| Toplu sorgu çıktısının formatı | |
| Aynı dosya hem dava-cli hem DavaTek ile çekilirse çakışma var mı | |

## Sonraki adım (ayrı spec)

Tablo dolduğunda:
- `scripts/evrak_kaynagi.py` — kaynak adaptörü (`dava-cli` | `davatek`), tek arayüz:
  `evrak_listesi(dava_id) -> [{yol, tur, tarih}]`
- Fark takibi → Takvim MCP köprüsü: yeni evrak / duruşma / tebligat → süre kaydı +
  otonom döngüye sinyal ("dosya takip sistemi" — avukatın 2026-09-02 hedefi)
- Toplu sorgu çıktısı → icra dosyalarında haciz önceliklendirme notu (opsiyonel)

Bağlantı: `AGENTS.md` → ASAMA 1 "Evrak kaynağı adaptörü";
`ajanlar/director/olay-cozum-protokolu.md` → Adım 23.

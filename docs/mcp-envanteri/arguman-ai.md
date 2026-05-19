# Arguman.ai Tool Envanteri

**Server:** `https://mcp.arguman.ai/mcp`
**Transport:** HTTP
**Auth:** OAuth 2.0 standart MCP flow — tamamlandı ✓
**Authorization server:** `https://mcp.arguman.ai`, scope: `mcp`
**Kuruluş tarihi:** 2026-05-19
**Platform:** Arguman.ai — **11M+ Türk + uluslararası mahkeme kararı**

---

## Bağlantı Durumu

- [x] `claude mcp add arguman --transport http https://mcp.arguman.ai/mcp` çalıştırıldı
- [x] OAuth onayı tamamlandı
- [x] `claude mcp list` → **✓ Connected**
- [x] 5 tool şeması yüklendi (ToolSearch)
- [x] Pilot sorgu başarılı (aşağıda)

---

## Koleksiyonlar (8 koleksiyon)

MCP server `instructions` alanından alındı:

| Koleksiyon | İçerik | Boyut |
|---|---|---|
| `ceza` | Yargıtay Ceza Daireleri | 4.2M karar |
| `hukuk` | Yargıtay Hukuk Daireleri | 5.1M karar |
| `idare` | Danıştay | 379K karar |
| `anayasa` | AYM (norm denetimi + bireysel başvuru) | 22K karar |
| `aihm` | ECHR (47 üye devlet) | 21K karar |
| `uyusmazlik` | Uyuşmazlık Mahkemesi | 14K karar |
| `bgh_straf` | Alman BGH Ceza Daireleri | (toplam) |
| `bgh_zivil` | Alman BGH Hukuk Daireleri | 195K karar (2 BGH koleksiyon toplamı) |

**Avukatın işine yarayanlar:** ceza, hukuk, idare, anayasa, aihm, uyusmazlik. BGH (Alman) — özel ihtiyaç durumunda karşılaştırmalı hukuk için.

---

## Tool Listesi (5 tool — Discovery tamamlandı)

| # | Tool Adı | Görev | Önemli Parametreler | Dönüş Özeti |
|---|---|---|---|---|
| 1 | `search` ⭐ | **BİRİNCİL TERCİH** — kavram/konu/doktrin semantik+keyword hibrit arama (Cohere multilingual + BM25 + RRF + opsiyonel neural rerank) | `query` (TR/DE/EN, 2-2000 char), `collection` (8 enum), `top_k` (1-50, default 20), `expand` (true → AI query expansion + neural rerank, kavramsal/kısa sorgular için), `daire`, `daireler[]`, `yil_min`, `yil_max` | `{ hits[]: {score, snippet, provenance: {point_id, collection, court, daire, esas_no, karar_no, tarih, ecli, source_url}}, total_candidates, expanded_terms, credits_used }` |
| 2 | `case_lookup` | **Nokta atışı** — bilinen künye ile karar bul (Postgres tier'lı, ~40ms) | `esas_no`, `karar_no`, `daire`, `court` (yargitay/danistay/aym/aihm/uyusmazlik/bgh), `ecli`, `dava_adi` (sadece AİHM/AYM resmi taraf adı — kavram DEĞİL), `limit` | Decision array. **DİKKAT:** Kavram/konu için kullanılmaz, `search()` kullan |
| 3 | `find_similar` | Verilen karara dense vektör benzeri kararlar | `point_id`, `collection`, `top_k` (1-30, default 10) | Similar decision list |
| 4 | `get_full_text` | Karar tam metni (25K token sayfalara bölünmüş) | `point_id`, `collection`, `page` (default 1 = ilk 100K char ≈ 25K token) | Tam metin Markdown |
| 5 | `infaz_hesaplama` | **Türk ceza hukuku infaz süresi hesaplama** (5275/7242/7550 sk dahil) | `case_description` (serbest metin — suç türü, tarih, ceza, profil) | Markdown rapor (vaka özeti + mevzuat + adım adım + sonuç tablosu). **1 kredi (LLM hesaplama)** |

---

## Pilot Sorgu Sonucu

```
Test: search(query="kira tespit davası hakkaniyet", collection="hukuk", top_k=3, expand=false)
Sonuç: 4 total_candidates, 3 hit:
  1. Yargıtay 6. HD 2013/11710 E. 2014/905 K. (27.01.2014) — score 0.5, point_id 310573800
  2. Yargıtay 6. HD 2014/8291 E. 2014/9859 K. (16.09.2014) — score 0.5, point_id 97199900
  3. Yargıtay 6. HD 2014/5981 E. 2014/7184 K. (02.06.2014) — score 0.33, point_id 97288300
Credits used: 1
Durum: ✓ Çalışıyor. Provenance objesi temiz (point_id + court + daire + esas + karar + tarih + via).
        snippet ~500 char (içerikten direkt alıntı).
```

---

## Çapraz Kullanım: Arguman → Yargı-MCP-Pro

Arguman.ai döndürür: `point_id`, `collection`, `court`, `esas_no`, `karar_no`, `tarih`
Yargı-MCP-Pro `get_bedesten_document_markdown` ister: `documentId`

**Köprü:** Arguman provenance'ta `source_url` ve `ecli` var (testte null geldi — Yargıtay kararları için boş, AİHM/BGH için dolu). documentId köprüsü için 2 yol:
1. **Arguman point_id ile fetch:** `get_full_text(point_id=310573800, collection="hukuk")` — Arguman kendi tam metni döner
2. **Yargı-MCP-Pro arama:** Arguman'dan gelen esas_no + karar_no + daire'yi `search_bedesten_unified`'a verip documentId al, sonra `get_bedesten_document_markdown`

**Karar:** Faz 4 (Denetim mekaniği)'nde bu köprü kuralı netleşir. Default: Arguman tam metnini doğrudan oku (1 hop yerine 2 hop), eğer Bedesten doğrulaması gerekirse Yargı-MCP-Pro üzerinden git.

---

## Arama Stratejisi (instructions'tan)

**Vektör recall drift uyarısı (önemli — instructions'tan):**
1. Query'de exact terim/madde no/4+ keyword varsa → `expand=false`
2. Vague/lay wording varsa → `expand=true` (Cohere rerank + AI expansion)
3. Top sonuçlarda intent drift varsa (daire uymuyor / madde sapmış / snippet ana sorudan uzak) → "kavga edip vurdum" → "haksız tahrik" gibi doktrinal Türkçeye çevir, expand=false ile yeniden çalıştır
4. **Asla semantik benzerlikten cevap yazma** — `get_full_text` ile gövde doğrulanmadan atif YAPMA
5. Date-sensitivity: Post-reform doktrin / daire restructuring / yeni mevzuat ise `yil_min=<son 3-5 yıl>` paralel sorgu

Bu kurallar `ajanlar/arastirmaci/SKILL.md` Faz D'ye direkt aktarılacak (Faz 3'te).

---

## KVKK Notu

Arguman.ai semantik query'leri **maskelenmiş token'larla** gönderilir:
- Müvekkil ismi / TC YOK
- Olay maskelenir: "Ahmet 4 yıl çalıştı istifa etti" → "İşçi haklı fesih iddiası ile kıdem tazminatı talep ediyor"
- Detay: `MASKELEME-KILAVUZU.md`

Karar metinlerindeki kişi adları kamuya açık karardan geldiği için aynen kalır (sorun değil).

---

## Faz 3'e Etkisi

Arguman.ai 2A Süper Stajyer **sonrası** çağrılır:
- 2A Stajyer yörünge belirler + ilk karar listesi (Sözcü)
- Arguman.ai **semantik genişletme** yapar (11M+ pool, 8 koleksiyon)
- Bulgular **Yargı-MCP-Pro doğrulama köprüsünden** geçer (her künye için documentId fetch + tam metin eşleştirme)
- Yeni çıktı: `02-Arastirma/2A-arguman-bulgulari.md`

**YENİ komut:** `arastir-arguman.md` (Faz 3'te oluşturulacak)
**Mevcut komuta entegrasyon:** `arastir-stajyer.md`'ye opsiyonel adım

---

## Ücret / Limit (Tanıtım sayfasından doğrulandı — 2026-05-19)

- **Kredi modeli:**
  - `search` (Hybrid case-law search) = **1 kredi**
  - `case_lookup` (Look up case by docket) = **ÜCRETSİZ**
  - `get_full_text` (Get case full text) = **ÜCRETSİZ**
  - `find_similar` (Find similar cases) = **ÜCRETSİZ**
  - `infaz_hesaplama` (Sentence-enforcement calculator) = **1 kredi**
- `top_k` arttırmak EK kredi yaratmaz (Cohere zaten 200 aday değerlendiriyor)
- `expand=true` AYNI 1 kredi (expand=false ile aynı)
- **Aylık limit:** [doldur — avukat hesap detayını söyleyecek]
- Token süresi (OAuth refresh): [varsayılan OAuth flow]

## Server-Side Skill'ler (Tanıtım sayfasından öğrenildi — 2026-05-19)

Arguman.ai MCP **server tarafında 3 hazır araştırma skill'i** çalıştırır.
Manuel tetikleme gerekmez — Claude soruya uygun olanı kendiliğinden uygular.
Tool şeridinde görünmez, ama `search` çağrılarında sonuçları zenginleştirir.

| Skill | Görev | Tetikleyici örnek sorgu |
|---|---|---|
| **caselaw-search** | Koleksiyon seçimi + halk dilini doktrine çevirme ("kavga edip vurdum" → "haksız tahrik") + drift detection | "Yargıtay 1. CD haksız tahrik indirimi içtihadı" |
| **citation-network** | Bir karardan başlayıp atıf ağını izleme. **HGK/CGK bağlayıcılık etiketi** verir | "Bu kararın atıf yaptığı + bu karara atıf yapan kararları izle" |
| **karsi-arguman** | Hukuki tezin karşı içtihatlarını bul + **5 seviyeli tehdit sınıflandırması** | "Bu pozisyonun zayıf yönleri ne, hangi karşı içtihatlar var?" |

**Sistemimize entegrasyon:**
- `caselaw-search` → Faz D ana akışına dahil (zaten doktrinal Türkçe terim kullanmamız bu skill ile uyumlu)
- `citation-network` → 2B Yargı sıralı zinciri için ek değer; Pro MCP `documentId` köprüsünden sonra atıf ağı izlenebilir
- `karsi-arguman` → **ASAMA 6 Savunma Simulatoru için altın değer** — 5 ajan stratejik analizde 4B Davalı Avukat ve 4D Hakim perspektiflerini güçlendirir

## Arayüz → MCP Eşlemesi (Avukatın 3 arayüz aracı)

| Avukatın eski arayüz aracı | MCP'de karşılığı |
|---|---|
| **İçtihat raporu** | `search` + `get_full_text` + arka planda `caselaw-search` skill'i |
| **Doktrin analizi** | `search` + `find_similar` + arka planda `citation-network` skill'i |
| **Belge analizi** | ❌ **MCP'de yok.** Alternatif: Yargı-MCP-Pro `get_bedesten_document_markdown` ile karar metnini çekip terminal Claude / Antigravity'ye analizletmek |

---

## İzleme Notları

- Pilot sorguda `score 0.5` üst sınır gibi göründü (top 2 hit aynı skoru aldı) — neural rerank yapılmadıysa raw RRF sergileniyor olabilir
- `total_candidates: 4` ama 3 sonuç döndü → 4. sonuç score altında filtrelendi muhtemelen
- AİHM kararları için ECLI dolu, Yargıtay için null → ECLI tabanlı çapraz referans sadece AİHM/BGH için işe yarar

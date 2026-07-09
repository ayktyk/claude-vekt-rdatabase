<!-- DOKTRIN-PREAMBLE v1 -->
> **0-HALÜSİNASYON + ANTI-SYCOPHANCY (zorunlu — tam metin: `prompts/_doktrin-preamble.md`):**
> - UYDURMA YARGITAY/HGK/İBK kararı atfı YASAK — her künye Bedesten documentId ile doğrulanır; doğrulanmayan "DOĞRULANMAMIŞ" damgalanır.
> - Karar metni ALINTISI UYDURULAMAZ — tırnak içi alıntı birebir kaynaktan.
> - BAĞLAM KORUNMALI — bir fıkranın cevabı başka fıkraya genellenemez.
> - Avukatı memnun etmek için LEHE YORUM YASAK; ALEYHE İÇTİHAT açıkça gösterilir, gizlenmez.
> - "KAYNAK YOK" demek dürüstlüktür — sayı doldurmak için uydurma atıf HARD FAIL.
> - Kritik kuralda ÇİFT KAYNAK şart.
> - Çıktının sonunda KAYNAK DOĞRULAMA tablosu (| İddia | Kaynak | documentId | Tam Alıntı | Doğrulama |) + "Aleyhe içtihat: VAR/YOK/ARANMADI" beyanı ZORUNLU.

# /arastir-arguman — Arguman.ai Semantik Genişletme (FIVEAGENTS ASAMA 2 — Faz D)

`$ARGUMENTS` kritik noktası için Arguman.ai'nin 11M+ karar havuzunda
semantik+keyword hibrit arama yapar. **2A Süper Stajyer sonrası** çağrılır;
çıktısı Yargı-MCP-Pro doğrulama köprüsünden geçer.

**FAZ 3 (2026-05-19):** Yeni komut. Arguman.ai MCP (`mcp__arguman__*`)
2A → 2B → 2C zincirine **yeni bir kol** olarak eklendi.

## Konum ve Sıra

```
ASAMA 2 — Araştırma:
├ 2A Süper Stajyer (yörünge belirleyici)
├ Faz D — Arguman.ai (semantik genişletme — YENİ)  ←── BU KOMUT
├ 2D NotebookLM (paralel — değişmedi)
└ 2B Yargı-MCP-Pro → 2C Mevzuat (sıralı zincir — değişmedi)
```

Faz D 2A'dan SONRA, 2B'den ÖNCE çalışır. 2B Yargı doğrulama köprüsü için
bulguları kullanır.

## Aktif Tool'lar (Arguman.ai)

- `mcp__arguman__search` ⭐ — **birincil tercih** — kavram/doktrin/içtihat semantik arama
- `mcp__arguman__case_lookup` — bilinen künye nokta-atışı (esas/karar/ECLI)
- `mcp__arguman__find_similar` — referans karara vektör benzeri
- `mcp__arguman__get_full_text` — 25K token sayfalanmış tam metin
- `mcp__arguman__infaz_hesaplama` — ceza hukuku infaz hesaplama (5275/7242/7550 sk)

## Koleksiyonlar (8 koleksiyon)

| Koleksiyon | Mahkeme | Boyut |
|---|---|---|
| `ceza` | Yargıtay Ceza Daireleri | 4.2M |
| `hukuk` | Yargıtay Hukuk Daireleri | 5.1M |
| `idare` | Danıştay | 379K |
| `anayasa` | AYM (norm + bireysel) | 22K |
| `aihm` | ECHR (47 üye devlet) | 21K |
| `uyusmazlik` | Uyuşmazlık Mahkemesi | 14K |
| `bgh_straf` | Alman BGH Ceza | (toplam) |
| `bgh_zivil` | Alman BGH Hukuk | 195K toplam |

**Avukatın işine yarayan koleksiyon seçimi:**
- İş hukuku / kira / aile / tazminat → `hukuk`
- Suç davası → `ceza`
- Vergi / belediye / kamu → `idare`
- KHK / temel hak ihlali → `anayasa`
- Karşılaştırmalı / AİHS m.6 vb. → `aihm`
- Görev uyuşmazlığı → `uyusmazlik`

## Zorunlu Referans Dokümanlar

- `docs/mcp-envanteri/arguman-ai.md` — tool envanteri, koleksiyonlar, arama stratejisi
- `ajanlar/arastirmaci/SKILL.md` → Faz D protokolü (Arguman.ai Semantik Genişletme)

## Ön-koşullar

1. KVKK Seviye 2 maskeli sorgu hazırlanır (müvekkil adı/TC asla gönderilmez)
2. 2A varsa: yörünge talimatlarındaki kavramlar `search` query'sine girdi olur
3. Olay doktrinal Türkçe terime çevrilir:
   - "kavga edip vurdum" → "haksız tahrik"
   - "borçlu mal kaçırıyor" → "tasarrufun iptali davası"
   - "boşandım yeniden evlenemiyorum" → "iddet süresi"

## Zorunlu Adımlar

### Adım 1 — Koleksiyon Seçimi
Dava türüne göre 1-2 koleksiyon seç (yukarıdaki tabloya bak).

### Adım 2 — İlk Arama (semantik, expand=true)
```python
mcp__arguman__search(
  query="<doktrinal terim>",
  collection="hukuk",  # uygun koleksiyon
  top_k=10,
  expand=True  # AI query expansion + neural rerank — kavramsal sorgular için
)
```

### Adım 3 — Drift Denetimi (Zorunlu — instructions'tan)
Top sonuçlarda intent drift var mı?
- Daire/court alanı sorulan davaya uyuyor mu?
- Snippet sorulan konuyu içeriyor mu (sadece benzer terim değil)?
- Tarih sonuçların güncelliği uygun mu?

**Drift varsa:** sorguyu doktrinal Türkçeye yeniden çevir, `expand=False` ile tekrar.

### Adım 4 — Daraltma (Filter)
```python
mcp__arguman__search(
  query="<terim>",
  collection="hukuk",
  daire="3. Hukuk Dairesi",  # spesifik daire
  yil_min=2022,               # son 3 yıl
  top_k=15,
  expand=False
)
```

### Adım 5 — Tam Metin Doğrulama (min 3 karar)
Top 3-5 hit için:
```python
mcp__arguman__get_full_text(
  point_id=<hit.provenance.point_id>,
  collection=<hit.provenance.collection>,
  page=1
)
```
**Asla snippet'tan atif yazma** — tam metnin gövdesi sorulan meseleyi içeriyor mu doğrula.

### Adım 6 — Benzer Karar Genişletmesi (opsiyonel)
En güçlü 1-2 hit için:
```python
mcp__arguman__find_similar(
  point_id=<hit.provenance.point_id>,
  collection=<hit.provenance.collection>,
  top_k=10
)
```

### Adım 7 — Yargı-MCP-Pro Doğrulama Köprüsü
Her Arguman bulgusu için: esas_no + karar_no + daire'yi Yargı-MCP-Pro'ya verip
**documentId** çıkar.
```python
# Arguman'dan: esas_no="2014/8291", karar_no="2014/9859", daire="6. Hukuk Dairesi"
mcp__yargi-mcp-pro__search_bedesten_unified(
  esas_no="2014/8291",
  karar_no="2014/9859",
  birimAdi="H6",  # 6. Hukuk Dairesi
  court_types=["YARGITAYKARARI"]
)
# Dönen documentId ile:
mcp__yargi-mcp-pro__get_bedesten_document_markdown(documentId=<id>)
```

Doğrulama sonucu:
- **DOĞRULANMIŞ** → karar Pro MCP'den de geliyor, tam metin eşleşiyor → rapora alınır
- **DOĞRULANMAMIŞ** → Pro MCP'de bulunamadı veya metin uyumsuz → flag ile alınır (kaynak: sadece Arguman)
- **HARD FAIL** → Arguman tam metni karar konusuyla ilgisiz → ELENİR

## Çıktı Dosyası

`02-Arastirma/2A-arguman-bulgulari.md` — Frontmatter:
```yaml
---
engine: claude
mcp: arguman + yargi-mcp-pro
status: TASLAK
run_id: {YYYYMMDD-HHMMSS-dava-id}
arguman_credits_used: N
total_candidates_found: M
verified_count: V
unverified_count: U
hard_fail_count: H
---
```

İçerik:
- Kullanılan koleksiyon(lar) + sorgu listesi
- Bulunan hit'ler (her biri için: künye, snippet, score, provenance)
- Tam metni okunan kararlar (min 3)
- **DOĞRULANMIŞ kararlar tablosu** (Pro MCP documentId ile)
- **DOĞRULANMAMIŞ kararlar tablosu** (sadece Arguman'dan, risk flag'li)
- Yargı-MCP-Pro köprüsünden geçen sonuçlar → 2B'ye girdi olarak hazırlanır

## Kalite Kapısı

- [ ] En az 1 doktrinal Türkçe terim ile arama yapıldı mı?
- [ ] Drift denetimi yapıldı mı?
- [ ] Min 3 karar tam metni okundu mu (`get_full_text`)?
- [ ] Her bulgu için Pro MCP doğrulama köprüsü denendi mi?
- [ ] **DOĞRULANMIŞ** / **DOĞRULANMAMIŞ** / **HARD FAIL** flag'leri ayrıştırıldı mı?
- [ ] KVKK Seviye 2 maskeleme uygulandı mı (müvekkil adı asla query'de yok)?
- [ ] `arguman_credits_used` frontmatter'a yazıldı mı?
- [ ] Engine frontmatter `engine: claude`, `mcp: arguman + yargi-mcp-pro` mi?

Eksik varsa: Faz D yarım, sadece eksik adımı tekrar çalıştır.

## Maliyet Notu (Tanıtım sayfasından doğrulandı — 2026-05-19)

- `search` (Hybrid case-law search) = **1 kredi**
- `case_lookup` (Look up case by docket) = **ÜCRETSİZ**
- `get_full_text` (Get case full text) = **ÜCRETSİZ**
- `find_similar` (Find similar cases) = **ÜCRETSİZ**
- `infaz_hesaplama` (Sentence-enforcement calculator) = **1 kredi**
- `top_k` arttırmak ek kredi getirmez (Cohere zaten 200 aday değerlendiriyor)
- `expand=True` aynı 1 kredi
- **Faz D bir tipik araştırmada 3-5 search = ~3-5 kredi.** Tam metin, künye lookup, benzer karar çağrıları ücretsiz olduğu için pahalı değildir.

## Server-Side Skill'ler (Otomatik Tetiklenir)

Arguman.ai sunucu tarafında 3 hazır araştırma skill'i çalıştırır. Manuel
tetikleme gerekmez — Claude soruya uygun olanı kendiliğinden uygular. Bu
skill'ler tool şeridinde görünmez; `search` çağrılarında sonuçları arka
planda zenginleştirirler.

### `caselaw-search` (içtihat araması)
- Koleksiyon seçimi otomatik
- Halk dilini doktrine çevirir: "kavga edip vurdum" → "haksız tahrik"
- Drift detection (sonuçların konu sapmasını yakalar)
- **Tetik:** Doktrin sorusu (Faz D ana akış zaten bu skill ile uyumlu)

### `citation-network` (atıf ağı)
- Bir karardan başlayıp atıf yapan + atıf alan kararları izler
- **HGK/CGK bağlayıcılık etiketi** verir (Yargıtay genel kurul kararları bağlayıcı)
- **Tetik:** "Bu karardan atıf ağını izle" / "Bu karara atıf yapan kararlar"
- **Sistemimize değer:** 2B Yargı sıralı zincirinde Pro MCP documentId köprüsünden sonra atıf ağı izleme — emsal bağlayıcılık etiketi ile derinleşme

### `karsi-arguman` (karşı-argüman)
- Hukuki tezin karşı içtihatlarını bulur
- **5 seviyeli tehdit sınıflandırması** yapar (pozisyonun zayıf yönlerini görme)
- **Tetik:** "Bu tezin karşı içtihatları" / "Hangi kararlar bu pozisyona ters?"
- **Sistemimize değer:** ASAMA 6 Savunma Simulatoru'nun altın kaynağı — ASAMA 4'te 4B Davalı Avukat ve 4D Hakim perspektifleri için zorunlu sorgu olabilir

### Server-Side Skill'leri Kullanma Stratejisi

Avukatın spesifik isteğine göre Faz D'de farklı tetikleyiciler:

| Avukat isteği | Sorgu tipi | Beklenen skill |
|---|---|---|
| "Bu konuda Yargıtay ne diyor?" | Geniş doktrin araması | `caselaw-search` |
| "Bu karardan atıf zinciri çıkar" | Künye + atıf ağı | `citation-network` |
| "Bu tezin zayıf yönleri ne?" | Karşı içtihat | `karsi-arguman` (Savunma Simulatoru entegrasyonu) |
| "Bu kararın benzerleri" | find_similar (vektör) | (skill yok — `find_similar` tool'u kullanılır) |

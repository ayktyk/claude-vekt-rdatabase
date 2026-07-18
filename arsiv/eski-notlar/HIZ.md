# HIZ.md — Sistem Sorun Tespiti ve Çözüm Önerileri

> **⚠ TARIHSEL — 2026-05-13'TE GUNCELLENDI ⚠**
>
> Bu döküman 2026-05-04'te Gemini bridge mimarisi temelinde yazıldı.
> 2026-05-13 itibariyla sistem **Antigravity hibrit mimarisine** geçti:
> `scripts/gemini-bridge.sh` DEPRECATED (exit 100). Bridge ile ilgili
> tüm öneriler artık geçersiz.
>
> **Güncel mimari için:** `ANTIGRAVITY.md`, `CLAUDE.md` → "Antigravity
> Hibrit Mimarisi (2026-05-13)" bölümü, `FIVEAGENTS.md` → motor tablosu.
>
> Bu dosya tarihsel referans olarak korunuyor (geçmişte yaşanan
> problemleri ve fikirleri görmek için faydalı).

**Tarih:** 2026-05-04
**Hazırlayan:** Hızır (sistem öz-analizi)
**Talep:** Avukat Aykut, ultrathink + plan mode

---

## A. Bulgu Özeti (TL;DR)

Avukatın iki ana şikayeti **doğrulandı** ve sistemde başka kritik sorunlar da var.

| # | Sorun | Kanıt | Etki |
|---|-------|-------|------|
| 1 | **Model routing sadece kağıt üstünde** | `logs/model-events.jsonl` son Gemini event'i 2026-04-20. Yani 14 gündür sistem fiilen %100 Claude'da çalışıyor. | Avukatın istediği hibrit model (Claude=koordinasyon, Gemini=hukuki nitelendirme) hiç devrede değil. |
| 2 | **ASAMA 2 darboğazı: NotebookLM 18 dk** | `benchmark-timer-sakarya.log` ASAMA_2D_NOTEBOOKLM = 1088 saniye (18:08). Toplam ASAMA 2+3 = 33 dakika. | "2-3 saat" şikayetinin somut sebebi. AI saniyede yapması gereken işi 18 dakika yapıyor. |
| 3 | **3 sn rate-limit varsayımı test edilmemiş** | `ajanlar/arastirmaci/SKILL.md:128` 15 sorgu × 3 sn = 45 sn zorunlu bekleme. Bedesten API'nin gerçek rate limit'i bilinmiyor. | Defansif aşırı-koruma. Gerçek limit muhtemelen daha gevşek. |
| 4 | **Doktriner çelişkiler** | 4 farklı dosya 3 farklı motor söylüyor (CLAUDE.md=Opus 4.7, Director SKILL=Opus 4.6, model-routing.json=Gemini-only). | Sistem ne yapacağını bilmiyor, default davranışa düşüyor (Claude). |
| 5 | **Kullanıcı-kontrol komutları yok** | CLAUDE.md "7 ASAMA kullanıcı-kontrollü" diyor, `/devam`, `/atla`, `/dur`, `/motor-degistir` slash command'leri **yok**. | Workflow durdurulamıyor, motor değiştirilemiyor — avukatın elinde kontrol yok. |

---

## B. Sorun 1: Model Routing — Doktrini Var Mekanizması Yok

### Mevcut Durum

`config/model-routing.json` (2026-05-02 güncellemesi):
```json
{
  "default_mode": "auto",
  "default_engine": "gemini",
  "tasks": {
    "kritik_nokta_tespiti": { "default_model": "gemini-3.1-pro-preview" },
    "usul_raporu":          { "default_model": "gemini-3.1-pro-preview" },
    "arastirma_sentezi":    { "default_model": "gemini-3.1-pro-preview" },
    "dilekce_yazimi":       { "default_model": "gemini-3.1-pro-preview" },
    "savunma_simulasyonu":  { "default_model": "gemini-3.1-pro-preview" },
    "revizyon":             { "default_model": "gemini-3.1-pro-preview" },
    "self_review":          { "default_model": "gemini-3.1-pro-preview" },
    "mcp_arac_yonetimi":    { "default_model": "gemini-3.1-pro-preview" }
  }
}
```

Yorum satırı: *"Sistem %100 Gemini uzerinden calisacak sekilde guncellenmistir. Claude devreden cikarilmistir"*

### Gerçek

`logs/model-events.jsonl` son durum:
- Toplam 6 event
- Son Gemini olayı: **2026-04-20T17:23:23Z**
- **14 gündür sıfır Gemini çağrısı**
- Bu süre boyunca dava açılmış, dilekçe yazılmış, araştırma yapılmış — hepsi Claude'da

### Kök Sebep

`scripts/gemini-bridge.sh` çalışan, profillenmiş, fallback'li bir wrapper — ama **manuel Bash invokasyonu gerektiriyor**. Hiçbir agent SKILL.md'sinde "şu Bash komutunu çalıştır" yönergesi yok. Claude Code da config'i okuyup kendiliğinden Gemini'ye yönlendirmiyor — çünkü öyle bir mekanizması yok.

Yani: **JSON config sessiz**. Sistem onu fiilen umursamıyor.

### Çelişkili 4 Kaynak

| Kaynak | Söylediği |
|--------|-----------|
| `~/.claude/CLAUDE.md` | "Sen Avukat Aykut'un hukuk başasistanısın" — motor belirtmiyor |
| Proje `CLAUDE.md` | "Claude Opus 4.7 MAX EFFORT" (arastirma için) |
| `ajanlar/director/SKILL.md:10` | "Default: Claude Opus 4.6 (KALICI)" |
| `config/model-routing.json` | "Tümü Gemini, Claude devre dışı" |
| Avukatın isteği | "Claude=MCP+koordinasyon, Gemini=hukuki nitelendirme+yazım" |

5 farklı kaynak, 4 farklı doktrin. Sistem hangisini takip edeceğini bilmiyor.

### Çözüm Önerileri (Öncelik Sırasına Göre)

**1. Tek Doğruluk Kaynağı (Single Source of Truth) — Kısa Vadeli**

`config/model-routing.json` avukatın gerçek isteğini yansıtacak şekilde yeniden yazılır:

```json
{
  "default_mode": "auto",
  "tasks": {
    "mcp_arac_yonetimi":     { "engine": "claude", "model": "claude-opus-4-7" },
    "orkestrasyon":          { "engine": "claude", "model": "claude-opus-4-7" },
    "kritik_nokta_tespiti":  { "engine": "claude", "model": "claude-opus-4-7" },

    "usul_raporu":           { "engine": "gemini", "model": "gemini-3.1-pro-preview" },
    "arastirma_sentezi":     { "engine": "gemini", "model": "gemini-3.1-pro-preview" },
    "dilekce_yazimi":        { "engine": "gemini", "model": "gemini-3.1-pro-preview" },
    "savunma_simulasyonu":   { "engine": "gemini", "model": "gemini-3.1-pro-preview" },
    "revizyon":              { "engine": "gemini", "model": "gemini-3.1-pro-preview" },
    "self_review":           { "engine": "gemini", "model": "gemini-3.1-pro-preview" }
  }
}
```

Mantık: **Claude koordinasyon ve MCP, Gemini hukuki üretim**. Avukatın istediği tam bu.

**2. Mekanizma: SKILL.md'lere Zorunlu Bash Çağrısı — Orta Vadeli**

Üretim ajanlarının (Belge Yazarı, Arastırmacı sentez, Usul Uzmani, Revizyon, Savunma Simulatörü) SKILL.md'lerinin başına şu blok eklenir:

```markdown
## ZORUNLU İLK ADIM

Ben bu görevi DOĞRUDAN yazmıyorum. Önce gemini-bridge.sh çalıştırıyorum:

1. Context dosyasını hazırla: `cases/{dava-id}/.gemini-input-{asama}.md`
2. Bash çalıştır: `scripts/gemini-bridge.sh {task_type} <input> <output>`
3. Çıktıyı oku ve TASLAK olarak avukata sun
4. Eğer Bash exit code != 0 → fallback notu + Claude ile devam

ASLA bu adımı atlamam. config/model-routing.json bana Gemini diyorsa, Bash çağrısı zorunludur.
```

Bu, Claude'un fiilen Gemini'yi çağırmasını sağlar. SKILL.md'deki "ZORUNLU" kelimesi prompt-level enforcement.

**3. Hook ile Otomatik Tetik — Uzun Vadeli**

`~/.claude/settings.json` PostToolUse hook'u: Belge Yazarı/Arastırmacı/Usul Uzmani agent'ı return ettiğinde, output dosyasının frontmatter'ında `engine: claude` görünüyorsa **uyarı bas**. Bu, regresyona düşmeyi önler.

**4. Dashboard: model-events.jsonl Analizi**

Haftalık otomatik rapor:
```
Bu hafta: 47 task çalıştı.
  Gemini: 38 (%80) ✓
  Claude (fallback): 9 (%20)
  Sıfır Gemini gün sayısı: 0
Hedef: %85+ Gemini
```

Bu rapor yoksa avukat sistemin gerçekte hangi motoru kullandığını asla göremiyor.

---

## C. Sorun 2: ASAMA 2 Darboğazı — 33 Dakika → 5 Dakika

### Benchmark Verileri (Sakarya Davası)

```
T0:                       2026-05-02 01:02:59.978
ASAMA_2_BASLA:            01:09:34.234   (+6:34)
ASAMA_2D_NOTEBOOKLM_BASLA: 01:18:11.892
ASAMA_2D_NOTEBOOKLM_BITTI: 01:36:19.234   (1088 sn = 18:08 ⚠)
ASAMA_2_BITTI:            01:42:28.567   (toplam 33:44)
END:                      01:52:50.695   (toplam 49:51)
```

### Top Bottleneck'ler

**1. NotebookLM Sınırsız Iterasyon — 18 dakika**

`ajanlar/arastirmaci/SKILL.md` Bölüm 2D'de NotebookLM için:
- "minimum 6 hukuki mesele sorusu + 4 perspektif sorusu = en az 10 sorgu"
- **Stop condition yok**: NotebookLM yeterli cevap verince durdurma kriteri tanımsız
- "SADECE KAYNAKLARA GÖRE CEVAP VER" prompt'u her sorguya inject ediliyor → her sorgu uzun yanıt → toplam balon

**Çözüm:**
```markdown
## NotebookLM Stop Condition (yeni kural)

Maximum: 10 sorgu (sıkı sınır)
Erken durma: 5 sorgu yapıldıktan sonra "yeni sorgu öncekilerden farklı bilgi getiriyor mu?"
            kontrolü. 2 ardışık sorgu yeni şey getirmiyorsa DUR.
Hard timeout: 5 dakika. Geçerse: rapora "[NotebookLM yetersiz - kısmi sonuç]" notu.
```

Beklenen kazanç: **18 dk → 4 dk** (4.5x hızlanma).

**2. Yargi MCP Seri Sorgu — 45 sn zorunlu bekleme**

`ajanlar/arastirmaci/SKILL.md:128` (2026-05-02 eklendi):
> "Sorgu basina min 3 saniye bekleme zorunlu. Paralel batch YASAK."

15 sorgu × 3 sn = **45 sn zorunlu bekleme**, sorgu süresi hariç.

Sebep: HTTP 429 rate limit yaşanmış. Ama:
- Gerçek Bedesten rate limit kaç req/min?  **Test edilmemiş**.
- 5 paralel sorgu kesin 429 mu döner?  **Test edilmemiş**.
- 3 sn varsayım, gerçek değer olabilir 0.5 sn veya 10 sn.

**Çözüm:**
```bash
# Önce gerçek limit testi (5 dakikalık iş)
for i in 1 2 3 4 5 6 7 8 9 10; do
  yargi bedesten search "test-$i" &
done
wait
# 429 var mı? Hangi sorguda? Sayıyı kaydet.
```

Sonra: **batch=5, batch arası 2 sn** dene. 15 sorgu için: 3 batch × 2 sn = 6 sn (vs mevcut 45 sn). **7.5x hızlanma**.

**3. Mulga Eleme Seri Yapılıyor**

2C Mevzuat MCP, 2B'den gelen her atıf maddesi için ayrı ayrı `get_mevzuat_madde_tree` çağırıyor. 10 atıf maddesi = 10 seri çağrı.

**Çözüm:** Atıf maddelerini batch'le. 10 atıf → 2 batch (5'erli paralel) → 2x hızlanma.

**4. ASAMA 4 Stratejik Analiz — Promise.allSettled İddiası**

CLAUDE.md ve FIVEAGENTS.md "4A+4B+4C+4D paralel + 4E sentez" diyor. Promise.allSettled denmiş.

**Gerçek:** Bu sub-agent spawn olarak implement edilmemiş. LLM tek context içinde 4 perspektifi seri olarak yazıyor (yorumlama). Yani "paralel" görüntü, gerçek seri.

**Çözüm:** 4A-4D'yi gerçek `Agent` tool çağrısı olarak spawn et (parallel sub-agents). 4E sentezi onların döndürdüğü çıktıyı birleştirir. Beklenen kazanç: 4 dk → 1.5 dk.

### Toplam Beklenen Hızlanma

| Aşama | Mevcut | Hedef | Yöntem |
|-------|--------|-------|--------|
| ASAMA 2D NotebookLM | 18:08 | 4:00 | Stop condition + hard timeout |
| ASAMA 2B Yargi seri | ~7 dk | ~1.5 dk | Batch paralel (gerçek limit testi sonrası) |
| ASAMA 2C Mevzuat seri | ~3 dk | ~1 dk | Atıf maddelerini batch |
| ASAMA 4 sahte-paralel | ~4 dk | ~1.5 dk | Gerçek sub-agent spawn |
| **ASAMA 2+3+4 toplam** | **~33 dk** | **~8 dk** | **4x hızlanma** |

---

## D. Sorun 3: 5 Ajan Stratejik Analiz Belgelendi Ama Implement Edilmedi

### Doktrin (FIVEAGENTS.md + CLAUDE.md)

> "ASAMA 4: 4A Davacı Avukat + 4B Davalı Avukat + 4C Bilirkişi + 4D Hakim paralel çalışır,
>  4E Sentez bunları birleştirir. Promise.allSettled ile hata toleransı: 4/4 tam, 3/4
>  uyarılı, 2/4 sınırlı (DÜŞÜK GÜVEN flag), 1-0/4 BAŞARISIZ."

### Gerçek

`ajanlar/` altında: `arastirmaci/`, `usul-uzmani/`, `dilekce-yazari/`, `savunma-simulatoru/`, `revizyon-ajani/`, `director/` var.

**`davaci-avukat/`, `davali-avukat/`, `bilirkisi/`, `hakim/`, `sentez/` klasörleri YOK.**

Sub-agent'lar yok → `Agent` tool çağrısı yok → "Promise.allSettled" diye bir şey yok → bu fiilen tek context'te seri yazılan 5 perspektif.

### Çözüm

İki seçenek:

**A) Gerçek Implement** — 5 yeni SKILL.md yaz, Director Agent `Agent` tool ile spawn etsin.

**B) Belgeyi Düzelt** — "Bu paralel değil, tek-context 5-perspektif" olarak doktrini revize et.

Avukatın hızlanma talebi düşünülürse **A daha doğru**. Sub-agent'lar paralel çalışırsa toplam süre belirgin düşer.

---

## E. Sorun 4: Doktriner Çelişkiler

### 5 Kaynak, 4 Farklı Doktrin

| # | Kaynak | Lokasyon | Söylediği | Tarih |
|---|--------|----------|-----------|-------|
| 1 | User CLAUDE.md | `~/.claude/CLAUDE.md` | Motor belirtmiyor, direktif "Avukat Aykut'un asistanı" | - |
| 2 | Proje CLAUDE.md | proje kök | "Claude Opus 4.7 MAX EFFORT" (araştırma için) | - |
| 3 | Director SKILL | `ajanlar/director/SKILL.md:10` | "Default: Claude Opus 4.6 (KALICI)" | 2026-04-11 |
| 4 | Model Routing | `config/model-routing.json` | "Tümü Gemini, Claude devre dışı" | 2026-05-02 |
| 5 | Avukat (sözlü) | bu konuşma | Hibrit: Claude=MCP, Gemini=hukuki | 2026-05-04 |

### Çözüm: Single Source of Truth

`config/model-routing.json` **TEK** doğru kaynak olarak ilan edilir. Diğer 4 dosyada motor referansları silinir veya "config/model-routing.json'a bakın" denir.

Patch listesi:
1. `CLAUDE.md` — "Claude Opus 4.7 MAX EFFORT" satırları → "config/model-routing.json'da tanımlı motor"
2. `ajanlar/director/SKILL.md:10` — "Default: Claude Opus 4.6" satırı kaldırılır
3. `ajanlar/arastirmaci/SKILL.md:125` — "Claude Opus 4.7 MAX EFFORT thinking" → "Gemini 3.1 Pro Preview deep mode"
4. Tüm SKILL.md'lerde model adı geçen satırlar → config referansına çevrilir

---

## F. Sorun 5: Kullanıcı-Kontrol Komutları Eksik

### CLAUDE.md İddiası

> "Avukat her aşama sonunda şöyle yanıt verir:
>  - `devam` → sonraki aşama
>  - `atla` → bu aşama atlanır
>  - `motor değiştir` → alternatif motorla aynı aşama yeniden çalıştırılır
>  - `dur` → akış durdurulur, `devam et` ile resume"

### Gerçek

`.claude/commands/` içeriği:
```
arastir-akademik, arastir-mevzuat, arastir-notebook, arastir-yargi, arastir,
blog, hesapla, ihtarname-yaz, notebooklm-dene, sozlesme-yaz, usul, yeni-dava
```

**Yok:** `devam`, `atla`, `dur`, `motor-degistir`, `devam-et`

Yani avukat 7 ASAMA workflow'u durdurulamaz, motor değiştiremez, atlayamaz. Tek seçenek: ya komple çalıştırmak ya da Ctrl+C.

### Çözüm

5 slash command yaz:
```
.claude/commands/devam.md          → "Sıradaki ASAMA'ya geç"
.claude/commands/atla.md           → "Bu ASAMA'yı atla, sebep sor"
.claude/commands/dur.md            → "Akışı durdur, state'i kaydet"
.claude/commands/devam-et.md       → "En son state'ten devam et"
.claude/commands/motor-degistir.md → "Bu ASAMA'yı alternatif motorla yeniden çalıştır"
```

Her biri Director Agent'a sinyal gönderir. State `cases/{dava-id}/.workflow-state.json` dosyasında tutulur.

---

## G. Önceliklendirilmiş Eylem Planı

### 🔴 Quick Wins (1-2 günde) — Beklenen %60 hızlanma

1. **`config/model-routing.json` revize** — Hibrit model (Claude=MCP, Gemini=üretim).
   - Süre: 30 dk
   - Etki: Doktrin avukatın isteğiyle hizalanır (henüz mekanizma yok ama doktrin doğrudur)

2. **NotebookLM hard cap + stop condition** — `arastirmaci/SKILL.md` Bölüm 2D'ye 5 satırlık kural eklenir.
   - Süre: 1 saat
   - Etki: 18 dk → 4 dk (en büyük tek kazanç)

3. **Yargı API gerçek rate limit testi** — 5 paralel sorgu testi. Sonuca göre `arastirmaci/SKILL.md:128` revize edilir.
   - Süre: 30 dk test + 30 dk SKILL revizyon
   - Etki: 45 sn zorunlu bekleme → 6 sn (7.5x ASAMA 2B)

4. **Doktriner çelişki temizliği** — 4 dosyada motor referansları kaldırılır, tek SoT bırakılır.
   - Süre: 1 saat
   - Etki: Sistem tutarlı çalışmaya başlar

5. **5 slash command** (`devam`, `atla`, `dur`, `devam-et`, `motor-degistir`)
   - Süre: 2 saat
   - Etki: Avukat akış üzerinde kontrol kazanır

**Toplam Quick Win süresi:** ~6 saat. Beklenen ASAMA 2 hızlanması: **33 dk → 13 dk** (2.5x).

### 🟡 Medium-term (1 hafta) — Mekanizma kurma

6. **gemini-bridge.sh'i SKILL.md'lere zorunlu Bash çağrısı olarak ekle** — 5 üretim ajanı için.
   - Süre: 1 gün
   - Etki: Gemini fiilen devreye girer. `model-events.jsonl` dolu olur.

7. **5 Ajan ASAMA 4 gerçek sub-agent spawn** — `davaci-avukat/`, `davali-avukat/`, `bilirkisi/`, `hakim/`, `sentez/` SKILL.md'leri yazılır. Director Agent `Agent` tool ile spawn eder.
   - Süre: 2 gün
   - Etki: ASAMA 4 gerçekten paralel olur. 4 dk → 1.5 dk.

8. **Mulga eleme batch paralel** — 2C Mevzuat MCP'de atıf maddeleri 5'erli batch ile çekilir.
   - Süre: 4 saat
   - Etki: 3 dk → 1 dk.

### 🟢 Long-term (2-3 hafta) — Gözlenebilirlik ve regresyon koruması

9. **Hook: PostToolUse model regresyon uyarısı** — Belge Yazarı çıktısı Claude ile gelirse uyar.
10. **Haftalık model dashboard** — `logs/model-events.jsonl` analizi otomatik raporu.
11. **State checkpoint sistemi** — Workflow ortasında dur, sonra devam-et.
12. **Benchmark CI** — Her ASAMA için target süre tanımla, regresyon olunca uyar.

### Kabul Kriterleri (Quick Win Sonrası)

Quick Win'ler tamamlandıktan sonra şu kriterler sağlanmalı:

- [ ] `config/model-routing.json` hibrit model tanımlıyor (Claude+Gemini)
- [ ] Sakarya benzeri bir dava ASAMA 2 < 5 dakikada bitiyor (NotebookLM cap çalışıyor)
- [ ] `logs/model-events.jsonl` son 7 günde Gemini event'leri var (gemini-bridge.sh devreye girmiş)
- [ ] Avukat `dur` deyince akış duruyor, `devam et` ile state restore oluyor
- [ ] CLAUDE.md, Director SKILL, arastirmaci SKILL — hepsi `config/model-routing.json`'a referans veriyor (motor adı geçmiyor)

### Kabul Kriterleri (Medium-term Sonrası)

- [ ] ASAMA 2+3+4 toplam < 10 dakika
- [ ] ASAMA 4 gerçek paralel sub-agent (4 ajan eş zamanlı spawn)
- [ ] gemini-bridge.sh'in çalıştığı son 30 günde her gün event log'da görünüyor

---

## H. Açık Kalan Sorular (Avukata)

Bu kararlar avukat onayı gerektiriyor:

1. **Hibrit model tercihiniz hangi kademede?**
   - (a) Tüm hukuki üretim Gemini, koordinasyon+MCP Claude (önerim)
   - (b) Sadece dilekçe yazımı Gemini, gerisi Claude
   - (c) Avukat her ASAMA'da seçer (`default_mode: ask`)

2. **NotebookLM hard timeout — 5 dakika mı, 3 mü, 8 mi?**
   Şu an 0 (sınırsız). 5 dk öneriyorum. Avukatın hız vs kapsam tercihine göre değişir.

3. **5 Ajan ASAMA 4 gerçekten implement edilsin mi?**
   - Implement maliyeti: 2 gün
   - Çıktı kalitesi muhtemelen aynı (çünkü zaten LLM 4 perspektifi yazıyor)
   - Hız kazancı net: 4 dk → 1.5 dk

4. **Quick Win'ler hangi sıraya uygulansın?**
   Önerim sıra: 1→2→4→3→5 (en hızlı kazanç önce, en risksiz son).

---

## I. Sonuç

Avukatın iki şikayeti **doğrulandı ve somut sebepleri tespit edildi**:

- **Hız sorunu sebebi:** NotebookLM'de stop condition yok (18 dk), Yargı'da test edilmemiş 3 sn defansif bekleme (45 sn), sahte-paralel ASAMA 4. Toplam 33 dk → 8 dk hedefi **mümkün**, Quick Win'lerle 13 dk'ya iniyor.

- **Model routing sebebi:** Config var ama mekanizma yok. SKILL.md'lerde "şu Bash'i çalıştır" yönergesi yok, hook yok. Sistem fiilen Claude'da çalışıyor, Gemini bekliyor.

İlk adımı (Quick Win 1-5) onaylar mısınız? Yaklaşık 6 saatlik iş, tahmini %60 hızlanma sağlar ve hibrit model doktrinini avukatın isteğiyle hizalar. Mekanizma kurmak (Medium-term 6-8) ardından gelir.

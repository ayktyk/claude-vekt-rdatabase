# Claude'suz Motor Revizyonu — Tasarım Spec'i

**Tarih:** 2026-07-18
**Durum:** Avukat onaylı tasarım (sohbet içi onay, 2026-07-18)
**Kapsam etiketi:** "şimdilik" — geri döndürülebilir paralel katman; mevcut Claude altyapısı silinmez.

## 1. Amaç ve Gerekçe

Hukuk benchmark'ı (`son benchmark.jfif`, 2026-07) sıralaması:

| Model | Puan |
|---|---|
| Gemini 3.1 Pro + YargıPro | 96 |
| Gemini 3.1 Pro (araçsız) | 92 |
| GPT-5.6 Sol + YargıPro | 91 |
| Fable 5 + YargıPro | 90 |
| GPT-5.6 Terra + YargıPro | 90 |
| GPT-5.6 Sol (araçsız) | 89 |
| GPT-5.6 Luna + YargıPro | 87 |
| Fable 5 (araçsız) | 86 |

İki karar:
1. Sistem, listenin başındaki iki motor üzerine kurulur: **Gemini 3.1 Pro** (hukuki üretim)
   + **GPT-5.6 Sol** (orkestrasyon + araştırma + sentez). **Luna pipeline'dan çıkarılır**
   (en zayıf halka olduğu hâlde nihai 2B raporunu yazıyordu).
2. **Claude (Fable) şimdilik tamamen çıkarılır** — muhakeme rolleri VE orkestrasyon dahil.
   Deterministik Python kapıları (`cikti_dogrula.py`, `quality_gate.py`, `doktrin_lint.py`,
   `maske.py`, `md_to_docx.py`, `md_to_udf.py`, `paths.py`) model değildir; aynen kalır.

Benchmark'ın ikinci dersi kurallaşır: **araç desteği (+YargıPro) her modele +2…+7 puan
katıyor** → araçsız hukuki üretimde künye yazmak yasaktır (bkz. §7).

## 2. Yeni Mimari

```
AVUKAT
  │  (terminalde: codex)
  ▼
CODEX CLI — GPT-5.6 Sol  = ORKESTRATÖR (Director)         [AGENTS.md]
  ├─ Komut sınıflandırma (yeni dava / arastir / arastir danisma / blog ...)
  ├─ scripts/yargi_model_pipeline.py çalıştırma (2B)
  ├─ Deterministik kapıları çalıştırma (doktrin_lint, cikti_dogrula, quality_gate)
  ├─ Devir bloklarını basma (Antigravity'ye)
  ├─ Drive'a yazım (G:\ bağlı dosya sistemi — MCP gerekmez)
  └─ DOCX/UDF üretimi (md_to_docx.py / md_to_udf.py)
  │
  ├────────────► ANTIGRAVITY — Gemini 3.1 Pro = HUKUKİ ÜRETİM (ASAMA 3-7, blog)
  │              (avukat elle yapıştırır; hedef: Antigravity'ye YargıPro MCP → 96 kombinasyonu)
  │
  └─ 2B PIPELINE (ordered_multi_model, hepsi codex engine):
       1. Sol   (xhigh) → ana araştırma (derin: min 15 sorgu / hafif: min 6)
       2. Terra (xhigh) → bağımsız denetim + refutasyon (aleyhe tarama, künye teyidi)
       3. Sol   (xhigh) → NİHAİ 2B sentezi (final_report_stage)
       4. Terra (high)  → kısa kalite kapısı (üreten Sol ≠ denetleyen Terra ayrımı)
     Luna: TÜM stage'lerden çıkarılır. `engine: claude` hiçbir stage'de kalmaz.
```

## 3. Rol Dağılımı (Eski → Yeni)

| Rol | Eski | Yeni |
|---|---|---|
| Orkestrasyon (Director) | Claude terminal | **Codex CLI / Sol (AGENTS.md)** |
| 2B ana araştırma | Sol | Sol (değişmedi) |
| 2B bağımsız denetim | Terra | Terra (değişmedi) |
| 2B nihai sentez | **Luna (87)** | **Sol (91)** |
| 2B kalite kapısı | Claude | **Terra** + deterministik scriptler |
| Araştırma sentezi (danışma `arastirma-cevabi.md` / dava `arastirma-raporu.md`) | Claude | **Sol** |
| Künye içerik-teyidi (bağımsız reviewer) | Claude | **Terra** (+ yapısal: cikti_dogrula.py) |
| ASAMA 3-7 + blog üretimi | Antigravity/Gemini | Antigravity/Gemini (değişmedi) |
| Devir bloğu üretimi | Claude | **Codex/Sol** |
| Drive/dosya yazımı | Claude (MCP/dosya) | **Codex (G:\ dosya sistemi)** |
| Hesaplama modülü çağrıları | Claude | **Codex/Sol** (deterministik formüller AGENTS.md'de referanslı) |
| MemPalace diary/drawer | Claude MCP | **Devre dışı (şimdilik)** → `dersler/` dosya-temelli döngü tek başına |
| Gmail / Takvim / NotebookLM | Claude MCP'leri | **Manuel (şimdilik)** — Claude'a dönüş gerekçeleri |
| Edit-hook otomatiği (doktrin_lint) | Claude Code hook | **AGENTS.md'de zorunlu manuel adım** (prompt yüzeyi değişince lint çalıştır) |

## 4. Değişecek Dosyalar

1. **AGENTS.md** (büyük genişletme — yeni Director anayasası):
   kimlik + 0-halüsinasyon/anti-sycophancy doktrini (preamble gömülü) + komut sözlüğü +
   7 ASAMA akışı ve "devam/atla/dur" protokolü + ASAMA başı motor bildirimi + KVKK durumu
   (dava akışı maskesiz, blog/kamu çıktısı yasak) + `paths.py` yol çözümleme + çıktı
   formatları (KARAR NOKTALARI, güven etiketleri, Kaynak Doğrulama Tablosu) + devir bloğu
   şablonu (YargıPro doğrulama maddeli) + zorunlu lint/kapı adımları + `yargi`/`mevzuat`
   CLI kullanım kuralları (rate limit 3 sn, backoff 5→15→30→60) + ARAÇSIZ damga kuralı.
2. **config/model-routing.json**: `tasks.yargi_mcp.pipeline.stages` → [sol, terra, sol,
   terra]; `final_report_stage: 3`, `quality_gate_stage: 4`; Luna referansları silinir;
   `tasks.*` içindeki `engine: claude` girdileri codex karşılıklarına çevrilir
   (arastirma_sentezi → codex/gpt-5.6-sol; kalite kapıları → codex/gpt-5.6-terra);
   `orchestrator_engine: codex` alanı eklenir.
3. **scripts/yargi_model_pipeline.py**: stage motoru zaten config'ten okuyor — Luna'sız
   4-stage dizilimle uyum + "claude" engine fallback'inin kaldırılması/uyarıya çevrilmesi.
4. **tests/test_yargi_model_pipeline.py**: yeni dizilime göre güncellenir; yeşil kalmalı.
5. **ARASTIRMA.md**: danışma hattı orkestratörü Codex; Faz 3 sentez Sol; bağımsız teyit
   Terra; "Claude tek-elden" ifadeleri kaldırılır.
6. **dersler/sistem.md**: benchmark → Luna çıkarma + Claude'suz deneme kararı, tarih ve
   gerekçeyle (KAÇIRILAN/DÜZELTME/KURAL ADAYI formatında).
7. **docs/superpowers/specs/2026-07-18-claudesiz-motor-revizyonu-design.md**: bu dosya.

**Dokunulmayacaklar:** CLAUDE.md, `.claude/` (commands/skills/hooks), FIVEAGENTS.md ve
ajan SKILL.md'leri (Claude katmanının anayasası olarak kalır — geri dönüş güvencesi).
Not: FIVEAGENTS/SKILL güncellemeleri Claude'a dönüş VEYA kalıcılaşma kararına ertelendi.

## 5. Kapsam Dışı (Non-Goals)

- **Antigravity'ye YargıPro MCP bağlanması** — hedef korunur ama ayrı operasyonel iştir
  (kullanıcı arayüzünden yapılır); bu spec yalnız devir bloğuna doğrulama maddesini koyar.
- **yargi-mcp-pro OAuth onarımı** — sunucu tarafı (Railway/WorkOS `invalid_target` /
  reconnect reddi). Düzelince: `codex mcp add yargi-pro --url ...` (komut hazır, denendi).
  O zamana dek `yargi` + `mevzuat` CLI birincildir (aynı Bedesten verisi).
- Gmail/Takvim/NotebookLM'in Codex'e taşınması — ertelendi.
- isbu-ofis alt projesi — kapsam dışı.

## 6. Riskler ve Kabuller

| Risk | Kabul/Önlem |
|---|---|
| Codex'te hook yok → lint unutulabilir | AGENTS.md'de "prompt yüzeyi değiştiyse doktrin_lint çalıştırmadan çıktı verme" zorunlu adımı; plan sonunda smoke test |
| MemPalace kapalı → oturumlar arası hafıza zayıflar | `dersler/` + `playbook/` dosya döngüsü (sistemde zaten MemPalace'siz çalışma öngörülü) |
| Gmail/Takvim otomasyonu kaybolur | Manuel; süre takvimi riski avukata AGENTS.md çıktı şablonunda "SÜRE UYARISI" satırıyla taşınır |
| Sol'un Türkçe hukuk üslubu Claude'dan farklı | Çıktı şablonları (KARAR NOKTALARI, tablo, üslup yasakları) AGENTS.md'ye aynen taşınır |
| Codex sürüm/model erişimi | codex-cli ≥ 0.144 doğrulandı (0.144.6, gpt-5.6-sol çalıştı — bugünkü test) |

## 7. Kalıcı Kural — Araçsız Künye Yasağı (benchmark dersi)

Hukuki çıktı üreten motor, Bedesten erişimli araç (YargıPro MCP veya `yargi`/`mevzuat`
CLI) olmadan **künye yazamaz**. Araçsız üretim zorunluysa çıktının başına
`ARAÇSIZ — künye içermez` damgası konur. Bu kural AGENTS.md'ye ve devir bloğu şablonuna
girer (Gemini için: "araç bağlı değilse cevabın başına ARAÇSIZ yaz ve künye verme").

## 8. Başarı Kriterleri

1. `codex` oturumunda `arastir danisma:` akışı uçtan uca çalışır — referans test:
   Kenan tapu harcı vakası (2026-011) yeniden koşulur; çıktı Kaynak Doğrulama Tablolu,
   künyeler documentId'li.
2. `python scripts/yargi_model_pipeline.py --mod hafif` yeni dizilimle `0` döner;
   `tests/` yeşil.
3. `config`'te pipeline stage'lerinde `claude` ve `luna` geçmez.
4. `doktrin_lint.py` PASS.
5. Geri dönüş kanıtı: Claude Code açıldığında mevcut akış (CLAUDE.md) bozulmamış.

## 9. Geri Dönüş Planı

Tüm değişiklikler `+mempalace` dalında ayrı commit'ler halinde; CLAUDE.md/.claude/
dokunulmadığı için Claude orkestrasyonuna dönüş = Claude Code'u açmak. Kalıcılaşma
kararı verilirse FIVEAGENTS/SKILL katmanı ikinci bir spec ile hizalanır.

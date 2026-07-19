# Claude+Gemini Dönüşü — Codex'in Tamamen Kaldırılması — Tasarım Spec'i

**Tarih:** 2026-07-19
**Durum:** Avukat onaylı tasarım (sohbet içi onay, 2026-07-19)
**Önceki spec:** `2026-07-18-claudesiz-motor-revizyonu-design.md` (bu spec onu GEÇERSİZ kılar;
dosya tarihçe kaydı olarak korunur)

## 1. Amaç ve Gerekçe

Avukat kararı (2026-07-19): Codex/Sol orkestrasyon denemesi beklentiyi karşılamadı.
Sistem eski kontrol kapılı hâline döner ve Codex **tüm projeden tamamen kaldırılır**
(fallback olarak dahi kalmaz).

Yeni sabit rol dağılımı:

1. **Orkestra şefi + tüm tool kullanımı = Claude Fable 5** (`claude-fable-5`).
2. **Fable limiti dolarsa = Claude Opus 4.8** (`claude-opus-4-8`) — config'te
   `model_fallback`; geçiş operasyoneldir (avukat `/model` ile geçer veya oturumu
   Opus ile açar), çıktı frontmatter'ı ve ASAMA bildirimi hangi modelin çalıştığını
   açıkça yazar.
3. **Hukuki muhakeme = Antigravity / Gemini 3.1 Pro** (ASAMA 3-7, ihtarname/sözleşme,
   blog, self-review) — değişmez.
4. Hedef: 0-halüsinasyon + %100'e yakın doğrulukta hukuki muhakeme; bu, motor
   seçiminden değil **kontrol kapılarından** gelir — kapıların tamamı geri gelir.

## 2. Mimari (Dönüş Sonrası)

```
AVUKAT
  │  (terminalde: Claude Code)
  ▼
CLAUDE FABLE 5 = ORKESTRA ŞEFİ (Director)            [CLAUDE.md]
  │  (limit dolarsa: Claude Opus 4.8 — bildirimli)
  ├─ Komut sınıflandırma (yeni dava / arastir / arastir danisma / ihtarname / blog ...)
  ├─ ASAMA 0 MemPalace Wake-up + diary write
  ├─ 2B Yargı MCP → 2C Mevzuat MCP (sıralı) + 2D NotebookLM (paralel) — iteratif derin protokol
  ├─ Araştırma sentezi + bağımsız künye içerik-teyidi
  ├─ Deterministik kapılar (doktrin_lint, cikti_dogrula, quality_gate)
  ├─ Devir bloklarını basma (Antigravity'ye, 3 Batch)
  ├─ Drive/Gmail/Takvim/UYAP işlemleri
  └─ DOCX/UDF üretimi (md_to_docx.py / md_to_udf.py)
  │
  └────────────► ANTIGRAVITY — Gemini 3.1 Pro = HUKUKİ MUHAKEME (ASAMA 3-7, belge, blog)
                 (avukat elle yapıştırır; her üretim sonu self-review zorunlu)
```

2B artık tek elden Claude'dadır: çok-modelli pipeline (Sol→Terra→Luna/Sol→Terra) YOK.
Minimum sorgu kuralları aynen: derin mod min 15 sorgu / 5 tam metin; hafif mod
(danışma hattı) min 6 / 3. MCP-birincil kural korunur; `yargi`/`mevzuat` CLI fallback.

## 3. Codex Kaldırma Envanteri

Proje geleneğine uygun: silme yerine `arsiv/codex-motor/` altına taşıma +
`arsiv/README.md` kaydı (git geçmişi doğal yedek).

| Taşınacak | İçerik |
|---|---|
| `AGENTS.md` | Codex Director anayasası |
| `.codex/` | config.toml, hooks.json, 5 perspektif ajan TOML'ı |
| `.agents/skills/` | 3 Codex skill kopyası (asılları `.claude/skills/`'te duruyor) |
| `scripts/yargi_model_pipeline.py` | Çok-modelli 2B pipeline scripti |
| `tests/test_yargi_model_pipeline.py` | Pipeline testleri |
| `schemas/yargi-sentez-output.schema.json` | Pipeline çıktı şeması |

**Tarihçe olarak KALIR (taşınmaz/silinmez):** `dersler/sistem.md` kayıtları,
`docs/superpowers/specs/2026-07-18-claudesiz-motor-revizyonu-design.md`,
`arsiv/eski-notlar/` içeriği.

## 4. Referans Temizliği (Sol/Terra/Luna/pipeline geçen dokümanlar)

| Dosya | Yapılacak |
|---|---|
| `CLAUDE.md` | Baştaki "orkestratör Codex" banner'ı kaldırılır → yerine 2026-07-19 dönüş kaydı; "Her Zaman Derin Mod" bölümündeki Sol→Terra→Luna hattı → Claude tek elden iteratif protokol; `arastir yargi:` satırı ve model routing tabloları güncellenir; `claude-opus-4-7` → `claude-fable-5` (+ `claude-opus-4-8` fallback); Araçsız Künye Yasağı doktrine kalıcı madde olarak eklenir |
| `ARASTIRMA.md` | Danışma hattı orkestratörü + Faz 3 sentez + bağımsız teyit → Claude; Codex/Sol ifadeleri temizlenir |
| `FIVEAGENTS.md` | 2B pipeline referansları → Claude tek elden |
| `ajanlar/arastirmaci/SKILL.md` | 2B çok-modelli hat referansları → Claude iteratif protokol |
| `.claude/commands/arastir.md`, `arastir-yargi.md`, `arastir-danisma.md` | Pipeline/Sol/Terra/Luna referansları temizlenir |
| `.claude/skills/yargi-agentic-deep-research/SKILL.md` | DOKUNULMAZ — satır 10/116'daki "Codex" geçişleri vendor rehberinin jenerik platform notudur (sunucu sürüm-senkron sözleşmesi bozulmasın); doğrulama grep'inde belgeli istisna |
| Kalıcı hafıza (`memory/sistem-codex-orkestrasyonu.md` + `MEMORY.md`) | "Claude devre dışı" kaydı → dönüş kaydıyla değiştirilir |

## 5. config/model-routing.json Değişiklikleri

1. 8 task (`director`, `mcp_arac_yonetimi`, `yargi_mcp`, `mevzuat_mcp`,
   `uyap_workspace`, `notebooklm_mcp`, `kritik_nokta_tespiti`, `arastirma_sentezi`)
   → `engine: "claude"`, `model: "claude-fable-5"`, `model_fallback: "claude-opus-4-8"`.
2. `tasks.yargi_mcp.pipeline` (ordered_multi_model) tamamen SİLİNİR; yerine
   `protokol: "claude_iteratif_derin"` + mod minimumları (derin 15/5, hafif 6/3).
3. Antigravity task'ları (`arama_plani`, `usul_raporu`, `stratejik_analiz`,
   `dilekce_yazimi`, `savunma_simulasyonu`, `revizyon`, `blog_yazimi`, `self_review`)
   AYNEN kalır (`gemini-3.1-pro-preview`).
4. `fallback.final_fallback` → `claude-fable-5`; ikinci kademe `claude-opus-4-8`.
   DEPRECATED `gemini_chain` alanları ve codex fallback girdileri silinir.
5. `orchestrator_engine: "claude"`, `orchestrator_model: "claude-fable-5"`.
6. `_history`'ye 2026-07-19 kaydı; `_claude_removed` alanı kaldırılıp yerine
   `_codex_removed` dönüş kaydı yazılır.

## 6. Her Yeni Oturum Garantisi (Claude+Gemini Kuralı)

`CLAUDE.md` yeniden TEK anayasadır ve üç ana kullanım şu sabit kurala bağlanır:

| Akış | Claude Fable (şef + tool) | Gemini 3.1 Pro (muhakeme) |
|---|---|---|
| Dava araştırması (`arastir:`, `yeni dava:` ASAMA 2) | 2B→2C sıralı + 2D paralel, sentez, künye teyidi, kapılar | ASAMA 3-7 üretimi (devir bloklarıyla) |
| Basit araştırma (`arastir danisma:`) | ARASTIRMA.md 5-faz hattının tamamı | — (istenirse ikinci görüş) |
| Basit belge (`ihtarname yaz`, `dilekce yaz`, `sozlesme yaz`) | Girdi hazırlığı, devir bloğu, `cikti_dogrula` + bağımsız künye teyidi | Belge üretimi + self-review |

Her akışta 0-halüsinasyon doktrini + Kaynak Doğrulama Tablosu + KARAR NOKTALARI +
güven etiketleri zorunludur.

## 7. Geri Gelen Kontrol Kapıları

- ASAMA 0 MemPalace Wake-up + iş sonu diary write (MemPalace MCP yeniden aktif)
- 7 ASAMA kullanıcı-kontrollü akış; ASAMA başı motor bildirimi + `devam` onayı
- 4 Kalite Kapısı (ASAMA 2 / 3 / 4 / 7 sonları)
- `doktrin_lint.py` Edit/Write hook'u (`.claude/` dokunulmadığı için yerinde)
- `cikti_dogrula.py` yapısal kapı + **bağımsız Claude künye içerik-teyidi**
- Antigravity self-review (KIRMIZI/SARI/YEŞİL) — Drive'a yazım öncesi zorunlu
- Gmail (belge talebi) + Takvim (süre/duruşma) otomasyonu yeniden aktif
- `dersler/` + `playbook/` döngüsü korunur (MemPalace ile birlikte çalışır)

## 8. Korunan Kazanımlar (Codex döneminden)

1. **Araçsız Künye Yasağı (benchmark dersi):** Bedesten erişimli araç olmadan hiçbir
   motor künye yazamaz; araçsız üretim zorunluysa çıktı başına `ARAÇSIZ — künye içermez`
   damgası. CLAUDE.md doktrinine kalıcı madde olarak girer; Gemini devir bloğu
   şablonundaki doğrulama maddesi kalır.
2. **Luna ve çok-modelli 2B denemesi geri gelmez.**
3. `arsiv/eski-notlar/` ve dersler kayıtları tarihçe olarak durur.

## 9. Kapsam Dışı (Non-Goals)

- `yargi-mcp-pro` OAuth onarımı — sunucu tarafı sorun (bu oturumda da reconnect
  reddetti). MCP-birincil kural kalır; düzelene dek `yargi`/`mevzuat` CLI fallback.
- Antigravity'ye YargıPro MCP bağlanması — ayrı operasyonel iş.
- `isbu-ofis/` alt projesi — kapsam dışı.
- Kullanıcı-seviyesi (`~/.claude`) codex plugin'i — proje kapsamı dışında; proje
  dosyalarında hiçbir referans kalmayacağı için akışa etkisi yok.

## 10. Riskler ve Kabuller

| Risk | Kabul/Önlem |
|---|---|
| Fable limiti dolduğunda otomatik model geçişi yok | Operasyonel kural: avukat `/model` ile Opus 4.8'e geçer; çıktı frontmatter + ASAMA bildirimi modeli damgalar |
| yargi-mcp-pro OAuth reddi sürüyor | CLI fallback aynı Bedesten verisi; her fallback olayı rapora `mcp_fallback_used: true` |
| Pipeline arşivlenince `arastir yargi:` komutunun eski davranışı değişir | Komut Claude tek-elden 2B protokolüne bağlanır; minimum sorgu kuralları korunduğu için kalite düşmez |
| MemPalace/Gmail/Takvim MCP'leri uzun süre kapalıydı | İlk oturumda `mempalace_status` + MCP sağlık kontrolü; erişilemezse CLAUDE.md hata tablosundaki adımlar |

## 11. Başarı Kriterleri

1. Projede (`arsiv/`, `dersler/` ve `docs/superpowers/specs/` tarihçe dosyaları
   hariç) `codex`, `gpt-5.6`, `Terra`, `Luna`, `ordered_multi_model` referansı
   kalmaz — grep temiz.
2. `config/model-routing.json`: Antigravity task'ları dışında tüm engine'ler
   `claude`; `orchestrator_engine: claude`; şema geçerli JSON.
3. `python scripts/doktrin_lint.py` PASS.
4. `CLAUDE.md` banner'sız, tek anayasa; üç ana akış kuralı (bölüm 6) işlenmiş.
5. Smoke test: yeni oturumda `arastir danisma:` akışı Claude'da uçtan uca çalışır;
   çıktı Kaynak Doğrulama Tablolu, künyeler documentId'li.

## 12. Geri Dönüş Planı

Tüm değişiklikler `+mempalace` dalında ayrı commit'ler halinde. Codex katmanı
`arsiv/codex-motor/` + git geçmişinde durduğu için olası bir geri dönüş
arşivden çıkarma + config'i eski commit'ten alma ile yapılır.

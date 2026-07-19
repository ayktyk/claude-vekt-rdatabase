# Claude+Gemini Dönüşü — Codex'in Tamamen Kaldırılması — Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Codex/Sol katmanını projeden tamamen çıkarıp orkestrasyon + tüm tool kullanımını Claude Fable 5'e (fallback: Claude Opus 4.8), hukuki muhakemeyi Antigravity/Gemini 3.1 Pro'ya sabitleyen kontrol kapılı sisteme dönmek.

**Architecture:** Codex artefaktları `arsiv/codex-motor/`'a `git mv` ile taşınır (git geçmişi + arşiv = çift yedek). `config/model-routing.json` tek doğruluk kaynağı olarak yeniden yazılır. Codex/Sol/Terra/Luna referansı taşıyan 8 aktif doküman Claude tek-elden iteratif derin protokole göre düzeltilir. Spec: `docs/superpowers/specs/2026-07-19-claude-gemini-donus-design.md`.

**Tech Stack:** Git (mv/commit), JSON (python -m json.tool ile doğrulama), Markdown doküman düzenleme, `scripts/doktrin_lint.py` (PASS kalmalı).

**Çalışma dizini (tüm komutlar için):** `D:\projelerim\aktif projelerimm\Eski Claude antıgravıty`

**Genel kurallar:**
- Her Edit'ten önce hedef dosya Read ile okunur (Edit aracı bunu zorunlu kılar; satır numaraları bu plandaki grep çıktısına göre kaymış olabilir — eşleşmeyi metinle yap, satır numarasıyla değil).
- `dersler/`, `docs/superpowers/specs/`, `arsiv/` içindeki Codex geçişleri TARİHÇEDİR — dokunulmaz.
- `.claude/skills/yargi-agentic-deep-research/SKILL.md` satır 10 ve 116'daki "Codex" geçişleri vendor rehberinin JENERİK platform notudur (sunucu sürüm-senkron sözleşmesi var) — DOKUNULMAZ; doğrulama grep'inde belgeli istisnadır.

---

### Task 1: Codex katmanını `arsiv/codex-motor/`'a taşı

**Files:**
- Create: `arsiv/codex-motor/` (git mv hedefi)
- Move: `AGENTS.md`, `.codex/`, `.agents/`, `scripts/yargi_model_pipeline.py`, `tests/test_yargi_model_pipeline.py`, `config/yargi-sentez-output.schema.json`
- Modify: `arsiv/README.md`

- [ ] **Step 1: Klasörü oluştur ve dosyaları git mv ile taşı**

```bash
mkdir -p arsiv/codex-motor
git mv AGENTS.md arsiv/codex-motor/AGENTS.md
git mv .codex arsiv/codex-motor/.codex
git mv .agents arsiv/codex-motor/.agents
git mv scripts/yargi_model_pipeline.py arsiv/codex-motor/yargi_model_pipeline.py
git mv tests/test_yargi_model_pipeline.py arsiv/codex-motor/test_yargi_model_pipeline.py
git mv config/yargi-sentez-output.schema.json arsiv/codex-motor/yargi-sentez-output.schema.json
```

- [ ] **Step 2: Boş kalan `tests/` klasörünü temizle**

`tests/` altında yalnız `__pycache__` kaldıysa (üretilmiş dosya, git'te izlenmez):

```bash
rm -rf tests/__pycache__ && rmdir tests 2>/dev/null; ls tests 2>&1
```

Expected: `ls: cannot access 'tests': No such file or directory` (asıl test paketi `scripts/tests/`'te durur, ona dokunulmaz).

- [ ] **Step 3: `arsiv/README.md` tablosuna satır + bölüm ekle**

Tabloya (mevcut 3 satırın altına) şu satırı ekle:

```markdown
| Codex motoru (2026-07-13→19) | `codex-motor/`: `AGENTS.md` (Codex Director anayasası), `.codex/` (config + hooks + 5 perspektif ajan TOML), `.agents/skills/` (Codex skill kopyaları), `yargi_model_pipeline.py` + testi + `yargi-sentez-output.schema.json` (çok-modelli 2B pipeline) | Avukat kararı 2026-07-19: Codex denemesi beklentiyi karşılamadı; orkestra şefi + tüm tool kullanımı Claude Fable 5'e (fallback Opus 4.8) döndü, Codex fallback olarak dahi kalmadı | Avukat açıkça Codex'e dönüş kararı verirse (`git mv` ile eski yollara + config/dokümanlara referansları geri ekle; spec: `docs/superpowers/specs/2026-07-18-claudesiz-motor-revizyonu-design.md`) |
```

Dosya sonuna (KVKK paragrafından sonra) şu notu ekle:

```markdown
**Codex arşivi notu (2026-07-19):** `codex-motor/` içindeki `.codex/` ve
`.agents/` klasör adları geri-alma kolaylığı için orijinal haliyle korunmuştur
(nokta ile başlar — `ls -a` ile görünür). Dönüş spec'i:
`docs/superpowers/specs/2026-07-19-claude-gemini-donus-design.md`.
```

- [ ] **Step 4: Doğrula**

```bash
ls AGENTS.md .codex .agents scripts/yargi_model_pipeline.py 2>&1; ls -a arsiv/codex-motor/
```

Expected: ilk komut 4 kez "No such file or directory"; ikincisi 6 öğeyi listeler.

- [ ] **Step 5: Commit**

```bash
git add -A arsiv/ && git commit -m "refactor(motor): Codex katmani arsiv/codex-motor/'a tasindi (avukat karari 2026-07-19)"
```

---

### Task 2: `config/model-routing.json`'ı yeniden yaz

**Files:**
- Modify: `config/model-routing.json` (tam içerik değişimi — Write ile)

- [ ] **Step 1: Dosyayı aşağıdaki TAM içerikle değiştir**

Antigravity task'ları (`arama_plani`…`self_review`) mevcut dosyadan AYNEN korunur — aşağıdaki içerikte de birebir yer alıyor:

```json
{
  "_comment": "Hibrit motor haritasi. Orkestra sefi + TUM tool kullanimi = Claude Fable 5; Fable limiti dolarsa Claude Opus 4.8 (bildirimli operasyonel gecis). Hukuki muhakeme = Antigravity (Gemini 3.1 Pro): usul, 5 ajan, dilekce, simulasyon, revizyon, blog.",
  "_avukat_karari_2026_07_19": "Codex denemesi sona erdi; Codex TUM projeden kaldirildi (arsiv/codex-motor/). Orkestrasyon + tool: claude-fable-5; fallback: claude-opus-4-8; hukuki muhakeme: gemini-3.1-pro (Antigravity). Spec: docs/superpowers/specs/2026-07-19-claude-gemini-donus-design.md",
  "_doctrine_source": "Bu dosya TEK dogruluk kaynagidir (Single Source of Truth). Calistiricilar model, sira ve limitleri buradan okur; dokumanlar yalniz rolleri ve onayli akis sirasini aciklar.",
  "_history": {
    "2026-05-04": "Hibrit motor (Claude+Gemini bridge) onaylandi",
    "2026-05-13": "Antigravity hibrit mimarisine gecildi. Bridge DEPRECATED.",
    "2026-05-19": "FAZ 2: Yargi-MCP-Pro entegrasyonu (Senaryo B - ayri toollar). Eski mcp__claude_ai_Yarg_MCP__* + mcp__claude_ai_Mevuzat_MCP__* yerine mcp__yargi-mcp-pro__* aktif. yargi_mcp + mevzuat_mcp task'lari AYRI kalir (siraili zincir 2B->2C korunur). 9 spesifik mevzuat toolu (search_kanun/search_khk/...) tek search_mevzuat + mevzuat_tur_list[] altinda birlesti. Rate-limit 3sn protokolu gevsetildi (zorunluluk degil, fallback). 2E Akademik decommissioned (Faz 1, 2026-05-19).",
    "2026-07-09": "ARASTIRMA REVIZYONU (avukat karari): 2A Super Stajyer (stajyer_prompt_uret) + Faz D Arguman.ai (arguman_ai) task'lari KALDIRILDI, dosyalar arsiv/ altinda. KVKK maskeleme ERTELENDI (yerel LLM'e gecise kadar). ASAMA 2 cekirdegi = 2B->2C sirali zincir + 2D async paralel. Ana omurga Yargi-MCP-Pro (UYAP entegrasyonu dahil - envanter cikarilinca tools[] guncellenecek).",
    "2026-07-13": "YARGI COK MODELLI ROUTING: 2B sirasi Sol -> Terra -> Luna -> Claude kisa QA. (2026-07-19'da kaldirildi)",
    "2026-07-18": "CLAUDESUZ REVIZYON: orkestrator Codex/Sol (AGENTS.md), 2B Sol->Terra->Sol->Terra, Claude tum rollerden cikarildi. (2026-07-19'da geri alindi)",
    "2026-07-19": "CLAUDE+GEMINI DONUSU (avukat karari): Codex TAMAMEN kaldirildi (arsiv/codex-motor/). Orkestra sefi + tum tool kullanimi claude-fable-5; limit dolarsa claude-opus-4-8 (avukat /model ile gecer, cikti frontmatter + ASAMA bildirimi damgalar). 2B tek elden Claude iteratif derin protokol (derin 15/5, hafif 6/3). Antigravity task'lari degismedi. MemPalace/Gmail/Takvim/NotebookLM MCP'leri yeniden aktif."
  },
  "_last_updated": "2026-07-19",
  "mode": "auto",
  "_mode_values": "auto = config'teki default, sormaz | ask = her ASAMA basinda avukata sor | fixed = sadece default kullan, fallback yok",
  "handoff_protocol": "antigravity_copy_paste",
  "handoff_template_dir": "prompts/gemini/",
  "_handoff_aciklama": "engine='antigravity_manual' olan tasklarda terminal Claude devir blogu basar; avukat Antigravity sag paneline yapistirir; Antigravity uretip Drive'a yazar; avukat terminale doner 'ASAMA X bitti' der; Claude qmd update + MemPalace diary yapar ve bir sonraki ASAMA'ya gecer.",
  "tasks": {
    "director": {
      "engine": "claude",
      "model": "claude-fable-5",
      "model_fallback": "claude-opus-4-8",
      "aciklama": "Director Agent: workflow orkestrasyonu, ASAMA gecisleri, kalite kapilari, kullanici-kontrol komutlari (devam/atla/dur/motor-degistir), Antigravity devir bloklari uretimi"
    },
    "mcp_arac_yonetimi": {
      "engine": "claude",
      "model": "claude-fable-5",
      "model_fallback": "claude-opus-4-8",
      "aciklama": "MemPalace, Google Drive, Calendar, Gmail MCP cagrilari"
    },
    "yargi_mcp": {
      "engine": "claude",
      "model": "claude-fable-5",
      "model_fallback": "claude-opus-4-8",
      "mcp_server": "yargi-mcp-pro",
      "tool_prefix": "mcp__yargi-mcp-pro__",
      "tools": [
        "ictihat_ara",
        "ictihat_getir",
        "semantik_ictihat_ara",
        "aym_ictihat_ara",
        "kurum_karari_ara",
        "kurum_karari_getir"
      ],
      "skill": ".claude/skills/yargi-legal-research-guide/SKILL.md",
      "protokol": "claude_iteratif_derin",
      "modes": {
        "derin": {
          "min_queries": 15,
          "min_full_text": 5
        },
        "hafif": {
          "min_queries": 6,
          "min_full_text": 3
        }
      },
      "aciklama": "Yargi-MCP-Pro 2B derin arastirma — TEK ELDEN Claude Fable 5 (iteratif derin protokol, 6 Faz + Gap Check). Min sorgu/tam-metin kurallari 'modes' altinda. MCP fail -> yargi CLI fallback (rapora mcp_fallback_used: true). 2C yalnizca 2B tamamlanip atif-maddeleri.json uretilince baslar. Sorgu lehceleri ve tuzaklar: yargi-legal-research-guide skill."
    },
    "mevzuat_mcp": {
      "engine": "claude",
      "model": "claude-fable-5",
      "model_fallback": "claude-opus-4-8",
      "mcp_server": "yargi-mcp-pro",
      "tool_prefix": "mcp__yargi-mcp-pro__",
      "tools": [
        "mevzuat_ara",
        "mevzuat_getir",
        "mevzuat_icinde_ara"
      ],
      "skill": ".claude/skills/yargi-legal-research-guide/SKILL.md",
      "aciklama": "Yargi-MCP-Pro Mevzuat sorgulari (FAZ 6 2026-07-09 — yeni Turkce tool seti; 12 tip: KANUN/KHK/TUZUK/YONETMELIK/CB_*/KKY/UY/TEBLIGLER/MULGA). ASAMA 2C esas: mevzuat_ara (phrase Mevzuat Solr — bosluk=AND, AND/OR/NOT literal BOZAR, wildcard*/fuzzy~ calisir; mevzuat_no en kesin; page_size max 20), mevzuat_icinde_ara (tek mevzuat ici YEREL boolean — BUYUK harf AND/OR/NOT, kelime koku), mevzuat_getir (id_type=mevzuat/madde/gerekce/outline; madde_no kisayolu ile tek cagri; 50KB chunk). id_type = kimligin geldigi ALAN ADI. Detay: yargi-legal-research-guide skill."
    },
    "uyap_workspace": {
      "engine": "claude",
      "model": "claude-fable-5",
      "model_fallback": "claude-opus-4-8",
      "cli": "npx dava-cli@latest",
      "skill": ".claude/skills/yargi-uyap-workspace/SKILL.md",
      "aciklama": "UYAP Avukat dava dosyasi cekme (FAZ 6 2026-07-09 — beta). ASAMA 1 hazirlikta opsiyonel: dava UYAP'ta varsa 'dava-cli clone' ile evraklar (.udf/.pdf/.tiff) + INDEX.md yerel klasore iner (~/Documents/YargiPRO/...), sonra arastirma girdisi olur. Delta guncelleme: 'dava-cli sync'. macOS ilk calistirmada Automation izni; Windows'ta Session-0 tuzagi (Scheduled Task yolu). Detay: yargi-uyap-workspace skill."
    },
    "notebooklm_mcp": {
      "engine": "claude",
      "model": "claude-fable-5",
      "model_fallback": "claude-opus-4-8",
      "aciklama": "NotebookLM async paralel kol — 10 iteratif sorgu, polling"
    },
    "kritik_nokta_tespiti": {
      "engine": "claude",
      "model": "claude-fable-5",
      "model_fallback": "claude-opus-4-8",
      "aciklama": "Muvekkil belgelerini okuyup hukuki uyusmazlik tespiti (MCP araclari ile dosya okuma)"
    },
    "arastirma_sentezi": {
      "engine": "claude",
      "model": "claude-fable-5",
      "model_fallback": "claude-opus-4-8",
      "aciklama": "MCP/CLI ciktilarini ASAMA 2 esas raporuna cevirme. Claude'da kalir cunku ham MCP ciktilari ayni oturumda uretiliyor; copy-paste yorgunlugu olusmasin diye Antigravity'ye gitmez. 2026-05-13 karari."
    },
    "arama_plani": {
      "engine": "antigravity_manual",
      "model": "gemini-3.1-pro-preview",
      "prompt_template": "prompts/gemini/arama_plani.md",
      "aciklama": "Yargi/Mevzuat/Akademik icin sorgu terimi listesi + filtre plani uretmek. Antigravity sag panel."
    },
    "usul_raporu": {
      "engine": "antigravity_manual",
      "model": "gemini-3.1-pro-preview",
      "prompt_template": "prompts/gemini/usul_raporu.md",
      "aciklama": "Usul Uzmani (ASAMA 3): yetkili mahkeme, zamanasimi, harc, risk analizi. Antigravity sag panel."
    },
    "stratejik_analiz": {
      "engine": "antigravity_manual",
      "model": "gemini-3.1-pro-preview",
      "prompt_template": "prompts/gemini/stratejik_analiz.md",
      "aciklama": "ASAMA 4: 5 ajan stratejik analiz (4A-4E). Antigravity sag panelde paralel sohbet veya tek-sohbet siralı."
    },
    "dilekce_yazimi": {
      "engine": "antigravity_manual",
      "model": "gemini-3.1-pro-preview",
      "prompt_template": "prompts/gemini/dilekce_yazimi.md",
      "aciklama": "Belge Yazari (ASAMA 5): dilekce v1 / ihtarname / sozlesme taslagi. Antigravity sag panel."
    },
    "savunma_simulasyonu": {
      "engine": "antigravity_manual",
      "model": "gemini-3.1-pro-preview",
      "prompt_template": "prompts/gemini/savunma_simulasyonu.md",
      "aciklama": "Savunma Simulatoru (ASAMA 6): karsi taraf perspektifi + risk flag. Antigravity sag panel."
    },
    "revizyon": {
      "engine": "antigravity_manual",
      "model": "gemini-3.1-pro-preview",
      "prompt_template": "prompts/gemini/revizyon.md",
      "aciklama": "Revizyon Ajani (ASAMA 7): v1 dilekce -> v2 NIHAI. Antigravity sag panel."
    },
    "blog_yazimi": {
      "engine": "antigravity_manual",
      "model": "gemini-3.1-pro-preview",
      "prompt_template": "prompts/gemini/blog_yazimi.md",
      "image_generation": true,
      "image_tool": "imagen_nano_banana",
      "aciklama": "Blog Yazari (THEMIS): SEO uyumlu hukuki blog yazisi + kapak gorseli. Iki tetik: serbest konu (blog yaz: [konu]) veya dava sonrasi (blog yaz dava: [dava-id]). 6 katman Aykut Sesi + 22 alan frontmatter v3 + Imagen kapak. Antigravity sag panel. Cikti: blog.md + blog.cms.md + blog.mail.md + kapak.png. Self-review HARD FAIL -> Drive'a yazilmaz."
    },
    "self_review": {
      "engine": "antigravity_manual",
      "model": "gemini-3.1-pro-preview",
      "prompt_template": "prompts/gemini/self_review.md",
      "aciklama": "Kalite gate: Antigravity kendi ciktisini elestirir (her uretim sonrasi, ayni sohbette)."
    }
  },
  "fallback": {
    "_aciklama": "Iki ayri fallback: (1) MOTOR fallback — Antigravity erisilemezse terminal Claude hukuki uretimi yapar (final_fallback; cikti frontmatter: engine: claude, fallback_used: true). (2) MODEL fallback — Claude Fable 5 limiti dolarsa avukat /model ile claude-opus-4-8'e gecer; gecis ASAMA bildirimi + cikti frontmatter'inda damgalanir.",
    "final_fallback": {
      "engine": "claude",
      "model": "claude-fable-5",
      "model_fallback": "claude-opus-4-8",
      "aciklama": "Antigravity erisilemez/cevap vermezse veya avukat 'fallback claude' derse terminal Claude bu ASAMA'yi uretir."
    },
    "log_fallback_to_mempalace": true,
    "log_fallback_to_event_log": "logs/model-events.jsonl"
  },
  "orchestrator_engine": "claude",
  "orchestrator_model": "claude-fable-5",
  "orchestrator_model_fallback": "claude-opus-4-8"
}
```

- [ ] **Step 2: JSON geçerliliğini doğrula**

```bash
python -m json.tool config/model-routing.json > /dev/null && echo JSON-OK
```

Expected: `JSON-OK`

- [ ] **Step 3: Codex kalıntısı kalmadığını doğrula**

```bash
grep -inE "codex|gpt-5|terra|luna|ordered_multi_model|pipeline" config/model-routing.json; echo "exit=$?"
```

Expected: eşleşme yok, `exit=1`.

- [ ] **Step 4: Commit**

```bash
git add config/model-routing.json && git commit -m "feat(motor): model-routing Claude Fable 5 + Opus 4.8 fallback; codex/pipeline girdileri kaldirildi"
```

---

### Task 3: `CLAUDE.md`'yi tek anayasa hâline getir

**Files:**
- Modify: `CLAUDE.md` (proje kökü)

- [ ] **Step 1: Tepe banner'ını değiştir**

Eski blok ("> **GUNCEL DURUM (2026-07-18, avukat karari):** Sistemin orkestratoru SIMDILIK Codex CLI'dir..." ile başlayıp "...avukat Claude'a donus kararini verirse yeniden birincil olur." ile biten 8 satırlık blockquote) şu blokla değiştirilir:

```markdown
> **GUNCEL DURUM (2026-07-19, avukat karari):** Codex denemesi sona erdi;
> Codex TUM PROJEDEN kaldirildi (arsiv: `arsiv/codex-motor/`). Orkestra sefi
> ve TUM tool kullanimi CLAUDE FABLE 5'tir (`claude-fable-5`); Fable limiti
> dolarsa CLAUDE OPUS 4.8 (`claude-opus-4-8`) devralir — gecis avukatin
> `/model` komutuyla yapilir, ASAMA bildirimi + cikti frontmatter'i hangi
> modelin calistigini damgalar. Hukuki muhakeme Antigravity/Gemini 3.1 Pro'da.
> BU DOSYA sistemin TEK anayasasidir.
> Spec: `docs/superpowers/specs/2026-07-19-claude-gemini-donus-design.md`
```

- [ ] **Step 2: Doktrine "Araçsız Künye Yasağı" maddesini ekle**

"0-HALUSINASYON + LEHE YORUM YASAGI DOKTRINI" bölümündeki "Mutlak yasaklar (ozet)" listesinin 6. maddesinden sonra ekle:

```markdown
7. **ARACSIZ KUNYE YASAGI (benchmark dersi 2026-07-18 — KALICI):** Bedesten
   erisimli arac (Yargi-MCP-Pro veya `yargi`/`mevzuat` CLI) olmadan hicbir
   motor kunye yazamaz. Aracsiz uretim zorunluysa ciktinin basina
   `ARACSIZ — kunye icermez` damgasi konur. (Benchmark: +YargiPro her modele
   +2…+7 puan katti; aracsiz hukuki uretim standart altidir.)
```

- [ ] **Step 3: "Her Zaman Derin Mod" paragrafını değiştir**

Eski:

```
**ONEMLI - Her Zaman Derin Mod:** Yargi MCP ve Mevzuat MCP her sorguda
**iteratif derin protokol** ile calisir. 2B, `config/model-routing.json` ->
`tasks.yargi_mcp.pipeline` sirasindaki Sol → Terra → Luna → Claude kisa QA
hattidir. Luna nihai 2B raporunu yazar; Claude 2B sentezi yapmaz. Mevzuat
motoru `tasks.mevzuat_mcp`'den okunur. Tek-shot sorgu yasaktir. Yargi CLI /
Mevzuat CLI yalniz MCP fail durumunda fallback olarak devreye girer.
```

Yeni:

```
**ONEMLI - Her Zaman Derin Mod:** Yargi MCP ve Mevzuat MCP her sorguda
**iteratif derin protokol** ile calisir. 2B ve 2C TEK ELDEN Claude Fable 5
tarafindan yurutulur (`config/model-routing.json` -> `tasks.yargi_mcp` /
`tasks.mevzuat_mcp`, engine: claude; protokol: 6 Faz + Gap Check, min sorgu
kurallari `modes` altinda). Tek-shot sorgu yasaktir. Yargi CLI / Mevzuat CLI
yalniz MCP fail durumunda fallback olarak devreye girer.
```

- [ ] **Step 4: Task -> Default Motor Haritası satırını değiştir**

Eski satır:

```
| 2B YargiMCP | Arastirmaci (ASAMA 2B) | Sol → Terra → Luna → Claude kisa QA | Config pipeline |
```

Yeni:

```
| 2B YargiMCP | Arastirmaci (ASAMA 2B) | Claude Fable 5 (iteratif derin protokol) | Claude Opus 4.8 |
```

- [ ] **Step 5: "Claude (terminal) - Kalici Gorevler" maddesini değiştir**

Eski:

```
- Yargi 2B orkestrasyonu (`scripts/yargi_model_pipeline.py`); Claude burada
  yalniz 4. asama kisa kalite kapisidir
```

Yeni:

```
- Yargi 2B derin arastirmasi (Yargi-MCP-Pro, tek elden — iteratif derin
  protokol: derin mod min 15 sorgu / 5 tam metin, hafif mod 6 / 3)
```

- [ ] **Step 6: Model Metadata örneğini güncelle**

Eski satır: `model: gemini-3.1-pro-preview | claude-opus-4.7`
Yeni satır: `model: gemini-3.1-pro-preview | claude-fable-5 | claude-opus-4-8`

- [ ] **Step 7: Kısayol komut satırını değiştir**

Eski:

```
| `arastir yargi: [kritik nokta]` | Arastirma - 2B Sol→Terra→Luna→Claude kisa QA pipeline'i |
```

Yeni:

```
| `arastir yargi: [kritik nokta]` | Arastirma - 2B Yargi-MCP-Pro (Claude Fable 5, iteratif derin protokol) |
```

- [ ] **Step 8: Kalıntı süpürmesi**

```bash
grep -inE "codex|gpt-5|terra|luna|yargi_model_pipeline|opus-4.7|opus-4-7" CLAUDE.md
```

Kalan her eşleşme için kural: 2B çok-model referansı → "Claude Fable 5 tek elden iteratif derin protokol"; `claude-opus-4.7`/`4-7` → `claude-fable-5` (fallback bağlamındaysa `claude-opus-4-8`); Codex durum notu → kaldır. Expected (düzeltme sonrası): eşleşme yok.

- [ ] **Step 9: Commit**

```bash
git add CLAUDE.md && git commit -m "feat(anayasa): CLAUDE.md tek anayasa — Fable 5 + Opus 4.8, codex/pipeline referanslari temizlendi, Aracsiz Kunye Yasagi doktrine eklendi"
```

---

### Task 4: `ARASTIRMA.md`'yi Claude tek-elden hatta döndür

**Files:**
- Modify: `ARASTIRMA.md`

- [ ] **Step 1: Satır 47 — Director referansı**

Eski: `...Avukat bu komutu yazdığında Director (Codex/Sol — bkz. AGENTS.md) 'ARASTIRMA.md'yi okuyup...`
Yeni: `...Avukat bu komutu yazdığında Director (Claude Fable 5 — bkz. CLAUDE.md) 'ARASTIRMA.md'yi okuyup...`

- [ ] **Step 2: Faz 1 kanonik çalıştırma bloğu (satır 113-123)**

Eski blok ("Kanonik çalıştırma:" + bash bloğu + "Model sırası ... Komut `0` dönmeden Faz 2'ye geçilmez." paragrafı) şununla değiştirilir:

```markdown
Faz 1'i **Claude Fable 5 tek elden** yürütür (`config/model-routing.json ->
tasks.yargi_mcp`, hafif mod: min 6 sorgu / 3 tam metin). Ayrı pipeline
scripti YOKTUR — sorgular bu oturumda Yargı-MCP-Pro araçlarıyla atılır,
MCP fail olursa `yargi` CLI fallback (rapora `mcp_fallback_used: true`).
Faz 1 çıktıları (`01-Ictihat-taramasi.md` + `atif-maddeleri.json`)
yazılmadan Faz 2'ye geçilmez.
```

- [ ] **Step 3: Frontmatter örnekleri (satır 149-152 ve 200-204)**

`01-Ictihat-taramasi.md` örneğinde eski:

```
engine: codex
pipeline_stage: 3
mcp: yargi-mcp-pro
```

Yeni:

```
engine: claude
model: claude-fable-5
mcp: yargi-mcp-pro
```

`02-Mulga-denetim.md` örneğinde eski: `engine: codex` → Yeni: `engine: claude`

- [ ] **Step 4: Faz 3 sentez paragrafı (satır 229-231)**

Eski:

```
Faz 1-2 çıktılarının nihai sentezi Sol'dadır (pipeline stage 3 çıktısı temel
alınır); Terra bağımsız künye teyidi yapar, deterministik kapı `cikti_dogrula.py`
yapısal kontrolü tamamlar. Antigravity/Gemini gerekmez (hafiflik prensibi).
```

Yeni:

```
Faz 1-2 çıktılarının nihai sentezini **Claude Fable 5** yazar; ardından AYNI
oturumda bağımsız künye içerik-teyidi yapılır (her documentId yeniden çekilip
alıntı kıyaslanır) ve deterministik kapı `cikti_dogrula.py` yapısal kontrolü
tamamlar. Antigravity/Gemini gerekmez (hafiflik prensibi).
```

- [ ] **Step 5: `arastirma-cevabi.md` frontmatter örneği (satır 236)**

Eski: `engine: codex` → Yeni: `engine: claude`

- [ ] **Step 6: Dosya sahipleri tablosu (satır 357-360)**

Eski hücreler: `Director/Sol (Faz 0)`, `Sol sentez + Yargı araçları (Faz 1); Terra kısa QA kapısı`, `Sol + Mevzuat araçları (Faz 2)`, `Sol (Faz 3) + Terra teyit`
Yeni hücreler (sırasıyla): `Director/Claude (Faz 0)`, `Claude sentez + Yargı araçları (Faz 1)`, `Claude + Mevzuat araçları (Faz 2)`, `Claude (Faz 3) + bağımsız künye teyidi`

- [ ] **Step 7: Kalıntı süpürmesi + commit**

```bash
grep -inE "codex|gpt-5|\bSol\b|Terra|Luna|yargi_model_pipeline" ARASTIRMA.md
```

Expected: eşleşme yok. Sonra:

```bash
git add ARASTIRMA.md && git commit -m "feat(danisma): ARASTIRMA.md Claude tek-elden hatta dondu (pipeline referanslari kaldirildi)"
```

---

### Task 5: `FIVEAGENTS.md` + `ajanlar/arastirmaci/SKILL.md`

**Files:**
- Modify: `FIVEAGENTS.md` (satır 181, 377, 640, 669, 1259)
- Modify: `ajanlar/arastirmaci/SKILL.md` (satır 4, 23, 204-206, 943, 966)

- [ ] **Step 1: FIVEAGENTS.md — beş noktayı değiştir**

| Konum | Eski | Yeni |
|---|---|---|
| 181 | `Config sirasi: Sol → Terra → Luna → Claude kisa QA` | `Claude Fable 5 tek elden (iteratif derin protokol)` |
| 377 | `[2B] YARGI-MCP-PRO (Sol → Terra → Luna → Claude kisa QA)` | `[2B] YARGI-MCP-PRO (Claude Fable 5 — iteratif derin protokol)` |
| 640 | `sirasiyla Sol → Terra → Luna → Claude kisa QA olarak calisir. Luna nihai 2B` (cümleyi kapsayan blok) | `Claude Fable 5 tek elden calisir; nihai 2B raporunu da Claude yazar.` (cümle akışına göre uyarla — anlam: tek motor, tek sentez) |
| 669 | `[2B] YARGI-MCP-PRO  (Sol ana tarama -> Terra denetim -> Luna nihai 2B -> Claude kisa QA)` | `[2B] YARGI-MCP-PRO  (Claude Fable 5: tarama -> tam metin -> sentez -> kalite kontrol)` |
| 1259 | `2B Yargi MCP (Sol→Terra→Luna→Claude QA): 9. HD + HGK + IBK son 2 yil` | `2B Yargi MCP (Claude Fable 5): 9. HD + HGK + IBK son 2 yil` |

- [ ] **Step 2: ajanlar/arastirmaci/SKILL.md — beş noktayı değiştir**

| Konum | Eski | Yeni |
|---|---|---|
| 4 (versiyon satırı) | `Versiyon: 3.1 (2B Yargi sirali Sol/Terra/Luna + kisa Claude kalite kapisi;` | `Versiyon: 3.2 (2B Yargi TEK ELDEN Claude Fable 5 — iteratif derin protokol;` |
| 23 | `Sol ana arastirma, Terra bagimsiz denetim, Luna nihai 2B raporu, Claude` (cümle bloğu) | `Claude Fable 5 tum 2B'yi tek elden yurutur: tarama, tam metin teyidi, nihai rapor ve kalite kontrolu.` |
| 204-206 | Kanonik çağrı bash bloğu (`python3 scripts/yargi_model_pipeline.py --mod derin ...`) + `Calistirici tasks.yargi_mcp.pipeline sirasini uygular. Luna...` | Bash bloğu SİLİNİR; yerine: `2B dogrudan bu oturumda Claude Fable 5 tarafindan yurutulur (config: tasks.yargi_mcp, mod: derin — min 15 sorgu / 5 tam metin). Ayri calistirici script YOKTUR.` |
| 943 | `2B'nin nihai raporunu Luna yazar; 2B` (cümle) | `2B'nin nihai raporunu Claude yazar; 2B` |
| 966 | `2B Sol/Terra/Luna + Claude QA -> bulunan kararlar + atif maddeleri + son 5 yil seyri` | `2B Claude Fable 5 -> bulunan kararlar + atif maddeleri + son 5 yil seyri` |

- [ ] **Step 3: Kalıntı süpürmesi + commit**

```bash
grep -inE "codex|gpt-5|\bSol\b|Terra|Luna|yargi_model_pipeline" FIVEAGENTS.md ajanlar/arastirmaci/SKILL.md
```

Expected: eşleşme yok (kalan varsa aynı kuralla düzelt). Sonra:

```bash
git add FIVEAGENTS.md ajanlar/arastirmaci/SKILL.md && git commit -m "feat(ajanlar): 2B tek elden Claude Fable 5 — FIVEAGENTS + arastirmaci SKILL guncellendi"
```

---

### Task 6: `.claude/commands/` üçlüsünü güncelle

**Files:**
- Modify: `.claude/commands/arastir-yargi.md`
- Modify: `.claude/commands/arastir.md`
- Modify: `.claude/commands/arastir-danisma.md`

- [ ] **Step 1: arastir-yargi.md — "Kanonik Çalıştırıcı" bölümünü (satır 24-35) değiştir**

Eski bölüm (başlık + bash bloğu + "Sıra: Sol ana araştırma..." paragrafı) şununla değiştirilir:

```markdown
## Kanonik Çalıştırıcı

2B araştırmasını **bu oturumda Claude Fable 5 tek elden** yürütür
(`config/model-routing.json -> tasks.yargi_mcp`, mod: derin — min 15 sorgu /
min 5 tam metin). Ayrı pipeline scripti YOKTUR. Fable limiti dolarsa avukat
`/model` ile Claude Opus 4.8'e geçer; rapor frontmatter'ı modeli damgalar.
Aşağıdaki 6 Faz + Gap Check tamamlanmadan 2C başlatılmaz.
```

- [ ] **Step 2: arastir-yargi.md — "Nihai 2B Raporu ve Kalite Kapısı" bölümünü (satır 125-135) değiştir**

Eski bölüm (Luna/Claude 4. aşama/`yargi-model-pipeline.json` maddeleri + "Kanonik rapor frontmatter'ı: `engine: codex`..." paragrafı) şununla değiştirilir:

```markdown
## Nihai 2B Raporu ve Kalite Kapısı

- Claude, `02-Arastirma/yargi-bulgulari.md` ile
  `02-Arastirma/atif-maddeleri.json` dosyalarını üretir.
- Üretimden SONRA aynı oturumda kalite kontrol listesi (aşağıda) uygulanır;
  eksik varsa yalnız eksik mini-kol yeniden çalıştırılır.
- 2C yalnız `atif-maddeleri.json` dolu ve kalite listesi tam ise başlar.

Kanonik rapor frontmatter'ı: `engine: claude`, `model: claude-fable-5`
(fallback kullanıldıysa `claude-opus-4-8` + `fallback_used: true`),
`mcp: yargi-mcp-pro`, `status: TASLAK`.
```

- [ ] **Step 3: arastir-yargi.md — kalite kapısı checklist maddelerini (satır 144-145) değiştir**

Eski:

```
- [ ] Engine frontmatter `engine: codex`, `pipeline_stage: 3`, `mcp: yargi-mcp-pro` mi?
- [ ] Claude kalite kapısı `GECTI` mi (nihai sentez yapmadan)?
```

Yeni:

```
- [ ] Engine frontmatter `engine: claude`, `model: claude-fable-5`, `mcp: yargi-mcp-pro` mi?
- [ ] Üretim sonrası kalite kontrol listesi tamamlandı mı?
```

- [ ] **Step 4: arastir.md — workflow diyagramı (satır 43), 2B bölümü (satır 55-66), progress örneği (satır 85), checklist (satır 108)**

Satır 43 eski: `+-- 2B Sol→Terra→Luna→Claude QA ──> 2C Yargı-MCP-Pro Mevzuat (SIRALI ZİNCİR)`
Yeni: `+-- 2B Claude Fable 5 (Yargı-MCP-Pro) ──> 2C Yargı-MCP-Pro Mevzuat (SIRALI ZİNCİR)`

"### 2B Yargı — `/arastir-yargi` protokolü" bölümünde eski ilk üç madde (kanonik çağrı bash satırı + "Model sırası ... Luna nihai 2B çıktısını, Claude yalnız kısa kalite kararını üretir") şununla değiştirilir:

```markdown
- 2B **bu oturumda Claude Fable 5 tek elden** yürütülür
  (`config/model-routing.json -> tasks.yargi_mcp`, mod: derin); ayrı
  pipeline scripti YOKTUR
- Min 15 sorgu / 6 faz / temporal evolution / min 5 tam metin
```

(Devam eden temporal/backoff/atıf maddeleri aynen kalır.) Bölümün son maddesi eski: "Komut `0` dönmeden ve manifestte `claude_gate: GECTI` olmadan 2C başlamaz" → Yeni: "`atif-maddeleri.json` üretilmeden ve 2B kalite listesi tamamlanmadan 2C başlamaz".

Satır 85 eski: `2B Yargı: Sol tamamlandı, Terra çalışıyor; Luna/Claude QA bekliyor`
Yeni: `2B Yargı: Faz 4 temporal evolution çalışıyor (sorgu 11/15)`

Satır 108 eski: `- [ ] 2B sırası Sol→Terra→Luna→Claude QA olarak tamamlandı ve kapı GECTI mi?`
Yeni: `- [ ] 2B 6 Faz + Gap Check tamamlandı mı (Claude Fable 5 tek elden)?`

- [ ] **Step 5: arastir-danisma.md — Faz 1 satırları (satır 32-33) ve adım 4 (satır 50-52)**

Satır 32-33 eski: `(hafif protokol: min 6 sorgu, min 3 tam metin teyidi; Sol→Terra→Luna→Claude QA)`
Yeni: `(hafif protokol: min 6 sorgu, min 3 tam metin teyidi; Claude Fable 5 tek elden)`

Adım 4 eski (bash'li cümle: "Faz 1'i `python3 scripts/yargi_model_pipeline.py --mod hafif --cikti ...` ile çalıştır. Çıkış kodu `0` değilse Faz 2'ye geçme; Claude nihai sentez yapmaz, yalnız kısa QA kapısıdır.") şununla değiştirilir:

```markdown
4. Faz 1'i **bu oturumda Claude Fable 5 tek elden** çalıştır (hafif mod:
   min 6 sorgu / 3 tam metin — `tasks.yargi_mcp.modes.hafif`). Faz 1
   çıktıları yazılmadan Faz 2'ye geçme.
```

- [ ] **Step 6: Kalıntı süpürmesi + commit**

```bash
grep -inE "codex|gpt-5|\bSol\b|Terra|Luna|yargi_model_pipeline" .claude/commands/arastir.md .claude/commands/arastir-yargi.md .claude/commands/arastir-danisma.md
```

Expected: eşleşme yok. Sonra:

```bash
git add .claude/commands/ && git commit -m "feat(komutlar): arastir ailesi Claude Fable 5 tek-elden protokole gecti"
```

---

### Task 7: `dersler/sistem.md`'ye dönüş dersini ekle

**Files:**
- Modify: `dersler/sistem.md` (dosya sonuna ekle)

- [ ] **Step 1: Yeni ders kaydını ekle**

```markdown
## 2026-07-19 — Codex denemesi geri alındı: Claude+Gemini dönüşü
- KAÇIRILAN: Benchmark puanı tek başına orkestratör seçimi için yeterli
  kriter değildi — Codex/Sol orkestrasyonu avukatın çalışma akışında
  (kontrol kapıları, MCP entegrasyonları, MemPalace/Gmail/Takvim
  otomasyonu) beklentiyi karşılamadı.
- DÜZELTME: Avukat kararıyla (2026-07-19) Codex TÜM projeden kaldırıldı
  (arsiv/codex-motor/). Orkestra şefi + tüm tool kullanımı Claude Fable 5;
  limit dolarsa Claude Opus 4.8 (bildirimli). Hukuki muhakeme
  Antigravity/Gemini 3.1 Pro'da kaldı. 2B tek elden Claude iteratif derin
  protokol. Spec: docs/superpowers/specs/2026-07-19-claude-gemini-donus-design.md
- KURAL ADAYI: Motor/orkestratör değişikliği kararında benchmark puanına ek
  olarak entegrasyon maliyeti (MCP, hook, hafıza katmanları) ve avukatın
  fiili kullanım deneyimi ZORUNLU kriterdir; tek metrikle motor değiştirilmez.
```

- [ ] **Step 2: Commit**

```bash
git add dersler/sistem.md && git commit -m "docs(dersler): Codex denemesinin geri alinma dersi kaydedildi"
```

---

### Task 8: Kalıcı hafızayı güncelle (repo dışı — commit yok)

**Files:**
- Create: `C:\Users\user\.claude\projects\D--projelerim-aktif-projelerimm-Eski-Claude-ant-grav-ty\memory\sistem-claude-gemini-donusu.md`
- Delete: aynı dizinde `sistem-codex-orkestrasyonu.md` (artık yanlış bilgi)
- Modify: aynı dizinde `MEMORY.md` (ilk satırdaki pointer)

- [ ] **Step 1: Yeni memory dosyasını yaz**

```markdown
---
name: sistem-claude-gemini-donusu
description: "2026-07-19'dan itibaren orkestra şefi + tüm tool kullanımı Claude Fable 5 (limit dolarsa Opus 4.8); hukuki muhakeme Antigravity/Gemini 3.1 Pro; Codex tamamen kaldırıldı"
metadata:
  type: project
---

Avukat kararı (2026-07-19): Codex/Sol denemesi (2026-07-18) geri alındı ve
**Codex tüm projeden kaldırıldı** (`arsiv/codex-motor/`). Yeni sabit düzen:
orkestra şefi + TÜM tool kullanımı (Yargı-MCP-Pro, Mevzuat, NotebookLM,
MemPalace, Drive, Gmail, Takvim, UYAP) **Claude Fable 5**; Fable limiti
dolarsa avukat `/model` ile **Claude Opus 4.8**'e geçer (çıktı frontmatter +
ASAMA bildirimi damgalar). Hukuki muhakeme (ASAMA 3-7, ihtarname/dilekçe,
blog, self-review) **Antigravity/Gemini 3.1 Pro**. 2B derin araştırma tek
elden Claude iteratif derin protokol (derin 15/5, hafif 6/3) — çok-modelli
pipeline ve Luna geri gelmez. CLAUDE.md yeniden TEK anayasa; kontrol
kapılarının tamamı aktif (MemPalace wake-up/diary, 4 kalite kapısı,
doktrin_lint hook, cikti_dogrula + bağımsız künye teyidi, self-review).
Kalıcı ders: araçsız motor künye yazamaz ("ARAÇSIZ — künye içermez").
Spec: docs/superpowers/specs/2026-07-19-claude-gemini-donus-design.md
İlgili: [[harclar-63-ceza-7566-degisikligi]]
```

- [ ] **Step 2: Eski memory dosyasını sil ve MEMORY.md pointer'ını değiştir**

`sistem-codex-orkestrasyonu.md` silinir. `MEMORY.md`'deki eski satır:

`- [SİSTEM DURUMU: Codex orkestrasyonu](sistem-codex-orkestrasyonu.md) — 2026-07-18'den beri orkestratör Codex/Sol (AGENTS.md); Claude şimdilik devre dışı — yeni oturumda ÖNCE bunu oku`

şu satırla değiştirilir:

`- [SİSTEM DURUMU: Claude+Gemini dönüşü](sistem-claude-gemini-donusu.md) — 2026-07-19'dan beri orkestra şefi + tool kullanımı Claude Fable 5 (limit→Opus 4.8), muhakeme Gemini 3.1 Pro; Codex kaldırıldı`

---

### Task 9: Uçtan uca doğrulama

- [ ] **Step 1: Codex kalıntı süpürmesi (tarihçe + vendor istisnaları hariç)**

```bash
grep -rinE "codex|gpt-5\.6|ordered_multi_model|yargi_model_pipeline" --include="*.md" --include="*.json" --include="*.py" . \
  | grep -v "^\./arsiv/" | grep -v "^\./dersler/" | grep -v "^\./docs/superpowers/" \
  | grep -v "^\./isbu-ofis/" | grep -v "yargi-agentic-deep-research"
```

Expected: çıktı boş. (`Terra|Luna|\bSol\b` ayrıca CLAUDE.md/FIVEAGENTS/ARASTIRMA/SKILL/komut dosyalarında task içi adımlarla süpürüldü.)

- [ ] **Step 2: Deterministik kapılar**

```bash
python -m json.tool config/model-routing.json > /dev/null && echo JSON-OK
python scripts/doktrin_lint.py | tail -2
python -m pytest scripts/tests -q 2>&1 | tail -3
```

Expected: `JSON-OK`; `DOKTRIN LINT: PASS`; pytest yeşil (fail varsa incele — bu plan scripts/tests'e dokunmaz, fail beklenmiyor).

- [ ] **Step 3: Kalan düzeltme varsa uygula ve commit et**

```bash
git status --short
git add -A && git commit -m "chore(dogrulama): codex kalinti supurmesi sonrasi son duzeltmeler" # yalniz degisiklik varsa
```

- [ ] **Step 4: Kapanış commit'i kontrolü**

```bash
git log --oneline -8
```

Expected: Task 1-7 commit'leri görünür; working tree temiz.

- [ ] **Step 5: Kabul testi (avukatla — bu planın dışında)**

Spec §11.5 smoke testi YENİ oturumda avukat tarafından koşulur:
`arastir danisma: <gerçek hukuki soru>` → çıktı Kaynak Doğrulama Tablolu,
künyeler documentId'li, frontmatter `engine: claude, model: claude-fable-5`.
(yargi-mcp-pro OAuth hâlâ bozuksa CLI fallback devreye girer ve rapora
`mcp_fallback_used: true` düşer — bu başarısızlık DEĞİLDİR.)

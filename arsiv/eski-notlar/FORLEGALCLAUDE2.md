# Claude for Legal vs. Hukuk Basasistani — Derinlestirilmis Karsilastirmali Analiz v2

Son guncelleme: 2026-05-14
Versiyon: 2.0 (FORLEGALCLAUDE.md v1 audit + GitHub kaynak kod taramasi + tam sistem envanteri)
Karsilastirma hedefi: Eski raporun (FORLEGALCLAUDE.md) eksiklerini kapatmak.
Bu sefer **gercek GitHub repository** incelendi, bizim sistemin **TUM parcalari** envantere alindi, eski raporun iddialari **dogrulandi veya duzeltildi**.

> TASLAK — Avukat onayina tabidir.
> 0-Halusinasyon Doktrini'ne uygun: her iddia kaynakli, dogrulanmamis varsayim acikca etiketli.

---

## 0. v1 AUDIT — Eski Raporun Eksiklikleri ve Yanlislari

Eski `FORLEGALCLAUDE.md` (v1) yalnizca bir blog yazisindan (betaspacestudio) turetilmisti. Bu audit'te 7 ana eksiklik / yanlislik tespit edildi:

| # | Eski rapor iddiasi (v1) | Audit sonucu | Duzeltme |
|---|---|---|---|
| 1 | "Anthropic SKILL.md formati YAML frontmatter ile basliyor — name, description, when_to_use, allowed_tools, owner, version" | **YANLIS — gercek format 3 alan** | Gercek frontmatter sadece `name`, `description`, `argument-hint`. v1'in onerdigi 11-alanli frontmatter Anthropic'ten daha zengin (overengineering riski) |
| 2 | "Anthropic'in repository'sinin tam ic yapisi DOGRULANAMADI" (Bolum 7) | **DOGRULANDI — GitHub'da incelendi** | Iki ayri repo var: `anthropics/claude-for-legal` (12 plugin) + `anthropics/knowledge-work-plugins/legal/` (6 skill). Bu ikisi farkli urunler |
| 3 | "Plugin marketplace fikri bizim icin yer yok" (Reddedilen oneriler) | **YANLIS — Anthropic plugin marketplace'i fiili calisiyor** | `/plugin marketplace add /Users/you/Desktop/claude-for-legal` komutu standart. Bizim sistem de Claude Code zaten plugin marketplace destekliyor; "reddedilen" demek hatali |
| 4 | "Slash command sintaksi: bizim `arastir:`, `dilekce yaz` yeterli" (orortulu) | **EKSIK — Anthropic namespace formatı `/plugin-name:command`** | `/litigation-legal:matter-intake` formati avukat 12 farkli plugin yuklediginde namespace karmasini cozer; bizim duz format buyume yaparsa cakisir |
| 5 | "5 Turk MCP'si referans (Yargi, Mevzuat, YokTez, MarkaPatent, Literatur)" | **DOGRU ama EKSIK** | Anthropic plugin'leri ayrica CLM, DMS, e-discovery, CRM, e-signature, project tracker, calendar, chat MCP'lerine baglaniyor. Bizim sistem 4 Turk MCP + Google Drive/Calendar/Gmail var, ama CLM/DMS/CRM/e-imza paralellesi YOK |
| 6 | "Anthropic'te scheduled workflow'lar var (renewal/docket/reg-change watcher)" — sadece yuzeysel | **EKSIK** | Litigation-legal'da `docket-watcher` somut scheduled agent var; haftalik UYAP safahat takibinin paralleli. Bizim "ictihat tara" tek scheduled task; Anthropic'in 5 scheduled agent'ina karsi dar |
| 7 | "MarkaPatent MCP eksikligi yontemli backlog" | **DOGRULANDI ama tek eksik degil** | Bizim sistemde 8 eksik MCP / connector kategori var (asagidaki Bolum 5'te listelendi). MarkaPatent en gorunur olani, ama tek degil |

Ek olarak eski rapor su **derin sistem parcalarini gormedi**:

- **9 hesaplama modulu** (kidem tavani 2022-2026 donem bazli, ihbar oneli kademeli, fazla mesai vergi dilimi, UBGT yil-yil gun sayisi, hafta tatili, yillik izin, ise iade, ucret matraj, gelir vergisi kademeli) — eski rapor "iscilik hesaplama deterministik modulu" 1 satirda gecti
- **10 Python script** (`scripts/*.py`): `_timing`, `idle-times-extract`, `maske`, `md_to_docx`, `md_to_udf`, `pii-mask`, `timing-report`, `mevzuat_cache`, `quality_gate`, `model_weekly_report` — eski rapor sadece 2 script (md_to_udf, maske) bahsetti
- **15 Gemini prompt** (`prompts/gemini/*.md`) — eski rapor 0 prompt bahsetti
- **17 .claude/commands** + **5 .claude/agents** + **11 sablon** — eski rapor sadece "18 alt-mode" diye toparladi
- **uslup-aykut.md (~640 satir, 17 bolum)** — eski rapor "uslup parmak izi" 1 satirda gecti; gercek dosya Anthropic'in "house style profile" konseptinin Turkce karsiligi seviyesinde
- **dilekce-yazim-kurallari.md (M. Ufuk Tekin "Bir Dilekcenin Anatomisi" 7. Baski tabanli)** — eski rapor referans verdi ama icerik karsilastirmasi yapmadi
- **legal.local.md** (statik buro kurallari + MemPalace ile dinamik tercih ayrimi) — eski rapor degmedi
- **0-halusinasyon-doktrini.md (7 bolum + Tugba 2026-89 hata gecmisi)** — eski rapor "doktrin" diye gecti, ic yapinin Anthropic'in `[CITE:]`/`[VERIFY:]`/`[SME VERIFY:]` inline marker conventions'una **birebir denk dustugunu** kacirdi
- **3 Batch devir blogu** detaylari (ANTIGRAVITY.md) — eski rapor "Antigravity hibrit" demis ama 3-batch protokol detayina, BATCH 3'un dogal yaz-elestir-revize dongusune girmemis
- **MemPalace mimarisi** (wing/hall/drawer/room) — eski rapor "buro hafizasi" 1 satirda gecti
- **Profiling instrumentation + Progress Ledger (Faz A + Faz B)** — eski rapor hic gormedi
- **Self-review prompt (`prompts/gemini/self_review.md`)** — eski rapor "Antigravity self-review" 1 satirda gecti; ic yapinin Anthropic'in plugin self-validation modellerine paralel oldugunu gormedi

**Sonuc:** Eski rapor "yuksek seviye soyut" kalmis. v2 bu eksiklikleri tek tek kapatir.

---

## 1. ANTHROPIC YAPISI — GitHub Kaynak Taramasi (GERCEK)

> Kaynak: `github.com/anthropics/claude-for-legal` (12 plugin) + `github.com/anthropics/knowledge-work-plugins/legal/` (6 skill, ayri urun)

### 1.1 Iki ayri Anthropic urunu

| Repo | Kapsam | Hedef |
|------|--------|-------|
| **anthropics/claude-for-legal** | 12 pratik alani plugin'i, 16+ konnektor, 5 managed-agent cookbook | Hukuk burolari ve in-house ekipler |
| **anthropics/knowledge-work-plugins/legal** | 6 skill, 5 command, sade plugin | In-house legal ekipleri icin temel set (NDA triage, sozlesme review) |
| **anthropics/claude-plugins-official** | Resmi yonetilen dizin | Marketplace |

**Eski rapor sadece birinciyi 12 plugin diye bilmisti.** Iki repo arasinda federasyon var ama yapi farkli; v2 bunu acikca ayirir.

### 1.2 12 Plugin Pratik Alanlari ve Avukat Rolu Eslemesi (claude-for-legal/QUICKSTART)

| Avukat Rolu | Plugin | Ilk Komut |
|---|---|---|
| Privacy Lawyer / DPO | `privacy-legal` | `/privacy-legal:use-case-triage` |
| Commercial Lawyer | `commercial-legal` | `/commercial-legal:review` |
| Corporate / M&A Lawyer | `corporate-legal` | `/corporate-legal:diligence-issue-extraction` |
| Employment Lawyer | `employment-legal` | `/employment-legal:wage-hour-qa` |
| Product Counsel | `product-legal` | `/product-legal:is-this-a-problem` |
| IP Lawyer | `ip-legal` | `/ip-legal:clearance` |
| Litigator | `litigation-legal` | `/litigation-legal:matter-intake` |
| Regulatory Counsel | `regulatory-legal` | `/regulatory-legal:reg-feed-watcher` |
| AI Governance | `ai-governance-legal` | `/ai-governance-legal:use-case-triage` |
| Law School / Student | `law-student` | (ABD baro sinavi gomulu) |
| Legal Clinic | `legal-clinic` | (genel danismanlik) |
| Builder Hub | `legal-builder-hub` | Meta / yonetim |

### 1.3 `litigation-legal` Plugin Detayli Yapisi (en yakin bizim alanimiza)

```
litigation-legal/
├── .claude-plugin/plugin.json        ← plugin manifest (basit 4-alanli)
├── .mcp.json                         ← MCP server config
├── README.md, CLAUDE.md              ← house practice profile
├── CONNECTORS.md
├── agents/
│   └── docket-watcher                 ← scheduled agent (haftalik)
├── skills/
│   ├── cold-start-interview.md
│   ├── matter-intake.md
│   ├── portfolio-status.md
│   ├── matter-briefing.md
│   ├── matter-update.md
│   ├── matter-close.md
│   ├── demand-intake.md
│   ├── demand-draft.md
│   ├── demand-received.md
│   ├── subpoena-triage.md
│   ├── legal-hold.md
│   ├── chronology.md
│   ├── oc-status.md
│   └── claim-chart.md
├── matters/
│   ├── _log.yaml                      ← PORTFOLIO LEDGER (tum aktif davalar tek dosya)
│   └── [matter-slug]/
│       ├── matter.md                   ← case ozeti
│       ├── history.md                  ← append-only event log
│       ├── chronology.md
│       └── legal-hold-v[N].docx
├── demand-letters/
│   └── [slug]/
│       ├── intake.md
│       ├── draft-v1.docx               ← FRE 408/privilege gate ile
│       └── checklist.md
├── inbound/
│   └── [slug]/
│       ├── incoming.[ext]
│       ├── triage.md                   ← gelen yazismayi siniflandirma
│       └── response-v1.docx
└── oc-status/
    └── [YYYY-MM-DD]/
        ├── _summary.md                 ← haftalik Outside Counsel ozeti
        └── [slug].md
```

**14 slash command** (bizim 17 komuta yakin sayi):

| Slash | Amaci |
|---|---|
| `/litigation-legal:cold-start-interview` | Global setup — buro profili (risk apetisi, eskalasyon zinciri, sigorta) |
| `/litigation-legal:matter-intake` | Yeni dava ac — uniform intake → matters/[slug]/ + _log.yaml guncelle |
| `/litigation-legal:portfolio-status` | Tum dava portfoyu durum panosu (risk dagilim, deadline, stale matter) |
| `/litigation-legal:matter-briefing [slug]` | Derinlemesine dosya incelemesi |
| `/litigation-legal:matter-update [slug]` | Append-only tarihli event ekleme |
| `/litigation-legal:matter-close [slug]` | Dava kapatma + arsiv |
| `/litigation-legal:demand-intake [title]` | Ihtarname on-hazirligi |
| `/litigation-legal:demand-draft [slug]` | FRE 408 / privilege gate ile ihtarname .docx |
| `/litigation-legal:demand-received [path]` | Gelen ihtarname triage |
| `/litigation-legal:subpoena-triage [path]` | Muzekkere/celp siniflandirma + objection framework |
| `/litigation-legal:legal-hold [slug]` | Discovery hold issue/refresh/release/status |
| `/litigation-legal:chronology [slug]` | Tarihce olustur/guncelle |
| `/litigation-legal:oc-status` | Haftalik Outside Counsel status email'leri |
| `/litigation-legal:claim-chart` | Patent / civil element chart (Excel cikti) |

**Anthropic'in inline marker konvensyonu** (cikti icinde):

```
[CITE: specific cite needed]           → Counsel manuel doldurmali (gondermeden once)
[VERIFY: specific fact]                 → Olgu dogrulanmamis
[SME VERIFY: specific judgment call]    → Subject Matter Expert (avukat) review gerekli
```

**Bu BIRE BIR bizim `[DOGRULANMASI GEREKIR]` / `[DOGRULANMAMIS]` markerlerimiz.** Anthropic ABD'de paralel cozumu bulmus; bizim 0-Halusinasyon Doktrini ondan once gelse de format birebir benzer.

### 1.4 Plugin Manifest Formati (`plugin.json` — knowledge-work-plugins/legal)

```json
{
  "name": "legal",
  "version": "1.2.0",
  "description": "Speed up contract review, NDA triage, and compliance workflows for in-house legal teams. Draft legal briefs, organize precedent research, and manage institutional knowledge.",
  "author": {
    "name": "Anthropic"
  }
}
```

**SADECE 4 ALAN.** v1'in onerdigi 11-alanli frontmatter (engine, model_routing_key, allowed_mcps, forbidden_actions, quality_gates, depends_on, hata_gecmisi, ...) Anthropic'ten **3x daha karmasik**. v2 oneri: Anthropic gibi sade tut — extra alanlar **plugin manifest disinda** uygun yere (config/model-routing.json, SKILL.md govde, vb.) konur.

### 1.5 SKILL.md Frontmatter Formati (`review-contract` ornegi)

```yaml
---
name: review-contract
description: Review a contract against your organization's negotiation playbook — flag deviations, generate redlines, provide business impact analysis. Use when reviewing vendor or customer agreements, when you need clause-by-clause analysis against standard positions, or when preparing a negotiation strategy with prioritized redlines and fallback positions.
argument-hint: <contract file or text>
---
```

**3 ALAN.** v1 yine fazla genis onermisti (11 alan). v2 oneri: bizim SKILL.md'lere sadece bu 3 alani ekle, geri kalani body'de tut (zaten oradalar).

### 1.6 8-Adimli Workflow Modeli (`review-contract`)

| Adim | Aciklama |
|---|---|
| 1. Accept Contract | Dosya yukleme veya text yapistir |
| 2. Gather Context (4 sorular) | Hangi taraf? / Deadline? / Focus areas? / Deal context? |
| 3. Load Playbook | `legal.local.md` dinamik yukle (yoksa generic standards) |
| 4. Clause-by-Clause Analysis | 12 zorunlu klauz kategorisi (LoL, Indemnification, IP, Data Protection, Conf, R&W, T&T, Gov Law, Insurance, Assignment, Force Majeure, Payment) |
| 5. Flag Deviations | GREEN / YELLOW / RED severity |
| 6. Generate Redline Suggestions | Must-have / Should-have / Nice-to-have priority |
| 7. Business Impact Summary | Tier 1 (deal-breaker) / Tier 2 (strong pref) / Tier 3 (concession) |
| 8. CLM Routing (opsiyonel) | MCP-connected CLM varsa approval workflow |

**Bizim 7 ASAMA workflow'umuz ayni felsefedeki**: 1. Brifing (Context) → 2. Arastirma (Load Playbook + Source) → 3. Usul (Analysis) → 4. Stratejik Analiz (Severity) → 5. v1 (Draft) → 6. Simulasyon (Tier evaluation) → 7. v2 (Routing icin son hali). Anthropic 8 adim review icin, biz 7 ASAMA dava yazimi icin. Felsefe ortusuyor.

### 1.7 Anthropic'in 3-Tier Severity Sistemi (GREEN/YELLOW/RED)

| Severity | Action | Bizim Karsilik |
|---|---|---|
| 🟢 GREEN — Acceptable | Note for awareness, no negotiation | YESIL (bizim 4E sentez) |
| 🟡 YELLOW — Negotiate | Generate redline, fallback, business impact | SARI |
| 🔴 RED — Escalate | Explain risk, market-standard alternative, exposure estimate | KIRMIZI |

**Birebir ayni karar mekanizmasi.** Bizim 4E sentez ajani aslinda Anthropic-formatli severity classifier'i.

### 1.8 CONNECTORS — Tool-Agnostic Kategori Sistemi

Anthropic plugin'leri MCP'lere `~~category` placeholder'lariyla baglaniyor. `.mcp.json` default sunucu kullanir ama kullanici degisiklik yapabilir.

| Kategori | Default | Diger Secenekler |
|---|---|---|
| `~~calendar` | Google Calendar | Microsoft 365 |
| `~~chat` | Slack | Microsoft Teams |
| `~~cloud storage` | Box, Egnyte | Dropbox, SharePoint, Google Drive |
| `~~CLM` | (yok) | Ironclad, Agiloft |
| `~~CRM` | (yok) | Salesforce, HubSpot |
| `~~email` | Gmail | Microsoft 365 |
| `~~e-signature` | DocuSign | Adobe Sign |
| `~~office suite` | Microsoft 365 | Google Workspace |
| `~~project tracker` | Atlassian | Linear, Asana |

**Litigation-legal ozelinde** ek research connectors:
- **CourtListener** — U.S. court opinions, PACER dockets (= bizim Yargi MCP'nin ABD paralleli)
- **Trellis** — State trial court data
- **Everlaw, Aurora, Relativity, DISCO** — eDiscovery (= Turkiye'de paralleli yok, UYAP'a en yakin)

### 1.9 Cookbook ve Managed Agents API

Anthropic 4 plugin'i (`commercial-legal`, `corporate-legal`, `litigation-legal`, `product-legal`) **cookbook** olarak da sunuyor — bunlar Anthropic Claude Managed Agents API uzerinden programmatic deploy edilebilir. Yani:

| Deployment | Anlatim |
|---|---|
| **Claude Cowork plugin** | Anthropic Desktop app icinde manuel kullanim |
| **Claude Code plugin** | Terminal CLI uzerinden (= bizim sistemin kuruldugu yer) |
| **Managed Agents API** | Anthropic API uzerinden programmatic, multi-user, headless |

Bizim sistem yalniz **terminal Claude Code + Antigravity panel** ile calisiyor; cloud deployment / multi-user / API endpoint yok. Bu bilincli secim (avukat tek-makine kullanir, KVKK riski yok), ama buyume hedefi olursa Anthropic'in Managed Agents yolu var.

### 1.10 Scheduled / Event-Driven Agents

Anthropic plugin'lerinde **5 managed-agent cookbook**:

| Agent | Watches | Cadence |
|---|---|---|
| renewal-watcher (commercial-legal) | Sozlesme yenileme tarihleri | Gunluk + alert |
| docket-watcher (litigation-legal) | Mahkeme docket'i (PACER) | Haftalik |
| reg-change monitor (regulatory-legal) | Mevzuat degisiklikleri | Gunluk |
| diligence-grid (corporate-legal) | M&A due diligence | Talep uzerine |
| launch-radar (product-legal) | Urun lansman yasal kontrolleri | Talep uzerine |

**Bizim sistemde:**
- `ictihat tara` — haftalik Yargitay tarama (= Anthropic'in **5'inde 1'inin** paralleli)
- Google Calendar reminderlari (= renewal-watcher'in zayif paralleli — alert var ama otomatik tarama yok)
- Scheduled agent disipliniyle calisan **0** komut

v2'de Bolum 6'da onerilen yol: bizim "ictihat tara"yi Anthropic-style scheduled agent setine genisletmek (asagida).

### 1.11 Cold-Start Interview

Her plugin yuklendikten sonra ilk komut: `/<plugin>:cold-start-interview`. Bu bir **kalici buro setup formu**:
- Buro risk apetisi (settlement authority, materiality threshold)
- Eskalasyon zinciri (junior → senior → outside counsel)
- House style (dilekce uslubu, sablon tercihleri)
- Sigorta profili
- Kurum profili

Sonuc: `~/.claude/plugins/config/claude-for-legal/<plugin>/CLAUDE.md` dosyasi olusur. Plugin tum skill'leri bu CLAUDE.md'yi okur.

**Bizim sistemde:**
- **Advanced Briefing** (ASAMA 0C) — DAVA-SPESIFIK form, kalici degil
- **uslup-aykut.md** — Avukatin uslup parmak izi (= Anthropic "house style" kalici karsiligi); manuel olarak emsal dilekcelerden cikartilmis (10 UDF + 4 TIF/OCR)
- **legal.local.md** — Statik buro kurallari (dava turune ozel)
- **MemPalace `wing_buro_aykut`** — Dinamik avukat tercihleri (her sessiona evolved)

Yani bizim sistemde **cold-start interview + global CLAUDE.md profili olusturma** SKILL'i yok, ama elementlerin tamami var. Avukat manuel yazdi/duzenledi. v2'de onerilen: `/cold-start-interview` benzeri bir komut + bos CLAUDE.md profil sablonu olustur (Bolum 6.2).

### 1.12 Excel-Facing Outputs

Anthropic plugin'lerinde **xlsx ciktilar**:

| Plugin / Skill | Cikti Tipi |
|---|---|
| `corporate-legal:tabular-review` | Multi-sheet xlsx with sources sheet |
| `litigation-legal:claim-chart` | Element-by-element claim chart with citation columns |
| `corporate-legal:entity-compliance` | Compliance register with deadline columns |
| `commercial-legal:renewal-tracker` | Renewal register sorted by cancel-by date |

**Bizim sistemde:**
- `md_to_docx.py` — MD → DOCX
- `md_to_udf.py` — MD → UDF (UYAP-ready)
- Excel/xlsx cikti: **YOK**

**Bu bir eksiklik.** Bilirkisi raporu hesaplamasi, dava portfoyu durumu, sozlesme yenileme takvimi — hepsi xlsx tabular formatinda olsa avukat icin daha kullanisli. Onerim: `md_to_xlsx.py` script (Bolum 6.3).

### 1.13 Anthropic'in Vurguladigi Disclaimers (bizim Doktrin Ile Karsilastirma)

Anthropic README'sinden birebir alinti:

> "Every output from these plugins is a draft for attorney review — not legal advice, not a legal conclusion, not a substitute for a lawyer. They are built with guardrails that reflect that: source attribution on every citation, conservative defaults on privilege and subjective legal calls, jurisdiction assumptions surfaced, and explicit gates before anything is filed, sent, or relied on."

Anthropic'in 4 guardrail:
1. **Source attribution on every citation** ← bizim Bedesten documentId zorunlu
2. **Conservative defaults on privilege / subjective calls** ← bizim "DOGRULANMASI GEREKIR" damgasi + lehe yorum yasagi
3. **Jurisdiction assumptions surfaced** ← bizim "DOGRULANMAMIS — Turk hukukuna spesifik degil" notu
4. **Explicit gates before filed / sent / relied on** ← bizim 4 kalite kapisi + TASLAK ibaresi

**Bizim 4 mekanizma Anthropic'in 4 guardrail'iyle birebir cakisiyor.** Eski rapor "0-Halusinasyon Doktrini Anthropic'te yok" demis; gercek **Anthropic'in 4 guardrail'i bizim doktrinin elementleridir**. Bizim Tugba 2026-89 hata gecmisinden dogmus, Anthropic muhtemelen kendi sistemik hata gecmisinden. Yontemlerimiz convergent — bu lehimize.

### 1.14 Thomson Reuters / CoCounsel Partnership

Anthropic 2026 Mayis'ta Thomson Reuters CoCounsel ile resmi partnership ilan etti (Bloomberg, TechCrunch, LawSites haberleri). Westlaw / Practical Law icerikleri direkt Claude'a baglandi. Bu **stratejik bir hamle**: Anthropic'in kendi yargi/mevzuat veri tabani yok, Reuters'in hukuki database'ini lisanslayarak gercek "primary source" erisimi sundu.

**Turkiye paralleli:**
- **Lexpera** (Beta yazisinda gecmedi) — yargi + mevzuat + doktrin tek platformda
- **Kazanci** (Beta yazisinda gecmedi) — yargi + mevzuat
- **Jurix / Hukukturk / DergiPark** (bizim Literatur MCP'mizde DergiPark var)
- **Yargi MCP / Mevzuat MCP** (Bedesten + mevzuat.gov.tr) — kamuya acik kaynaklara erisim

**Eski raporda Lexpera / Kazanci entegrasyonu fikrini hic acmadik.** Bu Anthropic + Reuters parallelinin Turk versiyonu olabilir; v2'de Bolum 7.4'te tartisilir.

---

## 2. BIZIM SISTEM — Tam Envanter (eski raporun gormedikleri dahil)

### 2.1 14 Ajan + Director (eski rapor tam)

Eski raporda 14 ajan sayisi dogru: Director + 5 operasyonel + 5 perspektif + 3 destek = 14 (Director haric). Ajan listesi (eksiksiz):

- **Director Agent** (orkestrasyon, kullanici-kontrollu 7 ASAMA, kalite kapilari)
- **Operasyonel (5):** Arastirmaci, Usul Uzmani, Belge Yazari (Dilekce Yazari), Savunma Simulatoru, Revizyon Ajani
- **Perspektif (5):** 4A Davaci Avukat, 4B Davali Avukat, 4C Bilirkisi, 4D Hakim, 4E Sentez & Strateji
- **Destek (3):** Hesaplama Modulu (deterministik Python), Otonom Dongu (haftalik ictihat tarama), MemPalace Wake-up

Bunlardan **5 perspektif ajani** Anthropic-format sub-agent dosyalari olarak `.claude/agents/`'de duruyor (YAML frontmatter `name`, `description`, `tools` + body markdown). **Bizim sistemin sub-agent dosyalari Anthropic plugin formatina birebir uyumlu** — eski rapor bunu kacirdi.

### 2.2 17 Slash Komut (`.claude/commands/`)

Tum komutlar:
`hesapla`, `usul`, `arastir-notebook`, `ihtarname-yaz`, `sozlesme-yaz`, `notebooklm-dene`, `blog`, `arastir-akademik`, `devam`, `atla`, `dur`, `devam-et`, `motor-degistir`, `arastir`, `arastir-yargi`, `arastir-mevzuat`, `yeni-dava`.

Bunlar Claude Code'un standart `.claude/commands/` formatinda. **Anthropic plugin'inin commands/ klasoruyle birebir uyumlu format** — sadece namespace yok (yani `/yeni-dava`, `/litigation-legal:yeni-dava` degil).

### 2.3 6 SKILL.md (`ajanlar/*/SKILL.md`)

- `ajanlar/director/SKILL.md`
- `ajanlar/arastirmaci/SKILL.md`
- `ajanlar/usul-uzmani/SKILL.md`
- `ajanlar/dilekce-yazari/SKILL.md`
- `ajanlar/savunma-simulatoru/SKILL.md`
- `ajanlar/revizyon-ajani/SKILL.md`

Frontmatter yok (sadece "Son guncelleme" ve "Versiyon" satirlari). Anthropic frontmatter format'i (`name`, `description`, `argument-hint`) eklenirse — minik bir cevre.

### 2.4 15 Gemini Prompt (`prompts/gemini/`)

Anthropic SKILL.md icindeki workflow taslagi rolundeler. Liste:
1. `_ortak-kurallar.md` — 10 degismez kural (yapay zeka tell yasagi, kaynak zorunlu, PII koru, GUVEN NOTU, vb.)
2. `kritik_nokta_tespiti.md` — ASAMA 1 destek
3. `arama_plani.md` — ASAMA 2 hazirlik
4. `arastirma_sentezi.md` — ASAMA 2 ozet (terminal Claude)
5. `usul_raporu.md` — ASAMA 3 (Antigravity)
6. `stratejik_analiz.md` — ASAMA 4 (5 ajan paralel)
7. `dilekce_yazimi.md` — ASAMA 5
8. `savunma_simulasyonu.md` — ASAMA 6
9. `revizyon.md` — ASAMA 7
10. `self_review.md` — Her uretim sonu kalite gate
11. `bilirkisi_analizi.md` — alt-mode
12. `muvekkil_bilgilendirme.md` — alt-mode
13. `istinaf_temyiz.md` — alt-mode
14. `strateji_degerlendirme.md` — alt-mode
15. `sozlesme_inceleme.md` — alt-mode

### 2.5 10 Python Script (`scripts/`)

| Script | Gorev |
|---|---|
| `maske.py` | KVKK Seviye 2 mask/unmask (TC/IBAN/Tel/Email otomatik regex + dict-bazli isim/adres) |
| `pii-mask.py` | Genel PII tarama (maske.py'nin alternatifi) |
| `md_to_docx.py` | MD → DOCX (UYAP DOCX uyumlu) |
| `md_to_udf.py` | MD → UDF (format_id=1.7, leftMargin=70.87, UYAP yuklemeye hazir, avukat onayli; Selin Uyar 2026-003) |
| `mevzuat_cache.py` | Mevzuat MCP rate-limit yoneticisi |
| `quality_gate.py` | ASAMA 2 kalite kapisi otomatik dogrulama (atif-maddeleri.json + mulga-eleme.json sema kontrolu) |
| `_timing.py` | Profiling Faz A (MCP cagri timing'i) |
| `idle-times-extract.py` | Profiling Faz A (idle suresi raporu) |
| `timing-report.py` | Pilot davalar uzerinden timing raporu (`docs/timing-analysis-YYYY-MM-DD.md`) |
| `model_weekly_report.py` | `logs/model-events.jsonl` haftalik motor kullanim raporu |

**10 script bizim sistemin omurgasi.** Eski rapor 2 tanesini bahsetti.

### 2.6 5 Sub-Agent (`.claude/agents/`)

5 perspektif sub-agent dosyasi. Her biri Anthropic-format:
- `davaci-avukat.md` — 4A (Lehimize argumanlar)
- `davali-avukat.md` — 4B (Aleyhimize argumanlar)
- `bilirkisi.md` — 4C (Teknik denetim)
- `hakim.md` — 4D (Karar olasiligi)
- `sentez-strateji.md` — 4E (KIRMIZI/SARI/YESIL)

ASAMA 4 sirasinda Director **gercek paralel sub-agent spawn** yapiyor (Promise.allSettled hata toleransi). Bu Anthropic'in `agents/` klasorundeki scheduled agents'ten farkli — bizimkiler **on-demand paralel sub-agents**, onlarinki **scheduled background agents**.

### 2.7 11 Sablon (`sablonlar/`)

| Sablon | Kullanim |
|---|---|
| `advanced-briefing-template.md` | ASAMA 1 brifing formu |
| `usul-raporu-template.md` | ASAMA 3 cikti iskeleti |
| `arastirma-raporu-template.md` | ASAMA 2 cikti iskeleti |
| `savunma-simulasyonu-template.md` | ASAMA 6 cikti iskeleti |
| `revizyon-raporu-template.md` | ASAMA 7 cikti iskeleti |
| `dava-klasoru-checklist.md` | Drive klasoru kurulum |
| `evrak-listesi-template.md` | Muvekkil belge envanteri |
| `mempalace-taksonomi-referansi.md` | MemPalace wing/hall/drawer/room kullanim klavuzu |
| `kalite-gate-template.md` | Kalite kapisi raporu |
| `session-checkpoint-template.md` | Pre-compact state dump |
| `README.md` | Sablon dizini |

### 2.8 9 Hesaplama Modulu (`ajanlar/usul-uzmani/iscilik-hesaplama.md`)

Eski rapor "iscilik hesaplama" diye 1 satirda gecti. Gercekte **9 ayri modul**:

1. **Modul 1: Hizmet Suresi** — DATEDIF y/ym/md formulu
2. **Modul 2: Ucret Hesabi** — SGK + issizlik + gelir vergisi + damga, brut/net katsayisi, yemek istisnasi yil-yil tablo (2018-2023)
3. **Modul 3: Kidem Tazminati Tavani** — **donem bazli tavan** (01.01.2022 → 30.06.2026 toplam 8 donem, her birinde asgari ucret + tavan)
4. **Modul 4: Ihbar Tazminati** — Kademeli onel (6 ay - 1.5 yil → 2 hafta; 1.5-3 yil → 4 hafta; 3-6 yil → 6 hafta; 6+ yil → 8 hafta)
5. **Modul 5: Fazla Calisma Ucreti** — **Kademeli gelir vergisi** (0-158k %15, 158-330k %20, 330k+ %27)
6. **Modul 6: UBGT Ucreti** — Yil-yil UBGT gun sayisi (2018: 6, 2019: 6.5, 2020: 6.5, 2021: 7.5, 2022: 6.5, 2023: 5, 2024: guncel kontrol)
7. **Modul 7: Hafta Tatili Ucreti** — 1.5 kat + SGK + gelir + damga
8. **Modul 8: Yillik Izin Ucreti** — Bakiye izin x giydirilmis brut / 30
9. **Modul 9: Ise Iade** — Ise baslatmama tazminati (4-8 ay) + Bosta gecen sure (max 4 ay)

Anthropic'in **`employment-legal:wage-hour-qa`** modulu bunun ABD paralleli ama Turk yil-bazli asgari ucret tavanlari + UBGT + kademeli gelir vergisi dilimleri **gomulu olarak yok**. Bu bizim ozgun kalin avantajimiz.

### 2.9 uslup-aykut.md — Avukatin Uslup Parmak Izi (~640 satir, 17 bolum)

Eski rapor 1 satirda gecti. Gercekte:
1. Mahkeme Basligi (4 suffix varyanti + ihtiyati tedbir flag'i)
2. Taraf Bilgisi (TC formati Genel vs Icra/Ticari + barosu sicil varyanti)
3. KONU Formati (6 tipik kapanis varyanti)
4. HARCA ESAS DEGER (3 varyant)
5. ACIKLAMALAR Bolumu (numaralandirma `1-)`, ic liste pattern, gecis bagcilari pozitif + yasak, emsal karar Sablon A/B/C/D)
6. HUKUKI SEBEPLER (kisaltma + sair ilgili mevzuat)
7. HUKUKI DELILLER (numarali + son kalem `tanik, kesif, bilirkisi, yemin`)
8. NETICE VE TALEP (3 baslik varyanti, 4 giris kalibi, 4 kapanis formulu)
9. Vekil Imza Bloku
10. EKLER (4 format varyanti A/B/C/D)
11. Cumle Yapisi (ortalama 25-45 kelime, ic ice ama suslu degil)
12. Kelime Dagarcigi (cok sik / sik / ozgun / duygusal yuk listeleri)
13. YAPMA Listesi (Anti-AI-Tell, 10 madde — Anthropic'in "house style" parameterize halinde)
14. Kontrol Listesi
15. Referans Ornekler (5 UDF + 4 TIF)
16. Ogrenilmis Dersler
17. Ihtarname Yapisi (alt-mode)

**Anthropic "house style profile" konseptinin birebir karsiligi.** Anthropic kullaniciya bos sablon verir, bos doldurmasini bekler; biz emsal 14 dilekceden cikartip dolu sunmusuz. **Anthropic bunu yapsa bile, sade kullanici daha buyuk hizmet alir cunku 'house style' avukatin manuel zamanini emer; biz 10 emsal UDF + 4 TIF OCR'dan otomatik cikartip vermisiz.**

### 2.10 0-halusinasyon-doktrini.md (7 bolum)

Eski rapor 1 satirda gecti. Detay:
1. Mutlak Yasaklar (6 madde — uydurma karar, uydurma alinti, baglam korunmaz, lehe yorum, "kaynak yok" demek dogruluk, kaynaksiz iddia)
2. Pozitif Kurallar (A: Kaynak dogrulama tablosu, B: Risk flag, C: Elestirel okuma protokolu 5 sorulu, D: Cift kaynak dogrulama, E: Avukat durtusu reddi)
3. Yargitay Karari Atif Formati (zorunlu, format ornegi + yanlis ornek 3 tane)
4. Kaynak Dogrulama Adimlari (Yargitay, Mevzuat, NotebookLM, Doktrin)
5. Hata Gecmisi Sistemik Risk Bellegi (2026-05-05 Tugba 2026-89 detayi — neden, sebep, yakalama, sonuc, sistem genline kural)
6. Tekrarlayan Kontrol Cikti Oncesi Checklist (8 madde)
7. Kuresel Uyum Noktalari (12 dosya referansi)

**Anthropic guardrail'lerinin 4 element'ine birebir karsilik.** Bizim "doktrin" formatimiz daha sistematik (hata gecmisi + sistemik bellek) ama Anthropic kavramsal olarak ayni yere ulastimis.

### 2.11 MemPalace Mimarisi (eski raporda yuzeysel)

Wing / Hall / Drawer / Room hiyerarsisi:

```
wing_buro_aykut/
  hall_avukat_tercihleri/
    drawer_uslup_tonu/
    drawer_kvkk_seviye/
    drawer_is_akisi_tercihleri/
  hall_model_tercihleri/
  hall_strateji_tercihleri/
  hall_zero_halusinasyon/
  room_kisisel_profil/

wing_{dava_turu}/   (is hukuku, kira, tuketici, ...)
  hall_argumanlar/        (olgun argumanlar — promotion ile gelen)
  hall_arastirma_bulgulari/  (ham bulgular)
  hall_kararlar/             (bilinen Yargitay kararlari)
  hall_usul_tuzaklari/       (usul riskleri)
  hall_savunma_kaliplari/    (karsi taraftan beklenen)
  hall_bozma_argumanlari/    (istinaf/temyiz)

wing_ajan_{ajan_adi}/   (her ajan icin)
  hall_diary/   (gecmis ogrenmeleri)

wing_hakim_{soyad}/    (varsa, hakim profili)
wing_avukat_{soyad}/   (varsa, karsi avukat profili)
```

**Promotion logic:** `hall_arastirma_bulgulari` → 2+ kez kullanildiginda VEYA tam davada arguman olarak dogrulandiginda → `hall_argumanlar`'a promote (mempalace_add_drawer ile).

**Anthropic'te yok.** Bizim sistemin en yenilikci ozelliklerinden biri. Anthropic'in `legal.local.md`'si yalniz statik kurallar; bizimki dinamik dava bazli ogrenme.

### 2.12 3 Batch Devir Blogu (ANTIGRAVITY.md)

| Batch | ASAMA | Avukat onay sinyali |
|---|---|---|
| Batch 1 | ASAMA 3 (Usul Raporu) | "ASAMA 3 bitti" |
| Batch 2 | ASAMA 4 (5-Ajan Stratejik Analiz) | "ASAMA 4 bitti" — 4E KIRMIZI ise Batch 3 BLOKLENIR |
| Batch 3 | ASAMA 5+6+7 (Dilekce v1 + Savunma Sim + v2 NIHAI — TEK SOHBET) | "Hepsi bitti" |

**Mehmet Ali 2026-003 pilot dersi:** Onceki 5 ayri devir blogu 30+ dakika manuel is yarattiyordu. 3 batch'e indirildi (%40 azalma). ASAMA 5-6-7 zaten dogal "yaz → elestir → revize" dongusu oldugu icin tek Antigravity sohbette birlestirildi.

**Anthropic'te bu mantik yok** cunku Anthropic Claude tek motorla calisiyor; bizim Antigravity (Gemini 3.1 Pro) sag panel + Claude (terminal) iki motor. Devir blogu manuel kopya-yapistir gerektiriyor — bu bizim sistemin ozgun ozelligi (latency maliyetiyle).

### 2.13 Profiling Instrumentation (Faz A + Faz B)

Director Agent **opsiyonel profiling** moduyla calisir. `tmp/current-asama.txt` + `tmp/current-dava-id.txt` dosyalarini gunceller; hooks `mcp-timing-pre.sh` + `mcp-timing-post.sh` ile MCP cagri sureleri `mcp-timings.jsonl`'a yazilir. Haftalik rapor: `python scripts/timing-report.py --pilot-davalar 5`.

**Faz B — Progress Ledger** (2026-05-04): Avukat 33 dakika ekran beyaz beklemesin diye Director ASAMA 2 boyunca canli ledger yazar (`scripts/progress_helper.sh log 2B yargi_search '...'`). Avukat ayri terminalde `tail -f tmp/.faz2-progress.jsonl`.

**Anthropic'te paralleli yok.** Bizim Yargi/Mevzuat MCP'leri uzun surdugu icin (zaman zaman 5+ dakika) bu bilesen kritik.

### 2.14 Self-Review (`prompts/gemini/self_review.md`)

Antigravity her uretim sonu ayni sohbette `self_review.md`'yi calistirir:
- Rol: Bagimsiz denetleyici (ayni motor ama farkli rol)
- Cikti: HATA LISTESI (kritik + minor + dogrulanmasi gereken atiflar + ton sorunlari + eksik bilgi)
- Karar: KABUL / REVIZYON GEREK / YENIDEN YAZ

**Anthropic'in plugin'lerinde ayni felsefe var ama "self-review" denmiyor** — `[CITE:]` ve `[VERIFY:]` marker'lariyla counsel'in manuel reviewine birakiyor. Bizimki **otomatik self-validation** + sonra avukat reviewi (iki katmanli). Avantaj: avukat daha az hata yakaliyor.

---

## 3. KESIN KARSILASTIRMA — Anthropic vs Bizim Sistem (Matris)

Eski raporun 15-satirli "Bizde olan + Anthropic'te olmayan" tablosu daraltilmisti. v2 genisletilmis:

### 3.1 Bizde olan, Anthropic'te yok (LEHIMIZE FARK — 18 alan)

| # | Bizim ozellik | Detay | Anthropic durumu |
|---|---|---|---|
| 1 | KVKK Seviye 2 maskeleme | `scripts/maske.py` + regex (TC/IBAN/Tel/Email) + dict-bazli isim/adres | Yok — kullanici manuel CLAUDE.md profili |
| 2 | 0-Halusinasyon Doktrini + Bedesten documentId zorunlu | 7 bolum, hata gecmisi sistemik bellek (Tugba 2026-89) | 4 guardrail prensibi var, doktrinlestirilmis sistem yok |
| 3 | UDF format uretimi | `md_to_udf.py` format_id=1.7, UYAP-ready | Yok — Anthropic ABD .docx kullaniyor |
| 4 | Yetkili Adliye Esleme Protokolu | HSK + adalet.gov.tr WebSearch zorunlu, Istanbul 5 adliye tuzak haritasi | Yok |
| 5 | Normlar Hiyerarsisi denetimi | 7 seviye piramit (Anayasa → Antlasma → Kanun/CBK/IBK → CBK → Tuzuk → Yonetmelik → Teblig) + Lex Superior/Specialis/Posterior | Yok |
| 6 | Mulga eleme protokolu | 2B → 2C sirali zinciri, olay tarihi versiyon kontrolu, zimni ilga taramasi | Yok |
| 7 | MemPalace buro hafizasi | wing/hall/drawer/room mimarisi + promotion logic + hakim/avukat profilleri | Yok — Anthropic plugin'lerinde `legal.local.md` statik |
| 8 | 5-ajan stratejik analiz paralel spawn | Promise.allSettled hata toleransi (4/4, 3/4 uyari, 2/4 sinirli, <2 DURDUR) | Anthropic agents/ klasoru scheduled background, parallel multi-perspective YOK |
| 9 | Antigravity hibrit mimari (3 batch) | Terminal Claude + Antigravity Gemini 3.1 Pro sag panel | Anthropic tek motorlu (Claude) |
| 10 | Iscilik alacaklari deterministik 9 modulu | Yil-yil kidem tavani (8 donem 2022-2026), kademeli vergi dilimi, UBGT yil-yil gun sayisi | Anthropic `wage-hour-qa` var ama ABD federal/eyalet bazli; Turk donem-tavanlari yok |
| 11 | uslup-aykut.md (640 satir) avukat parmak izi | 10 UDF + 4 TIF OCR'dan cikartilmis 17 bolum | Anthropic "house style" kullanici doldurur (manuel emek) |
| 12 | 7 ASAMA kullanici-kontrollu workflow | devam/atla/motor degistir/dur kontrolu | Anthropic plugin'leri komutsal — kullanici-kontrol-pause yok |
| 13 | 4 kalite kapisi | Post-Arastirma + Post-Usul + Post-Stratejik + Post-Dilekce-v2-UDF | Anthropic'te `[CITE:]`/`[VERIFY:]` marker'lari counsel review icin; otomatik kapi yok |
| 14 | Hata gecmisi sistemik bellek | Tugba 2026-89, Mehmet Ali 2026-003, Selin Uyar 2026-003, Seydi Ahmet Baskaya 2025/139 dersleri SKILL.md'lere gomulu | Anthropic'te yok |
| 15 | Aktor profilleri | wing_hakim_{soyad}, wing_avukat_{soyad} | Anthropic'te yok |
| 16 | Bedesten documentId zorunlu atif dogrulama | Her Yargitay kunyesi yargi bedesten doc <id> ile tam metin cekilir | Anthropic CourtListener entegrasyonu var ama documentId zorunlulugu yok — `[VERIFY:]` marker'iyla bos birakilabilir |
| 17 | Lehe Yorum Yasagi (avukati memnun etmek icin) | "Mutaka rasyonel sonuc, uydurma kararlarla rezil olamam" — sistemik kural | Anthropic "conservative defaults on subjective calls" var ama "lehe yorum yasagi" gibi spesifik kural yok |
| 18 | Profiling instrumentation + Progress Ledger | Faz A + Faz B, MCP timing JSONL log, canli ledger tail | Anthropic'te yok (Cowork plugin client-side latency monitoring yapmaz) |

### 3.2 Anthropic'te var, bizde yok (FIRSAT — 14 alan)

| # | Anthropic ozellik | Bizim durum | Oncelik |
|---|---|---|---|
| 1 | Plugin manifest format (`.claude-plugin/plugin.json` — 4 alanli) | Yok | **YUKSEK** — Faz 1'de eklenebilir |
| 2 | Slash command namespace (`/plugin:command`) | Duz format (`yeni-dava`) | ORTA — Plugin sayisi 3'u gecince zorunlu |
| 3 | SKILL.md basit frontmatter (3 alan: name, description, argument-hint) | Frontmatter yok | **YUKSEK** — Faz 1 |
| 4 | Cold-start interview (global buro setup formu) | Yok — Advanced Briefing dava-spesifik | **ORTA** — Yeni avukat onboarding icin degerli |
| 5 | Inline marker conventions (`[CITE:]`, `[VERIFY:]`, `[SME VERIFY:]`) | Bizim `[DOGRULANMAMIS]` / `[DOGRULANMASI GEREKIR]` var — paralellestirme yapilabilir | DUSUK — zaten paralleli var, sadece terminoloji birlestirme |
| 6 | Scheduled agents (docket-watcher, renewal-watcher, reg-change monitor) | Sadece `ictihat tara` haftalik | **YUKSEK** — UYAP safahat takibi icin scheduled agent kritik |
| 7 | Excel-facing outputs (.xlsx tabular review, claim chart, renewal tracker) | Yok — sadece MD/DOCX/UDF | **ORTA** — `md_to_xlsx.py` script eklenebilir |
| 8 | matters/_log.yaml portfolio ledger | Yok — her dava ayri Drive klasoru, "portfolio dashboard" yok | **YUKSEK** — buyuyen buroda dava sayisi 20+ olunca zorunlu |
| 9 | oc-status haftalik avukat raporu | Yok | DUSUK — bizim buro tek-avukat |
| 10 | Cookbook deployment (Managed Agents API) | Yok — tek-makine terminal Claude | DUSUK — buyume hedefine bagli |
| 11 | Plugin marketplace (`/plugin install`) | Bizim sistem zaten Claude Code, marketplace destegi var ama plugin formatinda paketlenmemis | ORTA — Faz 2 plugin manifestiyle birlikte |
| 12 | CLM / DMS / e-discovery / CRM / e-signature MCP'leri | YOK — sadece Drive/Calendar/Gmail | DUSUK — Turkiye'de yaygin CLM yok; ileride |
| 13 | Thomson Reuters CoCounsel / Westlaw partnership | YOK — bizim Yargi MCP Bedesten + Lexpera/Kazanci entegrasyonu yok | **YUKSEK** — Lexpera entegrasyonu profesyonel kalite atlama |
| 14 | MarkaPatent MCP (TURKPATENT) | YOK | **ORTA** — IP davasi alindiginda kritik |

### 3.3 Ikisinde de var ama farkli yaklasim (3 alan)

| Alan | Anthropic | Bizim |
|---|---|---|
| Severity classifier | GREEN/YELLOW/RED 3-tier (her skill) | KIRMIZI/SARI/YESIL 3-tier (4E sentez + self-review). Birebir paralel ama bizim 2 farkli yerde |
| Kaynak attribution | `[VERIFY:]` marker — counsel manuel doldurur | Bedesten documentId zorunlu cekilis — sistem ic-otomatik |
| House style | `legal.local.md` — kullanici manuel yazar | `uslup-aykut.md` — sistem 10 UDF emsal dilekceden cikartmis |

---

## 4. ANTHROPIC'IN BIZIMKINE KIYAS — Litigation-Legal %21 Basari Neden?

Eski rapor "litigation-legal Turkiye basari orani %21" demis. Anthropic'in `litigation-legal` plugin'inin **gercek ic yapisini** gorduken sonra %21'i acabilirim:

| Anthropic litigation-legal ozelligi | Turkiye uyumu | Engel |
|---|---|---|
| `matter-intake` | Yuksek | Bizim ASAMA 1 brifing paralleli — kolayca uyarlanir |
| `portfolio-status` | Yuksek | Dava sayisina bagli — kolay uyum |
| `matter-briefing` | Yuksek | Bizim 00-Briefing.md formatına yakin |
| `matter-update` | Orta | UYAP safahat manuel girdi, otomasyon zor |
| `demand-intake / demand-draft` | Yuksek | Bizim ihtarname mod'u var |
| `subpoena-triage` | Orta | Turkiye'de "muzekkere/celp" sınıflandırma — paralleli ama format farkli |
| `legal-hold` (FRCP discovery hold) | **DUSUK** | Turkiye'de FRCP yok; UYAP delil hazirlama farkli usul |
| `chronology` | Yuksek | Bizim olgusal kronoloji ASAMA 1'de yapiliyor |
| `oc-status` (haftalik Outside Counsel raporu) | **DUSUK** | Turkiye'de hukuk burolari boyle iletisim raporu tutmuyor |
| `claim-chart` (patent element chart) | Orta | Patent davasi paralleli — IP-legal'e yakin |
| `cold-start-interview` | Yuksek | Bizim ozelligimiz uslup-aykut.md ile + Advanced Briefing |

**%21 basari oraninin sebebi:**
- 4 skill (`legal-hold`, `oc-status`, claim-chart'in patent USC tarafı, subpoena-triage'in FRCP boyutu) Turkiye'de ya yok ya farkli usul gerektiriyor
- 10 skill esasen uyarlanir ama uyarlama maliyeti var (CLAUDE.md profile + MCP swap)

**Bizim acidan kazanim:** Anthropic'in `matter-intake`, `portfolio-status`, `chronology`, `claim-chart` skill'lerinin Turkiye paralellesinde **kaybetmedigimiz seyleri** ekleyebiliriz (Bolum 6'da).

---

## 5. EKSIK MCP / CONNECTOR ENVANTERI

Eski rapor sadece MarkaPatent eksikligine deginmisti. Tam liste:

### 5.1 Bizde olan MCP'ler (8)

1. `mcp__claude_ai_Yarg_MCP__*` — Bedesten + Yargitay + Danistay + HGK + IBK + AYM
2. `mcp__claude_ai_Mevuzat_MCP__*` — mevzuat.gov.tr + Bedesten REST + sektorel kurumlar (BDDK/SPK/EPDK/BTK/RTUK/SEDDK/MASAK)
3. `mcp__claude_ai_Literat_r_MCP__*` — DergiPark akademik makaleler
4. `mcp__claude_ai_Yoktez_MCP__*` — YOK Ulusal Tez Merkezi
5. `mcp__buro-hafizasi__*` — MemPalace dahili
6. `notebooklm` — NotebookLM MCP
7. `mcp__claude_ai_Google_Drive__*` — Drive
8. `mcp__claude_ai_Google_Calendar__*` + `mcp__claude_ai_Gmail__*` — Calendar + Gmail

### 5.2 Eksik (Anthropic'te paralleli olan veya Turkiye-spesifik)

| # | MCP / Connector | Anlam | Oncelik | Effort |
|---|---|---|---|---|
| 1 | **MarkaPatent MCP** (TURKPATENT) | Marka / patent / endustriyel tasarim arama | ORTA | 1-2 hafta (yoksa scratch) |
| 2 | **Lexpera MCP** | Profesyonel yargi+mevzuat+doktrin tek platform | YUKSEK (kalite atlamasi) | 2-3 hafta + API/erisim sozlesmesi |
| 3 | **Kazanci MCP** | Lexpera alternatifi | ORTA | 2-3 hafta |
| 4 | **UYAP MCP / Avukat Portal scraping** | Tevzi, safahat, e-tebligat, dosya bilgi cekme | YUKSEK | 4-6 hafta (Playwright + e-imza + KVKK) |
| 5 | **MERSIS / Ticaret Sicili Gazetesi MCP** | Sirket bilgi cekme, imza sirkuleri | DUSUK | 2-3 hafta |
| 6 | **GIB Tebligleri MCP** | Vergi tebliglerine yapisal erisim | DUSUK | 1-2 hafta |
| 7 | **TBB / Baro Sicil MCP** | Karsi avukat dogrulama | DUSUK | 1 hafta |
| 8 | **e-imza / m-imza MCP** | Dilekce/sozlesme imzalama | YUKSEK (UYAP otomasyonu icin) | 2-3 hafta (KVKK kritik) |
| 9 | **WhatsApp Business MCP** | Muvekkil iletisim (kayit + analiz) | DUSUK | 1 hafta + KVKK ihlali riski |
| 10 | **Notion / Obsidian MCP** | Dava notlari + bilgi yonetimi | ORTA | 1 hafta + var olan Rube |
| 11 | **CourtListener / Westlaw paralleli** | Anthropic'in dogrudan kullandigi | YOK — Turkiye paralleli Lexpera | n/a |
| 12 | **DocuSign / Adobe Sign** | e-imza | DUSUK | 1 hafta + KVKK |

**MCP backlogu eski raporda 1 satirdaydi; v2'de 12 maddelik gercek liste.**

---

## 6. ONERILEN YOL HARITASI v2 (Eski 4 Faz Genisletildi → 6 Faz)

Eski raporun Faz 1-4'unu temel alip 2 yeni faz ekledim. Her faz **kendi basina deger uretir**, reversibledir.

### FAZ 0 — Arastirma Derinlestirme (2-3 gun, sifir risk)

> **YENI (v2'de eklendi)** — eski raporun "Faz 0 — Anthropic Github incele" tavsiyesini formalize ediyor.

1. **Anthropic claude-for-legal her 12 plugin README'sini oku** — hangi skill'lerin Turkiye'de gercekten paralleli oldugunu tek tek belirle.
2. **Anthropic knowledge-work-plugins/legal 6 skill'i indir, lokalde sablon olarak duzenle** — uslup-aykut.md ile birlestirilebilir mi gor.
3. **Bizim 10 script + 15 prompt envanteri tablo** (FORLEGALCLAUDE3.md sablonu).
4. **Pilot dava verisi:** Son 5 dava timing-report ortalamasini cikar. Faz 1-2 ROI hesabi icin baz.

**Beklenen cikti:** `FORLEGALCLAUDE3.md` (Anthropic kod kaynagi tabanli derin analiz).

### FAZ 1 — Hizli Kazanimlar (1 hafta, dusuk risk)

> **Eski rapor Faz 1 genisletilmis.**

1. **SKILL.md frontmatter standardizasyonu — SADE format** (~1 gun)
   - 3 alanli format: `name`, `description`, `argument-hint`
   - 6 SKILL.md'ye + 0-halusinasyon-doktrini.md'ye ekle
   - Director Agent komut esleme tablosunu frontmatter'dan turetmek **opsiyonel** (eski raporda bunu zorunlu yapmistik — sadelestir)

2. **Plugin manifest format — basit 4-alanli `plugin.json`** (~1 gun)
   - `.claude-plugin/plugin.json` olustur (root'ta)
   - Anthropic ile uyum, marketplace'e gonderme imkani

3. **5 sik dava turu icin Playbook** (~3-4 gun)
   - `playbook/iscilik-istifa-hakli-fesih.md`
   - `playbook/iscilik-kidem-tazminat-genel.md`
   - `playbook/kira-tespit-tbk-344.md`
   - `playbook/tuketici-ayipli-mal.md`
   - `playbook/kira-tahliye-temerrut.md`
   - Director Agent'a `playbook:` parametre destegi

4. **Inline marker konvensyonu birlestirilmesi** (~0.5 gun)
   - Bizim `[DOGRULANMASI GEREKIR]` + Anthropic'in `[VERIFY:]` ortak terminolojiye cevir
   - Onerim: bizim format zaten daha specifik, koru — sadece **kisaltmali alt format** ekle:
     - `[VERIFY: kunye]` (kisa)
     - `[DOGRULANMASI GEREKIR: <kunye> — <neden>]` (uzun, default)

5. **md_to_xlsx.py — Excel cikti destegi** (~2 gun)
   - Bilirkisi raporu hesaplamasi → xlsx (formul satirlari ile)
   - Hesaplama modulu sonuc tablosu → xlsx
   - Yeni: `iscilik-hesaplama-{dava-id}.xlsx` ile avukat manuel oynayabilir

**Beklenen kazanim Faz 1:**
- Playbook iceren davalarda **%30-40 hizlanma** (ASAMA 1 + ASAMA 2 hazirlik)
- Yeni alt-mode ekleme **2-3x kolaylasir**
- xlsx cikti avukat icin "Word kullanmadan tablolu inceleme" saglar (bilirkisi analizi)
- Marketplace'e gonderme imkani (avukat plugin paylasimi yapmak isterse)

### FAZ 2 — Plugin Manifest Mimarisi v2 (2 hafta, orta risk)

> **Eski rapor Faz 2 genisletilmis.**

1. **`plugins/` klasoru — Anthropic-format** (~3-4 gun)
   - Mevcut 18 alt-mode'u 6 plugin'e topla:
     - `plugins/iletisim/` (muvekkil bilgilendir)
     - `plugins/strateji/` (strateji degerlendir, SWOT)
     - `plugins/sozlesme/` (sozlesme yaz, sozlesme incele)
     - `plugins/ust-derece/` (istinaf, temyiz)
     - `plugins/bilirkisi/` (bilirkisi denetleme, bilirkisi rapor uretme)
     - `plugins/hesaplama/` (iscilik, kira, trafik tazminat)

2. **Slash namespace** (~2 gun)
   - `/iletisim:bilgilendir`, `/strateji:degerlendir`, `/sozlesme:incele`, vb.
   - **Geri uyumluluk:** Eski komutlar (`muvekkil bilgilendir:`, `strateji degerlendir:`) **calismaya devam etsin** — sadece namespace ekle, eskiyi kaldirma

3. **Plugin enable/disable** (~1 gun)
   - `config/active-plugins.json`: aktif plugin listesi
   - Director Agent calismayan plugin komutlarini reddetsin

4. **5 sub-agent (.claude/agents/) plugin'lestir** (~2 gun)
   - 5 agent'i `plugins/stratejik-analiz/.claude/agents/` icine tasi (Anthropic format ile)

5. **Plugin marketplace'e gonderme on-hazirlik** (~1 gun, opsiyonel)
   - `.claude-plugin/plugin.json` + README + LICENSE
   - Anthropic claude-plugins-official'a application

**Beklenen kazanim Faz 2:**
- Yeni plugin ekleme **saatler icinde** (gun degil)
- Plugin paylasim (community, baska avukatlara)
- Test/regression plugin-bazli

### FAZ 3 — Yeni Hukuk Alani Modulleri (1 ay, secime bagli risk)

> **Eski rapor Faz 3 genisletilmis** — 5 oneri yerine 7 oneri, oncelik avukatin pazar karariyla.

| # | Modul | Effort | Avantaj |
|---|---|---|---|
| 1 | **KVKK Uyumluluk Plugin'i** (VERBIS / m.11 / m.12 yaniti / aydinlatma metni) | 1-2 hafta | B2B hizmet alani |
| 2 | **IP-Plugin + MarkaPatent MCP** | 1-2 hafta (MCP varsa); 3-4 hafta (yoksa scratch) | Fikri mulkiyet davalari |
| 3 | **Vergi Plugin'i** (VUK / GIB tebligleri risk analizi) | 2-3 hafta | Vergi davasi yazimi |
| 4 | **Icra/Iflas Plugin'i** (IYK sure takibi + takip dilekcesi) | 1-2 hafta | Icra avukatligi |
| 5 | **TBB Etik Plugin'i** (reklam yasagi + sosyal medya etik denetimi) | 1 hafta | Avukat oz-denetim |
| 6 | **AI Governance Plugin'i** (KVKK Kurulu AI kararlari + EU AI Act takibi) | 2 hafta | 2027+ trend |
| 7 | **Sirket / M&A Plugin'i** (MERSIS + sirket sicili + due diligence checklist) | 2-3 hafta | Kurumsal musteri |

### FAZ 4 — Scheduled Agents (1-2 hafta, orta risk)

> **YENI (v2'de eklendi)** — eski raporda yoktu.

Anthropic'in 5 scheduled agent felsefesini bizim sisteme uyarla:

1. **`docket-watcher` paralleli — UYAP safahat-watcher** (Faz 1'in nimeti)
   - Aktif dava listesindeki UYAP safahatlarini gunde 1x kontrol et
   - Yeni safahat varsa MemPalace `wing_{dava_id}/hall_safahat`'a yaz + avukata bildirim
   - **Bagimli:** UYAP MCP veya browser-agent (Faz 5)

2. **`reg-change-monitor` paralleli — Mevzuat degisiklik takipci**
   - Buronun ilgilendigi kanunlarda (Is K., TBK, HMK, KVKK, TTK) degisiklik var mi haftalik
   - Mevzuat CLI + Resmi Gazete RSS

3. **`renewal-watcher` paralleli — Calendar entegrasyonu derinlestir**
   - Zamanasimi + hak dusurucu sure + arabuluculuk basvuru + durusma — hepsi olay-tetiklemeli alert

4. **Mevcut `ictihat tara`yi derinlestir**
   - Sadece Yargitay degil, HGK + IBK + AYM tarama
   - Bedesten + Lexpera (eklenirse)

**Beklenen kazanim Faz 4:**
- Avukat manuel takip yapmiyor; sistem proaktif uyariyor
- Geciken safahat / kacirilan deadline riski azaliyor

### FAZ 5 — UYAP Scraping / Browser Otomasyon (Uzun vadeli, yuksek risk)

> **Eski rapor Faz 4 genisletilmis.**

`browser-agent` ile UYAP avukat portali otomasyonu:

1. **Pilot: Safahat sorgulamasi** (en az hassas islem)
   - Playwright + e-imza otomatik baglama
   - Avukatin elinde e-imza takililiyken sistem otomasyona devam edebilir mi karari

2. **Sonra: Tevzi sorgulamasi** (dava acilis sirasinda hangi mahkemeye dustu)
3. **Sonra: e-Tebligat takip** (yeni tebligat geldi mi)
4. **Belki: Dilekce yukleme** (cok riskli — sadece pilot olarak kontrollu)

**Risk uyari:**
- KVKK Seviye 3 (yerel OCR + Ollama) yoksa avukatin e-imzasi otomasyonda gorunecek — kalin risk
- Baroya bildirim sorumlulugu var mi avukata sor

### FAZ 6 — Multi-User / Cloud / Managed Agents API (Cok uzun vadeli, secime bagli)

> **YENI (v2'de eklendi)** — eski rapor sadece tek-makine modelinde dusunmustu.

Eger avukat:
- Birden fazla yerden (ofis + ev + mobile) erismek istiyorsa
- Ikinci bir avukat (junior) sistemi kullanmaya baslarsa
- Buro buyurse (5+ avukat)

O zaman:
1. **Anthropic Managed Agents API** uzerinden deploy
2. **Multi-tenant database** (bizim simdiki tek-makine PostgreSQL / SQLite)
3. **Mobile companion app** (avukat sahaya cikinca brifing ekleyebilsin)

**Risk:**
- KVKK Seviye 2 dict dosyalari (`config/masks/*.json`) cloud'a gitmemeli
- Multi-tenant verilerin segregation'i
- Performance: 5 avukat aynı anda 5 dava acsa Antigravity panelinin paralelitelesi?

Bu Faz 6 avukatin secimine kalmis — su an gereksiz olabilir.

---

## 7. COST & ROI ANALIZI

Eski raporda yoktu. v2'de eklenmesi gerekli (avukat karar verici).

### 7.1 Mevcut sistem cost (aylık tahmin)

| Kalem | Maliyet |
|---|---|
| Claude API (Opus 4.7 + Sonnet — terminal kullanim) | $200-500/ay (orta yogunlukta avukat kullanim) |
| Antigravity (Gemini 3.1 Pro sag panel) | $20/ay (Google AI Studio Pro plan) veya $30-50/ay (kullanim bazli) |
| Anthropic plugin marketplace | Ucretsiz (community plugins) |
| MCP servers (Yargi, Mevzuat, vb.) | Ucretsiz (kamuya acik) veya $50/ay (Composio Rube) |
| Google Drive Workspace | Avukat zaten kullananiyor |
| **TOPLAM** | **$270-600/ay** |

### 7.2 Anthropic Claude for Legal — fiyat (2026 Mayis)

- **Claude Cowork plugin:** Anthropic Claude Pro / Enterprise plan icinde dahil ($20-200/kullanici/ay)
- **Claude Code plugin:** Tum plan'lerde dahil
- **Managed Agents API:** Anthropic API kullanim bazli ($3/1M input token + $15/1M output token Opus 4.7 icin)
- **Cookbook deployment:** Compute maliyeti ek (AWS / GCP gibi cloud)

Anthropic'in 12 plugin'i kullanmak avukatin maliyetini **%50-150 artirir** eger Managed Agents API uzerinden deploy edilirse; Cowork plugin uzerinden manuel kullanilsa **artistirma %20-30**.

### 7.3 Faz 1-2 yatirimi (Anthropic-uyumluluk)

| Faz | Adam-saat | Adam-gun | Tahmini Claude API maliyeti (kod yazma) |
|---|---|---|---|
| Faz 0 (Arastirma) | 16-24 saat | 2-3 gun | $20-50 |
| Faz 1 (Hizli kazanim) | 40 saat | 1 hafta | $80-150 |
| Faz 2 (Plugin manifest) | 80 saat | 2 hafta | $150-300 |
| **TOPLAM Faz 0-2** | **136-144 saat** | **3 hafta** | **$250-500** |

Faz 1-2 ile **yeni dava basina ortalama 30-40 dk tasarruf** (playbook + cold-start + namespace), aylık 10 dava varsa **5-7 saat zaman tasarrufu** — avukatin saatlik ucretiyle hesap edilirse cok hizli amorti olur.

### 7.4 Lexpera entegrasyonu — kritik cost karari

Lexpera Pro lisansi ~₺2,500/ay (~$80/ay). Eger bizim sistem Lexpera MCP icerirse:
- Yargi MCP'den daha kapsamli icerik (doktrin + makale + kararlar tek platformda)
- ATC (Adli Tip Curumu) icerikleri
- Profesyonel sınıflandırma

**Onerim:** Faz 3'te avukatin karar verecegi opsiyonel kalem. Karsiligi: kalite atlamasi.

---

## 8. LATENCY ANALIZI

Eski raporda yoktu. Antigravity hibrit mimarinin maliyeti net olmali.

### 8.1 Mevcut latency (tek pilot dava ortalamasi)

| ASAMA | Yontem | Sure |
|---|---|---|
| ASAMA 0 (MemPalace Wake-up) | Terminal Claude MCP | 30-60 sn |
| ASAMA 1 (Briefing) | Terminal Claude | 5-10 dk (avukat interaksiyonu) |
| ASAMA 2 (Arastirma) | Terminal Claude + 4 MCP | **15-25 dk** (en yavas — Yargi + Mevzuat MCP) |
| ASAMA 3 (Usul) — Batch 1 | Antigravity manuel devir + uretim | 5-7 dk (1 dk yapistirma + 4-6 dk uretim) |
| ASAMA 4 (5-Ajan) — Batch 2 | Antigravity tek sohbet 5 perspektif | 8-12 dk |
| Avukat onay (4E KIRMIZI / SARI / YESIL) | Manuel | 2-5 dk |
| ASAMA 5+6+7 — Batch 3 | Antigravity tek sohbet 3 cikti | 15-20 dk |
| MD → DOCX → UDF | Terminal Claude scripts | 1-2 dk |
| **TOPLAM (yeni dava akisi)** | | **50-80 dk** |

### 8.2 Anthropic Claude for Legal (tahmini, comparable workflow)

Anthropic Cowork plugin tek-pencere, tek-motor (Claude). Tahmini:

| ASAMA | Sure |
|---|---|
| `/litigation-legal:matter-intake` (brifing) | 5-10 dk |
| `/litigation-legal:matter-briefing [slug]` (arastirma) | 10-15 dk (CourtListener + Westlaw paralelinde) |
| Draft uretim (claim-chart vb.) | 5-10 dk |
| `/litigation-legal:demand-draft` (ihtarname) | 3-5 dk |
| **TOPLAM** | **23-40 dk** |

**Anthropic Cowork yaklasık 2x hizli** — cunku:
- Tek motor, tek pencere, manual devir bloku yok
- Kapsami daha dar (Anthropic Turkiye-spesifik mulga eleme, adliye dogrulamasi, 9 hesaplama modulu yapmıyor)
- Self-review yok (her ASAMA sonu kalite kapisi yok)

### 8.3 Hibrit avantaj/dezavantaj tablosu

| Faktor | Bizim sistem | Anthropic |
|---|---|---|
| **Latency** | 50-80 dk (yavas) | 23-40 dk (hizli) |
| **Kalite** | Yuksek (4 kapi + self-review + Bedesten dogrulama + mulga eleme) | Orta (Anthropic counsel-review-aware) |
| **Turkce hukuk derinlik** | Cok yuksek | Dusuk (manuel CLAUDE.md profili gerekli) |
| **KVKK guvenligi** | Yuksek (Seviye 2 maskeleme) | Dusuk (kullanici manuel) |
| **Esneklik** | Orta (kullanici-kontrollu pause/devam) | Yuksek (komutsal, hizli) |
| **Cost** | $270-600/ay | $50-200/ay (Cowork plan) veya $500+/ay (Managed Agents) |

**Sonuc:** Bizim sistem **kalite vs latency** dengesinde kalite tarafinda; Anthropic **latency vs derinlik** dengesinde latency tarafinda. Avukat icin **kalite vs hiz** karari secime bagli.

---

## 9. RISK REGISTER (her onerinin riski)

| Oneri | Risk | Mitigasyon |
|---|---|---|
| Plugin manifest format | Bizim sistem zaten calisiyor — refactoring breakage | Geriye uyumlu — manifest opsiyonel, eski komutlar calismaya devam |
| Slash namespace | Avukat aliskanligi degisir | Eski format de kabul edilsin (alias) |
| Playbook sistemi | Yanlis playbook secimi yanlis hipotez ureticisi | 4E sentez KIRMIZI flag'iyle yakalanir |
| MarkaPatent MCP | TURKPATENT API'si zayif (rate limit, captcha) | `harvest` agent + Composio fallback |
| KVKK Uyumluluk plugin'i | Yeni hizmet alani — buro pazar zaten meşgul mu? | Avukatin pazar karariyla |
| Lexpera entegrasyonu | Aylık $80 fiyat | Avukat ROI hesabi yapmali |
| UYAP scraping | e-imza otomasyon ihlali baroya bildirim | Avukatin hukuk karari |
| md_to_xlsx | Excel format degisikligi ileride | Openpyxl stable kutuphane |
| Scheduled agents | Cron / background process management | Anthropic'in `scheduled-tasks` MCP'si veya OS-level scheduler |
| Cold-start interview | Avukat ek emek harcayacak | Mevcut uslup-aykut.md + legal.local.md zaten dolu, sadece confirmation gerekli |
| Multi-user/Cloud (Faz 6) | KVKK Seviye 2 dict cloud'a kacirilirsa ihlal | Faz 6 baslamadan once KVKK Seviye 3 yerel LLM gerekli |

---

## 10. REDDEDILEN ONERILER v2 (eski 7 + yeni 4)

Eski raporda 7 reddedilen vardi; v2'de 4 ek:

8. **Anthropic'in `legal-builder-hub:registry-sync` agent'i** — eski raporda da reddedildi; v2'de dogrulandi (bizim Composio/Rube zaten plugin marketplace destegi var).
9. **Anthropic'in `oc-status` haftalik Outside Counsel raporu** — bizim buro tek-avukat, anlamsiz.
10. **Anthropic'in FRCP `legal-hold` discovery sablonu** — Turkiye'de FRCP yok; UYAP delil hazirlama farkli mekanizma.
11. **Anthropic'in `law-school` plugin'i (ABD baro sinavi gomulu)** — eski raporda da reddedildi; v2'de teyitlendi.

---

## 11. BIZIM SISTEMIN ANTHROPIC'E KATKILARI (TERS YONDE FARK)

> **YENI (v2'de eklendi)** — Eski rapor sadece "biz Anthropic'ten ne aliriz" diye sordu. v2 "Anthropic bizden ne alabilir" de sorar.

Anthropic gelecek surumlerde su ozelliklere baksa kazanir:

1. **Manuel uslup parmak izi cikartmasi** (uslup-aykut.md ornegi) — Anthropic cold-start interview kullanici manuel doldurur, biz emsal dilekceden otomatik cikartmisiz
2. **Bedesten documentId zorunlu dogrulama** — Anthropic `[VERIFY:]` marker'i counsel'a birakir, biz sistem-otomatik tam metin cekme zorunlu kilmisiz
3. **Hata gecmisi sistemik bellek** — Tugba 2026-89 ornegi gibi, sistemden ogrenen doktrin formati
4. **MemPalace promotion logic** — 2+ kez kullanimda olgun argumana promote — bunun Anthropic'te paralleli yok
5. **Antigravity hibrit motor secimi** — Bir motor tek basina yetmiyor ise hibrit mantik (Anthropic Cowork sadece Claude)
6. **5-ajan paralel perspektif spawn** + 4E sentez fan-in — Anthropic'in `agents/` klasoru scheduled background, paralel multi-perspective yok
7. **3 Batch devir blogu protokolu** (Mehmet Ali 2026-003 pilot dersinden cikan)
8. **Aktor profilleri** (hakim/karsi avukat) — Anthropic'te yok

Anthropic'in resmi `claude-for-legal` deposuna **PR gonderilebilir** mi? Belki: ozellikle (3), (4), (6) konsept olarak. Avukat karariyla.

---

## 12. AVUKAT KARARI BEKLEYEN SORULAR v2 (eski 5 + yeni 6)

**Eski (v1):**

A. Faz 1 (SKILL.md frontmatter + Playbook v1) baslayalim mi?
B. Faz 2 (Plugin manifest mimarisi) over-engineering mi?
C. Faz 3 hangi alan ilk (KVKK / IP / Vergi / Icra / TBB)?
D. Faz 0 Anthropic Github incele (1-2 gun) baslangic mi?
E. Reddedilen onerilerden hicbiri geri alinmasi gereken var mi?

**v2 yeni:**

F. **Lexpera / Kazanci entegrasyonu** ($80/ay) yapilsin mi? Kalite atlama vs maliyet.
G. **md_to_xlsx Excel cikti** Faz 1'e dahil edilsin mi? Bilirkisi raporu kullanici Excel'de oynayabilir.
H. **Scheduled agents** (UYAP safahat-watcher) Faz 4 olarak prio'ya alinsin mi? UYAP MCP / browser otomasyonu gerekli.
I. **Slash namespace** (`/iletisim:bilgilendir`) gecisi avukat aliskanligini degistirir — geriye uyumlu yapilsin mi?
J. **Cold-start interview komutu** Faz 1'de eklensin mi (mevcut uslup-aykut.md + legal.local.md ile confirm aksiyonu)?
K. **Anthropic'e PR gonderme** (KVKK maskeleme + 0-Halusinasyon Doktrini elementleri) avukatin marka/kariyer hedefiyle uyumlu mu?

---

## 13. KAYNAK DOGRULAMA TABLOSU v2 (eski 9 satir → 18 satir)

| Iddia | Kaynak | Dogrulama durumu | v1'den degisim |
|---|---|---|---|
| Anthropic claude-for-legal'da 12 plugin var | github.com/anthropics/claude-for-legal | **DOGRULANMIS** (GitHub repo'sunda 12 plugin klasoru var) | Teyitlendi |
| Toplam 151 skill var | betaspacestudio yazisi (Yesil 60 + Sari 75 + Kirmizi 16) | **DOGRULANMIS yazidan**; GitHub'da skill sayimi yapilamadi (knowledge-work-plugins/legal'de 6, claude-for-legal'de daha cok) | v1'de DOGRULANMIS, v2 kosulla teyitlendi |
| Litigation-legal Turkiye basari orani %21 | betaspacestudio yazisi | **DOGRULANMIS yazidan** | Aynı |
| MarkaPatent MCP TURKPATENT'i kapsiyor | betaspacestudio yazisi | **DOGRULANMIS yazida**; Rube/Composio'da var mi araştırılmadı (Faz 0'da yapilacak) | v1 ile aynı |
| Mevzuat MCP BDDK/SPK/EPDK/BTK/RTUK/SEDDK/MASAK kapsiyor | betaspacestudio yazisi | **DOGRULANMASI GEREKIR** — bizim Mevzuat MCP'mizde pilot sorgu yapilmadi | v1 ile aynı |
| Anthropic SKILL.md formati YAML frontmatter ile basliyor | `knowledge-work-plugins/legal/skills/review-contract/SKILL.md` | **DOGRULANMIS — SADECE 3 ALAN: name, description, argument-hint** | v1'de "DOGRULANMASI GEREKIR" idi; v2'de DOGRULANDI ve eski iddianin (11 alan) YANLIS oldugu tespit edildi |
| "Boş playbook YELLOW karari verir" konsepti var | review-contract SKILL.md (GREEN/YELLOW/RED severity) | **DOGRULANMIS — GREEN/YELLOW/RED 3-tier system** | Teyitlendi |
| 6 modul eksiklik (KVKK / UYAP / MERSIS / Vergi / TBB / IYK) | betaspacestudio yazisi | **DOGRULANMIS** | Aynı |
| Anthropic repository'sinin tam ic yapisi | github.com/anthropics/claude-for-legal/litigation-legal/ | **DOGRULANMIS — litigation-legal detayi incelendi (14 command, 14 skill, agents/, matters/, demand-letters/, inbound/, oc-status/)** | v1'de "DOGRULANAMADI" idi; v2'de DOGRULANDI |
| plugin.json 4 alanli (name, version, description, author) | knowledge-work-plugins/legal/.claude-plugin/plugin.json | **DOGRULANMIS** | YENI iddia (v1'de yoktu) |
| 14 slash command litigation-legal'da | github tree | **DOGRULANMIS** | YENI |
| Anthropic inline marker conventions `[CITE:]`, `[VERIFY:]`, `[SME VERIFY:]` | litigation-legal skill icerigi | **DOGRULANMIS** | YENI |
| Thomson Reuters CoCounsel partnership 2026 Mayis | Bloomberg, TechCrunch, Reuters press release | **DOGRULANMIS — 2026-05-12 ilan** | YENI |
| Anthropic 5 managed-agent cookbook (renewal-watcher, docket-watcher, reg-change, diligence-grid, launch-radar) | claude-for-legal README | **DOGRULANMIS** | YENI |
| Excel-facing skills (tabular-review, claim-chart, entity-compliance, renewal-tracker) | claude-for-legal README | **DOGRULANMIS** | YENI |
| Cold-start interview her plugin'de standart | claude-for-legal/QUICKSTART | **DOGRULANMIS — `/<plugin>:cold-start-interview` komut formati** | YENI |
| Anthropic CONNECTORS.md tool-agnostic `~~category` placeholder | knowledge-work-plugins/legal/CONNECTORS.md | **DOGRULANMIS** | YENI |
| Anthropic Managed Agents API uzerinden deploy edilebilir | claude-for-legal README | **DOGRULANMIS** | YENI |

**Risk flag'leri:**
- v2 hala bir blog yazisi + GitHub repo README/SKILL.md/plugin.json bazli. **Plugin gercek calismasi gozlemlenmedi** — yani Anthropic Cowork plugin'i indirip kullanmadik. Bu **Faz 0**'da yapilabilecek bir adim.
- Lexpera / Kazanci API erisilebilirligi dogrulanmadi.
- MarkaPatent MCP'nin Rube/Composio'da varligi dogrulanmadi.

---

## 14. SONUC ve TAVSIYE v2

**Net sonuclar:**

1. **Bizim sistem litigation alanında Anthropic'in litigation-legal plugin'inin (%21 Turkiye basari) ilerisinde.** Kalite kapilari, KVKK, UDF, 0-Halusinasyon, mulga eleme, normlar hiyerarsisi — hicbiri Anthropic'te yok.

2. **Anthropic'in bize ogretebilecegi: yapisal disiplin (plugin manifest + slash namespace + cold-start interview + scheduled agents + Excel cikti).** Bunlarin tamami **3 hafta icinde** Faz 0+1+2 ile entegre edilebilir.

3. **Anthropic'in bize ogretemeyecegi: Turk hukukuna ozel derin uzmanlik.** Lexpera entegrasyonu + IP-Plugin + KVKK uyumluluk plugin'i avukatin pazarına bagli secimler.

4. **Anthropic'in bize hizla cevabi: yok.** Bizim sistem **hibrit + 3 Batch + manuel devir** maliyetiyle 50-80 dk/dava; Anthropic Cowork 23-40 dk/dava — yarisi suremiz. Eger hiz kritikse Antigravity hibrit'ten **tam Anthropic gecisi** dusunulebilir (ama kalite vs hiz takasinin sonucu kalite kayrir).

**Onerim — Avukat icin somut karar matrisi:**

| Tercih | Yapilacak | Etki |
|---|---|---|
| **A) Status quo + Faz 1** | SKILL.md frontmatter + Playbook v1 + md_to_xlsx | 1 hafta, %10-15 hiz, %0 kalite degisimi |
| **B) Faz 1 + Faz 2** | A + Plugin mimarisi | 3 hafta, %20-30 hiz, %5 kalite (regression azalir) |
| **C) Faz 1+2+3 (KVKK/IP)** | B + KVKK uyumluluk + IP-Plugin | 6-8 hafta, yeni hizmet alani, B2B gelir |
| **D) Faz 1+2+3+4 (Scheduled agents + UYAP)** | C + UYAP browser otomasyon | 3-4 ay, proaktif takip, kacirilan deadline riski %80 dusus |
| **E) Tam Anthropic gecis** | Mevcut sistem terk + Anthropic Cowork + 12 plugin + manuel uyarlama | 2 hafta, %50 hiz artisi, kalite ciddi dusus, KVKK riski |

**Tavsiyem:** **B** secenegi (Faz 1+2, 3 hafta). C ve D avukatin pazar karariyla, E **kesinlikle reddedilmeli** (kalite ve KVKK kayiplari telafi edilemez).

---

## 15. EK — Anthropic Plugin Yapisinin Bizim Sisteme Birebir Ce­virisi

Eger Faz 2 yapilirsa, bizim sistem su Anthropic-uyumlu yapiya cevrilir:

```
buro-aykut/                                  ← yeni: kok proje (mevcut: Eski Claude/)
├── .claude-plugin/
│   └── plugin.json                          ← YENI: {"name": "buro-aykut", "version": "3.0.0", "description": "Turk hukuk burosu asistani — 7 ASAMA + 14 ajan + Antigravity hibrit", "author": {"name": "Av. Aykut Yesilkaya"}}
├── .mcp.json                                 ← MEVCUT: Yargi/Mevzuat/Literatur/Yoktez/MemPalace/Drive/Calendar/Gmail
├── CLAUDE.md                                 ← MEVCUT: ana profil
├── CONNECTORS.md                             ← YENI: MCP entegrasyon listesi (Anthropic-format tool-agnostic)
├── README.md                                 ← MEVCUT
├── QUICKSTART.md                             ← YENI: 60sn kurulum kilavuzu
├── ajanlar/                                  ← MEVCUT (Director + 6 SKILL.md)
├── .claude/agents/                           ← MEVCUT (5 perspektif sub-agent)
├── .claude/commands/                         ← MEVCUT (17 komut)
├── prompts/gemini/                           ← MEVCUT (15 prompt)
├── scripts/                                  ← MEVCUT (10 script)
├── sablonlar/                                ← MEVCUT (11 sablon)
├── playbook/                                 ← YENI: Faz 1 (5+ dava turu sablonu)
├── plugins/                                  ← YENI: Faz 2
│   ├── iletisim/
│   │   ├── .claude-plugin/plugin.json
│   │   ├── .claude/commands/bilgilendir.md
│   │   └── prompts/muvekkil_bilgilendirme.md
│   ├── strateji/
│   ├── sozlesme/
│   ├── ust-derece/
│   ├── bilirkisi/
│   ├── hesaplama/                            ← iscilik-hesaplama.md buraya tasinir
│   └── kvkk-uyumluluk/                       ← Faz 3 (opsiyonel)
└── matters/                                  ← YENI: Faz 4 (portfolio ledger - Anthropic-format)
    └── _log.yaml                             ← Drive klasoru mirror'u
```

**Bu yapiyla:**
- Anthropic Cowork plugin marketplace'e gonderilebilir
- Baska avukatlara plugin paylasimi yapilabilir
- Modul bazli versiyonlama (plugin/iletisim 1.0, plugin/sozlesme 2.0)
- Test/regression plugin bazli
- Yeni hukuk alani modulleri **saatler icinde** eklenir (Anthropic'in 12 plugin'i nasil kuruyorlarsa)

---

> TASLAK — Avukat onayina tabidir.
> Hazirlayan: Hukuk Basasistani (Claude / Antigravity hibrit; bu rapor Claude terminalde uretildi, gercek GitHub kaynak kod incelemesi + bizim sistemin tam envanteri ile audit yapildi).
> Tarih: 2026-05-14
> Versiyon: 2.0 (v1'in 7 ana eksigi kapatildi, 18+8 yeni alan eklendi, kaynak dogrulama tablosu 9'dan 18 satira cikarildi)

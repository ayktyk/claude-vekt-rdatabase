# Arşiv — Pasifleştirilmiş Modüller

**Tarih:** 2026-07-09
**Karar:** Avukat Aykut — araştırma modülü revizyonu.

Araştırma çekirdeği Yargı-MCP-Pro + Mevzuat + NotebookLM'e sadeleştirildi.
Aşağıdaki modüller AKTİF AKIŞTAN çıkarıldı ve buraya taşındı. Aktif
dokümanlarda (CLAUDE.md, SKILL.md, arastir*.md, FIVEAGENTS.md) bunlara
referans KALMAMALIDIR.

| Modül | İçerik | Neden pasifleştirildi | Geri alma koşulu |
|---|---|---|---|
| 2A Süper Stajyer | `komutlar/arastir-stajyer*.md`, `scripts/superstajyer.py`, `scripts/launch-chrome-cdp.ps1`, `config/superstajyer.json`, `prompts/stajyer/`, `docs/SSTAJYER.md` | Kullanılmıyor; CDP tarayıcı otomasyonu zincirin en kırılgan tek-hata-noktasıydı | Avukat tekrar abone olur + CDP kurulumunu ister |
| Faz D Argüman.ai | `komutlar/arastir-arguman.md`, `docs/ARGUMAN.md` | Kullanılmıyor; halüsinasyon geçmişi (Mehmet Ali: 2/2 yanlış künye), doğrulama köprüsü ekstra yük | Avukat kredili aboneliği yeniden aktive eder |
| 2E Akademik (DergiPark+YÖK Tez) | `komutlar/arastir-akademik.md` | 2026-05-19'da zaten kaldırılmıştı; ölü komut dosyası | Akademik doktrin kolu yeniden tasarlanırsa |
| Codex motoru (2026-07-13→19) | `codex-motor/`: `AGENTS.md` (Codex Director anayasası), `.codex/` (config + hooks + 5 perspektif ajan TOML), `.agents/skills/` (Codex skill kopyaları), `yargi_model_pipeline.py` + testi + `yargi-sentez-output.schema.json` (çok-modelli 2B pipeline) | Avukat kararı 2026-07-19: Codex denemesi beklentiyi karşılamadı; orkestra şefi + tüm tool kullanımı Claude Fable 5'e (fallback Opus 4.8) döndü, Codex fallback olarak dahi kalmadı | Avukat açıkça Codex'e dönüş kararı verirse (`git mv` ile eski yollara + config/dokümanlara referansları geri ekle; spec: `docs/superpowers/specs/2026-07-18-claudesiz-motor-revizyonu-design.md`) |

**KVKK maskeleme (`scripts/maske.py`) ARŞİVLENMEDİ** — script repoda kaldı
(`cikti_dogrula.py` TC-checksum için import ediyor). Yalnızca akıştaki
ZORUNLULUĞU ertelendi: bulut LLM'lerle (Claude/Gemini) çalışırken maskeleme
uygulanmıyor; avukat YEREL LLM'e geçtiğinde maskeleme zorunluluğu geri
gelecek. Detay: CLAUDE.md "KVKK Maskeleme (ERTELENDİ)" bölümü.

Geri alma: dosyayı eski yoluna `git mv` ile taşı + aktif dokümanlara
referansları geri ekle. Tam eski hâl için git geçmişi: `git log --follow <dosya>`.

**Codex arşivi notu (2026-07-19):** `codex-motor/` içindeki `.codex/` ve
`.agents/` klasör adları geri-alma kolaylığı için orijinal haliyle korunmuştur
(nokta ile başlar — `ls -a` ile görünür). Dönüş spec'i:
`docs/superpowers/specs/2026-07-19-claude-gemini-donus-design.md`.

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

**KVKK maskeleme (`scripts/maske.py`) ARŞİVLENMEDİ** — script repoda kaldı
(`cikti_dogrula.py` TC-checksum için import ediyor). Yalnızca akıştaki
ZORUNLULUĞU ertelendi: bulut LLM'lerle (Claude/Gemini) çalışırken maskeleme
uygulanmıyor; avukat YEREL LLM'e geçtiğinde maskeleme zorunluluğu geri
gelecek. Detay: CLAUDE.md "KVKK Maskeleme (ERTELENDİ)" bölümü.

Geri alma: dosyayı eski yoluna `git mv` ile taşı + aktif dokümanlara
referansları geri ekle. Tam eski hâl için git geçmişi: `git log --follow <dosya>`.

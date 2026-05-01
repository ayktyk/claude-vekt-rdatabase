# QMD (Query Markup Documents) Kurulum Rehberi

Tarih: 2026-04-11 (guncelleme: 2026-04-11)
Referans: FINALAUDIT.md Bolum 16
GitHub: https://github.com/tobi/qmd
npm: https://www.npmjs.com/package/@tobilu/qmd

---

## 1. QMD Kurulumu

```bash
# Node.js 18+ gerekli
npm install -g @tobilu/qmd

# Dogrulama
qmd --version
# Beklenen: qmd 2.1.0+
```

NOT: GTX 1050 Ti gibi eski GPU'larda CUDA hatasi olabilir.
Cozum: `GGML_CUDA=0` ortam degiskeni ile CPU modunda calistir.
MCP konfigurasyonunda bu degisken zaten ayarli.

## 2. Proje Koleksiyonu (Paylasimli — Tum Ajanlar Erisir)

```bash
# Proje kokunde calistir
cd "C:\Users\user\Desktop\projelerim\Vektor Database li Otomasyon Claude Code"

# Proje bilgi tabani indexleme
qmd collection add . --name proje-bilgi --mask "**/*.md"

# Ilk embedding (CUDA hatasi alinirsa GGML_CUDA=0 ekle)
GGML_CUDA=0 qmd embed

# Context ekle (arama kalitesini arttirir)
qmd context add "qmd://proje-bilgi/" "Turkiye hukuk otomasyon sistemi: 6 ajan SKILL.md, sablonlar, bilgi tabani, dilekce yazim kurallari, CLAUDE.md sistem talimatlari, iscilik hesaplama formulleri."
```

## 3. Ajan-Bazli Koleksiyonlar (Izole)

NOT: Google Drive lokal baglantisi gerekir. Drive baglaninca asagidaki
komutlari calistir.

```bash
# Arastirmaci — Drive'daki tum arastirma raporlari
qmd collection add "G:\Drive'im\Hukuk Burosu" --name ajan-arastirmaci --mask "**/02-Arastirma/*.md"

# Dilekce Yazari
qmd collection add "G:\Drive'im\Hukuk Burosu" --name ajan-dilekce --mask "**/03-Sentez-ve-Dilekce/*.md"

# Usul Uzmani
qmd collection add "G:\Drive'im\Hukuk Burosu" --name ajan-usul --mask "**/01-Usul/*.md"

# Savunma Simulatoru
qmd collection add "G:\Drive'im\Hukuk Burosu" --name ajan-savunma --mask "**/savunma-simulasyonu*.md"

# Revizyon Ajani
qmd collection add "G:\Drive'im\Hukuk Burosu" --name ajan-revizyon --mask "**/revizyon*.md"

# Pazarlama
qmd collection add ./blog-icerikleri --name ajan-pazarlama --mask "**/*.md"

# Tum koleksiyonlari embedle
GGML_CUDA=0 qmd embed
```

## 4. MCP Server Baslatma

```bash
# QMD MCP server'i baslat (stdio modu — Claude Code icin)
GGML_CUDA=0 qmd mcp

# .mcp.json'da zaten tanimli — Claude Code otomatik baglanir
# HTTP daemon modu (opsiyonel — birden fazla client icin):
# GGML_CUDA=0 qmd mcp --http --daemon
```

## 5. Guncelleme

```bash
# Yeni/degisen dosyalari indexle
qmd update

# Belirli koleksiyonu guncelle
qmd update --collection proje-bilgi
```

## 6. Kullanim Ornekleri

```bash
# Proje genelinde ara
qmd search "fazla mesai ispat yuku" --collection proje-bilgi

# Arastirmacinin gecmis ciktilarinda ara
qmd search "kidem tazminati tavani" --collection ajan-arastirmaci

# Session checkpoint'larinda ara
qmd search "nerede kaldik" --collection sessions
```

## 7. QMD vs MemPalace Karsilastirma

| Ozellik | MemPalace | QMD |
|---|---|---|
| Yapi | YAPILANDIRILMIS (wing/hall/room) | YAPISIZ (herhangi metin) |
| Arama | Taxonomy-bazli gezinme | Hibrit: BM25 + Vektor + LLM Reranker |
| Yazma | Manuel diary + drawer | Otomatik dosya indexleme |
| Guc | Olgun arguman promosyonu, audit trail | Beklenmedik baglanti kesfetme |
| Konum | %100 lokal (KVKK uyumlu) | %100 lokal (KVKK uyumlu) |

**IKISI BIRLIKTE CALISIR. QMD MemPalace'in yerini ALMAZ.**

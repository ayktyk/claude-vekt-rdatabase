# Tek Motorlu, Motor-Bağımsız Hukuk Otomasyonu — Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sistemi tek motorla (hangi LLM ile bağlanılırsa onunla) uçtan uca çalışır hâle getirmek, kök dizindeki tekrar eden dokümanı tek anayasada toplamak ve Hukuk Nosyonu kitabından çıkarılan olay çözüm metodolojisini ASAMA 1 (ilk dava analizi) adımına yedirmek.

**Architecture:** Kök dizinde tek anayasa (`AGENTS.md`) + araç adaptörü stub'ları. Model adları yerine dört rol (`ORKESTRATOR`, `ARASTIRMACI`, `MUHAKEME`, `DENETCI`) `config/motor-haritasi.json`'dan okunur. İki motorlu elle devir mimarisi kalkar; kalite, üretim bağlamını görmeyen sıfır-bağlamlı `DENETCI` alt-ajanının deterministik ölçümüyle korunur. Kitap 306 sayfa OCR edilip derin okunur; çıkan protokolün her adımı sayfa referanslı veya `[SİSTEM EKİ]` etiketlidir.

**Tech Stack:** Python 3 (PyMuPDF, pytesseract, pytest), Tesseract 5.4 + `tur` dil paketi, Markdown, git. Yeni bağımlılık yok.

**Spec:** `docs/superpowers/specs/2026-09-02-tek-motor-agnostik-toparlama-design.md`

---

## Dosya Haritası

**Yeni oluşturulacak scriptler** (her biri tek sorumluluk):

| Dosya | Sorumluluk |
|---|---|
| `scripts/kitap_ocr.py` | ✅ *yazıldı* — taranmış PDF → sayfa referanslı Türkçe OCR |
| `scripts/referans_kontrol.py` | Repo içi dosya referansları kırık mı (Faz 1 kapısı) |
| `scripts/vendor_lint.py` | Kanonik yüzeylerde sağlayıcı adı sızıntısı var mı (Faz 2 kapısı) |
| `scripts/motor.py` | Aktif motoru kaydet/oku (çıktı frontmatter damgası) |
| `scripts/protokol_kontrol.py` | Olay çözüm protokolünün her adımı etiketli mi (Faz 3 kapısı) |

**Yeni oluşturulacak dokümanlar:**

| Dosya | Sorumluluk |
|---|---|
| `AGENTS.md` | Tek anayasa (rol dili, 7 ASAMA, doktrin, kalite kapıları) |
| `README.md` | Hangi dosya ne işe yarar haritası |
| `bilgi-tabani/nosyon-okuma-notlari.md` | Kitabın bölüm bölüm okuma notları (sayfa referanslı) |
| `ajanlar/director/olay-cozum-protokolu.md` | **ASAMA 1'in yeni iskeleti — bu planın ana ürünü** |
| `bilgi-tabani/hukuki-yontem-kontrol-listesi.md` | Yorum yöntemi + mantık kontrol listesi |
| `ajanlar/denetci/SKILL.md` | Sıfır bağlamlı denetçi ajanının kanonik tanımı |
| `docs/davatek-kesif.md` | DavaTek klasör/format haritası (avukat doldurur) |

**Yeni testler:** `scripts/tests/test_referans_kontrol.py`, `test_vendor_lint.py`, `test_motor.py`, `test_protokol_kontrol.py`; mevcut `test_doktrin.py` 9. clause için genişletilir.

**Faz sırası:** 0 (OCR, çalışıyor) → 1 (toparlama) → 2 (rol dili) → **3 (kitap → ASAMA 1, ana iş)** → 4 (9. clause) → 5 (DENETCI) → 6 (DavaTek).

---

# FAZ 0 — OCR (arka planda çalışıyor)

### Task 0.1: OCR çıktısını doğrula ve şüpheli sayfaları kurtar

**Files:**
- Okunacak: `tmp/nosyon-ocr/00-OZET.md`, `tmp/ocr-calisma.log`
- Değiştirilecek: `tmp/nosyon-ocr/parca-*.md` (yalnız şüpheli sayfalar için yeniden OCR)

- [ ] **Step 1: OCR'ın bittiğini ve parça dosyalarının oluştuğunu doğrula**

```bash
cd "D:/projelerim/aktif projelerimm/Eski Claude antıgravıty"
tail -5 tmp/ocr-calisma.log
ls tmp/nosyon-ocr/
```

Beklenen: `[kitap_ocr] BITTI` satırı; `00-OZET.md` + 13 adet `parca-NN_sNNN-NNN.md` dosyası
(306 sayfa ÷ 25 = 13 parça).

- [ ] **Step 2: Özeti oku, şüpheli sayfa listesini al**

```bash
cat tmp/nosyon-ocr/00-OZET.md
```

Beklenen: "Supheli sayfa sayisi: N" satırı ve şüpheli PDF indekslerinin listesi.
Kapak, boş sayfa ve tam sayfa görsellerin şüpheli çıkması normaldir.

- [ ] **Step 3: Şüpheli sayfaları 400 dpi ile yeniden dene**

Step 2'deki listeyi `<liste>` yerine koy (örn. `3,7,44`). Şüpheli sayfa yoksa bu adımı atla.

```bash
python scripts/kitap_ocr.py "C:/Users/user/Desktop/Hukuk-Nosyonu-5.bsk_.pdf" \
  --cikti "tmp/nosyon-ocr-400" --sayfalar "<liste>" --dpi 400
cat tmp/nosyon-ocr-400/00-OZET.md
```

Beklenen: şüpheli sayfa sayısı azalır. Hâlâ şüpheli kalanlar `[OCR ŞÜPHELİ]` olarak kalır;
**bu sayfalara dayanan hiçbir kural Faz 3'te doğrulanmadan kullanılamaz.**

- [ ] **Step 4: Rastgele 10 sayfada kalite kontrolü (spec 3.4.1)**

10 sayfayı seç (örn. 30, 60, 90, 120, 150, 180, 210, 240, 270, 300) ve OCR metnini oku:

```bash
grep -A 12 "pdf:030" tmp/nosyon-ocr/parca-02_*.md
```

Her sayfa için kontrol: Türkçe karakterler (`ı ğ ş İ ç ö ü`) doğru mu, cümleler
anlamlı mı, sayfa sınırı doğru mu. Bozukluk varsa o sayfayı Step 3'teki listeye ekle
ve tekrarla.

- [ ] **Step 5: OCR çıktısının repoya girmediğini doğrula**

```bash
git status --short | grep -i nosyon || echo "TEMIZ - OCR ciktisi git disinda"
```

Beklenen: `TEMIZ - OCR ciktisi git disinda` (`.gitignore` içindeki `tmp/` kuralı gereği).
Bu, spec §3.4.6 telif sınırının kanıtıdır.

---

### Task 0.2: PDF indeksi ↔ basılı sayfa numarası eşleme tablosu

Kitaptan yapılacak her `[s. NNN]` atfı **basılı** sayfa numarasına göre yazılacak.
OCR çıktısı ise PDF indeksini taşıyor. Eşlemeyi bir kez kur.

**Files:**
- Create: `tmp/nosyon-ocr/01-SAYFA-ESLEME.md`

- [ ] **Step 1: Basılı sayfa numarasının ilk göründüğü PDF indeksini bul**

Ön sayfalarda (kapak, künye, içindekiler) basılı numara ya yoktur ya romen rakamıdır.
Gövdenin başladığı yeri bul:

```bash
grep -n "pdf:0[2-4][0-9]" tmp/nosyon-ocr/parca-01_*.md tmp/nosyon-ocr/parca-02_*.md | head -30
```

Sonra o civardaki sayfaların metnini okuyup, metnin başında/sonunda görünen basılı
sayfa numarasını tespit et.

- [ ] **Step 2: Kaymayı hesapla ve eşleme dosyasını yaz**

Örnek: PDF indeks 27 → basılı sayfa 1 ise kayma `+26`'dır (basılı = pdf − 26).

`tmp/nosyon-ocr/01-SAYFA-ESLEME.md` dosyasını şu içerikle oluştur (değerleri Step 1'den doldur):

```markdown
# Sayfa Eşleme Tablosu

- PDF toplam sayfa: 306
- Gövdenin başladığı PDF indeksi: <N>
- O sayfadaki basılı numara: <M>
- **Formül: basılı = pdf − <N−M>**

## Doğrulama örnekleri
| PDF indeks | Beklenen basılı | OCR'da görülen | Uyum |
|---|---|---|---|
| <a> | <a−k> | | |
| <b> | <b−k> | | |
| <c> | <c−k> | | |

## Uyarı
Ön sayfalar (kapak, künye, içindekiler) bu formüle girmez; onlara atıf yapılırken
`[pdf s. NNN]` biçimi kullanılır.
```

- [ ] **Step 3: Formülü üç farklı sayfada doğrula**

Tablodaki üç örnek sayfanın OCR metnine bak, basılı numara formülle uyuşuyor mu kontrol et
ve tabloyu doldur. Uyuşmuyorsa (kitapta bölüm arası numara sıfırlaması olabilir)
her bölüm için ayrı kayma satırı ekle.

- [ ] **Step 4: Commit yok**

`tmp/` git dışıdır. Bu adımda commit yapılmaz; eşleme tablosu Faz 3'ün girdisidir.

---

# FAZ 1 — Doküman Toparlama + AGENTS.md

### Task 1.1: Referans kontrol scripti (TDD)

Faz 1'de onlarca dosya taşınacak. Kırık referans bırakmadığımızı **ölçebilmek** için
önce kapıyı kuruyoruz.

**Files:**
- Create: `scripts/referans_kontrol.py`
- Test: `scripts/tests/test_referans_kontrol.py`

- [ ] **Step 1: Başarısız testi yaz**

`scripts/tests/test_referans_kontrol.py`:

```python
"""referans_kontrol testleri — repo içi dosya referansları kırık mı.

Çalıştır: python -m pytest scripts/tests/test_referans_kontrol.py -q
"""
from pathlib import Path

import referans_kontrol as rk


def test_backtick_referansi_bulunur(tmp_path):
    (tmp_path / "var.md").write_text("içerik", encoding="utf-8")
    kaynak = tmp_path / "kaynak.md"
    kaynak.write_text("Şuna bak: `var.md` ve `yok.md`", encoding="utf-8")

    kirik = rk.kirik_referanslar(kaynak, tmp_path)

    assert "yok.md" in kirik
    assert "var.md" not in kirik


def test_markdown_link_referansi_bulunur(tmp_path):
    (tmp_path / "var.md").write_text("içerik", encoding="utf-8")
    kaynak = tmp_path / "kaynak.md"
    kaynak.write_text("[iyi](var.md) ve [kotu](yok.md)", encoding="utf-8")

    kirik = rk.kirik_referanslar(kaynak, tmp_path)

    assert "yok.md" in kirik
    assert "var.md" not in kirik


def test_url_ve_drive_yolu_yoksayilir(tmp_path):
    kaynak = tmp_path / "kaynak.md"
    kaynak.write_text(
        "https://ornek.com/a.md ve `G:\\\\Drive'im\\\\Hukuk Burosu\\\\x.md` ve `C:/gecici/y.md`",
        encoding="utf-8",
    )

    assert rk.kirik_referanslar(kaynak, tmp_path) == []


def test_glob_ve_placeholder_yoksayilir(tmp_path):
    kaynak = tmp_path / "kaynak.md"
    kaynak.write_text(
        "`ajanlar/*/SKILL.md` ve `playbook/{dava-turu}.md` ve `03-Sentez/dilekce-v1.md`",
        encoding="utf-8",
    )

    assert rk.kirik_referanslar(kaynak, tmp_path) == []


def test_tarama_kirik_olmayan_repoda_bos_doner(tmp_path):
    (tmp_path / "a.md").write_text("`b.md`", encoding="utf-8")
    (tmp_path / "b.md").write_text("son", encoding="utf-8")

    assert rk.tara([tmp_path / "a.md"], tmp_path) == {}
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu gör**

```bash
python -m pytest scripts/tests/test_referans_kontrol.py -q
```

Beklenen: `ModuleNotFoundError: No module named 'referans_kontrol'`

- [ ] **Step 3: Scripti yaz**

`scripts/referans_kontrol.py`:

```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""referans_kontrol.py — repo içi dosya referansları kırık mı.

Faz 1 kapısı: dosya taşımalarından sonra hiçbir dokümanda var olmayan bir repo
dosyasına atıf kalmamalı (spec kabul kriteri 1).

Kullanım:
  python scripts/referans_kontrol.py                # tüm takipli .md dosyaları
  python scripts/referans_kontrol.py AGENTS.md ...  # belirli dosyalar
exit 0 = temiz, 1 = kırık referans var.
"""
from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# `backtick/icindeki/yol.md`  ve  [metin](yol.md)
BACKTICK_RE = re.compile(r"`([^`\n]+?)`")
MDLINK_RE = re.compile(r"\]\(([^)\s]+)\)")

# Repo dosyası SAYILMAYANLAR
YOKSAY_ONEK = ("http://", "https://", "mailto:", "#", "G:", "C:", "D:", "/Users/", "~")
YOKSAY_ICEREN = ("*", "{", "}", "<", ">", "$", "|")

# Yalnız bu uzantılar repo dosyası olarak denetlenir (komut/terim gürültüsünü eler)
DENETLENEN_UZANTILAR = (".md", ".py", ".json", ".sh", ".txt", ".html", ".toml", ".yml", ".yaml")

# Dava çıktısı yolları repoda değil Drive'dadır — denetlenmez
DRIVE_KLASORLERI = ("00-", "01-Usul", "02-Arastirma", "03-Sentez", "04-Muvekkil", "05-Durusma", "06-Blog")


def _aday_mi(ham: str) -> bool:
    """Metin parçası, repo içi bir dosya yoluna benziyor mu."""
    yol = ham.strip()
    if not yol or yol.startswith(YOKSAY_ONEK):
        return False
    if any(k in yol for k in YOKSAY_ICEREN):
        return False
    if not yol.endswith(DENETLENEN_UZANTILAR):
        return False
    if yol.startswith(DRIVE_KLASORLERI):
        return False
    if " " in yol:  # "python scripts/x.py --flag" gibi komut satırları
        return False
    return True


def kirik_referanslar(dosya: Path, kok: Path) -> list[str]:
    """Tek dosyadaki, `kok` altında karşılığı olmayan repo referanslarını döndürür."""
    try:
        metin = dosya.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError):
        return []

    adaylar: list[str] = []
    for eslesme in BACKTICK_RE.finditer(metin):
        adaylar.append(eslesme.group(1))
    for eslesme in MDLINK_RE.finditer(metin):
        adaylar.append(eslesme.group(1))

    kirik: list[str] = []
    for ham in adaylar:
        if not _aday_mi(ham):
            continue
        yol = ham.strip().lstrip("./")
        if (kok / yol).exists():
            continue
        # dosyaya göreceli de olabilir
        if (dosya.parent / yol).exists():
            continue
        if yol not in kirik:
            kirik.append(yol)
    return kirik


def tara(dosyalar: list[Path], kok: Path) -> dict[str, list[str]]:
    """Dosya listesini tarar; {dosya: [kırık referanslar]} döndürür (temizler yok)."""
    sonuc: dict[str, list[str]] = {}
    for d in dosyalar:
        kirik = kirik_referanslar(d, kok)
        if kirik:
            anahtar = d.relative_to(kok).as_posix() if kok in d.parents or d.parent == kok else str(d)
            sonuc[anahtar] = kirik
    return sonuc


def takipli_markdownlar() -> list[Path]:
    """git ls-files ile takipli .md dosyaları (arsiv/ ve isbu-ofis/ hariç)."""
    cikti = subprocess.run(
        ["git", "ls-files", "*.md"], cwd=ROOT, capture_output=True, text=True, check=True
    ).stdout.splitlines()
    return [
        ROOT / p
        for p in cikti
        if not p.startswith("arsiv/") and not p.startswith("isbu-ofis/")
    ]


def main(argv: list[str]) -> int:
    dosyalar = [ROOT / a for a in argv] if argv else takipli_markdownlar()
    sonuc = tara(dosyalar, ROOT)
    for dosya, kirik in sorted(sonuc.items()):
        for ref in kirik:
            print(f"[KIRIK] {dosya} -> {ref}")
    print()
    if sonuc:
        toplam = sum(len(v) for v in sonuc.values())
        print(f"REFERANS KONTROL: {toplam} kırık referans / {len(sonuc)} dosya")
        return 1
    print(f"REFERANS KONTROL: TEMİZ ({len(dosyalar)} dosya tarandı)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
```

- [ ] **Step 4: Testleri çalıştır, geçtiğini gör**

```bash
python -m pytest scripts/tests/test_referans_kontrol.py -q
```

Beklenen: `5 passed`

- [ ] **Step 5: Taşıma öncesi baseline al**

```bash
python scripts/referans_kontrol.py > tmp/referans-baseline.txt 2>&1; echo "cikis: $?"
tail -3 tmp/referans-baseline.txt
```

Bugün zaten kırık referans olabilir. Bu dosya **karşılaştırma tabanıdır**: Faz 1 sonunda
kırık sayısı bu sayıdan **büyük olmamalıdır**.

- [ ] **Step 6: Commit**

```bash
git add scripts/referans_kontrol.py scripts/tests/test_referans_kontrol.py
git commit -m "feat(scripts): referans_kontrol.py - repo ici kirik dosya referansi kapisi

Faz 1 dosya tasimalarinda kirik referans birakilmadigini olcer.
Backtick ve markdown-link referanslarini tarar; URL, Drive yolu, glob ve
placeholder'lari eler.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 1.2: AGENTS.md — tek anayasayı üret

**Files:**
- Create: `AGENTS.md`
- Okunacak (kaynak): `CLAUDE.md`, `ASAMALAR.md`, `ANTIGRAVITY.md`

- [ ] **Step 1: Üç kaynağı oku ve çakışma haritası çıkar**

```bash
grep -n "^#\{1,3\} " CLAUDE.md > tmp/basliklar-claude.txt
grep -n "^#\{1,3\} " ASAMALAR.md > tmp/basliklar-asamalar.txt
grep -n "^#\{1,3\} " ANTIGRAVITY.md > tmp/basliklar-antigravity.txt
wc -l tmp/basliklar-*.txt
```

Üç dosyanın başlıklarını yan yana koyup hangi bölümün hangisinde tekrar ettiğini belirle.
Kural: **aynı bilgi AGENTS.md'de bir kez yazılır**; ASAMALAR ve ANTIGRAVITY'nin özgün
katkısı (ASAMA tablosu detayı, self-review protokolü) tek yere taşınır.

- [ ] **Step 2: AGENTS.md'yi CLAUDE.md'den türet**

```bash
cp CLAUDE.md AGENTS.md
```

Sonra `AGENTS.md` üzerinde şu düzenlemeleri yap:

1. Başlığı değiştir: `# Hukuk Basasistani - CLAUDE.md` → `# Hukuk Başasistanı — AGENTS.md (Anayasa)`
2. En üstteki "GUNCEL DURUM" bloğunu şununla değiştir:

```markdown
> **ANAYASA — TEK DOĞRULUK KAYNAĞI.** Bu dosya sistemin tek anayasasıdır.
> Hangi LLM ile bağlanılırsa bağlanılsın önce bu dosya okunur.
> `CLAUDE.md`, `GEMINI.md` ve `.cursor/rules/hukuk.mdc` yalnızca buraya yönlendiren
> stub'lardır; kural içermezler.
>
> **Motor:** Sistem tek motorla çalışır — oturumu hangi LLM ile açtıysanız o.
> Roller (`ORKESTRATOR`, `ARASTIRMACI`, `MUHAKEME`, `DENETCI`) ve aktif motor kaydı:
> `config/motor-haritasi.json`.
> Spec: `docs/superpowers/specs/2026-09-02-tek-motor-agnostik-toparlama-design.md`
```

3. "Antigravity Hibrit Mimarisi" bölümünün tamamını **sil** (Faz 5'te yerine tek motor
   akışı + DENETCI kapısı yazılacak; şimdilik yerine şu tek satırı koy):

```markdown
## Motor Mimarisi

> Bu bölüm Faz 5'te (DENETCI ajanı) doldurulacaktır. Geçiş dönemi: sistem tek motorla
> çalışır, her hukuki çıktı sonrası bağımsız denetim yapılır.
```

4. ASAMALAR.md'deki ASAMA tablosunun detay satırlarını "7 ASAMA Workflow" bölümüne
   eksik kalan kısımlar için ekle (aynı bilgiyi iki kez yazma).

- [ ] **Step 3: AGENTS.md'nin doktrin taşıdığını doğrula**

`AGENTS.md` doktrin yüzeyidir; içindeki devir/denetim fenced bloğu tam doktrin taşımalı.

```bash
python scripts/doktrin_lint.py AGENTS.md
```

Beklenen: bu adımda `[FAIL] AGENTS.md: devir bloğu (fenced) bulunamadı` **olabilir** —
lint yüzey listesi henüz güncellenmedi. Task 1.4'te düzeltilecek.

- [ ] **Step 4: Commit**

```bash
git add AGENTS.md
git commit -m "docs(anayasa): AGENTS.md tek anayasa olarak olusturuldu

CLAUDE.md'den turetildi; Antigravity hibrit bolumu cikarildi (Faz 5'te tek motor
akisi + DENETCI kapisi yazilacak). ASAMALAR.md ve ANTIGRAVITY.md'nin ozgun
katkilari tek yere tasindi.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 1.3: Sahipli taşımalar (aktif referans dosyaları)

**Files:**
- Move: `FIVEAGENTS.md` → `ajanlar/perspektif/PROTOKOL.md`
- Move: `ARASTIRMA.md` → `ajanlar/arastirmaci/danisma-hatti.md`
- Move: `TEHMIS.md` → `ajanlar/blog-yazari/THEMIS.md`
- Move: `doctoudf.md` → `docs/udf-format.md`
- Move: `MASKELEME-KILAVUZU.md` → `docs/maskeleme-kilavuzu.md`

- [ ] **Step 1: Taşımadan önce kim kime atıf yapıyor tespit et**

```bash
grep -rn "FIVEAGENTS\|ARASTIRMA\.md\|TEHMIS\|doctoudf\|MASKELEME-KILAVUZU" \
  --include="*.md" --include="*.py" --include="*.json" . \
  | grep -v "^./arsiv/" | grep -v "^./isbu-ofis/" | grep -v "^./docs/superpowers/"
```

Çıkan listeyi not al — Step 3'te bu dosyaların hepsi güncellenecek.

- [ ] **Step 2: git mv ile taşı (geçmiş korunur)**

```bash
mkdir -p ajanlar/perspektif
git mv FIVEAGENTS.md ajanlar/perspektif/PROTOKOL.md
git mv ARASTIRMA.md ajanlar/arastirmaci/danisma-hatti.md
git mv TEHMIS.md ajanlar/blog-yazari/THEMIS.md
git mv doctoudf.md docs/udf-format.md
git mv MASKELEME-KILAVUZU.md docs/maskeleme-kilavuzu.md
git status --short
```

- [ ] **Step 3: Step 1'de çıkan her atfı güncelle**

Her dosyada eski yolu yenisiyle değiştir. Örnek (AGENTS.md içinde):

```
@FIVEAGENTS.md              → @ajanlar/perspektif/PROTOKOL.md
`ARASTIRMA.md`              → `ajanlar/arastirmaci/danisma-hatti.md`
@TEHMIS.md                  → @ajanlar/blog-yazari/THEMIS.md
`MASKELEME-KILAVUZU.md`     → `docs/maskeleme-kilavuzu.md`
```

`.claude/commands/arastir-danisma.md` içindeki `@ARASTIRMA.md` atfı özellikle kontrol
edilmeli — bu komut o dosyayı okuyor.

- [ ] **Step 4: Referans kontrolü çalıştır**

```bash
python scripts/referans_kontrol.py | tail -5
```

Beklenen: kırık referans sayısı `tmp/referans-baseline.txt`'teki sayıdan **büyük değil**.
Büyükse Step 3'te atlanan atıf vardır; çıktıdaki `[KIRIK]` satırlarını takip et.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor(dokuman): aktif referans dosyalari sahibine tasindi

FIVEAGENTS -> ajanlar/perspektif/PROTOKOL.md
ARASTIRMA -> ajanlar/arastirmaci/danisma-hatti.md
TEHMIS -> ajanlar/blog-yazari/THEMIS.md
doctoudf -> docs/udf-format.md
MASKELEME-KILAVUZU -> docs/maskeleme-kilavuzu.md
Tum atiflar ayni commit'te guncellendi; referans_kontrol regresyon gostermiyor.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 1.4: Arşive taşıma + doktrin_lint yüzey listesi

**Bu iki iş aynı commit'te yapılmalıdır** (spec §3.1 kritik yan etki): `ANTIGRAVITY.md`
ve `CLAUDE.md` bugün doktrin yüzeyidir; taşınır/stub'a inerse lint FAIL verir.

**Files:**
- Move: `SON.md`, `ANTIGRAVITY.md`, `ASAMALAR.md` → `arsiv/eski-notlar/`
- Move (git dışı, plain `mv`): `MANUS1*.md`, `MANUS2*.md`, `NEXUS.md`, `BRAINSTORMING.md`
- Modify: `scripts/doktrin_lint.py:44-46` (FENCE_FILES listesi)
- Modify: `arsiv/README.md`

- [ ] **Step 1: Takipli olanları git mv ile arşive taşı**

```bash
git mv SON.md arsiv/eski-notlar/SON.md
git mv ANTIGRAVITY.md arsiv/eski-notlar/ANTIGRAVITY.md
```

`ASAMALAR.md` takipsizdir (git status'ta `??`), düz taşınır:

```bash
mv ASAMALAR.md arsiv/eski-notlar/ASAMALAR.md
```

- [ ] **Step 2: gitignore'lu dosyaları düz taşı**

`MANUS1*`, `MANUS2*`, `NEXUS.md`, `BRAINSTORMING.md` `.gitignore` içindedir; `git mv` çalışmaz:

```bash
mv MANUS1*.md MANUS2*.md NEXUS.md BRAINSTORMING.md arsiv/eski-notlar/ 2>/dev/null
ls arsiv/eski-notlar/ | head -20
```

- [ ] **Step 3: Arşive giden her dosyaya arşiv başlığı ekle**

Her taşınan dosyanın ilk satırının üstüne şunu ekle:

```markdown
> ARŞİV — güncel kaynak: `AGENTS.md` (2026-09-02). Bu dosya tarihçe olarak korunur.
```

```bash
for f in arsiv/eski-notlar/SON.md arsiv/eski-notlar/ANTIGRAVITY.md arsiv/eski-notlar/ASAMALAR.md; do
  printf '> ARŞİV — güncel kaynak: `AGENTS.md` (2026-09-02). Bu dosya tarihçe olarak korunur.\n\n' | cat - "$f" > "$f.tmp" && mv "$f.tmp" "$f"
done
head -2 arsiv/eski-notlar/SON.md
```

- [ ] **Step 4: doktrin_lint yüzey listesini güncelle**

`scripts/doktrin_lint.py` içinde şu satırı bul:

```python
FENCE_FILES = ["ANTIGRAVITY.md", "CLAUDE.md"]
```

Şununla değiştir:

```python
# Devir/denetim bloğu (fence içi) denetlenecek dosyalar.
# 2026-09-02: CLAUDE.md stub'a indi, ANTIGRAVITY.md arşive taşındı; anayasa AGENTS.md.
FENCE_FILES = ["AGENTS.md"]
```

- [ ] **Step 5: arsiv/README.md'ye kaydı düş**

`arsiv/README.md` sonuna ekle:

```markdown
## 2026-09-02 — Doküman toparlama (tek anayasa geçişi)

Spec: `docs/superpowers/specs/2026-09-02-tek-motor-agnostik-toparlama-design.md`

| Dosya | Neden arşivde |
|---|---|
| `SON.md` | İçeriği `AGENTS.md`'de tekilleşti |
| `ANTIGRAVITY.md` | İki motorlu devir mimarisi kalktı (tek motor + DENETCI) |
| `ASAMALAR.md` | ASAMA akışı `AGENTS.md`'de tek yerde |
| `MANUS1*.md`, `MANUS2*.md` | 2026-04/05 tarihli dış analiz raporları, geçersiz |
| `NEXUS.md`, `BRAINSTORMING.md` | Yerel çalışma notları (zaten `.gitignore`'daydı) |

Geri alma: `git log --follow arsiv/eski-notlar/<dosya>` ile geçmişe ulaşılır.
```

- [ ] **Step 6: Doktrin lint'i çalıştır**

```bash
python scripts/doktrin_lint.py 2>&1 | tail -5
```

Beklenen: `DOKTRIN LINT: PASS`. FAIL veriyorsa `AGENTS.md` içindeki fenced denetim
bloğu eksiktir — Task 1.2 Step 2'de silinen Antigravity bölümünün yerine, doktrin
taşıyan bir fenced blok eklenmelidir. `scripts/doktrin_contract.py` içindeki
`STANDARD_HEADER` sabitini bir ``` bloğu içine, `BATCH` kelimesiyle birlikte koy.

- [ ] **Step 7: Testleri ve referans kontrolünü çalıştır**

```bash
python -m pytest scripts/tests -q
python scripts/referans_kontrol.py | tail -3
```

Beklenen: tüm testler geçer; kırık referans sayısı baseline'ı aşmaz.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor(dokuman): eskiyen anlatilar arsive, doktrin_lint yuzeyi AGENTS.md

SON/ANTIGRAVITY/ASAMALAR/MANUS1/MANUS2/NEXUS/BRAINSTORMING -> arsiv/eski-notlar/
Her arsiv dosyasina 'guncel kaynak: AGENTS.md' basligi eklendi.
doktrin_lint FENCE_FILES: [ANTIGRAVITY.md, CLAUDE.md] -> [AGENTS.md]
(bolunmez adim: tasima ve lint yuzeyi ayni commit'te - spec 3.1)

Scope-risk: high - doktrin yuzeyi degisti, lint PASS ile dogrulandi

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 1.5: README.md + .gitignore

**Files:**
- Create: `README.md`
- Modify: `.gitignore`

- [ ] **Step 1: README.md yaz**

```markdown
# Hukuk Başasistanı

Avukat bürosu için uçtan uca hukuki üretim sistemi: araştırma, usul analizi,
stratejik analiz, dilekçe taslağı, savunma simülasyonu ve blog.

**Sistem tek motorla çalışır** — oturumu hangi LLM ile açtıysanız o. Anayasa
`AGENTS.md`'dir; `CLAUDE.md`, `GEMINI.md` ve `.cursor/rules/hukuk.mdc` yalnızca
oraya yönlendiren stub'lardır.

## Nereden başlanır

| Ne arıyorsanız | Dosya |
|---|---|
| Sistemin tüm kuralları, 7 ASAMA akışı, doktrin | `AGENTS.md` |
| Büronun kendi kuralları ve tercihleri | `legal.local.md` |
| Dilekçe biçim ve üslup standardı | `dilekce-yazim-kurallari.md` |
| İlk dava incelemesi metodolojisi | `ajanlar/director/olay-cozum-protokolu.md` |
| Dava türü bazlı kişisel kontrol listeleri | `playbook/` |
| Model kaçırdı, avukat düzeltti kayıtları | `dersler/` |
| Ajan protokolleri (araştırmacı, usul, dilekçe, blog...) | `ajanlar/*/SKILL.md` |
| 5-ajan stratejik analiz protokolü | `ajanlar/perspektif/PROTOKOL.md` |
| Motor rolleri ve aktif motor kaydı | `config/motor-haritasi.json` |
| Doktrin tam metni | `prompts/_doktrin-preamble.md` |
| Tasarım ve uygulama planları | `docs/superpowers/` |
| Emekliye ayrılmış modüller | `arsiv/` (bkz. `arsiv/README.md`) |

## Denetim komutları

```bash
python scripts/doktrin_lint.py        # prompt yüzeyleri doktrin taşıyor mu
python scripts/referans_kontrol.py    # kırık dosya referansı var mı
python scripts/vendor_lint.py         # kanonik yüzeyde sağlayıcı adı sızıntısı
python scripts/paths.py check         # Drive yolları çözümleniyor mu
python -m pytest scripts/tests -q     # tüm testler
```

## Veri nerede

Kalıcı dava ve araştırma çıktısı repoda değil Google Drive'dadır
(`Hukuk Bürosu/Aktif Davalar/...`). Yol çözümlemesi platforma göre
`config/paths.json` + `scripts/paths.py` üzerinden yapılır.

Her çıktı **TASLAK**'tır; son kontrol avukattadır.
```

- [ ] **Step 2: .gitignore'a müvekkil evrakı kuralı ekle**

`.gitignore` sonuna ekle:

```
# Dava inceleme çalışma klasörleri — KVKK gereği müvekkil evrakı içerir
.case_review_*/
```

- [ ] **Step 3: Doğrula**

```bash
git status --short | grep case_review || echo "TEMIZ - case_review artik git disinda"
ls
```

Beklenen: `TEMIZ` mesajı; kök dizin listesinde `AGENTS.md`, `README.md`,
`legal.local.md`, `dilekce-yazim-kurallari.md`, `EKLENECEKKITAPLAR.md`,
`requirements.txt` ve stub'lar dışında büyük anlatı dosyası kalmamış olmalı
(`CLAUDE.md` Faz 2'de stub'a inecek).

- [ ] **Step 4: Commit**

```bash
git add README.md .gitignore
git commit -m "docs(readme): giris haritasi + case_review gitignore

README.md: hangi dosya ne ise yarar tablosu + denetim komutlari.
.case_review_*/ gitignore'a alindi (KVKK - muvekkil evraki icerir).

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

# FAZ 2 — Rol Dili + Motor Haritası

### Task 2.1: Aktif motor kaydı scripti (TDD)

Çıktı frontmatter'ı hangi motorun ürettiğini damgalamalı. Sistem bunu **tahmin etmez**,
avukat bildirir.

**Files:**
- Create: `scripts/motor.py`
- Test: `scripts/tests/test_motor.py`
- Modify: `config/model-routing.json` → `config/motor-haritasi.json` (Task 2.2'de)

- [ ] **Step 1: Başarısız testi yaz**

`scripts/tests/test_motor.py`:

```python
"""motor.py testleri — aktif motor kaydi/okuma.

Çalıştır: python -m pytest scripts/tests/test_motor.py -q
"""
import json

import motor


def _harita_yaz(tmp_path, aktif=None):
    veri = {
        "roller": {
            "ORKESTRATOR": {"aciklama": "orkestrasyon"},
            "ARASTIRMACI": {"aciklama": "mcp"},
            "MUHAKEME": {"aciklama": "hukuki uretim"},
            "DENETCI": {"aciklama": "bagimsiz denetim"},
        }
    }
    if aktif is not None:
        veri["aktif_motor"] = aktif
    yol = tmp_path / "motor-haritasi.json"
    yol.write_text(json.dumps(veri, ensure_ascii=False), encoding="utf-8")
    return yol


def test_bildirilmemis_motor_bildirilmedi_doner(tmp_path):
    yol = _harita_yaz(tmp_path)
    assert motor.aktif_motor(yol) == "bildirilmedi"


def test_ayarlanan_motor_okunur(tmp_path):
    yol = _harita_yaz(tmp_path)
    motor.motor_ayarla("ornek-model-1", yol)
    assert motor.aktif_motor(yol) == "ornek-model-1"


def test_ayarlama_rolleri_bozmaz(tmp_path):
    yol = _harita_yaz(tmp_path)
    motor.motor_ayarla("ornek-model-2", yol)
    veri = json.loads(yol.read_text(encoding="utf-8"))
    assert set(veri["roller"]) == {"ORKESTRATOR", "ARASTIRMACI", "MUHAKEME", "DENETCI"}


def test_frontmatter_damgasi_uretilir(tmp_path):
    yol = _harita_yaz(tmp_path, aktif="ornek-model-3")
    damga = motor.frontmatter_damgasi("usul_raporu", yol)
    assert "engine: ornek-model-3" in damga
    assert "task_type: usul_raporu" in damga
    assert "status: TASLAK" in damga


def test_bos_dosya_cokmez(tmp_path):
    yol = tmp_path / "yok.json"
    assert motor.aktif_motor(yol) == "bildirilmedi"
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu gör**

```bash
python -m pytest scripts/tests/test_motor.py -q
```

Beklenen: `ModuleNotFoundError: No module named 'motor'`

- [ ] **Step 3: Scripti yaz**

`scripts/motor.py`:

```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""motor.py — aktif motor kaydı ve çıktı frontmatter damgası.

Sistem tek motorla çalışır: oturumu hangi LLM ile açtıysanız o. Sistem bunu
TAHMİN ETMEZ — avukat `motor: <ad>` komutuyla bildirir, burada saklanır.
Bildirilmemişse çıktı frontmatter'ına `engine: bildirilmedi` yazılır.

Kullanım:
  python scripts/motor.py goster
  python scripts/motor.py ayarla <motor-adi>
  python scripts/motor.py damga <task_type>
"""
from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VARSAYILAN_HARITA = ROOT / "config" / "motor-haritasi.json"
BILDIRILMEDI = "bildirilmedi"


def _yukle(yol: Path) -> dict:
    try:
        return json.loads(yol.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}


def aktif_motor(yol: Path | None = None) -> str:
    """Kayıtlı aktif motor adı; bildirilmemişse 'bildirilmedi'."""
    veri = _yukle(yol or VARSAYILAN_HARITA)
    deger = str(veri.get("aktif_motor", "") or "").strip()
    return deger or BILDIRILMEDI


def motor_ayarla(ad: str, yol: Path | None = None) -> str:
    """Aktif motoru kaydeder; diğer alanlara dokunmaz."""
    hedef = yol or VARSAYILAN_HARITA
    veri = _yukle(hedef)
    veri["aktif_motor"] = ad.strip()
    veri["aktif_motor_guncelleme"] = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    hedef.write_text(json.dumps(veri, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return veri["aktif_motor"]


def frontmatter_damgasi(task_type: str, yol: Path | None = None) -> str:
    """Her hukuki çıktının başına konacak YAML frontmatter."""
    return (
        "---\n"
        f"engine: {aktif_motor(yol)}\n"
        f"task_type: {task_type}\n"
        f"timestamp_utc: {datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')}\n"
        "status: TASLAK\n"
        "---\n"
    )


def main(argv: list[str]) -> int:
    if not argv or argv[0] == "goster":
        print(aktif_motor())
        return 0
    if argv[0] == "ayarla":
        if len(argv) < 2:
            print("kullanim: python scripts/motor.py ayarla <motor-adi>", file=sys.stderr)
            return 2
        print(motor_ayarla(argv[1]))
        return 0
    if argv[0] == "damga":
        if len(argv) < 2:
            print("kullanim: python scripts/motor.py damga <task_type>", file=sys.stderr)
            return 2
        print(frontmatter_damgasi(argv[1]), end="")
        return 0
    print(f"bilinmeyen komut: {argv[0]}", file=sys.stderr)
    return 2


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
```

- [ ] **Step 4: Testleri çalıştır, geçtiğini gör**

```bash
python -m pytest scripts/tests/test_motor.py -q
```

Beklenen: `5 passed`

- [ ] **Step 5: Commit**

```bash
git add scripts/motor.py scripts/tests/test_motor.py
git commit -m "feat(scripts): motor.py - aktif motor kaydi ve frontmatter damgasi

Sistem tek motorla calisir; hangi motor oldugunu TAHMIN ETMEZ, avukat bildirir.
Bildirilmemisse cikti frontmatter'ina 'engine: bildirilmedi' yazilir.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2.2: config/motor-haritasi.json — rol yapısı

**Files:**
- Move: `config/model-routing.json` → `config/motor-haritasi.json`
- Modify: taşınan dosyanın içeriği

- [ ] **Step 1: Dosyayı kim okuyor tespit et**

```bash
grep -rn "model-routing" --include="*.py" --include="*.md" --include="*.json" . \
  | grep -v "^./arsiv/" | grep -v "^./docs/superpowers/"
```

Çıkan her dosya Step 4'te güncellenecek.

- [ ] **Step 2: Taşı**

```bash
git mv config/model-routing.json config/motor-haritasi.json
```

- [ ] **Step 3: İçeriği rol yapısına çevir**

`config/motor-haritasi.json` dosyasının **başındaki** `_comment`, `mode`,
`handoff_protocol`, `handoff_template_dir`, `_handoff_aciklama` alanlarını sil ve
yerine şunu koy (mevcut `_history` bloğu **korunur**, altına yeni satır eklenir;
`tasks` bloğu **korunur** ama her task'ın `engine`/`model`/`model_fallback` alanları
`rol` ile değiştirilir):

```json
{
  "_comment": "Motor haritasi. Sistem TEK MOTORLA calisir: oturumu hangi LLM ile actiysaniz o. Bu dosya model SECMEZ; rol tanimlar ve hangi motorla calisildigini KAYDEDER (cikti frontmatter damgasi icin). Aktif motor: scripts/motor.py ayarla <ad>.",
  "_doctrine_source": "Bu dosya TEK dogruluk kaynagidir. Calistiricilar rol, sira ve limitleri buradan okur; dokumanlar yalniz rolleri ve onayli akis sirasini aciklar.",
  "_spec": "docs/superpowers/specs/2026-09-02-tek-motor-agnostik-toparlama-design.md",
  "aktif_motor": "",
  "aktif_motor_guncelleme": "",
  "roller": {
    "ORKESTRATOR": {
      "aciklama": "Komut siniflandirma, ASAMA gecisleri, kalite kapilari, Drive/Gmail/Takvim islemleri, DOCX/UDF uretimi, dosya yazimi"
    },
    "ARASTIRMACI": {
      "aciklama": "MCP cagrilari: Yargi-MCP-Pro (2B), Mevzuat (2C), NotebookLM (2D), MemPalace. Iteratif derin protokol."
    },
    "MUHAKEME": {
      "aciklama": "Usul raporu, 5-ajan stratejik analiz, dilekce, savunma simulasyonu, revizyon, blog. Hukuki muhakeme uretimi."
    },
    "DENETCI": {
      "aciklama": "Sifir baglamli bagimsiz cikti denetimi. Uretim baglamini GORMEZ; kunyeleri MCP'den yeniden ceker, deterministik scriptleri calistirir, KIRMIZI/SARI/YESIL karar verir."
    }
  }
}
```

`tasks` bloğundaki her girdide `"engine": "..."` ve `"model": "..."` satırlarını
`"rol": "ARASTIRMACI"` (veya ilgili rol) ile değiştir. Örnek dönüşüm:

```json
"yargi_mcp": {
  "rol": "ARASTIRMACI",
  "mcp_server": "yargi-mcp-pro",
  "tool_prefix": "mcp__yargi-mcp-pro__",
  "tools": ["ictihat_ara", "ictihat_getir", "semantik_ictihat_ara", "aym_ictihat_ara", "kurum_karari_ara", "kurum_karari_getir"],
  "skill": ".claude/skills/yargi-legal-research-guide/SKILL.md",
  "protokol": "iteratif_derin",
  "modes": { "derin": { "min_queries": 15, "min_full_text": 5 }, "hafif": { "min_queries": 6, "min_full_text": 3 } },
  "aciklama": "2B derin arastirma. Min sorgu/tam-metin kurallari 'modes' altinda. MCP fail -> yargi CLI fallback (rapora mcp_fallback_used: true)."
}
```

`_history` bloğuna ekle:

```json
"2026-09-02": "TEK MOTOR + ROL DILI (avukat karari): model adlari kaldirildi, dort rol tanimlandi (ORKESTRATOR/ARASTIRMACI/MUHAKEME/DENETCI). Iki motorlu elle devir mimarisi kalkti; bagimsizlik sifir-baglamli DENETCI alt-ajanindan geliyor. Dosya adi model-routing.json -> motor-haritasi.json."
```

- [ ] **Step 4: Step 1'de çıkan her atfı güncelle**

`config/model-routing.json` → `config/motor-haritasi.json`. Özellikle `AGENTS.md`
içindeki "Model Routing" bölümü ve `ajanlar/director/SKILL.md`.

- [ ] **Step 5: JSON geçerliliğini ve referansları doğrula**

```bash
python -c "import json;d=json.load(open('config/motor-haritasi.json',encoding='utf-8'));print('roller:',list(d['roller']));print('task sayisi:',len(d.get('tasks',{})))"
python scripts/motor.py goster
python scripts/referans_kontrol.py | tail -3
```

Beklenen: dört rol listelenir; `motor.py goster` → `bildirilmedi`; referans regresyonu yok.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor(config): model-routing.json -> motor-haritasi.json, rol dili

Model adlari (claude-fable-5, gemini-3.1-pro, antigravity) kaldirildi.
Dort rol: ORKESTRATOR / ARASTIRMACI / MUHAKEME / DENETCI.
aktif_motor alani scripts/motor.py ile doldurulur; sistem tahmin etmez.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2.3: Sağlayıcı adı sızıntı kapısı (TDD)

**Files:**
- Create: `scripts/vendor_lint.py`
- Test: `scripts/tests/test_vendor_lint.py`

- [ ] **Step 1: Başarısız testi yaz**

`scripts/tests/test_vendor_lint.py`:

```python
"""vendor_lint testleri — kanonik yuzeylerde saglayici adi sizintisi.

Çalıştır: python -m pytest scripts/tests/test_vendor_lint.py -q
"""
import vendor_lint as vl


def test_saglayici_adi_yakalanir(tmp_path):
    d = tmp_path / "a.md"
    d.write_text("Bu asamayi Claude Fable 5 yurutur.", encoding="utf-8")
    assert vl.sizintilar(d) == [(1, "Claude")]


def test_birden_fazla_saglayici(tmp_path):
    d = tmp_path / "a.md"
    d.write_text("satir bir\nGemini ve Antigravity kullanilir\n", encoding="utf-8")
    bulgular = vl.sizintilar(d)
    assert (2, "Gemini") in bulgular
    assert (2, "Antigravity") in bulgular


def test_vendor_ok_isaretli_satir_muaf(tmp_path):
    d = tmp_path / "a.md"
    d.write_text(
        "2026-07-19'da Codex kaldirildi. <!-- vendor-ok: tarihce kaydi -->",
        encoding="utf-8",
    )
    assert vl.sizintilar(d) == []


def test_temiz_dosya_bos_doner(tmp_path):
    d = tmp_path / "a.md"
    d.write_text("ORKESTRATOR rolu ASAMA gecislerini yurutur.", encoding="utf-8")
    assert vl.sizintilar(d) == []


def test_kelime_sinirina_saygi(tmp_path):
    d = tmp_path / "a.md"
    # "geminiyet" gibi bir kelime yanlis eslesmemeli
    d.write_text("Bu bir geminiyet ornegi degildir.", encoding="utf-8")
    assert vl.sizintilar(d) == []
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu gör**

```bash
python -m pytest scripts/tests/test_vendor_lint.py -q
```

Beklenen: `ModuleNotFoundError: No module named 'vendor_lint'`

- [ ] **Step 3: Scripti yaz**

`scripts/vendor_lint.py`:

```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""vendor_lint.py — kanonik yuzeylerde saglayici adi sizintisi kapisi.

Sistem motor-bagimsizdir: anayasa, ajan protokolleri ve prompt yuzeyleri belirli
bir saglayicinin adina degil ROLE dayanir (spec kabul kriteri 2).

Tarihce kaydi veya arac adaptoru baglaminda saglayici adi gecmesi mesrudur;
o satir `<!-- vendor-ok: <gerekce> -->` ile isaretlenir. Isaretsiz her gecis FAIL.

Kullanim:
  python scripts/vendor_lint.py              # kanonik yuzeyleri tara
  python scripts/vendor_lint.py AGENTS.md    # belirli dosyalar
exit 0 = temiz, 1 = sizinti var.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

SAGLAYICILAR = ["Claude", "Gemini", "Antigravity", "Codex", "GPT", "OpenAI", "Anthropic"]
MUAFIYET = "vendor-ok:"

# Kanonik yuzeyler: motor-notr olmasi ZORUNLU dosyalar
HEDEF_GLOBLAR = [
    "AGENTS.md",
    "README.md",
    "legal.local.md",
    "dilekce-yazim-kurallari.md",
    "ajanlar/**/*.md",
    "prompts/**/*.md",
    "playbook/*.md",
]

# Arac adaptoru dizinleri: dogasi geregi saglayici adini tasir, kapsam disi
KAPSAM_DISI = (".claude/", ".gemini/", ".codex/", ".cursor/", "arsiv/", "docs/superpowers/", "isbu-ofis/", "dersler/")


def sizintilar(dosya: Path) -> list[tuple[int, str]]:
    """(satir_no, saglayici) ciftleri; muaf satirlar haric."""
    try:
        satirlar = dosya.read_text(encoding="utf-8").splitlines()
    except (OSError, UnicodeDecodeError):
        return []
    bulgular: list[tuple[int, str]] = []
    for no, satir in enumerate(satirlar, start=1):
        if MUAFIYET in satir:
            continue
        for ad in SAGLAYICILAR:
            if re.search(rf"\b{re.escape(ad)}\b", satir):
                bulgular.append((no, ad))
    return bulgular


def hedefler() -> list[Path]:
    secili: list[Path] = []
    for g in HEDEF_GLOBLAR:
        for p in sorted(ROOT.glob(g)):
            rel = p.relative_to(ROOT).as_posix()
            if p.is_file() and not rel.startswith(KAPSAM_DISI):
                secili.append(p)
    return secili


def main(argv: list[str]) -> int:
    dosyalar = [ROOT / a for a in argv] if argv else hedefler()
    toplam = 0
    for d in sorted(set(dosyalar)):
        for no, ad in sizintilar(d):
            rel = d.relative_to(ROOT).as_posix() if ROOT in d.parents else d.name
            print(f"[SIZINTI] {rel}:{no} -> {ad}")
            toplam += 1
    print()
    if toplam:
        print(f"VENDOR LINT: FAIL ({toplam} isaretsiz saglayici adi)")
        print("Duzeltme: rol adiyla degistir, ya da tarihce ise satir sonuna")
        print("          <!-- vendor-ok: <gerekce> --> ekle.")
        return 1
    print(f"VENDOR LINT: TEMIZ ({len(dosyalar)} dosya tarandi)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
```

- [ ] **Step 4: Testleri çalıştır, geçtiğini gör**

```bash
python -m pytest scripts/tests/test_vendor_lint.py -q
```

Beklenen: `5 passed`

- [ ] **Step 5: Gerçek repoda çalıştır, sızıntı listesini al**

```bash
python scripts/vendor_lint.py > tmp/vendor-sizinti.txt 2>&1; echo "cikis: $?"
tail -3 tmp/vendor-sizinti.txt
wc -l tmp/vendor-sizinti.txt
```

Beklenen: FAIL, onlarca satır. Bu liste Task 2.4'ün iş emridir.

- [ ] **Step 6: Commit**

```bash
git add scripts/vendor_lint.py scripts/tests/test_vendor_lint.py
git commit -m "feat(scripts): vendor_lint.py - saglayici adi sizinti kapisi

Kanonik yuzeyler (AGENTS.md, ajanlar/, prompts/, playbook/) motor-notr olmali.
Tarihce/adaptor baglami <!-- vendor-ok: gerekce --> ile muaf tutulur.
Arac adaptoru dizinleri (.claude/, .cursor/) kapsam disi.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2.4: Sağlayıcı adlarını rol adlarıyla değiştir

**Files:**
- Modify: `tmp/vendor-sizinti.txt` içindeki her dosya

- [ ] **Step 1: Sızıntı listesini dosya bazında grupla**

```bash
cut -d: -f1 tmp/vendor-sizinti.txt | grep SIZINTI -A0 | sed 's/\[SIZINTI\] //' | sort | uniq -c | sort -rn
```

- [ ] **Step 2: Değişim sözlüğünü uygula**

Her dosyada şu dönüşümleri yap. **Otomatik sed kullanma** — bağlam önemli, her satır
okunarak değiştirilir:

| Eski | Yeni |
|---|---|
| `Claude Fable 5` / `Claude Opus 4.8` / `terminal Claude` | `ORKESTRATOR` |
| `Antigravity` / `Gemini 3.1 Pro` / `sağ panel` | `MUHAKEME` |
| `Antigravity devir bloğu` | *(tek motor akışında yok — cümle silinir veya "MUHAKEME rolü üretir" olur)* |
| `Antigravity self-review` | `DENETCI denetimi` |
| `fallback claude` | `fallback motor` |
| `engine: claude` / `engine: gemini` | `engine: <aktif motor>` |

Tarihçe cümlelerinde (örn. "2026-07-19'da Codex kaldırıldı") sağlayıcı adı **kalır**,
satır sonuna `<!-- vendor-ok: tarihçe kaydı -->` eklenir.

- [ ] **Step 3: prompts/gemini → prompts/muhakeme taşı**

```bash
git mv prompts/gemini prompts/muhakeme
git status --short | head
```

- [ ] **Step 4: doktrin_lint glob'unu güncelle**

`scripts/doktrin_lint.py` içinde:

```python
    "prompts/gemini/*.md",
```

satırını şununla değiştir:

```python
    "prompts/muhakeme/*.md",
```

- [ ] **Step 5: prompts/gemini atıflarını güncelle**

```bash
grep -rln "prompts/gemini" --include="*.md" --include="*.py" --include="*.json" . \
  | grep -v "^./arsiv/" | grep -v "^./docs/superpowers/"
```

Çıkan her dosyada `prompts/gemini/` → `prompts/muhakeme/` yap.

- [ ] **Step 6: Üç kapıyı da çalıştır**

```bash
python scripts/vendor_lint.py | tail -3
python scripts/doktrin_lint.py | tail -3
python scripts/referans_kontrol.py | tail -3
python -m pytest scripts/tests -q
```

Beklenen: `VENDOR LINT: TEMIZ`, `DOKTRIN LINT: PASS`, referans regresyonu yok,
tüm testler geçer.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor(rol-dili): saglayici adlari rol adlariyla degistirildi

Claude Fable 5 / terminal Claude -> ORKESTRATOR
Antigravity / Gemini 3.1 Pro -> MUHAKEME
Antigravity self-review -> DENETCI denetimi
prompts/gemini/ -> prompts/muhakeme/ (doktrin_lint glob'u guncellendi)
Tarihce cumleleri <!-- vendor-ok --> ile muaf.

vendor_lint TEMIZ, doktrin_lint PASS.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2.5: Araç adaptörü stub'ları

**Files:**
- Replace: `CLAUDE.md` (72 KB → 3 satır)
- Create: `GEMINI.md`, `.cursor/rules/hukuk.mdc`

- [ ] **Step 1: CLAUDE.md'yi stub'a indir**

`CLAUDE.md` içeriğini tamamen şununla değiştir:

```markdown
# Yönlendirme

Bu projenin anayasası `AGENTS.md` dosyasıdır. Tüm kurallar, ASAMA akışı, doktrin
ve kalite kapıları oradadır. Bu dosya yalnızca araç adaptörüdür, kural içermez.

**Önce `AGENTS.md` dosyasını oku.**
```

- [ ] **Step 2: GEMINI.md ve Cursor kuralını oluştur**

```bash
cp CLAUDE.md GEMINI.md
mkdir -p .cursor/rules
```

`.cursor/rules/hukuk.mdc`:

```markdown
---
description: Hukuk Başasistanı anayasası
alwaysApply: true
---

Bu projenin anayasası `AGENTS.md` dosyasıdır. Tüm kurallar, ASAMA akışı, doktrin
ve kalite kapıları oradadır. Önce `AGENTS.md` dosyasını oku.
```

- [ ] **Step 3: Stub'ların gerçekten boş olduğunu doğrula**

```bash
wc -c CLAUDE.md GEMINI.md .cursor/rules/hukuk.mdc
python scripts/doktrin_lint.py | tail -3
```

Beklenen: her stub 400 byte'ın altında; `DOKTRIN LINT: PASS` (stub'lar artık yüzey
listesinde değil — Task 1.4'te çıkarıldı).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor(anayasa): CLAUDE.md stub'a indi, GEMINI.md ve Cursor kurali eklendi

Hangi LLM ile baglanilirsa baglanilsin AGENTS.md okunur.
CLAUDE.md 72 KB -> 3 satirlik yonlendirme.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

# FAZ 3 — Kitabın Derin Okunması → ASAMA 1 Olay Çözüm Protokolü

> **Bu planın ana işidir.** Avukatın talimatı: "kitabı iyice özümseyerek okuyup
> projemizin o baştaki dava analizi briefing kısmına en doğru şekilde yedirmen."
>
> **Bağlayıcı kural (spec §3.4.3):** Protokoldeki her adım ya kitaptan sayfa
> referanslıdır (`[s. NNN]`), ya da açıkça `[SİSTEM EKİ]` etiketlidir. Kitapta
> olmayan bir adım kitaba atfedilemez. Sıra kitaptan çıkarılır, önceden varsayılmaz.

### Task 3.1: İÇİNDEKİLER okuması + EKLENECEKKITAPLAR teyidi

**Files:**
- Okunacak: `tmp/nosyon-ocr/parca-01_s001-025.md`
- Modify: `EKLENECEKKITAPLAR.md`

- [ ] **Step 1: İçindekiler sayfalarını oku**

```bash
sed -n '/pdf:00[5-9]/,/pdf:025/p' tmp/nosyon-ocr/parca-01_s001-025.md
```

Kitabın üç bölümünün tam başlık ağacını çıkar. Nokta dizileri (`....`) OCR'da
bozulur; başlık metnini al, sayfa numarasını **gövdeden** teyit et.

- [ ] **Step 2: Bölüm sınırlarını tespit et**

Her bölümün hangi PDF indeksinde başlayıp bittiğini bul:

```bash
grep -n "BİRİNCİ BÖLÜM\|İKİNCİ BÖLÜM\|ÜÇÜNCÜ BÖLÜM" tmp/nosyon-ocr/parca-*.md
```

Sonucu not al — Task 3.2-3.4'ün okuma aralıkları budur.

- [ ] **Step 3: EKLENECEKKITAPLAR.md'deki varsayımları teyit et**

`EKLENECEKKITAPLAR.md` §2'de kitabın içeriği hakkında satıcı sayfalarından derlenmiş
varsayımlar var. Gerçek içindekiler ile karşılaştır. Her sapma için o dosyayı güncelle
ve §5'teki "doğrulama borcu" notunun altına ekle:

```markdown
**Doğrulama tamamlandı (2026-09-02):** Kitap temin edildi, İÇİNDEKİLER OCR ile
okundu. Yukarıdaki içerik başlıkları [teyit edildi / şu noktalarda düzeltildi: ...].
```

- [ ] **Step 4: §7 checklist'inde ilk maddeyi işaretle**

`EKLENECEKKITAPLAR.md` §7'de:

```markdown
- [x] İÇİNDEKİLER'den bu dosyadaki içerik başlıklarını teyit et, sapma varsa güncelle
```

- [ ] **Step 5: Commit**

```bash
git add EKLENECEKKITAPLAR.md
git commit -m "docs(kitap): Hukuk Nosyonu icindekiler teyidi tamamlandi

Kitap temin edildi, 306 sayfa OCR edildi, ICINDEKILER okundu.
EKLENECEKKITAPLAR.md'deki satici sayfasindan derlenmis varsayimlar
gercek icerikle karsilastirildi; dogrulama borcu kapatildi.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3.2: Okuma notları — üç bölüm

**Files:**
- Create: `bilgi-tabani/nosyon-okuma-notlari.md`
- Okunacak: `tmp/nosyon-ocr/parca-*.md`, `tmp/nosyon-ocr/01-SAYFA-ESLEME.md`

- [ ] **Step 1: Dosya iskeletini oluştur**

`bilgi-tabani/nosyon-okuma-notlari.md`:

```markdown
# Hukuk Nosyonu Cilt I — Okuma Notları

**Kaynak:** Dr. Halil Polat, *Teori ve Pratikte Hukuk Nosyonu — Cilt I*, 5. baskı.
**Okuma:** 2026-09-02, 306 sayfa tam OCR üzerinden.
**Sayfa referansı:** `[s. NNN]` = kitabın **basılı** sayfa numarası
(eşleme: `tmp/nosyon-ocr/01-SAYFA-ESLEME.md`).

> **Telif sınırı:** Bu dosya özet ve kısa referanslı alıntı içerir; kitabın tam metni
> repoda tutulmaz, vektör DB'ye indekslenmez.

## Bölüm 1 — Nosyon ve hukuk nosyonu

_(doldurulacak)_

## Bölüm 2 — Yöntem, metodoloji, hukuki uyuşmazlıklarda çözüm metodolojisi

_(doldurulacak)_

## Bölüm 3 — Pratik olay çözümleri

_(doldurulacak)_

## Sistemimize doğrudan oturan başlıklar

_(doldurulacak — hangi başlık hangi ASAMA/dosya ile eşleşiyor)_
```

- [ ] **Step 2: Bölüm 1'i oku ve notla**

Task 3.1 Step 2'de bulunan aralığı oku. Her kayıt şu biçimde:

```markdown
- **<Başlık>** `[s. NNN]` — <bir-iki cümle özet>
  - Bizim karşılığımız: <hangi dosya/ASAMA> veya `karşılığı yok`
```

Kural: kitapta yazmayan hiçbir şey bu bölüme yazılmaz. Yorum eklemek gerekirse
`> Not (bizim):` ile ayrılır.

- [ ] **Step 3: Bölüm 2'yi oku ve notla**

Aynı biçim. Bu bölüm **hukuki uyuşmazlıklarda çözüm metodolojisini** içeriyor —
protokolün omurgası buradan çıkacak. Özellikle şu başlıkları ayrıntılı notla:
yorum yöntemleri, kıyas/*argumentum a contrario*, kanun boşluğu.

- [ ] **Step 4: Bölüm 3'ü oku ve notla**

Pratik olay çözümleri. İçindekilerde görülen başlık zinciri (maddi olayın çerçevesi
ve kronolojisi → çekişmesiz hususların ayıklanması → uygulanacak hukuk kuralının
belirlenmesi → borcun kaynağı: sözleşme / haksız fiil / sebepsiz zenginleşme →
borcu sona erdiren sebepler) **birebir sırasıyla** notlanır; sıra bizim
protokolümüzün iskeleti olacak.

- [ ] **Step 5: Eşleştirme bölümünü doldur**

"Sistemimize doğrudan oturan başlıklar" bölümünde her kitap başlığını mevcut
sistemdeki karşılığıyla eşle:

```markdown
| Kitap başlığı | Sayfa | Bizdeki karşılığı | Durum |
|---|---|---|---|
| Maddi olayın çerçevesi ve kronolojisi | [s. NNN] | `00-Briefing.md` olay özeti | zayıf — kronoloji zorunlu değil |
| Çekişmesiz hususların ayıklanması | [s. NNN] | — | **yok** |
```

`yok` işaretli her satır, protokole yeni adım olarak girecek demektir.

- [ ] **Step 6: Commit**

```bash
git add bilgi-tabani/nosyon-okuma-notlari.md
git commit -m "docs(kitap): Hukuk Nosyonu uc bolum okuma notlari (sayfa referansli)

306 sayfa OCR uzerinden derin okuma. Her kayit basili sayfa referansli.
Son bolumde kitap basliklari ile mevcut sistemin eslesme tablosu:
'yok' isaretli satirlar protokole yeni adim olarak girecek.

Telif: ozet ve kisa alinti; tam metin repoda degil.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3.3: Protokol etiket kapısı (TDD)

Protokolü yazmadan **önce** kapıyı kur: her adım ya sayfa referanslı ya `[SİSTEM EKİ]`.

**Files:**
- Create: `scripts/protokol_kontrol.py`
- Test: `scripts/tests/test_protokol_kontrol.py`

- [ ] **Step 1: Başarısız testi yaz**

`scripts/tests/test_protokol_kontrol.py`:

```python
"""protokol_kontrol testleri — her adim sayfa referansli veya [SISTEM EKI].

Çalıştır: python -m pytest scripts/tests/test_protokol_kontrol.py -q
"""
import protokol_kontrol as pk


def test_sayfa_referansli_adim_gecer(tmp_path):
    d = tmp_path / "p.md"
    d.write_text("# Protokol\n\n### Adım 1 — Maddi olayın tespiti [s. 143]\n\nmetin\n", encoding="utf-8")
    assert pk.etiketsiz_adimlar(d) == []


def test_sistem_eki_adim_gecer(tmp_path):
    d = tmp_path / "p.md"
    d.write_text("# Protokol\n\n### Adım 2 — UYAP evrak tasnifi [SİSTEM EKİ]\n\nmetin\n", encoding="utf-8")
    assert pk.etiketsiz_adimlar(d) == []


def test_etiketsiz_adim_yakalanir(tmp_path):
    d = tmp_path / "p.md"
    d.write_text("# Protokol\n\n### Adım 3 — Delil toplama\n\nmetin\n", encoding="utf-8")
    bulgular = pk.etiketsiz_adimlar(d)
    assert len(bulgular) == 1
    assert "Adım 3" in bulgular[0][1]


def test_h2_ve_h1_adim_sayilmaz(tmp_path):
    d = tmp_path / "p.md"
    d.write_text("# Başlık\n\n## Bölüm\n\n### Adım 1 — X [s. 10]\n", encoding="utf-8")
    assert pk.etiketsiz_adimlar(d) == []


def test_pdf_referansi_da_gecerli(tmp_path):
    d = tmp_path / "p.md"
    d.write_text("### Adım 1 — Önsözden [pdf s. 7]\n", encoding="utf-8")
    assert pk.etiketsiz_adimlar(d) == []
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu gör**

```bash
python -m pytest scripts/tests/test_protokol_kontrol.py -q
```

Beklenen: `ModuleNotFoundError: No module named 'protokol_kontrol'`

- [ ] **Step 3: Scripti yaz**

`scripts/protokol_kontrol.py`:

```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""protokol_kontrol.py — olay cozum protokolu etiket kapisi.

Spec 3.4.3 baglayici kurali: protokoldeki her adim ya kitaptan sayfa referanslidir
`[s. NNN]` / `[pdf s. NNN]`, ya da acikca `[SISTEM EKI]` etiketlidir. Etiketsiz adim,
kitaba dayanmayan bir seyi kitaba atfetme riskidir -> FAIL.

Adim = H3 baslik (### ile baslayan satir).

Kullanim:
  python scripts/protokol_kontrol.py ajanlar/director/olay-cozum-protokolu.md
exit 0 = temiz, 1 = etiketsiz adim var.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

ADIM_RE = re.compile(r"^###\s+(.*)$")
SAYFA_RE = re.compile(r"\[(?:pdf\s+)?s\.\s*\d+", re.IGNORECASE)
SISTEM_EKI = "[SİSTEM EKİ]"


def etiketsiz_adimlar(dosya: Path) -> list[tuple[int, str]]:
    """Etiket tasimayan H3 adim basliklari: (satir_no, baslik)."""
    try:
        satirlar = dosya.read_text(encoding="utf-8").splitlines()
    except (OSError, UnicodeDecodeError):
        return []
    bulgular: list[tuple[int, str]] = []
    for no, satir in enumerate(satirlar, start=1):
        m = ADIM_RE.match(satir)
        if not m:
            continue
        baslik = m.group(1)
        if SAYFA_RE.search(baslik) or SISTEM_EKI in baslik:
            continue
        bulgular.append((no, baslik.strip()))
    return bulgular


def main(argv: list[str]) -> int:
    if not argv:
        print("kullanim: python scripts/protokol_kontrol.py <protokol.md>", file=sys.stderr)
        return 2
    hata = 0
    for a in argv:
        p = Path(a) if Path(a).is_absolute() else ROOT / a
        if not p.exists():
            print(f"[YOK] {a}")
            hata += 1
            continue
        bulgular = etiketsiz_adimlar(p)
        for no, baslik in bulgular:
            print(f"[ETIKETSIZ] {a}:{no} -> {baslik}")
        hata += len(bulgular)
    print()
    if hata:
        print(f"PROTOKOL KONTROL: FAIL ({hata} etiketsiz adim)")
        print("Her adim ya [s. NNN] sayfa referansi ya [SİSTEM EKİ] tasimali.")
        return 1
    print("PROTOKOL KONTROL: TEMIZ — her adim etiketli")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
```

- [ ] **Step 4: Testleri çalıştır, geçtiğini gör**

```bash
python -m pytest scripts/tests/test_protokol_kontrol.py -q
```

Beklenen: `5 passed`

- [ ] **Step 5: Commit**

```bash
git add scripts/protokol_kontrol.py scripts/tests/test_protokol_kontrol.py
git commit -m "feat(scripts): protokol_kontrol.py - adim etiket kapisi

Spec 3.4.3: olay cozum protokolundeki her adim ya [s. NNN] sayfa referansli
ya [SISTEM EKI] etiketli olmali. Etiketsiz adim = kitaba dayanmayan seyi
kitaba atfetme riski -> FAIL.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3.4: Olay çözüm protokolünü yaz

**Files:**
- Create: `ajanlar/director/olay-cozum-protokolu.md`
- Okunacak: `bilgi-tabani/nosyon-okuma-notlari.md`

- [ ] **Step 1: İskeleti oluştur**

`ajanlar/director/olay-cozum-protokolu.md`:

```markdown
# ASAMA 1 — Olay Çözüm Protokolü (İlk Dava İncelemesi)

**Kaynak:** Dr. Halil Polat, *Teori ve Pratikte Hukuk Nosyonu — Cilt I*, 5. baskı.
Okuma notları: `bilgi-tabani/nosyon-okuma-notlari.md`.
**Spec:** `docs/superpowers/specs/2026-09-02-tek-motor-agnostik-toparlama-design.md` §3.4.3

## Bu protokol ne yapar

ASAMA 1'in eski hâli bir **tercih formuydu** (dava teorisi ne, ton nasıl olsun).
Bu protokol onun yerine geçmez, **önüne geçer**: tercih sorulmadan önce olayın
hukuki iskeleti kurulur.

## Etiket kuralı

Her adım başlığı ya kitaptan sayfa referansı `[s. NNN]` taşır, ya da bizim
eklediğimizi belirten `[SİSTEM EKİ]` taşır. Kitapta olmayan hiçbir şey kitaba
atfedilmez. Denetim: `python scripts/protokol_kontrol.py ajanlar/director/olay-cozum-protokolu.md`

## Çıktı

Bu protokolün her adımının cevabı `00-Briefing.md` içindeki karşılık gelen başlığa
yazılır. Cevabı bilinmeyen adım **boş bırakılmaz**, `EKSİK — müvekkilden sorulacak`
yazılır ve ASAMA 1 çıktısının "Avukatın Karar Noktaları" bloğuna taşınır.

---

_(adımlar buraya — her biri ### ile başlar ve etiket taşır)_
```

- [ ] **Step 2: Adımları okuma notlarından türet**

`bilgi-tabani/nosyon-okuma-notlari.md`'deki Bölüm 3 sırasını takip ederek her adımı yaz.
Her adım şu şablonda:

```markdown
### Adım N — <Adım adı> [s. NNN]

**Soru:** <bu adımda hangi soruya cevap aranır — tek cümle>

**Nasıl yapılır:**
- <kitaptan çıkan somut alt adım>
- <kitaptan çıkan somut alt adım>

**Briefing karşılığı:** `00-Briefing.md` → <başlık adı>

**Atlanırsa ne olur:** <somut risk — kitapta yazıyorsa referansla, yazmıyorsa
`> Not (bizim):` ile ayır>
```

Kitapta karşılığı olmayıp bizim eklediğimiz adımlar (örn. UYAP evrak tasnifi,
arabuluculuk dava şartı kontrolü, MemPalace geçmiş dava eşleşmesi) `[SİSTEM EKİ]`
etiketiyle ve kısa gerekçeyle yazılır.

- [ ] **Step 3: Etiket kapısını çalıştır**

```bash
python scripts/protokol_kontrol.py ajanlar/director/olay-cozum-protokolu.md
```

Beklenen: `PROTOKOL KONTROL: TEMIZ`. FAIL veren her adıma etiket ekle.

- [ ] **Step 4: Vendor lint çalıştır**

```bash
python scripts/vendor_lint.py ajanlar/director/olay-cozum-protokolu.md
```

Beklenen: `VENDOR LINT: TEMIZ`

- [ ] **Step 5: Commit**

```bash
git add ajanlar/director/olay-cozum-protokolu.md
git commit -m "feat(asama1): olay cozum protokolu - ilk dava incelemesinin iskeleti

Hukuk Nosyonu Cilt I (Polat) Bolum 3 sirasindan turetildi.
Her adim [s. NNN] sayfa referansli veya [SISTEM EKI] etiketli
(protokol_kontrol.py TEMIZ).

ASAMA 1 artik tercih formu degil: once olayin hukuki iskeleti kurulur,
sonra tercih sorulur. Cevabi bilinmeyen adim bos birakilmaz,
'EKSIK - muvekkilden sorulacak' olarak Karar Noktalari'na tasinir.

Confidence: medium - protokol sirasi kitaptan cikarildi, teyit turu Task 3.5'te

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3.5: Teyit turu — her sayfa atfını kaynağa dön

**Files:**
- Modify: `ajanlar/director/olay-cozum-protokolu.md`
- Create: `tmp/protokol-teyit.md` (çalışma dosyası, commit edilmez)

- [ ] **Step 1: Protokoldeki tüm sayfa atıflarını çıkar**

```bash
grep -o "\[s\. [0-9]*\]" ajanlar/director/olay-cozum-protokolu.md | sort -u
```

- [ ] **Step 2: Her atfı OCR metninde doğrula**

Her `[s. NNN]` için: eşleme tablosuyla PDF indeksini bul, OCR metnindeki o sayfayı oku,
protokoldeki iddianın gerçekten o sayfada olduğunu kontrol et. Sonucu
`tmp/protokol-teyit.md` içine yaz:

```markdown
| Adım | Atıf | PDF indeks | Kaynakta var mı | Aksiyon |
|---|---|---|---|---|
| Adım 1 | [s. 143] | 169 | EVET | — |
| Adım 4 | [s. 158] | 184 | HAYIR — s.160'ta | atıf düzeltildi |
| Adım 7 | [s. 171] | 197 | YOK | [SİSTEM EKİ]'ne çevrildi |
```

- [ ] **Step 3: Teyit edilemeyenleri düzelt**

Kaynakta bulunmayan her atıf ya doğru sayfayla düzeltilir ya `[SİSTEM EKİ]`'ne çevrilir.
**Üçüncü bir seçenek yoktur** — "muhtemelen oradadır" kabul edilmez.

- [ ] **Step 4: Kapıları tekrar çalıştır**

```bash
python scripts/protokol_kontrol.py ajanlar/director/olay-cozum-protokolu.md
python scripts/referans_kontrol.py | tail -3
```

Beklenen: her ikisi de temiz.

- [ ] **Step 5: Teyit sonucunu protokole işle**

Protokolün sonuna ekle:

```markdown
---

## Teyit kaydı

**Tarih:** 2026-09-02
**Yöntem:** Her `[s. NNN]` atfı için OCR metnindeki ilgili sayfa yeniden okundu ve
iddia ile karşılaştırıldı.
**Sonuç:** <N> atıf teyit edildi, <M> atıf düzeltildi, <K> adım `[SİSTEM EKİ]`'ne çevrildi.
**Teyit edilemeyen atıf kalmadı.**
```

- [ ] **Step 6: Commit**

```bash
git add ajanlar/director/olay-cozum-protokolu.md
git commit -m "fix(asama1): olay cozum protokolu teyit turu tamamlandi

Her [s. NNN] atfi icin OCR metnindeki sayfa yeniden okundu, iddia kaynakla
karsilastirildi. Kaynakta bulunmayan atiflar duzeltildi veya [SISTEM EKI]'ne
cevrildi. Teyit edilemeyen atif kalmadi.

Bu tur, DENETCI mantiginin kitap calismasina uygulanmasidir (spec 3.4.3).

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3.6: Protokolü ASAMA 1 yüzeylerine yedir

**Files:**
- Modify: `AGENTS.md` (ASAMA 1 bölümü)
- Modify: `sablonlar/advanced-briefing-template.md`
- Modify: `ajanlar/director/SKILL.md`
- Create/Modify: `playbook/_sablon.md`

- [ ] **Step 1: AGENTS.md ASAMA 1 bölümünü güncelle**

"ASAMA 1 — Hazırlık + Briefing" tablosundaki satırı ve ilgili bölümü şu sırayla değiştir:

```markdown
### ASAMA 1 — Hazırlık + Olay Çözümü + Briefing

Sıra **bağlayıcıdır**:

1. **Drive dava klasörü** kurulur (`Aktif Davalar/{dava-id}/`)
2. **Kaynak sorgulama** (zorunlu — UYAP / NotebookLM / Drive / yerel / kaynaksız)
3. **Olay çözüm protokolü** — `ajanlar/director/olay-cozum-protokolu.md` adım adım
   uygulanır. Cevabı bilinmeyen adım boş bırakılmaz, `EKSİK — müvekkilden sorulacak`
   yazılır ve Karar Noktaları'na taşınır.
4. **Playbook + dersler** okunur (`playbook/{dava-turu}.md`, `dersler/`)
5. **Advanced Briefing** (tercihler: ton, risk toleransı, olmazsa olmaz talepler)

Tercih sorulmadan önce olayın hukuki iskeleti kurulur — sıra tersine çevrilemez.

**Çıktı:** `00-Briefing.md`
```

- [ ] **Step 2: Briefing şablonunu protokole göre yeniden kur**

`sablonlar/advanced-briefing-template.md` içine, mevcut 8 tercih sorusunun **üstüne**,
protokolün her adımı için bir başlık ekle. Başlıklar protokoldeki adım adlarıyla
birebir aynı olmalı (eşleşme kaybolmasın).

- [ ] **Step 3: Director SKILL'ini bağla**

`ajanlar/director/SKILL.md` içinde ASAMA 1 yürütmesini anlatan bölüme ekle:

```markdown
**ASAMA 1 zorunlu okuma:** `ajanlar/director/olay-cozum-protokolu.md`.
Protokolün adımları sırayla uygulanır; atlanan adım için gerekçe `00-Briefing.md`
içine yazılır. Protokol atlanamaz — atlanırsa ASAMA 2 araştırma sorusu yanlış
kurulur (kitap: uygulanacak hukuk kuralı belirlenmeden araştırma yapılmaz).
```

- [ ] **Step 4: Playbook şablonuna boş form ekle**

`playbook/_sablon.md` oluştur (veya varsa güncelle) — protokolün adımlarını
avukatın kendi muhakemesiyle dolduracağı boş form olarak:

```markdown
# Playbook — {dava-turu}

> Bu dosya avukatın **kendi muhakemesini** kodlar; süreç değil yargı.
> İskelet: `ajanlar/director/olay-cozum-protokolu.md`

## Bu dava türünde her zaman kontrol ettiklerim
- [ ] <adım 1 karşılığı>
- [ ] <adım 2 karşılığı>

## Karşı tarafın klasik oyunları
-

## Bu dava türünde yapmayacağım argümanlar
-

## Müvekkile riski nasıl anlatırım
-
```

- [ ] **Step 5: Bütün kapıları çalıştır**

```bash
python scripts/protokol_kontrol.py ajanlar/director/olay-cozum-protokolu.md
python scripts/vendor_lint.py | tail -3
python scripts/doktrin_lint.py | tail -3
python scripts/referans_kontrol.py | tail -3
python -m pytest scripts/tests -q
```

Beklenen: hepsi temiz/PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(asama1): olay cozum protokolu sisteme yedirildi

AGENTS.md ASAMA 1: sira baglayici hale geldi - tercih sorulmadan once
olayin hukuki iskeleti kurulur (protokol adim adim uygulanir).
advanced-briefing-template: protokol adimlari tercih sorularinin ustune eklendi.
director/SKILL.md: protokol zorunlu okuma.
playbook/_sablon.md: avukatin kendi muhakemesiyle dolduracagi bos form.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

# FAZ 4 — Yorum Yöntemi + Doktrinin 9. Clause'u

### Task 4.1: Hukuki yöntem kontrol listesi

**Files:**
- Create: `bilgi-tabani/hukuki-yontem-kontrol-listesi.md`
- Okunacak: `bilgi-tabani/nosyon-okuma-notlari.md` (Bölüm 2)

- [ ] **Step 1: Dosyayı yaz**

`bilgi-tabani/hukuki-yontem-kontrol-listesi.md`:

```markdown
# Hukuki Yöntem Kontrol Listesi

**Kaynak:** Dr. Halil Polat, *Teori ve Pratikte Hukuk Nosyonu — Cilt I*, 5. baskı,
Bölüm 2. Okuma notları: `bilgi-tabani/nosyon-okuma-notlari.md`.

**Ne işe yarar:** Doktrinimiz bugüne kadar **kaynağın gerçekliğini** denetliyordu
(künye Bedesten'de var mı, alıntı birebir mi, madde mülga mı). Denetlemediği şey,
gerçek bir kaynaktan **geçersiz sonuç çıkarmaktı**. Bu liste o boşluğu kapatır.

**Nerede kullanılır:** `ajanlar/arastirmaci/SKILL.md` → Yorum Yöntemi Protokolü;
doktrinin 9. clause'u (`prompts/_doktrin-preamble.md`).

> Her kural sayfa referanslıdır. Referanssız kural bu dosyaya yazılmaz.

## 1. Yorum yöntemleri sırası

_(kitaptan, sayfa referanslı — lafzî / sistematik / amaçsal / tarihsel)_

## 2. Kıyas mı, argumentum a contrario mu

_(kıyas hangi şartlarda caiz, hangi hâllerde aksi-kavram yorumu gerekir)_

## 3. Kanun boşluğu mu, bilinçli susma mı

_(ayrımın ölçütü ve sonucu)_

## 4. Genelleme sınırları

_(bir fıkranın cevabı başka fıkraya hangi şartlarda taşınabilir — taşınamaz.
Bu, 2026-05-05 Tuğba 2026-89 hatasının doğrudan karşılığıdır: İİK 89/4 bağlamındaki
cevap 89/3'e taşınmıştı. Künye sahte değildi; çıkarım geçersizdi.)_

## 5. Tümevarım eşiği

_(kaç karardan "yerleşik uygulama" denebilir; denemeyeceği hâller)_
```

- [ ] **Step 2: Her bölümü okuma notlarından doldur**

Kural: bu dosyaya yazılan her madde `[s. NNN]` taşır. Kitapta karşılığı olmayan bir
kural yazılacaksa `[SİSTEM EKİ]` etiketiyle ve gerekçesiyle yazılır.

- [ ] **Step 3: Doğrula**

```bash
grep -c "\[s\. " bilgi-tabani/hukuki-yontem-kontrol-listesi.md
python scripts/vendor_lint.py bilgi-tabani/hukuki-yontem-kontrol-listesi.md
```

Beklenen: sayfa referansı sayısı > 0; vendor lint temiz.

- [ ] **Step 4: Commit**

```bash
git add bilgi-tabani/hukuki-yontem-kontrol-listesi.md
git commit -m "docs(yontem): hukuki yontem kontrol listesi (sayfa referansli)

Doktrinin eksik ayagi: kaynak gercekligi degil CIKARIM gecerliligi.
Yorum yontemleri sirasi, kiyas/a contrario ayrimi, kanun bosluğu/bilincli susma,
genelleme sinirlari, tumevarim esigi.

Bolum 4 dogrudan 2026-05-05 Tugba 2026-89 hatasinin karsiligi:
kunye sahte degildi, cikarim gecersizdi.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4.2: Araştırmacı SKILL'ine Yorum Yöntemi Protokolü

**Files:**
- Modify: `ajanlar/arastirmaci/SKILL.md` (mevcut "Normlar Hiyerarşisi Protokolü" bölümünün yanına)

- [ ] **Step 1: Normlar Hiyerarşisi bölümünün yerini bul**

```bash
grep -n "Normlar Hiyerarşisi" ajanlar/arastirmaci/SKILL.md
```

- [ ] **Step 2: Hemen ardına yeni bölümü ekle**

```markdown
## Yorum Yöntemi Protokolü

**Kaynak:** `bilgi-tabani/hukuki-yontem-kontrol-listesi.md`
(Polat, *Hukuk Nosyonu Cilt I*, Bölüm 2 — sayfa referanslı)

Normlar Hiyerarşisi hangi normun **uygulanacağını** belirler; bu protokol o normdan
**nasıl sonuç çıkarılacağını** denetler. İkisi birlikte çalışır.

Araştırma raporunda ileri sürülen her hukuki sonuç için şu dört soru cevaplanır:

1. **Hangi yorum yöntemiyle vardım?** Lafzî mi, sistematik mi, amaçsal mı, tarihsel mi?
   Lafzî yorum yeterliyken amaçsal yoruma gitmek gerekçe ister.
2. **Kıyas mı yaptım, aksi-kavram yorumu mu gerekiyordu?** Kıyas her hükümde caiz
   değildir; istisnai ve sınırlayıcı hükümlerde *argumentum a contrario* gerekir.
3. **Boşluk mu var, bilinçli susma mı?** Kanun koyucunun susması her zaman boşluk
   değildir; bilinçli susma varsa boşluk doldurma yasaktır.
4. **Genellemem meşru mu?** Bir fıkra/bent hakkındaki içtihat başka fıkraya
   taşınamaz. Taşınıyorsa gerekçe açıkça yazılır.

**Raporda gösterim:** Her argümanın güven etiketinin
(`[YERLEŞİK] / [GELİŞEN] / [AÇIK SORU] / [ZORLAMA]`) yanına yorum yöntemi yazılır:

> `[YERLEŞİK]` — sistematik yorum; kıyas değil, doğrudan uygulama.

**HARD FAIL koşulu:** Kaynak gerçek olsa dahi ondan çıkarılan sonuç geçersizse
(bağlam kayması, meşru olmayan genelleme, caiz olmayan kıyas) çıktı reddedilir.
Bu, doktrinin 9. clause'udur.
```

- [ ] **Step 3: Doğrula**

```bash
python scripts/doktrin_lint.py ajanlar/arastirmaci/SKILL.md 2>&1 | tail -2
python scripts/referans_kontrol.py ajanlar/arastirmaci/SKILL.md | tail -2
```

- [ ] **Step 4: Commit**

```bash
git add ajanlar/arastirmaci/SKILL.md
git commit -m "feat(arastirmaci): Yorum Yontemi Protokolu eklendi

Normlar Hiyerarsisi hangi normun uygulanacagini belirler; bu protokol o normdan
NASIL sonuc cikarilacagini denetler. Dort soru: yorum yontemi, kiyas/a contrario,
bosluk/bilincli susma, genelleme mesruiyeti.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4.3: Doktrinin 9. clause'u — BÖLÜNMEZ ADIM

> **Uyarı:** Bu görevin tüm adımları **tek commit'te** tamamlanır. `doktrin_lint.py`
> 30 doktrin yüzeyini denetliyor; clause listesi 9'a çıkarılıp yüzeyler
> güncellenmezse lint hepsini FAIL eder ve sistem çalışmaz (spec §3.4.6).

**Files:**
- Modify: `scripts/doktrin_contract.py:22-31` (REQUIRED_CLAUSE_TOKENS + STANDARD_HEADER)
- Modify: `prompts/_doktrin-preamble.md`
- Modify: 30 doktrin yüzeyi (16 muhakeme prompt'u, 5 perspektif ajanı, 7 komut, `AGENTS.md`)
- Test: `scripts/tests/test_doktrin.py`

- [ ] **Step 1: Başarısız testi yaz**

`scripts/tests/test_doktrin.py` sonuna ekle:

```python
# --- 9. clause: çıkarım geçerliliği (2026-09-02) ---

def test_dokuzuncu_clause_kontratta_var():
    assert "ÇIKARIM GEÇERLİLİĞİ" in dc.REQUIRED_CLAUSE_TOKENS
    assert len(dc.REQUIRED_CLAUSE_TOKENS) == 9


def test_dokuzuncu_clause_standard_headerda_var():
    assert "ÇIKARIM GEÇERLİLİĞİ" in dc.STANDARD_HEADER
    assert dc.missing_clauses(dc.STANDARD_HEADER) == []


def test_dokuzuncu_clause_preamblede_var():
    text = PREAMBLE.read_text(encoding="utf-8")
    assert "ÇIKARIM GEÇERLİLİĞİ" in text
    assert dc.missing_clauses(text) == []


def test_eksik_dokuzuncu_clause_yakalanir():
    # 8 clause taşıyan eski metin artık eksik sayılmalı
    eski = dc.STANDARD_HEADER.replace("ÇIKARIM GEÇERLİLİĞİ", "xxx")
    assert "ÇIKARIM GEÇERLİLİĞİ" in dc.missing_clauses(eski)
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu gör**

```bash
python -m pytest scripts/tests/test_doktrin.py -q 2>&1 | tail -6
```

Beklenen: 4 test FAIL (`assert 'ÇIKARIM GEÇERLİLİĞİ' in [...]`)

- [ ] **Step 3: doktrin_contract.py'yi güncelle**

`REQUIRED_CLAUSE_TOKENS` listesinin sonuna ekle:

```python
    "ÇIKARIM GEÇERLİLİĞİ",     # Yasak 9: gerçek kaynaktan geçersiz sonuç (2026-09-02)
```

`STANDARD_HEADER` içinde, `> - Kritik kuralda ÇİFT KAYNAK şart.` satırının **altına** ekle:

```
> - ÇIKARIM GEÇERLİLİĞİ: Kaynak gerçek olsa dahi ondan çıkarılan sonuç geçersizse HARD FAIL — bağlam kayması, meşru olmayan genelleme, caiz olmayan kıyas reddedilir.
```

- [ ] **Step 4: prompts/_doktrin-preamble.md'yi güncelle**

Aynı maddeyi tam preamble'a ekle; mutlak yasaklar listesine 9. madde olarak:

```markdown
9. **ÇIKARIM GEÇERLİLİĞİ — kaynak gerçek olsa dahi çıkarım geçersizse HARD FAIL.**
   Doktrin bugüne kadar kaynağın gerçekliğini denetledi (künye var mı, alıntı birebir mi).
   Bu madde çıkarımın kendisini denetler:
   - Bir fıkra/bent hakkındaki içtihat başka fıkraya taşınamaz (bağlam kayması)
   - Sınırlı sayıda karardan "yerleşik uygulama" sonucu çıkarılamaz (meşru olmayan genelleme)
   - İstisnai ve sınırlayıcı hükümlerde kıyas caiz değildir (caiz olmayan kıyas)
   - Kanun koyucunun bilinçli susması boşluk sayılamaz

   Yöntem: `bilgi-tabani/hukuki-yontem-kontrol-listesi.md`
   Sistemik gerekçe: 2026-05-05 Tuğba 2026-89 hatası. Künye sahte değildi;
   İİK 89/4 bağlamındaki cevap 89/3'e taşınmıştı — çıkarım geçersizdi.
```

- [ ] **Step 5: 30 doktrin yüzeyini güncelle**

Her yüzeydeki gömülü doktrin bloğuna yeni maddeyi ekle. Otomasyon için mevcut
injector'ı kullan:

```bash
python scripts/inject_doktrin.py --help
```

Injector `STANDARD_HEADER`'ı yüzeylere yazıyorsa çalıştır; yazmıyorsa her yüzeyde
`ÇİFT KAYNAK` satırının altına Step 3'teki satırı elle ekle. Yüzey listesi:

```bash
python scripts/doktrin_lint.py 2>&1 | grep -E "^\[(PASS|FAIL)\]" | sed 's/^\[[A-Z]*\] //'
```

- [ ] **Step 6: Testleri ve lint'i çalıştır**

```bash
python -m pytest scripts/tests -q
python scripts/doktrin_lint.py 2>&1 | tail -3
```

Beklenen: tüm testler geçer; `DOKTRIN LINT: PASS` (30 yüzeyin hepsi 9 clause taşıyor).
FAIL varsa o yüzeye madde eklenmemiştir — **commit etme**, önce düzelt.

- [ ] **Step 7: EKLENECEKKITAPLAR checklist'ini işaretle**

`EKLENECEKKITAPLAR.md` §7'de şu maddeleri `[x]` yap:

```markdown
- [x] `bilgi-tabani/hukuki-yontem-kontrol-listesi.md` üret (sayfa referanslı)
- [x] `ajanlar/arastirmaci/SKILL.md` → "Yorum Yöntemi Protokolü" bölümü ekle
- [x] `prompts/_doktrin-preamble.md` → 9. clause "Çıkarım geçerliliği"
- [x] `scripts/doktrin_contract.py` → clause token listesini 9'a çıkar
- [x] `python scripts/doktrin_lint.py` çalıştır — tüm prompt yüzeyleri PASS vermeli
- [x] 16 muhakeme prompt + 5 perspektif ajanı + arastir/blog komutlarındaki inline preamble'ları güncelle
- [x] `playbook/` şablonuna olay çözüm yol haritası iskeleti
```

- [ ] **Step 8: Tek commit**

```bash
git add -A
git commit -m "feat(doktrin): 9. clause - cikarim gecerliligi (30 yuzey tek commit)

Doktrin bugune kadar KAYNAGIN gercekligini denetliyordu; bu madde CIKARIMIN
kendisini denetler. Kaynak gercek olsa dahi ondan cikarilan sonuc gecersizse
HARD FAIL: baglam kaymasi, mesru olmayan genelleme, caiz olmayan kiyas.

Sistemik gerekce: 2026-05-05 Tugba 2026-89. Kunye sahte degildi;
IIK 89/4 baglamindaki cevap 89/3'e tasinmisti.

REQUIRED_CLAUSE_TOKENS 8 -> 9. Tum 30 doktrin yuzeyi ayni commit'te
guncellendi (bolunmez adim - spec 3.4.6). doktrin_lint PASS.
Yontem kaynagi: bilgi-tabani/hukuki-yontem-kontrol-listesi.md (Polat, Bolum 2)

Scope-risk: high - tum doktrin yuzeyleri degisti
Confidence: high - lint + 34 test PASS ile dogrulandi

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

# FAZ 5 — DENETCI Ajanı + Tek Motor Akışı

### Task 5.1: DENETCI ajanının kanonik tanımı

**Files:**
- Create: `ajanlar/denetci/SKILL.md`

- [ ] **Step 1: SKILL dosyasını yaz**

`ajanlar/denetci/SKILL.md`:

```markdown
# DENETCI — Bağımsız Çıktı Denetimi

**Rol:** `config/motor-haritasi.json` → `roller.DENETCI`
**Spec:** `docs/superpowers/specs/2026-09-02-tek-motor-agnostik-toparlama-design.md` §3.3

## Neden var

Sistem tek motorla çalışır. Doktrinin bel kemiği, çıktıyı üreten gözden **başka bir
gözün** denetlemesidir. Bu bağımsızlık artık "başka sağlayıcı"dan değil
**"başka bağlam"dan** gelir: DENETCI, çıktının nasıl üretildiğini görmez.

## Dürüst sınır

Aynı modelin kendi çıktısını denetlemesi, farklı sağlayıcının denetiminden
**zayıftır** — sistematik kör noktalar paylaşılır. Bu yüzden DENETCI *kanaate* değil
**ölçüme** dayanır. Yakalamayı taahhüt ettiği şey "kötü hukuk" değil:

- uydurma künye
- bozuk/uydurma alıntı
- eksik doktrin clause'u
- bağlam kayması ve geçersiz çıkarım (9. clause)
- KVKK sızıntısı ve TBB yasak ifadeleri

**Hukuki isabet denetimi avukattadır.** Sistem taslak üretir.

## Girdi sözleşmesi

DENETCI'ye **yalnızca** şunlar verilir:

```
Denetlenecek dosya: <mutlak yol>
Dava-ID: <dava-id>
```

Üretim bağlamı, taslak sürümleri, "şunu şöyle yazdım çünkü..." açıklamaları
**verilmez**. Verilirse bağımsızlık kaybolur ve denetim geçersizdir.

## Denetim sırası (bağlayıcı)

1. **Deterministik kapılar** — önce makine, sonra muhakeme:
   ```bash
   python scripts/cikti_dogrula.py <dosya> --dict <dava-id>
   python scripts/quality_gate.py <asama>
   ```
2. **Künye içerik teyidi** — çıktıdaki her `documentId` için:
   - `ictihat_getir(documentId)` ile kararı **yeniden çek**
   - Tırnak içi alıntıyı kaynakla karakter karakter kıyasla
   - Künyenin (daire, tarih, esas/karar no) kaynakla uyuştuğunu doğrula
   - Bağlamın uyuştuğunu doğrula (hangi fıkra/madde hakkında?)
3. **Doktrin clause sayımı** — 9 clause ve Kaynak Doğrulama Tablosu grameri
4. **Çıkarım denetimi (9. clause)** — `bilgi-tabani/hukuki-yontem-kontrol-listesi.md`
   dört sorusu: yorum yöntemi, kıyas/a contrario, boşluk/bilinçli susma, genelleme
5. **Aleyhe beyanı** — "Aleyhe içtihat: VAR/YOK/ARANMADI" var mı; YOK deniyorsa
   gerçekten aranmış mı

## Karar

| Karar | Koşul | Sonuç |
|---|---|---|
| **KIRMIZI** | Doğrulanamayan künye ≥1, uydurma alıntı, eksik clause, KVKK sızıntısı | Çıktı Drive'a **YAZILMAZ**; ORKESTRATOR revize eder |
| **SARI** | Format/üslup ihlali, eksik aleyhe beyanı, zayıf gerekçe | Düzeltilir, yeniden denetlenir |
| **YEŞİL** | Tüm kapılar temiz | Çıktı Drive'a yazılır |

En çok **3 tur**. Üçüncü turda YEŞİL yoksa avukata escalate edilir; çıktı yazılmaz.

## Çıktı biçimi

```markdown
## DENETİM SONUCU: <KIRMIZI|SARI|YEŞİL>

**Denetlenen:** <dosya>
**Deterministik kapılar:** cikti_dogrula <PASS/FAIL> · quality_gate <PASS/FAIL>

### Künye teyidi
| documentId | Künye uyumu | Alıntı uyumu | Bağlam uyumu |
|---|---|---|---|

### Bulgular
1. [severity] <bulgu> — <dosya:satır> — <ne yapılmalı>

### Gerekçe
<KIRMIZI/SARI ise neden; YEŞİL ise hangi kapıların geçtiği>
```

## Motor-bağımsız çağrılış

| Ortam | Yöntem |
|---|---|
| Alt-ajan mekanizması olan araç | Sıfır bağlamlı alt-ajan (`ajanlar/denetci/SKILL.md` + girdi sözleşmesi) |
| Alt-ajanı olmayan araç | İkinci oturum/sekme; yalnızca dosya yolu + dava-id verilir |
| Hiçbiri yok | Avukat yeni sohbette `denetle: <dosya>` komutunu elle çalıştırır |

Hangi yol kullanıldıysa denetim çıktısına yazılır.
```

- [ ] **Step 2: Kapıları çalıştır**

```bash
python scripts/vendor_lint.py ajanlar/denetci/SKILL.md
python scripts/referans_kontrol.py ajanlar/denetci/SKILL.md | tail -2
```

Beklenen: her ikisi temiz.

- [ ] **Step 3: Commit**

```bash
git add ajanlar/denetci/SKILL.md
git commit -m "feat(denetci): bagimsiz cikti denetimi ajaninin kanonik tanimi

Tek motorda bagimsizlik 'baska saglayici'dan degil 'baska baglam'dan gelir:
DENETCI uretim baglamini GORMEZ, yalniz dosya yolu + dava-id alir.
Kanaate degil olcume dayanir: deterministik kapilar + her documentId'nin
MCP'den yeniden cekilmesi + alinti kiyasi.

Durust sinir SKILL'e yazildi: ayni model kendini denetlerken sistematik kor
noktalar paylasilir; hukuki isabet denetimi avukattadir.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5.2: Araç adaptörü — alt-ajan tanımı

**Files:**
- Create: `.claude/agents/denetci.md`

- [ ] **Step 1: İnce stub yaz**

`.claude/agents/denetci.md`:

```markdown
---
name: denetci
description: Sıfır bağlamlı bağımsız çıktı denetimi. Hukuki çıktı üretildikten sonra ÜRETİM BAĞLAMINI GÖRMEDEN denetler; künyeleri MCP'den yeniden çeker, alıntıları kıyaslar, deterministik kapıları çalıştırır, KIRMIZI/SARI/YEŞİL karar verir.
tools: Read, Bash, Grep, Glob, Write
---

Kanonik tanım: `ajanlar/denetci/SKILL.md` — **önce onu oku, sonra uygula.**

Sana yalnızca denetlenecek dosyanın yolu ve dava-id verilir. Çıktının nasıl
üretildiğini sormayacaksın; bağımsızlığın buradan gelir.

Denetim sırası bağlayıcıdır: deterministik kapılar → künye içerik teyidi →
doktrin clause sayımı → çıkarım denetimi (9. clause) → aleyhe beyanı.

KIRMIZI kararda çıktı Drive'a YAZILMAZ.
```

- [ ] **Step 2: Doktrin lint kapsamını kontrol et**

```bash
python scripts/doktrin_lint.py | tail -3
```

`.claude/agents/denetci.md` lint hedef listesinde **değildir** (perspektif ajanları
gibi hukuki üretim yapmaz, denetler). PASS beklenir.

- [ ] **Step 3: Commit**

```bash
git add .claude/agents/denetci.md
git commit -m "feat(adaptor): denetci alt-ajan tanimi (Claude Code adaptoru)

Ince stub - kanonik tanim ajanlar/denetci/SKILL.md'de.
Baska araclarda ayni SKILL ikinci oturum veya elle 'denetle:' komutuyla calisir.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5.3: AGENTS.md — tek motor akışını yaz

**Files:**
- Modify: `AGENTS.md` (Task 1.2 Step 2'de bırakılan "Motor Mimarisi" yer tutucusu)

- [ ] **Step 1: Yer tutucuyu bul**

```bash
grep -n "Bu bölüm Faz 5'te" AGENTS.md
```

- [ ] **Step 2: Yer tutucuyu gerçek bölümle değiştir**

```markdown
## Motor Mimarisi — Tek Motor + Bağımsız Denetim

Sistem **tek motorla** çalışır: oturumu hangi LLM ile açtıysanız o. Sistem bunu
tahmin etmez; avukat `motor: <ad>` komutuyla bildirir
(`python scripts/motor.py ayarla <ad>`), çıktı frontmatter'ı bunu damgalar.
Bildirilmemişse `engine: bildirilmedi` yazılır.

### Roller

| Rol | İş |
|---|---|
| `ORKESTRATOR` | Komut sınıflandırma, ASAMA geçişleri, kalite kapıları, Drive/Gmail/Takvim, DOCX/UDF üretimi |
| `ARASTIRMACI` | MCP çağrıları (2B Yargı, 2C Mevzuat, 2D NotebookLM, MemPalace) |
| `MUHAKEME` | Usul, 5-ajan analiz, dilekçe, savunma simülasyonu, revizyon, blog |
| `DENETCI` | Sıfır bağlamlı bağımsız çıktı denetimi |

Rol tanımları: `config/motor-haritasi.json`. Dördü de aynı motorda çalışır;
ayrım **görev ayrımıdır**, motor ayrımı değil.

### Akış

ASAMA 0'dan 7'ye kesintisiz ilerlenir. Elle devir bloğu, kopya-yapıştırma ve
harici panel **yoktur**. Her hukuki çıktıdan sonra:

```
ORKESTRATOR / MUHAKEME : ASAMA N çıktısını üretir
        |
        v
DENETCI çağrılır — ÜRETİM BAĞLAMINI GÖRMEZ
   girdi : { çıktı dosyası yolu, dava-id }
   yapar : deterministik kapılar -> künye içerik teyidi (MCP'den yeniden çekim)
           -> doktrin clause sayımı -> çıkarım denetimi (9. clause) -> aleyhe beyanı
   döner : KIRMIZI / SARI / YEŞİL
        |
        v
   YEŞİL değil -> ORKESTRATOR revize eder -> DENETCI yeniden (en çok 3 tur)
   3 turda YEŞİL yoksa -> avukata escalate; çıktı Drive'a YAZILMAZ
```

Protokol: `ajanlar/denetci/SKILL.md`

### Dürüst sınır

Aynı motorun kendi çıktısını denetlemesi, farklı sağlayıcının denetiminden
zayıftır; sistematik kör noktalar paylaşılır. DENETCI bu yüzden kanaate değil
ölçüme dayanır. Yakaladığı şey uydurma künye, bozuk alıntı, eksik clause ve
geçersiz çıkarımdır — **hukuki isabet denetimi avukattadır.**

### Kullanıcı kontrol komutları

`devam` · `atla` · `dur` · `devam et` · `motor: <ad>` · `denetle: <dosya>`
```

- [ ] **Step 3: Fazla kalan devir bloğu atıflarını temizle**

```bash
grep -n "devir bloğu\|devir blogu\|BATCH\|yapıştır" AGENTS.md ajanlar/*/SKILL.md
```

Çıkan her yeri tek motor akışına göre düzelt. Tarihçe cümlesi ise
`<!-- vendor-ok: tarihçe kaydı -->` ile işaretle.

- [ ] **Step 4: Bütün kapıları çalıştır**

```bash
python scripts/doktrin_lint.py | tail -3
python scripts/vendor_lint.py | tail -3
python scripts/referans_kontrol.py | tail -3
python -m pytest scripts/tests -q
```

Beklenen: hepsi PASS/temiz.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(mimari): tek motor akisi + DENETCI kapisi AGENTS.md'ye yazildi

Elle devir blogu, kopya-yapistirma ve harici panel kaldirildi.
ASAMA 0-7 kesintisiz; her cikti sonrasi sifir baglamli DENETCI.
KIRMIZI kararda cikti Drive'a yazilmaz; 3 turda yesil yoksa avukata escalate.

Durust sinir AGENTS.md'ye de yazildi: ayni motorun kendini denetlemesi
farkli saglayici denetiminden zayiftir; hukuki isabet avukatta.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5.4: Uçtan uca deneme (kabul kriteri 5)

**Files:**
- Create: `tmp/denetci-deneme/sahte-cikti.md` (commit edilmez)

- [ ] **Step 1: Bilerek kusurlu bir çıktı hazırla**

`tmp/denetci-deneme/sahte-cikti.md` — **doğrulanamayacak bir künye** içermeli:

```markdown
---
engine: bildirilmedi
task_type: deneme
status: TASLAK
---

# Deneme Çıktısı

Yargıtay 9. HD T.01.01.2024 E.2024/99999 K.2024/99999 kararında
«bu cümle kaynakta yoktur» denilmiştir.
```

- [ ] **Step 2: DENETCI'yi çağır**

Alt-ajan olarak, **yalnızca** şu girdiyle:

```
Denetlenecek dosya: tmp/denetci-deneme/sahte-cikti.md
Dava-ID: deneme-2026-000
```

- [ ] **Step 3: Sonucu doğrula**

Beklenen: **KIRMIZI**. Gerekçeler arasında en az şunlar olmalı:
- Kaynak Doğrulama Tablosu yok
- "Aleyhe içtihat:" beyanı yok
- `E.2024/99999` künyesi MCP'de doğrulanamadı
- Doktrin clause'ları eksik

KIRMIZI gelmezse DENETCI tanımı eksiktir — `ajanlar/denetci/SKILL.md` denetim
sırasına dönülüp düzeltilir.

- [ ] **Step 4: Sonucu kayda geç**

`dersler/sistem.md` sonuna ekle:

```markdown
## 2026-09-02 — DENETCI kapısı uçtan uca doğrulandı

**KAÇIRILAN:** Tek motora geçişte "bağımsız denetim" iddiasının gerçekten
çalıştığı gösterilmemişti.
**DÜZELTME:** Bilerek doğrulanamaz künye içeren sahte çıktı DENETCI'ye verildi;
KIRMIZI döndü ve çıktı yazılmadı.
**KURAL ADAYI:** Denetim mekanizması değiştiğinde sahte-kusurlu çıktı ile
uçtan uca denenmeden canlıya alınmaz.
```

- [ ] **Step 5: Commit**

```bash
git add dersler/sistem.md
git commit -m "test(denetci): uctan uca deneme - KIRMIZI karar dogrulandi

Bilerek dogrulanamaz kunye iceren sahte cikti DENETCI'ye verildi.
Sonuc KIRMIZI; cikti Drive'a yazilmadi. Kabul kriteri 5 karsilandi.
Ders dersler/sistem.md'ye islendi.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

# FAZ 6 — DavaTek Keşif (en düşük öncelik)

> Bu faz avukatın DavaTek'i kurup bir dava indirmesini bekler. Kod yazılmaz.
> Entegrasyon (evrak kaynağı adaptörü + fark takibi → Takvim köprüsü) ayrı bir
> spec ile FAZ 2'de planlanacaktır.

### Task 6.1: Keşif formunu hazırla

**Files:**
- Create: `docs/davatek-kesif.md`

- [ ] **Step 1: Formu yaz**

`docs/davatek-kesif.md`:

```markdown
# DavaTek Keşif Notu

**Durum:** KURULUM BEKLENİYOR
**Spec:** `docs/superpowers/specs/2026-09-02-tek-motor-agnostik-toparlama-design.md` §3.5

## Bilinenler (2026-09-02 araştırması)

- TBB'nin resmî masaüstü uygulaması; Windows ve macOS; ücretsiz
- UYAP Avukat Portal'dan dava dosyalarını **yerel diske** indirir
- Fark takibi: yerel kayıt ile Portal karşılaştırması, toplu işlem, Excel export
- Toplu icra sorgusu: MERNİS / SGK / GİB / banka
- Erişim: UYAP kimliği + SMS + e-imza
- **Public API yok**; veri yalnızca yerel cihazda
- Otomatik yenileme yok (elle güncelleme); OCR katmanı olmayan taranmış
  evrakta metin araması çalışmaz
- Eşzamanlı çok cihaz kullanımı UYAP kısıtı nedeniyle mümkün değil

## Doldurulacak (kurulumdan sonra)

| Soru | Cevap |
|---|---|
| Veri klasörünün mutlak yolu | |
| Dava klasörü adlandırma şeması | |
| Evrak dosyası adlandırma şeması | |
| Evrak formatları (.udf / .pdf / .tiff oranı) | |
| Bir INDEX/manifest dosyası üretiyor mu | |
| Fark raporu Excel sütunları | |
| Fark raporu nereye kaydediliyor | |
| Yerel veritabanı var mı (SQLite vb.), yolu | |
| Toplu sorgu çıktısının formatı | |

## Mevcut hattımızla karşılaştırma

Bugünkü UYAP hattı `dava-cli` (Yargı PRO):
`Documents/YargiPRO/Hukuk/{mahkeme}/{dosya}/{evraklar,cikti}`

DavaTek ikinci bir **evrak kaynağı** olacak. AGENTS.md'de tanımlı "evrak kaynağı
adaptörü" kavramında bugün tek adaptör `dava-cli`'dir; DavaTek slotu boştur.

## Sonraki adım

Yukarıdaki tablo dolduğunda ayrı bir spec yazılır:
- `scripts/evrak_kaynagi.py` — kaynak adaptörü (dava-cli | davatek)
- fark takibi → Takvim MCP köprüsü (yeni evrak/duruşma/tebligat → süre kaydı)
```

- [ ] **Step 2: AGENTS.md'ye evrak kaynağı adaptörü kavramını ekle**

ASAMA 1 kaynak sorgulama bölümüne ekle:

```markdown
**Evrak kaynağı adaptörü:** Dava evrakı birden çok kaynaktan gelebilir. Bugün tek
adaptör `dava-cli` (Yargı PRO / UYAP). DavaTek slotu boştur — keşif notu:
`docs/davatek-kesif.md`. Hangi kaynak kullanıldıysa `00-Briefing.md` içine yazılır.
```

- [ ] **Step 3: Doğrula ve commit**

```bash
python scripts/referans_kontrol.py | tail -3
git add docs/davatek-kesif.md AGENTS.md
git commit -m "docs(davatek): kesif notu + evrak kaynagi adaptoru kavrami

DavaTek'in public API'si yok; entegrasyon yalniz dosya sistemi uzerinden mumkun.
Kesif formu avukatin kurulumunu bekliyor; kod yazilmadi.
AGENTS.md'ye evrak kaynagi adaptoru kavrami eklendi (bugun tek adaptor dava-cli).

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

# Kapanış — Kabul Kriterlerinin Doğrulanması

### Task 7.1: Spec kabul kriterlerini tek tek geçir

- [ ] **Step 1: Tüm kapıları çalıştır**

```bash
python scripts/doktrin_lint.py        | tail -3
python scripts/vendor_lint.py         | tail -3
python scripts/referans_kontrol.py    | tail -3
python scripts/protokol_kontrol.py ajanlar/director/olay-cozum-protokolu.md | tail -3
python scripts/paths.py check
python -m pytest scripts/tests -q
```

- [ ] **Step 2: Kriterleri tek tek doğrula**

| # | Kriter | Komut / kontrol |
|---|---|---|
| 1 | Kökte 6 kanonik dosya + 3 stub, kırık referans yok | `ls` + `referans_kontrol.py` |
| 2 | AGENTS.md'de rol tanımı olarak sağlayıcı adı yok | `vendor_lint.py AGENTS.md` |
| 3 | doktrin_lint 9 clause ile PASS | `doktrin_lint.py` |
| 4 | Yollar çözümleniyor | `paths.py check` |
| 5 | DENETCI kapısı KIRMIZI'da yazımı engelliyor | Task 5.4 kaydı |
| 6 | 306 sayfa OCR + şüpheli sayfalar işaretli | `tmp/nosyon-ocr/00-OZET.md` |
| 7 | Okuma notları 3 bölümü kapsıyor, her kayıt `[s. NNN]` | `grep -c "\[s\. " bilgi-tabani/nosyon-okuma-notlari.md` |
| 8 | Protokolün her adımı etiketli | `protokol_kontrol.py` |
| 9 | Teyit turu yapıldı | protokol sonundaki "Teyit kaydı" bölümü |
| 10 | ASAMA 1 yüzeyleri protokole bağlı | `grep -l olay-cozum-protokolu AGENTS.md sablonlar/*.md ajanlar/director/SKILL.md playbook/_sablon.md` |
| 11 | Yöntem kontrol listesi sayfa referanslı | `grep -c "\[s\. " bilgi-tabani/hukuki-yontem-kontrol-listesi.md` |
| 12 | Kitabın OCR tam metni repoda yok | `git ls-files \| grep -i nosyon` → boş |
| 13 | DavaTek keşif notu var | `ls docs/davatek-kesif.md` |

- [ ] **Step 3: Sonucu spec'e işle**

Spec dosyasının sonuna ekle:

```markdown
---

## Uygulama Kaydı

**Tamamlanma:** <tarih>
**Plan:** `docs/superpowers/plans/2026-09-02-tek-motor-agnostik-toparlama.md`
**Kabul kriterleri:** 13/13 doğrulandı — <kısa not: sapma varsa yaz>
```

- [ ] **Step 4: Kapanış ritüeli (dersler döngüsü)**

`AGENTS.md`'deki Dersler Döngüsü Kural 1 gereği avukata sor:

> "Bu işte ben neyi kaçırdım / sen neyi düzelttin? (yoksa 'yok' de)"

Cevabı `dersler/sistem.md`'ye 3 satırlık formatta (KAÇIRILAN / DÜZELTME /
KURAL ADAYI) ekle.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "docs(spec): uygulama kaydi - 13 kabul kriteri dogrulandi

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Plan Öz-Denetimi (2026-09-02)

**1. Spec kapsamı:** 13 kabul kriterinin her biri bir görevle eşleşiyor —
kriter 1→Task 1.3/1.5, 2→Task 2.4, 3→Task 4.3, 4→Task 7.1, 5→Task 5.4,
6→Task 0.1, 7→Task 3.2, 8→Task 3.3/3.4, 9→Task 3.5, 10→Task 3.6,
11→Task 4.1, 12→Task 0.1 Step 5, 13→Task 6.1.

**2. Placeholder taraması:** Doldurulacak alanlar yalnızca **çalışma zamanında
ölçülecek değerlerdir** (OCR şüpheli sayfa listesi, sayfa eşleme kayması, sızıntı
listesi). Bunlar plan boşluğu değil, ölçüm çıktısıdır; her birinin nasıl elde
edileceği komutla verilmiştir.

**3. Tip/isim tutarlılığı:** Fonksiyon adları görevler arasında tutarlı —
`kirik_referanslar`/`tara` (Task 1.1), `aktif_motor`/`motor_ayarla`/
`frontmatter_damgasi` (Task 2.1), `sizintilar`/`hedefler` (Task 2.3),
`etiketsiz_adimlar` (Task 3.3). Rol adları her yerde `ORKESTRATOR`/`ARASTIRMACI`/
`MUHAKEME`/`DENETCI`. Clause token her yerde `ÇIKARIM GEÇERLİLİĞİ`.

**4. Bilinen risk:** Task 4.3 bölünmezdir; 30 yüzey aynı commit'te güncellenmezse
sistem çalışmaz. Task 1.4 de bölünmezdir (taşıma + lint yüzey listesi birlikte).

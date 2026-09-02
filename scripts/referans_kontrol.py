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

# ASAMA çıktısı olarak ÇALIŞMA ANINDA üretilen dosyalar. Repoda bulunmamaları
# doğrudur; dokümanlar bunlara "üretilecek dosya" olarak atıf yapar.
CALISMA_ANI_CIKTILARI = {
    "atif-maddeleri.json",
    "mulga-eleme.json",
    "current-run-id.txt",
    "00-Briefing.md",
    "00-Talep.md",
    "usul-raporu.md",
    "arastirma-raporu.md",
    "arastirma-cevabi.md",
    "stratejik-analiz.md",
    "savunma-simulasyonu.md",
    "dilekce-v1.md",
    "dilekce-v2.md",
    "dilekce-v3.md",
    "evrak-listesi.md",
    "adliye-dogrulama.md",
    "blog.md",
    "blog.cms.md",
    "blog.mail.md",
    "model-events.jsonl",
}

# Çalışma anı çıktılarının ad desenleri (liste sonsuza uzamasın diye)
CIKTI_DESENLERI = (
    "-raporu.md",       # revizyon-raporu.md, bilirkisi-denetim-raporu.md
    "-dilekcesi.md",    # istinaf-dilekcesi.md, temyiz-dilekcesi.md
    "-notlari.md",      # kontrol-notlari.md
    "dilekce-v",        # dilekce-v2.final.md, dilekce-v1.claude-v1.md
    "usul-raporu.",     # usul-raporu.antigravity-v1.md
)

# İleriye dönük dokümanlar: henüz var olmayan dosyaları tasarım gereği anarlar
TARAMA_DISI_KLASORLER = ("arsiv/", "isbu-ofis/", "docs/superpowers/")

# Basename dizini bir kez kurulur (kok -> {dosya adı})
_BASENAME_ONBELLEK: dict[str, set[str]] = {}


def _basename_dizini(kok: Path) -> set[str]:
    """Repo altındaki tüm dosya adları (arsiv ve node_modules hariç)."""
    anahtar = str(kok)
    if anahtar in _BASENAME_ONBELLEK:
        return _BASENAME_ONBELLEK[anahtar]
    adlar: set[str] = set()
    for p in kok.rglob("*"):
        parcalar = p.parts
        if "node_modules" in parcalar or ".git" in parcalar or "arsiv" in parcalar:
            continue
        if p.is_file():
            adlar.add(p.name)
    _BASENAME_ONBELLEK[anahtar] = adlar
    return adlar


def _normalize(ham: str) -> str:
    """Referans metnini yola çevirir: @ öneki ve ./ öneki temizlenir."""
    yol = ham.strip()
    if yol.startswith("@"):
        yol = yol[1:]
    if yol.startswith("./"):
        yol = yol[2:]
    return yol


def _aday_mi(yol: str) -> bool:
    """Normalize edilmiş metin, repo içi bir dosya yoluna benziyor mu."""
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
    # Çıplak uzantı (`.md`) dosya adı değildir — Path(".md").suffix boştur
    if not Path(yol).suffix:
        return False
    ad = Path(yol).name
    if ad in CALISMA_ANI_CIKTILARI:
        return False
    if any(ad.endswith(k) or ad.startswith(k) for k in CIKTI_DESENLERI):
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
        yol = _normalize(ham)
        if not _aday_mi(yol):
            continue
        if (kok / yol).exists():
            continue
        # dosyaya göreceli de olabilir
        if (dosya.parent / yol).exists():
            continue
        # Kısaltılmış atıf: dosya adı repoda başka bir yerde duruyorsa kırık değil.
        # (Taşınan dosyanın adı değişirse bu kontrol yine yakalar — Faz 1'in amacı budur.)
        if Path(yol).name in _basename_dizini(kok):
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
            try:
                anahtar = d.relative_to(kok).as_posix()
            except ValueError:
                anahtar = str(d)
            sonuc[anahtar] = kirik
    return sonuc


def takipli_markdownlar() -> list[Path]:
    """git ls-files ile takipli .md dosyaları (arsiv/ ve isbu-ofis/ hariç)."""
    cikti = subprocess.run(
        ["git", "ls-files", "*.md"], cwd=ROOT, capture_output=True, text=True, check=True
    ).stdout.splitlines()
    return [ROOT / p for p in cikti if not p.startswith(TARAMA_DISI_KLASORLER)]


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

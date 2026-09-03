#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""vendor_lint.py — kanonik yüzeylerde sağlayıcı adı sızıntısı kapısı.

Sistem motor-bağımsızdır: anayasa, ajan protokolleri ve prompt yüzeyleri belirli
bir sağlayıcının adına değil ROLE dayanır (spec kabul kriteri 2).

Tarihçe kaydı veya araç adaptörü bağlamında sağlayıcı adı geçmesi meşrudur;
o satır `<!-- vendor-ok: <gerekçe> -->` ile işaretlenir. İşaretsiz her geçiş FAIL.

`.claude/`, `.gemini/`, `.codex/` gibi ARAÇ ADAPTÖRÜ DİZİN YOLLARI sızıntı sayılmaz
(nokta ile başlayan yol parçası).

Kullanım:
  python scripts/vendor_lint.py              # kanonik yüzeyleri tara
  python scripts/vendor_lint.py AGENTS.md    # belirli dosyalar
exit 0 = temiz, 1 = sızıntı var.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

SAGLAYICILAR = ["Claude", "Gemini", "Antigravity", "Codex", "GPT", "OpenAI", "Anthropic"]
MUAFIYET = "vendor-ok:"

# Kanonik yüzeyler: motor-nötr olması ZORUNLU dosyalar
HEDEF_GLOBLAR = [
    "AGENTS.md",
    "README.md",
    "legal.local.md",
    "dilekce-yazim-kurallari.md",
    "ajanlar/**/*.md",
    "prompts/**/*.md",
    "playbook/*.md",
    "config/motor-haritasi.json",
]

# Araç adaptörü dizinleri ve tarihçe: doğası gereği sağlayıcı adını taşır, kapsam dışı
KAPSAM_DISI = (".claude/", ".gemini/", ".codex/", ".cursor/", "arsiv/", "docs/superpowers/",
               "isbu-ofis/", "dersler/")

# Kelime sınırı + "nokta ile başlayan yol parçası değil" (.claude/ → adaptör yolu)
_DESENLER = {ad: re.compile(rf"(?<![\w.]){re.escape(ad)}(?![\w])", re.IGNORECASE)
             for ad in SAGLAYICILAR}


def sizintilar(dosya: Path) -> list[tuple[int, str]]:
    """(satır_no, sağlayıcı) çiftleri; muaf satırlar hariç."""
    try:
        satirlar = dosya.read_text(encoding="utf-8").splitlines()
    except (OSError, UnicodeDecodeError):
        return []
    bulgular: list[tuple[int, str]] = []
    for no, satir in enumerate(satirlar, start=1):
        if MUAFIYET in satir:
            continue
        for ad, desen in _DESENLER.items():
            if desen.search(satir):
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
            try:
                rel = d.relative_to(ROOT).as_posix()
            except ValueError:
                rel = d.name
            print(f"[SIZINTI] {rel}:{no} -> {ad}")
            toplam += 1
    print()
    if toplam:
        print(f"VENDOR LINT: FAIL ({toplam} işaretsiz sağlayıcı adı)")
        print("Düzeltme: rol adıyla değiştir, ya da tarihçe ise satır sonuna")
        print("          <!-- vendor-ok: <gerekçe> --> ekle.")
        return 1
    print(f"VENDOR LINT: TEMİZ ({len(dosyalar)} dosya tarandı)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))

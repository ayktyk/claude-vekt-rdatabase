#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""protokol_kontrol.py — olay çözüm protokolü etiket kapısı.

Spec 3.4.3 bağlayıcı kuralı: protokoldeki her adım ya kitaptan sayfa referanslıdır
(`[s. NNN]` / `[pdf s. NNN]`), ya da açıkça `[SİSTEM EKİ]` etiketlidir.

Neden: kitaba dayanmayan bir adımı kitaba atfetmek, 0-halüsinasyon doktrininin
ihlalidir. Etiketsiz adım = kaynağı belirsiz iddia -> FAIL.

Adım = H3 başlık (### ile başlayan satır). Kod bloğu içindeki satırlar sayılmaz
(protokol içinde örnek şablon gösterilebilir).

Kullanım:
  python scripts/protokol_kontrol.py ajanlar/director/olay-cozum-protokolu.md
exit 0 = temiz, 1 = etiketsiz adım var.
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
    """Etiket taşımayan H3 adım başlıkları: (satır_no, başlık)."""
    try:
        satirlar = dosya.read_text(encoding="utf-8").splitlines()
    except (OSError, UnicodeDecodeError):
        return []

    bulgular: list[tuple[int, str]] = []
    kod_blogunda = False
    for no, satir in enumerate(satirlar, start=1):
        if satir.lstrip().startswith("```"):
            kod_blogunda = not kod_blogunda
            continue
        if kod_blogunda:
            continue
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
        print(f"PROTOKOL KONTROL: FAIL ({hata} etiketsiz adım)")
        print("Her adım ya [s. NNN] sayfa referansı ya [SİSTEM EKİ] taşımalı.")
        return 1
    print("PROTOKOL KONTROL: TEMİZ — her adım etiketli")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""havuz_kontrol.py — ara çıktılarda künye havuzu ve alıntı kontrolü (deterministik).

Denetim Politikası (AGENTS.md "DENETCI Kapısı ve Denetim Politikası"): ara çıktılar
(usul raporu, stratejik analiz, dilekçe v1, savunma simülasyonu) yalnız K1'den geçmiş
araştırma raporunun Kaynak Doğrulama tablosundaki künye ve alıntılara dayanabilir.
Bu betik o kuralı mekanik olarak zorlar:

  1. Ara çıktının Kaynak Doğrulama tablosundaki her documentId havuzda olmalı.
     Havuzda olmayan satır "DOĞRULANMAMIŞ" veya "HAVUZ DIŞI" damgası taşıyorsa uyarı,
     taşımıyorsa HATA.
  2. Ara çıktıdaki her «…» alıntı, havuzdaki bir "Tam Alıntı" hücresinin içinde
     geçmeli (boşluk/tırnak farkları yok sayılır; "…" ile bölünmüş alıntının her
     parçası aynı havuz alıntısında aranır). Geçmiyorsa HATA — uydurma alıntı riski.

Bu kapı documentId'nin gerçekliğini doğrulamaz (o K1'de DENETCI'nin işidir); yalnız
ara çıktının havuzun dışına çıkmadığını denetler.

Kullanım:
  python scripts/havuz_kontrol.py <ara-cikti.md> --havuz <arastirma-raporu.md> [--havuz <kunye-havuzu-ek.md>]
exit 0 = PASS (uyarılar olabilir), 1 = FAIL, 2 = kullanım/okuma hatası.
"""
from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

ALINTI_RE = re.compile(r"«([^»]+)»")
DAMGALAR = ("DOĞRULANMAMIŞ", "DOGRULANMAMIS", "HAVUZ DIŞI", "HAVUZ DISI",
            "DOĞRULANMASI GEREK", "DOGRULANMASI GEREK")  # .upper() İ/I farkı için kök biçim
BOS_HUCRE = {"", "—", "-", "–", "yok", "YOK"}
_TIPOGRAFIK = str.maketrans({"’": "'", "‘": "'", "“": '"', "”": '"', " ": " "})


@dataclass
class Sonuc:
    hatalar: list[str] = field(default_factory=list)
    uyarilar: list[str] = field(default_factory=list)


def _normalize(metin: str) -> str:
    return " ".join(metin.translate(_TIPOGRAFIK).split()).casefold()


def _hucreler(satir: str) -> list[str]:
    govde = satir.strip()
    if govde.startswith("|"):
        govde = govde[1:]
    if govde.endswith("|"):
        govde = govde[:-1]
    return [h.strip() for h in re.split(r"(?<!\\)\|", govde)]


def tablo_satirlari(metin: str) -> list[dict]:
    """documentId sütunu olan tabloların satırlarını {sütun: değer} olarak döndürür."""
    satirlar: list[dict] = []
    basliklar: list[str] | None = None
    for satir in metin.splitlines():
        if not satir.strip().startswith("|"):
            basliklar = None
            continue
        hucreler = _hucreler(satir)
        anahtarlar = [h.casefold() for h in hucreler]
        if any("documentid" in a for a in anahtarlar):
            basliklar = anahtarlar
            continue
        if basliklar is None or all(set(h) <= set("-: ") for h in hucreler):
            continue
        satirlar.append(dict(zip(basliklar, hucreler)))
    return satirlar


def _sutun(satir: dict, anahtar: str) -> str:
    for ad, deger in satir.items():
        if anahtar in ad:
            return deger
    return ""


def havuz_oku(yollar: list[Path]) -> tuple[set[str], list[str]]:
    kimlikler: set[str] = set()
    alintilar: list[str] = []
    for yol in yollar:
        for satir in tablo_satirlari(yol.read_text(encoding="utf-8")):
            kimlik = _sutun(satir, "documentid").strip("` ")
            if kimlik not in BOS_HUCRE:
                kimlikler.add(kimlik)
            alinti = _sutun(satir, "alıntı") or _sutun(satir, "alinti")
            parcalar = ALINTI_RE.findall(alinti) or ([alinti] if alinti not in BOS_HUCRE else [])
            alintilar.extend(_normalize(p) for p in parcalar if p.strip())
    return kimlikler, alintilar


def _alinti_havuzda(alinti: str, havuz_alintilari: list[str]) -> bool:
    parcalar = [p for p in re.split(r"\.\.\.|…", alinti) if len(_normalize(p)) >= 3]
    if not parcalar:
        return True
    return any(all(_normalize(p) in h for p in parcalar) for h in havuz_alintilari)


def kontrol(ara_cikti: Path, havuz_yollari: list[Path]) -> Sonuc:
    sonuc = Sonuc()
    kimlikler, havuz_alintilari = havuz_oku(havuz_yollari)
    metin = ara_cikti.read_text(encoding="utf-8")

    for satir in tablo_satirlari(metin):
        kimlik = _sutun(satir, "documentid").strip("` ")
        if kimlik in BOS_HUCRE or kimlik in kimlikler:
            continue
        damgali = any(d in " ".join(satir.values()).upper() for d in DAMGALAR)
        mesaj = f"havuz dışı künye: documentId {kimlik}"
        (sonuc.uyarilar if damgali else sonuc.hatalar).append(mesaj)

    for satir_metni in metin.splitlines():
        damgali = any(d in satir_metni.upper() for d in DAMGALAR)
        for alinti in ALINTI_RE.findall(satir_metni):
            if _alinti_havuzda(alinti, havuz_alintilari):
                continue
            mesaj = f"havuzda olmayan alıntı: «{alinti[:80]}»"
            (sonuc.uyarilar if damgali else sonuc.hatalar).append(mesaj)
    return sonuc


def main(argv: list[str]) -> int:
    for akim in (sys.stdout, sys.stderr):
        try:
            akim.reconfigure(encoding="utf-8")
        except (AttributeError, ValueError):
            pass
    ap = argparse.ArgumentParser(description="Ara çıktı künye havuzu ve alıntı kontrolü")
    ap.add_argument("ara_cikti")
    ap.add_argument("--havuz", action="append", required=True,
                    help="K1'den geçmiş araştırma raporu (+ varsa kunye-havuzu-ek.md)")
    args = ap.parse_args(argv)
    try:
        sonuc = kontrol(Path(args.ara_cikti), [Path(h) for h in args.havuz])
    except OSError as hata:
        print(f"HATA: {hata}", file=sys.stderr)
        return 2
    for uyari in sonuc.uyarilar:
        print(f"[UYARI] {uyari}")
    for hata in sonuc.hatalar:
        print(f"[FAIL] {hata}")
    if sonuc.hatalar:
        print("HAVUZ KONTROL: FAIL — ara çıktı K1 künye havuzunun dışına çıkmış.")
        return 1
    print(f"HAVUZ KONTROL: PASS ({len(sonuc.uyarilar)} uyarı)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))

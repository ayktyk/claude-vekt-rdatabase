#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""beceri_haritasi.py — Yargı PRO becerilerinin büro sistemindeki yeri.

Tek veri kaynağı: config/beceri-haritasi.json (107 beceri, içerik sürümü kayıtta).
Director bir aşamayı ya da bir iş hattını başlatırken hangi Yargı PRO becerisinin
YÖNTEM bölümünü uygulayacağını buradan okur (AGENTS.md "Beceri Haritası ve Büro İş Hatları").
Becerinin kendi zincir yönetimi uygulanmaz; sıra ve kapılar büronundur.

Kullanım:
  python scripts/beceri_haritasi.py asama <0-7|kapanis> [--kol hmk|iik|cmk|iyuk|aym|aihm] [--mod tam|hizli]
  python scripts/beceri_haritasi.py hat <hat-id>
  python scripts/beceri_haritasi.py hatlar
  python scripts/beceri_haritasi.py ara <metin>
  python scripts/beceri_haritasi.py kontrol
exit 0 = tamam, 1 = hata / bulunamadı.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VARSAYILAN = ROOT / "config" / "beceri-haritasi.json"

BECERI_SAYISI = 107
YERLER = ("asama", "kol-ailesi", "hat", "karsilik", "istege-bagli")
KOLLAR = ("ortak", "hmk", "iik", "cmk", "iyuk", "aym", "aihm")
KOL_ETIKETI = {"ortak": "Ortak", "hmk": "HMK", "iik": "İİK", "cmk": "CMK", "iyuk": "İYUK",
               "aym": "AYM", "aihm": "AİHM"}
ASAMA_DEGERLERI = {0, 1, 2, 3, 4, 5, 6, 7, "kapanis", "denetim"}
# Kola özgü ailenin hangi aşamada yöntem kaynağı olduğu (karar sonrası aile "karar" hattındadır)
AILE_ASAMA = {"emsal": 2, "analiz": 3, "dilekce": 5, "usul": 5, "karar-sonrasi": None}
AILE_NOTU = {"usul": "HIZLI moddaki usul ve ara belgede", "dilekce": "belge türüne göre",
             "emsal": "kolun emsal yöntemi", "analiz": "kolun dosya analizi"}


def yukle(yol: Path | None = None) -> dict:
    return json.loads(Path(yol or VARSAYILAN).read_text(encoding="utf-8"))


def _sira(ad: str) -> tuple[int, int]:
    parca = ad.split("-")
    return int(parca[0]), int(parca[1])


def _kol_normalize(kol: str | None) -> str:
    deger = (kol or "").strip().lower().replace("\u0307", "").replace("ı", "i")
    if deger and deger not in KOLLAR:
        raise ValueError(f"geçersiz kol: {kol!r} ({' | '.join(KOLLAR[1:])})")
    return deger


def kontrol(veri: dict) -> list[str]:
    """Haritanın bütünlüğünü denetler; hata listesi döndürür (boş = tamam)."""
    hatalar: list[str] = []
    beceriler = veri.get("beceriler", [])
    adlar = [b.get("ad", "") for b in beceriler]
    if len(adlar) != BECERI_SAYISI:
        hatalar.append(f"beceri sayısı {len(adlar)} (beklenen {BECERI_SAYISI})")
    tekrar = sorted({a for a in adlar if adlar.count(a) > 1})
    if tekrar:
        hatalar.append("tekrarlanan beceri: " + ", ".join(tekrar))
    hat_idleri = {h.get("id") for h in veri.get("hatlar", [])}
    for b in beceriler:
        ad = b.get("ad", "?")
        if b.get("kol") not in KOLLAR:
            hatalar.append(f"{ad}: geçersiz kol {b.get('kol')!r}")
        if b.get("yer") not in YERLER:
            hatalar.append(f"{ad}: geçersiz yer {b.get('yer')!r}")
        if not str(b.get("cumle", "")).strip():
            hatalar.append(f"{ad}: açıklama cümlesi yok")
        for deger in b.get("asama", []):
            if deger not in ASAMA_DEGERLERI:
                hatalar.append(f"{ad}: geçersiz aşama {deger!r}")
        for hat in b.get("hatlar", []):
            if hat not in hat_idleri:
                hatalar.append(f"{ad}: tanımsız hat {hat!r}")
        if b.get("kol") != "ortak":
            if b.get("aile") not in AILE_ASAMA:
                hatalar.append(f"{ad}: kol becerisinde aile eksik veya geçersiz")
            if b.get("yer") != "kol-ailesi":
                hatalar.append(f"{ad}: kol becerisinin yeri 'kol-ailesi' olmalı")
        if b.get("yer") == "asama" and not b.get("asama"):
            hatalar.append(f"{ad}: yer 'asama' ama aşama listesi boş")
        if b.get("yer") == "hat" and not b.get("hatlar"):
            hatalar.append(f"{ad}: yer 'hat' ama hat listesi boş")
        if b.get("yer") == "karsilik" and not b.get("karsilik"):
            hatalar.append(f"{ad}: büro karşılığı yazılmamış")
        if b.get("yer") == "istege-bagli" and not b.get("not"):
            hatalar.append(f"{ad}: isteğe bağlı becerinin gerekçe notu yok")
    adlar_kume = set(adlar)
    for hat in veri.get("hatlar", []):
        for ad in hat.get("beceriler", []):
            if not ad.startswith("@") and ad not in adlar_kume:
                hatalar.append(f"hat {hat.get('id')}: bilinmeyen beceri {ad!r}")
        for alan in ("ad", "tetik", "cikti", "denetim", "sahip"):
            if not hat.get(alan):
                hatalar.append(f"hat {hat.get('id')}: '{alan}' alanı boş")
    # iki yönlü tutarlılık: hattın listesi ile becerinin `hatlar` alanı birbirini göstermeli
    hat_listesi = {h.get("id"): set(h.get("beceriler", [])) for h in veri.get("hatlar", [])}
    beceri_hatlari = {b.get("ad"): set(b.get("hatlar", [])) for b in beceriler}
    for b in beceriler:
        for hat in b.get("hatlar", []):
            aile_ref = f"@{b.get('aile')}" if b.get("kol") != "ortak" else None
            if hat in hat_listesi and b.get("ad") not in hat_listesi[hat] and aile_ref not in hat_listesi[hat]:
                hatalar.append(f"{b.get('ad')}: '{hat}' hattının beceri listesinde yok")
    for hat in veri.get("hatlar", []):
        for ad in hat.get("beceriler", []):
            if not ad.startswith("@") and ad in beceri_hatlari and hat.get("id") not in beceri_hatlari[ad]:
                hatalar.append(f"hat {hat.get('id')}: {ad} becerisinin 'hatlar' alanında bu hat yok")
    return hatalar


def asama_becerileri(veri: dict, asama, kol: str = "", mod: str = "tam") -> list[tuple[str, str]]:
    """(beceri, not) listesi: aşamaya doğrudan bağlı ortak beceriler + seçilen kolun ailesi."""
    kol = _kol_normalize(kol)
    sonuc: list[tuple[str, str]] = []
    for b in sorted(veri["beceriler"], key=lambda x: _sira(x["ad"])):
        if b["kol"] == "ortak" and asama in b.get("asama", []):
            sonuc.append((b["ad"], b.get("not", "")))
        elif kol and b["kol"] == kol and AILE_ASAMA.get(b.get("aile")) == asama:
            if b.get("aile") == "usul" and mod == "tam":
                not_ = "TAM akışta yalnız usul işlemi (ör. ıslah planı, harç) gerektiğinde"
            else:
                not_ = AILE_NOTU.get(b.get("aile"), "")
            sonuc.append((b["ad"], not_))
    return sonuc


def hat_becerileri(veri: dict, hat_id: str, kol: str = "") -> tuple[dict, list[str]]:
    hat = next((h for h in veri.get("hatlar", []) if h["id"] == hat_id), None)
    if hat is None:
        raise KeyError(hat_id)
    kol = _kol_normalize(kol)
    adlar: list[str] = []
    for ad in hat["beceriler"]:
        if ad.startswith("@"):
            aile = ad[1:]
            adlar.extend(b["ad"] for b in sorted(veri["beceriler"], key=lambda x: _sira(x["ad"]))
                         if b.get("aile") == aile and (not kol or b["kol"] == kol))
        else:
            adlar.append(ad)
    return hat, adlar


def ara(veri: dict, metin: str) -> list[dict]:
    aranan = metin.strip().lower()
    return [b for b in sorted(veri["beceriler"], key=lambda x: _sira(x["ad"]))
            if aranan in (b["ad"] + " " + b["cumle"]).lower()]


def _asama_arg(deger: str):
    deger = deger.strip().lower()
    if deger.isdigit():
        return int(deger)
    if deger in ("kapanis", "kapanış"):
        return "kapanis"
    raise argparse.ArgumentTypeError("aşama 0-7 veya 'kapanis' olmalı")


def _parser() -> argparse.ArgumentParser:
    ap = argparse.ArgumentParser(prog="beceri_haritasi.py",
                                 description="Yargı PRO beceri haritası (config/beceri-haritasi.json)")
    alt = ap.add_subparsers(dest="komut", required=True)
    a = alt.add_parser("asama")
    a.add_argument("no", type=_asama_arg)
    a.add_argument("--kol", default="")
    a.add_argument("--mod", default="tam", choices=("tam", "hizli"))
    h = alt.add_parser("hat")
    h.add_argument("hat_id")
    h.add_argument("--kol", default="")
    alt.add_parser("hatlar")
    r = alt.add_parser("ara")
    r.add_argument("metin")
    alt.add_parser("kontrol")
    return ap


def main(argv: list[str], yol: Path | None = None) -> int:
    for akim in (sys.stdout, sys.stderr):
        try:
            akim.reconfigure(encoding="utf-8")
        except (AttributeError, ValueError):
            pass
    args = _parser().parse_args(argv)
    try:
        veri = yukle(yol)
    except (OSError, json.JSONDecodeError) as hata:
        print(f"HATA: beceri haritası okunamadı: {hata}", file=sys.stderr)
        return 1
    try:
        if args.komut == "kontrol":
            hatalar = kontrol(veri)
            for satir in hatalar:
                print(f"[HATA] {satir}")
            print("BECERİ HARİTASI: " + ("TEMİZ" if not hatalar else f"{len(hatalar)} hata")
                  + f" — {len(veri.get('beceriler', []))} beceri, {len(veri.get('hatlar', []))} hat,"
                  f" içerik sürümü {veri.get('surum', '?')}")
            return 0 if not hatalar else 1
        if args.komut == "asama":
            liste = asama_becerileri(veri, args.no, args.kol, args.mod)
            baslik = f"ASAMA {args.no}" if args.no != "kapanis" else "KAPANIŞ"
            kol = _kol_normalize(args.kol)
            print(f"{baslik} · kol: {KOL_ETIKETI.get(kol, 'verilmedi')} · mod: {args.mod}")
            for ad, not_ in liste:
                print(f"  {ad}" + (f"  — {not_}" if not_ else ""))
            if not kol:
                print("  (kola özgü emsal, analiz ve dilekçe ailesi için --kol verin)")
            return 0
        if args.komut == "hat":
            hat, adlar = hat_becerileri(veri, args.hat_id, args.kol)
            print(f"HAT {hat['id']} — {hat['ad']}\n  tetik: {hat['tetik']}\n  sahip: {hat['sahip']}"
                  f"\n  çıktı: {hat['cikti']}\n  denetim: {hat['denetim']}\n  beceriler:")
            for ad in adlar:
                print(f"    {ad}")
            return 0
        if args.komut == "hatlar":
            for hat in veri.get("hatlar", []):
                print(f"{hat['id']:<16} {hat['ad']} — {hat['tetik']}")
            return 0
        if args.komut == "ara":
            bulunan = ara(veri, args.metin)
            for b in bulunan:
                print(f"{b['ad']} [{KOL_ETIKETI[b['kol']]} · {b['yer']}] {b['cumle']}")
            return 0 if bulunan else 1
    except KeyError as hata:
        print(f"HATA: tanımsız hat: {hata}", file=sys.stderr)
        return 1
    except ValueError as hata:
        print(f"HATA: {hata}", file=sys.stderr)
        return 1
    return 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))

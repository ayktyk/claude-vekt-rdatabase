#!/usr/bin/env python3
"""cikti_dogrula.py — OUTPUT-SIDE yapısal doğrulama kapısı (dönen Gemini/Claude çıktısı).

YAPISAL kapı: SENTINEL echo + Kaynak Doğrulama Tablosu + Aleyhe beyanı + künye↔tablo
tutarlılığı + TBB yasak ifade + KVKK sızıntı (dict/checksum tabanlı).

DİKKAT — bu kapı documentId'nin GERÇEKLİĞİNİ veya tırnak alıntının çekilen metinle
EŞLEŞTİĞİNİ DOĞRULAYAMAZ. İçerik-eşleşme (her documentId'yi Pro MCP ile yeniden
çekip alıntıyı kıyaslama) ZORUNLU ve AYRI bir bağımsız Claude adımıdır (L3). Bu
script o adımın yerine geçmez; yalnız yapısal tabanı sağlar.

Kullanım:
  python scripts/cikti_dogrula.py <dosya> [--dict DAVA_ID] [--deny "Ad Soyad" ...]
exit 0 = PASS, 1 = FAIL
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import doktrin_contract as dc  # noqa: E402
import maske  # _tc_validate, TC_REGEX, IBAN_REGEX, CONFIG_DIR  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent


def find_tc_leaks(text: str) -> list[str]:
    """Checksum-GEÇERLİ 11-haneli TC'leri döndürür (allowlist hariç)."""
    leaks = []
    for m in maske.TC_REGEX.finditer(text):
        tc = m.group(1)
        if tc in dc.ALLOWLIST_NUMBERS:
            continue
        if maske._tc_validate(tc):
            leaks.append(tc)
    return sorted(set(leaks))


def find_iban_leaks(text: str) -> list[str]:
    return sorted({m.group(0) for m in maske.IBAN_REGEX.finditer(text)})


def find_name_leaks(text: str, denylist: list[str]) -> list[str]:
    """Yalnız açıkça verilen müvekkil ad denylist'ini arar (generic isim tespiti YOK)."""
    hits = []
    low = text.casefold()
    for name in denylist:
        if name and name.strip() and name.strip().casefold() in low:
            hits.append(name.strip())
    return sorted(set(hits))


def load_dict_denylist(dava_id: str | None) -> list[str]:
    """config/masks/{dava-id}.json'dan gerçek isim/adres değerlerini denylist olarak çek."""
    if not dava_id:
        return []
    f = maske.CONFIG_DIR / f"{dava_id}.json"
    if not f.exists():
        return []
    try:
        data = json.loads(f.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return []
    names = list(data.get("isimler", {}).keys()) + list(data.get("adres", {}).keys())
    return [n for n in names if n]


def validate_text(text: str, denylist: list[str]) -> list[str]:
    """HARD FAIL sebeplerinin listesini döndürür (boş = PASS)."""
    fails = []

    # 1) SENTINEL echo (air-gap kanıtı) — yoksa doktrin Gemini'ye ulaşmamış
    if not dc.has_sentinel(text):
        fails.append("SENTINEL yok — doktrin çıktıya ulaşmamış (air-gap kopması)")

    # 2) Kaynak Doğrulama Tablosu
    if not dc.has_kaynak_table(text):
        fails.append("KAYNAK DOĞRULAMA tablosu yok")

    # 3) Aleyhe içtihat beyanı (sycophancy-by-absence)
    if not dc.has_aleyhe_declaration(text):
        fails.append("'Aleyhe içtihat: VAR/YOK/ARANMADI' beyanı yok")

    # 4) Gövdede künye varsa tablo şart (atıf↔tablo)
    if dc.body_has_kunye(text) and not dc.has_kaynak_table(text):
        fails.append("gövdede künye var ama Kaynak Doğrulama tablosu yok")

    # 5) TBB yasak / aşırı vaat
    banned = dc.find_banned_phrases(text)
    if banned:
        fails.append("TBB yasak/aşırı vaat ifadesi: " + ", ".join(banned))

    # 6) KVKK sızıntı (checksum-valid TC / tam IBAN / denylist isim)
    tcs = find_tc_leaks(text)
    if tcs:
        fails.append(f"KVKK: maskelenmemiş geçerli TC ({len(tcs)} adet)")
    ibans = find_iban_leaks(text)
    if ibans:
        fails.append(f"KVKK: maskelenmemiş IBAN ({len(ibans)} adet)")
    names = find_name_leaks(text, denylist)
    if names:
        fails.append("KVKK: maskelenmemiş gerçek isim/adres: " + ", ".join(names))

    return fails


def validate_file(path: Path, denylist: list[str]) -> int:
    if not path.exists():
        print(f"[FAIL] {path}: dosya yok", file=sys.stderr)
        return 1
    text = path.read_text(encoding="utf-8")
    fails = validate_text(text, denylist)
    if fails:
        print(f"[FAIL] {path}")
        for f in fails:
            print(f"   - {f}")
        print("\nÇIKTI DOĞRULAMA: HARD FAIL — bu çıktı avukata/Gmail/MemPalace'a GİTMEZ.")
        print("Not: yapısal kapı geçti diye documentId'ler gerçek değildir — bağımsız")
        print("Claude reviewer her documentId'yi Pro MCP ile teyit etmeli (L3).")
        return 1
    print(f"[PASS] {path} — yapısal kapı geçti (içerik-eşleşme L3 bağımsız reviewer'da)")
    return 0


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description="Çıktı yapısal doğrulama kapısı")
    ap.add_argument("file")
    ap.add_argument("--dict", default=None, help="Dava-ID (config/masks/<id>.json denylist)")
    ap.add_argument("--deny", nargs="*", default=[], help="Ek müvekkil ad denylist")
    args = ap.parse_args(argv)
    denylist = load_dict_denylist(args.dict) + list(args.deny)
    return validate_file(Path(args.file), denylist)


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))

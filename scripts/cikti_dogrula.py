#!/usr/bin/env python3
"""cikti_dogrula.py — OUTPUT-SIDE yapısal doğrulama kapısı.

YAPISAL kapı: SENTINEL echo + Kaynak Doğrulama Tablosu + Aleyhe beyanı + künye↔tablo
tutarlılığı + TBB yasak ifade + KVKK sızıntı (dict/checksum tabanlı).

KVKK KAPSAMI (2026-10-09): Maskeleme dava akışında ERTELENDİ (AGENTS.md "KVKK
Maskeleme"); dilekçe gerçek veriyle (TC dahil) yazılır. Bu yüzden TC/IBAN/isim
taraması yalnız KAMUYA AÇIK çıktıda (blog, mail, MemPalace drawer) HARD FAIL'dir:
`--kamu`. Varsayılan (dava çıktısı) kapsamda bulgular BİLGİ olarak yazılır.

DİKKAT — bu kapı documentId'nin GERÇEKLİĞİNİ veya tırnak alıntının çekilen metinle
EŞLEŞTİĞİNİ DOĞRULAYAMAZ. İçerik-eşleşme (her documentId'yi Yargı PRO MCP ile
yeniden çekip alıntıyı kıyaslama) DENETCI adımıdır (AGENTS.md "Denetim Politikası").
Bu script o adımın yerine geçmez; yalnız yapısal tabanı sağlar.

Kullanım:
  python scripts/cikti_dogrula.py <dosya> [--dict DAVA_ID] [--deny "Ad Soyad" ...] [--kamu]
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


def kvkk_bulgulari(text: str, denylist: list[str]) -> list[str]:
    """KVKK bulguları (checksum-geçerli TC / tam IBAN / denylist isim)."""
    bulgular = []
    tcs = find_tc_leaks(text)
    if tcs:
        bulgular.append(f"KVKK: maskelenmemiş geçerli TC ({len(tcs)} adet)")
    ibans = find_iban_leaks(text)
    if ibans:
        bulgular.append(f"KVKK: maskelenmemiş IBAN ({len(ibans)} adet)")
    names = find_name_leaks(text, denylist)
    if names:
        bulgular.append("KVKK: maskelenmemiş gerçek isim/adres: " + ", ".join(names))
    return bulgular


def validate_text(text: str, denylist: list[str], kamu: bool = False) -> list[str]:
    """HARD FAIL sebeplerinin listesini döndürür (boş = PASS).

    kamu=True  -> kamuya açık çıktı (blog/mail/drawer): KVKK bulgusu HARD FAIL.
    kamu=False -> dava çıktısı: KVKK bulgusu FAIL sayılmaz (maskeleme ertelendi).
    """
    fails = []

    # 1) SENTINEL echo (air-gap kanıtı) — yoksa doktrin üretici role ulaşmamış
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

    # 6) KVKK sızıntı — yalnız kamuya açık çıktıda HARD FAIL
    if kamu:
        fails.extend(kvkk_bulgulari(text, denylist))

    return fails


def validate_pair(belge: str, eslik: str, denylist: list[str], kamu: bool = False) -> list[str]:
    """Dışarı giden belge + eşlik eden kaynak doğrulama dosyası (K2) yapısal kapısı.

    Belge UYAP'a/karşı tarafa temiz gider: SENTINEL, Kaynak tablosu, aleyhe beyanı ve
    karar noktaları EŞLİK dosyasında durur. Belgede bu izler varsa FAIL.
    """
    fails = []
    izler = dc.belge_izleri(belge)
    if izler:
        fails.append("Belgede denetim/doktrin izi var (UYAP'a gidemez; eşlik dosyasına taşı): "
                     + ", ".join(izler))
    if not dc.has_sentinel(eslik):
        fails.append("Eşlik dosyasında SENTINEL yok")
    if not dc.has_kaynak_table(eslik):
        fails.append("Eşlik dosyasında KAYNAK DOĞRULAMA tablosu yok")
    if not dc.has_aleyhe_declaration(eslik):
        fails.append("Eşlik dosyasında 'Aleyhe içtihat: VAR/YOK/ARANMADI' beyanı yok")
    banned = sorted(set(dc.find_banned_phrases(belge)) | set(dc.find_banned_phrases(eslik)))
    if banned:
        fails.append("TBB yasak/aşırı vaat ifadesi: " + ", ".join(banned))
    if kamu:
        fails.extend(kvkk_bulgulari(belge, denylist))
    return fails


def _hata_bas(etiket, fails: list[str]) -> int:
    print(f"[FAIL] {etiket}")
    for f in fails:
        print(f"   - {f}")
    print()
    print("ÇIKTI DOĞRULAMA: HARD FAIL — bu çıktı avukata/Gmail/MemPalace'a GİTMEZ.")
    print("Not: yapısal kapı geçti diye documentId'ler gerçek değildir — içerik-eşleşme")
    print("DENETCI adımıdır (her documentId Yargı PRO MCP ile yeniden çekilir).")
    return 1


def validate_pair_files(belge: Path, eslik: Path, denylist: list[str], kamu: bool = False) -> int:
    for yol in (belge, eslik):
        if not yol.exists():
            print(f"[FAIL] {yol}: dosya yok", file=sys.stderr)
            return 1
    belge_metni = belge.read_text(encoding="utf-8")
    fails = validate_pair(belge_metni, eslik.read_text(encoding="utf-8"), denylist, kamu=kamu)
    if fails:
        return _hata_bas(f"{belge} + {eslik}", fails)
    if not kamu:
        for bilgi in kvkk_bulgulari(belge_metni, denylist):
            print(f"[BİLGİ] {bilgi} — dava belgesi, maskeleme ertelendi (kamuya açık değil)")
    durum = "atıf içeriyor → K2 DENETCI zorunlu" if dc.atif_iceriyor(belge_metni) \
        else "atıf yok → K2 UYGULANMAZ kaydedilebilir"
    print(f"[BİLGİ] {durum}")
    print(f"[PASS] {belge} + eşlik — yapısal kapı geçti (içerik-eşleşme DENETCI adımında)")
    return 0


def validate_file(path: Path, denylist: list[str], kamu: bool = False) -> int:
    if not path.exists():
        print(f"[FAIL] {path}: dosya yok", file=sys.stderr)
        return 1
    text = path.read_text(encoding="utf-8")
    fails = validate_text(text, denylist, kamu=kamu)
    if fails:
        return _hata_bas(path, fails)
    if not kamu:
        for bilgi in kvkk_bulgulari(text, denylist):
            print(f"[BİLGİ] {bilgi} — dava çıktısı, maskeleme ertelendi (kamuya açık değil)")
    print(f"[PASS] {path} — yapısal kapı geçti (içerik-eşleşme DENETCI adımında)")
    return 0


def main(argv: list[str]) -> int:
    for akim in (sys.stdout, sys.stderr):
        try:
            akim.reconfigure(encoding="utf-8")
        except (AttributeError, ValueError):
            pass
    ap = argparse.ArgumentParser(description="Çıktı yapısal doğrulama kapısı")
    ap.add_argument("file")
    ap.add_argument("--dict", default=None, help="Dava-ID (config/masks/<id>.json denylist)")
    ap.add_argument("--deny", nargs="*", default=[], help="Ek müvekkil ad denylist")
    ap.add_argument("--kamu", action="store_true",
                    help="Kamuya açık çıktı (blog/mail/drawer): KVKK bulgusu HARD FAIL")
    ap.add_argument("--eslik", default=None,
                    help="Dışarı giden belgenin eşlik eden kaynak doğrulama dosyası (K2 çifti)")
    args = ap.parse_args(argv)
    denylist = load_dict_denylist(args.dict) + list(args.deny)
    if args.eslik:
        return validate_pair_files(Path(args.file), Path(args.eslik), denylist, kamu=args.kamu)
    return validate_file(Path(args.file), denylist, kamu=args.kamu)


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))

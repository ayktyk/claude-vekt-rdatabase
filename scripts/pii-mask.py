#!/usr/bin/env python3
"""
pii-mask.py

Claude Director Agent Gemini'ye veri gondermeden once bunu cagirir.
Muvekkil PII'si maskelenir, session map dosyasina kaydedilir.
Gemini cevabi gelince aynı script --reverse ile demask edilir.

Kullanim:
  # Maskele: stdin -> stdout, map dosyasi yaz
  python pii-mask.py --map /tmp/dava-2026-003.map.json < input.md > masked.md

  # Demaskele: stdin -> stdout, map dosyasindan oku
  python pii-mask.py --reverse --map /tmp/dava-2026-003.map.json < gemini-out.md > final.md

Maskelenen sablonlar:
  - TC kimlik (11 haneli sayi, 1-9 ile baslayan)
  - IBAN (TR ile baslayan 26 karakter)
  - Telefon (TR format: +90, 0, 10-11 haneli)
  - Gercek ad-soyad: --names "Ahmet Yilmaz,Ayse Kara" parametresinden
  - Dosya adina gore dava-id tespiti opsiyonel

NOT: Hakim ve karsi taraf avukati isimleri maskelenmez (kamu bilgisi).
     Sadece muvekkil ve muvekkil yakinlari maskelenir.
"""

import argparse
import json
import re
import sys
from pathlib import Path

TC_PATTERN = re.compile(r"\b[1-9]\d{10}\b")
IBAN_PATTERN = re.compile(r"\bTR\d{2}[\s]?(?:\d{4}[\s]?){5}\d{2}\b", re.IGNORECASE)
PHONE_PATTERN = re.compile(
    r"(?:\+90|0)?[\s\-\(]?5\d{2}[\s\-\)]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}\b"
)


def load_map(path: Path) -> dict:
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return {
        "_version": 1,
        "names": {},
        "tc": {},
        "iban": {},
        "phone": {},
    }


def save_map(path: Path, data: dict) -> None:
    path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def get_or_assign(mapping: dict, value: str, prefix: str) -> str:
    if value in mapping:
        return mapping[value]
    token = f"[{prefix}_{len(mapping) + 1}]"
    mapping[value] = token
    return token


def mask_text(text: str, mapping: dict, names: list[str]) -> str:
    # Ad-soyad (kullanici tarafindan verilir, en onemli)
    for name in names:
        if not name.strip():
            continue
        token = get_or_assign(mapping["names"], name, "MUVEKKIL")
        # Tam ad + kucuk harf + buyuk harf varyasyonu
        text = re.sub(re.escape(name), token, text, flags=re.IGNORECASE)

    # TC
    def tc_sub(m: re.Match) -> str:
        return get_or_assign(mapping["tc"], m.group(0), "TC_NO")

    text = TC_PATTERN.sub(tc_sub, text)

    # IBAN
    def iban_sub(m: re.Match) -> str:
        normalized = re.sub(r"\s+", "", m.group(0)).upper()
        return get_or_assign(mapping["iban"], normalized, "IBAN")

    text = IBAN_PATTERN.sub(iban_sub, text)

    # Telefon
    def phone_sub(m: re.Match) -> str:
        normalized = re.sub(r"[\s\-\(\)]", "", m.group(0))
        return get_or_assign(mapping["phone"], normalized, "TEL")

    text = PHONE_PATTERN.sub(phone_sub, text)

    return text


def unmask_text(text: str, mapping: dict) -> str:
    # Ters haritayi olustur
    reverse = {}
    for category in ("names", "tc", "iban", "phone"):
        for original, token in mapping.get(category, {}).items():
            reverse[token] = original

    # En uzun token'dan basla (prefix cakismalari icin)
    for token in sorted(reverse, key=len, reverse=True):
        text = text.replace(token, reverse[token])

    return text


def main() -> int:
    parser = argparse.ArgumentParser(description="PII mask/unmask for Gemini bridge")
    parser.add_argument("--map", required=True, help="Session map JSON dosyasi")
    parser.add_argument(
        "--names",
        default="",
        help="Maskelenecek isimler (virgulle ayrilmis): 'Ahmet Yilmaz,Ayse Kara'",
    )
    parser.add_argument(
        "--reverse",
        action="store_true",
        help="Demask modu: tokenlari geri cevir",
    )
    args = parser.parse_args()

    map_path = Path(args.map)
    mapping = load_map(map_path)
    text = sys.stdin.read()

    if args.reverse:
        out = unmask_text(text, mapping)
    else:
        names = [n.strip() for n in args.names.split(",") if n.strip()]
        out = mask_text(text, mapping, names)
        save_map(map_path, mapping)

    sys.stdout.write(out)
    return 0


if __name__ == "__main__":
    # Faz 1.4 profiling wrapper
    try:
        import os as _os
        sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__)))
        from _timing import TimedScript
        with TimedScript(__file__):
            sys.exit(main())
    except ImportError:
        sys.exit(main())

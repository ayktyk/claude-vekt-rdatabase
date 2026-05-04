#!/usr/bin/env python3
"""quality_gate.py — ASAMA 2 sonu kalite kapisi denetimi.

Director ASAMA 2 bittiginde bu script'i cagirir:
  python scripts/quality_gate.py asama2 <dava_klasoru>

Kalite kapisi kontrolleri:
  - 02-Arastirma/atif-maddeleri.json var mi ve dolu mu?
  - 02-Arastirma/mulga-eleme.json var mi ve dolu mu?
  - Gecerli karar sayisi >= 5 mi?
  - Atif maddeleri 2B kararlariyla tutarli mi?

Cikti:
  - Tum kontrollar PASS: exit 0, "ASAMA 2 KALITE KAPISI: PASS" yazdirir
  - Eksiklik: exit 1, hangi kontrol fail oldu detayli yazdirir

Schema'lar (ornek):

atif-maddeleri.json:
[
  {
    "decision_id": "bedesten:abc123",
    "decision_label": "9.HD 2024/E.123 K.456",
    "tarih": "2024-05-12",
    "citations": ["6098:344", "6100:200"]
  },
  ...
]

mulga-eleme.json:
{
  "valid": 8,
  "date_mismatch": 1,
  "repealed": 0,
  "unknown": 2,
  "decisions": [
    {
      "decision_id": "bedesten:abc123",
      "decision_label": "9.HD 2024/E.123 K.456",
      "result": "GECERLI",
      "reason": "Atif maddeleri yururlukte; olay tarihi versiyonu uyumlu"
    },
    ...
  ]
}
"""

import json
import os
import sys
from pathlib import Path


def check_atif_maddeleri(case_dir: Path) -> tuple[bool, str]:
    """atif-maddeleri.json kontrol — 2B ciktisi."""
    f = case_dir / "02-Arastirma" / "atif-maddeleri.json"
    if not f.exists():
        return False, f"DOSYA YOK: {f}"

    try:
        with open(f, "r", encoding="utf-8") as fp:
            data = json.load(fp)
    except (json.JSONDecodeError, OSError) as e:
        return False, f"JSON HATASI ({f.name}): {e}"

    if not isinstance(data, list):
        return False, f"FORMAT HATASI: {f.name} bir liste olmali"

    if len(data) == 0:
        return False, f"BOS: {f.name} icinde karar yok"

    # Her karar zorunlu alanlari icermeli
    for i, decision in enumerate(data):
        if not isinstance(decision, dict):
            return False, f"FORMAT HATASI: {f.name} item {i} dict degil"
        for required in ("decision_id", "decision_label", "citations"):
            if required not in decision:
                return False, f"EKSIK ALAN: {f.name} item {i} '{required}' yok"
        if not isinstance(decision["citations"], list):
            return False, f"FORMAT: {f.name} item {i} citations bir liste olmali"

    return True, f"OK: {len(data)} karar, atif maddeleri dolu"


def check_mulga_eleme(case_dir: Path) -> tuple[bool, str]:
    """mulga-eleme.json kontrol — 2C ciktisi."""
    f = case_dir / "02-Arastirma" / "mulga-eleme.json"
    if not f.exists():
        return False, f"DOSYA YOK: {f}"

    try:
        with open(f, "r", encoding="utf-8") as fp:
            data = json.load(fp)
    except (json.JSONDecodeError, OSError) as e:
        return False, f"JSON HATASI ({f.name}): {e}"

    if not isinstance(data, dict):
        return False, f"FORMAT HATASI: {f.name} bir dict olmali"

    # Zorunlu sayi alanlari
    for key in ("valid", "date_mismatch", "repealed", "unknown"):
        if key not in data:
            return False, f"EKSIK ALAN: {f.name} '{key}' yok"
        if not isinstance(data[key], int):
            return False, f"FORMAT: {f.name} '{key}' integer olmali"

    valid_count = data["valid"]
    if valid_count < 5:
        return False, (
            f"YETERSIZ KARAR: gecerli karar sayisi = {valid_count} (min 5 gerekli). "
            f"2B'ye geri don, 3 alternatif terimle ek arama yap. "
            f"Hala 5 alti ise rapora '[YETERSIZ VERI]' flag'i dus."
        )

    if "decisions" not in data or not isinstance(data["decisions"], list):
        return False, f"EKSIK ALAN: {f.name} 'decisions' listesi yok"

    return True, f"OK: {valid_count} gecerli karar, mulga eleme tamamlanmis"


def check_consistency(case_dir: Path) -> tuple[bool, str]:
    """atif-maddeleri.json ve mulga-eleme.json tutarliligini kontrol et."""
    atif_f = case_dir / "02-Arastirma" / "atif-maddeleri.json"
    mulga_f = case_dir / "02-Arastirma" / "mulga-eleme.json"

    if not (atif_f.exists() and mulga_f.exists()):
        return False, "Tutarlilik kontrolu icin her iki dosya da gerekli"

    with open(atif_f, "r", encoding="utf-8") as fp:
        atif_data = json.load(fp)
    with open(mulga_f, "r", encoding="utf-8") as fp:
        mulga_data = json.load(fp)

    atif_ids = {d["decision_id"] for d in atif_data}
    mulga_ids = {d["decision_id"] for d in mulga_data.get("decisions", [])}

    # Mulga eleme'de olan tum kararlar atif'ta olmali
    orphan = mulga_ids - atif_ids
    if orphan:
        return False, f"TUTARSIZLIK: mulga-eleme'de {len(orphan)} karar atif-maddeleri'nde yok"

    # atif'ta olan ama mulga'da olmayan: bu zayif uyari (henuz islenmemis)
    pending = atif_ids - mulga_ids
    if pending:
        return False, f"EKSIK ISLEM: atif-maddeleri'nde {len(pending)} karar mulga eleme'den gecmemis"

    return True, f"OK: {len(atif_ids)} karar tutarli (atif + mulga)"


def asama2_gate(case_dir: Path) -> int:
    """ASAMA 2 kalite kapisi tum kontrolleri."""
    print(f"\n=== ASAMA 2 KALITE KAPISI: {case_dir} ===\n")

    checks = [
        ("atif-maddeleri.json (2B ciktisi)", check_atif_maddeleri),
        ("mulga-eleme.json (2C ciktisi)", check_mulga_eleme),
        ("atif-mulga tutarliligi", check_consistency),
    ]

    failed = []
    for name, func in checks:
        ok, msg = func(case_dir)
        marker = "[PASS]" if ok else "[FAIL]"
        print(f"  {marker} {name}: {msg}")
        if not ok:
            failed.append(name)

    print()
    if failed:
        print(f"ASAMA 2 KALITE KAPISI: FAIL ({len(failed)} kontrol basarisiz)")
        print("Sadece eksik mini-kolu yeniden calistir, tum Faz 2'yi baslatma.")
        return 1
    else:
        print("ASAMA 2 KALITE KAPISI: PASS — ASAMA 3 (usul) baslayabilir")
        return 0


def main() -> int:
    args = sys.argv[1:]
    if len(args) < 2:
        print(__doc__)
        return 1

    cmd = args[0]
    case_dir = Path(args[1])

    if not case_dir.exists():
        print(f"HATA: Dava klasoru yok: {case_dir}", file=sys.stderr)
        return 1

    if cmd == "asama2":
        return asama2_gate(case_dir)

    print(f"Bilinmeyen komut: {cmd}")
    return 1


if __name__ == "__main__":
    sys.exit(main())

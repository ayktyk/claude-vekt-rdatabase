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

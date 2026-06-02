#!/usr/bin/env python3
"""inject_doktrin.py — STANDARD_HEADER'ı düz prompt yüzeylerine IDEMPOTENT enjekte eder.

- SENTINEL zaten varsa atlar (tekrar çalıştırılabilir).
- YAML frontmatter (--- ... ---) varsa header'ı ondan SONRA ekler (parse bozulmaz).
- Devir-bloğu dosyaları (CLAUDE.md / ANTIGRAVITY.md) bu script'in KAPSAMINDA DEĞİL;
  oraya TAM preamble elle gömülür (fence içine).

Kullanım:
  python scripts/inject_doktrin.py --dry-run     # ne yapacağını göster
  python scripts/inject_doktrin.py               # uygula (prompt_targets)
  python scripts/inject_doktrin.py path1 path2   # belirli dosyalar
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import doktrin_contract as dc  # noqa: E402
import doktrin_lint as dl  # noqa: E402

ROOT = dl.ROOT


def _after_frontmatter(text: str) -> int:
    """Frontmatter kapanışından sonraki karakter indexi; yoksa 0."""
    if not (text.startswith("---\n") or text.startswith("---\r\n")):
        return 0
    lines = text.splitlines(keepends=True)
    for i in range(1, len(lines)):
        if lines[i].strip() == "---":
            return sum(len(x) for x in lines[: i + 1])
    return 0


def inject(path: Path, dry: bool = False) -> str:
    try:
        text = path.read_text(encoding="utf-8")
    except OSError as e:
        return f"HATA: {e}"
    if dc.has_sentinel(text):
        return "skip (zaten var)"
    header = dc.STANDARD_HEADER.rstrip() + "\n\n"
    cut = _after_frontmatter(text)
    if cut:
        new = text[:cut] + "\n" + header + text[cut:]
    else:
        new = header + text
    if not dry:
        path.write_text(new, encoding="utf-8")
    return "DRY injected" if dry else "injected"


def main(argv: list[str]) -> int:
    dry = "--dry-run" in argv
    args = [a for a in argv if a != "--dry-run"]
    if args:
        targets = [Path(a) if Path(a).is_absolute() else ROOT / a for a in args]
    else:
        targets = dl.prompt_targets()
    for p in targets:
        rel = p.relative_to(ROOT) if ROOT in p.parents else p
        print(f"{inject(p, dry):16} {rel}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))

#!/usr/bin/env python3
"""mevzuat_cache.py — Mevzuat MCP kanun + madde cache.

Director bunu her Mevzuat MCP cagrisi oncesi sorar:
- has_law(kanun_no): Bu kanunin madde agaci cekildi mi?
- has_article(kanun_no, madde_no): Bu madde icerik cekildi mi?
- mark_law(kanun_no, mevzuat_id): Kanun cekildi olarak isaretle
- mark_article(kanun_no, madde_no, status): Madde cekildi olarak isaretle
- get_status(): Tum cache durumunu yazdir

Cache dosyasi: tmp/mevzuat-cache.json (run-bagimsiz, gunler arasi paylasilir)

Kullanim:
  python scripts/mevzuat_cache.py has 6098            # exit 0 if cached, 1 if not
  python scripts/mevzuat_cache.py mark_law 6098 ABC123
  python scripts/mevzuat_cache.py has_article 6098 344
  python scripts/mevzuat_cache.py mark_article 6098 344 fetched
  python scripts/mevzuat_cache.py status
  python scripts/mevzuat_cache.py reset
"""

import json
import os
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
TMP_DIR = REPO_ROOT / "tmp"
CACHE_FILE = TMP_DIR / "mevzuat-cache.json"


def load_cache() -> dict:
    if not CACHE_FILE.exists():
        return {"laws": {}}
    try:
        with open(CACHE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return {"laws": {}}


def save_cache(cache: dict) -> None:
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False, indent=2)


def has_law(kanun_no: str) -> bool:
    cache = load_cache()
    law = cache.get("laws", {}).get(str(kanun_no))
    return bool(law and law.get("tree_fetched"))


def has_article(kanun_no: str, madde_no: str) -> bool:
    cache = load_cache()
    law = cache.get("laws", {}).get(str(kanun_no))
    if not law:
        return False
    return law.get("articles", {}).get(str(madde_no)) == "fetched"


def mark_law(kanun_no: str, mevzuat_id: str = "") -> None:
    cache = load_cache()
    laws = cache.setdefault("laws", {})
    law = laws.setdefault(str(kanun_no), {"articles": {}})
    law["mevzuat_id"] = mevzuat_id
    law["tree_fetched"] = True
    save_cache(cache)


def mark_article(kanun_no: str, madde_no: str, status: str = "fetched") -> None:
    cache = load_cache()
    laws = cache.setdefault("laws", {})
    law = laws.setdefault(str(kanun_no), {"articles": {}})
    law.setdefault("articles", {})[str(madde_no)] = status
    save_cache(cache)


def status() -> None:
    cache = load_cache()
    laws = cache.get("laws", {})
    if not laws:
        print("Mevzuat cache bos.")
        return
    print(f"Mevzuat Cache ({len(laws)} kanun):")
    for kanun_no, law in sorted(laws.items()):
        articles = law.get("articles", {})
        fetched = sum(1 for v in articles.values() if v == "fetched")
        tree = "tree:OK" if law.get("tree_fetched") else "tree:--"
        print(f"  Kanun {kanun_no}: {tree}, madde {fetched}/{len(articles)} cekildi")


def reset() -> None:
    if CACHE_FILE.exists():
        CACHE_FILE.unlink()
    print("Mevzuat cache sifirlandi.")


def main() -> int:
    args = sys.argv[1:]
    if not args:
        print(__doc__)
        return 1

    cmd = args[0]

    if cmd == "has":
        if len(args) < 2:
            print("KULLANIM: has <kanun_no>", file=sys.stderr)
            return 1
        return 0 if has_law(args[1]) else 1

    if cmd == "has_article":
        if len(args) < 3:
            print("KULLANIM: has_article <kanun_no> <madde_no>", file=sys.stderr)
            return 1
        return 0 if has_article(args[1], args[2]) else 1

    if cmd == "mark_law":
        if len(args) < 2:
            print("KULLANIM: mark_law <kanun_no> [mevzuat_id]", file=sys.stderr)
            return 1
        mevzuat_id = args[2] if len(args) > 2 else ""
        mark_law(args[1], mevzuat_id)
        print(f"Kanun {args[1]} cache'lendi (mevzuat_id={mevzuat_id})")
        return 0

    if cmd == "mark_article":
        if len(args) < 3:
            print("KULLANIM: mark_article <kanun_no> <madde_no> [status]", file=sys.stderr)
            return 1
        st = args[3] if len(args) > 3 else "fetched"
        mark_article(args[1], args[2], st)
        print(f"Kanun {args[1]} madde {args[2]} cache'lendi (status={st})")
        return 0

    if cmd == "status":
        status()
        return 0

    if cmd == "reset":
        reset()
        return 0

    print(f"Bilinmeyen komut: {cmd}")
    print(__doc__)
    return 1


if __name__ == "__main__":
    sys.exit(main())

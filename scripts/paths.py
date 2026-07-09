#!/usr/bin/env python3
"""
Platform-bagimsiz yol cozumleme.

'Hukuk Burosu' veri kokunu (ve alt klasorlerini) her isletim sisteminde
dogru cozumler. Boylece scriptler ve dokumanlar sabit 'G:\\Drive'im\\...'
Windows yoluna bagli kalmaz; ayni kod Windows'ta da macOS'ta da calisir.

Cozumleme onceligi:
  1) Ortam degiskeni HUKUK_BUROSU_ROOT (varsa her seyi ezer)
  2) config/paths.json -> data_root[<platform>]

Platform anahtarlari: 'windows', 'darwin' (macOS), 'linux'.

CLI:
  python scripts/paths.py data-root          -> cozumlenen kok
  python scripts/paths.py aktif              -> Aktif Davalar
  python scripts/paths.py bekleyen           -> Bekleyen Davalar
  python scripts/paths.py biten              -> Biten Davalar
  python scripts/paths.py blog               -> Blog
  python scripts/paths.py research           -> Research
  python scripts/paths.py dava <dava-id>     -> Aktif Davalar/<dava-id>
  python scripts/paths.py check              -> tum yollari + 'VAR/YOK' dener

Python'dan:
  from paths import data_root, dava_dir, aktif_davalar
  p = dava_dir("selin-uyar-2026-003")
"""
import os
import sys
import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
_CONFIG = REPO_ROOT / "config" / "paths.json"


def _platform_key() -> str:
    if sys.platform.startswith("win"):
        return "windows"
    if sys.platform == "darwin":
        return "darwin"
    return "linux"


def _load_cfg() -> dict:
    if _CONFIG.exists():
        return json.loads(_CONFIG.read_text(encoding="utf-8"))
    return {}


def data_root() -> Path:
    """'Hukuk Burosu' kokunu mevcut platforma gore cozumler."""
    env = os.environ.get("HUKUK_BUROSU_ROOT")
    if env:
        return Path(env).expanduser()

    cfg = _load_cfg()
    key = _platform_key()
    root = cfg.get("data_root", {}).get(key)
    if root:
        return Path(root).expanduser()

    raise RuntimeError(
        "Hukuk Burosu veri koku cozumlenemedi.\n"
        f"  Cozum 1: HUKUK_BUROSU_ROOT ortam degiskenini ayarla.\n"
        f"  Cozum 2: {_CONFIG} icine 'data_root.{key}' anahtarini ekle.\n"
        f"  (mevcut platform: {sys.platform} -> anahtar '{key}')"
    )


def _sub(name: str, default: str) -> Path:
    subs = _load_cfg().get("subdirs", {})
    return data_root() / subs.get(name, default)


def aktif_davalar() -> Path:
    return _sub("aktif_davalar", "Aktif Davalar")


def bekleyen_davalar() -> Path:
    return _sub("bekleyen_davalar", "Bekleyen Davalar")


def biten_davalar() -> Path:
    return _sub("biten_davalar", "Biten Davalar")


def blog_root() -> Path:
    return _sub("blog", "Blog")


def research_root() -> Path:
    return _sub("research", "Research")


def dava_dir(dava_id: str) -> Path:
    """Aktif Davalar/<dava-id> — bir davanin kok klasoru."""
    return aktif_davalar() / dava_id


def _main(argv):
    if not argv or argv[0] in ("-h", "--help", "help"):
        print(__doc__)
        return 0

    cmd = argv[0]
    try:
        if cmd == "data-root":
            print(data_root())
        elif cmd == "aktif":
            print(aktif_davalar())
        elif cmd == "bekleyen":
            print(bekleyen_davalar())
        elif cmd == "biten":
            print(biten_davalar())
        elif cmd == "blog":
            print(blog_root())
        elif cmd == "research":
            print(research_root())
        elif cmd == "dava":
            if len(argv) < 2:
                print("Kullanim: python scripts/paths.py dava <dava-id>", file=sys.stderr)
                return 2
            print(dava_dir(argv[1]))
        elif cmd == "check":
            print(f"platform      : {sys.platform} -> '{_platform_key()}'")
            print(f"env override  : {os.environ.get('HUKUK_BUROSU_ROOT') or '(yok)'}")
            for label, p in [
                ("data_root", data_root()),
                ("aktif", aktif_davalar()),
                ("bekleyen", bekleyen_davalar()),
                ("biten", biten_davalar()),
                ("blog", blog_root()),
                ("research", research_root()),
            ]:
                mark = "VAR" if p.exists() else "YOK"
                print(f"  [{mark}] {label:9s}: {p}")
        else:
            print(f"Bilinmeyen komut: {cmd}\n", file=sys.stderr)
            print(__doc__, file=sys.stderr)
            return 2
    except RuntimeError as e:
        print(f"[HATA] {e}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(_main(sys.argv[1:]))

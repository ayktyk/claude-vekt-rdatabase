"""Vega Hukuk marka sabitleri ve büro bilgileri.

Renkler vegahukukistanbul.com/og-image.svg'den (lacivert gradyan + altın çerçeve +
krem Georgia başlık). Büro bilgileri config/author.json'dan okunur.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

NAVY = "#0f2b56"
NAVY_LIGHT = "#1f4c8f"
GOLD = "#caa86a"
CREAM = "#f7f3ea"
INK = "#1c2333"
MUTED = "#6b7280"
LINE = "#d9d2c3"
FIELD_BG = "#fbf9f4"
GREY_BG = "#eeeeee"

FONTS = Path(r"C:\Windows\Fonts")
FONT_FILES = {
    "Georgia": FONTS / "georgia.ttf",
    "Georgia-Bold": FONTS / "georgiab.ttf",
    "Segoe": FONTS / "segoeui.ttf",
    "Segoe-Semibold": FONTS / "seguisb.ttf",
    "Segoe-Bold": FONTS / "segoeuib.ttf",
}

WORDMARK = "Vega Hukuk"
TAGLINE = "DANIŞMANLIK VE ARABULUCULUK"


def buro() -> dict:
    """config/author.json'dan büro iletişim bilgisi."""
    cfg = json.loads((ROOT / "config" / "author.json").read_text(encoding="utf-8"))
    addr = cfg["worksFor"]["address"]
    return {
        "avukat": cfg["name"].replace("Yesilkaya", "Yeşilkaya"),
        "buro": "Vega Hukuk İstanbul",
        "adres": "Osmanağa Mah. Karadut Sk. No:14/10 Kadıköy / İstanbul",
        "adres_kaynak": f'{addr["streetAddress"]} {addr["addressLocality"]}',
        "site": "vegahukukistanbul.com",
        "eposta": cfg["contact"]["email"],
        "whatsapp": cfg["contact"]["randevuUrl"],
        "baro": f'{cfg["barReg"]["baroAdi"]} · Sicil {cfg["barReg"]["baroId"]}',
    }

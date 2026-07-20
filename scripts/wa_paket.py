#!/usr/bin/env python3
"""wa_paket.py — Blog yazisindan WhatsApp paylasim paketi uretir.

THEMIS post-production adimi (validator PASS sonrasi):
  python scripts/wa_paket.py "<blog klasoru>" [--hook "satir1|satir2|satir3"]
      [--link URL] [--ozet "..."]

Girdi : <klasor>/blog.md frontmatter'i (title, slug, excerpt, tldr)
Cikti : <klasor>/wa-durum.png   1080x1920 (WhatsApp durum / Instagram story)
        <klasor>/wa-kare.png    1080x1080 (gruplar / post)
        <klasor>/wa-metin.txt   kopyala-yapistir durum metni (WhatsApp *bold* isaretli)

Tasarim dili: VEGA-Sablonlar (lacivert zemin #0f1e3d, Georgia serif baslik,
pirinc vurgu #b08d57, krem metin #f5f1ea). Logo/insan yuzu/fotograf yok (TBB).
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

NAVY = (15, 30, 61)        # #0f1e3d
BRASS = (176, 141, 87)     # #b08d57
CREAM = (245, 241, 234)    # #f5f1ea
MUTED = (143, 160, 189)    # #8fa0bd

FONTS = Path(r"C:\Windows\Fonts")
F_SERIF_B = str(FONTS / "georgiab.ttf")
F_SANS = str(FONTS / "segoeui.ttf")
F_SANS_SB = str(FONTS / "seguisb.ttf")

SITE = "vegahukukistanbul.com"
IMZA = "Av. Aykut Yeşilkaya · Vega Hukuk İstanbul"
DISCLAIMER = "Bu paylaşım bilgilendirme amaçlıdır, hukuki tavsiye değildir."


def read_frontmatter(md: str) -> dict:
    m = re.search(r"^---\s*\n(.*?)\n---\s*\n", md.lstrip().lstrip("﻿"), re.S)
    if not m:
        m = re.search(r"---\s*\n(.*?)\n---\s*\n", md, re.S)
    fm = m.group(1) if m else ""
    out = {}
    for key in ("title", "slug", "excerpt", "seoDescription"):
        km = re.search(rf'^{key}\s*:\s*["\']?(.+?)["\']?\s*$', fm, re.M)
        if km:
            out[key] = km.group(1).strip()
    tl = re.search(r"^tldr\s*:\s*[|>]?\s*\n((?:[ \t]+.*\n?)+)", fm, re.M)
    if tl:
        out["tldr"] = " ".join(x.strip() for x in tl.group(1).splitlines() if x.strip())
    return out


def wrap(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont, max_w: int) -> list[str]:
    lines, cur = [], ""
    for w in text.split():
        t = (cur + " " + w).strip()
        if draw.textlength(t, font=font) <= max_w:
            cur = t
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def tracked(draw, xy, text, font, fill, tracking=6):
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=font, fill=fill)
        x += draw.textlength(ch, font=font) + tracking


def render(path: Path, size: tuple[int, int], title: str, hooks: list[str], link_label: str):
    W, H = size
    img = Image.new("RGB", (W, H), NAVY)
    d = ImageDraw.Draw(img)
    pad = 96
    story = H > W

    f_kicker = ImageFont.truetype(F_SANS_SB, 34 if story else 30)
    f_title = ImageFont.truetype(F_SERIF_B, 82 if story else 66)
    f_hook = ImageFont.truetype(F_SANS, 44 if story else 38)
    f_link = ImageFont.truetype(F_SANS_SB, 42 if story else 36)
    f_small = ImageFont.truetype(F_SANS, 28 if story else 26)

    # baslik cok uzunsa kucult
    tl = wrap(d, title, f_title, W - 2 * pad)
    while len(tl) > (5 if story else 4) and f_title.size > 54:
        f_title = ImageFont.truetype(F_SERIF_B, f_title.size - 6)
        tl = wrap(d, title, f_title, W - 2 * pad)

    y = pad + (40 if story else 0)
    d.rectangle([pad, y, pad + 110, y + 5], fill=BRASS)
    y += 36
    tracked(d, (pad, y), "VEGA HUKUK İSTANBUL", f_kicker, BRASS, tracking=8)
    y += f_kicker.size + (90 if story else 56)

    for ln in tl:
        d.text((pad, y), ln, font=f_title, fill=(255, 255, 255))
        y += int(f_title.size * 1.16)
    y += 44 if story else 30
    d.rectangle([pad, y, pad + 110, y + 5], fill=BRASS)
    y += 60 if story else 40

    for h in hooks:
        d.ellipse([pad, y + f_hook.size // 2 - 5, pad + 12, y + f_hook.size // 2 + 7], fill=BRASS)
        for i, ln in enumerate(wrap(d, h, f_hook, W - 2 * pad - 44)):
            d.text((pad + 44, y), ln, font=f_hook, fill=CREAM)
            y += int(f_hook.size * 1.3)
        y += 26 if story else 16

    # alt blok
    by = H - pad - f_small.size - 16 - f_small.size - 24 - f_link.size
    d.text((pad, by), link_label, font=f_link, fill=BRASS)
    by += f_link.size + 24
    d.text((pad, by), IMZA, font=f_small, fill=CREAM)
    by += f_small.size + 16
    d.text((pad, by), DISCLAIMER, font=f_small, fill=MUTED)

    img.save(path, "PNG")
    return path


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description="Blogdan WhatsApp paylasim paketi uret")
    ap.add_argument("klasor", help="blog.md iceren klasor")
    ap.add_argument("--hook", default=None, help="3 kisa satir, '|' ile ayrilmis")
    ap.add_argument("--link", default=None)
    ap.add_argument("--ozet", default=None)
    ap.add_argument("--baslik", default=None)
    a = ap.parse_args(argv)

    folder = Path(a.klasor)
    md_path = folder / "blog.md"
    if not md_path.exists():
        print(f"[FAIL] {md_path} yok", file=sys.stderr)
        return 1
    fm = read_frontmatter(md_path.read_text(encoding="utf-8"))

    title = a.baslik or fm.get("title") or "Yeni Yazı"
    slug = fm.get("slug", "")
    link = a.link or (f"https://{SITE}/blog/{slug}" if slug else f"https://{SITE}/blog")
    ozet = a.ozet or fm.get("excerpt") or fm.get("seoDescription") or ""

    if a.hook:
        hooks = [h.strip() for h in a.hook.split("|") if h.strip()][:3]
    else:
        src = fm.get("tldr") or ozet
        hooks = [s.strip() for s in re.split(r"(?<=[.;])\s+", src) if s.strip()][:3]

    render(folder / "wa-durum.png", (1080, 1920), title, hooks, SITE + "/blog")
    render(folder / "wa-kare.png", (1080, 1080), title, hooks, SITE + "/blog")

    metin = (
        f"*{title}*\n\n"
        + (f"{ozet}\n\n" if ozet else "")
        + "\n".join(f"• {h}" for h in hooks)
        + f"\n\nAyrıntılı yazı:\n{link}\n\n{IMZA}\n_{DISCLAIMER}_\n"
    )
    (folder / "wa-metin.txt").write_text(metin, encoding="utf-8")

    print(f"[OK] wa-durum.png (1080x1920), wa-kare.png (1080x1080), wa-metin.txt -> {folder}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))

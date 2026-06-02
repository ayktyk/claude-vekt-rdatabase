#!/usr/bin/env python3
"""blog_validator.py — Blog çıktısı TRUST + SEO kapısı.

Gmail `create_draft` ÖNCESİ ÇALIŞTIRILIR ve BLOCKING'tir:
  - HARD FAIL  -> blog Gmail/Drive'a GİTMEZ (uydurma atıf, KVKK sızıntı, TBB vaat).
  - SEO WARN   -> raporlanır ama bloklamaz (avukat görür, yayın öncesi düzeltir).

DRY: cikti_dogrula + doktrin_contract paylaşımlı kütüphane.
Trust kapısı YAPISALDIR — documentId'nin gerçekliğini doğrulamaz (bağımsız Claude
reviewer + Document-Fetch-Verification adımı ayrıca zorunludur).

Kullanım:
  python scripts/blog_validator.py <blog.md> [--dict DAVA_ID] [--deny "Ad" ...] \
      [--author config/author.json]
exit 0 = PASS (hard fail yok), 1 = HARD FAIL
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import doktrin_contract as dc  # noqa: E402
import cikti_dogrula as cd  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent

REQUIRED_JSONLD = ["Article", "FAQPage", "Person", "Organization", "BreadcrumbList"]


def split_frontmatter(text: str) -> tuple[str, str]:
    """(frontmatter, body) döndürür; frontmatter yoksa ('', text).

    Baştaki SENTINEL (HTML yorum) + boş satırları atlar; böylece SENTINEL ister
    en başta ister sonda olsun frontmatter doğru ayrıştırılır.
    """
    m0 = re.match(r"^(?:\s*<!--.*?-->\s*\n)*\s*", text, re.S)
    start = m0.end() if m0 else 0
    rest = text[start:]
    if rest.startswith("---"):
        m = re.search(r"^---\s*\n(.*?)\n---\s*\n", rest, re.S)
        if m:
            return m.group(1), rest[m.end():]
    return "", text


def _wc(s: str) -> int:
    return len(s.split())


def validate_blog(text: str, denylist: list[str], author_path: Path | None) -> tuple[list[str], list[str]]:
    """(hard_fails, seo_warnings) döndürür."""
    hard: list[str] = []
    warn: list[str] = []
    fm, body = split_frontmatter(text)

    # ---------- HARD FAIL: TRUST ----------
    if not dc.has_sentinel(text):
        hard.append("SENTINEL echo yok — doktrin Gemini'ye ulaşmamış")

    banned = dc.find_banned_phrases(text)
    if banned:
        hard.append("TBB yasak/aşırı vaat: " + ", ".join(banned))

    if cd.find_tc_leaks(text):
        hard.append("KVKK: maskelenmemiş geçerli TC")
    if cd.find_iban_leaks(text):
        hard.append("KVKK: maskelenmemiş IBAN")
    nm = cd.find_name_leaks(text, denylist)
    if nm:
        hard.append("KVKK: gerçek isim/adres: " + ", ".join(nm))

    # Doğrulanmış atıf zorunluluğu (2026-05-17 sahte icra blog dersi)
    ids = re.findall(r"(?:bedesten_id|documentId)\s*:", fm)
    v_true = len(re.findall(r"verified\s*:\s*true", fm, re.I))
    v_false = len(re.findall(r"verified\s*:\s*false", fm, re.I))
    if v_false:
        hard.append(f"frontmatter'da verified:false emsal ({v_false}) — kaldır veya doğrula")
    if len(ids) > v_true:
        hard.append(f"doğrulanmamış emsal: {len(ids)} künye var ama {v_true} verified:true")
    if dc.body_has_kunye(body) and v_true == 0 and len(ids) == 0:
        hard.append("gövdede Yargıtay künyesi var ama frontmatter'da doğrulanmış emsal yok "
                    "(API down ise relatedCases:[] + 'yerleşik uygulama' formülü kullan)")

    # ---------- SEO WARN ----------
    sm = re.search(r"slug\s*:\s*[\"']?([^\n\"']+)", fm)
    if sm and not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", sm.group(1).strip()):
        warn.append("slug ASCII kebab-case değil (Türkçe karakter/boşluk?)")

    tm = re.search(r"(?:seoTitle|title)\s*:\s*[\"']?([^\n\"']+)", fm)
    if tm:
        tlen = len(tm.group(1).strip())
        if not (40 <= tlen <= 65):
            warn.append(f"meta title {tlen} karakter (önerilen 50-60)")
    dm = re.search(r"seoDescription\s*:\s*[\"']?([^\n\"']+)", fm)
    if dm:
        dlen = len(dm.group(1).strip())
        if not (110 <= dlen <= 165):
            warn.append(f"meta description {dlen} karakter (önerilen 120-158)")

    tl = re.search(r"tldr\s*:\s*[|>]?\s*\n((?:\s+.*\n?)+)", fm)
    if tl:
        w = _wc(tl.group(1))
        if not (40 <= w <= 60):
            warn.append(f"TL;DR {w} kelime (40-60 olmalı)")

    faq = len(re.findall(r"^###\s", body, re.M))
    if faq < 5:
        warn.append(f"FAQ {faq} (min 5)")
    h2 = len(re.findall(r"^##\s", body, re.M))
    if not (4 <= h2 <= 8):
        warn.append(f"H2 sayısı {h2} (4-8 olmalı)")

    for t in REQUIRED_JSONLD:
        if t not in text:
            warn.append(f"JSON-LD '{t}' düğümü yok")
    if "og:" not in text and "ogTitle" not in text and "og_title" not in text:
        warn.append("Open Graph etiketleri yok")
    if "gov.tr" not in text:
        warn.append("Resmî (.gov.tr) otorite linki yok")

    # E-E-A-T: author.json sameAs dolu mu
    if author_path and author_path.exists():
        try:
            a = json.loads(author_path.read_text(encoding="utf-8"))
            same = [s for s in a.get("sameAs", []) if s]
            if not same:
                warn.append("author.json sameAs boş — E-E-A-T/Person JSON-LD eksik")
        except (OSError, json.JSONDecodeError):
            warn.append("author.json okunamadı")

    return hard, warn


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description="Blog trust + SEO kapısı")
    ap.add_argument("file")
    ap.add_argument("--dict", default=None)
    ap.add_argument("--deny", nargs="*", default=[])
    ap.add_argument("--author", default=str(ROOT / "config" / "author.json"))
    args = ap.parse_args(argv)

    p = Path(args.file)
    if not p.exists():
        print(f"[FAIL] {p}: dosya yok", file=sys.stderr)
        return 1
    text = p.read_text(encoding="utf-8")
    denylist = cd.load_dict_denylist(args.dict) + list(args.deny)
    hard, warn = validate_blog(text, denylist, Path(args.author) if args.author else None)

    for w in warn:
        print(f"[SEO-WARN] {w}")
    if hard:
        print(f"\n[HARD FAIL] {p}")
        for h in hard:
            print(f"   - {h}")
        print("\nBLOG TRUST KAPISI: HARD FAIL — Gmail draft OLUŞTURULMAZ, Drive'a yazılmaz.")
        return 1
    print(f"\n[PASS] {p} — trust kapısı geçti ({len(warn)} SEO uyarısı). "
          "create_draft serbest (içerik-eşleşme bağımsız reviewer'da).")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))

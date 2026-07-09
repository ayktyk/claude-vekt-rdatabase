# -*- coding: utf-8 -*-
"""PDF inspection helper - ASAMA 1 müvekkil PDF okuma.

PDF yolu platform-bagimsiz olarak PDF_PATH ortam degiskeninden alinir
(sabit Windows yolu YOK). Ornek:
    PDF_PATH="/.../müvekkil evrak.pdf" python scripts/pdf_inspect.py inspect 1 3
    PDF_PATH="$(python scripts/paths.py dava 2026-003)/SON/evrak.pdf" python scripts/pdf_inspect.py dump out.txt
"""
import os
import sys
import io
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import PyPDF2

_pdf_env = os.environ.get("PDF_PATH")
PDF_PATH = Path(_pdf_env).expanduser() if _pdf_env else None


def _require_pdf():
    if PDF_PATH is None:
        raise SystemExit(
            "[HATA] PDF yolu verilmedi. PDF_PATH ortam degiskenini ayarla, orn:\n"
            '  PDF_PATH="/yol/evrak.pdf" python scripts/pdf_inspect.py inspect 1 3'
        )
    if not PDF_PATH.exists():
        raise SystemExit(f"[HATA] PDF bulunamadi: {PDF_PATH}")

def inspect(start: int = 1, end: int = 3, full: bool = False):
    """Read pages [start, end] inclusive, 1-indexed."""
    _require_pdf()
    with open(PDF_PATH, "rb") as f:
        reader = PyPDF2.PdfReader(f)
        total = len(reader.pages)
        print(f"=== PDF Inspection ===")
        print(f"Total pages: {total}")
        print(f"Metadata: {dict(reader.metadata) if reader.metadata else 'None'}")
        print()
        if start < 1: start = 1
        if end > total: end = total
        for i in range(start - 1, end):
            text = reader.pages[i].extract_text()
            if not full:
                text = text[:800]
            print(f"--- Page {i+1} ---")
            print(text)
            print()

def dump_all(out_path: Path):
    """Dump all pages to a UTF-8 text file."""
    _require_pdf()
    with open(PDF_PATH, "rb") as f:
        reader = PyPDF2.PdfReader(f)
        total = len(reader.pages)
        with open(out_path, "w", encoding="utf-8") as out:
            out.write(f"# PDF DUMP — {PDF_PATH.name}\n")
            out.write(f"Total pages: {total}\n\n")
            for i, page in enumerate(reader.pages):
                out.write(f"\n\n========== PAGE {i+1} / {total} ==========\n\n")
                try:
                    text = page.extract_text() or ""
                except Exception as e:
                    text = f"[EXTRACT ERROR: {e}]"
                out.write(text)
        print(f"Dumped {total} pages to {out_path}")

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "inspect"
    if cmd == "dump":
        out = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("pdf_dump.txt")
        dump_all(out)
    elif cmd == "inspect":
        s = int(sys.argv[2]) if len(sys.argv) > 2 else 1
        e = int(sys.argv[3]) if len(sys.argv) > 3 else 3
        full = "--full" in sys.argv
        inspect(s, e, full)
    else:
        print("Usage: pdf_inspect.py [inspect START END [--full] | dump OUT_PATH]")

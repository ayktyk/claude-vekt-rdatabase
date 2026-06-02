# -*- coding: utf-8 -*-
"""PDF inspection helper - ASAMA 1 müvekkil PDF okuma."""
import sys
import io
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import PyPDF2

PDF_PATH = Path(r"G:\Drive'ım\Hukuk Bürosu\Aktif Davalar\2026-003 Mehmet Ali - Trafik Kazası Tazminat\SON\müvekkil son evraklar.pdf")

def inspect(start: int = 1, end: int = 3, full: bool = False):
    """Read pages [start, end] inclusive, 1-indexed."""
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

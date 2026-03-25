from __future__ import annotations

from pathlib import Path

import fitz

from .utils import clean_text


def detect_digital_pdf(pdf_path: Path, sample_pages: int = 5, min_avg_chars: int = 120) -> bool:
    with fitz.open(pdf_path) as doc:
        count = min(sample_pages, len(doc))
        if count == 0:
            return False

        total = 0
        for index in range(count):
            total += len((doc[index].get_text("text") or "").strip())
        return (total / count) >= min_avg_chars


def extract_digital_pages(pdf_path: Path, page_indexes: list[int]) -> list[dict]:
    pages: list[dict] = []
    with fitz.open(pdf_path) as doc:
        for page_index in page_indexes:
            text = clean_text(doc[page_index].get_text("text"))
            if text:
                pages.append({"page": page_index + 1, "text": text})
    return pages


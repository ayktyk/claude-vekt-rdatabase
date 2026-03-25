from __future__ import annotations

from pathlib import Path

from .utils import file_md5


def chunk_pages(
    pages: list[dict],
    source_path: Path,
    chunk_chars: int = 1400,
    overlap_chars: int = 220,
) -> list[dict]:
    chunks: list[dict] = []
    file_hash = file_md5(source_path)

    for page in pages:
        text = page["text"].strip()
        if len(text) < 80:
            continue

        start = 0
        part = 0
        while start < len(text):
            end = min(len(text), start + chunk_chars)
            chunk_text = text[start:end].strip()
            if len(chunk_text) >= 80:
                chunks.append(
                    {
                        "metin": chunk_text,
                        "metadata": {
                            "kaynak_dosya": source_path.name,
                            "orijinal_yol": str(source_path),
                            "kaynak_tipi": "doktrin",
                            "kategori": "pilot-gemini-ocr",
                            "bolum": f"sayfa_{page['page']}_parca_{part}",
                            "sayfa": page["page"],
                            "hash": file_hash,
                            "isleme_yontemi": "gemini_ocr_or_digital_pdf",
                        },
                    }
                )
            if end >= len(text):
                break
            start = max(start + 1, end - overlap_chars)
            part += 1

    return chunks


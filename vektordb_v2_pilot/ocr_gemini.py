from __future__ import annotations

import io
from pathlib import Path
from typing import Iterable

import fitz
import google.generativeai as genai
from PIL import Image

from .utils import GeminiUsage, clean_text, read_usage_metadata, require_gemini_api_key


DEFAULT_MODEL = "gemini-2.5-flash-lite"


def render_page(pdf_path: Path, page_number: int, dpi: int = 180) -> bytes:
    with fitz.open(pdf_path) as doc:
        page = doc[page_number]
        matrix = fitz.Matrix(dpi / 72, dpi / 72)
        pix = page.get_pixmap(matrix=matrix)
        return pix.tobytes("png")


def page_prompt(book_title: str, page_number: int) -> str:
    return f"""Bu goruntu Turkce bir hukuk kitabinin {page_number}. sayfasidir.
Kitap adi: {book_title}

Kurallar:
1. Sayfadaki metni oldugu gibi cikar.
2. Baslik ve alt baslik yapisini koru.
3. Sayfa numarasini, ustbilgi ve altbilgiyi yazma.
4. Okunamayan kisim varsa [okunamadi] yaz.
5. Ek aciklama, yorum veya ozet ekleme.
6. Turkce karakterleri dogru koru.

Sadece sayfadaki metni dondur."""


def ocr_page(
    model_name: str,
    pdf_path: Path,
    page_index: int,
    book_title: str,
) -> tuple[str, GeminiUsage]:
    require_gemini_api_key()
    genai.configure(api_key=require_gemini_api_key())
    model = genai.GenerativeModel(model_name)

    image_bytes = render_page(pdf_path, page_index)
    image = Image.open(io.BytesIO(image_bytes))
    response = model.generate_content([page_prompt(book_title, page_index + 1), image])
    text = clean_text(getattr(response, "text", "") or "")
    usage = read_usage_metadata(response)
    return text, usage


def ocr_pages(
    model_name: str,
    pdf_path: Path,
    page_indexes: Iterable[int],
    book_title: str,
) -> tuple[list[dict], GeminiUsage]:
    usage_total = GeminiUsage()
    pages: list[dict] = []

    for page_index in page_indexes:
        text, usage = ocr_page(model_name, pdf_path, page_index, book_title)
        usage_total.add(usage)
        if text:
            pages.append({"page": page_index + 1, "text": text})

    return pages, usage_total


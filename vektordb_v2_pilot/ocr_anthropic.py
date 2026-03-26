from __future__ import annotations

import base64
import json
import urllib.error
import urllib.request
from pathlib import Path
from typing import Iterable

from .ocr_gemini import page_prompt, render_page
from .utils import GeminiUsage, clean_text, require_anthropic_api_key


DEFAULT_MODEL = "claude-3-5-sonnet-latest"
API_URL = "https://api.anthropic.com/v1/messages"
API_VERSION = "2023-06-01"
MAX_OUTPUT_TOKENS = 4096


def ocr_page(
    model_name: str,
    pdf_path: Path,
    page_index: int,
    book_title: str,
) -> tuple[str, GeminiUsage]:
    image_bytes = render_page(pdf_path, page_index)
    api_key = require_anthropic_api_key()

    payload = {
        "model": model_name,
        "max_tokens": MAX_OUTPUT_TOKENS,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": page_prompt(book_title, page_index + 1)},
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/png",
                            "data": base64.b64encode(image_bytes).decode("ascii"),
                        },
                    },
                ],
            }
        ],
    }

    request = urllib.request.Request(
        API_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "content-type": "application/json",
            "x-api-key": api_key,
            "anthropic-version": API_VERSION,
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            result = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(
            f"Anthropic API hatasi (HTTP {exc.code}): {detail}"
        ) from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Anthropic API baglanti hatasi: {exc}") from exc

    content = result.get("content", [])
    text_parts = [
        block.get("text", "")
        for block in content
        if isinstance(block, dict) and block.get("type") == "text"
    ]
    text = clean_text("\n".join(part for part in text_parts if part))

    usage_raw = result.get("usage", {}) or {}
    usage = GeminiUsage(
        input_tokens=int(usage_raw.get("input_tokens", 0) or 0),
        output_tokens=int(usage_raw.get("output_tokens", 0) or 0),
        total_tokens=int(
            (usage_raw.get("input_tokens", 0) or 0)
            + (usage_raw.get("output_tokens", 0) or 0)
        ),
    )
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

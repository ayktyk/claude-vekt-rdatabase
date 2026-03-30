from __future__ import annotations

import argparse
from datetime import datetime
from pathlib import Path

import fitz

from .chunk_markdown import chunk_pages
from .load_chroma import load_chunks_into_chroma
from .ocr_anthropic import DEFAULT_MODEL as ANTHROPIC_DEFAULT_MODEL
from .ocr_anthropic import ocr_pages as ocr_pages_anthropic
from .ocr_gemini import DEFAULT_MODEL as GEMINI_DEFAULT_MODEL
from .ocr_gemini import ocr_pages as ocr_pages_gemini
from .pdf_digital import detect_digital_pdf, extract_digital_pages
from .utils import estimate_token_cost, load_env_file, slugify, write_json


DEFAULT_GEMINI_INPUT_RATE = 0.10
DEFAULT_GEMINI_OUTPUT_RATE = 0.40


def build_markdown(book_title: str, source_file: Path, pages: list[dict], method: str) -> str:
    lines = [
        f"# {book_title}",
        "",
        f"_Kaynak: {source_file.name}_",
        f"_Yontem: {method}_",
        f"_Uretim: {datetime.now().isoformat(timespec='seconds')}_",
        "",
        "---",
        "",
    ]
    for page in pages:
        lines.append(f"<!-- page:{page['page']} -->")
        lines.append(page["text"])
        lines.append("")
    return "\n".join(lines).strip() + "\n"


def main() -> None:
    parser = argparse.ArgumentParser(description="Tek PDF ile v2 OCR pilotu")
    parser.add_argument("--source", required=True, help="Pilot PDF yolu")
    parser.add_argument(
        "--out-root",
        default=str(Path.cwd() / "pilot-output"),
        help="Pilot ciktilarinin yazilacagi kok klasor",
    )
    parser.add_argument(
        "--ocr-provider",
        choices=("gemini", "anthropic"),
        default="gemini",
        help="Taranmis PDF icin OCR saglayicisi",
    )
    parser.add_argument("--model", default=None, help="Saglayici modeli")
    parser.add_argument("--sample-pages", type=int, default=12, help="Ilk etapta islenecek sayfa sayisi")
    parser.add_argument("--start-page", type=int, default=1, help="Baslangic sayfasi")
    parser.add_argument(
        "--input-rate",
        type=float,
        default=None,
        help="1 milyon input token icin USD maliyet",
    )
    parser.add_argument(
        "--output-rate",
        type=float,
        default=None,
        help="1 milyon output token icin USD maliyet",
    )
    parser.add_argument("--load-chroma", action="store_true", help="Chunklari ChromaDB'ye de yukle")
    args = parser.parse_args()

    load_env_file()

    source = Path(args.source)
    if not source.exists():
        raise FileNotFoundError(f"Kaynak bulunamadi: {source}")
    if source.stat().st_size == 0:
        raise RuntimeError(
            f"Kaynak dosya bos gorunuyor: {source}. PDF yeniden kopyalanmali."
        )

    out_root = Path(args.out_root)
    provider_name = args.ocr_provider
    ocr_model = args.model or (
        GEMINI_DEFAULT_MODEL if provider_name == "gemini" else ANTHROPIC_DEFAULT_MODEL
    )
    markdown_dir = out_root / "markdown-temiz" / f"pilot-{provider_name}-ocr"
    processed_dir = out_root / "islenmis-v2"
    chroma_dir = out_root / "vektor-db-v2"
    report_dir = out_root / "raporlar"

    with fitz.open(source) as doc:
        total_pages = len(doc)

    start_page = max(1, args.start_page)
    page_indexes = list(
        range(start_page - 1, min(total_pages, start_page - 1 + max(1, args.sample_pages)))
    )
    book_title = source.stem
    safe_name = slugify(book_title)

    is_digital = detect_digital_pdf(source)
    if is_digital:
        pages = extract_digital_pages(source, page_indexes)
        method = "digital_pdf"
        cost_info = {"input_cost_usd": 0.0, "output_cost_usd": 0.0, "total_cost_usd": 0.0}
        usage = {"input_tokens": 0, "output_tokens": 0, "total_tokens": 0}
    else:
        if provider_name == "gemini":
            pages, usage_raw = ocr_pages_gemini(ocr_model, source, page_indexes, book_title)
            default_input_rate = DEFAULT_GEMINI_INPUT_RATE
            default_output_rate = DEFAULT_GEMINI_OUTPUT_RATE
        else:
            pages, usage_raw = ocr_pages_anthropic(ocr_model, source, page_indexes, book_title)
            default_input_rate = 0.0
            default_output_rate = 0.0

        method = f"{provider_name}_ocr"
        input_rate = args.input_rate if args.input_rate is not None else default_input_rate
        output_rate = args.output_rate if args.output_rate is not None else default_output_rate
        cost_info = estimate_token_cost(
            usage_raw,
            input_rate_per_million=input_rate,
            output_rate_per_million=output_rate,
        )
        usage = {
            "input_tokens": usage_raw.input_tokens,
            "output_tokens": usage_raw.output_tokens,
            "total_tokens": usage_raw.total_tokens,
        }

    if not pages:
        raise RuntimeError("Islenebilir sayfa cikmadi.")

    markdown = build_markdown(book_title, source, pages, method)
    markdown_path = markdown_dir / f"{safe_name}.md"
    markdown_path.parent.mkdir(parents=True, exist_ok=True)
    markdown_path.write_text(markdown, encoding="utf-8")

    chunk_category = f"pilot-{method}"
    chunks = chunk_pages(
        pages,
        source,
        kategori=chunk_category,
        isleme_yontemi=method,
    )
    processed_path = processed_dir / f"{safe_name}.json"
    write_json(processed_path, chunks)

    inserted = 0
    if args.load_chroma:
        inserted = load_chunks_into_chroma(chunks, chroma_dir)

    report = {
        "source": str(source),
        "source_size_mb": round(source.stat().st_size / 1_048_576, 2),
        "total_pages_in_pdf": total_pages,
        "processed_pages": [page["page"] for page in pages],
        "page_count_processed": len(pages),
        "method": method,
        "provider": provider_name if method != "digital_pdf" else None,
        "model": ocr_model if method != "digital_pdf" else None,
        "usage": usage,
        "estimated_cost_usd": cost_info,
        "markdown_path": str(markdown_path),
        "processed_json_path": str(processed_path),
        "chunk_count": len(chunks),
        "chroma_loaded": bool(args.load_chroma),
        "chroma_inserted_count": inserted,
        "run_at": datetime.now().isoformat(timespec="seconds"),
    }
    report_path = report_dir / f"{safe_name}-pilot-report.json"
    write_json(report_path, report)

    print(f"Kaynak: {source}")
    print(f"Toplam sayfa: {total_pages}")
    print(f"Islenen sayfalar: {report['processed_pages']}")
    print(f"Yontem: {method}")
    print(f"Markdown: {markdown_path}")
    print(f"Chunk JSON: {processed_path}")
    print(f"Chunk sayisi: {len(chunks)}")
    print(f"Tahmini maliyet (USD): {report['estimated_cost_usd']['total_cost_usd']}")
    print(f"Rapor: {report_path}")
    if args.load_chroma:
        print(f"Chroma eklenen chunk: {inserted}")


if __name__ == "__main__":
    main()

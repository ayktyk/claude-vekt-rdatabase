from __future__ import annotations

import hashlib
import json
import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]


@dataclass
class GeminiUsage:
    input_tokens: int = 0
    output_tokens: int = 0
    total_tokens: int = 0

    def add(self, other: "GeminiUsage") -> None:
        self.input_tokens += other.input_tokens
        self.output_tokens += other.output_tokens
        self.total_tokens += other.total_tokens


def load_env_file(env_path: Path | None = None) -> dict[str, str]:
    env_file = env_path or (PROJECT_ROOT / ".env")
    values: dict[str, str] = {}
    if not env_file.exists():
        return values

    for line in env_file.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, value = stripped.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key:
            values[key] = value
            os.environ.setdefault(key, value)
    return values


def require_gemini_api_key() -> str:
    load_env_file()
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError(
            "GEMINI_API_KEY bulunamadi. Proje kokundeki .env dosyasina "
            "GEMINI_API_KEY=... seklinde ekleyin."
        )
    return api_key


def require_anthropic_api_key() -> str:
    load_env_file()
    api_key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError(
            "ANTHROPIC_API_KEY bulunamadi. Proje kokundeki .env dosyasina "
            "ANTHROPIC_API_KEY=... seklinde ekleyin."
        )
    return api_key


def file_md5(path: Path) -> str:
    digest = hashlib.md5()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(8192), b""):
            digest.update(chunk)
    return digest.hexdigest()


def slugify(value: str) -> str:
    replacements = str.maketrans(
        {
            "c": "c",
            "C": "C",
            "g": "g",
            "G": "G",
            "i": "i",
            "I": "I",
            "o": "o",
            "O": "O",
            "s": "s",
            "S": "S",
            "u": "u",
            "U": "U",
        }
    )
    value = value.translate(replacements)
    value = re.sub(r"[^\w\s-]", "", value, flags=re.ASCII)
    value = re.sub(r"[\s_-]+", "-", value).strip("-")
    return value.lower() or "dokuman"


def clean_text(text: str) -> str:
    if not text:
        return ""

    fixes = {
        "\r\n": "\n",
        "\r": "\n",
        "A§": "c",
        "A ": "I ",
    }
    for bad, good in fixes.items():
        text = text.replace(bad, good)

    text = re.sub(r"\n\s*\d+\s*\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = "\n".join(line.rstrip() for line in text.splitlines())
    return text.strip()


def read_usage_metadata(response: Any) -> GeminiUsage:
    usage = GeminiUsage()
    meta = getattr(response, "usage_metadata", None)
    if meta is None:
        return usage

    usage.input_tokens = int(
        getattr(meta, "prompt_token_count", 0)
        or getattr(meta, "input_token_count", 0)
        or 0
    )
    usage.output_tokens = int(
        getattr(meta, "candidates_token_count", 0)
        or getattr(meta, "output_token_count", 0)
        or 0
    )
    usage.total_tokens = int(getattr(meta, "total_token_count", 0) or 0)
    if usage.total_tokens == 0:
        usage.total_tokens = usage.input_tokens + usage.output_tokens
    return usage


def estimate_gemini_cost(
    usage: GeminiUsage,
    input_rate_per_million: float,
    output_rate_per_million: float,
) -> dict[str, float]:
    input_cost = (usage.input_tokens / 1_000_000) * input_rate_per_million
    output_cost = (usage.output_tokens / 1_000_000) * output_rate_per_million
    return {
        "input_cost_usd": round(input_cost, 6),
        "output_cost_usd": round(output_cost, 6),
        "total_cost_usd": round(input_cost + output_cost, 6),
    }


def estimate_token_cost(
    usage: GeminiUsage,
    input_rate_per_million: float,
    output_rate_per_million: float,
) -> dict[str, float]:
    return estimate_gemini_cost(
        usage,
        input_rate_per_million=input_rate_per_million,
        output_rate_per_million=output_rate_per_million,
    )


def write_json(path: Path, payload: dict[str, Any] | list[Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

#!/usr/bin/env python3
"""doktrin_lint.py — PROMPT-SIDE doktrin kapısı.

Hedef her prompt yüzeyi SENTINEL + tüm REQUIRED_CLAUSE_TOKENS taşımalı.
Devir/denetim bloğu taşıyan dosyalarda (AGENTS.md) doktrin, FENCED kod bloğunun
İÇİNDE aranır (doc-geneli prose'taki doktrin özetini saymaz — bloğu alan taraf
yalnız o bloğu görür).

Kullanım:
  python scripts/doktrin_lint.py                 # tüm hedef yüzeyleri tara
  python scripts/doktrin_lint.py path1 path2 ... # belirli dosyaları denetle
  python scripts/doktrin_lint.py --hook-stdin    # CLAUDE_TOOL_INPUT JSON -> file_path

exit 0 = PASS, 1 = FAIL.  (Hook modunda yalnız ilgili dosya kapsamdaysa denetler.)
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import doktrin_contract as dc  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent

# Doktrin taşıması zorunlu prompt yüzeyleri (glob, ROOT'a göreceli)
TARGET_GLOBS = [
    "prompts/muhakeme/*.md",
    "prompts/stajyer/*.md",
    ".claude/agents/davaci-avukat.md",
    ".claude/agents/davali-avukat.md",
    ".claude/agents/bilirkisi.md",
    ".claude/agents/hakim.md",
    ".claude/agents/sentez-strateji.md",
    ".claude/commands/arastir.md",
    ".claude/commands/arastir-yargi.md",
    ".claude/commands/arastir-mevzuat.md",
    ".claude/commands/arastir-notebook.md",
    ".claude/commands/arastir-arguman.md",
    ".claude/commands/arastir-stajyer.md",
    ".claude/commands/arastir-stajyer-cevap.md",
    ".claude/commands/arastir-danisma.md",
    ".claude/commands/blog.md",
    ".claude/commands/blog-dava.md",
]

# Devir/denetim bloğu (fence içi) denetlenecek dosyalar.
# 2026-09-02: tek motora geçildi. CLAUDE.md stub'a indi, ANTIGRAVITY.md arşive
# taşındı; anayasa AGENTS.md ve içindeki DENETİM ÇAĞRI BLOĞU doktrini taşır.
FENCE_FILES = ["AGENTS.md"]

# Preamble'ın kendisi kanonik; ayrı denetlenir (yine de tokenleri içerir)
EXEMPT_NAMES = {"_doktrin-preamble.md"}


def fenced_blocks(text: str) -> list[str]:
    """Markdown ``` ... ``` kod bloklarının içeriklerini döndürür."""
    blocks, buf, inside = [], [], False
    for line in text.splitlines():
        if line.lstrip().startswith("```"):
            if inside:
                blocks.append("\n".join(buf))
                buf, inside = [], False
            else:
                inside = True
        elif inside:
            buf.append(line)
    return blocks


def check_prompt_file(path: Path) -> list[str]:
    """Düz prompt dosyası: tüm dosya SENTINEL + clause taşımalı."""
    try:
        text = path.read_text(encoding="utf-8")
    except OSError as e:
        return [f"OKUNAMADI: {e}"]
    problems = []
    if not dc.has_sentinel(text):
        problems.append("SENTINEL yok")
    miss = dc.missing_clauses(text)
    if miss:
        problems.append("eksik clause: " + ", ".join(miss))
    return problems


def check_fence_file(path: Path) -> list[str]:
    """Devir bloğu dosyası: en az bir DEVİR fenced-block'u doktrin taşımalı."""
    try:
        text = path.read_text(encoding="utf-8")
    except OSError as e:
        return [f"OKUNAMADI: {e}"]
    devir_markers = ("DENETİM TALEBİ", "Dava-ID", "BATCH")
    devir = [b for b in fenced_blocks(text) if any(m in b for m in devir_markers)]
    if not devir:
        return ["devir/denetim bloğu (fenced) bulunamadı"]
    # En az bir devir bloğu tam doktrin taşımalı
    ok_any = any(dc.has_sentinel(b) and not dc.missing_clauses(b) for b in devir)
    if not ok_any:
        # En iyi adayın eksiklerini raporla
        best = min(devir, key=lambda b: len(dc.missing_clauses(b)))
        probs = []
        if not dc.has_sentinel(best):
            probs.append("SENTINEL yok")
        miss = dc.missing_clauses(best)
        if miss:
            probs.append("eksik clause: " + ", ".join(miss))
        return [f"hiçbir devir/denetim bloğu tam doktrin taşımıyor ({len(devir)} blok); en iyi: " + "; ".join(probs)]
    return []


def expand_targets() -> list[Path]:
    targets: list[Path] = []
    for g in TARGET_GLOBS:
        for p in sorted(ROOT.glob(g)):
            if p.name not in EXEMPT_NAMES:
                targets.append(p)
    # Devir-bloğu (fence içi) denetlenen dosyalar da tam taramaya dahil
    for fn in FENCE_FILES:
        p = ROOT / fn
        if p.exists():
            targets.append(p)
    return targets


def prompt_targets() -> list[Path]:
    """Sadece düz prompt yüzeyleri (fence dosyaları HARİÇ) — injector için."""
    targets: list[Path] = []
    for g in TARGET_GLOBS:
        for p in sorted(ROOT.glob(g)):
            if p.name not in EXEMPT_NAMES:
                targets.append(p)
    return targets


def lint_paths(paths: list[Path]) -> int:
    failed = 0
    for p in sorted(set(paths)):
        rel = p.relative_to(ROOT) if p.is_absolute() and ROOT in p.parents else p
        if p.name in FENCE_FILES:
            probs = check_fence_file(p)
        else:
            probs = check_prompt_file(p)
        if probs:
            failed += 1
            print(f"[FAIL] {rel}: " + " | ".join(probs))
        else:
            print(f"[PASS] {rel}")
    print()
    if failed:
        print(f"DOKTRIN LINT: FAIL ({failed} dosya doktrin taşımıyor)")
        return 1
    print("DOKTRIN LINT: PASS — tüm prompt yüzeyleri doktrin taşıyor")
    return 0


def in_scope(path: Path) -> bool:
    try:
        rel = path.relative_to(ROOT).as_posix()
    except ValueError:
        return False
    if path.name in FENCE_FILES:
        return True
    import fnmatch
    return any(fnmatch.fnmatch(rel, g) for g in TARGET_GLOBS)


def main(argv: list[str]) -> int:
    if argv and argv[0] == "--hook-stdin":
        raw = os.environ.get("CLAUDE_TOOL_INPUT", "")
        try:
            fp = json.loads(raw).get("file_path", "") if raw else ""
        except json.JSONDecodeError:
            fp = ""
        if not fp:
            return 0  # dosya yolu yok → engelleme
        p = Path(fp)
        if not p.is_absolute():
            p = ROOT / p
        if not in_scope(p) or not p.exists():
            return 0  # kapsam dışı → sessiz geç (early-exit, hook gürültüsü yok)
        return lint_paths([p])
    if argv:
        return lint_paths([Path(a) if Path(a).is_absolute() else ROOT / a for a in argv])
    return lint_paths(expand_targets())


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))

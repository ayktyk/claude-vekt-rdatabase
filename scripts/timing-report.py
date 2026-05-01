"""scripts/timing-report.py — Faz 1.7 Profiling analiz aracı

4 JSONL log dosyasını okur, profiling raporu üretir:
- logs/model-events.jsonl  (Gemini bridge: duration_ms, tokens, model, asama, dava_id)
- logs/mcp-timings.jsonl   (MCP pre/post: tool_use_id ile pair → duration)
- logs/script-timings.jsonl (Python scripts)
- logs/idle-times.jsonl    (Avukat bekleme: assistant ↔ user turn farkları)

Çıktı: docs/timing-analysis-{ISO_TARIH}.md

Kullanım:
    python scripts/timing-report.py                       # tüm verileri özetle
    python scripts/timing-report.py --pilot-davalar 5     # sadece pilot davalar
    python scripts/timing-report.py --dava-id <id>        # tek dava
    python scripts/timing-report.py --aggregate           # Faz 2 sonu agregat rapor

KVKK güvenli: tool_input/output asla okunmaz, sadece timing field'ları.
Stdlib only — pandas/matplotlib gerekmez.
"""
from __future__ import annotations

import argparse
import json
import os
import statistics
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional


# ════════════════════════════════════════════════════════════════════════
# Yardımcılar
# ════════════════════════════════════════════════════════════════════════


def project_dir() -> Path:
    pd = os.environ.get("CLAUDE_PROJECT_DIR")
    return Path(pd) if pd else Path.cwd()


def read_jsonl(path: Path) -> list[dict]:
    """JSONL dosyasını oku, hata satırlarını atla."""
    if not path.exists():
        return []
    out = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                out.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    return out


def fmt_ms(ms: float) -> str:
    if ms < 1000:
        return f"{ms:.0f}ms"
    elif ms < 60000:
        return f"{ms/1000:.1f}s"
    else:
        m = int(ms // 60000)
        s = (ms % 60000) / 1000
        return f"{m}m {s:.0f}s"


def fmt_sec(s: float) -> str:
    return fmt_ms(s * 1000)


def stat_dict(values: list[float]) -> dict:
    """Bir listeden mean/median/p95/min/max/std/n istatistik."""
    if not values:
        return {"n": 0}
    sorted_v = sorted(values)
    return {
        "n": len(values),
        "mean": statistics.mean(values),
        "median": statistics.median(values),
        "p95": sorted_v[int(len(sorted_v) * 0.95)] if len(sorted_v) > 1 else sorted_v[0],
        "min": min(values),
        "max": max(values),
        "std": statistics.stdev(values) if len(values) > 1 else 0.0,
        "total": sum(values),
    }


def filter_outliers(values: list[float], sigma: float = 2.0) -> tuple[list[float], list[float]]:
    """2-sigma üstü outlier'ları ayır."""
    if len(values) < 3:
        return values, []
    m = statistics.mean(values)
    sd = statistics.stdev(values)
    threshold = m + sigma * sd
    inliers = [v for v in values if v <= threshold]
    outliers = [v for v in values if v > threshold]
    return inliers, outliers


# ════════════════════════════════════════════════════════════════════════
# MCP timing: pre/post pair eşleştirme
# ════════════════════════════════════════════════════════════════════════


def pair_mcp_calls(events: list[dict]) -> list[dict]:
    """mcp_pre + mcp_post event'lerini tool_use_id ile eşleştir, duration hesapla."""
    pres = {e["tool_use_id"]: e for e in events if e.get("event") == "mcp_pre"}
    posts = {e["tool_use_id"]: e for e in events if e.get("event") == "mcp_post"}
    paired = []
    for tid, pre in pres.items():
        post = posts.get(tid)
        if not post:
            continue
        try:
            duration_ms = (int(post["ts_ns"]) - int(pre["ts_ns"])) / 1_000_000
        except (KeyError, ValueError, TypeError):
            continue
        if duration_ms < 0 or duration_ms > 600000:  # 10dk üstü → outlier kabul, log'la
            continue
        paired.append({
            "tool": pre.get("tool", "unknown"),
            "tool_use_id": tid,
            "duration_ms": duration_ms,
            "asama": pre.get("asama", "unknown"),
            "dava_id": pre.get("dava_id", "unknown"),
            "status": post.get("status", "ok"),
        })
    return paired


# ════════════════════════════════════════════════════════════════════════
# Rapor bölümleri
# ════════════════════════════════════════════════════════════════════════


def section_per_dava_timeline(
    model_events: list[dict],
    mcp_paired: list[dict],
    script_timings: list[dict],
    idle_times: list[dict],
    dava_filter: Optional[set[str]] = None,
) -> str:
    """Her dava için ASAMA bazlı timeline + idle time."""
    out = ["## 1. Per-Dava Timeline\n"]

    # Davaları topla
    all_davalar: set[str] = set()
    for e in model_events:
        if e.get("dava_id") and e["dava_id"] != "unknown":
            all_davalar.add(e["dava_id"])
    for e in mcp_paired:
        if e.get("dava_id") and e["dava_id"] != "unknown":
            all_davalar.add(e["dava_id"])

    if dava_filter:
        all_davalar &= dava_filter

    if not all_davalar:
        out.append("*Henüz hiç dava verisi yok. Dava ID'siz log entry'leri için aşağıdaki 'Genel İstatistik' bölümüne bakın.*\n")
        return "\n".join(out)

    for dava in sorted(all_davalar):
        out.append(f"### {dava}\n")

        # Bu davanın LLM çağrıları (model_events)
        dava_llm = [e for e in model_events if e.get("dava_id") == dava]
        # MCP çağrıları
        dava_mcp = [e for e in mcp_paired if e.get("dava_id") == dava]
        # Script
        dava_scripts = [e for e in script_timings if e.get("dava_id") == dava]

        # ASAMA bazında topla
        asama_data: dict[str, dict] = defaultdict(lambda: {
            "llm_ms": 0.0, "llm_count": 0,
            "mcp_ms": 0.0, "mcp_count": 0,
            "script_ms": 0.0, "script_count": 0,
            "input_tokens": 0, "output_tokens": 0,
        })

        for e in dava_llm:
            a = e.get("asama", "unknown")
            asama_data[a]["llm_ms"] += e.get("duration_ms", 0)
            asama_data[a]["llm_count"] += 1
            asama_data[a]["input_tokens"] += e.get("input_tokens", 0)
            asama_data[a]["output_tokens"] += e.get("output_tokens", 0)
        for e in dava_mcp:
            a = e.get("asama", "unknown")
            asama_data[a]["mcp_ms"] += e["duration_ms"]
            asama_data[a]["mcp_count"] += 1
        for e in dava_scripts:
            a = e.get("asama", "unknown")
            asama_data[a]["script_ms"] += e.get("duration_ms", 0)
            asama_data[a]["script_count"] += 1

        if not asama_data:
            out.append("- *Veri yok*\n")
            continue

        # ASAMA tablosu
        out.append("| ASAMA | LLM (call) | MCP (call) | Script | Input tok | Output tok | Toplam |")
        out.append("|---|---|---|---|---|---|---|")
        total_ms = 0.0
        total_in_tok = 0
        total_out_tok = 0
        for asama in sorted(asama_data.keys()):
            d = asama_data[asama]
            asama_total = d["llm_ms"] + d["mcp_ms"] + d["script_ms"]
            total_ms += asama_total
            total_in_tok += d["input_tokens"]
            total_out_tok += d["output_tokens"]
            out.append(
                f"| {asama} | {fmt_ms(d['llm_ms'])} ({d['llm_count']}) "
                f"| {fmt_ms(d['mcp_ms'])} ({d['mcp_count']}) "
                f"| {fmt_ms(d['script_ms'])} ({d['script_count']}) "
                f"| {d['input_tokens']:,} | {d['output_tokens']:,} "
                f"| **{fmt_ms(asama_total)}** |"
            )
        out.append(f"| **TOPLAM** | | | | **{total_in_tok:,}** | **{total_out_tok:,}** | **{fmt_ms(total_ms)}** |\n")

    return "\n".join(out)


def section_per_mcp_stats(mcp_paired: list[dict]) -> str:
    """Her MCP server için duration istatistiği."""
    out = ["## 2. Per-MCP İstatistikleri\n"]
    if not mcp_paired:
        out.append("*MCP timing verisi yok.*\n")
        return "\n".join(out)

    # MCP server bazında grupla (örn mcp__claude_ai_Yarg_MCP__... → claude_ai_Yarg_MCP)
    by_server: dict[str, list[float]] = defaultdict(list)
    for e in mcp_paired:
        tool = e.get("tool", "unknown")
        # mcp__SERVER__tool_name
        parts = tool.split("__")
        server = parts[1] if len(parts) >= 3 else tool
        by_server[server].append(e["duration_ms"])

    out.append("| MCP Server | n | mean | median | p95 | max | std | total | outlier (>2σ) |")
    out.append("|---|---|---|---|---|---|---|---|---|")

    for server in sorted(by_server.keys()):
        values = by_server[server]
        s = stat_dict(values)
        inliers, outliers = filter_outliers(values)
        out.append(
            f"| `{server}` | {s['n']} | {fmt_ms(s['mean'])} | {fmt_ms(s['median'])} "
            f"| {fmt_ms(s['p95'])} | {fmt_ms(s['max'])} | {fmt_ms(s['std'])} "
            f"| {fmt_ms(s['total'])} | {len(outliers)} |"
        )

    return "\n".join(out) + "\n"


def section_per_tool_stats(mcp_paired: list[dict]) -> str:
    """Her MCP tool için (sadece >5 call olanlar) duration."""
    out = ["## 3. Per-Tool İstatistikleri (en sık çağrılanlar)\n"]
    if not mcp_paired:
        return "\n".join(out) + "*MCP timing verisi yok.*\n"

    by_tool: dict[str, list[float]] = defaultdict(list)
    for e in mcp_paired:
        by_tool[e.get("tool", "unknown")].append(e["duration_ms"])

    # En sık çağrılanları al (top 15)
    tools_sorted = sorted(by_tool.items(), key=lambda kv: -len(kv[1]))[:15]

    out.append("| Tool | n | mean | p95 | total |")
    out.append("|---|---|---|---|---|")
    for tool, values in tools_sorted:
        s = stat_dict(values)
        out.append(f"| `{tool}` | {s['n']} | {fmt_ms(s['mean'])} | {fmt_ms(s['p95'])} | {fmt_ms(s['total'])} |")

    return "\n".join(out) + "\n"


def section_per_model_stats(model_events: list[dict]) -> str:
    """Gemini Pro/Flash/Claude bazında duration + token + retry."""
    out = ["## 4. Per-Model (Gemini-bridge) İstatistikleri\n"]
    if not model_events:
        return "\n".join(out) + "*Model event verisi yok.*\n"

    by_model: dict[str, list[dict]] = defaultdict(list)
    for e in model_events:
        by_model[e.get("model", "unknown")].append(e)

    out.append("| Model | n | mean | p95 | input tok (sum) | output tok (sum) | retry sayısı | fallback sayısı |")
    out.append("|---|---|---|---|---|---|---|---|")
    for model, events in sorted(by_model.items()):
        durations = [e.get("duration_ms", 0) for e in events if e.get("duration_ms", 0) > 0]
        in_tokens = sum(e.get("input_tokens", 0) for e in events)
        out_tokens = sum(e.get("output_tokens", 0) for e in events)
        retries = sum(e.get("retry_count", 0) for e in events)
        fallbacks = sum(1 for e in events if e.get("fallback_used"))
        s = stat_dict(durations) if durations else {"n": 0, "mean": 0, "p95": 0}
        out.append(
            f"| `{model}` | {len(events)} | {fmt_ms(s.get('mean', 0))} | {fmt_ms(s.get('p95', 0))} "
            f"| {in_tokens:,} | {out_tokens:,} | {retries} | {fallbacks} |"
        )

    return "\n".join(out) + "\n"


def section_idle_times(idle_times: list[dict]) -> str:
    """Avukat bekleme (idle) istatistikleri."""
    out = ["## 5. Avukat Bekleme (Idle Time) İstatistikleri\n"]
    if not idle_times:
        return "\n".join(out) + "*Idle time verisi yok. `python scripts/idle-times-extract.py` çalıştırın.*\n"

    user_thinking = [e["duration_sec"] for e in idle_times if e.get("kind") == "user_thinking"]
    ai_processing = [e["duration_sec"] for e in idle_times if e.get("kind") == "ai_processing"]

    out.append("| Tür | n | mean | median | p95 | max | total |")
    out.append("|---|---|---|---|---|---|---|")
    if user_thinking:
        s = stat_dict(user_thinking)
        out.append(
            f"| Avukat düşünme/yazma | {s['n']} | {fmt_sec(s['mean'])} | {fmt_sec(s['median'])} "
            f"| {fmt_sec(s['p95'])} | {fmt_sec(s['max'])} | **{fmt_sec(s['total'])}** |"
        )
    if ai_processing:
        s = stat_dict(ai_processing)
        out.append(
            f"| AI işleme | {s['n']} | {fmt_sec(s['mean'])} | {fmt_sec(s['median'])} "
            f"| {fmt_sec(s['p95'])} | {fmt_sec(s['max'])} | **{fmt_sec(s['total'])}** |"
        )
    return "\n".join(out) + "\n"


def section_run_to_run_variance(
    model_events: list[dict],
    mcp_paired: list[dict],
) -> str:
    """Aynı dava içinde farklı koşumların varyans analizi."""
    out = ["## 6. Run-to-Run Varyans (Aynı dava farklı koşum)\n"]

    # run_id'leri dava bazında topla
    by_dava_run: dict[str, dict[str, list[float]]] = defaultdict(lambda: defaultdict(list))
    for e in model_events:
        dava = e.get("dava_id", "unknown")
        run = e.get("run_id", "unknown")
        if dava != "unknown" and run != "unknown":
            by_dava_run[dava][run].append(e.get("duration_ms", 0))

    if not by_dava_run:
        return "\n".join(out) + "*Run-to-run karşılaştırma için aynı davanın 2+ koşumu gerekli.*\n"

    out.append("| Dava | Koşum | LLM toplam | LLM call sayısı |")
    out.append("|---|---|---|---|")
    for dava, runs in sorted(by_dava_run.items()):
        if len(runs) < 2:
            continue
        for run, durations in sorted(runs.items()):
            out.append(f"| {dava} | {run[:20]}... | {fmt_ms(sum(durations))} | {len(durations)} |")

    return "\n".join(out) + "\n"


def section_summary(
    model_events: list[dict],
    mcp_paired: list[dict],
    script_timings: list[dict],
    idle_times: list[dict],
) -> str:
    """Tüm sistemin tek satırlık özeti."""
    out = ["## 0. Özet (Tüm Veri)\n"]

    total_llm_ms = sum(e.get("duration_ms", 0) for e in model_events)
    total_mcp_ms = sum(e["duration_ms"] for e in mcp_paired)
    total_script_ms = sum(e.get("duration_ms", 0) for e in script_timings)
    total_idle_ms = sum(e.get("duration_sec", 0) * 1000 for e in idle_times)
    grand_total = total_llm_ms + total_mcp_ms + total_script_ms + total_idle_ms

    out.append(f"- **Toplam LLM çağrı:** {len(model_events)} (toplam {fmt_ms(total_llm_ms)})")
    out.append(f"- **Toplam MCP çağrı:** {len(mcp_paired)} (toplam {fmt_ms(total_mcp_ms)})")
    out.append(f"- **Toplam Script çağrı:** {len(script_timings)} (toplam {fmt_ms(total_script_ms)})")
    out.append(f"- **Toplam Avukat bekleme:** {len(idle_times)} idle entry (toplam {fmt_ms(total_idle_ms)})")

    if grand_total > 0:
        out.append("")
        out.append("**Wall-clock dağılımı:**")
        out.append(f"- LLM: {100 * total_llm_ms / grand_total:.1f}%")
        out.append(f"- MCP: {100 * total_mcp_ms / grand_total:.1f}%")
        out.append(f"- Script: {100 * total_script_ms / grand_total:.1f}%")
        out.append(f"- Avukat bekleme: {100 * total_idle_ms / grand_total:.1f}%")

    # Token toplam
    total_in_tok = sum(e.get("input_tokens", 0) for e in model_events)
    total_out_tok = sum(e.get("output_tokens", 0) for e in model_events)
    if total_in_tok or total_out_tok:
        out.append(f"\n- **Toplam input token:** {total_in_tok:,}")
        out.append(f"- **Toplam output token:** {total_out_tok:,}")

    return "\n".join(out) + "\n"


# ════════════════════════════════════════════════════════════════════════
# Main
# ════════════════════════════════════════════════════════════════════════


def main() -> int:
    parser = argparse.ArgumentParser(description="Faz 1.7 profiling analiz raporu üreticisi")
    parser.add_argument("--pilot-davalar", type=int, help="Pilot dava sayısını filtrele (sadece raporda göster)")
    parser.add_argument("--dava-id", type=str, help="Tek dava raporu")
    parser.add_argument("--aggregate", action="store_true", help="Faz 2 agregat raporu")
    parser.add_argument("--out", type=str, help="Çıktı dosyası (default: docs/timing-analysis-{tarih}.md)")
    args = parser.parse_args()

    pd = project_dir()
    log_dir = pd / "logs"

    # 4 JSONL'yi oku
    model_events = read_jsonl(log_dir / "model-events.jsonl")
    mcp_events = read_jsonl(log_dir / "mcp-timings.jsonl")
    script_timings = read_jsonl(log_dir / "script-timings.jsonl")
    idle_times = read_jsonl(log_dir / "idle-times.jsonl")

    print(f"Model events:   {len(model_events)}", file=sys.stderr)
    print(f"MCP events:     {len(mcp_events)}", file=sys.stderr)
    print(f"Script timings: {len(script_timings)}", file=sys.stderr)
    print(f"Idle times:     {len(idle_times)}", file=sys.stderr)

    # MCP pre+post pair
    mcp_paired = pair_mcp_calls(mcp_events)
    print(f"MCP paired (pre+post): {len(mcp_paired)}", file=sys.stderr)

    # Dava filtresi
    dava_filter: Optional[set[str]] = None
    if args.dava_id:
        dava_filter = {args.dava_id}
    elif args.pilot_davalar:
        # tüm davalardan ilk N
        all_davalar = set()
        for e in model_events + mcp_paired:
            d = e.get("dava_id")
            if d and d != "unknown":
                all_davalar.add(d)
        dava_filter = set(sorted(all_davalar)[:args.pilot_davalar])

    # Rapor üret
    sections = [
        f"# Profiling Timing Analizi — {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}\n",
        "Üretildi: `python scripts/timing-report.py`\n",
        section_summary(model_events, mcp_paired, script_timings, idle_times),
        section_per_dava_timeline(model_events, mcp_paired, script_timings, idle_times, dava_filter),
        section_per_mcp_stats(mcp_paired),
        section_per_tool_stats(mcp_paired),
        section_per_model_stats(model_events),
        section_idle_times(idle_times),
        section_run_to_run_variance(model_events, mcp_paired),
    ]

    report = "\n\n".join(sections)

    # Çıktı
    if args.out:
        out_path = Path(args.out)
    else:
        docs_dir = pd / "docs"
        docs_dir.mkdir(exist_ok=True)
        out_path = docs_dir / f"timing-analysis-{datetime.now(timezone.utc).strftime('%Y-%m-%d')}.md"

    out_path.write_text(report, encoding="utf-8")
    print(f"\nRAPOR YAZILDI: {out_path}", file=sys.stderr)
    print(f"({out_path.stat().st_size:,} byte)", file=sys.stderr)

    return 0


if __name__ == "__main__":
    sys.exit(main())

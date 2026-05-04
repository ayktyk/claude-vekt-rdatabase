#!/usr/bin/env python3
"""model_weekly_report.py — Haftalik model dashboard.

logs/model-events.jsonl'i tarayip son N gunde Gemini vs Claude basari oranlarini,
fallback sayilarini, task bazli dagilimini raporlar.

Kullanim:
  python scripts/model_weekly_report.py                # Son 7 gun
  python scripts/model_weekly_report.py --days 30      # Son 30 gun
  python scripts/model_weekly_report.py --since 2026-04-01

Cikti:
  Hedef: %85+ Gemini (avukat hibrit modeline gore)
  Eger Sıfır Gemini gun sayisi > 0: KIRMIZI uyari
  Eger Gemini orani < %50: SARI uyari
"""

import argparse
import json
import sys
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
LOG_FILE = REPO_ROOT / "logs" / "model-events.jsonl"


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Haftalik model dashboard")
    p.add_argument("--days", type=int, default=7, help="Son N gun (default 7)")
    p.add_argument("--since", type=str, help="ISO date (2026-04-01) — bu tarihten itibaren")
    p.add_argument("--target", type=float, default=85.0, help="Hedef Gemini oran (default 85%%)")
    p.add_argument("--format", choices=["text", "markdown"], default="text")
    return p.parse_args()


def load_events(since_dt: datetime) -> list[dict]:
    if not LOG_FILE.exists():
        return []
    events = []
    with open(LOG_FILE, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                ev = json.loads(line)
                ts_str = ev.get("ts", "")
                if not ts_str:
                    continue
                # Parse ISO 8601 (e.g., 2026-05-04T18:20:11Z)
                ev_ts = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
                if ev_ts >= since_dt:
                    ev["_dt"] = ev_ts
                    events.append(ev)
            except (json.JSONDecodeError, ValueError):
                continue
    return events


def report(events: list[dict], target: float, fmt: str) -> None:
    if not events:
        print("UYARI: model-events.jsonl bos veya tarih kapsami disinda hic event yok.")
        print("Bu, sistemin Gemini'yi cagirmadığını gösteriyor olabilir.")
        return

    total = len(events)
    by_status = Counter(e.get("status", "unknown") for e in events)
    by_engine = Counter(e.get("engine", "unknown") for e in events)
    by_task = defaultdict(lambda: Counter())
    for e in events:
        by_task[e.get("task", "unknown")][e.get("status", "unknown")] += 1

    # Fallback sayisi
    fallback_count = sum(1 for e in events if e.get("fallback_used"))

    # Gunluk dagilim
    by_day = defaultdict(int)
    for e in events:
        day = e["_dt"].strftime("%Y-%m-%d")
        by_day[day] += 1

    # Sıfır Gemini gun sayisi (kapsam ici tum gunlerde Gemini event yoksa)
    if events:
        first_day = min(e["_dt"] for e in events).date()
        last_day = max(e["_dt"] for e in events).date()
        gemini_days = set(
            e["_dt"].date() for e in events
            if e.get("engine") == "gemini" and e.get("status") == "ok"
        )
        all_days = set()
        d = first_day
        while d <= last_day:
            all_days.add(d)
            d += timedelta(days=1)
        sifir_gemini_gun = len(all_days - gemini_days)
    else:
        sifir_gemini_gun = 0

    # Basarili Gemini orani
    gemini_ok = sum(1 for e in events if e.get("engine") == "gemini" and e.get("status") == "ok")
    gemini_pct = (gemini_ok / total * 100) if total else 0

    # Renk/durum
    if gemini_pct >= target:
        durum = "OK"
    elif gemini_pct >= 50:
        durum = "SARI"
    else:
        durum = "KIRMIZI"

    if fmt == "markdown":
        print(f"# Model Dashboard — {len(events)} event")
        print(f"**Kapsam:** {events[0]['_dt'].strftime('%Y-%m-%d')} → {events[-1]['_dt'].strftime('%Y-%m-%d')}")
        print(f"**Hedef:** %{target:.0f}+ Gemini")
        print(f"**Durum:** {durum}")
        print()
        print("## Genel")
        print(f"- Toplam event: {total}")
        print(f"- Gemini basarili: {gemini_ok} (%{gemini_pct:.1f})")
        print(f"- Fallback sayisi: {fallback_count}")
        print(f"- Sıfır Gemini gun sayisi: {sifir_gemini_gun}")
        print()
        print("## Engine Dagilimi")
        for engine, count in by_engine.most_common():
            print(f"- {engine}: {count}")
        print()
        print("## Status Dagilimi")
        for status, count in by_status.most_common():
            print(f"- {status}: {count}")
        print()
        print("## Task Bazinda")
        print("| Task | Toplam | OK | Failed | Fallback |")
        print("|---|---|---|---|---|")
        for task, statuses in sorted(by_task.items()):
            t_total = sum(statuses.values())
            t_ok = statuses.get("ok", 0)
            t_failed = statuses.get("failed", 0)
            t_fb = sum(1 for e in events if e.get("task") == task and e.get("fallback_used"))
            print(f"| {task} | {t_total} | {t_ok} | {t_failed} | {t_fb} |")
        print()
        print("## Gunluk Dagilim")
        for day, count in sorted(by_day.items()):
            print(f"- {day}: {count} event")
    else:
        # Text format
        first = events[0]['_dt'].strftime('%Y-%m-%d')
        last = events[-1]['_dt'].strftime('%Y-%m-%d')
        print()
        print(f"=== Model Dashboard ({first} - {last}) ===")
        print()
        print(f"  Toplam event: {total}")
        print(f"  Gemini basarili: {gemini_ok} (%{gemini_pct:.1f})")
        print(f"  Fallback sayisi: {fallback_count}")
        print(f"  Sıfır Gemini gun sayisi: {sifir_gemini_gun}")
        print(f"  Hedef: %{target:.0f}+ Gemini")
        print(f"  Durum: {durum}")
        print()
        print("  Engine dagilimi:")
        for engine, count in by_engine.most_common():
            pct = count / total * 100
            print(f"    {engine:20s} {count:5d} (%{pct:.1f})")
        print()
        print("  Task bazinda:")
        for task, statuses in sorted(by_task.items()):
            t_total = sum(statuses.values())
            t_ok = statuses.get("ok", 0)
            t_failed = statuses.get("failed", 0)
            t_fb = sum(1 for e in events if e.get("task") == task and e.get("fallback_used"))
            print(f"    {task:25s} {t_total:5d} (ok:{t_ok}, fail:{t_failed}, fb:{t_fb})")
        print()
        print("  Gunluk:")
        for day, count in sorted(by_day.items()):
            print(f"    {day} {count:5d}")
        print()

        # Uyari mesajlari
        if durum == "KIRMIZI":
            print("UYARI [KIRMIZI]: Gemini orani %50'nin altinda!")
            print("  - Bridge cagrilmiyor olabilir (uretim ajanlari direkt Claude yaziyor)")
            print("  - config/model-routing.json kontrol et")
            print("  - SKILL.md zorunlu bridge cagrisi var mi bak")
        elif durum == "SARI":
            print("UYARI [SARI]: Gemini orani hedefin altinda.")
            print("  - Fallback sayisini kontrol et (bridge sorun olabilir)")

        if sifir_gemini_gun > 0:
            print(f"UYARI: {sifir_gemini_gun} gun hic Gemini event'i yok.")


def main() -> int:
    args = parse_args()

    if args.since:
        try:
            since_dt = datetime.fromisoformat(args.since).replace(tzinfo=timezone.utc)
        except ValueError:
            print(f"HATA: Gecersiz tarih: {args.since} (ISO format: 2026-04-01)", file=sys.stderr)
            return 1
    else:
        since_dt = datetime.now(timezone.utc) - timedelta(days=args.days)

    events = load_events(since_dt)
    report(events, args.target, args.format)
    return 0


if __name__ == "__main__":
    sys.exit(main())

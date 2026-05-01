"""scripts/idle-times-extract.py — Faz 1.5 Avukat bekleme süresi parser

Claude Code session log'undan iki ardışık Claude turn arasındaki wall-clock
farkını çıkarır → logs/idle-times.jsonl.

Mantık:
- Her Claude turn'inin bir timestamp'i var (session JSONL).
- "User turn" sonrası "Assistant turn" → kullanıcı yazmadan önceki süre.
- Bu süre = avukat bekleme (kullanıcı yazıyor / okuyor / düşünüyor).
- Tersi: "Assistant" sonrası "User" → AI yanıtı bittikten sonra kullanıcı reaksiyon süresi.

KVKK güvenli: mesaj içeriği YAZILMAZ, sadece timestamp + role + duration.

Kullanım:
    python scripts/idle-times-extract.py                # son aktif session
    python scripts/idle-times-extract.py --session <id> # belirli session
    python scripts/idle-times-extract.py --all          # tüm session'lar (büyük dosyalar)
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Optional


def _project_session_dir() -> Path:
    """Claude Code'un bu proje için session log klasörü.

    Örn: C:/Users/user/.claude/projects/C--Users-user-Desktop-...-Otomasyon-Claude-Code/
    """
    home = Path(os.environ.get("USERPROFILE") or os.environ.get("HOME") or "~").expanduser()
    pd = os.environ.get("CLAUDE_PROJECT_DIR", str(Path.cwd()))
    # CLAUDE_PROJECT_DIR'i sanitize et (Claude Code session klasörü adı)
    proj_key = pd.replace("/", "-").replace("\\", "-").replace(":", "-").replace(" ", "-")
    # Claude Code önek "C--Users..." gibi (drive harfi : sonrası "--")
    if proj_key.startswith("c-"):
        proj_key = "C" + proj_key[1:]
    candidates = list((home / ".claude" / "projects").glob(f"*{Path(pd).name}*"))
    if not candidates:
        # Alternatif: tüm proje klasörlerinde son düzenlenen
        all_projects = list((home / ".claude" / "projects").iterdir())
        if not all_projects:
            raise FileNotFoundError("Claude Code session dizini bulunamadı")
        candidates = sorted(all_projects, key=lambda p: p.stat().st_mtime, reverse=True)[:1]
    return candidates[0]


def _output_log() -> Path:
    pd = os.environ.get("CLAUDE_PROJECT_DIR")
    base = Path(pd) if pd else Path.cwd()
    log_dir = base / "logs"
    log_dir.mkdir(parents=True, exist_ok=True)
    return log_dir / "idle-times.jsonl"


def parse_session(session_jsonl: Path) -> list[dict]:
    """Session JSONL'den ardışık turn timestamp'lerini çıkar."""
    turns = []
    try:
        with open(session_jsonl, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    entry = json.loads(line)
                except json.JSONDecodeError:
                    continue

                # Claude Code session formatı: {"type": "user"/"assistant", "timestamp": "..."}
                # Veya {"role": "user"/"assistant", "ts": "..."}
                role = entry.get("type") or entry.get("role")
                ts = entry.get("timestamp") or entry.get("ts")

                if role in ("user", "assistant", "human") and ts:
                    turns.append({"role": role, "ts": ts})
    except OSError:
        pass

    return turns


def compute_idle_times(turns: list[dict], session_id: str) -> list[dict]:
    """Ardışık turn'ler arasındaki süreleri hesapla."""
    if len(turns) < 2:
        return []

    from datetime import datetime

    def parse_ts(s: str) -> Optional[float]:
        if isinstance(s, (int, float)):
            return float(s)
        try:
            # ISO 8601: 2026-05-01T17:46:24Z veya 2026-05-01T17:46:24.123Z
            s = s.rstrip("Z").split(".")[0] + ("Z" if s.endswith("Z") else "")
            dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
            return dt.timestamp()
        except Exception:
            return None

    out = []
    for i in range(1, len(turns)):
        prev = turns[i - 1]
        cur = turns[i]
        t_prev = parse_ts(prev["ts"])
        t_cur = parse_ts(cur["ts"])
        if t_prev is None or t_cur is None:
            continue
        duration_sec = t_cur - t_prev
        if duration_sec < 0 or duration_sec > 86400:  # 1 gün üstü → outlier, atla
            continue

        # Idle türü
        if prev["role"] == "assistant" and cur["role"] in ("user", "human"):
            kind = "user_thinking"  # Avukat: AI cevabı okuyup yanıt yazma süresi
        elif prev["role"] in ("user", "human") and cur["role"] == "assistant":
            kind = "ai_processing"  # AI: kullanıcı mesajı geldikten sonra yanıt üretme
        else:
            kind = "other"

        out.append({
            "session_id": session_id,
            "from_role": prev["role"],
            "to_role": cur["role"],
            "from_ts": prev["ts"],
            "to_ts": cur["ts"],
            "duration_sec": round(duration_sec, 2),
            "kind": kind,
        })
    return out


def main() -> int:
    p = argparse.ArgumentParser(description="Claude Code session idle time extractor")
    p.add_argument("--session", type=str, help="Session ID (UUID)")
    p.add_argument("--all", action="store_true", help="Tüm session'lar")
    args = p.parse_args()

    try:
        session_dir = _project_session_dir()
    except FileNotFoundError as e:
        print(f"HATA: {e}", file=sys.stderr)
        return 1

    if args.session:
        files = [session_dir / f"{args.session}.jsonl"]
    elif args.all:
        files = sorted(session_dir.glob("*.jsonl"))
    else:
        # Son düzenlenen session
        files = sorted(session_dir.glob("*.jsonl"), key=lambda p: p.stat().st_mtime, reverse=True)[:1]

    output = _output_log()
    total_entries = 0
    with open(output, "a", encoding="utf-8") as out_f:
        for f in files:
            if not f.exists():
                print(f"UYARI: {f} yok, atlanıyor", file=sys.stderr)
                continue
            session_id = f.stem
            turns = parse_session(f)
            idle = compute_idle_times(turns, session_id)
            for entry in idle:
                out_f.write(json.dumps(entry, ensure_ascii=False) + "\n")
                total_entries += 1
            print(f"[{session_id[:8]}...] {len(turns)} turn → {len(idle)} idle entry", file=sys.stderr)

    print(f"TOPLAM: {total_entries} idle entry → {output}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())

"""scripts/_timing.py — Faz 1.4 Python script timing helper

Kullanım:
    from _timing import TimedScript
    if __name__ == "__main__":
        with TimedScript(__file__):
            # mevcut script kodu
            ...

Çıktı: logs/script-timings.jsonl (CLAUDE_PROJECT_DIR varsa orada, yoksa cwd/logs).
KVKK güvenli: argv'nin sadece ilk 4'ü, 100 char ile sınırlı (path bilgisi olabilir).
Profiling kapalıysa (config/profiling.json: enabled=false) atlar.
"""
from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path


def _profiling_enabled(project_dir: Path) -> bool:
    """Feature flag kontrolü — kapalıysa hiçbir şey yazma."""
    flag_file = project_dir / "config" / "profiling.json"
    if not flag_file.exists():
        return True  # default: açık
    try:
        with open(flag_file, "r", encoding="utf-8") as f:
            cfg = json.load(f)
        return bool(cfg.get("enabled", True))
    except (json.JSONDecodeError, OSError):
        return True  # parse hatası → fail-safe açık


def _log_dir() -> Path:
    pd = os.environ.get("CLAUDE_PROJECT_DIR")
    base = Path(pd) if pd else Path.cwd()
    return base / "logs"


class TimedScript:
    """Context manager: script entry → exit arasındaki wall-clock süreyi log'lar."""

    def __init__(self, script_name: str):
        self.script_name = Path(script_name).name
        self.t0: float | None = None

    def __enter__(self) -> "TimedScript":
        self.t0 = time.perf_counter()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        if self.t0 is None:
            return

        log_dir = _log_dir()
        project_dir = log_dir.parent

        if not _profiling_enabled(project_dir):
            return

        try:
            log_dir.mkdir(parents=True, exist_ok=True)
            duration_ms = int((time.perf_counter() - self.t0) * 1000)

            # KVKK: argv ilk 4, 100 char ile sınırla, müvekkil verisi sızmasın
            safe_argv = [arg[:100] for arg in sys.argv[1:5]]

            entry = {
                "ts": time.time(),
                "ts_iso": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "script": self.script_name,
                "duration_ms": duration_ms,
                "exit_status": "ok" if exc_type is None else "error",
                "exception_type": exc_type.__name__ if exc_type else None,
                "asama": os.environ.get("ASAMA", "unknown"),
                "dava_id": os.environ.get("DAVA_ID", "unknown"),
                "argv_safe": safe_argv,
            }

            with open(log_dir / "script-timings.jsonl", "a", encoding="utf-8") as f:
                f.write(json.dumps(entry, ensure_ascii=False) + "\n")
        except Exception:
            # Profiling asla ana scripti bozamaz — sessiz başarısız ol
            pass

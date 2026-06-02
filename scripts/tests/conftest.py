"""pytest ortak kurulum — scripts/ modüllerini import edilebilir yapar + UTF-8.

Windows konsolu varsayılan cp1254'tür; Türkçe (ı/ğ/ş/İ/ç) içeren çıktılar
testlerde kırılmasın diye stdout/stderr UTF-8'e sabitlenir.
"""
import sys
from pathlib import Path

# scripts/ kökünü sys.path'e ekle (test'ler maske, doktrin_lint vs. import edebilsin)
SCRIPTS_DIR = Path(__file__).resolve().parent.parent
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

# UTF-8 stdio (cp1254 -> UnicodeEncodeError koruması)
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8")
    except (AttributeError, ValueError):
        pass

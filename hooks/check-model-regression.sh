#!/usr/bin/env bash
# ============================================================
# DEPRECATED - 2026-05-13
# ============================================================
# Bu hook Antigravity hibrit mimarisine gecisle ANLAMSIZ HALE GELDI.
# Eski mantik: Edit/Write sonrasi dosya frontmatter'indaki engine
# alanini config'teki beklentiyle karsilastiriyordu (gemini fallback
# orani izleme amacli).
#
# Yeni mimaride engine='antigravity_manual' tasklarinda dosyalar
# Antigravity sag panelden Drive'a yaziliyor; terminal Claude o
# dosyalari sadece OKUYOR (Write/Edit yapmiyor). Dolayisiyla hook
# zaten tetiklenmiyor. Aktif kalmasi gerekirse log gurultusu yapar.
#
# Hook artik no-op: hemen exit 0 doner.
# Rehber: ANTIGRAVITY.md
# Geri donus icin git log ile eski sirum geri yuklenebilir.
# ============================================================
exit 0

# ============================================================
# ASAGIDAKI ESKI KOD KORUNDU (ROLLBACK ICIN).
# ============================================================

# check-model-regression.sh (ESKI)
# PostToolUse hook: Edit/Write sonrasi yazilan dosya frontmatter'inda
# beklenen engine ile gercek engine eslesiyor mu kontrol eder.
#
# config/model-routing.json'da task icin engine belirtilmis ise:
#   - dilekce-v*.md / usul-raporu.md / arastirma-raporu.md / stratejik-analiz.md
#     yazildiginda frontmatter `engine` field'i kontrol edilir
#   - Beklenen ile gercek farkli ise stderr'e UYARI basar (block etmez)
#
# Hook input: $CLAUDE_TOOL_INPUT — JSON string with file_path
# Exit: 0 (always — uyari sadece stderr)

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONFIG_FILE="$REPO_ROOT/config/model-routing.json"

# Tool input'tan file_path cikar
INPUT="${CLAUDE_TOOL_INPUT:-}"
if [[ -z "$INPUT" ]]; then
  exit 0
fi

# JSON parse: file_path field
FILE_PATH=$( cd "$REPO_ROOT" && python -X utf8 -c "
import json, sys, os
try:
    inp = os.environ.get('CLAUDE_TOOL_INPUT', '{}')
    data = json.loads(inp)
    print(data.get('file_path', ''))
except Exception:
    pass
" 2>/dev/null)

if [[ -z "$FILE_PATH" ]]; then
  exit 0
fi

# Sadece hukuki cikti dosyalarini denetle
case "$FILE_PATH" in
  *dilekce-v*|*usul-raporu*|*arastirma-raporu*|*stratejik-analiz*|*savunma-simulasyonu*|*revizyon-raporu*)
    ;;
  *)
    exit 0  # Diger dosyalari atla
    ;;
esac

# Dosya okunabilir mi?
if [[ ! -f "$FILE_PATH" ]]; then
  exit 0  # Henuz yazilmamis veya farkli yol
fi

# Task tipini dosya adindan tespit et
TASK_TYPE=""
case "$FILE_PATH" in
  *dilekce-v1*) TASK_TYPE="dilekce_yazimi" ;;
  *dilekce-v2*) TASK_TYPE="revizyon" ;;
  *usul-raporu*) TASK_TYPE="usul_raporu" ;;
  *arastirma-raporu*) TASK_TYPE="arastirma_sentezi" ;;
  *stratejik-analiz*) TASK_TYPE="stratejik_analiz" ;;
  *savunma-simulasyonu*) TASK_TYPE="savunma_simulasyonu" ;;
  *) exit 0 ;;
esac

# Beklenen engine'i config'ten oku
EXPECTED_ENGINE=$( cd "$REPO_ROOT" && python -X utf8 -c "
import json, sys
try:
    with open('config/model-routing.json', 'r', encoding='utf-8') as f:
        cfg = json.load(f)
    print(cfg.get('tasks', {}).get('$TASK_TYPE', {}).get('engine', ''))
except Exception:
    pass
" 2>/dev/null)

if [[ -z "$EXPECTED_ENGINE" ]]; then
  exit 0  # Config'te task yok, atla
fi

# Frontmatter'dan gercek engine'i parse et
ACTUAL_ENGINE=""
ACTUAL_FALLBACK=""
if head -30 "$FILE_PATH" | grep -q "^---"; then
  ACTUAL_ENGINE=$(head -30 "$FILE_PATH" | grep "^engine:" | head -1 | awk '{print $2}' | tr -d '"' | tr -d "'")
  ACTUAL_FALLBACK=$(head -30 "$FILE_PATH" | grep "^fallback_used:" | head -1 | awk '{print $2}' | tr -d '"' | tr -d "'")
fi

# Frontmatter yoksa uyari
if [[ -z "$ACTUAL_ENGINE" ]]; then
  echo "[model-regression] UYARI: $FILE_PATH frontmatter'inda 'engine' field'i yok. Beklenen: $EXPECTED_ENGINE" >&2
  exit 0  # Block etme
fi

# Engine eslesmesi kontrolu
if [[ "$ACTUAL_ENGINE" != "$EXPECTED_ENGINE" ]]; then
  if [[ "$ACTUAL_FALLBACK" == "true" ]]; then
    # Fallback durumu — bilgi ver ama uyarma
    echo "[model-regression] BILGI: $FILE_PATH actual=$ACTUAL_ENGINE expected=$EXPECTED_ENGINE (fallback_used=true, kabul edilir)" >&2
  else
    echo "" >&2
    echo "================================================================" >&2
    echo "[model-regression] MODEL REGRESYON UYARISI" >&2
    echo "================================================================" >&2
    echo "Dosya:    $FILE_PATH" >&2
    echo "Task:     $TASK_TYPE" >&2
    echo "Beklenen: engine=$EXPECTED_ENGINE (config/model-routing.json)" >&2
    echo "Gercek:   engine=$ACTUAL_ENGINE (frontmatter)" >&2
    echo "Fallback: $ACTUAL_FALLBACK" >&2
    echo "" >&2
    echo "Olasi sebepler:" >&2
    echo "  1. Bridge cagrisi atlandi (uretim ajani direkt yazdi)" >&2
    echo "  2. Bridge fail oldu ama fallback_used: true notu eksik" >&2
    echo "  3. config/model-routing.json yeni guncellendi, eski cikti silinmemis" >&2
    echo "" >&2
    echo "Kontrol icin: scripts/gemini-bridge.sh $TASK_TYPE ..." >&2
    echo "================================================================" >&2
    echo "" >&2
  fi
fi

exit 0

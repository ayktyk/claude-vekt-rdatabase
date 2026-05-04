#!/usr/bin/env bash
# progress_helper.sh
# Faz 2 progress ledger ve run_id yonetimi icin yardimci script.
# Director Agent ve arastirmaci ajan bunu cagirir.
#
# Komutlar:
#   progress_helper.sh init <dava-id>           -> run_id uretir, current-run-id.txt yazar
#   progress_helper.sh log <phase> <step> <data>-> .faz2-progress.jsonl'e satir ekler
#   progress_helper.sh status                   -> mevcut run_id ve son 5 olayi yazdirir
#   progress_helper.sh still_working <mesaj>    -> 60 sn sessizlikte uyari satiri
#   progress_helper.sh tail                     -> ledger'i tail -f ile izle (terminal)

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP_DIR="$REPO_ROOT/tmp"
mkdir -p "$TMP_DIR"

CMD="${1:-help}"

case "$CMD" in
  init)
    DAVA_ID="${2:-unknown}"
    TS=$(date -u +%Y%m%dT%H%M%SZ)
    PID=$$
    RUN_ID="${TS%Z}-${PID}-${DAVA_ID}"
    echo "$RUN_ID" > "$TMP_DIR/current-run-id.txt"
    echo "$DAVA_ID" > "$TMP_DIR/current-dava-id.txt"

    # Ledger dosyasi yolu — dava klasoru biliniyorsa oraya, yoksa tmp'ye
    LEDGER_DIR="$TMP_DIR"
    if [[ -n "${CASE_DIR:-}" && -d "$CASE_DIR/02-Arastirma" ]]; then
      LEDGER_DIR="$CASE_DIR/02-Arastirma"
    fi
    LEDGER="$LEDGER_DIR/.faz2-progress.jsonl"
    echo "$LEDGER" > "$TMP_DIR/current-ledger-path.txt"

    # Init satiri
    NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    printf '{"ts":"%s","run_id":"%s","phase":"INIT","step":"run_started","dava_id":"%s","ledger":"%s"}\n' \
      "$NOW" "$RUN_ID" "$DAVA_ID" "$LEDGER" >> "$LEDGER"

    echo "[progress] run_id=$RUN_ID dava_id=$DAVA_ID ledger=$LEDGER"
    ;;

  log)
    PHASE="${2:-?}"
    STEP="${3:-?}"
    # NOT: ${4:-{}} default pattern'i bash parser'i yaniltir (extra `}` eklenir).
    # Bunun yerine if-else ile guvenli default:
    if [[ -n "${4:-}" ]]; then
      DATA_JSON="$4"
    else
      DATA_JSON='{}'
    fi

    if [[ ! -f "$TMP_DIR/current-run-id.txt" ]]; then
      echo "[progress] HATA: run_id yok, once 'init <dava-id>' calistir" >&2
      exit 1
    fi

    RUN_ID=$(cat "$TMP_DIR/current-run-id.txt")
    LEDGER=$(cat "$TMP_DIR/current-ledger-path.txt")
    NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ)

    # DATA_JSON'i goreceli tmp dosyaya yaz, Python REPO_ROOT'tan goreceli path ile okur
    # (MSYS/Windows path uyusmazligi onlemek icin goreceli yol)
    EXTRA_FILE_REL="tmp/.progress-extra-$$.json"
    EXTRA_FILE_ABS="$REPO_ROOT/$EXTRA_FILE_REL"
    printf '%s' "$DATA_JSON" > "$EXTRA_FILE_ABS"

    OUTPUT_JSON=$( cd "$REPO_ROOT" && BASE_TS="$NOW" BASE_RUN_ID="$RUN_ID" BASE_PHASE="$PHASE" BASE_STEP="$STEP" \
    EXTRA_FILE_REL="$EXTRA_FILE_REL" \
    python -X utf8 -c '
import json, os, sys
try:
    base = {
        "ts": os.environ["BASE_TS"],
        "run_id": os.environ["BASE_RUN_ID"],
        "phase": os.environ["BASE_PHASE"],
        "step": os.environ["BASE_STEP"],
    }
    extra_file = os.environ.get("EXTRA_FILE_REL", "")
    extra = {}
    if extra_file and os.path.exists(extra_file):
        with open(extra_file, "r", encoding="utf-8") as f:
            content = f.read().strip()
        if content:
            extra = json.loads(content)
    if isinstance(extra, dict):
        base.update(extra)
    print(json.dumps(base, ensure_ascii=False))
except Exception as e:
    print(json.dumps({
        "ts": os.environ.get("BASE_TS", ""),
        "run_id": os.environ.get("BASE_RUN_ID", ""),
        "phase": os.environ.get("BASE_PHASE", ""),
        "step": os.environ.get("BASE_STEP", ""),
        "_extra_parse_error": str(e),
    }, ensure_ascii=False))
' )
    echo "$OUTPUT_JSON" >> "$LEDGER"
    rm -f "$EXTRA_FILE_ABS"
    ;;

  status)
    if [[ ! -f "$TMP_DIR/current-run-id.txt" ]]; then
      echo "[progress] Aktif run yok"
      exit 0
    fi
    RUN_ID=$(cat "$TMP_DIR/current-run-id.txt")
    DAVA_ID=$(cat "$TMP_DIR/current-dava-id.txt" 2>/dev/null || echo "?")
    LEDGER=$(cat "$TMP_DIR/current-ledger-path.txt")
    echo "Run: $RUN_ID"
    echo "Dava: $DAVA_ID"
    echo "Ledger: $LEDGER"
    echo "Son 5 olay:"
    tail -5 "$LEDGER" 2>/dev/null | sed 's/^/  /'
    ;;

  still_working)
    MSG="${2:-Calisiyorum...}"
    if [[ ! -f "$TMP_DIR/current-run-id.txt" ]]; then
      exit 0  # silent — init yapilmadiysa sessizce gec
    fi
    RUN_ID=$(cat "$TMP_DIR/current-run-id.txt")
    LEDGER=$(cat "$TMP_DIR/current-ledger-path.txt")
    NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    printf '{"ts":"%s","run_id":"%s","phase":"STILL_WORKING","step":"heartbeat","message":"%s"}\n' \
      "$NOW" "$RUN_ID" "$MSG" >> "$LEDGER"
    echo "[$NOW] STILL_WORKING: $MSG" >&2
    ;;

  tail)
    if [[ ! -f "$TMP_DIR/current-ledger-path.txt" ]]; then
      echo "[progress] Aktif ledger yok"
      exit 1
    fi
    LEDGER=$(cat "$TMP_DIR/current-ledger-path.txt")
    echo "Tailing: $LEDGER"
    tail -f "$LEDGER"
    ;;

  end)
    if [[ ! -f "$TMP_DIR/current-run-id.txt" ]]; then
      exit 0
    fi
    RUN_ID=$(cat "$TMP_DIR/current-run-id.txt")
    LEDGER=$(cat "$TMP_DIR/current-ledger-path.txt")
    NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    printf '{"ts":"%s","run_id":"%s","phase":"END","step":"run_ended"}\n' \
      "$NOW" "$RUN_ID" >> "$LEDGER"
    rm -f "$TMP_DIR/current-run-id.txt" "$TMP_DIR/current-dava-id.txt" "$TMP_DIR/current-ledger-path.txt"
    echo "[progress] Run ended: $RUN_ID"
    ;;

  help|*)
    cat <<EOF
progress_helper.sh — Faz 2 progress ledger yardimcisi

Kullanim:
  $0 init <dava-id>                  -> Yeni run baslat (run_id + ledger)
  $0 log <phase> <step> <json>       -> Ledger'a satir ekle
  $0 still_working <mesaj>           -> Sessizlik kirici heartbeat
  $0 status                          -> Mevcut durum + son 5 olay
  $0 tail                            -> Ledger'i tail -f ile izle
  $0 end                             -> Run'i sonlandir

Ornekler:
  $0 init ahmet-2026-007
  $0 log 2B yargi_search '{"query_no":4,"query_label":"temporal_2024","status":"ok","duration_ms":4384,"result_count":18}'
  $0 still_working "Yargi sonuclarini skorluyorum, 5 sn icinde tam metin adaylari hazir olacak"
  $0 status
  $0 end

Ortam degiskenleri:
  CASE_DIR  -> Dava Drive klasoru (varsa ledger oraya yazilir, yoksa tmp/)
EOF
    ;;
esac

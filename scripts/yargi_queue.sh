#!/usr/bin/env bash
# yargi_queue.sh
# Yargi MCP rate limiter + israrcı backoff helper.
# Director bunu her Yargi MCP cagrisi ONCESI cagirir.
#
# Komutlar:
#   yargi_queue.sh wait              -> Min delay (1.5sn) bekle (last call'dan)
#   yargi_queue.sh on_429            -> 429 alindi, israrcı backoff hesapla
#   yargi_queue.sh reset_429         -> Basarili cagri sonrasi 429 sayacini sifirla
#   yargi_queue.sh status            -> Mevcut state (last call, 429 count, total wait)
#
# State dosyalari (tmp/):
#   yargi-last-call.txt    -> Son MCP cagrisinin unix timestamp'i (ms)
#   yargi-429-attempt.txt  -> Suanki 429 retry sayisi (0 = yok)
#   yargi-total-wait.txt   -> Bu run icin toplam bekleme suresi (ms)

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP_DIR="$REPO_ROOT/tmp"
mkdir -p "$TMP_DIR"

LAST_CALL_FILE="$TMP_DIR/yargi-last-call.txt"
ATTEMPT_FILE="$TMP_DIR/yargi-429-attempt.txt"
TOTAL_WAIT_FILE="$TMP_DIR/yargi-total-wait.txt"

# Min delay sorgular arasi (ms). Test sonucuna gore 1500ms varsayilan.
MIN_DELAY_MS=${YARGI_MIN_DELAY_MS:-1500}

# Israrcı backoff (Avukat karari 2026-05-04: skip YOK)
# 1. fail → 15 sn, 2. → 30, 3. → 60, 4. → 120, 5. → 300, 6+ → ask_user
BACKOFFS_MS=(15000 30000 60000 120000 300000)

now_ms() {
  python -c "import time; print(int(time.time() * 1000))"
}

read_or_default() {
  local file="$1"
  local default="$2"
  if [[ -f "$file" ]]; then
    cat "$file"
  else
    echo "$default"
  fi
}

CMD="${1:-help}"

case "$CMD" in
  wait)
    NOW=$(now_ms)
    LAST=$(read_or_default "$LAST_CALL_FILE" 0)
    ELAPSED=$((NOW - LAST))

    if (( ELAPSED < MIN_DELAY_MS )); then
      WAIT_MS=$((MIN_DELAY_MS - ELAPSED))
      WAIT_SEC=$(python -c "print(f'{$WAIT_MS / 1000:.2f}')")
      sleep "$WAIT_SEC"
      # Total wait'a ekle
      TOTAL=$(read_or_default "$TOTAL_WAIT_FILE" 0)
      echo "$((TOTAL + WAIT_MS))" > "$TOTAL_WAIT_FILE"
      echo "[yargi_queue] ${WAIT_MS}ms bekledi (min_delay=$MIN_DELAY_MS, elapsed=$ELAPSED)" >&2
    fi

    # Yeni call timestamp'i kaydet
    now_ms > "$LAST_CALL_FILE"
    ;;

  on_429)
    ATTEMPT=$(read_or_default "$ATTEMPT_FILE" 0)
    ATTEMPT=$((ATTEMPT + 1))
    echo "$ATTEMPT" > "$ATTEMPT_FILE"

    if (( ATTEMPT > ${#BACKOFFS_MS[@]} )); then
      # 6+ fail → avukat karari gerekiyor
      echo "[yargi_queue] 6+ retry sonrasi 429 ısrarci. AVUKAT KARARI gerekiyor." >&2
      echo "ASK_USER"
      exit 2
    fi

    BACKOFF_MS=${BACKOFFS_MS[$((ATTEMPT - 1))]}
    BACKOFF_SEC=$(python -c "print(f'{$BACKOFF_MS / 1000:.0f}')")

    echo "[yargi_queue] 429 alindi, ${ATTEMPT}. fail. ${BACKOFF_SEC}sn bekleniyor..." >&2
    sleep "$BACKOFF_SEC"

    # Total wait'a ekle
    TOTAL=$(read_or_default "$TOTAL_WAIT_FILE" 0)
    echo "$((TOTAL + BACKOFF_MS))" > "$TOTAL_WAIT_FILE"

    # Last call timestamp'i guncelle (yeni cagriya hazir)
    now_ms > "$LAST_CALL_FILE"

    echo "RETRY"
    ;;

  reset_429)
    # Basarili cagri sonrasi 429 sayacini sifirla
    rm -f "$ATTEMPT_FILE"
    echo "[yargi_queue] 429 sayaci sifirlandi" >&2
    ;;

  status)
    NOW=$(now_ms)
    LAST=$(read_or_default "$LAST_CALL_FILE" 0)
    ELAPSED=$((NOW - LAST))
    ATTEMPT=$(read_or_default "$ATTEMPT_FILE" 0)
    TOTAL=$(read_or_default "$TOTAL_WAIT_FILE" 0)

    echo "Yargi Queue State:"
    echo "  Min delay: ${MIN_DELAY_MS}ms"
    echo "  Last call: $LAST (${ELAPSED}ms elapsed)"
    echo "  429 retry count: $ATTEMPT"
    echo "  Total wait this run: ${TOTAL}ms"
    ;;

  reset)
    rm -f "$LAST_CALL_FILE" "$ATTEMPT_FILE" "$TOTAL_WAIT_FILE"
    echo "[yargi_queue] State sifirlandi"
    ;;

  help|*)
    cat <<EOF
yargi_queue.sh — Yargi MCP rate limiter + israrcı backoff

Kullanim:
  $0 wait        -> MCP cagrisi oncesi bekle (min_delay)
  $0 on_429      -> 429 alindi, backoff bekle, RETRY/ASK_USER doner
  $0 reset_429   -> Basarili cagri sonrasi 429 sayacini sifirla
  $0 status      -> Mevcut state
  $0 reset       -> Tum state'i sifirla

Ortam degiskenleri:
  YARGI_MIN_DELAY_MS  -> Default 1500 (1.5sn)

Director kullanimi:
  # Cagri oncesi
  bash scripts/yargi_queue.sh wait
  # MCP cagrisi yap (Claude tarafindan)
  # Cagri 429 ile dustu ise:
  RESULT=\$(bash scripts/yargi_queue.sh on_429)
  if [[ "\$RESULT" == "RETRY" ]]; then
    # Tekrar dene
  elif [[ "\$RESULT" == "ASK_USER" ]]; then
    # Avukata sor
  fi
  # Basarili sonuc:
  bash scripts/yargi_queue.sh reset_429
EOF
    ;;
esac

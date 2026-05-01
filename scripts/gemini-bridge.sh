#!/usr/bin/env bash
# gemini-bridge.sh
# Claude Director Agent bunu cagirir. Context + prompt template birlestirip
# Gemini CLI'ye yollar, temiz markdown cevabi doner.
#
# Kullanim:
#   scripts/gemini-bridge.sh <task_type> <context_file> <output_file>
#
# Ornek:
#   scripts/gemini-bridge.sh usul_raporu /tmp/dava-ctx.md /tmp/usul-v1.md
#
# Fallback: 2x deneme, sonra exit code 2 -> Claude Director devralir.

set -uo pipefail

TASK_TYPE="${1:-}"
CONTEXT_FILE="${2:-}"
OUTPUT_FILE="${3:-}"

if [[ -z "$TASK_TYPE" || -z "$CONTEXT_FILE" || -z "$OUTPUT_FILE" ]]; then
  echo "KULLANIM: gemini-bridge.sh <task_type> <context_file> <output_file>" >&2
  echo "task_type: kritik_nokta_tespiti|usul_raporu|arastirma_sentezi|dilekce_yazimi|savunma_simulasyonu|revizyon|self_review" >&2
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROMPT_FILE="$REPO_ROOT/prompts/gemini/${TASK_TYPE}.md"

if [[ ! -f "$PROMPT_FILE" ]]; then
  echo "HATA: Prompt sablonu yok: $PROMPT_FILE" >&2
  exit 1
fi
if [[ ! -f "$CONTEXT_FILE" ]]; then
  echo "HATA: Context dosyasi yok: $CONTEXT_FILE" >&2
  exit 1
fi

# Auth kontrolu: Gemini CLI cagirilabiliyor mu?
if ! command -v gemini >/dev/null 2>&1; then
  echo "HATA: gemini CLI bulunamadi. Kurulum: npm install -g @google/gemini-cli" >&2
  exit 3
fi

# Prompt + context birlestir
TMP_INPUT="$(mktemp -t gemini-in-XXXXXX.md)"
trap 'rm -f "$TMP_INPUT"' EXIT

{
  cat "$PROMPT_FILE"
  printf '\n\n---\n\n# GIRDI CONTEXT\n\n'
  cat "$CONTEXT_FILE"
} > "$TMP_INPUT"

# Retry dongusu
MAX_RETRY=2
RETRY_DELAY=5
ATTEMPT=0

# Model listesi: birinci basarisiz/kapasite-yok ise ikinciye dus
# GEMINI_MODEL env var tek model zorlar; bos ise fallback zinciri calisir
if [[ -n "${GEMINI_MODEL:-}" ]]; then
  MODEL_CHAIN=("$GEMINI_MODEL")
else
  MODEL_CHAIN=("gemini-3.1-pro-preview" "gemini-3-flash-preview")
fi
MODEL_IDX=0
GEMINI_MODEL="${MODEL_CHAIN[$MODEL_IDX]}"

while (( ATTEMPT < MAX_RETRY )); do
  ATTEMPT=$((ATTEMPT + 1))
  echo "[gemini-bridge] Deneme $ATTEMPT/$MAX_RETRY ($TASK_TYPE, model=$GEMINI_MODEL)" >&2

  # Gemini CLI: -p ile prompt, stdin ile ek context. Biz hepsini tek dosyada topladik.
  if gemini -m "$GEMINI_MODEL" -p "$(cat "$TMP_INPUT")" > "$OUTPUT_FILE" 2> "${OUTPUT_FILE}.err"; then
    # Auth hatasi kontrolu (OAuth suresi doldu mu?)
    if grep -qiE "auth|login|unauthorized|expired|401" "${OUTPUT_FILE}.err" 2>/dev/null; then
      echo "[gemini-bridge] AUTH HATASI tespit edildi" >&2
      echo "POWERSHELL'DE SU KOMUTU CALISTIR:" >&2
      echo "  gemini /auth" >&2
      echo "Sonra tekrar dene." >&2
      rm -f "${OUTPUT_FILE}.err"
      exit 4
    fi

    # Bos cikti kontrolu
    if [[ ! -s "$OUTPUT_FILE" ]]; then
      echo "[gemini-bridge] Bos cikti, tekrar deneniyor..." >&2
      sleep "$RETRY_DELAY"
      continue
    fi

    # Basarili - metadata header ekle
    RUN_ID="$(date +%Y%m%dT%H%M%S)-$$"
    TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    TMP_OUT="$(mktemp -t gemini-out-XXXXXX.md)"
    {
      echo "---"
      echo "model: $GEMINI_MODEL"
      echo "engine: gemini"
      echo "task_type: $TASK_TYPE"
      echo "run_id: $RUN_ID"
      echo "attempt: $ATTEMPT"
      echo "fallback_used: false"
      echo "timestamp_utc: $TS"
      echo "status: TASLAK"
      echo "---"
      echo
      cat "$OUTPUT_FILE"
    } > "$TMP_OUT"
    mv "$TMP_OUT" "$OUTPUT_FILE"

    # Event log
    LOG_DIR="$REPO_ROOT/logs"
    mkdir -p "$LOG_DIR"
    printf '{"ts":"%s","run_id":"%s","task":"%s","model":"%s","engine":"gemini","attempt":%d,"fallback_used":false,"status":"ok"}\n' \
      "$TS" "$RUN_ID" "$TASK_TYPE" "$GEMINI_MODEL" "$ATTEMPT" >> "$LOG_DIR/model-events.jsonl"

    rm -f "${OUTPUT_FILE}.err"
    echo "[gemini-bridge] BASARILI ($TASK_TYPE, run_id=$RUN_ID)" >&2
    exit 0
  else
    EXIT_CODE=$?
    echo "[gemini-bridge] Deneme $ATTEMPT basarisiz (exit=$EXIT_CODE)" >&2
    cat "${OUTPUT_FILE}.err" >&2 2>/dev/null || true

    # Kapasite hatasi (429 MODEL_CAPACITY_EXHAUSTED) -> bir sonraki modele dus
    # ONCE kapasite, SONRA auth — cunku auth regex "401" 429'u da yakalayabilir
    if grep -qiE "MODEL_CAPACITY_EXHAUSTED|No capacity available|RESOURCE_EXHAUSTED|code: 429|\"code\": *429" "${OUTPUT_FILE}.err" 2>/dev/null; then
      NEXT_IDX=$((MODEL_IDX + 1))
      if (( NEXT_IDX < ${#MODEL_CHAIN[@]} )); then
        MODEL_IDX=$NEXT_IDX
        GEMINI_MODEL="${MODEL_CHAIN[$MODEL_IDX]}"
        ATTEMPT=0
        echo "[gemini-bridge] Kapasite yok, sonraki modele geciliyor: $GEMINI_MODEL" >&2
        continue
      fi
    fi

    # Auth hatasi (kapasite eslesmezse kontrol et)
    if grep -qiE "unauthorized|expired|invalid.credential|401|please log in|OAuth" "${OUTPUT_FILE}.err" 2>/dev/null; then
      echo "[gemini-bridge] AUTH HATASI" >&2
      echo "POWERSHELL'DE SU KOMUTU CALISTIR:" >&2
      echo "  gemini /auth" >&2
      rm -f "${OUTPUT_FILE}.err"
      exit 4
    fi

    if (( ATTEMPT < MAX_RETRY )); then
      sleep "$RETRY_DELAY"
    fi
  fi
done

# 2x fail -> fallback sinyali
TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
RUN_ID="$(date +%Y%m%dT%H%M%S)-$$"
LOG_DIR="$REPO_ROOT/logs"
mkdir -p "$LOG_DIR"
printf '{"ts":"%s","run_id":"%s","task":"%s","model":"%s","engine":"gemini","attempt":%d,"fallback_used":true,"status":"failed"}\n' \
  "$TS" "$RUN_ID" "$TASK_TYPE" "$GEMINI_MODEL" "$MAX_RETRY" >> "$LOG_DIR/model-events.jsonl"

echo "[gemini-bridge] $MAX_RETRY deneme basarisiz. Claude fallback'e yonlendiriliyor. (run_id=$RUN_ID)" >&2
rm -f "${OUTPUT_FILE}.err"
exit 2

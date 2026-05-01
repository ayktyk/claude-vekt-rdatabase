#!/usr/bin/env bash
# hooks/mcp-timing-post.sh
# Production: MCP tool call bitiş timing yakalama
# KVKK: tool_response da YAZILMAZ (müvekkil verisi içerebilir)

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"
LOG_DIR="$PROJECT_DIR/logs"
LOG="$LOG_DIR/mcp-timings.jsonl"

# Profiling kapalıysa atla
PROFILING_FLAG="$PROJECT_DIR/config/profiling.json"
if [ -f "$PROFILING_FLAG" ]; then
  if grep -qE '"enabled"[[:space:]]*:[[:space:]]*false' "$PROFILING_FLAG" 2>/dev/null; then
    exit 0
  fi
fi

mkdir -p "$LOG_DIR"

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | grep -oE '"tool_name"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed -E 's/.*"tool_name"[[:space:]]*:[[:space:]]*"([^"]*)".*/\1/')
TOOL_USE_ID=$(echo "$INPUT" | grep -oE '"tool_use_id"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed -E 's/.*"tool_use_id"[[:space:]]*:[[:space:]]*"([^"]*)".*/\1/')

# tool_response status (success/error) — basit detection
RESPONSE_STATUS="ok"
if echo "$INPUT" | grep -qE '"is_error"[[:space:]]*:[[:space:]]*true'; then
  RESPONSE_STATUS="error"
fi

case "$TOOL_NAME" in
  mcp__*)
    TS_NS=$(date +%s%N)
    ASAMA=$(cat "$PROJECT_DIR/tmp/current-asama.txt" 2>/dev/null | head -1 || echo "unknown")
    DAVA_ID=$(cat "$PROJECT_DIR/tmp/current-dava-id.txt" 2>/dev/null | head -1 || echo "unknown")
    ASAMA=$(echo "$ASAMA" | tr -d '\r\n' | xargs)
    DAVA_ID=$(echo "$DAVA_ID" | tr -d '\r\n' | xargs)

    printf '{"event":"mcp_post","tool":"%s","tool_use_id":"%s","ts_ns":%s,"status":"%s","asama":"%s","dava_id":"%s"}\n' \
      "$TOOL_NAME" "$TOOL_USE_ID" "$TS_NS" "$RESPONSE_STATUS" "$ASAMA" "$DAVA_ID" >> "$LOG"
    ;;
esac

exit 0

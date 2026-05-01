#!/usr/bin/env bash
# hooks/mcp-timing-pre.sh
# Production: MCP tool call başlangıç timing yakalama
# KVKK: tool_input ASLA log'a yazılmaz (müvekkil verisi içerebilir)
# Sadece: tool_name, tool_use_id, ts_ns, asama, dava_id

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"
LOG_DIR="$PROJECT_DIR/logs"
LOG="$LOG_DIR/mcp-timings.jsonl"

# Profiling kapalıysa hemen çık (rollback)
PROFILING_FLAG="$PROJECT_DIR/config/profiling.json"
if [ -f "$PROFILING_FLAG" ]; then
  # "enabled": false ise atla. Default açık (yoksa veya true ise log'la)
  if grep -qE '"enabled"[[:space:]]*:[[:space:]]*false' "$PROFILING_FLAG" 2>/dev/null; then
    exit 0
  fi
fi

mkdir -p "$LOG_DIR"

# Stdin JSON'dan tool_name ve tool_use_id extract et (jq olmayabilir, grep+sed ile)
INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | grep -oE '"tool_name"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed -E 's/.*"tool_name"[[:space:]]*:[[:space:]]*"([^"]*)".*/\1/')
TOOL_USE_ID=$(echo "$INPUT" | grep -oE '"tool_use_id"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed -E 's/.*"tool_use_id"[[:space:]]*:[[:space:]]*"([^"]*)".*/\1/')

# Sadece MCP tool'ları logla (Bash, Read, Edit gibi diğer tool'ları atla)
case "$TOOL_NAME" in
  mcp__*)
    TS_NS=$(date +%s%N)

    # ASAMA ve DAVA_ID dosya tabanlı (env var hook'a gelmez)
    ASAMA=$(cat "$PROJECT_DIR/tmp/current-asama.txt" 2>/dev/null | head -1 || echo "unknown")
    DAVA_ID=$(cat "$PROJECT_DIR/tmp/current-dava-id.txt" 2>/dev/null | head -1 || echo "unknown")

    # Trim whitespace
    ASAMA=$(echo "$ASAMA" | tr -d '\r\n' | xargs)
    DAVA_ID=$(echo "$DAVA_ID" | tr -d '\r\n' | xargs)

    # JSONL satırı yaz (KVKK: tool_input YAZILMAZ)
    printf '{"event":"mcp_pre","tool":"%s","tool_use_id":"%s","ts_ns":%s,"asama":"%s","dava_id":"%s"}\n' \
      "$TOOL_NAME" "$TOOL_USE_ID" "$TS_NS" "$ASAMA" "$DAVA_ID" >> "$LOG"
    ;;
esac

# Asla blok etme
exit 0

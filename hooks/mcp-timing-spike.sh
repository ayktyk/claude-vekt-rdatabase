#!/usr/bin/env bash
# hooks/mcp-timing-spike.sh
# SPIKE — Faz 1.0: Hook'lar MCP tool call'larini deterministik yakaliyor mu?
# Test amacli: tum env var + stdin + arg payload'unu tmp/hook-spike.log'a dump eder.
# Production'a gecmeden once mcp-timing-pre.sh ve mcp-timing-post.sh ile degistirilecek.

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-C:/Users/user/Desktop/projelerim/aktif projeler/Vektör Database li Otomasyon Claude Code}"
LOG="$PROJECT_DIR/tmp/hook-spike.log"
mkdir -p "$(dirname "$LOG")"

# Stdin'i tut
STDIN_DATA=""
if [ ! -t 0 ]; then
  STDIN_DATA=$(cat)
fi

{
  echo "════════════════════════════════════════════════════════════════"
  echo "TS_NS:        $(date +%s%N)"
  echo "TS_ISO:       $(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)"
  echo "ARGS:         $*"
  echo "ENV CLAUDE_TOOL_NAME:  '${CLAUDE_TOOL_NAME:-(empty)}'"
  echo "ENV CLAUDE_TOOL_INPUT: '${CLAUDE_TOOL_INPUT:0:200}'"
  echo "ENV TOOL_NAME:         '${TOOL_NAME:-(empty)}'"
  echo "ENV TOOL_USE_ID:       '${TOOL_USE_ID:-(empty)}'"
  echo "ENV CLAUDE_PROJECT_DIR:'${CLAUDE_PROJECT_DIR:-(empty)}'"
  echo "ENV ASAMA:             '${ASAMA:-(empty)}'"
  echo "ENV DAVA_ID:           '${DAVA_ID:-(empty)}'"
  echo "STDIN (first 500 chars):"
  echo "${STDIN_DATA:0:500}"
  echo "ALL CLAUDE_* env vars:"
  env | grep '^CLAUDE_' | sort || echo "  (none)"
  echo ""
} >> "$LOG"

# Asla blok etme, sadece log
exit 0

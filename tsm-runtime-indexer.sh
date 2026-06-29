#!/usr/bin/env bash
set -euo pipefail

echo "======================================"
echo "TSM RUNTIME INDEXER (LIGHTWEIGHT CORE FIX)"
echo "======================================"

OUT="./_tsm_runtime_index"
mkdir -p "$OUT"

INDEX="$OUT/file-index.txt"
SCRIPT_INDEX="$OUT/script-index.txt"
HTML_INDEX="$OUT/html-index.txt"

echo "[1/3] Building file index (FAST PASS ONLY)..."

# LIMIT scope to avoid freeze
find . -type f -name "*.js" -o -name "*.html" \
  ! -path "./node_modules/*" \
  ! -path "./.git/*" \
  | head -n 5000 > "$INDEX"

echo "[2/3] Extracting script references (bounded scan)..."

> "$SCRIPT_INDEX"
> "$HTML_INDEX"

while read -r file; do
  if [[ "$file" == *.html ]]; then
    grep "<script" "$file" 2>/dev/null >> "$HTML_INDEX" || true
  fi

  if [[ "$file" == *.js ]]; then
    grep "document\|window\|require" "$file" 2>/dev/null >> "$SCRIPT_INDEX" || true
  fi

done < "$INDEX"

echo "[3/3] Generating summary metrics..."

TOTAL_FILES=$(wc -l < "$INDEX" || true)
TOTAL_SCRIPTS=$(wc -l < "$SCRIPT_INDEX" || true)
TOTAL_HTML_SCRIPTS=$(wc -l < "$HTML_INDEX" || true)

{
  echo "TSM RUNTIME INDEX REPORT"
  echo "========================"
  echo ""
  echo "Indexed files: $TOTAL_FILES"
  echo "JS runtime signals: $TOTAL_SCRIPTS"
  echo "HTML script signals: $TOTAL_HTML_SCRIPTS"
} > "$OUT/index-report.txt"

echo "======================================"
echo "INDEX COMPLETE (NO FREEZE ZONE)"
echo "======================================"
echo "Report: $OUT/index-report.txt"
echo "======================================"
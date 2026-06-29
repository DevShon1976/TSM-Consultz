#!/usr/bin/env bash
set -euo pipefail

echo "======================================"
echo "TSM SAFE INDEXER (NO FREEZE VERSION)"
echo "======================================"

OUT="./_tsm_safe_index"
mkdir -p "$OUT"

INDEX="$OUT/index.txt"
REPORT="$OUT/report.txt"

> "$INDEX"

echo "[1/4] Scanning top-level directories only..."

# LIMIT DEPTH (THIS IS THE FIX)
for dir in */; do
  [[ "$dir" == "node_modules/" ]] && continue
  [[ "$dir" == ".git/" ]] && continue

  find "$dir" -maxdepth 2 -type f \( -name "*.js" -o -name "*.html" \) 2>/dev/null >> "$INDEX" || true
done

echo "[2/4] Counting safe file sets..."

TOTAL=$(wc -l < "$INDEX" || true)

JS_COUNT=$(grep "\.js$" "$INDEX" | wc -l || true)
HTML_COUNT=$(grep "\.html$" "$INDEX" | wc -l || true)

echo "[3/4] Lightweight signal scan..."

BROWSER_SIGNALS=0
NODE_SIGNALS=0

while read -r file; do
  [[ ! -f "$file" ]] && continue

  if grep -q "document\|window" "$file" 2>/dev/null; then
    BROWSER_SIGNALS=$((BROWSER_SIGNALS+1))
  fi

  if grep -q "require(\|module.exports" "$file" 2>/dev/null; then
    NODE_SIGNALS=$((NODE_SIGNALS+1))
  fi
done < "$INDEX"

echo "[4/4] Writing report..."

{
  echo "TSM SAFE INDEX REPORT"
  echo "====================="
  echo ""
  echo "Total files indexed: $TOTAL"
  echo "JS files: $JS_COUNT"
  echo "HTML files: $HTML_COUNT"
  echo ""
  echo "Browser signals: $BROWSER_SIGNALS"
  echo "Node signals: $NODE_SIGNALS"
} > "$REPORT"

echo "======================================"
echo "SAFE INDEX COMPLETE"
echo "======================================"
echo "Report: $REPORT"
echo "======================================"
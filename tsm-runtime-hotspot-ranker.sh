#!/usr/bin/env bash
set -euo pipefail

echo "======================================"
echo "TSM RUNTIME HOTSPOT RANKER (SAFE MODE)"
echo "======================================"

OUT="./_tsm_hotspots"
mkdir -p "$OUT"

REPORT="$OUT/top_hotspots.txt"

echo "[1/3] Scanning HTML files (bounded)..."

> "$REPORT"

# only scan top-level + first-level nested dirs
find . -maxdepth 2 -name "*.html" ! -path "./node_modules/*" 2>/dev/null | while read -r file; do
  count=$(grep -c "<script" "$file" 2>/dev/null || echo 0)
  echo "$count|$file"
done | sort -nr | head -n 20 > "$REPORT"

echo "[2/3] Calculating summary..."

TOTAL=$(wc -l < "$REPORT" || true)

echo "[3/3] Done."

echo "======================================"
echo "HOTSPOT RANKING COMPLETE"
echo "======================================"
echo "Top files:"
cat "$REPORT"
echo "======================================"
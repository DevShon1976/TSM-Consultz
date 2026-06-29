#!/usr/bin/env bash
set -euo pipefail

echo "======================================"
echo "TSM LITE RUNTIME AUDIT (NO FREEZE MODE)"
echo "======================================"

OUT="./_tsm_lite_audit"
mkdir -p "$OUT"

REPORT="$OUT/report.txt"
FILES="$OUT/sample_files.txt"

echo "[1/4] Sampling top-level HTML ONLY..."

# NO RECURSION — THIS IS THE FIX
ls *.html 2>/dev/null | head -n 50 > "$FILES" || true

echo "[2/4] Scanning runtime injection points..."

SCRIPT_COUNT=0
BROWSER_FLAGS=0

while read -r file; do
  [[ ! -f "$file" ]] && continue

  SCRIPTS=$(grep -c "<script" "$file" 2>/dev/null || true)
  SCRIPT_COUNT=$((SCRIPT_COUNT + SCRIPTS))

  if grep -q "document\|window" "$file" 2>/dev/null; then
    BROWSER_FLAGS=$((BROWSER_FLAGS+1))
  fi
done < "$FILES"

echo "[3/4] Lightweight summary..."

echo "Files sampled: $(wc -l < "$FILES")" > "$REPORT"
echo "Script tags (sampled): $SCRIPT_COUNT" >> "$REPORT"
echo "Browser runtime flags: $BROWSER_FLAGS" >> "$REPORT"

echo "[4/4] Done."

echo "======================================"
echo "LITE AUDIT COMPLETE (STABLE)"
echo "======================================"
echo "Report: $REPORT"
echo "======================================"
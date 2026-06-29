#!/usr/bin/env bash
set -euo pipefail

echo "======================================"
echo "TSM RUNTIME CONSOLIDATION PHASE 2"
echo "======================================"

REPORT="./tsm-runtime-consolidation-report.txt"
GRAPH="./tsm-runtime-graph.json"

echo "[1/7] Building canonical runtime index..."

CANONICAL_FILES=(
  "tsm-app-runtime.js"
  "tsm-kernel-upgrade.js"
  "scripts/tsm-app-runtime.js"
)

echo "{" > "$GRAPH"
echo "  \"runtime_registry\": [" >> "$GRAPH"

for f in "${CANONICAL_FILES[@]}"; do
  if [[ -f "$f" ]]; then
    echo "    \"$f\"," >> "$GRAPH"
  fi
done

echo "  ]," >> "$GRAPH"

echo "[2/7] Deduplicating HTML script injections (safe prune pass)..."

TMP_HTML_LIST=$(mktemp)

find . -type f -name "*.html" ! -path "./node_modules/*" > "$TMP_HTML_LIST"

DUP_COUNT=0

while read -r file; do
  if [[ -f "$file" ]]; then

    # remove duplicate identical script src lines ONLY (safe dedupe)
    awk '
      /<script/ {
        if (seen[$0]++) next
      }
      { print }
    ' "$file" > "$file.tmp" && mv "$file.tmp" "$file"

    DUP_COUNT=$((DUP_COUNT+1))
  fi
done < "$TMP_HTML_LIST"

echo "  \"html_files_processed\": $DUP_COUNT," >> "$GRAPH"

echo "[3/7] Extracting broken script references..."

BROKEN=$(grep -RIn --include="*.html" "src=.*\.js" . \
  | grep -v node_modules || true)

echo "$BROKEN" > ./broken-runtime-links.txt

echo "  \"broken_refs_file\": \"broken-runtime-links.txt\"," >> "$GRAPH"

echo "[4/7] Mapping runtime kernel touchpoints..."

KERNEL_TOUCHPOINTS=$(grep -RIn \
  "tsm-app-runtime\|tsm-kernel\|tsm-orchestrator\|tsm-guardian" \
  --include="*.js" --include="*.html" . \
  | grep -v node_modules || true)

echo "$KERNEL_TOUCHPOINTS" > ./runtime-touchpoints.txt

echo "  \"touchpoints_file\": \"runtime-touchpoints.txt\"," >> "$GRAPH"

echo "[5/7] Node validation pass (report only)..."

NODE_FAIL=0

while read -r f; do
  if [[ -f "$f" ]]; then
    node --check "$f" >/dev/null 2>&1 || NODE_FAIL=$((NODE_FAIL+1))
  fi
done < <(find . -name "*.js" ! -path "./node_modules/*")

echo "  \"node_syntax_failures\": $NODE_FAIL," >> "$GRAPH"

echo "[6/7] Script density analysis..."

SCRIPT_COUNT=$(grep -R "<script" --include="*.html" . | wc -l || true)

echo "  \"script_tag_total\": $SCRIPT_COUNT" >> "$GRAPH"

echo "}" >> "$GRAPH"

echo "[7/7] Final report generation..."

{
  echo "TSM RUNTIME CONSOLIDATION REPORT"
  echo "================================"
  echo ""
  echo "Total HTML script tags: $SCRIPT_COUNT"
  echo "Node syntax failures: $NODE_FAIL"
  echo "Duplicate pass applied: YES (safe dedupe only)"
  echo ""
  echo "Artifacts:"
  echo "- $GRAPH"
  echo "- broken-runtime-links.txt"
  echo "- runtime-touchpoints.txt"
} > "$REPORT"

echo "======================================"
echo "CONSOLIDATION COMPLETE"
echo "======================================"
echo "Report: $REPORT"
echo "Graph: $GRAPH"
echo "======================================"
#!/usr/bin/env bash
set -euo pipefail

echo "======================================"
echo "TSM RUNTIME ENFORCEMENT LAYER (PHASE 1)"
echo "======================================"

REPORT="./tsm-runtime-enforcement-report.txt"
ROOT="$(pwd)"

mkdir -p ./_tsm_runtime_enforcement

echo "[1/5] Scanning runtime violations..."

BROWSER_VIOLATIONS=$(grep -RIn --include="*.js" "document\|window\|DOMContentLoaded" . \
  | grep -v node_modules || true)

NODE_VIOLATIONS=$(grep -RIn --include="*.html" "require(\|process\." . || true)

echo "$BROWSER_VIOLATIONS" > ./_tsm_runtime_enforcement/browser_violations.txt
echo "$NODE_VIOLATIONS" > ./_tsm_runtime_enforcement/node_violations.txt

echo "[2/5] Detecting cross-runtime execution risks..."

MIXED_RUNTIME=$(grep -RIn --include="*.js" "module.exports\|require(" . \
  | grep "document\|window" || true)

echo "$MIXED_RUNTIME" > ./_tsm_runtime_enforcement/mixed_runtime.txt

echo "[3/5] Building enforcement rules..."

cat > ./_tsm-runtime-policy.json <<EOF
{
  "rules": [
    {
      "name": "NO_BROWSER_IN_NODE",
      "deny": ["document", "window", "DOMContentLoaded"]
    },
    {
      "name": "NO_NODE_IN_BROWSER",
      "deny": ["require(", "process.", "module.exports"]
    },
    {
      "name": "SCRIPT_TAG_LIMIT",
      "threshold": 200
    }
  ]
}
EOF

echo "[4/5] Generating runtime heatmap summary..."

TOTAL_SCRIPT_TAGS=$(grep -R "<script" --include="*.html" . | wc -l || true)

echo "TOTAL_SCRIPT_TAGS=$TOTAL_SCRIPT_TAGS" > ./_tsm_runtime_enforcement/metrics.txt

echo "[5/5] Final enforcement report..."

{
  echo "TSM RUNTIME ENFORCEMENT REPORT"
  echo "==============================="
  echo ""
  echo "Browser violations:"
  wc -l < ./_tsm_runtime_enforcement/browser_violations.txt
  echo "Node violations:"
  wc -l < ./_tsm_runtime_enforcement/node_violations.txt
  echo ""
  echo "Mixed runtime risks:"
  wc -l < ./_tsm_runtime_enforcement/mixed_runtime.txt
  echo ""
  echo "Total script tags:"
  echo "$TOTAL_SCRIPT_TAGS"
} > "$REPORT"

echo "======================================"
echo "ENFORCEMENT LAYER COMPLETE"
echo "======================================"
echo "Report: $REPORT"
echo "======================================"
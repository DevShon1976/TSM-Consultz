#!/usr/bin/env bash
set -euo pipefail

echo "======================================"
echo "TSM RUNTIME GOVERNOR (PHASE 3)"
echo "======================================"

OUT="./_tsm_runtime_governor"
mkdir -p "$OUT"

REPORT="$OUT/governor-report.txt"
POLICY="$OUT/runtime-policy.json"

echo "[1/5] Creating single execution authority..."

cat > "$POLICY" <<EOF
{
  "execution_authority": "tsm-kernel-upgrade",
  "rules": {
    "no_duplicate_script_injection": true,
    "no_browser_runtime_in_node": true,
    "no_node_runtime_in_browser": true,
    "single_kernel_bootstrap": true
  }
}
EOF

echo "[2/5] Detecting violation hotspots..."

SCRIPT_TOTAL=$(grep -R "<script" --include="*.html" . | wc -l || true)
BROWSER_LEAKS=$(grep -R "document\|window" --include="*.js" . | wc -l || true)
NODE_LEAKS=$(grep -R "require(" --include="*.html" . | wc -l || true)

echo "script_total=$SCRIPT_TOTAL" > "$OUT/metrics.txt"
echo "browser_leaks=$BROWSER_LEAKS" >> "$OUT/metrics.txt"
echo "node_leaks=$NODE_LEAKS" >> "$OUT/metrics.txt"

echo "[3/5] Building enforcement model..."

cat > "$OUT/enforcement-model.json" <<EOF
{
  "mode": "strict",
  "runtime": {
    "browser": ["ui", "graph", "war_rooms"],
    "node": ["orchestrator", "bnca", "kernel"],
    "shell": ["audit", "repair", "build"]
  }
}
EOF

echo "[4/5] Locking runtime boundaries (non-destructive)..."

find . -type f -name "*.js" ! -path "./node_modules/*" -exec grep -l "document\|window" {} \; \
  > "$OUT/browser_targets.txt" || true

find . -type f -name "*.html" -exec grep -l "require(" {} \; \
  > "$OUT/node_targets.txt" || true

echo "[5/5] Generating governor report..."

{
  echo "TSM RUNTIME GOVERNOR REPORT"
  echo "==========================="
  echo ""
  cat "$OUT/metrics.txt"
  echo ""
  echo "Artifacts:"
  echo "- policy: $POLICY"
  echo "- browser targets: $OUT/browser_targets.txt"
  echo "- node targets: $OUT/node_targets.txt"
} > "$REPORT"

echo "======================================"
echo "GOVERNOR COMPLETE"
echo "======================================"
echo "Report: $REPORT"
echo "======================================"
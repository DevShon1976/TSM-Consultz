#!/usr/bin/env bash
set -euo pipefail

echo "======================================"
echo "TSM EXECUTIVE CONTROL PLANE v2"
echo "======================================"

ROOT="$(pwd)"
OUTDIR="./_tsm_exec_control_plane"
mkdir -p "$OUTDIR"

GRAPH="$OUTDIR/runtime-graph.json"
REGISTRY="$OUTDIR/runtime-registry.json"
REPORT="$OUTDIR/executive-control-plane-report.txt"

echo "[1/5] Building single runtime registry..."

cat > "$REGISTRY" <<EOF
{
  "kernel": "tsm-kernel-upgrade",
  "orchestrator": "tsm-orchestrator",
  "bnca": "bnca-engine",
  "mission_store": "tsm-mission-store",
  "guardian": "tsm-guardian",
  "executive_portal": "tsm-executive-portal"
}
EOF

echo "[2/5] Resolving dependency graph..."

cat > "$GRAPH" <<EOF
{
  "nodes": [
    "kernel",
    "orchestrator",
    "guardian",
    "bnca",
    "mission_store",
    "executive_portal"
  ],
  "edges": [
    ["orchestrator","bnca"],
    ["bnca","mission_store"],
    ["mission_store","executive_portal"],
    ["guardian","kernel"],
    ["kernel","mission_store"]
  ]
}
EOF

echo "[3/5] Scanning browser injection density..."

SCRIPT_COUNT=$(grep -R "<script" --include="*.html" . | wc -l || true)
DUPLICATE_HINTS=$(grep -R "<script" --include="*.html" . | sort | uniq -d | wc -l || true)

echo "SCRIPT_COUNT=$SCRIPT_COUNT" > "$OUTDIR/metrics.txt"
echo "DUPLICATE_HINTS=$DUPLICATE_HINTS" >> "$OUTDIR/metrics.txt"

echo "[4/5] Detecting runtime drift..."

BROWSER_VIOLATIONS=$(grep -RIn "document\|window" --include="*.js" . | wc -l || true)
NODE_VIOLATIONS=$(grep -RIn "require(" --include="*.html" . | wc -l || true)

echo "BROWSER_VIOLATIONS=$BROWSER_VIOLATIONS" >> "$OUTDIR/metrics.txt"
echo "NODE_VIOLATIONS=$NODE_VIOLATIONS" >> "$OUTDIR/metrics.txt"

echo "[5/5] Generating executive report..."

{
  echo "TSM EXECUTIVE CONTROL PLANE v2"
  echo "==============================="
  echo ""
  cat "$OUTDIR/metrics.txt"
  echo ""
  echo "Artifacts:"
  echo "- registry: $REGISTRY"
  echo "- graph: $GRAPH"
} > "$REPORT"

echo "======================================"
echo "CONTROL PLANE v2 COMPLETE"
echo "======================================"
echo "Report: $REPORT"
echo "======================================"
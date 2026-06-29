#!/usr/bin/env bash
set -euo pipefail

echo "======================================"
echo "TSM RUNTIME CONTROL PLANE BOOTSTRAP"
echo "======================================"

ROOT="$(pwd)"
REPORT="./tsm-control-plane-report.txt"
GRAPH="./tsm-exec-runtime-graph.json"

mkdir -p ./_tsm_runtime_control

echo "[1/6] Detecting runtime contexts..."

BROWSER_FILES=$(mktemp)
NODE_FILES=$(mktemp)
SHELL_FILES=$(mktemp)

find . -type f -name "*.js" ! -path "./node_modules/*" | while read -r f; do
  if grep -q "document\|window\|DOMContentLoaded" "$f" 2>/dev/null; then
    echo "$f" >> "$BROWSER_FILES"
  elif grep -q "require(\|module.exports\|process\." "$f" 2>/dev/null; then
    echo "$f" >> "$NODE_FILES"
  else
    echo "$f" >> "$NODE_FILES"
  fi
done

echo "[2/6] Building runtime graph..."

cat > "$GRAPH" <<EOF
{
  "nodes": [
    {"id":"kernel","type":"node"},
    {"id":"orchestrator","type":"node"},
    {"id":"guardian","type":"node"},
    {"id":"bnca","type":"node"},
    {"id":"missions","type":"node"},
    {"id":"exec","type":"browser"},
    {"id":"runtime-graph","type":"browser"}
  ],
  "edges": [
    {"from":"orchestrator","to":"bnca"},
    {"from":"bnca","to":"exec"},
    {"from":"kernel","to":"missions"},
    {"from":"guardian","to":"kernel"},
    {"from":"missions","to":"exec"}
  ]
}
EOF

echo "[3/6] Detecting runtime contamination (non-breaking)..."

MIXED=$(grep -RIn --include="*.js" "document\|window" . | grep "node_modules" -v || true)
NODE_IN_BROWSER=$(grep -RIn --include="*.html" "require(" . || true)

echo "$MIXED" > ./_tsm_runtime_control/browser_contamination.txt
echo "$NODE_IN_BROWSER" > ./_tsm_runtime_control/node_in_browser.txt

echo "[4/6] Script injection hotspots..."

grep -RIn --include="*.html" "<script" . | grep -v node_modules > ./_tsm_runtime_control/script_hotspots.txt || true

echo "[5/6] Safe guard injection into executive graph..."

GRAPH_JS="./tsm-exec-runtime-graph.js"

if [[ -f "$GRAPH_JS" ]]; then
  if ! grep -q "TSM_RUNTIME_GUARD" "$GRAPH_JS"; then
    cat > ./_tsm_guard_snippet.js <<'EOF'
// TSM_RUNTIME_GUARD
(function () {
  if (typeof window === "undefined" || typeof document === "undefined") {
    console.warn("[TSM] Browser runtime graph skipped in non-browser environment.");
    return;
  }
})();
EOF

    # prepend guard safely
    cat ./_tsm_guard_snippet.js "$GRAPH_JS" > ./_tmp && mv ./_tmp "$GRAPH_JS"
  fi
fi

echo "[6/6] Report generation..."

{
  echo "TSM CONTROL PLANE REPORT"
  echo "========================"
  echo ""
  echo "Browser-mode JS files:"
  wc -l < "$BROWSER_FILES"
  echo ""
  echo "Node-mode JS files:"
  wc -l < "$NODE_FILES"
  echo ""
  echo "Artifacts:"
  echo "- runtime graph: $GRAPH"
  echo "- browser contamination log: ./_tsm_runtime_control/browser_contamination.txt"
  echo "- script hotspots: ./_tsm_runtime_control/script_hotspots.txt"
} > "$REPORT"

echo "======================================"
echo "CONTROL PLANE BOOTSTRAP COMPLETE"
echo "======================================"
echo "Report: $REPORT"
echo "Graph: $GRAPH"
echo "======================================"
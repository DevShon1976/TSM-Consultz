#!/bin/bash
set -euo pipefail

echo "════════════════════════════════════════════════════════════════"
echo "  TSM DIAGNOSTIC  ·  $(date '+%Y-%m-%d %H:%M:%S')"
echo "════════════════════════════════════════════════════════════════"

echo ""
echo "── 1 · MUSIC COMMAND FILES ─────────────────────────────────────"
for f in how-to-guide.html marketing.html index.html; do
  p="/workspaces/tsm-shell/html/music-command/$f"
  [ -f "$p" ] && echo "  ✓ $f" || echo "  ✗ MISSING: $f"
done

echo ""
echo "── 2 · MUSIC /music ROUTE IN SERVER.JS ─────────────────────────"
grep -n "music" /workspaces/tsm-shell/html/server.js | grep -v "^[0-9]*:.*\/\/" | head -10

echo ""
echo "── 3 · FINOPS OPERATIONS — switchMod + data-tsm-args ───────────"
grep -n "switchMod\|data-tsm-args" /workspaces/tsm-shell/html/finops-suite/finops-operations.html | head -20

echo ""
echo "── 4 · FINOPS OPERATIONS — JS syntax context (look for bad commas) ─"
grep -n "tsm-args.*,\|function.*,\b" /workspaces/tsm-shell/html/finops-suite/finops-operations.html | head -15

echo ""
echo "── 5 · COMPLIANCE (INS) — nav button patterns ──────────────────"
grep -n 'class=".*btn\|data-tab\|onclick\|switchTab\|switchMod\|nav-' \
  /workspaces/tsm-shell/html/tsm-insurance/compliance.html | head -15

echo ""
echo "── 6 · CONSTRUCTION HUB — nav button patterns ──────────────────"
grep -n 'class=".*btn\|data-tab\|onclick\|switchTab\|switchMod\|nav-' \
  /workspaces/tsm-shell/html/construction-suite/construction-hub.html | head -15

echo ""
echo "── 7 · HEALTHCARE COMMAND — nav button patterns ────────────────"
grep -n 'class=".*btn\|data-tab\|onclick\|switchTab\|switchMod\|nav-' \
  /workspaces/tsm-shell/html/healthcare-command.html | head -15

echo ""
echo "── 8 · FINOPS MAIN STRATEGIST — nav button patterns ────────────"
grep -n 'class=".*btn\|data-tab\|onclick\|switchTab\|switchMod\|nav-' \
  /workspaces/tsm-shell/html/finops-suite/finops-main-strategist.html | head -15

echo ""
echo "── 9 · INS HUB — overflow:hidden on .content ───────────────────"
grep -n "overflow.*hidden\|\.content" \
  /workspaces/tsm-shell/html/tsm-insurance/ins-hub.html | head -10

echo ""
echo "── 10 · FINOPS OPERATIONS — panel overflow + flex:1 ────────────"
grep -n "overflow\|flex:1\|flex: 1\|min-height" \
  /workspaces/tsm-shell/html/finops-suite/finops-operations.html | head -15

echo ""
echo "── 11 · /api/groq ROUTE EXISTS? ────────────────────────────────"
grep -n "api/groq\b" /workspaces/tsm-shell/html/server.js | head -5 \
  || echo "  ✗ NOT FOUND — needs adding"

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  DIAGNOSTIC COMPLETE"
echo "════════════════════════════════════════════════════════════════"

echo ""
echo "── 12 · COMPLIANCE INS — full nav area (first 50 lines of body) ─"
grep -n "nav\|btn\|tab\|switch\|click\|href" \
  /workspaces/tsm-shell/html/tsm-insurance/compliance.html | head -20

echo ""
echo "── 13 · CONSTRUCTION HUB — same ────────────────────────────────"
grep -n "nav\|btn\|tab\|switch\|click\|href" \
  /workspaces/tsm-shell/html/construction-suite/construction-hub.html | head -20

echo ""
echo "── 14 · FINOPS MAIN STRATEGIST — same ──────────────────────────"
grep -n "nav\|btn\|tab\|switch\|click\|href" \
  /workspaces/tsm-shell/html/finops-suite/finops-main-strategist.html | head -20

echo ""
echo "── 15 · HEALTHCARE COMMAND — same ──────────────────────────────"
grep -n "nav\|btn\|tab\|switch\|click\|href" \
  /workspaces/tsm-shell/html/healthcare-command.html | head -20

echo ""
echo "── 16 · TSM-APP-RUNTIME — how does it eval data-tsm-args ────────"
grep -n "tsm-args\|eval\|apply\|call\b\|Function" \
  /workspaces/tsm-shell/html/tsm-app-runtime.js | head -20

echo ""
echo "── 17 · FINOPS OPS — module div IDs ────────────────────────────"
grep -n 'id="mod-' /workspaces/tsm-shell/html/finops-suite/finops-operations.html

echo ""
echo "── 18 · FINOPS OPS — panel container overflow CSS ───────────────"
grep -n "\.module\b\|#mod-\|overflow\|main-content\|\.content\b" \
  /workspaces/tsm-shell/html/finops-suite/finops-operations.html | head -20

echo ""
echo "── 12 · COMPLIANCE INS — full nav area (first 50 lines of body) ─"
grep -n "nav\|btn\|tab\|switch\|click\|href" \
  /workspaces/tsm-shell/html/tsm-insurance/compliance.html | head -20

echo ""
echo "── 13 · CONSTRUCTION HUB — same ────────────────────────────────"
grep -n "nav\|btn\|tab\|switch\|click\|href" \
  /workspaces/tsm-shell/html/construction-suite/construction-hub.html | head -20

echo ""
echo "── 14 · FINOPS MAIN STRATEGIST — same ──────────────────────────"
grep -n "nav\|btn\|tab\|switch\|click\|href" \
  /workspaces/tsm-shell/html/finops-suite/finops-main-strategist.html | head -20

echo ""
echo "── 15 · HEALTHCARE COMMAND — same ──────────────────────────────"
grep -n "nav\|btn\|tab\|switch\|click\|href" \
  /workspaces/tsm-shell/html/healthcare-command.html | head -20

echo ""
echo "── 16 · TSM-APP-RUNTIME — how does it eval data-tsm-args ────────"
grep -n "tsm-args\|eval\|apply\|call\b\|Function" \
  /workspaces/tsm-shell/html/tsm-app-runtime.js | head -20

echo ""
echo "── 17 · FINOPS OPS — module div IDs ────────────────────────────"
grep -n 'id="mod-' /workspaces/tsm-shell/html/finops-suite/finops-operations.html

echo ""
echo "── 18 · FINOPS OPS — panel container overflow CSS ───────────────"
grep -n "\.module\b\|#mod-\|overflow\|main-content\|\.content\b" \
  /workspaces/tsm-shell/html/finops-suite/finops-operations.html | head -20

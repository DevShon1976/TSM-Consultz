#!/bin/bash
# TSM FULL FIX APPLICATOR
# Run from repo root: bash apply_all_fixes.sh
set -e

REPO_ROOT="$(pwd)"
CORE_DIR="$REPO_ROOT/html/js/core"
echo "======================================"
echo " TSM AUTO-PIPELINE — FULL FIX APPLY"
echo "======================================"

# ─── STEP 1: Install tsm-auto-pipeline.js ─────────────────────────────────
echo ""
echo "[1/5] Installing tsm-auto-pipeline.js → html/js/core/"
cp "$REPO_ROOT/tsm-auto-pipeline.js" "$CORE_DIR/tsm-auto-pipeline.js" 2>/dev/null || {
  echo "  ERROR: Could not copy. Is tsm-auto-pipeline.js in repo root?"
  exit 1
}
echo "  ✅ tsm-auto-pipeline.js installed"

# ─── STEP 2: HC War Room — add AUTO_RUN block ─────────────────────────────
echo ""
echo "[2/5] Patching HC Denial War Room auto-run..."
HC_FILE="$REPO_ROOT/html/healthcare/hc-denial-war-room.html"
if grep -q "TSM AUTO-RUN" "$HC_FILE"; then
  echo "  ⏭  Already has AUTO-RUN block — skipping"
else
  # Inject before </body>
  sed -i 's|</body>|<script>\n/* TSM AUTO-RUN WAR ROOM */\n(function(){\n  try {\n    const raw = sessionStorage.getItem("TSM_HC_WAR_RELAY") || localStorage.getItem("TSM_HC_WAR_RELAY") || localStorage.getItem("tsm_hc_war_relay");\n    if (!raw) return;\n    if (localStorage.getItem("tsm_auto_mode") === "off") return;\n    if (localStorage.getItem("TSM_AUTO_LAUNCH") === "false") return;\n    setTimeout(() => { if (typeof runPipeline === "function") runPipeline(); }, 1500);\n  } catch(e) { console.warn("[TSM AutoRun HC]", e); }\n})();\n</script>\n</body>|' "$HC_FILE"
  echo "  ✅ HC war room AUTO-RUN block injected"
fi

# ─── STEP 3: BPO Situation Room — add AUTO_RUN block ─────────────────────
echo ""
echo "[3/5] Patching BPO Situation Room auto-run..."
BPO_ROOM="$REPO_ROOT/html/bpo/bpo-situation-room.html"
if [ ! -f "$BPO_ROOM" ]; then
  BPO_ROOM="$REPO_ROOT/html/bpo-situation-room.html"
fi
if grep -q "TSM AUTO-RUN" "$BPO_ROOM" 2>/dev/null; then
  echo "  ⏭  Already has AUTO-RUN block — skipping"
elif [ -f "$BPO_ROOM" ]; then
  sed -i 's|</body>|<script>\n/* TSM AUTO-RUN WAR ROOM */\n(function(){\n  try {\n    const raw = sessionStorage.getItem("TSM_BPO_WAR_RELAY") || localStorage.getItem("TSM_BPO_WAR_RELAY");\n    if (!raw) return;\n    if (localStorage.getItem("tsm_auto_mode") === "off") return;\n    if (localStorage.getItem("TSM_AUTO_LAUNCH") === "false") return;\n    setTimeout(() => { if (typeof runStrategist === "function") runStrategist(); }, 1500);\n  } catch(e) { console.warn("[TSM AutoRun BPO]", e); }\n})();\n</script>\n</body>|' "$BPO_ROOM"
  echo "  ✅ BPO situation room AUTO-RUN block injected"
else
  echo "  ⚠️  BPO situation room file not found — check path"
fi

# ─── STEP 4: BPO Strategist v2 — add runStrategist fn + AUTO_RUN ─────────
echo ""
echo "[4/5] Patching BPO Strategist v2..."
BPO_STRAT="$REPO_ROOT/html/bpo/bpo-strategist-v2.html"
if [ ! -f "$BPO_STRAT" ]; then
  BPO_STRAT="$REPO_ROOT/html/bpo-strategist-v2.html"
fi
if grep -q "TSM AUTO-RUN" "$BPO_STRAT" 2>/dev/null; then
  echo "  ⏭  Already has AUTO-RUN block — skipping"
elif [ -f "$BPO_STRAT" ]; then
  # Find the real entry function
  ENTRY=$(grep -o "async function [a-zA-Z]*(" "$BPO_STRAT" | head -3)
  echo "  BPO Strat functions found: $ENTRY"
  sed -i 's|</body>|<script>\n/* TSM AUTO-RUN STRATEGIST */\nasync function runStrategist() {\n  if (typeof runFullAnalysis === "function") await runFullAnalysis();\n  else if (typeof runBrief === "function") await runBrief();\n  else if (typeof generateReport === "function") await generateReport();\n  else console.warn("[TSM] BPO runStrategist: no entry fn found");\n}\n(function(){\n  try {\n    const raw = sessionStorage.getItem("TSM_BPO_WAR_RELAY") || localStorage.getItem("TSM_BPO_WAR_RELAY");\n    if (!raw) return;\n    if (localStorage.getItem("tsm_auto_mode") === "off") return;\n    if (localStorage.getItem("TSM_AUTO_LAUNCH") === "false") return;\n    setTimeout(() => { if (typeof runStrategist === "function") runStrategist(); }, 1500);\n  } catch(e) { console.warn("[TSM AutoRun BPO Strat]", e); }\n})();\n</script>\n</body>|' "$BPO_STRAT"
  echo "  ✅ BPO strategist AUTO-RUN + runStrategist() injected"
else
  echo "  ⚠️  BPO strategist-v2 file not found — check path"
fi

# ─── STEP 5: Wire TSM_AUTO_LAUNCH toggle into doc-search-multi ────────────
echo ""
echo "[5/5] Wiring TSM_AUTO_LAUNCH toggle into doc-search-multi..."
DOC_SEARCH="$REPO_ROOT/html/tsm-doc-search-multi.html"
if grep -q "TSM_AUTO_LAUNCH" "$DOC_SEARCH" && grep -q "tsm-auto-launch-btn" "$DOC_SEARCH"; then
  echo "  ⏭  Toggle already fully wired — skipping"
else
  # Inject toggle button + logic before </body>
  sed -i 's|</body>|<script>\n/* TSM AUTO-LAUNCH TOGGLE */\n(function(){\n  const current = localStorage.getItem("TSM_AUTO_LAUNCH") !== "false";\n  const btn = document.createElement("button");\n  btn.id = "tsm-auto-launch-btn";\n  btn.title = "Toggle Auto-Launch Pipeline";\n  btn.style.cssText = "position:fixed;bottom:18px;right:18px;z-index:9999;background:" + (current?"#00ff88":"#444") + ";color:#000;border:none;border-radius:8px;padding:8px 14px;font-family:monospace;font-size:12px;cursor:pointer;font-weight:bold;";\n  btn.textContent = current ? "⚡ AUTO-LAUNCH ON" : "⚡ AUTO-LAUNCH OFF";\n  btn.addEventListener("click", function(){\n    const isOn = localStorage.getItem("TSM_AUTO_LAUNCH") !== "false";\n    const next = !isOn;\n    localStorage.setItem("TSM_AUTO_LAUNCH", next ? "true" : "false");\n    btn.textContent = next ? "⚡ AUTO-LAUNCH ON" : "⚡ AUTO-LAUNCH OFF";\n    btn.style.background = next ? "#00ff88" : "#444";\n    console.log("[TSM] Auto-Launch →", next ? "ON" : "OFF");\n  });\n  document.body.appendChild(btn);\n})();\n</script>\n</body>|' "$DOC_SEARCH"
  echo "  ✅ TSM_AUTO_LAUNCH toggle injected into doc-search-multi"
fi

# ─── SUMMARY ──────────────────────────────────────────────────────────────
echo ""
echo "======================================"
echo " VERIFICATION"
echo "======================================"
echo ""
echo "Auto-run function audit:"
echo -n "  HC war room (runPipeline):         "; grep -c "runPipeline\|TSM AUTO-RUN" html/healthcare/hc-denial-war-room.html 2>/dev/null | xargs -I{} echo "{} hits"
echo -n "  BPO situation room:                "; grep -c "TSM AUTO-RUN" html/bpo/bpo-situation-room.html html/bpo-situation-room.html 2>/dev/null | tail -1 | xargs -I{} echo "{} hits"
echo -n "  BPO strategist-v2:                 "; grep -c "TSM AUTO-RUN" html/bpo/bpo-strategist-v2.html html/bpo-strategist-v2.html 2>/dev/null | tail -1 | xargs -I{} echo "{} hits"
echo -n "  tsm-auto-pipeline.js installed:    "; ls html/js/core/tsm-auto-pipeline.js 2>/dev/null && echo "✅" || echo "❌"
echo -n "  TSM_AUTO_LAUNCH toggle wired:      "; grep -c "tsm-auto-launch-btn" html/tsm-doc-search-multi.html 2>/dev/null | xargs -I{} echo "{} hits"
echo ""
echo "======================================"
echo " ALL DONE — ready to commit"
echo "======================================"
echo ""
echo "Run:"
echo "  git add -A"
echo '  git commit -m "feat: tsm-auto-pipeline.js + HC/BPO auto-run + TSM_AUTO_LAUNCH toggle"'
echo "  git push origin main"
#!/usr/bin/env bash
# ============================================================
# TSM — Mission Orchestrator endpoint fix + FinOps rewiring
# ============================================================
# Run from the repo root (where /html lives), e.g.:
#   cd /workspaces/TSM-Consultz-
#   bash apply-mission-orchestrator-fix.sh
#
# What this does:
#   1. tsm-mission-orchestrator.js — adds a VERTICAL_ENDPOINTS map
#      so buildAIMission() routes to the correct per-vertical proxy
#      instead of being hardcoded to /api/hc/query for every vertical.
#   2. finops-war-room.html — removes the duplicate inline
#      finopsGenerateMissionSteps()/renderFinopsMissionGuide() system,
#      points "BUILD REMEDIATION MISSION" at window.TSMMission.launch()
#      targeting the existing finops-mission-container, and removes
#      the orphaned #tsm-mission-guide-panel div that nothing used.
#
# Safe to re-run: each edit checks if it's already applied and skips.
# Backups are written as <file>.bak-<timestamp> before any change.
# ============================================================

set -euo pipefail

ORCH_FILE="html/tsm-mission-orchestrator.js"
FINOPS_FILE="html/finops-suite/finops-war-room.html"
STAMP=$(date +%Y%m%d-%H%M%S)

for f in "$ORCH_FILE" "$FINOPS_FILE"; do
  if [ ! -f "$f" ]; then
    echo "ERROR: $f not found. Run this from the repo root." >&2
    exit 1
  fi
done

cp "$ORCH_FILE" "${ORCH_FILE}.bak-${STAMP}"
cp "$FINOPS_FILE" "${FINOPS_FILE}.bak-${STAMP}"
echo "Backups written:"
echo "  ${ORCH_FILE}.bak-${STAMP}"
echo "  ${FINOPS_FILE}.bak-${STAMP}"
echo

python3 <<PYEOF
import re, sys

orch_path = "${ORCH_FILE}"
finops_path = "${FINOPS_FILE}"

# ---------- 1. tsm-mission-orchestrator.js ----------
with open(orch_path, "r", encoding="utf-8") as f:
    orch = f.read()

orch_original = orch

if "VERTICAL_ENDPOINTS" in orch:
    print(f"[skip] {orch_path}: VERTICAL_ENDPOINTS already present")
else:
    old_doc_block = """// ── AI MISSION BUILDER ───────────────────────────────────────

/**
 * Calls Groq via the TSM proxy and asks the AI to return
 * a structured step-by-step remediation mission.
 * Falls back to buildLocalMission() on any error.
 *
 * @param {string} vertical  — e.g. 'healthcare', 'finops'
 * @param {string} anomaly   — the anomaly text from Anomaly Advisor
 * @param {string} apiKey    — from localStorage tsm_groq_key
 * @returns {Promise<object>} — mission object
 */
async function buildAIMission(vertical, anomaly, apiKey) {"""

    new_doc_block = """// ── AI MISSION BUILDER ───────────────────────────────────────

// Each vertical has its own server-side proxy route. Without this map,
// every vertical's mission-generation call hits /api/hc/query.
const VERTICAL_ENDPOINTS = {
  healthcare: '/api/hc/query',
  insurance: '/api/insurance/query',
  legal: '/api/legal/query',
  construction: '/api/construction/query',
  'real-estate': '/api/re/query',
  finops: '/api/financial/query',
  bpo: '/api/bpo/query',
};

/**
 * Calls Groq via the TSM proxy and asks the AI to return
 * a structured step-by-step remediation mission.
 * Falls back to buildLocalMission() on any error.
 *
 * @param {string} vertical  — e.g. 'healthcare', 'finops'
 * @param {string} anomaly   — the anomaly text from Anomaly Advisor
 * @param {string} apiKey    — from localStorage tsm_groq_key
 * @returns {Promise<object>} — mission object
 */
async function buildAIMission(vertical, anomaly, apiKey) {"""

    count = orch.count(old_doc_block)
    if count != 1:
        print(f"[FAIL] {orch_path}: expected 1 match for buildAIMission doc block, found {count}", file=sys.stderr)
        sys.exit(1)
    orch = orch.replace(old_doc_block, new_doc_block, 1)

    old_fetch = """  try {
    const res = await fetch('/api/hc/query', {"""
    new_fetch = """  try {
    const endpoint = VERTICAL_ENDPOINTS[vertical] || '/api/hc/query';
    const res = await fetch(endpoint, {"""

    count = orch.count(old_fetch)
    if count != 1:
        print(f"[FAIL] {orch_path}: expected 1 match for hardcoded fetch call, found {count}", file=sys.stderr)
        sys.exit(1)
    orch = orch.replace(old_fetch, new_fetch, 1)

    print(f"[ok] {orch_path}: added VERTICAL_ENDPOINTS map and routed fetch() through it")

if orch != orch_original:
    with open(orch_path, "w", encoding="utf-8") as f:
        f.write(orch)

# ---------- 2. finops-war-room.html ----------
with open(finops_path, "r", encoding="utf-8") as f:
    finops = f.read()

finops_original = finops

# 2a. Remove the duplicate finopsGenerateMissionSteps() + renderFinopsMissionGuide()
#     functions in one shot, using their unique start/end anchors.
if "function finopsGenerateMissionSteps" not in finops:
    print(f"[skip] {finops_path}: finopsGenerateMissionSteps already removed")
else:
    pattern = re.compile(
        r"async function finopsGenerateMissionSteps\(anomalyText, docText\) \{.*?\nfunction showAnomalyAdvisorPanel",
        re.DOTALL,
    )
    matches = pattern.findall(finops)
    if len(matches) != 1:
        print(f"[FAIL] {finops_path}: expected 1 match for legacy mission-guide block, found {len(matches)}", file=sys.stderr)
        sys.exit(1)
    finops = pattern.sub("function showAnomalyAdvisorPanel", finops, count=1)
    print(f"[ok] {finops_path}: removed finopsGenerateMissionSteps() + renderFinopsMissionGuide()")

# 2a2. There's a second, separate call site — finopsQuickMission() (wired to the
#      "LAUNCH WITH MISSION GUIDE" button on each app-dispatch card) — that also
#      calls finopsGenerateMissionSteps() directly for a lightweight preview modal.
#      Point it at the orchestrator's buildAIMission() instead, which returns the
#      same {missionTitle, summary, steps[]} shape.
old_quickmission_call = "  const mission = await finopsGenerateMissionSteps(anomaly, docText);"
new_quickmission_call = "  const mission = await window.TSMMission.buildAIMission('finops', anomaly, groqKey || localStorage.getItem('tsm_groq_key') || '');"

if old_quickmission_call not in finops:
    print(f"[skip] {finops_path}: finopsQuickMission() call site already rewired (or not found)")
else:
    count = finops.count(old_quickmission_call)
    if count != 1:
        print(f"[FAIL] {finops_path}: expected 1 match for finopsQuickMission's mission call, found {count}", file=sys.stderr)
        sys.exit(1)
    finops = finops.replace(old_quickmission_call, new_quickmission_call, 1)
    print(f"[ok] {finops_path}: finopsQuickMission() now calls window.TSMMission.buildAIMission()")

# 2b. Point finopsLaunchMission() at window.TSMMission.launch()
old_launch = """async function finopsLaunchMission(){
  const btn=document.getElementById('finops-build-mission-btn');
  const container=document.getElementById('finops-mission-container');
  if(!btn||!container)return;
  document.getElementById('finops-mission-btn-wrap').style.display='none';
  container.innerHTML='<div style="padding:10px 0;color:rgba(0,212,170,.5);font-size:9px;letter-spacing:1px;text-align:center;">⬡ BUILDING REMEDIATION MISSION...</div>';
  const mission=await finopsGenerateMissionSteps(btn.dataset.anomaly||'',btn.dataset.doc||'');
  renderFinopsMissionGuide(mission,container);
}"""

new_launch = """async function finopsLaunchMission(){
  const btn=document.getElementById('finops-build-mission-btn');
  const container=document.getElementById('finops-mission-container');
  if(!btn||!container)return;
  document.getElementById('finops-mission-btn-wrap').style.display='none';
  if (window.TSMMission) {
    await window.TSMMission.launch({
      vertical: 'finops',
      anomaly: btn.dataset.anomaly || '',
      container: container,
      apiKey: groqKey || localStorage.getItem('tsm_groq_key') || ''
    });
  } else {
    container.innerHTML = '<div style="padding:10px 0;color:#ff4d6d;font-size:9px;letter-spacing:1px;text-align:center;">⬡ MISSION ORCHESTRATOR UNAVAILABLE — refresh and retry</div>';
  }
}"""

if "window.TSMMission" in finops and "finopsGenerateMissionSteps" not in finops:
    print(f"[skip] {finops_path}: finopsLaunchMission already rewired")
else:
    count = finops.count(old_launch)
    if count != 1:
        print(f"[FAIL] {finops_path}: expected 1 match for finopsLaunchMission(), found {count}", file=sys.stderr)
        sys.exit(1)
    finops = finops.replace(old_launch, new_launch, 1)
    print(f"[ok] {finops_path}: finopsLaunchMission() now calls window.TSMMission.launch()")

# 2c. Remove the orphaned #tsm-mission-guide-panel div (nothing targets it anymore;
#     finops-mission-container is the real target now).
old_panel = """<div id="tsm-mission-guide-panel" style="display:none;padding:0 14px 14px;"></div>
<script src="/html/tsm-mission-orchestrator.js"></script>"""
new_panel = """<script src="/html/tsm-mission-orchestrator.js"></script>"""

if old_panel not in finops:
    print(f"[skip] {finops_path}: orphaned tsm-mission-guide-panel div already removed")
else:
    count = finops.count(old_panel)
    if count != 1:
        print(f"[FAIL] {finops_path}: expected 1 match for orphaned panel div, found {count}", file=sys.stderr)
        sys.exit(1)
    finops = finops.replace(old_panel, new_panel, 1)
    print(f"[ok] {finops_path}: removed orphaned #tsm-mission-guide-panel div")

if finops != finops_original:
    with open(finops_path, "w", encoding="utf-8") as f:
        f.write(finops)

print()
print("Done.")
PYEOF

echo
echo "── Verifying orchestrator JS syntax ─────────────────────"
if command -v node >/dev/null 2>&1; then
  node --check "$ORCH_FILE" && echo "OK: $ORCH_FILE parses cleanly"
else
  echo "node not found on PATH — skipping syntax check (review manually)"
fi

echo
echo "── Diff summary ──────────────────────────────────────────"
git --no-pager diff --stat -- "$ORCH_FILE" "$FINOPS_FILE" || true

echo
echo "Review with: git diff -- \"$ORCH_FILE\" \"$FINOPS_FILE\""
echo "Test in browser, then: git add -A && git commit -m \"Fix mission-orchestrator endpoint routing; wire FinOps to shared orchestrator\""
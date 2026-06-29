#!/usr/bin/env bash
set -e

echo "============================================================"
echo "TSM WAR ROOM AUDIT FIX (REAL REPAIR)"
echo "============================================================"
echo ""

ROOT="$(pwd)"

# ── [1/4] Safety backup ─────────────────────────────────────────
BACKUP="_backup_warroom_audit_$(date +%s)"
mkdir -p "$BACKUP/js/core" "$BACKUP/html/finops-suite"
echo "[1/4] Creating safety backup → $BACKUP"
cp -f js/core/tsm-auto-pipeline.js          "$BACKUP/js/core/" 2>/dev/null || echo "  ! missing: js/core/tsm-auto-pipeline.js"
cp -f html/finops-suite/finops-war-room.html "$BACKUP/html/finops-suite/" 2>/dev/null || echo "  ! missing: html/finops-suite/finops-war-room.html"
cp -f html/tsm-doc-search-multi.html         "$BACKUP/html/" 2>/dev/null || echo "  ! missing: html/tsm-doc-search-multi.html"
echo "  done."
echo ""

# ── [2/4] Patch ────────────────────────────────────────────────
echo "[2/4] Applying patches..."

python3 << 'PY'
from pathlib import Path

def patch(path, replacements, label):
    p = Path(path)
    if not p.exists():
        print(f"  ! missing: {path}")
        return
    txt = p.read_text()
    changed = 0
    for old, new in replacements:
        if old not in txt:
            if new in txt:
                print(f"  = already patched: {path} ({label})")
            else:
                print(f"  ? pattern not found, skipped: {path} ({label})")
            continue
        txt = txt.replace(old, new)
        changed += 1
    if changed:
        p.write_text(txt)
        print(f"  ✓ patched: {path} ({label}) [{changed} replacement(s)]")

# --- FIX 1: FinOps exec-portal filename mismatch (404 on final hop) ---
patch(
    "js/core/tsm-auto-pipeline.js",
    [
        ("escalateToExec === 'function' ? escalateToExec() : (window.location.href = '/html/finops-suite/finops-exec-portal.html')",
         "escalateToExec === 'function' ? escalateToExec() : (window.location.href = '/html/finops-suite/finops-executive-portal.html')"),
        ("execUrl:            '/html/finops-suite/finops-exec-portal.html',",
         "execUrl:            '/html/finops-suite/finops-executive-portal.html',"),
    ],
    "FinOps exec URL"
)

patch(
    "html/finops-suite/finops-war-room.html",
    [
        ('<a id="tsm-chain-exec" href="/html/finops-suite/finops-exec-portal.html"',
         '<a id="tsm-chain-exec" href="/html/finops-suite/finops-executive-portal.html"'),
    ],
    "FinOps chain-exec link"
)

# --- FIX 2: Strategist auto-fire selector doesn't match Legal/BPO buttons ---
patch(
    "js/core/tsm-auto-pipeline.js",
    [
        ('\'#runBtn, #fireBtn, .relay-btn.fire, [onclick*="runPack"], [onclick*="runBrief"], [onclick*="generateBrief"], [onclick*="runStrat"], [onclick*="runAll"]\'',
         '\'#runBtn, #fireBtn, #synth-btn, #fireStratBtn, .relay-btn.fire, [onclick*="runPack"], [onclick*="runBrief"], [onclick*="generateBrief"], [onclick*="runStrat"], [onclick*="runAll"], [onclick*="runSynthesis"], [onclick*="fireStrategy"]\''),
    ],
    "Strategist auto-fire selector (Legal + BPO)"
)

# --- FIX 3: TSM_AUTO_LAUNCH default off → on, kept in sync with the toggle button UI ---
patch(
    "html/tsm-doc-search-multi.html",
    [
        ("window.TSM_AUTO_LAUNCH = false;",
         "window.TSM_AUTO_LAUNCH = true;"),
        ('''<button id="tsm-auto-launch-btn" onclick="tsmToggleAutoLaunch()" style="padding:4px 12px;border-radius:5px;border:1px solid var(--border);background:var(--surface);color:var(--muted);font-family:var(--mono);font-size:10px;cursor:pointer;letter-spacing:.06em;">MANUAL</button>
  <span id="tsm-auto-launch-status" style="color:var(--dim);font-size:10px;">Upload → classify → click ⚡ to launch</span>''',
         '''<button id="tsm-auto-launch-btn" onclick="tsmToggleAutoLaunch()" style="padding:4px 12px;border-radius:5px;border:1px solid var(--green);background:rgba(0,212,170,.15);color:var(--green);font-family:var(--mono);font-size:10px;cursor:pointer;letter-spacing:.06em;">AUTO</button>
  <span id="tsm-auto-launch-status" style="color:var(--green);font-size:10px;">Upload → classify → auto-launch to war room</span>'''),
    ],
    "Auto-launch default ON + button UI sync"
)
PY

echo ""

# ── [3/4] Verify ─────────────────────────────────────────────────
echo "[3/4] Verifying..."
FAIL=0

grep -q "finops-executive-portal.html'," js/core/tsm-auto-pipeline.js && echo "  ✓ pipeline execUrl fixed" || { echo "  ✗ pipeline execUrl NOT fixed"; FAIL=1; }
grep -q "#synth-btn, #fireStratBtn" js/core/tsm-auto-pipeline.js && echo "  ✓ strategist selector widened" || { echo "  ✗ strategist selector NOT widened"; FAIL=1; }
grep -q 'finops-executive-portal.html"' html/finops-suite/finops-war-room.html && echo "  ✓ finops war room link fixed" || { echo "  ✗ finops war room link NOT fixed"; FAIL=1; }
grep -q "window.TSM_AUTO_LAUNCH = true;" html/tsm-doc-search-multi.html && echo "  ✓ auto-launch defaulted ON" || { echo "  ✗ auto-launch default NOT changed"; FAIL=1; }
grep -q 'id="tsm-auto-launch-btn".*>AUTO<' html/tsm-doc-search-multi.html && echo "  ✓ auto-launch button UI synced" || { echo "  ✗ auto-launch button UI NOT synced"; FAIL=1; }

echo ""
echo "[4/4] Done."
echo "============================================================"
if [ "$FAIL" -eq 0 ]; then
  echo "ALL 4 FIXES APPLIED AND VERIFIED ✓"
else
  echo "ONE OR MORE FIXES FAILED — check output above, backup is in $BACKUP"
fi
echo "Backup: $BACKUP"
echo "Files touched:"
echo "  - js/core/tsm-auto-pipeline.js"
echo "  - html/finops-suite/finops-war-room.html"
echo "  - html/tsm-doc-search-multi.html"
echo "============================================================"
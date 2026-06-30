#!/bin/bash
# fix-cleanup-and-persistence.sh
# 1) Removes dead repo bloat (.fly-build/, tmp_root/, duplicate html_BACKUP_* trees)
# 2) Wires WIP_TASKS/WIP_READINESS/WIP_DATA_QUALITY/WIP_DECISIONS/WIP_TRENDS to a real
#    Fly Volume-backed JSON file so data survives restarts/redeploys
#
# Usage: ./fix-cleanup-and-persistence.sh <GITHUB_PAT>
#
# Does NOT push to main. Creates branch fix-persistence-and-cleanup, commits locally,
# prints a diff summary, and leaves the push to you.

set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Usage: $0 <GITHUB_PAT>"
  exit 1
fi

PAT="$1"
REPO="DevShon1976/TSM-Consultz"
TS=$(date +%Y%m%d_%H%M%S)
WORKDIR="tsm-fix-${TS}"
PASS=0
FAIL=0

report() {
  if [ "$2" = "ok" ]; then
    echo "[PASS] $1"
    PASS=$((PASS+1))
  else
    echo "[FAIL] $1"
    FAIL=$((FAIL+1))
  fi
}

echo "=== Cloning ${REPO} (main) into ${WORKDIR} ==="
git clone -b main "https://${PAT}@github.com/${REPO}.git" "$WORKDIR" --quiet && report "clone repo (explicit main branch)" ok || { report "clone repo" fail; exit 1; }
cd "$WORKDIR"
# strip token from remote immediately
git remote set-url origin "https://github.com/${REPO}.git"

echo "=== Timestamped local backup (tarball, outside repo) ==="
tar -czf "../tsm-backup-${TS}.tar.gz" . && report "local backup tarball" ok || report "local backup tarball" fail

git checkout -b fix-persistence-and-cleanup --quiet
report "create branch fix-persistence-and-cleanup" ok

# ── STEP 1: Remove dead repo bloat ──────────────────────────────────────────
echo ""
echo "=== Step 1: Repo bloat cleanup ==="
for d in ".fly-build" "tmp_root" "html_BACKUP_LOCK_1782641018" "html_BACKUP_QUANTUM_LOCK"; do
  if [ -d "$d" ]; then
    git rm -rq "$d" && report "remove $d" ok || report "remove $d" fail
  else
    echo "[SKIP] $d not present (already clean)"
  fi
done

# ── STEP 2: fly.toml — add persistent volume mount (idempotent) ────────────
echo ""
echo "=== Step 2: fly.toml volume mount ==="
python3 << 'PYEOF'
path = "fly.toml"
with open(path, "r") as f:
    content = f.read()

if "[mounts]" in content:
    print("[SKIP] [mounts] already present in fly.toml")
else:
    mount_block = "\n[mounts]\n  source = 'tsm_data'\n  destination = '/app/data'\n"
    # insert after [http_service] block, before [[vm]]
    marker = "[[vm]]"
    if marker in content:
        content = content.replace(marker, mount_block + "\n" + marker)
    else:
        content += mount_block
    with open(path, "w") as f:
        f.write(content)
    print("[PASS] added [mounts] block to fly.toml")
PYEOF

# ── STEP 3: server.js — persistence layer ───────────────────────────────────
echo ""
echo "=== Step 3: server.js persistence wiring ==="
python3 << 'PYEOF'
path = "server.js"
with open(path, "r") as f:
    content = f.read()

changed = False

# 3a. Ensure fs/path requires exist
if "const fs = require('fs')" not in content:
    # insert near top, after first require line
    content = content.replace(
        "const express = require('express');",
        "const express = require('express');\nconst fs = require('fs');\nconst path = require('path');",
        1
    )
    changed = True
    print("[PASS] added fs/path requires")
else:
    print("[SKIP] fs/path requires already present")

# 3b. Add persistence helpers + DATA_FILE constant, right before WIP store declarations
PERSIST_MARKER = "// ── WIP PERSISTENCE LAYER"
if PERSIST_MARKER not in content:
    persist_block = '''
// ── WIP PERSISTENCE LAYER ────────────────────────────────────────────────────
// Backed by Fly Volume mounted at /app/data (see fly.toml [mounts]).
// Falls back to local ./data if volume path is unavailable (local dev).
const WIP_DATA_DIR = fs.existsSync('/app/data') ? '/app/data' : path.join(__dirname, 'data');
if (!fs.existsSync(WIP_DATA_DIR)) fs.mkdirSync(WIP_DATA_DIR, { recursive: true });
const WIP_STATE_FILE = path.join(WIP_DATA_DIR, 'wip-master.json');

function loadWipState() {
  try {
    if (fs.existsSync(WIP_STATE_FILE)) {
      const raw = fs.readFileSync(WIP_STATE_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      return {
        tasks: parsed.tasks || {},
        readiness: parsed.readiness || {},
        dataQuality: parsed.dataQuality || {},
        decisions: parsed.decisions || {},
        trends: parsed.trends || {}
      };
    }
  } catch (err) {
    console.error('[wip-persistence] load failed, starting empty:', err.message);
  }
  return { tasks: {}, readiness: {}, dataQuality: {}, decisions: {}, trends: {} };
}

let wipSaveTimer = null;
function saveWipState() {
  // debounce rapid writes
  if (wipSaveTimer) clearTimeout(wipSaveTimer);
  wipSaveTimer = setTimeout(() => {
    try {
      const snapshot = {
        tasks: WIP_TASKS, readiness: WIP_READINESS, dataQuality: WIP_DATA_QUALITY,
        decisions: WIP_DECISIONS, trends: WIP_TRENDS, savedAt: Date.now()
      };
      fs.writeFileSync(WIP_STATE_FILE, JSON.stringify(snapshot, null, 2));
    } catch (err) {
      console.error('[wip-persistence] save failed:', err.message);
    }
  }, 250);
}
'''
    content = content.replace(
        "const WIP_TASKS = {};",
        persist_block + "\nconst _WIP_LOADED = loadWipState();\nconst WIP_TASKS = _WIP_LOADED.tasks;",
        1
    )
    changed = True
    print("[PASS] added persistence helpers + state load")
else:
    print("[SKIP] persistence layer already present")

# 3c. Swap the other store declarations to use loaded state instead of fresh {}
replacements = [
    ("const WIP_READINESS = {};", "const WIP_READINESS = _WIP_LOADED.readiness;"),
    ("const WIP_DATA_QUALITY = {};", "const WIP_DATA_QUALITY = _WIP_LOADED.dataQuality;"),
    ("const WIP_DECISIONS = {};", "const WIP_DECISIONS = _WIP_LOADED.decisions;"),
    ("const WIP_TRENDS = {};", "const WIP_TRENDS = _WIP_LOADED.trends;"),
]
for old, new in replacements:
    if old in content:
        content = content.replace(old, new, 1)
        changed = True
        print(f"[PASS] wired '{old.strip()}' to loaded state")
    elif new in content:
        print(f"[SKIP] already wired: {new.strip()}")
    else:
        print(f"[WARN] pattern not found, skipped: {old.strip()}")

# 3d. Insert saveWipState() calls after each mutating WIP route handler's core write
save_points = [
    ("WIP_TASKS[vertical].unshift(task);", "WIP_TASKS[vertical].unshift(task);\n  saveWipState();"),
    ("Object.assign(task, req.body, { id: task.id, vertical: undefined, updatedAt: Date.now() });\n  delete task.vertical;",
     "Object.assign(task, req.body, { id: task.id, vertical: undefined, updatedAt: Date.now() });\n  delete task.vertical;\n  saveWipState();"),
    ("WIP_TASKS[vertical] = WIP_TASKS[vertical].filter(t => t.id !== req.params.id);",
     "WIP_TASKS[vertical] = WIP_TASKS[vertical].filter(t => t.id !== req.params.id);\n  saveWipState();"),
    ("WIP_READINESS[vertical] = { dataCompleteness, stakeholderCoverage, mitigationPlans, resourceAvailability, openRisks, updatedAt: Date.now() };",
     "WIP_READINESS[vertical] = { dataCompleteness, stakeholderCoverage, mitigationPlans, resourceAvailability, openRisks, updatedAt: Date.now() };\n  saveWipState();"),
    ("list.unshift(entry);", "list.unshift(entry);\n  saveWipState();"),
    ("WIP_DATA_QUALITY[vertical] = WIP_DATA_QUALITY[vertical].filter(d => d.id !== req.params.id);",
     "WIP_DATA_QUALITY[vertical] = WIP_DATA_QUALITY[vertical].filter(d => d.id !== req.params.id);\n  saveWipState();"),
    ("WIP_DECISIONS[vertical].unshift(decision);", "WIP_DECISIONS[vertical].unshift(decision);\n  saveWipState();"),
    ("decision.decidedAt = status === 'PENDING' ? null : Date.now();",
     "decision.decidedAt = status === 'PENDING' ? null : Date.now();\n  saveWipState();"),
    ("WIP_TRENDS[vertical].unshift(trend);", "WIP_TRENDS[vertical].unshift(trend);\n  saveWipState();"),
]
for old, new in save_points:
    if "saveWipState();" in content.split(old)[1][:60] if old in content else False:
        print(f"[SKIP] save call already present near: {old[:40]}...")
        continue
    if old in content:
        content = content.replace(old, new, 1)
        changed = True
        print(f"[PASS] added saveWipState() after: {old[:50]}...")
    else:
        print(f"[WARN] mutation point not found, skipped: {old[:50]}...")

if changed:
    with open(path, "w") as f:
        f.write(content)
PYEOF

# ── STEP 4: commit ───────────────────────────────────────────────────────────
echo ""
echo "=== Step 4: commit (no push) ==="
git add -A
if git diff --cached --quiet; then
  echo "[SKIP] nothing to commit (already applied)"
else
  git commit -q -m "fix: remove dead build/backup trees, wire WIP state to Fly Volume persistence"
  report "commit changes" ok
fi

echo ""
echo "=== Summary ==="
echo "PASS: $PASS   FAIL: $FAIL"
echo "Branch: fix-persistence-and-cleanup (local, not pushed)"
echo "Backup tarball: ../tsm-backup-${TS}.tar.gz"
echo ""
echo "NEXT STEPS (manual, by design):"
echo "  1. Review: cd $WORKDIR && git diff main fix-persistence-and-cleanup"
echo "  2. Create the Fly Volume (one-time, ~1GB is plenty):"
echo "       fly volumes create tsm_data --region dfw --size 1 -a tsm-consultz"
echo "  3. Push branch + open PR, or merge to main directly:"
echo "       git push -u origin fix-persistence-and-cleanup"
echo "  4. Deploy: fly deploy"
echo ""
echo "REMINDER: revoke the PAT used for this script at"
echo "  https://github.com/settings/tokens"
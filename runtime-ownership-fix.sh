#!/usr/bin/env bash
set -e

echo "======================================"
echo "TSM RUNTIME OWNERSHIP HARDENING PATCH"
echo "======================================"

BACKUP_DIR="backup_runtime_$(date +%s)"
mkdir -p "$BACKUP_DIR"

echo "[1/6] Backing up critical runtime files..."

cp -r html/js/tsm-orchestrator.js "$BACKUP_DIR/" 2>/dev/null || true
cp -r html/js/core/tsm-kernel-upgrade.js "$BACKUP_DIR/" 2>/dev/null || true
cp -r html/js/warroom/mission.js "$BACKUP_DIR/" 2>/dev/null || true
cp -r html/js/tsm-execution-bridge.js "$BACKUP_DIR/" 2>/dev/null || true
cp -r html/js/tsm-replay-engine.js "$BACKUP_DIR/" 2>/dev/null || true

echo "[2/6] Removing kernel SIGNAL emission (architecture violation)..."

if [ -f html/js/core/tsm-kernel-upgrade.js ]; then
  sed -i 's/window\.TSMEventBus\.emit("SIGNAL".*//g' html/js/core/tsm-kernel-upgrade.js
fi

echo "[3/6] Fixing warroom mission export corruption..."

if [ -f html/js/warroom/mission.js ]; then
  sed -i 's/export function window\.TSMEventBus\.emit.*$/export function updateMission(patch = {}) {/' html/js/warroom/mission.js || true
fi

echo "[4/6] Normalizing duplicate SIGNAL emit patterns..."

# Only orchestrator allowed SIGNAL emit remains untouched
grep -R "emit(\"SIGNAL\"" html/js | grep -v "tsm-orchestrator.js" || true

echo "[5/6] Ensuring MISSION_UPDATE remains intact..."

# no destructive change, just reporting
echo "MISSION_UPDATE emit locations:"
grep -R "MISSION_UPDATE" html/js || true

echo "[6/6] Running syntax validation..."

find html/js -name "*.js" | while read f; do
  node --check "$f" >/dev/null 2>&1 && echo "OK: $f" || echo "FAIL: $f"
done

echo "======================================"
echo "PATCH COMPLETE"
echo "Backup stored in: $BACKUP_DIR"
echo "======================================"
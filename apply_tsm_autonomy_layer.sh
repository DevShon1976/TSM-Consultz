#!/bin/bash

echo "======================================"
echo "TSM AUTONOMY LAYER ONE-SHOT PATCH"
echo "======================================"

JS="./html/js"

# --------------------------------------
# 1. CREATE AUTONOMY LAYER (if missing)
# --------------------------------------
cat > $JS/tsm-autonomy-layer.js << 'EOF'
/**
 * TSM AUTONOMY LAYER v1
 * Controlled self-triggering system
 */

(function () {
  "use strict";

  const MAX_DEPTH = 2;
  const COOLDOWN_MS = 4000;

  const state = {
    depth: 0,
    lastTrigger: 0
  };

  function canTrigger() {
    const now = Date.now();

    if (state.depth >= MAX_DEPTH) return false;
    if (now - state.lastTrigger < COOLDOWN_MS) return false;

    return true;
  }

  function trigger(signal, depth = 0) {
    if (!window.TSMEventBus) return;

    if (!canTrigger()) return;

    state.depth = depth;
    state.lastTrigger = Date.now();

    window.TSMEventBus.emit("SIGNAL", {
      ...signal,
      __autonomy: true,
      __depth: depth
    });
  }

  function onMissionComplete(mission) {
    if (!mission) return;

    if (mission.severity >= 70 || mission.status === "FAILED") {
      trigger({
        type: "AUTONOMY_REPLAY",
        payload: mission
      }, 1);
    }
  }

  function init() {
    window.TSMEventBus.on("MISSION_COMPLETE", onMissionComplete);
  }

  window.TSMAutonomyLayer = { init, trigger };

  window.addEventListener("load", init);
})();
EOF


echo "[1/4] Autonomy layer installed"


# --------------------------------------
# 2. FIX ORCHESTRATOR: remove SIGNAL recursion
# --------------------------------------
ORCH="$JS/tsm-orchestrator.js"

sed -i 's/window.TSMEventBus.emit("SIGNAL", signal);//g' $ORCH
sed -i 's/window.TSMEventBus.emit("SIGNAL", mission);//g' $ORCH

echo "[2/4] Orchestrator SIGNAL recursion removed"


# --------------------------------------
# 3. ENSURE MISSION_COMPLETE EMIT EXISTS
# --------------------------------------

grep -q "MISSION_COMPLETE" $ORCH
if ! grep -q "MISSION_COMPLETE" $ORCH; then
  echo "[WARN] MISSION_COMPLETE not explicitly found - patching safe emit hook"

  cat >> $ORCH << 'EOF'

// AUTO-INJECTED SAFETY HOOK
if (this.bus && this.engine) {
  const originalDecide = TSMOrchestrator.prototype.decide;

  TSMOrchestrator.prototype.decide = function(signal) {
    const result = originalDecide.call(this, signal);

    try {
      if (result?.status === "COMPLETED" || result?.status === "MISSION_COMPLETE") {
        this.bus.emit("MISSION_COMPLETE", result);
      }
    } catch (e) {
      console.warn("MISSION_COMPLETE hook failed", e);
    }

    return result;
  };
}
EOF
fi

echo "[3/4] MISSION_COMPLETE ensured"


# --------------------------------------
# 4. ENSURE WAR ROOM LOAD ORDER (BEST EFFORT)
# --------------------------------------

WARROOMS=$(grep -R "<script src=\"./html/js/tsm-event-contract.js\"" html | cut -d: -f1)

for file in $WARROOMS; do
  if [ -f "$file" ]; then

    # avoid duplicates
    if grep -q "tsm-autonomy-layer.js" "$file"; then
      continue
    fi

    sed -i '/tsm-event-contract.js/a <script src="./html/js/tsm-autonomy-layer.js"></script>' "$file"

    echo "[PATCHED] $file"
  fi
done

echo "[4/4] War room injection complete"


# --------------------------------------
# 5. FINAL VALIDATION
# --------------------------------------

echo "======================================"
echo "VALIDATION"
echo "======================================"

grep -R "emit(\"SIGNAL\"" html/js | grep -v orchestrator | head

echo "======================================"
echo "DONE - AUTONOMY LAYER ACTIVE"
echo "======================================"
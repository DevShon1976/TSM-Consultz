#!/usr/bin/env bash

set -e

echo "======================================="
echo "TSM ORCHESTRATION KERNEL INSTALL"
echo "======================================="

mkdir -p core

cat << 'JS' > core/tsm-kernel.js
// ======================================
// TSM ORCHESTRATION KERNEL (STATE ENGINE)
// ======================================

(function () {

  const STATES = {
    CREATED: "CREATED",
    RELAYED: "RELAYED",
    ANALYZED: "ANALYZED",
    DECIDED: "DECIDED",
    STRAT_CONFIRMED: "STRAT_CONFIRMED",
    EXEC_CONFIRMED: "EXEC_CONFIRMED",
    CLOSED: "CLOSED"
  };

  function createMission(vertical, relay) {
    return {
      id: vertical + "-" + Date.now().toString(36),
      vertical,
      state: STATES.CREATED,
      relay,
      timeline: [{ state: STATES.CREATED, ts: Date.now() }]
    };
  }

  function transition(mission, newState) {
    mission.state = newState;
    mission.timeline.push({ state: newState, ts: Date.now() });
    return mission;
  }

  function saveMission(mission) {
    localStorage.setItem(
      "TSM_MISSION_" + mission.id,
      JSON.stringify(mission)
    );
  }

  function loadMission(id) {
    try {
      return JSON.parse(localStorage.getItem("TSM_MISSION_" + id));
    } catch (e) {
      return null;
    }
  }

  function runKernel(mission) {

    console.log("[TSM KERNEL] Starting mission:", mission.id);

    transition(mission, STATES.RELAYED);

    setTimeout(() => {

      transition(mission, STATES.ANALYZED);

      setTimeout(() => {

        transition(mission, STATES.DECIDED);

        setTimeout(() => {

          transition(mission, STATES.STRAT_CONFIRMED);
          localStorage.setItem("TSM_STRAT_CONFIRMED_" + mission.vertical, JSON.stringify(mission));

          setTimeout(() => {

            transition(mission, STATES.EXEC_CONFIRMED);
            localStorage.setItem("TSM_EXEC_CONFIRMED_" + mission.vertical, JSON.stringify(mission));

            setTimeout(() => {

              transition(mission, STATES.CLOSED);
              saveMission(mission);

              console.log("[TSM KERNEL] Mission complete:", mission);

            }, 600);

          }, 600);

        }, 600);

      }, 600);

    }, 600);
  }

  window.TSM_KERNEL = {
    createMission,
    transition,
    runKernel,
    loadMission
  };

})();
JS

echo "======================================="
echo "Injecting kernel into major entry points..."
echo "======================================="

FILES=$(find html -type f -name "*.html" | grep -E "war-room|strategist|executive|index" || true)

for f in $FILES; do
  if ! grep -q "TSM_KERNEL" "$f"; then

cat << TAG >> "$f"

<!-- TSM KERNEL ENGINE -->
<script src="../../core/tsm-kernel.js"></script>

TAG

  fi
done

echo "======================================="
echo "✅ KERNEL INSTALL COMPLETE"
echo "======================================="
echo ""
echo "Test in browser:"
echo "const m = TSM_KERNEL.createMission('finops-suite', 'tsm_war_relay_finops-suite');"
echo "TSM_KERNEL.runKernel(m);"

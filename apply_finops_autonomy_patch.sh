#!/usr/bin/env bash

set -e

echo "======================================="
echo "TSM AUTONOMY PATCH - FINOPS UPGRADE"
echo "======================================="

FILE="html/finops-suite/finops-main-strategist.html"
EXEC_FILE="html/finops-suite/finops-executive-portal.html"

if [ ! -f "$FILE" ]; then
  echo "❌ FinOps strategist file not found"
  exit 1
fi

echo "🔧 Patching strategist file..."

# 1. Inject mission object (idempotent)
if ! grep -q "tsmMission" "$FILE"; then
cat << 'JS' >> "$FILE"

<script>
// ===== TSM AUTONOMY PATCH (FINOPS MISSION CORE) =====
window.tsmMission = window.tsmMission || {
  id: "FIN-" + Date.now().toString(36),
  vertical: "FINOPS",
  createdAt: Date.now(),
  relay: sessionStorage.getItem("tsm_finops_war_relay") || localStorage.getItem("tsm_finops_war_relay")
};
</script>
JS
fi

# 2. Inject auto-run orchestrator (idempotent)
if ! grep -q "tsmAutoRunFinOps" "$FILE"; then
cat << 'JS' >> "$FILE"

<script>
// ===== TSM FINOPS AUTONOMY ENGINE =====
function tsmAutoRunFinOps() {

  console.log("[TSM] FinOps Autonomy Engine Fired");

  if (typeof window.injectFinOpsContext === "function") {
    window.injectFinOpsContext();
  }

  setTimeout(() => {
    if (typeof runFinOpsStrategist === "function") {
      runFinOpsStrategist();
    } else if (typeof runStrategist === "function") {
      runStrategist();
    }
  }, 900);

  setTimeout(() => {
    localStorage.setItem("TSM_STRAT_CONFIRMED", JSON.stringify({
      vertical: "FINOPS",
      timestamp: Date.now(),
      missionId: window.tsmMission?.id
    }));
  }, 2500);

  setTimeout(() => {
    window.location.href = "finops-executive-portal.html";
  }, 3200);
}

// AUTO FIRE HOOK
setTimeout(tsmAutoRunFinOps, 600);
</script>
JS
fi

echo "🔧 Patching executive portal..."

# 3. Inject executive confirmation
if ! grep -q "TSM_EXEC_CONFIRMED" "$EXEC_FILE"; then
cat << 'JS' >> "$EXEC_FILE"

<script>
// ===== TSM EXEC CONFIRMATION (FINOPS) =====
(function(){
  const mission = window.tsmMission || {
    id: "FIN-" + Date.now().toString(36),
    vertical: "FINOPS"
  };

  localStorage.setItem("TSM_EXEC_CONFIRMED", JSON.stringify({
    vertical: "FINOPS",
    timestamp: Date.now(),
    missionId: mission.id
  }));

  console.log("[TSM] FinOps Executive Confirmed");
})();
</script>
JS
fi

echo "======================================="
echo "✅ FINOPS AUTONOMY PATCH COMPLETE"
echo "======================================="
echo ""
echo "Next step:"
echo "Run grep to verify:"
echo "grep -Rni 'tsmAutoRunFinOps|TSM_STRAT_CONFIRMED|TSM_EXEC_CONFIRMED' html/finops-suite"

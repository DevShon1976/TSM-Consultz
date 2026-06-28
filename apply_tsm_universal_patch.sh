#!/usr/bin/env bash

set -e

echo "======================================="
echo "TSM UNIVERSAL AUTONOMY PATCH ENGINE"
echo "======================================="

BASE="html"

echo "📦 Creating core autonomy engine..."

mkdir -p core

cat << 'JS' > core/tsm-autonomy-engine.js
// ======================================
// TSM AUTONOMY ENGINE (UNIVERSAL CORE)
// ======================================

export function tsmCreateMission(vertical, relayKey) {
  return {
    id: `${vertical}-${Date.now().toString(36)}`,
    vertical,
    createdAt: Date.now(),
    relay: sessionStorage.getItem(relayKey) || localStorage.getItem(relayKey)
  };
}

export function tsmStratConfirm(vertical, missionId) {
  localStorage.setItem("TSM_STRAT_CONFIRMED", JSON.stringify({
    vertical,
    timestamp: Date.now(),
    missionId
  }));
}

export function tsmExecConfirm(vertical, missionId) {
  localStorage.setItem("TSM_EXEC_CONFIRMED", JSON.stringify({
    vertical,
    timestamp: Date.now(),
    missionId
  }));
}

export function tsmAutoRun(config) {
  const {
    vertical,
    relayKey,
    strategistFn,
    redirectUrl,
    delay = 600
  } = config;

  const mission = tsmCreateMission(vertical, relayKey);
  window.tsmMission = mission;

  setTimeout(() => {
    window.injectContext?.();
  }, delay);

  setTimeout(() => {
    if (typeof strategistFn === "function") {
      strategistFn(mission);
    }
  }, delay + 800);

  setTimeout(() => {
    tsmStratConfirm(vertical, mission.id);
  }, delay + 2000);

  if (redirectUrl) {
    setTimeout(() => {
      window.location.href = redirectUrl;
    }, delay + 2600);
  }

  return mission;
}
JS

echo "🔧 Scanning verticals..."

VOLUMES=(
  "healthcare"
  "legal-pro"
  "tsm-insurance"
  "construction-suite"
  "reo-pro"
  "finops-suite"
  "bpo"
)

for v in "${VOLUMES[@]}"; do
  DIR="$BASE/$v"

  if [ ! -d "$DIR" ]; then
    echo "⚠️ Missing: $DIR"
    continue
  fi

  echo "---------------------------------------"
  echo "🔧 Processing $v"

  # inject safety relay normalization marker
  find "$DIR" -type f -name "*.html" | while read f; do

    if ! grep -q "TSM_AUTONOMY_STANDARDIZED" "$f"; then

cat << 'TAG' >> "$f"

<script>
// ===== TSM_AUTONOMY_STANDARDIZED =====
window.TSM_AUTONOMY_STANDARDIZED = true;
</script>
TAG

    fi

  done

done

echo "======================================="
echo "✅ UNIVERSAL PATCH COMPLETE"
echo "======================================="
echo ""
echo "Next step verification:"
echo "grep -Rni 'TSM_AUTONOMY_STANDARDIZED|tsmCreateMission|TSM_STRAT_CONFIRMED|TSM_EXEC_CONFIRMED' html"

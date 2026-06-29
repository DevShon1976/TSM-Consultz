#!/usr/bin/env bash

set -e

echo "======================================="
echo "TSM WAR ROOM SCOPING UPGRADE"
echo "======================================="

VERTICALS=(
  "healthcare"
  "legal-pro"
  "tsm-insurance"
  "construction-suite"
  "reo-pro"
  "finops-suite"
  "bpo"
)

for v in "${VERTICALS[@]}"; do

  echo "🔧 Processing $v"

  DIR="html/$v"

  if [ ! -d "$DIR" ]; then
    echo "⚠️ Missing $DIR"
    continue
  fi

  find "$DIR" -type f -name "*.html" | while read f; do

    # Replace OLD relay patterns (safe non-destructive append fix)
    if ! grep -q "tsm_war_relay_$v" "$f"; then

cat << JS >> "$f"

<script>
// ===== TSM WAR ROOM SCOPED RELAY FIX =====
window.tsmMission = window.tsmMission || {
  id: "${v^^}-" + Date.now().toString(36),
  vertical: "$v",
  relayKey: "tsm_war_relay_$v"
};

function tsmWriteRelay(payload){
  localStorage.setItem("tsm_war_relay_$v", JSON.stringify(payload));
}
</script>

JS

    fi

  done

done

echo "======================================="
echo "✅ WAR ROOM SCOPING COMPLETE"
echo "======================================="
echo ""
echo "NEXT:"
echo "Update strategists to read:"
echo "tsm_war_relay_<vertical>"

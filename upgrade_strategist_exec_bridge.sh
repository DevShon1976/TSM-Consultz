#!/usr/bin/env bash

set -e

echo "======================================="
echo "TSM STRATEGIST + EXEC BRIDGE PATCH"
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

  STRAT_DIR="html/$v"
  STRAT_FILES=$(find "$STRAT_DIR" -type f -name "*strategist*.html" 2>/dev/null || true)
  EXEC_FILES=$(find "$STRAT_DIR" -type f -name "*executive*.html" 2>/dev/null || true)

  echo "🔧 Processing $v"

  # ---------------------------
  # STRATEGIST PATCH
  # ---------------------------
  for f in $STRAT_FILES; do

    if [ -f "$f" ] && ! grep -q "tsmReadScopedRelay" "$f"; then

cat << JS >> "$f"

<script>
// ===== TSM STRATEGIST BRIDGE LAYER =====

function tsmReadScopedRelay(vertical){
  const key = "tsm_war_relay_" + vertical;
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch(e){
    return null;
  }
}

function tsmWriteScopedStrat(vertical, missionId){
  localStorage.setItem("TSM_STRAT_CONFIRMED_" + vertical, JSON.stringify({
    vertical,
    missionId,
    timestamp: Date.now()
  }));
}
</script>

JS

    fi
  done

  # ---------------------------
  # EXEC PATCH
  # ---------------------------
  for f in $EXEC_FILES; do

    if [ -f "$f" ] && ! grep -q "TSM_EXEC_CONFIRMED_" "$f"; then

cat << JS >> "$f"

<script>
// ===== TSM EXEC BRIDGE LAYER =====

function tsmWriteScopedExec(vertical, missionId){
  localStorage.setItem("TSM_EXEC_CONFIRMED_" + vertical, JSON.stringify({
    vertical,
    missionId,
    timestamp: Date.now()
  }));
}
</script>

JS

    fi
  done

done

echo "======================================="
echo "✅ STRATEGIST + EXEC BRIDGE COMPLETE"
echo "======================================="
echo ""
echo "NEXT STEP:"
echo "Run enforcer audit again:"
echo "TSM_ENFORCER.audit()"

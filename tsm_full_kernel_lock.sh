#!/bin/bash

echo "======================================="
echo "TSM FULL KERNEL LOCK PASS"
echo "======================================="

ROOT="html"

echo ""
echo "🧠 STEP 1 — Injecting TSM_KERNEL.setRelay() patch reference"
echo "-----------------------------------------------------------"

KERNEL_FILE="core/tsm-kernel.js"

if [ -f "$KERNEL_FILE" ]; then
cat << 'EOF' >> "$KERNEL_FILE"


// ===============================
// 🔒 KERNEL HARDENED RELAY API
// ===============================
TSM_KERNEL.setRelay = function(vertical, payload) {
  if (!vertical) throw new Error("Missing vertical relay key");

  const key = `tsm_war_relay_${vertical}`;

  const normalizedPayload = {
    timestamp: Date.now(),
    vertical,
    payload
  };

  localStorage.setItem(key, JSON.stringify(normalizedPayload));

  return {
    status: "OK",
    key,
    written: true
  };
};
EOF
else
  echo "❌ Kernel file not found at $KERNEL_FILE"
fi


echo ""
echo "🛡️ STEP 2 — Injecting Enforcer Rule"
echo "-------------------------------------"

ENFORCER_FILE="core/tsm-enforcer.js"

if [ -f "$ENFORCER_FILE" ]; then
cat << 'EOF' >> "$ENFORCER_FILE"


// ===============================
// 🚨 HARDEN MODE RULE
// ===============================
TSM_ENFORCER.rules = TSM_ENFORCER.rules || [];

TSM_ENFORCER.rules.push({
  id: "NO_DIRECT_RELAY_WRITE",
  pattern: /(localStorage\.setItem\(\"tsm_war_relay_|sessionStorage\.setItem\(\"TSM_WAR_RELAY_)/,
  severity: "CRITICAL",
  message: "Direct relay mutation detected. Must use TSM_KERNEL.setRelay()"
});
EOF
else
  echo "❌ Enforcer file not found at $ENFORCER_FILE"
fi


echo ""
echo "🔁 STEP 3 — Normalize casing (TSM_WAR_RELAY → tsm_war_relay)"
echo "--------------------------------------------------------------"

grep -rl "TSM_WAR_RELAY_" $ROOT 2>/dev/null | while read file; do
  sed -i 's/TSM_WAR_RELAY_/tsm_war_relay_/g' "$file"
done


echo ""
echo "🔁 STEP 4 — Migrate direct localStorage relay writes"
echo "------------------------------------------------------"

grep -rl "localStorage.setItem(\"tsm_war_relay_" $ROOT 2>/dev/null | while read file; do
  sed -i -E 's/localStorage\.setItem\("tsm_war_relay_([a-zA-Z0-9\-]+)",\s*(.+)\);/TSM_KERNEL.setRelay("\1", \2);/g' "$file"
done


echo ""
echo "🔁 STEP 5 — Migrate sessionStorage legacy relay writes"
echo "--------------------------------------------------------"

grep -rl "sessionStorage.setItem(\"TSM_WAR_RELAY_" $ROOT 2>/dev/null | while read file; do
  sed -i -E 's/sessionStorage\.setItem\("TSM_WAR_RELAY_([a-zA-Z0-9\-]+)",\s*(.+)\);/TSM_KERNEL.setRelay("\1", \2);/g' "$file"
done


echo ""
echo "🧹 STEP 6 — Cleanup validation scan"
echo "------------------------------------"

echo "Remaining direct relay writes (should be ZERO):"

grep -Rni "localStorage.setItem(\"tsm_war_relay" html 2>/dev/null
grep -Rni "sessionStorage.setItem(\"TSM_WAR_RELAY" html 2>/dev/null
grep -Rni "TSM_WAR_RELAY_" html 2>/dev/null


echo ""
echo "======================================="
echo "✅ FULL KERNEL LOCK COMPLETE"
echo "======================================="
echo ""
echo "NEXT REQUIRED ACTION:"
echo "TSM_ENFORCER.audit()"
echo ""
echo "EXPECTED STATE:"
echo "- Kernel is ONLY mutation layer"
echo "- Enforcer blocks violations"
echo "- UI is read-only"
echo "- Relays fully normalized"
echo "======================================="
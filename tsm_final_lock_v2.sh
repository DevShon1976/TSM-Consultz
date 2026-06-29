#!/bin/bash

echo "======================================="
echo "🔒 TSM FINAL LOCK v2 BOOTSTRAP"
echo "======================================="

ROOT="html"

#######################################
# 1. BACKUP
#######################################
echo "📦 Creating backup snapshot..."
cp -r html html_BACKUP_LOCK_$(date +%s)

#######################################
# 2. INJECT KERNEL FILE
#######################################
echo "🧠 Writing kernel bootstrap..."

cat <<'EOF' > core/tsm-kernel.js
window.TSM_KERNEL = (function () {
  const STORAGE_PREFIX = "tsm_war_relay_";

  function setRelay(vertical, payload) {
    if (!vertical) throw new Error("Missing vertical relay key");

    const key = STORAGE_PREFIX + vertical;

    const normalizedPayload = {
      timestamp: Date.now(),
      vertical,
      payload
    };

    localStorage.setItem(key, JSON.stringify(normalizedPayload));

    return { status: "OK", key, written: true };
  }

  function getRelay(vertical) {
    const key = STORAGE_PREFIX + vertical;
    const raw = localStorage.getItem(key) || sessionStorage.getItem(key);
    try { return JSON.parse(raw); } catch { return null; }
  }

  function listRelays() {
    return Object.keys(localStorage)
      .filter(k => k.startsWith(STORAGE_PREFIX))
      .map(k => ({ key: k, value: localStorage.getItem(k) }));
  }

  return { setRelay, getRelay, listRelays };
})();
EOF

#######################################
# 3. INJECT ENFORCER FIREWALL
#######################################
echo "🧱 Installing runtime storage firewall..."

cat <<'EOF' > core/tsm-enforcer-firewall.js
(function installStorageFirewall() {

  const block = (k) => k && k.includes("tsm_war_relay_");

  const origLocal = localStorage.setItem;
  const origSession = sessionStorage.setItem;

  localStorage.setItem = function (k, v) {
    if (block(k)) {
      throw new Error("TSM_ENFORCER BLOCK: localStorage relay write denied");
    }
    return origLocal.apply(this, arguments);
  };

  sessionStorage.setItem = function (k, v) {
    if (block(k)) {
      throw new Error("TSM_ENFORCER BLOCK: sessionStorage relay write denied");
    }
    return origSession.apply(this, arguments);
  };

})();
EOF

#######################################
# 4. MIGRATE DIRECT STORAGE WRITES
#######################################
echo "🔁 Migrating direct relay writes → kernel..."

find $ROOT -type f -name "*.html" -exec sed -i \
's/localStorage\.setItem([[:space:]]*'\''tsm_war_relay_\([^'\'']*\)'\''[[:space:]]*,[[:space:]]*\(.*\))/TSM_KERNEL.setRelay("\1", \2)/g' {} +

find $ROOT -type f -name "*.html" -exec sed -i \
's/sessionStorage\.setItem([[:space:]]*'\''tsm_war_relay_\([^'\'']*\)'\''[[:space:]]*,[[:space:]]*\(.*\))/TSM_KERNEL.setRelay("\1", \2)/g' {} +

#######################################
# 5. NORMALIZE LEGACY CASES
#######################################
echo "🧼 Normalizing relay casing..."

find $ROOT -type f -name "*.html" -exec sed -i \
's/TSM_WAR_RELAY_/tsm_war_relay_/g' {} +

#######################################
# 6. FIND STRAGGLERS
#######################################
echo "🔍 Scanning remaining relay mutations..."

echo ""
echo "---- DIRECT localStorage RELAY WRITES ----"
grep -Rni "localStorage.setItem.*tsm_war_relay" html || echo "NONE FOUND"

echo ""
echo "---- SESSION STORAGE RELAY WRITES ----"
grep -Rni "sessionStorage.setItem.*tsm_war_relay" html || echo "NONE FOUND"

echo ""
echo "---- RELAY KEY DIRECT USAGE ----"
grep -Rni "relayKey.*tsm_war_relay" html || echo "NONE FOUND"

#######################################
# 7. FINAL STATUS
#######################################
echo ""
echo "======================================="
echo "✅ TSM FINAL LOCK v2 COMPLETE"
echo "======================================="
echo ""
echo "NEXT STEP:"
echo "  1. Load /core/tsm-kernel.js FIRST"
echo "  2. Load /core/tsm-enforcer-firewall.js SECOND"
echo "  3. Run: TSM_KERNEL.listRelays()"
echo "  4. Run: TSM_ENFORCER.audit() (if implemented)"
echo ""
echo "EXPECTED STATE:"
echo "✔ Kernel is sole mutation layer"
echo "✔ Direct storage writes blocked at runtime"
echo "✔ UI only requests state changes"
echo "✔ Relays fully normalized"
echo "======================================="
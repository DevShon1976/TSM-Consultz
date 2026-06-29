#!/usr/bin/env bash

echo "======================================="
echo "🔒 TSM QUANTUM LOCK APPLY (FIXED)"
echo "======================================="

# 1. BACKUP
echo "📦 Backup..."
cp -r html html_BACKUP_QUANTUM_LOCK

# 2. DEFINE SAFE CORE PATH
CORE_DIR="html/core"

echo "📁 Ensuring core directory exists..."
mkdir -p "$CORE_DIR"

# 3. KERNEL
echo "🧠 Installing kernel..."
cat > "$CORE_DIR/tsm-kernel.js" <<'EOF'
window.TSM_KERNEL = (function () {
  const PREFIX = "tsm_war_relay_";

  function setRelay(v, p) {
    localStorage.setItem(PREFIX + v, JSON.stringify({
      ts: Date.now(),
      v, p
    }));
  }

  function getRelay(v) {
    try {
      return JSON.parse(localStorage.getItem(PREFIX + v));
    } catch {
      return null;
    }
  }

  return { setRelay, getRelay };
})();
EOF

# 4. REGISTRY
echo "🧱 Installing registry..."
cat > "$CORE_DIR/tsm-relay-registry.js" <<'EOF'
window.TSM_RELAY_REGISTRY = (function () {
  const map = new Map();

  function register(k, v) { map.set(k, v); }

  function resolve(k) {
    return map.get(k) || k;
  }

  return { register, resolve };
})();
EOF

# 5. ENFORCER
echo "🧱 Installing enforcer..."
cat > "$CORE_DIR/tsm-enforcer.js" <<'EOF'
(function () {
  const block = (k) => k && k.includes("tsm_war_relay_");

  const l = localStorage.setItem;
  const s = sessionStorage.setItem;

  localStorage.setItem = function (k, v) {
    if (block(k)) throw new Error("BLOCKED RELAY WRITE");
    return l.apply(this, arguments);
  };

  sessionStorage.setItem = function (k, v) {
    if (block(k)) throw new Error("BLOCKED RELAY WRITE");
    return s.apply(this, arguments);
  };
})();
EOF

# 6. ONLY SCAN LIVE HTML (NOT BACKUPS)
echo "🔍 Scanning live HTML only..."

LIVE=$(find html -type f -name "*.html" ! -name "*.bak")

# 7. MIGRATE relayKey
echo "🔁 Migrating relayKey..."
for f in $LIVE; do
  sed -i 's/relayKey:[[:space:]]*"\([^"]*\)"/relayKey: TSM_RELAY_REGISTRY.resolve("\1")/g' "$f"
done

# 8. MIGRATE STORAGE WRITES
echo "🔁 Migrating storage writes..."
for f in $LIVE; do
  sed -i 's/localStorage\.setItem([[:space:]]*"\(tsm_war_relay_[^"]*\)"[[:space:]]*,[[:space:]]*\(.*\))/TSM_KERNEL.setRelay("\1", \2)/g' "$f"
done

# 9. VERIFY ONLY LIVE FILES
echo "🔍 VERIFY RESULTS..."

echo ""
echo "---- DIRECT WRITES ----"
grep -Rni "localStorage.setItem.*tsm_war_relay" html || echo "NONE"

echo ""
echo "---- SESSION WRITES ----"
grep -Rni "sessionStorage.setItem.*tsm_war_relay" html || echo "NONE"

echo ""
echo "---- LIVE relayKey USAGE ----"
grep -Rni "relayKey" html | grep -v ".bak" | head -20

echo ""
echo "======================================="
echo "✅ FIXED QUANTUM LOCK COMPLETE"
echo "======================================="
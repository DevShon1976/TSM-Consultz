#!/usr/bin/env bash

echo "======================================="
echo "🔒 TSM QUANTUM LOCK APPLY (ONE SHOT)"
echo "======================================="

# 1. BACKUP
echo "📦 Creating backup..."
cp -r html html_BACKUP_QUANTUM_LOCK

# 2. INSTALL KERNEL
echo "🧠 Installing kernel..."

cat > html/core/tsm-kernel.js <<'EOF'
window.TSM_KERNEL = (function () {
  const PREFIX = "tsm_war_relay_";

  function setRelay(vertical, payload) {
    const key = PREFIX + vertical;
    localStorage.setItem(key, JSON.stringify({
      ts: Date.now(),
      vertical,
      payload
    }));
    return { ok: true, key };
  }

  function getRelay(vertical) {
    const key = PREFIX + vertical;
    const raw = localStorage.getItem(key);
    try { return JSON.parse(raw); } catch { return null; }
  }

  return { setRelay, getRelay };
})();
EOF

# 3. INSTALL REGISTRY
echo "🧱 Installing relay registry..."

cat > html/core/tsm-relay-registry.js <<'EOF'
window.TSM_RELAY_REGISTRY = (function () {
  const MAP = new Map();

  function register(name, key) {
    MAP.set(name, key);
  }

  function resolve(name) {
    return MAP.get(name) || name;
  }

  return { register, resolve };
})();
EOF

# 4. INSTALL FIREWALL
echo "🧱 Installing storage firewall..."

cat > html/core/tsm-enforcer.js <<'EOF'
(function () {
  const block = (k) => k && k.includes("tsm_war_relay_");

  const ls = localStorage.setItem;
  const ss = sessionStorage.setItem;

  localStorage.setItem = function(k, v) {
    if (block(k)) throw new Error("BLOCKED: relay write");
    return ls.apply(this, arguments);
  };

  sessionStorage.setItem = function(k, v) {
    if (block(k)) throw new Error("BLOCKED: relay write");
    return ss.apply(this, arguments);
  };
})();
EOF

# 5. MIGRATE relayKey → registry (safe replace)
echo "🔁 Migrating relayKey usage..."

find html -type f -name "*.html" -exec sed -i \
's/relayKey:[[:space:]]*"\([^"]*\)"/relayKey: TSM_RELAY_REGISTRY.resolve("\1")/g' {} +

# 6. MIGRATE direct storage writes → kernel
echo "🔁 Migrating storage writes..."

find html -type f -name "*.html" -exec sed -i \
's/localStorage\.setItem([[:space:]]*"\(tsm_war_relay_[^"]*\)"[[:space:]]*,[[:space:]]*\(.*\))/TSM_KERNEL.setRelay("\1", \2)/g' {} +

find html -type f -name "*.html" -exec sed -i \
's/sessionStorage\.setItem([[:space:]]*"\(tsm_war_relay_[^"]*\)"[[:space:]]*,[[:space:]]*\(.*\))/TSM_KERNEL.setRelay("\1", \2)/g' {} +

# 7. VERIFY STATE
echo "🔍 VERIFYING..."

echo ""
echo "---- DIRECT WRITES ----"
grep -Rni "localStorage.setItem.*tsm_war_relay" html || echo "NONE"

echo ""
echo "---- SESSION WRITES ----"
grep -Rni "sessionStorage.setItem.*tsm_war_relay" html || echo "NONE"

echo ""
echo "---- RELAY KEYS ----"
grep -Rni "relayKey" html | head -20

echo ""
echo "======================================="
echo "✅ QUANTUM LOCK APPLY COMPLETE"
echo "======================================="
echo "Next step: load core scripts in order:"
echo "1. tsm-kernel.js"
echo "2. tsm-relay-registry.js"
echo "3. tsm-enforcer.js"
echo "======================================="
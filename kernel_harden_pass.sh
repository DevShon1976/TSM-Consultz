#!/bin/bash

echo "======================================="
echo "TSM KERNEL HARDEN PASS"
echo "======================================="

ROOT_DIR="html"

echo "🔍 Scanning for legacy relay patterns..."

# 1. Normalize mixed casing (TSM_WAR_RELAY_ → tsm_war_relay_)
echo "🧼 Normalizing casing..."
grep -rl "TSM_WAR_RELAY_" $ROOT_DIR | while read file; do
  sed -i 's/TSM_WAR_RELAY_/tsm_war_relay_/g' "$file"
done

# 2. Replace direct localStorage writes for relay keys
echo "🔁 Migrating localStorage relay writes → TSM_KERNEL.setRelay"

grep -rl "localStorage.setItem(\"tsm_war_relay_" $ROOT_DIR | while read file; do
  sed -i -E 's/localStorage\.setItem\("tsm_war_relay_([a-zA-Z0-9\-]+)",\s*(.+)\);/TSM_KERNEL.setRelay("\1", \2);/g' "$file"
done

# 3. Replace sessionStorage relay writes
grep -rl "sessionStorage.setItem(\"TSM_WAR_RELAY" $ROOT_DIR | while read file; do
  sed -i -E 's/sessionStorage\.setItem\("TSM_WAR_RELAY_([a-zA-Z0-9\-]+)",\s*(.+)\);/TSM_KERNEL.setRelay("\1", \2);/g' "$file"
done

# 4. Remove duplicate relay reads fallback patterns
echo "🧹 Cleaning mixed relay reads..."
grep -rl "TSM_WAR_RELAY_" $ROOT_DIR | while read file; do
  sed -i 's/TSM_WAR_RELAY_/tsm_war_relay_/g' "$file"
done

echo "======================================="
echo "✅ HARDEN PASS COMPLETE"
echo "======================================="
echo ""
echo "NEXT STEP:"
echo "Run: TSM_ENFORCER.audit()"
echo "Then verify:"
echo "grep -Rni 'localStorage.setItem.*tsm_war_relay' html"
echo "======================================="bash 
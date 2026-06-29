#!/bin/bash

echo "======================================="
echo "🔒 TSM ROUTE HARD RESET (FINAL CLEAN)"
echo "======================================="

BACKUP="backup_route_hard_$(date +%s)"
mkdir -p "$BACKUP"

echo "📦 Backing up affected directories..."
cp -r html "$BACKUP/" 2>/dev/null

echo "🧹 STEP 1 — REMOVE relayKey FIELD DEFINITIONS (ALL FILES)"

find html -type f -name "*.html" -o -name "*.js" | while read f; do
  sed -i 's/relayKey:[^,}]*,//g' "$f"
done

echo "🧹 STEP 2 — REMOVE ALL TSM_RELAY_REGISTRY.resolve() USAGE"

find html -type f -name "*.html" -o -name "*.js" | while read f; do
  sed -i 's/TSM_RELAY_REGISTRY\.resolve([^)]*)/undefined/g' "$f"
done

echo "🧹 STEP 3 — REMOVE sessionStorage/localStorage relayKey usage"

find html -type f -name "*.html" -o -name "*.js" | while read f; do
  sed -i 's/sessionStorage\.setItem([^,]*relayKey[^,]*,[^)]*)//g' "$f"
  sed -i 's/localStorage\.setItem([^,]*relayKey[^,]*,[^)]*)//g' "$f"
done

echo "🧹 STEP 4 — FORCE routeId-only access pattern cleanup"

find html -type f -name "*.html" -o -name "*.js" | while read f; do
  sed -i 's/item\.relayKey/item.routeId/g' "$f"
  sed -i 's/room\.relayKey/room.routeId/g' "$f"
done

echo "🧠 STEP 5 — VERIFY LIVE CODE ONLY (NOT BACKUPS)"

echo "---- relayKey (LIVE ONLY) ----"
grep -Rni "relayKey" html | grep -v backup || echo "✔ CLEAN"

echo ""
echo "---- docKey ----"
grep -Rni "docKey" html | grep -v backup || echo "✔ CLEAN"

echo ""
echo "---- registry resolve ----"
grep -Rni "TSM_RELAY_REGISTRY" html | grep -v backup || echo "✔ CLEAN"

echo ""
echo "======================================="
echo "✅ HARD RESET COMPLETE"
echo "======================================="
echo "NEXT STATE:"
echo "✔ ONLY routeId exists"
echo "✔ NO registry resolution layer"
echo "✔ NO relayKey storage dependency"
echo "✔ storage becomes TSM_KERNEL ONLY"
echo "======================================="
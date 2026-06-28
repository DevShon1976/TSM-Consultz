#!/bin/bash

echo "======================================="
echo "🔒 TSM ROUTE UNIFICATION (ONE SHOT)"
echo "======================================="

TARGET="html/tsm-doc-search-multi.html"
BACKUP="${TARGET}.route_backup"

echo "📦 Creating backup..."
cp "$TARGET" "$BACKUP"

echo "🧹 Removing relayKey/url/docKey fields..."

# Remove relayKey
sed -i 's/relayKey:[^,}]*,//g' "$TARGET"

# Remove url
sed -i 's/url:[^,}]*,//g' "$TARGET"

# Remove docKey
sed -i 's/docKey:[^,}]*,//g' "$TARGET"

echo "🔁 Converting remaining objects to routeId-only format..."

# If lines still contain labels with trailing commas cleanup pass
sed -i 's/,{/,/g' "$TARGET"

echo "🔍 Scanning for leftover legacy fields..."

echo ""
echo "---- relayKey still present ----"
grep -n "relayKey" "$TARGET" || echo "NONE FOUND"

echo ""
echo "---- url still present ----"
grep -n "url:" "$TARGET" || echo "NONE FOUND"

echo ""
echo "---- docKey still present ----"
grep -n "docKey" "$TARGET" || echo "NONE FOUND"

echo ""
echo "---- routeId structure check ----"
grep -n "routeId" "$TARGET" | head -20

echo ""
echo "======================================="
echo "✅ ROUTE UNIFICATION COMPLETE"
echo "======================================="
echo "NEXT STEP:"
echo "1. Ensure TSM_ROUTE.get(routeId) is used everywhere"
echo "2. Remove any direct url/relayKey access"
echo "======================================="
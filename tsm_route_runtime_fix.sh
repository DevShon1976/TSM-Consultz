#!/bin/bash

echo "======================================="
echo "🔒 TSM RUNTIME ROUTE FIX (PHASE 2)"
echo "======================================="

FILE="html/tsm-doc-search-multi.html"

echo "📦 Backing up..."
cp "$FILE" "$FILE.runtime_backup"

echo "🔁 Fixing runtime relayKey usage..."

# FIX 1: replace room.relayKey usage
sed -i 's/room\.relayKey/TSM_ROUTE.get(room.routeId).relayKey/g' "$FILE"

# FIX 2: replace room.docKey usage
sed -i 's/room\.docKey/TSM_ROUTE.get(room.routeId).docKey/g' "$FILE"

# FIX 3: safety scan
echo ""
echo "---- CHECKING OLD PATTERNS ----"

grep -n "room\.relayKey" "$FILE" || echo "NONE FOUND"
grep -n "room\.docKey" "$FILE" || echo "NONE FOUND"

echo ""
echo "======================================="
echo "✅ RUNTIME FIX COMPLETE"
echo "======================================="
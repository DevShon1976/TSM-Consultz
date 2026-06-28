#!/bin/bash

echo "======================================="
echo "🔒 FINAL DOCKEY KILL PATCH"
echo "======================================="

mkdir -p .tsm_backup_final_kill
cp -r html .tsm_backup_final_kill/

echo "📦 Backup created"

echo ""
echo "🧹 FIX 1 — REMOVE route_resolver docKey FIELD"

sed -i 's/docKey:[[:space:]]*base\.docKey,//g' html/core/tsm-route-resolver.js
sed -i 's/docKey:[[:space:]]*base\.docKey//g' html/core/tsm-route-resolver.js

echo "✔ route-resolver cleaned"

echo ""
echo "🧹 FIX 2 — KILL LEGACY sessionStorage.docKey WRITES (BOTH FILES)"

find html -type f -name "*.html" -exec sed -i \
's/sessionStorage\.setItem([[:space:]]*room\.docKey[[:space:]]*,[[:space:]]*/TSM_KERNEL.setDoc(room.routeId, /g' {} +

find html -type f -name "*.html" -exec sed -i \
's/sessionStorage\.setItem([[:space:]]*TSM_ROUTE\.get([^)]*)\.docKey[[:space:]]*,[[:space:]]*/TSM_KERNEL.setDoc(\1, /g' {} +

echo "✔ storage writes removed"

echo ""
echo "🧹 FIX 3 — REMOVE ANY REMAINING DIRECT ACCESS"

find html -type f -name "*.html" -exec sed -i \
's/\.docKey//g' {} +

echo "✔ direct access removed"

echo ""
echo "🔍 FINAL VERIFICATION"

echo "---- docKey remaining ----"
grep -Rni "docKey" html || echo "NONE FOUND"

echo ""
echo "---- unsafe access ----"
grep -Rni "\.docKey" html || echo "NONE FOUND"

echo ""
echo "======================================="
echo "✅ FINAL DOCKEY KILL COMPLETE"
echo "======================================="
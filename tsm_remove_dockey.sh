#!/bin/bash

echo "======================================="
echo "🔒 TSM DOCKEY ELIMINATION (ONE SHOT)"
echo "======================================="

mkdir -p .tsm_backup_dockey_fix
cp -r html .tsm_backup_dockey_fix/

echo "📦 Backup created"

echo ""
echo "🧹 STEP 1 — REMOVE docKey FIELDS"
find html -type f -name "*.html" -exec sed -i \
's/,*[[:space:]]*docKey[[:space:]]*:[[:space:]]*["'\''][^"'\'']*["'\'']//g' {} +

find html -type f -name "*.html" -exec sed -i \
's/docKey[[:space:]]*:[[:space:]]*["'\''][^"'\'']*["'\'']\,\?//g' {} +

echo "✔ docKey fields removed"

echo ""
echo "🔁 STEP 2 — REPLACE docKey USAGE IN STORAGE CALLS"

# sessionStorage.setItem(room.docKey, ...)
find html -type f -name "*.html" -exec sed -i \
's/sessionStorage\.setItem([[:space:]]*room\.docKey[[:space:]]*,/TSM_KERNEL.setDoc(room.routeId,/g' {} +

# generic docKey usage
find html -type f -name "*.html" -exec sed -i \
's/sessionStorage\.setItem([[:space:]]*[^,)]*docKey[^,)]*,/TSM_KERNEL.setDoc(room.routeId,/g' {} +

echo "✔ storage writes migrated"

echo ""
echo "🧠 STEP 3 — REMOVE DIRECT docKey READS"

find html -type f -name "*.html" -exec sed -i \
's/room\.docKey/TSM_ROUTE.get(room.routeId).relayKey + "_doc"/g' {} +

find html -type f -name "*.html" -exec sed -i \
's/item\.docKey/TSM_ROUTE.get(item.routeId).relayKey + "_doc"/g' {} +

echo "✔ reads migrated"

echo ""
echo "🔍 STEP 4 — FINAL SCAN"

echo "---- REMAINING docKey ----"
grep -Rni "docKey" html | grep -v ".bak" | head -20 || echo "NONE FOUND"

echo ""
echo "======================================="
echo "✅ DOCKEY ELIMINATION COMPLETE"
echo "======================================="
echo ""
echo "NEXT:"
echo "1. Ensure TSM_ROUTE.get(routeId) exists"
echo "2. Ensure TSM_KERNEL.setDoc/getDoc exist"
echo "3. Remove any manual docKey usage in new code"
echo "======================================="
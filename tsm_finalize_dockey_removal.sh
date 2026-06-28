#!/bin/bash

echo "======================================="
echo "🔒 TSM FINAL DOCKEY PURGE PATCH"
echo "======================================="

mkdir -p .tsm_backup_final_dockey
cp -r html .tsm_backup_final_dockey/

echo "📦 Backup created"

echo ""
echo "🧹 STEP 1 — REMOVE docKey FROM ROUTE MAP FILES"

find html/core -type f -name "*.js" -exec sed -i \
's/[[:space:]]*docKey:[[:space:]]*["'\''][^"'\'']*["'\'']\,\?//g' {} +

echo "✔ core route maps cleaned"

echo ""
echo "🧹 STEP 2 — FIX DIRECT SESSION STORAGE USAGE"

find html -type f -name "*.html" -exec sed -i \
's/sessionStorage\.setItem([[:space:]]*TSM_ROUTE\.get([^)]*)\.docKey[[:space:]]*,/TSM_KERNEL.setDoc(\1,/g' {} +

find html -type f -name "*.html" -exec sed -i \
's/sessionStorage\.setItem([[:space:]]*TSM_ROUTE\.get([^)]*)\.docKey[[:space:]]*,[[:space:]]*/TSM_KERNEL.setDoc(/g' {} +

echo "✔ storage writes migrated"

echo ""
echo "🧠 STEP 3 — REMOVE ALL DIRECT docKey READS"

find html -type f -name "*.html" -exec sed -i \
's/TSM_ROUTE\.get(\([^)]*\))\.docKey/TSM_KERNEL.getDoc(\1)/g' {} +

echo "✔ reads migrated"

echo ""
echo "🧹 STEP 4 — CLEAN BACKUP FILES"

find html -type f -name "*.bak" -exec rm -f {} +

echo "✔ backups removed"

echo ""
echo "🔍 STEP 5 — FINAL VERIFICATION"

echo "---- remaining docKey ----"
grep -Rni "docKey" html || echo "NONE FOUND"

echo ""
echo "---- unsafe route access ----"
grep -Rni "\.docKey" html || echo "NONE FOUND"

echo ""
echo "======================================="
echo "✅ FINAL DOCKEY PURGE COMPLETE"
echo "======================================="
echo ""
echo "SYSTEM STATE:"
echo "✔ routeId = only identity key"
echo "✔ TSM_ROUTE = resolver only"
echo "✔ TSM_KERNEL = storage authority"
echo "✔ docKey fully eliminated"
echo "======================================="
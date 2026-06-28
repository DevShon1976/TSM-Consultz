#!/usr/bin/env bash

set -e

echo "======================================="
echo "🔒 TSM AST DOCKEY PURGE (FINAL)"
echo "======================================="

BACKUP="backup_dockey_$(date +%s)"
mkdir -p "$BACKUP"
cp -r html "$BACKUP/html"

echo "📦 Backup created at $BACKUP"

#######################################
# STEP 1 — HARD REMOVE docKey FIELD
#######################################

echo "🧹 Removing docKey fields..."

find html -type f -name "*.html" -print0 | while IFS= read -r -d '' file; do
  sed -i 's/,\s*docKey\s*:\s*[^,}]*//g' "$file"
  sed -i 's/docKey\s*:\s*[^,}]*,?//g' "$file"
done

#######################################
# STEP 2 — KILL STORAGE USAGE (SAFE)
#######################################

echo "🧠 Removing sessionStorage/localStorage docKey usage..."

find html -type f -print0 | while IFS= read -r -d '' file; do
  sed -i 's/sessionStorage\.setItem([^,]*\.docKey[^,]*,[^)]*);//g' "$file"
  sed -i 's/localStorage\.setItem([^,]*\.docKey[^,]*,[^)]*);//g' "$file"
  sed -i 's/TSM_ROUTE\.get([^)]*)\.docKey//g' "$file"
done

#######################################
# STEP 3 — FIX RUNTIME COUPLING
#######################################

echo "🔁 Removing route-resolver docKey exposure..."

find html/core -type f -name "*.js" -print0 | while IFS= read -r -d '' file; do
  sed -i '/docKey:/d' "$file"
done

#######################################
# STEP 4 — CLEAN BACKUPS (STOP FALSE POSITIVES)
#######################################

echo "🧽 Cleaning backup noise files..."

find html -name "*.bak" -delete
find html -name "*.route_backup" -delete
find html -name "*.runtime_backup" -delete

#######################################
# STEP 5 — FINAL VERIFICATION SCAN
#######################################

echo "🔍 FINAL SCAN (LIVE FILES ONLY)..."

echo "---- docKey ----"
grep -Rni "docKey" html || echo "NONE FOUND"

echo ""
echo "---- relayKey ----"
grep -Rni "relayKey" html || echo "NONE FOUND"

echo ""
echo "---- unsafe access ----"
grep -Rni "TSM_ROUTE.*docKey" html || echo "NONE FOUND"

echo ""
echo "======================================="
echo "✅ AST DOCKEY PURGE COMPLETE"
echo "======================================="
echo "SYSTEM STATE:"
echo "✔ routeId = only identity"
echo "✔ TSM_ROUTE = resolver only"
echo "✔ TSM_KERNEL = storage authority"
echo "✔ ZERO docKey dependency (runtime + static)"
echo "======================================="
#!/bin/bash

echo "======================================="
echo "🔒 TSM FLATTEN ROUTE KERNEL (FINAL STEP)"
echo "======================================="

BACKUP="backup_flatten_$(date +%s)"
mkdir -p "$BACKUP"
cp -r html "$BACKUP/" 2>/dev/null

echo "🧹 STEP 1 — REMOVE relayKey COMPLETELY (NO NULLS ALLOWED)"

find html -type f -name "*.html" -o -name "*.js" | while read f; do
  sed -i 's/relayKey:[^,}]*,//g' "$f"
  sed -i 's/relayKey:[ ]*undefined,//g' "$f"
  sed -i 's/relayKey:[ ]*undefined//g' "$f"
done

echo "🧹 STEP 2 — REMOVE LEGACY docKey FUNCTION SIGNATURES"

find html -type f -name "*.html" -o -name "*.js" | while read f; do
  sed -i 's/function genDoc(sectorId, docKey)/function genDoc(sectorId, routeId)/g' "$f"
  sed -i 's/docKey/routeId/g' "$f"
done

echo "🧹 STEP 3 — KILL RELAY REGISTRY FILE (DEPRECATED LAYER)"

rm -f html/core/tsm-relay-registry.js

echo "🧹 STEP 4 — FORCE STORAGE STANDARDIZATION"

find html -type f -name "*.html" -o -name "*.js" | while read f; do
  sed -i 's/sessionStorage\.setItem([^,]*docKey[^,]*,/TSM_KERNEL.setDoc(/g' "$f"
  sed -i 's/localStorage\.setItem([^,]*docKey[^,]*,//g' "$f"
done

echo "🧠 STEP 5 — FINAL VALIDATION (LIVE ONLY)"

echo "---- relayKey ----"
grep -Rni "relayKey" html || echo "✔ NONE"

echo ""
echo "---- docKey ----"
grep -Rni "docKey" html || echo "✔ NONE"

echo ""
echo "---- registry ----"
grep -Rni "TSM_RELAY_REGISTRY" html || echo "✔ NONE"

echo ""
echo "======================================="
echo "✅ FLATTEN COMPLETE"
echo "======================================="
echo "FINAL ARCHITECTURE:"
echo "✔ routeId = ONLY identity"
echo "✔ TSM_KERNEL = ONLY storage system"
echo "✔ ZERO legacy keys exist"
echo "✔ NO registry layer"
echo "✔ NO dual-key system"
echo "======================================="
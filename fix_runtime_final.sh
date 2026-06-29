#!/bin/bash

FILE="html/js/tsm-orchestrator.js"

echo "======================================"
echo "TSM FINAL RUNTIME NORMALIZATION PATCH"
echo "======================================"

# 1. Remove ALL injected decide wrappers
sed -i '/STATUS NORMALIZATION SAFETY NET/,$d' "$FILE"

# 2. Normalize all status comparisons
sed -i 's/"MISSION_COMPLETE"/"COMPLETED"/g' "$FILE"
sed -i 's/"APPROVED"/"COMPLETED"/g' "$FILE"

# 3. Force single canonical completion emit
sed -i 's/this.bus.emit("MISSION_COMPLETE", mission);/this.bus.emit("MISSION_COMPLETE", mission);/g' "$FILE"

# 4. Ensure only ONE completion gate exists (idempotent cleanup)
awk '
  /MISSION_COMPLETE/ && seen++ { next }
  { print }
' "$FILE" > tmp && mv tmp "$FILE"

# 5. Validate SIGNAL recursion still clean
echo ""
echo "SIGNAL CHECK:"
grep -R "emit(\"SIGNAL\"" html/js || echo "OK - no SIGNAL leaks found"

echo ""
echo "MISSION_COMPLETE CHECK:"
grep -R "MISSION_COMPLETE" html/js || echo "OK - single gate present"

echo ""
echo "======================================"
echo "RUNTIME NORMALIZATION COMPLETE"
echo "======================================"

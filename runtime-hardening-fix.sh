#!/usr/bin/env bash

echo "======================================"
echo "TSM RUNTIME HARDENING ONE-SHOT PATCH"
echo "======================================"

ROOT="html/js"

echo "[1/6] Fixing orchestrator SIGNAL recursion..."

sed -i 's/window\.TSMEventBus\.emit("SIGNAL"/this.bus.emit("MISSION_UPDATE"/g' \
$ROOT/tsm-orchestrator.js

echo "[2/6] Fixing bad createMission signature..."

sed -i 's/createMission("SIGNAL", signal)/createMission(signal)/g' \
$ROOT/tsm-orchestrator.js

echo "[3/6] Removing direct SIGNAL re-emission patterns..."

sed -i 's/window\.TSMEventBus\.emit("SIGNAL"/this.bus.emit("MISSION_UPDATE"/g' \
$ROOT/tsm-orchestrator.js

echo "[4/6] Hard-block kernel SIGNAL emission..."

find $ROOT/core -type f -name "*.js" -exec \
sed -i 's/window\.TSMEventBus\.emit("SIGNAL"/\/\/ SIGNAL BLOCKED - kernel no longer emits/g' {} \;

echo "[5/6] Normalize _emit → bus.emit in core mission engine..."

sed -i 's/_emit(/this.bus.emit(/g' \
$ROOT/core/tsm-mission-engine.js

echo "[6/6] Safety sweep: remove stray SIGNAL emits outside orchestrator..."

grep -R 'emit("SIGNAL"' $ROOT | grep -v "tsm-orchestrator.js" | while read -r line ; do
  file=$(echo $line | cut -d: -f1)
  echo "Patching $file"
  sed -i 's/emit("SIGNAL"/emit("MISSION_UPDATE"/g' "$file"
done

echo "======================================"
echo "PATCH COMPLETE"
echo "Run validation:"
echo "grep -R 'emit(\"SIGNAL\"' html/js"
echo "======================================"
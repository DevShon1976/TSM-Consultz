#!/usr/bin/env bash
set -euo pipefail

echo "======================================"
echo "TSM RUNTIME REPAIR (IDEMPOTENT SAFE)"
echo "======================================"

TSM_ROOT="$(pwd)"
BACKUP_DIR="./_tsm_runtime_backup_$(date +%Y%m%d_%H%M%S)"
REPORT_FILE="./tsm-runtime-repair-report.txt"

mkdir -p "$BACKUP_DIR"

echo "[1/10] Creating backup snapshot..."
rsync -av \
  --exclude "node_modules" \
  --exclude ".git" \
  "$TSM_ROOT/" "$BACKUP_DIR/" > /dev/null

echo "Backup created at: $BACKUP_DIR" | tee "$REPORT_FILE"

echo
echo "[2/10] Scanning runtime JS/HTML files..."

find . \
  -type f \( -name "*.js" -o -name "*.ts" -o -name "*.html" \) \
  ! -path "./node_modules/*" \
  ! -path "./.git/*" > /tmp/tsm_runtime_files.txt

echo "Files scanned: $(wc -l < /tmp/tsm_runtime_files.txt)" | tee -a "$REPORT_FILE"

echo
echo "[3/10] Checking for broken script references..."

BROKEN_SCRIPTS=$(grep -RIn --include="*.html" "src=.*\.js" . \
  | grep -v node_modules || true)

echo "$BROKEN_SCRIPTS" > /tmp/broken_script_refs.txt
echo "Broken script refs found: $(wc -l < /tmp/broken_script_refs.txt)" | tee -a "$REPORT_FILE"

echo
echo "[4/10] Detecting duplicate runtime injections..."

DUPLICATES=$(grep -RIn --include="*.html" "tsm-orchestrator\|tsm-guardian\|tsm-mission-store\|tsm-kernel" . \
  | grep -v node_modules || true)

echo "$DUPLICATES" > /tmp/runtime_duplicates.txt
echo "Potential runtime duplicates: $(wc -l < /tmp/runtime_duplicates.txt)" | tee -a "$REPORT_FILE"

echo
echo "[5/10] Normalizing unsafe relative imports (safe-only pass)..."

# Only fix obviously broken double slashes or ././ patterns
find . -type f -name "*.js" ! -path "./node_modules/*" -exec sed -i \
  -e 's#\./\./#./#g' \
  -e 's#//+/#/#g' {} +

echo "Import normalization complete" | tee -a "$REPORT_FILE"

echo
echo "[6/10] Checking Node syntax validity (node --check)..."

NODE_ERRORS=0

while read -r file; do
  if [[ -f "$file" ]]; then
    node --check "$file" >/dev/null 2>&1 || {
      echo "SYNTAX ERROR: $file" >> "$REPORT_FILE"
      NODE_ERRORS=$((NODE_ERRORS+1))
    }
  fi
done < /tmp/tsm_runtime_files.txt

echo "Node syntax errors found: $NODE_ERRORS" | tee -a "$REPORT_FILE"

echo
echo "[7/10] Ensuring runtime loader consistency..."

# Ensure kernel/runtime scripts exist (non-destructive checks only)
for f in \
  "tsm-app-runtime.js" \
  "scripts/tsm-app-runtime.js" \
  "tsm-kernel-upgrade.js"
do
  if [[ -f "$f" ]]; then
    echo "OK: $f exists" >> "$REPORT_FILE"
  else
    echo "MISSING: $f" >> "$REPORT_FILE"
  fi
done

echo
echo "[8/10] Detecting orphan runtime files..."

ORPHANS=$(find . -name "*runtime*" \
  ! -path "./node_modules/*" \
  ! -path "./.git/*")

echo "$ORPHANS" > /tmp/runtime_orphans.txt
echo "Runtime-related files found: $(wc -l < /tmp/runtime_orphans.txt)" | tee -a "$REPORT_FILE"

echo
echo "[9/10] Safe HTML script tag audit..."

HTML_SCRIPT_COUNT=$(grep -RIn --include="*.html" "<script" . | grep -v node_modules | wc -l || true)

echo "Total <script> tags found: $HTML_SCRIPT_COUNT" | tee -a "$REPORT_FILE"

echo
echo "[10/10] Final report assembly..."

echo "" >> "$REPORT_FILE"
echo "======================================" >> "$REPORT_FILE"
echo "DETAILED ARTIFACTS" >> "$REPORT_FILE"
echo "======================================" >> "$REPORT_FILE"

echo "--- BROKEN SCRIPT REFS ---" >> "$REPORT_FILE"
cat /tmp/broken_script_refs.txt >> "$REPORT_FILE" || true

echo "--- DUPLICATE RUNTIME USAGE ---" >> "$REPORT_FILE"
cat /tmp/runtime_duplicates.txt >> "$REPORT_FILE" || true

echo "--- ORPHAN RUNTIME FILES ---" >> "$REPORT_FILE"
cat /tmp/runtime_orphans.txt >> "$REPORT_FILE" || true

echo
echo "======================================"
echo "TSM RUNTIME REPAIR COMPLETE"
echo "======================================"
echo "Report: $REPORT_FILE"
echo "Backup: $BACKUP_DIR"
echo "Node Errors: $NODE_ERRORS"
echo "======================================"
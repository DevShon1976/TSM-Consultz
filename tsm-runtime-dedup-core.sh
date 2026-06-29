#!/usr/bin/env bash
set -euo pipefail

echo "======================================"
echo "TSM RUNTIME DEDUP CORE (PHASE 2 FIX)"
echo "======================================"

BACKUP="./_tsm_dedup_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP"

echo "[1/5] Creating safety snapshot (lightweight)..."

# ONLY HTML (this avoids your previous freeze problem)
find . -name "*.html" ! -path "./node_modules/*" | while read -r f; do
  cp "$f" "$BACKUP/$(basename "$f")" 2>/dev/null || true
done

echo "[2/
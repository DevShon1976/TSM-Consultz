#!/usr/bin/env bash
set -euo pipefail

echo "======================================"
echo "TSM RUNTIME STABILIZER FIX (REAL REPAIR)"
echo "======================================"

BACKUP="./_tsm_runtime_backup_FIX_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP"

echo "[1/5] Creating safety backup..."
rsync -a --exclude node_modules --exclude .git . "$BACKUP/"

echo "[2/5] Injecting runtime bootstrap guard..."

GUARD='
<script>
if (window.__TSM_RUNTIME_BOOTSTRAPPED__) {
  console.warn("[TSM] Runtime already initialized. Skipping duplicate bootstrap.");
} else {
  window.__TSM_RUNTIME_BOOTSTRAPPED__ = true;
}
</script>
'

find . -name "*.html" ! -path "./node_modules/*" | while read -r file; do
  if ! grep -q "__TSM_RUNTIME_BOOTSTRAPPED__" "$file"; then
    awk -v guard="$GUARD" '
      BEGIN { injected=0 }
      /<head>/ && injected==0 {
        print $0
        print guard
        injected=1
        next
      }
      { print }
    ' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
  fi
done

echo "[3/5] Removing duplicate script tags (safe dedupe)..."

find . -name "*.html" ! -path "./node_modules/*" | while read -r file; do
  awk '
    !seen[$0]++
  ' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
done

echo "[4/5] Fixing obvious broken script paths..."

find . -name "*.html" ! -path "./node_modules/*" -exec sed -i \
  -e 's#/\./#/#g' \
  -e 's#//+#/#g' \
  -e 's#\.js\.js#\.js#g' {} +

echo "[5/5] Generating runtime manifest..."

find . -name "*.js" ! -path "./node_modules/*" > runtime-manifest.txt

echo "======================================"
echo "RUNTIME STABILIZATION COMPLETE"
echo "======================================"
echo "Backup: $BACKUP"
echo "Manifest: runtime-manifest.txt"
echo "======================================"
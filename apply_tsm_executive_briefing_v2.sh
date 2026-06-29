#!/usr/bin/env bash
set -euo pipefail

echo "=========================================="
echo " TSM EXECUTIVE BRIEFING v2 DEPLOY"
echo " (Hard Repair + Full UI Override)"
echo "=========================================="

ROOT_DIR="html"
TARGET_FILE=""

echo ""
echo "Step 1: Locating Executive Portal..."

# robust file discovery (prevents wrong-path failures)
TARGET_FILE=$(find "$ROOT_DIR" -type f \( \
  -name "*executive*portal*.html" \
  -o -name "*exec*portal*.html" \
  -o -name "*construction*executive*.html" \
\) | head -n 1)

if [ -z "$TARGET_FILE" ]; then
  echo "❌ ERROR: No executive portal HTML found."
  exit 1
fi

echo "✔ Found: $TARGET_FILE"

echo ""
echo "Step 2: Backing up file..."
cp "$TARGET_FILE" "${TARGET_FILE}.backup.$(date +%s)"

echo ""
echo "Step 3: Removing legacy widget selectors (safe cleanup)..."

# neutralize broken injection anchors if they exist
sed -i '' \
  -e 's/id="executiveSummary"/id="executiveSummary_old"/g' \
  -e 's/class="executive-summary"/class="executive-summary-old"/g' \
  -e 's/class="exec-report"/class="exec-report-old"/g' \
  -e 's/class="executive-kpi"/class="executive-kpi-old"/g' \
  "$TARGET_FILE" 2>/dev/null || true

echo ""
echo "Step 4: Injecting TSM Executive Briefing mount..."

# ensure mount exists (idempotent insert)
if ! grep -q "tsm-executive-briefing-root" "$TARGET_FILE"; then
  cat <<'HTML_BLOCK' >> "$TARGET_FILE"

<!-- ================= TSM EXECUTIVE BRIEFING v2 ================= -->
<div id="tsm-executive-briefing-root"></div>

<script src="/core/tsm-executive-briefing.js"></script>

<!-- Optional legacy fallback disabled -->
<script>
try {
  console.log("TSM Executive Briefing v2 initialized");
} catch (e) {}
</script>
<!-- =============================================================== -->

HTML_BLOCK
fi

echo ""
echo "Step 5: Validating injection..."

if grep -q "tsm-executive-briefing-root" "$TARGET_FILE"; then
  echo "✔ Mount present"
else
  echo "❌ INSTALL FAILED: mount not found"
  exit 1
fi

echo ""
echo "Step 6: Final structural check..."

COUNT=$(grep -c "tsm-executive-briefing-root" "$TARGET_FILE" || true)

if [ "$COUNT" -lt 1 ]; then
  echo "❌ CRITICAL: Injection failed silently"
  exit 1
fi

echo ""
echo "=========================================="
echo "✔ EXECUTIVE BRIEFING UPGRADE COMPLETE"
echo "File: $TARGET_FILE"
echo "Mount Points: $COUNT"
echo "=========================================="

echo ""
echo "Next step:"
echo "→ Refresh browser with hard reload (Ctrl+Shift+R)"
echo "→ Confirm: window has tsm-executive-briefing-root"
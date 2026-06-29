#!/bin/bash

set -e

echo "======================================="
echo "TSM ONE-SHOT KERNEL + ENFORCER UPGRADE"
echo "======================================="

BASE="html"

VERTICALS=("healthcare" "legal-pro" "tsm-insurance" "construction-suite" "reo-pro" "finops-suite" "bpo")

echo ""
echo "1. Standardizing relay keys..."
echo "---------------------------------------"

for v in "${VERTICALS[@]}"; do
  echo "🔧 Processing $v"

  # 1. Convert legacy relay keys → scoped relay
  find $BASE/$v -type f -name "*.html" -exec sed -i \
    "s/tsm_finops_war_relay/tsm_war_relay_${v}/g" {} \; 2>/dev/null || true

  find $BASE/$v -type f -name "*.html" -exec sed -i \
    "s/TSM_FINOPS_WAR_RELAY/TSM_WAR_RELAY_${v}/g" {} \; 2>/dev/null || true

done


echo ""
echo "2. Injecting Kernel + Enforcer hooks..."
echo "---------------------------------------"

INJECT_KERNEL='<script src="/core/tsm-kernel.js"></script>'
INJECT_ENFORCER='<script src="/core/tsm-enforcer.js"></script>'

inject_if_missing () {
  FILE=$1

  if grep -q "tsm-kernel.js" "$FILE"; then
    return
  fi

  echo "➕ Injecting into $FILE"

  # inject before </body>
  sed -i "s|</body>|  $INJECT_KERNEL\n  $INJECT_ENFORCER\n</body>|g" "$FILE"
}

for v in "${VERTICALS[@]}"; do
  find $BASE/$v -type f -name "*.html" | while read file; do
    inject_if_missing "$file"
  done
done


echo ""
echo "3. Standardizing confirmation keys..."
echo "---------------------------------------"

for v in "${VERTICALS[@]}"; do

  find $BASE/$v -type f -name "*.html" -exec sed -i \
    "s/TSM_STRAT_CONFIRMED/TSM_STRAT_CONFIRMED_${v}/g" {} \;

  find $BASE/$v -type f -name "*.html" -exec sed -i \
    "s/TSM_EXEC_CONFIRMED/TSM_EXEC_CONFIRMED_${v}/g" {} \;

done


echo ""
echo "4. Injecting control-plane anchor..."
echo "---------------------------------------"

CONTROL_PLANE="html/tsm-doc-search-multi.html"

if [ -f "$CONTROL_PLANE" ]; then
  if ! grep -q "TSM_CONTROL_PLANE" "$CONTROL_PLANE"; then
    echo "➕ Adding control plane marker"

    sed -i "s|</body>|<script>window.TSM_CONTROL_PLANE=true;</script>\n</body>|g" "$CONTROL_PLANE"
  fi
fi


echo ""
echo "5. Ensuring kernel + enforcer directories exist..."
echo "---------------------------------------"

mkdir -p core

if [ ! -f core/tsm-kernel.js ]; then
  echo "⚠️ Missing core/tsm-kernel.js (create manually)"
fi

if [ ! -f core/tsm-enforcer.js ]; then
  echo "⚠️ Missing core/tsm-enforcer.js (create manually)"
fi


echo ""
echo "======================================="
echo "✅ ONE-SHOT UPGRADE COMPLETE"
echo "======================================="
echo ""
echo "NEXT STEP:"
echo "Run:"
echo "  TSM_ENFORCER.audit()"
echo ""
echo "Then verify scoped relays:"
echo "  grep -Rni 'tsm_war_relay_' html"
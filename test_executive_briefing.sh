#!/bin/bash

echo "=================================="
echo "TSM EXECUTIVE BRIEFING TEST"
echo "=================================="

FILE="html/core/tsm-executive-briefing.js"
PORTAL="html/construction-suite/construction-executive-portal.html"

echo ""
echo "[1] Checking JS file..."
if [ -f "$FILE" ]; then
  echo "✔ JS file exists"
else
  echo "❌ Missing JS file"
fi

echo ""
echo "[2] Checking portal mount..."
if grep -q "tsm-executive-briefing-root" "$PORTAL" 2>/dev/null; then
  echo "✔ Mount exists in portal"
else
  echo "❌ Mount missing in portal"
fi

echo ""
echo "[3] Checking script reference..."
if grep -q "tsm-executive-briefing.js" "$PORTAL" 2>/dev/null; then
  echo "✔ Script is linked"
else
  echo "❌ Script NOT linked"
fi

echo ""
echo "[4] Quick DOM simulation check (static analysis)..."
grep -n "tsm-executive-briefing-root" "$PORTAL" | head -n 3

echo ""
echo "=================================="
echo "TEST COMPLETE"
echo "=================================="
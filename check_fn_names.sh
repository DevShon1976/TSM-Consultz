#!/bin/bash
cd /home/claude/main-extract

check() {
  local file="$1"; local fn="$2"; local label="$3"
  if grep -q "function $fn\b" "$file" 2>/dev/null; then
    echo "  OK   $label: function $fn() exists"
  else
    echo "  BUG  $label: calls $fn() but it is NOT defined in this file"
  fi
}

echo "### Strategist auto-run function checks"
check html/finops-suite/finops-main-strategist.html generateReport "FinOps strategist auto-run"
check html/tsm-insurance/insurance-strategist.html runStrategist "Insurance strategist auto-run"
check html/construction-suite/construction-strategist.html runBNCA "Construction strategist auto-run"
check html/construction-suite/construction-strategist.html escalateToExecutive "Construction strategist auto-escalate"
check html/legal-pro/legal-main-strategist.html runSynthesis "Legal strategist auto-run"
check html/reo-pro/re-strategist.html runStrategist "RE strategist auto-run"
echo ""
echo "### War room auto-escalate function check"
check html/construction-suite/construction-war-room.html escalateToStrategist "Construction war room auto-escalate"
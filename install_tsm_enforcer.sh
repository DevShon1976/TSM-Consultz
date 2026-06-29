#!/usr/bin/env bash

set -e

echo "======================================="
echo "TSM AUTONOMY ENFORCER INSTALL"
echo "======================================="

mkdir -p core

cat << 'JS' > core/tsm-enforcer.js
// ======================================
// TSM AUTONOMY ENFORCER (RUNTIME GUARD)
// ======================================

(function () {

  const VERTICALS = [
    "healthcare",
    "legal-pro",
    "tsm-insurance",
    "construction-suite",
    "reo-pro",
    "finops-suite",
    "bpo"
  ];

  function check(key) {
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch (e) {
      return null;
    }
  }

  function validateVertical(vertical) {

    const strat = check("TSM_STRAT_CONFIRMED");
    const exec = check("TSM_EXEC_CONFIRMED");

    return {
      vertical,
      strat: !!strat,
      exec: !!exec,
      healthy: !!(strat && exec)
    };
  }

  function runAudit() {

    const report = VERTICALS.map(validateVertical);

    const passCount = report.filter(r => r.healthy).length;

    console.log("=======================================");
    console.log("TSM AUTONOMY ENFORCER REPORT");
    console.log("=======================================");

    report.forEach(r => {
      console.log(
        r.vertical.padEnd(20),
        r.healthy ? "PASS" : "FAIL"
      );
    });

    console.log("=======================================");
    console.log(`HEALTH SCORE: ${passCount}/${VERTICALS.length}`);
    console.log("=======================================");

    return report;
  }

  function autoHeal() {

    // Lightweight recovery hooks only (NO destructive edits)

    if (!window.tsmMission) {
      window.tsmMission = {
        id: "AUTO-" + Date.now().toString(36),
        vertical: "UNKNOWN",
        createdAt: Date.now()
      };
    }

    console.log("[TSM ENFORCER] Auto-heal executed");
  }

  window.TSM_ENFORCER = {
    audit: runAudit,
    heal: autoHeal
  };

  // AUTO RUN ON LOAD
  setTimeout(() => {
    autoHeal();
    runAudit();
  }, 1200);

})();
JS

echo "Injecting enforcer into all vertical entry points..."

# inject into major entry files (safe minimal injection)
TARGETS=$(find html -type f -name "*.html" | grep -E "war-room|executive-portal|strategist|index" || true)

for f in $TARGETS; do

  if [ -f "$f" ]; then

    if ! grep -q "tsm-enforcer" "$f"; then

cat << 'TAG' >> "$f"

<!-- TSM ENFORCER BOOT -->
<script src="../../core/tsm-enforcer.js"></script>

TAG

    fi
  fi

done

echo "======================================="
echo "✅ ENFORCER INSTALLED"
echo "======================================="
echo ""
echo "Run this to test:"
echo "TSM_ENFORCER.audit()"

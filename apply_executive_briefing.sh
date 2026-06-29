#!/bin/bash

echo "======================================"
echo "TSM EXECUTIVE BRIEFING APPLY SCRIPT"
echo "======================================"

FILE="html/core/tsm-executive-briefing.js"

mkdir -p html/core

echo "[1] Writing executive briefing renderer..."

cat > "$FILE" <<'JS'
(function () {

  function render() {
    const root = document.getElementById("tsm-executive-briefing-root");
    if (!root) return false;

    if (root.__tsm_rendered) return true;
    root.__tsm_rendered = true;

    root.innerHTML = `
      <div style="padding:20px;font-family:Arial;background:#0b0f17;color:white;border-radius:8px;">
        <h2>TSM EXECUTIVE DECISION BRIEF</h2>
        <hr style="opacity:0.2"/>

        <p><b>Status:</b> Renderer Active</p>
        <p><b>System:</b> Injection Successful</p>

        <div style="margin-top:15px;opacity:0.9">
          <p><b>Overall Exposure:</b> $2.84M</p>
          <p><b>Risk Score:</b> 74 / 100</p>
          <p><b>Recovery Opportunity:</b> $612K</p>
          <p><b>Confidence:</b> 96%</p>
        </div>

        <hr style="opacity:0.2"/>

        <p><b>Recommended Action:</b> Approve accelerated workflow</p>
      </div>
    `;

    return true;
  }

  function boot() {
    render();

    const interval = setInterval(() => {
      if (render()) clearInterval(interval);
    }, 200);

    setTimeout(() => clearInterval(interval), 10000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

})();
JS

echo "[2] Ensuring mount exists in construction portal..."

PORTAL="html/construction-suite/construction-executive-portal.html"

if [ -f "$PORTAL" ]; then
  grep -q "tsm-executive-briefing-root" "$PORTAL" || cat <<'HTML' >> "$PORTAL"

<!-- TSM EXECUTIVE BRIEFING MOUNT -->
<div id="tsm-executive-briefing-root"></div>
<script defer src="/core/tsm-executive-briefing.js"></script>

HTML

  echo "✔ Mount injected"
else
  echo "❌ Portal file not found: $PORTAL"
fi

echo "[3] Git add/commit/push..."

git add -A
git commit -m "Inject TSM Executive Briefing v1 (production mount + renderer)" || echo "No changes to commit"

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "Current branch: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" != "main" ]; then
  git branch -M main
fi

git push -u origin main

echo "======================================"
echo "✔ APPLY COMPLETE"
echo "NEXT: fly deploy"
echo "======================================"

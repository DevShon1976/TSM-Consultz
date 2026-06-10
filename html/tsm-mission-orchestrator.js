<!--
=================================================================
TSM MISSION ORCHESTRATOR — WAR ROOM INTEGRATION SNIPPET
=================================================================

STEP 1: Add this <script> tag in your <head> (or before </body>)
        Point the src at wherever you host tsm-mission-orchestrator.js
        OR inline the full JS directly.
-->

<script src="/html/tsm-mission-orchestrator.js"></script>

<!--
STEP 2: Add this panel INSIDE your existing Anomaly Advisor panel.
        It stays hidden until a mission is launched.
-->

<div id="tsm-mission-panel" style="display:none; margin-top:14px;"></div>

<!--
STEP 3: Add the "Build Mission" button inside your Anomaly Advisor output area.
        This fires after anomaly text has been generated.
        Replace 'healthcare' with the correct vertical for each war room.
-->

<button
  id="tsm-build-mission-btn"
  onclick="tsmLaunchMission()"
  style="
    display:none;
    margin-top:12px;
    background:rgba(0,232,122,.1);
    border:1px solid rgba(0,232,122,.35);
    color:#00e87a;
    font-family:'Space Mono',monospace;
    font-size:10px;font-weight:700;letter-spacing:.12em;
    padding:10px 16px;border-radius:4px;cursor:pointer;
    text-transform:uppercase;width:100%;
  "
>⚡ BUILD REMEDIATION MISSION</button>

<!--
STEP 4: Add this <script> block anywhere after the panel markup.
        Set VERTICAL to match the war room:
          'healthcare' | 'insurance' | 'legal' |
          'construction' | 'real-estate' | 'finops' | 'bpo'
-->

<script>
// ── CONFIG — change this per war room file ──────────────────
const TSM_MISSION_VERTICAL = 'healthcare'; // ← SET THIS PER FILE

// ── Show button once anomaly output is ready ────────────────
// Call this from wherever you currently display anomaly results.
// Example: inside your existing showAnomalyAdvisor() or
//          anomalyAdvisorSlideIn() function, at the end.
function tsmShowMissionButton(anomalyText) {
  const btn = document.getElementById('tsm-build-mission-btn');
  if (btn) {
    btn.style.display = 'block';
    btn.dataset.anomaly = anomalyText; // stash anomaly text on button
  }
}

// ── Launch mission ──────────────────────────────────────────
async function tsmLaunchMission() {
  const btn       = document.getElementById('tsm-build-mission-btn');
  const panel     = document.getElementById('tsm-mission-panel');
  const anomaly   = btn?.dataset.anomaly || 'Anomaly detected — review required.';
  const apiKey    = localStorage.getItem('tsm_groq_key') || '';

  if (!panel || !window.TSMMission) {
    console.error('[TSM] Mission panel or TSMMission module not found.');
    return;
  }

  panel.style.display = 'block';
  btn.style.display   = 'none'; // hide button once mission is building

  await TSMMission.launch({
    vertical:   TSM_MISSION_VERTICAL,
    anomaly:    anomaly,
    container:  panel,
    apiKey:     apiKey,
    onComplete: (mission) => {
      console.log('[TSM] Mission complete:', mission.missionId);
      // Optional: relay completion to sessionStorage for exec portal
      sessionStorage.setItem(
        'TSM_MISSION_COMPLETE_' + TSM_MISSION_VERTICAL.toUpperCase(),
        JSON.stringify({ missionId: mission.missionId, ts: Date.now() })
      );
    },
  });
}

// ── Hook into existing Anomaly Advisor ──────────────────────
// If your anomaly advisor currently calls something like:
//   anomalyOutput.innerHTML = result;
// Add ONE LINE after it:
//   tsmShowMissionButton(result);
//
// That's the only change needed in your existing war room code.
</script>

<!--
=================================================================
FULL INTEGRATION EXAMPLE
(shows where tsmShowMissionButton fits in a typical war room)
=================================================================

BEFORE (existing Anomaly Advisor code pattern):
────────────────────────────────────────────────
  async function triggerAnomalyAdvisor(engineOutputs) {
    const result = await callGroq(anomalyPrompt + engineOutputs);
    anomalyPanel.innerHTML = result;
    anomalyPanel.style.display = 'block';
    // ... slide-in animation etc.
  }

AFTER (one line added):
────────────────────────────────────────────────
  async function triggerAnomalyAdvisor(engineOutputs) {
    const result = await callGroq(anomalyPrompt + engineOutputs);
    anomalyPanel.innerHTML = result;
    anomalyPanel.style.display = 'block';
    tsmShowMissionButton(result);   // ← ADD THIS LINE ONLY
    // ... rest unchanged
  }

=================================================================
VERTICAL MAP — use these exact strings for TSM_MISSION_VERTICAL:
=================================================================

  hc-denial-war-room.html           → 'healthcare'
  insurance-war-room.html           → 'insurance'
  insurance-strategist.html         → 'insurance'
  legal-war-room.html               → 'legal'
  construction-war-room.html        → 'construction'
  re-war-room.html                  → 'real-estate'
  finops-war-room.html              → 'finops'
  tsm-bpo-daily-workflow-gtm.html   → 'bpo'

=================================================================
-->
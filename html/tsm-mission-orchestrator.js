// ============================================================
// TSM MISSION ORCHESTRATOR — Drop-in module
// Converts Anomaly Advisor output into guided remediation flows
// ============================================================

// ── APP CATALOG ─────────────────────────────────────────────
// Central source of truth for all TSM apps.
// Each entry: { name, url, solves[] }
// "solves" terms are matched against anomaly text.

const TSM_APP_CATALOG = {

  healthcare: [
    { name: 'HC Denial War Room',       url: '/html/healthcare/hc-denial-war-room.html',          solves: ['denial', 'co-', 'remark', 'claim', 'rejection', 'payer'] },
    { name: 'HC Billing Command',       url: '/html/healthcare/hc-billing/index.html',             solves: ['billing', 'claim', 'cpt', 'icd', 'charge', 'clean claim'] },
    { name: 'HC Insurance Node',        url: '/html/healthcare/hc-insurance/index.html',           solves: ['prior auth', 'authorization', 'eligibility', 'coverage', 'benefit'] },
    { name: 'HC Financial Node',        url: '/html/healthcare/hc-financial/index.html',           solves: ['ar aging', 'dso', 'revenue', 'cash', 'collection', 'write-off'] },
    { name: 'HC Compliance Node',       url: '/html/healthcare/hc-compliance/index.html',          solves: ['hipaa', 'compliance', 'audit', 'risk', 'regulation'] },
    { name: 'HC Vendor Node',           url: '/html/healthcare/hc-vendor/index.html',              solves: ['vendor', 'contract', 'supplier', 'clearinghouse'] },
    { name: 'HC Strategist',            url: '/html/healthcare/hc-strategist.html',                solves: ['strategy', 'pattern', 'trend', 'root cause', 'systemic'] },
  ],

  insurance: [
    { name: 'Insurance War Room',       url: '/html/tsm-insurance/insurance-war-room.html',        solves: ['denial', 'co-5', 'co-16', 'co-97', 'dme', 'cmn', 'prior auth'] },
    { name: 'Insurance Strategist',     url: '/html/tsm-insurance/insurance-strategist.html',      solves: ['appeal', 'strategy', 'hipaa', 'documentation', 'checklist'] },
  ],

  legal: [
    { name: 'Legal War Room',           url: '/html/legal-pro/legal-war-room.html',                    solves: ['case', 'dispute', 'contract', 'liability', 'claim', 'deadline'] },
    { name: 'Case Strategist',          url: '/html/legal-pro/case-strategist.html',                  solves: ['strategy', 'argument', 'risk', 'precedent', 'filing'] },
    { name: 'Legal Doc Search',         url: '/html/tsm-doc-search-multi.html',                  solves: ['document', 'evidence', 'exhibit', 'discovery', 'record'] },
    { name: 'Chief Strategist',         url: '/html/legal-pro/legal-main-strategist.html',            solves: ['executive', 'summary', 'partner', 'decision', 'brief'] },
  ],

  construction: [
    { name: 'Construction War Room',    url: '/html/construction-suite/construction-war-room.html',      solves: ['risk', 'bid', 'subcontractor', 'change order', 'schedule', 'delay'] },
    { name: 'Project Strategist',       url: '/html/construction-suite/construction-strategist.html',    solves: ['mitigation', 'strategy', 'recommendation', 'action'] },
    { name: 'Executive Portal',         url: '/html/construction-suite/construction-executive-portal.html', solves: ['executive', 'summary', 'owner', 'financial', 'report'] },
  ],

  'real-estate': [
    { name: 'RE Doc Command',           url: '/html/reo-pro/re-doc-search.html',              solves: ['document', 'intake', 'file', 'upload', 'extract'] },
    { name: 'RE War Room',              url: '/html/reo-pro/re-war-room.html',                 solves: ['deal', 'comp', 'market', 'risk', 'valuation', 'pricing'] },
    { name: 'RE Strategist',            url: '/html/reo-pro/re-strategist.html',               solves: ['strategy', 'recommendation', 'investment', 'positioning'] },
    { name: 'RE Exec Portal',           url: '/html/reo-pro/re-exec-portal.html',              solves: ['investor', 'summary', 'executive', 'report', 'brief'] },
  ],

  finops: [
    { name: 'FinOps War Room',          url: '/html/finops-suite/finops-war-room.html',                  solves: ['cost', 'spend', 'budget', 'overrun', 'variance', 'cloud', 'vendor'] },
    { name: 'FinOps Strategist',        url: '/html/finops-suite/finops-main-strategist.html',                solves: ['optimization', 'savings', 'reduction', 'recommendation'] },
    { name: 'FinOps Executive Portal',  url: '/html/finops-suite/finops-executive-portal.html',          solves: ['cfo', 'executive', 'summary', 'kpi', 'dashboard', 'report'] },
    { name: 'FinOps Accounting Node',   url: '/html/finops-suite/finops-accounting.html',                solves: ['ap', 'ar', 'invoice', 'aging', 'payable', 'receivable', 'balance'] },
  ],

  bpo: [
    { name: 'BPO Daily Workflow',       url: '/html/tsm-bpo-daily-workflow-gtm.html',              solves: ['schedule', 'daily', 'workflow', 'task', 'priority'] },
    { name: 'Universal Doc Router',     url: '/html/doc-search.html',                              solves: ['document', 'classify', 'route', 'intake', 'file'] },
    { name: 'BPO Competitive Playbook', url: '/html/bpo/tsm-bpo-competitive-playbook.html',        solves: ['competitive', 'scenario', 'playbook', 'comparison'] },
    { name: 'BPO Situation Room',       url: '/html/bpo/bpo-situation-room.html',                  solves: ['anomaly', 'exception', 'escalation', 'complaint', 'sla'] },
    { name: 'BPO Strategist',           url: '/html/bpo/bpo-strategist-v2.html',                   solves: ['decision', 'recommendation', 'strategy', 'root cause'] },
    { name: 'BPO Executive Portal',     url: '/html/bpo/bpo-executive-portal.html',                solves: ['executive', 'summary', 'report', 'dashboard'] },
  ],

};

// ── HELPERS ──────────────────────────────────────────────────

/**
 * Returns apps from the given vertical whose solves[] match
 * terms found in the anomaly text. Falls back to first 3 apps
 * if no matches so missions always have steps.
 */
function getRelevantApps(vertical, anomalyText) {
  const text = (anomalyText || '').toLowerCase();
  const pool = TSM_APP_CATALOG[vertical] || [];

  const matched = pool.filter(app =>
    app.solves.some(term => text.includes(term.toLowerCase()))
  );

  // Fallback: return top 3 apps for the vertical so mission never comes back empty
  return matched.length > 0 ? matched : pool.slice(0, 3);
}

/**
 * Builds a local (non-AI) mission from matched apps.
 * Used as fallback if AI call fails.
 */
function buildLocalMission(vertical, anomaly) {
  const apps = getRelevantApps(vertical, anomaly);
  return {
    missionId: 'TSM-' + Date.now(),
    vertical,
    anomaly,
    generatedBy: 'local',
    steps: apps.map((app, idx) => ({
      id: 'step-' + (idx + 1),
      title: app.name,
      appName: app.name,
      appUrl: app.url,
      objective: `Analyze the flagged anomaly using ${app.name}`,
      instructions: `Open ${app.name}. Review the anomaly context below and run the relevant engine or workflow. Document your findings before moving to the next step.\n\nAnomaly: ${anomaly}`,
      expectedOutput: 'Findings documented and anomaly addressed or escalated',
      completionCriteria: 'Output reviewed and step marked complete',
      status: idx === 0 ? 'active' : 'pending',
    })),
  };
}

// ── AI MISSION BUILDER ───────────────────────────────────────

// Each vertical has its own server-side proxy route. Without this map,
// every vertical's mission-generation call hits /api/hc/query.
const VERTICAL_ENDPOINTS = {
  healthcare: '/api/hc/query',
  insurance: '/api/insurance/query',
  legal: '/api/legal/query',
  construction: '/api/construction/query',
  'real-estate': '/api/re/query',
  finops: '/api/financial/query',
  bpo: '/api/bpo/query',
};

/**
 * Calls Groq via the TSM proxy and asks the AI to return
 * a structured step-by-step remediation mission.
 * Falls back to buildLocalMission() on any error.
 *
 * @param {string} vertical  — e.g. 'healthcare', 'finops'
 * @param {string} anomaly   — the anomaly text from Anomaly Advisor
 * @param {string} apiKey    — from localStorage tsm_groq_key
 * @returns {Promise<object>} — mission object
 */
async function buildAIMission(vertical, anomaly, apiKey) {

  const apps = TSM_APP_CATALOG[vertical] || [];
  const appCatalog = apps.map(app =>
    `- ${app.name} | URL: ${app.url}`
  ).join('\n');

  const systemPrompt = `You are the TSM Mission Planner. You generate step-by-step remediation workflows for anomalies detected in business operations.

You must ONLY use apps from the provided catalog. Return ONLY valid JSON — no markdown, no explanation, no preamble.

Required JSON shape:
{
  "missionTitle": "string",
  "summary": "string — one sentence describing the remediation goal",
  "steps": [
    {
      "id": "step-1",
      "title": "string — short action title",
      "appName": "string — exact name from catalog",
      "appUrl": "string — exact URL from catalog",
      "objective": "string — what this step achieves",
      "instructions": "string — specific actions to take in the app, 2-4 sentences",
      "expectedOutput": "string — what the user should have when done",
      "completionCriteria": "string — how user knows step is complete"
    }
  ]
}

Rules:
- 3 to 5 steps maximum
- Every appUrl must be an exact match from the catalog
- Instructions must be specific to the anomaly, not generic
- completionCriteria must be a single actionable sentence`;

  const userPrompt = `Vertical: ${vertical.toUpperCase()}

Anomaly detected:
"${anomaly}"

Available apps for this vertical:
${appCatalog}

Build the remediation mission. Return JSON only.`;

  try {
    const endpoint = VERTICAL_ENDPOINTS[vertical] || '/api/hc/query';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system: systemPrompt,
        message: userPrompt,
        apiKey,
      }),
    });

    if (!res.ok) throw new Error(`API ${res.status}`);

    const data = await res.json();
    const raw = (data.response || data.content || '').trim();

    // Strip any accidental markdown fences
    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    // Attach metadata and normalize statuses
    return {
      missionId: 'TSM-' + Date.now(),
      vertical,
      anomaly,
      generatedBy: 'ai',
      missionTitle: parsed.missionTitle || 'Remediation Mission',
      summary: parsed.summary || '',
      steps: (parsed.steps || []).map((s, idx) => ({
        ...s,
        id: s.id || 'step-' + (idx + 1),
        status: idx === 0 ? 'active' : 'pending',
      })),
    };

  } catch (err) {
    console.warn('[TSM Mission] AI call failed, using local builder:', err.message);
    return buildLocalMission(vertical, anomaly);
  }
}

// ── MISSION GUIDE RENDERER ───────────────────────────────────

/**
 * Renders the Mission Guide panel into a target container.
 * Manages step progression, open-app button, and completion.
 *
 * @param {object} mission   — mission object from buildAIMission
 * @param {HTMLElement} container — DOM element to render into
 * @param {Function} onComplete — called when all steps done
 */
function renderMissionGuide(mission, container, onComplete) {

  function currentStep() {
    return mission.steps.find(s => s.status === 'active')
      || mission.steps.find(s => s.status === 'pending')
      || null;
  }

  function stepIndex(step) {
    return mission.steps.indexOf(step);
  }

  function progressPct() {
    const done = mission.steps.filter(s => s.status === 'complete').length;
    return Math.round((done / mission.steps.length) * 100);
  }

  function completeStep(stepId) {
    const idx = mission.steps.findIndex(s => s.id === stepId);
    if (idx < 0) return;
    mission.steps[idx].status = 'complete';
    if (idx + 1 < mission.steps.length) {
      mission.steps[idx + 1].status = 'active';
    }
    render();
    if (mission.steps.every(s => s.status === 'complete')) {
      setTimeout(() => onComplete && onComplete(mission), 400);
    }
  }

  function render() {
    const step = currentStep();
    const pct  = progressPct();
    const completedCount = mission.steps.filter(s => s.status === 'complete').length;

    container.innerHTML = `
      <div class="mg-wrap" style="
        font-family: 'Space Mono', monospace;
        background: #0d0f0d;
        border: 1px solid rgba(0,232,122,0.25);
        border-radius: 8px;
        overflow: hidden;
      ">

        <!-- HEADER -->
        <div style="
          background: rgba(0,232,122,0.07);
          border-bottom: 1px solid rgba(0,232,122,0.15);
          padding: 14px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        ">
          <div>
            <div style="font-size:9px;letter-spacing:.2em;color:rgba(0,232,122,.6);margin-bottom:3px;">
              TSM MISSION GUIDE
            </div>
            <div style="font-size:12px;color:#f5f4f0;font-weight:700;letter-spacing:.05em;">
              ${mission.missionTitle || 'Remediation Mission'}
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:9px;color:rgba(245,244,240,.4);margin-bottom:3px;">${completedCount} / ${mission.steps.length} STEPS</div>
            <div style="font-size:16px;font-weight:700;color:#00e87a;">${pct}%</div>
          </div>
        </div>

        <!-- PROGRESS BAR -->
        <div style="height:3px;background:rgba(255,255,255,.06);">
          <div style="height:100%;width:${pct}%;background:#00e87a;transition:width .4s;"></div>
        </div>

        <!-- STEP PILLS -->
        <div style="display:flex;gap:6px;padding:12px 18px;flex-wrap:wrap;border-bottom:1px solid rgba(255,255,255,.05);">
          ${mission.steps.map((s, i) => `
            <div style="
              font-size:9px;letter-spacing:.1em;padding:4px 10px;border-radius:3px;
              background:${s.status === 'complete' ? 'rgba(0,232,122,.15)' : s.status === 'active' ? 'rgba(0,232,122,.08)' : 'rgba(255,255,255,.04)'};
              color:${s.status === 'complete' ? '#00e87a' : s.status === 'active' ? '#f5f4f0' : 'rgba(245,244,240,.3)'};
              border:1px solid ${s.status === 'complete' ? 'rgba(0,232,122,.3)' : s.status === 'active' ? 'rgba(0,232,122,.2)' : 'rgba(255,255,255,.06)'};
            ">
              ${s.status === 'complete' ? '✓ ' : s.status === 'active' ? '▶ ' : ''}${i + 1}. ${s.appName}
            </div>
          `).join('')}
        </div>

        ${step ? `
        <!-- ACTIVE STEP -->
        <div style="padding:20px 18px;">

          <div style="font-size:9px;letter-spacing:.2em;color:rgba(0,232,122,.6);margin-bottom:6px;">
            STEP ${stepIndex(step) + 1} OF ${mission.steps.length}
          </div>

          <div style="font-size:14px;font-weight:700;color:#f5f4f0;margin-bottom:16px;letter-spacing:.03em;">
            ${step.title}
          </div>

          <!-- APP ROW -->
          <div style="
            background:rgba(0,232,122,.05);
            border:1px solid rgba(0,232,122,.15);
            border-radius:6px;
            padding:12px 14px;
            margin-bottom:14px;
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:12px;
          ">
            <div>
              <div style="font-size:9px;letter-spacing:.15em;color:rgba(0,232,122,.6);margin-bottom:3px;">APP</div>
              <div style="font-size:12px;color:#00e87a;font-weight:700;">${step.appName}</div>
              <div style="font-size:9px;color:rgba(245,244,240,.35);margin-top:2px;">${step.appUrl}</div>
            </div>
            <a href="${step.appUrl}" target="_blank" style="
              display:inline-block;white-space:nowrap;
              background:#00e87a;color:#000;
              font-size:10px;font-weight:700;letter-spacing:.1em;
              padding:8px 14px;border-radius:4px;
              text-decoration:none;text-transform:uppercase;
              flex-shrink:0;
            ">OPEN APP ↗</a>
          </div>

          <!-- OBJECTIVE -->
          <div style="margin-bottom:12px;">
            <div style="font-size:9px;letter-spacing:.15em;color:rgba(245,244,240,.35);margin-bottom:5px;">OBJECTIVE</div>
            <div style="font-size:11px;color:rgba(245,244,240,.8);line-height:1.6;">${step.objective}</div>
          </div>

          <!-- INSTRUCTIONS -->
          <div style="
            background:rgba(255,255,255,.03);
            border:1px solid rgba(255,255,255,.07);
            border-radius:5px;
            padding:12px 14px;
            margin-bottom:12px;
          ">
            <div style="font-size:9px;letter-spacing:.15em;color:rgba(245,244,240,.35);margin-bottom:6px;">ACTIONS</div>
            <div style="font-size:11px;color:rgba(245,244,240,.75);line-height:1.7;white-space:pre-wrap;">${step.instructions}</div>
          </div>

          <!-- EXPECTED OUTPUT -->
          <div style="
            border-left:2px solid rgba(0,232,122,.4);
            padding:8px 12px;
            margin-bottom:16px;
          ">
            <div style="font-size:9px;letter-spacing:.15em;color:rgba(0,232,122,.6);margin-bottom:3px;">EXPECTED OUTPUT</div>
            <div style="font-size:11px;color:rgba(245,244,240,.7);">${step.expectedOutput}</div>
          </div>

          <!-- COMPLETION CRITERIA + BUTTON -->
          <div style="
            border:1px solid rgba(255,255,255,.08);
            border-radius:5px;
            padding:12px 14px;
            margin-bottom:14px;
            display:flex;
            align-items:center;
            gap:10px;
          ">
            <div style="font-size:10px;color:rgba(245,244,240,.45);flex:1;line-height:1.5;">
              <span style="color:rgba(0,232,122,.5);font-size:9px;letter-spacing:.1em;display:block;margin-bottom:2px;">DONE WHEN</span>
              ${step.completionCriteria}
            </div>
          </div>

          <button
            onclick="window._tsmMissionCompleteStep('${step.id}')"
            style="
              width:100%;background:rgba(0,232,122,.12);
              border:1px solid rgba(0,232,122,.3);
              color:#00e87a;font-family:'Space Mono',monospace;
              font-size:11px;font-weight:700;letter-spacing:.12em;
              padding:12px;border-radius:4px;cursor:pointer;
              text-transform:uppercase;transition:background .2s;
            "
            onmouseover="this.style.background='rgba(0,232,122,.2)'"
            onmouseout="this.style.background='rgba(0,232,122,.12)'"
          >✓ COMPLETE STEP ${stepIndex(step) + 1}</button>

        </div>
        ` : `
        <!-- ALL DONE -->
        <div style="padding:32px 18px;text-align:center;">
          <div style="font-size:24px;margin-bottom:10px;">✓</div>
          <div style="font-size:12px;color:#00e87a;font-weight:700;letter-spacing:.1em;margin-bottom:6px;">MISSION COMPLETE</div>
          <div style="font-size:10px;color:rgba(245,244,240,.4);">All remediation steps completed.</div>
        </div>
        `}

        <!-- ANOMALY CONTEXT (collapsed) -->
        <details style="border-top:1px solid rgba(255,255,255,.05);">
          <summary style="
            font-size:9px;letter-spacing:.15em;color:rgba(245,244,240,.3);
            padding:10px 18px;cursor:pointer;list-style:none;
            text-transform:uppercase;
          ">▼ Anomaly Context</summary>
          <div style="padding:0 18px 14px;font-size:10px;color:rgba(245,244,240,.45);line-height:1.7;">
            ${mission.anomaly}
          </div>
        </details>

      </div>
    `;
  }

  // Expose completeStep globally so onclick can reach it
  window._tsmMissionCompleteStep = completeStep;

  render();
}

// ── MAIN ENTRY POINT ─────────────────────────────────────────

/**
 * Call this from your Anomaly Advisor's "Build Mission" button.
 *
 * Usage:
 *   await TSMMission.launch({
 *     vertical: 'healthcare',       // matches TSM_APP_CATALOG key
 *     anomaly: anomalyText,         // string from Anomaly Advisor output
 *     container: document.getElementById('mission-guide-panel'),
 *     apiKey: localStorage.getItem('tsm_groq_key'),
 *     onComplete: (mission) => console.log('Done:', mission.missionId),
 *   });
 */
const TSMMission = {

  async launch({ vertical, anomaly, container, apiKey, onComplete }) {

    // Show loading state
    container.innerHTML = `
      <div style="
        font-family:'Space Mono',monospace;
        background:#0d0f0d;border:1px solid rgba(0,232,122,.2);
        border-radius:8px;padding:28px 20px;text-align:center;
      ">
        <div style="font-size:9px;letter-spacing:.2em;color:rgba(0,232,122,.6);margin-bottom:10px;">
          TSM MISSION PLANNER
        </div>
        <div style="font-size:11px;color:rgba(245,244,240,.5);">Building remediation workflow…</div>
        <div style="margin-top:14px;height:2px;background:rgba(255,255,255,.06);border-radius:2px;overflow:hidden;">
          <div style="
            height:100%;width:60%;background:#00e87a;
            animation:mgPulse 1.2s ease-in-out infinite alternate;
          "></div>
        </div>
        <style>@keyframes mgPulse{from{opacity:.3}to{opacity:1}}</style>
      </div>
    `;

    const mission = await buildAIMission(vertical, anomaly, apiKey);
    renderMissionGuide(mission, container, onComplete);
    return mission;
  },

  // Expose internals for direct use if needed
  buildAIMission,
  buildLocalMission,
  getRelevantApps,
  renderMissionGuide,
  APP_CATALOG: TSM_APP_CATALOG,
};

// Make available globally
window.TSMMission = TSMMission;
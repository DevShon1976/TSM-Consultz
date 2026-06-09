/**
 * TSM Mission Guide v3.0
 * Insurance War Room · Anomaly Repair Workflow Panel
 * Triggers: engine completion · Anomaly Advisor relay · EU anomaly click
 * Layout: App chips · TSM vs BPO · Execution steps · Ready-to-use prompts
 */

(function () {
  'use strict';

  const PANEL_ID   = 'tsm-mission-guide-panel';
  const STORAGE_KEY = 'TSM_MISSION_GUIDE';
  const RELAY_KEYS  = [
    'TSM_ANOMALY_RELAY',
    'TSM_INS_ANOMALY',
    'TSM_HC_ANOMALY',
    'TSM_RE_ANOMALY',
    'TSM_LEGAL_ANOMALY',
    'TSM_CONSTRUCTION_ANOMALY',
    'TSM_FINOPS_ANOMALY'
  ];

  // ── Persistence ────────────────────────────────────────────────────────────
  function loadMission() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); }
    catch { return null; }
  }

  function saveMission(m) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(m)); }
    catch {}
  }

  // ── Panel injection ────────────────────────────────────────────────────────
  function ensurePanel() {
    if (document.getElementById(PANEL_ID)) return;
    const panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.innerHTML = `<div id="tmg-inner"></div>`;
    document.body.appendChild(panel);
    injectStyles();
  }

  // ── Styles ─────────────────────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('tmg-styles')) return;
    const s = document.createElement('style');
    s.id = 'tmg-styles';
    s.textContent = `
      #tsm-mission-guide-panel {
        position: fixed;
        bottom: 0; right: 0;
        width: 400px;
        max-height: 88vh;
        background: #0d0f14;
        border: 1px solid #1e2535;
        border-bottom: none;
        border-right: none;
        border-radius: 12px 0 0 0;
        display: flex;
        flex-direction: column;
        z-index: 9999;
        font-family: 'Share Tech Mono', 'Courier New', monospace;
        box-shadow: -4px -4px 32px rgba(0,200,255,0.08);
        overflow: hidden;
      }
      #tmg-inner {
        overflow-y: auto;
        flex: 1;
        padding: 0 0 12px 0;
        scrollbar-width: thin;
        scrollbar-color: #1e2535 transparent;
      }

      /* ── Header ── */
      .tmg-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 14px 8px;
        background: #0a0c10;
        border-bottom: 1px solid #1e2535;
        position: sticky;
        top: 0;
        z-index: 10;
      }
      .tmg-header-left { display: flex; align-items: center; gap: 8px; }
      .tmg-badge {
        font-size: 9px;
        letter-spacing: 0.12em;
        color: #00c8ff;
        background: rgba(0,200,255,0.08);
        border: 1px solid rgba(0,200,255,0.2);
        border-radius: 4px;
        padding: 2px 6px;
        text-transform: uppercase;
      }
      .tmg-title {
        font-size: 11px;
        color: #e0e8f0;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .tmg-header-actions { display: flex; gap: 6px; }
      .tmg-btn-icon {
        background: none;
        border: 1px solid #1e2535;
        border-radius: 4px;
        color: #5a7090;
        cursor: pointer;
        font-size: 11px;
        padding: 3px 7px;
        transition: all 0.15s;
      }
      .tmg-btn-icon:hover { border-color: #00c8ff; color: #00c8ff; }

      /* ── Mission meta ── */
      .tmg-meta {
        padding: 10px 14px 8px;
        border-bottom: 1px solid #111620;
      }
      .tmg-anomaly-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 10px;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: #ff6b35;
        margin-bottom: 5px;
      }
      .tmg-anomaly-dot {
        width: 6px; height: 6px;
        border-radius: 50%;
        background: #ff6b35;
        animation: tmg-pulse 1.4s infinite;
      }
      @keyframes tmg-pulse {
        0%,100% { opacity: 1; }
        50% { opacity: 0.3; }
      }
      .tmg-anomaly-title {
        font-size: 13px;
        color: #e0e8f0;
        font-weight: 600;
        margin-bottom: 4px;
        line-height: 1.3;
      }
      .tmg-anomaly-summary {
        font-size: 11px;
        color: #6a8aaa;
        line-height: 1.5;
      }
      .tmg-denial-tag {
        display: inline-block;
        margin-top: 6px;
        font-size: 10px;
        background: rgba(255,107,53,0.1);
        border: 1px solid rgba(255,107,53,0.3);
        color: #ff6b35;
        border-radius: 3px;
        padding: 1px 6px;
        letter-spacing: 0.08em;
      }

      /* ── Section label ── */
      .tmg-section-label {
        font-size: 9px;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        color: #3a5060;
        padding: 10px 14px 5px;
      }

      /* ── App chips ── */
      .tmg-app-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        padding: 0 14px 10px;
      }
      .tmg-chip {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 10px;
        color: #8aaac8;
        background: #111620;
        border: 1px solid #1e2535;
        border-radius: 20px;
        padding: 4px 10px;
        letter-spacing: 0.04em;
      }
      .tmg-chip-icon { font-size: 12px; }

      /* ── TSM vs BPO compare ── */
      .tmg-compare {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        padding: 0 14px 10px;
      }
      .tmg-compare-card {
        border-radius: 6px;
        padding: 10px 10px 8px;
        font-size: 10px;
        line-height: 1.5;
      }
      .tmg-compare-card.tsm {
        background: rgba(0,200,100,0.06);
        border: 1px solid rgba(0,200,100,0.18);
      }
      .tmg-compare-card.bpo {
        background: rgba(255,80,80,0.05);
        border: 1px solid rgba(255,80,80,0.15);
      }
      .tmg-compare-label {
        font-size: 9px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        margin-bottom: 4px;
        font-weight: 700;
      }
      .tmg-compare-card.tsm .tmg-compare-label { color: #00c864; }
      .tmg-compare-card.bpo .tmg-compare-label { color: #ff5050; }
      .tmg-compare-body { color: #8aaac8; }

      /* ── Execution steps ── */
      .tmg-steps { padding: 0 14px 4px; }
      .tmg-step {
        display: flex;
        gap: 10px;
        padding: 8px 0;
        border-bottom: 1px solid #0f1520;
        align-items: flex-start;
      }
      .tmg-step:last-child { border-bottom: none; }
      .tmg-step-num {
        width: 22px; height: 22px;
        min-width: 22px;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 10px;
        font-weight: 700;
        flex-shrink: 0;
        margin-top: 1px;
      }
      .tmg-step.active .tmg-step-num {
        background: #00c8ff;
        color: #000;
      }
      .tmg-step.done .tmg-step-num {
        background: #00c864;
        color: #000;
      }
      .tmg-step.pending .tmg-step-num {
        background: #1e2535;
        color: #3a5060;
      }
      .tmg-step.urgent .tmg-step-num {
        background: rgba(255,107,53,0.15);
        border: 1px solid #ff6b35;
        color: #ff6b35;
      }
      .tmg-step-body { flex: 1; }
      .tmg-step-title {
        font-size: 11px;
        color: #c0d0e0;
        font-weight: 600;
        margin-bottom: 2px;
        line-height: 1.3;
      }
      .tmg-step.urgent .tmg-step-title { color: #ff6b35; }
      .tmg-step.done .tmg-step-title {
        text-decoration: line-through;
        color: #3a5060;
      }
      .tmg-step-instruction {
        font-size: 10px;
        color: #5a7090;
        line-height: 1.5;
        margin-bottom: 3px;
      }
      .tmg-step-hint {
        font-size: 9px;
        color: #00c8ff;
        opacity: 0.7;
        font-style: italic;
      }
      .tmg-step-check {
        background: none;
        border: 1px solid #1e2535;
        border-radius: 3px;
        color: #3a5060;
        cursor: pointer;
        font-size: 9px;
        padding: 2px 5px;
        margin-top: 4px;
        transition: all 0.15s;
        letter-spacing: 0.06em;
      }
      .tmg-step-check:hover { border-color: #00c864; color: #00c864; }

      /* ── Ready prompts ── */
      .tmg-prompts { padding: 0 14px 4px; display: flex; flex-direction: column; gap: 5px; }
      .tmg-prompt-btn {
        display: flex;
        align-items: center;
        gap: 7px;
        background: #0f1520;
        border: 1px solid #1e2535;
        border-radius: 6px;
        color: #8aaac8;
        cursor: pointer;
        font-size: 10px;
        font-family: inherit;
        padding: 7px 10px;
        text-align: left;
        transition: all 0.15s;
        letter-spacing: 0.03em;
        line-height: 1.4;
      }
      .tmg-prompt-btn:hover {
        border-color: #00c8ff;
        color: #00c8ff;
        background: rgba(0,200,255,0.04);
      }
      .tmg-prompt-arrow { color: #3a5060; flex-shrink: 0; }

      /* ── Progress bar ── */
      .tmg-progress-wrap { padding: 6px 14px 0; }
      .tmg-progress-label {
        display: flex;
        justify-content: space-between;
        font-size: 9px;
        color: #3a5060;
        letter-spacing: 0.08em;
        margin-bottom: 4px;
        text-transform: uppercase;
      }
      .tmg-progress-bar {
        height: 3px;
        background: #1e2535;
        border-radius: 2px;
        overflow: hidden;
      }
      .tmg-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #00c8ff, #00c864);
        border-radius: 2px;
        transition: width 0.4s ease;
      }

      /* ── Footer actions ── */
      .tmg-footer {
        display: flex;
        gap: 6px;
        padding: 10px 14px 12px;
        border-top: 1px solid #111620;
      }
      .tmg-footer-btn {
        flex: 1;
        background: none;
        border: 1px solid #1e2535;
        border-radius: 5px;
        color: #5a7090;
        cursor: pointer;
        font-family: inherit;
        font-size: 10px;
        letter-spacing: 0.08em;
        padding: 7px;
        text-transform: uppercase;
        transition: all 0.15s;
      }
      .tmg-footer-btn:hover { border-color: #00c8ff; color: #00c8ff; }
      .tmg-footer-btn.primary {
        background: rgba(0,200,255,0.08);
        border-color: rgba(0,200,255,0.3);
        color: #00c8ff;
      }
      .tmg-footer-btn.primary:hover {
        background: rgba(0,200,255,0.15);
      }

      /* ── Loading skeleton ── */
      .tmg-loading {
        padding: 20px 14px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        align-items: center;
      }
      .tmg-spinner {
        width: 24px; height: 24px;
        border: 2px solid #1e2535;
        border-top-color: #00c8ff;
        border-radius: 50%;
        animation: tmg-spin 0.8s linear infinite;
      }
      @keyframes tmg-spin { to { transform: rotate(360deg); } }
      .tmg-loading-text {
        font-size: 10px;
        color: #3a5060;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }
      .tmg-skel {
        height: 8px;
        background: #111620;
        border-radius: 4px;
        width: 100%;
        animation: tmg-shimmer 1.2s infinite;
      }
      @keyframes tmg-shimmer {
        0%,100% { opacity: 0.4; }
        50% { opacity: 0.9; }
      }

      /* ── Empty state ── */
      .tmg-empty {
        padding: 28px 14px;
        text-align: center;
        color: #2a3545;
        font-size: 11px;
        letter-spacing: 0.06em;
        line-height: 1.6;
      }
      .tmg-empty-icon { font-size: 28px; margin-bottom: 10px; opacity: 0.4; }
    `;
    document.head.appendChild(s);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  function render() {
    ensurePanel();
    const inner = document.getElementById('tmg-inner');
    if (!inner) return;
    const m = loadMission();

    if (!m) {
      inner.innerHTML = `
        <div class="tmg-header">
          <div class="tmg-header-left">
            <span class="tmg-badge">Mission Guide</span>
            <span class="tmg-title">Anomaly Repair</span>
          </div>
        </div>
        <div class="tmg-empty">
          <div class="tmg-empty-icon">⚡</div>
          Fire the engine chain or click an anomaly<br>to load a guided repair workflow.
        </div>`;
      return;
    }

    if (m._loading) {
      inner.innerHTML = `
        <div class="tmg-header">
          <div class="tmg-header-left">
            <span class="tmg-badge">Mission Guide</span>
            <span class="tmg-title">Generating Workflow…</span>
          </div>
        </div>
        <div class="tmg-loading">
          <div class="tmg-spinner"></div>
          <div class="tmg-loading-text">TSM Neural Core — Analyzing Anomaly</div>
          <div class="tmg-skel" style="width:80%"></div>
          <div class="tmg-skel" style="width:60%"></div>
          <div class="tmg-skel" style="width:90%"></div>
        </div>`;
      return;
    }

    const steps   = m.steps   || [];
    const apps    = m.apps    || [];
    const tsmWay  = m.tsmWay  || 'AI-driven resolution in minutes';
    const bpoWay  = m.bpoWay  || 'Manual ticket, 3–7 day queue';
    const prompts = m.prompts || [];

    const doneCount = steps.filter(s => s.status === 'done').length;
    const pct = steps.length ? Math.round((doneCount / steps.length) * 100) : 0;

    const denialCode = m.denialCode || extractDenialCode(m.anomalyType + ' ' + (m.anomalySummary || ''));

    // Build app chips HTML
    const chipsHtml = apps.length
      ? apps.map(a => `<span class="tmg-chip"><span class="tmg-chip-icon">◈</span>${escHtml(a)}</span>`).join('')
      : '<span class="tmg-chip"><span class="tmg-chip-icon">◈</span>Groq AI Query</span><span class="tmg-chip"><span class="tmg-chip-icon">◈</span>Claim Reviewer</span>';

    // Build steps HTML
    const stepsHtml = steps.map((s, i) => {
      const isUrgent = (s.title || '').includes('[URGENT]');
      const cleanTitle = (s.title || '').replace('[URGENT]', '').trim();
      const cls = s.status === 'done' ? 'done' : s.status === 'active' ? 'active' : isUrgent ? 'urgent' : 'pending';
      return `
        <div class="tmg-step ${cls}" data-step-id="${escHtml(s.id)}">
          <div class="tmg-step-num">${s.status === 'done' ? '✓' : i + 1}</div>
          <div class="tmg-step-body">
            <div class="tmg-step-title">${isUrgent ? '⚡ ' : ''}${escHtml(cleanTitle)}</div>
            ${s.instruction ? `<div class="tmg-step-instruction">${escHtml(s.instruction)}</div>` : ''}
            ${s.fieldHint   ? `<div class="tmg-step-hint">↳ ${escHtml(s.fieldHint)}</div>` : ''}
            ${s.status !== 'done' ? `<button class="tmg-step-check" onclick="window.TSMMissionGuide.completeStep('${escHtml(s.id)}')">Mark done ✓</button>` : ''}
          </div>
        </div>`;
    }).join('');

    // Build ready prompts HTML
    const promptsHtml = prompts.map(p => `
      <button class="tmg-prompt-btn" onclick="window.TSMMissionGuide.copyPrompt(${JSON.stringify(escHtml(p))})">
        <span class="tmg-prompt-arrow">✈</span>
        ${escHtml(p)}
      </button>`).join('');

    inner.innerHTML = `
      <div class="tmg-header">
        <div class="tmg-header-left">
          <span class="tmg-badge">Mission Guide</span>
          <span class="tmg-title">Anomaly Repair</span>
        </div>
        <div class="tmg-header-actions">
          <button class="tmg-btn-icon" onclick="window.TSMMissionGuide.regenerate(window.__tmgCurrent)" title="Regenerate">↻</button>
          <button class="tmg-btn-icon" onclick="window.TSMMissionGuide.hide()" title="Minimize">−</button>
        </div>
      </div>

      <div class="tmg-meta">
        <div class="tmg-anomaly-badge"><span class="tmg-anomaly-dot"></span>Anomaly Detected</div>
        <div class="tmg-anomaly-title">${escHtml(m.anomalyType || 'Document Anomaly')}</div>
        ${m.anomalySummary ? `<div class="tmg-anomaly-summary">${escHtml(m.anomalySummary)}</div>` : ''}
        ${denialCode ? `<span class="tmg-denial-tag">${escHtml(denialCode)}</span>` : ''}
      </div>

      <div class="tmg-progress-wrap">
        <div class="tmg-progress-label">
          <span>Mission Progress</span>
          <span>${doneCount}/${steps.length} · ${pct}%</span>
        </div>
        <div class="tmg-progress-bar"><div class="tmg-progress-fill" style="width:${pct}%"></div></div>
      </div>

      ${apps.length || true ? `
        <div class="tmg-section-label">Apps Used in This Workflow</div>
        <div class="tmg-app-chips">${chipsHtml}</div>
      ` : ''}

      <div class="tmg-compare">
        <div class="tmg-compare-card tsm">
          <div class="tmg-compare-label">TSM Way</div>
          <div class="tmg-compare-body">${escHtml(tsmWay)}</div>
        </div>
        <div class="tmg-compare-card bpo">
          <div class="tmg-compare-label">Old BPO Way</div>
          <div class="tmg-compare-body">${escHtml(bpoWay)}</div>
        </div>
      </div>

      ${steps.length ? `
        <div class="tmg-section-label">Execution Steps</div>
        <div class="tmg-steps">${stepsHtml}</div>
      ` : ''}

      ${prompts.length ? `
        <div class="tmg-section-label">Ready-to-Use Prompts</div>
        <div class="tmg-prompts">${promptsHtml}</div>
      ` : ''}

      <div class="tmg-footer">
        <button class="tmg-footer-btn" onclick="window.TSMMissionGuide.clearMission()">✕ Clear</button>
        <button class="tmg-footer-btn" onclick="window.TSMMissionGuide.regenerate(window.__tmgCurrent)">↻ Regenerate</button>
        <button class="tmg-footer-btn primary" onclick="window.TSMMissionGuide.escalate()">Escalate →</button>
      </div>`;

    // Keep current mission accessible for regenerate button
    window.__tmgCurrent = m;
  }

  // ── AI Prompt Builders ─────────────────────────────────────────────────────
  function buildStepSystem() {
    return `You are TSM Neural Core, an expert insurance and healthcare RCM operations AI. 
Generate denial-code-aware guided repair workflows for staff resolving document anomalies.
Respond ONLY with valid JSON — no markdown, no explanation, no code fences.
The JSON must match exactly: {"apps":["..."],"tsmWay":"...","bpoWay":"...","steps":[{"title":"...","instruction":"...","fieldHint":"..."}],"prompts":["...","..."]}`;
  }

  const DENIAL_INTEL = {
    'CO-5':  { reason:'Procedure inconsistent with place of service', missingDocs:'CMN, W-9, Prior Authorization', appealTeam:'Authorization & Billing Team', appealPath:'Submit corrected claim with CMN + prior auth within 120 days', urgency:'HIGH' },
    'CO-4':  { reason:'Service inconsistent with covered benefit', missingDocs:'Medical necessity letter, Physician order', appealTeam:'Clinical Appeals Team', appealPath:'Submit medical necessity letter from ordering physician', urgency:'MEDIUM' },
    'CO-16': { reason:'Claim lacks required information', missingDocs:'Missing modifier, NPI/taxonomy correction', appealTeam:'Billing Corrections Team', appealPath:'Correct and resubmit — no formal appeal needed', urgency:'LOW' },
    'CO-22': { reason:'Covered by another payer per COB', missingDocs:'COB form, Secondary payer EOB, Insurance verification', appealTeam:'COB/Eligibility Team', appealPath:'Verify payer order and resubmit with COB documentation', urgency:'MEDIUM' },
    'CO-97': { reason:'Bundled service included in another service', missingDocs:'Modifier 59 documentation, Operative report', appealTeam:'Coding & Compliance Team', appealPath:'Apply correct NCCI modifier and resubmit', urgency:'MEDIUM' },
    'PR-96': { reason:'Non-covered charge — patient responsibility', missingDocs:'ABN signed form, Patient consent', appealTeam:'Patient Financial Services', appealPath:'Verify ABN signature. Issue patient statement', urgency:'HIGH' },
    'CO-50': { reason:'Non-covered service — not deemed medical necessity', missingDocs:'Medical necessity documentation, Physician letter', appealTeam:'Clinical Appeals Team', appealPath:'Submit clinical notes + medical necessity letter', urgency:'HIGH' },
    'CO-29': { reason:'Timely filing limit expired', missingDocs:'Proof of timely filing, EOB from primary', appealTeam:'Appeals & Escalations Team', appealPath:'Submit proof of timely filing within 30 days of denial', urgency:'HIGH' },
  };

  function extractDenialCode(text) {
    const m = (text || '').match(/\b(CO-\d+|PR-\d+|OA-\d+|PI-\d+)\b/i);
    return m ? m[1].toUpperCase() : null;
  }

  function buildStepPrompt(m) {
    const codeRaw = m.denialCode
      || extractDenialCode((m.anomalyType || '') + ' ' + (m.anomalySummary || ''));
    const denialCode = codeRaw ? codeRaw.toUpperCase() : null;
    const intel = denialCode ? (DENIAL_INTEL[denialCode] || null) : null;

    const denialContext = intel
      ? `DENIAL CODE: ${denialCode}
DENIAL REASON: ${intel.reason}
MISSING DOCUMENTS: ${intel.missingDocs}
APPEAL TEAM: ${intel.appealTeam}
APPEAL PATH: ${intel.appealPath}
URGENCY: ${intel.urgency}`
      : `DENIAL REASON: ${(m.warRoomContext?.denialReason || m.anomalySummary || 'Not specified').slice(0, 200)}`;

    return `Generate a complete guided repair workflow for this insurance document anomaly.

ANOMALY TYPE: ${m.anomalyType || 'Document Issue'}
TARGET APP: ${m.targetApp || 'Insurance War Room'}
PAYER: ${m.payer || m.warRoomContext?.payer || 'Unknown'}
CLAIM AMOUNT: ${m.claimAmount || 'Unknown'}
PATIENT: ${m.patientOrClient || 'Unknown'}

${denialContext}

REQUIREMENTS:
- apps: 2–4 TSM app names the staff will use (e.g. "Claim Reviewer", "Groq AI Query", "EOB Analyzer", "Clearinghouse Export", "Prior Auth Portal", "Coding Validator")
- tsmWay: one sentence — how TSM resolves this faster/better
- bpoWay: one sentence — how legacy BPO handles this (slower, manual)
- steps: exactly 5 objects. Each has title, instruction, fieldHint.
${intel ? `  Step 1 must address: ${intel.missingDocs}. Step 5 must escalate to Executive Portal.` : ''}
${denialCode ? `  Mark time-critical steps with [URGENT] prefix in title.` : ''}
- prompts: exactly 2 ready-to-use AI prompt strings the staff can copy-paste into the AI query box

Respond with ONLY this JSON (no markdown, no fences):
{"apps":["..."],"tsmWay":"...","bpoWay":"...","steps":[{"title":"...","instruction":"...","fieldHint":"..."}],"prompts":["...","..."]}`;
  }

  // ── AI Step Regeneration ───────────────────────────────────────────────────
  async function regenerateSteps(m) {
    if (!m) { m = loadMission(); }
    if (!m) return;

    m._loading = true;
    saveMission(m);
    render();

    try {
      const res = await fetch('/api/insurance/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: buildStepSystem(),
          message: buildStepPrompt(m),
          max_tokens: 1400
        })
      });

      if (!res.ok) throw new Error('API ' + res.status);
      const data = await res.json();
      let text = (data.result || data.answer || data.response || data.content || '')
        .replace(/```json|```/g, '').trim();

      if (!text || text.startsWith('<')) throw new Error('Non-JSON server response');

      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) parsed = JSON.parse(match[0]);
        else throw new Error('JSON parse failed');
      }

      // Merge AI response into mission
      m.apps    = parsed.apps    || m.apps    || [];
      m.tsmWay  = parsed.tsmWay  || m.tsmWay  || '';
      m.bpoWay  = parsed.bpoWay  || m.bpoWay  || '';
      m.prompts = parsed.prompts || m.prompts || [];
      m.steps   = (parsed.steps || []).map((s, i) => ({
        id: `step-${i}`,
        title: s.title || `Step ${i + 1}`,
        instruction: s.instruction || '',
        fieldHint: s.fieldHint || '',
        status: i === 0 ? 'active' : 'pending'
      }));
      m._loading = false;
      m.generatedAt = new Date().toISOString();
      saveMission(m);

    } catch (err) {
      console.error('TSM Mission Guide: generation failed', err);
      m._loading = false;
      saveMission(m);
    }

    render();
  }

  // ── Step completion ────────────────────────────────────────────────────────
  function completeStep(stepId) {
    const m = loadMission();
    if (!m || !m.steps) return;
    const idx = m.steps.findIndex(s => s.id === stepId);
    if (idx < 0) return;
    m.steps[idx].status = 'done';
    // Activate next step
    const next = m.steps[idx + 1];
    if (next && next.status === 'pending') next.status = 'active';
    saveMission(m);
    render();
  }

  // ── Escalate ───────────────────────────────────────────────────────────────
  function escalate() {
    // Try to find exec portal link from nav
    const execLink = document.querySelector('a[href*="executive"], a[href*="exec-portal"], nav a:last-child');
    if (execLink) { execLink.click(); return; }
    // Fallback: relay for strategist
    const m = loadMission();
    if (m) {
      try { sessionStorage.setItem('TSM_ESCALATE_RELAY', JSON.stringify(m)); } catch {}
    }
    const msg = document.querySelector('[data-escalate], .escalate-btn, #escalate-strategist');
    if (msg) msg.click();
  }

  // ── Copy prompt ───────────────────────────────────────────────────────────
  function copyPrompt(text) {
    // Try to paste into AI query box first
    const queryBox = document.querySelector('#user-input, #ai-query, textarea[placeholder*="prompt"], textarea[placeholder*="query"], .ai-input');
    if (queryBox) {
      queryBox.value = text;
      queryBox.dispatchEvent(new Event('input', { bubbles: true }));
      queryBox.focus();
      return;
    }
    // Fallback: clipboard
    navigator.clipboard?.writeText(text).catch(() => {});
  }

  // ── Clear mission ──────────────────────────────────────────────────────────
  function clearMission() {
    localStorage.removeItem(STORAGE_KEY);
    window.__tmgCurrent = null;
    render();
  }

  // ── Trigger: Anomaly Advisor relay ─────────────────────────────────────────
  function checkRelayKeys() {
    for (const key of RELAY_KEYS) {
      const raw = sessionStorage.getItem(key) || localStorage.getItem(key);
      if (!raw) continue;
      try {
        const payload = JSON.parse(raw);
        if (!payload || !payload.anomalyType) continue;
        const existing = loadMission();
        // Only load if it's a new mission (different anomaly or no existing)
        if (!existing || existing.anomalyType !== payload.anomalyType) {
          const m = {
            ...payload,
            _loading: true,
            _sourceKey: key
          };
          saveMission(m);
          const panel = document.getElementById(PANEL_ID);
          if (panel) panel.style.display = 'flex';
          render();
          regenerateSteps(m);
        }
        return;
      } catch {}
    }
  }

  // ── Trigger: engine completion (auto after 1.2s) ───────────────────────────
  function watchEngineCompletion() {
    // Watch for session storage writes from engine pipeline
    const _setItem = sessionStorage.setItem.bind(sessionStorage);
    sessionStorage.setItem = function(key, value) {
      _setItem(key, value);
      if (RELAY_KEYS.includes(key)) {
        setTimeout(checkRelayKeys, 200);
      }
    };
  }

  // ── Trigger: EU clicks anomaly card ───────────────────────────────────────
  function bindAnomalyCardClicks() {
    document.addEventListener('click', (e) => {
      const card = e.target.closest('[data-anomaly-type], .anomaly-card, .anomaly-item, .defect-row');
      if (!card) return;

      const anomalyType    = card.dataset.anomalyType    || card.querySelector('.anomaly-type, .defect-type')?.textContent?.trim()    || 'Document Anomaly';
      const anomalySummary = card.dataset.anomalySummary || card.querySelector('.anomaly-summary, .defect-desc')?.textContent?.trim() || '';
      const denialCode     = card.dataset.denialCode     || extractDenialCode(anomalyType + ' ' + anomalySummary);
      const targetApp      = card.dataset.targetApp      || 'Insurance War Room';
      const payer          = card.dataset.payer          || '';
      const claimAmount    = card.dataset.claimAmount    || '';
      const patientOrClient = card.dataset.patient       || '';

      const m = {
        anomalyType,
        anomalySummary,
        denialCode,
        targetApp,
        payer,
        claimAmount,
        patientOrClient,
        _loading: true,
        _triggeredBy: 'card-click'
      };
      saveMission(m);
      const panel = document.getElementById(PANEL_ID);
      if (panel) {
        panel.style.display = 'flex';
        panel.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
      render();
      regenerateSteps(m);
    });
  }

  // ── Utils ──────────────────────────────────────────────────────────────────
  function escHtml(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── Init ───────────────────────────────────────────────────────────────────
  function init() {
    ensurePanel();

    // Storage cross-tab sync
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY) render();
      if (RELAY_KEYS.includes(e.key)) setTimeout(checkRelayKeys, 200);
    });

    // Relay key polling (catches same-tab writes)
    checkRelayKeys();
    setInterval(checkRelayKeys, 3000);

    // Patch sessionStorage to catch engine relay writes
    watchEngineCompletion();

    // Bind anomaly card clicks
    bindAnomalyCardClicks();

    // Initial render
    render();

    // Public API
    window.TSMMissionGuide = {
      refresh:      render,
      show:         () => { const p = document.getElementById(PANEL_ID); if(p) p.style.display='flex'; render(); },
      hide:         () => { const p = document.getElementById(PANEL_ID); if(p) p.style.display='none'; },
      setMission:   (m) => { saveMission(m); render(); regenerateSteps(m); },
      regenerate:   (m) => regenerateSteps(m || loadMission()),
      completeStep: completeStep,
      clearMission: clearMission,
      copyPrompt:   copyPrompt,
      escalate:     escalate,
      // Convenience: trigger from engine output
      triggerFromEngine: (anomalyPayload) => {
        const m = { ...anomalyPayload, _loading: true, _triggeredBy: 'engine' };
        saveMission(m);
        const p = document.getElementById(PANEL_ID);
        if (p) p.style.display = 'flex';
        render();
        regenerateSteps(m);
      }
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
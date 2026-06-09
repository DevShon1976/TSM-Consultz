/**
 * TSM MISSION GUIDE — Universal Floating Panel
 * Drop <script src="/js/tsm-mission-guide.js"></script> into any TSM app page.
 * Reads mission payload from localStorage key: "tsm_active_mission"
 * 
 * Payload shape written by War Room:
 * {
 *   missionId: "INS-2026-001",
 *   anomalyType: "AP Aging | DME Denial | ...",
 *   anomalySummary: "Short description of the issue",
 *   targetApp: "Claims Triage",
 *   targetUrl: "/html/tsm-insurance/claims-triage.html",
 *   patientOrClient: "Medicare Beneficiary",
 *   claimAmount: "$3,200",
 *   steps: [ { id, title, instruction, fieldHint, status } ],  // AI-generated
 *   generatedAt: ISO timestamp,
 *   warRoomContext: { ... }  // full raw context passed for re-generation
 * }
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'tsm_active_mission';
  const PANEL_ID = 'tsm-mission-guide-panel';

  // ── Inject styles ──────────────────────────────────────────────────────────
  const css = `
    #tsm-mission-guide-panel {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 360px;
      max-height: 82vh;
      background: #0a0e0a;
      border: 1px solid #2a4a2a;
      border-top: 3px solid #39ff14;
      border-radius: 4px;
      font-family: 'JetBrains Mono', 'Share Tech Mono', 'Courier New', monospace;
      font-size: 11px;
      color: #c8e6c9;
      z-index: 99999;
      box-shadow: 0 0 40px rgba(57,255,20,0.12), 0 8px 32px rgba(0,0,0,0.8);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transition: width 0.2s ease, max-height 0.2s ease;
    }
    #tsm-mission-guide-panel.tmg-collapsed {
      max-height: 44px;
      width: 260px;
    }
    #tsm-mission-guide-panel.tmg-collapsed .tmg-body { display: none; }

    .tmg-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      background: #0d140d;
      border-bottom: 1px solid #1a3a1a;
      cursor: pointer;
      user-select: none;
      flex-shrink: 0;
    }
    .tmg-header-left {
      display: flex;
      align-items: center;
      gap: 7px;
    }
    .tmg-pulse {
      width: 7px; height: 7px;
      background: #39ff14;
      border-radius: 50%;
      animation: tmg-blink 1.4s ease-in-out infinite;
      flex-shrink: 0;
    }
    @keyframes tmg-blink {
      0%,100% { opacity:1; box-shadow: 0 0 4px #39ff14; }
      50% { opacity:0.3; box-shadow: none; }
    }
    .tmg-title {
      color: #39ff14;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }
    .tmg-mission-id {
      color: #5a8a5a;
      font-size: 9px;
      letter-spacing: 0.08em;
    }
    .tmg-controls {
      display: flex;
      gap: 6px;
    }
    .tmg-btn-icon {
      background: none;
      border: 1px solid #2a4a2a;
      color: #5a8a5a;
      width: 20px; height: 20px;
      border-radius: 2px;
      font-size: 10px;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.15s;
      flex-shrink: 0;
    }
    .tmg-btn-icon:hover { border-color: #39ff14; color: #39ff14; }

    .tmg-body {
      overflow-y: auto;
      flex: 1;
      scrollbar-width: thin;
      scrollbar-color: #2a4a2a #0a0e0a;
    }

    .tmg-anomaly-banner {
      margin: 10px 12px 0;
      background: #0f1f0f;
      border: 1px solid #1e3d1e;
      border-left: 3px solid #ffd600;
      border-radius: 2px;
      padding: 8px 10px;
    }
    .tmg-anomaly-label {
      color: #ffd600;
      font-size: 9px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin-bottom: 3px;
    }
    .tmg-anomaly-type {
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .tmg-anomaly-summary {
      color: #8ab48a;
      font-size: 10px;
      line-height: 1.5;
    }

    .tmg-target-app {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin: 8px 12px 0;
      padding: 7px 10px;
      background: #0d1f0d;
      border: 1px solid #1a3a1a;
      border-radius: 2px;
    }
    .tmg-target-label { color: #5a8a5a; font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; }
    .tmg-target-name { color: #39ff14; font-size: 11px; font-weight: 700; }
    .tmg-open-app-btn {
      background: #39ff14;
      color: #000;
      border: none;
      padding: 4px 9px;
      border-radius: 2px;
      font-family: inherit;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      cursor: pointer;
      transition: opacity 0.15s;
    }
    .tmg-open-app-btn:hover { opacity: 0.85; }

    .tmg-progress-bar-wrap {
      margin: 10px 12px 0;
    }
    .tmg-progress-meta {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
    }
    .tmg-progress-label { color: #5a8a5a; font-size: 9px; letter-spacing: 0.08em; text-transform: uppercase; }
    .tmg-progress-count { color: #39ff14; font-size: 9px; font-weight: 700; }
    .tmg-progress-track {
      height: 3px;
      background: #1a3a1a;
      border-radius: 2px;
      overflow: hidden;
    }
    .tmg-progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #39ff14, #00e676);
      border-radius: 2px;
      transition: width 0.4s ease;
    }

    .tmg-steps-section {
      padding: 10px 12px 4px;
    }
    .tmg-steps-label {
      color: #5a8a5a;
      font-size: 9px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin-bottom: 8px;
    }

    .tmg-step {
      display: flex;
      gap: 9px;
      margin-bottom: 10px;
      padding: 9px 10px;
      background: #0d140d;
      border: 1px solid #1a3a1a;
      border-radius: 3px;
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
      position: relative;
    }
    .tmg-step:hover { border-color: #2a5a2a; background: #0f1a0f; }
    .tmg-step.tmg-step-active {
      border-color: #39ff14;
      background: #0d1a0d;
      box-shadow: 0 0 12px rgba(57,255,20,0.08);
    }
    .tmg-step.tmg-step-active::before {
      content: '';
      position: absolute;
      left: 0; top: 0; bottom: 0;
      width: 3px;
      background: #39ff14;
      border-radius: 3px 0 0 3px;
    }
    .tmg-step.tmg-step-done {
      border-color: #1a3a1a;
      background: #0a110a;
      opacity: 0.7;
    }
    .tmg-step.tmg-step-done .tmg-step-title { text-decoration: line-through; color: #4a6a4a; }

    .tmg-step-checkbox {
      width: 16px; height: 16px;
      border: 1px solid #2a5a2a;
      border-radius: 2px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      margin-top: 1px;
      transition: all 0.15s;
      background: #0a140a;
    }
    .tmg-step.tmg-step-active .tmg-step-checkbox { border-color: #39ff14; }
    .tmg-step.tmg-step-done .tmg-step-checkbox {
      background: #39ff14;
      border-color: #39ff14;
    }
    .tmg-step-check-icon { color: #000; font-size: 9px; font-weight: 700; display: none; }
    .tmg-step.tmg-step-done .tmg-step-check-icon { display: block; }
    .tmg-step-num {
      color: #2a6a2a;
      font-size: 9px;
      font-weight: 700;
    }
    .tmg-step.tmg-step-active .tmg-step-num { color: #39ff14; display: none; }
    .tmg-step.tmg-step-done .tmg-step-num { display: none; }

    .tmg-step-content { flex: 1; min-width: 0; }
    .tmg-step-title {
      color: #c8e6c9;
      font-size: 10px;
      font-weight: 700;
      margin-bottom: 3px;
      line-height: 1.3;
    }
    .tmg-step.tmg-step-active .tmg-step-title { color: #fff; }
    .tmg-step-instruction {
      color: #7aaa7a;
      font-size: 10px;
      line-height: 1.5;
      margin-bottom: 5px;
    }
    .tmg-field-hint {
      background: #071207;
      border: 1px solid #1a4a1a;
      border-left: 2px solid #ffd600;
      padding: 5px 8px;
      border-radius: 2px;
      color: #ffd600;
      font-size: 9.5px;
      line-height: 1.4;
    }
    .tmg-field-hint-label {
      color: #5a8a5a;
      font-size: 8px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 2px;
    }

    .tmg-loading {
      padding: 20px 12px;
      text-align: center;
    }
    .tmg-loading-spinner {
      width: 20px; height: 20px;
      border: 2px solid #1a3a1a;
      border-top-color: #39ff14;
      border-radius: 50%;
      animation: tmg-spin 0.8s linear infinite;
      margin: 0 auto 10px;
    }
    @keyframes tmg-spin { to { transform: rotate(360deg); } }
    .tmg-loading-text { color: #5a8a5a; font-size: 10px; letter-spacing: 0.08em; }

    .tmg-footer {
      border-top: 1px solid #1a3a1a;
      padding: 8px 12px;
      display: flex;
      gap: 6px;
      justify-content: flex-end;
      flex-shrink: 0;
    }
    .tmg-footer-btn {
      background: none;
      border: 1px solid #2a4a2a;
      color: #5a8a5a;
      padding: 4px 9px;
      border-radius: 2px;
      font-family: inherit;
      font-size: 9px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      cursor: pointer;
      transition: all 0.15s;
    }
    .tmg-footer-btn:hover { border-color: #39ff14; color: #39ff14; }
    .tmg-footer-btn.tmg-danger:hover { border-color: #ff4444; color: #ff4444; }

    .tmg-empty {
      padding: 24px 16px;
      text-align: center;
      color: #2a5a2a;
      font-size: 10px;
      line-height: 1.6;
    }
    .tmg-empty-icon { font-size: 22px; margin-bottom: 8px; opacity: 0.5; }

    .tmg-complete-banner {
      margin: 10px 12px;
      padding: 10px;
      background: #071a07;
      border: 1px solid #39ff14;
      border-radius: 3px;
      text-align: center;
    }
    .tmg-complete-icon { font-size: 18px; margin-bottom: 4px; }
    .tmg-complete-text { color: #39ff14; font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }
    .tmg-complete-sub { color: #5a8a5a; font-size: 9px; margin-top: 3px; }
  `;

  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // ── Load Google Fonts if not already present ───────────────────────────────
  if (!document.querySelector('link[href*="JetBrains+Mono"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap';
    document.head.appendChild(link);
  }

  // ── State ──────────────────────────────────────────────────────────────────
  let mission = null;
  let collapsed = false;

  // ── Read mission from localStorage ────────────────────────────────────────
  function loadMission() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function saveMission(m) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(m));
    } catch (e) {}
  }

  // ── Compute step completion stats ──────────────────────────────────────────
  function getProgress(steps) {
    if (!steps || !steps.length) return { done: 0, total: 0, pct: 0 };
    const done = steps.filter(s => s.status === 'done').length;
    return { done, total: steps.length, pct: Math.round((done / steps.length) * 100) };
  }

  function getActiveStep(steps) {
    if (!steps) return -1;
    const idx = steps.findIndex(s => s.status === 'active');
    if (idx >= 0) return idx;
    // auto-set first non-done as active
    const first = steps.findIndex(s => s.status !== 'done');
    return first;
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  function render() {
    let panel = document.getElementById(PANEL_ID);
    if (!panel) {
      panel = document.createElement('div');
      panel.id = PANEL_ID;
      panel.style.display = 'none';
      document.body.appendChild(panel);
    }

    if (collapsed) panel.classList.add('tmg-collapsed');
    else panel.classList.remove('tmg-collapsed');

    mission = loadMission();

    // Auto-activate first pending step
    if (mission && mission.steps) {
      const hasActive = mission.steps.some(s => s.status === 'active');
      if (!hasActive) {
        const firstPending = mission.steps.find(s => s.status !== 'done');
        if (firstPending) firstPending.status = 'active';
        saveMission(mission);
      }
    }

    const prog = mission ? getProgress(mission.steps) : { done: 0, total: 0, pct: 0 };
    const allDone = mission && mission.steps && prog.done === prog.total && prog.total > 0;

    panel.innerHTML = `
      <div class="tmg-header" id="tmg-header-toggle">
        <div class="tmg-header-left">
          <div class="tmg-pulse"></div>
          <div>
            <div class="tmg-title">⚡ Mission Guide</div>
            ${mission ? `<div class="tmg-mission-id">${mission.missionId || 'ACTIVE'} · ${prog.done}/${prog.total} steps</div>` : '<div class="tmg-mission-id">No active mission</div>'}
          </div>
        </div>
        <div class="tmg-controls">
          <button class="tmg-btn-icon" id="tmg-toggle-btn" title="${collapsed ? 'Expand' : 'Collapse'}">${collapsed ? '▲' : '▼'}</button>
          <button class="tmg-btn-icon" id="tmg-close-btn" title="Dismiss">✕</button>
        </div>
      </div>

      <div class="tmg-body">
        ${!mission ? renderEmpty() : (mission._loading ? renderLoading() : renderMission(mission, allDone))}
      </div>

      ${mission && !mission._loading ? `
        <div class="tmg-footer">
          <button class="tmg-footer-btn" id="tmg-regen-btn">↺ Regenerate</button>
          <button class="tmg-footer-btn tmg-danger" id="tmg-clear-btn">✕ Clear Mission</button>
        </div>
      ` : ''}
    `;

    bindEvents(panel, mission);
  }

  function renderEmpty() {
    return `
      <div class="tmg-empty">
        <div class="tmg-empty-icon">◈</div>
        No active mission.<br>
        Fire an analysis in the<br>
        Insurance War Room to begin.
      </div>
    `;
  }

  function renderLoading() {
    return `
      <div class="tmg-loading">
        <div class="tmg-loading-spinner"></div>
        <div class="tmg-loading-text">TSM NEURAL CORE GENERATING<br>MISSION STEPS...</div>
      </div>
    `;
  }

  function renderMission(m, allDone) {
    const prog = getProgress(m.steps);
    return `
      <div class="tmg-anomaly-banner">
        <div class="tmg-anomaly-label">Anomaly Detected</div>
        <div class="tmg-anomaly-type">${escHtml(m.anomalyType || 'Unknown Anomaly')}</div>
        <div class="tmg-anomaly-summary">${escHtml(m.anomalySummary || '')}</div>
      </div>

      <div class="tmg-target-app">
        <div>
          <div class="tmg-target-label">Target App</div>
          <div class="tmg-target-name">${escHtml(m.targetApp || 'Unknown')}</div>
        </div>
        ${m.targetUrl ? `<button class="tmg-open-app-btn" id="tmg-open-app">Open →</button>` : ''}
      </div>

      <div class="tmg-progress-bar-wrap">
        <div class="tmg-progress-meta">
          <div class="tmg-progress-label">Mission Progress</div>
          <div class="tmg-progress-count">${prog.done}/${prog.total} · ${prog.pct}%</div>
        </div>
        <div class="tmg-progress-track">
          <div class="tmg-progress-fill" style="width:${prog.pct}%"></div>
        </div>
      </div>

      ${allDone ? `
        <div class="tmg-complete-banner">
          <div class="tmg-complete-icon">✓</div>
          <div class="tmg-complete-text">Mission Complete</div>
          <div class="tmg-complete-sub">All steps resolved — escalate or close</div>
        </div>
      ` : ''}

      <div class="tmg-steps-section">
        <div class="tmg-steps-label">Step-by-Step Instructions</div>
        ${(m.steps || []).map((step, i) => renderStep(step, i)).join('')}
      </div>
    `;
  }

  function renderStep(step, i) {
    const isDone = step.status === 'done';
    const isActive = step.status === 'active';
    const cls = isDone ? 'tmg-step-done' : isActive ? 'tmg-step-active' : '';

    return `
      <div class="tmg-step ${cls}" data-step="${i}">
        <div class="tmg-step-checkbox">
          <span class="tmg-step-check-icon">✓</span>
          ${!isDone ? `<span class="tmg-step-num">${i + 1}</span>` : ''}
        </div>
        <div class="tmg-step-content">
          <div class="tmg-step-title">${escHtml(step.title)}</div>
          ${isActive || isDone ? `<div class="tmg-step-instruction">${escHtml(step.instruction)}</div>` : ''}
          ${(isActive || isDone) && step.fieldHint ? `
            <div class="tmg-field-hint">
              <div class="tmg-field-hint-label">↳ Input / Field Guidance</div>
              ${escHtml(step.fieldHint)}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  // ── Event Binding ──────────────────────────────────────────────────────────
  function bindEvents(panel, m) {
    // Collapse toggle
    panel.querySelector('#tmg-toggle-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      collapsed = !collapsed;
      render();
    });
    panel.querySelector('#tmg-header-toggle')?.addEventListener('click', () => {
      collapsed = !collapsed;
      render();
    });

    // Close
    panel.querySelector('#tmg-close-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      panel.style.display = 'none';
    });

    // Open app
    panel.querySelector('#tmg-open-app')?.addEventListener('click', () => {
      if (m?.targetUrl) window.location.href = m.targetUrl;
    });

    // Step click — mark done or toggle active
    panel.querySelectorAll('.tmg-step').forEach(el => {
      el.addEventListener('click', () => {
        if (!m || !m.steps) return;
        const i = parseInt(el.dataset.step);
        const step = m.steps[i];
        if (step.status === 'done') {
          step.status = 'pending';
        } else if (step.status === 'active') {
          step.status = 'done';
          // activate next
          const next = m.steps.find((s, idx) => idx > i && s.status !== 'done');
          if (next) next.status = 'active';
        } else {
          // set all active → pending, then set this one active
          m.steps.forEach(s => { if (s.status === 'active') s.status = 'pending'; });
          step.status = 'active';
        }
        saveMission(m);
        render();
      });
    });

    // Regenerate
    panel.querySelector('#tmg-regen-btn')?.addEventListener('click', () => {
      if (!m) return;
      regenerateSteps(m);
    });

    // Clear
    panel.querySelector('#tmg-clear-btn')?.addEventListener('click', () => {
      if (confirm('Clear this mission? This cannot be undone.')) {
        localStorage.removeItem(STORAGE_KEY);
        render();
      }
    });
  }

  // ── AI Step Regeneration ───────────────────────────────────────────────────
  async function regenerateSteps(m) {
    m._loading = true;
    saveMission(m);
    render();

    

  try {
      const prompt = buildStepPrompt(m);
      const res = await fetch('/api/hc/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt, system: buildStepSystem(), model: 'llama-3.3-70b-versatile', max_tokens: 1200 })
      });
      if (!res.ok) throw new Error('API ' + res.status);
      const data = await res.json();
      const text = (data.result || data.answer || data.response || data.content || '').replace(/```json|```/g, '').trim();
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch(parseErr) {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) parsed = JSON.parse(match[0]);
        else throw parseErr;
      }
      m.steps = (parsed.steps || []).map((s, i) => ({
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
      console.error('TSM Mission Guide: step generation failed', err);
      m._loading = false;
      saveMission(m);
    }
    render();
  }

  function buildStepSystem() {
    return `You are TSM Neural Core, an expert insurance operations AI. Generate precise step-by-step guided instructions for insurance staff to resolve anomalies. Respond ONLY with valid JSON — no markdown, no explanation, no code fences.`;
  }

  function buildStepPrompt(m) {
  const denialIntel = {
    'CO-5':  { reason:'Procedure inconsistent with place of service', missingDocs:'CMN, W-9, Prior Authorization', appealTeam:'Authorization & Billing Team', appealPath:'Submit corrected claim with CMN + prior auth within 120 days', urgency:'HIGH — timely filing window applies' },
    'CO-4':  { reason:'Service inconsistent with covered benefit', missingDocs:'Medical necessity letter, Physician order', appealTeam:'Clinical Appeals Team', appealPath:'Submit medical necessity letter from ordering physician', urgency:'MEDIUM — 90-day appeal window' },
    'CO-16': { reason:'Claim lacks required information', missingDocs:'Missing modifier, NPI/taxonomy correction', appealTeam:'Billing Corrections Team', appealPath:'Correct and resubmit — no formal appeal needed', urgency:'LOW — correctable resubmission' },
    'CO-22': { reason:'Covered by another payer per COB', missingDocs:'COB form, Secondary payer EOB, Insurance verification', appealTeam:'COB/Eligibility Team', appealPath:'Verify payer order and resubmit with COB documentation', urgency:'MEDIUM' },
    'CO-97': { reason:'Bundled service included in another service', missingDocs:'Modifier 59 documentation, Operative report', appealTeam:'Coding & Compliance Team', appealPath:'Apply correct NCCI modifier and resubmit', urgency:'MEDIUM — coding correction required' },
    'PR-96': { reason:'Non-covered charge — patient responsibility', missingDocs:'ABN signed form, Patient consent', appealTeam:'Patient Financial Services', appealPath:'Verify ABN signature. Issue patient statement', urgency:'HIGH — patient liability risk' },
  };

  // Extract denial code from mission fields or anomaly text
  const codeMatch = (m.denialCode)
    || (m.anomalyType||'').match(/\b(CO-\d+|PR-\d+|OA-\d+|PI-\d+)\b/i)?.[1]
    || (m.anomalySummary||'').match(/\b(CO-\d+|PR-\d+|OA-\d+|PI-\d+)\b/i)?.[1];
  const denialCode = codeMatch ? codeMatch.toUpperCase() : null;
  const intel = denialCode ? (denialIntel[denialCode] || null) : null;

  const denialContext = intel
    ? `DENIAL CODE: ${denialCode}
DENIAL REASON: ${intel.reason}
MISSING DOCUMENTS: ${intel.missingDocs}
APPEAL TEAM: ${intel.appealTeam}
APPEAL PATH: ${intel.appealPath}
URGENCY: ${intel.urgency}`
    : `DENIAL REASON: ${(m.warRoomContext?.denialReason || m.anomalySummary || 'Not specified').slice(0, 200)}`;

  return `You are TSM Neural Core. Generate denial-code-aware mission steps for this insurance claim.

ANOMALY: ${m.anomalyType}
TARGET APP: ${m.targetApp}
PAYER: ${m.payer || m.warRoomContext?.payer || 'Unknown'}
CLAIM AMOUNT: ${m.claimAmount || 'Unknown'}
PATIENT: ${m.patientOrClient || 'Unknown'}

${denialContext}

Generate exactly 5 steps. Each step must include title, instruction, fieldHint.
${intel ? `Step 1 must address: ${intel.missingDocs}. Final step must escalate to Executive Portal.` : ''}
${denialCode ? `Mark urgent steps with [URGENT].` : ''}

Respond with ONLY this JSON:
{"steps":[{"title":"...","instruction":"...","fieldHint":"..."}]}`;
}

  // ── Utils ──────────────────────────────────────────────────────────────────
  function escHtml(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── Init ───────────────────────────────────────────────────────────────────
  function init() {
    // Don't auto-render on load — wait to be called
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY) render();
    });
    window.TSMMissionGuide = {
      refresh: render,
      show: () => { const p = document.getElementById(PANEL_ID); if(p) p.style.display='flex'; render(); },
      hide: () => { const p = document.getElementById(PANEL_ID); if(p) p.style.display='none'; },
      setMission: (m) => { saveMission(m); render(); },
      regenerate: (m) => regenerateSteps(m)
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

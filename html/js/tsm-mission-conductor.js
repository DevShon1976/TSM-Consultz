/**
 * TSM MISSION CONDUCTOR v2.0
 * Universal guided mission system for all TSM war rooms.
 * Extracted and generalized from Insurance War Room.
 *
 * Drop at: html/js/tsm-mission-conductor.js
 * Load with: <script src="/js/tsm-mission-conductor.js"></script>
 *
 * Replaces: tsm-cure-conductor.js
 *
 * Each war room must define (or it will auto-detect):
 *   window.TSM_VERTICAL = 'Construction' | 'Healthcare' | 'Legal' | 'FinOps' | 'Insurance' | 'BPO' | 'Real Estate'
 *   window.TSM_API_PATH = '/api/hc/query' (defaults to /api/hc/query)
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'tsm_active_mission';
  let _pendingMission = null;

  // ── Detect vertical from URL if not set ───────────────────────────────────
  function detectVertical() {
    if (window.TSM_VERTICAL) return window.TSM_VERTICAL;
    const path = window.location.pathname.toLowerCase();
    if (path.includes('construction')) return 'Construction';
    if (path.includes('healthcare') || path.includes('hc-')) return 'Healthcare';
    if (path.includes('legal')) return 'Legal';
    if (path.includes('finops')) return 'FinOps';
    if (path.includes('insurance')) return 'Insurance';
    if (path.includes('bpo')) return 'BPO';
    if (path.includes('reo') || path.includes('re-war')) return 'Real Estate';
    return 'TSM';
  }

  function apiPath() {
    return window.TSM_API_PATH || '/api/hc/query';
  }

  // ── Inject styles ──────────────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('tsm-mc-styles')) return;
    const s = document.createElement('style');
    s.id = 'tsm-mc-styles';
    s.textContent = `
      #tmg-mission-modal-overlay {
        display: none; position: fixed; inset: 0; z-index: 9999;
        background: rgba(0,0,0,0.75);
        align-items: center; justify-content: center;
        font-family: 'Share Tech Mono','JetBrains Mono','Courier New',monospace;
      }
      #tmg-mission-modal-overlay.active { display: flex; }
      #tmg-mission-modal {
        background: #080e08; border: 1px solid #00ff9d;
        border-radius: 4px; width: 660px; max-width: 95vw;
        max-height: 88vh; display: flex; flex-direction: column;
        box-shadow: 0 0 48px rgba(0,255,157,0.12);
      }
      .tmg-modal-header {
        display: flex; align-items: flex-start; justify-content: space-between;
        padding: 16px 18px 14px; border-bottom: 1px solid #0d1f0d;
      }
      .tmg-modal-header-title {
        color: #00ff9d; font-size: 13px; letter-spacing: 0.12em; text-transform: uppercase;
      }
      .tmg-modal-header-sub {
        color: #3a5a3a; font-size: 10px; letter-spacing: 0.08em;
        text-transform: uppercase; margin-top: 4px;
      }
      .tmg-modal-close {
        background: none; border: 1px solid #1a2e1a; color: #3a5a3a;
        font-family: inherit; font-size: 11px; padding: 4px 10px;
        cursor: pointer; border-radius: 2px; letter-spacing: 0.06em;
      }
      .tmg-modal-close:hover { border-color: #ff4444; color: #ff4444; }
      .tmg-modal-body {
        flex: 1; overflow-y: auto; padding: 18px;
      }
      .tmg-modal-generating {
        display: flex; flex-direction: column; align-items: center;
        justify-content: center; gap: 12px; padding: 40px 0; text-align: center;
      }
      .tmg-modal-gen-spinner {
        width: 28px; height: 28px; border: 2px solid #0d1f0d;
        border-top-color: #00ff9d; border-radius: 50%;
        animation: tmg-spin 0.8s linear infinite;
      }
      @keyframes tmg-spin { to { transform: rotate(360deg); } }
      .tmg-modal-gen-label {
        color: #00ff9d; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase;
      }
      .tmg-modal-gen-text {
        color: #3a6a3a; font-size: 11px; line-height: 1.7;
      }
      .tmg-modal-anomaly {
        background: rgba(0,255,157,0.03); border: 1px solid #0d2a0d;
        border-radius: 3px; padding: 12px 14px; margin-bottom: 14px;
      }
      .tmg-modal-anomaly-label {
        color: #2a4a2a; font-size: 9px; letter-spacing: 0.1em;
        text-transform: uppercase; margin-bottom: 4px;
      }
      .tmg-modal-anomaly-type {
        color: #00ff9d; font-size: 12px; letter-spacing: 0.06em; margin-bottom: 6px;
      }
      .tmg-modal-anomaly-details { color: #5a8a5a; font-size: 11px; line-height: 1.6; }
      .tmg-modal-app-row {
        display: flex; align-items: center; gap: 12px;
        background: rgba(0,255,157,0.04); border: 1px solid #0d2a0d;
        border-radius: 3px; padding: 10px 14px; margin-bottom: 14px;
      }
      .tmg-modal-app-star { color: #ffc400; font-size: 16px; }
      .tmg-modal-app-rank {
        color: #2a4a2a; font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase;
      }
      .tmg-modal-app-name { color: #00ff9d; font-size: 12px; letter-spacing: 0.06em; }
      .tmg-modal-steps-preview { }
      .tmg-modal-steps-label {
        color: #2a4a2a; font-size: 9px; letter-spacing: 0.1em;
        text-transform: uppercase; margin-bottom: 10px;
      }
      .tmg-modal-step-row {
        display: flex; gap: 12px; margin-bottom: 14px;
        padding-bottom: 14px; border-bottom: 1px solid #0a150a;
      }
      .tmg-modal-step-row:last-child { border-bottom: none; }
      .tmg-modal-step-num {
        flex-shrink: 0; width: 24px; height: 24px;
        border: 1px solid #1a3a1a; border-radius: 2px;
        display: flex; align-items: center; justify-content: center;
        color: #2a5a2a; font-size: 10px;
      }
      .tmg-modal-step-title {
        color: #00ff9d; font-size: 10px; letter-spacing: 0.08em;
        text-transform: uppercase; margin-bottom: 4px;
      }
      .tmg-modal-step-instruction { color: #5a8a5a; font-size: 11px; line-height: 1.6; margin-bottom: 4px; }
      .tmg-modal-step-hint {
        color: #00cc7a; font-size: 10px; letter-spacing: 0.04em;
        background: #0a1a0a; padding: 4px 8px; border-left: 2px solid #00ff9d;
      }
      .tmg-modal-footer {
        padding: 14px 18px; border-top: 1px solid #0d1f0d;
        display: flex; align-items: center; justify-content: flex-end; gap: 10px;
      }
      .tmg-modal-btn {
        font-family: inherit; font-size: 11px; padding: 8px 18px;
        cursor: pointer; border-radius: 2px; letter-spacing: 0.08em;
        text-transform: uppercase; border: 1px solid;
      }
      .tmg-modal-btn-secondary { background: none; border-color: #1a2e1a; color: #3a5a3a; }
      .tmg-modal-btn-secondary:hover { border-color: #ff4444; color: #ff4444; }
      .tmg-modal-btn-primary { background: #00ff9d; border-color: #00ff9d; color: #000; font-weight: bold; }
      .tmg-modal-btn-primary:hover { background: #00cc7a; border-color: #00cc7a; }
      .tmg-modal-btn-primary:disabled { background: #0d2a0d; border-color: #0d2a0d; color: #1a3a1a; cursor: not-allowed; }
      .tmg-card-launch-btn {
        display: block; width: 100%; margin-top: 8px;
        background: none; border: 1px solid #1a3a1a; color: #2a5a2a;
        font-family: inherit; font-size: 10px; padding: 6px 12px;
        cursor: pointer; letter-spacing: 0.08em; text-transform: uppercase;
        border-radius: 2px; transition: all 0.2s;
      }
      .tmg-card-launch-btn:hover { border-color: #00ff9d; color: #00ff9d; }
    `;
    document.head.appendChild(s);
  }

  // ── Inject modal HTML ──────────────────────────────────────────────────────
  function injectModal() {
    if (document.getElementById('tmg-mission-modal-overlay')) return;
    const div = document.createElement('div');
    div.id = 'tmg-mission-modal-overlay';
    div.innerHTML = `
      <div id="tmg-mission-modal">
        <div class="tmg-modal-header">
          <div>
            <div class="tmg-modal-header-title">⚡ Mission Briefing</div>
            <div class="tmg-modal-header-sub" id="tmg-modal-subtitle">Generating guided mission plan...</div>
          </div>
          <button class="tmg-modal-close" id="tmg-modal-close-btn">✕</button>
        </div>
        <div class="tmg-modal-body" id="tmg-modal-body">
          <div class="tmg-modal-generating">
            <div class="tmg-modal-gen-spinner"></div>
            <div class="tmg-modal-gen-label">TSM Neural Core</div>
            <div class="tmg-modal-gen-text">Analyzing document...<br>Generating step-by-step mission plan...</div>
          </div>
        </div>
        <div class="tmg-modal-footer" id="tmg-modal-footer" style="display:none">
          <button class="tmg-modal-btn tmg-modal-btn-secondary" id="tmg-modal-cancel-btn">Cancel</button>
          <button class="tmg-modal-btn tmg-modal-btn-primary" id="tmg-modal-launch-btn" disabled>
            Launch with Guide →
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(div);
  }

  // ── Gather context from war room DOM ──────────────────────────────────────
  function gatherWarRoomContext() {
    const ctx = { vertical: detectVertical() };

    const activeDocType = document.querySelector(
      '.doc-type-btn.active, .doc-type-btn.selected, .sample-btn.active, ' +
      '.type-btn.active, .guide-btn.active, .doc-btn.active, ' +
      '[data-doc-type].active, [data-type].active, button.active[data-type]'
    );
    ctx.documentType = activeDocType?.textContent?.trim()
      || document.querySelector('#selectedDocType, [id*="docType"]')?.textContent?.trim()
      || ctx.vertical + ' Document';

    const docTextArea = document.querySelector(
      'textarea[id*="doc"], textarea[id*="paste"], textarea[id*="text"], ' +
      'textarea[id*="input"], textarea[id*="claim"], textarea[id*="contract"], ' +
      'textarea[id*="legal"], textarea[id*="financial"], ' +
      'textarea[placeholder*="Paste"], textarea[placeholder*="Document"], ' +
      '#documentText, #pasteArea, #docText, #inputText, #sourceText, #docPaste'
    );
    ctx.documentText = docTextArea?.value?.trim()?.slice(0, 1200) || '';

    if (ctx.documentText) {
      const amtMatch = ctx.documentText.match(/(?:CLAIM|TOTAL|EXPOSURE|AMOUNT)[:\s]+(\$[\d,]+)/i)
        || ctx.documentText.match(/(\$[\d,]+)/);
      if (amtMatch) ctx.amount = amtMatch[1];

      const partyMatch = ctx.documentText.match(/(?:PATIENT|CLAIMANT|CLIENT|OWNER|CONTRACTOR|PARTY)[:\s]+([^\n]+)/i);
      if (partyMatch) ctx.party = partyMatch[1].trim();

      const statusMatch = ctx.documentText.match(/STATUS[:\s]+([^\n]+)/i);
      if (statusMatch) ctx.status = statusMatch[1].trim();

      const issueMatch = ctx.documentText.match(/(?:DENIAL|PRIMARY ISSUE|ISSUE|PROBLEM)[:\s]+([^\n]+)/i);
      if (issueMatch) ctx.issue = issueMatch[1].trim();
    }

    return ctx;
  }

  // ── Generate mission steps via TSM API ────────────────────────────────────
  async function generateMissionSteps(appName, appUrl, context) {
    const missionId = detectVertical().toUpperCase().replace(/\s/g,'') + '-' + Date.now().toString(36).toUpperCase();

    const systemPrompt = `You are TSM Neural Core, an expert ${context.vertical} operations AI.
You generate precise guided mission steps for staff to resolve issues using specific TSM apps.
Respond ONLY with valid JSON. No markdown, no explanation, no code fences.`;

    const userPrompt = `Generate a step-by-step guided mission for this ${context.vertical} issue resolution task.

TARGET APP: ${appName}
DOCUMENT TYPE: ${context.documentType || context.vertical + ' Document'}
DOCUMENT CONTEXT:
${context.documentText || 'No document loaded'}

DETECTED DETAILS:
Amount: ${context.amount || 'Unknown'}
Party: ${context.party || 'Unknown'}
Status: ${context.status || 'Unknown'}
Issue: ${context.issue || 'Not specified'}

Generate 5-7 actionable mission steps. Each must include:
- title: short action title (max 7 words)
- instruction: clear 1-2 sentence instruction of exactly what to do in the ${appName} app
- fieldHint: specific field names, exact values, or tab names to use (reference specific data from the document)

Also output:
- anomalyType: one-line label for what the issue is
- anomalySummary: 2-3 sentence summary of what happened and why this app was recommended

Respond with ONLY this JSON:
{
  "anomalyType": "...",
  "anomalySummary": "...",
  "steps": [
    { "title": "...", "instruction": "...", "fieldHint": "..." }
  ]
}`;

    const res = await fetch(apiPath(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system: systemPrompt, message: userPrompt })
    });

    if (!res.ok) throw new Error('API error: ' + res.status);

    const data = await res.json();
    const rawText = (data.response || data.content || data.result || '').replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(rawText);

    return {
      missionId,
      anomalyType: parsed.anomalyType || context.documentType || context.vertical + ' Issue',
      anomalySummary: parsed.anomalySummary || '',
      targetApp: appName,
      targetUrl: appUrl,
      steps: (parsed.steps || []).map((s, i) => ({
        id: 'step-' + i,
        title: s.title,
        instruction: s.instruction,
        fieldHint: s.fieldHint || '',
        status: i === 0 ? 'active' : 'pending'
      })),
      generatedAt: new Date().toISOString(),
      warRoomContext: context
    };
  }

  // ── Render modal mission ───────────────────────────────────────────────────
  function renderModalMission(m) {
    const body = document.getElementById('tmg-modal-body');
    body.innerHTML = `
      <div class="tmg-modal-anomaly">
        <div class="tmg-modal-anomaly-label">Issue Detected</div>
        <div class="tmg-modal-anomaly-type">${escHtml(m.anomalyType)}</div>
        <div class="tmg-modal-anomaly-details">${escHtml(m.anomalySummary)}</div>
      </div>
      <div class="tmg-modal-app-row">
        <div class="tmg-modal-app-star">★</div>
        <div class="tmg-modal-app-info">
          <div class="tmg-modal-app-rank">Recommended App</div>
          <div class="tmg-modal-app-name">${escHtml(m.targetApp)}</div>
        </div>
        <div style="color:#2a5a2a;font-size:9px">${m.steps?.length || 0} steps generated</div>
      </div>
      <div class="tmg-modal-steps-preview">
        <div class="tmg-modal-steps-label">Mission Steps Preview</div>
        ${(m.steps || []).map((s, i) => `
          <div class="tmg-modal-step-row">
            <div class="tmg-modal-step-num">${String(i+1).padStart(2,'0')}</div>
            <div class="tmg-modal-step-content">
              <div class="tmg-modal-step-title">${escHtml(s.title)}</div>
              <div class="tmg-modal-step-instruction">${escHtml(s.instruction)}</div>
              ${s.fieldHint ? `<div class="tmg-modal-step-hint">↳ ${escHtml(s.fieldHint)}</div>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // ── Open mission modal ─────────────────────────────────────────────────────
  function openMissionModal(appName, appUrl, rank, cardEl) {
    const overlay   = document.getElementById('tmg-mission-modal-overlay');
    const body      = document.getElementById('tmg-modal-body');
    const footer    = document.getElementById('tmg-modal-footer');
    const launchBtn = document.getElementById('tmg-modal-launch-btn');
    const subtitle  = document.getElementById('tmg-modal-subtitle');

    body.innerHTML = `
      <div class="tmg-modal-generating">
        <div class="tmg-modal-gen-spinner"></div>
        <div class="tmg-modal-gen-label">TSM Neural Core</div>
        <div class="tmg-modal-gen-text">Analyzing document...<br>Generating mission steps for <strong style="color:#00ff9d">${escHtml(appName)}</strong>...</div>
      </div>
    `;
    footer.style.display = 'none';
    launchBtn.disabled = true;
    subtitle.textContent = appName + ' · Generating plan...';
    overlay.classList.add('active');
    _pendingMission = null;

    const context = gatherWarRoomContext();

    generateMissionSteps(appName, appUrl, context)
      .then(mission => {
        _pendingMission = mission;
        renderModalMission(mission);
        footer.style.display = 'flex';
        launchBtn.disabled = false;
        subtitle.textContent = appName + ' · Mission ready — ' + (mission.steps?.length || 0) + ' steps';
      })
      .catch(err => {
        console.error('TSM Mission Conductor error:', err);
        body.innerHTML = `
          <div class="tmg-modal-generating">
            <div style="color:#ff6b6b;font-size:11px;text-align:center;margin-bottom:10px">⚠ Generation Failed</div>
            <div class="tmg-modal-gen-text" style="color:#3a6a3a">Could not connect to TSM Neural Core.<br>Check API key and retry.</div>
          </div>
        `;
        footer.style.display = 'flex';
        launchBtn.disabled = true;
      });
  }

  // ── Upgrade existing launch buttons ───────────────────────────────────────
  function upgradeRecommendationCards() {
    document.querySelectorAll('button, a').forEach(btn => {
      const text = (btn.textContent || '').toUpperCase();
      if (!text.includes('LAUNCH ') && !text.includes('OPEN ')) return;
      const container = btn.closest('.app-card, .app-row, .rec-card, [class*="app-card"], [class*="app-row"]');
      if (!container || container.dataset.tmgUpgraded) return;
      container.dataset.tmgUpgraded = '1';

      const appName = container.querySelector('[class*="app-name"]')?.textContent?.trim()
        || btn.textContent.replace(/LAUNCH|OPEN|→/gi, '').trim()
        || 'App';
      const appUrl = btn.getAttribute('href')
        || (btn.getAttribute('onclick') || '').match(/['"]([^'"]*\.html[^'"]*)['"]/)?.[1]
        || '';

      const guideBtn = document.createElement('button');
      guideBtn.className = 'tmg-card-launch-btn';
      guideBtn.textContent = '⚡ Launch with Mission Guide';
      guideBtn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        openMissionModal(appName, appUrl, '', container);
      });
      btn.insertAdjacentElement('afterend', guideBtn);
    });
  }

  // ── Close modal ───────────────────────────────────────────────────────────
  function closeMissionModal() {
    document.getElementById('tmg-mission-modal-overlay')?.classList.remove('active');
    _pendingMission = null;
  }

  // ── Escape HTML ───────────────────────────────────────────────────────────
  function escHtml(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  window.TSMMissionConductor = {
    open: openMissionModal,
    close: closeMissionModal,
    upgrade: upgradeRecommendationCards
  };

  // Also wire TSMCureConductor alias so existing launchApp() calls still work
  window.TSMCureConductor = {
    launch: function(href, appMeta, context) {
      openMissionModal(appMeta?.name || 'App', href, '', null);
    },
    close: closeMissionModal
  };

  // ── Init on DOM ready ──────────────────────────────────────────────────────
  function init() {
    injectStyles();
    injectModal();

    document.getElementById('tmg-modal-close-btn')?.addEventListener('click', closeMissionModal);
    document.getElementById('tmg-modal-cancel-btn')?.addEventListener('click', closeMissionModal);
    document.getElementById('tmg-mission-modal-overlay')?.addEventListener('click', function(e) {
      if (e.target === this) closeMissionModal();
    });

    document.getElementById('tmg-modal-launch-btn')?.addEventListener('click', function() {
      if (!_pendingMission) return;
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(_pendingMission)); } catch(e) {}
      closeMissionModal();
      if (_pendingMission.targetUrl) {
        window.open(_pendingMission.targetUrl, '_blank');
      }
    });

    setTimeout(upgradeRecommendationCards, 800);
    document.addEventListener('warRoomAnalysisComplete', upgradeRecommendationCards);
    document.addEventListener('enginesComplete', upgradeRecommendationCards);

    const observer = new MutationObserver(upgradeRecommendationCards);
    const containers = document.querySelectorAll(
      '#appCardsList, #appCards, #appDispatch, .app-dispatch, [id*="dispatch"]'
    );
    containers.forEach(c => observer.observe(c, { childList: true, subtree: true }));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
/**
 * TSM Chain Assistant
 * Guides users through the 5-step HC chain:
 * Node Intake → Node BNCA → Relay to Strategist → Pack Analysis → Escalate to Exec
 */
(function () {
  if (window.__TSM_CHAIN_ASSISTANT__) return;
  window.__TSM_CHAIN_ASSISTANT__ = true;

  // ── CHAIN STATE ────────────────────────────────────────────
  const STORE_KEY = 'tsm_chain_state';

  const STEPS = [
    {
      id: 'intake',
      label: 'STEP 1 OF 5',
      title: 'Paste Patient Scenario',
      desc: 'New here? Take the guided tour first. Then paste a denial, claim, or patient scenario into the intake field.',
      page: 'node',
      trigger: 'manual',
      cta: 'Take the Tour →',
      ctaAction: () => {
        if (typeof window.tourOpen === 'function') window.tourOpen();
        else advance('bnca');
      },
    },
    {
      id: 'bnca',
      label: 'STEP 2 OF 5',
      title: 'Run Node BNCA',
      desc: 'Click <b>Run Node BNCA</b> or any AI analysis button on this node. Wait for the AI response to complete.',
      page: 'node',
      trigger: 'auto',
      watchFor: '.ai-res',
      cta: 'BNCA complete — relay now',
      ctaAction: () => {
        // Click the relay button if present, then advance
        const relayBtn = document.querySelector('[onclick*="relayToStrategist"], .frelay, [onclick*="RELAY TO STRATEGIST"]');
        if (relayBtn) {
          relayBtn.click();
        } else {
          advance('stratpack');
        }
      },
    },
    {
      id: 'relay',
      label: 'STEP 3 OF 5',
      title: 'Relay to Strategist',
      desc: 'Node data has been relayed. The HC Main Strategist is ready. Run a pack analysis to synthesize findings.',
      page: 'strategist',
      trigger: 'auto',
      cta: 'Run Pack Analysis',
      ctaAction: () => {
        const packBtn = document.querySelector('[onclick*="runPack"], .pack-btn');
        if (packBtn) packBtn.click();
        advance('escalate');
      },
    },
    {
      id: 'stratpack',
      label: 'STEP 4 OF 5',
      title: 'Run Strategist Pack Analysis',
      desc: 'Click <b>FULL STRATEGIC BRIEF</b> or any pack button to synthesize all node findings into an executive brief.',
      page: 'strategist',
      trigger: 'auto',
      watchFor: '#strat-out',
      cta: 'Analysis complete — escalate to exec',
      ctaAction: () => {
        const escalateBtn = document.querySelector('[onclick*="escalateToExecPortal"]');
        if (escalateBtn) escalateBtn.click();
        else advance('execbrief');
      },
    },
    {
      id: 'escalate',
      label: 'STEP 5 OF 5',
      title: 'Run Executive Briefing',
      desc: 'You\'re in the Executive Portal. All relay data has been loaded. Click <b>Run Executive Briefing</b> to generate the live BNCA brief for leadership.',
      page: 'exec',
      trigger: 'auto',
      cta: 'Run Executive Briefing',
      ctaAction: () => {
        if (typeof runExecutiveBriefing === 'function') runExecutiveBriefing();
        advance('complete');
      },
    },
    {
      id: 'complete',
      label: 'CHAIN COMPLETE',
      title: 'Executive Brief Ready',
      desc: 'The full HC chain has run. War room → node analysis → strategist synthesis → executive brief. Ready to present or export.',
      page: 'any',
      trigger: 'manual',
      cta: 'Start new chain',
      ctaAction: () => reset(),
    },
  ];

  // ── PAGE DETECTION ─────────────────────────────────────────
  function detectPage() {
    const path = location.pathname.toLowerCase();
    if (path.includes('executive-portal')) return 'exec';
    if (path.includes('main-strategist') || path.includes('hc-strategist')) return 'strategist';
    if (path.includes('hc-') || path.includes('healthcare')) return 'node';
    return 'unknown';
  }

  // ── STATE ──────────────────────────────────────────────────
  function getState() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); } catch(e) { return {}; }
  }

  function setState(obj) {
    localStorage.setItem(STORE_KEY, JSON.stringify({ ...getState(), ...obj }));
  }

  function getCurrentStep() {
    const state = getState();
    return STEPS.find(s => s.id === (state.stepId || 'intake')) || STEPS[0];
  }

  function advance(toId) {
    setState({ stepId: toId, ts: Date.now() });
    render();
  }

  function reset() {
    localStorage.removeItem(STORE_KEY);
    render();
  }

  // ── AUTO-DETECTION: watch for AI output ───────────────────
  function watchForOutput(selector, callback) {
    if (!selector) return;
    const el = document.querySelector(selector);
    if (!el) return;
    const observer = new MutationObserver(() => {
      const text = el.textContent.trim();
      if (text.length > 80 && !/loading|running|generating|processing/i.test(text)) {
        observer.disconnect();
        callback();
      }
    });
    observer.observe(el, { childList: true, subtree: true, characterData: true });
  }

  // ── RELAY DETECTION: did relay fire this page load? ───────
  function checkRelayOnLoad() {
    const page = detectPage();
    const step = getCurrentStep();

    // Arrived at strategist — means relay happened
    if (page === 'strategist' && ['intake','bnca','relay'].includes(step.id)) {
      advance('stratpack');
    }

    // Arrived at exec portal — means escalation happened
    if (page === 'exec' && ['intake','bnca','relay','stratpack','escalate'].includes(step.id)) {
      const relay = localStorage.getItem('TSM_EXEC_RELAY') || sessionStorage.getItem('TSM_EXEC_RELAY');
      if (relay) advance('escalate');
    }
  }

  // ── STYLES ─────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('tsm-ca-styles')) return;
    const s = document.createElement('style');
    s.id = 'tsm-ca-styles';
    s.textContent = `
      #tsm-chain-assistant {
        position: fixed;
        bottom: 0; left: 0; right: 0;
        z-index: 9999;
        background: #03080f;
        border-top: 1px solid rgba(0,255,198,.25);
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 10px 20px;
        font-family: 'JetBrains Mono', 'Space Mono', monospace;
        font-size: 11px;
        box-shadow: 0 -4px 24px rgba(0,255,198,.08);
        transition: transform .3s ease;
      }
      #tsm-chain-assistant.hidden {
        transform: translateY(100%);
      }
      #tsm-ca-progress {
        display: flex;
        gap: 6px;
        align-items: center;
        flex-shrink: 0;
      }
      .tsm-ca-dot {
        width: 8px; height: 8px;
        border-radius: 50%;
        background: rgba(255,255,255,.12);
        transition: background .3s;
      }
      .tsm-ca-dot.done { background: #00ffc6; }
      .tsm-ca-dot.active { background: #ffc400; box-shadow: 0 0 6px #ffc400; }
      #tsm-ca-label {
        font-size: 9px;
        letter-spacing: 2px;
        color: #ffc400;
        flex-shrink: 0;
        min-width: 80px;
      }
      #tsm-ca-title {
        font-weight: 700;
        color: #fff;
        flex-shrink: 0;
      }
      #tsm-ca-desc {
        color: #7a9ab8;
        flex: 1;
        font-size: 10px;
        line-height: 1.5;
      }
      #tsm-ca-cta {
        background: #00ffc6;
        color: #001;
        border: 0;
        border-radius: 6px;
        padding: 8px 16px;
        font-family: inherit;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 1px;
        cursor: pointer;
        flex-shrink: 0;
        white-space: nowrap;
        transition: opacity .2s;
      }
      #tsm-ca-cta:hover { opacity: .85; }
      #tsm-ca-cta.warn {
        background: #ffc400;
      }
      #tsm-ca-cta.complete {
        background: transparent;
        border: 1px solid rgba(0,255,198,.3);
        color: #00ffc6;
      }
      #tsm-ca-toggle {
        background: none;
        border: none;
        color: #2a4a5a;
        font-size: 14px;
        cursor: pointer;
        flex-shrink: 0;
        padding: 0 4px;
        font-family: inherit;
      }
      #tsm-ca-toggle:hover { color: #7a9ab8; }
      #tsm-ca-restart {
        background: none;
        border: 1px solid rgba(255,255,255,.08);
        color: #2a4a5a;
        font-size: 9px;
        letter-spacing: 1px;
        cursor: pointer;
        padding: 4px 8px;
        font-family: inherit;
        flex-shrink: 0;
      }
      #tsm-ca-restart:hover { color: #7a9ab8; border-color: rgba(255,255,255,.2); }
      body { padding-bottom: 52px !important; }
    `;
    document.head.appendChild(s);
  }

  // ── RENDER ─────────────────────────────────────────────────
  function render() {
    injectStyles();

    const step    = getCurrentStep();
    const page    = detectPage();
    const stepIdx = STEPS.findIndex(s => s.id === step.id);
    const isWrongPage = step.page !== 'any' && step.page !== page;

    let el = document.getElementById('tsm-chain-assistant');
    if (!el) {
      el = document.createElement('div');
      el.id = 'tsm-chain-assistant';
      document.body.appendChild(el);
    }

    // Progress dots
    const dots = STEPS.slice(0, -1).map((s, i) => {
      const cls = i < stepIdx ? 'done' : i === stepIdx ? 'active' : '';
      return `<div class="tsm-ca-dot ${cls}"></div>`;
    }).join('');

    // If on wrong page for this step — show navigation nudge
    let descHtml, ctaLabel, ctaCls;
    if (isWrongPage) {
      const pageNames = { node: 'an HC Node', strategist: 'HC Main Strategist', exec: 'HC Executive Portal' };
      descHtml = `Navigate to <b style="color:#00ffc6">${pageNames[step.page] || step.page}</b> to continue this step.`;
      ctaLabel = step.page === 'strategist' ? 'GO TO STRATEGIST →' : step.page === 'exec' ? 'GO TO EXEC PORTAL →' : 'GO TO HC NODE →';
      ctaCls = 'warn';
    } else {
      descHtml = step.desc;
      ctaLabel = step.cta;
      ctaCls = step.id === 'complete' ? 'complete' : '';
    }

    el.innerHTML = `
      <div id="tsm-ca-progress">${dots}</div>
      <div id="tsm-ca-label">${step.label}</div>
      <div id="tsm-ca-title">${step.title}</div>
      <div id="tsm-ca-desc">${descHtml}</div>
      <button id="tsm-ca-cta" class="${ctaCls}">${ctaLabel}</button>
      <button id="tsm-ca-restart" title="Restart chain">↺ RESTART</button>
      <button id="tsm-ca-toggle" title="Hide assistant">▼</button>
    `;

    // CTA click
    document.getElementById('tsm-ca-cta').onclick = () => {
      if (isWrongPage) {
        const urls = {
          strategist: '/html/healthcare/hc-main-strategist.html',
          exec: '/html/healthcare/executive-portal.html',
          node: '/html/healthcare/hc-medical/index.html',
        };
        if (urls[step.page]) window.location.href = urls[step.page];
      } else {
        step.ctaAction();
      }
    };

    // Restart
    document.getElementById('tsm-ca-restart').onclick = reset;

    // Toggle hide/show
    document.getElementById('tsm-ca-toggle').onclick = () => {
      const hidden = el.classList.toggle('hidden');
      document.getElementById('tsm-ca-toggle').textContent = hidden ? '▲' : '▼';
      setState({ hidden });
    };

    // Restore hidden state
    if (getState().hidden) {
      el.classList.add('hidden');
      document.getElementById('tsm-ca-toggle').textContent = '▲';
    }

    // Auto-watch for AI output if step has watchFor
    if (!isWrongPage && step.watchFor && step.trigger === 'auto') {
      watchForOutput(step.watchFor, () => {
        const nextId = step.id === 'bnca' ? 'relay' : step.id === 'stratpack' ? 'escalate' : null;
        if (nextId) advance(nextId);
      });
    }
  }

  // ── INIT ───────────────────────────────────────────────────
  function init() {
    checkRelayOnLoad();
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // Re-render on storage changes (cross-tab sync)
  window.addEventListener('storage', (e) => {
    if (e.key === STORE_KEY) render();
  });

})();

/**
 * TSM AUTO-PIPELINE ENGINE v2.0
 * Handles the full autonomous chain:
 *   Doc Search → War Room (auto-fire engines) → Strategist (auto-run brief) → Exec Portal
 *
 * Drop this script at the END of each war room, strategist, and exec portal page.
 * It reads TSM_AUTO_PIPELINE from session/localStorage, decides what phase it's on,
 * and drives the next step automatically when the AUTO-LAUNCH toggle is ON.
 *
 * Pipeline flag schema:
 * {
 *   active: true,
 *   vertical: 'hc' | 'finops' | 'ins' | 'con' | 'legal' | 're' | 'bpo',
 *   phase: 'war-room' | 'strategist' | 'exec-portal',
 *   fileName: string,
 *   docType: string,
 *   ts: number
 * }
 */

(function TSM_AUTO_PIPELINE_ENGINE() {

  // ─── CONFIG: per-vertical map of fire function, escalate function, strategist URL, exec URL ───
  const VERTICAL_CONFIG = {
    hc: {
      fireEngines:        () => typeof runPipeline === 'function' ? runPipeline() : (typeof fireAll === 'function' ? fireAll() : null),
      escalateToStrat:    () => typeof escalateToStrategist === 'function' && escalateToStrategist(),
      escalateToExec:     () => typeof escalateToExecPortal === 'function' && escalateToExecPortal(),
      stratUrl:           '/html/healthcare/hc-main-strategist.html',
      execUrl:            '/html/healthcare/executive-portal.html',
      relayKey:           'TSM_HC_WAR_RELAY',
      stratRelayKey:      'TSM_HC_STRAT_RELAY',
    },
    finops: {
      fireEngines:        () => typeof fireEngines === 'function' && fireEngines(),
      escalateToStrat:    () => typeof escalateToStrategist === 'function' && escalateToStrategist(),
      escalateToExec:     () => typeof escalateToExec === 'function' ? escalateToExec() : (window.location.href = '/html/finops-suite/finops-exec-portal.html'),
      stratUrl:           '/html/finops-suite/finops-main-strategist.html',
      execUrl:            '/html/finops-suite/finops-exec-portal.html',
      relayKey:           'tsm_finops_war_relay',
      stratRelayKey:      'tsm_finops_strat_relay',
    },
    ins: {
      fireEngines:        () => typeof fireEngines === 'function' && fireEngines(),
      escalateToStrat:    () => typeof escalateToStrategist === 'function' && escalateToStrategist(),
      escalateToExec:     () => typeof escalateToExec === 'function' ? escalateToExec() : (window.location.href = '/html/tsm-insurance/insurance-executive-portal.html'),
      stratUrl:           '/html/tsm-insurance/insurance-strategist.html',
      execUrl:            '/html/tsm-insurance/insurance-executive-portal.html',
      relayKey:           'TSM_INS_WAR_RELAY',
      stratRelayKey:      'TSM_INS_STRAT_RELAY',
    },
    con: {
      fireEngines:        () => typeof fireEngines === 'function' && fireEngines(),
      escalateToStrat:    () => typeof escalateToStrategist === 'function' && escalateToStrategist(),
      escalateToExec:     () => window.location.href = '/html/construction-suite/construction-executive-portal.html',
      stratUrl:           '/html/construction-suite/construction-strategist.html',
      execUrl:            '/html/construction-suite/construction-executive-portal.html',
      relayKey:           'TSM_CONSTRUCTION_WAR_RELAY',
      stratRelayKey:      'TSM_CONSTRUCTION_STRAT_RELAY',
    },
    legal: {
      fireEngines:        () => typeof fireEngines === 'function' && fireEngines(),
      escalateToStrat:    () => typeof escalateToChief === 'function' ? escalateToChief() : (typeof escalateToStrategist === 'function' && escalateToStrategist()),
      escalateToExec:     () => typeof writeExecRelay === 'function' ? (writeExecRelay(), window.location.href='/html/legal-pro/legal-executive-portal.html') : (window.location.href = '/html/legal-pro/legal-executive-portal.html'),
      stratUrl:           '/html/legal-pro/legal-main-strategist.html',
      execUrl:            '/html/legal-pro/legal-executive-portal.html',
      relayKey:           'TSM_LEGAL_WAR_RELAY',
      stratRelayKey:      'TSM_LEGAL_STRAT_RELAY',
    },
    re: {
      fireEngines:        () => typeof quickFire === 'function' ? quickFire('Cross-node synthesis: analyze deal risk, title issues, compliance exposure, and market position. Top 3 priority actions with dollar impact.') : null,
      escalateToStrat:    () => typeof escalateToStrategist === 'function' && escalateToStrategist(),
      escalateToExec:     () => typeof escalateToExec === 'function' ? escalateToExec() : (window.location.href = '/html/reo-pro/re-exec-portal.html'),
      stratUrl:           '/html/reo-pro/re-strategist.html',
      execUrl:            '/html/reo-pro/re-exec-portal.html',
      relayKey:           'TSM_RE_WAR_RELAY',
      stratRelayKey:      'tsm_re_strat_payload',
    },
    bpo: {
      fireEngines:        () => typeof fireExtractionEngine === 'function' && fireExtractionEngine(),
      escalateToStrat:    () => typeof routeToStrategist === 'function' ? routeToStrategist() : (window.location.href = '/html/bpo/bpo-strategist-v2.html'),
      escalateToExec:     () => typeof escalateToExec === 'function' ? escalateToExec() : (window.location.href = '/html/bpo/bpo-executive-portal.html'),
      stratUrl:           '/html/bpo/bpo-strategist-v2.html',
      execUrl:            '/html/bpo/bpo-executive-portal.html',
      relayKey:           'TSM_BPO_DOC',
      stratRelayKey:      'TSM_BPO_WAR_RELAY',
    },
  };

  // ─── Read pipeline flag ───
  function readFlag() {
    try {
      const raw = sessionStorage.getItem('TSM_AUTO_PIPELINE') || localStorage.getItem('TSM_AUTO_PIPELINE');
      if (!raw) return null;
      const flag = JSON.parse(raw);
      if (!flag.active) return null;
      if (Date.now() - flag.ts > 300000) return null; // 5 min TTL
      return flag;
    } catch(e) { return null; }
  }

  function writeFlag(flag) {
    const s = JSON.stringify(flag);
    try { sessionStorage.setItem('TSM_AUTO_PIPELINE', s); } catch(e){}
    try { localStorage.setItem('TSM_AUTO_PIPELINE', s); } catch(e){}
  }

  function clearFlag() {
    try { sessionStorage.removeItem('TSM_AUTO_PIPELINE'); } catch(e){}
    try { localStorage.removeItem('TSM_AUTO_PIPELINE'); } catch(e){}
  }

  // ─── Banner UI ───
  function showBanner(msg, color = '#00d4aa') {
    let banner = document.getElementById('tsm-autopipe-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'tsm-autopipe-banner';
      banner.style.cssText = `
        position:fixed;top:0;left:0;right:0;z-index:99999;
        background:#040c14;border-bottom:2px solid ${color};
        padding:8px 20px;font-family:'JetBrains Mono',monospace;
        font-size:10px;color:${color};letter-spacing:1px;
        display:flex;align-items:center;gap:12px;
      `;
      document.body.prepend(banner);
    }
    banner.style.borderColor = color;
    banner.style.color = color;
    banner.innerHTML = `<span style="animation:tsm-blink 1s infinite">⚡</span> TSM AUTO-PIPELINE — ${msg}
      <button onclick="document.getElementById('tsm-autopipe-banner').remove()" 
        style="margin-left:auto;background:none;border:none;color:inherit;cursor:pointer;font-size:12px">✕</button>`;
    if (!document.getElementById('tsm-blink-style')) {
      const s = document.createElement('style');
      s.id = 'tsm-blink-style';
      s.textContent = '@keyframes tsm-blink{0%,100%{opacity:1}50%{opacity:0.3}}';
      document.head.appendChild(s);
    }
  }

  // ─── Wait for a function to exist (for async script loading) ───
  function waitFor(fnName, timeout = 8000) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const check = () => {
        if (typeof window[fnName] === 'function') return resolve();
        if (Date.now() - start > timeout) return reject(new Error(`TSM AutoPipeline: ${fnName} not available`));
        setTimeout(check, 200);
      };
      check();
    });
  }

  // ─── Wait for engines to complete ───
  // Each war room sets a completion signal when all engines done.
  // We watch for the escalateBar to become visible OR enginesComplete to hit target count.
  function waitForEnginesComplete(vertical, timeout = 180000) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const check = () => {
        if (Date.now() - start > timeout) return reject(new Error('Engine timeout'));
        // Check escalateBar visible
        const bar = document.getElementById('escalateBar') || document.getElementById('escalateBottom');
        if (bar && (bar.classList.contains('visible') || bar.style.display === 'flex' || bar.style.display === 'block')) {
          return resolve('escalateBar');
        }
        // Check enginesComplete counter (varies per war room: 5, 6, or 12)
        const targets = { hc: 5, finops: 6, ins: 6, con: 6, legal: 6, re: 1, bpo: 1 };
        if (typeof window.enginesComplete === 'number' && window.enginesComplete >= (targets[vertical] || 1)) {
          return resolve('counter');
        }
        // RE/BPO: check for result text in output elements
        if (vertical === 're' || vertical === 'bpo') {
          const out = document.querySelector('.re-output, .bpo-output, #analysisOutput, #bpoOutput, .stream-out, .engine-out');
          if (out && out.textContent.trim().length > 100) return resolve('output');
        }
        setTimeout(check, 800);
      };
      check();
    });
  }

  // ─── Wait for strategist brief to complete ───
  function waitForStratComplete(timeout = 180000) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const check = () => {
        if (Date.now() - start > timeout) return reject(new Error('Strategist timeout'));
        // Look for escalate-to-exec bar, enabled escalate button, or substantial output
        const execBar = document.getElementById('escalateBar');
        if (execBar && (execBar.classList.contains('visible') || execBar.style.display === 'flex')) return resolve();
        const execBtn = document.querySelector('[onclick*="escalateToExec"], [onclick*="escalateToExecPortal"], #escalateBtn, #escalateBtnBar');
        if (execBtn && !execBtn.disabled) return resolve();
        // Fallback: look for output with substantial content
        const out = document.getElementById('strat-out') || document.getElementById('stratOut') || document.querySelector('.strat-output, .output-box, .context-box');
        if (out && out.textContent.trim().length > 200) return resolve();
        setTimeout(check, 1000);
      };
      check();
    });
  }

  // ─── Detect which page / phase we are on ───
  function detectPhase() {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('strategist') || path.includes('strat')) return 'strategist';
    if (path.includes('exec') || path.includes('portal') || path.includes('executive')) return 'exec-portal';
    return 'war-room';
  }

  // ─── Write relay key for next phase ───
  function advanceRelayFlag(flag, nextPhase) {
    writeFlag({ ...flag, phase: nextPhase, ts: Date.now() });
  }

  // ─── MAIN PIPELINE RUNNER ───
  async function runPipelinePhase() {
    const flag = readFlag();
    if (!flag) return;

    const currentPhase = detectPhase();
    if (flag.phase !== currentPhase) return; // not our turn

    const cfg = VERTICAL_CONFIG[flag.vertical];
    if (!cfg) { console.warn('[TSM AutoPipeline] Unknown vertical:', flag.vertical); return; }

    console.log(`[TSM AutoPipeline] Phase=${currentPhase} Vertical=${flag.vertical}`);

    if (currentPhase === 'war-room') {
      showBanner(`${flag.vertical.toUpperCase()} War Room — firing engines for ${flag.fileName || 'document'}...`, '#00d4aa');
      // Give the page 1.5s to fully hydrate, then fire engines
      await new Promise(r => setTimeout(r, 1500));
      try {
        cfg.fireEngines();
      } catch(e) {
        console.warn('[TSM AutoPipeline] fireEngines error:', e);
      }
      // Wait for engines to complete
      showBanner(`${flag.vertical.toUpperCase()} War Room — engines running...`, '#fbbf24');
      try {
        await waitForEnginesComplete(flag.vertical);
        showBanner(`${flag.vertical.toUpperCase()} War Room — analysis complete — routing to Strategist...`, '#00d4aa');
        await new Promise(r => setTimeout(r, 1500));
        advanceRelayFlag(flag, 'strategist');
        cfg.escalateToStrat();
      } catch(e) {
        showBanner(`Engine timeout — click ESCALATE TO STRATEGIST to continue`, '#f59e0b');
        console.warn('[TSM AutoPipeline] Engine wait error:', e);
      }

    } else if (currentPhase === 'strategist') {
      showBanner(`${flag.vertical.toUpperCase()} Strategist — generating brief...`, '#b56bff');
      await new Promise(r => setTimeout(r, 1500));
      // Trigger the strategist's primary analysis if it has an auto-fire
      const autoFireKey = `tsm_strat_autofire_${flag.vertical}`;
      if (!sessionStorage.getItem(autoFireKey)) {
        sessionStorage.setItem(autoFireKey, '1');
        // Try to click the primary run button
        const runBtn = document.querySelector(
          '#runBtn, #fireBtn, .relay-btn.fire, [onclick*="runPack"], [onclick*="runBrief"], [onclick*="generateBrief"], [onclick*="runStrat"], [onclick*="runAll"]'
        );
        if (runBtn && !runBtn.disabled) {
          try { runBtn.click(); } catch(e){}
        }
      }
      showBanner(`${flag.vertical.toUpperCase()} Strategist — brief generating...`, '#fbbf24');
      try {
        await waitForStratComplete();
        showBanner(`${flag.vertical.toUpperCase()} Strategist — brief complete — routing to Executive Portal...`, '#b56bff');
        await new Promise(r => setTimeout(r, 2000));
        advanceRelayFlag(flag, 'exec-portal');
        cfg.escalateToExec();
      } catch(e) {
        showBanner(`Brief timeout — click ESCALATE TO EXEC PORTAL to continue`, '#f59e0b');
        console.warn('[TSM AutoPipeline] Strategist wait error:', e);
      }

    } else if (currentPhase === 'exec-portal') {
      showBanner(`${flag.vertical.toUpperCase()} Executive Portal — pipeline complete ✓`, '#22c55e');
      clearFlag();
      setTimeout(() => {
        const b = document.getElementById('tsm-autopipe-banner');
        if (b) b.style.opacity = '0';
        setTimeout(() => { if (b) b.remove(); }, 1000);
      }, 5000);
    }
  }

  // ─── BOOT: run after DOM is ready ───
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runPipelinePhase);
  } else {
    setTimeout(runPipelinePhase, 200);
  }

  // ─── PUBLIC: doc-search calls this to INITIATE the pipeline ───
  window.TSM_PIPELINE = {
    start: function(vertical, fileName, docType) {
      const flag = {
        active: true,
        vertical,
        phase: 'war-room',
        fileName: fileName || '',
        docType: docType || 'DOCUMENT',
        ts: Date.now()
      };
      writeFlag(flag);
    },
    clear: clearFlag,
    readFlag,
  };

})();

/**
 * TSM Healthcare Sector Analyzer v1.0
 * Sector plugin — bridges HC Denial War Room to Mission Engine.
 * Intercepts TSM_WAR_ROOM_BRIEF write, creates TSMMission, fires bus events.
 * Zero breakage — existing relay chain preserved end-to-end.
 * Load after: tsm-event-bus.js, tsm-state.js, tsm-mission-engine.js
 */
(function (global) {
  'use strict';

  const TAG = '[TSM-HC-Analyzer]';
  const RELAY_KEY = 'TSM_WAR_ROOM_BRIEF';
  const SECTOR = 'healthcare';

  // ── Wait for dependencies ─────────────────────────────────────────────────
  function ready(fn) {
    if (global.TSMEventBus && global.TSMState && global.TSMMission) { fn(); return; }
    let tries = 0;
    const t = setInterval(() => {
      if (global.TSMEventBus && global.TSMState && global.TSMMission) { clearInterval(t); fn(); }
      if (++tries > 40) { clearInterval(t); console.warn(TAG, 'deps timeout'); }
    }, 100);
  }

  // ── Parse engine outputs into typed findings ──────────────────────────────
  function parseFindings(engineOutputs) {
    const findings = [];
    const risks    = [];
    const actions  = [];

    Object.entries(engineOutputs || {}).forEach(([label, text]) => {
      if (!text) return;
      const lower = text.toLowerCase();

      // Extract dollar exposure
      const dollarMatch = text.match(/\$[\d,]+(?:\.\d+)?[KMB]?/g);
      const exposure = dollarMatch
        ? dollarMatch.reduce((max, s) => {
            const n = parseFloat(s.replace(/[$,KMB]/g, '')) *
              (s.includes('M') ? 1e6 : s.includes('K') ? 1e3 : 1);
            return n > max ? n : max;
          }, 0)
        : 0;

      findings.push({
        engine: label,
        summary: text.slice(0, 300),
        exposure,
        severity: exposure > 50000 ? 'critical' : exposure > 10000 ? 'high' : 'medium',
      });

      // Risk signals
      if (/denial|appeal|timely filing|CO-|PR-|claim|rejected/i.test(text)) {
        risks.push({ type: 'denial_risk', source: label, detail: text.slice(0, 150) });
      }

      // Action signals
      const actionMatch = text.match(/(?:recommend|action|next step|submit|appeal|file|contact)[^.]{0,120}\./gi);
      if (actionMatch) {
        actionMatch.slice(0, 2).forEach(a => actions.push({ action: a.trim(), source: label }));
      }
    });

    return { findings, risks, actions };
  }

  // ── Derive mission metadata from brief ───────────────────────────────────
  function deriveMeta(brief) {
    const allText = JSON.stringify(brief).toLowerCase();
    const totalExposure = (brief.engineOutputs
      ? Object.values(brief.engineOutputs).join(' ')
      : ''
    ).match(/\$[\d,]+(?:\.\d+)?[KMB]?/g)?.reduce((sum, s) => {
      const n = parseFloat(s.replace(/[$,KMB]/g, '')) *
        (s.includes('M') ? 1e6 : s.includes('K') ? 1e3 : 1);
      return sum + n;
    }, 0) || 0;

    return {
      exposure:   totalExposure,
      priority:   totalExposure > 100000 ? 'critical' : totalExposure > 25000 ? 'high' : 'medium',
      confidence: brief.engine06 ? 0.88 : 0.72,
      docType:    brief.documentMeta?.ingestType || 'HC_DENIAL',
      sessionId:  brief.sessionId || null,
      client:     'HonorHealth',
    };
  }

  // ── Core intercept ────────────────────────────────────────────────────────
  function install() {
    const _orig = localStorage.setItem.bind(localStorage);

    localStorage.setItem = function (key, value) {
      _orig(key, value);  // always write first — preserve existing chain

      if (key !== RELAY_KEY) return;

      try {
        const brief = JSON.parse(value);
        if (!brief || !brief.engineOutputs) return;

        const meta = deriveMeta(brief);
        const { findings, risks, actions } = parseFindings(brief.engineOutputs);

        // Create mission
        const mission = TSMMission.create({
          sector:     SECTOR,
          source:     'hc-denial-war-room',
          owner:      brief.documentMeta?.ingestType || 'HC_DENIAL',
          priority:   meta.priority,
          exposure:   meta.exposure,
          confidence: meta.confidence,
          meta: {
            sessionId:  meta.sessionId,
            client:     meta.client,
            docType:    meta.docType,
            engineCount: Object.keys(brief.engineOutputs).length,
          },
        });

        // Publish analysis — fires WARROOM_FINDINGS_READY + STRATEGIST_READY on bus
        mission.publishAnalysis({
          confidence:        meta.confidence,
          recommendedAction: actions[0]?.action || 'Review denial findings and initiate appeal',
          reasoning:         findings.slice(0, 3).map(f => f.summary),
          evidence:          findings.map(f => ({ source: f.engine, detail: f.summary, exposure: f.exposure })),
          governance:        { approvalRequired: meta.priority === 'critical', escalationPath: ['HC Strategist', 'Executive Portal'] },
          findings,
          risks,
          actions,
        });

        // Write missionId back so strategist can pick it up
        _orig('TSM_MISSION_ID', mission.id);

        console.log(TAG, 'Mission created', mission.id, '| exposure $' + meta.exposure.toLocaleString());
      } catch (e) {
        console.warn(TAG, 'parse error', e);
      }
    };

    console.log(TAG, 'installed — intercepting', RELAY_KEY);
  }

  // ── Strategist relay enrichment (run on strategist page) ─────────────────
  function enrichStrategistContext() {
    if (!global.TSMState || !global.TSMMission) return;
    const mission = global.TSMState.get('mission');
    if (!mission) return;

    // Inject mission context into the strategist context textarea if present
    const ctxEl = document.getElementById('strat-context');
    if (ctxEl && !ctxEl.value.includes('[MISSION ENGINE]')) {
      const prefix = `[MISSION ENGINE — ${mission.id}]\nPRIORITY: ${mission.priority?.toUpperCase()}\nEXPOSURE: $${(mission.exposure||0).toLocaleString()}\nCONFIDENCE: ${Math.round((mission.confidence||0)*100)}%\n\n`;
      ctxEl.value = prefix + ctxEl.value;
    }

    // Update mission when strategist output is written
    const _orig = localStorage.setItem.bind(localStorage);
    localStorage.setItem = function (key, value) {
      _orig(key, value);
      if (key === 'TSM_EXEC_RELAY') {
        try {
          const out = JSON.parse(value);
          mission.status = 'escalated';
          global.TSMState.update('strategist', { output: out, completedAt: Date.now() });
          global.TSMEventBus.emit(global.TSMEventBus.EVENTS.STRATEGIST_ESCALATED, { missionId: mission.id, output: out });
        } catch (e) {}
      }
    };
  }

  // ── Exec portal enrichment ────────────────────────────────────────────────
  function enrichExecPortal() {
    if (!global.TSMState) return;
    const mission = global.TSMState.get('mission');
    if (!mission) return;

    // Wire approve/reject to bus events
    const _origApprove = global.approveCase;
    const _origReject  = global.rejectCase;

    if (typeof _origApprove === 'function') {
      global.approveCase = function (...args) {
        _origApprove.apply(this, args);
        mission.complete('approved');
        global.TSMEventBus.emit(global.TSMEventBus.EVENTS.EXECUTIVE_APPROVED, { missionId: mission.id });
      };
    }
    if (typeof _origReject === 'function') {
      global.rejectCase = function (...args) {
        _origReject.apply(this, args);
        mission.fail('rejected');
        global.TSMEventBus.emit(global.TSMEventBus.EVENTS.EXECUTIVE_REJECTED, { missionId: mission.id });
      };
    }
  }

  // ── Auto-detect which page we're on ──────────────────────────────────────
  ready(function () {
    const path = global.location?.pathname || '';

    if (path.includes('hc-denial-war-room')) {
      install();
    } else if (path.includes('hc-main-strategist')) {
      enrichStrategistContext();
    } else if (path.includes('executive-portal')) {
      enrichExecPortal();
    } else {
      // Load on all HC pages — try install as fallback
      install();
    }

    global.TSMEventBus.emit(global.TSMEventBus.EVENTS.MISSION_CREATED, {
      sector: SECTOR, page: path
    });
  });

}(typeof window !== 'undefined' ? window : this));

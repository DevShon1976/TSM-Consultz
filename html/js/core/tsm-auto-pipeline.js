/**
 * TSM AUTO-PIPELINE v1.0
 * Central orchestration spine — all 7 verticals
 * Sits in html/js/core/tsm-auto-pipeline.js
 */

(function(global) {
  'use strict';

  const RELAY_REGISTRY = {
    healthcare:   { keys: ['TSM_HC_WAR_RELAY','tsm_hc_war_relay'],                      entryFn: 'runPipeline',    strategistPath: '/healthcare/hc-main-strategist/' },
    finops:       { keys: ['tsm_war_relay_finops-suite','TSM_FINOPS_WAR_RELAY'],         entryFn: 'generateReport', strategistPath: '/finops-suite/finops-main-strategist.html' },
    insurance:    { keys: ['TSM_INS_WAR_RELAY','tsm_ins_war_relay'],                     entryFn: 'runStrategist',  strategistPath: '/tsm-insurance/insurance-strategist.html' },
    construction: { keys: ['TSM_CONSTRUCTION_WAR_RELAY','tsm_construction_war_relay'],   entryFn: 'runBNCA',        strategistPath: '/construction-suite/construction-strategist.html' },
    legal:        { keys: ['TSM_LEGAL_WAR_RELAY','tsm_legal_war_relay'],                 entryFn: 'runSynthesis',   strategistPath: '/legal-pro/legal-main-strategist.html' },
    realestate:   { keys: ['TSM_RE_WAR_RELAY','tsm_re_war_relay'],                       entryFn: 'runStrategist',  strategistPath: '/reo-pro/re-strategist.html' },
    bpo:          { keys: ['TSM_BPO_WAR_RELAY','tsm_bpo_war_relay'],                     entryFn: 'runStrategist',  strategistPath: '/bpo/bpo-strategist-v2.html' },
  };

  const State = {
    enabled: true,
    currentVertical: null,
    relay: null,
    phase: 'IDLE',
  };

  function readRelay(keys) {
    for (const k of keys) {
      const v = sessionStorage.getItem(k) || localStorage.getItem(k);
      if (v) { try { return JSON.parse(v); } catch { return null; } }
    }
    return null;
  }

  function writeRelay(keys, payload) {
    const str = JSON.stringify(payload);
    for (const k of keys) {
      try { sessionStorage.setItem(k, str); localStorage.setItem(k, str); } catch {}
    }
  }

  function detectVertical() {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('healthcare') || path.includes('hc-'))   return 'healthcare';
    if (path.includes('finops'))                                return 'finops';
    if (path.includes('insurance'))                             return 'insurance';
    if (path.includes('construction'))                          return 'construction';
    if (path.includes('legal'))                                 return 'legal';
    if (path.includes('reo') || path.includes('re-'))          return 'realestate';
    if (path.includes('bpo'))                                   return 'bpo';
    return null;
  }

  function log(msg, level) {
    const prefix = '[TSM-PIPELINE]';
    if (level === 'error') console.error(prefix, msg);
    else if (level === 'warn') console.warn(prefix, msg);
    else console.log(prefix, msg);
    if (global.TSMEventBus && global.TSMEventBus.emit)
      global.TSMEventBus.emit('PIPELINE_LOG', { msg, level, ts: Date.now() });
  }

  function emit(event, payload) {
    if (global.TSMEventBus && global.TSMEventBus.emit)
      global.TSMEventBus.emit(event, { ...payload, ts: Date.now() });
  }

  function setPhase(phase) {
    State.phase = phase;
    emit('PIPELINE_PHASE_CHANGED', { phase, vertical: State.currentVertical });
    log('Phase → ' + phase);
  }

  async function runVerticalEntry(vertical, config) {
    setPhase('RUNNING');
    emit('WAR_ROOM_READY', { vertical, relay: State.relay });
    const fn = global[config.entryFn];
    if (typeof fn === 'function') {
      log('Calling ' + config.entryFn + '() for ' + vertical);
      try {
        await fn();
        setPhase('COMPLETE');
        emit('AI_ANALYSIS_COMPLETE', { vertical, relay: State.relay });
      } catch(e) {
        setPhase('ERROR');
        log(config.entryFn + '() threw: ' + e.message, 'error');
      }
    } else {
      log('Entry function ' + config.entryFn + ' not found on this page', 'warn');
      setPhase('IDLE');
    }
  }

  async function init() {
    if (localStorage.getItem('tsm_auto_mode') === 'off') { log('Auto-mode OFF'); return; }
    if (localStorage.getItem('TSM_AUTO_LAUNCH') === 'false') { log('TSM_AUTO_LAUNCH=false'); return; }

    const vertical = detectVertical();
    if (!vertical) { log('Vertical not detected'); return; }

    const config = RELAY_REGISTRY[vertical];
    State.currentVertical = vertical;

    const relay = readRelay(config.keys);
    if (!relay) {
      log('No relay for ' + vertical + ' — listening for storage event');
      window.addEventListener('storage', function onStorage(e) {
        if (config.keys.includes(e.key) && e.newValue) {
          window.removeEventListener('storage', onStorage);
          State.relay = JSON.parse(e.newValue);
          setPhase('RELAY_DETECTED');
          emit('DOCUMENT_IMPORTED', { vertical, relay: State.relay });
          setTimeout(() => runVerticalEntry(vertical, config), 800);
        }
      });
      return;
    }

    State.relay = relay;
    setPhase('RELAY_DETECTED');
    emit('DOCUMENT_IMPORTED', { vertical, relay: State.relay });
    setTimeout(() => runVerticalEntry(vertical, config), 1500);
  }

  global.TSMAutoPipeline = {
    init,
    getState:   () => ({ ...State }),
    getRegistry:() => ({ ...RELAY_REGISTRY }),
    readRelay:  (v) => { const c = RELAY_REGISTRY[v]; return c ? readRelay(c.keys) : null; },
    writeRelay: (v, p) => { const c = RELAY_REGISTRY[v]; if (c) writeRelay(c.keys, p); },
    enable:     () => { localStorage.setItem('TSM_AUTO_LAUNCH','true');  log('Pipeline ENABLED'); },
    disable:    () => { localStorage.setItem('TSM_AUTO_LAUNCH','false'); log('Pipeline DISABLED'); },
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else setTimeout(init, 100);

})(window);

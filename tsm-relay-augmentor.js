/**
 * tsm-relay-augmentor.js
 * ─────────────────────────────────────────────────────────────────
 * Intercepts every localStorage / sessionStorage setItem call for
 * known exec relay keys and injects `wip` and `explain` arrays
 * before the data reaches the exec portal.
 *
 * HOW IT WORKS
 *   • Monkey-patches both storage APIs before any page code runs
 *   • Parses the JSON, augments it if wip/explain absent, re-serializes
 *   • Uses only fields already present in each relay (summary, engines,
 *     exposure, confidence, chainStep, etc.) — no new data required
 *   • Idempotent: skips augmentation if wip already present
 *
 * LOAD ORDER: include before </body> in every producer file
 * (strategists, war rooms) — functions are called on user action,
 * not at page load, so end-of-body is early enough.
 * ─────────────────────────────────────────────────────────────────
 */
(function (global) {
  'use strict';

  /* All relay keys that feed exec portals across the 7 verticals */
  var RELAY_KEYS = [
    // Insurance
    'TSM_INS_STRAT_RELAY', 'tsm_ins_strat_relay',
    // Real Estate
    'TSM_RE_WAR_RELAY',
    // Legal
    'TSM_STRATEGIST_RELAY', 'TSM_WAR_ROOM_RELAY', 'TSM_LEGAL_WAR_RELAY',
    // FinOps
    'tsm_strategist_relay', 'tsm_war_relay_finops-suite',
    // Construction
    'TSM_CONSTRUCTION_STRATEGIST_RELAY', 'tsm_construction_war_relay',
    'tsm_construction_strategist_output', 'TSM_CONSTRUCTION_WAR_RELAY',
    // Healthcare
    'TSM_EXEC_RELAY', 'TSM_WAR_ROOM_BRIEF',
    // BPO
    'TSM_BPO_STRAT_RELAY'
  ];

  /* ── WIP builder ───────────────────────────────────────────────── */
  function buildWip(obj) {
    var step = (obj.chainStep || '').toLowerCase();

    /* Engine count: try several field shapes used across verticals */
    var engCount = obj.enginesCount || obj.enginesRun || 0;
    if (!engCount && obj.engines && typeof obj.engines === 'object') {
      engCount = Object.keys(obj.engines).length;
    }
    if (!engCount) engCount = 4; /* safe default */

    var done = { status: 'done' };
    var pending = { status: 'pending' };

    var isPostStrategist = step.indexOf('strategist') !== -1 || step === 'exec';
    var isWarRoom = step === 'war-room';

    return [
      Object.assign({ id: 'ingest',     label: 'Document Ingestion' },          done),
      Object.assign({ id: 'engines',    label: 'Engine Analysis (' + engCount + ' nodes)' }, done),
      Object.assign({ id: 'strategist', label: 'Strategist Synthesis' },
        isPostStrategist ? done : isWarRoom ? { status: 'active', detail: 'War room analysis complete — awaiting strategist.' } : pending),
      Object.assign({ id: 'exec',       label: 'Executive Review' },             pending)
    ];
  }

  /* ── Explain builder ───────────────────────────────────────────── */
  function buildExplain(obj) {
    var items = [];

    /* Gather confidence as a number */
    var conf = obj.confidence || obj.riskScore || 80;
    if (typeof conf === 'string') {
      var cm = conf.match(/(\d+)/);
      conf = cm ? parseInt(cm[1]) : 80;
    }
    conf = Math.min(100, Math.max(0, conf));

    var source = obj.source || obj.chainStep || obj.sector || 'Strategist Engine';

    /* ── 1. Financial exposure card (FinOps / Construction / Insurance) ── */
    if (obj.exposure || obj.riskScore) {
      var rationale = '';
      if (obj.riskScore)          rationale += 'Risk score: ' + obj.riskScore + '. ';
      if (obj.duplicatePayments)  rationale += 'Duplicate payments: ' + obj.duplicatePayments + '. ';
      if (obj.unapprovedVendors)  rationale += 'Unapproved vendors: ' + obj.unapprovedVendors + '. ';
      if (obj.exceptions)         rationale += 'Exception count: ' + obj.exceptions + '. ';
      if (obj.missingPO)          rationale += 'Missing PO: ' + obj.missingPO + '. ';

      /* Append first 200 chars of summary as supporting text */
      var summaryHead = (obj.summary || '').slice(0, 200).trim();
      if (summaryHead) rationale += summaryHead;

      items.push({
        id: 'financial-exposure',
        claim: 'Total exposure: ' + (obj.exposure || obj.riskScore),
        confidence: conf,
        severity: conf >= 85 ? 'high' : conf >= 65 ? 'med' : 'low',
        impact: obj.exposure || null,
        rationale: rationale || 'See strategist analysis for full breakdown.',
        sources: [source]
      });
    }

    /* ── 2. Extract action / recommendation lines from summary text ── */
    var text = obj.summary || obj.stratBrief || obj.brief || '';

    /* HC shape: engineOutputs + engine06.narrative */
    if (!text && obj.engine06 && obj.engine06.narrative) {
      text = obj.engine06.narrative;
    }
    if (!text && obj.engineOutputs && typeof obj.engineOutputs === 'object') {
      text = Object.keys(obj.engineOutputs).map(function (k) {
        return obj.engineOutputs[k];
      }).join('\n\n').slice(0, 4000);
    }

    if (text) {
      /* Match numbered/bulleted items and lines starting with action keywords */
      var actionRe = /(?:(?:\d+[\.\)]|[-•▸◆►])\s+|(?:RECOMMEND|ACTION ITEM|PRIORITY|APPEAL|ESCALATE|IMMEDIATE)[:\s]+)([A-Z][^\n]{20,150})/g;
      var match;
      var seen = {};
      while ((match = actionRe.exec(text)) !== null && items.length < 5) {
        var claim = match[1].replace(/\s+/g, ' ').trim().slice(0, 140);
        var dedup = claim.slice(0, 50);
        if (seen[dedup]) continue;
        seen[dedup] = true;

        /* Look for a dollar amount within ±120 chars of this match */
        var window = text.slice(Math.max(0, match.index - 60), match.index + 220);
        var dollarM = window.match(/\$[\d,]+(?:\s*[–\-]\s*\$[\d,]+)?/);

        /* Pull the surrounding sentence as rationale */
        var rationale = text.slice(match.index, match.index + 450).replace(/\n{2,}/g, '\n').trim();

        items.push({
          id: 'rec-' + (items.length + 1),
          claim: claim,
          confidence: conf,
          severity: items.length === 0 ? 'high' : items.length === 1 ? 'med' : 'low',
          impact: dollarM ? dollarM[0] : null,
          rationale: rationale || claim,
          sources: [source]
        });
      }

      /* Fallback: use the first substantive sentence of the summary */
      if (!items.length) {
        var fallback = text.replace(/\n+/g, ' ').trim().slice(0, 120);
        if (fallback.length > 20) {
          items.push({
            id: 'rec-summary',
            claim: fallback,
            confidence: conf,
            severity: 'med',
            rationale: text.slice(0, 500).trim(),
            sources: [source]
          });
        }
      }
    }

    /* ── 3. Defect flags (RE war room shape) ── */
    if (obj.defectFlags && Array.isArray(obj.defectFlags) && items.length < 5) {
      obj.defectFlags.slice(0, 2).forEach(function (flag, i) {
        var flagText = typeof flag === 'string' ? flag : (flag.text || flag.label || JSON.stringify(flag));
        items.push({
          id: 'defect-' + (i + 1),
          claim: flagText.slice(0, 140),
          confidence: conf,
          severity: i === 0 ? 'high' : 'med',
          rationale: 'Flagged during document analysis. ' + flagText,
          sources: [source]
        });
      });
    }

    return items;
  }

  /* ── Augment a parsed relay object in place ────────────────────── */
  function augment(obj) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
    if (!obj.wip || !obj.wip.length) {
      obj.wip = buildWip(obj);
    }
    if (!obj.explain || !obj.explain.length) {
      obj.explain = buildExplain(obj);
    }
    return obj;
  }

  /* ── Intercept wrapper ─────────────────────────────────────────── */
  function makeInterceptor(original) {
    return function (key, value) {
      if (RELAY_KEYS.indexOf(key) !== -1 && typeof value === 'string') {
        try {
          var obj = JSON.parse(value);
          var augmented = augment(obj);
          value = JSON.stringify(augmented);
        } catch (e) { /* leave value unchanged if JSON parse fails */ }
      }
      return original.call(this, key, value);
    };
  }

  /* ── Patch both storage APIs ───────────────────────────────────── */
  try {
    var _lsSet = global.localStorage.__proto__.setItem;
    var _ssSet = global.sessionStorage.__proto__.setItem;
    global.localStorage.__proto__.setItem  = makeInterceptor(_lsSet);
    global.sessionStorage.__proto__.setItem = makeInterceptor(_ssSet);
  } catch (e) {
    /* Older browsers or restricted contexts — patch instance directly */
    try {
      var lsOrig = global.localStorage.setItem.bind(global.localStorage);
      var ssOrig = global.sessionStorage.setItem.bind(global.sessionStorage);
      global.localStorage.setItem  = makeInterceptor(lsOrig);
      global.sessionStorage.setItem = makeInterceptor(ssOrig);
    } catch (e2) { /* storage not available */ }
  }

  /* Expose for debugging / manual testing in the console */
  global._tsmkAugmentor = { augment: augment, buildWip: buildWip, buildExplain: buildExplain };

})(window);
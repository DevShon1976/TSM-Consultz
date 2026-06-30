/**
 * TSM Exec Kit — PRODUCER helper
 * --------------------------------------------------------------------------
 * Include this in each *-strategist.html (or war-room.html) file, right
 * before the closing </body>, or anywhere before the existing relay
 * setItem() call runs. It does NOT touch your existing relay logic — call
 * it to build two extra fields, then merge them into your existing
 * `payload` object before you stringify it.
 *
 * ZERO RISK PATTERN — your existing code:
 *
 *   const payload = { ...your existing fields... };
 *   localStorage.setItem('YOUR_KEY', JSON.stringify(payload));
 *
 * becomes:
 *
 *   const payload = { ...your existing fields... };
 *   payload.wip     = TSMExecKitProducer.buildWip([...]);       // ADD
 *   payload.explain = TSMExecKitProducer.buildExplain([...]);   // ADD
 *   localStorage.setItem('YOUR_KEY', JSON.stringify(payload));  // unchanged
 *
 * Nothing else about the file changes. If TSMExecKitProducer fails to load
 * for any reason, both functions below no-op safely (return []), so your
 * existing relay write still succeeds exactly as before.
 * ========================================================================== */

(function (global) {
  'use strict';

  /**
   * buildWip(stageDefs)
   * stageDefs: array of { id, label, status, time?, detail? }
   * status: 'done' | 'active' | 'pending' | 'blocked'
   * Just validates/passes through — kept as a function so future versions
   * can add auto-timestamping or auto-status-inference without changing
   * call sites.
   */
  function buildWip(stageDefs) {
    if (!Array.isArray(stageDefs)) return [];
    return stageDefs.filter(function (s) { return s && s.id && s.label; });
  }

  /**
   * buildExplain(items)
   * items: array of { claim, confidence?, severity?, impact?, rationale, sources?, dataPoints? }
   * `rationale` is the field every portal except BPO was discarding —
   * pass through whatever reasoning text your strategist already generated
   * (e.g. the BNCA narrative, the engine summary, the regex-extracted
   * exposure explanation) instead of just the headline number.
   */
  function buildExplain(items) {
    if (!Array.isArray(items)) return [];
    return items
      .filter(function (it) { return it && it.claim && it.rationale; })
      .map(function (it) {
        return {
          id:         it.id || ('rec-' + Math.random().toString(36).slice(2, 8)),
          claim:      it.claim,
          confidence: it.confidence != null ? it.confidence : null,
          severity:   it.severity || 'med',
          impact:     it.impact || '',
          rationale:  it.rationale,
          sources:    it.sources || [],
          dataPoints: it.dataPoints || []
        };
      });
  }

  /**
   * extractRationaleFromSummary(text, opts)
   * Convenience for the regex-extraction pattern already used in several
   * strategist files (FinOps, Insurance). Pulls the sentence(s) around a
   * matched figure so the exec sees *why*, not just the number.
   *
   *   const r = TSMExecKitProducer.extractRationaleFromSummary(_txt, {
   *     label: 'Exposure',
   *     valueMatch: _expM,
   *     contextChars: 220
   *   });
   *   // r = { value: '$91,800', rationale: '...sentence containing it...' }
   */
  function extractRationaleFromSummary(text, opts) {
    opts = opts || {};
    if (!text || !opts.valueMatch) return null;
    var idx = text.indexOf(opts.valueMatch[0]);
    if (idx === -1) return { value: opts.valueMatch[1] || opts.valueMatch[0], rationale: '' };
    var span = opts.contextChars || 200;
    var start = Math.max(0, idx - span);
    var end   = Math.min(text.length, idx + opts.valueMatch[0].length + span);
    var snippet = text.slice(start, end).trim();
    // Trim to whole sentences where possible
    var firstCap = snippet.search(/[A-Z]/);
    if (firstCap > 0) snippet = snippet.slice(firstCap);
    return { value: opts.valueMatch[1] || opts.valueMatch[0], rationale: snippet };
  }

  global.TSMExecKitProducer = {
    buildWip: buildWip,
    buildExplain: buildExplain,
    extractRationaleFromSummary: extractRationaleFromSummary
  };

})(window);
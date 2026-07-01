/**
 * TSM Foundation: AI Decision Engine v1.0
 * Client-side wrapper around POST /api/foundation/decision (server.js).
 * Standardizes the five decision modes every War Room needs so new phases
 * don't need a bespoke /api/{vertical}/query route -- just an SP[] prompt.
 *
 * Requires: `vertical` must be a key already registered in server.js's SP object
 * (o2c, crm, approval, cpq, catalog, mdm, ...).
 *
 * Usage:
 *   const engine = new TSMDecisionEngine('o2c');
 *   const result = await engine.rootCause({ kpis, sla_breaches, order_count });
 *   const alerts = await engine.predictiveAlerts(snapshot, 'Focus on top-3 accounts only');
 *
 * All methods return: { ok, vertical, mode, answer, createdAt } or throw on network failure.
 * Emits DECISION_REQUESTED / DECISION_RECEIVED / DECISION_FAILED on TSMBus.
 */

(function (global) {
  'use strict';

  function _bus() {
    return global.TSMBus || global.TSMEventBus || null;
  }

  class TSMDecisionEngine {
    constructor(vertical, opts = {}) {
      this.vertical = vertical;
      this.endpoint = opts.endpoint || '/api/foundation/decision';
      this.maxTokens = opts.maxTokens || 1200;
    }

    async _call(mode, snapshot, context) {
      const bus = _bus();
      if (bus && bus.emit) bus.emit('DECISION_REQUESTED', { vertical: this.vertical, mode });

      try {
        const res = await fetch(this.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vertical: this.vertical,
            mode,
            snapshot: snapshot || {},
            context: context || '',
            maxTokens: this.maxTokens
          })
        });

        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error || `HTTP ${res.status}`);

        if (bus && bus.emit) bus.emit('DECISION_RECEIVED', { vertical: this.vertical, mode, answer: data.answer });
        return data;
      } catch (e) {
        if (bus && bus.emit) bus.emit('DECISION_FAILED', { vertical: this.vertical, mode, error: e.message });
        throw e;
      }
    }

    /** Trace flagged breaches/anomalies back to their operational cause. */
    rootCause(snapshot, context)      { return this._call('root_cause', snapshot, context); }

    /** Scan the snapshot for deviations from expected norms, ranked by severity. */
    detectAnomalies(snapshot, context){ return this._call('anomaly', snapshot, context); }

    /** Get the single most important next action per at-risk item, prioritized. */
    recommend(snapshot, context)      { return this._call('recommendation', snapshot, context); }

    /** Quantify business impact (revenue/cost/SLA/risk) if flagged items go unaddressed. */
    impactAnalysis(snapshot, context) { return this._call('impact', snapshot, context); }

    /** Predict which currently-healthy items are likely to breach next. */
    predictiveAlerts(snapshot, context){ return this._call('predictive', snapshot, context); }
  }

  global.TSMDecisionEngine = TSMDecisionEngine;

  console.info('[TSMDecisionEngine] Foundation module v1.0 initialized.');

})(window);

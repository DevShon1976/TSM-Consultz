/**
 * TSM Foundation: Analytics Hub v1.0
 * Aggregation + trend utilities any War Room/Exec Portal can run over its own
 * record arrays (orders, leads, requests, quotes...) without writing bespoke
 * groupBy/reduce logic per vertical each time.
 *
 * Usage:
 *   TSMAnalyticsHub.groupBy(orders, 'stage');
 *   TSMAnalyticsHub.sum(orders, 'value');
 *   TSMAnalyticsHub.trend(snapshotHistory, 'sla_pct');   // [{ts,value}] -> {direction, deltaPct}
 *   TSMAnalyticsHub.drillDown(orders, { stage: 'shipping' });
 *   TSMAnalyticsHub.snapshot('o2c', { kpis, order_count }); // stores a timestamped snapshot for trend()
 */

(function (global) {
  'use strict';

  function groupBy(records, key) {
    const out = {};
    (records || []).forEach(r => {
      const k = typeof key === 'function' ? key(r) : r[key];
      (out[k] = out[k] || []).push(r);
    });
    return out;
  }

  function sum(records, key) {
    return (records || []).reduce((acc, r) => acc + (Number(r[key]) || 0), 0);
  }

  function avg(records, key) {
    if (!records || !records.length) return 0;
    return sum(records, key) / records.length;
  }

  function countBy(records, key) {
    const groups = groupBy(records, key);
    const out = {};
    Object.keys(groups).forEach(k => { out[k] = groups[k].length; });
    return out;
  }

  /** Filter records where every key in `criteria` matches (simple equality drill-down). */
  function drillDown(records, criteria = {}) {
    return (records || []).filter(r => Object.keys(criteria).every(k => r[k] === criteria[k]));
  }

  // ── Snapshot history for trend analysis ─────────────────────────────────
  const _history = {}; // vertical -> [{ts, data}]
  const HISTORY_MAX = 100;

  function snapshot(vertical, data) {
    if (!_history[vertical]) _history[vertical] = [];
    _history[vertical].push({ ts: Date.now(), data });
    if (_history[vertical].length > HISTORY_MAX) _history[vertical].shift();

    if (global.TSMState && typeof global.TSMState.set === 'function') {
      global.TSMState.set(`analytics_${vertical}`, _history[vertical]);
    }
  }

  function getHistory(vertical) {
    return (_history[vertical] || []).slice();
  }

  /** Compares the most recent two snapshots for a numeric field. Returns direction + % delta. */
  function trend(vertical, field) {
    const hist = _history[vertical] || [];
    if (hist.length < 2) return { direction: 'flat', deltaPct: 0, insufficient: true };
    const prev = Number(hist[hist.length - 2].data?.[field]) || 0;
    const curr = Number(hist[hist.length - 1].data?.[field]) || 0;
    const deltaPct = prev === 0 ? 0 : +(((curr - prev) / prev) * 100).toFixed(1);
    return { direction: curr > prev ? 'up' : curr < prev ? 'down' : 'flat', deltaPct, prev, curr };
  }

  global.TSMAnalyticsHub = { groupBy, sum, avg, countBy, drillDown, snapshot, getHistory, trend };

  console.info('[TSMAnalyticsHub] Foundation module v1.0 initialized.');

})(window);

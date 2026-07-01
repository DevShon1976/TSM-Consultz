/**
 * TSM Foundation: Universal KPI Cards v1.0
 * Reusable KPI card grid for every War Room (O2C, CRM, Approval, CPQ, Catalog,
 * MDM, and future phases). Renders into an existing `.kpi-grid` container using
 * the same `.kpi-card / .kpi-label / .kpi-value` classes already defined in
 * each war room's <style> block -- this is a drop-in, not a redesign.
 *
 * Supported KPI kinds (each gets sane default formatting + threshold coloring):
 *   revenue, cost, sla, utilization, risk, quality, csat, count, percent, custom
 *
 * Usage:
 *   TSMKpiCards.render('#kpi-grid', [
 *     { id: 'rev', kind: 'revenue', label: 'Open Order Value', value: 482300 },
 *     { id: 'sla', kind: 'sla', label: 'SLA Compliance', value: 91.2, target: 95 },
 *     { id: 'risk', kind: 'risk', label: 'At-Risk Orders', value: 7, warnAt: 3, badAt: 8 },
 *   ]);
 *
 *   TSMKpiCards.update('#kpi-grid', 'sla', { value: 88.4 }); // re-render one card in place
 *
 * A card definition:
 *   { id, kind, label, value, target?, warnAt?, badAt?, suffix?, prefix?, format? }
 *   - target: for sla/percent/quality/csat -- below target = warn, well below = bad
 *   - warnAt/badAt: for risk/count -- value >= warnAt = warn, >= badAt = bad
 *   - format: optional custom formatter fn(value) -> string, overrides `kind` default
 */

(function (global) {
  'use strict';

  function _bus() {
    return global.TSMBus || global.TSMEventBus || null;
  }

  // ── Formatters ────────────────────────────────────────────────────────────
  const FORMATTERS = {
    revenue:     v => '$' + Number(v || 0).toLocaleString('en-US', { maximumFractionDigits: 0 }),
    cost:        v => '$' + Number(v || 0).toLocaleString('en-US', { maximumFractionDigits: 0 }),
    sla:         v => Number(v || 0).toFixed(1) + '%',
    utilization: v => Number(v || 0).toFixed(1) + '%',
    quality:     v => Number(v || 0).toFixed(1) + '%',
    csat:        v => Number(v || 0).toFixed(1),
    percent:     v => Number(v || 0).toFixed(1) + '%',
    risk:        v => String(Number(v || 0)),
    count:       v => String(Number(v || 0)),
    custom:      v => String(v)
  };

  function _format(card) {
    if (typeof card.format === 'function') return card.format(card.value);
    const fmt = FORMATTERS[card.kind] || FORMATTERS.custom;
    const base = fmt(card.value);
    return (card.prefix || '') + base + (card.suffix || '');
  }

  // ── Severity classification ─────────────────────────────────────────────
  // Returns '' | 'warn' | 'bad' matching existing .kpi-value.warn/.bad CSS.
  function _severity(card) {
    const v = Number(card.value);
    if (Number.isNaN(v)) return '';

    // Target-based kinds: lower than target is worse (sla, utilization, quality, csat, percent)
    if (card.target != null && ['sla', 'utilization', 'quality', 'csat', 'percent'].includes(card.kind)) {
      const target = Number(card.target);
      if (v < target * 0.85) return 'bad';
      if (v < target) return 'warn';
      return '';
    }

    // Threshold-based kinds: higher than badAt/warnAt is worse (risk, count)
    if (card.badAt != null && v >= Number(card.badAt)) return 'bad';
    if (card.warnAt != null && v >= Number(card.warnAt)) return 'warn';

    return '';
  }

  function _cardHtml(card) {
    const sev = _severity(card);
    const valClass = 'kpi-value' + (sev ? ' ' + sev : '');
    return `<div class="kpi-card" data-kpi-id="${card.id}">
      <div class="kpi-label">${card.label}</div>
      <div class="${valClass}">${_format(card)}</div>
    </div>`;
  }

  // ── Public API ────────────────────────────────────────────────────────────
  const _registry = {}; // containerSelector -> card definitions array (by id)

  function render(containerSelector, cards) {
    const el = document.querySelector(containerSelector);
    if (!el) { console.warn('[TSMKpiCards] Container not found:', containerSelector); return; }

    _registry[containerSelector] = {};
    (cards || []).forEach(c => { _registry[containerSelector][c.id] = c; });

    el.innerHTML = (cards || []).map(_cardHtml).join('');

    const bus = _bus();
    if (bus && bus.emit) bus.emit('KPI_CARDS_RENDERED', { container: containerSelector, count: (cards || []).length });
  }

  /** Update one card's value in place (patches the definition, re-renders just that card). */
  function update(containerSelector, cardId, patch) {
    const reg = _registry[containerSelector];
    if (!reg || !reg[cardId]) { console.warn('[TSMKpiCards] Unknown card:', containerSelector, cardId); return; }

    Object.assign(reg[cardId], patch);

    const el = document.querySelector(containerSelector);
    if (!el) return;
    const cardEl = el.querySelector(`[data-kpi-id="${cardId}"]`);
    if (cardEl) cardEl.outerHTML = _cardHtml(reg[cardId]);

    const bus = _bus();
    if (bus && bus.emit) bus.emit('KPI_CARD_UPDATED', { container: containerSelector, id: cardId, card: reg[cardId] });
  }

  function get(containerSelector, cardId) {
    const reg = _registry[containerSelector];
    return reg ? reg[cardId] : null;
  }

  global.TSMKpiCards = { render, update, get, FORMATTERS };

  console.info('[TSMKpiCards] Foundation module v1.0 initialized.');

})(window);

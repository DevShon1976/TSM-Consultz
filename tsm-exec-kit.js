/**
 * TSM Exec Kit — shared WIP tracker + explainability panel
 * --------------------------------------------------------------------------
 * Drop this file + tsm-exec-kit.css into any of the 7 executive portals.
 * No dependencies, no build step. Works with the vanilla getElementById/
 * innerHTML pattern already used across the suite.
 *
 * USAGE
 * --------------------------------------------------------------------------
 *   <div id="wip-tracker"></div>
 *   <div id="explain-panel"></div>
 *   <script src="tsm-exec-kit.js"></script>
 *   <script>
 *     TSMExecKit.renderWIP('wip-tracker', stages, { compact: false });
 *     TSMExecKit.renderExplainability('explain-panel', items);
 *   </script>
 *
 * DATA CONTRACTS
 * --------------------------------------------------------------------------
 *  stage = {
 *    id:     string            (stable key, e.g. 'engines')
 *    label:  string            (e.g. "Engine Analysis (6/6)")
 *    status: 'done'|'active'|'pending'|'blocked'
 *    time:   string  (optional, e.g. "9:14 AM")
 *    detail: string  (optional, only shown for the active step,
 *                      e.g. "Drafting executive summary…")
 *  }
 *
 *  explainItem = {
 *    id:         string
 *    claim:      string         (the recommendation/decision, plain language)
 *    confidence: number 0-100
 *    severity:   'high'|'med'|'low'  (optional, colors the left border)
 *    impact:     string  (optional, e.g. "$82,400 recoverable")
 *    rationale:  string         (the actual "why" — required, this is the
 *                                 field every portal except BPO was missing)
 *    sources:    string[]       (optional, e.g. ["Engine 3 — Denials Analyst",
 *                                 "Payer Contract §4.2"])
 *    dataPoints: [{label, value}]  (optional supporting evidence chips)
 *  }
 * ========================================================================== */

(function (global) {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function chevronSvg() {
    return '<svg class="tsmk-exp-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">' +
           '<path d="M9 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  /* ---------------------------------------------------------------- */
  /* WIP TRACKER                                                       */
  /* ---------------------------------------------------------------- */

  /**
   * @param {string|HTMLElement} target  container id or element
   * @param {Array} stages
   * @param {Object} [opts]
   * @param {boolean} [opts.compact]
   * @param {string}  [opts.title]   default "Pipeline Status"
   * @param {string}  [opts.eta]     optional right-aligned text, e.g. "Updated 9:15 AM"
   */
  function renderWIP(target, stages, opts) {
    opts = opts || {};
    var el = typeof target === 'string' ? document.getElementById(target) : target;
    if (!el) return;

    if (!stages || !stages.length) {
      el.innerHTML = '<div class="tsmk-wip"><div class="tsmk-exp-empty">No pipeline data yet.</div></div>';
      return;
    }

    var activeStage = stages.find(function (s) { return s.status === 'active'; });

    var stepsHtml = stages.map(function (s) {
      var statusClass = 'is-' + (s.status || 'pending');
      var dotContent = s.status === 'done' ? '&#10003;'
                      : s.status === 'blocked' ? '!'
                      : s.status === 'active' ? '' : '';
      return (
        '<div class="tsmk-wip-step ' + statusClass + '">' +
          '<div class="tsmk-wip-dot">' + dotContent + '</div>' +
          '<div class="tsmk-wip-label">' + esc(s.label) + '</div>' +
          (s.time ? '<div class="tsmk-wip-time">' + esc(s.time) + '</div>' : '') +
        '</div>'
      );
    }).join('');

    var detailHtml = (activeStage && activeStage.detail)
      ? '<div class="tsmk-wip-detail"><span class="tsmk-spinner"></span>' + esc(activeStage.detail) + '</div>'
      : '';

    el.innerHTML =
      '<div class="tsmk-wip' + (opts.compact ? ' tsmk-compact' : '') + '">' +
        '<div class="tsmk-wip-head">' +
          '<div class="tsmk-wip-title">' + esc(opts.title || 'Pipeline Status') + '</div>' +
          (opts.eta ? '<div class="tsmk-wip-eta">' + esc(opts.eta) + '</div>' : '') +
        '</div>' +
        '<div class="tsmk-wip-track">' + stepsHtml + '</div>' +
        detailHtml +
      '</div>';
  }

  /* ---------------------------------------------------------------- */
  /* EXPLAINABILITY PANEL                                              */
  /* ---------------------------------------------------------------- */

  /**
   * @param {string|HTMLElement} target
   * @param {Array} items
   * @param {Object} [opts]
   * @param {boolean} [opts.openFirst]  expand the first card by default
   */
  function renderExplainability(target, items, opts) {
    opts = opts || {};
    var el = typeof target === 'string' ? document.getElementById(target) : target;
    if (!el) return;

    if (!items || !items.length) {
      el.innerHTML = '<div class="tsmk-explain"><div class="tsmk-exp-empty">No AI recommendations to explain yet.</div></div>';
      return;
    }

    var cardsHtml = items.map(function (item, idx) {
      var open = opts.openFirst && idx === 0;
      var conf = (item.confidence != null) ? Math.round(item.confidence) + '%' : null;

      var dataPointsHtml = (item.dataPoints && item.dataPoints.length)
        ? '<div class="tsmk-exp-data">' + item.dataPoints.map(function (dp) {
            return '<div class="tsmk-exp-datapoint"><div class="l">' + esc(dp.label) + '</div><div class="v">' + esc(dp.value) + '</div></div>';
          }).join('') + '</div>'
        : '';

      var sourcesHtml = (item.sources && item.sources.length)
        ? '<div class="tsmk-exp-sources">' + item.sources.map(function (src) {
            return '<span class="tsmk-exp-source-tag">' + esc(src) + '</span>';
          }).join('') + '</div>'
        : '';

      return (
        '<div class="tsmk-exp-card' + (open ? ' is-open' : '') + '" data-severity="' + esc(item.severity || '') + '" data-id="' + esc(item.id || '') + '">' +
          '<div class="tsmk-exp-row" data-toggle="' + esc(item.id || idx) + '">' +
            '<div>' +
              '<div class="tsmk-exp-claim">' + esc(item.claim) + '</div>' +
              (item.impact ? '<div class="tsmk-exp-impact">' + esc(item.impact) + '</div>' : '') +
            '</div>' +
            '<div class="tsmk-exp-meta">' +
              (conf ? '<span class="tsmk-conf-badge">' + conf + ' conf</span>' : '') +
              chevronSvg() +
            '</div>' +
          '</div>' +
          '<div class="tsmk-exp-body">' +
            '<div class="tsmk-exp-body-inner">' +
              '<div class="tsmk-exp-why-label">Why</div>' +
              '<div class="tsmk-exp-rationale">' + esc(item.rationale || 'No rationale provided — flag this recommendation for review.') + '</div>' +
              dataPointsHtml +
              sourcesHtml +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    el.innerHTML = '<div class="tsmk-explain">' + cardsHtml + '</div>';

    // wire up toggle behavior + auto-set max-height for the open/close transition
    var cards = el.querySelectorAll('.tsmk-exp-card');
    cards.forEach(function (card) {
      var body = card.querySelector('.tsmk-exp-body');
      var inner = card.querySelector('.tsmk-exp-body-inner');
      function sync() {
        body.style.maxHeight = card.classList.contains('is-open') ? (inner.scrollHeight + 4) + 'px' : '0px';
      }
      sync();
      card.querySelector('.tsmk-exp-row').addEventListener('click', function () {
        card.classList.toggle('is-open');
        sync();
      });
      // re-measure on window resize since text reflow changes height
      window.addEventListener('resize', sync);
    });
  }

  /* ---------------------------------------------------------------- */
  /* OPTIONAL: relay-aware convenience wiring                          */
  /* ---------------------------------------------------------------- */

  /**
   * Pulls { wip, explain } off a relay object already parsed from
   * localStorage (e.g. JSON.parse(localStorage.getItem('TSM_EXEC_RELAY'))).
   * Returns sensible empty defaults if the relay doesn't have them yet,
   * so portals can call this immediately without extra null-checks while
   * the data-producing side (war room / strategist) is updated to emit
   * `wip` and `explain` arrays in its relay payload.
   */
  function fromRelay(relayObj) {
    relayObj = relayObj || {};
    return {
      wip: Array.isArray(relayObj.wip) ? relayObj.wip : [],
      explain: Array.isArray(relayObj.explain) ? relayObj.explain : []
    };
  }

  global.TSMExecKit = {
    renderWIP: renderWIP,
    renderExplainability: renderExplainability,
    fromRelay: fromRelay
  };

})(window);
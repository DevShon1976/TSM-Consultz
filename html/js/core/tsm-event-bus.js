/**
 * TSM Event Bus v1.0
 * Canonical event registry and pub/sub system for all TSM Shell verticals.
 * Load order: this file FIRST, then tsm-state.js, then tsm-mission-engine.js
 */
(function (global) {
  'use strict';

  // ── Canonical event registry ──────────────────────────────────────────────
  const EVENTS = {
    // Document lifecycle
    DOCUMENT_UPLOADED:        'tsm:document:uploaded',
    DOCUMENT_CLASSIFIED:      'tsm:document:classified',
    DOCUMENT_ROUTED:          'tsm:document:routed',

    // Mission lifecycle
    MISSION_CREATED:          'tsm:mission:created',
    MISSION_UPDATED:          'tsm:mission:updated',
    MISSION_ESCALATED:        'tsm:mission:escalated',
    MISSION_COMPLETED:        'tsm:mission:completed',
    MISSION_FAILED:           'tsm:mission:failed',

    // War room
    WARROOM_ANALYSIS_START:   'tsm:warroom:analysis:start',
    WARROOM_ENGINE_COMPLETE:  'tsm:warroom:engine:complete',
    WARROOM_FINDINGS_READY:   'tsm:warroom:findings:ready',

    // Strategist
    STRATEGIST_READY:         'tsm:strategist:ready',
    STRATEGIST_SYNTHESIS_DONE:'tsm:strategist:synthesis:done',
    STRATEGIST_ESCALATED:     'tsm:strategist:escalated',

    // Executive
    EXECUTIVE_APPROVED:       'tsm:executive:approved',
    EXECUTIVE_REJECTED:       'tsm:executive:rejected',
    EXECUTIVE_DEFERRED:       'tsm:executive:deferred',

    // Execution
    EXECUTION_STARTED:        'tsm:execution:started',
    EXECUTION_COMPLETE:       'tsm:execution:complete',

    // BNCA
    BNCA_ESCALATED:           'tsm:bnca:escalated',
    BNCA_RESOLVED:            'tsm:bnca:resolved',

    // State
    STATE_UPDATED:            'tsm:state:updated',
  };

  // ── Internal listener store ───────────────────────────────────────────────
  const _listeners = {};   // eventName → [{fn, once}]
  const _history   = [];   // audit log, capped at 200
  const MAX_HISTORY = 200;

  // ── Core API ──────────────────────────────────────────────────────────────
  function on(event, fn) {
    if (typeof fn !== 'function') return;
    if (!_listeners[event]) _listeners[event] = [];
    _listeners[event].push({ fn, once: false });
  }

  function once(event, fn) {
    if (typeof fn !== 'function') return;
    if (!_listeners[event]) _listeners[event] = [];
    _listeners[event].push({ fn, once: true });
  }

  function off(event, fn) {
    if (!_listeners[event]) return;
    _listeners[event] = _listeners[event].filter(l => l.fn !== fn);
  }

  function emit(event, data) {
    const entry = { event, data, ts: Date.now() };
    _history.unshift(entry);
    if (_history.length > MAX_HISTORY) _history.pop();

    const list = _listeners[event] || [];
    const keep = [];
    list.forEach(l => {
      try { l.fn(data, entry); } catch (e) { console.error('[TSMEventBus]', event, e); }
      if (!l.once) keep.push(l);
    });
    _listeners[event] = keep;
  }

  function history(event) {
    return event
      ? _history.filter(e => e.event === event)
      : _history.slice();
  }

  function clear(event) {
    if (event) { delete _listeners[event]; }
    else { Object.keys(_listeners).forEach(k => delete _listeners[k]); }
  }

  // ── Public interface ──────────────────────────────────────────────────────
  global.TSMEventBus = {
    EVENTS,
    on,
    once,
    off,
    emit,
    history,
    clear,
  };

}(typeof window !== 'undefined' ? window : this));

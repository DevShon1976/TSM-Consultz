/* TSM tsm-state — stub loaded by CPQ and future war rooms */
window.TSMEventBus = window.TSMEventBus || {
  _handlers: {},
  on: function(evt, fn) { (this._handlers[evt] = this._handlers[evt] || []).push(fn); },
  emit: function(evt, data) { (this._handlers[evt] || []).forEach(fn => fn(data)); }
};

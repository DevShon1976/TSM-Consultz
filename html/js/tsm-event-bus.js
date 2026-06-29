// tsm-event-bus.js
class TSMEventBus {
  constructor() {
    this.channels = {};
  }

  on(event, handler) {
    if (!this.channels[event]) this.channels[event] = [];
    this.channels[event].push(handler);
  }

  emit(event, payload) {
    const handlers = this.channels[event] || [];
    handlers.forEach(fn => {
      try {
        fn(payload);
      } catch (err) {
        console.error("[EventBus Error]", event, err);
      }
    });
  }

  off(event, handler) {
    if (!this.channels[event]) return;
    this.channels[event] = this.channels[event].filter(h => h !== handler);
  }
}

window.TSMEventBus = new TSMEventBus();
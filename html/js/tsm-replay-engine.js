// tsm-replay-engine.js
class TSMReplayEngine {
  constructor() {
    this.key = "TSM_EVENT_LOG";
  }

  log(event) {
    const log = this.getLog();
    log.push({
      ...event,
      timestamp: Date.now()
    });

    localStorage.setItem(this.key, JSON.stringify(log));
  }

  getLog() {
    try {
      return JSON.parse(localStorage.getItem(this.key)) || [];
    } catch {
      return [];
    }
  }

  replay(store, bus) {
    const log = this.getLog();

    // reset store first
    store.state.missions = [];
    store.state.history = [];

    for (let event of log) {
      this.apply(event, store, bus);
    }

    store.save();
  }

  apply(event, store, bus) {
    switch (event.type) {

      case "MISSION_CREATED":
        window.TSMEventBus.emit("SIGNAL", event.payload);
        break;

      case "MISSION_UPDATED":
        store.window.TSMEventBus.emit("MISSION_UPDATE", event.payload.id, event.payload);
        break;

      case "EXECUTION_COMPLETE":
        store.window.TSMEventBus.emit("MISSION_UPDATE", event.payload.id, {
          status: "COMPLETE"
        });
        break;
    }

    bus.emit("REPLAY_EVENT_APPLIED", event);
  }
}

window.TSMReplayEngine = new TSMReplayEngine();
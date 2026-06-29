// tsm-orchestrator.js
class TSMOrchestrator {
  constructor() {
    this.bus = window.TSMEventBus;
    this.store = window.TSMMissionStore;
    this.router = window.TSMSectorRouter;
    this.engine = window.TSMMissionEngine;

    this.init();
  }

  init() {
    this.bus.on("SIGNAL", (signal) => this.handleSignal(signal));
  }

  handleSignal(signal) {
    // 1. Normalize
    const normalized = this.normalize(signal);

    // 2. Route sector
    normalized.sector = this.router.route(normalized);

    // 3. Score
    normalized.severity = this.score(normalized);

    // 4. Decide lifecycle
    this.decide(normalized);
  }

  normalize(signal) {
    return {
      type: signal.type || "UNKNOWN",
      payload: signal.payload || {},
      source: signal.source || "unknown",
      timestamp: Date.now()
    };
  }

  score(signal) {
    let score = 0;

    const text = signal.payload?.text || "";

    if (text.includes("urgent")) score += 30;
    if (text.includes("error")) score += 25;
    if (text.includes("denied")) score += 40;
    if (text.includes("failed")) score += 20;

    return Math.min(100, score);
  }

  decide(signal) {
    const s = signal.severity;

    // LOW → archive
    if (s < 40) {
      this.bus.emit("ARCHIVE", signal);
      return;
    }

    // MEDIUM → mission
    if (s >= 40 && s < 70) {
      window.TSMEventBus.emit("SIGNAL", signal);
      return;
    }

    // HIGH → BNCA required
    if (s >= 70) {
      this.bus.emit("BNCA_REQUIRED", signal);
      const mission = this.engine.createMission("SIGNAL", signal);

const bnca = window.TSMBNCAEngine.evaluate(mission);

mission.bnca = bnca;
mission.status = bnca.decision === "PASS"
  ? "APPROVED"
  : "BNCA_PENDING";

this.bus.emit("BNCA_RESULT", { mission, bnca });

if (bnca.action === "EXECUTE") {
  this.bus.emit("EXECUTE_MISSION", mission);
}
    }
  }

  processSignal(signal, requiresBNCA = false) {
    const mission = this.engine.createMission("SIGNAL", signal);

    mission.requiresBNCA = requiresBNCA;
    mission.status = requiresBNCA ? "BNCA_PENDING" : "MISSION_CREATED";


    this.bus.emit("MISSION_CREATED", mission);
  }
}

window.TSMOrchestrator = new TSMOrchestrator();
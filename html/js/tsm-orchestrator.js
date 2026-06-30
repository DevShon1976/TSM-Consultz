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
      this.bus.emit("MISSION_UPDATE", signal);
      return;
    }

    // HIGH → BNCA required
    if (s >= 70) {
      this.bus.emit("BNCA_REQUIRED", signal);
      const mission = this.engine.createMission(signal);

const bnca = window.TSMBNCAEngine.evaluate(mission);

mission.bnca = bnca;
mission.status = bnca.decision === "PASS"
  ? "COMPLETED"
  : "BNCA_PENDING";

this.bus.emit("BNCA_RESULT", { mission, bnca });

if (bnca.action === "EXECUTE") {
  this.bus.emit("EXECUTE_MISSION", mission);

    // AUTONOMY SAFE COMPLETION GATE
    if (mission?.status === "COMPLETED" || mission?.status === "COMPLETED") { this.bus.emit("COMPLETED", mission); }
}
    }
  }

  processSignal(signal, requiresBNCA = false) {
    const mission = this.engine.createMission(signal);

    mission.requiresBNCA = requiresBNCA;
    mission.status = requiresBNCA ? "BNCA_PENDING" : "MISSION_CREATED";


    this.bus.emit("MISSION_CREATED", mission);
  }
}

window.TSMOrchestrator = new TSMOrchestrator();
// AUTO-INJECTED SAFETY HOOK
if (this.bus && this.engine) {
  const originalDecide = TSMOrchestrator.prototype.decide;

  TSMOrchestrator.prototype.decide = function(signal) {
    const result = originalDecide.call(this, signal);

    try {
      if (result?.status === "COMPLETED" || result?.status === "COMPLETED") {
        this.bus.emit("COMPLETED", result);
      }
    } catch (e) {
      console.warn("MISSION_COMPLETE hook failed", e);
    }

    return result;
  };
}

// ===============================
// AUTONOMY COMPLETION HOOK (PATCH)
// ===============================
(function () {

  const bus = window.TSMEventBus;

  if (!bus) return;

  // wrap existing emit safely
  const originalEmit = bus.emit;

  bus.emit = function(event, payload) {

    // forward everything normally
    originalEmit.call(bus, event, payload);

    // REQUIRED AUTONOMY TRIGGER POINT
    if (event === "COMPLETED") {

      if (window.TSMAutonomyLayer?.trigger) {
        window.TSMAutonomyLayer.trigger({
          type: "AUTONOMY_WAKE",
          payload
        }, 1);
      }
    }
  };

})();


// ===============================

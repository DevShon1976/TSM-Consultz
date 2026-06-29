/**
 * TSM AUTONOMY LAYER v1
 * Controlled self-triggering mission system (bounded autonomy)
 */

(function () {
  "use strict";

  const bus = window.TSMEventBus;

  const STATE = {
    depth: 0,
    maxDepth: 2,
    cooldownMs: 3000,
    lastTrigger: 0,
    enabled: true
  };

  function canTrigger() {
    const now = Date.now();

    if (!STATE.enabled) return false;
    if (STATE.depth >= STATE.maxDepth) return false;
    if (now - STATE.lastTrigger < STATE.cooldownMs) return false;

    return true;
  }

  function evaluateMission(mission) {
    // Safe default if BNCA missing
    const bnca = window.TSMBNCAEngine?.evaluate?.(mission) || {
      decision: "PASS",
      action: "EXECUTE"
    };

    return bnca;
  }

  function shouldSpawnFollowUp(mission, bnca) {
    if (!mission) return false;

    // Blocked by governance
    if (bnca.decision === "BLOCK") return false;

    // Only high severity or failed missions self-trigger
    if (mission.severity >= 70) return true;
    if (mission.status === "FAILED") return true;

    return false;
  }

  function spawnFollowUp(mission) {
    if (!canTrigger()) return;

    STATE.depth++;
    STATE.lastTrigger = Date.now();

    const followUp = {
      type: "AUTONOMY_FOLLOW_UP",
      source: "TSM_AUTONOMY_LAYER",
      parentMissionId: mission.id,
      sector: mission.sector,
      severity: mission.severity,
      payload: {
        reason: "autonomous_follow_up",
        original: mission
      },
      timestamp: Date.now()
    };

    bus.emit("SIGNAL", followUp);

    setTimeout(() => {
      STATE.depth = Math.max(0, STATE.depth - 1);
    }, STATE.cooldownMs);
  }

  function onMissionComplete(mission) {
    const bnca = evaluateMission(mission);

    mission.bnca = bnca;

    if (shouldSpawnFollowUp(mission, bnca)) {
      spawnFollowUp(mission);
    }
  }

  function init() {
    // Hook into completion lifecycle
    bus.on("MISSION_COMPLETE", onMissionComplete);

    // Replay-aware wake-up system
    bus.on("MISSION_REPLAYED", (mission) => {
      if (mission?.status === "FAILED" || mission?.severity >= 80) {
        spawnFollowUp(mission);
      }
    });

    console.log("[TSM AUTONOMY LAYER] ACTIVE");
  }

  init();

  window.TSMAutonomyLayer = {
    enable: () => (STATE.enabled = true),
    disable: () => (STATE.enabled = false),
    state: STATE
  };
})();
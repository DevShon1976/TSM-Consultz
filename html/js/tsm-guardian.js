/**
 * TSM GUARDIAN v1.0
 * Runtime enforcement + mutation firewall
 * Blocks architecture violations in real time
 */

(function () {

  console.log("[GUARDIAN] Initializing runtime enforcement layer...");

  // ================================
  // 1. EVENT BUS ENFORCEMENT
  // ================================
  const bus = window.TSMEventBus;

  if (!bus) {
    console.error("[GUARDIAN] EventBus not found. System not ready.");
    return;
  }

  const originalEmit = bus.emit.bind(bus);

  bus.emit = function (event, payload) {

    // ONLY ALLOW SIGNAL PATHS
    const allowed = [
      "SIGNAL",
      "MISSION_UPDATE",
      "EXECUTE_MISSION",
      "BNCA_REQUIRED",
      "REPLAY_APPLIED"
    ];

    if (!allowed.includes(event)) {
      console.warn("[GUARDIAN BLOCKED EVENT]", event);
      return;
    }

    return originalEmit(event, payload);
  };

  // ================================
  // 2. STORE PROTECTION (NO DIRECT MUTATION)
  // ================================
  const store = window.TSMMissionStore;

  if (store) {
    const block = (methodName) => {
      const original = store[methodName]?.bind(store);

      store[methodName] = function (...args) {
        console.warn(`[GUARDIAN BLOCKED STORE ACCESS] ${methodName}`);
        console.warn("Use EventBus instead.");
        return;
      };
    };

    block("addMission");
    block("updateMission");
  }

  // ================================
  // 3. ORCHESTRATOR IMMUTABILITY CHECK
  // ================================
  const orch = window.TSMOrchestrator;

  if (orch) {
    const originalCreate = orch.createMission?.bind(orch);

    if (originalCreate) {
      orch.createMission = function () {
        console.warn("[GUARDIAN] Direct orchestrator mutation blocked");
        console.warn("Use SIGNAL → Orchestrator flow only");
        return;
      };
    }
  }

  // ================================
  // 4. WINDOW POLLUTION PROTECTION
  // ================================
  const forbiddenWrites = [
    "addMission",
    "updateMission",
    "createMission",
    "deleteMission"
  ];

  window.addEventListener("error", (e) => {
    console.warn("[GUARDIAN ERROR CAPTURED]", e.message);
  });

  // ================================
  // 5. SIGNAL SANITIZER
  // ================================
  const originalSignal = bus.emit.bind(bus);

  bus.emit = function (event, payload) {

    if (event === "SIGNAL") {
      if (!payload || typeof payload !== "object") {
        console.warn("[GUARDIAN] Invalid SIGNAL blocked");
        return;
      }

      if (!payload.type) {
        console.warn("[GUARDIAN] SIGNAL missing type");
        return;
      }
    }

    return originalSignal(event, payload);
  };

  // ================================
  // 6. GLOBAL GUARDIAN STATE
  // ================================
  window.TSM_GUARDIAN = {
    version: "1.0",
    status: "ACTIVE",
    mode: "ENFORCEMENT"
  };

  console.log("[GUARDIAN] Runtime enforcement ACTIVE");

})();
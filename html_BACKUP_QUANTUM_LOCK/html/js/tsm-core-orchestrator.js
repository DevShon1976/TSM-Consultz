window.TSMOrchestrator = (() => {

  const state = {
    activeSector: null,
    activeMission: null,
    activeMode: "live",
    history: []
  };

  // =========================
  // PUBLIC DISPATCH LAYER
  // =========================
  async function dispatch(event) {

    console.log("[ORCHESTRATOR]", event);

    if (window.TSMTelemetry) {
      TSMTelemetry.log({
        type: event.type,
        sector: event.sector || null,
        mission: event.payload?.mission || null
      });
    }

    switch (event.type) {

      case "MISSION_START":
        return await handleMissionStart(normalizeEvent(event));

      case "SECTOR_SWITCH":
        return handleSectorSwitch(event);

      default:
        console.warn("[TSM ORCHESTRATOR] Unknown event:", event);
        return {
          ok: false,
          error: "UNKNOWN_EVENT_TYPE",
          event
        };
    }
  }

  // =========================
  // MISSION HANDLER
  // =========================
  async function handleMissionStart(event) {

    const payload = event.payload;

    state.activeSector = event.sector;
    state.activeMission = payload.mission;
    state.activeMode = payload.mode || "live";

    state.history.push({
      type: "MISSION_START",
      sector: event.sector,
      mission: payload.mission,
      timestamp: payload.timestamp
    });

    const routeResult = await routeMission(payload);

    const explanation = window.TSMRoutingExplainer?.explainRoute({
      sector: event.sector,
      mission: payload.mission
    });

    state.lastExplanation = explanation;

    return {
      ok: true,
      route: routeResult.route,
      payload: routeResult.payload,
      explanation,
      state: getState()
    };
  }

  // =========================
  // ROUTING ENGINE
  // =========================
  async function routeMission(payload) {

    const sector = window.TSMSectorRegistry?.get(payload.sector);

    if (window.TSMTelemetry) {
      TSMTelemetry.log({
        type: "MISSION_ROUTE",
        sector: payload.sector,
        mission: payload.mission
      });
    }

    if (!sector) {
      return {
        route: "/tsm-industry-hub.html",
        payload
      };
    }

    return {
      route: sector.path,
      payload: {
        ...payload,
        tools: sector.tools,
        academy: sector.academy,
        mode: sector.mode
      }
    };
  }

  // =========================
  // SECTOR SWITCH
  // =========================
  function handleSectorSwitch(event) {

    state.activeSector = event.sector;

    if (window.TSMTelemetry) {
      TSMTelemetry.log({
        type: "SECTOR_SWITCH",
        sector: event.sector
      });
    }

    return {
      ok: true,
      activeSector: state.activeSector
    };
  }

  // =========================
  // EVENT NORMALIZER
  // =========================
  function normalizeEvent(event) {

    return {
      type: event.type,
      sector: event.sector || "unknown",
      payload: {
        mission: event.payload?.mission || "default-mission",
        mode: event.payload?.mode || "live",
        tools: event.payload?.tools || [],
        academy: event.payload?.academy || null,
        timestamp: Date.now()
      }
    };
  }

  // =========================
  // STATE ACCESS
  // =========================
  function getState() {
    return structuredClone(state);
  }

  return {
    dispatch,
    getState
  };

})();
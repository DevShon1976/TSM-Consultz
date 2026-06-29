window.TSMHub = {
  launch(config) {
    console.log("[HUB LAUNCH]", config);

    if (window.TSMTelemetry) {
      TSMTelemetry.log({
        type: "MISSION_LAUNCH",
        sector: config.sector,
        mission: config.mission
      });
    }

    return TSMOrchestrator.dispatch({
      type: "MISSION_START",
      sector: config.sector,
      payload: config
    }).then(result => {

      if (result?.route) {
        this.transition(result.route, result.payload);
      }

      return result;
    });
  },

  transition(route, payload) {
    console.log("[HUB ROUTE]", route);

    localStorage.setItem(
      "tsm_last_mission",
      JSON.stringify(payload)
    );

    window.location.href = route;
  },

  resumeLastMission() {
    const saved = localStorage.getItem("tsm_last_mission");
    if (!saved) return null;

    const mission = JSON.parse(saved);
    console.log("[HUB RESUME]", mission);
    return mission;
  }
};
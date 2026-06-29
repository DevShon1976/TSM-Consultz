// tsm-execution-bridge.js
class TSMExecutionBridge {
  constructor() {
    this.bus = window.TSMEventBus;

    this.bus.on("EXECUTE_MISSION", (mission) => {
      this.execute(mission);
    });
  }

  async execute(mission) {
    try {
      // placeholder: replace with real APIs later
      console.log("[EXECUTION START]", mission.id);

      await this.simulateWork();

      mission.status = "COMPLETE";
      window.TSMMissionStore.window.TSMEventBus.emit("MISSION_UPDATE", mission.id, mission);

      this.bus.emit("MISSION_COMPLETE", mission);
    } catch (err) {
      mission.status = "FAILED";
      window.TSMMissionStore.window.TSMEventBus.emit("MISSION_UPDATE", mission.id, mission);

      this.bus.emit("MISSION_FAILED", mission);
    }
  }

  simulateWork() {
    return new Promise(res => setTimeout(res, 1200));
  }
}

window.TSMExecutionBridge = new TSMExecutionBridge();
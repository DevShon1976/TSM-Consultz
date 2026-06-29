// tsm-mission-store.js
class TSMMissionStore {
  constructor() {
    this.key = "TSM_MISSION_STORE";
    this.state = this.load();
  }

  load() {
    try {
      return JSON.parse(localStorage.getItem(this.key)) || {
        missions: [],
        history: []
      };
    } catch {
      return { missions: [], history: [] };
    }
  }

  save() {
    localStorage.setItem(this.key, JSON.stringify(this.state));
  }

  addMission(mission) {
    this.state.missions.push(mission);
    this.state.history.push({
      type: "MISSION_CREATED",
      missionId: mission.id,
      timestamp: Date.now()
    });
    this.save();
  }

  updateMission(id, patch) {
    const m = this.state.missions.find(x => x.id === id);
    if (!m) return;
    Object.assign(m, patch);
    this.save();
  }

  getAll() {
    return this.state.missions;
  }

  getByStatus(status) {
    return this.state.missions.filter(m => m.status === status);
  }
}

window.TSMMissionStore = new TSMMissionStore();
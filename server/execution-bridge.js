// =====================================================
// TSM EXECUTION BRIDGE API (v1)
// Node.js / Express Runtime Layer
// =====================================================

const express = require("express");
const app = express();

app.use(express.json());

// =====================================================
// IN-MEMORY STORE (swap to Postgres later)
// =====================================================
const DB = {
  missions: new Map(),
  events: []
};

// =====================================================
// UTIL: event emitter
// =====================================================
function emit(type, payload) {
  const event = {
    id: "EVT-" + Date.now(),
    type,
    payload,
    ts: new Date().toISOString()
  };

  DB.events.push(event);
  return event;
}

// =====================================================
// CREATE MISSION (BNCA → EXECUTION ENTRY)
// =====================================================
app.post("/api/missions/create", (req, res) => {
  const mission = {
    id: "MSN-" + Date.now(),
    status: "queued",
    created_at: new Date().toISOString(),
    ...req.body
  };

  DB.missions.set(mission.id, mission);

  emit("MISSION_CREATED", mission);

  res.json({
    ok: true,
    mission
  });
});

// =====================================================
// GET ALL MISSIONS
// =====================================================
app.get("/api/missions", (req, res) => {
  res.json([...DB.missions.values()]);
});

// =====================================================
// GET SINGLE MISSION
// =====================================================
app.get("/api/missions/:id", (req, res) => {
  const mission = DB.missions.get(req.params.id);

  if (!mission) {
    return res.status(404).json({ error: "Mission not found" });
  }

  res.json(mission);
});

// =====================================================
// EXECUTE MISSION (CLOSED LOOP TRIGGER)
// =====================================================
app.post("/api/missions/:id/execute", (req, res) => {
  const mission = DB.missions.get(req.params.id);

  if (!mission) {
    return res.status(404).json({ error: "Mission not found" });
  }

  mission.status = "running";
  DB.missions.set(mission.id, mission);

  emit("MISSION_STARTED", mission);

  // simulate async execution pipeline
  setTimeout(() => {
    mission.status = "processing";
    DB.missions.set(mission.id, mission);
    emit("MISSION_PROCESSING", mission);
  }, 800);

  setTimeout(() => {
    mission.status = "complete";
    DB.missions.set(mission.id, mission);
    emit("MISSION_COMPLETE", mission);
  }, 2000);

  res.json({
    ok: true,
    message: "Execution started",
    mission
  });
});

// =====================================================
// EVENT STREAM (BNCA + STRATEGIST + EXECUTION)
// =====================================================
app.get("/api/events", (req, res) => {
  res.json(DB.events.slice(-100));
});

// =====================================================
// HEALTH CHECK
// =====================================================
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "TSM_EXECUTION_BRIDGE",
    missions: DB.missions.size,
    events: DB.events.length
  });
});

// =====================================================
// START SERVER
// =====================================================
const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log("TSM Execution Bridge running on port", PORT);
});
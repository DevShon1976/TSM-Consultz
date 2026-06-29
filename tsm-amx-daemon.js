/**
 * TSM AMX Daemon v2.0
 * Continuous Architecture Enforcement System
 * Watches repo → detects drift → auto-fixes → logs everything
 */

const fs = require("fs");
const path = require("path");

const WATCH_DIRS = ["./html", "./"];

const RULES = [
  {
    name: "FORBID_DIRECT_MISSION_CREATION",
    match: /createMission\s*\(/g,
    replace: `window.TSMEventBus.emit("SIGNAL", `
  },
  {
    name: "FORBID_STORE_MUTATION",
    match: /store\.addMission\s*\(/g,
    replace: `window.TSMEventBus.emit("SIGNAL", `
  },
  {
    name: "FORBID_DIRECT_UPDATE",
    match: /updateMission\s*\(/g,
    replace: `window.TSMEventBus.emit("MISSION_UPDATE", `
  }
];

const STATE = {
  scanCount: 0,
  fixes: 0,
  lastRun: Date.now()
};

const LOG_FILE = "./AMX_DAEMON_LOG.json";

// -----------------------------
// LOGGING
// -----------------------------
function log(entry) {
  let logs = [];
  try {
    logs = JSON.parse(fs.readFileSync(LOG_FILE, "utf8"));
  } catch {}

  logs.push({
    ...entry,
    timestamp: Date.now()
  });

  fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
}

// -----------------------------
// FILE PROCESSOR
// -----------------------------
function processFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  let original = content;

  RULES.forEach(rule => {
    if (rule.match.test(content)) {
      content = content.replace(rule.match, rule.replace);

      log({
        type: "AUTO_FIX",
        rule: rule.name,
        file: filePath
      });
    }
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content, "utf8");
    STATE.fixes++;
    console.log("[AUTO-FIXED]", filePath);
  }

  STATE.scanCount++;
}

// -----------------------------
// DIRECTORY WALKER
// -----------------------------
function walk(dir) {
  if (!fs.existsSync(dir)) return;

  const files = fs.readdirSync(dir);

  for (const f of files) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);

    if (stat.isDirectory()) {
      walk(full);
    } else if (f.endsWith(".js") || f.endsWith(".html")) {
      processFile(full);
    }
  }
}

// -----------------------------
// MAIN LOOP (DAEMON MODE)
// -----------------------------
function runScan() {
  console.log("====================================");
  console.log("[AMX-DAEMON] SCAN START");
  console.log("====================================");

  WATCH_DIRS.forEach(walk);

  console.log("====================================");
  console.log("[AMX-DAEMON] SCAN COMPLETE");
  console.log("FILES SCANNED:", STATE.scanCount);
  console.log("AUTO FIXES:", STATE.fixes);
  console.log("====================================");

  STATE.scanCount = 0;
}

// -----------------------------
// WATCH MODE (REAL DAEMON)
// -----------------------------
function startWatcher() {
  console.log("[AMX-DAEMON] WATCH MODE ACTIVE");

  WATCH_DIRS.forEach(dir => {
    fs.watch(dir, { recursive: true }, (eventType, filename) => {
      if (!filename) return;

      const full = path.join(dir, filename);

      if (!fs.existsSync(full)) return;

      if (full.endsWith(".js") || full.endsWith(".html")) {
        console.log("[CHANGE DETECTED]", full);

        try {
          processFile(full);
        } catch (e) {
          console.error("[AMX ERROR]", e);
        }
      }
    });
  });
}

// -----------------------------
// BOOT STRAP
// -----------------------------
function bootstrap() {
  console.log("====================================");
  console.log("TSM AMX DAEMON INITIALIZING");
  console.log("====================================");

  // initial full scan
  runScan();

  // enter watch mode
  startWatcher();
}

bootstrap();
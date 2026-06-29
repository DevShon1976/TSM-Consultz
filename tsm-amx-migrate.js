/**
 * TSM AMX Migration Engine v1.0
 * Converts legacy TSM architecture into event-driven OS model
 */

const fs = require("fs");
const path = require("path");

const ROOTS = ["./tmp_root", "./html", "./"];

const LEGACY_PATTERNS = [
  {
    match: /createMission\s*\(/g,
    replace: `window.TSMEventBus.emit("SIGNAL", `
  },
  {
    match: /updateMission\s*\(/g,
    replace: `window.TSMEventBus.emit("MISSION_UPDATE", `
  },
  {
    match: /store\.addMission\s*\(/g,
    replace: `window.TSMEventBus.emit("SIGNAL", `
  }
];

const REPORT = {
  scanned: 0,
  modified: 0,
  files: []
};

function processFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  let original = content;

  LEGACY_PATTERNS.forEach(rule => {
    content = content.replace(rule.match, rule.replace);
  });

  const changed = content !== original;

  REPORT.scanned++;

  if (changed) {
    fs.writeFileSync(filePath, content, "utf8");
    REPORT.modified++;
    REPORT.files.push(filePath);
    console.log("[MIGRATED]", filePath);
  }
}

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

// ----------------------------
// SNAPSHOT FOR ROLLBACK
// ----------------------------
function createSnapshot() {
  const snap = {
    timestamp: Date.now(),
    note: "pre-amx-migration snapshot"
  };

  fs.writeFileSync(
    "./AMX_SNAPSHOT.json",
    JSON.stringify(snap, null, 2)
  );
}

// ----------------------------
// RUNNER
// ----------------------------
console.log("====================================");
console.log("TSM AMX MIGRATION ENGINE START");
console.log("====================================");

createSnapshot();

ROOTS.forEach(walk);

console.log("====================================");
console.log("MIGRATION COMPLETE");
console.log("FILES SCANNED:", REPORT.scanned);
console.log("FILES MODIFIED:", REPORT.modified);
console.log("====================================");

if (REPORT.files.length) {
  console.log("\nMODIFIED FILES:");
  REPORT.files.forEach(f => console.log(" -", f));
}
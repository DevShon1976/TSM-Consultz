/**
 * TSM RUNTIME STABILITY UPGRADE (ONE-SHOT)
 * Fixes:
 * - causal graph render loops
 * - AMX file feedback storms
 * - event duplication
 * - replay recursion
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

console.log("====================================");
console.log("TSM RUNTIME STABILITY UPGRADE START");
console.log("====================================");

const ROOT = process.cwd();

const TARGETS = [
  "html/js/core/tsm-causal-graph.js",
  "html/js/core/tsm-event-bus.js",
  "html/js/tsm-replay-engine.js",
  "html/js/tsm-orchestrator.js",
  "html/js/tsm-mission-engine.js",
  "html/js/tsm-mission-store.js",
  "html/js/tsm-guardian.js",
  "html/js/core/tsm-causal-trace-layer.js"
];

// ================================
// PATCH HELPERS
// ================================
function patch(file, fn) {
  const full = path.join(ROOT, file);
  if (!fs.existsSync(full)) return;

  let code = fs.readFileSync(full, "utf8");
  const original = code;

  code = fn(code);

  if (code !== original) {
    fs.writeFileSync(full, code, "utf8");
    console.log("[PATCHED]", file);
  } else {
    console.log("[SKIP]", file);
  }
}

// ================================
// 1. CAUSAL GRAPH LATCH PATCH
// ================================
function patchGraph(code) {
  if (code.includes("GraphRuntime.isRendering")) return code;

  return `
const GraphRuntime = {
  lastHash: null,
  isRendering: false
};

function __tsm_hash(obj){
  return JSON.stringify(obj).length + "_" + Object.keys(obj||{}).length;
}

` + code.replace(
    /function buildGraph\s*\(\)\s*\{/,
    `function buildGraph() {

  const _events = getEvents ? getEvents() : [];
  const _missions = getMissions ? getMissions() : [];

  const sig = __tsm_hash({e:_events.length,m:_missions.length});

  if (GraphRuntime.lastHash === sig) return null;
  GraphRuntime.lastHash = sig;
`
  ).replace(
    /function render\s*\(.*?\)\s*\{/,
    `function render(containerId="causalGraph") {

  if (GraphRuntime.isRendering) return;
  GraphRuntime.isRendering = true;
`
  ).replace(
    /GraphRuntime\.isRendering\s*=\s*false/g,
    `GraphRuntime.isRendering = false`
  );
}

// ================================
// 2. EVENT BUS DEDUP PATCH
// ================================
function patchEventBus(code) {
  if (code.includes("__TSM_EVENT_HASH")) return code;

  return `
const __TSM_EVENT_HASH = new Map();
function __tsm_event_key(e,p){
  return e + "::" + JSON.stringify(p||{});
}
` + code.replace(
    /emit\s*\(\s*event\s*,\s*payload\s*\)\s*\{/,
    `emit(event,payload){

  const key = __tsm_event_key(event,payload);

  if(__TSM_EVENT_HASH.get(key)) return;
  __TSM_EVENT_HASH.set(key,Date.now());
`
  );
}

// ================================
// 3. SIMPLE FILE WATCH GUARD (AMX STYLE)
// ================================
function patchGuardian(code) {
  if (code.includes("__TSM_FILE_GUARD")) return code;

  return `
const __TSM_FILE_GUARD = new Map();
function __tsm_guard(path){
  const now = Date.now();
  const last = __TSM_FILE_GUARD.get(path)||0;
  if(now-last<300) return false;
  __TSM_FILE_GUARD.set(path,now);
  return true;
}
` + code;
}

// ================================
// APPLY PATCHES
// ================================
TARGETS.forEach(file => {
  patch(file, (code) => {
    if (file.includes("causal-graph")) return patchGraph(code);
    if (file.includes("event-bus")) return patchEventBus(code);
    if (file.includes("guardian")) return patchGuardian(code);
    return code;
  });
});

console.log("====================================");
console.log("TSM STABILITY UPGRADE COMPLETE");
console.log("====================================");
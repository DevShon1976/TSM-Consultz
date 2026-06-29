/**
 * TSM CAUSAL TRACE LAYER (CTL)
 * One-shot install for system-wide identity tracking
 * Fixes:
 * - AMX self-looping
 * - Guardian re-entry cycles
 * - duplicate event storms
 * - unknown mutation origin
 */

(function () {

  console.log("[CTL] Initializing causal trace layer...");

  // ================================
  // GLOBAL CAUSAL REGISTRY
  // ================================
  const CTL = {
    events: new Map(),
    fileHashes: new Map(),
    originMap: new Map()
  };

  // ================================
  // HASH UTILITY
  // ================================
  function hash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    }
    return h.toString();
  }

  // ================================
  // REGISTER ORIGIN
  // ================================
  function tagOrigin(path, origin) {
    CTL.originMap.set(path, origin);
  }

  function getOrigin(path) {
    return CTL.originMap.get(path) || "UNKNOWN";
  }

  // ================================
  // EVENT REGISTRATION (DEDUP CORE)
  // ================================
  function registerEvent(id, payload) {
    const h = hash(JSON.stringify(payload || {}));

    const existing = CTL.events.get(id);

    if (existing && existing.hash === h) {
      return false; // 🧠 suppress duplicate causal loop
    }

    CTL.events.set(id, {
      hash: h,
      payload,
      timestamp: Date.now()
    });

    return true;
  }

  // ================================
  // PATCH AMX LOOP (CRITICAL FIX)
  // ================================
  function wrapAMX(amx) {
    if (!amx || amx.__CTL_WRAPPED__) return;

    const original = amx.processFile?.bind(amx);

    if (!original) return;

    amx.processFile = function (filePath, origin = "UNKNOWN") {

      const currentOrigin = getOrigin(filePath);

      // 🧠 BLOCK SELF-INJECTION LOOPS
      if (currentOrigin === "AMX_PATCH" && origin === "AMX") {
        return;
      }

      tagOrigin(filePath, origin);

      return original(filePath, origin);
    };

    amx.__CTL_WRAPPED__ = true;
  }

  // ================================
  // PATCH EVENT BUS (GLOBAL DEDUP)
  // ================================
  function wrapEventBus(bus) {
    if (!bus || bus.__CTL_WRAPPED__) return;

    const originalEmit = bus.emit.bind(bus);

    bus.emit = function (event, payload) {

      const id = event + "::" + JSON.stringify(payload || {});

      if (!registerEvent(id, payload)) {
        return; // 🧠 suppress duplicate event storm
      }

      return originalEmit(event, {
        ...payload,
        __ctl: {
          origin: getOrigin(event),
          ts: Date.now()
        }
      });
    };

    bus.__CTL_WRAPPED__ = true;
  }

  // ================================
  // PATCH GUARDIAN (TRACE MUTATIONS)
  // ================================
  function wrapGuardian(guardian) {
    if (!guardian || guardian.__CTL_WRAPPED__) return;

    const originalBlock = guardian.block;

    if (!originalBlock) return;

    guardian.block = function (reason, context) {

      const id = "GUARDIAN::" + reason;

      registerEvent(id, context);

      return originalBlock(reason, {
        ...context,
        __ctl_origin: "GUARDIAN"
      });
    };

    guardian.__CTL_WRAPPED__ = true;
  }

  // ================================
  // REPLAY ENRICHMENT
  // ================================
  function wrapReplay(replay) {
    if (!replay || replay.__CTL_WRAPPED__) return;

    const originalLog = replay.log;

    if (!originalLog) return;

    replay.log = function (entry) {

      const enriched = {
        ...entry,
        __ctl_origin: entry.type || "UNKNOWN",
        __ctl_ts: Date.now()
      };

      return originalLog(enriched);
    };

    replay.__CTL_WRAPPED__ = true;
  }

  // ================================
  // SYSTEM BOOT STRAP
  // ================================
  function bootstrap() {

    wrapEventBus(window.TSMEventBus);
    wrapAMX(window.AMX_DAEMON);
    wrapGuardian(window.TSM_GUARDIAN);
    wrapReplay(window.TSMReplayEngine);

    window.TSM_CTL = {
      version: "1.0",
      status: "ACTIVE",
      getEvents: () => Array.from(CTL.events.values()),
      getOrigins: () => Array.from(CTL.originMap.entries())
    };

    console.log("[CTL] ACTIVE - Causal integrity enforced");
  }

  bootstrap();

})();
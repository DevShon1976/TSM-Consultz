/**
 * TSM_KERNEL v2 — Event-Driven Memory Layer
 * Drop-in replacement for any prior TSM_KERNEL or sessionStorage/localStorage relay pattern.
 * Safe to load before any war room page. Does NOT break existing UI during migration.
 *
 * Architecture:
 *   emit(event) → eventLog (immutable) + reduce(event) → projections (derived)
 *   UI reads: TSM_KERNEL.get(routeId)
 *   UI subscribes: TSM_KERNEL.subscribe(routeId, callback)
 *   Legacy shim: TSM_KERNEL.setDoc / TSM_KERNEL.getDoc / TSM_KERNEL.setRelay / TSM_KERNEL.getRelay
 */

(function (global) {
  "use strict";

  // ─── Constants ────────────────────────────────────────────────────────────

  const VERSION = "2.0.0";
  const MAX_LOG  = 5000; // rolling cap — prevents unbounded memory growth in long sessions

  // ─── Event Types Registry ─────────────────────────────────────────────────
  // Single source of truth for all event type strings across the platform.

  const EVENT_TYPES = {
    // Universal lifecycle
    ROUTE_ENTERED:            "ROUTE_ENTERED",
    ROUTE_EXITED:             "ROUTE_EXITED",
    SESSION_STARTED:          "SESSION_STARTED",
    SESSION_RESTORED:         "SESSION_RESTORED",

    // Document / intake
    DOC_LOADED:               "DOC_LOADED",
    DOC_CLEARED:              "DOC_CLEARED",
    DOC_CLASSIFIED:           "DOC_CLASSIFIED",
    DOC_ANOMALY_FLAGGED:      "DOC_ANOMALY_FLAGGED",

    // Analysis
    ANALYSIS_REQUESTED:       "ANALYSIS_REQUESTED",
    ANALYSIS_COMPLETED:       "ANALYSIS_COMPLETED",
    ANALYSIS_FAILED:          "ANALYSIS_FAILED",

    // Mission / strategy
    MISSION_CREATED:          "MISSION_CREATED",
    MISSION_UPDATED:          "MISSION_UPDATED",
    STRATEGIST_BRIEF_READY:   "STRATEGIST_BRIEF_READY",

    // Executive layer
    EXECUTIVE_BRIEF_GENERATED: "EXECUTIVE_BRIEF_GENERATED",
    HITL_DECISION_MADE:        "HITL_DECISION_MADE",
    HITL_ESCALATED:            "HITL_ESCALATED",

    // Cross-vertical collective
    SIGNAL_EMITTED:           "SIGNAL_EMITTED",
    KPI_UPDATED:              "KPI_UPDATED",
    ANOMALY_CORRELATED:       "ANOMALY_CORRELATED",

    // Legacy shim bridge
    STATE_WRITE:              "STATE_WRITE",
    RELAY_WRITE:              "RELAY_WRITE",
  };

  // ─── Vertical Route IDs ───────────────────────────────────────────────────

  const ROUTES = {
    HC:           "hc",
    FINOPS:       "finops",
    INSURANCE:    "insurance",
    LEGAL:        "legal",
    REAL_ESTATE:  "real_estate",
    CONSTRUCTION: "construction",
    BPO:          "bpo",
    MUSIC:        "music",
    COLLECTIVE:   "collective",
  };

  // ─── Kernel Core ──────────────────────────────────────────────────────────

  const TSM_KERNEL = {
    version:     VERSION,
    EVENT_TYPES: EVENT_TYPES,
    ROUTES:      ROUTES,

    // Source of truth — append-only
    eventLog: [],

    // Derived read layer — never write directly
    projections: {},

    // Subscription registry: routeId → [callback, ...]
    _subscribers: {},

    // Global event listeners: type → [callback, ...]
    _listeners: {},

    // ── Emit ────────────────────────────────────────────────────────────────

    emit(partialEvent) {
      const event = {
        eventId:       _uuid(),
        timestamp:     Date.now(),
        source:        partialEvent.source || "ui",
        correlationId: partialEvent.correlationId || null,
        ...partialEvent,
      };

      // Rolling cap
      if (this.eventLog.length >= MAX_LOG) {
        this.eventLog.shift();
      }
      this.eventLog.push(Object.freeze(event));

      this._reduce(event);
      this._notify(event);

      return event.eventId;
    },

    // ── Reduce → projections ─────────────────────────────────────────────

    _reduce(event) {
      const r = event.routeId;
      if (!r) return;

      if (!this.projections[r]) {
        this.projections[r] = {
          currentDoc:    null,
          docMeta:       null,
          lastEvent:     null,
          missionState:  null,
          strategistBrief: null,
          executiveBrief: null,
          anomalies:     [],
          hitlHistory:   [],
          kpis:          {},
          relay:         {},
          cache:         {},
        };
      }

      const p = this.projections[r];
      p.lastEvent = event;

      switch (event.type) {

        // ── Document ──────────────────────────────────────────────────────
        case EVENT_TYPES.DOC_LOADED:
          p.currentDoc = event.payload.docText  || null;
          p.docMeta    = event.payload.meta      || null;
          break;

        case EVENT_TYPES.DOC_CLEARED:
          p.currentDoc = null;
          p.docMeta    = null;
          break;

        case EVENT_TYPES.DOC_CLASSIFIED:
          p.docMeta = { ...(p.docMeta || {}), ...event.payload };
          break;

        case EVENT_TYPES.DOC_ANOMALY_FLAGGED:
          p.anomalies.push({
            timestamp: event.timestamp,
            flags:     event.payload.flags || [],
            severity:  event.payload.severity || "medium",
          });
          break;

        // ── Analysis ──────────────────────────────────────────────────────
        case EVENT_TYPES.ANALYSIS_COMPLETED:
          p.cache.lastAnalysis = event.payload;
          break;

        case EVENT_TYPES.ANALYSIS_FAILED:
          p.cache.lastError = event.payload;
          break;

        // ── Mission / Strategy ────────────────────────────────────────────
        case EVENT_TYPES.MISSION_CREATED:
        case EVENT_TYPES.MISSION_UPDATED:
          p.missionState = { ...(p.missionState || {}), ...event.payload };
          break;

        case EVENT_TYPES.STRATEGIST_BRIEF_READY:
          p.strategistBrief = event.payload;
          break;

        // ── Executive ─────────────────────────────────────────────────────
        case EVENT_TYPES.EXECUTIVE_BRIEF_GENERATED:
          p.executiveBrief = event.payload;
          break;

        case EVENT_TYPES.HITL_DECISION_MADE:
        case EVENT_TYPES.HITL_ESCALATED:
          p.hitlHistory.push({ timestamp: event.timestamp, ...event.payload });
          break;

        // ── Collective ────────────────────────────────────────────────────
        case EVENT_TYPES.KPI_UPDATED:
          p.kpis = { ...p.kpis, ...event.payload };
          break;

        case EVENT_TYPES.ANOMALY_CORRELATED:
          p.cache.correlatedAnomalies = event.payload;
          break;

        // ── Legacy shim ───────────────────────────────────────────────────
        case EVENT_TYPES.STATE_WRITE:
          Object.assign(p.cache, event.payload);
          break;

        case EVENT_TYPES.RELAY_WRITE:
          Object.assign(p.relay, event.payload);
          break;
      }
    },

    // ── Read ────────────────────────────────────────────────────────────────

    get(routeId) {
      return this.projections[routeId] || {};
    },

    getDoc(routeId) {
      return (this.projections[routeId] || {}).currentDoc || null;
    },

    getRelay(routeId, key) {
      const relay = (this.projections[routeId] || {}).relay || {};
      return key ? relay[key] : relay;
    },

    // ── Subscriptions ────────────────────────────────────────────────────────

    /**
     * Subscribe to all events for a specific routeId.
     * callback receives the full event object each time.
     * Returns an unsubscribe function.
     */
    subscribe(routeId, callback) {
      if (!this._subscribers[routeId]) this._subscribers[routeId] = [];
      this._subscribers[routeId].push(callback);
      return () => {
        this._subscribers[routeId] =
          this._subscribers[routeId].filter(fn => fn !== callback);
      };
    },

    /**
     * Listen to a specific event type globally (any routeId).
     * Returns an unsubscribe function.
     */
    on(eventType, callback) {
      if (!this._listeners[eventType]) this._listeners[eventType] = [];
      this._listeners[eventType].push(callback);
      return () => {
        this._listeners[eventType] =
          this._listeners[eventType].filter(fn => fn !== callback);
      };
    },

    _notify(event) {
      // Route-scoped subscribers
      const routeSubs = this._subscribers[event.routeId] || [];
      routeSubs.forEach(fn => _safeCall(fn, event));

      // Global type listeners
      const typeSubs = this._listeners[event.type] || [];
      typeSubs.forEach(fn => _safeCall(fn, event));

      // Wildcard listeners
      const wildcardSubs = this._listeners["*"] || [];
      wildcardSubs.forEach(fn => _safeCall(fn, event));
    },

    // ── Replay & Audit ────────────────────────────────────────────────────────

    /**
     * Returns the event log filtered by routeId and/or type.
     */
    history({ routeId, type, since } = {}) {
      return this.eventLog.filter(e => {
        if (routeId && e.routeId !== routeId) return false;
        if (type    && e.type    !== type)    return false;
        if (since   && e.timestamp < since)   return false;
        return true;
      });
    },

    /**
     * Replay the full event log into fresh projections (debug / restore).
     * Does NOT re-trigger subscribers.
     */
    replay() {
      this.projections = {};
      this.eventLog.forEach(e => this._reduce(e));
    },

    /**
     * Serialize event log for persistence (IndexedDB / server sync).
     */
    snapshot() {
      return JSON.stringify({
        version:  VERSION,
        exported: Date.now(),
        events:   this.eventLog,
      });
    },

    /**
     * Restore from a snapshot string. Replays events into projections.
     */
    restore(snapshotStr) {
      try {
        const { events } = JSON.parse(snapshotStr);
        this.eventLog = events.map(Object.freeze);
        this.replay();
        this.emit({
          type:    EVENT_TYPES.SESSION_RESTORED,
          routeId: ROUTES.COLLECTIVE,
          payload: { count: events.length },
        });
      } catch (e) {
        console.error("[TSM_KERNEL] restore failed:", e);
      }
    },

    // ── Legacy Shim ───────────────────────────────────────────────────────────
    // Keeps existing war room pages working without changes.
    // Gradually replace call sites with emit() as you migrate.

    setDoc(routeId, text, meta = {}) {
      this.emit({
        type:    EVENT_TYPES.DOC_LOADED,
        routeId,
        source:  "shim:setDoc",
        payload: { docText: text, meta },
      });
    },

    setRelay(routeId, keyOrObj, value) {
      const payload = typeof keyOrObj === "string"
        ? { [keyOrObj]: value }
        : keyOrObj;
      this.emit({
        type:    EVENT_TYPES.RELAY_WRITE,
        routeId,
        source:  "shim:setRelay",
        payload,
      });
    },

    // Passthrough alias for any code still calling setState(routeId, blob)
    setState(routeId, payload) {
      this.emit({
        type:    EVENT_TYPES.STATE_WRITE,
        routeId,
        source:  "shim:setState",
        payload,
      });
    },

    // ── Dev helpers ───────────────────────────────────────────────────────────

    dump(routeId) {
      if (routeId) {
        console.table(this.history({ routeId }));
        console.log("[TSM_KERNEL] projection:", this.get(routeId));
      } else {
        console.log("[TSM_KERNEL] full event log:", this.eventLog);
        console.log("[TSM_KERNEL] projections:", this.projections);
      }
    },
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────

  function _uuid() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  function _safeCall(fn, arg) {
    try { fn(arg); } catch (e) { console.error("[TSM_KERNEL] subscriber error:", e); }
  }

  // ─── Mount ────────────────────────────────────────────────────────────────

  global.TSM_KERNEL = TSM_KERNEL;

  // Announce boot
  TSM_KERNEL.emit({
    type:    EVENT_TYPES.SESSION_STARTED,
    routeId: ROUTES.COLLECTIVE,
    source:  "kernel:boot",
    payload: { version: VERSION, ts: Date.now() },
  });

  console.log(`[TSM_KERNEL v${VERSION}] Event-driven kernel mounted.`);

})(window);
/**
 * TSM State Store v1.0
 * Single source of truth for all TSM Shell state.
 * Replaces scattered localStorage calls across verticals.
 *
 * Usage:
 *   TSMState.get()                        // full state snapshot
 *   TSMState.get('mission')               // single slice
 *   TSMState.update('mission', { id: 1 }) // merge-update a slice
 *   TSMState.set('mission', { id: 1 })    // replace a slice
 *   TSMState.reset()                      // wipe to defaults
 *   TSMState.persist()                    // manual save to localStorage
 *   TSMState.hydrate()                    // load from localStorage
 *
 * Automatically emits TSMBus events on every state change
 * (requires tsm-event-bus.js loaded first).
 */

(function (global) {
  'use strict';

  const STORAGE_KEY = 'TSM_STATE_v1';

  // ── Default State Shape ───────────────────────────────────────────────────
  const DEFAULT_STATE = {
    // Active document being processed
    document: {
      id:        null,
      name:      null,
      type:      null,       // 'pdf' | 'text' | 'image'
      sector:    null,       // 'construction' | 'healthcare' | etc.
      raw:       null,       // extracted text
      parsed:    null,       // structured parse output
      uploadedAt: null,
    },

    // Active mission
    mission: {
      id:         null,
      sector:     null,
      owner:      null,
      priority:   null,      // 'critical' | 'high' | 'medium' | 'low'
      exposure:   null,      // dollar amount
      confidence: null,      // 0–100
      status:     null,      // 'created' | 'analyzing' | 'ready' | 'executing' | 'complete'
      tasks:      [],
      timeline:   [],
      evidence:   [],
      createdAt:  null,
      updatedAt:  null,
    },

    // War Room outputs
    warroom: {
      sector:     null,
      status:     null,      // 'idle' | 'running' | 'complete' | 'error'
      findings:   [],
      summary:    null,
      startedAt:  null,
      completedAt: null,
    },

    // Strategist outputs
    strategist: {
      sector:          null,
      executiveSummary: null,
      actions:         [],
      risks:           [],
      brief:           null,
      readyAt:         null,
    },

    // Executive portal state
    executive: {
      sector:          null,
      approved:        false,
      rejectedReason:  null,
      reviewedAt:      null,
    },

    // Execution tracking
    execution: {
      status:      null,     // 'queued' | 'running' | 'complete' | 'failed'
      progress:    0,        // 0–100
      workerLog:   [],
      startedAt:   null,
      completedAt: null,
      metrics:     {},
    },

    // BNCA / collective intelligence
    bnca: {
      signals:    [],
      synthesis:  null,
      lastSync:   null,
    },

    // Audit trail
    audit: [],

    // Session meta
    session: {
      tenant:    null,
      user:      null,
      role:      null,
      startedAt: Date.now(),
    },
  };

  // ── Internal state (deep clone of defaults) ───────────────────────────────
  let _state = _deepClone(DEFAULT_STATE);
  let _persistTimer = null;

  // ── Core API ──────────────────────────────────────────────────────────────

  /**
   * Get full state or a named slice.
   * @param {string} [slice]
   * @returns {*} deep clone of requested state
   */
  function get(slice) {
    if (slice) {
      if (!(_state.hasOwnProperty(slice))) {
        console.warn(`[TSMState] Unknown slice: "${slice}"`);
        return null;
      }
      return _deepClone(_state[slice]);
    }
    return _deepClone(_state);
  }

  /**
   * Merge-update a state slice. Shallow merge at slice level.
   * @param {string} slice
   * @param {Object} updates
   */
  function update(slice, updates) {
    if (!_state.hasOwnProperty(slice)) {
      console.warn(`[TSMState] Unknown slice: "${slice}" — skipping update.`);
      return;
    }
    const prev = _deepClone(_state[slice]);
    _state[slice] = Array.isArray(_state[slice])
      ? [..._state[slice], ...(Array.isArray(updates) ? updates : [updates])]
      : Object.assign({}, _state[slice], updates);

    _onChange(slice, prev, _state[slice]);
  }

  /**
   * Replace a state slice entirely.
   * @param {string} slice
   * @param {*}      value
   */
  function set(slice, value) {
    if (!_state.hasOwnProperty(slice)) {
      console.warn(`[TSMState] Unknown slice: "${slice}" — skipping set.`);
      return;
    }
    const prev = _deepClone(_state[slice]);
    _state[slice] = _deepClone(value);
    _onChange(slice, prev, _state[slice]);
  }

  /**
   * Push an item into an array slice.
   * @param {string} slice
   * @param {*}      item
   */
  function push(slice, item) {
    if (!Array.isArray(_state[slice])) {
      console.warn(`[TSMState] Slice "${slice}" is not an array.`);
      return;
    }
    const prev = _deepClone(_state[slice]);
    _state[slice] = [..._state[slice], item];
    _onChange(slice, prev, _state[slice]);
  }

  /**
   * Reset to defaults.
   * @param {string} [slice]  omit to reset everything
   */
  function reset(slice) {
    if (slice) {
      const prev = _deepClone(_state[slice]);
      _state[slice] = _deepClone(DEFAULT_STATE[slice]);
      _onChange(slice, prev, _state[slice]);
    } else {
      _state = _deepClone(DEFAULT_STATE);
      _emitBus('STATE_RESET', { ts: Date.now() });
      console.info('[TSMState] Full state reset.');
    }
  }

  // ── Persistence ───────────────────────────────────────────────────────────

  /**
   * Save current state to localStorage (debounced 300ms internally).
   */
  function persist() {
    try {
      // Don't persist raw document content — too large
      const toSave = _deepClone(_state);
      if (toSave.document) toSave.document.raw = null;

      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (err) {
      console.error('[TSMState] Persist failed:', err);
    }
  }

  /**
   * Load state from localStorage, merging into defaults.
   */
  function hydrate() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const saved = JSON.parse(raw);
      // Merge saved slices into defaults (so new slices from code updates survive)
      Object.keys(DEFAULT_STATE).forEach(slice => {
        if (saved[slice] !== undefined) {
          _state[slice] = Object.assign(
            _deepClone(DEFAULT_STATE[slice]),
            saved[slice]
          );
        }
      });
      console.info('[TSMState] Hydrated from localStorage.');
      return true;
    } catch (err) {
      console.error('[TSMState] Hydrate failed:', err);
      return false;
    }
  }

  /**
   * Clear persisted state from localStorage.
   */
  function clearPersisted() {
    localStorage.removeItem(STORAGE_KEY);
    console.info('[TSMState] Cleared persisted state.');
  }

  // ── Legacy Bridge ─────────────────────────────────────────────────────────
  // Smooth migration: read old vertical-specific localStorage keys
  // and import them into the new state store on first load.

  function migrateLegacy() {
    const legacyMaps = {
      // Old key → [slice, field]
      'tsm_sector':           ['document', 'sector'],
      'tsm_mission_id':       ['mission',  'id'],
      'tsm_mission_priority': ['mission',  'priority'],
      'tsm_mission_exposure': ['mission',  'exposure'],
      'warroom_sector':       ['warroom',  'sector'],
      'warroom_findings':     ['warroom',  'findings'],
      'strategist_summary':   ['strategist', 'executiveSummary'],
    };

    let migrated = 0;
    Object.entries(legacyMaps).forEach(([oldKey, [slice, field]]) => {
      const val = localStorage.getItem(oldKey);
      if (val !== null) {
        try {
          _state[slice][field] = JSON.parse(val);
        } catch {
          _state[slice][field] = val;
        }
        migrated++;
      }
    });

    if (migrated > 0) {
      console.info(`[TSMState] Migrated ${migrated} legacy localStorage keys.`);
      persist();
    }
    return migrated;
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  function _onChange(slice, prev, next) {
    // Debounced auto-persist
    clearTimeout(_persistTimer);
    _persistTimer = setTimeout(persist, 300);

    // Emit via TSMBus if available
    _emitBus('STATE_CHANGED', { slice, prev, next });

    // Slice-specific bus events
    const sliceEventMap = {
      mission:    'MISSION_UPDATED',
      warroom:    'WARROOM_ANALYZED',
      strategist: 'STRATEGIST_READY',
      executive:  'EXECUTIVE_READY',
      execution:  'EXECUTION_PROGRESS',
      bnca:       'BNCA_SIGNAL_RECEIVED',
    };
    if (sliceEventMap[slice]) {
      _emitBus(sliceEventMap[slice], { slice, data: next });
    }
  }

  function _emitBus(event, payload) {
    if (global.TSMBus && typeof global.TSMBus.emit === 'function') {
      global.TSMBus.emit(event, payload);
    }
  }

  function _deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    try {
      return JSON.parse(JSON.stringify(obj));
    } catch {
      return obj;
    }
  }

  // ── Debug helpers ─────────────────────────────────────────────────────────

  function debug() {
    console.group('[TSMState] Current State');
    Object.keys(_state).forEach(slice => {
      console.log(`  ${slice}:`, _deepClone(_state[slice]));
    });
    console.groupEnd();
  }

  // ── Expose ────────────────────────────────────────────────────────────────
  const TSMState = {
    get,
    update,
    set,
    push,
    reset,
    persist,
    hydrate,
    clearPersisted,
    migrateLegacy,
    debug,
    DEFAULT_STATE,
  };

  global.TSMState = TSMState;

  // Auto-hydrate on load
  TSMState.hydrate();
  TSMState.migrateLegacy();

  console.info('[TSMState] State Store v1.0 initialized.');

})(window);
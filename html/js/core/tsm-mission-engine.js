/**
 * TSM Mission Engine v1.0
 * Canonical mission data contract for all TSM Shell verticals.
 * BNCA owns missions. Pages only read and render them.
 *
 * Dependencies: tsm-event-bus.js, tsm-state.js
 *
 * Usage:
 *   const m = TSMMission.create({ sector: 'construction', owner: 'T-Dawg', ... });
 *   TSMMission.update(m.id, { status: 'analyzing' });
 *   TSMMission.addTask(m.id, { title: 'Review contract', priority: 'high' });
 *   TSMMission.addEvidence(m.id, { type: 'document', ref: 'invoice-001.pdf' });
 *   TSMMission.escalate(m.id, 'Exposure exceeds threshold');
 *   TSMMission.complete(m.id, { outcome: 'resolved', savings: 42000 });
 *   TSMMission.get(id)
 *   TSMMission.getAll()
 *   TSMMission.getBySector('healthcare')
 */

(function (global) {
  'use strict';

  // ── Constants ─────────────────────────────────────────────────────────────

  const SECTORS = Object.freeze([
    'construction', 'healthcare', 'insurance',
    'legal', 'finops', 'mortgage', 'bpo', 'realestate',
  ]);

  const PRIORITY   = Object.freeze(['critical', 'high', 'medium', 'low']);
  const STATUS     = Object.freeze(['created', 'analyzing', 'ready', 'escalated', 'executing', 'complete', 'failed']);
  const CONFIDENCE = { MIN: 0, MAX: 100 };

  // ── In-memory registry ────────────────────────────────────────────────────
  // Missions are also synced to TSMState and persisted via it.
  const _missions = {};

  // ── Mission Schema Factory ────────────────────────────────────────────────

  /**
   * Create a new mission.
   * @param {Object} opts
   * @param {string} opts.sector       - one of SECTORS
   * @param {string} [opts.owner]      - user/agent responsible
   * @param {string} [opts.priority]   - critical|high|medium|low
   * @param {number} [opts.exposure]   - financial exposure in USD
   * @param {number} [opts.confidence] - 0–100
   * @param {string} [opts.source]     - originating document/event id
   * @param {Object} [opts.meta]       - sector-specific extra fields
   * @returns {Object} mission
   */
  function create(opts = {}) {
    const id = _uid('MSN');
    const now = Date.now();

    if (!opts.sector || !SECTORS.includes(opts.sector)) {
      console.warn(`[TSMMission] Unknown sector "${opts.sector}" — defaulting to "general".`);
    }

    const mission = {
      id,
      sector:     opts.sector     || 'general',
      owner:      opts.owner      || null,
      priority:   _clamp(opts.priority,   PRIORITY,   'medium'),
      exposure:   opts.exposure   != null ? Number(opts.exposure) : null,
      confidence: opts.confidence != null ? _clampNum(opts.confidence, 0, 100) : null,
      status:     'created',
      source:     opts.source     || null,
      meta:       opts.meta       || {},

      // Structured sub-collections
      tasks:      [],
      timeline:   [],
      evidence:   [],
      findings:   [],
      risks:      [],
      actions:    [],

      // Explainability contract (uniform across all verticals)
      explainability: {
        confidence:        opts.confidence || null,
        recommendedAction: null,
        reasoning:         [],
        evidence:          [],
        governance:        {
          approvalRequired: false,
          approvedBy:       null,
          approvedAt:       null,
          policy:           null,
        },
      },

      // Execution tracking
      execution: {
        status:      null,
        progress:    0,
        workerLog:   [],
        startedAt:   null,
        completedAt: null,
        outcome:     null,
        metrics:     {},
      },

      // Timestamps
      createdAt:   now,
      updatedAt:   now,
      completedAt: null,
    };

    _missions[id] = mission;
    _syncState();
    _emit('MISSION_CREATED', { mission: _clone(mission) });
    _auditLog(id, 'created', { sector: mission.sector, priority: mission.priority });

    return _clone(mission);
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────

  /**
   * Update top-level mission fields (shallow merge).
   */
  function update(id, updates = {}) {
    const m = _get(id);
    if (!m) return null;

    // Guard status transitions
    if (updates.status && !STATUS.includes(updates.status)) {
      console.warn(`[TSMMission] Invalid status "${updates.status}" — ignored.`);
      delete updates.status;
    }
    if (updates.confidence != null) {
      updates.confidence = _clampNum(updates.confidence, 0, 100);
    }
    if (updates.priority && !PRIORITY.includes(updates.priority)) {
      delete updates.priority;
    }

    Object.assign(m, updates, { updatedAt: Date.now() });
    _syncState();
    _emit('MISSION_UPDATED', { id, updates, mission: _clone(m) });
    _auditLog(id, 'updated', updates);

    return _clone(m);
  }

  function get(id) {
    const m = _get(id);
    return m ? _clone(m) : null;
  }

  function getAll() {
    return Object.values(_missions).map(_clone);
  }

  function getBySector(sector) {
    return Object.values(_missions)
      .filter(m => m.sector === sector)
      .map(_clone);
  }

  function getByStatus(status) {
    return Object.values(_missions)
      .filter(m => m.status === status)
      .map(_clone);
  }

  function remove(id) {
    if (!_missions[id]) return false;
    delete _missions[id];
    _syncState();
    return true;
  }

  // ── Sub-collection helpers ────────────────────────────────────────────────

  /**
   * Add a task to a mission.
   * @param {string} id  mission id
   * @param {Object} task
   * @param {string} task.title
   * @param {string} [task.priority]   critical|high|medium|low
   * @param {string} [task.assignee]
   * @param {string} [task.dueDate]
   */
  function addTask(id, task = {}) {
    const m = _get(id);
    if (!m) return null;
    const t = {
      id:        _uid('TSK'),
      title:     task.title     || 'Untitled Task',
      priority:  _clamp(task.priority, PRIORITY, 'medium'),
      assignee:  task.assignee  || null,
      dueDate:   task.dueDate   || null,
      status:    'pending',
      createdAt: Date.now(),
    };
    m.tasks.push(t);
    m.updatedAt = Date.now();
    _syncState();
    _emit('MISSION_UPDATED', { id, change: 'task_added', task: t });
    return t;
  }

  /**
   * Add a timeline entry.
   * @param {string} id  mission id
   * @param {Object} entry
   * @param {string} entry.event
   * @param {string} [entry.actor]
   * @param {*}      [entry.data]
   */
  function addTimeline(id, entry = {}) {
    const m = _get(id);
    if (!m) return null;
    const e = {
      id:    _uid('TML'),
      event: entry.event || 'unknown',
      actor: entry.actor || 'system',
      data:  entry.data  || null,
      ts:    Date.now(),
    };
    m.timeline.push(e);
    m.updatedAt = Date.now();
    _syncState();
    return e;
  }

  /**
   * Add evidence to a mission.
   * @param {string} id  mission id
   * @param {Object} ev
   * @param {string} ev.type   'document' | 'log' | 'screenshot' | 'api_response'
   * @param {string} ev.ref    identifier / filename
   * @param {string} [ev.summary]
   */
  function addEvidence(id, ev = {}) {
    const m = _get(id);
    if (!m) return null;
    const e = {
      id:      _uid('EV'),
      type:    ev.type    || 'document',
      ref:     ev.ref     || null,
      summary: ev.summary || null,
      ts:      Date.now(),
    };
    m.evidence.push(e);
    // Mirror into explainability contract
    m.explainability.evidence.push(e);
    m.updatedAt = Date.now();
    _syncState();
    return e;
  }

  /**
   * Add a finding (structured insight from War Room analysis).
   * @param {string} id  mission id
   * @param {Object} finding
   * @param {string} finding.title
   * @param {string} finding.severity   'critical' | 'high' | 'medium' | 'low'
   * @param {string} [finding.detail]
   * @param {number} [finding.exposure]
   */
  function addFinding(id, finding = {}) {
    const m = _get(id);
    if (!m) return null;
    const f = {
      id:       _uid('FND'),
      title:    finding.title    || 'Untitled Finding',
      severity: _clamp(finding.severity, PRIORITY, 'medium'),
      detail:   finding.detail   || null,
      exposure: finding.exposure != null ? Number(finding.exposure) : null,
      ts:       Date.now(),
    };
    m.findings.push(f);
    m.updatedAt = Date.now();
    _syncState();
    return f;
  }

  /**
   * Set explainability fields (called by Strategist).
   */
  function setExplainability(id, xp = {}) {
    const m = _get(id);
    if (!m) return null;
    Object.assign(m.explainability, {
      confidence:        xp.confidence        ?? m.explainability.confidence,
      recommendedAction: xp.recommendedAction ?? m.explainability.recommendedAction,
      reasoning:         xp.reasoning         || m.explainability.reasoning,
      governance:        Object.assign({}, m.explainability.governance, xp.governance || {}),
    });
    m.updatedAt = Date.now();
    _syncState();
    _emit('MISSION_UPDATED', { id, change: 'explainability_set' });
    return _clone(m);
  }

  // ── Lifecycle transitions ─────────────────────────────────────────────────

  function escalate(id, reason = '') {
    const m = _get(id);
    if (!m) return null;
    m.status = 'escalated';
    m.updatedAt = Date.now();
    addTimeline(id, { event: 'escalated', data: { reason } });
    _syncState();
    _emit('MISSION_ESCALATED', { id, reason, mission: _clone(m) });
    _auditLog(id, 'escalated', { reason });
    return _clone(m);
  }

  function complete(id, result = {}) {
    const m = _get(id);
    if (!m) return null;
    m.status      = 'complete';
    m.completedAt = Date.now();
    m.updatedAt   = Date.now();
    m.execution.outcome  = result.outcome  || 'resolved';
    m.execution.metrics  = result.metrics  || {};
    m.execution.completedAt = Date.now();
    addTimeline(id, { event: 'completed', data: result });
    _syncState();
    _emit('MISSION_COMPLETE', { id, result, mission: _clone(m) });
    _auditLog(id, 'completed', result);
    return _clone(m);
  }

  function fail(id, reason = '') {
    const m = _get(id);
    if (!m) return null;
    m.status    = 'failed';
    m.updatedAt = Date.now();
    addTimeline(id, { event: 'failed', data: { reason } });
    _syncState();
    _emit('MISSION_UPDATED', { id, change: 'failed', reason });
    _auditLog(id, 'failed', { reason });
    return _clone(m);
  }

  // ── Sector plugin interface ───────────────────────────────────────────────
  // Sector analyzers call this to publish their output in a standard shape.

  /**
   * Publish War Room analysis results into a mission.
   * Called by each vertical's analyzer after Groq returns.
   *
   * @param {string} id       mission id
   * @param {Object} analysis
   * @param {string} analysis.summary
   * @param {Array}  analysis.findings   [{title, severity, detail, exposure}]
   * @param {Array}  analysis.risks      [{title, likelihood, impact}]
   * @param {Array}  analysis.actions    [{title, priority, owner, deadline}]
   * @param {number} analysis.confidence 0–100
   */
  function publishAnalysis(id, analysis = {}) {
    const m = _get(id);
    if (!m) return null;

    if (analysis.findings)   analysis.findings.forEach(f  => addFinding(id, f));
    if (analysis.risks)      m.risks    = analysis.risks;
    if (analysis.actions)    m.actions  = analysis.actions;
    if (analysis.confidence) m.confidence = _clampNum(analysis.confidence, 0, 100);

    m.explainability.reasoning = analysis.findings
      ? analysis.findings.map(f => f.title).filter(Boolean)
      : m.explainability.reasoning;

    m.status    = 'ready';
    m.updatedAt = Date.now();

    _syncState();
    _emit('WARROOM_FINDINGS_READY', { id, analysis, mission: _clone(m) });
    _emit('STRATEGIST_READY', { id, mission: _clone(m) });
    _auditLog(id, 'analysis_published', { findings: (analysis.findings || []).length });

    return _clone(m);
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  function _get(id) {
    if (!_missions[id]) {
      console.warn(`[TSMMission] Mission not found: ${id}`);
      return null;
    }
    return _missions[id];
  }

  function _syncState() {
    if (global.TSMState) {
      // Store active mission (most recent) in state slice
      const all = Object.values(_missions);
      const latest = all[all.length - 1];
      if (latest) global.TSMState.set('mission', latest);
    }
  }

  function _emit(event, payload) {
    if (global.TSMBus) global.TSMBus.emit(event, payload);
  }

  function _auditLog(missionId, action, data) {
    const entry = { missionId, action, data, ts: Date.now() };
    if (global.TSMState) global.TSMState.push('audit', entry);
    _emit('AUDIT_ENTRY', entry);
  }

  function _clone(obj) {
    try { return JSON.parse(JSON.stringify(obj)); } catch { return obj; }
  }

  function _uid(prefix = 'ID') {
    return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
  }

  function _clamp(val, allowed, fallback) {
    return allowed.includes(val) ? val : fallback;
  }

  function _clampNum(val, min, max) {
    return Math.min(max, Math.max(min, Number(val) || 0));
  }

  // ── Debug ─────────────────────────────────────────────────────────────────

  function debug() {
    console.group('[TSMMission] All Missions');
    Object.values(_missions).forEach(m => {
      console.log(`  [${m.id}] ${m.sector} | ${m.status} | confidence:${m.confidence} | tasks:${m.tasks.length}`);
    });
    console.groupEnd();
  }

  // ── Expose ────────────────────────────────────────────────────────────────
  global.TSMMission = {
    // Core CRUD
    create,
    update,
    get,
    getAll,
    getBySector,
    getByStatus,
    remove,

    // Sub-collections
    addTask,
    addTimeline,
    addEvidence,
    addFinding,
    setExplainability,

    // Lifecycle
    escalate,
    complete,
    fail,

    // Sector plugin interface
    publishAnalysis,

    // Debug
    debug,

    // Constants (exposed for vertical plugins)
    SECTORS,
    PRIORITY,
    STATUS,
  };

  console.info('[TSMMission] Mission Engine v1.0 initialized.');

})(window);
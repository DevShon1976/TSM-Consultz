/**
 * TSM Foundation: Workflow Engine v1.0
 * Configurable state machine any War Room can instantiate for approvals,
 * escalations, notifications, and SLA timers -- without hand-rolling status
 * strings per vertical (the drift that broke the relay keys across the 7
 * legacy verticals should not happen again here).
 *
 * A workflow definition:
 *   {
 *     id: 'purchase_approval',
 *     states: ['submitted', 'pending_review', 'approved', 'rejected', 'escalated'],
 *     initial: 'submitted',
 *     transitions: {
 *       submitted:      { review: 'pending_review' },
 *       pending_review: { approve: 'approved', reject: 'rejected', escalate: 'escalated' },
 *       escalated:      { approve: 'approved', reject: 'rejected' }
 *     },
 *     slaHours: { pending_review: 24, escalated: 4 }  // optional, per-state timer -> auto-escalate
 *   }
 *
 * Usage:
 *   const wf = TSMWorkflowEngine.define(def);
 *   const instance = wf.start({ recordId: 'APR-1001', owner: 'Finance' });
 *   wf.transition(instance.id, 'review');
 *   wf.transition(instance.id, 'approve', { approver: 'T-dawg' });
 *   wf.getBreaches();  // instances that exceeded slaHours for their current state
 *
 * Every transition emits WORKFLOW_TRANSITIONED on TSMBus and writes an
 * audit entry via TSMState.push('audit', ...) when TSMState is present.
 */

(function (global) {
  'use strict';

  function _bus() {
    return global.TSMBus || global.TSMEventBus || null;
  }

  function _uid(prefix) {
    return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  }

  class Workflow {
    constructor(def) {
      this.id = def.id;
      this.states = def.states || [];
      this.initial = def.initial || this.states[0];
      this.transitions = def.transitions || {};
      this.slaHours = def.slaHours || {};
      this.notifyFn = def.onNotify || null; // (instance, event) -> void, plug in email/slack/etc later
      this._instances = {};
    }

    start(payload = {}) {
      const inst = {
        id: _uid('WF'),
        workflowId: this.id,
        state: this.initial,
        enteredStateAt: Date.now(),
        history: [{ state: this.initial, at: Date.now(), action: 'started' }],
        payload
      };
      this._instances[inst.id] = inst;
      this._notify(inst, 'started');
      this._audit(inst, 'started', {});
      const bus = _bus();
      if (bus && bus.emit) bus.emit('WORKFLOW_STARTED', { workflowId: this.id, instance: this._clone(inst) });
      return this._clone(inst);
    }

    transition(instanceId, action, meta = {}) {
      const inst = this._instances[instanceId];
      if (!inst) { console.warn('[TSMWorkflowEngine] Unknown instance:', instanceId); return null; }

      const allowed = this.transitions[inst.state] || {};
      const nextState = allowed[action];
      if (!nextState) {
        console.warn(`[TSMWorkflowEngine] Illegal transition "${action}" from state "${inst.state}" (workflow: ${this.id})`);
        return null;
      }

      const prevState = inst.state;
      inst.state = nextState;
      inst.enteredStateAt = Date.now();
      inst.history.push({ state: nextState, at: Date.now(), action, meta });

      this._notify(inst, action);
      this._audit(inst, 'transitioned', { from: prevState, to: nextState, action, meta });

      const bus = _bus();
      if (bus && bus.emit) {
        bus.emit('WORKFLOW_TRANSITIONED', { workflowId: this.id, instance: this._clone(inst), from: prevState, to: nextState, action });
        if (['approved', 'rejected', 'complete'].includes(nextState)) {
          bus.emit('WORKFLOW_COMPLETE', { workflowId: this.id, instance: this._clone(inst), outcome: nextState });
        }
      }

      return this._clone(inst);
    }

    /** Force-escalate regardless of the transitions map (used by SLA timer checks). */
    escalate(instanceId, reason = 'sla_breach') {
      const inst = this._instances[instanceId];
      if (!inst) return null;
      const prevState = inst.state;
      inst.state = 'escalated';
      inst.enteredStateAt = Date.now();
      inst.history.push({ state: 'escalated', at: Date.now(), action: 'auto_escalate', meta: { reason } });
      this._notify(inst, 'escalated');
      this._audit(inst, 'escalated', { from: prevState, reason });
      const bus = _bus();
      if (bus && bus.emit) bus.emit('WORKFLOW_ESCALATED', { workflowId: this.id, instance: this._clone(inst), reason });
      return this._clone(inst);
    }

    get(instanceId) { const i = this._instances[instanceId]; return i ? this._clone(i) : null; }
    getAll()        { return Object.values(this._instances).map(i => this._clone(i)); }

    /** Instances whose time-in-state exceeds slaHours[state]. Call this on an interval or before render. */
    getBreaches() {
      const now = Date.now();
      return Object.values(this._instances)
        .map(inst => {
          const limit = this.slaHours[inst.state];
          if (limit == null) return null;
          const hoursIn = (now - inst.enteredStateAt) / 3600000;
          if (hoursIn <= limit) return null;
          return { instanceId: inst.id, state: inst.state, hoursIn: +hoursIn.toFixed(1), slaHours: limit, hoursOver: +(hoursIn - limit).toFixed(1) };
        })
        .filter(Boolean)
        .sort((a, b) => b.hoursOver - a.hoursOver);
    }

    /** Auto-escalate every instance currently in SLA breach. Returns the list escalated. */
    runEscalationSweep() {
      const breaches = this.getBreaches();
      breaches.forEach(b => {
        if (this._instances[b.instanceId].state !== 'escalated') {
          this.escalate(b.instanceId, `${b.state} exceeded ${b.slaHours}h SLA (${b.hoursOver}h over)`);
        }
      });
      return breaches;
    }

    _notify(inst, event) {
      if (typeof this.notifyFn === 'function') {
        try { this.notifyFn(inst, event); } catch (e) { console.error('[TSMWorkflowEngine] notifyFn error:', e); }
      }
    }

    _audit(inst, action, data) {
      if (global.TSMState && typeof global.TSMState.push === 'function') {
        global.TSMState.push('audit', { workflowId: this.id, instanceId: inst.id, action, data, ts: Date.now() });
      }
    }

    _clone(obj) { try { return JSON.parse(JSON.stringify(obj)); } catch { return obj; } }
  }

  // ── Registry ──────────────────────────────────────────────────────────────
  const _workflows = {};

  function define(def) {
    if (!def || !def.id) throw new Error('[TSMWorkflowEngine] Workflow definition requires an id');
    const wf = new Workflow(def);
    _workflows[def.id] = wf;
    return wf;
  }

  function get(workflowId) { return _workflows[workflowId] || null; }

  global.TSMWorkflowEngine = { define, get };

  console.info('[TSMWorkflowEngine] Foundation module v1.0 initialized.');

})(window);

/**
 * TSM Foundation: Governance Layer v1.0
 * Role-based access checks, audit log querying, and policy enforcement
 * shared across every War Room. This is deliberately thin -- it enforces the
 * *shape* of governance (roles, policies, audit) without hardcoding any one
 * vertical's rules. Each war room registers its own roles/policies at init.
 *
 * Usage:
 *   TSMGovernance.registerRole('finance_approver', { can: ['approve_purchase', 'view_financials'] });
 *   TSMGovernance.assignRole('T-dawg', 'finance_approver');
 *   TSMGovernance.can('T-dawg', 'approve_purchase');  // -> true/false
 *
 *   TSMGovernance.registerPolicy('purchase_over_10k', (ctx) => ctx.amount > 10000
 *     ? { allowed: false, reason: 'Requires dual approval over $10k' }
 *     : { allowed: true });
 *   TSMGovernance.checkPolicy('purchase_over_10k', { amount: 15000 });
 *
 *   TSMGovernance.getAuditTrail({ vertical: 'o2c' });  // reads from TSMState 'audit' collection
 */

(function (global) {
  'use strict';

  function _bus() { return global.TSMBus || global.TSMEventBus || null; }

  const _roles = {};        // roleName -> { can: [permission,...] }
  const _userRoles = {};    // username -> [roleName,...]
  const _policies = {};     // policyName -> fn(ctx) -> { allowed, reason? }

  // ── Roles / permissions ──────────────────────────────────────────────────
  function registerRole(roleName, def = {}) {
    _roles[roleName] = { can: def.can || [] };
  }

  function assignRole(username, roleName) {
    if (!_userRoles[username]) _userRoles[username] = [];
    if (!_userRoles[username].includes(roleName)) _userRoles[username].push(roleName);
  }

  function can(username, permission) {
    const roles = _userRoles[username] || [];
    return roles.some(r => (_roles[r]?.can || []).includes(permission));
  }

  function getRoles(username) {
    return (_userRoles[username] || []).slice();
  }

  // ── Policies ──────────────────────────────────────────────────────────────
  function registerPolicy(policyName, fn) {
    if (typeof fn !== 'function') { console.warn('[TSMGovernance] Policy requires a function:', policyName); return; }
    _policies[policyName] = fn;
  }

  function checkPolicy(policyName, ctx = {}) {
    const fn = _policies[policyName];
    if (!fn) { console.warn('[TSMGovernance] Unknown policy:', policyName); return { allowed: true, reason: 'no policy registered' }; }
    let result;
    try { result = fn(ctx); } catch (e) { console.error('[TSMGovernance] Policy error:', policyName, e); result = { allowed: false, reason: 'policy evaluation error' }; }

    const bus = _bus();
    if (bus && bus.emit) bus.emit('GOVERNANCE_POLICY_CHECKED', { policyName, ctx, result });
    if (!result.allowed && global.TSMState && typeof global.TSMState.push === 'function') {
      global.TSMState.push('audit', { event: 'POLICY_DENIED', policyName, ctx, reason: result.reason, ts: Date.now() });
    }
    return result;
  }

  // ── Audit ─────────────────────────────────────────────────────────────────
  /** Reads the shared audit collection from TSMState, optionally filtered. */
  function getAuditTrail(filter = {}) {
    if (!global.TSMState || typeof global.TSMState.get !== 'function') return [];
    const audit = global.TSMState.get('audit') || [];
    return audit.filter(entry => Object.keys(filter).every(k => entry[k] === filter[k]));
  }

  global.TSMGovernance = { registerRole, assignRole, can, getRoles, registerPolicy, checkPolicy, getAuditTrail };

  console.info('[TSMGovernance] Foundation module v1.0 initialized.');

})(window);

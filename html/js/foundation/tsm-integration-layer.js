/**
 * TSM Foundation: Integration Layer v1.0
 * Registry for external system connectors (SAP, CRM, BI, custom APIs) that
 * feed a War Room. This is the generic plumbing every vertical's Integration
 * Hub work (e.g. the Phase 7 CRM<->ERP flow monitor) can sit on top of --
 * it does not replace vertical-specific integration UIs, it standardizes how
 * they register, report health, and stream events into TSMBus.
 *
 * Usage:
 *   TSMIntegrationLayer.registerConnector('sap_erp', {
 *     type: 'erp', direction: 'inbound',
 *     healthCheck: async () => { const r = await fetch('/api/integration/health'); return (await r.json()).ok; }
 *   });
 *   await TSMIntegrationLayer.checkHealth('sap_erp');   // -> { name, healthy, checkedAt }
 *   TSMIntegrationLayer.recordSync('sap_erp', { recordsIn: 42, recordsOut: 0 });
 *   TSMIntegrationLayer.getStatus();  // health + last-sync summary for every registered connector
 */

(function (global) {
  'use strict';

  function _bus() { return global.TSMBus || global.TSMEventBus || null; }

  const _connectors = {}; // name -> { type, direction, healthCheck, lastHealthy, lastCheckedAt, lastSyncAt, syncCount }

  function registerConnector(name, def = {}) {
    _connectors[name] = {
      type: def.type || 'api',
      direction: def.direction || 'inbound',
      healthCheck: typeof def.healthCheck === 'function' ? def.healthCheck : null,
      lastHealthy: null,
      lastCheckedAt: null,
      lastSyncAt: null,
      syncCount: 0
    };
    const bus = _bus();
    if (bus && bus.emit) bus.emit('CONNECTOR_REGISTERED', { name, type: _connectors[name].type });
  }

  async function checkHealth(name) {
    const conn = _connectors[name];
    if (!conn) { console.warn('[TSMIntegrationLayer] Unknown connector:', name); return null; }

    let healthy = true;
    if (conn.healthCheck) {
      try { healthy = !!(await conn.healthCheck()); }
      catch (e) { console.error(`[TSMIntegrationLayer] Health check failed for "${name}":`, e.message); healthy = false; }
    }

    conn.lastHealthy = healthy;
    conn.lastCheckedAt = Date.now();

    const bus = _bus();
    if (bus && bus.emit) bus.emit('CONNECTOR_HEALTH_CHECKED', { name, healthy, checkedAt: conn.lastCheckedAt });
    if (!healthy && bus && bus.emit) bus.emit('CONNECTOR_DOWN', { name, checkedAt: conn.lastCheckedAt });

    return { name, healthy, checkedAt: conn.lastCheckedAt };
  }

  /** Call after a sync/poll completes so dashboards can show freshness + volume. */
  function recordSync(name, meta = {}) {
    const conn = _connectors[name];
    if (!conn) { console.warn('[TSMIntegrationLayer] Unknown connector:', name); return; }
    conn.lastSyncAt = Date.now();
    conn.syncCount += 1;

    const bus = _bus();
    if (bus && bus.emit) bus.emit('CONNECTOR_SYNC', { name, meta, syncedAt: conn.lastSyncAt, syncCount: conn.syncCount });
    if (global.TSMState && typeof global.TSMState.push === 'function') {
      global.TSMState.push('integration_events', { name, meta, ts: conn.lastSyncAt });
    }
  }

  function getStatus() {
    return Object.keys(_connectors).map(name => {
      const c = _connectors[name];
      return {
        name, type: c.type, direction: c.direction,
        healthy: c.lastHealthy, lastCheckedAt: c.lastCheckedAt,
        lastSyncAt: c.lastSyncAt, syncCount: c.syncCount
      };
    });
  }

  /** Runs checkHealth on every registered connector. Returns the array of results. */
  async function checkAll() {
    return Promise.all(Object.keys(_connectors).map(checkHealth));
  }

  global.TSMIntegrationLayer = { registerConnector, checkHealth, checkAll, recordSync, getStatus };

  console.info('[TSMIntegrationLayer] Foundation module v1.0 initialized.');

})(window);

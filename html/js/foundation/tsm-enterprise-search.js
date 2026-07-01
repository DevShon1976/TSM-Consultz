/**
 * TSM Foundation: Enterprise Search v1.0
 * Client-side search across customers, products, orders, cases, projects, and
 * documents -- any War Room registers its record arrays here once, and the
 * whole platform can search across all of them from one box.
 *
 * This is an in-memory inverted-index search (no backend round trip); good
 * for the record volumes War Rooms actually hold (tens/hundreds, not millions).
 * If a vertical's record count grows past that, route search server-side instead.
 *
 * Usage:
 *   TSMEnterpriseSearch.registerSource('o2c_orders', orders, { keyFields: ['order_id','customer','notes'], idField: 'order_id' });
 *   TSMEnterpriseSearch.registerSource('crm_leads', leads, { keyFields: ['name','company','email'], idField: 'id' });
 *   TSMEnterpriseSearch.search('acme');   // -> [{ source, id, record, matchedFields }] across every registered source
 *   TSMEnterpriseSearch.searchIn('o2c_orders', 'acme');  // scoped to one source
 */

(function (global) {
  'use strict';

  const _sources = {}; // name -> { records, keyFields, idField }

  function registerSource(name, records, opts = {}) {
    _sources[name] = {
      records: records || [],
      keyFields: opts.keyFields || Object.keys((records && records[0]) || {}),
      idField: opts.idField || 'id'
    };
    const bus = global.TSMBus || global.TSMEventBus;
    if (bus && bus.emit) bus.emit('SEARCH_SOURCE_REGISTERED', { name, count: (records || []).length });
  }

  function _matchRecord(record, keyFields, needle) {
    const matched = [];
    keyFields.forEach(f => {
      const val = record[f];
      if (val != null && String(val).toLowerCase().includes(needle)) matched.push(f);
    });
    return matched;
  }

  function searchIn(sourceName, query, limit = 20) {
    const src = _sources[sourceName];
    if (!src || !query) return [];
    const needle = String(query).toLowerCase().trim();
    if (!needle) return [];

    const results = [];
    for (const record of src.records) {
      const matchedFields = _matchRecord(record, src.keyFields, needle);
      if (matchedFields.length) {
        results.push({ source: sourceName, id: record[src.idField], record, matchedFields });
        if (results.length >= limit) break;
      }
    }
    return results;
  }

  function search(query, limit = 50) {
    const out = [];
    Object.keys(_sources).forEach(name => {
      out.push(...searchIn(name, query, limit));
    });
    return out.slice(0, limit);
  }

  function listSources() {
    return Object.keys(_sources).map(name => ({ name, count: _sources[name].records.length, keyFields: _sources[name].keyFields }));
  }

  global.TSMEnterpriseSearch = { registerSource, search, searchIn, listSources };

  console.info('[TSMEnterpriseSearch] Foundation module v1.0 initialized.');

})(window);

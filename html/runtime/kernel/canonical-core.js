/* ============================================================
   TSM CANONICAL CORE
   runtime/kernel/canonical-core.js
   Reads architecture/canonical/entities.json and enforces the
   shared field contract every vertical entity must satisfy.
   Pure data-shape utility -- no business logic, no AI calls,
   no rendering. Verticals call normalize()/validate() on their
   own records before they hand them to WIP, Collective BNCA,
   or any other cross-vertical consumer.
   ============================================================ */

class CanonicalCore {

  constructor(schemaPath = '/architecture/canonical/entities.json') {
    this.schemaPath = schemaPath;
    this.schema = null;
  }

  async load() {
    const res = await fetch(this.schemaPath);
    if (!res.ok) {
      console.error('CanonicalCore: failed to load', this.schemaPath, res.status);
      this.schema = { fields: {} };
      return this.schema;
    }
    this.schema = await res.json();
    return this.schema;
  }

  /**
   * Fill in defaults for any missing-but-not-required canonical field.
   * Does NOT invent values for required fields with no default --
   * those are caller errors and should surface via validate(), not
   * be silently papered over.
   */
  normalize(record) {
    if (!this.schema) {
      console.error('CanonicalCore: schema not loaded, call load() first');
      return record;
    }
    const out = { ...record };
    const fields = this.schema.fields || {};
    Object.keys(fields).forEach(key => {
      const def = fields[key];
      if (out[key] === undefined && 'default' in def) {
        out[key] = def.default;
      }
    });
    if (!out.created_at) out.created_at = new Date().toISOString();
    out.updated_at = new Date().toISOString();
    return out;
  }

  /**
   * Returns { valid: bool, errors: [ { field, reason } ] }.
   * Call this in dev/CI, not on every render -- it's a build-time /
   * ingestion-time guardrail, not a runtime UI blocker.
   */
  validate(record) {
    if (!this.schema) {
      return { valid: false, errors: [{ field: '*', reason: 'schema not loaded' }] };
    }
    const errors = [];
    const fields = this.schema.fields || {};

    Object.keys(fields).forEach(key => {
      const def = fields[key];
      if (def.required && (record[key] === undefined || record[key] === null || record[key] === '')) {
        errors.push({ field: key, reason: 'missing required canonical field' });
        return;
      }
      if (def.enum && record[key] !== undefined && !def.enum.includes(record[key])) {
        errors.push({ field: key, reason: `value "${record[key]}" not in allowed set [${def.enum.join(', ')}]` });
      }
    });

    return { valid: errors.length === 0, errors };
  }

  /** Convenience: normalize then validate in one call. */
  process(record) {
    const normalized = this.normalize(record);
    const result = this.validate(normalized);
    return { record: normalized, ...result };
  }
}

if (typeof window !== 'undefined') {
  window.CanonicalCore = CanonicalCore;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CanonicalCore;
}
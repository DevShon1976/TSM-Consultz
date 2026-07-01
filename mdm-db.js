/**
 * mdm-db.js
 * SQLite persistence layer for TSM MDM (Phase 6) — 10 domains.
 *
 * Design decisions (locked, see architecture discussion):
 *  - SQLite on the existing Fly volume (tsm_data), not JSON, not Postgres yet.
 *    Rationale: relational integrity for org_hierarchy -> cost/profit centers,
 *    single-machine deploy, no concurrent external writers.
 *  - Version incrementing happens at the APP layer (bumpVersion helper below),
 *    not via SQL triggers. Easier to debug solo; revisit if version-history
 *    gaps show up in practice.
 *  - Every domain table shares the same base shape (id, identifier field,
 *    quality_score, version, status, timestamps) so mdm-core.js can treat
 *    them polymorphically where possible.
 *
 * Usage:
 *   const { db, initSchema, bumpVersion, logMerge } = require('./mdm-db');
 *   initSchema(); // idempotent — safe to call on every boot
 */

const path = require('path');
const Database = require('better-sqlite3');

// Fly volume mount point — adjust if your fly.toml mounts tsm_data elsewhere
const DB_PATH = process.env.TSM_DB_PATH || path.join('/data', 'tsm_mdm.sqlite');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL'); // safer for a single-machine app that may crash mid-write
db.pragma('foreign_keys = ON');

// ---------------------------------------------------------------------------
// Shared scaffolding
// ---------------------------------------------------------------------------

const SHARED_DDL = `
CREATE TABLE IF NOT EXISTS merge_log (
  id TEXT PRIMARY KEY,        -- matches server.js's MRG-<timestamp>-<rand> format
  domain TEXT NOT NULL,
  survivor_id TEXT NOT NULL,
  merged_id TEXT NOT NULL,
  survivor_name TEXT,
  merged_name TEXT,
  decision TEXT NOT NULL,     -- 'APPROVED' | 'REJECTED'
  actor TEXT,
  ts TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS stewardship (
  domain TEXT PRIMARY KEY,
  steward_name TEXT NOT NULL,
  steward_email TEXT
);

CREATE TABLE IF NOT EXISTS schema_meta (
  key TEXT PRIMARY KEY,
  value TEXT
);
`;

// ---------------------------------------------------------------------------
// Domain tables
// Base shape repeated per domain; identifier column name varies per the
// exact-match override logic in mdm-core.js (identifier beats fuzzy name).
// ---------------------------------------------------------------------------

const DOMAIN_DDL = `
CREATE TABLE IF NOT EXISTS customer_master (
  id TEXT PRIMARY KEY,
  tax_id TEXT,
  name TEXT NOT NULL,
  quality_score REAL,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_customer_tax_id ON customer_master(tax_id);

CREATE TABLE IF NOT EXISTS vendor_master (
  id TEXT PRIMARY KEY,
  tax_id TEXT,
  name TEXT NOT NULL,
  quality_score REAL,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_vendor_tax_id ON vendor_master(tax_id);

CREATE TABLE IF NOT EXISTS product_master (
  id TEXT PRIMARY KEY,
  sku TEXT UNIQUE,
  name TEXT NOT NULL,
  quality_score REAL,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS employee_master (
  id TEXT PRIMARY KEY,
  employee_id TEXT UNIQUE,   -- the field that fixed the E001/E002 gap
  name TEXT NOT NULL,
  quality_score REAL,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS asset_master (
  id TEXT PRIMARY KEY,
  asset_tag TEXT UNIQUE,
  name TEXT NOT NULL,
  quality_score REAL,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS location_master (
  id TEXT PRIMARY KEY,
  location_code TEXT UNIQUE,
  name TEXT NOT NULL,
  quality_score REAL,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Self-referencing tree
CREATE TABLE IF NOT EXISTS org_hierarchy (
  id TEXT PRIMARY KEY,
  parent_id TEXT REFERENCES org_hierarchy(id),
  org_code TEXT UNIQUE,
  name TEXT NOT NULL,
  level INTEGER,
  quality_score REAL,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_org_parent ON org_hierarchy(parent_id);

-- References org_hierarchy — this FK is the relational integrity
-- JSON-on-volume would have let drift silently.
CREATE TABLE IF NOT EXISTS cost_centers (
  id TEXT PRIMARY KEY,
  cost_center_code TEXT UNIQUE,
  org_id TEXT REFERENCES org_hierarchy(id),
  name TEXT NOT NULL,
  quality_score REAL,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS profit_centers (
  id TEXT PRIMARY KEY,
  profit_center_code TEXT UNIQUE,
  org_id TEXT REFERENCES org_hierarchy(id),
  name TEXT NOT NULL,
  quality_score REAL,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS gl_accounts (
  id TEXT PRIMARY KEY,
  gl_account_code TEXT UNIQUE,
  name TEXT NOT NULL,
  account_type TEXT,          -- asset | liability | equity | revenue | expense
  quality_score REAL,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
`;

// Maps domain name (as used in server.js / mdm-core.js) -> {table, idField}
// Central place so route handlers don't hardcode table names ad hoc.
const DOMAIN_TABLE_MAP = {
  customer:      { table: 'customer_master',  idField: 'tax_id' },
  vendor:        { table: 'vendor_master',    idField: 'tax_id' },
  product:       { table: 'product_master',   idField: 'sku' },
  employee:      { table: 'employee_master',  idField: 'employee_id' },
  asset:         { table: 'asset_master',     idField: 'asset_tag' },
  location:      { table: 'location_master',  idField: 'location_code' },
  org_hierarchy: { table: 'org_hierarchy',    idField: 'org_code' },
  cost_center:   { table: 'cost_centers',     idField: 'cost_center_code' },
  profit_center: { table: 'profit_centers',   idField: 'profit_center_code' },
  gl_account:    { table: 'gl_accounts',      idField: 'gl_account_code' },
};

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

function initSchema() {
  db.exec(SHARED_DDL);
  db.exec(DOMAIN_DDL);

  const seedStewards = db.prepare(
    `INSERT OR IGNORE INTO stewardship (domain, steward_name, steward_email) VALUES (?, ?, ?)`
  );
  const seedMeta = db.prepare(
    `INSERT OR IGNORE INTO schema_meta (key, value) VALUES ('schema_version', '1')`
  );

  const seedTx = db.transaction(() => {
    seedMeta.run();
    // Real steward names/emails should come from your existing steward
    // mapping in server.js — wire that in when you migrate, this is a stub.
    for (const domain of Object.keys(DOMAIN_TABLE_MAP)) {
      seedStewards.run(domain, 'unassigned', null);
    }
  });
  seedTx();

  return db;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** App-layer version bump — call this on every write to a domain record. */
function bumpVersion(table, id) {
  const stmt = db.prepare(
    `UPDATE ${table} SET version = version + 1, updated_at = datetime('now') WHERE id = ?`
  );
  return stmt.run(id);
}

/** Persist a merge decision, exactly matching the entry shape /api/mdm/merge builds. */
function logMerge(entry) {
  const stmt = db.prepare(`
    INSERT INTO merge_log (id, domain, survivor_id, merged_id, survivor_name, merged_name, decision, actor, ts)
    VALUES (@id, @domain, @survivorId, @mergedId, @survivorName, @mergedName, @decision, @actor, @ts)
  `);
  return stmt.run(entry);
}

/** Read the full merge log back out, newest first — used to hydrate MDM_MERGE_LOG on server startup. */
function loadMergeLog(limit = 200) {
  const rows = db.prepare(`SELECT * FROM merge_log ORDER BY ts DESC LIMIT ?`).all(limit);
  return rows.map(r => ({
    id: r.id, domain: r.domain, survivorId: r.survivor_id, mergedId: r.merged_id,
    survivorName: r.survivor_name, mergedName: r.merged_name, decision: r.decision,
    actor: r.actor, ts: r.ts
  }));
}

/** Clear the merge log — used by /api/mdm/reset so a reset is durable, not just in-memory. */
function clearMergeLog() {
  db.prepare(`DELETE FROM merge_log`).run();
}

module.exports = {
  db,
  initSchema,
  bumpVersion,
  logMerge,
  loadMergeLog,
  clearMergeLog,
  DOMAIN_TABLE_MAP,
};

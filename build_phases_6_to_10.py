#!/usr/bin/env python3
"""
build_phases_6_to_10.py
Rewritten from scratch after the bash version corrupted server.js.

Root causes fixed:
  1. Old script searched for '// SP.mdm' etc anchors that never existed anywhere
     in server.js (verified: zero hits repo-wide). Every insertion silently
     no-op'd on the anchor search, then a fallback path blind-appended anyway.
  2. No escaping on business-copy strings -> apostrophes ("workflow pilot's...")
     closed JS string literals early -> "Unexpected identifier" crashes.
  3. Single node --check at the very end meant 4 failures + 1 corruption
     surfaced as one opaque crash instead of 4 clear, isolated warnings.

Fixes applied here:
  - Anchor is the REAL, VERIFIED divider already in server.js:
        // ── END WIP / EXECUTION COMMAND CENTER ────────────────────────────
    New routes are inserted immediately after that box, before
    '// ── HEALTH & STUB ROUTES ──', guaranteeing they land before app.listen().
  - All business-copy strings are inserted via json.dumps() so embedded
    apostrophes/quotes are automatically escaped -- not hand-typed JS quotes.
  - node --check runs after EVERY phase, and the script HARD STOPS on first
    failure instead of continuing to the next phase.
  - Idempotent: checks for its own route path before inserting, so re-running
    after a partial success does not duplicate routes.
"""

import json
import re
import subprocess
import sys
from pathlib import Path

SERVER_JS = Path("server.js")
PIPELINE_FILES = [
    Path("html/js/core/tsm-auto-pipeline.js"),
    Path("js/core/tsm-auto-pipeline.js"),
]

ANCHOR = (
    "// ══════════════════════════════════════════════════════════════════════════════\n"
    "// ── END WIP / EXECUTION COMMAND CENTER ────────────────────────────────────────\n"
    "// ══════════════════════════════════════════════════════════════════════════════"
)


def check_syntax():
    result = subprocess.run(["node", "--check", str(SERVER_JS)], capture_output=True, text=True)
    if result.returncode != 0:
        print(f"SYNTAX ERROR after last insert:\n{result.stderr}", file=sys.stderr)
        return False
    return True


def backup():
    content = SERVER_JS.read_text()
    Path("server.js.bak").write_text(content)
    return content


def insert_block(route_path, block_code, label):
    """Insert block_code right after ANCHOR, only if route_path isn't already registered."""
    content = SERVER_JS.read_text()

    if route_path in content:
        print(f"SKIP {label}: route '{route_path}' already present (idempotent no-op).")
        return True

    if ANCHOR not in content:
        print(f"ABORT {label}: verified anchor not found. Refusing to blind-append.", file=sys.stderr)
        return False

    new_content = content.replace(ANCHOR, ANCHOR + "\n\n" + block_code, 1)
    SERVER_JS.write_text(new_content)

    if not check_syntax():
        print(f"ROLLING BACK {label} -- restoring pre-insert content.", file=sys.stderr)
        SERVER_JS.write_text(content)
        return False

    print(f"OK: {label} inserted and verified.")
    return True


def build_phase6_mdm():
    """Phase 6 - MDM. Real logic, wired to mdm-core.js + mdm-seed-data.json."""
    code = f"""// ── PHASE 6: MASTER DATA MANAGEMENT (MDM) ──────────────────────────────────────
const {{ findDuplicates: mdmFindDuplicates, scoreDataset: mdmScoreDataset }} = require('./html/mdm-suite/mdm-core.js');
const MDM_SEED_DATA = require('./html/mdm-suite/mdm-seed-data.json');

app.get('/api/mdm/analysis/:domain', (req, res) => {{
  const domain = req.params.domain;
  const records = MDM_SEED_DATA[domain];
  if (!records) return res.status(404).json({{ ok: false, error: {json.dumps("Unknown domain. Valid domains: customer, vendor, gl")} }});
  res.json({{
    ok: true,
    domain,
    duplicates: mdmFindDuplicates(records, domain),
    quality: mdmScoreDataset(records, domain)
  }});
}});

app.get('/api/mdm/summary', (req, res) => {{
  const domains = Object.keys(MDM_SEED_DATA);
  const summary = domains.map(d => {{
    const q = mdmScoreDataset(MDM_SEED_DATA[d], d);
    const dupes = mdmFindDuplicates(MDM_SEED_DATA[d], d);
    return {{ domain: d, avgQualityScore: q.avgScore, recordCount: q.recordCount, duplicateCount: dupes.length }};
  }});
  const overallScore = Math.round(summary.reduce((s, d) => s + d.avgQualityScore, 0) / (summary.length || 1));
  res.json({{ ok: true, overallScore, domains: summary }});
}});
"""
    return insert_block("/api/mdm/analysis/:domain", code, "Phase 6 (MDM)")


def build_phase7_integration():
    """Phase 7 - Integration Hub. In-memory catalog + health status, real state machine."""
    systems = ["CRM", "ERP", "HR", "Finance", "Supply Chain", "Manufacturing", "BI", "AI"]
    seed = [
        {"id": f"int-{i+1:02d}", "system": s, "status": "healthy", "lastSync": None, "errorCount": 0}
        for i, s in enumerate(systems)
    ]
    code = f"""// ── PHASE 7: ENTERPRISE INTEGRATION HUB ────────────────────────────────────────
const INTEGRATION_CATALOG = {json.dumps(seed, indent=2)};

app.get('/api/integration/catalog', (req, res) => {{
  res.json({{ ok: true, integrations: INTEGRATION_CATALOG }});
}});

app.post('/api/integration/:id/sync', (req, res) => {{
  const item = INTEGRATION_CATALOG.find(i => i.id === req.params.id);
  if (!item) return res.status(404).json({{ ok: false, error: {json.dumps("Integration not found")} }});
  item.lastSync = Date.now();
  item.status = 'healthy';
  res.json({{ ok: true, integration: item }});
}});

app.post('/api/integration/:id/error', (req, res) => {{
  const item = INTEGRATION_CATALOG.find(i => i.id === req.params.id);
  if (!item) return res.status(404).json({{ ok: false, error: {json.dumps("Integration not found")} }});
  item.errorCount += 1;
  item.status = item.errorCount >= 3 ? 'degraded' : 'warning';
  res.json({{ ok: true, integration: item }});
}});

app.get('/api/integration/health', (req, res) => {{
  const healthy = INTEGRATION_CATALOG.filter(i => i.status === 'healthy').length;
  res.json({{ ok: true, total: INTEGRATION_CATALOG.length, healthy, degraded: INTEGRATION_CATALOG.length - healthy }});
}});
"""
    return insert_block("/api/integration/catalog", code, "Phase 7 (Integration Hub)")


def build_phase8_governance():
    """Phase 8 - Governance. Audit trail + risk register, real append-only log."""
    code = f"""// ── PHASE 8: GOVERNANCE & COMPLIANCE ───────────────────────────────────────────
const GOVERNANCE_AUDIT_LOG = [];
const GOVERNANCE_RISK_REGISTER = [];

function governanceId(prefix) {{
  return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
}}

app.post('/api/governance/audit', (req, res) => {{
  const {{ actor, action, resource, vertical }} = req.body || {{}};
  if (!actor || !action) return res.status(400).json({{ ok: false, error: {json.dumps("actor and action required")} }});
  const entry = {{ id: governanceId('audit'), actor, action, resource: resource || null, vertical: vertical || null, ts: Date.now() }};
  GOVERNANCE_AUDIT_LOG.push(entry);
  res.json({{ ok: true, entry }});
}});

app.get('/api/governance/audit', (req, res) => {{
  const {{ vertical, limit }} = req.query;
  let entries = GOVERNANCE_AUDIT_LOG;
  if (vertical) entries = entries.filter(e => e.vertical === vertical);
  entries = entries.slice(-1 * (parseInt(limit, 10) || 100));
  res.json({{ ok: true, entries }});
}});

app.post('/api/governance/risk', (req, res) => {{
  const {{ title, severity, owner, vertical }} = req.body || {{}};
  if (!title || !severity) return res.status(400).json({{ ok: false, error: {json.dumps("title and severity required")} }});
  const risk = {{ id: governanceId('risk'), title, severity, owner: owner || 'Unassigned', vertical: vertical || null, status: 'OPEN', createdAt: Date.now() }};
  GOVERNANCE_RISK_REGISTER.push(risk);
  res.json({{ ok: true, risk }});
}});

app.get('/api/governance/risk', (req, res) => {{
  res.json({{ ok: true, risks: GOVERNANCE_RISK_REGISTER }});
}});

app.post('/api/governance/risk/:id/resolve', (req, res) => {{
  const risk = GOVERNANCE_RISK_REGISTER.find(r => r.id === req.params.id);
  if (!risk) return res.status(404).json({{ ok: false, error: {json.dumps("Risk not found")} }});
  risk.status = 'RESOLVED';
  risk.resolvedAt = Date.now();
  res.json({{ ok: true, risk }});
}});
"""
    return insert_block("/api/governance/audit", code, "Phase 8 (Governance)")


def build_phase10_digital_twin():
    """Phase 10 - Digital Twin. Read-only rollup across existing verticals -- no new fake data source."""
    code = f"""// ── PHASE 10: ENTERPRISE DIGITAL TWIN ──────────────────────────────────────────
// Rolls up existing WIP + Governance + MDM state into one executive snapshot.
// Deliberately does NOT invent a parallel simulation dataset -- it reflects
// the same state every other war room already writes to, so the numbers
// stay consistent everywhere they're shown.
app.get('/api/digital-twin/snapshot', (req, res) => {{
  const wipVerticals = Object.keys(typeof WIP_DECISIONS !== 'undefined' ? WIP_DECISIONS : {{}});
  const openRisks = (typeof GOVERNANCE_RISK_REGISTER !== 'undefined' ? GOVERNANCE_RISK_REGISTER : [])
    .filter(r => r.status === 'OPEN').length;
  const mdmDomains = typeof MDM_SEED_DATA !== 'undefined' ? Object.keys(MDM_SEED_DATA) : [];

  res.json({{
    ok: true,
    generatedAt: Date.now(),
    wip: {{ verticalsTracked: wipVerticals.length, verticals: wipVerticals }},
    governance: {{ openRisks }},
    mdm: {{ domainsTracked: mdmDomains.length, domains: mdmDomains }},
  }});
}});
"""
    return insert_block("/api/digital-twin/snapshot", code, "Phase 10 (Digital Twin)")


PHASE_BUILDERS = [
    build_phase6_mdm,
    build_phase7_integration,
    build_phase8_governance,
    build_phase10_digital_twin,
]


def add_vertical_config_entries():
    """Add mdm/integration/governance/digitaltwin entries to VERTICAL_CONFIG in both
    tsm-auto-pipeline.js copies -- matching the real, existing object shape exactly."""
    entries = {
        "mdm": {
            "stratUrl": "/html/mdm-suite/mdm-strategist.html",
            "execUrl": "/html/mdm-suite/mdm-exec-portal.html",
            "relayKey": "TSM_MDM_WAR_RELAY",
            "stratRelayKey": "TSM_MDM_STRAT_RELAY",
        },
        "integration": {
            "stratUrl": "/html/integration-hub/integration-strategist.html",
            "execUrl": "/html/integration-hub/integration-exec-portal.html",
            "relayKey": "TSM_INTEGRATION_WAR_RELAY",
            "stratRelayKey": "TSM_INTEGRATION_STRAT_RELAY",
        },
        "governance": {
            "stratUrl": "/html/governance-suite/governance-strategist.html",
            "execUrl": "/html/governance-suite/governance-exec-portal.html",
            "relayKey": "TSM_GOVERNANCE_WAR_RELAY",
            "stratRelayKey": "TSM_GOVERNANCE_STRAT_RELAY",
        },
        "digitaltwin": {
            "stratUrl": "/html/digital-twin/digital-twin-strategist.html",
            "execUrl": "/html/digital-twin/digital-twin-exec-portal.html",
            "relayKey": "TSM_DIGITALTWIN_WAR_RELAY",
            "stratRelayKey": "TSM_DIGITALTWIN_STRAT_RELAY",
        },
    }

    ok = True
    for pf in PIPELINE_FILES:
        if not pf.exists():
            print(f"SKIP: {pf} not found.", file=sys.stderr)
            ok = False
            continue

        content = pf.read_text()
        marker = "  };\n\n  // ─── Read pipeline flag ───"
        if marker not in content:
            print(f"ABORT: VERTICAL_CONFIG closing anchor not found in {pf}. Refusing to blind-append.", file=sys.stderr)
            ok = False
            continue

        additions = []
        for key, cfg in entries.items():
            if f"{key}: {{" in content:
                print(f"SKIP: '{key}' already in VERTICAL_CONFIG ({pf}).")
                continue
            block = (
                f"    {key}: {{\n"
                f"      fireEngines:        () => typeof fireEngines === 'function' && fireEngines(),\n"
                f"      escalateToStrat:    () => typeof escalateToStrategist === 'function' && escalateToStrategist(),\n"
                f"      escalateToExec:     () => typeof escalateToExec === 'function' ? escalateToExec() : (window.location.href = {json.dumps(cfg['execUrl'])}),\n"
                f"      stratUrl:           {json.dumps(cfg['stratUrl'])},\n"
                f"      execUrl:            {json.dumps(cfg['execUrl'])},\n"
                f"      relayKey:           {json.dumps(cfg['relayKey'])},\n"
                f"      stratRelayKey:      {json.dumps(cfg['stratRelayKey'])},\n"
                f"    }},\n"
            )
            additions.append(block)

        if not additions:
            continue

        new_content = content.replace(marker, "".join(additions) + marker, 1)
        pf.write_text(new_content)

        result = subprocess.run(["node", "--check", str(pf)], capture_output=True, text=True)
        if result.returncode != 0:
            print(f"SYNTAX ERROR in {pf} after edit -- restoring original.\n{result.stderr}", file=sys.stderr)
            pf.write_text(content)
            ok = False
        else:
            print(f"OK: VERTICAL_CONFIG updated in {pf}.")

    return ok


def main():
    if not SERVER_JS.exists():
        print("ABORT: run this from the repo root (server.js not found here).", file=sys.stderr)
        sys.exit(1)

    if not check_syntax():
        print("ABORT: server.js is already broken before this script touched it. Fix or `git checkout -- server.js` first.", file=sys.stderr)
        sys.exit(1)

    backup()
    print("Backed up current server.js -> server.js.bak\n")

    all_ok = True
    for builder in PHASE_BUILDERS:
        if not builder():
            all_ok = False
            print(f"Stopping after failure in {builder.__name__}. server.js left in last-good state.", file=sys.stderr)
            break

    if all_ok:
        print("\nAll 4 server.js phases inserted and verified.\n")
        if not add_vertical_config_entries():
            print("server.js is fine; VERTICAL_CONFIG update had issues -- check output above.", file=sys.stderr)
    else:
        sys.exit(1)

    print("\nDone. Run:")
    print("  node --check server.js   # final confirm")
    print("  git diff --stat            # review changed files")


if __name__ == "__main__":
    main()
#!/usr/bin/env bash
set -euo pipefail

TS=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backup_cpq_complete_${TS}"
mkdir -p "$BACKUP_DIR"

# ── Guard ─────────────────────────────────────────────────────────────────────
for f in server.js html/tsm-wip-command-center.html html/cpq-war-room.html; do
  [ -f "$f" ] || { echo "ERROR: $f not found — run from repo root"; exit 1; }
done

cp server.js "$BACKUP_DIR/server.js.bak"
cp html/tsm-wip-command-center.html "$BACKUP_DIR/tsm-wip-command-center.html.bak"
echo "Backups saved to $BACKUP_DIR"

# ── 1. Create directory structure ─────────────────────────────────────────────
mkdir -p html/runtime/kernel
mkdir -p html/war-rooms/cpq/data
mkdir -p html/war-rooms/cpq/services
mkdir -p html/js/core

# ── 2. Stub files CPQ loads but don't exist ───────────────────────────────────
cat > html/runtime/kernel/canonical-core.js << 'EOF'
/* TSM Canonical Core — platform foundation stub
   CPQ engine and war rooms load this for shared utilities.
   Extend as the platform grows. */
window.TSMCore = window.TSMCore || {
  version: '1.0.0',
  log: (msg) => console.log('[TSMCore]', msg)
};
EOF

for stub in tsm-event-bus tsm-state tsm-mission-engine tsm-auto-pipeline; do
cat > "html/js/core/${stub}.js" << STUBEOF
/* TSM ${stub} — stub loaded by CPQ and future war rooms */
window.TSMEventBus = window.TSMEventBus || {
  _handlers: {},
  on: function(evt, fn) { (this._handlers[evt] = this._handlers[evt] || []).push(fn); },
  emit: function(evt, data) { (this._handlers[evt] || []).forEach(fn => fn(data)); }
};
STUBEOF
done
echo "Created stubs: canonical-core.js + 4 js/core files"

# ── 3. CPQ Model JSON ─────────────────────────────────────────────────────────
cat > html/war-rooms/cpq/data/cpq-model.json << 'EOF'
{
  "version": "1.0.0",
  "entities": {
    "quote": {
      "stages": [
        { "id": "draft",      "label": "Draft",            "order": 1 },
        { "id": "configured", "label": "Configured",       "order": 2 },
        { "id": "priced",     "label": "Priced",           "order": 3 },
        { "id": "review",     "label": "Under Review",     "order": 4 },
        { "id": "approval",   "label": "Pending Approval", "order": 5 },
        { "id": "sent",       "label": "Sent to Customer", "order": 6 },
        { "id": "negotiation","label": "Negotiation",      "order": 7 },
        { "id": "won",        "label": "Won",              "order": 8 },
        { "id": "lost",       "label": "Lost",             "order": 9 }
      ]
    }
  },
  "kpis": [
    { "id": "open_quotes",       "label": "Open Quotes",      "unit": "count" },
    { "id": "quote_value",       "label": "Pipeline Value",   "unit": "usd"   },
    { "id": "avg_discount_pct",  "label": "Avg Discount",     "unit": "pct"   },
    { "id": "sla_breach_count",  "label": "SLA Breaches",     "unit": "count" },
    { "id": "approval_pending",  "label": "Pending Approval", "unit": "count" },
    { "id": "win_rate",          "label": "Win Rate",         "unit": "pct"   }
  ],
  "compatibility_rules": [
    { "sku_a": "BMS-CORE-002", "sku_b": "LEGACY-CTL-099", "type": "incompatible", "reason": "Legacy controller conflicts with BMS network layer" },
    { "sku_a": "FIRE-DET-004", "sku_b": "ACCESS-005",     "type": "requires",     "reason": "Fire detection requires access control integration module" }
  ],
  "sample_data": {
    "discount_policy": {
      "auto_approve_max_pct": 15,
      "margin_floor_pct": 28
    },
    "sla_hours_by_stage": {
      "Draft": 24,
      "Configured": 48,
      "Priced": 48,
      "Under Review": 72,
      "Pending Approval": 48,
      "Sent to Customer": 120,
      "Negotiation": 168
    },
    "products": [
      { "sku": "HVAC-ENT-001",  "name": "Enterprise HVAC Control Suite",   "list_price": 48000 },
      { "sku": "BMS-CORE-002",  "name": "Building Management System Core", "list_price": 72000 },
      { "sku": "SEC-CAM-003",   "name": "IP Security Camera Array (32ch)", "list_price": 18500 },
      { "sku": "FIRE-DET-004",  "name": "Intelligent Fire Detection System","list_price": 24000 },
      { "sku": "ACCESS-005",    "name": "Enterprise Access Control Platform","list_price": 31000 },
      { "sku": "FORGE-ANA-006", "name": "Forge Analytics Platform (1yr)",  "list_price": 36000 },
      { "sku": "LEGACY-CTL-099","name": "Legacy Controller Module",        "list_price": 4200  }
    ],
    "quotes": [
      {
        "quote_id": "Q-2026-0041",
        "name": "Phoenix Convention Center — Full BMS",
        "stage": "Pending Approval",
        "stage_entered_at": "2026-06-23T09:00:00Z",
        "net_value": 142000,
        "list_value": 180000,
        "discount_pct": 21,
        "margin_pct": 31,
        "needs_approval": true,
        "skus": ["BMS-CORE-002","HVAC-ENT-001","FORGE-ANA-006"]
      },
      {
        "quote_id": "Q-2026-0038",
        "name": "Mesa Industrial Park — Security & Access",
        "stage": "Negotiation",
        "stage_entered_at": "2026-06-18T14:00:00Z",
        "net_value": 38500,
        "list_value": 49500,
        "discount_pct": 22,
        "margin_pct": 26,
        "needs_approval": true,
        "skus": ["SEC-CAM-003","ACCESS-005"]
      },
      {
        "quote_id": "Q-2026-0044",
        "name": "Scottsdale Campus — Fire Detection",
        "stage": "Sent to Customer",
        "stage_entered_at": "2026-06-20T11:30:00Z",
        "net_value": 22800,
        "list_value": 24000,
        "discount_pct": 5,
        "margin_pct": 38,
        "needs_approval": false,
        "skus": ["FIRE-DET-004"]
      },
      {
        "quote_id": "Q-2026-0047",
        "name": "Tempe University — Forge Analytics",
        "stage": "Under Review",
        "stage_entered_at": "2026-06-26T08:00:00Z",
        "net_value": 32400,
        "list_value": 36000,
        "discount_pct": 10,
        "margin_pct": 44,
        "needs_approval": false,
        "skus": ["FORGE-ANA-006"]
      },
      {
        "quote_id": "Q-2026-0049",
        "name": "Glendale Data Center — HVAC + BMS",
        "stage": "Configured",
        "stage_entered_at": "2026-06-28T16:00:00Z",
        "net_value": 97500,
        "list_value": 120000,
        "discount_pct": 19,
        "margin_pct": 29,
        "needs_approval": true,
        "skus": ["HVAC-ENT-001","BMS-CORE-002"]
      },
      {
        "quote_id": "Q-2026-0051",
        "name": "Chandler Retail — Access Only",
        "stage": "Draft",
        "stage_entered_at": "2026-06-29T10:00:00Z",
        "net_value": 28000,
        "list_value": 31000,
        "discount_pct": 10,
        "margin_pct": 36,
        "needs_approval": false,
        "skus": ["ACCESS-005"]
      }
    ]
  }
}
EOF
echo "Created cpq-model.json"

# ── 4. CPQ Engine JS ──────────────────────────────────────────────────────────
cat > html/war-rooms/cpq/services/cpq-engine.js << 'EOF'
/* TSM CPQ Engine v1.0
   Handles quote lifecycle, compatibility rules, discount evaluation,
   SLA breach detection, AI analysis, and strategist relay.
   Loaded by cpq-war-room.html after canonical-core.js */

class TSMCPQEngine {
  constructor(model) {
    this.model = model || {};
    this.quotes = [];
    this.products = [];
    this._storageKey = 'TSM_CPQ_STATE';
  }

  /* ── Persistence ────────────────────────────────────────────────────────── */
  loadFromStorage() {
    try {
      const raw = localStorage.getItem(this._storageKey);
      if (!raw) return false;
      const s = JSON.parse(raw);
      this.quotes   = s.quotes   || [];
      this.products = s.products || [];
      return this.quotes.length > 0;
    } catch(e) { return false; }
  }

  saveToStorage() {
    try {
      localStorage.setItem(this._storageKey,
        JSON.stringify({ quotes: this.quotes, products: this.products, savedAt: Date.now() }));
    } catch(e) { console.warn('[CPQEngine] localStorage write failed', e); }
  }

  clearStorage() {
    try { localStorage.removeItem(this._storageKey); } catch(e) {}
    this.quotes = [];
    this.products = [];
  }

  loadSampleData() {
    const sd = this.model.sample_data || {};
    this.products = (sd.products || []).map(p => ({ ...p }));
    this.quotes   = (sd.quotes   || []).map(q => ({ ...q }));
  }

  /* ── KPI Computation ────────────────────────────────────────────────────── */
  computeKpis() {
    const activeStages = ['Draft','Configured','Priced','Under Review',
                          'Pending Approval','Sent to Customer','Negotiation'];
    const open = this.quotes.filter(q => activeStages.includes(q.stage));
    const totalValue = open.reduce((s, q) => s + (Number(q.net_value) || 0), 0);
    const avgDisc = open.length
      ? Math.round(open.reduce((s, q) => s + (Number(q.discount_pct) || 0), 0) / open.length * 10) / 10
      : 0;
    const breaches = this.getSlaBreaches();
    const pendingApproval = this.quotes.filter(q => q.needs_approval &&
      ['Under Review','Pending Approval'].includes(q.stage)).length;
    const won  = this.quotes.filter(q => q.stage === 'Won').length;
    const closed = this.quotes.filter(q => ['Won','Lost'].includes(q.stage)).length;
    return {
      open_quotes:      open.length,
      quote_value:      totalValue,
      avg_discount_pct: avgDisc,
      sla_breach_count: breaches.length,
      approval_pending: pendingApproval,
      win_rate:         closed ? Math.round(won / closed * 100) : 0
    };
  }

  getStageDistribution() {
    const stages = (this.model.entities?.quote?.stages || []);
    const dist = {};
    stages.forEach(s => { dist[s.id] = { count: 0, value: 0, label: s.label }; });
    this.quotes.forEach(q => {
      const s = stages.find(st => st.label === q.stage);
      if (s) {
        dist[s.id].count++;
        dist[s.id].value += Number(q.net_value) || 0;
      }
    });
    return dist;
  }

  getSlaBreaches() {
    const slaMap = this.model.sample_data?.sla_hours_by_stage || {};
    const now = Date.now();
    const closed = ['Won','Lost'];
    return this.quotes
      .filter(q => !closed.includes(q.stage) && q.stage_entered_at)
      .map(q => {
        const sla = Number(slaMap[q.stage]) || 72;
        const hoursIn = (now - new Date(q.stage_entered_at).getTime()) / 3_600_000;
        return { quote_id: q.quote_id, stage: q.stage, hours_over: Math.round(hoursIn - sla) };
      })
      .filter(b => b.hours_over > 0);
  }

  /* ── Rules Engine ───────────────────────────────────────────────────────── */
  checkCompatibility(skus) {
    const rules = this.model.compatibility_rules || [];
    const conflicts = [];
    rules.forEach(rule => {
      const hasA = skus.includes(rule.sku_a);
      const hasB = skus.includes(rule.sku_b);
      if (rule.type === 'incompatible' && hasA && hasB) {
        conflicts.push({ sku: rule.sku_b, reason: rule.reason || `Incompatible with ${rule.sku_a}` });
      }
    });
    return { compatible: conflicts.length === 0, conflicts };
  }

  evaluateDiscount(listValue, netValue, costBasisPct) {
    const policy  = this.model.sample_data?.discount_policy || {};
    const discPct = listValue > 0
      ? Math.round((1 - netValue / listValue) * 1000) / 10
      : 0;
    const needsApproval = discPct > (Number(policy.auto_approve_max_pct) || 15);
    let marginPct = null, belowFloor = false;
    if (costBasisPct != null && listValue > 0) {
      const cost = listValue * costBasisPct;
      marginPct = Math.round((netValue - cost) / netValue * 1000) / 10;
      belowFloor = marginPct < (Number(policy.margin_floor_pct) || 28);
    }
    return { discount_pct: discPct, needs_approval: needsApproval,
             margin_pct: marginPct, below_margin_floor: belowFloor };
  }

  /* ── AI Analysis ────────────────────────────────────────────────────────── */
  async runAnalysis() {
    const kpis           = this.computeKpis();
    const sla_breaches   = this.getSlaBreaches();
    const stage_distribution = this.getStageDistribution();
    const res = await fetch('/api/cpq/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quotes: this.quotes, kpis, sla_breaches,
                             stage_distribution, maxTokens: 1200 })
    });
    if (!res.ok) throw new Error(`/api/cpq/query returned ${res.status}`);
    return res.json();
  }

  /* ── Strategist Relay ───────────────────────────────────────────────────── */
  buildRelayPayload(aiText) {
    return {
      vertical:      'cpq',
      quotes:        this.quotes,
      kpis:          this.computeKpis(),
      sla_breaches:  this.getSlaBreaches(),
      ai_analysis:   aiText,
      timestamp:     new Date().toISOString()
    };
  }
}
EOF
echo "Created cpq-engine.js"

# ── 5. Patch server.js (Python — reliable for multi-line) ─────────────────────
python3 << 'PYEOF'
import sys

with open('server.js', 'r') as f:
    src = f.read()

# ── 5a. Add SP.cpq after SP.crm ──────────────────────────────────────────────
CPQ_SP = "  cpq: 'You are a CPQ (Configure-Price-Quote) operations AI for TSM Command. Expert in product configuration, compatibility rules, discount policy, margin management, quote lifecycle, and approval workflows. Given structured quote pipeline, KPI, and SLA-breach data, identify configuration conflicts, margin risks, stalled quotes, and the specific next action per at-risk quote. Reference quote IDs. Be precise and operational. No preamble.',"

ANCHOR_CRM = "  crm: 'You are a CRM customer-lifecycle AI for TSM Command."
if CPQ_SP in src:
    print('[server.js] SP.cpq already present — skipping')
elif ANCHOR_CRM not in src:
    print('ERROR: Could not find SP.crm anchor in server.js', file=sys.stderr)
    sys.exit(1)
else:
    # Find the end of the crm line and insert after it
    idx = src.index(ANCHOR_CRM)
    end_of_line = src.index('\n', idx)
    src = src[:end_of_line+1] + CPQ_SP + '\n' + src[end_of_line+1:]
    print('[server.js] Added SP.cpq')

# ── 5b. Add /api/cpq/query route after /api/crm/query block ──────────────────
CPQ_ROUTE = """
app.post('/api/cpq/query', async (req, res) => {
  const { quotes, kpis, sla_breaches, stage_distribution, context, maxTokens } = req.body || {};
  if (!Array.isArray(quotes)) return res.status(400).json({ ok: false, error: 'quotes array required' });
  const summary = JSON.stringify({ kpis, sla_breaches, stage_distribution, quote_count: quotes.length }, null, 2);
  const prompt = `Current CPQ pipeline snapshot:\\n${summary}\\n\\n` +
    (context ? `Additional context: ${context}\\n\\n` : '') +
    `Identify the top risks across the quote pipeline, root causes of any SLA breaches or margin violations, and the single most important next action for each at-risk quote. Reference quote IDs. Be specific and operational.`;
  try {
    const answer = await groqChat(SP.cpq, prompt, maxTokens || 1200);
    return res.json({ ok: true, answer, createdAt: new Date().toISOString() });
  } catch (e) {
    console.error('CPQ GROQ ERROR:', e.message);
    return res.status(500).json({ ok: false, error: e.message });
  }
});
"""

CPQ_ROUTE_ANCHOR = "app.post('/api/cpq/query'"
CRM_ROUTE_END    = "    console.error('CRM GROQ ERROR:', e.message);\n    return res.status(500).json({ ok: false, error: e.message });\n  }\n});"

if CPQ_ROUTE_ANCHOR in src:
    print('[server.js] /api/cpq/query already present — skipping')
elif CRM_ROUTE_END not in src:
    print('ERROR: Could not find CRM route end anchor', file=sys.stderr)
    sys.exit(1)
else:
    idx = src.index(CRM_ROUTE_END) + len(CRM_ROUTE_END)
    src = src[:idx] + '\n' + CPQ_ROUTE + src[idx:]
    print('[server.js] Added /api/cpq/query route')

# ── 5c. Add 'cpq' to COLLECTIVE_VERTICALS ────────────────────────────────────
OLD_CV = "const COLLECTIVE_VERTICALS = ['healthcare', 'finops', 'bpo', 'legal', 'real-estate', 'insurance', 'construction', 'o2c', 'crm'];"
NEW_CV = "const COLLECTIVE_VERTICALS = ['healthcare', 'finops', 'bpo', 'legal', 'real-estate', 'insurance', 'construction', 'o2c', 'crm', 'cpq'];"

if "'cpq'" in src and 'COLLECTIVE_VERTICALS' in src:
    print('[server.js] cpq already in COLLECTIVE_VERTICALS — skipping')
elif OLD_CV in src:
    src = src.replace(OLD_CV, NEW_CV, 1)
    print('[server.js] Added cpq to COLLECTIVE_VERTICALS')
else:
    print('WARNING: COLLECTIVE_VERTICALS line not found verbatim — check manually', file=sys.stderr)

with open('server.js', 'w') as f:
    f.write(src)

print('[server.js] All patches applied')
PYEOF

# ── 6. Patch WIP Command Center — add CPQ to VERTICALS array ─────────────────
python3 << 'PYEOF'
import sys

with open('html/tsm-wip-command-center.html', 'r') as f:
    src = f.read()

OLD_LAST = "  { id:'construction', label:'Construction',    warRoom:'/html/construction-suite/construction-war-room.html' }"
NEW_LAST  = "  { id:'construction', label:'Construction',    warRoom:'/html/construction-suite/construction-war-room.html' },\n  { id:'cpq',          label:'CPQ',             warRoom:'/html/cpq-war-room.html' }"

if "id:'cpq'" in src:
    print('[wip] CPQ already in VERTICALS — skipping')
elif OLD_LAST in src:
    src = src.replace(OLD_LAST, NEW_LAST, 1)
    print('[wip] Added CPQ to VERTICALS')
    with open('html/tsm-wip-command-center.html', 'w') as f:
        f.write(src)
else:
    print('WARNING: construction VERTICALS entry not found verbatim — check manually', file=sys.stderr)
PYEOF

# ── 7. Verify key outputs ─────────────────────────────────────────────────────
echo ""
echo "=== VERIFICATION ==="
echo "--- SP.cpq in server.js ---"
grep -n "cpq:" server.js | head -5

echo "--- /api/cpq/query in server.js ---"
grep -n "cpq/query" server.js | head -5

echo "--- COLLECTIVE_VERTICALS ---"
grep -n "COLLECTIVE_VERTICALS" server.js | head -3

echo "--- CPQ in WIP Command Center ---"
grep -n "cpq" html/tsm-wip-command-center.html | head -5

echo "--- Files created ---"
ls -la html/runtime/kernel/canonical-core.js
ls -la html/war-rooms/cpq/data/cpq-model.json
ls -la html/war-rooms/cpq/services/cpq-engine.js
ls -la html/js/core/

echo ""
echo "--- Diff: server.js (first 60 changed lines) ---"
diff "$BACKUP_DIR/server.js.bak" server.js | head -60 || true
echo "--- Diff: tsm-wip-command-center.html ---"
diff "$BACKUP_DIR/tsm-wip-command-center.html.bak" html/tsm-wip-command-center.html || true

echo ""
echo "All done. Review verification output above, then:"
echo "  git add -A && git commit -m 'feat: CPQ war room fully wired — engine, model, API route, WIP tab'"
echo "  fly deploy -a tsm-consultz"
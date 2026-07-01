#!/usr/bin/env bash
set -euo pipefail

TS=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backup_o2c_build_${TS}"
mkdir -p "$BACKUP_DIR"

[ -f server.js ] || { echo "ERROR: run from repo root"; exit 1; }
cp server.js "$BACKUP_DIR/server.js.bak"

mkdir -p html/war-rooms/o2c/data
mkdir -p html/war-rooms/o2c/services

# ── 1. O2C Data Model ─────────────────────────────────────────────────────────
cat > html/war-rooms/o2c/data/o2c-model.json << 'EOF'
{
  "version": "1.0.0",
  "entities": {
    "order": {
      "stages": [
        { "id": "inquiry",    "label": "Inquiry",         "order": 1 },
        { "id": "credit",     "label": "Credit Check",    "order": 2 },
        { "id": "confirmed",  "label": "Order Confirmed", "order": 3 },
        { "id": "allocated",  "label": "ATP / Allocated", "order": 4 },
        { "id": "warehouse",  "label": "Warehouse",       "order": 5 },
        { "id": "shipped",    "label": "Shipped",         "order": 6 },
        { "id": "delivered",  "label": "Delivered",       "order": 7 },
        { "id": "invoiced",   "label": "Invoiced",        "order": 8 },
        { "id": "collected",  "label": "Collected",       "order": 9 },
        { "id": "closed",     "label": "Closed",          "order": 10 }
      ]
    }
  },
  "kpis": [
    { "id": "open_orders",      "label": "Open Orders",      "unit": "count" },
    { "id": "order_value",      "label": "Order Value",      "unit": "usd"   },
    { "id": "sla_breach_count", "label": "SLA Breaches",     "unit": "count" },
    { "id": "ar_open",          "label": "AR Open",          "unit": "usd"   },
    { "id": "avg_cycle_days",   "label": "Avg Cycle (days)", "unit": "count" },
    { "id": "on_time_pct",      "label": "On-Time Delivery", "unit": "pct"   }
  ],
  "sla_hours_by_stage": {
    "Inquiry":         4,
    "Credit Check":    8,
    "Order Confirmed": 24,
    "ATP / Allocated": 48,
    "Warehouse":       72,
    "Shipped":         96,
    "Delivered":       24,
    "Invoiced":        48
  },
  "sample_data": {
    "orders": [
      {
        "order_id": "SO-2026-0091",
        "customer": "Phoenix Convention Center",
        "stage": "Invoiced",
        "stage_entered_at": "2026-06-24T09:00:00Z",
        "order_value": 142000,
        "ar_balance": 142000,
        "credit_approved": true,
        "on_time": true,
        "cycle_days": 6,
        "origin": "cpq",
        "cpq_quote_id": "Q-2026-0041"
      },
      {
        "order_id": "SO-2026-0087",
        "customer": "Mesa Industrial Park",
        "stage": "Shipped",
        "stage_entered_at": "2026-06-22T14:00:00Z",
        "order_value": 38500,
        "ar_balance": 0,
        "credit_approved": true,
        "on_time": false,
        "cycle_days": 8,
        "origin": "cpq",
        "cpq_quote_id": "Q-2026-0038"
      },
      {
        "order_id": "SO-2026-0094",
        "customer": "Tempe University",
        "stage": "ATP / Allocated",
        "stage_entered_at": "2026-06-27T08:00:00Z",
        "order_value": 32400,
        "ar_balance": 0,
        "credit_approved": true,
        "on_time": true,
        "cycle_days": 3,
        "origin": "direct",
        "cpq_quote_id": null
      },
      {
        "order_id": "SO-2026-0096",
        "customer": "Glendale Data Center",
        "stage": "Credit Check",
        "stage_entered_at": "2026-06-29T16:00:00Z",
        "order_value": 97500,
        "ar_balance": 0,
        "credit_approved": false,
        "on_time": true,
        "cycle_days": 1,
        "origin": "cpq",
        "cpq_quote_id": "Q-2026-0049"
      },
      {
        "order_id": "SO-2026-0098",
        "customer": "Scottsdale Campus",
        "stage": "Warehouse",
        "stage_entered_at": "2026-06-25T11:00:00Z",
        "order_value": 22800,
        "ar_balance": 0,
        "credit_approved": true,
        "on_time": true,
        "cycle_days": 5,
        "origin": "cpq",
        "cpq_quote_id": "Q-2026-0044"
      }
    ]
  }
}
EOF
echo "Created o2c-model.json"

# ── 2. O2C Engine ─────────────────────────────────────────────────────────────
cat > html/war-rooms/o2c/services/o2c-engine.js << 'EOF'
/* TSM O2C Engine v1.0
   Order-to-Cash lifecycle: Inquiry → Credit → Confirmed → ATP →
   Warehouse → Shipped → Delivered → Invoiced → Collected → Closed.
   Reads CPQ relay payload to import Won quotes as new orders. */

class TSMO2CEngine {
  constructor(model) {
    this.model  = model || {};
    this.orders = [];
    this._storageKey = 'TSM_O2C_STATE';
  }

  /* ── Persistence ────────────────────────────────────────────────────────── */
  loadFromStorage() {
    try {
      const raw = localStorage.getItem(this._storageKey);
      if (!raw) return false;
      const s = JSON.parse(raw);
      this.orders = s.orders || [];
      return this.orders.length > 0;
    } catch(e) { return false; }
  }

  saveToStorage() {
    try {
      localStorage.setItem(this._storageKey,
        JSON.stringify({ orders: this.orders, savedAt: Date.now() }));
    } catch(e) {}
  }

  clearStorage() {
    try { localStorage.removeItem(this._storageKey); } catch(e) {}
    this.orders = [];
  }

  loadSampleData() {
    this.orders = (this.model.sample_data?.orders || []).map(o => ({ ...o }));
  }

  /* ── CPQ Relay Import ───────────────────────────────────────────────────── */
  checkCPQRelay() {
    try {
      const raw = localStorage.getItem('TSM_CPQ_RELAY') ||
                  sessionStorage.getItem('TSM_CPQ_RELAY');
      if (!raw) return null;
      const relay = JSON.parse(raw);
      const wonQuotes = (relay.quotes || []).filter(q => q.stage === 'Won');
      const existingCPQIds = new Set(
        this.orders.filter(o => o.cpq_quote_id).map(o => o.cpq_quote_id)
      );
      const newQuotes = wonQuotes.filter(q => !existingCPQIds.has(q.quote_id));
      return newQuotes.length > 0 ? { relay, newQuotes } : null;
    } catch(e) { return null; }
  }

  importFromCPQ(quotes) {
    const now = new Date().toISOString();
    const imported = quotes.map((q, i) => ({
      order_id:        `SO-${Date.now()}-${String(i+1).padStart(3,'0')}`,
      customer:        q.name || q.customer || 'Unknown Customer',
      stage:           'Order Confirmed',
      stage_entered_at: now,
      order_value:     q.net_value || 0,
      ar_balance:      0,
      credit_approved: true,
      on_time:         true,
      cycle_days:      0,
      origin:          'cpq',
      cpq_quote_id:    q.quote_id
    }));
    this.orders.unshift(...imported);
    this.saveToStorage();
    return imported;
  }

  /* ── KPI Computation ────────────────────────────────────────────────────── */
  computeKpis() {
    const closedStages = ['Closed'];
    const active = this.orders.filter(o => !closedStages.includes(o.stage));
    const totalValue = active.reduce((s, o) => s + (Number(o.order_value) || 0), 0);
    const arOpen = this.orders.reduce((s, o) => s + (Number(o.ar_balance) || 0), 0);
    const breaches = this.getSlaBreaches();
    const delivered = this.orders.filter(o =>
      ['Delivered','Invoiced','Collected','Closed'].includes(o.stage));
    const onTime = delivered.filter(o => o.on_time).length;
    const avgCycle = this.orders.filter(o => o.cycle_days > 0).length
      ? Math.round(this.orders.filter(o => o.cycle_days > 0)
          .reduce((s, o) => s + o.cycle_days, 0) /
          this.orders.filter(o => o.cycle_days > 0).length * 10) / 10
      : 0;
    return {
      open_orders:      active.length,
      order_value:      totalValue,
      sla_breach_count: breaches.length,
      ar_open:          arOpen,
      avg_cycle_days:   avgCycle,
      on_time_pct:      delivered.length
        ? Math.round(onTime / delivered.length * 100) : 100
    };
  }

  getStageDistribution() {
    const stages = this.model.entities?.order?.stages || [];
    const dist = {};
    stages.forEach(s => { dist[s.id] = { count: 0, value: 0, label: s.label }; });
    this.orders.forEach(o => {
      const s = stages.find(st => st.label === o.stage);
      if (s) {
        dist[s.id].count++;
        dist[s.id].value += Number(o.order_value) || 0;
      }
    });
    return dist;
  }

  getSlaBreaches() {
    const slaMap = this.model.sla_hours_by_stage || {};
    const closed = ['Collected','Closed'];
    const now = Date.now();
    return this.orders
      .filter(o => !closed.includes(o.stage) && o.stage_entered_at)
      .map(o => {
        const sla = Number(slaMap[o.stage]) || 48;
        const hoursIn = (now - new Date(o.stage_entered_at).getTime()) / 3_600_000;
        return { order_id: o.order_id, customer: o.customer,
                 stage: o.stage, hours_over: Math.round(hoursIn - sla) };
      })
      .filter(b => b.hours_over > 0);
  }

  /* ── AI Analysis ────────────────────────────────────────────────────────── */
  async runAnalysis() {
    const kpis            = this.computeKpis();
    const sla_breaches    = this.getSlaBreaches();
    const stage_distribution = this.getStageDistribution();
    const res = await fetch('/api/o2c/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orders: this.orders, kpis, sla_breaches,
        stage_distribution, maxTokens: 1200
      })
    });
    if (!res.ok) throw new Error(`/api/o2c/query returned ${res.status}`);
    return res.json();
  }

  /* ── Strategist Relay ───────────────────────────────────────────────────── */
  buildRelayPayload(aiText) {
    return {
      vertical:     'o2c',
      orders:       this.orders,
      kpis:         this.computeKpis(),
      sla_breaches: this.getSlaBreaches(),
      ai_analysis:  aiText,
      timestamp:    new Date().toISOString()
    };
  }
}
EOF
echo "Created o2c-engine.js"

# ── 3. O2C War Room HTML ──────────────────────────────────────────────────────
cat > html/war-rooms/o2c/o2c-war-room.html << 'PAGEEOF'
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>TSM O2C War Room</title>
<style>
:root {
  --bg:#0a0f14;--bg2:#0d1420;--bg3:#101828;
  --border:rgba(0,180,255,.12);
  --blue:#00b4ff;--blue-dim:rgba(0,180,255,.6);
  --gold:#ffd700;--red:#ff3b3b;--amber:#ff9500;--green:#22c55e;--purple:#c084fc;
  --text:#c8d8e8;--text-dim:#4a6a8a;--card:#0d1828;
}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--text);font-family:'Courier New',monospace;font-size:12px;min-height:100vh}
.nav{display:flex;align-items:center;gap:0;background:#080d14;border-bottom:1px solid var(--border);height:38px;padding:0 16px}
.nav-brand{color:var(--blue);font-weight:700;font-size:11px;letter-spacing:2px;margin-right:24px}
.nav-right{margin-left:auto;display:flex;align-items:center;gap:16px;color:var(--text-dim);font-size:10px}
.nav-clock{color:var(--blue-dim)}
.alert-bar{background:rgba(255,149,0,.06);border-bottom:1px solid rgba(255,149,0,.2);padding:6px 20px;display:flex;align-items:center;gap:8px;font-size:10px;letter-spacing:1.5px;color:var(--amber)}
.alert-dot{width:6px;height:6px;border-radius:50%;background:var(--amber);box-shadow:0 0 6px var(--amber);animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
.import-banner{background:rgba(0,180,255,.06);border-bottom:1px solid rgba(0,180,255,.25);padding:8px 20px;display:flex;align-items:center;justify-content:space-between;font-size:10px;color:var(--blue)}
.layout{display:grid;grid-template-columns:270px 1fr;height:calc(100vh - 70px)}
.sidebar{background:var(--bg2);border-right:1px solid var(--border);overflow-y:auto;display:flex;flex-direction:column}
.sb-section{padding:14px 16px;border-bottom:1px solid var(--border)}
.sb-label{font-size:9px;letter-spacing:2px;color:var(--text-dim);margin-bottom:8px}
.btn{border:1px solid;font-family:inherit;font-size:9px;letter-spacing:1.5px;cursor:pointer;padding:7px 12px;transition:all .2s}
.btn-blue{background:var(--blue);border-color:var(--blue);color:#000;font-weight:700}
.btn-blue:hover{background:#0090cc}
.btn-outline{background:transparent;border-color:var(--blue);color:var(--blue)}
.btn-ghost{background:transparent;border-color:var(--border);color:var(--text-dim)}
.btn-ghost:hover{border-color:var(--text-dim);color:var(--text)}
.btn-gold{background:var(--gold);border-color:var(--gold);color:#000;font-weight:700}
.btn-green{background:var(--green);border-color:var(--green);color:#000;font-weight:700}
.btn-row{display:flex;gap:6px;flex-wrap:wrap}
.btn-full{width:100%}
.stage-list{display:flex;flex-direction:column;gap:3px}
.stage-item{display:flex;align-items:center;gap:8px;padding:5px 8px;background:var(--bg3);border:1px solid var(--border);font-size:9px}
.stage-num{color:var(--text-dim);width:14px}
.stage-name{flex:1;color:var(--text)}
.stage-count{color:var(--blue);font-weight:700}
.snap-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.snap-item{background:var(--bg3);border:1px solid var(--border);padding:6px 8px}
.snap-label{font-size:8px;color:var(--text-dim);letter-spacing:1px;margin-bottom:3px}
.snap-val{font-size:13px;color:var(--blue);font-weight:700}
.snap-val.warn{color:var(--amber)}
.snap-val.bad{color:var(--red)}
.main{overflow-y:auto;background:var(--bg);padding:18px 22px}
.kpi-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin-bottom:20px}
.kpi-card{background:var(--card);border:1px solid var(--border);padding:12px 10px}
.kpi-label{font-size:8px;letter-spacing:1px;color:var(--text-dim);margin-bottom:6px;text-transform:uppercase}
.kpi-value{font-size:18px;font-weight:700;color:var(--blue)}
.kpi-value.warn{color:var(--amber)}
.kpi-value.bad{color:var(--red)}
.kpi-value.good{color:var(--green)}
.section{background:var(--card);border:1px solid var(--border);margin-bottom:18px}
.section-head{padding:10px 14px;border-bottom:1px solid var(--border);font-size:10px;letter-spacing:1.5px;color:var(--text-dim);display:flex;justify-content:space-between;align-items:center}
.section-body{padding:14px}
.tracker{display:flex;gap:4px;overflow-x:auto;padding-bottom:6px}
.tracker-stage{flex:1;min-width:72px;background:var(--bg3);border:1px solid var(--border);padding:8px 6px;text-align:center}
.tracker-stage.hot{border-color:var(--red);background:rgba(255,59,59,.08)}
.tracker-stage .ts-label{font-size:7px;color:var(--text-dim);letter-spacing:.5px;margin-bottom:4px;min-height:26px}
.tracker-stage .ts-count{font-size:15px;font-weight:700;color:var(--blue)}
.tracker-stage.hot .ts-count{color:var(--red)}
table{width:100%;border-collapse:collapse;font-size:10px}
th{text-align:left;color:var(--text-dim);font-size:8px;letter-spacing:1px;padding:6px 8px;border-bottom:1px solid var(--border)}
td{padding:7px 8px;border-bottom:1px solid var(--border);color:var(--text)}
tr:hover td{background:rgba(0,180,255,.03)}
.tag{display:inline-block;font-size:8px;letter-spacing:1px;padding:2px 6px;border:1px solid}
.tag-high{color:var(--red);border-color:var(--red)}
.tag-medium{color:var(--amber);border-color:var(--amber)}
.tag-ok{color:var(--green);border-color:var(--green)}
.tag-cpq{color:var(--blue);border-color:var(--blue);font-size:7px}
.empty-state{color:var(--text-dim);font-size:10px;padding:20px;text-align:center}
.ai-output{background:var(--bg3);border:1px solid var(--border);padding:12px;font-size:10px;line-height:1.6;color:var(--text);white-space:pre-wrap;min-height:80px}
.ai-output.loading{color:var(--text-dim)}
</style>
</head>
<body>

<div class="nav">
  <div class="nav-brand">TSM SHELL // O2C</div>
  <div class="nav-right">
    <span id="navStatus">ENGINE: IDLE</span>
    <span class="nav-clock" id="navClock">--:--:--</span>
  </div>
</div>

<div class="alert-bar" id="alertBar" style="display:none">
  <span class="alert-dot"></span>
  <span id="alertText">SLA breaches detected in order pipeline.</span>
</div>

<div class="import-banner" id="importBanner" style="display:none">
  <span id="importMsg"></span>
  <button class="btn btn-blue" id="btnImportCPQ" style="padding:4px 12px">IMPORT WON QUOTES →</button>
</div>

<div class="layout">
  <div class="sidebar">
    <div class="sb-section">
      <div class="sb-label">DATA</div>
      <div class="btn-row">
        <button class="btn btn-ghost btn-full" id="btnLoadSample">LOAD SAMPLE DATA</button>
      </div>
      <div class="btn-row" style="margin-top:6px">
        <button class="btn btn-ghost btn-full" id="btnResetData">RESET SAVED DATA</button>
      </div>
    </div>

    <div class="sb-section">
      <div class="sb-label">ORDER STAGES</div>
      <div class="stage-list" id="stageList"></div>
    </div>

    <div class="sb-section">
      <div class="sb-label">SNAPSHOT</div>
      <div class="snap-grid" id="snapGrid"></div>
    </div>

    <div class="sb-section" style="margin-top:auto">
      <div class="btn-row">
        <button class="btn btn-blue btn-full" id="btnRunAnalysis">RUN AI ANALYSIS</button>
      </div>
      <div class="btn-row" style="margin-top:6px">
        <button class="btn btn-gold btn-full" id="btnRelay">RELAY TO STRATEGIST &rarr;</button>
      </div>
    </div>
  </div>

  <div class="main">
    <div style="margin-bottom:16px">
      <div style="font-size:13px;letter-spacing:1px;color:var(--text)">
        ORDER-TO-CASH <b style="color:var(--blue)">WAR ROOM</b>
      </div>
      <div style="color:var(--text-dim);font-size:10px;margin-top:2px">
        Inquiry &rarr; Credit &rarr; Confirm &rarr; ATP &rarr; Ship &rarr; Invoice &rarr; Collect
      </div>
    </div>

    <div class="kpi-grid" id="kpiGrid"></div>

    <div class="section">
      <div class="section-head">
        <span>ORDER PIPELINE</span>
        <span id="trackerMeta"></span>
      </div>
      <div class="section-body">
        <div class="tracker" id="tracker"></div>
      </div>
    </div>

    <div class="section">
      <div class="section-head">
        <span>ORDERS</span>
        <span id="breachMeta"></span>
      </div>
      <div class="section-body" id="orderBody">
        <div class="empty-state">No orders loaded yet.</div>
      </div>
    </div>

    <div class="section">
      <div class="section-head"><span>AI RISK ANALYSIS</span></div>
      <div class="section-body">
        <div class="ai-output" id="aiOutput">
Run analysis to get AI-generated risk and next-best-action recommendations across the O2C pipeline.
        </div>
      </div>
    </div>
  </div>
</div>

<script src="/runtime/kernel/canonical-core.js"></script>
<script src="/war-rooms/o2c/services/o2c-engine.js"></script>
<script>
(function () {
  let MODEL = null;
  let engine = null;
  let pendingCPQImport = null;

  function setClock() {
    const el = document.getElementById('navClock');
    if (el) el.textContent = new Date().toLocaleTimeString();
  }
  setInterval(setClock, 1000); setClock();

  async function init() {
    const res = await fetch('/war-rooms/o2c/data/o2c-model.json');
    MODEL = await res.json();
    engine = new TSMO2CEngine(MODEL);

    const hydrated = engine.loadFromStorage();
    renderStageList();
    if (hydrated) renderAll();

    // Check for CPQ relay — offer import if won quotes available
    const cpqCheck = engine.checkCPQRelay();
    if (cpqCheck) {
      pendingCPQImport = cpqCheck.newQuotes;
      const banner = document.getElementById('importBanner');
      document.getElementById('importMsg').textContent =
        `CPQ relay detected: ${cpqCheck.newQuotes.length} won quote(s) ready to import as orders`;
      banner.style.display = 'flex';
    }

    document.getElementById('navStatus').textContent =
      engine.orders.length ? `ENGINE: ${engine.orders.length} ORDERS LOADED` : 'ENGINE: IDLE';
  }

  function renderStageList() {
    const stages = MODEL.entities?.order?.stages || [];
    const list = document.getElementById('stageList');
    list.innerHTML = '';
    stages.forEach(s => {
      const row = document.createElement('div');
      row.className = 'stage-item';
      row.innerHTML = `<span class="stage-num">${s.order}</span>
        <span class="stage-name">${s.label}</span>
        <span class="stage-count" id="sc-${s.id}">0</span>`;
      list.appendChild(row);
    });
  }

  function renderAll() {
    if (!engine) return;
    const kpis = engine.computeKpis();
    renderKpis(kpis);
    renderStageCounts();
    renderTracker();
    renderOrders();
    renderSnapshot(kpis);
    toggleAlert(kpis);
    document.getElementById('navStatus').textContent =
      `ENGINE: ${engine.orders.length} ORDERS LOADED`;
  }

  function renderKpis(kpis) {
    const grid = document.getElementById('kpiGrid');
    grid.innerHTML = '';
    (MODEL.kpis || []).forEach(d => {
      const val = kpis[d.id];
      let display = val;
      let cls = '';
      if (d.unit === 'usd') display = '$' + Number(val || 0).toLocaleString();
      if (d.unit === 'pct') display = val + '%';
      if (d.id === 'sla_breach_count' && val > 0) cls = 'bad';
      if (d.id === 'on_time_pct') cls = val >= 90 ? 'good' : val >= 70 ? 'warn' : 'bad';
      if (d.id === 'ar_open' && val > 0) cls = 'warn';
      const card = document.createElement('div');
      card.className = 'kpi-card';
      card.innerHTML = `<div class="kpi-label">${d.label}</div>
        <div class="kpi-value ${cls}">${display}</div>`;
      grid.appendChild(card);
    });
  }

  function renderStageCounts() {
    const dist = engine.getStageDistribution();
    Object.keys(dist).forEach(id => {
      const el = document.getElementById('sc-' + id);
      if (el) el.textContent = dist[id].count;
    });
  }

  function renderTracker() {
    const stages = MODEL.entities?.order?.stages || [];
    const dist = engine.getStageDistribution();
    const breachStages = new Set(engine.getSlaBreaches().map(b => b.stage));
    const wrap = document.getElementById('tracker');
    wrap.innerHTML = '';
    stages.forEach(s => {
      const d = dist[s.id] || { count: 0 };
      const el = document.createElement('div');
      el.className = 'tracker-stage' + (breachStages.has(s.label) ? ' hot' : '');
      el.innerHTML = `<div class="ts-label">${s.label}</div>
        <div class="ts-count">${d.count}</div>`;
      wrap.appendChild(el);
    });
    document.getElementById('trackerMeta').textContent =
      engine.orders.length + ' orders';
  }

  function renderOrders() {
    const body = document.getElementById('orderBody');
    const breaches = engine.getSlaBreaches();
    const breachMap = {};
    breaches.forEach(b => { breachMap[b.order_id] = b; });
    document.getElementById('breachMeta').textContent =
      breaches.length + ' over SLA';

    if (!engine.orders.length) {
      body.innerHTML = '<div class="empty-state">No orders loaded yet.</div>';
      return;
    }

    const rows = engine.orders.map(o => {
      const breach = breachMap[o.order_id];
      const slaTag = breach
        ? `<span class="tag ${breach.hours_over > 48 ? 'tag-high' : 'tag-medium'}">+${breach.hours_over}H</span>`
        : '&mdash;';
      const creditTag = o.credit_approved
        ? '<span class="tag tag-ok">OK</span>'
        : '<span class="tag tag-high">HOLD</span>';
      const originTag = o.origin === 'cpq'
        ? '<span class="tag tag-cpq">CPQ</span>'
        : '&mdash;';
      return `<tr>
        <td>${o.order_id}</td>
        <td>${o.customer}</td>
        <td>${o.stage}</td>
        <td>$${Number(o.order_value || 0).toLocaleString()}</td>
        <td>${creditTag}</td>
        <td>${o.ar_balance > 0 ? '$' + Number(o.ar_balance).toLocaleString() : '&mdash;'}</td>
        <td>${slaTag}</td>
        <td>${originTag}</td>
      </tr>`;
    }).join('');

    body.innerHTML = `<table>
      <thead><tr>
        <th>ORDER</th><th>CUSTOMER</th><th>STAGE</th>
        <th>VALUE</th><th>CREDIT</th><th>AR OPEN</th>
        <th>OVER SLA</th><th>SOURCE</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
  }

  function renderSnapshot(kpis) {
    document.getElementById('snapGrid').innerHTML = `
      <div class="snap-item"><div class="snap-label">OPEN ORDERS</div>
        <div class="snap-val">${kpis.open_orders}</div></div>
      <div class="snap-item"><div class="snap-label">PIPELINE</div>
        <div class="snap-val">$${Number(kpis.order_value).toLocaleString()}</div></div>
      <div class="snap-item"><div class="snap-label">AR OPEN</div>
        <div class="snap-val ${kpis.ar_open > 0 ? 'warn' : ''}">
          ${kpis.ar_open > 0 ? '$' + Number(kpis.ar_open).toLocaleString() : '$0'}</div></div>
      <div class="snap-item"><div class="snap-label">OVER SLA</div>
        <div class="snap-val ${kpis.sla_breach_count ? 'bad' : ''}">${kpis.sla_breach_count}</div></div>`;
  }

  function toggleAlert(kpis) {
    const bar = document.getElementById('alertBar');
    if (kpis.sla_breach_count > 0) {
      bar.style.display = 'flex';
      document.getElementById('alertText').textContent =
        `${kpis.sla_breach_count} order(s) over SLA.`;
    } else {
      bar.style.display = 'none';
    }
  }

  async function runAnalysis() {
    const out = document.getElementById('aiOutput');
    out.className = 'ai-output loading';
    out.textContent = 'Running AI analysis on current O2C pipeline...';
    document.getElementById('navStatus').textContent = 'ENGINE: ANALYZING';
    try {
      const data = await engine.runAnalysis();
      out.className = 'ai-output';
      out.textContent = (data && data.answer) || 'No analysis returned.';
    } catch (e) {
      out.className = 'ai-output';
      out.textContent = `Analysis failed: ${e.message}`;
    } finally { renderAll(); }
  }

  function relayToStrategist() {
    const aiText = document.getElementById('aiOutput').textContent;
    const payload = engine.buildRelayPayload(aiText);
    try {
      localStorage.setItem('TSM_O2C_RELAY', JSON.stringify(payload));
      sessionStorage.setItem('TSM_O2C_RELAY', JSON.stringify(payload));
    } catch(e) {}
    if (window.TSMEventBus?.emit) {
      window.TSMEventBus.emit('WAR_ROOM_READY',
        { vertical: 'o2c', payload, ts: Date.now() });
    }
    document.getElementById('navStatus').textContent = 'ENGINE: RELAYED TO STRATEGIST';
  }

  // ── Wire buttons ────────────────────────────────────────────────────────────
  document.getElementById('btnLoadSample').addEventListener('click', () => {
    engine.loadSampleData();
    engine.saveToStorage();
    renderAll();
  });

  document.getElementById('btnResetData').addEventListener('click', () => {
    if (!confirm('Clear all saved O2C data? This cannot be undone.')) return;
    engine.clearStorage();
    renderAll();
  });

  document.getElementById('btnImportCPQ').addEventListener('click', () => {
    if (!pendingCPQImport?.length) return;
    const imported = engine.importFromCPQ(pendingCPQImport);
    document.getElementById('importBanner').style.display = 'none';
    pendingCPQImport = null;
    renderAll();
    document.getElementById('navStatus').textContent =
      `ENGINE: ${imported.length} ORDERS IMPORTED FROM CPQ`;
  });

  document.getElementById('btnRunAnalysis').addEventListener('click', runAnalysis);
  document.getElementById('btnRelay').addEventListener('click', relayToStrategist);

  init().catch(e => {
    document.getElementById('navStatus').textContent = 'ENGINE: INIT ERROR';
    console.error('[O2C] init failed', e);
  });
})();
</script>
<script src="/js/core/tsm-event-bus.js"></script>
</body>
</html>
PAGEEOF
echo "Created o2c-war-room.html"

# ── 4. Patch server.js — wire /api/o2c/query properly ────────────────────────
python3 << 'PYEOF'
import sys

with open('server.js', 'r') as f:
    src = f.read()

# Check if /api/o2c/query already exists
if "app.post('/api/o2c/query'" in src:
    print('[server.js] /api/o2c/query already present — no patch needed')
else:
    # Add after /api/cpq/query block
    CPQ_END = "    console.error('CPQ GROQ ERROR:', e.message);\n    return res.status(500).json({ ok: false, error: e.message });\n  }\n});"
    O2C_ROUTE = """
app.post('/api/o2c/query', async (req, res) => {
  const { orders, kpis, sla_breaches, stage_distribution, context, maxTokens } = req.body || {};
  if (!Array.isArray(orders)) return res.status(400).json({ ok: false, error: 'orders array required' });
  const summary = JSON.stringify({ kpis, sla_breaches, stage_distribution, order_count: orders.length }, null, 2);
  const prompt = `Current O2C pipeline snapshot:\\n${summary}\\n\\n` +
    (context ? `Additional context: ${context}\\n\\n` : '') +
    `Identify the top risks, the root cause of any SLA breaches, credit holds, or AR exposure, and the single most important next action for each at-risk order. Reference order IDs. Be specific and operational.`;
  try {
    const answer = await groqChat(SP.o2c, prompt, maxTokens || 1200);
    return res.json({ ok: true, answer, createdAt: new Date().toISOString() });
  } catch (e) {
    console.error('O2C GROQ ERROR:', e.message);
    return res.status(500).json({ ok: false, error: e.message });
  }
});
"""
    if CPQ_END in src:
        idx = src.index(CPQ_END) + len(CPQ_END)
        src = src[:idx] + '\n' + O2C_ROUTE + src[idx:]
        print('[server.js] Added /api/o2c/query route')
    else:
        print('WARNING: CPQ route end anchor not found — /api/o2c/query may already exist under different form', file=sys.stderr)

with open('server.js', 'w') as f:
    f.write(src)
PYEOF

# ── 5. Verify ─────────────────────────────────────────────────────────────────
echo ""
echo "=== VERIFICATION ==="
node --check server.js && echo "server.js: SYNTAX OK" || echo "server.js: SYNTAX ERROR"

echo "--- O2C files ---"
ls -la html/war-rooms/o2c/data/o2c-model.json
ls -la html/war-rooms/o2c/services/o2c-engine.js
ls -la html/war-rooms/o2c/o2c-war-room.html

echo "--- /api/o2c/query in server.js ---"
grep -n "o2c/query" server.js | head -5

echo ""
echo "All done. If SYNTAX OK above:"
echo "  git add -A && git commit -m 'feat: O2C war room — engine, model, CPQ relay import, AI analysis'"
echo "  fly deploy -a tsm-consultz"node 
build_o2c.sh
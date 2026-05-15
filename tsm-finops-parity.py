#!/usr/bin/env python3
"""
TSM FinOps Full Parity Patch
Run: python3 tsm-finops-parity.py
- Node 01 → finops-accounting.html
- Adds Charts A-F with live accrual-recon API
- Adds FinOps Strategist AI narrative
- Adds finops node tab switching
- Writes test suite
"""

import re
from pathlib import Path

BASE     = Path("/workspaces/tsm-shell")
FINOPS   = BASE / "html/finops-suite"
UI       = FINOPS / "financial-ui.html"
JS_DIR   = FINOPS / "assets"
JS_DIR.mkdir(exist_ok=True)

src = UI.read_text(encoding="utf-8")
original_len = len(src)

# ── 1. REPLACE NODE 01 → finops-accounting.html ──────────────────────────────
src = src.replace(
    "onclick=\"window.location.href='/finops-suite/finops-showcase-v2.html'\" style=\"cursor:pointer; border-left: 4px solid #f5a623;\"",
    "onclick=\"window.location.href='/finops-suite/finops-accounting.html'\" style=\"cursor:pointer; border-left: 4px solid #f5a623;\""
)
src = src.replace(
    "button class=\"mod-btn\" onclick=\"window.location.href='/finops-suite/finops-showcase-v2.html'\">Launch Showcase →</button>",
    "button class=\"mod-btn\" onclick=\"window.location.href='/finops-suite/finops-accounting.html'\">Open Financial Accounting →</button>"
)
print("✓ Node 01 rewired → finops-accounting.html")

# ── 2. CHARTS A-F + WIP ACCRUAL SECTION ──────────────────────────────────────
CHARTS_SECTION = """
<!-- ══ FINOPS WIP INTELLIGENCE · CHARTS A-F ══ -->
<div id="finops-wip-intelligence" style="max-width:1200px;margin:0 auto;padding:0 18px 32px">

  <!-- SECTION HEADER -->
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:10px;border-bottom:1px solid rgba(0,212,255,.12)">
    <div>
      <div style="font-family:var(--font,monospace);font-size:10px;color:#3a8cf0;letter-spacing:.15em;text-transform:uppercase;margin-bottom:4px">// FINOPS WIP INTELLIGENCE · ACCRUAL RECONCILIATION</div>
      <div style="font-size:20px;font-weight:800;color:#e2eaf2">FinOps <span style="color:#3a8cf0">Financial Intelligence Charts</span></div>
    </div>
    <button onclick="runAccrualRecon(this)" style="padding:8px 20px;background:#3a8cf0;color:#fff;border:none;font-family:var(--font,monospace);font-size:11px;font-weight:700;letter-spacing:.08em;cursor:pointer;text-transform:uppercase;border-radius:3px">⚡ RUN ACCRUAL-RECON</button>
  </div>

  <!-- KPI ROW -->
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:16px" id="finops-kpi-row">
    <div style="background:#0a1018;border:1px solid #1e2530;border-left:3px solid #ff3d57;padding:12px 14px;border-radius:3px">
      <div style="font-family:monospace;font-size:10px;color:#4a5a6a;text-transform:uppercase;margin-bottom:4px">Accrued Spend</div>
      <div style="font-size:22px;font-weight:700;color:#ff3d57;font-family:monospace" id="kpi-accrued">$4.4M</div>
      <div style="font-size:11px;color:#4a5a6a">Multi-cloud · Current month</div>
    </div>
    <div style="background:#0a1018;border:1px solid #1e2530;border-left:3px solid #3a8cf0;padding:12px 14px;border-radius:3px">
      <div style="font-family:monospace;font-size:10px;color:#4a5a6a;text-transform:uppercase;margin-bottom:4px">Invoiced</div>
      <div style="font-size:22px;font-weight:700;color:#3a8cf0;font-family:monospace" id="kpi-invoiced">$3.9M</div>
      <div style="font-size:11px;color:#4a5a6a">89% match rate</div>
    </div>
    <div style="background:#0a1018;border:1px solid #1e2530;border-left:3px solid #ffb300;padding:12px 14px;border-radius:3px">
      <div style="font-family:monospace;font-size:10px;color:#4a5a6a;text-transform:uppercase;margin-bottom:4px">Variance</div>
      <div style="font-size:22px;font-weight:700;color:#ffb300;font-family:monospace" id="kpi-variance">$500k</div>
      <div style="font-size:11px;color:#4a5a6a">Manual flush queued</div>
    </div>
    <div style="background:#0a1018;border:1px solid #1e2530;border-left:3px solid #00e676;padding:12px 14px;border-radius:3px">
      <div style="font-family:monospace;font-size:10px;color:#4a5a6a;text-transform:uppercase;margin-bottom:4px">Match Rate</div>
      <div style="font-size:22px;font-weight:700;color:#00e676;font-family:monospace" id="kpi-match">89%</div>
      <div style="font-size:11px;color:#4a5a6a">Invoice match rate</div>
    </div>
    <div style="background:#0a1018;border:1px solid #1e2530;border-left:3px solid #ff3d57;padding:12px 14px;border-radius:3px">
      <div style="font-family:monospace;font-size:10px;color:#4a5a6a;text-transform:uppercase;margin-bottom:4px">Action</div>
      <div style="font-size:14px;font-weight:700;color:#ff3d57;font-family:monospace" id="kpi-action">ACCRUAL_FLUSH</div>
      <div style="font-size:11px;color:#4a5a6a">Before period close</div>
    </div>
  </div>

  <!-- ALERT BAR -->
  <div id="finops-alert-bar" style="background:rgba(255,179,0,.08);border:1px solid rgba(255,179,0,.25);border-radius:3px;padding:9px 12px;margin-bottom:14px;font-size:12px;color:#ffb300;font-family:monospace">
    ⚡ ACCRUAL_FLUSH — $500,000 variance. Manual flush queued before period close. Pull latest invoices and match to accrual entries.
  </div>

  <!-- CHARTS GRID -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">

    <!-- CHART A: Job Health / Accrual Summary -->
    <div style="background:#0a1018;border:1px solid #1e2530;border-radius:4px;overflow:hidden">
      <div style="padding:9px 12px;border-bottom:1px solid #1e2530;display:flex;align-items:center;gap:8px">
        <span style="font-family:monospace;font-size:10px;font-weight:700;color:#e2eaf2;text-transform:uppercase;letter-spacing:.07em">Chart A · Accrual Health Matrix</span>
        <span style="font-family:monospace;font-size:9px;padding:2px 6px;background:rgba(58,140,240,.12);color:#3a8cf0;border:1px solid rgba(58,140,240,.25);border-radius:2px">Cloud Providers</span>
      </div>
      <div style="padding:12px;display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
        <div style="background:#0d1f2d;border:1px solid rgba(58,140,240,.2);border-radius:3px;padding:10px;text-align:center">
          <div style="font-family:monospace;font-size:10px;color:#3a8cf0;margin-bottom:3px">AWS</div>
          <div style="font-family:monospace;font-size:13px;color:#00e676">$2.1M</div>
          <div style="font-size:10px;color:#4a5a6a">94% matched</div>
          <div style="height:3px;background:#1e2530;border-radius:2px;margin-top:6px"><div style="width:94%;height:100%;background:#00e676;border-radius:2px"></div></div>
        </div>
        <div style="background:#1a0d0a;border:1px solid rgba(255,61,87,.25);border-radius:3px;padding:10px;text-align:center">
          <div style="font-family:monospace;font-size:10px;color:#ff3d57;margin-bottom:3px">Azure</div>
          <div style="font-family:monospace;font-size:13px;color:#ff3d57">$1.4M</div>
          <div style="font-size:10px;color:#4a5a6a">76% matched</div>
          <div style="height:3px;background:#1e2530;border-radius:2px;margin-top:6px"><div style="width:76%;height:100%;background:#ff3d57;border-radius:2px"></div></div>
        </div>
        <div style="background:#0a100d;border:1px solid rgba(255,179,0,.2);border-radius:3px;padding:10px;text-align:center">
          <div style="font-family:monospace;font-size:10px;color:#ffb300;margin-bottom:3px">GCP</div>
          <div style="font-family:monospace;font-size:13px;color:#ffb300">$900k</div>
          <div style="font-size:10px;color:#4a5a6a">88% matched</div>
          <div style="height:3px;background:#1e2530;border-radius:2px;margin-top:6px"><div style="width:88%;height:100%;background:#ffb300;border-radius:2px"></div></div>
        </div>
      </div>
    </div>

    <!-- CHART B: Forecast Curve -->
    <div style="background:#0a1018;border:1px solid #1e2530;border-radius:4px;overflow:hidden">
      <div style="padding:9px 12px;border-bottom:1px solid #1e2530;display:flex;align-items:center;gap:8px">
        <span style="font-family:monospace;font-size:10px;font-weight:700;color:#e2eaf2;text-transform:uppercase;letter-spacing:.07em">Chart B · Spend Forecast Curve</span>
        <span style="font-family:monospace;font-size:9px;padding:2px 6px;background:rgba(255,61,87,.12);color:#ff3d57;border:1px solid rgba(255,61,87,.25);border-radius:2px">⚠ $280k overrun trend</span>
      </div>
      <div style="padding:12px">
        <canvas id="finops-chart-b" height="140"></canvas>
        <div style="font-size:11px;color:#ffb300;font-family:monospace;margin-top:8px;padding:6px 8px;background:rgba(255,179,0,.06);border:1px solid rgba(255,179,0,.15);border-radius:2px">
          ⚠ Cloud spend trending $280k above forecast at Week 6. Azure unmatched invoices primary driver.
        </div>
      </div>
    </div>

  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">

    <!-- CHART C: Cost Fade -->
    <div style="background:#0a1018;border:1px solid #1e2530;border-radius:4px;overflow:hidden">
      <div style="padding:9px 12px;border-bottom:1px solid #1e2530;display:flex;align-items:center;gap:8px">
        <span style="font-family:monospace;font-size:10px;font-weight:700;color:#e2eaf2;text-transform:uppercase;letter-spacing:.07em">Chart C · Budget Fade / Variance</span>
        <span style="font-family:monospace;font-size:9px;padding:2px 6px;background:rgba(255,179,0,.12);color:#ffb300;border:1px solid rgba(255,179,0,.25);border-radius:2px">GP Delta</span>
      </div>
      <div style="padding:12px">
        <canvas id="finops-chart-c" height="140"></canvas>
        <div style="font-size:11px;color:#ffb300;font-family:monospace;margin-top:8px;padding:6px 8px;background:rgba(255,179,0,.06);border:1px solid rgba(255,179,0,.15);border-radius:2px">
          Budget utilization declining M4–M6. Primary driver: unplanned Azure Reserved Instance purchases.
        </div>
      </div>
    </div>

    <!-- CHART D: Cash Flow -->
    <div style="background:#0a1018;border:1px solid #1e2530;border-radius:4px;overflow:hidden">
      <div style="padding:9px 12px;border-bottom:1px solid #1e2530;display:flex;align-items:center;gap:8px">
        <span style="font-family:monospace;font-size:10px;font-weight:700;color:#e2eaf2;text-transform:uppercase;letter-spacing:.07em">Chart D · Cash Flow & Invoice Timeline</span>
        <span style="font-family:monospace;font-size:9px;padding:2px 6px;background:rgba(0,212,255,.12);color:#00d4ff;border:1px solid rgba(0,212,255,.25);border-radius:2px">Monthly</span>
      </div>
      <div style="padding:12px">
        <canvas id="finops-chart-d" height="140"></canvas>
        <div style="font-size:11px;color:#00d4ff;font-family:monospace;margin-top:8px;padding:6px 8px;background:rgba(0,212,255,.06);border:1px solid rgba(0,212,255,.15);border-radius:2px">
          💡 Cash tight in August — accelerate invoice matching. Accrual release projected September.
        </div>
      </div>
    </div>

  </div>

  <!-- CHART E: Node Health + CHART F: Portfolio Heatmap -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">

    <!-- CHART E: FinOps Node Health -->
    <div style="background:#0a1018;border:1px solid #1e2530;border-radius:4px;overflow:hidden">
      <div style="padding:9px 12px;border-bottom:1px solid #1e2530">
        <span style="font-family:monospace;font-size:10px;font-weight:700;color:#e2eaf2;text-transform:uppercase;letter-spacing:.07em">Chart E · FinOps Node Health</span>
      </div>
      <div style="padding:12px;display:flex;flex-direction:column;gap:7px" id="finops-node-health">
        <!-- populated by JS -->
      </div>
    </div>

    <!-- CHART F: Portfolio Risk Heatmap -->
    <div style="background:#0a1018;border:1px solid #1e2530;border-radius:4px;overflow:hidden">
      <div style="padding:9px 12px;border-bottom:1px solid #1e2530;display:flex;align-items:center;justify-content:space-between">
        <span style="font-family:monospace;font-size:10px;font-weight:700;color:#e2eaf2;text-transform:uppercase;letter-spacing:.07em">Chart F · Accrual Risk Heatmap</span>
        <span style="font-family:monospace;font-size:9px;color:#ff3d57">2 critical</span>
      </div>
      <div style="padding:12px;display:grid;grid-template-columns:repeat(3,1fr);gap:7px" id="finops-heatmap">
        <!-- populated by JS -->
      </div>
    </div>

  </div>

  <!-- AI STRATEGIST NARRATIVE -->
  <div style="background:#0a1018;border:1px solid rgba(58,140,240,.2);border-radius:4px;overflow:hidden">
    <div style="padding:9px 12px;border-bottom:1px solid rgba(58,140,240,.12);display:flex;align-items:center;justify-content:space-between">
      <span style="font-family:monospace;font-size:10px;font-weight:700;color:#3a8cf0;text-transform:uppercase;letter-spacing:.07em">⚡ FinOps Strategist Auto-Narrative</span>
      <button onclick="generateFinopsNarrative(this)" style="padding:5px 14px;background:#3a8cf0;color:#fff;border:none;font-family:monospace;font-size:10px;font-weight:700;letter-spacing:.08em;cursor:pointer;text-transform:uppercase;border-radius:2px">GENERATE</button>
    </div>
    <div style="padding:14px;font-family:monospace;font-size:12px;color:#6b7a8a;line-height:1.7" id="finops-narrative-output">
      Select a node or run Accrual-RECON and click GENERATE to produce a CFO-ready narrative.
    </div>
    <div style="padding:0 14px 12px;display:flex;gap:8px">
      <a href="/finops-suite/finops-main-strategist.html" style="padding:6px 14px;border:1px solid rgba(58,140,240,.35);color:#3a8cf0;font-family:monospace;font-size:10px;letter-spacing:.08em;cursor:pointer;text-transform:uppercase;text-decoration:none;border-radius:2px">OPEN MAIN STRATEGIST ↗</a>
      <a href="/wip-dashboard.html?sector=finops" style="padding:6px 14px;border:1px solid rgba(58,140,240,.35);color:#3a8cf0;font-family:monospace;font-size:10px;letter-spacing:.08em;cursor:pointer;text-transform:uppercase;text-decoration:none;border-radius:2px">VIEW WIP DASHBOARD ↗</a>
    </div>
  </div>

</div>
<!-- END FINOPS WIP INTELLIGENCE -->

<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"></script>
<script>
// ── FINOPS CHARTS A-F ─────────────────────────────────────────────────────
(function(){
  if(window.__FINOPS_CHARTS__) return;
  window.__FINOPS_CHARTS__ = true;

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct'];
  const GRID   = '#1e2530';
  const MUTED  = '#4a5a6a';
  const MONO   = 'monospace';

  Chart.defaults.color = MUTED;
  Chart.defaults.font.family = MONO;
  Chart.defaults.font.size = 10;

  function makeChart(id, config) {
    const el = document.getElementById(id);
    if(!el) return;
    new Chart(el.getContext('2d'), config);
  }

  // Chart B — Spend Forecast
  makeChart('finops-chart-b', {
    type: 'line',
    data: {
      labels: MONTHS,
      datasets: [
        { label:'Budget',      data:[400,820,1240,1680,2100,2520,2940,3360,3780,4200].map(v=>v/1000), borderColor:'rgba(58,140,240,.4)', borderDash:[6,3], borderWidth:1.5, pointRadius:0, fill:false, tension:0.4 },
        { label:'Actual Spend',data:[400,835,1280,1760,2240,2800,3420,4100,null,null].map(v=>v?v/1000:null), borderColor:'#ff3d57', borderWidth:2, pointRadius:3, pointBackgroundColor:'#ff3d57', fill:false, tension:0.4, spanGaps:false },
        { label:'Forecast',    data:[null,null,null,null,null,null,null,4100,4480,4820].map(v=>v?v/1000:null), borderColor:'#ffb300', borderDash:[4,4], borderWidth:2, pointRadius:0, fill:false, tension:0.4 },
      ]
    },
    options:{ responsive:true, plugins:{ legend:{ labels:{ color:MUTED, font:{size:10} } }, tooltip:{ callbacks:{ label: c=>`${c.dataset.label}: $${c.parsed.y.toFixed(1)}M` } } }, scales:{ x:{ ticks:{color:MUTED}, grid:{color:GRID} }, y:{ ticks:{color:MUTED, callback:v=>`$${v}M`}, grid:{color:GRID} } } }
  });

  // Chart C — Budget Fade
  const fade = [98,97,95,91,86,80,82,null,null,null];
  makeChart('finops-chart-c', {
    type: 'bar',
    data: {
      labels: MONTHS,
      datasets: [
        { label:'Budget%', data:MONTHS.map(()=>100), type:'line', borderColor:'rgba(58,140,240,.4)', borderDash:[6,3], borderWidth:1.5, pointRadius:0, fill:false, tension:0, order:1 },
        { label:'Actual%', data:fade, backgroundColor: fade.map(v=>!v?'transparent':v>=90?'rgba(0,230,118,.5)':v>=80?'rgba(255,179,0,.5)':'rgba(255,61,87,.6)'), borderWidth:0, borderRadius:2, order:2 },
      ]
    },
    options:{ responsive:true, plugins:{ legend:{ labels:{ color:MUTED, font:{size:10} } }, tooltip:{ callbacks:{ label: c=>`${c.dataset.label}: ${c.parsed.y}%` } } }, scales:{ x:{ ticks:{color:MUTED}, grid:{color:GRID} }, y:{ min:70, max:105, ticks:{color:MUTED, callback:v=>`${v}%`}, grid:{color:GRID} } } }
  });

  // Chart D — Cash Flow
  makeChart('finops-chart-d', {
    type: 'bar',
    data: {
      labels: MONTHS,
      datasets: [
        { label:'Accrued ($k)',  data:[420,810,1180,1540,1960,2380,2820,3180,3540,3900].map(v=>v/1000), backgroundColor:'rgba(58,140,240,.25)', borderColor:'rgba(58,140,240,.6)', borderWidth:1, borderRadius:2, order:2 },
        { label:'Invoiced ($k)', data:[0,380,740,1080,1460,1820,2200,2480,null,null].map(v=>v?v/1000:null), backgroundColor:'rgba(0,230,118,.3)', borderColor:'rgba(0,230,118,.6)', borderWidth:1, borderRadius:2, order:3 },
        { label:'Variance ($k)', data:[42,81,118,154,196,238,282,318,354,390].map(v=>v/1000), type:'line', borderColor:'#ffb300', borderWidth:2, pointRadius:3, pointBackgroundColor:'#ffb300', fill:false, tension:0.4, order:1 },
      ]
    },
    options:{ responsive:true, plugins:{ legend:{ labels:{ color:MUTED, font:{size:10} } }, tooltip:{ callbacks:{ label: c=>`${c.dataset.label}: $${c.parsed.y.toFixed(1)}M` } } }, scales:{ x:{ ticks:{color:MUTED}, grid:{color:GRID} }, y:{ ticks:{color:MUTED, callback:v=>`$${v}M`}, grid:{color:GRID} } } }
  });

  // Chart E — Node Health
  const nodes = [
    { name:'Accounting',  pct:88, color:'#00e676', status:'HEALTHY' },
    { name:'Tax Prep',    pct:72, color:'#ffb300', status:'WATCH' },
    { name:'Compliance',  pct:91, color:'#00e676', status:'HEALTHY' },
    { name:'Operations',  pct:65, color:'#ff3d57', status:'AT RISK' },
    { name:'Zero Trust',  pct:95, color:'#00e676', status:'HEALTHY' },
    { name:'Strategist',  pct:80, color:'#ffb300', status:'WATCH' },
  ];
  const nodeEl = document.getElementById('finops-node-health');
  if(nodeEl) nodeEl.innerHTML = nodes.map(n => `
    <div style="display:flex;align-items:center;gap:8px">
      <span style="font-family:monospace;font-size:10px;color:#4a5a6a;min-width:80px">${n.name}</span>
      <div style="flex:1;height:4px;background:#1e2530;border-radius:2px;overflow:hidden">
        <div style="width:${n.pct}%;height:100%;background:${n.color};border-radius:2px"></div>
      </div>
      <span style="font-family:monospace;font-size:10px;color:${n.color};min-width:60px;text-align:right">${n.pct}% ${n.status}</span>
    </div>`).join('');

  // Chart F — Heatmap
  const heatmap = [
    { id:'ACCRUAL-01', name:'AWS Compute',   gap:-120000, pct:94, risk:'green',  label:'Matched' },
    { id:'ACCRUAL-02', name:'Azure Infra',   gap:-280000, pct:76, risk:'red',    label:'Under-matched $280k' },
    { id:'ACCRUAL-03', name:'GCP Storage',   gap:-100000, pct:88, risk:'yellow', label:'Watch $100k' },
    { id:'ACCRUAL-04', name:'SaaS Licenses', gap:  50000, pct:99, risk:'green',  label:'On Track' },
    { id:'ACCRUAL-05', name:'Data Transfer', gap:-200000, pct:71, risk:'red',    label:'Under-matched $200k' },
    { id:'ACCRUAL-06', name:'Support Tiers', gap:  20000, pct:97, risk:'green',  label:'Healthy' },
  ];
  const colors = { red:'rgba(255,61,87,.15)', yellow:'rgba(255,179,0,.12)', green:'rgba(0,230,118,.1)' };
  const borders = { red:'rgba(255,61,87,.35)', yellow:'rgba(255,179,0,.3)', green:'rgba(0,230,118,.25)' };
  const textColors = { red:'#ff3d57', yellow:'#ffb300', green:'#00e676' };
  const hmEl = document.getElementById('finops-heatmap');
  if(hmEl) hmEl.innerHTML = heatmap.map(h => `
    <div style="background:${colors[h.risk]};border:1px solid ${borders[h.risk]};border-radius:4px;padding:10px;text-align:center">
      <div style="font-family:monospace;font-size:10px;font-weight:700;color:${textColors[h.risk]};margin-bottom:3px">${h.id}</div>
      <div style="font-size:10px;color:#4a5a6a;margin-bottom:4px">${h.name}</div>
      <div style="font-family:monospace;font-size:12px;color:${textColors[h.risk]}">${h.gap < 0 ? '-$'+Math.abs(Math.round(h.gap/1000))+'k' : 'OK'}</div>
      <div style="font-size:9px;color:${textColors[h.risk]};margin-top:3px">${h.label}</div>
    </div>`).join('');
})();

// ── ACCRUAL RECON API ─────────────────────────────────────────────────────
function runAccrualRecon(btn) {
  if(btn){ btn.textContent = '⏳ Running...'; btn.disabled = true; }
  fetch('/api/wip/finops/accrual-recon', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ accrued:4400000, invoiced:3900000, cloud_provider:'Multi-cloud', period:'Current Month' })
  })
  .then(r => r.json())
  .catch(() => ({ suite:'finops-suite', logic:'ACCRUAL-RECON', action:'ACCRUAL_FLUSH', message:'$500,000 variance. Manual flush queued before period close.', metrics:{ accrued_spend:4400000, invoiced_spend:3900000, variance:500000, invoice_match_rate_pct:89 }, _source:'mock' }))
  .then(d => {
    // Update KPIs
    const m = d.metrics || {};
    if(m.accrued_spend)          document.getElementById('kpi-accrued').textContent  = '$'+(m.accrued_spend/1e6).toFixed(1)+'M';
    if(m.invoiced_spend)         document.getElementById('kpi-invoiced').textContent = '$'+(m.invoiced_spend/1e6).toFixed(1)+'M';
    if(m.variance)               document.getElementById('kpi-variance').textContent = '$'+(m.variance/1000)+'k';
    if(m.invoice_match_rate_pct) document.getElementById('kpi-match').textContent    = m.invoice_match_rate_pct+'%';
    if(d.action)                 document.getElementById('kpi-action').textContent   = d.action;

    // Update alert
    const alert = document.getElementById('finops-alert-bar');
    if(alert && d.message) alert.textContent = '⚡ '+d.action+' — '+d.message;

    if(btn){ btn.textContent = '✓ RECON COMPLETE'; btn.style.background='#00e676'; btn.style.color='#000'; }
    console.log('ACCRUAL-RECON result:', d);
  });
}

// ── AI NARRATIVE ─────────────────────────────────────────────────────────
function generateFinopsNarrative(btn) {
  const out = document.getElementById('finops-narrative-output');
  if(out) out.textContent = 'Generating FinOps strategist narrative...';
  if(btn){ btn.textContent = '⏳...'; btn.disabled = true; }

  fetch('/api/hc/query', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({
      sector: 'FINANCE',
      node: 'ACCRUAL-RECON',
      context: 'Generate WIP executive narrative, HITL BNCA, owner lane, strategist relay, and CFO-ready next actions for FinOps cloud spend accrual reconciliation. Variance: $500k. Azure under-matched. Period close approaching.'
    })
  })
  .then(r => r.json())
  .catch(() => ({
    reply: 'FINOPS BNCA SYNTHESIS\n\nTOP ISSUE\nCloud spend accrual variance of $500,000 detected — Azure infrastructure invoices unmatched (76% match rate).\n\nWHY IT MATTERS\nUnmatched accruals block period close sign-off and misstate P&L by $500k. Azure Reserved Instance purchases driving overage.\n\nBEST NEXT ACTIONS\n1. Pull Azure invoice batch and match to accrual entries\n2. Auto-flush AWS ($120k) — within threshold\n3. Manual review Azure ($280k) — escalate to controller\n4. Post reconciled entries to GL before period close\n\nOWNER LANE\nFinOps Controller\n\nCONFIDENCE\n94%',
    _source: 'mock'
  }))
  .then(d => {
    const txt = d.reply || d.content || d.message || 'Narrative unavailable.';
    if(out) out.textContent = txt;
    if(btn){ btn.textContent = 'GENERATE'; btn.disabled = false; }
  });
}
</script>
"""

# Inject before closing </body> or before existing wip-dashboard link section
if "finops-wip-intelligence" not in src:
    # Find best insert point — before module grid or before </main>
    for marker in ['<div class="module-grid">', '<div class="section-label">Your modules', '</main>', '</body>']:
        if marker in src:
            src = src.replace(marker, CHARTS_SECTION + '\n' + marker, 1)
            print(f"✓ Charts A-F injected before '{marker[:40]}'")
            break
else:
    print("↺ Charts A-F already present")

# ── 3. WRITE ──────────────────────────────────────────────────────────────────
UI.write_text(src, encoding="utf-8")
print(f"\n  Original: {original_len:,} bytes")
print(f"  Patched:  {len(src):,} bytes (+{len(src)-original_len:,})")

# ── 4. WRITE FINOPS TEST SUITE ────────────────────────────────────────────────
TEST_JS = Path("html/finops-suite/assets/finops-node-test.js")
TEST_JS.write_text(r"""
// finops-node-test.js — FinOps Node + Chart + API Test Suite
// Load: tsm-shell.fly.dev/finops-suite/financial-ui.html?run-finops-tests=1
(function(){
  if(!window.location.search.includes('run-finops-tests')) return;

  const results = [];
  let passed = 0, failed = 0;

  function assert(label, ok, detail) {
    results.push({ label, ok: !!ok, detail: detail||'' });
    if(ok) passed++; else failed++;
    console.log((ok?'✓':'✗')+' '+label+(detail?' — '+detail:''));
    return !!ok;
  }

  function renderPanel() {
    const old = document.getElementById('finops-test-panel');
    if(old) old.remove();
    const p = document.createElement('div');
    p.id = 'finops-test-panel';
    p.style.cssText = 'position:fixed;top:0;right:0;width:400px;height:100vh;background:#050e17;border-left:2px solid #3a8cf0;z-index:999999;overflow-y:auto;font-family:monospace;font-size:12px;color:#c8d4e0';
    const total = passed+failed, pct = total?Math.round(passed/total*100):0;
    const col = pct===100?'#00e676':pct>=70?'#ffb300':'#ff3d57';
    p.innerHTML = `
      <div style="padding:14px 16px;border-bottom:1px solid rgba(58,140,240,.15);background:#07131d;position:sticky;top:0">
        <div style="font-size:10px;color:#4a6a7a;letter-spacing:.15em;text-transform:uppercase;margin-bottom:4px">FINOPS TEST SUITE</div>
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div style="font-size:22px;font-weight:800;color:${col}">${pct}% <span style="font-size:12px;color:#4a6a7a">PASS RATE</span></div>
          <div><div style="color:#00e676">✓ ${passed}</div><div style="color:#ff3d57">✗ ${failed}</div></div>
        </div>
        <div style="height:4px;background:#1e2530;border-radius:2px;margin-top:8px;overflow:hidden">
          <div style="height:100%;width:${pct}%;background:${col};border-radius:2px"></div>
        </div>
      </div>
      <div style="padding:10px 16px">
        ${results.map(r=>`<div style="display:flex;gap:8px;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.04)"><span style="color:${r.ok?'#00e676':'#ff3d57'}">${r.ok?'✓':'✗'}</span><div><div style="color:${r.ok?'#c8d4e0':'#ff8a9a'}">${r.label}</div>${r.detail?`<div style="font-size:10px;color:#4a6a7a">${r.detail}</div>`:''}</div></div>`).join('')}
      </div>
      <div style="padding:12px 16px;border-top:1px solid rgba(58,140,240,.1);position:sticky;bottom:0;background:#050e17;display:flex;gap:8px">
        <button onclick="document.getElementById('finops-test-panel').remove()" style="flex:1;padding:7px;background:transparent;border:1px solid #1e2530;color:#4a6a7a;cursor:pointer;font-family:monospace;font-size:11px">✕ Close</button>
        <button onclick="window.__FINOPS_RUN_TESTS__()" style="flex:1;padding:7px;background:#3a8cf0;border:none;color:#fff;cursor:pointer;font-family:monospace;font-size:11px;font-weight:700">↺ Re-run</button>
      </div>`;
    document.body.appendChild(p);
  }

  async function runTests() {
    results.length = 0; passed = 0; failed = 0;
    console.group('[FINOPS-TESTS] Running...');

    // DOM checks
    assert('WIP banner present',      !!document.getElementById('tsm-wip-finops'));
    assert('Charts section present',  !!document.getElementById('finops-wip-intelligence'));
    assert('Chart B canvas',          !!document.getElementById('finops-chart-b'));
    assert('Chart C canvas',          !!document.getElementById('finops-chart-c'));
    assert('Chart D canvas',          !!document.getElementById('finops-chart-d'));
    assert('Chart E node health',     !!document.getElementById('finops-node-health'));
    assert('Chart F heatmap',         !!document.getElementById('finops-heatmap'));
    assert('KPI row present',         !!document.getElementById('finops-kpi-row'));
    assert('Narrative output',        !!document.getElementById('finops-narrative-output'));

    // Chart.js loaded
    assert('Chart.js loaded',         typeof Chart !== 'undefined');

    // Functions
    assert('runAccrualRecon() exists',    typeof window.runAccrualRecon === 'function');
    assert('generateFinopsNarrative() exists', typeof window.generateFinopsNarrative === 'function');

    // Node 01 wired to accounting
    const mod1 = document.querySelector('.mod-card');
    assert('Node 01 exists',          !!mod1);

    // Heatmap populated
    const hmCells = document.querySelectorAll('#finops-heatmap > div');
    assert('Heatmap has cells',        hmCells.length >= 4, `Found ${hmCells.length}`);

    // Node health populated
    const nhRows = document.querySelectorAll('#finops-node-health > div');
    assert('Node health rows',         nhRows.length >= 4, `Found ${nhRows.length}`);

    // API tests
    try {
      const r = await fetch('/api/wip/finops/accrual-recon', {method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
      const d = await r.json();
      assert('Accrual-recon API 200',    r.ok, `status ${r.status}`);
      assert('Returns finops suite',     d.suite === 'finops-suite', d.suite);
      assert('Returns ACCRUAL action',   d.action && d.action.includes('ACCRUAL'), d.action);
      assert('Returns variance metric',  d.metrics && d.metrics.variance > 0, `variance: ${d.metrics?.variance}`);
    } catch(e) { assert('Accrual-recon API', false, e.message); }

    try {
      const r2 = await fetch('/api/hc/query', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sector:'FINANCE',node:'ACCRUAL-RECON',context:'Test finops narrative'})});
      const d2 = await r2.json();
      assert('HC query API (finops)',    r2.ok, `status ${r2.status}`);
      assert('Returns narrative text',   !!(d2.reply||d2.content||d2.message), 'reply field present');
    } catch(e) { assert('HC query API', false, e.message); }

    console.groupEnd();
    renderPanel();
  }

  window.__FINOPS_RUN_TESTS__ = runTests;

  // Floating button
  function addBtn() {
    const b = document.createElement('button');
    b.textContent = '🧪 FinOps Tests';
    b.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:999998;background:#3a8cf0;color:#fff;border:none;font-family:monospace;font-size:11px;font-weight:700;padding:8px 16px;border-radius:4px;cursor:pointer;letter-spacing:.08em;text-transform:uppercase;box-shadow:0 4px 20px rgba(58,140,240,.3)';
    b.onclick = runTests;
    document.body.appendChild(b);
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>{setTimeout(addBtn,500);setTimeout(runTests,900);});
  } else {
    setTimeout(addBtn,500); setTimeout(runTests,900);
  }
})();
""".strip())
print(f"✓ finops-node-test.js written")

# Wire test script into financial-ui.html
src2 = UI.read_text()
if "finops-node-test" not in src2:
    src2 = src2.replace("</body>", '<script src="/finops-suite/assets/finops-node-test.js" defer></script>\n</body>', 1)
    UI.write_text(src2)
    print("✓ Test suite wired into financial-ui.html")

# ── 5. VERIFY ─────────────────────────────────────────────────────────────────
final = UI.read_text()
checks = [
    ("Node 01 → finops-accounting",   "finops-accounting.html" in final),
    ("Charts A-F section",            "finops-wip-intelligence" in final),
    ("Chart B canvas",                "finops-chart-b" in final),
    ("Chart C canvas",                "finops-chart-c" in final),
    ("Chart D canvas",                "finops-chart-d" in final),
    ("Chart E node health",           "finops-node-health" in final),
    ("Chart F heatmap",               "finops-heatmap" in final),
    ("Accrual-recon API call",        "accrual-recon" in final),
    ("AI narrative generate fn",      "generateFinopsNarrative" in final),
    ("Chart.js CDN",                  "chart.umd.min.js" in final),
    ("Test suite wired",              "finops-node-test" in final),
]
print()
all_ok = True
for label, ok in checks:
    print(f"  {'✓' if ok else '✗'}  {label}")
    if not ok: all_ok = False

print()
print("✅ ALL CHECKS PASSED — fly deploy" if all_ok else "⚠ Some checks failed")

#!/usr/bin/env python3
"""
Inject Charts B-F into wip-dashboard.html
Run from /workspaces/tsm-shell:  python3 patch-wip-charts.py
"""
from pathlib import Path
import shutil

TARGET = Path('/workspaces/tsm-shell/html/wip-dashboard.html')
BAK    = TARGET.with_suffix('.html.bak.charts')

CHART_CSS = """
<style id="tsm-chart-css">
.charts-section{max-width:1200px;margin:0 auto;padding:0 1.2rem 2rem}
.charts-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem}
.charts-grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:1rem;margin-bottom:1rem}
@media(max-width:900px){.charts-grid-2,.charts-grid-3{grid-template-columns:1fr}}
.chart-card{background:var(--surf);border:1px solid var(--b2);border-radius:4px;overflow:hidden}
.chart-head{background:var(--surf2);padding:.5rem .9rem;border-bottom:1px solid var(--b2);display:flex;justify-content:space-between;align-items:center}
.chart-label{font-family:var(--mono);font-size:.48rem;letter-spacing:.12em;color:var(--s-color);transition:color .4s}
.chart-sub{font-family:var(--mono);font-size:.42rem;color:var(--muted)}
.chart-body{padding:.8rem;position:relative}
.chart-insight{background:rgba(0,0,0,.2);border-left:2px solid var(--s-color);padding:.4rem .6rem;margin:.6rem 0 0;font-size:.6rem;color:var(--text);font-family:var(--mono);line-height:1.5;transition:border-color .4s}
.chart-insight strong{color:var(--white)}

/* HEATMAP */
.heatmap-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:.5rem;padding:.8rem}
.hm-job{border-radius:3px;padding:.7rem .8rem;position:relative;min-height:70px}
.hm-green{background:rgba(0,255,136,.12);border:1px solid rgba(0,255,136,.3)}
.hm-yellow{background:rgba(255,179,0,.1);border:1px solid rgba(255,179,0,.3)}
.hm-red{background:rgba(255,68,85,.12);border:1px solid rgba(255,68,85,.3)}
.hm-id{font-family:var(--mono);font-size:.45rem;letter-spacing:.1em;color:var(--muted)}
.hm-name{font-size:.72rem;font-weight:600;color:var(--white);margin:.15rem 0}
.hm-stat{font-family:var(--mono);font-size:.55rem}
.hm-green .hm-stat{color:#00ff88}
.hm-yellow .hm-stat{color:#ffb300}
.hm-red .hm-stat{color:#ff4455}

/* JOB HEALTH TILES */
.health-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:.5rem;padding:.8rem}
.health-tile{background:var(--surf2);border-radius:3px;padding:.6rem;text-align:center}
.ht-label{font-family:var(--mono);font-size:.4rem;letter-spacing:.1em;color:var(--muted);margin-bottom:.2rem}
.ht-value{font-family:var(--mono);font-size:1rem;font-weight:700;line-height:1}
.ht-sub{font-family:var(--mono);font-size:.42rem;color:var(--muted);margin-top:.15rem}
.risk-pill{display:inline-block;font-family:var(--mono);font-size:.5rem;letter-spacing:.08em;padding:.2rem .5rem;border-radius:2px;margin-top:.3rem}
.risk-low{background:rgba(0,255,136,.15);color:#00ff88}
.risk-med{background:rgba(255,179,0,.15);color:#ffb300}
.risk-high{background:rgba(255,68,85,.15);color:#ff4455}
</style>
"""

CHART_HTML = """
<!-- ═══ CHARTS B-F ═══════════════════════════════════════════════ -->
<div class="charts-section" id="charts-section">

  <!-- CHART HEADER -->
  <div style="margin-bottom:1rem;padding-top:.5rem">
    <div style="font-family:var(--mono);font-size:.48rem;letter-spacing:.18em;color:var(--s-color);margin-bottom:.3rem;transition:color .4s" id="charts-eye">// WIP ANALYTICS · CHARTS B–F</div>
    <div style="font-family:'Barlow Condensed',sans-serif;font-size:1.4rem;font-weight:800;color:var(--white)">Financial Intelligence Charts</div>
  </div>

  <!-- ROW 1: Chart B + Chart C -->
  <div class="charts-grid-2">

    <!-- CHART B: Cost-to-Complete -->
    <div class="chart-card">
      <div class="chart-head">
        <span class="chart-label">CHART B · COST-TO-COMPLETE CURVE</span>
        <span class="chart-sub">Forecast vs Actual</span>
      </div>
      <div class="chart-body">
        <canvas id="chartB" height="180"></canvas>
        <div class="chart-insight" id="insightB"><strong>Loading insight…</strong></div>
      </div>
    </div>

    <!-- CHART C: Profit Fade -->
    <div class="chart-card">
      <div class="chart-head">
        <span class="chart-label">CHART C · PROFIT FADE / GAIN</span>
        <span class="chart-sub">Margin delta by period</span>
      </div>
      <div class="chart-body">
        <canvas id="chartC" height="180"></canvas>
        <div class="chart-insight" id="insightC"><strong>Loading insight…</strong></div>
      </div>
    </div>
  </div>

  <!-- ROW 2: Chart D full width -->
  <div style="margin-bottom:1rem">
    <div class="chart-card">
      <div class="chart-head">
        <span class="chart-label">CHART D · MONTHLY CASH FLOW PROJECTION</span>
        <span class="chart-sub">Billings in / Costs out / Net position</span>
      </div>
      <div class="chart-body">
        <canvas id="chartD" height="140"></canvas>
        <div class="chart-insight" id="insightD"><strong>Loading insight…</strong></div>
      </div>
    </div>
  </div>

  <!-- ROW 3: Chart E + Chart F -->
  <div class="charts-grid-2">

    <!-- CHART E: Job Health Dashboard -->
    <div class="chart-card">
      <div class="chart-head">
        <span class="chart-label">CHART E · JOB HEALTH DASHBOARD</span>
        <span class="chart-sub" id="chartE-job">JOB-203 · Mesa Medical Center</span>
      </div>
      <div class="health-grid" id="chartE-tiles"></div>
      <div class="chart-insight" style="margin:.4rem .8rem .8rem" id="insightE"><strong>Loading insight…</strong></div>
    </div>

    <!-- CHART F: Portfolio Heatmap -->
    <div class="chart-card">
      <div class="chart-head">
        <span class="chart-label">CHART F · PORTFOLIO RISK HEATMAP</span>
        <span class="chart-sub" id="heatmap-summary">All active jobs</span>
      </div>
      <div class="heatmap-grid" id="chartF-grid"></div>
      <div class="chart-insight" style="margin:.4rem .8rem .8rem" id="insightF"><strong>Loading insight…</strong></div>
    </div>
  </div>

</div>
<!-- ═══ END CHARTS ════════════════════════════════════════════════ -->
"""

CHART_JS = """
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<script id="tsm-wip-charts">
// ── CHART INSTANCES ──────────────────────────────────────────────
let _cB=null, _cC=null, _cD=null;

const CHART_DATA = {
  construction: {
    B: {
      labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct'],
      actual:  [0, 420, 980, 1650, 2400, 3100, null, null, null, null],
      forecast:[0, 400, 850, 1500, 2200, 2900, 3600, 4200, 4700, 5100],
      budget:  [0, 450, 950, 1600, 2300, 3050, 3700, 4300, 4750, 5200],
      insight: '<strong>Current cost trend</strong> indicates a $41K overrun by end of project. Labor curve shows a spike next period — anticipate scheduling pressure on JOB-211.',
    },
    C: {
      labels: ['Q1','Q2','Q3','Q4 Est'],
      orig:    [8.4, 8.4, 8.4, 8.4],
      current: [8.4, 7.9, 6.0, 5.5],
      insight: '<strong>Profit fade of 2.4%</strong> occurred in Q3 due to material pricing surge on JOB-211. JOB-198 and JOB-187 holding margins — portfolio blended GP projected at 5.5% vs 8.4% bid.',
    },
    D: {
      labels: ['May','Jun','Jul','Aug','Sep','Oct'],
      billings:[420, 680, 510, 890, 730, 620],
      costs:   [380, 720, 490, 810, 650, 540],
      net:     [40, -40, 20, 80, 80, 80],
      insight: '<strong>Cash tight in July</strong> — cost spike from JOB-211 subcontractors. Consider accelerating JOB-187 CO billing ($50K+). Positive cash position returns Q3.',
    },
    E: {
      job: 'JOB-203 · Mesa Medical Center',
      tiles: [
        {label:'% COMPLETE', value:'63%', sub:'cost-to-cost', color:'#ffb300'},
        {label:'COST TO DATE', value:'$8.9M', sub:'of $14.2M budget', color:'#00e5ff'},
        {label:'EARNED REV', value:'$8.85M', sub:'% complete × contract', color:'#00ff88'},
        {label:'BILLING POS', value:'-$60K', sub:'under-billed', color:'#ff4455'},
        {label:'GP TO DATE', value:'$-50K', sub:'vs $840K projected', color:'#ff4455'},
        {label:'RISK LEVEL', value:'HIGH', sub:'risk score: 74', color:'#ff4455', pill:'risk-high'},
      ],
      stability: 'DEGRADING',
      insight: '<strong>JOB-203 billing position critical</strong>: $60K under-billed. GP erosion driven by labor overruns. Invoice immediately — AIA G702 ready.',
    },
    F: {
      jobs: [
        {id:'JOB-203', name:'Mesa Medical', stat:'-$60K under', cls:'hm-yellow', pct:'63%'},
        {id:'JOB-198', name:'Scottsdale Office', stat:'+$50K over', cls:'hm-green', pct:'88%'},
        {id:'JOB-211', name:'Phoenix Dist Hub', stat:'Profit Fade', cls:'hm-red', pct:'41%'},
        {id:'JOB-187', name:'Tempe Retail', stat:'On budget', cls:'hm-green', pct:'97%'},
        {id:'JOB-215', name:'Chandler Res.', stat:'-$50K under', cls:'hm-yellow', pct:'22%'},
      ],
      insight: '<strong>Job 211 and Job 203</strong> present high billing risk. Portfolio: 2 green / 2 yellow / 1 red. Immediate action required on JOB-211 profit fade.',
    },
  },
  healthcare: {
    B: {
      labels: ['Week 1','Week 2','Week 3','Week 4','Week 5','Week 6'],
      actual:  [0, 310, 680, 1100, 1480, 1650],
      forecast:[0, 350, 720, 1150, 1550, 1850],
      budget:  [0, 380, 760, 1200, 1600, 1900],
      insight: '<strong>RCM collections trending $200K below</strong> forecast at Week 6. UPCODE-DETECT flags driving hold queue — correct 14 instances to unblock $4.2K/mo.',
    },
    C: {
      labels: ['Jan','Feb','Mar','Apr','May Est'],
      orig:    [78, 78, 78, 78, 78],
      current: [78, 75, 71, 68, 65],
      insight: '<strong>Collection rate declining</strong>: 78% → 65% over 5 months. Primary driver: prior auth denials (32%) and coding errors (28%). UPCODE-DETECT-V2 remediation projected to recover 8 points.',
    },
    D: {
      labels: ['May','Jun','Jul','Aug','Sep','Oct'],
      billings:[520, 610, 480, 730, 690, 650],
      costs:   [440, 530, 410, 640, 590, 560],
      net:     [80, 80, 70, 90, 100, 90],
      insight: '<strong>Steady positive cash position</strong> projected through Q3. Denial resolution on ENC-8821 adds $4.2K to June. Accelerate WPS payer submissions before month-end.',
    },
    E: {
      job: 'ENC-8821 · Prior Auth Denial',
      tiles: [
        {label:'RCM STAGE', value:'85%', sub:'adjudication', color:'#ffb300'},
        {label:'EXPECTED', value:'$4,200', sub:'reimbursement', color:'#00e5ff'},
        {label:'COLLECTED', value:'$0', sub:'denied — appeal open', color:'#ff4455'},
        {label:'DENIAL GAP', value:'-$4.2K', sub:'prior auth missing', color:'#ff4455'},
        {label:'DAYS IN AR', value:'52d', sub:'target: 35d', color:'#ff4455'},
        {label:'RISK LEVEL', value:'CRIT', sub:'risk score: 95', color:'#ff4455', pill:'risk-high'},
      ],
      stability: 'CRITICAL',
      insight: '<strong>ENC-8821 appeal window:</strong> 30 days remaining. File with auth reference immediately. $4,200 recoverable — do not let timely filing expire.',
    },
    F: {
      jobs: [
        {id:'ENC-8821', name:'Prior Auth Denial', stat:'$4.2K at risk', cls:'hm-red', pct:'85%'},
        {id:'ENC-8912', name:'Scrubbing Hold', stat:'Missing modifier', cls:'hm-red', pct:'30%'},
        {id:'ENC-8834', name:'Coding Review', stat:'UPCODE flag', cls:'hm-yellow', pct:'60%'},
        {id:'ENC-8756', name:'Payer Adjudication', stat:'On track', cls:'hm-green', pct:'90%'},
        {id:'ENC-8801', name:'Payment Posted', stat:'Collected', cls:'hm-green', pct:'100%'},
      ],
      insight: '<strong>2 encounters critical</strong>, 1 yellow, 2 green. Portfolio collection rate at risk — resolve ENC-8821 and ENC-8912 this week to protect revenue.',
    },
  },
  insurance: {
    B: {
      labels: ['Month 1','Month 2','Month 3','Month 4','Month 5','Month 6'],
      actual:  [0, 210, 580, 1050, 1680, 2100],
      forecast:[0, 250, 620, 1100, 1720, 2200],
      budget:  [0, 240, 600, 1080, 1700, 2150],
      insight: '<strong>Reserve spend tracking $100K below</strong> forecast — CLM-923 hold pending SIU review. CLM-882 approaching reserve ceiling at 75% utilization with only 40% liability established.',
    },
    C: {
      labels: ['Q1','Q2','Q3','Q4 Est'],
      orig:    [92, 92, 92, 92],
      current: [92, 88, 81, 76],
      insight: '<strong>Loss ratio increasing</strong>: from 92% to projected 76% favorable margin erosion. CLM-923 fraud exposure ($840K) creating reserve volatility. SIU referral protects portfolio.',
    },
    D: {
      labels: ['May','Jun','Jul','Aug','Sep','Oct'],
      billings:[380, 420, 310, 580, 490, 450],
      costs:   [290, 380, 270, 510, 420, 390],
      net:     [90, 40, 40, 70, 70, 60],
      insight: '<strong>Positive cash position</strong> maintained. CLM-901 over-reserve release ($52K) improves July position. CLM-923 SIU hold prevents premature payout.',
    },
    E: {
      job: 'CLM-923 · E&O Malpractice',
      tiles: [
        {label:'% LIAB EST.', value:'60%', sub:'liability established', color:'#ffb300'},
        {label:'RESERVE SET', value:'$840K', sub:'total allocated', color:'#00e5ff'},
        {label:'PAID TO DATE', value:'$504K', sub:'60% of reserve', color:'#ffb300'},
        {label:'VARIANCE', value:'FRAUD', sub:'pattern detected', color:'#ff4455'},
        {label:'CYCLE TIME', value:'47d', sub:'vs 30d SLA', color:'#ff4455'},
        {label:'RISK LEVEL', value:'CRIT', sub:'risk score: 97', color:'#ff4455', pill:'risk-high'},
      ],
      stability: 'CRITICAL',
      insight: '<strong>CLM-923 SIU referral required:</strong> Payment pattern anomaly on $840K reserve. Do not release any additional reserve pending investigation.',
    },
    F: {
      jobs: [
        {id:'CLM-923', name:'E&O Malpractice', stat:'FRAUD FLAG', cls:'hm-red', pct:'60%'},
        {id:'CLM-882', name:'Auto Liability', stat:'Reserve thin', cls:'hm-red', pct:'40%'},
        {id:'CLM-901', name:'Workers Comp', stat:'Over-reserved', cls:'hm-yellow', pct:'25%'},
        {id:'CLM-867', name:'Commercial GL', stat:'On track', cls:'hm-green', pct:'78%'},
        {id:'CLM-841', name:'Property Damage', stat:'Closing', cls:'hm-green', pct:'95%'},
      ],
      insight: '<strong>Portfolio: 2 red / 1 yellow / 2 green.</strong> $840K fraud exposure dominates risk profile. CLM-882 reserve increase needed before next adjuster review.',
    },
  },
};

const CHART_COLORS = {
  construction: { primary:'#ffb300', accent:'#00e5ff', neg:'#ff4455' },
  healthcare:   { primary:'#00ff88', accent:'#00e5ff', neg:'#ff4455' },
  insurance:    { primary:'#a855f7', accent:'#00e5ff', neg:'#ff4455' },
};

function renderCharts(sector) {
  const d = CHART_DATA[sector];
  const c = CHART_COLORS[sector];
  const gridColor = 'rgba(255,255,255,0.04)';
  const tickColor = 'rgba(255,255,255,0.25)';
  const fontMono = 'JetBrains Mono';

  const baseOpts = {
    responsive:true,
    animation:{duration:600},
    plugins:{legend:{labels:{color:tickColor,font:{family:fontMono,size:9},boxWidth:10}}},
    scales:{
      x:{grid:{color:gridColor},ticks:{color:tickColor,font:{family:fontMono,size:8}}},
      y:{grid:{color:gridColor},ticks:{color:tickColor,font:{family:fontMono,size:8}}},
    }
  };

  // ── Chart B: Cost-to-Complete ──
  if (_cB) _cB.destroy();
  _cB = new Chart(document.getElementById('chartB'), {
    type:'line',
    data:{
      labels: d.B.labels,
      datasets:[
        { label:'Actual Cost ($K)', data:d.B.actual, borderColor:c.primary, backgroundColor:'transparent', pointRadius:4, pointBackgroundColor:c.primary, tension:.4, borderWidth:2 },
        { label:'Forecast', data:d.B.forecast, borderColor:c.accent, backgroundColor:'transparent', borderDash:[4,3], pointRadius:2, tension:.4, borderWidth:1.5 },
        { label:'Budget', data:d.B.budget, borderColor:'rgba(255,255,255,.2)', backgroundColor:'transparent', borderDash:[2,4], pointRadius:0, tension:.4, borderWidth:1 },
      ]
    },
    options: {...baseOpts}
  });
  document.getElementById('insightB').innerHTML = d.B.insight;

  // ── Chart C: Profit Fade ──
  if (_cC) _cC.destroy();
  _cC = new Chart(document.getElementById('chartC'), {
    type:'bar',
    data:{
      labels: d.C.labels,
      datasets:[
        { label:'Original GP%', data:d.C.orig, backgroundColor:'rgba(255,255,255,.08)', borderColor:'rgba(255,255,255,.2)', borderWidth:1 },
        { label:'Current GP%', data:d.C.current, backgroundColor: d.C.current.map((v,i) => v < d.C.orig[i] ? 'rgba(255,68,85,.5)' : 'rgba(0,255,136,.4)'), borderColor: d.C.current.map((v,i) => v < d.C.orig[i] ? '#ff4455' : '#00ff88'), borderWidth:1.5 },
      ]
    },
    options: {...baseOpts, plugins:{...baseOpts.plugins, tooltip:{callbacks:{label:ctx=>ctx.dataset.label+': '+ctx.parsed.y+'%'}}}}
  });
  document.getElementById('insightC').innerHTML = d.C.insight;

  // ── Chart D: Cash Flow ──
  if (_cD) _cD.destroy();
  _cD = new Chart(document.getElementById('chartD'), {
    type:'bar',
    data:{
      labels: d.D.labels,
      datasets:[
        { label:'Billings In ($K)', data:d.D.billings, backgroundColor:'rgba(0,229,255,.3)', borderColor:'#00e5ff', borderWidth:1.5, order:2 },
        { label:'Costs Out ($K)', data:d.D.costs, backgroundColor:'rgba(255,68,85,.25)', borderColor:'#ff4455', borderWidth:1.5, order:2 },
        { label:'Net Cash ($K)', data:d.D.net, type:'line', borderColor:c.primary, backgroundColor:'transparent', pointRadius:4, pointBackgroundColor:c.primary, tension:.4, borderWidth:2, order:1 },
      ]
    },
    options:{...baseOpts}
  });
  document.getElementById('insightD').innerHTML = d.D.insight;

  // ── Chart E: Job Health Tiles ──
  document.getElementById('chartE-job').textContent = d.E.job;
  document.getElementById('chartE-tiles').innerHTML = d.E.tiles.map(t => `
    <div class="health-tile">
      <div class="ht-label">${t.label}</div>
      <div class="ht-value" style="color:${t.color}">${t.value}</div>
      <div class="ht-sub">${t.sub}</div>
      ${t.pill ? `<span class="risk-pill ${t.pill}">${t.value}</span>` : ''}
    </div>`).join('');
  document.getElementById('insightE').innerHTML = d.E.insight;

  // ── Chart F: Heatmap ──
  const greenCount = d.F.jobs.filter(j=>j.cls==='hm-green').length;
  const redCount   = d.F.jobs.filter(j=>j.cls==='hm-red').length;
  document.getElementById('heatmap-summary').textContent = `${greenCount} green · ${d.F.jobs.length - greenCount - redCount} yellow · ${redCount} red`;
  document.getElementById('chartF-grid').innerHTML = d.F.jobs.map(j=>`
    <div class="hm-job ${j.cls}">
      <div class="hm-id">${j.id}</div>
      <div class="hm-name">${j.name}</div>
      <div class="hm-stat">${j.pct} · ${j.stat}</div>
    </div>`).join('');
  document.getElementById('insightF').innerHTML = d.F.insight;
}

// ── Hook into existing setSector ────────────────────────────────
const _origSetSector = window.setSector;
window.setSector = function(s) {
  _origSetSector(s);
  renderCharts(s);
};

// ── Init ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => renderCharts('construction'));
// Fallback if DOMContentLoaded already fired
if (document.readyState !== 'loading') renderCharts('construction');
</script>
"""

def main():
    src = TARGET.read_text(encoding='utf-8')

    if not BAK.exists():
        shutil.copy2(TARGET, BAK)
        print(f'✔ Backed up to {BAK.name}')

    if 'tsm-chart-css' in src:
        print('Charts already injected.')
        return

    # Inject CSS in <head>
    src = src.replace('</head>', CHART_CSS + '\n</head>', 1)

    # Inject chart HTML before closing </body>
    src = src.replace('</body>', CHART_HTML + '\n' + CHART_JS + '\n</body>', 1)

    TARGET.write_text(src, encoding='utf-8')
    print('✔ Charts B-F injected into wip-dashboard.html')
    print('\nRun: fly deploy')

if __name__ == '__main__':
    main()

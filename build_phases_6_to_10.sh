#!/usr/bin/env bash
set -euo pipefail
# TSM Phase 6-10 Batch Build
# CRM · MDM · Integration Hub · Governance · Digital Twin
# Run from: /workspaces/TSM-Consultz-

TS=$(date +%Y%m%d_%H%M%S)
BACKUP="backup_phases6to10_${TS}"
mkdir -p "$BACKUP"
cp server.js "$BACKUP/server.js.bak"
cp html/tsm-wip-command-center.html "$BACKUP/wip.bak"
echo "Backups saved to $BACKUP"

# ── Directories ───────────────────────────────────────────────────────────────
mkdir -p html/war-rooms/crm/{data,services}
mkdir -p html/war-rooms/mdm/{data,services}
mkdir -p html/war-rooms/integration-hub/{data,services}
mkdir -p html/war-rooms/governance/{data,services}
mkdir -p html/war-rooms/digital-twin/{data,services}

# ══════════════════════════════════════════════════════════════════════════════
# PHASE 2 — CRM
# ══════════════════════════════════════════════════════════════════════════════
cat > html/war-rooms/crm/data/crm-model.json << 'EOF'
{
  "version": "1.0.0",
  "kpis": [
    { "id": "open_leads",       "label": "Open Leads",      "unit": "count" },
    { "id": "pipeline_value",   "label": "Pipeline Value",  "unit": "usd"   },
    { "id": "sla_breach_count", "label": "SLA Breaches",    "unit": "count" },
    { "id": "churn_risk_count", "label": "Churn Risk",      "unit": "count" },
    { "id": "win_rate",         "label": "Win Rate",        "unit": "pct"   },
    { "id": "health_avg",       "label": "Avg Health Score","unit": "count" }
  ],
  "lead_stages": ["New","Contacted","Qualified","Proposal","Negotiation","Won","Lost"],
  "sla_hours": { "New": 4, "Contacted": 24, "Qualified": 48, "Proposal": 72, "Negotiation": 120 },
  "sample_data": {
    "leads": [
      { "id":"LD-001","name":"Honeywell Inc","stage":"Proposal","value":280000,"health":82,"owner":"R. Whitfield","stage_entered_at":"2026-06-20T09:00:00Z","churn_risk":false },
      { "id":"LD-002","name":"Mesa Industrial","stage":"Qualified","value":95000,"health":71,"owner":"M. Chen","stage_entered_at":"2026-06-25T14:00:00Z","churn_risk":false },
      { "id":"LD-003","name":"Phoenix Convention","stage":"Negotiation","value":142000,"health":55,"owner":"T. Osei","stage_entered_at":"2026-06-18T11:00:00Z","churn_risk":true },
      { "id":"LD-004","name":"Glendale Data Center","stage":"New","value":97500,"health":90,"owner":"S. Novak","stage_entered_at":"2026-06-29T08:00:00Z","churn_risk":false },
      { "id":"LD-005","name":"Tempe University","stage":"Contacted","value":32400,"health":44,"owner":"K. Park","stage_entered_at":"2026-06-22T16:00:00Z","churn_risk":true }
    ]
  }
}
EOF

cat > html/war-rooms/crm/services/crm-engine.js << 'EOF'
class TSMCRMEngine {
  constructor(model) { this.model = model || {}; this.leads = []; this._key = 'TSM_CRM_STATE'; }
  loadFromStorage() {
    try { const s = JSON.parse(localStorage.getItem(this._key) || 'null'); if (s) { this.leads = s.leads || []; return this.leads.length > 0; } } catch(e) {}
    return false;
  }
  saveToStorage() { try { localStorage.setItem(this._key, JSON.stringify({ leads: this.leads, savedAt: Date.now() })); } catch(e) {} }
  clearStorage() { try { localStorage.removeItem(this._key); } catch(e) {} this.leads = []; }
  loadSampleData() { this.leads = (this.model.sample_data?.leads || []).map(l => ({...l})); }
  computeKpis() {
    const active = this.leads.filter(l => !['Won','Lost'].includes(l.stage));
    const won = this.leads.filter(l => l.stage === 'Won').length;
    const closed = this.leads.filter(l => ['Won','Lost'].includes(l.stage)).length;
    const breaches = this.getSlaBreaches();
    const churn = this.leads.filter(l => l.churn_risk).length;
    const healths = this.leads.filter(l => l.health != null).map(l => l.health);
    return {
      open_leads: active.length,
      pipeline_value: active.reduce((s,l) => s + (l.value||0), 0),
      sla_breach_count: breaches.length,
      churn_risk_count: churn,
      win_rate: closed ? Math.round(won/closed*100) : 0,
      health_avg: healths.length ? Math.round(healths.reduce((a,b)=>a+b,0)/healths.length) : 0
    };
  }
  getSlaBreaches() {
    const sla = this.model.sla_hours || {};
    const now = Date.now();
    return this.leads.filter(l => !['Won','Lost'].includes(l.stage) && l.stage_entered_at).map(l => {
      const hours = (now - new Date(l.stage_entered_at).getTime()) / 3600000;
      return { id: l.id, name: l.name, stage: l.stage, hours_over: Math.round(hours - (sla[l.stage]||48)) };
    }).filter(b => b.hours_over > 0);
  }
  async runAnalysis() {
    const res = await fetch('/api/crm/query', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leads: this.leads, kpis: this.computeKpis(), lead_breaches: this.getSlaBreaches(), maxTokens: 1200 })
    });
    if (!res.ok) throw new Error(`/api/crm/query ${res.status}`);
    return res.json();
  }
  buildRelayPayload(aiText) {
    return { vertical: 'crm', leads: this.leads, kpis: this.computeKpis(), sla_breaches: this.getSlaBreaches(), ai_analysis: aiText, timestamp: new Date().toISOString() };
  }
}
EOF

cat > html/war-rooms/crm/crm-war-room.html << 'PAGEEOF'
<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>TSM CRM War Room</title>
<style>
:root{--bg:#0a0814;--bg2:#0f0d1e;--bg3:#131228;--border:rgba(168,85,247,.12);
--purple:#a855f7;--purple-dim:rgba(168,85,247,.6);--gold:#ffd700;--red:#ff3b3b;
--amber:#ff9500;--green:#22c55e;--text:#d8c8f0;--text-dim:#5a4a7a;--card:#100e20;}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--text);font-family:'Courier New',monospace;font-size:12px;min-height:100vh}
.nav{display:flex;align-items:center;background:#08060f;border-bottom:1px solid var(--border);height:38px;padding:0 16px}
.nav-brand{color:var(--purple);font-weight:700;font-size:11px;letter-spacing:2px;margin-right:24px}
.nav-right{margin-left:auto;display:flex;gap:16px;color:var(--text-dim);font-size:10px}
.nav-clock{color:var(--purple-dim)}
.alert-bar{background:rgba(255,59,59,.06);border-bottom:1px solid rgba(255,59,59,.2);padding:6px 20px;display:flex;align-items:center;gap:8px;font-size:10px;letter-spacing:1.5px;color:var(--red)}
.alert-dot{width:6px;height:6px;border-radius:50%;background:var(--red);animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
.layout{display:grid;grid-template-columns:260px 1fr;height:calc(100vh - 56px)}
.sidebar{background:var(--bg2);border-right:1px solid var(--border);padding:14px;display:flex;flex-direction:column;gap:12px;overflow-y:auto}
.sb-label{font-size:9px;letter-spacing:2px;color:var(--text-dim);margin-bottom:6px}
.btn{border:1px solid;font-family:inherit;font-size:9px;letter-spacing:1.5px;cursor:pointer;padding:7px 12px;transition:all .2s;width:100%;margin-bottom:4px}
.btn-purple{background:var(--purple);border-color:var(--purple);color:#fff;font-weight:700}
.btn-ghost{background:transparent;border-color:var(--border);color:var(--text-dim)}
.btn-ghost:hover{border-color:var(--text-dim);color:var(--text)}
.btn-gold{background:var(--gold);border-color:var(--gold);color:#000;font-weight:700}
.snap-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.snap-item{background:var(--bg3);border:1px solid var(--border);padding:6px 8px}
.snap-label{font-size:8px;color:var(--text-dim);letter-spacing:1px;margin-bottom:3px}
.snap-val{font-size:13px;color:var(--purple);font-weight:700}
.snap-val.warn{color:var(--amber)} .snap-val.bad{color:var(--red)}
.main{overflow-y:auto;background:var(--bg);padding:18px 22px}
.kpi-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin-bottom:20px}
.kpi-card{background:var(--card);border:1px solid var(--border);padding:12px 10px}
.kpi-label{font-size:8px;letter-spacing:1px;color:var(--text-dim);margin-bottom:6px;text-transform:uppercase}
.kpi-value{font-size:18px;font-weight:700;color:var(--purple)}
.kpi-value.warn{color:var(--amber)} .kpi-value.bad{color:var(--red)} .kpi-value.good{color:var(--green)}
.section{background:var(--card);border:1px solid var(--border);margin-bottom:18px}
.section-head{padding:10px 14px;border-bottom:1px solid var(--border);font-size:10px;letter-spacing:1.5px;color:var(--text-dim);display:flex;justify-content:space-between}
.section-body{padding:14px}
table{width:100%;border-collapse:collapse;font-size:10px}
th{text-align:left;color:var(--text-dim);font-size:8px;letter-spacing:1px;padding:6px 8px;border-bottom:1px solid var(--border)}
td{padding:7px 8px;border-bottom:1px solid var(--border);color:var(--text)}
.tag{display:inline-block;font-size:8px;padding:2px 6px;border:1px solid}
.tag-bad{color:var(--red);border-color:var(--red)} .tag-ok{color:var(--green);border-color:var(--green)} .tag-warn{color:var(--amber);border-color:var(--amber)}
.health-bar{height:4px;background:var(--bg3);border-radius:2px;margin-top:3px;width:60px;display:inline-block;vertical-align:middle}
.health-fill{height:100%;border-radius:2px}
.ai-output{background:var(--bg3);border:1px solid var(--border);padding:12px;font-size:10px;line-height:1.6;color:var(--text);white-space:pre-wrap;min-height:80px}
.ai-output.loading{color:var(--text-dim)}
</style></head><body>
<div class="nav">
  <div class="nav-brand">TSM SHELL // CRM</div>
  <div class="nav-right"><span id="navStatus">ENGINE: IDLE</span><span class="nav-clock" id="navClock">--:--:--</span></div>
</div>
<div class="alert-bar" id="alertBar" style="display:none">
  <span class="alert-dot"></span><span id="alertText"></span>
</div>
<div class="layout">
  <div class="sidebar">
    <div><div class="sb-label">DATA</div>
      <button class="btn btn-ghost" id="btnLoad">LOAD SAMPLE DATA</button>
      <button class="btn btn-ghost" id="btnReset">RESET DATA</button>
    </div>
    <div><div class="sb-label">SNAPSHOT</div>
      <div class="snap-grid" id="snapGrid"></div>
    </div>
    <div style="margin-top:auto">
      <button class="btn btn-purple" id="btnAnalyze">RUN AI ANALYSIS</button>
      <button class="btn btn-gold" id="btnRelay">RELAY TO STRATEGIST &rarr;</button>
    </div>
  </div>
  <div class="main">
    <div style="margin-bottom:16px">
      <div style="font-size:13px;letter-spacing:1px">CRM <b style="color:var(--purple)">WAR ROOM</b></div>
      <div style="color:var(--text-dim);font-size:10px;margin-top:2px">Lead &rarr; Qualify &rarr; Propose &rarr; Negotiate &rarr; Win &rarr; Retain</div>
    </div>
    <div class="kpi-grid" id="kpiGrid"></div>
    <div class="section">
      <div class="section-head"><span>LEAD & OPPORTUNITY PIPELINE</span><span id="pipelineMeta"></span></div>
      <div class="section-body" id="pipelineBody"><div style="color:var(--text-dim);padding:20px;text-align:center">No leads loaded.</div></div>
    </div>
    <div class="section">
      <div class="section-head"><span>AI RISK ANALYSIS</span></div>
      <div class="section-body"><div class="ai-output" id="aiOutput">Run analysis to get AI-generated pipeline risk and next-best-action recommendations.</div></div>
    </div>
  </div>
</div>
<script src="/runtime/kernel/canonical-core.js"></script>
<script src="/war-rooms/crm/services/crm-engine.js"></script>
<script>
(function(){
  let MODEL=null, engine=null;
  function tick(){ document.getElementById('navClock').textContent=new Date().toLocaleTimeString(); }
  setInterval(tick,1000); tick();
  async function init(){
    const r=await fetch('/war-rooms/crm/data/crm-model.json'); MODEL=await r.json();
    engine=new TSMCRMEngine(MODEL);
    if(engine.loadFromStorage()) renderAll();
    document.getElementById('navStatus').textContent=engine.leads.length?`ENGINE: ${engine.leads.length} LEADS`:'ENGINE: IDLE';
  }
  function renderAll(){
    if(!engine) return;
    const kpis=engine.computeKpis();
    renderKpis(kpis); renderPipeline(); renderSnapshot(kpis); toggleAlert(kpis);
    document.getElementById('navStatus').textContent=`ENGINE: ${engine.leads.length} LEADS`;
  }
  function renderKpis(k){
    const defs=MODEL.kpis||[];
    document.getElementById('kpiGrid').innerHTML=defs.map(d=>{
      let v=k[d.id], disp=v, cls='';
      if(d.unit==='usd') disp='$'+Number(v||0).toLocaleString();
      if(d.unit==='pct') disp=v+'%';
      if(d.id==='sla_breach_count'&&v>0) cls='bad';
      if(d.id==='churn_risk_count'&&v>0) cls='warn';
      if(d.id==='win_rate') cls=v>=60?'good':v>=40?'warn':'bad';
      if(d.id==='health_avg') cls=v>=70?'good':v>=50?'warn':'bad';
      return `<div class="kpi-card"><div class="kpi-label">${d.label}</div><div class="kpi-value ${cls}">${disp}</div></div>`;
    }).join('');
  }
  function renderPipeline(){
    const breaches=engine.getSlaBreaches(); const bMap={};
    breaches.forEach(b=>bMap[b.id]=b);
    document.getElementById('pipelineMeta').textContent=`${engine.leads.length} records · ${breaches.length} over SLA`;
    if(!engine.leads.length){ document.getElementById('pipelineBody').innerHTML='<div style="color:var(--text-dim);padding:20px;text-align:center">No leads loaded.</div>'; return; }
    const rows=engine.leads.map(l=>{
      const b=bMap[l.id];
      const slaTag=b?`<span class="tag tag-${b.hours_over>48?'bad':'warn'}">+${b.hours_over}H</span>`:'&mdash;';
      const churnTag=l.churn_risk?'<span class="tag tag-bad">CHURN</span>':'&mdash;';
      const hc=l.health>=70?'#22c55e':l.health>=50?'#ff9500':'#ff3b3b';
      const healthBar=`<div class="health-bar"><div class="health-fill" style="width:${l.health}%;background:${hc}"></div></div> ${l.health}`;
      return `<tr><td>${l.id}</td><td>${l.name}</td><td>${l.stage}</td><td>$${Number(l.value||0).toLocaleString()}</td><td>${l.owner}</td><td>${healthBar}</td><td>${churnTag}</td><td>${slaTag}</td></tr>`;
    }).join('');
    document.getElementById('pipelineBody').innerHTML=`<table><thead><tr><th>ID</th><th>ACCOUNT</th><th>STAGE</th><th>VALUE</th><th>OWNER</th><th>HEALTH</th><th>CHURN</th><th>OVER SLA</th></tr></thead><tbody>${rows}</tbody></table>`;
  }
  function renderSnapshot(k){
    document.getElementById('snapGrid').innerHTML=`
      <div class="snap-item"><div class="snap-label">LEADS</div><div class="snap-val">${k.open_leads}</div></div>
      <div class="snap-item"><div class="snap-label">PIPELINE</div><div class="snap-val">$${Math.round((k.pipeline_value||0)/1000)}K</div></div>
      <div class="snap-item"><div class="snap-label">CHURN RISK</div><div class="snap-val ${k.churn_risk_count?'warn':''}">${k.churn_risk_count}</div></div>
      <div class="snap-item"><div class="snap-label">OVER SLA</div><div class="snap-val ${k.sla_breach_count?'bad':''}">${k.sla_breach_count}</div></div>`;
  }
  function toggleAlert(k){
    const bar=document.getElementById('alertBar');
    if(k.sla_breach_count>0||k.churn_risk_count>0){
      bar.style.display='flex';
      document.getElementById('alertText').textContent=`${k.sla_breach_count} SLA breach(es), ${k.churn_risk_count} churn risk(s).`;
    } else bar.style.display='none';
  }
  async function runAnalysis(){
    const out=document.getElementById('aiOutput');
    out.className='ai-output loading'; out.textContent='Analyzing CRM pipeline...';
    try{ const d=await engine.runAnalysis(); out.className='ai-output'; out.textContent=d.answer||'No analysis returned.'; }
    catch(e){ out.className='ai-output'; out.textContent=`Analysis failed: ${e.message}`; }
    finally{ renderAll(); }
  }
  document.getElementById('btnLoad').addEventListener('click',()=>{ engine.loadSampleData(); engine.saveToStorage(); renderAll(); });
  document.getElementById('btnReset').addEventListener('click',()=>{ if(!confirm('Reset CRM data?')) return; engine.clearStorage(); renderAll(); });
  document.getElementById('btnAnalyze').addEventListener('click',runAnalysis);
  document.getElementById('btnRelay').addEventListener('click',()=>{
    const payload=engine.buildRelayPayload(document.getElementById('aiOutput').textContent);
    try{ localStorage.setItem('TSM_CRM_RELAY',JSON.stringify(payload)); } catch(e){}
    document.getElementById('navStatus').textContent='ENGINE: RELAYED';
  });
  init().catch(e=>console.error('[CRM]',e));
})();
</script>
</body></html>
PAGEEOF
echo "CRM war room created"

# ══════════════════════════════════════════════════════════════════════════════
# PHASE 6 — MDM
# ══════════════════════════════════════════════════════════════════════════════
cat > html/war-rooms/mdm/data/mdm-model.json << 'EOF'
{
  "version": "1.0.0",
  "domains": ["Customer","Vendor","Product","Employee","Asset","Location"],
  "kpis": [
    { "id": "total_records",    "label": "Total Records",    "unit": "count" },
    { "id": "duplicate_count",  "label": "Duplicates Found", "unit": "count" },
    { "id": "quality_score",    "label": "Data Quality",     "unit": "pct"   },
    { "id": "pending_approvals","label": "Pending Approvals","unit": "count" },
    { "id": "anomalies",        "label": "AI Anomalies",     "unit": "count" },
    { "id": "stewards_active",  "label": "Active Stewards",  "unit": "count" }
  ],
  "sample_data": {
    "records": [
      { "id":"MDM-001","domain":"Customer","name":"Phoenix Convention Center","quality":94,"duplicates":0,"status":"CLEAN","steward":"R. Whitfield","last_validated":"2026-06-28" },
      { "id":"MDM-002","domain":"Customer","name":"Phoenix Conv. Ctr","quality":91,"duplicates":1,"status":"DUPLICATE","steward":"R. Whitfield","last_validated":"2026-06-28" },
      { "id":"MDM-003","domain":"Vendor","name":"Honeywell Process Solutions","quality":88,"duplicates":0,"status":"CLEAN","steward":"M. Chen","last_validated":"2026-06-27" },
      { "id":"MDM-004","domain":"Product","name":"BMS-CORE-002","quality":72,"duplicates":0,"status":"INCOMPLETE","steward":"T. Osei","last_validated":"2026-06-25" },
      { "id":"MDM-005","domain":"Employee","name":"Whitfield, Latorrey","quality":98,"duplicates":0,"status":"CLEAN","steward":"S. Novak","last_validated":"2026-06-29" },
      { "id":"MDM-006","domain":"Location","name":"Dallas TX Plant","quality":61,"duplicates":0,"status":"STALE","steward":"K. Park","last_validated":"2026-05-10" }
    ]
  }
}
EOF

cat > html/war-rooms/mdm/mdm-war-room.html << 'PAGEEOF'
<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>TSM MDM War Room</title>
<style>
:root{--bg:#0a0f0a;--bg2:#0d140d;--bg3:#101810;--border:rgba(0,255,120,.1);
--green:#00ff78;--green-dim:rgba(0,255,120,.5);--gold:#ffd700;--red:#ff3b3b;
--amber:#ff9500;--text:#c8e8d0;--text-dim:#4a6a50;--card:#0d160d;}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--text);font-family:'Courier New',monospace;font-size:12px;min-height:100vh}
.nav{display:flex;align-items:center;background:#060d06;border-bottom:1px solid var(--border);height:38px;padding:0 16px}
.nav-brand{color:var(--green);font-weight:700;font-size:11px;letter-spacing:2px;margin-right:24px}
.nav-right{margin-left:auto;display:flex;gap:16px;color:var(--text-dim);font-size:10px}
.nav-clock{color:var(--green-dim)}
.layout{display:grid;grid-template-columns:260px 1fr;height:calc(100vh - 38px)}
.sidebar{background:var(--bg2);border-right:1px solid var(--border);padding:14px;display:flex;flex-direction:column;gap:12px;overflow-y:auto}
.sb-label{font-size:9px;letter-spacing:2px;color:var(--text-dim);margin-bottom:6px}
.btn{border:1px solid;font-family:inherit;font-size:9px;letter-spacing:1.5px;cursor:pointer;padding:7px 12px;width:100%;margin-bottom:4px;transition:.2s}
.btn-green{background:var(--green);border-color:var(--green);color:#000;font-weight:700}
.btn-ghost{background:transparent;border-color:var(--border);color:var(--text-dim)}
.btn-ghost:hover{color:var(--text);border-color:var(--text-dim)}
.btn-gold{background:var(--gold);border-color:var(--gold);color:#000;font-weight:700}
.domain-list{display:flex;flex-direction:column;gap:3px}
.domain-item{display:flex;justify-content:space-between;align-items:center;padding:5px 8px;background:var(--bg3);border:1px solid var(--border);font-size:9px}
.domain-name{color:var(--text)}  .domain-count{color:var(--green);font-weight:700}
.main{overflow-y:auto;background:var(--bg);padding:18px 22px}
.kpi-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin-bottom:20px}
.kpi-card{background:var(--card);border:1px solid var(--border);padding:12px 10px}
.kpi-label{font-size:8px;letter-spacing:1px;color:var(--text-dim);margin-bottom:6px;text-transform:uppercase}
.kpi-value{font-size:18px;font-weight:700;color:var(--green)}
.kpi-value.warn{color:var(--amber)} .kpi-value.bad{color:var(--red)} .kpi-value.good{color:var(--green)}
.section{background:var(--card);border:1px solid var(--border);margin-bottom:18px}
.section-head{padding:10px 14px;border-bottom:1px solid var(--border);font-size:10px;letter-spacing:1.5px;color:var(--text-dim);display:flex;justify-content:space-between}
.section-body{padding:14px}
table{width:100%;border-collapse:collapse;font-size:10px}
th{text-align:left;color:var(--text-dim);font-size:8px;letter-spacing:1px;padding:6px 8px;border-bottom:1px solid var(--border)}
td{padding:7px 8px;border-bottom:1px solid var(--border);color:var(--text)}
.tag{display:inline-block;font-size:8px;padding:2px 6px;border:1px solid}
.tag-clean{color:var(--green);border-color:var(--green)} .tag-dup{color:var(--red);border-color:var(--red)}
.tag-inc{color:var(--amber);border-color:var(--amber)} .tag-stale{color:var(--text-dim);border-color:var(--text-dim)}
.quality-bar{width:60px;height:4px;background:var(--bg3);border-radius:2px;display:inline-block;vertical-align:middle}
.quality-fill{height:100%;border-radius:2px}
.ai-output{background:var(--bg3);border:1px solid var(--border);padding:12px;font-size:10px;line-height:1.6;color:var(--text);white-space:pre-wrap;min-height:80px}
.ai-output.loading{color:var(--text-dim)}
</style></head><body>
<div class="nav">
  <div class="nav-brand">TSM SHELL // MDM</div>
  <div class="nav-right"><span id="navStatus">ENGINE: IDLE</span><span class="nav-clock" id="navClock">--:--:--</span></div>
</div>
<div class="layout">
  <div class="sidebar">
    <div><div class="sb-label">DATA</div>
      <button class="btn btn-ghost" id="btnLoad">LOAD SAMPLE DATA</button>
      <button class="btn btn-ghost" id="btnReset">RESET DATA</button>
    </div>
    <div><div class="sb-label">DOMAINS</div>
      <div class="domain-list" id="domainList"></div>
    </div>
    <div style="margin-top:auto">
      <button class="btn btn-green" id="btnAnalyze">RUN AI ANALYSIS</button>
      <button class="btn btn-gold" id="btnRelay">RELAY TO STRATEGIST &rarr;</button>
    </div>
  </div>
  <div class="main">
    <div style="margin-bottom:16px">
      <div style="font-size:13px;letter-spacing:1px">MASTER DATA <b style="color:var(--green)">MANAGEMENT</b></div>
      <div style="color:var(--text-dim);font-size:10px;margin-top:2px">Single source of truth · Duplicate detection · AI anomaly detection</div>
    </div>
    <div class="kpi-grid" id="kpiGrid"></div>
    <div class="section">
      <div class="section-head"><span>MASTER RECORDS</span><span id="recordMeta"></span></div>
      <div class="section-body" id="recordBody"><div style="color:var(--text-dim);padding:20px;text-align:center">No records loaded.</div></div>
    </div>
    <div class="section">
      <div class="section-head"><span>AI ANOMALY DETECTION</span></div>
      <div class="section-body"><div class="ai-output" id="aiOutput">Run analysis to detect data anomalies, duplicate clusters, and stewardship recommendations.</div></div>
    </div>
  </div>
</div>
<script src="/runtime/kernel/canonical-core.js"></script>
<script>
(function(){
  let MODEL=null, records=[];
  function tick(){ document.getElementById('navClock').textContent=new Date().toLocaleTimeString(); }
  setInterval(tick,1000); tick();
  async function init(){
    const r=await fetch('/war-rooms/mdm/data/mdm-model.json'); MODEL=await r.json();
    try{ const s=JSON.parse(localStorage.getItem('TSM_MDM_STATE')||'null'); if(s){ records=s.records||[]; renderAll(); } } catch(e){}
  }
  function save(){ try{ localStorage.setItem('TSM_MDM_STATE',JSON.stringify({records,savedAt:Date.now()})); } catch(e){} }
  function computeKpis(){
    const dups=records.filter(r=>r.status==='DUPLICATE').length;
    const quals=records.map(r=>r.quality||0);
    const avgQ=quals.length?Math.round(quals.reduce((a,b)=>a+b,0)/quals.length):0;
    const anomalies=records.filter(r=>r.status==='STALE'||r.status==='INCOMPLETE').length;
    return { total_records:records.length, duplicate_count:dups, quality_score:avgQ, pending_approvals:records.filter(r=>r.status==='INCOMPLETE').length, anomalies, stewards_active:new Set(records.map(r=>r.steward)).size };
  }
  function renderAll(){
    const k=computeKpis(); renderKpis(k); renderDomains(); renderRecords(); renderStatus(k);
  }
  function renderKpis(k){
    const defs=MODEL.kpis||[];
    document.getElementById('kpiGrid').innerHTML=defs.map(d=>{
      let v=k[d.id],disp=v,cls='';
      if(d.unit==='pct') disp=v+'%';
      if(d.id==='duplicate_count'&&v>0) cls='bad';
      if(d.id==='quality_score') cls=v>=85?'good':v>=70?'warn':'bad';
      if(d.id==='anomalies'&&v>0) cls='warn';
      return `<div class="kpi-card"><div class="kpi-label">${d.label}</div><div class="kpi-value ${cls}">${disp}</div></div>`;
    }).join('');
  }
  function renderDomains(){
    const domains=MODEL.domains||[];
    document.getElementById('domainList').innerHTML=domains.map(d=>{
      const count=records.filter(r=>r.domain===d).length;
      return `<div class="domain-item"><span class="domain-name">${d}</span><span class="domain-count">${count}</span></div>`;
    }).join('');
  }
  function renderRecords(){
    document.getElementById('recordMeta').textContent=`${records.length} records`;
    if(!records.length){ document.getElementById('recordBody').innerHTML='<div style="color:var(--text-dim);padding:20px;text-align:center">No records loaded.</div>'; return; }
    const tagMap={'CLEAN':'tag-clean','DUPLICATE':'tag-dup','INCOMPLETE':'tag-inc','STALE':'tag-stale'};
    const rows=records.map(r=>{
      const hc=r.quality>=85?'#22c55e':r.quality>=70?'#ff9500':'#ff3b3b';
      const qBar=`<div class="quality-bar"><div class="quality-fill" style="width:${r.quality}%;background:${hc}"></div></div> ${r.quality}%`;
      const dupTag=r.duplicates>0?`<span class="tag tag-dup">${r.duplicates} DUP</span>`:'&mdash;';
      return `<tr><td>${r.id}</td><td>${r.domain}</td><td>${r.name}</td><td>${qBar}</td><td><span class="tag ${tagMap[r.status]||''}">${r.status}</span></td><td>${dupTag}</td><td>${r.steward}</td><td>${r.last_validated}</td></tr>`;
    }).join('');
    document.getElementById('recordBody').innerHTML=`<table><thead><tr><th>ID</th><th>DOMAIN</th><th>NAME</th><th>QUALITY</th><th>STATUS</th><th>DUPLICATES</th><th>STEWARD</th><th>VALIDATED</th></tr></thead><tbody>${rows}</tbody></table>`;
  }
  function renderStatus(k){ document.getElementById('navStatus').textContent=`ENGINE: ${k.total_records} RECORDS · ${k.duplicate_count} DUPS`; }
  async function runAnalysis(){
    const out=document.getElementById('aiOutput');
    out.className='ai-output loading'; out.textContent='Running MDM anomaly detection...';
    try{
      const res=await fetch('/api/mdm/query',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({records,kpis:computeKpis(),maxTokens:1200})});
      const d=await res.json(); out.className='ai-output'; out.textContent=d.answer||d.output||'No analysis returned.';
    } catch(e){ out.className='ai-output'; out.textContent=`Analysis failed: ${e.message}`; }
  }
  document.getElementById('btnLoad').addEventListener('click',()=>{ records=(MODEL.sample_data?.records||[]).map(r=>({...r})); save(); renderAll(); });
  document.getElementById('btnReset').addEventListener('click',()=>{ if(!confirm('Reset MDM data?')) return; records=[]; save(); renderAll(); });
  document.getElementById('btnAnalyze').addEventListener('click',runAnalysis);
  document.getElementById('btnRelay').addEventListener('click',()=>{
    try{ localStorage.setItem('TSM_MDM_RELAY',JSON.stringify({vertical:'mdm',records,kpis:computeKpis(),timestamp:new Date().toISOString()})); } catch(e){}
    document.getElementById('navStatus').textContent='ENGINE: RELAYED';
  });
  init().catch(e=>console.error('[MDM]',e));
})();
</script></body></html>
PAGEEOF
echo "MDM war room created"

# ══════════════════════════════════════════════════════════════════════════════
# PHASE 7 — INTEGRATION HUB
# ══════════════════════════════════════════════════════════════════════════════
cat > html/war-rooms/integration-hub/integration-hub.html << 'PAGEEOF'
<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>TSM Integration Hub</title>
<style>
:root{--bg:#050810;--bg2:#080c1a;--bg3:#0a1020;--border:rgba(0,200,255,.1);
--cyan:#00c8ff;--cyan-dim:rgba(0,200,255,.4);--gold:#ffd700;--red:#ff3b3b;
--amber:#ff9500;--green:#22c55e;--purple:#a855f7;--text:#c0d8f0;--text-dim:#3a5a7a;--card:#080c18;}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--text);font-family:'Courier New',monospace;font-size:12px;min-height:100vh}
.nav{display:flex;align-items:center;background:#030610;border-bottom:1px solid var(--border);height:38px;padding:0 16px}
.nav-brand{color:var(--cyan);font-weight:700;font-size:11px;letter-spacing:2px;margin-right:24px}
.nav-right{margin-left:auto;display:flex;gap:16px;color:var(--text-dim);font-size:10px}
.nav-clock{color:var(--cyan-dim)}
.main{padding:18px 22px;overflow-y:auto;height:calc(100vh - 38px)}
.kpi-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:24px}
.kpi-card{background:var(--card);border:1px solid var(--border);padding:12px 10px;text-align:center}
.kpi-label{font-size:8px;letter-spacing:1px;color:var(--text-dim);margin-bottom:6px;text-transform:uppercase}
.kpi-value{font-size:20px;font-weight:700;color:var(--cyan)}
.kpi-value.warn{color:var(--amber)} .kpi-value.bad{color:var(--red)} .kpi-value.good{color:var(--green)}
.hub-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:24px}
.section{background:var(--card);border:1px solid var(--border)}
.section-head{padding:10px 14px;border-bottom:1px solid var(--border);font-size:10px;letter-spacing:1.5px;color:var(--text-dim);display:flex;justify-content:space-between}
.section-body{padding:14px}
.sys-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.sys-card{background:var(--bg3);border:1px solid var(--border);padding:10px;text-align:center}
.sys-name{font-size:9px;letter-spacing:1px;color:var(--text-dim);margin-bottom:6px}
.sys-status{font-size:11px;font-weight:700}
.sys-status.up{color:var(--green)} .sys-status.warn{color:var(--amber)} .sys-status.down{color:var(--red)}
.sys-latency{font-size:8px;color:var(--text-dim);margin-top:3px}
.sys-pulse{width:6px;height:6px;border-radius:50%;margin:4px auto 0;animation:pulse 2s infinite}
.pulse-up{background:var(--green)} .pulse-warn{background:var(--amber)} .pulse-down{background:var(--red)}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
table{width:100%;border-collapse:collapse;font-size:10px}
th{text-align:left;color:var(--text-dim);font-size:8px;letter-spacing:1px;padding:5px 8px;border-bottom:1px solid var(--border)}
td{padding:6px 8px;border-bottom:1px solid var(--border);color:var(--text)}
.tag{display:inline-block;font-size:8px;padding:2px 6px;border:1px solid}
.tag-ok{color:var(--green);border-color:var(--green)} .tag-warn{color:var(--amber);border-color:var(--amber)} .tag-err{color:var(--red);border-color:var(--red)}
.bus-viz{display:flex;align-items:center;justify-content:center;gap:6px;padding:16px;flex-wrap:wrap}
.bus-node{background:var(--bg3);border:1px solid var(--border);padding:8px 12px;font-size:9px;letter-spacing:1px;color:var(--cyan);position:relative}
.bus-node::after{content:'→';position:absolute;right:-12px;top:50%;transform:translateY(-50%);color:var(--cyan-dim);font-size:10px}
.bus-node:last-child::after{display:none}
.bus-pulse{display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--cyan);margin-right:5px;animation:pulse 1.5s infinite}
.ai-output{background:var(--bg3);border:1px solid var(--border);padding:12px;font-size:10px;line-height:1.6;color:var(--text);white-space:pre-wrap;min-height:80px}
.ai-output.loading{color:var(--text-dim)}
.btn{border:1px solid;font-family:inherit;font-size:9px;letter-spacing:1.5px;cursor:pointer;padding:7px 16px;transition:.2s;margin-right:8px}
.btn-cyan{background:var(--cyan);border-color:var(--cyan);color:#000;font-weight:700}
.btn-gold{background:var(--gold);border-color:var(--gold);color:#000;font-weight:700}
</style></head><body>
<div class="nav">
  <div class="nav-brand">TSM SHELL // INTEGRATION HUB</div>
  <div class="nav-right"><span id="navStatus">MONITORING: 8 SYSTEMS</span><span class="nav-clock" id="navClock">--:--:--</span></div>
</div>
<div class="main">
  <div style="margin-bottom:16px">
    <div style="font-size:13px;letter-spacing:1px">ENTERPRISE <b style="color:var(--cyan)">INTEGRATION HUB</b></div>
    <div style="color:var(--text-dim);font-size:10px;margin-top:2px">API monitoring · Event bus · Data lineage · Interface health</div>
  </div>
  <div class="kpi-grid" id="kpiGrid"></div>
  <div class="section" style="margin-bottom:18px">
    <div class="section-head"><span>SYSTEM HEALTH MONITOR</span><span id="healthMeta"></span></div>
    <div class="section-body"><div class="sys-grid" id="sysGrid"></div></div>
  </div>
  <div class="hub-grid">
    <div class="section">
      <div class="section-head"><span>EVENT BUS VISUALIZATION</span></div>
      <div class="section-body">
        <div class="bus-viz" id="busViz"></div>
        <div style="margin-top:12px;font-size:9px;color:var(--text-dim);text-align:center" id="busStats"></div>
      </div>
    </div>
    <div class="section">
      <div class="section-head"><span>INTEGRATION CATALOG</span></div>
      <div class="section-body" id="catalogBody"></div>
    </div>
  </div>
  <div class="section" style="margin-bottom:18px">
    <div class="section-head"><span>AI INTEGRATION ASSISTANT</span></div>
    <div class="section-body">
      <div style="margin-bottom:10px">
        <button class="btn btn-cyan" id="btnAnalyze">ANALYZE INTEGRATION HEALTH</button>
        <button class="btn btn-gold" id="btnRelay">RELAY TO STRATEGIST →</button>
      </div>
      <div class="ai-output" id="aiOutput">Click Analyze to get AI-generated integration health assessment and recommendations.</div>
    </div>
  </div>
</div>
<script src="/runtime/kernel/canonical-core.js"></script>
<script>
(function(){
  function tick(){ document.getElementById('navClock').textContent=new Date().toLocaleTimeString(); }
  setInterval(tick,1000); tick();

  const SYSTEMS=[
    {id:'crm',name:'CRM',status:'up',latency:42,msgs:1240,errors:0},
    {id:'erp',name:'ERP / SAP',status:'up',latency:87,msgs:8832,errors:2},
    {id:'hr',name:'HR',status:'up',latency:55,msgs:440,errors:0},
    {id:'finance',name:'Finance',status:'warn',latency:210,msgs:3310,errors:8},
    {id:'supply',name:'Supply Chain',status:'up',latency:68,msgs:2180,errors:1},
    {id:'mfg',name:'Manufacturing',status:'up',latency:33,msgs:5520,errors:0},
    {id:'bi',name:'BI / Analytics',status:'warn',latency:340,msgs:920,errors:5},
    {id:'ai',name:'AI Engine',status:'up',latency:180,msgs:670,errors:0}
  ];

  const INTEGRATIONS=[
    {from:'CRM',to:'ERP',type:'REST API',status:'ok',throughput:'1.2K/hr'},
    {from:'ERP',to:'Finance',type:'IDOC',status:'warn',throughput:'3.3K/hr'},
    {from:'Supply Chain',to:'ERP',type:'EDI',status:'ok',throughput:'2.1K/hr'},
    {from:'Manufacturing',to:'BI',type:'Event Stream',status:'ok',throughput:'5.5K/hr'},
    {from:'HR',to:'Finance',type:'REST API',status:'ok',throughput:'440/hr'},
    {from:'AI Engine',to:'CRM',type:'Webhook',status:'ok',throughput:'670/hr'},
    {from:'BI',to:'AI Engine',type:'GraphQL',status:'warn',throughput:'920/hr'}
  ];

  function renderKpis(){
    const up=SYSTEMS.filter(s=>s.status==='up').length;
    const warn=SYSTEMS.filter(s=>s.status==='warn').length;
    const totalMsgs=SYSTEMS.reduce((a,s)=>a+s.msgs,0);
    const totalErrors=SYSTEMS.reduce((a,s)=>a+s.errors,0);
    const avgLatency=Math.round(SYSTEMS.reduce((a,s)=>a+s.latency,0)/SYSTEMS.length);
    const kpis=[
      {label:'Systems Online',value:up+'/'+SYSTEMS.length,cls:'good'},
      {label:'Warnings',value:warn,cls:warn>0?'warn':'good'},
      {label:'Messages/hr',value:totalMsgs.toLocaleString(),cls:''},
      {label:'Errors',value:totalErrors,cls:totalErrors>0?'warn':'good'},
      {label:'Avg Latency',value:avgLatency+'ms',cls:avgLatency>200?'warn':'good'}
    ];
    document.getElementById('kpiGrid').innerHTML=kpis.map(k=>`
      <div class="kpi-card"><div class="kpi-label">${k.label}</div><div class="kpi-value ${k.cls}">${k.value}</div></div>`).join('');
  }

  function renderSystems(){
    const up=SYSTEMS.filter(s=>s.status==='up').length;
    document.getElementById('healthMeta').textContent=`${up}/${SYSTEMS.length} online`;
    document.getElementById('sysGrid').innerHTML=SYSTEMS.map(s=>`
      <div class="sys-card">
        <div class="sys-name">${s.name}</div>
        <div class="sys-status ${s.status}">${s.status.toUpperCase()}</div>
        <div class="sys-latency">${s.latency}ms · ${s.msgs.toLocaleString()}/hr</div>
        <div class="sys-pulse pulse-${s.status}"></div>
      </div>`).join('');
  }

  function renderBus(){
    const nodes=['CRM','ERP','Finance','Supply Chain','Manufacturing','BI','AI Engine'];
    document.getElementById('busViz').innerHTML=nodes.map(n=>`
      <div class="bus-node"><span class="bus-pulse"></span>${n}</div>`).join('');
    const totalMsgs=SYSTEMS.reduce((a,s)=>a+s.msgs,0);
    document.getElementById('busStats').textContent=`${totalMsgs.toLocaleString()} messages/hr · Event bus active · All streams nominal`;
  }

  function renderCatalog(){
    const rows=INTEGRATIONS.map(i=>{
      const cls=i.status==='ok'?'tag-ok':'tag-warn';
      return `<tr><td>${i.from}</td><td>${i.to}</td><td>${i.type}</td><td>${i.throughput}</td><td><span class="tag ${cls}">${i.status.toUpperCase()}</span></td></tr>`;
    }).join('');
    document.getElementById('catalogBody').innerHTML=`<table><thead><tr><th>FROM</th><th>TO</th><th>TYPE</th><th>THROUGHPUT</th><th>STATUS</th></tr></thead><tbody>${rows}</tbody></table>`;
  }

  async function runAnalysis(){
    const out=document.getElementById('aiOutput');
    out.className='ai-output loading'; out.textContent='Analyzing integration health...';
    try{
      const payload={systems:SYSTEMS,integrations:INTEGRATIONS,kpis:{up:SYSTEMS.filter(s=>s.status==='up').length,warn:SYSTEMS.filter(s=>s.status==='warn').length,errors:SYSTEMS.reduce((a,s)=>a+s.errors,0)},maxTokens:1200};
      const res=await fetch('/api/integration/query',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const d=await res.json(); out.className='ai-output'; out.textContent=d.answer||d.output||'No analysis returned.';
    } catch(e){ out.className='ai-output'; out.textContent=`Analysis failed: ${e.message}`; }
  }

  // Simulate live updates
  setInterval(()=>{
    SYSTEMS.forEach(s=>{ s.latency=Math.max(20,s.latency+Math.round((Math.random()-0.5)*20)); s.msgs+=Math.round(Math.random()*10); });
    renderKpis(); renderSystems();
  }, 5000);

  document.getElementById('btnAnalyze').addEventListener('click',runAnalysis);
  document.getElementById('btnRelay').addEventListener('click',()=>{
    try{ localStorage.setItem('TSM_INTEGRATION_RELAY',JSON.stringify({vertical:'integration',systems:SYSTEMS,integrations:INTEGRATIONS,timestamp:new Date().toISOString()})); } catch(e){}
    document.getElementById('navStatus').textContent='MONITORING: RELAYED';
  });

  renderKpis(); renderSystems(); renderBus(); renderCatalog();
})();
</script></body></html>
PAGEEOF
echo "Integration Hub created"

# ══════════════════════════════════════════════════════════════════════════════
# PHASE 8 — GOVERNANCE
# ══════════════════════════════════════════════════════════════════════════════
cat > html/war-rooms/governance/governance-war-room.html << 'PAGEEOF'
<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>TSM Governance & Compliance</title>
<style>
:root{--bg:#0a080f;--bg2:#0f0c1a;--bg3:#131020;--border:rgba(200,150,255,.1);
--violet:#c896ff;--violet-dim:rgba(200,150,255,.4);--gold:#ffd700;--red:#ff3b3b;
--amber:#ff9500;--green:#22c55e;--text:#d0c8f0;--text-dim:#5a4a7a;--card:#100d1e;}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--text);font-family:'Courier New',monospace;font-size:12px;min-height:100vh}
.nav{display:flex;align-items:center;background:#060410;border-bottom:1px solid var(--border);height:38px;padding:0 16px}
.nav-brand{color:var(--violet);font-weight:700;font-size:11px;letter-spacing:2px;margin-right:24px}
.nav-right{margin-left:auto;display:flex;gap:16px;color:var(--text-dim);font-size:10px}
.nav-clock{color:var(--violet-dim)}
.main{padding:18px 22px;overflow-y:auto;height:calc(100vh - 38px)}
.kpi-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:20px}
.kpi-card{background:var(--card);border:1px solid var(--border);padding:12px 10px;text-align:center}
.kpi-label{font-size:8px;letter-spacing:1px;color:var(--text-dim);margin-bottom:6px;text-transform:uppercase}
.kpi-value{font-size:20px;font-weight:700;color:var(--violet)}
.kpi-value.warn{color:var(--amber)} .kpi-value.bad{color:var(--red)} .kpi-value.good{color:var(--green)}
.gov-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:18px}
.section{background:var(--card);border:1px solid var(--border);margin-bottom:18px}
.section-head{padding:10px 14px;border-bottom:1px solid var(--border);font-size:10px;letter-spacing:1.5px;color:var(--text-dim);display:flex;justify-content:space-between}
.section-body{padding:14px}
table{width:100%;border-collapse:collapse;font-size:10px}
th{text-align:left;color:var(--text-dim);font-size:8px;letter-spacing:1px;padding:5px 8px;border-bottom:1px solid var(--border)}
td{padding:6px 8px;border-bottom:1px solid var(--border);color:var(--text)}
.tag{display:inline-block;font-size:8px;padding:2px 6px;border:1px solid}
.tag-pass{color:var(--green);border-color:var(--green)} .tag-fail{color:var(--red);border-color:var(--red)}
.tag-review{color:var(--amber);border-color:var(--amber)} .tag-open{color:var(--violet);border-color:var(--violet)}
.risk-bar{width:80px;height:6px;background:var(--bg3);border-radius:3px;display:inline-block;vertical-align:middle}
.risk-fill{height:100%;border-radius:3px}
.ai-output{background:var(--bg3);border:1px solid var(--border);padding:12px;font-size:10px;line-height:1.6;color:var(--text);white-space:pre-wrap;min-height:80px}
.ai-output.loading{color:var(--text-dim)}
.btn{border:1px solid;font-family:inherit;font-size:9px;letter-spacing:1.5px;cursor:pointer;padding:7px 16px;transition:.2s;margin-right:8px}
.btn-violet{background:var(--violet);border-color:var(--violet);color:#000;font-weight:700}
.btn-gold{background:var(--gold);border-color:var(--gold);color:#000;font-weight:700}
</style></head><body>
<div class="nav">
  <div class="nav-brand">TSM SHELL // GOVERNANCE</div>
  <div class="nav-right"><span id="navStatus">COMPLIANCE: MONITORING</span><span class="nav-clock" id="navClock">--:--:--</span></div>
</div>
<div class="main">
  <div style="margin-bottom:16px">
    <div style="font-size:13px;letter-spacing:1px">GOVERNANCE & <b style="color:var(--violet)">COMPLIANCE</b></div>
    <div style="color:var(--text-dim);font-size:10px;margin-top:2px">Role-based security · Audit trail · Risk register · AI compliance advisor</div>
  </div>
  <div class="kpi-grid" id="kpiGrid"></div>
  <div class="gov-grid">
    <div class="section">
      <div class="section-head"><span>COMPLIANCE DASHBOARD</span></div>
      <div class="section-body" id="complianceBody"></div>
    </div>
    <div class="section">
      <div class="section-head"><span>RISK REGISTER</span></div>
      <div class="section-body" id="riskBody"></div>
    </div>
  </div>
  <div class="section">
    <div class="section-head"><span>AUDIT TRAIL</span><span id="auditMeta"></span></div>
    <div class="section-body" id="auditBody"></div>
  </div>
  <div class="section">
    <div class="section-head"><span>AI COMPLIANCE ADVISOR</span></div>
    <div class="section-body">
      <div style="margin-bottom:10px">
        <button class="btn btn-violet" id="btnAnalyze">RUN COMPLIANCE ANALYSIS</button>
        <button class="btn btn-gold" id="btnRelay">RELAY TO EXECUTIVE →</button>
      </div>
      <div class="ai-output" id="aiOutput">Run analysis for AI-generated compliance risk assessment and remediation recommendations.</div>
    </div>
  </div>
</div>
<script src="/runtime/kernel/canonical-core.js"></script>
<script>
(function(){
  function tick(){ document.getElementById('navClock').textContent=new Date().toLocaleTimeString(); }
  setInterval(tick,1000); tick();

  const CONTROLS=[
    {id:'SOX-001',name:'Segregation of Duties',framework:'SOX',status:'PASS',last_tested:'2026-06-28'},
    {id:'SOX-002',name:'Financial Close Controls',framework:'SOX',status:'PASS',last_tested:'2026-06-30'},
    {id:'HIPAA-001',name:'PHI Access Controls',framework:'HIPAA',status:'REVIEW',last_tested:'2026-06-15'},
    {id:'GDPR-001',name:'Data Subject Rights',framework:'GDPR',status:'PASS',last_tested:'2026-06-25'},
    {id:'ISO-001',name:'Change Management',framework:'ISO 27001',status:'FAIL',last_tested:'2026-06-20'},
    {id:'SOC2-001',name:'Availability Controls',framework:'SOC2',status:'PASS',last_tested:'2026-06-29'}
  ];

  const RISKS=[
    {id:'RSK-001',name:'Unauthorized data access',severity:72,status:'OPEN',owner:'CISO'},
    {id:'RSK-002',name:'SOX control failure',severity:88,status:'MITIGATING',owner:'CFO'},
    {id:'RSK-003',name:'Vendor compliance gap',severity:45,status:'OPEN',owner:'Procurement'},
    {id:'RSK-004',name:'HIPAA documentation lag',severity:61,status:'REVIEW',owner:'Compliance'}
  ];

  const AUDIT=[
    {ts:'2026-07-01 11:42',user:'R. Whitfield',action:'Approved discount override — Q-2026-0041','object':'CPQ','result':'OK'},
    {ts:'2026-07-01 10:18',user:'System',action:'Role escalation — Finance Review access','object':'Approvals','result':'OK'},
    {ts:'2026-07-01 09:55',user:'M. Chen',action:'MDM record merge — Customer master','object':'MDM','result':'OK'},
    {ts:'2026-06-30 17:22',user:'T. Osei',action:'Data export — O2C pipeline','object':'O2C','result':'FLAGGED'},
    {ts:'2026-06-30 15:10',user:'System',action:'Failed login attempt (3x) — S. Novak','object':'Auth','result':'BLOCKED'}
  ];

  function computeKpis(){
    const pass=CONTROLS.filter(c=>c.status==='PASS').length;
    const fail=CONTROLS.filter(c=>c.status==='FAIL').length;
    const open=RISKS.filter(r=>r.status==='OPEN').length;
    const avgRisk=Math.round(RISKS.reduce((a,r)=>a+r.severity,0)/RISKS.length);
    return { controls_pass:pass+'/'+CONTROLS.length, controls_fail:fail, open_risks:open, avg_risk_score:avgRisk, audit_events:AUDIT.length };
  }

  function renderKpis(){
    const k=computeKpis();
    const defs=[
      {label:'Controls Passing',value:k.controls_pass,cls:'good'},
      {label:'Controls Failing',value:k.controls_fail,cls:k.controls_fail>0?'bad':'good'},
      {label:'Open Risks',value:k.open_risks,cls:k.open_risks>2?'bad':'warn'},
      {label:'Avg Risk Score',value:k.avg_risk_score,cls:k.avg_risk_score>70?'bad':'warn'},
      {label:'Audit Events',value:k.audit_events,cls:''}
    ];
    document.getElementById('kpiGrid').innerHTML=defs.map(d=>`
      <div class="kpi-card"><div class="kpi-label">${d.label}</div><div class="kpi-value ${d.cls}">${d.value}</div></div>`).join('');
  }

  function renderCompliance(){
    const rows=CONTROLS.map(c=>{
      const cls=c.status==='PASS'?'tag-pass':c.status==='FAIL'?'tag-fail':'tag-review';
      return `<tr><td>${c.id}</td><td>${c.name}</td><td>${c.framework}</td><td><span class="tag ${cls}">${c.status}</span></td><td>${c.last_tested}</td></tr>`;
    }).join('');
    document.getElementById('complianceBody').innerHTML=`<table><thead><tr><th>ID</th><th>CONTROL</th><th>FRAMEWORK</th><th>STATUS</th><th>LAST TESTED</th></tr></thead><tbody>${rows}</tbody></table>`;
  }

  function renderRisks(){
    const rows=RISKS.map(r=>{
      const hc=r.severity>=75?'#ff3b3b':r.severity>=50?'#ff9500':'#22c55e';
      const bar=`<div class="risk-bar"><div class="risk-fill" style="width:${r.severity}%;background:${hc}"></div></div> ${r.severity}`;
      const cls=r.status==='OPEN'?'tag-open':r.status==='REVIEW'?'tag-review':'tag-pass';
      return `<tr><td>${r.id}</td><td>${r.name}</td><td>${bar}</td><td><span class="tag ${cls}">${r.status}</span></td><td>${r.owner}</td></tr>`;
    }).join('');
    document.getElementById('riskBody').innerHTML=`<table><thead><tr><th>ID</th><th>RISK</th><th>SEVERITY</th><th>STATUS</th><th>OWNER</th></tr></thead><tbody>${rows}</tbody></table>`;
  }

  function renderAudit(){
    document.getElementById('auditMeta').textContent=`${AUDIT.length} events`;
    const rows=AUDIT.map(a=>{
      const cls=a.result==='OK'?'tag-pass':a.result==='FLAGGED'?'tag-review':'tag-fail';
      return `<tr><td>${a.ts}</td><td>${a.user}</td><td>${a.action}</td><td>${a.object}</td><td><span class="tag ${cls}">${a.result}</span></td></tr>`;
    }).join('');
    document.getElementById('auditBody').innerHTML=`<table><thead><tr><th>TIMESTAMP</th><th>USER</th><th>ACTION</th><th>OBJECT</th><th>RESULT</th></tr></thead><tbody>${rows}</tbody></table>`;
  }

  async function runAnalysis(){
    const out=document.getElementById('aiOutput');
    out.className='ai-output loading'; out.textContent='Running compliance analysis...';
    try{
      const res=await fetch('/api/governance/query',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({controls:CONTROLS,risks:RISKS,audit:AUDIT,kpis:computeKpis(),maxTokens:1200})});
      const d=await res.json(); out.className='ai-output'; out.textContent=d.answer||d.output||'No analysis returned.';
    } catch(e){ out.className='ai-output'; out.textContent=`Analysis failed: ${e.message}`; }
  }

  document.getElementById('btnAnalyze').addEventListener('click',runAnalysis);
  document.getElementById('btnRelay').addEventListener('click',()=>{
    try{ localStorage.setItem('TSM_GOV_RELAY',JSON.stringify({vertical:'governance',controls:CONTROLS,risks:RISKS,kpis:computeKpis(),timestamp:new Date().toISOString()})); } catch(e){}
    document.getElementById('navStatus').textContent='COMPLIANCE: RELAYED';
  });

  renderKpis(); renderCompliance(); renderRisks(); renderAudit();
})();
</script></body></html>
PAGEEOF
echo "Governance war room created"

# ══════════════════════════════════════════════════════════════════════════════
# PHASE 10 — DIGITAL TWIN
# ══════════════════════════════════════════════════════════════════════════════
cat > html/war-rooms/digital-twin/digital-twin.html << 'PAGEEOF'
<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>TSM Enterprise Digital Twin</title>
<style>
:root{--bg:#030508;--bg2:#060810;--bg3:#080c14;--border:rgba(0,220,180,.1);
--teal:#00dcb4;--teal-dim:rgba(0,220,180,.4);--gold:#ffd700;--red:#ff3b3b;
--amber:#ff9500;--green:#22c55e;--blue:#3b82f6;--purple:#a855f7;
--text:#c0e8e0;--text-dim:#3a6a60;--card:#060a10;}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--text);font-family:'Courier New',monospace;font-size:12px;min-height:100vh}
.nav{display:flex;align-items:center;background:#020406;border-bottom:1px solid var(--border);height:42px;padding:0 20px}
.nav-brand{color:var(--teal);font-weight:700;font-size:12px;letter-spacing:3px;margin-right:24px}
.nav-right{margin-left:auto;display:flex;gap:20px;color:var(--text-dim);font-size:10px}
.nav-clock{color:var(--teal-dim)}
.nav-live{color:var(--green);animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
.main{padding:20px 24px;overflow-y:auto;height:calc(100vh - 42px)}
.twin-header{margin-bottom:20px}
.twin-title{font-size:16px;letter-spacing:2px;color:var(--text)}
.twin-sub{color:var(--text-dim);font-size:10px;margin-top:4px}
.health-banner{background:rgba(0,220,180,.05);border:1px solid var(--border);padding:12px 20px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between}
.health-score{font-family:'Orbitron',sans-serif;font-size:32px;font-weight:700;color:var(--teal)}
.health-label{font-size:9px;color:var(--text-dim);letter-spacing:2px;margin-top:2px}
.health-status{font-size:11px;letter-spacing:1.5px;color:var(--green)}
.domain-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:20px}
.domain-card{background:var(--card);border:1px solid var(--border);padding:14px 12px}
.domain-name{font-size:9px;letter-spacing:1.5px;color:var(--text-dim);margin-bottom:8px}
.domain-score{font-size:22px;font-weight:700;color:var(--teal)}
.domain-score.warn{color:var(--amber)} .domain-score.bad{color:var(--red)}
.domain-delta{font-size:9px;margin-top:3px}
.delta-up{color:var(--green)} .delta-down{color:var(--red)}
.domain-bar{height:3px;background:var(--bg3);margin-top:8px;border-radius:2px}
.domain-fill{height:100%;border-radius:2px;transition:width 1s}
.twin-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:20px}
.section{background:var(--card);border:1px solid var(--border)}
.section-head{padding:10px 14px;border-bottom:1px solid var(--border);font-size:10px;letter-spacing:1.5px;color:var(--text-dim);display:flex;justify-content:space-between}
.section-body{padding:14px}
.signal-list{display:flex;flex-direction:column;gap:6px}
.signal-item{display:flex;align-items:center;gap:10px;padding:6px 10px;background:var(--bg3);border:1px solid var(--border)}
.signal-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0}
.sig-ok{background:var(--green)} .sig-warn{background:var(--amber)} .sig-bad{background:var(--red)}
.signal-text{flex:1;font-size:10px;color:var(--text)}
.signal-src{font-size:9px;color:var(--text-dim)}
.signal-time{font-size:9px;color:var(--text-dim);margin-left:auto}
.forecast-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.forecast-card{background:var(--bg3);border:1px solid var(--border);padding:10px;text-align:center}
.forecast-label{font-size:8px;color:var(--text-dim);letter-spacing:1px;margin-bottom:6px}
.forecast-val{font-size:15px;font-weight:700;color:var(--teal)}
.forecast-trend{font-size:9px;margin-top:3px}
.ai-output{background:var(--bg3);border:1px solid var(--border);padding:14px;font-size:10px;line-height:1.7;color:var(--text);white-space:pre-wrap;min-height:100px}
.ai-output.loading{color:var(--text-dim)}
.btn{border:1px solid;font-family:inherit;font-size:9px;letter-spacing:1.5px;cursor:pointer;padding:8px 18px;transition:.2s;margin-right:8px}
.btn-teal{background:var(--teal);border-color:var(--teal);color:#000;font-weight:700}
.btn-gold{background:var(--gold);border-color:var(--gold);color:#000;font-weight:700}
</style></head><body>
<div class="nav">
  <div class="nav-brand">⬡ TSM ENTERPRISE DIGITAL TWIN</div>
  <div class="nav-right">
    <span class="nav-live">● LIVE</span>
    <span id="navStatus">10 DOMAINS ACTIVE</span>
    <span class="nav-clock" id="navClock">--:--:--</span>
  </div>
</div>
<div class="main">
  <div class="twin-header">
    <div class="twin-title">ENTERPRISE <b style="color:var(--teal)">DIGITAL TWIN</b></div>
    <div class="twin-sub">Live business simulation · Predictive analytics · Executive mission control</div>
  </div>

  <div class="health-banner">
    <div>
      <div style="font-size:9px;color:var(--text-dim);letter-spacing:2px;margin-bottom:4px">ENTERPRISE HEALTH SCORE</div>
      <div style="display:flex;align-items:baseline;gap:12px">
        <div class="health-score" id="healthScore">--</div>
        <div class="health-status" id="healthStatus">CALCULATING...</div>
      </div>
    </div>
    <div style="text-align:right">
      <div style="font-size:9px;color:var(--text-dim);letter-spacing:1px;margin-bottom:4px">LAST UPDATED</div>
      <div style="font-size:11px;color:var(--teal)" id="lastUpdate">--:--:--</div>
    </div>
  </div>

  <div class="domain-grid" id="domainGrid"></div>

  <div class="twin-grid">
    <div class="section">
      <div class="section-head"><span>LIVE SIGNAL FEED</span><span id="signalMeta"></span></div>
      <div class="section-body"><div class="signal-list" id="signalList"></div></div>
    </div>
    <div class="section">
      <div class="section-head"><span>30-DAY FORECAST</span></div>
      <div class="section-body"><div class="forecast-grid" id="forecastGrid"></div></div>
    </div>
  </div>

  <div class="section" style="margin-bottom:18px">
    <div class="section-head"><span>AI EXECUTIVE RECOMMENDATIONS</span></div>
    <div class="section-body">
      <div style="margin-bottom:12px">
        <button class="btn btn-teal" id="btnAnalyze">GENERATE EXECUTIVE BRIEF</button>
        <button class="btn btn-gold" id="btnRelay">RELAY TO BOARD →</button>
      </div>
      <div class="ai-output" id="aiOutput">Click Generate to produce an AI executive brief synthesizing all domain signals, risks, and 30-day recommendations.</div>
    </div>
  </div>
</div>
<script src="/runtime/kernel/canonical-core.js"></script>
<script>
(function(){
  function tick(){ document.getElementById('navClock').textContent=new Date().toLocaleTimeString(); }
  setInterval(tick,1000); tick();

  const DOMAINS=[
    {id:'sales',name:'SALES',score:84,delta:+3,color:'#00dcb4'},
    {id:'finance',name:'FINANCE',score:91,delta:+1,color:'#22c55e'},
    {id:'ops',name:'OPERATIONS',score:72,delta:-5,color:'#ff9500'},
    {id:'mfg',name:'MANUFACTURING',score:88,delta:+2,color:'#00dcb4'},
    {id:'procurement',name:'PROCUREMENT',score:65,delta:-8,color:'#ff3b3b'},
    {id:'hr',name:'HR',score:79,delta:0,color:'#00dcb4'},
    {id:'cx',name:'CUSTOMER SVC',score:83,delta:+4,color:'#22c55e'},
    {id:'supply',name:'SUPPLY CHAIN',score:70,delta:-3,color:'#ff9500'},
    {id:'logistics',name:'LOGISTICS',score:86,delta:+1,color:'#22c55e'},
    {id:'it',name:'IT OPS',score:94,delta:+2,color:'#00dcb4'}
  ];

  const SIGNALS=[
    {type:'ok',text:'O2C pipeline: 5 orders active, $333K in flight','src':'O2C','time':'12:09'},
    {type:'warn',text:'CPQ: Glendale Data Center credit hold — $97.5K at risk','src':'CPQ','time':'12:07'},
    {type:'bad',text:'Procurement score dropped 8pts — supplier risk elevated','src':'SUPPLY CHAIN','time':'11:58'},
    {type:'ok',text:'CRM: Honeywell proposal at $280K — health score 82','src':'CRM','time':'11:45'},
    {type:'warn',text:'Approvals: 8 SLA breaches — Finance Review bottleneck','src':'APPROVALS','time':'11:32'},
    {type:'ok',text:'Governance: SOX controls passing — ISO 27001 exception noted','src':'GOVERNANCE','time':'11:20'},
    {type:'ok',text:'Integration Hub: 8 systems online, 16 errors/hr avg','src':'INTEGRATION','time':'11:15'}
  ];

  const FORECASTS=[
    {label:'Revenue (30d)',value:'$2.4M',trend:'+12%',up:true},
    {label:'Cost Exposure',value:'$340K',trend:'-4%',up:false},
    {label:'Win Rate',value:'68%',trend:'+5pts',up:true},
    {label:'SLA Compliance',value:'91%',trend:'+3pts',up:true},
    {label:'Churn Risk',value:'2 accounts',trend:'stable',up:null},
    {label:'Supply Risk',value:'HIGH',trend:'elevated',up:false}
  ];

  function computeHealth(){
    return Math.round(DOMAINS.reduce((a,d)=>a+d.score,0)/DOMAINS.length);
  }

  function renderHealth(){
    const score=computeHealth();
    document.getElementById('healthScore').textContent=score;
    document.getElementById('healthStatus').textContent=score>=85?'HEALTHY':score>=70?'WATCH':'AT RISK';
    document.getElementById('healthStatus').style.color=score>=85?'var(--green)':score>=70?'var(--amber)':'var(--red)';
    document.getElementById('lastUpdate').textContent=new Date().toLocaleTimeString();
  }

  function renderDomains(){
    document.getElementById('domainGrid').innerHTML=DOMAINS.map(d=>{
      const cls=d.score>=85?'':d.score>=70?'warn':'bad';
      const deltaStr=d.delta===0?'—':d.delta>0?`↑ +${d.delta}`:`↓ ${d.delta}`;
      const deltaCls=d.delta>0?'delta-up':d.delta<0?'delta-down':'';
      return `<div class="domain-card">
        <div class="domain-name">${d.name}</div>
        <div class="domain-score ${cls}">${d.score}</div>
        <div class="domain-delta ${deltaCls}">${deltaStr}</div>
        <div class="domain-bar"><div class="domain-fill" style="width:${d.score}%;background:${d.color}"></div></div>
      </div>`;
    }).join('');
  }

  function renderSignals(){
    document.getElementById('signalMeta').textContent=`${SIGNALS.length} signals`;
    document.getElementById('signalList').innerHTML=SIGNALS.map(s=>`
      <div class="signal-item">
        <div class="signal-dot sig-${s.type}"></div>
        <span class="signal-text">${s.text}</span>
        <span class="signal-src">${s.src}</span>
        <span class="signal-time">${s.time}</span>
      </div>`).join('');
  }

  function renderForecasts(){
    document.getElementById('forecastGrid').innerHTML=FORECASTS.map(f=>{
      const tc=f.up===true?'delta-up':f.up===false?'delta-down':'';
      return `<div class="forecast-card">
        <div class="forecast-label">${f.label}</div>
        <div class="forecast-val">${f.value}</div>
        <div class="forecast-trend ${tc}">${f.trend}</div>
      </div>`;
    }).join('');
  }

  // Simulate live domain score drift
  setInterval(()=>{
    DOMAINS.forEach(d=>{
      const drift=Math.round((Math.random()-0.5)*4);
      d.score=Math.max(30,Math.min(99,d.score+drift));
      d.delta=drift;
      d.color=d.score>=85?'#00dcb4':d.score>=70?'#ff9500':'#ff3b3b';
    });
    renderDomains(); renderHealth();
  }, 8000);

  async function runAnalysis(){
    const out=document.getElementById('aiOutput');
    out.className='ai-output loading'; out.textContent='Generating executive brief from all domain signals...';
    try{
      const payload={domains:DOMAINS,signals:SIGNALS,forecasts:FORECASTS,health_score:computeHealth(),maxTokens:1400};
      const res=await fetch('/api/digital-twin/query',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const d=await res.json(); out.className='ai-output'; out.textContent=d.answer||d.output||'No brief generated.';
    } catch(e){ out.className='ai-output'; out.textContent=`Analysis failed: ${e.message}`; }
  }

  document.getElementById('btnAnalyze').addEventListener('click',runAnalysis);
  document.getElementById('btnRelay').addEventListener('click',()=>{
    try{ localStorage.setItem('TSM_TWIN_RELAY',JSON.stringify({vertical:'digital-twin',domains:DOMAINS,health_score:computeHealth(),timestamp:new Date().toISOString()})); } catch(e){}
    document.getElementById('navStatus').textContent='TWIN: RELAYED TO BOARD';
  });

  renderHealth(); renderDomains(); renderSignals(); renderForecasts();
})();
</script></body></html>
PAGEEOF
echo "Digital Twin created"

# ══════════════════════════════════════════════════════════════════════════════
# PATCH SERVER.JS — add all missing routes + war-rooms static mount
# ══════════════════════════════════════════════════════════════════════════════
python3 << 'PYEOF'
import sys

with open('server.js', 'r') as f:
    src = f.read()

changes = []

# 1. war-rooms static mount
WAR_MOUNT = "app.use('/war-rooms', express.static(path.join(__dirname, 'html', 'war-rooms'), { setHeaders: (res) => res.setHeader('Cache-Control', 'no-store') }));\n"
HTML_MOUNT = "app.use('/html', express.static(path.join(__dirname, 'html')"
if '/war-rooms' in src:
    print('[server.js] /war-rooms mount already present')
else:
    idx = src.index(HTML_MOUNT)
    src = WAR_MOUNT + src[idx:]
    src = src[:len(WAR_MOUNT)] + src[len(WAR_MOUNT)-len(WAR_MOUNT)+idx-idx+idx:]
    # simpler approach
    src_lines = src.split('\n')
    for i, line in enumerate(src_lines):
        if HTML_MOUNT in line:
            src_lines.insert(i, WAR_MOUNT.strip())
            break
    src = '\n'.join(src_lines)
    changes.append('/war-rooms static mount')

# 2. SP entries
SP_ENTRIES = {
    'mdm': "  mdm: 'You are a Master Data Management AI for TSM Command. Expert in data quality, duplicate detection, stewardship, validation, and anomaly detection across customer, vendor, product, employee, asset, and location master data. Identify data quality issues, duplicate clusters, stale records, and the specific remediation action per record. Reference record IDs. No preamble.',",
    'integration': "  integration: 'You are an Enterprise Integration Hub AI for TSM Command. Expert in API health, event streaming, ETL pipelines, data lineage, and system interface monitoring. Identify degraded integrations, error spikes, latency outliers, and the specific remediation action per affected interface. No preamble.',",
    'governance': "  governance: 'You are a Governance and Compliance AI for TSM Command. Expert in SOX, HIPAA, GDPR, ISO 27001, SOC2, risk management, audit trails, and policy enforcement. Identify compliance failures, open risks, audit anomalies, and the specific remediation action per finding. No preamble.',",
    'digital_twin': "  digital_twin: 'You are an Enterprise Digital Twin AI for TSM Command. Expert in synthesizing signals across Sales, Finance, Operations, Manufacturing, Procurement, HR, Customer Service, Supply Chain, Logistics, and IT into an executive brief. Identify the top 3 risks, top 3 opportunities, and the single most important executive decision required in the next 30 days. Be decisive and board-ready. No preamble.',"
}
STRATEGIST_LINE = "  strategist: 'You are the TSM Sovereign Strategist"
for key, entry in SP_ENTRIES.items():
    if f"  {key}:" in src:
        print(f'[server.js] SP.{key} already present')
    elif STRATEGIST_LINE in src:
        idx = src.index(STRATEGIST_LINE)
        src = src[:idx] + entry + '\n' + src[idx:]
        changes.append(f'SP.{key}')
    else:
        print(f'WARNING: could not add SP.{key}', file=sys.stderr)

# 3. API routes
ROUTES = {
    '/api/mdm/query': """
app.post('/api/mdm/query', async (req, res) => {
  const { records, kpis, context, maxTokens } = req.body || {};
  if (!Array.isArray(records)) return res.status(400).json({ ok: false, error: 'records array required' });
  const summary = JSON.stringify({ kpis, record_count: records.length, domains: [...new Set(records.map(r => r.domain))], issues: records.filter(r => r.status !== 'CLEAN').map(r => ({id:r.id,domain:r.domain,status:r.status,quality:r.quality})) }, null, 2);
  const prompt = `MDM snapshot:\\n${summary}\\n\\n` + (context||'') + `\\nIdentify duplicate clusters, stale records, quality failures, and the specific stewardship action per record. Reference record IDs.`;
  try { const answer = await groqChat(SP.mdm, prompt, maxTokens || 1200); return res.json({ ok: true, answer, createdAt: new Date().toISOString() }); }
  catch (e) { return res.status(500).json({ ok: false, error: e.message }); }
});
""",
    '/api/integration/query': """
app.post('/api/integration/query', async (req, res) => {
  const { systems, integrations, kpis, context, maxTokens } = req.body || {};
  const summary = JSON.stringify({ kpis, degraded: (systems||[]).filter(s=>s.status!=='up'), error_total: (systems||[]).reduce((a,s)=>a+(s.errors||0),0), warn_integrations: (integrations||[]).filter(i=>i.status!=='ok') }, null, 2);
  const prompt = `Integration Hub snapshot:\\n${summary}\\n\\n` + (context||'') + `\\nIdentify the highest-risk interfaces, root cause of errors or latency spikes, and the specific remediation action per affected system.`;
  try { const answer = await groqChat(SP.integration, prompt, maxTokens || 1200); return res.json({ ok: true, answer, createdAt: new Date().toISOString() }); }
  catch (e) { return res.status(500).json({ ok: false, error: e.message }); }
});
""",
    '/api/governance/query': """
app.post('/api/governance/query', async (req, res) => {
  const { controls, risks, audit, kpis, context, maxTokens } = req.body || {};
  const summary = JSON.stringify({ kpis, failed_controls: (controls||[]).filter(c=>c.status!=='PASS'), open_risks: (risks||[]).filter(r=>r.status==='OPEN'), flagged_audit: (audit||[]).filter(a=>a.result!=='OK') }, null, 2);
  const prompt = `Governance snapshot:\\n${summary}\\n\\n` + (context||'') + `\\nIdentify the highest-severity compliance failures, open risks, and audit anomalies with specific remediation actions per finding.`;
  try { const answer = await groqChat(SP.governance, prompt, maxTokens || 1200); return res.json({ ok: true, answer, createdAt: new Date().toISOString() }); }
  catch (e) { return res.status(500).json({ ok: false, error: e.message }); }
});
""",
    '/api/digital-twin/query': """
app.post('/api/digital-twin/query', async (req, res) => {
  const { domains, signals, forecasts, health_score, context, maxTokens } = req.body || {};
  const summary = JSON.stringify({ health_score, at_risk_domains: (domains||[]).filter(d=>d.score<75).map(d=>({name:d.name,score:d.score,delta:d.delta})), warn_signals: (signals||[]).filter(s=>s.type!=='ok'), forecasts }, null, 2);
  const prompt = `Enterprise Digital Twin snapshot:\\n${summary}\\n\\n` + (context||'') + `\\nGenerate an executive brief: top 3 risks, top 3 opportunities, and the single most important decision required in the next 30 days.`;
  try { const answer = await groqChat(SP.digital_twin, prompt, maxTokens || 1400); return res.json({ ok: true, answer, createdAt: new Date().toISOString() }); }
  catch (e) { return res.status(500).json({ ok: false, error: e.message }); }
});
"""
}

CRM_ROUTE_ANCHOR = "app.post('/api/crm/query'"
for path, route in ROUTES.items():
    route_anchor = f"app.post('{path}'"
    if route_anchor in src:
        print(f'[server.js] {path} already present')
    elif CRM_ROUTE_ANCHOR in src:
        idx = src.index(CRM_ROUTE_ANCHOR)
        src = src[:idx] + route + '\n' + src[idx:]
        changes.append(path)
    else:
        # append before app.listen
        LISTEN = 'app.listen('
        if LISTEN in src:
            idx = src.rindex(LISTEN)
            src = src[:idx] + route + '\n' + src[idx:]
            changes.append(path)

# 4. Update COLLECTIVE_VERTICALS
OLD_CV = "'healthcare', 'finops', 'bpo', 'legal', 'real-estate', 'insurance', 'construction', 'o2c', 'crm', 'cpq'"
NEW_CV = "'healthcare', 'finops', 'bpo', 'legal', 'real-estate', 'insurance', 'construction', 'o2c', 'crm', 'cpq', 'mdm', 'integration', 'governance'"
if OLD_CV in src:
    src = src.replace(OLD_CV, NEW_CV, 1)
    changes.append('COLLECTIVE_VERTICALS updated')
else:
    print('WARNING: COLLECTIVE_VERTICALS not updated — check manually', file=sys.stderr)

with open('server.js', 'w') as f:
    f.write(src)

print(f'[server.js] Changes: {changes}')
PYEOF

# ══════════════════════════════════════════════════════════════════════════════
# PATCH WIP COMMAND CENTER — add new tabs
# ══════════════════════════════════════════════════════════════════════════════
python3 << 'PYEOF'
with open('html/tsm-wip-command-center.html', 'r') as f:
    src = f.read()

OLD = "  { id:'crm',          label:'CRM',              warRoom:'/war-rooms/crm/crm-war-room.html' }"
NEW = """  { id:'crm',          label:'CRM',              warRoom:'/war-rooms/crm/crm-war-room.html' },
  { id:'mdm',          label:'MDM',              warRoom:'/war-rooms/mdm/mdm-war-room.html' },
  { id:'integration',  label:'Integration Hub',  warRoom:'/war-rooms/integration-hub/integration-hub.html' },
  { id:'governance',   label:'Governance',       warRoom:'/war-rooms/governance/governance-war-room.html' },
  { id:'digital-twin', label:'Digital Twin',     warRoom:'/war-rooms/digital-twin/digital-twin.html' }"""

if "id:'mdm'" in src:
    print('[wip] tabs already present')
elif OLD in src:
    src = src.replace(OLD, NEW, 1)
    print('[wip] Added MDM, Integration Hub, Governance, Digital Twin tabs')
    with open('html/tsm-wip-command-center.html', 'w') as f:
        f.write(src)
else:
    print('WARNING: CRM tab anchor not found', file=sys.stderr)
PYEOF

# ══════════════════════════════════════════════════════════════════════════════
# VERIFY
# ══════════════════════════════════════════════════════════════════════════════
echo ""
echo "=== VERIFICATION ==="
node --check server.js && echo "server.js: SYNTAX OK" || echo "server.js: SYNTAX ERROR"
echo ""
echo "--- War room files ---"
find html/war-rooms -name "*.html" | sort
echo ""
echo "--- New API routes ---"
grep -n "mdm/query\|integration/query\|governance/query\|digital-twin/query\|crm/query" server.js | head -10
echo ""
echo "--- war-rooms mount ---"
grep -n "war-rooms" server.js | head -5
echo ""
echo "--- WIP tabs ---"
grep -n "mdm\|integration\|governance\|digital-twin" html/tsm-wip-command-center.html | head -10
echo ""
echo "If SYNTAX OK:"
echo "  git add -A && git commit -m 'feat: phases 2,6,7,8,10 — CRM, MDM, Integration Hub, Governance, Digital Twin' && fly deploy -a tsm-consultz"
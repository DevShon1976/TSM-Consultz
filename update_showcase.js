<script>
let currentMode = 'sample';
let selectedSampleId = null;
let selectedFile = null;
let lastReport = null;

const SAMPLES = {
  'bank-recon': { label: 'Bank Reconciliation', content: 'Q1 variance of $48K detected in project escrow.', risk: 'MED', flags: '3', actions: '2', conf: '94%' },
  'ap-aging': { label: 'AP Aging Report', content: '180-day aging summary. Total outstanding: $312,400.', risk: 'HIGH', flags: '12', actions: '5', conf: '89%' },
  'denial-report': { label: 'Denial Report', content: 'Insurance claim friction. 18.4% denial rate.', risk: 'HIGH', flags: '8', actions: '4', conf: '92%' },
  'gl-extract': { label: 'GL Extract', content: 'General Ledger Q1. Revenue vs Budget variance of -12%.', risk: 'LOW', flags: '1', actions: '1', conf: '97%' },
  'audit-finding': { label: 'Audit Finding', content: 'OSHA Safety Gap: 3 open findings requiring remediation.', risk: 'CRIT', flags: '3', actions: '3', conf: '91%' },
  'variance-report': { label: 'Variance Report', content: 'Labor hours vs estimate. 14% lag in project timeline.', risk: 'MED', flags: '5', actions: '2', conf: '95%' }
};

window.setMode = (m) => {
  currentMode = m;
  document.getElementById('mode-sample').classList.toggle('active', m === 'sample');
  document.getElementById('mode-actual').classList.toggle('active', m === 'actual');
  document.getElementById('panel-sample').style.display = m === 'sample' ? 'block' : 'none';
  document.getElementById('panel-actual').style.display = m === 'actual' ? 'block' : 'none';
};

window.selectSample = (el, id) => {
  document.querySelectorAll('.sample-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  selectedSampleId = id;
  document.getElementById('procBtn').disabled = false;
};

window.setPipe = (step) => {
  for(let i=0; i<=4; i++) {
    const dot = document.getElementById('pipe-'+i);
    if(!dot) continue;
    dot.classList.remove('active', 'done');
    if(i < step) dot.classList.add('done');
    if(i === step) dot.classList.add('active');
  }
};

window.processDoc = async () => {
  const ob = document.getElementById('outBody');
  const os = document.getElementById('outStatus');
  const btn = document.getElementById('procBtn');
  btn.disabled = true;
  ob.className = 'out-body thinking';
  
  setPipe(0); os.textContent = "INGESTING";
  await new Promise(r => setTimeout(r, 600));
  setPipe(1); os.textContent = "PARSING";
  
  try {
    const docData = currentMode === 'sample' ? SAMPLES[selectedSampleId] : { label: 'Uploaded File', content: 'USER_DOC' };
    
    // LIVE BACKEND CALL
    const res = await fetch("https://tsm-core.fly.dev/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ app: "construction-showcase", messages: [{ role: "user", content: "Analyze: " + docData.content }] })
    });
    const data = await res.json();
    
    setPipe(4);
    ob.className = 'out-body';
    ob.innerHTML = `<div style="color:#0f0"><b>${docData.label} Analysis:</b><br><br>${data.reply}</div>`;
    os.textContent = "COMPLETE";
    
    document.getElementById('kv-risk').textContent = docData.risk;
    document.getElementById('kv-flag').textContent = docData.flags;
    document.getElementById('kv-conf').textContent = docData.conf;
    document.querySelectorAll('.kpi-card').forEach(c => c.classList.add('visible'));
    document.getElementById('pushBtn').classList.add('visible');
  } catch(e) {
    ob.textContent = "> Handshake Error. Verify tsm-core status.";
  }
  btn.disabled = false;
};
</script>

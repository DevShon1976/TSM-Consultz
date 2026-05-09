(function(){
  if(window.__TSM_BPO_OPS_CLOUD_PHASE2__) return;
  window.__TSM_BPO_OPS_CLOUD_PHASE2__ = true;

  const CLIENTS = [
    {id:"ameris", name:"Ameris Construction", sector:"Construction", plan:"Enterprise"},
    {id:"honorhealth", name:"HonorHealth", sector:"Healthcare", plan:"Enterprise"},
    {id:"rrd", name:"RR Donnelley", sector:"Document Ops", plan:"Enterprise"},
    {id:"allure", name:"Allure Beauty Concepts", sector:"FinOps", plan:"Growth"},
    {id:"desert", name:"Desert Financial", sector:"FinOps", plan:"Enterprise"}
  ];

  const OPS = ["Torrey", "Ops Lead", "Finance Lead", "Compliance Lead", "Document Lead", "Strategist"];

  function store(){ return JSON.parse(localStorage.getItem("tsm_bpo_tasks") || "[]"); }
  function save(x){ localStorage.setItem("tsm_bpo_tasks", JSON.stringify(x)); }

  function seed(){
    if(store().length) return;
    save([
      {id:"BPO-1001",client:"Ameris Construction",lane:"Planroom",owner:"Document Lead",sla:"2h",status:"Open",risk:"HIGH",summary:"Blueprint revision conflict needs OCR validation"},
      {id:"BPO-1002",client:"HonorHealth",lane:"Prior Auth",owner:"Compliance Lead",sla:"4h",status:"Open",risk:"HIGH",summary:"Payer delay creating care-flow and revenue risk"},
      {id:"BPO-1003",client:"RR Donnelley",lane:"QA Routing",owner:"Ops Lead",sla:"1h",status:"Review",risk:"MED",summary:"Mail batch exception queue requires release approval"},
      {id:"BPO-1004",client:"Allure Beauty Concepts",lane:"AP Recon",owner:"Finance Lead",sla:"Today",status:"Open",risk:"MED",summary:"Vendor payment timing and close readiness issue"}
    ]);
  }

  function css(){
    if(document.getElementById("bpo-cloud-css")) return;
    const s=document.createElement("style");
    s.id="bpo-cloud-css";
    s.textContent=`
      #bpo-cloud-bar{
        position:sticky;top:0;z-index:9998;
        background:#06111a;border-bottom:1px solid rgba(0,255,198,.18);
        display:flex;gap:10px;align-items:center;justify-content:space-between;
        padding:10px 16px;color:#dff7ff;font-family:Inter,system-ui,Arial;
      }
      #bpo-cloud-bar select,#bpo-cloud-bar button{
        background:#0b1722;color:#dff7ff;border:1px solid rgba(0,255,198,.25);
        border-radius:8px;padding:8px 10px;font-weight:800;
      }
      #bpo-cloud-bar button{cursor:pointer}
      #bpo-cloud-panel{
        position:fixed;right:18px;top:72px;width:390px;max-height:78vh;overflow:auto;
        z-index:9999;background:#07131d;border:1px solid rgba(0,255,198,.25);
        border-radius:14px;padding:16px;color:#dff7ff;box-shadow:0 0 28px rgba(0,255,198,.18);
        display:none;font-family:Inter,system-ui,Arial;
      }
      #bpo-cloud-panel.active{display:block}
      .bpo-task{background:#050b12;border:1px solid rgba(255,255,255,.08);border-left:3px solid #00ffc6;border-radius:10px;padding:10px;margin:10px 0}
      .bpo-task.high{border-left-color:#ff5252}.bpo-task.med{border-left-color:#ffc400}
      .bpo-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:10px 0}
      .bpo-kpis div{background:#050b12;border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:10px}
      .bpo-kpis b{display:block;color:#00ffc6;font-size:20px}
    `;
    document.head.appendChild(s);
  }

  function activeClient(){
    return localStorage.getItem("tsm_bpo_client") || CLIENTS[0].id;
  }

  function clientName(){
    return CLIENTS.find(c=>c.id===activeClient())?.name || CLIENTS[0].name;
  }

  function addTask(lane="General", summary="New BPO operating task created"){
    const tasks=store();
    const task={
      id:"BPO-"+Math.floor(1000+Math.random()*8999),
      client:clientName(),
      lane,
      owner:OPS[Math.floor(Math.random()*OPS.length)],
      sla:["1h","2h","4h","Today","24h"][Math.floor(Math.random()*5)],
      status:"Open",
      risk:["HIGH","MED","LOW"][Math.floor(Math.random()*3)],
      summary,
      ts:new Date().toISOString()
    };
    tasks.unshift(task);
    save(tasks);
    renderPanel(true);
    return task;
  }

  function rollup(){
    const tasks=store().filter(t=>t.client===clientName());
    const high=tasks.filter(t=>t.risk==="HIGH").length;
    const open=tasks.filter(t=>t.status!=="Done").length;
    const sla=tasks.filter(t=>/1h|2h|4h/.test(t.sla)).length;
    return {tasks,high,open,sla};
  }

  function strategistSummary(){
    const {tasks,high,open,sla}=rollup();
    return `EXECUTIVE ROLLUP · ${clientName()}

OPEN TASKS
${open}

HIGH RISK
${high}

SLA WATCH
${sla}

CROSS-SUITE BNCA
1. Assign owners for all high-risk open items.
2. Clear SLA-watch blockers before end of operating window.
3. Push unresolved risk into Strategist memory.
4. Generate client-facing executive summary.

TOP ACTIVE ISSUE
${tasks[0]?.summary || "No active issue loaded."}

CONFIDENCE
92%`;
  }

  function renderPanel(open=false){
    const panel=document.getElementById("bpo-cloud-panel");
    if(!panel) return;
    const {tasks,high,open:openCount,sla}=rollup();

    panel.innerHTML=`
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="color:#00ffc6;font-weight:900;letter-spacing:.16em">TSM BPO OPS CLOUD</div>
          <div style="color:#8aa6b7;font-size:12px">${clientName()}</div>
        </div>
        <button onclick="document.getElementById('bpo-cloud-panel').classList.remove('active')" style="background:#102033;color:#fff;border:1px solid #244;border-radius:8px;padding:6px 9px">Close</button>
      </div>

      <div class="bpo-kpis">
        <div><small>OPEN</small><b>${openCount}</b></div>
        <div><small>HIGH</small><b>${high}</b></div>
        <div><small>SLA</small><b>${sla}</b></div>
        <div><small>PLAN</small><b>${CLIENTS.find(c=>c.id===activeClient())?.plan || "Ops"}</b></div>
      </div>

      <button onclick="window.bpoCreateTaskFromPage()" style="width:100%;background:#00ffc6;color:#001;border:0;border-radius:10px;padding:11px;font-weight:900">+ CREATE TASK FROM CURRENT LANE</button>
      <button onclick="window.bpoShowRollup()" style="width:100%;margin-top:8px;background:#ffc400;color:#001;border:0;border-radius:10px;padding:11px;font-weight:900">EXECUTIVE ROLLUP</button>

      <div style="margin-top:12px;color:#8aa6b7;font-size:12px;letter-spacing:.12em">TASK QUEUE</div>
      ${tasks.map(t=>`
        <div class="bpo-task ${t.risk==='HIGH'?'high':t.risk==='MED'?'med':''}">
          <b>${t.id} · ${t.lane}</b><br>
          <span style="color:#9fb8c8">${t.summary}</span><br>
          <small>Owner: ${t.owner} · SLA: ${t.sla} · Risk: ${t.risk}</small>
        </div>
      `).join("")}
    `;
    if(open) panel.classList.add("active");
  }

  function boot(){
    seed(); css();

    const bar=document.createElement("div");
    bar.id="bpo-cloud-bar";
    bar.innerHTML=`
      <div style="font-weight:900;color:#00ffc6;letter-spacing:.14em">TSM OPS CLOUD</div>
      <div style="display:flex;gap:8px;align-items:center">
        <select id="bpo-client-select">
          ${CLIENTS.map(c=>`<option value="${c.id}" ${c.id===activeClient()?'selected':''}>${c.name}</option>`).join("")}
        </select>
        <button id="bpo-open-cloud">Ops Queue</button>
        <button id="bpo-rollup">Executive Rollup</button>
      </div>
    `;
    document.body.prepend(bar);

    const panel=document.createElement("div");
    panel.id="bpo-cloud-panel";
    document.body.appendChild(panel);

    document.getElementById("bpo-client-select").onchange=e=>{
      localStorage.setItem("tsm_bpo_client",e.target.value);
      renderPanel(false);
    };
    document.getElementById("bpo-open-cloud").onclick=()=>renderPanel(true);
    document.getElementById("bpo-rollup").onclick=()=>window.bpoShowRollup();

    window.bpoCreateTaskFromPage=function(){
      const lane=(document.querySelector(".nb.active,.si.active,.nav-btn.active")?.innerText || "Current Lane").replace(/[0-9]/g,"").trim();
      addTask(lane || "Current Lane", `${lane || "Current lane"} needs BNCA ownership and SLA review`);
    };

    window.bpoShowRollup=function(){
      const out=document.createElement("pre");
      out.style.cssText="position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:10000;width:min(760px,92vw);max-height:80vh;overflow:auto;background:#050b12;color:#dff7ff;border:1px solid #00ffc6;border-radius:16px;padding:22px;white-space:pre-wrap;box-shadow:0 0 40px rgba(0,255,198,.22)";
      out.textContent=strategistSummary();
      out.onclick=()=>out.remove();
      document.body.appendChild(out);
    };

    renderPanel(false);
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot);
  else boot();
})();

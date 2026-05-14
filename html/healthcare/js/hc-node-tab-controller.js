(function(){
  if(window.__HC_NODE_TAB_CONTROLLER_V2__) return;
  window.__HC_NODE_TAB_CONTROLLER_V2__=true;

  function detectNode(){
    return window.TSMBridge?.detectNode?.() || window.tsmDetectHCNode?.() || "OPERATIONS";
  }

  const content = {
    DASHBOARD:["Current node health","Top KPIs","Frontline queue","Owner lane"],
    OVERVIEW:["Current operating state","Active queue","Risk indicators","Owner readiness"],
    CLAIMS:["Claim queue","Denial patterns","Appeal packets","Payer ownership"],
    CODING:["CPT / ICD review","Modifier risk","Documentation support","Code-level action"],
    "CLINICAL OPS":["Patient flow","Provider load","Clinical task backlog","Care plan readiness"],
    "BILLING & CPT":["Charge capture","CPT audit","Clean claim readiness","Documentation gap"],
    "PRIOR AUTH":["Authorization queue","Payer SLA","Missing evidence","Escalation path"],
    HIPAA:["Access logs","PHI exposure","User review","Audit trail"],
    CMS:["CMS readiness","Policy gaps","Evidence packet","Deadline watch"],
    "JOINT COMMISSION":["Quality readiness","Survey prep","Findings","Corrective actions"],
    OIG:["OIG exposure","Watchlist review","Regulatory risk","Remediation lane"],
    "AR AGING":["Aging buckets","Payer delays","Recovery priority","Cash impact"],
    "P&L":["Margin pressure","Revenue trend","Cost drivers","Executive summary"],
    "PAYER ANALYSIS":["Payer scorecard","Denial by payer","Contract variance","Recovery opportunity"],
    "CASH FLOW":["Collections timing","Deposit match","Forecast risk","Finance action"],
    STAFFING:["Coverage gaps","Shift pressure","Burnout risk","Owner lane"],
    SCHEDULING:["Backlog","No-show risk","Room utilization","Patient flow"],
    VENDORS:["SLA exceptions","Supply blocker","Contract status","Procurement lane"],
    INTAKE:["Queue volume","Critical intake","Missing data","Routing action"],
    ALERTS:["Critical alerts","Warning items","Resolved today","Escalation action"],
    "AI ANALYSIS":["Deep AI analysis","Prompt presets","BNCA output","Strategist relay"],
    PRESETS:["One-click prompts","Common workflows","Node scenarios","Demo actions"]
  };

  function ensureSection(tabName){
    let area=document.getElementById("hc-tab-live-content");
    if(!area){
      area=document.createElement("section");
      area.id="hc-tab-live-content";
      area.style.cssText="margin:14px 18px;padding:16px;background:#07131d;border:1px solid rgba(0,255,198,.22);border-radius:16px;color:#dff7ff;font-family:Inter,system-ui,Arial";
      const anchor=document.querySelector("main,.content,.dashboard,.node-main") || document.body;
      anchor.appendChild(area);
    }

    const n=detectNode();
    const key=String(tabName||"DASHBOARD").trim().toUpperCase();
    const items=content[key] || content.DASHBOARD;

    area.innerHTML=`
      <div style="color:#00ffc6;font-weight:950;letter-spacing:.14em;margin-bottom:8px">${n} · ${key}</div>
      <div style="color:#8aa6b7;margin-bottom:12px">Professional node content · frontline workflow · HC Strategist relay</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">
        ${items.map(x=>`
          <div style="background:#0a1b28;border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:13px">
            <b style="color:#00ffc6">${x}</b>
            <div style="color:#9fb8c8;margin-top:6px;font-size:12px">Queue status, owner lane, and next-action readiness.</div>
          </div>
        `).join("")}
      </div>
      <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
        <button style="background:#00ffc6;color:#001;border:0;border-radius:10px;padding:10px 12px;font-weight:950" onclick="window.hcUniversalAIRun && window.hcUniversalAIRun('Analyze ${key} for ${n} and return BNCA')">⚡ Analyze ${key}</button>
        <button style="background:#b56cff;color:#fff;border:0;border-radius:10px;padding:10px 12px;font-weight:950" onclick="window.hcStrategistRollup && window.hcStrategistRollup()">HC Strategist Rollup</button>
      </div>
    `;
  }

  function wireTabs(){
    const candidates=[...document.querySelectorAll("button,a,.tab,[role='tab']")];
    candidates.forEach(el=>{
      const txt=(el.innerText || el.textContent || "").trim();
      if(!txt || txt.length>32) return;
      if(el.dataset.hcTabController) return;
      if(!/dashboard|overview|claims|coding|clinical|billing|prior|hipaa|cms|joint|oig|ar aging|p&l|payer|cash|staffing|scheduling|vendors|intake|alerts|ai analysis|presets/i.test(txt)) return;

      el.dataset.hcTabController="true";
      el.addEventListener("click",()=>{
        setTimeout(()=>ensureSection(txt),80);
      },true);
    });

    if(!document.getElementById("hc-tab-live-content")){
      ensureSection("DASHBOARD");
    }
  }

  window.hcPopulateTabContent=ensureSection;

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",wireTabs);
  else wireTabs();

  [800,1800,3200].forEach(ms=>setTimeout(wireTabs,ms));
})();

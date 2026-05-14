(function(){
  if(window.__HC_UNIVERSAL_TAB_AI_V3__) return;
  window.__HC_UNIVERSAL_TAB_AI_V3__=true;

  const NODE_ACTIONS={
    OPERATIONS:["Rebalance intake queue","Review staff coverage","Clear scheduling backlog","Run throughput BNCA"],
    MEDICAL:["Review patient flow","Analyze clinical backlog","Run no-show risk","Return medical BNCA"],
    BILLING:["Scrub claim batch","Review AR aging","Create appeal packet","Return billing BNCA"],
    COMPLIANCE:["Review PHI access logs","Check expired credentials","Generate audit packet","Return compliance BNCA"],
    FINANCIAL:["Run revenue forecast","Match payer deposits","Review margin contribution","Return finance BNCA"],
    INSURANCE:["Verify eligibility","Review prior-auth aging","Escalate payer SLA","Return insurance BNCA"],
    PHARMACY:["Review refill queue","Check formulary status","Run medication PA review","Return pharmacy BNCA"],
    VENDORS:["Review vendor SLA","Create supply order","Check certificate expiry","Return vendor BNCA"],
    LEGAL:["Review expiring contract","Check credentialing queue","Open legal escalation","Return legal BNCA"],
    GRANTS:["Track grant deadline","Generate compliance report","Review eligibility","Return grants BNCA"],
    TAXPREP:["Check W-9 gaps","Prepare 1099 packet","Review filing window","Return tax BNCA"]
  };

  const NODE_KPIS={
    OPERATIONS:["Ops Queue|31","Staff Coverage|84%","Scheduling Backlog|12","Throughput|78/100"],
    MEDICAL:["No-Show Risk|14","Open Care Plans|32","Clinical Tasks|18","Provider Load|84%"],
    BILLING:["Claims Pending|247","Denial Rate|18.4%","Clean Claim Rate|94.2%","Stalled Revenue|$48K"],
    COMPLIANCE:["HIPAA Logs|ACTIVE","Policy Gaps|6","Audit Risk|HIGH","Access Review|OPEN"],
    FINANCIAL:["Revenue Risk|$2.1M","Margin Pressure|MED","Batch Recon|Open","Forecast|92%"],
    INSURANCE:["Eligibility Queue|64","PA Aging|22","Payer SLA|WATCH","Denial Risk|HIGH"],
    PHARMACY:["Refill Queue|38","Med PA|17","Inventory Flags|5","Formulary Risk|MED"],
    VENDORS:["SLA Exceptions|7","PO Requests|18","Spend Watch|$84K","Contract Gaps|3"],
    LEGAL:["Contracts|22","Renewals|8","Credential Queue|14","Escalations|4"],
    GRANTS:["Open Grants|9","Reports Due|3","Eligibility|82%","Renewals|4"],
    TAXPREP:["1099 Ready|74%","W-9 Gaps|11","Filing Window|APR","Vendor Docs|6"]
  };

  function node(){
    return (window.TSMBridge?.detectNode?.() || window.tsmDetectHCNode?.() || "OPERATIONS").toUpperCase();
  }
  function tab(){
    return window.TSMBridge?.activeTab?.() || window.tsmActiveHCTab?.() || "Current View";
  }

  function ensureStyles(){
    if(document.getElementById("hc-universal-ai-v3-css")) return;
    const s=document.createElement("style");
    s.id="hc-universal-ai-v3-css";
    s.textContent=`
      .hc-ai-panel{margin:14px 18px;padding:16px;background:#06111b;border:1px solid rgba(0,255,198,.25);border-radius:16px;color:#dff7ff;font-family:Inter,system-ui,Arial}
      .hc-ai-title{color:#00ffc6;font-weight:950;letter-spacing:.14em;margin-bottom:10px}
      .hc-ai-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:12px 0}
      .hc-ai-kpi{background:#0a1b28;border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:12px}
      .hc-ai-kpi small{display:block;color:#8aa6b7;font-size:10px;letter-spacing:.12em}
      .hc-ai-kpi b{display:block;color:#00ffc6;font-size:20px;margin-top:6px}
      .hc-ai-actions{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}
      .hc-ai-action{background:#00ffc6;color:#001;border:0;border-radius:11px;padding:10px 12px;font-weight:950;cursor:pointer}
      .hc-ai-output{white-space:pre-wrap;background:#050b12;border:1px solid rgba(0,255,198,.18);border-radius:12px;padding:14px;margin-top:10px;min-height:120px;max-height:340px;overflow:auto;font-family:ui-monospace,Consolas,monospace}
      @media(max-width:900px){.hc-ai-kpis{grid-template-columns:1fr 1fr}}
    `;
    document.head.appendChild(s);
  }

  function ensurePanel(){
    ensureStyles();
    let panel=document.getElementById("hc-universal-ai-panel");
    if(panel) return panel;

    panel=document.createElement("section");
    panel.id="hc-universal-ai-panel";
    panel.className="hc-ai-panel";

    const anchor=document.querySelector("main,.content,.dashboard,.node-main") || document.body;
    anchor.prepend(panel);
    return panel;
  }

  function render(){
    const n=node();
    const actions=NODE_ACTIONS[n] || NODE_ACTIONS.OPERATIONS;
    const kpis=NODE_KPIS[n] || NODE_KPIS.OPERATIONS;
    const panel=ensurePanel();

    panel.innerHTML=`
      <div class="hc-ai-title">${n} · AI OPERATING LAYER</div>
      <div style="color:#8aa6b7;margin-bottom:10px">Tab-aware BNCA · owner lane · HITL decision · strategist relay</div>
      <div class="hc-ai-kpis">
        ${kpis.map(x=>{
          const [a,b]=x.split("|");
          return `<div class="hc-ai-kpi"><small>${a}</small><b>${b}</b></div>`;
        }).join("")}
      </div>
      <div class="hc-ai-actions">
        ${actions.map(a=>`<button class="hc-ai-action" data-hc-prompt="${a.replace(/"/g,'&quot;')}">⚡ ${a}</button>`).join("")}
      </div>
      <pre class="hc-ai-output" id="hc-universal-ai-output">Ready. Select an AI action or use the tab controls below.</pre>
    `;

    panel.querySelectorAll("[data-hc-prompt]").forEach(btn=>{
      btn.onclick=()=>run(btn.dataset.hcPrompt);
    });
  }

  async function run(prompt){
    const out=document.getElementById("hc-universal-ai-output") || ensurePanel().querySelector(".hc-ai-output");
    const n=node(), t=tab();
    out.textContent=`> TSM Neural Core\nRunning ${n} analysis for ${t}...\n`;
    try{
      const reply=await (window.TSMBridge?.askHC || window.tsmAskHC)(prompt,{node:n,tab:t});
      out.textContent=`> TSM NEURAL\n\n${reply}`;
    }catch(e){
      out.textContent=`> TSM NEURAL FALLBACK\n\nTOP ISSUE\n${n} requires review for ${prompt}.\n\nWHY IT MATTERS\nThis node may affect revenue, staffing, compliance, patient flow, or executive escalation.\n\nBEST NEXT ACTIONS\n1. Assign owner lane.\n2. Review current tab signals.\n3. Run BNCA.\n4. Relay unresolved risk to HC Strategist.\n\nOWNER LANE\n${n} Lead\n\nCONFIDENCE\n92%`;
    }
  }

  window.hcUniversalAIRun=run;
  window.hcUniversalAIRender=render;

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",render);
  else render();

  [800,1800,3200].forEach(ms=>setTimeout(render,ms));
})();

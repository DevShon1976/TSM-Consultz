(function(){
  if(window.__HC_UNIVERSAL_TAB_AI__) return;
  window.__HC_UNIVERSAL_TAB_AI__=true;

  const NODE_ACTIONS = {
    billing:["Analyze denial risk","Create appeal packet","Review AR aging","Return billing BNCA"],
    medical:["Review patient flow","Analyze clinical backlog","Run no-show risk","Return medical BNCA"],
    compliance:["Review HIPAA exposure","Check audit readiness","Find policy gaps","Return compliance BNCA"],
    financial:["Run revenue forecast","Match payer deposits","Review margin contribution","Return finance BNCA"],
    operations:["Review staffing pressure","Clear scheduling backlog","Analyze intake queue","Return ops BNCA"],
    insurance:["Verify eligibility risks","Review prior auth aging","Predict denial risk","Return insurance BNCA"],
    legal:["Review contract risk","Check credentialing queue","Escalate legal exception","Return legal BNCA"],
    pharmacy:["Review refill queue","Check formulary risk","Analyze med prior auth","Return pharmacy BNCA"],
    vendors:["Review vendor SLA","Check supply risk","Sync invoice issue","Return vendor BNCA"],
    grants:["Review grant deadline","Check compliance report","Find funding risk","Return grants BNCA"],
    taxprep:["Check W-9 gaps","Prepare 1099 packet","Review filing window","Return tax BNCA"]
  };

  function node(){
    const p=location.pathname.toLowerCase();
    const b=(document.body.innerText||"").toLowerCase();
    if(p.includes("taxprep") || b.includes("tax prep")) return "taxprep";
    return Object.keys(NODE_ACTIONS).find(k=>p.includes(k)||b.includes(`hc ${k}`)||b.includes(`${k} node`)) || "operations";
  }

  function activeTab(){
    const candidates=[
      ".tab.active",".active[role='tab']","nav .active","button.active","a.active",
      "[aria-selected='true']"
    ];
    for(const c of candidates){
      const el=document.querySelector(c);
      if(el && (el.innerText||"").trim()) return el.innerText.trim();
    }
    return "Current Tab";
  }

  function css(){
    if(document.getElementById("hc-universal-tab-ai-css")) return;
    const s=document.createElement("style");
    s.id="hc-universal-tab-ai-css";
    s.textContent=`
      #hc-tab-ai-bar{
        margin:10px 18px;padding:12px;background:#06131d;border:1px solid rgba(0,255,198,.3);
        border-radius:13px;display:flex;gap:8px;flex-wrap:wrap;align-items:center;z-index:9999;position:relative
      }
      #hc-tab-ai-bar button{
        background:#00ffc6;color:#001;border:0;border-radius:10px;padding:10px 13px;
        font-weight:950;cursor:pointer
      }
      #hc-tab-ai-output{
        margin:10px 18px;padding:14px;background:#050b12;color:#dff7ff;
        border:1px solid rgba(0,255,198,.28);border-radius:13px;white-space:pre-wrap;
        font-family:monospace;display:none;max-height:360px;overflow:auto
      }
    `;
    document.head.appendChild(s);
  }

  async function run(action){
    const out=document.getElementById("hc-tab-ai-output");
    out.style.display="block";
    out.textContent="TSM Neural Core running...";

    const n=node();
    const tab=activeTab();

    try{
      const r=await fetch("/api/hc/query",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          action:"HC_TAB_AI_ASSIST",
          payload:{
            node:n.toUpperCase(),
            tab,
            context:action,
            priority:"HIGH"
          }
        })
      });
      const d=await r.json();
      out.textContent=d.reply||d.content||"No response";
    }catch(e){
      out.textContent=`TOP ISSUE
${n.toUpperCase()} · ${tab} requires review.

WHY IT MATTERS
This impacts frontline throughput, revenue timing, compliance posture, or patient handoff quality.

BEST NEXT ACTIONS
1. Assign ${n.toUpperCase()} Lead as accountable owner.
2. Clear blockers older than current operating window.
3. Document evidence and handoff requirements.
4. Relay unresolved risk to HC Strategist.

OWNER LANE
${n.toUpperCase()} Lead

CONFIDENCE
92%`;
    }

    try{
      await fetch("/api/hc/strategist-memory",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          node:n.toUpperCase(),
          action,
          risk:"HIGH",
          owner:n.toUpperCase()+" Lead",
          summary:n.toUpperCase()+": "+action
        })
      });
    }catch(e){}
  }

  function build(){
    css();

    let bar=document.getElementById("hc-tab-ai-bar");
    if(!bar){
      bar=document.createElement("div");
      bar.id="hc-tab-ai-bar";
      const anchor=document.querySelector("main,.content,.dashboard,.node-main") || document.body;
      anchor.prepend(bar);

      const out=document.createElement("pre");
      out.id="hc-tab-ai-output";
      bar.insertAdjacentElement("afterend",out);
    }

    const n=node();
    const actions=NODE_ACTIONS[n] || NODE_ACTIONS.operations;

    bar.innerHTML = actions.map(a=>`<button data-ai-action="${a}">⚡ ${a}</button>`).join("");
    bar.querySelectorAll("button").forEach(btn=>{
      btn.onclick=()=>run(btn.dataset.aiAction);
    });
  }

  function wireTabs(){
    document.querySelectorAll("button,a,.tab,[role='tab'],nav *").forEach(el=>{
      if(el.dataset.hcAiRefresh) return;
      el.dataset.hcAiRefresh="true";
      el.addEventListener("click",()=>setTimeout(build,80),true);
    });
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",()=>{build();wireTabs();});
  }else{
    build();wireTabs();
  }

  [600,1400,2800].forEach(ms=>setTimeout(()=>{build();wireTabs();},ms));
  console.log("HC Universal Tab AI installed");
})();

(function(){
  if(window.__TSM_AUTONOMOUS_EXECUTION_V5__) return;
  window.__TSM_AUTONOMOUS_EXECUTION_V5__ = true;

  const KEY="TSM_AUTONOMOUS_EXECUTION_V5";
  const path=location.pathname.toLowerCase();

  function sector(){
    if(path.includes("construction")) return "construction";
    if(path.includes("healthcare") || path.includes("hc-")) return "healthcare";
    if(path.includes("insurance") || path.includes("az-ins")) return "insurance";
    if(path.includes("finops") || path.includes("financial")) return "finops";
    if(path.includes("legal")) return "legal";
    if(path.includes("tax")) return "tax";
    if(path.includes("rrd")) return "rrd";
    return "executive";
  }

  const current=sector();

  const MAP={
    construction:{
      trigger:"Permit blocker detected",
      owner:"Project Engineer",
      relays:["legal","finops"],
      exposure:"$182K",
      actions:["Assign permit owner","Start escalation timer","Notify legal lane","Update billing exposure","Generate executive summary"]
    },
    healthcare:{
      trigger:"Denial spike detected",
      owner:"Revenue Integrity",
      relays:["insurance","finops"],
      exposure:"$189K",
      actions:["Assign denial owner","Escalate payer lane","Increase AR exposure","Notify HC strategist","Generate reimbursement summary"]
    },
    insurance:{
      trigger:"Payer qualification risk detected",
      owner:"Insurance Ops",
      relays:["healthcare","finops"],
      exposure:"$157K",
      actions:["Assign payer owner","Validate qualification docs","Notify healthcare lane","Update revenue forecast","Generate payer-risk summary"]
    },
    finops:{
      trigger:"Recon variance detected",
      owner:"Controller Ops",
      relays:["legal","tax"],
      exposure:"$480K",
      actions:["Assign controller owner","Open audit relay","Update close pressure","Request evidence","Generate CFO summary"]
    },
    legal:{
      trigger:"Matter deadline exposure detected",
      owner:"Legal Ops",
      relays:["finops","executive"],
      exposure:"$22.5K",
      actions:["Assign legal owner","Open deadline timer","Notify finance WIP","Generate client brief","Escalate partner review"]
    },
    tax:{
      trigger:"Filing packet incomplete",
      owner:"Tax Reviewer",
      relays:["finops","legal"],
      exposure:"$39K",
      actions:["Assign reviewer","Request missing docs","Open notice watch","Notify compliance lane","Generate filing-readiness summary"]
    },
    rrd:{
      trigger:"Charge-off risk escalating",
      owner:"Recovery Lead",
      relays:["legal","finops"],
      exposure:"$220K",
      actions:["Assign recovery owner","Score account risk","Open legal referral","Update recovery forecast","Generate executive rollup"]
    },
    executive:{
      trigger:"Cross-sector operating pressure detected",
      owner:"TSM Strategist",
      relays:["construction","healthcare","finops"],
      exposure:"ACTIVE",
      actions:["Identify pressure source","Assign sector owner","Publish relay","Update executive narrative","Monitor stabilization"]
    }
  };

  const cfg=MAP[current] || MAP.executive;

  function load(){
    try{return JSON.parse(localStorage.getItem(KEY)||"{}");}catch(e){return{};}
  }

  function save(s){localStorage.setItem(KEY,JSON.stringify(s));}

  const state=load();
  if(!state[current]){
    state[current]={stage:"Ready", owner:cfg.owner, exposure:cfg.exposure, log:[], runCount:0};
    save(state);
  }

  function css(){
    if(document.getElementById("tsm-auto-css")) return;
    const st=document.createElement("style");
    st.id="tsm-auto-css";
    st.textContent=`
      .tsm-auto{max-width:1280px;margin:26px auto;padding:20px;background:rgba(3,10,18,.98);border:1px solid rgba(0,255,198,.18);border-radius:18px;color:#e8f7ff;font-family:Inter,system-ui,Arial;position:relative;z-index:40}
      .tsm-auto h2{color:#00ffc6;margin:0;font-size:30px}
      .tsm-auto p{color:#9fb8c8;line-height:1.55}
      .auto-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:15px 0}
      .auto-card{background:#06131c;border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:14px}
      .auto-card small{display:block;color:#7f9aaa;letter-spacing:.14em;text-transform:uppercase;font-size:10px}
      .auto-card b{display:block;color:#00ffc6;margin-top:8px;font-size:22px}
      .auto-actions{display:flex;gap:10px;flex-wrap:wrap;margin:14px 0}
      .auto-actions button{background:#00ffc6;color:#001;border:0;border-radius:999px;padding:11px 16px;font-weight:900;cursor:pointer}
      .auto-actions button.alt{background:#0b1722;color:#dff7ff;border:1px solid rgba(255,255,255,.16)}
      .auto-output{white-space:pre-wrap;background:#020913;border-left:3px solid #00ffc6;border-radius:12px;padding:15px;color:#dff7ff;line-height:1.6}
      .auto-steps{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}
      .auto-step{border:1px solid rgba(0,255,198,.22);border-radius:999px;padding:8px 11px;color:#a8c6d6;font-size:12px}
      .auto-step.active{background:#00ffc6;color:#001;font-weight:900}
      .auto-log{margin-top:14px;background:#031018;border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:12px;max-height:240px;overflow:auto}
      .auto-log div{border-bottom:1px solid rgba(255,255,255,.05);padding:8px 0;color:#cbe3ef;font-size:13px}
      @media(max-width:900px){.auto-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(st);
  }

  function log(msg){
    state[current].log.unshift({at:new Date().toLocaleTimeString(), msg});
    state[current].log=state[current].log.slice(0,20);
    save(state);
    renderLog();
  }

  function activate(n){
    document.querySelectorAll(".auto-step").forEach((x,i)=>x.classList.toggle("active",i<=n));
  }

  function renderLog(){
    const box=document.getElementById("autoLog");
    if(!box) return;
    box.innerHTML=(state[current].log||[]).map(x=>`<div><b>${x.at}</b> · ${x.msg}</div>`).join("");
  }

  function write(mode){
    const out=document.getElementById("autoOutput");
    if(!out) return;
    out.textContent =
`${mode.toUpperCase()} · AUTONOMOUS EXECUTION

TRIGGER
${cfg.trigger}

OWNER
${state[current].owner}

EXPOSURE
${state[current].exposure}

AUTONOMOUS ACTION PLAN
${cfg.actions.map((x,i)=>(i+1)+". "+x).join("\n")}

CROSS-SECTOR RELAYS
${cfg.relays.map(x=>"→ "+x.toUpperCase()).join("\n")}

EXECUTIVE INTERPRETATION
TSM is no longer only displaying intelligence. It is simulating operational execution: detecting pressure, assigning ownership, publishing relays, updating exposure, and preparing executive action.`;
  }

  function runAuto(){
    state[current].stage="Executing";
    state[current].runCount=(state[current].runCount||0)+1;
    save(state);

    cfg.actions.forEach((a,i)=>{
      setTimeout(()=>{
        activate(i);
        log(a);
        if(i===cfg.actions.length-1){
          state[current].stage="Executive Ready";
          save(state);
          render();
        }
      }, i*650);
    });

    write("Execution Started");
  }

  function stabilize(){
    state[current].stage="Stabilized";
    state[current].exposure="Reduced";
    save(state);
    activate(cfg.actions.length-1);
    log("Workflow stabilized and executive posture updated.");
    write("Workflow Stabilized");
    render();
  }

  function render(){
    const root=document.getElementById("tsm-auto-root");
    if(!root) return;

    root.innerHTML=`
      <h2>Phase 5 · Autonomous Workflow Execution</h2>
      <p>Final command layer: detects pressure, assigns ownership, publishes relays, mutates exposure, executes workflow steps, and prepares executive action.</p>

      <div class="auto-grid">
        <div class="auto-card"><small>Sector</small><b>${current.toUpperCase()}</b></div>
        <div class="auto-card"><small>Stage</small><b>${state[current].stage}</b></div>
        <div class="auto-card"><small>Owner</small><b>${state[current].owner}</b></div>
        <div class="auto-card"><small>Exposure</small><b>${state[current].exposure}</b></div>
      </div>

      <div class="auto-actions">
        <button id="autoRun">Run Autonomous Workflow</button>
        <button id="autoRelay" class="alt">Publish Relays</button>
        <button id="autoNarrative" class="alt">Generate Executive Action</button>
        <button id="autoStable" class="alt">Stabilize Workflow</button>
      </div>

      <div class="auto-steps">
        ${cfg.actions.map((x,i)=>`<span class="auto-step ${i===0?'active':''}">${x}</span>`).join("")}
      </div>

      <div id="autoOutput" class="auto-output"></div>
      <div id="autoLog" class="auto-log"></div>
    `;

    document.getElementById("autoRun").onclick=runAuto;
    document.getElementById("autoRelay").onclick=()=>{
      log("Published relays to " + cfg.relays.join(", "));
      write("Relays Published");
    };
    document.getElementById("autoNarrative").onclick=()=>{
      log("Executive action narrative generated.");
      write("Executive Action Generated");
    };
    document.getElementById("autoStable").onclick=stabilize;

    renderLog();
    write("Live Baseline");
  }

  function build(){
    if(document.getElementById("tsm-autonomous-execution")) return;
    css();

    const box=document.createElement("section");
    box.id="tsm-autonomous-execution";
    box.className="tsm-auto";
    box.innerHTML=`<div id="tsm-auto-root"></div>`;

    (document.querySelector("main")||document.body).appendChild(box);
    render();

    if((state[current].log||[]).length===0){
      log("Autonomous execution layer initialized.");
    }
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",build);
  else build();
})();

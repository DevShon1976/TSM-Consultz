(function(){
  if(window.__TSM_MEMORY_ENGINE__) return;
  window.__TSM_MEMORY_ENGINE__ = true;

  const STORAGE_KEY = "TSM_OPERATIONAL_MEMORY_V3";

  const path = location.pathname.toLowerCase();

  function detectSector(){
    if(path.includes("construction")) return "construction";
    if(path.includes("healthcare") || path.includes("hc-")) return "healthcare";
    if(path.includes("insurance") || path.includes("az-ins")) return "insurance";
    if(path.includes("finops") || path.includes("financial")) return "finops";
    if(path.includes("legal")) return "legal";
    if(path.includes("tax")) return "tax";
    if(path.includes("rrd")) return "rrd";
    if(path.includes("music")) return "music";
    return "executive";
  }

  const sector = detectSector();

  const DEFAULTS = {
    construction:{
      exposure:"$182K",
      strategist:"HIGH",
      narrative:"Permit delays and subcontractor exposure are impacting billing timing and operational readiness."
    },
    healthcare:{
      exposure:"$189K",
      strategist:"HIGH",
      narrative:"Denial pressure and payer delays are increasing reimbursement exposure and operational escalation."
    },
    insurance:{
      exposure:"$144K",
      strategist:"MEDIUM",
      narrative:"Insurance qualification and payer pressure are impacting approval throughput and denial posture."
    },
    finops:{
      exposure:"$480K",
      strategist:"HIGH",
      narrative:"Close-readiness and reconciliation pressure continue to impact executive financial visibility."
    },
    legal:{
      exposure:"$22.5K",
      strategist:"MEDIUM",
      narrative:"Legal filing dependencies and WIP exposure remain operationally sensitive."
    },
    tax:{
      exposure:"$39K",
      strategist:"LOW",
      narrative:"Tax evidence collection and filing readiness are being actively monitored."
    },
    rrd:{
      exposure:"$220K",
      strategist:"HIGH",
      narrative:"Recovery pressure and unresolved charge-off exposure remain elevated."
    },
    executive:{
      exposure:"ACTIVE",
      strategist:"ACTIVE",
      narrative:"Cross-sector operational pressure is actively being coordinated through the strategist mesh."
    },
    realestate:{
      exposure:"$346K",
      strategist:"MEDIUM",
      narrative:"Appraisal gap exposure, title issues, and REO disposition timelines are driving pull-through risk."
    }
  };

  function loadMemory(){
    try{
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    }catch(e){
      return {};
    }
  }

  function saveMemory(mem){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mem));
  }

  const mem = loadMemory();

  if(!mem[sector]){
    mem[sector] = {
      exposure: DEFAULTS[sector]?.exposure || "ACTIVE",
      strategist: DEFAULTS[sector]?.strategist || "MEDIUM",
      narrative: DEFAULTS[sector]?.narrative || "Operational pressure detected.",
      timeline: [],
      owners: [],
      relays: [],
      pressure: 50
    };
  }

  saveMemory(mem);

  window.TSMMemory = {
    get(){
      return mem[sector];
    },

    timeline(msg){
      mem[sector].timeline.unshift({
        at:new Date().toLocaleTimeString(),
        message:msg
      });

      mem[sector].timeline =
        mem[sector].timeline.slice(0,25);

      saveMemory(mem);
      renderTimeline();
    },

    exposure(val){
      mem[sector].exposure = val;
      saveMemory(mem);
      renderState();
    },

    strategist(val){
      mem[sector].strategist = val;
      saveMemory(mem);
      renderState();
    },

    owner(val){
      mem[sector].owners.unshift({
        at:new Date().toLocaleTimeString(),
        owner:val
      });

      mem[sector].owners =
        mem[sector].owners.slice(0,10);

      saveMemory(mem);
      renderOwners();
    },

    narrative(val){
      mem[sector].narrative = val;
      saveMemory(mem);
      renderNarrative();
    },

    relay(val){
      mem[sector].relays.unshift({
        at:new Date().toLocaleTimeString(),
        relay:val
      });

      mem[sector].relays =
        mem[sector].relays.slice(0,15);

      saveMemory(mem);
      renderRelays();
    }
  };

  function css(){
    if(document.getElementById("tsm-memory-css")) return;

    const st=document.createElement("style");
    st.id="tsm-memory-css";

    st.textContent=`
      #tsm-memory-tab{
        position:fixed;
        right:18px;
        bottom:18px;
        z-index:600;
        background:#00ffc6;
        color:#001;
        font-weight:900;
        font-size:11px;
        letter-spacing:.08em;
        padding:10px 16px;
        border-radius:999px;
        cursor:pointer;
        box-shadow:0 4px 18px rgba(0,255,198,.35);
        font-family:Inter,system-ui;
      }

      .tsm-memory-layer{
        position:fixed;
        right:18px;
        bottom:66px;
        width:380px;
        max-height:65vh;
        overflow-y:auto;
        padding:16px;
        background:rgba(5,12,20,.97);
        border:1px solid rgba(0,255,198,.14);
        border-radius:16px;
        color:#dff7ff;
        font-family:Inter,system-ui;
        z-index:550;
        box-shadow:0 12px 40px rgba(0,0,0,.5);
        opacity:0;
        transform:translateY(16px) scale(.97);
        pointer-events:none;
        transition:opacity .18s ease, transform .18s ease;
      }

      .tsm-memory-layer.open{
        opacity:1;
        transform:translateY(0) scale(1);
        pointer-events:auto;
      }

      .tsm-memory-layer h2{
        color:#00ffc6;
        margin:0 0 8px;
        font-size:15px;
      }

      .memory-grid{
        display:grid;
        grid-template-columns:repeat(2,1fr);
        gap:8px;
        margin-top:12px;
      }

      .memory-card{
        background:#07131d;
        border:1px solid rgba(255,255,255,.08);
        border-radius:10px;
        padding:10px;
      }

      .memory-card small{
        display:block;
        color:#7c9aaa;
        letter-spacing:.1em;
        text-transform:uppercase;
        font-size:9px;
      }

      .memory-card b{
        display:block;
        color:#00ffc6;
        margin-top:6px;
        font-size:15px;
      }

      .memory-actions{
        display:flex;
        gap:8px;
        flex-wrap:wrap;
        margin:14px 0;
      }

      .memory-actions button{
        border:0;
        border-radius:999px;
        padding:8px 12px;
        font-size:11px;
        background:#00ffc6;
        color:#001;
        font-weight:900;
        cursor:pointer;
      }

      .memory-actions button.alt{
        background:#0b1722;
        color:#dff7ff;
        border:1px solid rgba(255,255,255,.15);
      }

      .memory-panel{
        margin-top:12px;
        background:#020913;
        border-left:3px solid #00ffc6;
        border-radius:10px;
        padding:12px;
        white-space:pre-wrap;
        line-height:1.5;
        font-size:12.5px;
      }

      .memory-timeline{
        margin-top:14px;
        background:#031019;
        border:1px solid rgba(255,255,255,.08);
        border-radius:10px;
        padding:10px;
        max-height:160px;
        overflow:auto;
        font-size:12px;
      }

      .memory-event{
        border-bottom:1px solid rgba(255,255,255,.05);
        padding:8px 0;
        color:#cbe3ef;
      }

      .memory-event b{
        color:#00ffc6;
      }

      .memory-row{
        display:grid;
        grid-template-columns:1fr;
        gap:12px;
        margin-top:14px;
      }
    `;

    document.head.appendChild(st);
  }

  function renderState(){
    const m = mem[sector];

    const exp=document.getElementById("tsmMemoryExposure");
    const strat=document.getElementById("tsmMemoryStrategist");

    if(exp) exp.textContent = m.exposure;
    if(strat) strat.textContent = m.strategist;
  }

  function renderNarrative(){
    const el=document.getElementById("tsmMemoryNarrative");
    if(!el) return;

    const m=mem[sector];

    el.textContent =
`PERSISTENT OPERATIONAL MEMORY · ${sector.toUpperCase()}

CURRENT EXPOSURE
${m.exposure}

STRATEGIST PRESSURE
${m.strategist}

EXECUTIVE CONTINUITY
${m.narrative}

SYSTEM BEHAVIOR
This sector now retains operational continuity across relays, escalations, ownership changes, exposure drift, and strategist pressure evolution.`;
  }

  function renderTimeline(){
    const wrap=document.getElementById("tsmMemoryTimeline");
    if(!wrap) return;

    const items=mem[sector].timeline || [];

    wrap.innerHTML =
      items.map(x=>`
        <div class="memory-event">
          <b>${x.at}</b><br>
          ${x.message}
        </div>
      `).join("");
  }

  function renderOwners(){
    const el=document.getElementById("tsmMemoryOwners");
    if(!el) return;

    const owners = mem[sector].owners || [];

    el.innerHTML =
      owners.map(x=>`
        <div class="memory-event">
          <b>${x.at}</b><br>
          ${x.owner}
        </div>
      `).join("");
  }

  function renderRelays(){
    const el=document.getElementById("tsmMemoryRelays");
    if(!el) return;

    const relays = mem[sector].relays || [];

    el.innerHTML =
      relays.map(x=>`
        <div class="memory-event">
          <b>${x.at}</b><br>
          ${x.relay}
        </div>
      `).join("");
  }

  function mutateNarrative(){
    const n = [
      "Cross-sector escalation pressure continues to evolve across owner lanes and strategist relays.",
      "Operational exposure remains active due to unresolved workflow dependencies.",
      "Strategist continuity is tracking unresolved escalations and executive pressure.",
      "Workflow stabilization efforts reduced operational exposure but strategist monitoring remains active.",
      "Operational mesh continuity detected growing dependency between queues and escalation posture."
    ];

    const pick=n[Math.floor(Math.random()*n.length)];

    window.TSMMemory.narrative(pick);
    window.TSMMemory.timeline("Executive narrative evolved from strategist continuity.");
  }

  function build(){
    if(document.getElementById("tsm-phase3-memory")) return;

    css();

    const box=document.createElement("section");

    box.id="tsm-phase3-memory";
    box.className="tsm-memory-layer";

    box.innerHTML=`
      <h2>Phase 3 · Persistent Operational Memory</h2>
      <div style="color:#9fb6c6">
        Relay continuity, strategist memory, operational timelines, ownership evolution, and exposure persistence across the TSM Operational Mesh.
      </div>

      <div class="memory-grid">
        <div class="memory-card">
          <small>Sector</small>
          <b>${sector.toUpperCase()}</b>
        </div>

        <div class="memory-card">
          <small>Exposure</small>
          <b id="tsmMemoryExposure">${mem[sector].exposure}</b>
        </div>

        <div class="memory-card">
          <small>Strategist Pressure</small>
          <b id="tsmMemoryStrategist">${mem[sector].strategist}</b>
        </div>

        <div class="memory-card">
          <small>Timeline State</small>
          <b>LIVE</b>
        </div>
      </div>

      <div class="memory-actions">
        <button id="memEscalate">Escalate Pressure</button>
        <button id="memAssign" class="alt">Assign Owner</button>
        <button id="memNarrative" class="alt">Regenerate Narrative</button>
        <button id="memStabilize" class="alt">Stabilize Workflow</button>
      </div>

      <div id="tsmMemoryNarrative" class="memory-panel"></div>

      <div class="memory-row">

        <div>
          <h3 style="color:#00ffc6">Operational Timeline</h3>
          <div id="tsmMemoryTimeline" class="memory-timeline"></div>
        </div>

        <div>

          <h3 style="color:#00ffc6">Strategist Relay Memory</h3>
          <div id="tsmMemoryRelays" class="memory-timeline"></div>

          <h3 style="color:#00ffc6;margin-top:18px">Owner Evolution</h3>
          <div id="tsmMemoryOwners" class="memory-timeline"></div>

        </div>

      </div>
    `;

    document.body.appendChild(box);

    if(!document.getElementById("tsm-memory-tab")){
      const tab=document.createElement("div");
      tab.id="tsm-memory-tab";
      tab.textContent="🧠 MEMORY";
      tab.onclick=()=>box.classList.toggle("open");
      document.body.appendChild(tab);
    }

    renderState();
    renderNarrative();
    renderTimeline();
    renderOwners();
    renderRelays();

    document.getElementById("memEscalate").onclick=()=>{
      window.TSMMemory.strategist("CRITICAL");
      window.TSMMemory.exposure("$" + (Math.floor(Math.random()*400)+150) + "K");
      window.TSMMemory.timeline("Operational escalation triggered from unresolved workflow pressure.");
      window.TSMMemory.relay("Strategist relay escalated cross-sector pressure.");
      mutateNarrative();
    };

    document.getElementById("memAssign").onclick=()=>{
      const owners=[
        "Executive Operations",
        "Finance Controller",
        "Revenue Integrity",
        "Compliance Lead",
        "Legal Ops",
        "Project Engineering",
        "Audit Command"
      ];

      const pick=owners[Math.floor(Math.random()*owners.length)];

      window.TSMMemory.owner(pick);
      window.TSMMemory.timeline("Ownership reassigned to " + pick + ".");
    };

    document.getElementById("memNarrative").onclick=mutateNarrative;

    document.getElementById("memStabilize").onclick=()=>{
      window.TSMMemory.strategist("STABLE");
      window.TSMMemory.exposure("Reduced");
      window.TSMMemory.timeline("Workflow stabilized and escalation posture reduced.");
      window.TSMMemory.relay("Strategist approved stabilization posture.");
      mutateNarrative();
    };

    if((mem[sector].timeline || []).length === 0){
      window.TSMMemory.timeline("Operational memory initialized.");
      window.TSMMemory.timeline("Sector continuity tracking enabled.");
      window.TSMMemory.relay("Strategist continuity engine activated.");
      window.TSMMemory.owner("TSM Operational Mesh");
    }
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",build);
  } else {
    build();
  }

})();

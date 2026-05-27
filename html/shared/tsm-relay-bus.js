(function(){
  if(window.__TSM_RELAY_BUS_V1__) return;
  window.__TSM_RELAY_BUS_V1__ = true;

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

  const RELAYS = {
    construction: {
      event:"Permit delay detected",
      exposure:"$182K",
      owner:"Project Engineer",
      relays:["legal","finops","executive"],
      narrative:"Permit escalation may impact milestone billing, schedule certainty, and project cash timing.",
      mutations:[
        "Legal notified for zoning / permit risk review",
        "FinOps exposure updated for delayed billing",
        "Executive narrative rewritten for project cash timing"
      ]
    },
    healthcare: {
      event:"Denial queue exceeds SLA",
      exposure:"$189K",
      owner:"Revenue Integrity",
      relays:["insurance","finops","executive"],
      narrative:"Growing payer delay exposure is impacting reimbursement timing and operational throughput.",
      mutations:[
        "Insurance node updated with payer risk",
        "FinOps AR exposure increased",
        "HC Strategist escalated reimbursement risk"
      ]
    },
    finops: {
      event:"Vendor variance detected",
      exposure:"$480K",
      owner:"Controller Ops",
      relays:["compliance","legal","executive"],
      narrative:"Vendor variance escalation may impact close-readiness, audit posture, and cash timing.",
      mutations:[
        "Compliance risk raised",
        "Legal agreement review triggered",
        "Audit queue updated"
      ]
    },
    legal: {
      event:"Filing / contract risk detected",
      exposure:"$22.5K",
      owner:"Legal Ops",
      relays:["executive","finops","compliance"],
      narrative:"Legal dependency may impact client exposure, deadline posture, and financial recognition.",
      mutations:[
        "Executive brief updated",
        "FinOps unbilled WIP reviewed",
        "Compliance evidence requested"
      ]
    },
    insurance: {
      event:"Payer / DME qualification risk detected",
      exposure:"$157K",
      owner:"Insurance Ops",
      relays:["healthcare","finops","executive"],
      narrative:"Insurance qualification pressure may impact reimbursement timing and revenue conversion.",
      mutations:[
        "Healthcare payer lane updated",
        "FinOps AR forecast adjusted",
        "Executive conversion narrative generated"
      ]
    },
    tax: {
      event:"Tax filing packet incomplete",
      exposure:"$39K",
      owner:"Tax Reviewer",
      relays:["finops","legal","executive"],
      narrative:"Tax document gap may impact filing readiness, notice exposure, and compliance timing.",
      mutations:[
        "FinOps document evidence requested",
        "Legal notice risk checked",
        "Executive filing-readiness summary generated"
      ]
    },
    rrd: {
      event:"Charge-off risk escalating",
      exposure:"$220K",
      owner:"Recovery Lead",
      relays:["legal","finops","executive"],
      narrative:"Recovery delay may increase charge-off probability and legal referral exposure.",
      mutations:[
        "Legal referral lane updated",
        "FinOps recovery forecast adjusted",
        "Executive recovery narrative generated"
      ]
    },
    executive: {
      event:"Cross-sector operating signal detected",
      exposure:"Active",
      owner:"TSM Strategist",
      relays:["finops","legal","operations"],
      narrative:"Operational pressure detected across queues, owner lanes, evidence gaps, and escalation posture.",
      mutations:[
        "Sector relay activated",
        "Owner lane reassigned",
        "Executive summary refreshed"
      ]
    }
  };

  const cfg = RELAYS[sector] || RELAYS.executive;

  window.TSMRelayBus = window.TSMRelayBus || {
    events: [],
    publish(event){
      this.events.unshift({...event, at:new Date().toLocaleTimeString()});
      window.dispatchEvent(new CustomEvent("tsm:relay", {detail:event}));
    },
    subscribe(fn){
      window.addEventListener("tsm:relay", e => fn(e.detail));
    }
  };

  function css(){
    if(document.getElementById("tsm-relay-css")) return;
    const st=document.createElement("style");
    st.id="tsm-relay-css";
    st.textContent=`
      .tsm-relay-mesh{max-width:1280px;margin:22px auto;padding:18px;background:rgba(5,12,20,.97);border:1px solid rgba(0,255,198,.18);border-radius:18px;color:#e8f7ff;font-family:Inter,system-ui,Arial;position:relative;z-index:25}
      .tsm-relay-mesh h2{margin:0;color:#00ffc6;font-size:28px}
      .tsm-relay-mesh p{color:#9fb8c8;line-height:1.55}
      .relay-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:14px 0}
      .relay-card{background:#06131c;border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:14px}
      .relay-card small{display:block;color:#7f9aaa;letter-spacing:.14em;text-transform:uppercase;font-size:10px}
      .relay-card b{display:block;color:#00ffc6;margin-top:8px;font-size:18px}
      .relay-actions{display:flex;gap:10px;flex-wrap:wrap;margin:14px 0}
      .relay-actions button{background:#00ffc6;color:#001;border:0;border-radius:999px;padding:11px 15px;font-weight:900;cursor:pointer}
      .relay-actions button.alt{background:#0b1722;color:#dff7ff;border:1px solid rgba(255,255,255,.16)}
      .relay-output{margin-top:14px;white-space:pre-wrap;background:#020913;border-left:3px solid #00ffc6;border-radius:12px;padding:15px;color:#dff7ff;line-height:1.55}
      .relay-flow{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
      .relay-step{border:1px solid rgba(0,255,198,.22);border-radius:999px;padding:8px 11px;color:#a8c6d6;font-size:12px}
      .relay-step.active{background:#00ffc6;color:#001;font-weight:900}
      .relay-log{margin-top:12px;background:#031018;border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:12px;max-height:170px;overflow:auto}
      .relay-log div{padding:7px 0;border-bottom:1px solid rgba(255,255,255,.06);color:#bfd8e5;font-size:13px}
      @media(max-width:900px){.relay-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(st);
  }

  function activate(n){
    document.querySelectorAll(".relay-step").forEach((x,i)=>x.classList.toggle("active", i <= n));
  }

  function writeOutput(mode){
    const out=document.getElementById("tsm-relay-output");
    if(!out) return;
    out.textContent =
`${mode.toUpperCase()} · PHASE 2 TRUE MESH RELAY

TRIGGER EVENT
${cfg.event}

CURRENT EXPOSURE
${cfg.exposure}

OWNER LANE
${cfg.owner}

CROSS-SECTOR RELAYS
${cfg.relays.map(x=>"→ "+x.toUpperCase()).join("\n")}

MESH MUTATIONS
${cfg.mutations.map((x,i)=>(i+1)+". "+x).join("\n")}

EXECUTIVE NARRATIVE
${cfg.narrative}

BEST NEXT ACTION
Review relay impact, confirm owner response, and approve strategist next-course action.`;
  }

  function log(msg){
    const l=document.getElementById("tsm-relay-log");
    if(!l) return;
    const div=document.createElement("div");
    div.textContent = new Date().toLocaleTimeString() + " · " + msg;
    l.prepend(div);
    while(l.children.length > 8) l.removeChild(l.lastChild);
  }

  function publishRelay(){
    window.TSMRelayBus.publish({
      sector,
      event:cfg.event,
      exposure:cfg.exposure,
      owner:cfg.owner,
      relays:cfg.relays,
      narrative:cfg.narrative
    });
    activate(4);
    writeOutput("Relay Published");
    log("Relay published → " + cfg.relays.join(", "));
  }

  function simulateInbound(){
    const msg = "Inbound relay received from " + (cfg.relays[0] || "strategist") + " → executive narrative mutated";
    activate(3);
    log(msg);
    writeOutput("Inbound Relay");
  }

  function build(){
    if(document.getElementById("tsm-phase2-relay-mesh")) return;
    css();

    const box=document.createElement("section");
    box.id="tsm-phase2-relay-mesh";
    box.className="tsm-relay-mesh";
    box.innerHTML=`
      <h2>Phase 2 · True Mesh Relays</h2>
      <p>Cross-operational intelligence: one event mutates multiple sectors, owner lanes, exposures, strategist relays, and executive narratives.</p>

      <div class="relay-grid">
        <div class="relay-card"><small>Current Sector</small><b>${sector.toUpperCase()}</b></div>
        <div class="relay-card"><small>Trigger Event</small><b>${cfg.event}</b></div>
        <div class="relay-card"><small>Exposure</small><b id="relayExposure">${cfg.exposure}</b></div>
        <div class="relay-card"><small>Primary Owner</small><b id="relayOwner">${cfg.owner}</b></div>
      </div>

      <div class="relay-actions">
        <button id="relayPublish">Publish Mesh Relay</button>
        <button id="relayInbound" class="alt">Simulate Inbound Relay</button>
        <button id="relayExec" class="alt">Rewrite Executive Narrative</button>
        <button id="relayClear" class="alt">Stabilize Workflow</button>
      </div>

      <div class="relay-flow">
        <span class="relay-step active">Event</span>
        <span class="relay-step">Sector Mutation</span>
        <span class="relay-step">Owner Update</span>
        <span class="relay-step">Strategist Relay</span>
        <span class="relay-step">Executive Action</span>
      </div>

      <div id="tsm-relay-output" class="relay-output">Relay mesh ready. Publish an event to trigger cross-sector operational intelligence.</div>
      <div id="tsm-relay-log" class="relay-log"><div>Relay log initialized.</div></div>
    `;

    (document.querySelector("main") || document.body).appendChild(box);

    document.getElementById("relayPublish").onclick=publishRelay;
    document.getElementById("relayInbound").onclick=simulateInbound;
    document.getElementById("relayExec").onclick=()=>{activate(4);writeOutput("Executive Narrative Rewrite");log("Executive narrative rewritten from mesh signal");};
    document.getElementById("relayClear").onclick=()=>{document.getElementById("relayExposure").textContent="Reduced";activate(4);writeOutput("Workflow Stabilized");log("Workflow stabilized; exposure reduced");};

    window.TSMRelayBus.subscribe(evt=>{
      log("Mesh event heard: " + evt.event);
    });

    setTimeout(()=>writeOutput("Live Baseline"),300);
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",build);
  else build();
// Auto-load HC mission relay
  (function() {
    if (document.querySelector('script[src*="hc-mission-relay"]')) return;
    const s = document.createElement('script');
    s.src = '/html/healthcare/js/hc-mission-relay.js?v=relay1';
    document.head.appendChild(s);
  })();

})();

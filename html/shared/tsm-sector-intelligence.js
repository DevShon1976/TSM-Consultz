(function(){
  if(window.__TSM_SECTOR_INTELLIGENCE__) return;
  window.__TSM_SECTOR_INTELLIGENCE__ = true;

  const path = location.pathname.toLowerCase();

  function detectSector(){
    if(path.includes("healthcare") || path.includes("hc-")) return "healthcare";
    if(path.includes("finops") || path.includes("financial")) return "finops";
    if(path.includes("construction")) return "construction";
    if(path.includes("insurance") || path.includes("az-ins")) return "insurance";
    if(path.includes("legal")) return "legal";
    if(path.includes("tax")) return "tax";
    if(path.includes("rrd") || path.includes("realty")) return "rrd";
    if(path.includes("music")) return "music";
    return "executive";
  }

  const sector = detectSector();

  const INTELLIGENCE = {
    healthcare:{
      executive:"HC Strategist",
      role:"Clinical + operational synthesis",
      tone:"Office Manager / Revenue Cycle / Executive Healthcare",
      owns:["denials","prior auth","coding drift","revenue integrity","staffing pressure","compliance posture"],
      relay:"HC Strategist",
      action:"Prioritize care-to-cash blockers and route unresolved operational risk."
    },
    finops:{
      executive:"Controller",
      role:"Financial command authority",
      tone:"Controller / CFO / Audit Readiness",
      owns:["AP aging","AR exposure","reconciliation variance","close blockers","audit evidence","cash timing"],
      relay:"Controller",
      action:"Protect close readiness, reduce variance, and assign financial accountability."
    },
    construction:{
      executive:"Construction Strategist",
      role:"Project execution + WIP exposure synthesis",
      tone:"PM / Project Controller / Executive Construction",
      owns:["permits","retainage","change orders","lien waivers","safety exposure","subcontractor risk"],
      relay:"Construction Strategist",
      action:"Resolve project blockers, protect billing timing, and escalate WIP exposure."
    },
    insurance:{
      executive:"Payer Strategist",
      role:"Payer, claims, DME, qualification, and revenue conversion intelligence",
      tone:"Insurance Ops / Revenue Integrity / Compliance",
      owns:["payer qualification","DME opportunity","claims exposure","appeals","policy gaps","conversion risk"],
      relay:"Payer Strategist",
      action:"Route payer risk, qualify opportunity, and protect reimbursement conversion."
    },
    legal:{
      executive:"Legal Command",
      role:"Matter, filing, discovery, and WIP risk command",
      tone:"Legal Ops / Managing Partner / Client Status",
      owns:["matter intake","filing deadlines","contract risk","discovery gaps","unbilled WIP","client exposure"],
      relay:"Legal Command",
      action:"Protect deadlines, preserve evidence, and prepare client-ready legal posture."
    },
    tax:{
      executive:"Tax Director",
      role:"Filing readiness, tax notice, document, and compliance command",
      tone:"Tax Manager / Reviewer / Compliance",
      owns:["missing docs","W-9 gaps","1099 exposure","IRS notices","filing readiness","multi-entity tax posture"],
      relay:"Tax Director",
      action:"Protect filing windows, close document gaps, and reduce notice exposure."
    },
    rrd:{
      executive:"Recovery Director",
      role:"Recovery, receivables, charge-off, and legal referral command",
      tone:"Collections / Recovery / Executive Portfolio",
      owns:["charge-off risk","recovery scoring","payment disputes","legal referral","owner assignment","portfolio exposure"],
      relay:"Recovery Director",
      action:"Prioritize recovery lanes, reduce charge-off probability, and assign owner action."
    },
    music:{
      executive:"ZAY Producer Engine",
      role:"Creative session orchestration",
      tone:"Studio Producer / Song Structure / Artist Direction",
      owns:["hook quality","verse sequencing","cadence","bounce","commercial polish","session flow"],
      relay:"ZAY",
      action:"Guide hook, verse, bridge, and polish decisions through producer-mode execution."
    },
    executive:{
      executive:"TSM Strategist",
      role:"Cross-sector operational command",
      tone:"Executive Mesh / Operating System",
      owns:["global pressure","sector relays","executive posture","workflow dependencies","strategist memory"],
      relay:"TSM Strategist",
      action:"Coordinate cross-sector pressure into executive next-course action."
    }
  };

  const cfg = INTELLIGENCE[sector] || INTELLIGENCE.executive;

  window.TSMSectorIntelligence = {
    sector,
    cfg,
    label(){ return cfg.executive; },
    action(){ return cfg.action; },
    relay(){ return cfg.relay; },
    owns(){ return cfg.owns; },
    summary(){
      return `${cfg.executive} active for ${sector.toUpperCase()}.
Role: ${cfg.role}
Tone: ${cfg.tone}
Owns: ${cfg.owns.join(", ")}
Best action: ${cfg.action}`;
    }
  };

  function css(){
    if(document.getElementById("tsm-sector-intel-css")) return;
    const st=document.createElement("style");
    st.id="tsm-sector-intel-css";
    st.textContent=`
      .tsm-sector-intel{
        max-width:1280px;margin:22px auto;padding:18px;
        background:rgba(4,10,18,.98);
        border:1px solid rgba(0,255,198,.16);
        border-radius:18px;color:#e8f7ff;
        font-family:Inter,system-ui,Arial;position:relative;z-index:45
      }
      .tsm-sector-intel h2{margin:0;color:#00ffc6;font-size:28px}
      .tsm-sector-intel p{color:#9fb8c8;line-height:1.55}
      .si-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:14px 0}
      .si-card{background:#06131c;border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:14px}
      .si-card small{display:block;color:#7f9aaa;letter-spacing:.14em;text-transform:uppercase;font-size:10px}
      .si-card b{display:block;color:#00ffc6;margin-top:8px;font-size:18px}
      .si-output{white-space:pre-wrap;background:#020913;border-left:3px solid #00ffc6;border-radius:12px;padding:15px;color:#dff7ff;line-height:1.55}
      @media(max-width:900px){.si-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(st);
  }

  function build(){
    if(document.getElementById("tsm-sector-intelligence")) return;
    css();

    const box=document.createElement("section");
    box.id="tsm-sector-intelligence";
    box.className="tsm-sector-intel";
    box.innerHTML=`
      <h2>${cfg.executive}</h2>
      <p>${cfg.role}. This gives the shared Operational Mesh a sector-specific executive persona instead of one generic strategist identity.</p>

      <div class="si-grid">
        <div class="si-card"><small>Sector</small><b>${sector.toUpperCase()}</b></div>
        <div class="si-card"><small>Executive Intelligence</small><b>${cfg.executive}</b></div>
        <div class="si-card"><small>Relay Authority</small><b>${cfg.relay}</b></div>
        <div class="si-card"><small>Operating Tone</small><b>${cfg.tone}</b></div>
      </div>

      <div class="si-output">${window.TSMSectorIntelligence.summary()}</div>
    `;

    const anchor=document.querySelector("main") || document.body;
    anchor.appendChild(box);
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",build);
  else build();
})();

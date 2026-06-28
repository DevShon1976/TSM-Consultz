(function(){
  if(window.__TSM_GLOBAL_COMMAND_V4__) return;
  window.__TSM_GLOBAL_COMMAND_V4__ = true;

  const KEY = "TSM_GLOBAL_COMMAND_STATE_V4";
  const path = location.pathname.toLowerCase();

  function sector(){
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

  const current = sector();

  const DEFAULTS = {
    construction:{exposure:182, pressure:"HIGH", owner:"Project Engineer", event:"Permit / retainage pressure"},
    healthcare:{exposure:189, pressure:"HIGH", owner:"Revenue Integrity", event:"Denial / prior-auth pressure"},
    insurance:{exposure:157, pressure:"MEDIUM", owner:"Insurance Ops", event:"Payer / DME qualification pressure"},
    finops:{exposure:480, pressure:"HIGH", owner:"Controller Ops", event:"AP / reconciliation pressure"},
    legal:{exposure:22.5, pressure:"MEDIUM", owner:"Legal Ops", event:"Matter / filing deadline pressure"},
    tax:{exposure:39, pressure:"LOW", owner:"Tax Reviewer", event:"Filing readiness pressure"},
    rrd:{exposure:220, pressure:"HIGH", owner:"Recovery Lead", event:"Charge-off recovery pressure"},
    executive:{exposure:0, pressure:"ACTIVE", owner:"TSM Strategist", event:"Cross-sector operating signal"}
  };

  function load(){
    try { return JSON.parse(localStorage.getItem(KEY) || "{}"); }
    catch(e){ return {}; }
  }

  function save(s){ localStorage.setItem(KEY, JSON.stringify(s)); }

  const state = load();

  Object.keys(DEFAULTS).forEach(k=>{
    if(!state[k]){
      state[k] = {
        ...DEFAULTS[k],
        stage:"Monitoring",
        relays:[],
        timeline:[],
        lastUpdate:new Date().toLocaleTimeString()
      };
    }
  });

  save(state);

  function pressureRank(p){
    return p==="CRITICAL"?4:p==="HIGH"?3:p==="MEDIUM"?2:p==="LOW"?1:0;
  }

  function globalPressure(){
    const vals = Object.values(state).map(x=>pressureRank(x.pressure));
    const max = Math.max.apply(null, vals);
    return max>=4?"CRITICAL":max>=3?"HIGH":max>=2?"MEDIUM":"STABLE";
  }

  function totalExposure(){
    return Object.entries(state)
      .filter(([k])=>k!=="executive")
      .reduce((sum,[,v])=>sum + (Number(v.exposure)||0),0);
  }

  function publish(source, targets, msg){
    targets.forEach(t=>{
      if(!state[t]) return;
      state[t].relays.unshift({
        at:new Date().toLocaleTimeString(),
        from:source,
        message:msg
      });
      state[t].timeline.unshift({
        at:new Date().toLocaleTimeString(),
        message:"Inbound relay from " + source + ": " + msg
      });
      state[t].pressure = pressureRank(state[t].pressure) >= 3 ? state[t].pressure : "HIGH";
      state[t].stage = "Relay Review";
      state[t].lastUpdate = new Date().toLocaleTimeString();
    });

    state[source].timeline.unshift({
      at:new Date().toLocaleTimeString(),
      message:"Published relay to " + targets.join(", ") + ": " + msg
    });
    state[source].stage = "Escalated";
    state[source].pressure = "CRITICAL";
    state[source].lastUpdate = new Date().toLocaleTimeString();

    save(state);
    render();
  }

  function stabilize(){
    state[current].pressure = "STABLE";
    state[current].stage = "Stabilized";
    state[current].exposure = Math.max(0, Math.round((Number(state[current].exposure)||0) * .62));
    state[current].timeline.unshift({
      at:new Date().toLocaleTimeString(),
      message:"Workflow stabilized and exposure reduced."
    });
    state[current].lastUpdate = new Date().toLocaleTimeString();
    save(state);
    render();
  }

  function css(){
    if(document.getElementById("tsm-global-command-css")) return;
    const st = document.createElement("style");
    st.id = "tsm-global-command-css";
    st.textContent = `
      .tsm-global-command{max-width:1280px;margin:26px auto;padding:18px;background:rgba(4,10,18,.98);border:1px solid rgba(0,255,198,.16);border-radius:18px;color:#e8f7ff;font-family:Inter,system-ui,Arial;position:relative;z-index:30}
      .tsm-global-command h2{margin:0;color:#00ffc6;font-size:30px}
      .tsm-global-command p{color:#9fb8c8;line-height:1.55}
      .gcmd-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:14px 0}
      .gcmd-card{background:#06131c;border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:14px}
      .gcmd-card small{display:block;color:#7f9aaa;letter-spacing:.14em;text-transform:uppercase;font-size:10px}
      .gcmd-card b{display:block;color:#00ffc6;margin-top:8px;font-size:22px}
      .gcmd-sector-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-top:14px}
      .gcmd-sector{background:#061018;border:1px solid rgba(255,255,255,.09);border-radius:12px;padding:14px}
      .gcmd-sector h3{margin:0 0 8px;color:#00ffc6;font-size:16px;text-transform:uppercase}
      .gcmd-sector p{margin:4px 0;font-size:13px;color:#bcd2df}
      .gcmd-actions{display:flex;gap:10px;flex-wrap:wrap;margin:14px 0}
      .gcmd-actions button{background:#00ffc6;color:#001;border:0;border-radius:999px;padding:11px 15px;font-weight:900;cursor:pointer}
      .gcmd-actions button.alt{background:#0b1722;color:#dff7ff;border:1px solid rgba(255,255,255,.16)}
      .gcmd-output{margin-top:14px;white-space:pre-wrap;background:#020913;border-left:3px solid #00ffc6;border-radius:12px;padding:15px;color:#dff7ff;line-height:1.55}
      @media(max-width:900px){.gcmd-grid,.gcmd-sector-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(st);
  }

  function render(){
    const root = document.getElementById("tsm-global-command-root");
    if(!root) return;

    const sectors = ["construction","healthcare","insurance","finops","legal","tax","rrd"];
    const currentState = state[current] || state.executive;

    root.innerHTML = `
      <h2>Phase 4 · Global Executive Command Layer</h2>
      <p>Distributed operational awareness across the full TSM Operational Mesh. One sector event can mutate other sectors, update exposure, change strategist pressure, and rewrite executive posture.</p>

      <div class="gcmd-grid">
        <div class="gcmd-card"><small>Current Sector</small><b>${current.toUpperCase()}</b></div>
        <div class="gcmd-card"><small>Global Exposure</small><b>$${totalExposure()}K</b></div>
        <div class="gcmd-card"><small>Global Pressure</small><b>${globalPressure()}</b></div>
        <div class="gcmd-card"><small>Current Stage</small><b>${currentState.stage}</b></div>
      </div>

      <div class="gcmd-actions">
        <button id="gcmdPublish">Publish Cross-Sector Relay</button>
        <button id="gcmdMutate" class="alt">Simulate Dependency Mutation</button>
        <button id="gcmdNarrative" class="alt">Rewrite Global Narrative</button>
        <button id="gcmdStable" class="alt">Stabilize Current Sector</button>
      </div>

      <div class="gcmd-output" id="gcmdOutput">
GLOBAL EXECUTIVE POSTURE

Pressure: ${globalPressure()}
Exposure: $${totalExposure()}K

Current sector ${current.toUpperCase()} is in ${currentState.stage} stage.
Primary event: ${currentState.event}
Owner lane: ${currentState.owner}

Executive interpretation:
TSM is monitoring cross-sector operational dependencies and surfacing where workflow pressure, exposure, ownership, and escalation posture require leadership action.
      </div>

      <div class="gcmd-sector-grid">
        ${sectors.map(k=>{
          const s = state[k];
          const lastRelay = (s.relays && s.relays[0]) ? s.relays[0].message : "No inbound relay";
          return `
            <div class="gcmd-sector">
              <h3>${k}</h3>
              <p><b>Exposure:</b> $${s.exposure}K</p>
              <p><b>Pressure:</b> ${s.pressure}</p>
              <p><b>Owner:</b> ${s.owner}</p>
              <p><b>Stage:</b> ${s.stage}</p>
              <p><b>Last Relay:</b> ${lastRelay}</p>
            </div>
          `;
        }).join("")}
      </div>
    `;

    document.getElementById("gcmdPublish").onclick = ()=>{
      const map = {
        construction:["legal","finops"],
        healthcare:["insurance","finops"],
        finops:["legal","tax"],
        legal:["finops","executive"],
        insurance:["healthcare","finops"],
        tax:["legal","finops"],
        rrd:["legal","finops"],
        executive:["construction","healthcare","finops"]
      };
      publish(current, map[current] || ["executive"], state[current].event);
    };

    document.getElementById("gcmdMutate").onclick = ()=>{
      Object.keys(state).forEach(k=>{
        if(k!==current && k!=="executive"){
          state[k].stage = "Dependency Watch";
          state[k].timeline.unshift({
            at:new Date().toLocaleTimeString(),
            message:"Dependency mutation from " + current
          });
        }
      });
      state[current].pressure = "CRITICAL";
      save(state);
      render();
    };

    document.getElementById("gcmdNarrative").onclick = ()=>{
      document.getElementById("gcmdOutput").textContent =
`GLOBAL NARRATIVE REWRITE

The TSM Operational Mesh is detecting connected operational pressure across ${current.toUpperCase()} and adjacent sectors.

Current global exposure: $${totalExposure()}K.
Global pressure: ${globalPressure()}.

Leadership interpretation:
The system is no longer treating workflow issues as isolated page events. It is now modeling cross-sector dependency, exposure movement, strategist pressure, and executive readiness across the operating mesh.`;
    };

    document.getElementById("gcmdStable").onclick = stabilize;
  }

  function build(){
    if(document.getElementById("tsm-global-command")) return;
    css();

    const box = document.createElement("section");
    box.id = "tsm-global-command";
    box.className = "tsm-global-command";
    box.innerHTML = `<div id="tsm-global-command-root"></div>`;

    (document.querySelector("main") || document.body).appendChild(box);
    render();
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", build);
  else build();
})();

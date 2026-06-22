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

      function nowISO(){
    return new Date().toISOString();
  }

  function ensureSector(){
    if(!mem[sector]){
      mem[sector] = {
        exposure: DEFAULTS[sector]?.exposure || "ACTIVE",
        strategist: DEFAULTS[sector]?.strategist || "MEDIUM",
        narrative: DEFAULTS[sector]?.narrative || "Operational pressure detected.",
        timeline: [],
        owners: [],
        relays: [],
        pressure: 50,
        anomalies: [],
        cases: {},
        fieldMemory: {},
        suggestedApps: [],
        executiveQueue: [],
        stats: {
          anomaliesDetected: 0,
          anomaliesResolved: 0,
          autoPopulatedFields: 0,
          relayCount: 0
        }
      };
    }
    return mem[sector];
  }

  function makeFieldKey(entityType, entityId, field){
    return `${String(entityType || "unknown").toLowerCase()}:${String(entityId || "unknown")}:${String(field || "").trim()}`;
  }

  function getCaseKey(entityType, entityId){
    return `${String(entityType || "case").toUpperCase()}:${String(entityId || "UNKNOWN")}`;
  }

  function ensureCase(entityType, entityId, extra = {}){
    const s = ensureSector();
    const caseKey = getCaseKey(entityType, entityId);

    if(!s.cases[caseKey]){
      s.cases[caseKey] = {
        caseKey,
        entityType: entityType || "case",
        entityId: entityId || "UNKNOWN",
        createdAt: nowISO(),
        lastSeenAt: nowISO(),
        fields: {},
        anomalies: [],
        relays: [],
        notes: [],
        meta: extra.meta || {}
      };
    } else {
      s.cases[caseKey].lastSeenAt = nowISO();
      if(extra.meta){
        s.cases[caseKey].meta = {
          ...(s.cases[caseKey].meta || {}),
          ...extra.meta
        };
      }
    }

    return s.cases[caseKey];
  }

  window.TSMMemory = {
    get(){
      return ensureSector();
    },

    getCase(entityType, entityId){
      const s = ensureSector();
      return s.cases[getCaseKey(entityType, entityId)] || null;
    },

    timeline(msg, meta = {}){
      const s = ensureSector();

      s.timeline.unshift({
        at: new Date().toLocaleTimeString(),
        iso: nowISO(),
        message: msg,
        meta
      });

      s.timeline = s.timeline.slice(0, 50);
      saveMemory(mem);
      renderTimeline();
    },

    exposure(val){
      const s = ensureSector();
      s.exposure = val;
      saveMemory(mem);
      renderState();
    },

    strategist(val){
      const s = ensureSector();
      s.strategist = val;
      saveMemory(mem);
      renderState();
    },

    owner(val){
      const s = ensureSector();

      s.owners.unshift({
        at: new Date().toLocaleTimeString(),
        iso: nowISO(),
        owner: val
      });

      s.owners = s.owners.slice(0, 25);
      saveMemory(mem);
      renderOwners();
    },

    narrative(val){
      const s = ensureSector();
      s.narrative = val;
      saveMemory(mem);
      renderNarrative();
    },

    relay(val, meta = {}){
      const s = ensureSector();

      s.relays.unshift({
        at: new Date().toLocaleTimeString(),
        iso: nowISO(),
        relay: val,
        meta
      });

      s.relays = s.relays.slice(0, 30);
      s.stats.relayCount = (s.stats.relayCount || 0) + 1;

      saveMemory(mem);
      renderRelays();
    },

    registerAnomaly({
      entityType = "case",
      entityId = "UNKNOWN",
      anomalyCode,
      title,
      severity = "MEDIUM",
      missingFields = [],
      source = "war-room",
      detectedFrom = null,
      meta = {}
    } = {}){
      if(!anomalyCode) return null;

      const s = ensureSector();
      const caseRef = ensureCase(entityType, entityId, { meta });

      const record = {
        id: `an_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
        anomalyCode,
        title: title || anomalyCode,
        severity,
        status: "open",
        source,
        detectedFrom,
        missingFields: [...missingFields],
        createdAt: nowISO(),
        resolvedAt: null,
        resolvedBy: null,
        relayTargets: [],
        recommendedApps: [],
        meta
      };

      s.anomalies.unshift(record);
      s.anomalies = s.anomalies.slice(0, 250);

      caseRef.anomalies.unshift({
        anomalyId: record.id,
        anomalyCode,
        title: record.title,
        severity,
        status: "open",
        createdAt: record.createdAt
      });

      s.stats.anomaliesDetected = (s.stats.anomaliesDetected || 0) + 1;

      saveMemory(mem);

      window.TSMMemory.timeline(
        `Anomaly detected: ${record.title}${missingFields.length ? " | Missing: " + missingFields.join(", ") : ""}`,
        { anomalyCode, entityType, entityId }
      );

      return record;
    },

    rememberField({
      entityType = "case",
      entityId = "UNKNOWN",
      field,
      value,
      source = "manual",
      confidence = 1,
      anomalyCode = null,
      meta = {}
    } = {}){
      if(!field || value === undefined || value === null || value === "") return null;

      const s = ensureSector();
      const caseRef = ensureCase(entityType, entityId, { meta });
      const key = makeFieldKey(entityType, entityId, field);

      const payload = {
        value,
        source,
        confidence,
        updatedAt: nowISO(),
        anomalyCode,
        meta
      };

      s.fieldMemory[key] = payload;
      caseRef.fields[field] = payload;

      saveMemory(mem);
      return payload;
    },

    lookupField({
      entityType = "case",
      entityId = "UNKNOWN",
      field
    } = {}){
      if(!field) return null;

      const s = ensureSector();
      const key = makeFieldKey(entityType, entityId, field);
      const result = s.fieldMemory[key] || null;

      if(result){
        s.stats.autoPopulatedFields = (s.stats.autoPopulatedFields || 0) + 1;
        saveMemory(mem);
      }

      return result;
    },

    resolveAnomaly({
      anomalyId = null,
      anomalyCode = null,
      entityType = "case",
      entityId = "UNKNOWN",
      resolvedBy = "unknown",
      values = {},
      status = "resolved",
      relay = null
    } = {}){
      const s = ensureSector();
      const caseRef = ensureCase(entityType, entityId);

      let target = null;

      if(anomalyId){
        target = s.anomalies.find(a => a.id === anomalyId) || null;
      } else if(anomalyCode){
        target = s.anomalies.find(a =>
          a.anomalyCode === anomalyCode &&
          a.status !== "resolved"
        ) || null;
      }

      if(target){
        target.status = status;
        target.resolvedAt = nowISO();
        target.resolvedBy = resolvedBy;
      }

      caseRef.anomalies = (caseRef.anomalies || []).map(a => {
        if(
          (anomalyId && a.anomalyId === anomalyId) ||
          (!anomalyId && anomalyCode && a.anomalyCode === anomalyCode)
        ){
          return {
            ...a,
            status,
            resolvedBy,
            resolvedAt: nowISO()
          };
        }
        return a;
      });

      Object.entries(values || {}).forEach(([field, value]) => {
        window.TSMMemory.rememberField({
          entityType,
          entityId,
          field,
          value,
          source: resolvedBy,
          confidence: 0.95,
          anomalyCode: target?.anomalyCode || anomalyCode
        });
      });

      s.stats.anomaliesResolved = (s.stats.anomaliesResolved || 0) + 1;

      saveMemory(mem);

      window.TSMMemory.timeline(
        `Anomaly resolved: ${(target?.title || anomalyCode || "unknown")} by ${resolvedBy}`,
        { anomalyId, anomalyCode, entityType, entityId }
      );

      if(relay){
        window.TSMMemory.relay(relay, {
          anomalyId: target?.id || anomalyId || null,
          anomalyCode: target?.anomalyCode || anomalyCode || null,
          entityType,
          entityId
        });
      }

      return target;
    },

    getSuggestedAppPayload({
      sectorName = sector,
      anomalyCode,
      entityType = "case",
      entityId = "UNKNOWN"
    } = {}){
      const intelligence =
        window.TSMSectorIntelligence?.[sectorName]?.[anomalyCode] || null;

      if(!intelligence) return null;

      const requiredFields = intelligence.requiredFields || [];
      const recoveredFields = {};
      const missingStill = [];

      requiredFields.forEach(field => {
        const remembered = window.TSMMemory.lookupField({
          entityType,
          entityId,
          field
        });

        if(remembered && remembered.value !== undefined && remembered.value !== null && remembered.value !== ""){
          recoveredFields[field] = remembered.value;
        } else {
          missingStill.push(field);
        }
      });

      return {
        anomalyCode,
        owner: intelligence.owner || null,
        pressure: intelligence.pressure || "MEDIUM",
        recommendedApps: intelligence.recommendedApps || [],
        recommendedActions: intelligence.recommendedActions || [],
        relayTargets: intelligence.relayTargets || [],
        requiredFields,
        recoveredFields,
        missingStill,
        autoPopulateReady: Object.keys(recoveredFields).length > 0
      };
    },

    queueExecutiveRelay({
      type = "strategist",
      title,
      summary,
      sectorName = sector,
      anomalyCode = null,
      entityType = "case",
      entityId = "UNKNOWN",
      exposure = null,
      owner = null
    } = {}){
      const s = ensureSector();

      const item = {
        id: `relay_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
        type,
        title: title || "Executive relay",
        summary: summary || "",
        sector: sectorName,
        anomalyCode,
        entityType,
        entityId,
        exposure,
        owner,
        createdAt: nowISO(),
        status: "queued"
      };

      s.executiveQueue.unshift(item);
      s.executiveQueue = s.executiveQueue.slice(0, 100);

      saveMemory(mem);

      window.TSMMemory.relay(
        `${type.toUpperCase()} relay queued${title ? ": " + title : ""}`,
        { anomalyCode, entityType, entityId, exposure, owner }
      );

      return item;
    }
  };

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",build);
  } else {
    build();
  }

})();

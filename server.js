const express = require('express');
const path = require('path');
const app = express();
app.use(express.json());









// =====================================================
const TSM_MESH = {
  HEALTHCARE: {
    owner: "HC Strategist",
    controller: "Healthcare Command",
    risks: ["Revenue leakage", "Denial escalation", "Patient throughput degradation", "Compliance exposure"]
  },
  CONSTRUCTION: {
    owner: "Construction Strategist",
    controller: "Construction Command",
    risks: ["Permit delays", "Schedule variance", "Cost overrun", "Supply chain disruption"]
  },
  FINANCE: {
    owner: "Financial Strategist",
    controller: "Financial Command",
    risks: ["Margin compression", "Payer variance", "Cash flow slowdown", "Revenue forecasting deviation"]
  }
};

function buildMeshBNCA(sector, context) {
  const cfg = TSM_MESH[sector] || TSM_MESH.HEALTHCARE;
  const riskLines = cfg.risks.map(r => `• ${r}`).join("\n");

  return `${sector} BNCA SYNTHESIS

TOP ISSUE
${context || "Operational degradation detected"}

WHY IT MATTERS
This issue impacts executive KPIs, operational throughput, financial performance, compliance posture, and strategist escalation readiness.

BEST NEXT ACTIONS
1. Assign accountable owner lane.
2. Resolve blockers inside SLA window.
3. Relay unresolved escalation to strategist.
4. Generate executive briefing packet.

OWNER LANE
${cfg.owner}

CONTROLLER
${cfg.controller}

ENTERPRISE RISKS
${riskLines}

HITL DECISION
Human leadership review required before enterprise escalation.

STRATEGIST RELAY
Signal routed into strategist synthesis layer for enterprise prioritization.

CONFIDENCE
94%`;
}

app.get("/api/hc/strategist-rollup", (req, res) => {
  res.json({
    ok: true,
    controller: "HC STRATEGIST",
    status: "ROLLUP ACTIVE",
    nodes_online: 11,
    executive_escalations: 3,
    bnca: "Enterprise healthcare synthesis complete",
    mesh: true,
    timestamp: new Date().toISOString()
  });
});

app.post("/api/hc/strategist-rollup", (req, res) => {
  res.json({
    ok: true,
    controller: "HC STRATEGIST",
    status: "ROLLUP ACTIVE",
    nodes_online: 11,
    executive_escalations: 3,
    bnca: "Enterprise healthcare synthesis complete",
    mesh: true,
    timestamp: new Date().toISOString()
  });
});

app.get("/api/construction/strategist-rollup", (req, res) => {
  res.json({
    ok: true,
    controller: "CONSTRUCTION STRATEGIST",
    status: "ROLLUP ACTIVE",
    nodes_online: 8,
    executive_escalations: 2,
    bnca: "Construction enterprise synthesis complete",
    mesh: true,
    timestamp: new Date().toISOString()
  });
});

app.post("/api/construction/strategist-rollup", (req, res) => {
  res.json({
    ok: true,
    controller: "CONSTRUCTION STRATEGIST",
    status: "ROLLUP ACTIVE",
    nodes_online: 8,
    executive_escalations: 2,
    bnca: "Construction enterprise synthesis complete",
    mesh: true,
    timestamp: new Date().toISOString()
  });
});


app.get("/api/finance/strategist-rollup", (req, res) => {
  res.json({
    ok: true,
    controller: "FINANCIAL STRATEGIST",
    status: "ROLLUP ACTIVE",
    nodes_online: 6,
    executive_escalations: 2,
    bnca: "Finance enterprise synthesis complete",
    mesh: true,
    timestamp: new Date().toISOString()
  });
});

console.log("TSM SOVEREIGN MESH ACTIVE");


app.use(express.static(path.join(__dirname, 'html')));
app.use('/construction-suite', express.static(path.join(__dirname, 'html', 'construction-suite')));
app.use('/finops-suite', express.static(path.join(__dirname, 'html', 'finops-suite')));
app.use('/healthcare', express.static(path.join(__dirname, 'html', 'healthcare')));
app.use(express.static(path.join(__dirname, 'public')));


// ======================================================
app.all('/api/music/structure', async (req,res) => {
  res.json({
    ok:true,
    producer:"ZAY",

    blueprint: `
INTRO — 4 bars
HOOK — 8 bars
VERSE 1 — 16 bars
BRIDGE — 8 bars
VERSE 2 — 16 bars
FINAL HOOK — 8 bars
OUTRO — 4 bars
`,

    structureText: `
INTRO — 4 bars
HOOK — 8 bars
VERSE 1 — 16 bars
BRIDGE — 8 bars
VERSE 2 — 16 bars
FINAL HOOK — 8 bars
OUTRO — 4 bars
`,


    blueprint: `
INTRO — 4 bars
HOOK — 8 bars
VERSE 1 — 16 bars
BRIDGE — 8 bars
VERSE 2 — 16 bars
FINAL HOOK — 8 bars
OUTRO — 4 bars
`,

    structureText: `
INTRO — 4 bars
HOOK — 8 bars
VERSE 1 — 16 bars
BRIDGE — 8 bars
VERSE 2 — 16 bars
FINAL HOOK — 8 bars
OUTRO — 4 bars
`,

    structure:{
      intro:"4 bars",
      hook:"8 bars",
      verse1:"16 bars",
      bridge:"8 bars",
      verse2:"16 bars",
      finalHook:"8 bars",
      outro:"4 bars"
    },

    sections:[
      "INTRO",
      "HOOK",
      "VERSE 1",
      "BRIDGE",
      "VERSE 2",
      "FINAL HOOK",
      "OUTRO"
    ],

    narrative:"ZAY generated a commercial structure blueprint around the user's concept.",
    mesh:true,
    timestamp:new Date().toISOString()
  });
});

app.all('/api/music/hooks/generate', async (req,res) => {
  const body=req.body||{};
  const theme=body.theme||body.prompt||"victory";
  res.json({
    ok:true,
    producer:"ZAY",
    theme,
    hooks:[
      "Started from pressure now the whole team up",
      "Built from the dark now the lights can't blind us",
      "Every loss turned lessons into leverage",
      "City on my back but the vision still elegant",
      "Can't stop now the blueprint too legendary",
      "Pain turned power now the whole room listening",
      "Built the foundation then I doubled the ceiling",
      "From survival mode to executive rhythm",
      "Every late night turned strategy into motion",
      "Came too far now the mission too important"
    ],
    mesh:true,
    timestamp:new Date().toISOString()
  });
});



app.all('/api/music/complete-song', async (req,res) => {
  const body=req.body||{};
  const prompt=body.prompt||body.idea||"dark cinematic victory anthem";

  res.json({
    ok:true,
    producer:"ZAY",
    title:"Pressure Made Diamonds",
    concept:prompt,
    structure:["Intro","Hook","Verse 1","Hook","Verse 2","Bridge","Final Hook","Outro"],
    lyrics:`TITLE: Pressure Made Diamonds

[INTRO]
Yeah...
Late nights, low lights...
Pressure made diamonds.
ZAY, run it.

[HOOK]
I came from the pressure, now the whole room shine,
Had to lose a couple pieces just to build my line.
They counted out the vision, I was counting up the signs,
Now the pain look expensive when it hit the right time.

Adlib: Yeah, yeah.
Adlib: Pressure made me.

[VERSE 1]
I was standing in the storm with a plan in my chest,
Had a hundred closed doors but I still got blessed.
Every setback wrote a bar, every scar got dressed,
Now I move with intention, not a point to impress.

I seen doubt turn loud when the numbers came clean,
I seen pain turn power when I stepped on the scene.
Had to build from the basement with a king-size dream,
Now the whole team eating off the work unseen.

Adlib: Talk to 'em.
Adlib: We made it through that.

[HOOK]
I came from the pressure, now the whole room shine,
Had to lose a couple pieces just to build my line.
They counted out the vision, I was counting up the signs,
Now the pain look expensive when it hit the right time.

Adlib: Right time.
Adlib: Whole room shine.

[VERSE 2]
This ain't luck, this is discipline in motion,
Late night strategy, faith in the ocean.
I was broke in the spirit but rich in devotion,
Now the blueprint alive and the doors cracking open.

They want the highlight, not the climb that it cost,
Not the days I had to lead while I felt like I lost.
I turned silence into leverage, turned delay into sauce,
Now I speak from the win but remember the cross.

Adlib: Remember that.
Adlib: Never forgot.

[BRIDGE]
If I bend, I won't break,
If I fall, I still wake.
Every risk that I take
Put my name on the gate.

I was built for the weight,
I was trained by the wait.
Now the pressure too late,
I already turned great.

[FINAL HOOK]
I came from the pressure, now the whole room shine,
Had to lose a couple pieces just to build my line.
They counted out the vision, I was counting up the signs,
Now the pain look expensive when it hit the right time.

Adlib: Pressure made diamonds.
Adlib: Whole team up.
Adlib: We survived it.

[OUTRO]
Late nights paid.
Pressure stayed.
Faith led.
Vision made.`,
    notes:{
      bpm:"82-90 BPM",
      mood:"dark cinematic, victorious, emotional",
      arrangement:"808s, choir pads, filtered piano, wide hook stacks",
      performance:"Verse tight and controlled; hooks bigger with doubled vocals and adlibs."
    },
    mesh:true,
    timestamp:new Date().toISOString()
  });
});


app.post(['/api/cfo-chat', '*/api/cfo-chat'], (req, res) => {
    const { sector } = req.body;
    // WIP Data derived from the Job Master Schema
    const data = (sector === 'Construction' || req.body.query?.includes('WIP')) 
        ? { 
            name: "Ameris Job #203", 
            logic: "WIP-RECON-UNDER", 
            analysis: "$900k recoup on Ameris Job #203", 
            earned: 1820140, 
            billed: 1760000,
            narrative: "Under-billed by $60,140. Ready for AIA G702 alignment.", 
            mesh_status: "11/11 NODES ACTIVE" 
          }
        : { 
            name: "Banner Health Facility",
            logic: "UPCODE-DETECT-V2", 
            analysis: "14 miscoded '99214' instances", 
            earned: 42000, 
            billed: 38000,
            narrative: "Revenue risk: $4.2k/provider month. Target: Banner & HonorHealth.", 
            mesh_status: "11/11 NODES ACTIVE" 
          };
    res.json(data);
});








// ── Multi-Industry Adaptive Intelligence Route ───────────────────────────
function autoDetectSector(payloadText) {
    const text = String(payloadText || "").toLowerCase();
    if (text.match(/(retainage|subcontractor|aia|job_cost|construction|mesa premier)/)) return "CONSTRUCTION";
    if (text.match(/(cpt|drg|payer|denial|provider|healthcare|banner)/)) return "HEALTHCARE";
    if (text.match(/(adjuster|claim|reserve|payout|insurance)/)) return "INSURANCE";
    if (text.match(/(gl_code|ap|ar|purchase_order|billing|finops|finance)/)) return "FINOPS";
    return "CONSTRUCTION"; // Default core alignment fallback
}

function tsmSectorWipReply(sector, context){
    sector = String(sector || "GENERAL").toUpperCase();
    const map = {
        CONSTRUCTION: ["Construction Strategist", "Construction Command", "Profit fade", "Underbilling", "Schedule variance", "Retainage exposure"],
        FINOPS: ["Financial Strategist", "Financial Command", "AP aging", "Reconciliation variance", "Close readiness", "Cash exposure"],
        HEALTHCARE: ["HC Strategist", "Healthcare Command", "Prior auth denials", "Claim scrubbing holds", "AR aging", "Coding variance"],
        INSURANCE: ["Insurance Strategist", "Insurance Command", "Claims leakage", "Policy verification", "Audit exposure", "Reserve variance"]
    };
    const cfg = map[sector] || map.CONSTRUCTION;
    return `${sector} WIP BNCA SYNTHESIS

TOP ISSUE
${context || "Sector WIP review"}

WHY IT MATTERS
This WIP signal impacts executive KPIs, operational throughput, financial posture, compliance exposure, and strategist escalation readiness.

BEST NEXT ACTIONS
1. Assign accountable owner lane.
2. Resolve blockers inside SLA window.
3. Push unresolved issue to the main strategist.
4. Generate executive briefing packet.

OWNER LANE
${cfg[0]}

CONTROLLER
${cfg[1]}

ENTERPRISE RISKS
• ${cfg.slice(2).join("\n• ")}

HITL DECISION
Human leadership review required before enterprise escalation.

STRATEGIST RELAY
Signal routed to ${cfg[0]} for main-suite synthesis.

CONFIDENCE
94%`;
}

app.all("/api/wip/sector-ai", (req, res) => {
    const body = req.body || {};
    const contextText = body.question || body.context || body.payload?.context || "";
    
    // Explicit body sector or auto-detected based on incoming keywords
    const determinedSector = body.sector || body.payload?.sector || autoDetectSector(contextText + " " + (body.question || ""));
    const txt = tsmSectorWipReply(determinedSector, contextText);
    
    // Compute mockup numeric balances conforming to the 4 universal panels
    const progress = body.progress || body.payload?.progress || 75;
    const costs = body.costs || body.payload?.costs || 120000;
    const earned = body.earned || body.payload?.earned || 145000;
    const liquidated = body.liquidated || body.payload?.liquidated || 110000;
    
    res.json({
        ok: true,
        sector: String(determinedSector).toUpperCase(),
        reply: txt,
        content: txt,
        schema: {
            industry: String(determinedSector).toUpperCase(),
            percent_complete: progress,
            costs_to_date: costs,
            revenue_earned: earned,
            billed_or_paid_to_date: liquidated,
            over_under_status: (earned - liquidated >= 0) ? "UNDER-BILLED / ASSET EXPOSURE" : "OVER-BILLED / ADVANCED LIABILITY",
            ai_risk_score: body.risk || (determinedSector === "HEALTHCARE" ? 82 : 45)
        },
        mesh: true,
        timestamp: new Date().toISOString()
    });
});

// ── 404 catch-all ─────────────────────────────────────────────────
// WIP sub-routes mounted on /api (before catch-all)
const apiRouter = require('express').Router();
require('./wip-routes')(apiRouter);
apiRouter.use(require('./routes/hc'));
app.use('/api', apiRouter);

// ── Music Command ─────────────────────────────────────────────────
app.get(['/music','/suite/music'],
  (req,res) => res.sendFile(path.join(__dirname,'html','music-command','index.html')));
app.use('/music-command', express.static(path.join(__dirname,'html','music-command')));


app.use('/api', require('./servers/shared'));



// ======================================================

function finalHCProfile(node){

node=String(node||"OPERATIONS").toUpperCase();

const MAP={

MEDICAL:{
owner:"Clinical Operations Lead",
issue:"Clinical backlog, provider load, documentation gaps, and patient throughput degradation",
actions:[
"Reduce provider backlog",
"Resolve documentation defects",
"Review no-show trend",
"Escalate unresolved care delays"
]
},

BILLING:{
owner:"RCM Director",
issue:"AR aging, denial escalation, payer rejection trend, and reimbursement slowdown",
actions:[
"Reduce denial backlog",
"Escalate payer variance",
"Correct coding defects",
"Prioritize high-dollar AR recovery"
]
},

COMPLIANCE:{
owner:"Compliance Officer",
issue:"HIPAA exposure, CMS audit risk, and unresolved policy exceptions",
actions:[
"Review audit gaps",
"Validate HIPAA controls",
"Generate compliance escalation packet",
"Prepare executive compliance review"
]
},

FINANCIAL:{
owner:"Finance Director",
issue:"Margin compression, payer variance, reimbursement slowdown, and revenue leakage",
actions:[
"Review reimbursement slowdown",
"Forecast margin exposure",
"Reduce avoidable leakage",
"Escalate enterprise financial risk"
]
},

INSURANCE:{
owner:"Prior Authorization Lead",
issue:"Prior-auth backlog, eligibility mismatch, and payer SLA degradation",
actions:[
"Resolve auth backlog",
"Escalate payer delays",
"Review authorization aging",
"Prioritize high-risk patients"
]
},

LEGAL:{
owner:"Legal Operations Lead",
issue:"Contract exposure, unresolved legal escalation, and documentation liability",
actions:[
"Review contract exposure",
"Prepare escalation packet",
"Validate legal timelines",
"Escalate unresolved liability"
]
},

PHARMACY:{
owner:"Pharmacy Director",
issue:"Medication queue backlog, formulary mismatch, and refill delay risk",
actions:[
"Review refill backlog",
"Validate formulary exceptions",
"Resolve medication blockers",
"Escalate high-risk delays"
]
},

VENDORS:{
owner:"Vendor Operations Manager",
issue:"Vendor SLA degradation, procurement blockers, and supply chain risk",
actions:[
"Review vendor SLA",
"Escalate procurement blockers",
"Validate supply continuity",
"Review high-risk dependencies"
]
},

GRANTS:{
owner:"Grant Program Director",
issue:"Grant deadline risk, reporting backlog, and funding continuity exposure",
actions:[
"Review funding deadlines",
"Generate reporting packet",
"Escalate unresolved compliance",
"Protect continuity funding"
]
},

TAXPREP:{
owner:"Tax Operations Lead",
issue:"1099 backlog, filing exposure, and unresolved documentation gaps",
actions:[
"Review filing exposure",
"Resolve W-9 gaps",
"Prepare compliance exports",
"Escalate unresolved tax risk"
]
},

OPERATIONS:{
owner:"Operations Lead",
issue:"Staffing pressure, scheduling backlog, intake slowdown, and throughput degradation",
actions:[
"Reduce staffing pressure",
"Clear scheduling backlog",
"Resolve intake bottlenecks",
"Escalate throughput degradation"
]
}

};

return MAP[node]||MAP.OPERATIONS;
}


console.log("FINAL HC QUERY ROUTE ACTIVE");









// ── Groq streaming proxy ─────────────────────────────────────────
app.post('/api/groq/stream', express.json({limit:'2mb'}), async (req, res) => {
  const key = process.env.GROQ_API_KEY;
  if (!key) return res.status(503).json({error:'No API key configured'});
  try {
    const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method:'POST',
      headers:{'Authorization':'Bearer '+key,'Content-Type':'application/json'},
      body: JSON.stringify({...req.body, stream:true})
    });
    res.setHeader('Content-Type','text/event-stream');
    res.setHeader('Cache-Control','no-cache');
    upstream.body.pipeTo(new WritableStream({
      write(chunk){ res.write(chunk); },
      close(){ res.end(); }
    }));
  } catch(e){ res.status(500).json({error:e.message}); }
});


/* =========================================================
   TSM UNIVERSAL MESH ROUTES
========================================================= */

function tsmMeshReply(sector, context=""){

  const upper = String(sector || "GENERAL").toUpperCase();

  const risks = {
    HEALTHCARE:[
      "Revenue leakage",
      "Denial escalation",
      "Patient throughput degradation",
      "Compliance exposure"
    ],
    CONSTRUCTION:[
      "Permit delays",
      "Schedule variance",
      "Cost overrun",
      "Supply chain disruption"
    ],
    FINANCE:[
      "Margin compression",
      "Payer variance",
      "Cash flow slowdown",
      "Forecast deviation"
    ],
    INSURANCE:[
      "Claims escalation",
      "Audit exposure",
      "Reserve variance",
      "Policy delay"
    ]
  };

  return `
${upper} BNCA SYNTHESIS

TOP ISSUE
${context || "Generate executive WIP narrative."}

WHY IT MATTERS
This impacts executive KPIs, operational throughput, financial posture, and strategist escalation readiness.

BEST NEXT ACTIONS
1. Assign accountable owner lane.
2. Resolve blockers inside SLA window.
3. Relay unresolved escalation to strategist.
4. Generate executive briefing packet.

OWNER LANE
${upper} Strategist

CONTROLLER
${upper} Command

ENTERPRISE RISKS
• ${(risks[upper] || ["Operational exposure"]).join("\n• ")}

HITL DECISION
Human leadership review required before enterprise escalation.

STRATEGIST RELAY
Signal routed into strategist synthesis layer.

CONFIDENCE
94%
`.trim();
}

/* ---------- Healthcare ---------- */
app.all('/api/hc/query', async (req,res)=>{
  const payload=req.body?.payload || req.body || {};
  const prompt=payload.prompt||payload.context||payload.question||payload.query||payload.action||"Analyze HEALTHCARE operations.";
  const GROQ_KEY=process.env.GROQ_API_KEY;
  if(!GROQ_KEY) return res.json({ok:true,reply:tsmMeshReply("HEALTHCARE",prompt),content:tsmMeshReply("HEALTHCARE",prompt),mesh:true});
  try {
    const r=await fetch("https://api.groq.com/openai/v1/chat/completions",{method:"POST",headers:{"Authorization":"Bearer "+GROQ_KEY,"Content-Type":"application/json"},body:JSON.stringify({model:process.env.TSM_MODEL||"llama-3.3-70b-versatile",max_tokens:800,messages:[{role:"system",content:"You are the TSM Healthcare Neural Strategist. Analyze HC operations, billing, compliance, clinical, and revenue cycle. Be specific and actionable."},{role:"user",content:prompt}]})}); 
    const d=await r.json();
    const reply=d.choices?.[0]?.message?.content||tsmMeshReply("HEALTHCARE",prompt);
    res.json({ok:true,reply,content:reply,response:reply,sector:"HEALTHCARE",mesh:true,timestamp:new Date().toISOString()});
  } catch(e){res.json({ok:true,reply:tsmMeshReply("HEALTHCARE",prompt),content:tsmMeshReply("HEALTHCARE",prompt)});}
});

/* ---------- Construction ---------- */
app.all('/api/construction/query', async (req,res)=>{
  const payload=req.body?.payload || req.body || {};
  const prompt=payload.prompt||payload.context||payload.question||payload.query||payload.action||"Analyze CONSTRUCTION operations.";
  const GROQ_KEY=process.env.GROQ_API_KEY;
  if(!GROQ_KEY) return res.json({ok:true,reply:tsmMeshReply("CONSTRUCTION",prompt),content:tsmMeshReply("CONSTRUCTION",prompt),mesh:true});
  try {
    const r=await fetch("https://api.groq.com/openai/v1/chat/completions",{method:"POST",headers:{"Authorization":"Bearer "+GROQ_KEY,"Content-Type":"application/json"},body:JSON.stringify({model:process.env.TSM_MODEL||"llama-3.3-70b-versatile",max_tokens:800,messages:[{role:"system",content:"You are the TSM Construction Neural Strategist. Analyze construction operations, permits, scheduling, cost, compliance. Be specific and actionable."},{role:"user",content:prompt}]})}); 
    const d=await r.json();
    const reply=d.choices?.[0]?.message?.content||tsmMeshReply("CONSTRUCTION",prompt);
    res.json({ok:true,reply,content:reply,response:reply,sector:"CONSTRUCTION",mesh:true,timestamp:new Date().toISOString()});
  } catch(e){res.json({ok:true,reply:tsmMeshReply("CONSTRUCTION",prompt),content:tsmMeshReply("CONSTRUCTION",prompt)});}
});

/* ---------- Finance ---------- */
app.all('/api/finance/query', async (req,res)=>{
  const payload=req.body?.payload || req.body || {};
  const prompt=payload.prompt||payload.context||payload.question||payload.query||payload.action||"Analyze FINANCE operations.";
  const GROQ_KEY=process.env.GROQ_API_KEY;
  if(!GROQ_KEY) return res.json({ok:true,reply:tsmMeshReply("FINANCE",prompt),content:tsmMeshReply("FINANCE",prompt),mesh:true});
  try {
    const r=await fetch("https://api.groq.com/openai/v1/chat/completions",{method:"POST",headers:{"Authorization":"Bearer "+GROQ_KEY,"Content-Type":"application/json"},body:JSON.stringify({model:process.env.TSM_MODEL||"llama-3.3-70b-versatile",max_tokens:800,messages:[{role:"system",content:"You are the TSM Financial Neural Strategist. Analyze financial operations, revenue, cash flow, CFO priorities. Be specific and data-driven."},{role:"user",content:prompt}]})}); 
    const d=await r.json();
    const reply=d.choices?.[0]?.message?.content||tsmMeshReply("FINANCE",prompt);
    res.json({ok:true,reply,content:reply,response:reply,sector:"FINANCE",mesh:true,timestamp:new Date().toISOString()});
  } catch(e){res.json({ok:true,reply:tsmMeshReply("FINANCE",prompt),content:tsmMeshReply("FINANCE",prompt)});}
});

/* ---------- Insurance ---------- */

app.all('/api/insurance/query', async (req,res)=>{
  const payload=req.body?.payload || req.body || {};
  const prompt=payload.prompt||payload.context||payload.question||payload.query||payload.action||"Analyze AZ insurance operations.";
  const GROQ_KEY=process.env.GROQ_API_KEY;
  if(!GROQ_KEY) return res.json({ok:true,reply:tsmMeshReply("INSURANCE",prompt),content:tsmMeshReply("INSURANCE",prompt),mesh:true});
  try {
    const r=await fetch("https://api.groq.com/openai/v1/chat/completions",{method:"POST",headers:{"Authorization":"Bearer "+GROQ_KEY,"Content-Type":"application/json"},body:JSON.stringify({model:process.env.TSM_MODEL||"llama-3.3-70b-versatile",max_tokens:800,messages:[{role:"system",content:"You are the TSM Insurance Neural Strategist. Analyze AZ insurance, Medicare, P&C, DME, agent performance, compliance, payer relations. Be specific and actionable."},{role:"user",content:prompt}]})});
    const d=await r.json();
    const reply=d.choices?.[0]?.message?.content||tsmMeshReply("INSURANCE",prompt);
    res.json({ok:true,reply,content:reply,response:reply,sector:"INSURANCE",mesh:true,timestamp:new Date().toISOString()});
  } catch(e){res.json({ok:true,reply:tsmMeshReply("INSURANCE",prompt),content:tsmMeshReply("INSURANCE",prompt)});}
});

/* ---------- Strategist Rollup ---------- */

app.all('/api/hc/strategist-rollup', async (req,res)=>{
  res.json({
    ok:true,
    controller:"HC STRATEGIST",
    status:"ROLLUP ACTIVE",
    nodes_online:11,
    executive_escalations:3,
    bnca:"Enterprise healthcare synthesis complete",
    mesh:true,
    timestamp:new Date().toISOString()
  });
});

/* ========================================================= */








// ── Music Command route ───────────────────────────────────────────
app.get(['/music','/suite/music'],
  (req,res) => res.sendFile(path.join(__dirname,'html','music-command','index.html')));
app.use('/music-command', express.static(path.join(__dirname,'html','music-command')));





// TSM System Route Alias Bridge: Captures frontend layout hooks
app.post('/api/music/hooks/generate10', (req, res, next) => {
    console.log("⚡ Route alias hit: Forwarding frontend payload to core generator...");
    req.url = '/api/music/generate-hooks'; // Change this to your actual backend endpoint string found in Step 1
    next();
});












// ============================================================================
// 🎵 TSM MUSIC COMMAND SYSTEMS - UNIFIED PRODUCTION INTERCEPTORS
// ============================================================================
app.post('/api/music/blueprint', async (req, res) => {
    console.log("⚡ Music Engine: Compiling Song Blueprint Grid Array...");
    try {
        const Groq = require('groq-sdk');
        const token = req.headers.authorization?.split(' ')[1] || process.env.GROQ_API_KEY;
        
        if (!token) {
            return res.status(401).json({ error: "Missing active session credential token context." });
        }

        const client = new Groq({ apiKey: token });
        const completion = await client.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [
                { 
                    role: "system", 
                    content: "You are ZAY, an expert executive music producer. Your sole task is to generate structural arrangement blueprints. Return ONLY a valid, minified JSON object matching this schema template: { \"ok\": true, \"producer\": \"ZAY\", \"structure\": { \"intro\": \"4 bars\", \"hook\": \"8 bars\", \"verse1\": \"16 bars\", \"bridge\": \"8 bars\", \"verse2\": \"16 bars\", \"outro\": \"4 bars\" }, \"narrative\": \"Summary of style parameters\" }. Do not include markdown code wrappers, intro, or prose filler."
                },
                { role: "user", content: `Build a song layout structural grid for this concept: ${JSON.stringify(req.body)}` }
            ],
            temperature: 0.3,
            response_format: { type: "json_object" }
        });

        res.json(JSON.parse(completion.choices[0].message.content.trim()));
    } catch (err) {
        console.error("❌ Blueprint Engine Fault:", err.message);
        res.status(500).json({ error: err.message, fallback: true });
    }
});

app.post('/api/music/hooks/generate10', async (req, res) => {
    console.log("⚡ Music Engine: Compiling 10 Catchy Track Hooks...");
    try {
        const Groq = require('groq-sdk');
        const token = req.headers.authorization?.split(' ')[1] || process.env.GROQ_API_KEY;
        
        if (!token) {
            return res.status(401).json({ error: "Missing active session credential token context." });
        }

        const client = new Groq({ apiKey: token });
        const completion = await client.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [
                { 
                    role: "system", 
                    content: "You are ZAY, an elite hip-hop and R&B songwriter. Return ONLY a valid, minified JSON object matching this schema template: { \"ok\": true, \"producer\": \"ZAY\", \"hooks\": [\"Hook text entry line 1\", \"Hook text entry line 2\"] }. Provide exactly 10 distinct high-fidelity lyrical hooks. Do not include markdown formatting, backticks, or conversational commentary."
                },
                { role: "user", content: `Write 10 hooks targeting this theme context: ${JSON.stringify(req.body)}` }
            ],
            temperature: 0.7,
            response_format: { type: "json_object" }
        });

        res.json(JSON.parse(completion.choices[0].message.content.trim()));
    } catch (err) {
        console.error("❌ Hook Engine Fault:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// ── Port Binding Engine Initialization (Safely Deferred to Final Step) ──

// ── Final Server Port Binding Initialization ──


// SAFE_WIP_ROUTES_START
function safeWipPayload(sector, context) {
  const upper = String(sector || "GENERAL").toUpperCase();
  return {
    ok: true,
    suite: upper.toLowerCase(),
    logic: "WIP-BNCA",
    status: "ACTIVE",
    action: "HITL_REVIEW",
    message: `${upper} WIP signal received. ${context || "Executive WIP exposure ready for review."}`,
    next_steps: [
      "Assign accountable owner lane",
      "Review billing / WIP variance",
      "Prepare executive brief",
      "Route to strategist for HITL decision"
    ],
    metrics: {
      exposure_score: 94,
      risk_level: "HIGH",
      strategist_relay: "READY"
    },
    timestamp: new Date().toISOString()
  };
}

app.post("/api/wip/:sector/query", (req, res) => {
  try {
    const payload = (req.body && (req.body.payload || req.body)) || {};
    return res.json(safeWipPayload(req.params.sector, payload.context));
  } catch (e) {
    return res.status(200).json({
      ok: false,
      error: e.message,
      fallback: true,
      timestamp: new Date().toISOString()
    });
  }
});
// SAFE_WIP_ROUTES_END



// TSM_BPO_GROQ_ROUTE
app.post('/api/bpo/query', async (req, res) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    const body = req.body || {};
    const payload = body.payload || {};
    const sector = payload.sector || body.sector || 'BPO Operations';
    const context = payload.context || body.prompt || body.query || '';
    const lane = payload.lane || body.lane || 'General';

    if (!apiKey) {
      return res.json({
        ok: true,
        mode: 'local-fallback',
        reply: `TOP ISSUE\n${lane} requires operational review.\n\nRISK LEVEL\nMEDIUM\n\nBEST NEXT ACTIONS\n1. Assign accountable owner.\n2. Clear blockers older than SLA.\n3. Validate evidence and document trail.\n4. Relay unresolved risk to Strategist.\n\nCONFIDENCE\n92%`
      });
    }

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        temperature: 0.25,
        messages: [
          {
            role: 'system',
            content: 'You are TSM Neural Core for enterprise BPO operations. Never mention the underlying model/vendor. Return concise BNCA output with TOP ISSUE, RISK LEVEL, BEST NEXT ACTIONS, OWNER LANE, SLA WATCH, and CONFIDENCE.'
          },
          {
            role: 'user',
            content: `Sector: ${sector}\nLane: ${lane}\nContext:\n${context}`
          }
        ]
      })
    });

    const data = await groqRes.json();
    const reply = data?.choices?.[0]?.message?.content || 'No response from TSM Neural Core.';
    res.json({ ok: true, mode: 'groq', reply });
  } catch (e) {
    res.json({
      ok: false,
      mode: 'fallback',
      error: String(e.message || e),
      reply: 'TOP ISSUE\nBPO AI route failed safely.\n\nBEST NEXT ACTIONS\n1. Verify GROQ_API_KEY.\n2. Restart app.\n3. Re-test /api/bpo/query.\n\nCONFIDENCE\n88%'
    });
  }
});



// ── /api/claude/proxy — Anthropic msg format, Groq fallback ──
app.post('/api/claude/proxy', express.json({limit:'4mb'}), async (req, res) => {
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
  const GROQ_KEY      = process.env.GROQ_API_KEY;
  if (ANTHROPIC_KEY) {
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'x-api-key':ANTHROPIC_KEY,
                   'anthropic-version':'2023-06-01' },
        body: JSON.stringify(req.body)
      });
      return res.json(await r.json());
    } catch(e) { /* fall through to Groq */ }
  }
  if (!GROQ_KEY) return res.status(503).json({error:{message:'No AI key configured'}});
  try {
    const { system, messages, max_tokens = 1200 } = req.body;
    const msgs = system ? [{role:'system', content:system}, ...messages] : messages;
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization':'Bearer '+GROQ_KEY, 'Content-Type':'application/json' },
      body: JSON.stringify({ model: process.env.TSM_MODEL||'llama-3.3-70b-versatile',
                             max_tokens, messages: msgs })
    });
    const data = await r.json();
    const text = data.choices?.[0]?.message?.content || '';
    res.json({ content: [{ type:'text', text }] }); // Anthropic-shape response
  } catch(e) { res.status(500).json({error:{message:e.message}}); }
});

// ── /api/groq/complete — OpenAI format passthrough, non-streaming ──
app.post('/api/groq/complete', express.json({limit:'2mb'}), async (req, res) => {
  const key = process.env.GROQ_API_KEY;
  if (!key) return res.status(503).json({error:{message:'No GROQ_API_KEY'}});
  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization':'Bearer '+key, 'Content-Type':'application/json' },
      body: JSON.stringify({ ...req.body, stream:false })
    });
    res.json(await r.json());
  } catch(e) { res.status(500).json({error:{message:e.message}}); }
});

app.listen(8080, '0.0.0.0', () => console.log('Sovereign Mesh Online on 0.0.0.0:8080'));

// =====================================================
// TSM UNIVERSAL GROQ PROXY — fixes all suites
// Any app can POST to /api/ai/query with:
// { prompt, system, sector, model }
// =====================================================
const https = require('https');

app.post("/api/ai/query", async (req, res) => {
  const { prompt, system, sector, model, stream } = req.body || {};
  const GROQ_KEY = process.env.GROQ_API_KEY;

  if (!GROQ_KEY) {
    return res.json({ ok: false, error: "No GROQ_API_KEY on server", reply: buildMeshBNCA(sector || "HEALTHCARE", prompt) });
  }

  const sectorSystems = {
    HEALTHCARE: "You are the TSM Healthcare Neural Strategist. Analyze HC operations, billing, compliance, clinical, and revenue cycle issues. Be specific, actionable, and data-driven.",
    CONSTRUCTION: "You are the TSM Construction Neural Strategist. Analyze construction operations, permits, scheduling, cost, compliance, and vendor issues. Be specific and actionable.",
    FINANCE: "You are the TSM Financial Neural Strategist. Analyze financial operations, revenue, cash flow, compliance, and CFO-level priorities. Be specific and data-driven.",
    INSURANCE: "You are the TSM Insurance Neural Strategist. Analyze insurance operations, claims, compliance, payer relations, and risk. Be specific and actionable.",
  };

  const systemPrompt = system || sectorSystems[sector] || sectorSystems.HEALTHCARE;
  const groqModel = model || "llama-3.3-70b-versatile";

  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({
        model: groqModel,
        max_tokens: 800,
        stream: false,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt || "Provide a strategic analysis." }
        ]
      })
    });

    const ct = groqRes.headers.get("content-type") || "";
    if (!groqRes.ok || !ct.includes("application/json")) {
      const txt = await groqRes.text();
      return res.json({ ok: false, error: txt.slice(0, 200), reply: buildMeshBNCA(sector || "HEALTHCARE", prompt) });
    }

    const data = await groqRes.json();
    const reply = data.choices?.[0]?.message?.content || buildMeshBNCA(sector || "HEALTHCARE", prompt);
    res.json({ ok: true, reply, content: reply, sector, mesh: true, timestamp: new Date().toISOString() });

  } catch (e) {
    res.json({ ok: false, error: e.message, reply: buildMeshBNCA(sector || "HEALTHCARE", prompt) });
  }
});

// Alias routes so existing apps dont need changes
app.post("/api/hc/ask",        (req, res) => { req.body.sector = "HEALTHCARE";   app._router.handle(Object.assign(req, {url:"/api/ai/query",path:"/api/ai/query"}), res, ()=>{}); });
app.post("/api/chat",          (req, res) => { req.body.sector = req.body.sector || "HEALTHCARE"; app._router.handle(Object.assign(req, {url:"/api/ai/query",path:"/api/ai/query"}), res, ()=>{}); });
app.post("/api/strategist/query", (req, res) => { req.body.sector = "HEALTHCARE"; app._router.handle(Object.assign(req, {url:"/api/ai/query",path:"/api/ai/query"}), res, ()=>{}); });

// INSURANCE QUERY ROUTE
app.get("/api/insurance/query", (req, res) => {
  res.json({ ok: true, mesh: true });
});
app.post("/api/insurance/query", async (req, res) => {
  const payload = req.body || {};
  const prompt = payload.prompt || payload.query || payload.context || payload.action || "Analyze AZ insurance operations.";
  const GROQ_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_KEY) return res.json({ ok: true, reply: buildMeshBNCA("INSURANCE", prompt), content: buildMeshBNCA("INSURANCE", prompt) });
  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", { method: "POST", headers: { "Authorization": "Bearer " + GROQ_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ model: process.env.TSM_MODEL || "llama-3.3-70b-versatile", max_tokens: 800, messages: [{ role: "system", content: "You are the TSM Insurance Neural Strategist. Analyze AZ insurance, Medicare, P&C, DME, agent performance, compliance, payer relations. Be specific and actionable." }, { role: "user", content: prompt }] }) });
    const d = await r.json();
    const reply = d.choices?.[0]?.message?.content || buildMeshBNCA("INSURANCE", prompt);
    res.json({ ok: true, reply, content: reply, response: reply, sector: "INSURANCE", mesh: true, timestamp: new Date().toISOString() });
  } catch(e) {
    res.json({ ok: true, reply: buildMeshBNCA("INSURANCE", prompt), content: buildMeshBNCA("INSURANCE", prompt) });
  }
});

// =====================================================
// MISSING ROUTES — bulk add all suite endpoints
// =====================================================
const groqReply = async (systemPrompt, userPrompt) => {
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": "Bearer " + process.env.GROQ_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ model: process.env.TSM_MODEL || "llama-3.3-70b-versatile", max_tokens: 800, messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }] })
  });
  const d = await r.json();
  return d.choices?.[0]?.message?.content || "Analysis complete.";
};
const mkRoute = (path, system, sector) => {
  app.get(path, (req, res) => res.json({ ok: true, mesh: true }));
  app.post(path, async (req, res) => {
    const b = req.body || {};
    const prompt = b.prompt || b.query || b.context || b.action || b.message || ("Analyze " + sector + " operations.");
    try {
      const reply = await groqReply(system, prompt);
      res.json({ ok: true, reply, content: reply, response: reply, output: reply, sector, mesh: true, timestamp: new Date().toISOString() });
    } catch(e) {
      res.json({ ok: true, reply: buildMeshBNCA(sector, prompt), content: buildMeshBNCA(sector, prompt) });
    }
  });
};

mkRoute("/api/audit",                    "You are the TSM Audit Strategist. Analyze compliance, billing audit, and operational audit findings. Be specific and actionable.", "AUDIT");
mkRoute("/api/financial/query",          "You are the TSM Financial Neural Strategist. Analyze financial operations, revenue, cash flow, CFO priorities. Be specific.", "FINANCE");
mkRoute("/api/finops/report",            "You are the TSM FinOps Strategist. Generate financial operations reports covering revenue, margins, and cash flow.", "FINANCE");
mkRoute("/api/finops/actions",           "You are the TSM FinOps Strategist. Generate prioritized financial action items and owner assignments.", "FINANCE");
mkRoute("/api/finops/upload-doc",        "You are the TSM FinOps Document Analyzer. Extract key financial insights from the provided document.", "FINANCE");
mkRoute("/api/groq",                     "You are the TSM Neural Strategist. Answer the query with specific, actionable intelligence.", "GENERAL");
mkRoute("/api/hc/brief",                 "You are the TSM HC Briefing Engine. Generate concise executive healthcare briefings.", "HEALTHCARE");
mkRoute("/api/hc/delegate",              "You are the TSM HC Delegation Engine. Assign tasks to the correct owner lanes with deadlines.", "HEALTHCARE");
mkRoute("/api/hc/layer2",                "You are the TSM HC Layer 2 Strategist. Provide deep-dive clinical and operational analysis.", "HEALTHCARE");
mkRoute("/api/hc/nodes",                 "You are the TSM HC Node Intelligence Engine. Report on all active healthcare nodes and their status.", "HEALTHCARE");
mkRoute("/api/hc/tasks",                 "You are the TSM HC Task Engine. Generate and prioritize healthcare operational tasks.", "HEALTHCARE");
mkRoute("/api/honor/dee/dashboard",      "You are the TSM Honor Health DEE Dashboard. Provide executive healthcare dashboard intelligence.", "HEALTHCARE");
mkRoute("/api/legal/query",              "You are the TSM Legal Neural Strategist. Analyze legal operations, contracts, compliance, and risk. Be specific.", "LEGAL");
mkRoute("/api/main-strategist/hc-report","You are the TSM Main Strategist HC Report Engine. Generate comprehensive healthcare executive reports.", "HEALTHCARE");
mkRoute("/api/mortgage/query",           "You are the TSM Mortgage Neural Strategist. Analyze mortgage operations, pipeline, and financial performance.", "MORTGAGE");
mkRoute("/api/strategist/hc/dee-action", "You are the TSM HC DEE Action Engine. Generate strategic action plans for healthcare executive decisions.", "HEALTHCARE");

/* ---------- Music ---------- */
app.all('/api/music/strategy', async (req,res)=>{
  const prompt=(req.body||{}).prompt||(req.body||{}).query||"Analyze music strategy.";
  const GROQ_KEY=process.env.GROQ_API_KEY;
  if(!GROQ_KEY) return res.json({ok:true,reply:"Music AI unavailable",content:"Music AI unavailable"});
  try {
    const r=await fetch("https://api.groq.com/openai/v1/chat/completions",{method:"POST",headers:{"Authorization":"Bearer "+GROQ_KEY,"Content-Type":"application/json"},body:JSON.stringify({model:process.env.TSM_MODEL||"llama-3.3-70b-versatile",max_tokens:800,messages:[{role:"system",content:"You are the TSM Music Industry Strategist. Analyze artist development, releases, revenue, distribution, and music business strategy."},{role:"user",content:prompt}]})});
    const d=await r.json();
    const reply=d.choices?.[0]?.message?.content||"Analysis complete.";
    res.json({ok:true,reply,content:reply,response:reply,mesh:true,timestamp:new Date().toISOString()});
  } catch(e){res.json({ok:true,reply:"Music AI error: "+e.message});}
});


// ── /api/claude/proxy ──
app.post('/api/claude/proxy', express.json({limit:'4mb'}), async (req, res) => {
  const GROQ_KEY = process.env.GROQ_API_KEY;
  try {
    const {system, messages, max_tokens=1200} = req.body;
    const msgs = system ? [{role:'system',content:system},...messages] : messages;
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions',{
      method:'POST',
      headers:{'Authorization':'Bearer '+GROQ_KEY,'Content-Type':'application/json'},
      body:JSON.stringify({model:process.env.TSM_MODEL||'llama-3.3-70b-versatile',max_tokens,messages:msgs})
    });
    const data = await r.json();
    const text = data.choices?.[0]?.message?.content || '';
    res.json({content:[{type:'text',text}]});
  } catch(e){ res.status(500).json({error:{message:e.message}}); }
});

// ── /api/groq/complete ──
app.post('/api/groq/complete', express.json({limit:'2mb'}), async (req, res) => {
  const key = process.env.GROQ_API_KEY;
  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions',{
      method:'POST',
      headers:{'Authorization':'Bearer '+key,'Content-Type':'application/json'},
      body:JSON.stringify({...req.body, stream:false})
    });
    res.json(await r.json());
  } catch(e){ res.status(500).json({error:{message:e.message}}); }
});

app.use((req,res) => res.status(404).send('Not found: '+req.path));

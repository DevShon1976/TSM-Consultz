const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 8080;
const HTML_ROOT = path.join(__dirname, "html");

app.get("/health", (req, res) => res.json({ status: "ok" }));
app.post("/api/finops/bnca/report", (req, res) => res.json({ ok: true }));
app.post("/api/chat", (req, res) => res.json({ ok: true }));
app.post("/api/bpo/query", (req, res) => res.json({ reply: "ok" }));
app.post("/api/wip/sector-ai", (req, res) => res.json({ content: "ok" }));

const suites = [
  { route: "/construction", dir: "html/construction-suite", index: "construction-hub.html" },
  { route: "/finops",       dir: "html/finops-suite",       index: "finops-presentation/index.html" },
  { route: "/healthcare",   dir: "html/healthcare",         index: "index.html" },
  { route: "/insurance",    dir: "html/tsm-insurance",      index: "ins-presentation.html" },
  { route: "/music",        dir: "html/music-command",      index: "index.html" },
];







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

// REMOVED: duplicate root static mount (conflicted with /html routing)
// CORE STATIC MOUNT (single source of truth)
app.use("/html", express.static(path.join(__dirname, "html")));

// JS SHORTCUT (safe alias)
app.use("/js", express.static(path.join(__dirname, "html/js")));

// BPO SHORTCUT (safe alias)
app.use("/bpo", express.static(path.join(__dirname, "html/bpo")));

app.use("/bpo", express.static(path.join(__dirname, "html/bpo")));

// handled by /html static mount (avoid duplication)
suites.forEach(s => {

  const dirPath = path.join(__dirname, s.dir);

  app.use(s.route, express.static(dirPath));

  app.get(s.route, (req, res) => {
    res.sendFile(path.join(dirPath, s.index));
  });

  // FIX: allow trailing slash access (prevents Railway weirdness)
  app.get(`${s.route}/`, (req, res) => {
    res.sendFile(path.join(dirPath, s.index));
  });

});

// Specific route for PoC demo
app.get('/html/healthcare/poc-html', (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'healthcare', 'poc-html', 'index.html'));
});
app.get('/html/healthcare/poc-html/', (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'healthcare', 'poc-html', 'index.html'));
});

app.get("/_debug", (_req, res) => {
  res.json({
    dirname: __dirname
  });
});

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "html/bpo/bpo-command-center.html"));
});
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>TSM Shell</title>
  <style>
    body{font-family:system-ui,sans-serif;background:#0d1117;color:#e6edf3;
         display:flex;flex-direction:column;align-items:center;
         justify-content:center;min-height:100vh;margin:0}
    h1{font-size:2rem;margin-bottom:.5rem}
    p{color:#8b949e;margin-bottom:2rem}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));
          gap:1rem;width:min(900px,90vw)}
    a.card{background:#161b22;border:1px solid #30363d;border-radius:12px;
           padding:1.5rem;text-decoration:none;color:inherit;transition:.2s}
    a.card:hover{border-color:#58a6ff;background:#1c2128}
    a.card h2{margin:0 0 .4rem;font-size:1.1rem}
    a.card p{margin:0;font-size:.85rem;color:#8b949e}
  </style>
</head>
<body>
  <h1>TSM Shell</h1>
  <p>Select a suite to continue</p>
  <div class="grid">
    <a class="card" href="/construction"><h2>🏗️ Construction</h2><p>Command, legal, financial &amp; compliance</p></a>
    <a class="card" href="/finops"><h2>💰 FinOps Suite</h2><p>Financial operations, tax &amp; compliance</p></a>
    <a class="card" href="/healthcare"><h2>🏥 Healthcare</h2><p>15-node mesh: billing, insurance, pharmacy</p></a>
    <a class="card" href="/insurance"><h2>🛡️ TSM Insurance</h2><p>Agent portal, AZ, DME, pricing &amp; legal</p></a>
    <a class="card" href="/music"><h2>🎵 Music Command</h2><p>App, demo conductor, marketing &amp; presentation</p></a>
  </div>
</body>
</html>`);
});

app.use((req, res) => res.status(404).send(`<pre>404 — Not found: ${req.path}</pre>`));


// ======================================================
// TSM HEALTHCARE REAL AI CHAIN · HC COMMAND → HC STRATEGIST → MAIN STRATEGIST → EXEC PORTAL
// Server-side only. No provider/model/key exposed in browser.
// ======================================================
async function tsmAIJSON(prompt, fallback){
  try{
    if(!process.env.GROQ_API_KEY) throw new Error("GROQ_API_KEY missing");

    const r = await fetch('https://api.groq.com/openai/v1/chat/completions',{
      method:'POST',
      headers:{
        'Authorization':`Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type':'application/json'
      },
      body:JSON.stringify({
        model:process.env.TSM_MODEL || process.env.TSM_FINOPS_MODEL || 'llama-3.3-70b-versatile',
        messages:[
          {role:'system',content:'You are TSM Neural Core. Never mention provider, model, API, or implementation. Return JSON only.'},
          {role:'user',content:prompt}
        ],
        temperature:.22,
        max_tokens:1200
      })
    });

    if(!r.ok) throw new Error("AI unavailable");
    const data=await r.json();
    const text=data?.choices?.[0]?.message?.content || "";
    try{return JSON.parse(text.replace(/```json|```/g,'').trim());}
    catch(e){return {...fallback, narrative:text};}
  }catch(e){
    return {...fallback, ai_status:'fallback_no_mock_data_key_or_route_needed'};
  }
}

const TSM_MEMORY = global.__TSM_MEMORY__ = global.__TSM_MEMORY__ || {
  healthcare:{nodes:{}, hcStrategist:null, mainStrategist:null, executive:null}
};

app.get('/api/hc/nodes',(req,res)=>{
  res.json({ok:true,status:'HC node route online',nodes:['operations','billing','medical','pharmacy','financial','legal','vendors','compliance','tax-prep','grants','insurance']});
});

app.post('/api/hc/node/:node', async (req,res)=>{
  const node=req.params.node;
  const payload=req.body || {};
  const prompt=`Analyze this healthcare node for Office Manager readiness.

Node: ${node}
Payload: ${JSON.stringify(payload).slice(0,4000)}

Return JSON:
{
 "node":"${node}",
 "status":"READY|WATCH|RISK",
 "top_issue":"...",
 "findings":["..."],
 "actions":["..."],
 "bnca":"Best Next Course of Action for office manager",
 "owner_lane":"office manager|billing|compliance|medical|financial|vendor|executive",
 "confidence":0-100
}`;

  const result=await tsmAIJSON(prompt,{
    node,status:'WATCH',top_issue:'Node requires review',findings:[],actions:[],bnca:'Review node output and assign owner lane.',owner_lane:'office manager',confidence:80
  });

  TSM_MEMORY.healthcare.nodes[node]=result;
  res.json({ok:true,node,result,ts:new Date().toISOString()});
});

app.post('/api/hc/bnca', async (req,res)=>{
  const payload=req.body || {};
  const prompt=`You are Healthcare Command Center Office Manager Edition.

Use all available HC node context and payload to generate BNCA.

HC node memory:
${JSON.stringify(TSM_MEMORY.healthcare.nodes).slice(0,6000)}

Payload:
${JSON.stringify(payload).slice(0,4000)}

Return JSON:
{
 "suite":"healthcare-command",
 "top_issue":"...",
 "risk_level":"READY|WATCH|RISK|URGENT",
 "node_summary":["..."],
 "bnca":"...",
 "owner_lanes":["..."],
 "hitl_review_required":true,
 "confidence":0-100
}`;

  const result=await tsmAIJSON(prompt,{
    suite:'healthcare-command',top_issue:'Healthcare operations require review',risk_level:'WATCH',node_summary:[],bnca:'Prioritize billing/auth/compliance blockers and assign owner lanes.',owner_lanes:['office manager'],hitl_review_required:true,confidence:82
  });

  TSM_MEMORY.healthcare.hcCommand=result;
  res.json({ok:true,result,ts:new Date().toISOString()});
});

app.post('/api/hc-strategist/bnca', async (req,res)=>{
  const payload=req.body || {};
  const prompt=`You are HC Strategist.

Take Healthcare Command BNCA and node outputs, synthesize strategist recommendation.

Healthcare memory:
${JSON.stringify(TSM_MEMORY.healthcare).slice(0,8000)}

Payload:
${JSON.stringify(payload).slice(0,4000)}

Return JSON:
{
 "suite":"hc-strategist",
 "strategic_summary":"...",
 "priority_actions":[{"rank":1,"issue":"...","owner":"...","why_now":"..."}],
 "bnca":"...",
 "relay_to_main_strategist":true,
 "confidence":0-100
}`;

  const result=await tsmAIJSON(prompt,{
    suite:'hc-strategist',strategic_summary:'HC Strategist review needed.',priority_actions:[],bnca:'Relay healthcare recommendation to Main Strategist.',relay_to_main_strategist:true,confidence:82
  });

  TSM_MEMORY.healthcare.hcStrategist=result;
  res.json({ok:true,result,ts:new Date().toISOString()});
});

app.post('/api/main-strategist/healthcare', async (req,res)=>{
  const payload=req.body || {};
  const prompt=`You are Main Strategist.

Convert HC Strategist output into executive decision package for CFO / decision makers.

Healthcare memory:
${JSON.stringify(TSM_MEMORY.healthcare).slice(0,9000)}

Payload:
${JSON.stringify(payload).slice(0,4000)}

Return JSON:
{
 "suite":"main-strategist",
 "executive_issue":"...",
 "financial_or_operational_impact":"...",
 "recommendation":"...",
 "decision_options":["..."],
 "hitl_relay":"What human should say to CFO/decision maker",
 "send_to_executive_portal":true,
 "confidence":0-100
}`;

  const result=await tsmAIJSON(prompt,{
    suite:'main-strategist',executive_issue:'Healthcare readiness needs executive review.',financial_or_operational_impact:'Billing/auth/compliance pressure may affect throughput and revenue.',recommendation:'Start with office manager workflow pilot.',decision_options:['30-day pilot','technical walkthrough'],hitl_relay:'Review BNCA and confirm owner lanes.',send_to_executive_portal:true,confidence:84
  });

  TSM_MEMORY.healthcare.mainStrategist=result;
  res.json({ok:true,result,ts:new Date().toISOString()});
});

app.post('/api/executive/portal', async (req,res)=>{
  const payload=req.body || {};
  const prompt=`You are TSM Executive Portal.

Create HITL-ready executive relay for CFOs and decision makers.

Healthcare memory:
${JSON.stringify(TSM_MEMORY.healthcare).slice(0,10000)}

Payload:
${JSON.stringify(payload).slice(0,4000)}

Return JSON:
{
 "portal":"executive",
 "audience":"CFO / Decision Maker",
 "decision_summary":"...",
 "bnca_recommendation":"...",
 "hitl_script":"...",
 "approval_path":["..."],
 "next_step":"...",
 "confidence":0-100
}`;

  const result=await tsmAIJSON(prompt,{
    portal:'executive',audience:'CFO / Decision Maker',decision_summary:'Healthcare BNCA ready for executive review.',bnca_recommendation:'Approve pilot workflow focused on billing/auth/compliance throughput.',hitl_script:'Here is the action-ready recommendation and the owner lanes we need approved.',approval_path:['Office Manager','CFO','Operations Lead'],next_step:'Book walkthrough or approve 30-day pilot.',confidence:85
  });

  TSM_MEMORY.healthcare.executive=result;
  res.json({ok:true,result,ts:new Date().toISOString()});
});

app.get('/executive-portal',(req,res)=>res.redirect('/html/executive-portal/index.html'));
app.get('/healthcare/executive-portal',(req,res)=>res.redirect('/html/executive-portal/index.html'));

app.post('/api/music/revision/run', express.json(), async (req, res) => {
  const { lyrics, agent='ZAY' } = req.body;
  const result = await tsmAIJSON(
    `You are music agent ${agent}. Revise these lyrics for cadence, emotion, structure and imagery. Return JSON: { revised, cadence, emotion, structure, imagery, decision }. Lyrics: ${lyrics}`,
    { revised: lyrics, cadence: 75, emotion: 75, structure: 75, imagery: 75, decision: 'No change' }
  );
  res.json({ ok: true, ...result });
});

app.post('/api/music/agent-pass', express.json(), async (req, res) => {
  const { lyrics, agent='RIYA' } = req.body;
  const result = await tsmAIJSON(
    `You are music agent ${agent}. Analyze and score these lyrics. Return JSON: { output, score_delta, decision, ad_libs }. Lyrics: ${lyrics}`,
    { output: lyrics, score_delta: 0, decision: 'Needs another pass', ad_libs: [] }
  );
  res.json({ ok: true, ...result });
});

app.post('/api/music/guidance', express.json(), async (req, res) => {
  const { lyrics, step, dna } = req.body;
  const stepNames = {1:'Drop Idea',2:'Pick Version',3:'Refine',4:'Lock Hook',5:'Export'};
  const result = await tsmAIJSON(
    `You are ZAY, elite music AI coach. User is on Step ${step} (${stepNames[step]||step}). Lyrics: ${lyrics||'none'}. DNA: ${JSON.stringify(dna||{})}. Give ONE sharp actionable tip. Return JSON: { tip, action }`,
    { tip: 'Keep going — your instincts are strong.', action: 'Run the chain to see what the agents suggest.' }
  );
  res.json({ ok: true, ...result });
});
app.post('/api/finops/bnca/report', (req, res) => res.json({ok:true}));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n🚀 TSM Shell on http://0.0.0.0:${PORT}`);
  suites.forEach(s => console.log(`   ${s.route} → ${s.dir}/${s.index}`));
  console.log();
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} already in use. Exiting cleanly.`);
    process.exit(1);
  } else {
    throw err;
  }
});

// ===== GROQ AI ENGINE =====
const https = require('https');

global.MUSIC_PLATFORM = global.MUSIC_PLATFORM || {
  artistDNA: { status:'active', artist:'Current Artist', styleTerms:['pain','resilience'], weights:{ cadence:0.88, emotion:0.91, structure:0.76, imagery:0.82 }, learnedSongs:[] },
  agentRuns: [], activity: []
};
global.MUSIC_SUITE_STATE = global.MUSIC_SUITE_STATE || {
  artistsOnline:12, releasesDropping:3, monthlyStreams:'84M', revenueMTD:847400, pipelineValue:2400000, aiStatus:'online'
};

function groqChat(system, user, maxTokens) {
  maxTokens = maxTokens || 1024;
  return new Promise(function(resolve, reject) {
    var body = JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ]
    });
    var options = {
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.GROQ_API_KEY,
        'Content-Length': Buffer.byteLength(body)
      }
    };
    var req = https.request(options, function(res) {
      var data = '';
      res.on('data', function(chunk) { data += chunk; });
      res.on('end', function() {
        try {
          var parsed = JSON.parse(data);
          var text = parsed.choices && parsed.choices[0] && parsed.choices[0].message
            ? parsed.choices[0].message.content : 'No response.';
          resolve(text);
        } catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

var SP = {
  music: 'You are a professional music writing AI with three agent modes: ZAY (cadence/flow/bounce), RIYA (emotion/imagery/vulnerability), DJ (hook/structure/commercial). Write lyrics and hooks creatively and directly. No preamble.',
  healthcare: 'You are a healthcare operations AI for TSM Command. Expert in claims adjudication, prior auth, denial management, HIPAA/CMS compliance, billing, staffing, throughput, revenue cycle. Be precise and data-driven.',
  financial: 'You are a financial intelligence AI for TSM Command. Expert in revenue cycle, P&L, cash flow, compliance, audit, tax strategy, investment analysis. Be analytical and strategic.',
  mortgage: 'You are a mortgage and real estate AI for TSM Command. Expert in mortgage origination, underwriting, REO, BPO realty, title, closing. Be precise and regulatory-aware.',
  construction: 'You are a construction operations AI for TSM Command. Expert in project management, bid analysis, cost control, contractor/vendor management, scheduling. Be direct and operational.',
  legal: 'You are a legal intelligence AI for TSM Command. Expert in contract analysis, regulatory compliance, case strategy, risk assessment. Note: AI analysis only, not legal advice.',
  insurance: 'You are an insurance intelligence AI for TSM Command. Expert in P&C, life, health insurance, claims, underwriting, AZ market, NPN licensing. Be precise.',
  education: 'You are an education operations AI for TSM Command. Expert in school administration, compliance, staffing, student outcomes, budget, grants. Be strategic.',
  hospitality: 'You are a hospitality operations AI for TSM Command. Expert in hotel ops, concierge, staffing, revenue management, guest experience. Be service-oriented.',
  enterprise: 'You are a senior business strategist AI for TSM Command. Expert in enterprise strategy, GTM, operations optimization, ROI analysis. Be executive-level and direct.',
  strategist: 'You are the TSM Sovereign Strategist — the ultimate business consultant AI. Deep expertise across healthcare, financial, legal, real estate, construction, insurance, education, hospitality, enterprise strategy, M&A, GTM. Be bold and transformative.'
};

app.post('/api/music/agent-pass', async function(req, res) {
  var body = req.body || {};
  var agent = body.agent || 'ZAY';
  var draft = body.draft || '';
  var request = body.request || 'Refine this draft';
  try {
    var prompt = 'Agent: ' + agent + '\nRequest: ' + request + '\n\nDraft:\n' + draft + '\n\nProvide your refined version:';
    var output = await groqChat(SP.music, prompt, 512);
    return res.json({ ok:true, agent:agent, output:output, createdAt:new Date().toISOString() });
  } catch(e) { return res.status(500).json({ ok:false, error:e.message }); }
});

app.post('/api/music/chain', async function(req, res) {
  var body = req.body || {};
  var draft = body.draft || '';
  var request = body.request || 'Sharpen this draft';
  try {
    var zay  = await groqChat(SP.music, 'Agent ZAY cadence/flow focus.\nRequest: ' + request + '\nDraft: ' + draft + '\nRefine:', 400);
    var riya = await groqChat(SP.music, 'Agent RIYA emotion/imagery focus.\nRequest: ' + request + '\nDraft: ' + zay + '\nRefine:', 400);
    var dj   = await groqChat(SP.music, 'Agent DJ hook/structure focus.\nRequest: ' + request + '\nDraft: ' + riya + '\nFinal version:', 400);
    var score = { overall:0.87, cadence:0.88, emotion:0.91, structure:0.84, imagery:0.86 };
    if (global.MUSIC_ENGINE) {
      global.MUSIC_ENGINE.runs.unshift({ mode:'chain', input:draft, output:dj, score:score, createdAt:new Date().toISOString() });
      global.MUSIC_ENGINE.runs = global.MUSIC_ENGINE.runs.slice(0,25);
    }
    return res.json({ ok:true, mode:'chain', input:draft, zay:zay, riya:riya, output:dj, score:score, createdAt:new Date().toISOString() });
  } catch(e) { return res.status(500).json({ ok:false, error:e.message }); }
});

app.post('/api/music/strategy', async function(req, res) {
  var body = req.body || {};
  var draft = body.draft || '';
  try {
    var answer = await groqChat(SP.music, 'Provide a music release and monetization strategy for this draft:\n' + draft + '\n\nCover: release timing, sync opportunities, hook strength, distribution strategy.', 768);
    return res.json({ ok:true, title:'Music Strategy Brief', answer:answer, createdAt:new Date().toISOString() });
  } catch(e) { return res.status(500).json({ ok:false, error:e.message }); }
});

app.post('/api/music/dna/save', async function(req, res) {
  var body = req.body || {};
  var dna = global.MUSIC_PLATFORM.artistDNA;
  dna.artist = body.artist || dna.artist || 'Current Artist';
  dna.styleTerms = Array.isArray(body.styleTerms) ? body.styleTerms : dna.styleTerms;
  dna.weights = Object.assign({}, dna.weights, body.weights || {});
  dna.updatedAt = new Date().toISOString();
  try {
    var insight = await groqChat(SP.music, 'Artist: ' + dna.artist + '\nStyle: ' + dna.styleTerms.join(', ') + '\n\nAnalyze this artist DNA and suggest 3 directions to push their sound.', 400);
    dna.aiInsight = insight;
  } catch(e) { dna.aiInsight = null; }
  return res.json({ ok:true, dna:dna });
});

app.post('/api/music/song/learn', async function(req, res) {
  var body = req.body || {};
  var song = { id:Date.now(), title:body.title||'Untitled', lyrics:body.lyrics||body.draft||'', learnedAt:new Date().toISOString() };
  global.MUSIC_PLATFORM.artistDNA.learnedSongs.unshift(song);
  global.MUSIC_PLATFORM.artistDNA.learnedSongs = global.MUSIC_PLATFORM.artistDNA.learnedSongs.slice(0,12);
  try {
    var analysis = await groqChat(SP.music, 'Analyze these lyrics for cadence, emotion, structure, imagery. Score each 0-1 and identify the strongest hook:\n\n' + song.lyrics, 400);
    song.aiAnalysis = analysis;
  } catch(e) { song.aiAnalysis = null; }
  return res.json({ ok:true, song:song, dna:global.MUSIC_PLATFORM.artistDNA });
});

app.get('/api/music/activity', function(_req, res) {
  return res.json({ ok:true, activity:global.MUSIC_PLATFORM.activity||[], platform:global.MUSIC_PLATFORM });
});

app.get('/api/music/platform', function(_req, res) {
  return res.json({ ok:true, platform:global.MUSIC_PLATFORM });
});

app.post('/api/music/revision/generate', async function(req, res) {
  var body = req.body || {};
  var draft = body.draft || '';
  var request = body.request || 'Give me 3 revision options';
  try {
    var results = await Promise.all([
      groqChat(SP.music, 'Flow-first revision. Cadence and bounce.\nRequest: ' + request + '\nDraft: ' + draft + '\nOption A:', 400),
      groqChat(SP.music, 'Emotion-first revision. Imagery and vulnerability.\nRequest: ' + request + '\nDraft: ' + draft + '\nOption B:', 400),
      groqChat(SP.music, 'Hook-first revision. Structure and repeatability.\nRequest: ' + request + '\nDraft: ' + draft + '\nOption C:', 400)
    ]);
    var options = [
      { id:'A', title:'Option A - Flow First', strategy:'Cadence and bounce', output:results[0] },
      { id:'B', title:'Option B - Emotion First', strategy:'Imagery and vulnerability', output:results[1] },
      { id:'C', title:'Option C - Hook First', strategy:'Structure and repeatability', output:results[2] }
    ];
    var session = { id:Date.now(), request:request, input:draft, options:options, recommended:'A', createdAt:new Date().toISOString() };
    if (!global.MUSIC_REVISIONS) global.MUSIC_REVISIONS = { sessions:[], selected:null };
    global.MUSIC_REVISIONS.sessions.unshift(session);
    global.MUSIC_REVISIONS.sessions = global.MUSIC_REVISIONS.sessions.slice(0,20);
    return res.json({ ok:true, session:session });
  } catch(e) { return res.status(500).json({ ok:false, error:e.message }); }
});

app.post('/api/ai/query', async function(req, res) {
  var body = req.body || {};
  var appType = body.app || 'enterprise';
  var question = body.question || body.query || body.input || '';
  var context = body.context || '';
  var system = SP[appType] || SP.enterprise;
  try {
    var userMsg = context ? 'Context:\n' + context + '\n\nQuestion: ' + question : question;
    var answer = await groqChat(system, userMsg, body.maxTokens || 1024);
    return res.json({ ok:true, app:appType, question:question, answer:answer, createdAt:new Date().toISOString() });
  } catch(e) { return res.status(500).json({ ok:false, error:e.message }); }
});

app.post('/api/hc/query', async function(req, res) {
  var body = req.body || {};
  try { var a = await groqChat(SP.healthcare, body.question||body.query||'', body.maxTokens||1024); return res.json({ ok:true, answer:a, createdAt:new Date().toISOString() }); }
  catch(e) { return res.status(500).json({ ok:false, error:e.message }); }
});

app.post('/api/financial/query', async function(req, res) {
  var body = req.body || {};
  try { var a = await groqChat(SP.financial, body.question||body.query||'', body.maxTokens||1024); return res.json({ ok:true, answer:a, createdAt:new Date().toISOString() }); }
  catch(e) { return res.status(500).json({ ok:false, error:e.message }); }
});

app.post('/api/mortgage/query', async function(req, res) {
  var body = req.body || {};
  try { var a = await groqChat(SP.mortgage, body.question||body.query||'', body.maxTokens||1024); return res.json({ ok:true, answer:a, createdAt:new Date().toISOString() }); }
  catch(e) { return res.status(500).json({ ok:false, error:e.message }); }
});

app.post('/api/legal/query', async function(req, res) {
  var body = req.body || {};
  try { var a = await groqChat(SP.legal, body.question||body.query||'', body.maxTokens||1024); return res.json({ ok:true, answer:a, createdAt:new Date().toISOString() }); }
  catch(e) { return res.status(500).json({ ok:false, error:e.message }); }
});

app.post('/api/construction/query', async function(req, res) {
  var body = req.body || {};
  try { var a = await groqChat(SP.construction, body.question||body.query||'', body.maxTokens||1024); return res.json({ ok:true, answer:a, createdAt:new Date().toISOString() }); }
  catch(e) { return res.status(500).json({ ok:false, error:e.message }); }
});

app.post('/api/insurance/query', async function(req, res) {
  var body = req.body || {};
  try { var a = await groqChat(SP.insurance, body.question||body.query||'', body.maxTokens||1024); return res.json({ ok:true, answer:a, createdAt:new Date().toISOString() }); }
  catch(e) { return res.status(500).json({ ok:false, error:e.message }); }
});

app.post('/api/schools/query', async function(req, res) {
  var body = req.body || {};
  try { var a = await groqChat(SP.education, body.question||body.query||'', body.maxTokens||1024); return res.json({ ok:true, answer:a, createdAt:new Date().toISOString() }); }
  catch(e) { return res.status(500).json({ ok:false, error:e.message }); }
});

app.post('/api/strategist/query', async function(req, res) {
  var body = req.body || {};
  try { var a = await groqChat(SP.strategist, body.question||body.query||'', body.maxTokens||2048); return res.json({ ok:true, answer:a, createdAt:new Date().toISOString() }); }
  catch(e) { return res.status(500).json({ ok:false, error:e.message }); }
});
// ===== END GROQ AI ENGINE =====
app.use((req,res) => res.status(404).send('Not found: '+req.path));

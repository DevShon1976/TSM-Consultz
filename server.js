const express = require('express');

process.on('uncaughtException', (err) => {
  console.error('💥 UNCAUGHT EXCEPTION:', err.message, err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 UNHANDLED REJECTION at:', promise, 'reason:', reason);
});

const path = require("path");
const fs = require("fs");
const https = require('https');

const app = express();
const PORT = process.env.PORT || 8080;
const HTML_ROOT = path.join(__dirname, "html");

app.use(express.json());

// ── GROQ AI ENGINE ───────────────────────────────────────────────────────────
function groqChat(system, user, maxTokens) {
  maxTokens = maxTokens || 1024;
  return new Promise(function (resolve, reject) {
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
    var req = https.request(options, function (res) {
      var data = '';
      res.on('data', function (chunk) { data += chunk; });
      res.on('end', function () {
        try {
          var parsed = JSON.parse(data);
          var text = parsed.choices && parsed.choices[0] && parsed.choices[0].message
            ? parsed.choices[0].message.content : 'No response.';
          resolve(text);
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function tsmAIJSON(prompt, fallback) {
  try {
    if (!process.env.GROQ_API_KEY) throw new Error("GROQ_API_KEY missing");
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.TSM_MODEL || 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are TSM Neural Core. Never mention provider, model, API, or implementation. Return JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: .22, max_tokens: 1200
      })
    });
    if (!r.ok) throw new Error("AI unavailable");
    const data = await r.json();
    const text = data?.choices?.[0]?.message?.content || "";
    try { return JSON.parse(text.replace(/```json|```/g, '').trim()); }
    catch (e) { return { ...fallback, narrative: text }; }
  } catch (e) {
    return { ...fallback, ai_status: 'fallback' };
  }
}

// ── SYSTEM PROMPTS ───────────────────────────────────────────────────────────
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

// ── GLOBAL STATE ─────────────────────────────────────────────────────────────
global.MUSIC_PLATFORM = global.MUSIC_PLATFORM || {
  artistDNA: { status: 'active', artist: 'Current Artist', styleTerms: ['pain', 'resilience'], weights: { cadence: 0.88, emotion: 0.91, structure: 0.76, imagery: 0.82 }, learnedSongs: [] },
  agentRuns: [], activity: []
};
global.MUSIC_SUITE_STATE = global.MUSIC_SUITE_STATE || {
  artistsOnline: 12, releasesDropping: 3, monthlyStreams: '84M', revenueMTD: 847400, pipelineValue: 2400000, aiStatus: 'online'
};
const TSM_MEMORY = global.__TSM_MEMORY__ = global.__TSM_MEMORY__ || {
  healthcare: { nodes: {}, hcStrategist: null, mainStrategist: null, executive: null }
};
const TSM_MESH = {
  HEALTHCARE: { owner: "HC Strategist", controller: "Healthcare Command", risks: ["Revenue leakage", "Denial escalation", "Patient throughput degradation", "Compliance exposure"] },
  CONSTRUCTION: { owner: "Construction Strategist", controller: "Construction Command", risks: ["Permit delays", "Schedule variance", "Cost overrun", "Supply chain disruption"] },
  FINANCE: { owner: "Financial Strategist", controller: "Financial Command", risks: ["Margin compression", "Payer variance", "Cash flow slowdown", "Revenue forecasting deviation"] }
};

const suites = [
  { route: "/construction", dir: "html/construction-suite", index: "construction-hub.html" },
  { route: "/finops", dir: "html/finops-suite", index: "finops-presentation/index.html" },
  { route: "/healthcare", dir: "html/healthcare", index: "index.html" },
  { route: "/insurance", dir: "html/tsm-insurance", index: "ins-presentation.html" },
  { route: "/music", dir: "html/music-command", index: "index.html" },
];

// ── HEALTH & STUB ROUTES ─────────────────────────────────────────────────────
app.get("/health", (req, res) => res.json({ status: "ok" }));
app.post("/api/bpo/query", (req, res) => res.json({ reply: "ok" }));
app.post("/api/wip/sector-ai", (req, res) => res.json({ content: "ok" }));

app.get("/api/hc/strategist-rollup", (req, res) => {
  res.json({ ok: true, controller: "HC STRATEGIST", status: "ROLLUP ACTIVE", nodes_online: 11, executive_escalations: 3, bnca: "Enterprise healthcare synthesis complete", mesh: true, timestamp: new Date().toISOString() });
});

app.get('/api/hc/nodes', (req, res) => {
  res.json({ ok: true, status: 'HC node route online', nodes: ['operations', 'billing', 'medical', 'pharmacy', 'financial', 'legal', 'vendors', 'compliance', 'tax-prep', 'grants', 'insurance'] });
});

app.get('/api/music/activity', (_req, res) => res.json({ ok: true, activity: global.MUSIC_PLATFORM.activity || [], platform: global.MUSIC_PLATFORM }));
app.get('/api/music/platform', (_req, res) => res.json({ ok: true, platform: global.MUSIC_PLATFORM }));
app.get('/executive-portal', (req, res) => res.redirect('/html/executive-portal/index.html'));
app.get('/healthcare/executive-portal', (req, res) => res.redirect('/html/executive-portal/index.html'));

// ── STATIC MOUNTS ────────────────────────────────────────────────────────────
const dirPath = path.join(__dirname, 'html');

app.use("/html", express.static(path.join(__dirname, "html"), { setHeaders: (res) => res.setHeader('Cache-Control', 'no-store') }));
app.use("/js", express.static(path.join(__dirname, "html/js")));
app.use("/bpo", express.static(path.join(__dirname, "html/bpo")));
app.use("/shared", express.static(path.join(__dirname, "html/bpo/shared")));
app.use("/insurance", express.static(path.join(__dirname, "html/tsm-insurance")));
app.use("/construction", express.static(path.join(__dirname, "html/construction-suite")));
app.use(express.static(dirPath));
app.use(express.static(__dirname));

// ── HC NODE ROUTES ───────────────────────────────────────────────────────────
app.get('/html/hc-strategist', (req, res) => res.redirect('/healthcare/hc-strategist/'));
app.get('/html/hc-strategist/', (req, res) => res.redirect('/healthcare/hc-strategist/'));
app.get('/html/hc-strategist/index.html', (req, res) => res.redirect('/healthcare/hc-strategist/'));

['hc-medical','hc-billing','hc-vendors','hc-grants','hc-insurance','hc-legal','hc-operations','hc-financial','hc-taxprep','hc-compliance','hc-pharmacy','hc-strategist'].forEach(function(node) {
  var dir = path.join(__dirname, 'html/healthcare', node);
  app.use('/healthcare/' + node, express.static(dir, { setHeaders: (res) => res.setHeader('Cache-Control', 'no-store') }));
  app.get('/healthcare/' + node, (req, res) => { res.setHeader('Cache-Control', 'no-store,no-cache,must-revalidate'); res.sendFile(path.join(dir, 'index.html')); });
  app.get('/healthcare/' + node + '/', (req, res) => { res.setHeader('Cache-Control', 'no-store,no-cache,must-revalidate'); res.sendFile(path.join(dir, 'index.html')); });
});

// ── SUITE ROUTES ─────────────────────────────────────────────────────────────
suites.forEach(s => {
  if (!s.route || !s.index) return;
  app.get(s.route, (req, res) => res.sendFile(path.join(dirPath, s.index)));
  app.get(`${s.route}/`, (req, res) => res.sendFile(path.join(dirPath, s.index)));
});

// ── API ROUTES ───────────────────────────────────────────────────────────────
app.post('/api/hc/query', async (req, res) => {
  try {
    var body = req.body || {};
    var sys = body.system || SP.healthcare;
    var msg = body.message || body.question || body.query;
    if (!msg) return res.status(400).json({ ok: false, error: 'Query required' });
    var a = await groqChat(sys, msg, body.maxTokens || 1024);
    return res.json({ ok: true, output: a, answer: a, createdAt: new Date().toISOString() });
  } catch (e) { return res.status(500).json({ ok: false, error: e.message }); }
});

app.post('/api/music/structure', async (req, res) => {
  try {
    var body = req.body || {};
    var sys = 'You are ZAY, a world-class music producer. Build a detailed song structure/blueprint. Return sections, BPM suggestion, key, mood, and arrangement notes.';
    var msg = body.query || body.prompt || `Build a song blueprint. Genre: ${body.genre||'Hip-Hop'}, Mood: ${body.mood||'Motivational'}, Theme: ${body.theme||'hustle and perseverance'}, Artist style: ${body.artist||'versatile'}`;
    var a = await groqChat(sys, msg, 1024);
    return res.json({ ok: true, output: a, structure: a });
  } catch (e) { return res.status(500).json({ ok: false, error: e.message }); }
});

app.post('/api/music/hooks/generate10', async (req, res) => {
  try {
    var body = req.body || {};
    var sys = 'You are ZAY, a world-class songwriter. Generate exactly 10 distinct, catchy, numbered hook options. Make them memorable and genre-appropriate.';
    var msg = body.query || `Generate 10 hook options. Genre: ${body.genre||'Hip-Hop'}, Mood: ${body.mood||'Motivational'}, Theme: ${body.theme||'hustle'}, Artist style: ${body.artist||'versatile'}`;
    var a = await groqChat(sys, msg, 1024);
    return res.json({ ok: true, output: a, hooks: a });
  } catch (e) { return res.status(500).json({ ok: false, error: e.message }); }
});

app.post('/api/music/hooks', async (req, res) => {
  try {
    var body = req.body || {};
    var sys = 'You are ZAY, a world-class songwriter. Generate 10 distinct, catchy hook options. Number each one. Make them memorable and genre-appropriate.';
    var msg = body.query || `Generate 10 hook options. Genre: ${body.genre||'Hip-Hop'}, Mood: ${body.mood||'Motivational'}, Theme: ${body.theme||'hustle'}`;
    var a = await groqChat(sys, msg, 1024);
    return res.json({ ok: true, output: a, hooks: a });
  } catch (e) { return res.status(500).json({ ok: false, error: e.message }); }
});

app.post('/api/music/song', async (req, res) => {
  try {
    var body = req.body || {};
    var sys = 'You are ZAY, a world-class songwriter. Write complete, full song lyrics. Include all sections: intro, verse 1, pre-chorus, chorus, verse 2, bridge, outro. Make it professional and authentic.';
    var msg = body.query || `Write a complete song. Genre: ${body.genre||'Hip-Hop'}, Mood: ${body.mood||'Motivational'}, Hook: ${body.hook||''}, Theme: ${body.theme||'hustle'}`;
    var a = await groqChat(sys, msg, 2048);
    return res.json({ ok: true, output: a, lyrics: a });
  } catch (e) { return res.status(500).json({ ok: false, error: e.message }); }
});

app.post('/api/music/coach', async (req, res) => {
  try {
    var body = req.body || {};
    var sys = 'You are ZAY, a real music producer and artist coach. Keep responses direct, real, and helpful. Under 80 words unless asked for more.';
    var msg = body.query || body.message || 'How can I improve my song?';
    var a = await groqChat(sys, msg, 512);
    return res.json({ ok: true, output: a, content: a, reply: a });
  } catch (e) { return res.status(500).json({ ok: false, error: e.message }); }
});

app.post('/api/music/st', async (req, res) => {
  try {
    var body = req.body || {};
    var sys = 'You are ZAY, a world-class music producer. Build a detailed song structure/blueprint.';
    var msg = body.query || body.message || 'Build a song blueprint.';
    await tsmAIJSOvar a = await tsmAIJSON(sys + '\n\n' + msg, 'No response.'); return res.json({ ok: true, output: a, structure: a });
  } catch (e) { return res.status(500).json({ ok: false, error: e.message }); }
});

app.post('/api/hc/query', async (req, res) => {
  try {
    var body = req.body || {};
    if (!body.question && !body.query) return res.status(400).json({ ok: false, error: 'Query required' });
    await tsmAIJSON(SP.healthcare + '\n\n' + (body.question || body.query), 'No response.')
  } catch (e) { return res.status(500).json({ ok: false, error: e.message }); }
});

app.post('/api/hc/ask', async (req, res) => {
  try {
    var body = req.body || {};
    if (!body.message || !body.message.trim()) return res.status(400).json({ ok: false, error: 'Message is required' });
    await tsmAIJSON((body.system || SP.healthcare) + '\n\n' + body.message, 'No response.')
    return res.json({ ok: true, content: a });
  } catch (e) { return res.status(500).json({ ok: false, error: e.message }); }
});

app.post('/api/hc/triage', async (req, res) => {
  try {
    const { client='', taskType='', department='', priority='P3', deadline='', description='', notes='' } = req.body || {};
    if (!description) return res.status(400).json({ ok: false, error: 'Description is required' });
    const sp = `You are an expert Healthcare BPO triage AI for TSM. Respond in this EXACT format:\nPRIORITY: [P1-CRITICAL / P2-HIGH / P3-MEDIUM / P4-LOW]\nDEPARTMENT: [best-fit department]\nROUTE_TO: [Billing & Coding / Clinical Operations / Compliance / Executive / Finance / Provider Relations]\nURGENCY_REASON: [1 sentence max]\nRECOMMENDED_ACTION: [2-4 bullet points starting with •]\nESCALATE_TO_STRATEGIST: [YES / NO]\nESCALATE_REASON: [1 sentence, or N/A]\nESTIMATED_RESOLUTION: [timeframe]`;
    const result = await groqChat(sp, `Client: ${client}\nTask Type: ${taskType}\nDepartment: ${department}\nPriority: ${priority}\nDeadline: ${deadline}\nDescription: ${description}\nNotes: ${notes}`);
    res.json({ ok: true, content: result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

app.post('/api/hc/strategist', async (req, res) => {
  try {
    const { task={}, aiTriage='', query='' } = req.body || {};
    const sp = `You are the TSM Healthcare BPO Strategist. Produce executive-grade strategy in this EXACT format:\nSTRATEGIC_SUMMARY: [2-3 sentences]\nROOT_CAUSE: [1 sentence]\nIMPACT_LEVEL: [HIGH / MEDIUM / LOW] — [impact in 1 sentence]\nRECOMMENDED_STRATEGY:\n• [Action 1]\n• [Action 2]\n• [Action 3]\nOWNER_LANES: [departments]\nTIMELINE: [Day 1-2: ... / Week 1: ...]\nESCALATE_TO_EXECUTIVE: [YES / NO]\nESCALATE_REASON: [1 sentence, or N/A]\nCONFIDENCE: [percentage]`;
    const result = await groqChat(sp, `TASK: ${JSON.stringify(task)}\nTRIAGE_OUTPUT: ${aiTriage}\nQUERY: ${query || 'Full strategic assessment'}`);
    res.json({ ok: true, content: result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

app.post('/api/hc/layer2', async (req, res) => {
  try {
    const { system: org='TSM Healthcare', location='' } = req.body || {};
    const sp = `You are a senior Healthcare BPO enterprise strategist for ${org}${location?' · '+location:''}. Synthesize findings across ALL nodes. Return structured BNCA:\n\nENTERPRISE BNCA SUMMARY\n========================\nTOP RISKS (ranked by revenue impact):\n1. [Risk · Node · $ impact]\n2. [Risk · Node · $ impact]\n3. [Risk · Node · $ impact]\n\nIMMEDIATE ACTIONS (next 48 hours):\n1. [Action · Owner Lane · Expected outcome]\n2. [Action · Owner Lane · Expected outcome]\n3. [Action · Owner Lane · Expected outcome]\n\n30-DAY RECOVERY PLAN:\n[Concise cross-node plan with milestones]\n\nESCALATE_TO_EXECUTIVE: YES/NO\nESCALATE_REASON: [reason if YES]\nCONFIDENCE: [0-100]%`;
    const result = await groqChat(sp, `Run full enterprise BNCA for ${org}${location?' at '+location:''}`, 1500);
    res.json({ ok: true, output: result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

app.post('/api/hc/node/:node', async (req, res) => {
  const node = req.params.node;
  const payload = req.body || {};
  const result = await tsmAIJSON(`Analyze healthcare node ${node}. Payload: ${JSON.stringify(payload).slice(0,4000)}. Return JSON: {"node":"${node}","status":"READY|WATCH|RISK","top_issue":"...","findings":[],"actions":[],"bnca":"...","owner_lane":"...","confidence":0}`,
    { node, status:'WATCH', top_issue:'Node requires review', findings:[], actions:[], bnca:'Review node output.', owner_lane:'office manager', confidence:80 });
  TSM_MEMORY.healthcare.nodes[node] = result;
  res.json({ ok: true, node, result, ts: new Date().toISOString() });
});

app.post('/api/hc/bnca', async (req, res) => {
  const payload = req.body || {};
  const result = await tsmAIJSON(`Healthcare Command BNCA. Nodes: ${JSON.stringify(TSM_MEMORY.healthcare.nodes).slice(0,6000)}. Payload: ${JSON.stringify(payload).slice(0,4000)}. Return JSON: {"suite":"healthcare-command","top_issue":"...","risk_level":"READY|WATCH|RISK|URGENT","node_summary":[],"bnca":"...","owner_lanes":[],"hitl_review_required":true,"confidence":0}`,
    { suite:'healthcare-command', top_issue:'Review needed', risk_level:'WATCH', node_summary:[], bnca:'Prioritize billing/auth/compliance.', owner_lanes:['office manager'], hitl_review_required:true, confidence:82 });
  TSM_MEMORY.healthcare.hcCommand = result;
  res.json({ ok: true, result, ts: new Date().toISOString() });
});

app.post('/api/hc-strategist/bnca', async (req, res) => {
  const payload = req.body || {};
  const result = await tsmAIJSON(`HC Strategist synthesis. Memory: ${JSON.stringify(TSM_MEMORY.healthcare).slice(0,8000)}. Payload: ${JSON.stringify(payload).slice(0,4000)}. Return JSON: {"suite":"hc-strategist","strategic_summary":"...","priority_actions":[],"bnca":"...","relay_to_main_strategist":true,"confidence":0}`,
    { suite:'hc-strategist', strategic_summary:'HC Strategist review needed.', priority_actions:[], bnca:'Relay to Main Strategist.', relay_to_main_strategist:true, confidence:82 });
  TSM_MEMORY.healthcare.hcStrategist = result;
  res.json({ ok: true, result, ts: new Date().toISOString() });
});

app.post('/api/main-strategist/healthcare', async (req, res) => {
  const payload = req.body || {};
  const result = await tsmAIJSON(`Main Strategist executive package. Memory: ${JSON.stringify(TSM_MEMORY.healthcare).slice(0,9000)}. Return JSON: {"suite":"main-strategist","executive_issue":"...","financial_or_operational_impact":"...","recommendation":"...","decision_options":[],"hitl_relay":"...","send_to_executive_portal":true,"confidence":0}`,
    { suite:'main-strategist', executive_issue:'Healthcare readiness needs review.', financial_or_operational_impact:'Billing pressure may affect throughput.', recommendation:'Start office manager workflow pilot.', decision_options:['30-day pilot'], hitl_relay:'Review BNCA and confirm owner lanes.', send_to_executive_portal:true, confidence:84 });
  TSM_MEMORY.healthcare.mainStrategist = result;
  res.json({ ok: true, result, ts: new Date().toISOString() });
});

app.post('/api/executive/portal', async (req, res) => {
  const payload = req.body || {};
  const result = await tsmAIJSON(`Executive Portal. Memory: ${JSON.stringify(TSM_MEMORY.healthcare).slice(0,10000)}. Return JSON: {"portal":"executive","audience":"CFO / Decision Maker","decision_summary":"...","bnca_recommendation":"...","hitl_script":"...","approval_path":[],"next_step":"...","confidence":0}`,
    { portal:'executive', audience:'CFO / Decision Maker', decision_summary:'Healthcare BNCA ready.', bnca_recommendation:'Approve pilot workflow.', hitl_script:'Action-ready recommendation and owner lanes for approval.', approval_path:['Office Manager','CFO'], next_step:'Book walkthrough or approve 30-day pilot.', confidence:85 });
  TSM_MEMORY.healthcare.executive = result;
  res.json({ ok: true, result, ts: new Date().toISOString() });
});

// ── FINOPS ───────────────────────────────────────────────────────────────────
app.post("/api/finops/bnca/report", (req, res) => res.json({ ok: true }));
app.post("/api/chat", (req, res) => res.json({ ok: true }));

// ── MUSIC ────────────────────────────────────────────────────────────────────
app.post('/api/music/agent-pass', async (req, res) => {
  var body = req.body || {};
  var agent = body.agent || 'ZAY';
  var draft = body.draft || body.lyrics || '';
  var request = body.request || 'Refine this draft';
  try {
    var output = await groqChat(SP.music, 'Agent: ' + agent + '\nRequest: ' + request + '\n\nDraft:\n' + draft + '\n\nProvide your refined version:', 512);
    return res.json({ ok: true, agent: agent, output: output, createdAt: new Date().toISOString() });
  } catch (e) { return res.status(500).json({ ok: false, error: e.message }); }
});

app.post('/api/music/chain', async (req, res) => {
  var body = req.body || {};
  var draft = body.draft || '';
  var request = body.request || 'Sharpen this draft';
  try {
    var zay = await groqChat(SP.music, 'Agent ZAY cadence/flow focus.\nRequest: ' + request + '\nDraft: ' + draft + '\nRefine:', 400);
    var riya = await groqChat(SP.music, 'Agent RIYA emotion/imagery focus.\nRequest: ' + request + '\nDraft: ' + zay + '\nRefine:', 400);
    var dj = await groqChat(SP.music, 'Agent DJ hook/structure focus.\nRequest: ' + request + '\nDraft: ' + riya + '\nFinal version:', 400);
    return res.json({ ok: true, mode: 'chain', input: draft, zay, riya, output: dj, score: { overall: 0.87 }, createdAt: new Date().toISOString() });
  } catch (e) { return res.status(500).json({ ok: false, error: e.message }); }
});

app.post('/api/music/strategy', async (req, res) => {
  var body = req.body || {};
  try {
    var answer = await groqChat(SP.music, 'Provide a music release and monetization strategy for this draft:\n' + (body.draft || '') + '\n\nCover: release timing, sync opportunities, hook strength, distribution strategy.', 768);
    return res.json({ ok: true, title: 'Music Strategy Brief', answer, createdAt: new Date().toISOString() });
  } catch (e) { return res.status(500).json({ ok: false, error: e.message }); }
});

app.post('/api/music/revision/run', async (req, res) => {
  const { lyrics, agent='ZAY' } = req.body;
  const result = await tsmAIJSON(`You are music agent ${agent}. Revise these lyrics. Return JSON: { revised, cadence, emotion, structure, imagery, decision }. Lyrics: ${lyrics}`,
    { revised: lyrics, cadence: 75, emotion: 75, structure: 75, imagery: 75, decision: 'No change' });
  res.json({ ok: true, ...result });
});

app.post('/api/music/revision/generate', async (req, res) => {
  var body = req.body || {};
  var draft = body.draft || '';
  var request = body.request || 'Give me 3 revision options';
  try {
    var results = await Promise.all([
      groqChat(SP.music, 'Flow-first revision.\nRequest: ' + request + '\nDraft: ' + draft + '\nOption A:', 400),
      groqChat(SP.music, 'Emotion-first revision.\nRequest: ' + request + '\nDraft: ' + draft + '\nOption B:', 400),
      groqChat(SP.music, 'Hook-first revision.\nRequest: ' + request + '\nDraft: ' + draft + '\nOption C:', 400)
    ]);
    var options = [
      { id:'A', title:'Option A - Flow First', strategy:'Cadence and bounce', output: results[0] },
      { id:'B', title:'Option B - Emotion First', strategy:'Imagery and vulnerability', output: results[1] },
      { id:'C', title:'Option C - Hook First', strategy:'Structure and repeatability', output: results[2] }
    ];
    var session = { id: Date.now(), request, input: draft, options, recommended:'A', createdAt: new Date().toISOString() };
    if (!global.MUSIC_REVISIONS) global.MUSIC_REVISIONS = { sessions: [], selected: null };
    global.MUSIC_REVISIONS.sessions.unshift(session);
    global.MUSIC_REVISIONS.sessions = global.MUSIC_REVISIONS.sessions.slice(0, 20);
    return res.json({ ok: true, session });
  } catch (e) { return res.status(500).json({ ok: false, error: e.message }); }
});

app.post('/api/music/guidance', async (req, res) => {
  const { lyrics, step, dna } = req.body;
  const stepNames = { 1:'Drop Idea', 2:'Pick Version', 3:'Refine', 4:'Lock Hook', 5:'Export' };
  const result = await tsmAIJSON(`You are ZAY. User on Step ${step} (${stepNames[step]||step}). Lyrics: ${lyrics||'none'}. DNA: ${JSON.stringify(dna||{})}. Give ONE sharp tip. Return JSON: { tip, action }`,
    { tip: 'Keep going — your instincts are strong.', action: 'Run the chain.' });
  res.json({ ok: true, ...result });
});

app.post('/api/music/dna/save', async (req, res) => {
  var body = req.body || {};
  var dna = global.MUSIC_PLATFORM.artistDNA;
  dna.artist = body.artist || dna.artist;
  dna.styleTerms = Array.isArray(body.styleTerms) ? body.styleTerms : dna.styleTerms;
  dna.weights = Object.assign({}, dna.weights, body.weights || {});
  dna.updatedAt = new Date().toISOString();
  try { dna.aiInsight = await groqChat(SP.music, 'Artist: ' + dna.artist + '\nStyle: ' + dna.styleTerms.join(', ') + '\n\nSuggest 3 directions to push their sound.', 400); }
  catch (e) { dna.aiInsight = null; }
  return res.json({ ok: true, dna });
});

app.post('/api/music/song/learn', async (req, res) => {
  var body = req.body || {};
  var song = { id: Date.now(), title: body.title || 'Untitled', lyrics: body.lyrics || body.draft || '', learnedAt: new Date().toISOString() };
  global.MUSIC_PLATFORM.artistDNA.learnedSongs.unshift(song);
  global.MUSIC_PLATFORM.artistDNA.learnedSongs = global.MUSIC_PLATFORM.artistDNA.learnedSongs.slice(0, 12);
  try { song.aiAnalysis = await groqChat(SP.music, 'Analyze these lyrics for cadence, emotion, structure, imagery. Score each 0-1:\n\n' + song.lyrics, 400); }
  catch (e) { song.aiAnalysis = null; }
  return res.json({ ok: true, song, dna: global.MUSIC_PLATFORM.artistDNA });
});

// ── AI QUERY ROUTES ──────────────────────────────────────────────────────────
app.post('/api/ai/query', async (req, res) => {
  var body = req.body || {};
  var appType = body.app || 'enterprise';
  var question = body.question || body.query || body.input || '';
  var system = SP[appType] || SP.enterprise;
  try {
    var userMsg = body.context ? 'Context:\n' + body.context + '\n\nQuestion: ' + question : question;
    var answer = await groqChat(system, userMsg, body.maxTokens || 1024);
    return res.json({ ok: true, app: appType, question, answer, createdAt: new Date().toISOString() });
  } catch (e) { return res.status(500).json({ ok: false, error: e.message }); }
});

app.post('/api/financial/query', async (req, res) => {
  try { var a = await groqChat(SP.financial, req.body.question || req.body.query || '', req.body.maxTokens || 1024); return res.json({ ok: true, answer: a, createdAt: new Date().toISOString() }); }
  catch (e) { return res.status(500).json({ ok: false, error: e.message }); }
});

app.post('/api/mortgage/query', async (req, res) => {
  try { var a = await groqChat(SP.mortgage, req.body.question || req.body.query || '', req.body.maxTokens || 1024); return res.json({ ok: true, answer: a, createdAt: new Date().toISOString() }); }
  catch (e) { return res.status(500).json({ ok: false, error: e.message }); }
});

app.post('/api/legal/query', async (req, res) => {
  try { var a = await groqChat(SP.legal, req.body.question || req.body.query || '', req.body.maxTokens || 1024); return res.json({ ok: true, answer: a, createdAt: new Date().toISOString() }); }
  catch (e) { return res.status(500).json({ ok: false, error: e.message }); }
});

app.post('/api/construction/query', async (req, res) => {
  try { var a = await groqChat(SP.construction, req.body.question || req.body.query || '', req.body.maxTokens || 1024); return res.json({ ok: true, answer: a, createdAt: new Date().toISOString() }); }
  catch (e) { return res.status(500).json({ ok: false, error: e.message }); }
});

app.post('/api/insurance/query', async (req, res) => {
  const { system, message, maxTokens, question, query } = req.body || {};
  const msg = message || question || query || '';
  if (!msg) return res.status(400).json({ ok: false, error: 'message required' });
  try { const answer = await groqChat(system || SP.insurance, msg, maxTokens || 1400); res.json({ ok: true, answer }); }
  catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.post('/api/insurance/quiz', async (req, res) => {
  const { topic, state, lob, count } = req.body || {};
  const prompt = `Generate ${count||10} exam-level multiple choice questions for "${topic}" on the ${state} ${lob} insurance licensing exam. Return ONLY a JSON array: [{"q":"Question?","options":["A","B","C","D"],"answer":0,"explanation":"..."}]`;
  try {
    const raw = await groqChat('You are an insurance licensing exam question writer. Respond ONLY with valid JSON — no markdown, no backticks.', prompt, 2200);
    res.json({ ok: true, questions: JSON.parse(raw.replace(/```json|```/g,'').trim()) });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.post('/api/insurance/flashcards', async (req, res) => {
  const { topic, state, lob } = req.body || {};
  const prompt = `Create 15 flashcards for "${topic}" on the ${state} ${lob} insurance exam. Return ONLY JSON: [{"term":"Term","definition":"..."}]`;
  try {
    const raw = await groqChat('You are an insurance exam flashcard creator. Respond ONLY with valid JSON.', prompt, 1400);
    res.json({ ok: true, cards: JSON.parse(raw.replace(/```json|```/g,'').trim()) });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.post('/api/insurance/ahip', async (req, res) => {
  const { moduleTitle, moduleId } = req.body || {};
  try {
    const answer = await groqChat('You are a Medicare insurance compliance expert and AHIP certification trainer. Format with HTML only.', `Create a comprehensive AHIP study guide for: "${moduleTitle}".`, 1600);
    res.json({ ok: true, answer, moduleId });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.post('/api/insurance/ahip-quiz', async (req, res) => {
  const { count } = req.body || {};
  const prompt = `Generate ${count||25} AHIP-style multiple choice questions. Return ONLY JSON: [{"q":"Question?","options":["A","B","C","D"],"answer":0,"explanation":"..."}]`;
  try {
    const raw = await groqChat('You are an AHIP Medicare certification exam question writer. Respond ONLY with valid JSON.', prompt, 2800);
    res.json({ ok: true, questions: JSON.parse(raw.replace(/```json|```/g,'').trim()) });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.post('/api/schools/query', async (req, res) => {
  try { var a = await groqChat(SP.education, req.body.question || req.body.query || '', req.body.maxTokens || 1024); return res.json({ ok: true, answer: a, createdAt: new Date().toISOString() }); }
  catch (e) { return res.status(500).json({ ok: false, error: e.message }); }
});

app.post('/api/strategist/query', async (req, res) => {
  try { var a = await groqChat(SP.strategist, req.body.question || req.body.query || '', req.body.maxTokens || 2048); return res.json({ ok: true, answer: a, createdAt: new Date().toISOString() }); }
  catch (e) { return res.status(500).json({ ok: false, error: e.message }); }
});

// ── MISC ROUTES ──────────────────────────────────────────────────────────────
app.get(['/html/healthcare/poc-html', '/html/healthcare/poc-html/'], (req, res) => res.sendFile(path.join(dirPath, 'healthcare', 'poc-html', 'index.html')));
app.get("/_debug", (_req, res) => res.json({ dirname: __dirname, dirPath, suitesConfigured: suites.length }));
app.get("/", (_req, res) => {
  res.sendFile(path.join(dirPath, 'bpo', 'bpo-command-center.html'), (err) => {
    if (err) res.sendFile(path.join(dirPath, 'healthcare', 'hc-strategist', 'index.html'));
  });
});

// ── START ────────────────────────────────────────────────────────────────────
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`TSM Platform Core Engine listening on port ${PORT}`);
});

server.on('error', (err) => {
  console.error('💥 SERVER ERROR:', err.message, err.stack);
});
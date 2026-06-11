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

// ── GLOBAL NO-CACHE ───────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

app.use((req, res, next) => {
  res.setHeader('Surrogate-Control', 'no-store');
  res.setHeader('CDN-Cache-Control', 'no-store');
  next();
});

// ── GROQ AI ENGINE ────────────────────────────────────────────────────────────
// Primary: fetch-based (reliable on Railway)
const GROQ_MODELS = [
  'llama-3.3-70b-versatile',
  'llama3-70b-8192',
  'llama3-8b-8192',
  'gemma2-9b-it'
];

async function groqChat(system, message, maxTokens) {
  const groqKey = process.env.GROQ_KEY || process.env.GROQ_API_KEY;
  for (const model of GROQ_MODELS) {
    try {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + groqKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          messages: [{ role: 'system', content: system }, { role: 'user', content: message }]
        })
      });
      if (!r.ok) {
        const err = await r.text();
        if (r.status === 429 || r.status === 503) continue;
        throw new Error('Groq API error ' + r.status + ': ' + err);
      }
      const data = await r.json();
      return data?.choices?.[0]?.message?.content || '';
    } catch (e) {
      if (e.message.includes('429') || e.message.includes('rate_limit')) continue;
      throw e;
    }
  }
  throw new Error('All Groq models rate limited. Try again later.');
}
  // using fetch directly
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + groqKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: message }
      ]
    })
  });
  if (!r.ok) {
    const errText = await r.text();
    throw new Error('Groq API error ' + r.status + ': ' + errText);
  }
  const data = await r.json();
  return data?.choices?.[0]?.message?.content || '';
}

// JSON-returning variant for structured routes
async function tsmAIJSON(prompt, fallback) {
  try {
    const groqKey = process.env.GROQ_KEY || process.env.GROQ_API_KEY;
  if (!groqKey) return res.status(500).json({ error: 'GROQ_KEY not configured on server.' });
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + groqKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.TSM_MODEL || 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are TSM Neural Core. Never mention provider, model, API, or implementation. Return JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.22,
        max_tokens: 1200
      })
    });
    if (!r.ok) throw new Error('AI unavailable');
    const data = await r.json();
    const text = data?.choices?.[0]?.message?.content || '';
    try { return JSON.parse(text.replace(/```json|```/g, '').trim()); }
    catch (e) { return typeof fallback === 'object' ? { ...fallback, narrative: text } : { narrative: text }; }
  } catch (e) {
    return typeof fallback === 'object' ? { ...fallback, ai_status: 'fallback' } : { ai_status: 'fallback' };
  }
}

// ── SYSTEM PROMPTS ────────────────────────────────────────────────────────────
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

// ── GLOBAL STATE ──────────────────────────────────────────────────────────────
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
  HEALTHCARE: { owner: 'HC Strategist', controller: 'Healthcare Command', risks: ['Revenue leakage', 'Denial escalation', 'Patient throughput degradation', 'Compliance exposure'] },
  CONSTRUCTION: { owner: 'Construction Strategist', controller: 'Construction Command', risks: ['Permit delays', 'Schedule variance', 'Cost overrun', 'Supply chain disruption'] },
  FINANCE: { owner: 'Financial Strategist', controller: 'Financial Command', risks: ['Margin compression', 'Payer variance', 'Cash flow slowdown', 'Revenue forecasting deviation'] }
};

const suites = [
  { route: '/construction', dir: 'html/construction-suite', index: 'construction-hub.html' },
  { route: '/finops', dir: 'html/finops-suite', index: 'finops-presentation/index.html' },
  { route: '/healthcare', dir: 'html/healthcare', index: 'index.html' },
  { route: '/insurance', dir: 'html/tsm-insurance', index: 'ins-presentation.html' },
  { route: '/music', dir: 'html/music-command', index: 'index.html' },
];

// ── HEALTH & STUB ROUTES ──────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.post('/api/bpo/query', (req, res) => res.json({ reply: 'ok' }));
app.post('/api/wip/sector-ai', (req, res) => res.json({ content: 'ok' }));

app.get('/api/hc/strategist-rollup', (req, res) => {
  res.json({ ok: true, controller: 'HC STRATEGIST', status: 'ROLLUP ACTIVE', nodes_online: 11, executive_escalations: 3, bnca: 'Enterprise healthcare synthesis complete', mesh: true, timestamp: new Date().toISOString() });
});

app.get('/api/hc/nodes', (req, res) => {
  res.json({ ok: true, status: 'HC node route online', nodes: ['operations', 'billing', 'medical', 'pharmacy', 'financial', 'legal', 'vendors', 'compliance', 'tax-prep', 'grants', 'insurance'] });
});

app.get('/api/music/activity', (_req, res) => res.json({ ok: true, activity: global.MUSIC_PLATFORM.activity || [], platform: global.MUSIC_PLATFORM }));
app.get('/api/music/platform', (_req, res) => res.json({ ok: true, platform: global.MUSIC_PLATFORM }));
app.get('/executive-portal', (req, res) => res.redirect('/html/executive-portal/index.html'));
app.get('/healthcare/executive-portal', (req, res) => res.redirect('/html/executive-portal/index.html'));

// ── STATIC MOUNTS ─────────────────────────────────────────────────────────────
const dirPath = path.join(__dirname, 'html');// ── STATIC MOUNTS v2 ──

app.use('/html', express.static(path.join(__dirname, 'html'), { setHeaders: (res) => res.setHeader('Cache-Control', 'no-store') }));
app.use('/js', express.static(path.join(__dirname, 'html/tsm-insurance/public/js')));
app.use('/js', express.static(path.join(__dirname, 'html/js')));
app.use('/bpo', express.static(path.join(__dirname, 'html/bpo')));
app.use('/shared', express.static(path.join(__dirname, 'html/bpo/shared')));
app.use('/insurance', express.static(path.join(__dirname, 'html/tsm-insurance')));
app.use('/construction', express.static(path.join(__dirname, 'html/construction-suite')));
app.use(express.static(dirPath));
app.use(express.static(__dirname));

// ── HC NODE ROUTES ────────────────────────────────────────────────────────────
app.get('/html/hc-strategist', (req, res) => res.redirect('/healthcare/hc-strategist/'));
app.get('/html/hc-strategist/', (req, res) => res.redirect('/healthcare/hc-strategist/'));
app.get('/html/hc-strategist/index.html', (req, res) => res.redirect('/healthcare/hc-strategist/'));

['hc-medical','hc-billing','hc-vendors','hc-grants','hc-insurance','hc-legal','hc-operations','hc-financial','hc-taxprep','hc-compliance','hc-pharmacy','hc-strategist'].forEach(function(node) {
  var dir = path.join(__dirname, 'html/healthcare', node);
  app.use('/healthcare/' + node, express.static(dir, { setHeaders: (res) => res.setHeader('Cache-Control', 'no-store') }));
  app.get('/healthcare/' + node, (req, res) => { res.setHeader('Cache-Control', 'no-store,no-cache,must-revalidate'); res.sendFile(path.join(dir, 'index.html')); });
  app.get('/healthcare/' + node + '/', (req, res) => { res.setHeader('Cache-Control', 'no-store,no-cache,must-revalidate'); res.sendFile(path.join(dir, 'index.html')); });
});

// ── SUITE ROUTES ──────────────────────────────────────────────────────────────
suites.forEach(s => {
  if (!s.route || !s.index) return;
  app.get(s.route, (req, res) => res.sendFile(path.join(dirPath, s.index)));
  app.get(s.route + '/', (req, res) => res.sendFile(path.join(dirPath, s.index)));
});

// ── HC API ROUTES ─────────────────────────────────────────────────────────────
app.post('/api/hc/query', async (req, res) => {
  try {
    var body = req.body || {};
    var sys = body.system || SP.healthcare;
    var msg = body.message || body.question || body.query;
    if (!msg) return res.status(400).json({ ok: false, error: 'Query required' });
    var a = await groqChat(sys, msg, body.maxTokens || 1024);
    console.log('[HC QUERY DEBUG] a =', JSON.stringify(a));
    return res.json({ ok: true, output: a, answer: a, createdAt: new Date().toISOString() });
  } catch (e) { console.log('[HC ERROR]', e.message); return res.status(500).json({ ok: false, error: e.message }); }
});

const clientUsage = {}; // v3

app.post('/api/hc/stream', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const { model, sys, user, maxTok } = req.body;
  if (!sys || !user) return res.status(400).json({ error: 'Missing sys or user' });

  const clientId = req.ip;
  const today = new Date().toDateString();
  const key = clientId + '_' + today;
  clientUsage[key] = (clientUsage[key] || 0) + 1;
  if (clientUsage[key] > 20) {
    return res.status(429).json({ error: 'Daily analysis limit reached. Contact TSM to upgrade.' });
  }

  const groqKey = process.env.GROQ_KEY || process.env.GROQ_API_KEY;
if (!groqKey) return res.status(500).json({ error: 'GROQ_KEY not configured on server.' });

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + (process.env.GROQ_KEY || process.env.GROQ_API_KEY)
      },
      body: JSON.stringify({
        model: model || 'llama-3.3-70b-versatile',
        stream: true,
        max_tokens: maxTok || 500,
        messages: [{ role: 'system', content: sys }, { role: 'user', content: user }]
      })
    });

    if (!groqRes.ok) {
      const err = await groqRes.json();
      return res.status(502).json({ error: err.error?.message || 'Groq error' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    const { Readable } = require('stream');
    Readable.fromWeb(groqRes.body).pipe(res);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/hc/ask', async (req, res) => {
  try {
    var body = req.body || {};
    if (!body.message || !body.message.trim()) return res.status(400).json({ ok: false, error: 'Message is required' });
    var a = await groqChat(body.system || SP.healthcare, body.message, 1024);
    return res.json({ ok: true, output: a, content: a });
  } catch (e) { return res.status(500).json({ ok: false, error: e.message }); }
});

app.post('/api/hc/triage', async (req, res) => {
  try {
    const { client='', taskType='', department='', priority='P3', deadline='', description='', notes='' } = req.body || {};
    if (!description) return res.status(400).json({ ok: false, error: 'Description is required' });
    const sp = `You are an expert Healthcare BPO triage AI for TSM. Respond in this EXACT format:\nPRIORITY: [P1-CRITICAL / P2-HIGH / P3-MEDIUM / P4-LOW]\nDEPARTMENT: [best-fit department]\nROUTE_TO: [Billing & Coding / Clinical Operations / Compliance / Executive / Finance / Provider Relations]\nURGENCY_REASON: [1 sentence max]\nRECOMMENDED_ACTION: [2-4 bullet points starting with •]\nESCALATE_TO_STRATEGIST: [YES / NO]\nESCALATE_REASON: [1 sentence, or N/A]\nESTIMATED_RESOLUTION: [timeframe]`;
    const result = await groqChat(sp, `Client: ${client}\nTask Type: ${taskType}\nDepartment: ${department}\nPriority: ${priority}\nDeadline: ${deadline}\nDescription: ${description}\nNotes: ${notes}`, 1024);
    res.json({ ok: true, content: result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

app.post('/api/hc/strategist', async (req, res) => {
  try {
    const { task={}, aiTriage='', query='' } = req.body || {};
    const sp = `You are the TSM Healthcare BPO Strategist. Produce executive-grade strategy in this EXACT format:\nSTRATEGIC_SUMMARY: [2-3 sentences]\nROOT_CAUSE: [1 sentence]\nIMPACT_LEVEL: [HIGH / MEDIUM / LOW] — [impact in 1 sentence]\nRECOMMENDED_STRATEGY:\n• [Action 1]\n• [Action 2]\n• [Action 3]\nOWNER_LANES: [departments]\nTIMELINE: [Day 1-2: ... / Week 1: ...]\nESCALATE_TO_EXECUTIVE: [YES / NO]\nESCALATE_REASON: [1 sentence, or N/A]\nCONFIDENCE: [percentage]`;
    const result = await groqChat(sp, `TASK: ${JSON.stringify(task)}\nTRIAGE_OUTPUT: ${aiTriage}\nQUERY: ${query || 'Full strategic assessment'}`, 1024);
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

// ── TSM Candidate Sync Routes ──
const candidateStore = []; // swap for DB later

// POST /api/candidate/submit  — called by candidate-intake.html
app.post('/api/candidate/submit', (req, res) => {
  const entry = {
    id: 'cand_' + Date.now(),
    timestamp: new Date().toISOString(),
    new: true,
    ...req.body
  };
  candidateStore.unshift(entry);
  if(candidateStore.length > 500) candidateStore.length = 500;
  res.json({ ok: true, id: entry.id });
});

// GET /api/candidate/list  — polled by wia2.html recruiter dashboard
app.get('/api/candidate/list', (req, res) => {
  res.json(candidateStore);
});

// POST /api/candidate/clear-new  — marks all as seen
app.post('/api/candidate/clear-new', (req, res) => {
  candidateStore.forEach(c => c.new = false);
  res.json({ ok: true });
});

// ── MUSIC API ROUTES ──────────────────────────────────────────────────────────
app.post('/api/music/structure', async (req, res) => {
  try {
    var body = req.body || {};
    var sys = 'You are ZAY, a world-class music producer. Build a detailed song structure/blueprint. Return sections, BPM suggestion, key, mood, and arrangement notes. Write in plain text.';
    var msg = body.query || body.prompt || `Build a song blueprint. Genre: ${body.genre||'Hip-Hop'}, Mood: ${body.mood||'Motivational'}, Theme: ${body.theme||'hustle and perseverance'}, Artist style: ${body.artist||'versatile'}`;
    var a = await groqChat(sys, msg, 1200);
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

app.post('/api/music/revision/run', async (req, res) => {
  try {
    var body = req.body || {};
    var sys = 'You are ZAY, a world-class songwriter. Revise the provided lyrics based on the notes given. Return only the revised lyrics.';
    var msg = `Original lyrics:\n${body.lyrics||''}\n\nRevision notes: ${body.notes||''}\n\nHook to preserve: ${body.hook||''}\nGenre: ${body.genre||'Hip-Hop'}`;
    var a = await groqChat(sys, msg, 2048);
    return res.json({ ok: true, output: a, content: a });
  } catch (e) { return res.status(500).json({ ok: false, error: e.message }); }
});

app.post('/api/music/strategy', async (req, res) => {
  try {
    var body = req.body || {};
    var sys = 'You are ZAY, an expert music industry strategist. Create a detailed release strategy and marketing plan.';
    var msg = body.query || `Create a release strategy for a ${body.genre||'Hip-Hop'} song titled "${body.title||'Untitled'}" with theme: ${body.theme||''}. Artist style: ${body.artist||'independent'}. Cover: release timeline, DSP strategy, playlist targeting, social media rollout, sync licensing, marketing angles.`;
    var a = await groqChat(sys, msg, 1200);
    return res.json({ ok: true, output: a, answer: a });
  } catch (e) { return res.status(500).json({ ok: false, error: e.message }); }
});

app.post('/api/music/guidance', async (req, res) => {
  try {
    var body = req.body || {};
    var sys = 'You are ZAY, a music industry expert. Provide industry guidance and career development advice for independent artists.';
    var msg = body.query || `Provide industry guidance for an independent ${body.genre||'Hip-Hop'} artist. Artist style: ${body.artist||'independent'}. Theme: ${body.theme||''}. Cover: career development, networking, monetization, next steps.`;
    var a = await groqChat(sys, msg, 1200);
    return res.json({ ok: true, output: a, answer: a });
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

// ── FINOPS ────────────────────────────────────────────────────────────────────
app.post('/api/finops/bnca/report', (req, res) => res.json({ ok: true }));
app.post('/api/chat', (req, res) => res.json({ ok: true }));

// ── AI QUERY ROUTES ───────────────────────────────────────────────────────────
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
  catch (e) { console.error('GROQ ERROR:', e.message); res.status(500).json({ ok: false, error: e.message, detail: e.stack }); }
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

// ── MISC ROUTES ───────────────────────────────────────────────────────────────
app.get(['/html/healthcare/poc-html', '/html/healthcare/poc-html/'], (req, res) => res.sendFile(path.join(dirPath, 'healthcare', 'poc-html', 'index.html')));
app.get('/_debug', (_req, res) => res.json({ dirname: __dirname, dirPath, suitesConfigured: suites.length, cacheBust: 'v2-20260607' }));
app.get('/', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.sendFile(path.join(dirPath, 'bpo', 'bpo-command-center.html'), (err) => {
    if (err) res.sendFile(path.join(dirPath, 'healthcare', 'hc-strategist', 'index.html'));
  });
});

/* ════════════════════════════════════════════════════════════════
   DOC ROUTER — paste this block into server.js
   Placement: anywhere after `const app = express()` and after
   `app.use(express.json(...))`, before `app.listen(...)`.
   Requires: process.env.GROQ_API_KEY already set (same as other nodes).
   Requires: Node 18+ for global fetch (already a project requirement).
════════════════════════════════════════════════════════════════ */

// Models — verify current availability in Groq console if these change
const GROQ_TEXT_MODEL   = 'llama-3.3-70b-versatile';
const GROQ_VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

// Valid node IDs per vertical — keep in sync with VERTICALS in
// tsm-document-search.html if you add/rename nodes.
const DOC_ROUTER_NODES = {
  fo:  ['fo-financial', 'fo-accounting', 'fo-pitch', 'fo-bpo', 'fo-demo', 'fo-index', 'strategist'],
  ins: ['ins-az', 'ins-hub', 'ins-bpo', 'ins-pitch', 'ins-index', 'strategist'],
  con: ['con-hub', 'con-pitch', 'con-permits', 'con-strategist', 'con-bpo', 'con-demo', 'con-index', 'strategist'],
  bpo: ['bpo-cmd', 'bpo-int1', 'bpo-access', 'bpo-launch', 'bpo-sops', 'bpo-sales', 'bpo-services', 'bpo-website', 'strategist'],
  re:  ['re-uploader', 're-war-room', 're-strategist', 're-exec', 're-guide', 'strategist'],
  leg: ['leg-index', 'leg-ediscovery', 'leg-strategist', 'leg-exec', 'strategist'],
  hc:  ['hc-denial', 'strategist'],
};

const DOC_ROUTER_DOC_TYPES = [
  'CLAIM', 'CLAIM APPEAL', 'POLICY', 'VENDOR INVOICE', 'LEDGER',
  'PERMIT', 'REMITTANCE', 'DOCUMENT REPORT', 'ESCALATION',
  'CONTRACT', 'FILING', 'TITLE DOCUMENT', 'DENIAL',
];

const DOC_ROUTER_PROMPT = `You are TSM's document routing classifier. Analyze the document content (and filename) and return ONLY valid JSON — no markdown fences, no preamble, no commentary.

Return JSON matching exactly this schema:
{
  "documentType": one of ${JSON.stringify(DOC_ROUTER_DOC_TYPES)},
  "verticals": array, subset of ["fo","ins","con","bpo","re","leg","hc"] — include MULTIPLE verticals if the content is genuinely relevant to more than one (e.g. a vendor invoice tied to a construction project may be relevant to both "con" and "fo"; a property sale with a legal dispute may be relevant to both "re" and "leg"; a claim denial with financial exposure may be relevant to both "hc" and "fo"),
  "primaryVertical": one value from "verticals",
  "routing": {
    "<vertical>": { "sourceNode": "<one valid node id for that vertical>", "nodes": ["<valid node ids...>"] }
    ... one entry for EACH vertical listed in "verticals"
  },
  "fileName": suggested filename ending in ".record",
  "vendor": string or "",
  "invoiceNo": string or "",
  "exclusionCode": string or "",
  "amount": number — dollar exposure/value, 0 if none applicable,
  "client": string or "",
  "ref": string or "",
  "summary": one short sentence describing the document,
  "bnca": boolean — true ONLY if the document represents an anomaly, discrepancy, denial, dispute, or risk that should escalate to BNCA review
}

Valid node IDs per vertical:
fo:  ${DOC_ROUTER_NODES.fo.join(', ')}
ins: ${DOC_ROUTER_NODES.ins.join(', ')}
con: ${DOC_ROUTER_NODES.con.join(', ')}
bpo: ${DOC_ROUTER_NODES.bpo.join(', ')}
re:  ${DOC_ROUTER_NODES.re.join(', ')}
leg: ${DOC_ROUTER_NODES.leg.join(', ')}
hc:  ${DOC_ROUTER_NODES.hc.join(', ')}

Rules:
- Always include "strategist" in routing.<vertical>.nodes for every vertical listed.
- If "bnca" is true, also append "bnca-engine" to routing.<vertical>.nodes for every vertical listed.
- "sourceNode" must be the node most directly responsible for this document type (not "strategist" unless nothing else fits).
- If the document doesn't clearly belong anywhere, return "verticals": [] and leave "routing" as {}.
- Be conservative with "bnca" — only flag genuine anomalies, denials, disputes, code violations, SLA breaches, or financial exposure outliers.`;

// crude in-memory rate limit: 20 requests / 5 min / IP
const docRouterHits = new Map();
function docRouterRateOk(ip) {
  const now = Date.now();
  const hits = (docRouterHits.get(ip) || []).filter(t => now - t < 5 * 60 * 1000);
  if (hits.length >= 20) return false;
  hits.push(now);
  docRouterHits.set(ip, hits);
  return true;
}

app.post('/api/doc-router/classify', async (req, res) => {
  try {
    if (!docRouterRateOk(req.ip)) {
      return res.status(429).json({ error: 'Rate limit exceeded — try again shortly.' });
    }

    const { fileName, mimeType, textContent, imageBase64 } = req.body || {};
    if (!textContent && !imageBase64) {
      return res.status(400).json({ error: 'No content provided.' });
    }

    let userContent;
    let model;

    if (imageBase64) {
      model = GROQ_VISION_MODEL;
      userContent = [
        { type: 'text', text: `Filename: ${fileName || 'unknown'}\n\n${DOC_ROUTER_PROMPT}` },
        { type: 'image_url', image_url: { url: `data:${mimeType || 'image/png'};base64,${imageBase64}` } },
      ];
    } else {
      model = GROQ_TEXT_MODEL;
      userContent = `Filename: ${fileName || 'unknown'}\n\nDocument content:\n${String(textContent).slice(0, 12000)}\n\n${DOC_ROUTER_PROMPT}`;
    }

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'Respond with ONLY valid JSON. No markdown fences, no preamble, no trailing text.' },
          { role: 'user', content: userContent },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error('[doc-router] Groq error:', groqRes.status, errText);
      return res.status(502).json({ error: 'Classification service error.' });
    }

    const data = await groqRes.json();
    let parsed;
    try {
      parsed = JSON.parse(data.choices[0].message.content);
    } catch (e) {
      console.error('[doc-router] Bad JSON from model:', data.choices?.[0]?.message?.content);
      return res.status(502).json({ error: 'Invalid classification response.' });
    }

    res.json(parsed);
  } catch (err) {
    console.error('[doc-router] error:', err);
    res.status(500).json({ error: 'Internal error.' });
  }
});

/* ════════════════════════════════════════════════════════════════
   END DOC ROUTER BLOCK
════════════════════════════════════════════════════════════════ */

// ── START ─────────────────────────────────────────────────────────────────────
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`TSM Platform Core Engine listening on port ${PORT}`);
});

server.on('error', (err) => {
  console.error('💥 SERVER ERROR:', err.message, err.stack);
});


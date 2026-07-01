app.use('/war-rooms', express.static(path.join(__dirname, 'html', 'war-rooms'), { setHeaders: (res) => res.setHeader('Cache-Control', 'no-store') }));
 workflow pilot.', decision_options: ['30-day pilot'], hitl_relay: 'Review BNCA and confirm owner lanes.', send_to_executive_portal: true, confidence: 84 });
  TSM_MEMORY.healthcare.mainStrategist = result;
  res.json({ ok: true, result, ts: new Date().toISOString() });
});

app.post('/api/executive/portal', async (req, res) => {
  const payload = req.body || {};
  const result = await tsmAIJSON(`Executive Portal. Memory: ${JSON.stringify(TSM_MEMORY.healthcare).slice(0, 10000)}. Return JSON: {"portal":"executive","audience":"CFO / Decision Maker","decision_summary":"...","bnca_recommendation":"...","hitl_script":"...","approval_path":[],"next_step":"...","confidence":0}`,
    { portal: 'executive', audience: 'CFO / Decision Maker', decision_summary: 'Healthcare BNCA ready.', bnca_recommendation: 'Approve pilot workflow.', hitl_script: 'Action-ready recommendation and owner lanes for approval.', approval_path: ['Office Manager', 'CFO'], next_step: 'Book walkthrough or approve 30-day pilot.', confidence: 85 });
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
  if (candidateStore.length > 500) candidateStore.length = 500;
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
// Deterministic heuristic used only to rank/gate revision options (not a
// stand-in for AI judgment — the lyric content itself always comes from
// real groqChat() calls above; this just scores text shape for the UI).
function musicHeuristicScore(text){
  var body = String(text || '');
  var lines = body.split(/\n+/).filter(Boolean).length;
  var len = body.length;
  var cadence = Math.min(.99, .72 + (lines >= 2 ? .08 : 0) + (len > 60 ? .06 : 0));
  var emotion = Math.min(.99, .74 + (len > 120 ? .08 : 0));
  var structure = Math.min(.99, .70 + (lines >= 4 ? .12 : .05));
  var imagery = Math.min(.99, .70 + (len > 150 ? .08 : 0));
  var overall = Number(((cadence + emotion + structure + imagery) / 4).toFixed(2));
  return {
    cadence: Number(cadence.toFixed(2)),
    emotion: Number(emotion.toFixed(2)),
    structure: Number(structure.toFixed(2)),
    imagery: Number(imagery.toFixed(2)),
    overall
  };
}

app.post('/api/music/structure', async (req, res) => {
  try {
    var body = req.body || {};
    var sys = 'You are ZAY, a world-class music producer. Build a detailed song structure/blueprint. Return sections, BPM suggestion, key, mood, and arrangement notes. Write in plain text.';
    var msg = body.query || body.prompt || `Build a song blueprint. Genre: ${body.genre || 'Hip-Hop'}, Mood: ${body.mood || 'Motivational'}, Theme: ${body.theme || 'hustle and perseverance'}, Artist style: ${body.artist || 'versatile'}`;
    var a = await groqChat(sys, msg, 1200);
    return res.json({ ok: true, output: a, structure: a });
  } catch (e) { return res.status(500).json({ ok: false, error: e.message }); }
});

app.post('/api/music/hooks/generate10', async (req, res) => {
  try {
    var body = req.body || {};
    var sys = 'You are ZAY, a world-class songwriter. Generate exactly 10 distinct, catchy, numbered hook options. Make them memorable and genre-appropriate.';
    var msg = body.query || `Generate 10 hook options. Genre: ${body.genre || 'Hip-Hop'}, Mood: ${body.mood || 'Motivational'}, Theme: ${body.theme || 'hustle'}, Artist style: ${body.artist || 'versatile'}`;
    var a = await groqChat(sys, msg, 1024);
    return res.json({ ok: true, output: a, hooks: a });
  } catch (e) { return res.status(500).json({ ok: false, error: e.message }); }
});

app.post('/api/music/hooks', async (req, res) => {
  try {
    var body = req.body || {};
    var sys = 'You are ZAY, a world-class songwriter. Generate 10 distinct, catchy hook options. Number each one. Make them memorable and genre-appropriate.';
    var msg = body.query || `Generate 10 hook options. Genre: ${body.genre || 'Hip-Hop'}, Mood: ${body.mood || 'Motivational'}, Theme: ${body.theme || 'hustle'}`;
    var a = await groqChat(sys, msg, 1024);
    return res.json({ ok: true, output: a, hooks: a });
  } catch (e) { return res.status(500).json({ ok: false, error: e.message }); }
});

app.post('/api/music/song', async (req, res) => {
  try {
    var body = req.body || {};
    var sys = 'You are ZAY, a world-class songwriter. Write complete, full song lyrics. Include all sections: intro, verse 1, pre-chorus, chorus, verse 2, bridge, outro. Make it professional and authentic.';
    var msg = body.query || `Write a complete song. Genre: ${body.genre || 'Hip-Hop'}, Mood: ${body.mood || 'Motivational'}, Hook: ${body.hook || ''}, Theme: ${body.theme || 'hustle'}`;
    var a = await groqChat(sys, msg, 2048);
    return res.json({ ok: true, output: a, lyrics: a });
  } catch (e) { return res.status(500).json({ ok: false, error: e.message }); }
});

app.post('/api/music/revision/run', async (req, res) => {
  try {
    var body = req.body || {};
    var sys = 'You are ZAY, a world-class songwriter. Revise the provided lyrics based on the notes given. Return only the revised lyrics.';
    var msg = `Original lyrics:\n${body.lyrics || ''}\n\nRevision notes: ${body.notes || ''}\n\nHook to preserve: ${body.hook || ''}\nGenre: ${body.genre || 'Hip-Hop'}`;
    var a = await groqChat(sys, msg, 2048);
    return res.json({ ok: true, output: a, content: a });
  } catch (e) { return res.status(500).json({ ok: false, error: e.message }); }
});

app.post('/api/music/strategy', async (req, res) => {
  try {
    var body = req.body || {};
    var sys = 'You are ZAY, an expert music industry strategist. Create a detailed release strategy and marketing plan.';
    var msg = body.query || `Create a release strategy for a ${body.genre || 'Hip-Hop'} song titled "${body.title || 'Untitled'}" with theme: ${body.theme || ''}. Artist style: ${body.artist || 'independent'}. Cover: release timeline, DSP strategy, playlist targeting, social media rollout, sync licensing, marketing angles.`;
    var a = await groqChat(sys, msg, 1200);
    return res.json({ ok: true, output: a, answer: a });
  } catch (e) { return res.status(500).json({ ok: false, error: e.message }); }
});

app.post('/api/music/guidance', async (req, res) => {
  try {
    var body = req.body || {};
    var sys = 'You are ZAY, a music industry expert. Provide industry guidance and career development advice for independent artists.';
    var msg = body.query || `Provide industry guidance for an independent ${body.genre || 'Hip-Hop'} artist. Artist style: ${body.artist || 'independent'}. Theme: ${body.theme || ''}. Cover: career development, networking, monetization, next steps.`;
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
  try {
    var body = req.body || {};
    var draft = body.draft || '';
    var request = body.request || 'Give me 3 revision options';
    var results = await Promise.all([
      groqChat(SP.music, 'Flow-first revision.\nRequest: ' + request + '\nDraft: ' + draft + '\nOption A:', 400),
      groqChat(SP.music, 'Emotion-first revision.\nRequest: ' + request + '\nDraft: ' + draft + '\nOption B:', 400),
      groqChat(SP.music, 'Hook-first revision.\nRequest: ' + request + '\nDraft: ' + draft + '\nOption C:', 400)
    ]);
    var scoreA = musicHeuristicScore(results[0]);
    var scoreB = musicHeuristicScore(results[1]);
    var scoreC = musicHeuristicScore(results[2]);
    var options = [
      { id: 'A', title: 'Option A - Flow First', strategy: 'Cadence and bounce', output: results[0], score: scoreA },
      { id: 'B', title: 'Option B - Emotion First', strategy: 'Imagery and vulnerability', output: results[1], score: scoreB },
      { id: 'C', title: 'Option C - Hook First', strategy: 'Structure and repeatability', output: results[2], score: scoreC }
    ];
    var bestOverall = Math.max(scoreA.overall, scoreB.overall, scoreC.overall);
    var recommended = options.find(o => o.score.overall === bestOverall).id;
    var session = { id: Date.now(), request, input: draft, options, recommended, createdAt: new Date().toISOString() };
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

// ── MUSIC API ROUTES (additional engine/revision/dna/billing layer) ───────────
// app.html calls a wider set of /api/music/* endpoints than were defined above
// (agent/run, agent/chain, dna/learn, engine, revision/select, revision/state,
// revision/pick-rerun, dashboard-sync, session/save, export, monetization/state,
// billing/state, billing/upgrade-intent, billing/set-tier-dev, and /api/music/state
// itself) — all of which were 404ing live. routes/music.js already implements
// them with the exact response shapes app.html expects; it just was never
// mounted. Mounted AFTER the routes above so those (already real, Groq-backed)
// inline handlers keep precedence for any overlapping paths.
app.use(require('./routes/music'));

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

app.post('/api/prompt', async (req, res) => {
  try {
    const { key, context } = req.body || {};
    const prompts = {
      doc_controller: 'You are a financial document controller AI. Analyze accounting documents for errors, missing data, and compliance issues. Be precise and actionable.',
      doc_cfo: 'You are a CFO-level financial AI. Provide executive-level analysis of financial documents with strategic recommendations and risk assessment.',
      doc_variance: 'You are a variance analysis AI. Identify budget variances, anomalies, and financial discrepancies. Quantify impact and recommend corrective actions.',
      doc_triage: 'You are a financial document triage AI. Classify document type, extract key fields, flag critical items, and route to appropriate workflow.'
    };
    const prompt = prompts[key] || 'You are a financial operations AI assistant.';
    return res.json({ ok: true, prompt, context: context || '' });
  } catch (e) { return res.status(500).json({ ok: false, error: e.message }); }
});

app.post('/api/financial/query', async (req, res) => {
  try {
    const { system, message, question, query, maxTokens, messages } = req.body || {};
    let msg, sys;
    if (messages && Array.isArray(messages)) {
      sys = messages.find(m => m.role === 'system')?.content || SP.financial;
      msg = messages.find(m => m.role === 'user')?.content || '';
    } else {
      msg = message || question || query || '';
      sys = system || SP.financial;
    }
    if (!msg) return res.status(400).json({ ok: false, error: 'message required' });
    msg = msg.slice(0, 3000);
    let a = '';
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        a = await groqChat(sys, msg, Math.min(maxTokens || 700, 700));
        break;
      } catch(retryErr) {
        if (attempt === 2) throw retryErr;
        await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
      }
    }
    return res.json({ ok: true, answer: a, createdAt: new Date().toISOString() });
  }
  catch (e) {
    console.error('FINANCIAL QUERY ERROR:', e.message);
    return res.status(500).json({ ok: false, error: e.message, detail: e.stack?.slice(0,200) });
  }
});

app.post('/api/mortgage/query', async (req, res) => {
  try { var sys = req.body.context || req.body.system || SP.mortgage; var a = await groqChat(sys, req.body.question || req.body.query || '', req.body.maxTokens || 1024); return res.json({ ok: true, answer: a, createdAt: new Date().toISOString() }); }
  catch (e) { return res.status(500).json({ ok: false, error: e.message }); }
});

app.post('/api/legal/query', async (req, res) => {
  try { var a = await groqChat(SP.legal, req.body.question || req.body.query || '', req.body.maxTokens || 1024); return res.json({ ok: true, answer: a, createdAt: new Date().toISOString() }); }
  catch (e) { return res.status(500).json({ ok: false, error: e.message }); }
});

app.post('/api/construction/query', async (req, res) => {
  try { var a = await groqChat(SP.construction, req.body.question || req.body.query || '', req.body.maxTokens || 400); return res.json({ ok: true, answer: a, createdAt: new Date().toISOString() }); }
  catch (e) { return res.status(500).json({ ok: false, error: e.message }); }
});

app.post('/api/o2c/query', async (req, res) => {
  const { orders, kpis, sla_breaches, stage_distribution, context, maxTokens } = req.body || {};
  if (!Array.isArray(orders)) return res.status(400).json({ ok: false, error: 'orders array required' });
  const summary = JSON.stringify({ kpis, sla_breaches, stage_distribution, order_count: orders.length }, null, 2);
  const prompt = `Current O2C pipeline snapshot:\n${summary}\n\n` +
    (context ? `Additional context: ${context}\n\n` : '') +
    `Identify the top risks, the root cause of any SLA breaches, and the single most important next action for each at-risk order. Be specific and reference order IDs.`;
  try {
    const answer = await groqChat(SP.o2c, prompt, maxTokens || 1200);
    return res.json({ ok: true, answer, createdAt: new Date().toISOString() });
  } catch (e) {
    console.error('O2C GROQ ERROR:', e.message);
    return res.status(500).json({ ok: false, error: e.message });
  }
});


app.post('/api/mdm/query', async (req, res) => {
  const { records, kpis, context, maxTokens } = req.body || {};
  if (!Array.isArray(records)) return res.status(400).json({ ok: false, error: 'records array required' });
  const summary = JSON.stringify({ kpis, record_count: records.length, domains: [...new Set(records.map(r => r.domain))], issues: records.filter(r => r.status !== 'CLEAN').map(r => ({id:r.id,domain:r.domain,status:r.status,quality:r.quality})) }, null, 2);
  const prompt = `MDM snapshot:\n${summary}\n\n` + (context||'') + `\nIdentify duplicate clusters, stale records, quality failures, and the specific stewardship action per record. Reference record IDs.`;
  try { const answer = await groqChat(SP.mdm, prompt, maxTokens || 1200); return res.json({ ok: true, answer, createdAt: new Date().toISOString() }); }
  catch (e) { return res.status(500).json({ ok: false, error: e.message }); }
});


app.post('/api/integration/query', async (req, res) => {
  const { systems, integrations, kpis, context, maxTokens } = req.body || {};
  const summary = JSON.stringify({ kpis, degraded: (systems||[]).filter(s=>s.status!=='up'), error_total: (systems||[]).reduce((a,s)=>a+(s.errors||0),0), warn_integrations: (integrations||[]).filter(i=>i.status!=='ok') }, null, 2);
  const prompt = `Integration Hub snapshot:\n${summary}\n\n` + (context||'') + `\nIdentify the highest-risk interfaces, root cause of errors or latency spikes, and the specific remediation action per affected system.`;
  try { const answer = await groqChat(SP.integration, prompt, maxTokens || 1200); return res.json({ ok: true, answer, createdAt: new Date().toISOString() }); }
  catch (e) { return res.status(500).json({ ok: false, error: e.message }); }
});


app.post('/api/governance/query', async (req, res) => {
  const { controls, risks, audit, kpis, context, maxTokens } = req.body || {};
  const summary = JSON.stringify({ kpis, failed_controls: (controls||[]).filter(c=>c.status!=='PASS'), open_risks: (risks||[]).filter(r=>r.status==='OPEN'), flagged_audit: (audit||[]).filter(a=>a.result!=='OK') }, null, 2);
  const prompt = `Governance snapshot:\n${summary}\n\n` + (context||'') + `\nIdentify the highest-severity compliance failures, open risks, and audit anomalies with specific remediation actions per finding.`;
  try { const answer = await groqChat(SP.governance, prompt, maxTokens || 1200); return res.json({ ok: true, answer, createdAt: new Date().toISOString() }); }
  catch (e) { return res.status(500).json({ ok: false, error: e.message }); }
});


app.post('/api/digital-twin/query', async (req, res) => {
  const { domains, signals, forecasts, health_score, context, maxTokens } = req.body || {};
  const summary = JSON.stringify({ health_score, at_risk_domains: (domains||[]).filter(d=>d.score<75).map(d=>({name:d.name,score:d.score,delta:d.delta})), warn_signals: (signals||[]).filter(s=>s.type!=='ok'), forecasts }, null, 2);
  const prompt = `Enterprise Digital Twin snapshot:\n${summary}\n\n` + (context||'') + `\nGenerate an executive brief: top 3 risks, top 3 opportunities, and the single most important decision required in the next 30 days.`;
  try { const answer = await groqChat(SP.digital_twin, prompt, maxTokens || 1400); return res.json({ ok: true, answer, createdAt: new Date().toISOString() }); }
  catch (e) { return res.status(500).json({ ok: false, error: e.message }); }
});

app.post('/api/crm/query', async (req, res) => {
  const { leads, contacts, accounts, opportunities, cases, kpis, lead_breaches, opp_breaches, case_breaches, context, maxTokens } = req.body || {};
  const summary = JSON.stringify({
    kpis,
    lead_breaches, opp_breaches, case_breaches,
    counts: {
      leads: Array.isArray(leads) ? leads.length : undefined,
      contacts: Array.isArray(contacts) ? contacts.length : undefined,
      accounts: Array.isArray(accounts) ? accounts.length : undefined,
      opportunities: Array.isArray(opportunities) ? opportunities.length : undefined,
      cases: Array.isArray(cases) ? cases.length : undefined
    }
  }, null, 2);
  const prompt = `Current CRM snapshot:\n${summary}\n\n` +
    (context ? `Additional context: ${context}\n\n` : '') +
    `Identify the highest-risk leads/opportunities/cases, the root cause of any SLA breaches or stalled pipeline stages, and the single most important next action for each at-risk record. Reference record IDs.`;
  try {
    const answer = await groqChat(SP.crm, prompt, maxTokens || 1200);
    return res.json({ ok: true, answer, createdAt: new Date().toISOString() });
  } catch (e) {
    console.error('CRM GROQ ERROR:', e.message);
    return res.status(500).json({ ok: false, error: e.message });
  }
});


app.post('/api/approval/query', async (req, res) => {
  const { requests, kpis, sla_breaches, attention_flags, stage_distribution, context, maxTokens } = req.body || {};
  if (!Array.isArray(requests)) return res.status(400).json({ ok: false, error: 'requests array required' });
  const summary = JSON.stringify({ kpis, sla_breaches, attention_flags, stage_distribution, request_count: requests.length }, null, 2);
  const prompt = `Current Approval Center snapshot:\n${summary}\n\n` +
    (context ? `Additional context: ${context}\n\n` : '') +
    `Identify the highest-risk approval requests, root causes of SLA breaches or escalations, delegation conflicts, and the single most important next action per at-risk request. Reference request IDs. Be specific and operational.`;
  try {
    const answer = await groqChat(SP.approval, prompt, maxTokens || 1200);
    return res.json({ ok: true, answer, createdAt: new Date().toISOString() });
  } catch (e) {
    console.error('APPROVAL GROQ ERROR:', e.message);
    return res.status(500).json({ ok: false, error: e.message });
  }
});

app.post('/api/cpq/query', async (req, res) => {
  const { quotes, kpis, sla_breaches, stage_distribution, context, maxTokens } = req.body || {};
  if (!Array.isArray(quotes)) return res.status(400).json({ ok: false, error: 'quotes array required' });
  const summary = JSON.stringify({ kpis, sla_breaches, stage_distribution, quote_count: quotes.length }, null, 2);
  const prompt = `Current CPQ pipeline snapshot:\n${summary}\n\n` +
    (context ? `Additional context: ${context}\n\n` : '') +
    `Identify the top risks across the quote pipeline, root causes of any SLA breaches or margin violations, and the single most important next action for each at-risk quote. Reference quote IDs. Be specific and operational.`;
  try {
    const answer = await groqChat(SP.cpq, prompt, maxTokens || 1200);
    return res.json({ ok: true, answer, createdAt: new Date().toISOString() });
  } catch (e) {
    console.error('CPQ GROQ ERROR:', e.message);
    return res.status(500).json({ ok: false, error: e.message });
  }
});

app.post('/api/catalog/query', async (req, res) => {
  const { products, kpis, attention_flags, lifecycle_distribution, context, maxTokens } = req.body || {};
  if (!Array.isArray(products)) return res.status(400).json({ ok: false, error: 'products array required' });
  const summary = JSON.stringify({ kpis, attention_flags, lifecycle_distribution, product_count: products.length }, null, 2);
  const prompt = `Current Product Catalog snapshot:\n${summary}\n\n` +
    (context ? `Additional context: ${context}\n\n` : '') +
    `Identify the top catalog risks (low-stock, compliance, end-of-life, missing data), root causes, and the single most important next action for each flagged product. Reference SKUs/product IDs. Be specific and operational.`;
  try {
    const answer = await groqChat(SP.catalog, prompt, maxTokens || 1200);
    return res.json({ ok: true, answer, createdAt: new Date().toISOString() });
  } catch (e) {
    console.error('CATALOG GROQ ERROR:', e.message);
    return res.status(500).json({ ok: false, error: e.message });
  }
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
  const prompt = `Generate ${count || 10} exam-level multiple choice questions for "${topic}" on the ${state} ${lob} insurance licensing exam. Return ONLY a JSON array: [{"q":"Question?","options":["A","B","C","D"],"answer":0,"explanation":"..."}]`;
  try {
    const raw = await groqChat('You are an insurance licensing exam question writer. Respond ONLY with valid JSON — no markdown, no backticks.', prompt, 2200);
    res.json({ ok: true, questions: JSON.parse(raw.replace(/```json|```/g, '').trim()) });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.post('/api/insurance/flashcards', async (req, res) => {
  const { topic, state, lob } = req.body || {};
  const prompt = `Create 15 flashcards for "${topic}" on the ${state} ${lob} insurance exam. Return ONLY JSON: [{"term":"Term","definition":"..."}]`;
  try {
    const raw = await groqChat('You are an insurance exam flashcard creator. Respond ONLY with valid JSON.', prompt, 1400);
    res.json({ ok: true, cards: JSON.parse(raw.replace(/```json|```/g, '').trim()) });
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
  const prompt = `Generate ${count || 25} AHIP-style multiple choice questions. Return ONLY JSON: [{"q":"Question?","options":["A","B","C","D"],"answer":0,"explanation":"..."}]`;
  try {
    const raw = await groqChat('You are an AHIP Medicare certification exam question writer. Respond ONLY with valid JSON.', prompt, 2800);
    res.json({ ok: true, questions: JSON.parse(raw.replace(/```json|```/g, '').trim()) });
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
const GROQ_TEXT_MODEL = 'llama-3.3-70b-versatile';
const GROQ_VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

// Valid node IDs per vertical — keep in sync with VERTICALS in
// tsm-document-search.html if you add/rename nodes.
const DOC_ROUTER_NODES = {
  fo: ['fo-financial', 'fo-accounting', 'fo-pitch', 'fo-bpo', 'fo-demo', 'fo-index', 'strategist'],
  ins: ['ins-az', 'ins-hub', 'ins-bpo', 'ins-pitch', 'ins-index', 'strategist'],
  con: ['con-hub', 'con-pitch', 'con-permits', 'con-strategist', 'con-bpo', 'con-demo', 'con-index', 'strategist'],
  bpo: ['bpo-cmd', 'bpo-int1', 'bpo-access', 'bpo-launch', 'bpo-sops', 'bpo-sales', 'bpo-services', 'bpo-website', 'strategist'],
  re: ['re-finance', 're-market', 're-strategist', 're-exec', 're-doc-command', 'strategist'],
  leg: ['leg-index', 'leg-ediscovery', 'leg-strategist', 'leg-exec', 'strategist'],
  hc: ['hc-denial', 'strategist'],
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
  "defectFlags": array of short strings — specific issues/exceptions found in the document. For vertical "re", choose ONLY from this fixed set when applicable: ["Financing Failure","Appraisal Gap","Title Defect","Inspection Issues","UW Conditions","Closing Delay"], and use them to inform routing.re.sourceNode (Financing Failure->re-finance, Appraisal Gap->re-market, Title Defect/UW Conditions->re-strategist, Closing Delay->re-exec, Inspection Issues->re-doc-command). For all other verticals, use concise 2-4 word freeform issue labels relevant to the content (e.g. "Coverage Gap", "Code Violation", "Late Filing"), or [] if no issues are present,
  "bnca": boolean — true ONLY if the document represents an anomaly, discrepancy, denial, dispute, or risk that should escalate to BNCA review
}

Valid node IDs per vertical:
fo:  ${DOC_ROUTER_NODES.fo.join(', ')}
ins: ${DOC_ROUTER_NODES.ins.join(', ')}
con: ${DOC_ROUTER_NODES.con.join(', ')}
bpo: ${DOC_ROUTER_NODES.bpo.join(', ')}
re:  ${DOC_ROUTER_NODES.re.join(', ')}  — finance/dti/loan/mortgage->re-finance, appraisal/valuation/comps->re-market, title/lien/compliance/disclosure->re-strategist, closing/escrow/hoa/wire->re-exec, intake/upload/extract->re-doc-command
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

// ══════════════════════════════════════════════════════════════════════════════
// ── COLLECTIVE BNCA ───────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

const COLLECTIVE_VERTICALS = ['healthcare', 'finops', 'bpo', 'legal', 'real-estate', 'insurance', 'construction', 'o2c', 'crm', 'cpq', 'mdm', 'integration', 'governance'];

const COLLECTIVE_SIGNALS = []; // { vertical, signal, severity, riskLevel, confidence, topIssue, ownerLanes, hitlRequired, actions, impactDelta, kpi, warRoom, bnca, timestamp, source }
const COLLECTIVE_BNCA = [];   // synthesis results

// POST /api/collective/signal — war rooms push their BNCA signal here.
// Accepts both the legacy 3-field shape (vertical, signal, severity) and the
// richer war-room payload (warRoom, bnca, confidence, riskLevel, topIssue,
// ownerLanes, hitlRequired, actions, impactDelta, kpi).
app.post('/api/collective/signal', (req, res) => {
  const {
    vertical, signal, severity, source,
    warRoom, bnca, confidence, riskLevel, topIssue,
    ownerLanes, hitlRequired, actions, impactDelta, kpi
  } = req.body || {};
  if (!vertical) return res.status(400).json({ ok: false, error: 'vertical required' });
  const entry = {
    vertical,
    signal: signal || topIssue || (typeof bnca === 'string' ? bnca.slice(0, 200) : '') || 'War room signal received',
    severity: severity || riskLevel || 'MEDIUM',
    riskLevel: riskLevel || severity || 'WATCH',
    confidence: confidence != null ? confidence : null,
    topIssue: topIssue || '',
    warRoom: warRoom || '',
    bnca: bnca || '',
    ownerLanes: ownerLanes || [],
    hitlRequired: !!hitlRequired,
    actions: actions || [],
    impactDelta: impactDelta || '',
    kpi: kpi || {},
    source: source || '',
    timestamp: Date.now()
  };
  COLLECTIVE_SIGNALS.unshift(entry);
  if (COLLECTIVE_SIGNALS.length > 200) COLLECTIVE_SIGNALS.length = 200;
  res.json({ ok: true, entry });
});

// GET /api/collective/signals — fetch all pushed signals
app.get('/api/collective/signals', (req, res) => {
  res.json({ ok: true, signals: COLLECTIVE_SIGNALS });
});

// DELETE /api/collective/signals — clear all signals
app.delete('/api/collective/signals', (req, res) => {
  COLLECTIVE_SIGNALS.length = 0;
  res.json({ ok: true });
});

// POST /api/collective/bnca — run cross-vertical synthesis via Groq
app.post('/api/collective/bnca', async (req, res) => {
  try {
    if (!COLLECTIVE_SIGNALS.length) return res.status(400).json({ ok: false, error: 'No signals to synthesize' });
    const prompt = `You are TSM's cross-vertical BNCA synthesizer. Given the following signals from multiple verticals, identify: (1) conflicts between verticals, (2) synergies or compounding risks, (3) a ranked HITL decision queue. Respond ONLY in valid JSON with keys: conflicts (array), synergies (array), hitlQueue (array of {priority, vertical, action, rationale}), summary (string).\n\nSignals:\n${JSON.stringify(COLLECTIVE_SIGNALS.slice(0, 50), null, 2)}`;
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'Respond with ONLY valid JSON. No markdown fences, no preamble.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      })
    });
    if (!groqRes.ok) return res.status(502).json({ ok: false, error: 'Groq error' });
    const data = await groqRes.json();
    const parsed = JSON.parse(data.choices[0].message.content);
    const result = { ...parsed, timestamp: Date.now(), signalCount: COLLECTIVE_SIGNALS.length };
    COLLECTIVE_BNCA.unshift(result);
    if (COLLECTIVE_BNCA.length > 20) COLLECTIVE_BNCA.length = 20;
    res.json({ ok: true, bnca: result });
  } catch (err) {
    console.error('[collective/bnca] error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/collective/bnca/latest — fetch most recent synthesis
app.get('/api/collective/bnca/latest', (req, res) => {
  res.json({ ok: true, bnca: COLLECTIVE_BNCA[0] || null });
});

// ══════════════════════════════════════════════════════════════════════════════
// ── END COLLECTIVE BNCA ───────────────════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════════════
// ── WIP / EXECUTION COMMAND CENTER ────────────────────────────────────────────
// Per-vertical: WIP tasks, readiness score, data quality, decision queue, trends.
// ══════════════════════════════════════════════════════════════════════════════


// ── WIP PERSISTENCE LAYER ────────────────────────────────────────────────────
// Backed by Fly Volume mounted at /app/data (see fly.toml [mounts]).
// Falls back to local ./data if volume path is unavailable (local dev).
const WIP_DATA_DIR = fs.existsSync('/app/data') ? '/app/data' : path.join(__dirname, 'data');
if (!fs.existsSync(WIP_DATA_DIR)) fs.mkdirSync(WIP_DATA_DIR, { recursive: true });
const WIP_STATE_FILE = path.join(WIP_DATA_DIR, 'wip-master.json');

function loadWipState() {
  try {
    if (fs.existsSync(WIP_STATE_FILE)) {
      const raw = fs.readFileSync(WIP_STATE_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      return {
        tasks: parsed.tasks || {},
        readiness: parsed.readiness || {},
        dataQuality: parsed.dataQuality || {},
        decisions: parsed.decisions || {},
        trends: parsed.trends || {}
      };
    }
  } catch (err) {
    console.error('[wip-persistence] load failed, starting empty:', err.message);
  }
  return { tasks: {}, readiness: {}, dataQuality: {}, decisions: {}, trends: {} };
}

let wipSaveTimer = null;
function saveWipState() {
  // debounce rapid writes
  if (wipSaveTimer) clearTimeout(wipSaveTimer);
  wipSaveTimer = setTimeout(() => {
    try {
      const snapshot = {
        tasks: WIP_TASKS, readiness: WIP_READINESS, dataQuality: WIP_DATA_QUALITY,
        decisions: WIP_DECISIONS, trends: WIP_TRENDS, savedAt: Date.now()
      };
      fs.writeFileSync(WIP_STATE_FILE, JSON.stringify(snapshot, null, 2));
    } catch (err) {
      console.error('[wip-persistence] save failed:', err.message);
    }
  }, 250);
}

const _WIP_LOADED = loadWipState();
const WIP_TASKS = _WIP_LOADED.tasks;         // vertical -> [ {id, action, owner, status, due, risk, createdAt, updatedAt} ]
const WIP_READINESS = _WIP_LOADED.readiness;     // vertical -> { dataCompleteness, stakeholderCoverage, mitigationPlans, resourceAvailability, openRisks, updatedAt }
const WIP_DATA_QUALITY = _WIP_LOADED.dataQuality;  // vertical -> [ {id, source, status, updatedAt} ]
const WIP_DECISIONS = _WIP_LOADED.decisions;     // vertical -> [ {id, title, impact, cost, recommendation, confidence, status, createdAt, decidedAt} ]
const WIP_TRENDS = _WIP_LOADED.trends;        // vertical -> [ {id, event, date, resolutionHours, notes, createdAt} ]

function ensureWipVertical(v) {
  if (!COLLECTIVE_VERTICALS.includes(v)) return false;
  if (!WIP_TASKS[v]) WIP_TASKS[v] = [];
  if (!WIP_DATA_QUALITY[v]) WIP_DATA_QUALITY[v] = [];
  if (!WIP_DECISIONS[v]) WIP_DECISIONS[v] = [];
  if (!WIP_TRENDS[v]) WIP_TRENDS[v] = [];
  return true;
}

function computeReadinessOverall(r) {
  if (!r) return null;
  const fields = ['dataCompleteness', 'stakeholderCoverage', 'mitigationPlans', 'resourceAvailability', 'openRisks'];
  const vals = fields.map(f => Number(r[f])).filter(n => !isNaN(n));
  if (!vals.length) return null;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

function wipId(prefix) {
  return prefix + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
}

// GET /api/wip/board?vertical=healthcare — combined read for the WIP Command Center page
app.get('/api/wip/board', (req, res) => {
  const v = req.query.vertical;
  if (!ensureWipVertical(v)) return res.status(400).json({ ok: false, error: `vertical must be one of: ${COLLECTIVE_VERTICALS.join(', ')}` });
  const readiness = WIP_READINESS[v] || null;
  res.json({
    ok: true,
    vertical: v,
    tasks: WIP_TASKS[v],
    readiness,
    readinessOverall: computeReadinessOverall(readiness),
    dataQuality: WIP_DATA_QUALITY[v],
    decisions: WIP_DECISIONS[v],
    trends: WIP_TRENDS[v]
  });
});

// ── WIP TASKS ──────────────────────────────────────────────────────────────────
app.post('/api/wip/task', (req, res) => {
  const { vertical, action, owner, status, due, risk } = req.body || {};
  if (!ensureWipVertical(vertical)) return res.status(400).json({ ok: false, error: 'valid vertical required' });
  if (!action) return res.status(400).json({ ok: false, error: 'action required' });
  const task = {
    id: wipId('wip'), action, owner: owner || 'Unassigned', status: status || 'TO DO',
    due: due || '', risk: risk || 'LOW', createdAt: Date.now(), updatedAt: Date.now()
  };
  WIP_TASKS[vertical].unshift(task);
  saveWipState();
  res.json({ ok: true, task });
});

app.patch('/api/wip/task/:id', (req, res) => {
  const { vertical } = req.body || {};
  if (!ensureWipVertical(vertical)) return res.status(400).json({ ok: false, error: 'valid vertical required' });
  const task = WIP_TASKS[vertical].find(t => t.id === req.params.id);
  if (!task) return res.status(404).json({ ok: false, error: 'task not found' });
  Object.assign(task, req.body, { id: task.id, vertical: undefined, updatedAt: Date.now() });
  delete task.vertical;
  saveWipState();
  res.json({ ok: true, task });
});

app.delete('/api/wip/task/:id', (req, res) => {
  const { vertical } = req.body || req.query || {};
  if (!ensureWipVertical(vertical)) return res.status(400).json({ ok: false, error: 'valid vertical required' });
  WIP_TASKS[vertical] = WIP_TASKS[vertical].filter(t => t.id !== req.params.id);
  saveWipState();
  res.json({ ok: true, deleted: req.params.id });
});

// ── READINESS SCORE ────────────────────────────────────────────────────────────
app.post('/api/wip/readiness', (req, res) => {
  const { vertical, dataCompleteness, stakeholderCoverage, mitigationPlans, resourceAvailability, openRisks } = req.body || {};
  if (!ensureWipVertical(vertical)) return res.status(400).json({ ok: false, error: 'valid vertical required' });
  WIP_READINESS[vertical] = { dataCompleteness, stakeholderCoverage, mitigationPlans, resourceAvailability, openRisks, updatedAt: Date.now() };
  saveWipState();
  res.json({ ok: true, readiness: WIP_READINESS[vertical], overall: computeReadinessOverall(WIP_READINESS[vertical]) });
});

// ── DATA QUALITY ───────────────────────────────────────────────────────────────
app.post('/api/wip/data-quality', (req, res) => {
  const { vertical, source, status } = req.body || {};
  if (!ensureWipVertical(vertical)) return res.status(400).json({ ok: false, error: 'valid vertical required' });
  if (!source) return res.status(400).json({ ok: false, error: 'source required' });
  const list = WIP_DATA_QUALITY[vertical];
  const existing = list.find(d => d.source.toLowerCase() === String(source).toLowerCase());
  if (existing) {
    existing.status = status || existing.status;
    existing.updatedAt = Date.now();
    return res.json({ ok: true, entry: existing });
  }
  const entry = { id: wipId('dq'), source, status: status || 'UNKNOWN', updatedAt: Date.now() };
  list.unshift(entry);
  saveWipState();
  res.json({ ok: true, entry });
});

app.delete('/api/wip/data-quality/:id', (req, res) => {
  const { vertical } = req.body || req.query || {};
  if (!ensureWipVertical(vertical)) return res.status(400).json({ ok: false, error: 'valid vertical required' });
  WIP_DATA_QUALITY[vertical] = WIP_DATA_QUALITY[vertical].filter(d => d.id !== req.params.id);
  saveWipState();
  res.json({ ok: true, deleted: req.params.id });
});

// ── EXECUTIVE DECISION QUEUE ────────────────────────────────────────────────────
app.post('/api/wip/decision', (req, res) => {
  const { vertical, title, impact, cost, recommendation, confidence } = req.body || {};
  if (!ensureWipVertical(vertical)) return res.status(400).json({ ok: false, error: 'valid vertical required' });
  if (!title) return res.status(400).json({ ok: false, error: 'title required' });
  const decision = {
    id: wipId('dec'), title, impact: impact || '', cost: cost || '', recommendation: recommendation || '',
    confidence: confidence != null ? confidence : 80, status: 'PENDING', createdAt: Date.now(), decidedAt: null
  };
  WIP_DECISIONS[vertical].unshift(decision);
  saveWipState();
  res.json({ ok: true, decision });
});

app.patch('/api/wip/decision/:id', (req, res) => {
  const { vertical, status } = req.body || {};
  if (!ensureWipVertical(vertical)) return res.status(400).json({ ok: false, error: 'valid vertical required' });
  if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status)) return res.status(400).json({ ok: false, error: 'status must be APPROVED, REJECTED, or PENDING' });
  const decision = WIP_DECISIONS[vertical].find(d => d.id === req.params.id);
  if (!decision) return res.status(404).json({ ok: false, error: 'decision not found' });
  decision.status = status;
  decision.decidedAt = status === 'PENDING' ? null : Date.now();
  saveWipState();
  res.json({ ok: true, decision });
});

// ── TREND INTELLIGENCE ─────────────────────────────────────────────────────────
app.post('/api/wip/trend', (req, res) => {
  const { vertical, event, date, resolutionHours, notes } = req.body || {};
  if (!ensureWipVertical(vertical)) return res.status(400).json({ ok: false, error: 'valid vertical required' });
  if (!event) return res.status(400).json({ ok: false, error: 'event required' });
  const trend = {
    id: wipId('trend'), event, date: date || new Date().toISOString().slice(0, 10),
    resolutionHours: resolutionHours != null ? resolutionHours : null, notes: notes || '', createdAt: Date.now()
  };
  WIP_TRENDS[vertical].unshift(trend);
  saveWipState();
  res.json({ ok: true, trend });
});

// ══════════════════════════════════════════════════════════════════════════════
// ── END WIP / EXECUTION COMMAND CENTER ────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

// ── HEALTH & STUB ROUTES ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[TSM GLOBAL ERROR]', err.message, err.stack);
  if (res.headersSent) return next(err);
  res.status(500).json({ ok: false, error: err.message || 'Internal server error' });
});

// ── START ─────────────────────────────────────────────────────────────────────
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`TSM Platform Core Engine listening on port ${PORT}`);
});

server.on('error', (err) => {
  console.error('💥 SERVER ERROR:', err.message, err.stack);
});
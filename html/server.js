const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(express.json());

// Serve static assets out of root and core subdirectories immediately
app.use(express.static(__dirname));
app.use('/tsm-insurance', express.static(path.join(__dirname, 'tsm-insurance')));
app.use('/sites', express.static(path.join(__dirname, 'sites')));
app.use('/slug', express.static(path.join(__dirname, 'slug')));
app.use('/strategist', express.static(path.join(__dirname, 'strategist')));
app.use('/shared', express.static(path.join(__dirname, 'shared')));
app.use('/runtime', express.static(path.join(__dirname, 'runtime')));

// ================================================
// TSM FINOPS PERSISTENT BACKEND STORAGE
// ================================================
const finopsDataDir = path.join(__dirname, 'data');
const finopsFile = path.join(finopsDataDir, 'finops-actions.json');

function ensureFinopsStore() {
  if (!fs.existsSync(finopsDataDir)) fs.mkdirSync(finopsDataDir, { recursive: true });
  if (!fs.existsSync(finopsFile)) {
    fs.writeFileSync(finopsFile, JSON.stringify({ actions: [], reports: [] }, null, 2));
  }
}

function readFinopsStore() {
  ensureFinopsStore();
  try { return JSON.parse(fs.readFileSync(finopsFile, 'utf8')); }
  catch (e) { return { actions: [], reports: [] }; }
}

function writeFinopsStore(data) {
  ensureFinopsStore();
  fs.writeFileSync(finopsFile, JSON.stringify(data, null, 2));
}

// ================================================
// ENDPOINTS
// ================================================
app.get('/api/finops/actions', (req, res) => {
  const data = readFinopsStore();
  res.json({ ok: true, actions: data.actions || [], reports: data.reports || [] });
});

app.post('/api/finops/action', (req, res) => {
  const data = readFinopsStore();
  const body = req.body || {};
  const action = {
    id: 'finops-' + Date.now(),
    type: body.type || 'GENERAL',
    title: body.title || 'FinOps Action',
    owner: body.owner || 'TSM FinOps Layer',
    status: body.status || 'ACTIONED',
    summary: body.summary || '',
    lane: body.lane || 'Financial Operations',
    ts: new Date().toISOString()
  };
  data.actions = [action, ...(data.actions || [])].slice(0, 200);
  writeFinopsStore(data);
  res.json({ ok: true, action, count: data.actions.length });
});

// Deep Resolution Routing Layer
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ ok: false, error: 'API route not found' });
  }

  const targetPath = path.join(__dirname, req.path);
  const baseFileName = path.basename(req.path);

  // 1. Precise Match Check (Matches explicit nested directory structures)
  if (fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
    return res.sendFile(targetPath);
  }

  // 2. Cross-Directory Scan (Locates files if a custom prefix is present)
  const searchDirs = ['tsm-insurance', 'sites', 'slug', 'strategist', '.'];
  for (const dir of searchDirs) {
    const fallbackCheckPath = path.join(__dirname, dir, baseFileName);
    if (fs.existsSync(fallbackCheckPath) && fs.statSync(fallbackCheckPath).isFile()) {
      return res.sendFile(fallbackCheckPath);
    }
  }

  // 3. Absolute Fallback Home Node
  return res.sendFile(path.join(__dirname, 'hotelops.html'));
});

// ===== HARDCODED PORT BINDING FOR FLY-PROXY MATCH =====
const TARGET_PORT = 8080;
app.listen(TARGET_PORT, '0.0.0.0', () => {
  console.log(`TSM Shell Engine bound to absolute target port ${TARGET_PORT}`);
});
app.use('/finops-suite', express.static(path.join(__dirname, 'finops-suite')));
app.use('/construction-suite', express.static(path.join(__dirname, 'construction-suite')));
app.use('/healthcare-suite', express.static(path.join(__dirname, 'healthcare-suite')));
app.use('/music-command', express.static(path.join(__dirname, 'music-command')));
app.post('/api/financial/query', (req, res) => res.json({answer:'stub'}));
app.post('/api/groq', (req, res) => res.json({answer:'stub'}));
app.use('/html/tsm-insurance', express.static(path.join(__dirname, 'tsm-insurance')));
app.use('/html/finops-suite', express.static(path.join(__dirname, 'finops-suite')));
app.use('/html/construction-suite', express.static(path.join(__dirname, 'construction-suite')));
app.use('/html/healthcare', express.static(path.join(__dirname, 'healthcare')));
app.use('/html/music-command', express.static(path.join(__dirname, 'music-command')));

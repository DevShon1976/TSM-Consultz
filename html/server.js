const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(express.json());
app.use(express.static(__dirname));

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

// SPA Catch-All Route with corrected path references
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ ok: false, error: 'API route not found' });
  }

  const targetPath = path.join(__dirname, req.path);
  
  // Verify if it's a valid directory or trailing slash, default to home page
  fs.stat(targetPath, (err, stats) => {
    if (!err && stats.isFile()) {
      return res.sendFile(targetPath);
    } else {
      // If file doesn't exist on disk, serve the master entrypoint safely
      return res.sendFile(path.join(__dirname, 'hotelops.html'));
    }
  });
});

// ===== FORCE LISTEN FOR FLY.IO =====
app.listen(process.env.PORT || 8080, '0.0.0.0', () => {
  console.log('TSM Shell listening securely on 0.0.0.0:8080');
});

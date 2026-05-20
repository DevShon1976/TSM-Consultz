const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

// FinOps Storage Helpers
const FINOPS_STORE = path.join('/data', 'finops_store.json');
function readFinopsStore() {
  try {
    if (!fs.existsSync(FINOPS_STORE)) return { actions: [], reports: [] };
    return JSON.parse(fs.readFileSync(FINOPS_STORE, 'utf8'));
  } catch (e) { return { actions: [], reports: [] }; }
}
function writeFinopsStore(data) {
  try { fs.writeFileSync(FINOPS_STORE, JSON.stringify(data, null, 2)); } catch (e) {}
}

// Routes
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

app.listen(process.env.PORT || 8080, '0.0.0.0', () => console.log('TSM Shell listening'));

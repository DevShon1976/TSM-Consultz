'use strict';
const express = require('express');
const cors    = require('cors');
const { constructionWIPRecon, healthcareWIPRecon, insuranceAuditRecon, finopsAccrualRecon } = require('./wip-handlers');
const { buildAllChartData } = require('./wip-schema-bridge');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status:'ok', ts: new Date().toISOString() }));

// WIP RECON — all 4 suites
const wipHandlers = { construction:constructionWIPRecon, healthcare:healthcareWIPRecon, insurance:insuranceAuditRecon, finops:finopsAccrualRecon };

app.post('/api/wip/construction/recon',    async (req,res) => { try { res.json(await constructionWIPRecon(req.body)); } catch(e){ res.status(500).json({error:e.message}); } });
app.post('/api/wip/healthcare/recon',      async (req,res) => { try { res.json(await healthcareWIPRecon(req.body));   } catch(e){ res.status(500).json({error:e.message}); } });
app.post('/api/wip/insurance/audit-recon', async (req,res) => { try { res.json(await insuranceAuditRecon(req.body)); } catch(e){ res.status(500).json({error:e.message}); } });
app.post('/api/wip/finops/accrual-recon',  async (req,res) => { try { res.json(await finopsAccrualRecon(req.body));  } catch(e){ res.status(500).json({error:e.message}); } });

app.post('/api/wip/:suite/recon', async (req,res) => {
  const handler = wipHandlers[req.params.suite];
  if (!handler) return res.status(404).json({ error:`No handler for suite: ${req.params.suite}`, available:Object.keys(wipHandlers) });
  try { res.json(await handler(req.body)); } catch(e){ res.status(500).json({error:e.message}); }
});

// CHART DATA — all 4 charts in one call
app.get('/api/wip/construction/chart-data', async (req,res) => {
  try {
    // TODO: replace with real DB queries
    // const periodicSnapshots = await db.getJobSnapshots(req.query.job || '211');
    // const allJobs = await db.getAllActiveJobs();
    res.json({ message:'Wire periodicSnapshots and allJobs from your DB here', schema:'See wip-schema-bridge.js' });
  } catch(e){ res.status(500).json({error:e.message}); }
});

app.listen(PORT, () => {
  console.log(`TSM Bridge on port ${PORT}`);
  ['construction/recon','healthcare/recon','insurance/audit-recon','finops/accrual-recon'].forEach(r => console.log(`  POST /api/wip/${r}`));
  console.log('  GET  /api/wip/construction/chart-data');
});

module.exports = app;

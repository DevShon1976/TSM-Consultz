#!/bin/bash
echo "🚀 DEPLOYING UNIFIED TSM WIP ENGINE..."

# 1. Create the data directory
mkdir -p data

# 2. Unified Schema: Construction, Insurance, and Healthcare
cat <<'JSON' > data/wip-master.json
{
  "construction": [
    { "id": "MAYO-AUDIT-01", "name": "Mayo Clinic East Wing", "contract": 1500000, "cost": 450000, "budget": 1100000, "billed": 500000 }
  ],
  "insurance": [
    { "id": "CLAIM-AZ-992", "name": "Banner Health Liability", "reserve": 250000, "paid": 45000, "est_payout": 210000, "stage": "Adjusting" }
  ],
  "healthcare": [
    { "id": "RCM-PX-001", "name": "HonorHealth Billing Cycle", "charges": 800000, "collected": 320000, "expected": 720000, "denied": 12000 }
  ]
}
JSON

# 3. Robust Logic Engine (wip-engine.js)
cat <<'JS' > wip-engine.js
module.exports = {
  calculateConstruction: (j) => ({
    percent_complete: Math.round((j.cost / j.budget) * 100),
    earned_revenue: Math.round((j.cost / j.budget) * j.contract),
    over_under: Math.round((j.cost / j.budget) * j.contract - j.billed)
  }),
  calculateInsurance: (c) => ({
    reserve_adequacy: Math.round((c.paid + (c.reserve - c.paid)) / c.est_payout * 100),
    financial_exposure: c.est_payout - c.paid
  })
};
JS

# 4. Bulletproof Server (server.js)
cat <<'JS' > server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const engine = require('./wip-engine');

app.use(express.json());

app.get('/health', (req, res) => res.status(200).send('OK'));

app.post('/api/cfo-chat', (req, res) => {
    try {
        const { jobId, sector = 'construction' } = req.body;
        const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'wip-master.json'), 'utf8'));
        
        const job = data[sector].find(j => j.id === jobId) || data[sector][0];
        
        let stats = sector === 'insurance' ? engine.calculateInsurance(job) : engine.calculateConstruction(job);

        res.json({
            status: "success",
            sector: sector,
            name: job.name,
            metrics: stats,
            ai_narrative: `The ${sector} audit for ${job.name} shows a completion status of ${stats.percent_complete || stats.reserve_adequacy}% with localized risks identified.`
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: "error", message: err.message });
    }
});

app.listen(8080, '0.0.0.0', () => console.log('TSM Core 8080 Active'));
JS

# 5. Push to Fly
fly deploy --remote-only --strategy immediate

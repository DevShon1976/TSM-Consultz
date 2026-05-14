#!/bin/bash
echo "🛠️ FINALIZING WIP ARCHITECTURE..."

# 1. Ensure the data directory exists
mkdir -p data

# 2. Create a robust sample dataset for testing
cat <<'JSON' > data/wip-master.json
{
  "jobs": [
    {
      "id": "MAYO-AUDIT-01",
      "name": "Mayo Clinic - East Wing",
      "revised_contract": 1500000,
      "cost_to_date": 450000,
      "est_cost_at_completion": 1100000,
      "billings_to_date": 500000
    }
  ]
}
JSON

# 3. Write a 'safe' server.js that handles missing files
cat <<'JS' > server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const { calculateWIP } = require('./wip-engine');

app.use(express.json());
app.use(express.static('public'));

app.get('/health', (req, res) => res.status(200).send('OK'));

app.post('/api/cfo-chat', (req, res) => {
    const dataPath = path.join(__dirname, 'data', 'wip-master.json');
    
    if (!fs.existsSync(dataPath)) {
        return res.status(500).json({ error: "Data file missing at " + dataPath });
    }

    try {
        const { jobId } = req.body;
        const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        const job = data.jobs.find(j => j.id === jobId) || data.jobs[0];

        const stats = calculateWIP(job);
        res.json({
            answer: `Audit Intelligence: ${job.name} is ${stats.percent_complete}% complete.`,
            stats: stats
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`TSM Shell Logic Core active on 0.0.0.0:${PORT}`);
});
JS

# 4. Deploy with a fresh build to include the 'data' folder
fly deploy --remote-only --strategy immediate

#!/bin/bash
echo "📡 ALIGNING PORTS TO 8080..."

# 1. Force server.js to use port 8080 and listen on 0.0.0.0
cat <<'JS' > server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const { calculateWIP } = require('./wip-engine');

app.use(express.json());
app.use(express.static('public'));

app.post('/api/cfo-chat', async (req, res) => {
    try {
        const { jobId } = req.body;
        const data = JSON.parse(fs.readFileSync('./data/wip-master.json', 'utf8'));
        const job = data.jobs.find(j => j.id === jobId);
        if (!job) return res.status(404).json({ error: "Job not found" });
        
        const stats = calculateWIP(job);
        res.json({
            answer: `Analysis for ${stats.entity}: Project is ${stats.percent_complete}% complete. Position: ${stats.status_label} by $${Math.abs(stats.over_under_val)}.`,
            stats: stats
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CRITICAL FIX: Explicitly bind to 0.0.0.0 and port 8080
const PORT = 8080; 
app.listen(PORT, '0.0.0.0', () => {
    console.log(`TSM Shell Logic Core active on 0.0.0.0:${PORT}`);
});
JS

# 2. Update fly.toml to match (just in case)
if [ -f "fly.toml" ]; then
    sed -i 's/internal_port = .*/internal_port = 8080/g' fly.toml
fi

# 3. Deploy
echo "🚀 RE-DEPLOYING WITH PORT ALIGNMENT..."
fly deploy --remote-only --strategy rolling

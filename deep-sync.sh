#!/bin/bash
echo "🔍 PERFORMING DEEP DIAGNOSTICS & FORCE START..."

# 1. Update fly.toml with a longer grace period for health checks
if [ -f "fly.toml" ]; then
    sed -i 's/grace_period = .*/grace_period = "30s"/g' fly.toml
    # Ensure the services section is explicitly set to 8080
    sed -i 's/internal_port = .*/internal_port = 8080/g' fly.toml
fi

# 2. Kill any hanging processes locally and ensure server.js is exact
cat <<'JS' > server.js
const express = require('express');
const fs = require('fs');
const app = express();
const { calculateWIP } = require('./wip-engine');

app.use(express.json());
app.use(express.static('public'));

app.get('/health', (req, res) => res.status(200).send('OK'));

app.post('/api/cfo-chat', async (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync('./data/wip-master.json', 'utf8'));
        const job = data.jobs[0]; // Default to first job for testing
        const stats = calculateWIP(job);
        res.json({ answer: "CFO Logic Active", stats });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = 8080;
// CRITICAL: Must be 0.0.0.0 for Fly.io
app.listen(PORT, '0.0.0.0', () => {
    console.log(`SERVER_START_SUCCESS: Port ${PORT}`);
});
JS

# 3. Force a Restart of the existing machines to clear the "Unrecoverable Error"
echo "🔄 Forcing machine restart..."
fly machine restart 286919eb742768
fly machine restart 9080d216c1e068

# 4. Final Deploy with immediate strategy to override hanging leases
echo "🚀 Final override deployment..."
fly deploy --strategy immediate --remote-only

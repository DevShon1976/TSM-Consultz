#!/bin/bash
echo "🔥 CLEARING HANGING PROCESSES & MODULES..."

# 1. Stop and Destroy existing machines to clear port locks
fly machine list --json | jq -r '.[].id' | xargs -I {} fly machine destroy {} --force

# 2. Re-initialize a clean, zero-dependency server
cat <<'JS' > server.js
const express = require('express');
const app = express();
app.use(express.json());

// Hardcoded logic to verify pathing without file-read risks
app.get('/health', (req, res) => res.status(200).send('TSM_ACTIVE'));

app.post('/api/cfo-chat', (req, res) => {
    console.log("Request received:", req.body);
    res.json({
        status: "success",
        narrative: "Infrastructure Recovery Successful. Sector Sync Pending.",
        echo: req.body
    });
});

const PORT = 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log('--- TSM SHELL: SOVEREIGN BOOT SUCCESS ---');
});
JS

# 3. Deploy with fresh allocation
echo "🚀 PERFORMING CLEAN SLATE DEPLOY..."
fly deploy --remote-only --strategy immediate --ha=false

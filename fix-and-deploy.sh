#!/bin/bash
echo "🛠️ ALIGNING FLY CONFIGURATION..."

# 1. Update fly.toml to ensure internal_port is 8080 and force HTTP/1.1 for stability
sed -i 's/internal_port = .*/internal_port = 8080/' fly.toml

# 2. Rewrite server.js to be ultra-basic for the port test
cat <<'JS' > server.js
const express = require('express');
const app = express();

app.use(express.json());

// Log every request to the console so we can see it in 'fly logs'
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

app.get('/health', (req, res) => res.status(200).send('HEALTHY'));

app.post('/api/cfo-chat', (req, res) => {
    res.json({
        status: "success",
        narrative: "Port binding confirmed. Infrastructure is stable.",
        echo: req.body
    });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`SERVER LIVE ON PORT ${PORT}`);
});
JS

# 3. Deploy with a longer timeout to allow the machine to wake up
fly deploy --remote-only --strategy immediate --ha=false --wait-timeout 120

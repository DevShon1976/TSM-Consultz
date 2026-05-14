#!/bin/bash
echo "🎨 POLISHING UI AND FIXING SERVER BOOT..."

# 1. Rebuild a clean server.js to ensure no syntax errors from previous appends
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
            answer: `Analysis for ${stats.entity}: Project is ${stats.percent_complete}% complete. Position: ${stats.status_label} by $${Math.abs(stats.over_under_val)}. Action: Align billing to captured costs.`,
            stats: stats
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`TSM Shell Logic Core active on port ${PORT}`);
});
JS

# 2. Create the High-Contrast CFO Sidebar (HTML/CSS)
mkdir -p public
cat <<'HTML' > public/sidebar-component.html
<div id="cfo-sidebar" class="fixed right-0 top-0 h-full w-80 bg-slate-950 border-l border-cyan-500/30 shadow-2xl transition-transform transform translate-x-full z-50">
    <div class="p-6">
        <div class="flex items-center justify-between mb-8">
            <h2 class="text-cyan-400 font-mono text-sm tracking-widest uppercase">CFO Brain v1.0</h2>
            <button onclick="toggleSidebar()" class="text-slate-500 hover:text-white">&times;</button>
        </div>
        
        <div id="ai-insight-box" class="bg-slate-900 border border-cyan-500/20 p-4 rounded mb-6">
            <p class="text-xs text-slate-400 uppercase mb-2">Live Insight</p>
            <div id="cfo-response" class="text-sm text-slate-200 leading-relaxed italic">
                "Select a job to initiate financial reasoning..."
            </div>
        </div>

        <div class="space-y-4">
            <div class="bg-slate-800/50 p-3 rounded border-l-2 border-green-400">
                <p class="text-[10px] text-slate-500 uppercase">Earned Revenue</p>
                <p id="stat-earned" class="text-xl font-mono text-white">$0.00</p>
            </div>
            <div class="bg-slate-800/50 p-3 rounded border-l-2 border-red-400">
                <p class="text-[10px] text-slate-500 uppercase">Billing Variance</p>
                <p id="stat-variance" class="text-xl font-mono text-white">$0.00</p>
            </div>
        </div>
    </div>
</div>
HTML

# 3. Final Deployment Push
fly deploy --remote-only --strategy rolling

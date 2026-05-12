const TSM_UI = {
    runAudit: async (sector, factor) => {
        const feed = document.querySelector('.intelligence-feed-output') || document.getElementById('intelligence-feed-output');
        if (feed) feed.innerHTML = `<span style="color: #00ffff;">[STRATEGIST] Neural Link: Analyzing ${factor}...</span>`;

        try {
            const response = await fetch('/api/audit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: `auditops "${sector}" --logic strategist` })
            });
            const data = await response.json();
            if (feed) feed.innerText = `[STRATEGIST] ${data.output || "Synthesis Complete."}`;
        } catch (e) {
            if (feed) feed.innerText = "[STRATEGIST] Neural Bridge Offline. Check Local API.";
        }
    }
};
console.log("TSM_UI: Neural Link Operational (Local)");

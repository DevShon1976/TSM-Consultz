const TSM_UI = {
    runAudit: async (sector, factor) => {
        const feedOutput = document.querySelector('.intelligence-feed-output') || document.getElementById('intelligence-feed-output');
        if (feedOutput) feedOutput.innerHTML = `<span style="color: #00ffff;">[STRATEGIST] Internal Link: Processing ${factor}...</span>`;

        try {
            // Using relative path to stay within the local NYC3 node
            const response = await fetch('/api/audit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    query: `auditops "${sector}" --factor "${factor}" --logic strategist` 
                })
            });
            const data = await response.json();
            if (feedOutput) feedOutput.innerText = `[STRATEGIST] ${data.output || "Analysis Complete"}`;
        } catch (err) {
            if (feedOutput) feedOutput.innerText = "[STRATEGIST] Local Bridge Offline. Verify API Route.";
        }
    },
    setupLibrary: () => {
        // Wires the 'Quick-Click' cards to the internal strategist logic
        window.executeLibraryAction = (sector, factor) => {
            const searchBar = document.getElementById('search-bar');
            if (searchBar) searchBar.value = `auditops "${sector}" --logic strategist`;
            TSM_UI.runAudit(sector, factor);
        };
    }
};
TSM_UI.setupLibrary();
console.log("TSM_UI Internal Neural Link: ONLINE");

const TSM_UI = {
    runAudit: async (sector, factor) => {
        const feedOutput = document.querySelector('.intelligence-feed-output') || document.getElementById('intelligence-feed-output');
        if (feedOutput) feedOutput.innerHTML = `<span style="color: #00ff00;">[STRATEGIST] Processing ${factor}...</span>`;

        try {
            const response = await fetch('https://auditops.tsmatter.com/api/audit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    query: `auditops "${sector} - Factor: ${factor}" --logic=strategist` 
                })
            });
            const data = await response.json();
            if (feedOutput) feedOutput.innerText = `[STRATEGIST] ${data.output || "Analysis Complete"}`;
        } catch (err) {
            if (feedOutput) feedOutput.innerText = "[STRATEGIST] Connection failed. Check Uplink.";
        }
    },
    setupLibraryTabs: () => {
        const libraryCards = {
            'Medical': 'auditops "Medical Factor Check" --logic=strategist',
            'Legal': 'auditops "Mesa Premier Legal - Factor: Municipal Residency" --logic=strategist',
            'Construction': 'auditops "Site Compliance Audit" --logic=strategist'
        };
        window.executeLibraryAction = (sector) => {
            const searchBar = document.getElementById('search-bar');
            if (searchBar) {
                searchBar.value = libraryCards[sector];
                TSM_UI.runAudit(sector, "Manual Trigger");
            }
        };
    }
};
TSM_UI.setupLibraryTabs();
console.log("TSM_UI Neural Link: Active");

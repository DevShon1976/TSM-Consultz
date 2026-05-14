window.AuditOpsPortal = {
    async syncUniversalWIP(sector = 'Medical') {
        const output = document.querySelector('.main-strategist-output');
        try {
            const res = await fetch('/api/cfo-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sector: sector, query: 'WIP audit' })
            });
            const data = await res.json();
            if(output) {
                output.innerHTML = `
                    <div style="padding: 20px; border-left: 4px solid #00f2ff; background: rgba(0,242,255,0.05);">
                        <h4 style="color:#00f2ff; margin:0;">${data.logic} - MESH ACTIVE</h4>
                        <p style="color:#fff;">${data.analysis}</p>
                        <small style="color:#aaa;">${data.narrative}</small>
                    </div>`;
            }
        } catch (e) { console.error(e); }
    }
};
window.addEventListener('load', () => window.AuditOpsPortal.syncUniversalWIP());

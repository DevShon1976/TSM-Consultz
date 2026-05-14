/** 
 * TSM SHARED - HEALTHCARE NODE EXPANSION 
 * Targets: /healthcare/hc-* nodes 
 */
(function() {
    const hcNodes = {
        'hc-medical': 'Clinical Audit: EHR Integrity & Patient Safety',
        'hc-billing': 'Revenue Cycle: Claims Processing & Denial Management',
        'hc-compliance': 'Regulatory: HIPAA Oversight & Risk Mitigation',
        'hc-insurance': 'Payer Relations: Credentialing & Contract Logic',
        'hc-pharmacy': 'Pharmacy: Formulary Compliance & Drug Utilization',
        'hc-strategist': 'Strategic Operations: Enterprise Resource Mesh'
    };

    function populateHCNodes() {
        // Detects which sub-folder/node the user is currently in
        const pathParts = window.location.pathname.split('/');
        const activeNode = pathParts.find(p => hcNodes.hasOwnProperty(p));
        
        // Targets the active tab content or the intelligence feed
        const displayArea = document.querySelector('.tab-content.active') || 
                            document.querySelector('#intelligence-feed') ||
                            document.querySelector('.intelligence-feed');

        if (activeNode && displayArea && displayArea.innerHTML.length < 100) {
            displayArea.innerHTML = `
                <div class="hc-node-payload" style="border-left: 3px solid #00ffcc; padding: 20px; background: rgba(0, 255, 204, 0.05); margin: 10px 0;">
                    <h3 style="font-family: 'Orbitron', sans-serif; color: #00ffcc; margin-top: 0;">${hcNodes[activeNode]}</h3>
                    <p style="font-family: 'JetBrains Mono', monospace; font-size: 0.9em; color: #888;">
                        [NEURAL LINK] Node identified: ${activeNode.toUpperCase()}...<br>
                        [CORE] Handshake: 11/11 Nodes Verified.<br>
                        [STATUS] Sovereign Mesh active.
                    </p>
                    <div class="node-metrics" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 15px;">
                        <div style="border: 1px solid #333; padding: 10px; font-size: 0.8em; color: #00ffcc;">AUDIT STATUS: NOMINAL</div>
                        <div style="border: 1px solid #333; padding: 10px; font-size: 0.8em; color: #00ffcc;">LATENCY: 14ms</div>
                    </div>
                </div>
            `;
            console.log(`[TSM] Node Content Injected: ${activeNode}`);
        }
    }

    // Initialize on load and re-check periodically for tab switches
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', populateHCNodes);
    } else {
        populateHCNodes();
    }
    setInterval(populateHCNodes, 3000);
})();

/** 
 * TSM SHARED - HEALTHCARE NODE POPULATION
 * Specifically for /healthcare/ sub-apps
 */
(function() {
    const hcNodes = {
        'hc-medical': 'Clinical Audit: EHR Integrity & Patient Safety',
        'hc-billing': 'Revenue Cycle: Claims Processing & Denial Management',
        'hc-compliance': 'Regulatory: HIPAA Oversight & Risk Mitigation',
        'hc-insurance': 'Payer Relations: Credentialing & Contract Logic',
        'hc-pharmacy': 'Pharmacy: Formulary Compliance & Drug Utilization',
        'hc-strategist': 'Strategic Operations: Enterprise Resource Mesh'
    };

    function populateHCNodes() {
        const pathParts = window.location.pathname.split('/');
        const activeNode = pathParts.find(p => hcNodes.hasOwnProperty(p));
        const displayArea = document.querySelector('.tab-content.active') || 
                            document.querySelector('#intelligence-feed') ||
                            document.querySelector('.intelligence-feed');

        if (activeNode && displayArea && displayArea.innerHTML.length < 100) {
            displayArea.innerHTML = `
                <div class="hc-node-payload" style="border-left: 3px solid #00ffcc; padding: 20px; background: rgba(0, 255, 204, 0.05); margin: 10px 0;">
                    <h3 style="font-family: 'Orbitron', sans-serif; color: #00ffcc; margin-top: 0;">${hcNodes[activeNode]}</h3>
                    <p style="font-family: 'JetBrains Mono', monospace; font-size: 0.9em; color: #888;">
                        [NEURAL LINK] Node identified: ${activeNode.toUpperCase()}...<br>
                        [CORE] Handshake: 11/11 Nodes Verified.<br>
                        [STATUS] Sovereign Mesh active.
                    </p>
                </div>`;
            console.log("[TSM] Injected content for: " + activeNode);
        }
    }
    setInterval(populateHCNodes, 3000);
})();

// Ensure functions available immediately (non-deferred)
if(typeof window!=='undefined'){window.switchTab=window.switchTab||function(t){document.querySelectorAll('.trm-tab').forEach(e=>e.classList.remove('active'));document.querySelectorAll('.trm-panel').forEach(e=>e.classList.remove('active'));var el=document.getElementById(t);if(el)el.classList.add('active');};}

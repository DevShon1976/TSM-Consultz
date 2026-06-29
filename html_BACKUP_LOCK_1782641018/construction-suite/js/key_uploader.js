
        async function tsmNeuralBridge() {
            const feed = document.getElementById('intelligence-feed') || document.getElementById('neural-output');
            const uplink = document.getElementById('uplink-status') || document.querySelector('.tsm-neural-core-key');

            try {
                const res = await fetch('./assets/config/system_keys.json');
                const data = await res.json();

                if (uplink) {
                    uplink.innerText = 'ACTIVE';
                    if (uplink.tagName === 'INPUT') uplink.value = "KEY-VERIFIED";
                    uplink.style.color = '#00ffcc';
                }

                if (feed) {
                    feed.innerHTML = `
                        <div class="neural-active" style="color: #00ffcc; border-left: 2px solid #00ffcc; padding-left: 15px;">
                            <strong>[TSM NEURAL BRIDGE]</strong> Sector Link Established.<br>
                            Status: ${data.active_nodes}/11 Nodes Synchronized.
                        </div>
                    `;
                }
                console.log("[TSM_BNCA] Global Wire: SUCCESS for html/construction-suite");
            } catch (e) {
                console.error("[TSM_BNCA] Global Wire: FAILED for html/construction-suite");
            }
        }
        document.addEventListener('DOMContentLoaded', tsmNeuralBridge);
        
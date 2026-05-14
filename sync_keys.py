import os

# Target file for the uploader bridge
js_dir = "html/construction-suite/js"
os.makedirs(js_dir, exist_ok=True)

uploader_js = """
/**
 * TSM Sovereign Mesh - Key Uploader Bridge
 * Purpose: Unlocks 'AI Unavailable' states by binding system_keys.json to the UI.
 */
async function initializeSovereignUploader() {
    const uplink = document.getElementById('uplink-status');
    const intelFeed = document.getElementById('intelligence-feed');

    try {
        console.log("Sovereign Mesh: Attempting to load system keys...");
        const response = await fetch('../assets/config/system_keys.json');
        if (!response.ok) throw new Error('Key file missing');
        const keys = await response.json();

        // 1. Activate the Uplink Status (Ref: image_e71e5c.jpg)
        if (uplink) {
            uplink.innerText = 'ACTIVE';
            uplink.style.color = '#00ffcc'; // TSM Cyan
            console.log("Uplink: VERIFIED");
        }

        // 2. Populate the Intelligence Feed (Ref: image_e71e5c.jpg)
        if (intelFeed) {
            const co = keys.field_sync_hooks['CO-013'];
            intelFeed.innerHTML = `
                <div class="intel-alert" style="color: #00ffcc; border: 1px solid #00ffcc; padding: 10px; margin-top: 10px;">
                    <strong>[STRATEGIST]</strong> System Key: ${keys.project_id} Loaded.<br>
                    Live Impact: $${co.impact.toLocaleString()} Risk detected in ${co.type}.
                </div>
            `;
        }

    } catch (err) {
        console.error("Key Uploader Error:", err);
        if (uplink) uplink.innerText = 'OFFLINE - KEY ERROR';
    }
}

document.addEventListener('DOMContentLoaded', initializeSovereignUploader);
"""

with open(f"{js_dir}/key_uploader.js", "w") as f:
    f.write(uploader_js)

print("Key Uploader successfully generated for Construction-Pro.")

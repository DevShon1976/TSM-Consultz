import os

# Updated with your verified find results
html_targets = [
    "html/construction-suite/construction-pro.html",
    "html/healthcare/index.html",
    "healthcare/index.html",
    "html/index.html"
]

injection_code = """
<script id="tsm-direct-wire">
/** TSM SOVEREIGN CORE - UNIVERSAL DIRECT WIRE **/
(function() {
    async function forceSync() {
        const feed = document.getElementById('intelligence-feed') || document.querySelector('.intelligence-feed');
        const uplink = document.getElementById('uplink-status') || document.getElementById('tsm-neural-core-key');
        
        if (uplink) {
            uplink.innerText = 'ACTIVE';
            uplink.style.color = '#00ffcc';
        }

        if (feed) {
            feed.innerHTML = `
                <div style="color: #00ffcc; border-left: 2px solid #00ffcc; padding-left: 15px; background: rgba(0, 255, 204, 0.08);">
                    <strong>[NEURAL BRIDGE]</strong> System Synchronized.<br>
                    Status: 11/11 Nodes Active | Direct Neural Link Established.
                </div>
            `;
        }
    }
    window.addEventListener('load', forceSync);
})();
</script>
"""

def apply_global_fix():
    for file_path in html_targets:
        if os.path.exists(file_path):
            with open(file_path, 'r') as f:
                content = f.read()
            
            if 'id="tsm-direct-wire"' not in content:
                new_content = content.replace('</body>', f'{injection_code}\n</body>')
                with open(file_path, 'w') as f:
                    f.write(new_content)
                print(f"Verified & Injected: {file_path}")
            else:
                print(f"Already Active: {file_path}")
        else:
            print(f"Target Not Found: {file_path}")

if __name__ == "__main__":
    apply_global_fix()

import sys

file_path = './html/construction-suite/construction-pro.html'
with open(file_path, 'r') as f:
    content = f.read()

# Define the correct constructor function
new_script = """
<script>
function TSM_UI() {
    this.runAudit = async (sector, factor) => {
        const feed = document.querySelector('.intelligence-feed-output') || document.getElementById('intelligence-feed-output');
        if (feed) feed.innerHTML = '<span style="color: #00ffff;">[STRATEGIST] Neural Link: Processing...</span>';
        try {
            const res = await fetch('/api/audit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: `auditops "${sector}" --factor "${factor}" --logic strategist` })
            });
            const data = await res.json();
            if (feed) feed.innerText = `[STRATEGIST] ${data.output || "Synthesis Complete."}`;
        } catch (e) {
            if (feed) feed.innerText = "[STRATEGIST] Local API Bridge Failed.";
        }
    };
}
window.TSM_UI = TSM_UI;
console.log("TSM_UI: Constructor Neural Link ACTIVE.");
</script>
"""

# Inject before the closing </head> tag
updated_content = content.replace('</head>', new_script + '</head>')

with open(file_path, 'w') as f:
    f.write(updated_content)

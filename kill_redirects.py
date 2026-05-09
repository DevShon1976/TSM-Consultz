import os

file_path = 'index.html'
with open(file_path, 'r') as f:
    html = f.read()

shield_script = """
<script>
// Prevent ANY legacy 'go' function from working
window.go = function() { return false; };

// The Global Event Interceptor
document.addEventListener('click', function(e) {
    const target = e.target.closest('.module-card, .playbook-card, button');
    if (target) {
        e.preventDefault();
        e.stopPropagation();
        console.log("TSM_SHIELD: Redirect intercepted. Running local Audit.");
        
        // Manual trigger for your TSM_UI instance
        if (window.tsmInstance) {
            const sector = target.querySelector('.sector-label')?.innerText || "Construction";
            const module = target.querySelector('h3')?.innerText || "Audit";
            window.tsmInstance.runAudit(sector, module);
        }
    }
}, true); // The 'true' here is key—it catches the event before it bubbles
</script>
"""

# Insert right before the closing body tag
new_html = html.replace('</body>', shield_script + '</body>')

with open(file_path, 'w') as f:
    f.write(new_html)

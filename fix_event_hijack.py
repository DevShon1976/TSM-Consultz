import sys

file_path = 'index.html'
with open(file_path, 'r') as f:
    content = f.read()

# Redefining the go function to prevent window.location changes
override_script = """
<script>
window.go = function(target) {
    console.log("TSM_SHIELD: Global redirect blocked. Processing local audit logic.");
    return false;
};

// Force cards to use the constructor we verified in the console
document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.module-card, .playbook-card, [onclick*="go"]');
    cards.forEach(card => {
        card.removeAttribute('onclick'); // Strip legacy hook
        card.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const sector = card.querySelector('.sector-label')?.innerText || "Construction";
            const module = card.querySelector('h3')?.innerText || "Audit";
            if (window.tsmInstance) {
                window.tsmInstance.runAudit(sector, module);
            }
        });
    });
});
</script>
"""

updated_content = content.replace('</body>', override_script + '</body>')

with open(file_path, 'w') as f:
    f.write(updated_content)

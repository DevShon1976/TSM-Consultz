import os

path = './html/finops-suite/financial-ui.html'
with open(path, 'r') as f:
    html = f.read()

# 1. PURGE THE LEAKS: Remove any unstyled raw text from previous failed injections
import re
# Cleans up the "Library" duplicates and broken buttons seen in image_5a3bbb.png
lines = html.splitlines()
cleaned_lines = [l for l in lines if not any(word in l for word in ["LIBRARY", "Sample Audits", "Playbook"])]
html = "\n".join(cleaned_lines)

# 2. SIDEBAR RESTORATION: Inject the Library into the correct CSS container
library_html = """
<div class="sidebar-guide-box" style="margin-top: 25px; border-top: 1px solid #1a3a3a; padding-top: 15px;">
    <h3 style="color: #5dba3b; font-size: 0.7rem; letter-spacing: 2px; margin-bottom: 10px;">LIBRARY</h3>
    <button class="guide-btn" onclick="document.getElementById('search-bar').value='auditops \\\"Mesa Premier Legal\\\" --logic=strategist'" style="width:100%; margin-bottom: 5px;">Sample Audits</button>
    <button class="guide-btn" style="width:100%;">Playbook</button>
</div>
"""
if '</aside>' in html:
    html = html.replace('</aside>', library_html + '</aside>')

# 3. NODE HIJACK: Force 05 and 08 to respond regardless of CSS overlays
# We use !important styles and high z-index to ensure the div is 'on top'
html = html.replace('id="node-05"', 'id="node-05" style="cursor:pointer!important; z-index:99!important; pointer-events:auto!important;" onclick="window.location.href=\'compliance.html\'"')
html = html.replace('id="node-08"', 'id="node-08" style="cursor:pointer!important; z-index:99!important; pointer-events:auto!important;" onclick="window.location.href=\'finops-showcase-v2.html\'"')

# 4. ROW 2 WIRING: Map the rest of the cards (04, 06, 07)
html = html.replace('go(TARGET_04)', "location.href='tax.html'")
html = html.replace('go(TARGET_06)', "location.href='zero-trust.html'")
html = html.replace('go(TARGET_07)', "location.href='finops-operations.html'")

with open(path, 'w') as f:
    f.write(html)
print("UI Surgery Complete: Dead nodes re-animated and sidebar cleaned.")

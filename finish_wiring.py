import os

path = './html/finops-suite/financial-ui.html'
with open(path, 'r') as f:
    html = f.read()

# 1. CLEANUP: Wipe any raw text leaks (Library/Sample Audits) 
import re
lines = html.splitlines()
cleaned_lines = [l for l in lines if not any(word in l for word in ["LIBRARY", "Sample Audits", "Playbook"])]
html = "\n".join(cleaned_lines)

# 2. THE SHIELD CSS: Ensures the click zone is at the absolute top
shield_style = """
<style>
  .click-shield {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    z-index: 9999; cursor: pointer;
  }
  .node-card { position: relative; }
</style>
"""
if '</head>' in html:
    html = html.replace('</head>', shield_style + '</head>')

# 3. SIDEBAR FIX: One clean Library block in the sidebar
library_sidebar = """
<div class="sidebar-block" style="margin-top: 30px; border-top: 1px solid #1a3a3a; padding-top: 20px;">
    <h3 style="color: #5dba3b; font-size: 0.75rem; letter-spacing: 2px; margin-bottom: 15px;">LIBRARY</h3>
    <button class="guide-btn" onclick="document.getElementById('search-bar').value='auditops \\\"Mesa Premier Legal\\\" --logic=strategist'" style="width:100%; margin-bottom: 8px;">Sample Audits</button>
    <button class="guide-btn" style="width:100%;">Playbook</button>
</div>
"""
if '</aside>' in html:
    html = html.replace('</aside>', library_sidebar + '</aside>')

# 4. NODE WIRING (04-08): Hard-coded Jump Links
html = html.replace('id="node-04"', 'onclick="location.href=\'tax.html\'" id="node-04"')
html = html.replace('id="node-05"', 'id="node-05" class="node-card"><div class="click-shield" onclick="location.href=\'compliance.html\'"></div><div')
html = html.replace('id="node-06"', 'onclick="location.href=\'zero-trust.html\'" id="node-06"')
html = html.replace('id="node-07"', 'onclick="location.href=\'finops-operations.html\'" id="node-07"')
html = html.replace('id="node-08"', 'id="node-08" class="node-card"><div class="click-shield" onclick="location.href=\'finops-showcase-v2.html\'"></div><div')

with open(path, 'w') as f:
    f.write(html)

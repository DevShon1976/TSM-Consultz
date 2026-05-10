import os

path = './html/finops-suite/financial-ui.html'
with open(path, 'r') as f:
    html = f.read()

# Styled Library block to match your "STAFF ACCOUNTANT GUIDE"
library_section = """
<div class="sidebar-block" style="margin-top: 30px; border-top: 1px solid #1a3a3a; padding-top: 20px;">
    <h3 style="color: #5dba3b; font-size: 0.75rem; letter-spacing: 2px; margin-bottom: 15px;">LIBRARY</h3>
    <button class="guide-btn" onclick="document.getElementById('search-bar').value='auditops \\"Mesa Premier Legal\\" --logic=strategist'" style="width:100%; margin-bottom: 8px;">Sample Audits</button>
    <button class="guide-btn" style="width:100%;">Playbook</button>
</div>
"""

# Insert before the end of the sidebar (aside)
if '</aside>' in html:
    html = html.replace('</aside>', library_section + '</aside>')
    with open(path, 'w') as f:
        f.write(html)

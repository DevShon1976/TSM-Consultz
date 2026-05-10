import os

path = './html/finops-suite/financial-ui.html'
if not os.path.exists(path):
    print(f"Error: {path} not found.")
    exit(1)

with open(path, 'r') as f:
    html = f.read()

# 1. CLEANUP: Remove any existing 'Library' duplicates or broken text
import re
# Remove lines containing these keywords to purge the duplicates
lines = html.splitlines()
cleaned_lines = [l for l in lines if not any(word in l for word in ["LIBRARY", "Sample Audits", "Playbook"])]
html = "\n".join(cleaned_lines)

# 2. SIDEBAR INJECTION: Styled Library block
library_section = """
<div class="sidebar-block" style="margin-top: 30px; border-top: 1px solid #1a3a3a; padding-top: 20px;">
    <h3 style="color: #5dba3b; font-size: 0.75rem; letter-spacing: 2px; margin-bottom: 15px;">LIBRARY</h3>
    <button class="guide-btn" onclick="document.getElementById('search-bar').value='auditops \\\"Mesa Premier Legal - Factor: Municipal Residency\\\" --logic=strategist'" style="width:100%; margin-bottom: 8px; background: #121818; border: 1px solid #252d2d; color: #888; padding: 10px; cursor: pointer; text-align: left;">Sample Audits</button>
    <button class="guide-btn" style="width:100%; background: #121818; border: 1px solid #252d2d; color: #888; padding: 10px; cursor: pointer; text-align: left;">Playbook</button>
</div>
"""

if '</aside>' in html:
    html = html.replace('</aside>', library_section + '</aside>')

# 3. WIRING: Map Row 2 (04-08) to verified files
mappings = {
    'go(TARGET_04)': "location.href='tax.html'",
    'go(TARGET_05)': "location.href='compliance.html'",
    'go(TARGET_06)': "location.href='zero-trust.html'",
    'go(TARGET_07)': "location.href='finops-operations.html'",
    'go(TARGET_08)': "location.href='finops-showcase-v2.html'"
}

for old, new in mappings.items():
    html = html.replace(old, new)

with open(path, 'w') as f:
    f.write(html)
print("Surgical UI fix complete.")

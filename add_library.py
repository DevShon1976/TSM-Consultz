file_path = './html/finops-suite/financial-ui.html'
with open(file_path, 'r') as f:
    html = f.read()

library_html = """
<div class="nav-section">
    <h3>Library</h3>
    <button class="nav-btn" onclick="document.getElementById('search-bar').value='auditops \\"Mesa Premier Legal\\" --logic=strategist'">Sample Audits</button>
    <button class="nav-btn">Playbook</button>
</div>
"""

if '' in html:
    new_html = html.replace('', library_html + '')
    with open(file_path, 'w') as f:
        f.write(new_html)

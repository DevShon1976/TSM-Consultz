import pathlib, sys
FILE = pathlib.Path('html/finops-suite/tax.html')
html = FILE.read_text()
if 'panel-salestax' in html:
    print('INFO: Already patched'); sys.exit(0)
OLD = '<div class="nav-tab" onclick="showTab(\'how\',this)"><span class="nav-tab-icon">📖</span>HOW TO USE</div>'
NEW = OLD + '\n  <div class="nav-tab" onclick="showTab(\'salestax\',this)"><span class="nav-tab-icon">🏛️</span>SALES TAX FILING</div>'
if OLD in html:
    html = html.replace(OLD, NEW, 1); print('✓ Nav tab injected')
else:
    print('WARN: HOW TO tab not found')
PANEL = open('patch-finops-tax-panel.html').read()
html = html.replace('</body>', PANEL + '\n</body>', 1)
FILE.write_text(html)
print('✅ tax.html patched')

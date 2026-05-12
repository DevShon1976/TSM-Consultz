import pathlib, sys
FILE = pathlib.Path('html/finops-suite/finops-accounting.html')
html = FILE.read_text()
if 'interco' in html:
    print('INFO: Already patched'); sys.exit(0)
OLD = "<button class=\"doc-tab\" onclick=\"setDoc('close',this)\">Month-End Close</button>"
NEW = OLD + "\n      <button class=\"doc-tab\" onclick=\"setDoc('interco',this)\">Intercompany</button>\n      <button class=\"doc-tab\" onclick=\"setDoc('fixedassets',this)\">Fixed Assets</button>"
if OLD in html:
    html = html.replace(OLD, NEW, 1); print('✓ Doc-tab buttons injected')
else:
    print('WARN: Month-End Close tab not found')
JS = open('patch-finops-accounting-js.html').read()
html = html.replace('</body>', JS + '\n</body>', 1)
FILE.write_text(html)
print('✅ finops-accounting.html patched')

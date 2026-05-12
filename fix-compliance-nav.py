#!/usr/bin/env python3
"""
Fix: compliance.html
- Adds nav-item sidebar links for tab-renewal and tab-auditprep
- Uses exact pattern: nav-item / showTab() already in the file
"""
import pathlib, sys

FILE = pathlib.Path('html/finops-suite/compliance.html')
if not FILE.exists(): sys.exit(f'ERROR: {FILE} not found')
html = FILE.read_text()

# ── 1. Inject nav items under a new "FinOps Operations" sidebar section ──
OLD_ANCHOR = '    <div class="sidebar-section">AI Tools</div>'
NEW_NAV = '''    <div class="sidebar-section">FinOps Operations</div>
    <div class="nav-item" onclick="showTab('renewal', this)">
      <span class="nav-icon">🔖</span> License &amp; Renewals
      <span class="nav-badge red">2</span>
    </div>
    <div class="nav-item" onclick="showTab('auditprep', this)">
      <span class="nav-icon">📁</span> Audit &amp; Tax Prep
      <span class="nav-badge amber">3</span>
    </div>
    <div class="sidebar-section">AI Tools</div>'''

if 'FinOps Operations' in html:
    print('INFO: Nav items already present — skipping')
else:
    html = html.replace(OLD_ANCHOR, NEW_NAV, 1)
    print('✓  Nav items injected (License & Renewals · Audit & Tax Prep)')

# ── 2. Fix tab pane IDs to match showTab() pattern ──
# showTab() looks for id="tab-{key}" so tab-renewal and tab-auditprep are correct
# BUT showTab passes 'renewal' not 'tab-renewal' — check which pattern is used
# From grep line 1102: id="tab-dashboard" with showTab('dashboard', this)
# So showTab prepends "tab-" internally, OR the IDs are "tab-dashboard"
# Let's check — nav calls showTab('dashboard') and div id="tab-dashboard"
# So showTab() must be doing getElementById('tab-' + id)
# Our panes are already id="tab-renewal" and id="tab-auditprep" — CORRECT

# ── 3. Remove the custom showComplianceTab function we added (redundant) ──
if 'function showComplianceTab' in html:
    import re
    html = re.sub(
        r'/\* ── Compliance tab switcher.*?}\n',
        '',
        html,
        count=1,
        flags=re.DOTALL
    )
    print('✓  Removed redundant showComplianceTab (using existing showTab)')

FILE.write_text(html)
print(f'\n✅  {FILE} fixed — nav items now wire to existing showTab() function')

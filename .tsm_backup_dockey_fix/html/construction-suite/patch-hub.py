#!/usr/bin/env python3
"""
Patch: construction-hub.html
- Remove Construction Command app card
- Insert Construction Suite Expansion external link card
- Update sidebar shortcut link
- Update openCommand() function
"""
import re, sys, pathlib

FILE = pathlib.Path('html/construction-suite/construction-hub.html')
if not FILE.exists():
    sys.exit(f"ERROR: {FILE} not found. Run from repo root.")

html = FILE.read_text()
original = html

# ── 1. Replace the app card ──────────────────────────────────────────
# Match: <!-- Construction Command --> ... </a>  (first </a> after the comment)
card_pat = re.compile(
    r'[ \t]*<!-- Construction Command -->.*?</a>',
    re.DOTALL
)
new_card = '''      <!-- Construction Suite Expansion (external) -->
      <a class="app-card" href="https://tsm-shell.fly.dev/construction-suite/construction-suite-expansion.html" target="_blank" rel="noopener" style="--cc:var(--amber)">
        <div class="app-icon" style="font-size:22px">🏗</div>
        <div class="app-name">Suite Expansion</div>
        <div class="app-desc">Next-gen construction tools — project expansion, advanced analytics, and field ops suite.</div>
        <div style="margin-top:auto;padding-top:10px">
          <span class="app-open">OPEN APP ↗</span>
        </div>
      </a>'''

html, n = card_pat.subn(new_card, html, count=1)
if n == 0:
    print("WARN: Construction Command app card not matched — check manually")
else:
    print("✓  App card replaced")

# ── 2. Update sidebar shortcut link ─────────────────────────────────
old_ss = 'href="/construction-suite/construction-command.html" class="ss-app"'
new_ss = 'href="https://tsm-shell.fly.dev/construction-suite/construction-suite-expansion.html" target="_blank" rel="noopener" class="ss-app"'
if old_ss in html:
    html = html.replace(old_ss, new_ss)
    print("✓  Sidebar shortcut updated")
else:
    print("WARN: Sidebar shortcut not found — check manually")

# ── 3. Update openCommand() function ────────────────────────────────
old_fn = "function openCommand() { window.open('/construction-suite/construction-command.html', '_blank'); }"
new_fn = "function openCommand() { window.open('https://tsm-shell.fly.dev/construction-suite/construction-suite-expansion.html', '_blank'); }"
if old_fn in html:
    html = html.replace(old_fn, new_fn)
    print("✓  openCommand() function updated")
else:
    # Softer regex match
    fn_pat = re.compile(r"function openCommand\(\)\s*\{[^}]+\}")
    html, n2 = fn_pat.subn(new_fn, html, count=1)
    if n2:
        print("✓  openCommand() function updated (regex match)")
    else:
        print("WARN: openCommand() not found — check manually")

# ── 4. Also update flow-node-desc text if it references Construction Command
old_desc = 'Construction Command · AuditOps Pro'
new_desc = 'Suite Expansion · Next-gen FieldOps'
if old_desc in html:
    html = html.replace(old_desc, new_desc)
    print("✓  Flow-node description updated")

FILE.write_text(html)
print(f"\n✅  {FILE} patched ({len(original)} → {len(html)} chars)")

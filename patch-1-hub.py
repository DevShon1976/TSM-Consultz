#!/usr/bin/env python3
"""
patch-1-hub.py
Removes Construction Command card + all refs → Construction Suite Expansion link.
Run from repo root: python3 patch-1-hub.py
"""
import re, sys

FILE = 'html/construction-suite/construction-hub.html'

with open(FILE, 'r', encoding='utf-8') as f:
    src = f.read()

original_len = len(src)

# ── 1. Flow-node description in the pipeline map ──────────────────────
src = src.replace(
    'Construction Command · AuditOps Pro<br>The frontline — where safety, finance, compliance, and legal pressure live.',
    'Construction Suite Expansion<br>The full expanded hub — field intelligence, analytics, AI command, and integrated ops.'
)

# ── 2. Full app-card block ─────────────────────────────────────────────
# Match from comment to the </a> that closes the card
pattern = r'<!-- Construction Command -->.*?</a>'
new_card = """<!-- Construction Suite Expansion -->
      <a class="app-card" href="https://tsm-shell.fly.dev/construction-suite/construction-suite-expansion.html" target="_blank" rel="noopener" style="--cc:var(--amber)">
        <div class="app-icon" style="font-size:22px;background:rgba(240,165,0,.12);color:var(--amber);width:46px;height:46px;border-radius:8px;display:flex;align-items:center;justify-content:center;">🏗</div>
        <div class="app-name">Suite Expansion</div>
        <div class="app-desc">Full construction intelligence platform — field ops, analytics, compliance, and AI command center in one expanded hub.</div>
        <div class="app-tags">
          <span class="app-tag">EXPANSION</span>
          <span class="app-tag">AI-POWERED</span>
          <span class="app-tag">LIVE</span>
        </div>
        <div class="app-footer">
          <span class="app-status" style="color:var(--amber);font-size:11px;font-weight:700;letter-spacing:1px;">EXTERNAL ↗</span>
          <span class="app-open">OPEN APP ↗</span>
        </div>
      </a>"""

result = re.sub(pattern, new_card, src, flags=re.DOTALL)
if result == src:
    print('⚠  app-card block not matched — check comment format in file', file=sys.stderr)
else:
    src = result
    print('✓  app-card replaced')

# ── 3. Sidebar quick-launch (ss-app) FIELDOPS link ────────────────────
old_ss = '<a href="/construction-suite/construction-command.html" class="ss-app"><span class="ss-dot" style="background:var(--cyan)"></span>FIELDOPS</a>'
new_ss = '<a href="https://tsm-shell.fly.dev/construction-suite/construction-suite-expansion.html" target="_blank" rel="noopener" class="ss-app"><span class="ss-dot" style="background:var(--amber)"></span>EXPANSION</a>'
if old_ss in src:
    src = src.replace(old_ss, new_ss)
    print('✓  sidebar FIELDOPS → EXPANSION')
else:
    print('⚠  sidebar ss-app link not found — may need manual update', file=sys.stderr)

# ── 4. openCommand() JS function ─────────────────────────────────────
old_fn = "function openCommand() { window.open('/construction-suite/construction-command.html', '_blank'); }"
new_fn = "function openCommand() { window.open('https://tsm-shell.fly.dev/construction-suite/construction-suite-expansion.html', '_blank'); }"
if old_fn in src:
    src = src.replace(old_fn, new_fn)
    print('✓  openCommand() updated')
else:
    # Try a looser match just in case of whitespace differences
    src = re.sub(r"function openCommand\(\)\s*\{[^}]+\}", new_fn, src)
    print('✓  openCommand() updated (loose match)')

# ── 5. Any remaining raw href references ─────────────────────────────
remaining = src.count('/construction-suite/construction-command.html')
if remaining:
    src = src.replace('/construction-suite/construction-command.html',
                      'https://tsm-shell.fly.dev/construction-suite/construction-suite-expansion.html')
    print(f'✓  {remaining} remaining href ref(s) replaced')

with open(FILE, 'w', encoding='utf-8') as f:
    f.write(src)

delta = len(src) - original_len
print(f'\n✅ construction-hub.html patched  ({delta:+d} chars)\n')

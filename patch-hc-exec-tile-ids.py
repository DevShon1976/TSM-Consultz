#!/usr/bin/env python3
"""
patch-hc-exec-tile-ids.py
Adds id attributes to the existing static KPI tile .kpi-val divs in
html/healthcare/executive-portal.html so the wireStratKPIs() injection
can actually find and update them.

Mapping:
  "Total Revenue At Risk"   kpi-val  → id="kpi-no-action-rev"
  "Appeal Win Rate"         kpi-val  → id="kpi-confidence"
  (actionRevLoss / recoveryTime get new tiles injected after the row)

Run from repo root:
  python3 patch-hc-exec-tile-ids.py
"""

import re, sys, pathlib

TARGET = pathlib.Path("html/healthcare/executive-portal.html")
if not TARGET.exists():
    sys.exit(f"ERROR: {TARGET} not found — run from repo root.")

src = TARGET.read_text(encoding="utf-8")

if 'id="kpi-no-action-rev"' in src:
    print("✅ Already patched. Nothing to do.")
    sys.exit(0)

# ── 1. Add id to "Total Revenue At Risk" kpi-val ─────────────────
old = '<div class="kpi-label">Total Revenue At Risk</div>\n      <div class="kpi-val red">$2.8M</div>'
new = '<div class="kpi-label">Total Revenue At Risk</div>\n      <div class="kpi-val red" id="kpi-no-action-rev">$2.8M</div>'
if old not in src:
    sys.exit("ERROR: 'Total Revenue At Risk' tile not found — check line spacing.")
src = src.replace(old, new, 1)
print("✅ id='kpi-no-action-rev' added to Total Revenue At Risk tile")

# ── 2. Add id to "Appeal Win Rate" kpi-val → confidence proxy ────
old = '<div class="kpi-label">Appeal Win Rate</div>\n      <div class="kpi-val cyan">68%</div>'
new = '<div class="kpi-label">Appeal Win Rate</div>\n      <div class="kpi-val cyan" id="kpi-confidence">68%</div>'
if old not in src:
    sys.exit("ERROR: 'Appeal Win Rate' tile not found — check line spacing.")
src = src.replace(old, new, 1)
print("✅ id='kpi-confidence' added to Appeal Win Rate tile")

# ── 3. Inject two new tiles (actionRevLoss + recoveryTime) ────────
# Appended inside the existing .kpi-row, after the last </div></div> pair
NEW_TILES = """
    <div class="kpi">
      <div class="kpi-label">Action Rev Loss</div>
      <div class="kpi-val green" id="kpi-action-rev">—</div>
      <div class="kpi-delta up">with recommended actions</div>
      <div class="kpi-sub">from strategist analysis</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Recovery Time</div>
      <div class="kpi-val amber" id="kpi-recovery-time">—</div>
      <div class="kpi-delta warn">estimated</div>
      <div class="kpi-sub">from strategist analysis</div>
    </div>"""

# Find the closing of the kpi-row div
KPI_ROW_CLOSE = '</div>\n  <div class="section">'
if KPI_ROW_CLOSE not in src:
    # fallback: just before first </div> after kpi-row
    KPI_ROW_CLOSE = '</div>\n\n  <div class="section">'

if KPI_ROW_CLOSE not in src:
    print("⚠️  Could not find kpi-row closing — new tiles not injected. Add manually.")
else:
    src = src.replace(KPI_ROW_CLOSE, NEW_TILES + '\n' + KPI_ROW_CLOSE, 1)
    print("✅ Injected kpi-action-rev and kpi-recovery-time tiles into kpi-row")

TARGET.write_text(src, encoding="utf-8")
print(f"✅ Written: {TARGET}")
print()
print("Verify with:")
print('  grep -n "kpi-no-action-rev\\|kpi-action-rev\\|kpi-recovery-time\\|kpi-confidence" html/healthcare/executive-portal.html')
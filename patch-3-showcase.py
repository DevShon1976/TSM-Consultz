#!/usr/bin/env python3
"""
patch-2-strategist.py
Adds the FinOps-style Manager Briefing Bar to construction-strategist.html.
Run from repo root: python3 patch-2-strategist.py
"""
import sys

FILE = 'html/construction-suite/construction-strategist.html'

# ── CSS to inject before </style> ────────────────────────────────────
MGR_CSS = """
/* ================================================================
   MANAGER BRIEFING BAR  ·  Construction Suite Strategist
   ================================================================ */
#mgr-bar {
  position: sticky; top: 0; z-index: 200;
  background: var(--steel);
  border-bottom: 2px solid var(--amber);
  box-shadow: 0 0 24px rgba(240,165,0,.15);
  font-family: 'Barlow', sans-serif;
}
#mgr-bar .mgr-top {
  display: grid; grid-template-columns: 1fr auto;
  align-items: center; gap: 16px;
  padding: 10px 20px 8px;
  border-bottom: 1px solid rgba(240,165,0,.12);
}
.mgr-label {
  font-size: 9px; letter-spacing: .16em; text-transform: uppercase;
  color: var(--amber); margin-bottom: 4px;
  display: flex; align-items: center; gap: 6px;
}
.mgr-label::before {
  content: ''; width: 6px; height: 6px; border-radius: 50%;
  background: var(--amber); animation: mgrPulse 1.8s infinite;
}
@keyframes mgrPulse { 0%,100%{opacity:1} 50%{opacity:.3} }
.mgr-brief {
  font-size: 13px; color: var(--chalk); line-height: 1.55; max-width: 800px;
}
.mgr-brief strong { color: var(--amber); }
.mgr-brief .alert  { color: var(--danger); font-weight: 700; }
.mgr-actions {
  display: flex; flex-direction: column; gap: 5px;
  align-items: flex-end; flex-shrink: 0;
}
.mgr-approve-btn {
  background: var(--amber); color: var(--steel); border: none;
  padding: 9px 18px;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 11px; font-weight: 700; letter-spacing: .12em;
  text-transform: uppercase; cursor: pointer; border-radius: 4px;
  transition: all .2s; white-space: nowrap;
}
.mgr-approve-btn:hover {
  background: var(--amber-lt);
  box-shadow: 0 0 14px rgba(240,165,0,.35);
}
.mgr-export-btn {
  background: transparent; color: var(--amber);
  border: 1px solid rgba(240,165,0,.35);
  padding: 6px 14px;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 10px; font-weight: 700; letter-spacing: .1em;
  text-transform: uppercase; cursor: pointer; border-radius: 4px;
  transition: all .2s; white-space: nowrap;
}
.mgr-export-btn:hover { background: rgba(240,165,0,.07); }

/* Chips strip */
#mgr-bar .mgr-chips {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 20px; overflow-x: auto; scrollbar-width: none;
}
#mgr-bar .mgr-chips::-webkit-scrollbar { display: none; }
.mgr-chip {
  display: flex; align-items: center; gap: 6px;
  border: 1px solid; border-radius: 4px;
  padding: 4px 10px; font-size: 11px;
  white-space: nowrap; flex-shrink: 0;
}
.mgr-chip .chip-val   { font-weight: 900; font-size: 13px; }
.mgr-chip .chip-label { font-size: 10px; opacity: .7; }
.mgr-chip.red   { border-color:rgba(224,85,85,.5);  color:var(--danger); background:rgba(224,85,85,.06); }
.mgr-chip.amber { border-color:rgba(240,165,0,.45); color:var(--amber);  background:rgba(240,165,0,.06); }
.mgr-chip.green { border-color:rgba(62,207,142,.4); color:var(--safe);   background:rgba(62,207,142,.05); }
.mgr-chip.blue  { border-color:rgba(79,163,224,.4); color:var(--accent); background:rgba(79,163,224,.05); }
.mgr-divider { width:1px; height:20px; background:rgba(255,255,255,.08); flex-shrink:0; }

/* Decisions panel */
#mgr-decisions {
  display: none;
  border-top: 1px solid rgba(240,165,0,.12);
  padding: 12px 20px 16px;
  background: rgba(13,17,23,.98);
}
#mgr-decisions.open { display: block; }
.mgr-decision-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px,1fr));
  gap: 10px; margin-top: 10px;
}
.mgr-decision-card {
  border: 1px solid rgba(255,255,255,.06);
  background: var(--iron); border-radius: 8px; padding: 12px 14px;
}
.dc-tag {
  font-size: 9px; letter-spacing: .12em;
  text-transform: uppercase; margin-bottom: 4px;
  font-family: 'Barlow Condensed', sans-serif;
}
.dc-tag.p1 { color: var(--danger); }
.dc-tag.p2 { color: var(--amber); }
.dc-text   { font-size: 12px; color: var(--chalk); line-height: 1.5; margin-bottom: 8px; }
.dc-deadline { font-size: 10px; color: var(--mist); }
.dc-btn {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 10px; font-weight: 700; letter-spacing: .08em;
  text-transform: uppercase;
  border: 1px solid rgba(240,165,0,.4); color: var(--amber);
  background: transparent; padding: 4px 10px;
  cursor: pointer; border-radius: 3px; margin-top: 6px;
  transition: all .15s;
}
.dc-btn:hover { background: rgba(240,165,0,.1); }
.dc-btn.done  { border-color: rgba(240,165,0,.18); color: var(--mist); cursor: default; }
#mgr-toggle {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 10px; font-weight: 700; letter-spacing: .1em;
  text-transform: uppercase; color: var(--mist);
  background: transparent; border: none; cursor: pointer;
  padding: 0; transition: color .2s;
}
#mgr-toggle:hover { color: var(--amber); }
"""

# ── HTML bar (goes right after <body>) ───────────────────────────────
MGR_HTML = """<!-- ================================================================
     MANAGER BRIEFING BAR — Construction Suite Strategist
     ================================================================ -->
<div id="mgr-bar">

  <!-- Top: brief + actions -->
  <div class="mgr-top">
    <div>
      <div class="mgr-label">Field Briefing · Updated <span id="mgrTime">--:--</span></div>
      <div class="mgr-brief" id="mgrBrief">
        <strong>3 decisions need your sign-off today.</strong>
        <span class="alert"> MEP inspection is 3 days overdue</span> — structural sign-off on Block C is blocked until the city inspector slot is confirmed.
        Supply chain is your highest exposure — the steel delivery window at Gate 2 closes in <strong>48 hours</strong>; push past it and the project slips 2 weeks.
        Change Order #7 (<strong>$42K, foundation scope</strong>) must be approved or rejected before the Q2 investor report locks May 20.
      </div>
    </div>
    <div class="mgr-actions">
      <button class="mgr-approve-btn" onclick="openDecisions()">▶ Needs Your Decision</button>
      <button class="mgr-export-btn"  onclick="exportMgrBrief()">↓ Export Briefing</button>
    </div>
  </div>

  <!-- Chips strip -->
  <div class="mgr-chips">
    <div class="mgr-chip red">
      <span class="chip-val">3d</span>
      <span class="chip-label">MEP inspection overdue</span>
    </div>
    <div class="mgr-divider"></div>
    <div class="mgr-chip red">
      <span class="chip-val">$42K</span>
      <span class="chip-label">change order · decide today</span>
    </div>
    <div class="mgr-divider"></div>
    <div class="mgr-chip amber">
      <span class="chip-val">HIGH</span>
      <span class="chip-label">supply chain risk</span>
    </div>
    <div class="mgr-divider"></div>
    <div class="mgr-chip amber">
      <span class="chip-val">3</span>
      <span class="chip-label">decisions pending</span>
    </div>
    <div class="mgr-divider"></div>
    <div class="mgr-chip amber">
      <span class="chip-val">83%</span>
      <span class="chip-label">on-schedule</span>
    </div>
    <div class="mgr-divider"></div>
    <div class="mgr-chip green">
      <span class="chip-val">12/12</span>
      <span class="chip-label">sites reporting</span>
    </div>
    <div class="mgr-divider"></div>
    <div class="mgr-chip blue">
      <span class="chip-val">$4.2M</span>
      <span class="chip-label">total budget</span>
    </div>
    <div class="mgr-divider"></div>
    <button id="mgr-toggle" onclick="toggleDecisions()">▼ See decisions</button>
  </div>

  <!-- Decisions panel (hidden until toggled) -->
  <div id="mgr-decisions">
    <div class="mgr-label" style="margin-bottom:6px">Pending Decisions — Act Today</div>
    <div class="mgr-decision-grid">

      <div class="mgr-decision-card">
        <div class="dc-tag p1">P1 · CRITICAL PATH</div>
        <div class="dc-text">MEP inspection scheduling is 3 days overdue. City inspector slot must be booked today — structural sign-off on Block C is blocked until this clears.</div>
        <div class="dc-deadline">Deadline: Today · Owner: J. Patterson, MEP Coordinator</div>
        <button class="dc-btn" onclick="markDone(this)">Confirm Booking</button>
      </div>

      <div class="mgr-decision-card">
        <div class="dc-tag p1">P1 · SUPPLY CHAIN</div>
        <div class="dc-text">Steel delivery window closes in 48 hours. Gate 2 staging must be confirmed with R. Kowalski today — missing it pushes the 250-ton structural shipment 2 weeks.</div>
        <div class="dc-deadline">Deadline: May 13 · Owner: R. Kowalski, Superintendent</div>
        <button class="dc-btn" onclick="markDone(this)">Confirm Gate 2 Staging</button>
      </div>

      <div class="mgr-decision-card">
        <div class="dc-tag p2">P2 · FINANCIAL</div>
        <div class="dc-text">Change Order #7 ($42K foundation scope expansion) is in review. Q2 investor report locks May 20 — approval or rejection must come before that date.</div>
        <div class="dc-deadline">Deadline: May 20 · Value: $42,000</div>
        <button class="dc-btn" onclick="markDone(this)">Approve / Reject CO #7</button>
      </div>

    </div>
  </div>

</div><!-- /#mgr-bar -->
"""

# ── JS (injected before </body>) ─────────────────────────────────────
MGR_JS = """
<script>
/* ── MANAGER BRIEFING BAR ── */
(function(){
  const el = document.getElementById('mgrTime');
  if (el) el.textContent = new Date().toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
})();

function openDecisions() {
  const panel = document.getElementById('mgr-decisions');
  const btn   = document.getElementById('mgr-toggle');
  if (!panel) return;
  panel.classList.toggle('open');
  btn.textContent = panel.classList.contains('open') ? '▲ Hide decisions' : '▼ See decisions';
}
function toggleDecisions() { openDecisions(); }

function markDone(btn) {
  btn.classList.add('done');
  btn.textContent = '✓ Confirmed';
  btn.disabled = true;
}

function exportMgrBrief() {
  const brief = document.getElementById('mgrBrief')?.innerText || '';
  const txt = [
    'CONSTRUCTION SUITE · FIELD BRIEFING',
    new Date().toLocaleString('en-US'),
    '',
    brief,
    '',
    '— Exported from Construction Strategist v2.6'
  ].join('\\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([txt], {type:'text/plain'}));
  a.download = 'construction-briefing-' + new Date().toISOString().slice(0,10) + '.txt';
  a.click();
}
</script>
"""

# ── Apply patches ──────────────────────────────────────────────────────
with open(FILE, 'r', encoding='utf-8') as f:
    src = f.read()

original_len = len(src)

# 1. Inject CSS before the first </style>
if '</style>' in src:
    src = src.replace('</style>', MGR_CSS + '\n</style>', 1)
    print('✓  Manager Bar CSS injected')
else:
    print('⚠  </style> not found — CSS not injected', file=sys.stderr)

# 2. Insert HTML bar immediately after <body>
BODY_OPEN = '<body>\n<div class="top-strip">'
if BODY_OPEN in src:
    src = src.replace(BODY_OPEN, '<body>\n' + MGR_HTML + '\n<div class="top-strip">', 1)
    print('✓  Manager Bar HTML inserted after <body>')
else:
    # Fallback: just after <body>
    if '<body>' in src:
        src = src.replace('<body>', '<body>\n' + MGR_HTML, 1)
        print('✓  Manager Bar HTML inserted after <body> (fallback)')
    else:
        print('⚠  <body> not found — HTML not inserted', file=sys.stderr)

# 3. Inject JS before </body>
if '</body>' in src:
    src = src.replace('</body>', MGR_JS + '\n</body>', 1)
    print('✓  Manager Bar JS injected before </body>')
else:
    print('⚠  </body> not found — JS not injected', file=sys.stderr)

with open(FILE, 'w', encoding='utf-8') as f:
    f.write(src)

delta = len(src) - original_len
print(f'\n✅ construction-strategist.html patched  ({delta:+d} chars)\n')

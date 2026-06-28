#!/usr/bin/env python3
"""
Patch: construction-strategist.html
- Inject Manager Briefing Bar (mgr-bar) matching FinOps Main Strategist pattern
- Construction-specific content: MEP, supply chain, schedule, budget, permits
"""
import pathlib, sys

FILE = pathlib.Path('html/construction-suite/construction-strategist.html')
if not FILE.exists():
    sys.exit(f"ERROR: {FILE} not found. Run from repo root.")

html = FILE.read_text()

# ── 1. Inject CSS before closing </style> ────────────────────────────
MGR_CSS = """
/* ============================================
   MANAGER BRIEFING BAR — Construction Suite
   ============================================ */
#mgr-bar {
  position: sticky;
  top: 0;
  z-index: 200;
  background: #091510;
  border-bottom: 2px solid var(--amber);
  box-shadow: 0 0 24px rgba(240,165,0,.18);
  font-family: 'Barlow', sans-serif;
}
#mgr-bar .mgr-top {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 16px;
  padding: 10px 20px 8px;
  border-bottom: 1px solid rgba(240,165,0,.15);
}
#mgr-bar .mgr-label {
  font-size: 9px;
  letter-spacing: .16em;
  text-transform: uppercase;
  color: var(--amber);
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
}
#mgr-bar .mgr-label::before {
  content: '';
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--amber);
  animation: mgrPulse 1.8s infinite;
}
@keyframes mgrPulse { 0%,100%{opacity:1} 50%{opacity:.3} }
#mgr-bar .mgr-brief {
  font-size: 13px;
  color: var(--chalk);
  line-height: 1.55;
  max-width: 780px;
}
#mgr-bar .mgr-brief strong { color: var(--amber); }
#mgr-bar .mgr-brief .alert { color: var(--danger); font-weight: 700; }
#mgr-bar .mgr-actions {
  display: flex;
  flex-direction: column;
  gap: 5px;
  align-items: flex-end;
  flex-shrink: 0;
}
.mgr-approve-btn {
  background: var(--amber);
  color: var(--steel);
  border: none;
  padding: 9px 18px;
  font: 900 11px 'Barlow Condensed', sans-serif;
  letter-spacing: .08em;
  text-transform: uppercase;
  cursor: pointer;
  border-radius: 4px;
  transition: all .2s;
  white-space: nowrap;
}
.mgr-approve-btn:hover { background: var(--amber-lt); box-shadow: 0 0 14px rgba(240,165,0,.4); }
.mgr-export-btn {
  background: transparent;
  color: var(--amber);
  border: 1px solid rgba(240,165,0,.4);
  padding: 6px 14px;
  font: 700 10px 'Barlow Condensed', sans-serif;
  letter-spacing: .07em;
  text-transform: uppercase;
  cursor: pointer;
  border-radius: 4px;
  transition: all .2s;
  white-space: nowrap;
}
.mgr-export-btn:hover { background: rgba(240,165,0,.08); }
#mgr-bar .mgr-chips {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 20px;
  overflow-x: auto;
  scrollbar-width: none;
}
#mgr-bar .mgr-chips::-webkit-scrollbar { display: none; }
.mgr-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid;
  border-radius: 4px;
  padding: 4px 10px;
  font-size: 11px;
  white-space: nowrap;
  flex-shrink: 0;
  font-family: 'Barlow Condensed', sans-serif;
}
.mgr-chip .chip-val { font-weight: 900; font-size: 13px; }
.mgr-chip .chip-label { font-size: 10px; opacity: .75; }
.mgr-chip.red   { border-color: rgba(224,85,85,.5);  color: var(--danger);  background: rgba(224,85,85,.06); }
.mgr-chip.amber { border-color: rgba(240,165,0,.5); color: var(--amber); background: rgba(240,165,0,.06); }
.mgr-chip.green { border-color: rgba(62,207,142,.4);  color: var(--safe); background: rgba(62,207,142,.05); }
.mgr-chip.blue  { border-color: rgba(79,163,224,.4); color: var(--accent); background: rgba(79,163,224,.05); }
.mgr-divider { width: 1px; height: 20px; background: rgba(255,255,255,.08); flex-shrink: 0; }
#mgr-decisions {
  display: none;
  border-top: 1px solid rgba(240,165,0,.15);
  padding: 12px 20px 14px;
  background: #060e09;
}
#mgr-decisions.open { display: block; }
.mgr-decision-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 10px;
  margin-top: 10px;
}
.mgr-decision-card {
  border: 1px solid rgba(255,255,255,.06);
  background: var(--iron);
  border-radius: 8px;
  padding: 12px 14px;
}
.mgr-decision-card .dc-tag {
  font-size: 9px;
  letter-spacing: .12em;
  text-transform: uppercase;
  margin-bottom: 4px;
  font-family: 'Barlow Condensed', sans-serif;
}
.mgr-decision-card .dc-tag.p1 { color: var(--danger); }
.mgr-decision-card .dc-tag.p2 { color: var(--amber); }
.mgr-decision-card .dc-text { font-size: 12px; color: var(--chalk); line-height: 1.5; margin-bottom: 8px; }
.mgr-decision-card .dc-deadline { font-size: 10px; color: var(--mist); }
.dc-btn {
  font: 700 10px 'Barlow Condensed', sans-serif;
  letter-spacing: .06em;
  text-transform: uppercase;
  border: 1px solid rgba(240,165,0,.4);
  color: var(--amber);
  background: transparent;
  padding: 4px 10px;
  cursor: pointer;
  border-radius: 3px;
  margin-top: 4px;
  transition: all .15s;
}
.dc-btn:hover { background: rgba(240,165,0,.1); }
.dc-btn.done { border-color: rgba(240,165,0,.2); color: rgba(240,165,0,.3); cursor: default; }
#mgr-toggle {
  font: 700 10px 'Barlow Condensed', sans-serif;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--mist);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: color .2s;
}
#mgr-toggle:hover { color: var(--amber); }
"""

if 'MANAGER BRIEFING BAR' in html:
    print("INFO: mgr-bar CSS already present — skipping CSS inject")
else:
    html = html.replace('</style>', MGR_CSS + '\n</style>', 1)
    print("✓  CSS injected")

# ── 2. Inject HTML after <body> ───────────────────────────────────────
MGR_HTML = """
<!-- ============================================
     MANAGER BRIEFING BAR — Construction Suite
     ============================================ -->
<div id="mgr-bar">
  <div class="mgr-top">
    <div>
      <div class="mgr-label">Site Command Briefing · Updated <span id="mgrTime">now</span></div>
      <div class="mgr-brief" id="mgrBrief">
        <strong>3 things need your attention today.</strong>
        <span class="alert"> MEP inspection scheduling is 3 days overdue</span> — contact the inspector and resolve before end of week or Block C timeline slips.
        Supply chain risk is <strong>HIGH</strong> — steel delivery window is narrow and Gate 2 staging must be confirmed today to avoid a $40K crane delay.
        Q2 investor report is due <strong>June 1</strong> — financial reconciliation has not started and 3 subcontractor invoices are unreconciled.
      </div>
    </div>
    <div class="mgr-actions">
      <button class="mgr-approve-btn" onclick="openDecisions()">▶ Needs Your Decision</button>
      <button class="mgr-export-btn" onclick="exportMgrBrief()">↓ Export Briefing</button>
    </div>
  </div>
  <div class="mgr-chips">
    <div class="mgr-chip red">
      <span class="chip-val">MEP</span>
      <span class="chip-label">inspection overdue · 3d</span>
    </div>
    <div class="mgr-divider"></div>
    <div class="mgr-chip red">
      <span class="chip-val">HIGH</span>
      <span class="chip-label">supply chain risk</span>
    </div>
    <div class="mgr-divider"></div>
    <div class="mgr-chip amber">
      <span class="chip-val">3</span>
      <span class="chip-label">approvals needed</span>
    </div>
    <div class="mgr-divider"></div>
    <div class="mgr-chip amber">
      <span class="chip-val">83%</span>
      <span class="chip-label">on schedule</span>
    </div>
    <div class="mgr-divider"></div>
    <div class="mgr-chip amber">
      <span class="chip-val">$4.2M</span>
      <span class="chip-label">budget · watch variance</span>
    </div>
    <div class="mgr-divider"></div>
    <div class="mgr-chip green">
      <span class="chip-val">12</span>
      <span class="chip-label">active sites reporting</span>
    </div>
    <div class="mgr-divider"></div>
    <div class="mgr-chip blue">
      <span class="chip-val">Jun 1</span>
      <span class="chip-label">Q2 report due</span>
    </div>
    <div class="mgr-divider"></div>
    <button id="mgr-toggle" onclick="toggleDecisions()">▼ See decisions</button>
  </div>
  <!-- Collapsible decisions panel -->
  <div id="mgr-decisions">
    <div style="font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--amber);margin-bottom:6px;font-family:'Barlow Condensed',sans-serif;">Needs Your Decision</div>
    <div class="mgr-decision-grid">
      <div class="mgr-decision-card">
        <div class="dc-tag p1">P1 · Act Today</div>
        <div class="dc-text">MEP inspection scheduling overdue by 3 days — call City Inspector Thompson and confirm next available window. Delay blocks Block C CO.</div>
        <div class="dc-deadline">Deadline: End of today · Assigned: J. Patterson</div><br>
        <button class="dc-btn" onclick="this.textContent='✓ Done';this.classList.add('done')">Mark Done</button>
      </div>
      <div class="mgr-decision-card">
        <div class="dc-tag p1">P1 · Act Today</div>
        <div class="dc-text">Steel delivery arrives May 12 — Gate 2 staging crew must be confirmed now. Crane idle time costs $8K/hr if delivery can't unload.</div>
        <div class="dc-deadline">Deadline: 12:00 PM today · Assigned: R. Kowalski</div><br>
        <button class="dc-btn" onclick="this.textContent='✓ Done';this.classList.add('done')">Mark Done</button>
      </div>
      <div class="mgr-decision-card">
        <div class="dc-tag p2">P2 · This Week</div>
        <div class="dc-text">Subcontractor bids for roofing & cladding close May 20. Evaluation team needs to be assembled and scoring criteria confirmed by May 18.</div>
        <div class="dc-deadline">Deadline: May 18 · Assigned: Procurement</div><br>
        <button class="dc-btn" onclick="this.textContent='✓ Done';this.classList.add('done')">Mark Done</button>
      </div>
      <div class="mgr-decision-card">
        <div class="dc-tag p2">P2 · This Week</div>
        <div class="dc-text">Change Order #7 ($42K foundation scope) is pending review. Approve or reject before May 15 to avoid GC invoice dispute on Phase 2 contract.</div>
        <div class="dc-deadline">Deadline: May 15 · Assigned: Finance</div><br>
        <button class="dc-btn" onclick="this.textContent='✓ Done';this.classList.add('done')">Mark Done</button>
      </div>
    </div>
  </div>
</div>
<!-- /MANAGER BRIEFING BAR -->

"""

MGR_JS = """
<script>
// ── Manager Briefing Bar JS ──────────────────────────────────────
(function(){
  const d = new Date();
  const el = document.getElementById('mgrTime');
  if (el) el.textContent = d.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
})();

function openDecisions() {
  const p = document.getElementById('mgr-decisions');
  if (p) { p.classList.add('open'); document.getElementById('mgr-toggle').textContent = '▲ Hide decisions'; }
}
function toggleDecisions() {
  const p = document.getElementById('mgr-decisions');
  const t = document.getElementById('mgr-toggle');
  if (!p) return;
  const open = p.classList.toggle('open');
  t.textContent = open ? '▲ Hide decisions' : '▼ See decisions';
}
function exportMgrBrief() {
  const brief = document.getElementById('mgrBrief')?.innerText || '';
  const chips = [...document.querySelectorAll('.mgr-chip')].map(c => {
    const val = c.querySelector('.chip-val')?.textContent || '';
    const lbl = c.querySelector('.chip-label')?.textContent || '';
    return `• ${val} — ${lbl}`;
  }).join('\\n');
  const txt = `CONSTRUCTION SUITE — SITE COMMAND BRIEFING\\n${'='.repeat(50)}\\n${new Date().toLocaleString()}\\n\\n${brief}\\n\\nKEY METRICS:\\n${chips}`;
  navigator.clipboard?.writeText(txt).then(() => alert('Briefing copied to clipboard'));
}
</script>
"""

if 'id="mgr-bar"' in html:
    print("INFO: mgr-bar HTML already present — skipping HTML inject")
else:
    html = html.replace('<body>', '<body>\n' + MGR_HTML, 1)
    print("✓  Manager Briefing Bar HTML injected")

if 'exportMgrBrief' in html:
    print("INFO: mgr-bar JS already present — skipping JS inject")
else:
    html = html.replace('</body>', MGR_JS + '\n</body>', 1)
    print("✓  Manager Briefing Bar JS injected")

FILE = pathlib.Path('html/construction-suite/construction-strategist.html')
FILE.write_text(html)
print(f"\n✅  {FILE} patched")

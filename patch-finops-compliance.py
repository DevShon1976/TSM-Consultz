#!/usr/bin/env python3
"""
Patch: compliance.html
Adds: License & Renewal Compliance Tracker (tab-renewal)
      Audit & Tax Prep Workspace (tab-auditprep)
Pattern: .tab-btn / .tab-pane / id="tab-*"
"""
import pathlib, sys

FILE = pathlib.Path('html/finops-suite/compliance.html')
if not FILE.exists(): sys.exit(f'ERROR: {FILE} not found')
html = FILE.read_text()

if 'tab-renewal' in html:
    print('INFO: Already patched — exiting'); sys.exit(0)

# ── 1. Find the tab bar and inject new buttons ────────────────────────
# Pattern from grep: .tab-btn / .tab-btn.active
# We need to find the actual tab button HTML — look for tab-dashboard which we know exists
TAB_ANCHOR = 'id="tab-dashboard"'

# Find the tab bar HTML by searching for tab-btn pattern near the tabs div
# From grep line 477: class="tab-bar" at line 456
# Inject new tabs after the last existing tab button
# Strategy: find the tab-bar closing tag and insert before it

# Look for the tab bar section — it should have buttons before the tab panes
# Since we can't see exact HTML, inject after the last recognizable tab button text
# We know tab-hipaa and tab-sox exist from grep lines 1195, 1226

# Find the tab-bar div closing and insert new buttons before </div> that precedes tab panes
# Safe anchor: insert new tab buttons by finding the tab-bar section
OLD_TABBAR_CLOSE = 'class="tab-pane active fade-in"'  # first tab pane div

# We'll inject tab buttons by finding where tab buttons are rendered
# Use the active tab content div as anchor to find tab bar above it
# Instead, let's find the tab bar by its CSS class name
# From grep line 456: .tab-bar { ... }

# Safe approach: inject CSS + find the nav section to add buttons
# Since we see .tab-btn.active at line 477, we look for that pattern in HTML

# Find last tab button before the first tab-pane
import re

# Find all tab-btn occurrences to locate the tab bar HTML
tabbar_match = re.search(r'(<div[^>]*class="[^"]*tab-bar[^"]*"[^>]*>)(.*?)(</div>)', html, re.DOTALL)
if tabbar_match:
    # Inject new buttons inside the tab bar before closing tag
    old_tabbar_inner = tabbar_match.group(0)
    new_buttons = (
        '\n  <button class="tab-btn" onclick="showComplianceTab(\'tab-renewal\',this)">License &amp; Renewals</button>'
        '\n  <button class="tab-btn" onclick="showComplianceTab(\'tab-auditprep\',this)">Audit &amp; Tax Prep</button>'
    )
    new_tabbar = old_tabbar_inner[:-6] + new_buttons + '\n</div>'
    html = html.replace(old_tabbar_inner, new_tabbar, 1)
    print('✓  Tab buttons injected into tab-bar (regex match)')
else:
    # Fallback: find any existing tab-btn and add after the block
    # Look for the pattern of tab buttons using onclick
    btn_pattern = re.search(r'(<button[^>]*class="[^"]*tab-btn[^"]*"[^>]*>.*?</button>\s*)+', html, re.DOTALL)
    if btn_pattern:
        old_btns = btn_pattern.group(0)
        new_btns = (old_btns
            + '\n  <button class="tab-btn" onclick="showComplianceTab(\'tab-renewal\',this)">License &amp; Renewals</button>'
            + '\n  <button class="tab-btn" onclick="showComplianceTab(\'tab-auditprep\',this)">Audit &amp; Tax Prep</button>\n')
        html = html.replace(old_btns, new_btns, 1)
        print('✓  Tab buttons injected (fallback pattern)')
    else:
        print('WARN: Could not find tab bar — add tab buttons manually after existing tabs')

# ── 2. Inject new tab panes before </body> ────────────────────────────
NEW_PANES = """
<!-- ══════════════════════════════════════════════════
     TAB: LICENSE & RENEWAL COMPLIANCE TRACKER
     ══════════════════════════════════════════════════ -->
<div id="tab-renewal" class="tab-pane">
  <div style="padding:20px;overflow-y:auto">
    <!-- Header + Add -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
      <div>
        <div style="color:var(--green);font-size:16px;font-weight:700;letter-spacing:.04em">LICENSE & RENEWAL TRACKER</div>
        <div style="color:var(--text-dim);font-size:11px;margin-top:2px">All licenses, permits, insurance, and contracts in one view</div>
      </div>
      <div style="display:flex;gap:8px">
        <button onclick="renewalShowCalendar()" style="background:none;border:1px solid var(--border);color:var(--text-dim);padding:6px 14px;font-size:10px;cursor:pointer;letter-spacing:.08em;text-transform:uppercase;transition:all .15s">📅 CALENDAR VIEW</button>
        <button onclick="renewalAddItem()" style="background:var(--green);border:none;color:#000;padding:6px 14px;font-size:10px;font-weight:700;cursor:pointer;letter-spacing:.08em;text-transform:uppercase">+ ADD LICENSE</button>
      </div>
    </div>

    <!-- Summary Chips -->
    <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">
      <div style="border:1px solid rgba(255,92,92,.4);background:rgba(255,92,92,.06);padding:6px 14px;font-size:11px;color:#ff5c5c">
        <strong style="font-size:16px">2</strong> EXPIRED
      </div>
      <div style="border:1px solid rgba(245,166,35,.4);background:rgba(245,166,35,.06);padding:6px 14px;font-size:11px;color:var(--amber)">
        <strong style="font-size:16px">3</strong> DUE &lt;30 DAYS
      </div>
      <div style="border:1px solid rgba(245,166,35,.3);background:rgba(245,166,35,.04);padding:6px 14px;font-size:11px;color:var(--amber)">
        <strong style="font-size:16px">4</strong> DUE 30–60 DAYS
      </div>
      <div style="border:1px solid rgba(0,200,100,.3);background:rgba(0,200,100,.05);padding:6px 14px;font-size:11px;color:#00c864">
        <strong style="font-size:16px">18</strong> CURRENT
      </div>
    </div>

    <!-- Action Center: Critical -->
    <div style="background:rgba(255,92,92,.05);border:1px solid rgba(255,92,92,.2);border-left:3px solid #ff5c5c;padding:12px 14px;margin-bottom:16px">
      <div style="color:#ff5c5c;font-size:10px;letter-spacing:.14em;text-transform:uppercase;margin-bottom:8px">⚠ ACTION REQUIRED — EXPIRED / EXPIRING SOON</div>
      <table style="width:100%;border-collapse:collapse;font-size:11px">
        <thead><tr style="color:var(--text-mute);font-size:9px;text-transform:uppercase;letter-spacing:.1em">
          <th style="text-align:left;padding:4px 8px">LICENSE TYPE</th>
          <th style="text-align:left;padding:4px 8px">STORE / ENTITY</th>
          <th style="text-align:left;padding:4px 8px">EXPIRY DATE</th>
          <th style="text-align:left;padding:4px 8px">STATUS</th>
          <th style="text-align:left;padding:4px 8px">OWNER</th>
          <th style="text-align:left;padding:4px 8px">ACTION</th>
        </tr></thead>
        <tbody id="renewal-critical-body">
          <tr style="border-bottom:1px solid rgba(255,255,255,.04)">
            <td style="padding:7px 8px;color:var(--text)">Food Handler Permit</td>
            <td style="padding:7px 8px;color:var(--text-dim)">BK #1042</td>
            <td style="padding:7px 8px;color:#ff5c5c">Apr 30, 2026 <strong>(EXPIRED)</strong></td>
            <td style="padding:7px 8px"><span style="background:rgba(255,92,92,.12);border:1px solid rgba(255,92,92,.4);color:#ff5c5c;font-size:9px;padding:2px 7px">EXPIRED</span></td>
            <td style="padding:7px 8px;color:var(--text-dim)">R.Whitehead</td>
            <td style="padding:7px 8px"><button onclick="renewalRenew(this)" style="background:#ff5c5c;border:none;color:#fff;font-size:9px;padding:3px 10px;cursor:pointer">RENEW NOW</button></td>
          </tr>
          <tr style="border-bottom:1px solid rgba(255,255,255,.04)">
            <td style="padding:7px 8px;color:var(--text)">General Liability Insurance</td>
            <td style="padding:7px 8px;color:var(--text-dim)">All Entities</td>
            <td style="padding:7px 8px;color:#ff5c5c">May 15, 2026</td>
            <td style="padding:7px 8px"><span style="background:rgba(255,92,92,.12);border:1px solid rgba(255,92,92,.4);color:#ff5c5c;font-size:9px;padding:2px 7px">&lt;7 DAYS</span></td>
            <td style="padding:7px 8px;color:var(--text-dim)">M.Torres</td>
            <td style="padding:7px 8px"><button onclick="renewalRenew(this)" style="background:#ff5c5c;border:none;color:#fff;font-size:9px;padding:3px 10px;cursor:pointer">RENEW NOW</button></td>
          </tr>
          <tr style="border-bottom:1px solid rgba(255,255,255,.04)">
            <td style="padding:7px 8px;color:var(--text)">Health Department Permit</td>
            <td style="padding:7px 8px;color:var(--text-dim)">BK #1087</td>
            <td style="padding:7px 8px;color:var(--amber)">Jun 1, 2026</td>
            <td style="padding:7px 8px"><span style="background:rgba(245,166,35,.1);border:1px solid rgba(245,166,35,.4);color:var(--amber);font-size:9px;padding:2px 7px">20 DAYS</span></td>
            <td style="padding:7px 8px;color:var(--text-dim)">R.Whitehead</td>
            <td style="padding:7px 8px"><button onclick="renewalRenew(this)" style="background:rgba(245,166,35,.2);border:1px solid var(--amber);color:var(--amber);font-size:9px;padding:3px 10px;cursor:pointer">SCHEDULE</button></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Full Master List -->
    <div style="margin-bottom:8px;display:flex;align-items:center;justify-content:space-between">
      <div style="color:var(--text-dim);font-size:10px;letter-spacing:.12em;text-transform:uppercase">RENEWAL MASTER LIST</div>
      <input placeholder="Search licenses…" style="background:var(--bg);border:1px solid var(--border);color:var(--text);font-size:10px;padding:5px 10px;outline:none;width:200px" oninput="renewalFilter(this.value)">
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:11px" id="renewal-master">
      <thead><tr style="background:var(--surface);color:var(--text-mute);font-size:9px;text-transform:uppercase;letter-spacing:.1em">
        <th style="text-align:left;padding:8px">TYPE</th>
        <th style="text-align:left;padding:8px">STORE</th>
        <th style="text-align:left;padding:8px">RENEWAL DATE</th>
        <th style="text-align:left;padding:8px">FREQUENCY</th>
        <th style="text-align:left;padding:8px">STATUS</th>
        <th style="text-align:left;padding:8px">OWNER</th>
        <th style="text-align:left;padding:8px">ATTACHMENT</th>
      </tr></thead>
      <tbody>
        <tr style="border-bottom:1px solid rgba(255,255,255,.04)"><td style="padding:7px 8px">Business License</td><td style="padding:7px 8px;color:var(--text-dim)">BK #1042</td><td style="padding:7px 8px">Jan 1, 2027</td><td style="padding:7px 8px;color:var(--text-mute)">Annual</td><td style="padding:7px 8px"><span style="background:rgba(0,200,100,.08);border:1px solid rgba(0,200,100,.3);color:#00c864;font-size:9px;padding:2px 7px">CURRENT</span></td><td style="padding:7px 8px;color:var(--text-dim)">M.Torres</td><td style="padding:7px 8px"><span style="color:var(--green);font-size:10px;cursor:pointer">📎 View</span></td></tr>
        <tr style="border-bottom:1px solid rgba(255,255,255,.04)"><td style="padding:7px 8px">Fire Safety Cert</td><td style="padding:7px 8px;color:var(--text-dim)">BK #1087</td><td style="padding:7px 8px">Aug 15, 2026</td><td style="padding:7px 8px;color:var(--text-mute)">Annual</td><td style="padding:7px 8px"><span style="background:rgba(0,200,100,.08);border:1px solid rgba(0,200,100,.3);color:#00c864;font-size:9px;padding:2px 7px">CURRENT</span></td><td style="padding:7px 8px;color:var(--text-dim)">R.Whitehead</td><td style="padding:7px 8px"><span style="color:var(--text-mute);font-size:10px">No file</span></td></tr>
        <tr style="border-bottom:1px solid rgba(255,255,255,.04)"><td style="padding:7px 8px">Workers Comp Policy</td><td style="padding:7px 8px;color:var(--text-dim)">All Entities</td><td style="padding:7px 8px">Jul 1, 2026</td><td style="padding:7px 8px;color:var(--text-mute)">Annual</td><td style="padding:7px 8px"><span style="background:rgba(0,200,100,.08);border:1px solid rgba(0,200,100,.3);color:#00c864;font-size:9px;padding:2px 7px">CURRENT</span></td><td style="padding:7px 8px;color:var(--text-dim)">Finance</td><td style="padding:7px 8px"><span style="color:var(--green);font-size:10px;cursor:pointer">📎 View</span></td></tr>
        <tr style="border-bottom:1px solid rgba(255,255,255,.04)"><td style="padding:7px 8px">Lease — BK #1103</td><td style="padding:7px 8px;color:var(--text-dim)">BK #1103</td><td style="padding:7px 8px">Dec 31, 2026</td><td style="padding:7px 8px;color:var(--text-mute)">5-Year</td><td style="padding:7px 8px"><span style="background:rgba(0,200,100,.08);border:1px solid rgba(0,200,100,.3);color:#00c864;font-size:9px;padding:2px 7px">CURRENT</span></td><td style="padding:7px 8px;color:var(--text-dim)">Legal</td><td style="padding:7px 8px"><span style="color:var(--green);font-size:10px;cursor:pointer">📎 View</span></td></tr>
        <tr style="border-bottom:1px solid rgba(255,255,255,.04)"><td style="padding:7px 8px">Sign Permit</td><td style="padding:7px 8px;color:var(--text-dim)">BK #1221</td><td style="padding:7px 8px">Jun 20, 2026</td><td style="padding:7px 8px;color:var(--text-mute)">3-Year</td><td style="padding:7px 8px"><span style="background:rgba(245,166,35,.1);border:1px solid rgba(245,166,35,.4);color:var(--amber);font-size:9px;padding:2px 7px">39 DAYS</span></td><td style="padding:7px 8px;color:var(--text-dim)">R.Whitehead</td><td style="padding:7px 8px"><span style="color:var(--text-mute);font-size:10px">No file</span></td></tr>
      </tbody>
    </table>
  </div>
</div>

<!-- ══════════════════════════════════════════════════
     TAB: AUDIT & TAX PREP WORKSPACE
     ══════════════════════════════════════════════════ -->
<div id="tab-auditprep" class="tab-pane">
  <div style="display:grid;grid-template-columns:260px 1fr;min-height:calc(100vh - 90px)">
    <!-- Sidebar: Request List -->
    <div style="background:var(--surface);border-right:1px solid var(--border);padding:16px;overflow-y:auto">
      <div style="color:var(--green);font-size:12px;font-weight:700;margin-bottom:12px;letter-spacing:.06em">AUDIT REQUEST LIST</div>
      <div style="font-size:10px;margin-bottom:12px" id="audit-checklist">
        <div class="audit-req-item" style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.04);cursor:pointer" onclick="auditToggle(this)">
          <span class="audit-box" style="width:14px;height:14px;border:1px solid rgba(255,255,255,.15);display:inline-flex;align-items:center;justify-content:center;font-size:9px;flex-shrink:0"></span>
          <span style="color:var(--text-dim)">AP Aging Report</span>
        </div>
        <div class="audit-req-item" style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.04);cursor:pointer" onclick="auditToggle(this)">
          <span class="audit-box" style="width:14px;height:14px;border:1px solid rgba(255,255,255,.15);display:inline-flex;align-items:center;justify-content:center;font-size:9px;flex-shrink:0"></span>
          <span style="color:var(--text-dim)">Bank Reconciliations (3 months)</span>
        </div>
        <div class="audit-req-item" style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.04);cursor:pointer" onclick="auditToggle(this)">
          <span class="audit-box" style="width:14px;height:14px;border:1px solid rgba(255,255,255,.15);display:inline-flex;align-items:center;justify-content:center;font-size:9px;flex-shrink:0"></span>
          <span style="color:var(--text-dim)">Receipts — Capital Expenditures</span>
        </div>
        <div class="audit-req-item" style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.04);cursor:pointer" onclick="auditToggle(this)">
          <span class="audit-box" style="width:14px;height:14px;border:1px solid rgba(255,255,255,.15);display:inline-flex;align-items:center;justify-content:center;font-size:9px;flex-shrink:0"></span>
          <span style="color:var(--text-dim)">Fixed Asset Roster</span>
        </div>
        <div class="audit-req-item" style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.04);cursor:pointer" onclick="auditToggle(this)">
          <span class="audit-box" style="width:14px;height:14px;border:1px solid rgba(255,255,255,.15);display:inline-flex;align-items:center;justify-content:center;font-size:9px;flex-shrink:0"></span>
          <span style="color:var(--text-dim)">Lease Schedules</span>
        </div>
        <div class="audit-req-item" style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.04);cursor:pointer" onclick="auditToggle(this)">
          <span class="audit-box" style="width:14px;height:14px;border:1px solid rgba(255,255,255,.15);display:inline-flex;align-items:center;justify-content:center;font-size:9px;flex-shrink:0"></span>
          <span style="color:var(--text-dim)">Payroll Registers</span>
        </div>
        <div class="audit-req-item" style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.04);cursor:pointer" onclick="auditToggle(this)">
          <span class="audit-box" style="width:14px;height:14px;border:1px solid rgba(255,255,255,.15);display:inline-flex;align-items:center;justify-content:center;font-size:9px;flex-shrink:0"></span>
          <span style="color:var(--text-dim)">1099 / W-9 File</span>
        </div>
        <div class="audit-req-item" style="display:flex;align-items:center;gap:8px;padding:6px 0;cursor:pointer" onclick="auditToggle(this)">
          <span class="audit-box" style="width:14px;height:14px;border:1px solid rgba(255,255,255,.15);display:inline-flex;align-items:center;justify-content:center;font-size:9px;flex-shrink:0"></span>
          <span style="color:var(--text-dim)">Chart of Accounts Export</span>
        </div>
      </div>
      <div style="background:var(--bg);border:1px solid var(--border);padding:8px;margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:4px">
          <span style="color:var(--text-mute)">Progress</span>
          <span style="color:var(--green)" id="audit-progress-txt">0 / 8</span>
        </div>
        <div style="height:4px;background:rgba(255,255,255,.07);border-radius:2px;overflow:hidden">
          <div id="audit-progress-bar" style="height:100%;background:var(--green);width:0%;transition:width .4s"></div>
        </div>
      </div>
      <button onclick="auditExportChecklist()" style="width:100%;background:none;border:1px solid var(--border);color:var(--text-dim);font-size:10px;padding:7px;cursor:pointer;text-transform:uppercase;letter-spacing:.08em;transition:all .15s">↓ EXPORT CHECKLIST</button>
    </div>

    <!-- Main: Document Upload Center + Workflow Status -->
    <div style="padding:20px;overflow-y:auto">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <div>
          <div style="color:var(--green);font-size:16px;font-weight:700">AUDIT & TAX PREP WORKSPACE</div>
          <div style="color:var(--text-dim);font-size:11px;margin-top:2px">Audit support · Tax prep · Document workflow</div>
        </div>
        <div style="background:rgba(0,200,100,.08);border:1px solid rgba(0,200,100,.25);padding:8px 16px;font-size:11px;color:#00c864">
          Audit Period: <strong>FY 2025</strong>
        </div>
      </div>

      <!-- Document Upload Center -->
      <div style="background:var(--surface);border:1px solid var(--border);padding:14px;margin-bottom:16px">
        <div style="color:var(--text-dim);font-size:10px;letter-spacing:.12em;text-transform:uppercase;margin-bottom:10px">DOCUMENT UPLOAD CENTER</div>
        <div style="border:2px dashed rgba(0,200,100,.2);padding:24px;text-align:center;cursor:pointer;transition:all .2s;margin-bottom:10px" onclick="document.getElementById('audit-file').click()"
          onmouseenter="this.style.borderColor='rgba(0,200,100,.5)'" onmouseleave="this.style.borderColor='rgba(0,200,100,.2)'">
          <input type="file" id="audit-file" multiple accept=".pdf,.csv,.xlsx,.docx" style="display:none" onchange="auditHandleUpload(event)">
          <div style="color:#00c864;font-size:24px;margin-bottom:6px">↑</div>
          <div style="color:var(--text-dim);font-size:11px">Drag & drop or click to upload audit documents</div>
          <div style="color:var(--text-mute);font-size:9px;margin-top:4px">PDF · XLSX · CSV · DOCX · Multiple files accepted</div>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:11px" id="audit-doc-table">
          <thead><tr style="background:rgba(255,255,255,.03);color:var(--text-mute);font-size:9px;text-transform:uppercase;letter-spacing:.08em">
            <th style="text-align:left;padding:6px 8px">DOCUMENT</th>
            <th style="text-align:left;padding:6px 8px">TYPE</th>
            <th style="text-align:left;padding:6px 8px">UPLOADED</th>
            <th style="text-align:left;padding:6px 8px">STATUS</th>
            <th style="text-align:left;padding:6px 8px">ACTION</th>
          </tr></thead>
          <tbody id="audit-doc-body">
            <tr><td style="padding:7px 8px;color:var(--text)">AP_Aging_FY2025.xlsx</td><td style="padding:7px 8px;color:var(--text-mute)">AP Aging</td><td style="padding:7px 8px;color:var(--text-mute)">May 10, 2026</td><td style="padding:7px 8px"><span style="background:rgba(0,200,100,.08);border:1px solid rgba(0,200,100,.3);color:#00c864;font-size:9px;padding:2px 7px">COMPLETE</span></td><td style="padding:7px 8px"><span style="color:var(--green);font-size:10px;cursor:pointer">View</span></td></tr>
            <tr><td style="padding:7px 8px;color:var(--text)">BankRec_Q4_2025.pdf</td><td style="padding:7px 8px;color:var(--text-mute)">Bank Recon</td><td style="padding:7px 8px;color:var(--text-mute)">May 10, 2026</td><td style="padding:7px 8px"><span style="background:rgba(0,200,100,.08);border:1px solid rgba(0,200,100,.3);color:#00c864;font-size:9px;padding:2px 7px">COMPLETE</span></td><td style="padding:7px 8px"><span style="color:var(--green);font-size:10px;cursor:pointer">View</span></td></tr>
            <tr><td style="padding:7px 8px;color:var(--text)">Fixed_Assets_2025.xlsx</td><td style="padding:7px 8px;color:var(--text-mute)">Fixed Assets</td><td style="padding:7px 8px;color:var(--text-mute)">—</td><td style="padding:7px 8px"><span style="background:rgba(245,166,35,.08);border:1px solid rgba(245,166,35,.3);color:var(--amber);font-size:9px;padding:2px 7px">WAITING</span></td><td style="padding:7px 8px"><span style="color:var(--text-mute);font-size:10px">Upload</span></td></tr>
          </tbody>
        </table>
      </div>

      <!-- Workflow Status -->
      <div style="background:var(--surface);border:1px solid var(--border);padding:14px">
        <div style="color:var(--text-dim);font-size:10px;letter-spacing:.12em;text-transform:uppercase;margin-bottom:10px">WORKFLOW STATUS</div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
          <div style="background:var(--bg);border:1px solid rgba(0,200,100,.3);padding:10px;text-align:center">
            <div style="color:#00c864;font-size:20px;font-weight:700">3</div>
            <div style="color:var(--text-mute);font-size:9px;text-transform:uppercase;margin-top:3px">COMPLETE</div>
          </div>
          <div style="background:var(--bg);border:1px solid rgba(245,166,35,.3);padding:10px;text-align:center">
            <div style="color:var(--amber);font-size:20px;font-weight:700">2</div>
            <div style="color:var(--text-mute);font-size:9px;text-transform:uppercase;margin-top:3px">IN PROGRESS</div>
          </div>
          <div style="background:var(--bg);border:1px solid rgba(255,255,255,.08);padding:10px;text-align:center">
            <div style="color:var(--text-dim);font-size:20px;font-weight:700">3</div>
            <div style="color:var(--text-mute);font-size:9px;text-transform:uppercase;margin-top:3px">WAITING</div>
          </div>
          <div style="background:var(--bg);border:1px solid rgba(255,255,255,.08);padding:10px;text-align:center">
            <div style="color:var(--text-dim);font-size:20px;font-weight:700">8</div>
            <div style="color:var(--text-mute);font-size:9px;text-transform:uppercase;margin-top:3px">TOTAL ITEMS</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<script>
/* ── Compliance tab switcher (works alongside existing showTab) ── */
function showComplianceTab(id, el) {
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const pane = document.getElementById(id);
  if (pane) pane.classList.add('active');
  if (el) el.classList.add('active');
}

/* ── License & Renewal ── */
function renewalRenew(btn) { btn.textContent = '✓ INITIATED'; btn.style.opacity = '.5'; }
function renewalShowCalendar() { alert('Calendar view — coming soon'); }
function renewalAddItem() { alert('Add license dialog — coming soon'); }
function renewalFilter(q) {
  const rows = document.querySelectorAll('#renewal-master tbody tr');
  rows.forEach(r => {
    r.style.display = r.textContent.toLowerCase().includes(q.toLowerCase()) ? '' : 'none';
  });
}

/* ── Audit Workspace ── */
let auditDone = 0;
const auditTotal = 8;
function auditToggle(item) {
  const box = item.querySelector('.audit-box');
  const label = item.querySelector('span:last-child');
  const done = item.dataset.done === '1';
  item.dataset.done = done ? '0' : '1';
  box.textContent = done ? '' : '✓';
  box.style.background = done ? '' : 'var(--green)';
  box.style.borderColor = done ? '' : 'var(--green)';
  box.style.color = done ? '' : '#000';
  label.style.textDecoration = done ? '' : 'line-through';
  label.style.color = done ? '' : 'var(--text-mute)';
  auditDone = [...document.querySelectorAll('#audit-checklist [data-done="1"]')].length;
  document.getElementById('audit-progress-txt').textContent = auditDone + ' / ' + auditTotal;
  document.getElementById('audit-progress-bar').style.width = Math.round(auditDone/auditTotal*100) + '%';
}
function auditHandleUpload(e) {
  const files = [...e.target.files];
  const tbody = document.getElementById('audit-doc-body');
  files.forEach(f => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td style="padding:7px 8px;color:var(--text)">${f.name}</td><td style="padding:7px 8px;color:var(--text-mute)">Uploaded</td><td style="padding:7px 8px;color:var(--text-mute)">${new Date().toLocaleDateString()}</td><td style="padding:7px 8px"><span style="background:rgba(0,200,100,.08);border:1px solid rgba(0,200,100,.3);color:#00c864;font-size:9px;padding:2px 7px">COMPLETE</span></td><td style="padding:7px 8px"><span style="color:var(--green);font-size:10px;cursor:pointer">View</span></td>`;
    tbody.appendChild(tr);
  });
}
function auditExportChecklist() { alert('Checklist exported'); }
</script>
"""

html = html.replace('</body>', NEW_PANES + '\n</body>', 1)
print('✓  License & Renewal tab + Audit & Tax Prep tab injected')

FILE.write_text(html)
print(f'\n✅  {FILE} patched')

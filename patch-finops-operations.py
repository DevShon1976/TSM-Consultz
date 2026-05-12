#!/usr/bin/env python3
"""
Patch: finops-operations.html
Adds:  07 · Weekly Cash Sweep & Reconciliation
       08 · Credit Card Reconciliation
       09 · Payroll Readiness
       Enhances 05 · Portfolio Prep with BK Corporate Reporting Pack
Pattern: switchMod() / tnav-btn / MODULE comments
"""
import pathlib, sys, re

FILE = pathlib.Path('html/finops-suite/finops-operations.html')
if not FILE.exists(): sys.exit(f'ERROR: {FILE} not found')
html = FILE.read_text()

if 'switchMod(\'cashrecon\'' in html:
    print('INFO: Already patched — exiting'); sys.exit(0)

# ── 1. NEW TAB BUTTONS (after tab 06) ────────────────────────────────
OLD_TABS = "onclick=\"switchMod('compliance',this)\">Compliance <span class=\"tab-badge\">06</span></button>"
NEW_TABS = (
    OLD_TABS
    + "\n    <button class=\"tnav-btn\" onclick=\"switchMod('cashrecon',this)\">Cash Recon <span class=\"tab-badge\">07</span></button>"
    + "\n    <button class=\"tnav-btn\" onclick=\"switchMod('ccrecon',this)\">CC Recon <span class=\"tab-badge\">08</span></button>"
    + "\n    <button class=\"tnav-btn\" onclick=\"switchMod('payroll',this)\">Payroll <span class=\"tab-badge\">09</span></button>"
)
html = html.replace(OLD_TABS, NEW_TABS, 1)
print('✓  Tab buttons 07/08/09 injected')

# ── 2. NEW MODULE HTML (inject before </body>) ───────────────────────
NEW_MODULES = """
<!-- ═══ MODULE 07 — WEEKLY CASH SWEEP & RECONCILIATION ═══ -->
<div class="mod-panel" id="mod-cashrecon">
  <div style="display:grid;grid-template-columns:300px 1fr;gap:0;min-height:calc(100vh - 90px)">
    <!-- Sidebar -->
    <div style="background:var(--surface);border-right:1px solid var(--border);padding:16px;overflow-y:auto">
      <div class="comp-lbl" style="margin-bottom:12px">DEPOSIT IMPORT</div>
      <div style="margin-bottom:10px">
        <div class="field-lbl">Date</div>
        <input class="field-input" type="date" id="cr-date">
      </div>
      <div style="margin-bottom:10px">
        <div class="field-lbl">Store</div>
        <select class="field-input" id="cr-store">
          <option>BK #1042 — Downtown</option><option>BK #1087 — Westside</option>
          <option>BK #1103 — Airport</option><option>BK #1221 — Eastgate</option>
        </select>
      </div>
      <div style="margin-bottom:10px">
        <div class="field-lbl">Source</div>
        <select class="field-input" id="cr-source">
          <option>POS — In-Store</option><option>Toast</option><option>Square</option>
          <option>UberEats</option><option>DoorDash</option><option>Manual Entry</option>
        </select>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
        <div><div class="field-lbl">Expected ($)</div><input class="field-input" type="number" id="cr-expected" placeholder="0.00"></div>
        <div><div class="field-lbl">Actual ($)</div><input class="field-input" type="number" id="cr-actual" placeholder="0.00"></div>
      </div>
      <div style="margin-bottom:14px">
        <div class="field-lbl">Notes</div>
        <textarea class="field-input" rows="2" id="cr-notes" style="resize:none" placeholder="Variance reason, safe count notes…"></textarea>
      </div>
      <button class="btn-primary" onclick="crAddDeposit()" style="width:100%;margin-bottom:8px">+ LOG DEPOSIT</button>
      <div style="border:1px dashed var(--border2);padding:12px;text-align:center;cursor:pointer;margin-top:6px" onclick="document.getElementById('cr-file').click()">
        <input type="file" id="cr-file" accept=".csv,.xlsx" style="display:none" onchange="crHandleFile(event)">
        <div style="color:var(--cyan2);font-size:11px">↑ Import CSV / XLSX</div>
        <div style="color:var(--text-mute);font-size:9px;margin-top:3px">POS export, bank statement</div>
      </div>
      <div style="margin-top:16px;border-top:1px solid var(--border);padding-top:12px">
        <div class="comp-lbl" style="margin-bottom:8px">WEEK SUMMARY</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
          <div style="background:var(--bg);border:1px solid var(--border);padding:8px">
            <div style="color:var(--cyan2);font-size:18px;font-weight:700" id="cr-week-total">$0</div>
            <div style="color:var(--text-mute);font-size:9px">TOTAL DEPOSITS</div>
          </div>
          <div style="background:var(--bg);border:1px solid var(--border);padding:8px">
            <div style="color:var(--amber);font-size:18px;font-weight:700" id="cr-week-var">$0</div>
            <div style="color:var(--text-mute);font-size:9px">TOTAL VARIANCE</div>
          </div>
        </div>
        <button class="btn-secondary" onclick="crGenerateReport()" style="width:100%;margin-top:8px;font-size:10px">↓ GENERATE WEEKLY REPORT</button>
      </div>
    </div>
    <!-- Main -->
    <div style="padding:16px;overflow-y:auto">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
        <div style="color:var(--cyan2);font-size:13px;font-weight:700;letter-spacing:.04em">DAILY CASH RECONCILIATION</div>
        <div style="display:flex;gap:8px">
          <button class="btn-secondary" onclick="crAutoMatch()" style="font-size:10px">⚡ AUTO-MATCH</button>
          <button class="btn-secondary" onclick="crClearAll()" style="font-size:10px">CLEAR</button>
        </div>
      </div>
      <!-- Alerts -->
      <div id="cr-alerts" style="margin-bottom:12px"></div>
      <!-- Log Table -->
      <table class="tbl" style="width:100%">
        <thead><tr>
          <th>DATE</th><th>STORE</th><th>SOURCE</th>
          <th>EXPECTED</th><th>ACTUAL</th><th>VARIANCE</th><th>STATUS</th><th>NOTES</th>
        </tr></thead>
        <tbody id="cr-log-body">
          <tr><td colspan="8" style="color:var(--text-mute);font-style:italic;text-align:center;padding:20px">No deposits logged yet — add via sidebar or import CSV</td></tr>
        </tbody>
      </table>
      <!-- Weekly Summary -->
      <div style="margin-top:16px;background:var(--surface);border:1px solid var(--border);padding:14px">
        <div class="comp-lbl" style="margin-bottom:10px">WEEKLY CASH REPORT PREVIEW</div>
        <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px">
          <div style="background:var(--bg);border:1px solid var(--border);padding:10px;text-align:center">
            <div style="color:var(--text-mute);font-size:9px;margin-bottom:4px">BEGIN BALANCE</div>
            <div style="color:var(--cyan2);font-size:16px;font-weight:700" id="cr-begin">—</div>
          </div>
          <div style="background:var(--bg);border:1px solid var(--border);padding:10px;text-align:center">
            <div style="color:var(--text-mute);font-size:9px;margin-bottom:4px">DEPOSITS</div>
            <div style="color:var(--cyan2);font-size:16px;font-weight:700" id="cr-dep-total">—</div>
          </div>
          <div style="background:var(--bg);border:1px solid var(--border);padding:10px;text-align:center">
            <div style="color:var(--text-mute);font-size:9px;margin-bottom:4px">WITHDRAWALS</div>
            <div style="color:var(--amber);font-size:16px;font-weight:700" id="cr-wd">—</div>
          </div>
          <div style="background:var(--bg);border:1px solid var(--border);padding:10px;text-align:center">
            <div style="color:var(--text-mute);font-size:9px;margin-bottom:4px">VARIANCE</div>
            <div style="color:var(--red,#ff5c5c);font-size:16px;font-weight:700" id="cr-var-total">—</div>
          </div>
          <div style="background:var(--bg);border:1px solid var(--border);padding:10px;text-align:center">
            <div style="color:var(--text-mute);font-size:9px;margin-bottom:4px">END BALANCE</div>
            <div style="color:var(--cyan2);font-size:16px;font-weight:700" id="cr-end">—</div>
          </div>
        </div>
        <button class="btn-primary" onclick="crSendReport()" style="margin-top:10px;width:100%">↑ SEND REPORT TO MANAGEMENT</button>
      </div>
    </div>
  </div>
</div>

<!-- ═══ MODULE 08 — CREDIT CARD RECONCILIATION ═══ -->
<div class="mod-panel" id="mod-ccrecon">
  <div style="display:grid;grid-template-columns:280px 1fr;gap:0;min-height:calc(100vh - 90px)">
    <!-- Sidebar -->
    <div style="background:var(--surface);border-right:1px solid var(--border);padding:16px;overflow-y:auto">
      <div class="comp-lbl" style="margin-bottom:12px">IMPORT STATEMENT</div>
      <div style="margin-bottom:10px">
        <div class="field-lbl">Card / Account</div>
        <select class="field-input" id="cc-card">
          <option>AMEX Corp — x4821</option><option>Chase Ink — x7743</option>
          <option>BofA Rewards — x2219</option><option>Capital One — x9901</option>
        </select>
      </div>
      <div style="margin-bottom:10px">
        <div class="field-lbl">Statement Period</div>
        <input class="field-input" type="month" id="cc-period">
      </div>
      <div style="border:1px dashed var(--border2);padding:12px;text-align:center;cursor:pointer;margin-bottom:10px" onclick="document.getElementById('cc-file').click()">
        <input type="file" id="cc-file" accept=".pdf,.csv" style="display:none" onchange="ccHandleUpload(event)">
        <div style="color:var(--cyan2);font-size:11px">↑ Upload PDF / CSV</div>
        <div style="color:var(--text-mute);font-size:9px;margin-top:3px">Statement or export</div>
      </div>
      <div class="comp-lbl" style="margin-bottom:8px">AUTO-CATEGORIZATION RULES</div>
      <div id="cc-rules" style="font-size:10px">
        <div style="border-bottom:1px solid var(--border);padding:5px 0;display:flex;justify-content:space-between">
          <span style="color:var(--text-dim)">Pest Control →</span><span style="color:var(--cyan2)">Repairs & Maint.</span>
        </div>
        <div style="border-bottom:1px solid var(--border);padding:5px 0;display:flex;justify-content:space-between">
          <span style="color:var(--text-dim)">BK Corporate Fees →</span><span style="color:var(--cyan2)">Franchise Fees</span>
        </div>
        <div style="border-bottom:1px solid var(--border);padding:5px 0;display:flex;justify-content:space-between">
          <span style="color:var(--text-dim)">Home Depot →</span><span style="color:var(--cyan2)">Equipment/Repairs</span>
        </div>
        <div style="border-bottom:1px solid var(--border);padding:5px 0;display:flex;justify-content:space-between">
          <span style="color:var(--text-dim)">Sysco →</span><span style="color:var(--cyan2)">COGS / Food Cost</span>
        </div>
        <div style="border-bottom:1px solid var(--border);padding:5px 0;display:flex;justify-content:space-between">
          <span style="color:var(--text-dim)">Aramark →</span><span style="color:var(--cyan2)">Uniforms / Supplies</span>
        </div>
      </div>
      <button class="btn-secondary" onclick="ccAddRule()" style="width:100%;font-size:10px;margin-top:8px">+ ADD RULE</button>
      <div style="margin-top:12px">
        <button class="btn-primary" onclick="ccRunCategorize()" style="width:100%">⚡ AUTO-CATEGORIZE</button>
      </div>
    </div>
    <!-- Main: Exception Dashboard -->
    <div style="padding:16px;overflow-y:auto">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
        <div style="color:var(--cyan2);font-size:13px;font-weight:700">EXCEPTION DASHBOARD</div>
        <div style="display:flex;gap:6px">
          <span style="background:rgba(255,92,92,.12);border:1px solid rgba(255,92,92,.3);color:#ff5c5c;font-size:10px;padding:3px 8px" id="cc-uncategorized-badge">0 Uncategorized</span>
          <span style="background:rgba(245,166,35,.1);border:1px solid rgba(245,166,35,.3);color:var(--amber);font-size:10px;padding:3px 8px" id="cc-missing-badge">0 Missing Receipts</span>
        </div>
      </div>
      <!-- Exception sections -->
      <div style="margin-bottom:16px">
        <div class="comp-lbl" style="color:#ff5c5c;margin-bottom:8px">⚠ UNCATEGORIZED TRANSACTIONS</div>
        <table class="tbl" style="width:100%">
          <thead><tr><th>DATE</th><th>MERCHANT</th><th>AMOUNT</th><th>SUGGESTED CATEGORY</th><th>ACTION</th></tr></thead>
          <tbody id="cc-uncat-body">
            <tr><td>05-01</td><td>AMAZON AMZN.COM</td><td>$847.22</td><td><select class="field-input" style="padding:2px 4px;font-size:10px"><option>— Select —</option><option>Office Supplies</option><option>Equipment</option><option>Other</option></select></td><td><button onclick="ccApprove(this)" style="background:var(--cyan2);border:none;color:var(--bg);font-size:9px;padding:2px 8px;cursor:pointer">APPLY</button></td></tr>
            <tr><td>05-03</td><td>GRAINGER #4421</td><td>$1,240.00</td><td><select class="field-input" style="padding:2px 4px;font-size:10px"><option>— Select —</option><option>Repairs & Maint.</option><option>Equipment</option><option>COGS</option></select></td><td><button onclick="ccApprove(this)" style="background:var(--cyan2);border:none;color:var(--bg);font-size:9px;padding:2px 8px;cursor:pointer">APPLY</button></td></tr>
          </tbody>
        </table>
      </div>
      <div style="margin-bottom:16px">
        <div class="comp-lbl" style="color:var(--amber);margin-bottom:8px">⚠ MISSING RECEIPTS</div>
        <table class="tbl" style="width:100%">
          <thead><tr><th>DATE</th><th>MERCHANT</th><th>AMOUNT</th><th>CARDHOLDER</th><th>STATUS</th></tr></thead>
          <tbody id="cc-missing-body">
            <tr><td>04-28</td><td>MARRIOTT HOTELS</td><td>$482.00</td><td>R.Whitehead</td><td><span style="background:rgba(245,166,35,.1);border:1px solid rgba(245,166,35,.3);color:var(--amber);font-size:9px;padding:1px 6px">PENDING</span></td></tr>
            <tr><td>04-30</td><td>DELTA AIRLINES</td><td>$319.50</td><td>M.Torres</td><td><span style="background:rgba(245,166,35,.1);border:1px solid rgba(245,166,35,.3);color:var(--amber);font-size:9px;padding:1px 6px">PENDING</span></td></tr>
          </tbody>
        </table>
      </div>
      <div>
        <div class="comp-lbl" style="color:#ff5c5c;margin-bottom:8px">⚠ UNUSUAL SPEND / FRAUD FLAGS</div>
        <table class="tbl" style="width:100%">
          <thead><tr><th>DATE</th><th>MERCHANT</th><th>AMOUNT</th><th>FLAG REASON</th><th>ACTION</th></tr></thead>
          <tbody>
            <tr><td>05-07</td><td>UNKNOWN VENDOR LLC</td><td>$3,800.00</td><td style="color:#ff5c5c">New vendor · large amount</td><td><button onclick="ccEscalate(this)" style="background:rgba(255,92,92,.15);border:1px solid rgba(255,92,92,.4);color:#ff5c5c;font-size:9px;padding:2px 8px;cursor:pointer">ESCALATE</button></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>

<!-- ═══ MODULE 09 — PAYROLL READINESS ═══ -->
<div class="mod-panel" id="mod-payroll">
  <div style="display:grid;grid-template-columns:280px 1fr;gap:0;min-height:calc(100vh - 90px)">
    <!-- Sidebar -->
    <div style="background:var(--surface);border-right:1px solid var(--border);padding:16px;overflow-y:auto">
      <div class="comp-lbl" style="margin-bottom:12px">PAYROLL PERIOD</div>
      <div style="margin-bottom:10px">
        <div class="field-lbl">Pay Period</div>
        <select class="field-input" id="pr-period">
          <option>May 1–15, 2026</option><option>May 16–31, 2026</option>
          <option>Apr 16–30, 2026</option><option>Apr 1–15, 2026</option>
        </select>
      </div>
      <div style="margin-bottom:10px">
        <div class="field-lbl">Store / Entity</div>
        <select class="field-input">
          <option>All Stores</option><option>BK #1042</option><option>BK #1087</option>
          <option>BK #1103</option><option>BK #1221</option>
        </select>
      </div>
      <div style="border:1px dashed var(--border2);padding:12px;text-align:center;cursor:pointer;margin-bottom:12px" onclick="document.getElementById('pr-file').click()">
        <input type="file" id="pr-file" accept=".csv,.xlsx" style="display:none" onchange="prHandleUpload(event)">
        <div style="color:var(--cyan2);font-size:11px">↑ Import Timeclock File</div>
        <div style="color:var(--text-mute);font-size:9px;margin-top:3px">CSV / XLSX export from POS/timeclock</div>
      </div>
      <button class="btn-primary" onclick="prCheckExceptions()" style="width:100%;margin-bottom:8px">⚡ CHECK EXCEPTIONS</button>
      <button class="btn-secondary" onclick="prGeneratePacket()" style="width:100%;font-size:10px">↓ GENERATE SUBMISSION PACKET</button>
      <div style="margin-top:16px;border-top:1px solid var(--border);padding-top:12px">
        <div class="comp-lbl" style="margin-bottom:8px">PERIOD STATUS</div>
        <div style="font-size:11px;line-height:1.8">
          <div style="display:flex;justify-content:space-between"><span style="color:var(--text-mute)">Employees</span><span style="color:var(--cyan2)" id="pr-emp-count">47</span></div>
          <div style="display:flex;justify-content:space-between"><span style="color:var(--text-mute)">Total Hours</span><span style="color:var(--cyan2)" id="pr-hours">1,842</span></div>
          <div style="display:flex;justify-content:space-between"><span style="color:var(--text-mute)">OT Hours</span><span style="color:var(--amber)" id="pr-ot">84</span></div>
          <div style="display:flex;justify-content:space-between"><span style="color:var(--text-mute)">Exceptions</span><span style="color:#ff5c5c" id="pr-exceptions">3</span></div>
          <div style="display:flex;justify-content:space-between"><span style="color:var(--text-mute)">New Hires</span><span style="color:var(--cyan2)" id="pr-new">2</span></div>
          <div style="display:flex;justify-content:space-between"><span style="color:var(--text-mute)">Terms</span><span style="color:var(--amber)" id="pr-terms">1</span></div>
        </div>
      </div>
    </div>
    <!-- Main -->
    <div style="padding:16px;overflow-y:auto">
      <div style="color:var(--cyan2);font-size:13px;font-weight:700;margin-bottom:14px">PAYROLL EXCEPTION CHECKER</div>
      <!-- Exceptions -->
      <div style="margin-bottom:16px">
        <div class="comp-lbl" style="color:#ff5c5c;margin-bottom:8px">⚠ EXCEPTIONS — ACTION REQUIRED</div>
        <div style="background:rgba(255,92,92,.06);border:1px solid rgba(255,92,92,.25);padding:10px;margin-bottom:6px;border-left:3px solid #ff5c5c">
          <div style="font-weight:700;color:#ff5c5c;font-size:11px">Overtime Spike — BK #1087</div>
          <div style="color:var(--text-dim);font-size:10px;margin-top:2px">J. Martinez: 22 OT hrs (threshold: 15). Manager approval required before submission.</div>
        </div>
        <div style="background:rgba(245,166,35,.06);border:1px solid rgba(245,166,35,.25);padding:10px;margin-bottom:6px;border-left:3px solid var(--amber)">
          <div style="font-weight:700;color:var(--amber);font-size:11px">Missing Punch — BK #1042</div>
          <div style="color:var(--text-dim);font-size:10px;margin-top:2px">T. Kim: May 8 clock-out missing. Estimated 8.5 hrs applied — verify with manager.</div>
        </div>
        <div style="background:rgba(245,166,35,.06);border:1px solid rgba(245,166,35,.25);padding:10px;margin-bottom:6px;border-left:3px solid var(--amber)">
          <div style="font-weight:700;color:var(--amber);font-size:11px">Rate Change — BK #1103</div>
          <div style="color:var(--text-dim);font-size:10px;margin-top:2px">D. Park: Pay rate updated mid-period ($14.50 → $16.00). Confirm effective date.</div>
        </div>
      </div>
      <!-- Hours Summary Table -->
      <div class="comp-lbl" style="margin-bottom:8px">HOURS SUMMARY</div>
      <table class="tbl" style="width:100%;margin-bottom:16px">
        <thead><tr><th>STORE</th><th>EMPLOYEES</th><th>REG HRS</th><th>OT HRS</th><th>TOTAL HRS</th><th>STATUS</th></tr></thead>
        <tbody>
          <tr><td>BK #1042</td><td>12</td><td>456</td><td>18</td><td>474</td><td><span class="pill pill-ok">READY</span></td></tr>
          <tr><td>BK #1087</td><td>14</td><td>501</td><td>42</td><td>543</td><td><span class="pill pill-amber">REVIEW</span></td></tr>
          <tr><td>BK #1103</td><td>11</td><td>398</td><td>14</td><td>412</td><td><span class="pill pill-amber">REVIEW</span></td></tr>
          <tr><td>BK #1221</td><td>10</td><td>388</td><td>10</td><td>398</td><td><span class="pill pill-ok">READY</span></td></tr>
        </tbody>
      </table>
      <!-- Submission Packet -->
      <div style="background:var(--surface);border:1px solid var(--border);padding:14px">
        <div class="comp-lbl" style="margin-bottom:10px">PAYROLL SUBMISSION PACKET</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px">
          <div style="background:var(--bg);border:1px solid var(--border);padding:8px;font-size:10px">
            <div style="color:var(--text-mute);margin-bottom:3px">HOURS FILE</div>
            <div style="color:var(--cyan2)">✓ Ready</div>
          </div>
          <div style="background:var(--bg);border:1px solid var(--border);padding:8px;font-size:10px">
            <div style="color:var(--text-mute);margin-bottom:3px">EXCEPTION NOTES</div>
            <div style="color:var(--amber)">3 Pending</div>
          </div>
          <div style="background:var(--bg);border:1px solid var(--border);padding:8px;font-size:10px">
            <div style="color:var(--text-mute);margin-bottom:3px">NEW HIRE / TERM</div>
            <div style="color:var(--cyan2)">2 New · 1 Term</div>
          </div>
        </div>
        <button class="btn-primary" onclick="prSubmit()" style="width:100%">↑ SUBMIT TO PAYROLL COMPANY</button>
      </div>
    </div>
  </div>
</div>

<script>
/* ── MODULE 07: Weekly Cash Recon ── */
let crDeposits = [];
function crAddDeposit() {
  const date = document.getElementById('cr-date').value || 'N/A';
  const store = document.getElementById('cr-store').value;
  const source = document.getElementById('cr-source').value;
  const exp = parseFloat(document.getElementById('cr-expected').value) || 0;
  const act = parseFloat(document.getElementById('cr-actual').value) || 0;
  const notes = document.getElementById('cr-notes').value;
  const variance = act - exp;
  crDeposits.push({ date, store, source, exp, act, variance, notes });
  crRenderLog();
  crUpdateSummary();
}
function crRenderLog() {
  const tbody = document.getElementById('cr-log-body');
  if (!crDeposits.length) { tbody.innerHTML='<tr><td colspan="8" style="color:var(--text-mute);font-style:italic;text-align:center;padding:20px">No deposits logged</td></tr>'; return; }
  tbody.innerHTML = crDeposits.map(d => {
    const vc = d.variance < 0 ? '#ff5c5c' : d.variance > 0 ? 'var(--amber)' : 'var(--cyan2)';
    const status = Math.abs(d.variance) < 1 ? '<span class="pill pill-ok">MATCHED</span>' : '<span class="pill pill-amber">VARIANCE</span>';
    return `<tr><td>${d.date}</td><td>${d.store}</td><td>${d.source}</td><td>$${d.exp.toFixed(2)}</td><td>$${d.act.toFixed(2)}</td><td style="color:${vc}">$${d.variance.toFixed(2)}</td><td>${status}</td><td style="font-size:10px;color:var(--text-mute)">${d.notes}</td></tr>`;
  }).join('');
}
function crUpdateSummary() {
  const total = crDeposits.reduce((s,d) => s+d.act, 0);
  const totalVar = crDeposits.reduce((s,d) => s+d.variance, 0);
  document.getElementById('cr-week-total').textContent = '$' + total.toLocaleString('en',{minimumFractionDigits:2});
  document.getElementById('cr-week-var').textContent = '$' + Math.abs(totalVar).toFixed(2);
}
function crAutoMatch() { if(window.toast) toast('Auto-matching bank activity to deposits…'); }
function crClearAll() { crDeposits=[]; crRenderLog(); crUpdateSummary(); }
function crHandleFile(e) { if(window.toast) toast('Importing ' + e.target.files[0]?.name + '…'); }
function crGenerateReport() { if(window.toast) toast('Weekly report generated — ready to export PDF'); }
function crSendReport() { if(window.toast) toast('Report sent to management'); }

/* ── MODULE 08: CC Recon ── */
function ccHandleUpload(e) { if(window.toast) toast('Parsing ' + e.target.files[0]?.name + '…'); }
function ccRunCategorize() { if(window.toast) toast('Auto-categorization complete — 2 exceptions remain'); }
function ccApprove(btn) { btn.closest('tr').style.opacity='.4'; btn.textContent='✓'; }
function ccEscalate(btn) { btn.textContent='ESCALATED'; btn.style.background='rgba(255,92,92,.3)'; }
function ccAddRule() { if(window.toast) toast('Rule builder coming soon'); }

/* ── MODULE 09: Payroll ── */
function prHandleUpload(e) { if(window.toast) toast('Timeclock file imported: ' + e.target.files[0]?.name); }
function prCheckExceptions() { if(window.toast) toast('Exception check complete — 3 items flagged'); }
function prGeneratePacket() { if(window.toast) toast('Submission packet generated'); }
function prSubmit() { if(window.toast) toast('Payroll submitted to processor'); }
</script>
"""

# BK Corporate Reporting enhancement for Portfolio Prep (Module 05)
BK_REPORTING = """
      <!-- BK Corporate Reporting Pack -->
      <div style="margin-top:16px;background:var(--surface);border:1px solid var(--border);padding:14px">
        <div class="comp-lbl" style="margin-bottom:10px">BK CORPORATE REPORTING PACK</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
          <div>
            <div class="field-lbl">Reporting Period</div>
            <select class="field-input">
              <option>Period 5 — May 2026</option><option>Period 4 — Apr 2026</option>
              <option>Q1 2026</option><option>FY 2025</option>
            </select>
          </div>
          <div>
            <div class="field-lbl">Report Type</div>
            <select class="field-input">
              <option>Period Sales Summary</option><option>Royalty / Ad Fee Calc</option>
              <option>Store-by-Store P&amp;L</option><option>Period-over-Period</option>
            </select>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:10px;font-size:10px">
          <div style="background:var(--bg);border:1px solid var(--border);padding:8px">
            <div style="color:var(--text-mute);margin-bottom:2px">PERIOD SALES</div>
            <div style="color:var(--cyan2);font-size:16px;font-weight:700">$1.24M</div>
          </div>
          <div style="background:var(--bg);border:1px solid var(--border);padding:8px">
            <div style="color:var(--text-mute);margin-bottom:2px">ROYALTY FEE (4.5%)</div>
            <div style="color:var(--amber);font-size:16px;font-weight:700">$55,800</div>
          </div>
          <div style="background:var(--bg);border:1px solid var(--border);padding:8px">
            <div style="color:var(--text-mute);margin-bottom:2px">AD FUND (4%)</div>
            <div style="color:var(--amber);font-size:16px;font-weight:700">$49,600</div>
          </div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn-primary" onclick="if(window.toast)toast('Generating BK Corporate Report PDF…')" style="flex:1">↓ GENERATE REPORT</button>
          <button class="btn-secondary" onclick="if(window.toast)toast('Sending to BK Corporate portal…')" style="flex:1;font-size:10px">↑ SEND TO CORPORATE</button>
        </div>
      </div>"""

# Find Module 05 portfolio section and inject BK reporting before its closing div
# Look for the chart table closing tag in module 05
if 'BK CORPORATE REPORTING PACK' not in html:
    # Find end of Module 05 content area (before Module 06 comment)
    M05_ANCHOR = '<!-- ═══ MODULE 06 — COMPLIANCE ═══ -->'
    html = html.replace(M05_ANCHOR, BK_REPORTING + '\n\n' + M05_ANCHOR, 1)
    print('✓  BK Corporate Reporting injected into Portfolio Prep (Module 05)')

if '<!-- ═══ MODULE 07' not in html:
    html = html.replace('</body>', NEW_MODULES + '\n</body>', 1)
    print('✓  Modules 07 (Cash Recon), 08 (CC Recon), 09 (Payroll) injected')

FILE.write_text(html)
print(f'\n✅  {FILE} patched')

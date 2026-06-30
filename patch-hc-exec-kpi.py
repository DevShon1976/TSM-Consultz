#!/usr/bin/env python3
"""
patch-hc-exec-kpi.py
Wires actionRevLoss, noActionRevLoss, and recoveryTime from the
Strategist JSON block into HC exec portal KPI tiles.

Usage (run from repo root in Codespaces):
  python3 patch-hc-exec-kpi.py

Targets: html/healthcare/executive-portal.html
"""

import re, sys, pathlib

TARGET = pathlib.Path("html/healthcare/executive-portal.html")

if not TARGET.exists():
    sys.exit(f"ERROR: {TARGET} not found — run from repo root.")

src = TARGET.read_text(encoding="utf-8")

# ── 1. Check if already patched ──────────────────────────────────
if "actionRevLoss" in src and "noActionRevLoss" in src and "recoveryTime" in src:
    print("✅ Already patched — all three fields present. Nothing to do.")
    sys.exit(0)

# ── 2. The KPI injection block ────────────────────────────────────
# Injected right after the existing relay JSON parse block.
# Looks for the pattern where relay data is parsed and KPI tiles populated.
# We inject into extractRelayIntelligence() or equivalent, before its closing brace.

KPI_INJECTION = """
    // ── TSM PATCH: wire Strategist JSON fields into KPI tiles ──────────
    (function wireStratKPIs(relayJson) {
      try {
        // relayJson may be the parsed JSON object from the ===JSON=== block
        // or embedded in TSM_HC_RELAY / TSM_RELAY_DATA localStorage keys
        var raw = relayJson
          || JSON.parse(localStorage.getItem('TSM_HC_RELAY') || '{}')
          || JSON.parse(localStorage.getItem('TSM_RELAY_DATA') || '{}');

        var stratJson = raw.stratJson || raw.json || raw;

        var noAction   = stratJson.noActionRevLoss  || '—';
        var withAction = stratJson.actionRevLoss     || '—';
        var recovery   = stratJson.recoveryTime      || '—';
        var confidence = stratJson.confidence != null ? stratJson.confidence + '%' : '—';

        // Target KPI tile elements by data-kpi attribute (preferred)
        // or fall back to id-based lookup used in older portals
        function setKPI(selector, value) {
          var el = document.querySelector(selector);
          if (el) el.textContent = value;
        }

        // Primary: data-kpi attributes
        setKPI('[data-kpi="noActionRevLoss"]',  noAction);
        setKPI('[data-kpi="actionRevLoss"]',    withAction);
        setKPI('[data-kpi="recoveryTime"]',     recovery);
        setKPI('[data-kpi="confidence"]',       confidence);

        // Fallback: id-based tiles (common pattern in HC portal)
        setKPI('#kpi-no-action-rev',   noAction);
        setKPI('#kpi-action-rev',      withAction);
        setKPI('#kpi-recovery-time',   recovery);
        setKPI('#kpi-confidence',      confidence);

        // Also surface in the Decision Center audit row if present
        setKPI('#exec-rev-at-risk',    noAction);
        setKPI('#exec-rev-protected',  withAction);
        setKPI('#exec-recovery-eta',   recovery);

        console.log('[TSM-HC-EXEC] KPI tiles wired:', {noAction, withAction, recovery, confidence});
      } catch(e) {
        console.warn('[TSM-HC-EXEC] KPI wire failed:', e);
      }
    })(window.__TSM_STRAT_JSON__ || null);
    // ── END TSM PATCH ───────────────────────────────────────────────────
"""

# ── 3. Find injection point ───────────────────────────────────────
# Strategy: inject before </script> of the first script block that
# references relay data (localStorage.getItem with TSM_HC_RELAY or similar)

RELAY_PATTERNS = [
    r"(TSM_HC_RELAY|TSM_RELAY_DATA|extractRelayIntelligence|populateKPI|runStratEngine)",
]

# Find the script block containing relay logic
script_blocks = list(re.finditer(r'(<script[^>]*>)(.*?)(</script>)', src, re.DOTALL | re.IGNORECASE))

injection_done = False
for m in script_blocks:
    block_content = m.group(2)
    if any(re.search(p, block_content) for p in RELAY_PATTERNS):
        # Inject KPI block just before this </script>
        old_close = m.group(3)
        new_block = m.group(1) + block_content + KPI_INJECTION + old_close
        src = src[:m.start()] + new_block + src[m.end():]
        print(f"✅ Injected KPI wire block into relay script block (char offset {m.start()})")
        injection_done = True
        break

if not injection_done:
    # Fallback: inject before the first </body>
    if '</body>' in src.lower():
        src = re.sub(
            r'(</body>)',
            f'<script>{KPI_INJECTION}</script>\n\\1',
            src,
            count=1,
            flags=re.IGNORECASE
        )
        print("⚠️  No relay script block found — injected standalone <script> before </body>.")
        injection_done = True
    else:
        sys.exit("ERROR: Could not find relay script block or </body> — manual patch required.")

# ── 4. Write back ─────────────────────────────────────────────────
TARGET.write_text(src, encoding="utf-8")
print(f"✅ Written: {TARGET}")
print()
print("Next: verify KPI tile HTML has matching data-kpi attributes or ids:")
print("  data-kpi=\"noActionRevLoss\"  | id=\"kpi-no-action-rev\"")
print("  data-kpi=\"actionRevLoss\"    | id=\"kpi-action-rev\"")
print("  data-kpi=\"recoveryTime\"     | id=\"kpi-recovery-time\"")
print("  data-kpi=\"confidence\"       | id=\"kpi-confidence\"")
print()
print("If tiles use different selectors, update setKPI() calls above.")

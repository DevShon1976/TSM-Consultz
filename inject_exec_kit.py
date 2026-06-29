#!/usr/bin/env python3
"""
TSM Exec Kit — Portal Injector
Patches all 7 executive portals in-place with:
  • Inline CSS  (WIP tracker + explainability panel styles)
  • Inline JS   (TSMExecKit renderer, comment-stripped)
  • WIP tracker div    → inserted after the first .kpi / .ticker / .war-room-brief block
  • Explain panel div  → inserted after the WIP div
  • Init script        → reads each portal's real relay key(s) on DOMContentLoaded

Run from your repo root:
    python3 inject_exec_kit.py

Or dry-run to see diffs without writing:
    python3 inject_exec_kit.py --dry-run
"""

import os, re, sys, shutil
from datetime import datetime

DRY_RUN = '--dry-run' in sys.argv
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# ── Kit source files (expected alongside this script) ──────────────────────
KIT_CSS_PATH = os.path.join(SCRIPT_DIR, 'tsm-exec-kit.css')
KIT_JS_PATH  = os.path.join(SCRIPT_DIR, 'tsm-exec-kit.js')

# ── Portal definitions ──────────────────────────────────────────────────────
# relay_keys: list in priority order — first key found in localStorage wins
# anchor_hint: regex pattern to find where to insert the new divs
PORTALS = [
    {
        "name":        "Healthcare",
        "path":        "html/healthcare/executive-portal.html",
        "relay_keys":  ["TSM_EXEC_RELAY", "TSM_WAR_ROOM_BRIEF", "TSM_HC_MEMORY"],
        "anchor_hint": r'id=["\'](?:ticker|kpi|war-room|exec-relay|relay-display)',
        "wip_title":   "HC Pipeline Status",
    },
    {
        "name":        "FinOps",
        "path":        "html/finops-suite/finops-executive-portal.html",
        "relay_keys":  ["tsm_strategist_relay", "tsm_war_relay_finops-suite"],
        "anchor_hint": r'id=["\'](?:kpi|relay|exec|strategist)',
        "wip_title":   "FinOps Pipeline Status",
    },
    {
        "name":        "Insurance",
        "path":        "html/tsm-insurance/insurance-executive-portal.html",
        "relay_keys":  ["TSM_INS_STRAT_RELAY", "tsm_ins_strat_relay"],
        "anchor_hint": r'id=["\'](?:kpi|relay|exec|ins)',
        "wip_title":   "Insurance Pipeline Status",
    },
    {
        "name":        "Construction",
        "path":        "html/construction-suite/construction-executive-portal.html",
        "relay_keys":  ["TSM_CONSTRUCTION_STRATEGIST_RELAY", "tsm_construction_war_relay",
                        "tsm_construction_strategist_output", "TSM_CONSTRUCTION_WAR_RELAY"],
        "anchor_hint": r'id=["\'](?:kpi|relay|exec|construction|war)',
        "wip_title":   "Construction Pipeline Status",
    },
    {
        "name":        "Legal",
        "path":        "html/legal-pro/legal-executive-portal.html",
        "relay_keys":  ["TSM_STRATEGIST_RELAY", "TSM_WAR_ROOM_RELAY"],
        "anchor_hint": r'id=["\'](?:kpi|relay|exec|matter|strategist)',
        "wip_title":   "Legal Pipeline Status",
    },
    {
        "name":        "Real Estate",
        "path":        "html/reo-pro/re-exec-portal.html",
        "relay_keys":  ["TSM_RE_WAR_RELAY", "TSM_WAR_ROOM_RELAY"],
        "anchor_hint": r'id=["\'](?:kpi|relay|exec|re-|war|property)',
        "wip_title":   "RE Pipeline Status",
    },
    {
        "name":        "BPO",
        "path":        "html/bpo/bpo-executive-portal.html",
        "relay_keys":  ["TSM_BPO_STRAT_RELAY"],
        "anchor_hint": r'id=["\'](?:kpi|relay|exec|bpo|wip)',
        "wip_title":   "BPO Pipeline Status",
    },
]

# ── Load kit assets ─────────────────────────────────────────────────────────
def load_kit():
    css = open(KIT_CSS_PATH).read()

    js_raw = open(KIT_JS_PATH).read()
    # Strip JSDoc block comments to prevent syntax errors when inlined in HTML
    js = re.sub(r'/\*\*.*?\*/', '', js_raw, flags=re.DOTALL)
    js = re.sub(r'\n{3,}', '\n\n', js)

    return css, js

# ── Build the per-portal init <script> ─────────────────────────────────────
INIT_TEMPLATE = """
<script>
/* TSM EXEC KIT — AUTO-INJECTED {timestamp} */
(function() {{
  var RELAY_KEYS = {relay_keys_json};
  var WIP_TITLE  = {wip_title_json};
  var WIP_ID     = 'tsmk-wip-auto';
  var EXP_ID     = 'tsmk-exp-auto';

  function readRelay() {{
    for (var i = 0; i < RELAY_KEYS.length; i++) {{
      var raw = localStorage.getItem(RELAY_KEYS[i]);
      if (raw) {{
        try {{ return JSON.parse(raw); }} catch(e) {{ return null; }}
      }}
    }}
    return null;
  }}

  function mount() {{
    var relay  = readRelay();
    var data   = TSMExecKit.fromRelay(relay);

    /* If relay has no wip/explain yet, show a waiting state for WIP
       and a placeholder for explain so the divs are never blank */
    var stages = data.wip.length ? data.wip : [
      {{ id:'waiting', label:'Awaiting relay data…', status:'active',
         detail:'Open the war room to generate a relay.' }}
    ];

    var items  = data.explain;

    TSMExecKit.renderWIP(WIP_ID, stages, {{ title: WIP_TITLE,
      eta: relay ? ('Relay: ' + (relay.timestamp
        ? new Date(relay.timestamp).toLocaleTimeString() : 'loaded')) : '' }});

    TSMExecKit.renderExplainability(EXP_ID, items, {{ openFirst: true }});
  }}

  if (document.readyState === 'loading') {{
    document.addEventListener('DOMContentLoaded', mount);
  }} else {{
    mount();
  }}

  /* Re-render if relay is updated while page is open */
  window.addEventListener('storage', function(e) {{
    if (RELAY_KEYS.indexOf(e.key) !== -1) mount();
  }});
}})();
</script>
"""

# ── HTML snippets to inject ─────────────────────────────────────────────────
WIP_DIV = '<div id="tsmk-wip-auto" style="margin:18px 0 10px;"></div>'
EXP_DIV = '<div id="tsmk-exp-auto" style="margin:10px 0 24px;"></div>'
SECTION_WRAP = (
  '\n<!-- ▼ TSM EXEC KIT: WIP + EXPLAINABILITY ▼ -->\n'
  '<div style="padding:0 20px;">\n'
  + WIP_DIV + '\n' + EXP_DIV + '\n'
  '</div>\n'
  '<!-- ▲ TSM EXEC KIT ▲ -->\n'
)

# ── Insertion logic ─────────────────────────────────────────────────────────
def find_insert_point(html, anchor_hint):
    """
    Find a good DOM location to insert the WIP+explain divs.
    Strategy:
      1. Find the first element matching anchor_hint, then find the
         closing tag of its parent container.
      2. Fall back to just before </main> or </body>.
    """
    m = re.search(anchor_hint, html, re.IGNORECASE)
    if m:
        # Walk forward to find the closing tag of the *parent* block
        # Heuristic: find the next </div> or </section> after a reasonable chunk
        chunk = html[m.start():m.start()+4000]
        end_m = re.search(r'</(?:div|section|article|main)[^>]*>', chunk, re.IGNORECASE)
        if end_m:
            pos = m.start() + end_m.end()
            return pos

    # Fallback 1: before </main>
    main_m = re.search(r'</main>', html, re.IGNORECASE)
    if main_m:
        return main_m.start()

    # Fallback 2: before </body>
    body_m = re.search(r'</body>', html, re.IGNORECASE)
    if body_m:
        return body_m.start()

    return len(html)  # last resort: append

def already_injected(html):
    return 'TSM EXEC KIT' in html and 'tsmk-wip-auto' in html

# ── Main patcher ────────────────────────────────────────────────────────────
def patch_portal(portal, css, js):
    path = portal['path']
    if not os.path.exists(path):
        print(f"  ✗ NOT FOUND: {path}")
        return False

    html = open(path, encoding='utf-8').read()

    if already_injected(html):
        print(f"  ↩  ALREADY PATCHED — skipping {portal['name']}")
        return True

    import json
    timestamp = datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')
    init_script = INIT_TEMPLATE.format(
        timestamp      = timestamp,
        relay_keys_json= json.dumps(portal['relay_keys']),
        wip_title_json = json.dumps(portal['wip_title']),
    )

    # 1. Inject CSS into <head>
    css_tag = f'\n<style id="tsm-exec-kit-css">\n{css}\n</style>\n'
    if '<head>' in html:
        html = html.replace('<head>', '<head>' + css_tag, 1)
    else:
        html = css_tag + html

    # 2. Inject JS renderer before </body>
    js_tag = f'\n<script id="tsm-exec-kit-js">\n{js}\n</script>\n'
    if '</body>' in html:
        html = html.replace('</body>', js_tag + '</body>', 1)
    else:
        html += js_tag

    # 3. Insert WIP + explain divs at anchor point
    insert_pos = find_insert_point(html, portal['anchor_hint'])
    html = html[:insert_pos] + SECTION_WRAP + html[insert_pos:]

    # 4. Append init script before </body>
    html = html.replace('</body>', init_script + '</body>', 1)

    if DRY_RUN:
        print(f"  [DRY RUN] Would patch {path}")
        print(f"    Insert point ~char {insert_pos}")
        return True

    # Backup
    backup = path + '.bak-execkit'
    if not os.path.exists(backup):
        shutil.copy2(path, backup)

    open(path, 'w', encoding='utf-8').write(html)
    print(f"  ✅ Patched: {path}")
    return True

# ── Entry point ─────────────────────────────────────────────────────────────
def main():
    print("=" * 55)
    print("  TSM EXEC KIT INJECTOR")
    if DRY_RUN:
        print("  MODE: DRY RUN — no files will be written")
    print("=" * 55)

    if not os.path.exists(KIT_CSS_PATH) or not os.path.exists(KIT_JS_PATH):
        print(f"\n❌ Kit files not found. Expected:\n  {KIT_CSS_PATH}\n  {KIT_JS_PATH}")
        print("Place tsm-exec-kit.css and tsm-exec-kit.js alongside this script.")
        sys.exit(1)

    css, js = load_kit()
    print(f"\nKit loaded — CSS: {len(css):,} chars, JS: {len(js):,} chars\n")

    ok = 0
    for portal in PORTALS:
        print(f"[{portal['name']}]")
        if patch_portal(portal, css, js):
            ok += 1
        print()

    print("=" * 55)
    print(f"  Done — {ok}/{len(PORTALS)} portals {'checked' if DRY_RUN else 'patched'}")
    print("=" * 55)

    if not DRY_RUN:
        print("\nNext: commit + push")
        print("  git add html/")
        print('  git commit -m "feat: inject TSM exec kit into all 7 exec portals"')
        print("  git push")

if __name__ == '__main__':
    main()
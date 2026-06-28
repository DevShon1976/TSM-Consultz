#!/usr/bin/env python3
import shutil, datetime

STAMP = datetime.datetime.now().strftime('%Y%m%d-%H%M%S')

PATCHES = [
    {
        'file': 'html/healthcare/hc-denial-war-room.html',
        'relay_key': 'tsm_hc_docsearch_relay',
        'fire_fn': 'fireAll',
        'textarea': 'docText',  # will probe below
    },
    {
        'file': 'html/tsm-insurance/insurance-war-room.html',
        'relay_key': 'tsm_ins_docsearch_relay',
        'fire_fn': 'fireEngines',
        'textarea': 'docPaste',
    },
    {
        'file': 'html/construction-suite/construction-war-room.html',
        'relay_key': 'tsm_con_docsearch_relay',
        'fire_fn': 'fireEngines',
        'textarea': 'docPaste',
    },
    {
        'file': 'html/legal-pro/legal-war-room.html',
        'relay_key': 'tsm_legal_docsearch_relay',
        'fire_fn': 'fireEngines',
        'textarea': 'docPaste',
    },
    {
        'file': 'html/reo-pro/re-war-room.html',
        'relay_key': 'tsm_re_docsearch_relay',
        'fire_fn': 'fireEngines',
        'textarea': 'docPaste',
    },
    {
        'file': 'html/bpo/bpo-situation-room.html',
        'relay_key': 'tsm_bpo_docsearch_relay',
        'fire_fn': 'fireEngines',
        'textarea': 'docPaste',
    },
]

for p in PATCHES:
    path = p['file']
    try:
        with open(path, 'r') as f:
            c = f.read()
    except FileNotFoundError:
        print(f'[SKIP] {path} — not found')
        continue

    relay_key = p['relay_key']
    fire_fn   = p['fire_fn']
    ta_id     = p['textarea']

    # Already patched?
    if f'typeof {fire_fn}' in c and 'autofire' in c.lower():
        print(f'[SKIP] {path} — already patched')
        continue

    # Find the relay read block and inject auto-fire
    # Pattern: localStorage.getItem('<relay_key>') block
    # We inject after the textarea population line

    # Check if relay block exists
    if relay_key not in c:
        # Inject a full relay-read + autofire block before </body>
        inject = f"""
<script>
/* TSM AUTO-FIRE: read docsearch relay and fire engines */
(function tsmAutoFire(){{
  try {{
    const raw = localStorage.getItem('{relay_key}');
    if (!raw) return;
    const relay = JSON.parse(raw);
    if (!relay.summary && !relay.doc) return;
    localStorage.removeItem('{relay_key}');
    const summary = relay.summary || (relay.doc ? JSON.stringify(relay.doc).slice(0,800) : '');
    const ta = document.getElementById('{ta_id}') || document.querySelector('textarea');
    if (ta) {{
      ta.value = summary;
      ta.dispatchEvent(new Event('input'));
    }}
    setTimeout(() => {{ if (typeof {fire_fn} === 'function') {fire_fn}(); }}, 900);
  }} catch(e) {{ console.warn('[TSM AutoFire]', e); }}
}})();
</script>"""
        c = c.replace('</body>', inject + '\n</body>', 1)
        shutil.copy(path, path + '.bak-' + STAMP)
        with open(path, 'w') as f:
            f.write(c)
        print(f'[ok] {path} — injected full autofire block')
        continue

    # Relay block exists — find it and patch in auto-fire after removal line
    removal_line = f"localStorage.removeItem('{relay_key}');"
    if removal_line not in c:
        print(f'[WARN] {path} — relay key found but removeItem not found, skipping')
        continue

    # Find the closing of the relay IIFE after removeItem and inject autofire
    # Insert setTimeout after removeItem
    old_snippet = removal_line
    new_snippet  = removal_line + f"""
    // TSM AUTO-FIRE
    setTimeout(() => {{ if (typeof {fire_fn} === 'function') {fire_fn}(); }}, 900);"""

    if new_snippet in c:
        print(f'[SKIP] {path} — autofire already injected')
        continue

    shutil.copy(path, path + '.bak-' + STAMP)
    c = c.replace(old_snippet, new_snippet, 1)
    with open(path, 'w') as f:
        f.write(c)
    print(f'[ok] {path} — autofire injected after relay removeItem')

print('\nDone. Run:')
print('  git add html/')
print('  git commit -m "Auto-fire engines on doc relay load across all 7 war rooms"')
print('  git push && flyctl deploy')
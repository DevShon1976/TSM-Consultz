#!/usr/bin/env python3
"""
TSM One-Shot Master Patch
Run from /workspaces/tsm-shell:  python3 master-patch.py
"""
import re, shutil
from pathlib import Path

ROOT     = Path('/workspaces/tsm-shell')
FINOPS   = ROOT / 'html/finops-suite'
HC       = ROOT / 'html/healthcare'
HTML     = ROOT / 'html'

print('='*60)
print('TSM MASTER PATCH — ONE SHOT')
print('='*60)

# ══════════════════════════════════════════════════════════════
# 1. FINANCIAL-UI.HTML — wire node 01 (how-to) + node 08 (PoC)
# ══════════════════════════════════════════════════════════════
fu = FINOPS / 'financial-ui.html'
fsrc = fu.read_text()

# Node 01 → how-to.html
if 'LAUNCH SHOWCASE' in fsrc:
    fsrc = fsrc.replace('LAUNCH SHOWCASE', 'OPEN HOW TO →')
    fsrc = re.sub(r"href=['\"].*?finops-showcase.*?['\"]", "href='how-to.html'", fsrc)
    print('✔ Node 01 → how-to.html')

# Node 08 — add if missing
if '08 · Neural Ingest' not in fsrc:
    node08 = '''
<section class="node-card" style="--c:var(--green)">
  <div style="color:var(--green);font-size:11px;font-weight:900">08 · Neural Ingest</div>
  <h2 style="color:var(--green);margin:8px 0 2px;">ACCOUNTING PoC</h2>
  <div class="meta">PDF · SCANS · MULTI-ENGINE OCR</div>
  <p>Drop any accounting document to trigger automated triage, variance analysis, and CFO-ready action plans instantly.</p>
  <div class="label" style="color:var(--yellow)">STATUS</div>
  <div style="display:flex;gap:5px;margin-top:5px;">
    <span style="border:1px solid var(--yellow);color:var(--yellow);padding:2px 5px;font-size:10px;">READY</span>
    <span style="border:1px solid var(--green);color:var(--green);padding:2px 5px;font-size:10px;">4 ENGINES LIVE</span>
  </div>
  <button class="open-btn" style="position:absolute;left:14px;bottom:14px;background:var(--green);color:#001;border:0;padding:8px 14px;font-weight:900;cursor:pointer" onclick="window.location.href='finops-accounting.html'">OPEN PoC ↗</button>
</section>'''
    anchor = '</main>'
    if anchor in fsrc:
        fsrc = fsrc.replace(anchor, node08 + '\n' + anchor, 1)
        print('✔ Node 08 added to financial-ui.html')
    else:
        fsrc += node08
        print('✔ Node 08 appended to financial-ui.html')

fu.write_text(fsrc)

# ══════════════════════════════════════════════════════════════
# 2. FINOPS HOW-TO — write fresh (finops-specific)
# ══════════════════════════════════════════════════════════════
howto_src = (ROOT / 'html/finops-suite/how-to.html').read_text()
if 'Construction Suite' in howto_src:
    howto_src = howto_src.replace('Construction Suite · How To Guide · TSM', 'FinOps Suite · How To Guide · TSM')
    howto_src = howto_src.replace('A complete operator guide for the TSM Construction Suite', 'A complete operator guide for the TSM FinOps Suite')
    howto_src = howto_src.replace('CONSTRUCTION SUITE · HOW TO', 'FINOPS SUITE · HOW TO')
    howto_src = howto_src.replace('AuditOps Pro', 'Financial Operations UI')
    howto_src = howto_src.replace('/construction-suite/', '/finops-suite/')
    (FINOPS / 'how-to.html').write_text(howto_src)
    print('✔ how-to.html updated for FinOps')

# ══════════════════════════════════════════════════════════════
# 3. HC NODES — remove HC Node Guide panel + fix switchTab
# ══════════════════════════════════════════════════════════════
HC_GUIDE_PATTERNS = [
    # The floating guide panel
    r'<div[^>]*(?:hc-node-guide|HC NODE GUIDE|hc-guide|node-guide-panel)[^>]*>.*?</div>\s*(?:</div>\s*)*',
    # Inline guide divs
    r'<!--\s*HC NODE GUIDE\s*-->.*?<!--\s*/HC NODE GUIDE\s*-->',
]

SWITCHTAB_FIX = '''
<script id="tsm-switchtab-polyfill">
// Polyfill: ensure switchTab/showTab always work regardless of load order
(function(){
  function _switchTab(t){
    document.querySelectorAll(".trm-tab,.nav-tab,[data-tab]").forEach(e=>e.classList.remove("active"));
    document.querySelectorAll(".trm-panel,.tab-content,[data-panel]").forEach(e=>e.classList.remove("active"));
    var target=document.getElementById(t)||document.querySelector('[data-tab="'+t+'"]');
    if(target)target.classList.add("active");
  }
  function _showTab(id,el){
    document.querySelectorAll(".tab-content").forEach(c=>c.style.display="none");
    var panel=document.getElementById(id);
    if(panel)panel.style.display="block";
    document.querySelectorAll(".nav-tab").forEach(n=>n.classList.remove("active"));
    if(el)el.classList.add("active");
  }
  if(typeof window.switchTab!=="function") window.switchTab=_switchTab;
  if(typeof window.showTab!=="function")   window.showTab=_showTab;
  if(typeof window.filterTab!=="function") window.filterTab=_switchTab;
})();
</script>'''

hc_files = list((HC).rglob('*.html')) + list((HC).rglob('index.html'))
guide_removed = 0
switchtab_fixed = 0

for hf in sorted(set(hc_files)):
    if '.bak' in hf.name:
        continue
    src = hf.read_text(encoding='utf-8', errors='replace')
    changed = False

    # Remove HC Node Guide panel
    for pat in HC_GUIDE_PATTERNS:
        new_src = re.sub(pat, '', src, flags=re.DOTALL|re.IGNORECASE)
        if new_src != src:
            src = new_src
            changed = True
            guide_removed += 1

    # Also remove by ID/class markers
    for marker in ['id="hc-node-guide"', 'id="hcNodeGuide"', 'class="hc-node-guide"',
                   'hc-guide-panel', 'HC NODE GUIDE', '? HOW TO']:
        if marker in src:
            # Find the enclosing div and remove it
            idx = src.find(marker)
            if idx > 0:
                # Find opening div before marker
                open_idx = src.rfind('<div', 0, idx)
                if open_idx > 0:
                    # Count depth to find closing tag
                    depth = 0
                    i = open_idx
                    while i < len(src):
                        if src[i:i+4] == '<div':
                            depth += 1
                        elif src[i:i+6] == '</div>':
                            depth -= 1
                            if depth == 0:
                                src = src[:open_idx] + src[i+6:]
                                changed = True
                                break
                        i += 1

    # Fix switchTab polyfill
    if 'switchTab' in src and 'tsm-switchtab-polyfill' not in src:
        src = src.replace('</body>', SWITCHTAB_FIX + '\n</body>', 1)
        changed = True
        switchtab_fixed += 1

    if changed:
        shutil.copy2(hf, hf.with_suffix('.html.bak.master'))
        hf.write_text(src, encoding='utf-8')

print(f'✔ HC Node Guide removed from {guide_removed} files')
print(f'✔ switchTab polyfill added to {switchtab_fixed} HC files')

# ══════════════════════════════════════════════════════════════
# 4. SHARED JS — ensure switchTab always defined
# ══════════════════════════════════════════════════════════════
shared_js = HTML / 'shared/tsm-shared.js'
if shared_js.exists():
    sjs = shared_js.read_text()
    if 'Polyfill' not in sjs:
        sjs += "\n// Ensure functions available immediately (non-deferred)\nif(typeof window!=='undefined'){window.switchTab=window.switchTab||function(t){document.querySelectorAll('.trm-tab').forEach(e=>e.classList.remove('active'));document.querySelectorAll('.trm-panel').forEach(e=>e.classList.remove('active'));var el=document.getElementById(t);if(el)el.classList.add('active');};}\n"
        shared_js.write_text(sjs)
        print('✔ tsm-shared.js polyfill added')

# ══════════════════════════════════════════════════════════════
# 5. ENTRYPOINT.SH
# ══════════════════════════════════════════════════════════════
entrypoint = ROOT / 'entrypoint.sh'
entrypoint.write_text('''#!/bin/bash
echo "--- TSM Shell Initializing ---"
mkdir -p /app/data
[ ! -f /app/data/bpo-tasks.json ]          && echo \'{"tasks":[]}\' > /app/data/bpo-tasks.json
[ ! -f /app/data/hc-strategist-memory.json ] && echo \'{"items":[]}\' > /app/data/hc-strategist-memory.json
export NODE_ENV=production
export PORT=3000
echo "--- Starting TSM Server ---"
exec node server.js
''')
entrypoint.chmod(0o755)
print('✔ entrypoint.sh written')

# ══════════════════════════════════════════════════════════════
# 6. FLY.TOML — update auto_stop + min_machines
# ══════════════════════════════════════════════════════════════
fly_toml = ROOT / 'fly.toml'
if fly_toml.exists():
    ft = fly_toml.read_text()
    ft = ft.replace('auto_stop_machines = "stop"', 'auto_stop_machines = "off"')
    ft = ft.replace('auto_stop_machines = true', 'auto_stop_machines = "off"')
    if 'min_machines_running' not in ft:
        ft = ft.replace('[http_service]', '[http_service]\n  min_machines_running = 1')
    fly_toml.write_text(ft)
    print('✔ fly.toml updated (auto_stop off, min_machines 1)')

# ══════════════════════════════════════════════════════════════
# 7. DOCKERFILE — add entrypoint
# ══════════════════════════════════════════════════════════════
dockerfile = ROOT / 'Dockerfile'
if dockerfile.exists():
    df = dockerfile.read_text()
    if 'entrypoint.sh' not in df:
        df = df.rstrip()
        df += '\nCOPY entrypoint.sh .\nRUN chmod +x entrypoint.sh\nENTRYPOINT ["/app/entrypoint.sh"]\n'
        dockerfile.write_text(df)
        print('✔ Dockerfile updated with entrypoint')
    else:
        print('  Dockerfile already has entrypoint')

print('\n' + '='*60)
print('ALL PATCHES APPLIED')
print('='*60)
print('\nNext steps:')
print('  1. fly secrets set GROQ_API_KEY=your_key')
print('  2. fly volumes create tsm_data --region dfw --size 1  (if not exists)')
print('  3. fly deploy')

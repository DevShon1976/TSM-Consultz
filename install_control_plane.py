#!/usr/bin/env python3
"""
TSM Control Plane Installer v1.0
- Replaces tsm-event-bus.js and tsm-mission-engine.js with fixed versions
- Ensures correct script load order in all 7 war rooms + strategists + exec portals
- Wires Executive Approved event into all exec portals
Run from repo root: python3 install_control_plane.py
"""
import os, re, glob, shutil

ROOT = os.getcwd()
CORE = os.path.join(ROOT, 'html/js/core')

# ── Script load order (must be exactly this sequence in <head>) ──────────────
CORE_SCRIPTS = [
    '/js/core/tsm-event-bus.js',
    '/js/core/tsm-state.js',
    '/js/core/tsm-mission-engine.js',
    '/js/core/tsm-auto-pipeline.js',
]

# ── All files that need the control plane scripts ────────────────────────────
VERTICAL_FILES = {
    'war_rooms': [
        'html/healthcare/hc-denial-war-room.html',
        'html/finops-suite/finops-war-room.html',
        'html/tsm-insurance/insurance-war-room.html',
        'html/construction-suite/construction-war-room.html',
        'html/legal-pro/legal-war-room.html',
        'html/reo-pro/re-war-room.html',
        'html/bpo/bpo-situation-room.html',
        'html/bpo-situation-room.html',
    ],
    'strategists': [
        'html/healthcare/hc-main-strategist/index.html',
        'html/finops-suite/finops-main-strategist.html',
        'html/tsm-insurance/insurance-strategist.html',
        'html/construction-suite/construction-strategist.html',
        'html/legal-pro/legal-main-strategist.html',
        'html/reo-pro/re-strategist.html',
        'html/bpo/bpo-strategist-v2.html',
        'html/bpo-strategist-v2.html',
    ],
    'exec_portals': [
        'html/healthcare/hc-exec-portal.html',
        'html/finops-suite/finops-exec-portal.html',
        'html/tsm-insurance/insurance-exec-portal.html',
        'html/construction-suite/construction-executive-portal.html',
        'html/legal-pro/legal-exec-portal.html',
        'html/reo-pro/re-exec-portal.html',
        'html/bpo/bpo-executive-portal.html',
        'html/bpo-executive-portal.html',
    ],
}

# ── Step 1: Install fixed core files ─────────────────────────────────────────
def install_core_files():
    print('\n[1/4] Installing fixed core files...')
    files = {
        'tsm-event-bus.js':     'tsm-event-bus.js',
        'tsm-mission-engine.js':'tsm-mission-engine.js',
    }
    for src_name, dst_name in files.items():
        src = os.path.join(ROOT, src_name)
        dst = os.path.join(CORE, dst_name)
        if not os.path.exists(src):
            print(f'  ⚠️  {src_name} not in repo root — skipping')
            continue
        shutil.copy2(src, dst)
        print(f'  ✅ {dst_name} installed to html/js/core/')

# ── Step 2: Ensure correct script load order in all vertical files ────────────
def build_script_block(existing_src_tags):
    """Return ordered script tags with no duplicates."""
    seen = set()
    ordered = []
    # Core scripts first, in order
    for src in CORE_SCRIPTS:
        tag = f'<script src="{src}"></script>'
        ordered.append(tag)
        seen.add(src)
    # Then any other scripts already in the file (preserve them)
    for tag in existing_src_tags:
        m = re.search(r'src=["\']([^"\']+)["\']', tag)
        if m:
            s = m.group(1)
            if s not in seen:
                ordered.append(tag)
                seen.add(s)
    return '\n'.join(ordered)

def wire_scripts(filepath):
    if not os.path.exists(filepath):
        return False
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        src = f.read()

    # Find all existing <script src="..."> tags in head
    existing = re.findall(r'<script\s+src=["\'][^"\']+["\'][^>]*>', src, re.IGNORECASE)

    # Check if all core scripts already present in correct order
    positions = []
    for cs in CORE_SCRIPTS:
        idx = src.find(cs)
        positions.append(idx)

    already_ordered = (
        all(p >= 0 for p in positions) and
        positions == sorted(positions)
    )
    if already_ordered:
        return False  # nothing to do

    # Remove existing core script tags from head
    for cs in CORE_SCRIPTS:
        src = re.sub(rf'\s*<script\s+src=["\']' + re.escape(cs) + r'["\'][^>]*>\s*</script>', '', src)
        src = re.sub(rf'\s*<script\s+src=["\']' + re.escape(cs) + r'["\'][^>]*>', '', src)

    # Inject ordered block right after <head> or before first existing script
    new_block = '\n'.join(f'  <script src="{s}"></script>' for s in CORE_SCRIPTS)
    if '</head>' in src:
        src = src.replace('</head>', f'{new_block}\n</head>', 1)
    elif '<body' in src:
        src = re.sub(r'(<body[^>]*>)', f'{new_block}\n\\1', src, 1)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(src)
    return True

def wire_all_scripts():
    print('\n[2/4] Wiring control plane script load order...')
    total = 0
    for category, files in VERTICAL_FILES.items():
        for fp in files:
            full = os.path.join(ROOT, fp)
            changed = wire_scripts(full)
            if changed:
                print(f'  ✅ {fp}')
                total += 1
    print(f'  → {total} file(s) updated')

# ── Step 3: Wire EXECUTIVE_APPROVED event into exec portals ──────────────────
EXEC_APPROVED_BLOCK = """<script>
/* TSM EXECUTIVE_APPROVED — Control Plane wiring */
(function(){
  function _emitApproval(decision) {
    const bus = window.TSMBus || window.TSMEventBus;
    if (bus && bus.emit) {
      const vertical = (window.location.pathname.match(/\/(healthcare|finops|insurance|construction|legal|reo-pro|bpo)\//) || [])[1] || 'unknown';
      bus.emit('EXECUTIVE_APPROVED', { vertical, decision, ts: Date.now() });
    }
  }
  // Hook into any approve button
  document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('[id*="approve"],[class*="approve"],[data-action="approve"]').forEach(btn => {
      btn.addEventListener('click', function() {
        _emitApproval({ approved: true, approvedBy: 'executive', ts: Date.now() });
      });
    });
  });
  // Expose globally so manual calls work too
  window.TSMApprove = _emitApproval;
})();
</script>
</body>"""

def wire_exec_portals():
    print('\n[3/4] Wiring EXECUTIVE_APPROVED into exec portals...')
    count = 0
    for fp in VERTICAL_FILES['exec_portals']:
        full = os.path.join(ROOT, fp)
        if not os.path.exists(full): continue
        with open(full, 'r', encoding='utf-8', errors='ignore') as f:
            src = f.read()
        if 'TSM EXECUTIVE_APPROVED' in src:
            continue
        src = src.replace('</body>', EXEC_APPROVED_BLOCK, 1)
        with open(full, 'w', encoding='utf-8') as f:
            f.write(src)
        print(f'  ✅ {fp}')
        count += 1
    print(f'  → {count} exec portal(s) wired')

# ── Step 4: Verification ──────────────────────────────────────────────────────
def verify():
    print('\n[4/4] Verification...')
    all_files = []
    for files in VERTICAL_FILES.values():
        all_files.extend(files)

    ok = 0; warn = 0
    for fp in all_files:
        full = os.path.join(ROOT, fp)
        if not os.path.exists(full): continue
        with open(full, 'r', encoding='utf-8', errors='ignore') as f:
            src = f.read()
        has_all = all(cs in src for cs in CORE_SCRIPTS)
        if has_all:
            ok += 1
        else:
            missing = [cs for cs in CORE_SCRIPTS if cs not in src]
            print(f'  ⚠️  {fp} missing: {missing}')
            warn += 1

    core_files_ok = all(
        os.path.exists(os.path.join(CORE, f))
        for f in ['tsm-event-bus.js','tsm-state.js','tsm-mission-engine.js','tsm-auto-pipeline.js']
    )

    print(f'\n  Core files in html/js/core/: {"✅" if core_files_ok else "❌"}')
    print(f'  Vertical files fully wired:  {ok} ✅  {warn} ⚠️')
    print()
    print('='*44)
    print(' CONTROL PLANE INSTALL COMPLETE')
    print('='*44)
    print()
    print('Run:')
    print('  git add -A')
    print('  git commit -m "feat: Control Plane v1.1 — Event Bus + Mission Engine fixes + full vertical wiring"')
    print('  git push origin main')

# ── Main ──────────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    print('='*44)
    print(' TSM CONTROL PLANE INSTALLER v1.0')
    print('='*44)
    install_core_files()
    wire_all_scripts()
    wire_exec_portals()
    verify()
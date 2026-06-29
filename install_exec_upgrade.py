#!/usr/bin/env python3
"""
TSM Exec Portal Upgrade Installer v1.0
Injects tsm-exec-portal-upgrade.js into all 7 canonical exec portals.
Run from repo root: python3 install_exec_upgrade.py
"""
import os, shutil

ROOT = os.getcwd()
SHARED = os.path.join(ROOT, 'html/shared')
CORE   = os.path.join(ROOT, 'html/js/core')

CANONICAL_PORTALS = [
    'html/healthcare/executive-portal.html',
    'html/finops-suite/finops-executive-portal.html',
    'html/tsm-insurance/insurance-executive-portal.html',
    'html/construction-suite/construction-executive-portal.html',
    'html/legal-pro/legal-executive-portal.html',
    'html/reo-pro/re-exec-portal.html',
    'html/bpo/bpo-executive-portal.html',
]

UPGRADE_TAG = '<script src="/shared/tsm-exec-portal-upgrade.js"></script>'
MARKER      = 'tsm-exec-portal-upgrade.js'

def install():
    print('='*48)
    print(' TSM EXEC PORTAL UPGRADE INSTALLER v1.0')
    print('='*48)

    # Step 1: Copy upgrade JS to html/shared/
    print('\n[1/3] Installing tsm-exec-portal-upgrade.js → html/shared/')
    src = os.path.join(ROOT, 'tsm-exec-portal-upgrade.js')
    dst = os.path.join(SHARED, 'tsm-exec-portal-upgrade.js')
    if not os.path.exists(src):
        print('  ❌ tsm-exec-portal-upgrade.js not in repo root')
        return
    shutil.copy2(src, dst)
    print(f'  ✅ Installed to html/shared/')

    # Step 2: Inject script tag into each portal
    print('\n[2/3] Injecting into canonical exec portals...')
    wired = 0; skipped = 0; missing = 0
    for fp in CANONICAL_PORTALS:
        full = os.path.join(ROOT, fp)
        if not os.path.exists(full):
            print(f'  ⚠️  Not found: {fp}')
            missing += 1
            continue
        with open(full, 'r', encoding='utf-8', errors='ignore') as f:
            src_html = f.read()
        if MARKER in src_html:
            print(f'  ⏭  Already wired: {fp}')
            skipped += 1
            continue
        # Inject before </body>
        if '</body>' in src_html:
            src_html = src_html.replace('</body>', f'{UPGRADE_TAG}\n</body>', 1)
        else:
            src_html += f'\n{UPGRADE_TAG}'
        with open(full, 'w', encoding='utf-8') as f:
            f.write(src_html)
        print(f'  ✅ {fp}')
        wired += 1

    # Step 3: Verify
    print('\n[3/3] Verification...')
    ok = 0; warn = 0
    for fp in CANONICAL_PORTALS:
        full = os.path.join(ROOT, fp)
        if not os.path.exists(full): continue
        with open(full, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        has_upgrade = MARKER in content
        has_cp      = '/js/core/tsm-event-bus.js' in content
        status = '✅' if (has_upgrade and has_cp) else '⚠️ '
        if has_upgrade and has_cp: ok += 1
        else: warn += 1
        print(f'  {status} {fp.split("/")[-1]:45s} upgrade:{has_upgrade} cp:{has_cp}')

    print(f'\n  Wired: {wired}  Skipped: {skipped}  Missing: {missing}')
    print(f'  Fully verified: {ok} ✅  Warnings: {warn} ⚠️')
    print()
    print('='*48)
    print(' DONE')
    print('='*48)
    print()
    print('Run:')
    print('  git add -A')
    print('  git commit -m "feat: Exec Portal Upgrade — Decision Center + KPI Charts + Execution Tracker"')
    print('  git push origin main')

if __name__ == '__main__':
    install()
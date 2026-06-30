#!/usr/bin/env python3
"""
TSM War Room + Demo/Prep Audit
Scans all war-room, demo, and prep files across the 7 verticals.

Run from repo root:
    python3 audit_war_rooms.py
"""
import os, re, json

# ── Discovery: find all candidate files ─────────────────────────────────────
PATTERNS = [
    r'war.?room', r'-demo\.html$', r'demo-.*\.html$', r'prep\.html$', r'-prep-',
]
SKIP_DIRS = {'.git', 'node_modules', '__pycache__'}
SKIP_FILE_MARKERS = ('.bak', 'backup', '_backup_')

ENGINE_FEATURES = {
    "engine_counter":     [r'engines?Complete', r'enginesCount', r'\d\s*/\s*\d\s*engines?', r'engine\s*0?\d\s*of\s*\d'],
    "progress_bar":       [r'progress-bar', r'progressBar', r'\.progress\b'],
    "relay_write":        [r'setItem\(\s*[\'"]TSM_', r'setItem\(\s*[\'"]tsm_'],
    "wip_field":          [r'\.wip\s*=', r'wip\s*:\s*\['],
    "explain_field":      [r'\.explain\s*=', r'explain\s*:\s*\['],
    "exec_kit_producer":  [r'TSMExecKitProducer'],
    "live_ai_call":       [r'fetch\([\'"][^\'"]*api[^\'"]*[\'"]', r'/api/'],
    "demo_data_only":     [r'DEMO\s*MODE', r'DEMO:', r'fake.?data', r'mock.?data', r'sampleData'],
    "navigation_chain":   [r'window\.location\.href\s*=\s*[\'"][^\'"]*strategist', r'window\.location\.href\s*=\s*[\'"][^\'"]*exec'],
    "error_handling":     [r'catch\s*\(\s*e(rr)?\s*\)'],
    "session_persist":    [r'sessionStorage\.setItem', r'localStorage\.setItem'],
}

VERTICAL_HINTS = {
    'healthcare': 'HC', 'hc-': 'HC',
    'finops': 'FinOps',
    'tsm-insurance': 'Insurance', 'insurance': 'Insurance',
    'construction': 'Construction',
    'legal': 'Legal',
    'reo-pro': 'RE', 're-': 'RE',
    'bpo': 'BPO',
}

def guess_vertical(path):
    p = path.lower()
    for hint, vert in VERTICAL_HINTS.items():
        if hint in p:
            return vert
    return '?'

def find_candidates(root='.'):
    candidates = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS and not any(m in d.lower() for m in SKIP_FILE_MARKERS)]
        for fname in filenames:
            if not fname.endswith('.html'):
                continue
            if any(m in fname.lower() for m in SKIP_FILE_MARKERS):
                continue
            full = os.path.join(dirpath, fname).replace('\\', '/').lstrip('./')
            if any(m in full for m in SKIP_FILE_MARKERS):
                continue
            for pat in PATTERNS:
                if re.search(pat, fname, re.IGNORECASE):
                    candidates.append(full)
                    break
    return sorted(set(candidates))

def audit_file(path):
    try:
        content = open(path, encoding='utf-8', errors='ignore').read()
    except Exception as e:
        return None

    result = {'path': path, 'vertical': guess_vertical(path), 'lines': content.count('\n'), 'features': {}}

    for feat, patterns in ENGINE_FEATURES.items():
        found = any(re.search(p, content, re.IGNORECASE) for p in patterns)
        result['features'][feat] = found

    # relay keys written
    relay_keys = set(re.findall(r'setItem\(\s*[\'"]([^\'"]*(?:RELAY|relay|BRIEF|brief)[^\'"]*)[\'"]', content))
    result['relay_keys'] = sorted(relay_keys)

    # rough classification
    is_demo = bool(re.search(r'demo', path, re.IGNORECASE)) or result['features']['demo_data_only']
    is_war_room = bool(re.search(r'war.?room', path, re.IGNORECASE))
    is_prep = bool(re.search(r'prep', path, re.IGNORECASE))
    result['type'] = 'demo' if is_demo else ('war_room' if is_war_room else ('prep' if is_prep else 'other'))

    return result

def print_report(results):
    by_vertical = {}
    for r in results:
        by_vertical.setdefault(r['vertical'], []).append(r)

    order = ['HC', 'FinOps', 'Insurance', 'Construction', 'Legal', 'RE', 'BPO', '?']

    for vert in order:
        files = by_vertical.get(vert, [])
        if not files:
            continue
        print(f"\n{'='*70}")
        print(f"  {vert}  ({len(files)} files)")
        print(f"{'='*70}")

        for r in files:
            f = r['features']
            type_tag = r['type'].upper()
            print(f"\n  [{type_tag}] {r['path']}  ({r['lines']} lines)")

            checks = [
                ('engine_counter',    'Engine progress counter'),
                ('progress_bar',      'Visual progress bar'),
                ('relay_write',       'Writes relay to next stage'),
                ('navigation_chain',  'Navigates to strategist/exec'),
                ('wip_field',         'Emits wip[] (exec kit)'),
                ('explain_field',     'Emits explain[] (exec kit)'),
                ('exec_kit_producer', 'Uses TSMExecKitProducer'),
                ('live_ai_call',      'Live API call (vs static)'),
                ('demo_data_only',    'Contains DEMO/mock markers'),
                ('error_handling',    'Has try/catch error handling'),
            ]
            for key, label in checks:
                mark = '✓' if f.get(key) else '✗'
                flag = '  ⚠️ ' if (key == 'demo_data_only' and f.get(key)) else '    '
                print(f"{flag}{mark} {label}")

            if r['relay_keys']:
                print(f"      Relay keys written: {r['relay_keys']}")
            else:
                print(f"      ⚠️  NO relay keys detected — may be a dead end")

def main():
    print("="*70)
    print("  TSM WAR ROOM + DEMO/PREP AUDIT")
    print("="*70)

    candidates = find_candidates('.')
    print(f"\nFound {len(candidates)} candidate files\n")

    results = []
    for path in candidates:
        r = audit_file(path)
        if r:
            results.append(r)

    print_report(results)

    # Summary stats
    print(f"\n{'='*70}")
    print("  SUMMARY")
    print(f"{'='*70}")

    total = len(results)
    war_rooms = [r for r in results if r['type'] == 'war_room']
    demos = [r for r in results if r['type'] == 'demo']
    no_relay = [r for r in results if not r['relay_keys']]
    no_engine_counter = [r for r in results if not r['features']['engine_counter']]
    has_demo_markers = [r for r in results if r['features']['demo_data_only']]

    print(f"  Total files audited:        {total}")
    print(f"  War rooms:                  {len(war_rooms)}")
    print(f"  Demo files:                 {len(demos)}")
    print(f"  Files with NO relay write:  {len(no_relay)}")
    print(f"  Files with NO engine counter: {len(no_engine_counter)}")
    print(f"  Files with DEMO/mock markers: {len(has_demo_markers)}")

    if no_relay:
        print(f"\n  ⚠️  Files with no detected relay (dead ends?):")
        for r in no_relay:
            print(f"      {r['path']}")

    if has_demo_markers:
        print(f"\n  ⚠️  Files containing DEMO/mock data markers:")
        for r in has_demo_markers:
            print(f"      {r['path']}")

if __name__ == '__main__':
    main()
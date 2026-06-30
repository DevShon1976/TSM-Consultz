#!/usr/bin/env python3
"""
TSM Relay Producer Scanner
Finds every file writing to the exec relay keys and shows context.
Run from repo root:  python3 scan_relay_producers.py
"""
import os, re

RELAY_KEYS = {
    "Insurance":    ["TSM_INS_STRAT_RELAY", "tsm_ins_strat_relay"],
    "Real Estate":  ["TSM_RE_WAR_RELAY", "TSM_WAR_ROOM_RELAY"],
    "Legal":        ["TSM_STRATEGIST_RELAY", "TSM_WAR_ROOM_RELAY"],
    "FinOps":       ["tsm_strategist_relay", "tsm_war_relay_finops-suite"],
    "Construction": ["TSM_CONSTRUCTION_STRATEGIST_RELAY", "tsm_construction_war_relay",
                     "tsm_construction_strategist_output", "TSM_CONSTRUCTION_WAR_RELAY"],
    "HC":           ["TSM_EXEC_RELAY", "TSM_WAR_ROOM_BRIEF", "TSM_HC_MEMORY"],
    "BPO":          ["TSM_BPO_STRAT_RELAY"],
}

# Exec portals to skip (already patched — we only want producers)
SKIP_PATHS = {
    "html/healthcare/executive-portal.html",
    "html/finops-suite/finops-executive-portal.html",
    "html/tsm-insurance/insurance-executive-portal.html",
    "html/construction-suite/construction-executive-portal.html",
    "html/legal-pro/legal-executive-portal.html",
    "html/reo-pro/re-exec-portal.html",
    "html/bpo/bpo-executive-portal.html",
}

EXTS = {'.html', '.js', '.py'}

def scan():
    hits = {}  # key: (portal, relay_key) → list of (file, line_no, snippet)

    for root, dirs, files in os.walk('.'):
        # Skip hidden dirs, node_modules, backups
        dirs[:] = [d for d in dirs if not d.startswith('.') and d not in
                   ('node_modules', '__pycache__') and 'bak' not in d and 'backup' not in d.lower()]

        for fname in files:
            if not any(fname.endswith(e) for e in EXTS):
                continue
            fpath = os.path.join(root, fname).lstrip('./')
            if fpath in SKIP_PATHS:
                continue

            try:
                lines = open(os.path.join(root, fname), encoding='utf-8', errors='ignore').readlines()
            except Exception:
                continue

            for portal, keys in RELAY_KEYS.items():
                for key in keys:
                    for i, line in enumerate(lines):
                        # Only care about setItem writes, not reads
                        if f'setItem' in line and key in line:
                            ctx_start = max(0, i - 3)
                            ctx_end   = min(len(lines), i + 8)
                            ctx = ''.join(lines[ctx_start:ctx_end])
                            hit_key = (portal, key)
                            hits.setdefault(hit_key, []).append((fpath, i + 1, ctx))

    return hits

def main():
    print("=" * 60)
    print("  TSM RELAY PRODUCER SCAN")
    print("=" * 60)

    hits = scan()

    if not hits:
        print("\n⚠️  No relay writers found — check you're running from repo root.")
        return

    # Priority order
    priority = ["Insurance", "Real Estate", "Legal", "FinOps", "Construction", "HC", "BPO"]
    seen_files = set()

    for portal in priority:
        portal_hits = {k: v for k, v in hits.items() if k[0] == portal}
        if not portal_hits:
            print(f"\n[{portal}] — no writers found")
            continue

        print(f"\n{'='*60}")
        print(f"  [{portal}]")
        print(f"{'='*60}")

        for (p, key), locations in portal_hits.items():
            for fpath, lineno, ctx in locations:
                marker = " ← ALREADY SEEN" if fpath in seen_files else ""
                seen_files.add(fpath)
                print(f"\n  Key: {key}")
                print(f"  File: {fpath}  (line {lineno}){marker}")
                print(f"  Context:")
                for l in ctx.strip().split('\n'):
                    print(f"    {l}")

    print(f"\n{'='*60}")
    print(f"  Unique producer files found: {len(seen_files)}")
    print(f"{'='*60}")
    for f in sorted(seen_files):
        print(f"  {f}")

if __name__ == '__main__':
    main()
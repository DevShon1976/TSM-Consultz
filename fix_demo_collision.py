#!/usr/bin/env python3
"""
TSM Exec Kit — Demo/Live Key Collision Fix
demo-executive-portal.html currently writes to the SAME relay key
('TSM_EXEC_RELAY') as the real production pipeline. If anyone opens this
file, it silently overwrites real case data with demo data.

This script renames every occurrence of 'TSM_EXEC_RELAY' in that ONE file
to 'TSM_DEMO_EXEC_RELAY' so it's fully namespaced and can never collide —
no other file is touched.

Run from repo root:
    python3 fix_demo_collision.py --dry-run
    python3 fix_demo_collision.py
"""
import os, re, sys, shutil

DRY_RUN = '--dry-run' in sys.argv
PATH = "html/healthcare/demo-executive-portal.html"
OLD_KEY = "TSM_EXEC_RELAY"
NEW_KEY = "TSM_DEMO_EXEC_RELAY"


def main():
    print("=" * 60)
    print("  DEMO/LIVE KEY COLLISION FIX")
    if DRY_RUN:
        print("  MODE: DRY RUN")
    print("=" * 60)

    if not os.path.exists(PATH):
        print(f"\n✗ NOT FOUND: {PATH}")
        sys.exit(1)

    html = open(PATH, encoding='utf-8', newline='').read()

    count = html.count(OLD_KEY)
    if count == 0:
        print(f"\n  No occurrences of '{OLD_KEY}' found — already fixed or key changed.")
        return

    print(f"\n  Found {count} occurrence(s) of '{OLD_KEY}' in {PATH}")

    new_html = html.replace(OLD_KEY, NEW_KEY)

    if DRY_RUN:
        print(f"  [DRY RUN] Would replace all {count} with '{NEW_KEY}'")
        return

    backup = PATH + '.bak-keyfix'
    if not os.path.exists(backup):
        shutil.copy2(PATH, backup)

    open(PATH, 'w', encoding='utf-8', newline='').write(new_html)
    print(f"  ✅ Replaced {count} occurrence(s): '{OLD_KEY}' → '{NEW_KEY}'")
    print(f"  Backup saved: {backup}")
    print(f"\n  This file can no longer overwrite real exec portal data.")


if __name__ == '__main__':
    main()
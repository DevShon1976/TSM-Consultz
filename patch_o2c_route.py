#!/usr/bin/env python3
"""
One-shot patcher: add o2c entry to client-side VERTICALS array
in html/tsm-wip-command-center.html so the Order-to-Cash tab renders.
Idempotent. Run from repo root (where html/ lives).
"""
import shutil
import datetime
import sys

TARGET = "html/tsm-wip-command-center.html"
OLD = "  { id:'construction', label:'Construction',    warRoom:'/html/construction-suite/construction-war-room.html' }\n];"
NEW = (
    "  { id:'construction', label:'Construction',    warRoom:'/html/construction-suite/construction-war-room.html' },\n"
    "  { id:'o2c',          label:'Order-to-Cash',    warRoom:'/war-rooms/o2c/o2c-war-room.html' }\n"
    "];"
)

results = []

def main():
    try:
        with open(TARGET, "r", encoding="utf-8") as f:
            content = f.read()
    except FileNotFoundError:
        print(f"FAIL: {TARGET} not found relative to current directory.")
        sys.exit(1)

    if "id:'o2c'" in content:
        results.append(("VERTICALS already includes o2c entry", "SKIP"))
    elif OLD in content:
        ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = f"{TARGET}.bak.{ts}"
        shutil.copy(TARGET, backup_path)
        content = content.replace(OLD, NEW)
        with open(TARGET, "w", encoding="utf-8") as f:
            f.write(content)
        results.append((f"Patched VERTICALS array, backup -> {backup_path}", "PASS"))
    else:
        results.append(("Expected VERTICALS closing line not found verbatim — manual check needed", "FAIL"))

    print("\n--- patch_wip_o2c_tab.py report ---")
    for msg, status in results:
        print(f"[{status}] {msg}")
    print("-------------------------------------\n")

    if any(s == "FAIL" for _, s in results):
        sys.exit(1)

if __name__ == "__main__":
    main()
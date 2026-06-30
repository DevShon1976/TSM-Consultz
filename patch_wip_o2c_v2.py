#!/usr/bin/env python3
"""
One-shot patcher: add 'o2c' to COLLECTIVE_VERTICALS allowlist in server.js
Idempotent. Run from repo root (where server.js lives).
"""
import shutil
import datetime
import sys

TARGET = "server.js"
OLD = "const COLLECTIVE_VERTICALS = ['healthcare', 'finops', 'bpo', 'legal', 'real-estate', 'insurance', 'construction'];"
NEW = "const COLLECTIVE_VERTICALS = ['healthcare', 'finops', 'bpo', 'legal', 'real-estate', 'insurance', 'construction', 'o2c'];"

results = []

def main():
    try:
        with open(TARGET, "r", encoding="utf-8") as f:
            content = f.read()
    except FileNotFoundError:
        print(f"FAIL: {TARGET} not found in current directory.")
        sys.exit(1)

    if "'o2c'" in content.split("COLLECTIVE_VERTICALS")[1].split("\n")[0]:
        results.append(("COLLECTIVE_VERTICALS already includes o2c", "SKIP"))
    elif OLD in content:
        ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = f"{TARGET}.bak.{ts}"
        shutil.copy(TARGET, backup_path)
        content = content.replace(OLD, NEW)
        with open(TARGET, "w", encoding="utf-8") as f:
            f.write(content)
        results.append((f"Patched COLLECTIVE_VERTICALS, backup -> {backup_path}", "PASS"))
    else:
        results.append(("Expected COLLECTIVE_VERTICALS line not found verbatim — manual check needed", "FAIL"))

    print("\n--- patch_wip_o2c_v2.py report ---")
    for msg, status in results:
        print(f"[{status}] {msg}")
    print("-----------------------------------\n")

    if any(s == "FAIL" for _, s in results):
        sys.exit(1)

if __name__ == "__main__":
    main()

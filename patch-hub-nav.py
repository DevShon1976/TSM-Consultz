#!/usr/bin/env python3
"""
patch-hub-nav.py
────────────────
Inserts a "Field & Doc Ops" nav tab after "Deck" in construction-hub.html.
Run from the root of your tsm-shell repo:

    python3 patch-hub-nav.py

Then commit and push — the deploy script handles the rest.
"""

import re, sys, shutil, os
from datetime import datetime

# ── Config ──────────────────────────────────────────────────────
HUB_FILE    = "construction-suite/construction-hub.html"
BACKUP_EXT  = f".bak.{datetime.now().strftime('%Y%m%d_%H%M%S')}"
NEW_LABEL   = "Field Ops"
NEW_HREF    = "/construction-suite/construction-suite-expansion.html"
NEW_TITLE   = "FieldOps · PlanRoom · Procurement · RFI · Gantt"

GREEN  = "\033[0;32m"
AMBER  = "\033[0;33m"
RED    = "\033[0;31m"
CYAN   = "\033[0;36m"
DIM    = "\033[2m"
NC     = "\033[0m"

def log(symbol, color, msg): print(f"  {color}{symbol}{NC} {msg}")

# ── Read file ────────────────────────────────────────────────────
if not os.path.isfile(HUB_FILE):
    log("✗", RED, f"File not found: {HUB_FILE}")
    log("→", AMBER, "Run from the repo root containing construction-suite/")
    sys.exit(1)

with open(HUB_FILE, "r", encoding="utf-8") as f:
    html = f.read()

# ── Already patched? ─────────────────────────────────────────────
if "construction-suite-expansion" in html:
    log("✓", GREEN, "Nav already contains Field Ops link — nothing to do.")
    sys.exit(0)

# ── Strategy 1: anchor-tag with text "Deck" ─────────────────────
# Matches: <a ...>Deck</a>  or  <a ...> Deck </a>
PATTERN_A = re.compile(
    r'(<a[^>]*>\s*Deck\s*</a>)',
    re.IGNORECASE | re.DOTALL
)

# ── Strategy 2: any element with text "Deck" (button, li, div, span) ──
PATTERN_B = re.compile(
    r'(<(?:button|li|span|div)[^>]*>\s*Deck\s*</(?:button|li|span|div)>)',
    re.IGNORECASE | re.DOTALL
)

# ── Build the new tab ────────────────────────────────────────────
def build_new_tab(matched_tag: str) -> str:
    """
    Mirror the style of the matched Deck element as closely as possible,
    but as an anchor pointing at the expansion page.
    """
    # Pull class/style attrs from the deck element to copy styling
    cls_match   = re.search(r'class=["\']([^"\']*)["\']', matched_tag)
    style_match = re.search(r'style=["\']([^"\']*)["\']', matched_tag)

    classes = cls_match.group(1)   if cls_match   else ""
    styles  = style_match.group(1) if style_match else ""

    # If the Deck element is an <a>, keep it an <a>
    if matched_tag.lstrip().startswith("<a"):
        new_tab = (
            f'<a href="{NEW_HREF}" title="{NEW_TITLE}"'
            + (f' class="{classes}"' if classes else '')
            + (f' style="{styles}"'  if styles  else '')
            + f'>{NEW_LABEL}</a>'
        )
    else:
        # Wrap in an anchor so it's always clickable
        tag_name = re.match(r'<(\w+)', matched_tag).group(1)
        new_tab = (
            f'<a href="{NEW_HREF}" title="{NEW_TITLE}" style="text-decoration:none;">'
            f'<{tag_name}'
            + (f' class="{classes}"' if classes else '')
            + (f' style="{styles}"'  if styles  else '')
            + f'>{NEW_LABEL}</{tag_name}></a>'
        )
    return new_tab

# ── Attempt Strategy 1 ───────────────────────────────────────────
match = PATTERN_A.search(html)
strategy = "anchor"

if not match:
    match = PATTERN_B.search(html)
    strategy = "element"

if not match:
    # ── Strategy 3: raw text fallback — find >Deck< anywhere ────
    idx = html.lower().find(">deck<")
    if idx == -1:
        log("✗", RED, 'Could not locate "Deck" in the nav. Check the file manually.')
        log("→", AMBER, f"Open {HUB_FILE} and add this after your Deck nav item:")
        print(f'\n    <a href="{NEW_HREF}">{NEW_LABEL}</a>\n')
        sys.exit(1)

    # Insert after the closing tag of the element containing "Deck"
    close_idx = html.find("<", idx + 1)
    insert_at = html.find(">", close_idx) + 1
    new_tab = f' <a href="{NEW_HREF}" title="{NEW_TITLE}">{NEW_LABEL}</a>'
    patched  = html[:insert_at] + new_tab + html[insert_at:]
    strategy = "raw"
else:
    deck_html = match.group(1)
    new_tab   = build_new_tab(deck_html)
    # Insert AFTER the Deck element
    patched = html[:match.end()] + " " + new_tab + html[match.end():]

# ── Backup + write ───────────────────────────────────────────────
backup_path = HUB_FILE + BACKUP_EXT
shutil.copy2(HUB_FILE, backup_path)
log("→", DIM, f"Backup: {backup_path}")

with open(HUB_FILE, "w", encoding="utf-8") as f:
    f.write(patched)

# ── Verify ───────────────────────────────────────────────────────
with open(HUB_FILE, "r", encoding="utf-8") as f:
    verify = f.read()

if "construction-suite-expansion" in verify:
    log("✓", GREEN, f"Patch applied via strategy: {strategy}")
    log("✓", GREEN, f'"{NEW_LABEL}" tab inserted after Deck in nav')
    log("✓", GREEN, f"Points to: {NEW_HREF}")
    print()
    log("→", CYAN,  "Next steps:")
    print(f"     git add {HUB_FILE}")
    print( '     git commit -m "nav: add Field Ops tab to construction hub"')
    print( '     git push')
    print( '     bash deploy-construction-suite.sh')
    print()
else:
    log("✗", RED, "Patch verification failed — file may need manual edit.")
    log("→", AMBER, "Restoring backup…")
    shutil.copy2(backup_path, HUB_FILE)
    sys.exit(1)

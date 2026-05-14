#!/usr/bin/env python3
"""
tsm-shell shared wiring patcher
Run from /workspaces/tsm-shell:
  python3 patch-shared.py
"""

import os, re, shutil, textwrap
from pathlib import Path

ROOT   = Path("/workspaces/tsm-shell/html")
SHARED = ROOT / "shared"
SUITES = [ROOT / "healthcare", ROOT / "finops-suite", ROOT / "construction-suite"]

# ── 1. Shared JS ────────────────────────────────────────────────────────────

SHARED_JS = """\
/**
 * tsm-shared.js  –  single source of truth for common UI utilities
 * Loaded by every suite HTML before closing </head>
 */

/* ── Tab switching ─────────────────────────────────────── */
window.showTab = function (id, el) {
  document.querySelectorAll(".tab-content").forEach(c => (c.style.display = "none"));
  const panel = document.getElementById(id);
  if (panel) panel.style.display = "block";
  document.querySelectorAll(".nav-tab").forEach(n => n.classList.remove("active"));
  if (el) el.classList.add("active");
};

window.switchTab = function (t) {
  document.querySelectorAll(".trm-tab").forEach(e => e.classList.remove("active"));
  document.querySelectorAll(".trm-panel").forEach(e => e.classList.remove("active"));
  const target = document.getElementById(t);
  if (target) target.classList.add("active");
};

window.filterTab = function (t) {
  window.switchTab(t);
};

/* ── TSM_UI bootstrap ──────────────────────────────────── */
document.addEventListener("DOMContentLoaded", function () {
  if (typeof TSM_UI !== "undefined" && !window.ui) {
    window.ui = typeof TSM_UI === "function" ? new TSM_UI() : TSM_UI;
  }
});

/* ── Right-click / devtools guard (preserve existing behaviour) ─ */
if (!document._tsmGuardInstalled) {
  document._tsmGuardInstalled = true;
  document.addEventListener("contextmenu", e => e.preventDefault());
  document.addEventListener("keydown", e => {
    if (
      e.keyCode === 123 ||
      (e.ctrlKey && e.shiftKey && [73, 74, 67].includes(e.keyCode)) ||
      (e.ctrlKey && e.keyCode === 85)
    )
      e.preventDefault();
  });
}
"""

# ── 2. Shared CSS ────────────────────────────────────────────────────────────
# Consolidates every Google Font referenced across all three suites.

SHARED_CSS = """\
/*
 * tsm-shared.css  –  consolidated Google Fonts for all suites
 * Add suite-specific overrides in your own stylesheet AFTER this one.
 */

@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,300&family=Barlow:wght@300;400;500;600;700&family=Bebas+Neue&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500;600&family=DM+Serif+Display:ital@0;1&family=Exo+2:ital,wght@0,300;0,400;0,600;1,300&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500&family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@300;400;500;600;700&family=Orbitron:wght@400;600;700;800;900&family=Outfit:wght@300;400;500;600&family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&family=Space+Grotesk:wght@300;400;500;600&family=Syne:wght@400;500;600;700;800&display=swap');

*, *::before, *::after { box-sizing: border-box; }
"""

# ── 3. Patterns to strip from HTML files ────────────────────────────────────

# Inline <script> blocks that are now handled by tsm-shared.js
STRIP_INLINE_PATTERNS = [
    # showTab variations
    r'<script>\s*(?:window\.)?showTab\s*=\s*function[^<]+?</script>',
    r'<script>window\.showTab\s*=[^<]+?</script>',
    # switchTab
    r'<script>\s*function\s+switchTab[^<]+?</script>',
    # filterTab
    r'<script>\s*function\s+filterTab[^<]+?</script>',
    # window.ui bootstrap
    r'<script>window\.ui\s*=\s*(?:typeof TSM_UI[^<]+?|new TSM_UI\(\));\s*</script>',
    # devtools guard (the long CF-style one)
    r'<script>document\.oncontextmenu[^<]+?</script>',
    # duplicate google fonts preconnect (shared CSS handles it)
    r'<link\s+rel=["\']preconnect["\']\s+href=["\']https://fonts\.googleapis\.com["\'][^>]*/?>',
    r'<link\s+href=["\']https://fonts\.googleapis\.com/css2[^"\']+["\']\s+rel=["\']stylesheet["\'][^>]*/?>',
    r'<link\s+rel=["\']stylesheet["\']\s+href=["\']https://fonts\.googleapis\.com/css2[^"\']+["\']\s*/?>',
]

# Path normalisations for script src attributes
PATH_FIXES = {
    'src="/html/tsm-bnca-bridge.js"'      : 'src="/tsm-bnca-bridge.js"',
    "src='/html/tsm-bnca-bridge.js'"      : "src='/tsm-bnca-bridge.js'",
    'src="tsm-bridge-construct.js"'        : 'src="/tsm-bnca-bridge.js"',
    "src='tsm-bridge-construct.js'"        : "src='/tsm-bnca-bridge.js'",
}

INJECT_CSS = '<link rel="stylesheet" href="/shared/tsm-shared.css">'
INJECT_JS  = '<script src="/shared/tsm-shared.js"></script>'

# ── helpers ──────────────────────────────────────────────────────────────────

def backup(path: Path):
    bak = path.with_suffix(path.suffix + ".bak.shared-wire")
    if not bak.exists():
        shutil.copy2(path, bak)

def patch_html(path: Path) -> bool:
    src = path.read_text(encoding="utf-8", errors="replace")
    original = src

    # Strip inline patterns
    for pat in STRIP_INLINE_PATTERNS:
        src = re.sub(pat, "", src, flags=re.DOTALL | re.IGNORECASE)

    # Fix paths
    for old, new in PATH_FIXES.items():
        src = src.replace(old, new)

    # Remove blank lines left by stripped blocks (tidy up)
    src = re.sub(r'\n{3,}', '\n\n', src)

    # Inject shared CSS before </head> if not already present
    if INJECT_CSS not in src and "</head>" in src:
        src = src.replace("</head>", f"  {INJECT_CSS}\n  {INJECT_JS}\n</head>", 1)
    elif INJECT_JS not in src and "</head>" in src:
        src = src.replace("</head>", f"  {INJECT_JS}\n</head>", 1)

    if src != original:
        backup(path)
        path.write_text(src, encoding="utf-8")
        return True
    return False

# ── main ─────────────────────────────────────────────────────────────────────

def main():
    # Create shared dir and write shared files
    SHARED.mkdir(exist_ok=True)
    (SHARED / "tsm-shared.js").write_text(SHARED_JS, encoding="utf-8")
    (SHARED / "tsm-shared.css").write_text(SHARED_CSS, encoding="utf-8")
    print(f"✔  Created {SHARED / 'tsm-shared.js'}")
    print(f"✔  Created {SHARED / 'tsm-shared.css'}")

    # Patch all HTML files across suites
    changed, skipped = [], []
    for suite in SUITES:
        for html in sorted(suite.rglob("*.html")):
            # Skip backup files
            if ".bak" in html.suffixes or ".bak" in html.name:
                continue
            if patch_html(html):
                changed.append(html.relative_to(ROOT))
            else:
                skipped.append(html.relative_to(ROOT))

    print(f"\n{'─'*60}")
    print(f"  Patched : {len(changed)} files")
    print(f"  Unchanged: {len(skipped)} files")
    print(f"{'─'*60}")
    if changed:
        print("\nPatched files:")
        for f in changed:
            print(f"  ✔  {f}")
    print("\nOriginals backed up as *.bak.shared-wire")
    print("\nNext step: make sure your dev server serves /html/shared/ at /shared/")

if __name__ == "__main__":
    main()

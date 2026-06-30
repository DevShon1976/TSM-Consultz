#!/usr/bin/env python3
"""
One-shot patcher: lighter dark theme + UX fixes for WIP Command Center.
- Softer charcoal palette (was near-black #07090a)
- Fixes range-slider track that visually renders full regardless of value
- Adds row-hover affordance for scannability
- Upgrades empty states from plain italic text to a bordered placeholder box
- Fixes a stale hardcoded toast background color left over from the old palette
Idempotent. Run from repo root (where html/ lives).
"""
import shutil
import datetime
import sys

TARGET = "html/tsm-wip-command-center.html"
results = []

def patch(content, label, old, new, marker=None):
    """Apply one replacement. marker: string to check for 'already applied' (defaults to new)."""
    check = marker if marker else new
    if check in content:
        results.append((f"{label}: already applied", "SKIP"))
        return content
    if old not in content:
        results.append((f"{label}: expected anchor not found — manual check needed", "FAIL"))
        return content
    content = content.replace(old, new)
    results.append((f"{label}: applied", "PASS"))
    return content

def main():
    try:
        with open(TARGET, "r", encoding="utf-8") as f:
            content = f.read()
    except FileNotFoundError:
        print(f"FAIL: {TARGET} not found relative to current directory.")
        sys.exit(1)

    # 1. Token palette — lighter charcoal, higher-contrast text/lines
    OLD_ROOT = """  :root{
    --bg:#07090a;
    --panel:#0d1113;
    --panel-2:#101517;
    --line:#1b2326;
    --cyan:#19e0d6;
    --cyan-dim:#0d6f6a;
    --green:#3ddc84;
    --gold:#e8b84b;
    --orange:#090908;
    --red:#e0473d;
    --text:#cfe0df;
    --text-dim:#6f8584;
    --mono:'JetBrains Mono','Share Tech Mono',monospace;
  }"""
    NEW_ROOT = """  :root{
    --bg:#161b1f;
    --panel:#1e252a;
    --panel-2:#242c32;
    --line:#313c42;
    --cyan:#2dd4cf;
    --cyan-dim:#1f8f8a;
    --green:#4ade80;
    --gold:#f0c14b;
    --orange:#f0934b;
    --red:#f2685c;
    --text:#eef5f4;
    --text-dim:#94a8a6;
    --mono:'JetBrains Mono','Share Tech Mono',monospace;
  }"""
    content = patch(content, "Lighter charcoal token palette", OLD_ROOT, NEW_ROOT, marker="--bg:#161b1f")

    # 2. Stale hardcoded toast background (left over from old near-black panel value)
    content = patch(
        content,
        "Toast background → var(--panel)",
        "background:#0d1113;border:1px solid var(--line);color:var(--text);",
        "background:var(--panel);border:1px solid var(--line);color:var(--text);",
    )

    # 3. Readiness slider: visible filled-track (was rendering as a solid bar regardless of value)
    OLD_RANGE_CSS = "  .rbar-row input[type=range]{width:100%;accent-color:var(--cyan);}"
    NEW_RANGE_CSS = """  .rbar-row input[type=range]{
    width:100%;accent-color:var(--cyan);
    -webkit-appearance:none;appearance:none;
    height:6px;border-radius:3px;background:var(--line);
    background-image:linear-gradient(var(--cyan),var(--cyan));
    background-repeat:no-repeat;
  }
  .rbar-row input[type=range]::-webkit-slider-thumb{
    -webkit-appearance:none;width:14px;height:14px;border-radius:50%;
    background:var(--cyan);cursor:pointer;border:2px solid var(--bg);
  }
  .rbar-row input[type=range]::-moz-range-thumb{
    width:14px;height:14px;border-radius:50%;background:var(--cyan);
    cursor:pointer;border:2px solid var(--bg);
  }
  .rbar-row input[type=range]::-moz-range-progress{background:var(--cyan);height:6px;border-radius:3px;}
  .rbar-row input[type=range]::-moz-range-track{background:var(--line);height:6px;border-radius:3px;}"""
    content = patch(content, "Readiness slider visible-fill styling", OLD_RANGE_CSS, NEW_RANGE_CSS)

    # 4. Empty states: plain italic text → bordered placeholder box (clearer affordance)
    OLD_EMPTY_CSS = "  .empty-row{font-size:11px;color:var(--text-dim);font-style:italic;padding:10px 0;}"
    NEW_EMPTY_CSS = """  .empty-row{
    font-size:11.5px;color:var(--text-dim);font-style:normal;
    text-align:center;padding:22px 16px;
    border:1px dashed var(--line);border-radius:5px;
  }"""
    content = patch(content, "Empty-state placeholder box", OLD_EMPTY_CSS, NEW_EMPTY_CSS)

    # 5. Row hover affordance (additive — inserted just before closing </style>)
    HOVER_MARKER = "/* ── UX REFRESH: row hover affordance ── */"
    HOVER_BLOCK = f"""  {HOVER_MARKER}
  .task-row:not(.head):hover, .dq-row:hover, .trend-row:not(.head):hover {{
    background:rgba(255,255,255,0.035);
    margin:0 -10px;padding-left:10px;padding-right:10px;
    border-radius:4px;
  }}
  .panel:hover{{border-color:var(--cyan-dim);}}
</style>"""
    content = patch(content, "Row hover affordance", "</style>", HOVER_BLOCK, marker=HOVER_MARKER)

    # 6. JS: keep the slider fill gradient in sync as the user drags it
    OLD_JS = """  wrap.querySelectorAll('.rbar-input').forEach(inp => {
    inp.addEventListener('input', () => {
      wrap.querySelector(`[data-out="${inp.dataset.field}"]`).textContent = inp.value + '%';
    });
  });"""
    NEW_JS = """  wrap.querySelectorAll('.rbar-input').forEach(inp => {
    inp.style.backgroundSize = inp.value + '% 100%';
    inp.addEventListener('input', () => {
      wrap.querySelector(`[data-out="${inp.dataset.field}"]`).textContent = inp.value + '%';
      inp.style.backgroundSize = inp.value + '% 100%';
    });
  });"""
    content = patch(content, "JS: sync slider fill width on render + drag", OLD_JS, NEW_JS)

    print("\n--- patch_wip_lighter_ux.py report ---")
    for msg, status in results:
        print(f"[{status}] {msg}")
    print("----------------------------------------\n")

    any_pass = any(s == "PASS" for _, s in results)
    any_fail = any(s == "FAIL" for _, s in results)

    if any_pass:
        ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = f"{TARGET}.bak.{ts}"
        shutil.copy(TARGET, backup_path)
        with open(TARGET, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Backup saved -> {backup_path}")
        print(f"{TARGET} updated.")
    else:
        print("No changes written (nothing to apply, or all skipped).")

    if any_fail:
        sys.exit(1)

if __name__ == "__main__":
    main()
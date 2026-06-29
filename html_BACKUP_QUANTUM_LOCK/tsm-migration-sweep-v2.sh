#!/usr/bin/env bash
set -e

echo "▶ TSM MIGRATION SWEEP v2 START"

ROOT="$(pwd)"
HTML="$ROOT/html"
RUNTIME="$HTML/runtime"

mkdir -p "$RUNTIME"

# =========================================================
# 1. WRITE LEGACY BRIDGE
# =========================================================

cat > "$RUNTIME/tsm-legacy-bridge.js" << 'JS'
// =====================================================
// TSM LEGACY BRIDGE v1
// Backward compatibility during migration
// =====================================================

window.TSM = window.TSM || {};

TSM.legacy = TSM.legacy || {};

[
  "switchMod",
  "switchTab",
  "showTab",
  "runSim",
  "submitDemo",
  "openPanel",
  "togglePanel"
].forEach(fn => {
  if (typeof window[fn] === "function") {
    TSM.legacy[fn] = window[fn];
  }
});

TSM.executeLegacy = function(action, rawArgs, el) {
  const fn = TSM.legacy[action];

  if (!fn) {
    console.warn("[TSM] Missing legacy handler:", action);
    return;
  }

  try {
    let parsed = [];

    if (rawArgs && rawArgs.trim()) {
      parsed = Function(
        "el",
        "return [" + rawArgs.replace(/\bthis\b/g, "el") + "]"
      )(el);
    }

    return fn.apply(el, parsed);

  } catch (err) {
    console.error("[TSM] Legacy execution failed:", action, err);
  }
};

document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-tsm-action]");
  if (!el) return;

  const action = el.dataset.tsmAction || "";
  const args = el.dataset.tsmArgs || "";

  if (TSM.legacy[action]) {
    e.preventDefault();
    TSM.executeLegacy(action, args, el);
  }
});
JS

echo "✔ legacy bridge installed"

# =========================================================
# 2. PYTHON MIGRATION ENGINE
# =========================================================

python3 << 'PY'
from pathlib import Path
import re

ROOT = Path.cwd()
HTML = ROOT / "html"

FILES = list(HTML.rglob("*.html"))

runtime_tag = '''
<script src="/html/runtime/tsm-runtime-engine.js"></script>
<script src="/html/runtime/tsm-action-registry.js"></script>
<script src="/html/runtime/tsm-runtime-router.js"></script>
<script src="/html/runtime/tsm-legacy-bridge.js"></script>
'''

onclick_patterns = [
    r'onclick="([a-zA-Z0-9_]+)\((.*?)\)"',
    r"onclick='([a-zA-Z0-9_]+)\((.*?)\)'"
]

nav_patterns = [
    r'onclick="window\.location\.href\s*=\s*[\'"]([^\'"]+)[\'"]"',
    r"onclick='window\.location\.href\s*=\s*[\"\']([^\"\']+)[\"\']'"
]

fixed = 0

for f in FILES:
    try:
        txt = f.read_text(errors="ignore")
        original = txt

        # =====================================================
        # CSS FIXES
        # =====================================================

        txt = re.sub(
            r'display\s*:\s*noneoverflow-y',
            'display:none;overflow-y',
            txt
        )

        txt = re.sub(
            r'height\s*:\s*100vh\s*;',
            'min-height:100vh;',
            txt
        )

        txt = re.sub(
            r'overflow\s*:\s*hidden\s*;',
            'overflow-y:auto;',
            txt
        )

        # =====================================================
        # NAVIGATION NORMALIZATION
        # =====================================================

        for pat in nav_patterns:
            txt = re.sub(
                pat,
                lambda m:
                    f'data-tsm-action="navigate" '
                    f'data-tsm-args="\'{m.group(1)}\'"',
                txt
            )

        # =====================================================
        # ONCLICK → data-tsm-action
        # =====================================================

        for pat in onclick_patterns:

            def repl(m):
                fn = m.group(1)
                args = m.group(2)

                return (
                    f'data-tsm-action="{fn}" '
                    f'data-tsm-args="{args}"'
                )

            txt = re.sub(pat, repl, txt)

        # =====================================================
        # INSTALL RUNTIME SCRIPTS
        # =====================================================

        if "tsm-runtime-engine.js" not in txt:

            if "</body>" in txt:
                txt = txt.replace(
                    "</body>",
                    runtime_tag + "\n</body>"
                )
            else:
                txt += runtime_tag

        # =====================================================
        # SAVE
        # =====================================================

        if txt != original:
            f.write_text(txt)
            fixed += 1
            print("wired:", f.relative_to(ROOT))

    except Exception as e:
        print("error:", f, e)

print(f"\n✔ MIGRATION COMPLETE — {fixed} files updated")
PY

# =========================================================
# 3. WRITE NAVIGATE ACTION
# =========================================================

cat >> "$RUNTIME/tsm-runtime-router.js" << 'JS'

// =====================================================
// NAVIGATION ACTION
// =====================================================

window.TSM = window.TSM || {};

TSM.navigate = function(url){
  if(!url) return;
  window.location.href = url;
};

document.addEventListener("click", (e)=>{
  const el = e.target.closest('[data-tsm-action="navigate"]');
  if(!el) return;

  e.preventDefault();

  try{
    const args = el.dataset.tsmArgs || "";
    const url = args.replace(/^['"]|['"]$/g,'');
    TSM.navigate(url);
  }catch(err){
    console.error("[TSM NAV]", err);
  }
});
JS

echo "✔ navigation dispatcher installed"

# =========================================================
# 4. VERIFY
# =========================================================

echo ""
echo "━━ VERIFYING ━━"

grep -R 'onclick=' "$HTML" | head -20 || true

echo ""
echo "Remaining onclick count:"
grep -R 'onclick=' "$HTML" | wc -l || true

echo ""
echo "Runtime installs:"
grep -R "tsm-runtime-engine.js" "$HTML" | wc -l || true

echo ""
echo "━━ COMPLETE ━━"
echo "Next:"
echo "  git add ."
echo "  git commit -m 'migration sweep v2'"
echo "  git push"
echo "  fly deploy"


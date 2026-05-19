#!/usr/bin/env bash
set -e

echo "▶ TSM ONE-SHOT SAFE FIX START"

ROOT="$(pwd)"
HTML="$ROOT/html"

python3 << 'PY'
from pathlib import Path

def patch_file(path, js, marker):
    p = Path(path)
    if not p.exists():
        print("missing:", path)
        return

    txt = p.read_text()

    if marker in txt:
        print("already patched:", path)
        return

    insert = f"\n<script>\n{js}\n</script>\n"

    if "</body>" in txt:
        txt = txt.replace("</body>", insert + "</body>")
    else:
        txt += insert

    p.write_text(txt)
    print("patched:", path)


# -----------------------------
# SCROLL FIX (inline safe)
# -----------------------------
scroll_files = [
    "html/construction-suite/document-showcase.html",
    "html/construction-suite/construction-strategist.html",
    "html/finops-suite/staff-accountant-interview.html"
]

def fix_scroll(file):
    p = Path(file)
    if not p.exists():
        print("missing:", file)
        return

    c = p.read_text()
    c = c.replace("height:100vh;", "min-height:100vh;")
    c = c.replace("overflow:hidden;", "overflow-y:auto;")
    p.write_text(c)
    print("scroll fixed:", file)

for f in scroll_files:
    fix_scroll(f)


# -----------------------------
# SCORE FIX (SAFE JS STRING)
# -----------------------------
score_js = """(function(){
document.addEventListener('DOMContentLoaded',()=>{
const checks=[...document.querySelectorAll('.check,[class*="check"]')];
let done=checks.filter(x=>x.textContent.includes('✓')).length;

if(done){
let pct=Math.round(done/20*100);
let el=document.querySelector('[class*="pct"],[class*="score"]');
if(el) el.textContent=pct+'%';
}
});
})();"""

patch_file(
    "html/finops-suite/staff-accountant-interview.html",
    score_js,
    "TSM_SCORE_FIX_V1"
)


# -----------------------------
# ACTIVATE ENGINE (BUTTON WIRE)
# -----------------------------
activate_js = """(function(){
document.addEventListener('DOMContentLoaded',()=>{
document.querySelectorAll('button').forEach(b=>{
if(b.dataset.tsm) return;
b.dataset.tsm=1;
b.onclick=()=>console.log('[TSM]',b.innerText);
});
console.log('[TSM ACTIVE]');
});
})();"""

targets = [
    "html/construction-suite/document-showcase.html",
    "html/construction-suite/construction-strategist.html",
    "html/finops-suite/finops-wip.html",
    "html/finops-suite/staff-accountant-interview.html",
    "html/tsm-insurance/agents-ins.html",
    "html/tsm-insurance/insurance-ce-command.html"
]

for t in targets:
    patch_file(t, activate_js, "TSM_ENGINE_V1")

print("✔ ALL PATCHES COMPLETE")
PY

echo "▶ DONE - RUN: fly deploy"

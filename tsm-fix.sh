#!/usr/bin/env bash
set -e

echo "▶ TSM CLEAN ENGINE FIX START"

ROOT="$(pwd)"
HTML="$ROOT/html"

echo "━━ SCROLL FIX ━━"

python3 - << 'PY'
import re, glob

files = [
    "html/construction-suite/document-showcase.html",
    "html/construction-suite/construction-strategist.html",
    "html/finops-suite/staff-accountant-interview.html"
]

for f in files:
    try:
        c=open(f).read()
        c=re.sub(r'height\s*:\s*100vh\s*;', 'min-height:100vh;', c)
        c=re.sub(r'overflow\s*:\s*hidden\s*;', 'overflow-y:auto;', c)
        open(f,'w').write(c)
        print("fixed:", f)
    except FileNotFoundError:
        print("missing:", f)
PY

echo "━━ SCORE FIX INJECTION ━━"

python3 - << 'PY'
from pathlib import Path

file = Path("html/finops-suite/staff-accountant-interview.html")
if file.exists():
    content = file.read_text()

    js = """
(function(){
  function run(){
    const checks=[...document.querySelectorAll('.check,[class*="check"]')];
    let done=checks.filter(c=>c.textContent.includes('✓')).length;
    if(!done) return;

    let pct=Math.round((done/20)*100);
    let el=document.querySelector('[class*="pct"],[class*="score"]');
    if(el) el.textContent=pct+"%";

    console.log("[TSM SCORE FIX]",pct);
  }
  document.addEventListener("DOMContentLoaded",()=>setTimeout(run,600));
})();
"""

    if "TSM_SCORE_FIX_V2" not in content:
        idx = content.rfind("</body>")
        if idx != -1:
            content = content[:idx] + f"\n<script>{js}</script>\n" + content[idx:]
        else:
            content += f"\n<script>{js}</script>"

    file.write_text(content)
    print("score patched")
else:
    print("missing staff file")
PY

echo "━━ ACTIVATE ENGINE ━━"

python3 - << 'PY'
from pathlib import Path

files = [
    "html/construction-suite/document-showcase.html",
    "html/construction-suite/construction-strategist.html",
    "html/finops-suite/finops-wip.html",
    "html/finops-suite/staff-accountant-interview.html",
    "html/tsm-insurance/agents-ins.html",
    "html/tsm-insurance/insurance-ce-command.html"
]

js = """
(function(){
  document.addEventListener("DOMContentLoaded",()=>{
    document.querySelectorAll("button").forEach(b=>{
      if(b.dataset.tsm) return;
      b.dataset.tsm=1;
      b.onclick=()=>console.log("[TSM]",b.innerText);
    });
    console.log("[TSM ENGINE ACTIVE]");
  });
})();
"""

for f in files:
    try:
        c = Path(f).read_text()
        if "TSM_ENGINE_V1" not in c:
            idx = c.rfind("</body>")
            if idx != -1:
                c = c[:idx] + f"\n<script>{js}</script>\n" + c[idx:]
            else:
                c += f"\n<script>{js}</script>"
            Path(f).write_text(c)
            print("activated:", f)
    except FileNotFoundError:
        print("missing:", f)
PY

echo "━━ VERIFY ━━"
grep -R "TSM_ENGINE_ACTIVE" html || true

echo "✔ DONE CLEAN FIX"

#!/usr/bin/env bash
set -e

echo "▶ TSM RUNTIME NORMALIZE v1 START"

ROOT="$(pwd)"
HTML="$ROOT/html"
RUNTIME="$HTML/runtime"

mkdir -p "$RUNTIME"

# =====================================================
# 1. WRITE RUNTIME ENGINE
# =====================================================

cat > "$RUNTIME/tsm-runtime-engine.js" << 'JS'
// =====================================================
// TSM RUNTIME ENGINE v1
// =====================================================

(function(){

window.TSM = window.TSM || {};

TSM.state = {
  scores:{},
  modules:{},
  activeSuite:null,
  currentModule:null,

  setScore(key,val){

    const clean = Number(val);

    this.scores[key] =
      Number.isFinite(clean)
      ? clean
      : 0;

    TSM.score.render();
  }
};

TSM.score = {

  render(){

    document
      .querySelectorAll('[data-score-key]')
      .forEach(el=>{

        const key = el.dataset.scoreKey;

        const val =
          TSM.state.scores[key] || 0;

        el.textContent = val + "%";
      });
  }
};

TSM.router = {

  navigate(path){
    if(path) window.location.href = path;
  }
};

TSM.actions = {

  switchMod(name,btn){

    document
      .querySelectorAll('.module')
      .forEach(m=>m.classList.remove('active'));

    document
      .querySelectorAll('.tnav-btn')
      .forEach(b=>b.classList.remove('active'));

    const mod =
      document.getElementById('mod-' + name);

    if(mod) mod.classList.add('active');

    if(btn) btn.classList.add('active');

    TSM.state.currentModule = name;
  },

  showTab(name,btn){

    document
      .querySelectorAll('.tab-pane')
      .forEach(t=>t.classList.remove('active'));

    document
      .querySelectorAll('.nav-item')
      .forEach(n=>n.classList.remove('active'));

    const pane =
      document.getElementById(name);

    if(pane) pane.classList.add('active');

    if(btn) btn.classList.add('active');
  },

  markDone(btn){

    const row =
      btn.closest('.decision-card');

    if(row){
      row.style.opacity=".45";
      row.style.pointerEvents="none";
    }
  },

  openClosingLock(){
    console.log("TSM Executive Close");
  },

  startAutoDemo(){
    console.log("TSM Auto Demo");
  },

  toggleDecisions(){

    const box =
      document.getElementById('mgr-decisions');

    if(!box) return;

    box.style.display =
      box.style.display === 'none'
      ? 'block'
      : 'none';
  }
};

document.addEventListener('click',(e)=>{

  const el =
    e.target.closest('[data-tsm-action]');

  if(!el) return;

  const action = el.dataset.tsmAction;

  const raw =
    el.dataset.tsmArgs || "";

  if(!TSM.actions[action]){
    console.warn(
      "Unknown TSM action:",
      action
    );
    return;
  }

  try{

    const args = raw
      ? Function(
          "return [" + raw + "]"
        )()
      : [];

    TSM.actions[action](...args);

  }catch(err){

    console.error(
      "TSM dispatch error:",
      err
    );
  }
});

document.addEventListener(
  "DOMContentLoaded",
  ()=>TSM.score.render()
);

console.log(
  "TSM Runtime Engine v1 Loaded"
);

})();
JS

echo "✔ runtime engine installed"

# =====================================================
# 2. NORMALIZE HTML FILES
# =====================================================

python3 << 'PY'
from pathlib import Path
import re

ROOT = Path.cwd()
HTML = ROOT / "html"

skip_patterns = [
    ".backup.",
    ".actiondetail.",
    "index01.html",
    "index001.html",
    "index0001.html",
    "index00001.html"
]

runtime_tag = (
    '<script src="/runtime/tsm-runtime-engine.js"></script>'
)

converted = 0
wired = 0
css_fixed = 0

def should_skip(path):
    s = str(path)
    return any(x in s for x in skip_patterns)

def convert_onclick(match):

    full = match.group(0)
    fn = match.group(1)
    args = match.group(2).strip()

    return (
        f'data-tsm-action="{fn}" '
        f'data-tsm-args="{args}"'
    )

for file in HTML.rglob("*.html"):

    if should_skip(file):
        continue

    try:
        c = file.read_text(errors="ignore")
    except:
        continue

    original = c

    # =========================================
    # FIX BROKEN CSS
    # =========================================

    bad_css = (
        ".module{display:noneoverflow-y:auto;min-height:0;}"
    )

    good_css = """
.module{
  display:none;
  overflow-y:auto;
  min-height:0;
}
"""

    if bad_css in c:
        c = c.replace(bad_css, good_css)
        css_fixed += 1

    # =========================================
    # CONVERT onclick
    # =========================================

    c2 = re.sub(
        r'onclick\s*=\s*"([A-Za-z0-9_]+)\((.*?)\)"',
        convert_onclick,
        c
    )

    if c2 != c:
        converted += 1

    c = c2

    # =========================================
    # INSTALL RUNTIME
    # =========================================

    if runtime_tag not in c:

        if "</body>" in c:
            c = c.replace(
                "</body>",
                runtime_tag + "\n</body>"
            )
        else:
            c += "\n" + runtime_tag

        wired += 1

    # =========================================
    # WRITE FILE
    # =========================================

    if c != original:
        file.write_text(c)

print("✔ onclick migrated:", converted)
print("✔ runtime wired:", wired)
print("✔ css normalized:", css_fixed)
PY

# =====================================================
# 3. VERIFY
# =====================================================

echo ""
echo "━━ VERIFY ━━"

echo ""
echo "Remaining onclick count:"
grep -R 'onclick=' "$HTML" \
  --include="*.html" \
  | grep -v ".backup." \
  | grep -v ".actiondetail." \
  | grep -v "index01.html" \
  | grep -v "index001.html" \
  | grep -v "index0001.html" \
  | wc -l

echo ""
echo "Runtime installs:"
grep -R "TSM Runtime Engine v1 Loaded" "$RUNTIME" | wc -l

echo ""
echo "Malformed CSS remaining:"
grep -R "display:noneoverflow-y:auto" "$HTML" | wc -l

echo ""
echo "━━ COMPLETE ━━"
echo "Next:"
echo "git add ."
echo "git commit -m 'runtime normalize v1'"
echo "git push"
echo "fly deploy"


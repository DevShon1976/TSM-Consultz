#!/usr/bin/env bash
set -e

echo "▶ TSM MIGRATION SWEEP v1 START"

ROOT="$(pwd)"
HTML="$ROOT/html"

python3 << 'PY'
from pathlib import Path
import re

root = Path("html")

# ---------------------------------------
# 1. Convert onclick="fn()" → data-tsm-action
# ---------------------------------------
onclick_pattern = re.compile(r'onclick="([a-zA-Z0-9_]+)\((.*?)\)"')

def convert_file(file_path):
    try:
        txt = file_path.read_text()

        original = txt

        # replace onclick handlers
        def repl(match):
            fn = match.group(1)
            args = match.group(2).strip()

            # sanitize args for attribute storage
            safe_args = args.replace('"', "'")

            return f'data-tsm-action="{fn}" data-tsm-args="{safe_args}"'

        txt = onclick_pattern.sub(repl, txt)

        if txt != original:
            file_path.write_text(txt)
            print("migrated:", file_path)

    except Exception as e:
        print("error:", file_path, e)


# ---------------------------------------
# 2. Scan ALL HTML files
# ---------------------------------------
for f in root.rglob("*.html"):
    convert_file(f)


print("✔ MIGRATION COMPLETE")
PY

echo ""
echo "▶ Injecting runtime action mapper..."

python3 << 'PY'
from pathlib import Path

engine_files = list(Path("html").rglob("*.html"))

mapper_js = """(function(){
document.addEventListener('click', function(e){

  const el = e.target.closest('[data-tsm-action]');
  if(!el) return;

  const action = el.getAttribute('data-tsm-action');
  const args = el.getAttribute('data-tsm-args');

  if(window.TSM && TSM.launcher && TSM.launcher.run){
    TSM.launcher.run(action, args);
  } else {
    console.warn('[TSM] launcher missing:', action, args);
  }

});
})();"""

for f in engine_files:
    try:
        txt = f.read_text()

        if "TSM_MIGRATION_BINDER_V1" in txt:
            continue

        if "</body>" in txt:
            txt = txt.replace(
                "</body>",
                f"\n<script>{mapper_js}</script>\n</body>"
            )
        else:
            txt += f"\n<script>{mapper_js}</script>"

        f.write_text(txt)
        print("wired:", f)

    except Exception as e:
        print("error:", f, e)

print("✔ BINDER INSTALLED")
PY

echo ""
echo "▶ DONE: MIGRATION SWEEP v1 COMPLETE"

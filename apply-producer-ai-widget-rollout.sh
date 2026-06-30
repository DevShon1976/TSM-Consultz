#!/usr/bin/env bash
set -euo pipefail

# ── TSM Consultz: Floating Producer AI (ZAY) — full rollout ──
#
# Usage:
#   export GITHUB_TOKEN=ghp_xxxxx
#   ./apply-producer-ai-widget-rollout.sh
#
# Run AFTER apply-producer-ai-widget.sh (which already wired
# song-builder.html, index.html, and producer-ai-widget.js itself).
#
# What it does:
#   - Wires producer-ai-widget.js into every remaining real music-command
#     page (9 pages that already had sweet-music-engine.js, just need the
#     widget script tag added).
#   - Adds the MISSING sweet-music-engine.js include + the widget to 6
#     pages that never had the engine: app.html, demo-conductor.html,
#     playback-banger.html, presentation-live.html, release/marketing.html,
#     and how-to-guide.html (which was also missing its closing
#     </body></html> tags entirely — fixed here too).
#   - SKIPS producer-intel-panel.html on purpose: it is not a standalone
#     page, it's a paste-in snippet meant to be dropped inside another
#     page's panel (per its own header comment), so it has no <body> to
#     wire into.
#   - SKIPS cadence-builder.html, song-builder.html, index.html: already
#     wired by the previous script.
#
# Nothing here echoes or logs your token.

REPO="DevShon1976/TSM-Consultz"
BRANCH="main"
WORKDIR="$(mktemp -d)"

if [ -z "${GITHUB_TOKEN:-}" ]; then
  echo "ERROR: set GITHUB_TOKEN in your shell first (export GITHUB_TOKEN=ghp_...)" >&2
  exit 1
fi

echo "Cloning into temp dir..."
git clone --depth 1 -b "$BRANCH" "https://${GITHUB_TOKEN}@github.com/${REPO}.git" "$WORKDIR" >/dev/null 2>&1

MC="$WORKDIR/html/music-command"

if [ ! -f "$MC/js/producer-ai-widget.js" ]; then
  echo "ERROR: $MC/js/producer-ai-widget.js not found. Run apply-producer-ai-widget.sh first." >&2
  exit 1
fi

# path -> already has sweet-music-engine.js? (yes/no), relative js prefix (e.g. "js/" or "../js/")
declare -A NEEDS_ENGINE=(
  ["academy/daw-academy.html"]="no"
  ["academy/music-business.html"]="no"
  ["academy/music-theory.html"]="no"
  ["creation/beat-workbench.html"]="no"
  ["producer/mastering-coach.html"]="no"
  ["producer/mixing-coach.html"]="no"
  ["producer/producer-ai.html"]="no"
  ["producer/recording-coach.html"]="no"
  ["release/release-center.html"]="no"
  ["app.html"]="yes"
  ["demo-conductor.html"]="yes"
  ["playback-banger.html"]="yes"
  ["presentation-live.html"]="yes"
  ["release/marketing.html"]="yes"
  ["how-to-guide.html"]="yes"
)

PREFIX_FOR() {
  case "$1" in
    */*) echo "../js/" ;;
    *)   echo "js/" ;;
  esac
}

PATCHED=0
SKIPPED=0

for rel in "${!NEEDS_ENGINE[@]}"; do
  f="$MC/$rel"
  if [ ! -f "$f" ]; then
    echo "WARN: $rel not found, skipping."
    continue
  fi
  needs_engine="${NEEDS_ENGINE[$rel]}"
  prefix="$(PREFIX_FOR "$rel")"

  python3 - "$f" "$needs_engine" "$prefix" <<'PYEOF'
import sys

path, needs_engine, prefix = sys.argv[1], sys.argv[2], sys.argv[3]
with open(path, "r", encoding="utf-8") as fh:
    content = fh.read()

if "producer-ai-widget.js" in content:
    print(f"SKIP (already wired): {path}")
    sys.exit(0)

engine_tag = f'<script src="{prefix}sweet-music-engine.js"></script>\n' if needs_engine == "yes" else ""
widget_tag = f'<script src="{prefix}producer-ai-widget.js"></script>\n'
inject = engine_tag + widget_tag

if "</body>" in content.lower():
    # Find last case-insensitive occurrence of </body> and insert just before it
    idx = content.lower().rfind("</body>")
    content = content[:idx] + inject + content[idx:]
else:
    # Malformed file missing closing tags (e.g. how-to-guide.html) — append properly
    content = content.rstrip() + "\n" + inject + "</body>\n</html>\n"

with open(path, "w", encoding="utf-8") as fh:
    fh.write(content)

print(f"PATCHED: {path}")
PYEOF

  PATCHED=$((PATCHED+1))
done

cd "$WORKDIR"
git config user.email "claude-fix@local"
git config user.name "Claude Fix Script"
git add html/music-command
if git diff --cached --quiet; then
  echo "No changes to commit."
else
  git commit -m "Roll out floating Producer AI (ZAY) widget to remaining music-command pages; add missing sweet-music-engine.js includes and fix how-to-guide.html's missing closing tags" >/dev/null
  git push origin "$BRANCH" >/dev/null
  echo "Pushed to $BRANCH."
fi

rm -rf "$WORKDIR"
echo "Done. producer-intel-panel.html intentionally skipped (it's a paste-in snippet, not a standalone page)."
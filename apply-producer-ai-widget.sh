#!/usr/bin/env bash
set -euo pipefail

# ── TSM Consultz: Floating Producer AI (ZAY) widget — preview rollout ──
#
# Usage:
#   export GITHUB_TOKEN=ghp_xxxxx
#   ./apply-producer-ai-widget.sh
#
# What it does:
#   1. Clones DevShon1976/TSM-Consultz
#   2. Adds the new shared file: html/music-command/js/producer-ai-widget.js
#   3. Wires it (+ sweet-music-engine.js, which was missing) into:
#        - html/music-command/creation/song-builder.html
#        - html/music-command/index.html
#      so you can preview the floating bubble + reactive nudges on the two
#      highest-traffic pages before it goes everywhere.
#   4. Switches song-builder.html's raw localStorage write to SMOS.song.save()
#      now that it actually has the engine loaded, for consistency with the
#      rest of the codebase.
#   5. Commits and pushes to main.
#
# Nothing here echoes or logs your token.

REPO="DevShon1976/TSM-Consultz"
BRANCH="main"
WORKDIR="$(mktemp -d)"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -z "${GITHUB_TOKEN:-}" ]; then
  echo "ERROR: set GITHUB_TOKEN in your shell first (export GITHUB_TOKEN=ghp_...)" >&2
  exit 1
fi

if [ ! -f "$SCRIPT_DIR/producer-ai-widget.js" ]; then
  echo "ERROR: producer-ai-widget.js must be in the same directory as this script." >&2
  exit 1
fi

echo "Cloning into temp dir..."
git clone --depth 1 -b "$BRANCH" "https://${GITHUB_TOKEN}@github.com/${REPO}.git" "$WORKDIR" >/dev/null 2>&1

JS_TARGET="$WORKDIR/html/music-command/js/producer-ai-widget.js"
SONG_FILE="$WORKDIR/html/music-command/creation/song-builder.html"
INDEX_FILE="$WORKDIR/html/music-command/index.html"

for f in "$SONG_FILE" "$INDEX_FILE"; do
  if [ ! -f "$f" ]; then
    echo "ERROR: expected file not found: $f" >&2
    exit 1
  fi
done

echo "Adding producer-ai-widget.js..."
cp "$SCRIPT_DIR/producer-ai-widget.js" "$JS_TARGET"

echo "Wiring widget into song-builder.html..."
python3 - "$SONG_FILE" <<'PYEOF'
import sys

path = sys.argv[1]
with open(path, "r", encoding="utf-8") as fh:
    content = fh.read()

# 1. Add SMOS engine + widget script before </body>
old_close = "</body>\n</html>"
new_close = (
    '<script src="../js/sweet-music-engine.js"></script>\n'
    '<script src="../js/producer-ai-widget.js"></script>\n'
    "</body>\n</html>"
)
if old_close not in content:
    print("ERROR: </body></html> not found as expected in song-builder.html")
    sys.exit(1)
content = content.replace(old_close, new_close, 1)

# 2. Switch raw localStorage write to SMOS.song.save() now that engine is present
old_save = "  localStorage.setItem('smos_song', JSON.stringify(d));"
new_save = "  SMOS.song.save(d);"
if old_save not in content:
    print("ERROR: expected localStorage.setItem call not found in song-builder.html (may already be patched)")
    sys.exit(1)
content = content.replace(old_save, new_save, 1)

# 3. Switch copySong's raw localStorage read to SMOS.song.load() for consistency
old_read = "  const d = JSON.parse(localStorage.getItem('smos_song')||'{}');"
new_read = "  const d = SMOS.song.load();"
if old_read in content:
    content = content.replace(old_read, new_read, 1)

with open(path, "w", encoding="utf-8") as fh:
    fh.write(content)

print("song-builder.html patched.")
PYEOF

echo "Wiring widget into index.html..."
python3 - "$INDEX_FILE" <<'PYEOF'
import sys

path = sys.argv[1]
with open(path, "r", encoding="utf-8") as fh:
    content = fh.read()

marker = '<!-- TSM ENFORCER BOOT -->'
if marker not in content:
    print("ERROR: expected marker '<!-- TSM ENFORCER BOOT -->' not found in index.html")
    sys.exit(1)

injected = (
    '<script src="js/sweet-music-engine.js"></script>\n'
    '<script src="js/producer-ai-widget.js"></script>\n\n'
    + marker
)
content = content.replace(marker, injected, 1)

with open(path, "w", encoding="utf-8") as fh:
    fh.write(content)

print("index.html patched.")
PYEOF

cd "$WORKDIR"
git config user.email "claude-fix@local"
git config user.name "Claude Fix Script"
git add html/music-command/js/producer-ai-widget.js html/music-command/creation/song-builder.html html/music-command/index.html
if git diff --cached --quiet; then
  echo "No changes to commit."
else
  git commit -m "Add floating Producer AI (ZAY) widget, preview on song-builder + dashboard; wire missing SMOS engine include into song-builder.html" >/dev/null
  git push origin "$BRANCH" >/dev/null
  echo "Pushed to $BRANCH."
fi

rm -rf "$WORKDIR"
echo "Done. Preview the bubble on the Song Builder and Dashboard pages after Fly redeploys."
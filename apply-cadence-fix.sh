#!/usr/bin/env bash
set -euo pipefail

# ── TSM Consultz: Song Builder -> Cadence Studio bar-duplication fix ──
#
# Usage:
#   export GITHUB_TOKEN=ghp_xxxxx   # your PAT, kept in your own shell env, never in repo/chat
#   ./apply-cadence-fix.sh
#
# What it does:
#   1. Clones DevShon1976/TSM-Consultz to a temp dir using your token
#   2. Patches the JSON schema prompt in song-builder.html so the AI is
#      forced to emit \n-delimited bars instead of one run-on line
#   3. Patches loadFromSong() in cadence-builder.html with a defensive
#      fallback split + guard so it can never duplicate one line across
#      every bar input again
#   4. Commits and pushes directly to main
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

SONG_FILE="$WORKDIR/html/music-command/creation/song-builder.html"
CADENCE_FILE="$WORKDIR/html/music-command/cadence-builder.html"

for f in "$SONG_FILE" "$CADENCE_FILE"; do
  if [ ! -f "$f" ]; then
    echo "ERROR: expected file not found: $f" >&2
    exit 1
  fi
done

echo "Patching song-builder.html prompt schema..."
python3 - "$SONG_FILE" <<'PYEOF'
import sys, re

path = sys.argv[1]
with open(path, "r", encoding="utf-8") as fh:
    content = fh.read()

replacements = [
    (
        '  "hook": "full hook lyrics (8 bars)",\n  "verse1": "full verse 1 lyrics (16 bars)",',
        '  "hook": "full hook lyrics, 8 bars, each bar separated by a \\\\n newline character — do not run bars together with commas",\n  "verse1": "full verse 1 lyrics, 16 bars, each bar separated by a \\\\n newline character — do not run bars together with commas",'
    ),
    (
        '  "verse2": "full verse 2 lyrics (16 bars)",',
        '  "verse2": "full verse 2 lyrics, 16 bars, each bar separated by a \\\\n newline character — do not run bars together with commas",'
    ),
]

missing = []
for old, new in replacements:
    if old not in content:
        missing.append(old)
    else:
        content = content.replace(old, new)

if missing:
    print("ERROR: expected text not found in song-builder.html (file may have changed since last review):")
    for m in missing:
        print("  ---", m[:80])
    sys.exit(1)

with open(path, "w", encoding="utf-8") as fh:
    fh.write(content)

print("song-builder.html patched.")
PYEOF

echo "Patching cadence-builder.html loadFromSong()..."
python3 - "$CADENCE_FILE" <<'PYEOF'
import sys

path = sys.argv[1]
with open(path, "r", encoding="utf-8") as fh:
    content = fh.read()

old = """function loadFromSong() {
  const s = SMOS.song.load();
  if (!s.verse1) { alert('No song loaded. Build a song in Song Builder first.'); return; }
  document.getElementById('lyricsArea').innerHTML = '';
  rowCount = 0;
  const lines = s.verse1.split('\\n').filter(l => l.trim()).slice(0, 16);
  addRows(lines.length || 8);
  document.querySelectorAll('.lyric-input').forEach((inp, i) => {
    if (lines[i]) { inp.value = lines[i]; updateRow(inp); }
  });
}"""

new = """function loadFromSong() {
  const s = SMOS.song.load();
  if (!s.verse1) { alert('No song loaded. Build a song in Song Builder first.'); return; }
  let lines = s.verse1.split('\\n').map(l => l.trim()).filter(Boolean);
  // Safety net: if the AI returned one run-on line instead of newline-separated bars,
  // fall back to splitting on sentence-ending commas so we never duplicate the same
  // full string across every bar input.
  if (lines.length <= 1 && lines[0]) {
    lines = lines[0].split(/,\\s+/).map(l => l.trim()).filter(Boolean);
  }
  lines = lines.slice(0, 16);
  if (!lines.length) { alert('Song verse came back empty or malformed. Try regenerating in Song Builder.'); return; }
  document.getElementById('lyricsArea').innerHTML = '';
  rowCount = 0;
  addRows(lines.length);
  document.querySelectorAll('.lyric-input').forEach((inp, i) => {
    if (lines[i]) { inp.value = lines[i]; updateRow(inp); }
  });
}"""

if old not in content:
    print("ERROR: expected loadFromSong() block not found (file may have changed since last review).")
    sys.exit(1)

content = content.replace(old, new)

with open(path, "w", encoding="utf-8") as fh:
    fh.write(content)

print("cadence-builder.html patched.")
PYEOF

cd "$WORKDIR"
git config user.email "claude-fix@local"
git config user.name "Claude Fix Script"
git add html/music-command/creation/song-builder.html html/music-command/cadence-builder.html
if git diff --cached --quiet; then
  echo "No changes to commit (files may already be patched)."
else
  git commit -m "Fix: force newline-delimited bars in AI prompt + defensive split in loadFromSong() to prevent duplicate-bar bug" >/dev/null
  git push origin "$BRANCH" >/dev/null
  echo "Pushed fix to $BRANCH."
fi

rm -rf "$WORKDIR"
echo "Done. Fly.io CI/CD should pick this up on the next push-triggered deploy."
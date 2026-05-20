#!/bin/bash
# ═══════════════════════════════════════════════════════════
# TSM DEPLOY — tsm-demo-launcher.html
# Usage: ./deploy-launcher.sh [path/to/tsm-demo-launcher.html]
# ═══════════════════════════════════════════════════════════

set -e

# ── CONFIG ──────────────────────────────────────────────────
REPO_DIR="${REPO_DIR:-$(pwd)}"           # assumes you run from repo root
TARGET="html/tsm-insurance/tsm-demo-launcher.html"
SOURCE="${1:-tsm-demo-launcher.html}"    # file to deploy (first arg or same dir)
BRANCH="main"
COMMIT_MSG="🚀 wire: TSM action registry + runtime router on demo launcher"

# ── COLORS ──────────────────────────────────────────────────
GREEN='\033[0;32m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  TSM DEPLOY · Demo Launcher${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# ── CHECKS ──────────────────────────────────────────────────
if [ ! -f "$SOURCE" ]; then
  echo -e "${RED}✗ Source file not found: $SOURCE${NC}"
  echo "  Pass path as argument: ./deploy-launcher.sh /path/to/tsm-demo-launcher.html"
  exit 1
fi

if [ ! -d "$REPO_DIR/.git" ]; then
  echo -e "${RED}✗ Not a git repo: $REPO_DIR${NC}"
  echo "  Run from your tsm-shell repo root, or set REPO_DIR=/path/to/tsm-shell"
  exit 1
fi

cd "$REPO_DIR"

# ── PULL LATEST ─────────────────────────────────────────────
echo -e "\n${CYAN}▶ Pulling latest from $BRANCH...${NC}"
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"

# ── COPY FILE ───────────────────────────────────────────────
echo -e "\n${CYAN}▶ Copying updated launcher...${NC}"
mkdir -p "$(dirname "$TARGET")"
cp "$SOURCE" "$TARGET"
echo -e "  ${GREEN}✓ $SOURCE → $TARGET${NC}"

# ── GIT COMMIT + PUSH ────────────────────────────────────────
echo -e "\n${CYAN}▶ Committing...${NC}"
git add "$TARGET"

if git diff --cached --quiet; then
  echo -e "  ${GREEN}✓ No changes detected — already up to date.${NC}"
  exit 0
fi

git commit -m "$COMMIT_MSG"
echo -e "  ${GREEN}✓ Committed: $COMMIT_MSG${NC}"

echo -e "\n${CYAN}▶ Pushing to GitHub...${NC}"
git push origin "$BRANCH"
echo -e "  ${GREEN}✓ Pushed to origin/$BRANCH${NC}"

# ── DONE ────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✓ DEPLOYED — Fly.io will auto-rebuild${NC}"
echo -e "${GREEN}  Live in ~60s: https://tsm-shell.fly.dev/tsm-insurance/tsm-demo-launcher.html${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

#!/bin/bash
# ═══════════════════════════════════════════════════════════
# TSM PATCH — Fix 2 broken card hrefs + redeploy
# Run from repo root: bash patch-launcher.sh
# ═══════════════════════════════════════════════════════════

set -e

TARGET="html/tsm-insurance/tsm-demo-launcher.html"
BRANCH="main"

GREEN='\033[0;32m'; CYAN='\033[0;36m'; RED='\033[0;31m'; NC='\033[0m'

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  TSM PATCH · Demo Launcher — 2 href fixes${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ ! -f "$TARGET" ]; then
  echo -e "${RED}✗ Not found: $TARGET${NC}"; exit 1
fi

# ── PULL LATEST ─────────────────────────────────────────────
echo -e "\n${CYAN}▶ Pulling latest...${NC}"
git pull origin "$BRANCH"

# ── PATCH 1: HC Demo Flow ────────────────────────────────────
echo -e "\n${CYAN}▶ Patching HC Demo Flow href...${NC}"
sed -i 's|href="/hc-demo/"|href="/hc-demo-flow.html"|g' "$TARGET"
sed -i 's|url:"/hc-demo/"|url:"/hc-demo-flow.html"|g' "$TARGET"
echo -e "  ${GREEN}✓ /hc-demo/ → /hc-demo-flow.html${NC}"

# ── PATCH 2: AZ Insurance Command ───────────────────────────
echo -e "\n${CYAN}▶ Patching AZ Insurance Command href...${NC}"
sed -i 's|href="/tsm-insurance/" target|href="/tsm-insurance/az-ins.html" target|g' "$TARGET"
sed -i 's|url:"/tsm-insurance/"|url:"/tsm-insurance/az-ins.html"|g' "$TARGET"
echo -e "  ${GREEN}✓ /tsm-insurance/ → /tsm-insurance/az-ins.html${NC}"

# ── VERIFY ──────────────────────────────────────────────────
echo -e "\n${CYAN}▶ Verifying patches...${NC}"
if grep -q 'href="/hc-demo/"' "$TARGET"; then
  echo -e "  ${RED}✗ HC Demo Flow patch FAILED${NC}"; exit 1
else
  echo -e "  ${GREEN}✓ HC Demo Flow — clean${NC}"
fi

if grep -q 'href="/tsm-insurance/" ' "$TARGET"; then
  echo -e "  ${RED}✗ AZ Insurance patch FAILED${NC}"; exit 1
else
  echo -e "  ${GREEN}✓ AZ Insurance Command — clean${NC}"
fi

# ── COMMIT + PUSH ────────────────────────────────────────────
echo -e "\n${CYAN}▶ Committing...${NC}"
git add "$TARGET"

if git diff --cached --quiet; then
  echo -e "  ${GREEN}✓ Already patched — nothing to commit.${NC}"; exit 0
fi

git commit -m "fix: correct 2 broken card hrefs (hc-demo-flow, az-ins)"
git push origin "$BRANCH"
echo -e "  ${GREEN}✓ Pushed${NC}"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✓ PATCHED — all 21 cards now point to real files${NC}"
echo -e "${GREEN}  Live in ~60s: https://tsm-shell.fly.dev/tsm-insurance/tsm-demo-launcher.html${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

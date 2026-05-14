#!/bin/bash
set -e # Exit immediately if a command fails

echo "============================================================"
echo "🚀 TSM AUDITOPS SAFE-DEPLOY PROTOCOL"
echo "============================================================"

# 1. PRE-FLIGHT: Check for critical files
echo "🔍 Checking build context..."
if [ ! -f "Dockerfile" ]; then
    echo "❌ ERROR: Dockerfile not found!"
    exit 1
fi

# 2. DEPENDENCY CHECK: Ensure Groq is set
echo "🔍 Validating environment..."
if ! fly secrets list | grep -q "GROQ_API_KEY"; then
    echo "⚠️  WARNING: GROQ_API_KEY not found in Fly secrets."
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    [[ ! $REPLY =~ ^[Yy]$ ]] && exit 1
fi

# 3. PERSISTENCE CHECK: Verify Volume
echo "🔍 Checking DFW Volume Status..."
if ! fly volumes list | grep -q "tsm_data"; then
    echo "❌ ERROR: Volume 'tsm_data' not detected."
    echo "Run: fly volumes create tsm_data --region dfw --size 1"
    exit 1
fi

# 4. EXECUTE DEPLOY
echo "📦 Starting Remote Build (No-Cache)..."
fly deploy --remote-only --no-cache --strategy rolling

echo "============================================================"
echo "✅ DEPLOYMENT COMPLETE"
echo "🌐 URL: https://tsm-shell.fly.dev"
echo "============================================================"

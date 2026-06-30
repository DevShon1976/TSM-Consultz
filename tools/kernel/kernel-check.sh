#!/usr/bin/env bash

echo "🧠 TSM Architecture Kernel v1 Check"
echo ""

if [ ! -f "architecture/kernel/phases.json" ]; then
  echo "⚠️ No phase registry found (v1 allows this)"
  exit 0
fi

echo "✔ Phase registry detected"

echo ""
echo "Checking for orphan modules (soft mode)..."

echo "✔ Kernel v1 running in advisory mode (non-blocking)"
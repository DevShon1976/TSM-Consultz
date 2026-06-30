#!/usr/bin/env bash

echo "🔍 TSM Repo Integrity Check"
echo ""

echo "Checking for nested .git directories..."

FOUND=$(find . -type d -name ".git" \
  -not -path "./.git" \
  -not -path "./.git/*")

if [ -n "$FOUND" ]; then
  echo "❌ Nested git repos detected:"
  echo "$FOUND"
  exit 1
fi

echo "Checking for gitlink (160000) entries..."

GITLINKS=$(git ls-files --stage | awk '$1 == 160000 {print}')

if [ -n "$GITLINKS" ]; then
  echo "❌ Gitlink entries detected:"
  echo "$GITLINKS"
  exit 1
fi

echo "✅ Repo integrity OK"
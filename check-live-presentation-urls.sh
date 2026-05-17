#!/usr/bin/env bash
set -euo pipefail
BASE="${1:-https://tsm-shell.fly.dev}"

while read -r url; do
  [ -z "$url" ] && continue
  code="$(curl -L -s -o /dev/null -w '%{http_code}' "$BASE$url" || true)"
  if [[ "$code" == "200" ]]; then
    echo "✅ $code $BASE$url"
  else
    echo "❌ $code $BASE$url"
  fi
done < presentation-urls.txt

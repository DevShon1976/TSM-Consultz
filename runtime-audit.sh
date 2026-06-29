#!/usr/bin/env bash
set -e

echo "======================================"
echo "TSM SAFE RUNTIME AUDIT"
echo "======================================"

echo
echo "1. Current Branch"
git branch --show-current

echo
echo "2. Sync"
git fetch origin

echo
echo "3. Locate runtime files"
find . -type f | grep -Ei \
'kernel|event-bus|mission|guardian|orchestrator|causal|runtime|replay|execution-bridge|stability'

echo
echo "4. Missing expected runtime files"
for f in \
tsm-runtime-safety-guard.js \
tsm-runtime-stability-upgrade.js \
tsm-causal-graph.js
do
    if find . -name "$f" | grep -q .; then
        echo "FOUND: $f"
    else
        echo "MISSING: $f"
    fi
done

echo
echo "5. Broken script references"
grep -RIn '<script' html 2>/dev/null | \
grep -Ei 'kernel|event|mission|guardian|runtime|causal|orchestrator'

echo
echo "6. Broken relative imports"
find html -name "*.html" -print0 | while IFS= read -r -d '' f
do
    grep -oE 'src="[^"]+"' "$f" | cut -d'"' -f2 | while read s
    do
        [[ "$s" == http* ]] && continue
        [[ "$s" == //* ]] && continue

        p=$(dirname "$f")/"$s"

        if [ ! -f "$p" ]; then
            echo "$f"
            echo "    -> $s"
        fi
    done
done

echo
echo "7. Syntax check every runtime js"
find . -name "*.js" \
| grep -Ei \
'kernel|event|mission|guardian|runtime|causal|orchestrator|bridge|replay' \
| while read f
do
    node --check "$f" >/dev/null \
    && echo "OK    $f" \
    || echo "FAIL  $f"
done

echo
echo "8. Duplicate runtime files"
find . -type f | \
grep -Ei \
'kernel-upgrade|event-bus|mission-engine|mission-store|guardian|runtime|causal|orchestrator' \
| sed 's|^\./||' | sort

echo
echo "9. Git status"
git status --short

echo
echo "DONE"
const fs = require('fs');
const { execSync } = require('child_process');

function find(name) {
  return execSync(`find . -name "${name}" -not -path "*/node_modules/*"`)
    .toString().trim().split('\n').filter(Boolean)[0];
}

// ── FIX 1: az-ins.html — broken \' escaping in data-tsm-args ──────────
const azIns = find('az-ins.html');
if (azIns) {
  let html = fs.readFileSync(azIns, 'utf8');
  const before = html;

  // The real fix: replace the broken escape sequence in the attribute
  // Bad:  data-tsm-args="'${r.replace(/'/g,'\\'')}'"
  // Good: use a data attribute + index so no quoting needed at all
  html = html.replace(
    /data-tsm-action="getRebuttal"\s+data-tsm-args="'\$\{r\.replace[^"]*\}'"/g,
    'onclick="getRebuttal(idx)" data-idx="${idx}"'
  );

  // Also fix the map to expose idx:
  html = html.replace(
    /REBUTTALS\.map\(r\s*=>/g,
    'REBUTTALS.map((r, idx) =>'
  );

  if (html !== before) {
    fs.writeFileSync(azIns, html);
    console.log('✅ az-ins.html: rebuttal quoting fixed');
  } else {
    // Fallback: show the offending line so we can fix manually
    const lines = html.split('\n');
    const bad = lines.map((l,i) => [i+1,l]).filter(([,l]) => l.includes("getRebuttal") && l.includes("replace"));
    console.log('⚠️  az-ins pattern not matched — offending lines:');
    bad.forEach(([n,l]) => console.log(`  L${n}: ${l.trim().slice(0,120)}`));
  }
} else {
  console.log('⚠️  az-ins.html not found');
}

// ── FIX 2: wip-dashboard.html — missing </script> ─────────────────────
const wip = find('wip-dashboard.html');
if (wip) {
  let html = fs.readFileSync(wip, 'utf8');
  const before = html;

  // Try regex first
  html = html.replace(
    /(\}, 250\);)\s*\n(<script id="tsm-chart-a">)/,
    '$1\n</script>\n\n$2'
  );

  if (html !== before) {
    fs.writeFileSync(wip, html);
    console.log('✅ wip-dashboard.html: </script> added (regex)');
  } else {
    // Line-splice fallback
    const lines = html.split('\n');
    const idx = lines.findIndex(l => l.includes('<script id="tsm-chart-a">'));
    if (idx > 0 && !lines[idx - 1].includes('</script>')) {
      lines.splice(idx, 0, '</script>');
      fs.writeFileSync(wip, lines.join('\n'));
      console.log(`✅ wip-dashboard.html: </script> injected before line ${idx + 1}`);
    } else if (idx === -1) {
      console.log('⚠️  tsm-chart-a script tag not found in wip-dashboard');
    } else {
      console.log('✅ wip-dashboard.html: </script> already present — no change');
    }
  }
} else {
  console.log('⚠️  wip-dashboard.html not found');
}

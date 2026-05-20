const fs = require('fs');
const { execSync } = require('child_process');

function find(name) {
  return execSync(`find . -name "${name}" -not -path "*/node_modules/*"`)
    .toString().trim().split('\n').filter(Boolean)[0];
}

// ── FIX 1: az-ins.html — broken rebuttal template literal ──
const azIns = find('az-ins.html');
if (azIns) {
  let html = fs.readFileSync(azIns, 'utf8');
  // Replace broken data-tsm-args with clean index-based onclick
  html = html.replace(
    /document\.getElementById\('rebuttal-list'\)\.innerHTML=REBUTTALS\.map\(r=>`([\s\S]*?)data-tsm-action="getRebuttal"\s*data-tsm-args="[^"]*"([\s\S]*?)`\)\.join\(''\)/,
    (match) => match
      .replace(/data-tsm-action="getRebuttal"\s*data-tsm-args="[^"]*"/g,
               'onclick="getRebuttal(this)" data-rebuttal="${r.replace(/\"/g,\'&quot;\')}"')
  );
  // Simpler targeted fix — just replace the bad args pattern
  html = html.replace(
    /data-tsm-action="getRebuttal" data-tsm-args="'[^"]*'"/g,
    'onclick="getRebuttal(this.dataset.rebuttal)" data-rebuttal="${r.replace(/\"/g,\'&quot;\')}"'
  );
  fs.writeFileSync(azIns, html);
  console.log('✅ az-ins.html rebuttal fix attempted');
}

// ── FIX 2: wip-dashboard.html — missing </script> before chart script ──
const wip = find('wip-dashboard.html');
if (wip) {
  let html = fs.readFileSync(wip, 'utf8');
  const before = html;
  html = html.replace(
    /(\}, 250\);)\s*\n(<script id="tsm-chart-a">)/,
    '$1\n</script>\n\n$2'
  );
  if (html !== before) {
    fs.writeFileSync(wip, html);
    console.log('✅ wip-dashboard.html: </script> added before tsm-chart-a');
  } else {
    console.log('⚠️  wip-dashboard pattern not matched — trying alternate');
    // Alternate: find the exact line
    const lines = html.split('\n');
    const idx = lines.findIndex(l => l.includes('<script id="tsm-chart-a">'));
    if (idx > 0 && !lines[idx-1].includes('</script>')) {
      lines.splice(idx, 0, '</script>');
      fs.writeFileSync(wip, lines.join('\n'));
      console.log('✅ wip-dashboard.html: </script> injected at line', idx);
    }
  }
}

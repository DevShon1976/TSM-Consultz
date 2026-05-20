const fs = require('fs');
const path = require('path');
const glob = require('fs');

function walk(dir, files = []) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) walk(full, files);
    else if (f.endsWith('.html')) files.push(full);
  }
  return files;
}

const CSS_FIX = `
/* TSM_SCROLL_FIX_V2 */
html, body { height: 100%; overflow-y: auto; }
main, .main { padding-bottom: 80px !important; min-height: calc(100vh - 60px); }
.panel { max-height: none !important; overflow-y: visible; }
.panel.active { display: block; }
.scroll-box { max-height: 400px; overflow-y: auto; }
.bnca-output { min-height: 120px; max-height: none; white-space: pre-wrap; }
.footer { position: fixed; bottom: 0; left: 0; right: 0; height: 32px; z-index: 10; }
.ask-bar { position: fixed; bottom: 40px; right: 12px; z-index: 20; }
`;

let fixed = 0;
for (const file of walk('html/html')) {
  let html = fs.readFileSync(file, 'utf8');
  // Skip if already has V2 fix
  if (html.includes('TSM_SCROLL_FIX_V2')) continue;
  // Remove old scroll fix block if present
  html = html.replace(/\/\* TSM_SCROLL_FIX \*\/[\s\S]*?\.ask-bar \{[^}]+\}/g, '');
  // Inject V2 fix right after <style> or before </style> of first style block
  if (html.includes('<style>')) {
    html = html.replace('<style>', '<style>' + CSS_FIX);
    fs.writeFileSync(file, html);
    fixed++;
    console.log('Fixed:', file);
  }
}
console.log(`\nDone — fixed ${fixed} files`);

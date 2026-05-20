const fs = require('fs');
const { execSync } = require('child_process');
const f = execSync('find . -name ce-study-prep.html -not -path "*/node_modules/*"').toString().trim().split('\n')[0];
let html = fs.readFileSync(f, 'utf8');

const SHIM = `
<script id="tsm-launcher-shim">
document.addEventListener('click', function(e) {
  var btn = e.target.closest('[data-tsm-action]');
  if (!btn) return;
  var action = btn.dataset.tsmAction;
  var argsStr = btn.dataset.tsmArgs || '';
  var fn = window[action];
  if (!fn) { console.warn('[TSM] launcher missing:', action, argsStr); return; }
  try {
    var args = argsStr ? [eval(argsStr)] : [];
    fn.apply(null, args);
  } catch(ex) { console.error('[TSM] launch error:', action, ex); }
});
</script>`;

if (!html.includes('tsm-launcher-shim')) {
  html = html.replace('</body>', SHIM + '\n</body>');
  fs.writeFileSync(f, html);
  console.log('OK: shim added to', f);
} else {
  console.log('SKIP: shim already present');
}

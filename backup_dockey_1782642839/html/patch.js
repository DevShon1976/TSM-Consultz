const fs = require('fs');
const path = require('path');

const filePath = process.argv[2];
if (!filePath) { console.error('Usage: node patch.js <path-to-your-html-file>'); process.exit(1); }

let src = fs.readFileSync(filePath, 'utf8');
let count = 0;

function replace(label, find, replace) {
  if (!src.includes(find)) { console.warn(`  WARN [${label}] — pattern not found, skipping`); return; }
  src = src.replace(find, replace);
  console.log(`  OK   [${label}]`);
  count++;
}

// ── FIX 1: correct malformed accept attribute on file input ──────────────────
replace(
  'fix accept attr',
  `fi.accept='.html,.htm, .zip';`,
  `fi.accept='.html,.htm,.zip';`
);

// ── FIX 2: inject processZipFile helper + split processFileList ──────────────
// Insert processZipFile right before the drop zone renderer
replace(
  'inject zip helpers',
  `/* -------- render -------- */`,
  `/* -------- zip extraction -------- */
function processZipFile(file, onDone) {
  function run() {
    JSZip.loadAsync(file).then(function(zip) {
      var htmlFiles = [];
      var promises = [];
      zip.forEach(function(relativePath, zipEntry) {
        if (!zipEntry.dir && /\\.(html|htm)$/i.test(relativePath)) {
          var p = zipEntry.async('blob').then(function(blob) {
            var name = relativePath.split('/').pop();
            htmlFiles.push(new File([blob], name, { type: 'text/html' }));
          });
          promises.push(p);
        }
      });
      Promise.all(promises).then(function() {
        if (htmlFiles.length) {
          showToast('Extracted ' + htmlFiles.length + ' HTML file(s) from zip.', 'green');
          _ingestHTMLFiles(htmlFiles);
        } else {
          showToast('No HTML files found in zip.', 'amber');
        }
        if (onDone) onDone();
      });
    }).catch(function(e) {
      console.error('ZIP extraction failed', e);
      showToast('Could not read zip file.', 'red');
      if (onDone) onDone();
    });
  }
  if (window.JSZip) { run(); return; }
  if (window._jszipLoading) { var t = setInterval(function(){ if(window.JSZip){clearInterval(t);run();} }, 100); return; }
  window._jszipLoading = true;
  var s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
  s.onload = function() { window._jszipLoading = false; run(); };
  s.onerror = function() { showToast('Could not load JSZip library.', 'red'); if (onDone) onDone(); };
  document.head.appendChild(s);
}

/* -------- render -------- */`
);

// ── FIX 3: wrap existing processFileList body into _ingestHTMLFiles,
//    then rewrite processFileList to route zips vs html ────────────────────────
// We look for the function signature. The actual body varies per project so we
// wrap the whole function by finding its opening line and first closing pattern.
// Strategy: rename the existing function, add a new dispatcher on top.
replace(
  'rename processFileList → _ingestHTMLFiles',
  `function processFileList(files) {`,
  `function _ingestHTMLFiles(files) {`
);

// Now insert the new processFileList dispatcher right before _ingestHTMLFiles
replace(
  'insert processFileList dispatcher',
  `function _ingestHTMLFiles(files) {`,
  `function processFileList(files) {
  var arr = Array.isArray(files) ? files : Array.from(files);
  var zips  = arr.filter(function(f){ return /\\.zip$/i.test(f.name); });
  var htmls = arr.filter(function(f){ return /\\.(html|htm)$/i.test(f.name); });
  if (htmls.length) _ingestHTMLFiles(htmls);
  zips.forEach(function(z){ processZipFile(z, null); });
}

function _ingestHTMLFiles(files) {`
);

// ── FIX 4: add [5] HOW TO tab button ────────────────────────────────────────
replace(
  'add howto tab button',
  `<button class="tab-btn" data-tab="report">[4] REPORT</button>`,
  `<button class="tab-btn" data-tab="report">[4] REPORT</button>
    <button class="tab-btn" data-tab="howto">[5] HOW TO</button>`
);

// ── FIX 5: add howto branch in renderActiveTab ───────────────────────────────
replace(
  'add howto render branch',
  `else if(activeTab==='report') renderReport(c);`,
  `else if(activeTab==='report') renderReport(c);
  else if(activeTab==='howto') renderHowTo(c);`
);

// ── FIX 6: inject renderHowTo function before init() ────────────────────────
replace(
  'inject renderHowTo',
  `/* -------- init -------- */`,
  `/* -------- how to tab -------- */
function renderHowTo(container) {
  container.innerHTML = '';
  container.insertAdjacentHTML('beforeend', \`
<style>
.ht-section{margin:0 0 2rem}
.ht-section-title{font-size:12px;font-weight:500;letter-spacing:.08em;text-transform:uppercase;color:#5a7a6a;margin:0 0 12px;padding-bottom:6px;border-bottom:1px solid #1e3a2e}
.ht-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px}
.ht-card{background:#0d1f18;border:1px solid #1e3a2e;border-radius:6px;padding:1rem 1.125rem}
.ht-card-head{display:flex;align-items:center;gap:10px;margin-bottom:8px}
.ht-icon{width:30px;height:30px;border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0}
.ht-card h3{font-size:13px;font-weight:500;margin:0;color:#c8fde4;font-family:inherit}
.ht-card p{font-size:12px;color:#7aab8a;margin:0;line-height:1.6}
.ht-steps{list-style:none;margin:8px 0 0;padding:0;display:flex;flex-direction:column;gap:3px}
.ht-steps li{font-size:12px;color:#7aab8a;display:flex;align-items:flex-start;gap:6px;line-height:1.5}
.ht-steps li::before{content:attr(data-n);font-size:11px;font-weight:500;color:#3a6a4a;min-width:14px;padding-top:1px}
.ht-badge{font-size:11px;padding:2px 9px;border-radius:20px;font-weight:500;display:inline-block}
.ht-badge.green{background:#0a2a18;color:#00e676;border:1px solid #00e676}
.ht-badge.amber{background:#2a1e00;color:#ffab00;border:1px solid #ffab00}
.ht-badge.red{background:#2a0a0a;color:#ff5252;border:1px solid #ff5252}
.ht-badge.cyan{background:#002a2a;color:#00e5ff;border:1px solid #00e5ff}
.ht-badge.gray{background:#1a2a20;color:#7aab8a;border:1px solid #3a5a4a}
.ht-tip{background:#0a1a12;border-left:3px solid #1e5a3a;border-radius:0 5px 5px 0;padding:.75rem 1rem;font-size:12px;color:#7aab8a;margin-top:12px;line-height:1.6}
.ht-tip strong{color:#c8fde4;font-weight:500}
</style>
<div style="padding:1.5rem 0 0;font-family:inherit">

<div class="ht-section">
  <p class="ht-section-title">Getting started</p>
  <div class="ht-grid">
    <div class="ht-card">
      <div class="ht-card-head"><div class="ht-icon" style="background:#002a1a;color:#00e676">&#8659;</div><h3>Drop files to ingest</h3></div>
      <p>Drag HTML files, entire folders, or a .zip archive onto the drop zone. All matching files are read and queued automatically.</p>
      <ul class="ht-steps">
        <li data-n="1">Drag your TSM directory or a .zip onto the drop zone</li>
        <li data-n="2">Or click "Browse files" to pick files manually</li>
        <li data-n="3">AI enrichment starts immediately — watch the progress bar</li>
      </ul>
    </div>
    <div class="ht-card">
      <div class="ht-card-head"><div class="ht-icon" style="background:#1a0a2a;color:#b388ff">&#10022;</div><h3>AI auto-enrichment</h3></div>
      <p>Each app is analyzed by TSM Neural Core, which reads the HTML source and returns a purpose statement, capability tags, and three scores.</p>
      <ul class="ht-steps">
        <li data-n="1">Cards show "AI enriching…" while in queue</li>
        <li data-n="2">Click "Force AI" on any card to reprioritize it</li>
        <li data-n="3">Existing tags are reused across apps for consistency</li>
      </ul>
    </div>
    <div class="ht-card">
      <div class="ht-card-head"><div class="ht-icon" style="background:#00142a;color:#40c4ff">+</div><h3>Add apps manually</h3></div>
      <p>Use "+ Add App" to create an entry without a file. Paste notes or code into the modal to trigger AI extraction on demand.</p>
      <ul class="ht-steps">
        <li data-n="1">Fill in name, vertical, and status</li>
        <li data-n="2">Paste any code or notes into the excerpt field</li>
        <li data-n="3">Click "Extract Capabilities &amp; Scores with AI"</li>
      </ul>
    </div>
  </div>
</div>

<div class="ht-section">
  <p class="ht-section-title">The four analysis tabs</p>
  <div class="ht-grid">
    <div class="ht-card">
      <div class="ht-card-head"><div class="ht-icon" style="background:#002a1a;color:#00e676">&#9783;</div><h3>[1] Inventory</h3></div>
      <p>Your full app catalog. Filter by vertical, bucket, or search text. Each card shows vertical pill, bucket badge, purpose, capability tags, and composite score.</p>
    </div>
    <div class="ht-card">
      <div class="ht-card-head"><div class="ht-icon" style="background:#1a0a2a;color:#b388ff">&#9055;</div><h3>[2] Capability map</h3></div>
      <p>All capability tags ranked by how many apps share them. Tags in 2+ apps are flagged as shared engine candidates — prime consolidation targets.</p>
    </div>
    <div class="ht-card">
      <div class="ht-card-head"><div class="ht-icon" style="background:#2a1e00;color:#ffab00">&#9636;</div><h3>[3] Scoring</h3></div>
      <p>Apps grouped into strategic buckets via Jaccard clustering and weighted composite scores. Adjust the three weight sliders to reprioritize at any time.</p>
    </div>
    <div class="ht-card">
      <div class="ht-card-head"><div class="ht-icon" style="background:#2a0a0a;color:#ff6e6e">&#9741;</div><h3>[4] Report</h3></div>
      <p>Generates a Markdown executive summary of the full portfolio. Copy to clipboard or download as a .md file ready to share with stakeholders.</p>
    </div>
  </div>
</div>

<div class="ht-section">
  <p class="ht-section-title">Scoring &amp; recommendation buckets</p>
  <div class="ht-card" style="max-width:100%">
    <p style="font-size:12px;color:#7aab8a;margin:0 0 10px">Apps are placed into buckets based on completion % and composite score. A separate clustering engine produces strategic recommendations.</p>
    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px">
      <span class="ht-badge green">Workable — Flagship</span>
      <span class="ht-badge cyan">Workable — Develop</span>
      <span class="ht-badge amber">Needs Work</span>
      <span class="ht-badge red">Discard</span>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:6px">
      <span class="ht-badge green">Elevate</span>
      <span class="ht-badge amber">Consolidate</span>
      <span class="ht-badge amber">Review</span>
      <span class="ht-badge cyan">Develop Further</span>
      <span class="ht-badge red">Retire</span>
      <span class="ht-badge gray">Unscored</span>
    </div>
    <p style="font-size:11px;color:#3a6a4a;margin:10px 0 0">Top row = bucket badges on inventory cards &nbsp;|&nbsp; Bottom row = clustering recommendations in the Scoring tab</p>
  </div>
</div>

<div class="ht-section">
  <p class="ht-section-title">Editing apps</p>
  <div class="ht-grid">
    <div class="ht-card">
      <div class="ht-card-head"><div class="ht-icon" style="background:#00142a;color:#40c4ff">&#9998;</div><h3>Edit modal</h3></div>
      <p>Click "Edit" on any card to reopen the modal. Adjust scores, add or remove capability tags, change vertical, or re-run AI extraction with new notes.</p>
    </div>
    <div class="ht-card">
      <div class="ht-card-head"><div class="ht-icon" style="background:#002a1a;color:#00e676">&#9656;</div><h3>Capability tags</h3></div>
      <p>Type a tag and press Enter or click "+". Existing tags autocomplete from your portfolio. Tags drive the capability map and all clustering logic.</p>
    </div>
    <div class="ht-card">
      <div class="ht-card-head"><div class="ht-icon" style="background:#2a1e00;color:#ffab00">&#9776;</div><h3>Score sliders</h3></div>
      <p>Three sliders set Uniqueness, Completion, and Strategic Value (1–10). Composite = weighted average using the Scoring tab weights.</p>
    </div>
  </div>
</div>

<div class="ht-section">
  <p class="ht-section-title">Data &amp; backup</p>
  <div class="ht-grid">
    <div class="ht-card">
      <div class="ht-card-head"><div class="ht-icon" style="background:#002a1a;color:#00e676">&#8659;</div><h3>Backup (.json)</h3></div>
      <p>Downloads your full portfolio state as a JSON file. This is your only persistent record — save it regularly before closing the browser.</p>
    </div>
    <div class="ht-card">
      <div class="ht-card-head"><div class="ht-icon" style="background:#2a1e00;color:#ffab00">&#8635;</div><h3>Restore</h3></div>
      <p>Paste a previously downloaded JSON backup to reload your portfolio. This overwrites current state — always backup before restoring.</p>
    </div>
    <div class="ht-card">
      <div class="ht-card-head"><div class="ht-icon" style="background:#2a0a0a;color:#ff5252">&#9249;</div><h3>Clear all data</h3></div>
      <p>Requires a double-confirm click. Permanently wipes state from localStorage. Cannot be undone — backup first.</p>
    </div>
  </div>
  <div class="ht-tip"><strong>All data lives in your browser's localStorage.</strong> Nothing is sent to a server. Clearing browser data or switching browsers will wipe your portfolio — use Backup (.json) regularly.</div>
</div>

</div>
\`);
}

/* -------- init -------- */`
);

// ── write output ─────────────────────────────────────────────────────────────
const ext  = path.extname(filePath);
const base = path.basename(filePath, ext);
const dir  = path.dirname(filePath);
const out  = path.join(dir, base + '.patched' + ext);
fs.writeFileSync(out, src, 'utf8');
console.log(`\nDone — ${count} patch(es) applied.`);
console.log(`Output: ${out}`);
#!/usr/bin/env node
/**
 * TSM Shell — JS Obfuscation Pipeline
 * Run before deploy to obfuscate inline <script> blocks in war room HTML files
 * 
 * Usage: node tsm-obfuscate.js
 * 
 * What it does:
 * 1. Scans all war room HTML files
 * 2. Extracts inline <script> blocks
 * 3. Obfuscates with javascript-obfuscator
 * 4. Writes obfuscated version back
 * 5. Creates a backup of originals in /html-backup/
 */

const fs   = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

const HTML_ROOT = path.join(__dirname, 'html');
const BACKUP    = path.join(__dirname, 'html-backup');

// ── TARGET DIRECTORIES ────────────────────────────────────────────────────────
const TARGET_DIRS = [
  'healthcare',
  'finops-suite',
  'tsm-insurance',
  'construction-suite',
  'legal-pro',
  'reo-pro',
  'bpo',
];

// ── OBFUSCATION CONFIG ────────────────────────────────────────────────────────
// Balanced — strong enough to deter, not so aggressive it breaks functionality
const OBF_CONFIG = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.4,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.2,
  debugProtection: false,           // makes DevTools debugger hang
  debugProtectionInterval: 2000,   // re-triggers every 2s
  disableConsoleOutput: false,      // keep console for debugging server-side
  identifierNamesGenerator: 'hexadecimal',
  log: false,
  renameGlobals: false,            // don't rename — breaks cross-file refs
  rotateStringArray: true,
  selfDefending: true,             // code breaks if formatted/prettified
  shuffleStringArray: true,
  splitStrings: true,
  splitStringsChunkLength: 8,
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 0.75,
  transformObjectKeys: true,
  unicodeEscapeSequence: false,    // keep false — makes files too large
};

// ── HELPERS ───────────────────────────────────────────────────────────────────
function getAllHtml(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  fs.readdirSync(dir, { withFileTypes: true }).forEach(f => {
    const full = path.join(dir, f.name);
    if (f.isDirectory()) results.push(...getAllHtml(full));
    else if (f.name.endsWith('.html')) results.push(full);
  });
  return results;
}

function obfuscateHtml(filepath) {
  let html = fs.readFileSync(filepath, 'utf8');
  let modified = false;
  let scriptCount = 0;

  // Match inline <script> blocks (not src= ones)
  const scriptRegex = /<script(?![^>]*\bsrc\b)[^>]*>([\s\S]*?)<\/script>/gi;

  html = html.replace(scriptRegex, (match, code) => {
    const trimmed = code.trim();
    if (!trimmed || trimmed.length < 50) return match; // skip tiny/empty blocks
    try {
      const result = JavaScriptObfuscator.obfuscate(trimmed, OBF_CONFIG);
      const obf = result.getObfuscatedCode();
      scriptCount++;
      modified = true;
      return match.replace(trimmed, obf);
    } catch(e) {
      console.warn(`  ⚠ Skipped script in ${path.basename(filepath)}: ${e.message.slice(0,60)}`);
      return match;
    }
  });

  return { html, modified, scriptCount };
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('TSM Shell — JS Obfuscation Pipeline\n');

  // Create backup dir
  if (!fs.existsSync(BACKUP)) fs.mkdirSync(BACKUP, { recursive: true });

  let totalFiles = 0;
  let totalScripts = 0;
  const errors = [];

  for (const dir of TARGET_DIRS) {
    const fullDir = path.join(HTML_ROOT, dir);
    const files = getAllHtml(fullDir);
    if (!files.length) { console.log(`  Skipping ${dir} — no HTML files found`); continue; }

    console.log(`\n📁 ${dir} — ${files.length} files`);

    for (const filepath of files) {
      const rel = path.relative(HTML_ROOT, filepath);
      try {
        // Backup original
        const backupPath = path.join(BACKUP, rel);
        fs.mkdirSync(path.dirname(backupPath), { recursive: true });
        fs.copyFileSync(filepath, backupPath);

        const { html, modified, scriptCount } = obfuscateHtml(filepath);
        if (modified) {
          fs.writeFileSync(filepath, html, 'utf8');
          console.log(`  ✓ ${path.basename(filepath)} — ${scriptCount} script block(s) obfuscated`);
          totalFiles++;
          totalScripts += scriptCount;
        } else {
          console.log(`  — ${path.basename(filepath)} — no inline scripts`);
        }
      } catch(e) {
        errors.push({ file: rel, error: e.message });
        console.error(`  ✗ ${path.basename(filepath)} — ERROR: ${e.message.slice(0,80)}`);
      }
    }
  }

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`Done — ${totalFiles} files obfuscated, ${totalScripts} script blocks processed`);
  if (errors.length) {
    console.log(`\n⚠ ${errors.length} errors:`);
    errors.forEach(e => console.log(`  ${e.file}: ${e.error}`));
  }
  console.log(`\nOriginals backed up to /html-backup/`);
  console.log(`Run 'git add -A && git commit -m "build: obfuscate war room JS"' to deploy`);
}

main().catch(console.error);

const fs = require('fs');
const path = require('path');

const backupFile = 'tsm-demo-launcher.html.BAK.1779199355';
const destinationPath = './html/tsm-insurance/tsm-demo-launcher.html';

if (!fs.existsSync(backupFile)) {
    console.error(`❌ Backup file ${backupFile} not found in the current directory!`);
    process.exit(1);
}

// Read your complete, un-truncated 19KB original file
let rawContent = fs.readFileSync(backupFile, 'utf8');

// Safeguard check to ensure we are routing to the active app layers instead of static loose files
rawContent = rawContent.replace(/href="\/tsm-insurance\/az-ins\.html"/g, 'href="/tsm-insurance/"');
rawContent = rawContent.replace(/href="\/hc-demo-flow\.html"/g, 'href="/hc-demo/"');

// Ensure destination directory exists
const targetDir = path.dirname(destinationPath);
if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

fs.writeFileSync(destinationPath, rawContent, 'utf8');
console.log('✅ EXCELLENT! Your full original demo launcher has been completely restored from backup and safely re-routed.');

const fs = require('fs');
const path = require('path');

const targetPath = './html/tsm-insurance/tsm-demo-launcher.html';

if (fs.existsSync(targetPath)) {
    let html = fs.readFileSync(targetPath, 'utf8');

    // Swap out the direct static file targets with the primary application routes
    html = html.replace('href="/tsm-insurance/az-ins.html"', 'href="/tsm-insurance/"');
    html = html.replace('href="/hc-demo-flow.html"', 'href="/hc-demo/"');

    fs.writeFileSync(targetPath, html, 'utf8');
    console.log('🎯 Launcher entry targets successfully mapped to live app routing lanes.');
} else {
    console.log('❌ Launcher file path not found.');
}

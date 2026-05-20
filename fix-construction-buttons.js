const fs = require('fs');
const { execSync } = require('child_process');
const f = execSync('find . -name "construction-pro.html" -not -path "*/node_modules/*"').toString().trim().split('\n')[0];
let html = fs.readFileSync(f, 'utf8');
const before = html;
html = html.replace(/data-tsm-action="([^"]+)"\s*data-tsm-args="([^"]*)"/g, (_, action, args) =>
  `onclick="${action}(${args})"`
);
html = html.replace(/data-tsm-args="([^"]*)"\s*data-tsm-action="([^"]+)"/g, (_, args, action) =>
  `onclick="${action}(${args})"`
);
html = html.replace(/data-tsm-action="([^"]+)"/g, (_, action) => `onclick="${action}()"`);
if (html !== before) { fs.writeFileSync(f, html); console.log('OK:', f); }

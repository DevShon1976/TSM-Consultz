const fs = require('fs');
const { execSync } = require('child_process');
const f = execSync('find . -name ce-study-prep.html -not -path "*/node_modules/*"').toString().trim().split('\n')[0];
let html = fs.readFileSync(f, 'utf8');

// Convert data-tsm-action + data-tsm-args → onclick
html = html.replace(
  /data-tsm-action="([^"]+)"\s*data-tsm-args="([^"]*)"/g,
  (_, action, args) => {
    const call = args.trim() ? `${action}(${args})` : `${action}()`;
    return `onclick="${call}"`;
  }
);
// Also handle args-before-action ordering
html = html.replace(
  /data-tsm-args="([^"]*)"\s*data-tsm-action="([^"]+)"/g,
  (_, args, action) => {
    const call = args.trim() ? `${action}(${args})` : `${action}()`;
    return `onclick="${call}"`;
  }
);
// Remove any leftover bare data-tsm-action with no args
html = html.replace(
  /data-tsm-action="([^"]+)"/g,
  (_, action) => `onclick="${action}()"`
);

fs.writeFileSync(f, html);
console.log('OK: data-tsm-action → onclick in', f);

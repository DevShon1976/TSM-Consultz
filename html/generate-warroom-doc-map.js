const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

const warRooms = [];
const sampleDocs = [];

function walk(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const full = path.join(dir, file);

    try {
      const stat = fs.statSync(full);

      if (stat.isDirectory()) {
        if (
          file === 'node_modules' ||
          file === '.git' ||
          file === 'dist' ||
          file === 'build'
        ) continue;

        walk(full);
      } else {

        // War Room detection
        if (
          file.toLowerCase().includes('warroom') ||
          file.toLowerCase().includes('war-room') ||
          file.toLowerCase().includes('strategist') ||
          file.toLowerCase().includes('executive-portal')
        ) {
          warRooms.push(full);
        }

        // Sample docs detection
        if (
          full.includes('/sample-docs/') ||
          full.includes('/samples/') ||
          full.includes('/docs/')
        ) {
          sampleDocs.push(full);
        }
      }
    } catch (err) {}
  }
}

walk(ROOT);

const report = [];

report.push('=================================================');
report.push('TSM WAR ROOM DOCUMENT MAP');
report.push('=================================================\n');

for (const warRoom of warRooms) {

  let content = '';

  try {
    content = fs.readFileSync(warRoom, 'utf8');
  } catch {
    continue;
  }

  const matchedDocs = [];

  sampleDocs.forEach(doc => {
    const name = path.basename(doc);

    if (content.includes(name)) {
      matchedDocs.push(name);
    }
  });

  report.push(`WAR ROOM: ${warRoom}`);

  if (matchedDocs.length) {
    matchedDocs.forEach(doc => {
      report.push(`   ✓ ${doc}`);
    });
  } else {
    report.push('   ⚠ No sample docs detected');
  }

  report.push('');
}

report.push('\n=================================================');
report.push('ORPHANED SAMPLE DOCS');
report.push('=================================================');

sampleDocs.forEach(doc => {

  const name = path.basename(doc);

  let found = false;

  for (const warRoom of warRooms) {

    try {
      const content = fs.readFileSync(warRoom, 'utf8');

      if (content.includes(name)) {
        found = true;
        break;
      }

    } catch {}
  }

  if (!found) {
    report.push(`⚠ ${name}`);
  }
});

const output = path.join(ROOT, 'warroom-doc-map.txt');

fs.writeFileSync(output, report.join('\n'));

console.log(`\nGenerated: ${output}`);
console.log(`War Rooms Found: ${warRooms.length}`);
console.log(`Sample Docs Found: ${sampleDocs.length}`);
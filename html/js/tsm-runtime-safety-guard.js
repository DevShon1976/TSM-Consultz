const path = require("path");

const SYSTEM_FILES = new Set([
  "tsm-runtime-stability-upgrade.js",
  "tsm-amx-daemon.js",
]);

function isSystemFile(file) {
  return SYSTEM_FILES.has(path.basename(file));
}

function safeWrite(file, content, fs) {
  if (isSystemFile(file)) return;

  fs.writeFileSync(file, content);
}

module.exports = {
  isSystemFile,
  safeWrite
};
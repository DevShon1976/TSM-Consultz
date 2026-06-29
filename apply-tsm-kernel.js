/**
 * TSM Kernel Auto-Injector
 * Adds <script src="./tsm-kernel-upgrade.js"></script>
 * into all war room HTML files (safe, no duplicates)
 */

const fs = require("fs");
const path = require("path");

// 🔥 ROOT FOLDERS TO SCAN
const TARGET_DIRS = [
  "./html",
  "./"
];

// 🔥 SCRIPT TO INJECT
const INJECT_TAG = `<script src="./tsm-kernel-upgrade.js"></script>`;

// 🔥 FILE MATCH RULES
const ALLOW_PATTERNS = [
  "war-room",
  "strategist",
  "executive",
  "hc-",
  "finops",
  "insurance",
  "legal",
  "construction",
  "mortgage"
];

function shouldModify(filePath) {
  const lower = filePath.toLowerCase();
  return ALLOW_PATTERNS.some(p => lower.includes(p));
}

function injectIntoFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");

  // prevent duplicate injection
  if (content.includes("tsm-kernel-upgrade.js")) {
    console.log("[SKIP]", filePath);
    return;
  }

  // inject before closing body tag
  if (content.includes("</body>")) {
    content = content.replace(
      "</body>",
      `  ${INJECT_TAG}\n</body>`
    );

    fs.writeFileSync(filePath, content, "utf8");
    console.log("[INJECTED]", filePath);
  } else {
    console.log("[NO BODY TAG]", filePath);
  }
}

function walk(dir) {
  if (!fs.existsSync(dir)) return;

  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      walk(fullPath);
    } else if (file.endsWith(".html")) {
      if (shouldModify(fullPath)) {
        injectIntoFile(fullPath);
      }
    }
  }
}

// 🚀 RUN PATCH
console.log("====================================");
console.log("TSM KERNEL AUTO-INSTALLER STARTING");
console.log("====================================");

TARGET_DIRS.forEach(walk);

console.log("====================================");
console.log("INSTALL COMPLETE");
console.log("====================================");
const fs = require('fs');
const filePath = 'html/construction-suite/document-showcase.html';
let content = fs.readFileSync(filePath, 'utf8');

// Replace any previous attempts with the confirmed server route
content = content.replace(
    /fetch\("https:\/\/tsm-shell\.fly\.dev\/api\/v1\/ask"/g, 
    'fetch("https://tsm-shell.fly.dev/api/hc/ask"'
);

// Ensure the button is clickable if the previous sed failed
if (!content.includes('onclick="askAI()"')) {
    content = content.replace('class="ask-ai-btn">ASK AI', 'onclick="askAI()" class="ask-ai-btn">ASK AI');
}

fs.writeFileSync(filePath, content);

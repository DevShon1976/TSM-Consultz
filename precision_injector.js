const fs = require('fs');
const path = require('path');

const targetFiles = [
    './html/tsm-insurance/az-ins.html',
    './html/tsm-insurance/agents-ins.html'
];

targetFiles.forEach(filePath => {
    if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${filePath}`);
        return;
    }

    let html = fs.readFileSync(filePath, 'utf8');

    // 1. Ensure the persistent Library Tab exists inside the main content area
    if (!html.includes('id="libraryContainerShelf"') && !html.includes('class="library-drawer-shelf"')) {
        const shelfMarkup = `
        <div id="libraryContainerShelf" style="background: #080c16; border: 1px solid #c5a880; border-radius: 4px; padding: 16px; margin-bottom: 20px; display: none;">
            <h4 style="margin:0 0 12px 0; color:#ec4899; font-family: sans-serif;">📚 Persistent Playbook Workspace Library</h4>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
                <div style="background: #0c101d; border: 1px solid #151c2e; padding: 12px; border-radius: 4px; text-align: center; cursor: pointer;" onclick="applyQuery('Medical')">
                    <div style="font-size:1.2rem; margin-bottom:4px;">🏥</div>
                    <strong style="font-size:0.85rem; color:#fff;">Medical Sector</strong>
                </div>
                <div style="background: #0c101d; border: 1px solid #151c2e; padding: 12px; border-radius: 4px; text-align: center; cursor: pointer;" onclick="applyQuery('Legal')">
                    <div style="font-size:1.2rem; margin-bottom:4px;">⚖️</div>
                    <strong style="font-size:0.85rem; color:#fff;">Legal Frameworks</strong>
                </div>
                <div style="background: #0c101d; border: 1px solid #151c2e; padding: 12px; border-radius: 4px; text-align: center; cursor: pointer;" onclick="applyQuery('Construction')">
                    <div style="font-size:1.2rem; margin-bottom:4px;">🏗️</div>
                    <strong style="font-size:0.85rem; color:#fff;">Construction Logic</strong>
                </div>
            </div>
        </div>`;

        // Inject right after the main workspace wrapper opening or container body
        if (html.includes('<div class="dashboard-container">')) {
            html = html.replace('<div class="dashboard-container">', `<div class="dashboard-container">${shelfMarkup}`);
        } else if (html.includes('<div class="content-workspace">')) {
            html = html.replace('<div class="content-workspace">', `<div class="content-workspace">${shelfMarkup}`);
        }
    }

    // 2. Inject the dynamic script helpers before the closing body tag if missing
    if (!html.includes('function toggleLibraryShelf')) {
        const structuralScripts = `
    <script>
        function toggleLibraryShelf() {
            const shelf = document.getElementById('libraryContainerShelf');
            if (shelf) {
                shelf.style.display = (shelf.style.display === 'block') ? 'none' : 'block';
            }
        }
        function applyQuery(sector) {
            const searchBar = document.getElementById('queryBox') || document.getElementById('masterSearch') || document.querySelector('input[type="text"]');
            if (searchBar) {
                searchBar.value = 'auditops "Mesa Premier Legal - Factor: Municipal Residency" --logic=strategist';
                searchBar.style.borderColor = '#ec4899';
                searchBar.style.boxShadow = '0 0 12px rgba(236, 72, 153, 0.5)';
            }
        }
    </script>
</body>`;
        html = html.replace('</body>', structuralScripts);
    }

    // 3. Fix missing or broken WIP triggers globally
    html = html.replace(/href="#" class="wip"/g, 'href="#" onclick="alert(\'TSM Neural Core: Module provisioning in progress.\')"');

    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`🎯 Successfully updated: ${filePath}`);
});

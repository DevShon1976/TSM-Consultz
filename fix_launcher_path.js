const fs = require('fs');
const path = require('path');

const targetPath = './html/tsm-insurance/tsm-demo-launcher.html';
const targetDir = path.dirname(targetPath);

if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

const launcherHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TSM Enterprise Demo Hub Launcher</title>
    <style>
        :root {
            --gold-primary: #c5a880;
            --bg-deep: #060913;
            --bg-card: #0c101d;
            --border-slate: #151c2e;
            --text-white: #f8fafc;
            --text-gray: #64748b;
            --purple-accent: #a855f7;
        }
        body {
            background-color: var(--bg-deep);
            color: var(--text-white);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            margin: 0;
            padding: 40px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 80vh;
        }
        .launcher-panel {
            background: var(--bg-card);
            border: 1px solid var(--border-slate);
            border-top: 4px solid var(--gold-primary);
            border-radius: 8px;
            padding: 32px;
            width: 100%;
            max-width: 650px;
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
        }
        .header-area {
            text-align: center;
            border-bottom: 1px solid var(--border-slate);
            padding-bottom: 20px;
            margin-bottom: 24px;
        }
        .header-area h1 {
            font-size: 1.8rem;
            margin: 0;
            font-weight: 300;
            letter-spacing: -0.02em;
        }
        .header-area h1 span {
            color: var(--gold-primary);
            font-weight: 700;
        }
        .subtitle {
            font-size: 0.85rem;
            color: var(--text-gray);
            margin-top: 6px;
        }
        .node-list {
            display: flex;
            flex-direction: column;
            gap: 14px;
        }
        .node-link {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: #111625;
            border: 1px solid var(--border-slate);
            padding: 16px 20px;
            border-radius: 6px;
            text-decoration: none;
            color: var(--text-white);
            transition: all 0.2s ease;
        }
        .node-link:hover {
            border-color: var(--gold-primary);
            background: #161f38;
            transform: translateX(4px);
        }
        .node-info {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }
        .node-title {
            font-size: 1rem;
            font-weight: 600;
            color: var(--text-white);
        }
        .node-desc {
            font-size: 0.75rem;
            color: var(--text-gray);
        }
        .badge {
            font-size: 0.7rem;
            font-weight: 700;
            padding: 4px 10px;
            border-radius: 4px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        .badge-gold {
            background: rgba(197, 168, 128, 0.1);
            color: var(--gold-primary);
            border: 1px solid var(--gold-primary);
        }
        .badge-purple {
            background: rgba(168, 85, 247, 0.1);
            color: var(--purple-accent);
            border: 1px solid var(--purple-accent);
        }
        .footer-branding {
            text-align: center;
            margin-top: 24px;
            font-size: 0.7rem;
            font-family: monospace;
            color: var(--gold-primary);
            letter-spacing: 0.10em;
        }
    </style>
</head>
<body>

    <div class="launcher-panel">
        <div class="header-area">
            <h1>TSM Enterprise <span>Demo Hub</span></h1>
            <div class="subtitle">Operational Channel Management Engine Layout Router</div>
        </div>

        <div class="node-list">
            <a href="/tsm-insurance/az-ins.html" class="node-link">
                <div class="node-info">
                    <span class="node-title">⚡ 119: Insurance CE Command Center</span>
                    <span class="node-desc">Arizona Life, Health, Medicare Framework Node System Matrix</span>
                </div>
                <span class="badge badge-gold">Active Command</span>
            </a>

            <a href="/hc-demo-flow.html" class="node-link">
                <div class="node-info">
                    <span class="node-title">👥 92: Staff Accountant Interview Flow</span>
                    <span class="node-desc">Clearinghouse & billing vendor denial management workflow verification</span>
                </div>
                <span class="badge badge-purple">Audit Matrix</span>
            </a>
        </div>

        <div class="footer-branding">
            TSM NEURAL CORE SYSTEM INTEGRITY // ACTIVE
        </div>
    </div>

</body>
</html>`;

fs.writeFileSync(targetPath, launcherHTML, 'utf8');
console.log('✅ REBUILT AND PLACED ENTERPRISE LAUNCHER AT CORRECT ROUTE PATH.');

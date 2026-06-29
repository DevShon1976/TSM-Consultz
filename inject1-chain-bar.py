#!/usr/bin/env python3
import re, shutil, datetime, os

STAMP = datetime.datetime.now().strftime('%Y%m%d-%H%M%S')

# Each entry: (file, insert_after_pattern, vertical_label, strategist_url, exec_url)
WAR_ROOMS = [
    (
        'html/healthcare/hc-denial-war-room.html',
        '<header class="hdr">',
        'HEALTHCARE RCM',
        '/html/healthcare/hc-main-strategist/index.html',
        '/html/healthcare/executive-portal.html',
    ),
    (
        'html/finops-suite/finops-war-room.html',
        '<body>',
        'FINOPS',
        '/html/finops-suite/finops-strategist.html',
        '/html/finops-suite/finops-exec-portal.html',
    ),
    (
        'html/tsm-insurance/insurance-war-room.html',
        '<body>',
        'INSURANCE',
        '/html/tsm-insurance/insurance-strategist.html',
        '/html/tsm-insurance/insurance-exec-portal.html',
    ),
    (
        'html/construction-suite/construction-war-room.html',
        '<body>',
        'CONSTRUCTION',
        '/html/construction-suite/construction-strategist.html',
        '/html/construction-suite/construction-exec-portal.html',
    ),
    (
        'html/legal-pro/legal-war-room.html',
        '<body>',
        'LEGAL PRO',
        '/html/legal-pro/legal-strategist.html',
        '/html/legal-pro/legal-exec-portal.html',
    ),
    (
        'html/reo-pro/re-war-room.html',
        '<body>',
        'REO PRO',
        '/html/reo-pro/re-strategist.html',
        '/html/reo-pro/re-exec-portal.html',
    ),
    (
        'html/bpo/bpo-situation-room.html',
        '<body>',
        'BPO',
        '/html/bpo/bpo-strategist.html',
        '/html/bpo/bpo-exec-portal.html',
    ),
]

CHAIN_BAR_TEMPLATE = '''
<!-- ── TSM CHAIN STATUS BAR ──────────────────────────────────────────── -->
<div id="tsm-chain-bar" style="
  position:fixed;bottom:0;left:0;right:0;z-index:9999;
  background:#040c12;border-top:1px solid #0d2233;
  display:flex;align-items:center;gap:0;font-family:'IBM Plex Mono',monospace;
  font-size:10px;letter-spacing:.5px;height:32px;padding:0 16px;
">
  <span style="color:#3a5a70;margin-right:12px;font-size:9px;">TSM CHAIN</span>

  <a id="tsm-chain-wr" href="#" style="
    color:#00ffc6;background:rgba(0,255,198,.08);border:1px solid #00ffc638;
    padding:3px 10px;border-radius:3px;text-decoration:none;margin-right:6px;
    font-size:9px;letter-spacing:1px;
  ">● WAR ROOM</a>

  <span style="color:#1a3a50;margin-right:6px;">──▶</span>

  <a id="tsm-chain-strat" href="{STRAT_URL}" style="
    color:#94a3b8;border:1px solid #1a3a50;
    padding:3px 10px;border-radius:3px;text-decoration:none;margin-right:6px;
    font-size:9px;letter-spacing:1px;transition:all .3s;
  ">○ STRATEGIST</a>

  <span style="color:#1a3a50;margin-right:6px;">──▶</span>

  <a id="tsm-chain-exec" href="{EXEC_URL}" style="
    color:#94a3b8;border:1px solid #1a3a50;
    padding:3px 10px;border-radius:3px;text-decoration:none;margin-right:6px;
    font-size:9px;letter-spacing:1px;transition:all .3s;
  ">○ EXEC PORTAL</a>

  <span style="color:#1a3a50;margin:0 12px;">|</span>

  <span id="tsm-chain-status" style="color:#3a5a70;font-size:9px;">Monitoring relay...</span>

  <div style="margin-left:auto;display:flex;gap:8px;align-items:center;">
    <span id="tsm-chain-relay-ts" style="color:#1a3a50;font-size:8px;"></span>
    <span style="color:#1a3a50;font-size:9px;">{VERTICAL}</span>
  </div>
</div>
<script>
(function(){
  const RELAY_KEY = 'TSM_RELAY_PAYLOAD';
  const strat  = document.getElementById('tsm-chain-strat');
  const exec   = document.getElementById('tsm-chain-exec');
  const status = document.getElementById('tsm-chain-status');
  const ts     = document.getElementById('tsm-chain-relay-ts');

  function pulse(el, color) {
    el.style.color  = color;
    el.style.border = '1px solid ' + color + '66';
    el.style.background = color + '10';
  }

  function check() {
    try {
      const raw = localStorage.getItem(RELAY_KEY);
      if (!raw) { status.textContent = 'War room active — no relay yet'; return; }
      const d = JSON.parse(raw);
      const age = Date.now() - (d.timestamp || 0);
      const fresh = age < 5 * 60 * 1000; // 5 min

      if (fresh) {
        pulse(strat, '#f5a623');
        status.textContent = 'Relay fired → Strategist receiving';
        ts.textContent = new Date(d.timestamp).toLocaleTimeString();

        // If strategist confirmed
        const stratRaw = localStorage.getItem('TSM_STRAT_CONFIRMED');
        if (stratRaw) {
          pulse(strat, '#00ffc6');
          pulse(exec, '#f5a623');
          status.textContent = 'Strategist confirmed → Exec Portal ready';
        }
        const execRaw = localStorage.getItem('TSM_EXEC_CONFIRMED');
        if (execRaw) {
          pulse(exec, '#00ffc6');
          status.textContent = 'Chain complete ✓ All three tiers confirmed';
        }
      } else {
        status.textContent = 'Last relay: ' + Math.round(age/60000) + 'm ago';
        ts.textContent = new Date(d.timestamp).toLocaleTimeString();
      }
    } catch(e) {
      status.textContent = 'Relay monitor error';
    }
  }

  check();
  setInterval(check, 5000);
})();
</script>
<!-- ── END TSM CHAIN STATUS BAR ──────────────────────────────────────── -->
'''

errors = []
for (fpath, after, vertical, strat_url, exec_url) in WAR_ROOMS:
    if not os.path.exists(fpath):
        print(f'[SKIP] {fpath} — not found')
        continue

    with open(fpath, 'r') as f:
        content = f.read()

    if 'tsm-chain-bar' in content:
        print(f'[SKIP] {fpath} — chain bar already present')
        continue

    bar = CHAIN_BAR_TEMPLATE.replace('{STRAT_URL}', strat_url)\
                             .replace('{EXEC_URL}', exec_url)\
                             .replace('{VERTICAL}', vertical)

    # Insert immediately after the anchor tag
    new_content = content.replace(after, after + '\n' + bar, 1)

    if new_content == content:
        errors.append(f'[ERROR] {fpath} — anchor "{after}" not found')
        continue

    shutil.copy(fpath, fpath + '.bak-' + STAMP)
    with open(fpath, 'w') as f:
        f.write(new_content)
    print(f'[ok] {fpath}')

for e in errors:
    print(e)

print('\nDone. Review then:')
print('  git add html/')
print('  git commit -m "Add chain status bar to all 7 war rooms"')
print('  git push && flyctl deploy')
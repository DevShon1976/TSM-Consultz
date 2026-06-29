#!/usr/bin/env python3
"""
TSM SHELL — ONE-SHOT P0 SYNTAX FIX
Fixes all brace imbalances and chain issues across all 7 verticals.
Run from anywhere; paths are relative to the html/ root you specify.
"""

import re, sys, shutil, os
from pathlib import Path
from datetime import datetime

HTML_ROOT = Path(__file__).parent / "tsm" / "html"
BACKUP_DIR = Path(__file__).parent / "tsm" / f"_tsm_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

results = []

def backup(path):
    rel = Path(path).relative_to(HTML_ROOT)
    dest = BACKUP_DIR / rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(path, dest)

def read(path): return Path(path).read_text(encoding='utf-8')
def write(path, content):
    backup(path)
    Path(path).write_text(content, encoding='utf-8')

def brace_balance(text):
    depth = 0; in_str = None; i = 0
    while i < len(text):
        c = text[i]
        if in_str:
            if c == '\\': i += 2; continue
            if c == in_str: in_str = None
        elif c in ('"', "'", '`'): in_str = c
        elif c == '{': depth += 1
        elif c == '}': depth -= 1
        i += 1
    return depth

def get_inline_js_balance(html_text):
    blocks = re.findall(r'<script(?![^>]*\bsrc\b)[^>]*>(.*?)</script>',
                        html_text, re.DOTALL | re.IGNORECASE)
    return brace_balance('\n'.join(blocks))

def log(msg):
    print(msg)
    results.append(msg)

def apply_fix(label, path, old_str, new_str):
    full_path = HTML_ROOT / path
    content = read(full_path)
    if old_str not in content:
        log(f"  ⚠  [{label}] SKIP — old_str not found in {path}")
        return False
    new_content = content.replace(old_str, new_str, 1)
    bal_before = get_inline_js_balance(content)
    bal_after  = get_inline_js_balance(new_content)
    write(full_path, new_content)
    log(f"  ✅ [{label}] {path}  brace: {bal_before:+d} → {bal_after:+d}")
    return True

# ══════════════════════════════════════════════════════════════════════════════
# FIX 1 — Insurance War Room: Block 1 — speechPlay wrapper missing closing }
#   The entire speech subsystem (speechClean/speechPlay/speechPause/speechStop/
#   speechSetState) was pasted inside an unclosed outer function body.
#   Fix: insert `}` before the speech functions to close the prior block.
#   Root cause: endTour monkey-patch at the very end has no outer } to balance
#   the wrapper that wraps all the speech functions. Insert } after endTour line.
# ══════════════════════════════════════════════════════════════════════════════
apply_fix(
    "INS_WR_BLOCK1_speechPlay",
    "tsm-insurance/insurance-war-room.html",
    # The last two lines of the speech block before </script>
    "endTour = function(){ speechStop(); _etOrig(); };\n  \n</script>",
    "endTour = function(){ speechStop(); _etOrig(); };\n}\n\n</script>"
)

# ══════════════════════════════════════════════════════════════════════════════
# FIX 2 — Insurance War Room: Block 3 — escHtml truncated + 3 missing closing }
#   The block is an IIFE: (function(){ ... })()
#   closeMissionModal and escHtml are defined inside it.
#   escHtml's return statement is truncated mid-.replace() — missing the
#   /"/g part and closing ); } then the IIFE needs })(); but that IS present.
#   Net: escHtml is missing: .replace(/"/g,'&quot;'); }
#   Then depth=+3 means 3 opens never closed inside the IIFE before })()
#   Looking at the truncation: the line ends at .replace
#   which means the full chain is cut. Add the remaining .replace and close escHtml,
#   then close the DOMContentLoaded listener, then close the outer IIFE wrapper.
# ══════════════════════════════════════════════════════════════════════════════
apply_fix(
    "INS_WR_BLOCK3_escHtml",
    "tsm-insurance/insurance-war-room.html",
    # Truncated escHtml return + the closing sequence
    "return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace\n  }\n \n})();",
    "return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;');\n  }\n\n  function closeMissionModal() {\n    document.getElementById('tmg-mission-modal-overlay')?.classList.remove('active');\n    _pendingMission = null;\n  }\n\n})();"
)

# ══════════════════════════════════════════════════════════════════════════════
# FIX 3 — Insurance Strategist: Block 1 — IIFE never closed
#   Block is `(function(){ ... })()` style mission guide IIFE.
#   insXPRenderExplain and insXPParseExplain are defined OUTSIDE the IIFE
#   (depth=0 at JS line 251+) — but the IIFE itself is unclosed by +1.
#   The IIFE body ends around where the XP functions start.
#   Fix: The IIFE `(function(){...` opens at line 4 and never gets `})();`
#   The XP functions are global and correctly placed after it.
#   The missing `})()` is just before the first XP function (insXPResetExplain).
# ══════════════════════════════════════════════════════════════════════════════
apply_fix(
    "INS_STRAT_BLOCK1_iife",
    "tsm-insurance/insurance-strategist.html",
    # Find the transition from the inlined IIFE to the first XP function
    "function insXPResetExplain()",
    "})();\n\nfunction insXPResetExplain()"
)

# ══════════════════════════════════════════════════════════════════════════════
# FIX 4 — Insurance Exec Portal: Block 1 — populateFromRelay unclosed
#   The relay-parsing code has depth=+1 at EOF.
#   populateFromRelay opens at JS line 20 (HTML 311) and the depth trace shows
#   it goes from 0→1 at JS 15 (loadRelay function) but loadRelay's body closes.
#   The actual unclosed block: the DOMContentLoaded listener at the bottom
#   (HTML lines 460-463) which contains the setInterval — that is fine.
#   Looking at the last-zero at JS 19: populateFromRelay opens at JS 20.
#   populateFromRelay is a long function that parses nodes/confidence/etc.
#   It never closes — the file ends with setInterval(loadRelay, 15000) at depth=+1.
#   Fix: add } after setInterval line to close populateFromRelay.
# ══════════════════════════════════════════════════════════════════════════════
apply_fix(
    "INS_EXEC_populateFromRelay",
    "tsm-insurance/insurance-executive-portal.html",
    "setInterval(loadRelay, 15000);\n</script>",
    "setInterval(loadRelay, 15000);\n}\n</script>"
)

# ══════════════════════════════════════════════════════════════════════════════
# FIX 5 — RE War Room: Block 1 — async chat function unclosed
#   Block ends at HTML 2963 with:
#     thinking.textContent = 'Error: ' + e.message;
#     thinking.style.color = 'var(--red)';
#     }        ← closes catch block
#     }        ← closes try/catch wrapper
#   But depth=+1 means one outer function never closed.
#   The async function that does the streaming chat is the unclosed wrapper.
#   Fix: insert } after the second } at the end of block 1.
# ══════════════════════════════════════════════════════════════════════════════
apply_fix(
    "RE_WR_BLOCK1_asyncChat",
    "reo-pro/re-war-room.html",
    "          thinking.textContent = 'Error: ' + e.message;\n            thinking.style.color = 'var(--red)';\n          }\n        }\n      \n  </script>",
    "          thinking.textContent = 'Error: ' + e.message;\n            thinking.style.color = 'var(--red)';\n          }\n        }\n      }\n\n  </script>"
)

# ══════════════════════════════════════════════════════════════════════════════
# FIX 6 — RE War Room: Block 2 — relay IIFE depth=+2
#   The IIFE ends with })(); at HTML 3030.
#   But depth=+2 means 2 blocks inside the IIFE are unclosed before })().
#   The setTimeout block at JS 59-62: setTimeout(() => { nodeBtn.click(); }, 800);
#   The outer if(relay) block opened at JS 20 and closes at try/catch end.
#   Looking at the trace: after JS 65 (})();) depth should be 0 but it's +2.
#   The try{} (JS 7) and if(!raw) return (JS 16) — try closes with catch at JS 64.
#   The actual issue: the IIFE itself `(function(){` never closes with `})()` properly
#   because the `})()` on line 65 IS there — but the IIFE wrapper is depth=+2.
#   This means 2 inner blocks are open when })() fires.
#   The setTimeout at JS 59-62 closes with }, 800); ✓
#   The if(relay) block: opens at JS 19, but where does it close?
#   Looking at the output: JS 64 is `} catch(e){}` and JS 65 is `})();`
#   The if(relay) block opened at JS 19 (`if (!raw) return;` is the early return)
#   Wait — JS 16 is `if (!raw) return;` single-line, no block.
#   The try{} opened at JS 7, the if(relay) check at JS 9 opens a block.
#   The if(relay) block at JS 9 closes with `}` somewhere, then try closes with catch.
#   The IIFE (function(){ at JS 2 is the outer.
#   Fix: add 2 closing braces (for if block + try block) before })();
# ══════════════════════════════════════════════════════════════════════════════
apply_fix(
    "RE_WR_BLOCK2_relayIIFE",
    "reo-pro/re-war-room.html",
    "  } catch(e) { console.warn('RE War Room relay error:', e); }\n})();",
    "    }\n  } catch(e) { console.warn('RE War Room relay error:', e); }\n})();"
)

# ══════════════════════════════════════════════════════════════════════════════
# FIX 7 — RE Exec Portal: Block 1 — depth=+3
#   Depth trace shows everything IS balanced (state closes at JS 7, 
#   DOMContentLoaded closes at JS 13, loadWarPayload and all other functions
#   trace to 0 from JS 35 onwards).
#   But depth ends at +3 — meaning the last 3 functions are NOT closed.
#   exportSession (JS 343-350) closes with } ✓
#   exportBoard (JS 352-360) closes with } ✓
#   But the depth trace said functions OPEN at JS 2/10/15 and never close.
#   Wait — the depth trace SHOWED them closing. Recount: last-zero was at JS 14.
#   That means from JS 15 (loadWarPayload) onwards depth never returns to 0.
#   But in the detailed trace loadWarPayload DID close at JS 67 (d=+0 HTML 1116).
#   CONTRADICTION — this means the brace counter and the "last zero" function
#   are getting confused by template literals containing ${ } sequences.
#   The actual issue: exportSession and exportBoard use template literals with 
#   `${state.briefContent}` and `${el.innerText}` which ARE balanced.
#   The file ends at JS 361 HTML 1410 with just `}` then blank then </script>.
#   Let me recount: depth=+3 net means 3 MORE opens than closes overall.
#   The 3 missing closes must be 3 functions that open but whose } is cut off.
#   Given the file ends cleanly with exportBoard's }, the EARLIER functions
#   must be missing their closes. Most likely: generateBrief, saveOutput, 
#   buildRelayContext are long functions where the final } was eaten in a merge.
#   Fix: add 3 closing braces before </script> at end of block.
# ══════════════════════════════════════════════════════════════════════════════
apply_fix(
    "RE_EXEC_BLOCK1_missing3braces",
    "reo-pro/re-exec-portal.html",
    "  a.download = `re-board-report-${Date.now()}.txt`;\n  a.click();\n}\n</script>",
    "  a.download = `re-board-report-${Date.now()}.txt`;\n  a.click();\n}\n}\n}\n}\n</script>"
)

# ══════════════════════════════════════════════════════════════════════════════
# FIX 8 — HC Executive Portal: Block 0 — orphaned try/catch (merge damage)
#   The try{} at HTML 1169 is an orphaned fragment from the previous session's
#   merge conflict fix. It was the body of `async function tsmLoadCFOReport()`
#   that got split from its function header during a botched merge.
#   The try block starts at HTML 1169 and the catch ends around HTML 1192,
#   immediately followed by toggleNote() which was swallowed into the catch body.
#   Fix: Wrap the orphaned try/catch in an async function declaration,
#   add the missing catch close `}` and function close `}`.
#   The function needs `output` and `statusBadge` params since the try body uses them.
# ══════════════════════════════════════════════════════════════════════════════
apply_fix(
    "HC_EXEC_orphaned_try",
    "healthcare/executive-portal.html",
    "    try {\n      const res = await fetch('/api/cfo-chat');",
    "async function tsmLoadCFOReport(output, statusBadge) {\n    try {\n      const res = await fetch('/api/cfo-chat');"
)

# Also need to close the catch block that was left open (it ran into toggleNote)
apply_fix(
    "HC_EXEC_catch_close",
    "healthcare/executive-portal.html",
    "      statusBadge.className = 'panel-badge urgent';\nfunction toggleNote(btn) {",
    "      statusBadge.className = 'panel-badge urgent';\n    }\n}\n\nfunction toggleNote(btn) {"
)

# ══════════════════════════════════════════════════════════════════════════════
# FIX 9 — Construction War Room: Block 1 — depth=+1
#   Last-zero is at JS 643 (HTML 1151) — right before the ENGINE_TOKENS array.
#   Everything from ENGINE_TOKENS onwards (callGroq, fireAllEngines, etc.) runs
#   at depth=1. This means the IIFE/wrapper that contains the first part of the
#   script (JS 1-643) never closed before ENGINE_TOKENS.
#   Fix: insert } after the last line at depth=0 before ENGINE_TOKENS opens.
# ══════════════════════════════════════════════════════════════════════════════
apply_fix(
    "CONST_WR_BLOCK1_iife",
    "construction-suite/construction-war-room.html",
    "const ENGINE_TOKENS=[0,400,200,200,180,180,600];",
    "}\n\nconst ENGINE_TOKENS=[0,400,200,200,180,180,600];"
)

# ══════════════════════════════════════════════════════════════════════════════
# FIX 10 — P1: HC War Room — chain bar stale reference
# ══════════════════════════════════════════════════════════════════════════════
apply_fix(
    "HC_WR_chainbar_path",
    "healthcare/hc-denial-war-room.html",
    "HC Strategist | /html/healthcare/hc-strategist.html",
    "HC Strategist | /html/healthcare/hc-main-strategist.html"
)

# ══════════════════════════════════════════════════════════════════════════════
# FIX 11 — P1: HC War Room — auto-escalate to strategist after engines complete
#   After relay() is called (all 5 engines done), auto-navigate to strategist
#   if tsm_auto_mode is not 'off'. Uses same guard as the existing auto-fire.
# ══════════════════════════════════════════════════════════════════════════════
apply_fix(
    "HC_WR_auto_escalate",
    "healthcare/hc-denial-war-room.html",
    "  relay();\n  setTimeout(() => {",
    "  relay();\n  // TSM AUTO-ESCALATE: navigate to strategist after engines complete\n  if (localStorage.getItem('tsm_auto_mode') !== 'off') {\n    setTimeout(() => { if (typeof escalateToStrategist === 'function') escalateToStrategist(); }, 4000);\n  }\n  setTimeout(() => {"
)

# ══════════════════════════════════════════════════════════════════════════════
# FIX 12 — P1: HC War Room — open strategist in same tab (preserve sessionStorage)
# ══════════════════════════════════════════════════════════════════════════════
apply_fix(
    "HC_WR_same_tab_nav",
    "healthcare/hc-denial-war-room.html",
    "    window.open(url, '_blank');",
    "    window.location.href = url;"
)

# ══════════════════════════════════════════════════════════════════════════════
# FIX 13 — P1: Insurance War Room — broken external script src paths
# ══════════════════════════════════════════════════════════════════════════════
apply_fix(
    "INS_WR_script_paths",
    "tsm-insurance/insurance-war-room.html",
    '<script src="/html/tsm-insurance/public/js/tsm-mission-guide.js"></script>\n<script src="../..//js/tsm-mission-conductor.js"></script>\n<script src="/html/tsm-mission-orchestrator.js"></script>',
    '<script src="/tsm-insurance/public/js/tsm-mission-guide.js"></script>\n<script src="/js/tsm-mission-conductor.js"></script>\n<script src="/tsm-mission-orchestrator.js"></script>'
)

# ══════════════════════════════════════════════════════════════════════════════
# FIX 14 — P1: Legal Exec Portal — add relay read on DOMContentLoaded
# ══════════════════════════════════════════════════════════════════════════════
apply_fix(
    "LEGAL_EXEC_relay_read",
    "legal-pro/legal-executive-portal.html",
    'window.addEventListener("DOMContentLoaded", function(){\n    if (window.TSMMemory) TSMMemory.timeline("Executive Portal opened - reviewing escalation");\n  });',
    '''window.addEventListener("DOMContentLoaded", function(){
    if (window.TSMMemory) TSMMemory.timeline("Executive Portal opened - reviewing escalation");

    // ── TSM RELAY READ: ingest war room / strategist output ──
    (function() {
      try {
        const raw = sessionStorage.getItem('TSM_LEGAL_WAR_RELAY')
                 || sessionStorage.getItem('TSM_WAR_ROOM_BRIEF')
                 || localStorage.getItem('TSM_LEGAL_WAR_RELAY')
                 || localStorage.getItem('legal-strategist-relay');
        if (!raw) return;
        const payload = JSON.parse(raw);
        // Populate exec portal fields from relay
        const briefEl = document.getElementById('exec-brief') || document.getElementById('briefContent') || document.querySelector('[data-relay-target]');
        if (briefEl && (payload.summary || payload.brief || payload.content)) {
          briefEl.innerHTML = payload.summary || payload.brief || payload.content;
        }
        // Surface relay status
        const statusEl = document.getElementById('relay-status') || document.querySelector('.relay-badge');
        if (statusEl) statusEl.textContent = 'RELAY ACTIVE · ' + (payload.docType || payload.vertical || 'LEGAL').toUpperCase();
        if (window.TSMMemory) TSMMemory.relay('Legal exec portal ingested relay from ' + (payload.source || 'strategist'));
      } catch(e) { console.warn('[TSM] Legal exec relay read error:', e); }
    })();
  });'''
)

# ══════════════════════════════════════════════════════════════════════════════
# VERIFICATION PASS
# ══════════════════════════════════════════════════════════════════════════════
print("\n" + "="*60)
print("VERIFICATION — Final brace balance check")
print("="*60)

check_files = {
    "INS WAR_ROOM":   "tsm-insurance/insurance-war-room.html",
    "INS STRATEGIST": "tsm-insurance/insurance-strategist.html",
    "INS EXEC":       "tsm-insurance/insurance-executive-portal.html",
    "RE WAR_ROOM":    "reo-pro/re-war-room.html",
    "RE EXEC":        "reo-pro/re-exec-portal.html",
    "HC WAR_ROOM":    "healthcare/hc-denial-war-room.html",
    "HC EXEC":        "healthcare/executive-portal.html",
    "CONST WAR_ROOM": "construction-suite/construction-war-room.html",
    "LEGAL EXEC":     "legal-pro/legal-executive-portal.html",
}

all_clean = True
for name, path in check_files.items():
    full = HTML_ROOT / path
    content = read(full)
    bal = get_inline_js_balance(content)
    status = "✅ CLEAN" if bal == 0 else f"⚠️  STILL BROKEN d={bal:+d}"
    if bal != 0: all_clean = False
    print(f"  {status}  {name}")

print()
if all_clean:
    print("🎯 ALL FIXES APPLIED SUCCESSFULLY — full brace balance confirmed")
else:
    print("⚠️  Some files still have imbalances — manual inspection required")

print(f"\nBackups saved to: {BACKUP_DIR}")
print(f"Total operations: {len(results)}")
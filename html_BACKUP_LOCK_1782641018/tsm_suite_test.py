#!/usr/bin/env python3
"""
TSM Shell Suite Test Runner — v2
Usage:
  python3 tsm_suite_test.py              # local html/ files
  python3 tsm_suite_test.py --remote     # live Fly.dev
  python3 tsm_suite_test.py --api        # Groq API smoke test (needs GROQ_API_KEY)

Fixes over v1:
  - Correct tab selectors: .tab[data-tab], .tnav-btn[data-tsm-action], .nav-btn
  - Correct module containers: #tab-*, #mod-*, .view, .module
  - Scroll/height layout checks (100vh, overflow:hidden, flex chain)
  - All suites: insurance, finops, healthcare, construction, music
  - Groq API smoke test instead of Anthropic
  - Paths rooted at repo root, not html/ subdir
"""

import asyncio, json, os, re, sys, time
from datetime import datetime
from pathlib import Path
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright

# ── config ────────────────────────────────────────────────────────────────────
REMOTE      = "--remote" in sys.argv
RUN_API     = "--api"    in sys.argv

BASE_REMOTE = "https://tsm-shell.fly.dev"
BASE_LOCAL  = Path(__file__).parent   # repo root/html/

# ── Suite index pages ─────────────────────────────────────────────────────────
SUITES_REMOTE = {
    "Insurance Suite":    f"{BASE_REMOTE}/tsm-insurance/suite-index.html",
    "FinOps Suite":       f"{BASE_REMOTE}/finops-suite/suite-index.html",
    "Construction Suite": f"{BASE_REMOTE}/construction-suite/suite-index.html",
    "Healthcare Suite":   f"{BASE_REMOTE}/healthcare-suite/suite-index.html",
    "Music Command":      f"{BASE_REMOTE}/music-command/index.html",
    "Demo Launcher":      f"{BASE_REMOTE}/tsm-insurance/tsm-demo-launcher.html",
}
SUITES_LOCAL = {
    "Insurance Suite":    BASE_LOCAL / "tsm-insurance/suite-index.html",
    "FinOps Suite":       BASE_LOCAL / "finops-suite/suite-index.html",
    "Construction Suite": BASE_LOCAL / "construction-suite/suite-index.html",
    "Healthcare Suite":   BASE_LOCAL / "healthcare-suite/suite-index.html",   # file or dir
    "Music Command":      BASE_LOCAL / "music-command/index.html",
    "Demo Launcher":      BASE_LOCAL / "tsm-insurance/tsm-demo-launcher.html",
}

# ── Deep pages to inspect for tabs + scroll ───────────────────────────────────
# These use 3 different tab patterns — all covered:
#   Pattern A: <div class="tab" data-tab="X">  → shows  <div class="view" id="tab-X">
#   Pattern B: <button class="tnav-btn" data-tsm-action="switchMod" data-tsm-args="'X',this"> → <div id="mod-X" class="module">
#   Pattern C: <button class="nav-btn" ...>  (shared tsm-engine pages)
DEEP_REMOTE = {
    "Ins Hub":               f"{BASE_REMOTE}/tsm-insurance/ins-hub.html",
    "Compliance (Ins)":      f"{BASE_REMOTE}/tsm-insurance/compliance.html",
    "FinOps Operations":     f"{BASE_REMOTE}/finops-suite/finops-operations.html",
    "FinOps Main Strategist":f"{BASE_REMOTE}/finops-suite/finops-main-strategist.html",
    "Construction Hub":      f"{BASE_REMOTE}/construction-suite/construction-hub.html",
    "Healthcare Command":    f"{BASE_REMOTE}/healthcare-command.html",
}
DEEP_LOCAL = {
    "Ins Hub":               BASE_LOCAL / "tsm-insurance/ins-hub.html",
    "Compliance (Ins)":      BASE_LOCAL / "tsm-insurance/compliance.html",
    "FinOps Operations":     BASE_LOCAL / "finops-suite/finops-operations.html",
    "FinOps Main Strategist":BASE_LOCAL / "finops-suite/finops-main-strategist.html",
    "Construction Hub":      BASE_LOCAL / "construction-suite/construction-hub.html",
    "Healthcare Command":    BASE_LOCAL / "healthcare-command.html",
}

SUITES = SUITES_REMOTE if REMOTE else SUITES_LOCAL
DEEP   = DEEP_REMOTE   if REMOTE else DEEP_LOCAL

# ── colours ───────────────────────────────────────────────────────────────────
G,R,Y,B,C,W,DIM,RST = "\033[92m","\033[91m","\033[93m","\033[94m","\033[96m","\033[97m","\033[2m","\033[0m"
PASS=f"{G}✓ PASS{RST}"; FAIL=f"{R}✗ FAIL{RST}"; WARN=f"{Y}⚠ WARN{RST}"; INFO=f"{B}ℹ INFO{RST}"

results = {"pass":0,"fail":0,"warn":0,"details":[]}

def log(status, cat, msg, detail=""):
    t={"PASS":PASS,"FAIL":FAIL,"WARN":WARN,"INFO":INFO}.get(status,INFO)
    print(f"  {t}  [{C}{cat}{RST}]  {msg}")
    if detail: print(f"        {DIM}{detail[:140]}{RST}")
    results["details"].append({"status":status,"category":cat,"msg":msg,"detail":detail})
    if status=="PASS": results["pass"]+=1
    elif status=="FAIL": results["fail"]+=1
    elif status=="WARN": results["warn"]+=1

def section(t):
    print(f"\n{W}{'─'*68}{RST}\n{W}  {t}{RST}\n{W}{'─'*68}{RST}")

# ── helpers ───────────────────────────────────────────────────────────────────
def read_html(path_or_url):
    if isinstance(path_or_url, Path):
        if path_or_url.exists() and path_or_url.is_file():
            return path_or_url.read_text(encoding="utf-8"), True
        return None, False
    r = requests.get(str(path_or_url), timeout=15,
                     headers={"User-Agent":"TSM-TestRunner/2.0"})
    return (r.text, True) if r.status_code == 200 else (None, False)

def to_file_url(p):
    return p.resolve().as_uri() if isinstance(p, Path) else str(p)

def detect_tab_pattern(html, soup):
    """
    Returns dict: {pattern, nav_sel, panel_sel, panel_prefix}
    Pattern A: .tab[data-tab]  →  #tab-X  (.view)
    Pattern B: .tnav-btn       →  #mod-X  (.module)
    Pattern C: .nav-btn        →  varies  (.active from tsm-engine)
    """
    nav_a = soup.find_all(class_="tab", attrs={"data-tab": True})
    nav_b = soup.find_all(class_="tnav-btn")
    nav_c = soup.find_all(class_="nav-btn")

    if nav_a:
        return {"pattern":"A","nav_sel":".tab[data-tab]","nav_els":nav_a,
                "panel_sel":"[id^='tab-']","panel_class":"view"}
    if nav_b:
        return {"pattern":"B","nav_sel":".tnav-btn","nav_els":nav_b,
                "panel_sel":"[id^='mod-']","panel_class":"module"}
    if nav_c:
        return {"pattern":"C","nav_sel":".nav-btn","nav_els":nav_c,
                "panel_sel":"[id^='tab-'],[id^='mod-'],[id^='panel-']","panel_class":"mixed"}
    return {"pattern":"NONE","nav_els":[],"nav_sel":None,"panel_sel":None,"panel_class":None}


# ══════════════════════════════════════════════════════════════════════════════
# 1. PAGE EXISTS
# ══════════════════════════════════════════════════════════════════════════════
def test_page_load():
    section("1 · PAGE EXISTENCE")
    all_pages = {**SUITES, **DEEP}
    for name, loc in all_pages.items():
        if isinstance(loc, Path):
            ok = loc.exists() and loc.is_file()
            log("PASS" if ok else "WARN", "File",
                f"{name}  {'exists ✓' if ok else 'NOT FOUND (check path)'}", str(loc))
        else:
            t0=time.time()
            try:
                r=requests.get(loc,timeout=15,headers={"User-Agent":"TSM-TestRunner/2.0"})
                ms=int((time.time()-t0)*1000)
                log("PASS" if r.status_code==200 else "FAIL","HTTP",
                    f"{name}  →  {r.status_code}  ({ms} ms)", loc)
            except Exception as e:
                log("FAIL","HTTP",f"{name}  →  error",str(e))


# ══════════════════════════════════════════════════════════════════════════════
# 2. MODULE LINK AUDIT
# ══════════════════════════════════════════════════════════════════════════════
def test_module_links():
    section("2 · MODULE LINK AUDIT")
    for suite_name, loc in SUITES.items():
        html, ok = read_html(loc)
        if not ok:
            log("WARN","Links",f"{suite_name}: could not read (skipping)"); continue
        soup = BeautifulSoup(html,"html.parser")
        links=[]
        for a in soup.find_all("a",href=True):
            h=a["href"]
            if h.startswith(("#","javascript","mailto","tel")): continue
            if isinstance(loc,Path):
                full = loc.parent / h
                links.append((a.get_text(strip=True) or h, full))
            else:
                links.append((a.get_text(strip=True) or h, urljoin(str(loc),h)))
        if not links:
            log("WARN","Links",f"{suite_name}: no outbound links found"); continue
        print(f"\n  {C}{suite_name}{RST}  ({len(links)} links)")
        ok_n=bad=0
        for label,target in links:
            if isinstance(target,Path):
                if target.exists(): ok_n+=1
                else:
                    bad+=1; log("FAIL","Link",f"  '{label}' missing",str(target))
            else:
                try:
                    rr=requests.head(str(target),timeout=8,allow_redirects=True,
                                     headers={"User-Agent":"TSM-TestRunner/2.0"})
                    if rr.status_code<400: ok_n+=1
                    else:
                        bad+=1; log("FAIL","Link",f"  '{label}'  →  {rr.status_code}",str(target))
                except Exception as e:
                    bad+=1; log("FAIL","Link",f"  '{label}'  →  error",str(e))
        log("PASS" if bad==0 else "FAIL","Links",
            f"{suite_name}: {ok_n}/{len(links)} links healthy")


# ══════════════════════════════════════════════════════════════════════════════
# 3. STATIC TAB & SCROLL ANALYSIS
# ══════════════════════════════════════════════════════════════════════════════
def test_tab_static():
    section("3 · TAB SWITCHING + SCROLL — STATIC ANALYSIS")

    SCROLL_ISSUES = [
        # (description, bad_pattern, fix_hint)
        ("overflow:hidden on .content without flex child scroll",
         r'\.content\s*\{[^}]*overflow\s*:\s*hidden',
         "Add overflow-y:auto to .view.active or inner scroll container"),
        ("height:100% on body without html height set",
         r'body\s*\{[^}]*height\s*:\s*100%',
         "Ensure html{height:100%} is also set"),
        ("min-height missing on flex children",
         r'flex\s*:\s*1(?!.*min-height)',
         "Add min-height:0 to flex:1 children to allow shrink"),
    ]

    for name, loc in DEEP.items():
        html, ok = read_html(loc)
        if not ok:
            log("WARN","Static",f"{name}: could not read (skipping)"); continue
        soup = BeautifulSoup(html,"html.parser")
        pat  = detect_tab_pattern(html, soup)

        print(f"\n  {C}{name}{RST}")

        # ── Tab pattern detection ──────────────────────────────────────────
        nav_count = len(pat["nav_els"])
        if nav_count == 0:
            log("WARN","TabPattern",
                f"  No nav buttons found — checked .tab[data-tab], .tnav-btn, .nav-btn")
        else:
            log("INFO","TabPattern",
                f"  Pattern {pat['pattern']}  ·  {nav_count} nav buttons  ({pat['nav_sel']})")

        # ── Panel containers ───────────────────────────────────────────────
        if pat["pattern"] == "A":
            panels = soup.find_all(id=re.compile(r"^tab-"))
            panel_label = "tab-* (.view)"
        elif pat["pattern"] == "B":
            panels = soup.find_all(id=re.compile(r"^mod-"))
            panel_label = "mod-* (.module)"
        else:
            panels = soup.find_all(id=re.compile(r"^(tab|mod|panel)-"))
            panel_label = "tab-/mod-/panel-*"

        log("INFO","Panels", f"  {len(panels)} {panel_label} containers found")

        if nav_count > 0 and len(panels) == 0:
            log("FAIL","Panels",
                f"  Nav buttons exist but NO panel containers found — tab switching will silently fail")
        elif nav_count > 0 and len(panels) != nav_count:
            log("WARN","Panels",
                f"  {nav_count} buttons vs {len(panels)} panels — mismatch may cause blank tabs")
        elif nav_count > 0:
            log("PASS","Panels", f"  Button/panel count matches ({nav_count}) ✓")

        # ── switchTab / switchMod JS present ──────────────────────────────
        if pat["pattern"] == "A":
            has_fn = bool(re.search(r"\.tab.*forEach|data-tab.*classList|switchTab", html))
            log("PASS" if has_fn else "FAIL","SwitchFn",
                f"  {'Pattern A switchTab JS found ✓' if has_fn else 'No tab-switching JS found — clicks will do nothing'}")
        elif pat["pattern"] == "B":
            has_fn = bool(re.search(r"function switchMod|switchMod\s*\(", html))
            log("PASS" if has_fn else "FAIL","SwitchFn",
                f"  {'switchMod() found ✓' if has_fn else 'switchMod() missing — buttons dead'}")
        elif pat["pattern"] == "C":
            has_fn = bool(re.search(r"nav-btn.*classList|tsm-engine|tsm-app-runtime", html, re.I))
            log("PASS" if has_fn else "WARN","SwitchFn",
                f"  {'nav-btn wiring found ✓' if has_fn else 'nav-btn found but no local wiring — may rely on tsm-app-runtime.js'}")

        # ── Active CSS rule ────────────────────────────────────────────────
        has_active_css = bool(re.search(r'\.active\s*\{[^}]*(display|flex|block)', html))
        if not has_active_css:
            log("WARN","CSS",
                "  No .active{display:...} rule — toggling .active class may have no visual effect")
        else:
            log("PASS","CSS","  .active CSS rule with display property present ✓")

        # ── Scroll / height layout checks ─────────────────────────────────
        shell_flex = bool(re.search(r'(\.shell|\.app-shell)\s*\{[^}]*flex', html))
        has_100vh  = bool(re.search(r'height\s*:\s*100vh', html))
        content_overflow = re.search(r'\.content\s*\{([^}]+)\}', html)
        view_overflow    = re.search(r'\.view\s*\{([^}]+)\}', html) or \
                           re.search(r'\.module\s*\{([^}]+)\}', html)

        if has_100vh and shell_flex:
            log("PASS","Layout","  100vh shell + flex column found ✓")
        elif has_100vh:
            log("WARN","Layout","  100vh present but no flex column on shell — may not fill height correctly")
        else:
            log("INFO","Layout","  No 100vh shell detected (may be scroll-based layout)")

        if content_overflow:
            css = content_overflow.group(1)
            if "overflow:hidden" in css.replace(" ","") or "overflow: hidden" in css:
                log("WARN","Scroll",
                    "  .content has overflow:hidden — inner panels need overflow-y:auto or content will be clipped")
            elif "overflow" in css:
                log("PASS","Scroll","  .content overflow property found ✓")

        if view_overflow:
            css = view_overflow.group(1)
            if "overflow-y:auto" in css.replace(" ","") or "overflow-y: auto" in css or \
               "overflow:auto" in css.replace(" ",""):
                log("PASS","Scroll","  Panel container has overflow-y:auto ✓")
            elif "overflow" in css:
                log("INFO","Scroll",f"  Panel overflow: {css.strip()[:60]}")
            else:
                log("WARN","Scroll",
                    "  Panel container has no overflow-y:auto — tall content will be clipped")

        # min-height:0 on flex:1 children
        flex1_minheight = re.findall(r'flex\s*:\s*1[^;}]*min-height\s*:\s*0', html)
        flex1_no_mh     = re.findall(r'flex\s*:\s*1(?![^;}]*min-height)', html)
        if flex1_no_mh and not flex1_minheight:
            log("WARN","Scroll",
                f"  {len(flex1_no_mh)} flex:1 element(s) without min-height:0 — Firefox/Safari may not scroll")
        elif flex1_minheight:
            log("PASS","Scroll","  flex:1 + min-height:0 found ✓")

        # ── Thin tab content ───────────────────────────────────────────────
        empty=[]
        for panel in panels:
            if len(panel.get_text(strip=True)) < 10:
                empty.append(panel.get("id","?"))
        if empty:
            log("WARN","Content",f"  Thin/empty panel content in: {', '.join(empty)}")
        elif panels:
            log("PASS","Content",f"  All {len(panels)} panels have content ✓")

        # ── Groq wiring ───────────────────────────────────────────────────
        has_groq = bool(re.search(r'groq-bridge|GroqBridge|/api/groq|/api/financial/query', html, re.I))
        has_api_key_modal = bool(re.search(r'GROQ AI|key-input|aiKey|groq.*key', html, re.I))
        if has_groq:
            log("PASS","Groq","  Groq bridge wired ✓")
        elif has_api_key_modal:
            log("PASS","Groq","  GROQ API key modal present ✓")
        else:
            log("INFO","Groq","  No Groq signals (may use shared groq-bridge.js via server)")


# ══════════════════════════════════════════════════════════════════════════════
# 4. PLAYWRIGHT LIVE TAB CLICK
# ══════════════════════════════════════════════════════════════════════════════
async def test_tabs_playwright():
    section("4 · TAB SWITCHING — LIVE BROWSER (Playwright)")

    # All 3 selector patterns, tried in order
    NAV_SELECTORS = [
        (".tab[data-tab]",      "Pattern A · .tab[data-tab]"),
        (".tnav-btn",           "Pattern B · .tnav-btn"),
        (".nav-btn",            "Pattern C · .nav-btn"),
    ]
    PANEL_JS = """() => {
        const sels = ['[id^="tab-"]','[id^="mod-"]','[id^="panel-"]'];
        const visible = [];
        for (const sel of sels) {
            document.querySelectorAll(sel).forEach(t => {
                const s = window.getComputedStyle(t);
                if (s.display !== 'none' && s.visibility !== 'hidden' && s.opacity !== '0') {
                    visible.push(t.id);
                }
            });
        }
        return visible;
    }"""

    # Check scroll overflow on visible panel
    SCROLL_JS = """(panelId) => {
        const el = document.getElementById(panelId);
        if (!el) return null;
        const s = window.getComputedStyle(el);
        return {
            overflowY: s.overflowY,
            scrollHeight: el.scrollHeight,
            clientHeight: el.clientHeight,
            isScrollable: el.scrollHeight > el.clientHeight
        };
    }"""

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx     = await browser.new_context(viewport={"width":1440,"height":900})
        page    = await ctx.new_page()

        for name, loc in DEEP.items():
            js_errors=[]
            page.on("pageerror", lambda e: js_errors.append(str(e)))
            url = to_file_url(loc)
            try:
                await page.goto(url, wait_until="networkidle", timeout=30000)
            except Exception as e:
                log("FAIL","Browser",f"{name}: load failed",str(e)); continue

            print(f"\n  {C}{name}{RST}")

            # ── Find which nav pattern this page uses ──────────────────────
            used_sel = None
            btns     = []
            for sel, label in NAV_SELECTORS:
                found = await page.query_selector_all(sel)
                if found:
                    btns     = found
                    used_sel = sel
                    log("INFO","Browser",f"  {len(found)} buttons via {label}")
                    break

            if not btns:
                log("WARN","Browser",
                    "  No nav buttons found with any known selector (.tab[data-tab], .tnav-btn, .nav-btn)")
                continue

            # ── Click each button and check panels ────────────────────────
            click_ok=scroll_ok=0
            for i, btn in enumerate(btns[:8]):
                label=(await btn.inner_text()).strip()[:30]
                try:
                    await btn.scroll_into_view_if_needed()
                    await btn.click()
                    await page.wait_for_timeout(350)

                    visible = await page.evaluate(PANEL_JS)
                    if visible:
                        click_ok+=1
                        # Check scroll on first visible panel
                        scroll_info = await page.evaluate(SCROLL_JS, visible[0])
                        if scroll_info:
                            if scroll_info["overflowY"] in ("auto","scroll","overlay"):
                                scroll_ok+=1
                                log("PASS","Click",
                                    f"  [{i+1}] '{label}'  →  {visible[0]}  scroll:{scroll_info['overflowY']} ✓")
                            else:
                                log("WARN","Click",
                                    f"  [{i+1}] '{label}'  →  {visible[0]}  overflow-y:{scroll_info['overflowY']} "
                                    f"scrollHeight:{scroll_info['scrollHeight']}px "
                                    f"{'⚠ CLIPPED' if scroll_info['isScrollable'] else ''}")
                        else:
                            log("PASS","Click",f"  [{i+1}] '{label}'  →  visible: {visible}")
                    else:
                        log("FAIL","Click",
                            f"  [{i+1}] '{label}'  →  NO visible panel after click — switchTab/switchMod may be broken")
                except Exception as ce:
                    log("FAIL","Click",f"  [{i+1}] '{label}'  →  {ce}")

            tot=min(len(btns),8)
            log("PASS" if click_ok==tot else ("WARN" if click_ok>0 else "FAIL"),
                "TabSummary",f"  {click_ok}/{tot} clicks showed a panel  ·  {scroll_ok}/{click_ok} had proper scroll")

            # ── JS errors ─────────────────────────────────────────────────
            if js_errors:
                for e in js_errors[:3]:
                    log("WARN","JSError",f"  {e[:140]}")
            else:
                log("PASS","JSErrors","  0 JS console errors ✓")

        await browser.close()


# ══════════════════════════════════════════════════════════════════════════════
# 5. AI / GROQ COMPONENT SCAN
# ══════════════════════════════════════════════════════════════════════════════
def test_ai_components():
    section("5 · GROQ / AI COMPONENT SCAN")
    AI_SIG = {
        "groq-bridge.js import":      r'src=["\'].*groq-bridge',
        "GroqBridge.ask() call":      r'GroqBridge\.ask\b',
        "/api/financial/query":       r'/api/financial/query',
        "/api/groq endpoint":         r'/api/groq\b',
        "GROQ AI key modal":          r'GROQ AI|groq.*key|key-input',
        "AI response panel":          r'ai-panel|ai-response|aiResponse',
        "Streaming (SSE)":            r'text/event-stream|EventSource',
        "Prompt / chat textarea":     r'(id|class)=["\'].*?(prompt|chat-input|user-input|user_input)',
        "Send / Ask button":          r'(id|class)=["\'].*?(send-btn|submit-btn|ask-btn|send_btn|ai-run-btn)',
        "data-tsm-action AI trigger": r'data-tsm-action=["\']run.*AI|runGroq|runAI',
    }
    for name, loc in DEEP.items():
        html, ok = read_html(loc)
        if not ok:
            log("WARN","AI",f"{name}: could not read"); continue
        print(f"\n  {C}{name}{RST}")
        found=[l for l,pat in AI_SIG.items() if re.search(pat, html, re.I)]
        if found:
            for f in found: log("PASS","AI",f"  {f}")
        else:
            log("INFO","AI","  No inline Groq signals — may rely on server-side groq-bridge.js")

        if re.search(r'groq-bridge|tsm-ai-client|tsm-app-runtime', html, re.I):
            log("PASS","Engine","  Shared AI engine script import detected ✓")


# ══════════════════════════════════════════════════════════════════════════════
# 6. GROQ API SMOKE TEST
# ══════════════════════════════════════════════════════════════════════════════
def test_api_smoke():
    section("6 · GROQ API SMOKE TEST")
    key = os.environ.get("GROQ_API_KEY","")
    if not key:
        log("WARN","API","No GROQ_API_KEY in env — skipping")
        log("INFO","API","Run: GROQ_API_KEY=gsk_... python3 tsm_suite_test.py --api")
        return
    try:
        r = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "llama3-8b-8192",
                "max_tokens": 20,
                "messages": [{"role":"user","content":"Reply: TSM OK"}]
            },
            timeout=20
        )
        if r.status_code == 200:
            text = r.json()["choices"][0]["message"]["content"]
            log("PASS","API",f"  Groq llama3-8b response: '{text.strip()}'")
        else:
            log("FAIL","API",f"  {r.status_code}", r.text[:200])
    except Exception as e:
        log("FAIL","API",str(e))


# ══════════════════════════════════════════════════════════════════════════════
# 7. SERVER ROUTE COVERAGE
# ══════════════════════════════════════════════════════════════════════════════
def test_server_routes():
    section("7 · SERVER ROUTE COVERAGE (server.js)")
    server_js = Path(__file__).parent / "server.js"
    if not server_js.exists():
        log("WARN","Routes","server.js not found at repo root"); return

    content = server_js.read_text(encoding="utf-8")
    EXPECTED_ROUTES = [
        ("/api/financial/query",    "FinOps Groq query endpoint"),
        ("/api/groq",               "Generic Groq passthrough"),
        ("/html/tsm-insurance",     "Insurance static serve"),
        ("/html/finops-suite",      "FinOps static serve"),
        ("/html/construction-suite","Construction static serve"),
        ("/html/healthcare",        "Healthcare static serve"),
        ("/html/music-command",     "Music Command static serve"),
    ]
    for route, label in EXPECTED_ROUTES:
        found = route in content
        log("PASS" if found else "WARN", "Routes",
            f"  {label}  ({route})" if found else f"  MISSING route: {route}  — {label}")


# ══════════════════════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════════════════════
async def main():
    t0  = time.time()
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    mode = "REMOTE (fly.dev)" if REMOTE else f"LOCAL ({BASE_LOCAL})"
    print(f"\n{W}{'═'*68}")
    print(f"  TSM SHELL SUITE TEST RUNNER v2  ·  {now}")
    print(f"  Mode: {mode}")
    print(f"{'═'*68}{RST}")

    test_page_load()
    test_module_links()
    test_tab_static()
    await test_tabs_playwright()
    test_ai_components()
    test_server_routes()
    if RUN_API: test_api_smoke()

    elapsed = round(time.time()-t0,1)
    section("SUMMARY")
    total = results["pass"]+results["fail"]+results["warn"]
    pct   = int(results["pass"]/total*100) if total else 0
    col   = G if results["fail"]==0 else (Y if results["fail"]<3 else R)

    print(f"\n  {G}PASS {results['pass']:>3}{RST}   {R}FAIL {results['fail']:>3}{RST}   {Y}WARN {results['warn']:>3}{RST}")
    print(f"  Score: {col}{pct}%{RST}  ·  {total} checks  ·  {elapsed}s\n")

    if results["fail"]:
        print(f"  {R}Failures:{RST}")
        for d in results["details"]:
            if d["status"]=="FAIL":
                print(f"    {R}✗{RST}  [{d['category']}]  {d['msg']}")
                if d["detail"]: print(f"       {DIM}{d['detail'][:120]}{RST}")

    if results["warn"]:
        print(f"\n  {Y}Warnings (non-fatal):{RST}")
        for d in results["details"]:
            if d["status"]=="WARN":
                print(f"    {Y}⚠{RST}  [{d['category']}]  {d['msg']}")

    print()
    sys.exit(0 if results["fail"]==0 else 1)

if __name__=="__main__":
    asyncio.run(main())

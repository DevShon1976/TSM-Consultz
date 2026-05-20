#!/usr/bin/env python3
"""
TSM Shell Suite Test Runner
Usage (in your Codespace):
  python3 tsm_suite_test.py              # tests against local html/ files
  python3 tsm_suite_test.py --remote     # tests against live Fly.dev
  python3 tsm_suite_test.py --api        # also run Anthropic API smoke test (needs ANTHROPIC_API_KEY)
"""

import asyncio, json, os, re, sys, time
from datetime import datetime
from pathlib import Path
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright

# ── config ───────────────────────────────────────────────────────
REMOTE      = "--remote" in sys.argv
RUN_API     = "--api"    in sys.argv
BASE_REMOTE = "https://tsm-shell.fly.dev"
BASE_LOCAL  = Path(__file__).parent / "html"      # adjust if needed

SUITES_REMOTE = {
    "Insurance Suite":  f"{BASE_REMOTE}/tsm-insurance/suite-index.html",
    "FinOps Suite":     f"{BASE_REMOTE}/finops-suite/suite-index.html",
    "Demo Launcher":    f"{BASE_REMOTE}/tsm-insurance/tsm-demo-launcher.html",
}
SUITES_LOCAL = {
    "Insurance Suite":  BASE_LOCAL / "tsm-insurance/suite-index.html",
    "FinOps Suite":     BASE_LOCAL / "finops-suite/suite-index.html",
    "Demo Launcher":    BASE_LOCAL / "tsm-insurance/tsm-demo-launcher.html",
}

DEEP_REMOTE = {
    "Ins Hub":               f"{BASE_REMOTE}/tsm-insurance/ins-hub.html",
    "Finops Main Strategist":f"{BASE_REMOTE}/finops-suite/finops-main-strategist.html",
    "Compliance":            f"{BASE_REMOTE}/tsm-insurance/compliance.html",
    "Finops Operations":     f"{BASE_REMOTE}/finops-suite/finops-operations.html",
}
DEEP_LOCAL = {
    "Ins Hub":               BASE_LOCAL / "tsm-insurance/ins-hub.html",
    "Finops Main Strategist":BASE_LOCAL / "finops-suite/finops-main-strategist.html",
    "Compliance":            BASE_LOCAL / "tsm-insurance/compliance.html",
    "Finops Operations":     BASE_LOCAL / "finops-suite/finops-operations.html",
}

SUITES = SUITES_REMOTE if REMOTE else SUITES_LOCAL
DEEP   = DEEP_REMOTE   if REMOTE else DEEP_LOCAL

# ── colours ──────────────────────────────────────────────────────
G,R,Y,B,C,W,DIM,RST = "\033[92m","\033[91m","\033[93m","\033[94m","\033[96m","\033[97m","\033[2m","\033[0m"
PASS=f"{G}✓ PASS{RST}"; FAIL=f"{R}✗ FAIL{RST}"; WARN=f"{Y}⚠ WARN{RST}"; INFO=f"{B}ℹ INFO{RST}"

results = {"pass":0,"fail":0,"warn":0,"details":[]}

def log(status, cat, msg, detail=""):
    t={"PASS":PASS,"FAIL":FAIL,"WARN":WARN,"INFO":INFO}.get(status,INFO)
    print(f"  {t}  [{C}{cat}{RST}]  {msg}")
    if detail: print(f"        {DIM}{detail[:120]}{RST}")
    results["details"].append({"status":status,"category":cat,"msg":msg,"detail":detail})
    if status=="PASS": results["pass"]+=1
    elif status=="FAIL": results["fail"]+=1
    elif status=="WARN": results["warn"]+=1

def section(t):
    print(f"\n{W}{'─'*64}{RST}\n{W}  {t}{RST}\n{W}{'─'*64}{RST}")

# ── helpers ──────────────────────────────────────────────────────
def read_html(path_or_url):
    """Read HTML from local Path or remote URL."""
    if isinstance(path_or_url, Path):
        if path_or_url.exists():
            return path_or_url.read_text(encoding="utf-8"), True
        return None, False
    r = requests.get(str(path_or_url), timeout=15,
                     headers={"User-Agent":"TSM-TestRunner/1.0"})
    return (r.text, True) if r.status_code == 200 else (None, False)

def to_file_url(p):
    return p.resolve().as_uri() if isinstance(p, Path) else str(p)

# ════════════════════════════════════════════════════════════════
# 1. PAGE EXISTS
# ════════════════════════════════════════════════════════════════
def test_page_load():
    section("1 · PAGE EXISTENCE")
    for name, loc in {**SUITES, **DEEP}.items():
        if isinstance(loc, Path):
            ok = loc.exists()
            log("PASS" if ok else "FAIL", "File",
                f"{name}  {'exists ✓' if ok else 'NOT FOUND'}", str(loc))
        else:
            t0=time.time()
            try:
                r=requests.get(loc,timeout=15,headers={"User-Agent":"TSM-TestRunner/1.0"})
                ms=int((time.time()-t0)*1000)
                log("PASS" if r.status_code==200 else "FAIL","HTTP",
                    f"{name}  →  {r.status_code}  ({ms} ms)", loc)
            except Exception as e:
                log("FAIL","HTTP",f"{name}  →  error",str(e))

# ════════════════════════════════════════════════════════════════
# 2. MODULE LINKS
# ════════════════════════════════════════════════════════════════
def test_module_links():
    section("2 · MODULE LINK AUDIT")
    for suite_name, loc in SUITES.items():
        html, ok = read_html(loc)
        if not ok:
            log("WARN","Links",f"{suite_name}: could not read"); continue
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
            log("WARN","Links",f"{suite_name}: no module links found"); continue
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
                                     headers={"User-Agent":"TSM-TestRunner/1.0"})
                    if rr.status_code<400: ok_n+=1
                    else:
                        bad+=1; log("FAIL","Link",f"  '{label}'  →  {rr.status_code}",str(target))
                except Exception as e:
                    bad+=1; log("FAIL","Link",f"  '{label}'  →  error",str(e))
        log("PASS" if bad==0 else "FAIL","Links",
            f"{suite_name}: {ok_n}/{len(links)} links healthy")

# ════════════════════════════════════════════════════════════════
# 3. STATIC TAB ANALYSIS
# ════════════════════════════════════════════════════════════════
def test_tab_static():
    section("3 · TAB SWITCHING — STATIC ANALYSIS")
    OLD_PAT   = r"el\.style\.setProperty\('display',\s*'none'"
    NEW_PAT   = r"el\.classList\.remove\('active'\)"
    INJECT    = r"el\.classList\.add\('active'\)"

    for name, loc in DEEP.items():
        html, ok = read_html(loc)
        if not ok:
            log("WARN","Static",f"{name}: could not read"); continue
        soup = BeautifulSoup(html,"html.parser")
        nav  = soup.find_all(class_=re.compile(r"nav-btn"))
        tabs = soup.find_all(id=re.compile(r"^tab-"))
        print(f"\n  {C}{name}{RST}")
        log("INFO","Structure",f"  nav-btn: {len(nav)}, tab-* divs: {len(tabs)}")

        if re.search(OLD_PAT,html) and not re.search(NEW_PAT,html):
            log("FAIL","switchTab",
                f"  OLD display:none pattern still present — apply switchTab fix!")
        elif re.search(NEW_PAT,html) or re.search(INJECT,html):
            log("PASS","switchTab",f"  classList.active pattern in use ✓")
        else:
            log("WARN","switchTab",
                f"  switchTab not found inline (may be in shared JS import)")

        has_css = bool(re.search(r'\.active\s*\{',html))
        if tabs and not has_css:
            log("WARN","CSS",f"  tab- divs present but no .active{{}} CSS rule found")
        elif has_css:
            log("PASS","CSS",f"  .active CSS rule present ✓")

        if tabs:
            ids=[d.get("id") for d in tabs]
            log("INFO","Tab IDs",f"  {', '.join(ids)}")

        # check each tab-div has displayable content
        empty=[]
        for d in tabs:
            if len(d.get_text(strip=True)) < 10:
                empty.append(d.get("id"))
        if empty:
            log("WARN","Content",f"  Thin tab content in: {', '.join(empty)}")
        elif tabs:
            log("PASS","Content",f"  All {len(tabs)} tab divs have content ✓")

# ════════════════════════════════════════════════════════════════
# 4. PLAYWRIGHT LIVE TAB CLICK
# ════════════════════════════════════════════════════════════════
async def test_tabs_playwright():
    section("4 · TAB SWITCHING — LIVE BROWSER (Playwright)")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx     = await browser.new_context()
        page    = await ctx.new_page()

        for name, loc in DEEP.items():
            js_errors=[]
            page.on("pageerror", lambda e, n=name: js_errors.append(str(e)))
            url = to_file_url(loc)
            try:
                await page.goto(url, wait_until="networkidle", timeout=30000)
            except Exception as e:
                log("FAIL","Browser",f"{name}: load failed",str(e)); continue
            print(f"\n  {C}{name}{RST}")

            btns = await page.query_selector_all(".nav-btn")
            if not btns:
                log("WARN","Browser",f"  No .nav-btn elements rendered"); continue
            log("INFO","Browser",f"  {len(btns)} nav-btn(s) found in DOM")

            click_ok=0
            for i, btn in enumerate(btns[:6]):
                label=(await btn.inner_text()).strip()[:30]
                try:
                    await btn.scroll_into_view_if_needed()
                    await btn.click(); await page.wait_for_timeout(300)
                    visible=await page.evaluate("""() => {
                        return Array.from(document.querySelectorAll('[id^="tab-"]'))
                            .filter(t=>{const s=window.getComputedStyle(t);
                                return s.display!=='none'&&s.visibility!=='hidden'&&s.opacity!=='0';})
                            .map(t=>t.id);
                    }""")
                    if visible:
                        click_ok+=1
                        log("PASS","Click",f"  [{i+1}] '{label}'  →  visible: {visible}")
                    else:
                        log("FAIL","Click",f"  [{i+1}] '{label}'  →  NO visible tab after click")
                except Exception as ce:
                    log("FAIL","Click",f"  [{i+1}] '{label}'  →  {ce}")

            tot=min(len(btns),6)
            log("PASS" if click_ok==tot else ("WARN" if click_ok>0 else "FAIL"),
                "TabSummary",f"  {click_ok}/{tot} tab clicks successful")

            if js_errors:
                for e in js_errors[:3]:
                    log("WARN","JSError",f"  {e[:120]}")
            else:
                log("PASS","JSErrors",f"  0 JS errors during tab testing ✓")

        await browser.close()

# ════════════════════════════════════════════════════════════════
# 5. AI COMPONENT DETECTION
# ════════════════════════════════════════════════════════════════
def test_ai_components():
    section("5 · AI / ANTHROPIC COMPONENT SCAN")
    AI_SIG={
        "Anthropic API endpoint": r"api\.anthropic\.com",
        "claude-sonnet model":    r"claude-sonnet",
        "claude-opus model":      r"claude-opus",
        "claude-haiku model":     r"claude-haiku",
        "/v1/messages call":      r"/v1/messages",
        "AI response container":  r"ai-response|aiResponse|ai_response",
        "Streaming (SSE)":        r"text/event-stream|EventSource",
        "Prompt / chat input":    r"(id|class)=['\"].*?(prompt|chat-input|user-input|user_input)",
        "Send / Ask button":      r"(id|class)=['\"].*?(send-btn|submit-btn|ask-btn|send_btn)",
        "Tool use / function":    r"tool_use|function_call|tools.*claude",
    }
    for name, loc in DEEP.items():
        html, ok = read_html(loc)
        if not ok:
            log("WARN","AI",f"{name}: could not read"); continue
        print(f"\n  {C}{name}{RST}")
        found=[l for l,pat in AI_SIG.items() if re.search(pat,html,re.I)]
        if found:
            for f in found: log("PASS","AI",f"  {f}")
        else:
            log("INFO","AI","  No inline AI signals (may be in shared tsm-engine.js)")

        # check for shared engine import
        if re.search(r"tsm-engine|global-engine|ai-engine",html,re.I):
            log("PASS","Engine","  Shared AI engine import detected ✓")

# ════════════════════════════════════════════════════════════════
# 6. ANTHROPIC API SMOKE (optional)
# ════════════════════════════════════════════════════════════════
def test_api_smoke():
    section("6 · ANTHROPIC API SMOKE TEST")
    key = os.environ.get("ANTHROPIC_API_KEY","")
    if not key:
        log("WARN","API","No ANTHROPIC_API_KEY in env — skipping live test")
        log("INFO","API","Run: ANTHROPIC_API_KEY=sk-... python3 tsm_suite_test.py --api")
        return
    try:
        r = requests.post("https://api.anthropic.com/v1/messages",
            headers={"x-api-key":key,"anthropic-version":"2023-06-01","content-type":"application/json"},
            json={"model":"claude-sonnet-4-20250514","max_tokens":20,
                  "messages":[{"role":"user","content":"Reply: TSM OK"}]},
            timeout=20)
        if r.status_code==200:
            text=r.json()["content"][0]["text"]
            log("PASS","API",f"  claude-sonnet response: '{text.strip()}'")
        else:
            log("FAIL","API",f"  {r.status_code}",r.text[:200])
    except Exception as e:
        log("FAIL","API",str(e))

# ════════════════════════════════════════════════════════════════
# MAIN
# ════════════════════════════════════════════════════════════════
async def main():
    t0  = time.time()
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    mode= "REMOTE (fly.dev)" if REMOTE else f"LOCAL ({BASE_LOCAL})"
    print(f"\n{W}{'═'*64}")
    print(f"  TSM SHELL SUITE TEST RUNNER  ·  {now}")
    print(f"  Mode: {mode}")
    print(f"{'═'*64}{RST}")

    test_page_load()
    test_module_links()
    test_tab_static()
    await test_tabs_playwright()
    test_ai_components()
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
                if d["detail"]: print(f"       {DIM}{d['detail'][:100]}{RST}")
    print()
    sys.exit(0 if results["fail"]==0 else 1)

if __name__=="__main__":
    asyncio.run(main())

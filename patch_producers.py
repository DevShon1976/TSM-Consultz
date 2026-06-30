#!/usr/bin/env python3
"""
TSM Exec Kit — Producer Patcher v2 (whitespace-robust)
Anchors on a single unique line via regex (not a multi-line exact block),
so CRLF/tabs/trailing-space differences can't cause a match failure.
Inserts the wip/explain block immediately before that line, using the
line's own detected indentation.

Run from repo root:
    python3 patch_producers.py --dry-run
    python3 patch_producers.py
"""

import os, re, sys, shutil

DRY_RUN = '--dry-run' in sys.argv

PATCHES = [
    {
        "name": "Insurance",
        "path": "html/tsm-insurance/insurance-strategist.html",
        "anchor": r"sessionStorage\.setItem\(\s*['\"]TSM_INS_STRAT_RELAY['\"]\s*,\s*JSON\.stringify\(relay\)\s*\)\s*;",
        "block": (
            "// ── TSM EXEC KIT: WIP + explainability ──────────────────────────\n"
            "try {\n"
            "  relay.wip = (window.TSMExecKitProducer && TSMExecKitProducer.buildWip([\n"
            "    { id:'ingest', label:'Document Ingestion', status:'done' },\n"
            "    { id:'nodes',  label:'4 Node Analysis',    status:'done' },\n"
            "    { id:'bnca',   label:'BNCA Synthesis',     status:'done', time: new Date().toLocaleTimeString() },\n"
            "    { id:'relay',  label:'Relayed to Exec',    status:'active', detail:'Awaiting executive review' }\n"
            "  ])) || [];\n"
            "  relay.explain = (window.TSMExecKitProducer && TSMExecKitProducer.buildExplain([\n"
            "    {\n"
            "      claim: (warRoomData?.docType || 'Claim') + ' — BNCA confidence ' + (overall?overall[1]:'78') + '%',\n"
            "      confidence: overall ? parseInt(overall[1]) : 78,\n"
            "      severity: (overall && parseInt(overall[1]) < 70) ? 'high' : 'med',\n"
            "      rationale: relay.summary || relay.narrative || relay.fullBrief || relay.brief || relay.bncaText || 'Synthesized from 4-node strategist analysis — see full brief for engine-by-engine detail.',\n"
            "      sources: ['Insurance Strategist — 4 Node Synthesis']\n"
            "    }\n"
            "  ])) || [];\n"
            "} catch(e) { console.warn('[exec-kit] producer patch error:', e); }\n"
            "// ── END TSM EXEC KIT ─────────────────────────────────────────────"
        ),
    },
    {
        "name": "Real Estate",
        "path": "html/reo-pro/re-strategist.html",
        "anchor": r"localStorage\.setItem\(\s*['\"]TSM_RE_WAR_RELAY['\"]\s*,\s*JSON\.stringify\(payload\)\s*\)\s*;\s*\n\s*sessionStorage\.setItem\(\s*['\"]TSM_RE_WAR_RELAY['\"]",
        "block": (
            "// ── TSM EXEC KIT: WIP + explainability ──────────────────────────\n"
            "try {\n"
            "  payload.wip = (window.TSMExecKitProducer && TSMExecKitProducer.buildWip([\n"
            "    { id:'docsearch',  label:'Document Search',   status:'done' },\n"
            "    { id:'warroom',    label:'War Room Analysis', status:'done' },\n"
            "    { id:'strategist', label:'Strategist Brief',  status:'done', time: new Date().toLocaleTimeString() },\n"
            "    { id:'exec',       label:'Executive Portal',  status:'active' }\n"
            "  ])) || [];\n"
            "  payload.explain = (window.TSMExecKitProducer && TSMExecKitProducer.buildExplain([\n"
            "    {\n"
            "      claim: payload.reportTitle || payload.docName || 'RE Strategist Brief',\n"
            "      confidence: payload.confidence || null,\n"
            "      severity: 'med',\n"
            "      impact: payload.exposure || '',\n"
            "      rationale: payload.fullBrief || payload.narrative || payload.summary || payload.brief || 'See full strategist brief for detailed reasoning.',\n"
            "      sources: ['RE Strategist']\n"
            "    }\n"
            "  ])) || [];\n"
            "} catch(e) { console.warn('[exec-kit] producer patch error:', e); }\n"
            "// ── END TSM EXEC KIT ─────────────────────────────────────────────"
        ),
    },
    {
        "name": "Legal (legal-pro — confirmed live)",
        "path": "html/legal-pro/legal-main-strategist.html",
        "anchor": r"sessionStorage\.setItem\(\s*['\"]TSM_STRATEGIST_RELAY['\"]\s*,\s*JSON\.stringify\(payload\)\s*\)\s*;",
        "block": (
            "// ── TSM EXEC KIT: WIP + explainability ──────────────────────────\n"
            "try {\n"
            "  payload.wip = (window.TSMExecKitProducer && TSMExecKitProducer.buildWip([\n"
            "    { id:'discovery',  label:'Discovery',        status:'done' },\n"
            "    { id:'warroom',    label:'War Room',         status:'done' },\n"
            "    { id:'strategist', label:'Strategist Synth', status:'done', time: new Date().toLocaleTimeString() },\n"
            "    { id:'exec',       label:'Executive Review', status:'active' }\n"
            "  ])) || [];\n"
            "  payload.explain = (window.TSMExecKitProducer && TSMExecKitProducer.buildExplain([\n"
            "    {\n"
            "      claim: (relayData?.matter || relayData?.docType || 'Matter') + ' — Strategist Synthesis',\n"
            "      confidence: null,\n"
            "      severity: 'med',\n"
            "      rationale: payload.summary || payload.narrative || relayData?.summary || relayData?.narrative || 'See strategist brief for full reasoning chain.',\n"
            "      sources: ['Legal Strategist']\n"
            "    }\n"
            "  ])) || [];\n"
            "} catch(e) { console.warn('[exec-kit] producer patch error:', e); }\n"
            "// ── END TSM EXEC KIT ─────────────────────────────────────────────"
        ),
    },
]

PRODUCER_SCRIPT_TAG = '<script src="/shared/tsm-exec-kit-producer.js"></script>'


def ensure_producer_script_included(html):
    if 'tsm-exec-kit-producer.js' in html:
        return html, False
    if '</body>' in html:
        html = html.replace('</body>', f'  {PRODUCER_SCRIPT_TAG}\n</body>', 1)
        return html, True
    return html, False


def get_indent(html, match_start):
    """Detect the indentation of the line containing match_start."""
    line_start = html.rfind('\n', 0, match_start) + 1
    line = html[line_start:match_start]
    indent_match = re.match(r'[ \t]*', line)
    return indent_match.group(0) if indent_match else ''


def patch_file(entry):
    path = entry['path']
    name = entry['name']

    if not os.path.exists(path):
        print(f"  ✗ NOT FOUND — skipping {name} ({path})")
        return False

    html = open(path, encoding='utf-8', newline='').read()

    if 'TSM EXEC KIT' in html:
        print(f"  ↩  ALREADY PATCHED — skipping {name}")
        return True

    m = re.search(entry['anchor'], html)
    if not m:
        print(f"  ⚠️  ANCHOR NOT FOUND — skipping {name}")
        print(f"      pattern: {entry['anchor'][:90]}...")
        return False

    indent = get_indent(html, m.start())
    block_lines = entry['block'].split('\n')
    indented_block = '\n'.join(indent + l if l else l for l in block_lines)

    insert_pos = html.rfind('\n', 0, m.start()) + 1
    html_patched = html[:insert_pos] + indented_block + '\n\n' + html[insert_pos:]

    html_patched, script_added = ensure_producer_script_included(html_patched)

    if DRY_RUN:
        print(f"  [DRY RUN] Would patch {name} → {path}")
        print(f"      Anchor matched at char {m.start()}, indent='{indent}'")
        print(f"      Producer script tag {'would be added' if script_added else 'already present'}")
        return True

    backup = path + '.bak-execkit'
    if not os.path.exists(backup):
        shutil.copy2(path, backup)

    open(path, 'w', encoding='utf-8', newline='').write(html_patched)
    print(f"  ✅ Patched: {name} → {path}")
    return True


def main():
    print("=" * 60)
    print("  TSM EXEC KIT — PRODUCER PATCHER v2 (whitespace-robust)")
    if DRY_RUN:
        print("  MODE: DRY RUN — no files will be written")
    print("=" * 60)

    if not os.path.exists("html/shared/tsm-exec-kit-producer.js"):
        print("\n⚠️  html/shared/tsm-exec-kit-producer.js not found.")
        print("   Copy tsm-exec-kit-producer.js into html/shared/ first.\n")

    ok = 0
    for entry in PATCHES:
        print(f"\n[{entry['name']}]")
        if patch_file(entry):
            ok += 1

    print(f"\n{'=' * 60}")
    print(f"  Done — {ok}/{len(PATCHES)} files {'checked' if DRY_RUN else 'patched'}")
    print(f"{'=' * 60}")

    if not DRY_RUN and ok:
        print("\nNext:")
        print("  1. Confirm html/shared/tsm-exec-kit-producer.js exists")
        print("  2. Run a war room → strategist → exec portal flow for each vertical")
        print("  3. git add html/ && git commit -m \"feat: producer-side wip+explain\" && git push")


if __name__ == '__main__':
    main()
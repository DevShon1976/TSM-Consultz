#!/usr/bin/env python3
"""
TSM Exec Kit — Producer Patcher Batch 2 (FinOps, Construction, HC)
Same whitespace-robust regex-anchor approach as patch_producers.py.
This batch adds support for:
  - Multiple anchor matches per file (FinOps has 2 setItem calls)
  - Inline object-literal injection (FinOps builds the payload inline
    inside JSON.stringify({...}) rather than via a `payload` variable)

Run from repo root:
    python3 patch_producers_batch2.py --dry-run
    python3 patch_producers_batch2.py
"""

import os, re, sys, shutil

DRY_RUN = '--dry-run' in sys.argv

# mode "before_line": insert `block` as standalone statements before the
#   matched line (used for Construction, HC — payload is a real variable)
# mode "after_brace": insert `block` as object-literal keys right after the
#   matched opening "{" (used for FinOps — payload is an inline literal).
#   `block` may reference {VAR} which is substituted with the regex's
#   captured group 1 (the variable holding the narrative text: _txt/output)

PATCHES = [
    {
        "name": "FinOps (finops-suite)",
        "path": "html/finops-suite/finops-main-strategist.html",
        "mode": "after_brace",
        "anchor": r"JSON\.stringify\(\{\s*\n\s*summary:\s*(_txt|output),",
        "find_all": True,
        "block_template": (
            "wip: (window.TSMExecKitProducer && TSMExecKitProducer.buildWip([\n"
            "  { id:'ingest',    label:'Document Ingestion', status:'done' },\n"
            "  { id:'extract',   label:'Field Extraction',   status:'done' },\n"
            "  { id:'synth',     label:'Strategist Synthesis', status:'done', time: new Date().toLocaleTimeString() },\n"
            "  { id:'relay',     label:'Relayed to Exec',    status:'active', detail:'Awaiting executive review' }\n"
            "])) || [],\n"
            "explain: (window.TSMExecKitProducer && TSMExecKitProducer.buildExplain([\n"
            "  {\n"
            "    claim: 'FinOps Exposure Analysis — ' + (typeof _expM !== 'undefined' && _expM ? _expM[1] : 'see brief'),\n"
            "    confidence: (typeof _riskM !== 'undefined' && _riskM) ? parseInt(_riskM[1]) : null,\n"
            "    severity: 'med',\n"
            "    rationale: {VAR} || 'See full strategist summary for detailed reasoning.',\n"
            "    sources: ['FinOps Strategist']\n"
            "  }\n"
            "])) || [],"
        ),
    },
    {
        "name": "Construction",
        "path": "html/construction-suite/construction-strategist.html",
        "mode": "before_line",
        "anchor": r"sessionStorage\.setItem\(\s*['\"]TSM_CONSTRUCTION_STRATEGIST_RELAY['\"]\s*,\s*JSON\.stringify\(payload\)\s*\)\s*;",
        "find_all": False,
        "block_template": (
            "// ── TSM EXEC KIT: WIP + explainability ──────────────────────────\n"
            "try {\n"
            "  payload.wip = (window.TSMExecKitProducer && TSMExecKitProducer.buildWip([\n"
            "    { id:'engines',    label:'Engine Analysis',     status:'done' },\n"
            "    { id:'strategist', label:'Strategist Synth',    status:'done', time: new Date().toLocaleTimeString() },\n"
            "    { id:'relay',      label:'Relayed to Exec',     status:'active', detail:'Awaiting executive review' }\n"
            "  ])) || [];\n"
            "  payload.explain = (window.TSMExecKitProducer && TSMExecKitProducer.buildExplain([\n"
            "    {\n"
            "      claim: (payload.scenario || payload.docType || 'Construction') + ' — Strategist Synthesis',\n"
            "      confidence: payload.confidence || null,\n"
            "      severity: 'med',\n"
            "      rationale: payload.summary || payload.narrative || payload.briefText || payload.brief || 'See full strategist brief for detailed reasoning.',\n"
            "      sources: ['Construction Strategist']\n"
            "    }\n"
            "  ])) || [];\n"
            "} catch(e) { console.warn('[exec-kit] producer patch error:', e); }\n"
            "// ── END TSM EXEC KIT ─────────────────────────────────────────────"
        ),
    },
    {
        "name": "Healthcare",
        "path": "html/healthcare/hc-main-strategist.html",
        "mode": "before_line",
        "anchor": r"sessionStorage\.setItem\(\s*['\"]TSM_EXEC_RELAY['\"]\s*,\s*JSON\.stringify\(payload\)\s*\)\s*;",
        "find_all": False,
        "block_template": (
            "// ── TSM EXEC KIT: WIP + explainability ──────────────────────────\n"
            "try {\n"
            "  payload.wip = (window.TSMExecKitProducer && TSMExecKitProducer.buildWip([\n"
            "    { id:'signals',    label:'Live Signal Capture', status:'done' },\n"
            "    { id:'strategist', label:'Main Strategist',     status:'done', time: new Date().toLocaleTimeString() },\n"
            "    { id:'relay',      label:'Relayed to Exec',     status:'active', detail:'Awaiting executive review' }\n"
            "  ])) || [];\n"
            "  payload.explain = (window.TSMExecKitProducer && TSMExecKitProducer.buildExplain([\n"
            "    {\n"
            "      claim: (payload.claimId ? 'Claim ' + payload.claimId : 'HC Strategist') + ' — Main Strategist Synthesis',\n"
            "      confidence: payload.confidence || null,\n"
            "      severity: 'med',\n"
            "      rationale: payload.summary || payload.narrative || payload.brief || 'See full strategist brief for detailed reasoning.',\n"
            "      sources: ['HC Main Strategist']\n"
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


def get_indent(html, pos):
    line_start = html.rfind('\n', 0, pos) + 1
    line = html[line_start:pos]
    m = re.match(r'[ \t]*', line)
    return m.group(0) if m else ''


def patch_file(entry):
    path = entry['path']
    name = entry['name']

    if not os.path.exists(path):
        print(f"  ✗ NOT FOUND — skipping {name} ({path})")
        return False

    html = open(path, encoding='utf-8', newline='').read()

    if 'TSM EXEC KIT' in html or 'TSMExecKitProducer.buildWip' in html:
        print(f"  ↩  ALREADY PATCHED — skipping {name}")
        return True

    matches = list(re.finditer(entry['anchor'], html))
    if not matches:
        print(f"  ⚠️  ANCHOR NOT FOUND — skipping {name}")
        print(f"      pattern: {entry['anchor'][:90]}...")
        return False

    if not entry['find_all']:
        matches = matches[:1]

    print(f"  Found {len(matches)} anchor match(es) for {name}")

    # Process matches in reverse so earlier offsets stay valid
    for m in reversed(matches):
        var = m.group(1) if m.groups() else None
        block = entry['block_template']
        if var:
            block = block.replace('{VAR}', var)

        if entry['mode'] == 'before_line':
            indent = get_indent(html, m.start())
            block_lines = block.split('\n')
            indented = '\n'.join(indent + l if l else l for l in block_lines)
            insert_pos = html.rfind('\n', 0, m.start()) + 1
            html = html[:insert_pos] + indented + '\n\n' + html[insert_pos:]

        elif entry['mode'] == 'after_brace':
            # insert right after the matched "{" (end of match minus the
            # captured var portion — match ends right after "summary: VAR,"
            # actually we want right after the "{" only, which is at the
            # start of the match's "{" char. Find it precisely:
            brace_pos = html.index('{', m.start(), m.end()) + 1
            indent = get_indent(html, m.start()) + '  '
            block_lines = block.split('\n')
            indented = '\n'.join(indent + l if l else l for l in block_lines)
            html = html[:brace_pos] + '\n' + indented + html[brace_pos:]

    html, script_added = ensure_producer_script_included(html)

    if DRY_RUN:
        print(f"  [DRY RUN] Would patch {name} → {path}")
        print(f"      Producer script tag {'would be added' if script_added else 'already present'}")
        return True

    backup = path + '.bak-execkit'
    if not os.path.exists(backup):
        shutil.copy2(path, backup)

    open(path, 'w', encoding='utf-8', newline='').write(html)
    print(f"  ✅ Patched: {name} → {path}")
    return True


def main():
    print("=" * 60)
    print("  TSM EXEC KIT — PRODUCER PATCHER BATCH 2")
    print("  (FinOps, Construction, Healthcare)")
    if DRY_RUN:
        print("  MODE: DRY RUN — no files will be written")
    print("=" * 60)

    if not os.path.exists("html/shared/tsm-exec-kit-producer.js"):
        print("\n⚠️  html/shared/tsm-exec-kit-producer.js not found.")
        print("   (Should already exist from batch 1 — if not, copy it into html/shared/)\n")

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
        print("  1. Run a war room → strategist → exec portal flow for FinOps, Construction, HC")
        print("  2. git add html/ && git commit -m \"feat: producer-side wip+explain batch 2\" && git push")


if __name__ == '__main__':
    main()
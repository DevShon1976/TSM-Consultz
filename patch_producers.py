#!/usr/bin/env python3
"""
TSM Exec Kit — Producer Patcher (one-shot)
Patches the priority strategist files to emit `wip` + `explain` on their
existing relay payload, using EXACT text matches captured from the scan —
not regex guessing. Each patch is a pure insertion: your existing setItem
call is untouched, just preceded by two new payload fields.

Uses fallback chains (payload.summary || payload.narrative || ...) so it
does NOT need to know your exact variable name in advance.

Run from repo root:
    python3 patch_producers.py --dry-run     # preview only
    python3 patch_producers.py               # apply + backup .bak-execkit
"""

import os, re, sys, shutil

DRY_RUN = '--dry-run' in sys.argv

# ════════════════════════════════════════════════════════════════════════
# Each entry: exact `old` text (must match file verbatim, whitespace and
# all) and the `new` text to replace it with. If `old` isn't found, the
# file is skipped with a warning — nothing is ever guessed or fuzzy-matched.
# ════════════════════════════════════════════════════════════════════════

PATCHES = [
    {
        "name": "Insurance",
        "path": "html/tsm-insurance/insurance-strategist.html",
        "old": (
            "      };\n"
            "      try{\n"
            "        sessionStorage.setItem('TSM_INS_STRAT_RELAY',JSON.stringify(relay));\n"
            "        localStorage.setItem('tsm_ins_strat_relay',JSON.stringify(relay));\n"
            "      }catch(e){}"
        ),
        "new": (
            "      };\n\n"
            "      // ── TSM EXEC KIT: WIP + explainability ──────────────────────────\n"
            "      try {\n"
            "        relay.wip = (window.TSMExecKitProducer && TSMExecKitProducer.buildWip([\n"
            "          { id:'ingest', label:'Document Ingestion', status:'done' },\n"
            "          { id:'nodes',  label:'4 Node Analysis',    status:'done' },\n"
            "          { id:'bnca',   label:'BNCA Synthesis',     status:'done', time: new Date().toLocaleTimeString() },\n"
            "          { id:'relay',  label:'Relayed to Exec',    status:'active', detail:'Awaiting executive review' }\n"
            "        ])) || [];\n"
            "        relay.explain = (window.TSMExecKitProducer && TSMExecKitProducer.buildExplain([\n"
            "          {\n"
            "            claim: (warRoomData?.docType || 'Claim') + ' — BNCA confidence ' + (overall?overall[1]:'78') + '%',\n"
            "            confidence: overall ? parseInt(overall[1]) : 78,\n"
            "            severity: (overall && parseInt(overall[1]) < 70) ? 'high' : 'med',\n"
            "            rationale: relay.summary || relay.narrative || relay.fullBrief || relay.brief || relay.bncaText || 'Synthesized from 4-node strategist analysis — see full brief for engine-by-engine detail.',\n"
            "            sources: ['Insurance Strategist — 4 Node Synthesis']\n"
            "          }\n"
            "        ])) || [];\n"
            "      } catch(e) { console.warn('[exec-kit] producer patch error:', e); }\n"
            "      // ── END TSM EXEC KIT ─────────────────────────────────────────────\n\n"
            "      try{\n"
            "        sessionStorage.setItem('TSM_INS_STRAT_RELAY',JSON.stringify(relay));\n"
            "        localStorage.setItem('tsm_ins_strat_relay',JSON.stringify(relay));\n"
            "      }catch(e){}"
        ),
    },
    {
        "name": "Real Estate",
        "path": "html/reo-pro/re-strategist.html",
        "old": (
            "    buildFullBrief();\n"
            "    const payload = buildStratPayload();\n"
            "    try {\n"
            "      localStorage.setItem('TSM_RE_WAR_RELAY', JSON.stringify(payload));\n"
            "      sessionStorage.setItem('TSM_RE_WAR_RELAY', JSON.stringify(payload));\n"
            "      localStorage.setItem('tsm_re_strat_payload', JSON.stringify(payload));\n"
            "      window.location.href = 're-exec-portal.html';\n"
            "    } catch(e) {\n"
            "      alert('Payload saved. Open re-exec-portal.html to continue.');\n"
            "    }"
        ),
        "new": (
            "    buildFullBrief();\n"
            "    const payload = buildStratPayload();\n\n"
            "    // ── TSM EXEC KIT: WIP + explainability ──────────────────────────\n"
            "    try {\n"
            "      payload.wip = (window.TSMExecKitProducer && TSMExecKitProducer.buildWip([\n"
            "        { id:'docsearch',  label:'Document Search',   status:'done' },\n"
            "        { id:'warroom',    label:'War Room Analysis', status:'done' },\n"
            "        { id:'strategist', label:'Strategist Brief',  status:'done', time: new Date().toLocaleTimeString() },\n"
            "        { id:'exec',       label:'Executive Portal',  status:'active' }\n"
            "      ])) || [];\n"
            "      payload.explain = (window.TSMExecKitProducer && TSMExecKitProducer.buildExplain([\n"
            "        {\n"
            "          claim: payload.reportTitle || payload.docName || 'RE Strategist Brief',\n"
            "          confidence: payload.confidence || null,\n"
            "          severity: 'med',\n"
            "          impact: payload.exposure || '',\n"
            "          rationale: payload.fullBrief || payload.narrative || payload.summary || payload.brief || 'See full strategist brief for detailed reasoning.',\n"
            "          sources: ['RE Strategist']\n"
            "        }\n"
            "      ])) || [];\n"
            "    } catch(e) { console.warn('[exec-kit] producer patch error:', e); }\n"
            "    // ── END TSM EXEC KIT ─────────────────────────────────────────────\n\n"
            "    try {\n"
            "      localStorage.setItem('TSM_RE_WAR_RELAY', JSON.stringify(payload));\n"
            "      sessionStorage.setItem('TSM_RE_WAR_RELAY', JSON.stringify(payload));\n"
            "      localStorage.setItem('tsm_re_strat_payload', JSON.stringify(payload));\n"
            "      window.location.href = 're-exec-portal.html';\n"
            "    } catch(e) {\n"
            "      alert('Payload saved. Open re-exec-portal.html to continue.');\n"
            "    }"
        ),
    },
    {
        "name": "Legal (root path)",
        "path": "html/legal-main-strategist.html",
        "old": (
            "          engines: relayData?.engines || {},\n"
            "          enginesCount: document.getElementById('kpi-engines').textContent\n"
            "        };\n"
            "        sessionStorage.setItem('TSM_STRATEGIST_RELAY', JSON.stringify(payload));"
        ),
        "new": (
            "          engines: relayData?.engines || {},\n"
            "          enginesCount: document.getElementById('kpi-engines').textContent\n"
            "        };\n\n"
            "        // ── TSM EXEC KIT: WIP + explainability ──────────────────────────\n"
            "        try {\n"
            "          payload.wip = (window.TSMExecKitProducer && TSMExecKitProducer.buildWip([\n"
            "            { id:'discovery',  label:'Discovery',        status:'done' },\n"
            "            { id:'warroom',    label:'War Room',         status:'done' },\n"
            "            { id:'strategist', label:'Strategist Synth', status:'done', time: new Date().toLocaleTimeString() },\n"
            "            { id:'exec',       label:'Executive Review', status:'active' }\n"
            "          ])) || [];\n"
            "          payload.explain = (window.TSMExecKitProducer && TSMExecKitProducer.buildExplain([\n"
            "            {\n"
            "              claim: (relayData?.matter || relayData?.docType || 'Matter') + ' — Strategist Synthesis',\n"
            "              confidence: null,\n"
            "              severity: 'med',\n"
            "              rationale: payload.summary || payload.narrative || relayData?.summary || relayData?.narrative || 'See strategist brief for full reasoning chain.',\n"
            "              sources: ['Legal Strategist']\n"
            "            }\n"
            "          ])) || [];\n"
            "        } catch(e) { console.warn('[exec-kit] producer patch error:', e); }\n"
            "        // ── END TSM EXEC KIT ─────────────────────────────────────────────\n\n"
            "        sessionStorage.setItem('TSM_STRATEGIST_RELAY', JSON.stringify(payload));"
        ),
    },
    {
        "name": "Legal (legal-pro path)",
        "path": "html/legal-pro/legal-main-strategist.html",
        "old": (
            "          engines: relayData?.engines || {},\n"
            "          enginesCount: document.getElementById('kpi-engines').textContent\n"
            "        };\n"
            "        sessionStorage.setItem('TSM_STRATEGIST_RELAY', JSON.stringify(payload));"
        ),
        "new": (
            "          engines: relayData?.engines || {},\n"
            "          enginesCount: document.getElementById('kpi-engines').textContent\n"
            "        };\n\n"
            "        // ── TSM EXEC KIT: WIP + explainability ──────────────────────────\n"
            "        try {\n"
            "          payload.wip = (window.TSMExecKitProducer && TSMExecKitProducer.buildWip([\n"
            "            { id:'discovery',  label:'Discovery',        status:'done' },\n"
            "            { id:'warroom',    label:'War Room',         status:'done' },\n"
            "            { id:'strategist', label:'Strategist Synth', status:'done', time: new Date().toLocaleTimeString() },\n"
            "            { id:'exec',       label:'Executive Review', status:'active' }\n"
            "          ])) || [];\n"
            "          payload.explain = (window.TSMExecKitProducer && TSMExecKitProducer.buildExplain([\n"
            "            {\n"
            "              claim: (relayData?.matter || relayData?.docType || 'Matter') + ' — Strategist Synthesis',\n"
            "              confidence: null,\n"
            "              severity: 'med',\n"
            "              rationale: payload.summary || payload.narrative || relayData?.summary || relayData?.narrative || 'See strategist brief for full reasoning chain.',\n"
            "              sources: ['Legal Strategist']\n"
            "            }\n"
            "          ])) || [];\n"
            "        } catch(e) { console.warn('[exec-kit] producer patch error:', e); }\n"
            "        // ── END TSM EXEC KIT ─────────────────────────────────────────────\n\n"
            "        sessionStorage.setItem('TSM_STRATEGIST_RELAY', JSON.stringify(payload));"
        ),
    },
]

PRODUCER_SCRIPT_TAG = '<script src="/shared/tsm-exec-kit-producer.js"></script>'


def ensure_producer_script_included(html, path):
    """Add the producer helper <script> tag before </body> if not present."""
    if 'tsm-exec-kit-producer.js' in html:
        return html, False
    if '</body>' in html:
        html = html.replace('</body>', f'  {PRODUCER_SCRIPT_TAG}\n</body>', 1)
        return html, True
    return html, False


def patch_file(entry):
    path = entry['path']
    name = entry['name']

    if not os.path.exists(path):
        print(f"  ✗ NOT FOUND — skipping {name} ({path})")
        return False

    html = open(path, encoding='utf-8').read()

    if 'TSM EXEC KIT' in html and entry['old'] not in html:
        print(f"  ↩  ALREADY PATCHED — skipping {name}")
        return True

    if entry['old'] not in html:
        print(f"  ⚠️  EXACT MATCH NOT FOUND — skipping {name}")
        print(f"      (file may have changed since the scan; re-run scan_relay_producers.py)")
        return False

    html_patched = html.replace(entry['old'], entry['new'], 1)
    html_patched, script_added = ensure_producer_script_included(html_patched, path)

    if DRY_RUN:
        print(f"  [DRY RUN] Would patch {name} → {path}")
        print(f"      Producer script tag {'would be added' if script_added else 'already present'}")
        return True

    backup = path + '.bak-execkit'
    if not os.path.exists(backup):
        shutil.copy2(path, backup)

    open(path, 'w', encoding='utf-8').write(html_patched)
    print(f"  ✅ Patched: {name} → {path}")
    return True


def main():
    print("=" * 60)
    print("  TSM EXEC KIT — PRODUCER PATCHER")
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
        print("  2. Run a war room → strategist → exec portal flow for each")
        print("     vertical and check the WIP tracker + explainability panel")
        print("  3. git add html/ && git commit -m \"feat: producer-side wip+explain\" && git push")


if __name__ == '__main__':
    main()
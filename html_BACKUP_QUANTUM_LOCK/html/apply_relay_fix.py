#!/usr/bin/env python3

"""

Applies the relay-to-strategist payload fix across 9 HC nodes.

hc-command is intentionally excluded (already has its own custom wiring, untouched here).

"""

import sys



ROOT = "html/healthcare"

CORRECT_TARGET = "/html/healthcare/hc-main-strategist.html"



RELAY_FN = """<script>

// ── TSM RELAY-TO-STRATEGIST (generic across HC nodes) ──

function relayToStrategist(nodeLabel) {

  try {

    var engineOutputs = {};

    document.querySelectorAll('.ai-res').forEach(function(el){

      var text = (el.textContent || '').trim();

      if (!text) return;

      if (/^>?\\s*(ai|intel workbench|enterprise bnca|leadership brief|report studio)\\b.*ready\\.?$/i.test(text)) return;

      if (/processing\\.\\.\\.$/i.test(text)) return;

      var label = (el.id || 'AI OUTPUT').replace(/-res$/i,'').replace(/[-_]/g,' ').toUpperCase();

      engineOutputs[label] = text;

    });



    var alerts = [];

    document.querySelectorAll('.alert-row').forEach(function(row){

      var pri = row.querySelector('.pri');

      var txt = row.querySelector('.alert-txt');

      var imp = row.querySelector('.alert-imp');

      if (txt) alerts.push('[' + (pri ? pri.textContent.trim() : '\\u2014') + '] ' + txt.textContent.trim() + (imp ? ' (' + imp.textContent.trim() + ')' : ''));

    });



    var kpis = [];

    document.querySelectorAll('.kpi').forEach(function(k){

      var val = k.querySelector('.kpi-val');

      var lbl = k.querySelector('.kpi-lbl');

      var sub = k.querySelector('.kpi-sub');

      if (val && lbl) kpis.push(lbl.textContent.trim() + ': ' + val.textContent.trim() + (sub ? ' \\u2014 ' + sub.textContent.trim() : ''));

    });



    var clientLine = '';

    if (typeof clientData !== 'undefined' && clientData) {

      try { clientLine = JSON.stringify(clientData).slice(0, 400); } catch (e) {}

    }



    var narrativeParts = [];

    if (kpis.length) narrativeParts.push('KPIs \\u2014 ' + kpis.join(' \\u00b7 '));

    if (alerts.length) narrativeParts.push('Active alerts \\u2014 ' + alerts.slice(0, 5).join(' | '));

    if (clientLine) narrativeParts.push('Client/claim context \\u2014 ' + clientLine);

    var narrative = narrativeParts.join('\\n\\n') || (nodeLabel + ' relay \\u2014 no live findings captured at time of relay.');



    if (!Object.keys(engineOutputs).length) engineOutputs[nodeLabel] = narrative;



    var payload = {

      sessionId: 'REL-' + Date.now().toString(36).toUpperCase(),

      timestamp: new Date().toISOString(),

      engineOutputs: engineOutputs,

      engine06: { narrative: narrative, recommendations: [] },

      documentMeta: { ingestType: nodeLabel, charCount: narrative.length }

    };



    sessionStorage.setItem('TSM_WAR_ROOM_BRIEF', JSON.stringify(payload));

  } catch (e) {

    console.error('[' + nodeLabel + '] relayToStrategist failed:', e);

  }

}

</script>

"""



# (folder, label, [(old, new, expected_count), ...])

JOBS = [

    ("hc-billing", "HC BILLING", [

        ("onclick=\"window.open('https://tsm-shell.fly.dev/html/healthcare/hc-main-strategist.html','_blank')\"",

         "onclick=\"relayToStrategist('HC BILLING');window.open('" + CORRECT_TARGET + "','_blank')\"", 2),

    ]),

    ("hc-compliance", "HC COMPLIANCE", [

        ("onclick=\"window.open('/healthcare/hc-main-strategist/index.html','_blank')\"",

         "onclick=\"relayToStrategist('HC COMPLIANCE');window.open('" + CORRECT_TARGET + "','_blank')\"", 1),

        ("onclick=\"window.location.href='/healthcare/hc-main-strategist/index.html'\"",

         "onclick=\"relayToStrategist('HC COMPLIANCE');window.location.href='" + CORRECT_TARGET + "'\"", 1),

    ]),

    ("hc-insurance", "HC INSURANCE", [

        ("onclick=\"window.open('/healthcare/hc-main-strategist/index.html','_blank')\"",

         "onclick=\"relayToStrategist('HC INSURANCE');window.open('" + CORRECT_TARGET + "','_blank')\"", 1),

        ("onclick=\"window.location.href='/healthcare/hc-main-strategist/index.html'\"",

         "onclick=\"relayToStrategist('HC INSURANCE');window.location.href='" + CORRECT_TARGET + "'\"", 1),

    ]),

    ("hc-medical", "HC MEDICAL", [

        ("onclick=\"window.location.href='/healthcare/hc-main-strategist/index.html'\"",

         "onclick=\"relayToStrategist('HC MEDICAL');window.location.href='" + CORRECT_TARGET + "'\"", 2),

    ]),

    ("hc-pharmacy", "HC PHARMACY", [

        ("onclick=\"window.open('/healthcare/hc-main-strategist/index.html','_blank')\"",

         "onclick=\"relayToStrategist('HC PHARMACY');window.open('" + CORRECT_TARGET + "','_blank')\"", 1),

        ("onclick=\"window.location.href='/healthcare/hc-main-strategist/index.html'\"",

         "onclick=\"relayToStrategist('HC PHARMACY');window.location.href='" + CORRECT_TARGET + "'\"", 1),

    ]),

    ("hc-grants", "HC GRANTS", [

        ("onclick=\"alert('Routing synchronized data profile to Core Strategist Workbench...')\"",

         "onclick=\"relayToStrategist('HC GRANTS');window.open('" + CORRECT_TARGET + "','_blank')\"", 1),

        ("onclick=\"runPreset('Execute multi-node systemic risk evaluation crossing federal grant unliquidated balances with operational clinical capacity benchmarks')\"",

         "onclick=\"relayToStrategist('HC GRANTS');window.location.href='" + CORRECT_TARGET + "'\"", 1),

    ]),

    ("hc-strategist", "HC STRATEGIST", [

        ("onclick=\"window.location.href='/healthcare/hc-main-strategist/index.html'\"",

         "onclick=\"relayToStrategist('HC STRATEGIST');window.location.href='" + CORRECT_TARGET + "'\"", 1),

    ]),

    ("hc-taxprep", "HC TAXPREP", [

        ("onclick=\"window.open('/healthcare/hc-main-strategist/index.html','_blank')\"",

         "onclick=\"relayToStrategist('HC TAXPREP');window.open('" + CORRECT_TARGET + "','_blank')\"", 1),

        ("onclick=\"window.location.href='/healthcare/hc-main-strategist/index.html'\"",

         "onclick=\"relayToStrategist('HC TAXPREP');window.location.href='" + CORRECT_TARGET + "'\"", 1),

    ]),

    ("hc-vendors", "HC VENDORS", [

        ("onclick=\"window.open('/healthcare/hc-main-strategist/index.html','_blank')\"",

         "onclick=\"relayToStrategist('HC VENDORS');window.open('" + CORRECT_TARGET + "','_blank')\"", 1),

        ("onclick=\"window.location.href='/healthcare/hc-main-strategist/index.html'\"",

         "onclick=\"relayToStrategist('HC VENDORS');window.location.href='" + CORRECT_TARGET + "'\"", 1),

    ]),

]



def main():

    errors = []

    for folder, label, replacements in JOBS:

        path = f"{ROOT}/{folder}/index.html"

        with open(path, "r", encoding="utf-8") as f:

            content = f.read()



        if "function relayToStrategist" in content:

            errors.append(f"{path}: relayToStrategist already present, skipping entire file")

            continue



        for old, new, expected in replacements:

            count = content.count(old)

            if count != expected:

                errors.append(f"{path}: expected {expected} occurrence(s) of pattern, found {count} -> {old[:70]}...")

                continue

            content = content.replace(old, new)



        body_count = content.count("</body>")

        if body_count != 1:

            errors.append(f"{path}: expected exactly 1 </body>, found {body_count}")

            continue

        content = content.replace("</body>", RELAY_FN + "</body>", 1)



        with open(path, "w", encoding="utf-8") as f:

            f.write(content)

        print(f"OK  {path}  (label={label})")



    if errors:

        print("\n--- ERRORS ---")

        for e in errors:

            print(e)

        sys.exit(1)



if __name__ == "__main__":

    main() 

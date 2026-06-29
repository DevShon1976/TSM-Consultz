#!/usr/bin/env bash
# =======================================
# TSM WAR ROOM PREP — ONE-SHOT PATCH
# Fixes dead BPO/Phase3 launch buttons (launchDocSearch bridge
# never gets read by tsm-doc-search-multi.html) + adds the
# explainability anchor in bpo-executive-portal.html.
#
# Run from repo root:
#   bash tsm_warroom_prep_patch.sh
#
# Safe by design: each patch only applies if its "old" text is
# found EXACTLY ONCE in the target file. If your local file has
# diverged (0 matches) or is ambiguous (2+ matches), that patch
# is SKIPPED and printed so you can apply it by hand instead of
# silently corrupting anything.
# =======================================
set -e

python3 << 'PYEOF'

def patch(path, old, new, label):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"❌ SKIP [{label}]: file not found: {path}")
        return False

    count = content.count(old)
    if count == 0:
        print(f"⚠️  SKIP [{label}]: pattern not found in {path} (file may have diverged — apply by hand)")
        return False
    if count > 1:
        print(f"⚠️  SKIP [{label}]: pattern found {count}x in {path} (not unique — apply by hand)")
        return False

    content = content.replace(old, new, 1)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"✅ APPLIED [{label}] -> {path}")
    return True

WRP  = 'html/war-room-prep.html'
EXEC = 'html/bpo/bpo-executive-portal.html'

# ---------------------------------------------------------------
# Edit 1 — BPO quick-launch buttons: point straight at the real
# pages instead of the dead launchDocSearch() query-string bridge
# ---------------------------------------------------------------
patch(WRP,
old="""    <div class="nav-subactions">
      <button class="nav-mini-btn" onclick="event.preventDefault(); launchDocSearch('bpo',{ entry:'situation-room', mode:'chain' })">
        Situation Room
      </button>
      <button class="nav-mini-btn" onclick="event.preventDefault(); launchDocSearch('bpo',{ entry:'strategist', mode:'chain' })">
        Strategist
      </button>
      <button class="nav-mini-btn" onclick="event.preventDefault(); launchDocSearch('bpo',{ entry:'executive-portal', mode:'chain' })">
        Exec Portal
      </button>
      <button class="nav-mini-btn" onclick="event.preventDefault(); launchDocSearch('bpo',{ entry:'explainability', mode:'chain' })">
        Explainability
      </button>
    </div>""",
new="""    <div class="nav-subactions">
      <button class="nav-mini-btn" onclick="event.preventDefault(); window.open('/html/bpo/bpo-situation-room.html','_blank')">
        Situation Room
      </button>
      <button class="nav-mini-btn" onclick="event.preventDefault(); window.open('/html/bpo/bpo-strategist.html','_blank')">
        Strategist
      </button>
      <button class="nav-mini-btn" onclick="event.preventDefault(); window.open('/html/bpo/bpo-executive-portal.html','_blank')">
        Exec Portal
      </button>
      <button class="nav-mini-btn" onclick="event.preventDefault(); window.open('/html/bpo/bpo-executive-portal.html#explainability','_blank')">
        Explainability
      </button>
    </div>""",
label="Edit 1: BPO quick-launch buttons")

# ---------------------------------------------------------------
# Edit 2 — Phase 3 button: same fix, simpler destination
# ---------------------------------------------------------------
patch(WRP,
old="""    <div class="nav-subactions">
      <button class="nav-mini-btn" onclick="event.preventDefault(); launchDocSearch('phase3',{ entry:'situation-room', mode:'phase3' })">
        Validate Chain
      </button>
    </div>""",
new="""    <div class="nav-subactions">
      <button class="nav-mini-btn" onclick="event.preventDefault(); window.open('/html/tsm-doc-search-multi.html','_blank')">
        Validate Chain
      </button>
    </div>""",
label="Edit 2: Phase 3 button")

# ---------------------------------------------------------------
# Edit 3 — remove the now-orphaned launchDocSearch()/TSM_WRP
# bridge block (nothing calls it once Edits 1-2 are applied)
# ---------------------------------------------------------------
patch(WRP,
old="""  toggle.classList.toggle('open', !isOpen);
}
// TSM WAR ROOM PREP → DOC SEARCH LAUNCH BRIDGE
// Makes War Room Prep an actual launcher, not just a narrative page.
window.TSM_WRP = {
  routes: {
    hc: 'healthcare',
    finops: 'finops',
    ins: 'insurance',
    con: 'construction',
    legal: 'legal',
    re: 'real-estate',
    bpo: 'bpo',
    phase3: 'phase3'
  },

  sectorMeta: {
    hc: {
      label: 'Healthcare',
      scenario: 'denial-appeal',
      recommendedAction: 'Escalate appeal package',
      explainability: {
        confidence: 89,
        evidence: ['EOB', 'Denial reason codes', 'Clinical notes', 'Prior auth record'],
        reasoning: 'Appeal path supported by clinical documentation, denial pattern, and reimbursement exposure.'
      }
    },
    finops: {
      label: 'FinOps',
      scenario: 'cloud-cost-anomaly',
      recommendedAction: 'Reallocate + remediate spend anomaly',
      explainability: {
        confidence: 87,
        evidence: ['Cloud billing exports', 'Tag coverage', 'RI utilization', 'Cost trend anomalies'],
        reasoning: 'The cost spike is concentrated in under-governed workloads with clear optimization paths.'
      }
    },
    ins: {
      label: 'Insurance',
      scenario: 'subrogation-review',
      recommendedAction: 'Pursue subrogation',
      explainability: {
        confidence: 88,
        evidence: ['Claim file', 'Liability notes', 'Policy language', 'Incident timeline'],
        reasoning: 'Liability indicators and recoverable expense patterns justify subrogation review.'
      }
    },
    con: {
      label: 'Construction',
      scenario: 'change-order-risk',
      recommendedAction: 'Approve controlled change order',
      explainability: {
        confidence: 84,
        evidence: ['Change order packet', 'Schedule impact', 'Cost variance', 'Vendor dependencies'],
        reasoning: 'Delay and dependency exposure outweigh rejection risk; controlled approval reduces project slippage.'
      }
    },
    legal: {
      label: 'Legal',
      scenario: 'evidence-prioritization',
      recommendedAction: 'Prioritize key evidence set',
      explainability: {
        confidence: 90,
        evidence: ['Contract clauses', 'Timeline exhibits', 'Witness statements', 'Regulatory notices'],
        reasoning: 'This evidence cluster best supports exposure reduction and litigation readiness.'
      }
    },
    re: {
      label: 'Real Estate',
      scenario: 'transaction-risk-review',
      recommendedAction: 'Escalate transaction risk review',
      explainability: {
        confidence: 85,
        evidence: ['Title packet', 'Lease abstracts', 'Inspection notes', 'Transaction timeline'],
        reasoning: 'The transaction contains enough timeline and document risk to warrant escalation before close.'
      }
    },
    bpo: {
      label: 'BPO',
      scenario: 'supplier-bankruptcy',
      title: 'Supplier Bankruptcy',
      exposure: '$8.2M',
      decisionWindow: '6 hours',
      recommendedAction: 'Activate Supplier B',
      explainability: {
        confidence: 91,
        evidence: ['Supplier Notice', 'Inventory Reports', 'Purchase Orders', 'Historical Events'],
        reasoning: 'Supplier B provides the strongest continuity path under the modeled 6-hour decision window.'
      }
    },
    phase3: {
      label: 'Phase 3',
      scenario: 'memory-sector-intel-validation',
      recommendedAction: 'Validate memory + sector intelligence handoff',
      explainability: {
        confidence: 86,
        evidence: ['Anomaly packets', 'Sector packs', 'Relay state', 'Cross-page payloads'],
        reasoning: 'The Phase 3 chain is ready for live validation of memory and sector-intelligence handoff behavior.'
      }
    }
  }
};

window.launchDocSearch = function(panelId, opts = {}) {
  const sector = TSM_WRP.routes[panelId] || panelId;
  const meta = TSM_WRP.sectorMeta[panelId] || {};
  const payload = {
    source: 'war-room-prep',
    panel: panelId,
    sector,
    mode: opts.mode || (panelId === 'bpo' ? 'chain' : 'warroom'),
    entry: opts.entry || 'situation-room',
    title: opts.title || meta.title || meta.label || sector,
    scenario: opts.scenario || meta.scenario || '',
    decisionWindow: opts.decisionWindow || meta.decisionWindow || '',
    exposure: opts.exposure || meta.exposure || '',
    recommendedAction: opts.recommendedAction || meta.recommendedAction || '',
    explainability: meta.explainability || null,
    ts: Date.now()
  };

  try {
    sessionStorage.setItem('tsmWarRoomLaunch', JSON.stringify(payload));
  } catch (e) {
    console.warn('Could not persist launch payload', e);
  }

  const qs = new URLSearchParams({
    sector: sector,
    mode: payload.mode,
    entry: payload.entry
  });

  if (payload.scenario) qs.set('scenario', payload.scenario);
  if (payload.title) qs.set('title', payload.title);

  window.location.href = '/html/tsm-doc-search-multi.html?' + qs.toString();
};

""",
new="""  toggle.classList.toggle('open', !isOpen);
}

""",
label="Edit 3: remove dead launchDocSearch/TSM_WRP block")

# ---------------------------------------------------------------
# Edit 4 — explainability anchor target in bpo-executive-portal.html
# ---------------------------------------------------------------
patch(EXEC,
old="""  <!-- BLOCK C: EXPLAINABILITY -->
  <div class="tb-block">""",
new="""  <!-- BLOCK C: EXPLAINABILITY -->
  <div class="tb-block" id="explainability">""",
label="Edit 4: explainability anchor")

print("\nReview before committing:")
print("  git diff -- html/war-room-prep.html html/bpo/bpo-executive-portal.html")
PYEOF
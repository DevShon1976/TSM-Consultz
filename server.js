const express = require('express');
const app = express();

app.get('/health', (req, res) => res.status(200).send('OK'));
app.get('/', (req, res) => res.status(200).send('TSM Shell Active'));

app.post('/api/cfo-chat', (req, res) => {
    res.json({ status: "success", narrative: "Logic Core Online." });
});

const PORT = process.env.PORT || 8080;
// CRITICAL: Must use '0.0.0.0' to accept Fly.io proxy traffic

// =====================================================
// TSM HC NODE AI QUERY ROUTE · NODE-SPECIFIC BNCA
// =====================================================
const HC_NODE_CONTEXTS = {
  OPERATIONS: {
    owner: "Operations Lead",
    top: "Intake, staffing, scheduling, and throughput pressure",
    why: "Operational drag increases patient wait time, staff burnout, delayed handoffs, and revenue-cycle timing risk.",
    actions: [
      "Rebalance intake queue and scheduling backlog.",
      "Review staff coverage by location and shift.",
      "Route vendor or room/equipment blockers to owner lane.",
      "Escalate unresolved throughput risk to HC Strategist."
    ]
  },
  MEDICAL: {
    owner: "Clinical Ops Lead",
    top: "Clinical backlog, provider load, documentation gaps, and no-show risk",
    why: "Clinical delays can affect patient outcomes, clean documentation, provider productivity, prior authorization readiness, and downstream billing.",
    actions: [
      "Review today’s patient list and high-risk follow-ups.",
      "Prioritize clinical task queue by urgency and patient impact.",
      "Route documentation gaps to provider or care coordination owner.",
      "Escalate unresolved clinical risk to HC Strategist."
    ]
  },
  BILLING: {
    owner: "Billing Lead / RCM Director",
    top: "Denial pressure, AR aging, claim defects, and payer inactivity",
    why: "Billing friction creates delayed reimbursement, avoidable write-offs, compliance exposure, and executive revenue risk.",
    actions: [
      "Scrub claim batch for missing documentation and code defects.",
      "Prioritize AR aging over 45 days and high-dollar denials.",
      "Create appeal packet for payer-specific denial codes.",
      "Escalate payer inactivity and stalled revenue to HC Strategist."
    ]
  },
  COMPLIANCE: {
    owner: "Compliance Officer",
    top: "HIPAA exposure, CMS/OIG risk, policy gaps, and audit readiness",
    why: "Compliance drift creates regulatory exposure, audit penalties, documentation risk, and leadership accountability concerns.",
    actions: [
      "Review PHI access logs and expired credentials.",
      "Generate audit packet for active policy gaps.",
      "Assign remediation owner and deadline.",
      "Escalate unresolved audit exposure to HC Strategist."
    ]
  },
  FINANCIAL: {
    owner: "Finance Director / CFO Lane",
    top: "Revenue risk, payer variance, reimbursement slowdown, and margin pressure",
    why: "Financial pressure becomes executive risk when AR, denial trends, contract underpayments, or cash-flow timing are not actively managed.",
    actions: [
      "Run payer variance and reimbursement recovery review.",
      "Match payer deposits against expected revenue.",
      "Model cash impact of reducing AR days.",
      "Escalate recovery plan to HC Strategist and Executive Portal."
    ]
  },
  INSURANCE: {
    owner: "Prior Auth Lead / Insurance Coordinator",
    top: "Eligibility misses, prior-auth aging, payer SLA risk, and authorization blockers",
    why: "Insurance friction delays clinical access, increases denial probability, and slows revenue timing.",
    actions: [
      "Verify eligibility for high-priority appointments.",
      "Review prior-auth aging by payer and deadline.",
      "Attach payer policy evidence to unresolved cases.",
      "Escalate payer SLA breach to HC Strategist."
    ]
  },
  PHARMACY: {
    owner: "Pharmacy Lead",
    top: "Medication access, refill queue, formulary mismatch, and pharmacy PA blockers",
    why: "Pharmacy delays affect care continuity, patient adherence, clinical outcomes, and authorization timing.",
    actions: [
      "Review refill queue and access blockers.",
      "Check formulary and payer authorization requirements.",
      "Flag restock or supply dependency risk.",
      "Escalate medication access issue to HC Strategist."
    ]
  },
  VENDORS: {
    owner: "Vendor Manager / Supply Chain Lead",
    top: "Vendor SLA exceptions, supply blockers, contract gaps, and invoice friction",
    why: "Vendor delays can affect room readiness, clinical throughput, cost control, and operational continuity.",
    actions: [
      "Review vendor SLA exceptions and supply blockers.",
      "Check certificate, contract, or invoice exceptions.",
      "Assign procurement owner and deadline.",
      "Escalate unresolved vendor risk to HC Strategist."
    ]
  },
  LEGAL: {
    owner: "Legal Ops Lead / Contract Manager",
    top: "Contract risk, credentialing blockers, documentation exposure, and legal escalation",
    why: "Legal exceptions can block payer workflows, provider readiness, compliance posture, and operational continuity.",
    actions: [
      "Review expiring or disputed contracts.",
      "Check credentialing and documentation queue.",
      "Sync compliance flags to legal review.",
      "Escalate unresolved legal risk to HC Strategist."
    ]
  },
  GRANTS: {
    owner: "Grants Manager",
    top: "Grant deadlines, reporting gaps, eligibility risk, and funding continuity",
    why: "Missed grant reporting or eligibility gaps can create funding loss, compliance risk, and program sustainability issues.",
    actions: [
      "Track open reports and upcoming deadlines.",
      "Review eligibility and documentation readiness.",
      "Generate grant compliance report.",
      "Escalate overdue funding risk to HC Strategist."
    ]
  },
  TAXPREP: {
    owner: "Tax Prep Lead / Controller",
    top: "1099 readiness, W-9 gaps, filing windows, and vendor documentation exposure",
    why: "Tax prep gaps can create filing delays, audit support issues, vendor compliance exposure, and finance close friction.",
    actions: [
      "Review W-9 gaps and 1099 readiness.",
      "Prepare vendor documentation packet.",
      "Check deadline and filing window risk.",
      "Escalate unresolved filing blockers to HC Strategist."
    ]
  },
  STRATEGIST: {
    owner: "HC Strategist",
    top: "Cross-node unresolved risk and executive prioritization",
    why: "Strategist converts fragmented node signals into ranked operational action, owner lanes, and executive visibility.",
    actions: [
      "Rank unresolved blockers by financial and operational impact.",
      "Assign owner lane and escalation deadline.",
      "Create executive BNCA summary.",
      "Push unresolved risk to Main Strategist or Executive Portal."
    ]
  }
};

function normalizeHCNode(input){
  const raw = String(input || "").toUpperCase().replace(/[^A-Z]/g,"");
  if(raw.includes("BILL")) return "BILLING";
  if(raw.includes("MED")) return "MEDICAL";
  if(raw.includes("COMP")) return "COMPLIANCE";
  if(raw.includes("FIN")) return "FINANCIAL";
  if(raw.includes("INS")) return "INSURANCE";
  if(raw.includes("PHARM")) return "PHARMACY";
  if(raw.includes("VENDOR")) return "VENDORS";
  if(raw.includes("LEGAL")) return "LEGAL";
  if(raw.includes("GRANT")) return "GRANTS";
  if(raw.includes("TAX")) return "TAXPREP";
  if(raw.includes("STRATEG")) return "STRATEGIST";
  if(raw.includes("OPS") || raw.includes("OPER")) return "OPERATIONS";
  return "OPERATIONS";
}

function hcFallbackBNCA(node, tab, context){
  const key = normalizeHCNode(node);
  const c = HC_NODE_CONTEXTS[key] || HC_NODE_CONTEXTS.OPERATIONS;
  const prompt = typeof context === "string" ? context : JSON.stringify(context || {});
  return `TOP ISSUE
${c.top}

CURRENT REQUEST
${prompt || "Run node analysis for current tab."}

WHY IT MATTERS
${c.why}

BEST NEXT ACTIONS
${c.actions.map((a,i)=>`${i+1}. ${a}`).join("\n")}

OWNER LANE
${c.owner}

HITL DECISION
Human operator should approve the next action, confirm ownership, and decide whether to relay unresolved risk to HC Strategist.

STRATEGIST RELAY
Send node=${key}, tab=${tab || "Current View"}, owner="${c.owner}", priority=HIGH if unresolved in the current operating window.

CONFIDENCE
92%`;
}

async function hcLiveAI(body){
  const payload = body.payload || body || {};
  const node = normalizeHCNode(payload.node || body.node || payload.app || "");
  const tab = payload.tab || body.tab || "Current View";
  const context = payload.context || body.context || body.message || body.prompt || "Run healthcare node analysis.";
  const system = `You are TSM Healthcare Strategist Engine.
Return healthcare operations intelligence for the exact node and tab.

Format exactly:
TOP ISSUE
...

WHY IT MATTERS
...

BEST NEXT ACTIONS
1.
2.
3.
4.

OWNER LANE
...

HITL DECISION
...

STRATEGIST RELAY
...

CONFIDENCE
...%`;

  const user = `NODE: ${node}
TAB: ${tab}
CONTEXT: ${typeof context === "string" ? context : JSON.stringify(context,null,2)}

Use node-specific healthcare operations logic. Do not give generic operations output unless the node is OPERATIONS.`;

  // Try local TSM Neural Core first
  try{
    const r = await fetch("http://127.0.0.1:5300/ai/chat",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({message: `${system}\n\n${user}`, node, tab, mode:"hc_node_bnca"}),
      signal:AbortSignal.timeout(9000)
    });
    const d = await r.json();
    const reply = d.reply || d.content || d.analysis || d.answer || d.message;
    if(reply && !/unavailable|route not found|error/i.test(reply)) return reply;
  }catch(e){}

  // Then direct Groq if configured
  if(process.env.GROQ_API_KEY){
    try{
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions",{
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "Authorization":"Bearer "+process.env.GROQ_API_KEY
        },
        body:JSON.stringify({
          model:process.env.TSM_HC_MODEL || process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
          messages:[
            {role:"system",content:system},
            {role:"user",content:user}
          ],
          temperature:0.18,
          max_tokens:900
        }),
        signal:AbortSignal.timeout(14000)
      });
      const d = await r.json();
      const reply = d?.choices?.[0]?.message?.content;
      if(reply) return reply;
    }catch(e){}
  }

  return hcFallbackBNCA(node, tab, context);
}

if(!globalThis.__TSM_HC_QUERY_ROUTE_INSTALLED__){
  globalThis.__TSM_HC_QUERY_ROUTE_INSTALLED__ = true;

  app.get("/api/hc/query",(req,res)=>{
    res.json({ok:true,route:"/api/hc/query",method:"POST required",status:"HC node AI route ready"});
  });

  app.post("/api/hc/query",async(req,res)=>{
    try{
      const payload=req.body?.payload || req.body || {};
      const node=normalizeHCNode(payload.node || req.body?.node || "");
      const tab=payload.tab || req.body?.tab || "Current View";
      const reply=await hcLiveAI(req.body || {});
      res.json({ok:true,node,tab,reply,content:reply,ts:new Date().toISOString()});
    }catch(e){
      const payload=req.body?.payload || req.body || {};
      const node=normalizeHCNode(payload.node || req.body?.node || "");
      const tab=payload.tab || req.body?.tab || "Current View";
      const reply=hcFallbackBNCA(node,tab,payload.context || req.body?.context || "");
      res.json({ok:true,node,tab,reply,content:reply,fallback:true,error:String(e.message||e),ts:new Date().toISOString()});
    }
  });

  app.get("/api/hc/strategist-rollup",(req,res)=>{
    res.json({
      ok:true,
      open:42,
      high:7,
      sla:11,
      executive:"HC STRATEGIST ROLLUP\n\nTOP ISSUE\nCross-node operational risk remains active across revenue cycle, staffing, clinical documentation, and compliance.\n\nBEST NEXT ACTIONS\n1. Prioritize billing denial pressure.\n2. Rebalance operations staffing and intake queue.\n3. Assign compliance owner for audit gaps.\n4. Push unresolved items to Executive Portal.\n\nCONFIDENCE\n92%",
      ts:new Date().toISOString()
    });
  });
}
// =====================================================

app.listen(PORT, '0.0.0.0', () => {
    console.log(`TSM-SHELL: Listening on 0.0.0.0:${PORT}`);
});

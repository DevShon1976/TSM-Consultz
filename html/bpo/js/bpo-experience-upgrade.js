(function(){
  if(window.__TSM_BPO_EXPERIENCE_UPGRADE__) return;
  window.__TSM_BPO_EXPERIENCE_UPGRADE__ = true;

  function sector(){
    var p = location.pathname.toLowerCase();
    if(p.indexOf("construction")>-1) return "ConstructionOps";
    if(p.indexOf("healthcare")>-1) return "HealthcareOps";
    if(p.indexOf("finops")>-1) return "FinOps";
    if(p.indexOf("legal")>-1) return "LegalOps";
    if(p.indexOf("tax")>-1) return "TaxOps";
    if(p.indexOf("rrd")>-1) return "RRD";
    return "BPO";
  }

  function css(){
    if(document.getElementById("tsm-bpo-experience-css")) return;
    var s=document.createElement("style");
    s.id="tsm-bpo-experience-css";
    s.textContent =
      ".tsm-exp-wrap{max-width:1280px;margin:22px auto;padding:0 18px;color:#e8f7ff;font-family:Inter,system-ui,Arial}" +
      ".tsm-exp-head,.tsm-exp-card{background:rgba(7,16,23,.96);border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:18px;margin-bottom:14px}" +
      ".tsm-exp-head h2{color:#00ffc6;margin:0 0 8px;font-size:28px}" +
      ".tsm-exp-head p{color:#9fb8c8;margin:0;line-height:1.5}" +
      ".tsm-exp-actions{display:flex;gap:10px;flex-wrap:wrap;margin:14px 0}" +
      ".tsm-exp-actions button{background:#00ffc6;color:#001;border:0;border-radius:10px;padding:11px 14px;font-weight:900;cursor:pointer}" +
      ".tsm-exp-actions button.alt{background:#0b1722;color:#dff7ff;border:1px solid rgba(255,255,255,.16)}" +
      ".tsm-exp-output{white-space:pre-wrap;background:#030913;border:1px solid rgba(255,255,255,.14);border-left:3px solid #00ffc6;border-radius:12px;padding:15px;color:#dff7ff;line-height:1.55;min-height:135px;margin-top:10px}" +
      ".tsm-exp-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}" +
      ".tsm-exp-card h3{margin:0 0 10px;color:#00ffc6;font-size:13px;letter-spacing:.14em;text-transform:uppercase}" +
      ".tsm-exp-card li{margin:8px 0;color:#bfd2df;font-size:13px;line-height:1.35}" +
      ".tsm-exp-pill{display:inline-block;border:1px solid rgba(255,255,255,.14);border-radius:999px;padding:7px 10px;margin:4px;color:#dff7ff;background:rgba(255,255,255,.03);font-size:12px}" +
      ".tsm-exp-feed li{animation:tsmPulse 4s infinite}" +
      "@keyframes tsmPulse{0%{opacity:.72}50%{opacity:1}100%{opacity:.72}}" +
      "@media(max-width:900px){.tsm-exp-grid{grid-template-columns:1fr}}";
    document.head.appendChild(s);
  }

  var DATA = {
    ConstructionOps:{
      queue:["Permit revision pending","CO #7 awaiting PM approval","Lien waiver missing","Fastener delay notice unresolved","Inspection failed — electrical"],
      owners:["Permit Queue → Project Engineer","Billing Risk → Finance Ops","Safety Escalation → Compliance","Subcontractor Holdback → PM Office"],
      impact:["$182K delayed billing exposure","$94K retainage risk","14-day permit delay risk","$61K unresolved CO exposure"],
      docs:["permit-foundation.pdf → permit escalation","change-order-7.pdf → billing variance","Subcontractor_Final_Lien_Waiver.pdf → lien risk","GL_Extract_Q1.csv → reconciliation issue"],
      deltas:["Permit approvals +11%","Billing backlog -8%","CO processing speed +17%","Safety exposure -11%"]
    },
    HealthcareOps:{
      queue:["14 claims pending appeal","Prior auth aging exceeds SLA","CPT drift detected","AR aging above threshold","Payer denial cluster active"],
      owners:["Prior Auth → RCM Lead","Denials → Revenue Integrity","CPT Review → Coding Manager","Compliance → Office Manager"],
      impact:["$189K AR exposure","$62K auth risk","18.4% denial pressure","30-day appeal window risk"],
      docs:["denial letter → appeal action","eligibility notes → payer rule check","claim export → AR risk","prior-auth packet → missing evidence"],
      deltas:["Claims processed +14%","Denials reduced -6%","Auth backlog -9%","Clean claim rate +4%"]
    },
    FinOps:{
      queue:["AP invoices awaiting approval","Bank reconciliation gap open","Vendor variance detected","Close checklist incomplete","1099 readiness flagged"],
      owners:["AP Queue → Staff Accountant","Recon → Controller","Close Blocker → Finance Manager","Audit Evidence → Compliance"],
      impact:["$480K grant restriction exposure","$18.4K AR at risk","12 invoices pending","6 access gaps"],
      docs:["GL extract → variance check","invoice workbook → AP aging","expenditure log → restriction review","approval packet → policy gap"],
      deltas:["Manual review -12%","AP backlog -8%","Recon speed +16%","Audit evidence +9%"]
    },
    LegalOps:{
      queue:["3 filing deadlines inside 7 days","Matter invoice approval pending","Discovery packet missing exhibit","Contract risk review open","Client status brief needed"],
      owners:["Matter Queue → Legal Ops","Billing WIP → Attorney Owner","Discovery → Paralegal","Compliance → Managing Partner"],
      impact:["$22.5K unbilled WIP","7-day filing risk","3 exhibit gaps","1 client escalation pending"],
      docs:["engagement packet → matter intake","billing export → unbilled WIP","contract sample → clause risk","discovery packet → exhibit gap"],
      deltas:["Matter backlog -7%","Billing packet +12%","Deadline coverage +9%","Client briefs +3"]
    },
    TaxOps:{
      queue:["Missing K-1 packet","W-9 vendor gap open","IRS notice deadline approaching","Extension tracker active","1099 threshold review pending"],
      owners:["Tax Intake → Admin","Missing Docs → Client Coordinator","IRS Notice → Reviewer","Entity Compliance → Tax Manager"],
      impact:["$39K filing exposure","22 open tax items","5 aging over SLA","3 notice deadlines"],
      docs:["organizer → missing docs","1099 packet → threshold review","K-1 tracker → client follow-up","IRS notice → deadline action"],
      deltas:["Missing docs -10%","Returns ready +8%","Notice queue -2","Reviewer routing +13%"]
    },
    RRD:{
      queue:["Charge-off review open","Payment dispute aging","Legal referral candidate","Recovery package incomplete","Owner assignment pending"],
      owners:["Recovery Queue → Collections Lead","Legal Referral → Legal Ops","Payment Dispute → Account Owner","Portfolio Rollup → Executive Sponsor"],
      impact:["$220K charge-off exposure","87% prevention target","6.4% legal referral rate","14.2 avg days to resolve"],
      docs:["payment history → recovery scoring","legal status → referral path","portfolio WIP → owner lane","stage notes → next action"],
      deltas:["Recovery actions +11%","Charge-off risk -6%","Owner assignment +15%","Docs processed +22"]
    }
  };

  function ul(arr, cls){
    return "<ul" + (cls ? " class='" + cls + "'" : "") + ">" + arr.map(function(x){return "<li>" + x + "</li>";}).join("") + "</ul>";
  }

  function run(mode){
    var name=sector();
    var d=DATA[name] || DATA.ConstructionOps;
    var out=document.getElementById("tsm-exp-output");
    if(!out) return;

    out.textContent =
      mode.toUpperCase() + " MODE ACTIVE\n\n" +
      "TOP ISSUE\n" +
      d.queue[0] + "\n\n" +
      "WHY IT MATTERS\n" +
      d.impact[0] + " requires owner-lane action before it becomes leakage, delay, or compliance exposure.\n\n" +
      "BEST NEXT ACTIONS\n" +
      "1. Assign accountable owner.\n" +
      "2. Validate supporting document evidence.\n" +
      "3. Clear blockers older than SLA.\n" +
      "4. Generate client-ready executive brief.\n" +
      "5. Relay unresolved exposure to Strategist.\n\n" +
      "OWNER LANE\n" +
      d.owners[0] + "\n\n" +
      "EXECUTIVE TALK TRACK\n" +
      "The system is showing active operational exposure in " + name + ". TSM identifies what is open, what is aging, who owns it, what is financially exposed, and what needs action today.";
  }

  function build(){
    if(document.getElementById("tsm-bpo-experience-layer")) return;
    css();

    var name=sector();
    var d=DATA[name] || DATA.ConstructionOps;

    var wrap=document.createElement("section");
    wrap.id="tsm-bpo-experience-layer";
    wrap.className="tsm-exp-wrap";
    wrap.innerHTML =
      "<div class='tsm-exp-head'>" +
        "<h2>" + name + " AI Operating Layer</h2>" +
        "<p>Operational, executive-readable, workflow-driven, ownership-focused, and escalation-oriented. Use this layer to show live queue movement, document-to-action intelligence, owner lanes, and BNCA next actions.</p>" +
        "<div class='tsm-exp-actions'>" +
          "<button data-mode='executive'>Generate Executive Talk Track</button>" +
          "<button class='alt' data-mode='operations'>Operations Mode</button>" +
          "<button class='alt' data-mode='finance'>Finance Mode</button>" +
          "<button class='alt' data-mode='compliance'>Compliance Mode</button>" +
          "<button class='alt' data-mode='legal'>Legal Mode</button>" +
        "</div>" +
        "<div id='tsm-exp-output' class='tsm-exp-output'>Select a mode above to generate AI-assisted narrative and next actions.</div>" +
      "</div>" +
      "<div class='tsm-exp-grid'>" +
        "<div class='tsm-exp-card'><h3>Live Operations Feed</h3>" + ul(d.queue,"tsm-exp-feed") + "</div>" +
        "<div class='tsm-exp-card'><h3>Owner Lane</h3>" + ul(d.owners) + "</div>" +
        "<div class='tsm-exp-card'><h3>Executive Impact</h3>" + ul(d.impact) + "</div>" +
        "<div class='tsm-exp-card'><h3>Document → Action Feed</h3>" + ul(d.docs) + "</div>" +
        "<div class='tsm-exp-card'><h3>Strategist Relay</h3>" + ul(d.queue.slice(0,4).map(function(x){return "Escalated: " + x;})) + "</div>" +
        "<div class='tsm-exp-card'><h3>Today's Deltas</h3>" + ul(d.deltas) + "</div>" +
      "</div>" +
      "<div class='tsm-exp-card'><h3>AI Next Actions</h3>" +
        "<span class='tsm-exp-pill'>Assign owner</span>" +
        "<span class='tsm-exp-pill'>Validate evidence</span>" +
        "<span class='tsm-exp-pill'>Clear SLA blocker</span>" +
        "<span class='tsm-exp-pill'>Generate summary</span>" +
        "<span class='tsm-exp-pill'>Relay to Strategist</span>" +
      "</div>";

    var anchor=document.querySelector("main") || document.body;
    anchor.appendChild(wrap);

    wrap.querySelectorAll("[data-mode]").forEach(function(btn){
      btn.onclick=function(){ run(btn.getAttribute("data-mode")); };
    });
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",build);
  else build();
})();

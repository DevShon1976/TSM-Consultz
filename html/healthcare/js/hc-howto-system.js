(function(){

if(window.__HC_HOWTO_SYSTEM__) return;
window.__HC_HOWTO_SYSTEM__ = true;

const GUIDE = {
billing:{
title:"HC Billing Command",
steps:[
"Review Claims Pending and Denial Rate KPIs.",
"Open AR Aging to identify stalled claims.",
"Use AI ANALYSIS to generate payer remediation strategy.",
"Review denial codes by payer and owner lane.",
"Click RUN BNCA to generate operational next actions.",
"Relay unresolved blockers to HC Strategist."
],
roles:[
"Billing Lead",
"Revenue Cycle Manager",
"AR Specialist",
"Denials Team"
],
best:[
"Reduce AR aging below 45 days.",
"Lower denial rate below 12%.",
"Escalate payer inactivity within SLA."
]
},

medical:{
title:"HC Medical Command",
steps:[
"Review patient throughput and no-show risk.",
"Open Scheduling and Intake tabs.",
"Use AI ANALYSIS for clinical backlog review.",
"Identify provider bottlenecks and documentation gaps.",
"Run BNCA to assign owner lanes.",
"Relay unresolved clinical risk to HC Strategist."
],
roles:[
"Clinical Ops Lead",
"Provider Manager",
"Front Desk Lead",
"Care Coordination"
],
best:[
"Reduce intake delay.",
"Increase clean documentation rate.",
"Prevent provider overload."
]
},

compliance:{
title:"HC Compliance Command",
steps:[
"Review HIPAA exposure indicators.",
"Open CMS and OIG tabs.",
"Use AI ANALYSIS to identify audit risks.",
"Generate audit packet and remediation workflow.",
"Run BNCA for escalation routing.",
"Relay unresolved risk to Strategist."
],
roles:[
"Compliance Officer",
"HIPAA Lead",
"Audit Manager"
],
best:[
"Prevent policy drift.",
"Maintain audit readiness.",
"Escalate access violations immediately."
]
},

financial:{
title:"HC Financial Command",
steps:[
"Review margin pressure and payer scorecards.",
"Open AR Aging and Payer Analysis.",
"Use AI ANALYSIS for forecasting and recovery strategy.",
"Identify underpayments and reimbursement gaps.",
"Run BNCA for financial recovery plan.",
"Relay unresolved payer risk to Strategist."
],
roles:[
"CFO",
"Finance Director",
"Revenue Integrity"
],
best:[
"Reduce cost-to-collect.",
"Improve payer performance.",
"Increase net collection rate."
]
},

operations:{
title:"HC Operations Node",
steps:[
"Review staffing and scheduling pressure.",
"Open Intake and Alerts tabs.",
"Use AI ANALYSIS to identify throughput blockers.",
"Review unresolved intake backlog.",
"Run BNCA for operational action plan.",
"Relay unresolved bottlenecks to Strategist."
],
roles:[
"Office Manager",
"Operations Lead",
"Scheduling Team"
],
best:[
"Reduce intake wait time.",
"Balance staffing coverage.",
"Prevent operational drag."
]
}
};

function detectNode(){
const p=location.pathname.toLowerCase();

if(p.includes("billing")) return "billing";
if(p.includes("medical")) return "medical";
if(p.includes("compliance")) return "compliance";
if(p.includes("financial")) return "financial";
if(p.includes("operations")) return "operations";

return "operations";
}

function install(){

const node = detectNode();
const g = GUIDE[node];

const btn=document.createElement("button");
btn.innerHTML="❔ HOW TO";
btn.style.cssText=`
position:fixed;
right:22px;
bottom:90px;
z-index:999999;
background:#00ffc6;
color:#001018;
border:none;
padding:14px 18px;
border-radius:14px;
font-weight:900;
cursor:pointer;
box-shadow:0 0 22px rgba(0,255,198,.35);
`;

document.body.appendChild(btn);

btn.onclick=()=>{

let old=document.getElementById("hc-howto-modal");
if(old) old.remove();

const wrap=document.createElement("div");
wrap.id="hc-howto-modal";

wrap.style.cssText=`
position:fixed;
inset:0;
background:rgba(0,0,0,.72);
backdrop-filter:blur(6px);
z-index:999999;
display:flex;
align-items:center;
justify-content:center;
padding:30px;
`;

wrap.innerHTML=`
<div style="
width:min(1100px,95vw);
max-height:92vh;
overflow:auto;
background:#041018;
border:1px solid rgba(0,255,198,.3);
border-radius:22px;
padding:28px;
font-family:Inter,sans-serif;
color:#dff;
box-shadow:0 0 40px rgba(0,255,198,.15);
">

<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">
<div>
<div style="font-size:2rem;font-weight:900;color:#00ffc6">
${g.title} · HOW TO GUIDE
</div>
<div style="opacity:.7;margin-top:6px">
Frontline workflow • BNCA orchestration • Strategist relay
</div>
</div>

<button id="hc-howto-close" style="
background:#102030;
color:#fff;
border:none;
padding:12px 16px;
border-radius:12px;
cursor:pointer;
">Close</button>
</div>

<div style="
display:grid;
grid-template-columns:1.2fr .8fr;
gap:22px;
">

<div style="
background:#071822;
padding:22px;
border-radius:18px;
border:1px solid rgba(0,255,198,.15);
">

<div style="
font-size:1.2rem;
font-weight:900;
margin-bottom:18px;
color:#00ffc6;
">
HOW TO USE THIS NODE
</div>

${g.steps.map((s,i)=>`
<div style="
display:flex;
gap:14px;
margin-bottom:16px;
padding:14px;
background:#08131d;
border-radius:12px;
">
<div style="
width:34px;
height:34px;
border-radius:50%;
background:#00ffc6;
color:#001018;
display:flex;
align-items:center;
justify-content:center;
font-weight:900;
">
${i+1}
</div>

<div style="
line-height:1.6;
font-size:.97rem;
">
${s}
</div>
</div>
`).join("")}

</div>

<div style="
display:flex;
flex-direction:column;
gap:18px;
">

<div style="
background:#071822;
padding:20px;
border-radius:18px;
border:1px solid rgba(0,255,198,.15);
">
<div style="
font-weight:900;
margin-bottom:14px;
color:#00ffc6;
">
PRIMARY USERS
</div>

${g.roles.map(r=>`
<div style="
padding:10px 12px;
margin-bottom:10px;
background:#08131d;
border-radius:10px;
">
${r}
</div>
`).join("")}
</div>

<div style="
background:#071822;
padding:20px;
border-radius:18px;
border:1px solid rgba(0,255,198,.15);
">
<div style="
font-weight:900;
margin-bottom:14px;
color:#00ffc6;
">
BEST PRACTICES
</div>

${g.best.map(r=>`
<div style="
padding:10px 12px;
margin-bottom:10px;
background:#08131d;
border-radius:10px;
">
✓ ${r}
</div>
`).join("")}
</div>

<div style="
background:#10122a;
padding:20px;
border-radius:18px;
border:1px solid rgba(170,100,255,.25);
">
<div style="
font-weight:900;
margin-bottom:12px;
color:#d59cff;
">
HC STRATEGIST RELAY
</div>

<div style="
line-height:1.7;
font-size:.95rem;
opacity:.92;
">
Use BNCA when frontline teams cannot resolve the issue within the current operational window.

Strategist receives:
• unresolved blockers
• ownership gaps
• SLA breaches
• payer escalation
• staffing overload
• compliance exposure
• patient throughput degradation

Strategist then returns:
• owner lane
• executive priority
• next-action plan
• escalation routing
• timeline guidance
</div>
</div>

</div>
</div>
</div>
`;

document.body.appendChild(wrap);

document.getElementById("hc-howto-close").onclick=()=>wrap.remove();

wrap.addEventListener("click",(e)=>{
if(e.target===wrap) wrap.remove();
});

};

}

if(document.readyState==="loading"){
document.addEventListener("DOMContentLoaded",install);
}else{
install();
}

})();

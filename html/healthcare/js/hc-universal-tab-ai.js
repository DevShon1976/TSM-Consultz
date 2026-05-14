(function(){

if(window.__FINAL_HC_AI__) return;
window.__FINAL_HC_AI__=true;

function detectNode(){

const p=location.pathname.toLowerCase();

if(p.includes("billing")) return "BILLING";
if(p.includes("medical")) return "MEDICAL";
if(p.includes("compliance")) return "COMPLIANCE";
if(p.includes("financial")) return "FINANCIAL";
if(p.includes("insurance")) return "INSURANCE";
if(p.includes("legal")) return "LEGAL";
if(p.includes("pharmacy")) return "PHARMACY";
if(p.includes("vendors")) return "VENDORS";
if(p.includes("grants")) return "GRANTS";
if(p.includes("tax")) return "TAXPREP";

return "OPERATIONS";
}

const actions={

OPERATIONS:["Analyze staffing pressure","Clear intake bottleneck","Run throughput BNCA"],

MEDICAL:["Analyze clinical backlog","Review no-show risk","Run medical BNCA"],

BILLING:["Analyze denial pressure","Review AR aging","Run billing BNCA"],

COMPLIANCE:["Review audit exposure","Check HIPAA risk","Run compliance BNCA"],

FINANCIAL:["Analyze reimbursement trend","Forecast revenue risk","Run financial BNCA"],

INSURANCE:["Review auth backlog","Analyze payer SLA","Run insurance BNCA"],

LEGAL:["Review legal exposure","Analyze contract risk","Run legal BNCA"]

};

const node=detectNode();

function inject(){

if(document.getElementById("final-hc-ai")) return;

const wrap=document.createElement("div");

wrap.id="final-hc-ai";

wrap.style.cssText="margin:20px;padding:20px;background:#07131d;border:1px solid rgba(0,255,200,.28);border-radius:18px;color:#dff";

wrap.innerHTML=`
<h2 style="color:#00ffd0">${node} NODE AI</h2>

<div style="margin:10px 0">
${(actions[node]||actions.OPERATIONS).map(a=>`
<button
style="
margin:4px;
padding:10px 14px;
border-radius:10px;
border:none;
background:#00ffd0;
color:#001;
font-weight:800;
cursor:pointer"
data-ai="${a}"
>
⚡ ${a}
</button>
`).join("")}
</div>

<pre id="final-hc-output"
style="
white-space:pre-wrap;
background:#041018;
padding:14px;
border-radius:12px;
border:1px solid rgba(0,255,200,.15);
min-height:180px;
overflow:auto;
">Ready.</pre>
`;

(document.querySelector("main")||document.body).prepend(wrap);

wrap.querySelectorAll("[data-ai]").forEach(btn=>{

btn.onclick=async()=>{

const out=document.getElementById("final-hc-output");

out.textContent="Running "+btn.dataset.ai+"...";

try{

const r=await fetch("/api/hc/query",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({
payload:{
node,
context:btn.dataset.ai
}
})
});

const d=await r.json();

out.textContent=d.reply||JSON.stringify(d,null,2);

}catch(e){

out.textContent="AI request failed.";
}

};

});

}

if(document.readyState==="loading"){
document.addEventListener("DOMContentLoaded",inject);
}else{
inject();
}

setTimeout(inject,1200);

})();

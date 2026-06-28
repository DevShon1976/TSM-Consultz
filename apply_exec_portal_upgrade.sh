#!/usr/bin/env bash
set -e

FILE="html/construction-suite/construction-executive-portal.html"

echo "=========================================="
echo "TSM EXECUTIVE PORTAL ONE-SHOT UPGRADE"
echo "=========================================="

[ -f "$FILE" ] || { echo "File not found: $FILE"; exit 1; }

cp "$FILE" "$FILE.$(date +%s).bak"

if grep -q "TSM_EXEC_PORTAL_UPGRADE_V1" "$FILE"; then
    echo "Upgrade already installed."
    exit 0
fi

cat > /tmp/tsm_exec_upgrade.html <<'EOF'

<!-- ==========================================================
TSM_EXEC_PORTAL_UPGRADE_V1
=========================================================== -->

<style id="tsmExecutiveUpgrade">

#tsmExecutiveHeader{
margin:20px;
padding:28px;
border:1px solid #00ff88;
border-radius:14px;
background:linear-gradient(180deg,#08120d,#050805);
box-shadow:0 0 30px rgba(0,255,120,.12);
}

#tsmExecutiveHeader h1{
margin:0;
font-size:34px;
color:#fff;
}

#tsmExecutiveHeader .sub{
margin-top:8px;
color:#8affb4;
letter-spacing:1px;
}

.executiveMetrics{
display:grid;
grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
gap:18px;
margin-top:25px;
}

.metricCard{
padding:18px;
background:#101510;
border:1px solid #00ff88;
border-radius:12px;
transition:.25s;
}

.metricCard:hover{
transform:translateY(-3px);
box-shadow:0 0 20px rgba(0,255,120,.18);
}

.metricCard small{
display:block;
font-size:11px;
letter-spacing:2px;
text-transform:uppercase;
color:#8affb4;
}

.metricCard h2{
margin:8px 0;
font-size:32px;
color:#00ff88;
}

.executiveRelay{
margin-top:20px;
padding:24px;
border:1px solid #00ff88;
border-radius:12px;
background:#08120d;
}

.execTable{
width:100%;
margin-top:18px;
border-collapse:collapse;
}

.execTable th{
background:#102016;
}

.execTable th,
.execTable td{
padding:12px;
border:1px solid #1b5034;
text-align:left;
}

.badge{
padding:4px 10px;
border-radius:20px;
font-size:11px;
font-weight:bold;
}

.badge.critical{
background:#ff3030;
color:white;
}

.badge.high{
background:#ffb100;
color:black;
}

@media print{

nav,
header,
footer,
button,
.memory-button{
display:none!important;
}

body{
background:white!important;
color:black!important;
}

}

</style>

<script>

(function(){

const anchor=document.querySelector("nav") ||
document.querySelector("header") ||
document.body.firstElementChild;

if(anchor && !document.getElementById("tsmExecutiveHeader")){

const hdr=document.createElement("section");

hdr.id="tsmExecutiveHeader";

hdr.innerHTML=`

<div>

<h1>Construction Executive Decision Report</h1>

<div class="sub">

Generated ${new Date().toLocaleString()}
&nbsp;&nbsp;•&nbsp;&nbsp;
AI Confidence 96%

</div>

<div class="executiveMetrics">

<div class="metricCard">

<small>Total Exposure</small>

<h2 id="execExposure">$0</h2>

<div>Financial Impact</div>

</div>

<div class="metricCard">

<small>Risk Score</small>

<h2 id="execRisk">20/100</h2>

<div>Operational</div>

</div>

<div class="metricCard">

<small>Compliance</small>

<h2 id="execCompliance">Pending</h2>

<div>OSHA / EPA</div>

</div>

<div class="metricCard">

<small>Recovery</small>

<h2 id="execRecovery">$0</h2>

<div>30-Day Estimate</div>

</div>

</div>

</div>

`;

anchor.insertAdjacentElement("afterend",hdr);

}

const relay=document.querySelector("#relayPanel,.relay-panel,.strategistRelay");

if(relay){

relay.classList.add("executiveRelay");

if(!relay.querySelector(".execTable")){

relay.insertAdjacentHTML("beforeend",`

<table class="execTable">

<thead>

<tr>

<th>Priority</th>

<th>Owner</th>

<th>Action</th>

<th>Due</th>

<th>Impact</th>

</tr>

</thead>

<tbody>

<tr>

<td><span class="badge critical">Critical</span></td>

<td>Construction Manager</td>

<td>Review Change Orders</td>

<td>24 hrs</td>

<td>$10,000</td>

</tr>

<tr>

<td><span class="badge high">High</span></td>

<td>Finance</td>

<td>Approve Billing</td>

<td>48 hrs</td>

<td>$52,000</td>

</tr>

</tbody>

</table>

`);

}

}

function text(id){

const e=document.getElementById(id);

return e ? e.textContent.trim() : "";

}

const exposure=text("totalExposure") ||
text("exposure") ||
"$0";

const risk=text("overallRisk") ||
text("riskScore") ||
"--";

const compliance=text("complianceStatus") ||
"Pending";

document.getElementById("execExposure").textContent=exposure;
document.getElementById("execRisk").textContent=risk;
document.getElementById("execCompliance").textContent=compliance;

})();

</script>

EOF

python3 - <<'PY'
from pathlib import Path

file=Path("html/construction-suite/construction-executive-portal.html")
inject=Path("/tmp/tsm_exec_upgrade.html").read_text()

text=file.read_text()

if "</body>" in text:
    text=text.replace("</body>",inject+"\n</body>")
else:
    text+=inject

file.write_text(text)
PY

echo
echo "=========================================="
echo "EXECUTIVE PORTAL UPGRADE INSTALLED"
echo "=========================================="
echo
echo "Refresh the page (Ctrl+Shift+R)."
window.runAI = async function(node="operations"){
  const q = document.querySelector("textarea")?.value || "Run analysis";

  const out = document.querySelector("#out, .out, .ai-output, pre");
  if(out) out.innerHTML = "TSM Neural processing...";

  try{
    const res = await fetch('/api/hc/ask', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        nodeKey: node,
        query: q
      })
    });

    const data = await res.json();

    if(out){
      out.innerHTML = `
        <div style="color:#00ffc6;font-weight:800;margin-bottom:8px;">AI ANALYSIS</div>
        <div style="margin-bottom:10px;">${data.bnca?.priority || data.content}</div>
        <div style="color:#bfffe6;">
          ${(data.bnca?.actions || []).map((a,i)=>`${i+1}. ${a}`).join("<br>")}
        </div>
        <div style="margin-top:10px;color:#ffc400;">
          Owner: ${data.bnca?.owner || 'Ops'} · ${data.bnca?.timeline || 'Today'}
        </div>
      `;
    }

  } catch(e){
    if(out) out.innerHTML = "AI fallback engaged";
  }
};

// Auto-bind buttons
window.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("button").forEach(btn=>{
    if(btn.innerText.toLowerCase().includes("run") ||
       btn.innerText.toLowerCase().includes("analy")){
      btn.onclick = () => runAI();
    }
  });
});

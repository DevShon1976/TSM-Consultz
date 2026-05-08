(function(){
  if(window.__HC_NODE_ENHANCER_SAFE__) return;
  window.__HC_NODE_ENHANCER_SAFE__ = true;

  window.hcOpenEnhancedNode = window.hcOpenEnhancedNode || function(key){
    const o=document.createElement('div');
    o.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,.82);z-index:999999;display:flex;align-items:center;justify-content:center";
    o.innerHTML=`
      <div style="width:min(900px,94vw);background:#081522;border:1px solid #00ffc6;border-radius:14px;color:#dff7ff;padding:24px;font-family:Inter,system-ui">
        <button onclick="this.closest('div[style*=fixed]').remove()" style="float:right;background:#122033;color:#fff;border:1px solid #244;padding:8px 12px;border-radius:8px">Close</button>
        <h2 style="color:#00ffc6;margin-top:0">${(key||'HC').toUpperCase()} INTEL WORKBENCH</h2>
        <p>Queue · Timeline · Notes · Smart Prompts · BNCA</p>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
          <div style="background:#07131d;border:1px solid rgba(255,255,255,.1);padding:14px;border-radius:10px"><b>Risk</b><br><span style="color:#ff5252;font-size:24px">HIGH</span></div>
          <div style="background:#07131d;border:1px solid rgba(255,255,255,.1);padding:14px;border-radius:10px"><b>Queue</b><br><span style="color:#ffc400;font-size:24px">31</span></div>
          <div style="background:#07131d;border:1px solid rgba(255,255,255,.1);padding:14px;border-radius:10px"><b>Confidence</b><br><span style="color:#00ffc6;font-size:24px">92%</span></div>
        </div>
        <pre style="white-space:pre-wrap;background:#050b12;border:1px solid rgba(0,255,198,.2);padding:14px;border-radius:10px;margin-top:16px">TOP ISSUE
Cross-node operational pressure requires owner-lane action.

BEST NEXT ACTIONS
1. Assign node lead.
2. Clear blockers older than current window.
3. Document handoff evidence.
4. Relay to HC Strategist.</pre>
      </div>`;
    document.body.appendChild(o);
  };
})();

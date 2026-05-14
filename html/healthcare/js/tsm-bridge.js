(function(){
  if(window.__TSM_HC_BRIDGE_V2__) return;
  window.__TSM_HC_BRIDGE_V2__=true;

  const NODE_MAP = [
    ["billing","BILLING"],["medical","MEDICAL"],["compliance","COMPLIANCE"],["financial","FINANCIAL"],
    ["insurance","INSURANCE"],["pharmacy","PHARMACY"],["vendors","VENDORS"],["vendor","VENDORS"],
    ["legal","LEGAL"],["grants","GRANTS"],["taxprep","TAXPREP"],["tax-prep","TAXPREP"],
    ["operations","OPERATIONS"],["strategist","STRATEGIST"]
  ];

  function detectNode(){
    const p=location.pathname.toLowerCase();
    const t=(document.body?.innerText || "").toLowerCase();
    for(const [needle,node] of NODE_MAP){
      if(p.includes(needle) || t.includes(`hc ${needle}`) || t.includes(`${needle} command`) || t.includes(`${needle} node`)) return node;
    }
    return "OPERATIONS";
  }

  function activeTab(){
    const selectors=[
      ".active[role='tab']",".tab.active","nav .active","button.active","a.active",
      "[aria-selected='true']", ".tabs .on", ".selected"
    ];
    for(const q of selectors){
      const el=document.querySelector(q);
      const txt=(el?.innerText || el?.textContent || "").trim();
      if(txt) return txt.replace(/\s+/g," ");
    }
    return "Current View";
  }

  function pageContext(){
    const node=detectNode();
    const tab=activeTab();
    const kpis=[...document.querySelectorAll(".kpi,.metric,.card,.stat")].slice(0,12).map(el=>(el.innerText||"").trim()).filter(Boolean);
    const alerts=[...document.querySelectorAll(".alert,.risk,.warning,.urgent,tr,li")].slice(0,20).map(el=>(el.innerText||"").trim()).filter(Boolean);
    return {node,tab,kpis,alerts,url:location.pathname};
  }

  async function askHC(prompt, extra={}){
    const ctx=pageContext();
    const body={
      action: extra.action || "HC_NODE_AI",
      payload:{
        node: extra.node || ctx.node,
        tab: extra.tab || ctx.tab,
        context: prompt || extra.context || "Analyze this healthcare node and return BNCA.",
        page_context: ctx,
        priority: extra.priority || "HIGH",
        human_in_the_loop: true,
        relay_to_strategist: true
      }
    };

    const r=await fetch("/api/hc/query",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(body)
    });

    const d=await r.json();
    return d.reply || d.content || d.analysis || d.answer || JSON.stringify(d,null,2);
  }

  window.TSMBridge = window.TSMBridge || {};
  window.TSMBridge.detectNode=detectNode;
  window.TSMBridge.activeTab=activeTab;
  window.TSMBridge.pageContext=pageContext;
  window.TSMBridge.askHC=askHC;

  window.tsmAskHC = askHC;
  window.tsmDetectHCNode = detectNode;
  window.tsmActiveHCTab = activeTab;

  console.log("TSM HC Bridge V2 ready", pageContext());
})();

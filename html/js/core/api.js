const BASE = window.TSM_BASE_URL || "";
export async function post(endpoint, payload={}, opts={}) {
  const url=`${BASE}${endpoint}`,timeout=opts.timeout||30000;
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeout);
  try {
    const res=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload),signal:controller.signal});
    clearTimeout(timer);
    if(!res.ok){const t=await res.text().catch(()=>"");throw new Error(`[TSM API] ${endpoint} → HTTP ${res.status}: ${t}`);}
    return await res.json();
  } catch(err){clearTimeout(timer);if(err.name==="AbortError")throw new Error(`[TSM API] ${endpoint} timed out`);throw err;}
}
export async function get(endpoint,opts={}){
  const url=`${BASE}${endpoint}`,timeout=opts.timeout||15000;
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeout);
  try{const res=await fetch(url,{signal:controller.signal});clearTimeout(timer);if(!res.ok)throw new Error(`[TSM API] ${endpoint} → HTTP ${res.status}`);return await res.json();}
  catch(err){clearTimeout(timer);if(err.name==="AbortError")throw new Error(`[TSM API] ${endpoint} timed out`);throw err;}
}
export const ROUTES={classify:"/api/classify",hc:"/api/hc/query",insurance:"/api/insurance/query",legal:"/api/legal/query",financial:"/api/financial/query",mortgage:"/api/mortgage/query",construction:"/api/construction/query",re:"/api/re/query",bpo:"/api/bpo/query",collective:"/api/collective/signal",bnca:"/api/collective/bnca",nodeReport:"/api/node-report",stream:"/api/war-room/stream",health:"/health"};

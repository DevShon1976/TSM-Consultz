window.TSM_BNCA=(function(){
  const P='tsm_bnca_',IK='tsm_bnca_index';
  function report(id,payload){
    try{
      const e={nodeId:id,timestamp:Date.now(),...payload};
      localStorage.setItem(P+id,JSON.stringify(e));
      const idx=JSON.parse(localStorage.getItem(IK)||'[]');
      if(!idx.includes(id)){idx.push(id);localStorage.setItem(IK,JSON.stringify(idx));}
      console.log('[TSM_BNCA] reported:',id);
      fetch('/api/finops/bnca/report',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(e)}).catch(()=>{});
    }catch(e){console.warn('[TSM_BNCA] write failed',e);}
  }
  function readAll(){
    try{
      const idx=JSON.parse(localStorage.getItem(IK)||'[]');
      return idx.map(id=>{const r=localStorage.getItem(P+id);return r?JSON.parse(r):null;}).filter(Boolean);
    }catch(e){return[];}
  }
  function read(id){try{const r=localStorage.getItem(P+id);return r?JSON.parse(r):null;}catch(e){return null;}}
  function clear(id){try{if(id){localStorage.removeItem(P+id);}else{const idx=JSON.parse(localStorage.getItem(IK)||'[]');idx.forEach(i=>localStorage.removeItem(P+i));localStorage.removeItem(IK);}}catch(e){}}
  function ageMinutes(e){return Math.round((Date.now()-e.timestamp)/60000);}
  return{report,readAll,read,clear,ageMinutes};
})();

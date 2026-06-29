export const TSM_EVENTS = {
  MISSION_STARTED:"tsm:mission:started",
  MISSION_COMPLETE:"tsm:mission:complete",
  MISSION_ERROR:"tsm:mission:error",
  CLASSIFY_COMPLETE:"tsm:classify:complete",
  SPECIALIST_RESPONDING:"tsm:specialist:responding",
  SPECIALIST_COMPLETE:"tsm:specialist:complete",
  SPECIALIST_ERROR:"tsm:specialist:error",
  COLLECTIVE_COMPLETE:"tsm:collective:complete",
  BNCA_COMPLETE:"tsm:bnca:complete",
  STREAM_STARTED:"tsm:stream:started",
  STREAM_CHUNK:"tsm:stream:chunk",
  STREAM_COMPLETE:"tsm:stream:complete",
  NODE_REPORT_SAVED:"tsm:node-report:saved",
  TIMELINE_ENTRY:"tsm:timeline:entry",
  DIRECTOR_DECISION:"tsm:director:decision",
  DIRECTOR_ESCALATION:"tsm:director:escalation",
};
export function publish(type,data=null){window.dispatchEvent(new CustomEvent(type,{detail:data}));}
export function subscribe(type,callback){const h=(e)=>callback(e.detail);window.addEventListener(type,h);return()=>window.removeEventListener(type,h);}
export function subscribeOnce(type,callback){const u=subscribe(type,(d)=>{u();callback(d);});return u;}

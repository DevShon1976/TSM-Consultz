import{publish,TSM_EVENTS}from"../core/events.js";
const SK="tsm_current_mission";
export const Mission={id:null,prompt:"",startedAt:null,completedAt:null,status:"idle",classify:null,specialists:[],responses:{},collective:null,bnca:null,executive:null,stream:"",timeline:[],reports:[]};
export function resetMission(prompt=""){Object.assign(Mission,{id:`M-${Date.now()}`,prompt,startedAt:new Date().toISOString(),completedAt:null,status:"running",classify:null,specialists:[],responses:{},collective:null,bnca:null,executive:null,stream:"",timeline:[],reports:[]});_p();}
export function window.TSMEventBus.emit("MISSION_UPDATE", patch={}){Object.assign(Mission,patch);_p();}
export function logTimeline(event,level="info"){const e={time:new Date().toISOString(),event,level};Mission.timeline.push(e);_p();publish(TSM_EVENTS.TIMELINE_ENTRY,e);}
export function recordSpecialistResponse(vertical,response){Mission.responses[vertical]=response;_p();}
export function completeMission(){Mission.status="complete";Mission.completedAt=new Date().toISOString();Mission.executive=Mission.bnca?.executive||Mission.bnca?.summary||Mission.collective?.executive||Mission.collective?.summary||Mission.collective?.answer||null;_p();publish(TSM_EVENTS.MISSION_COMPLETE,{...Mission});}
export function markMissionError(err){Mission.status="error";logTimeline(`❌ ${err?.message||err}`,"error");publish(TSM_EVENTS.MISSION_ERROR,{error:err?.message||String(err)});_p();}
export function recoverMission(){try{const r=sessionStorage.getItem(SK);if(r)Object.assign(Mission,JSON.parse(r));}catch(_){}}
function _p(){try{sessionStorage.setItem(SK,JSON.stringify(Mission));}catch(_){}}

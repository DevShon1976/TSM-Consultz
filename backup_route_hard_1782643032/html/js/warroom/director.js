import{publish,TSM_EVENTS}from"../core/events.js";
import{resetMission,completeMission,markMissionError,logTimeline,updateMission,Mission}from"./mission.js";
import{classify}from"./classifier.js";
import{dispatch}from"./dispatcher.js";
import{runCollective,runBNCA}from"./bnca.js";
import{startStream}from"./stream.js";
import{saveReport}from"./reporter.js";
const MAX_RETRIES=2,LOW_CONF=0.55;
const ESCALATION={hc:["insurance","legal"],insurance:["hc","financial"],legal:["hc","financial"],financial:["re","insurance"],construction:["legal","financial"],re:["financial","legal"],mortgage:["financial","re"],bpo:["financial","hc"]};
const PRIORITY={hc:1,legal:1,insurance:2,financial:2,construction:3,re:3,mortgage:3,bpo:4};
export async function runMission(prompt,opts={}){
  const{streamContainerId="streamPanel"}=opts;
  resetMission(prompt);
  logTimeline("🎯 Mission Director activated","info");
  publish(TSM_EVENTS.MISSION_STARTED,{prompt});
  try{
    const cr=await classify(prompt);
    const pri=[...cr.verticals].sort((a,b)=>(PRIORITY[a]||9)-(PRIORITY[b]||9));
    _dec("VERTICALS_SELECTED",{verticals:pri});
    const responses=await _retry(prompt,pri);
    const escalated=await _escalate(prompt,responses,pri);
    const all={...responses,...escalated};
    const collective=await runCollective(prompt,all);
    const bnca=await runBNCA(prompt,collective);
    await startStream(prompt,streamContainerId);
    await saveReport();
    completeMission();
    logTimeline("🏁 Mission complete","success");
    _dec("MISSION_PACKAGE_READY",{verticals:Object.keys(all),executive:Mission.executive,missionId:Mission.id});
    return{...Mission};
  }catch(err){markMissionError(err);throw err;}
}
async function _retry(prompt,verticals,attempt=1){
  const r=await dispatch(prompt,verticals);
  const failed=verticals.filter(v=>!r[v]);
  if(!failed.length||attempt>=MAX_RETRIES){if(failed.length){logTimeline(`⚠️ Agents still failing: ${failed.join(", ")}`,"warning");_dec("AGENTS_FAILED",{failed,attempt});}return r;}
  logTimeline(`🔄 Retrying ${failed.length} agent(s) (attempt ${attempt+1})...`,"warning");
  return{...r,...await _retry(prompt,failed,attempt+1)};
}
async function _escalate(prompt,responses,active){
  const conf=_conf(responses);
  if(conf>=LOW_CONF){logTimeline(`📊 Confidence ${(conf*100).toFixed(0)}% — no escalation`,"info");return{};}
  const cands=new Set();
  active.forEach(v=>(ESCALATION[v]||[]).forEach(e=>cands.add(e)));
  active.forEach(v=>cands.delete(v));
  if(!cands.size)return{};
  const list=[...cands].slice(0,2);
  logTimeline(`⬆️ Escalating to: ${list.join(", ").toUpperCase()}`,"warning");
  publish(TSM_EVENTS.DIRECTOR_ESCALATION,{list,conf});
  return await dispatch(prompt,list);
}
function _conf(r){const t=Object.keys(Mission.responses).length||1,ok=Object.values(r).filter(Boolean).length,base=ok/t,c=Mission.collective?.confidence??null;return c!==null?(base+c)/2:base;}
function _dec(type,payload){publish(TSM_EVENTS.DIRECTOR_DECISION,{type,...payload,ts:Date.now()});}

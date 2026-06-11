(function(){

const STORAGE_KEY = 'tsm_mission_queue';

function getQueue(){
  return JSON.parse(
    localStorage.getItem(STORAGE_KEY) || '[]'
  );
}

function saveQueue(queue){
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(queue)
  );
}

function addMission(obj){

  const queue = getQueue();

  const exists = queue.find(
    q => q.id === obj.id
  );

  if(exists) return;

  queue.push(obj);

  saveQueue(queue);
}

function updateStep(id, stepNumber){

  const queue = getQueue();

  const mission = queue.find(
    x => x.id === id
  );

  if(!mission) return;

  const step = mission.progression_steps.find(
    s => s.step === stepNumber
  );

  if(step){
    step.status = 'complete';
  }

  const completed =
    mission.progression_steps.filter(
      s => s.status === 'complete'
    ).length;

  mission.completion_pct =
    Math.round(
      completed /
      mission.progression_steps.length *
      100
    );

  if(mission.completion_pct >= 100){
    mission.status = 'complete';
  }

  saveQueue(queue);
}

function launchMission(id){

  const queue = getQueue();

  const mission =
    queue.find(x => x.id === id);

  if(!mission) return;

  localStorage.setItem(
    'tsm_active_mission',
    JSON.stringify(mission)
  );

  localStorage.setItem(
    'tsm_active_context',
    JSON.stringify(mission.context)
  );

  const url =
    `/healthcare/hc-${mission.owner.node}/${mission.owner.launch_target}.html`;

  location.href = url;
}

window.TSMMissionQueue = {
  getQueue,
  saveQueue,
  addMission,
  updateStep,
  launchMission
};

})();
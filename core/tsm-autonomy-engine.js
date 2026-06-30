// ======================================
// TSM AUTONOMY ENGINE (UNIVERSAL CORE)
// ======================================

export function tsmCreateMission(vertical, relayKey) {
  return {
    id: `${vertical}-${Date.now().toString(36)}`,
    vertical,
    createdAt: Date.now(),
    relay: sessionStorage.getItem(relayKey) || localStorage.getItem(relayKey)
  };
}

export function tsmStratConfirm(vertical, missionId) {
  localStorage.setItem("TSM_STRAT_CONFIRMED", JSON.stringify({
    vertical,
    timestamp: Date.now(),
    missionId
  }));
}

export function tsmExecConfirm(vertical, missionId) {
  localStorage.setItem("TSM_EXEC_CONFIRMED", JSON.stringify({
    vertical,
    timestamp: Date.now(),
    missionId
  }));
}

export function tsmAutoRun(config) {
  const {
    vertical,
    relayKey,
    strategistFn,
    redirectUrl,
    delay = 600
  } = config;

  const mission = tsmCreateMission(vertical, relayKey);
  window.tsmMission = mission;

  setTimeout(() => {
    window.injectContext?.();
  }, delay);

  setTimeout(() => {
    if (typeof strategistFn === "function") {
      strategistFn(mission);
    }
  }, delay + 800);

  setTimeout(() => {
    tsmStratConfirm(vertical, mission.id);
  }, delay + 2000);

  if (redirectUrl) {
    setTimeout(() => {
      window.location.href = redirectUrl;
    }, delay + 2600);
  }

  return mission;
}

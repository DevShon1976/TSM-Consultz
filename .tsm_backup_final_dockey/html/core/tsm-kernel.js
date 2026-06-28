window.TSM_KERNEL = (function () {
  const PREFIX = "tsm_war_relay_";

  function setRelay(v, p) {
    localStorage.setItem(PREFIX + v, JSON.stringify({
      ts: Date.now(),
      v, p
    }));
  }

  function getRelay(v) {
    try {
      return JSON.parse(localStorage.getItem(PREFIX + v));
    } catch {
      return null;
    }
  }

  return { setRelay, getRelay };
})();

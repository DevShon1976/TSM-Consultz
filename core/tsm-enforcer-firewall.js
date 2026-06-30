(function installStorageFirewall() {

  const block = (k) => k && k.includes("tsm_war_relay_");

  const origLocal = localStorage.setItem;
  const origSession = sessionStorage.setItem;

  localStorage.setItem = function (k, v) {
    if (block(k)) {
      throw new Error("TSM_ENFORCER BLOCK: localStorage relay write denied");
    }
    return origLocal.apply(this, arguments);
  };

  sessionStorage.setItem = function (k, v) {
    if (block(k)) {
      throw new Error("TSM_ENFORCER BLOCK: sessionStorage relay write denied");
    }
    return origSession.apply(this, arguments);
  };

})();

(function () {
  const block = (k) => k && k.includes("tsm_war_relay_");

  const l = localStorage.setItem;
  const s = sessionStorage.setItem;

  localStorage.setItem = function (k, v) {
    if (block(k)) throw new Error("BLOCKED RELAY WRITE");
    return l.apply(this, arguments);
  };

  sessionStorage.setItem = function (k, v) {
    if (block(k)) throw new Error("BLOCKED RELAY WRITE");
    return s.apply(this, arguments);
  };
})();

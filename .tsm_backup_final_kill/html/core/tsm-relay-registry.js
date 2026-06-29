window.TSM_RELAY_REGISTRY = (function () {
  const map = new Map();

  function register(k, v) { map.set(k, v); }

  function resolve(k) {
    return map.get(k) || k;
  }

  return { register, resolve };
})();

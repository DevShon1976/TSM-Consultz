window.TSMTelemetry = (() => {

  const KEY = "tsm_telemetry_log";

  function log(event) {

    const log = load();

    const entry = {
      ...event,
      timestamp: Date.now()
    };

    log.push(entry);

    localStorage.setItem(KEY, JSON.stringify(log));

    console.log("[TELEMETRY]", entry);
  }

  function load() {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  }

  function clear() {
    localStorage.removeItem(KEY);
  }

  function summarize() {

    const data = load();

    return data.reduce((acc, e) => {
      acc[e.type] = (acc[e.type] || 0) + 1;
      return acc;
    }, {});
  }

  return {
    log,
    load,
    clear,
    summarize
  };

})();
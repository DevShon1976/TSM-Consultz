(function () {

  console.log("[AGENT-BUS] Initializing multi-agent communication layer...");

  const channels = {};

  // --------------------------
  // REGISTER AGENTS
  // --------------------------
  function register(agent) {
    channels[agent] = [];
  }

  // --------------------------
  // SEND MESSAGE BETWEEN AGENTS
  // --------------------------
  function send(from, to, message) {
    const packet = {
      from,
      to,
      message,
      timestamp: Date.now()
    };

    console.log("[AGENT COMM]", packet);

    (channels[to] || []).push(packet);
  }

  // --------------------------
  // BROADCAST (ALL AGENTS)
  // --------------------------
  function broadcast(from, message) {
    Object.keys(channels).forEach(agent => {
      if (agent !== from) {
        send(from, agent, message);
      }
    });
  }

  // --------------------------
  // READ INBOX
  // --------------------------
  function inbox(agent) {
    return channels[agent] || [];
  }

  window.TSMAgentBus = {
    register,
    send,
    broadcast,
    inbox
  };

  // Default agents
  register("HC_AGENT");
  register("FINOPS_AGENT");
  register("LEGAL_AGENT");
  register("INSURANCE_AGENT");

})();
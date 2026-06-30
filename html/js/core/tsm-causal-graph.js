(function () {

  console.log("[CAUSAL-GRAPH] initializing visualizer...");

  // ================================
  // DATA SOURCES
  // ================================
  function getEvents() {
    return window.TSMReplayEngine?.getLog?.() || [];
  }

  function getMissions() {
    return window.TSMMissionStore?.getAll?.() || [];
  }

  function getAgents() {
    return window.TSMAgentBus ? ["HC_AGENT","FINOPS_AGENT","LEGAL_AGENT","INSURANCE_AGENT"] : [];
  }

  // ================================
  // GRAPH STORAGE MODEL
  // ================================
  const Graph = {
    nodes: new Map(),
    edges: []
  };

  function addNode(id, type, meta = {}) {
    if (!Graph.nodes.has(id)) {
      Graph.nodes.set(id, { id, type, meta });
    }
  }

  function addEdge(from, to, type) {
    Graph.edges.push({ from, to, type });
  }

  // ================================
  // BUILD CAUSAL GRAPH
  // ================================
  function buildGraph() {

    Graph.nodes.clear();
    Graph.edges = [];

    const events = getEvents();
    const missions = getMissions();

    // ----------------------------
    // 1. EVENT CHAIN
    // ----------------------------
    events.forEach((e, i) => {
      const id = "event_" + i;
      addNode(id, "EVENT", e);

      if (i > 0) {
        addEdge("event_" + (i - 1), id, "CAUSES");
      }
    });

    // ----------------------------
    // 2. MISSION LINEAGE
    // ----------------------------
    missions.forEach(m => {
      const mid = "mission_" + m.id;

      addNode(mid, "MISSION", m);

      if (m.sourceEventId) {
        addEdge(m.sourceEventId, mid, "SPAWNS");
      }

      if (m.bnca?.decision) {
        addNode(mid + "_bnca", "BNCA", m.bnca);
        addEdge(mid, mid + "_bnca", "EVALUATED_BY");
      }
    });

    // ----------------------------
    // 3. AGENT INTERACTIONS
    // ----------------------------
    if (window.TSMAgentBus?.inbox) {

      getAgents().forEach(agent => {
        const inbox = window.TSMAgentBus.inbox(agent);

        addNode(agent, "AGENT", { name: agent });

        inbox.forEach((msg, i) => {
          const mid = agent + "_msg_" + i;

          addNode(mid, "MESSAGE", msg);

          addEdge(msg.from, mid, "SENT");
          addEdge(mid, agent, "RECEIVED");
        });
      });
    }

    return Graph;
  }

  // ================================
  // SIMPLE RENDERER (NO LIBS)
  // ================================
  function render(containerId = "causalGraph") {

    const graph = buildGraph();

    const container = document.getElementById(containerId);
    if (!container) return;

    let html = `
      <div style="font-family:Arial; color:#fff; background:#0b0f19; padding:10px;">
        <h3>TSM Causal Graph</h3>
    `;

    html += `<div style="margin-bottom:10px;"><b>Nodes:</b> ${graph.nodes.size}</div>`;
    html += `<div style="margin-bottom:10px;"><b>Edges:</b> ${graph.edges.length}</div>`;

    // ----------------------------
    // NODE LIST
    // ----------------------------
    html += `<div style="font-size:12px;">`;

    graph.nodes.forEach(n => {
      html += `
        <div style="margin:4px 0; padding:4px; border:1px solid #333;">
          <b>${n.type}</b> :: ${n.id}
        </div>
      `;
    });

    html += `</div>`;

    html += `</div>`;

    container.innerHTML = html;
  }

  // ================================
  // PUBLIC API
  // ================================
  window.TSMCausalGraph = {
    render,
    buildGraph
  };

  console.log("[CAUSAL-GRAPH] ready");

})();
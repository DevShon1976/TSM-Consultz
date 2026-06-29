(function () {
  const GRAPH = {
    nodes: [
      { id: "kernel", label: "Kernel Runtime", group: "core" },
      { id: "app", label: "App Runtime", group: "core" },
      { id: "orchestrator", label: "Orchestrator", group: "ai" },
      { id: "guardian", label: "Guardian Layer", group: "security" },
      { id: "missions", label: "Mission Store", group: "data" },
      { id: "bnca", label: "BNCA Engine", group: "decision" },
      { id: "exec", label: "Executive Portal", group: "ui" }
    ],
    edges: [
      { from: "app", to: "kernel", type: "runtime-load" },
      { from: "orchestrator", to: "bnca", type: "decision-feed" },
      { from: "guardian", to: "kernel", type: "protect" },
      { from: "kernel", to: "missions", type: "dispatch" },
      { from: "missions", to: "exec", type: "render" },
      { from: "bnca", to: "exec", type: "recommendation" }
    ]
  };

  function renderGraph() {
    const container = document.createElement("div");
    container.id = "tsm-runtime-graph";
    container.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 360px;
      height: 260px;
      background: rgba(0,0,0,0.85);
      color: #0f0;
      font-family: monospace;
      font-size: 11px;
      padding: 10px;
      border: 1px solid #0f0;
      z-index: 999999;
      overflow: auto;
    `;

    let html = `<b>TSM EXEC RUNTIME GRAPH</b><br><br>`;

    GRAPH.nodes.forEach(n => {
      html += `NODE: ${n.label} [${n.group}]<br>`;
    });

    html += "<br>EDGES:<br>";

    GRAPH.edges.forEach(e => {
      html += `${e.from} → ${e.to} (${e.type})<br>`;
    });

    container.innerHTML = html;
    document.body.appendChild(container);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderGraph);
  } else {
    renderGraph();
  }
})();
window.TSMSectorRegistry = (() => {

  const sectors = {
    healthcare: {
      name: "Healthcare Ops",
      path: "/healthcare/hc-medical/index.html",
      tools: ["doc-ai", "compliance", "cpt-audit"],
      academy: "clinical-ops",
      mode: "simulation"
    },

    insurance: {
      name: "Insurance Ops",
      path: "/insurance/claims/index.html",
      tools: ["claims-ai", "routing", "audit"],
      academy: "claims-processing",
      mode: "simulation"
    },

    construction: {
      name: "Construction Ops",
      path: "/construction/neural-bridge/index.html",
      tools: ["doc-processing", "cost-ai", "project-ops"],
      academy: "cfo-ops",
      mode: "simulation"
    },

    finops: {
      name: "FinOps",
      path: "/finops/index.html",
      tools: ["budget-ai", "forecast", "risk-model"],
      academy: "financial-ops",
      mode: "analytics"
    }
  };

  function get(id) {
    return sectors[id] || null;
  }

  function list() {
    return Object.entries(sectors).map(([id, data]) => ({
      id,
      ...data
    }));
  }

  return {
    get,
    list
  };

})();
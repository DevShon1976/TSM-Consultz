// tsm-sector-router.js
class TSMSectorRouter {
  route(signal) {
    const text = (signal.payload?.text || "").toLowerCase();

    if (text.includes("claim") || text.includes("denial")) return "healthcare";
    if (text.includes("invoice") || text.includes("budget")) return "finops";
    if (text.includes("contract") || text.includes("legal")) return "legal";
    if (text.includes("inspection") || text.includes("build")) return "construction";
    if (text.includes("loan") || text.includes("mortgage")) return "mortgage";
    if (text.includes("insurance")) return "insurance";

    return "general";
  }
}

window.TSMSectorRouter = new TSMSectorRouter();
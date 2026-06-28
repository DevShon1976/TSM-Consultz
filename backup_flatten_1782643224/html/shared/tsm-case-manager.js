class TSMCase {
  constructor(data = {}) {
    this.caseId = data.caseId || `CASE-${Date.now()}`;
    this.sector = data.sector || "general";
    this.vertical = data.vertical || "";
    this.documentId = data.documentId || "";
    this.documentType = data.documentType || "";

    this.title = data.title || "";
    this.anomalyType = data.anomalyType || "";
    this.description = data.description || "";

    this.owner = data.owner || "";
    this.pressure = data.pressure || "MEDIUM";
    this.exposure = data.exposure || 0;
    this.status = data.status || "OPEN";

    this.detectedAt = data.detectedAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();

    this.fields = data.fields || {};
    this.missingFields = data.missingFields || [];
    this.recommendedApps = data.recommendedApps || [];
    this.recommendedActions = data.recommendedActions || [];
    this.memoryMatches = data.memoryMatches || [];
    this.relayTargets = data.relayTargets || [];
    this.autonomousActions = data.autonomousActions || [];
    this.executiveSummary = data.executiveSummary || {};
    this.timeline = data.timeline || [];
    this.relays = data.relays || [];
  }
}

window.TSMCase = TSMCase;

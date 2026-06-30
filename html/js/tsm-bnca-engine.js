// tsm-bnca-engine.js
class TSMBNCAEngine {
  constructor() {
    this.rules = [
      this.highSeverityRule,
      this.financialRiskRule,
      this.complianceRule,
      this.healthcareRule
    ];
  }

  evaluate(mission) {
    const context = {
      score: mission.severity,
      sector: mission.sector,
      type: mission.type,
      payload: mission.payload
    };

    for (let rule of this.rules) {
      const result = rule(context, mission);
      if (result?.decision !== "PASS") {
        return result;
      }
    }

    return {
      decision: "PASS",
      reason: "All BNCA rules cleared",
      action: "EXECUTE"
    };
  }

  // --- RULES ---

  highSeverityRule(ctx) {
    if (ctx.score >= 85) {
      return {
        decision: "ESCALATE",
        reason: "Critical severity threshold exceeded",
        action: "REQUIRE_HUMAN_APPROVAL"
      };
    }
  }

  financialRiskRule(ctx) {
    const text = JSON.stringify(ctx.payload).toLowerCase();

    if (ctx.sector === "finops" && text.includes("loss")) {
      return {
        decision: "ESCALATE",
        reason: "Financial risk pattern detected",
        action: "REVIEW_REQUIRED"
      };
    }
  }

  complianceRule(ctx) {
    const text = JSON.stringify(ctx.payload).toLowerCase();

    if (text.includes("violation") || text.includes("compliance")) {
      return {
        decision: "BLOCK",
        reason: "Compliance risk detected",
        action: "HOLD"
      };
    }
  }

  healthcareRule(ctx) {
    if (ctx.sector === "healthcare" && ctx.score > 70) {
      return {
        decision: "ESCALATE",
        reason: "Healthcare high-risk claim detected",
        action: "BNCA_REVIEW_REQUIRED"
      };
    }
  }
}

window.TSMBNCAEngine = new TSMBNCAEngine();
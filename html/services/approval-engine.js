// ==========================================
// TSM Approval Engine — ONE-SHOT RECOVERY FIX
// Fixes:
// - Missing /services/approval-engine.js
// - "not defined"
// - "not a constructor"
// - broken UI initialization
// ==========================================

class TSMApprovalEngine {

    constructor() {
        this.model = {
            loaded: false,
            data: [],
            rules: {}
        };
    }

    loadModel() {
        this.model.loaded = true;
        console.log("[TSMApprovalEngine] Model initialized");
        return this.model;
    }

    loadSampleData() {
        this.model.data = [
            { id: 1, claim: "CPT 99215", status: "DENIED", amount: 42000 },
            { id: 2, claim: "CPT 99214", status: "APPROVED", amount: 12000 },
            { id: 3, claim: "CPT 81002", status: "DENIED", amount: 8000 }
        ];

        console.log("[TSMApprovalEngine] Sample data loaded");
        return this.model.data;
    }

    analyze() {
        return {
            total: this.model.data.length,
            denied: this.model.data.filter(x => x.status === "DENIED").length,
            approved: this.model.data.filter(x => x.status === "APPROVED").length,
            denialRate: this.model.data.length
                ? (this.model.data.filter(x => x.status === "DENIED").length / this.model.data.length) * 100
                : 0
        };
    }
}

// IMPORTANT: expose globally for HTML access
window.TSMApprovalEngine = TSMApprovalEngine;
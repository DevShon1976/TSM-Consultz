// ================================
// TSM Approval Engine (Constructor Version)
// ================================

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
            { id: 2, claim: "CPT 99214", status: "APPROVED", amount: 12000 }
        ];

        console.log("[TSMApprovalEngine] Sample data loaded");
        return this.model.data;
    }

    analyze() {
        return {
            total: this.model.data.length,
            denied: this.model.data.filter(x => x.status === "DENIED").length,
            approved: this.model.data.filter(x => x.status === "APPROVED").length
        };
    }
}

// expose globally (important for HTML access)
window.TSMApprovalEngine = TSMApprovalEngine;
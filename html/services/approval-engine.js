// ==========================================
// TSM Approval Engine — STABLE PRODUCTION FIX
// Adds missing storage + prevents UI crashes
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

        this.saveToStorage();

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

    // ================================
    // 🔥 ADD MISSING METHODS (FIX)
    // ================================

    saveToStorage() {
        try {
            localStorage.setItem(
                "TSM_APPROVAL_ENGINE_DATA",
                JSON.stringify(this.model.data)
            );
            console.log("[TSMApprovalEngine] Saved to storage");
        } catch (e) {
            console.warn("[TSMApprovalEngine] Storage save failed", e);
        }
    }

    loadFromStorage() {
        try {
            const data = localStorage.getItem("TSM_APPROVAL_ENGINE_DATA");

            if (!data) {
                console.warn("[TSMApprovalEngine] No storage found");
                return [];
            }

            this.model.data = JSON.parse(data);

            console.log("[TSMApprovalEngine] Loaded from storage");
            return this.model.data;

        } catch (e) {
            console.warn("[TSMApprovalEngine] Storage load failed", e);
            return [];
        }
    }
}

// expose globally
window.TSMApprovalEngine = TSMApprovalEngine;
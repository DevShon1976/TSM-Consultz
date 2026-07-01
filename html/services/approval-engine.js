// ================================
// TSM Approval Engine (Recovery Build)
// ================================

window.TSMApprovalEngine = (function () {

    let model = {
        loaded: false,
        data: [],
        rules: {}
    };

    function loadSampleData() {
        model.data = [
            { id: 1, claim: "CPT 99215", status: "DENIED", amount: 42000 },
            { id: 2, claim: "CPT 99214", status: "APPROVED", amount: 12000 }
        ];

        console.log("[TSMApprovalEngine] Sample data loaded");
        return model.data;
    }

    function loadModel() {
        model.loaded = true;
        console.log("[TSMApprovalEngine] Model initialized");
        return model;
    }

    function analyze() {
        return {
            total: model.data.length,
            denied: model.data.filter(x => x.status === "DENIED").length,
            approved: model.data.filter(x => x.status === "APPROVED").length
        };
    }

    return {
        loadModel,
        loadSampleData,
        analyze,
        getModel: () => model
    };

})();
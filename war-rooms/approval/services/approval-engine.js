class ApprovalEngine {
  constructor() {
    this.requests = [];
  }

  loadSampleData() {
    this.requests = [
      {
        id: "APR-1001",
        type: "Purchase Approval",
        owner: "Finance",
        status: "Pending",
        priority: "High"
      },
      {
        id: "APR-1002",
        type: "Sales Discount",
        owner: "Sales",
        status: "Approved",
        priority: "Medium"
      }
    ];

    return this.requests;
  }

  getAll() {
    return this.requests;
  }
}

window.approvalEngine = new ApprovalEngine();
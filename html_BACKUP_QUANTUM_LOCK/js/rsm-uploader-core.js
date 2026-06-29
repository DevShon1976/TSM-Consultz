// ════════════════════════════════════════════════════════════════════════════
// TSM DOCUMENT INDEX  (persistent storage layer — appended to uploader core)
// ════════════════════════════════════════════════════════════════════════════

window.TSMDocIndex = {
  STORAGE_KEY: "tsm_doc_index",
  MAX_ENTRIES: 500,

  /** Load all indexed documents from localStorage */
  load() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || "[]");
    } catch(e) { return []; }
  },

  /** Write the full index back to localStorage */
  save(docs) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(docs));
    } catch(e) { console.warn("[TSMDocIndex] Storage write failed:", e); }
  },

  /** Add a new ingestion payload to the index */
  add(payload) {
    const docs = this.load();
    // Assign a unique doc ID if not already present
    const entry = {
      id:           "DOC-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
      fileName:     payload.fileName     || "Unknown",
      documentType: payload.documentType || "DOCUMENT REPORT",
      vendor:       payload.vendor       || "",
      invoiceNo:    payload.invoiceNo    || "",
      exclusionCode:payload.exclusionCode|| "",
      amount:       payload.amount       || 0,
      sourceNode:   payload.sourceNode   || "unknown",
      routing:      payload.routing      || [],
      timestamp:    payload.timestamp    || Date.now(),
    };
    docs.unshift(entry);
    // Cap at MAX_ENTRIES to prevent localStorage bloat
    if (docs.length > this.MAX_ENTRIES) docs.splice(this.MAX_ENTRIES);
    this.save(docs);
    return entry;
  },

  /** Remove a document by ID */
  remove(id) {
    const docs = this.load().filter(d => d.id !== id);
    this.save(docs);
  },

  /** Clear all indexed documents */
  clear() {
    this.save([]);
  },

  /**
   * Search the index.
   * @param {Object} filters
   * @param {string} filters.query      - Free text (filename, vendor, invoiceNo, docType)
   * @param {string} filters.node       - Node ID to filter by (empty = all)
   * @param {string} filters.suite      - Suite type (healthcare/insurance/finops/construction/all)
   * @param {number} filters.amountMin  - Minimum amount (0 = no minimum)
   * @param {number} filters.amountMax  - Maximum amount (0 = no maximum)
   * @param {string} filters.dateFrom   - ISO date string (empty = no start bound)
   * @param {string} filters.dateTo     - ISO date string (empty = no end bound)
   * @returns {Object[]} Filtered and sorted results
   */
  search(filters = {}) {
    const { query = "", node = "", suite = "", amountMin = 0, amountMax = 0, dateFrom = "", dateTo = "" } = filters;
    const q = query.trim().toLowerCase();

    return this.load().filter(doc => {
      // Free text match across key fields
      if (q) {
        const haystack = [doc.fileName, doc.documentType, doc.vendor, doc.invoiceNo, doc.exclusionCode]
          .join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      // Node filter
      if (node && !doc.routing.includes(node)) return false;
      // Suite filter — match against sourceNode type prefix
      if (suite && suite !== "all") {
        const suiteMap = { healthcare:"hc-", insurance:"tsm-insurance", finops:"finops-", construction:"construction-" };
        const prefix = suiteMap[suite];
        if (prefix && !doc.routing.some(r => r.startsWith(prefix) || r === prefix)) return false;
      }
      // Amount range
      if (amountMin > 0 && doc.amount < amountMin) return false;
      if (amountMax > 0 && doc.amount > amountMax) return false;
      // Date range
      if (dateFrom && doc.timestamp < new Date(dateFrom).getTime()) return false;
      if (dateTo   && doc.timestamp > new Date(dateTo + "T23:59:59").getTime()) return false;

      return true;
    });
  },
};

// ── Auto-index every ingested document ──────────────────────────────────────
// Hook into the bridge so any document processed anywhere gets saved
window.addEventListener("document_processed", e => {
  if (e.detail) window.TSMDocIndex.add(e.detail);
});
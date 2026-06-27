/**
 * tsm-uploader-core.js
 * TSM Enterprise Operating System — Central Document Classification & Routing Engine
 * Version: 2.1.0 — Insurance Node Integration
 *
 * Handles all document ingestion events, classifies payloads against the
 * unified taxonomy, and dispatches routing arrays to the TSMBridge mesh.
 */

"use strict";

// ── GLOBAL UPLOADER STATE ────────────────────────────────────────────────────

window.TSMUploader = window.TSMUploader || {};

/**
 * Central Taxonomy Routing Layer
 *
 * Evaluates document metadata against all registered node vectors and returns
 * an array of destination node IDs. Always includes base system vectors.
 *
 * @param {Object} meta - Document metadata bundle
 * @param {string} meta.documentType  - e.g. "CLAIM", "POLICY", "VENDOR INVOICE (AP)"
 * @param {string} meta.fileName      - Original filename
 * @param {string} meta.invoiceNo     - Invoice or claim reference number
 * @param {string} meta.vendor        - Vendor or asset name
 * @param {string} meta.exclusionCode - Compliance exclusion code, e.g. "VND-2744"
 * @param {number} meta.amount        - Dollar exposure value
 * @param {string} meta.sourceNode    - Originating node ID
 * @returns {string[]} Array of destination node IDs
 */
function classifyDocumentLayers(meta) {

  // Base system vectors — always registered on every ingestion event
  const routes = ["executive-portal", "strategist"];

  const docTypeUpper    = (meta.documentType || "").toUpperCase();
  const fileNameUpper   = (meta.fileName     || "").toUpperCase();
  const invoiceNoUpper  = (meta.invoiceNo    || "").toUpperCase();

  // ── HC VENDORS ROUTING MATRIX ────────────────────────────────────────────
  // Triggers on vendor-flagged documents or VND-prefix exclusion codes
  if (meta.vendor || meta.exclusionCode?.startsWith("VND")) {
    routes.push("hc-vendors");
  }

  // ── TSM INSURANCE ROUTING MATRIX ─────────────────────────────────────────
  // Triggers whenever insurance keywords, claims, coverage variances, or
  // specific compliance codes appear in the document metadata.
  if (
    docTypeUpper.includes("CLAIM")      ||
    docTypeUpper.includes("POLICY")     ||
    docTypeUpper.includes("INSURANCE")  ||
    docTypeUpper.includes("APPEAL")     ||
    docTypeUpper.includes("LIABILITY")  ||
    docTypeUpper.includes("MALPRACTICE")||
    docTypeUpper.includes("UNDERWRITING")||
    fileNameUpper.includes("APPEAL")    ||
    fileNameUpper.includes("CLAIM")     ||
    fileNameUpper.includes("POLICY")    ||
    invoiceNoUpper.startsWith("CLM")    ||
    meta.exclusionCode === "VND-2744"   // Malpractice Insurance Expiry cross-over code
  ) {
    routes.push("tsm-insurance");
  }

  // ── HC BILLING ROUTING MATRIX ─────────────────────────────────────────────
  // Triggers on AR, payer, or billing-specific document types
  if (
    docTypeUpper.includes("BILLING") ||
    docTypeUpper.includes("REMITTANCE") ||
    docTypeUpper.includes("EOB") ||
    invoiceNoUpper.startsWith("AR") ||
    invoiceNoUpper.startsWith("PAY")
  ) {
    routes.push("hc-billing");
  }

  // ── FINOPS ROUTING MATRIX ─────────────────────────────────────────────────
  if (
    docTypeUpper.includes("INVOICE") ||
    docTypeUpper.includes("LEDGER")  ||
    docTypeUpper.includes("BUDGET")  ||
    docTypeUpper.includes("EXPENSE")
  ) {
    routes.push("finops-accounting");
  }

  // ── BNCA CRITICAL ESCALATION TRIGGER ─────────────────────────────────────
  // Any exposure value exceeding $10,000 automatically escalates to the BNCA Engine
  if (meta.amount > 10000) {
    routes.push("bnca-engine");
  }

  // ── CONSTRUCTION ROUTING MATRIX ───────────────────────────────────────────
  if (
    docTypeUpper.includes("PERMIT")   ||
    docTypeUpper.includes("PROPOSAL") ||
    docTypeUpper.includes("LIEN")     ||
    docTypeUpper.includes("BOND")
  ) {
    routes.push("construction-command");
  }

  // Deduplicate route array before returning
  return [...new Set(routes)];
}


/**
 * Builds a standardized metadata bundle from a raw file drop event.
 *
 * @param {File}   file        - The File object from the input or drag event
 * @param {Object} overrides   - Any pre-known metadata to merge in
 * @param {string} sourceNode  - The ID of the node triggering ingestion
 * @returns {Object} Normalized metadata bundle
 */
function buildMetaBundle(file, overrides = {}, sourceNode = "unknown") {
  return {
    fileName:     file.name,
    fileSize:     file.size,
    mimeType:     file.type,
    documentType: overrides.documentType || deriveDocumentType(file.name),
    invoiceNo:    overrides.invoiceNo    || "",
    vendor:       overrides.vendor       || "",
    exclusionCode:overrides.exclusionCode|| "",
    amount:       overrides.amount       || 0,
    sourceNode,
    timestamp:    Date.now(),
  };
}


/**
 * Heuristically derives a document type label from filename patterns.
 *
 * @param {string} fileName
 * @returns {string}
 */
function deriveDocumentType(fileName) {
  const f = fileName.toUpperCase();
  if (f.includes("APPEAL"))      return "CLAIM APPEAL";
  if (f.includes("CLAIM"))       return "CLAIM";
  if (f.includes("POLICY"))      return "POLICY";
  if (f.includes("INVOICE"))     return "VENDOR INVOICE (AP)";
  if (f.includes("LEDGER"))      return "LEDGER";
  if (f.includes("PERMIT"))      return "PERMIT";
  if (f.includes("PROPOSAL"))    return "PROPOSAL";
  if (f.includes("REMITTANCE"))  return "REMITTANCE";
  return "DOCUMENT REPORT";
}


/**
 * Primary ingestion handler — called by all uploader zones on the platform.
 *
 * Builds the metadata bundle, classifies it, dispatches through TSMBridge,
 * and triggers the live payload telemetry renderer if present.
 *
 * @param {File}   file
 * @param {Object} overrides  - Pre-known metadata (amount, vendor, exclusionCode, etc.)
 * @param {string} sourceNode - Origin node ID (from data-source-node attribute)
 */
window.TSMUploader.ingest = function(file, overrides = {}, sourceNode = "unknown") {

  const meta    = buildMetaBundle(file, overrides, sourceNode);
  const routing = classifyDocumentLayers(meta);

  const payload = { ...meta, routing };

  console.log(`[TSMUploader] Ingestion from ${sourceNode}`, payload);

  // ── Dispatch to TSMBridge event bus ──────────────────────────────────────
  if (window.TSMBridge && typeof window.TSMBridge.dispatch === "function") {
    window.TSMBridge.dispatch("document_processed", payload);
  }

  // ── Dispatch custom DOM event for same-tab listeners ─────────────────────
  window.dispatchEvent(new CustomEvent("document_processed", { detail: payload }));

  // ── Write to localStorage mesh relay for cross-tab telemetry ─────────────
  try {
    localStorage.setItem("tsm_bridge_mesh_relay", JSON.stringify({
      ts: Date.now(),
      payload,
    }));
  } catch (e) {
    console.warn("[TSMUploader] LocalStorage relay unavailable:", e);
  }

  return payload;
};


/**
 * Initializes all uploader zones on the current page.
 * Reads data-source-node, data-fallback-amount from each .tsm-uploader-zone
 * and wires up the file input change handler.
 */
window.TSMUploader.initZones = function() {
  document.querySelectorAll(".tsm-uploader-zone").forEach(zone => {
    const sourceNode     = zone.dataset.sourceNode    || "unknown";
    const fallbackAmount = parseFloat(zone.dataset.fallbackAmount) || 0;
    const input          = zone.querySelector(".tsm-file-input");

    if (!input) return;

    input.addEventListener("change", function() {
      const file = this.files[0];
      if (!file) return;

      window.TSMUploader.ingest(file, { amount: fallbackAmount }, sourceNode);

      // Visual feedback
      const statusEl = zone.querySelector(".uploader-status-text");
      if (statusEl) {
        statusEl.textContent = `> Ingesting: ${file.name} — routing in progress...`;
      }

      this.value = ""; // reset input
    });

    // Drag-and-drop support
    const dropTarget = zone.querySelector(".drop-target") || zone;

    dropTarget.addEventListener("dragover", e => {
      e.preventDefault();
      dropTarget.classList.add("drag-active");
    });

    dropTarget.addEventListener("dragleave", () => {
      dropTarget.classList.remove("drag-active");
    });

    dropTarget.addEventListener("drop", e => {
      e.preventDefault();
      dropTarget.classList.remove("drag-active");
      const file = e.dataTransfer.files[0];
      if (!file) return;
      window.TSMUploader.ingest(file, { amount: fallbackAmount }, sourceNode);
    });
  });
};


// Auto-initialize on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  window.TSMUploader.initZones();
});

// Export classification utility for external callers
window.TSMUploader.classify = classifyDocumentLayers;
window.TSMUploader.buildMeta = buildMetaBundle;
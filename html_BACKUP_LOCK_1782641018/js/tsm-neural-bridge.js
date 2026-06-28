/**
 * tsm-neural-bridge.js
 * TSM Enterprise Operating System — Neural Bridge & Event Mesh
 * Version: 2.1.0 — Insurance Node Integration + Live Payload Telemetry
 *
 * Provides the global TSMBridge event bus, the unified node registry,
 * and the live payload telemetry console renderer.
 */

"use strict";

// ── NODE REGISTRY ─────────────────────────────────────────────────────────────
/**
 * Master registry of all platform nodes.
 * Each node entry defines its suite classification and keyword triggers
 * used by the classification engine and downstream dashboard listeners.
 */
window.TSMNodes = {

  // ── Healthcare ──────────────────────────────────────────────────────────────
  "hc-vendors": {
    type:     "healthcare",
    suite:    "Healthcare",
    label:    "HC Vendors",
    keywords: ["vendor", "credential", "contract", "vnd"],
    color:    "#22d3a0",
  },
  "hc-billing": {
    type:     "healthcare",
    suite:    "Healthcare",
    label:    "HC Billing",
    keywords: ["claim", "ar", "payer", "remittance", "eob"],
    color:    "#22d3a0",
  },
  "hc-compliance": {
    type:     "healthcare",
    suite:    "Healthcare",
    label:    "HC Compliance",
    keywords: ["hipaa", "audit", "violation", "exclusion"],
    color:    "#22d3a0",
  },

  // ── Insurance ───────────────────────────────────────────────────────────────
  "tsm-insurance": {
    type:     "insurance",
    suite:    "Insurance",
    label:    "TSM Insurance",
    keywords: ["claim", "appeal", "coverage", "liability", "malpractice", "underwriting", "policy", "clm"],
    color:    "#38bdf8",
  },

  // ── FinOps ──────────────────────────────────────────────────────────────────
  "finops-accounting": {
    type:     "finops",
    suite:    "FinOps",
    label:    "FinOps Accounting",
    keywords: ["invoice", "ledger", "budget", "expense", "ap", "ar"],
    color:    "#86efac",
  },

  // ── Construction ────────────────────────────────────────────────────────────
  "construction-command": {
    type:     "construction",
    suite:    "Construction",
    label:    "Construction Command",
    keywords: ["permit", "proposal", "lien", "bond", "contract"],
    color:    "#fbbf24",
  },

  // ── System / Executive ──────────────────────────────────────────────────────
  "executive-portal": {
    type:     "executive",
    suite:    "Executive",
    label:    "Executive Portal",
    keywords: ["*"],  // receives all events
    color:    "#1ee8b6",
  },
  "strategist": {
    type:     "executive",
    suite:    "Executive",
    label:    "Strategist Mesh",
    keywords: ["*"],
    color:    "#1ee8b6",
  },
  "bnca-engine": {
    type:     "system",
    suite:    "System",
    label:    "BNCA Engine",
    keywords: ["critical", "escalation"],
    color:    "#f87171",
  },
};


// ── EVENT BUS ─────────────────────────────────────────────────────────────────
/**
 * TSMBridge — lightweight event bus for cross-component communication.
 * Supports named event subscriptions and direct dispatch.
 */
window.TSMBridge = (function() {
  const _listeners = {};

  return {
    /**
     * Subscribe to a named event.
     * @param {string}   event
     * @param {Function} callback
     */
    on(event, callback) {
      if (!_listeners[event]) _listeners[event] = [];
      _listeners[event].push(callback);
    },

    /**
     * Unsubscribe a specific callback from an event.
     * @param {string}   event
     * @param {Function} callback
     */
    off(event, callback) {
      if (!_listeners[event]) return;
      _listeners[event] = _listeners[event].filter(fn => fn !== callback);
    },

    /**
     * Dispatch a named event with a data payload.
     * @param {string} event
     * @param {Object} data
     */
    dispatch(event, data) {
      console.log(`[TSMBridge] Event: ${event}`, data);
      (_listeners[event] || []).forEach(fn => {
        try { fn(data); } catch(e) { console.error("[TSMBridge] Listener error:", e); }
      });
    },
  };
})();


// ── LIVE PAYLOAD TELEMETRY RENDERER ──────────────────────────────────────────
/**
 * Renders a structured ingestion event entry into the on-screen
 * live ledger console (#live-ledger-stream).
 *
 * Called automatically by the mesh relay and same-tab event listeners.
 *
 * @param {Object} data
 * @param {Object} data.payload  - The full metadata + routing bundle
 * @param {number} data.ts       - Unix timestamp of the event
 */
window.TSMBridge.renderPayloadTelemetry = function(data) {
  const streamContainer = document.getElementById("live-ledger-stream");
  if (!streamContainer) return; // graceful exit if ledger not present on this page

  // Remove idle placeholder on first real event
  const placeholder = streamContainer.querySelector(".ledger-placeholder");
  if (placeholder) placeholder.remove();

  const timestamp = new Date(data.ts || Date.now()).toLocaleTimeString();
  const p = data.payload || {};

  // Build delivery tag HTML for each routed node
  const transmissionNodesHtml = (p.routing || []).map(node => {
    const nodeInfo = window.TSMNodes[node] || {};
    const color    = nodeInfo.color || "#88ff88";
    return `<span style="
      background: rgba(0,0,0,0.4);
      color: ${color};
      padding: 2px 7px;
      border: 1px solid ${color}44;
      border-radius: 3px;
      font-size: 10px;
      margin: 2px 3px 2px 0;
      display: inline-block;
      white-space: nowrap;
    ">→ ${node} [DELIVERED]</span>`;
  }).join("");

  // Compact metadata snippet shown in the console
  const cleanSnippet = {
    docType:        p.documentType   || "UNKNOWN",
    targetAsset:    p.vendor         || p.fileName || "N/A",
    exposureVal:    p.amount         || "N/A",
    complianceCode: p.exclusionCode  || "NONE",
    routingCount:   (p.routing || []).length,
  };

  // Determine accent color based on escalation status
  const isEscalated  = (p.routing || []).includes("bnca-engine");
  const isInsurance  = (p.routing || []).includes("tsm-insurance");
  const accentColor  = isEscalated ? "#f87171" : isInsurance ? "#38bdf8" : "#ffb74d";
  const borderColor  = isEscalated ? "#7f3535" : isInsurance ? "#1a3a50" : "#554422";

  const logEntryHtml = `
    <div class="ledger-log-entry" style="
      border-left: 2px solid ${accentColor};
      padding: 8px 0 8px 10px;
      margin-bottom: 12px;
      animation: tsmFadeIn 0.3s ease-out;
    ">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
        <span style="color: ${accentColor}; font-weight: bold; font-size: 11px;">
          [INGESTION EVENT] From: ${p.sourceNode || "unknown"}
          ${isEscalated  ? ' <span style="color:#f87171;">⚠ BNCA ESCALATED</span>'  : ""}
          ${isInsurance  ? ' <span style="color:#38bdf8;">🛡 INSURANCE ROUTED</span>' : ""}
        </span>
        <span style="color: #556655; font-size: 10px;">${timestamp}</span>
      </div>
      <div style="margin-bottom: 6px; font-size: 10px; color: #888; line-height: 1.8;">
        <strong style="color:#66aa66;">Dispatched Targets:</strong><br>
        ${transmissionNodesHtml}
      </div>
      <div style="
        background: #0d1410;
        border: 1px dashed ${borderColor};
        padding: 7px 10px;
        border-radius: 3px;
        color: #a9b7a6;
        overflow-x: auto;
        white-space: pre;
        font-size: 10px;
        line-height: 1.6;
      ">${JSON.stringify(cleanSnippet, null, 2)}</div>
    </div>
  `;

  streamContainer.insertAdjacentHTML("afterbegin", logEntryHtml);

  // Enforce max entry cap — keep last 20 entries to avoid memory bloat
  const entries = streamContainer.querySelectorAll(".ledger-log-entry");
  if (entries.length > 20) {
    entries[entries.length - 1].remove();
  }
};


// ── MESH RELAY — CROSS-TAB LISTENER ──────────────────────────────────────────
/**
 * Catches payload events dispatched from other open browser tabs
 * via the localStorage mesh relay written by tsm-uploader-core.js.
 */
window.addEventListener("storage", (e) => {
  if (e.key === "tsm_bridge_mesh_relay" && e.newValue) {
    try {
      const data = JSON.parse(e.newValue);
      window.TSMBridge.renderPayloadTelemetry(data);

      // Also fire through the event bus so page-specific listeners respond
      if (data.payload) {
        window.TSMBridge.dispatch("document_processed", data.payload);
      }
    } catch (err) {
      console.warn("[TSMBridge] Mesh relay parse error:", err);
    }
  }
});


// ── SAME-TAB EVENT LISTENER ───────────────────────────────────────────────────
/**
 * Catches document_processed CustomEvents fired within the same browser tab
 * by tsm-uploader-core.js, and pipes them into the telemetry renderer.
 */
window.addEventListener("document_processed", (e) => {
  window.TSMBridge.renderPayloadTelemetry({
    ts:      Date.now(),
    payload: e.detail,
  });
});


// ── INSURANCE SUITE DASHBOARD LISTENER ───────────────────────────────────────
/**
 * Passive listener for insurance-routed documents.
 * Appends new claim rows to #insurance-claims-table if present on the page.
 */
window.TSMBridge.on("document_processed", (data) => {
  if (!data.routing || !data.routing.includes("tsm-insurance")) return;

  console.log(`[Mesh Hub] Insurance payload intercepted from ${data.sourceNode}. Appending to Insurance Queue.`);

  const insuranceTableBody = document.querySelector("#insurance-claims-table tbody");
  if (!insuranceTableBody) return;

  const claimId  = data.invoiceNo || "CLM-" + Math.floor(Math.random() * 90000 + 10000);
  const vendor   = data.vendor    || "Primary Asset Target";
  const amount   = typeof data.amount === "number"
    ? "$" + data.amount.toLocaleString()
    : "N/A";
  const docType  = data.documentType || "DOCUMENT REPORT";
  const ts       = new Date(data.timestamp || Date.now()).toLocaleTimeString();

  const isBnca   = data.routing.includes("bnca-engine");
  const badge    = isBnca
    ? `<span class="badge ba" style="background:#f87171;color:#1a0000;">CRITICAL — BNCA</span>`
    : `<span class="badge ba">PENDING RECONCILE</span>`;

  const newRow = `
    <tr class="highlight-flash">
      <td>${claimId}</td>
      <td>${vendor}</td>
      <td>${docType}</td>
      <td>${badge}</td>
      <td>${amount}</td>
      <td>${ts}</td>
    </tr>
  `;

  insuranceTableBody.insertAdjacentHTML("afterbegin", newRow);
});


// ── KEYFRAME ANIMATION INJECTION ─────────────────────────────────────────────
// Injected once into the document head so ledger entries animate in cleanly
(function injectAnimations() {
  if (document.getElementById("tsm-bridge-styles")) return;
  const style = document.createElement("style");
  style.id = "tsm-bridge-styles";
  style.textContent = `
    @keyframes tsmFadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes blink {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.3; }
    }
    .highlight-flash {
      animation: tsmFadeIn 0.4s ease-out;
    }
    .drag-active {
      outline: 2px dashed #1ee8b6 !important;
      background: rgba(30,232,182,0.05) !important;
    }
  `;
  document.head.appendChild(style);
})();

console.log("[TSMBridge] Neural Bridge v2.1.0 initialized — Insurance node active.");
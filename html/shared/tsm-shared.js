/**
 * tsm-shared.js  –  single source of truth for common UI utilities
 * Loaded by every suite HTML before closing </head>
 */

/* ── Tab switching ─────────────────────────────────────── */
window.showTab = function (id, el) {
  document.querySelectorAll(".tab-content").forEach(c => (c.style.display = "none"));
  const panel = document.getElementById(id);
  if (panel) panel.style.display = "block";
  document.querySelectorAll(".nav-tab").forEach(n => n.classList.remove("active"));
  if (el) el.classList.add("active");
};

window.switchTab = function (t) {
  document.querySelectorAll(".trm-tab").forEach(e => e.classList.remove("active"));
  document.querySelectorAll(".trm-panel").forEach(e => e.classList.remove("active"));
  const target = document.getElementById(t);
  if (target) target.classList.add("active");
};

window.filterTab = function (t) {
  window.switchTab(t);
};

/* ── TSM_UI bootstrap ──────────────────────────────────── */
document.addEventListener("DOMContentLoaded", function () {
  if (typeof TSM_UI !== "undefined" && !window.ui) {
    window.ui = typeof TSM_UI === "function" ? new TSM_UI() : TSM_UI;
  }
});

/* ── Right-click / devtools guard (preserve existing behaviour) ─ */
if (!document._tsmGuardInstalled) {
  document._tsmGuardInstalled = true;
  document.addEventListener("contextmenu", e => e.preventDefault());
  document.addEventListener("keydown", e => {
    if (
      e.keyCode === 123 ||
      (e.ctrlKey && e.shiftKey && [73, 74, 67].includes(e.keyCode)) ||
      (e.ctrlKey && e.keyCode === 85)
    )
      e.preventDefault();
  });
}

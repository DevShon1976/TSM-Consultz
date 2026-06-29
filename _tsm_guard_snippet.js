// TSM_RUNTIME_GUARD
(function () {
  if (typeof window === "undefined" || typeof document === "undefined") {
    console.warn("[TSM] Browser runtime graph skipped in non-browser environment.");
    return;
  }
})();

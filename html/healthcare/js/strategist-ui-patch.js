/**
 * strategist-ui-patch.js
 * Paste this into the browser console OR add as a <script> at end of
 * finops-main-strategist/index.html to rebrand all LLM references.
 *
 * For a permanent fix, apply the find/replace list below directly to your HTML.
 *
 * FIND → REPLACE (apply to ALL html/js files in your project):
 *
 *   "POWERED BY GROQ"           → "POWERED BY TSM NEURAL CORE"
 *   "Groq API Key"              → "Neural Core Access Key"
 *   "Groq inference"            → "TSM Neural Core"
 *   "ultra-low latency"         → "high-performance inference"
 *   "gsk_"  (placeholder text)  → "ncak_" (Neural Core Access Key prefix)
 *   "llama-3.3-70b-versatile"   → "TSM Neural Core · Standard"
 *   "llama-3.1-8b-instant"      → "TSM Neural Core · Fast"
 *   "mixtral-8x7b-32768"        → "TSM Neural Core · Extended"
 *   "70B params · 128k ctx"     → "Standard · 128k context"
 *   "Best for: executive"       → "Optimized for: executive"
 *   id="groqKey"                → id="neuralKey"  (also update JS references)
 *   id="modelLabel" content     → "TSM Neural Core · Standard"
 */

(function patchUI() {

  // ── 1. Section header ─────────────────────────────────────────────────────
  document.querySelectorAll('b, span, div').forEach(el => {
    if (el.children.length === 0) {
      el.textContent = el.textContent
        .replace(/POWERED BY GROQ/gi,       'POWERED BY TSM NEURAL CORE')
        .replace(/Groq API Key/gi,           'Neural Core Access Key')
        .replace(/Groq inference/gi,         'TSM Neural Core')
        .replace(/ultra-low latency/gi,      'high-performance inference')
        .replace(/llama-3\.3-70b-versatile/g,'TSM Neural Core · Standard')
        .replace(/llama-3\.1-8b-instant/g,   'TSM Neural Core · Fast')
        .replace(/mixtral-8x7b-32768/g,      'TSM Neural Core · Extended')
        .replace(/70B params/g,              'Standard')
        .replace(/Best for:/g,               'Optimized for:');
    }
  });

  // ── 2. Input placeholder ──────────────────────────────────────────────────
  const keyInput = document.getElementById('groqKey') || document.getElementById('neuralKey');
  if (keyInput) {
    keyInput.placeholder = '••••••••••••••••••••';
    keyInput.id = 'neuralKey';
  }

  // ── 3. Model select options ───────────────────────────────────────────────
  const sel = document.getElementById('modelSel');
  if (sel) {
    const map = {
      'llama-3.3-70b-versatile': 'TSM Neural Core · Standard',
      'llama-3.1-8b-instant':    'TSM Neural Core · Fast',
      'mixtral-8x7b-32768':      'TSM Neural Core · Extended'
    };
    sel.querySelectorAll('option').forEach(opt => {
      if (map[opt.value]) opt.textContent = map[opt.value];
    });
  }

  // ── 4. Model label ────────────────────────────────────────────────────────
  const ml = document.getElementById('modelLabel');
  if (ml) ml.textContent = 'TSM Neural Core · Standard';

  // ── 5. Footer / status text ───────────────────────────────────────────────
  document.querySelectorAll('.footer span, #footerStatus').forEach(el => {
    el.textContent = el.textContent.replace(/groq/gi, 'TSM Neural Core');
  });

  console.log('[TSM] UI patch applied — provider branding removed.');
})();
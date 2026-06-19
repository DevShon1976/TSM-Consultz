/**
 * TSM CURE CHEATSHEET  v1.0
 * Reads TSM_CURE_RELAY from localStorage, calls the vertical's API endpoint to map
 * document anomalies → target app fields, renders a draggable floating panel.
 *
 * Usage: <script src="/shared/tsm-cure-cheatsheet.js"></script>
 * Optionally set window.TSM_CURE_FIELDS before this script to pass the field schema.
 * e.g. window.TSM_CURE_FIELDS = [{id:'inv-vendor',label:'Vendor'}, ...]
 */
(function () {
  'use strict';

  const RELAY_KEY = 'TSM_CURE_RELAY';
  const STYLE_ID  = 'tsm-cure-cheatsheet-style';
  // localStorage is used (not sessionStorage) so relay survives the new-tab open

  // ── Inject CSS once ──────────────────────────────────────────────────────────
  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
#tsm-cure-sheet {
  position: fixed; bottom: 24px; right: 24px; z-index: 99999;
  width: 340px; max-height: 72vh;
  background: #06091a; border: 1px solid rgba(0,229,255,0.35);
  border-radius: 4px; box-shadow: 0 0 32px rgba(0,229,255,0.12);
  display: flex; flex-direction: column; font-family: 'JetBrains Mono', monospace;
  transition: box-shadow .2s;
}
#tsm-cure-sheet.dragging { box-shadow: 0 0 48px rgba(0,229,255,0.22); }
#tsm-cure-header {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px; background: rgba(0,229,255,0.07);
  border-bottom: 1px solid rgba(0,229,255,0.15);
  cursor: move; user-select: none; flex-shrink: 0;
}
#tsm-cure-header .cs-dot {
  width: 7px; height: 7px; border-radius: 50%; background: #00e5ff;
  box-shadow: 0 0 6px #00e5ff; flex-shrink: 0; animation: csBlink 1.8s ease-in-out infinite;
}
@keyframes csBlink { 0%,100%{opacity:1} 50%{opacity:.35} }
#tsm-cure-header .cs-title {
  font-size: 8px; letter-spacing: 1.5px; color: #00e5ff; text-transform: uppercase; flex: 1;
}
#tsm-cure-header .cs-source {
  font-size: 7px; color: #3a5a7a; letter-spacing: .5px; max-width: 120px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
#tsm-cure-header .cs-dismiss {
  font-size: 10px; color: #3a5a7a; cursor: pointer; padding: 0 4px; line-height: 1;
  border: none; background: none;
}
#tsm-cure-header .cs-dismiss:hover { color: #ff3d57; }
#tsm-cure-body {
  overflow-y: auto; padding: 10px 12px; flex: 1;
}
#tsm-cure-body::-webkit-scrollbar { width: 4px; }
#tsm-cure-body::-webkit-scrollbar-track { background: transparent; }
#tsm-cure-body::-webkit-scrollbar-thumb { background: rgba(0,229,255,0.2); border-radius: 2px; }
.cs-context-row {
  font-size: 8px; color: #4a6080; line-height: 1.6; margin-bottom: 10px;
  padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.04);
}
.cs-field-row {
  display: flex; flex-direction: column; gap: 3px;
  padding: 7px 0; border-bottom: 1px solid rgba(255,255,255,0.04);
}
.cs-field-row:last-child { border-bottom: none; }
.cs-field-header { display: flex; align-items: center; justify-content: space-between; }
.cs-field-label {
  font-size: 7px; letter-spacing: 1px; color: #5a7a9a; text-transform: uppercase;
}
.cs-fill-btn {
  font-size: 7px; letter-spacing: .8px; color: #00e5ff;
  border: 1px solid rgba(0,229,255,0.3); background: rgba(0,229,255,0.06);
  padding: 2px 7px; cursor: pointer; border-radius: 2px; font-family: inherit;
  white-space: nowrap; flex-shrink: 0;
}
.cs-fill-btn:hover { background: rgba(0,229,255,0.14); }
.cs-fill-btn.filled { color: #00e676; border-color: rgba(0,230,118,0.3); background: rgba(0,230,118,0.06); }
.cs-field-value {
  font-size: 9.5px; color: #c8d8f0; line-height: 1.5;
  word-break: break-word;
}
.cs-field-reason {
  font-size: 8px; color: #3a5a70; line-height: 1.4; font-style: italic;
}
.cs-loading {
  font-size: 9px; color: #3a5a7a; padding: 20px 0; text-align: center; line-height: 2;
}
.cs-loading span { display: block; }
.cs-error { font-size: 9px; color: #ff3d57; padding: 12px 0; text-align: center; }
#tsm-cure-footer {
  padding: 8px 12px; border-top: 1px solid rgba(255,255,255,0.05);
  display: flex; gap: 8px; flex-shrink: 0;
}
.cs-fill-all-btn {
  flex: 1; font-size: 7.5px; letter-spacing: 1px; color: #00e5ff;
  border: 1px solid rgba(0,229,255,0.3); background: rgba(0,229,255,0.06);
  padding: 6px; cursor: pointer; font-family: inherit; border-radius: 2px; text-transform: uppercase;
}
.cs-fill-all-btn:hover { background: rgba(0,229,255,0.12); }
.cs-clear-btn {
  font-size: 7.5px; letter-spacing: 1px; color: #5a6f90;
  border: 1px solid rgba(255,255,255,0.08); background: transparent;
  padding: 6px 10px; cursor: pointer; font-family: inherit; border-radius: 2px; text-transform: uppercase;
}
.cs-clear-btn:hover { color: #ff3d57; border-color: rgba(255,61,87,0.3); }
    `;
    document.head.appendChild(s);
  }

  // ── Build field schema from DOM if not provided ───────────────────────────────
  function gatherFields() {
    if (window.TSM_CURE_FIELDS && window.TSM_CURE_FIELDS.length) return window.TSM_CURE_FIELDS;
    const fields = [];
    document.querySelectorAll('input.field, textarea.field, select.field, .field[id]').forEach(el => {
      if (!el.id) return;
      const lbl = el.closest('.field-group')?.querySelector('.field-lbl')?.textContent?.trim()
               || el.placeholder || el.id;
      if (lbl && lbl.length < 60) fields.push({ id: el.id, label: lbl, type: el.tagName.toLowerCase() });
    });
    return fields;
  }

  // ── Detect the right API endpoint for this app ───────────────────────────────
  function detectEndpoint() {
    const url = window.location.pathname;
    const scripts = Array.from(document.querySelectorAll('script:not([src])'))
      .map(s => s.textContent).join(' ');
    const endpointMatch = scripts.match(/fetch\(['\"`](\/api\/[^'\"`?]+)/);
    if (endpointMatch) return endpointMatch[1];
    if (/\/healthcare\/|\/hc-/.test(url))     return '/api/hc/query';
    if (/\/finops-/.test(url))                return '/api/financial/query';
    if (/\/legal-|\/bpo-legal/.test(url))     return '/api/legal/query';
    if (/\/bpo\/|\/bpo-/.test(url))           return '/api/bpo/query';
    if (/\/construction/.test(url))           return '/api/construction/query';
    if (/\/insurance|\/ins-/.test(url))       return '/api/insurance/query';
    if (/\/re-|\/real-estate/.test(url))      return '/api/re/query';
    return '/api/hc/query';
  }

  // ── Build request body matching each endpoint's expected shape ───────────────
  function buildBody(endpoint, system, question) {
    if (endpoint === '/api/groq') {
      return JSON.stringify({ messages: [{ role: 'system', content: system }, { role: 'user', content: question }], max_tokens: 900 });
    }
    return JSON.stringify({ system, question, maxTokens: 900 });
  }

  // ── Call AI to map doc → fields ──────────────────────────────────────────────
  async function getFieldMappings(relay, fields) {
    const fieldList  = fields.map(f => `${f.id} — ${f.label}`).join('\n');
    const docPreview = (relay.docText || relay.documentMeta?.preview || '').slice(0, 2000);
    const anomalies  = (relay.anomalies || []).map(a => `• ${a}`).join('\n') || 'See document above.';
    const howTo      = relay.appHowTo || '';

    const system = 'You are a precise field-mapping assistant for the TSM platform. Respond only with valid JSON arrays, no markdown, no preamble.';
    const question = `You are mapping a source document to target app fields to help cure detected anomalies.

DOCUMENT (excerpt):
${docPreview}

ANOMALIES DETECTED:
${anomalies}

HOW TO USE THIS APP FOR THIS ISSUE:
${howTo}

TARGET APP FIELDS (id — label):
${fieldList}

For each field that can be populated from the document, return a JSON array.
Each object: { "id": "<field-id>", "label": "<label>", "value": "<extracted value>", "reason": "<1 sentence why this value matters for curing the anomaly>" }
Only include fields with a concrete value from the document. Return ONLY a valid JSON array.`;

    const endpoint = detectEndpoint();
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: buildBody(endpoint, system, question)
    });
    if (!resp.ok) throw new Error('API ' + resp.status);
    const data = await resp.json();
    const raw  = (data.answer || data.response || data.text || data.content || '').trim()
                   .replace(/^```json|^```|```$/g, '').trim();
    return JSON.parse(raw);
  }

  // ── Fill a single field ──────────────────────────────────────────────────────
  function fillField(fieldId, value, btn) {
    const el = document.getElementById(fieldId);
    if (!el) return;
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.style.transition = 'background .4s';
    el.style.background = 'rgba(0,230,118,0.12)';
    setTimeout(() => { el.style.background = ''; }, 1200);
    if (btn) { btn.textContent = '✓ FILLED'; btn.classList.add('filled'); }
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // ── Build the panel ──────────────────────────────────────────────────────────
  function buildPanel(relay) {
    const panel = document.createElement('div');
    panel.id = 'tsm-cure-sheet';
    panel.innerHTML = `
      <div id="tsm-cure-header">
        <div class="cs-dot"></div>
        <div class="cs-title">Field Cheat Sheet</div>
        <div class="cs-source">${relay.appName || 'Relay'}</div>
        <button class="cs-dismiss" title="Dismiss" id="tsm-cure-dismiss">✕</button>
      </div>
      <div id="tsm-cure-body">
        <div class="cs-loading">
          <span>⬡ Mapping document to fields...</span>
          <span style="color:#2a3a52;font-size:8px">Analyzing anomalies + document context</span>
        </div>
      </div>
      <div id="tsm-cure-footer" style="display:none">
        <button class="cs-fill-all-btn" id="tsm-cure-fill-all">⬡ FILL ALL FIELDS</button>
        <button class="cs-clear-btn" id="tsm-cure-clear">CLEAR</button>
      </div>
    `;
    document.body.appendChild(panel);

    panel.querySelector('#tsm-cure-dismiss').onclick = () => {
      panel.remove();
      localStorage.removeItem(RELAY_KEY);
    };

    makeDraggable(panel, panel.querySelector('#tsm-cure-header'));
    return panel;
  }

  function renderMappings(panel, relay, mappings) {
    const body   = panel.querySelector('#tsm-cure-body');
    const footer = panel.querySelector('#tsm-cure-footer');

    if (!mappings.length) {
      body.innerHTML = '<div class="cs-error">No field matches found
/**
 * TSM CURE CONDUCTOR v1.0
 * Shared across all TSM war rooms.
 * Intercepts launchApp() clicks → generates AI step-by-step cure panel via Groq.
 * Drop at: html//js/tsm-mission-conductor.js
 * Load with: <script src="../..//js/tsm-mission-conductor.js"></script>
 */

(function(){
  'use strict';

  // ── Inject styles ──────────────────────────────────────────────────────────
  const STYLE = `
    #tsm-cure-overlay {
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(0,0,0,0.72);
      display: flex; align-items: center; justify-content: center;
      font-family: 'Share Tech Mono', 'Courier New', monospace;
    }
    #tsm-cure-panel {
      background: #0a0f0a;
      border: 1px solid #00ff9d;
      border-radius: 4px;
      width: 680px; max-width: 96vw;
      max-height: 88vh;
      display: flex; flex-direction: column;
      box-shadow: 0 0 40px rgba(0,255,157,0.15);
    }
    #tsm-cure-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 18px 12px;
      border-bottom: 1px solid #1a2e1a;
    }
    #tsm-cure-header-left { display: flex; flex-direction: column; gap: 2px; }
    #tsm-cure-app-name {
      color: #00ff9d; font-size: 13px; letter-spacing: 0.12em; text-transform: uppercase;
    }
    #tsm-cure-subtitle {
      color: #4a6a4a; font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase;
    }
    #tsm-cure-counter {
      color: #4a6a4a; font-size: 11px; letter-spacing: 0.08em;
    }
    #tsm-cure-close {
      background: none; border: 1px solid #1a2e1a; color: #4a6a4a;
      font-family: inherit; font-size: 11px; padding: 4px 10px;
      cursor: pointer; letter-spacing: 0.08em; text-transform: uppercase;
      border-radius: 2px;
    }
    #tsm-cure-close:hover { border-color: #ff4444; color: #ff4444; }
    #tsm-cure-body {
      flex: 1; overflow-y: auto; padding: 20px 18px;
    }
    #tsm-cure-loading {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 12px; padding: 40px 0;
      color: #4a6a4a; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;
    }
    .tsm-cure-spinner {
      width: 28px; height: 28px;
      border: 2px solid #1a2e1a;
      border-top-color: #00ff9d;
      border-radius: 50%;
      animation: tsm-spin 0.8s linear infinite;
    }
    @keyframes tsm-spin { to { transform: rotate(360deg); } }
    .tsm-cure-step {
      display: flex; gap: 14px; margin-bottom: 20px;
      padding-bottom: 20px; border-bottom: 1px solid #0d1a0d;
    }
    .tsm-cure-step:last-child { border-bottom: none; margin-bottom: 0; }
    .tsm-cure-step-num {
      flex-shrink: 0;
      width: 26px; height: 26px;
      border: 1px solid #00ff9d;
      border-radius: 2px;
      display: flex; align-items: center; justify-content: center;
      color: #00ff9d; font-size: 11px;
      transition: all 0.2s;
    }
    .tsm-cure-step.done .tsm-cure-step-num {
      background: #00ff9d; color: #000; border-color: #00ff9d;
    }
    .tsm-cure-step.done .tsm-cure-step-num::after { content: '✓'; }
    .tsm-cure-step.done .tsm-cure-step-num span { display: none; }
    .tsm-cure-step-content { flex: 1; }
    .tsm-cure-step-title {
      color: #00ff9d; font-size: 11px; letter-spacing: 0.1em;
      text-transform: uppercase; margin-bottom: 6px;
    }
    .tsm-cure-step.done .tsm-cure-step-title { color: #2a4a2a; text-decoration: line-through; }
    .tsm-cure-step-instruction {
      color: #8aaa8a; font-size: 12px; line-height: 1.6;
      margin-bottom: 8px;
    }
    .tsm-cure-step.done .tsm-cure-step-instruction { color: #2a4a2a; }
    .tsm-cure-field-hint {
      background: #0d1a0d; border-left: 2px solid #00ff9d;
      padding: 6px 10px; font-size: 11px; color: #00cc7a;
      letter-spacing: 0.04em; margin-bottom: 8px;
    }
    .tsm-cure-step.done .tsm-cure-field-hint { border-color: #1a2e1a; color: #1a3a1a; }
    .tsm-cure-done-btn {
      background: none; border: 1px solid #1a3a1a; color: #2a5a2a;
      font-family: inherit; font-size: 10px; padding: 4px 12px;
      cursor: pointer; letter-spacing: 0.08em; text-transform: uppercase;
      border-radius: 2px; transition: all 0.2s;
    }
    .tsm-cure-done-btn:hover { border-color: #00ff9d; color: #00ff9d; }
    .tsm-cure-step.done .tsm-cure-done-btn { display: none; }
    #tsm-cure-footer {
      padding: 14px 18px;
      border-top: 1px solid #1a2e1a;
      display: flex; align-items: center; justify-content: space-between; gap: 10px;
    }
    #tsm-cure-open-btn {
      background: #00ff9d; color: #000;
      border: none; font-family: inherit; font-size: 11px;
      padding: 9px 20px; cursor: pointer;
      letter-spacing: 0.1em; text-transform: uppercase;
      border-radius: 2px; font-weight: bold;
    }
    #tsm-cure-open-btn:hover { background: #00cc7a; }
    #tsm-cure-progress {
      color: #4a6a4a; font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase;
    }
    #tsm-cure-error {
      color: #ff4444; font-size: 11px; text-align: center; padding: 30px 0;
      letter-spacing: 0.08em;
    }
  `;

  function injectStyles(){
    if(document.getElementById('tsm-cure-styles')) return;
    const s = document.createElement('style');
    s.id = 'tsm-cure-styles';
    s.textContent = STYLE;
    document.head.appendChild(s);
  }

  // ── State ──────────────────────────────────────────────────────────────────
  let _state = {
    href: null,
    appMeta: null,
    context: null,
    steps: [],
    loading: false
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  function render(){
    let overlay = document.getElementById('tsm-cure-overlay');
    if(!overlay){
      overlay = document.createElement('div');
      overlay.id = 'tsm-cure-overlay';
      overlay.addEventListener('click', function(e){ if(e.target===overlay) close(); });
      document.body.appendChild(overlay);
    }

    const doneCount = _state.steps.filter(s=>s.done).length;
    const total = _state.steps.length;

    overlay.innerHTML = `
      <div id="tsm-cure-panel">
        <div id="tsm-cure-header">
          <div id="tsm-cure-header-left">
            <div id="tsm-cure-app-name">⚡ ${esc(_state.appMeta?.name||'App')}</div>
            <div id="tsm-cure-subtitle">AI-Generated Cure Steps · ${esc(_state.context?.vertical||'TSM')} War Room</div>
          </div>
          <div style="display:flex;align-items:center;gap:12px">
            ${total>0?`<div id="tsm-cure-counter">${doneCount} / ${total} COMPLETE</div>`:''}
            <button id="tsm-cure-close" onclick="window.TSMCureConductor.close()">✕ EXIT</button>
          </div>
        </div>
        <div id="tsm-cure-body">
          ${_state.loading ? `
            <div id="tsm-cure-loading">
              <div class="tsm-cure-spinner"></div>
              <div>Generating cure steps from engine analysis...</div>
            </div>
          ` : _state.error ? `
            <div id="tsm-cure-error">⚠ ${esc(_state.error)}</div>
          ` : renderSteps()}
        </div>
        <div id="tsm-cure-footer">
          <div id="tsm-cure-progress">
            ${total>0 ? `${doneCount} of ${total} steps complete — return here after each step` : ''}
          </div>
          <button id="tsm-cure-open-btn" onclick="window.TSMCureConductor.openApp()">
            OPEN ${esc((_state.appMeta?.name||'APP').toUpperCase())} →
          </button>
        </div>
      </div>
    `;

    overlay.style.display = 'flex';
  }

  function renderSteps(){
    if(!_state.steps.length) return '<div id="tsm-cure-loading"><div>No steps generated.</div></div>';
    return _state.steps.map((step, i) => `
      <div class="tsm-cure-step${step.done?' done':''}" id="tsm-cure-step-${i}">
        <div class="tsm-cure-step-num"><span>${i+1}</span></div>
        <div class="tsm-cure-step-content">
          <div class="tsm-cure-step-title">${esc(step.title)}</div>
          <div class="tsm-cure-step-instruction">${esc(step.instruction)}</div>
          ${step.fieldHint ? `<div class="tsm-cure-field-hint">▶ ${esc(step.fieldHint)}</div>` : ''}
          <button class="tsm-cure-done-btn" onclick="window.TSMCureConductor.markDone(${i})">✓ MARK DONE</button>
        </div>
      </div>
    `).join('');
  }

  function esc(s){
    return String(s||'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  // ── Generate steps via Groq ────────────────────────────────────────────────
  async function generateSteps(appMeta, context){
    const groqKey = localStorage.getItem('tsm_groq_key')||'';
    if(!groqKey) throw new Error('No Groq API key found. Set it in the war room first.');

    const system = `You are a TSM platform expert generating step-by-step cure instructions for an end user.
The user has just run a ${context.vertical} war room analysis and needs to use ${appMeta.name} to resolve identified issues.
Generate exactly 5 concise, actionable steps. Each step must reference specific data from the document.
Respond ONLY with valid JSON — no markdown, no preamble:
{
  "steps": [
    {
      "title": "Short action title (4-6 words)",
      "instruction": "Detailed instruction referencing specific data from the document (1-3 sentences)",
      "fieldHint": "Exact field name or tab to click in the app (optional, omit if not applicable)"
    }
  ]
}`;

    const userMsg = `APP: ${appMeta.name}
HOW TO USE: ${appMeta.how||''}
TAGS: ${(appMeta.tags||[]).join(', ')}
VERTICAL: ${context.vertical}

DOCUMENT CONTENT:
${(context.docText||'').slice(0,1800)}

Generate 5 specific cure steps for this exact document and app.`;

    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 800,
        temperature: 0.3,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userMsg }
        ]
      })
    });

    if(!resp.ok) throw new Error(`Groq API error: ${resp.status}`);
    const data = await resp.json();
    const raw = data.choices?.[0]?.message?.content||'{}';
    const clean = raw.replace(/```json|```/g,'').trim();
    const parsed = JSON.parse(clean);
    return (parsed.steps||[]).map((s,i) => ({
      id: i,
      title: s.title||`Step ${i+1}`,
      instruction: s.instruction||'',
      fieldHint: s.fieldHint||'',
      done: false
    }));
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  window.TSMCureConductor = {

    launch: async function(href, appMeta, context){
      injectStyles();
      _state = { href, appMeta, context, steps: [], loading: true, error: null };
      render();

      try {
        _state.steps = await generateSteps(appMeta, context);
        _state.loading = false;
      } catch(err) {
        _state.loading = false;
        _state.error = err.message||'Failed to generate steps.';
      }
      render();
    },

    markDone: function(idx){
      if(_state.steps[idx]) _state.steps[idx].done = true;
      render();
    },

    openApp: function(){
      const href = _state.href;
      if(!href) return;
      if(href.startsWith('/')) window.open(href, '_blank');
      else {
        // detect vertical base path from current URL
        const parts = window.location.pathname.split('/');
        const suiteIdx = parts.findIndex(p => p.includes('-suite') || p.includes('html'));
        const base = suiteIdx >= 0 ? parts.slice(0, suiteIdx+1).join('/') : '';
        window.open(base + '/' + href, '_blank');
      }
    },

    close: function(){
      const overlay = document.getElementById('tsm-cure-overlay');
      if(overlay) overlay.style.display = 'none';
    }
  };

})();
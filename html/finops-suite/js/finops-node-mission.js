// ═══════════════════════════════════════════════════════════════
// TSM FINOPS NODE MISSION INJECTOR
// Drop into every finops-suite node before </body>
// ═══════════════════════════════════════════════════════════════

window.addEventListener('load', function () {
  if (typeof FinOpsMission === 'undefined') return;

  // Detect node from URL
  const path = window.location.pathname;
  let node = '';
  if (path.includes('financial-command')) node = 'financial-command';
  else if (path.includes('finops-main-strategist')) node = 'finops-main-strategist';
  else if (path.includes('finops-operations')) node = 'finops-operations';
  else if (path.includes('doc-analysis-tab')) node = 'doc-analysis-tab';
  else if (path.includes('financial')) node = 'financial';
  else if (path.includes('tax')) node = 'tax';
  else if (path.includes('compliance')) node = 'compliance';
  else if (path.includes('zero-trust')) node = 'zero-trust';
  else if (path.includes('study-guide')) node = 'financial-command';
  // ap-ar maps to financial-command objectives
  if (!node) return;

  // Check for active scenario in localStorage
  const activeScenario = localStorage.getItem('finops-active-scenario');
  if (!activeScenario) return;

  const data = FinOpsMission.getData();
  const scenario = data[activeScenario];
  if (!scenario) return;

  // Find objectives for this node
  const steps = Object.entries(scenario.objectives).filter(([, o]) => o.node === node);
  if (!steps.length) return;

  // Inject drawer styles
  if (!document.getElementById('fm-style')) {
    const s = document.createElement('style');
    s.id = 'fm-style';
    s.textContent = `
      #fm-drawer { position:fixed; right:0; top:50%; transform:translateY(-50%); z-index:9998; display:flex; flex-direction:row; align-items:stretch; }
      #fm-tab { background:#00e676; color:#000; writing-mode:vertical-rl; text-orientation:mixed; padding:12px 6px; font-family:monospace; font-size:10px; font-weight:700; letter-spacing:2px; cursor:pointer; border-radius:4px 0 0 4px; user-select:none; }
      #fm-panel { width:320px; max-height:85vh; overflow-y:auto; background:#071018; border:1px solid rgba(0,230,118,0.3); border-right:none; border-radius:6px 0 0 6px; padding:16px; display:none; flex-direction:column; gap:8px; scroll-behavior:smooth; padding-bottom:40px; }
      #fm-panel.open { display:flex; }
      #fm-panel input[type=text] { background:#0d1f30; border:1px solid rgba(100,150,200,0.3); border-radius:4px; color:#e8f0f8; font-family:monospace; font-size:11px; padding:6px 8px; width:100%; box-sizing:border-box; outline:none; }
      #fm-panel input[type=text]:focus { border-color:rgba(0,230,118,0.5); }
      #fm-panel input[type=text].correct { border-color:#00e676; background:rgba(0,230,118,0.08); }
      #fm-panel input[type=text].wrong { border-color:#ff3d57; background:rgba(255,61,87,0.08); }
      @keyframes fmFadeIn { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
    `;
    document.head.appendChild(s);
  }

  // Build drawer HTML
  const completedKey = 'finops-mission-' + activeScenario + '-' + node;
  const alreadyDone = localStorage.getItem(completedKey) === 'complete';

  let html = `
    <div style="font-size:9px;letter-spacing:2px;color:#00e676;margin-bottom:4px;">⚡ MISSION · ${scenario.title.toUpperCase()}</div>
    <div style="font-size:10px;color:#4a8a6a;margin-bottom:12px;line-height:1.4;">${scenario.subtitle}</div>
  `;

  steps.forEach(([idx, obj], i) => {
    const locked = i > 0 ? 'style="opacity:0.4;pointer-events:none;"' : '';
    html += `
      <div id="fms-${idx}" ${locked} style="background:#0a1a0a;border:1px solid #1a3a1a;border-radius:4px;padding:10px;margin-bottom:6px;">
        <div style="font-size:9px;color:#4a6a4a;margin-bottom:4px;">STEP ${+idx + 1} OF ${steps.length}</div>
        <div style="font-size:11px;color:#ccc;margin-bottom:8px;line-height:1.5;">${obj.instruction}</div>
        ${obj.fields.map((f, fi) => `
          <div style="margin-bottom:6px;">
            <div style="font-size:9px;color:#4a6a4a;margin-bottom:3px;">${f.label.toUpperCase()}</div>
            ${f.editable
              ? `<input type="text" id="fmf-${idx}-${fi}" value="${f.value}" placeholder="${f.hint || ''}" data-correct="${f.correct || ''}" />`
              : `<div style="font-size:11px;color:#00e676;font-family:monospace;">${f.value}</div>`
            }
          </div>`).join('')}
        <button onclick="FinOpsNodeMission.complete('${idx}')" style="margin-top:6px;background:#00e676;color:#000;border:none;padding:4px 12px;font-size:10px;font-weight:700;cursor:pointer;border-radius:2px;letter-spacing:1px;width:100%;">${obj.action.label}</button>
        <div id="fmok-${idx}" style="display:none;margin-top:6px;font-size:11px;color:#00e676;">✓ ${obj.success}</div>
        <div id="fmlrn-${idx}" style="display:none;margin-top:4px;font-size:10px;color:#4a8a6a;font-style:italic;line-height:1.5;">${obj.learn}</div>
      </div>`;
  });

  if (alreadyDone) {
    html += `<div style="margin-top:8px;padding:10px;background:#001a00;border:1px solid #00e676;border-radius:4px;text-align:center;font-size:11px;color:#00e676;font-weight:700;letter-spacing:1px;">✓ NODE COMPLETE</div>`;
  }

  // Create drawer
  const drawer = document.createElement('div');
  drawer.id = 'fm-drawer';
  drawer.style.animation = 'fmFadeIn 0.3s ease';
  drawer.innerHTML = `
    <div id="fm-tab" onclick="FinOpsNodeMission.toggle()">MISSION</div>
    <div id="fm-panel">${html}</div>
  `;
  document.body.appendChild(drawer);

  // Auto-open if this node has active steps
  if (!alreadyDone) {
    document.getElementById('fm-panel').classList.add('open');
  }

  // Expose controller
  window.FinOpsNodeMission = {
    toggle: function () {
      document.getElementById('fm-panel').classList.toggle('open');
    },
    complete: function (idx) {
      const obj = scenario.objectives[idx];
      // Validate editable fields
      let allCorrect = true;
      if (obj.fields) {
        obj.fields.forEach((f, fi) => {
          if (!f.editable) return;
          const input = document.getElementById('fmf-' + idx + '-' + fi);
          if (!input) return;
          const val = input.value.trim().toLowerCase();
          const correct = (f.correct || '').toLowerCase();
          if (val.length < 3) { input.classList.add('wrong'); allCorrect = false; }
          else { input.classList.remove('wrong'); input.classList.add('correct'); }
        });
      }
      document.getElementById('fmok-' + idx).style.display = 'block';
      document.getElementById('fmlrn-' + idx).style.display = 'block';
      document.getElementById('fms-' + idx).querySelector('button').style.display = 'none';
      const next = document.getElementById('fms-' + (+idx + 1));
      if (next) {
        next.style.opacity = '1';
        next.style.pointerEvents = 'auto';
        setTimeout(() => next.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
      } else {
        localStorage.setItem(completedKey, 'complete');
        localStorage.setItem('finops-scenario-complete-' + activeScenario, Date.now());
        localStorage.removeItem('finops-active-scenario');
        const panel = document.getElementById('fm-panel');
        const done = document.createElement('div');
        done.style.cssText = 'margin-top:8px;padding:10px;background:#001a00;border:1px solid #00e676;border-radius:4px;text-align:center;';
        done.innerHTML = `<div style="font-size:11px;color:#00e676;font-weight:700;letter-spacing:1px;">✓ NODE COMPLETE · ${node.toUpperCase()}</div><div style="font-size:10px;color:#4a8a6a;margin-top:4px;">Generating mission debrief...</div>`;
        panel.appendChild(done);
        setTimeout(() => {
          window.location.href = '/finops-suite/finops-main-strategist/index.html?mission-complete=' + activeScenario;
        }, 1200);
      }
    }
  };
});
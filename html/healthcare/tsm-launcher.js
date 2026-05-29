(function() {
  var base = '/healthcare/';
  ['mission-bridge.js', 'mission-panel.js'].forEach(function(src) {
    var s = document.createElement('script');
    s.src = base + src;
    document.head.appendChild(s);
  });
})();
window.TSM = window.TSM || {};
window.TSM.launcher = {
  run(action, args) {
    const a = args.replace(/['"]/g, '').split(',').map(s => s.trim());

    if (action === 'fillAndRun') {
      const [inpId, btnId, , query] = a;
      const inp = document.getElementById(inpId);
      const btn = document.getElementById(btnId);
      if (inp) inp.value = query;
      if (btn) btn.click();
    }

    if (action === 'switchTab') {
      const raw = el.getAttribute('data-tsm-args');
      const id = raw.trim().replace(/^['"]/, '').split(/['",]/)[0].trim();
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      const panel = document.getElementById('tab-' + id);
      if (panel) panel.classList.add('active');
      const btn = el.closest('nav') ? el : document.querySelector(`.nav-btn[data-tsm-args^="'${id}'"]`);
      if (btn) btn.classList.add('active');
    }

    if (action === 'runQ') {
      const raw = el.getAttribute('data-tsm-args');
      const parts = raw.match(/['"`]([^'"`]+)['"`]/g);
      if (!parts || parts.length < 2) return;
      const btnId = parts[1].replace(/['"]/g, '');
      const query = parts[0].replace(/['"]/g, '');
      const resId = parts[2] ? parts[2].replace(/['"]/g, '') : btnId.replace('-btn', '-res');
      if (window.runQ) runQ(query, btnId, resId);
    }

    if (action === 'runPreset') {
      const raw = el.getAttribute('data-tsm-args');
      const query = raw.replace(/^[`'"]|[`'"]$/g, '');
      const inp = document.getElementById('intel-inp');
      const btn = document.getElementById('intel-btn');
      if (inp) inp.value = query;
      if (window.switchTab) switchTab('intel', document.querySelector('.nav-btn[data-tsm-args*="intel"]'));
      if (btn) btn.click();
    }

    if (action === 'runGuide') {
      const raw = el.getAttribute('data-tsm-args');
      const query = raw.replace(/^[`'"]|[`'"]$/g, '');
      const out = document.getElementById('guide-output');
      if (out) { out.textContent = '> Running...'; }
      if (window.runQ) runQ(query, null, 'guide-output');
    }
  }
};
    
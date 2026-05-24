window.TSM = window.TSM || {};
window.TSM.launcher = {
  run(action, args) {
    const a = args.replace(/['"]/g, '').split(',').map(s => s.trim());

    if (action === 'switchTab') {
      const tab = a[0];
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      const panel = document.getElementById('tab-' + tab);
      if (panel) panel.classList.add('active');
      document.querySelectorAll('[data-tsm-action="switchTab"]').forEach(btn => {
        const t = btn.getAttribute('data-tsm-args').replace(/['"]/g,'').split(',')[0].trim();
        btn.classList.toggle('active', t === tab);
      });
    }

    if (action === 'fillAndRun') {
      const [inpId, btnId, , query] = a;
      const inp = document.getElementById(inpId);
      const btn = document.getElementById(btnId);
      if (inp) inp.value = query;
      if (btn) btn.click();
    }
  }
};
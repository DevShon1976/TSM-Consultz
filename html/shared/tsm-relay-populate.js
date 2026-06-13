// /shared/tsm-relay-populate.js
(function(){
  const raw = localStorage.getItem('tsm_finops_war_relay') || sessionStorage.getItem('TSM_FINOPS_WAR_RELAY');
  if (!raw) return;

  let relay;
  try { relay = JSON.parse(raw); } catch(e) { return; }
  if (!relay.docText && !relay.selectedDocType) return;

  const eo = relay.engineOutputs || [];
  const e1 = eo[1] || '';

  const extract = (label) => {
  const m = e1.match(new RegExp('^(?:' + label + ')\\s*:\\s*([^\\n]+)', 'im'));
  return m ? m[1].trim() : '';
};

  const banner = document.createElement('div');
  banner.style.cssText = 'position:fixed;top:32px;left:0;right:0;z-index:9000;background:rgba(0,180,100,.12);border-bottom:1px solid rgba(0,180,100,.3);padding:8px 20px;font-family:"Share Tech Mono",monospace;font-size:10px;color:#00d4aa;letter-spacing:1px;display:flex;justify-content:space-between;align-items:center;';
  banner.innerHTML = `<span>⚡ WAR ROOM RELAY ACTIVE — ${relay.selectedDocType||'Document'} · populating...</span><button onclick="this.parentElement.remove()" style="background:none;border:none;color:#00d4aa;cursor:pointer;">✕</button>`;
  document.body.prepend(banner);

  // ── PER-PAGE CONFIG ──────────────────────────────
  const path = window.location.pathname;

  const PAGE_CONFIG = {
    'finops-accounting.html': {
      docTypeMap: { 'AP Aging':'AP Invoice','GL Extract':'Journal Entry','Bank Recon':'Bank Recon','Invoice Audit':'AP Invoice','Budget Var.':'PnL','ERA Batch':'AR Invoice','Cash Flow':'PnL','Vendor Rpt':'AP Invoice','Tax / 1099':'Month-End Close' },
      fields: {
        invoiceNum: { selector: '#inv-num', extract: 'INVOICE\\s*#?|INVOICE NUMBER' },
        poNum:      { selector: '#inv-po, input[placeholder*="PO-"]', extract: 'PO\\s*#?|PURCHASE ORDER' },
        vendor:     { selector: '#inv-vendor, input[placeholder*="Vendor name"]', extract: 'VENDOR|KEY PARTIES|VENDOR NAME|PAYER|PAYEE' },
      },
      notesSelector: '#inv-notes, .textarea-field, textarea',
      fireBtnText: ['PROCESS DOCUMENT','FIRE ALL 4 ENGINES'],
    },
    'finops-operations.html': {
      docTypeMap: {}, // fill in once we know operations' tab labels
      fields: {
        vendor:     { selector: '#inv-vendor, input[placeholder*="Vendor name"]', extract: 'VENDOR|KEY PARTIES|VENDOR NAME|PAYER|PAYEE' },
      },
      notesSelector: '#op-notes, textarea',
      fireBtnText: ['PROCESS','FIRE ALL'],
    },
    'financial-ui.html': {
      docTypeMap: {},
      fields: {},
      notesSelector: 'textarea',
      fireBtnText: ['PROCESS','FIRE ALL'],
    },
  };

  const pageKey = Object.keys(PAGE_CONFIG).find(k => path.endsWith(k));
  const cfg = pageKey ? PAGE_CONFIG[pageKey] : null;
  if (!cfg) { banner.remove(); return; } // unknown page, do nothing

  // Select matching doc-type tab
  if (cfg.docTypeMap) {
    const targetLabel = cfg.docTypeMap[relay.selectedDocType] || Object.values(cfg.docTypeMap)[0];
    if (targetLabel) {
      const tabBtn = [...document.querySelectorAll('button, [role="button"], .doc-type-btn')]
        .find(b => b.textContent.trim().toUpperCase() === targetLabel.toUpperCase());
      if (tabBtn) tabBtn.click();
    }
  }

  setTimeout(() => {
    // Fill mapped fields
    Object.values(cfg.fields).forEach(f => {
      const el = document.querySelector(f.selector);
      const val = extract(f.extract);
      if (el && val) el.value = val;
    });

    // Fill notes/context textarea
    const notes = document.querySelector(cfg.notesSelector);
    if (notes) {
      notes.value = `[WAR ROOM RELAY — ${relay.selectedDocType}]\n\n${(relay.docText||'').slice(0,400)}\n\nE2:\n${(eo[2]||'').slice(0,300)}\n\nE3:\n${(eo[3]||'').slice(0,300)}`;
    }

    banner.querySelector('span').textContent = `⚡ WAR ROOM RELAY ACTIVE — ${relay.selectedDocType} · fields populated · firing in 2s...`;

    setTimeout(() => {
      const fireBtn = [...document.querySelectorAll('button')]
        .find(b => cfg.fireBtnText.some(t => b.textContent.includes(t)));
      // Auto-fire disabled — user must click manually
      // if (fireBtn && !fireBtn.disabled) fireBtn.click();
      if (banner) banner.querySelector('span').textContent = `⚡ WAR ROOM RELAY ACTIVE — ${relay.selectedDocType||'Document'} · fields populated · click PROCESS to run`;
    }, 2000);
  }, 400);
})();
// ═══════════════════════════════════════════════════════════════
// TSM GUIDED MISSION WORKFLOW ENGINE
// Drop this into healthcare/index.html before </body>
// ═══════════════════════════════════════════════════════════════

const GuidedMission = (function () {

  // ── PATIENT DATA LIBRARY ────────────────────────────────────
  // Each mission key maps to a patient scenario with fields
  // the EU must fill in or verify inside the HC node
  const PATIENT_DATA = {
    insurance: {
      patient: { name: 'Maria Santos', dob: '1978-04-12', id: 'BCBS-771-204-X', payer: 'BlueCross BlueShield', plan: 'PPO Gold' },
      claim: { cpt: '27447', desc: 'Total Knee Replacement', dos: '2025-05-18', amount: '$28,400', denial: 'CO-197', auth: 'WQ2024-8812' },
      objectives: {
        0: { // Confirm patient demographics
          node: 'billing',
          instruction: 'Verify the patient demographics below match what is on file in the billing system. Check DOB and Insurance ID for errors.',
          fields: [
            { label: 'Patient Name', value: 'Maria Santos', editable: false },
            { label: 'Date of Birth', value: '04/12/1978', editable: true, correct: '04/12/1978', hint: 'Verify DOB matches payer records' },
            { label: 'Insurance ID', value: 'BCBS-711-204-X', editable: true, correct: 'BCBS-771-204-X', hint: 'Check for transposition errors in ID' },
            { label: 'Payer', value: 'BlueCross BlueShield', editable: false },
          ],
          action: { label: 'Submit Correction', validates: true },
          success: 'Demographics corrected. DOB confirmed. Insurance ID transposition fixed (711→771). Resubmission queued.',
          learn: 'Always cross-reference the Insurance ID digit-by-digit against the payer portal. Transpositions are the #1 cause of CO-4 rejections.'
        },
        1: { // Verify insurance ID formatting
          node: 'billing',
          instruction: 'The BlueCross ID format requires a specific prefix. Reformat the ID below to match BCBS requirements.',
          fields: [
            { label: 'Raw ID from registration', value: 'BCBS771204X', editable: true, correct: 'BCBS-771-204-X', hint: 'BCBS format: PREFIX-XXX-XXX-X (add hyphens)' },
            { label: 'Group Number', value: 'GRP-44892', editable: false },
          ],
          action: { label: 'Validate Format', validates: true },
          success: 'ID reformatted to BCBS standard. Claim resubmitted with correct formatting.',
          learn: 'Each payer has a unique ID format. BCBS uses PREFIX-XXX-XXX-X. UHC uses 9-digit numeric. Aetna uses alpha-numeric with no hyphens. Always verify in the payer portal before submitting.'
        },
        2: { // Obtain prior auth
          node: 'denials',
          instruction: 'CPT 27447 (Total Knee Replacement) was denied CO-197 — auth not on file. Auth WQ2024-8812 EXISTS in the payer portal. Select the correct resolution path.',
          fields: [
            { label: 'Denial Code', value: 'CO-197', editable: false },
            { label: 'CPT Code', value: '27447 — Total Knee Replacement', editable: false },
            { label: 'Auth Reference', value: 'WQ2024-8812', editable: false },
          ],
          choices: [
            { label: 'File a formal clinical appeal', correct: false, reason: 'Incorrect. CO-197 with an existing auth is an administrative error, not a clinical denial. A formal appeal wastes time.' },
            { label: 'Submit corrected claim with auth in FL63', correct: true, reason: 'Correct. CO-197 with auth on file = administrative fix only. Add auth WQ2024-8812 to Box 23 (CMS-1500) or Loop 2300 REF*G1 (837P) and resubmit.' },
            { label: 'Write off as contractual adjustment', correct: false, reason: 'Incorrect. Never write off a CO-197 when the auth exists. This is recoverable revenue.' },
            { label: 'Request peer-to-peer with medical director', correct: false, reason: 'Incorrect. Peer-to-peer is for clinical necessity disputes. Auth already approved the procedure.' },
          ],
          success: 'Correct. Corrected claim submitted with auth WQ2024-8812 in FL63. Expected resolution: 5–7 business days.',
          learn: 'CO-197 = Prior auth not on file. If auth EXISTS, always submit a corrected claim — not an appeal. If auth was NEVER obtained, then you need retro auth or a formal appeal with clinical documentation.'
        },
        3: { // Run eligibility check
          node: 'coding',
          instruction: 'Run a 271 eligibility check for Maria Santos. Review the response fields below and identify any coverage issues.',
          fields: [
            { label: 'Coverage Status', value: 'ACTIVE', editable: false },
            { label: 'Plan Type', value: 'PPO Gold', editable: false },
            { label: 'Deductible Met', value: 'YES — $1,500 / $1,500', editable: false },
            { label: 'Copay', value: '$35 specialist', editable: false },
            { label: 'Out-of-Pocket Max', value: '$4,200 remaining', editable: false },
            { label: 'Auth Required for Surgery?', value: '', editable: true, correct: 'YES', hint: 'Check the PPO Gold plan documents for surgical auth requirements' },
          ],
          action: { label: 'Submit 271 Review', validates: true },
          success: '271 response confirmed. Coverage active. Auth required for CPT 27447 confirmed — this validates the CO-197 correction approach.',
          learn: '271 eligibility responses tell you coverage status, benefits, and auth requirements. Always run a 271 BEFORE the date of service. A 270/271 transaction takes seconds and prevents $28K denials.'
        },
        4: { // Flag intake errors
          node: 'payments',
          instruction: 'Review the registration intake log below. Flag any errors that need front desk correction.',
          fields: [
            { label: 'Registration Date', value: '2025-05-15', editable: false },
            { label: 'Insurance ID Entered', value: 'BCBS-711-204-X', editable: false },
            { label: 'DOB Entered', value: '04/12/1978', editable: false },
            { label: 'Auth Captured in System?', value: 'NO', editable: false },
            { label: 'Errors to Flag', value: '', editable: true, correct: 'Insurance ID transposition; Auth number not captured at intake', hint: 'List ALL errors found in this registration' },
          ],
          action: { label: 'Submit Error Report', validates: true },
          success: '3 intake errors flagged and sent to front desk correction queue. Process improvement note added.',
          learn: 'Intake errors caught BEFORE claim submission save days of rework. Build a pre-submission checklist: ID format check, auth capture, DOB verification, COB question. 15 minutes at intake prevents 15 hours of appeals.'
        }
      }
    },
    billing: {
      patient: { name: 'James Okafor', dob: '1962-09-03', id: 'UHC-887234109', payer: 'UnitedHealthcare', plan: 'Choice Plus' },
      claim: { cpt: '99213+36415', desc: 'Office Visit + Venipuncture', dos: '2025-05-20', amount: '$185', denial: 'CO-4', auth: 'N/A' },
      objectives: {
        0: { node: 'billing', instruction: 'Review the claim below. CO-4 (modifier conflict) was received. Identify the missing modifier.', fields: [{ label: 'CPT 1', value: '99213 — Office Visit', editable: false }, { label: 'CPT 2', value: '36415 — Venipuncture', editable: false }, { label: 'Missing Modifier on 99213', value: '', editable: true, correct: '-25', hint: 'E/M on same day as minor procedure requires which modifier?' }], action: { label: 'Apply Modifier & Resubmit', validates: true }, success: 'Modifier -25 applied to 99213. Corrected claim submitted. CO-4 resolved.', learn: 'Modifier -25 is required on an E/M code when billed same-day as a minor procedure (like venipuncture). It certifies the E/M was significant and separately identifiable from the procedure.' }
      }
    }
  };

  // ── STATE ────────────────────────────────────────────────────
  let _currentObjectiveId = null;
  let _currentMissionKey = null;
  let _overlay = null;

  // ── RENDER GUIDED PANEL ─────────────────────────────────────
  function showGuidedObjective(missionKey, objectiveId) {
    _currentMissionKey = missionKey;
    _currentObjectiveId = objectiveId;

    const mData = PATIENT_DATA[missionKey];
    if (!mData) { console.warn('[GuidedMission] No patient data for:', missionKey); return false; }

    const obj = mData.objectives[objectiveId];
    if (!obj) { console.warn('[GuidedMission] No guided objective for id:', objectiveId); return false; }

    // Build overlay
    if (_overlay) _overlay.remove();
    _overlay = document.createElement('div');
    _overlay.id = 'gm-overlay';
    _overlay.style.cssText = `
      position: fixed; inset: 0; background: rgba(0,6,15,0.85);
      z-index: 9999; display: flex; align-items: center; justify-content: center;
      font-family: 'Courier New', monospace; animation: gmFadeIn 0.2s ease;
    `;

    const panel = document.createElement('div');
    panel.style.cssText = `
      background: #071018; border: 1px solid rgba(0,200,150,0.3);
      border-radius: 8px; width: 620px; max-width: 95vw; max-height: 90vh;
      overflow-y: auto; padding: 28px 32px; position: relative;
    `;

    // Header
    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px">
        <div>
          <div style="font-size:8px;letter-spacing:3px;color:rgba(0,200,150,0.7);margin-bottom:6px">◈ GUIDED WORKFLOW — OBJECTIVE ${objectiveId + 1}</div>
          <div style="font-size:15px;color:#e8f0f8;font-weight:600">${_getPanelTitle(missionKey, objectiveId)}</div>
        </div>
        <button onclick="GuidedMission.close()" style="background:none;border:none;color:rgba(200,200,200,0.5);font-size:18px;cursor:pointer;padding:0;line-height:1">✕</button>
      </div>

      <div style="background:rgba(0,200,150,0.06);border:1px solid rgba(0,200,150,0.15);border-radius:5px;padding:14px 16px;margin-bottom:20px">
        <div style="font-size:8px;letter-spacing:2px;color:rgba(0,200,150,0.6);margin-bottom:6px">PATIENT FILE</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 20px;font-size:11px;color:#b0c4d8">
          <div><span style="color:rgba(150,180,200,0.6)">PATIENT: </span>${mData.patient.name}</div>
          <div><span style="color:rgba(150,180,200,0.6)">DOB: </span>${mData.patient.dob}</div>
          <div><span style="color:rgba(150,180,200,0.6)">PAYER: </span>${mData.patient.payer}</div>
          <div><span style="color:rgba(150,180,200,0.6)">PLAN: </span>${mData.patient.plan}</div>
          <div><span style="color:rgba(150,180,200,0.6)">CPT: </span>${mData.claim.cpt}</div>
          <div><span style="color:rgba(150,180,200,0.6)">DENIAL: </span><span style="color:#ff6b6b">${mData.claim.denial}</span></div>
        </div>
      </div>

      <div style="font-size:12px;color:#c8dce8;line-height:1.6;margin-bottom:20px;padding:0 2px">${obj.instruction}</div>

      <div id="gm-fields" style="margin-bottom:20px"></div>
      <div id="gm-choices" style="margin-bottom:20px"></div>
      <div id="gm-action" style="margin-bottom:16px"></div>
      <div id="gm-feedback" style="display:none;border-radius:5px;padding:14px 16px;margin-bottom:16px;font-size:11px;line-height:1.7"></div>
      <div id="gm-learn" style="display:none;background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.2);border-radius:5px;padding:14px 16px;margin-bottom:16px"></div>
      <div id="gm-complete" style="display:none;text-align:center;margin-top:8px">
        <button onclick="GuidedMission.complete()" style="background:rgba(0,200,150,0.15);border:1px solid rgba(0,200,150,0.4);color:#00c896;font-family:inherit;font-size:11px;letter-spacing:2px;padding:10px 28px;border-radius:4px;cursor:pointer">✓ MARK OBJECTIVE COMPLETE</button>
      </div>
    `;

    _overlay.appendChild(panel);
    document.body.appendChild(_overlay);

    // Inject CSS animation
    if (!document.getElementById('gm-style')) {
      const s = document.createElement('style');
      s.id = 'gm-style';
      s.textContent = `@keyframes gmFadeIn{from{opacity:0}to{opacity:1}} #gm-overlay input[type=text]{background:#0d1f30;border:1px solid rgba(100,150,200,0.3);border-radius:4px;color:#e8f0f8;font-family:inherit;font-size:11px;padding:7px 10px;width:100%;box-sizing:border-box;outline:none} #gm-overlay input[type=text]:focus{border-color:rgba(0,200,150,0.5)} #gm-overlay input[type=text].correct{border-color:#00c896;background:rgba(0,200,150,0.08)} #gm-overlay input[type=text].wrong{border-color:#ff6b6b;background:rgba(255,107,107,0.08)}`;
      document.head.appendChild(s);
    }

    // Render fields
    if (obj.fields) _renderFields(obj.fields, document.getElementById('gm-fields'));
    if (obj.choices) _renderChoices(obj.choices, document.getElementById('gm-choices'));
    if (obj.action) _renderAction(obj.action, document.getElementById('gm-action'));

    return true;
  }

  function _getPanelTitle(missionKey, objId) {
    const panel = window.panel;
    if (panel && panel.mission && panel.mission.objectives) {
      const o = panel.mission.objectives.find(x => x.id === objId);
      if (o) return o.label;
    }
    return 'Complete Objective';
  }

  function _renderFields(fields, container) {
    container.innerHTML = fields.map((f, i) => `
      <div style="margin-bottom:12px">
        <div style="font-size:9px;letter-spacing:1.5px;color:rgba(150,180,200,0.6);margin-bottom:5px">${f.label.toUpperCase()}</div>
        ${f.editable
          ? `<input type="text" id="gm-field-${i}" value="${f.value}" placeholder="${f.hint || ''}" data-correct="${f.correct || ''}" />`
          : `<div style="background:#0d1f30;border:1px solid rgba(60,80,100,0.3);border-radius:4px;padding:7px 10px;font-size:11px;color:#7090a8">${f.value}</div>`
        }
        ${f.hint && f.editable ? `<div style="font-size:9px;color:rgba(150,180,200,0.4);margin-top:3px">HINT: ${f.hint}</div>` : ''}
      </div>
    `).join('');
  }

  function _renderChoices(choices, container) {
    container.innerHTML = `<div style="font-size:9px;letter-spacing:1.5px;color:rgba(150,180,200,0.6);margin-bottom:10px">SELECT THE CORRECT ACTION:</div>` +
      choices.map((c, i) => `
        <div class="gm-choice" data-idx="${i}" data-correct="${c.correct}" data-reason="${c.reason.replace(/"/g, '&quot;')}"
          onclick="GuidedMission._pickChoice(this)"
          style="border:1px solid rgba(100,150,200,0.2);border-radius:5px;padding:11px 14px;margin-bottom:8px;cursor:pointer;font-size:11px;color:#c8dce8;transition:border-color 0.15s,background 0.15s">
          <span style="color:rgba(150,180,200,0.5);margin-right:8px">${String.fromCharCode(65 + i)}.</span>${c.label}
        </div>
      `).join('');
  }

  function _renderAction(action, container) {
    if (!action) return;
    container.innerHTML = `
      <button onclick="GuidedMission._validateFields()"
        style="background:rgba(0,130,255,0.12);border:1px solid rgba(0,130,255,0.3);color:#4db8ff;font-family:inherit;font-size:10px;letter-spacing:2px;padding:10px 24px;border-radius:4px;cursor:pointer;width:100%">
        ◈ ${action.label.toUpperCase()}
      </button>
    `;
  }

  // ── INTERACTION HANDLERS ─────────────────────────────────────
  function _pickChoice(el) {
    const mData = PATIENT_DATA[_currentMissionKey];
    const obj = mData.objectives[_currentObjectiveId];

    document.querySelectorAll('.gm-choice').forEach(c => {
      c.style.borderColor = 'rgba(100,150,200,0.2)';
      c.style.background = 'none';
      c.style.pointerEvents = 'none';
    });

    const isCorrect = el.dataset.correct === 'true';
    el.style.borderColor = isCorrect ? '#00c896' : '#ff6b6b';
    el.style.background = isCorrect ? 'rgba(0,200,150,0.08)' : 'rgba(255,107,107,0.08)';

    // Show correct answer if wrong
    if (!isCorrect) {
      document.querySelectorAll('.gm-choice').forEach(c => {
        if (c.dataset.correct === 'true') {
          c.style.borderColor = '#00c896';
          c.style.background = 'rgba(0,200,150,0.05)';
        }
      });
    }

    _showFeedback(isCorrect, el.dataset.reason, obj);
  }

  function _validateFields() {
    const mData = PATIENT_DATA[_currentMissionKey];
    const obj = mData.objectives[_currentObjectiveId];
    const editableFields = obj.fields.filter(f => f.editable);

    let allCorrect = true;
    editableFields.forEach((f, i) => {
      const globalIdx = obj.fields.indexOf(f);
      const input = document.getElementById('gm-field-' + globalIdx);
      if (!input) return;
      const val = input.value.trim();
      const isCorrect = f.correct && (val.toLowerCase() === f.correct.toLowerCase() || val.toLowerCase().includes(f.correct.toLowerCase().split(' ')[0]));
      input.classList.toggle('correct', !!isCorrect);
      input.classList.toggle('wrong', !isCorrect);
      if (!isCorrect) allCorrect = false;
    });

    _showFeedback(allCorrect, null, obj);
  }

  function _showFeedback(isCorrect, choiceReason, obj) {
    const fb = document.getElementById('gm-feedback');
    const learn = document.getElementById('gm-learn');
    const complete = document.getElementById('gm-complete');

    fb.style.display = 'block';
    fb.style.background = isCorrect ? 'rgba(0,200,150,0.08)' : 'rgba(255,107,107,0.08)';
    fb.style.border = `1px solid ${isCorrect ? 'rgba(0,200,150,0.3)' : 'rgba(255,107,107,0.3)'}`;
    fb.style.color = isCorrect ? '#00c896' : '#ff6b6b';
    fb.innerHTML = isCorrect
      ? `<strong>✓ CORRECT</strong> — ${obj.success}`
      : `<strong>✗ ${choiceReason || 'Not quite — check the highlighted fields above.'}</strong>`;

    if (isCorrect) {
      learn.style.display = 'block';
      learn.innerHTML = `<div style="font-size:8px;letter-spacing:2px;color:rgba(201,168,76,0.7);margin-bottom:6px">⚡ CLINICAL INTEL</div><div style="font-size:11px;color:#c8a84a;line-height:1.7">${obj.learn}</div>`;
      complete.style.display = 'block';
    }
  }

  function complete() {
    close();
    // Trigger the original panel completion
    const panelObj = window.panel;
    if (panelObj && typeof panelObj.completeObjective === 'function') {
      panelObj.completeObjective(_currentObjectiveId);
    } else if (typeof MissionBridge !== 'undefined') {
      MissionBridge.completeObjective(_currentObjectiveId, _currentMissionKey, -10);
    }
    // Update the checkbox visually
    const cb = document.querySelector(`[data-obj-id="${_currentObjectiveId}"]`);
    if (cb) { cb.checked = true; cb.dispatchEvent(new Event('change')); }
  }

  function close() {
    if (_overlay) { _overlay.remove(); _overlay = null; }
  }

  // ── INTERCEPT OBJECTIVE CLICKS ───────────────────────────────
  // Call this after MissionPanel.init() to wire up guided mode
  function init() {
    // Watch for objective checkboxes being clicked
    document.addEventListener('click', function (e) {
      const objEl = e.target.closest('[data-obj-id]');
      if (!objEl) return;

      const missionKey = (window.panel && window.panel.missionKey) || (MissionBridge && MissionBridge.get().missionKey);
      const objId = parseInt(objEl.dataset.objId);

      if (isNaN(objId) || !missionKey) return;

      const hasData = PATIENT_DATA[missionKey] && PATIENT_DATA[missionKey].objectives[objId];
      if (!hasData) return; // No guided data — let default behavior run

      e.preventDefault();
      e.stopImmediatePropagation();
      showGuidedObjective(missionKey, objId);
    }, true);

    // Also intercept the "LAUNCH X NODE" links in objectives
    document.addEventListener('click', function (e) {
      const link = e.target.closest('.obj-launch-link');
      if (!link) return;
      const missionKey = window.panel && window.panel.missionKey;
      const objId = parseInt(link.dataset.objId);
      if (isNaN(objId) || !missionKey) return;
      const hasData = PATIENT_DATA[missionKey] && PATIENT_DATA[missionKey].objectives[objId];
      if (!hasData) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      showGuidedObjective(missionKey, objId);
    }, true);

    console.log('[GuidedMission] Initialized ✓');
  }

  return { init, showGuidedObjective, close, complete, _pickChoice, _validateFields };

})();

// ── AUTO-INIT ────────────────────────────────────────────────
window.addEventListener('load', function () {
  setTimeout(() => GuidedMission.init(), 800);
});
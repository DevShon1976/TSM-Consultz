// ═══════════════════════════════════════════════════════════════════════════
// TSM MISSION ↔ HC-NODE ↔ ANALYSIS HUB BRIDGE  v2.0
// Drop into /healthcare/ as tsm-mission-bridge-v2.js
// Requires: guided-mission-workflow.js (GuidedMission), tsm-memory-engine.js
// ═══════════════════════════════════════════════════════════════════════════

const MissionNodeBridge = (function () {

  // ── CONFIG ──────────────────────────────────────────────────────────────
  const NODE_ROUTES = {
    billing:    '/healthcare/hc-billing/index.html',
    coding:     '/healthcare/hc-coding/index.html',
    denials:    '/healthcare/hc-denials/index.html',
    operations: '/healthcare/hc-operations/index.html',
    compliance: '/healthcare/hc-compliance/index.html',
    insurance:  '/healthcare/hc-insurance/index.html',
    financial:  '/healthcare/hc-financial/index.html',
    legal:      '/healthcare/hc-legal/index.html',
    medical:    '/healthcare/hc-medical/index.html',
    pharmacy:   '/healthcare/hc-pharmacy/index.html',
    grants:     '/healthcare/hc-grants/index.html',
    taxprep:    '/healthcare/hc-taxprep/index.html',
    vendors:    '/healthcare/hc-vendors/index.html',
  };

  const STORAGE_KEY  = 'tsm-mission-session';
  const REPORT_KEY   = 'tsm-analysis-report';

  // ── SESSION STATE ────────────────────────────────────────────────────────
  let _session = _loadSession();

  function _loadSession() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || _blankSession(); }
    catch { return _blankSession(); }
  }

  function _blankSession() {
    return {
      missionKey: null,
      missionLabel: null,
      objectives: {},          // { [objId]: { status, startedAt, completedAt, attempts, fields } }
      nodeVisits: [],          // [{ node, enteredAt, leftAt, objectiveId }]
      activeObjective: null,
      startedAt: null,
    };
  }

  function _save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(_session));
  }

  // ── PUBLIC: START MISSION ────────────────────────────────────────────────
  function startMission(missionKey, missionLabel, objectives) {
    _session = _blankSession();
    _session.missionKey    = missionKey;
    _session.missionLabel  = missionLabel || missionKey;
    _session.startedAt     = Date.now();
    objectives.forEach(obj => {
      _session.objectives[obj.id] = { status: 'pending', attempts: 0, fields: {} };
    });
    _save();
    _renderMissionBar();
    console.log('[MNB] Mission started:', missionKey);
  }

  // ── PUBLIC: ACTIVATE OBJECTIVE ───────────────────────────────────────────
  // Called when EU clicks an objective in the mission panel
  function activateObjective(objectiveId, targetNode) {
    _session.activeObjective = objectiveId;
    if (_session.objectives[objectiveId]) {
      _session.objectives[objectiveId].status = 'active';
      if (!_session.objectives[objectiveId].startedAt) {
        _session.objectives[objectiveId].startedAt = Date.now();
      }
    }
    _save();

    // Navigate to the HC node with query params so it knows the context
    const base = NODE_ROUTES[targetNode] || NODE_ROUTES[_session.missionKey] || '#';
    const url  = `${base}?mission=${encodeURIComponent(_session.missionKey)}&objective=${objectiveId}&returnUrl=${encodeURIComponent(location.href)}`;
    window.location.href = url;
  }

  // ── PUBLIC: COMPLETE OBJECTIVE ───────────────────────────────────────────
  // Called by GuidedMission.complete() after EU finishes a step
  function completeObjective(objectiveId, missionKey, scoreAdjust) {
    const key = missionKey || _session.missionKey;
    if (!_session.objectives[objectiveId]) {
      _session.objectives[objectiveId] = { status: 'pending', attempts: 0, fields: {} };
    }
    const obj = _session.objectives[objectiveId];
    obj.status      = 'complete';
    obj.completedAt = Date.now();
    obj.score       = scoreAdjust || 0;
    _save();
    _appendToReport(objectiveId, key, obj);
    _updateMissionBar();
    _checkMissionComplete();
  }

  // ── PUBLIC: RECORD FIELD DATA ────────────────────────────────────────────
  // Save what the EU typed/selected so it ends up in the report
  function recordFieldData(objectiveId, fieldLabel, value) {
    if (!_session.objectives[objectiveId]) return;
    _session.objectives[objectiveId].fields[fieldLabel] = value;
    _save();
  }

  // ── REPORT ASSEMBLY ──────────────────────────────────────────────────────
  function _appendToReport(objectiveId, missionKey, objState) {
    let report = {};
    try { report = JSON.parse(localStorage.getItem(REPORT_KEY)) || {}; } catch {}

    if (!report[missionKey]) report[missionKey] = { objectives: [], completedAt: null };

    const mData = (window.GuidedMission && GuidedMission.getData()) || {};
    const missionData = mData[missionKey] || {};
    const objDef = missionData.objectives && missionData.objectives[objectiveId];

    report[missionKey].objectives.push({
      id:          objectiveId,
      label:       objDef ? _extractLabel(objDef.instruction) : `Objective ${objectiveId + 1}`,
      node:        objDef ? objDef.node : 'unknown',
      completedAt: objState.completedAt,
      durationSec: objState.startedAt ? Math.round((objState.completedAt - objState.startedAt) / 1000) : null,
      attempts:    objState.attempts || 1,
      fields:      objState.fields || {},
      learn:       objDef ? objDef.learn : '',
    });

    localStorage.setItem(REPORT_KEY, JSON.stringify(report));
  }

  function _extractLabel(instruction) {
    if (!instruction) return 'Complete Objective';
    return instruction.length > 60 ? instruction.substring(0, 57) + '…' : instruction;
  }

  // ── MISSION COMPLETE CHECK ───────────────────────────────────────────────
  function _checkMissionComplete() {
    const all = Object.values(_session.objectives);
    const done = all.filter(o => o.status === 'complete').length;
    if (done === all.length && all.length > 0) {
      _session.missionCompletedAt = Date.now();
      _save();
      _showMissionCompleteModal();
    }
  }

  // ── MISSION COMPLETE MODAL ───────────────────────────────────────────────
  function _showMissionCompleteModal() {
    const existing = document.getElementById('mnb-complete-modal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'mnb-complete-modal';
    overlay.style.cssText = `
      position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:10000;
      display:flex;align-items:center;justify-content:center;
      font-family:'Courier New',monospace;
    `;

    const all   = Object.values(_session.objectives);
    const total = all.length;
    const dur   = _session.missionCompletedAt && _session.startedAt
                    ? Math.round((_session.missionCompletedAt - _session.startedAt) / 60000)
                    : '—';

    overlay.innerHTML = `
      <div style="background:#071018;border:1px solid rgba(0,200,150,0.4);border-radius:8px;padding:36px 40px;max-width:480px;width:90%;text-align:center;">
        <div style="font-size:9px;letter-spacing:3px;color:rgba(0,200,150,0.7);margin-bottom:12px">◈ MISSION COMPLETE</div>
        <div style="font-size:22px;color:#e8f0f8;font-weight:700;margin-bottom:8px">${_session.missionLabel || _session.missionKey}</div>
        <div style="font-size:12px;color:#7090a8;margin-bottom:24px">All ${total} objectives completed · ${dur} min</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:28px">
          <div style="background:rgba(0,200,150,0.07);border:1px solid rgba(0,200,150,0.2);border-radius:6px;padding:14px">
            <div style="font-size:24px;color:#00c896;font-weight:700">${total}</div>
            <div style="font-size:9px;letter-spacing:2px;color:rgba(0,200,150,0.5)">OBJECTIVES DONE</div>
          </div>
          <div style="background:rgba(0,200,150,0.07);border:1px solid rgba(0,200,150,0.2);border-radius:6px;padding:14px">
            <div style="font-size:24px;color:#00c896;font-weight:700">${dur}</div>
            <div style="font-size:9px;letter-spacing:2px;color:rgba(0,200,150,0.5)">MINUTES TOTAL</div>
          </div>
        </div>
        <button onclick="MissionNodeBridge.openAnalysisReport()" style="
          background:rgba(0,200,150,0.15);border:1px solid rgba(0,200,150,0.5);
          color:#00c896;font-family:inherit;font-size:11px;letter-spacing:2px;
          padding:12px 28px;border-radius:4px;cursor:pointer;width:100%;margin-bottom:10px;
        ">◈ VIEW ANALYSIS HUB REPORT</button>
        <button onclick="document.getElementById('mnb-complete-modal').remove()" style="
          background:none;border:1px solid rgba(100,150,200,0.2);
          color:#7090a8;font-family:inherit;font-size:10px;
          padding:8px 20px;border-radius:4px;cursor:pointer;width:100%;
        ">CLOSE</button>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  // ── ANALYSIS HUB REPORT ──────────────────────────────────────────────────
  function openAnalysisReport() {
    const existing = document.getElementById('mnb-report-modal');
    if (existing) existing.remove();

    let report = {};
    try { report = JSON.parse(localStorage.getItem(REPORT_KEY)) || {}; } catch {}

    const mKey = _session.missionKey;
    const mReport = report[mKey] || { objectives: [] };

    const overlay = document.createElement('div');
    overlay.id = 'mnb-report-modal';
    overlay.style.cssText = `
      position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:10001;
      overflow-y:auto;font-family:'Courier New',monospace;padding:24px;
    `;

    const objRows = mReport.objectives.map((o, i) => `
      <div style="border:1px solid rgba(0,200,150,0.15);border-radius:6px;padding:16px;margin-bottom:12px;background:rgba(0,200,150,0.03)">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
          <div>
            <div style="font-size:9px;letter-spacing:2px;color:rgba(0,200,150,0.6);margin-bottom:4px">OBJECTIVE ${i+1} · ${(o.node || 'node').toUpperCase()}</div>
            <div style="font-size:12px;color:#c8dce8">${o.label}</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:9px;color:rgba(0,200,150,0.5)">${o.durationSec ? Math.round(o.durationSec/60)+'m '+o.durationSec%60+'s' : '—'}</div>
            <div style="font-size:9px;color:#7090a8">${o.attempts || 1} attempt(s)</div>
          </div>
        </div>
        ${Object.keys(o.fields || {}).length ? `
          <div style="background:#0a1825;border-radius:4px;padding:10px;margin-bottom:10px">
            ${Object.entries(o.fields).map(([k,v]) => `
              <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:4px">
                <span style="color:rgba(150,180,200,0.5)">${k}</span>
                <span style="color:#b0c4d8">${v}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
        ${o.learn ? `
          <div style="border-left:2px solid rgba(201,168,76,0.4);padding-left:10px">
            <div style="font-size:9px;letter-spacing:1.5px;color:rgba(201,168,76,0.6);margin-bottom:3px">CLINICAL INTEL</div>
            <div style="font-size:10px;color:#c8a84a;line-height:1.6">${o.learn}</div>
          </div>
        ` : ''}
      </div>
    `).join('');

    const completedCount = mReport.objectives.length;
    const totalTime = mReport.objectives.reduce((a, o) => a + (o.durationSec || 0), 0);

    overlay.innerHTML = `
      <div style="max-width:700px;margin:0 auto">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">
          <div>
            <div style="font-size:9px;letter-spacing:3px;color:rgba(0,200,150,0.7);margin-bottom:6px">◈ ANALYSIS HUB REPORT</div>
            <div style="font-size:18px;color:#e8f0f8;font-weight:700">${_session.missionLabel || _session.missionKey}</div>
          </div>
          <button onclick="document.getElementById('mnb-report-modal').remove()" style="background:none;border:none;color:rgba(200,200,200,0.5);font-size:20px;cursor:pointer">✕</button>
        </div>

        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px">
          <div style="background:rgba(0,200,150,0.07);border:1px solid rgba(0,200,150,0.2);border-radius:6px;padding:14px;text-align:center">
            <div style="font-size:22px;color:#00c896;font-weight:700">${completedCount}</div>
            <div style="font-size:8px;letter-spacing:2px;color:rgba(0,200,150,0.5)">OBJECTIVES</div>
          </div>
          <div style="background:rgba(0,130,255,0.07);border:1px solid rgba(0,130,255,0.2);border-radius:6px;padding:14px;text-align:center">
            <div style="font-size:22px;color:#4db8ff;font-weight:700">${Math.round(totalTime/60)}</div>
            <div style="font-size:8px;letter-spacing:2px;color:rgba(0,130,255,0.5)">MINUTES</div>
          </div>
          <div style="background:rgba(201,168,76,0.07);border:1px solid rgba(201,168,76,0.2);border-radius:6px;padding:14px;text-align:center">
            <div style="font-size:22px;color:#c8a84a;font-weight:700">${completedCount > 0 ? Math.round((completedCount / Object.keys(_session.objectives).length) * 100) : 0}%</div>
            <div style="font-size:8px;letter-spacing:2px;color:rgba(201,168,76,0.5)">COMPLETION</div>
          </div>
        </div>

        <div style="font-size:9px;letter-spacing:2px;color:rgba(150,180,200,0.5);margin-bottom:12px">OBJECTIVE BREAKDOWN</div>
        ${objRows || '<div style="font-size:12px;color:#7090a8;padding:20px;text-align:center">No objectives completed yet.</div>'}

        <div style="display:flex;gap:10px;margin-top:20px">
          <button onclick="MissionNodeBridge.exportReport()" style="
            flex:1;background:rgba(0,130,255,0.1);border:1px solid rgba(0,130,255,0.3);
            color:#4db8ff;font-family:inherit;font-size:10px;letter-spacing:2px;
            padding:10px;border-radius:4px;cursor:pointer;
          ">⬇ EXPORT JSON</button>
          <button onclick="MissionNodeBridge.resetSession()" style="
            flex:1;background:rgba(255,107,107,0.08);border:1px solid rgba(255,107,107,0.2);
            color:#ff6b6b;font-family:inherit;font-size:10px;letter-spacing:2px;
            padding:10px;border-radius:4px;cursor:pointer;
          ">↺ RESET SESSION</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  function exportReport() {
    let report = {};
    try { report = JSON.parse(localStorage.getItem(REPORT_KEY)) || {}; } catch {}
    const blob = new Blob([JSON.stringify({ session: _session, report }, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `tsm-mission-${_session.missionKey || 'report'}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function resetSession() {
    if (confirm('Reset this mission session? All progress will be cleared.')) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(REPORT_KEY);
      _session = _blankSession();
      const modal = document.getElementById('mnb-report-modal');
      if (modal) modal.remove();
      const bar = document.getElementById('mnb-mission-bar');
      if (bar) bar.remove();
    }
  }

  // ── MISSION STATUS BAR ───────────────────────────────────────────────────
  // Persistent top bar shown on all HC nodes during an active mission
  function _renderMissionBar() {
    const existing = document.getElementById('mnb-mission-bar');
    if (existing) existing.remove();

    if (!_session.missionKey) return;

    const bar = document.createElement('div');
    bar.id = 'mnb-mission-bar';
    bar.style.cssText = `
      position:fixed;top:0;left:0;right:0;z-index:8000;
      background:rgba(0,6,15,0.95);border-bottom:1px solid rgba(0,200,150,0.3);
      display:flex;align-items:center;justify-content:space-between;
      padding:8px 20px;font-family:'Courier New',monospace;font-size:10px;
    `;
    bar.innerHTML = `
      <div style="display:flex;align-items:center;gap:14px">
        <div style="color:rgba(0,200,150,0.7);letter-spacing:2px">⚡ MISSION ACTIVE</div>
        <div style="color:#e8f0f8;font-weight:600" id="mnb-bar-label">${_session.missionLabel || _session.missionKey}</div>
        <div style="color:#7090a8" id="mnb-bar-progress">— / — objectives</div>
      </div>
      <div style="display:flex;align-items:center;gap:10px">
        <div style="background:rgba(0,200,150,0.1);border:1px solid rgba(0,200,150,0.25);border-radius:3px;padding:3px 10px;cursor:pointer;color:#00c896;letter-spacing:1px"
          onclick="MissionNodeBridge.openAnalysisReport()">◈ REPORT</div>
        <div style="background:rgba(255,107,107,0.08);border:1px solid rgba(255,107,107,0.2);border-radius:3px;padding:3px 10px;cursor:pointer;color:#ff6b6b;letter-spacing:1px"
          onclick="MissionNodeBridge.resetSession()">✕</div>
      </div>
    `;
    document.body.prepend(bar);
    _updateMissionBar();
  }

  function _updateMissionBar() {
    const progressEl = document.getElementById('mnb-bar-progress');
    if (!progressEl) return;
    const all  = Object.values(_session.objectives);
    const done = all.filter(o => o.status === 'complete').length;
    progressEl.textContent = `${done} / ${all.length} objectives`;
  }

  // ── INTERCEPT OPEN NODE BUTTONS ──────────────────────────────────────────
  // When the HC node index shows "OPEN NODE" buttons alongside mission panel,
  // we intercept them to inject mission context
  function _wireOpenNodeButtons() {
    document.querySelectorAll('[data-node-key]').forEach(btn => {
      btn.addEventListener('click', function (e) {
        const nodeKey = btn.getAttribute('data-node-key');
        const objId   = parseInt(btn.getAttribute('data-obj-id') || '0');
        if (_session.missionKey && !isNaN(objId)) {
          e.preventDefault();
          e.stopImmediatePropagation();
          activateObjective(objId, nodeKey);
        }
      }, true);
    });
  }

  // ── INLINE TASK PANEL ────────────────────────────────────────────────────
  // Render a task execution panel INSIDE the HC node when objective param present
  function renderInlineTaskPanel() {
    const params = new URLSearchParams(location.search);
    const mKey   = params.get('mission');
    const objId  = parseInt(params.get('objective'));
    const returnUrl = params.get('returnUrl');

    if (!mKey || isNaN(objId)) return;

    // Restore session context
    if (!_session.missionKey) {
      _session = _loadSession();
    }

    // Wait for GuidedMission data
    const interval = setInterval(() => {
      if (!window.GuidedMission) return;
      clearInterval(interval);

      const mData = GuidedMission.getData();
      const mission = mData && mData[mKey];
      if (!mission || !mission.objectives || !mission.objectives[objId]) {
        console.warn('[MNB] No mission data for', mKey, objId);
        return;
      }

      const obj = mission.objectives[objId];
      const totalObjs = Object.keys(mission.objectives).length;

      _injectInlinePanel(mKey, objId, totalObjs, obj, mission, returnUrl);
    }, 200);
  }

  function _injectInlinePanel(mKey, objId, totalObjs, obj, mission, returnUrl) {
    const existing = document.getElementById('mnb-inline-panel');
    if (existing) existing.remove();

    // Inject styles
    if (!document.getElementById('mnb-style')) {
      const s = document.createElement('style');
      s.id = 'mnb-style';
      s.textContent = `
        #mnb-inline-panel input[type=text]{
          background:#0d1f30;border:1px solid rgba(100,150,200,0.3);
          border-radius:4px;color:#e8f0f8;font-family:'Courier New',monospace;
          font-size:11px;padding:7px 10px;width:100%;box-sizing:border-box;outline:none;
        }
        #mnb-inline-panel input[type=text]:focus{border-color:rgba(0,200,150,0.5)}
        #mnb-inline-panel input[type=text].inp-correct{border-color:#00c896;background:rgba(0,200,150,0.08)}
        #mnb-inline-panel input[type=text].inp-wrong{border-color:#ff6b6b;background:rgba(255,107,107,0.08)}
        #mnb-inline-panel .mnb-choice{
          border:1px solid rgba(100,150,200,0.2);border-radius:5px;padding:11px 14px;
          margin-bottom:8px;cursor:pointer;font-size:11px;color:#c8dce8;
          transition:border-color 0.15s,background 0.15s;
        }
        #mnb-inline-panel .mnb-choice:hover{border-color:rgba(0,200,150,0.3);background:rgba(0,200,150,0.04)}
        @keyframes mnbSlideIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}
        #mnb-inline-panel{animation:mnbSlideIn 0.25s ease}
      `;
      document.head.appendChild(s);
    }

    const panel = document.createElement('div');
    panel.id = 'mnb-inline-panel';
    panel.style.cssText = `
      position:fixed;top:0;right:0;width:380px;height:100vh;
      background:#071018;border-left:1px solid rgba(0,200,150,0.25);
      z-index:7999;overflow-y:auto;padding:20px 24px;
      font-family:'Courier New',monospace;box-sizing:border-box;
    `;

    // Mark as active in session
    if (_session.objectives && _session.objectives[objId]) {
      if (!_session.objectives[objId].startedAt) {
        _session.objectives[objId].startedAt = Date.now();
      }
      _session.objectives[objId].status = 'active';
      _save();
    }

    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px">
        <div>
          <div style="font-size:8px;letter-spacing:3px;color:rgba(0,200,150,0.7);margin-bottom:4px">◈ MISSION TASK · ${objId+1} of ${totalObjs}</div>
          <div style="font-size:13px;color:#e8f0f8;font-weight:600">${mKey.toUpperCase()} NODE</div>
        </div>
        ${returnUrl ? `<a href="${returnUrl}" style="color:rgba(150,180,200,0.5);font-size:10px;text-decoration:none;letter-spacing:1px;margin-top:2px">← BACK</a>` : ''}
      </div>

      ${mission.patient ? `
      <div style="background:rgba(0,200,150,0.05);border:1px solid rgba(0,200,150,0.12);border-radius:4px;padding:10px 12px;margin-bottom:14px">
        <div style="font-size:8px;letter-spacing:2px;color:rgba(0,200,150,0.5);margin-bottom:5px">PATIENT FILE</div>
        <div style="font-size:10px;color:#b0c4d8;line-height:1.7">
          <span style="color:rgba(150,180,200,0.5)">PATIENT: </span>${mission.patient.name} &nbsp;
          <span style="color:rgba(150,180,200,0.5)">DOB: </span>${mission.patient.dob}<br>
          <span style="color:rgba(150,180,200,0.5)">PAYER: </span>${mission.patient.payer} &nbsp;
          <span style="color:rgba(150,180,200,0.5)">CPT: </span>${mission.claim.cpt}
          <span style="color:rgba(150,180,200,0.5);margin-left:8px">DENIAL: </span><span style="color:#ff6b6b">${mission.claim.denial}</span>
        </div>
      </div>` : ''}

      <div style="font-size:11px;color:#c8dce8;line-height:1.7;margin-bottom:16px">${obj.instruction}</div>

      <div id="mnb-fields"></div>
      <div id="mnb-choices"></div>
      <div id="mnb-action" style="margin-top:8px"></div>
      <div id="mnb-feedback" style="display:none;border-radius:5px;padding:12px 14px;margin-top:14px;font-size:11px;line-height:1.7"></div>
      <div id="mnb-learn" style="display:none;background:rgba(201,168,76,0.07);border:1px solid rgba(201,168,76,0.18);border-radius:5px;padding:12px 14px;margin-top:10px"></div>
      <div id="mnb-next-btn" style="display:none;margin-top:14px">
        <button id="mnb-complete-btn" style="
          background:rgba(0,200,150,0.15);border:1px solid rgba(0,200,150,0.4);
          color:#00c896;font-family:inherit;font-size:10px;letter-spacing:2px;
          padding:10px 20px;border-radius:4px;cursor:pointer;width:100%;
        ">✓ MARK COMPLETE${objId + 1 < totalObjs ? ' · NEXT OBJECTIVE →' : ' · FINISH MISSION'}</button>
      </div>

      ${objId + 1 < totalObjs ? `
      <div style="margin-top:20px;border-top:1px solid rgba(100,150,200,0.1);padding-top:14px">
        <div style="font-size:8px;letter-spacing:2px;color:rgba(150,180,200,0.4);margin-bottom:8px">REMAINING OBJECTIVES</div>
        ${Object.entries(mission.objectives)
          .filter(([id]) => parseInt(id) !== objId)
          .map(([id, o]) => {
            const st = _session.objectives && _session.objectives[id];
            const isDone = st && st.status === 'complete';
            return `<div style="font-size:10px;color:${isDone ? '#00c896' : 'rgba(150,180,200,0.4)'};padding:4px 0;display:flex;gap:8px;align-items:baseline">
              <span>${isDone ? '✓' : '○'}</span>
              <span>${(o.instruction||'').substring(0,55)}…</span>
            </div>`;
          }).join('')}
      </div>` : ''}
    `;

    document.body.appendChild(panel);

    // Adjust page to not overlap
    const mainContent = document.querySelector('main, .hc-main, #hc-content, .container, body > div:first-child');
    if (mainContent) mainContent.style.marginRight = '390px';

    // Render interactive elements
    _renderInlineFields(obj, mKey, objId);
    _renderInlineChoices(obj, mKey, objId);
    _renderInlineAction(obj, mKey, objId, returnUrl, totalObjs);
  }

  function _renderInlineFields(obj, mKey, objId) {
    const container = document.getElementById('mnb-fields');
    if (!container || !obj.fields) return;
    container.innerHTML = obj.fields.map((f, i) => `
      <div style="margin-bottom:11px">
        <div style="font-size:8px;letter-spacing:1.5px;color:rgba(150,180,200,0.55);margin-bottom:4px">${f.label.toUpperCase()}</div>
        ${f.editable
          ? `<input type="text" id="mnb-f-${i}" value="${f.value}" placeholder="${f.hint || ''}" data-correct="${f.correct||''}" oninput="MissionNodeBridge._onFieldInput(${objId},'${f.label}',this.value)" />`
          : `<div style="background:#0d1f30;border:1px solid rgba(60,80,100,0.25);border-radius:4px;padding:7px 10px;font-size:10px;color:#7090a8">${f.value}</div>`
        }
        ${f.hint && f.editable ? `<div style="font-size:8px;color:rgba(150,180,200,0.35);margin-top:2px">HINT: ${f.hint}</div>` : ''}
      </div>
    `).join('');
  }

  function _renderInlineChoices(obj, mKey, objId) {
    const container = document.getElementById('mnb-choices');
    if (!container || !obj.choices) return;
    container.innerHTML = `<div style="font-size:8px;letter-spacing:1.5px;color:rgba(150,180,200,0.55);margin-bottom:9px">SELECT THE CORRECT ACTION:</div>` +
      obj.choices.map((c, i) => `
        <div class="mnb-choice" data-idx="${i}" data-correct="${c.correct}" data-reason="${(c.reason||'').replace(/"/g,'&quot;')}"
          onclick="MissionNodeBridge._pickInlineChoice(this,'${mKey}',${objId})">
          <span style="color:rgba(150,180,200,0.5);margin-right:8px">${String.fromCharCode(65+i)}.</span>${c.label}
        </div>
      `).join('');
  }

  function _renderInlineAction(obj, mKey, objId, returnUrl, totalObjs) {
    const container = document.getElementById('mnb-action');
    if (!container) return;

    if (obj.action) {
      container.innerHTML = `
        <button onclick="MissionNodeBridge._validateInlineFields('${mKey}',${objId})" style="
          background:rgba(0,130,255,0.1);border:1px solid rgba(0,130,255,0.28);
          color:#4db8ff;font-family:inherit;font-size:9px;letter-spacing:2px;
          padding:10px 18px;border-radius:4px;cursor:pointer;width:100%;
        ">◈ ${obj.action.label.toUpperCase()}</button>
      `;
    }

    // Wire complete button
    setTimeout(() => {
      const btn = document.getElementById('mnb-complete-btn');
      if (!btn) return;
      btn.onclick = () => {
        _completeAndAdvance(mKey, objId, totalObjs, returnUrl);
      };
    }, 100);
  }

  // ── INLINE INTERACTION ───────────────────────────────────────────────────

  function _onFieldInput(objId, label, value) {
    recordFieldData(objId, label, value);
  }

  function _pickInlineChoice(el, mKey, objId) {
    const mData = GuidedMission.getData();
    const obj   = mData[mKey] && mData[mKey].objectives && mData[mKey].objectives[objId];
    if (!obj) return;

    document.querySelectorAll('#mnb-inline-panel .mnb-choice').forEach(c => {
      c.style.borderColor = 'rgba(100,150,200,0.2)';
      c.style.background  = 'none';
      c.style.pointerEvents = 'none';
    });

    const isCorrect = el.dataset.correct === 'true';
    el.style.borderColor = isCorrect ? '#00c896' : '#ff6b6b';
    el.style.background  = isCorrect ? 'rgba(0,200,150,0.07)' : 'rgba(255,107,107,0.07)';

    if (!isCorrect) {
      document.querySelectorAll('#mnb-inline-panel .mnb-choice').forEach(c => {
        if (c.dataset.correct === 'true') {
          c.style.borderColor = '#00c896';
          c.style.background  = 'rgba(0,200,150,0.04)';
        }
      });
      if (_session.objectives && _session.objectives[objId]) {
        _session.objectives[objId].attempts = (_session.objectives[objId].attempts || 0) + 1;
        _save();
      }
    }

    recordFieldData(objId, 'Selected Choice', el.querySelector('span:last-child') ? el.textContent.trim() : el.textContent);
    _showInlineFeedback(isCorrect, el.dataset.reason, obj);
  }

  function _validateInlineFields(mKey, objId) {
    const mData = GuidedMission.getData();
    const obj   = mData[mKey] && mData[mKey].objectives && mData[mKey].objectives[objId];
    if (!obj || !obj.fields) return;

    const editables = obj.fields.filter(f => f.editable);
    let allCorrect  = true;

    obj.fields.forEach((f, i) => {
      if (!f.editable) return;
      const inp = document.getElementById(`mnb-f-${i}`);
      if (!inp) return;
      const val     = inp.value.trim();
      const correct = f.correct || '';
      const isOk    = val.toLowerCase() === correct.toLowerCase() ||
                      (correct && val.toLowerCase().includes(correct.toLowerCase().split(' ')[0]));
      inp.classList.toggle('inp-correct', isOk);
      inp.classList.toggle('inp-wrong', !isOk);
      if (!isOk) allCorrect = false;
      recordFieldData(objId, f.label, val);
    });

    if (!allCorrect && _session.objectives && _session.objectives[objId]) {
      _session.objectives[objId].attempts = (_session.objectives[objId].attempts || 0) + 1;
      _save();
    }

    _showInlineFeedback(allCorrect, null, obj);
  }

  function _showInlineFeedback(isCorrect, choiceReason, obj) {
    const fb    = document.getElementById('mnb-feedback');
    const learn = document.getElementById('mnb-learn');
    const next  = document.getElementById('mnb-next-btn');
    if (!fb) return;

    fb.style.display    = 'block';
    fb.style.background = isCorrect ? 'rgba(0,200,150,0.07)' : 'rgba(255,107,107,0.07)';
    fb.style.border     = `1px solid ${isCorrect ? 'rgba(0,200,150,0.25)' : 'rgba(255,107,107,0.25)'}`;
    fb.style.color      = isCorrect ? '#00c896' : '#ff6b6b';
    fb.innerHTML = isCorrect
      ? `<strong>✓ CORRECT</strong> — ${obj.success}`
      : `<strong>✗ ${choiceReason || 'Not quite — review the highlighted fields above.'}</strong>`;

    if (isCorrect) {
      if (learn) {
        learn.style.display = 'block';
        learn.innerHTML = `
          <div style="font-size:8px;letter-spacing:2px;color:rgba(201,168,76,0.65);margin-bottom:5px">⚡ CLINICAL INTEL</div>
          <div style="font-size:10px;color:#c8a84a;line-height:1.6">${obj.learn}</div>
        `;
      }
      if (next) next.style.display = 'block';
    }
  }

  // ── ADVANCE TO NEXT OBJECTIVE ────────────────────────────────────────────
  function _completeAndAdvance(mKey, objId, totalObjs, returnUrl) {
    completeObjective(objId, mKey);

    const nextId = objId + 1;
    if (nextId < totalObjs) {
      // Navigate to next objective within same or different node
      const mData    = GuidedMission.getData();
      const mission  = mData && mData[mKey];
      const nextObj  = mission && mission.objectives && mission.objectives[nextId];
      const nextNode = nextObj ? nextObj.node : mKey;
      activateObjective(nextId, nextNode);
    } else {
      // All done — go back to mission hub and show complete modal
      _session.missionCompletedAt = Date.now();
      _save();
      if (returnUrl) {
        window.location.href = returnUrl + '?missionDone=' + encodeURIComponent(mKey);
      } else {
        _showMissionCompleteModal();
      }
    }
  }

  // ── AUTO-DETECT MISSION DONE ON RETURN ──────────────────────────────────
  function _checkReturnState() {
    const params    = new URLSearchParams(location.search);
    const doneKey   = params.get('missionDone');
    if (doneKey) {
      setTimeout(() => _showMissionCompleteModal(), 600);
    }
  }

  // ── NODE VISIT TRACKING ──────────────────────────────────────────────────
  function _trackNodeEntry() {
    const params  = new URLSearchParams(location.search);
    const mKey    = params.get('mission');
    const objId   = parseInt(params.get('objective'));
    const nodeKey = location.pathname.split('/').filter(Boolean).pop()
                      .replace('hc-', '').replace('/index.html', '');
    if (!mKey) return;
    _session.nodeVisits = _session.nodeVisits || [];
    _session.nodeVisits.push({ node: nodeKey, enteredAt: Date.now(), objectiveId: objId });
    _save();
  }

  // ── INIT ─────────────────────────────────────────────────────────────────
  function init() {
    _renderMissionBar();
    _checkReturnState();
    _trackNodeEntry();
    renderInlineTaskPanel();

    // Wire OPEN NODE buttons after a short delay for DOM readiness
    setTimeout(_wireOpenNodeButtons, 500);

    // Override GuidedMission.complete if present
    if (window.GuidedMission) {
      const _orig = GuidedMission.complete.bind(GuidedMission);
      GuidedMission.complete = function () {
        _orig();
        const params = new URLSearchParams(location.search);
        const mKey   = params.get('mission') || _session.missionKey;
        const objId  = parseInt(params.get('objective') || '0');
        if (mKey && !isNaN(objId)) completeObjective(objId, mKey);
      };
    }

    console.log('[MissionNodeBridge] v2.0 initialized ✓');
  }

  return {
    init,
    startMission,
    activateObjective,
    completeObjective,
    recordFieldData,
    openAnalysisReport,
    exportReport,
    resetSession,
    renderInlineTaskPanel,
    getSession: () => _session,
    _pickInlineChoice,
    _validateInlineFields,
    _onFieldInput,
  };

})();

window.addEventListener('load', () => setTimeout(() => MissionNodeBridge.init(), 600));
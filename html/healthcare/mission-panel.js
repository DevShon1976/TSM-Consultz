/**
 * TSM Mission Control Panel
 * Drop-in replacement for the static HC checklist right panel.
 * Usage: MissionPanel.init(containerId, missionKey)
 */

const MISSIONS = {
  billing: {
    title: "Prevent denial before payer adjudication",
    domain: "BILLING / CLAIMS",
    objectives: [
      {
        id: 0,
        label: "Review claim for all required fields",
        node: "billing-queue",
        domain: "billing",
        riskDelta: -8,
        strat: "Missing modifier on line 3 detected. Claim flagged for correction before submission.",
        workflow: 0,
        action: () => openNode("billing-queue", { view: "claims", filter: "incomplete" })
      },
      {
        id: 1,
        label: "Verify NPI matches payer credentialing file",
        node: "credentialing",
        domain: "billing",
        riskDelta: -12,
        strat: "NPI mismatch resolved. Provider now active in payer network. Denial risk reduced.",
        workflow: 0,
        action: () => openNode("credentialing", { view: "npi-check" })
      },
      {
        id: 2,
        label: "Check timely filing window for each payer",
        node: "denial-lab",
        domain: "denials",
        riskDelta: -15,
        strat: "Timely filing window: 90 days. 14 days remaining. Escalate to AR immediately.",
        workflow: 1,
        action: () => openNode("denial-lab", { filter: "timely-filing" })
      },
      {
        id: 3,
        label: "Submit via clearinghouse and monitor 277CA",
        node: "coding-review",
        domain: "coding",
        riskDelta: -20,
        strat: "277CA accepted. Claim in payer queue. Expected adjudication: 21 days.",
        workflow: 2,
        action: () => openNode("coding-review", { tab: "submission" })
      },
      {
        id: 4,
        label: "Post ERA payments and reconcile against fee schedule",
        node: "ar-followup",
        domain: "payments",
        riskDelta: -17,
        strat: "ERA posted. Variance of $42.10 identified. Secondary payer coordination initiated.",
        workflow: 3,
        action: () => openNode("ar-followup", { view: "era-post" })
      }
    ]
  },

  denials: {
    title: "Resolve active denial before appeal deadline",
    domain: "DENIALS / AR",
    objectives: [
      {
        id: 0,
        label: "Identify denial reason code (CO/PR/OA)",
        node: "denial-lab",
        domain: "denials",
        riskDelta: -10,
        strat: "CO-197: Timely filing exceeded. Exception documentation required within 5 days.",
        workflow: 0,
        action: () => openNode("denial-lab", { filter: "reason-codes" })
      },
      {
        id: 1,
        label: "Pull clinical documentation for medical necessity",
        node: "medical-node",
        domain: "medical",
        riskDelta: -14,
        strat: "Clinical docs attached. Medical necessity criteria partially met — query physician.",
        workflow: 0,
        action: () => openNode("medical-node", { view: "documentation" })
      },
      {
        id: 2,
        label: "Draft appeal letter with supporting evidence",
        node: "denial-lab",
        domain: "denials",
        riskDelta: -18,
        strat: "Appeal drafted. External review option available if internal appeal fails.",
        workflow: 1,
        action: () => openNode("denial-lab", { tab: "appeals" })
      },
      {
        id: 3,
        label: "Submit appeal and log in AR tracker",
        node: "ar-followup",
        domain: "ar",
        riskDelta: -22,
        strat: "Appeal submitted. Payer response window: 30 days. Follow-up queued at day 20.",
        workflow: 2,
        action: () => openNode("ar-followup", { view: "appeals-tracker" })
      }
    ]
  },

  coding: {
    title: "Ensure clean claim submission on first pass",
    domain: "CODING / CLAIMS",
    objectives: [
      {
        id: 0,
        label: "Validate CPT and ICD-10 code pairing",
        node: "coding-review",
        domain: "coding",
        riskDelta: -12,
        strat: "CPT 99213 with Z23 — valid pairing. Check modifier 25 requirement.",
        workflow: 0,
        action: () => openNode("coding-review", { view: "code-validation" })
      },
      {
        id: 1,
        label: "Check modifier requirements by payer",
        node: "coding-review",
        domain: "coding",
        riskDelta: -15,
        strat: "Modifier 25 required for this payer. Added to claim line 1.",
        workflow: 0,
        action: () => openNode("coding-review", { tab: "modifiers" })
      },
      {
        id: 2,
        label: "Confirm authorization aligns with coded services",
        node: "billing-queue",
        domain: "billing",
        riskDelta: -20,
        strat: "Auth on file covers 3 visits. Coded visit 4 — obtain retro auth immediately.",
        workflow: 1,
        action: () => openNode("billing-queue", { filter: "auth-check" })
      },
      {
        id: 3,
        label: "Release claim to billing queue",
        node: "billing-queue",
        domain: "billing",
        riskDelta: -25,
        strat: "Claim released. Clean claim probability: 94%. Estimated payment: $312.00.",
        workflow: 2,
        action: () => openNode("billing-queue", { action: "release" })
      }
    ]
  }
};

const DOMAIN_COLORS = {
  billing: "#00b8d9",
  denials: "#e84040",
  coding: "#f5a623",
  payments: "#00c896",
  medical: "#a78bfa",
  ar: "#f472b6"
};

const WORKFLOW_STAGES = ["CODING", "SUBMIT", "ADJUD.", "ERA"];

// Override this to wire into your actual HC node routing
function openNode(nodeId, params = {}) {
  console.log(`[MissionPanel] Opening node: ${nodeId}`, params);

  // Default: try to navigate to the node tab if the tab exists in the DOM
  const tabEl = document.querySelector(`[data-node="${nodeId}"]`) ||
                document.querySelector(`[data-tab="${nodeId}"]`) ||
                document.querySelector(`#${nodeId}`);

  if (tabEl) {
    tabEl.click();
  } else {
    // Emit a custom event so your app can handle routing
    document.dispatchEvent(new CustomEvent("tsm:openNode", {
      detail: { nodeId, params }
    }));
  }
}

class MissionPanel {
  constructor(containerId, missionKey = "billing") {
    this.container = document.getElementById(containerId);
    this.mission = MISSIONS[missionKey] || MISSIONS.billing;
    this.completed = [];
    this.currentRisk = 72;
    this.render();
  }

  static init(containerId, missionKey = "billing") {
    return new MissionPanel(containerId, missionKey);
  }

  setMission(missionKey) {
    this.mission = MISSIONS[missionKey] || MISSIONS.billing;
    this.completed = [];
    this.currentRisk = 72;
    this.render();
  }

  executeObjective(obj) {
    if (this.completed.includes(obj.id)) return;
    this.completed.push(obj.id);
    this.currentRisk = Math.max(4, this.currentRisk + obj.riskDelta);

    // Run the node action
    if (typeof obj.action === "function") obj.action();

    this.updateMetrics();
    this.showStrategist(obj.strat);
    this.activateWorkflow(obj.workflow);
    this.renderObjectives();

    if (this.completed.length === this.mission.objectives.length) {
      this.onComplete();
    }
  }

  updateMetrics() {
    const pct = Math.round((this.completed.length / this.mission.objectives.length) * 100);
    const riskEl = this.container.querySelector(".mp-risk-bar");
    const riskScore = this.container.querySelector(".mp-risk-score");
    const progEl = this.container.querySelector(".mp-prog-bar");
    const progScore = this.container.querySelector(".mp-prog-score");

    if (riskEl) riskEl.style.width = this.currentRisk + "%";
    if (riskEl) riskEl.style.background = this.currentRisk > 50 ? "#e84040" : this.currentRisk > 25 ? "#f5a623" : "#00c896";
    if (riskScore) {
      riskScore.textContent = this.currentRisk;
      riskScore.style.color = this.currentRisk > 50 ? "#e84040" : this.currentRisk > 25 ? "#f5a623" : "#00c896";
    }
    if (progEl) progEl.style.width = pct + "%";
    if (progScore) progScore.textContent = pct + "%";
  }

  showStrategist(text) {
    const box = this.container.querySelector(".mp-strat-box");
    const textEl = this.container.querySelector(".mp-strat-text");
    if (!box || !textEl) return;
    box.style.display = "block";
    textEl.textContent = "";
    let i = 0;
    const interval = setInterval(() => {
      textEl.textContent += text[i];
      i++;
      if (i >= text.length) clearInterval(interval);
    }, 16);
  }

  activateWorkflow(upTo) {
    const steps = this.container.querySelectorAll(".mp-wf-step");
    steps.forEach((el, i) => {
      if (i <= upTo) {
        el.style.color = "#00c896";
        el.style.borderColor = "#1a3d2a";
        el.style.background = "#0a1510";
      }
    });
  }

  onComplete() {
    const status = this.container.querySelector(".mp-status");
    if (status) {
      status.textContent = "● COMPLETE";
      status.style.color = "#00c896";
    }
    document.dispatchEvent(new CustomEvent("tsm:missionComplete", {
      detail: { mission: this.mission, completedAt: Date.now() }
    }));
  }

  renderObjectives() {
    const list = this.container.querySelector(".mp-obj-list");
    if (!list) return;
    list.innerHTML = "";
    this.mission.objectives.forEach(obj => {
      const done = this.completed.includes(obj.id);
      const color = DOMAIN_COLORS[obj.domain] || "#555";
      const el = document.createElement("div");
      el.className = "mp-objective" + (done ? " done" : "");
      el.style.cssText = `display:flex;align-items:flex-start;gap:8px;padding:8px 10px;background:${done ? "#0f1a14" : "#111"};border:1px solid ${done ? "#1a3d2a" : "#1e1e1e"};border-radius:5px;cursor:${done ? "default" : "pointer"};transition:border-color 0.15s;margin-bottom:5px;`;
      el.innerHTML = `
        <div style="width:16px;height:16px;border:1px solid ${done ? "#00c896" : "#333"};border-radius:3px;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;background:${done ? "#00c896" : "transparent"};">
          ${done ? '<span style="font-size:10px;color:#000;font-weight:700;line-height:1;">✓</span>' : ""}
        </div>
        <div style="flex:1;">
          <div style="font-size:10px;line-height:1.5;color:${done ? "#444" : "#c0c0c0"};text-decoration:${done ? "line-through" : "none"};">${obj.label}</div>
          <div style="margin-top:3px;display:flex;gap:6px;align-items:center;">
            <span style="font-size:8px;color:${color};letter-spacing:1px;text-transform:uppercase;">${obj.domain}</span>
            ${!done ? `<span style="font-size:8px;color:#333;letter-spacing:1px;">→ LAUNCH ${obj.node.toUpperCase()}</span>` : ""}
          </div>
        </div>`;
      if (!done) {
        el.addEventListener("mouseenter", () => el.style.borderColor = "#333");
        el.addEventListener("mouseleave", () => el.style.borderColor = "#1e1e1e");
        el.addEventListener("click", () => this.executeObjective(obj));
      }
      list.appendChild(el);
    });
  }

  render() {
    const pct = Math.round((this.completed.length / this.mission.objectives.length) * 100);
    this.container.innerHTML = `
      <div style="background:#0d0d0d;border-right:1px solid #1e1e1e;height:100%;overflow-y:auto;font-family:'JetBrains Mono','Courier New',monospace;">
        <div style="background:#111;border-bottom:1px solid #1e1e1e;padding:8px 14px;display:flex;align-items:center;justify-content:space-between;">
          <div style="font-size:9px;letter-spacing:2px;color:#555;">MISSION CONTROL</div>
          <div class="mp-status" style="font-size:9px;letter-spacing:1px;color:#e84040;">● ACTIVE</div>
        </div>

        <div style="padding:14px;border-bottom:1px solid #1e1e1e;">
          <div style="font-size:8px;color:#555;letter-spacing:2px;margin-bottom:5px;">CURRENT MISSION</div>
          <div style="font-size:12px;font-weight:600;color:#e0e0e0;line-height:1.5;">${this.mission.title}</div>
          <div style="margin-top:10px;">
            <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;">
              <div style="font-size:8px;color:#555;width:72px;">RISK EXPOSURE</div>
              <div style="flex:1;height:3px;background:#1e1e1e;border-radius:2px;overflow:hidden;">
                <div class="mp-risk-bar" style="height:100%;width:${this.currentRisk}%;background:#e84040;border-radius:2px;transition:width 0.5s ease;"></div>
              </div>
              <div class="mp-risk-score" style="font-size:10px;color:#e84040;min-width:24px;text-align:right;">${this.currentRisk}</div>
            </div>
            <div style="display:flex;gap:8px;align-items:center;">
              <div style="font-size:8px;color:#555;width:72px;">COMPLETION</div>
              <div style="flex:1;height:3px;background:#1e1e1e;border-radius:2px;overflow:hidden;">
                <div class="mp-prog-bar" style="height:100%;width:${pct}%;background:#00c896;border-radius:2px;transition:width 0.5s ease;"></div>
              </div>
              <div class="mp-prog-score" style="font-size:10px;color:#00c896;min-width:24px;text-align:right;">${pct}%</div>
            </div>
          </div>
        </div>

        <div style="padding:12px 14px;border-bottom:1px solid #1e1e1e;">
          <div style="font-size:8px;color:#555;letter-spacing:2px;margin-bottom:10px;">OBJECTIVES · ${this.mission.domain}</div>
          <div class="mp-obj-list"></div>
        </div>

        <div class="mp-strat-box" style="padding:12px 14px;border-bottom:1px solid #1e1e1e;display:none;">
          <div style="font-size:8px;color:#555;letter-spacing:2px;margin-bottom:7px;">HC STRATEGIST</div>
          <div style="background:#0a1510;border:1px solid #1a3d2a;border-radius:5px;padding:10px 12px;">
            <div class="mp-strat-text" style="font-size:10px;color:#00c896;line-height:1.7;"></div>
          </div>
        </div>

        <div style="padding:10px 14px;">
          <div style="font-size:8px;color:#555;letter-spacing:2px;margin-bottom:7px;">WORKFLOW STATE</div>
          <div style="display:flex;gap:0;">
            ${WORKFLOW_STAGES.map((s, i) => `<div class="mp-wf-step" style="flex:1;text-align:center;font-size:8px;padding:6px 2px;border:1px solid #1e1e1e;${i > 0 ? "border-left:none;" : "border-radius:4px 0 0 4px;"}${i === WORKFLOW_STAGES.length - 1 ? "border-radius:0 4px 4px 0;" : ""}color:#333;letter-spacing:1px;transition:all 0.3s;">${s}</div>`).join("")}
          </div>
        </div>
      </div>`;

    this.renderObjectives();
  }
}

// Expose globally
window.MissionPanel = MissionPanel;
window.TSM_MISSIONS = MISSIONS;
/* ============================================================
   TSM PHASE LOADER
   runtime/kernel/phase-loader.js
   Reads architecture/kernel/phases.json and turns each phase
   into an addressable, clickable runtime unit. Pure navigation
   kernel -- no business logic lives here.
   ============================================================ */

class PhaseLoader {

  constructor(configPath = '/architecture/kernel/phases.json') {
    this.configPath = configPath;
    this.phases = [];
  }

  async load() {
    const res = await fetch(this.configPath);
    if (!res.ok) {
      console.error('PhaseLoader: failed to load', this.configPath, res.status);
      this.phases = [];
      return this.phases;
    }
    const data = await res.json();
    this.phases = data.phases || [];
    return this.phases;
  }

  renderNav(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('PhaseLoader: container not found:', containerId);
      return;
    }

    container.innerHTML = '';

    this.phases.forEach(phase => {
      const item = document.createElement('div');
      item.className = 'phase-nav-item';
      item.style.padding = '10px';
      item.style.margin = '6px';
      item.style.borderRadius = '6px';
      item.style.cursor = phase.status === 'planned' ? 'not-allowed' : 'pointer';
      item.style.opacity = phase.status === 'planned' ? '0.5' : '1';
      item.style.background = phase.status === 'active' ? '#1d4ed8' : '#374151';

      item.innerHTML = `
        <strong>${phase.name}</strong><br/>
        <small>Status: ${phase.status}${phase.progress != null ? ' | Progress: ' + phase.progress + '%' : ''}</small>
      `;

      item.onclick = () => this.openPhase(phase);
      container.appendChild(item);
    });
  }

  /** Resolves a phase's entry point and navigates to it.
   *  Priority: explicit entryPoint -> first module containing
   *  "war-room" -> first module in the list. */
  openPhase(phase) {
    if (phase.status === 'planned' && !phase.entryPoint) {
      alert(`${phase.name} is planned but not yet built.`);
      return;
    }

    const url =
      phase.entryPoint ||
      (phase.modules && phase.modules.find(m => m.includes('war-room'))) ||
      (phase.modules && phase.modules[0]) ||
      null;

    if (!url) {
      alert('Phase has no entry point defined yet: ' + phase.name);
      return;
    }

    const normalized = url.startsWith('/') ? url : '/' + url;
    console.log('PhaseLoader: launching', phase.id, '->', normalized);

    if (window.TSMEventBus && window.TSMEventBus.emit) {
      window.TSMEventBus.emit('PHASE_OPENED', { phaseId: phase.id, url: normalized, ts: Date.now() });
    }

    window.location.href = normalized;
  }

  getActivePhases() {
    return this.phases.filter(p => p.status === 'active');
  }

  getPlannedPhases() {
    return this.phases.filter(p => p.status !== 'active');
  }
}

if (typeof window !== 'undefined') {
  window.PhaseLoader = PhaseLoader;
}
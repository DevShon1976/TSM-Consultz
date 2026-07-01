class TSMCRMEngine {
  constructor(model) { this.model = model || {}; this.leads = []; this._key = 'TSM_CRM_STATE'; }
  loadFromStorage() {
    try { const s = JSON.parse(localStorage.getItem(this._key) || 'null'); if (s) { this.leads = s.leads || []; return this.leads.length > 0; } } catch(e) {}
    return false;
  }
  saveToStorage() { try { localStorage.setItem(this._key, JSON.stringify({ leads: this.leads, savedAt: Date.now() })); } catch(e) {} }
  clearStorage() { try { localStorage.removeItem(this._key); } catch(e) {} this.leads = []; }
  loadSampleData() { this.leads = (this.model.sample_data?.leads || []).map(l => ({...l})); }
  computeKpis() {
    const active = this.leads.filter(l => !['Won','Lost'].includes(l.stage));
    const won = this.leads.filter(l => l.stage === 'Won').length;
    const closed = this.leads.filter(l => ['Won','Lost'].includes(l.stage)).length;
    const breaches = this.getSlaBreaches();
    const churn = this.leads.filter(l => l.churn_risk).length;
    const healths = this.leads.filter(l => l.health != null).map(l => l.health);
    return {
      open_leads: active.length,
      pipeline_value: active.reduce((s,l) => s + (l.value||0), 0),
      sla_breach_count: breaches.length,
      churn_risk_count: churn,
      win_rate: closed ? Math.round(won/closed*100) : 0,
      health_avg: healths.length ? Math.round(healths.reduce((a,b)=>a+b,0)/healths.length) : 0
    };
  }
  getSlaBreaches() {
    const sla = this.model.sla_hours || {};
    const now = Date.now();
    return this.leads.filter(l => !['Won','Lost'].includes(l.stage) && l.stage_entered_at).map(l => {
      const hours = (now - new Date(l.stage_entered_at).getTime()) / 3600000;
      return { id: l.id, name: l.name, stage: l.stage, hours_over: Math.round(hours - (sla[l.stage]||48)) };
    }).filter(b => b.hours_over > 0);
  }
  async runAnalysis() {
    const res = await fetch('/api/crm/query', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leads: this.leads, kpis: this.computeKpis(), lead_breaches: this.getSlaBreaches(), maxTokens: 1200 })
    });
    if (!res.ok) throw new Error(`/api/crm/query ${res.status}`);
    return res.json();
  }
  buildRelayPayload(aiText) {
    return { vertical: 'crm', leads: this.leads, kpis: this.computeKpis(), sla_breaches: this.getSlaBreaches(), ai_analysis: aiText, timestamp: new Date().toISOString() };
  }
}

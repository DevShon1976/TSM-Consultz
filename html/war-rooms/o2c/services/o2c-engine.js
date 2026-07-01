/* TSM O2C Engine v1.0
   Order-to-Cash lifecycle: Inquiry → Credit → Confirmed → ATP →
   Warehouse → Shipped → Delivered → Invoiced → Collected → Closed.
   Reads CPQ relay payload to import Won quotes as new orders. */

class TSMO2CEngine {
  constructor(model) {
    this.model  = model || {};
    this.orders = [];
    this._storageKey = 'TSM_O2C_STATE';
  }

  /* ── Persistence ────────────────────────────────────────────────────────── */
  loadFromStorage() {
    try {
      const raw = localStorage.getItem(this._storageKey);
      if (!raw) return false;
      const s = JSON.parse(raw);
      this.orders = s.orders || [];
      return this.orders.length > 0;
    } catch(e) { return false; }
  }

  saveToStorage() {
    try {
      localStorage.setItem(this._storageKey,
        JSON.stringify({ orders: this.orders, savedAt: Date.now() }));
    } catch(e) {}
  }

  clearStorage() {
    try { localStorage.removeItem(this._storageKey); } catch(e) {}
    this.orders = [];
  }

  loadSampleData() {
    this.orders = (this.model.sample_data?.orders || []).map(o => ({ ...o }));
  }

  /* ── CPQ Relay Import ───────────────────────────────────────────────────── */
  checkCPQRelay() {
    try {
      const raw = localStorage.getItem('TSM_CPQ_RELAY') ||
                  sessionStorage.getItem('TSM_CPQ_RELAY');
      if (!raw) return null;
      const relay = JSON.parse(raw);
      const wonQuotes = (relay.quotes || []).filter(q => q.stage === 'Won');
      const existingCPQIds = new Set(
        this.orders.filter(o => o.cpq_quote_id).map(o => o.cpq_quote_id)
      );
      const newQuotes = wonQuotes.filter(q => !existingCPQIds.has(q.quote_id));
      return newQuotes.length > 0 ? { relay, newQuotes } : null;
    } catch(e) { return null; }
  }

  importFromCPQ(quotes) {
    const now = new Date().toISOString();
    const imported = quotes.map((q, i) => ({
      order_id:        `SO-${Date.now()}-${String(i+1).padStart(3,'0')}`,
      customer:        q.name || q.customer || 'Unknown Customer',
      stage:           'Order Confirmed',
      stage_entered_at: now,
      order_value:     q.net_value || 0,
      ar_balance:      0,
      credit_approved: true,
      on_time:         true,
      cycle_days:      0,
      origin:          'cpq',
      cpq_quote_id:    q.quote_id
    }));
    this.orders.unshift(...imported);
    this.saveToStorage();
    return imported;
  }

  /* ── KPI Computation ────────────────────────────────────────────────────── */
  computeKpis() {
    const closedStages = ['Closed'];
    const active = this.orders.filter(o => !closedStages.includes(o.stage));
    const totalValue = active.reduce((s, o) => s + (Number(o.order_value) || 0), 0);
    const arOpen = this.orders.reduce((s, o) => s + (Number(o.ar_balance) || 0), 0);
    const breaches = this.getSlaBreaches();
    const delivered = this.orders.filter(o =>
      ['Delivered','Invoiced','Collected','Closed'].includes(o.stage));
    const onTime = delivered.filter(o => o.on_time).length;
    const avgCycle = this.orders.filter(o => o.cycle_days > 0).length
      ? Math.round(this.orders.filter(o => o.cycle_days > 0)
          .reduce((s, o) => s + o.cycle_days, 0) /
          this.orders.filter(o => o.cycle_days > 0).length * 10) / 10
      : 0;
    return {
      open_orders:      active.length,
      order_value:      totalValue,
      sla_breach_count: breaches.length,
      ar_open:          arOpen,
      avg_cycle_days:   avgCycle,
      on_time_pct:      delivered.length
        ? Math.round(onTime / delivered.length * 100) : 100
    };
  }

  getStageDistribution() {
    const stages = this.model.entities?.order?.stages || [];
    const dist = {};
    stages.forEach(s => { dist[s.id] = { count: 0, value: 0, label: s.label }; });
    this.orders.forEach(o => {
      const s = stages.find(st => st.label === o.stage);
      if (s) {
        dist[s.id].count++;
        dist[s.id].value += Number(o.order_value) || 0;
      }
    });
    return dist;
  }

  getSlaBreaches() {
    const slaMap = this.model.sla_hours_by_stage || {};
    const closed = ['Collected','Closed'];
    const now = Date.now();
    return this.orders
      .filter(o => !closed.includes(o.stage) && o.stage_entered_at)
      .map(o => {
        const sla = Number(slaMap[o.stage]) || 48;
        const hoursIn = (now - new Date(o.stage_entered_at).getTime()) / 3_600_000;
        return { order_id: o.order_id, customer: o.customer,
                 stage: o.stage, hours_over: Math.round(hoursIn - sla) };
      })
      .filter(b => b.hours_over > 0);
  }

  /* ── AI Analysis ────────────────────────────────────────────────────────── */
  async runAnalysis() {
    const kpis            = this.computeKpis();
    const sla_breaches    = this.getSlaBreaches();
    const stage_distribution = this.getStageDistribution();
    const res = await fetch('/api/o2c/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orders: this.orders, kpis, sla_breaches,
        stage_distribution, maxTokens: 1200
      })
    });
    if (!res.ok) throw new Error(`/api/o2c/query returned ${res.status}`);
    return res.json();
  }

  /* ── Strategist Relay ───────────────────────────────────────────────────── */
  buildRelayPayload(aiText) {
    return {
      vertical:     'o2c',
      orders:       this.orders,
      kpis:         this.computeKpis(),
      sla_breaches: this.getSlaBreaches(),
      ai_analysis:  aiText,
      timestamp:    new Date().toISOString()
    };
  }
}

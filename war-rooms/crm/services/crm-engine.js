/* ============================================================
   TSM CRM ENGINE
   war-rooms/crm/services/crm-engine.js
   Mirrors war-rooms/o2c/services/o2c-engine.js's method shape,
   generalized across CRM's five entity kinds (lead, contact,
   account, opportunity, case). Unlike O2C, CRM records can
   reference each other (related_to[]) -- most importantly the
   lead-conversion event, which is CRM's core lifecycle moment
   and has no O2C analog.
   ============================================================ */

(function (global) {
  'use strict';

  const ENTITY_KEYS = ['leads', 'contacts', 'accounts', 'opportunities', 'cases'];

  class CRMEngine {
    constructor(model) {
      this.model = model || { entities: {}, kpis: [], risk_signals: [] };
      this.data = { leads: [], contacts: [], accounts: [], opportunities: [], cases: [] };
      this._canonicalCore = null;
    }

    /* ---------- Loading ---------- */

    loadSampleData() {
      const sample = this.model.sample_data || {};
      ENTITY_KEYS.forEach(k => { this.data[k] = [...(sample[k] || [])]; });
    }

    loadRecords(entityKey, records) {
      if (!ENTITY_KEYS.includes(entityKey)) {
        console.warn('CRMEngine: unknown entity key', entityKey);
        return;
      }
      this.data[entityKey] = [...(this.data[entityKey] || []), ...records];
    }

    /* ---------- Stage model helpers ---------- */

    _idField(entityKey) {
      return { leads: 'lead_id', contacts: 'contact_id', accounts: 'account_id',
               opportunities: 'opp_id', cases: 'case_id' }[entityKey];
    }

    _entityDef(entityKey) {
      const singular = entityKey.replace(/s$/, '');
      return (this.model.entities || {})[singular] || { stages: [] };
    }

    getStageDistribution(entityKey) {
      const def = this._entityDef(entityKey);
      const dist = {};
      (def.stages || []).forEach(s => { dist[s.id] = { count: 0 }; });
      (this.data[entityKey] || []).forEach(r => {
        if (!dist[r.stage]) dist[r.stage] = { count: 0 };
        dist[r.stage].count += 1;
      });
      return dist;
    }

    /** SLA breach detection, same "hours over" model O2C uses,
     *  applied to whichever entity kind has sla_hours defined
     *  on its current stage. */
    getSlaBreaches(entityKey) {
      const def = this._entityDef(entityKey);
      const stageMap = {};
      (def.stages || []).forEach(s => { stageMap[s.id] = s; });
      const idField = this._idField(entityKey);

      return (this.data[entityKey] || [])
        .map(r => {
          const stage = stageMap[r.stage];
          if (!stage || stage.sla_hours == null) return null;
          const hoursOver = (r.entered_stage_at_hours_ago || 0) - stage.sla_hours;
          if (hoursOver <= 0) return null;
          return { id: r[idField], stage: stage.label, hours_over: hoursOver, record: r };
        })
        .filter(Boolean)
        .sort((a, b) => b.hours_over - a.hours_over);
    }

    /* ---------- Lead conversion -- CRM's core relationship event ---------- */

    /** Converts a Lead into Contact + Account (if not already linked) +
     *  Opportunity, and marks the Lead 'converted'. Returns the created
     *  records so the caller (UI) can render/relay them. This is the
     *  one piece of CRM with no O2C analog: O2C orders never become a
     *  different entity kind. */
    convertLead(leadId, opts = {}) {
      const lead = this.data.leads.find(l => l.lead_id === leadId);
      if (!lead) return { error: 'Lead not found: ' + leadId };
      if (lead.stage === 'converted') return { error: 'Lead already converted' };

      const accountId = opts.account_id || 'AC-' + Math.floor(1000 + Math.random() * 9000);
      const contactId = 'CT-' + Math.floor(1000 + Math.random() * 9000);
      const oppId = 'OP-' + Math.floor(1000 + Math.random() * 9000);

      let account = this.data.accounts.find(a => a.account_id === accountId);
      if (!account) {
        account = { account_id: accountId, name: lead.company, industry: opts.industry || 'Unknown', stage: 'prospect', annual_value: 0, notes: 'Created from lead conversion: ' + leadId };
        this.data.accounts.push(account);
      }

      const contact = { contact_id: contactId, name: lead.name, account_id: accountId, title: opts.title || '', email: opts.email || '', stage: 'active' };
      this.data.contacts.push(contact);

      const opportunity = { opp_id: oppId, name: (opts.opp_name || lead.company + ' Opportunity'), account_id: accountId, stage: 'discovery', value: opts.value || 0, currency: 'USD', entered_stage_at_hours_ago: 0, owner: lead.owner, notes: 'Created from lead conversion: ' + leadId };
      this.data.opportunities.push(opportunity);

      lead.stage = 'converted';
      lead.related_to = [
        { type: 'crm_account', id: accountId },
        { type: 'crm_contact', id: contactId },
        { type: 'crm_opportunity', id: oppId }
      ];

      return { lead, account, contact, opportunity };
    }

    /* ---------- KPIs ---------- */

    computeKpis() {
      const openLeads = this.data.leads.filter(l => !['converted', 'disqualified'].includes(l.stage)).length;
      const convertedLeads = this.data.leads.filter(l => l.stage === 'converted').length;
      const totalLeads = this.data.leads.length || 1;
      const pipelineValue = this.data.opportunities
        .filter(o => !['closed_won', 'closed_lost'].includes(o.stage))
        .reduce((sum, o) => sum + (o.value || 0), 0);
      const closedOpps = this.data.opportunities.filter(o => ['closed_won', 'closed_lost'].includes(o.stage));
      const wonOpps = this.data.opportunities.filter(o => o.stage === 'closed_won');
      const winRate = closedOpps.length ? Math.round((wonOpps.length / closedOpps.length) * 100) : 0;
      const openCases = this.data.cases.filter(c => !['resolved', 'closed'].includes(c.stage)).length;
      const caseBreaches = this.getSlaBreaches('cases').length;
      const atRiskAccounts = this.data.accounts.filter(a => a.stage === 'at_risk').length;

      return {
        open_leads: openLeads,
        lead_conversion_rate: Math.round((convertedLeads / totalLeads) * 100),
        pipeline_value: pipelineValue,
        win_rate: winRate,
        open_cases: openCases,
        case_breach_count: caseBreaches,
        at_risk_accounts: atRiskAccounts
      };
    }

    /* ---------- Canonical core wiring ----------
       Same contract O2C uses (architecture/canonical/entities.json),
       but dispatched across five entity kinds instead of one.
       Each kind gets its own canonical `type`; all share vertical:'crm'. */

    async _canonical() {
      if (this._canonicalCore) return this._canonicalCore;
      if (typeof window === 'undefined' || !window.CanonicalCore) {
        console.warn('CRMEngine: CanonicalCore not available -- include /runtime/kernel/canonical-core.js before crm-engine.js to enable getCanonicalRecords().');
        return null;
      }
      const cc = new window.CanonicalCore();
      await cc.load();
      this._canonicalCore = cc;
      return cc;
    }

    _riskLevelFor(entityKey, record) {
      const breaches = this.getSlaBreaches(entityKey);
      const idField = this._idField(entityKey);
      const breach = breaches.find(b => b.id === record[idField]);
      if (!breach) return 'low';
      return breach.hours_over > 48 ? 'high' : 'medium';
    }

    async getCanonicalRecords() {
      const cc = await this._canonical();
      if (!cc) return this.data;

      const kindConfig = [
        { key: 'leads',         type: 'crm_lead',         idField: 'lead_id', ownerField: 'owner',  statusField: 'stage', warRoom: '/war-rooms/crm/crm-war-room.html' },
        { key: 'contacts',      type: 'crm_contact',      idField: 'contact_id', ownerField: null,   statusField: 'stage', warRoom: '/war-rooms/crm/crm-war-room.html' },
        { key: 'accounts',      type: 'crm_account',      idField: 'account_id', ownerField: null,   statusField: 'stage', warRoom: '/war-rooms/crm/crm-war-room.html' },
        { key: 'opportunities', type: 'crm_opportunity',  idField: 'opp_id',     ownerField: 'owner', statusField: 'stage', warRoom: '/war-rooms/crm/crm-war-room.html' },
        { key: 'cases',         type: 'crm_case',         idField: 'case_id',    ownerField: 'owner', statusField: 'stage', warRoom: '/war-rooms/crm/crm-war-room.html' }
      ];

      const out = {};
      for (const cfg of kindConfig) {
        const breaches = this.getSlaBreaches(cfg.key);
        const breachIds = new Set(breaches.map(b => b.id));
        out[cfg.key] = this.data[cfg.key].map(r => {
          const def = this._entityDef(cfg.key);
          const stage = (def.stages || []).find(s => s.id === r.stage);
          const { record } = cc.process({
            id: r[cfg.idField],
            type: cfg.type,
            vertical: 'crm',
            owner: (cfg.ownerField && r[cfg.ownerField]) || 'Unassigned',
            status: stage ? stage.label : r.stage,
            current_stage: r.stage,
            risk_level: this._riskLevelFor(cfg.key, r),
            sla_state: breachIds.has(r[cfg.idField]) ? 'breached' : 'on_track',
            linked_war_room: cfg.warRoom,
            related_to: r.related_to || [],
            ...r
          });
          return record;
        });
      }
      return out;
    }

    /* ---------- AI + relay (mirrors O2CEngine) ---------- */

    async runAnalysis() {
      const res = await fetch('/api/crm/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kpis: this.computeKpis(),
          lead_breaches: this.getSlaBreaches('leads'),
          opp_breaches: this.getSlaBreaches('opportunities'),
          case_breaches: this.getSlaBreaches('cases')
        })
      });
      if (!res.ok) throw new Error('CRM analysis endpoint returned ' + res.status);
      return res.json();
    }

    buildRelayPayload(aiText) {
      return {
        vertical: 'crm',
        kpis: this.computeKpis(),
        case_breaches: this.getSlaBreaches('cases'),
        opp_breaches: this.getSlaBreaches('opportunities'),
        ai_summary: aiText || null,
        ts: Date.now()
      };
    }
  }

  global.TSMCRMEngine = CRMEngine;
})(typeof window !== 'undefined' ? window : this);

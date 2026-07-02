/* ============================================================
   TSM BPO ENGINE
   war-rooms/bpo/services/bpo-engine.js
   Client-side orchestration layer for the BPO Services War Room.
   ============================================================ */

(function (global) {
  'use strict';

  function _bus() {
    return (typeof window !== 'undefined' && window.TSMEventBus) || null;
  }

  class BPOEngine {
    constructor(model) {
      this.model = model || { stages: [], kpis: [], sample_engagements: [] };
      this.engagements = [];
      this.stageIndex = {};
      (this.model.stages || []).forEach((stage, index) => {
        this.stageIndex[stage.id] = stage;
      });
    }

    loadEngagements(items) {
      this.engagements = Array.isArray(items) ? [...items] : [];
      const bus = _bus();
      if (bus && bus.emit) {
        bus.emit('BPO_ENGAGEMENTS_LOADED', { count: this.engagements.length, ts: Date.now() });
      }
      return this.engagements;
    }

    loadSampleEngagements() {
      return this.loadEngagements(this.model.sample_engagements || []);
    }

    getSlaBreaches() {
      return this.engagements
        .map(item => {
          const stage = this.stageIndex[item.stage];
          if (!stage || stage.sla_hours == null) return null;
          const hoursInStage = Number(item.entered_stage_at_hours_ago || 0);
          const hoursOver = hoursInStage - stage.sla_hours;
          if (hoursOver <= 0) return null;
          return {
            engagement_id: item.engagement_id,
            customer: item.customer,
            stage: stage.label,
            hours_in_stage: hoursInStage,
            sla_hours: stage.sla_hours,
            hours_over: +hoursOver.toFixed(1),
            value: item.value,
            notes: item.notes || ''
          };
        })
        .filter(Boolean)
        .sort((a, b) => b.hours_over - a.hours_over);
    }

    getStageDistribution() {
      const dist = {};
      (this.model.stages || []).forEach(stage => {
        dist[stage.id] = { label: stage.label, count: 0, value: 0 };
      });
      this.engagements.forEach(item => {
        if (dist[item.stage]) {
          dist[item.stage].count += 1;
          dist[item.stage].value += Number(item.value || 0);
        }
      });
      return dist;
    }

    computeKpis() {
      const openCount = this.engagements.length;
      const totalValue = this.engagements.reduce((sum, item) => sum + Number(item.value || 0), 0);
      const avgCycleDays = openCount
        ? +(this.engagements.reduce((sum, item) => sum + Number(item.entered_stage_at_hours_ago || 0), 0) / openCount / 24).toFixed(1)
        : 0;
      const avgCsat = openCount
        ? +(this.engagements.reduce((sum, item) => sum + Number(item.csat || 0), 0) / openCount).toFixed(1)
        : 100;
      const avgMargin = openCount
        ? +(this.engagements.reduce((sum, item) => sum + Number(item.margin_pct || 0), 0) / openCount).toFixed(1)
        : 0;
      const overdue = this.getSlaBreaches().length;

      const kpis = {
        open_engagements: openCount,
        pipeline_value: totalValue,
        avg_cycle_days: avgCycleDays,
        customer_satisfaction: avgCsat,
        overdue_engagements: overdue,
        avg_margin: avgMargin
      };

      const bus = _bus();
      if (bus && bus.emit) {
        bus.emit('BPO_KPIS_COMPUTED', { kpis, ts: Date.now() });
      }

      return kpis;
    }

    getRiskFlags() {
      const flags = [];
      this.getSlaBreaches().forEach(breach => {
        flags.push({
          type: breach.hours_over > 48 ? 'high' : 'medium',
          signal: 'delivery_delay',
          engagement_id: breach.engagement_id,
          message: `${breach.engagement_id} (${breach.customer}) is ${breach.hours_over}h over SLA in ${breach.stage}.`
        });
      });

      this.engagements.forEach(item => {
        if (item.csat != null && item.csat < 80) {
          flags.push({
            type: 'medium',
            signal: 'customer_satisfaction_drop',
            engagement_id: item.engagement_id,
            message: `${item.engagement_id} CSAT is ${item.csat}% — below the healthy threshold.`
          });
        }
        if (item.margin_pct != null && item.margin_pct < 30) {
          flags.push({
            type: 'medium',
            signal: 'profit_margin_pressure',
            engagement_id: item.engagement_id,
            message: `${item.engagement_id} margin is ${item.margin_pct}% — review pricing and approvals.`
          });
        }
      });

      return flags;
    }

    buildAnalysisPayload(extraContext) {
      return {
        vertical: 'bpo',
        model: this.model,
        engagements: this.engagements,
        kpis: this.computeKpis(),
        stage_distribution: this.getStageDistribution(),
        sla_breaches: this.getSlaBreaches(),
        risk_flags: this.getRiskFlags(),
        context: extraContext || ''
      };
    }

    async runAnalysis(extraContext) {
      const payload = this.buildAnalysisPayload(extraContext);
      const bus = _bus();
      if (bus && bus.emit) bus.emit('BPO_ANALYSIS_STARTED', { ts: Date.now() });

      try {
        const res = await fetch('/api/bpo/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error('status ' + res.status);
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || 'analysis failed');

        if (bus && bus.emit) bus.emit('BPO_ANALYSIS_COMPLETE', { vertical: 'bpo', data, ts: Date.now() });
        return data;
      } catch (err) {
        const risk = this.getRiskFlags();
        const analysis = risk.length
          ? `Local BPO analysis fallback: ${risk.length} risk signals detected. First issues: ${risk.slice(0, 3).map(f => f.message).join(' | ')}.`
          : 'Local BPO analysis fallback: no immediate risk signals detected. Pipeline is operational.';
        if (bus && bus.emit) bus.emit('BPO_ANALYSIS_FALLBACK', { error: err.message, ts: Date.now() });
        return { ok: true, analysis };
      }
    }

    buildRelayPayload(analysis) {
      return {
        vertical: 'bpo',
        engagements: this.engagements,
        kpis: this.computeKpis(),
        stage_distribution: this.getStageDistribution(),
        sla_breaches: this.getSlaBreaches(),
        risk_flags: this.getRiskFlags(),
        analysis: analysis || null,
        relayed_at: new Date().toISOString()
      };
    }

    async _canonical() {
      if (this._canonicalCore) return this._canonicalCore;
      if (typeof window === 'undefined' || !window.CanonicalCore) {
        return null;
      }
      const cc = new window.CanonicalCore();
      await cc.load();
      this._canonicalCore = cc;
      return cc;
    }

    async getCanonicalEngagements() {
      const cc = await this._canonical();
      if (!cc) return this.engagements;

      const breaches = this.getSlaBreaches();
      const breachIds = new Set(breaches.map(b => b.engagement_id));

      return this.engagements.map(item => {
        return cc.process({
          id: item.engagement_id,
          type: 'bpo_engagement',
          vertical: 'bpo',
          status: this.stageIndex[item.stage]?.label || item.stage,
          current_stage: item.stage,
          owner: item.owner || 'Unassigned',
          risk_level: breachIds.has(item.engagement_id) ? 'high' : 'low',
          sla_state: breachIds.has(item.engagement_id) ? 'breached' : 'on_track',
          value: item.value,
          customer: item.customer,
          notes: item.notes || ''
        }).record;
      });
    }
  }

  global.TSMBPOEngine = BPOEngine;
})(window);

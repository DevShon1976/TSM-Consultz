'use strict';

function buildChartBData(snaps) {
  const labels   = snaps.map(s => s.period_label);
  const budget   = snaps.map(s => s.revised_contract_value);
  const actual   = snaps.map((s,i) => i <= s.periods_complete ? s.cost_to_date : null);
  const eac      = snaps.map((s,i) => i >= s.periods_complete - 1 ? s.cost_to_date + s.estimated_cost_to_complete : null);
  const latestEAC = eac.find(v=>v!==null) || 0;
  const overrun   = latestEAC - (snaps[0]?.revised_contract_value || 0);
  return {
    chart:'B', labels,
    datasets:{ budget, actual_cost:actual, forecast_eac:eac },
    insight: overrun > 0
      ? `Current trend indicates a $${Math.round(overrun/1000)}k overrun by project end.`
      : `Project tracking ${Math.round(Math.abs(overrun)/1000)}k under budget.`,
    overrun_amount: overrun,
    alert_level: overrun > 50000 ? 'red' : overrun > 0 ? 'yellow' : 'green'
  };
}

function buildChartCData(snaps, budgetedGPpct=18.0) {
  const labels   = snaps.map(s => s.period_label);
  const actualGP = snaps.map((s,i) => {
    if (i > s.periods_complete) return null;
    const rev = s.revised_contract_value * (s.pct_complete / 100);
    return rev ? +((rev - s.cost_to_date) / rev * 100).toFixed(2) : null;
  });
  const forecastGP = snaps.map((s,i) => {
    if (i < s.periods_complete - 1) return null;
    const eac = s.cost_to_date + s.estimated_cost_to_complete;
    const rev = s.revised_contract_value;
    return rev ? +((rev - eac) / rev * 100).toFixed(2) : null;
  });
  const latest = actualGP.filter(v=>v!==null).slice(-1)[0] || budgetedGPpct;
  const fade   = +(budgetedGPpct - latest).toFixed(2);
  return {
    chart:'C', labels,
    datasets:{ budgeted_gp: snaps.map(()=>budgetedGPpct), actual_gp:actualGP, forecast_gp:forecastGP },
    insight: fade > 0
      ? `Margin loss of ${fade}% detected due to material price surges.`
      : `Margin holding ${Math.abs(fade)}% above budget.`,
    fade_pct: fade, surety_flag: fade > 2,
    alert_level: fade > 3 ? 'red' : fade > 1 ? 'yellow' : 'green'
  };
}

function buildChartDData(snaps) {
  const labels    = snaps.map(s => s.period_label);
  const billed    = snaps.map(s => s.billed_to_date);
  const received  = snaps.map((s,i) => i <= s.periods_complete ? s.cash_received_to_date : null);
  const retainage = snaps.map(s => s.retainage_amount);
  const cashGap   = snaps.map(s => s.billed_to_date - s.cash_received_to_date - s.retainage_amount);
  const tightIdx  = cashGap.reduce((mi,v,i,a) => v < a[mi] ? i : mi, 0);
  return {
    chart:'D', labels,
    datasets:{ billed, cash_received:received, retainage_held:retainage, cash_gap:cashGap },
    insight: `Cash tight in ${labels[tightIdx]} — accelerate Change Order (CO) billing. Retainage release on substantial completion.`,
    tightest_month: labels[tightIdx],
    total_retainage_held: snaps.slice(-1)[0]?.retainage_amount || 0,
    alert_level:'blue'
  };
}

function buildChartFData(jobs) {
  const cells = jobs.map(job => {
    const costPct    = job.cost_to_date / (job.cost_to_date + job.estimated_cost_to_complete) * 100;
    const billingPct = job.billed_to_date / job.revised_contract_value * 100;
    const gap        = job.billed_to_date - (job.revised_contract_value * costPct / 100);
    const gapK       = Math.round(gap / 1000);
    let risk, label;
    if      (gap < -200000) { risk='red';    label=`Under-billed $${Math.abs(gapK)}k`; }
    else if (gap <  -50000) { risk='yellow'; label=`Watch $${Math.abs(gapK)}k`; }
    else if (gap >  200000) { risk='yellow'; label=`Over-billed $${gapK}k`; }
    else                    { risk='green';  label=gapK > 0 ? `On track +$${gapK}k` : 'Balanced'; }
    return { job_id:job.job_id, job_name:job.job_name, cost_pct:+costPct.toFixed(1), billing_pct:+billingPct.toFixed(1), gap, gap_k:gapK, risk, label, surety_concern: gap < -100000 };
  });
  const redJobs = cells.filter(c=>c.risk==='red').map(c=>c.job_id);
  const yellowJobs = cells.filter(c=>c.risk==='yellow').map(c=>c.job_id);
  return {
    chart:'F', cells,
    insight: redJobs.length > 0
      ? `${redJobs.join(' and ')} are Red: Significant under-billing. Immediate INVOICE_TRIGGER recommended.`
      : 'Portfolio healthy — no critical under-billing.',
    red_jobs:redJobs, yellow_jobs:yellowJobs,
    total_gap_k: Math.round(cells.reduce((s,c)=>s+c.gap,0)/1000),
    alert_level: redJobs.length > 0 ? 'red' : yellowJobs.length > 0 ? 'yellow' : 'green'
  };
}

function computeG702Summary(job) {
  const contractSum    = job.revised_contract_value || 0;
  const totalCompleted = (job.billed_to_date || 0) + (job.stored_materials || 0);
  const retainage      = totalCompleted * (job.retainage_pct || 0.10);
  const totalLessRet   = totalCompleted - retainage;
  const prevPayments   = job.cash_received_to_date || 0;
  return {
    A_original_contract_sum:       contractSum,
    B_change_orders_to_date:       (job.revised_contract_value||0)-(job.contract_value_original||contractSum),
    C_contract_sum_to_date:        contractSum,
    D_total_completed_and_stored:  totalCompleted,
    E_retainage:                   retainage,
    F_total_earned_less_retainage: totalLessRet,
    G_less_previous_payments:      prevPayments,
    H_balance_to_finish:           contractSum - totalCompleted,
    CURRENT_PAYMENT_DUE:           totalLessRet - prevPayments,
  };
}

function buildAllChartData({ periodicSnapshots, allJobs, budgetedGPpct=18.0 }) {
  return {
    generated_at: new Date().toISOString(),
    chartB: buildChartBData(periodicSnapshots),
    chartC: buildChartCData(periodicSnapshots, budgetedGPpct),
    chartD: buildChartDData(periodicSnapshots),
    chartF: buildChartFData(allJobs),
    g702_summary: computeG702Summary(allJobs[0] || {}),
  };
}

module.exports = { buildChartBData, buildChartCData, buildChartDData, buildChartFData, buildAllChartData, computeG702Summary };

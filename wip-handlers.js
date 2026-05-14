'use strict';

function fmt(n) {
  return new Intl.NumberFormat('en-US', { style:'currency', currency:'USD', maximumFractionDigits:0 }).format(n);
}
function timestamp() { return new Date().toISOString(); }

async function constructionWIPRecon(body) {
  const { job='Ameris', costs=5100000, billed=4200000, threshold=50000 } = body;
  const gap = costs - billed;
  const billPct = Math.round((billed / costs) * 100);
  const hasGap = gap > threshold;
  return {
    suite: 'construction', logic: 'WIP-RECON', job, ts: timestamp(),
    metrics: { costs_incurred: costs, billed_to_date: billed, gap, billing_pct: billPct },
    status:  hasGap ? 'GAP_DETECTED'    : 'BALANCED',
    action:  hasGap ? 'INVOICE_TRIGGER' : 'NO_ACTION',
    message: hasGap
      ? `Recoup ${fmt(gap)} — invoice packet queued for ${job} PM approval.`
      : `${job} WIP is balanced.`,
    next_steps: hasGap ? [
      `Generate draft invoice for ${fmt(gap)}`,
      'Route to PM for approval via tsm-shell workflow',
      'Post approved invoice to AR ledger',
      'Reconcile WIP balance on approval'
    ] : []
  };
}

async function healthcareWIPRecon(body) {
  const { unbilled_services=148, unbilled_value=2300000, denial_risk_pct=23, facility='Main Campus', period='Current Month' } = body;
  const net_estimate = Math.round(unbilled_value * (1 - denial_risk_pct / 100));
  const high_risk = denial_risk_pct >= 20;
  return {
    suite: 'healthcare', logic: 'BNCA', facility, period, ts: timestamp(),
    metrics: { unbilled_services, unbilled_value, denial_risk_pct, net_recovery_estimate: net_estimate },
    status:  unbilled_services > 0 ? 'CLAIMS_PENDING'     : 'CLEAN',
    action:  unbilled_services > 0 ? 'CLAIM_BATCH_SUBMIT' : 'NO_ACTION',
    message: unbilled_services > 0
      ? `${unbilled_services} claims queued. Estimated net recovery: ${fmt(net_estimate)}.`
      : 'No unbilled services found.',
    risk_flag: high_risk ? `Denial risk ${denial_risk_pct}% — review coding before submission.` : null,
    next_steps: unbilled_services > 0 ? [
      'Run coding review on flagged claims',
      'Submit batch to clearinghouse',
      'Monitor 835 remittance for denials',
      'Post payments to patient accounts'
    ] : []
  };
}

async function insuranceAuditRecon(body) {
  const { earned_premium=7800000, audited=6100000, line_of_business='Property & Casualty', period='Current Quarter' } = body;
  const unaudited = earned_premium - audited;
  const audit_pct = Math.round((audited / earned_premium) * 100);
  const reserve_risk = unaudited > 1000000;
  return {
    suite: 'tsm-insurance', logic: 'AUDIT-RECON', line_of_business, period, ts: timestamp(),
    metrics: { earned_premium, audited_premium: audited, unaudited_premium: unaudited, audit_completion_pct: audit_pct },
    status:  unaudited > 0 ? 'AUDIT_GAP'           : 'FULLY_AUDITED',
    action:  unaudited > 0 ? 'AUDIT_SCHEDULE_PUSH' : 'NO_ACTION',
    message: unaudited > 0
      ? `Audit schedule pushed for ${fmt(unaudited)} in unaudited ${line_of_business} premium.`
      : 'All premium fully audited.',
    reserve_risk_flag: reserve_risk ? `Reserve misstatement risk: ${fmt(unaudited)} unaudited.` : null,
    next_steps: unaudited > 0 ? [
      'Push audit schedule to unaudited policyholders',
      'Collect payroll/exposure data for audit',
      'Calculate final earned premium adjustment',
      'Post audit adjustment to policy ledger'
    ] : []
  };
}

async function finopsAccrualRecon(body) {
  const { accrued=4400000, invoiced=3900000, cloud_provider='Multi-cloud', period='Current Month', flush_threshold=100000 } = body;
  const variance = accrued - invoiced;
  const match_rate_pct = Math.round((invoiced / accrued) * 100);
  const auto_flush = variance <= flush_threshold;
  return {
    suite: 'finops-suite', logic: 'ACCRUAL-RECON', cloud_provider, period, ts: timestamp(),
    metrics: { accrued_spend: accrued, invoiced_spend: invoiced, variance, invoice_match_rate_pct: match_rate_pct },
    status:  variance > 0 ? 'VARIANCE_DETECTED' : 'MATCHED',
    action:  variance > 0 ? (auto_flush ? 'ACCRUAL_AUTO_FLUSH' : 'ACCRUAL_FLUSH') : 'NO_ACTION',
    message: variance > 0
      ? `${fmt(variance)} variance. ${auto_flush ? 'Auto-flushing' : 'Manual flush queued'} before period close.`
      : 'Cloud spend fully reconciled.',
    next_steps: variance > 0 ? [
      'Pull latest invoices from cloud billing APIs',
      'Match invoice line items to accrual entries',
      auto_flush ? `Auto-flush ${fmt(variance)} — within threshold` : `Manual review required — ${fmt(variance)} exceeds threshold`,
      'Post reconciled entries to GL before period close'
    ] : []
  };
}

module.exports = { constructionWIPRecon, healthcareWIPRecon, insuranceAuditRecon, finopsAccrualRecon };

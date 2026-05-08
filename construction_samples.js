const SAMPLES = {
  /* PLANS & DRAWINGS */
  'struc-block-c': { label: 'Structural Foundation — Block C', type: 'PLANS', desc: 'Complete foundation plans and rebar layout.', content: 'Structural Set Rev 4: Foundation pour sequence for Block C. High density rebar spec required for load-bearing walls.', risk: 'LOW', flags: '0', actions: '1', conf: '98%' },
  'mep-coord': { label: 'MEP Coordination — Level 1', type: 'PLANS', desc: 'Mechanical, Electrical, and Plumbing overlays.', content: 'MEP Drawings: Significant clash detected between HVAC ducting and fire sprinkler line in Sector 4.', risk: 'MED', flags: '2', actions: '2', conf: '91%' },
  
  /* CONTRACTS */
  'gc-agreement': { label: 'GC Agreement — Phase 2', type: 'CONTRACTS', desc: 'Steel erection and structural framing contract.', content: 'GC Contract: Includes $2.4M scope for structural steel. Liquidated damages trigger after 15-day delay.', risk: 'MED', flags: '1', actions: '1', conf: '95%' },
  'sub-bid-roofing': { label: 'Subcontractor Bid — Roofing', type: 'CONTRACTS', desc: 'Bid package for roofing and waterproofing.', content: 'Roofing Bid: $410K total. Includes 20-year warranty. Excludes specialized skylight flashing.', risk: 'LOW', flags: '1', actions: '0', conf: '94%' },
  
  /* PERMITS */
  'permit-foundation': { label: 'Building Permit — Block C', type: 'PERMITS', desc: 'City approved foundation and site prep permit.', content: 'Permit #2026-8849: Approved for foundation only. Structural framing permit still pending city review.', risk: 'HIGH', flags: '1', actions: '3', conf: '99%' },
  'zoning-variance': { label: 'Zoning Variance App', type: 'PERMITS', desc: 'Draft application for height variance.', content: 'Zoning Draft: Seeking 12ft variance for rooftop mechanical penthouse. Community board hearing set for May.', risk: 'HIGH', flags: '4', actions: '2', conf: '88%' },
  
  /* REPORTS */
  'budget-recon': { label: 'Q1 Budget Reconciliation', type: 'REPORTS', desc: 'Full line-item budget vs. actual spend.', content: 'Q1 Report: Actual spend exceeding budget by 8.4% due to concrete price surge and overtime labor.', risk: 'HIGH', flags: '5', actions: '3', conf: '96%' },
  'weekly-progress': { label: 'Weekly Progress — Wk 17', type: 'REPORTS', desc: 'Site 4B progress and schedule tracking.', content: 'Week 17: Concrete pour 100% complete. Steel delivery delayed 48 hours. Schedule float reduced to 3 days.', risk: 'MED', flags: '2', actions: '1', conf: '97%' },
  
  /* SAFETY & OSHA */
  'osha-plan': { label: 'OSHA Safety Plan — 2026', type: 'SAFETY', desc: 'Site-wide safety protocols and emergency plan.', content: '2026 Safety Plan: New fall protection protocols implemented. Hard hat areas expanded for crane operations.', risk: 'LOW', flags: '0', actions: '0', conf: '99%' },
  'incident-report': { label: 'Incident Report — Apr 14', type: 'SAFETY', desc: 'Near miss report regarding rigging gear.', content: 'Incident: Rigging cable frayed during lift. No injuries. Corrective action: All cables replaced and re-certified.', risk: 'CRIT', flags: '1', actions: '4', conf: '92%' },
  
  /* FINANCIAL */
  'invoice-summary': { label: 'Q1 Invoice Summary', type: 'FINANCIAL', desc: 'Total spend across 22 vendors.', content: 'Invoice Summary: $1.3M total processed. Three invoices flagged for duplication in excavation scope.', risk: 'MED', flags: '3', actions: '2', conf: '95%' },
  'change-order-7': { label: 'Change Order #7', type: 'FINANCIAL', desc: 'Foundation scope adjustment.', content: 'CO #7: +$42,000 for additional soil stabilization and unforeseen bedrock removal.', risk: 'MED', flags: '1', actions: '1', conf: '98%' }
};

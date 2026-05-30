/**
 * HC NODE GUIDE — SECTOR CONFIGS
 * ─────────────────────────────────────────────────────────────────
 * Drop the relevant NODE_CONFIGS[nodeId] into each node's script as:
 *   const TAB_CONFIG = NODE_CONFIGS['hc-compliance'].tabs;
 *   let clientData   = { ...NODE_CONFIGS['hc-compliance'].defaultClient };
 *
 * Each node has:
 *   - tabs{}          → per-tab steps (mirrors billing TAB_CONFIG shape)
 *   - defaultClient{} → demo patient/claim/issue shown before intake
 *   - bncaRule        → when to run BNCA vs Strategist (shown in guide)
 *   - strategistRule  → escalation trigger text
 *   - urgentTask{}    → the active mission task in the panel
 *   - completedTask{} → the struck-through completed task above it
 * ─────────────────────────────────────────────────────────────────
 */

const NODE_CONFIGS = {

  // ════════════════════════════════════════════════
  // HC-COMPLIANCE
  // ════════════════════════════════════════════════
  'hc-compliance': {
    icon: '🛡️',
    title: 'HC COMPLIANCE COMMAND',
    sub: 'HIPAA · OIG · CMS Conditions · Audit Risk · Regulatory Reporting',
    tabs: {
      dash: {
        patient: 'Practice Portfolio',
        claim: 'OIG-2024-Q2',
        payer: 'CMS / OIG',
        steps: [
          'OIG Work Plan item flagged: evaluation & management upcoding pattern across 47 claims. Identify documentation gaps and assess audit exposure.',
          'HIPAA Security Rule gap identified: PHI access logs not retained for 6-year minimum. Assess breach risk and remediation timeline.'
        ]
      },
      audits: {
        patient: 'Dr. Rivera Group',
        claim: 'AUD-0089',
        payer: 'Medicare RAC',
        steps: [
          'RAC audit request received for CLM-0089 — CPT 99215 billed 23x in 30 days. Pull documentation and prepare audit response package.',
          'Contractor medical review (CMR) scheduled in 14 days. Identify all claims in scope and assign documentation owner per provider.'
        ]
      },
      hipaa: {
        patient: 'Admin — All Staff',
        claim: 'HIPAA-INC-004',
        payer: 'HHS OCR',
        steps: [
          'Unauthorized PHI disclosure reported: staff member emailed patient records to wrong recipient. Assess breach notification requirements under HITECH.',
          'Business Associate Agreement (BAA) missing for cloud storage vendor. Evaluate exposure and execute BAA or terminate data sharing immediately.'
        ]
      },
      oig: {
        patient: 'Billing Dept',
        claim: 'OIG-EXCL-2024',
        payer: 'OIG / LEIE',
        steps: [
          'New hire not screened against OIG LEIE exclusion list prior to employment. Perform retroactive screening and assess exposure for services billed during employment.',
          'Corporate Integrity Agreement (CIA) deadline approaching: 90-day compliance training attestation due. Identify incomplete staff and escalate to HR.'
        ]
      },
      ai: {
        patient: 'Portfolio',
        claim: 'ALL',
        payer: 'All Regulators',
        steps: [
          'Run compliance risk brief: HIPAA gaps, OIG exposure, RAC audit risk, and documentation deficiencies ranked by financial and regulatory severity.',
          'Generate board-ready compliance summary: top 3 risks, remediation owners, deadlines, and estimated penalty exposure if unresolved.'
        ]
      }
    },
    defaultClient: {
      patient: 'Dr. Rivera Group',
      claim: 'OIG-2024-Q2',
      payer: 'CMS / OIG',
      denial: 'RAC Audit',
      cpt: '99215',
      amount: '$12,040',
      issue: 'Upcoding pattern flagged on 23 claims — documentation does not support E&M Level 5. RAC audit request expected within 30 days.'
    },
    completedTask: { label: 'OIG risk codes identified', sub: 'Upcoding · HIPAA gap · LEIE screen · BAA missing' },
    urgentTask: {
      title: 'RAC audit response — 14-day window',
      meta: 'OIG-2024-Q2 · CPT 99215 · CMS/OIG · $12,040 exposure',
      deadline: '14-day response window — failure to respond = automatic overpayment finding',
      instructions: 'Pull all 23 claim records, assign documentation reviewer, and submit written response to RAC contractor.'
    },
    bncaRule: 'Always run BNCA first to rank compliance gaps by penalty exposure and probability of audit escalation.',
    strategistRule: 'Escalate to Strategist when HIPAA breach triggers HHS OCR notification, OIG exclusion affects billing, or CIA violation risk is identified.'
  },

  // ════════════════════════════════════════════════
  // HC-FINANCIAL
  // ════════════════════════════════════════════════
  'hc-financial': {
    icon: '💰',
    title: 'HC FINANCIAL COMMAND',
    sub: 'Revenue Cycle · Cash Flow · Payer Contracts · AR · Financial Reporting',
    tabs: {
      dash: {
        patient: 'Practice Portfolio',
        claim: 'AR-Q2-2024',
        payer: 'All Payers',
        steps: [
          'Days in AR has risen from 34 to 52 days over 90 days. Identify top 3 payer-specific bottlenecks and draft 30-day AR reduction plan.',
          'Net collection rate dropped from 96% to 91%. Identify write-off patterns, payer underpayment trends, and contractual adjustment anomalies.'
        ]
      },
      ar: {
        patient: 'Portfolio',
        claim: 'AR-AGING-001',
        payer: 'Mixed',
        steps: [
          '$48K in claims aged over 90 days — identify which are recoverable vs write-off risk and assign collection priority by payer.',
          'Underpayment detected on 14 Aetna claims vs contracted fee schedule. Calculate variance, draft dispute letter, and identify recoupment path.'
        ]
      },
      contracts: {
        patient: 'Contract Review',
        claim: 'CONTRACT-UHC-2024',
        payer: 'UnitedHealthcare',
        steps: [
          'UHC contract renewal due in 60 days. Compare current reimbursement rates to Medicare benchmark and CMS fee schedule for top 10 CPT codes.',
          'Silent PPO detected: third-party payer accessing UHC contracted rates without authorization. Assess financial impact and legal remedies.'
        ]
      },
      reporting: {
        patient: 'CFO Dashboard',
        claim: 'FIN-RPT-Q2',
        payer: 'All Payers',
        steps: [
          'Monthly financial close: reconcile payer remittances against posted payments, identify unposted ERAs, and flag contractual adjustment outliers.',
          'Quarterly board report due: prepare revenue cycle KPI summary — collection rate, denial rate, days in AR, and top 5 revenue recovery opportunities.'
        ]
      },
      ai: {
        patient: 'Portfolio',
        claim: 'ALL',
        payer: 'All Payers',
        steps: [
          'Run deep financial intelligence brief: AR aging, underpayment exposure, contract performance gaps, and cash flow risk ranked by dollar impact.',
          'Generate CFO-ready summary: top 3 financial risks, recovery opportunities, and 90-day revenue cycle improvement plan.'
        ]
      }
    },
    defaultClient: {
      patient: 'Practice Portfolio',
      claim: 'AR-Q2-2024',
      payer: 'All Payers',
      denial: 'Underpayment',
      cpt: 'Multiple',
      amount: '$48,000',
      issue: 'Days in AR at 52 days, net collection rate 91% — $48K aging over 90 days with underpayment pattern on Aetna claims.'
    },
    completedTask: { label: 'AR aging report pulled', sub: '$48K at risk · 52 days AR · 91% collection rate' },
    urgentTask: {
      title: '$3,800 write-off risk — 48hr decision',
      meta: 'CLM-0334 · CPT 93454 · UHC · $3,800',
      deadline: 'Timely filing expires in 48hrs — appeal now or write off',
      instructions: 'Pull original submission proof, file CO-29 appeal with UHC, document in AR system.'
    },
    bncaRule: 'Run BNCA first to rank AR risk by dollar amount and recovery probability before any escalation.',
    strategistRule: 'Escalate to Strategist when underpayment pattern is systemic across a payer, contract dispute exceeds $25K, or days in AR exceeds 60 days practice-wide.'
  },

  // ════════════════════════════════════════════════
  // HC-GRANTS
  // ════════════════════════════════════════════════
  'hc-grants': {
    icon: '📋',
    title: 'HC GRANTS COMMAND',
    sub: 'Federal Grants · HRSA · NIH · Reporting · Compliance · Renewals',
    tabs: {
      dash: {
        patient: 'Grants Portfolio',
        claim: 'HRSA-2024-001',
        payer: 'HRSA / HHS',
        steps: [
          'HRSA Health Center Program grant — quarterly progress report due in 7 days. Identify data gaps in patient visit counts, sliding scale compliance, and scope of service.',
          'Unobligated grant funds of $42K flagged at fiscal year end. Determine allowable expenditure categories and prevent fund lapse with approved reallocation plan.'
        ]
      },
      active: {
        patient: 'Dr. Okafor Center',
        claim: 'NIH-R01-2024',
        payer: 'NIH',
        steps: [
          'NIH R01 grant — principal investigator change form required due to PI departure. Submit prior approval request to grants management office within 30 days.',
          'Budget deviation of 15% between line items detected in grant drawdown. Assess whether prior approval required and document justification for audit trail.'
        ]
      },
      reporting: {
        patient: 'Grants Admin',
        claim: 'FFR-Q2-2024',
        payer: 'HHS Grants Division',
        steps: [
          'Federal Financial Report (FFR) due via Payment Management System. Reconcile drawdowns vs expenditures and confirm matching fund documentation is complete.',
          'Program performance report: calculate unduplicated patient count, visit volume by service category, and health outcome metrics required by Notice of Award.'
        ]
      },
      renewals: {
        patient: 'Development Team',
        claim: 'RENEWAL-HRSA-2025',
        payer: 'HRSA',
        steps: [
          'HRSA renewal application window opens in 45 days. Pull prior year UDS data, identify service gaps vs needs assessment, and draft project narrative outline.',
          'Competing renewal requires updated budget justification. Compare current award vs proposed budget, justify new FTE request, and align with HRSA priorities.'
        ]
      },
      ai: {
        patient: 'Portfolio',
        claim: 'ALL',
        payer: 'All Funders',
        steps: [
          'Run grants intelligence brief: reporting deadlines, compliance risks, unobligated balances, and renewal timeline ranked by urgency.',
          'Generate funder-ready performance summary: patient impact metrics, budget utilization, and key accomplishments for top 3 active grants.'
        ]
      }
    },
    defaultClient: {
      patient: 'Health Center',
      claim: 'HRSA-2024-001',
      payer: 'HRSA / HHS',
      denial: 'Reporting Gap',
      cpt: 'N/A',
      amount: '$42,000',
      issue: 'Quarterly progress report overdue — $42K in unobligated funds at risk of lapse if not reallocated within 7 days.'
    },
    completedTask: { label: 'Grant portfolio reviewed', sub: 'HRSA · NIH R01 · Reporting gaps · Fund lapse risk' },
    urgentTask: {
      title: 'HRSA report due — 7-day window',
      meta: 'HRSA-2024-001 · Q2 Progress Report · $42K at risk',
      deadline: '7-day reporting deadline — missed report triggers corrective action plan',
      instructions: 'Pull UDS data, complete visit counts, confirm sliding scale compliance, submit via EHBs portal.'
    },
    bncaRule: 'Run BNCA first to identify the highest-risk grant item — missed deadline, fund lapse, or compliance gap.',
    strategistRule: 'Escalate to Strategist when grant non-compliance triggers federal sanctions, audit finding affects multiple grants, or renewal strategy requires board-level decisions.'
  },

  // ════════════════════════════════════════════════
  // HC-INSURANCE
  // ════════════════════════════════════════════════
  'hc-insurance': {
    icon: '🏥',
    title: 'HC INSURANCE COMMAND',
    sub: 'Prior Auth · Eligibility · Payer Relations · Coverage Disputes · Appeals',
    tabs: {
      dash: {
        patient: 'Portfolio',
        claim: 'AUTH-Q2-2024',
        payer: 'All Payers',
        steps: [
          'Prior authorization denial rate at 22% — top denied services: MRI brain, physical therapy, specialty referrals. Identify payer-specific auth requirements and reduce denials.',
          'Eligibility verification failures on 34 claims — services rendered without active coverage confirmed. Assess write-off risk and tighten front-end eligibility workflow.'
        ]
      },
      priorauth: {
        patient: 'Maria Santos',
        claim: 'AUTH-0441',
        payer: 'BlueCross BlueShield',
        steps: [
          'Prior auth denied for MRI brain (CPT 70553) — BlueCross requires peer-to-peer review within 72 hours. Schedule P2P with medical director and prepare clinical justification.',
          'Retrospective auth requested for emergent procedure performed without prior approval. Document medical necessity, submit retro auth with ER records and attending notes.'
        ]
      },
      eligibility: {
        patient: 'James Okafor',
        claim: 'ELIG-0089',
        payer: 'Medicaid',
        steps: [
          'Patient Medicaid eligibility lapsed day of service — claim denied CO-B7. Verify retroactive eligibility reinstatement and resubmit if coverage confirmed.',
          'Coordination of benefits (COB) dispute: patient has Medicare + Medicaid. Determine correct primary/secondary payer order and resubmit claims in correct sequence.'
        ]
      },
      appeals: {
        patient: 'Linda Park',
        claim: 'APPEAL-0312',
        payer: 'Aetna',
        steps: [
          'Aetna upheld initial denial on Level 1 appeal for CPT 27447 (knee replacement) — CO-4 no prior authorization. Prepare Level 2 external appeal with orthopedic peer review.',
          'Appeal deadline in 14 days for 6 Aetna claims totaling $18,400. Prioritize by dollar amount, assign appeal writer, and confirm payer-specific appeal submission requirements.'
        ]
      },
      ai: {
        patient: 'Portfolio',
        claim: 'ALL',
        payer: 'All Payers',
        steps: [
          'Run insurance intelligence brief: auth denial patterns, eligibility failure trends, appeal win rate by payer, and coverage dispute risks ranked by dollar impact.',
          'Generate payer relations summary: top 3 payer-specific issues, contract leverage points, and recommended escalation strategy for systemic auth denials.'
        ]
      }
    },
    defaultClient: {
      patient: 'Maria Santos',
      claim: 'AUTH-0441',
      payer: 'BlueCross BlueShield',
      denial: 'Prior Auth Denied',
      cpt: '70553',
      amount: '$1,400',
      issue: 'MRI brain auth denied — peer-to-peer review required within 72 hours or patient loses right to appeal at this level.'
    },
    completedTask: { label: 'Auth denial pattern identified', sub: 'MRI · PT · Specialty refs · 22% denial rate' },
    urgentTask: {
      title: 'Peer-to-peer review — 72hr window',
      meta: 'AUTH-0441 · CPT 70553 · BlueCross · $1,400',
      deadline: '72-hour P2P window — missed deadline forfeits this appeal level',
      instructions: 'Contact BlueCross medical director line, prepare clinical justification, have attending physician available for P2P call.'
    },
    bncaRule: 'Run BNCA first to identify the highest-priority auth or eligibility issue by dollar amount and deadline proximity.',
    strategistRule: 'Escalate to Strategist when systemic auth denials suggest payer contract issue, or COB disputes require legal review of coordination rules.'
  },

  // ════════════════════════════════════════════════
  // HC-LEGAL
  // ════════════════════════════════════════════════
  'hc-legal': {
    icon: '⚖️',
    title: 'HC LEGAL COMMAND',
    sub: 'Contracts · Malpractice · Regulatory · Employment Law · Risk Management',
    tabs: {
      dash: {
        patient: 'Legal Portfolio',
        claim: 'LEGAL-Q2-2024',
        payer: 'Risk / Counsel',
        steps: [
          'Malpractice claim filed on patient case — statute of limitations runs in 90 days. Assign defense counsel, pull complete medical record, and notify malpractice carrier.',
          'Provider employment contract expiring in 60 days — non-compete clause review required. Identify state law restrictions and assess enforceability before renewal offer.'
        ]
      },
      contracts: {
        patient: 'Admin / Legal',
        claim: 'CONTRACT-2024-07',
        payer: 'Vendor / Payer',
        steps: [
          'New EHR vendor contract requires review — identify indemnification gaps, HIPAA BAA requirements, data ownership clauses, and termination rights before execution.',
          'Payer network agreement renewal — review most favored nation (MFN) clause, rate floors, and audit rights before signing. Flag any provisions that limit balance billing rights.'
        ]
      },
      malpractice: {
        patient: 'Dr. Chen',
        claim: 'MAL-0042',
        payer: 'ProAssurance',
        steps: [
          'Adverse event report filed — patient fall resulting in hip fracture. Complete incident report, preserve all records, and notify risk management and malpractice carrier within 24 hours.',
          'Demand letter received for $250K. Evaluate case strength, document standard of care compliance, and coordinate with defense counsel on settlement vs litigation decision.'
        ]
      },
      regulatory: {
        patient: 'Compliance / Legal',
        claim: 'REG-CMS-2024',
        payer: 'CMS / State DOH',
        steps: [
          'State Department of Health survey scheduled in 30 days. Review Conditions of Participation compliance, identify deficiencies, and prepare corrective action documentation.',
          'CMS 855I revalidation due — provider enrollment record has expired NPI information and outdated practice locations. Submit corrections via PECOS before billing suspension.'
        ]
      },
      ai: {
        patient: 'Portfolio',
        claim: 'ALL',
        payer: 'All Legal Matters',
        steps: [
          'Run legal risk brief: open claims, contract exposure, regulatory deadlines, and employment matters ranked by financial and reputational risk.',
          'Generate counsel-ready summary: top 3 legal risks, recommended actions, statute of limitations deadlines, and estimated liability exposure.'
        ]
      }
    },
    defaultClient: {
      patient: 'Dr. Chen',
      claim: 'MAL-0042',
      payer: 'ProAssurance',
      denial: 'Malpractice Claim',
      cpt: 'N/A',
      amount: '$250,000',
      issue: 'Demand letter received — $250K malpractice claim. Defense counsel not yet assigned. Statute of limitations runs in 90 days.'
    },
    completedTask: { label: 'Legal risk inventory completed', sub: 'Malpractice · Contract gaps · Regulatory · Employment' },
    urgentTask: {
      title: 'Defense counsel — 24hr assignment window',
      meta: 'MAL-0042 · Dr. Chen · ProAssurance · $250K exposure',
      deadline: '24hr carrier notification requirement — delay may void coverage',
      instructions: 'Notify ProAssurance, assign defense counsel, preserve all records, complete incident report.'
    },
    bncaRule: 'Run BNCA first to rank legal matters by statute of limitations, financial exposure, and coverage risk.',
    strategistRule: 'Escalate to Strategist when legal matter intersects with billing fraud risk, systemic compliance failure, or C-suite liability.'
  },

  // ════════════════════════════════════════════════
  // HC-MEDICAL
  // ════════════════════════════════════════════════
  'hc-medical': {
    icon: '🩺',
    title: 'HC MEDICAL COMMAND',
    sub: 'Clinical Documentation · Medical Necessity · Quality Measures · CDI · Utilization',
    tabs: {
      dash: {
        patient: 'Clinical Portfolio',
        claim: 'CDI-Q2-2024',
        payer: 'All Payers',
        steps: [
          'Clinical Documentation Improvement (CDI) alert: 14 inpatient records missing principal diagnosis specificity. Query physicians before discharge to capture accurate DRG.',
          'Medical necessity denial rate at 19% for inpatient admissions. Identify top 3 DRGs with highest denial volume and review InterQual/Milliman criteria alignment.'
        ]
      },
      cdi: {
        patient: 'Dr. Patel',
        claim: 'CDI-0089',
        payer: 'Medicare',
        steps: [
          'Physician query required: patient admitted with "respiratory failure" — query to clarify acute hypoxic vs hypercapnic type for correct DRG assignment and CC/MCC capture.',
          'CC/MCC capture rate at 34% vs national benchmark of 52%. Review documentation templates, identify top 5 missed capture diagnoses, and implement CDI query workflow.'
        ]
      },
      utilization: {
        patient: 'UM Committee',
        claim: 'UM-0334',
        payer: 'Aetna',
        steps: [
          'Concurrent review denial: Aetna downcoding inpatient stay to observation for total knee replacement. Prepare peer-to-peer appeal with InterQual criteria and surgeon documentation.',
          'Length of stay (LOS) outlier identified: patient at 8 days vs 3.2 geometric mean LOS for DRG 470. Review discharge barriers, social work involvement, and payer authorization status.'
        ]
      },
      quality: {
        patient: 'Quality Team',
        claim: 'HEDIS-2024',
        payer: 'CMS / NCQA',
        steps: [
          'HEDIS measure gap: HbA1c testing rate at 71% vs 80% target for diabetic patients. Identify untested patients, trigger outreach campaign, and close gaps before measurement period ends.',
          'CMS Star Rating at risk: care transitions measure below 3-star threshold. Review discharge follow-up rates, 30-day readmission patterns, and care coordination gaps.'
        ]
      },
      ai: {
        patient: 'Portfolio',
        claim: 'ALL',
        payer: 'All Payers',
        steps: [
          'Run clinical intelligence brief: CDI gaps, medical necessity denial patterns, quality measure performance, and DRG optimization opportunities ranked by revenue impact.',
          'Generate CMO-ready summary: top 3 clinical documentation risks, physician query priorities, and quality improvement initiatives with deadline and owner.'
        ]
      }
    },
    defaultClient: {
      patient: 'Dr. Patel — Inpatient',
      claim: 'CDI-0089',
      payer: 'Medicare',
      denial: 'Medical Necessity',
      cpt: 'DRG 177',
      amount: '$8,400',
      issue: 'Inpatient admission denied — medical necessity not established in documentation. Peer-to-peer appeal window closes in 72 hours.'
    },
    completedTask: { label: 'CDI gaps identified', sub: 'DRG queries · CC/MCC · Med necessity · LOS outliers' },
    urgentTask: {
      title: 'P2P appeal — 72hr clinical window',
      meta: 'CDI-0089 · DRG 177 · Medicare · $8,400',
      deadline: '72hr peer-to-peer window — missed = automatic denial uphold',
      instructions: 'Physician to call Medicare peer-to-peer line, prepare InterQual criteria documentation, have clinical notes ready.'
    },
    bncaRule: 'Run BNCA first to identify the highest-impact CDI gap or medical necessity denial by DRG value and deadline.',
    strategistRule: 'Escalate to Strategist when medical necessity denial pattern is systemic across a service line, or quality measure failure triggers payer penalty or CMS action.'
  },

  // ════════════════════════════════════════════════
  // HC-OPERATIONS
  // ════════════════════════════════════════════════
  'hc-operations': {
    icon: '⚙️',
    title: 'HC OPERATIONS COMMAND',
    sub: 'Scheduling · Capacity · Workflow · Staffing · Patient Flow · Throughput',
    tabs: {
      dash: {
        patient: 'Operations Portfolio',
        claim: 'OPS-Q2-2024',
        payer: 'Internal / Admin',
        steps: [
          'Patient throughput down 14% vs last quarter — average wait time at 47 minutes vs 28-minute target. Identify top 3 bottlenecks in patient flow and draft improvement plan.',
          'Provider schedule utilization at 71% vs 85% target — 290 unfilled appointment slots per week. Analyze no-show rate, cancellation patterns, and overbooking strategy.'
        ]
      },
      scheduling: {
        patient: 'Scheduling Dept',
        claim: 'SCHED-0089',
        payer: 'All Payers',
        steps: [
          'No-show rate at 18% — $22K in lost revenue per month. Identify highest no-show patient segments, implement reminder protocol, and test overbooking model for high-risk slots.',
          'New provider onboarding in 30 days — build template schedule, set up payer credentialing timeline, and ensure EHR access and billing enrollment are completed before first patient day.'
        ]
      },
      capacity: {
        patient: 'Facility Team',
        claim: 'CAP-2024-07',
        payer: 'Internal',
        steps: [
          'Exam room utilization at 58% — identify peak demand hours, room turnover delays, and staffing misalignment causing capacity waste.',
          'Projected 20% patient volume increase in Q3. Assess whether current staffing model, physical space, and EHR capacity can absorb growth without quality or compliance impact.'
        ]
      },
      staffing: {
        patient: 'HR / Operations',
        claim: 'STAFF-2024-Q2',
        payer: 'Internal',
        steps: [
          'MA vacancy rate at 25% — 3 open positions unfilled for 60+ days. Calculate revenue impact of unfilled roles, identify temp agency vs hiring timeline, and assess overtime exposure.',
          'Provider productivity gap: 2 physicians at 80% of wRVU target for 3 consecutive months. Assess panel size, scheduling template, documentation time burden, and support staff ratio.'
        ]
      },
      ai: {
        patient: 'Portfolio',
        claim: 'ALL',
        payer: 'Internal',
        steps: [
          'Run operations intelligence brief: throughput gaps, scheduling efficiency, capacity utilization, and staffing risks ranked by revenue and patient experience impact.',
          'Generate COO-ready summary: top 3 operational bottlenecks, root causes, improvement owners, and 60-day target metrics.'
        ]
      }
    },
    defaultClient: {
      patient: 'Operations Portfolio',
      claim: 'OPS-Q2-2024',
      payer: 'Internal / Admin',
      denial: 'Throughput Gap',
      cpt: 'N/A',
      amount: '$22,000/mo',
      issue: 'No-show rate at 18% — $22K/month in lost revenue. Patient wait time at 47 minutes. Provider schedule utilization at 71%.'
    },
    completedTask: { label: 'Operations baseline assessed', sub: 'Throughput · Schedule · Capacity · Staffing gaps' },
    urgentTask: {
      title: 'No-show protocol — implement this week',
      meta: 'OPS-Q2-2024 · 18% no-show rate · $22K/mo revenue loss',
      deadline: 'Each week of delay = $5,500 in preventable lost revenue',
      instructions: 'Activate 48hr reminder calls, identify top no-show patients, build overbooking model for high-risk slots.'
    },
    bncaRule: 'Run BNCA first to identify the single highest-impact operational issue by revenue loss or patient experience score.',
    strategistRule: 'Escalate to Strategist when operational gaps are causing billing failures, compliance risk, or require capital investment decisions.'
  },

  // ════════════════════════════════════════════════
  // HC-PHARMACY
  // ════════════════════════════════════════════════
  'hc-pharmacy': {
    icon: '💊',
    title: 'HC PHARMACY COMMAND',
    sub: '340B · Drug Procurement · Prior Auth · Formulary · Compliance · Revenue',
    tabs: {
      dash: {
        patient: 'Pharmacy Portfolio',
        claim: 'PHARM-Q2-2024',
        payer: 'HRSA / PBMs',
        steps: [
          '340B program integrity audit scheduled — HRSA requires patient eligibility documentation for 100% of 340B-purchased drugs dispensed in last 6 months. Begin record pull immediately.',
          'Pharmacy benefit manager (PBM) audit flag: dispense rate on high-cost specialty drug exceeds benchmark by 40%. Identify prescribing pattern, formulary alternatives, and prior auth compliance.'
        ]
      },
      b340: {
        patient: '340B Program',
        claim: '340B-AUDIT-2024',
        payer: 'HRSA',
        steps: [
          '340B duplicate discount risk detected: same prescription dispensed via 340B and billed to Medicaid fee-for-service — potential repayment liability. Pull carve-in/carve-out records and assess exposure.',
          'Contract pharmacy agreement with Walgreens requires annual recertification. Verify OPAIS registration is current, dispense data reconciliation is complete, and audit trail is maintained.'
        ]
      },
      priorauth: {
        patient: 'Maria Santos',
        claim: 'RX-AUTH-0089',
        payer: 'BlueCross PBM',
        steps: [
          'Prior auth denied for specialty biologic — step therapy requirement not met. Document clinical failure of required first-line agents and submit exception request with physician letter.',
          'Patient assistance program (PAP) eligibility identified for $8,400/month specialty drug. Complete manufacturer application, assign pharmacy coordinator, and track enrollment status.'
        ]
      },
      compliance: {
        patient: 'Pharmacy Dept',
        claim: 'DEA-COMP-2024',
        payer: 'DEA / State Board',
        steps: [
          'DEA Schedule II controlled substance log discrepancy identified — 3 unit variance in oxycodone inventory. Conduct immediate reconciliation, document resolution, and assess reporting requirements.',
          'State pharmacy board inspection due in 30 days. Review license renewals, pharmacist-to-tech ratio compliance, and temperature log documentation for all refrigerated medications.'
        ]
      },
      ai: {
        patient: 'Portfolio',
        claim: 'ALL',
        payer: 'All Payers / HRSA',
        steps: [
          'Run pharmacy intelligence brief: 340B compliance gaps, PBM audit risks, prior auth denial patterns, and drug cost optimization opportunities ranked by financial impact.',
          'Generate pharmacy director summary: top 3 compliance risks, 340B program integrity status, and formulary management opportunities with estimated savings.'
        ]
      }
    },
    defaultClient: {
      patient: '340B Program',
      claim: '340B-AUDIT-2024',
      payer: 'HRSA',
      denial: '340B Audit',
      cpt: 'N/A',
      amount: '$85,000',
      issue: 'HRSA 340B audit scheduled — potential duplicate discount liability of $85K identified. Record pull required within 14 days.'
    },
    completedTask: { label: '340B risk assessment completed', sub: 'Duplicate discount · PBM audit · DEA variance · Auth denials' },
    urgentTask: {
      title: '340B record pull — 14-day window',
      meta: '340B-AUDIT-2024 · HRSA Audit · $85K exposure',
      deadline: '14-day HRSA response window — non-response = program termination risk',
      instructions: 'Pull 6 months of 340B dispense records, verify patient eligibility for each, reconcile with Medicaid exclusion files.'
    },
    bncaRule: 'Run BNCA first to identify the highest-risk pharmacy compliance or revenue issue before any escalation.',
    strategistRule: 'Escalate to Strategist when 340B program integrity finding threatens program eligibility, or DEA discrepancy triggers mandatory reporting.'
  },

  // ════════════════════════════════════════════════
  // HC-TAXPREP
  // ════════════════════════════════════════════════
  'hc-taxprep': {
    icon: '📊',
    title: 'HC TAX PREP COMMAND',
    sub: 'Form 990 · Tax-Exempt Status · Unrelated Business Income · Payroll Tax · Provider Compensation',
    tabs: {
      dash: {
        patient: 'Tax Portfolio',
        claim: 'TAX-FY2024',
        payer: 'IRS / State Revenue',
        steps: [
          'Form 990 filing deadline in 45 days — Schedule H (community benefit) data incomplete. Pull charity care cost, community health improvement expense, and research investment figures.',
          'Unrelated business income (UBI) from facility rental and parking revenue flagged — may trigger UBIT. Calculate net UBI, assess $1,000 threshold, and determine Form 990-T requirement.'
        ]
      },
      form990: {
        patient: 'Finance / Tax',
        claim: '990-FY2024',
        payer: 'IRS',
        steps: [
          'Schedule J compensation review required: 5 highest-paid employees must be disclosed. Pull W-2 data, include deferred compensation and benefits, and verify against board-approved compensation policy.',
          'Schedule L transactions with interested persons flagged: board member company received $85K contract. Document fair market value determination and board conflict of interest disclosure process.'
        ]
      },
      compensation: {
        patient: 'Provider Contracts',
        claim: 'COMP-2024-Q2',
        payer: 'IRS / Stark Law',
        steps: [
          'Physician compensation above 75th percentile MGMA benchmark — Stark Law and IRS intermediate sanctions exposure. Obtain independent FMV appraisal and document commercial reasonableness.',
          'New provider employment agreement includes productivity bonus — verify RVU threshold and rate comply with Stark safe harbor and document board approval of compensation methodology.'
        ]
      },
      payroll: {
        patient: 'Payroll / HR',
        claim: 'PR-TAX-Q2',
        payer: 'IRS / State',
        steps: [
          'Payroll tax deposit missed for pay period ending 6/30 — 2% FTD penalty accumulating. Make immediate deposit, calculate penalty, and review payroll calendar for remaining year.',
          'Worker classification audit risk: 3 independent contractors performing duties similar to employees. Assess IRS 20-factor test, calculate reclassification payroll tax exposure, and review agreements.'
        ]
      },
      ai: {
        patient: 'Portfolio',
        claim: 'ALL',
        payer: 'IRS / State',
        steps: [
          'Run tax intelligence brief: Form 990 gaps, UBIT exposure, compensation compliance, payroll tax risks, and tax-exempt status threats ranked by IRS scrutiny level.',
          'Generate CFO-ready tax summary: top 3 tax risks, filing deadlines, estimated penalty exposure, and recommended actions with CPA coordination points.'
        ]
      }
    },
    defaultClient: {
      patient: 'Health System',
      claim: 'TAX-FY2024',
      payer: 'IRS',
      denial: 'Form 990 Gap',
      cpt: 'N/A',
      amount: '$42,000',
      issue: 'Form 990 Schedule H community benefit data incomplete — $42K in unreported charity care identified. Filing deadline in 45 days.'
    },
    completedTask: { label: 'Tax filing inventory completed', sub: 'Form 990 · UBIT · Compensation · Payroll tax gaps' },
    urgentTask: {
      title: 'Form 990 filing — 45-day deadline',
      meta: 'TAX-FY2024 · IRS Form 990 · $42K charity care gap',
      deadline: '45-day IRS filing deadline — late filing penalty $20/day up to $10,000',
      instructions: 'Complete Schedule H data pull, reconcile charity care figures, submit to CPA for review before filing.'
    },
    bncaRule: 'Run BNCA first to identify the highest-risk tax exposure item before engaging external CPA or legal counsel.',
    strategistRule: 'Escalate to Strategist when tax-exempt status is threatened, Stark Law compensation issue is identified, or IRS audit notice is received.'
  },

  // ════════════════════════════════════════════════
  // HC-VENDORS
  // ════════════════════════════════════════════════
  'hc-vendors': {
    icon: '🤝',
    title: 'HC VENDORS COMMAND',
    sub: 'Vendor Management · Contracts · BAAs · Performance · Procurement · Risk',
    tabs: {
      dash: {
        patient: 'Vendor Portfolio',
        claim: 'VEND-Q2-2024',
        payer: 'Procurement / Legal',
        steps: [
          '3 vendor contracts expiring within 60 days — EHR, billing clearinghouse, and lab courier. Initiate renewal review, compare alternatives, and confirm BAA continuity for PHI-handling vendors.',
          'Vendor performance scorecard: billing clearinghouse claim rejection rate at 8.4% vs 2% SLA. Issue formal cure notice, calculate SLA penalty credits, and evaluate replacement vendors.'
        ]
      },
      contracts: {
        patient: 'Admin / Legal',
        claim: 'VEND-CONTRACT-07',
        payer: 'EHR Vendor',
        steps: [
          'EHR vendor contract renewal — identify auto-renewal clause, price escalation terms, data portability rights, and termination notice window before countersigning.',
          'New medical billing outsourcing contract — review performance guarantees, audit rights, HIPAA liability allocation, and sub-contractor disclosure requirements before execution.'
        ]
      },
      baa: {
        patient: 'Compliance / Legal',
        claim: 'BAA-AUDIT-2024',
        payer: 'HHS OCR',
        steps: [
          'BAA inventory audit: 12 active vendors handling PHI — 4 have expired or missing BAAs. Execute updated BAAs immediately; failure to maintain = HIPAA violation exposure.',
          'Cloud storage vendor added without BAA — PHI exposure assessment required. Determine data scope, execute BAA retroactively or migrate data, and document incident for compliance log.'
        ]
      },
      performance: {
        patient: 'Operations / Finance',
        claim: 'VEND-PERF-Q2',
        payer: 'Clearinghouse Vendor',
        steps: [
          'Clearinghouse ERA posting failure for 3 consecutive days — $18K in unposted remittances. Escalate to vendor account manager, implement manual posting workaround, and calculate financial impact.',
          'Lab courier missed 14 pickups in 30 days — critical results delayed, patient safety risk identified. Issue formal breach notice, assess contract termination rights, and identify backup courier.'
        ]
      },
      ai: {
        patient: 'Portfolio',
        claim: 'ALL',
        payer: 'All Vendors',
        steps: [
          'Run vendor intelligence brief: expiring contracts, BAA gaps, performance SLA breaches, and procurement risks ranked by operational and compliance impact.',
          'Generate procurement summary: top 3 vendor risks, renewal priorities, estimated cost of vendor failure, and recommended contract actions.'
        ]
      }
    },
    defaultClient: {
      patient: 'Vendor Portfolio',
      claim: 'VEND-Q2-2024',
      payer: 'Clearinghouse Vendor',
      denial: 'SLA Breach',
      cpt: 'N/A',
      amount: '$18,000',
      issue: 'Clearinghouse ERA posting failure — $18K unposted remittances. Claim rejection rate 8.4% vs 2% SLA. Formal cure notice required.'
    },
    completedTask: { label: 'Vendor risk inventory completed', sub: 'BAA gaps · SLA breach · Expiring contracts · PHI risk' },
    urgentTask: {
      title: 'Cure notice — 5-day SLA window',
      meta: 'VEND-Q2-2024 · Clearinghouse · $18K unposted · 8.4% rejection rate',
      deadline: '5-day cure notice window — no response triggers contract termination rights',
      instructions: 'Issue written cure notice, document SLA breach, calculate penalty credits, identify replacement vendor options.'
    },
    bncaRule: 'Run BNCA first to rank vendor risks by operational impact, PHI exposure, and financial penalty.',
    strategistRule: 'Escalate to Strategist when vendor failure causes billing system outage, PHI breach, or requires board approval for contract termination.'
  }

};

/**
 * GUIDE TEXT BLOCKS (shared across all nodes)
 * ─────────────────────────────────────────────
 * Insert these into the Node Guide HTML panel.
 * Replace [BNCA_RULE] and [STRATEGIST_RULE] with
 * the values from NODE_CONFIGS[nodeId].bncaRule/strategistRule
 */
const GUIDE_SHARED = {
  bncaBox: (rule) => `Always start here. ${rule} Run before escalating anything.`,
  strategistBox: (rule) => `Only escalate when BNCA reveals a cross-domain issue. ${rule} Don't relay single-issue items.`,
  postStepLabel: 'STEPS COMPLETE — NEXT ACTIONS',
  postStepDesc: 'Both steps responded. Choose your escalation path based on what the analysis revealed:',
  intakeLabel: 'SET CLIENT MISSION',
  intakePlaceholders: {
    patient: 'e.g. Patient or Entity Name',
    claim: 'e.g. CLM-1042 or Case ID',
    payer: 'e.g. Aetna, CMS, IRS',
    denial: 'e.g. CO-4, Audit, Gap',
    cpt: 'e.g. 99213 or N/A',
    amount: 'e.g. $1,240',
    issue: 'e.g. Describe the denial reason, compliance gap, or operational issue...'
  }
};

// Export for use in node files
if (typeof module !== 'undefined') module.exports = { NODE_CONFIGS, GUIDE_SHARED };
// ═══════════════════════════════════════════════════════════════
// TSM GUIDED MISSION WORKFLOW ENGINE
// Drop this into healthcare/index.html before </body>
// ═══════════════════════════════════════════════════════════════

const GuidedMission = (function () {

  // ── PATIENT DATA LIBRARY ────────────────────────────────────
  // Each mission key maps to a patient scenario with fields
  // the EU must fill in or verify inside the HC node
  const PATIENT_DATA = {
    insurance: {
      patient: { name: 'Maria Santos', dob: '1978-04-12', id: 'BCBS-771-204-X', payer: 'BlueCross BlueShield', plan: 'PPO Gold' },
      claim: { cpt: '27447', desc: 'Total Knee Replacement', dos: '2025-05-18', amount: '$28,400', denial: 'CO-197', auth: 'WQ2024-8812' },
      objectives: {
        0: { // Confirm patient demographics
          node: 'billing',
          instruction: 'Verify the patient demographics below match what is on file in the billing system. Check DOB and Insurance ID for errors.',
          fields: [
            { label: 'Patient Name', value: 'Maria Santos', editable: false },
            { label: 'Date of Birth', value: '04/12/1978', editable: true, correct: '04/12/1978', hint: 'Verify DOB matches payer records' },
            { label: 'Insurance ID', value: 'BCBS-711-204-X', editable: true, correct: 'BCBS-771-204-X', hint: 'Check for transposition errors in ID' },
            { label: 'Payer', value: 'BlueCross BlueShield', editable: false },
          ],
          action: { label: 'Submit Correction', validates: true },
          success: 'Demographics corrected. DOB confirmed. Insurance ID transposition fixed (711→771). Resubmission queued.',
          learn: 'Always cross-reference the Insurance ID digit-by-digit against the payer portal. Transpositions are the #1 cause of CO-4 rejections.'
        },
        1: { // Verify insurance ID formatting
          node: 'billing',
          instruction: 'The BlueCross ID format requires a specific prefix. Reformat the ID below to match BCBS requirements.',
          fields: [
            { label: 'Raw ID from registration', value: 'BCBS771204X', editable: true, correct: 'BCBS-771-204-X', hint: 'BCBS format: PREFIX-XXX-XXX-X (add hyphens)' },
            { label: 'Group Number', value: 'GRP-44892', editable: false },
          ],
          action: { label: 'Validate Format', validates: true },
          success: 'ID reformatted to BCBS standard. Claim resubmitted with correct formatting.',
          learn: 'Each payer has a unique ID format. BCBS uses PREFIX-XXX-XXX-X. UHC uses 9-digit numeric. Aetna uses alpha-numeric with no hyphens. Always verify in the payer portal before submitting.'
        },
        2: { // Obtain prior auth
          node: 'denials',
          instruction: 'CPT 27447 (Total Knee Replacement) was denied CO-197 — auth not on file. Auth WQ2024-8812 EXISTS in the payer portal. Select the correct resolution path.',
          fields: [
            { label: 'Denial Code', value: 'CO-197', editable: false },
            { label: 'CPT Code', value: '27447 — Total Knee Replacement', editable: false },
            { label: 'Auth Reference', value: 'WQ2024-8812', editable: false },
          ],
          choices: [
            { label: 'File a formal clinical appeal', correct: false, reason: 'Incorrect. CO-197 with an existing auth is an administrative error, not a clinical denial. A formal appeal wastes time.' },
            { label: 'Submit corrected claim with auth in FL63', correct: true, reason: 'Correct. CO-197 with auth on file = administrative fix only. Add auth WQ2024-8812 to Box 23 (CMS-1500) or Loop 2300 REF*G1 (837P) and resubmit.' },
            { label: 'Write off as contractual adjustment', correct: false, reason: 'Incorrect. Never write off a CO-197 when the auth exists. This is recoverable revenue.' },
            { label: 'Request peer-to-peer with medical director', correct: false, reason: 'Incorrect. Peer-to-peer is for clinical necessity disputes. Auth already approved the procedure.' },
          ],
          success: 'Correct. Corrected claim submitted with auth WQ2024-8812 in FL63. Expected resolution: 5–7 business days.',
          learn: 'CO-197 = Prior auth not on file. If auth EXISTS, always submit a corrected claim — not an appeal. If auth was NEVER obtained, then you need retro auth or a formal appeal with clinical documentation.'
        },
        3: { // Run eligibility check
          node: 'coding',
          instruction: 'Run a 271 eligibility check for Maria Santos. Review the response fields below and identify any coverage issues.',
          fields: [
            { label: 'Coverage Status', value: 'ACTIVE', editable: false },
            { label: 'Plan Type', value: 'PPO Gold', editable: false },
            { label: 'Deductible Met', value: 'YES — $1,500 / $1,500', editable: false },
            { label: 'Copay', value: '$35 specialist', editable: false },
            { label: 'Out-of-Pocket Max', value: '$4,200 remaining', editable: false },
            { label: 'Auth Required for Surgery?', value: '', editable: true, correct: 'YES', hint: 'Check the PPO Gold plan documents for surgical auth requirements' },
          ],
          action: { label: 'Submit 271 Review', validates: true },
          success: '271 response confirmed. Coverage active. Auth required for CPT 27447 confirmed — this validates the CO-197 correction approach.',
          learn: '271 eligibility responses tell you coverage status, benefits, and auth requirements. Always run a 271 BEFORE the date of service. A 270/271 transaction takes seconds and prevents $28K denials.'
        },
        4: { // Flag intake errors
          node: 'payments',
          instruction: 'Review the registration intake log below. Flag any errors that need front desk correction.',
          fields: [
            { label: 'Registration Date', value: '2025-05-15', editable: false },
            { label: 'Insurance ID Entered', value: 'BCBS-711-204-X', editable: false },
            { label: 'DOB Entered', value: '04/12/1978', editable: false },
            { label: 'Auth Captured in System?', value: 'NO', editable: false },
            { label: 'Errors to Flag', value: '', editable: true, correct: 'Insurance ID transposition; Auth number not captured at intake', hint: 'List ALL errors found in this registration' },
          ],
          action: { label: 'Submit Error Report', validates: true },
          success: '3 intake errors flagged and sent to front desk correction queue. Process improvement note added.',
          learn: 'Intake errors caught BEFORE claim submission save days of rework. Build a pre-submission checklist: ID format check, auth capture, DOB verification, COB question. 15 minutes at intake prevents 15 hours of appeals.'
        }
      }
    },

    compliance: {
      patient: { name: 'Maria Santos', dob: '1978-04-12', id: 'BCBS-771-204-X', payer: 'BlueCross BlueShield', plan: 'PPO Gold' },
      claim: { cpt: '27447', desc: 'Total Knee Replacement', dos: '2025-05-18', amount: '$28,400', denial: 'CO-197', auth: 'WQ2024-8812' },
      objectives: {
        0: { node: 'compliance', instruction: 'Review the OIG compliance alert. A documentation gap has been flagged for Level 4/5 E/M visits. Identify the required corrective action.', fields: [{ label: 'Alert Type', value: 'OIG Documentation Gap', editable: false }, { label: 'Affected CPTs', value: '99214, 99215', editable: false }, { label: 'Claims Flagged', value: '31', editable: false }, { label: 'Corrective Action', value: '', editable: true, correct: 'Request provider addendum and re-audit affected claims', hint: 'What is the standard corrective action for documentation gaps?' }], action: { label: 'Submit Corrective Plan', validates: true }, success: 'Corrective action plan submitted. Provider addendum requested for 31 claims.', learn: 'OIG audit triggers require immediate documentation review. Addendums must be completed within 30 days to avoid recoupment.' },
        1: { node: 'compliance', instruction: 'A HIPAA access log review flagged an unauthorized record access. Complete the breach assessment fields.', fields: [{ label: 'Record Accessed', value: 'Patient #4421 — unauthorized view', editable: false }, { label: 'Access Date', value: '2025-05-17', editable: false }, { label: 'Staff ID', value: 'EMP-2291', editable: false }, { label: 'Breach Classification', value: '', editable: true, correct: 'Reportable — notify Privacy Officer within 60 days', hint: 'Unauthorized PHI access classification?' }], action: { label: 'Submit Breach Report', validates: true }, success: 'Breach report filed. Privacy Officer notified. 60-day HHS reporting window started.', learn: 'Any unauthorized PHI access must be assessed under the HIPAA Breach Notification Rule. If no low-probability exception applies, it is reportable to HHS within 60 days.' }
      }
    },
    insurance: {
      patient: { name: 'Maria Santos', dob: '1978-04-12', id: 'BCBS-771-204-X', payer: 'BlueCross BlueShield', plan: 'PPO Gold' },
      claim: { cpt: '27447', desc: 'Total Knee Replacement', dos: '2025-05-18', amount: '$28,400', denial: 'CO-197', auth: 'WQ2024-8812' },
      objectives: {
        0: { node: 'insurance', instruction: 'Run eligibility verification for the patient below. Confirm active coverage and auth requirements.', fields: [{ label: 'Patient', value: 'Maria Santos', editable: false }, { label: 'Payer', value: 'BlueCross BlueShield', editable: false }, { label: 'Coverage Status', value: '', editable: true, correct: 'ACTIVE', hint: 'Run 270/271 and confirm status' }, { label: 'Auth Required', value: '', editable: true, correct: 'YES — CPT 27447 requires auth', hint: 'Check plan documents for surgical auth requirement' }], action: { label: 'Submit Eligibility Verification', validates: true }, success: 'Eligibility confirmed. Coverage active. Auth requirement flagged for CPT 27447.', learn: 'Always run a 270/271 eligibility check before DOS. Auth requirements vary by plan and CPT. A missed auth = CO-197 denial.' },
        1: { node: 'insurance', instruction: 'Prior auth WQ2024-8812 is expiring in 3 days. Complete the renewal request fields.', fields: [{ label: 'Auth Number', value: 'WQ2024-8812', editable: false }, { label: 'Expiration Date', value: '2025-05-21', editable: false }, { label: 'Renewal CPT', value: '27447', editable: false }, { label: 'Clinical Justification', value: '', editable: true, correct: 'Medical necessity confirmed — surgical proceed order on file', hint: 'What clinical documentation supports renewal?' }], action: { label: 'Submit Auth Renewal', validates: true }, success: 'Auth renewal submitted. New auth valid through 2025-08-21.', learn: 'Track auth expiration dates proactively. Renew at least 5 business days before expiration to avoid service interruption.' }
      }
    },
    financial: {
      patient: { name: 'Maria Santos', dob: '1978-04-12', id: 'BCBS-771-204-X', payer: 'BlueCross BlueShield', plan: 'PPO Gold' },
      claim: { cpt: '27447', desc: 'Total Knee Replacement', dos: '2025-05-18', amount: '$28,400', denial: 'CO-197', auth: 'WQ2024-8812' },
      objectives: {
        0: { node: 'financial', instruction: 'Review the AR aging report. Identify claims exceeding 90-day threshold requiring escalation.', fields: [{ label: '0-30 Days', value: '$142,000', editable: false }, { label: '31-60 Days', value: '$88,000', editable: false }, { label: '61-90 Days', value: '$54,000', editable: false }, { label: '90+ Days', value: '$31,000', editable: false }, { label: 'Escalation Action', value: '', editable: true, correct: 'Escalate 90+ bucket to collections and appeal review', hint: 'What is the standard action for 90+ day AR?' }], action: { label: 'Submit AR Action Plan', validates: true }, success: 'AR escalation submitted. 90+ day claims flagged for collections and appeal review.', learn: 'Claims beyond 90 days have significantly lower recovery rates. Establish a weekly AR sweep and escalate anything over 60 days proactively.' },
        1: { node: 'financial', instruction: 'A $28,400 claim has an underpayment variance. Calculate the correct expected reimbursement.', fields: [{ label: 'Billed Amount', value: '$28,400', editable: false }, { label: 'Contracted Rate', value: '62%', editable: false }, { label: 'Paid Amount', value: '$14,200', editable: false }, { label: 'Expected Payment', value: '', editable: true, correct: '$17,608', hint: '$28,400 x 62% = ?' }], action: { label: 'Submit Underpayment Dispute', validates: true }, success: 'Underpayment dispute filed. Expected recovery: $3,408.', learn: 'Always verify payments against your contracted fee schedule. Payers underpay 3-7% of claims on average. Systematic underpayment audits recover significant revenue.' }
      }
    },
    legal: {
      patient: { name: 'Maria Santos', dob: '1978-04-12', id: 'BCBS-771-204-X', payer: 'BlueCross BlueShield', plan: 'PPO Gold' },
      claim: { cpt: '27447', desc: 'Total Knee Replacement', dos: '2025-05-18', amount: '$28,400', denial: 'CO-197', auth: 'WQ2024-8812' },
      objectives: {
        0: { node: 'legal', instruction: 'A patient has submitted a records request under HIPAA Right of Access. Complete the response checklist.', fields: [{ label: 'Request Date', value: '2025-05-10', editable: false }, { label: 'Response Deadline', value: '2025-06-09 (30 days)', editable: false }, { label: 'Records Scope', value: 'All treatment records 2023-2025', editable: false }, { label: 'Response Action', value: '', editable: true, correct: 'Release records via secure portal within 30 days', hint: 'HIPAA Right of Access standard response?' }], action: { label: 'Initiate Records Release', validates: true }, success: 'Records release initiated. Patient notified. 30-day compliance window met.', learn: 'HIPAA Right of Access requires response within 30 days (extendable to 60 with notice). Failure to respond is an OCR violation with fines up to $50,000 per violation.' },
        1: { node: 'legal', instruction: 'Review the payer contract renewal clause. Identify the rate change and termination notice requirement.', fields: [{ label: 'Current Rate', value: '62% of billed charges', editable: false }, { label: 'Proposed Rate', value: '59% of billed charges', editable: false }, { label: 'Rate Change Impact', value: '', editable: true, correct: '-$3,408 per $28,400 claim average', hint: 'Calculate the revenue impact of a 3% rate reduction' }, { label: 'Termination Notice Required', value: '', editable: true, correct: '90 days written notice', hint: 'Standard payer contract termination window?' }], action: { label: 'Submit Contract Review', validates: true }, success: 'Contract review complete. Rate reduction impact documented. Legal notified of termination window.', learn: 'Always model rate change impacts before signing contract amendments. A 3% reduction on high-volume payers can represent hundreds of thousands in annual revenue loss.' }
      }
    },
    medical: {
      patient: { name: 'Maria Santos', dob: '1978-04-12', id: 'BCBS-771-204-X', payer: 'BlueCross BlueShield', plan: 'PPO Gold' },
      claim: { cpt: '27447', desc: 'Total Knee Replacement', dos: '2025-05-18', amount: '$28,400', denial: 'CO-197', auth: 'WQ2024-8812' },
      objectives: {
        0: { node: 'medical', instruction: 'Review the clinical documentation for CPT 27447. Identify missing elements required for medical necessity.', fields: [{ label: 'Diagnosis', value: 'M17.11 — Primary osteoarthritis, right knee', editable: false }, { label: 'Conservative Treatment Documented', value: 'NO', editable: false }, { label: 'X-Ray on File', value: 'YES', editable: false }, { label: 'Missing Element', value: '', editable: true, correct: 'Document 3+ months conservative treatment failure', hint: 'What does BCBS require before approving TKR?' }], action: { label: 'Flag Documentation Gap', validates: true }, success: 'Documentation gap flagged. Provider notified to addend conservative treatment history.', learn: 'Most payers require documented failure of conservative treatment (PT, injections, NSAIDs) for 3-6 months before approving joint replacement surgery. Missing this is the #1 cause of medical necessity denials.' },
        1: { node: 'medical', instruction: 'A peer-to-peer review is scheduled with the BCBS medical director. Prepare the clinical summary.', fields: [{ label: 'CPT', value: '27447 — Total Knee Replacement', editable: false }, { label: 'Diagnosis', value: 'M17.11', editable: false }, { label: 'Key Clinical Points', value: '', editable: true, correct: 'Failed PT x4 months, Kellgren-Lawrence Grade 4, BMI 28, no contraindications', hint: 'What are the 4 key clinical talking points for TKR approval?' }], action: { label: 'Submit Peer-to-Peer Prep', validates: true }, success: 'Peer-to-peer prep complete. Clinical summary sent to attending physician.', learn: 'Peer-to-peer reviews have a 60-70% reversal rate when properly prepared. Lead with objective findings (imaging grade, failed conservative treatment duration) not just diagnosis.' }
      }
    },
    pharmacy: {
      patient: { name: 'Maria Santos', dob: '1978-04-12', id: 'BCBS-771-204-X', payer: 'BlueCross BlueShield', plan: 'PPO Gold' },
      claim: { cpt: '27447', desc: 'Total Knee Replacement', dos: '2025-05-18', amount: '$28,400', denial: 'CO-197', auth: 'WQ2024-8812' },
      objectives: {
        0: { node: 'pharmacy', instruction: 'A step therapy denial was received for Celebrex. Review the formulary requirements and identify the required step.', fields: [{ label: 'Requested Drug', value: 'Celecoxib (Celebrex) 200mg', editable: false }, { label: 'Denial Reason', value: 'Step therapy — preferred agent required first', editable: false }, { label: 'Required Step 1 Drug', value: '', editable: true, correct: 'Naproxen 500mg x 30 days', hint: 'What is the BCBS PPO Gold step 1 NSAID?' }], action: { label: 'Submit Step Therapy Response', validates: true }, success: 'Step therapy requirement documented. Naproxen prescribed as step 1. Celebrex auth submitted for step 2.', learn: 'Step therapy protocols require trying preferred (generic) agents before brand-name drugs. Always check the payer formulary before prescribing to avoid step therapy denials.' },
        1: { node: 'pharmacy', instruction: 'Post-surgical medication reconciliation for CPT 27447. Verify no contraindications in the current med list.', fields: [{ label: 'Current Meds', value: 'Lisinopril 10mg, Metformin 500mg', editable: false }, { label: 'Planned Post-Op', value: 'Oxycodone 5mg, Aspirin 81mg, Celebrex 200mg', editable: false }, { label: 'Contraindication Found', value: '', editable: true, correct: 'Celebrex + Lisinopril — monitor BP; NSAIDs reduce ACE inhibitor efficacy', hint: 'Check NSAID interactions with antihypertensives' }], action: { label: 'Submit Med Reconciliation', validates: true }, success: 'Med reconciliation complete. Interaction flagged and sent to prescriber for review.', learn: 'NSAIDs like Celebrex can blunt the effect of ACE inhibitors like Lisinopril. Always run a drug interaction check during post-surgical med reconciliation.' }
      }
    },
    grants: {
      patient: { name: 'Maria Santos', dob: '1978-04-12', id: 'BCBS-771-204-X', payer: 'BlueCross BlueShield', plan: 'PPO Gold' },
      claim: { cpt: '27447', desc: 'Total Knee Replacement', dos: '2025-05-18', amount: '$28,400', denial: 'CO-197', auth: 'WQ2024-8812' },
      objectives: {
        0: { node: 'grants', instruction: 'A HRSA grant report is due in 5 days. Review the expenditure summary and identify any restricted fund violations.', fields: [{ label: 'Grant', value: 'HRSA Health Center Fund 2024', editable: false }, { label: 'Restricted Use', value: 'Primary care services only', editable: false }, { label: 'Flagged Expenditure', value: '$4,200 — Specialist referral coordination', editable: false }, { label: 'Violation?', value: '', editable: true, correct: 'YES — specialist coordination is outside primary care scope', hint: 'Does specialist referral coordination fall under primary care?' }], action: { label: 'Submit Compliance Review', validates: true }, success: 'Grant violation flagged. Finance notified. Expenditure reclassification initiated.', learn: 'HRSA grant funds have strict use restrictions. Expenditures outside the approved scope trigger recoupment and jeopardize future funding. Review monthly against grant terms.' },
        1: { node: 'grants', instruction: 'Complete the grant performance measure report for Q2 2025.', fields: [{ label: 'Patients Served', value: '1,847', editable: false }, { label: 'Target', value: '1,500', editable: false }, { label: 'Performance Status', value: '', editable: true, correct: 'EXCEEDS TARGET — 123% of goal', hint: '1,847 / 1,500 = ?' }, { label: 'Narrative Required', value: '', editable: true, correct: 'Expanded telehealth drove 23% above target', hint: 'What drove the patient volume increase?' }], action: { label: 'Submit Performance Report', validates: true }, success: 'Q2 performance report submitted. 123% target achievement documented.', learn: 'Grant performance reports must be submitted on time with accurate data. Exceeding targets strengthens future funding applications. Document what drove success.' }
      }
    },
    taxprep: {
      patient: { name: 'Maria Santos', dob: '1978-04-12', id: 'BCBS-771-204-X', payer: 'BlueCross BlueShield', plan: 'PPO Gold' },
      claim: { cpt: '27447', desc: 'Total Knee Replacement', dos: '2025-05-18', amount: '$28,400', denial: 'CO-197', auth: 'WQ2024-8812' },
      objectives: {
        0: { node: 'taxprep', instruction: 'Review the 1099 filing queue. Identify vendors requiring 1099-NEC for 2024.', fields: [{ label: 'Total Vendors Paid', value: '47', editable: false }, { label: '1099 Threshold', value: '$600', editable: false }, { label: 'Vendors Above Threshold', value: '12', editable: false }, { label: 'Filing Deadline', value: '', editable: true, correct: 'January 31, 2025', hint: 'What is the IRS 1099-NEC filing deadline?' }], action: { label: 'Submit 1099 Filing Plan', validates: true }, success: '1099 filing plan submitted. 12 vendors queued for NEC filing by January 31.', learn: '1099-NEC must be filed for any non-employee paid $600+ in a calendar year. Late filing penalties start at $50 per form. Always reconcile vendor payments in December.' },
        1: { node: 'taxprep', instruction: 'A W-9 is missing for vendor PO-2024-441. Complete the vendor onboarding checklist.', fields: [{ label: 'Vendor', value: 'Midwest Surgical Supplies LLC', editable: false }, { label: 'Amount Paid 2024', value: '$8,400', editable: false }, { label: 'W-9 on File', value: 'NO', editable: false }, { label: 'Action Required', value: '', editable: true, correct: 'Request W-9 immediately — backup withholding required if not received', hint: 'What is required when W-9 is missing for a paid vendor?' }], action: { label: 'Submit W-9 Request', validates: true }, success: 'W-9 request sent to Midwest Surgical Supplies. Backup withholding flag set pending receipt.', learn: 'Without a W-9, you must apply 24% backup withholding on future payments. Always collect W-9 before first payment, not after.' }
      }
    },
    vendors: {
      patient: { name: 'Maria Santos', dob: '1978-04-12', id: 'BCBS-771-204-X', payer: 'BlueCross BlueShield', plan: 'PPO Gold' },
      claim: { cpt: '27447', desc: 'Total Knee Replacement', dos: '2025-05-18', amount: '$28,400', denial: 'CO-197', auth: 'WQ2024-8812' },
      objectives: {
        0: { node: 'vendors', instruction: 'Review the vendor contract for Midwest Surgical Supplies. Identify the SLA breach and required action.', fields: [{ label: 'Contracted Delivery SLA', value: '48 hours', editable: false }, { label: 'Last Delivery', value: '72 hours (3 days late)', editable: false }, { label: 'SLA Breach Penalty', value: '2% credit per day', editable: false }, { label: 'Credit Due', value: '', editable: true, correct: '$168 (2% x $8,400 x 1 day breach)', hint: 'Calculate the SLA breach credit' }], action: { label: 'Submit SLA Breach Claim', validates: true }, success: 'SLA breach claim submitted. $168 credit applied to next invoice.', learn: 'Always enforce SLA breach penalties in vendor contracts. Letting violations slide signals that breaches are acceptable and creates ongoing supply chain risk.' },
        1: { node: 'vendors', instruction: 'A new vendor wants to onboard. Complete the vendor qualification checklist.', fields: [{ label: 'Vendor Name', value: 'MedSupply Direct LLC', editable: false }, { label: 'W-9 Received', value: 'YES', editable: false }, { label: 'COI on File', value: 'NO', editable: false }, { label: 'OIG Exclusion Check', value: '', editable: true, correct: 'REQUIRED before onboarding — check OIG exclusion database', hint: 'What federal check is required before onboarding any healthcare vendor?' }], action: { label: 'Submit Vendor Qualification', validates: true }, success: 'Vendor qualification flagged — COI missing, OIG check required before approval.', learn: 'Every healthcare vendor must be checked against the OIG exclusion database before onboarding. Using an excluded vendor puts your Medicare/Medicaid participation at risk.' }
      }
    },
    billing: {
      patient: { name: 'James Okafor', dob: '1962-09-03', id: 'UHC-887234109', payer: 'UnitedHealthcare', plan: 'Choice Plus' },
      claim: { cpt: '99213+36415', desc: 'Office Visit + Venipuncture', dos: '2025-05-20', amount: '$185', denial: 'CO-4', auth: 'N/A' },
      objectives: {
        0: { node: 'billing', instruction: 'Review the claim below. CO-4 (modifier conflict) was received. Identify the missing modifier.', fields: [{ label: 'CPT 1', value: '99213 — Office Visit', editable: false }, { label: 'CPT 2', value: '36415 — Venipuncture', editable: false }, { label: 'Missing Modifier on 99213', value: '', editable: true, correct: '-25', hint: 'E/M on same day as minor procedure requires which modifier?' }], action: { label: 'Apply Modifier & Resubmit', validates: true }, success: 'Modifier -25 applied to 99213. Corrected claim submitted. CO-4 resolved.', learn: 'Modifier -25 is required on an E/M code when billed same-day as a minor procedure (like venipuncture). It certifies the E/M was significant and separately identifiable from the procedure.' }
      }
    }
  };

  // ── STATE ────────────────────────────────────────────────────
  let _currentObjectiveId = null;
  let _currentMissionKey = null;
  let _overlay = null;

  // ── RENDER GUIDED PANEL ─────────────────────────────────────
  function showGuidedObjective(missionKey, objectiveId) {
    _currentMissionKey = missionKey;
    _currentObjectiveId = objectiveId;

    const mData = PATIENT_DATA[missionKey];
    if (!mData) { console.warn('[GuidedMission] No patient data for:', missionKey); return false; }

    const obj = mData.objectives[objectiveId];
    if (!obj) { console.warn('[GuidedMission] No guided objective for id:', objectiveId); return false; }

    // Build overlay
    if (_overlay) _overlay.remove();
    _overlay = document.createElement('div');
    _overlay.id = 'gm-overlay';
    _overlay.style.cssText = `
      position: fixed; inset: 0; background: rgba(0,6,15,0.85);
      z-index: 9999; display: flex; align-items: center; justify-content: center;
      font-family: 'Courier New', monospace; animation: gmFadeIn 0.2s ease;
    `;

    const panel = document.createElement('div');
    panel.style.cssText = `
      background: #071018; border: 1px solid rgba(0,200,150,0.3);
      border-radius: 8px; width: 620px; max-width: 95vw; max-height: 90vh;
      overflow-y: auto; padding: 28px 32px; position: relative;
    `;

    // Header
    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px">
        <div>
          <div style="font-size:8px;letter-spacing:3px;color:rgba(0,200,150,0.7);margin-bottom:6px">◈ GUIDED WORKFLOW — OBJECTIVE ${objectiveId + 1}</div>
          <div style="font-size:15px;color:#e8f0f8;font-weight:600">${_getPanelTitle(missionKey, objectiveId)}</div>
        </div>
        <button onclick="GuidedMission.close()" style="background:none;border:none;color:rgba(200,200,200,0.5);font-size:18px;cursor:pointer;padding:0;line-height:1">✕</button>
      </div>

      <div style="background:rgba(0,200,150,0.06);border:1px solid rgba(0,200,150,0.15);border-radius:5px;padding:14px 16px;margin-bottom:20px">
        <div style="font-size:8px;letter-spacing:2px;color:rgba(0,200,150,0.6);margin-bottom:6px">PATIENT FILE</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 20px;font-size:11px;color:#b0c4d8">
          <div><span style="color:rgba(150,180,200,0.6)">PATIENT: </span>${mData.patient.name}</div>
          <div><span style="color:rgba(150,180,200,0.6)">DOB: </span>${mData.patient.dob}</div>
          <div><span style="color:rgba(150,180,200,0.6)">PAYER: </span>${mData.patient.payer}</div>
          <div><span style="color:rgba(150,180,200,0.6)">PLAN: </span>${mData.patient.plan}</div>
          <div><span style="color:rgba(150,180,200,0.6)">CPT: </span>${mData.claim.cpt}</div>
          <div><span style="color:rgba(150,180,200,0.6)">DENIAL: </span><span style="color:#ff6b6b">${mData.claim.denial}</span></div>
        </div>
      </div>

      <div style="font-size:12px;color:#c8dce8;line-height:1.6;margin-bottom:20px;padding:0 2px">${obj.instruction}</div>

      <div id="gm-fields" style="margin-bottom:20px"></div>
      <div id="gm-choices" style="margin-bottom:20px"></div>
      <div id="gm-action" style="margin-bottom:16px"></div>
      <div id="gm-feedback" style="display:none;border-radius:5px;padding:14px 16px;margin-bottom:16px;font-size:11px;line-height:1.7"></div>
      <div id="gm-learn" style="display:none;background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.2);border-radius:5px;padding:14px 16px;margin-bottom:16px"></div>
      <div id="gm-complete" style="display:none;text-align:center;margin-top:8px">
        <button onclick="GuidedMission.complete()" style="background:rgba(0,200,150,0.15);border:1px solid rgba(0,200,150,0.4);color:#00c896;font-family:inherit;font-size:11px;letter-spacing:2px;padding:10px 28px;border-radius:4px;cursor:pointer">✓ MARK OBJECTIVE COMPLETE</button>
      </div>
    `;

    _overlay.appendChild(panel);
    document.body.appendChild(_overlay);

    // Inject CSS animation
    if (!document.getElementById('gm-style')) {
      const s = document.createElement('style');
      s.id = 'gm-style';
      s.textContent = `@keyframes gmFadeIn{from{opacity:0}to{opacity:1}} #gm-overlay input[type=text]{background:#0d1f30;border:1px solid rgba(100,150,200,0.3);border-radius:4px;color:#e8f0f8;font-family:inherit;font-size:11px;padding:7px 10px;width:100%;box-sizing:border-box;outline:none} #gm-overlay input[type=text]:focus{border-color:rgba(0,200,150,0.5)} #gm-overlay input[type=text].correct{border-color:#00c896;background:rgba(0,200,150,0.08)} #gm-overlay input[type=text].wrong{border-color:#ff6b6b;background:rgba(255,107,107,0.08)}`;
      document.head.appendChild(s);
    }

    // Render fields
    if (obj.fields) _renderFields(obj.fields, document.getElementById('gm-fields'));
    if (obj.choices) _renderChoices(obj.choices, document.getElementById('gm-choices'));
    if (obj.action) _renderAction(obj.action, document.getElementById('gm-action'));

    return true;
  }

  function _getPanelTitle(missionKey, objId) {
    const panel = window.panel;
    if (panel && panel.mission && panel.mission.objectives) {
      const o = panel.mission.objectives.find(x => x.id === objId);
      if (o) return o.label;
    }
    return 'Complete Objective';
  }

  function _renderFields(fields, container) {
    container.innerHTML = fields.map((f, i) => `
      <div style="margin-bottom:12px">
        <div style="font-size:9px;letter-spacing:1.5px;color:rgba(150,180,200,0.6);margin-bottom:5px">${f.label.toUpperCase()}</div>
        ${f.editable
          ? `<input type="text" id="gm-field-${i}" value="${f.value}" placeholder="${f.hint || ''}" data-correct="${f.correct || ''}" />`
          : `<div style="background:#0d1f30;border:1px solid rgba(60,80,100,0.3);border-radius:4px;padding:7px 10px;font-size:11px;color:#7090a8">${f.value}</div>`
        }
        ${f.hint && f.editable ? `<div style="font-size:9px;color:rgba(150,180,200,0.4);margin-top:3px">HINT: ${f.hint}</div>` : ''}
      </div>
    `).join('');
  }

  function _renderChoices(choices, container) {
    container.innerHTML = `<div style="font-size:9px;letter-spacing:1.5px;color:rgba(150,180,200,0.6);margin-bottom:10px">SELECT THE CORRECT ACTION:</div>` +
      choices.map((c, i) => `
        <div class="gm-choice" data-idx="${i}" data-correct="${c.correct}" data-reason="${c.reason.replace(/"/g, '&quot;')}"
          onclick="GuidedMission._pickChoice(this)"
          style="border:1px solid rgba(100,150,200,0.2);border-radius:5px;padding:11px 14px;margin-bottom:8px;cursor:pointer;font-size:11px;color:#c8dce8;transition:border-color 0.15s,background 0.15s">
          <span style="color:rgba(150,180,200,0.5);margin-right:8px">${String.fromCharCode(65 + i)}.</span>${c.label}
        </div>
      `).join('');
  }

  function _renderAction(action, container) {
    if (!action) return;
    container.innerHTML = `
      <button onclick="GuidedMission._validateFields()"
        style="background:rgba(0,130,255,0.12);border:1px solid rgba(0,130,255,0.3);color:#4db8ff;font-family:inherit;font-size:10px;letter-spacing:2px;padding:10px 24px;border-radius:4px;cursor:pointer;width:100%">
        ◈ ${action.label.toUpperCase()}
      </button>
    `;
  }

  // ── INTERACTION HANDLERS ─────────────────────────────────────
  function _pickChoice(el) {
    const mData = PATIENT_DATA[_currentMissionKey];
    const obj = mData.objectives[_currentObjectiveId];

    document.querySelectorAll('.gm-choice').forEach(c => {
      c.style.borderColor = 'rgba(100,150,200,0.2)';
      c.style.background = 'none';
      c.style.pointerEvents = 'none';
    });

    const isCorrect = el.dataset.correct === 'true';
    el.style.borderColor = isCorrect ? '#00c896' : '#ff6b6b';
    el.style.background = isCorrect ? 'rgba(0,200,150,0.08)' : 'rgba(255,107,107,0.08)';

    // Show correct answer if wrong
    if (!isCorrect) {
      document.querySelectorAll('.gm-choice').forEach(c => {
        if (c.dataset.correct === 'true') {
          c.style.borderColor = '#00c896';
          c.style.background = 'rgba(0,200,150,0.05)';
        }
      });
    }

    _showFeedback(isCorrect, el.dataset.reason, obj);
  }

  function _validateFields() {
    const mData = PATIENT_DATA[_currentMissionKey];
    const obj = mData.objectives[_currentObjectiveId];
    const editableFields = obj.fields.filter(f => f.editable);

    let allCorrect = true;
    editableFields.forEach((f, i) => {
      const globalIdx = obj.fields.indexOf(f);
      const input = document.getElementById('gm-field-' + globalIdx);
      if (!input) return;
      const val = input.value.trim();
      const isCorrect = f.correct && (val.toLowerCase() === f.correct.toLowerCase() || val.toLowerCase().includes(f.correct.toLowerCase().split(' ')[0]));
      input.classList.toggle('correct', !!isCorrect);
      input.classList.toggle('wrong', !isCorrect);
      if (!isCorrect) allCorrect = false;
    });

    _showFeedback(allCorrect, null, obj);
  }

  function _showFeedback(isCorrect, choiceReason, obj) {
    const fb = document.getElementById('gm-feedback');
    const learn = document.getElementById('gm-learn');
    const complete = document.getElementById('gm-complete');

    fb.style.display = 'block';
    fb.style.background = isCorrect ? 'rgba(0,200,150,0.08)' : 'rgba(255,107,107,0.08)';
    fb.style.border = `1px solid ${isCorrect ? 'rgba(0,200,150,0.3)' : 'rgba(255,107,107,0.3)'}`;
    fb.style.color = isCorrect ? '#00c896' : '#ff6b6b';
    fb.innerHTML = isCorrect
      ? `<strong>✓ CORRECT</strong> — ${obj.success}`
      : `<strong>✗ ${choiceReason || 'Not quite — check the highlighted fields above.'}</strong>`;

    if (isCorrect) {
      learn.style.display = 'block';
      learn.innerHTML = `<div style="font-size:8px;letter-spacing:2px;color:rgba(201,168,76,0.7);margin-bottom:6px">⚡ CLINICAL INTEL</div><div style="font-size:11px;color:#c8a84a;line-height:1.7">${obj.learn}</div>`;
      complete.style.display = 'block';
    }
  }

  function complete() {
    close();
    // Trigger the original panel completion
    const panelObj = window.panel;
    if (panelObj && typeof panelObj.completeObjective === 'function') {
      panelObj.completeObjective(_currentObjectiveId);
    } else if (typeof MissionBridge !== 'undefined') {
      MissionBridge.completeObjective(_currentObjectiveId, _currentMissionKey, -10);
    }
    // Update the checkbox visually
    const cb = document.querySelector(`[data-obj-id="${_currentObjectiveId}"]`);
    if (cb) { cb.checked = true; cb.dispatchEvent(new Event('change')); }
  }

  function close() {
    if (_overlay) { _overlay.remove(); _overlay = null; }
  }

  // ── INTERCEPT OBJECTIVE CLICKS ───────────────────────────────
  // Call this after MissionPanel.init() to wire up guided mode
  function init() {
    // Watch for objective checkboxes being clicked
    document.addEventListener('click', function (e) {
      const objEl = e.target.closest('[data-obj-id]');
      if (!objEl) return;

      const missionKey = (window.panel && window.panel.missionKey) || (MissionBridge && MissionBridge.get().missionKey);
      const objId = parseInt(objEl.dataset.objId);

      if (isNaN(objId) || !missionKey) return;

      const hasData = PATIENT_DATA[missionKey] && PATIENT_DATA[missionKey].objectives[objId];
      if (!hasData) return; // No guided data — let default behavior run

      e.preventDefault();
      e.stopImmediatePropagation();
      showGuidedObjective(missionKey, objId);
    }, true);

    // Also intercept the "LAUNCH X NODE" links in objectives
    document.addEventListener('click', function (e) {
      const link = e.target.closest('.obj-launch-link');
      if (!link) return;
      const missionKey = window.panel && window.panel.missionKey;
      const objId = parseInt(link.dataset.objId);
      if (isNaN(objId) || !missionKey) return;
      const hasData = PATIENT_DATA[missionKey] && PATIENT_DATA[missionKey].objectives[objId];
      if (!hasData) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      showGuidedObjective(missionKey, objId);
    }, true);

    console.log('[GuidedMission] Initialized ✓');
  }

  return { init, showGuidedObjective, close, complete, _pickChoice, _validateFields, getData: () => PATIENT_DATA };

})();

// ── AUTO-INIT ────────────────────────────────────────────────
window.addEventListener('load', function () {
  setTimeout(() => GuidedMission.init(), 800);
});
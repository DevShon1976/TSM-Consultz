// mlo-regulatory-context.js
// Regulatory grounding knowledge for pack-engine.html's AI calls.
// Load this alongside pack-configs.js, then splice it into the system
// prompt before it's handed to callAI(systemPrompt, userPrompt):
//
//   systemPrompt += '\n\n' + getRegulatoryContext(packKey, { includeAZ: true });
//
// CORE is always-on (universal vocabulary every pack benefits from).
// BY_PACK adds targeted rules only for the packs that actually touch them.
// AZ is opt-in via the includeAZ flag since it's a state-specific overlay.

const MLO_REGULATORY_CORE = `
REGULATORY QUICK-REFERENCE (apply when relevant to the file under review):
- RESPA (Reg X, CFPB): bans kickbacks/referral fees for settlement services; restricts escrow overages; standardizes settlement costs.
- TILA (Reg Z, CFPB): cost-of-credit disclosures, ad rules, Right of Rescission, loan originator compensation.
- ECOA (Reg B, CFPB): bars discrimination on protected classes; requires Notice of Adverse Action within strict timelines.
- FCRA (Reg V, FTC/CFPB): governs consumer credit reporting agencies; consumer access/dispute rights.
- FACTA (FCRA amendment): identity theft prevention, secure document disposal, Red Flags Rule.
- HMDA (Reg C, CFPB): LAR data used to detect predatory lending/redlining patterns.
- MAP Rule (Reg N, CFPB): bans deceptive/misleading mortgage advertising.
- HPA: governs PMI cancellation timing on conventional loans.
- GLBA: requires safeguarding of nonpublic personal information (Safeguards Rule, Privacy Rule).

KEY TERMS:
- PITI = Principal + Interest + Taxes + Insurance (full monthly housing obligation).
- Front-end ratio = PITI / gross monthly income. Back-end ratio = (PITI + recurring debts) / gross monthly income.
- QM (Qualified Mortgage): no negative amortization, no interest-only, term <=30yrs, points/fees <=3% -- carries safe-harbor protection.
- Non-QM/Subprime: for borrowers outside standard agency guidelines (credit, self-employment, high DTI).
- Par rate = base rate with zero points/credits. Discount points = prepaid interest, 1pt = 1% of loan amount, permanently buys down rate.
- YSP/Lender credit: lender credit toward closing costs in exchange for a higher note rate.

When a file under review implicates any of the above, name the specific regulation/rule by its letter or acronym rather than describing it generically.
`.trim();

const MLO_REGULATORY_AZ = `
ARIZONA (DIFI) STATE OVERLAY:
- Record retention: licensees must retain books/accounts/records 5 years from final entry or loan closing.
- Advertising: a sample of every AZ-targeted ad must be kept 2 years from last publication; ad must show company name, license number, and NMLS Unique Identifier.
- Licensing bar: felony conviction within 7 years disqualifies; fraud/breach-of-trust/dishonesty/money-laundering felonies are a permanent bar.
- Advance fees: cannot be collected (beyond bona fide third-party costs like appraisal/credit report) without a signed Advance Fee Agreement meeting AZ statutory form requirements.
`.trim();

const MLO_REGULATORY_BY_PACK = {
  'respa-rescue': `
RESPA SECTION 8/9 FOCUS:
- Section 8 (anti-kickback): paying a referral partner's overhead/marketing costs without a verified pro-rata fair-market-value exchange for actual services is a "thing of value" violation. Penalty: up to $10,000 and up to 1 year federal imprisonment per violation.
- Section 9 (title steering): a seller cannot condition a sale on use of a specific title company unless the seller pays 100% of both the owner's and lender's title insurance premiums. Penalty: treble damages (3x all title charges) to the buyer.
`.trim(),

  'trid-rescue': `
TRID TIMELINE & TOLERANCE FOCUS:
- 3-7-3 baseline: initial LE within 3 business days of application; >=7 business days between initial LE and closing; revised disclosures within 3 business days of a valid Changed Circumstance.
- Revised LE must also land >=4 business days before consummation.
- Lender-controlled fees (e.g. processing/origination) are Zero Tolerance -- any increase over the LE amount requires a cure/refund within 60 days of consummation, not just a "shop allowed" caveat.
`.trim(),

  'hmda-audit': `
HMDA / LAR FOCUS:
- Cross-check Loan Application Register fields for patterns consistent with redlining or predatory lending (denial rate disparities by geography/protected class, pricing disparities) rather than single-file issues.
`.trim(),

  'loan-denial': `
ECOA ADVERSE ACTION FOCUS:
- Absolute 30-day window from a completed application to notify the applicant of approval, counteroffer, or denial.
- Adverse Action notice must state specific denial reasons, or clearly disclose the applicant's right to request those reasons within 60 days.
`.trim(),

  'credit-event': `
FCRA/FACTA FOCUS:
- Confirm the consumer's access/dispute rights on any credit file data used in the decision were respected.
- Flag Red Flags Rule concerns (identity-theft indicators) on any credit event being analyzed.
`.trim(),

  'fraud-investigation': `
ASSET/RED-FLAG FOCUS:
- Large unseasoned deposits (no identifiable source, no paper trail, landing shortly before application) are an asset-seasoning red flag -- require a signed gift letter with source trail, or exclude the funds from qualifying reserves entirely.
- Submitting unverified/fraudulent assets to underwriting risks a SAFE Act civil penalty (up to $30,000+ per occurrence).
`.trim(),
};

function getRegulatoryContext(packKey, opts = {}) {
  const parts = [MLO_REGULATORY_CORE];
  if (MLO_REGULATORY_BY_PACK[packKey]) parts.push(MLO_REGULATORY_BY_PACK[packKey]);
  if (opts.includeAZ) parts.push(MLO_REGULATORY_AZ);
  return parts.join('\n\n');
}
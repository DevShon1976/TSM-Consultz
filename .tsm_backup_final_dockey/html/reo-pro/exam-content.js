// exam-content.js
// Exam prep content, organized by track. mlo-safe is fully populated.
// Add new tracks here later (e.g. "az-re-salesperson") once source
// material for that exam is available.

const EXAM_TRACKS = {
  "mlo-safe": {
    label: "SAFE MLO EXAM PREP",

    flashcards: [
      { front: "RESPA", back: "Real Estate Settlement Procedures Act (Reg X, CFPB). Bans kickbacks/referral fees, restricts escrow overages, standardizes settlement costs." },
      { front: "TILA", back: "Truth in Lending Act (Reg Z, CFPB). Cost-of-credit disclosures, ad rules, Right of Rescission, loan originator compensation." },
      { front: "ECOA", back: "Equal Credit Opportunity Act (Reg B, CFPB). Bars discrimination on protected classes; requires Notice of Adverse Action." },
      { front: "FCRA", back: "Fair Credit Reporting Act (Reg V, FTC/CFPB). Governs credit reporting agencies; consumer access/dispute rights." },
      { front: "FACTA", back: "Fair & Accurate Credit Transactions Act, amends FCRA. Identity theft prevention, secure document shredding, Red Flags Rule." },
      { front: "HMDA", back: "Home Mortgage Disclosure Act (Reg C, CFPB). LAR data used to identify predatory lending and redlining patterns." },
      { front: "MAP Rule", back: "Mortgage Acts and Practices Rule (Reg N, CFPB). Prohibits deceptive or misleading mortgage advertising." },
      { front: "HPA", back: "Homeowners Protection Act. Governs PMI cancellation rules on conventional loans." },
      { front: "GLBA", back: "Gramm-Leach-Bliley Act. Safeguards nonpublic personal information via the Safeguards Rule and Privacy Rule." },
      { front: "PITI", back: "Principal, Interest, Taxes, and Insurance, the full monthly housing obligation." },
      { front: "Front-end ratio", back: "PITI divided by gross monthly income." },
      { front: "Back-end ratio", back: "PITI plus long-term monthly debts, divided by gross monthly income." },
      { front: "Qualified Mortgage (QM)", back: "No negative amortization, no interest-only, term of 30 years or less, points/fees of 3% or less. Carries safe-harbor legal protection." },
      { front: "Non-QM / Subprime", back: "Loans for borrowers outside standard agency guidelines: credit issues, self-employment, or high debt ratios." },
      { front: "Par Rate", back: "The baseline interest rate with zero discount points or lender credits." },
      { front: "Discount Points", back: "Prepaid interest paid at closing to permanently lower the note rate. 1 point equals 1% of the loan amount." },
      { front: "YSP / Lender Credit", back: "A credit from the lender toward closing costs in exchange for the borrower accepting a higher rate." },
      { front: "AZ Record Retention", back: "Arizona mortgage licensees must retain books, accounts, and records for 5 years from the final entry or loan closing." },
      { front: "AZ Advertising Rule", back: "Every AZ-targeted ad sample must be kept 2 years from last publication, and must show company name, license number, and NMLS Unique Identifier." },
      { front: "AZ Felony Bar", back: "A felony conviction within 7 years disqualifies an AZ MLO applicant. Felonies involving fraud, breach of trust, dishonesty, or money laundering are a permanent bar." }
    ],

    scenarios: [
      {
        title: "Title Insurance Referral Check",
        description: "A seller insists they will only sell the house to the buyer if the buyer agrees to use Mesa Elite Title Services. The seller has an indirect ownership interest in this title firm.",
        isCompliant: false,
        violation: "RESPA Section 9 (Title Steering Violation)",
        correctAction: "Flag as non-compliant. A seller cannot condition a sale on use of a specific title company unless the seller pays 100% of both the owner's and lender's title insurance policies.",
        penalty: "Treble damages, 3x the cost of all title charges, as civil liability to the buyer."
      },
      {
        title: "Closing Disclosure Fee Tolerance Breach",
        description: "Comparing the final Closing Disclosure to the original Loan Estimate shows the lender-controlled processing fee increased by $250 at final settlement due to extra file handling.",
        isCompliant: false,
        violation: "Zero Tolerance Fee Violation",
        correctAction: "Identify the fee breach. Lender-controlled fees fall into the Zero Tolerance category. The lender must issue a cure or refund for the $250 overage within 60 days of consummation.",
        penalty: "Lender restitution penalty for the full variance amount."
      },
      {
        title: "Suspicious Deposit Verification",
        description: "A self-employed borrower provides two months of bank statements. A $15,000 cash deposit appears exactly 3 days before the application date with no identifiable source or paper trail.",
        isCompliant: false,
        violation: "Asset Seasoning / Potential Straw Buyer Fraud",
        correctAction: "Trigger a file freeze for asset verification. Require a signed gift letter with a source bank trail, or exclude the $15,000 entirely from qualifying reserves.",
        penalty: "Submitting unverified or fraudulent assets to underwriting risks a SAFE Act civil penalty of $30,000 or more per occurrence."
      },
      {
        title: "Record Storage Compliance Check",
        description: "An Arizona mortgage broker closes its physical office and migrates historical file archives to encrypted offline storage, scheduling auto-deletion 36 months after closing.",
        isCompliant: false,
        violation: "Arizona DIFI Record Retention Breach",
        correctAction: "Extend retention settings to 60 months. Arizona mandates a 5-year retention schedule for mortgage transaction logs and customer files.",
        penalty: "State administrative fines, civil penalties, or suspension of license permissions."
      }
    ],

    quiz: [
      { q: "A mortgage broker pays 50% of a referral partner's ad budget regardless of leads generated. This most likely violates:", choices: ["RESPA Section 8 (anti-kickback)", "TILA advertising rules", "ECOA adverse action rules", "HMDA reporting rules"], answer: 0, explain: "Covering a partner's overhead without a verified fair-market-value exchange for actual services is a thing-of-value violation, with fines up to $10,000 and up to 1 year imprisonment per violation." },
      { q: "Under TRID, what is the minimum number of business days between delivery of the initial Loan Estimate and closing?", choices: ["3", "4", "7", "10"], answer: 2, explain: "The 3-7-3 baseline requires at least 7 business days between initial LE delivery and consummation." },
      { q: "A valid Changed Circumstance occurs after the initial LE is sent. Within how many business days must the revised LE be issued?", choices: ["1", "3", "5", "7"], answer: 1, explain: "Revised disclosures must go out within 3 business days of a valid Changed Circumstance." },
      { q: "Under ECOA, what is the absolute window to notify an applicant of approval, counteroffer, or denial after a completed application?", choices: ["10 days", "20 days", "30 days", "45 days"], answer: 2, explain: "ECOA requires notice within 30 days of receiving a completed application." },
      { q: "A lender fails to deliver the Notice of Right to Cancel to a co-owner on a primary residence refinance. The 3-day rescission window:", choices: ["Stays the same", "Extends to 30 days", "Extends to 1 year", "Extends to 3 years"], answer: 3, explain: "Failure to deliver required rescission notices extends the window to 3 years." },
      { q: "PITI stands for:", choices: ["Principal, Interest, Taxes, Insurance", "Principal, Interest, Term, Income", "Payment, Interest, Tax, Investment", "Principal, Income, Tax, Insurance"], answer: 0, explain: "PITI is the full monthly housing obligation: Principal, Interest, Taxes, and Insurance." },
      { q: "Which feature would disqualify a loan from Qualified Mortgage (QM) status?", choices: ["15-year term", "Interest-only payments", "Fixed rate", "Escrowed taxes"], answer: 1, explain: "QM loans cannot have interest-only payments, negative amortization, terms over 30 years, or points and fees over 3%." },
      { q: "One discount point equals what percentage of the loan amount?", choices: ["0.1%", "0.5%", "1%", "5%"], answer: 2, explain: "1 discount point equals 1% of the total loan amount, paid to permanently buy down the rate." },
      { q: "Arizona mortgage licensees must retain books, accounts, and records for a minimum of:", choices: ["2 years", "3 years", "5 years", "7 years"], answer: 2, explain: "Arizona law requires 5 years of record retention from the final entry or loan closing." },
      { q: "Under Arizona MLO licensing rules, a felony conviction involving fraud or dishonesty results in:", choices: ["A 2-year wait", "A 7-year wait", "A permanent bar", "No impact if disclosed"], answer: 2, explain: "Felonies involving fraud, breach of trust, dishonesty, or money laundering are a permanent bar to AZ MLO licensure." }
    ]
  }
};
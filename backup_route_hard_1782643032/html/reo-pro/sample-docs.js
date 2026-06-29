// TSM Mortgage Rescue Pack - Sample Test Documents
// Each entry keyed to match pack-configs.js keys.
// Contains a short synthetic loan file excerpt with intentional anomalies
// designed to trigger that pack's detection categories.

const TSM_SAMPLE_DOCS = {

  "loan-denial": {
    fileName: "denial-letter-johnson.txt",
    docText: `ADVERSE ACTION NOTICE
Borrower: Sarah Johnson
Loan Program: Conventional 30yr Fixed
Decision: DENIED
Reason Codes: DTI exceeds program maximum (52% vs 45% max); Insufficient reserves (0.5 months vs 2 months required)
Credit Score: 671
Income: $5,400/mo (W2)
Proposed PITI: $2,200/mo
Other Debts: $700/mo
Notes: Borrower disputes income calculation - claims processor omitted recent raise effective 30 days ago.`
  },

  "credit-event": {
    fileName: "credit-monitoring-alert.txt",
    docText: `CREDIT MONITORING ALERT
Borrower: Marcus Reed
Prior Score (at application): 712
Current Score: 661 (-51 pts)
New Tradelines Detected: Auto loan opened 14 days ago, $38,400, $612/mo payment
Inquiries (last 30 days): 4
Loan Status: Conditional Approval, awaiting final credit pull
Original DTI: 38% | Updated DTI w/ new auto payment: 46%
Loan Program: Conventional 5% down`
  },

  "employment-change": {
    fileName: "voe-update-notice.txt",
    docText: `EMPLOYMENT VERIFICATION UPDATE
Borrower: Lisa Tran
Previous Employer: Sunrise Marketing Group (3.5 yrs) - terminated employment 6 days ago
New Employer: BrightPath Consulting - start date in 5 days
Employment Type: W2, salaried, same field (marketing)
Probationary Period: 90 days per offer letter
Original Income Used in Underwriting: $7,200/mo
Offer Letter Income: $7,500/mo
Closing Date: 12 days from today
Status: Loan in underwriting, conditions issued, VOE pending for new employer`
  },

  "asset-sourcing": {
    fileName: "bank-statement-review.txt",
    docText: `BANK STATEMENT ANALYSIS - Checking Account ending 4471
Borrower: David Okafor
Statement Period: Last 60 days

Transactions of Note:
- Deposit $18,500 on 03/14 - description "Zelle from J. Patel" - no documentation on file
- Deposit $2,000 on 03/22 - description "Venmo - Wedding gift"
- Withdrawal $4,200 on 03/28 - "Transfer to undisclosed account ending 9921"
- Ending balance: $31,200

Required Reserves (per loan program, 2 units, 6 months PITI): $19,800
Documented/Sourced Funds: $12,700
Gift Letter on File: NO
Cash to Close Required: $42,000`
  },

  "income-stability": {
    fileName: "self-employed-income-analysis.txt",
    docText: `SELF-EMPLOYED INCOME WORKSHEET
Borrower: Angela Cruz (Sole Proprietor, Graphic Design)

2023 Schedule C Net Profit: $61,400
2024 Schedule C Net Profit: $38,900 (-37% YoY decline)
2024 1099 totals show 3 clients vs 7 in 2023
Year-to-date 2025 P&L (unaudited): annualized to $44,000

Business bank deposits trend: declining each quarter for past 4 quarters
Borrower explanation: "Lost largest retainer client in Q3 2024, picking up new clients now"
Loan Program: Conventional, AUS recommendation: Refer/Eligible`
  },

  "fraud-investigation": {
    fileName: "file-review-flags.txt",
    docText: `UNDERWRITER FILE REVIEW NOTES
Borrower: Robert Kim
Subject Property: 4-unit building, borrower indicates "primary residence, will occupy unit 1"

Flags Observed:
- Borrower's current address (per credit report) is 380 miles from subject property
- Pay stub font/spacing on page 2 differs from page 1 of same stub
- VOE phone number does not match employer's listed number on company website
- Two different SSNs appear across submitted documents (typo or identity issue?)
- Purchase contract shows seller concession of $22,000 on a $310,000 purchase (7%), but addendum shows different sales price of $288,000
- Borrower requested wire instructions be sent to a different escrow officer email than the one on file with title company`
  },

  "fha-rescue": {
    fileName: "fha-aus-findings.txt",
    docText: `FHA TOTAL SCORECARD - AUS RESULT: REFER (Manual Underwrite Required)
Borrower: Theresa Williams
Loan Program: FHA 30yr Fixed, 3.5% down
Front-End DTI: 38% (FHA max 31%)
Back-End DTI: 51% (FHA max 43%)
Credit Score: 598
Compensating Factors Claimed by LO: "Borrower has 12-month history of rental payments equal to or greater than new PITI"
Residual Income (per Table): Not yet calculated
Credit History: One 30-day late on auto loan 8 months ago, otherwise clean 24-month history
Reserves: 1 month PITI verified`
  },

  "va-rescue": {
    fileName: "va-eligibility-file.txt",
    docText: `VA LOAN FILE SUMMARY
Borrower: SSG Michael Torres (Active Duty, 6 years service)
COE Status: Pulled, shows entitlement of $0 - prior VA loan from 2019 still active, no COE restoration on file
Prior VA Loan: Refinanced into conventional in 2022 per borrower, but VA system shows original loan still active/not marked paid
Residual Income Calculation: Region - South, Family Size - 4: Required $1,003 | Calculated $890 (SHORTFALL)
Funding Fee: Not yet calculated, first-time use assumed but may be subsequent use
Property: Single family residence, no MPR issues noted on appraisal`
  },

  "usda-rescue": {
    fileName: "usda-eligibility-review.txt",
    docText: `USDA RURAL DEVELOPMENT FILE NOTES
Borrower Household: 5 members (2 adults, 3 dependents)
County: Pinal County, AZ
USDA Adjusted Household Income Limit (115% AMI, household of 5): $96,950
Borrower Gross Household Income (before adjustments): $98,400
Childcare Deduction Documented: $0 (borrower pays $400/mo for daycare, not yet documented)
Property Address: Verify against eligible rural area map - property is 0.4 miles outside last known eligible boundary per 2023 map; 2024 map not yet checked
Guarantee Fee: Not yet calculated`
  },

  "jumbo-rescue": {
    fileName: "jumbo-file-summary.txt",
    docText: `JUMBO LOAN FILE SUMMARY
Loan Amount: $1,250,000
LTV: 80%
Borrower Liquid Reserves (post-closing): $42,000
Required Reserves (12 months PITI per investor guideline for this LTV/loan amount tier): $96,000 (SHORTFALL of $54,000)
Income Documentation: 2 years tax returns provided, but most recent year shows large one-time capital gain ($310,000) that LO included in qualifying income
Appraisal: Single appraisal on file, loan amount exceeds investor's $1,000,000 single-appraisal threshold (second appraisal required)
Credit Score: 742`
  },

  "dscr-investor": {
    fileName: "dscr-loan-summary.txt",
    docText: `DSCR LOAN FILE SUMMARY
Property: 3-unit rental, Phoenix AZ
Purchase Price: $480,000
Loan Amount: $360,000 (75% LTV)
Monthly PITIA: $2,850
Market Rent per 1007: $2,400/mo (single appraiser estimate, no lease in place - property vacant)
DSCR Calculated: 2,400 / 2,850 = 0.84 (program minimum DSCR: 1.00)
Reserves Verified: 4 months PITIA (program requires 6 months for DSCR <1.0 per overlay)
Vesting: Borrower wants to take title in newly-formed LLC (formed 9 days ago), no operating agreement on file`
  },

  "condo-rescue": {
    fileName: "condo-project-review.txt",
    docText: `CONDO PROJECT REVIEW - "Cactus Ridge Villas"
Total Units: 64
Owner-Occupied Units: 26 (40.6%) - below 50% threshold for standard warrantable review
Single Entity Ownership: One LLC owns 9 units (14% of project)
HOA Reserve Study: Last conducted 2019, reserves funded at 8% of budget (Fannie minimum 10%)
Master Insurance Policy: Coverage amount appears to be based on 2018 replacement cost estimate
Pending Litigation: HOA board minutes reference "ongoing dispute with roofing contractor regarding 2023 repairs, demand letter sent"
Commercial Space: Ground floor retail = 12% of total square footage`
  },

  "new-construction": {
    fileName: "construction-loan-status.txt",
    docText: `NEW CONSTRUCTION LOAN STATUS
Builder: Desert Bloom Homes LLC
Contract Signed: 11 months ago, original estimated completion: 8 months
Current Status: Framing complete, drywall in progress (approx. 65% complete per last draw inspection)
Draw History: Draws 1-4 disbursed on schedule, Draw 5 request submitted but inspection not yet scheduled (14 days pending)
Rate Lock Expiration: 18 days from today
Certificate of Occupancy: Not yet issued, city inspections backlog reported by builder, estimated CO in 6-8 weeks
Builder Financial Notes: Two other buyers in same subdivision reported builder payment delays to subcontractors`
  },

  "trid-rescue": {
    fileName: "trid-timeline-audit.txt",
    docText: `TRID COMPLIANCE TIMELINE
Application Date: Day 0
Initial Loan Estimate Issued: Day 4 (TRID requires within 3 business days)
Changed Circumstance: Borrower requested rate lock extension on Day 20, LE not re-disclosed
Closing Disclosure Issued: Day 35
Scheduled Closing/Consummation: Day 38 (3 business days after CD - appears compliant)
Fee Comparison (Initial LE vs Final CD):
- Loan Origination Fee: $2,400 -> $2,400 (no change)
- Title Insurance: $1,100 -> $1,450 (increase of $350, title is "no tolerance" category not tied to a changed circumstance)
- Recording Fees: $185 -> $310 (increase of $125, "10% tolerance bucket" combined with other fees in this bucket already increased 8%)`
  },

  "respa-rescue": {
    fileName: "respa-fee-review.txt",
    docText: `RESPA FEE & RELATIONSHIP REVIEW
Title Company Used: "Desert Title & Escrow" - co-owned by the loan officer's spouse (35% ownership stake)
AfBA Disclosure: Not found in file
Title Fee Charged: $1,450 (market comparison shows average local fee of $950 for similar transactions)
Loan Officer Compensation Plan: References a "marketing services agreement" with the title company, payment of $500/month flat fee
Servicing Disclosure Statement: Present and signed
Escrow Account Setup: Standard, no issues noted`
  },

  "hmda-audit": {
    fileName: "lar-data-review.txt",
    docText: `HMDA LAR FIELD REVIEW - Loan #RE-20251142
Action Taken: "Loan Originated"
Action Taken Date: Listed as 3 days BEFORE the Closing Disclosure date on file
Demographic Info: Race field = "Information not provided" but loan was taken via in-person application (face-to-face requires visual observation if applicant declines)
Rate Spread: Field is blank; APR on CD = 7.85%, Average Prime Offer Rate for this lock date/term = 6.70% (spread = 1.15%, may trigger HOEPA/HPML reporting requirement)
Loan Purpose: Listed as "Refinance" but file documents show this is a purchase transaction`
  },

  "hoa-risk": {
    fileName: "hoa-document-review.txt",
    docText: `HOA DOCUMENT REVIEW - "Willow Creek Townhomes"
Litigation: HOA is named defendant in a lawsuit filed 4 months ago re: defective balcony construction (class action, ~30 units affected including subject unit)
Special Assessment: $4,800 per unit approved 2 months ago for balcony remediation, payable over 24 months, NOT disclosed by seller
Reserve Study: Indicates reserves at 22% funded (industry recommendation 70%+)
Master Insurance: Policy renewal notice shows 40% premium increase, HOA considering reducing coverage limits
Delinquency Rate: 18% of units more than 60 days delinquent on HOA dues`
  },

  "seller-risk": {
    fileName: "seller-communication-log.txt",
    docText: `TRANSACTION COMMUNICATION LOG
Day 5: Seller disclosure packet requested - not received
Day 12: Seller disclosure packet received, missing signature page and lead-paint disclosure (home built 1974)
Day 15: Listing agent states seller is currently going through divorce, both spouses must sign but second spouse "is traveling, will sign when back"
Day 18: Buyer's agent reports seller's tenant is still occupying property, lease doesn't expire until after scheduled closing date
Day 20: Title search shows property held in name of an LLC, not the individual sellers listed on the contract
Response Time Pattern: Seller side averaging 4-6 days to respond to all requests vs. 1 day for buyer side`
  },

  "contract-risk": {
    fileName: "purchase-contract-review.txt",
    docText: `PURCHASE CONTRACT REVIEW
Original Contract Price: $415,000
Contract Date: 45 days ago
Inspection Contingency Deadline: Day 10 (passed - no inspection objection notice found in file)
Appraisal Contingency Deadline: Day 21 (passed - appraisal came in at $402,000, no addendum addressing the gap found in file)
Financing Contingency Deadline: Day 30 (passed - loan still in underwriting, no extension addendum signed)
Amendment #1 (Day 25): Changes price to $408,000, signed only by buyer
Amendment #2 (Day 32): References "original price of $415,000" again, signed by both parties - conflicts with Amendment #1
Earnest Money: $8,300 held by title company, no release/extension instructions on file`
  },

  "ctc-fast-track": {
    fileName: "ctc-conditions-list.txt",
    docText: `CLEAR-TO-CLOSE CONDITION TRACKER
Loan Status: Conditional Approval
Outstanding UW Conditions:
1. Updated paystub within 10 days of closing - NOT RECEIVED (closing in 6 days)
2. VOE for new employer - PENDING, requested 3 days ago, no response
3. Final asset statement (most recent 30 days) - NOT RECEIVED
4. Hazard insurance binder showing lender as mortgagee - RECEIVED but lender clause name has typo (wrong lender entity name)
5. Gift letter + donor bank statement - RECEIVED, but donor statement shows insufficient funds at time of gift transfer date
CD Issued: Not yet issued, pending condition clearance
Wire Instructions: Verified via callback 2 days ago`
  },

  "postclose-audit": {
    fileName: "post-close-qc-findings.txt",
    docText: `POST-CLOSE QUALITY CONTROL AUDIT - Loan #RE-20250877 (Closed 45 days ago)
Findings:
1. Final 1003 in file shows employer name "Acme Corp" but VOE and paystubs show "Acme Corporation Inc" - minor discrepancy not explained
2. DTI on closing documents calculated as 41%, QC recalculation shows 44% (LO used gross income figure that included non-recurring overtime not properly averaged)
3. Appraisal in file is missing page 3 of 6 (comparable sales grid)
4. Note and Deed of Trust both present and executed, but recording confirmation/stamped copy not yet returned from county (45 days is outside normal recording timeline)
5. Final signed Closing Disclosure missing borrower's initials on page 2 (page 1, 3-5 all initialed)`
  },

  "deal-killer": {
    fileName: "full-file-snapshot.txt",
    docText: `FULL TRANSACTION SNAPSHOT - Loan #RE-20251301
Borrower: James & Patricia Lowell
Loan Program: Conventional 30yr, Purchase, $445,000 sales price, 10% down

CREDIT: Score 654 (dropped from 689 at application 3 weeks ago, new $12k auto loan added)
INCOME: Self-employed borrower (35% of qualifying income), 2024 Schedule C down 22% from 2023
ASSETS: $9,000 unsourced deposit found in checking statement, 1.2 months reserves vs 2 required
TITLE: Preliminary title shows an old HOA lien from previous owner, not yet resolved, payoff demand requested but not received
APPRAISAL: Came in at $431,000 vs contract price of $445,000 ($14,000 gap), no addendum on file
HOA: Subject property HOA has pending special assessment vote scheduled for next week ($3,200/unit if passed)
INSURANCE: No hazard insurance binder on file yet, closing in 9 days
COMPLIANCE: Initial LE was issued on day 5 (1 day late per TRID 3-business-day rule)
CONDITIONS: 6 underwriting conditions outstanding, 2 require third-party turnaround (VOE, payoff demand)
CLOSING: Scheduled in 9 days, financing contingency expires in 3 days with no extension signed`
  },

  "transaction-autopsy": {
    fileName: "full-file-snapshot.txt",
    docText: `FULL TRANSACTION SNAPSHOT - Loan #RE-20251301
Borrower: James & Patricia Lowell
Loan Program: Conventional 30yr, Purchase, $445,000 sales price, 10% down

CREDIT: Score 654 (dropped from 689 at application 3 weeks ago, new $12k auto loan added)
INCOME: Self-employed borrower (35% of qualifying income), 2024 Schedule C down 22% from 2023
ASSETS: $9,000 unsourced deposit found in checking statement, 1.2 months reserves vs 2 required
TITLE: Preliminary title shows an old HOA lien from previous owner, not yet resolved, payoff demand requested but not received
APPRAISAL: Came in at $431,000 vs contract price of $445,000 ($14,000 gap), no addendum on file
HOA: Subject property HOA has pending special assessment vote scheduled for next week ($3,200/unit if passed)
INSURANCE: No hazard insurance binder on file yet, closing in 9 days
COMPLIANCE: Initial LE was issued on day 5 (1 day late per TRID 3-business-day rule)
CONDITIONS: 6 underwriting conditions outstanding, 2 require third-party turnaround (VOE, payoff demand)
CLOSING: Scheduled in 9 days, financing contingency expires in 3 days with no extension signed`
  },

  "closing-probability": {
    fileName: "full-file-snapshot.txt",
    docText: `FULL TRANSACTION SNAPSHOT - Loan #RE-20251301
Borrower: James & Patricia Lowell
Loan Program: Conventional 30yr, Purchase, $445,000 sales price, 10% down

CREDIT: Score 654 (dropped from 689 at application 3 weeks ago, new $12k auto loan added)
INCOME: Self-employed borrower (35% of qualifying income), 2024 Schedule C down 22% from 2023
ASSETS: $9,000 unsourced deposit found in checking statement, 1.2 months reserves vs 2 required
TITLE: Preliminary title shows an old HOA lien from previous owner, not yet resolved, payoff demand requested but not received
APPRAISAL: Came in at $431,000 vs contract price of $445,000 ($14,000 gap), no addendum on file
HOA: Subject property HOA has pending special assessment vote scheduled for next week ($3,200/unit if passed)
INSURANCE: No hazard insurance binder on file yet, closing in 9 days
COMPLIANCE: Initial LE was issued on day 5 (1 day late per TRID 3-business-day rule)
CONDITIONS: 6 underwriting conditions outstanding, 2 require third-party turnaround (VOE, payoff demand)
CLOSING: Scheduled in 9 days, financing contingency expires in 3 days with no extension signed`
  },

  "mortgage-ops-scorecard": {
    fileName: "pipeline-snapshot.txt",
    docText: `PIPELINE FILE SNAPSHOT - Loan #RE-20251301
Borrower Readiness: Income docs 90% complete, ID verification complete
Income Stability: Self-employed borrower, 2024 income down 22% YoY
Asset Verification: $9,000 unsourced deposit pending explanation, reserves at 1.2 months vs 2 required
Credit Strength: Score 654, recent $12k auto loan added post-application
Property Readiness: Appraisal $14,000 below contract price, no addendum filed
Title Readiness: Open HOA lien from prior owner, payoff demand outstanding
Compliance Readiness: TRID LE issued 1 day late (day 5)
Closing Readiness: 6 open conditions, financing contingency expires in 3 days, no hazard insurance binder yet, closing in 9 days`
  }

};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = TSM_SAMPLE_DOCS;
}
import pandas as pd
import os

# Define the target directory
target_dir = "html/construction-suite/construction-docs"
os.makedirs(target_dir, exist_ok=True)

# 1. Financial: Q1 Invoice Summary (Real-world retention and tax logic)
invoice_data = {
    'Vendor': ['Mesa Roofing', 'AZ Electric', 'Premier Concrete', 'Laveen Framing'],
    'Invoice_Date': ['2026-03-01', '2026-03-12', '2026-03-15', '2026-03-20'],
    'Gross_Amount': [312400.00, 45000.00, 142000.00, 88500.00],
    'Retention_10%': [31240.00, 4500.00, 14200.00, 8850.00],
    'Net_Payable': [281160.00, 40500.00, 127800.00, 79650.00],
    'Status': ['Approved', 'Pending', 'Paid', 'Audit-Hold']
}
pd.DataFrame(invoice_data).to_excel(f"{target_dir}/invoice-q1.xlsx", index=False)

# 2. Financial: Change Order #7 (The $182K Lobby Upgrade Narrative)
with open(f"{target_dir}/change-order-7.pdf", "w") as f:
    f.write("CHANGE ORDER #007 - MESA PREMIER LEGAL\n")
    f.write("Description: Owner-directed upgrade from LVT to Polished Italian Marble in Lobby.\n")
    f.write("Labor Impact: +120 Man Hours. Material Impact: +$165,000.\n")
    f.write("Total Cost: $182,000.00. Schedule Delay: 14 Business Days.\n")
    f.write("Auth Status: PENDING CFO APPROVAL.")

# 3. Reports: Weekly Progress (Phase 1 Logic)
with open(f"{target_dir}/progress-w17.pdf", "w") as f:
    f.write("WEEK 17 PROGRESS REPORT: SITE BLOCK C\n")
    f.write("Site Prep: 100% | Foundation: 42% | MEP Rough-in: 5%\n")
    f.write("Critical Path Alert: High winds delayed crane mobilization by 48 hours.\n")
    f.write("Notes: 4-Engine BNCA analysis required for revised slab-pour schedule.")

# 4. Permits: Building Permit & Zoning Variance
with open(f"{target_dir}/permit-foundation.pdf", "w") as f:
    f.write("CITY OF PHOENIX BUILDING PERMIT #BLD2026-00451\n")
    f.write("Site Address: 1200 Municipal Way, Phoenix AZ\n")
    f.write("Issued To: Habitat for Humanity Central Arizona\n")
    f.write("Inspections Required: Footing, Rebar, Ufer Ground.")

with open(f"{target_dir}/zoning-variance.pdf", "w") as f:
    f.write("MARICOPA COUNTY ZONING CASE Z-14-26\n")
    f.write("Variance: Reduction of South Setback from 20' to 12'.\n")
    f.write("Condition: Must install automated fire suppression per Plan Sheet L1-FIRE.\n")
    f.write("Status: GRANTED.")

# 5. Safety: OSHA Plan & Incident Report
with open(f"{target_dir}/osha-safety-2026.pdf", "w") as f:
    f.write("2026 SITE SAFETY PROTOCOL - TSM CONSTRUCTION\n")
    f.write("Officer: Latorrey Whitehead | Certification: OSHA-30\n")
    f.write("Protocols: Tie-off at 6ft, Weekly Tool-box Talks, Silica Dust Mitigation.")

with open(f"{target_dir}/incident-report.pdf", "w") as f:
    f.write("INCIDENT LOG #2026-004\n")
    f.write("Date: 2026-05-10 | Location: Block C Concrete Washout\n")
    f.write("Incident: Slip without injury due to improper washout berm height.\n")
    f.write("Remediation: Re-leveled berm; safety signage deployed.")

# 6. Plans: Site Master, MEP, and Electrical
plans = {
    "site-plan-master.pdf": "Parcel #301-22-104; Total SF: 42,500; Lot Coverage: 68%. Boundary verified.",
    "mep-drawings.dwg": "CLASH DETECTED: HVAC Ducting Section B-14 intersects Fire Sprinkler Line 4.",
    "electrical-diagram.pdf": "3-Phase, 480Y/277V Service. Lobby Panel Sub-feed assigned to CO-007."
}
for name, content in plans.items():
    with open(f"{target_dir}/{name}", "w") as f:
        f.write(content)

# 7. Contracts: Sub-Bid & AIA Agreement
with open(f"{target_dir}/bid-roofing.pdf", "w") as f:
    f.write("BID PROPOSAL: MESA ROOFING SPECIALISTS\n")
    f.write("Scope: 60-mil TPO Membrane, R-30 Insulation.\n")
    f.write("Total Quote: $312,400.00. Validity: 30 Days.")

with open(f"{target_dir}/architect-agreement.pdf", "w") as f:
    f.write("AIA DOCUMENT B101-2026\n")
    f.write("Owner: Habitat for Humanity | Architect: Lead-Point Design\n")
    f.write("Article 3.6: Site visit audit required for payment draw release.")

print("All 12 high-fidelity documents generated in html/construction-suite/construction-docs.")

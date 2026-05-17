# TSM BPO Production Readiness

## Current Status
The BPO apps are demo/pilot ready, not full production service-delivery ready.

## Production Requirements

### Phase 1 — Core Hardening
- Add login/auth protection.
- Add role-based views: Admin, Manager, Analyst, Client.
- Add request validation for `/api/bpo/query`.
- Add rate limiting.
- Add security headers.
- Remove all static operational numbers or label them as demo data.

### Phase 2 — Real BPO Operations
- Add persistent database tables:
  - clients
  - portfolios
  - accounts
  - work_items
  - notes
  - SLA events
  - BNCA reports
  - audit_logs
- Save every intake submission.
- Save every AI/BNCA output.
- Track owner, status, priority, due date, SLA age.

### Phase 3 — Documents
- Add file upload.
- Store documents by client/account.
- Add metadata extraction.
- Add document evidence log.
- Add secure download links.

### Phase 4 — Reporting
- WIP report export.
- SLA report export.
- Executive rollup.
- Client-facing monthly report.
- Recovery / leakage / risk metrics.

### Phase 5 — Production Security
- Client data separation.
- Audit trails.
- Encryption at rest where applicable.
- HIPAA/PII caution for healthcare lanes.
- Admin controls for pricing/SLA plans.
- Logging and monitoring.

## Current Use Recommendation
Use these pages for:
- Sales demos
- Client discovery
- BPO workflow preview
- Internal pilot testing

Do not use yet for:
- Live client records
- Regulated data
- PHI/PII
- Production receivables workflow
- Contractual SLA delivery

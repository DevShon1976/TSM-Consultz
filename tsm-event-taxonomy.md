# TSM Event Taxonomy & Reducer Map
## All 7 Verticals + Collective Intelligence Layer
## For use with TSM_KERNEL v2

---

## Universal Events (all verticals)

| Event Type | Trigger | Payload Shape |
|---|---|---|
| `ROUTE_ENTERED` | User lands on any war room page | `{ page, prevRoute }` |
| `ROUTE_EXITED` | Navigation away | `{ page, nextRoute }` |
| `DOC_LOADED` | Document pasted / uploaded | `{ docText, meta: { fileName, chars, source } }` |
| `DOC_CLEARED` | Clear button / reset | `{}` |
| `DOC_CLASSIFIED` | Classification run completes | `{ defectType, confidence, flags, routeId }` |
| `DOC_ANOMALY_FLAGGED` | Anomaly detected in doc | `{ flags: [], severity, defectFlags }` |
| `ANALYSIS_REQUESTED` | User hits Analyze / Run | `{ model, prompt, vertical }` |
| `ANALYSIS_COMPLETED` | Groq stream finishes | `{ brief, confidence, model, tokens }` |
| `ANALYSIS_FAILED` | Groq error | `{ error, code }` |
| `MISSION_CREATED` | First mission in session | `{ objective, priority, assignedTo }` |
| `MISSION_UPDATED` | Mission state changes | `{ field, prev, next }` |
| `STRATEGIST_BRIEF_READY` | Strategist output rendered | `{ briefText, format: "===BRIEF===" or JSON }` |
| `EXECUTIVE_BRIEF_GENERATED` | Executive portal populated | `{ summary, actions, confidence }` |
| `HITL_DECISION_MADE` | Human approves/rejects | `{ decision, rationale, operator }` |
| `HITL_ESCALATED` | Escalation flagged | `{ reason, urgency }` |

---

## HC (Healthcare RCM)

routeId: `"hc"`

| Event Type | When Emitted | Key Payload Fields |
|---|---|---|
| `DOC_LOADED` | Claim / EOB / auth doc pasted | `docText, meta.claimType` |
| `DOC_CLASSIFIED` | Claim type identified | `defectType: "AUTH_MISSING"/"CODING_ERROR"/...` |
| `DOC_ANOMALY_FLAGGED` | Denial pattern detected | `flags: ["CO-97","PR-204",...], severity` |
| `ANALYSIS_COMPLETED` | Denial war room analysis done | `brief, confidence, suggestedRemap` |
| `MISSION_CREATED` | Appeal mission opened | `objective: "File reconsideration", claimId` |
| `STRATEGIST_BRIEF_READY` | HC Strategist output ready | `briefText, appealStrategy, cptFixes` |
| `EXECUTIVE_BRIEF_GENERATED` | HC Executive Portal ready | `denialRate, recoveryProjection, approvedAppeals` |
| `HITL_DECISION_MADE` | Manager approves appeal | `decision: "APPROVE"/"REJECT", claimId` |

**HC Reducer additions (inside `_reduce`):**
```js
case "ANALYSIS_COMPLETED":
  if (r.startsWith("hc")) {
    p.cache.denialAnalysis = event.payload;
    p.cache.appealReady    = !!event.payload.appealStrategy;
  }
  break;
```

---

## FinOps

routeId: `"finops"`

| Event Type | When Emitted | Key Payload Fields |
|---|---|---|
| `DOC_LOADED` | Invoice / budget doc pasted | `docText, meta.docClass` |
| `DOC_CLASSIFIED` | Doc typed as invoice/PO/variance | `defectType: "BUDGET_VARIANCE"/"DUPLICATE_INVOICE"/...` |
| `DOC_ANOMALY_FLAGGED` | Spend anomaly | `flags: ["OVER_BUDGET","UNAUTH_VENDOR"], severity` |
| `ANALYSIS_COMPLETED` | FinOps war room analysis | `brief, savingsOpportunity, riskLevel` |
| `KPI_UPDATED` | Budget metrics refreshed | `{ burnRate, forecastVariance, openPOs }` |
| `STRATEGIST_BRIEF_READY` | FinOps Strategist output | `briefText, costAction, vendorReview` |
| `EXECUTIVE_BRIEF_GENERATED` | FinOps Executive Portal | `totalSpend, savingsIdentified, approvalQueue` |
| `HITL_DECISION_MADE` | CFO/controller approves | `decision, invoiceId, amount` |

---

## Insurance

routeId: `"insurance"`

| Event Type | When Emitted | Key Payload Fields |
|---|---|---|
| `DOC_LOADED` | Policy / claim doc pasted | `docText, meta.policyType` |
| `DOC_CLASSIFIED` | Claim type resolved | `defectType: "COVERAGE_GAP"/"FRAUD_INDICATOR"/...` |
| `DOC_ANOMALY_FLAGGED` | Fraud signal or SLA breach | `flags: ["DUPLICATE_CLAIM","DATE_MISMATCH"], severity` |
| `ANALYSIS_COMPLETED` | Insurance war room analysis | `brief, coverageAssessment, fraudScore` |
| `MISSION_CREATED` | Claim investigation opened | `claimId, policyId, objective` |
| `STRATEGIST_BRIEF_READY` | Insurance Strategist output | `briefText, adjustmentRec, slaStatus` |
| `EXECUTIVE_BRIEF_GENERATED` | Insurance Executive Portal | `claimVolume, pendingEscalations, fraudAlerts` |
| `HITL_DECISION_MADE` | Adjuster approves/denies | `decision, claimId, reasoning` |
| `HITL_ESCALATED` | SIU referral triggered | `reason: "FRAUD_ESCALATION", claimId` |

---

## Legal

routeId: `"legal"`

| Event Type | When Emitted | Key Payload Fields |
|---|---|---|
| `DOC_LOADED` | Contract / brief pasted | `docText, meta.docClass` |
| `DOC_CLASSIFIED` | Contract type resolved | `defectType: "MISSING_CLAUSE"/"TERM_CONFLICT"/...` |
| `DOC_ANOMALY_FLAGGED` | Compliance/risk flag | `flags: ["INDEMNITY_MISSING","AUTO_RENEW_RISK"], severity` |
| `ANALYSIS_COMPLETED` | Legal war room analysis | `brief, riskScore, clauseGaps` |
| `MISSION_CREATED` | Matter opened | `objective, matterType, deadline` |
| `STRATEGIST_BRIEF_READY` | Legal Strategist output | `briefText, redlineRec, complianceActions` |
| `EXECUTIVE_BRIEF_GENERATED` | Legal Executive Portal | `openMatters, complianceScore, urgentFlags` |
| `HITL_DECISION_MADE` | Counsel approves action | `decision, matterId, rationale` |

---

## Real Estate / MLO

routeId: `"real_estate"`

| Event Type | When Emitted | Key Payload Fields |
|---|---|---|
| `DOC_LOADED` | Loan / appraisal / title doc | `docText, meta.docClass` |
| `DOC_CLASSIFIED` | Doc type resolved | `defectType: "TITLE_DEFECT"/"APPRAISAL_GAP"/...` |
| `DOC_ANOMALY_FLAGGED` | Underwriting flag | `flags: ["LTV_BREACH","INCOME_MISMATCH"], severity` |
| `ANALYSIS_COMPLETED` | RE war room analysis | `brief, loanRisk, titleRec` |
| `KPI_UPDATED` | Pipeline metrics updated | `{ activePipeline, avgLTV, closingRate }` |
| `STRATEGIST_BRIEF_READY` | RE Strategist output | `briefText, underwritingDecision, conditions` |
| `EXECUTIVE_BRIEF_GENERATED` | RE Executive Portal | `pipelineValue, pendingConditions, closingForecast` |
| `HITL_DECISION_MADE` | UW/MLO approves condition | `decision, loanId, conditionId` |

---

## Construction

routeId: `"construction"`

| Event Type | When Emitted | Key Payload Fields |
|---|---|---|
| `DOC_LOADED` | RFI / submittal / change order | `docText, meta.docClass` |
| `DOC_CLASSIFIED` | Document typed | `defectType: "SCOPE_CHANGE"/"SAFETY_VIOLATION"/...` |
| `DOC_ANOMALY_FLAGGED` | Schedule or safety flag | `flags: ["SCHEDULE_SLIP","LIEN_RISK"], severity` |
| `ANALYSIS_COMPLETED` | Construction war room analysis | `brief, scheduleImpact, costImpact` |
| `MISSION_CREATED` | RFI / change order opened | `objective, projectId, rfiId` |
| `STRATEGIST_BRIEF_READY` | Construction Strategist output | `briefText, changeOrderRec, scheduleAction` |
| `EXECUTIVE_BRIEF_GENERATED` | Construction Executive Portal | `openRFIs, budgetAtRisk, scheduleVariance` |
| `HITL_DECISION_MADE` | PM/owner approves change | `decision, changeOrderId, deltaCost` |

---

## BPO

routeId: `"bpo"`

| Event Type | When Emitted | Key Payload Fields |
|---|---|---|
| `DOC_LOADED` | Process doc / transcript pasted | `docText, meta.processType` |
| `DOC_CLASSIFIED` | Process type resolved | `defectType: "SLA_BREACH"/"EXCEPTION_UNRESOLVED"/...` |
| `DOC_ANOMALY_FLAGGED` | Volume spike or error pattern | `flags: ["HIGH_VOLUME","REPEAT_EXCEPTION"], severity` |
| `ANALYSIS_COMPLETED` | BPO situation room analysis | `brief, rootCause, slaStatus` |
| `MISSION_CREATED` | Escalation mission created | `objective: "Resolve SLA breach", processId` |
| `STRATEGIST_BRIEF_READY` | BPO Strategist v2 output | `briefText, remediationPlan, automationRec` |
| `EXECUTIVE_BRIEF_GENERATED` | BPO Executive Portal | `slaScore, openExceptions, throughput` |
| `HITL_DECISION_MADE` | Ops director approves action | `decision, processId, remediationType` |
| `HITL_ESCALATED` | Client escalation triggered | `reason, clientId, urgency: "HIGH"` |

---

## Collective Intelligence Layer

routeId: `"collective"`

| Event Type | When Emitted | Key Payload Fields |
|---|---|---|
| `SIGNAL_EMITTED` | Any vertical fires a signal | `sourceRoute, signalType, strength` |
| `KPI_UPDATED` | Platform-wide KPI refresh | `{ verticals: { hc, finops, bpo, ... } }` |
| `ANOMALY_CORRELATED` | Cross-vertical pattern detected | `routes: ["hc","insurance"], pattern, confidence` |
| `SESSION_STARTED` | Kernel boots | `version, ts` |
| `SESSION_RESTORED` | Snapshot restored | `count` |

---

## Migration Cheat Sheet

### Old pattern → New pattern

```js
// OLD: sessionStorage write
sessionStorage.setItem("tsm_hc_doc", text);

// NEW: emit event
TSM_KERNEL.emit({
  type: "DOC_LOADED",
  routeId: "hc",
  payload: { docText: text, meta: { source: "paste" } }
});
```

```js
// OLD: localStorage relay
localStorage.setItem("tsm_relay_hc_strategist", JSON.stringify(brief));

// NEW: relay via kernel
TSM_KERNEL.emit({
  type: "STRATEGIST_BRIEF_READY",
  routeId: "hc",
  payload: { briefText: brief }
});
```

```js
// OLD: read relay in strategist page
const brief = JSON.parse(localStorage.getItem("tsm_relay_hc_strategist"));

// NEW: read projection
const { strategistBrief } = TSM_KERNEL.get("hc");
```

```js
// OLD: polling for doc availability
const interval = setInterval(() => {
  const doc = sessionStorage.getItem("tsm_hc_doc");
  if (doc) { render(doc); clearInterval(interval); }
}, 200);

// NEW: subscribe
TSM_KERNEL.on("DOC_LOADED", (event) => {
  if (event.routeId === "hc") render(event.payload.docText);
});
```

---

## Rollout Order (safe, non-breaking)

1. **Load `tsm-kernel-v2.js` first** in your `server.js` HTML template or base layout
2. **Keep all existing sessionStorage/localStorage calls** — kernel runs silently alongside
3. **Migrate one war room at a time** — start with BPO (freshest code, fewest relay keys)
4. **Replace `setDoc` / `getDoc` calls** with `TSM_KERNEL.setDoc` shim (already compatible)
5. **Replace relay reads** with `TSM_KERNEL.get(routeId).relay`
6. **Once all 7 verticals migrated**, strip sessionStorage/localStorage writes entirely
7. **Add snapshot/restore** to persist log across page reloads via IndexedDB (Phase 3)
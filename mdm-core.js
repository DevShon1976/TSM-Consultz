// mdm-core.js — deterministic MDM logic. No AI dependency. Testable standalone.

function levenshtein(a, b) {
  a = (a || '').toLowerCase().trim();
  b = (b || '').toLowerCase().trim();
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function similarity(a, b) {
  const maxLen = Math.max((a || '').length, (b || '').length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

// Weighted match score across configurable fields per domain
const FIELD_WEIGHTS = {
  customer:     { name: 0.5, address: 0.25, taxId: 0.25 },
  vendor:       { name: 0.5, address: 0.25, taxId: 0.25 },
  product:      { name: 0.6, sku: 0.4 },
  employee:     { name: 0.5, employeeId: 0.5 },
  asset:        { name: 0.4, assetTag: 0.6 },
  location:     { name: 0.5, address: 0.5 },
  orgunit:      { name: 0.6, orgCode: 0.4 },
  costcenter:   { name: 0.5, ccCode: 0.5 },
  profitcenter: { name: 0.5, pcCode: 0.5 },
  gl:           { name: 0.4, accountNumber: 0.6 }
};

function recordSimilarity(recA, recB, domain) {
  const weights = FIELD_WEIGHTS[domain] || {};
  let score = 0, totalWeight = 0;
  for (const [field, weight] of Object.entries(weights)) {
    score += similarity(recA[field], recB[field]) * weight;
    totalWeight += weight;
  }
  return totalWeight ? score / totalWeight : 0;
}

// Fields that are meant to be unique identifiers, not free text. If two records share
// an identical non-empty value in any of these, that alone is strong duplicate evidence
// — stronger than fuzzy name similarity, which can legitimately be low for the same
// real-world entity (e.g. "Whitfield, Latorrey" vs "Whitfield, L." with a shared
// employeeId). Without this, an exact identifier match can still lose to a borderline
// weighted score and silently fall below threshold.
const IDENTIFIER_FIELDS = ['taxId', 'employeeId', 'assetTag', 'sku', 'accountNumber', 'ccCode', 'pcCode', 'orgCode'];

function sharedIdentifier(recA, recB) {
  for (const field of IDENTIFIER_FIELDS) {
    const a = recA[field], b = recB[field];
    if (a && b && String(a).trim() !== '' && String(a).trim() === String(b).trim()) return field;
  }
  return null;
}

function findDuplicates(records, domain, threshold = 0.82) {
  const matches = [];
  for (let i = 0; i < records.length; i++) {
    for (let j = i + 1; j < records.length; j++) {
      let score = recordSimilarity(records[i], records[j], domain);
      const idField = sharedIdentifier(records[i], records[j]);
      if (idField) score = Math.max(score, 0.95);
      if (score >= threshold) {
        matches.push({
          recordA: records[i],
          recordB: records[j],
          matchScore: Math.round(score * 100),
          domain
        });
      }
    }
  }
  return matches.sort((a, b) => b.matchScore - a.matchScore);
}

// Data quality scoring — completeness + format validation
const REQUIRED_FIELDS = {
  customer:     ['name', 'address', 'taxId', 'email'],
  vendor:       ['name', 'address', 'taxId'],
  product:      ['name', 'sku', 'category'],
  employee:     ['name', 'employeeId', 'department'],
  asset:        ['name', 'assetTag', 'location'],
  location:     ['name', 'address', 'region'],
  orgunit:      ['name', 'parentUnit', 'orgCode'],
  costcenter:   ['name', 'ccCode', 'owner'],
  profitcenter: ['name', 'pcCode', 'owner'],
  gl:           ['name', 'accountNumber']
};

const FORMAT_VALIDATORS = {
  email:         v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || ''),
  taxId:         v => /^\d{2}-\d{7}$/.test(v || ''),
  accountNumber: v => /^\d{4,6}$/.test(v || ''),
  sku:           v => /^PRD-\d{3,6}$/.test(v || ''),
  employeeId:    v => /^EMP-\d{3,6}$/.test(v || ''),
  assetTag:      v => /^AST-\d{3,6}$/.test(v || ''),
  orgCode:       v => /^ORG-\d{3,6}$/.test(v || ''),
  ccCode:        v => /^CC-\d{3,6}$/.test(v || ''),
  pcCode:        v => /^PC-\d{3,6}$/.test(v || '')
};

function scoreRecord(record, domain) {
  const required = REQUIRED_FIELDS[domain] || [];
  let completeness = 0;
  const issues = [];

  for (const field of required) {
    if (record[field] && String(record[field]).trim() !== '') {
      completeness += 1;
    } else {
      issues.push(`Missing required field: ${field}`);
    }
  }
  completeness = required.length ? completeness / required.length : 1;

  let formatScore = 1;
  let formatChecks = 0;
  for (const [field, validator] of Object.entries(FORMAT_VALIDATORS)) {
    if (record[field] !== undefined) {
      formatChecks++;
      if (!validator(record[field])) {
        formatScore -= 1;
        issues.push(`Invalid format: ${field} = "${record[field]}"`);
      }
    }
  }
  formatScore = formatChecks ? Math.max(0, 1 - (formatChecks - formatScore) / formatChecks) : 1;

  const overall = Math.round((completeness * 0.6 + formatScore * 0.4) * 100);
  return { recordId: record.id, overall, completeness: Math.round(completeness * 100), formatScore: Math.round(formatScore * 100), issues };
}

function scoreDataset(records, domain) {
  const scores = records.map(r => scoreRecord(r, domain));
  const avgScore = Math.round(scores.reduce((s, r) => s + r.overall, 0) / (scores.length || 1));
  return { domain, avgScore, recordCount: records.length, scores };
}

module.exports = { findDuplicates, scoreDataset, scoreRecord, recordSimilarity, similarity };
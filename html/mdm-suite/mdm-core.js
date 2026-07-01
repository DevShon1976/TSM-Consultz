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
  customer: { name: 0.5, address: 0.25, taxId: 0.25 },
  vendor:   { name: 0.5, address: 0.25, taxId: 0.25 },
  gl:       { name: 0.4, accountNumber: 0.6 }
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

function findDuplicates(records, domain, threshold = 0.82) {
  const matches = [];
  for (let i = 0; i < records.length; i++) {
    for (let j = i + 1; j < records.length; j++) {
      const score = recordSimilarity(records[i], records[j], domain);
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
  customer: ['name', 'address', 'taxId', 'email'],
  vendor:   ['name', 'address', 'taxId'],
  gl:       ['name', 'accountNumber']
};

const FORMAT_VALIDATORS = {
  email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || ''),
  taxId: v => /^\d{2}-\d{7}$/.test(v || ''),
  accountNumber: v => /^\d{4,6}$/.test(v || '')
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
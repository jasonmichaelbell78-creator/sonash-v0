# Audit Aggregator — Extended Examples

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-24
**Status:** ACTIVE
<!-- prettier-ignore-end -->

Reference file for detailed code examples and report templates. Read this file
when implementing the aggregation logic.

---

## Parsed Finding Structure

```javascript
{
  id: "CODE-001",
  title: "Missing error handling",
  severity: "S1",
  effort: "E1",
  confidence: "High",
  file: "src/auth.ts",
  line: 45,
  category: "Code Quality",
  domain: "code",
  description: "...",
  evidence: "...",
  recommendation: "..."
}
```

## Deduplication Logic (Detailed)

```javascript
// Pseudo-code
const groups = groupBy(findings, (f) => `${f.file}:${f.line}`);

for (const group of Object.values(groups)) {
  if (group.length > 1) {
    const sorted = [...group].sort((a, b) =>
      `${a.file}::${a.line ?? 0}`.localeCompare(`${b.file}::${b.line ?? 0}`)
    );
    const titles = [...new Set(group.map((f) => f.title).filter(Boolean))].sort();
    const domains = [...new Set(group.map((f) => f.domain).filter(Boolean))].sort();
    merged = {
      fingerprint: `cross-domain::${sorted[0].file}::${sorted[0].line ?? 0}::${slugify(titles.join(" + "))}`,
      domains,
      cross_domain: true,
      severity: maxSeverity(group),
      effort: maxEffort(group),
      confidence: maxConfidence(group),
      title: mergeTitles(group),
      description: mergeDescriptions(group),
      category: mapPrimaryCategory(domains),
      ...
    };
  }
}
```

## Cross-Cutting Pattern Detection

### A. Hotspot Files (appear in 3+ audits)

```javascript
const fileCounts = {};
for (const finding of findings) {
  fileCounts[finding.file] = (fileCounts[finding.file] || 0) + 1;
}
const hotspots = Object.entries(fileCounts)
  .filter(([file, count]) => count >= 3)
  .sort((a, b) => b[1] - a[1]);
```

### B. Related Findings

Look for pairs where:

- Same file, different concerns (e.g., performance + security in same function)
- Dependency chain (e.g., missing docs for complex code)
- Contradiction patterns (e.g., over-engineered simple function)

### C. Domain Overlap Counts

```
Security + Performance: 12 findings
Code + Refactoring: 18 findings
Documentation + Code: 8 findings
```

### D. Category Pattern Grouping

```
Authentication: 5 findings (2 security, 2 code, 1 process)
Error Handling: 8 findings (3 code, 3 security, 2 performance)
Testing: 12 findings (6 code, 4 refactoring, 2 process)
```

## Priority Score Formula

```javascript
priority =
  (severityWeight * crossDomainMultiplier * confidenceWeight) / effortWeight;

severityWeight = { S0: 100, S1: 50, S2: 20, S3: 5 };
crossDomainMultiplier = 1 + (domains.length - 1) * 0.5;
confidenceWeight = { High: 1.0, Medium: 0.8, Low: 0.5 };
effortWeight = { E0: 0.5, E1: 1.0, E2: 2.0, E3: 4.0 };
```

**Example Scores:**

```
Finding A: S0, 1 domain, High, E1 → 100 × 1.0 × 1.0 / 1.0 = 100 (Rank #1)
Finding B: S1, 3 domains, High, E1 → 50 × 2.0 × 1.0 / 1.0 = 100 (Rank #2)
Finding C: S2, 2 domains, High, E0 → 20 × 1.5 × 1.0 / 0.5 = 60 (Rank #3)
Finding D: S1, 1 domain, Medium, E2 → 50 × 1.0 × 0.8 / 2.0 = 20 (Rank #4)
```

## Executive Summary Template

```markdown
## Executive Summary

### Audit Overview

- **Raw Findings:** 142 (across 9 audits)
- **Unique Findings:** 97 (after deduplication)
- **Merged Findings:** 45 (appeared in 2+ audits)
- **Cross-Domain Findings:** 18 (3+ audits)

### Severity Breakdown

- **S0 Critical:** 3 (IMMEDIATE ACTION REQUIRED)
- **S1 High:** 24 (fix within sprint)
- **S2 Medium:** 42 (plan for next milestone)
- **S3 Low:** 28 (backlog/nice-to-have)

### Effort Estimate

- **Total estimated effort:** 127 hours
- **Quick wins (E0):** 15 findings (12 hours)
- **Short fixes (E1):** 42 findings (42 hours)
- **Medium tasks (E2):** 28 findings (56 hours)
- **Major refactors (E3):** 12 findings (96 hours)
```

## Key Insights Template

```markdown
### Key Insights

1. **Authentication Layer Needs Comprehensive Refactor**
   - 8 files appear in 4+ audits (security, code, performance, documentation)
   - Recommended: Dedicated sprint to harden auth module

2. **Security + Performance Overlap**
   - 12 findings where fixing security also improves performance
   - Recommended: Bundle these fixes together

3. **Documentation Gaps Align with Code Complexity**
   - 5 files with S1 complexity issues also have missing/outdated docs
   - Recommended: Document complex areas first (highest ROI)
```

## Action Plan Template

```markdown
### Recommended Action Plan

**Phase 1: Critical Fixes (Week 1)**

1. FIX S0 findings (3 items - 8 hours)
2. Address top 5 quick wins (E0 - 4 hours)

**Phase 2: High-Priority Fixes (Week 2-3)**

1. Cross-domain findings (18 items - 32 hours)
2. Hotspot files refactor (8 files - 48 hours)

**Phase 3: Systematic Improvements (Month 2)**

1. Remaining S1 findings (21 items - 36 hours)
2. S2 medium-effort fixes (28 items - 56 hours)

**Phase 4: Backlog (Ongoing)**

1. S3 low-priority (28 items - 24 hours)
2. Major refactors (E3 - 96 hours, spread over quarters)
```

## Full Report Structure

```markdown
# Comprehensive Audit Report

**Generated:** [Date] **Audits Included:** Code, Security, Performance,
Documentation, Refactoring, Process, Engineering Productivity, Enhancements, AI
Optimization **Total Findings:** 97 unique (142 raw)

## Executive Summary

[Generated in Step 5]

## Priority-Ranked Findings (Top 20)

| Rank | ID                                    | Severity | Domains | File:Line      | Description | Effort | Score |
| ---- | ------------------------------------- | -------: | ------: | -------------- | ----------- | -----: | ----: |
| 1    | cross-domain::auth.ts::error-handling |       S0 |       3 | src/auth.ts:45 | ...         |     E1 |   100 |

## Cross-Domain Insights

### Hotspot Files (3+ audits)

### Domain Overlaps

### Category Patterns

## Full Findings (Deduplicated)

### S0 Critical (N findings)

### S1 High (N findings)

### S2 Medium (N findings)

### S3 Low (N findings)

## Appendix

### Individual Audit Reports

### Baseline Metrics

### False Positives Excluded
```

## JSONL Output Schema

```jsonl
{
  "fingerprint": "cross-domain::auth.ts::error-handling",
  "title": "Missing error handling + Exception vulnerability",
  "category": "security",
  "severity": "S0",
  "effort": "E1",
  "confidence": 0.95,
  "domains": [
    "code",
    "security",
    "performance"
  ],
  "files": [
    "src/auth.ts:45"
  ],
  "description": "...",
  "suggested_fix": "...",
  "acceptance_tests": [
    "..."
  ],
  "evidence": [
    "..."
  ]
}
```

## Triage Priority Scoring (Extended)

| Factor         | Weight | Calculation                  |
| -------------- | ------ | ---------------------------- |
| Severity       | 40%    | S0=100, S1=50, S2=20, S3=5   |
| Cross-domain   | 20%    | +50% per additional domain   |
| Effort inverse | 20%    | E0=4x, E1=2x, E2=1x, E3=0.5x |
| Dependency     | 10%    | +25% if blocks other items   |
| File hotspot   | 10%    | +25% if file has 3+ findings |

## Track Assignment Rules

| Category                 | File Pattern            | Track    |
| ------------------------ | ----------------------- | -------- |
| security                 | \*                      | Track-S  |
| performance              | \*                      | Track-P  |
| process                  | \*                      | Track-D  |
| refactoring              | \*                      | M2.3-REF |
| documentation            | \*                      | M1.5     |
| code-quality             | scripts/, .claude/      | Track-E  |
| code-quality             | .github/                | Track-D  |
| code-quality             | tests/                  | Track-T  |
| code-quality             | functions/              | M2.2     |
| code-quality             | components/, lib/, app/ | M2.1     |
| enhancements             | \*                      | M2.1     |
| ai-optimization          | \*                      | Track-E  |
| engineering-productivity | \*                      | Track-E  |

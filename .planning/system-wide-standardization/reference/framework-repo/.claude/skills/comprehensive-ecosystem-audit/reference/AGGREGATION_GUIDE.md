<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-24
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Comprehensive Ecosystem Audit Aggregation Guide

How to compute the overall ecosystem health grade, domain heat map, and
cross-audit insights from the 7 individual audit results.

---

## Table of Contents

- [Weighted Scoring Formula](#weighted-scoring-formula)
- [Grade Scale](#grade-scale)
- [Domain Heat Map Computation](#domain-heat-map-computation)
- [Cross-Audit Insight Detection](#cross-audit-insight-detection)
- [Top Findings Ranking](#top-findings-ranking)
- [Report Generation](#report-generation)

---

## Weighted Scoring Formula

### Audit Weights

| Audit   | Weight | Rationale                                                                  |
| ------- | ------ | -------------------------------------------------------------------------- |
| hook    | 15%    | Core infrastructure -- hooks drive all automation and enforce patterns     |
| session | 10%    | Session management -- important but narrower scope (begin/end lifecycle)   |
| tdms    | 15%    | Debt tracking -- central to technical health, drives prioritization        |
| pr      | 15%    | Review workflow -- quality gate for all changes, review bot health         |
| skill   | 20%    | Skill quality -- largest surface area, 60+ skills, most agent interactions |
| doc     | 10%    | Documentation -- supporting infrastructure, freshness and accuracy         |
| script  | 15%    | Script infrastructure -- build/test/deploy pipeline, shared libraries      |

### Computation

**When all 7 audits complete:**

```
overallScore = (hook.score * 0.15) +
               (session.score * 0.10) +
               (tdms.score * 0.15) +
               (pr.score * 0.15) +
               (skill.score * 0.20) +
               (doc.score * 0.10) +
               (script.score * 0.15)
```

**When some audits fail (partial results):**

Re-normalize weights to sum to 1.0 using only completed audits:

```
completedWeightSum = sum of weights for completed audits
adjustedWeight(audit) = originalWeight(audit) / completedWeightSum
overallScore = sum(completedAudit.score * adjustedWeight(completedAudit))
```

**Example with session audit failed:**

```
completedWeightSum = 0.15 + 0.15 + 0.15 + 0.20 + 0.10 + 0.15 = 0.90
hook adjusted = 0.15 / 0.90 = 0.167
tdms adjusted = 0.15 / 0.90 = 0.167
pr adjusted   = 0.15 / 0.90 = 0.167
skill adjusted = 0.20 / 0.90 = 0.222
doc adjusted  = 0.10 / 0.90 = 0.111
script adjusted = 0.15 / 0.90 = 0.167
```

Round the final score to the nearest integer.

---

## Grade Scale

| Score Range | Grade | Description                                        |
| ----------- | ----- | -------------------------------------------------- |
| 90-100      | A     | Excellent -- ecosystem is well-maintained          |
| 80-89       | B     | Good -- minor issues, healthy overall              |
| 70-79       | C     | Fair -- several areas need attention               |
| 60-69       | D     | Poor -- significant issues across multiple domains |
| 0-59        | F     | Critical -- ecosystem health is degraded           |

---

## Domain Heat Map Computation

The heat map shows the weakest categories across all 7 audits, helping identify
where to focus improvement efforts.

### Data Collection

Each audit result JSON contains a `categories` object with per-category scores:

```json
{
  "categories": {
    "settings_alignment": { "score": 95, "rating": "good" },
    "event_coverage": { "score": 72, "rating": "average" },
    "error_handling": { "score": 55, "rating": "poor" }
  }
}
```

### Extraction

For each audit result file:

```bash
node -e "
  const d = require('./.claude/tmp/ecosystem-{name}-result.json');
  const cats = d.categories || {};
  Object.entries(cats).forEach(([cat, data]) => {
    console.log(JSON.stringify({
      audit: '{name}',
      category: cat,
      score: data.score,
      rating: data.rating
    }));
  });
"
```

### Computation

1. Collect all category entries from all 7 audits
2. Sort by score ascending (lowest scores first)
3. Take the bottom 10 entries as the heat map
4. Format as a table with rank, category name, parent audit, score, and rating

### Rating Badges

| Score Range | Rating |
| ----------- | ------ |
| 90-100      | Good   |
| 70-89       | Avg    |
| 0-69        | Poor   |

---

## Cross-Audit Insight Detection

Cross-audit insights are patterns that appear in multiple audits, indicating
systemic issues rather than isolated problems.

### Detection Method 1: Shared File Hotspots

Files that appear in findings from 3 or more audits are likely problem areas
needing comprehensive attention.

**How to detect:**

1. From each audit's top findings, extract file paths
2. Count how many different audits reference each file
3. Files appearing in 3+ audits are "hotspots"

```bash
# Extract file paths from all audit findings
for name in hook session tdms pr skill doc script; do
  file=".claude/tmp/ecosystem-${name}-result.json"
  if [ -f "$file" ]; then
    node -e "
      const d = require('./${file}');
      (d.findings || []).forEach(f => {
        const fp = f.file || f.filePath || f.target || '';
        if (fp) console.log('${name}\t' + fp);
      });
    "
  fi
done | sort -t$'\t' -k2 | uniq -f1 -c | sort -rn | head -10
```

### Detection Method 2: Common Pattern Violations

Same anti-pattern type flagged across multiple audits.

**Pattern categories to look for:**

- Error handling gaps (missing try/catch, unhandled rejections)
- Input validation issues (unsanitized paths, missing type checks)
- Documentation gaps (missing JSDoc, outdated comments)
- Security patterns (path traversal, symlink checks)
- Code hygiene (dead code, unused imports, TODOs)

**How to detect:**

1. From each audit's findings, extract the category/type
2. Normalize category names (audits may use different naming)
3. Group by normalized category
4. Categories appearing in 3+ audits are "common violations"

### Detection Method 3: Infrastructure Gaps

Missing capabilities noted by multiple audits suggest systemic infrastructure
needs.

**How to detect:**

1. Look for findings with severity "info" or "warning" that suggest adding new
   functionality
2. Group by the type of suggestion (testing, monitoring, documentation, etc.)
3. Suggestions appearing in 2+ audits indicate infrastructure gaps

### Output Format

```markdown
## Cross-Audit Insights

### Shared File Hotspots

| File   | Audits              | Finding Count | Recommendation                |
| ------ | ------------------- | ------------- | ----------------------------- |
| {path} | hook, skill, script | 5             | Comprehensive refactor needed |

### Common Pattern Violations

| Pattern   | Audits           | Total Findings | Severity |
| --------- | ---------------- | -------------- | -------- |
| {pattern} | hook, pr, script | 12             | WARNING  |

### Infrastructure Gaps

| Gap           | Noted By     | Impact |
| ------------- | ------------ | ------ |
| {description} | session, doc | Medium |
```

---

## Top Findings Ranking

### Collection

From each audit, extract the top 3 findings by impact score:

```bash
node -e "
  const d = require('./.claude/tmp/ecosystem-{name}-result.json');
  const top3 = (d.findings || [])
    .sort((a, b) => (b.impactScore || 0) - (a.impactScore || 0))
    .slice(0, 3);
  top3.forEach(f => console.log(JSON.stringify({
    audit: '{name}',
    severity: f.severity,
    category: f.category,
    message: f.message || f.title,
    impactScore: f.impactScore || 0,
    file: f.file || f.filePath || ''
  })));
"
```

### Ranking

1. Collect top 3 from each of the 7 audits (up to 21 findings)
2. Sort by impact score descending
3. If impact scores are tied, sort by severity (ERROR > WARNING > INFO)
4. Take the top 20
5. Assign rank numbers 1-20

### Output Format

```markdown
## Top 20 Priority Findings

| Rank | Audit | Severity | Category | Message | Impact | File |
| ---- | ----- | -------- | -------- | ------- | ------ | ---- |
| 1    | {aud} | ERROR    | {cat}    | {msg}   | {imp}  | {f}  |
| 2    | {aud} | WARNING  | {cat}    | {msg}   | {imp}  | {f}  |
| ...  | ...   | ...      | ...      | ...     | ...    | ...  |
```

---

## Report Generation

### File Path

`COMPREHENSIVE_ECOSYSTEM_AUDIT_REPORT.md` in the project root.

### Sections (in order)

1. **Header** -- title, date, overall grade, audit count
2. **Executive Summary** -- 2-3 sentences synthesizing overall health
3. **Audit Results** -- table of all 7 audits with grades and counts
4. **Domain Heat Map** -- bottom 10 weakest categories across all audits
5. **Top 20 Priority Findings** -- ranked by impact score
6. **Cross-Audit Insights** -- shared hotspots, common violations, gaps
7. **Recommendations** -- 5-7 actionable next steps ordered by impact
8. **Appendix** -- audit script paths, failed audits (if any)

### Executive Summary Guidelines

The executive summary should:

- State the overall grade and what it means
- Identify the strongest and weakest audit domains
- Note any critical (ERROR-level) findings that need immediate attention
- Compare to previous run if historical data exists
- Be exactly 2-3 sentences, no more

### Recommendations Guidelines

Recommendations should:

- Be concrete and actionable (not "improve testing" but "add unit tests for the
  5 untested hook scripts identified in the hook audit")
- Be ordered by expected impact (highest first)
- Reference specific findings or audit domains
- Include rough effort estimates where possible (E0-E3 scale)
- Be limited to 5-7 items (focused, not overwhelming)

---

## Version History

| Version | Date       | Description            |
| ------- | ---------- | ---------------------- |
| 1.0     | 2026-02-24 | Initial implementation |

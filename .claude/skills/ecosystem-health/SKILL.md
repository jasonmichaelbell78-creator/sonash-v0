<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-01
**Status:** ACTIVE
<!-- prettier-ignore-end -->

---

name: ecosystem-health description: | Interactive health dashboard with
8-category composite scoring, 13-dimension drill-down, and trend tracking. Runs
all 10 health checkers, persists scores to JSONL, and shows active warnings from
warning lifecycle. Triggers: "ecosystem-health", "health dashboard", "ecosystem
score"

---

# Ecosystem Health -- Interactive Dashboard

**Ecosystem ownership:** Part of `health-ecosystem-audit` ecosystem (D#18,
D#31). Audited by `/health-ecosystem-audit` D4: Consumer Integration, which
validates integration contracts and flags divergence from expected behavior
(D#47).

## When to Use

- User explicitly invokes `/ecosystem-health`
- User asks about ecosystem health, health score, or health dashboard

## When NOT to Use

- For quick alert triage: use `/alerts` instead
- For individual dimension investigation: use `--dimension=ID` flag

## Overview

Runs 10 health checkers across 8 weighted categories (64 metrics), computes
composite score with letter grades, persists results with trend tracking, and
shows active warnings from the warning lifecycle system.

**Output:** Markdown dashboard with composite score, category table, dimensions
needing attention, active warnings, and trend comparison.

## Usage

```
/ecosystem-health              # Full check with dashboard
/ecosystem-health --quick      # Fast subset (4 checkers)
/ecosystem-health --dimension  # Drill into specific dimension
```

## Workflow

### Phase 1: Run Health Checks

Execute the orchestrator script:

```bash
node .claude/skills/ecosystem-health/scripts/run-ecosystem-health.js
```

For quick mode:

```bash
node .claude/skills/ecosystem-health/scripts/run-ecosystem-health.js --quick
```

### Phase 2: Review Dashboard

The script outputs a markdown dashboard with:

1. **Composite Score** -- Overall grade and score (0-100)
2. **Category Scores** -- 8 categories with grades and trends
3. **Dimensions Needing Attention** -- Any dimension scoring below C (70)
4. **Active Warnings** -- Unresolved warnings from warning lifecycle
5. **Trend** -- Comparison with previous run

### Phase 3: Drill Down (Optional)

If user wants detail on a specific dimension:

```bash
node scripts/health/run-health-check.js --dimension=debt-aging
```

Available dimensions: ts-health, eslint-compliance, pattern-enforcement,
vulnerability-status, debt-aging, debt-velocity, test-pass-rate,
learning-effectiveness, hook-pipeline-health, session-management,
documentation-freshness, review-quality, workflow-compliance

### Phase 4: Act on Findings

Based on dashboard output:

- Dimensions with D/F grades should be investigated
- Active warnings should be acknowledged or resolved
- Degrading trends should be addressed

## Data

- **Health log:** `data/ecosystem-v2/ecosystem-health-log.jsonl`
- **Warnings:** `data/ecosystem-v2/warnings.jsonl`
- **Checkers:** `scripts/health/checkers/*.js`
- **Libraries:** `scripts/health/lib/*.js`

## Integration

- Persists each run to `ecosystem-health-log.jsonl` for historical tracking
- Reads active warnings from `warnings.jsonl` (warning-lifecycle.js)
- Trend computed from last 5 runs using scoring.js computeTrend

---

## Version History

| Version | Date       | Description     |
| ------- | ---------- | --------------- |
| 1.0     | 2026-03-01 | Initial release |

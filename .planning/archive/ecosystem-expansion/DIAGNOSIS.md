<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-08
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Diagnosis: Ecosystem Expansion

**Date:** 2026-03-08 **Task:** Two-fold: (1) Create a new Health Monitoring
ecosystem + audit skill, (2) Expand test coverage across the repo

## ROADMAP Alignment

**Aligned.** The System-Wide Standardization initiative (P0 BLOCKER) explicitly
lists "Analytics/Health" as ecosystem #13 needing standardization. Testing
infrastructure is Track T. Both workstreams directly serve the project's
foundation-first approach.

## Relevant Existing Systems

| System                  | Relationship                            | Pattern to Follow                      |
| ----------------------- | --------------------------------------- | -------------------------------------- |
| Health monitoring       | TARGET — 20+ files, no ecosystem audit  | Will become ecosystem #8               |
| hook-ecosystem-audit    | TEMPLATE — most refined ecosystem audit | Fork structure, checkers, scoring      |
| script-ecosystem-audit  | OVERLAP — checks scripts in `scripts/`  | Must define boundary with health audit |
| /alerts skill           | CONSUMER — reads health check output    | Must not duplicate, audit verifies it  |
| /ecosystem-health skill | CONSUMER — wraps run-health-check.js    | Must not duplicate                     |
| /audit-health skill     | NEIGHBOR — checks audit infrastructure  | Different scope (audits ≠ health)      |
| comprehensive-ecosystem | PARENT — orchestrates all eco audits    | Must register new audit in stages      |
| CI workflow             | INTEGRATION — runs tests, no thresholds | Test expansion must add CI gates       |

## Health Monitoring System Inventory (What the New Ecosystem Would Audit)

**Core Infrastructure (7 files):**

- `scripts/health/run-health-check.js` — Orchestrator
- `scripts/health/lib/composite.js` — Weighted scoring (8 categories)
- `scripts/health/lib/scoring.js` — Metric scoring engine
- `scripts/health/lib/dimensions.js` — 13-dimension mapper
- `scripts/health/lib/health-log.js` — JSONL persistence
- `scripts/health/lib/mid-session-alerts.js` — Degradation detection
- `scripts/health/lib/warning-lifecycle.js` — Warning CRUD + lifecycle

**10 Checkers (0% tested):**

- code-quality, security, debt-health, test-coverage, learning-effectiveness
- hook-pipeline, session-management, documentation, pattern-enforcement
- ecosystem-integration

**Data Stores:**

- `data/ecosystem-v2/ecosystem-health-log.jsonl` — Historical scores
- `data/ecosystem-v2/warnings.jsonl` — Warning records
- `.claude/state/alert-suppressions.json` — Suppressed alerts
- `.claude/state/health-score-log.jsonl` — Quick scores

**Consumer Skills:** /alerts (36-category dashboard), /ecosystem-health
(dimension drill-down) **Integration:** session-start hook runs `--quick` mode
at session init

## Test Coverage Snapshot (Current Gaps)

| Area                       | Scripts | Tested | Coverage |
| -------------------------- | ------- | ------ | -------- |
| scripts/ root              | 62      | 5      | 8%       |
| scripts/debt/              | 37      | 0      | **0%**   |
| scripts/health/            | 10      | 0      | **0%**   |
| scripts/reviews/           | 33      | 9      | 27%      |
| .claude/hooks/             | 25+     | 0      | **0%**   |
| .claude/skills/\*/scripts/ | 10+     | 1      | **<5%**  |
| Overall (c8)               | —       | —      | 65.28%   |
| Function coverage          | —       | —      | 57.47%   |

**No CI coverage thresholds** — tests are informational, not blocking.

## Reframe Check

The task is what it appears to be. Two observations:

1. **Workstream 1 (health ecosystem)** is well-scoped. The health monitoring
   system is substantial enough (20+ files, own data pipeline, 10 checkers, 8
   categories, 13 dimensions) and completely unaudited. Creating an ecosystem
   audit follows the established pattern.

2. **Workstream 2 (test expansion)** is broader than it appears. "Expand all
   manner of testing" could mean: (a) add unit tests for untested scripts, (b)
   add tests for the new ecosystem audit, (c) add CI coverage thresholds, (d)
   add test protocols for untested features, (e) expand integration/e2e tests.
   Discovery needs to scope this precisely.

3. **The two workstreams intersect:** The health checkers (0% tested) are the
   primary infrastructure the new ecosystem would audit. Testing them first
   makes the ecosystem audit more valuable — it can then enforce test coverage
   as a category.

**Recommendation:** Proceed as stated. Plan both workstreams together since they
share infrastructure. The ecosystem audit design will inform which tests are
highest-priority.

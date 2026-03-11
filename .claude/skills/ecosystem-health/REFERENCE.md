<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-11
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Ecosystem Health Reference

Dimension descriptions, action mapping table, and triage format reference for
the `/ecosystem-health` skill.

---

## Dimension Descriptions

Project-specific descriptions for the 13 health dimensions. Used in the
per-dimension Q&A format during triage (Phase 3).

### Code Quality (2 dimensions)

**ts-health** — TypeScript Health Measures TypeScript compilation errors and
type safety across the codebase. Score degrades with `tsc` errors and unresolved
type issues. Metrics: `ts_errors`, `eslint_errors`

**eslint-compliance** — ESLint Compliance Measures linting rule compliance, code
style consistency, pattern violations, and circular dependency count. Score
degrades with warnings, errors, and circular imports. Metrics:
`eslint_warnings`, `eslint_errors`, `pattern_violations`, `circular_deps`

### Security (1 dimension)

**vulnerability-status** — Vulnerability Status Measures known security
vulnerabilities from `npm audit`, critical/high counts, and potential secret
exposure in committed files. Metrics: `critical_vulns`, `high_vulns`,
`audit_status`, `secret_exposure`

### Technical Debt (2 dimensions)

**debt-aging** — Debt Aging Measures how long S0/S1 technical debt items have
been open in `MASTER_DEBT.jsonl`. Score degrades as items age past 14 days (S0)
or 30 days (S1). Tracks total open items and average age. Metrics: `s0_count`,
`s1_count`, `avg_age_days`, `total_open`

**debt-velocity** — Debt Velocity Measures the rate of debt creation vs
resolution over the last 30 days. Net positive flow (more created than resolved)
degrades the score. Tracks intake, resolution, and net flow. Metrics:
`resolution_rate`, `intake_30d`, `resolved_30d`, `net_flow`

### Testing (1 dimension)

**test-pass-rate** — Test Pass Rate Measures test suite health: pass rate
percentage, failed/error counts, and how many days since tests were last run.
Score degrades with failures and staleness. Metrics: `pass_rate`,
`failed_count`, `error_count`, `staleness_days`

### Learning & Patterns (2 dimensions)

**pattern-enforcement** — Pattern Enforcement Measures code pattern compliance
via `npm run patterns:check`. Tracks repeat offenders, outdated patterns,
hotspot files, and sync issues between pattern definitions and enforcement.
Metrics: `repeat_offenders`, `outdated_patterns`, `hotspot_files`, `sync_issues`

**learning-effectiveness** — Learning Effectiveness Measures how well the
codebase learns from reviews: automation coverage of learned patterns, failing
pattern count, critical pattern success rate. Metrics: `effectiveness`,
`automation_coverage`, `failing_patterns`, `learned_count`, `critical_success`

### Infrastructure (2 dimensions)

**hook-pipeline-health** — Hook Pipeline Health Measures pre-commit hook
reliability: warnings and overrides in last 7 days, false positive percentage,
noise ratio, and commit failures. High override rates or false positives degrade
the score. Metrics: `warnings_7d`, `overrides_7d`, `false_positive_pct`,
`noise_ratio`, `commit_failures_7d`, `overrides_24h`, `warnings_24h`,
`no_reason_pct`, `last_hook_passed`

**session-management** — Session Management Measures working tree cleanliness
and session hygiene: uncommitted files, stale branch age, and hours since last
session gap check. Metrics: `uncommitted_files`, `stale_branch_days`,
`session_gap_hours`

### Documentation (1 dimension)

**documentation-freshness** — Documentation Freshness Measures documentation
currency: days since key docs were updated, misplaced documentation files,
broken cross-references, cross-document dependency issues, and canonical source
violations. Metrics: `staleness_days`, `misplaced_docs`, `broken_links`,
`crossdoc_issues`, `canon_issues`

### Process & Workflow (2 dimensions)

**review-quality** — Review Quality Measures code review effectiveness: average
fix ratio per review round, average number of review rounds per PR, and total
review count. Metrics: `avg_fix_ratio`, `avg_rounds`, `review_count`

**workflow-compliance** — Workflow Compliance Measures CI/CD health and
integration completeness: CI failures, SonarCloud issues, velocity averages, and
missing reviews. Metrics: `ci_failures`, `sonar_issues`, `velocity_avg`,
`reviews_missing`

---

## Action Mapping Table

Maps each dimension to specific remediation commands and skills. Used during
Phase 3 triage to present fix options.

| Dimension               | Fix Options                         | Skills/Commands                                            |
| ----------------------- | ----------------------------------- | ---------------------------------------------------------- |
| ts-health               | Run TypeScript compiler, fix errors | `npx tsc --noEmit`, manual fixes                           |
| eslint-compliance       | Auto-fix lint issues                | `npm run lint -- --fix`, `npm run patterns:check`          |
| pattern-enforcement     | Review pattern violations           | `npm run patterns:check`, update `verified-patterns.jsonl` |
| vulnerability-status    | Run security audit, update deps     | `npm audit fix`, `/audit-security`                         |
| debt-aging              | Triage oldest S0/S1 items           | `/add-debt`, resolve via TDMS pipeline                     |
| debt-velocity           | Resolve more debt than created      | Resolve via TDMS pipeline, reduce intake via code review   |
| test-pass-rate          | Fix failing tests, run suite        | `npm test`, fix failures, `npm run test:health`            |
| learning-effectiveness  | Automate learned patterns           | `npm run patterns:check`, add to `verified-patterns.jsonl` |
| hook-pipeline-health    | Reduce false positives, fix hooks   | `npm run hooks:health`, `npm run hooks:analytics`          |
| session-management      | Clean working tree, close sessions  | `git status`, `/session-end`, clean stale branches         |
| documentation-freshness | Update stale docs, fix links        | `npm run docs:check`, `npm run crossdoc:check`             |
| review-quality          | Improve review process              | `/pr-retro`, review AI_REVIEW_LEARNINGS_LOG.md             |
| workflow-compliance     | Fix CI failures, address issues     | `/gh-fix-ci`, `/sonarcloud`, check CI dashboard            |

---

## Triage Output Format

Each triage decision is captured in the state file with this structure:

```json
{
  "dimensions": [
    {
      "id": "debt-aging",
      "score": 25,
      "grade": "F",
      "action": "fixed|deferred|skipped",
      "command": "node scripts/debt/resolve-bulk.js",
      "result": "success|failure|null",
      "timestamp": "2026-03-11T09:30:00Z"
    }
  ],
  "mode": "review-each|fix-all|you-decide",
  "dashboard_score": 59,
  "dashboard_grade": "F",
  "started": "2026-03-11T09:25:00Z",
  "completed": "2026-03-11T09:40:00Z"
}
```

---

## Per-Dimension Q&A Template

Used during Phase 3 "review-each" mode. Present one dimension at a time:

```
**Dimension N of M** | Progress: X fixed, Y deferred, Z skipped

**[Name from dimension descriptions above]** ([grade]/[score])
Problem: [Description from dimension descriptions above, contextualized with
actual metric values from the health check result]

[If tracked in ROADMAP: "Already tracked: ROADMAP Track [X] ([name], ~[N]%)"]

Options:
  1. [Primary fix from action mapping table] — [expected impact]
  2. [Alternative fix from action mapping table] — [trade-offs]
  3. Defer — add to next session goals
  4. Skip — no action needed

Recommendation: Option [N] because [rationale based on score severity, trend
direction, and whether it's already tracked]
```

---

## Anti-Patterns (Expanded)

### 1. Running during PR review

Health checks reflect the full repo state, not the PR diff. Running mid-review
gives misleading results — issues from other parts of the codebase pollute the
triage. Run health checks on `main` or at session start, not during review.

### 2. Fixing all F-grades in one session

Scope explosion. Each F-grade dimension can require 30+ minutes to properly
address. If 3+ dimensions are F-grade, pick the highest-impact one, defer the
rest to dedicated sessions.

### 3. Ignoring trend direction

A B-grade (82) that was A (91) last week is more concerning than a C-grade (72)
that was D (58) last week. Always consider trend direction alongside absolute
score. Degrading trends on good scores warrant investigation.

### 4. Re-running to see improvement

Each run appends to `ecosystem-health-log.jsonl`. Running 5 times in a session
creates 5 data points, and the trend computation treats them all as sequential
history. This distorts the trend line. Run once per session unless actively
debugging the health system itself.

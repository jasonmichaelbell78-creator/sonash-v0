---
name: comprehensive-ecosystem-audit
description: |
  Orchestrates all 7 ecosystem audits in staged waves with 4-concurrent-agent
  limit, aggregates results into a unified health report with cross-audit
  insights, domain heat maps, and priority-ranked findings.
supports_parallel: true
fallback_available: false
estimated_time_parallel: 30 min
estimated_time_sequential: 90 min
---

<!-- prettier-ignore-start -->
**Document Version:** 1.1
**Last Updated:** 2026-02-24
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Comprehensive Ecosystem Audit

Orchestrates all 7 ecosystem audits (hook, session, TDMS, PR, skill, doc,
script) in 2 staged waves, aggregates results into a unified health report.

**Invocation:** `/comprehensive-ecosystem-audit`

**Output:** `COMPREHENSIVE_ECOSYSTEM_AUDIT_REPORT.md` in the project root.

---

## CRITICAL RULES

1. **CHECK for saved progress first** -- resume from
   `.claude/tmp/comprehensive-ecosystem-audit-progress.json` if < 2 hours old.
2. **Run audits via npm scripts / node commands**, not by reading checker code.
3. **CRITICAL RETURN PROTOCOL:** Each agent saves JSON to
   `.claude/tmp/ecosystem-{name}-result.json` and returns ONLY:
   `COMPLETE: {audit-name} grade {grade} score {score} errors {N} warnings {N} info {N}`
4. **Check completion via `wc -l`/`wc -c` on output files**, never read full
   output into context.
5. **Save progress after each stage** to survive context compaction.

---

## Compaction Guard

State file: `.claude/tmp/comprehensive-ecosystem-audit-progress.json`

Tracks stages (pending/completed), individual audit status
(pending/running/completed/failed), and result summaries (grade, score, counts).

| State                         | Resume Action                        |
| ----------------------------- | ------------------------------------ |
| No file or > 2 hours old      | Start fresh                          |
| Stage 1 partial               | Re-run pending/failed Stage 1 audits |
| Stage 1 done, Stage 2 pending | Run Stage 2                          |
| Stage 2 done, Stage 3 pending | Run Stage 3 (aggregation)            |
| Stage 3 done                  | Display final report                 |

> **Details:** See
> [reference/RECOVERY_PROCEDURES.md](reference/RECOVERY_PROCEDURES.md)

---

## Stage 1: Foundation Audits (4 parallel)

**Dependencies:** All 4 agents are independent. Stage 2 depends on Stage 1.

| Agent | Audit   | Script                                                                                                 | Result File                     |
| ----- | ------- | ------------------------------------------------------------------------------------------------------ | ------------------------------- |
| 1     | Hook    | `node .claude/skills/hook-ecosystem-audit/scripts/run-hook-ecosystem-audit.js --batch --summary`       | `ecosystem-hook-result.json`    |
| 2     | Session | `node .claude/skills/session-ecosystem-audit/scripts/run-session-ecosystem-audit.js --batch --summary` | `ecosystem-session-result.json` |
| 3     | TDMS    | `node .claude/skills/tdms-ecosystem-audit/scripts/run-tdms-ecosystem-audit.js --batch --summary`       | `ecosystem-tdms-result.json`    |
| 4     | PR      | `node .claude/skills/pr-ecosystem-audit/scripts/run-pr-ecosystem-audit.js --batch --summary`           | `ecosystem-pr-result.json`      |

After completion: verify files exist, check sizes with `wc -c`, update progress.

> **Details:** See [reference/WAVE_DETAILS.md](reference/WAVE_DETAILS.md)

---

## Stage 2: Extended Audits (3 parallel)

| Agent | Audit  | Script                                                                                               | Result File                    |
| ----- | ------ | ---------------------------------------------------------------------------------------------------- | ------------------------------ |
| 5     | Skill  | `node .claude/skills/skill-ecosystem-audit/scripts/run-skill-ecosystem-audit.js --batch --summary`   | `ecosystem-skill-result.json`  |
| 6     | Doc    | `node .claude/skills/doc-ecosystem-audit/scripts/run-doc-ecosystem-audit.js --batch --summary`       | `ecosystem-doc-result.json`    |
| 7     | Script | `node .claude/skills/script-ecosystem-audit/scripts/run-script-ecosystem-audit.js --batch --summary` | `ecosystem-script-result.json` |

---

## Stage 3: Aggregation & Report Generation

Sequential. Read ONLY summary sections from each result file (first 50 lines or
`summary` key).

### Weighted Health Grade

| Audit   | Weight | Rationale                    |
| ------- | ------ | ---------------------------- |
| Hook    | 15%    | Core infrastructure          |
| Session | 10%    | Session management           |
| TDMS    | 15%    | Debt tracking                |
| PR      | 15%    | Review workflow quality gate |
| Skill   | 20%    | Largest surface area         |
| Doc     | 10%    | Supporting infrastructure    |
| Script  | 15%    | Build/test/deploy pipeline   |

Formula: `overallScore = sum(score * weight) / sum(completed_weights)` Grades:
A=90+, B=80+, C=70+, D=60+, F=<60.

### Cross-Audit Analysis

1. **Domain Heat Map** -- bottom 10 category scores across all audits
2. **Shared File Hotspots** -- files in findings from 3+ audits
3. **Common Pattern Violations** -- anti-patterns in multiple audits
4. **Top 20 Findings** -- top 3 from each audit, ranked by impact

### Report Output

Write `COMPREHENSIVE_ECOSYSTEM_AUDIT_REPORT.md`: Executive Summary, Audit
Results table, Domain Heat Map, Top 20 Priority Findings, Cross-Audit Insights
(hotspots, patterns, gaps), Recommendations, Appendix (scripts, failed audits).

### Cleanup

Update progress to completed, delete result files and progress file, present
summary.

---

## Partial Failure Handling

If audit(s) fail: mark as "failed", log error, continue with remaining. Compute
weighted average using only completed audits. Note missing coverage in report.
**Never block entire audit for one sub-audit failure.**

---

## When to Use

- Quarterly health check
- After major refactoring
- Before a release
- After adding new hooks/skills/scripts

## When NOT to Use

- Quick single-domain check (use individual audit skills)
- Debugging specific issues (use `/systematic-debugging`)
- When context budget is tight (7 agent launches)

## Related Skills

Individual audits: `/hook-ecosystem-audit`, `/session-ecosystem-audit`,
`/tdms-ecosystem-audit`, `/pr-ecosystem-audit`, `/skill-ecosystem-audit`,
`/doc-ecosystem-audit`, `/script-ecosystem-audit`. Also: `/audit-comprehensive`
(9-domain code audit -- different scope).

---

## Version History

| Version | Date       | Description                                            |
| ------- | ---------- | ------------------------------------------------------ |
| 1.1     | 2026-02-24 | Trim to <500 lines: condense tables and agent prompts  |
| 1.0     | 2026-02-24 | Initial -- 7 audits in 2 staged waves with aggregation |

# Ecosystem Audit: Closure & Guard Rails

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-25
**Status:** ACTIVE
<!-- prettier-ignore-end -->

Shared closure procedures, guard rails, process self-audit checklist, benchmarks
convention, and checker development guide for all ecosystem audit skills.

**Usage:** Add this to your ecosystem audit SKILL.md:

```markdown
## Closure

> Read `.claude/skills/_shared/ecosystem-audit/CLOSURE_AND_GUARDRAILS.md` for
> the closure protocol (learnings, invocation tracking, cleanup, guard rails).
```

---

## Learning Loop & Closure (MUST)

### 1. Auto-Learnings (MUST)

Generate 2-3 data-driven insights from audit results. Examples:

- "Top regressing category: {X}."
- "Most-fixed category: {Y}."
- "Recurring issue: {Z} poor for {N} consecutive runs."

Save to history entry `learnings` field.

### 2. Optional User Feedback (SHOULD)

"Any additional observations or patterns the checkers should learn?"

Accept empty / "none" to proceed. If provided, save to history JSONL
`process_feedback` or `feedback` field.

### 3. Invocation Tracking (MUST)

```bash
cd scripts/reviews && npx tsx write-invocation.ts --data '{"skill":"{audit-name}-ecosystem-audit","type":"skill","success":true,"context":{"score":SCORE,"grade":"GRADE"}}'
```

### 4. Closure Signal (MUST)

```
Audit complete. Artifacts:
  - Report: .claude/tmp/{audit-name}-audit-report-{date}.md
  - Decision log: .claude/tmp/{audit-name}-audit-session-{date}.jsonl
  - Trend entry: .claude/state/{audit-name}-ecosystem-audit-history.jsonl
```

### 5. Cleanup (SHOULD)

Delete `.claude/tmp/{audit-name}-audit-progress.json`. On session-end, delete
any `.claude/tmp/{audit-name}-audit-*` files older than 2 hours.

### 6. On Next Startup (MUST)

If history JSONL has entries, surface previous auto-learnings and user feedback:
"Previous run noted: [learnings]. User feedback: [if any]."

---

## Process Self-Audit Checklist (MUST)

Verify the audit's own process was followed correctly:

- [ ] Script was run before generating findings (Critical Rule 2)
- [ ] Dashboard was displayed before walkthrough (Critical Rule 3)
- [ ] Conversational Q&A used, not AskUserQuestion (Critical Rule 4)
- [ ] Progress saved after every decision (Critical Rule 5)
- [ ] All ERROR findings addressed (fixed, deferred, or skipped with
      justification)
- [ ] TDMS entries created for all deferred findings
- [ ] `__tests__/` suite passes (run:
      `node --test .claude/skills/{audit-name}/scripts/__tests__/*.test.js`)

Present: "Process self-audit: N/N checks passed." Fix any failures before
proceeding.

---

## Guard Rails

### Zero Findings

Skip the walkthrough entirely. Display the dashboard with all-green scores and
go directly to the Trend Report: "Clean audit -- no findings. Score: {grade}
({score}/100)."

### Scope Explosion

- More than 30 findings: offer filtered review (errors-only, top-20 by impact,
  or review all)
- More than 50 findings: offer top-20 review + batch for the rest

### Disengagement

If user says "pause" or "stop":

1. Save progress immediately
2. Show resume instructions (`/{audit-name}` auto-resumes)
3. List decisions made so far
4. Exit cleanly

### Script Failure

If audit script crashes or returns malformed JSON:

1. Report the error clearly
2. Suggest running the related test suite or base health check for diagnostics
3. Do NOT proceed with empty data

### Contradiction Detection

Post-walkthrough scan for conflicting decisions. Present any conflicts for
resolution before finalizing.

---

## Benchmarks Convention

Internal benchmarks are defined in `scripts/lib/benchmarks.js`. Each category
scores 0-100 with ratings:

| Rating  | Score Range | Badge  |
| ------- | ----------- | ------ |
| Good    | 90-100      | "Good" |
| Average | 70-89       | "Avg"  |
| Poor    | 0-69        | "Poor" |

The composite grade uses weighted average across all categories with domain
weights that sum to 100%:

| Grade | Score Range |
| ----- | ----------- |
| A     | 90+         |
| B     | 80-89       |
| C     | 70-79       |
| D     | 60-69       |
| F     | < 60        |

---

## Checker Development Guide

### Adding a New Category

1. Choose the appropriate domain checker in `scripts/checkers/` (within the
   skill's `scripts/` directory)
2. Add a new check function following the pattern of existing categories
3. Add benchmarks to `scripts/lib/benchmarks.js`
4. Add weight to `CATEGORY_WEIGHTS` in benchmarks.js (adjust existing weights to
   maintain 100% total)
5. Add labels to the orchestrator's `CATEGORY_LABELS` and `CATEGORY_DOMAIN_MAP`
6. Test: run the audit script with `--summary` flag

---

## Dependency Constraints & Orchestration

### Single-Threaded Sequential Workflow

Each ecosystem audit runs as a single-threaded sequential workflow. It does not
spawn parallel agents internally.

### Comprehensive Audit Integration

When invoked as part of `/comprehensive-ecosystem-audit`:

- Run with `--batch --summary` flags for non-interactive orchestrated runs
- Save JSON result to `.claude/tmp/ecosystem-{audit-name}-result.json`
- Return ONLY:
  `COMPLETE: {audit-name} grade {grade} score {score} errors {N} warnings {N} info {N}`

---

## Artifact Contracts

| Artifact      | Producer                   | Consumer             | Lifetime                           |
| ------------- | -------------------------- | -------------------- | ---------------------------------- |
| Progress file | This skill                 | This skill (resume)  | Ephemeral -- deleted on completion |
| Session log   | This skill                 | Current session only | Ephemeral                          |
| History JSONL | Audit script               | This skill (trends)  | Persistent -- append-only          |
| DEBT entries  | This skill via `/add-debt` | TDMS pipeline        | Persistent                         |

---

## Version History

| Version | Date       | Description                             |
| ------- | ---------- | --------------------------------------- |
| 1.0     | 2026-03-25 | Extracted from 8 ecosystem audit skills |

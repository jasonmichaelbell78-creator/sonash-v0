---
name: health-ecosystem-audit
description: >-
  Comprehensive diagnostic of the health monitoring ecosystem — 25 categories
  across 6 domains with composite health scoring, trend tracking, live test
  execution, patch suggestions, and interactive finding-by-finding walkthrough.
---

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-10
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Health Ecosystem Audit

Deep diagnostic of the health monitoring system — `scripts/health/` checkers,
scoring pipeline, data persistence, consumer integration, test coverage, and
mid-session alert system. Produces per-category scores, a composite health grade
(A-F), trend tracking, live test execution, and an interactive walkthrough with
patch suggestions.

**Invocation:** `/health-ecosystem-audit`

## Critical Rules (MUST follow)

1. **CHECK for saved progress first** (MUST) — resume from
   `.claude/tmp/health-audit-progress.json` if it exists and is < 2 hours old.
2. **ALWAYS run the script first** (MUST) — never generate findings without
   data.
3. **ALWAYS display the dashboard** (MUST) — show to user before walkthrough.
4. **Use conversational Q&A for decisions** (MUST) — NEVER use AskUserQuestion.
5. **SAVE progress after every decision** (MUST) — write updated state
   immediately.
6. **Show patch suggestions inline** (SHOULD) — with each patchable finding.
7. **Create TDMS entries** (MUST) — for deferred findings via `/add-debt`.
8. **Save decisions** (MUST) — to session log for audit trail.

---

## When to Use

- User explicitly invokes `/health-ecosystem-audit`
- After modifying `scripts/health/` checkers, lib, or scoring
- After changes to `data/ecosystem-v2/` JSONL schemas
- After health check test failures are observed
- After modifying mid-session alert system

## When NOT to Use

- Auditing hook infrastructure — use `/hook-ecosystem-audit`
- Auditing PR workflow — use `/pr-ecosystem-audit`
- Quick health check — use `node scripts/health/run-health-check.js`
- Interactive health dashboard with triage — use `/ecosystem-health`
- Running all ecosystem audits — use `/comprehensive-ecosystem-audit`

## Routing Guide

| Concern                        | Use                              |
| ------------------------------ | -------------------------------- |
| Health monitoring system audit | `/health-ecosystem-audit`        |
| Interactive health dashboard   | `/ecosystem-health`              |
| Hook internals, pre-commit     | `/hook-ecosystem-audit`          |
| PR review workflow             | `/pr-ecosystem-audit`            |
| Session lifecycle              | `/session-ecosystem-audit`       |
| Technical debt management      | `/tdms-ecosystem-audit`          |
| All of the above               | `/comprehensive-ecosystem-audit` |

---

## Process Overview

```
WARM-UP    Orientation     -> Effort estimate, process overview
PHASE 1a   Run & Parse     -> Audit script + session log
PHASE 1b   Live Tests      -> npm test execution (D5) [skippable]
PHASE 2    Dashboard       -> Composite grade, domain breakdown (worst first)
PHASE 3    Walkthrough     -> Interactive finding-by-finding decisions
PHASE 4    Summary         -> Decision aggregate + TDMS batch summary
PHASE 5    Process Audit   -> Verify process + run __tests__/ suite
PHASE 6    Verification    -> Re-run audit to confirm fixes
PHASE 7    Trend Report    -> Cross-run comparison
PHASE 8    Closure         -> Retro, invocation tracking, artifact list
```

---

## Warm-Up (MUST)

```
Health Ecosystem Audit
Phases: Run script -> Live tests -> Dashboard -> Walkthrough -> Summary
Estimated time: 15-30 min (depends on finding count + live test time)
Flags: --skip-live-tests available for faster structural-only runs
```

**Done when:** User confirms proceed.

---

## Compaction Guard

Path: `.claude/tmp/health-audit-progress.json`

> See `REFERENCE.md` for full schema.

### On Skill Start (MUST)

1. Check if progress file exists and is < 2 hours old
2. If yes: resume — display dashboard from saved data, skip re-running
3. If no: proceed to Phase 1a normally

### After Each Decision (MUST)

Update `currentFindingIndex`, append decision, write progress file.

---

## Dependency Constraints

Single-threaded sequential workflow. When invoked by
`/comprehensive-ecosystem-audit`, runs as independent parallel agent in Stage 1
with `--skip-live-tests` flag (D#49).

**Orchestrator return protocol:** Save JSON to
`.claude/tmp/ecosystem-health-result.json` and return ONLY:
`COMPLETE: health grade {grade} score {score} errors {N} warnings {N} info {N}`

---

## Phase 1a: Run & Parse (MUST)

1. Run the audit script (MUST):

   ```bash
   node .claude/skills/health-ecosystem-audit/scripts/run-health-ecosystem-audit.js --skip-live-tests
   ```

2. Parse v2 JSON output from stdout.
3. Create session log:
   `.claude/tmp/health-audit-session-{YYYY-MM-DD-HHMM}.jsonl`
4. Save initial progress state.

**Done when:** Script output parsed, session log created.

---

## Phase 1b: Live Test Execution (D#34)

Unless `--skip-live-tests` was requested:

1. Run `npm test` (full suite) — output captured and parsed
2. Parse results: total, pass, fail counts per test area
3. Merge live test findings into Phase 1a results
4. D5 scores updated with live data

**Done when:** Live test results merged, or skipped with note.

---

## Phase 2: Dashboard Overview (MUST)

Present dashboard (D#44: markdown table + sparkline trend indicators).

> See `REFERENCE.md` for full dashboard template.

Domains sorted by score ascending (D#35: worst first).

**Zero findings:** Skip to Phase 7. **With findings:** Begin walkthrough.

---

## Phase 3: Finding-by-Finding Walkthrough (MUST)

Sort findings by `impactScore` descending. Present using deep-plan Q&A format
(D#36): read file, show context, generate patch, preview, apply on approval.

### Batch Shortcuts (D#37)

After 3+ INFO/WARNING findings: offer batch acknowledgment. ERRORs always
individual.

### Decision Options

- **ERROR:** Fix Now, Defer (DEBT entry), Skip (with justification)
- **WARNING:** Fix Now, Defer, Skip
- **INFO:** Acknowledge, Defer

### Test Failure Triage (D#30)

Test failures from D5: Fix Now / Defer / Skip with investigation.

### Scope Explosion Guard

> 30 findings: offer filtered review options.

**MUST save progress after every decision.**

---

## Phase 4: Summary & Actions (MUST)

> See `REFERENCE.md` for summary template.

Write report to `.claude/tmp/health-audit-report-{YYYY-MM-DD}.md`.

---

## Phase 5: Process Self-Audit (MUST)

Verify audit process AND run `__tests__/` suite:

- [ ] Script was run before generating findings
- [ ] Dashboard displayed before walkthrough
- [ ] Conversational Q&A used (not AskUserQuestion)
- [ ] Progress saved after every decision
- [ ] All ERROR findings addressed
- [ ] TDMS entries created for deferred findings
- [ ] `__tests__/` suite passes (run:
      `node --test .claude/skills/health-ecosystem-audit/scripts/__tests__/*.test.js`)

---

## Phase 6: Verification Re-run (SHOULD)

Re-run audit to verify fixes improved score.

> See `REFERENCE.md` for verification template.

---

## Phase 7: Trend Report (SHOULD)

History: `.claude/state/health-ecosystem-audit-history.jsonl`

> See `REFERENCE.md` for trend template.

---

## Phase 8: Closure (MUST)

1. **Auto-learnings** (MUST): 2-3 data-driven insights
2. **Invocation tracking** (MUST):
   ```bash
   cd scripts/reviews && npx tsx write-invocation.ts --data '{"skill":"health-ecosystem-audit","type":"skill","success":true,"context":{"score":SCORE,"grade":"GRADE"}}'
   ```
3. **Closure signal** (MUST): List all artifacts
4. **Cleanup** (SHOULD): Delete progress file

---

## Guard Rails

- **Zero findings:** Skip walkthrough, go to Trend Report
- **Scope explosion:** >30 findings -> offer filtered review
- **Script failure:** Report error, suggest
  `node scripts/health/run-health-check.js`
- **Disengagement:** Save progress, show resume instructions

> See `REFERENCE.md` for category reference, benchmarks, schemas.

---

## Version History

| Version | Date       | Description                     |
| ------- | ---------- | ------------------------------- |
| 1.0     | 2026-03-10 | Initial implementation (D#1-52) |

---
name: hook-ecosystem-audit
description: >-
  Comprehensive diagnostic of the hook ecosystem — 19 categories across 6
  domains with composite health scoring, trend tracking, patch suggestions, and
  interactive finding-by-finding walkthrough. Covers Claude Code hooks,
  pre-commit pipeline, AND CI/CD pipeline health.
---

<!-- prettier-ignore-start -->
**Document Version:** 2.0
**Last Updated:** 2026-03-08
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Hook Ecosystem Audit

Deep diagnostic of the entire hook ecosystem — Claude Code hooks
(`.claude/hooks/`), shared libraries, pre-commit pipeline (`.husky/pre-commit`),
and state management. Produces per-category scores, a composite health grade
(A-F), trend tracking across runs, and an interactive walkthrough with patch
suggestions.

**Invocation:** `/hook-ecosystem-audit`

## Critical Rules (MUST follow)

1. **CHECK for saved progress first** (MUST) — resume from
   `.claude/tmp/hook-audit-progress.json` if it exists and is < 2 hours old.
   Never re-present findings that were already decided.
2. **ALWAYS run the script first** (MUST) — never generate findings without
   data. If no saved progress, run the audit script before anything else.
3. **ALWAYS display the dashboard** (MUST) — show to user before walkthrough.
4. **Use conversational Q&A for decisions** (MUST) — present findings in
   batches, collect decisions via conversation. NEVER use AskUserQuestion.
5. **SAVE progress after every decision** (MUST) — write updated state to
   progress file immediately.
6. **Show patch suggestions inline** (SHOULD) — with each patchable finding.
7. **Create TDMS entries** (MUST) — for deferred findings via `/add-debt`.
8. **Save decisions** (MUST) — to session log for audit trail.

---

## When to Use

- User explicitly invokes `/hook-ecosystem-audit`
- After adding, removing, or modifying hooks in `.claude/hooks/`
- After changes to `.husky/pre-commit` or `.claude/settings.json`
- After hook test failures are observed

## When NOT to Use

- Auditing PR workflow state — use `/pr-ecosystem-audit`
- Auditing session lifecycle — use `/session-ecosystem-audit`
- Auditing all ecosystems at once — use `/comprehensive-ecosystem-audit`
- Quick hook structural check — use `npm run hooks:test`
- Creating or modifying a hook — direct editing (no skill needed)

## Routing Guide

| Concern                           | Audit                            |
| --------------------------------- | -------------------------------- |
| Hook internals, pre-commit, CI/CD | `/hook-ecosystem-audit`          |
| PR review workflow                | `/pr-ecosystem-audit`            |
| Session lifecycle                 | `/session-ecosystem-audit`       |
| Technical debt management         | `/tdms-ecosystem-audit`          |
| Skill quality                     | `/skill-ecosystem-audit`         |
| Documentation                     | `/doc-ecosystem-audit`           |
| Script infrastructure             | `/script-ecosystem-audit`        |
| All of the above                  | `/comprehensive-ecosystem-audit` |

---

## Process Overview

```
WARM-UP    Orientation    → Effort estimate, process overview
PHASE 1    Run & Parse    → Hook tests + audit script + session log
PHASE 2    Dashboard      → Composite grade, domain breakdown
PHASE 3    Walkthrough    → Interactive finding-by-finding decisions
PHASE 4    Summary        → Decision aggregate + TDMS batch summary
PHASE 5    Process Audit  → Verify audit process was followed correctly
PHASE 6    Verification   → Re-run audit to confirm fixes worked
PHASE 7    Trend Report   → Cross-run comparison (if history exists)
PHASE 8    Closure        → Retro, invocation tracking, artifact list
```

---

## Warm-Up (MUST)

Present before any work:

```
Hook Ecosystem Audit
Phases: Run script → Dashboard → Interactive walkthrough → Summary → Verification
Estimated time: 15-30 min (depends on finding count)
```

**Done when:** User confirms proceed.

---

## Compaction Guard

Audits are long-running interactive workflows vulnerable to context compaction.

### State File

Path: `.claude/tmp/hook-audit-progress.json`

> See `REFERENCE.md` for full schema.

### On Skill Start (Before Phase 1) (MUST)

1. Check if `.claude/tmp/hook-audit-progress.json` exists and is < 2 hours old
2. If yes: **resume from saved position**
   - Display the dashboard from saved data (skip re-running the audit script)
   - Show: "Resuming audit from finding {n}/{total} ({n-1} already reviewed)"
   - List prior decisions: "{n} fixed, {n} skipped, {n} deferred"
   - Continue the walkthrough from `currentFindingIndex`
3. If no (or stale): proceed to Phase 1 normally

### After Each Decision (During Phase 3) (MUST)

After each decision, immediately save progress:

1. Update `currentFindingIndex` to the next finding
2. Append the decision to the `decisions` array
3. If "Fix Now" was chosen, append to `fixesApplied`
4. Write the updated JSON to `.claude/tmp/hook-audit-progress.json`

### On Audit Completion

After the closure summary, delete the progress file.

---

## Dependency Constraints

This skill runs as a single-threaded sequential workflow. It does not spawn
parallel agents internally. When invoked as part of
`/comprehensive-ecosystem-audit`, it runs as one of 4 independent parallel
agents in Stage 1 — no ordering required.

**Orchestrator return protocol** (MUST when invoked by
`/comprehensive-ecosystem-audit`): Save JSON to
`.claude/tmp/ecosystem-hook-result.json` and return ONLY:
`COMPLETE: hook grade {grade} score {score} errors {N} warnings {N} info {N}`

**Batch mode:** The audit script supports `--batch --summary` flags for
non-interactive orchestrated runs.

---

## Phase 1: Run & Parse (MUST)

1. Run the hook test suite (MUST):

   ```bash
   npm run hooks:test
   ```

   If tests fail, proceed with audit anyway but note test failures as additional
   context. The audit script reads source files, not test results.

2. Run the audit script (MUST — never generate findings without data):

   ```bash
   node .claude/skills/hook-ecosystem-audit/scripts/run-hook-ecosystem-audit.js
   ```

3. Parse the v2 JSON output from stdout (progress goes to stderr).

4. Create a session decision log file (MUST):
   - Path: `.claude/tmp/hook-audit-session-{YYYY-MM-DD-HHMM}.jsonl`
   - Schema per line:
     `{"findingIndex","category","severity","message","decision","note","timestamp"}`

5. Save initial progress state to `.claude/tmp/hook-audit-progress.json`.

**Done when:** Script output parsed, session log created, progress state saved.

---

## Phase 2: Dashboard Overview (MUST)

Present the dashboard to user (MUST — Critical Rule 3).

> See `REFERENCE.md` for the full dashboard template.

Present compact header with composite grade and domain breakdown table. Then:

**Zero findings:** If no findings, display dashboard with all-green scores and
skip to Phase 7 (Trend Report): "Clean audit — no findings. Score: {grade}
({score}/100)."

**With findings:** "Found N findings to review. Walking through each one
(impact-weighted)..."

**Done when:** Dashboard displayed to user.

---

## Phase 3: Finding-by-Finding Walkthrough (MUST)

Sort all findings by `impactScore` descending (highest impact first).

### Finding Presentation (Deep-Plan Q&A Format — MUST)

For each finding, present a context card with progress header, then use the
deep-plan Q&A format:

```
━━━ Finding {n}/{total} ({pct}% complete — {fixed} fixed, {deferred} deferred, {skipped} skipped) ━━━
{SEVERITY}  |  {domainLabel}: {categoryLabel}  |  Impact: {impactScore}/100

{message}

Evidence:
  {details}
```

Then present the finding using structured Q&A format:

- **Description:** What the finding means, with context and investigation (read
  the actual code before presenting — verify the finding is real)
- **Options:** Numbered list with pros/cons for each option
- **Recommendation:** Which option and why

If `patchable: true`, also show patch preview inline (SHOULD).

### Decision Collection (Conversational Q&A — MUST)

Present findings and collect decisions via conversation. NEVER use
AskUserQuestion.

**ERROR findings** — options: Fix Now, Defer (creates DEBT entry), or Skip with
documented false-positive justification

**WARNING findings** — options: Fix Now, Defer, Skip

**INFO findings** — options: Acknowledge, Defer

**To revise a previous decision**, note it during any later finding and it will
be captured in the session log.

### Batch Shortcuts (SHOULD)

After 3+ INFO findings: offer "N more INFO findings remaining. Review each, or
acknowledge all?"

After 3+ WARNING findings with no patches: offer similar batch option.

ERRORs are ALWAYS presented individually.

### Scope Explosion Guard (MUST)

If total findings > 30: "30+ findings detected. Options: review all, errors-only
(with summary of rest), or top-20 by impact?"

### Delegation Protocol (MUST)

If user says "you decide" or similar: accept all available patches, defer
findings without patches, log each as `delegated-accept`. Show summary of
delegated decisions.

### Handling Decisions

**Fix Now:** Apply patch if available, else provide guidance. Log to session
file. Create TDMS entries one-by-one during walkthrough (MUST — prevents loss on
compaction).

**Defer:** Create DEBT entry via `/add-debt` with severity S1 (errors) or S2
(warnings), category `engineering-productivity`, source_id
`review:hook-ecosystem-audit-{date}`. Log to session file.

**Skip:** Acknowledge without tracking. Log to session file.

### Post-Walkthrough Contradiction Check (SHOULD)

After all decisions, scan for contradictions (e.g., fixing a hook that a skipped
finding depends on). Present any conflicts for resolution.

**MUST save progress after every decision** (Critical Rule 5).

**Done when:** All findings reviewed (or batch-acknowledged).

---

## Phase 4: Summary & Actions (MUST)

> See `REFERENCE.md` for the full summary template.

Present the summary including decisions breakdown, patches applied, top 3 impact
areas, next steps, and TDMS batch summary listing all DEBT entries created.

Write summary to `.claude/tmp/hook-audit-report-{YYYY-MM-DD}.md` (MUST).

**Done when:** Summary displayed and persisted to file.

---

## Phase 5: Process Self-Audit (MUST)

Verify this audit's own process was followed correctly:

- [ ] Script was run before generating findings (Critical Rule 2)
- [ ] Dashboard was displayed before walkthrough (Critical Rule 3)
- [ ] Conversational Q&A used, not AskUserQuestion (Critical Rule 4)
- [ ] Progress saved after every decision (Critical Rule 5)
- [ ] All ERROR findings addressed (fixed, deferred, or skipped with documented
      false-positive justification)
- [ ] TDMS entries created for all deferred findings
- [ ] `__tests__/` suite passes (run:
      `node --test .claude/skills/hook-ecosystem-audit/scripts/__tests__/*.test.js`)

Present: "Process self-audit: N/N checks passed." Fix any failures before
proceeding.

### Gate Effectiveness Review (L6 — SHOULD)

For each pre-commit and pre-push gate, check:

1. **Override frequency:** Read `.claude/state/override-log.jsonl` — if a gate
   was overridden >50% of the time in the last 30 days, flag it as ineffective.
2. **False positive rate:** If a gate's warnings are repeatedly pre-existing
   debt (not new violations), it may need baseline support.
3. **Catch rate:** Did the gate ever block a real problem? If no evidence in
   override log or warning log of it catching issues, consider removing it.

Present gates with effectiveness scores:
`{gate}: {override%} override rate, {effectiveness} rating (effective/questionable/ineffective)`.

### Coverage Cross-Check (Side Note — SHOULD)

Verify these mini-audit categories are covered by audit checkers. Flag any that
lack automated detection:

- Override audit trail (C1) — D5 state integration
- Warning aggregation (C2) — D5 state integration
- Learnings/improvement loop (C3) — manual review only
- Pre-existing debt handling (C4) — D3 pre-commit pipeline
- Cross-system integration (C5) — manual review only
- Gate effectiveness (C7) — Gate Effectiveness Review above
- Trigger system (C9) — D4 functional correctness

**Done when:** All process checks pass.

---

## Phase 6: Verification Re-run (SHOULD)

Re-run the audit to verify fixes improved the score:

1. Run `npm run hooks:test`
2. Run the audit script again
3. Compare new vs Phase 2 score

> See `REFERENCE.md` for the verification template.

If score improved, append to trend history. If score did not improve,
investigate — fixes may have introduced new findings.

**Done when:** Verification score compared and recorded.

---

## Phase 7: Trend Report (SHOULD — skip if no history)

Trend history: `.claude/state/hook-ecosystem-audit-history.jsonl` (one JSONL
entry per run, written by the audit script automatically).

If no previous entries exist: "First audit run — no trend data available." Skip
to Phase 8.

> See `REFERENCE.md` for the trend report template.

**Done when:** Trend displayed (or skipped with note).

---

## Phase 8: Closure (MUST)

1. **Auto-learnings** (MUST): Generate 2-3 data-driven insights from audit
   results (top regressing category, most-fixed category, recurring issues).
   Save to history entry `learnings` field.
2. **Optional user feedback** (SHOULD): "Any additional observations?" Accept
   empty / "none" to proceed. If provided, save to `process_feedback` field.

3. **Invocation tracking** (MUST):

   ```bash
   cd scripts/reviews && npx tsx write-invocation.ts --data '{"skill":"hook-ecosystem-audit","type":"skill","success":true,"context":{"score":SCORE,"grade":"GRADE"}}'
   ```

4. **Closure signal** (MUST):

   ```
   Audit complete. Artifacts:
     - Report: .claude/tmp/hook-audit-report-{date}.md
     - Decision log: .claude/tmp/hook-audit-session-{date}.jsonl
     - Trend entry: .claude/state/hook-ecosystem-audit-history.jsonl
   ```

5. **Cleanup** (SHOULD): Delete `.claude/tmp/hook-audit-progress.json`. On
   session-end, delete any `.claude/tmp/hook-audit-*` files older than 2 hours.

**On next startup** (MUST): If history JSONL has entries, surface previous
auto-learnings and user feedback: "Previous run noted: [learnings]. User
feedback: [if any]."

**Done when:** Learnings generated, invocation tracked, closure signal shown.

---

## Guard Rails

- **Zero findings:** Skip walkthrough, go to Trend Report (Phase 7)
- **Scope explosion:** >30 findings → offer filtered review
- **Disengagement:** If user says "pause" or "stop": save progress, show resume
  instructions (`/hook-ecosystem-audit` auto-resumes), list decisions, exit
- **Script failure:** If audit script crashes or returns malformed JSON, report
  error and suggest `npm run hooks:test` for basic diagnostics
- **Contradiction:** Post-walkthrough scan for conflicting decisions

> See `REFERENCE.md` for category reference, benchmarks, data sources,
> architecture diagram, and checker development guide.

---

## Version History

| Version | Date       | Description                                             |
| ------- | ---------- | ------------------------------------------------------- |
| 2.0     | 2026-03-08 | Skill audit rewrite: 34 decisions, REFERENCE extraction |
| 1.2     | 2026-02-24 | Add D6: CI/CD Pipeline Health (3 categories)            |
| 1.1     | 2026-02-24 | Add compaction guard for progress persistence           |
| 1.0     | 2026-02-23 | Initial implementation                                  |

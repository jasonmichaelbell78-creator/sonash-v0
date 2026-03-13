# PR Retro — Reference

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-06
**Status:** ACTIVE
<!-- prettier-ignore-end -->

Companion reference for pr-retro SKILL.md. Contains templates, schemas, known
churn patterns, and detailed guidance extracted from the core skill to stay
under 300 lines.

---

## Finding Presentation Template

MUST use this template for every finding in the interactive walkthrough (Step
3).

```
---
### Finding N of M: [Title]
**Category:** [Ping-Pong | Recurring Pattern | Process Gap | Rejection Analysis | Scope Creep | ...]
**Evidence:** [Observed] Rounds R3, R5, R7 — file.js modified in all three
  [Inferred] This suggests a propagation failure pattern
**Severity:** High/Medium/Low | **Integration:** [Add to FIX_TEMPLATES | Update .qodo | None]

[Description paragraph — what happened, why it matters]

**Options:**
A. [Action] (Recommended) — Rationale: ...
B. [Alternative] — Rationale: ...
C. No action — Rationale: ...

**Verify:** `grep -n "pattern" target-file`

Your decision? [default: A]
---
```

**Rules:**

- Mark all evidence as `[Observed]` (data-driven) or `[Inferred]` (conclusion)
- Every finding MUST have a verify command stored with the decision
- Include `Integration:` field showing which downstream files need updating
- Show progress after each decision: `[N/M findings complete | K action items]`

---

## JSONL Record Schemas

### Retro Record (write-retro-record.js)

Required fields for `write-retro-record.js`:

| Field                | Type         | Description                                                                |
| -------------------- | ------------ | -------------------------------------------------------------------------- |
| pr                   | number       | PR number                                                                  |
| date                 | string       | YYYY-MM-DD                                                                 |
| schema_version       | number       | Always 1                                                                   |
| completeness         | string       | "full" or "partial"                                                        |
| completeness_missing | string[]     | Missing sections if partial                                                |
| origin               | object       | `{type: "pr-retro", pr: N, tool: "write-retro-record.ts"}`                 |
| session              | number\|null | Session number                                                             |
| top_wins             | string[]     | Top things that went well                                                  |
| top_misses           | string[]     | Top things that went wrong                                                 |
| process_changes      | string[]     | Recommended process changes                                                |
| action_items         | object[]     | Per-item tracking: `{title, status, verify_cmd, implemented_in, severity}` |
| score                | number       | 1-10 overall efficiency                                                    |
| metrics              | object       | `{total_findings: N, fix_rate: 0.8, pattern_recurrence: N}`                |
| process_feedback     | string\|null | User feedback on the retro process (learning loop)                         |

> Exact CLI invocation:
> `cd scripts/reviews && npx tsc && node dist/write-retro-record.js --data '<JSON>'`

### Invocation Record (write-invocation.js)

> `node dist/write-invocation.js --data '{"skill":"pr-retro","type":"skill","duration_ms":null,"success":true,"error":null,"context":{"pr":PR_NUM,"trigger":"user-invoked"}}'`

---

## Compaction State Schema

State file: `.claude/state/task-pr-retro.state.json`

```json
{
  "task": "PR Retro",
  "mode": "single|batch",
  "prs_selected": [123, 456],
  "current_pr": 123,
  "current_pr_index": 0,
  "step": "dashboard|gathering|warmup|walkthrough|validation|saving|verification|complete",
  "current_finding": 3,
  "total_findings": 14,
  "finding_decisions": [
    {
      "finding": 1,
      "title": "...",
      "decision": "A",
      "action_item": "...",
      "verify_cmd": "...",
      "severity": "High",
      "implementation_status": "implemented|blocked|deferred|rejected",
      "verify_result": "pass|fail|skipped"
    }
  ],
  "action_items_approved": [],
  "cross_pr_analysis_done": false,
  "updated": "ISO timestamp"
}
```

**Update after:** PR selection, each finding decision, action item approval,
each step completion. Non-negotiable for long-running interactive sessions.

---

## Batch Retro Scope

When multiple PRs are selected (USER-REQ-1):

- **Individual retros per PR** — each PR gets its own data gathering (Step 1),
  churn analysis (Step 2), and JSONL record (Step 4)
- **Single interactive walkthrough** — findings from all PRs are presented in
  one walkthrough, grouped by PR but in a continuous flow
- **One cross-PR systemic analysis** — runs once across the entire batch, not
  per-PR. This is the primary value of batching.
- **Aggregated closure summary** — one summary covering all PRs

---

## Known Churn Patterns

Patterns observed across multiple PRs. Reference during Step 2 analysis.

### Pattern 6: Filesystem Guard Lifecycle (realpathSync Edge Cases)

- **PRs:** #374 (4 rounds), #370 (3 rounds)
- **Fix:** Verify full lifecycle matrix before committing guard functions
- **Templates:** FIX_TEMPLATES #31, pr-review Step 0.5

### Pattern 7: Path Containment Direction Flip-Flop

- **PRs:** #374 (4 rounds R1-R4)
- **Fix:** Answer decision matrix (directions, separator, case, depth) before
  coding
- **Templates:** FIX_TEMPLATES #33, #9

### Pattern 8: Incremental Algorithm Hardening (**BLOCKING**)

- **PRs:** #379 (7 rounds, 4 avoidable ~57%), #394 (12 rounds — CC extraction
  appeared in 5 rounds; `isInsideTryBlock` parent traversal appeared in PRs
  #374, #375, #388, #394)
- **Fix:** Use FIX_TEMPLATE #42 (visitChild CC extraction) IMMEDIATELY when any
  ESLint rule `create()` has CC >10. Do not wait for SonarCloud to flag it.
- **Templates:** FIX_TEMPLATES #34, #42
- **Status:** BLOCKING — 4th occurrence across PRs. Apply template proactively.

### Pattern 9: Dual-File JSONL Sync Fragility

- **PRs:** #383 (2 rounds), Sessions #134, #138
- **Fix:** Atomic dual-JSONL write pattern with rollback
- **Templates:** FIX_TEMPLATES #36

### Pattern 10: Stale Reviewer Comments (Ghost Feedback)

- **PRs:** #388 R7 (3 items)
- **Fix:** Compare reviewer's commit against HEAD before investigating. If
  stale, reject all items as batch.

### Pattern 11: Cross-Platform Path Normalization

- **PRs:** #388 (R5-R6), #391 (R1-R3), #392 (R3-R4)
- **Fix:** After fixing any path handling, grep the same file for ALL
  string-based path comparisons (includes, endsWith, has, startsWith) and verify
  each uses POSIX-normalized paths.
- **Templates:** FIX_TEMPLATES #40, pr-review Step 0.5 #14

### Pattern 12: ChainExpression Propagation

- **PRs:** #394 (R4-R5-R6)
- **Fix:** After adding ChainExpression support to one AST utility, audit ALL
  AST utilities for the same gap.
- **Templates:** FIX_TEMPLATES #43

### Pattern 13: Fix-One-Audit-All (Generalized)

- **PRs:** #388 (path normalization 3x), #394 (ChainExpression 3x, CC extraction
  5x)
- **Fix:** After fixing ANY pattern in one location, grep the codebase for all
  other instances and fix them in the same round.

---

## Pattern Lifecycle

A known churn pattern progresses through these stages:

1. **Discovered** — first occurrence documented with PR reference
2. **Confirmed** — recurred in 2+ PRs, fix template created
3. **Resolved** — hasn't recurred in 5+ PRs AND a permanent check exists in
   `check-pattern-compliance.js` or pre-commit hooks
4. **Graduated** — permanent check created, pattern archived to ARCHIVE.md with
   resolution date

**Graduation workflow:** When a pattern has recurred 5+ times AND has a clear
automated check, create a PR to add it to `check-pattern-compliance.js`. Update
the pattern entry with `status: graduated, check: <rule-name>`.

Patterns 1-5 are archived in [ARCHIVE.md](ARCHIVE.md).

---

## Verification Stage Criteria (Step 7)

The final verification stage audits BOTH the retro output AND the skill process
itself. Present results to the user grouped by section, flagging any failures.

### 1. Process Compliance (was the skill followed correctly?)

**Interactive Workflow:**

- [ ] Warm-up summary was presented (Step 1.5) and user confirmed proceed
- [ ] Every finding was presented individually (not batched except Low-severity
  > 15 threshold) with the REFERENCE.md template format
- [ ] Every finding decision was saved to state file after collection
- [ ] "Anything I missed?" prompt was asked after all findings
- [ ] Progress indicators shown after each finding (`[N/M complete | K items]`)

**Decision Logging:**

- [ ] State file exists at `.claude/state/task-pr-retro.state.json`
- [ ] State file contains a decision entry for every finding presented
- [ ] Every accepted action item has a stored verify command (not placeholder)
- [ ] Every decision records: finding title, user choice, action (if any)

**Action Item Follow-Through:**

- [ ] Action item approval gate (Step 6.1) was presented as a batch table
- [ ] User explicitly approved/modified/rejected each item (not auto-accepted)
- [ ] TDMS entries created for all approved items via `/add-debt`
- [ ] Repeat offenders flagged with escalation (Step 6.3)

### 2. Mandatory Section Checks (is the retro complete?)

- [ ] Review Cycle Summary with all rounds
- [ ] Per-Round Breakdown (every round covered)
- [ ] Ping-Pong Chains (tables or "none found")
- [ ] Rejection Analysis with accuracy calculation
- [ ] Recurring Patterns with automation candidates
- [ ] Previous Retro Audit + Cross-PR Systemic Analysis
- [ ] Skills/Templates to Update
- [ ] Process Improvements with evidence
- [ ] Verdict with efficiency assessment

### 3. Action Item Verification (were accepted changes actually done?)

For each accepted action item with a verify command:

1. Run the verify command against the current codebase state
2. If pass: mark `[VERIFIED]` — the change is confirmed in code
3. If fail: flag `[NOT IMPLEMENTED]` — present to user with options:
   - Implement now (do the work, re-verify)
   - Defer to TDMS (create debt entry, continue)
   - Reject (remove action item with rationale)

**Verify command quality check:**

- [ ] Every verify command is a real, runnable shell command (not a description)
- [ ] Commands target specific files/patterns (not generic `grep` with no path)
- [ ] Commands would actually fail if the change wasn't made

### 4. Data Integrity (were artifacts saved correctly?)

- [ ] JSONL record written and parseable (`cat retros.jsonl | tail -1 | jq .`)
- [ ] Markdown retro appended to log (grep for PR# in learnings log)
- [ ] `npm run reviews:sync -- --apply` succeeded
- [ ] Invocation record written
- [ ] Suppression syncs applied (if any rejections)
- [ ] State file updated to `status: complete`

### 5. Cross-PR Consistency (batch mode only)

- [ ] Each PR has an individual JSONL record
- [ ] Cross-PR systemic analysis covers all selected PRs
- [ ] No duplicate findings across PRs (deduplicated in walkthrough)
- [ ] Batch closure summary lists all PRs and their individual results

### Verification Report Format

Present to user as:

```
STEP 7: VERIFICATION REPORT
============================
Process Compliance:  [N/M passed]  [list failures]
Section Completeness: [N/9 sections] [list missing]
Action Items:        [N verified | M not implemented | K deferred]
Data Integrity:      [N/M passed]  [list failures]
Cross-PR (if batch): [N/M passed]  [list failures]

Overall: [PASS / FAIL with N issues]
[List each failure with resolution options]
```

If any failures: resolve interactively before proceeding to Step 8.

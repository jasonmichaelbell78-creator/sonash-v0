---
name: pr-retro
description:
  PR Review Retrospective -- actionable analysis of a PR's review cycle
---

<!-- prettier-ignore-start -->
**Document Version:** 2.7
**Last Updated:** 2026-02-24
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# PR Review Retrospective

Analyze the review cycle for a completed PR and produce a **comprehensive,
actionable retrospective**.

**Invocation:** `/pr-retro <PR#>`

**When to use:** When the user decides the review cycle is done.

---

## When to Use

- User explicitly invokes `/pr-retro`

## When NOT to Use

- When a more specialized skill exists for the specific task

## CRITICAL RULES

1. **ALWAYS produce the FULL retro** -- every mandatory section, every round.
2. **ALWAYS display the complete retro to the user** in conversation output.
3. **Every observation must have a recommended action** with estimated effort.
4. **Reference actual round data** -- specific rounds, files, items.
5. **Check previous retro action items** -- verify implemented vs documented.
6. **Cross-PR systemic analysis is mandatory** -- check last 3-5 retros.

---

## STEP 1: GATHER REVIEW DATA

### 1.1 Find All Review Rounds

Search `docs/AI_REVIEW_LEARNINGS_LOG.md` and `docs/archive/REVIEWS_*.md`. Read
EVERY entry in full -- item-level detail is required for churn analysis.

### 1.2 Extract Per-Round Data

For each round: number, date, source, total items (by severity), fixed/deferred/
rejected counts, pattern categories, files modified, new issues from prior
fixes.

### 1.3 Check Git History & TDMS

```bash
git log --oneline --grep="PR #${PR_NUM}" --grep="R[0-9]" --all-match
grep "pr-review" docs/technical-debt/MASTER_DEBT.jsonl | grep "${PR_NUM}"
```

### 1.4 Check Previous Retros (MANDATORY)

Read last 3-5 retros. For each action item: was it implemented? If not, how many
avoidable rounds did the gap cause?

---

## STEP 2: ANALYZE CHURN

1. **Ping-pong detection** -- same file in consecutive rounds? Fix for X created
   Y? Build detailed chain tables.
2. **Scope creep** -- items in non-PR files? Pre-existing vs This-PR origin?
3. **Recurring patterns** -- patterns in 3+ rounds = automation candidates
4. **Rejection analysis** -- group by reason, check false-positive rate by
   source

---

## STEP 3: PRODUCE ACTIONABLE OUTPUT (MANDATORY FORMAT)

Every section is MANDATORY. Scale depth to match review cycle complexity.

**Required sections:**

1. **Review Cycle Summary** -- table with rounds, items, fixed, deferred, etc.
2. **Per-Round Breakdown** -- ALL rounds with date, source, items, patterns
3. **Ping-Pong Chains** -- detailed chain tables or "none found"
4. **Rejection Analysis** -- categories, counts, accuracy calculation
5. **Recurring Patterns** -- automation candidates with effort estimates
6. **Previous Retro Action Item Audit** -- implemented? impact of gaps?
7. **Cross-PR Systemic Analysis** -- persistent patterns across PRs
8. **Skills/Templates to Update** -- FIX_TEMPLATES, pr-review, CODE_PATTERNS
9. **Process Improvements** -- specific changes with evidence from this PR
10. **Verdict** -- efficiency assessment, avoidable %, single highest-impact
    change, trend comparison

---

## STEP 4: SAVE TO LOG

Append the **complete retrospective** to `docs/AI_REVIEW_LEARNINGS_LOG.md`. Then
display the full retro to the user. Run `npm run reviews:sync -- --apply` to
sync to JSONL.

---

## STEP 5: ENFORCE ACTION ITEM TRACKING (MANDATORY)

### 5.1 Create TDMS Entries

Every action item not immediately implemented MUST get a DEBT entry via
`/add-debt` with severity S2 (or S1 if cross-PR systemic), category
`engineering-productivity`, source `review:pr-retro-<PR#>`.

### 5.2 Flag Repeat Offenders

Same action item in 2+ retros without implementation: escalate to S1, bold
warning **"BLOCKING -- recommended N times, never implemented"**, present as
blocking issue.

### 5.3 Verify Previous Tracking

```bash
grep "pr-retro" docs/technical-debt/MASTER_DEBT.jsonl
```

Create retroactive DEBT entries for untracked action items.

---

## KNOWN CHURN PATTERNS (Reference)

Patterns 1-5 (CC, symlink, JSONL noise, pattern checker, propagation) are
archived. See [ARCHIVE.md](ARCHIVE.md).

### Pattern 6: Filesystem Guard Lifecycle (realpathSync Edge Cases)

- **PRs:** #374 (4 rounds), #370 (3 rounds)
- **Fix:** Verify full lifecycle matrix before committing guard functions
- **Templates:** FIX_TEMPLATES #31, pr-review Step 0.5

### Pattern 7: Path Containment Direction Flip-Flop

- **PRs:** #374 (4 rounds R1-R4)
- **Fix:** Answer decision matrix (directions, separator, case, depth) before
  coding
- **Templates:** FIX_TEMPLATES #33, #9

### Pattern 8: Incremental Algorithm Hardening

- **PRs:** #379 (7 rounds, 4 avoidable ~57%)
- **Fix:** Algorithm Design Pre-Check in pr-review Step 0.5
- **Templates:** FIX_TEMPLATES #34

### Pattern 9: Dual-File JSONL Sync Fragility

- **PRs:** #383 (2 rounds), Sessions #134, #138
- **Fix:** Atomic dual-JSONL write pattern with rollback
- **Templates:** FIX_TEMPLATES #36

### Pattern 10: Stale Reviewer Comments (Ghost Feedback)

- **PRs:** #388 R7 (3 items)
- **Fix:** Compare reviewer's commit against HEAD before investigating. If
  stale, reject all items as batch.

---

## COMPLIANCE MECHANISMS

### Self-Validation Checklist

Before saving, verify ALL mandatory sections present:

- [ ] Review Cycle Summary + Per-Round Breakdown (all rounds)
- [ ] Ping-Pong Chains (tables or "none found")
- [ ] Rejection Analysis with accuracy calculation
- [ ] Recurring Patterns with automation candidates
- [ ] Previous Retro Audit + Cross-PR Systemic Analysis
- [ ] Skills/Templates to Update + Process Improvements
- [ ] Verdict with 4 required points
- [ ] TDMS entries for action items >5 min
- [ ] Full retro displayed to user
- [ ] `npm run reviews:sync -- --apply`

### Cross-Skill Integration

| Finding Type             | Action           | Target                        |
| ------------------------ | ---------------- | ----------------------------- |
| New automation candidate | Add pattern rule | `check-pattern-compliance.js` |
| New fix template needed  | Add template     | `FIX_TEMPLATES.md`            |
| Pre-push check missing   | Add to Step 0.5  | `pr-review SKILL.md`          |
| Recurring noise          | Add suppression  | `.qodo/suppression.yaml`      |
| Systemic issue           | Create DEBT      | TDMS via `/add-debt`          |

### Session Integration Points

- `/session-end` -- verify TDMS entries for action items
- `/session-begin` -- check open retro DEBT items
- `/pr-review` Step 0.5 -- check for recommended pre-push checks

---

## Version History

| Version | Date       | Description                                                |
| ------- | ---------- | ---------------------------------------------------------- |
| 2.7     | 2026-02-24 | Trim to <500 lines: archive patterns 1-5 to ARCHIVE.md     |
| 2.6     | 2026-02-24 | Add Pattern 10 (stale reviewer comments). Source: PR #388. |
| 2.5     | 2026-02-22 | Add Pattern 9 (dual-file JSONL sync). Source: PR #383.     |
| 2.4     | 2026-02-19 | Add Pattern 8 (algorithm hardening). Source: PR #379.      |
| 2.3     | 2026-02-18 | Add Patterns 6-7. Source: PR #374.                         |

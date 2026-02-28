---
name: pr-retro
description:
  PR Review Retrospective -- actionable analysis of a PR's review cycle
---

<!-- prettier-ignore-start -->
**Document Version:** 3.1
**Last Updated:** 2026-02-27
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# PR Review Retrospective

Analyze the review cycle for a completed PR and produce a **comprehensive,
actionable retrospective**.

**Invocation:**

- `/pr-retro` (no args) → **Missing Retros Dashboard**
- `/pr-retro <PR#>` → Single-PR retrospective

**When to use:** When the user decides the review cycle is done, or wants to
discover which PRs are missing retros.

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

## STEP 0: DETECT MODE

If **no PR# argument** is provided, run **Dashboard Mode** (below) instead of
the single-PR retro (Steps 1-5).

If a PR# is provided, skip to Step 1.

---

## DASHBOARD MODE: Missing Retros

When invoked as `/pr-retro` with no arguments, show a dashboard of merged PRs
that are missing retrospectives.

### D1. Get Merged PRs

```bash
gh pr list --state merged --limit 100 --json number,title,mergedAt,author
```

### D2. Get Existing Retros

Grep `docs/AI_REVIEW_LEARNINGS_LOG.md` and `docs/archive/REVIEWS_*.md` for retro
headers using a relaxed pattern:

```
/^###\s+PR\s+#(\d+)\s+Retrospective/
```

Collect all PR numbers that already have retros.

### D3. Filter Out Non-Candidates

A PR needs a retro only if it had review activity. Skip PRs that:

- Are **below the retro baseline** — PR number < 395. All PRs before #395 have
  been retroed or explicitly excluded as of 2026-02-27.
- Have **zero review entries** in `docs/AI_REVIEW_LEARNINGS_LOG.md`,
  `docs/archive/REVIEWS_*.md`, or `docs/reviews/reviews.jsonl`
- Are **automated/bot PRs** (author login contains `[bot]`, or title starts with
  `chore(deps)`, `build(deps)`, or `Bump `)

### D4. Compute Missing Set

Diff merged PRs against existing retros and non-candidates → missing retros.

### D5. Display Dashboard

Show a markdown table sorted by merge date (newest first):

```
| PR# | Title | Merged | Author |
|-----|-------|--------|--------|
| #NNN | ... | YYYY-MM-DD | ... |
```

If no PRs are missing retros, say: "All reviewed PRs have retros. Nice work!"

End with: **Run `/pr-retro <PR#>` to create a retro for any of these.**

**Dashboard mode ends here — do NOT continue to Steps 1-5.**

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

## STEP 5: SYNC REVIEWER SUPPRESSIONS (MANDATORY)

After producing the retro, sync any rejected items to reviewer configs:

### 5.0 Gemini Styleguide Sync

If any review items were **rejected 2+ times with the same rationale** (in this
PR or across PRs):

1. Check if the pattern is already in `.gemini/styleguide.md` under "Do NOT
   Flag"
2. If not, append it with:
   - The suppressed pattern description
   - Which PRs it was rejected in
   - Why it's a false positive
3. Mirror the same suppression to `.qodo/pr-agent.toml` if not already there

This prevents both Gemini and Qodo from re-raising the same rejected finding.

---

## STEP 6: ENFORCE ACTION ITEM TRACKING (MANDATORY)

### 6.1 Create TDMS Entries

Every action item not immediately implemented MUST get a DEBT entry via
`/add-debt` with severity S2 (or S1 if cross-PR systemic), category
`engineering-productivity`, source `review:pr-retro-<PR#>`.

### 6.2 Flag Repeat Offenders

Same action item in 2+ retros without implementation: escalate to S1, bold
warning **"BLOCKING -- recommended N times, never implemented"**, present as
blocking issue.

### 6.3 Verify Previous Tracking

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

- **PRs:** #394 (R4→R5→R6 — ChainExpression support added to one AST utility,
  then discovered missing in 2 more across subsequent rounds)
- **Fix:** After adding ChainExpression support to one AST utility, audit ALL
  AST utilities for the same gap:
  ```bash
  grep -rn 'node\.type\|callee\.type' eslint-plugin-sonash/ --include="*.js" | grep -v 'unwrapNode\|ChainExpression'
  ```
- **Templates:** FIX_TEMPLATES #43

### Pattern 13: Fix-One-Audit-All (Generalized)

- **PRs:** #388 (path normalization 3×), #394 (ChainExpression 3×, CC extraction
  5×)
- **Fix:** After fixing ANY pattern in one location, grep the codebase for all
  other instances of the same pattern gap and fix them in the same round. This
  is the generalized version of Patterns 5, 11, and 12.
- **Process:** Before committing a fix, run a propagation grep:
  1. Identify the pattern you just fixed (e.g., missing unwrapNode call)
  2. Grep for all files that have the same unpatched pattern
  3. Fix all instances in the same commit
- **Templates:** N/A (process pattern, not code template)

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
- [ ] Gemini/Qodo suppressions synced for rejected items (Step 5.0)
- [ ] Full retro displayed to user
- [ ] `npm run reviews:sync -- --apply`

### Cross-Skill Integration

| Finding Type             | Action             | Target                        |
| ------------------------ | ------------------ | ----------------------------- |
| New automation candidate | Add pattern rule   | `check-pattern-compliance.js` |
| New fix template needed  | Add template       | `FIX_TEMPLATES.md`            |
| Pre-push check missing   | Add to Step 0.5    | `pr-review SKILL.md`          |
| Recurring noise (Qodo)   | Add suppression    | `.qodo/pr-agent.toml`         |
| Recurring noise (Gemini) | Add to Do NOT Flag | `.gemini/styleguide.md`       |
| Systemic issue           | Create DEBT        | TDMS via `/add-debt`          |

### Session Integration Points

- `/session-end` -- verify TDMS entries for action items
- `/session-begin` -- check open retro DEBT items
- `/pr-review` Step 0.5 -- check for recommended pre-push checks

---

## Version History

| Version | Date       | Description                                                                                                                      |
| ------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 3.2     | 2026-02-27 | Add Step 5.0: Gemini styleguide sync for rejected items. Update cross-skill integration table. Renumber Steps 5→6.               |
| 3.1     | 2026-02-27 | Add retro baseline (PR >= 395) to dashboard D3 filter. All earlier PRs retroed or excluded.                                      |
| 3.0     | 2026-02-26 | Upgrade Pattern 8 to BLOCKING. Add Patterns 12-13 (ChainExpression propagation, fix-one-audit-all). Source: PR #393/#394 retros. |
| 2.9     | 2026-02-26 | Add dashboard mode: `/pr-retro` (no args) shows missing retros.                                                                  |
| 2.8     | 2026-02-25 | Add Pattern 11 (cross-platform path normalization). Source: PR #392 retro.                                                       |
| 2.7     | 2026-02-24 | Trim to <500 lines: archive patterns 1-5 to ARCHIVE.md                                                                           |
| 2.6     | 2026-02-24 | Add Pattern 10 (stale reviewer comments). Source: PR #388.                                                                       |
| 2.5     | 2026-02-22 | Add Pattern 9 (dual-file JSONL sync). Source: PR #383.                                                                           |
| 2.4     | 2026-02-19 | Add Pattern 8 (algorithm hardening). Source: PR #379.                                                                            |
| 2.3     | 2026-02-18 | Add Patterns 6-7. Source: PR #374.                                                                                               |

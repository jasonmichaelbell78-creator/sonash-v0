---
name: pr-retro
description:
  PR Review Retrospective — actionable analysis of a PR's review cycle
---

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-12
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# PR Review Retrospective

Analyze the review cycle for a completed (or ending) PR and produce **actionable
recommendations** — not just metrics.

**Invocation:** `/pr-retro <PR#>`

**When to use:** When the user decides the review cycle is done. There is no
automatic trigger — the user invokes this explicitly.

---

## STEP 1: GATHER REVIEW DATA

### 1.1 Find All Review Rounds

Search `docs/AI_REVIEW_LEARNINGS_LOG.md` and `docs/archive/REVIEWS_*.md` for all
entries matching the given PR number:

```bash
PR_NUM=$1

# Search active log
grep -n "PR #${PR_NUM}" docs/AI_REVIEW_LEARNINGS_LOG.md

# Search archives
grep -rn "PR #${PR_NUM}" docs/archive/REVIEWS_*.md 2>/dev/null
```

### 1.2 Extract Per-Round Data

For each round (R1, R2, ... RN), extract:

- **Round number** and date
- **Total items** (Critical / Major / Minor / Trivial counts)
- **Items fixed** vs **deferred** vs **rejected**
- **Pattern categories** mentioned (e.g., "symlink guards", "ReDoS", "cognitive
  complexity", "atomic writes")
- **Files modified** in that round

### 1.3 Check Git History

```bash
# Get all commits for this PR
git log --oneline --grep="PR #${PR_NUM}" --grep="R[0-9]" --all-match

# Or search by PR branch if known
git log --oneline origin/pr-branch-name
```

### 1.4 Check TDMS for Deferred Items

```bash
# Find all debt items sourced from this PR's reviews
grep "pr-review" docs/technical-debt/MASTER_DEBT.jsonl | grep "${PR_NUM}"
```

---

## STEP 2: ANALYZE CHURN

### 2.1 Ping-Pong Detection

Compare consecutive rounds to identify cases where fixing issues in round N
introduced new issues in round N+1:

- Did the same file appear in multiple consecutive rounds?
- Did a new CRITICAL or MAJOR item appear that wasn't in the previous round's
  original review feedback?
- Did the fix for issue X create issue Y? (Look for patterns like "R3 fixed
  regex, R4 flagged ReDoS in same regex")

### 2.2 Scope Creep Detection

Identify rounds where the reviewer flagged issues in files that weren't part of
the original PR diff. This isn't necessarily bad, but it extends the cycle:

- How many items per round were Origin: "Pre-existing" vs "This-PR"?
- Did fixing pre-existing items introduce new rounds?

### 2.3 Recurring Pattern Detection

Group all items across all rounds by pattern category. Flag any pattern that
appeared in 3+ rounds — these are automation candidates.

---

## STEP 3: PRODUCE ACTIONABLE OUTPUT

Present findings in this format. Every section must include a **specific
recommended action** — not just an observation.

```markdown
## PR #<N> Retrospective

### Review Cycle Summary

- **Rounds:** N (R1 on YYYY-MM-DD through RN on YYYY-MM-DD)
- **Total items processed:** X (Fixed: X, Deferred: X, Rejected: X)
- **TDMS items created:** X (DEBT-XXXX, DEBT-YYYY, ...)

### Churn Analysis

List each instance of ping-pong or scope creep with the specific rounds:

- R<X>->R<Y>: <what happened> (ping-pong / scope creep)
  - **Root cause:** <why this happened>
  - **Prevention:** <what would have avoided this>

### Recurring Patterns (Automation Candidates)

For each pattern that appeared 3+ times across rounds:

| Pattern | Rounds   | Already Automated? | Recommended Action                                |
| ------- | -------- | ------------------ | ------------------------------------------------- |
| <name>  | R1,R3,R7 | No                 | Add to check-pattern-compliance.js (est. ~30 min) |
| <name>  | R4,R5    | Yes (partial)      | Extend existing rule to cover edge case           |

### Skills/Templates to Update

If fixes repeatedly used the same technique:

- **FIX_TEMPLATES.md:** Add template for <pattern> (used in R2, R5, R7)
- **SKILL.md:** Add "<check X>" reminder to Step 5 (missed in R3, R6)
- **CODE_PATTERNS.md:** Document <pattern> if not already present

### Process Improvements

Specific changes to how reviews are conducted:

1. <Improvement> — because <evidence from this PR's rounds>
2. <Improvement> — because <evidence>

### Verdict

One-sentence assessment: Was the review cycle efficient, or were there avoidable
rounds? What's the single highest-impact change to prevent this in future PRs?
```

---

## STEP 4: SAVE TO MEMORY

Store the retrospective summary in MCP memory for cross-PR pattern detection:

```
mcp__memory__create_entities([{
  name: "PR-<N>-retro",
  entityType: "pr-retrospective",
  observations: [
    "PR #<N>: <rounds> rounds, <items> items, <deferred> deferred",
    "Recurring patterns: <list>",
    "Key lesson: <one-liner>"
  ]
}])
```

This enables future retrospectives to reference past PRs and detect systemic
patterns (e.g., "symlink guards have been flagged across PRs #358, #360, #362 —
this needs an architectural solution, not per-file fixes").

---

## RULES

1. **Every observation must have a recommended action** — "Cognitive complexity
   appeared 3 times" is useless without "Add eslint-plugin-cognitive-complexity
   or extend check-pattern-compliance.js"
2. **Be specific about effort** — "Add a pattern rule" should include estimated
   time (e.g., "~30 min" or "~2 hours")
3. **Reference actual round data** — Don't generalize. Point to specific rounds
   and items.
4. **Don't pad the output** — If the review cycle was clean (2 rounds, no
   churn), say so in 5 lines. Long retrospectives are only warranted for long
   review cycles.
5. **Flag systemic issues to the user** — If the same pattern keeps appearing
   across multiple PRs, explicitly call it out as needing architectural
   attention, not just another automation rule.

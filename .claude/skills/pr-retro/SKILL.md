---
name: pr-retro
description:
  PR Review Retrospective — actionable analysis of a PR's review cycle
---

<!-- prettier-ignore-start -->
**Document Version:** 2.1
**Last Updated:** 2026-02-17
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# PR Review Retrospective

Analyze the review cycle for a completed (or ending) PR and produce a
**comprehensive, actionable retrospective** — not abbreviated metrics.

**Invocation:** `/pr-retro <PR#>`

**When to use:** When the user decides the review cycle is done. There is no
automatic trigger — the user invokes this explicitly.

---

## CRITICAL RULES (Read First)

1. **ALWAYS produce the FULL retro** — every mandatory section, every round
   analyzed. Scale depth to match the review cycle: a 9-round PR gets a 9-round
   breakdown. Never abbreviate.
2. **ALWAYS display the complete retro to the user** in the conversation output.
   Do NOT just write to file silently. The user must see the full content.
3. **Every observation must have a recommended action** with estimated effort.
4. **Reference actual round data** — point to specific rounds, files, and items.
5. **Check previous retro action items** — verify what was actually implemented
   vs just documented. Unimplemented recurring recommendations are a finding.
6. **Cross-PR systemic analysis is mandatory** — check the last 3-5 retros for
   patterns that keep appearing despite recommendations.

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

**Read EVERY review entry in full.** Do not skim or summarize from headers. Each
round's item-level detail (files, severities, patterns, fix descriptions) is
required for accurate churn analysis.

### 1.2 Extract Per-Round Data

For each round (R1, R2, ... RN), extract:

- **Round number** and date
- **Review source** (CodeRabbit, Qodo, SonarCloud, CI)
- **Total items** (Critical / Major / Minor / Trivial counts)
- **Items fixed** vs **deferred** vs **rejected** (with rejection reasons)
- **Pattern categories** mentioned (e.g., "symlink guards", "ReDoS", "cognitive
  complexity", "atomic writes", "fail-closed catch")
- **Files modified** in that round
- **New issues introduced** by fixes from the previous round

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

### 1.5 Check Previous Retros (MANDATORY)

Read the last 3-5 PR retrospectives from the learnings log. Extract their action
items and verify which ones were actually implemented:

```bash
# Find recent retros
grep -n "Retrospective" docs/AI_REVIEW_LEARNINGS_LOG.md | tail -5
```

For each previous retro action item, check:

- Was it implemented? (grep codebase for evidence)
- If not, how many avoidable rounds did the gap cause in this PR?

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

**Build detailed ping-pong chain tables** showing the round-by-round escalation
for each chain (see Step 3 template).

### 2.2 Scope Creep Detection

Identify rounds where the reviewer flagged issues in files that weren't part of
the original PR diff:

- How many items per round were Origin: "Pre-existing" vs "This-PR"?
- Did fixing pre-existing items introduce new rounds?

### 2.3 Recurring Pattern Detection

Group all items across all rounds by pattern category. Flag any pattern that
appeared in 3+ rounds — these are automation candidates.

### 2.4 Rejection Analysis

Analyze all rejected items across all rounds:

- Group by rejection reason category
- Identify if any rejections were wrong (the reviewer was correct)
- Calculate the false-positive rate by review source

---

## STEP 3: PRODUCE ACTIONABLE OUTPUT (MANDATORY FORMAT)

**Every section below is MANDATORY.** Scale the depth to match the review cycle
complexity, but never omit sections. A 2-round clean cycle still gets all
sections (just shorter).

Present the retro in this format and **display it in full to the user**:

```markdown
## PR #<N> Retrospective

### Review Cycle Summary

| Metric         | Value                                   |
| -------------- | --------------------------------------- |
| Rounds         | N (R1 YYYY-MM-DD through RN YYYY-MM-DD) |
| Total items    | X                                       |
| Fixed          | X                                       |
| Deferred       | X (DEBT-XXXX, ...)                      |
| Rejected       | X                                       |
| Review sources | CodeRabbit, Qodo, SonarCloud            |

### Per-Round Breakdown (MANDATORY)

| Round     | Date       | Source     | Items | Fixed | Rejected | Key Patterns       |
| --------- | ---------- | ---------- | ----- | ----- | -------- | ------------------ |
| R1        | YYYY-MM-DD | Qodo       | X     | X     | X        | pattern1, pattern2 |
| R2        | YYYY-MM-DD | SonarCloud | X     | X     | X        | pattern3           |
| ...       | ...        | ...        | ...   | ...   | ...      | ...                |
| RN        | YYYY-MM-DD | Qodo       | X     | X     | X        | patternN           |
| **Total** |            |            | **X** | **X** | **X**    |                    |

### Ping-Pong Chains (MANDATORY)

For EACH identified chain, provide a detailed table showing the round-by-round
escalation:

#### Chain 1: <Pattern Name> (Rounds R<X>-R<Y>)

| Round  | What Happened         | Files Affected     | Root Cause             |
| ------ | --------------------- | ------------------ | ---------------------- |
| R<X>   | Initial finding: ...  | file1.js           | ...                    |
| R<X+1> | Fix introduced: ...   | file1.js, file2.js | Incomplete propagation |
| R<Y>   | Final resolution: ... | file1.js-fileN.js  | Full sweep applied     |

**Avoidable rounds:** N **Prevention:**
<specific action that would have prevented this chain>

#### Chain 2: ...

(repeat for each chain)

**Total avoidable rounds across all chains: N**

If no ping-pong was detected, state: "No ping-pong chains detected — clean
review cycle."

### Rejection Analysis (MANDATORY)

| Category             | Count | Examples                                                    |
| -------------------- | ----- | ----------------------------------------------------------- |
| Data quality (JSONL) | X     | "Replace placeholder title" — intentional audit data        |
| False positive       | X     | "Missing null check" — already handled upstream             |
| Style preference     | X     | "Use null instead of empty string" — not project convention |
| ...                  | ...   | ...                                                         |

**Rejection accuracy:** X/Y rejections were correct (Z% accuracy)

### Recurring Patterns (Automation Candidates)

For each pattern that appeared 3+ times across rounds:

| Pattern | Rounds   | Already Automated? | Recommended Action                 | Est. Effort |
| ------- | -------- | ------------------ | ---------------------------------- | ----------- |
| <name>  | R1,R3,R7 | No                 | Add to check-pattern-compliance.js | ~30 min     |
| <name>  | R4,R5    | Yes (partial)      | Extend existing rule               | ~15 min     |

### Previous Retro Action Item Audit (MANDATORY)

Check action items from the last 3-5 retros. For each:

| PR   | Action Item      | Implemented?  | Impact of Gap                           |
| ---- | ---------------- | ------------- | --------------------------------------- |
| #367 | Add CC lint rule | No            | ~6 avoidable rounds in PRs #368-#369    |
| #368 | Batch file audit | Yes (partial) | Reduced but didn't eliminate file churn |

**Total avoidable rounds from unimplemented retro actions: N**

If no previous retros exist, state: "No prior retros found for comparison."

### Cross-PR Systemic Analysis (MANDATORY)

Patterns that persist across multiple PRs despite being flagged:

| Pattern        | PRs Affected   | Times Recommended | Status              | Required Action               |
| -------------- | -------------- | ----------------- | ------------------- | ----------------------------- |
| CC lint        | #367,#368,#369 | 3x                | Never implemented   | MUST implement before next PR |
| Symlink guards | #366,#367      | 2x                | Implemented in #367 | Resolved                      |

### Skills/Templates to Update

- **FIX_TEMPLATES.md:** Add template for <pattern> (used in R2, R5, R7)
- **pr-review SKILL.md:** Add "<check X>" to Step 5 (missed in R3, R6)
- **CODE_PATTERNS.md:** Document <pattern> if not present
- **pr-retro SKILL.md:** <any improvements to this skill based on this retro>

### Process Improvements

Specific changes to how reviews are conducted, with evidence:

1. <Improvement> — evidence: <specific rounds from this PR>
2. <Improvement> — evidence: <specific rounds>

### Verdict

One-paragraph assessment covering:

1. Was the review cycle efficient or were there avoidable rounds?
2. What percentage of rounds were avoidable?
3. What's the single highest-impact change to prevent this in future PRs?
4. Comparison to previous PR retros — is the trend improving or worsening?
```

---

## STEP 4: SAVE TO LOG

Append the **complete retrospective** (not a summary) to the review learnings
log:

```bash
# Append to AI_REVIEW_LEARNINGS_LOG.md
# Format: ### PR #<N> Retrospective (YYYY-MM-DD)
# Include ALL sections from Step 3 — do not abbreviate
```

**THEN display the full retro to the user in the conversation.**

This enables future retrospectives to reference past PRs and detect systemic
patterns (e.g., "symlink guards have been flagged across PRs #358, #360, #362 --
this needs an architectural solution, not per-file fixes").

---

## RULES

1. **NEVER abbreviate the retro** — if there were 9 rounds, analyze all 9. The
   retro depth must match the review cycle depth. A 2-round cycle gets a concise
   retro; a 9-round cycle gets a comprehensive retro.
2. **ALWAYS display the full retro to the user** — writing to file is not
   sufficient. The user must see the complete output in the conversation.
3. **Every observation must have a recommended action** — "Cognitive complexity
   appeared 3 times" is useless without "Add eslint-plugin-cognitive-complexity
   or extend check-pattern-compliance.js (~30 min)"
4. **Be specific about effort** — every action item needs an estimate.
5. **Reference actual round data** — point to specific rounds, files, and items.
   Don't generalize.
6. **All mandatory sections are required** — per-round table, ping-pong chains,
   rejection analysis, previous retro audit, cross-PR systemic analysis. Even if
   a section has no findings, include it with an explicit "none found"
   statement.
7. **Flag systemic issues loudly** — if the same pattern keeps appearing across
   multiple PRs despite recommendations, call it out as a blocking issue that
   must be resolved before the next PR review cycle.
8. **Check previous retros first** — unimplemented action items that caused
   avoidable rounds in this PR are the highest-priority finding.
9. **Context compaction is not an excuse** — if earlier rounds were lost to
   compaction, re-read them from the learnings log. Every round must be
   analyzed.

---

## STEP 5: ENFORCE ACTION ITEM TRACKING (MANDATORY)

Retro action items that are only documented in the learnings log do NOT get
implemented. Evidence: CC lint rule recommended in PRs #367, #368, #369 — never
done, causing ~18 avoidable rounds across 4 PRs.

### 5.1 Create TDMS Entries for Each Action Item

Every action item from the retro that isn't immediately implemented MUST get a
DEBT entry via `/add-debt`:

```
For each action item in "Process Improvements" and "Skills/Templates to Update":
  - If implementable in <5 min: Do it NOW in this session
  - If >5 min: Create DEBT entry with:
    - severity: S2 (or S1 if cross-PR systemic)
    - category: engineering-productivity
    - source_id: "review:pr-retro-<PR#>"
    - Include estimated effort and avoidable-rounds impact
```

### 5.2 Flag Repeat Offenders

If the same action item appears in 2+ retros without implementation:

1. Escalate severity to S1
2. Add to the retro output with bold warning: **"BLOCKING — recommended N times,
   never implemented, ~X avoidable rounds"**
3. Present to user as a blocking issue requiring immediate scheduling

### 5.3 Verify Previous Action Items Were Tracked

Check if previous retro action items have DEBT entries:

```bash
grep "pr-retro" docs/technical-debt/MASTER_DEBT.jsonl
```

If action items exist only in the learnings log with no DEBT entry, create them
retroactively.

---

## KNOWN CHURN PATTERNS (Reference)

These patterns have been identified across PRs #366-#369 as the primary drivers
of review cycle churn. Use this reference during Step 2 analysis to quickly
identify known chains.

### Pattern 1: Cognitive Complexity (CC >15)

- **Frequency:** Every PR since #366 (19+ total rounds)
- **Root cause:** No CC lint rule; SonarCloud flags post-push
- **Signature:** SonarCloud "Refactor this function to reduce cognitive
  complexity from X to the 15 allowed"
- **Known fix:** `npx eslint --rule 'complexity: [error, 15]'` pre-push
- **Status as of PR #369:** Recommended 3x, never implemented
- **Templates:** Extract helpers to reduce CC (see R1-R8 patterns)

### Pattern 2: Incremental Security Hardening (Symlink/Write Path)

- **Frequency:** PRs #366, #368, #369 (16+ total rounds)
- **Root cause:** Fixing one write path per round instead of auditing all paths
- **Signature:** Qodo security suggestions for `writeFileSync`, `renameSync`,
  `appendFileSync` without guards
- **Known fix:** On first security flag, grep ALL write paths and fix in one
  pass
- **Escalation chain:** lstatSync → containment → realpathSync → atomic write →
  wx flag → ancestor check → fail-closed catch
- **Templates:** FIX_TEMPLATES.md #22 (atomic write), #27 (fd-based write), #28
  (fail-closed catch)

### Pattern 3: JSONL Data Quality Rejections (Noise)

- **Frequency:** Every round of every PR (~100 rejected items across 4 PRs)
- **Root cause:** Qodo flags pre-existing JSONL pipeline output data
- **Signature:** "Replace placeholder title", "Use null for empty fields",
  "Update file path", "Recompute content_hash"
- **Known fix:** Qodo suppression config for pipeline output files
- **Status as of PR #369:** Recommended 2x, never implemented

### Pattern 4: Pattern Checker Incomplete Modification

- **Frequency:** PRs #369 (3 rounds)
- **Root cause:** Adding one guard name or scan direction without enumerating
  all
- **Signature:** False positives in `check-pattern-compliance.js` after adding
  new patterns
- **Known fix:** When modifying the checker, enumerate ALL guard function names
  and ALL scan directions (forward + backward) in one pass

### Pattern 5: Propagation Failures

- **Frequency:** PRs #366, #367, #369
- **Root cause:** Fixing a pattern in the reported file without searching for
  same pattern across codebase
- **Signature:** Next round finds the same issue in a different file
- **Known fix:** After fixing any pattern-based issue, run:
  ```bash
  grep -rn "UNFIXED_PATTERN" scripts/ .claude/hooks/ --include="*.js"
  ```
  and fix ALL instances before committing

---

## COMPLIANCE MECHANISMS

The retro is only useful if it drives change. These mechanisms ensure compliance
with retro findings and this skill's structure.

### Mechanism 1: Self-Validation Checklist

Before saving the retro, verify ALL mandatory sections are present. If any
section is missing, DO NOT save — add the missing section first.

Checklist (verify before Step 4):

- [ ] Review Cycle Summary table present
- [ ] Per-Round Breakdown table with ALL rounds (not just "key" rounds)
- [ ] Ping-Pong Chains section with detailed tables (or explicit "none found")
- [ ] Rejection Analysis table with categories and accuracy calculation
- [ ] Recurring Patterns table with automation candidates
- [ ] Previous Retro Action Item Audit table (or "no prior retros")
- [ ] Cross-PR Systemic Analysis table
- [ ] Skills/Templates to Update section
- [ ] Process Improvements with evidence
- [ ] Verdict paragraph with 4 required points
- [ ] TDMS entries created for action items >5 min (Step 5)
- [ ] Full retro displayed to user in conversation
- [ ] Run `npm run reviews:sync -- --apply` to sync retro to JSONL

### Mechanism 2: Cross-Skill Integration

The retro feeds back into the review cycle. When the retro identifies:

| Finding Type                 | Action            | Target                             |
| ---------------------------- | ----------------- | ---------------------------------- |
| New automation candidate     | Add pattern rule  | `check-pattern-compliance.js`      |
| New fix template needed      | Add template      | `docs/agent_docs/FIX_TEMPLATES.md` |
| Pre-push check missing       | Add to Step 0.5   | `pr-review SKILL.md`               |
| Recurring rejection noise    | Add suppression   | `.qodo/suppression.yaml`           |
| Skill gap or missing step    | Update skill      | Target skill's `SKILL.md`          |
| Systemic architectural issue | Create DEBT entry | TDMS via `/add-debt`               |

### Mechanism 3: Retro-to-Retro Continuity

Each retro builds on the previous ones. To maintain continuity:

1. **Always read previous retros** (Step 1.5) — not optional
2. **Track action item implementation** — binary yes/no with evidence
3. **Calculate cumulative cost** of unimplemented items across PRs
4. **Escalate repeat offenders** — anything recommended 2+ times without
   implementation becomes S1 severity

### Mechanism 4: Session Integration Points

The retro connects to other session workflows:

- **`/session-end`** — If a retro was done this session, session-end should
  verify TDMS entries were created for action items
- **`/session-begin`** — Check if there are open retro action DEBT items that
  should be addressed before starting new PR work
- **`/pr-review` Step 0.5** — Check if previous retro recommended pre-push
  checks that should be run before first CI push

---

## Version History

| Version | Date       | Description                                                       |
| ------- | ---------- | ----------------------------------------------------------------- |
| 2.1     | 2026-02-17 | Add known patterns, TDMS enforcement, compliance mechanisms       |
| 2.0     | 2026-02-17 | Comprehensive format canonical: mandatory sections, display rules |
| 1.0     | 2026-02-12 | Initial version                                                   |

---
name: pr-retro
description: >-
  PR Review Retrospective -- actionable analysis of a PR's review cycle with
  interactive findings walkthrough, plus dashboard for missing retros
---

<!-- prettier-ignore-start -->
**Document Version:** 4.0
**Last Updated:** 2026-03-06
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# PR Review Retrospective

Analyze the review cycle for completed PRs and produce an **actionable
retrospective covering all review rounds** through an interactive
finding-by-finding walkthrough.

**Invocation:**

- `/pr-retro` (no args) → **Missing Retros Dashboard** with PR selection
- `/pr-retro <PR#>` → Single-PR retrospective
- `/pr-retro <PR#> --resume` → Resume interrupted retro from state file

## Routing Guide

- "Review this PR's code" → `/code-reviewer`
- "Process review feedback on active PR" → `/pr-review`
- "How healthy is our review process?" → `/pr-ecosystem-audit`
- "What went well/wrong in a completed PR's review cycle?" → `/pr-retro`

## When to Use

- User explicitly invokes `/pr-retro`
- Review cycle is complete and PR is merged

## When NOT to Use

- Processing active review feedback → use `/pr-review`
- Reviewing code quality → use `/code-reviewer`
- Auditing review ecosystem health → use `/pr-ecosystem-audit`

---

## CRITICAL RULES (MUST follow)

1. **MUST produce the FULL retro** — every mandatory section, every round.
2. **MUST present findings interactively** — one at a time with options.
3. **MUST save state after every finding decision** — compaction resilience.
4. **MUST include a verify command** for every accepted action item.
5. **MUST run final verification** before saving — verify commands, sections.
6. **MUST display closure summary** listing all artifacts produced.
7. Every observation MUST have a recommended action with estimated effort.
8. Cross-PR systemic analysis is MUST for every retro.
9. Follow CLAUDE.md Section 5 anti-patterns and Section 6 coding standards.
10. **MUST implement accepted action items** — retro is blocked until every item
    is done or user explicitly says "defer" or "create DEBT". No implicit
    deferral. No moving to Step 7 with unfinished items.

---

## STEP 0: DETECT MODE

- No PR# argument → **Dashboard Mode** (below)
- PR# provided → **Step 1** (single-PR retro)
- `--resume` flag → Read state file, skip to current finding

---

## DASHBOARD MODE: Missing Retros

### D1. Get Merged PRs

```bash
gh pr list --state merged --limit 100 --json number,title,mergedAt,author
```

### D2. Get Existing Retros

Search `docs/AI_REVIEW_LEARNINGS_LOG.md`, `docs/archive/REVIEWS_*.md`, AND
`docs/reviews/retros.jsonl` for existing retro entries.

### D3. Filter Out Non-Candidates

Skip PRs that:

- Are below the retro baseline (PR# < 395)
- Have zero review entries in any source (markdown, JSONL, archive)
- Are automated/bot PRs (author contains `[bot]`, title starts with
  `chore(deps)`, `build(deps)`, or `Bump `)

### D4. Compute Missing Set + Round Counts

For each missing PR, count review rounds from all sources.

### D5. Display Dashboard

| PR# | Title | Merged | Author | Rounds |
| --- | ----- | ------ | ------ | ------ |

**Action item summary:** "Across all retros: N action items total, M
implemented, K unverified." (Source: retros.jsonl)

### D6. PR Selection Prompt

"Which PRs would you like to retro? Enter numbers, 'all', or 'none'. [default:
all missing]"

If multiple selected, run as batch retro (see REFERENCE.md: Batch Retro Scope).

**Dashboard mode ends here — do NOT continue to Steps 1-7.**

---

## STEP 1: GATHER REVIEW DATA (MUST)

### 1.1 Find All Review Rounds

Search `docs/AI_REVIEW_LEARNINGS_LOG.md`, `docs/archive/REVIEWS_*.md`, and
`docs/reviews/reviews.jsonl`. Read EVERY entry in full.

### 1.2 Extract Per-Round Data

For each round: number, date, source, total items (by severity), fixed/deferred/
rejected counts, pattern categories, files modified, new issues from prior
fixes.

### 1.3 Check Git History & TDMS (SHOULD)

```bash
git log --oneline --grep="PR #${PR_NUM}" --grep="R[0-9]" --all-match
grep "pr-review" docs/technical-debt/MASTER_DEBT.jsonl | grep "${PR_NUM}"
```

### 1.4 Check Previous Retros (MUST)

Read last 3-5 retros. For each action item: run its stored verify command (if
available). If no verify command, check documentation. Flag unimplemented items.

### 1.5 Present Intermediate Summary

"Data gathered: N rounds from M sources. X total items found."

---

## STEP 1.5: WARM-UP SUMMARY (MUST)

Present before proceeding to analysis:

```
PR #NNN Retro: Ready
Rounds found: N (sources: markdown, JSONL, git)
Total review items: N | Patterns detected: N
Previous retro action items: N checked (M verified, K failed)
Estimated findings: ~N | Scope: [short/medium/long]

Proceed to analysis? [Y/n]
```

Save state. If user declines, exit gracefully.

---

## STEP 2: ANALYZE CHURN (MUST)

1. **Ping-pong detection** — same file in consecutive rounds? Fix for X created
   Y? Build chain tables.
2. **Scope creep** — items in non-PR files? Pre-existing vs this-PR origin?
3. **Recurring patterns** — patterns in 3+ rounds = automation candidates.
   Reference REFERENCE.md known churn patterns. **Escalation (C3-G2):** If the
   same recommendation appears in 3+ retros (check
   `docs/AI_REVIEW_LEARNINGS_LOG.md` and `reviews.jsonl`), auto-tag it CRITICAL
   and add to session action items — it must be resolved this session.
4. **Rejection analysis** — group by reason, check false-positive rate by source

Present intermediate summary: "Analysis complete: N findings identified across M
categories. Ready for interactive walkthrough."

---

## STEP 3: INTERACTIVE FINDINGS WALKTHROUGH (MUST)

> Read `.claude/skills/pr-retro/REFERENCE.md` for the finding presentation
> template, evidence markers, and visual format.

### Per-Finding Procedure (MUST follow)

1. Present finding using REFERENCE.md template (one at a time)
2. Mark evidence as `[Observed]` or `[Inferred]`
3. Include verify command for each recommended action
4. Include `Integration:` field for downstream file updates
5. Collect user decision: accept, modify, reject, or defer
6. Show progress: `[N/M findings complete | K action items]`
7. **Save state after each decision** — non-negotiable

### Finding Batching (>15 findings)

If total findings exceed 15: group Low-severity findings into a summary batch.
"These N low-severity findings are informational. Accept all as-is, or expand to
review individually? [accept all / expand]" High and Medium findings MUST get
individual treatment.

### After All Findings

Prompt: "Are there patterns or issues from this review cycle that the analysis
didn't surface?" Add user-provided findings with user-assigned severity.

---

## STEP 3.5: VALIDATE COMPLETENESS (MUST)

After all findings are walked through, compile the full retro markdown and
display it to the user for review before saving.

Verify ALL mandatory retro sections are covered by findings: Review Cycle
Summary, Per-Round Breakdown, Ping-Pong Chains, Rejection Analysis, Recurring
Patterns, Previous Retro Audit, Cross-PR Systemic Analysis, Skills/Templates to
Update, Process Improvements, Verdict.

Flag any missing sections. Generate stub findings for gaps.

---

## STEP 4: SAVE TO LOG (MUST)

### 4.1 Build Compilation (MUST)

Validate: `cd scripts/reviews && npx tsc 2>&1 | tail -5` If build fails, warn
user and fall back to manual JSONL append.

### 4.2 Write JSONL Record (MUST — source of truth)

> See REFERENCE.md for field schema and CLI invocation.

Include `process_feedback` field (populated in Step 8).

### 4.3 Write Markdown (MUST — human view)

Append the complete retrospective to `docs/AI_REVIEW_LEARNINGS_LOG.md`. JSONL is
canonical; markdown is the permanent human-readable view.

### 4.4 Sync + Track (MUST)

```bash
npm run reviews:sync -- --apply
node dist/write-invocation.js --data '...'
```

---

## STEP 5: SYNC REVIEWER SUPPRESSIONS (SHOULD)

If any review items were rejected 2+ times with the same rationale:

1. Check `.gemini/styleguide.md` "Do NOT Flag" — add if missing
2. Mirror to `.qodo/pr-agent.toml` if not already there

Skip if no rejections in this retro.

---

## STEP 6: ACTION ITEM IMPLEMENTATION (MUST — BLOCKING)

> **This step is a hard gate.** The retro CANNOT proceed to Step 7 until every
> accepted action item is either implemented+verified or explicitly deferred by
> the user saying "defer" or "create DEBT." No implicit deferral. No skipping.
> This is the #1 structural fix for repeat-offender action items.

### 6.1 Approval Gate (MUST)

Present all proposed action items as a batch:

| #   | Action | Severity | Category | Effort | Verify Command |
| --- | ------ | -------- | -------- | ------ | -------------- |

User MAY: accept all, modify severity, reject individual items.

### 6.2 Implement Every Item (MUST — not DEFAULT)

Implement every approved action item during this retro session. This includes
doc updates, config changes, pre-check additions, suppression syncs, scripts,
and code changes. **No exceptions without explicit user instruction.**

After each implementation, run the verify command and mark the item:

- `[DONE]` — implemented and verified
- `[BLOCKED]` — cannot be done now, explain why, ask user what to do

**DEBT/TDMS is NOT an option unless the user explicitly requests it.** Do not
offer "defer to DEBT" as a choice. Do not create TDMS entries unless the user
says words like "defer", "create DEBT", or "add to TDMS." If an item is complex,
the options are: implement now, or plan it (add to SESSION_CONTEXT.md next goals
/ ROADMAP.md) — not file it into TDMS where it gets lost.

### 6.3 Implementation Checklist (MUST — before proceeding)

After all items are addressed, present the implementation status:

```
Action Item Status:
  [DONE] #1 — description (verify: passed)
  [DONE] #2 — description (verify: passed)
  [BLOCKED] #3 — description (reason: X, user decision: Y)
```

**Gate check:** If ANY item is not `[DONE]` or explicitly resolved by the user,
do NOT proceed to Step 7. Ask the user how to handle remaining items.

### 6.4 Flag Repeat Offenders

Same action item in 2+ retros without implementation: implement NOW during this
retro. These get highest priority in the implementation queue. If genuinely
blocked, explain the blocker and ask the user — do not auto-defer.

---

## STEP 7: FINAL VERIFICATION (MUST)

> Read `.claude/skills/pr-retro/REFERENCE.md` for full verification criteria and
> report format.

Audits BOTH the retro output AND the skill process itself:

1. **Process compliance** — was every finding presented interactively? Were all
   decisions logged to state file? Were verify commands real and runnable?
2. **Section completeness** — are all 9 mandatory retro sections covered?
3. **Action item verification** — run stored verify commands against codebase.
   Flag `[NOT IMPLEMENTED]` items — these MUST be implemented now (Step 6 gate
   should have caught this). If found, return to Step 6.
4. **Data integrity** — JSONL parseable, markdown appended, sync succeeded
5. **Cross-PR consistency** (batch only) — individual records, no duplicates

Present verification report to user. Resolve any failures interactively before
proceeding to Step 8.

---

## STEP 8: LEARNING LOOP + CLOSURE (MUST)

### Learning Loop

**Auto-learnings** (MUST): Generate 2-3 data-driven insights from the retro
(most common finding type, most impactful action item, reviewer pattern). Save
to `learnings` JSONL field.

**Optional user feedback** (SHOULD): "Any additional observations?" Accept empty
/ "none" to proceed. If provided, save to `process_feedback` JSONL field.

**On next startup** (MUST): If previous retros exist, surface auto-learnings and
feedback: "Previous retro noted: [learnings]. User feedback: [if any]."

### Closure Summary

```
PR #NNN Retro Complete
Findings reviewed: N | Action items: M (K with TDMS entries)
Artifacts saved:
  - retros.jsonl: 1 record
  - AI_REVIEW_LEARNINGS_LOG.md: retro appended
  - .qodo/pr-agent.toml: N suppressions
  - .gemini/styleguide.md: N suppressions
Verification: M commands stored | K passed | J flagged
Next: Run /pr-retro to check for more missing retros
```

---

## COMPACTION RESILIENCE (MUST for interactive sessions)

> See REFERENCE.md for state file schema.

- **State file:** `.claude/state/task-pr-retro.state.json`
- **Update:** After PR selection, each finding decision, action item approval
- **Resume:** `/pr-retro <PR#> --resume` reads state, skips completed findings
- **Graceful exit:** User can say "pause" at any finding prompt — saves state,
  prints progress summary, exits cleanly

---

## GUARD RAILS

- **No review data:** After Step 1, if zero rounds found → "PR #X has no
  recorded review activity. Skip? [Y/n]"
- **Data conflicts:** If markdown and JSONL disagree on round count → flag with
  both values, ask user which source is authoritative
- **Large retros (>15 findings):** Low-severity findings batched (Step 3)
- **Save-and-resume:** "pause" at any prompt saves state and exits

---

## CROSS-SKILL INTEGRATION

| Finding Type             | Action             | Target                        |
| ------------------------ | ------------------ | ----------------------------- |
| New automation candidate | Add pattern rule   | `check-pattern-compliance.js` |
| New fix template needed  | Add template       | `FIX_TEMPLATES.md`            |
| Pre-push check missing   | Add to Step 0.5    | `pr-review SKILL.md`          |
| Recurring noise (Qodo)   | Add suppression    | `.qodo/pr-agent.toml`         |
| Recurring noise (Gemini) | Add to Do NOT Flag | `.gemini/styleguide.md`       |
| Systemic issue           | Create DEBT        | TDMS via `/add-debt`          |

**Session integration:** `/session-end` verifies TDMS entries. `/session-begin`
checks open retro DEBT items. `/pr-review` checks pre-push recommendations.

---

## Version History

| Version | Date       | Description                                                                                                                                    |
| ------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 4.2     | 2026-03-11 | Step 6 hard gate: implement=MUST not DEFAULT, DEBT only on explicit user request, implementation checklist + gate check before Step 7.         |
| 4.1     | 2026-03-09 | Step 6 rewrite: default=implement now, DEBT=explicit only. Source: batch retro PRs #417-#423.                                                  |
| 4.0     | 2026-03-06 | Major rewrite: interactive walkthrough, batch retros, verification protocol, compaction resilience, routing. Source: skill-audit 37 decisions. |
| 3.3     | 2026-02-28 | Add JSONL dual-write in Step 4, invocation tracking                                                                                            |
| 3.2     | 2026-02-27 | Add Step 5.0: Gemini styleguide sync for rejected items                                                                                        |
| 3.1     | 2026-02-27 | Add retro baseline (PR >= 395) to dashboard D3 filter                                                                                          |
| 3.0     | 2026-02-26 | Add Patterns 12-13. Source: PR #393/#394 retros.                                                                                               |

> Older version history archived in [ARCHIVE.md](ARCHIVE.md).

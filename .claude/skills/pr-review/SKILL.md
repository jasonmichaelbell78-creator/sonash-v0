---
name: pr-review
description: >-
  Process external PR code review feedback (CodeRabbit, Qodo, SonarCloud,
  Gemini) through a structured 8-step protocol. Parses all items, categorizes by
  severity and origin, fixes in priority order, tracks deferred items to TDMS,
  and captures learnings. This skill processes review feedback — it does not
  generate reviews.
---

# PR Code Review Processor

Process external code review feedback into fixes, deferrals, and learnings.
Every item is either fixed or tracked — no silent dismissals.

## Critical Rules (MUST follow)

1. **NEVER silently ignore** — every item gets a disposition: fixed, deferred
   (with DEBT ID via `/add-debt`), or rejected (with specific justification).
2. **NEVER skip trivial items** — fix everything, including typos and style.
3. **ALWAYS create learning entry FIRST** — before fixing any items.
4. **ALWAYS read files before editing** — no blind edits.
5. **ALWAYS verify fixes** — re-read modified files after applying changes.
6. **NEVER dismiss as "pre-existing"** — present the user with two options: (a)
   **Fix now** with an effort estimate (e.g., "3 files, ~10 min" or "47
   instances, ~2 hours with agents"), or (b) **Create a DEBT item** via
   `/add-debt`. The user decides which path — never auto-dismiss.
7. **Propagation is MANDATORY** — after fixing a pattern-based issue, grep the
   entire codebase for the same pattern and fix ALL instances in one commit.

## When to Use

- Processing formal PR gate review feedback (CodeRabbit, Qodo, SonarCloud, etc.)
- User explicitly invokes `/pr-review`
- Multi-round review cycles on open PRs

## When NOT to Use

- Ad-hoc development review or self-review — use `code-reviewer` agent
- Generating reviews (this skill processes feedback, doesn't generate it)
- Security-specific audit — use `security-auditor` agent
- PR retrospective analysis — use `/pr-retro`
- PR ecosystem health — use `/pr-ecosystem-audit`
- SonarCloud issue management — use `/sonarcloud`

## Parameters

- `--pr <number>` — PR number (SHOULD provide; used for state file + JSONL)
- `--round <N>` — Review round (R1, R2, R3+). Enables repeat-item detection.
- `--resume` — Resume interrupted review from state file.

---

## Process Overview

```
Step 1: CONTEXT & PARSE  →  Step 2: CATEGORIZE & TRIAGE  →  Step 3: PLAN
  →  Step 4: FIX  →  Step 5: DOCUMENT & TRACK  →  Step 6: LEARNING & JSONL
  →  Step 7: VERIFY  →  Step 8: SUMMARY & COMMIT
```

**Artifacts:** Fixed source files, learning log entry, JSONL review record, TDMS
debt items (if deferred), state file.

## Warm-Up (MUST — before Step 1)

**State file lookup (MUST for R2+):** Before displaying the warm-up, read prior
round state files to get accurate counts. Check for state files in descending
round order: `.claude/state/task-pr-review-{pr}-r{N}.state.json` where N <
current round. Extract `total`, `fixed`, `deferred`, `rejected` from each.

```
PR Review: #{pr} Round {round}
Source: [CodeRabbit/Qodo/SonarCloud/Mixed]
[If R2+: Previous rounds from state files:
  R1: fixed N, deferred M, rejected K
  R2: fixed N, deferred M, rejected K
  ...]
Ready to receive review feedback. Paste it below.
```

---

## Step 0: Pre-Checks (MUST — before parsing)

**PR size advisory (MUST):** Check file count before starting review:

```bash
gh pr view {PR} --json files --jq '.files | length'
```

If >50 changed files: "This PR has N files. Large PRs produce noisy review
cycles. Consider splitting before review. Continue anyway? [Y/split]"

**First-scan detection (MUST for R1):** If SonarCloud items >100 on R1, most are
likely first-scan noise on new files (not bugs introduced by the PR). Offer
batch acknowledgment: "SonarCloud flagged N items on R1. This appears to be
first-scan volume on new files. Batch-acknowledge known-safe patterns (S5852,
S4036, S106 in scripts/tests)? [Y/review individually]" Apply existing
suppression patterns, triage only remaining items individually.

---

## Step 1: Context & Parse (MUST)

> Read `reference/PRE_CHECKS.md` for 18 mandatory pre-push checks. Run ALL
> applicable checks before first CI push.

**Context (SHOULD):** Load `CLAUDE.md`, `CODE_PATTERNS.md`, `FIX_TEMPLATES.md`.
For R2+: load previous round's state file, check learning log for prior
rejections, auto-detect repeat items (same rule ID + file = repeat-rejected).

**Retro Pattern Check (SHOULD — D26 backward flow):**

1. Read `.claude/state/retros.jsonl` (last 3 entries — if file exists)
2. For each retro entry, extract `action_items[]` array
3. For each action item where `status !== 'complete'`:
   - Check if the current PR's changed files overlap with the action item's
     context
   - Check if the PR description or review feedback mentions the same pattern
     category
4. If a match is found, flag it prominently in the triage output:
   ```
   ⚠️ REPEAT PATTERN from retro PR #{retro.pr}:
     Action item: "{item.title}" (status: {item.status})
     This PR appears to repeat this pattern. Priority: ELEVATED
   ```
5. Auto-elevate matched items to at minimum MAJOR severity

**Parse (MUST):**

1. Identify source (CodeRabbit, Qodo, SonarCloud, Mixed)
2. **Multi-pass extraction (MUST for >200 lines):** Pass 1: scan for item
   headers/markers. Pass 2: extract details, code snippets, line refs. Pass 3:
   cross-reference for missed items, validate completeness.
3. Announce: "Identified **N total items** from [source]"
4. Validate critical claims via `git log --all --grep` / `git log --follow`
5. Stale HEAD check — if reviewer is 2+ commits behind, batch-reject

**Input validation:** If zero items parsed, warn and ask user to verify content.

**SonarCloud enrichment:** Auto-fetch code snippets when `javascript:S####` rule
IDs detected. See
[reference/SONARCLOUD_ENRICHMENT.md](reference/SONARCLOUD_ENRICHMENT.md).

**Effort estimate (MUST):** "**N items** (C critical, M major, m minor, T
trivial). Estimated effort: [small <=5 | medium 6-15 | large 16-30 | XL 30+]."

**Fast path (<=5 items):** Skip Steps 3-4, proceed directly to fixing.

**Done when:** All items parsed, count announced, effort estimated.

---

## Step 2: Categorize & Triage (MUST)

**Severity (MUST):** CRITICAL (security/data loss) | MAJOR (bugs/perf) | MINOR
(style/tests) | TRIVIAL (typos). Fix ALL levels.

**Origin (MUST):**

| Origin                    | Action                                       |
| ------------------------- | -------------------------------------------- |
| **This-PR**               | MUST fix                                     |
| **Pre-existing, fixable** | Fix now (< 5 min)                            |
| **Pre-existing, complex** | Track via `/add-debt` with DEBT-XXXX ID      |
| **Architectural**         | Present to user with impact + recommendation |

**Cross-round dedup (MUST for R2+):** Before investigating any item, check prior
round dispositions for the same PR. Auto-reject items that match a prior
rejection (same rule ID + same file). Reference the prior round: "Already
rejected in R{N} — same justification applies." This applies to ALL reviewers
(Qodo, SonarCloud, Gemini), not just Qodo.

**Multi-source convergence (SHOULD for R2+):** If 2+ reviewer sources
(SonarCloud, Qodo, Gemini, Semgrep) flag the same file+pattern in the same
round, auto-elevate to next severity tier. Multi-source agreement is strong
signal.

**Stale HEAD check (MUST):** When a SonarCloud item references a file already
modified in the current fix commit, flag as potentially stale. Verify against
current HEAD before investigating: `git show HEAD:{file} | grep -n "pattern"`.
Mark confirmed stale items as "Stale (fixed in R{N} commit {hash})."

**Triage summary (non-blocking):** Show breakdown, auto-proceed. User MAY
interrupt. For architectural items: state finding, impact, recommendation, wait.

**Re-triage:** If an item proves more complex during fixing, re-classify and
notify: "Re-triaged [item] from MINOR to MAJOR — [reason]."

**Done when:** All items categorized, triage summary shown.

---

## Step 3: Plan & Agents (SHOULD — skip for <=5 items)

Track ALL issues. Learning log entry (`#TBD` stub) is ALWAYS the FIRST task.

For 20+ items across 3+ concerns, dispatch specialized agents:
`security-auditor`, `test-engineer`, `performance-engineer`, `code-reviewer`.
See
[reference/PARALLEL_AGENT_STRATEGY.md](reference/PARALLEL_AGENT_STRATEGY.md).

**Done when:** Task list created, agents dispatched (if applicable).

---

## Step 4: Fix (MUST — in priority order)

**Fix order:** CRITICAL (separate commit) > MAJOR (batch related) > MINOR (batch
by file) > TRIVIAL (batch all).

**Per fix:** Check FIX_TEMPLATES first. Read file, understand context, apply.

**Propagation sweep (MUST — NEVER skip):** After every pattern-based fix, grep
the entire codebase for the same pattern and fix ALL instances before
committing. This is the #1 source of avoidable review rounds (evidenced across
PRs #420, #424, #426). Do NOT commit a fix until all instances are addressed:

```bash
# Search for the same anti-pattern across the codebase
grep -rn "PATTERN" scripts/ .claude/hooks/ tests/ --include="*.js" --include="*.ts"
# Verify: count remaining instances (must be 0)
grep -rc "PATTERN" scripts/ .claude/hooks/ tests/ --include="*.js" --include="*.ts" | grep -v ':0$'
```

**Verify (MUST):** Re-read modified files, `npm run lint`, `npm run test`,
`npm run patterns:check`, cross-reference original items.

**Mid-review checkpoint (20+ items):** After critical+major batch: "Completed
C+M fixes. N remaining. Continue?" Progress: every 5 fixes show "N of M (X%)."

**Done when:** All fixable items addressed, verification passes.

---

## Step 5: Document & Track (MUST)

Every non-fixed item MUST have a disposition:

- **Deferred:** DEBT ID via `/add-debt` + justification
- **Rejected:** Specific technical justification (not "seems fine")
- **Architectural:** User-approved disposition

**TDMS (MUST for deferred):** Use `/add-debt`. Map: CRITICAL>S0, MAJOR>S1,
MINOR>S2, TRIVIAL>S3. See
[reference/TDMS_INTEGRATION.md](reference/TDMS_INTEGRATION.md).

**Approval gate (MUST):** Present deferred items for approval: "Deferring N
items to TDMS: [list]. Approve? [Y/modify]"

**Delegation:** User says "you decide" → accept recommendations, record as
`delegated-accept`. **Contradictions:** Defer to user except safety items.

**Done when:** All items have dispositions, deferred items approved.

---

## Step 6: Learning & JSONL (MUST)

Validate learning log path exists. Finalize review number, complete learning
entry, run `npm run reviews:sync -- --apply`. See
[reference/LEARNING_CAPTURE.md](reference/LEARNING_CAPTURE.md).

**JSONL (MUST):** The JSONL record is the source of truth; markdown log is a
companion during transition (end state: JSONL only, markdown deprecated).

```bash
cd scripts/reviews && npx tsc && node dist/write-review-record.js --data '{...}'
```

See LEARNING_CAPTURE.md for full schema, deferred-items, and invocation
tracking.

**Data completeness check (MUST):** Before marking Step 6 done, verify both
artifacts exist: (1) markdown entry appended to `AI_REVIEW_LEARNINGS_LOG.md`
with correct review number, (2) JSONL record written via
`write-review-record.js` with all fields populated (pr, round, total, fixed,
rejected, deferred, source). Missing either artifact causes data gaps in
`/pr-retro` analysis.

**Done when:** Learning entry + JSONL record created, both verified.

---

## Step 7: Verify (MUST — gate before summary)

1. **Count check:** fixed + deferred + rejected = total parsed items
2. **No orphans:** every item from Step 1 has a disposition
3. **TDMS sync:** every deferred item has a DEBT-XXXX ID
4. **Learning entry:** complete (not `#TBD`)

If any check fails, fix before continuing. **Done when:** All 4 checks pass.

---

## Step 7.5: Merge Trigger Check (SHOULD — R4+ only)

If this is round 4 or later, check the fix rate:

- **Fix rate < 30%:** Recommend merging. Remaining items become follow-up TDMS
  entries, not more review rounds. Signal: "Fix rate dropped to N% — diminishing
  returns. Recommend merging and tracking N remaining items as DEBT."
- **Fix rate 30-50%:** Flag: "Fix rate is N%. Consider one more round maximum."
- **Fix rate > 50%:** Continue normally.

**Source:** PR #421 retro (R6: 80% rejection), PR #423 retro (R5: 60%
rejection). Signal-to-noise drops sharply after R4-R5.

---

## Step 8: Summary & Commit (MUST)

```
PR Review Complete: #{pr} R{round}
Items: {total} ({fixed} fixed, {deferred} deferred, {rejected} rejected)
Severity: {critical}C / {major}M / {minor}m / {trivial}T
Files modified: [list] | Learning: #{N} | TDMS: [DEBT IDs or "none"]

Key Decisions:
- [Deferred] DEBT-XXXX: [reason]
- [Rejected] [item]: [justification]
```

**Commit (MUST):** Prefix `fix:` or `docs:`. Body: reference review source.
Separate commits for Critical fixes.

**Persist state file (MUST):** After commit, write the round's state file to
`.claude/state/task-pr-review-{pr}-r{round}.state.json` with the schema shown in
Compaction Resilience. This is the source of truth for future rounds' warm-up.

**Handoff:** "Run `/pr-retro --pr {N}` to analyze review cycle efficiency."

**Feedback (MAY):** "Was this review process effective? Patterns to capture?"

**Done when:** Summary shown, committed, state file written, handoff offered.

---

## Guard Rails

- **50+ items:** Suggest splitting into severity batches
- **Zero items:** Warn, ask user to verify pasted content
- **Pause/resume:** Save state + exit. Resume: `/pr-review --resume --pr N`
- **Contradictions:** Defer to user (except safety items)

## Compaction Resilience

State file: `.claude/state/task-pr-review-{pr}-r{round}.state.json`. Updated
after each step. On `--resume`, read state and skip completed steps. Retained
after completion as review record.

**State file schema (MUST persist after Step 8):**

```json
{
  "pr": 432,
  "round": 3,
  "review_number": 476,
  "source": "mixed",
  "total": 7,
  "fixed": 6,
  "deferred": 0,
  "rejected": 1,
  "severity": { "critical": 0, "major": 2, "minor": 3, "trivial": 2 },
  "completed_steps": [1, 2, 3, 4, 5, 6, 7, 8],
  "status": "complete",
  "commit_sha": "32d52dcf",
  "completed_at": "2026-03-14T23:55:00Z"
}
```

**Why:** Warm-Up for R2+ reads prior round state files to show accurate
previous-round counts. Without persisted state, context clearing or compaction
loses this data and warm-up shows inaccurate or missing counts. The state file
is the source of truth for cross-round history within a PR.

## Integration

**Upstream:** Manual invocation only (user pastes feedback). **Downstream:**
`/pr-retro`, `/add-debt`, `/sonarcloud`. **Neighbors:** `code-reviewer`
(generates reviews), `/pr-retro` (cycle analysis), `/pr-ecosystem-audit`.

---

## Version History

| Version | Date       | Description                                                                                                                                                                                                |
| ------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4.3     | 2026-03-14 | State file persistence: Warm-Up reads prior round state files for accurate counts across compaction/clear. Step 8 writes state file. Schema documented in Compaction Resilience.                           |
| 4.2     | 2026-03-13 | D26 backward flow: Step 1 retro pattern check reads last 3 retros' action_items[], flags repeat patterns, auto-elevates to MAJOR.                                                                          |
| 4.1     | 2026-03-11 | Retro PRs #420/#424/#426: Step 0 (size advisory + first-scan batch), Step 2 (cross-round dedup + stale HEAD + prior rejection), Step 4 (propagation sweep strengthened), Step 6 (data completeness check). |
| 4.0     | 2026-03-07 | Full rewrite from skill-audit (49 decisions). 8 sequential steps, pre-checks extracted, MUST/SHOULD/MAY, compaction, guard rails, routing.                                                                 |
| 3.7     | 2026-03-05 | Out-of-scope table, completeness gate                                                                                                                                                                      |

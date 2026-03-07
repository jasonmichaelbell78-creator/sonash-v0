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
6. **NEVER dismiss as "pre-existing"** — fix (<5 min) or track with DEBT ID.
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

```
PR Review: #{pr} Round {round}
Source: [CodeRabbit/Qodo/SonarCloud/Mixed]
[If R2+: Previous round fixed N, deferred M, rejected K]
Ready to receive review feedback. Paste it below.
```

---

## Step 1: Context & Parse (MUST)

> Read `reference/PRE_CHECKS.md` for 18 mandatory pre-push checks. Run ALL
> applicable checks before first CI push.

**Context (SHOULD):** Load `CLAUDE.md`, `CODE_PATTERNS.md`, `FIX_TEMPLATES.md`.
For R2+: load previous round's state file, check learning log for prior
rejections, auto-detect repeat items (same rule ID + file = repeat-rejected).

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

**Propagation (MUST — NEVER skip):** After every pattern-based fix, grep the
entire codebase for same pattern and fix ALL instances before committing:

```bash
grep -rn "PATTERN" scripts/ .claude/hooks/ --include="*.js"
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

**Done when:** Learning entry + JSONL record created.

---

## Step 7: Verify (MUST — gate before summary)

1. **Count check:** fixed + deferred + rejected = total parsed items
2. **No orphans:** every item from Step 1 has a disposition
3. **TDMS sync:** every deferred item has a DEBT-XXXX ID
4. **Learning entry:** complete (not `#TBD`)

If any check fails, fix before continuing. **Done when:** All 4 checks pass.

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

**Handoff:** "Run `/pr-retro --pr {N}` to analyze review cycle efficiency."

**Feedback (MAY):** "Was this review process effective? Patterns to capture?"

**Done when:** Summary shown, committed, handoff offered.

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

## Integration

**Upstream:** Manual invocation only (user pastes feedback). **Downstream:**
`/pr-retro`, `/add-debt`, `/sonarcloud`. **Neighbors:** `code-reviewer`
(generates reviews), `/pr-retro` (cycle analysis), `/pr-ecosystem-audit`.

---

## Version History

| Version | Date       | Description                                                                                                                                |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 4.0     | 2026-03-07 | Full rewrite from skill-audit (49 decisions). 8 sequential steps, pre-checks extracted, MUST/SHOULD/MAY, compaction, guard rails, routing. |
| 3.7     | 2026-03-05 | Out-of-scope table, completeness gate                                                                                                      |

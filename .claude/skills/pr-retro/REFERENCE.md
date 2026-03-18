# PR Retro — Reference

<!-- prettier-ignore-start -->
**Document Version:** 1.3
**Last Updated:** 2026-03-18
**Status:** ACTIVE
<!-- prettier-ignore-end -->

Companion reference for pr-retro SKILL.md. Contains templates, schemas, known
churn patterns, and detailed guidance extracted from the core skill to stay
under 300 lines.

---

## Finding Presentation Template

MUST use this template for every finding in the interactive walkthrough (Step
4).

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
| metrics              | object       | `{total_findings: N, fix_rate: 0.8, pattern_recurrence: N}` — see below    |
| process_feedback     | string\|null | User feedback on the retro process (learning loop)                         |
| deliverable_verification | object\|null | `{ claims: N, verified: M, unverified: K, confidence: "HIGH/MEDIUM/LOW", t20_tally: { confirmed: N, corrected: M, extended: K, new: J } }` |
| metrics.hook_health  | object\|null | `{ pre_commit_pass_rate: 0.95, pre_push_pass_rate: 0.90, overrides: N, top_warning: "type", total_runs: N, avg_duration_ms: N }` |

**`metrics.pattern_recurrence` population (D7):**

The `pattern_recurrence` value MUST be populated at creation time, not guessed:

1. Read ALL prior retro entries from `retros.jsonl` (not just last 3-5)
2. For each entry, extract pattern categories from `top_misses`,
   `action_items[].title`, and `process_changes`
3. Build a map: `{category: count_of_retros_containing_it}`
4. Set `metrics.pattern_recurrence` to the **highest count** across all
   categories found in this retro's findings
5. If highest count >= 3, ensure all matching findings are tagged CRITICAL

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

- **Individual retros per PR** — each PR gets its own data gathering (Step 2),
  churn analysis (Step 3), and JSONL record (Step 8)
- **Single interactive walkthrough** — findings from all PRs are presented in
  one walkthrough, grouped by PR but in a continuous flow
- **One cross-PR systemic analysis** — runs once across the entire batch, not
  per-PR. This is the primary value of batching.
- **Aggregated closure summary** — one summary covering all PRs

---

## Known Churn Patterns

Patterns observed across multiple PRs. Reference during Step 2 analysis.

## Override Audit Cross-Reference (D26 data flow — ls-006)

During Step 3 (churn analysis), read `.claude/override-log.jsonl` to
cross-reference override patterns with PR review rounds:

1. Filter override entries for the PR being analyzed (match by date range or
   branch name)
2. If the PR had overrides, note them in the churn analysis:
   - Which checks were overridden
   - Whether the override reason matches the PR's fix patterns
3. If the same check was overridden 3+ times across recent PRs, flag as a
   recurring override pattern — candidate for threshold adjustment

This prevents the override audit trail from being write-only data.

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

> Referenced from SKILL.md Step 7.

The final verification stage audits BOTH the retro output AND the skill process
itself. Present results to the user grouped by section, flagging any failures.

### 1. Process Compliance (was the skill followed correctly?)

**Interactive Workflow:**

- [ ] Warm-up summary was presented (Step 3) and user confirmed proceed
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
- [ ] Repeat offenders flagged with escalation (Step 6.2)

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

If any failures: resolve interactively before proceeding to Step 8 (save).

---

## Deliverable Verification Detail

> Extracted from SKILL.md Step 1. Full procedural detail for the convergence
> loop that catches "phantom completions."

### Claim Extraction Sources

Pull intent from ALL available sources (do not skip any):

1. **PR body** -- `gh pr view <PR#> --json body,title,commits,files`
2. **Commit messages** -- extract task descriptions from conventional commit
   subjects and bodies
3. **Referenced PLAN.md** -- if the PR body or commits reference a
   `.planning/*/PLAN.md`, read it and extract the plan's deliverables/steps that
   map to this PR
4. **SESSION_CONTEXT.md goals** -- check if the PR's session is referenced in
   session goals or quick status tables
5. **ROADMAP.md items** -- if the PR references roadmap items, extract expected
   outcomes

Build a **claims list**: each claim is a testable assertion about what the PR
was supposed to deliver. Format: `"<deliverable> -- source: <where found>"`.

### Convergence-Loop Configuration

- **Preset:** `standard` (source-check -> verification -> fresh-eyes)
- **Claims:** The claims list from extraction above
- **Domain slicing:** Per-claim (each claim gets its own verification thread)
- **Agent prompt:** "Verify this PR deliverable claim against the current
  codebase. Check that the described feature/fix/change actually exists, is
  wired correctly, and functions as described. Look for: missing imports, dead
  code paths, untested functions, config not connected, files referenced but not
  created. Start verification from files changed in the PR, but follow
  references outward -- if a changed file imports from or references a file that
  should exist but doesn't, flag it."

### CL Result Processing

| CL Status                                | Retro Treatment                 |
| ---------------------------------------- | ------------------------------- |
| **Confirmed** (HIGH confidence)          | Note as verified, no finding    |
| **Corrected** (claim was wrong/partial)  | AUTO-FINDING: CRITICAL severity |
| **Extended** (claim true but incomplete) | AUTO-FINDING: HIGH severity     |
| **Unverified** (insufficient evidence)   | AUTO-FINDING: CRITICAL severity |

Auto-findings from deliverable verification:

- Severity: **CRITICAL** for unverified/corrected, **HIGH** for extended
- Category: `phantom-completion`
- Auto-injected into Step 4 findings walkthrough (presented first, before
  review-cycle findings)
- Include the CL evidence and agent reasoning in the finding detail

### Verification Summary Template

```
PR #NNN Deliverable Verification:
  Claims extracted: N (from: PR body, PLAN.md, commits, ...)
  Verified: M | Unverified: K | Partial: J
  CL confidence: HIGH/MEDIUM/LOW
  Auto-findings generated: X (K CRITICAL, J HIGH)

Proceed to review data gathering? [Y/n]
```

### Skip Conditions

PRs with fewer than 3 commits AND fewer than 3 files changed (trivial fixes,
doc-only PRs). Note skip in output and proceed to Step 2.

If fewer than 3 claims extracted, note "Insufficient claims for convergence loop
-- skipping verification" and proceed to Step 2.

### Cost Warnings

- **>10 claims:** Warn about token cost before running the convergence loop.
  "This PR has N claims -- convergence-loop verification will consume
  significant tokens. Proceed? [Y/n]"
- **Batch retro with >3 PRs:** Warn about sequential CL cost. "Running
  deliverable verification sequentially for N PRs will consume significant
  tokens. Proceed with all, select subset, or skip? [all/select/skip]"

### Contradiction Protocol

When convergence-loop results conflict with review data (e.g., CL says a
deliverable is unverified but review data shows it was reviewed and approved):

1. Note the conflict explicitly in the finding
2. Present both data sources to the user
3. Ask the user which source is authoritative for this specific claim
4. Record the resolution in the state file

---

## Data Enrichment

> Extracted from SKILL.md Step 2.4. How to read and use review metrics and hook
> health data during data gathering.

### Review Metrics Enrichment

**Source:** `.claude/state/review-metrics.jsonl`

**How to read:**

1. Search for entry where `pr` matches the current PR number
2. Use the latest entry if duplicates exist for the same PR number
3. If found, extract: `fix_ratio`, `review_rounds`, `total_commits`,
   `fix_commits`

**Field mappings:**

| Source Field     | Usage                                                       |
| ---------------- | ----------------------------------------------------------- |
| `fix_ratio`      | Percentage of commits that were fixes -- churn indicator    |
| `review_rounds`  | Total review rounds -- cross-validate with gathered data    |
| `total_commits`  | Total commit count for the PR                               |
| `fix_commits`    | Number of fix commits -- compare to total for fix overhead  |

**How to use this data:**

- Inform churn analysis in Step 3 (quantitative backing for "too many rounds"
  or high fix ratios)
- Set baseline for "was this PR unusually churny?" (compare to average across
  last 5 PRs in the file)
- Include in the JSONL record's `metrics` field

If the file doesn't exist or no matching entry found, note "No review-metrics
data available for this PR" and continue.

### Hook Health Enrichment

**Sources:**

| File                              | Fields per line                                                            |
| --------------------------------- | -------------------------------------------------------------------------- |
| `.claude/state/hook-runs.jsonl`   | `hook`, `timestamp`, `branch`, `checks` (array of `{id, status, duration}`), `outcome`, `total_ms` |
| `.claude/state/hook-warnings-log.jsonl` | `timestamp`, `hook`, `type`, `severity`, `message`, `action`         |
| `.claude/override-log.jsonl`      | `timestamp`, `check`, `reason`                                             |

**NOTE:** The override log path is `.claude/override-log.jsonl` (NOT
`.claude/state/override-log.jsonl`).

**How to read:**

1. Filter entries where `branch` matches the PR branch name and `timestamp`
   falls within the PR's development period (first commit to merge date)
2. For hook-warnings and override-log, filter to the same date range

**Field mappings for extraction:**

| Metric                  | Source                       | Calculation                                |
| ----------------------- | ---------------------------- | ------------------------------------------ |
| Pre-commit pass rate    | `hook-runs.jsonl`            | Count `outcome=pass` where `hook=pre-commit` / total pre-commit runs |
| Pre-push pass rate      | `hook-runs.jsonl`            | Count `outcome=pass` where `hook=pre-push` / total pre-push runs |
| Most common warning     | `hook-warnings-log.jsonl`    | Group by `type`, pick highest count        |
| Override count          | `.claude/override-log.jsonl` | Count entries in date range                |
| Total hook runs         | `hook-runs.jsonl`            | Count all entries in date range            |
| Avg hook duration       | `hook-runs.jsonl`            | Mean of `total_ms` across all entries      |

**How to use this data:**

- Inform churn analysis in Step 3 (frequent hook failures = quality issues)
- Flag if override count is unusually high (compare to 5-PR average from recent
  entries across all branches)
- Include in the JSONL record's `metrics` field as `hook_health`

If files don't exist or no matching entries found, note "No hook data available
for this PR's development period" and continue.

---

## Implementation Detail

> Extracted from SKILL.md Step 6. Rules for the blocking implementation gate.

### DEBT/TDMS Rules

**DEBT is NOT an option unless the user explicitly requests it.** Do not offer
"defer to DEBT" as a choice. Do not create TDMS entries unless the user says
words like "defer", "create DEBT", or "add to TDMS."

If an item is complex, the options are:

1. **Implement now** -- do the work during this retro session
2. **Plan it** -- add to `SESSION_CONTEXT.md` next goals or `ROADMAP.md`

Filing into TDMS where it gets lost is NOT a default option.

### Repeat Offender Handling

Same action item appearing in 2+ retros without implementation:

- These get **highest priority** in the implementation queue
- Implement NOW during this retro -- do not defer
- If genuinely blocked, explain the blocker and ask the user
- Do not auto-defer repeat offenders under any circumstances

### Implementation Checklist Template

Present after all items are addressed:

```
Action Item Status:
  [DONE] #1 -- description (verify: passed)
  [DONE] #2 -- description (verify: passed)
  [BLOCKED] #3 -- description (reason: X, user decision: Y)
```

### Gate Check Logic

**Gate check:** If ANY item is not `[DONE]` or explicitly resolved by the user,
do NOT proceed to Step 7. Ask the user how to handle remaining items.

Items may only be resolved as:

- `[DONE]` -- implemented and verify command passed
- `[BLOCKED]` -- user explicitly acknowledged blocker and chose resolution

### State File Tracking for Action Items

After each item implementation, update the state file's `finding_decisions`
entry with:

- `implementation_status`: `"implemented"`, `"blocked"`, `"deferred"`, or
  `"rejected"`
- `verify_result`: `"pass"`, `"fail"`, or `"skipped"`

When writing the JSONL record in Step 8, populate the `action_items` array with
per-item `{title, status, verify_cmd, implemented_in}` from the state file. The
`process_changes` field continues to hold string descriptions for backward
compatibility, but `action_items` is the authoritative tracking field.

---

## Cross-Skill Integration

> Extracted from SKILL.md. Maps finding types to downstream actions and target
> files.

| Finding Type             | Action               | Target                        |
| ------------------------ | -------------------- | ----------------------------- |
| New automation candidate | Add pattern rule     | `check-pattern-compliance.js` |
| New fix template needed  | Add template         | `FIX_TEMPLATES.md`            |
| Pre-push check missing   | Add to Step 0.5      | `pr-review SKILL.md`          |
| Recurring noise (Qodo)   | Add suppression      | `.qodo/pr-agent.toml`         |
| Recurring noise (Gemini) | Add to Do NOT Flag   | `.gemini/styleguide.md`       |
| Systemic issue           | Create DEBT          | TDMS via `/add-debt`          |
| Hook override abuse      | Review skip patterns | `override-log.jsonl`          |
| Phantom completion       | Verify + fix gaps    | Codebase via convergence-loop |

### Session Integration Notes

- `/session-end` verifies TDMS entries created during the retro
- `/session-begin` checks open retro DEBT items from prior sessions
- `/pr-review` checks pre-push recommendations generated by retro findings

---

## Version History

| Version | Date       | Changes                                                          |
| ------- | ---------- | ---------------------------------------------------------------- |
| 1.3     | 2026-03-18 | Align step references with SKILL.md v4.7 renumbering. Fix override-log path. |
| 1.2     | 2026-03-18 | Add Cat7 sections: deliverable verification detail, data enrichment, implementation detail, cross-skill integration. |
| 1.1     | 2026-03-13 | Add D7 pattern_recurrence population rules, D26 override audit cross-reference, verification stage criteria |
| 1.0     | 2026-03-06 | Initial extraction from SKILL.md v4.0 — templates, schemas, patterns, batch scope |

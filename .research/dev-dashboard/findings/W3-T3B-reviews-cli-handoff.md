# Findings: CLI Command Inventory for Code Review Quality Tab

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-29
**Sub-Question IDs:** W3-T3B (Reviews Tab CLI Handoff)

---

## Key Findings

### 1. /pr-review — Complete Mode Inventory [CONFIDENCE: HIGH]

`/pr-review` is the primary skill for processing external gate review feedback
(CodeRabbit, Qodo, SonarCloud, Gemini). It does NOT generate reviews — it
processes pasted or fetched feedback through an 8-step protocol.

**Parameters:**

| Parameter | Syntax        | Required?      | Effect                                                                              |
| --------- | ------------- | -------------- | ----------------------------------------------------------------------------------- |
| PR number | `--pr <N>`    | SHOULD provide | Targets state file `.claude/state/task-pr-review-{N}-r{R}.state.json`; JSONL record |
| Round     | `--round <N>` | SHOULD provide | Enables cross-round dedup, repeat-item detection, warm-up with prior round counts   |
| Resume    | `--resume`    | Situational    | Reads state file, skips completed steps — use after interruption or compaction      |

**Invocation examples:**

| Action                        | Clipboard String              |
| ----------------------------- | ----------------------------- |
| Start R1 review for PR #N     | `/pr-review --pr N --round 1` |
| Start R2 review for PR #N     | `/pr-review --pr N --round 2` |
| Resume interrupted review     | `/pr-review --resume --pr N`  |
| Bare invocation (no tracking) | `/pr-review`                  |

**State file location:** `.claude/state/task-pr-review-{pr}-r{round}.state.json`

State persists: `pr`, `round`, `review_number`, `source`, `total`, `fixed`,
`deferred`, `rejected`, `severity` object, `completed_steps`, `status`,
`commit_sha`, `completed_at`.

Source: `.claude/skills/pr-review/SKILL.md` v4.6 (2026-03-18)

---

### 2. /pr-retro — Complete Mode Inventory [CONFIDENCE: HIGH]

`/pr-retro` analyzes completed PR review cycles retrospectively. It has two
modes: dashboard (missing retros list) and single-PR analysis.

**Invocation variants:**

| Mode                       | Syntax                      | When to Use                                           |
| -------------------------- | --------------------------- | ----------------------------------------------------- |
| Dashboard (missing retros) | `/pr-retro`                 | Tab default; shows table of merged PRs without retros |
| Single PR retro            | `/pr-retro <PR#>`           | After a PR merges; triggered from PR history rows     |
| Resume interrupted retro   | `/pr-retro <PR#> --resume`  | Continue after compaction or interruption             |
| Batch retro (multiple PRs) | `/pr-retro` then select IDs | From dashboard mode, user selects multiple PR numbers |

**State file location:** `.claude/state/task-pr-retro.state.json`

State fields: `task`, `mode`, `prs_selected`, `step`, `total_findings`,
`finding_decisions[]`, `action_items_implemented`, `action_items_blocked`,
`learnings[]`, `process_feedback`, `updated`.

Source: `.claude/skills/pr-retro/SKILL.md` v4.8 (2026-03-18)

---

### 3. /code-reviewer — Invocation Syntax [CONFIDENCE: HIGH]

`/code-reviewer` is an ad-hoc review agent (not for processing gate feedback).
It is invoked as a subagent with a git SHA range.

**Trigger pattern:** After completing a task, dispatch via the Task tool with
type `superpowers:code-reviewer`, providing `{BASE_SHA}`, `{HEAD_SHA}`,
`{WHAT_WAS_IMPLEMENTED}`, `{PLAN_OR_REQUIREMENTS}`, `{DESCRIPTION}`.

**When to surface from Reviews tab:** "Review changes before submitting PR"
button; or when the active PR state shows no review round started yet.

Source: `.claude/skills/code-reviewer/SKILL.md` v2.2 (2026-03-13)

---

### 4. Supporting npm Scripts (Non-Skill CLI Commands) [CONFIDENCE: HIGH]

These scripts operate on review data directly and are appropriate for "refresh
data" or "run analysis" buttons on the tab.

**Review data management:**

| Action                                              | Command                         | Flags                                    | Mutates?        |
| --------------------------------------------------- | ------------------------------- | ---------------------------------------- | --------------- |
| Full lifecycle (sync + archive + validate + render) | `npm run reviews:lifecycle`     | none                                     | Yes             |
| Validate JSONL state only                           | `npm run reviews:validate`      | none                                     | No (read-only)  |
| Render JSONL to markdown view                       | `npm run reviews:render`        | none                                     | Yes (docs only) |
| Check archive integrity                             | `npm run reviews:check-archive` | none                                     | No              |
| Check if review is needed                           | `npm run review:check`          | `--category=X`, `--json`, `--sonarcloud` | No              |
| Review churn tracker                                | `npm run review:churn`          | none                                     | No              |

**Learning analysis:**

| Action                         | Command                      | Flags                 |
| ------------------------------ | ---------------------------- | --------------------- |
| Learning dashboard (default)   | `npm run learning:analyze`   | none                  |
| Full detailed report           | `npm run learning:detailed`  | none                  |
| Since a specific review number | `npm run learning:since`     | `-- --since-review N` |
| By category                    | `npm run learning:category`  | none                  |
| Dashboard format only          | `npm run learning:dashboard` | none                  |

**Pending refinements processing:**

| Action                     | Script                             | Flags                 |
| -------------------------- | ---------------------------------- | --------------------- |
| Classify scaffolded routes | `node scripts/refine-scaffolds.js` | `--dry-run`, `--json` |

**JSONL record writing (programmatic — not for direct clipboard):**

```bash
cd scripts/reviews && npx tsc && node dist/write-review-record.js --data '{...}'
```

Source: `package.json`, `scripts/review-lifecycle.js`,
`scripts/analyze-learning-effectiveness.js`

---

### 5. Clipboard Command Format — Exact Strings [CONFIDENCE: HIGH]

These are the exact strings the Reviews tab should copy to clipboard for common
actions.

**"Start review for PR #N round R"**

```
/pr-review --pr N --round R
```

Context substitution: `N` = PR number from active PR state or PR history row;
`R` = next round number (current max round + 1 from state files).

**"Run retro for PR #N"**

```
/pr-retro N
```

Note: This is the merged-PR variant. Do NOT offer this button for open PRs.

**"View retro dashboard"**

```
/pr-retro
```

Opens dashboard mode showing all merged PRs missing retros.

**"Process pending learning items"**

```
npm run learning:analyze
```

This surfaces the learning effectiveness dashboard and identifies items needing
human judgment. For routing/classification of pending-refinements.jsonl items:

```
node scripts/refine-scaffolds.js
```

**"Resume review for PR #N"**

```
/pr-review --resume --pr N
```

Surface this when state file exists with `status !== "complete"`.

**"Run PR ecosystem audit"**

```
/pr-ecosystem-audit
```

Comprehensive 18-category diagnostic — not a per-PR action; surface from tab
header or "ecosystem health" secondary action area.

---

### 6. Context-Aware Command Construction [CONFIDENCE: HIGH]

The tab can construct contextual commands from live data without user input.

**Active PR block — construct from `pr-review-state.json`:**

| Field              | Source                                                 | Used In                             |
| ------------------ | ------------------------------------------------------ | ----------------------------------- |
| `pr`               | `pr-review-state.json`                                 | `/pr-review --pr N --round R`       |
| Max existing round | Glob `.claude/state/task-pr-review-{pr}-r*.state.json` | Compute next round R                |
| `status`           | Latest round state file                                | Show "Resume" vs "Start next round" |

**Example context-aware logic:**

- If `task-pr-review-472-r2.state.json` exists with `status: "complete"` →
  clipboard = `/pr-review --pr 472 --round 3`
- If `task-pr-review-472-r2.state.json` exists with `status: "in-progress"` →
  clipboard = `/pr-review --resume --pr 472`

**PR history row — derive from `reviews.jsonl` fields:**

- `pr`, `round` (inferred from title pattern `PR #N RR`), `source`, `total`,
  `fixed`, `deferred`, `rejected`
- Row action button: `/pr-retro N` if PR is merged;
  `/pr-review --pr N --round R` if open

**Retro tab — derive from `retros.jsonl`:**

- `pr`, `metrics.fix_rate`, `metrics.total_findings`
- Missing retro indicator: merged PR exists in `review-metrics.jsonl` but has no
  entry in `retros.jsonl`

**Learning items — derive from `pending-refinements.jsonl`:**

- Count of items where `surfaced_count === 0`
- Action: `npm run learning:analyze` — no per-item CLI command exists at skill
  level

---

### 7. Gap Analysis — Review Actions Without CLI Commands [CONFIDENCE: HIGH]

Several review tab actions have no corresponding single CLI command.

| Action                                          | Gap Type       | Notes                                                                                                                      |
| ----------------------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------- |
| View a specific learning entry by review number | No CLI         | Must read `docs/AI_REVIEW_LEARNINGS_LOG.md` or `reviews.jsonl` directly                                                    |
| Filter reviews.jsonl by PR/source/date          | No CLI         | JSON query only; no script exposes filtered views                                                                          |
| Dismiss a single pending-refinements.jsonl item | No CLI         | Manual JSONL edit or refine-scaffolds.js processes all                                                                     |
| View per-item DAS scores for a PR round         | No CLI         | Embedded in conversation state during `/pr-review`, not persisted to state file                                            |
| Trigger SonarCloud fetch for a specific PR      | API fetch only | `gh api` command embedded in `pr-review-state.json`'s `process.api_fetch_commands` — not a skill command                   |
| Re-run review round N for a merged PR           | Not supported  | `/pr-review` is for open PRs; `/pr-retro` covers merged PRs                                                                |
| Mark a retro finding as "already verified"      | No CLI         | Must re-run `/pr-retro --resume` and step through interactively                                                            |
| Batch-dismiss recurring review items (cross-PR) | Partial        | `/pr-retro` can add suppressions to `.gemini/styleguide.md` and `.qodo/pr-agent.toml` but only from within a retro session |
| Export PR history data as CSV/JSON              | No CLI         | No script wraps `reviews.jsonl` for export                                                                                 |

---

### 8. Cross-Tab Links — When Reviews Should Navigate to Other Tabs [CONFIDENCE: HIGH]

**Reviews → Debt (Tab 2):**

- Any `deferred` item from a review round creates a DEBT entry via `/add-debt`.
  The Reviews tab should surface a count of "deferred items from this PR" and
  link directly to Debt tab filtered by `source_pr = N`.
- The state file schema includes `deferred` count but not individual DEBT IDs.
  The DEBT IDs are only in `docs/technical-debt/MASTER_DEBT.jsonl` (field:
  `source_id` pattern `PR-{N}-{seq}`). A cross-tab filter is feasible using
  `source_id` prefix matching.
- Condition: `deferred > 0` in a PR's review state files.

**Reviews → Build Pipeline (Tab 4):**

- Hook failures that caused extra review rounds: `hook-runs.jsonl` check
  `code-reviewer-gate` status. When this check is `skip` (not enforced) or
  `fail`, the PR likely accumulated more rounds than necessary.
- Condition: PR has 3+ rounds AND `hook-runs.jsonl` shows
  `code-reviewer-gate: skip` on commits in that PR's timeframe. Link to Tab 4
  filtered to that PR's commit range.
- Retro action items that touch hooks/pre-push should also link: `retros.jsonl`
  → `action_items` where category is "hook" → Tab 4 hook compliance heatmap.

**Reviews → Health (Tab 1):**

- Fix rate drop signal: if `review-metrics.jsonl` shows a PR with
  `fix_ratio < 0.3`, this correlates with health dimension `review-quality`.
  Link the specific PR to the Health tab's `review-quality` dimension score.
- Recurring patterns (3+ occurrences in `retros.jsonl`) are a health signal —
  link "View pattern history" to Tab 1 → Pattern Gate Coverage widget.

**Reviews → Planning (Tab 6):**

- Retro action items with `status !== "complete"` in `retros.jsonl` may
  correspond to open tasks in ROADMAP.md. Surface a "See related plan items"
  link from the retro action items table.
- High-churn files in `.claude/config/high-churn-watchlist.json` are refactor
  candidates — link from the churn widget to Tab 6 planning items.

---

### 9. State File Discovery Logic [CONFIDENCE: HIGH]

The tab needs to enumerate review rounds per PR without a manifest file. The
discovery pattern is:

```
.claude/state/task-pr-review-{pr}-r{N}.state.json
```

- To find the active PR's rounds: glob `task-pr-review-{pr}-r*.state.json`
  sorted numerically by `r{N}`
- To find all PRs with review state: glob `task-pr-review-*.state.json` and
  extract PR numbers from filenames
- The `pr-review-state.json` file is a LEGACY/SEPARATE artifact (last updated
  for PR #411); it does NOT reflect the current review round format. Prefer
  per-round state files for current PR context.

**Per-round state file schema** (confirmed from actual files):

```json
{
  "pr": 472,
  "round": 2,
  "review_number": 59,
  "source": "qodo",
  "total": 8,
  "fixed": 6,
  "deferred": 2,
  "rejected": 0,
  "severity": { "critical": 0, "major": 1, "minor": 4, "trivial": 3 },
  "completed_steps": [1, 2, 3, 4, 5, 6, 7, 8],
  "status": "complete",
  "completed_at": "2026-03-26T17:10:00Z"
}
```

Missing field: `commit_sha` is optional (not present in all records). The
`review_number` maps to `reviews.jsonl` entry IDs (format: `rev-N` or integer
`N`).

---

### 10. Learning Items Data Model [CONFIDENCE: HIGH]

Two separate files track learning routing state:

**`pending-refinements.jsonl`** (36 records as of 2026-03-29):

- Items that could not be auto-classified (confidence = "low")
- Fields: `id`, `route_type`, `pattern`, `generated_code`, `confidence`,
  `reason`, `surfaced_count`, `created`
- All current items are `route_type: "claude-md-annotation"` — behavioral rules
  needing human judgment
- `surfaced_count: 0` means the item has never been shown to the user — these
  are the "unprocessed" queue

**`learning-routes.jsonl`** (39 records as of 2026-03-29):

- Full routing decisions for all learning items
- Fields: `id`, `timestamp`, `date`, `schema_version`, `learning` (type,
  pattern, source, severity), `route`, `scaffold`, `status`, `refined_at`,
  `classification` (confidence, reason, action)
- Status lifecycle: `scaffolded` → `refined` → `enforced`
- Items in `pending-refinements.jsonl` have `status: "refined"` in
  `learning-routes.jsonl` with `action.type: "pending-refinement"`

The tab should surface count of `pending-refinements.jsonl` records where
`surfaced_count === 0` as the "unrouted items" badge, and the clipboard command
for processing them is `npm run learning:analyze` (interactive) or
`node scripts/refine-scaffolds.js --dry-run` (preview).

---

## Sources

| #   | Source                                           | Type                             | Trust | Date       |
| --- | ------------------------------------------------ | -------------------------------- | ----- | ---------- |
| 1   | `.claude/skills/pr-review/SKILL.md`              | Official skill definition        | HIGH  | 2026-03-18 |
| 2   | `.claude/skills/pr-retro/SKILL.md`               | Official skill definition        | HIGH  | 2026-03-18 |
| 3   | `.claude/skills/code-reviewer/SKILL.md`          | Official skill definition        | HIGH  | 2026-03-13 |
| 4   | `.claude/state/task-pr-review-472-r2.state.json` | Filesystem ground truth          | HIGH  | 2026-03-26 |
| 5   | `.claude/state/task-pr-retro.state.json`         | Filesystem ground truth          | HIGH  | 2026-03-12 |
| 6   | `.claude/state/pr-review-state.json`             | Filesystem ground truth (legacy) | HIGH  | 2026-03-01 |
| 7   | `.claude/state/reviews.jsonl`                    | Filesystem ground truth          | HIGH  | 2026-03-29 |
| 8   | `.claude/state/retros.jsonl`                     | Filesystem ground truth          | HIGH  | 2026-03-29 |
| 9   | `.claude/state/pending-refinements.jsonl`        | Filesystem ground truth          | HIGH  | 2026-03-14 |
| 10  | `.claude/state/learning-routes.jsonl`            | Filesystem ground truth          | HIGH  | 2026-03-14 |
| 11  | `.claude/state/review-metrics.jsonl`             | Filesystem ground truth          | HIGH  | 2026-03-29 |
| 12  | `package.json` (npm scripts section)             | Filesystem ground truth          | HIGH  | 2026-03-29 |
| 13  | `scripts/analyze-learning-effectiveness.js`      | Script header docblock           | HIGH  | 2026-03-29 |
| 14  | `scripts/review-lifecycle.js`                    | Script header docblock           | HIGH  | 2026-03-29 |
| 15  | `scripts/refine-scaffolds.js`                    | Script header docblock           | HIGH  | 2026-03-29 |
| 16  | `.claude/skills/pr-ecosystem-audit/SKILL.md`     | Official skill definition        | HIGH  | 2026-02-24 |
| 17  | `CHECKPOINT-tab-decisions.md`                    | Research checkpoint artifact     | HIGH  | 2026-03-29 |

---

## Contradictions

**pr-review-state.json vs per-round state files:** `pr-review-state.json` is a
legacy artifact tracking a specific long-running review (PR #411, R1-R9 batched
protocol). The per-round format `task-pr-review-{pr}-r{N}.state.json` is the
canonical current format as defined in the SKILL.md. The tab should NOT use
`pr-review-state.json` as the model for "active PR state" — it reflects a
one-off batched protocol, not the standard schema.

**reviews.jsonl schema inconsistency:** The file contains a mix of
`schema_version: 2` records (format: `id: "rev-8"`, string ID) and integer ID
records (format: `id: 499`, number). Both formats coexist. The tab's data layer
must handle both. The `schema_version` field distinguishes them.

---

## Gaps

**No per-item DEBT ID in round state files:** The state file records
`deferred: N` as a count but does not list individual `DEBT-XXXX` IDs. To link a
specific deferred item from a review round to Debt tab, the tab must query
`MASTER_DEBT.jsonl` using `source_id` prefix `PR-{N}-` — there is no direct
foreign key in the review state.

**No "review needed" API:** `npm run review:check` evaluates commit/file-count
thresholds to determine if a review is needed, but it does not return which PR
to review or what round to start. The tab cannot use this to auto-detect "review
recommended" state — it can only show the threshold output as advisory.

**Merge Trigger Check (R4+) not persisted:** The SKILL.md Step 7.5 logic ("fix
rate < 30% → recommend merge") executes during `/pr-review` session but the
recommendation is NOT persisted to the state file. The tab cannot display a
"consider merging" recommendation from data alone; it would require re-reading
the state file and computing fix rate across rounds.

**Retro action item completion not tracked in reviews.jsonl:** `retros.jsonl`
has `action_items[]` with `status` fields, but this status is only updated
during `/pr-retro` session interactions. There is no background script that
verifies and updates retro action item status between sessions. The "retro
action items verified" count displayed in `task-pr-retro.state.json` is a
snapshot from the last retro session.

**No single command to process all pending-refinements.jsonl items:** The
`refine-scaffolds.js` script re-classifies scaffolded items but all current
pending items are already in `status: "refined"` — they require human judgment
and no automated processing path exists. The tab can display count but cannot
offer a "process all" automation.

---

## Serendipity

**SonarCloud API fetch commands embedded in pr-review-state.json:** The legacy
`pr-review-state.json` contains a `process.api_fetch_commands` block with
ready-to-use `curl` commands for SonarCloud issues/hotspots, Semgrep
annotations, CodeQL alerts, and PR comments for a specific PR. This pattern
could be generalized: the tab could offer "Fetch latest review feedback" buttons
that construct these API calls dynamically from the current PR number. The
commands use the org slug `jasonmichaelbell78-creator` which is stable.

**High-churn watchlist is review-quality signal:**
`.claude/config/high-churn-watchlist.json` tracks 3 files that appear in 4+ PRs'
fix rounds. The Reviews tab could display a "high churn files" widget showing
these files, their PR frequency, and a link to the refactor candidates section.
This data is not currently surfaced anywhere in the dashboard design.

**review-metrics.jsonl has `fix_ratio` and `review_rounds` per PR:** This file
(52 records, bot PRs excluded by fix_ratio=0/rounds=0) has exactly the data
needed for a fix-rate sparkline or histogram. The `fix_ratio` field is
`fix_commits / total_commits` (not `fixed_items / total_items` — a different
angle). Both signals exist in different files.

---

## Confidence Assessment

- HIGH claims: 10
- MEDIUM claims: 0
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

All findings sourced directly from filesystem ground truth (skill definitions,
state files, scripts, npm scripts). No training data used.

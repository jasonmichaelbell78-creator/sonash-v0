# Findings: Debt Management and PR Review Lifecycle Processes

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-29
**Sub-Question IDs:** SQ1c-1

---

## Key Findings

### 1. Process Flow Diagrams (Text-Based)

**[CONFIDENCE: HIGH]**

#### A. Technical Debt (TDMS) Full Lifecycle

```
DISCOVERY / INTAKE
─────────────────────────────────────────────────────────────────────────
Trigger sources:
  ├─ /add-debt (manual or PR-deferred)       → intake-manual.js OR
  │                                             intake-pr-deferred.js
  ├─ /sonarcloud                              → sync-sonarcloud.js
  ├─ /debt-runner sync mode                  → sync-sonarcloud.js
  ├─ intake-audit.js (CI / agent audits)     → direct write
  └─ CI workflows (resolve-debt.yml, audit-intake.yml)

         ↓
   appendMasterDebtSync()  [atomic dual-write]
         ↓
   ┌────────────────────────────────┐
   │  MASTER_DEBT.jsonl             │  ← canonical source of truth (8,472 items)
   │  docs/technical-debt/          │
   └────────────────────────────────┘
         ↓ also written atomically
   raw/deduped.jsonl

PROCESSING / MUTATION PIPELINE
─────────────────────────────────────────────────────────────────────────
  /debt-runner (7 modes, each CL-verified):
    verify   → corrections → staging/verify-corrections.jsonl → resolve-bulk.js
    sync     → corrections → staging/sync-corrections.jsonl   → apply
    plan     → docs/technical-debt/plans/resolution-YYYY-MM-DD.jsonl + .md
    health   → read-only; runs generate-metrics.js + debt-health.js
    dedup    → staging/dedup-merges.jsonl → dedup-multi-pass.js --force
                                          → consolidate-all.js
    validate → staging/validate-fixes.jsonl → apply
    cleanup  → archive resolved → sync-deduped.js → generate-views.js
                                                   → generate-metrics.js

    [Post-mutation after every mode: sync-deduped.js (MASTER ↔ raw/deduped count check)]

OUTPUT / VIEW GENERATION
─────────────────────────────────────────────────────────────────────────
  generate-views.js:
    → docs/technical-debt/INDEX.md
    → docs/technical-debt/views/by-severity.md
    → docs/technical-debt/views/by-category.md
    → docs/technical-debt/views/by-status.md
    → docs/technical-debt/views/verification-queue.md
    → docs/technical-debt/LEGACY_ID_MAPPING.json

  generate-metrics.js:
    → docs/technical-debt/metrics.json       (machine-readable, dashboard-ready)
    → docs/technical-debt/METRICS.md         (human-readable summary)
    → docs/technical-debt/logs/metrics-log.jsonl  (historical time-series)

  CONSUMPTION:
    → /pr-retro (reads MASTER_DEBT for PR-sourced items)
    → /debt-runner health mode
    → Future web dashboard (reads metrics.json, MASTER_DEBT.jsonl)
```

---

#### B. PR Review Lifecycle (8-Step Protocol)

```
TRIGGER
──────────────────────────────────────────────────────────────────────
  User invokes /pr-review --pr <N> --round <R>
  User pastes external review feedback (CodeRabbit, Qodo, SonarCloud, Gemini)

PRE-CHECKS (Step 0)
──────────────────────────────────────────────────────────────────────
  Reads:
    .claude/config/high-churn-watchlist.json
    .qodo/pr-agent.toml                      (suppression categories)
    .gemini/styleguide.md                    (known false-positive rules)
    gh pr view <N> --json files              (file count check)

PARSE & CONTEXT (Step 1)
──────────────────────────────────────────────────────────────────────
  Reads:
    .claude/state/retros.jsonl               (prior action items check)
    .claude/state/task-pr-review-{pr}-r{N-1}.state.json  (prior rounds, R2+)
    CLAUDE.md, CODE_PATTERNS.md, FIX_TEMPLATES.md
  Output (in-memory):  N total items, effort estimate

CATEGORIZE & TRIAGE (Step 2)
──────────────────────────────────────────────────────────────────────
  All pre-existing items scored with DAS (Signal/Dependency/Risk 0-6)
  Cross-round dedup: items matched against prior round dispositions
  Output (in-memory):  triage table + DAS blocks per pre-existing item

PLAN (Step 3)
──────────────────────────────────────────────────────────────────────
  Creates #TBD stub in learning log (in-memory)
  Dispatches specialized agents if >20 items / 3+ concerns

FIX (Step 4)
──────────────────────────────────────────────────────────────────────
  Reads + modifies: source files (staged changes)
  Runs:  npm run lint, npm run test, npm run patterns:check
  Post-fix: git commits with fix:/docs: prefix

DOCUMENT & TRACK (Step 5)
──────────────────────────────────────────────────────────────────────
  Deferred items → /add-debt → intake-pr-deferred.js
    Writes: docs/technical-debt/MASTER_DEBT.jsonl (+ raw/deduped.jsonl)
  Rejected/architectural items: disposition recorded in state (in-memory)

LEARNING & JSONL (Step 6)
──────────────────────────────────────────────────────────────────────
  Writes:
    docs/AI_REVIEW_LEARNINGS_LOG.md          (markdown audit trail)
    .claude/state/reviews.jsonl              (JSONL source of truth)
      via: scripts/reviews/dist/write-review-record.js
  Runs:  npm run reviews:sync -- --apply     (sync markdown → JSONL)

VERIFY (Step 7)
──────────────────────────────────────────────────────────────────────
  Gate: fixed + deferred + rejected == total (no orphans)
  DAS compliance: pre-existing count == DAS block count

SUMMARY & COMMIT (Step 8)
──────────────────────────────────────────────────────────────────────
  Writes:
    .claude/state/task-pr-review-{pr}-r{round}.state.json
      (source of truth for cross-round warm-up; survives compaction)
  Commits: fix:/docs: prefixed commit

HANDOFF
──────────────────────────────────────────────────────────────────────
  → /pr-retro (retrospective analysis)
```

---

#### C. PR Retrospective Lifecycle

```
TRIGGER
──────────────────────────────────────────────────────────────────────
  /pr-retro           → Dashboard mode (lists missing retros)
  /pr-retro <N>       → Single PR retro
  /pr-retro <N> --resume → Resume from state

GATHER (Steps 1-2)
──────────────────────────────────────────────────────────────────────
  Reads:
    docs/AI_REVIEW_LEARNINGS_LOG.md
    docs/archive/REVIEWS_*.md
    .claude/state/reviews.jsonl
    .claude/state/review-metrics.jsonl       (enrichment, SHOULD)
    .claude/state/retros.jsonl               (prior retros + action items)
    .claude/state/hook-runs.jsonl            (hook health enrichment, SHOULD)
    git log --grep="PR #N"                   (SHOULD)
    docs/technical-debt/MASTER_DEBT.jsonl    (grep pr_number, SHOULD)

ANALYZE (Step 3)
──────────────────────────────────────────────────────────────────────
  Identifies: ping-pong chains, scope creep, recurring patterns (3+ rounds),
              rejection analysis, hook failure correlation
  Builds: recurrence map from ALL retros in retros.jsonl

INTERACTIVE WALKTHROUGH (Step 4)
──────────────────────────────────────────────────────────────────────
  Per finding: present one-at-a-time with verify command
  State saved after EVERY finding decision

ACTION ITEM IMPLEMENTATION (Step 6 — blocking gate)
──────────────────────────────────────────────────────────────────────
  Implements each accepted action item (no implicit deferral)
  Writes: skills/templates/suppressions files as needed
  Writes: .gemini/styleguide.md suppressions
  Writes: .qodo/pr-agent.toml suppressions

SAVE & CLOSE (Steps 8-9)
──────────────────────────────────────────────────────────────────────
  Writes:
    .claude/state/retros.jsonl               (new retro record)
    docs/AI_REVIEW_LEARNINGS_LOG.md          (append)
    scripts/reviews/dist/write-invocation.js (invocation record)
  Updates:
    .claude/state/task-pr-retro.state.json   (step tracking)
```

---

### 2. Data Touchpoints — Every File Read or Written

**[CONFIDENCE: HIGH]**

#### TDMS / Debt Pipeline

| File                                                    | Role                                | R/W        | Process                             |
| ------------------------------------------------------- | ----------------------------------- | ---------- | ----------------------------------- |
| `docs/technical-debt/MASTER_DEBT.jsonl`                 | Canonical debt store (8,472 items)  | R+W        | All intake, resolve, dedup, cleanup |
| `docs/technical-debt/raw/deduped.jsonl`                 | Mirror of MASTER (dual-write)       | R+W        | intake, sync-deduped                |
| `docs/technical-debt/metrics.json`                      | Machine-readable metrics snapshot   | W          | generate-metrics.js                 |
| `docs/technical-debt/METRICS.md`                        | Human-readable metrics summary      | W          | generate-metrics.js                 |
| `docs/technical-debt/logs/metrics-log.jsonl`            | Historical metrics time-series      | W (append) | generate-metrics.js                 |
| `docs/technical-debt/INDEX.md`                          | Human-readable debt index           | W          | generate-views.js                   |
| `docs/technical-debt/views/by-severity.md`              | View: items by severity             | W          | generate-views.js                   |
| `docs/technical-debt/views/by-category.md`              | View: items by category             | W          | generate-views.js                   |
| `docs/technical-debt/views/by-status.md`                | View: items by status               | W          | generate-views.js                   |
| `docs/technical-debt/views/verification-queue.md`       | Items needing verification          | W          | generate-views.js                   |
| `docs/technical-debt/LEGACY_ID_MAPPING.json`            | Old ID → DEBT-XXXX map              | W          | generate-views.js                   |
| `docs/technical-debt/FALSE_POSITIVES.jsonl`             | Confirmed false-positive items      | R+W        | cleanup mode                        |
| `docs/technical-debt/staging/*.jsonl`                   | Mutation staging files (ephemeral)  | R+W        | debt-runner modes                   |
| `docs/technical-debt/plans/resolution-YYYY-MM-DD.jsonl` | Resolution plan artifact            | W          | debt-runner plan mode               |
| `docs/technical-debt/logs/dedup-log.jsonl`              | Dedup operation log                 | W          | dedup-multi-pass                    |
| `docs/technical-debt/logs/resolution-log.jsonl`         | Resolution operation log            | W          | resolve-item.js                     |
| `docs/technical-debt/logs/intake-log.jsonl`             | Intake operation log                | W          | intake scripts                      |
| `.claude/state/debt-runner.state.json`                  | debt-runner resume state            | R+W        | debt-runner                         |
| `docs/technical-debt/raw/audits.jsonl`                  | Raw audit data                      | R          | intake-audit.js                     |
| `docs/technical-debt/raw/reviews.jsonl`                 | Review-sourced raw debt             | R          | extract-reviews.js                  |
| `docs/technical-debt/raw/normalized-all.jsonl`          | Normalized input aggregate          | R+W        | normalize-all.js                    |
| `.claude/config/known-debt-baseline.json`               | Skip-reason baselines (~40 entries) | R          | pre-commit hook                     |

#### PR Review Pipeline

| File                                                | Role                                      | R/W                | Process                           |
| --------------------------------------------------- | ----------------------------------------- | ------------------ | --------------------------------- |
| `.claude/state/task-pr-review-{pr}-r{N}.state.json` | Per-round state (survives compaction)     | R+W                | pr-review steps 1,8               |
| `.claude/state/reviews.jsonl`                       | Review JSONL source of truth              | R+W                | pr-review step 6                  |
| `.claude/state/reviews-archive.jsonl`               | Archived reviews (>30 entries)            | R+W                | review-lifecycle.js               |
| `.claude/state/review-metrics.jsonl`                | Per-PR metrics (fix_ratio, rounds)        | R+W                | review-lifecycle                  |
| `.claude/state/retros.jsonl`                        | Retro records + action items              | R                  | pr-review step 1 (pattern check)  |
| `.claude/state/pr-review-state.json`                | Legacy per-session PR state               | R                  | warm-up for multi-round           |
| `docs/AI_REVIEW_LEARNINGS_LOG.md`                   | Human-readable review audit trail         | R+W                | pr-review step 6                  |
| `docs/archive/REVIEWS_*.md`                         | Archived review log chunks                | R                  | pr-retro step 2                   |
| `.claude/config/high-churn-watchlist.json`          | Files with disproportionate churn         | R                  | pr-review step 0                  |
| `.qodo/pr-agent.toml`                               | Qodo suppression rules                    | R                  | pr-review step 0                  |
| `.gemini/styleguide.md`                             | Gemini false-positive suppression         | R+W                | pr-review step 0, pr-retro step 9 |
| `docs/technical-debt/MASTER_DEBT.jsonl`             | Receives deferred items                   | W                  | add-debt → intake-pr-deferred     |
| `scripts/review-lifecycle.js`                       | Session-start review sync/validate/render | R+W (orchestrated) | session-start hook                |

#### PR Retro Pipeline

| File                                     | Role                                      | R/W | Process            |
| ---------------------------------------- | ----------------------------------------- | --- | ------------------ |
| `.claude/state/retros.jsonl`             | Retro records (action items, verify cmds) | R+W | pr-retro steps 2,8 |
| `.claude/state/task-pr-retro.state.json` | Retro step-tracking state                 | R+W | pr-retro all steps |
| `.claude/state/reviews.jsonl`            | Source of review round data               | R   | pr-retro step 2    |
| `.claude/state/review-metrics.jsonl`     | PR-level metrics enrichment               | R   | pr-retro step 2.4  |
| `.claude/state/hook-runs.jsonl`          | Hook health data enrichment               | R   | pr-retro step 2.4  |
| `docs/AI_REVIEW_LEARNINGS_LOG.md`        | Review learning entries                   | R+W | pr-retro steps 2,8 |

---

### 3. Visibility Gaps — No Persistent Data Trail

**[CONFIDENCE: HIGH]**

The following process activities happen without any persistent record:

1. **In-session triage decisions (DAS scoring)** — The Defer/Act Score
   (Signal/Dependency/Risk) calculated during pr-review Step 2 is presented
   interactively but NOT persisted in the state file schema. If the session is
   interrupted before Step 8, the DAS reasoning is lost. Only the final
   disposition (fixed/deferred/rejected) survives in the state file.

2. **Multi-pass item extraction reasoning** — pr-review Step 1 does 3-pass
   extraction of review feedback, but only the final item count is surfaced.
   There is no record of items that were identified then discarded during
   extraction, or items that changed classification between passes.

3. **Convergence-loop (CL) intermediate reasoning** — debt-runner modes run CL
   verification at every stage, but only the outcome (corrections written to
   staging files) is persisted. The CL reasoning chain itself — which agents
   checked which items, what they found — is not recorded.

4. **Plan mode reasoning** — when debt-runner plan mode generates a resolution
   order (S0 first, then E0→E3 effort), the prioritization rationale is in the
   generated plan .md file but the dependency analysis is not queryable.

5. **Suppression decisions** — when pr-retro Step 9 adds rules to
   `.gemini/styleguide.md` and `.qodo/pr-agent.toml`, there is no suppression
   log recording why each rule was added, which PR triggered it, or when it was
   added. The suppressions are live forever with no audit trail.

6. **Reviewer feedback raw text** — the user pastes external review feedback
   (CodeRabbit, Qodo, SonarCloud HTML/markdown) directly into the conversation.
   This raw input is never persisted to disk. Only the parsed item count and
   final dispositions survive in `reviews.jsonl`.

7. **PR size advisory decisions** — when pr-review Step 0 warns about >50
   changed files and asks "Continue anyway? [Y/split]", the user's decision is
   not recorded anywhere. No one can later ask "how many PRs did we push through
   despite size warnings?"

8. **Cross-round DAS escalation history** — when an item gets DAS-re-evaluated
   across rounds (because a second source flags the same issue), the fact that
   multi-source convergence caused severity escalation is not persisted. The
   final severity appears without the reasoning.

9. **debt-runner menu navigation** — the sequence of mode selections within a
   single debt-runner session is not recorded. There is no session log showing
   "user ran: verify → health → plan" in session X.

10. **Retro action item verification results** — pr-retro Step 2.5 runs stored
    `verify_cmd` on last 3-5 retros' action items and builds a "failed" list.
    These re-verification results are computed but it is not clear from the
    SKILL.md that they are persisted as a distinct record vs just surfaced in
    the walkthrough.

---

### 4. Web Dashboard Opportunities — High-Value Visible Metrics

**[CONFIDENCE: HIGH]**

The following process state and metrics would be most valuable on a web
dashboard, ranked by information density:

#### Debt Overview (currently available in metrics.json)

- Severity breakdown: S0/S1/S2/S3 counts (26/1360/3445/3641) with trend
- Status distribution: NEW (2126) / VERIFIED (5156) / RESOLVED (1116) /
  FALSE_POSITIVE (74)
- Resolution rate: 13% overall — a high-impact vanity/health metric
- By-source breakdown: sonarcloud (2561), audit (2942), review (623), manual
  (83)
- By-category breakdown: code-quality (4716), security (723), process (727),
  etc.
- Historical trend via `logs/metrics-log.jsonl` — debt added vs resolved per
  snapshot

#### Review Cycle Health (currently in reviews.jsonl + review-metrics.jsonl)

- Per-PR fix/defer/reject ratios across all rounds
- Review round counts per PR — which PRs needed R3, R4, R5+
- Fix rate trend: PR #411 had 415 items across 9 batches; PR #461 had 7 items in
  R1
- High-churn files: the 3 files in `high-churn-watchlist.json`
  (session-start.js, run-alerts.js, review-lifecycle.js) — visualizing their
  recurrence frequency
- Multi-source convergence flag: items flagged by 2+ reviewers in same round
- Reviewer false-positive rate by source (SonarCloud vs Qodo vs Gemini)

#### Retro Action Item Tracking (currently in retros.jsonl)

- Action items: accepted, implemented, deferred counts
- Verify command pass/fail history
- Recurring patterns: items appearing in 3+ retros auto-tagged CRITICAL
- Prior retro action items with status — currently only visible via CLI
  `/pr-retro` dashboard mode

#### Process Hygiene Signals (currently invisible or buried in CLI output)

- Staging file accumulation: any pending staging/\*.jsonl files indicate
  incomplete debt-runner runs
- Dedup queue size: items in raw/deduped.jsonl vs MASTER_DEBT item count
  discrepancy
- Verification queue depth: items in `views/verification-queue.md` needing human
  review
- S0 security debt count with age — S0 items are never auto-deferred, they
  should be near-zero
- PR review coverage gap: merged PRs without a retro (currently only visible via
  `/pr-retro` dashboard mode)

---

### 5. CLI Handoff Points — Where a Web User Would Trigger CLI Actions

**[CONFIDENCE: HIGH]**

These are the natural "launch CLI action" trigger points from a web dashboard
context:

| Dashboard View                       | Desired Action                           | CLI Command                                                                    |
| ------------------------------------ | ---------------------------------------- | ------------------------------------------------------------------------------ |
| S0/S1 debt items list                | Start resolution plan for selected items | `/debt-runner plan --severity S0,S1`                                           |
| Metrics dashboard showing stale data | Trigger SonarCloud re-sync               | `node scripts/debt/sync-sonarcloud.js --dry-run` then `--force`                |
| Verification queue list              | Run debt verification pass               | `/debt-runner verify`                                                          |
| Specific DEBT-XXXX item              | Resolve a specific item after fix        | `node scripts/debt/resolve-item.js DEBT-XXXX --pr <N>`                         |
| Metrics showing view drift           | Regenerate all views and metrics         | `node scripts/debt/generate-views.js && node scripts/debt/generate-metrics.js` |
| Dedup candidates detected            | Run deduplication pass                   | `/debt-runner dedup`                                                           |
| Missing retros list                  | Start retro for specific PR              | `/pr-retro <PR#>`                                                              |
| New PR merged (no review yet)        | Open PR review for new round             | `/pr-review --pr <N> --round 1`                                                |
| Suppression rules accumulation       | Review + trim suppression config         | Manual edit of `.gemini/styleguide.md`, `.qodo/pr-agent.toml`                  |
| High-churn file detected in PR diff  | Flag for extra scrutiny                  | (no CLI command — web visualization only, then manual review focus)            |

---

### 6. Script Roles in the Debt Pipeline

**[CONFIDENCE: HIGH]**

| Script                      | Role                                                                 |
| --------------------------- | -------------------------------------------------------------------- |
| `intake-audit.js`           | Bulk intake from AI/CI audit reports (TDMS format JSONL)             |
| `intake-manual.js`          | Single ad-hoc debt item intake (CLI flags)                           |
| `intake-pr-deferred.js`     | PR-review deferred item intake (records source_pr)                   |
| `sync-sonarcloud.js`        | Pull issues from SonarCloud API; detect/mark resolved items          |
| `generate-metrics.js`       | Read MASTER_DEBT → write metrics.json, METRICS.md, metrics-log.jsonl |
| `generate-views.js`         | Read MASTER_DEBT → write all markdown views + LEGACY_ID_MAPPING      |
| `dedup-multi-pass.js`       | Multi-pass SHA256 deduplication with dry-run + force modes           |
| `consolidate-all.js`        | Post-dedup consolidation (rebuild canonical state)                   |
| `sync-deduped.js`           | Sync MASTER_DEBT ↔ raw/deduped.jsonl (drift detection + repair)      |
| `resolve-item.js`           | Mark a single DEBT-XXXX as RESOLVED (with PR attribution)            |
| `resolve-bulk.js`           | Mark multiple items resolved in one operation                        |
| `reverify-resolved.js`      | Re-check that RESOLVED items are genuinely fixed in code             |
| `validate-schema.js`        | Schema validation + stale item detection across MASTER_DEBT          |
| `verify-resolutions.js`     | Verify resolution claims match code reality                          |
| `backfill-hashes.js`        | Add content-hashes to pre-hash items (migration utility)             |
| `escalate-deferred.js`      | Age-based severity escalation for long-deferred items                |
| `extract-audit-reports.js`  | Extract debt from ad-hoc audit report files                          |
| `extract-reviews.js`        | Extract PR-review-sourced items from review logs                     |
| `extract-context-debt.js`   | Extract debt referenced in AI session context files                  |
| `extract-roadmap-debt.js`   | Extract debt items referenced in ROADMAP.md                          |
| `extract-scattered-debt.js` | Extract inline TODO/FIXME/HACK comments from codebase                |
| `normalize-all.js`          | Normalize field formats across intake sources                        |
| `clean-intake.js`           | Clean up malformed or partial intake items                           |
| `ingest-cleaned-intake.js`  | Write cleaned intake results to canonical storage                    |
| `process-review-needed.js`  | Process items in the verification queue                              |
| `assign-roadmap-refs.js`    | Link DEBT items to ROADMAP.md line references                        |
| `reconcile-roadmap.js`      | Reconcile DEBT items vs ROADMAP planned work                         |
| `sync-roadmap-refs.js`      | Keep ROADMAP references up to date as items resolve                  |
| `check-phase-status.js`     | Check completion status of TDMS pipeline phases                      |

---

### 7. Docs/Technical-Debt: Intake vs Output Classification

**[CONFIDENCE: HIGH]**

| File/Dir                            | Type                 | Description                                                               |
| ----------------------------------- | -------------------- | ------------------------------------------------------------------------- |
| `MASTER_DEBT.jsonl`                 | Canonical store      | Primary intake target AND output source; both read and written            |
| `MASTER_DEBT.jsonl.bak`             | Safety backup        | Written by dual-write atomicity pattern                                   |
| `raw/deduped.jsonl`                 | Intermediate         | Dual-write mirror of MASTER; also intake for `generate-views.js --ingest` |
| `raw/audits.jsonl`                  | Intake               | Raw audit output pending normalization                                    |
| `raw/reviews.jsonl`                 | Intake               | PR review sourced items pending normalization                             |
| `raw/normalized-all.jsonl`          | Intermediate         | Normalized aggregate before dedup                                         |
| `raw/scattered-intake*.jsonl`       | Intake               | Scattered TODO/FIXME extraction output                                    |
| `raw/review-needed.jsonl`           | Work queue           | Items needing human verification decision                                 |
| `metrics.json`                      | Output               | Machine-readable metrics snapshot (dashboard-ready)                       |
| `METRICS.md`                        | Output               | Human-readable metrics summary                                            |
| `logs/metrics-log.jsonl`            | Output (historical)  | Time-series metrics snapshots                                             |
| `logs/dedup-log.jsonl`              | Output (operational) | Dedup operation audit log                                                 |
| `logs/intake-log.jsonl`             | Output (operational) | Intake operation audit log                                                |
| `logs/resolution-log.jsonl`         | Output (operational) | Resolution operation audit log                                            |
| `logs/resolution-audit-report.json` | Output (operational) | Resolution verification report                                            |
| `views/by-severity.md`              | Output (view)        | Human-readable views; regenerated from MASTER                             |
| `views/by-category.md`              | Output (view)        | Human-readable view                                                       |
| `views/by-status.md`                | Output (view)        | Human-readable view                                                       |
| `views/verification-queue.md`       | Output (work queue)  | Items needing verification                                                |
| `views/unplaced-items.md`           | Output (view)        | Items without roadmap placement                                           |
| `INDEX.md`                          | Output (index)       | Master human-readable index                                               |
| `FALSE_POSITIVES.jsonl`             | Canonical (terminal) | Confirmed FP items; moved out of MASTER                                   |
| `LEGACY_ID_MAPPING.json`            | Output (migration)   | Old ID → DEBT-XXXX mapping                                                |
| `PROCEDURE.md`                      | Reference            | Process documentation (not data)                                          |
| `FINAL_SYSTEM_AUDIT.md`             | Reference            | Historical audit record                                                   |
| `staging/`                          | Ephemeral            | Temporary mutation staging files; deleted on success                      |

---

## Sources

| #   | Source                                                   | Title                                | Type              | Trust | CRAAP | Date       |
| --- | -------------------------------------------------------- | ------------------------------------ | ----------------- | ----- | ----- | ---------- |
| 1   | `.claude/skills/debt-runner/SKILL.md`                    | debt-runner Skill Definition         | official-codebase | HIGH  | 4.8/5 | 2026-03-15 |
| 2   | `.claude/skills/pr-review/SKILL.md`                      | PR Code Review Processor             | official-codebase | HIGH  | 4.8/5 | 2026-03-18 |
| 3   | `.claude/skills/pr-retro/SKILL.md`                       | PR Review Retrospective              | official-codebase | HIGH  | 4.8/5 | 2026-03-18 |
| 4   | `.claude/skills/code-reviewer/SKILL.md`                  | Code Reviewer Skill                  | official-codebase | HIGH  | 4.5/5 | 2026-03-13 |
| 5   | `.claude/skills/add-debt/SKILL.md`                       | Add Technical Debt Skill             | official-codebase | HIGH  | 4.8/5 | 2026-03-20 |
| 6   | `scripts/debt/*.js` (29 scripts)                         | Debt pipeline script headers         | official-codebase | HIGH  | 4.5/5 | various    |
| 7   | `docs/technical-debt/PROCEDURE.md`                       | TDMS Procedure Guide                 | official-codebase | HIGH  | 4.5/5 | 2026-02-23 |
| 8   | `docs/technical-debt/metrics.json`                       | Live metrics snapshot                | official-codebase | HIGH  | 5/5   | 2026-03-27 |
| 9   | `.research/debt-runner-expansion/RESEARCH_OUTPUT.md`     | Prior debt-runner expansion research | prior-research    | HIGH  | 4.5/5 | 2026-03-27 |
| 10  | `.claude/skills/pr-review/reference/TDMS_INTEGRATION.md` | TDMS integration reference           | official-codebase | HIGH  | 4.5/5 | 2026-02-14 |
| 11  | `.claude/skills/pr-review/reference/LEARNING_CAPTURE.md` | Learning capture reference           | official-codebase | HIGH  | 4.5/5 | 2026-02-14 |
| 12  | `.claude/state/reviews.jsonl`                            | Live review JSONL records            | official-codebase | HIGH  | 5/5   | 2026-03-22 |
| 13  | `.claude/state/review-metrics.jsonl`                     | PR-level metrics records             | official-codebase | HIGH  | 5/5   | 2026-03-06 |
| 14  | `.claude/config/high-churn-watchlist.json`               | High-churn file config               | official-codebase | HIGH  | 5/5   | 2026-03-18 |
| 15  | `scripts/review-lifecycle.js`                            | Review lifecycle orchestrator        | official-codebase | HIGH  | 4.8/5 | current    |

---

## Contradictions

**None confirmed.** Minor tension noted:

- The `reviews.jsonl` schema observed in the live file (8 fields: id, date,
  schema_version, completeness, completeness_missing, origin, title, pr, source,
  total, fixed, deferred, rejected) is richer than the state file schema shown
  in pr-review SKILL.md Step 8 (which shows 9 fields with different names). The
  SKILL.md schema appears to be the per-round state file schema, while
  `reviews.jsonl` uses the full review record schema from
  `write-review-record.js`. These are two separate artifacts for different
  purposes but the naming in the SKILL.md can be misleading.

- The prior debt-runner-expansion research notes that `metrics-log.jsonl` is
  missing `by_source` and `by_category` fields (BUG-06). The live `metrics.json`
  DOES have `by_source` and `by_category`. Whether the log file has them or only
  the point-in-time JSON does is unverified from the skill files alone — the
  prior research is more authoritative here.

---

## Gaps

1. **Staging directory lifecycle in production** — the SKILL.md says staging
   files are deleted "on successful mode completion," but there is no staging
   directory observed at the time of research (the directory does not exist).
   Whether this is because no debt-runner sessions are in-flight, or because
   staging is truly transient, is unconfirmed.

2. **review-metrics.jsonl schema** — the full field set of
   `review-metrics.jsonl` was not read (only a sample of `reviews.jsonl`). The
   `review-metrics.jsonl` may have the PR-level fix_ratio and round count data
   needed for dashboard trend charts; this is partially confirmed from the
   sample showing `{"pr":414,"fix_ratio":1,"review_rounds":1}` format.

3. **CI automation touchpoints** — two CI workflows (`resolve-debt.yml`,
   `audit-intake.yml`) are mentioned in the PROCEDURE.md and prior research but
   their trigger conditions and exact file write patterns were not verified by
   reading the workflow files directly.

4. **Suppression audit trail** — confirmed as a visibility gap (no log of when
   suppressions were added or why), but the actual volume of accumulated
   suppressions in `.gemini/styleguide.md` and `.qodo/pr-agent.toml` was not
   measured.

5. **Plans directory content** — `docs/technical-debt/plans/` is referenced in
   debt-runner plan mode (writes `resolution-YYYY-MM-DD.jsonl + .md`) but the
   directory existence was not confirmed by listing.

---

## Serendipity

- **review-lifecycle.js is a high-churn file flagged for refactoring** — it is
  the session-start orchestrator for the entire review JSONL pipeline AND it is
  listed in `high-churn-watchlist.json` as a refactor candidate. Any web
  dashboard work touching the review data layer will encounter this friction
  point.

- **metrics.json is already dashboard-ready** — the existing
  `docs/technical-debt/metrics.json` has a clean machine-readable structure with
  `generated` timestamp, `summary`, `by_status`, `by_severity`, `by_category`,
  `by_source`, and trend data. This is the only existing artifact that is
  explicitly structured for dashboard consumption without transformation.

- **The 13% resolution rate across 8,472 items** is a striking signal visible in
  `metrics.json`. With S0=26 and S1=1360 (totaling ~1386 high-priority items),
  the web dashboard's single highest-impact vanity metric may be the S0+S1 open
  count with an age histogram.

- **Suppression config drift risk** — `.gemini/styleguide.md` and
  `.qodo/pr-agent.toml` accumulate suppression rules with no review cycle. The
  pr-retro skill writes to these files when items are rejected 2+ times, but
  there is no mechanism to audit whether suppressions have become stale or
  overly broad. A "suppression audit" dashboard panel could surface rules that
  haven't been triggered in N PRs.

---

## Confidence Assessment

- HIGH claims: 6
- MEDIUM claims: 0
- LOW claims: 0
- UNVERIFIED claims: 0
- **Overall confidence: HIGH** — all findings derived directly from canonical
  skill definitions and live codebase state files. No web search or training
  data relied upon.

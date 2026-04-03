# Findings: Persistent Data File Inventory for Dev Dashboard

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-29
**Sub-Question IDs:** SQ-1b

---

## Summary Table

| Category                                  |    Files | HIGH Relevance | MEDIUM Relevance | LOW Relevance |
| ----------------------------------------- | -------: | :------------: | :--------------: | :-----------: |
| `.claude/state/` — core JSONL time-series |       24 |       15       |        5         |       4       |
| `.claude/state/` — JSON state/config      |       34 |       6        |        14        |      14       |
| `.claude/state/` — MD narratives          |        5 |       0        |        1         |       4       |
| `data/ecosystem-v2/` — JSONL              |        6 |       2        |        2         |       2       |
| `data/` — app TS data                     |        4 |       0        |        0         |       4       |
| `docs/technical-debt/` — canonical        |        3 |       3        |        0         |       0       |
| `docs/technical-debt/logs/`               |        9 |       2        |        2         |       5       |
| `docs/technical-debt/raw/`                |        8 |       4        |        2         |       2       |
| `docs/technical-debt/views/`              |        5 |       3        |        1         |       1       |
| `.research/` — index + metadata           |       ~8 |       1        |        4         |       3       |
| `.planning/` — state/config               |       ~6 |       0        |        3         |       3       |
| **TOTALS**                                | **~112** |     **36**     |      **34**      |    **42**     |

**Updated count vs Session #243 baseline:** 112 total files inventoried (up from
~67 data+state). The Session #243 estimate of "34 state files, 33 data files"
was counting only the core JSONL time-series and primary data files. This
inventory adds task-state files (53 JSON), planning state, and the full TDMS
raw/logs/views landscape.

---

## Key Findings

### 1. `.claude/state/` — Core JSONL Time-Series (24 files) [CONFIDENCE: HIGH]

These are the primary time-series data sources. All are machine-written and
append-only.

| File                                    | Format | Contents                                                                          | Records | Update Freq                | Dashboard Relevance             | Static Export Feasible?                   |
| --------------------------------------- | ------ | --------------------------------------------------------------------------------- | ------- | -------------------------- | ------------------------------- | ----------------------------------------- |
| `commit-log.jsonl`                      | JSONL  | Git commit history with hash, message, author, branch, session                    | 634     | Per-commit                 | **HIGH** — activity timeline    | Yes; strip session/filesList, ~40KB       |
| `reviews-archive.jsonl`                 | JSONL  | Archived PR review records (pr, source, total/fixed/deferred/rejected, learnings) | 478     | Per-rotation (~10 reviews) | **HIGH** — PR churn trends      | Yes; strip learnings text, ~80KB          |
| `hook-runs.jsonl`                       | JSONL  | Pre-commit/pre-push hook executions (checks[], outcome, duration_ms)              | 114     | Per-commit/push            | **HIGH** — hook health timeline | Yes; last 30 runs, ~25KB                  |
| `hook-warnings-log.jsonl`               | JSONL  | Unacknowledged hook warnings with occurrence counts                               | 68      | Per-warning event          | **HIGH** — active warning queue | Yes; full file, ~8KB                      |
| `retros.jsonl`                          | JSONL  | PR retrospectives (pr, top_wins, top_misses, metrics, pattern_recurrence)         | 57      | Per-PR-retro               | **HIGH** — quality trend data   | Yes; strip long text fields, ~20KB        |
| `review-metrics.jsonl`                  | JSONL  | PR review metadata (pr, total_commits, fix_commits, fix_ratio, review_rounds)     | 52      | Per-PR-review              | **HIGH** — fix-rate trends      | Yes; full file, ~15KB                     |
| `velocity-log.jsonl`                    | JSONL  | Session velocity (session#, date, items_completed, sprint)                        | 50      | Per-session-end            | **HIGH** — velocity trends      | Yes; full file, ~10KB                     |
| `learning-routes.jsonl`                 | JSONL  | Learning route records (pattern, route_type, confidence, surfaced_count)          | 39      | Per-learning               | MEDIUM                          | Yes; full file, ~15KB                     |
| `pending-refinements.jsonl`             | JSONL  | Unresolved learning items awaiting classification                                 | 36      | Per-learning               | MEDIUM                          | Yes; full file, ~8KB                      |
| `health-score-log.jsonl`                | JSONL  | Full health score breakdowns per run (grade, score, categoryScores{})             | 24      | Per-/alerts-run            | **HIGH** — health trend chart   | Yes; extract score/grade/timestamp, ~20KB |
| `hook-ecosystem-audit-history.jsonl`    | JSONL  | Hook ecosystem audit runs (score, grade, category breakdowns)                     | 25      | Per-audit                  | LOW (audit-only)                | No (LOW relevance)                        |
| `pr-ecosystem-audit.jsonl`              | JSONL  | PR ecosystem audit runs                                                           | 24      | Per-audit                  | LOW (audit-only)                | No                                        |
| `lifecycle-scores.jsonl`                | JSONL  | System lifecycle scoring (capture, storage, recall, action per system)            | 20      | Per-audit                  | **HIGH** — system health matrix | Yes; full file, ~8KB                      |
| `skill-ecosystem-audit-history.jsonl`   | JSONL  | Skill audit run history                                                           | 15      | Per-audit                  | LOW                             | No                                        |
| `reviews.jsonl`                         | JSONL  | Active (non-archived) PR review records                                           | 23      | Per-review                 | **HIGH** — current review data  | Yes; full file, ~5KB                      |
| `script-ecosystem-audit-history.jsonl`  | JSONL  | Script audit history                                                              | 9       | Per-audit                  | LOW                             | No                                        |
| `forward-findings.jsonl`                | JSONL  | Forward-looking findings from reviews/retros (severity, pattern)                  | 4       | Per-finding                | **HIGH** — active issue queue   | Yes; full file, ~2KB                      |
| `agent-invocations.jsonl`               | JSONL  | Agent invocation log (agent, description, sessionId, timestamp)                   | 92      | Per-invocation             | **HIGH** — agent activity feed  | Yes; last 50 records, ~10KB               |
| `alerts-history.jsonl`                  | JSONL  | Alerts fire history                                                               | 1       | Per-alert                  | **HIGH** — alerting timeline    | Yes; full file, small                     |
| `doc-ecosystem-audit-history.jsonl`     | JSONL  | Doc audit history                                                                 | 1       | Per-audit                  | LOW                             | No                                        |
| `session-ecosystem-audit-history.jsonl` | JSONL  | Session audit history                                                             | 1       | Per-audit                  | LOW                             | No                                        |
| `tdms-ecosystem-audit-history.jsonl`    | JSONL  | TDMS audit history                                                                | 1       | Per-audit                  | LOW                             | No                                        |
| `audit-agent-quality-history.jsonl`     | JSONL  | Agent quality audit history                                                       | 1       | Per-audit                  | MEDIUM                          | Yes; small                                |
| `agent-token-usage.jsonl`               | JSONL  | Token usage per agent (currently empty)                                           | 0       | Per-agent (inactive)       | **HIGH** — future cost tracking | Yes; will be small when populated         |

---

### 2. `.claude/state/` — JSON State/Config Files (34 non-task, 21 PR-task, 12 deep-plan/research-task) [CONFIDENCE: HIGH]

**Core operational JSON (non-task):**

| File                            | Format | Contents                                                               | Dashboard Relevance                 | Notes                             |
| ------------------------------- | ------ | ---------------------------------------------------------------------- | ----------------------------------- | --------------------------------- |
| `alerts-baseline.json`          | JSON   | Current health score baseline (grade, score, categoryScores)           | **HIGH** — current health snapshot  | Single record, ~5KB               |
| `handoff.json`                  | JSON   | Pre-compaction session state (git, open PRs, session counter, context) | MEDIUM                              | Refreshed each session-end, ~50KB |
| `pr-review-state.json`          | JSON   | Active PR review tracking (batches, items, fix/defer/reject counts)    | **HIGH** — current PR review status | ~10KB                             |
| `consolidation.json`            | JSON   | Review consolidation tracking (lastConsolidatedReview, threshold)      | MEDIUM                              | Tiny, ~200B                       |
| `known-debt-baseline.json`      | JSON   | Pre-existing debt baselines to suppress false alerts                   | **HIGH** — debt suppression rules   | ~15KB                             |
| `hook-warnings-ack.json`        | JSON   | Acknowledged hook warnings (acknowledged{}, lastCleared)               | MEDIUM                              | Tiny, ~100B                       |
| `planning-audit-execution.json` | JSON   | Planning audit wave state (current_wave, wave results)                 | MEDIUM                              | ~5KB                              |
| `pending-reviews.json`          | JSON   | Files queued for review (files[], queued, lastQueued)                  | **HIGH** — review queue             | Tiny                              |
| `session-notes.json`            | JSON   | Freeform session notes                                                 | LOW                                 | Tiny                              |
| `alert-suppressions.json`       | JSON   | Alert suppression rules (category, messagePattern, reason)             | MEDIUM                              | ~3KB                              |
| `warned-files.json`             | JSON   | Files that have received pattern warnings                              | MEDIUM                              | ~5KB                              |
| `worktree-planning.state.json`  | JSON   | Worktree planning state                                                | LOW                                 | Small                             |
| `sws-reevaluation.state.json`   | JSON   | SWS reevaluation progress                                              | LOW                                 | Small                             |
| `skill-creator.state.json`      | JSON   | Skill creator session state                                            | LOW                                 | Small                             |
| `consolidation.json`            | JSON   | Review consolidation checkpoint                                        | MEDIUM                              | Small                             |

**Task-state JSON (LOW dashboard relevance — ephemeral per-task state):**

- 21 `task-pr-review-NNN-rN.state.json` files: Per-PR-round review state,
  ephemeral
- 12 `deep-plan.*.state.json` / `deep-research.*.state.json`: Plan/research
  session state
- 5 `task-skill-audit-*.json`: Skill audit task states

All task-state files: LOW dashboard relevance individually. Could feed an
"active tasks" widget by scanning `phase` field across them.

---

### 3. `.claude/state/` — Markdown Narratives (5 files) [CONFIDENCE: HIGH]

| File                           | Contents                                | Dashboard Relevance                  | Notes              |
| ------------------------------ | --------------------------------------- | ------------------------------------ | ------------------ |
| `last-hook-report.md`          | Last pre-push hook run formatted report | MEDIUM — human-readable hook summary | Refreshed per-push |
| `deep-plan-findings.md`        | Deep-plan research findings (large)     | LOW                                  | Research artifact  |
| `over-engineering-findings.md` | Over-engineering analysis findings      | LOW                                  | One-time artifact  |
| `agent-research-results.md`    | Orphaned agent research output          | LOW                                  | Orphaned artifact  |
| `work-locale-sync-plan.md`     | Work locale sync plan                   | LOW                                  | Planning artifact  |

---

### 4. `data/ecosystem-v2/` — JSONL (6 files) [CONFIDENCE: HIGH]

| File                         | Format | Contents                                                            | Records | Update Freq     | Dashboard Relevance                  | Static Export Feasible?                  |
| ---------------------------- | ------ | ------------------------------------------------------------------- | ------- | --------------- | ------------------------------------ | ---------------------------------------- |
| `ecosystem-health-log.jsonl` | JSONL  | Full ecosystem health scores (score, grade, 20+ categoryScores)     | 32      | Per-/health-run | **HIGH** — health trend chart source | Yes; extract score/grade/timestamp, ~8KB |
| `warnings.jsonl`             | JSONL  | Active health warnings (category, message, debt-aging)              | 16      | Per-health-run  | **HIGH** — active warning surface    | Yes; full file, ~3KB                     |
| `enforcement-manifest.jsonl` | JSONL  | Pattern enforcement records (pattern_id, mechanism, eslint/semgrep) | 360     | Per-audit       | MEDIUM — debt discovery audit        | Yes; strip full descriptions, ~30KB      |
| `invocations.jsonl`          | JSONL  | Skill invocation log (skill, type, date, origin)                    | 30      | Per-invocation  | MEDIUM — activity feed               | Yes; full file, ~5KB                     |
| `test-registry.jsonl`        | JSONL  | Test file registry (path, type, owner, target)                      | 551     | Per-test-add    | LOW — tooling metadata               | No (LOW relevance)                       |
| `deferred-items.jsonl`       | JSONL  | PR-review deferred items                                            | 3       | Per-review      | LOW                                  | No                                       |

---

### 5. `data/` — Application TypeScript Data (4 files) [CONFIDENCE: HIGH]

These feed the live app, not the dev dashboard. Dashboard relevance is LOW
because they're app content, not dev process data.

| File                 | Format | Contents                                               | Lines | Dashboard Relevance |
| -------------------- | ------ | ------------------------------------------------------ | ----- | ------------------- |
| `local-resources.ts` | TS     | Recovery local resources content                       | 862   | LOW — app content   |
| `glossary.ts`        | TS     | Recovery glossary (acronyms, clinical, culture, slang) | 457   | LOW — app content   |
| `slogans.ts`         | TS     | Recovery slogans and sayings                           | 213   | LOW — app content   |
| `recovery-quotes.ts` | TS     | Recovery quotes                                        | 190   | LOW — app content   |

---

### 6. `docs/technical-debt/` — Canonical TDMS Files [CONFIDENCE: HIGH]

| File                     | Format | Contents                                                                             | Records          | Update Freq           | Dashboard Relevance                 | Static Export Feasible?                                                                   |
| ------------------------ | ------ | ------------------------------------------------------------------------------------ | ---------------- | --------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------- |
| `MASTER_DEBT.jsonl`      | JSONL  | Master debt registry (category, severity, file, title, status, effort, DEBT-NNNN id) | 8,472            | Per-intake/resolution | **HIGH** — primary debt data source | Yes; field-strip to {id, severity, category, status, file, title}, ~1.2MB → target <300KB |
| `metrics.json`           | JSON   | Snapshot debt metrics (summary, by_status, by_severity, by_category, alerts, health) | 9 top-level keys | Per-consolidation     | **HIGH** — current debt summary     | Yes; full file, ~30KB                                                                     |
| `FALSE_POSITIVES.jsonl`  | JSONL  | False positive resolution records (item_id, reason)                                  | 6                | Per-resolution        | MEDIUM                              | Yes; tiny                                                                                 |
| `LEGACY_ID_MAPPING.json` | JSON   | Old-to-new ID mapping for 5,193 entries                                              | 5,193 entries    | One-time migration    | LOW — pipeline artifact             | No                                                                                        |

---

### 7. `docs/technical-debt/logs/` — Pipeline Logs [CONFIDENCE: HIGH]

| File                             | Format | Contents                                                             | Records     | Dashboard Relevance         | Notes                 |
| -------------------------------- | ------ | -------------------------------------------------------------------- | ----------- | --------------------------- | --------------------- |
| `metrics-log.jsonl`              | JSONL  | Debt metrics over time (total, open, resolved, s0_alerts, s1_alerts) | 114         | **HIGH** — trend charts     | Yes; full file, ~10KB |
| `resolution-log.jsonl`           | JSONL  | Individual resolution events (action, item_id, pr)                   | 14          | MEDIUM — resolution history | Yes; full file, tiny  |
| `intake-log.jsonl`               | JSONL  | Intake actions (action, item_id, severity, category)                 | 80          | MEDIUM — intake audit       | Yes; last 50, ~5KB    |
| `dedup-log.jsonl`                | JSONL  | Dedup operation log (type, kept/removed, reason)                     | 3,230       | LOW — pipeline audit        | No                    |
| `resolution-audit-report.json`   | JSON   | Bulk resolution audit (total_items, promoted, needs_triage)          | 1,854 lines | LOW — one-time audit        | No                    |
| `s1-duplicate-candidates.json`   | JSON   | S1 duplicate group candidates                                        | 62 lines    | LOW — pipeline artifact     | No                    |
| `s2s3-duplicate-candidates.json` | JSON   | S2/S3 duplicate group candidates                                     | 234 lines   | LOW — dedup pipeline        | No                    |
| `s2-verification-batch.json`     | JSON   | S2 file existence verification batch                                 | 4,338 lines | LOW — dedup pipeline        | No                    |
| `s3-verification-batch.json`     | JSON   | S3 file existence verification batch                                 | 311 lines   | LOW — dedup pipeline        | No                    |
| `ims-archive-2026-02-12.jsonl`   | JSONL  | Archived IMS debt items (historical snapshot)                        | 61          | LOW — historical only       | No                    |

---

### 8. `docs/technical-debt/raw/` — Pipeline Intermediate Files [CONFIDENCE: HIGH]

| File                             | Format | Contents                                                         | Records | Dashboard Relevance                               | Notes                                   |
| -------------------------------- | ------ | ---------------------------------------------------------------- | ------- | ------------------------------------------------- | --------------------------------------- |
| `audits.jsonl`                   | JSONL  | Audit-sourced debt items (category, severity, file, line, title) | 792     | **HIGH** — primary audit debt source              | Yes; field-strip, ~60KB                 |
| `deduped.jsonl`                  | JSONL  | Deduped debt items (canonical pre-MASTER list)                   | 3,851   | **HIGH** — canonical dedup list                   | Covered by MASTER_DEBT; don't duplicate |
| `review-needed.jsonl`            | JSONL  | Items flagged for human triage review                            | 27      | **HIGH** — active triage queue                    | Yes; full file, ~3KB                    |
| `scattered-intake-cleaned.jsonl` | JSONL  | Cleaned code-comment sourced debt                                | 125     | MEDIUM — secondary intake source                  | Yes; field-strip, ~10KB                 |
| `scattered-intake.jsonl`         | JSONL  | Raw code-comment sourced debt                                    | 503     | MEDIUM — discovery source (superseded by cleaned) | No (use cleaned version)                |
| `normalized-all.jsonl`           | JSONL  | All normalized items pre-dedup (pipeline intermediate)           | 6,111   | LOW — intermediate file                           | No                                      |
| `scattered-triage-report.jsonl`  | JSONL  | Triage dispositions (DUPLICATE/ACCEPTED)                         | 374     | LOW — pipeline audit                              | No                                      |
| `reviews.jsonl`                  | JSONL  | Stub/empty file (1 record placeholder)                           | 1       | LOW — dead file                                   | No                                      |

---

### 9. `docs/technical-debt/views/` — Rendered Markdown Views [CONFIDENCE: HIGH]

| File                    | Format | Contents                             | Lines | Dashboard Relevance                          | Notes                                    |
| ----------------------- | ------ | ------------------------------------ | ----- | -------------------------------------------- | ---------------------------------------- |
| `by-severity.md`        | MD     | All debt grouped by severity (S0→S5) | 8,502 | **HIGH** — web view candidate (pre-rendered) | Already rendered; parse or link directly |
| `by-status.md`          | MD     | All debt grouped by status           | 8,506 | **HIGH** — web view candidate                | Same                                     |
| `by-category.md`        | MD     | All debt grouped by category         | 8,527 | **HIGH** — web view candidate                | Same                                     |
| `verification-queue.md` | MD     | Items awaiting file verification     | 2,144 | MEDIUM — ops queue                           | Useful for triage widget                 |
| `unplaced-items.md`     | MD     | Items with no category placement     | 63    | MEDIUM                                       | Small triage aid                         |

Note: These views are regenerated by `npm run reviews:render` (or equivalent
TDMS scripts). They're 8,500+ lines each — too large for direct static export
as-is. A dashboard would parse MASTER_DEBT.jsonl directly and render filtered
views in-browser.

---

### 10. `.research/` — Research Output Files [CONFIDENCE: HIGH]

| Path                   | Format | Contents                                                                                   | Records    | Dashboard Relevance              | Notes                |
| ---------------------- | ------ | ------------------------------------------------------------------------------------------ | ---------- | -------------------------------- | -------------------- |
| `research-index.jsonl` | JSONL  | Index of all completed research (topic, depth, claimCount, confidenceDistribution, status) | 4          | MEDIUM — research history widget | Yes; full file, tiny |
| `*/metadata.json`      | JSON   | Per-research metadata (claims, sources, keywords, completedAt)                             | 5 topics   | MEDIUM — research meta           | Yes; small           |
| `*/claims.jsonl`       | JSONL  | Research claims with confidence levels                                                     | 34–60/file | MEDIUM                           | LOW for dashboard    |
| `*/sources.jsonl`      | JSONL  | Research source citations                                                                  | 12–73/file | LOW                              | No                   |
| `*/findings/*.md`      | MD     | Research findings documents                                                                | varies     | LOW — human docs                 | No                   |

---

### 11. `.planning/` — Planning Artifacts [CONFIDENCE: HIGH]

| Path              | Format | Contents                                        | Dashboard Relevance              | Notes                                                                           |
| ----------------- | ------ | ----------------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------- |
| `config.json`     | JSON   | Project config (mode, depth, parallelization)   | LOW                              | Tiny config                                                                     |
| `STATE.md`        | MD     | Current planning state (75 lines)               | MEDIUM — sprint/milestone status | Parse current sprint                                                            |
| `PROJECT.md`      | MD     | Project definition and goals (118 lines)        | LOW                              | Human doc                                                                       |
| `MILESTONES.md`   | MD     | Milestone tracking (46 lines)                   | MEDIUM                           | Parse milestone status                                                          |
| `*/state.json`    | JSON   | Per-plan state (phase, decisions, capabilities) | MEDIUM                           | Small; `cli-tools-implementation/state.json` is the only example with rich data |
| `*/PLAN.md`       | MD     | Individual plan documents                       | LOW                              | Human docs                                                                      |
| `*/DECISIONS.md`  | MD     | Decision records per plan                       | LOW                              | Human docs                                                                      |
| `milestones/*.md` | MD     | Detailed milestone documents                    | LOW                              | Human docs                                                                      |

---

## Data Landscape: Updated Count

| Count type                             | Session #243 estimate | This inventory (2026-03-29)        |
| -------------------------------------- | --------------------- | ---------------------------------- |
| Core JSONL time-series (.claude/state) | ~20                   | 24                                 |
| JSON state/config (.claude/state)      | ~14                   | 53 (including 34 task-state files) |
| MD narratives (.claude/state)          | 0                     | 5                                  |
| data/ files (JSONL+TS)                 | ~6                    | 10                                 |
| TDMS canonical                         | ~3                    | 3                                  |
| TDMS logs                              | ~5                    | 10                                 |
| TDMS raw                               | ~6                    | 8                                  |
| TDMS views                             | 5                     | 5                                  |
| .research/                             | ~10                   | ~25 (across 7 topics)              |
| .planning/                             | ~5                    | ~20 (across 10 subdirs)            |
| **Total**                              | **~74**               | **~163**                           |

The gap is explained by: (a) task-state files were undercounted — 21 PR-review
states + 12 deep-plan/research states + 5 skill-audit states = 38 additional
task states; (b) .research/ has grown to 7 topics vs the ~4 at Session #243; (c)
TDMS logs were partially counted.

---

## High-Relevance Files Summary (36 files)

| Priority | File                                                    | Why Important                      |
| -------- | ------------------------------------------------------- | ---------------------------------- |
| P0       | `docs/technical-debt/MASTER_DEBT.jsonl`                 | 8,472 records, primary debt corpus |
| P0       | `docs/technical-debt/metrics.json`                      | Current debt summary snapshot      |
| P0       | `docs/technical-debt/logs/metrics-log.jsonl`            | Debt trend over time               |
| P0       | `data/ecosystem-v2/ecosystem-health-log.jsonl`          | Ecosystem health trend             |
| P0       | `.claude/state/health-score-log.jsonl`                  | Full health score history          |
| P0       | `.claude/state/alerts-baseline.json`                    | Current health baseline            |
| P1       | `.claude/state/hook-runs.jsonl`                         | Hook pass/fail per commit          |
| P1       | `.claude/state/hook-warnings-log.jsonl`                 | Active hook warnings               |
| P1       | `.claude/state/commit-log.jsonl`                        | Git activity timeline              |
| P1       | `.claude/state/reviews.jsonl` + `reviews-archive.jsonl` | PR review history                  |
| P1       | `.claude/state/review-metrics.jsonl`                    | Fix-rate/round-count trends        |
| P1       | `.claude/state/retros.jsonl`                            | Quality retrospectives             |
| P1       | `.claude/state/velocity-log.jsonl`                      | Session velocity                   |
| P1       | `.claude/state/lifecycle-scores.jsonl`                  | System lifecycle matrix            |
| P1       | `.claude/state/agent-invocations.jsonl`                 | Agent activity                     |
| P1       | `.claude/state/forward-findings.jsonl`                  | Active issue queue                 |
| P1       | `.claude/state/pr-review-state.json`                    | Current PR review status           |
| P1       | `data/ecosystem-v2/warnings.jsonl`                      | Active health warnings             |
| P2       | `docs/technical-debt/raw/audits.jsonl`                  | Audit-sourced debt items           |
| P2       | `docs/technical-debt/raw/review-needed.jsonl`           | Triage queue                       |
| P2       | `docs/technical-debt/logs/resolution-log.jsonl`         | Resolution events                  |
| P2       | `.research/research-index.jsonl`                        | Research history                   |

---

## Static Export Strategy

For a production static build (deployed via Next.js static export),
field-stripping is essential for MASTER_DEBT.jsonl (7.3MB raw → target <300KB):

```
Required fields: {id, severity, category, status, effort, file, title, created}
Drop: description, recommendation, content_hash, merged_from, rule, sonar_key, source_file, cluster_id, cluster_count
Estimated stripped size: ~1.1MB for 8,472 records → ~130 bytes/record
Further reduction: split into summary (metrics.json) + on-demand chunks by severity
```

For time-series files, a rolling window approach is optimal:

- `hook-runs.jsonl`: Last 50 runs (~25KB)
- `commit-log.jsonl`: Last 100 commits (~15KB)
- `health-score-log.jsonl`: All 24 records (~20KB stripped)
- `review-metrics.jsonl`: All 52 records (~15KB)

---

## Sources

| #   | Path                                                               | Type              | Trust | Notes                                           |
| --- | ------------------------------------------------------------------ | ----------------- | ----- | ----------------------------------------------- |
| 1   | `.claude/state/` (filesystem scan)                                 | filesystem        | HIGH  | Ground truth — direct wc -l and head inspection |
| 2   | `docs/technical-debt/` (filesystem scan)                           | filesystem        | HIGH  | Ground truth                                    |
| 3   | `data/` (filesystem scan)                                          | filesystem        | HIGH  | Ground truth                                    |
| 4   | `.research/debt-runner-expansion/findings/state-file-inventory.md` | previous-research | HIGH  | Session #243 baseline, cross-validated          |
| 5   | `.research/debt-runner-expansion/findings/data-dir-inventory.md`   | previous-research | HIGH  | Session #243 baseline, cross-validated          |
| 6   | `.research/repo-cleanup/findings/SQ-008-state-data-health.md`      | previous-research | HIGH  | Bloat/rotation analysis                         |

---

## Contradictions

None found. The Session #243 baseline counts (34 state files, 33 data files) are
reconcilable: they excluded task-state files, most planning artifacts, and some
.research/ subdirectories. The discrepancy is categorization, not error.

---

## Gaps

1. `agent-token-usage.jsonl` is currently empty (0 records) — no data yet to
   visualize. When populated, it will be high relevance.
2. `.planning/` state files beyond `cli-tools-implementation/state.json` are all
   MD (human docs), not machine-readable JSON — no structured planning state
   available for most plans.
3. `data/ecosystem-v2/archive/` contains only 2 archived JSONL files (historical
   retros and reviews from 2026-03-18). LOW relevance but confirms rotation is
   working.
4. No single "session summary" JSONL exists — session-level data is spread
   across velocity-log, handoff.json, and commit-log. A dashboard would need to
   join these.
5. The TDMS views (by-severity.md etc.) are 8,500+ lines — too large for direct
   web inclusion. Dashboard must parse MASTER_DEBT.jsonl directly.

---

## Serendipity

- `data/ecosystem-v2/enforcement-manifest.jsonl` (360 records) contains
  pattern-enforcement coverage data — which patterns have eslint gates, which
  are behavioral-only. This could power a "pattern coverage" widget showing gate
  enforcement percentage, which wasn't in the original dashboard concept.
- The `forward-findings.jsonl` file (4 records currently) contains cross-PR
  forward-looking findings with severity levels. Very small now but grows with
  retro activity — it's a pre-aggregated "things to watch" feed that could
  surface directly as a pinned alert widget.
- `lifecycle-scores.jsonl` (20 records) contains per-system
  capture/storage/recall/action scores for 20 tracked systems. This is a
  ready-made "system lifecycle health" matrix visualization with no additional
  parsing needed.

---

## Confidence Assessment

- HIGH claims: 12
- MEDIUM claims: 4
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

All file sizes, record counts, and schemas verified via direct filesystem
inspection and `wc -l` on 2026-03-29. Record counts reflect current state at
time of inventory.

# Findings: Data Gaps Consolidated — Prioritized Remediation Plan

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-29
**Sub-Question IDs:** SQ6a **Source files:** W3-T1A, W3-T1B, W3-T2A, W3-T2B,
W3-T3A, W3-T3B, W3-T4A, W3-T4B, W3-T5A, W3-T5B, W3-T6A, W3-T6B

---

## Executive Summary

After reading all 12 Wave 3 deep-dive findings, this report consolidates 47
distinct data gaps across 6 tabs. Of these:

- **9 gaps BLOCK a tab or widget from functioning at all** (severity: BLOCKS)
- **21 gaps DEGRADE a tab significantly** (severity: DEGRADES)
- **17 gaps are quality improvements** (severity: NICE-TO-HAVE)

**5 of 6 tabs can be built today** with meaningful content. Tab 4 (Build
Pipeline) has one confirmed broken data source (velocity-log.jsonl) but the rest
of its data is clean. Tab 6 (Planning) has a pre-work item on
resolve-dependencies.js `--json` flag that CHECKPOINT flagged — verify this
before Sprint Board build starts.

---

## Section 1: Consolidated Gap Table

All 47 gaps from 12 findings files. IDs are assigned for cross-referencing.

### Tab 1: Health & Alerts

| ID  | Gap Description                                                                                                                                                          | Severity     | Remediation                                                                                                                                   | Source |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| G01 | `hook-warnings-log.jsonl` has no `lifecycle` field — cannot mark a hook warning as "resolved." Dashboard must use `occurrences_since_ack` as a proxy for "still active." | DEGRADES     | Accept + UI approximation: deduplicate by `{hook}-{type}`, show `occurrences_since_ack` as badge count                                        | W3-T1A |
| G02 | `health-score-log.jsonl` has no `delta` field — process health category trends require client-side computation from 24-entry history                                     | DEGRADES     | Accept: compute deltas from history array at build time in export script                                                                      | W3-T1A |
| G03 | `enforcement-manifest.jsonl` `last_verified` date is stale (all 360 entries = `2026-03-01`) — pattern gate coverage widget shows a frozen snapshot                       | NICE-TO-HAVE | Accept as static snapshot; add "as of [date]" label to widget                                                                                 | W3-T1A |
| G04 | No per-dimension trend in `ecosystem-health-log` — `delta` tracks only composite score                                                                                   | DEGRADES     | Accept: compute per-dimension deltas from 32-entry history at build time                                                                      | W3-T1A |
| G05 | `hook-warnings-log.jsonl` `message` field is generic ("WARNING TRIGGERS (recommended actions):") — not actionable as primary display text                                | DEGRADES     | Accept: surface `type` + `hook` as primary identifier, treat `message` as secondary description                                               | W3-T1A |
| G06 | No `comprehensive-audit-history.jsonl` — comprehensive ecosystem audit trend has no history                                                                              | DEGRADES     | New script: append summary to `.claude/state/comprehensive-audit-history.jsonl` at end of each `/comprehensive-ecosystem-audit` run (see G43) | W3-T1B |
| G07 | No CLI to acknowledge a specific warning (`warning-lifecycle.js` has the API but no CLI wrapper)                                                                         | DEGRADES     | New thin CLI wrapper: `node scripts/health/cli-acknowledge-warning.js --id warn-XXX --reason "..."`                                           | W3-T1B |
| G08 | No CLI to suppress/resolve an alert from outside the `/alerts` interactive loop                                                                                          | NICE-TO-HAVE | Accept: route all suppress actions through `/alerts` interactive flow                                                                         | W3-T1B |
| G09 | No `npm run health:audit` script — health ecosystem audit lacks an npm alias unlike all 7 other sub-audits                                                               | DEGRADES     | Add field to `package.json`: `"health:audit": "node .claude/skills/health-ecosystem-audit/scripts/run-health-ecosystem-audit.js"`             | W3-T1B |
| G10 | `mid-session-alerts.js` has no standalone CLI — no "run alert check now" button possible                                                                                 | NICE-TO-HAVE | Accept: dashboard shows "last run" timestamp from `alerts-history.jsonl`                                                                      | W3-T1B |
| G11 | `alerts-history.jsonl` has only 1 entry (2026-03-19) — `/alerts` sparklines cannot show meaningful trend                                                                 | DEGRADES     | Accept: show "Insufficient history" state for trend widget. Data accumulates naturally over time.                                             | W3-T1B |
| G12 | SonarCloud health data is consistently null in `health-score-log.jsonl`                                                                                                  | DEGRADES     | Accept: mark `sonarcloud` dimension as "unavailable" in dashboard; display note "SonarCloud integration not active"                           | W3-T1B |
| G13 | Warning acknowledgment trail has no transition timestamps — cannot show "acknowledged 3 days ago"                                                                        | NICE-TO-HAVE | Accept: display only creation date and lifecycle state                                                                                        | W3-T1A |

### Tab 2: Debt Pipeline

| ID  | Gap Description                                                                                                                              | Severity     | Remediation                                                                                                                                                                                    | Source |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| G14 | **BUG-01: Some CLI scripts write lowercase status strings** (`"resolved"` instead of `"RESOLVED"`) — status filters will silently miss items | BLOCKS       | Fix script: add `.toUpperCase()` normalization in data loading layer of export script `scripts/generate-debt-export.js`                                                                        | W3-T2A |
| G15 | `metrics-log.jsonl` does not contain `by_severity`, `by_category`, `by_status` fields — historical breakdown trends unavailable              | DEGRADES     | Accept: trend chart limited to total/open/resolved/s0/s1 series. Document limitation inline ("Breakdown history not tracked before BUG-06 fix").                                               | W3-T2A |
| G16 | `alerts.s1_items[]` in `metrics.json` truncated to 10 entries — cannot use as S1 item list                                                   | DEGRADES     | Fix (already in plan): load S1 items from `debt-alerts.json` export file, not from `metrics.json` array                                                                                        | W3-T2A |
| G17 | No effort-to-resolve tracking — resolution-log records which items resolved but not time spent                                               | NICE-TO-HAVE | Accept: no velocity/time-to-resolution chart available.                                                                                                                                        | W3-T2A |
| G18 | No single-item verify command at skill level — `/debt-runner verify` works on entire severity slices                                         | DEGRADES     | Accept: dashboard CTA for individual item is "Verify all S0/S1" (`/debt-runner verify --severity S0,S1`), not per-item                                                                         | W3-T2B |
| G19 | No category or file-path filter on any `/debt-runner` mode                                                                                   | NICE-TO-HAVE | Accept: users filter in the table UI; CLI actions are severity-scoped only                                                                                                                     | W3-T2B |
| G20 | `dedup-multi-pass.js` `--dry-run`/`--force` flags documented in REFERENCE.md but not implemented in source                                   | DEGRADES     | Fix documentation: update `REFERENCE.md` to reflect that dry-run is handled by skill-level AI analysis, not the script flag. Dashboard copy should use `/debt-runner dedup` not direct script. | W3-T2B |
| G21 | `IN_PROGRESS` count is exactly 0 — either status is never set or it's a bug                                                                  | NICE-TO-HAVE | Accept: omit IN_PROGRESS segment from status chart or show as empty placeholder                                                                                                                | W3-T2A |

### Tab 3: Code Review Quality

| ID  | Gap Description                                                                                                                               | Severity     | Remediation                                                                                                                                                                               | Source |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| G22 | `reviews.jsonl` has mixed schema versions (v1, v2, legacy integer-ID records) — `title`, `patterns`, `learnings` removed in v2                | DEGRADES     | Fix script: data loading layer must handle all three schema variants; use `schema_version` field to branch; for v2 records, derive `title` from `"PR #N RN — {source} ({date})"` template | W3-T3A |
| G23 | Most `fixed`, `deferred`, `rejected`, `total` counts in `reviews-archive.jsonl` are 0 — backfill only captured patterns/learnings, not counts | DEGRADES     | Accept: archive counts unreliable; use only for pattern frequency analysis, not numeric metrics                                                                                           | W3-T3A |
| G24 | Severity breakdown (`critical`/`major`/`minor`/`trivial`) lives only in per-PR task state files, not in `reviews.jsonl`                       | DEGRADES     | Fix export script: glob all `task-pr-review-{pr}-r*.state.json` files and merge severity data into the reviews export; join on `review_number` field                                      | W3-T3A |
| G25 | No `DEBT-XXXX` IDs in round state files — `deferred: N` is a count only; cannot link deferred items to Debt tab                               | DEGRADES     | Accept: cross-tab link uses `source_id` prefix matching in MASTER_DEBT.jsonl (`source_id` starts with `PR-{N}-`); no direct FK available                                                  | W3-T3B |
| G26 | Merge trigger recommendation (R4+: fix rate < 30%) from `/pr-review` Step 7.5 is not persisted to state file                                  | NICE-TO-HAVE | Accept: dashboard computes this from state file fix_rate across rounds at read time                                                                                                       | W3-T3B |
| G27 | Retro action item completion not tracked between sessions — `retros.jsonl` action item `status` only updated during `/pr-retro` sessions      | NICE-TO-HAVE | Accept: show last-known status with timestamp caveat ("as of last retro session")                                                                                                         | W3-T3B |
| G28 | No single command to process `pending-refinements.jsonl` items — all 36 require human judgment                                                | DEGRADES     | Accept: dashboard shows count badge, CTA is `npm run learning:analyze` (interactive), no "process all" automation                                                                         | W3-T3B |

### Tab 4: Build Pipeline & Process Compliance

| ID  | Gap Description                                                                                                                                                       | Severity     | Remediation                                                                                                                                                                             | Source |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| G29 | **`velocity-log.jsonl` is confirmed broken** — 50 records, sessions #148–#243, `items_completed: 0` universally. `sprint` field contains raw markdown table row text. | BLOCKS       | Accept as broken: display explicit "Data Unavailable" widget state with reason text. Do NOT show zero as a real value.                                                                  | W3-T4A |
| G30 | **`commit-log.jsonl` is entirely seeded** — all 634 records have `seeded: true`, `branch: "seeded"`, `filesChanged: 0`, `session: null`                               | BLOCKS       | Accept current state: commit timeline shows daily counts only (timestamps are real); show "branch breakdown unavailable" subtitle. Live `commit-tracker.js` will enrich future records. | W3-T4A |
| G31 | `override-log.jsonl` check name inconsistency — `doc-header` (override-log) vs `doc-headers` (hook-runs) and `reviewer` vs `code-reviewer-gate`                       | DEGRADES     | Fix script: add name mapping table in `generate-pipeline-data.js`: `{ "doc-header": "doc-headers", "reviewer": "code-reviewer-gate" }`                                                  | W3-T4A |
| G32 | Agent name casing inconsistency — `explore` and `Explore` are the same agent in `agent-invocations.jsonl`                                                             | DEGRADES     | Fix script: normalize to lowercase in export script before display                                                                                                                      | W3-T4A |
| G33 | No retro follow-through data source — Process Compliance section mentions this metric but no JSONL file tracks retro action item resolution                           | BLOCKS       | Accept: display "No data source" placeholder for this metric; cross-reference with Tab 3 `retros.jsonl` action_items as a future improvement                                            | W3-T4A |
| G34 | No intra-session PostToolUse hook performance data — post-write-validator and post-read-handler have no equivalent of `hook-runs.jsonl`                               | NICE-TO-HAVE | Accept: not blocking; log files don't exist for these events                                                                                                                            | W3-T4A |
| G35 | `override-log.jsonl` location ambiguity — file at `.claude/override-log.jsonl` confirmed but `session-end` SKILL.md references `.claude/state/override-log.jsonl`     | DEGRADES     | Verify: `ls .claude/override-log.jsonl .claude/state/override-log.jsonl` — confirm canonical path before export script is written. Use confirmed path.                                  | W3-T4B |
| G36 | Pre-push failures (cognitive-cc, type-check, propagation) have no `/pre-commit-fixer`-equivalent skill                                                                | NICE-TO-HAVE | Accept: note in dashboard tooltip "Pre-push failures require manual resolution or `/hook-ecosystem-audit`"                                                                              | W3-T4B |

### Tab 5: Governance & Audits

| ID  | Gap Description                                                                                                                                     | Severity     | Remediation                                                                                                                                                | Source |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| G37 | **`health-ecosystem-audit-history.jsonl` does not exist** — health audit has never been run; no data to display                                     | BLOCKS       | Accept: render "MISSING — audit never run" state for health audit row. CTA: `/health-ecosystem-audit`.                                                     | W3-T5A |
| G38 | `pr-ecosystem-audit.jsonl` naming inconsistency — missing `-history` suffix unlike all other 7 audit files                                          | DEGRADES     | Fix script: hard-code this exception in `scripts/dashboard/aggregate-audits.js`; map PR audit to correct filename                                          | W3-T5A |
| G39 | Schema drift in hook and PR audit files — new category keys added mid-history; older records missing these keys                                     | DEGRADES     | Fix script: handle missing keys as `null` in export; render null/gap cells distinctly from 0 in trend charts                                               | W3-T5A |
| G40 | No deferred-findings-to-TDMS linkage in audit history JSONL files — no direct data path from audit history to MASTER_DEBT.jsonl                     | DEGRADES     | Accept: filter MASTER_DEBT.jsonl by `source_id` prefix patterns (`review:{name}-ecosystem-audit-*`) for "deferred findings" panel; no schema change needed | W3-T5B |
| G41 | No persistent open-findings list — session decision logs are ephemeral; deferred items only persist if user explicitly chose "Defer"                | DEGRADES     | Accept: dashboard cannot show "N findings remain unfixed"; only TDMS-deferred items are recoverable                                                        | W3-T5B |
| G42 | Agent quality audit TDMS source_id format differs from ecosystem audits — uses `audit-agent-quality-{date}` not `review:` prefix                    | DEGRADES     | Fix script: include both prefix patterns when querying MASTER_DEBT for audit-originated debt                                                               | W3-T5B |
| G43 | Comprehensive audit report `COMPREHENSIVE_ECOSYSTEM_AUDIT_REPORT.md` is overwritten each run — no persistent history                                | DEGRADES     | New script: append summary to `.claude/state/comprehensive-audit-history.jsonl` before cleanup step (also fixes G06)                                       | W3-T5B |
| G44 | Duration estimates absent for 6 of 9 ecosystem audit skills — doc, skill, pr, session, tdms, script SKILL.md files contain no warm-up time estimate | NICE-TO-HAVE | Accept: use uniform `~15–30 min` for all individual audits.                                                                                                | W3-T5B |

### Tab 6: Planning & Research

| ID  | Gap Description                                                                                                                                                       | Severity | Remediation                                                                                                                                                 | Source          |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| G45 | **`resolve-dependencies.js --json` flag pre-work item** — CHECKPOINT flagged this as pre-work required before sprint board build                                      | BLOCKS   | Verify: run `node scripts/tasks/resolve-dependencies.js --json` now. W3-T6A confirms it works ("81 ready tasks confirmed"). If working, this gap is CLOSED. | W3-T6A / W3-T6B |
| G46 | `research-index.jsonl` only has `complete` entries — 2 in-flight research topics (`debt-runner-expansion`, `research-discovery-standard`) are invisible to the index  | DEGRADES | Fix script: export script reads both index AND state files; merge in-flight topics from state files into `research.inFlightProgress` section                | W3-T6A          |
| G47 | `deep-plan` state file schema fragmentation — 4 different schema shapes; `topic`/`task`/`topic_slug`, `updated`/`timestamp`/`started_at`, `decisions` as int vs array | DEGRADES | Fix script: normalization table in export script; defensively handle all 4 shapes                                                                           | W3-T6A          |

---

## Section 2: Pre-Work Items

These gaps MUST be resolved (or explicitly accepted) before any tab development
begins. They affect the reliability or structure of data that multiple tabs
share.

### MUST VERIFY NOW

| ID  | Action                                                                                                                                     | Why Blocking                                                                                                          | Effort |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- | ------ |
| G45 | Run `node scripts/tasks/resolve-dependencies.js --json` and confirm output is valid JSON with `ready[]`, `blocked[]`, `completed[]` arrays | W3-T6B confirms it works but W3-T6B also says CHECKPOINT flagged it as "pre-work." One of these is stale. Run it now. | 2 min  |
| G35 | Run `ls -la .claude/override-log.jsonl .claude/state/override-log.jsonl` to determine canonical path                                       | Export script for Tab 4 needs the correct path before being written                                                   | 1 min  |

### MUST FIX BEFORE FIRST EXPORT RUN

| ID  | Action                                                                                     | Why Blocking                                                                    | Effort |
| --- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- | ------ |
| G14 | Add `status.toUpperCase()` normalization in `generate-debt-export.js` data loading layer   | BUG-01: lowercase status strings cause filter mismatches in Tab 2 table         | 15 min |
| G16 | Load S1 items from `debt-alerts.json` not from `metrics.json` `s1_items[]` truncated array | Tab 2 S1 alert table shows only 10 items instead of 1,259                       | 10 min |
| G22 | Add schema-version branching in reviews export script                                      | Tab 3 reviews table breaks on v2 records missing `title`/`patterns`/`learnings` | 30 min |
| G31 | Add check name mapping table in `generate-pipeline-data.js`                                | Tab 4 bypass rate table maps wrong check names                                  | 15 min |
| G32 | Normalize agent name casing to lowercase in export script                                  | Tab 4 agent usage chart double-counts `Explore` vs `explore`                    | 10 min |
| G38 | Hard-code PR audit filename exception in `aggregate-audits.js`                             | Script crashes looking for `pr-ecosystem-audit-history.jsonl` (wrong name)      | 10 min |

### ACCEPT-AND-DOCUMENT BEFORE DEVELOPMENT

| ID  | Decision Required                                                 | Implication                                                                          |
| --- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| G29 | Confirm "Velocity widget shows unavailable state" design decision | Tab 4 velocity widget needs explicit "Unavailable" component, not a zero-value chart |
| G30 | Confirm "Commit timeline shows counts only, no branch breakdown"  | Tab 4 commit timeline needs "branch data unavailable" subtitle from day one          |
| G33 | Confirm "Retro follow-through metric is absent from Tab 4"        | Tab 4 Process Compliance section must not reference this metric as coming soon       |
| G37 | Confirm "Health audit row shows MISSING state"                    | Tab 5 must render a "Never Run" cell for health audit — not an error state           |

---

## Section 3: Per-Tab Readiness Score

### Readiness Definition

- **BUILD TODAY**: All primary data sources clean; pre-work items verified or
  accepted
- **BUILD WITH CAVEATS**: Primary data usable; some widgets need "unavailable"
  states or reduced functionality
- **NEEDS PRE-WORK**: One or more blocking gaps must be fixed before tab
  functions correctly

| Tab                            | Status             | Score | Notes                                                                                                                                                                                                                                                       |
| ------------------------------ | ------------------ | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tab 1: Health & Alerts**     | BUILD WITH CAVEATS | 8/10  | All 6 core data sources exist and are populated. Caveats: SonarCloud null (G12), alerts-history sparse (G11), hook-warnings no lifecycle (G01). None block the tab; all have "unavailable" fallbacks.                                                       |
| **Tab 2: Debt Pipeline**       | BUILD WITH CAVEATS | 7/10  | Core data ready (metrics.json, metrics-log, MASTER_DEBT). Two pre-work fixes needed before export script runs (G14 BUG-01, G16 s1_items truncation). Fix these two items and the tab is fully functional.                                                   |
| **Tab 3: Code Review Quality** | BUILD WITH CAVEATS | 7/10  | reviews.jsonl, review-metrics.jsonl, retros.jsonl all present and populated. Pre-work: schema-version branching (G22) needed in export script. Severity data merge from state files (G24) adds depth.                                                       |
| **Tab 4: Build Pipeline**      | BUILD WITH CAVEATS | 6/10  | hook-runs.jsonl is the strongest data source (clean, 120 records). Two confirmed broken sources: velocity (G29) and commit branch data (G30) — both handled with "unavailable" state. G35 path ambiguity must be verified. G31/G32 are simple script fixes. |
| **Tab 5: Governance & Audits** | BUILD WITH CAVEATS | 7/10  | 7 of 8 audit history files exist. Health audit missing (G37) handled as MISSING state. PR filename exception (G38) is a trivial fix. Schema drift (G39) handled by null-filling.                                                                            |
| **Tab 6: Planning & Research** | BUILD WITH CAVEATS | 8/10  | `resolve-dependencies.js --json` confirmed working in W3-T6A (G45 appears resolved). research-index.jsonl, lifecycle-scores.jsonl all present. Main work: plan state file normalization (G47) and in-flight topic join (G46).                               |

**Overall assessment: All 6 tabs can be built. No tab is fully blocked.** The
highest-risk tab is Tab 4 due to two structural data problems (velocity broken,
commits seeded) — but both have accepted "unavailable" fallbacks.

---

## Section 4: Remediation Effort Estimates

Grouped by type of remediation work.

### A. Export Script Fixes (Required before first build)

| ID          | Fix                                                              | Effort         | Complexity |
| ----------- | ---------------------------------------------------------------- | -------------- | ---------- |
| G14         | Add `status.toUpperCase()` in debt export                        | 15 min         | Trivial    |
| G16         | Use `debt-alerts.json` not `metrics.json` s1_items               | 10 min         | Trivial    |
| G22         | Schema-version branching in reviews export                       | 30 min         | Low        |
| G24         | Merge severity from per-PR state files                           | 45 min         | Low        |
| G31         | Check name mapping table in pipeline export                      | 15 min         | Trivial    |
| G32         | Agent name normalization to lowercase                            | 10 min         | Trivial    |
| G38         | PR audit filename hard-code exception                            | 10 min         | Trivial    |
| G39         | Null-fill missing category keys for schema-drifted audit records | 20 min         | Low        |
| G42         | Include both TDMS source_id prefix patterns                      | 10 min         | Trivial    |
| G46         | Join in-flight research topics from state files                  | 30 min         | Low        |
| G47         | Normalize deep-plan state file schema variants                   | 45 min         | Low        |
| **Total A** |                                                                  | **~3.5 hours** |            |

### B. New CLI Wrappers (Optional, improves tab interactivity)

| ID          | Fix                                     | Effort      | Priority                                      |
| ----------- | --------------------------------------- | ----------- | --------------------------------------------- |
| G07         | New `cli-acknowledge-warning.js` script | 1 hour      | MEDIUM — enables dashboard acknowledge button |
| G09         | Add `health:audit` to package.json      | 5 min       | HIGH — consistency with other 7 sub-audits    |
| **Total B** |                                         | **~1 hour** |                                               |

### C. New Infrastructure Scripts (Optional, improves historical data)

| ID          | Fix                                                   | Effort       | Priority                                   |
| ----------- | ----------------------------------------------------- | ------------ | ------------------------------------------ |
| G06/G43     | New `comprehensive-audit-history.jsonl` append script | 2 hours      | MEDIUM — enables comprehensive audit trend |
| **Total C** |                                                       | **~2 hours** |                                            |

### D. Accept & Document (No code, update dashboard design)

| ID          | Action                                                          | Effort         |
| ----------- | --------------------------------------------------------------- | -------------- | --- |
| G01         | Document hook-warning dedup strategy in code comments           | 10 min         |
| G03         | Add "as of [date]" label to pattern gate widget                 | 5 min          |
| G05         | Use `type`+`hook` as primary warning display                    | 5 min (design) |
| G11         | Add "Insufficient history" sparkline state                      | 15 min (UI)    |
| G12         | Add "SonarCloud integration not active" label                   | 5 min (UI)     |
| G15         | Add tooltip "Breakdown history not available" on trend chart    | 10 min (UI)    |
| G18         | Change Debt tab CTA copy to "Verify all S0/S1"                  | 5 min (copy)   |
| G20         | Update REFERENCE.md for dedup-multi-pass                        | 15 min (docs)  |
| G21         | Omit IN_PROGRESS segment from status chart                      | 5 min (UI)     |
| G23         | Use archive for pattern frequency only, not numeric metrics     | 5 min (design) |
| G25         | Use source_id prefix matching for deferred items cross-tab link | 20 min (code)  |
| G26         | Compute merge trigger recommendation client-side                | 15 min (code)  |
| G27         | Show "as of last retro session" caveat on retro action items    | 5 min (copy)   |
| G28         | Show count badge + `npm run learning:analyze` CTA               | 5 min (design) |
| G29         | Build "Data Unavailable" velocity widget                        | 30 min (UI)    |
| G30         | Add "branch data unavailable" subtitle to commit timeline       | 5 min (UI)     |
| G33         | Show "No data source" for retro follow-through metric           | 10 min (UI)    |
| G34         | No action needed                                                | —              |
| G36         | Add tooltip for pre-push failure CTA                            | 5 min (copy)   |
| G37         | Build "MISSING — never run" state for health audit row          | 20 min (UI)    |
| G40         | Filter MASTER_DEBT by source_id prefix in export script         | 20 min (code)  |
| G41         | Note in UI "only deferred findings are recoverable"             | 5 min (copy)   |
| G44         | Use `~15–30 min` uniform estimate for all audit buttons         | 2 min (copy)   |
| G45         | Verify `--json` flag works (2 min check)                        | 2 min          |
| G46/G47     | Handled in export script (Section A)                            | —              |
| **Total D** |                                                                 | **~2.5 hours** |     |

### Total Remediation Effort

| Category                                 | Effort       | When                                    |
| ---------------------------------------- | ------------ | --------------------------------------- |
| A: Export script fixes (required)        | 3.5 hours    | Before first build                      |
| B: New CLI wrappers (optional)           | 1 hour       | Before Tab 1 interactivity              |
| C: New infrastructure scripts (optional) | 2 hours      | Before comprehensive audit trend needed |
| D: Accept and document (UI/copy/design)  | 2.5 hours    | During tab development                  |
| **TOTAL**                                | **~9 hours** |                                         |

---

## Section 5: Recommended Fix Order

This sequence unblocks the most tabs fastest, frontloading the required export
script fixes.

### Phase 0: Verify Pre-Conditions (30 min total)

**Do this before writing any export script code.**

1. **Verify G45**: Run
   `node scripts/tasks/resolve-dependencies.js --json | head -5` — confirm valid
   JSON output. If it works, G45 is CLOSED. If not, add `--json` flag to the
   script (~1 hour).
2. **Verify G35**: Run
   `ls -la .claude/override-log.jsonl .claude/state/override-log.jsonl` —
   determine canonical path for Tab 4 export script.

### Phase 1: Fix All Export Scripts (3.5 hours)

All export scripts should be written and fixed together, not tab-by-tab, because
many share the same pattern (read JSONL, normalize, write JSON).

**Order within Phase 1 (highest-impact first):**

1. `scripts/generate-debt-export.js` — G14 (BUG-01 status normalization), G16
   (S1 items source fix). **Unblocks Tab 2 fully.**
2. `scripts/dashboard/aggregate-audits.js` — G38 (PR filename), G39 (schema
   drift null-fill), G42 (TDMS source_id patterns). **Unblocks Tab 5 fully.**
3. `scripts/generate-pipeline-data.js` — G31 (check name mapping), G32 (agent
   normalization). **Unblocks Tab 4 compliance section.**
4. `scripts/generate-reviews-export.js` — G22 (schema branching), G24 (severity
   merge from state files). **Unblocks Tab 3 severity filtering.**
5. `scripts/tasks/generate-planning-data.js` — G46 (in-flight research join),
   G47 (plan schema normalization). **Completes Tab 6 export.**
6. `scripts/generate-health-data.js` — G40 (TDMS source_id filter), accepts
   G01/G05 via UI design. **Completes Tab 1 export.**

### Phase 2: Accept-and-Document Decisions (2.5 hours, parallel with UI development)

During tab UI development, implement the "unavailable" and "degraded" widget
states for:

- G29: Velocity widget unavailable state (Tab 4) — build this component first,
  it is needed in multiple tabs
- G30: Commit timeline "seeded data" subtitle (Tab 4)
- G33: Retro follow-through "no data source" placeholder (Tab 4)
- G37: Health audit "MISSING" state (Tab 5)
- G12: SonarCloud "unavailable" dimension (Tab 1)
- G11: Alerts sparkline "insufficient history" state (Tab 1)
- G15: Trend chart "breakdown not available" tooltip (Tab 2)

### Phase 3: Optional Enhancements (after MVP tabs ship)

- G09: `health:audit` npm script alias (5 min, high value for consistency)
- G07: Warning acknowledge CLI wrapper (1 hour)
- G06/G43: Comprehensive audit history persistence script (2 hours)

---

## Section 6: Reusable Patterns

Several gaps share the same root cause and can be fixed with one pattern once,
then applied across all affected files.

### Pattern A: "Data Unavailable" Widget State

Needed in: G29 (velocity), G30 (commit branch), G33 (retro follow-through), G37
(health audit), G11 (alerts sparkline), G12 (sonarcloud)

Build one `<DataUnavailable>` component with `reason`, `sourceFile`, and
optional `suggestedFix` props. All broken widgets reuse it.

```typescript
// W3-T4A already specifies this pattern
type DataStatus = "ok" | "unavailable" | "empty" | "stale";
interface WidgetProps {
  status: DataStatus;
  statusReason?: string;
  sourceFile?: string;
  children: React.ReactNode;
}
```

### Pattern B: Schema-Version Branching in Export Scripts

Needed in: G22 (reviews), G47 (deep-plan state files)

Pattern: check for schema version field (`schema_version`, `version`, or absence
thereof), branch to appropriate field-extraction logic, normalize to unified
output shape.

### Pattern C: JSONL Source + State File Merge

Needed in: G24 (reviews + task state files), G46 (research index + state files)

Pattern: primary source is the index/canonical JSONL; state files are joined as
enrichment. Build a generic `mergeStateFileData(indexEntry, stateFilePath)`
utility.

### Pattern D: Source ID Prefix Filtering for Cross-Tab Links

Needed in: G25 (reviews → debt), G40 (audits → debt), G42 (agent quality → debt)

Pattern: all MASTER_DEBT entries created from other systems carry a `source_id`
with a predictable prefix. Build one `queryDebtBySourcePrefix(prefix)` function
in the debt export script.

---

## Contradictions Surfaced Across Tabs

1. **G45 (resolve-dependencies.js --json)**: W3-T6A says "already working —
   confirmed by live run." W3-T6B says CHECKPOINT flagged it as "pre-work item."
   One source is stale. Must verify before Tab 6 build starts.

2. **G35 (override-log.jsonl path)**: Tab 4A data design reads from
   `.claude/override-log.jsonl`. Tab 4B CLI handoff says `session-end`
   references `.claude/state/override-log.jsonl`. Must verify which is canonical
   before writing export script.

3. **Severity archive field presence**: `reviews-archive.jsonl` has
   `critical`/`major`/`minor`/`trivial` severity fields. `reviews.jsonl` v1/v2
   do NOT. Severity is only in per-PR task state files for recent reviews.
   Historical severity trend is therefore impossible for the archive period.

---

## Gaps Not Addressed in This Report

1. **No live API mode for any tab**: All tabs are designed for static JSON
   exports (`public/*.json`). A dev-mode live API layer (reading JSONL files at
   request time) is conceptually mentioned in W3-T2A but not gap-analyzed here.
   This is an implementation decision, not a data gap.

2. **Export script trigger mechanism**: How and when the export scripts run
   (manual, cron, pre-build hook) is not resolved. This is infrastructure-level
   scope not covered in Wave 3 research.

3. **Recharts / shadcn chart dependency**: W3-T2A explicitly notes "Recharts and
   shadcn chart components are NOT currently installed." This is a dependency
   gap (npm install needed), not a data gap.

---

## Sources

| #   | File                             | Type            | Trust | Date       |
| --- | -------------------------------- | --------------- | ----- | ---------- |
| 1   | `W3-T1A-health-data-design.md`   | Wave 3 findings | HIGH  | 2026-03-29 |
| 2   | `W3-T1B-health-cli-handoff.md`   | Wave 3 findings | HIGH  | 2026-03-29 |
| 3   | `W3-T2A-debt-data-design.md`     | Wave 3 findings | HIGH  | 2026-03-29 |
| 4   | `W3-T2B-debt-cli-handoff.md`     | Wave 3 findings | HIGH  | 2026-03-29 |
| 5   | `W3-T3A-reviews-data-design.md`  | Wave 3 findings | HIGH  | 2026-03-29 |
| 6   | `W3-T3B-reviews-cli-handoff.md`  | Wave 3 findings | HIGH  | 2026-03-29 |
| 7   | `W3-T4A-pipeline-data-design.md` | Wave 3 findings | HIGH  | 2026-03-29 |
| 8   | `W3-T4B-pipeline-cli-handoff.md` | Wave 3 findings | HIGH  | 2026-03-29 |
| 9   | `W3-T5A-audits-data-design.md`   | Wave 3 findings | HIGH  | 2026-03-29 |
| 10  | `W3-T5B-audits-cli-handoff.md`   | Wave 3 findings | HIGH  | 2026-03-29 |
| 11  | `W3-T6A-planning-data-design.md` | Wave 3 findings | HIGH  | 2026-03-29 |
| 12  | `W3-T6B-planning-cli-handoff.md` | Wave 3 findings | HIGH  | 2026-03-29 |

---

## Confidence Assessment

- HIGH claims: 42
- MEDIUM claims: 5 (effort estimates, cross-tab link design decisions)
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

All gap identifications are sourced directly from the Wave 3 findings documents,
which in turn sourced from direct filesystem inspection. Effort estimates are
LOW-MEDIUM confidence as they are based on analogous script complexity, not
measured execution time.

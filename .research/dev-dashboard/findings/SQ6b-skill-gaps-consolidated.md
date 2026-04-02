# Findings: Consolidated CLI/Skill Gap Analysis — All 6 Dashboard Tabs

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-29
**Sub-Question IDs:** SQ-6b (CLI/Skill Gap Consolidation) **Sources:** W3-T1B
through W3-T6B CLI handoff findings

---

## 1. Master CLI Gap Table

Every missing command from all 6 handoff findings, sorted by tab then by impact.

| ID       | Tab               | Action                                                                        | Current Workaround                                                                                        | Gap Type                                                              | Effort |
| -------- | ----------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------ |
| GAP-H1   | Tab 1: Health     | Acknowledge a specific warning by ID                                          | `warning-lifecycle.js` has API but no CLI wrapper                                                         | Missing thin wrapper script                                           | XS     |
| GAP-H2   | Tab 1: Health     | Suppress/resolve a specific alert                                             | `/alerts` interactive loop only — no direct single-alert suppress                                         | Missing thin wrapper script                                           | XS     |
| GAP-H3   | Tab 1: Health     | Run mid-session alert check on demand                                         | `mid-session-alerts.js` only fires post-commit                                                            | Missing npm script alias                                              | XS     |
| GAP-H4   | Tab 1: Health     | View/reset alerts cooldown                                                    | `.alerts-cooldown.json` is written but no CLI to read/reset it                                            | Missing thin wrapper script                                           | XS     |
| GAP-H5   | Tab 1: Health     | `npm run health:audit`                                                        | Direct node path only: `node .claude/skills/health-ecosystem-audit/scripts/run-health-ecosystem-audit.js` | Missing npm alias — inconsistency with all 7 other sub-audits         | XS     |
| GAP-H6   | Tab 1: Health     | Export/archive comprehensive audit report to history                          | `COMPREHENSIVE_ECOSYSTEM_AUDIT_REPORT.md` is overwritten each run, no `comprehensive-audit-history.jsonl` | Missing script + persistent JSONL                                     | S      |
| GAP-D1   | Tab 2: Debt       | Verify a single DEBT-XXXXX item                                               | `/debt-runner verify` operates on severity slices, not single IDs                                         | Architecture gap — skill does not support per-item targeting          | M      |
| GAP-D2   | Tab 2: Debt       | Filter debt items by category                                                 | Manual `jq` on MASTER_DEBT.jsonl                                                                          | Missing `--category` flag on `/debt-runner` modes                     | S      |
| GAP-D3   | Tab 2: Debt       | Filter debt items by file path                                                | Manual grep on MASTER_DEBT.jsonl                                                                          | Missing `--file` flag on `/debt-runner` modes                         | S      |
| GAP-D4   | Tab 2: Debt       | Silent single-shot `/add-debt` (no interactive prompts)                       | Use `intake-manual.js` directly                                                                           | Missing `--silent` mode on skill                                      | S      |
| GAP-D5   | Tab 2: Debt       | JSON-to-stdout output from `generate-metrics.js`                              | Read `metrics.json` file directly                                                                         | Missing `--json` flag                                                 | XS     |
| GAP-D6   | Tab 2: Debt       | Filter verification queue by severity                                         | Full batch only via `process-review-needed.js`                                                            | Missing `--severity` flag                                             | S      |
| GAP-D7   | Tab 2: Debt       | Query a DEBT item by ID from CLI                                              | Manual grep on MASTER_DEBT.jsonl                                                                          | Missing query-by-ID script                                            | S      |
| GAP-D8   | Tab 2: Debt       | Export debt snapshot as CSV                                                   | None                                                                                                      | Missing export script entirely                                        | M      |
| GAP-D9   | Tab 2: Debt       | Bulk-assign roadmap track to selected items                                   | Manual MASTER_DEBT edit                                                                                   | Missing per-item or batch-by-ID assignment                            | M      |
| GAP-R1   | Tab 3: Reviews    | View a specific learning entry by review number                               | Read `AI_REVIEW_LEARNINGS_LOG.md` directly                                                                | Missing script/CLI                                                    | S      |
| GAP-R2   | Tab 3: Reviews    | Filter reviews.jsonl by PR/source/date                                        | JSON query only                                                                                           | Missing filtered-view script                                          | S      |
| GAP-R3   | Tab 3: Reviews    | Dismiss a single pending-refinements.jsonl item                               | Manual JSONL edit                                                                                         | Missing per-item dismiss command                                      | XS     |
| GAP-R4   | Tab 3: Reviews    | Mark a retro finding as "already verified"                                    | Re-run `/pr-retro --resume` interactively                                                                 | No direct mark command                                                | S      |
| GAP-R5   | Tab 3: Reviews    | Batch-dismiss recurring review items cross-PR                                 | Partial: only from within an active retro session                                                         | No standalone batch-suppress command                                  | M      |
| GAP-R6   | Tab 3: Reviews    | Export PR history data as CSV or JSON                                         | None                                                                                                      | Missing export script                                                 | S      |
| GAP-P4-1 | Tab 4: Pipeline   | Resolve chronic cognitive-cc bypass                                           | Manual: raise `SKIP_COG_CC` env var, or refactor code                                                     | No `/raise-cc-baseline` or equivalent                                 | M      |
| GAP-P4-2 | Tab 4: Pipeline   | Override log review/triage                                                    | `node scripts/log-override.js --list` (script only)                                                       | Missing skill wrapper `/review-overrides`                             | S      |
| GAP-P4-3 | Tab 4: Pipeline   | Proactive agent compliance check before commit                                | Only fires at commit time via pre-commit hook                                                             | No `/check-agent-compliance` standalone command                       | S      |
| GAP-P4-4 | Tab 4: Pipeline   | Retroactive hook-runs analysis (interactive)                                  | `npm run hooks:analytics` script only                                                                     | No `/hook-analytics` skill                                            | M      |
| GAP-P4-5 | Tab 4: Pipeline   | Audit all prior SKIP_REASONs for quality                                      | None                                                                                                      | No `/audit-skip-reasons` skill                                        | S      |
| GAP-P4-6 | Tab 4: Pipeline   | Repair broken `velocity-log.jsonl`                                            | None — data shown as "unavailable"                                                                        | No repair CLI documented                                              | M      |
| GAP-P4-7 | Tab 4: Pipeline   | Fix pre-push check failures (cognitive-cc, type-check, propagation, security) | Manual or `/systematic-debugging`                                                                         | `pre-commit-fixer` scope ends at pre-commit — no pre-push fixer skill | L      |
| GAP-G1   | Tab 5: Governance | View/display last saved audit report                                          | Dashboard reads history JSONL directly                                                                    | No `/show-last-audit-report` command                                  | S      |
| GAP-G2   | Tab 5: Governance | Schedule or nudge recurring audits                                            | Manual — "Last Run" staleness warning only                                                                | No scheduling CLI                                                     | L      |
| GAP-G3   | Tab 5: Governance | Clear stale audit progress files                                              | Manual `rm .claude/tmp/*-audit-progress.json`                                                             | No `/clear-audit-progress` command                                    | XS     |
| GAP-G4   | Tab 5: Governance | Dismiss/acknowledge a stale audit warning                                     | None                                                                                                      | New command or state file entry needed                                | S      |
| GAP-G5   | Tab 5: Governance | View all deferred findings across all 8 audits                                | `grep '"source_id": "review:'` on MASTER_DEBT.jsonl                                                       | No unified audit-findings view command                                | S      |
| GAP-G6   | Tab 5: Governance | Force non-interactive (batch) audit run for one sub-audit                     | Direct node with `--batch --summary` flags (internal-only)                                                | Not exposed as a user-facing skill invocation                         | S      |
| GAP-G7   | Tab 5: Governance | Compare two audit runs (diff)                                                 | Manual: read two history JSONL entries side-by-side                                                       | No audit diff/compare command                                         | L      |
| GAP-PL1  | Tab 6: Planning   | Mark ROADMAP task as done (`[ ]` → `[x]`)                                     | Interactive Claude instruction only                                                                       | No `scripts/tasks/mark-done.js` exists                                | S      |
| GAP-PL2  | Tab 6: Planning   | Add dependency annotation to ROADMAP task                                     | Manual ROADMAP.md edit                                                                                    | No dependency annotation script                                       | S      |
| GAP-PL3  | Tab 6: Planning   | Start working on a specific task by ID                                        | `/task-next` reads only, does not write                                                                   | No `/task-start [ID]` command                                         | M      |
| GAP-PL4  | Tab 6: Planning   | JSON output from `resolve-dependencies.js`                                    | Parse text output or re-implement DAG client-side                                                         | Missing `--json` flag — CHECKPOINT calls this a pre-work item         | S      |
| GAP-PL5  | Tab 6: Planning   | Archive a completed plan (state file cleanup)                                 | Manual `rm .claude/state/deep-plan.<slug>.state.json`                                                     | No `/deep-plan --archive [slug]`                                      | XS     |
| GAP-PL6  | Tab 6: Planning   | Export DECISIONS.md entries to TDMS                                           | None — documented gap (Planning Data lifecycle score action:1)                                            | No script bridges planning decisions to TDMS intake                   | M      |
| GAP-PL7  | Tab 6: Planning   | Regenerate lifecycle scores without running full audit                        | `node scripts/generate-lifecycle-scores-md.js` (exists)                                                   | Already a script — needs npm alias for discoverability                | XS     |

**Effort key:** XS = <1 hour, S = 1–4 hours, M = 0.5–1 day, L = 1–2 days

---

## 2. New Scripts Needed

Scripts that do not exist and need to be created. These are ground-truth gaps
where no script file or equivalent was found in the codebase.

| Script                                                         | Purpose                                                                                | Tab   | Effort                                                                               | Priority |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------ | -------- | --- | --- |
| `scripts/health/ack-warning.js --id=X --reason="..."`          | CLI wrapper around `warning-lifecycle.js` `updateWarningStatus()`                      | Tab 1 | XS                                                                                   | P1       |
| `scripts/health/suppress-alert.js --id=X`                      | Write entry to `alert-suppressions.json` without interactive `/alerts` loop            | Tab 1 | XS                                                                                   | P1       |
| `scripts/health/run-mid-session-alerts.js`                     | Thin wrapper to invoke `mid-session-alerts.js` on demand                               | Tab 1 | XS                                                                                   | P2       |
| `scripts/health/reset-alerts-cooldown.js`                      | Read or clear `.alerts-cooldown.json`                                                  | Tab 1 | XS                                                                                   | P3       |
| `scripts/health/archive-audit-report.js`                       | Copy `COMPREHENSIVE_ECOSYSTEM_AUDIT_REPORT.md` to history JSONL before next run        | Tab 1 | S                                                                                    | P2       |
| `scripts/debt/query-item.js DEBT-XXXXX`                        | Fetch and display a single debt item from MASTER_DEBT.jsonl by ID                      | Tab 2 | XS                                                                                   | P1       |
| `scripts/debt/export-csv.js [--severity S0,S1] [--category X]` | Export MASTER_DEBT as CSV                                                              | Tab 2 | S                                                                                    | P3       |
| `scripts/tasks/mark-done.js [taskId]`                          | Edit ROADMAP.md to check off a task checkbox by ID                                     | Tab 6 | S                                                                                    | P1       |
| `scripts/tasks/task-start.js [taskId]`                         | Mark a ROADMAP task as in-progress (if status field exists), or noop with confirmation | Tab 6 | M                                                                                    | P2       |
| `scripts/plans/archive-plan.js [slug]`                         | Delete `.claude/state/deep-plan.<slug>.state.json` with confirmation prompt            | Tab 6 | XS                                                                                   | P3       |
| `scripts/plans/export-decisions.js [slug]`                     | Parse `.planning/<slug>/DECISIONS.md` and create TDMS entries via `intake-manual.js`   | Tab 6 | M                                                                                    | P2       |
| `scripts/audits/list-deferred.js [--audit=hook                 | doc                                                                                    | ...]` | Filter MASTER_DEBT.jsonl by `source_id` prefix patterns and display grouped findings | Tab 5    | S   | P2  |
| `scripts/audits/clear-progress.js [--audit=X]`                 | Delete `.claude/tmp/*-audit-progress.json` for one or all audits                       | Tab 5 | XS                                                                                   | P3       |

---

## 3. Existing Script Enhancements

Scripts that exist but need new flags added to support dashboard clipboard
actions.

| Script                                                   | Current State                                         | Enhancement Needed                                                                                              | Tab   | Effort      | Priority                                                   |
| -------------------------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ----- | ----------- | ---------------------------------------------------------- |
| `scripts/tasks/resolve-dependencies.js`                  | Text output only                                      | Add `--json` flag for machine-parseable output (sprint board rendering)                                         | Tab 6 | S           | **P0** — dashboard cannot render sprint board without this |
| `scripts/debt/generate-metrics.js`                       | Writes to `metrics.json` only                         | Add `--json` (stdout) and `--quiet` flags for dashboard-driven refresh                                          | Tab 2 | XS          | P2                                                         |
| `scripts/debt/process-review-needed.js`                  | Processes entire queue only                           | Add `--severity S0,S1` filter to target subset of verification queue                                            | Tab 2 | S           | P2                                                         |
| `scripts/debt/sync-deduped.js`                           | Has `--json` flag (confirmed)                         | Already has `--json` — no enhancement needed; just document for dashboard use                                   | Tab 2 | —           | —                                                          |
| `scripts/log-override.js`                                | Has `--list` flag                                     | Add `--json` output for dashboard override trend rendering                                                      | Tab 4 | XS          | P2                                                         |
| `scripts/health/run-health-check.js`                     | Has `--json` and `--dimension` flags                  | Already sufficient — no enhancement needed                                                                      | Tab 1 | —           | —                                                          |
| `node .claude/skills/*/scripts/run-*-ecosystem-audit.js` | `--batch --summary` flags exist but are internal-only | Expose as documented user-facing flags; add `--json-summary` for dashboard display without full interactive run | Tab 5 | S per audit | P3                                                         |

---

## 4. New npm Script Aliases Needed

Aliases for existing scripts that lack discoverability (no `npm run` entry
despite the script existing).

| npm Alias                    | Maps To                                                                            | Purpose                                                                      | Tab   | Priority |
| ---------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ----- | -------- |
| `npm run health:audit`       | `node .claude/skills/health-ecosystem-audit/scripts/run-health-ecosystem-audit.js` | Fix inconsistency — all 7 other sub-audits have npm aliases, health does not | Tab 1 | P1       |
| `npm run alerts:mid-session` | `node scripts/health/run-mid-session-alerts.js` (new script)                       | "Run alert check now" button                                                 | Tab 1 | P2       |
| `npm run lifecycle:refresh`  | `node scripts/generate-lifecycle-scores-md.js`                                     | Discoverability for lifecycle score refresh                                  | Tab 6 | P3       |
| `npm run tasks:ready`        | `node scripts/tasks/resolve-dependencies.js`                                       | Sprint board refresh                                                         | Tab 6 | P2       |
| `npm run tasks:ready-json`   | `node scripts/tasks/resolve-dependencies.js --json` (after enhancement)            | Machine-parseable sprint board                                               | Tab 6 | P0       |
| `npm run overrides:list`     | `node scripts/log-override.js --list`                                              | Override history review                                                      | Tab 4 | P2       |

---

## 5. New Skill Candidates

Actions that warrant a full `/skill-name` wrapper (interactive, multi-step, or
complex enough that a raw script is insufficient).

| Skill                 | Purpose                                                                                                          | Rationale                                                                                                                                                                             | Tab(s)        | Effort |
| --------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------ |
| `/pre-push-fixer`     | Diagnose and fix pre-push hook failures (cognitive-cc, type-check, propagation, security, circular-deps)         | `pre-commit-fixer` is explicitly scoped to pre-commit only. Pre-push failures are the most common blocker after cognitive-cc. Needs the same classify → subagent → fix → report loop. | Tab 4         | L      |
| `/review-overrides`   | Interactive review of `.claude/override-log.jsonl` — shows patterns, recommends whether to fix or raise baseline | Currently no interactive path. `/session-end` Step 5 surfaces overrides if they happened this session, but there's no on-demand history-wide triage. High hygiene value.              | Tab 4         | M      |
| `/task-start [ID]`    | Mark a ROADMAP task as the active focus — set intent, check prerequisites, open relevant files                   | Bridges the gap between "ready tasks list" and actually beginning work. A pure script can check off boxes but cannot set context or validate prerequisites.                           | Tab 6         | M      |
| `/audit-skip-reasons` | Review all SKIP_REASON entries in override-log.jsonl for quality, spot autonomous or weak justifications         | CLAUDE.md guardrail #14 prohibits autonomous SKIP_REASON. No existing command audits whether past entries were compliant. Important governance action.                                | Tab 4 / Tab 5 | M      |

---

## 6. Priority Ranking — Dashboard UX Impact

This ranking answers: "The dashboard shows the data, but the user can't act on
it — which gaps hurt most?"

### P0 — Blocking: Dashboard Cannot Render Without These

| Gap ID  | Issue                                          | Why Blocking                                                                                                                                                |
| ------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GAP-PL4 | `resolve-dependencies.js` has no `--json` flag | Sprint board in Tab 6 cannot display structured task data. Text parsing is fragile and loses dependency graph. CHECKPOINT already flagged this as pre-work. |

### P1 — Critical: User Sees Data, Has No Action Button

These are the gaps where the dashboard shows a row, card, or count, but the
clipboard CTA cannot be wired to a real command.

| Gap ID  | Tab   | Why Critical                                                                                                                                           |
| ------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| GAP-H1  | Tab 1 | Warning cards with "Acknowledge" button → no CLI. Most health tab CTAs are read-only without this.                                                     |
| GAP-H2  | Tab 1 | Alert suppress button → no CLI. User must use interactive `/alerts` loop for every suppress action.                                                    |
| GAP-H5  | Tab 1 | "Run health audit" row is inconsistent — all 8 sub-audits except health have npm aliases. Dashboard cannot offer uniform "Run" buttons across the row. |
| GAP-D1  | Tab 2 | Debt item row "Verify this item" → no per-item verify. Most actionable debt button is faked.                                                           |
| GAP-D7  | Tab 2 | Debt item selected in UI → no "fetch item details" CLI. Dashboard cannot load item details on demand.                                                  |
| GAP-PL1 | Tab 6 | ROADMAP task "Mark done" → no script. Primary sprint board action is read-only.                                                                        |

### P2 — High: Workflow Gaps That Force Context Switches

| Gap ID         | Tab   | Impact                                                                                                         |
| -------------- | ----- | -------------------------------------------------------------------------------------------------------------- |
| GAP-H3         | Tab 1 | "Run alert check now" — user must wait for next commit to trigger mid-session check.                           |
| GAP-H6         | Tab 1 | No audit history trend — the most valuable health KPI (composite score over time) has no sparkline.            |
| GAP-D2, GAP-D3 | Tab 2 | No category/file filter on debt — user cannot see debt items for a specific file or category without jq.       |
| GAP-R3         | Tab 3 | Dismissing a pending-refinement item requires manual JSONL edit. Count badge can't be cleared.                 |
| GAP-P4-2       | Tab 4 | Override log has no interactive viewer — hygiene review requires knowing the direct script path.               |
| GAP-P4-3       | Tab 4 | Agent compliance check only fires at commit time — user cannot confirm compliance before building up a commit. |
| GAP-G5         | Tab 5 | No unified "all deferred findings" view — user cannot see open audit debt across all 8 audits in one place.    |
| GAP-PL6        | Tab 6 | Planning decisions don't flow to TDMS — the lifecycle score `action:1` gap is unresolved.                      |

### P3 — Medium: Quality of Life Improvements

| Gap ID         | Tab   | Impact                                                                                           |
| -------------- | ----- | ------------------------------------------------------------------------------------------------ |
| GAP-H4         | Tab 1 | Cooldown reset — minor friction but annoying when doing rapid health checks.                     |
| GAP-D5         | Tab 2 | JSON-to-stdout for metrics — currently read from file which is acceptable but slower to refresh. |
| GAP-D8         | Tab 2 | CSV export — useful for reporting but not core workflow.                                         |
| GAP-R1, GAP-R2 | Tab 3 | Filtered views of review history — usable via JSON files directly.                               |
| GAP-R6         | Tab 3 | Export PR history — useful but not blocking.                                                     |
| GAP-P4-5       | Tab 4 | SKIP_REASON audit — important governance but not urgent daily action.                            |
| GAP-P4-7       | Tab 4 | Pre-push fixer — highest effort item; significant workflow value for the cognitive-cc problem.   |
| GAP-G1         | Tab 5 | View last audit report — readable from filesystem directly.                                      |
| GAP-G3, GAP-G4 | Tab 5 | Progress cleanup / stale warning dismiss — housekeeping.                                         |
| GAP-G7         | Tab 5 | Audit run comparison — advanced feature; high effort.                                            |
| GAP-PL2        | Tab 6 | Dependency annotation — power user feature; ROADMAP.md is editable directly.                     |
| GAP-PL5        | Tab 6 | Plan archival — XS effort, low urgency.                                                          |

---

## 7. Clipboard Command Completeness — Per Tab

For each tab, what percentage of the user-visible dashboard actions have a
working clipboard command today (before any new scripts are built).

| Tab                                        | Total Dashboard Actions | Working Clipboard Commands | Gaps Blocking Actions                          | Completeness |
| ------------------------------------------ | ----------------------- | -------------------------- | ---------------------------------------------- | ------------ |
| Tab 1: Health & Alerts                     | ~14                     | ~10                        | GAP-H1, GAP-H2, GAP-H3, GAP-H5                 | ~71%         |
| Tab 2: Debt Pipeline                       | ~12                     | ~6                         | GAP-D1, GAP-D2, GAP-D3, GAP-D5, GAP-D7, GAP-D9 | ~50%         |
| Tab 3: Code Review Quality                 | ~10                     | ~7                         | GAP-R3, GAP-R4, GAP-R6                         | ~70%         |
| Tab 4: Build Pipeline & Process Compliance | ~11                     | ~7                         | GAP-P4-2, GAP-P4-3, GAP-P4-7                   | ~64%         |
| Tab 5: Governance & Audits                 | ~10                     | ~9                         | GAP-G4, GAP-G5                                 | ~80%         |
| Tab 6: Planning & Research                 | ~12                     | ~6                         | GAP-PL1, GAP-PL3, GAP-PL4, GAP-PL5, GAP-PL6    | ~50%         |

**Notes on completeness scoring:**

- Tab 5 is highest because the governance actions (run audit, run comprehensive)
  are fully wired. The main gap is deferred findings aggregation view.
- Tab 2 and Tab 6 are lowest because their most common actions (verify item,
  mark task done, json output for sprint board) are all missing.
- Tab 1 scores well on read/run actions but falls short on the write-side
  (acknowledge/suppress).
- Overall weighted average: ~64% of dashboard actions are wired today.

---

## 8. Implementation Sequence Recommendation

Order of implementation for maximum dashboard UX uplift per effort unit:

**Phase A — P0 and XS gaps (do first, unblock rendering):**

1. `resolve-dependencies.js --json` flag + `npm run tasks:ready-json` (P0,
   unblocks sprint board)
2. `npm run health:audit` alias (XS, fixes inconsistency, unblocks uniform audit
   row)
3. `scripts/health/ack-warning.js` + `scripts/health/suppress-alert.js` (XS,
   wires Tab 1 primary CTAs)
4. `scripts/debt/query-item.js` (XS, enables debt item detail loading)
5. `scripts/tasks/mark-done.js` (S, wires Tab 6 primary sprint board action)
6. `scripts/plans/archive-plan.js` (XS, cleanup action)
7. `scripts/audits/clear-progress.js` (XS, Tab 5 housekeeping)
8. `generate-metrics.js --json` flag (XS, Tab 2 data refresh)

**Phase B — P1 and S gaps (main dashboard CTAs):** 9.
`scripts/health/run-mid-session-alerts.js` + npm alias (wires Tab 1 "check now"
action) 10. `scripts/health/archive-audit-report.js` +
`comprehensive-audit-history.jsonl` (health trend sparkline) 11.
`scripts/debt/process-review-needed.js --severity` filter (Tab 2 queue
triage) 12. `scripts/audits/list-deferred.js` (Tab 5 unified deferred findings
view) 13. `log-override.js --json` flag + npm alias (Tab 4 override
dashboard) 14. `scripts/reviews/dismiss-refinement.js [id]` (Tab 3
pending-refinements action)

**Phase C — P2/P3 and new skills (fuller workflow coverage):** 15.
`/pre-push-fixer` skill (L effort — stage for after Phase A+B complete) 16.
`/review-overrides` skill (M effort) 17. `/task-start [ID]` skill (M effort) 18.
`scripts/plans/export-decisions.js` (planning → TDMS pipeline) 19. CSV export
scripts for Debt and Reviews 20. Audit run comparison (GAP-G7) — defer until
after audit history accumulates

---

## Sources

| #   | Source                                                            | Type                      | Trust | Date       |
| --- | ----------------------------------------------------------------- | ------------------------- | ----- | ---------- |
| 1   | `.research/dev-dashboard/findings/W3-T1B-health-cli-handoff.md`   | Prior findings (codebase) | HIGH  | 2026-03-29 |
| 2   | `.research/dev-dashboard/findings/W3-T2B-debt-cli-handoff.md`     | Prior findings (codebase) | HIGH  | 2026-03-29 |
| 3   | `.research/dev-dashboard/findings/W3-T3B-reviews-cli-handoff.md`  | Prior findings (codebase) | HIGH  | 2026-03-29 |
| 4   | `.research/dev-dashboard/findings/W3-T4B-pipeline-cli-handoff.md` | Prior findings (codebase) | HIGH  | 2026-03-29 |
| 5   | `.research/dev-dashboard/findings/W3-T5B-audits-cli-handoff.md`   | Prior findings (codebase) | HIGH  | 2026-03-29 |
| 6   | `.research/dev-dashboard/findings/W3-T6B-planning-cli-handoff.md` | Prior findings (codebase) | HIGH  | 2026-03-29 |

All source findings were themselves sourced from direct codebase inspection
(SKILL.md files, script source code, state files, package.json). No web sources.

---

## Contradictions

**Tab 1 vs Tab 4 health aliases.** W3-T1B finds that `health:audit` npm alias is
missing (GAP-H5). W3-T4B inventories npm scripts for hooks-related health and
lists `hooks:audit`, `hooks:health`, etc. as confirmed. This confirms that
health is uniquely missing its alias — the gap is real and isolated to the
health sub-audit only.

**dedup-multi-pass.js --dry-run/--force flags.** W3-T2B confirms these flags are
documented in REFERENCE.md but do not exist in source. The skill-level
`/debt-runner dedup` is correct; direct script invocation flags are phantom
documentation. Dashboard should never expose direct `dedup-multi-pass.js`
commands to users.

**research-index.jsonl path.** W3-T6B confirms the file lives at
`.research/research-index.jsonl` — some documentation references
`.claude/state/research-index.jsonl`. Dashboard must use the `.research/` path.

---

## Gaps (Meta — What This Analysis Couldn't Determine)

1. **Action count per tab** (used in §7 completeness scoring) is an
   approximation. The final dashboard wireframe may define more or fewer actions
   per tab — the completeness percentages are directional, not exact.
2. **`/task-start [ID]` skill scope** is uncertain — the ROADMAP task state
   machine (ready → in-progress) may not have a formal status field in
   ROADMAP.md format. Needs ROADMAP.md schema verification before
   implementation.
3. **Pre-push fixer skill** scope requires a full skills audit before design —
   the pre-push check list (12 checks, several with skip flags) maps differently
   to "fixable" vs "requires manual refactor" compared to pre-commit checks.

---

## Serendipity

**`escalate-deferred.js` is completely invisible to users.** W3-T2B noted this:
the script escalates items deferred N+ times (default threshold: 2) but is
documented in no skill and has no npm alias. There are likely items in the
verification queue that should have been escalated. The Debt tab could surface
an "escalation candidates" count as a passive widget with zero new
infrastructure beyond an npm alias.

**`script-ecosystem-audit --save-baseline` is unique.** Only the script
ecosystem audit has a baseline snapshot feature. If the dashboard exposes a "Set
audit baseline" button, it can only work for one of the 9 audits. Consider
documenting this capability discrepancy for the Tab 5 implementation.

**The `--batch --summary` pattern for ecosystem audits enables a lightweight
"score-only" mode.** If the dashboard adds a "Quick score refresh" button (vs
full interactive audit), it can run all 8 audit scripts in parallel with
`--batch --summary` in minutes, rather than the full 30-min interactive
walk-through. This is a significant UX win that requires only npm script aliases
exposing the flags, not new scripts.

---

## Confidence Assessment

- HIGH claims: 7
- MEDIUM claims: 1 (completeness percentages in §7 — directional estimate)
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

All gaps are sourced directly from the 6 Wave 3 CLI handoff findings documents,
which were themselves sourced from codebase ground truth. The consolidation and
prioritization are analytical judgments, not claims about codebase state.

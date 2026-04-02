# Findings: CLI Command Inventory for Debt Pipeline Tab

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-29
**Sub-Question IDs:** W3-T2B (Debt Pipeline CLI Handoff)

---

## Key Findings

### 1. /debt-runner Mode Inventory [CONFIDENCE: HIGH]

The skill exposes 7 modes via
`/debt-runner [mode] [--severity S0,S1] [--interactive]`. No-args invocation
enters interactive menu. Each mode is CL-loop verified.

| Mode       | Invocation                               | What It Does                                                                         | Mutates MASTER_DEBT?    |
| ---------- | ---------------------------------------- | ------------------------------------------------------------------------------------ | ----------------------- |
| `verify`   | `/debt-runner verify [--severity S0,S1]` | CL-checks items in codebase; writes corrections to staging; applies via resolve-bulk | Yes (via staging)       |
| `sync`     | `/debt-runner sync`                      | dry-run preview → confirm → sync-sonarcloud --force → CL verify → sync-deduped       | Yes                     |
| `plan`     | `/debt-runner plan [--severity S0,S1]`   | Generates prioritized resolution plan JSONL+MD; CL-verified; requires user approval  | No (plan artifact only) |
| `health`   | `/debt-runner health`                    | Runs generate-metrics + debt-health checker; CL quick verify; presents dashboard     | No                      |
| `dedup`    | `/debt-runner dedup`                     | dry-run merges → staging → CL verify → dedup-multi-pass --force → consolidate-all    | Yes                     |
| `validate` | `/debt-runner validate`                  | validate-schema + verify-resolutions; CL verify; writes fixes to staging             | Yes (via staging)       |
| `cleanup`  | `/debt-runner cleanup`                   | Archives resolved >30d, clears FPs; regenerates views+metrics; sync-deduped          | Yes                     |
| (menu)     | `/debt-runner`                           | Interactive menu with live S0/S1/S2/S3/Total counts, last sync, pending staging      | No (entry point)        |

Severity filter `--severity S0,S1` applies to: `verify`, `plan`. Other modes
operate on full dataset.

Source: `.claude/skills/debt-runner/SKILL.md` v1.1 (2026-03-15)

---

### 2. /sonarcloud Mode Inventory [CONFIDENCE: HIGH]

The sonarcloud skill is the canonical entry point for all SonarCloud
interactions.

| Mode      | Invocation                            | What It Does                                                      |
| --------- | ------------------------------------- | ----------------------------------------------------------------- |
| `sync`    | `/sonarcloud` or `/sonarcloud --sync` | Fetch API → diff → append new to MASTER_DEBT → placement analysis |
| `resolve` | `/sonarcloud --resolve`               | Detect sonar_keys gone from API → mark RESOLVED in MASTER_DEBT    |
| `full`    | `/sonarcloud --full`                  | sync + resolve in one pass                                        |
| `report`  | `/sonarcloud --report`                | Detailed MD report with code snippets to docs/audits/             |
| `status`  | `/sonarcloud --status`                | Quick quality gate check via MCP                                  |
| `sprint`  | `/sonarcloud --sprint`                | Sync + report + create cleanup branch + track fixes               |

Source: `.claude/skills/sonarcloud/SKILL.md` v1.0 (2026-02-05)

---

### 3. /add-debt Mode Inventory [CONFIDENCE: HIGH]

Single-item intake skill. Two workflows auto-detected from arguments.

| Workflow | Invocation                        | When to Use                            |
| -------- | --------------------------------- | -------------------------------------- |
| Manual   | `/add-debt` (then guided prompts) | Ad-hoc debt discovery outside PR       |
| Deferred | `/add-debt` (with PR context)     | PR review deferral; requires PR number |

S0 items cannot be deferred — hard block in skill Step 2.

Source: `.claude/skills/add-debt/SKILL.md` v2.0 (2026-03-20)

---

### 4. Clipboard Command Format — Exact Strings [CONFIDENCE: HIGH]

These are the exact strings the Debt Pipeline tab should copy to clipboard for
each common action.

**"Verify item DEBT-XXXXX"**

```
/debt-runner verify --severity S0,S1
```

Note: /debt-runner verify does not accept a single item ID — it verifies entire
severity slices via CL agents. There is NO per-item verify command in the skill
layer. The direct script equivalent (see Section 6) can be used by power users
but has no skill wrapper.

**"Plan S0/S1 resolution"**

```
/debt-runner plan --severity S0,S1
```

Produces `docs/technical-debt/plans/resolution-YYYY-MM-DD.jsonl` + `.md`.

**"Sync SonarCloud"**

```
/sonarcloud --sync
```

Or equivalently: `/debt-runner sync` (routes to sync-sonarcloud.js internally)

**"Run dedup pass"**

```
/debt-runner dedup
```

**"Generate fresh metrics"**

```
/debt-runner health
```

Or for script-level: `node scripts/debt/generate-metrics.js`

---

### 5. Context-Aware Commands — Data from Current View [CONFIDENCE: HIGH]

These commands should be constructed dynamically from what the user is viewing.

| Trigger in UI                                | Dynamic Command Template                                                       |
| -------------------------------------------- | ------------------------------------------------------------------------------ |
| User clicks "Resolve DEBT-XXXXX"             | `/debt-runner verify --severity {item.severity}` (no single-item CLI)          |
| User clicks "Mark false positive DEBT-XXXXX" | `node scripts/debt/resolve-item.js DEBT-XXXXX --false-positive --reason "..."` |
| User clicks "Resolve DEBT-XXXXX via PR"      | `node scripts/debt/resolve-item.js DEBT-XXXXX --pr {pr_number}`                |
| User filters to severity S0                  | `/debt-runner verify --severity S0`                                            |
| User filters to severity S0,S1               | `/debt-runner plan --severity S0,S1`                                           |
| User views verification queue item           | `node scripts/debt/process-review-needed.js --write` (processes all)           |
| User wants to add item manually              | `/add-debt`                                                                    |
| User wants to check intake queue             | `/debt-runner validate`                                                        |

**IMPORTANT:** The `/debt-runner` skill does NOT support targeting a single
DEBT-XXXXX ID. There is no `/debt-runner verify DEBT-0042` command. Single-item
resolution uses `resolve-item.js` directly (Section 6).

---

### 6. Script-Level Commands for Power Users [CONFIDENCE: HIGH]

All 30 scripts catalogued. Those with meaningful CLI flags for dashboard use:

**Intake/Resolution:**

```bash
# Add manual debt item
node scripts/debt/intake-manual.js \
  --file "src/path/to/file.ts" --line 42 \
  --title "Issue description" --severity S2 --category code-quality

# Resolve single item
node scripts/debt/resolve-item.js DEBT-XXXXX --pr 123
node scripts/debt/resolve-item.js DEBT-XXXXX --false-positive --reason "Not applicable"
node scripts/debt/resolve-item.js DEBT-XXXXX --dry-run  # preview

# Resolve multiple items from PR
node scripts/debt/resolve-bulk.js --pr 123 DEBT-0042 DEBT-0043 DEBT-0044
node scripts/debt/resolve-bulk.js --pr 123 --file resolved-ids.txt
node scripts/debt/resolve-bulk.js --pr 123 --dry-run DEBT-0042  # preview

# PR-deferred item
node scripts/debt/intake-pr-deferred.js \
  --pr 325 --file "src/path.ts" --line 145 \
  --title "Issue title" --severity S2 --category security \
  --reason "Pre-existing issue"
```

**Sync/Metrics:**

```bash
# Sync SonarCloud (preview)
node scripts/debt/sync-sonarcloud.js --dry-run
# Sync SonarCloud (execute, no prompt)
node scripts/debt/sync-sonarcloud.js --force
# Sync with severity filter
node scripts/debt/sync-sonarcloud.js --severity BLOCKER,CRITICAL --force
# Resolve stale SonarCloud items
node scripts/debt/sync-sonarcloud.js --resolve --force
# Full pass (sync new + resolve old)
node scripts/debt/sync-sonarcloud.js --full --force

# Regenerate metrics
node scripts/debt/generate-metrics.js
node scripts/debt/generate-metrics.js --verbose

# Regenerate views
node scripts/debt/generate-views.js
```

**Validation/Cleanup:**

```bash
# Schema validation
node scripts/debt/validate-schema.js
node scripts/debt/validate-schema.js --strict  # fail on warnings
node scripts/debt/validate-schema.js --quiet   # errors only
node scripts/debt/validate-schema.js --file docs/technical-debt/MASTER_DEBT.jsonl

# Verify resolutions
node scripts/debt/verify-resolutions.js         # dry-run (default)
node scripts/debt/verify-resolutions.js --write  # apply
node scripts/debt/verify-resolutions.js --verbose

# Process verification queue
node scripts/debt/process-review-needed.js --write
node scripts/debt/process-review-needed.js --verbose

# Sync deduped.jsonl from MASTER_DEBT
node scripts/debt/sync-deduped.js --apply
node scripts/debt/sync-deduped.js --dry-run     # preview
node scripts/debt/sync-deduped.js --json        # machine-readable output

# Check roadmap references
node scripts/debt/sync-roadmap-refs.js --check-only
node scripts/debt/sync-roadmap-refs.js --verbose
```

**Dedup pipeline:**

```bash
# Note: dedup-multi-pass.js has NO CLI flags — runs unconditionally
node scripts/debt/dedup-multi-pass.js            # runs, writes deduped.jsonl

# Consolidate all sources
node scripts/debt/consolidate-all.js

# Escalate deferred items
node scripts/debt/escalate-deferred.js --dry-run
node scripts/debt/escalate-deferred.js --threshold 3  # override default (2)
```

**No-flag scripts (run as-is):**

- `check-phase-status.js` — phase completion status
- `consolidate-all.js` — consolidate all source files
- `extract-audits.js` — extract from audit reports (no flags)
- `extract-reviews.js` — extract from review files (no flags)
- `normalize-all.js` — normalize all items
- `reconcile-roadmap.js --write` — reconcile roadmap references

---

### 7. Gap Analysis — Actions Without a CLI Command [CONFIDENCE: HIGH]

| User Intent                                         | Gap                                                                                       | Workaround                                                    |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Verify a single DEBT-XXXXX item                     | No single-item verify in skill layer. /debt-runner verify works on entire severity slices | Read the item directly from MASTER_DEBT                       |
| View debt items filtered by category                | No `--category` filter on any mode                                                        | Manual grep/jq on MASTER_DEBT.jsonl                           |
| View debt items for a specific file                 | No `--file` filter on verify or plan modes                                                | Manual grep on MASTER_DEBT.jsonl                              |
| Add debt item with all fields pre-populated from UI | /add-debt is interactive; no single-shot silent invocation available                      | Use `intake-manual.js` directly                               |
| Get JSON output of metrics for dashboard rendering  | `generate-metrics.js` writes to file; no stdout JSON option                               | Read metrics.json file directly                               |
| Filter verification queue by severity               | `process-review-needed.js` processes entire queue; no severity filter                     | Pre-filter review-needed.jsonl manually                       |
| Check if a specific DEBT-XXXXX is in the queue      | No query-by-ID in any CLI command                                                         | `grep DEBT-XXXXX docs/technical-debt/raw/review-needed.jsonl` |
| Export current debt snapshot as CSV                 | No CSV export script exists                                                               | None — feature gap                                            |
| Bulk-assign roadmap track to selected items         | `assign-roadmap-refs.js` assigns all items; no per-item or batch-by-ID assignment         | Manual MASTER_DEBT edit + sync-deduped                        |

**Critical gap for the dashboard:** There is no single-item verify-by-ID command
at the skill level. The verification queue (review-needed.jsonl — 27 items) can
only be processed as a batch via `process-review-needed.js --write`. The
dashboard cannot surface "Click to verify this one item" as a real CLI action —
only "Process all 27 verification queue items."

---

### 8. Script-to-Mode Mapping (What /debt-runner Orchestrates) [CONFIDENCE: HIGH]

The skill's REFERENCE.md documents exact script sequences per mode:

| /debt-runner Mode | Scripts Called (in order)                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------- |
| health            | `generate-metrics.js`, `scripts/health/checkers/debt-health.js`                                         |
| sync              | `sync-sonarcloud.js --dry-run`, `sync-sonarcloud.js --force`, `sync-deduped.js`                         |
| verify            | `generate-metrics.js`, `resolve-bulk.js --file staging/...` (dry-run then apply), `sync-deduped.js`     |
| plan              | (AI analysis), writes plan JSONL+MD artifacts                                                           |
| dedup             | `dedup-multi-pass.js --dry-run`, `dedup-multi-pass.js --force`, `consolidate-all.js`, `sync-deduped.js` |
| validate          | `validate-schema.js`, `verify-resolutions.js`, `sync-deduped.js`                                        |
| cleanup           | (identify targets), `sync-deduped.js`, `generate-views.js`, `generate-metrics.js`                       |

Note: `dedup-multi-pass.js` documentation in the skill references `--dry-run`
and `--force` flags, but the actual script source shows NO CLI argument parsing
— it runs unconditionally and always writes output. The REFERENCE.md flags
(`--dry-run`, `--force`) appear to be aspirational/planned, not implemented.
Dashboard copy should use `/debt-runner dedup` rather than direct script
invocation for this one.

---

## Sources

| #   | Path                                                           | Title                  | Type                       | Trust | Date       |
| --- | -------------------------------------------------------------- | ---------------------- | -------------------------- | ----- | ---------- |
| 1   | `.claude/skills/debt-runner/SKILL.md`                          | Debt Runner Skill      | Internal skill doc         | HIGH  | 2026-03-15 |
| 2   | `.claude/skills/debt-runner/REFERENCE.md`                      | Debt Runner Reference  | Internal reference doc     | HIGH  | 2026-03-15 |
| 3   | `.claude/skills/add-debt/SKILL.md`                             | Add Debt Skill         | Internal skill doc         | HIGH  | 2026-03-20 |
| 4   | `.claude/skills/sonarcloud/SKILL.md`                           | SonarCloud Skill       | Internal skill doc         | HIGH  | 2026-02-05 |
| 5   | `scripts/debt/*.js` (30 scripts)                               | Debt pipeline scripts  | Source code (ground truth) | HIGH  | Various    |
| 6   | `.research/dev-dashboard/findings/CHECKPOINT-tab-decisions.md` | Tab Grouping Decisions | Session checkpoint         | HIGH  | 2026-03-29 |

---

## Contradictions

**dedup-multi-pass.js CLI flags:** The REFERENCE.md documents usage as
`dedup-multi-pass.js --dry-run` and `dedup-multi-pass.js --force`, but
inspection of the script's source shows no `process.argv` parsing — the script
runs to completion unconditionally. The skill-level `/debt-runner dedup` command
should still work correctly (the skill does its own dry-run preview via AI
analysis before calling the script), but the direct script invocation flags
documented in REFERENCE.md do not exist. This is a documentation bug in
REFERENCE.md.

**sync mode routing:** The tab checkpoint documents "CLI: `/debt-runner`,
`/sonarcloud --sync`" for Tab 2. Both reach sync-sonarcloud.js but
`/debt-runner sync` adds CL-loop verification and staging safety that
`/sonarcloud --sync` does not. For dashboard copy, `/sonarcloud --sync` is
lighter-weight; `/debt-runner sync` is more thorough. Both are valid but not
equivalent.

---

## Gaps

1. **No single-item verify command at skill level.** Verification queue items
   can only be batch-processed. Dashboard "Verify DEBT-XXXXX" button cannot map
   to a direct CLI invocation — the closest honest copy is
   `/debt-runner verify --severity {item.severity}` which processes all items at
   that severity.

2. **generate-metrics.js has no JSON-to-stdout mode.** Dashboard reads
   metrics.json file directly; there is no `--json` flag for stdout. This is
   already accounted for in the data inventory (metrics.json is dashboard-ready
   per checkpoint).

3. **No category or file-path filter** on any /debt-runner mode. The dashboard
   cannot surface "Show/fix debt for this file" as a CLI action.

4. **sonarcloud SKILL.md version date is 2026-02-05** — the most dated skill of
   the three. It may not reflect recent TDMS schema changes (e.g., the
   `source_pr` field added in add-debt v1.1, 2026-03-18). Low risk for the
   dashboard since the dashboard reads data files, not skill docs.

5. **dedup-multi-pass.js --dry-run/--force flags do not exist in source.**
   Documented in REFERENCE.md but not implemented. No impact on skill usage;
   direct script usage would silently ignore these flags.

---

## Serendipity

- **Verification queue has 27 items** (from checkpoint). The
  `process-review-needed.js` script is the only way to batch-process these. If
  the dashboard shows this queue, the CTA should be "Process verification queue
  (27 items)" → `/debt-runner validate` rather than per-item actions.

- **`sync-deduped.js --json`** provides machine-readable diff output. This could
  power a real-time "sync status" indicator in the dashboard without requiring a
  full skill invocation.

- **`escalate-deferred.js`** is undocumented in any skill. It escalates items
  that have been deferred N+ times (default threshold: 2). The dashboard's
  "Intake activity" section could surface these as a dedicated escalation queue
  — this script is currently invisible to users.

- **`resolve-bulk.js --output-json`** writes a resolution summary JSON for CI
  consumption. This could be used to provide structured feedback to the
  dashboard after a bulk resolution operation.

---

## Confidence Assessment

- HIGH claims: 8
- MEDIUM claims: 0
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

All findings are sourced from direct inspection of skill documentation and
script source code (ground truth). No web sources required.

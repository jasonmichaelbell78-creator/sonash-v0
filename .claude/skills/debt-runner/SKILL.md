---
name: debt-runner
description: >-
  Interactive TDMS orchestrator with 7 modes — verify, sync, plan, health,
  dedup, validate, cleanup. Convergence-loop verified at every stage. Owns
  remediation plan artifacts. Never writes MASTER_DEBT.jsonl directly — all
  mutations go through staging with CL verification before applying via existing
  intake/resolve scripts.
---

# Debt Runner

Interactive orchestrator for the Technical Debt Management System. Sequences
existing TDMS scripts, applies convergence-loop verification at every stage, and
owns the remediation plan artifact.

## Critical Rules (MUST follow)

1. **Never write MASTER_DEBT.jsonl directly** — all mutations go to staging
   files in `docs/technical-debt/staging/`. CL verifies staging, then existing
   scripts (intake-audit.js, resolve-bulk.js, etc.) apply to canonical files.
2. **Convergence-loop on every mode** — no mode completes without CL
   verification. Presets vary by mode (see each mode section).
3. **Post-mutation sync check** — after any pipeline that modifies MASTER_DEBT,
   run CL quick preset verifying MASTER_DEBT.jsonl and `raw/deduped.jsonl` item
   counts match + spot-check recent mutations in both files.
4. **Confirmation gate at >100 mutations** — present count + 10-item preview.
   User approves before applying.
5. **Return to menu after each mode** — present updated stats + mode menu. User
   picks next mode or exits.

## When to Use

- Verifying accuracy of current technical debt items
- Syncing new debt from SonarCloud or other sources
- Planning and prioritizing debt resolution
- Running deduplication, validation, or cleanup pipelines
- User invokes `/debt-runner` or any mode variant

## When NOT to Use

- Adding a single debt item manually — use `/add-debt`
- Full SonarCloud interactive experience — use `/sonarcloud --interactive`
- Auditing the TDMS ecosystem health — use `/tdms-ecosystem-audit`
- Reviewing debt in context of a PR — use `/pr-review`

## Routing Guide

| Situation                 | Use                     | Why                            |
| ------------------------- | ----------------------- | ------------------------------ |
| Orchestrate debt pipeline | `/debt-runner`          | Full CL-verified orchestration |
| Add single item           | `/add-debt`             | Lightweight intake             |
| SonarCloud deep dive      | `/sonarcloud`           | Full interactive experience    |
| TDMS system health        | `/tdms-ecosystem-audit` | Ecosystem-level diagnostic     |

## Input

**Invocation:** `/debt-runner [mode] [--severity S0,S1] [--interactive]`

**Modes:** `verify`, `sync`, `plan`, `health`, `dedup`, `validate`, `cleanup`

**No args** → interactive menu with live stats.

---

## Process Overview

```
WARM-UP    → Stats, effort estimates, resume check
MENU       → Show stats, present 7 modes, user selects
MODE       → Execute selected mode with CL verification
SYNC-CHECK → Post-mutation MASTER_DEBT ↔ deduped.jsonl CL verify
RETURN     → Back to menu with updated stats, user picks next or exits
```

**Resume entry:** If state file exists with incomplete mode, present: "Resuming
debt-runner. Last mode: [mode], step [N]. Continue? [Y/restart]"

---

## Warm-Up (MUST)

Present before the menu:

- Current debt stats (S0-S3 counts)
- Effort estimates per mode: verify (~10min S0, ~30min all), sync (~5min + CL),
  plan (~15min), health (~5min), dedup (~20min), validate (~10min), cleanup
  (~10min)
- Resume status if applicable
- Pending staging files if any

**Done when:** User acknowledges, proceeds to menu.

---

## Interactive Menu (MUST for no-args invocation)

> Read REFERENCE.md for the menu rendering template and stats source commands.

```
Debt Runner — Interactive Mode
S0: [N] | S1: [N] | S2: [N] | S3: [N] | Total: [N]
Last sync: [date] | Last verify: [date] | Pending staging: [N files]

1. verify   — Verify current debt accuracy via convergence loop
2. sync     — Run SonarCloud sync + intake pipeline
3. plan     — Create resolution plan for target severities
4. health   — Surface debt metrics, trends, staleness
5. dedup    — Run deduplication with CL-verified merge decisions
6. validate — Schema validation + stale item detection
7. cleanup  — Archive resolved, clear FPs, regenerate views

Select mode [1-7]:
```

**Stats:** Run `node scripts/debt/generate-metrics.js`, check
`docs/technical-debt/staging/` for pending files.

---

## Mode: Verify (CL standard/thorough)

Verify current debt items accurately reflect codebase reality.

1. Load items filtered by `--severity` (default: all)
2. **CL preset by severity** — see REFERENCE.md slicing templates. S0 gets
   thorough attention within the standard pass structure. Each agent checks:
   does file exist? Is the issue still present? Fixed but not marked resolved?
3. Present T20 tally after each pass. User gate per pass.
4. Write corrections to `staging/verify-corrections.jsonl`
5. Apply via `node scripts/debt/resolve-bulk.js` for items to resolve
6. Post-mutation sync check (Critical Rule #3)

**Done when:** CL converged, corrections applied, sync check passed.

---

## Mode: Sync (CL standard)

Sync new debt from SonarCloud and run intake pipeline.

1. Run `node scripts/debt/sync-sonarcloud.js --dry-run` — preview
2. Present preview: N new items, severity breakdown. User confirms.
3. Run `node scripts/debt/sync-sonarcloud.js --force`
4. **CL standard preset** — slice by source batch. Verify severity
   classifications, dedup accuracy, file paths and line numbers.
5. Write corrections to `staging/sync-corrections.jsonl`
6. Apply corrections, post-mutation sync check

**Done when:** Sync complete, CL verified, sync check passed.

---

## Mode: Plan (CL standard)

> Read REFERENCE.md for remediation plan JSONL schema.

Create a prioritized resolution plan for target severities.

1. Filter MASTER_DEBT by `--severity` (default: S0,S1)
2. Analyze: group by file, category, effort. Identify dependencies.
3. Generate resolution order: S0 first, then by effort (E0→E3), cluster by file
4. Write `docs/technical-debt/plans/resolution-YYYY-MM-DD.jsonl` + `.md` view
5. **CL standard preset** — verify plan claims: file paths exist, items not
   already resolved, effort estimates reasonable, dependencies captured
6. Present plan to user for approval
7. **Handoff:** manual for <10 items, subagent for 10+. Flag S0 security for
   `/security-auditor`.

**Done when:** Plan generated, CL verified, user approved.

---

## Mode: Health (CL quick)

Surface debt metrics, trends, and staleness indicators.

1. Run `node scripts/debt/generate-metrics.js`
2. Run `node scripts/health/checkers/debt-health.js`
3. **CL quick preset** — verify: item counts match MASTER_DEBT line count,
   severity distribution matches, stale items (>90 days) correctly identified
4. Present dashboard: severity breakdown, trend, stale count, top categories

**Done when:** Metrics presented, CL verified.

---

## Mode: Dedup (CL standard)

Run deduplication with verified merge decisions.

1. Run `node scripts/debt/dedup-multi-pass.js --dry-run` — preview merges
2. Write proposed merges to `staging/dedup-merges.jsonl`
3. **CL standard preset** — slice by merge-candidate clusters. Verify candidates
   are truly duplicates, merge target retains best info, no S0/S1 absorbed into
   lower severity
4. Present merge decisions (batch if >20, delegation available)
5. Apply: `node scripts/debt/dedup-multi-pass.js --force`
6. Run `node scripts/debt/consolidate-all.js`
7. Post-mutation sync check

**Done when:** Dedup complete, CL verified, sync check passed.

---

## Mode: Validate (CL standard)

Schema validation + stale item detection.

1. Run `node scripts/debt/validate-schema.js`
2. Run `node scripts/debt/verify-resolutions.js`
3. **CL standard preset** — verify: schema violations are real (not schema
   evolution FPs), stale items genuinely stale, resolution claims match code
4. Present findings with fix recommendations
5. Write fixes to `staging/validate-fixes.jsonl`
6. Apply fixes, post-mutation sync check

**Done when:** Validation complete, CL verified, fixes applied.

---

## Mode: Cleanup (CL standard)

Archive resolved items, clear false positives, regenerate views.

1. Identify resolved items >30 days old + confirmed false positives
2. **CL standard preset** — verify: resolved items genuinely resolved
   (spot-check code), false positives genuinely false
3. Present cleanup plan: N to archive, M FPs to clear. User confirms.
4. Apply via existing scripts
5. Run: `sync-deduped.js` → `generate-views.js` → `generate-metrics.js`
6. Post-mutation sync check

**Done when:** Cleanup applied, views regenerated, sync check passed.

---

## Post-Mutation Sync Check (MUST after any mutation mode)

1. **CL quick preset** on MASTER_DEBT ↔ `raw/deduped.jsonl`:
   - Item counts match
   - 10 random recent mutations appear in both files
   - No orphaned items in either file
2. If divergent: run `node scripts/debt/sync-deduped.js` and re-verify
3. If still divergent: warn user, do NOT proceed to next mode

---

## Guard Rails

- **>100 mutations:** Confirm + 10-item preview before applying
- **Staging safety:** Never deleted until full pipeline succeeds. On successful
  mode completion, delete that mode's staging files. On session exit, warn if
  staging files remain from incomplete modes.
- **Error recovery:** Save state with failed step. `/debt-runner resume`
- **MASTER_DEBT protection:** All writes via existing dual-write scripts
- **S0 security:** Recommend `/security-auditor` before resolution
- **Empty-result short-circuit:** If a mode produces zero items to process, skip
  CL verification and report "No items found. Returning to menu."
- **Delegation protocol (>20 items):** For any mode presenting >20 items for
  decision, offer: "You decide" (apply all recommendations), severity filter
  ("skip remaining S3"), or batch review. Applies to all modes uniformly.

## Compaction Resilience

- **State file:** `.claude/state/debt-runner.state.json`
- **Update:** After each mode completion and each CL pass
- **Staging files:** On disk in `docs/technical-debt/staging/`, survive
  compaction
- **Resume:** `/debt-runner resume` reads state, skips completed steps

## Integration

- **Neighbors:** `/sonarcloud` (sync scripts), `/add-debt` (intake),
  `/convergence-loop` (all modes), `/tdms-ecosystem-audit` (ecosystem health)
- **Downstream:** Execution after plan, `/security-auditor` for S0 security,
  `/code-reviewer` for affected files
- **Auto-triggers:** `generate-views.js` + `generate-metrics.js` after cleanup
- **Script progress (MUST):** Before each script call, print "Running
  `[script]`..." After completion, print result summary. Prevents user
  uncertainty during long operations.
- **Retro prompt (SHOULD):** On session exit (not per-mode), prompt: "Any modes
  that produced unexpected results? Any scripts that need attention?" Capture in
  state file `process_feedback`.

---

## Version History

| Version | Date       | Description                                                                              |
| ------- | ---------- | ---------------------------------------------------------------------------------------- |
| 1.1     | 2026-03-15 | Skill-audit: warm-up, resume, delegation, empty-result, staging cleanup, retro, progress |
| 1.0     | 2026-03-15 | Initial creation via /skill-creator (22 decisions)                                       |

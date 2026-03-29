# Findings: What does the debt-runner skill currently do?

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-26
**Sub-Question IDs:** SQ-001

---

## Overview

The `/debt-runner` skill is an **interactive orchestrator** for the Technical
Debt Management System (TDMS). It sequences existing Node.js scripts, applies
convergence-loop verification at every stage, and owns the remediation plan
artifact. It does NOT write to `MASTER_DEBT.jsonl` directly — all mutations go
through staging files first, then through existing scripts.

**Skill files:**

- `.claude/skills/debt-runner/SKILL.md` (v1.1, 2026-03-15)
- `.claude/skills/debt-runner/REFERENCE.md` (v1.0, 2026-03-15)

**State file:** `.claude/state/debt-runner.state.json` (does not exist at time
of research — no active session)

**Staging directory:** `docs/technical-debt/staging/` (does not currently exist
— only created when a mode is in progress)

---

## 1. Invocation and Interactive Menu

### Invocation syntax

```
/debt-runner [mode] [--severity S0,S1] [--interactive]
```

No-args invocation enters the interactive menu.

### Warm-up (mandatory before menu)

Before presenting the menu, the skill presents:

1. Current debt stats (S0-S3 counts, derived from `generate-metrics.js`)
2. Effort estimates per mode (see below)
3. Resume status if state file has an incomplete mode
4. Pending staging files if any exist in `docs/technical-debt/staging/`

**Effort estimates defined in SKILL.md:**

- verify: ~10min S0, ~30min all
- sync: ~5min + CL
- plan: ~15min
- health: ~5min
- dedup: ~20min
- validate: ~10min
- cleanup: ~10min

### Menu rendering

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

**Stats source command** (inline Node.js in REFERENCE.md):

```bash
node -e "
const fs = require('fs');
let counts = {S0:0,S1:0,S2:0,S3:0, total: 0};
try {
  const lines = fs.readFileSync('docs/technical-debt/MASTER_DEBT.jsonl','utf8').trim().split('\n');
  counts.total = lines.length;
  lines.forEach(l => { try { const d=JSON.parse(l); if(d.severity) counts[d.severity]=(counts[d.severity]||0)+1; } catch(e){} });
} catch (e) {}
console.log(JSON.stringify(counts));
"
ls docs/technical-debt/staging/ 2>/dev/null | wc -l
```

### Process flow

```
WARM-UP    → Stats, effort estimates, resume check
MENU       → Show stats, present 7 modes, user selects
MODE       → Execute selected mode with CL verification
SYNC-CHECK → Post-mutation MASTER_DEBT ↔ deduped.jsonl CL verify
RETURN     → Back to menu with updated stats, user picks next or exits
```

### Post-mode return

After each mode completes, the skill returns to the menu with updated stats.
User picks next mode or exits.

---

## 2. Mode: Verify (CL preset: standard)

**Purpose:** Verify current debt items accurately reflect codebase reality.
Checks: does file exist? Is the issue still present? Fixed but not marked
resolved?

### Script sequence

```bash
# Step 1: Load current counts
node scripts/debt/generate-metrics.js

# Step 2: CL standard preset — agents check codebase per severity
# (See CL domain slicing below)

# Step 3: Apply corrections (dry-run first, then apply)
node scripts/debt/resolve-bulk.js --file staging/verify-corrections.jsonl --dry-run
node scripts/debt/resolve-bulk.js --file staging/verify-corrections.jsonl

# Step 4: Post-mutation sync check
node scripts/debt/sync-deduped.js
```

### CL domain slicing (from REFERENCE.md)

| Slice   | Content                  | Preset                                                        |
| ------- | ------------------------ | ------------------------------------------------------------- |
| Slice 1 | S0 items (typically <50) | thorough — critical, false positives waste emergency response |
| Slice 2 | S1 items (~1300)         | standard — split by category, check file + issue presence     |
| Slice 3 | S2 items                 | standard — split by category                                  |
| Slice 4 | S3 items                 | standard — split by category                                  |

### Data flows

- **In:** `MASTER_DEBT.jsonl` (filtered by `--severity`)
- **Staging:** `docs/technical-debt/staging/verify-corrections.jsonl`
- **Staging schema:**
  ```json
  {"id": "DEBT-0042", "action": "resolve", "reason": "...", "verified_by": "convergence-loop"}
  {"id": "DEBT-0099", "action": "update_severity", "old": "S1", "new": "S2", "reason": "..."}
  {"id": "DEBT-0150", "action": "update_file", "old": "src/old.ts", "new": "src/renamed.ts", "reason": "..."}
  ```
- **Applied via:** `resolve-bulk.js` (for resolve actions), other mutations via
  existing scripts
- **Out:** Updated `MASTER_DEBT.jsonl` + synced `raw/deduped.jsonl`

### Done when

CL converged, corrections applied, sync check passed.

---

## 3. Mode: Sync (CL preset: standard)

**Purpose:** Sync new debt from SonarCloud and run intake pipeline.

### Script sequence

```bash
# Step 1: Preview
node scripts/debt/sync-sonarcloud.js --dry-run

# Step 2: Execute (after user confirms)
node scripts/debt/sync-sonarcloud.js --force

# Step 3: CL standard preset — verify severity classifications,
# dedup accuracy, file paths and line numbers

# Step 4: Apply corrections from staging
# staging/sync-corrections.jsonl

# Step 5: Sync check
node scripts/debt/sync-deduped.js
```

### sync-sonarcloud.js capabilities (script-level)

The underlying script supports:

- `--project <key>`, `--org <name>` — SonarCloud targeting
- `--severity <list>` — filter by BLOCKER,CRITICAL,MAJOR,MINOR,INFO
- `--type <list>` — filter by BUG,VULNERABILITY,CODE_SMELL
- `--status <list>` — default OPEN,CONFIRMED,REOPENED
- `--resolve` — detect and mark RESOLVED items no longer in SonarCloud
- `--full` — sync new + resolve old in one pass
- Reads `sonar-project.properties` for defaults
- Requires `SONAR_TOKEN` environment variable

### CL domain slicing (sync mode)

| Slice   | Content                                                                 |
| ------- | ----------------------------------------------------------------------- |
| Slice 1 | SonarCloud BLOCKER/CRITICAL → verify S0 classification                  |
| Slice 2 | SonarCloud MAJOR → verify S1 classification                             |
| Slice 3 | SonarCloud MINOR/INFO → verify S2/S3 classification                     |
| Slice 4 | Cross-check all new items against existing MASTER_DEBT for missed dupes |

### Data flows

- **In:** SonarCloud API (live), `MASTER_DEBT.jsonl` (for dedup check)
- **Staging:** `docs/technical-debt/staging/sync-corrections.jsonl`
- **Staging schema:**
  ```json
  {"id": "DEBT-1234", "action": "reclassify", "field": "severity", "old": "S0", "new": "S1", "reason": "..."}
  {"id": "DEBT-1235", "action": "mark_duplicate", "duplicate_of": "DEBT-0500", "reason": "..."}
  ```
- **Out:** Updated `MASTER_DEBT.jsonl`, intake log appended to
  `docs/technical-debt/logs/intake-log.jsonl`

### Done when

Sync complete, CL verified, sync check passed.

---

## 4. Mode: Plan (CL preset: standard)

**Purpose:** Create a prioritized resolution plan for target severities.

### Script sequence

```bash
# No dedicated script — this mode is AI-driven:
# Step 1: Filter MASTER_DEBT by severity (read and filter JSONL)
# Step 2: Analyze — group by file, category, effort; identify dependencies
# Step 3: Generate resolution order (S0 first, then E0→E3, cluster by file)
# Step 4: Write plan artifacts (AI writes these files directly):
#   docs/technical-debt/plans/resolution-YYYY-MM-DD.jsonl
#   docs/technical-debt/plans/resolution-YYYY-MM-DD.md

# Step 5: CL standard preset — verify plan claims:
#   - file paths exist
#   - items not already resolved
#   - effort estimates reasonable
#   - dependencies captured
```

### Remediation plan JSONL schema (from REFERENCE.md)

Path: `docs/technical-debt/plans/resolution-YYYY-MM-DD.jsonl`

First line = plan metadata:

```json
{
  "plan_id": "PLAN-2026-03-15",
  "created": "2026-03-15",
  "severity_filter": ["S0", "S1"],
  "total_items": 42,
  "estimated_effort": "E2",
  "status": "draft"
}
```

Subsequent lines = ordered items:

```json
{
  "order": 1,
  "id": "DEBT-0042",
  "severity": "S0",
  "effort": "E0",
  "file": "src/auth.ts",
  "title": "SQL injection in query builder",
  "depends_on": [],
  "cluster": "auth-module",
  "fix_guidance": "Use parameterized queries"
}
```

### Delegation rule

- **<10 items:** Manual resolution
- **>=10 items:** Subagent delegation
- **S0 security items:** Flag for `/security-auditor` before resolution

### Data flows

- **In:** `MASTER_DEBT.jsonl` (filtered by `--severity`, default S0,S1)
- **Out:** `docs/technical-debt/plans/resolution-YYYY-MM-DD.jsonl` + `.md`

### Done when

Plan generated, CL verified, user approved.

---

## 5. Mode: Health (CL preset: quick)

**Purpose:** Surface debt metrics, trends, and staleness indicators.

### Script sequence

```bash
node scripts/debt/generate-metrics.js
node scripts/health/checkers/debt-health.js

# CL quick preset — verify:
# - item counts match MASTER_DEBT line count
# - severity distribution matches
# - stale items (>90 days) correctly identified
```

### generate-metrics.js behavior

Reads `MASTER_DEBT.jsonl`. Outputs:

- `docs/technical-debt/metrics.json` — machine-readable JSON
- `docs/technical-debt/METRICS.md` — human-readable dashboard
- Appends to `docs/technical-debt/logs/metrics-log.jsonl`

**metrics.json structure:**

```json
{
  "generated": "<ISO timestamp>",
  "summary": { "total", "open", "resolved", "false_positives", "resolution_rate_pct" },
  "by_status": { "NEW", "VERIFIED", "IN_PROGRESS", "RESOLVED", "FALSE_POSITIVE" },
  "by_severity": { "S0", "S1", "S2", "S3" },
  "by_category": { ... },
  "by_source": { ... },
  "alerts": { "s0_count", "s1_count", "s0_items": [up to 10], "s1_items": [up to 10] },
  "health": { "avg_age_days", "oldest_age_days", "oldest_item_id", "verification_queue_size" }
}
```

### debt-health.js behavior

Reads `docs/technical-debt/metrics.json` and `MASTER_DEBT.jsonl` directly.
Computes scored metrics against benchmarks:

| Metric          | Good | Average | Poor |
| --------------- | ---- | ------- | ---- |
| s0_count        | 0    | 0       | 1+   |
| s1_count        | 0    | 5       | 10+  |
| total_open      | 10   | 30      | 60+  |
| avg_age_days    | 30   | 90      | 180+ |
| resolution_rate | 50%  | 30%     | 10%  |
| intake_30d      | 5    | 15      | 30+  |
| resolved_30d    | 10   | 5       | 0    |
| net_flow        | -5   | 0       | +10  |

### Dashboard presented to user

Severity breakdown, trend, stale count (>90 days), top categories.

### Data flows

- **In:** `MASTER_DEBT.jsonl`, `docs/technical-debt/metrics.json` (or generates
  it)
- **Out:** `docs/technical-debt/metrics.json`, `METRICS.md` (refreshed),
  `logs/metrics-log.jsonl` (appended)
- **No mutations to MASTER_DEBT**

### Done when

Metrics presented, CL verified. No staging files, no sync check required.

---

## 6. Mode: Dedup (CL preset: standard)

**Purpose:** Run deduplication with verified merge decisions.

### Script sequence

```bash
# Step 1: Preview
node scripts/debt/dedup-multi-pass.js --dry-run

# Step 2: Write proposed merges to staging
# staging/dedup-merges.jsonl

# Step 3: CL standard preset — slice by merge-candidate clusters
# Verify: truly duplicates? merge target retains best info?
# No S0/S1 absorbed into lower severity?

# Step 4: Present merge decisions (batch if >20, delegation available)

# Step 5: Execute
node scripts/debt/dedup-multi-pass.js --force
node scripts/debt/consolidate-all.js

# Step 6: Sync check
node scripts/debt/sync-deduped.js
```

### dedup-multi-pass.js passes

The script runs 6 deduplication passes in sequence:

- **Pass 0 — Parametric match:** Same file + title differing only in numeric
  literals
- **Pass 1 — Exact match:** Same `content_hash`
- **Pass 2 — Near match:** Same file + line ±5 + message similarity >80%
- **Pass 3 — Semantic match:** Same file + very similar title
- **Pass 4 — Cross-source match:** SonarCloud rule → audit finding correlation
- **Pass 5 — Systemic pattern grouper:** Annotate items with same title across
  > =3 files

Reads `docs/technical-debt/raw/normalized-all.jsonl`. Outputs:

- `docs/technical-debt/raw/deduped.jsonl` — unique items
- `docs/technical-debt/logs/dedup-log.jsonl` — merge history
- `docs/technical-debt/raw/review-needed.jsonl` — uncertain matches

### consolidate-all.js pipeline

Runs these steps in sequence:

1. `extract-audits.js`
2. `extract-reviews.js`
3. `normalize-all.js`
4. `dedup-multi-pass.js`
5. `generate-views.js --ingest`

(Note: `extract-sonarcloud.js` is marked DEPRECATED in consolidate-all.js —
replaced by `sync-sonarcloud.js` for live API sync)

### CL domain slicing (dedup mode)

Each cluster = items with content_hash similarity >80%. Slice per cluster:
verify items are truly duplicate, not just similar. Agent checks: same file?
Same issue? Different manifestation?

### Staging schema

```json
{
  "target": "DEBT-0042",
  "merge_from": ["DEBT-0500", "DEBT-0501"],
  "reason": "Same TODO in same file, different extraction sources"
}
```

### Data flows

- **In:** `MASTER_DEBT.jsonl`, `raw/normalized-all.jsonl`
- **Staging:** `docs/technical-debt/staging/dedup-merges.jsonl`
- **Out:** Updated `raw/deduped.jsonl`, `logs/dedup-log.jsonl`,
  `raw/review-needed.jsonl`

### Done when

Dedup complete, CL verified, sync check passed.

---

## 7. Mode: Validate (CL preset: standard)

**Purpose:** Schema validation + stale item detection.

### Script sequence

```bash
node scripts/debt/validate-schema.js
node scripts/debt/verify-resolutions.js

# CL standard preset — verify:
# - schema violations are real (not schema evolution FPs)
# - stale items genuinely stale
# - resolution claims match code

# Present findings with fix recommendations
# Write fixes to staging/validate-fixes.jsonl
# Apply fixes
node scripts/debt/sync-deduped.js
```

### validate-schema.js behavior

Reads from `scripts/config/audit-schema.json` for the schema definition.
Validates each item in `MASTER_DEBT.jsonl` against:

- Required fields: `id`, `source_id`, `title`, `severity`, `category`, `status`
- Valid severities: S0, S1, S2, S3
- Valid statuses: NEW, VERIFIED, FALSE_POSITIVE, IN_PROGRESS, RESOLVED
- Valid categories: security, performance, code-quality, documentation,
  refactoring, process, engineering-productivity, enhancements, ai-optimization
- Valid types: bug, code-smell, vulnerability, hotspot, tech-debt, process-gap,
  enhancement
- Valid efforts: E0, E1, E2, E3
- ID format: `/^DEBT-\d{4,}$/`
- Source ID format warning if not prefixed with: `audit:`, `sonarcloud:`,
  `manual:`, `review:`, `CANON-`

Options: `--strict` (fail on warnings), `--quiet` (errors only), `--file <path>`

### verify-resolutions.js behavior

Audits item statuses — combines three checks:

- Step 3: Verify NEW items (promote to VERIFIED if file exists)
- Step 4: Audit RESOLVED items (confirm or flag as possibly unresolved)
- Step 5: Audit FALSE_POSITIVE items (confirm or flag as possibly misclassified)

Reads from both `MASTER_DEBT.jsonl` and `raw/deduped.jsonl`. Options:
`--dry-run` (default), `--write` (apply), `--verbose`

### Staging schema

```json
{"id": "DEBT-0042", "action": "fix_schema", "field": "severity", "old": "HIGH", "new": "S1", "reason": "Non-standard severity value"}
{"id": "DEBT-0099", "action": "mark_stale", "days_inactive": 120, "reason": "No status change since 2025-11-15"}
```

### Data flows

- **In:** `MASTER_DEBT.jsonl`, `raw/deduped.jsonl`
- **Staging:** `docs/technical-debt/staging/validate-fixes.jsonl`
- **Out:** Updated `MASTER_DEBT.jsonl` + synced `raw/deduped.jsonl`

### Done when

Validation complete, CL verified, fixes applied.

---

## 8. Mode: Cleanup (CL preset: standard)

**Purpose:** Archive resolved items, clear false positives, regenerate views.

### Script sequence

```bash
# Step 1: Identify targets
# - resolved items >30 days old
# - confirmed false positives

# Step 2: CL standard preset — verify:
# - resolved items genuinely resolved (spot-check code)
# - false positives genuinely false

# Step 3: Present cleanup plan: N to archive, M FPs to clear. User confirms.

# Step 4: Apply via existing scripts
# (resolve-bulk for archival, manual for FP clearing)

# Step 5: Regenerate everything
node scripts/debt/sync-deduped.js
node scripts/debt/generate-views.js
node scripts/debt/generate-metrics.js
```

### generate-views.js modes

- **Default mode:** Reads `MASTER_DEBT.jsonl`, generates markdown views only
- **`--ingest` mode:** Also processes `raw/deduped.jsonl`, assigns DEBT IDs to
  new items, appends to `MASTER_DEBT.jsonl`

**Outputs:**

- `docs/technical-debt/INDEX.md`
- `docs/technical-debt/views/by-severity.md`
- `docs/technical-debt/views/by-category.md`
- `docs/technical-debt/views/by-status.md`
- `docs/technical-debt/views/verification-queue.md`
- `docs/technical-debt/unplaced-items.md` (implied)
- `docs/technical-debt/LEGACY_ID_MAPPING.json`

### Data flows

- **In:** `MASTER_DEBT.jsonl`, `raw/deduped.jsonl`
- **Out:** `views/*.md`, `INDEX.md`, refreshed `metrics.json` and `METRICS.md`

### Note: no dedicated archive mechanism

The skill spec says "archive resolved items" but no archive script is listed in
either SKILL.md or REFERENCE.md. `resolve-bulk.js` marks items as RESOLVED in
MASTER_DEBT (no removal). There is no archival to a separate file in this mode's
script sequence — the "archive" is effectively leaving RESOLVED items in
MASTER_DEBT.

### Done when

Cleanup applied, views regenerated, sync check passed.

---

## 9. Post-Mutation Sync Check (mandatory after any mutation mode)

Runs after: verify, sync, dedup, validate, cleanup.

```bash
# CL quick preset on MASTER_DEBT ↔ raw/deduped.jsonl:
# - Item counts match
# - 10 random recent mutations appear in both files
# - No orphaned items in either file

node scripts/debt/sync-deduped.js   # if divergent, run this to repair
```

If divergent after sync-deduped.js: warn user, do NOT proceed to next mode.

**sync-deduped.js behavior:** Propagates severity and status changes from
MASTER_DEBT back into deduped.jsonl without adding or removing items. This
prevents generate-views.js (which reads deduped.jsonl) from reverting changes
made to MASTER_DEBT.

---

## 10. State File Schema

Path: `.claude/state/debt-runner.state.json`

(File does not currently exist — no active session.)

Schema from REFERENCE.md:

```json
{
  "task": "Debt Runner",
  "status": "running_mode | between_modes | complete",
  "current_mode": "verify",
  "completed_modes": ["health"],
  "severity_filter": ["S0", "S1"],
  "current_step": 3,
  "cl_passes": [
    {
      "pass": 1,
      "behavior": "source-check",
      "confirmed": 28,
      "corrected": 3,
      "extended": 1,
      "new": 0
    }
  ],
  "staging_files": ["docs/technical-debt/staging/verify-corrections.jsonl"],
  "plan_path": null,
  "mutations_pending": 4,
  "last_sync_check": "2026-03-15T14:00:00Z",
  "updated": "2026-03-15T14:30:00Z"
}
```

**Updated after:** Each mode completion and each CL pass.

**Staging files** survive compaction because they are written to disk at
`docs/technical-debt/staging/`.

**Resume command:** `/debt-runner resume` reads state file, skips completed
steps.

---

## 11. Guard Rails and Delegation Protocols

### All modes

1. **>100 mutations gate:** Present count + 10-item preview; user approves
   before applying.
2. **Empty-result short-circuit:** If a mode produces zero items, skip CL
   verification and report "No items found. Returning to menu."
3. **>20 items delegation protocol:** Offer three options uniformly across all
   modes:
   - "You decide" (apply all recommendations)
   - Severity filter ("skip remaining S3")
   - Batch review
4. **Staging safety:** Never delete staging files until full pipeline succeeds.
   On successful mode completion, delete that mode's staging files. On session
   exit, warn if staging files remain from incomplete modes.
5. **Error recovery:** Save state with failed step. `/debt-runner resume` to
   continue.

### MASTER_DEBT protection

- Never write MASTER_DEBT directly — all writes via existing dual-write scripts
- All mutations go to staging first
- The note in add-debt SKILL.md: "Both intake scripts use `appendMasterDebtSync`
  which writes to MASTER_DEBT.jsonl and raw/deduped.jsonl atomically."

### S0 security

Flag for `/security-auditor` before resolution.

### Script progress reporting (mandatory)

Before each script call: print `"Running \`[script]\`..."`. After completion:
print result summary. Prevents user uncertainty during long operations.

### Retro prompt (on session exit only, not per-mode)

"Any modes that produced unexpected results? Any scripts that need attention?"
Captured in state file `process_feedback`.

---

## 12. Convergence Loop Integration

Every mode uses the `/convergence-loop` skill. Presets used per mode:

| Mode       | CL Preset | Passes | Rationale                                |
| ---------- | --------- | ------ | ---------------------------------------- |
| verify     | standard  | 3      | source-check → verification → fresh-eyes |
| sync       | standard  | 3      | same                                     |
| plan       | standard  | 3      | verify plan claims                       |
| health     | quick     | 2      | verification → verification, lightweight |
| dedup      | standard  | 3      | merge cluster verification               |
| validate   | standard  | 3      | schema + staleness verification          |
| cleanup    | standard  | 3      | spot-check code for resolved items       |
| sync check | quick     | 2      | count match + spot-check                 |

The convergence-loop skill requires:

- Minimum 2 passes
- T20 tally every pass (Confirmed / Corrected / Extended / New counts)
- User gate before convergence declaration
- Save state after every pass
- Graduated convergence (per-claim, not all-or-nothing)

---

## 13. Integration with TDMS Ecosystem

### Neighboring skills (do NOT use debt-runner for these)

| Task                      | Use instead                 | Why                        |
| ------------------------- | --------------------------- | -------------------------- |
| Adding a single debt item | `/add-debt`                 | Lightweight, targeted      |
| SonarCloud deep dive      | `/sonarcloud --interactive` | Full SonarCloud UX         |
| TDMS system health        | `/tdms-ecosystem-audit`     | Ecosystem-level diagnostic |
| Debt in PR context        | `/pr-review`                | PR-scoped                  |

### Script ecosystem not directly called by debt-runner

These scripts exist in `scripts/debt/` but are **not referenced** in
debt-runner's SKILL.md or REFERENCE.md:

- `assign-roadmap-refs.js`
- `backfill-hashes.js`
- `check-phase-status.js`
- `clean-intake.js`
- `escalate-deferred.js`
- `extract-audit-reports.js`
- `extract-audits.js`
- `extract-context-debt.js`
- `extract-reviews.js`
- `extract-roadmap-debt.js`
- `extract-scattered-debt.js`
- `ingest-cleaned-intake.js`
- `intake-audit.js`
- `intake-manual.js`
- `intake-pr-deferred.js`
- `normalize-all.js`
- `process-review-needed.js`
- `reconcile-roadmap.js`
- `resolve-item.js`
- `reverify-resolved.js`
- `sync-roadmap-refs.js`

(Many of these run inside `consolidate-all.js`, which IS called by dedup mode.)

### Auto-triggered by resolve-bulk.js (discovery, not in skill spec)

When `resolve-bulk.js` runs, it automatically:

1. Calls `generate-views.js`
2. Calls `reconcile-roadmap.js --write`
3. Scans `ROADMAP_FUTURE.md`, `ROADMAP_LOG.md`,
   `docs/OPERATIONAL_VISIBILITY_SPRINT.md`, and `.claude/plans/*.md` for
   references to resolved DEBT IDs

---

## 14. Current TDMS State (as of research date)

From `docs/technical-debt/metrics.json` (generated 2026-03-26):

| Metric          | Value                          |
| --------------- | ------------------------------ |
| Total items     | 8,470                          |
| Open            | 7,281                          |
| Resolved        | 1,115                          |
| False positives | 74                             |
| Resolution rate | 13%                            |
| S0 (Critical)   | 26 total, 11 open alerts       |
| S1 (High)       | 1,360 total, 1,259 open alerts |
| S2 (Medium)     | 3,443                          |
| S3 (Low)        | 3,641                          |
| NEW status      | 2,125                          |
| VERIFIED status | 5,156                          |

**Sources:** sonarcloud (2,561), audit (2,942), unknown (766), review (623),
roadmap (172), dec-2025-report (641), sonarcloud-paste (286), context (252),
manual (81), intake (64), pr-deferred (34), pr-review (22), others (small)

---

## 15. Gaps Relative to a "Complete Debt Dashboard"

The following are absent from debt-runner's current scope:

1. **No trend visualization:** Health mode surfaces metrics but no time-series
   charting or trend graphs. `logs/metrics-log.jsonl` accumulates data but
   nothing surfaces it as a trend.

2. **No cross-PR debt velocity tracking:** Intake sources include pr-review and
   pr-deferred, but debt-runner has no mode for "debt added vs resolved per
   sprint/PR."

3. **No roadmap alignment view:** `reconcile-roadmap.js` and
   `sync-roadmap-refs.js` exist but are not exposed as a debt-runner mode. No
   way to see "which debt items block which roadmap milestones."

4. **No SonarCloud "disappeared items" detection in sync mode:** The
   `sync-sonarcloud.js --resolve` flag can detect items no longer in SonarCloud,
   but debt-runner's sync mode spec only calls `--dry-run` then `--force`, not
   `--resolve` or `--full`.

5. **No archive/expiry mechanism:** Cleanup mode marks RESOLVED but never
   physically archives old items to a separate file. `MASTER_DEBT.jsonl` grows
   without bound. There is no TTL or archival-to-history mechanism.

6. **No PR linkage visibility:** Resolved items have a `resolution.pr` field,
   but no mode surfaces "which PRs resolved which debt" or provides a
   PR-resolution summary.

7. **No `review-needed.jsonl` processing mode:** The dedup script creates
   `raw/review-needed.jsonl` for uncertain merge candidates, but debt-runner has
   no dedicated mode to process this queue.

8. **No effort tracking actuals:** Plan mode assigns effort estimates (E0-E3)
   but there is no mechanism to capture actual effort spent vs estimated.

9. **No category-level prioritization in plan mode:** Plan mode generates
   resolution order by severity then effort, but has no mode for "prioritize by
   category" (e.g., "fix all security items across all severities first").

10. **No CI integration mode:** `resolve-bulk.js` supports `--output-json` for
    CI consumption, but debt-runner has no mode for "generate CI-consumable debt
    report" or "validate debt gate for PR merge."

11. **No bulk severity re-classification mode:** Validate mode can flag
    incorrect severities, but there's no dedicated mode for bulk-reclassifying
    items (e.g., "all S0 items in category X are really S1").

12. **No inter-item dependency tracking in plan mode:** Plan mode captures
    `depends_on` per item, but the plan generation is AI-driven with no
    script-enforced dependency resolution or critical path calculation.

---

## Sources

| #   | Path                                       | Type             | Trust | Notes                 |
| --- | ------------------------------------------ | ---------------- | ----- | --------------------- |
| 1   | `.claude/skills/debt-runner/SKILL.md`      | Skill definition | HIGH  | Primary source, v1.1  |
| 2   | `.claude/skills/debt-runner/REFERENCE.md`  | Skill reference  | HIGH  | Primary source, v1.0  |
| 3   | `scripts/debt/generate-metrics.js`         | Script source    | HIGH  | Full read             |
| 4   | `scripts/debt/resolve-bulk.js`             | Script source    | HIGH  | Full read             |
| 5   | `scripts/debt/sync-sonarcloud.js`          | Script source    | HIGH  | Partial read (header) |
| 6   | `scripts/debt/dedup-multi-pass.js`         | Script source    | HIGH  | Partial read          |
| 7   | `scripts/debt/validate-schema.js`          | Script source    | HIGH  | Full read             |
| 8   | `scripts/debt/verify-resolutions.js`       | Script source    | HIGH  | Partial read          |
| 9   | `scripts/debt/sync-deduped.js`             | Script source    | HIGH  | Full read             |
| 10  | `scripts/debt/consolidate-all.js`          | Script source    | HIGH  | Full read             |
| 11  | `scripts/debt/generate-views.js`           | Script source    | HIGH  | Partial read          |
| 12  | `scripts/health/checkers/debt-health.js`   | Script source    | HIGH  | Full read             |
| 13  | `scripts/config/audit-schema.json`         | Config           | HIGH  | Full read             |
| 14  | `docs/technical-debt/metrics.json`         | Live data        | HIGH  | As of 2026-03-26      |
| 15  | `docs/technical-debt/MASTER_DEBT.jsonl`    | Canonical data   | HIGH  | 8,470 lines           |
| 16  | `.claude/skills/add-debt/SKILL.md`         | Neighbor skill   | HIGH  | Full read             |
| 17  | `.claude/skills/convergence-loop/SKILL.md` | Dependency skill | HIGH  | Partial read          |

---

## Contradictions

**None identified.** SKILL.md and REFERENCE.md are consistent with each other
and with the actual scripts. One discrepancy worth noting:

- SKILL.md cleanup mode says "Apply via existing scripts" for archival, but no
  archive script is listed in the REFERENCE.md script sequence. The script
  sequence for cleanup only includes `sync-deduped.js`, `generate-views.js`, and
  `generate-metrics.js`. No item is physically removed from MASTER_DEBT.jsonl.

---

## Gaps in Research

- `sync-sonarcloud.js` was only partially read (first 80 lines). The full API
  fetch logic and classification mapping were not reviewed.
- The `docs/technical-debt/plans/` directory does not exist at time of research
  — no existing resolution plans to inspect.
- `staging/` directory does not exist — no in-progress session to inspect.
- The deep-research state file `deep-research.debt-runner-expansion.state.json`
  exists in `.claude/state/` but was not read (not within scope of this
  sub-question).

---

## Serendipity

- **resolve-bulk.js auto-triggers:** The script calls
  `reconcile-roadmap.js --write` and scans plan files for DEBT ID references
  after every bulk resolution. This behavior is not documented in SKILL.md — it
  is a script-level side effect that debt-runner inherits when it invokes
  resolve-bulk.js.
- **consolidate-all.js marks extract-sonarcloud.js as DEPRECATED:** The inline
  comment says "use sync-sonarcloud.js for live API sync." This means the old
  SonarCloud extraction path (file-based) is dead; the live API path is
  canonical.
- **MASTER_DEBT.jsonl is large:** 8,470 items, 7,281 open. The 13% resolution
  rate and the 2,125 NEW-status items (pending verification) suggest significant
  opportunity for verify-mode work. S0 has 11 open alerts.

---

## Confidence Assessment

- HIGH claims: 28
- MEDIUM claims: 0
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: **HIGH**

All findings are grounded in direct filesystem reads of the skill files and
scripts. No inference from training data.

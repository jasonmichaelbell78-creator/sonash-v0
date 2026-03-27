# Findings: Verification and Resolution Systems for Technical Debt

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-26
**Sub-Question IDs:** SQ-7

---

## Key Findings

### 1. Resolution Scripts

#### 1a. resolve-item.js — Single Item Resolution [CONFIDENCE: HIGH]

**What it does:** Resolves or false-positive-marks a single DEBT-XXXX item by
ID. Mutates MASTER_DEBT.jsonl via `writeMasterDebtSync` (atomic write through
`../lib/safe-fs`). FALSE_POSITIVE items are removed from MASTER_DEBT and
appended to `FALSE_POSITIVES.jsonl`.

**Side effects (all unconditional unless dry-run):**

1. Calls `sync-deduped.js --apply` — propagates status/severity changes from
   MASTER_DEBT into `raw/deduped.jsonl`. This is a silent, fire-and-forget
   execFileSync call wrapped in try/catch that swallows errors.
2. Calls `generate-views.js` — regenerates all five markdown views (INDEX.md,
   by-severity.md, by-category.md, by-status.md, verification-queue.md).
3. Calls `reconcile-roadmap.js --write` — updates ROADMAP.md with current debt
   state.
4. Scans plan files for references to the resolved DEBT ID: `ROADMAP_FUTURE.md`,
   `ROADMAP_LOG.md`, `docs/OPERATIONAL_VISIBILITY_SPRINT.md`, and all `*.md`
   files under `.claude/plans/`.

**Automation level:** Manual — requires explicit CLI invocation with a DEBT ID.
No automated triggers except when called by CI (resolve-debt.yml calls
resolve-bulk.js, not resolve-item.js).

**Coverage:** 1 item per invocation. 14 total entries in the resolution log as
of 2026-03-26, confirming very limited actual use.

**Gaps:**

- sync-deduped.js failure is silently swallowed (try/catch with empty catch). If
  deduped.jsonl drifts from MASTER_DEBT, there is no user notification.
- No status validation: resolve-item.js will resolve an item that is still in
  NEW status (only resolve-bulk.js with `--eligible-only` blocks NEW items from
  CI resolution).
- No PR verification: `--pr` accepts any positive integer with no validation
  that the PR actually exists or actually fixed the issue.

---

#### 1b. resolve-bulk.js — Bulk Resolution [CONFIDENCE: HIGH]

**What it does:** Resolves multiple DEBT IDs in a single atomic write to
MASTER_DEBT.jsonl. Can accept IDs from CLI args or from a file (`--file`).

**Key behaviors:**

- `--eligible-only` flag filters to statuses in
  `ELIGIBLE_STATUSES = ["VERIFIED", "IN_PROGRESS", "TRIAGED"]`. Items with NEW
  status are skipped. This is the CI safety gate that prevents auto-resolving
  newly ingested items that happen to be mentioned in a PR.
- `--output-json` writes a resolution summary JSON for CI consumption (used by
  resolve-debt.yml).
- Does NOT call sync-deduped.js (unlike resolve-item.js). This is an asymmetry —
  single-item resolution always syncs deduped; bulk resolution never does.

**Side effects (all unconditional unless dry-run):**

1. Calls `generate-views.js` — same as resolve-item.js.
2. Calls `reconcile-roadmap.js --write` — same as resolve-item.js.
3. Scans ROADMAP_FUTURE.md, ROADMAP_LOG.md, OPERATIONAL_VISIBILITY_SPRINT.md,
   and `.claude/plans/*.md` for references to resolved IDs.

**Automation level:** Semi-automated — called by CI workflow on PR merge. Manual
use also supported.

**Coverage:** Can process any number of items; CI use is gated on `Resolves:`
lines in PR body. The 13% resolution rate from Wave 1 data reflects that only ~1
in 8 items that could be resolved are actually getting resolved through this
path.

**Gaps:**

- TRIAGED status is in ELIGIBLE_STATUSES but is NOT in the schema's
  `validStatuses` array
  (`["NEW", "VERIFIED", "FALSE_POSITIVE", "IN_PROGRESS", "RESOLVED"]`). A
  TRIAGED item would pass the eligibility check but fail schema validation — a
  schema/code contradiction.
- No sync-deduped.js call after bulk writes (unlike resolve-item.js), meaning
  deduped.jsonl can drift after CI resolution events.

---

#### 1c. reverify-resolved.js — Re-verify Previously Resolved Items [CONFIDENCE: HIGH]

**What it does:** A specialized one-time audit script, not part of the regular
pipeline. It reads a pre-existing `resolution-audit-report.json` file to get a
list of flagged IDs, then applies a manually curated hardcoded classification
(falseAlarms and genuinelyUnresolved sets defined in the source code itself) to
re-open or re-resolve items.

**How it works:**

- Reads the `step4_audit_resolved.possibly_unresolved_details` array from the
  audit report.
- Classifies items into: FALSE_ALARM (keep RESOLVED), FILE_MISSING (keep
  RESOLVED), GENUINELY_UNRESOLVED (revert to VERIFIED), ALREADY_VERIFIED.
- The classification lists are **hardcoded in the script** — 32 false alarms and
  28 genuinely unresolved items, determined by manual codebase inspection on
  2026-02-21.
- Writes changes to both MASTER_DEBT.jsonl and raw/deduped.jsonl atomically
  (two-file staged rename).

**Automation level:** Manual only — requires explicit `--write` flag. Dry-run is
default.

**Coverage:** One-time use only for the 62 items from one specific audit batch.
Not a reusable verification mechanism; the classification is baked into the
source.

**Gaps:**

- This script is not reusable — it contains a specific dated set of IDs. Future
  re-verification rounds require a new script or significant refactoring.
- Depends on a specific audit report JSON being present at a hardcoded path.

---

### 2. Verification Scripts

#### 2a. verify-resolutions.js — Status Audit [CONFIDENCE: HIGH]

**What it does:** A three-step audit of MASTER_DEBT.jsonl:

- **Step 3 (NEW items):** Classifies each NEW item as `promoted_to_verified`,
  `needs_triage`, or `no_file_ref`. Promotion criteria: file exists AND line
  number (if present) does not exceed file length. This is the only automated
  mechanism for NEW → VERIFIED transitions.
- **Step 4 (RESOLVED items):** Audits each RESOLVED item by checking: does the
  file still exist? If yes, extracts 2-3 keywords from the title and checks if
  any keyword appears within ±10 lines of the recorded line number. If keywords
  found near original line → flags as `possibly_unresolved`. If file deleted →
  `confirmed_resolved`. If no keywords extractable → `unable_to_verify`.
- **Step 5 (FALSE_POSITIVE items):** Same keyword-proximity check on FP items to
  detect possible misclassifications.

**Writes when `--write` is used:**

- Updates MASTER_DEBT.jsonl (status field on promoted items set to VERIFIED,
  `verified_by` set to "verify-resolutions-script").
- Updates raw/deduped.jsonl with same changes (by ID and content_hash).
- Writes audit report to
  `docs/technical-debt/logs/resolution-audit-report.json`.

**Default mode:** `--dry-run` (safe to run without `--write`).

**Automation level:** Manual — no automated triggers found.

**Coverage:** Covers ALL items by status. However, the keyword-proximity method
has significant accuracy limitations (see Gaps).

**Gaps:**

- Keyword proximity is a weak proxy for resolution verification. A comment
  mentioning the old issue name at the same line would produce a false "possibly
  unresolved" flag. This was confirmed by reverify-resolved.js finding 32 false
  alarms out of 62 flagged items (52% false positive rate on the "possibly
  unresolved" classification).
- Step 3 promotion only checks file existence and line count — it does NOT
  verify that the actual issue still exists. An item referencing a file that
  exists but has already been fixed would still be promoted to VERIFIED rather
  than RESOLVED.
- `unable_to_verify` items (no file reference, or no keywords extractable from
  title) receive no disposition — they remain in their current status
  indefinitely.
- The 2,125-item verification queue noted in Wave 1 context consists primarily
  of these NEW items awaiting Step 3 promotion — there is no SLA or age-based
  escalation for stale NEW items.

---

#### 2b. validate-schema.js — Schema Validation [CONFIDENCE: HIGH]

**What it does:** Validates MASTER_DEBT.jsonl against the schema defined in
`scripts/config/audit-schema.json`. Operates at the field level.

**Validation rules:**

- **Errors (exit code 1):** Missing required fields (`id`, `source_id`, `title`,
  `severity`, `category`, `status`); invalid ID format (must match
  `DEBT-\d{4,}`); invalid category, severity, type, or status values; duplicate
  IDs; JSON parse errors.
- **Warnings (exit code 0 unless `--strict`):** Non-standard `source_id` prefix;
  invalid effort value; invalid content_hash format; placeholder file paths
  ("multiple", "various", "n/a", etc.); invalid line numbers; bad date format;
  missing `content_hash`; S0/S1 items missing `verification_steps`; invalid
  `source_pr`; duplicate content_hash (possible duplicate item);
  enhancement-specific field validation (counter_argument, confidence 0-100,
  impact I0-I3).

**`--staged-only` mode:** Reads git diff to find changed lines and only
validates those lines. Used in pre-commit hook context.

**Automation level:** Semi-automated — runs as part of pre-commit hooks (via
`--staged-only`). Full validation is manual.

**Coverage:** 100% of lines in the target file. Does NOT validate
FALSE_POSITIVES.jsonl or deduped.jsonl.

**What it catches vs. false positives:**

- Real issues: duplicate IDs, invalid statuses, missing required fields.
- False positive risk: placeholder file path check may flag legitimate items
  that genuinely span multiple files. content_hash duplicate warning may flag
  merged items that intentionally share a hash.

---

### 3. Deduplication

#### 3a. dedup-multi-pass.js — Six-Pass Deduplication [CONFIDENCE: HIGH]

**Input:** `docs/technical-debt/raw/normalized-all.jsonl` **Outputs:**
`raw/deduped.jsonl`, `logs/dedup-log.jsonl`, `raw/review-needed.jsonl`

**Six passes:**

| Pass | Type         | Method                                              | Threshold | Action                                      |
| ---- | ------------ | --------------------------------------------------- | --------- | ------------------------------------------- |
| 0    | Parametric   | Same file + title with numbers stripped to `#`      | Exact     | Merge (skip S0/S1, flag for review instead) |
| 1    | Exact hash   | content_hash equality                               | Exact     | Merge                                       |
| 2    | Near match   | Same file + line ±5 + title similarity >80%         | >80%      | Merge                                       |
| 3    | Semantic     | Same file + title similarity >90%                   | >90%      | Merge AND flag for review                   |
| 4    | Cross-source | SonarCloud ↔ audit, same file, line ±10, title >70% | >70%      | Merge (audit item wins)                     |
| 5    | Systemic     | Same title across ≥3 files                          | N/A       | Annotate only, no removal                   |

**Merge behavior:** `mergeItems()` prefers longer description/recommendation,
keeps more severe severity, tracks `merged_from` source IDs.

**Dry-run vs. force modes:**

- The script has no `--dry-run` or `--force` flags in the source code. It always
  runs all passes and writes output files. The SKILL.md references `--dry-run`
  and `--force` flags but these do not exist in the actual script. The script
  runs to completion unconditionally.
- Dry-run simulation is available only through debt-runner's orchestration
  (writing to staging files before calling the script).

**False positive risk by pass:**

- Pass 0: LOW — numeric stripping is well-defined, S0/S1 items skip to review
  queue.
- Pass 1: NONE — exact hash match is deterministic.
- Pass 2: MEDIUM — line ±5 with 80% title similarity could merge different
  issues in the same area of a large file.
- Pass 3: MEDIUM-HIGH — 90% similarity is aggressive; semantic matches are
  automatically sent to review-needed.jsonl, providing a human review backstop.
- Pass 4: MEDIUM — 70% title similarity plus ±10 line tolerance for cross-source
  matches is loose. The SONAR_TO_CATEGORY mapping is minimal (only 8 rules),
  limiting coverage.
- Pass 5: NONE — annotation only, no removal.

**Items without content_hash:** Automatically pushed to `review-needed.jsonl`
with reason "missing_content_hash — cannot deduplicate safely". Items proceed
through the pipeline but may duplicate with hash-matched items.

---

### 4. Sync/Reconciliation

#### 4a. sync-deduped.js — MASTER_DEBT → deduped.jsonl Propagation [CONFIDENCE: HIGH]

**What it does:** Propagates severity and status changes from MASTER_DEBT.jsonl
back into `raw/deduped.jsonl` using content_hash as the join key. Only changes
severity and status fields — does not add or remove items.

**The core problem it solves:** generate-views.js reads from deduped.jsonl and
(in `--ingest` mode) regenerates MASTER_DEBT.jsonl. If severity/status edits are
made to MASTER_DEBT directly (via resolve-item.js, resolve-bulk.js), and then
the consolidation pipeline runs again, those edits get overwritten unless
deduped.jsonl was first updated.

**Default mode:** `--dry-run` (exit code 1 if changes needed, 0 if no changes).
**`--apply` mode:** Writes changes to deduped.jsonl.

**Called automatically by:** resolve-item.js (both RESOLVED and FALSE_POSITIVE
paths) via execFileSync. NOT called by resolve-bulk.js — an asymmetry that means
CI-triggered bulk resolutions leave deduped.jsonl out of sync until manually
reconciled.

**Coverage:** Only items that share a content_hash between MASTER_DEBT and
deduped.jsonl. Items that exist in one file but not the other are ignored.

---

#### 4b. consolidate-all.js — Full Pipeline Orchestrator [CONFIDENCE: HIGH]

**What it does:** Runs the entire debt ingestion pipeline in sequence:

1. `extract-sonarcloud.js` (marked DEPRECATED, skipped if missing)
2. `extract-audits.js` (extracts from audit JSONL files)
3. `extract-reviews.js` (extracts from review/aggregation findings)
4. `normalize-all.js` (unifies schema, generates content hashes)
5. `dedup-multi-pass.js` (deduplication)
6. `generate-views.js --ingest` (assigns DEBT IDs, writes MASTER_DEBT, generates
   views)

**"Consolidate" meaning:** This is the intake pipeline for new items — it brings
external sources (SonarCloud, audits, reviews) into MASTER_DEBT. It does NOT
resolve, archive, or clean up items.

**Automation level:** Manual — no CI trigger. Requires deliberate invocation.

**Risk:** Running consolidate-all.js while unsent status edits exist in
MASTER_DEBT (but not yet propagated to deduped.jsonl via sync-deduped.js) will
result in those edits being overwritten when generate-views.js --ingest
regenerates MASTER_DEBT from deduped.jsonl. The session #179 reference in
resolve-item.js comments confirms this has caused data loss previously.

---

#### 4c. normalize-all.js — Schema Normalization [CONFIDENCE: HIGH]

**What it does:** Reads all `*.jsonl` files from `docs/technical-debt/raw/`
(excluding normalized-all.jsonl itself), applies schema normalization to each
item, and writes to `normalized-all.jsonl`.

**Normalization applied:**

- Validates category, severity, type, status, effort against allowed values;
  falls back to defaults (`code-quality`, `S2`, `code-smell`, `NEW`, `E1`).
- Normalizes file paths (stripRepoRoot).
- Parses line numbers from strings to integers; invalid values default to 0.
- Truncates titles to 500 characters.
- Generates deterministic content_hash for deduplication (via
  `generate-content-hash.js`).
- Preserves optional fields: original_id, rule, sonar_key, evidence, sources,
  merged_from, pr_bucket, consensus_score, dependencies, roadmap_status.

**Automation level:** Manual — part of consolidate-all.js pipeline.

---

### 5. CI Resolution

#### 5a. resolve-debt.yml — Automated CI Resolution [CONFIDENCE: HIGH]

**Trigger:** PR merge to `main` branch only (pull_request closed +
merged==true).

**Workflow:**

1. Extracts DEBT IDs from PR body using grep — **only from lines matching
   `^\s*resolves\s*:` (case-insensitive)**. IDs mentioned anywhere else in the
   PR body are counted for summary context but do NOT trigger resolution.
2. If no IDs on `Resolves:` lines: workflow reports "No DEBT IDs on Resolves:
   lines" and exits. If IDs were mentioned elsewhere, it adds a hint about
   proper format.
3. If IDs found: installs Node.js 22 and npm dependencies, then calls:
   ```
   node scripts/debt/resolve-bulk.js
     --pr <PR_NUMBER>
     --eligible-only
     --output-json /tmp/resolve-summary.json
     <DEBT_IDS...>
   ```
4. Commits changed `docs/technical-debt/` files back to main with message
   `chore(tdms): resolve debt items from PR #N [skip ci]`.
5. Uses `git pull --rebase origin main` before push to handle race conditions.
6. Outputs a step summary table showing resolved/already-resolved/ineligible/
   not-found counts.

**`--eligible-only` effect:** Items with NEW status are skipped even if listed
on a `Resolves:` line. Only VERIFIED, IN_PROGRESS, or TRIAGED items (note:
TRIAGED is not a valid schema status) are auto-resolved.

**Security:** PR body passed via environment variable (not shell interpolation)
to prevent S7630 script injection vulnerability.

**Coverage:** Only PRs merged to main that include correctly formatted
`Resolves:` lines. Does not cover fixes that were committed without a PR, or PRs
where developers forget to add the `Resolves:` line.

**Gaps:**

- No sync-deduped.js call after resolution — deduped.jsonl diverges from
  MASTER_DEBT after every CI resolution run.
- No reconcile-roadmap.js call — ROADMAP.md is not updated by CI (only by manual
  resolve-item.js and resolve-bulk.js calls).
- TRIAGED status is in ELIGIBLE_STATUSES but invalid per audit-schema.json. Any
  item manually assigned TRIAGED status would pass CI eligibility check but fail
  schema validation.

---

### 6. False Positives

#### 6a. FALSE_POSITIVES.jsonl — FP Tracking [CONFIDENCE: HIGH]

**File location:** `docs/technical-debt/FALSE_POSITIVES.jsonl` **Current
count:** 6 entries (small file — likely partially tracked)

**Content structure:** Full debt item objects with `status: "FALSE_POSITIVE"`
and a `resolution` object containing `type: "false_positive"`, `reason`, and
`date`.

**FP workflow — two paths:**

**Path 1 (manual via resolve-item.js):**

- User runs `resolve-item.js DEBT-XXXX --false-positive --reason "..."`
- Item is removed from MASTER_DEBT.jsonl and appended to FALSE_POSITIVES.jsonl
- sync-deduped.js is called (silently, may fail)
- Logged in resolution-log.jsonl

**Path 2 (via verify-resolutions.js --write):**

- Step 5 classifies items as `confirmed_fp` or `possibly_misclassified`
- confirmed_fp items stay in place; possibly_misclassified items are flagged
- NOTE: verify-resolutions.js does NOT move items to FALSE_POSITIVES.jsonl — it
  only reports. Actual FALSE_POSITIVE status in MASTER_DEBT is set by
  resolve-item.js.

**What happens to FP items in the pipeline:**

- validate-schema.js Step 5 audits FALSE_POSITIVE items using keyword proximity,
  flagging possibly_misclassified items.
- dedup-multi-pass.js processes deduped.jsonl which does not include FP items
  (they were removed from MASTER_DEBT, which feeds deduped via ingest).
- FALSE_POSITIVES.jsonl itself is validated by Step 5 of verify-resolutions.js.

**Gaps:**

- Only 6 items in FALSE_POSITIVES.jsonl is suspiciously low for a system with
  2,125+ items in the verification queue. The reverify-resolved.js script found
  32 false alarms among just 62 audited items — suggesting the true FP rate is
  far higher than the 6-item file reflects.
- FALSE_POSITIVES.jsonl has no schema validation run against it (validate-
  schema.js defaults to MASTER_DEBT.jsonl only).
- No automated process surfaces FP candidates to users — all FP identification
  is manual or via the keyword-proximity heuristic in verify-resolutions.js.

---

### 7. Status Lifecycle

#### 7a. Full Status Flow [CONFIDENCE: HIGH]

The valid statuses per `audit-schema.json` are: `NEW`, `VERIFIED`,
`FALSE_POSITIVE`, `IN_PROGRESS`, `RESOLVED`

**NEW → VERIFIED:**

- **Mechanism:** verify-resolutions.js `--write` (automated check: file exists +
  line count valid). Sets `verified_by: "verify-resolutions-script"`.
- **Automation level:** Semi-automated (script must be manually invoked, but the
  promotion decision is automated by file existence check).
- **Gap:** No human review required for promotion. A NEW item pointing to any
  existing file gets promoted to VERIFIED regardless of whether the issue
  actually exists.

**VERIFIED → IN_PROGRESS:**

- **Mechanism:** Not found in any script. There is no script that transitions
  items from VERIFIED to IN_PROGRESS.
- **Gap: This transition has no implementation.** IN_PROGRESS appears in the
  schema, in ELIGIBLE_STATUSES (for CI resolution), and in views/metrics, but no
  script sets it. Items presumably get this status set manually or via direct
  JSONL edits.

**IN_PROGRESS → RESOLVED:**

- **Mechanism:** resolve-item.js (manual) or resolve-bulk.js (manual or CI).
  This is the only CI-automated transition.
- **Automation level:** CI automated via resolve-debt.yml for items on
  `Resolves:` PR lines.

**VERIFIED → RESOLVED:**

- **Mechanism:** Same as IN_PROGRESS → RESOLVED. resolve-bulk.js with
  `--eligible-only` treats VERIFIED as eligible. CI workflow uses
  `--eligible-only`, so VERIFIED items CAN be auto-resolved by CI.
- **Gap:** No intermediate IN_PROGRESS step is required. A VERIFIED item can be
  resolved by CI without any human confirming work was actually done.

**ANY STATUS → FALSE_POSITIVE:**

- **Mechanism:** resolve-item.js `--false-positive --reason "..."` (manual
  only). Removes item from MASTER_DEBT, appends to FALSE_POSITIVES.jsonl.
- **Automation level:** Manual only.

**RESOLVED → VERIFIED (reopening):**

- **Mechanism:** reverify-resolved.js `--write` (for items flagged by audit
  report). Sets `resolution_note` with re-open context. Touches both MASTER_DEBT
  and deduped.jsonl.
- **Automation level:** Manual — requires prior audit report + explicit --write
  flag.

**Summary of missing transitions:**

- VERIFIED → IN_PROGRESS: No implementation
- NEW → FALSE_POSITIVE: No direct path (must go through resolve-item.js which
  requires manual invocation and reason text)
- NEW → RESOLVED: Blocked by `--eligible-only` in CI; allowed in manual
  resolve-item.js (no status check)

---

### 8. Convergence Loop Integration

#### 8a. How debt-runner Uses Convergence Loops [CONFIDENCE: HIGH]

The debt-runner SKILL.md (v1.1, 2026-03-15) specifies convergence-loop (CL)
verification at every mode. CL is NOT called by any script directly — it is an
AI orchestration layer called by the debt-runner skill during interactive
sessions.

**CL preset by mode:**

| Mode     | CL Preset               | Focus                                                          |
| -------- | ----------------------- | -------------------------------------------------------------- |
| verify   | standard (S0: thorough) | File existence, issue presence, fixed-but-not-marked           |
| sync     | standard                | Severity classification, dedup accuracy, file paths            |
| plan     | standard                | File paths exist, items not resolved, effort estimates         |
| health   | quick                   | Item counts match, severity distribution, stale identification |
| dedup    | standard                | True duplicates, merge target quality, S0/S1 absorption        |
| validate | standard                | Schema violations real vs FP, stale items genuine              |
| cleanup  | standard                | Resolved items genuinely resolved, FPs genuinely false         |

**Post-mutation sync check (all modes):** After any mode that mutates
MASTER_DEBT, debt-runner runs CL quick preset verifying: MASTER_DEBT item count
= deduped.jsonl item count, 10 random recent mutations appear in both files, no
orphaned items.

**Staging safety:** debt-runner writes proposed changes to
`docs/technical-debt/staging/` before applying. As of 2026-03-26, the staging
directory does not exist, meaning no in-progress debt-runner sessions are
pending.

**Delegation protocol:** For any mode presenting >20 items for decision,
debt-runner offers: "You decide" (apply all recommendations), severity filter,
or batch review.

**CL presets not formally defined per-mode in convergence-loop SKILL:** The CL
behaviors (source-check, discovery, verification, fresh-eyes) and presets
(quick, standard, thorough) are defined in convergence-loop/REFERENCE.md. The
debt-runner REFERENCE.md defines slicing templates (e.g., S0 items as one slice,
S1 items by category as another) but the actual multi-pass structure is
inherited from convergence-loop.

---

## Sources

| #   | Path                                          | Type        | Trust | Notes      |
| --- | --------------------------------------------- | ----------- | ----- | ---------- |
| 1   | scripts/debt/resolve-item.js                  | Source code | HIGH  | Full read  |
| 2   | scripts/debt/resolve-bulk.js                  | Source code | HIGH  | Full read  |
| 3   | scripts/debt/reverify-resolved.js             | Source code | HIGH  | Full read  |
| 4   | scripts/debt/verify-resolutions.js            | Source code | HIGH  | Full read  |
| 5   | scripts/debt/validate-schema.js               | Source code | HIGH  | Full read  |
| 6   | scripts/debt/dedup-multi-pass.js              | Source code | HIGH  | Full read  |
| 7   | scripts/debt/sync-deduped.js                  | Source code | HIGH  | Full read  |
| 8   | scripts/debt/consolidate-all.js               | Source code | HIGH  | Full read  |
| 9   | scripts/debt/normalize-all.js                 | Source code | HIGH  | Full read  |
| 10  | .github/workflows/resolve-debt.yml            | CI config   | HIGH  | Full read  |
| 11  | docs/technical-debt/FALSE_POSITIVES.jsonl     | Data        | HIGH  | 6 entries  |
| 12  | scripts/config/audit-schema.json              | Config      | HIGH  | Full read  |
| 13  | .claude/skills/debt-runner/SKILL.md           | Skill doc   | HIGH  | Full read  |
| 14  | .claude/skills/debt-runner/REFERENCE.md       | Reference   | HIGH  | Full read  |
| 15  | docs/technical-debt/logs/resolution-log.jsonl | Log data    | HIGH  | 14 entries |

---

## Contradictions

**1. TRIAGED status contradiction:** `resolve-bulk.js` line 34 defines
`ELIGIBLE_STATUSES = ["VERIFIED", "IN_PROGRESS", "TRIAGED"]`.
`scripts/config/audit-schema.json` defines
`validStatuses = ["NEW", "VERIFIED", "FALSE_POSITIVE", "IN_PROGRESS", "RESOLVED"]`.
TRIAGED is in the CI eligibility check but not in the canonical schema. Any item
manually assigned TRIAGED status would pass CI resolution eligibility but fail
schema validation. No scripts that write MASTER_DEBT were found to ever set
status to TRIAGED.

**2. dedup-multi-pass.js dry-run flags:** `debt-runner/REFERENCE.md` documents
`node scripts/debt/dedup-multi-pass.js --dry-run` and `--force` as valid
invocations. The actual script source has no `--dry-run` or `--force` argument
parsing. The script always executes all passes and writes all output files
unconditionally. The dry-run behavior described in REFERENCE.md does not exist
in the script.

**3. sync-deduped.js call asymmetry:** `resolve-item.js` calls
`sync-deduped.js --apply` after every resolution (single item).
`resolve-bulk.js` does NOT call `sync-deduped.js` after bulk resolution. CI uses
resolve-bulk.js. Result: every CI-triggered resolution leaves deduped.jsonl out
of sync with MASTER_DEBT until manually reconciled.

**4. In-scope status vs. schema coverage:** `IN_PROGRESS` is a valid schema
status, recognized by generate-metrics.js and generate-views.js, and is in
ELIGIBLE_STATUSES for CI resolution. However, no script was found that
transitions items FROM any status TO IN_PROGRESS. The transition path exists
downstream (IN_PROGRESS → RESOLVED) but the upstream path (VERIFIED →
IN_PROGRESS) has no implementation.

---

## Gaps

1. **IN_PROGRESS transition is unimplemented:** No script sets status to
   IN_PROGRESS. It is a valid status but a dead-end in the workflow unless set
   via direct JSONL editing.

2. **Verification queue has no SLA or escalation:** The 2,125-item verification
   queue has no age-based processing, priority queue, or automated escalation.
   Items can remain NEW indefinitely.

3. **FALSE_POSITIVES.jsonl is under-populated:** Only 6 entries exist despite
   evidence (reverify-resolved.js) that the true FP rate in the resolved backlog
   is ~52% for certain audit-generated items. Most FPs are likely either
   silently discarded or never flagged.

4. **No CI sync after resolution:** resolve-debt.yml does not call
   sync-deduped.js or reconcile-roadmap.js. Post-CI state leaves two files
   diverged (MASTER_DEBT vs. deduped.jsonl) and one stale (ROADMAP.md).

5. **reverify-resolved.js is one-time use:** The script contains hardcoded item
   IDs for a specific 2026-02-21 audit batch. Future re-verification rounds have
   no reusable tooling for this kind of systematic re-opening.

6. **dedup-multi-pass.js has no documented false-positive rate:** The
   review-needed.jsonl output captures semantic matches and high-severity
   parametric candidates, but there is no tooling to measure what percentage of
   merge decisions were wrong.

7. **verify-resolutions.js NEW→VERIFIED promotion does not check issue
   existence:** File presence is necessary but not sufficient. A file refactored
   since the item was recorded would still pass the promotion check.

8. **FALSE_POSITIVES.jsonl has no schema validation run against it by default:**
   validate-schema.js targets MASTER_DEBT.jsonl unless `--file` is specified. FP
   items could accumulate schema violations undetected.

---

## Serendipity

**dedup-multi-pass.js --dry-run/--force mismatch:** The REFERENCE.md
instructions tell users to run `dedup-multi-pass.js --dry-run` before committing
to dedup operations. This flag does not exist. Any debt-runner session that
follows the REFERENCE.md script sequence for the Dedup mode would execute dedup
immediately and unconditionally on step 1. This could result in unexpected
merges being applied without the user's prior review.

**Resolution log has only 14 entries:** Given a system with 2,125+ items in the
verification queue and a stated 13% resolution rate, only 14 log entries since
the system began suggests either: (a) most resolutions were applied via
mechanisms that don't write to resolution-log.jsonl (direct JSONL edits, or the
CI workflow using resolve-bulk.js which does log but may not have been used
much), or (b) many "resolved" items are actually from the initial ingestion
pipeline marking them resolved, not from explicit resolution events. The most
recent entry (2026-03-26) resolves DEBT-45615 with no PR number, suggesting
MASTER_DEBT has at least 45,615 total IDs ever assigned.

**consolidate-all.js can silently overwrite manual resolutions:** If run after
resolve-bulk.js but before sync-deduped.js, the generate-views.js --ingest step
will read from deduped.jsonl (which still shows items as non-RESOLVED) and
overwrite MASTER_DEBT.jsonl, undoing the resolutions. This is the "MASTER_DEBT
overwrite hazard" referenced in memory. The sync-deduped.js call in
resolve-item.js exists specifically to prevent this, but resolve-bulk.js (used
by CI) does not include this guard.

---

## Confidence Assessment

- HIGH claims: 16
- MEDIUM claims: 0
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

All findings are based on direct source code and configuration file reads. No
training data or external sources were used.

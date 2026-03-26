# Findings: TDMS Scripts Documentation (scripts/debt/ — Scripts 1–15)

**Searcher:** deep-research-searcher
**Profile:** codebase
**Date:** 2026-03-26
**Sub-Question IDs:** SQ2a

---

## Key Findings

All 15 scripts were read directly from the filesystem. Findings are HIGH
confidence — ground truth from source code.

---

## Script Reference

### 1. assign-roadmap-refs.js

**Purpose:** Bulk-assigns `roadmap_ref` values to every item in MASTER_DEBT.jsonl
using a two-tier rule: category takes priority, then file path pattern for
`code-quality` items.

**Input:**
- `docs/technical-debt/MASTER_DEBT.jsonl` (read directly)

**Output:**
- `docs/technical-debt/MASTER_DEBT.jsonl` (overwritten via `writeMasterDebtSync`)
- `docs/technical-debt/MASTER_DEBT.jsonl.bak` (backup copy before write)
- `docs/technical-debt/roadmap-assignment-report.md` (optional, with `--report`)

**CLI flags:**
- `--dry-run` — show what would change, no writes
- `--verbose` — log each item's assignment
- `--report` — write the markdown assignment report

**Who/what calls it:**
- Manual / ad-hoc use only (no hook, no CI reference found)
- The `main()` console suggests running `validate-schema.js` → `generate-views.js` → `generate-metrics.js` after

**Dependencies on other scripts:** None at runtime. Uses `../lib/safe-fs` (`writeMasterDebtSync`, `safeWriteFileSync`).

**MASTER_DEBT modification:** YES — writes directly via `writeMasterDebtSync` (no staging).

**Mapping rules summary:**
| Category | File Pattern | roadmap_ref |
|----------|-------------|-------------|
| security | any | Track-S |
| performance | any | Track-P |
| process | any | Track-D |
| refactoring | any | M2.3-REF |
| documentation | any | M1.5 |
| code-quality | scripts/, .claude/ | Track-E |
| code-quality | .github/ | Track-D |
| code-quality | tests/ | Track-T |
| code-quality | functions/ | M2.2 |
| code-quality | components/, lib/, app/, hooks/ | M2.1 |
| code-quality | docs/ | M1.5 |
| code-quality | (default) | M2.1 |

---

### 2. backfill-hashes.js

**Purpose:** Retroactively computes and fills in missing `content_hash` values
for items in MASTER_DEBT.jsonl that lack them (e.g., items created before the
hash field was introduced).

**Input:**
- `docs/technical-debt/MASTER_DEBT.jsonl`

**Output:**
- `docs/technical-debt/MASTER_DEBT.jsonl` (overwritten via `writeMasterDebtSync`)

**CLI flags:**
- `--dry-run` — report missing hashes without writing
- `--help` / `-h` — usage text

**Who/what calls it:**
- Manual / ad-hoc only (no hook, CI, or skill reference found)

**Dependencies on other scripts:** Uses `../lib/generate-content-hash` (same
hash algorithm as `intake-audit.js`), `../lib/safe-fs` (`writeMasterDebtSync`).

**MASTER_DEBT modification:** YES — writes directly via `writeMasterDebtSync`.
Aborts (exits 1) if any non-empty lines fail JSON parsing, to prevent data loss.

---

### 3. check-phase-status.js

**Purpose:** Read-only diagnostic that reports the completion status of all 17
TDMS implementation phases by checking for PHASE_N_AUDIT.md files in
`docs/technical-debt/` and reading their `**Status:**` field.

**Input:**
- `docs/technical-debt/PHASE_<N>_AUDIT.md` (one per phase, read-only)
- Special cases: `PROCEDURE.md` (Phase 2), `FINAL_SYSTEM_AUDIT.md` (Phase 17)

**Output:**
- Console stdout only (no files written)

**CLI flags:** None.

**Who/what calls it:**
- Manual diagnostic only (referenced in `.claude/plans/archive/system-test-plan.md`)

**Dependencies on other scripts:** Uses `../lib/sanitize-error.js`. Uses ES
module `import` syntax (unlike the other scripts which use CommonJS `require`).

**MASTER_DEBT modification:** NO — read-only.

---

### 4. clean-intake.js

**Purpose:** Pre-ingestion filter for `scattered-intake.jsonl`. Runs 4 sequential
cleaning phases — deduplication against MASTER_DEBT, false positive detection,
completed-work detection, and schema verification — then writes the surviving
items to `scattered-intake-cleaned.jsonl`.

**Input:**
- `docs/technical-debt/MASTER_DEBT.jsonl` (reference for dedup)
- `docs/technical-debt/raw/scattered-intake.jsonl` (items to clean)

**Output:**
- `docs/technical-debt/raw/scattered-intake-cleaned.jsonl` (only with `--write`)

**CLI flags:**
- `--write` — write the output file (default is dry-run)
- `--verbose` — print the full rejection log

**Who/what calls it:**
- Manual / ad-hoc only (no hook or CI reference found; part of "Step 0h")

**Dependencies on other scripts:** Uses `../lib/read-jsonl`, `../lib/safe-fs`
(`safeWriteFileSync`).

**MASTER_DEBT modification:** NO — reads MASTER_DEBT as a reference index only,
writes to `raw/` staging only.

**Cleaning phases:**
1. Dedup: exact title, same file ±5 lines, content_hash match
2. False positives: informational-only titles, external deps (node_modules/), empty/short titles
3. Completed work: deleted files, title similarity ≥85% against RESOLVED items
4. Verification: invalid category, missing required fields; S0 on non-critical category auto-downgraded to S1

---

### 5. consolidate-all.js

**Purpose:** Orchestration wrapper that runs the full TDMS pipeline in sequence:
extract-sonarcloud (deprecated/optional) → extract-audits → extract-reviews →
normalize-all → dedup-multi-pass → generate-views (with `--ingest`).

**Input:** None directly — delegates entirely to child scripts.

**Output:** None directly — child scripts write their own outputs. Console reports `docs/technical-debt/MASTER_DEBT.jsonl`, `INDEX.md`, `views/`, `LEGACY_ID_MAPPING.json`.

**CLI flags:** None.

**Who/what calls it:**
- Manual pipeline trigger only (listed in `scripts/config/verified-patterns.json`)

**Dependencies on other scripts:** Calls these scripts via `execFileSync`:
1. `extract-sonarcloud.js` (optional, skipped if not found)
2. `extract-audits.js` (required)
3. `extract-reviews.js` (required)
4. `normalize-all.js` (required)
5. `dedup-multi-pass.js` (required)
6. `generate-views.js --ingest` (required)

**MASTER_DEBT modification:** YES — indirectly, through `generate-views.js --ingest`.

---

### 6. dedup-multi-pass.js

**Purpose:** 6-pass deduplication engine that consumes normalized items from
`raw/normalized-all.jsonl`, merges duplicates through progressively looser
matching passes, annotates systemic patterns, and writes the unique set to
`raw/deduped.jsonl`.

**Input:**
- `docs/technical-debt/raw/normalized-all.jsonl`

**Output:**
- `docs/technical-debt/raw/deduped.jsonl` (unique items)
- `docs/technical-debt/logs/dedup-log.jsonl` (merge audit trail)
- `docs/technical-debt/raw/review-needed.jsonl` (uncertain matches, if any)

**CLI flags:** None.

**Who/what calls it:**
- Called by `consolidate-all.js` (step 4 of 6)
- Manual use in the pipeline

**Dependencies on other scripts:** Uses `../lib/safe-fs` (`safeWriteFileSync`).
No dependency on other debt scripts at runtime; depends on `normalize-all.js`
having run first.

**MASTER_DEBT modification:** NO — writes to `raw/` staging only. MASTER_DEBT
is not touched until `generate-views.js --ingest`.

**Deduplication passes:**
| Pass | Strategy | Action |
|------|----------|--------|
| 0 | Parametric: same file, title differs only in numeric literals | Merge (skip for S0/S1, flag for review) |
| 1 | Exact: same `content_hash` | Merge |
| 2 | Near: same file, line ±5, title similarity >80% | Merge |
| 3 | Semantic: same file, title similarity >90% | Merge + flag for review |
| 4 | Cross-source: SonarCloud ↔ audit correlation | Merge (audit takes priority) |
| 5 | Systemic: same title across ≥3 files | Annotate with `cluster_id` (no merge) |

---

### 7. escalate-deferred.js

**Purpose:** Promotes deferred PR review items to formal DEBT entries when they
have been deferred at or above a threshold (default: 2 times) and are still
open. Calls `intake-pr-deferred.js` to create each DEBT entry at S1 severity.

**Input:**
- `data/ecosystem-v2/deferred-items.jsonl` (reads deferred PR findings)

**Output:**
- `data/ecosystem-v2/deferred-items.jsonl` (rewrites with `status: "promoted"` on escalated items)
- Indirectly: MASTER_DEBT.jsonl (via `intake-pr-deferred.js` calls)

**CLI flags:**
- `--dry-run` — report without modifying anything
- `--threshold N` — override the defer_count threshold (default: 2)
- `--help` — usage text

**Who/what calls it:**
- Manual / ad-hoc only (no hook or CI reference found)

**Dependencies on other scripts:** Calls `intake-pr-deferred.js` via
`execFileSync` for each escalated item. Exports `escalateDeferred()`,
`classifyCategory()`, `extractPrNumber()` for unit testing.

**MASTER_DEBT modification:** YES — indirectly via `intake-pr-deferred.js`.

---

### 8. extract-audit-reports.js

**Purpose:** One-time historical extraction (Step 0b) that parses 17 Dec 2025
markdown audit reports in `docs/archive/2025-dec-reports/` and extracts
actionable findings (skipping informational, completed, and already-tracked
items) into `scattered-intake.jsonl`.

**Input:**
- `docs/archive/2025-dec-reports/*.md` (17 reports, per `REPORT_CONFIG` map)
- `docs/technical-debt/MASTER_DEBT.jsonl` (for dedup via content_hash)
- `docs/technical-debt/raw/scattered-intake.jsonl` (for existing intake ID tracking)

**Output:**
- `docs/technical-debt/raw/scattered-intake.jsonl` (appended with `--write`)

**CLI flags:**
- `--write` — append to output (default is dry-run)
- `--verbose` — show all matches including skipped items

**Who/what calls it:**
- Manual / one-time historical use (Step 0b in the technical debt resolution plan)

**Dependencies on other scripts:** Uses `../lib/generate-content-hash`,
`../lib/safe-fs` (`safeAppendFileSync`). The file exceeds 10k tokens (read in
two parts); the REPORT_CONFIG table maps 17 specific report filenames to
categories and type classifications, with `skip: true` or `lowYield: true`
flags on non-actionable reports.

**MASTER_DEBT modification:** NO — appends to `raw/scattered-intake.jsonl`
staging only.

---

### 9. extract-audits.js

**Purpose:** Glob-scans all `docs/audits/**/*.jsonl` files (excluding
`FALSE_POSITIVES.jsonl`) and normalizes their findings to TDMS raw format,
writing a consolidated `raw/audits.jsonl`. Handles CODE-*, SEC-*, multi-AI
audit, and CANON-* formats.

**Input:**
- `docs/audits/**/*.jsonl` (all audit JSONL files via glob)

**Output:**
- `docs/technical-debt/raw/audits.jsonl`

**CLI flags:** None.

**Who/what calls it:**
- Called by `consolidate-all.js` (step 2 of 6)
- Manual pipeline use

**Dependencies on other scripts:** Uses `../lib/normalize-category`,
`../lib/safe-fs` (`safeWriteFileSync`). Async (`main()` returns a Promise).

**MASTER_DEBT modification:** NO — writes to `raw/` staging only.

**Normalization behavior:**
- Severity strings (critical/high/medium/low) → S0–S3 scale
- Effort strings (trivial/medium/large/etc.) → E0–E3 scale
- Category normalized via `normalize-category` lib
- `source_id` = `audit:<original_id>` or `audit:hash-<base64url>`
- Output status is always `"NEW"`

---

### 10. extract-context-debt.js

**Purpose:** Parses `.claude/state/agent-research-results.md` and
`.claude/state/system-test-gap-analysis-pass2.md` to extract "Gap:" bullet
items and "FINDING-*" heading items, converting them to TDMS JSONL format and
appending to `scattered-intake.jsonl` (Step 0f).

**Input:**
- `.claude/state/agent-research-results.md`
- `.claude/state/system-test-gap-analysis-pass2.md`
- `docs/technical-debt/MASTER_DEBT.jsonl` (for dedup via content_hash)
- `docs/technical-debt/raw/scattered-intake.jsonl` (for dedup via content_hash)

**Output:**
- `docs/technical-debt/raw/scattered-intake.jsonl` (appended with `--write`)

**CLI flags:**
- `--write` — append to output (default is dry-run)
- `--verbose` — print all extracted items

**Who/what calls it:**
- Manual / one-time historical use (Step 0f in the technical debt resolution plan)

**Dependencies on other scripts:** Uses `../lib/generate-content-hash`,
`../lib/safe-fs` (`safeAppendFileSync`).

**MASTER_DEBT modification:** NO — appends to `raw/scattered-intake.jsonl`
staging only. IDs use prefix `INTAKE-CTX-NNNN`.

---

### 11. extract-reviews.js

**Purpose:** Glob-scans all `docs/reviews/**/*.jsonl` and `docs/aggregation/*.jsonl`
(excluding dedup/crossref logs) and normalizes their items to TDMS raw format,
writing a consolidated `raw/reviews.jsonl`. Handles CANON-* files, MASTER_ISSUE_LIST,
and net-new findings.

**Input:**
- `docs/reviews/**/*.jsonl` (via glob)
- `docs/aggregation/*.jsonl` (excluding `dedup-log.jsonl`, `crossref-log.jsonl`)

**Output:**
- `docs/technical-debt/raw/reviews.jsonl`

**CLI flags:** None.

**Who/what calls it:**
- Called by `consolidate-all.js` (step 3 of 6)
- Manual pipeline use

**Dependencies on other scripts:** Uses `../lib/normalize-category`,
`../lib/safe-fs` (`safeWriteFileSync`), `../lib/security-helpers` (`sanitizeError`).
Async (`main()` returns a Promise).

**MASTER_DEBT modification:** NO — writes to `raw/` staging only.

**Normalization behavior:** Same severity/effort/category normalization as
`extract-audits.js`. Additionally preserves `pr_bucket`, `consensus_score`,
`dependencies`, and `roadmap_status` fields from review items. Output status
is always `"NEW"`.

---

### 12. extract-roadmap-debt.js

**Purpose:** Parses all checkbox items from `ROADMAP.md` (both checked and
unchecked), classifies each as debt vs. feature using weighted keyword scoring,
and appends debt-classified items to `scattered-intake.jsonl` (Step 0c). Skips
items that already carry `DEBT-XXXX` or `CANON-XXXX` references.

**Input:**
- `ROADMAP.md` (project root)
- `docs/technical-debt/MASTER_DEBT.jsonl` (for content_hash dedup)
- `docs/technical-debt/raw/scattered-intake.jsonl` (for ID sequence tracking)

**Output:**
- `docs/technical-debt/raw/scattered-intake.jsonl` (appended with `--write`)

**CLI flags:**
- `--write` — append to output (default is dry-run)
- `--verbose` — show all items including skipped features

**Who/what calls it:**
- Manual / one-time historical use (Step 0c in the technical debt resolution plan)

**Dependencies on other scripts:** Uses `../lib/generate-content-hash`,
`../lib/safe-fs` (`safeAppendFileSync`).

**MASTER_DEBT modification:** NO — appends to `raw/scattered-intake.jsonl`
staging only. IDs use prefix `INTAKE-ROAD-NNNN`.

**Classification logic:** Weighted keyword scoring. Debt indicators (fix,
refactor, cleanup, security, etc.) vs. feature indicators (new feature,
dashboard, journal, etc.). Net debt score ≥ 2 + debt > feature score → DEBT.
Checked items get status `RESOLVED`; unchecked get `NEW`.

---

### 13. extract-scattered-debt.js

**Purpose:** Scans source files across 9 directories (src, app, components, lib,
hooks, types, scripts, .claude/hooks, functions/src) for TODO/FIXME/HACK/XXX/WORKAROUND
comments and converts each to a TDMS JSONL entry (Step 0a). Uses comment
detection that avoids false positives from variable names and string literals.

**Input:**
- Source files with extensions `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.css`
  in the 9 SCAN_DIRS
- `docs/technical-debt/MASTER_DEBT.jsonl` (for content_hash dedup)

**Output:**
- `docs/technical-debt/raw/scattered-intake.jsonl` (atomic write via tmp rename, with `--write`)

**CLI flags:**
- `--write` — write output (default is dry-run)
- `--verbose` — show all matches including filtered false positives

**Who/what calls it:**
- Manual / one-time historical use (Step 0a in the technical debt resolution plan)

**Dependencies on other scripts:** Uses `../lib/generate-content-hash`,
`../lib/normalize-file-path`, `../lib/safe-fs` (`safeWriteFileSync`, `safeRenameSync`).

**MASTER_DEBT modification:** NO — writes to `raw/scattered-intake.jsonl`
staging only. IDs use prefix `INTAKE-CODE-NNNN`.

**Severity mapping:**
| Keyword | Severity |
|---------|----------|
| TODO | S3 |
| FIXME | S2 |
| HACK | S2 |
| XXX | S2 |
| WORKAROUND | S2 |

**False positive exclusions:** bare keywords without `:` or `(`, variable names
(TODO_FILE), keywords not in comments, keywords inside string literals within
comments.

---

### 14. generate-metrics.js

**Purpose:** Reads MASTER_DEBT.jsonl and computes aggregate health metrics
(counts by status/severity/category/source, resolution rate, average item age,
alert lists for S0/S1), writing a human-readable METRICS.md and a
machine-readable metrics.json for dashboard consumption. Also appends a snapshot
entry to `logs/metrics-log.jsonl`.

**Input:**
- `docs/technical-debt/MASTER_DEBT.jsonl`

**Output:**
- `docs/technical-debt/METRICS.md`
- `docs/technical-debt/metrics.json`
- `docs/technical-debt/logs/metrics-log.jsonl` (append)

**CLI flags:**
- `--verbose` — show parse error warnings

**Who/what calls it:**
- `npm run tdms:metrics` (package.json script)
- `/session-end` skill (Step e — "Never skip")
- Multiple `.claude/skills/` (audit-aggregator, create-audit, audit-agent-quality,
  debt-runner REFERENCE.md)
- Mentioned in `.claude/plans/archive/technical-debt-resolution-plan.md` as
  post-pipeline step

**Dependencies on other scripts:** Uses `../lib/safe-fs`
(`safeWriteFileSync`, `safeAppendFileSync`). Read-only against MASTER_DEBT.

**MASTER_DEBT modification:** NO — read-only.

---

### 15. generate-views.js

**Purpose:** Dual-mode script. Default mode: reads MASTER_DEBT.jsonl and
regenerates all markdown view files. With `--ingest`: additionally reads
`raw/deduped.jsonl`, assigns stable DEBT-XXXX IDs to new items (preserving
existing IDs via content_hash/source_id/fingerprint lookups), then
appends/overwrites MASTER_DEBT.jsonl before regenerating views.

**Input:**
- `docs/technical-debt/MASTER_DEBT.jsonl` (always)
- `docs/technical-debt/raw/deduped.jsonl` (only with `--ingest`)

**Output:**
- `docs/technical-debt/MASTER_DEBT.jsonl` (only with `--ingest`, via `writeMasterDebtSync`)
- `docs/technical-debt/INDEX.md`
- `docs/technical-debt/views/by-severity.md`
- `docs/technical-debt/views/by-category.md`
- `docs/technical-debt/views/by-status.md`
- `docs/technical-debt/views/verification-queue.md`
- `docs/technical-debt/LEGACY_ID_MAPPING.json`

**CLI flags:**
- `--ingest` — enable ingestion from `raw/deduped.jsonl` (otherwise view-regeneration only)

**Who/what calls it:**
- `npm run tdms:views` (package.json script)
- GitHub Actions CI (`.github/workflows/ci.yml` line 245) for views freshness check
- Called by `consolidate-all.js` (step 6, with `--ingest`)
- Multiple `.claude/skills/` (add-debt, audit-aggregator, audit-agent-quality,
  create-audit, audit-comprehensive, audit-process, debt-runner)

**Dependencies on other scripts:** Uses `../lib/safe-fs`
(`writeMasterDebtSync`, `appendMasterDebtSync`, `safeWriteFileSync`). In
`--ingest` mode depends on `dedup-multi-pass.js` having produced
`raw/deduped.jsonl`.

**MASTER_DEBT modification:** YES (only with `--ingest`) — writes via
`writeMasterDebtSync` (full sorted rewrite). Without `--ingest` it is read-only.

**Important warning (from canonical-memory):** `generate-views.js` OVERWRITES
MASTER_DEBT.jsonl from `deduped.jsonl` during `--ingest`. Any manual edits to
MASTER_DEBT.jsonl made after `dedup-multi-pass.js` was run but before
`generate-views.js --ingest` will be lost.

**Preserved fields during regeneration:** `status`, `resolution`, `verified_date`,
`verification_reason`, `roadmap_ref`, `milestone`, `roadmap_phase`, `source`,
`source_id`, `source_file` — these are carried over from existing MASTER items
when the same ID is matched.

---

## Sources

| # | Path | Type | Trust |
|---|------|------|-------|
| 1 | `scripts/debt/assign-roadmap-refs.js` | source file | HIGH |
| 2 | `scripts/debt/backfill-hashes.js` | source file | HIGH |
| 3 | `scripts/debt/check-phase-status.js` | source file | HIGH |
| 4 | `scripts/debt/clean-intake.js` | source file | HIGH |
| 5 | `scripts/debt/consolidate-all.js` | source file | HIGH |
| 6 | `scripts/debt/dedup-multi-pass.js` | source file | HIGH |
| 7 | `scripts/debt/escalate-deferred.js` | source file | HIGH |
| 8 | `scripts/debt/extract-audit-reports.js` | source file | HIGH |
| 9 | `scripts/debt/extract-audits.js` | source file | HIGH |
| 10 | `scripts/debt/extract-context-debt.js` | source file | HIGH |
| 11 | `scripts/debt/extract-reviews.js` | source file | HIGH |
| 12 | `scripts/debt/extract-roadmap-debt.js` | source file | HIGH |
| 13 | `scripts/debt/extract-scattered-debt.js` | source file | HIGH |
| 14 | `scripts/debt/generate-metrics.js` | source file | HIGH |
| 15 | `scripts/debt/generate-views.js` | source file | HIGH |
| 16 | `package.json` | source file | HIGH |
| 17 | `.github/workflows/ci.yml` | source file | HIGH |
| 18 | `.claude/skills/session-end/SKILL.md` | source file | HIGH |
| 19 | `.claude/canonical-memory/reference_tdms_systems.md` | source file | HIGH |

---

## Contradictions

None detected. All scripts are internally consistent with their header comments.

---

## Gaps

- `extract-audit-reports.js` body exceeds 10k tokens; lines 160+ were not read.
  The extraction loop structure and full list of item action patterns were not
  confirmed. However the purpose, inputs, outputs, and CLI flags were fully
  captured from the header + REPORT_CONFIG block (lines 1–160).
- `generate-metrics.js` lines 220+ (METRICS.md generation body) were not fully
  read — the output file format was confirmed by header comments and partial
  body. The metrics.json schema was confirmed from the `calculateMetrics()`
  return value.
- The callers of `clean-intake.js`, `escalate-deferred.js`, `backfill-hashes.js`,
  `check-phase-status.js`, `assign-roadmap-refs.js`, and the Step 0x extract
  scripts (0a, 0b, 0c, 0f) were not found in any hook, CI, or npm script. These
  appear to be manual-only tools.

---

## Serendipity

- **`check-phase-status.js` uses ES module syntax** while all other scripts use
  CommonJS `require`. This is the only ESM script in the set and could cause
  issues if run from a context that enforces CJS (e.g., if `package.json` sets
  `"type": "commonjs"`).

- **`generate-views.js` OVERWRITE HAZARD** is documented in
  `.claude/canonical-memory/reference_tdms_systems.md` as a CRITICAL note. The
  `--ingest` flag triggers a full MASTER_DEBT.jsonl rewrite from `deduped.jsonl`,
  meaning any direct edits to MASTER_DEBT.jsonl after the last dedup run will be
  silently lost. This is a known hazard in the codebase memory.

- **`consolidate-all.js` notes `extract-sonarcloud.js` as DEPRECATED** with a
  comment directing users to `sync-sonarcloud.js` for live API sync instead.

- **`escalate-deferred.js` reads from `data/ecosystem-v2/deferred-items.jsonl`**
  — not from the main `docs/technical-debt/` tree. This is the only script in
  this set that touches the `data/` directory.

- **Three scripts use `safeAppendFileSync`** for intake (extract-audit-reports,
  extract-context-debt, extract-roadmap-debt) while `extract-scattered-debt.js`
  uses an atomic write-via-tmp-rename pattern instead. The difference is
  intentional: the scattered-debt script fully regenerates the intake file, while
  the others append incrementally.

---

## Confidence Assessment

- HIGH claims: 15
- MEDIUM claims: 0
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

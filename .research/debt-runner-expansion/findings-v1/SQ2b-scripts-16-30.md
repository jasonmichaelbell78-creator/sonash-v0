# Findings: TDMS Scripts 16-30 — Detailed Documentation

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-26
**Sub-Question IDs:** SQ-2b

---

## Script Inventory

All scripts reside in `scripts/debt/`. Each entry documents purpose, inputs,
outputs, CLI flags, callers, script dependencies, and MASTER_DEBT.jsonl write
behavior.

---

### 1. `ingest-cleaned-intake.js`

**Purpose:** Final ingest step for a pre-cleaned intake batch file. Reads items
that already have `content_hash` computed, deduplicates against
MASTER_DEBT.jsonl by hash, assigns new DEBT-XXXX IDs continuing from the current
maximum, and appends qualifying items to both MASTER_DEBT.jsonl and
`raw/deduped.jsonl`.

**Input:**

- `docs/technical-debt/raw/scattered-intake-cleaned.jsonl` (hardcoded, required)
- `docs/technical-debt/MASTER_DEBT.jsonl` (read for dedup and max-ID detection)

**Output:**

- Appends to `docs/technical-debt/MASTER_DEBT.jsonl` (via
  `appendMasterDebtSync`)
- Appends to `docs/technical-debt/raw/deduped.jsonl` (via
  `appendMasterDebtSync`)
- Appends log entry to `docs/technical-debt/logs/intake-log.jsonl`

**CLI flags:**

- `--dry-run` (default): preview only, no writes
- `--write`: commit the ingest

**Callers:** Manual invocation by operator; not called by any hook, CI workflow,
or other script in the codebase. Intended as a one-shot tool in a multi-step
manual pipeline (after the cleaning step produces
`scattered-intake-cleaned.jsonl`).

**Dependencies on other scripts:** Uses `../lib/safe-fs` (`safeAppendFileSync`,
`appendMasterDebtSync`). Does not call any sibling debt scripts.

**MASTER_DEBT writes:** YES — directly appends via `appendMasterDebtSync`.

---

### 2. `intake-audit.js`

**Purpose:** Ingests technical debt items produced by audit skills (Doc
Standards, Enhancement audits, or TDMS-native format). Validates, normalizes,
deduplicates against MASTER_DEBT, assigns DEBT-XXXX IDs, runs multi-pass dedup,
assigns roadmap references, regenerates views, and logs intake. Supports three
input formats with automatic detection and field mapping.

**Input:**

- Positional arg: path to a JSONL audit output file (required)
- `docs/technical-debt/MASTER_DEBT.jsonl` (read for dedup)
- `scripts/config/audit-schema.json` (via `loadConfig`)

**Output:**

- Appends to `docs/technical-debt/MASTER_DEBT.jsonl`
- Appends to `docs/technical-debt/raw/deduped.jsonl` (via
  `appendMasterDebtSync`)
- Appends to `docs/technical-debt/raw/normalized-all.jsonl` (pipeline append)
- Appends to `docs/technical-debt/logs/intake-log.jsonl`
- Triggers `generate-views.js` after write

**CLI flags:**

- `--dry-run`: preview without writing
- `--write` / (default without flag also writes — dry-run must be explicit)

**Callers:**

- `/add-debt` skill (via `SKILL.md` — bulk audit import path)
- `/debt-runner` skill (stages via `intake-audit.js` for apply step)
- Audit skills (`/create-audit`, `/audit-code`, `/audit-documentation`, etc.)
  reference it as the canonical ingest path for JSONL audit output
- Not called from hooks or CI directly

**Dependencies:** `generate-views.js` (called via `execFileSync` post-write);
`../lib/generate-content-hash`, `../lib/normalize-file-path`, `../lib/safe-fs`,
`../config/load-config`.

**MASTER_DEBT writes:** YES — appends via `appendMasterDebtSync`.

---

### 3. `intake-manual.js`

**Purpose:** Adds a single manually discovered debt item interactively from the
command line. Validates all fields against the audit schema, generates a content
hash, checks for duplicates, assigns the next DEBT-XXXX ID, writes to both
MASTER_DEBT.jsonl and deduped.jsonl, then regenerates views.

**Input:**

- CLI flags (all key/value pairs, see below)
- `docs/technical-debt/MASTER_DEBT.jsonl` (read for dedup and max-ID)
- `scripts/config/audit-schema.json`

**Output:**

- Appends to `docs/technical-debt/MASTER_DEBT.jsonl` (via
  `appendMasterDebtSync`)
- Appends to `docs/technical-debt/raw/deduped.jsonl` (via
  `appendMasterDebtSync`)
- Appends to `docs/technical-debt/logs/intake-log.jsonl`
- Triggers `generate-views.js`

**CLI flags:**

- `--file <path>` (required)
- `--line <number>` (default: 0)
- `--title <text>` (required)
- `--severity <S0-S3>` (required)
- `--category <cat>` (required)
- `--type <type>` (default: tech-debt)
- `--description <txt>`
- `--recommendation <txt>`
- `--effort <E0-E3>` (default: E1)
- `--roadmap <track>`
- `--dry-run`

**Callers:** `/add-debt` skill (the "Manual" workflow path — no PR number
provided). Not called by hooks or CI.

**Dependencies:** `generate-views.js` (called post-write);
`../lib/generate-content-hash`, `../lib/normalize-file-path`, `../lib/safe-fs`,
`../lib/security-helpers`, `../config/load-config`.

**MASTER_DEBT writes:** YES — appends via `appendMasterDebtSync`.

---

### 4. `intake-pr-deferred.js`

**Purpose:** Adds a single debt item that was explicitly deferred during a PR
review, tagging it with the originating PR number. Functionally identical to
`intake-manual.js` but sets `source_id: pr-deferred:<UUID>`,
`source_file: PR #N`, `pr_number`, and `source_pr` fields. Default category is
`code-quality` rather than requiring explicit category.

**Input:**

- CLI flags (see below)
- `docs/technical-debt/MASTER_DEBT.jsonl` (read for dedup and max-ID)
- `scripts/config/audit-schema.json`

**Output:**

- Appends to `docs/technical-debt/MASTER_DEBT.jsonl` (via
  `appendMasterDebtSync`)
- Appends to `docs/technical-debt/raw/deduped.jsonl` (via
  `appendMasterDebtSync`)
- Appends to `docs/technical-debt/logs/intake-log.jsonl`
- Triggers `generate-views.js`

**CLI flags:**

- `--pr <number>` (required)
- `--file <path>` (required)
- `--line <number>` (default: 0)
- `--title <text>` (required)
- `--severity <S0-S3>` (required)
- `--category <cat>` (default: code-quality)
- `--description <txt>`
- `--roadmap <track>`
- `--dry-run`

**Callers:** `/add-debt` skill (the "Deferred" workflow path — PR number
provided). Not called by hooks or CI.

**Dependencies:** `generate-views.js` (called post-write);
`../lib/generate-content-hash`, `../lib/normalize-file-path`, `../lib/safe-fs`,
`../config/load-config`.

**MASTER_DEBT writes:** YES — appends via `appendMasterDebtSync`.

---

### 5. `normalize-all.js`

**Purpose:** Merges all raw extraction JSONL files in `docs/technical-debt/raw/`
into a single normalized file. Applies final schema normalization (field
coercion, content hash generation, path normalization) to every item. This is a
pipeline step in the bulk import workflow before deduplication.

**Input:**

- All `*.jsonl` files in `docs/technical-debt/raw/` (glob pattern, excluding
  `normalized-all.jsonl` itself)
- `scripts/config/audit-schema.json`

**Output:**

- Writes (overwrites) `docs/technical-debt/raw/normalized-all.jsonl`

**CLI flags:** None.

**Callers:** Manual pipeline step; referenced in plan documents as Step N of the
multi-step bulk import workflow. Not called by hooks, CI, or other scripts
automatically.

**Dependencies:** `../lib/generate-content-hash`, `../lib/normalize-file-path`,
`../lib/safe-fs`, `../config/load-config`. Uses `glob` npm package.

**MASTER_DEBT writes:** NO — only writes to `raw/normalized-all.jsonl`. Does not
touch MASTER_DEBT.jsonl.

---

### 6. `process-review-needed.js`

**Purpose:** Step 0e of the Technical Debt Resolution Plan. Reads
`raw/review-needed.jsonl` (dedup pairs flagged for manual review, typically
S0/S1 items), classifies each pair by checking whether item_b is already
tracked, a true duplicate, a distinct instance, or a different issue. Items that
are genuinely new are appended to `raw/scattered-intake.jsonl` for later ingest.
Unresolvable pairs are written back to `review-needed.jsonl`.

**Input:**

- `docs/technical-debt/raw/review-needed.jsonl` (JSONL of pair objects)
- `docs/technical-debt/MASTER_DEBT.jsonl` (read for hash/source-ID dedup)

**Output:**

- Appends to `docs/technical-debt/raw/scattered-intake.jsonl` (new items
  eligible for ingest, tagged `INTAKE-REVIEW-XXXX`)
- Overwrites `docs/technical-debt/raw/review-needed.jsonl` (clears resolved
  pairs; retains only those needing manual review)
- No direct writes to MASTER_DEBT.jsonl

**CLI flags:**

- `--write`: apply changes (default is dry-run)
- `--verbose`: show item-level detail

**Callers:** Manual operator step in the dedup pipeline. Not called by hooks,
CI, or other scripts.

**Dependencies:** `../lib/safe-fs`. Does not call sibling scripts.

**MASTER_DEBT writes:** NO — outputs staging files only. MASTER_DEBT is read
only, never written.

---

### 7. `reconcile-roadmap.js`

**Purpose:** Step 9 of the TDMS migration plan. Replaces legacy `CANON-XXXX`
reference strings in `ROADMAP.md` with their canonical `DEBT-XXXX` equivalents
using the `docs/technical-debt/LEGACY_ID_MAPPING.json` mapping file. Skips
fenced code blocks to avoid false replacements. Creates a `.bak` backup before
writing.

**Input:**

- `ROADMAP.md` (project root)
- `docs/technical-debt/LEGACY_ID_MAPPING.json`

**Output:**

- Overwrites `ROADMAP.md` (in `--write` mode; creates `ROADMAP.md.bak` first)
- No changes to MASTER_DEBT.jsonl

**CLI flags:**

- `--write`: apply replacements (default is dry-run)
- `--verbose`: print per-line replacement detail

**Callers:**

- `resolve-item.js` calls it automatically (via `execFileSync`) after any
  single-item resolution
- `resolve-bulk.js` calls it automatically after bulk resolution
- Also manually invoked as a standalone Step 9 migration tool

**Dependencies:** `../lib/safe-fs`. Does not call other sibling debt scripts.

**MASTER_DEBT writes:** NO. Modifies `ROADMAP.md` only.

---

### 8. `resolve-bulk.js`

**Purpose:** Marks multiple DEBT-XXXX items as RESOLVED in a single operation.
Accepts IDs on the CLI or from a file. Supports `--eligible-only` to restrict
resolution to items with status VERIFIED, IN_PROGRESS, or TRIAGED (skipping NEW
items). Writes a JSON summary for CI consumption via `--output-json`. After
writing, triggers `reconcile-roadmap.js` and scans plan files for references to
the resolved IDs.

**Input:**

- One or more `DEBT-XXXX` IDs (positional args or via `--file`)
- `docs/technical-debt/MASTER_DEBT.jsonl` (read-modify-write)

**Output:**

- Overwrites `docs/technical-debt/MASTER_DEBT.jsonl` (atomic tmp+rename via
  `saveMasterDebt`)
- Appends to `docs/technical-debt/logs/resolution-log.jsonl`
- Optionally writes `--output-json <path>` summary JSON
- Triggers `generate-views.js`
- Triggers `reconcile-roadmap.js --write`

**CLI flags:**

- `--pr <number>`: PR number that resolved the items
- `--file <path>`: read DEBT IDs one per line from a file
- `--dry-run`: preview, no writes
- `--eligible-only`: only resolve VERIFIED/IN_PROGRESS/TRIAGED items
- `--output-json <path>`: write JSON summary (path-traversal protected)

**Callers:**

- `.github/workflows/resolve-debt.yml` — CI workflow, fires on PR merge when the
  PR body contains `Resolves: DEBT-XXXX` lines. Passes
  `--eligible-only --output-json`.
- `/debt-runner` skill (apply step)
- Manual operator use

**Dependencies:**

- `generate-views.js` (called post-write)
- `reconcile-roadmap.js` (called post-write)
- `../lib/safe-fs`, `../lib/security-helpers`

**MASTER_DEBT writes:** YES — full overwrite via atomic tmp+rename.

---

### 9. `resolve-item.js`

**Purpose:** Marks a single DEBT-XXXX item as either RESOLVED or FALSE_POSITIVE.
For false positives: removes the item from MASTER_DEBT and appends it to
`FALSE_POSITIVES.jsonl`. For resolved items: updates status in place. In both
cases triggers `sync-deduped.js`, `generate-views.js`, and
`reconcile-roadmap.js` as post-write side effects.

**Input:**

- Positional `DEBT-XXXX` ID (required)
- `docs/technical-debt/MASTER_DEBT.jsonl` (read-modify-write)

**Output:**

- Overwrites `docs/technical-debt/MASTER_DEBT.jsonl` (via `writeMasterDebtSync`)
- Appends to `docs/technical-debt/FALSE_POSITIVES.jsonl` (for false positives)
- Appends to `docs/technical-debt/logs/resolution-log.jsonl`
- Triggers `sync-deduped.js --apply`
- Triggers `generate-views.js`
- Triggers `reconcile-roadmap.js --write`

**CLI flags:**

- `--pr <number>`: originating PR
- `--false-positive`: mark as FALSE_POSITIVE instead of RESOLVED
- `--reason <text>`: required with `--false-positive`
- `--dry-run`

**Callers:** Manual operator use; `/add-debt` skill may reference it. Not called
from CI or hooks directly.

**Dependencies:**

- `sync-deduped.js` (called post-write)
- `generate-views.js` (called post-write)
- `reconcile-roadmap.js` (called post-write)
- `../lib/safe-fs`, `../lib/security-helpers`

**MASTER_DEBT writes:** YES — full overwrite via `writeMasterDebtSync`.

---

### 10. `reverify-resolved.js`

**Purpose:** One-time re-verification script for RESOLVED items that were
flagged as "possibly unresolved" by a resolution audit. Contains hardcoded sets
of `falseAlarms` and `genuinelyUnresolved` DEBT IDs based on manual verification
performed 2026-02-21. Updates both MASTER_DEBT.jsonl and deduped.jsonl
atomically, reverting genuinely unresolved items to VERIFIED and re-resolving
false alarm items.

**Input:**

- `docs/technical-debt/logs/resolution-audit-report.json` (reads
  `step4_audit_resolved.possibly_unresolved_details` array)
- `docs/technical-debt/MASTER_DEBT.jsonl`
- `docs/technical-debt/raw/deduped.jsonl`

**Output:**

- Overwrites `docs/technical-debt/MASTER_DEBT.jsonl` (atomic tmp+rename)
- Overwrites `docs/technical-debt/raw/deduped.jsonl` (atomic tmp+rename)
- No log entry written

**CLI flags:**

- `--write`: apply changes (default is dry-run)

**Callers:** Manual one-time operator use; referenced in Session #179 and
`technical-debt-resolution-plan.md`. Not called by any automated pipeline, hook,
or CI.

**Dependencies:** `../lib/safe-fs`. Does not call sibling scripts.

**MASTER_DEBT writes:** YES — full overwrite via atomic rename. Also overwrites
deduped.jsonl.

**Note:** This script contains hardcoded verification decisions (specific DEBT
IDs in `falseAlarms` / `genuinelyUnresolved` sets) and is not designed for
repeated general use. It is a historical point-in-time correction tool.

---

### 11. `sync-deduped.js`

**Purpose:** Propagates severity and status changes from MASTER_DEBT.jsonl back
into `raw/deduped.jsonl` without adding or removing items. This prevents
`generate-views.js` (which reads deduped as its source) from reverting manual
severity/status edits made directly to MASTER_DEBT. Matches items by
`content_hash`. Supports JSON output mode for machine consumption.

**Input:**

- `docs/technical-debt/MASTER_DEBT.jsonl`
- `docs/technical-debt/raw/deduped.jsonl`

**Output:**

- Overwrites `docs/technical-debt/raw/deduped.jsonl` (in `--apply` mode)
- Stdout JSON or text summary

**CLI flags:**

- `--apply`: write changes to deduped.jsonl (default is dry-run)
- `--json`: emit machine-readable JSON instead of human text

**Exit codes:**

- 0 = synced or no changes needed
- 1 = changes pending (dry-run with diffs found)
- 2 = error

**Callers:**

- `resolve-item.js` calls it via `execFileSync` after every resolution or
  false-positive marking (Session #179 regression fix)
- Manual operator use
- `/debt-runner` skill (sync-check step)

**Dependencies:** `../lib/safe-fs`, `../lib/security-helpers`,
`../lib/read-jsonl`. Does not call other sibling debt scripts.

**MASTER_DEBT writes:** NO — reads MASTER_DEBT, writes only to deduped.jsonl.

---

### 12. `sync-roadmap-refs.js`

**Purpose:** Validates that every `DEBT-XXXX` reference in `ROADMAP.md` and
`ROADMAP_FUTURE.md` corresponds to an ID that actually exists in
MASTER_DEBT.jsonl. Reports orphaned references. Does not modify any files — it
is a read-only integrity check.

**Note:** This file uses ES module syntax (`import`/`export`) rather than
CommonJS (`require`).

**Input:**

- `docs/technical-debt/MASTER_DEBT.jsonl` (reads all IDs)
- `ROADMAP.md`
- `ROADMAP_FUTURE.md`

**Output:**

- Stdout report only. No file writes.

**CLI flags:**

- `--check-only`: report only, no suggestions (default behavior is also
  report-only; this flag suppresses the "Suggested actions" section)
- `--verbose` / `-v`: show context lines for each orphaned reference

**Exit codes:**

- 0 = all valid or nothing to check
- 1 = orphaned references found

**Callers:**

- `.github/workflows/ci.yml` — called as
  `node scripts/debt/sync-roadmap-refs.js --check-only` in the CI TDMS
  validation job
- Manual operator use

**Dependencies:** None (no sibling script calls, no shared lib imports beyond
Node built-ins).

**MASTER_DEBT writes:** NO — read-only.

---

### 13. `sync-sonarcloud.js`

**Purpose:** Syncs technical debt from the SonarCloud API into
MASTER_DEBT.jsonl. Fetches issues and security hotspots, deduplicates against
existing items by `sonar_key` and `content_hash`, assigns DEBT-XXXX IDs to new
items, and appends them. In `--resolve` or `--full` mode, additionally
identifies tracked items whose `sonar_key` is no longer active in SonarCloud and
marks them RESOLVED. Reads config from `sonar-project.properties` and env vars;
requires `SONAR_TOKEN`.

**Input:**

- SonarCloud REST API (issues + hotspots endpoints, paginated)
- `docs/technical-debt/MASTER_DEBT.jsonl` (dedup + max-ID)
- `sonar-project.properties` (org/project defaults)
- `.env.local` (token via dotenv, optional)

**Output (new items path):**

- Appends to `docs/technical-debt/MASTER_DEBT.jsonl` (via
  `appendMasterDebtSync`)
- Appends to `docs/technical-debt/raw/deduped.jsonl` (via
  `appendMasterDebtSync`)
- Appends to `docs/technical-debt/logs/intake-log.jsonl`
- Triggers `generate-views.js`

**Output (resolve path):**

- Overwrites `docs/technical-debt/MASTER_DEBT.jsonl` (via `writeMasterDebtSync`)
- Appends to `docs/technical-debt/logs/resolution-log.jsonl`
- Triggers `generate-views.js`

**CLI flags:**

- `--project <key>`: override SonarCloud project key
- `--org <name>`: override SonarCloud organization
- `--severity <list>`: filter by severity (BLOCKER,CRITICAL,MAJOR,MINOR,INFO)
- `--type <list>`: filter by type (BUG,VULNERABILITY,CODE_SMELL)
- `--status <list>`: filter by status (default: OPEN,CONFIRMED,REOPENED)
- `--resolve`: resolve stale items only
- `--full`: sync new + resolve stale in one pass
- `--dry-run`: preview, no writes
- `--force`: skip confirmation prompt

**Environment variables:**

- `SONAR_TOKEN` (required)
- `SONAR_ORG` (optional, falls back to `sonar-project.properties`)
- `SONAR_PROJECT` (optional)

**Callers:**

- `/sonarcloud` skill (all modes that touch data: sync, resolve, full, sprint)
- `/debt-runner sync` mode
- Manual operator use

**Dependencies:**

- `generate-views.js` (called post-write)
- `../lib/generate-content-hash`, `../lib/safe-fs`

**MASTER_DEBT writes:** YES — appends (new items) or full overwrite (resolve
path), both using safe-fs helpers.

---

### 14. `validate-schema.js`

**Purpose:** Validates MASTER_DEBT.jsonl (or any specified JSONL file) against
the TDMS schema. Checks required fields, ID format,
category/severity/type/status enum values, content_hash format, file path
validity, duplicate IDs, duplicate hashes, and enhancement-type fields. Supports
`--staged-only` to restrict validation to lines changed in the current git
staging area (used in the pre-commit hook to avoid blocking on pre-existing
issues).

**Input:**

- `docs/technical-debt/MASTER_DEBT.jsonl` (default) or `--file <path>`
- `scripts/config/audit-schema.json` (schema enum values)
- Git staging area (only in `--staged-only` mode)

**Output:**

- Stdout validation report only. No file writes.

**CLI flags:**

- `--file <path>`: file to validate (default: MASTER_DEBT.jsonl)
- `--strict`: treat warnings as errors
- `--quiet`: suppress all output except errors
- `--staged-only`: only validate lines changed in the current git commit

**Exit codes:**

- 0 = valid
- 1 = validation errors found
- 2 = file not found or parse error

**Callers:**

- `.husky/pre-commit` — called as `validate-schema.js --staged-only` on every
  commit that touches MASTER_DEBT.jsonl
- `.github/workflows/ci.yml` — called as `node scripts/debt/validate-schema.js`
  in the TDMS validation CI job
- `/debt-runner validate` mode
- Manual operator use

**Dependencies:** `../config/load-config`, `../lib/security-helpers`. No sibling
script calls.

**MASTER_DEBT writes:** NO — read-only validation tool.

---

### 15. `verify-resolutions.js`

**Purpose:** Combines Steps 3, 4, and 5 of the Technical Debt Resolution Plan:

- Step 3: Promotes NEW items to VERIFIED when their referenced file exists on
  disk (flags items needing triage when the file or line is missing)
- Step 4: Audits RESOLVED items to confirm resolution (marks as "possibly
  unresolved" if title keywords are still found near the referenced line)
- Step 5: Audits FALSE_POSITIVE items to confirm classification (flags if
  pattern still present)

Writes an audit report JSON for downstream use by `reverify-resolved.js`.

**Input:**

- `docs/technical-debt/MASTER_DEBT.jsonl`
- `docs/technical-debt/raw/deduped.jsonl` (read for sync in write mode)
- Actual source files on disk (checks existence + keyword proximity)

**Output (write mode):**

- Overwrites `docs/technical-debt/MASTER_DEBT.jsonl` (atomic tmp+rename)
- Overwrites `docs/technical-debt/raw/deduped.jsonl` (atomic tmp+rename, if any
  deduped items were synced)
- Writes `docs/technical-debt/logs/resolution-audit-report.json` (consumed by
  `reverify-resolved.js`)

**CLI flags:**

- `--write`: apply status promotions (default is dry-run)
- `--dry-run`: explicit dry-run (also default)
- `--verbose`: show per-item classification detail

**Callers:**

- `/debt-runner verify` mode
- Manual operator step in the resolution pipeline
- Not called from hooks or CI

**Dependencies:**

- `../lib/sanitize-error`, `../lib/safe-fs`
- `reverify-resolved.js` consumes its output
  (`logs/resolution-audit-report.json`) but is not called by it

**MASTER_DEBT writes:** YES — full overwrite in `--write` mode (atomic
tmp+rename). Also overwrites `raw/deduped.jsonl` when promoted items have
matching entries there.

---

## Cross-Cutting Observations

**Shared output pathway for MASTER_DEBT:** The scripts that append to
MASTER_DEBT.jsonl use one of two safe-fs helpers:

- `appendMasterDebtSync(items)` — appends to both MASTER_DEBT.jsonl and
  raw/deduped.jsonl in a single call (intake scripts: ingest-cleaned-intake,
  intake-audit, intake-manual, intake-pr-deferred, sync-sonarcloud new-items)
- `writeMasterDebtSync(items)` / `saveMasterDebt(items)` — full atomic overwrite
  of MASTER_DEBT.jsonl only (resolve-item, sync-sonarcloud resolve path);
  deduped sync is handled separately by sync-deduped.js

**Scripts that do NOT write MASTER_DEBT:** normalize-all (writes to
normalized-all.jsonl only), process-review-needed (writes staging/intake files),
reconcile-roadmap (writes ROADMAP.md), sync-deduped (writes deduped.jsonl),
sync-roadmap-refs (read-only), validate-schema (read-only), verify-resolutions
(writes MASTER_DEBT but via full overwrite, not append).

**Post-write side effects chain:** The resolution scripts form a consistent
post-write chain: `resolve-item.js` and `resolve-bulk.js` both call
`sync-deduped.js --apply` → `generate-views.js` →
`reconcile-roadmap.js --write`.

**CI integration:** Only two scripts are called by CI:

- `validate-schema.js` (both pre-commit hook and `ci.yml`)
- `sync-roadmap-refs.js --check-only` (`ci.yml`)
- `resolve-bulk.js` (`resolve-debt.yml` on PR merge)

---

## Sources

All findings are derived directly from reading the source files listed below. No
external sources consulted.

| #   | Path                                    | Type       | Trust |
| --- | --------------------------------------- | ---------- | ----- |
| 1   | `scripts/debt/ingest-cleaned-intake.js` | Filesystem | HIGH  |
| 2   | `scripts/debt/intake-audit.js`          | Filesystem | HIGH  |
| 3   | `scripts/debt/intake-manual.js`         | Filesystem | HIGH  |
| 4   | `scripts/debt/intake-pr-deferred.js`    | Filesystem | HIGH  |
| 5   | `scripts/debt/normalize-all.js`         | Filesystem | HIGH  |
| 6   | `scripts/debt/process-review-needed.js` | Filesystem | HIGH  |
| 7   | `scripts/debt/reconcile-roadmap.js`     | Filesystem | HIGH  |
| 8   | `scripts/debt/resolve-bulk.js`          | Filesystem | HIGH  |
| 9   | `scripts/debt/resolve-item.js`          | Filesystem | HIGH  |
| 10  | `scripts/debt/reverify-resolved.js`     | Filesystem | HIGH  |
| 11  | `scripts/debt/sync-deduped.js`          | Filesystem | HIGH  |
| 12  | `scripts/debt/sync-roadmap-refs.js`     | Filesystem | HIGH  |
| 13  | `scripts/debt/sync-sonarcloud.js`       | Filesystem | HIGH  |
| 14  | `scripts/debt/validate-schema.js`       | Filesystem | HIGH  |
| 15  | `scripts/debt/verify-resolutions.js`    | Filesystem | HIGH  |
| 16  | `.github/workflows/ci.yml`              | Filesystem | HIGH  |
| 17  | `.github/workflows/resolve-debt.yml`    | Filesystem | HIGH  |
| 18  | `.husky/pre-commit`                     | Filesystem | HIGH  |
| 19  | `.claude/skills/add-debt/SKILL.md`      | Filesystem | HIGH  |
| 20  | `.claude/skills/sonarcloud/SKILL.md`    | Filesystem | HIGH  |
| 21  | `.claude/skills/debt-runner/SKILL.md`   | Filesystem | HIGH  |

## Contradictions

None detected. All callers reference the scripts by their exact filenames and
argument conventions as observed in the script source.

## Gaps

- `intake-audit.js` references a multi-pass dedup step (parametric, near,
  semantic, cross-source, systemic as listed in the header comment), but the
  actual dedup logic beyond content-hash dedup was not fully traced — the script
  is the largest in the set (>700 lines read partially). The dedup pipeline
  after the initial hash check likely involves a separate dedup script not in
  this batch.
- `reverify-resolved.js` is marked as a one-time use tool with hardcoded IDs
  from a specific session. Future audit cycles would require a new script or
  manual updates.

## Serendipity

- `sync-roadmap-refs.js` is the only script in this batch written in ES module
  syntax (`import` from `node:fs`) while all others use CommonJS `require`. This
  may indicate it was written separately or at a different point in the
  project's module-style migration.
- `resolve-bulk.js` scans `.claude/plans/*.md` and specific sprint documents for
  references to resolved DEBT IDs after every bulk resolution — informing the
  user that plan files may need updating. This cross-artifact awareness is not
  documented in the skills.

## Confidence Assessment

- HIGH claims: 15 (all script-by-script documentation — directly read from
  source)
- MEDIUM claims: 2 (caller attributions from skills, confirmed by skill SKILL.md
  references but not exhaustively traced through every code path)
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

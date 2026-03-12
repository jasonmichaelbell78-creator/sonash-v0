# Deep Plan: Automation & File Overwrite Fixes

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-27
**Status:** DRAFT — Awaiting Approval
**Branch:** claude/maintenance22726-md8WL
<!-- prettier-ignore-end -->

---

## User Decisions Summary

| #   | Finding                                 | Decision | Approach                                                          |
| --- | --------------------------------------- | -------- | ----------------------------------------------------------------- |
| 1   | DOCUMENTATION_INDEX.md partial gen fail | ACT      | Atomic: fail = no change to original                              |
| 2   | MASTER_DEBT.jsonl 9 writers             | ACT      | Central `writeMasterDebt()` in safe-fs.js                         |
| 3   | reviews.jsonl rotation                  | ACT      | Archive-on-rotation (not discard)                                 |
| 4   | AI_REVIEW_LEARNINGS_LOG.md archive      | ACT      | Shore up archive process, content hash check                      |
| 5   | ROADMAP.md partial rewrites             | ACT      | Code fence detection + `--dry-run`                                |
| 6   | hook-warnings-log.jsonl race            | ACT      | File locking + archive-on-rotation                                |
| 7   | agent-invocations.jsonl race            | ACT      | File locking for rotation                                         |
| 8   | Lint-staged                             | ACCEPT   | No change                                                         |
| 9   | PR Review→Retro→Debt                    | ACCEPT   | Keep as-is (user handles organically)                             |
| 10  | TDMS dual-file write trap               | ACT      | `writeMasterDebt()` utility enforces dual-write                   |
| 11  | Session lifecycle                       | ACCEPT   | Keep as-is                                                        |
| 12  | Review sync deadlock                    | ACT      | Add `reviews:sync` to SessionStart                                |
| 13  | Debt resolution→Plan files              | ACT      | Full coverage: ROADMAP + GRAND_PLAN + manifest + all active plans |
| 14  | Skills/templates loop                   | ACCEPT   | User instructs manually (sufficient)                              |

---

## Implementation Plan

### Wave 1: Infrastructure (Foundation layer — everything else depends on this)

#### Step 1A: Add file locking to safe-fs.js

**File:** `scripts/lib/safe-fs.js`

Add advisory file locking functions that all writers can use:

```js
/**
 * Acquire an advisory lock file. Spins up to `timeoutMs` waiting for an
 * existing lock to clear. Creates `<filePath>.lock` containing PID + timestamp.
 */
function acquireLock(filePath, timeoutMs = 5000) { ... }

/**
 * Release the advisory lock. Only removes if current process owns it.
 */
function releaseLock(filePath) { ... }

/**
 * Execute `fn` while holding an advisory lock on `filePath`.
 * Automatically releases on success or error.
 */
function withLock(filePath, fn) { ... }
```

Implementation details:

- Lock file: `${filePath}.lock` containing `{ pid, timestamp, hostname }`
- Stale lock detection: if lock is older than 60s, force-break it (single-user
  CLI)
- Spin interval: 100ms, timeout: 5s (configurable)
- `withLock(path, fn)` — try/finally wrapper that always releases

**Tests:** `tests/scripts/safe-fs.test.ts` — add lock acquisition, release,
stale detection, timeout tests

---

#### Step 1B: Add `writeMasterDebt()` and `appendMasterDebt()` to safe-fs.js (Findings 2 + 10)

**File:** `scripts/lib/safe-fs.js`

```js
/**
 * Central MASTER_DEBT writer. Always writes to BOTH master and deduped.
 * Uses file locking to prevent concurrent writes.
 *
 * @param {object[]} items - Full array of debt items (full-rewrite mode)
 * @param {object} [options]
 * @param {string} [options.masterPath] - Override MASTER_DEBT.jsonl path
 * @param {string} [options.dedupedPath] - Override deduped.jsonl path
 */
function writeMasterDebtSync(items, options) { ... }

/**
 * Append items to MASTER_DEBT.jsonl AND deduped.jsonl atomically.
 * Uses file locking.
 *
 * @param {object[]} newItems - Items to append
 * @param {object} [options] - Same as writeMasterDebtSync
 */
function appendMasterDebtSync(newItems, options) { ... }
```

Implementation details:

- Both functions use `withLock(MASTER_FILE, fn)` for coordination
- `writeMasterDebtSync`: atomic write to tmp → rename for MASTER, then sync
  deduped
- `appendMasterDebtSync`: append to both files under the same lock
- Derive paths from `__dirname` or accept overrides for testing
- Exported from `safe-fs.js` module.exports

**Tests:** `tests/scripts/safe-fs.test.ts` — add dual-write verification, lock
coordination tests

---

#### Step 1C: Add `archiveRotateJsonl()` to rotate-state.js (Findings 3 + 6)

**File:** `.claude/hooks/lib/rotate-state.js`

```js
/**
 * Rotate a JSONL file, archiving discarded entries instead of deleting.
 * Appends evicted entries to `${filePath}.archive`.
 *
 * @param {string} filePath - Active JSONL file path
 * @param {number} maxEntries - Trigger when count exceeds this
 * @param {number} [keepCount] - Lines to keep (default: 60% of max)
 * @returns {{ rotated: boolean, before: number, after: number, archived: number }}
 */
function archiveRotateJsonl(filePath, maxEntries, keepCount) { ... }
```

Implementation details:

- Split lines into `kept` (last N) and `evicted` (everything before)
- Append evicted to `${filePath}.archive` (create if missing)
- Use advisory lock from safe-fs (import via relative path)
- Atomic write for active file (existing pattern)
- Return `archived` count for logging

**Tests:** Add to existing rotate-state tests or new test file

---

### Wave 2: File Overwrite Fixes (Apply infrastructure from Wave 1)

#### Step 2A: Migrate MASTER_DEBT writers to central functions (Finding 2)

**Files to modify (9 scripts):**

| Script                                       | Current Method                         | Change To                        |
| -------------------------------------------- | -------------------------------------- | -------------------------------- |
| `scripts/debt/generate-views.js` L298        | `writeFileSync` (full-rewrite)         | `writeMasterDebtSync(items)`     |
| `scripts/debt/generate-views.js` L569        | `appendFileSync` (--ingest)            | `appendMasterDebtSync(newItems)` |
| `scripts/debt/backfill-hashes.js` L153       | `safeWriteFileSync`                    | `writeMasterDebtSync(items)`     |
| `scripts/debt/assign-roadmap-refs.js` L357   | `safeRenameSync` (atomic)              | `writeMasterDebtSync(items)`     |
| `scripts/debt/resolve-item.js` L89-90        | `safeWriteFileSync` + `safeRenameSync` | `writeMasterDebtSync(items)`     |
| `scripts/sync-sonarcloud.js` L801            | `safeAppendFileSync`                   | `appendMasterDebtSync(newItems)` |
| `scripts/debt/ingest-cleaned-intake.js` L165 | `safeAppendFileSync`                   | `appendMasterDebtSync(newItems)` |
| `scripts/debt/intake-manual.js` L282         | `safeAppendFileSync`                   | `appendMasterDebtSync(newItems)` |
| `scripts/debt/intake-pr-deferred.js` L271    | `safeAppendFileSync`                   | `appendMasterDebtSync(newItems)` |

Each migration:

1. Add
   `const { writeMasterDebtSync, appendMasterDebtSync } = require("../lib/safe-fs");`
   (adjust path)
2. Replace write call with central function
3. Remove any manual deduped.jsonl writes (now handled by central function)

**Testing approach:** Run `npm run debt:validate` after each migration to verify
MASTER_DEBT integrity. Run existing tests.

---

#### Step 2B: Switch rotations to archive-on-rotation (Findings 3 + 6)

**File:** `.claude/hooks/session-start.js`

Replace `rotateJsonl()` calls with `archiveRotateJsonl()`:

1. **reviews.jsonl** (line 459): `rotateJsonl(reviewsPath, 50, 30)` →
   `archiveRotateJsonl(reviewsPath, 50, 30)`
2. **hook-warnings-log.jsonl** (line 496):
   `rotateJsonl(hookWarningsPath, 50, 30)` →
   `archiveRotateJsonl(hookWarningsPath, 50, 30)`
3. Update log messages to include archived count:
   `rotated: X → Y entries (Z archived)`

---

#### Step 2C: Add file locking to agent-invocations.jsonl rotation (Finding 7)

**File:** `.claude/hooks/lib/track-agent-invocation.js` (or wherever rotation
happens)

Wrap the rotation in `withLock()`:

```js
const { withLock } = require("../../scripts/lib/safe-fs");
// ... inside rotation logic:
withLock(INVOCATIONS_FILE, () => {
  // existing rotation code
});
```

Also wrap append operations in the lock to prevent interleaved writes.

---

#### Step 2D: Shore up AI_REVIEW_LEARNINGS_LOG.md archive process (Finding 4)

**File:** `scripts/archive-reviews.js`

Add content hash verification before writing:

1. Before reading: compute SHA-256 of file contents, store as `hashBefore`
2. After processing, before writing: re-read file, compute hash, compare to
   `hashBefore`
3. If hash changed → abort with warning: "File modified during archival,
   aborting. Re-run."
4. If hash matches → proceed with atomic write (existing behavior)

This prevents data loss if the file is modified between read and write.

---

#### Step 2E: Code fence detection + dry-run for reconcile-roadmap.js (Finding 5)

**File:** `scripts/debt/reconcile-roadmap.js`

1. **Code fence detection:** In the CANON→DEBT replacement loop (lines 108-142),
   track whether current line is inside a fenced code block:

   ````js
   let inFence = false;
   for (const line of lines) {
     if (line.trimStart().startsWith("```")) inFence = !inFence;
     if (inFence) { keep line as-is; continue; }
     // existing CANON replacement logic
   }
   ````

2. **Dry-run is already the default** (`--write` flag required for actual write,
   line 31). No change needed for dry-run.

3. **Add diff summary:** Before writing, print a summary of what changed (N
   CANON references replaced, Grand Plan section updated Y/N).

---

### Wave 3: Automation Additions

#### Step 3A: Add reviews:sync to SessionStart hook (Finding 12)

**File:** `.claude/hooks/session-start.js`

Add `npm run reviews:sync -- --apply` as a standalone step BEFORE the rotation
block (around line 447). Currently it only runs AFTER rotation. We want it to
run every session start:

```js
// Sync reviews from markdown → JSONL (unblocks consolidation deadlock, Finding 12)
try {
  execFileSync("npm", ["run", "reviews:sync", "--", "--apply"], {
    cwd: projectDir,
    stdio: "pipe",
    timeout: 15000,
  });
} catch {
  // Non-fatal: session-begin will retry
}
```

Place this after the consolidation block (~line 445) and before the rotation
block (line 447). The post-rotation resync at line 466 stays as a safety net.

**Conflict check with DEBT-7582:** Safe. The collision detection in
`sync-reviews-to-jsonl.js` is idempotent and only triggers when there's an
actual content mismatch.

---

#### Step 3B: Full plan-file sync on debt resolution (Finding 13)

**File:** `scripts/debt/resolve-item.js`

Add a `--sync-plans` flag (on by default) that updates all plan files after
resolution:

1. After marking item RESOLVED in MASTER_DEBT.jsonl:
2. Run `scripts/debt/reconcile-roadmap.js --write` to update ROADMAP.md
3. Run `scripts/debt/generate-grand-plan.js` to regenerate GRAND_PLAN_V2.md +
   manifest
4. Search active plan files for the resolved DEBT-XXXX ID and print which files
   reference it

**Plan files to scan** (discovered in research):

- `ROADMAP.md` — milestone checkboxes (auto-updated by reconcile-roadmap)
- `docs/technical-debt/GRAND_PLAN_V2.md` — regenerated by generate-grand-plan.js
- `docs/technical-debt/logs/grand-plan-manifest.json` — regenerated by
  generate-grand-plan.js
- `ROADMAP_FUTURE.md` — scan for DEBT-ID, warn if found
- `ROADMAP_LOG.md` — scan for DEBT-ID, warn if found
- `docs/OPERATIONAL_VISIBILITY_SPRINT.md` — scan for DEBT-ID, warn if found
- `.claude/plans/*.md` — scan all for DEBT-ID, warn if found

For the scan-and-warn files: print
`"ℹ️ DEBT-XXXX also referenced in: ROADMAP_FUTURE.md (line 42)"` so the user
knows to check.

**Also update:** `scripts/debt/resolve-bulk.js` to call the same sync logic
after bulk resolution.

---

#### Step 3C: Atomic fail-safe for docs:index generation (Finding 1)

**File:** `.husky/pre-commit` (lines 294-304)

Change the pre-commit hook to write to a temp file first:

```bash
# Current:
npm run docs:index > /dev/null 2>&1

# New:
cp DOCUMENTATION_INDEX.md DOCUMENTATION_INDEX.md.bak 2>/dev/null || true
if npm run docs:index > /dev/null 2>&1; then
  npx prettier --write DOCUMENTATION_INDEX.md > /dev/null 2>&1 || true
  git add DOCUMENTATION_INDEX.md
  echo "  ✅ Documentation index updated and staged"
else
  # Restore original on failure
  if [ -f DOCUMENTATION_INDEX.md.bak ]; then
    mv DOCUMENTATION_INDEX.md.bak DOCUMENTATION_INDEX.md
  fi
  echo "  ⚠️ Documentation index generation failed, original preserved (non-blocking)"
fi
rm -f DOCUMENTATION_INDEX.md.bak 2>/dev/null || true
```

This ensures: if `docs:index` crashes mid-generation, the original file is
restored. No partial/broken index gets committed.

---

### Wave 4: Testing & Validation

#### Step 4A: Run existing test suite

- `npm test` — verify no regressions
- `npm run lint` — ESLint clean
- `npm run debt:validate` — TDMS schema integrity
- `npm run patterns:check` — pattern compliance

#### Step 4B: Manual validation of key scenarios

1. Verify `writeMasterDebtSync` writes to both MASTER and deduped
2. Verify `archiveRotateJsonl` creates .archive files
3. Verify `resolve-item.js --sync-plans` triggers reconcile + grand plan regen
4. Verify pre-commit docs:index failure restores original file
5. Verify `reviews:sync` runs on session-start without errors

#### Step 4C: Commit and push

---

## Execution Order

| Order | Step                                          | Dependencies | Est. Files Changed                   |
| ----- | --------------------------------------------- | ------------ | ------------------------------------ |
| 1     | 1A: File locking in safe-fs.js                | None         | 2 (safe-fs.js + test)                |
| 2     | 1B: writeMasterDebt in safe-fs.js             | 1A           | 2 (safe-fs.js + test)                |
| 3     | 1C: archiveRotateJsonl in rotate-state.js     | 1A           | 1                                    |
| 4     | 2A: Migrate 9 MASTER_DEBT writers             | 1B           | 9 scripts                            |
| 5     | 2B: Switch rotations to archive               | 1C           | 1 (session-start.js)                 |
| 6     | 2C: Lock agent-invocations rotation           | 1A           | 1                                    |
| 7     | 2D: Content hash in archive-reviews.js        | None         | 1                                    |
| 8     | 2E: Code fence detection in reconcile-roadmap | None         | 1                                    |
| 9     | 3A: reviews:sync in SessionStart              | None         | 1 (session-start.js)                 |
| 10    | 3B: Plan-file sync on resolution              | None         | 2 (resolve-item.js, resolve-bulk.js) |
| 11    | 3C: Atomic docs:index in pre-commit           | None         | 1 (.husky/pre-commit)                |
| 12    | 4A-C: Test, validate, commit                  | All above    | 0                                    |

**Total files modified:** ~20 scripts + 1-2 test files **New files:** 0 (all
changes in existing files)

---

## Risk Assessment

| Risk                                                  | Mitigation                                                                |
| ----------------------------------------------------- | ------------------------------------------------------------------------- |
| Lock deadlock if process crashes mid-lock             | 60s stale lock auto-break (single-user CLI)                               |
| writeMasterDebt path discovery wrong                  | Accept path overrides; default from `__dirname`                           |
| reconcile-roadmap fence toggle wrong on nested fences | Only toggle on lines starting with ``` (standard markdown)                |
| reviews:sync in SessionStart adds latency             | 15s timeout, non-fatal on failure                                         |
| Plan-file scan false positives                        | Scan-and-warn only; no auto-edits to plan files beyond ROADMAP+GRAND_PLAN |

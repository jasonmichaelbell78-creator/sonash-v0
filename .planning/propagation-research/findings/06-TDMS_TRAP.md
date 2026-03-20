# Finding 06: TDMS Dual-File Write Trap

## Summary

The TDMS pipeline has a structural vulnerability where `MASTER_DEBT.jsonl` and
`raw/deduped.jsonl` must stay in sync but are treated as a "paired" system with
inconsistent write patterns across scripts. While a centralized dual-write
mechanism (`appendMasterDebtSync` / `writeMasterDebtSync`) exists in
`scripts/lib/safe-fs.js`, several scripts bypass it or use it in ways that
create divergence. The current state shows **MASTER has 8,461 lines while
deduped has 3,915 lines** -- a 2.16x discrepancy.

## 1. File Structure Map

### Canonical Data (paired -- must stay in sync)

| File                                    | Role                                                                | Current Lines |
| --------------------------------------- | ------------------------------------------------------------------- | ------------- |
| `docs/technical-debt/MASTER_DEBT.jsonl` | Single source of truth. All DEBT-XXXX items live here.              | 8,461         |
| `docs/technical-debt/raw/deduped.jsonl` | Pipeline intermediate. Input for `generate-views.js --ingest` mode. | 3,915         |

### Pipeline Intermediates (not paired)

| File                                              | Role                                                                 |
| ------------------------------------------------- | -------------------------------------------------------------------- |
| `docs/technical-debt/raw/normalized-all.jsonl`    | Input for `dedup-multi-pass.js`. Aggregation of all raw extractions. |
| `docs/technical-debt/raw/audits.jsonl`            | Raw extracted audit findings.                                        |
| `docs/technical-debt/raw/reviews.jsonl`           | Raw extracted review findings.                                       |
| `docs/technical-debt/raw/scattered-intake*.jsonl` | Raw scattered debt extractions.                                      |

### Generated Views (derived from MASTER, never written back)

| File                                              | Generator             |
| ------------------------------------------------- | --------------------- |
| `docs/technical-debt/INDEX.md`                    | `generate-views.js`   |
| `docs/technical-debt/views/by-severity.md`        | `generate-views.js`   |
| `docs/technical-debt/views/by-category.md`        | `generate-views.js`   |
| `docs/technical-debt/views/by-status.md`          | `generate-views.js`   |
| `docs/technical-debt/views/verification-queue.md` | `generate-views.js`   |
| `docs/technical-debt/LEGACY_ID_MAPPING.json`      | `generate-views.js`   |
| `docs/technical-debt/metrics.json`                | `generate-metrics.js` |

## 2. The Dual-Write Mechanism

`scripts/lib/safe-fs.js` provides two functions that enforce paired writes:

### `writeMasterDebtSync(items)`

Full rewrite of both files. Used by scripts that load-modify-save all items:

```
atomicWriteViaTmp(masterPath, content);  // full rewrite MASTER
atomicWriteViaTmp(dedupedPath, content); // full rewrite deduped (IDENTICAL content)
```

### `appendMasterDebtSync(newItems)`

Append to both files. Used by intake scripts:

```
safeAppendFileSync(masterPath, content);  // append to MASTER
safeAppendFileSync(dedupedPath, content); // append to deduped
// With rollback on partial failure
```

**These are the ONLY safe write paths.** Any script that bypasses them creates
divergence.

## 3. Script Write Audit

### Scripts using the safe dual-write mechanism (CORRECT)

| Script                         | Function                                       | Operation                              |
| ------------------------------ | ---------------------------------------------- | -------------------------------------- |
| `intake-manual.js`             | `appendMasterDebtSync([newItem])`              | Append single item to both             |
| `intake-pr-deferred.js`        | `appendMasterDebtSync([newItem])`              | Append single item to both             |
| `ingest-cleaned-intake.js`     | `appendMasterDebtSync(newItems)`               | Append batch to both                   |
| `resolve-item.js`              | `writeMasterDebtSync(items)`                   | Full rewrite both + sync-deduped after |
| `backfill-hashes.js`           | `writeMasterDebtSync(parsedItems)`             | Full rewrite both                      |
| `assign-roadmap-refs.js`       | `writeMasterDebtSync(allItems)`                | Full rewrite both                      |
| `sync-sonarcloud.js`           | `writeMasterDebtSync` + `appendMasterDebtSync` | Both operations                        |
| `generate-views.js` (--ingest) | `appendMasterDebtSync(newItems)`               | Append new deduped items to MASTER     |

### Scripts with custom dual-write (MANUAL atomicity)

| Script                  | Writes To             | Mechanism                       |
| ----------------------- | --------------------- | ------------------------------- |
| `verify-resolutions.js` | Both MASTER + deduped | Manual tmp+rename with rollback |
| `reverify-resolved.js`  | Both MASTER + deduped | Manual tmp+rename with rollback |

### CRITICAL: Scripts that write to ONE file without the other

| Script                        | Writes To                         | Misses                               | Severity |
| ----------------------------- | --------------------------------- | ------------------------------------ | -------- |
| **`intake-audit.js`**         | `deduped.jsonl` only (line 870)   | MASTER_DEBT.jsonl                    | **HIGH** |
| **`intake-audit.js`**         | `normalized-all.jsonl` (line 865) | N/A (intermediate)                   | Low      |
| `sync-deduped.js --apply`     | `deduped.jsonl` only              | N/A (intentional: syncs FROM master) | N/A      |
| `generate-views.js` (default) | Views only (reads MASTER)         | N/A (read-only for data)             | N/A      |

## 4. The Exact Failure Scenario

### Scenario A: intake-audit.js creates orphaned deduped entries

**Step 1:** `intake-audit.js` is called with new audit findings.

**Step 2:** Items are written to `raw/deduped.jsonl` (line 870) and
`raw/normalized-all.jsonl` (line 865), but NOT to `MASTER_DEBT.jsonl`.

**Step 3:** `intake-audit.js` runs `dedup-multi-pass.js` (line 906), which reads
from `normalized-all.jsonl` and rewrites `deduped.jsonl`. Items are in deduped.

**Step 4:** `intake-audit.js` runs `generate-views.js` WITHOUT `--ingest` (line
916). This function calls `loadMasterItems()` which reads from
`MASTER_DEBT.jsonl` only. The new items are NOT in MASTER, so views do NOT
include them.

**Step 5:** `intake-audit.js` then runs `assign-roadmap-refs.js` (line 930),
which loads MASTER, assigns roadmap refs, and calls
`writeMasterDebtSync(items)`. This full-rewrites BOTH files with MASTER's
content, **destroying the items that were only in deduped**.

**Result:** Items that entered through `intake-audit.js` are silently destroyed.
They existed briefly in `deduped.jsonl` but never reached `MASTER_DEBT.jsonl`,
and were then overwritten when `assign-roadmap-refs.js` did a full dual-rewrite.

### Scenario B: writeMasterDebtSync destroys deduped-only items

**Step 1:** Any script adds items to `deduped.jsonl` only (e.g., via
`intake-audit.js` or manual pipeline).

**Step 2:** Before `generate-views.js --ingest` runs to promote them to MASTER,
another script calls `writeMasterDebtSync(items)` (resolve-item,
backfill-hashes, assign-roadmap-refs, sync-sonarcloud).

**Step 3:** `writeMasterDebtSync` writes MASTER's content to BOTH files. Any
deduped-only items are overwritten.

### Scenario C: Historical overwrite (Session #179, documented)

The `sync-deduped.js` header comment documents this directly:

> "generate-views.js reads from deduped.jsonl and OVERWRITES MASTER_DEBT.jsonl.
> If severity or status changes are made to MASTER (e.g., S0 demotions), they
> get reverted unless deduped is also updated."

Review #348 (REVIEWS_342-383.md:287-294) documents the actual incident:

> "Evidence dedup in R2 used `generate-views.js` which overwrites MASTER_DEBT
> from deduped.jsonl. The deduped.jsonl had fewer items than main's MASTER_DEBT
> (missing ROADMAP-referenced IDs). Fixed by merging committed + main entries."

Review #339 (REVIEWS_300-341.md:611) confirms:

> "MASTER_DEBT.jsonl sync: 5 entries lost due to generate-views.js overwrite
> bug."

## 5. Current State Assessment

### Line Count Discrepancy

- **MASTER_DEBT.jsonl**: 8,461 lines
- **raw/deduped.jsonl**: 3,915 lines
- **Delta**: 4,546 items exist in MASTER but not in deduped

This is a **known and intentional** state resulting from the architectural
evolution. The current `generate-views.js` default mode reads from MASTER (not
deduped), so the views are correct. The discrepancy means:

1. Items added via `appendMasterDebtSync` are in both files (correct).
2. Items promoted to MASTER via `generate-views.js --ingest` were added to
   MASTER but deduped was not pruned of consumed items (expected accumulation).
3. Items added by the old `generate-views.js` `readAndAssignIds()` path (which
   read deduped and wrote MASTER) created MASTER entries without deduped
   equivalents (items from MASTER get `mergeManualItems` treatment).
4. `writeMasterDebtSync` full-rewrites of BOTH files to match MASTER content
   have periodically wiped deduped-only items.

### Is it currently causing data loss?

**Not actively**, because:

- The current `generate-views.js` default mode reads MASTER (not deduped)
- `resolve-item.js` calls `sync-deduped.js --apply` after each resolution
- `writeMasterDebtSync` now writes identical content to both files

**But the trap is latent:**

- `intake-audit.js` still writes to deduped without MASTER (lines 867-870)
- If `generate-views.js` is ever called with `--ingest` after intake-audit, it
  would try to merge deduped items into MASTER, potentially creating duplicates
- If `assign-roadmap-refs.js` runs after `intake-audit.js` but before
  `--ingest`, deduped-only items are destroyed

## 6. Historical Incidents

| When          | What                                             | Items Lost | Root Cause                                                                     |
| ------------- | ------------------------------------------------ | ---------- | ------------------------------------------------------------------------------ |
| Session ~#179 | S0 severity demotions reverted                   | Unknown    | Changes to MASTER overwritten by generate-views reading stale deduped          |
| Review #339   | 5 entries lost                                   | 5          | generate-views.js overwrite bug                                                |
| Review #348   | ROADMAP-referenced IDs lost                      | Multiple   | Evidence dedup used generate-views which overwrote MASTER from smaller deduped |
| PR #383       | 4 scripts had sequential writes without rollback | Prevented  | Fixed with atomic dual-file writes + rollback                                  |

## 7. Remediation Proposals

### Option A: Single-Writer Enforcement (Recommended)

**All TDMS data writes go through `safe-fs.js` dual-write functions. No
exceptions.**

Fix `intake-audit.js` (the remaining violator):

- Replace lines 862-870 (direct writes to normalized-all + deduped) with
  `appendMasterDebtSync(newItems)` to write to both MASTER and deduped
- Remove the separate dedup-multi-pass + generate-views calls since items are
  already in MASTER
- Or: keep dedup pipeline but have it write via `appendMasterDebtSync` at the
  end

Estimated effort: E1 (modify ~20 lines in intake-audit.js)

### Option B: Validation Script (Defense in Depth)

Add a `validate-sync.js` script that:

1. Counts items in MASTER vs deduped
2. Checks that all deduped `content_hash` values exist in MASTER
3. Reports orphaned items in either direction
4. Can run in CI or pre-commit

```bash
node scripts/debt/validate-sync.js  # exits non-zero if out of sync
```

Estimated effort: E1

### Option C: Pre-Commit Hook Check

Add a check to the pre-commit hook that:

1. If any file in `docs/technical-debt/` is staged
2. Run `validate-sync.js`
3. Block commit if files are out of sync

Estimated effort: E0

### Option D: Eliminate deduped.jsonl as a Required Pair

Since MASTER is the single source of truth and `generate-views.js` default mode
already reads from MASTER:

1. Make deduped.jsonl purely a pipeline scratch file (input to dedup-multi-pass)
2. Remove it from the `writeMasterDebtSync` dual-write
3. Only `generate-views.js --ingest` reads deduped and promotes to MASTER
4. `sync-deduped.js` becomes unnecessary

This is the cleanest architectural fix but requires the most refactoring.

Estimated effort: E2

### Recommended Approach: A + B

1. Fix `intake-audit.js` to use `appendMasterDebtSync` (Option A)
2. Add `validate-sync.js` for ongoing detection (Option B)
3. Defer Option D to a future session (requires broader refactoring)

## 8. Key Files

| File                     | Path                                                                      |
| ------------------------ | ------------------------------------------------------------------------- |
| Safe-fs dual-write       | `scripts/lib/safe-fs.js` (lines 446-490)                                  |
| Generate views           | `scripts/debt/generate-views.js`                                          |
| Intake audit (violator)  | `scripts/debt/intake-audit.js` (lines 862-870)                            |
| Sync deduped             | `scripts/debt/sync-deduped.js`                                            |
| Resolve item (with sync) | `scripts/debt/resolve-item.js` (lines 203-211, 237-245)                   |
| Fix template #36         | `docs/agent_docs/FIX_TEMPLATES.md` (lines 1845-1903)                      |
| Positive patterns        | `docs/agent_docs/POSITIVE_PATTERNS.md` (lines 722-737)                    |
| PROCEDURE guide          | `docs/technical-debt/PROCEDURE.md`                                        |
| Historical incident      | `docs/archive/reviews-markdown-legacy/REVIEWS_342-383.md` (lines 287-294) |
| Historical data loss     | `docs/archive/reviews-markdown-legacy/REVIEWS_300-341.md` (line 611)      |
| Rollback fix             | `docs/archive/RETROS_378-416.md` (lines 681-683)                          |

## 9. Root Cause Classification

**Propagation failure type:** Dual-file write asymmetry

**Why it persists:**

1. `intake-audit.js` was written to feed the pipeline (normalized -> dedup ->
   generate-views), not to write to MASTER directly. This made sense when
   `generate-views.js` was the only path to MASTER.
2. When `generate-views.js` was refactored to read from MASTER (not deduped) as
   the default mode, `intake-audit.js` was not updated to compensate.
3. The `appendMasterDebtSync` function was added later (PR #383 era) as a
   centralized fix, but `intake-audit.js` predates it and was never migrated.
4. The file count discrepancy (8,461 vs 3,915) looks alarming but is mostly
   accumulated divergence, not active data loss.

**The trap:** Any new script author who sees `deduped.jsonl` as an input file
will naturally write to it without knowing about the MASTER pairing requirement.
The `safe-fs.js` dual-write functions exist but are not enforced -- nothing
prevents direct `safeAppendFileSync(DEDUPED_FILE, ...)` calls.

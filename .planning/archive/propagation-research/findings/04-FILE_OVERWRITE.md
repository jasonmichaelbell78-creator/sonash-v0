# Finding 04: File Overwrite and Data Loss Propagation Risks

**Date:** 2026-03-20 **Researcher:** Claude Opus 4.6 (1M context) **Status:**
COMPLETE

---

## Executive Summary

The codebase has **extensive infrastructure** for safe file writes (advisory
locking, atomic writes, symlink guards, central writer functions) but **adoption
is inconsistent**. Several high-traffic JSONL files have multiple writers, and
not all writers use the locking mechanisms available to them. The highest-risk
scenario is the MASTER_DEBT dual-file write pattern, where 3 scripts bypass the
central writer and 2 use no locking at all.

---

## 1. MASTER_DEBT.jsonl — The Dual-File Write Trap

### File Locations

- `docs/technical-debt/MASTER_DEBT.jsonl` (canonical debt registry)
- `docs/technical-debt/raw/deduped.jsonl` (must stay in sync)

### Central Writer (safe-fs.js)

`scripts/lib/safe-fs.js` provides two central functions:

- **`writeMasterDebtSync(items)`** — full rewrite of both files under lock
- **`appendMasterDebtSync(newItems)`** — append to both files under lock, with
  rollback on partial failure

Both use `withLock()` (advisory lock via `O_EXCL` file creation) and atomic
write via tmp+rename.

### Writers Using the Central Writer (SAFE)

| Script                                  | Function Used                                  | Write Pattern         |
| --------------------------------------- | ---------------------------------------------- | --------------------- |
| `scripts/debt/sync-sonarcloud.js`       | `writeMasterDebtSync` + `appendMasterDebtSync` | Full rewrite + append |
| `scripts/debt/resolve-item.js`          | `writeMasterDebtSync`                          | Full rewrite          |
| `scripts/debt/intake-pr-deferred.js`    | `appendMasterDebtSync`                         | Append                |
| `scripts/debt/intake-manual.js`         | `appendMasterDebtSync`                         | Append                |
| `scripts/debt/ingest-cleaned-intake.js` | `appendMasterDebtSync`                         | Append                |
| `scripts/debt/generate-views.js`        | `writeMasterDebtSync` + `appendMasterDebtSync` | Full rewrite + append |
| `scripts/debt/backfill-hashes.js`       | `writeMasterDebtSync`                          | Full rewrite          |
| `scripts/debt/assign-roadmap-refs.js`   | `writeMasterDebtSync`                          | Full rewrite          |

**Total: 8 scripts, all using advisory locking.**

### Writers BYPASSING the Central Writer (UNSAFE)

| Script                               | Write Pattern                              | Locking  | Risk   |
| ------------------------------------ | ------------------------------------------ | -------- | ------ |
| `scripts/debt/reverify-resolved.js`  | Manual tmp+rename to both MASTER + deduped | **NONE** | HIGH   |
| `scripts/debt/verify-resolutions.js` | Manual tmp+rename to both MASTER + deduped | **NONE** | HIGH   |
| `scripts/audit-s0-promotions.js`     | Manual tmp+rename to both MASTER + deduped | **NONE** | HIGH   |
| `scripts/debt/dedup-multi-pass.js`   | `safeWriteFileSync` to deduped.jsonl ONLY  | **NONE** | HIGH   |
| `scripts/debt/sync-deduped.js`       | `safeWriteFileSync` to deduped.jsonl ONLY  | **NONE** | MEDIUM |

### Race Condition Scenario: MASTER_DEBT

```
Time    Script A (resolve-item.js)         Script B (reverify-resolved.js)
─────   ──────────────────────────────    ──────────────────────────────────
T1      acquireLock(MASTER_DEBT)           reads MASTER_DEBT (no lock)
T2      reads MASTER_DEBT                  reads deduped.jsonl
T3      modifies item status               modifies item statuses
T4      writes MASTER_DEBT.tmp             writes MASTER_DEBT.tmp (different PID suffix? NO — same .tmp)
T5      renames tmp → MASTER_DEBT          renames tmp → MASTER_DEBT (OVERWRITES A's write)
T6      writes deduped.jsonl.tmp           writes deduped.jsonl.tmp
T7      releaseLock                        renames tmp → deduped.jsonl
```

**Result:** Script A's changes to MASTER_DEBT are lost. The advisory lock
acquired by Script A is invisible to Script B because Script B doesn't call
`acquireLock` at all.

### The dedup-multi-pass.js Desync

`dedup-multi-pass.js` writes to `deduped.jsonl` but NOT to `MASTER_DEBT.jsonl`.
This is by design (it produces the deduped output that `generate-views.js` later
ingests). However, if `dedup-multi-pass.js` runs while another script is writing
to both files via the central writer, the central writer's deduped.jsonl write
could be immediately overwritten.

### Probability Assessment

- **Low for concurrent scripts**: These are CLI scripts run manually or via
  `consolidate-all.js` (which runs them sequentially). True concurrent execution
  requires running two scripts in separate terminals simultaneously.
- **Medium for consolidate-all.js pipeline**: If a user runs
  `consolidate-all.js` while also running `resolve-item.js` in another terminal,
  the pipeline's sequential writes can collide with the manual script's writes.

### Impact Assessment

- **Data loss**: Status changes, severity changes, or new items silently
  reverted or lost.
- **Downstream breakage**: `generate-views.js` produces incorrect markdown
  views. Debt items appear in wrong status. Metrics become inaccurate.
- **Silent failure**: No error is raised. The overwritten data simply
  disappears.

---

## 2. reviews.jsonl — Multiple Writers, No Shared Lock

### File Location

- `.claude/state/reviews.jsonl` (canonical review records)
- `.claude/state/reviews-archive.jsonl` (archived old entries)

### Writers

| Writer                                                | Write Pattern                                                                  | Locking  | When              |
| ----------------------------------------------------- | ------------------------------------------------------------------------------ | -------- | ----------------- |
| `scripts/reviews/lib/write-jsonl.ts` (`appendRecord`) | Append under `withLock`                                                        | **YES**  | PR review capture |
| `scripts/review-lifecycle.js` (SYNC step)             | `safeAppendFileSync`                                                           | **NONE** | Session start     |
| `scripts/review-lifecycle.js` (ARCHIVE step)          | `safeAtomicWriteSync` (full rewrite to trim) + `safeAppendFileSync` to archive | **NONE** | Session start     |

### Race Condition: Append vs Archive

```
Time    write-review-record.ts              review-lifecycle.js (ARCHIVE)
─────   ──────────────────────────          ────────────────────────────────
T1      acquireLock(reviews.jsonl)          loadReviews() → reads 35 entries
T2      appendFileSync(new record)          sorts entries, picks 20 to keep
T3      releaseLock                         safeAtomicWriteSync(reviews.jsonl, 20 entries)
                                            ↑ OVERWRITES the record appended at T2
```

**Result:** The review record written at T2 is silently lost because the archive
step did a full rewrite with its stale snapshot of the file.

### Probability Assessment

- **Very low**: `review-lifecycle.js` runs at session start, and
  `write-review-record.ts` runs during PR reviews. These rarely overlap.
  However, if an agent is running PR review while another agent starts a
  session, the race is possible.

### Impact Assessment

- **Lost review record**: A single PR review record disappears.
- **Cross-database inconsistency**: `review-metrics.jsonl` may have a
  corresponding metrics entry with no matching review record.
- **Moderate**: Review data is supplementary (the learnings log markdown still
  exists as backup).

---

## 3. hook-warnings-log.jsonl — Append-Only, Single Writer

### File Location

- `.claude/state/hook-warnings-log.jsonl`

### Writers

| Writer                                               | Write Pattern        | Locking  |
| ---------------------------------------------------- | -------------------- | -------- |
| `scripts/append-hook-warning.js` (`writeAuditTrail`) | `safeAppendFileSync` | **NONE** |

### Rotation

- Listed in `config/rotation-policy.json` under "operational" tier (30-day max
  age)
- `scripts/rotate-jsonl.js` calls `expireJsonlByAge()` which does a
  read-filter-rewrite (no locking)

### Race Condition: Append vs Rotation

```
Time    append-hook-warning.js (pre-commit)   rotate-jsonl.js (session start)
─────   ────────────────────────────────────   ────────────────────────────────
T1      safeAppendFileSync(new warning)        reads file, filters old entries
T2                                             writes .tmp with filtered entries
T3                                             renames .tmp → file (LOSES T1 append)
```

### Probability: Very Low

`rotate-jsonl.js` runs at session start. `append-hook-warning.js` runs during
git hooks. These would only collide if a git commit is happening at the exact
moment a session starts rotation.

### Impact: Low

One hook warning entry is lost. These are ephemeral operational data.

---

## 4. agent-invocations.jsonl — Locked Append with Inline Rotation

### File Location

- `.claude/state/agent-invocations.jsonl`

### Writers

| Writer                                    | Write Pattern                           | Locking                                               |
| ----------------------------------------- | --------------------------------------- | ----------------------------------------------------- |
| `.claude/hooks/track-agent-invocation.js` | `appendFileSync` + inline `rotateJsonl` | **YES** (`withLock` when available, fallback to none) |

### Rotation

- Inline in the hook: when file > 32KB, `rotateJsonl(path, 100, 100)`
- Also in `config/rotation-policy.json` under "operational" tier (30-day expiry)
- `rotate-jsonl.js` calls `expireJsonlByAge()` (no locking)

### Race Condition: Inline Rotation vs External Rotation

The inline rotation in `track-agent-invocation.js` uses `withLock`. But
`rotate-jsonl.js` does NOT use locking. If both rotate at the same time, the
external rotation could overwrite the inline rotation's output.

### Probability: Very Low

Both would need to trigger simultaneously (hook fires while session-start
rotation is running).

### Impact: Low

Some agent invocation records lost. These are observability data only.

---

## 5. hook-runs.jsonl — Inline Rotation, No Locking

### File Location

- `.claude/state/hook-runs.jsonl`

### Writers

| Writer                                        | Write Pattern                                 | Locking  |
| --------------------------------------------- | --------------------------------------------- | -------- |
| `.husky/_shared.sh` (`write_hook_runs_jsonl`) | Read-all, filter to 100, append, full rewrite | **NONE** |

### Pattern Detail

The writer in `_shared.sh` does a full read-modify-write cycle:

1. Reads all existing lines
2. If > 200, keeps last 100
3. Appends new entry
4. `writeFileSync` (full rewrite)

This is a classic read-modify-write without locking.

### Race Condition

```
Time    pre-commit hook (terminal A)     pre-push hook (terminal B)
─────   ──────────────────────────       ─────────────────────────
T1      reads 199 entries                reads 199 entries
T2      appends entry → 200              appends entry → 200
T3      writeFileSync (200 entries)      writeFileSync (200 entries, missing A's entry)
```

### Probability: Very Low

Pre-commit and pre-push hooks rarely run simultaneously. A user would need to
`git commit` in one terminal and `git push` in another at the same instant.

### Impact: Low

One hook run record lost. Purely operational observability data.

---

## 6. review-metrics.jsonl — Multiple Writers, No Locking

### File Location

- `.claude/state/review-metrics.jsonl`

### Writers

| Writer                                    | Write Pattern                                                                      | Locking  |
| ----------------------------------------- | ---------------------------------------------------------------------------------- | -------- |
| `scripts/metrics/review-churn-tracker.js` | Append or full rewrite (`safeAtomicWriteSync` / `safeWriteFileSync` with flag 'a') | **NONE** |
| `scripts/metrics/dedup-review-metrics.js` | Full rewrite (`safeAtomicWriteSync`)                                               | **NONE** |

### Rotation

- Listed in `config/rotation-policy.json` under "historical" tier (90-day)
- `rotate-jsonl.js` calls `expireJsonlByAge()` (no locking)

### Race Condition

If `review-churn-tracker.js` appends while `dedup-review-metrics.js` does a full
rewrite, the append is lost. Both are CLI tools run manually.

### Probability: Very Low

### Impact: Low-Medium

Lost metrics entries. Can be regenerated from source data.

---

## 7. Existing Locking Infrastructure Inventory

### What Exists

| Mechanism                                  | Location                                                                | Used By                                                                    |
| ------------------------------------------ | ----------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Advisory file lock (`O_EXCL` `.lock` file) | `scripts/lib/safe-fs.js` (`acquireLock`/`releaseLock`/`withLock`)       | Central MASTER_DEBT writers, `write-jsonl.ts`, `track-agent-invocation.js` |
| Atomic write (tmp+rename)                  | `scripts/lib/safe-fs.js` (`safeAtomicWriteSync`)                        | Many scripts                                                               |
| Symlink guard                              | `.claude/hooks/lib/symlink-guard.js`, `scripts/lib/safe-fs.js`          | All safe-fs consumers                                                      |
| ESLint rule                                | `eslint-plugin-sonash/rules/no-non-atomic-write.js`                     | CI enforcement                                                             |
| Stale lock detection                       | `scripts/lib/safe-fs.js` (`isLockHolderAlive`, 60s timeout + PID check) | All `withLock` consumers                                                   |
| `archiveRotateJsonl` with lock             | `.claude/hooks/lib/rotate-state.js`                                     | Only used by `track-agent-invocation.js`                                   |

### What Does NOT Exist

- No locking in `rotate-jsonl.js` (the central rotation script)
- No locking in `review-lifecycle.js` (writes to reviews.jsonl)
- No locking in `reverify-resolved.js`, `verify-resolutions.js`,
  `audit-s0-promotions.js` (write to MASTER_DEBT + deduped)
- No locking in `review-churn-tracker.js` or `dedup-review-metrics.js`
- No locking in `hook-runs.jsonl` writer (\_shared.sh)
- No locking in `dedup-multi-pass.js` or `sync-deduped.js`

---

## 8. Risk Matrix

| File                              | Writers               | Bypass Writers                 | Locking Gap            | Probability | Impact                  | Risk       |
| --------------------------------- | --------------------- | ------------------------------ | ---------------------- | ----------- | ----------------------- | ---------- |
| MASTER_DEBT.jsonl + deduped.jsonl | 13 total              | 5 bypass central writer        | 5 scripts lack locking | Low         | HIGH (silent data loss) | **HIGH**   |
| reviews.jsonl                     | 3                     | 2 lack locking                 | review-lifecycle.js    | Very Low    | Medium                  | **MEDIUM** |
| review-metrics.jsonl              | 3 (incl. rotation)    | All lack locking               | All writers            | Very Low    | Low-Medium              | **LOW**    |
| hook-warnings-log.jsonl           | 2 (incl. rotation)    | Rotation lacks locking         | Rotation               | Very Low    | Low                     | **LOW**    |
| agent-invocations.jsonl           | 2 (inline + rotation) | External rotation              | Rotation               | Very Low    | Low                     | **LOW**    |
| hook-runs.jsonl                   | 1                     | Read-modify-write without lock | Writer itself          | Very Low    | Low                     | **LOW**    |

---

## 9. Remediation Recommendations

### R1: Migrate Bypass MASTER_DEBT Writers to Central Writer (HIGH PRIORITY)

**Scripts to fix:**

- `scripts/debt/reverify-resolved.js` — Replace manual tmp+rename with
  `writeMasterDebtSync(items)`. This gives locking + dual-file write for free.
- `scripts/debt/verify-resolutions.js` — Same migration.
- `scripts/audit-s0-promotions.js` — Same migration.

**Effort:** Low. These scripts already read-modify-write the full item array.
Replace the manual write block with a single `writeMasterDebtSync(items)` call.

### R2: Add Locking to deduped.jsonl-Only Writers (HIGH PRIORITY)

**Scripts to fix:**

- `scripts/debt/dedup-multi-pass.js` — Add
  `withLock(MASTER_DEBT_PATH, () => { ... })`. Even though it only writes
  deduped, it should lock MASTER_DEBT to prevent the central writer from
  concurrently writing deduped.
- `scripts/debt/sync-deduped.js` — Same pattern.

### R3: Add Locking to review-lifecycle.js (MEDIUM PRIORITY)

Wrap both the SYNC and ARCHIVE steps in `withLock(REVIEWS_JSONL, ...)`. The
`write-jsonl.ts` already locks this file, so lifecycle must also lock to prevent
archive-vs-append races.

### R4: Add Locking to rotate-jsonl.js (MEDIUM PRIORITY)

The central rotation script should `withLock(filePath, ...)` each file before
reading, filtering, and rewriting. This prevents append-vs-rotation races for
all JSONL files in the rotation policy.

### R5: Add Locking to review-churn-tracker.js and dedup-review-metrics.js (LOW PRIORITY)

Both should use `withLock(METRICS_FILE, ...)` around their write operations.

### R6: Add Locking to hook-runs.jsonl Writer (LOW PRIORITY)

The inline Node.js code in `_shared.sh` should use `withLock` from safe-fs. It
already runs Node, so it can `require` safe-fs.

### R7: Consider Single-Writer Pattern for MASTER_DEBT (LONG-TERM)

Instead of 13 scripts all writing to MASTER_DEBT.jsonl, consider a message-queue
or command pattern where all mutations go through a single coordinator script.
This eliminates the need for distributed locking entirely.

---

## 10. The Dual-File Write Trap in Detail

### What It Is

MASTER_DEBT.jsonl and deduped.jsonl MUST stay synchronized. The central writer
(`writeMasterDebtSync` / `appendMasterDebtSync`) enforces this by writing both
files atomically under a single lock, with rollback on partial failure.

### What Breaks It

1. **Bypass writers** (R1 above) write to both files but without locking. If
   they run concurrently with a central-writer script, one file gets the central
   writer's version and the other gets the bypass writer's version.

2. **deduped-only writers** (`dedup-multi-pass.js`, `sync-deduped.js`)
   intentionally write only deduped.jsonl. This is correct for their use case
   (pipeline stage), but creates a window where deduped != MASTER.

3. **generate-views.js --ingest** reads deduped.jsonl, assigns DEBT IDs to new
   items, then calls `writeMasterDebtSync` (full rewrite) and
   `appendMasterDebtSync` (for new items). If deduped.jsonl was modified between
   the read and the write, the generated views reflect stale data.

### What Happens on Desync

- `generate-views.js` reads deduped → generates views → writes MASTER
- If deduped has items that MASTER doesn't (or vice versa), the next
  `generate-views.js` run will "fix" it by overwriting MASTER with deduped's
  content, silently dropping any MASTER-only changes.
- The `sync-deduped.js` script exists specifically to back-propagate MASTER
  changes to deduped, but it also has no locking.

---

## Appendix A: File Write Pattern Catalog

### Append Writers (safe if serialized)

- `scripts/debt/intake-pr-deferred.js` → `appendMasterDebtSync`
- `scripts/debt/intake-manual.js` → `appendMasterDebtSync`
- `scripts/debt/ingest-cleaned-intake.js` → `appendMasterDebtSync`
- `scripts/reviews/lib/write-jsonl.ts` → `appendRecord` with lock
- `scripts/append-hook-warning.js` → `safeAppendFileSync` (no lock)
- `.claude/hooks/track-agent-invocation.js` → `appendFileSync` with lock

### Full-Rewrite Writers (dangerous if concurrent)

- `scripts/debt/generate-views.js` → `writeMasterDebtSync` (locked)
- `scripts/debt/resolve-item.js` → `writeMasterDebtSync` (locked)
- `scripts/debt/backfill-hashes.js` → `writeMasterDebtSync` (locked)
- `scripts/debt/assign-roadmap-refs.js` → `writeMasterDebtSync` (locked)
- `scripts/debt/sync-sonarcloud.js` → `writeMasterDebtSync` (locked)
- `scripts/debt/reverify-resolved.js` → manual tmp+rename (**NO LOCK**)
- `scripts/debt/verify-resolutions.js` → manual tmp+rename (**NO LOCK**)
- `scripts/audit-s0-promotions.js` → manual tmp+rename (**NO LOCK**)
- `scripts/debt/dedup-multi-pass.js` → `safeWriteFileSync` deduped only (**NO
  LOCK**)
- `scripts/debt/sync-deduped.js` → `safeWriteFileSync` deduped only (**NO
  LOCK**)
- `scripts/review-lifecycle.js` → `safeAtomicWriteSync` reviews.jsonl (**NO
  LOCK**)
- `.husky/_shared.sh` → `writeFileSync` hook-runs.jsonl (**NO LOCK**)

### Read-Modify-Write Writers (highest risk without locking)

- `scripts/debt/reverify-resolved.js` — reads both, modifies statuses, writes
  both
- `scripts/debt/verify-resolutions.js` — reads both, promotes statuses, writes
  both
- `scripts/audit-s0-promotions.js` — reads both, demotes severities, writes both
- `scripts/review-lifecycle.js` (ARCHIVE) — reads reviews, splits, writes
  trimmed + archive
- `.husky/_shared.sh` — reads hook-runs, rotates, appends, writes all
- `scripts/metrics/dedup-review-metrics.js` — reads metrics, deduplicates,
  writes all

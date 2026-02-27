# Deep Plan — Full Findings Report

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-27
**Status:** ACTIVE
<!-- prettier-ignore-end -->

**Date:** 2026-02-27 **Branch:** claude/maintenance22726-md8WL **Status:** Phase
1 (Discovery) — Awaiting user decisions

---

## PART 1: FILE OVERWRITE CONFLICTS

---

### Finding 1: DOCUMENTATION_INDEX.md — Silent Pre-Commit Regeneration

**Description:** Every time you commit any `.md` file, the pre-commit hook
(`.husky/pre-commit` lines 288-306) runs `npm run docs:index` which completely
regenerates `DOCUMENTATION_INDEX.md` from scratch via
`scripts/generate-documentation-index.js` (1059 lines). It then runs Prettier on
the result and does `git add DOCUMENTATION_INDEX.md` — silently adding the
regenerated file to your commit.

**What happens technically:**

1. Pre-commit detects staged `.md` files (line 294:
   `git diff --cached --name-only --diff-filter=ADM`)
2. Runs `npm run docs:index` → `generate-documentation-index.js` scans ALL `.md`
   files in repo
3. Generates complete index: categories, reference graphs, orphaned docs,
   statistics
4. Runs `npx prettier --write DOCUMENTATION_INDEX.md` (line 299)
5. Runs `git add DOCUMENTATION_INDEX.md` (line 300) — **silently re-stages**

**Pros of current approach:**

- Index always stays in sync with actual docs
- No manual maintenance required
- Catches orphaned documents automatically

**Cons of current approach:**

- Any manual edits to DOCUMENTATION_INDEX.md are destroyed on next commit
- User doesn't see what changed — file is silently modified and staged
- Adds processing time to every commit with `.md` changes
- If generation fails partially, a broken index gets committed

**Benefits of fixing:** Visibility into what pre-commit changed; ability to
review before committing **Cost of fixing:** Low — only changes hook behavior,
not the script itself

**Suggestion:** Add a diff-summary before the `git add`. Print what changed
(additions/removals) so the user sees it. The skip mechanism
(`SKIP_CHECKS="doc-index"`) already exists but most users don't know about it.

---

### Finding 2: MASTER_DEBT.jsonl — 9 Writers, Zero Locking

**Description:** `docs/technical-debt/MASTER_DEBT.jsonl` (8354 items) is written
to by **9 different scripts** using two incompatible strategies: 4 do
**full-rewrite** (read all → modify → write all) and 5 do **append** (add to
end). There is **zero file locking** across any of them.

**Writers (Full-Rewrite):** | Script | Line | Method | Backup? |
|--------|------|--------|---------| | `generate-views.js` | 298 |
`writeFileSync` | No | | `backfill-hashes.js` | 153 | `safeWriteFileSync` | No |
| `assign-roadmap-refs.js` | 357 | `safeRenameSync` (atomic) | Yes (.bak) | |
`resolve-item.js` | 90 | `safeRenameSync` (atomic) | No |

**Writers (Append):** | Script | Line | Method | |--------|------|--------| |
`generate-views.js` | 569 | `appendFileSync` (--ingest mode) | |
`sync-sonarcloud.js` | 801 | `safeAppendFileSync` | | `ingest-cleaned-intake.js`
| 165 | `safeAppendFileSync` | | `intake-manual.js` | 282 | `safeAppendFileSync`
| | `intake-pr-deferred.js` | 271 | `safeAppendFileSync` |

**Critical conflict:** The intake pipeline chains: `intake-audit.js` →
`dedup-multi-pass.js` → `generate-views.js` (FULL-REWRITE). If another script
appends while this pipeline runs, the appended data is **destroyed** when
`generate-views.js` does its full rewrite at line 298.

**Pros of current approach:**

- Simple — each script handles its own write logic
- JSONL format makes appends easy
- Some scripts use atomic renames (safer)

**Cons of current approach:**

- **Data loss is possible** if two scripts run concurrently
- Inconsistent write strategies (some atomic, some not)
- No locking, no coordination, no retry logic
- Pipeline chain (intake → dedup → generate-views) can destroy concurrent
  appends

**Benefits of fixing:** Eliminates data loss risk; single source of truth stays
consistent **Cost of fixing:** Medium — need to either add locking to all 9
scripts or route through a coordinator

**Suggestion:** Two options:

1. **File lock** — Add a `.MASTER_DEBT.lock` check to `safe-fs.js` so all
   writers coordinate
2. **Single writer pattern** — Route all writes through one coordinator script
   that queues operations. More robust but higher implementation cost.

---

### Finding 3: reviews.jsonl — Append vs Rotation Race

**Description:** `docs/technical-debt/raw/reviews.jsonl` is written by
`sync-reviews-to-jsonl.js` (append at line 860, full rewrite in `--repair` mode
at line 791) and rotated by `session-start.js` (line 459) which keeps only the
30 most recent entries when the file exceeds 50 entries.

**What happens:**

- Normal sync: parses `AI_REVIEW_LEARNINGS_LOG.md`, appends missing entries
- `--repair` mode: atomic full rewrite from markdown + archives
- Session start: `rotateJsonl(reviewsPath, 50, 30)` — discards oldest entries
- After rotation, session-start auto-runs `npm run reviews:sync -- --apply` to
  resync

**Pros of current approach:**

- Keeps file from growing unbounded
- Auto-resync after rotation recovers most data
- Atomic writes for repair mode

**Cons of current approach:**

- Race condition: if sync runs during rotation, data can be lost
- Rotation discards 40% of entries (50 → 30)
- Auto-resync only works if markdown source is complete
- No locking between rotation and append

**Benefits of fixing:** Reliable review tracking; no silent data loss **Cost of
fixing:** Low — add locking or change rotation to archive instead of discard

**Suggestion:** Change rotation to archive discarded entries to a `.archive`
file instead of deleting them. This way data is never truly lost, just moved.

---

### Finding 4: AI_REVIEW_LEARNINGS_LOG.md — Archive Removes Live Entries

**Description:** `scripts/archive-reviews.js` (line 661) reads the entire file,
removes archived review/retro sections, updates metrics, and does an atomic full
rewrite. If anyone manually edits the file while archival runs, those edits are
lost.

**What happens:**

- `archive-reviews.js` reads full file, identifies entries to archive
- Removes archived sections (lines 470-500: regex-based section removal)
- Updates "Current Metrics" table (lines 433-464)
- Updates "Archive Reference" section (lines 359-397)
- Writes entire modified file atomically (line 661)

**Pros of current approach:**

- Atomic write prevents partial corruption
- Symlink guard for security
- Keeps log file manageable size

**Cons of current approach:**

- Full rewrite during manual edit = data loss
- Section matching uses regex — fragile if markdown structure changes
- No notification that sections were removed
- `sync-reviews-to-jsonl.js --repair` can rebuild from archives but only if
  archives are complete

**Benefits of fixing:** Safe concurrent access; no surprise content removal
**Cost of fixing:** Low — add a pre-check that warns if file has been modified
since last read

**Suggestion:** Add a content hash check: compute hash before reading, verify it
hasn't changed before writing. If changed, abort and warn.

---

### Finding 5: ROADMAP.md — Partial Section Rewrites

**Description:** `scripts/debt/reconcile-roadmap.js` (line 310) does selective
replacement of ROADMAP.md: replaces CANON-XXXX references inline and completely
replaces the "GRAND PLAN" section. Creates a `.bak` backup first (line 302).

**What happens:**

- Reads ROADMAP.md
- Step 9a (lines 108-142): Regex-based inline CANON→DEBT ID replacement on every
  line
- Step 9b (lines 200-246): Finds "GRAND PLAN" heading, replaces everything to
  next heading
- Writes via `safeWriteFileSync` (line 310)

**Note:** `assign-roadmap-refs.js` does NOT write to ROADMAP.md (only writes to
MASTER_DEBT.jsonl). So the earlier concern about two scripts rewriting
ROADMAP.md sections was partially incorrect — only `reconcile-roadmap.js`
modifies ROADMAP.md.

**Pros of current approach:**

- Creates backup before writing
- Atomic write via safeWriteFileSync
- Only one actual writer (not two as originally suspected)

**Cons of current approach:**

- Replaces content inside code blocks too (no fence detection)
- If GRAND PLAN heading regex doesn't match, replacement silently fails but file
  still gets written
- No diff shown to user before write

**Benefits of fixing:** Prevents accidental code block modification; better
visibility **Cost of fixing:** Low

**Suggestion:** Add code fence detection (skip lines between
```markers) for CANON replacement. Add`--dry-run` mode to show what would change
before writing.

---

### Finding 6: hook-warnings-log.jsonl — Append/Rotation Race Condition

**Description:** `.claude/state/hook-warnings-log.jsonl` is appended to by
`scripts/append-hook-warning.js` (line 152, no atomic protection) and rotated by
`session-start.js` (line 496) keeping only 30 of 50+ entries.

**The race condition:**

```
Time 1: session-start reads file (all entries)
Time 2: session-start keeps last 30 entries in memory
Time 3: append-hook-warning writes new entry to file
Time 4: session-start writes .tmp with 30 entries (new entry NOT included)
Time 5: session-start renames .tmp → file (new entry LOST)
```

**Pros of current approach:**

- Simple append-only logging
- Rotation prevents unbounded growth

**Cons of current approach:**

- **Critical race condition** — new warnings can be lost during rotation
- `append-hook-warning.js` has no atomic protection (bare `appendFileSync`)
- 40% data loss on every rotation (50 → 30)

**Benefits of fixing:** No lost warnings; reliable hook diagnostics **Cost of
fixing:** Low — add file locking or change to rotation-safe append

**Suggestion:** Same as Finding 3 — archive instead of discard, and add a simple
lock file check before rotation.

---

### Finding 7: agent-invocations.jsonl — Same Race Condition

**Description:** `.claude/state/agent-invocations.jsonl` is appended by
`track-agent-invocation.js` (line 194, no atomic protection) and rotated when
file exceeds 64KB (line 199-201), keeping 60 of 100+ entries.

**Same race condition as Finding 6.** Multiple concurrent agent invocations can
also interleave writes (bare `appendFileSync` with no locking).

**Pros:** Simple, fast append tracking **Cons:** Race condition on rotation;
concurrent appends can interleave; 40% data loss on rotation

**Benefits of fixing:** Reliable agent tracking (critical for code-reviewer
gate) **Cost of fixing:** Low

**Suggestion:** Add file locking for rotation. This is particularly important
because `agent-invocations.jsonl` is used by the pre-push hook to verify
code-reviewer compliance — if a rotation loses the code-reviewer entry, the push
gets blocked.

---

### Finding 8: Lint-staged (Prettier) — Auto-Formats Staged Files

**Description:** Pre-commit Check 2 (line 164) runs
`npx --no-install lint-staged` which executes `prettier --write` on all staged
`*.{js,jsx,ts,tsx,json,css,md}` files. This reformats files in-place before
they're committed.

**Pros of current approach:**

- Consistent formatting across all commits
- No manual formatting required
- Industry standard practice

**Cons of current approach:**

- Intentional formatting (e.g., aligned columns, specific whitespace) gets
  normalized
- Runs on `.md` files which may have intentional formatting
- Changes are staged automatically by lint-staged (user doesn't see them)

**Benefits of fixing:** N/A — this is working as designed **Cost of fixing:**
N/A

**Suggestion:** This is standard and fine. No change needed. Included for
completeness only.

---

## PART 2: PRE-COMMIT HOOK PIPELINE

The pre-commit hook (`.husky/pre-commit`, 359 lines) runs **11 sequential
checks**:

| Order | Check                          | Blocking?          | Auto-Modifies Files?              | Skip Flag    |
| ----- | ------------------------------ | ------------------ | --------------------------------- | ------------ |
| 1     | ESLint (`npm run lint`)        | Yes                | No                                | —            |
| 1     | Tests (`npm test`)             | Yes                | No                                | `tests`      |
| 2     | Lint-staged (Prettier)         | Yes                | **Yes** — reformats staged files  | —            |
| 3     | Pattern Compliance             | Yes                | No                                | `patterns`   |
| 4     | Audit S0/S1 Validation         | Yes                | No                                | `audit`      |
| 5     | CANON Schema Validation        | No (warning)       | No                                | —            |
| 6     | Skill Configuration Validation | No (warning)       | No                                | —            |
| 7     | Cross-Document Dependencies    | Yes                | No                                | `cross-doc`  |
| 8     | **Documentation Index**        | Yes                | **Yes** — regenerates + `git add` | `doc-index`  |
| 9     | Document Header Validation     | Yes                | No                                | `doc-header` |
| 10    | Agent Compliance               | No (unless strict) | No                                | —            |
| 11    | TDMS Schema Validation         | Yes                | No                                | `debt`       |

**Key finding:** Only 2 checks auto-modify files: lint-staged (#2) and
docs:index (#8). Lint-staged is standard practice. The docs:index silent
`git add` is the main concern.

---

## PART 3: MANUAL WORKFLOW CHAINS & AUTOMATION OPPORTUNITIES

---

### Finding 9: PR Review → Retro → Add-Debt Chain (0% End-to-End Automation)

**Description:** After a PR review completes, the user must manually: (1) invoke
`/pr-retro` to analyze the review cycle, (2) read the retro output, and (3)
invoke `/add-debt` for each deferred item. None of these transitions are
automated.

**Current state:**

- PR review completes → user must manually invoke `/pr-retro`
- Retro Step 5.1 requires DEBT entries → user must manually invoke `/add-debt`
  for each item
- `npm run reviews:sync -- --apply` must be run after fixes are committed
- No automatic trigger from review completion to retrospective generation

**What happens when steps are skipped:**

- Deferred bugs never get tracked in TDMS
- Same churn patterns repeat in subsequent PRs (evidence: PR #379 had 7 rounds,
  PR #394 had 12 rounds)
- Process improvements never get captured
- Previous retro action items never get checked

**Pros of current manual approach:**

- User has full control over when retros happen
- Can batch retros if needed
- No accidental debt creation

**Cons of current manual approach:**

- 0% automated — every transition requires human memory
- Deferred items fall through the cracks
- Evidence shows churn repeating across PRs because retros are delayed
- Time cost: ~15-30 min per PR for the full chain

**Benefits of automating:** Catches all deferred items; learning feedback loop
tightens from days to minutes **Cost of automating:** Medium — needs trigger
mechanism (post-merge hook or skill chaining)

**Suggestion:**

- **Auto-prompt** after PR merge: "PR had N review rounds. Run `/pr-retro`?"
- **Auto-create** DEBT entries from retro Step 5.1 action items instead of
  requiring manual `/add-debt`
- **Auto-sync** `reviews:sync --apply` after review fixes committed

---

### Finding 10: TDMS Audit Pipeline — Dual-File Write Trap

**Description:** The TDMS pipeline (intake → normalize → dedup → generate-views)
has a critical design constraint: any script that appends to `MASTER_DEBT.jsonl`
**must also** append to `raw/deduped.jsonl`. If this dual-write is missed, the
next `generate-views.js` full-rewrite **destroys the new entries** because it
reads from deduped.jsonl as its source of truth.

**Current state:**

- `consolidate-all.js` chains all 6 steps sequentially (automated when called)
- But triggering `consolidate-all.js` itself is manual (run at session-end)
- Each intake script handles its own dual-write, but there's no enforcement
- `generate-views.js` does full-rewrite of MASTER from deduped.jsonl — line 298

**What happens when steps are skipped:**

- Skip dedup → same item appears multiple times, metrics double-count
- Skip `--ingest` flag → new items in deduped.jsonl never get DEBT-XXXX IDs
- Miss dual-write → next full-rewrite destroys entries silently
- Skip metrics → dashboard shows stale S0/S1 counts

**Pros of current approach:**

- Pipeline is well-structured when run correctly
- Consolidate-all chains everything
- Each step validates its input

**Cons of current approach:**

- Dual-file write requirement is a foot-gun — no automated enforcement
- Metrics only run at session-end (16-24 hour delay)
- No automated integrity check that MASTER and deduped.jsonl are consistent

**Benefits of automating:** Eliminates data loss from missed dual-writes;
real-time metrics **Cost of automating:** Low-Medium — add write-through layer
or post-write consistency check

**Suggestion:**

- Add a `writeMasterDebt()` utility in `safe-fs.js` that **always** writes to
  both files
- Run `generate-metrics.js` automatically after any intake operation
- Add a pre-commit check: "MASTER_DEBT.jsonl line count matches deduped.jsonl
  new entries"

---

### Finding 11: Session Lifecycle — session-begin/session-end Are Manual

**Description:** The session lifecycle has 3 phases: SessionStart hook
(automatic), `/session-begin` skill (manual), and `/session-end` skill (manual).
The hook runs critical setup, but if the user skips `/session-begin`, **8
auto-scripts never run** including pattern checks, review sync, and archive
recommendations.

**Current state:**

- SessionStart hook: **automatic** — runs on every session (deps install, build,
  TDMS health)
- `/session-begin`: **manual** — runs 8 scripts (patterns:check, review:check,
  lessons:surface, session:gaps, roadmap:hygiene, reviews:sync,
  reviews:check-archive, reviews:archive)
- `/session-end`: **manual** — updates ROADMAP, SESSION_CONTEXT, consolidation,
  metrics, velocity tracking

**What happens when skipped:**

- Skip session-begin → 8 scripts never run, pattern violations not surfaced
  until push, reviews not synced, stale docs not detected
- Skip session-end → ROADMAP shows wrong progress, SESSION_CONTEXT has stale
  priorities, TDMS metrics 1 session behind, velocity not tracked

**Pros of current approach:**

- User has control over when to run diagnostics
- Session-begin can be skipped for quick fixes
- Avoids overhead for trivial sessions

**Cons of current approach:**

- "Optional" steps get skipped regularly
- SESSION_CONTEXT.md decay: session-end creates forward-looking notes,
  session-begin consumes them. Skip either and context degrades
- 8 auto-scripts in session-begin represent significant diagnostic value that's
  lost

**Benefits of automating:** Consistent session hygiene; no stale context **Cost
of automating:** Low — could move critical scripts to SessionStart hook

**Suggestion:**

- Move the 3 most critical scripts (patterns:check, reviews:sync, session:gaps)
  from session-begin to the SessionStart hook
- Keep remaining 5 in session-begin as optional diagnostics
- Add a "session-end reminder" hook that triggers after N hours of inactivity

---

### Finding 12: Consolidation Chain — Review Sync Deadlock

**Description:** There's a hidden dependency chain where reviews written to
`AI_REVIEW_LEARNINGS_LOG.md` don't reach the consolidation engine until
`reviews:sync` runs. If `reviews:sync` never runs, the consolidation threshold
is never met, and `CODE_PATTERNS.md` never gets updated with new patterns.

**The deadlock:**

```
User completes PR review → writes to markdown
    ↓ (reviews:sync NOT run)
SessionStart → consolidation --auto
    ↓ (reads reviews.jsonl — still old version)
No new reviews detected → threshold not met
    ↓
CODE_PATTERNS.md not updated
    ↓ (next session same thing)
Patterns accumulate in markdown, never reach automation
```

**Pros of current approach:**

- Explicit sync prevents premature consolidation
- User can review what gets synced

**Cons of current approach:**

- Deadlock is real — if reviews:sync doesn't run, consolidation never triggers
- Session-begin runs reviews:sync, but session-begin is manual
- Consolidation threshold (10+ reviews) means patterns wait days

**Benefits of fixing:** Unblocks the learning feedback loop; patterns get
documented sooner **Cost of fixing:** Low — add reviews:sync to SessionStart
hook

**Suggestion:** Add `npm run reviews:sync -- --apply` to the SessionStart hook
(after rotation step). This already exists in session-begin but making it
automatic ensures consolidation always has fresh data.

---

### Finding 13: Debt Resolution → ROADMAP Not Updated

**Description:** When a TDMS item is resolved via `resolve-item.js` or
`resolve-bulk.js`, the item is marked RESOLVED in MASTER_DEBT.jsonl but
**ROADMAP.md is never automatically updated**. The user must manually check
ROADMAP and mark track items as complete.

**Current state:**

- `resolve-item.js` changes status to RESOLVED in MASTER_DEBT.jsonl
- ROADMAP.md tracks the same items by DEBT-XXXX ID
- No automatic sync between them
- User must manually update ROADMAP at session-end

**Pros of current approach:**

- ROADMAP is human-authored with context
- Prevents accidental completion marking

**Cons of current approach:**

- ROADMAP shows wrong progress until manual update
- Multiple resolved items can accumulate before ROADMAP is synced

**Benefits of fixing:** ROADMAP always reflects actual progress **Cost of
fixing:** Medium — need to parse ROADMAP markdown and match DEBT IDs

**Suggestion:** Add a `--update-roadmap` flag to `resolve-item.js` that marks
the corresponding ROADMAP line item. Or add a `roadmap:sync` script that reads
MASTER_DEBT resolved items and updates ROADMAP.

---

### Finding 14: Skills/Templates Update Loop — Fully Manual

**Description:** When `pr-retro` identifies recurring patterns (Step 5.2 "Repeat
Offenders") or suggests skills/templates updates (Step 8), the user must
manually update `FIX_TEMPLATES.md`, `CODE_PATTERNS.md`, or skill files. There's
no automation to propagate retro findings into these documents.

**Current state:**

- Retro Step 5.2 escalates repeat offenders to S1 severity
- Retro Step 8 lists "Skills/Templates to Update"
- User reads output, manually updates referenced files
- Example: pr-review v3.5 added pre-checks #16 and #17 based on PR #393/#394
  retros

**Pros of current approach:**

- Human judgment on what patterns to document
- Prevents low-quality auto-generated patterns

**Cons of current approach:**

- Patterns identified in retros take 1-2 sessions to reach documentation
- Some patterns never get documented (user forgets)
- Manual copy-paste is error-prone

**Benefits of fixing:** Faster pattern documentation; no forgotten patterns
**Cost of fixing:** Medium — need structured retro output format for machine
consumption

**Suggestion:** Have the retro skill output a machine-readable section (JSONL)
with proposed pattern entries. Then a post-retro script can auto-append them to
`CODE_PATTERNS.md` with a "pending review" tag. User approves or rejects.

---

## PART 4: SUMMARY TABLE

| #   | Finding                                       | Type         | Severity | Fix Cost | Impact                       |
| --- | --------------------------------------------- | ------------ | -------- | -------- | ---------------------------- |
| 1   | DOCUMENTATION_INDEX.md silent re-staging      | Overwrite    | Medium   | Low      | Invisible changes in commits |
| 2   | MASTER_DEBT.jsonl 9 writers, 0 locking        | Overwrite    | Critical | Medium   | Data loss possible           |
| 3   | reviews.jsonl append/rotation race            | Overwrite    | High     | Low      | Data loss on rotation        |
| 4   | AI_REVIEW_LEARNINGS_LOG.md archive overwrites | Overwrite    | Medium   | Low      | Manual edits lost            |
| 5   | ROADMAP.md partial section rewrites           | Overwrite    | Low      | Low      | Code blocks modified         |
| 6   | hook-warnings-log.jsonl race condition        | Overwrite    | High     | Low      | Warnings silently lost       |
| 7   | agent-invocations.jsonl race condition        | Overwrite    | High     | Low      | Code-reviewer gate broken    |
| 8   | Lint-staged auto-format                       | Overwrite    | Info     | N/A      | Standard — no change needed  |
| 9   | PR Review→Retro→Add-Debt (0% auto)            | Manual chain | High     | Medium   | Deferred bugs lost           |
| 10  | TDMS dual-file write trap                     | Manual chain | Critical | Low-Med  | Silent data destruction      |
| 11  | session-begin/end manual                      | Manual chain | High     | Low      | Stale context accumulates    |
| 12  | Review sync deadlock                          | Manual chain | Medium   | Low      | Learning loop blocked        |
| 13  | Debt resolution → ROADMAP not synced          | Manual chain | Medium   | Medium   | ROADMAP shows wrong progress |
| 14  | Skills/templates update loop                  | Manual chain | Medium   | Medium   | Patterns undocumented        |

---

## DECISIONS (User to fill in)

For each finding, mark: **ACT** (implement fix), **DEFER** (track as debt), or
**ACCEPT** (no change needed).

| #   | Decision | Notes |
| --- | -------- | ----- |
| 1   |          |       |
| 2   |          |       |
| 3   |          |       |
| 4   |          |       |
| 5   |          |       |
| 6   |          |       |
| 7   |          |       |
| 8   |          |       |
| 9   |          |       |
| 10  |          |       |
| 11  |          |       |
| 12  |          |       |
| 13  |          |       |
| 14  |          |       |

# Implementation Plan: Review Lifecycle Pipeline Overhaul

## Summary

Structural overhaul of the review save/consolidate/archive/sync/surface pipeline
to fix 7 verified root causes. Moves from markdown-canonical dual-write
architecture to JSONL-canonical single-source-of-truth with a single
orchestrator script, auto-archive, atomic operations, and blocking health
checks. No passive surfacing, no silent failures.

**Decisions:** See [DECISIONS.md](./DECISIONS.md) (20 decisions) **Diagnosis:**
See [DIAGNOSIS.md](./DIAGNOSIS.md) (T3-verified, 2 passes) **Effort Estimate:**
L (4-6 sessions)

---

## Files to Create/Modify

### New Files (3)

1. **`scripts/review-lifecycle.js`** — Single orchestrator for entire review
   lifecycle (sync→archive→rotate→validate→render). Per Q4.
2. **`scripts/__tests__/review-lifecycle.test.js`** — Unit + integration tests
   for orchestrator. Per Q17.
3. **`scripts/archive/README.md`** — Brief note explaining archived scripts

### Modified Files (8)

1. **`scripts/run-consolidation.js`** — Reorder writes: CODE_PATTERNS.md before
   consolidation.json (Q3)
2. **`scripts/archive-reviews.js`** — Add atomic archive operation (Q7), then
   move to `scripts/archive/` (Q16)
3. **`scripts/reviews/render-reviews-to-md.ts`** — Review, fix, wire as
   orchestrator render step (Q10)
4. **`.claude/hooks/session-start.js`** — Replace 3 review blocks with single
   orchestrator call (Q11)
5. **`scripts/check-review-archive.js`** — Adapt health checks for
   JSONL-canonical world (Q19)
6. **`package.json`** — Add `reviews:lifecycle`, update old names to redirect
   with deprecation warnings (Q18)
7. **`scripts/sync-reviews-to-jsonl.js`** — Move to `scripts/archive/` after
   migration (Q16)
8. **`docs/AI_REVIEW_LEARNINGS_LOG.md`** — Becomes auto-generated read-only view
   (Q9)

### Deprecated (moved to `scripts/archive/`)

1. `scripts/sync-reviews-to-jsonl.js` — Migration-only after JSONL canonical
2. `scripts/archive-reviews.js` — Logic absorbed into orchestrator

---

## Step 1: Fix consolidation state ordering (RC-3)

**Smallest, most isolated fix. No dependencies. Immediate value.**

In `scripts/run-consolidation.js`, swap the order of operations:

**Current (line ~691-714):**

1. Write `consolidation.json` (state advances)
2. Write `CODE_PATTERNS.md` (can fail silently → patterns lost)

**New:**

1. Write `CODE_PATTERNS.md` (if fails → throw, state doesn't advance)
2. Write `consolidation.json` (only if CODE_PATTERNS succeeded)
3. If CODE_PATTERNS write fails → exit non-zero, log error with specific
   guidance

Remove the try-catch that swallows CODE_PATTERNS errors. Let it throw. Exit code
must be non-zero on any write failure.

Per Decision Q3.

**Done when:** `run-consolidation.js` exits non-zero if CODE_PATTERNS.md write
fails, and `consolidation.json` is NOT advanced in that case. Test: mock
CODE_PATTERNS.md as read-only, run consolidation, verify counter unchanged.
**Depends on:** None **Triggers:** None

---

## Step 2: Review and wire `render-reviews-to-md.ts` (RC-7)

Read `scripts/reviews/render-reviews-to-md.ts` end-to-end. Assess:

1. Does it correctly render JSONL reviews to the expected markdown format?
2. Does it handle retrospectives?
3. Does it use safe-fs / security-helpers?
4. Does the output match the current AI_REVIEW_LEARNINGS_LOG.md structure?

If bit-rotted beyond repair → rewrite. Otherwise, fix issues and ensure it:

- Reads from `.claude/state/reviews.jsonl` (canonical JSONL)
- Outputs to `docs/AI_REVIEW_LEARNINGS_LOG.md`
- Preserves the Version History and consolidation sections (don't overwrite
  those — only regenerate review entries)
- Uses safe-fs atomic writes
- Adds npm script:
  `"reviews:render": "cd scripts/reviews && npx tsx render-reviews-to-md.ts"`

Per Decision Q10.

**Done when:** `npm run reviews:render` produces a valid
AI_REVIEW_LEARNINGS_LOG.md from reviews.jsonl that matches the expected
structure. Manual diff against current file shows content-equivalent output.
**Depends on:** None (parallel with Step 1) **Triggers:** Step 4 (orchestrator
uses this)

---

## Step 3: Adapt `check-review-archive.js` for JSONL-canonical (RC-1)

Update health checks to validate the JSONL-canonical world:

**Keep:**

- Duplicate ID detection (now within JSONL, not across markdown files)
- Coverage gap detection (sequential ID check)
- Temporal coverage (weeks with no reviews)

**Modify:**

- Archive checks: validate `.claude/state/reviews-archive.jsonl` instead of
  `docs/archive/REVIEWS_*.md` files
- Metadata accuracy: compare JSONL state against rendered markdown view (if it
  exists), not markdown-embedded metadata
- JSONL integrity: validate each line parses, required fields present
- Consolidation state: cross-check `consolidation.json` counter against actual
  JSONL max ID

**Add:**

- Blocking exit behavior: exit 1 on any issue, with structured output (JSON
  array of findings with severity, description, fix suggestion)
- Forward-findings integration: write S0/S1 findings to
  `.claude/state/forward-findings.jsonl` per Q20

Per Decisions Q6, Q19, Q20.

**Done when:** `npm run reviews:check-archive` validates JSONL state, exits
non-zero on issues, outputs structured JSON findings. Forward-findings written
for S0/S1. **Depends on:** None (parallel with Steps 1-2) **Triggers:** Step 4
(orchestrator calls this)

---

## Step 4: Build `review-lifecycle.js` orchestrator (RC-1, RC-2, RC-4, RC-5)

**The core deliverable.** Single script that owns the entire review lifecycle.

### Sequence (strict, no parallelism):

```
1. SYNC      — parse any new markdown reviews → append to reviews.jsonl
               (transition period only — once all callers use
               write-review-record.ts, this step becomes a no-op)
2. ARCHIVE   — if reviews.jsonl has > threshold entries, archive oldest
               to reviews-archive.jsonl (JSONL append, atomic)
3. ROTATE    — if reviews.jsonl still exceeds soft limit after archive,
               rotate (keep N newest, move rest to archive)
4. VALIDATE  — run check-review-archive.js against JSONL state
               if issues found → structured output, exit non-zero
5. RENDER    — run render-reviews-to-md.ts to regenerate markdown view
```

### Key behaviors:

- **Atomic archive (Q7):** Write archive entries to temp JSONL, update
  reviews.jsonl (remove archived entries), then rename temp → final. If
  reviews.jsonl update fails, delete temp (rollback).
- **Blocking validation (Q6, Q15):** If Step 4 (VALIDATE) finds issues, print
  structured findings and exit non-zero. Session-start must surface this as a
  blocking decision gate.
- **Forward-findings (Q20):** VALIDATE step writes S0/S1 findings to
  forward-findings.jsonl.
- **No concurrent writes (Q4):** This script is the ONLY writer to reviews.jsonl
  during session-start. Session-start calls only this script.
- **Exit codes:**
  - 0: All steps succeeded, no issues
  - 1: Validation issues found (blocking)
  - 2: I/O error, corruption, unrecoverable

### CLI interface:

```
node scripts/review-lifecycle.js              # Full lifecycle (default)
node scripts/review-lifecycle.js --sync-only  # Just sync step
node scripts/review-lifecycle.js --validate   # Just validate step
node scripts/review-lifecycle.js --render     # Just render step
node scripts/review-lifecycle.js --dry-run    # Preview all steps, no writes
```

Per Decisions Q4, Q5, Q6, Q7, Q12, Q15.

**Done when:** Orchestrator runs full sequence successfully on current data.
Unit tests for each phase. Integration test: fixture data → full lifecycle →
validated end state. **Depends on:** Steps 2, 3 (needs renderer and validator)
**Triggers:** Step 5 (session-start wiring)

---

## Step 5: Wire orchestrator into session-start.js (RC-5)

Replace the 3 scattered review blocks in `.claude/hooks/session-start.js` with a
single call:

```javascript
// BEFORE: 3 separate calls
// Line ~552: execFileSync("npm", ["run", "reviews:sync", "--", "--apply"])
// Line ~563: archive-reviews.js --auto
// Line ~680-706: rotation + re-sync

// AFTER: 1 orchestrator call
try {
  execFileSync("node", ["scripts/review-lifecycle.js"], {
    cwd: projectRoot,
    stdio: "pipe",
    timeout: 30000,
  });
} catch (err) {
  // Exit code 1 = validation issues — surface as blocking warning
  // Exit code 2 = I/O error — surface as error
  // MUST force acknowledgment per Q15
}
```

Remove the old sync, archive, and rotation calls for reviews. Keep non-review
operations unchanged (per Q11 — minimal scope).

Per Decisions Q4, Q11.

**Done when:** Session-start calls only the orchestrator for review operations.
No other script writes to reviews.jsonl during session-start. Old review blocks
removed. **Depends on:** Step 4 **Triggers:** Step 6 (npm script updates)

---

## Step 6: Update package.json npm scripts (Q18)

```json
{
  "reviews:lifecycle": "node scripts/review-lifecycle.js",
  "reviews:validate": "node scripts/review-lifecycle.js --validate",
  "reviews:render": "cd scripts/reviews && npx tsx render-reviews-to-md.ts",

  "reviews:sync": "echo '⚠️ DEPRECATED: use reviews:lifecycle' && node scripts/review-lifecycle.js --sync-only",
  "reviews:archive": "echo '⚠️ DEPRECATED: use reviews:lifecycle' && node scripts/review-lifecycle.js",
  "reviews:check-archive": "node scripts/check-review-archive.js"
}
```

Old names redirect with deprecation warnings. Remove aliases after zero
deprecation warnings over 3+ sessions.

Per Decision Q18.

**Done when:** `npm run reviews:lifecycle` runs the orchestrator. Old npm script
names print deprecation warning then run equivalent. **Depends on:** Step 4
**Triggers:** None

---

## Step 7: Big-bang migration (Q13, Q14)

One-time migration to JSONL-canonical:

1. **Rebuild JSONL:** Run `npm run reviews:sync -- --repair` to rebuild
   reviews.jsonl from ALL markdown sources (active log + all archive files)
2. **Deduplicate:** Remove duplicate entries in JSONL (by review ID)
3. **Validate:** Run `npm run reviews:validate` — must exit 0
4. **Archive old markdown:** Move `docs/archive/REVIEWS_*.md` to
   `docs/archive/reviews-markdown-legacy/` (preserve for reference)
5. **Render markdown view:** Run `npm run reviews:render` — regenerates
   AI_REVIEW_LEARNINGS_LOG.md from canonical JSONL
6. **Diff check:** Compare rendered markdown against original — verify content
   equivalence (ordering may differ)
7. **Move deprecated scripts:** Move `sync-reviews-to-jsonl.js` and
   `archive-reviews.js` to `scripts/archive/`
8. **Commit:** Single atomic commit with clear message

Per Decisions Q13, Q14, Q16.

**Done when:** reviews.jsonl is the canonical source. Markdown archives
preserved in legacy folder. Rendered markdown view matches content. Deprecated
scripts moved. All `npm run reviews:*` commands work. **Depends on:** Steps 1-6
**Triggers:** Step 8 (verification)

---

## Step 8: End-to-end verification

Run the full lifecycle to verify everything works:

1. `npm run reviews:lifecycle` — full orchestrator run, must exit 0
2. `npm run reviews:validate` — health check, must exit 0
3. `npm test` — all tests pass (including new orchestrator tests)
4. Verify AI_REVIEW_LEARNINGS_LOG.md is auto-generated and readable
5. Verify no duplicate reviews in JSONL
6. Verify no orphaned archive files
7. Verify forward-findings.jsonl has entries (if health issues existed)

Per Decision Q17.

**Done when:** All 7 verification checks pass. Zero issues in health check.
**Depends on:** Step 7

---

## Step 9: Audit

Run code-reviewer agent on all new/modified files:

- `scripts/review-lifecycle.js`
- `scripts/__tests__/review-lifecycle.test.js`
- `scripts/run-consolidation.js` (modified)
- `scripts/check-review-archive.js` (modified)
- `scripts/reviews/render-reviews-to-md.ts` (modified)
- `.claude/hooks/session-start.js` (modified)
- `package.json` (modified)

Per CLAUDE.md Section 7 post-task triggers.

**Done when:** All code-reviewer findings addressed or tracked in TDMS.
**Depends on:** Step 8

---

## Parallelization

Steps 1, 2, 3 can run **in parallel** (no dependencies between them). Step 4
depends on 2 and 3. Steps 5 and 6 depend on 4 (can run in parallel with each
other). Step 7 depends on all prior steps. Steps 8 and 9 are sequential after 7.

```
[Step 1] ─────────────────────────────────┐
[Step 2] ──┐                              │
[Step 3] ──┼──→ [Step 4] ──┬──→ [Step 7] ──→ [Step 8] ──→ [Step 9]
           │               │
           │    [Step 5] ──┘
           │    [Step 6] ──┘
```

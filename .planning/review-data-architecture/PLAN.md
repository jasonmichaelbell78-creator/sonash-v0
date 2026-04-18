# Review Data Architecture Consolidation — Plan

**Date:** 2026-04-17 | **Decisions:** 21 | **Effort:** L (~2-3 hours)
**Status:** PENDING APPROVAL **Commit strategy:** Single atomic commit (per D20)

## Prerequisites

- Branch: `CAS-41726` (current, clean)
- All review scripts build: `cd scripts/reviews && npx tsc`

---

## Step 1: Backfill Missing PRs (#434, #444, #481)

**Per D7.** Parse commit messages to create JSONL records for the 3 PRs with fix
commits but no review data.

```bash
# Extract data from commit messages
git log --all --oneline --grep="PR #434 R"
git log --all --oneline --grep="PR #444 R"
git log --all --oneline --grep="PR #481 R"
```

For each PR+round, create a record with:

- `id`: legacy format (leave as `backfill-{pr}-r{N}` per D5)
- `schema_version: 1`, `completeness: "partial"`,
  `completeness_missing: ["severity", "patterns", "learnings"]`
- `origin: { type: "backfill", source_id: "commit-{sha}" }`
- `pr`, `round`, `date` (from commit timestamp), `source: "mixed"`
- `total`, `fixed` (from commit message item counts), `deferred: 0`,
  `rejected: 0`

Append to `reviews-archive.jsonl` (will be merged in Step 2).

**Done when:** 8 new records created (PR #434 R1-R3, PR #444 R1-R3, PR #481
R1-R2). Verify:
`grep -c "backfill-434\|backfill-444\|backfill-481" .claude/state/reviews-archive.jsonl`
= 8.

---

## Step 2: Merge Data Stores

**Per D1, D13.** Combine `reviews.jsonl` + `reviews-archive.jsonl` into single
`reviews.jsonl`.

1. Read both files
2. Normalize: add `schema_version: 1` to any record missing it (per D13)
3. Deduplicate by `pr` + `round` (keep record with higher `schema_version` or
   more fields)
4. Sort by date ascending
5. Write merged result to `reviews.jsonl`
6. Delete `reviews-archive.jsonl`
7. Delete backup files: `reviews.jsonl.archive`, `reviews.jsonl.bak` (if they
   exist)

**Done when:** Single `reviews.jsonl` with ~547 records (539 existing + 8
backfill). `reviews-archive.jsonl` deleted. Verify:
`wc -l .claude/state/reviews.jsonl` >= 540.
`test ! -f .claude/state/reviews-archive.jsonl`.

---

## Step 3: Delete `rotate-jsonl.js`

**Per D10.** Remove the rotation script that creates the archive split.

1. Delete `scripts/rotate-jsonl.js`
2. Remove any npm script reference to it in `package.json`
3. Remove any reference in `review-lifecycle.js` that calls rotation
4. Search for other callers:
   `grep -rn "rotate-jsonl\|rotate.*jsonl" scripts/ .claude/ package.json`

**Done when:** Script deleted. Zero references remain. Verify:
`test ! -f scripts/rotate-jsonl.js && grep -rc "rotate-jsonl" scripts/ package.json | grep -v ':0$' | wc -l`
= 0.

---

## Step 4: Update `review-lifecycle.js`

**Per D9, D11, D15.** Three changes to the central orchestrator:

### 4a: Remove ARCHIVE step (D15)

Remove the code that moves entries to `reviews-archive.jsonl`. Pipeline becomes:
SYNC → VALIDATE → RECONCILE-COMMITS → RECONCILE → RENDER.

### 4b: Remove KNOWN_SKIPPED_IDS logic (D11)

Remove the hardcoded 64-ID skip set from validation. Sequential gap checking is
no longer meaningful with PR-based IDs.

### 4c: Add RECONCILE-COMMITS step (D9)

New step between VALIDATE and RECONCILE:

```javascript
// RECONCILE-COMMITS: find PRs with fix commits but no JSONL records
function reconcileCommits(reviewsByPR) {
  // git log --oneline --grep="fix: PR #" --grep="R[0-9]" --all-match
  // Parse PR number + round from each commit message
  // For each PR+round, check if reviewsByPR has a matching entry
  // Report gaps as warnings (not errors — backfill is manual)
}
```

Output: `N fix commits found, M have JSONL records, K gaps detected: [list]`

### 4d: Update all `reviews-archive.jsonl` path references (D14)

Find/replace any remaining references to the archive path.

**Done when:** `npm run reviews:lifecycle` runs clean with no archive step.
RECONCILE-COMMITS detects the 3 backfilled PRs. Verify:
`node scripts/review-lifecycle.js --validate 2>&1 | grep -i "error" | wc -l`
= 0.

---

## Step 5: Update `check-review-archive.js`

**Per D11, D14.** Remove KNOWN_SKIPPED_IDS, remove archive file references,
update validation to work with single merged file.

**Done when:** `npm run reviews:check-archive` passes with merged data.

---

## Step 6: Update `backfill-reviews.ts`

**Per D14.** Remove references to `reviews-archive.jsonl`. Backfill writes only
to `reviews.jsonl`.

**Done when:** Backfill script references only `reviews.jsonl`.

---

## Step 7: Update `write-review-record.ts` — Canonical ID Format

**Per D4, D5.** Change auto-ID logic:

```typescript
// Old: getNextReviewId() → rev-{N+1}
// New: generateReviewId(pr, round) → review-pr{pr}-r{round}
function generateReviewId(pr: number, round: number): string {
  return `review-pr${pr}-r${round}`;
}
```

The `--data` JSON input already requires `pr` and `round` fields. Use them
directly instead of sequential numbering. Collision check: if
`review-pr{N}-r{M}` already exists in the file, append `-fix{K}` suffix.

**Done when:** `write-review-record.ts` generates `review-pr{N}-r{M}` IDs. Old
`getNextReviewId` removed.

---

## Step 8: Update `render-reviews-to-md.ts`

**Per D3.** Verify it reads from `reviews.jsonl` only (should already be the
case). If it references `reviews-archive.jsonl`, update.

**Done when:** Renderer reads single file. `npm run reviews:render` produces
valid output.

---

## Step 9: Update pr-retro SKILL.md

**Per D16.** Change Step D2 search instructions:

Old: "Search `docs/AI_REVIEW_LEARNINGS_LOG.md`, `docs/archive/REVIEWS_*.md`,
`.claude/state/retros.jsonl`" New: "Search `.claude/state/reviews.jsonl` and
`.claude/state/retros.jsonl`. Parse JSONL — do not search markdown."

Also update Step 2.1 to reference JSONL fields, not markdown headings.

**Done when:** pr-retro SKILL.md references only JSONL sources.

---

## Step 10: Update pr-review SKILL.md

**Per D17.** Two additions:

### 10a: New Critical Rule

Add to Critical Rules section: "8. **NEVER commit fix code without a JSONL
record** — Step 6 MUST complete before Step 8 commit. If Step 6 fails, do not
proceed."

### 10b: Step 6 verification sub-step

Add after the JSONL write: "**Verification (MUST):** Confirm `reviews.jsonl`
contains a record matching this PR+round:
`grep \"pr\":${PR},.*\"round\":${ROUND} .claude/state/reviews.jsonl`. If
missing, Step 6 is incomplete — do not proceed to Step 7."

**Done when:** Both additions present in SKILL.md.

---

## Step 11: Create Post-Commit Hook

**Per D8, D18.** New `scripts/hooks/check-review-record.js`:

```javascript
// Triggered post-commit
// 1. Parse commit message for "fix: PR #N R" or "fix(pr-review): PR #N R"
// 2. If no match, exit 0 (not a review fix commit)
// 3. Extract PR number and round
// 4. Check reviews.jsonl for matching pr+round record
// 5. If missing, warn: "Review fix committed but no JSONL record for PR #N RN.
//    Run /pr-review Step 6 to create the record."
// Non-blocking (warn only — post-commit can't reject)
```

Wire in `.claude/settings.json` as a PostToolUse hook on Bash (commit
detection).

**Done when:** Hook fires on review fix commits. Warns when JSONL record
missing. Does not block.

---

## Step 12: Update npm scripts in `package.json`

**Per D19.**

Remove deprecated:

- `reviews:sync` (if still present)
- `reviews:archive` (if still present)
- `reviews:repair` (if still present)

Add:

- `"reviews:reconcile-commits": "node scripts/review-lifecycle.js --reconcile-commits"`

**Done when:** Dead scripts removed. New script works:
`npm run reviews:reconcile-commits`.

---

## Step 13: Validate Markdown Archives

**Per D2.** One-time validation:

```bash
# For each review entry in markdown archives, verify a JSONL record exists
node -e "
  // Parse all ### Review #N — PR #M entries from archive files
  // Cross-reference against merged reviews.jsonl
  // Report: N matched, M unmatched
"
```

If unmatched entries found, backfill them before marking archives as pure. Add
comment to top of each archive file:
`<!-- ARCHIVED: All data migrated to .claude/state/reviews.jsonl. Do not reference in skills or scripts. -->`

**Done when:** Zero unmatched entries. Archives annotated.

---

## Step 14: Propagation Sweep

**Per D14.** Search entire codebase for any remaining references:

```bash
grep -rn "reviews-archive.jsonl" scripts/ .claude/ docs/ package.json tests/
grep -rn "rotate-jsonl" scripts/ .claude/ docs/ package.json tests/
grep -rn "KNOWN_SKIPPED_IDS\|known.skipped" scripts/ .claude/
grep -rn "reviews-markdown-legacy" .claude/skills/ scripts/
```

Fix every reference found.

**Done when:** All four greps return zero results (excluding this PLAN.md and
DIAGNOSIS.md).

---

## Step 15: Verification

Run full validation suite:

```bash
npm run reviews:lifecycle          # Full pipeline
npm run reviews:check-archive      # Validation
npm run reviews:reconcile-commits  # New step
npm run reviews:render             # Markdown still works
npm run patterns:check             # No anti-patterns
npm run skills:validate            # Skills valid
node scripts/check-cc.js --files scripts/review-lifecycle.js scripts/hooks/check-review-record.js
```

**Done when:** All pass. Zero errors.

---

## Step 16: Audit

Run `code-reviewer` agent on all modified files.

**Done when:** Code reviewer approves or all findings addressed.

---

## Parallelization

Steps 1-3 are independent (can run in parallel). Steps 4-8 are independent
per-file (can run in parallel). Steps 9-12 are independent (can run in
parallel). Steps 13-16 are sequential (validation depends on prior steps).

**Recommended waves:**

- Wave 1: Steps 1, 2, 3 (data changes)
- Wave 2: Steps 4, 5, 6, 7, 8 (script updates)
- Wave 3: Steps 9, 10, 11, 12 (skill + hook + npm)
- Wave 4: Steps 13, 14, 15, 16 (validation + audit)

All in a single commit per D20.

# Review Data Architecture — Diagnosis

**Date:** 2026-04-17 **Status:** Phase 0 complete

## ROADMAP Alignment

**Aligned.** ROADMAP.md line 374 mentions "explore what else in the repo
benefits from SQLite (review pipeline)" — this consolidation is a prerequisite.
No conflicting work in progress.

## Problem Statement

The review data ecosystem has fragmented across 4+ data stores, 3+ ID formats,
and 6+ scripts over ~120 sessions. No single query can answer "what reviews
exist for PR #N?" — the answer depends on which data stores you check, which ID
format you search for, and whether entries were lost during the big-bang JSONL
migration (commit `21f39b37`, 2026-03-15).

## Current State (9 Issues Surfaced During Investigation)

### I1: Split Data Stores (STRUCTURAL)

Four places store review records:

| Store                                   | Records | Covers         | Format                                |
| --------------------------------------- | ------- | -------------- | ------------------------------------- |
| `reviews.jsonl`                         | 31      | PR #488-516    | JSONL, mixed schema v2/v3             |
| `reviews-archive.jsonl`                 | 508     | PR #243-507    | JSONL, numeric IDs, no schema_version |
| `AI_REVIEW_LEARNINGS_LOG.md`            | ~274    | Active reviews | Markdown (rendered from JSONL)        |
| `docs/archive/reviews-markdown-legacy/` | ~355    | Reviews #1-476 | 12 markdown files, overlapping ranges |

**Verify:**
`wc -l .claude/state/reviews.jsonl .claude/state/reviews-archive.jsonl`

### I2: Mixed ID Formats (SCHEMA)

Four coexisting formats in `reviews.jsonl`:

- `review-pr493-r1` (schema v3, 2 records)
- `rev-66` (schema v2, 28 records)
- `509` (numeric, 1 record)
- `backfill-453-r1` (backfill prefix, in archive)

`write-review-record.ts` auto-ID logic only parses `rev-N` pattern — won't
detect collision with numeric or `review-prN` IDs.

**Verify:**
`node -e "const d=require('fs').readFileSync('.claude/state/reviews.jsonl','utf8').trim().split('\n'); d.forEach(l=>{const r=JSON.parse(l); console.log(r.id, r.schema_version||'none')})" | head -10`

### I3: Review Numbers != PR Numbers (NAMING)

Review #434 is a review OF PR #407 R10, not PR #434. This caused false matches
throughout the pr-retro dashboard investigation. Any search by "PR #N" in review
headings returns wrong results.

### I4: Dashboard Searches Only Active JSONL (QUERY)

`/pr-retro` dashboard (Step D2) searches `reviews.jsonl`,
`AI_REVIEW_LEARNINGS_LOG.md`, and `retros.jsonl` — but NOT
`reviews-archive.jsonl` (508 records). This is the direct cause of the "20 PRs
with no review data" false report.

### I5: Step 6 Can Be Silently Skipped (ENFORCEMENT)

`/pr-review` Step 6 (Learning & JSONL) has no enforcement gate. PRs #434, #444,
#481 have fix commits proving Steps 1-4 ran, but zero learning entries. The
pre-commit hook doesn't check for JSONL record presence.

**Verify:** `git log --oneline --grep="PR #434 R" | wc -l` (expect 4 commits, 0
JSONL records)

### I6: Incomplete Backfills (DATA GAP)

Backfill commit `4613c60e` covered PRs #448-477 but missed #434, #444, #481.
Manual backfills are inherently incomplete because they depend on the operator
knowing which PRs to include.

### I7: Big-Bang Migration Seam (TEMPORAL)

Migration commit `21f39b37` (2026-03-15 07:01) rebuilt JSONL from markdown. PR
#434 R1 fix was committed 56 minutes later (07:57). The review was processed
after migration but the learning system was in flux — entries fell through.

### I8: No Reconciliation Script (VALIDATION)

No script validates "every PR with `fix: PR #N R` commits also has JSONL
records." The review-lifecycle pipeline validates internal JSONL consistency but
not commit-to-JSONL completeness.

### I9: Archive Rotation Creates Blind Spots (LIFECYCLE)

`rotate-jsonl.js` moves entries from `reviews.jsonl` to `reviews-archive.jsonl`
when count exceeds 30. Downstream consumers (pr-retro dashboard, pr-review
warm-up) only read `reviews.jsonl`, creating a growing blind spot as reviews
rotate out.

## Relevant Existing Systems

- **review-lifecycle.js** — central orchestrator
  (sync/archive/validate/reconcile/render)
- **check-review-archive.js** — validation with 64 hardcoded KNOWN_SKIPPED_IDS
- **write-review-record.ts** — writer with Zod validation + auto-ID
- **backfill-reviews.ts** — idempotent rebuilder from markdown sources
- **Shared schema** at `scripts/reviews/lib/schemas/shared.ts` (BaseRecord)

## Reframe Check

This is NOT just a "backfill 3 PRs" task. It's a **data architecture
consolidation** that needs:

1. Single queryable data store (or unified query layer)
2. Canonical ID format
3. Write-time enforcement (no silent Step 6 skips)
4. Reconciliation (commit-to-record completeness check)
5. Consumer migration (all skills/scripts read from unified source)

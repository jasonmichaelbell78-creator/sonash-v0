# Review Lifecycle Pipeline Overhaul — Diagnosis

**Date:** 2026-03-15
**Method:** T3 convergence loop (2 passes, 6 agents, tally: 7 confirmed, 2
corrected, 2 extended, 2 new)

## ROADMAP Alignment

**Aligned** — falls under Meta Pipeline: Tooling & Infrastructure (🔧 1, P0
ACTIVE). The review lifecycle is a core part of the learnings pipeline that
feeds CODE_PATTERNS.md, consolidation, and enforcement. SWS PLAN-v3.md Phase 3
includes ecosystem standardization of the review/learnings ecosystem.

This overhaul is a pre-requisite fix — the current pipeline is producing
corrupt data (overlapping archives, duplicates, stale metadata). Fixing it
before SWS Phase 3 prevents standardizing a broken system.

## Reframe Check

**Not a data cleanup task.** The user explicitly said: "I want fixes to resolve
the problem of why this keeps happening." Past sessions (#193, #195, #207) all
applied tactical patches. This time: structural root-cause fixes.

## Current System Architecture

```
Human writes review → AI_REVIEW_LEARNINGS_LOG.md (markdown)
                          ↓
                    sync-reviews-to-jsonl.js (markdown → JSONL)
                          ↓
                    .claude/state/reviews.jsonl
                     ↙         ↘
        run-consolidation.js    check-review-archive.js (health)
        (pattern extraction)    (validation — NO enforcement)
                ↓
        consolidation.json + CODE_PATTERNS.md

                ↓ (manual trigger)
        archive-reviews.js (move old → archive/)
                ↓
        docs/archive/REVIEWS_N-M.md

                ↓ (session-start)
        surface-lessons-learned.js (topic search)
```

**Orphaned:** `render-reviews-to-md.js` (JSONL→markdown, never called)

## Verified Root Causes (from T3 convergence loop)

### RC-1: No enforcement gate on archive health
- `check-review-archive.js` finds 23 issues → exit 1 → nobody consumes it
- Not called by session-start, no hook gates on it
- **Evidence:** Pass 2B confirmed — zero references in hooks/skills/npm automation

### RC-2: Archive is reactive, not automatic
- Session-start calls `reviews:sync` but NOT `reviews:archive`
- Archive only runs when human remembers or audit suggests it
- **Evidence:** Pass 2B confirmed — session-end skill says "Reactive only"

### RC-3: Consolidation state advances before downstream writes
- `consolidation.json` updates at line 691, CODE_PATTERNS.md writes at line 708
- If CODE_PATTERNS write fails → caught silently, exit 0, patterns lost
- **Evidence:** Pass 2A confirmed — state write precedes CODE_PATTERNS write

### RC-4: Sync doesn't consult archives
- `sync-reviews-to-jsonl.js` normal mode reads ONLY active markdown log
- After JSONL rotation, sync re-appends entries already in JSONL archive
- Creates unbounded growth cycle: rotate → sync re-appends → rotate
- **Evidence:** Pass 2C confirmed — `loadArchiveContent()` only in --repair mode

### RC-5: Concurrent uncoordinated writes during session-start
- `reviews:sync`, `archive-reviews --auto`, and `rotate-jsonl` can all write
  to reviews.jsonl during the same session-start
- No mutex, no sequencing guarantee
- **Evidence:** Pass 2C — NEW finding, 3 scripts writing without coordination

### RC-6: Archive recovery creates duplicates
- If archive file written but active log update fails (Step 7), archive stays
- Next run assigns new archive number, re-archives same entries
- Result: overlapping files (REVIEWS_390-476.md overlapping REVIEWS_384-423.md)
- **Evidence:** Pass 2C confirmed — no rollback of archive file on active log
  write failure

### RC-7: render-reviews-to-md.js orphaned
- JSONL→markdown path exists but never called
- JSONL and markdown can diverge with no reconciliation
- Identified in Session #201 — still unfixed
- **Evidence:** Pass 2B confirmed — 0 references anywhere

## Pass 2 Corrections (claims that were WRONG in Pass 1)

1. **Archive removal IS NOT silent** — failures are caught, exit 2, backup
   preserved. The problem is partial state (archive exists, active log not
   updated), not silence.

2. **Metadata IS auto-updated** — `updateCurrentMetrics()` in archive-reviews.js
   auto-updates line count and active review count during every archival run.
   The drift seen today means archival hasn't run recently (RC-2).

## Past Fix History (why tactical patches fail)

| Session | Fix | Why it didn't hold |
|---------|-----|-------------------|
| #193 | Consolidation keywords expanded, manual run #1/#2 | Keyword list is hardcoded, no auto-discovery |
| #195 | parseTableIds regex fixed, 9 reviews archived | Archive threshold reactive, no rotation |
| #207 | 15 overlapping files → 9 clean, JSONL deduped | One-time manual cleanup, no structural prevention |

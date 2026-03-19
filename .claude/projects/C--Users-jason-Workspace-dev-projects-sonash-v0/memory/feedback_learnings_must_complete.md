---
name: Learnings log must always complete
description:
  PR review learning entry + JSONL record must ALWAYS be written as part of Step
  6/8 — never skip or forget
type: feedback
---

The learning entry (AI_REVIEW_LEARNINGS_LOG.md) and JSONL record
(write-review-record.js) are MANDATORY deliverables of every /pr-review run.
They are NOT optional post-task cleanup.

**Why:** User had to remind Claude to write learnings during PR #448 R1. This
has been a recurring problem — learnings getting dropped or forgotten. The data
is critical for /pr-retro analysis and cross-session pattern tracking.

**How to apply:** After Step 7 verification passes, IMMEDIATELY proceed to Step
6 (learning + JSONL) and Step 8 (summary + commit + state file) — these are
gated steps, not optional appendices. Never claim the review is complete without
all three artifacts: (1) markdown entry in learnings log, (2) JSONL record via
write-review-record.js, (3) state file in .claude/state/.

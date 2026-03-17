---
name: pr-review must use state files for cross-round data
description: pr-review skill must persist previous round counts in state files so compaction/clear doesn't lose them
type: feedback
status: active
---

pr-review warm-up shows "Previous rounds: R1 fixed N, deferred M, rejected K" but currently reconstructs this from conversation context. This breaks after compaction or /clear.

**Why:** Context clearing and compaction are routine — any data that needs to survive across rounds MUST be in the state file, not in conversation memory.

**How to apply:** When implementing state file improvements to pr-review, ensure each round's state file records cumulative data (total/fixed/deferred/rejected per round) so warm-up can always reconstruct the full history from disk. The state file path is `.claude/state/task-pr-review-{pr}-r{round}.state.json`.

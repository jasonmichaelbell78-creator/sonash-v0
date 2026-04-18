# Review Data Architecture — Decisions

**Date:** 2026-04-17 | **Decisions:** 21 | **Status:** Approved

## Decision Table

| #   | Decision                           | Choice                                                                   | Rationale                                                                                     |
| --- | ---------------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| D1  | Data store architecture            | Merge `reviews.jsonl` + `reviews-archive.jsonl` into single file         | 539 records = ~200KB. Rotation causes blind spots. Full upstream/downstream scan required.    |
| D2  | Markdown archives                  | Validate then mark as pure archive                                       | Final reconciliation confirms JSONL completeness. No consumer should reference them.          |
| D3  | AI_REVIEW_LEARNINGS_LOG.md         | Keep rendering                                                           | Generated artifact. Human-readable, costs nothing.                                            |
| D4  | Canonical ID format                | `review-pr{N}-r{M}`                                                      | Self-describing. Encodes PR+round. Eliminates review-vs-PR-number confusion.                  |
| D5  | Existing ID migration              | Leave existing, enforce canonical on new writes only                     | Query by `pr` field, not `id`. Avoids breaking cross-references.                              |
| D6  | Scope                              | Fix + prevent (no SQLite)                                                | Prevention stops future gaps. SQLite is separate future effort.                               |
| D7  | Backfill source for #434/#444/#481 | Parse commit messages                                                    | Structured data in messages. `completeness: "partial"` for honest metadata.                   |
| D8  | Step 6 enforcement                 | Skill gate + post-commit hook                                            | Belt and suspenders. Skill prevents happy-path skip. Hook catches failures.                   |
| D9  | Reconciliation approach            | Add RECONCILE-COMMITS step to `review-lifecycle.js`                      | Runs automatically during `/session-begin`.                                                   |
| D10 | `rotate-jsonl.js`                  | Delete                                                                   | Rotation is root cause of consumer blind spots.                                               |
| D11 | KNOWN_SKIPPED_IDS                  | Eliminate the concept                                                    | PR-based IDs have no expected sequence. Real validation = commit-to-record.                   |
| D12 | Reconciliation trigger             | Session-begin only                                                       | Health check, not gate. Pre-push already heavy.                                               |
| D13 | Schema version normalization       | Add `schema_version: 1` to records missing it                            | Minimal. Avoids data loss. Ensures Zod parseability.                                          |
| D14 | Consumer path updates              | Direct find/replace (no helper abstraction)                              | SQLite helper is separate future plan.                                                        |
| D15 | ARCHIVE step in lifecycle          | Remove entirely                                                          | Git is the backup. Pipeline becomes SYNC → VALIDATE → RECONCILE-COMMITS → RECONCILE → RENDER. |
| D16 | pr-retro search sources            | `reviews.jsonl` + `retros.jsonl` only                                    | JSONL is canonical. Markdown is rendered view.                                                |
| D17 | pr-review enforcement              | Add Critical Rule + Step 6 verification sub-step                         | Visibility (rule) + procedural enforcement (sub-step).                                        |
| D18 | Post-commit hook                   | New `scripts/hooks/check-review-record.js`                               | Immediate feedback at right lifecycle point.                                                  |
| D19 | npm scripts                        | Remove deprecated + add `reviews:reconcile-commits`                      | Clean dead weight, expose new capability.                                                     |
| D20 | Rollout                            | Single commit, logical order: backfill → merge → consumers → enforcement | Atomic. All changes land together.                                                            |
| D21 | review-metrics.jsonl               | Leave as-is                                                              | Per-PR aggregates, structurally different from per-round records.                             |

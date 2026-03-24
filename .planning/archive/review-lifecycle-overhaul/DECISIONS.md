# Review Lifecycle Pipeline Overhaul — Decision Record

**Date:** 2026-03-15 **Decisions:** 20 **Method:** Deep-plan discovery (3
batches), informed by T3 convergence loop (2 passes, 6 agents)

---

## Decision Table

| #   | Decision                        | Choice                                                                                                 | Rationale                                                                                                                                                           |
| --- | ------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1  | Source of truth format          | **JSONL is canonical**                                                                                 | Markdown is a generated view. JSONL correctness > markdown correctness. Eliminates dual-write problem (RC-4, RC-7). Aligns with SWS T21 (shadow-append protection). |
| Q2  | Archive format                  | **Drop markdown archives; JSONL is the archive**                                                       | `render-reviews-to-md.js` generates views on demand. Eliminates entire class of overlapping-archive bugs (RC-6). Accelerates SWS Step 3.16.                         |
| Q3  | Consolidation state ordering    | **CODE_PATTERNS.md first, then advance state**                                                         | If CODE_PATTERNS write fails, state doesn't advance, next run retries. Fixes RC-3. Aligns with SWS T11 (fail loud).                                                 |
| Q4  | Session-start coordination      | **Single `review-lifecycle.js` orchestrator**                                                          | Owns entire sync→archive→rotate→validate→render sequence. Replaces scattered session-start calls. Eliminates concurrent write conflicts (RC-5).                     |
| Q5  | Archive trigger                 | **Automatic in orchestrator**                                                                          | Threshold-based, runs every session-start. ALWAYS automatic, NEVER manual unless skill invocation or prompted response. Fixes RC-2. Aligns with SWS D4.             |
| Q6  | Health check enforcement        | **Final orchestrator step, blocking gate**                                                             | Fix-or-DEBT decision required. Not passive warning. Fixes RC-1. Aligns with SWS T11.                                                                                |
| Q7  | Archive rollback strategy       | **Atomic: temp → update active log → rename**                                                          | Both-or-neither. Prevents partial state that creates duplicates (RC-6). Aligns with SWS T12.                                                                        |
| Q8  | Review authoring workflow       | **Direct JSONL writes via `write-review-record.ts`**                                                   | Already exists with schema validation. Skips fragile markdown parsing entirely.                                                                                     |
| Q9  | AI_REVIEW_LEARNINGS_LOG.md fate | **Read-only auto-generated view**                                                                      | Orchestrator renders from JSONL after every lifecycle run. Never hand-edited. Preserves human readability.                                                          |
| Q10 | render-reviews-to-md.js         | **Wire into orchestrator (review first)**                                                              | Already built for this purpose. Review for correctness, rewrite if bit-rotted. Orchestrator calls it as render step.                                                |
| Q11 | Session-start.js refactor scope | **Minimal — replace 3 review blocks with single orchestrator call**                                    | Don't over-scope. Other lifecycles are separate SWS Step 3.x items.                                                                                                 |
| Q12 | JSONL rotation coordination     | **Orchestrator owns rotation**                                                                         | Sequence: sync→archive→rotate→validate. No re-sync after rotation because JSONL is canonical (not derived from markdown). Fixes RC-4 cycle.                         |
| Q13 | Migration path                  | **Big-bang via `--repair`**                                                                            | Rebuild JSONL from all markdown sources, validate, switch to JSONL-canonical. One-time migration.                                                                   |
| Q14 | Data cleanup timing             | **Structural fix first, cleanup during migration**                                                     | Migration step (Q13) handles cleanup as natural consequence. No more tactical patches.                                                                              |
| Q15 | Error escalation                | **Block immediately**                                                                                  | User decides: fix now or create DEBT with explicit justification. Every run. No wallpaper. No passive surfacing.                                                    |
| Q16 | Obsolete scripts                | **`sync-reviews-to-jsonl.js` → migration-only; `archive-reviews.js` logic absorbed into orchestrator** | Old scripts preserved in `scripts/archive/` for reference but unwired from automation.                                                                              |
| Q17 | Testing strategy                | **Unit tests per phase + integration test**                                                            | Tests live in `scripts/__tests__/`, run in CI via `npm test`. Orchestrator is critical-path (every session-start), needs permanent coverage.                        |
| Q18 | npm script backward compat      | **Old names redirect with deprecation warnings**                                                       | Catches callers we missed during refactoring. Remove aliases after zero deprecation warnings over 3+ sessions.                                                      |
| Q19 | check-review-archive.js         | **Keep standalone, orchestrator calls it**                                                             | Can also run independently for manual diagnostics. Separation of concerns.                                                                                          |
| Q20 | Forward-findings integration    | **Yes — health check findings write to forward-findings.jsonl**                                        | Failed consolidation = finding that affects Code Quality ecosystem. Learning-router processes it. Aligns with SWS Q30/Q31.                                          |

## Root Cause → Decision Mapping

| Root Cause                          | Decisions That Fix It                                      |
| ----------------------------------- | ---------------------------------------------------------- |
| RC-1: No enforcement gate           | Q6 (blocking gate), Q15 (block immediately)                |
| RC-2: Archive reactive              | Q5 (auto-archive), Q4 (orchestrator)                       |
| RC-3: State advances before writes  | Q3 (reorder writes)                                        |
| RC-4: Sync doesn't consult archives | Q1 (JSONL canonical), Q12 (orchestrator owns rotation)     |
| RC-5: Concurrent writes             | Q4 (single orchestrator), Q11 (replace scattered calls)    |
| RC-6: Archive recovery duplicates   | Q7 (atomic operation), Q2 (JSONL archive)                  |
| RC-7: render-reviews orphaned       | Q10 (wire into orchestrator), Q9 (auto-generated markdown) |

## SWS Alignment

All 20 decisions verified against PLAN-v3.md. No deviations. Key alignments:

- T11 (fail loud): Q3, Q6, Q15
- T12 (rollback): Q7
- T21 (shadow-append): Q1, Q2
- D4 (automation over manual): Q5
- D48 (archival patterns): Q2, Q7
- Q30/Q31 (forward-findings): Q20
- Step 3.16 (Archival/Rotation): Q2, Q7 accelerate this
- Step 3.3 (PR Review L4→L5): Q4 pre-positions lifecycle hooks

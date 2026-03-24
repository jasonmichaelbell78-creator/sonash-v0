# Decision Record: Plan Orchestration

**Date:** 2026-03-24 **Questions Asked:** 20 **Decisions Captured:** 26

## Strategic Sequencing

| #   | Decision                  | Choice                                                                                              | Rationale                                                                                            |
| --- | ------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 1   | SWS start timing          | Prep-first — complete all non-SWS plans before starting SWS                                         | Non-SWS plans are only 5-8 sessions total. 5% delay for a cleaner foundation and richer CANON input. |
| 2   | Feature drought response  | Insert M1.6 (~5-8 sessions) at SWS interleave point after C1 CANON                                  | Breaks 171-session feature drought at earliest natural SWS pause. Minimal schedule impact.           |
| 3   | Meta Pipeline enforcement | T&I, CQ, DE completed or integrated into SWS. Begin after CANON.                                    | Meta Pipelines are not external prerequisites. They exist within SWS, starting after Step 1 (CANON). |
| 4   | SWS scope management      | Checkpoint gates at each SWS chunk boundary — explicit continue/reduce/pause decision               | Preserves full ambition while adding escape valves. Second System Effect mitigation.                 |
| 5   | WIP policy                | WIP=1 per session as default. Parallel welcome where risk is low.                                   | Eliminates context-switching and decision fatigue. Session priority list determines what to pick.    |
| 6   | S0 debt handling          | Sprint in Wave 0 with pre-verification agents (triage) → fixes → post-verification agents (confirm) | 4 RESOLVED items to clean, ~8 real unresolved issues to triage. Agent-verified before and after.     |

## Operational Decisions

| #   | Decision                        | Choice                                                                                                | Rationale                                                                                        |
| --- | ------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 7   | Wave 0 structure                | Combined — S0 pre-verify agents run parallel with repo-cleanup, then S0 fixes after cleanup           | Pre-verification is read-only. Repo-cleanup gives a cleaner codebase for S0 fixes.               |
| 8   | Pre-commit ownership protocol   | Comment-delimited sections with plan ownership labels                                                 | Lightest-weight solution for 4-plan contention. Clear ownership, easy merge.                     |
| 9   | Session-start.js merge protocol | Sequence only — PS → CLI → AE, no overlap                                                             | Plans modify different aspects. Strict ordering is sufficient without function-level ownership.  |
| 10  | Propagation open decisions      | Resolve 7 open items inline (D13-D18)                                                                 | Decisions are concrete enough to resolve here without a separate /deep-plan session.             |
| 11  | Schedule re-validation cadence  | Every SWS checkpoint (aligns with D4 checkpoint gates)                                                | Natural boundaries. Avoids calendar-watching overhead.                                           |
| 12  | PR review approach              | Tiered — multi-AI review for high-risk PRs (propagation W2, agent-env, SWS), self-review for low-risk | High-risk PRs benefit from bot review (CodeRabbit/SonarCloud). Low-risk PRs don't need overhead. |

## Propagation Open Items (per D10)

| #   | Decision                             | Choice                                                                               | Rationale                                                                                            |
| --- | ------------------------------------ | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| 13  | Baseline granularity (Step 5)        | Per-file structure: `{"file": "path", "violations": ["rule1"]}`                      | Mirrors how propagation check scans (file by file). Simplest to maintain.                            |
| 14  | Shared-lib scope (Step 8)            | Progressive — library utility files first (W2), full dedup deferred to future sprint | Gets highest-value dedup without 186-file blast radius in one step.                                  |
| 15  | continue-on-error scope (Step 2)     | Triage: security check + docs check → remove. Audit-validate + debt-views → keep.    | Security and docs should fail the build. Audit/debt views are informational, non-blocking by design. |
| 16  | File count discrepancies (Steps 6-7) | Pre-execution triage agent to produce exact file lists before starting               | 5-minute agent task that prevents mid-execution surprises. Plan says 9/23, grep found 55/34.         |
| 17  | Rollback strategy (W2)               | Per-step atomic commits — each step is one commit, revert individually               | Most granular rollback for mass refactoring. Research validated as feasible.                         |
| 18  | Wave sequencing flexibility          | Allow W3 overlap with W2 tail — gitleaks + sec-helpers can start once Step 8 done    | Captures easy parallelism win without over-complicating.                                             |

## Planning & Integration

| #   | Decision                    | Choice                                                           | Rationale                                                                                                     |
| --- | --------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 19  | Planning-32326 merge        | Merge as-is — all research/planning artifacts go to main         | Full provenance. Research artifacts, findings, challenges are valuable for re-validation.                     |
| 20  | M1.6 insertion point        | After SWS C1 (CANON) — earliest natural SWS pause                | Breaks feature drought at ~15-18 sessions in. M1.6 is 75% complete, ~5-8 sessions to finish.                  |
| 21  | SWS checkpoint gate format  | Structured checklist + /alerts health data combined              | Predefined questions (scope valid? velocity? new debt? user-facing needed?) plus health score trend.          |
| 22  | Agent teams for Wave 1      | Agent-env P4 internal parallelism only                           | P4 sub-steps (pruning, configs, validation) are clearly independent. Propagation W2 too risky to parallelize. |
| 23  | Research artifact retention | Keep permanently — full provenance, enables --refresh comparison | Disk cost negligible. Findings are the verification backbone.                                                 |

## Verification Philosophy

| #   | Decision                      | Choice                                                                                                                                                            | Rationale                                                                                                              |
| --- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 24  | CL verification (pre-change)  | CL agents at key boundaries to verify plan claims before major changes. Never assume plan info is 100%.                                                           | Plans were written at various times. Codebase evolves. Fresh verification prevents wasted effort on stale assumptions. |
| 25  | CL verification (post-change) | CL agents to verify fixes/changes AFTER they're made. No grep-only verification — contextual, multi-level checks (functional tests, execution, state inspection). | Grep confirms strings exist, not that features work. Verification must prove correctness, not pattern presence.        |
| 26  | Audit checkpoints             | Phase/wave/step-level audits at appropriate locations. Audit scope scales with change risk.                                                                       | Light audits for cleanup, heavy audits for mass refactoring and SWS ecosystem work. Proportional to blast radius.      |

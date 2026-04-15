# DECISIONS: Multi-skill Batched Audit Mode for /skill-audit

<!-- prettier-ignore-start -->
**Created:** 2026-04-14 (Session #281)
**Status:** Decision record — source of truth for implementation
**Companion docs:** [DIAGNOSIS.md](./DIAGNOSIS.md), [PLAN.md](./PLAN.md)
<!-- prettier-ignore-end -->

All decisions captured from 20-question Discovery phase (3 batches + naming +
follow-up).

---

## Seed Decisions (locked before Discovery)

| #   | Decision                                                                                                 | Rationale                                                                               |
| --- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| S1  | Three modes: `single`, `batch`, `multi` (names finalized in D7)                                          | Pre-seeded in thread; `batch` = single skill batched output, `multi` = N skills batched |
| S2  | Inline sequential execution, no background agents                                                        | User explicitly rejected parallel agent simulation (drift risk)                         |
| S3  | Shape Y orchestration: audit-all → decide-all → implement-all                                            | Enables cross-skill systemic pattern detection before fixes                             |
| S4  | Cross-category conflicts resolved at end of Phase 2 / Phase 3 crosscheck, not mid-audit (in batch/multi) | Findings produced before decisions in batch/multi modes                                 |
| S5  | Tmp files at `.claude/tmp/skill-audit-<name>-findings.md`                                                | Matches existing `/alerts` pattern convention                                           |
| S6  | `single` remains default mode, preserves backward compat                                                 | Existing callers and skill-creator scaffolding unchanged                                |
| S7  | Design + spec only in this plan; implementation is separate approval                                     | Per CLAUDE.md guardrail #2                                                              |

---

## Discovery Decisions

### Architecture & Scope (Batch 1)

| #   | Decision                          | Choice                                                                                                                                                                                        | Rationale                                                                                                                                               |
| --- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Findings producer                 | Main-session LLM produces findings in-conversation, written to tmp file                                                                                                                       | Only drift-free option. Dispatched-agent rejected earlier in thread. Script-only can't cover judgment-heavy categories.                                 |
| D2  | Per-skill findings flow           | Atomic per-skill: all 12 categories produced in one batch per skill, then move to next                                                                                                        | Clean state tracking, recovery if interrupted mid-skill, user reviews complete reports not partials                                                     |
| D3  | Tmp file format                   | Extended state file (`.claude/state/task-skill-audit-<name>.state.json`) carries findings; markdown rendered from it to `.claude/tmp/`                                                        | Single source of truth, no JSON/MD sync drift, self-audit.js already reads state file                                                                   |
| D4  | Orchestration state               | New parent file `.claude/state/task-skill-audit-batch-<batch-id>.state.json` tracks batch members + each skill's phase status + cross-skill patterns; per-skill files keep existing schema    | Compaction-safe, natural place for cross-skill data, doesn't pollute per-skill schema                                                                   |
| D5  | CLI entry syntax                  | `/skill-audit` → interactive mode prompt ("single / batch / multi?") as FIRST GATE. Multi mode follow-up prompts for skill list. **No CLI flags for mode.**                                   | User override of flag-based recommendation. Keeps mode selection explicit and discoverable.                                                             |
| D6  | Findings equivalence across modes | `batch` and `single` produce IDENTICAL findings (same 12 categories, same pros/cons/gaps/suggestions/opportunities depth). Only **delivery** differs — batched-at-once vs gated-per-category. | Faithfulness requires same rubric. Lighter scan would be simulation.                                                                                    |
| D7  | Mode naming                       | `single / batch / multi` (renamed from seed `quick` → `batch`)                                                                                                                                | "batch" is clear; "quick" was misleading (wasn't about speed, was about output format). `multi` implies batched since no multi-interactive mode exists. |

### Phase Mechanics (Batch 2)

| #   | Decision                                                                             | Choice                                                                                                                                                                                                                                                                            | Rationale                                                                                                                                                                                                                                                      |
| --- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D8  | Phase 2 structural split                                                             | Two Phase 2 variants documented in SKILL.md: **Phase 2a (single, gated)** and **Phase 2b (batch/multi, batched)**. Line 118 MUST ("one category at a time, wait for user response, do NOT batch") scopes to Phase 2a ONLY.                                                        | Cleanest documentation. No confusing conditional MUST. Variant rules scoped to where they apply.                                                                                                                                                               |
| D9  | Decision collection in batch/multi                                                   | New **Phase 2.B (decision collection)** interactive phase after findings produced and tmp file rendered. Walk each category's suggestions, collect accept/modify/reject/alternative, same schema as single's per-category decisions. State saved after each category's decisions. | Faithful to single's decision-capture rubric. User has already reviewed findings so walkthrough is fast. Avoids brittle file-edit workflow or error-prone single-mega-message approach.                                                                        |
| D10 | Cross-category conflict detection                                                    | **Real-time during Phase 2.B** (flag when decision N conflicts with earlier decision M) **+ final sweep pass** after Phase 2.B completes to catch anything missed                                                                                                                 | Best UX while preserving category context; final sweep is backstop. Phase 3 untouched — it's about skill-creator + ecosystem impact, not conflict resolution.                                                                                                  |
| D11 | **SCOPE EXPANSION:** Remove code-reviewer agent layer from all modes of /skill-audit | Drop Phase 5.2 Layer 2 "Independent agent verification" MUST. Drop SKILL.md line 385-388 audit-review-team recommendation. Replace self-audit.js Dim 6 MANUAL code-reviewer block with stronger deterministic checks or document as N/A.                                          | Agent verification is redundant with Layer 1 grep + Layer 3 diff mapping. Another LLM reading same inputs = echo, not independent check. Same drift risk as producing findings with agents (already rejected). Session #280 self-audit.js made this vestigial. |
| D12 | Phase 5 self-audit in batch/multi                                                    | Parallel `self-audit.js` invocations per skill (one per skill in the batch), aggregated summary presented to user                                                                                                                                                                 | No new wrapper script needed. Parallelizable. (i) per-skill-sequential works but is slower. (iii) new script adds no new capability.                                                                                                                           |
| D13 | State save cadence during batch findings production                                  | Save after each category's findings generated (same cadence as single mode saves decisions)                                                                                                                                                                                       | Compaction resilience is cheap to add and expensive to lose. Batch production of 12 categories is significant token work.                                                                                                                                      |

### Rollout, Failure Modes, Polish (Batch 3)

| #   | Decision                               | Choice                                                                                                                                                                                                                                                                                                                            | Rationale                                                                                                                                                |
| --- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D14 | Faithfulness verification strategy     | **Both rubric reference + parity test.** Design guarantee: both modes read same REFERENCE.md per-category procedure. Empirical proof: run one skill through both `single` and `batch`, compare findings, document parity-test results in plan.                                                                                    | Rubric alone is weak ("trust me"); parity alone misses future-drift concern. Both together: design + evidence.                                           |
| D15 | Rollout strategy                       | **All three modes in one pass.** Single coherent implementation, not phased. (User override of phased `batch`-first recommendation.)                                                                                                                                                                                              | User prefers coherent ship.                                                                                                                              |
| D16 | Mid-batch abandonment handling         | Tmp + state files persist. `/skill-audit` on same skill/batch detects partial findings and offers resume from last saved category.                                                                                                                                                                                                | Matches existing SKILL.md pause/resume pattern (line 359-360). Consistent across modes.                                                                  |
| D17 | Compaction resilience (multi-specific) | Parent batch state file + per-skill state files preserved. Resume reads parent, identifies last-active skill, reads its per-skill state, continues from last saved category.                                                                                                                                                      | Compaction resilience is cheap. D4 parent state file already supports this.                                                                              |
| D18 | Tmp file lifecycle                     | Created at `.claude/tmp/skill-audit-<name>-findings.md` during findings production. Archived to `.claude/tmp/history/skill-audit-<name>-<timestamp>-findings.md` at Phase 6 end. Rolling last-5 retained per skill.                                                                                                               | History supports parity-test debugging (D14). Rolling cap prevents tmp bloat. Matches `/alerts` tmp convention.                                          |
| D19 | audit-review-team.md disposition       | **Rewrite to remove /skill-audit references.** Keep the team config for `/audit-comprehensive` and generic multi-target audits that don't have 12-category-rubric fidelity concerns. Delete SKILL.md line 385-388 recommendation. Delete team config's "Spawn Trigger" item 1 (`/skill-audit` invocation targeting 3+ artifacts). | Team mechanism (reviewer + fixer loop, cross-target pattern reuse) is useful in other audit contexts. Only the skill-audit-specific use was problematic. |

### Follow-up (Batch 4)

| #   | Decision                                    | Choice                                                                                                                                                                                                            | Rationale                                                                                                                                                                                 |
| --- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D20 | Phase 3 crosscheck sequencing in multi-mode | **Batched Phase 3.** Single crosscheck pass covering all skills' gaps at once. Skill-creator reviewed once for composite gap list. Adjacent-contract checks aggregated across batch. Ecosystem impact aggregated. | Matches Shape Y cross-skill philosophy. Running skill-creator crosscheck 7 times is pure waste; gap set converges quickly. Catches cross-skill inconsistencies pure-per-skill would miss. |

---

## Decision Summary Counts

- **Total decisions:** 27 (7 seed + 20 discovery)
- **Accepted:** 27 (0 rejected, 0 modified)
- **User overrides of recommendations:** 2 (D5 CLI interactive-prompt; D15
  rollout one-pass)
- **Scope expansions:** 1 (D11 — remove code-reviewer agent layer from all
  modes; originally scope was batch-mode only)

---

## Cross-Cutting Principles

1. **Faithfulness over speed.** Findings must be equivalent to what single mode
   would produce. No shortcuts that change the rubric (D1, D6, D14).
2. **Deterministic checks over agent opinion.** Where verification is possible
   via grep/diff/schema validation, prefer that over LLM verification (D11).
3. **State-file-as-source-of-truth.** JSON state is canonical; markdown is
   rendered (D3, D18).
4. **Compaction-safe.** Every long phase saves state per category (D13, D16,
   D17).
5. **Backward-compatible.** `single` mode default; existing callers and
   skill-creator scaffolding unchanged (S6, D5).
6. **Implementation-separate approval.** This plan specifies; execution requires
   separate go-ahead (S7).

---

## Version History

| Version | Date       | Description                                                       |
| ------- | ---------- | ----------------------------------------------------------------- |
| 1.0     | 2026-04-14 | Initial decision record from 20-question Discovery (Session #281) |

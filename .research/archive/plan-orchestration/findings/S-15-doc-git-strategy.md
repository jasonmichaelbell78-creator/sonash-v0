# Findings: Documentation Cascade & Git/Branch Strategy

**Searcher:** deep-research-searcher (cross-cutting analyst) **Profile:**
codebase **Date:** 2026-03-24 **Sub-Question IDs:** S-15 (cross-cutting L3
analysis) **Inputs:** S-01 through S-13 findings, DIAGNOSIS.md, filesystem
verification

---

## 1. Documentation Cascade Map

Every document created or modified by a plan, cross-referenced with plans that
read or depend on that document.

### 1.1 Core Documents (Modified by 2+ Plans)

| Document                                 | Created/Modified By                                                                                                                                                                                                  | Referenced/Read By                                                                                                                               | Update Order Required?                                                                                                                     |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `CLAUDE.md`                              | **RC** (Step 10e: version ref in agent-orchestration cross-ref), **CLI** (Step 17: add Section 6b tool preferences), **AE** (Step 5.1: update Section 7 triggers), **SWS** (various: standards reference throughout) | All plans (loaded every session). PS references Guardrail #6. AE reads Section 7 for trigger mapping. SWS references all sections for standards. | YES. CLI and AE modify different sections (6b vs 7) -- no conflict. Both before SWS. RC's version ref update is cosmetic and can go first. |
| `.claude/skills/session-begin/SKILL.md`  | **PS** (Step 8: extend Section 4.2 warning gate with 4 new flag sources), **SWS** (Step 7: formalize session lifecycle)                                                                                              | AE reads session lifecycle during Phase 5 integration. SWS Step 7 formalizes it.                                                                 | YES. PS before SWS -- PS adds the gate that SWS would formalize.                                                                           |
| `.claude/skills/alerts/SKILL.md`         | **PS** (Step 11: evaluate via /skill-audit, may modify), **AE** (Step 5.4: add Agent Cost category), **SWS** (Step 11: formalize alert schemas)                                                                      | PS evaluates; AE adds section; SWS standardizes.                                                                                                 | YES. PS -> AE -> SWS.                                                                                                                      |
| `.claude/skills/skill-audit/SKILL.md`    | **AE** (Step 5.2: add agent-based verification), **SWS** (Step 2: canonize as primary mechanism)                                                                                                                     | SWS relies on the complete skill.                                                                                                                | YES. AE before SWS.                                                                                                                        |
| `.claude/skills/create-audit/SKILL.md`   | **AE** (Step 5.2: add agent architecture recommendations), **SWS** (Step 14: referenced during Audits)                                                                                                               | SWS references the completed skill.                                                                                                              | YES. AE before SWS.                                                                                                                        |
| `docs/agent_docs/AGENT_ORCHESTRATION.md` | **RC** (Step 10e: update version reference)                                                                                                                                                                          | AE Phase 5 may reference for orchestration guidance.                                                                                             | WEAK. RC first is cleaner.                                                                                                                 |
| `.claude/skills/SKILL_INDEX.md`          | **RC** (Step 7: correct count to 65, add 4 entries)                                                                                                                                                                  | All plans implicitly (skill lookup). AE Phase 5 new agents update count. SWS Step 2 canonizes.                                                   | YES. RC first (baseline correction), then AE (adds new agents), then SWS.                                                                  |
| `.claude/COMMAND_REFERENCE.md`           | **RC** (Step 7: add 4 skills)                                                                                                                                                                                        | All plans (command lookup).                                                                                                                      | RC first. Low contention.                                                                                                                  |
| `.claude/HOOKS.md`                       | **RC** (Step 10c: add gsd-check-update.js entry)                                                                                                                                                                     | PS references for hook inventory.                                                                                                                | WEAK. RC first is accurate.                                                                                                                |
| `docs/TRIGGERS.md`                       | **RC** (Step 10b: add PreToolUse hooks, update counts)                                                                                                                                                               | PS references hook trigger counts.                                                                                                               | WEAK. RC first for accuracy.                                                                                                               |
| `ROADMAP.md`                             | **SWS** (D70: add Track-CANON items after each ecosystem step)                                                                                                                                                       | AE reads for sprint alignment. SESSION_CONTEXT.md references. All plans check alignment.                                                         | SWS-only modifier. No pre-update needed.                                                                                                   |
| `SESSION_CONTEXT.md`                     | **SWS** (D70: update quick status after each ecosystem step)                                                                                                                                                         | All plans read at session start (loaded via session-begin). AE Phase 1 reads session patterns.                                                   | SWS-only modifier. Other plans read-only.                                                                                                  |
| `DOCUMENTATION_INDEX.md`                 | **SWS** (Steps 5, 20: updated during Docs standardization and verification)                                                                                                                                          | All plans (doc lookup). docs:index script generates it.                                                                                          | SWS-only modifier. Auto-generated.                                                                                                         |
| `docs/DOCUMENT_DEPENDENCIES.md`          | **SWS** (Step 5: canonize)                                                                                                                                                                                           | crossdoc:check script reads it.                                                                                                                  | SWS-only modifier.                                                                                                                         |

### 1.2 Documents Created by a Single Plan (New)

| Document                                     | Created By           | Referenced By                            | Notes                         |
| -------------------------------------------- | -------------------- | ---------------------------------------- | ----------------------------- |
| `docs/CLI_USER_GUIDE.md`                     | **CLI** (Step 22)    | None initially. SWS Step 5 may canonize. | New doc, no cascade.          |
| `.canon/README.md`                           | **SWS** (Step 1h)    | All plans post-CANON.                    | New, SWS-internal.            |
| `.canon/tenets.md`                           | **SWS** (Step 1b)    | Generated view. All plans post-CANON.    | Generated from JSONL.         |
| `tools/statusline/config.local.toml.example` | **SL** (Steps 2, 11) | Cross-locale setup docs.                 | Self-contained to statusline. |

### 1.3 Documents Modified by a Single Plan (Existing)

| Document                                    | Modified By                                 | Referenced By                      | Notes                     |
| ------------------------------------------- | ------------------------------------------- | ---------------------------------- | ------------------------- |
| `ARCHITECTURE.md`                           | **RC** (Step 10a: fix version table)        | Read-only by developers.           | No downstream dependency. |
| `docs/SECURITY.md`                          | **RC** (Step 10d: reference CLAUDE.md v5.6) | Read-only.                         | No downstream dependency. |
| `DEVELOPMENT.md`                            | **RC** (Step 10f: refresh context)          | Read-only.                         | No downstream dependency. |
| `AI_WORKFLOW.md`                            | **RC** (Step 10g: clarify S2+S4 authority)  | Session startup (read-only).       | No downstream dependency. |
| `.claude/skills/_shared/SKILL_STANDARDS.md` | **SWS** (Step 2)                            | All skills (compliance reference). | SWS-internal.             |

### 1.4 Skill Documents Modified by Multiple Plans

| Skill Document                                            | Plans                                                                                                               | Nature of Changes                                                                                    |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 4x ecosystem audit skills (hook, script, session, health) | **PS** (Step 9: add compliance category), **PR** (Step 8: shared-lib extraction), **SWS** (Steps 2-14: standardize) | PS: content addition. PR: structural refactoring. SWS: full standardization. Order: PS -> PR -> SWS. |
| `session-end/SKILL.md`                                    | **AE** (Step 5.4: add agent Teams metrics), **SWS** (Step 7: formalize)                                             | AE adds feature; SWS standardizes. AE before SWS.                                                    |
| `convergence-loop/SKILL.md`                               | **AE** (Step 5.2: add team-based verification)                                                                      | AE-only modifier. SWS would standardize later.                                                       |
| `deep-plan/SKILL.md`                                      | **AE** (Step 5.2: add agent delegation)                                                                             | AE-only modifier. SWS would standardize later.                                                       |

---

## 2. Cross-Doc Dependency Chains

If Plan A updates Document X, and Plan B reads or modifies Document X later:

| Chain ID  | Upstream Plan | Document                                                                   | Downstream Plan                                                     | Risk if Stale                                                                                                                                         |
| --------- | ------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **DC-01** | **PS**        | `session-begin/SKILL.md` (Section 4.2 gate)                                | **SWS** (Step 7: formalize lifecycle)                               | HIGH -- SWS would formalize an incomplete gate missing 4 flag sources. SWS would need to redo the gate.                                               |
| **DC-02** | **AE**        | Agent `.md` files (37+ files)                                              | **SWS** (Step 13: Agents ecosystem)                                 | HIGH -- SWS standardizes agents AE hasn't improved. Memory note: "all 5 phases must complete before SWS Phase 1."                                     |
| **DC-03** | **AE**        | `skill-audit/SKILL.md`                                                     | **SWS** (Step 2: canonize as primary mechanism)                     | MEDIUM -- SWS canonizes skill without agent-based verification from AE.                                                                               |
| **DC-04** | **AE**        | `CLAUDE.md` Section 7                                                      | **SWS** (ongoing reference)                                         | MEDIUM -- SWS references an outdated trigger table if AE hasn't updated it.                                                                           |
| **DC-05** | **CLI**       | `CLAUDE.md` Section 6b                                                     | **SWS** (ongoing reference)                                         | LOW -- SWS can govern the section whenever it appears. Additive.                                                                                      |
| **DC-06** | **PS**        | 4x ecosystem audit skills                                                  | **PR** (Step 8: shared-lib extraction)                              | MEDIUM -- if PR extracts shared-lib before PS adds compliance category, PS targets change. PS must run first.                                         |
| **DC-07** | **PR**        | 10x ecosystem audit skills (shared-lib)                                    | **SWS** (Steps 2-14: standardize)                                   | MEDIUM -- SWS standardizes skills with duplicated code if PR hasn't extracted shared-lib yet.                                                         |
| **DC-08** | **PS**        | `session-start.js` (7 violations fixed)                                    | **CLI** (Step 18: add tool detection)                               | MEDIUM -- CLI inherits broken surfacing patterns and may create merge conflicts if PS hasn't cleaned up first.                                        |
| **DC-09** | **RC**        | `SKILL_INDEX.md` (count correction)                                        | **AE** Phase 5 (new agents change count), **SWS** Step 2 (canonize) | LOW -- Stale count is cosmetic. Each plan should verify count when modifying.                                                                         |
| **DC-10** | **RC**        | `docs/TRIGGERS.md`, `.claude/HOOKS.md`                                     | **PS** (implicit -- modifies hook behavior these docs describe)     | LOW -- If PS runs first, RC docs may capture behavior PS is about to change. If RC runs first, docs reflect pre-PS state. Either way, minimal impact. |
| **DC-11** | **AE**        | `alerts/SKILL.md` (Agent Cost category)                                    | **SWS** (Step 11: formalize alert schemas)                          | MEDIUM -- SWS formalizes incomplete alerts skill without AE's category.                                                                               |
| **DC-12** | **AE**        | `session-end/SKILL.md` (Teams metrics)                                     | **SWS** (Step 7: formalize lifecycle)                               | MEDIUM -- SWS formalizes session-end without token monitoring section.                                                                                |
| **DC-13** | **PR**        | `known-propagation-baseline.json`                                          | **SWS** (D49: downstream propagation mechanism)                     | LOW -- SWS can adopt the baseline pattern. Different timeline.                                                                                        |
| **DC-14** | **AE**        | `create-audit/SKILL.md`, `convergence-loop/SKILL.md`, `deep-plan/SKILL.md` | **SWS** (Steps 2, 14)                                               | LOW -- SWS references final state. AE completes first by mandate.                                                                                     |

### Critical Dependency Chains (Must Enforce Order)

1. **PS -> SWS** via `session-begin/SKILL.md` (DC-01) -- PS must complete Step 8
   before SWS Step 7
2. **AE -> SWS** via agent definitions and 4+ skills (DC-02, DC-03, DC-04,
   DC-11, DC-12, DC-14) -- AE all 5 phases before SWS Phase 1 (hard block)
3. **PS -> PR** via 4x ecosystem audit skills (DC-06) -- PS Step 9 before PR
   Step 8
4. **PS -> CLI** via `session-start.js` (DC-08) -- PS Step 1 before CLI Step 18

---

## 3. Git Branch Strategy

### Current State

- **Current branch:** `planning-32326` (clean working tree)
- **Main branch:** `main`
- `planning-32326` is currently used for plan orchestration research/meta-work

### Per-Plan Branch Recommendation

| Plan                              | Branch Name                     | Strategy                                     | Rationale                                                                                                                                                                                                           |
| --------------------------------- | ------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **repo-cleanup**                  | `cleanup/repo-hygiene`          | Own branch (plan specifies this name)        | Plan already specifies this branch name in Step 1. Destructive operations (file deletions) benefit from isolation. Single PR.                                                                                       |
| **custom-statusline**             | `feature/custom-statusline`     | Own branch                                   | Large scope (11 new files, Go binary), 3-4 sessions. Needs isolation for iterative development. New directory `tools/statusline/` is fully isolated. Single PR at end.                                              |
| **cli-tools-implementation**      | `feature/cli-tools`             | Own branch                                   | Multi-session (3-4 hours), creates new directories (`tool-configs/`), modifies critical files (CLAUDE.md, session-start.js, settings.json). Isolation needed for safe iteration.                                    |
| **passive-surfacing-remediation** | `fix/passive-surfacing`         | Own branch                                   | Modifies 19+ files across hooks/scripts/skills. Single-commit strategy (per D17) but the breadth of changes warrants branch isolation for code review.                                                              |
| **propagation-research**          | `refactor/propagation`          | Own branch                                   | 4 waves touching 100+ files in Waves 2-3. Mass refactoring absolutely requires isolation. Multiple commits (one per wave recommended).                                                                              |
| **agent-env (Phases 4-5)**        | `feature/agent-env-p4-p5`       | Own branch                                   | Modifies 37+ agent files, 4+ skills, CLAUDE.md, hooks. Critical path item -- needs clean isolated state for code review.                                                                                            |
| **SWS**                           | `feature/sws-step-N` (per step) | Multiple branches (one per checkpoint phase) | XL plan (80-130 sessions). Single branch would be unmanageable. Recommend: `feature/sws-canon` for Step 1, `feature/sws-cp1` for Steps 2-4, `feature/sws-cp2` for Steps 5-7, etc. Merge to main at each checkpoint. |
| **planning-32326** (current)      | Keep for meta-work              | Planning/research only                       | This branch holds the orchestration research. Should be merged to main after orchestration PLAN.md is complete. Should NOT be used for any plan execution.                                                          |

### Branch Isolation Analysis

**Plans that MUST have their own branch:**

1. **propagation** -- 100+ files in W2 mass refactoring. Cannot share a branch.
2. **SWS** -- 80-130 sessions. Must checkpoint-merge to main regularly.
3. **agent-env** -- 37+ agent files. Critical path. Needs clean review surface.

**Plans that COULD share a branch (but should not):**

- RC + PS share no critical files and could theoretically run on one branch. But
  RC uses destructive operations (deletions) that benefit from isolated review,
  and PS modifies 19+ files. Separate branches provide better PR review surface.

**Plans that are fully isolated from each other (parallel-safe on separate
branches):**

- SL and RC -- zero file overlap
- SL and PS -- zero file overlap
- SL and PR -- zero file overlap
- RC and PR -- zero file overlap (different `scripts/` files)

---

## 4. PR Batching Recommendations

| PR #      | Plans Included       | Branch                                | Rationale                                                                                                                                    | Risk                                                                          | Estimated Size                            |
| --------- | -------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------- |
| **PR-1**  | repo-cleanup         | `cleanup/repo-hygiene`                | Small, self-contained, clears the deck. DIAGNOSIS says "should go first." Quick review (14 steps, ~60-90 min work).                          | LOW -- deletions and doc updates. Easy rollback.                              | ~15 files changed (7 deleted, 8 modified) |
| **PR-2**  | passive-surfacing    | `fix/passive-surfacing`               | 33 violation fixes across 19+ files. Single-commit per D17. Clean PR because all changes follow the same 5-pattern taxonomy.                 | LOW -- behavioral fixes, no structural changes.                               | ~21 files changed                         |
| **PR-3**  | propagation W1       | `refactor/propagation` (W1 commit)    | Critical fixes only (Steps 1-5). Small, surgical. Could be reviewed quickly. Separate from W2's mass refactoring.                            | LOW -- 5 targeted fixes.                                                      | ~5-8 files changed                        |
| **PR-4**  | propagation W2-W4    | `refactor/propagation` (W2-4 commits) | Mass refactoring (Steps 6-14). Large PR but all changes follow consolidation patterns. Batching W2-4 avoids 3 separate PRs for related work. | MEDIUM -- 100+ files in W2. Needs careful review.                             | ~100-150 files changed                    |
| **PR-5**  | cli-tools            | `feature/cli-tools`                   | All 25 steps. Multi-session but self-contained. New directories + tool configs + hook modifications.                                         | LOW-MEDIUM -- mostly new files, some modifications to critical infra.         | ~15-20 files changed                      |
| **PR-6**  | custom-statusline    | `feature/custom-statusline`           | All 14 steps. Fully isolated Go binary + old statusline deletion.                                                                            | LOW -- new directory, 3 deletions, 2 modifications.                           | ~14 files changed                         |
| **PR-7**  | agent-env P4-5       | `feature/agent-env-p4-p5`             | Phases 4-5 only (1-3 already merged). Agent improvements + process integration.                                                              | MEDIUM -- wide footprint (37+ agent files, skills, hooks, CLAUDE.md).         | ~50+ files changed                        |
| **PR-8+** | SWS (per checkpoint) | `feature/sws-step-N`                  | One PR per checkpoint phase. PR-8 = Steps 1-4 (CANON + pilot), PR-9 = Steps 5-7, PR-10 = Steps 8-15, PR-11 = Steps 16-21.                    | HIGH per PR -- SWS touches everything. Checkpoint merges reduce blast radius. | Varies: 20-100+ files per checkpoint      |

### Alternative: Aggressive Batching

If the user wants fewer PRs:

| Batch PR    | Plans    | Rationale                                                                                                                                                   | Risk                                                                    |
| ----------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Batch-A** | RC + PS  | Both are "fix/cleanup" in nature. RC cleans orphans, PS fixes violations. Combined PR tells a coherent story: "Clean up the repo and fix surfacing issues." | MEDIUM -- 36+ files, but changes are complementary and non-overlapping. |
| **Batch-B** | CLI + SL | Both are "developer tooling." CLI sets up tools, SL replaces statusline with Go binary. Combined PR: "Upgrade developer environment."                       | LOW -- nearly zero file overlap (only settings.json, different keys).   |
| **Batch-C** | PR W1-W4 | All propagation in one PR.                                                                                                                                  | MEDIUM-HIGH -- 100+ files but all follow consolidation patterns.        |

---

## 5. Merge Order

### Mandatory Constraints

1. **agent-env PR must merge before any SWS PR** (hard dependency -- memory
   note)
2. **PS should merge before CLI** (DC-08: session-start.js cleanup before
   additions)
3. **PS should merge before PR W2** (DC-06: ecosystem audit skill categories
   before shared-lib extraction)
4. **All non-SWS PRs should merge before SWS PR-8** (soft -- SWS benefits from
   all plans completing first)

### Recommended Merge Order

```
PR-1: repo-cleanup           (Wave 0 -- clears deck)
  |
  v
PR-2: passive-surfacing      (Wave 1a -- fix violations before others modify hooks)
  |
  +---> PR-3: propagation W1  (Wave 1b -- critical fixes, parallel-safe with PR-2)
  |
  v
PR-5: cli-tools              (Wave 1c -- after PS cleans session-start.js)
PR-6: custom-statusline      (Wave 1c -- fully independent, can merge anytime)
PR-4: propagation W2-W4      (Wave 1d -- after PS ecosystem audit categories land)
  |
  v
PR-7: agent-env P4-5         (Wave 1e -- critical path, gates SWS)
  |
  v
PR-8: SWS Steps 1-4 (CANON) (Wave 2 -- only after agent-env merges)
  |
  v
PR-9+: SWS checkpoints       (Wave 3 -- sequential per D63)
```

### Merge Order Flexibility

**Fully flexible (can merge in any order):**

- PR-6 (custom-statusline) -- zero dependencies, zero conflicts
- PR-3 (propagation W1) -- independent critical fixes

**Must follow PR-2 (passive-surfacing):**

- PR-5 (cli-tools) -- session-start.js dependency
- PR-4 (propagation W2-W4) -- ecosystem audit skill dependency

**Must precede all SWS PRs:**

- PR-7 (agent-env P4-5) -- hard block

### Conflict Resolution During Merge

For PRs that touch the same files, the later PR must rebase/merge from main
after the earlier PR lands:

| File                        | First PR to Merge                                      | Second PR to Merge                                                               | Rebase Needed?                                             |
| --------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `CLAUDE.md`                 | PR-5 (CLI, Section 6b)                                 | PR-7 (AE, Section 7)                                                             | YES -- AE must rebase after CLI merges                     |
| `.husky/pre-commit`         | PR-2 (PS, Fix: command)                                | PR-3 (PR W1, EXIT trap) -> PR-7 (AE, agent triggers) -> PR-8+ (SWS, CANON gates) | YES -- each subsequent PR rebases                          |
| `.husky/pre-push`           | PR-3 (PR W1, EXIT trap)                                | PR-7 (AE, agent triggers) -> PR-8+ (SWS, CANON gates)                            | YES -- sequential rebase                                   |
| `session-start.js`          | PR-2 (PS, 7 violations)                                | PR-5 (CLI, tool detection)                                                       | YES -- CLI rebases after PS                                |
| `.claude/settings.json`     | PR-6 (SL, statusLine.command) OR PR-5 (CLI, ntfy hook) | Whichever merges second                                                          | Minimal -- different JSON keys, auto-merge likely succeeds |
| `package.json`              | PR-1 (RC, remove deps)                                 | PR-5 (CLI, add tsgo)                                                             | Minimal -- different deps, auto-merge likely succeeds      |
| 4x ecosystem audit skills   | PR-2 (PS, add category)                                | PR-4 (PR W2, shared-lib extraction)                                              | YES -- PR must rebase after PS                             |
| `check-agent-compliance.js` | PR-2 (PS, Fix: command)                                | PR-7 (AE, strict mode)                                                           | YES -- AE rebases after PS                                 |
| `alerts/SKILL.md`           | PR-2 (PS, evaluation)                                  | PR-7 (AE, Agent Cost) -> PR-8+ (SWS, formalize)                                  | YES -- sequential                                          |

---

## 6. planning-32326 Branch Disposition

The current `planning-32326` branch:

- **Current content:** Plan orchestration research and meta-work
- **Should NOT be used for plan execution.** Each plan should create its own
  branch from `main`.
- **Recommended action:** Complete the orchestration PLAN.md on this branch,
  merge to main, then archive the branch.
- **If orchestration artifacts (.research/, .planning/plan-orchestration/) need
  to be preserved:** Merge `planning-32326` to main BEFORE any plan branches are
  created, so all plan branches start from a main that includes the
  orchestration research.

---

## Convergence Loop

### CL-1: Document paths verified on disk (5+ spot-checks)

| Document                                    | Expected | Actual                             | Status   |
| ------------------------------------------- | -------- | ---------------------------------- | -------- |
| `CLAUDE.md`                                 | EXISTS   | EXISTS (12,418 bytes, 2026-03-23)  | VERIFIED |
| `SESSION_CONTEXT.md`                        | EXISTS   | EXISTS (9,374 bytes, 2026-03-24)   | VERIFIED |
| `ROADMAP.md`                                | EXISTS   | EXISTS (159,378 bytes, 2026-03-20) | VERIFIED |
| `.claude/skills/session-begin/SKILL.md`     | EXISTS   | EXISTS (8,908 bytes, 2026-03-19)   | VERIFIED |
| `.claude/skills/alerts/SKILL.md`            | EXISTS   | EXISTS (8,698 bytes, 2026-03-19)   | VERIFIED |
| `docs/agent_docs/AGENT_ORCHESTRATION.md`    | EXISTS   | EXISTS (8,414 bytes, 2026-03-19)   | VERIFIED |
| `.claude/skills/_shared/SKILL_STANDARDS.md` | EXISTS   | EXISTS (8,414 bytes)               | VERIFIED |
| `.claude/HOOKS.md`                          | EXISTS   | EXISTS (6,184 bytes, 2026-03-19)   | VERIFIED |
| `DOCUMENTATION_INDEX.md`                    | EXISTS   | EXISTS (476,006 bytes, 2026-03-24) | VERIFIED |
| `docs/DOCUMENT_DEPENDENCIES.md`             | EXISTS   | EXISTS (23,674 bytes, 2026-03-19)  | VERIFIED |

**10/10 spot-checks pass.**

### CL-2: Cross-doc dependency downstream verification

For each critical dependency chain, verified that the downstream plan actually
reads/modifies the document:

| Chain | Upstream | Document                  | Downstream  | Downstream actually reads it?                                                                                    |
| ----- | -------- | ------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------- |
| DC-01 | PS       | session-begin/SKILL.md    | SWS Step 7  | YES -- SWS PLAN.md line 652 references "Formalize session state management" including session-begin.             |
| DC-02 | AE       | Agent .md files           | SWS Step 13 | YES -- Memory note + STEP_3_14_COVERAGE_AUDIT.md confirms SWS Step 13 depends on agent-env outputs.              |
| DC-06 | PS       | 4x ecosystem audit skills | PR Step 8   | YES -- S-05 findings Step 8 explicitly targets 10 ecosystem audit skill directories including the 4 PS modifies. |
| DC-08 | PS       | session-start.js          | CLI Step 18 | YES -- S-03 findings Step 18 explicitly modifies session-start.js (1077 lines, add tool detection).              |

**All critical chains verified.**

### CL-3: Branch strategy accounts for shared file conflicts from S-08

Cross-referenced with S-08 conflict zones:

| S-08 Conflict                                      | Branch Strategy Addresses?                                                                                       |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| CONFLICT-H1: session-start.js (CLI, PS, AE)        | YES -- PR-2 (PS) merges first, PR-5 (CLI) rebases, PR-7 (AE) rebases last. Merge order table includes this file. |
| CONFLICT-H2: .husky/pre-commit (PS, PR, AE, SWS)   | YES -- PR-2 -> PR-3 -> PR-7 -> PR-8+ merge order. Rebase table included.                                         |
| CONFLICT-H3: .husky/pre-push (PR, AE, SWS)         | YES -- PR-3 -> PR-7 -> PR-8+ merge order.                                                                        |
| CONFLICT-H4: scripts/ mass refactoring (PR vs SWS) | YES -- PR-4 merges before any SWS PR. SWS is naturally 80+ sessions later.                                       |
| CONFLICT-M1: CLAUDE.md (CLI, AE, SWS)              | YES -- PR-5 -> PR-7 -> PR-8+ merge order. Different sections.                                                    |
| CONFLICT-M2: settings.json (SL, CLI)               | YES -- Different JSON keys. Either order works.                                                                  |
| CONFLICT-M3: 4x ecosystem audit skills (PS, PR)    | YES -- PR-2 (PS) merges before PR-4 (PR W2-4).                                                                   |

**All S-08 conflicts addressed in merge order.**

### CL-4: Merge order consistent with S-09 dependency graph

| S-09 Dependency                          | Merge Order Respects?                                 |
| ---------------------------------------- | ----------------------------------------------------- |
| agent-env (all 5 phases) --> SWS         | YES -- PR-7 (AE) before PR-8+ (SWS). Hard block.      |
| repo-cleanup ..> all others              | YES -- PR-1 is first in merge order.                  |
| passive-surfacing ..> SWS                | YES -- PR-2 before any SWS PR.                        |
| propagation ..> SWS                      | YES -- PR-3 and PR-4 before any SWS PR.               |
| cli-tools ..> SWS                        | YES -- PR-5 before any SWS PR.                        |
| PS before CLI (session-start.js)         | YES -- PR-2 before PR-5.                              |
| PS before PR W2 (ecosystem audit skills) | YES -- PR-2 before PR-4.                              |
| PR before AE (pre-commit/pre-push)       | YES -- PR-3 before PR-7. S-09 recommended this order. |

**All S-09 dependencies respected in merge order.**

### Corrections Applied During Convergence Loop

1. **SKILL_STANDARDS.md path corrected.** S-07 referenced it as
   `.claude/skills/SKILL_STANDARDS.md` but filesystem verification shows it is
   at `.claude/skills/_shared/SKILL_STANDARDS.md`. Corrected in Section 1.3.

2. **Added explicit rebase table.** Initial draft had merge order but lacked
   explicit guidance on which PRs need rebasing after which. Added Section 5
   conflict resolution table.

3. **Clarified planning-32326 disposition.** Initial draft did not address the
   existing branch. Added Section 6 with recommendation to merge to main before
   plan branches are created.

---

## Sources

| #   | Path/URL                                                           | Title                   | Type         | Trust   | Date       |
| --- | ------------------------------------------------------------------ | ----------------------- | ------------ | ------- | ---------- |
| 1   | `.research/plan-orchestration/findings/S-01-repo-cleanup.md`       | RC Inventory            | Findings     | HIGH    | 2026-03-24 |
| 2   | `.research/plan-orchestration/findings/S-02-custom-statusline.md`  | SL Inventory            | Findings     | HIGH    | 2026-03-24 |
| 3   | `.research/plan-orchestration/findings/S-03-cli-tools.md`          | CLI Inventory           | Findings     | HIGH    | 2026-03-24 |
| 4   | `.research/plan-orchestration/findings/S-04-passive-surfacing.md`  | PS Inventory            | Findings     | HIGH    | 2026-03-24 |
| 5   | `.research/plan-orchestration/findings/S-05-propagation.md`        | PR Inventory            | Findings     | HIGH    | 2026-03-24 |
| 6   | `.research/plan-orchestration/findings/S-06-agent-env.md`          | AE Inventory            | Findings     | HIGH    | 2026-03-24 |
| 7   | `.research/plan-orchestration/findings/S-07-sws.md`                | SWS Inventory           | Findings     | HIGH    | 2026-03-24 |
| 8   | `.research/plan-orchestration/findings/S-08-file-overlaps.md`      | File Overlap Map        | Findings     | HIGH    | 2026-03-24 |
| 9   | `.research/plan-orchestration/findings/S-09-dependency-graph.md`   | Dependency Graph        | Findings     | HIGH    | 2026-03-24 |
| 10  | `.research/plan-orchestration/findings/S-10-redundancy-synergy.md` | Redundancy Analysis     | Findings     | HIGH    | 2026-03-24 |
| 11  | `.research/plan-orchestration/findings/S-12-skill-hook-impact.md`  | Skill/Hook Impact       | Findings     | HIGH    | 2026-03-24 |
| 12  | `.research/plan-orchestration/findings/S-13-roadmap-canon.md`      | ROADMAP/CANON Analysis  | Findings     | HIGH    | 2026-03-24 |
| 13  | `.planning/plan-orchestration/DIAGNOSIS.md`                        | Orchestration Diagnosis | Diagnosis    | HIGH    | 2026-03-23 |
| 14  | Filesystem verification (ls, Glob, Grep)                           | Ground truth            | Ground truth | HIGHEST | 2026-03-24 |

## Contradictions

1. **S-07 references `SKILL_STANDARDS.md` at
   `.claude/skills/SKILL_STANDARDS.md`** but it actually lives at
   `.claude/skills/_shared/SKILL_STANDARDS.md`. Minor path discrepancy.
   Corrected in this document.

2. **S-09 recommends "3 waves minimum" but this analysis recommends 8+ PRs.**
   These are complementary, not contradictory: waves are execution groupings
   (when work happens), PRs are merge groupings (when code lands). Multiple PRs
   can be created within a single wave and merged in sequence.

## Gaps

1. **SWS internal doc cascade not fully mapped.** SWS creates 20+ new documents
   in `.canon/`. The internal dependency graph between CANON artifacts (schemas,
   tenets, enforcement manifests, health checkers, changelog) is complex but
   entirely SWS-internal. Mapping it here would require reading the full SWS
   PLAN.md (which S-07 already summarized).

2. **Propagation W2 rebase risk not quantified.** PR-4 (propagation W2-W4)
   touches 100+ files. If other PRs merge to main during PR-4's development, the
   rebase could be non-trivial. The risk is real but mitigated by the fact that
   most of PR-4's changes are in `scripts/` files that other plans do not touch
   (except SWS, which runs much later).

3. **PR review capacity.** 8+ PRs with some containing 50-150 file changes may
   strain the solo developer's review capacity. The aggressive batching
   alternative (3 batch PRs) addresses this.

## Serendipity

1. **The `planning-32326` branch is a merge-to-main bottleneck.** If plan
   execution branches are created from main but `planning-32326` has not been
   merged, the orchestration research artifacts will not be available on plan
   branches. Recommendation: merge `planning-32326` to main as the FIRST action
   before any plan execution begins.

2. **SWS checkpoint-merge strategy enables "reset points."** By merging SWS to
   main at each of 4 checkpoints, the repo gets periodic stable states. If SWS
   needs to be abandoned or redirected at any checkpoint, the damage is limited
   to the in-progress checkpoint phase.

3. **The propagation W1/W2 split into separate PRs (PR-3 and PR-4) enables an
   early confidence signal.** PR-3 (5-8 files, critical fixes) can be merged and
   validated before committing to the mass refactoring of PR-4 (100+ files).

## Confidence Assessment

- HIGH claims: 18 (document paths, merge order constraints, dependency chains,
  file overlap verification)
- MEDIUM claims: 4 (PR size estimates, rebase risk quantification, alternative
  batching viability, SWS checkpoint strategy)
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: **HIGH**

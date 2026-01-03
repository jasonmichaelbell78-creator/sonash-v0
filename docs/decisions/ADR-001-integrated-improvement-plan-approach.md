# ADR-001: Integrated Improvement Plan Approach

**Date:** 2026-01-03
**Status:** Accepted
**Decision Makers:** Project Owner, Claude AI (Session #5)

---

## Context

After a comprehensive staff-engineer audit comparing current progress against best practices, we faced a decision point about how to proceed with multiple improvement initiatives:

1. **Documentation Standardization Plan** - 57% complete (Phases 1-4 done, 5-6 remaining)
2. **Eight-Phase Refactor Plan** - 0% complete (45 CANON findings from 6-AI code review)
3. **Developer Tooling Gaps** - Identified missing tools (Prettier, madge, knip)
4. **Security Items** - App Check disabled, needs re-enablement plan

These initiatives were tracked in separate documents with unclear dependencies and no unified timeline. The question was: restart with a fresh comprehensive plan, or integrate existing work into a unified path?

### Key Constraints

- Solo developer project (no team bandwidth for parallel tracks)
- 57% doc standardization work is valuable and shouldn't be discarded
- Feature development blocked until foundation is solid
- Multiple planning documents created confusion about priorities

## Decision

**Create a single Integrated Improvement Plan** that:

1. **Preserves existing progress** - Doc standardization Phases 1-4 remain complete
2. **Provides linear execution path** - 6 sequential steps with clear dependencies
3. **Consolidates all improvement work** - One document, one source of truth
4. **Validates before acting** - Delta Review (Step 4) refreshes stale refactor findings
5. **Integrates into ROADMAP.md** - Valid items migrate to M2, avoiding document proliferation

### The 6-Step Path

1. Quick Wins & Cleanup (2-3 hours)
2. Documentation Standardization Completion (8-12 hours)
3. Developer Tooling Setup (3-4 hours)
4. Delta Review & Refactor Plan Refresh (4-6 hours)
5. ROADMAP.md Integration & Doc Updates (2-3 hours)
6. Verification & Feature Resumption (1-2 hours)

## Consequences

### Positive

- **Clear priority order** - No ambiguity about what to work on next
- **Preserved investment** - 57% doc work retained
- **Reduced document sprawl** - One plan to rule them all
- **Built-in validation** - Delta Review prevents acting on stale findings
- **Feature resumption criteria** - Clear definition of done

### Negative

- **Delayed refactoring** - CANON findings wait until Step 4 validation
- **Longer path to features** - 6 steps before M1.5/M1.6 resume
- **Complexity in single doc** - INTEGRATED_IMPROVEMENT_PLAN.md is comprehensive

### Neutral

- EIGHT_PHASE_REFACTOR_PLAN.md will be archived (not deleted) after Step 4
- Some audit recommendations were explicitly rejected (see below)

## Alternatives Considered

### Alternative 1: Full Planning Restart

- **Description:** Discard existing progress, create new comprehensive plan from scratch
- **Pros:** Clean slate, fresh perspective, potentially better architecture
- **Cons:** Wastes 57% completed doc work, demoralizing, delays everything further
- **Why rejected:** Sunk cost is real; existing work is valuable and functional

### Alternative 2: Aggressive Doc Consolidation (197→30 files)

- **Description:** Merge most docs into a small number of canonical files
- **Pros:** Simpler navigation, less maintenance overhead
- **Cons:** Massive disruption, high risk of information loss, scope creep
- **Why rejected:** Too disruptive for solo project; current 5-tier hierarchy works

### Alternative 3: Numbered Folder Structure (1-core/, 2-docs/, etc.)

- **Description:** Restructure entire docs folder with numbered prefixes
- **Pros:** Explicit priority ordering in file system
- **Cons:** Breaks all existing links, massive diff, questionable value
- **Why rejected:** Current structure is functional; renaming doesn't add value

### Alternative 4: Immediate Feature Folder Refactoring

- **Description:** Start architectural refactoring immediately based on CANON findings
- **Pros:** Address code issues sooner, visible progress
- **Cons:** Acting on potentially stale findings, foundation incomplete
- **Why rejected:** Delta Review should validate findings first; foundation before features

## Related Documents

- [INTEGRATED_IMPROVEMENT_PLAN.md](../../INTEGRATED_IMPROVEMENT_PLAN.md) - The plan created by this decision
- [DOCUMENTATION_STANDARDIZATION_PLAN.md](../../DOCUMENTATION_STANDARDIZATION_PLAN.md) - Original doc plan (Phases 5-6 continue)
- [EIGHT_PHASE_REFACTOR_PLAN.md](../archive/EIGHT_PHASE_REFACTOR_PLAN.md) - Original refactor plan (archived after Delta Review)
- [ROADMAP.md](../../ROADMAP.md) - Target for validated refactor items

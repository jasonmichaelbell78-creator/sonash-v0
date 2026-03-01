<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-01
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Deep Plan Reference

Question categories, example questions, output templates, and state file schema
for the deep-plan skill.

---

## Question Categories

Generate questions from these categories, selecting only categories relevant to
the task. Not every task needs every category — use judgment.

### 1. Naming & Identity

- What should this be called? (skill name, system name, ID prefix)
- Does it parallel an existing system? Should naming mirror it?
- What abbreviation or acronym will be used in references?

### 2. Architecture & Structure

- Should this be standalone or integrated into existing system X?
- What's the data format? (JSONL is the project canonical standard; use it
  unless there's a specific reason not to. Generate .md views for humans.)
- Where do files live? (new directories, existing locations)
- What's the relationship to existing systems?

### 3. Scale & Scope

- How many categories/types/dimensions?
- What are the valid values for each enum/scale?
- What's in scope vs explicitly out of scope?
- Single-session or multi-session?

### 4. Behavior & Rules

- What validation rules apply?
- What are the honesty/quality guardrails?
- What thresholds or limits exist?
- What's the lifecycle/status flow?

### 5. Integration & Cross-References

- Which existing systems need to know about this?
- Which existing docs need updates?
- What cross-referencing is needed?
- Does this affect CI/CD, hooks, or automation?
- What artifact contracts exist? (what files, what paths, what format)

### 6. Edge Cases & Conflicts

- What happens when this overlaps with system X?
- How is staleness/obsolescence handled?
- What's the recovery story if something fails mid-process?
- What about consolidation vs splitting?

### 7. User Experience & Output

- What does the output look like?
- How does the user interact with results?
- What format for review? (one-by-one, batch, dashboard)

### 8. Content & Domain-Specific

- Domain-specific questions that only apply to this particular task
- These emerge from understanding the codebase and existing patterns

---

## Output Templates

### DIAGNOSIS.md Template

```markdown
# Diagnosis: [Task Name]

**Date:** YYYY-MM-DD **Task:** [Brief description of what was requested]

## ROADMAP Alignment

[Aligned / Misaligned / New Direction] [Explanation of how this task relates to
current project direction]

## Relevant Existing Systems

| System | Relationship     | Pattern to Follow      |
| ------ | ---------------- | ---------------------- |
| [name] | [how it relates] | [convention to mirror] |

## Reframe Check

[Is this task what it appears to be? Does codebase context suggest a different
framing?]

**Recommendation:** [Proceed as stated / Reframe to X / Split into Y and Z]
```

### DECISIONS.md Template

```markdown
# Decision Record: [Feature Name]

**Date:** YYYY-MM-DD **Questions Asked:** N **Decisions Captured:** N

| #   | Decision      | Choice                        | Rationale                    |
| --- | ------------- | ----------------------------- | ---------------------------- |
| 1   | [Short label] | [Specific, actionable choice] | [Why this over alternatives] |
```

### PLAN.md Template

```markdown
# Implementation Plan: [Feature Name]

## Summary

[2-3 sentence overview of what's being built]

**Decisions:** See DECISIONS.md ([N] decisions) **Effort Estimate:** [S/M/L/XL]

## Files to Create/Modify

### New Files ([N])

1. **`path/to/file`** - Description

### Modified Files ([N])

1. **`path/to/file`** - What changes

## Step 1: [Title]

[Implementation details, code snippets where helpful]

**Done when:** [Verifiable criteria] **Depends on:** None **Triggers:** None

---

## Step N: Audit

Run code-reviewer agent on all new/modified files.

**Done when:** All findings addressed or tracked in TDMS **Depends on:** All
implementation steps
```

---

## State File Schema

```json
{
  "task": "Deep Plan: [feature name]",
  "topic": "[topic argument if provided]",
  "status": "phase_0 | phase_1 | phase_1b | phase_2 | phase_3 | phase_4 | handoff | complete",
  "current_batch": 2,
  "total_batches_so_far": 2,
  "decisions": [
    { "id": 1, "decision": "Name", "choice": "system-name", "rationale": "..." }
  ],
  "total_decisions": 12,
  "artifacts": {
    "diagnosis": "path/to/DIAGNOSIS.md",
    "decisions": "path/to/DECISIONS.md",
    "plan": "path/to/PLAN.md"
  },
  "updated": "ISO timestamp"
}
```

---

## Compressed Example: IMS Implementation

**Phase 0:** Read ROADMAP, explored TDMS ecosystem, found parallel structure.
DIAGNOSIS: aligned with "Evidence-Based" vision, mirror TDMS patterns.

**Phase 1:** 15+ questions in 3 batches.

- Batch 1 (Architecture): Separate system vs extend TDMS? Impact scale?
  Categories?
- Batch 2 (Behavior): Prevent "improvement theater"? Confidence threshold?
  Overlap with debt?
- Batch 3 (Output): Multi-AI template? Review format? Part of
  audit-comprehensive?

**Phase 2:** 25+ decisions in standalone DECISIONS.md.

**Phase 3:** 12 new files, 2 modified, 9 steps with "Done when:" criteria. Audit
checkpoint at step 9.

**Phase 4:** Approved with addition: "also update dependent docs."

**Handoff:** Routed to subagent-driven execution (6 independent scripts).

---

## Routing Guidance

| Situation                  | Use                                    | Why                                                   |
| -------------------------- | -------------------------------------- | ----------------------------------------------------- |
| 5+ ambiguous decisions     | `/deep-plan`                           | Exhaustive discovery prevents assumption-driven plans |
| 3-4 clear decisions        | EnterPlanMode                          | Lighter-weight, faster                                |
| Multi-phase roadmap        | `/gsd:new-project`                     | Project-level planning with milestones                |
| Brainstorming needed first | Brainstorming skill, then `/deep-plan` | Separate ideation from planning                       |
| Just needs execution       | `/dispatching-parallel-agents`         | Skip planning, go straight to doing                   |

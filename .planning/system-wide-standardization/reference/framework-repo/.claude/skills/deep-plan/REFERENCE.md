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
- What's the data format? (JSONL is a common canonical standard; use it
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

Use the **simple format** for tasks with 1-3 systems. Use the **comprehensive
format** for tasks touching 4+ systems or requiring deep ecosystem analysis.

#### Simple Format

```markdown
# Diagnosis: [Task Name]

**Date:** YYYY-MM-DD **Task:** [Brief description]

## ROADMAP Alignment

[Aligned / Misaligned / New Direction] [Explanation]

## Relevant Existing Systems

| System | Relationship     | Pattern to Follow      |
| ------ | ---------------- | ---------------------- |
| [name] | [how it relates] | [convention to mirror] |

## Reframe Check

[Is this task what it appears to be?]

**Recommendation:** [Proceed as stated / Reframe to X / Split into Y and Z]
```

#### Comprehensive Format (Ecosystem-Scale)

Use when the task involves multiple interconnected systems, migrations, or major
architectural work. Investigate deeply using parallel agents before writing.

```markdown
# Diagnosis: [Task Name]

**Date:** YYYY-MM-DD **Task:** [Brief description]

## 1. Executive Summary

**Readiness Grade: [Letter]** ([Score]/100)

[2-3 paragraph overview of current state, problem domains, and scope]

**Composite Scores by Domain:**

| Domain | Score | Grade | Key Issue |
| ------ | ----- | ----- | --------- |
| [name] | [N]   | [X]   | [summary] |

## 2. ROADMAP Alignment

[Aligned / Misaligned / New Direction] [Specific gaps between ROADMAP and
actual state]

## 3. Ecosystem Inventory

### Complete System Map (ASCII diagram)

[Visual map of all layers, systems, and their relationships]

### Data Flow: End-to-End Lifecycle (ASCII diagram)

[Flow diagram showing how data moves through the system from trigger to output]

## 4. System-by-System Scorecards

### 4.N [System Name] (Score: N/100, Grade: X)

| Component | Source | Target | Status   | Sanitization |
| --------- | ------ | ------ | -------- | ------------ |
| [name]    | YES/NO | YES/NO | [status] | [level]      |

**Key Gaps:** [Bullet list of specific issues]

[Repeat for each system/domain]

## 5. [Domain-Specific Analysis]

[Deep analysis of cross-cutting concerns — sanitization layers, cross-platform
issues, parameterization needs, sync requirements, etc.]

## 6. Gap Catalog

### Severity Definitions

- **S0 (Critical):** Blocks core functionality
- **S1 (High):** Significant capability missing, workaround available
- **S2 (Medium):** Nice-to-have capability missing
- **S3 (Low):** Polish, optimization, or future-proofing

### Full Gap Catalog ([N] gaps identified)

#### S0 — Critical ([N] gaps)

| ID     | Gap    | System |
| ------ | ------ | ------ |
| GAP-NN | [Desc] | [sys]  |

[Repeat for S1, S2, S3]

## 7. Recommendations

### Phase N: [Title] (Effort: [S/M/L/XL] — [N-N hours])

[Numbered list of concrete actions]

**Total Estimated Effort: [N-N hours across N phases]**

## 8. Appendices

### A. [Comparison Tables, File Counts, etc.]

### B. [Hotspot Maps, Dependency Graphs, etc.]

### C. [Test Matrices, Cross-Reference Tables, etc.]
```

**Comprehensive format rules:**

1. Use parallel investigation agents to gather data before writing
2. Every domain gets a scorecard with numeric scores (0-100) and letter grades
3. Gaps are cataloged with severity ratings and unique IDs (GAP-NN)
4. Recommendations are phased with effort estimates
5. Include ASCII diagrams for system maps and data flows
6. Appendices hold detailed tables that support the narrative
7. Present to user for review before proceeding to Discovery

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

**Done when:** All findings addressed or tracked **Depends on:** All
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
  "decisions": [{ "id": 1, "decision": "Name", "choice": "system-name", "rationale": "..." }],
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

## Routing Guidance

| Situation                  | Use                              | Why                                                   |
| -------------------------- | -------------------------------- | ----------------------------------------------------- |
| 5+ ambiguous decisions     | `/deep-plan`                     | Exhaustive discovery prevents assumption-driven plans |
| 3-4 clear decisions        | EnterPlanMode                    | Lighter-weight, faster                                |
| Brainstorming needed first | Brainstorming, then `/deep-plan` | Separate ideation from planning                       |
| Just needs execution       | Parallel agents                  | Skip planning, go straight to doing                   |

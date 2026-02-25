---
name: deep-plan
description:
  Structured discovery-first planning for complex tasks. Ask exhaustive
  categorized questions, build a decision record, then produce a detailed
  implementation plan for user approval before any code is written.
---

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-11
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Deep Plan

Structured discovery-first planning that produces high-quality implementation
plans by front-loading decision-making through exhaustive questioning.

## When to Use

- User invokes `/deep-plan` explicitly
- User says "ask as many questions as you need" or similar
- Task is ambiguous with 5+ design decisions that could go either way
- Task creates a new system, skill, or major feature (not a bug fix or tweak)
- Task touches multiple existing systems that need coordination
- Regular plan mode's 2-3 questions would leave too many assumptions

## When NOT to Use

- Simple bug fixes or single-file changes
- Tasks where the user has already specified every decision
- Tasks with well-known patterns that don't need discovery (use regular plan
  mode)

---

## Process Overview

```
PHASE 1: Discovery    → Ask categorized questions (10-25 questions)
PHASE 2: Decision     → Build decision record table from answers
PHASE 3: Plan         → Write structured plan document
PHASE 4: Approval     → Show plan inline for user approval
PHASE 5: Execute      → Implement with parallel execution where possible
```

---

## Phase 1: Discovery

### Purpose

Eliminate assumptions before writing a single line of plan. Every ambiguous
design decision should be surfaced and resolved with the user.

### Question Categories

Generate questions from these categories, selecting only categories relevant to
the task. Not every task needs every category - use judgment.

#### 1. Naming & Identity

- What should this be called? (skill name, system name, ID prefix)
- Does it parallel an existing system? Should naming mirror it?
- What abbreviation or acronym will be used in references?

#### 2. Architecture & Structure

- Should this be standalone or integrated into existing system X?
- What's the data format? (JSONL, JSON, Markdown, database)
- Where do files live? (new directories, existing locations)
- What's the relationship to existing systems?

#### 3. Scale & Scope

- How many categories/types/dimensions?
- What are the valid values for each enum/scale?
- What's in scope vs explicitly out of scope?
- Single-session or multi-session?

#### 4. Behavior & Rules

- What validation rules apply?
- What are the honesty/quality guardrails?
- What thresholds or limits exist?
- What's the lifecycle/status flow?

#### 5. Integration & Cross-References

- Which existing systems need to know about this?
- Which existing docs need updates?
- What cross-referencing is needed?
- Does this affect CI/CD, hooks, or automation?

#### 6. Edge Cases & Conflicts

- What happens when this overlaps with system X?
- How is staleness/obsolescence handled?
- What's the recovery story if something fails mid-process?
- What about consolidation vs splitting?

#### 7. User Experience & Output

- What does the output look like?
- How does the user interact with results?
- What format for review? (one-by-one, batch, dashboard)
- Should there be a multi-AI template for cross-model use?

#### 8. Content & Domain-Specific

- Domain-specific questions that only apply to this particular task
- These emerge from understanding the codebase and existing patterns

### Discovery Rules

1. **Ask 10-25 questions** - enough to eliminate assumptions, not so many that
   the user loses patience. Group into 2-4 batches of related questions.
2. **Front-load critical decisions** - architecture and naming first, edge cases
   later.
3. **Offer defaults** - for every question, suggest a recommended answer. The
   user can accept defaults quickly or override.
4. **Reference existing patterns** - when the codebase already has a convention,
   cite it. "TDMS uses S0-S3 severity. Should IMS mirror this with I0-I3?"
5. **Use AskUserQuestion tool** - for binary/multiple-choice decisions. Use
   regular text for open-ended questions.
6. **Stop when confident** - if the user's answers make remaining questions
   obvious, skip them. State what was inferred.
7. **Batch efficiently** - group related questions. Don't ask one question per
   message when five related ones could go together.

### Discovery Anti-Patterns

- Asking questions you could answer by reading the codebase
- Asking the same question in different ways
- Asking questions whose answers don't affect the plan
- Asking too many questions in a single message (cap at ~8 per batch)
- Not offering recommended defaults

---

## Phase 2: Decision Record

After all questions are answered, compile a **Decision Record Table** that
captures every resolved decision. This becomes the single source of truth for
the plan.

### Format

```markdown
## Decision Record (from Q&A)

| Decision        | Choice                                          |
| --------------- | ----------------------------------------------- |
| Name            | `system-name`                                   |
| Tracking system | Parallel to X (NEW_STORE.jsonl)                 |
| Scale           | A0-A3 (mirrors existing B0-B3)                  |
| Integration     | Standalone (not in existing-comprehensive-tool) |
| Trigger         | Manual only                                     |
| ...             | ...                                             |
```

### Rules

- One row per decision point
- Choice column should be specific and actionable (not "TBD" or "maybe")
- Include both what was chosen AND what was rejected when relevant
- Decision column uses short labels; Choice column has detail

---

## Phase 3: Plan Document

Write a structured plan document using this template.

### Plan Structure

```markdown
# Implementation Plan: [Feature Name]

## Summary

[2-3 sentence overview of what's being built]

## Decision Record (from Q&A)

[Decision table from Phase 2]

## Files to Create/Modify

### New Files (N)

1. **`path/to/file`** - Description ...

### New Directories

- `path/to/dir/` ...

### Modified Files (N)

1. **`path/to/file`** - What changes ...

## Step N: [Step Title]

[Implementation details, code snippets where helpful]

---

[Repeat for each step]
```

### Plan Rules

1. **Be specific about files** - exact paths, not "somewhere in scripts/"
2. **Include code snippets** - for schemas, configs, and non-obvious logic
3. **Number the steps** - clear execution order
4. **Mark parallelizable steps** - "Steps 3-6 can run in parallel"
5. **Reference forking sources** - "Forked from scripts/debt/intake-audit.js"
6. **Keep it under 500 lines** - plans that are too long signal too-large scope

---

## Phase 4: Approval

### Critical: Show Plan Inline

The plan MUST be presented inline in the conversation, not just written to a
file. Users may not have filesystem access. After writing the plan to a file
(for persistence), display it in chat.

### Approval Gate

- Present the plan and explicitly ask: "Ready to proceed, or changes needed?"
- If the user requests changes, update the plan and re-present
- Do NOT begin implementation until explicit approval
- If using plan mode, use ExitPlanMode to request approval

### Common Approval Outcomes

- **Approved as-is** - proceed to Phase 5
- **Approved with additions** - note additions, proceed (e.g., "also update
  dependent docs")
- **Changes requested** - revise plan, re-present
- **Scope reduction** - remove steps, re-present
- **Rejected** - stop, discuss alternative approaches

---

## Phase 5: Execute

After approval, implement the plan.

### Execution Rules

1. **Follow the plan** - don't deviate without flagging
2. **Parallelize aggressively** - use Task agents for independent work
3. **Test as you go** - validate each step before moving to the next
4. **Track with TodoWrite** - visible progress tracking
5. **Handle additions** - if the user added requirements during approval (e.g.,
   "also update dependent docs"), include them in the todo list

---

## Example: How This Played Out (IMS Implementation)

### Discovery Phase (15+ questions in 3 batches)

**Batch 1 - Core Architecture:**

- Should this be a separate system or extend TDMS?
- What impact scale? Mirror S0-S3?
- What categories cover the full project?

**Batch 2 - Behavior & Quality:**

- How to prevent "improvement theater" (fake findings)?
- Should there be a confidence threshold?
- How to handle overlap with existing debt items?

**Batch 3 - Output & Integration:**

- Include multi-AI template?
- How should the user review findings?
- Should it run as part of audit-comprehensive?

### Decision Record: 25+ decisions captured in table

### Plan: 12 new files, 2 modified, 9 implementation steps

### Approval: User approved with addition: "also update dependent docs"

### Execution: 6 scripts + skill + template + docs built in parallel batches

---

## Integration with Existing Tools

- **plan-mode-suggestion.js hook**: When this hook fires for complex tasks,
  deep-plan is an alternative to basic plan mode
- **GSD framework**: For multi-phase projects, use GSD planner. Deep-plan is for
  single-feature/system planning that needs thorough discovery
- **PLANNING_DOC_TEMPLATE.md**: Deep-plan produces a lighter-weight plan focused
  on implementation steps. The full planning template is better for long-lived
  initiative tracking

---

## Version History

| Version | Date       | Description            |
| ------- | ---------- | ---------------------- |
| 1.0     | 2026-02-25 | Initial implementation |

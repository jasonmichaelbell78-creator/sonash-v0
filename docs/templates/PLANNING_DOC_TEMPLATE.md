# [Feature/Initiative Name] Plan

**Document Version**: 1.0 **Created**: YYYY-MM-DD **Last Updated**: YYYY-MM-DD
**Status**: PLANNING | IN_PROGRESS | COMPLETE | ON_HOLD | CANCELLED **Overall
Completion**: X% (Y/Z tasks complete) **Target Completion**: YYYY-MM-DD

---

## 📋 Purpose & Scope

### What This Plan Covers

This document provides the complete planning, tracking, and implementation guide
for [feature/initiative name].

**Primary Goal**: [One-sentence description of main objective]

**Scope**:

- ✅ **In Scope**: [What's included]
- ❌ **Out of Scope**: [What's explicitly excluded]

**Related To**:

- [Milestone/Phase] in [ROADMAP.md](../../ROADMAP.md)
- [Related feature plans]

---

## 🗺️ STATUS DASHBOARD

| Task/Phase | ID  | Description  | Status       | Owner         | Est. Hours | Dependencies |
| ---------- | --- | ------------ | ------------ | ------------- | ---------- | ------------ |
| [Task 1]   | T1  | [Brief desc] | **[STATUS]** | [Team/Person] | X-Y h      | None         |
| [Task 2]   | T2  | [Brief desc] | **[STATUS]** | [Team/Person] | X-Y h      | T1           |
| [Task 3]   | T3  | [Brief desc] | **[STATUS]** | [Team/Person] | X-Y h      | T1           |

**Progress Summary**:

- **Completed**: X tasks (Y%)
- **In Progress**: A tasks
- **Blocked**: B tasks
- **Not Started**: C tasks

**Timeline**:

- **Started**: YYYY-MM-DD
- **Current Sprint**: [Sprint name/number]
- **Target Completion**: YYYY-MM-DD
- **Actual Completion**: YYYY-MM-DD or "TBD"

---

## 🎯 Objectives & Requirements

### Primary Objectives

1. **[Objective 1]**: [Description]
   - **Success Metric**: [How to measure]
   - **Priority**: P0 | P1 | P2

2. **[Objective 2]**: [Description]
   - **Success Metric**: [How to measure]
   - **Priority**: P0 | P1 | P2

### User Stories

**As a [user type], I want to [action] so that [benefit].**

**Acceptance Criteria**:

- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]

### Requirements

#### Functional Requirements

1. **[Requirement 1]**: [Description]
   - **Priority**: MUST | SHOULD | COULD | WON'T
   - **Rationale**: [Why this is needed]

2. **[Requirement 2]**: [Description]
   - **Priority**: MUST | SHOULD | COULD | WON'T
   - **Rationale**: [Why this is needed]

#### Non-Functional Requirements

1. **Performance**: [Requirements]
2. **Security**: [Requirements]
3. **Accessibility**: [Requirements]
4. **Compatibility**: [Requirements]

---

## 🔀 Dependencies

### Prerequisite Work

**Must be complete before starting**:

- [ ] [Dependency 1] - [Status]
- [ ] [Dependency 2] - [Status]

**Blockers**:

- [Active blocker 1] - [Plan to resolve]
- [Active blocker 2] - [Plan to resolve]

### Downstream Impact

**This work will enable**:

- [Future feature 1]
- [Future feature 2]

**This work will affect**:

- [Affected system 1] - [Nature of impact]
- [Affected system 2] - [Nature of impact]

---

## 📐 Design & Architecture

### High-Level Design

[Overview of the solution approach]

**Architecture Diagram**:

```
[ASCII diagram showing component relationships]

Example:
┌─────────────────┐
│   Frontend UI   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Business Logic │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Data Layer    │
└─────────────────┘
```

### Technical Approach

**Technology Stack**:

- [Tech 1]: [Purpose and rationale]
- [Tech 2]: [Purpose and rationale]

**Key Components**:

1. **[Component 1]**: [Description and responsibility]
2. **[Component 2]**: [Description and responsibility]

**Data Model**:

```typescript
// [Key interfaces/types]
interface [Name] {
  // [Properties]
}
```

### Design Decisions

**Decision 1: [Topic]**

- **Options Considered**: [Option A, Option B, Option C]
- **Chosen Approach**: [Selected option]
- **Rationale**: [Why this choice]
- **Trade-offs**: [What we're giving up]

**Decision 2: [Topic]**

- [Following same structure]

---

## 📋 Implementation Plan

### Phase 1: [Phase Name] (X-Y hours)

**Goal**: [What this phase accomplishes]

**Tasks**:

- [ ] **Task 1.1**: [Description] (X hours)
  - **Details**: [Implementation notes]
  - **Files**: `[file paths]`
  - **Acceptance**: [How to verify]

- [ ] **Task 1.2**: [Description] (Y hours)
  - **Details**: [Implementation notes]
  - **Files**: `[file paths]`
  - **Acceptance**: [How to verify]

### Phase 2: [Phase Name] (X-Y hours)

**Goal**: [What this phase accomplishes]

**Tasks**:

- [ ] **Task 2.1**: [Description] (X hours)
- [ ] **Task 2.2**: [Description] (Y hours)

### Phase 3: [Phase Name] (X-Y hours)

[Following same structure]

---

## ✅ Acceptance Criteria

### Definition of Done

This plan is complete when all of the following are true:

- [ ] **All phases complete**: All tasks in all phases checked off
- [ ] **Tests passing**: All new tests pass, no regressions
- [ ] **Documentation updated**: Relevant docs reflect new functionality
- [ ] **Code reviewed**: All PRs approved and merged
- [ ] **User acceptance**: Stakeholders have verified functionality
- [ ] **Performance verified**: Meets non-functional requirements
- [ ] **Deployed**: Changes live in production (if applicable)

### Verification Steps

```bash
# [Command to verify feature works]
# [Command to run tests]
# [Command to check deployment]
```

**Expected Results**:

- [Expected result 1]
- [Expected result 2]

---

## 🧪 Testing Strategy

### Test Coverage

**Unit Tests**:

- [ ] [Component/function 1]
- [ ] [Component/function 2]

**Integration Tests**:

- [ ] [Integration scenario 1]
- [ ] [Integration scenario 2]

**E2E Tests**:

- [ ] [User flow 1]
- [ ] [User flow 2]

### Test Plan

**Manual Testing Checklist**:

- [ ] [Test case 1]
- [ ] [Test case 2]
- [ ] [Edge case 1]
- [ ] [Edge case 2]

**Automated Testing**:

- [ ] CI/CD pipeline configured
- [ ] Tests run on every PR
- [ ] Coverage threshold: X%

---

## 🚨 Risks & Mitigation

### Risk Register

| Risk     | Likelihood   | Impact       | Mitigation | Owner    |
| -------- | ------------ | ------------ | ---------- | -------- |
| [Risk 1] | HIGH/MED/LOW | HIGH/MED/LOW | [Strategy] | [Person] |
| [Risk 2] | HIGH/MED/LOW | HIGH/MED/LOW | [Strategy] | [Person] |

### Contingency Plans

**If [risk] occurs**:

1. [Response step 1]
2. [Response step 2]
3. [Rollback procedure if needed]

---

## 📊 Progress Tracking

### Completed Work

**[Date]**: ✅ [What was accomplished]

- Commit: [SHA]
- PR: #[number]
- Details: [Additional context]

**[Date]**: ✅ [What was accomplished]

- [Details]

### In Progress

**[Date]**: ⏳ [What's being worked on]

- **Blocker**: [If any]
- **ETA**: [Expected completion]

### Upcoming

**Next Steps**:

1. [Next task]
2. [Following task]
3. [Future task]

---

## 🔄 Update Log

**How to Update This Document**:

1. Update status dashboard when task status changes
2. Add entry to "Progress Tracking" when work completes
3. Update "Last Updated" date at top
4. Commit changes with descriptive message

**Update Triggers**:

- ✅ Task status changes
- ✅ Blockers discovered or resolved
- ✅ Timeline adjustments
- ✅ Scope changes
- ✅ Design decisions made

---

## 📚 Related Documentation

**Planning**:

- [ROADMAP.md](../../ROADMAP.md) - Overall product roadmap
- [Related plan 1] - [Connection]

**Implementation**:

- [ARCHITECTURE.md](../../ARCHITECTURE.md) - System architecture
- [DEVELOPMENT.md](../../DEVELOPMENT.md) - Development procedures

**Reference**:

- [Relevant reference docs]

---

## 📝 Notes & Decisions

### Meeting Notes

**[Date] - [Meeting Type]**

- **Attendees**: [Names]
- **Decisions**: [Key decisions made]
- **Action Items**: [Who does what by when]

### Open Questions

- [ ] **[Question 1]**: [Details] - Owner: [Person]
- [ ] **[Question 2]**: [Details] - Owner: [Person]

### Assumptions

- [Assumption 1]: [What we're assuming]
- [Assumption 2]: [What we're assuming]

---

## 🗓️ Version History

| Version | Date       | Changes              | Author   |
| ------- | ---------- | -------------------- | -------- |
| 1.0     | YYYY-MM-DD | Initial plan created | [Author] |

---

## 🤖 AI Instructions

**For AI Assistants implementing this plan:**

1. **Read this entire document** before starting any task
2. **Check dependencies** - ensure prerequisites are complete
3. **Follow the implementation plan** - complete tasks in order
4. **Update status dashboard** as you complete tasks
5. **Add progress tracking entries** with commit SHAs
6. **Update "Last Updated"** date when making changes
7. **Ask for clarification** if requirements are unclear
8. **Maintain test coverage** as you implement

**When completing a task:**

```bash
# 1. Update this document (check off task)
# 2. Commit code changes
# 3. Commit documentation update
git add docs/[this-plan].md
git commit -m "docs: Update [plan] - completed task [ID]"
```

**⚠️ MANDATORY: When completing a phase/milestone:**

Before marking ANY phase or milestone complete, you MUST run a **Deliverable
Audit**:

1. **Gather Requirements** - Review original goals, acceptance criteria,
   deliverables list
2. **Verify Each Deliverable** - Confirm exists, is complete, meets criteria
3. **Check for Gaps** - Any missing items? Any incomplete work?
4. **Document Findings** - Add to "What Was Accomplished" section
5. **Address Gaps** - Fix gaps or document why acceptable
6. **Only Then** - Mark phase/milestone complete

See [AI_WORKFLOW.md](../../AI_WORKFLOW.md) → "MANDATORY: Deliverable Audit
Procedure" for full template.

---

**END OF TEMPLATE**

**Usage Notes:**

- Replace all [bracketed placeholders] with actual content
- Remove phases/sections not needed for your specific plan
- Add phases as needed for complex features
- Keep status dashboard updated throughout implementation
- **Run deliverable audit before marking ANY phase complete**

## 🗃️ Completion & Archival

**When Status = COMPLETE or CANCELLED:**

1. **Update status** to COMPLETE or CANCELLED at document top
2. **Add completion summary** to Progress Tracking section
3. **Archive the document**:
   ```bash
   mv docs/[THIS_PLAN].md docs/archive/completed-plans/
   ```
4. **Update references** - find and update any docs linking to this plan:
   ```bash
   grep -RFn --include="*.md" \
     --exclude-dir=archive \
     --exclude-dir=node_modules \
     --exclude-dir=dist \
     --exclude-dir=build \
     -- "[THIS_PLAN]" docs
   ```
5. **Commit** with message: `docs: Archive [PLAN_NAME] (COMPLETE)`

**Why archive?** Completed/deprecated plans consume AI context when scanned.
Moving to archive keeps active docs lean while preserving history.

# [Document Title]

**Project**: SoNash Recovery Notebook **Document Version**: 1.0 **Created**:
[Creation Date] **Status**: [ACTIVE | COMPLETE | ARCHIVED | DEPRECATED]
**Overall Completion**: X/Y items complete (Z%) **Last Updated**: YYYY-MM-DD

---

## 🎯 DOCUMENT PURPOSE

This is the **CANONICAL** [tracking document | reference | plan] for [specific
purpose]. This document serves as:

1. **[Primary purpose]** - Brief description
2. **[Secondary purpose]** - Brief description
3. **[Tertiary purpose]** - Brief description
4. **[Additional purposes as needed]**

**⚠️ CRITICAL**: [Any critical warnings or requirements for using this document]

## Quick Start

1. Copy template for new canonical document
2. Fill in all required sections
3. Validate structure before committing

---

## 📋 HOW TO USE THIS DOCUMENT

### For AI Assistants Starting a New Session

**🚨 CRITICAL**: Before [taking action], follow these steps:

1. **READ THIS DOCUMENT FIRST** - Understand current state
2. Check the **[Primary Status Section]** to see what's complete
3. Review **[Dependencies/Prerequisites]** section
4. Follow **[Required workflow/process]**
5. **UPDATE THIS DOCUMENT** after completing work

**Step-by-step workflow:**

```text
1️⃣ [Initial condition/prerequisite] → 2️⃣ [Decision point/action trigger] → 3️⃣ [Primary action] → 4️⃣ [Expected outcome/next state]
```

_Example: 1️⃣ Read current status → 2️⃣ Identify next task → 3️⃣ Complete task → 4️⃣
Update dashboard_

**See [related document] for complete workflow details.**

### For Developers/Reviewers

1. Use **[Section Name]** to track progress
2. Review **[Analysis Section]** to understand context
3. Check **[Criteria Section]** before marking complete
4. Verify **[Dependencies]** are satisfied

### For Project Stakeholders

1. **Quick Status**: See [Status Dashboard] below
2. **Current Focus**: See [Active Work] section
3. **Timeline**: See [Schedule/Milestones] section
4. **Blockers**: See [Blockers/Issues] section

---

## 📝 HOW TO UPDATE THIS DOCUMENT

### After Completing Work

1. **Update Status** in relevant section:
   - Change status indicators (PENDING → IN_PROGRESS → COMPLETE)
   - Add completion dates
   - Update completion percentages

2. **Document What Was Accomplished**:
   - List specific changes (files, commits, features)
   - Include dates and references (commit SHAs, PR numbers)
   - Add evidence of completion

3. **Document Reasoning & Decisions**:
   - Explain WHY choices were made
   - Note trade-offs considered
   - Document deviations from plan

4. **Update Status Dashboard**:
   - Increment completion counters
   - Update overall progress percentage
   - Update "Last Updated" date at top

5. **Commit Changes**:
   ```bash
   git add docs/[this-document].md
   git commit -m "docs: Update [document] - [brief description]"
   ```

### Version Control for This Document

Every update should:

- Increment the "Last Updated" date
- Consider incrementing version number for major milestones
- Preserve historical information rather than deleting
- Add entries to version history section at bottom

---

## 📊 STATUS LEGEND

### Status Values

- **PENDING**: Not started; prerequisites may or may not be complete
- **IN_PROGRESS**: Currently being worked on
- **COMPLETE**: All acceptance criteria met and verified
- **BLOCKED**: Cannot proceed due to dependencies or external factors
- **DEFERRED**: Intentionally postponed to later work
- **DEPRECATED**: No longer relevant or superseded by newer work

### Priority Values

- **P0**: Critical - Must be done immediately
- **P1**: High - Should be done soon
- **P2**: Medium - Should be done eventually
- **P3**: Low - Nice to have

### Risk Values

- **HIGH**: Significant risk to project success, timeline, or quality
- **MEDIUM**: Moderate risk with manageable impact
- **LOW**: Minimal risk with low impact

**📌 Note on Status Dimensions:**

- **Status**, **Priority**, and **Risk** are independent fields
- A COMPLETE item can still have HIGH risk if mitigation is pending
- BLOCKED items don't automatically become P0 unless escalation is required
- For DEPRECATED items, progress is typically locked at final % or marked N/A

---

## 🗺️ OVERALL STATUS DASHBOARD

| Item/Phase | ID    | Title/Description   | Status       | Progress | Priority | Dependencies |
| ---------- | ----- | ------------------- | ------------ | -------- | -------- | ------------ |
| [Item 1]   | [ID1] | [Brief description] | **[STATUS]** | X%       | P0       | [Deps]       |
| [Item 2]   | [ID2] | [Brief description] | **[STATUS]** | Y%       | P1       | [Deps]       |
| [Item 3]   | [ID3] | [Brief description] | **[STATUS]** | Z%       | P2       | [Deps]       |

**Overall Progress**: X/Y items complete (Z%) **Estimated Total Effort**: [X-Y
hours | weeks | months] **Phase**: [Foundation | Core | Enhancement | Advanced |
Future] **Priority**: [P0 | P1 | P2 | P3] **Highest Risk Items**: [List critical
items]

---

## 🔀 DEPENDENCY MAP

### Dependency Graph

```text
[Item 1] ──┬──> [Item 2] ──┬──> [Item 5]
           │                │
           ├──> [Item 3]    └──> [Item 6]
           │
           └──> [Item 4]
```

### Dependency Details

**[Item 1]** blocks:

- [Item 2] - [Reason why]
- [Item 3] - [Reason why]

**[Item 2]** blocks:

- [Item 5] - [Reason why]

### Recommended Execution Order

1. **Start with [Items]** - [Reasoning]
2. **Then [Items]** - [Reasoning]
3. **Finally [Items]** - [Reasoning]

**Critical Path**: [Item] → [Item] → [Item]

---

## 🎯 MACRO-LEVEL SUMMARY

### Project/Initiative Goals

[High-level description of what this document tracks and why it matters]

### Problem Statement

[Description of the problem being solved or need being addressed]

Key issues:

1. **[Issue 1]**: Description
2. **[Issue 2]**: Description
3. **[Issue 3]**: Description

### Success Criteria

Upon completion:

- ✅ [Criterion 1]
- ✅ [Criterion 2]
- ✅ [Criterion 3]

### Categories/Buckets

[If applicable, organize work into logical groups]

1. **[Category 1]** - [Items/Phases in this category]
2. **[Category 2]** - [Items/Phases in this category]
3. **[Category 3]** - [Items/Phases in this category]

---

## 📚 RELATED DOCUMENTATION

**Primary References:**

- [Related Doc 1] - Purpose
- [Related Doc 2] - Purpose

**Supporting Documentation:**

- [Supporting Doc 1] - Purpose
- [Supporting Doc 2] - Purpose

**⚠️ IMPORTANT**: Always consult [critical related docs] before starting work.

---

# [MAIN CONTENT SECTIONS]

## [Section 1: Item/Phase Details]

### [Item/Phase Header]

| Attribute            | Value                           |
| -------------------- | ------------------------------- |
| **ID**               | [Unique identifier]             |
| **Title**            | [Full title]                    |
| **Category**         | [Category/bucket]               |
| **Status**           | **[STATUS]**                    |
| **Risk Level**       | [HIGH/MEDIUM/LOW]               |
| **Estimated Effort** | [X-Y hours/days/weeks]          |
| **Completion**       | X% ([details])                  |
| **Started**          | YYYY-MM-DD                      |
| **Completed**        | YYYY-MM-DD or "Not completed"   |
| **Last Updated**     | YYYY-MM-DD ([what was updated]) |
| **Blocking**         | [List of blocked items]         |

---

### Intentions & Goals

#### Primary Goal

[Clear, concise statement of the main objective]

#### Secondary Goals

- [Goal 1]
- [Goal 2]
- [Goal 3]

#### Context

[Additional context, constraints, or background information]

---

### What Was Accomplished

**Completed Items** (X/Y = Z%):

- ✅ **[Item 1]** (YYYY-MM-DD)
  - [Details of what was done]
  - [Files changed, commits made, evidence]
- ✅ **[Item 2]** (YYYY-MM-DD)
  - [Details]

**In Progress Items**:

- ⏳ **[Item 3]** (started YYYY-MM-DD)
  - [Current status]
  - [Blockers or next steps]

---

### What Was NOT Accomplished

**Deferred Items**:

- ⏸️ **[Item X]** → Deferred to [future phase/date]
  - **Reason**: [Explanation]
  - **Impact**: [What this means]

**Items Not Done**:

- ❌ **[Item Y]**
  - **Reason**: [Why not done]
  - **Plan**: [What will happen]

---

### Reasoning & Decisions

**Key Decisions**:

1. **[Decision 1]**: [What was decided and why]
   - **Trade-offs**: [What was considered]
   - **Rationale**: [Why this choice was made]

2. **[Decision 2]**: [What was decided and why]
   - **Alternatives Considered**: [Other options]
   - **Chosen Approach**: [What was selected]

**Design Choices**:

- \[Choice 1\]: \[Reasoning\]
- \[Choice 2\]: \[Reasoning\]

---

### Detailed Work Items

#### [Work Item 1]

**Status**: ✅ DONE | ⏳ IN_PROGRESS | ❌ NOT DONE | 🚫 WONTFIX | ⏸️ DEFERRED

**Details**:

- [Specific information about this work item]
- [Files affected, changes made]
- [Acceptance criteria]

**Evidence of Completion**:

- [Commit SHA, PR number, test results]

**Notes**:

- [Additional context or observations]

---

### Gap Analysis

**Intended vs. Actual Work**:

| Intended Work | Actual Work | Gap          | Status   |
| ------------- | ----------- | ------------ | -------- |
| [Intent 1]    | [Actual 1]  | [Difference] | ✅/⏳/❌ |
| [Intent 2]    | [Actual 2]  | [Difference] | ✅/⏳/❌ |

**Completion Analysis**:

- **Items Complete**: X/Y (Z%)
- **Items In Progress**: A
- **Items Not Started**: B
- **Items Deferred/Won't Fix**: C

**Patterns in Gaps**:

1. [Pattern 1]: [Description and impact]
2. [Pattern 2]: [Description and impact]

**Corrective Actions**:

- [Action 1 to address gaps]
- [Action 2 to address gaps]

---

### Acceptance Criteria

- [ ] [Criterion 1]: [How to verify]
- [ ] [Criterion 2]: [How to verify]
- [ ] [Criterion 3]: [How to verify]
- [ ] [Criterion 4]: [How to verify]

**Definition of Done**:

1. All acceptance criteria checkboxes checked
2. [Additional requirement]
3. [Additional requirement]

**Verification Steps**:

```bash
# [Command 1 to verify completion]
# [Command 2 to verify completion]
```

**Expected Results**:

- [Expected result 1]
- [Expected result 2]

---

## 📝 UPDATE TRIGGERS

**Update this document when:**

- ✅ [Trigger 1] (e.g., Status changes)
- ✅ [Trigger 2] (e.g., Work completed)
- ✅ [Trigger 3] (e.g., Dependencies change)
- ✅ [Trigger 4] (e.g., Timeline adjusted)
- ✅ [Trigger 5] (e.g., New information discovered)

---

## 🗓️ VERSION HISTORY

| Version | Date       | Changes                  | Author   |
| ------- | ---------- | ------------------------ | -------- |
| 1.0     | YYYY-MM-DD | Initial document created | [Author] |

---

## 🤖 AI INSTRUCTIONS

When implementing work tracked by this document:

1. [Instruction 1]
2. [Instruction 2]
3. [Instruction 3]
4. Always update this document after completing work
5. Commit changes with descriptive message

---

**END OF TEMPLATE**

**Usage Notes:**

- Replace all [bracketed placeholders] with actual content
- Remove sections not applicable to your specific document
- Add sections as needed for your use case
- Maintain consistent formatting and structure
- Update status indicators regularly

**When to Use Simplified Version:**

This full template is comprehensive (16+ sections) and best for large
initiatives. **Use a lighter version** for:

- Small features, quick wins, or bug fixes
- Experiments or proof-of-concepts
- Single-task work items

**Sections to omit for lightweight docs:**

- Gap Analysis (skip detailed analysis)
- Detailed Work Items (keep task list minimal)
- Extensive Acceptance Criteria (keep 3-5 items max)
- Reasoning & Decisions (include only if critical)

**Simplified template = Core sections only:** Purpose, Status Dashboard, one
Item/Phase section (with What Was Accomplished), AI Instructions

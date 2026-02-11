# SoNash Documentation Standards

**Document Version**: 1.4 **Created**: 2025-12-31 **Last Updated**: 2026-02-03
**Status**: ACTIVE **Overall Completion**: 100% (Standards established and
operational)

---

## 📋 Purpose

This document establishes the standards, conventions, and guidelines for ALL
documentation in the SoNash Recovery Notebook project.

**📌 NOTE**: This is the **CANONICAL** guide for all SoNash documentation. All
docs must follow these standards.

**Goals**:

1. **Consistency**: Uniform structure and formatting across all docs
2. **Maintainability**: Clear ownership and update triggers
3. **Discoverability**: Easy to find and navigate documentation
4. **AI-Friendly**: Optimized for AI assistant comprehension and updates
5. **Quality**: High standards for accuracy and completeness

**⚠️ CRITICAL**: All documentation MUST conform to these standards.
Non-compliant docs will be flagged during reviews.

## Quick Start

1. Use appropriate template from `docs/templates/`
2. Include required sections for document tier
3. Run `npm run docs:check` before committing

---

## Technical Debt Integration

> **TDMS Authority:** For technical debt findings from audits, the
> [Technical Debt Management System (TDMS)](./technical-debt/PROCEDURE.md) is
> the authoritative system. Documentation Standards defines the JSONL output
> format for audits; TDMS defines the canonical storage format.

**Data Flow:**

```
Audit Skill → JSONL Output → intake-audit.js → MASTER_DEBT.jsonl
(Doc Standards)              (Mapping)         (TDMS Authority)
```

**Schema Relationship:**

- **Doc Standards JSONL** = audit output format (input to TDMS)
- **TDMS MASTER_DEBT.jsonl** = canonical storage (output of intake)
- **Field mapping** defined in
  [JSONL_SCHEMA_STANDARD.md](./templates/JSONL_SCHEMA_STANDARD.md)

## AI Instructions

When creating documentation:

- Select correct template for document type
- Include all required sections for the tier level
- **AI Instructions section MUST be near the top** (after title and metadata)
  - LLMs read top-to-bottom; instructions at the bottom of long documents are
    often missed
  - Place immediately after the metadata block, before main content
- Validate with docs:check before committing

---

## 🗂️ 5-Tier Documentation System

### Overview

All documentation is organized into 5 tiers based on purpose, update frequency,
and structure requirements:

| Tier | Category         | Update Frequency       | Status Tracking | Templates               |
| ---- | ---------------- | ---------------------- | --------------- | ----------------------- |
| 1    | Canonical Living | After every change     | ✅ Required     | CANONICAL_DOC_TEMPLATE  |
| 2    | Foundation       | Quarterly or as needed | ❌ Not required | FOUNDATION_DOC_TEMPLATE |
| 3    | Planning         | Active work only       | ✅ Required     | PLANNING_DOC_TEMPLATE   |
| 4    | Reference        | When workflows change  | ❌ Not required | REFERENCE_DOC_TEMPLATE  |
| 5    | Guides           | When outdated          | ❌ Not required | GUIDE_DOC_TEMPLATE      |

---

### Tier 1: Canonical Living Documents

**Purpose**: Single sources of truth for critical project information

**Documents**:

- README.md
- ROADMAP.md
- ROADMAP_LOG.md
- Major multi-phase plans (e.g., EIGHT_PHASE_REFACTOR_PLAN.md,
  DOCUMENTATION_STANDARDIZATION_PLAN.md)

**Characteristics**:

- ✅ **Must have**: Status dashboards, progress tracking, completion percentages
- ✅ **Must have**: Version history table
- ✅ **Must have**: Update triggers section
- ✅ **Must have**: "Last Updated" date in header
- ✅ **Must have**: Clear "How to Use" and "How to Update" sections
- ✅ **Must have**: Dependency maps for multi-phase plans
- 🔄 **Update immediately** when any tracked item changes status

**Template**: `docs/templates/CANONICAL_DOC_TEMPLATE.md`

**Example**: See EIGHT_PHASE_REFACTOR_PLAN.md

---

### Tier 2: Foundation Documents

**Purpose**: Technical reference and architectural documentation

**Documents**:

- ARCHITECTURE.md
- SECURITY.md
- DEVELOPMENT.md

**Characteristics**:

- ✅ **Must have**: Purpose & Scope section
- ✅ **Must have**: "Last Updated" date and version number
- ✅ **Must have**: Best practices and anti-patterns
- ✅ **Must have**: Code examples with file references
- ✅ **Should have**: Quick start section
- ✅ **Should have**: Common pitfalls section
- 🔄 **Update when**: Architecture changes, new patterns added, quarterly
  reviews

**Template**: `docs/templates/FOUNDATION_DOC_TEMPLATE.md`

---

### Tier 3: Planning Documents

**Purpose**: Active planning and tracking for specific initiatives

**Documents**:

- Feature implementation plans (see `docs/archive/superseded-plans/` for
  examples)
- Initiative plans (see `docs/archive/superseded-plans/` for examples)
- Research documents (MONETIZATION_RESEARCH.md)
- Backlog documents (docs/technical-debt/INDEX.md)

**Characteristics**:

- ✅ **Must have**: Status dashboard with task tracking
- ✅ **Must have**: Objectives and acceptance criteria
- ✅ **Must have**: Dependencies section
- ✅ **Must have**: Progress tracking (What Was Accomplished)
- ✅ **Should have**: Implementation phases
- ✅ **Should have**: Risk register
- 🔄 **Update when**: Task status changes, work completed, blockers discovered
- 📦 **Archive when**: Plan fully complete → move to docs/archive/plans/

**Template**: `docs/templates/PLANNING_DOC_TEMPLATE.md`

---

### Tier 4: Reference Documents

**Purpose**: Procedural guidance and workflow instructions

**Documents**:

- AI_WORKFLOW.md
- SESSION_CONTEXT.md
- PR_WORKFLOW_CHECKLIST.md
- AI_REVIEW_PROCESS.md
- MULTI_AI_REVIEW_COORDINATOR.md
- claude.md

**Archived**:

- IMPLEMENTATION_PROMPTS.md (superseded by Multi-AI review templates)

**Characteristics**:

- ✅ **Must have**: Clear "When to Use" section
- ✅ **Must have**: Step-by-step procedures
- ✅ **Must have**: "Last Updated" date
- ✅ **Should have**: Quick reference section
- ✅ **Should have**: Examples and templates
- ✅ **Should have**: Troubleshooting section
- 🔄 **Update when**: Workflows change, best practices evolve

**Template**: `docs/templates/REFERENCE_DOC_TEMPLATE.md`

---

### Tier 5: Guides

**Purpose**: How-to documentation and tutorials

**Documents**:

- How-to guides (to be created as needed)
- Tutorials
- Learning materials

**Characteristics**:

- ✅ **Must have**: Learning objectives
- ✅ **Must have**: Prerequisites section
- ✅ **Must have**: Step-by-step instructions with verification
- ✅ **Should have**: Examples (simple and complex)
- ✅ **Should have**: Troubleshooting section
- ✅ **Should have**: Next steps/related guides
- 🔄 **Update when**: Steps become outdated, tools change
- 📦 **Archive when**: Approach becomes deprecated

**Template**: `docs/templates/GUIDE_DOC_TEMPLATE.md`

---

## 📝 Document Metadata Standards

### Required Metadata (All Tiers)

**At the top of EVERY document**:

```markdown
# [Document Title]

**Last Updated**: YYYY-MM-DD [Additional metadata specific to tier]
```

### Tier-Specific Metadata

**Tier 1 (Canonical)**:

```markdown
**Document Version**: X.Y **Created**: YYYY-MM-DD **Last Updated**: YYYY-MM-DD
**Status**: [ACTIVE | COMPLETE | ARCHIVED] **Overall Completion**: X% or "X/Y
items complete (Z%)"
```

**Tier 2 (Foundation)**:

```markdown
**Last Updated**: YYYY-MM-DD **Document Version**: X.Y **Status**: Active |
Under Review | Deprecated **Applies To**: [Version/Release/All]
```

**Tier 3 (Planning)**:

```markdown
**Document Version**: X.Y **Created**: YYYY-MM-DD **Last Updated**: YYYY-MM-DD
**Status**: PLANNING | IN_PROGRESS | COMPLETE | ON_HOLD **Overall Completion**:
X% **Phase**: [Foundation | Core | Enhancement | Advanced | Future]
**Priority**: [P0 | P1 | P2 | P3]
```

> **Note:** As of v3.17, ROADMAP.md uses Phase + Priority instead of target
> dates. Planning documents should follow the same pattern. See
> [Timing System Standards](#-timing-system-standards) below.

**Tier 4 (Reference)**:

```markdown
**Last Updated**: YYYY-MM-DD **Document Version**: X.Y **Purpose**: [Brief
description] **When to Use**: [Trigger/scenario]
```

**Tier 5 (Guides)**:

```markdown
**Last Updated**: YYYY-MM-DD **Difficulty**: Beginner | Intermediate | Advanced
**Estimated Time**: X minutes/hours **Prerequisites**: [What's required]
```

---

## 🔢 Version Numbering

### Format: X.Y

**Major Version (X.0)**:

- Complete document restructure
- Breaking changes to documented processes
- Tier migrations
- Significant scope changes

**Minor Version (X.Y)**:

- Content additions
- Clarifications
- Updates to existing sections
- Bug fixes in documentation

### Examples

- `1.0` → Initial document creation
- `1.1` → Added new section on error handling
- `1.2` → Updated code examples, fixed typos
- `2.0` → Complete rewrite with new structure
- `2.1` → Added troubleshooting section

### When to Increment

**Increment major version when**:

- Changing document tier
- Complete restructure
- Breaking process changes

**Increment minor version when**:

- Adding new sections
- Updating examples
- Clarifying existing content
- Fixing errors

**Don't increment for**:

- Typo fixes in same session
- Formatting adjustments
- Date updates only

---

## 🔗 Cross-Reference Standards

### Internal Links

**Format**: `[Link Text]` followed by `(relative-path-to-file.md)`

**Best Practices**:

- ✅ Use relative paths
- ✅ Link to specific sections with anchors: `(./FILE.md#section-name)`
- ✅ Use descriptive link text (not "click here")
- ✅ Verify links work before committing

**Examples**:

```markdown
See [ARCHITECTURE.md](../ARCHITECTURE.md) for system design. See the
[Dependencies section](../ROADMAP.md#milestone-dependency-graph) for
prerequisites.
```

### External Links

**Format**: `[Link Text](https://example.com)`

**Best Practices**:

- ✅ Include link purpose:
  `[Firebase Auth Docs](https://firebase.google.com) - User management`
- ✅ Use official documentation when available
- ✅ Check links periodically for rot

### File References

**When referencing code**:

Format: `path/to/file.ts:line_number`

**Examples**:

```markdown
See the implementation in `lib/firestore-service.ts:142` The canonical pattern
is in `hooks/use-journal.ts:89-104`
```

---

## ✍️ Markdown Conventions

### Headings

**Structure**:

```markdown
# Document Title (H1 - once per document)

## Major Section (H2)

### Subsection (H3)

#### Detail Level (H4)
```

**Best Practices**:

- ✅ Only one H1 per document (the title)
- ✅ Use H2 for major sections
- ✅ Don't skip levels (H2 → H4)
- ✅ Use emoji prefixes for major sections: `## 📋 Section Name`

### Lists

**Unordered**:

```markdown
- Item 1
- Item 2
  - Nested item 2.1
  - Nested item 2.2
- Item 3
```

**Ordered**:

```markdown
1. First step
2. Second step
3. Third step
```

**Checklists**:

```markdown
- [ ] Incomplete item
- [x] Complete item
- [ ] Another item
```

### Code Blocks

**With language**:

````markdown
```typescript
// Code with syntax highlighting
const example = "value";
```
````

**With comments**:

```typescript
// Always explain what code does
// Especially for complex logic
const result = complexFunction();
```

**Bash commands**:

```bash
# Description of what this does
command --with-flags argument
```

### Tables

**Standard format**:

```markdown
| Column 1 | Column 2 | Column 3 |
| -------- | -------- | -------- |
| Value 1  | Value 2  | Value 3  |
| Value 4  | Value 5  | Value 6  |
```

**Alignment**:

```markdown
| Left | Center | Right |
| :--- | :----: | ----: |
| L    |   C    |     R |
```

### Emphasis

**Bold**: `**important text**` for critical information **Italic**:
`*emphasized text*` for emphasis **Code**: `` `code` `` for inline code,
commands, file names

**Best Practices**:

- ✅ Use bold for warnings: `**⚠️ WARNING**: message`
- ✅ Use code formatting for: file names, commands, variables, functions
- ✅ Don't overuse emphasis - save it for truly important items

---

## 🚨 Required Sections by Tier

### All Tiers Must Have

1. **Document title** (H1)
2. **Metadata block** (see standards above)
3. **AI Instructions** (immediately after metadata - MUST be near top)
4. **Purpose/Overview section** (what is this doc for?)
5. **Main content** (tier-specific)
6. **Version history table** (at bottom)

### Tier-Specific Requirements

**Tier 1 (Canonical)**:

- 🤖 AI Instructions (MUST be near top, after metadata)
- 📋 Document Purpose
- 📋 How to Use This Document
- 📝 How to Update This Document
- 📊 Status Legend
- 🗺️ Overall Status Dashboard
- 📚 Main Content Sections
- 📝 Update Triggers
- 🗓️ Version History

**Tier 2 (Foundation)**:

- 🤖 AI Instructions (MUST be near top, after metadata)
- 📋 Purpose & Scope
- 🎯 Quick Start (optional but recommended)
- 📚 Main Technical Content
- 🔐 Critical Requirements (if applicable)
- 🚨 Common Pitfalls
- 🔄 Update Procedures
- 🔗 References
- 🗓️ Version History

**Tier 3 (Planning)**:

- 🤖 AI Instructions (MUST be near top, after metadata)
- 📋 Purpose & Scope
- 🗺️ Status Dashboard
- 🎯 Objectives & Requirements
- 🔀 Dependencies
- 📐 Design (if applicable)
- 📋 Implementation Plan
- ✅ Acceptance Criteria
- 📊 Progress Tracking
- 🗓️ Version History

**Tier 4 (Reference)**:

- 🤖 AI Instructions (MUST be near top, after metadata)
- 📋 Purpose & Scope
- 🎯 Quick Reference
- 📖 Complete Workflow/Process
- ✅ Completion Checklist
- 🚨 Common Issues & Solutions
- 💡 Best Practices
- 🗓️ Version History

**Tier 5 (Guides)**:

- 📋 Overview (objectives, prerequisites)
- 🎯 Quick Start
- 📖 Step-by-Step Guide
- ✅ Verification
- 💡 Best Practices
- 📚 Examples
- 🚨 Troubleshooting
- 📝 Next Steps
- 🗓️ Version History

---

## 🔄 Update Standards

### When to Update

**Update immediately** (within same session):

- Tier 1: Any status change, completion update
- Tier 3: Task completion, blocker discovery
- All tiers: Errors discovered in documentation

**Update soon** (within a week):

- Tier 2: New patterns added to codebase
- Tier 4: Workflow changes
- Tier 5: Steps become outdated

**Update periodically**:

- Tier 2: Quarterly review
- Tier 4: When used and issues found
- Tier 5: When dependencies change

### How to Update

1. **Make content changes** in relevant sections
2. **Update metadata**:
   - "Last Updated" date (always)
   - Version number (if significant changes)
3. **Add version history entry** (for significant changes)
4. **Run validation** (if automation available):
   ```bash
   npm run docs:check
   ```
5. **Commit with clear message**:
   ```bash
   git add path/to/doc.md
   git commit -m "docs: Update [doc-name] - [what changed]"
   ```

### Quality Protocols

**⚠️ Pre-Commit Validation Checklist**

Before committing **any** documentation:

**All Tiers:**

- [ ] Run static analysis if available (`markdownlint`, `languagetool`)
- [ ] Verify all cross-referenced files exist
- [ ] Check all links are valid (no broken references)
- [ ] Confirm formatting is consistent

**Tier 1 (Canonical) Documents:**

- [ ] Document Version present
- [ ] Created date present
- [ ] Last Updated present
- [ ] Status present
- [ ] Overall Completion present
- [ ] Document follows its own standards (self-compliance check)

**Tier 2 (Foundation) Documents:**

- [ ] Document Version present
- [ ] Last Updated present
- [ ] Status present
- [ ] Applies To present

**Tier 3 (Planning) Documents:**

- [ ] Document Version present
- [ ] Status present
- [ ] Overall Completion present
- [ ] Phase/Priority present (not Target Completion date - see Timing System)

**Status Synchronization Protocol**

When updating project status in **any** document, immediately update **all
related** status documents:

| Primary Doc Updated                   | Must Sync To                              | What to Update                                                                       |
| ------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------ |
| DOCUMENTATION_STANDARDIZATION_PLAN.md | SESSION_CONTEXT.md, ROADMAP.md, README.md | Current sprint focus, Quick Status table, Next Up, Overall progress, next priorities |
| ROADMAP.md                            | SESSION_CONTEXT.md, README.md             | Active milestones, completion %, current sprint                                      |
| Any plan document                     | AI_WORKFLOW.md                            | Navigation map (if new doc added)                                                    |

**⚠️ Update Dependencies Protocol (MANDATORY for tightly-coupled docs)**

Documents with tight coupling to other documents MUST include an **"Update
Dependencies"** section that explicitly lists what else needs updating. This
prevents missed updates when editing related documents.

**When Required:**

- Templates with derived instances (audit templates → slash commands)
- Slash commands that invoke other commands (fetch-pr-feedback → pr-review)
- Documents with parallel versions (multi-AI vs single-session audits)
- Schema definitions with consumers

**Required Section Format:**

```markdown
## ⚠️ Update Dependencies

When updating this document, also update:

| Document             | What to Update           | Why                   |
| -------------------- | ------------------------ | --------------------- |
| `path/to/related.md` | [specific field/section] | [reason for coupling] |
```

**Placement:** After "Related Documents" section, before "Version History"

**Key Principle:** If you've updated this document multiple times and forgotten
to update a related document, ADD IT to the Update Dependencies table. This is
institutional memory.

**Cross-Reference Validation**

Before committing:

1. List all Markdown references (all formats):
   - Inline links: `[text]` + `(path)` and `[text]` + `(#anchor)`
   - Reference-style links: `[text][id]` and definitions like
     `[id]: path-or-url`
   - Images: `![alt]` + `(path)`
   - Autolinks: `https://...`
2. For each **internal path**:
   - Verify the target file exists in the repository
   - If linking to a section, verify the `#anchor` exists in the target file
     - Anchors are GitHub-generated from headings (lowercase, spaces → `-`,
       punctuation removed)
     - Verify by matching the exact heading text in the target file or copy from
       GitHub's heading link icon
3. For each **external URL**:
   - Verify it resolves (no 404/redirect loop) and points to the intended
     resource
4. Update or remove broken references

**Template Testing (for new templates only)**

When creating a new template:

1. Create a minimal viable example document using the template
2. Fill ALL placeholder sections with 1-2 sentence real content
3. Verify example makes sense and placeholders are clear
4. Save example to `docs/examples/[template-name]-example.md`

**⚠️ MANDATORY: Deliverable Audit (for phase/milestone completion)**

Before marking ANY phase, milestone, or work package as complete:

1. **Review original scope** - Goals, acceptance criteria, deliverables list
2. **Verify each deliverable** - Exists? Complete? Meets criteria?
3. **Check for gaps** - Any missing items or unmet criteria?
4. **Document findings** - Add to "What Was Accomplished" section
5. **Address gaps** - Fix or document why acceptable
6. **Then mark complete** - Only after audit passes

**See**: [AI_WORKFLOW.md](../AI_WORKFLOW.md) → "MANDATORY: Deliverable Audit
Procedure" for full template.

This is a **global standard** - applies to ALL phases, milestones, sections, and
work packages throughout the entire project.

### Commit Message Format

**For documentation updates**:

```
docs: Update [document-name] - [brief description]

[Optional longer description of what changed and why]
```

**Examples**:

```
docs: Update ARCHITECTURE.md - add Firebase Collections section
docs: Update ROADMAP.md - mark M1.5 tasks complete
docs: Update SESSION_CONTEXT.md - add Dec 31 session work
```

---

## 📅 Timing System Standards

> **Introduced:** Session #128 (ROADMAP.md v3.17)

### Overview

SoNash documentation uses **Priority + Phase Buckets + Relative Ordering**
instead of calendar dates for scheduling. This prevents artificial deadlines
while maintaining clear execution order.

### Phase Buckets (Execution Order)

| Phase       | Description                     | Examples       |
| ----------- | ------------------------------- | -------------- |
| Foundation  | Must complete first             | M0, M1, Active |
| Core        | Core features after foundation  | M3, M4, M4.5   |
| Enhancement | Enhancements after core         | M5, M6, M7     |
| Advanced    | Advanced features after enhance | M8             |
| Future      | Long-term vision                | M9, M10        |
| Parallel    | Can run alongside any phase     | M2 (optional)  |

### Priority Levels (Urgency)

| Priority | Meaning          | Action                    |
| -------- | ---------------- | ------------------------- |
| P0       | Critical/Urgent  | Work on immediately       |
| P1       | Next Sprint      | Plan for upcoming work    |
| P2       | Backlog          | Queue when capacity opens |
| P3       | Future/Nice-Have | Consider after P0-P2      |

### Session References

Use session numbers instead of dates for traceability:

- ✅ **Correct**: "Added in Session #128", "DONE (Session #77)"
- ❌ **Avoid**: "Target: Q2 2026", "Due: 2026-03-15"

**Exception**: Version History tables may keep dates for audit trail purposes.

### Applying to Documents

**Tier 1 (Canonical)**: Use Phase/Priority in milestone tables

**Tier 3 (Planning)**: Use Phase/Priority instead of "Target Completion" date

**ROADMAP references**: Use relative ordering ("after M3", "blocks M5") not
dates

### Cross-Reference

- [ROADMAP.md](../ROADMAP.md) - Timing System section for full details
- Phase Buckets define WHAT order to execute
- Priority defines HOW URGENTLY within that phase

---

## 🤖 AI Instructions

### For AI Assistants

**When creating new documentation**:

1. Determine correct tier
2. Use appropriate template from `docs/templates/`
3. Fill in all required sections
4. Follow metadata standards
5. Add initial version history entry
6. Commit with descriptive message

**When updating existing documentation**:

1. Read current document first
2. Make content changes
3. Update "Last Updated" date
4. Add version history entry (if significant)
5. Increment version number (if significant)
6. Maintain existing structure
7. Commit changes

**When archiving documentation**:

1. Add to appropriate archive directory:
   - Plans → `docs/archive/plans/`
   - Historical → `docs/archive/YYYY-MM-DD/`
2. Update referencing documents
3. Add archive note to top of document
4. Commit with "docs: Archive [doc-name]" message

### Quality Checks

Before committing documentation changes, verify:

- [ ] Metadata block present and accurate
- [ ] All required sections included for tier
- [ ] Internal links work
- [ ] Code examples are valid
- [ ] No typos or grammatical errors
- [ ] Version history updated (if significant changes)
- [ ] Formatting consistent with conventions

---

## 🗓️ Version History

| Version | Date       | Changes                                                                                                                                                              | Author      |
| ------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| 1.4     | 2026-02-03 | Added Timing System Standards section (Session #128); updated Tier 3 metadata to use Phase/Priority instead of Target Completion date                                | Claude      |
| 1.3     | 2026-02-02 | Added Technical Debt Integration section clarifying TDMS authority and schema relationship                                                                           | Claude      |
| 1.2     | 2026-01-01 | Added MANDATORY Deliverable Audit as global standard for phase/milestone completion in Quality Protocols                                                             | Claude      |
| 1.1     | 2026-01-01 | Added Quality Protocols section with 4 new protocols: Pre-Commit Validation Checklist, Status Synchronization Protocol, Cross-Reference Validation, Template Testing | Claude Code |
| 1.0     | 2025-12-31 | Initial documentation standards created                                                                                                                              | Claude Code |

---

**END OF DOCUMENTATION_STANDARDS.md**

This is a living document. Update it as documentation needs evolve.

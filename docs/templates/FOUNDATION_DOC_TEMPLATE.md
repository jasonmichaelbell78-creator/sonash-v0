# [Document Title]

**Document Version**: X.Y **Status**: Active | Under Review | Deprecated
**Applies To**: [Version/Release/All] **Last Updated**: YYYY-MM-DD

---

## 📋 Purpose & Scope

### Document Purpose

This document provides [comprehensive | reference | canonical] information about
[subject area] for the SoNash Recovery Notebook project.

**Primary Audience**: [Developers | Security Team | DevOps | All Contributors]

**Scope**:

- ✅ **In Scope**: [What this document covers]
- ❌ **Out of Scope**: [What this document doesn't cover]

### When to Use This Document

**Use this document when:**

- [Use case 1]
- [Use case 2]
- [Use case 3]

**See also:**

- [Related Doc 1] - For [specific topic]
- [Related Doc 2] - For [specific topic]

---

## 🎯 Quick Start

### For New Team Members

1. **Clone repo and run setup**:
   `git clone <repo-url> && cd <repo-dir> && npm install && npm test`
2. **Read sections in order**: Overview → Architecture → Patterns → Examples
3. **Run tests to verify setup**: All tests should pass before starting work

_Tip: Start with the "Quick Reference" and "Common Patterns" sections for
practical examples._

### For AI Assistants

**Before making changes that affect [subject area]:**

1. **Prioritize these sections**: Overview, Architecture, Patterns/Conventions,
   Coding Standards, Examples
2. **Verify patterns**: Search for repeated implementations across modules,
   check unit tests/examples, review recent PRs
3. **Distinguish patterns from anomalies**:
   - **Pattern** = repeated, documented, covered by tests/examples
   - **Anomaly** = one-off, undocumented, or flagged in issues
4. **When introducing new patterns**: Add description, examples, link to related
   tests/PRs, commit docs with code

---

## 🗺️ Document Structure

This document is organized into the following sections:

1. **[Section 1]** - [Purpose]
2. **[Section 2]** - [Purpose]
3. **[Section 3]** - [Purpose]
4. **[Appendices]** - [Supporting information]

---

# [MAIN CONTENT SECTIONS]

## 1. [Core Concept/Component 1]

### Overview

[High-level description of this concept/component]

**Key Characteristics**:

- [Characteristic 1]
- [Characteristic 2]
- [Characteristic 3]

### Architecture/Design

[Detailed explanation of how this works]

```
[ASCII diagram or architecture visualization if applicable]

Example:
┌─────────────┐
│   Component │──> Output
│      A      │
└─────────────┘
       │
       ▼
┌─────────────┐
│   Component │
│      B      │
└─────────────┘
```

### Implementation Details

**Technology Stack**:

- [Tech 1]: [Purpose]
- [Tech 2]: [Purpose]
- [Tech 3]: [Purpose]

**Key Files/Directories**:

- `[path/to/file1]` - [Purpose]
- `[path/to/file2]` - [Purpose]
- `[directory/]` - [Contents and purpose]

**Configuration**:

```bash
# [Configuration location]
# [Configuration example]
```

### Best Practices

#### ✅ DO

- [Best practice 1]
- [Best practice 2]
- [Best practice 3]

#### ❌ DON'T

- [Anti-pattern 1]
- [Anti-pattern 2]
- [Anti-pattern 3]

### Code Examples

**Example 1: [Common Use Case]**

```typescript
// [Description of what this example demonstrates]
// [Setup or context if needed]

[Code example]
```

**Example 2: [Another Use Case]**

```typescript
// [Description]

[Code example]
```

### Common Patterns

**Pattern 1: [Pattern Name]**

- **When to use**: [Scenarios]
- **Implementation**: [Brief description]
- **Example**: See `[file reference]:[line number]`

**Pattern 2: [Pattern Name]**

- **When to use**: [Scenarios]
- **Implementation**: [Brief description]
- **Example**: See `[file reference]:[line number]`

### Anti-Patterns to Avoid

**Anti-Pattern 1: [Name]**

- **Why it's bad**: [Explanation]
- **Instead, do**: [Better approach]
- **Migration guide**: [If replacing existing pattern]

---

## 2. [Core Concept/Component 2]

### Overview

[Description]

### [Sub-sections following similar structure to Component 1]

---

## 🔐 Critical Requirements

### Must-Have Requirements

1. **[Requirement 1]**: [Description and rationale]
   - **Verification**: [How to verify compliance]
   - **Consequences**: [Impact if not followed]

2. **[Requirement 2]**: [Description and rationale]
   - **Verification**: [How to verify]
   - **Consequences**: [Impact if not followed]

### Should-Have Requirements

1. **[Requirement 1]**: [Description]
   - **Rationale**: [Why recommended]
   - **Exceptions**: [When deviation is acceptable]

---

## 🚨 Common Pitfalls

### Pitfall 1: [Description]

**Symptoms**:

- [How this manifests]
- [Error messages or behaviors]

**Root Cause**:

- [Why this happens]

**Solution**:

```bash
# [Steps to resolve]
```

**Prevention**:

- [How to avoid this pitfall]

### Pitfall 2: [Description]

[Following same structure]

---

## 🔄 Update Procedures

### When This Document Should Be Updated

**Update immediately when:**

- ✅ [Trigger 1] (e.g., New architecture patterns introduced)
- ✅ [Trigger 2] (e.g., Technology stack changes)
- ✅ [Trigger 3] (e.g., Best practices evolve)

**Update periodically:**

- 🔁 [Periodic review trigger] (e.g., Quarterly review)

### How to Update

1. **Make changes** to relevant sections
2. **Update "Last Updated" date** at top of document
3. **Add entry to Version History** at bottom
4. **Increment version number** if major changes (X.0) or minor changes (X.Y)
5. **Commit with descriptive message**:
   ```bash
   git add docs/[this-document].md
   git commit -m "docs: Update [document] - [description of changes]"
   ```

### Version Number Guide

- **Major version (X.0)**: Significant architectural changes, breaking changes,
  complete rewrites
- **Minor version (X.Y)**: Updates, additions, clarifications, non-breaking
  changes

---

## 🔗 References & Related Documentation

### Internal Documentation

**Foundation Documents**:

- [ARCHITECTURE.md](../../ARCHITECTURE.md) - System architecture
- [SECURITY.md](../SECURITY.md) - Security guidelines
- [DEVELOPMENT.md](../../DEVELOPMENT.md) - Development procedures

**Planning Documents**:

- [ROADMAP.md](../../ROADMAP.md) - Product roadmap
- [Feature plans] - Specific feature documentation

**Reference Documents**:

- [Reference doc 1] - Purpose
- [Reference doc 2] - Purpose

### External Documentation

**Official Documentation**:

- [Technology 1 docs] - [URL]
- [Technology 2 docs] - [URL]

**Learning Resources**:

- [Resource 1] - [Description]
- [Resource 2] - [Description]

---

## 📚 Appendix

### A. [Appendix Topic 1]

[Supporting information, detailed specifications, etc.]

### B. [Appendix Topic 2]

[Additional reference material]

### C. Glossary

**[Term 1]**: [Definition]

**[Term 2]**: [Definition]

**[Term 3]**: [Definition]

---

## 🗓️ Version History

| Version | Date       | Changes                  | Author/Team |
| ------- | ---------- | ------------------------ | ----------- |
| 1.0     | YYYY-MM-DD | Initial document created | [Author]    |
| 1.1     | YYYY-MM-DD | [Description of changes] | [Author]    |

---

## 🤖 AI Instructions

**For AI Assistants:**

When working with [subject area]:

1. **Always read this document** before making
   architectural/security/development decisions
2. **Follow documented patterns** - don't invent new patterns without updating
   docs
3. **Update this document** when introducing new patterns or approaches
4. **Maintain consistency** - if documented approach conflicts with code, flag
   it
5. **Ask clarifying questions** if documented guidance is unclear

**Role-Specific Guidance:**

- **Code Reviewers**: Focus on Patterns section and change compatibility checks
- **Feature Developers**: Focus on Best Practices, Pitfalls, and commit pairing
  (docs + code)
- **Architects**: Focus on Design, Requirements, and system compatibility

**When updating this document:**

1. Preserve existing structure and formatting
2. Add examples for new patterns
3. Update best practices based on learnings
4. Keep version history accurate
5. Commit documentation with related code changes

---

**END OF TEMPLATE**

**Usage Notes:**

- Replace all [bracketed placeholders] with actual content
- Remove sections not applicable to your specific document type
- Add sections as needed for comprehensive coverage
- Use concrete examples from the actual codebase
- Keep examples up-to-date as code evolves
- Include file references with line numbers for traceability

**For Non-Code or Polyglot Projects:**

- Replace "Technology Stack" and "Key Files" sections with appropriate headings:
  - **Infrastructure docs**: "Technology Stack" → "Platform Components" (list
    services, hosting, IaC tools); "Key Files" → "Configuration Locations"
    (point to terraform/, k8s/, .env files, CI/CD configs)
  - **Multi-language repos**: "Technology Stack" → Group by language/service
    with main entry points and build commands; "Key Files" → Integration points
    and shared libraries (e.g., protobuf definitions, API contracts, shared
    utilities)
  - **Non-technical docs**: "Technology Stack" → "Stakeholders and Tools"
    (decision-making tools, collaboration platforms); "Key Files" → "Core
    Documents" (RACI matrix, OKRs, decision logs, strategy docs)

**Path Customization:**

- Internal reference paths (e.g., `./ARCHITECTURE.md`, `../ROADMAP.md`) are
  examples
- Adjust paths to match your actual project structure
- Verify all links work before committing

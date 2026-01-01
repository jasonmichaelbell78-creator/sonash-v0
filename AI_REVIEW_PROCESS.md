# 🤖 AI Code Review Process

**Document Version:** 2.1
**Created:** 2025-12-31
**Last Updated:** 2026-01-01

## 📋 Purpose

This document defines the standardized process for triaging, addressing, and documenting **AI code review suggestions** from automated review tools. AI reviews occur multiple times daily, so having a consistent workflow ensures efficient handling and prevents suggestion fatigue.

**Supported AI Review Tools:**
- **CodeRabbit** 🐰 - Primary AI code reviewer
- **Qodo (formerly Codium AI)** - Secondary AI code reviewer
- **Future tools** - Process applies to any AI-based code review system

**Note**: While this document originally focused on CodeRabbit, the process is tool-agnostic and applies to all AI review systems.

---

## 🎯 Process Overview

```
AI Review Received
    ↓
Categorize Suggestions
    ↓
Triage (Accept/Defer/Reject)
    ↓
Address Accepted Items
    ↓
Document Decisions
    ↓
Commit with Explanation
```

---

## 📊 Suggestion Categories

### 🔴 **Critical** (Address Immediately)
- **Security vulnerabilities** (SQL injection, XSS, auth bypass)
- **Data loss risks** (missing validation, unsafe operations)
- **Breaking changes** (API contracts broken, dependencies incompatible)
- **Blocking issues** (prevents merge, breaks CI/CD)

**Action:** Fix immediately, commit separately with clear explanation.

---

### 🟠 **Major** (Address Before Merge)
- **Significant bugs** (logic errors, race conditions)
- **Performance issues** (N+1 queries, memory leaks)
- **Missing required sections** (docs missing AI instructions, acceptance criteria)
- **Effort estimate mismatches** (task breakdown doesn't match phase total)
- **Missing validation** (no error handling, no input checks)

**Action:** Address in current PR or create follow-up issue if complex.

---

### 🟡 **Minor** (Address or Defer with Reason)
- **Code style** (hyphenation, formatting)
- **Naming conventions** (unclear variable names)
- **Missing tests** (for non-critical paths)
- **Documentation improvements** (clarity, examples)
- **Library recommendations** (use remark instead of regex)

**Action:** Fix if quick (<15 min), otherwise defer with documented reason.

---

### 🔵 **Trivial** (Optional)
- **Typos** (non-user-facing)
- **Whitespace** (formatting-only)
- **Comment clarity** (internal docs)

**Action:** Fix if convenient, otherwise skip.

---

## ✅ Triage Decision Matrix

| Category | Accept? | Defer? | Reject? |
|----------|---------|--------|---------|
| **Critical** | ✅ Always | ❌ Never | ❌ Never |
| **Major** | ✅ Usually | 🟡 If complex | 🟡 If out-of-scope |
| **Minor** | 🟡 If quick | ✅ Usually | 🟡 If style preference |
| **Trivial** | 🟡 If convenient | ✅ Usually | ✅ If not valuable |

---

## 📝 Documentation Template

After processing AI review suggestions, document decisions using this template:

### For PR Comments:

```markdown
## AI Review Summary

**Total Suggestions:** X
**Addressed:** Y
**Deferred:** Z
**Rejected:** W

### ✅ Addressed (Y items)

1. **[Major] Phase 1 effort estimate mismatch**
   - **Issue:** Task breakdown totals 12 hours but header says 6-8 hours
   - **Fix:** Updated Phase 1 estimate to 10-12 hours
   - **Files:** DOCUMENTATION_STANDARDIZATION_PLAN.md:453

2. **[Minor] Hyphenation: "Rate limiting" → "Rate-limiting"**
   - **Issue:** Compound adjective should be hyphenated
   - **Fix:** Updated in 2 locations (Tasks 1.5.2, 3.6)
   - **Files:** DOCUMENTATION_STANDARDIZATION_PLAN.md:870,1283

### 🔄 Deferred (Z items)

1. **[Minor] Node.js implementation: Use markdown parser libraries**
   - **Issue:** Suggested using remark/unified instead of regex for parsing
   - **Reason:** Implementation detail for Phase 2; added as implementation note in specs
   - **Follow-up:** Will be addressed during Task 2.1 implementation
   - **Files:** None (noted in script specifications)

### ❌ Rejected (W items)

1. **[Major] Remove 100% blocking language**
   - **Issue:** CodeRabbit suggested phasing the blocker (Phase 1 only)
   - **Reason:** User explicitly requires 100% blocking ("i want this to stay")
   - **Decision:** Keeping hard blocker as designed
   - **Files:** None
```

---

## 🔄 Workflow Integration

### 1. **Immediate Review** (Within 1 hour of AI review comment)
- Read all suggestions
- Categorize using matrix above
- Flag any **Critical** items for immediate action

### 2. **Triage Session** (Before next commit)
- Group suggestions by file/area
- Decide: Accept, Defer, or Reject each
- Document reasons for Defer/Reject

### 3. **Implementation** (Same PR or follow-up)
- Address all **Critical** and **Major** items
- Fix **Minor** items if quick (<15 min total)
- Skip **Trivial** unless already editing nearby code

### 4. **Documentation** (In commit message or PR comment)
- Use template above
- Link to specific suggestions
- Explain deferred/rejected items

### 5. **Commit Strategy**
- **Separate commit** for AI review fixes (easier review)
- **Clear message**: "docs: Address AI review feedback" or "fix: Address CodeRabbit/Qodo feedback"
- **Body**: Include summary or link to PR comment

### 6. **Learning Capture** ⚠️ **MANDATORY - Do NOT skip**
- **After EVERY review** (regardless of size), extract learnings following "Learning from Reviews" section below
- **Add entry to Lessons Learned Log** in this document
- **Identify patterns** (3+ suggestions about same issue = pattern)
- **Document root causes** and prevention strategies
- **Commit learning entry** separately: "docs: Add Review #X to Lessons Learned Log"

**When to skip:** Never. Even if no clear patterns, document "No significant patterns identified" with review summary.

---

## 📋 Common Rejection Reasons

Use these standard reasons when rejecting AI review suggestions:

| Reason | When to Use | Example |
|--------|-------------|---------|
| **User requirement** | User explicitly requested this approach | "User requires 100% blocking per conversation" |
| **Out of scope** | Suggestion extends beyond PR scope | "Performance optimization is Phase 3 work" |
| **Style preference** | Subjective style choice | "Project uses this naming convention" |
| **Implementation detail** | Will be addressed during implementation | "Script implementation will determine best library" |
| **Already planned** | Captured in backlog/plan | "Tracked in POST_PHASE_8_BACKLOG.md" |
| **Not applicable** | Suggestion doesn't apply to this context | "This isn't production code, it's a template example" |

---

## 🎯 Quality Standards

### For Accepted Suggestions:
- ✅ Fix completely (don't half-implement)
- ✅ Test the fix (verify it works)
- ✅ Update related docs (if needed)
- ✅ Commit with clear explanation

### For Deferred Suggestions:
- ✅ Document why deferred
- ✅ Create follow-up issue if needed
- ✅ Reference in plan (if architectural)
- ✅ Set clear timeline (Phase X, or specific date)

### For Rejected Suggestions:
- ✅ Explain rejection clearly
- ✅ Reference user requirement or design decision
- ✅ Confirm rejection is intentional (not overlooked)

---

## 📊 Metrics to Track

Optional but helpful for improving process:

- **Suggestion acceptance rate** (by category)
- **Time to triage** (CodeRabbit comment → decision)
- **Time to resolve** (decision → fix committed)
- **Deferred item resolution rate** (follow-up completion %)

---

## 🤖 AI Instructions

When processing AI review suggestions (CodeRabbit, Qodo, etc.):

1. **Read ALL suggestions first** (don't fix incrementally)
2. **Categorize using the matrix** (Critical/Major/Minor/Trivial)
3. **Consult user for Major rejections** (confirm intentional)
4. **Group related fixes** (e.g., all hyphenation fixes in one commit)
5. **Use documentation template** (for PR comment or commit body)
6. **Never silently ignore Critical items** (always address or explicitly reject with reason)
7. **⚠️ MANDATORY: Capture learnings** (add entry to Lessons Learned Log below after EVERY review - no exceptions)

---

## 📚 Learning from Reviews

### Purpose

Each AI review is an opportunity to improve future work. Systematically capturing learnings prevents recurring issues and improves documentation quality over time.

### When to Extract Learnings

**After EVERY AI review** (regardless of size or tool), ask:
1. **Are there patterns?** (3+ suggestions about the same issue)
2. **Did we miss something obvious?** (self-compliance, metadata, formatting)
3. **Can we prevent this?** (checklist, protocol, automation)

### How to Extract Learnings

**Step 1: Identify Patterns**

Group suggestions by root cause, not symptom:

```markdown
Example:
- "Missing Created date" (3 files)
- "Missing Overall Completion" (2 files)
- "Status format inconsistent" (1 file)

Root Cause: No pre-commit metadata validation
Pattern: Tier 1 documents not following own standards
```

**Step 2: Classify by Prevention Type**

| Type | Description | Solution |
|------|-------------|----------|
| **Self-Compliance** | Standards doc doesn't follow its own rules | Add self-check to pre-commit checklist |
| **Synchronization** | Related docs out of sync | Add sync protocol to standards |
| **Validation** | Missing checks before commit | Add to pre-commit checklist or automation |
| **Clarity** | Template placeholders unclear | Add concrete examples, improve guidance |
| **Process Gap** | No procedure for specific scenario | Document procedure in standards |

**Step 3: Document the Learning**

Use this template in the "Lessons Learned Log" section below:

```markdown
**Review Date:** YYYY-MM-DD
**PR:** #XXX or branch name
**Suggestions:** Total count (Critical/Major/Minor/Trivial breakdown)

**Patterns Identified:**
1. [Pattern name]: [Description] ([X occurrences])
   - Root cause: [Why this happened]
   - Prevention: [What to add/change]

**Process Improvements:**
- ✅ [Improvement 1]: Added to [document/section]
- ✅ [Improvement 2]: Updated [checklist/protocol]
- ⏳ [Improvement 3]: Deferred to [Phase X] - [reason]

**Expected Impact:** [X%] reduction in [category] issues
```

**Step 4: Update Documentation**

Based on learnings, update one or more of:
- **DOCUMENTATION_STANDARDS.md**: Add checklists, protocols, or clarifications
- **This document (AI_REVIEW_PROCESS.md)**: Add to Lessons Learned Log and update categories/examples
- **Templates**: Improve placeholder clarity, add examples
- **Phase plans**: Add automation or validation tasks

### Lessons Learned Log

**📌 NOTE**: This log accumulates learnings over time. Each review adds an entry.

---

#### Review #1: Phase 1 Documentation Templates (2026-01-01)
**PR:** `claude/update-session-docs-uRgUs` (Phase 1 completion)
**Suggestions:** 14 total (2 Critical, 2 Major, 10 Minor/Nitpick)

**Patterns Identified:**
1. **Self-Compliance Failure** (1 occurrence - high impact)
   - Root cause: DOCUMENTATION_STANDARDS.md created without validating against its own Tier 1 requirements
   - Prevention: Added "Document follows its own standards" to Pre-Commit Validation Checklist

2. **Status Synchronization Gap** (2 occurrences)
   - Root cause: Updated PLAN document but didn't sync SESSION_CONTEXT.md (62% → 100% mismatch)
   - Prevention: Added Status Synchronization Protocol matrix to DOCUMENTATION_STANDARDS.md

3. **Template Placeholder Ambiguity** (5 occurrences)
   - Root cause: Placeholders like `[Step 1]`, `[Brief description]` too generic
   - Prevention: Added concrete examples and clarifying text to all templates

4. **Redundant Wording** (3 occurrences)
   - Root cause: No static analysis run during creation
   - Prevention: Added "Run static analysis" to Pre-Commit Validation Checklist

5. **Missing Cross-Reference Validation** (1 occurrence - potential)
   - Root cause: No systematic check for broken links
   - Prevention: Added Cross-Reference Validation protocol with 4-step process

6. **Metadata Inconsistency** (2 occurrences)
   - Root cause: No tier-specific metadata checklists
   - Prevention: Added tier-specific checklists to Pre-Commit Validation section

**Process Improvements:**
- ✅ Added Quality Protocols section to DOCUMENTATION_STANDARDS.md v1.1:
  - Pre-Commit Validation Checklist (tier-specific)
  - Status Synchronization Protocol (cross-doc updates)
  - Cross-Reference Validation (link verification)
  - Template Testing Requirement (example docs)
- ✅ Added Lessons Learned section to DOCUMENTATION_STANDARDIZATION_PLAN.md v1.2
- ✅ Improved template clarity (8 fixes across 3 templates)
- ⏳ Pre-commit hooks: Deferred to Phase 2 (automation scripts)
- ⏳ Cross-reference validator script: Deferred to Phase 2 (extend check-docs-light.js)

**Expected Impact:** 70-80% reduction in similar documentation issues

**Key Insight:** Standards documents MUST validate against themselves before commit. Self-compliance is non-negotiable.

---

#### Review #2: File Rename & Cross-Reference Updates (2026-01-01)
**PR:** `claude/update-session-docs-uRgUs` (Tool-agnostic rename v2.0)
**Suggestions:** 17 total from 2 tools (CodeRabbit: 14, Qodo: 6, overlapping: 3)
**Tools:** CodeRabbit 🐰 + Qodo (first multi-tool review)

**Patterns Identified:**
1. **Tool-Specific Language Persistence** (2 occurrences)
   - Root cause: After renaming CODERABBIT_REVIEW_PROCESS.md → AI_REVIEW_PROCESS.md, only updated filename references, not descriptive text ("standardized CodeRabbit workflow")
   - Prevention: When renaming files, grep for old terminology in descriptions/comments, not just filenames
   - Files: AI_HANDOFF.md:61, ROADMAP_LOG.md:21

2. **Incomplete Link Format Coverage** (1 occurrence)
   - Root cause: Cross-Reference Validation protocol only listed inline links `[text](path)`, missing reference-style, images, autolinks
   - Prevention: Expanded protocol to cover all Markdown link formats (reference-style, images, autolinks, external URLs)
   - Files: DOCUMENTATION_STANDARDS.md:558-570

3. **Missing Forward-Reference Annotations** (1 occurrence)
   - Root cause: AI_REVIEW_PROCESS.md referenced PR_WORKFLOW_CHECKLIST.md (Phase 4) without noting it doesn't exist yet
   - Prevention: Add phase annotations `(Phase X)` to forward references in Related Documents sections
   - Files: AI_REVIEW_PROCESS.md:364

4. **Template Contradictions** (2 occurrences)
   - Root cause: CANONICAL template listed "Evidence of Completion" in omit list but "What Was Accomplished" in core sections; referenced "Next Steps" without explicit section
   - Prevention: Template Testing Requirement exists but wasn't executed for Phase 1 templates (deferred to Phase 3)
   - Files: docs/templates/CANONICAL_DOC_TEMPLATE.md:423-428

5. **Broken Shell Commands in Examples** (1 occurrence)
   - Root cause: Quick-start command `git clone <repo> && npm install` missing `cd <repo-dir>` step
   - Prevention: Test all shell command examples before commit; add to Pre-Commit Validation for code-containing docs
   - Files: docs/templates/FOUNDATION_DOC_TEMPLATE.md:39

6. **Generic Examples Lacking Concrete Mappings** (1 occurrence)
   - Root cause: Non-Code/Polyglot adaptation bullets too abstract without showing how to map sections
   - Prevention: Add concrete mapping examples to all "how to adapt" guidance (e.g., "Technology Stack → Platform Components: list services, IaC paths")
   - Files: docs/templates/FOUNDATION_DOC_TEMPLATE.md:352-354

**Process Improvements:**
- ✅ Enhanced Cross-Reference Validation (DOCUMENTATION_STANDARDS.md v1.1):
  - Added all Markdown link formats (reference-style, images, autolinks)
  - Added internal/external URL distinction
  - Added GitHub anchor generation rules
- ✅ Fixed Status Synchronization Protocol table (removed event entry, merged into doc row)
- ✅ Fixed 4 template issues (contradictions, broken commands, concrete examples)
- ✅ Added forward-reference phase annotations pattern
- ✅ Updated 4 tool-specific descriptions to tool-agnostic language
- ⏳ Automated framework complexity: Deferred (Phase 2 already addresses with pre-commit hooks, validators)
- ⏳ Library version specificity: Deferred (implementation detail for Phase 2 script development)

**Expected Impact:** 60-70% reduction in file rename inconsistencies, 40-50% reduction in template usability issues

**Key Insight:** File renames require two passes: (1) update references/links, (2) grep for old terminology in descriptions/comments/documentation.

---

### Continuous Improvement Triggers

**When to update this process document:**
- ✅ New pattern emerges (3+ reviews show same root cause)
- ✅ Rejection reason not covered by existing categories
- ✅ Process inefficiency discovered (e.g., triage taking >30 min)
- ✅ New AI review tool capability added (e.g., security scanning, auto-fix)
- ✅ New AI review tool adopted (add to "Supported AI Review Tools" section)

**Version update rules:**
- **Minor version (1.X)**: Add lesson to log, update examples, clarify existing sections
- **Major version (2.0)**: Restructure process, change workflow, add/remove categories

---

## 🔗 Related Documents

- **PR_WORKFLOW_CHECKLIST.md** (Phase 4) - Pre-PR checklist includes AI review step
- **DOCUMENTATION_STANDARDS.md** (Phase 1) - Standards for doc structure
- **GitHub Actions workflow: docs-lint.yml** (Phase 2) - Automated linting that complements AI reviews
- **MULTI_AI_REVIEW_COORDINATOR.md** (Phase 1.5) - Coordinates multiple AI review tools

---

## 📝 Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 2.1 | 2026-01-01 | Made learning capture MANDATORY: Added step 6 to Workflow Integration, added step 7 to AI Instructions, added Review #2 to Lessons Learned Log. Enforces systematic learning after EVERY review with no exceptions. | Claude Code |
| 2.0 | 2026-01-01 | Renamed from CODERABBIT_REVIEW_PROCESS.md to AI_REVIEW_PROCESS.md. Made process tool-agnostic to support CodeRabbit, Qodo, and future AI review tools. Updated all references from "CodeRabbit" to generic "AI review" terminology. | Claude Code |
| 1.1 | 2026-01-01 | Added "Learning from Reviews" section with systematic learning capture process, lessons learned log (Review #1), and continuous improvement triggers | Claude Code |
| 1.0 | 2025-12-31 | Initial process definition based on Dec 31 CodeRabbit review | Claude Code |

---

## 🚀 Next Steps

1. **Integrate into PR_WORKFLOW_CHECKLIST.md** (Phase 4)
2. **Add AI review step** to pre-merge checklist
3. **Template PR comment** in GitHub pull_request_template.md
4. **Track metrics** (optional: add to MULTI_AI_REVIEW_COORDINATOR.md)
5. **Configure Qodo** alongside CodeRabbit for comprehensive reviews

---

**END OF AI_REVIEW_PROCESS.md**

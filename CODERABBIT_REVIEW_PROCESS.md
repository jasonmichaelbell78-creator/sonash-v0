# 🐰 CodeRabbit Review Process

**Document Version:** 1.0
**Created:** 2025-12-31
**Last Updated:** 2025-12-31

## 📋 Purpose

This document defines the standardized process for triaging, addressing, and documenting CodeRabbit AI review suggestions. CodeRabbit reviews occur multiple times daily, so having a consistent workflow ensures efficient handling and prevents suggestion fatigue.

---

## 🎯 Process Overview

```
CodeRabbit Review
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

After processing CodeRabbit suggestions, document decisions using this template:

### For PR Comments:

```markdown
## CodeRabbit Review Summary

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

### 1. **Immediate Review** (Within 1 hour of CodeRabbit comment)
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
- **Separate commit** for CodeRabbit fixes (easier review)
- **Clear message**: "docs: Address CodeRabbit feedback"
- **Body**: Include summary or link to PR comment

---

## 📋 Common Rejection Reasons

Use these standard reasons when rejecting CodeRabbit suggestions:

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

When processing CodeRabbit suggestions:

1. **Read ALL suggestions first** (don't fix incrementally)
2. **Categorize using the matrix** (Critical/Major/Minor/Trivial)
3. **Consult user for Major rejections** (confirm intentional)
4. **Group related fixes** (e.g., all hyphenation fixes in one commit)
5. **Use documentation template** (for PR comment or commit body)
6. **Never silently ignore Critical items** (always address or explicitly reject with reason)

---

## 🔗 Related Documents

- **PR_WORKFLOW_CHECKLIST.md** - Pre-PR checklist includes CodeRabbit review
- **DOCUMENTATION_STANDARDS.md** (Phase 1) - Standards for doc structure
- **.github/workflows/docs-lint.yml** (Phase 2) - Automated linting that complements CodeRabbit

---

## 📝 Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-12-31 | Initial process definition based on Dec 31 CodeRabbit review | Claude Code |

---

## 🚀 Next Steps

1. **Integrate into PR_WORKFLOW_CHECKLIST.md** (Phase 1 or 4)
2. **Add CodeRabbit review step** to pre-merge checklist
3. **Template PR comment** in .github/pull_request_template.md
4. **Track metrics** (optional: add to MULTI_AI_REVIEW_COORDINATOR.md)

---

**END OF CODERABBIT_REVIEW_PROCESS.md**

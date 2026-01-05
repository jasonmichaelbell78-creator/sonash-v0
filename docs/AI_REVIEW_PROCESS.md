# 🤖 AI Code Review Process

**Document Version:** 3.0
**Created:** 2025-12-31
**Last Updated:** 2026-01-02

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
| **Already planned** | Captured in backlog/plan | "Tracked in AUDIT_FINDINGS_BACKLOG.md" |
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

**📌 Full review log moved to [AI_REVIEW_LEARNINGS_LOG.md](./AI_REVIEW_LEARNINGS_LOG.md)**

This keeps the process document lean. The learnings log contains:
- 13 review entries (Reviews #1-13)
- Pattern analysis and resolutions
- Script robustness patterns
- Full audit trail

**Quick Reference - Key Patterns (distilled in [claude.md](../claude.md) section 4):**
- Bash exit codes: Use `if ! OUT=$(cmd); then` not `OUT=$(cmd); if [ $? -ne 0 ]`
- npm: Use `npm ci` not `npm install` in automation
- Security: Validate paths within repo, sanitize shell inputs
- Dependencies: Ask "does project actually use X?" before adding

---

### 🚨 Learning Capture Enforcement Mechanism

**Problem:** Despite "MANDATORY" labeling, learning capture was skipped in Reviews #5 and #10. Self-enforcement and "do it after" approaches are unreliable. The AI gets into "fix mode" and forgets the meta-step.

**Root Cause:** Learning entry was treated as a POST-fix step. By the time fixes are done, the AI has moved on mentally.

**Solution - LEARNING ENTRY FIRST (Enforced via TodoWrite):**

```
⚠️ CRITICAL WORKFLOW CHANGE - EFFECTIVE IMMEDIATELY ⚠️

When AI review feedback arrives (CodeRabbit, Qodo, etc.):

1. FIRST: Create TodoWrite item "Add Review #N to Lessons Learned Log" as FIRST task
2. FIRST: Create the Review #N stub entry in AI_REVIEW_PROCESS.md (date, PR, tools)
3. THEN: Address the actual review feedback
4. THEN: Fill in patterns/improvements as you work
5. LAST: Commit everything together (fixes + learning entry)

The learning entry must be STARTED before any fixes are made.
This ensures it's not forgotten in the flow of fixing issues.
```

**TodoWrite Template for AI Reviews:**
```
todos:
- content: "Add Review #N to Lessons Learned Log"
  status: "in_progress"  # START with this
  activeForm: "Adding Review #N to Lessons Learned Log"
- content: "Fix [issue 1]"
  status: "pending"
- content: "Fix [issue 2]"
  status: "pending"
```

**Why This Works:**
- Learning entry is the FIRST todo, not the last
- Entry stub is created BEFORE fixes start
- Details are filled in AS work progresses
- Cannot forget because it's tracked in TodoWrite
- Commit includes both fixes AND learning together

**Verification Before Push:**
```bash
# Run this before every push that addresses AI review feedback:
grep -c "#### Review #" AI_REVIEW_PROCESS.md
# Compare to previous count - must have increased
```

**Failure Recovery:**
If learning entry was missed (like Reviews #5, #10):
1. Add entry retroactively with all available details
2. Mark as "Retroactively documented" in the entry
3. Note the failure in the entry's patterns section
4. This meta-pattern of missing entries is itself a learning

**Phase 4 Enforcement Vision** *(not yet implemented)*:

When PR_WORKFLOW_CHECKLIST.md is created in Phase 4, this enforcement mechanism will be automated:

| Mechanism | Description | Acceptance Criteria |
|-----------|-------------|---------------------|
| Pre-commit hook | Validates learning entry exists when commit message contains "review" or "CodeRabbit" | Hook blocks commit with clear error message |
| GitHub Actions check | Scans for new "Review #N" entry in AI_REVIEW_PROCESS.md | Merge blocked if entry missing |
| Error remediation | Provides specific instructions on how to add missing entry | Message includes template and location |
| Compliance tracking | Logs learning capture rate in MULTI_AI_REVIEW_COORDINATOR.md | 100% capture rate across all PRs |

*Until Phase 4, manual enforcement via the "Immediate Enforcement" checklist above is required.*

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
| 3.0 | 2026-01-02 | **MAJOR**: Split document - moved Reviews #1-13 to AI_REVIEW_LEARNINGS_LOG.md. Added distilled patterns to claude.md section 4. Process doc now lean (~450 lines vs ~1100). | Claude Code |
| 2.10 | 2026-01-02 | Added Review #13 (Phase 2 automation scripts). Identified 10 patterns including CRITICAL security issues: command injection vulnerability, arbitrary file deletion, exit code capture bugs. Added security-first mindset for internal scripts. | Claude Code |
| 2.9 | 2026-01-01 | Added Review #12 "The Jest Incident" - CRITICAL lesson on understanding WHY before fixing. Documents cascade failure caused by adding unnecessary dependency. Introduces mandatory questions before any package.json/lockfile changes. | Claude Code |
| 2.8 | 2026-01-01 | Added Review #11 (lockfile sync and workflow configuration fixes). | Claude Code |
| 2.7 | 2026-01-01 | Added Review #10 (session hook CI fixes). **CRITICAL**: Rewrote enforcement mechanism to "LEARNING ENTRY FIRST" approach - create entry BEFORE fixing issues, not after. Previous "do it after" approach failed repeatedly. | Claude Code |
| 2.6 | 2026-01-01 | Added Review #9 (documentation clarity fixes). Fixed conflicting HEAD~N patterns with correction annotation. Added Phase 4 Enforcement Vision. Clarified retrospective context and version history phrasing. | Claude Code |
| 2.5 | 2026-01-01 | Fixed "Enforcement Mechanism" section reference to use correct name "Learning Capture Enforcement Mechanism". Added Review #8 (CI fix, reference corrections). | Claude Code |
| 2.4 | 2026-01-01 | Added Review #7 (off-by-one fix). Updated Script Robustness Patterns with correct HEAD~N boundary handling. | Claude Code |
| 2.3 | 2026-01-01 | Retroactively documented Reviews #5 and #6 to complete learning capture audit. Added Learning Capture Enforcement Mechanism section. Identified meta-pattern: self-enforcement unreliable without hard checkpoints. | Claude Code |
| 2.2 | 2026-01-01 | Added Review #4 (Phase 1.5 review) to Lessons Learned Log. Documented script robustness patterns as new procedure standard. Identified process complexity as review consideration. | Claude Code |
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

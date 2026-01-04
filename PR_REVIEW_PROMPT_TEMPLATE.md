# PR Review Prompt Template

**Document Version:** 1.0
**Created:** 2026-01-04
**Purpose:** Reproducible prompt for processing AI code review feedback

---

## Overview

This document contains the stock prompt template for processing AI code review feedback (CodeRabbit, Qodo, etc.). Use this template to ensure thorough, standardized review processing.

**Also available as:**
- Slash command: `/pr-review`
- Skill: `skill: "pr-review-processor"`

---

## How to Use

### Option 1: Slash Command (Recommended)
```
/pr-review

[paste your review feedback here]
```

### Option 2: Skill Invocation
```
skill: "pr-review-processor"

[paste your review feedback here]
```

### Option 3: Manual (Copy Below)
Copy the entire prompt template from the section below, paste into Claude Code, then append your review feedback.

---

## The Prompt Template

Copy everything between the `--- START ---` and `--- END ---` markers:

```
--- START ---
```

**PROCESS AI CODE REVIEW FEEDBACK**

I am pasting AI code review feedback below. Process it using the following protocol:

---

**PHASE 1: CONTEXT LOADING**
1. Read `AI_REVIEW_PROCESS.md` for categorization matrix
2. Read `AI_REVIEW_LEARNINGS_LOG.md` (first 200 lines) for recent patterns and next review number
3. Reference `claude.md` Section 4 for anti-patterns to avoid

---

**PHASE 2: MULTI-PASS PARSING**
For this review feedback, perform thorough extraction:

- **Pass 1**: Extract all issue headers, file paths, and line numbers
- **Pass 2**: Extract full details, code snippets, and suggested fixes for each
- **Pass 3**: Re-scan to verify nothing was missed

Create a numbered master list of ALL suggestions found.

Announce: "I identified **N total suggestions**. Proceeding with categorization."

---

**PHASE 3: CATEGORIZATION**
Categorize EVERY suggestion:
- **CRITICAL**: Security, data loss, breaking changes → Fix immediately
- **MAJOR**: Bugs, performance, missing validation → Fix before proceeding
- **MINOR**: Style, naming, tests, docs → **FIX** (do not defer)
- **TRIVIAL**: Typos, whitespace, comments → **FIX** (do not skip)

Output a categorized summary with counts for each level.

---

**PHASE 4: TODO TRACKING**
Use **TodoWrite** to create a trackable list. The FIRST item must be:
```
"Add Review #N stub to AI_REVIEW_LEARNINGS_LOG.md" - status: in_progress
```
Include ALL issues as todos, even trivial ones.

---

**PHASE 5: LEARNING ENTRY STUB**
BEFORE fixing any issues, create a stub entry in `AI_REVIEW_LEARNINGS_LOG.md`:
```markdown
#### Review #N: [Brief Description] (YYYY-MM-DD)

**Source:** [CodeRabbit PR | Qodo Compliance | etc.]
**Branch:** [current branch]
**Suggestions:** X total (Critical: X, Major: X, Minor: X, Trivial: X)

**Patterns Identified:**
[To be filled during fixes]

**Resolution:**
[To be filled after fixes]
```

---

**PHASE 6: INVOKE SPECIALIST AGENTS**
Based on issue types, invoke appropriate agents via Task tool:
- Security issues → `security-auditor` agent
- Test gaps → `test-engineer` agent
- Performance → `performance-engineer` agent
- Documentation → `technical-writer` agent
- Complex bugs → `debugger` agent

Invoke agents in parallel when issues are independent.

---

**PHASE 7: FIX ALL ISSUES**
Process in priority order:
1. CRITICAL (separate commits if major)
2. MAJOR (batch by area)
3. MINOR (batch by file)
4. TRIVIAL (batch all)

For each fix:
- Read the file first (never edit blindly)
- Apply the fix
- Mark todo as completed

**IMPORTANT**: Fix trivial items too. Do not skip or defer without explicit user permission.

---

**PHASE 8: VERIFICATION**
After all fixes:
- **Pass 1**: Re-read each modified file
- **Pass 2**: Run `npm run lint` and `npm run test` if available
- **Pass 3**: Cross-reference original list - confirm EVERY item is addressed
- **Pass 4**: Check for introduced anti-patterns

---

**PHASE 9: COMPLETE LEARNING ENTRY**
Fill in the stub entry with:
- Patterns identified (root cause + prevention)
- Resolution counts (fixed/deferred/rejected)
- Key learnings

Update consolidation counter if nearing threshold.

---

**PHASE 10: FINAL OUTPUT**
Provide structured summary:
```
## PR Review Processing Complete

### Statistics
- Total: N suggestions
- Fixed: N (breakdown by severity)
- Deferred: N (with justifications)
- Rejected: N (with justifications)

### Files Modified
[list with line references]

### Agents Invoked
[list agents and what they handled]

### Learning Entry
Review #N added to AI_REVIEW_LEARNINGS_LOG.md

### Verification Status
- [ ] All suggestions cross-referenced
- [ ] Linter passing
- [ ] Tests passing
- [ ] Learning entry complete

### Ready for Commit
[suggested commit message]
```

---

**RULES (NON-NEGOTIABLE)**
1. NEVER skip trivial items without explicit user permission
2. ALWAYS create learning entry FIRST (before any fixes)
3. ALWAYS read files before editing
4. ALWAYS use TodoWrite to track progress
5. ALWAYS verify with multiple passes
6. ALWAYS invoke specialist agents when issue matches their domain
7. NEVER silently ignore any suggestion - document every decision

---

**REVIEW FEEDBACK TO PROCESS:**

[PASTE YOUR REVIEW FEEDBACK HERE]

```
--- END ---
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-04 | Initial template creation |

---

## Related Documents

- `AI_REVIEW_PROCESS.md` - Full process documentation
- `AI_REVIEW_LEARNINGS_LOG.md` - Learning audit trail
- `claude.md` - Distilled patterns and project context
- `.claude/commands/pr-review.md` - Slash command implementation
- `.claude/skills/pr-review-processor/SKILL.md` - Skill implementation

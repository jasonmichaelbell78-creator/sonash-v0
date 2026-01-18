---
description: PR Code Review Processor
---

# PR Code Review Processor

You are about to process AI code review feedback. This is a **standardized,
thorough review protocol** that ensures every issue is caught, addressed, and
documented.

## Core Principles

1. **Fix Everything** - Including trivial items
2. **Learning First** - Create log entry before fixes
3. **Multi-Pass Verification** - Never miss an issue
4. **Agent Augmentation** - Invoke specialists when needed
5. **Full Documentation** - Every decision tracked

## Protocol Overview

```
AUTO-FETCH (Get PR feedback if not provided)
    ↓
STEP 0: CONTEXT (Load tiered docs)
    ↓
STEP 1: PARSE (Multi-pass extraction + validate claims)
    ↓
STEP 2: CATEGORIZE (Critical/Major/Minor/Trivial)
    ↓
STEP 3: PLAN (TodoWrite - learning entry FIRST)
    ↓
STEP 4: AGENTS (Invoke specialists per issue type)
    ↓
STEP 5: FIX (Priority order, verify each)
    ↓
STEP 6: DOCUMENT (Deferred/rejected decisions)
    ↓
STEP 7: LEARNING (Complete entry - MANDATORY)
    ↓
STEP 8: SUMMARY (Final verification status)
    ↓
STEP 9: COMMIT (Following project conventions)
```

---

## AUTO-FETCH: Get PR Feedback (Optional)

**Only triggered when user says "fetch"** (e.g., `/pr-review fetch` or "go fetch
it").

If triggered, fetch review data from the current PR:

```bash
# 1. Get current branch and find associated PR
branch=$(git branch --show-current)
pr_number=$(gh pr list --head "$branch" --json number --jq '.[0].number' 2>/dev/null)

# 2. If PR exists, fetch reviews and comments
if [ -n "$pr_number" ]; then
  echo "Found PR #$pr_number"

  # Get PR checks status (SonarCloud, etc.)
  gh pr checks "$pr_number"

  # Get review comments
  gh pr view "$pr_number" --comments

  # Get review requests and status
  gh api "repos/{owner}/{repo}/pulls/$pr_number/reviews" --jq '.[] | {user: .user.login, state: .state, body: .body}'
fi
```

**Behavior:**

- **Default**: Wait for user to paste feedback
- **If user says "fetch"**: Auto-fetch from current PR, then proceed
- **If feedback already in message**: Skip fetch, process directly

---

## STEP 0: CONTEXT LOADING (Tiered Access)

Before processing, load context using the tiered model:

**Tier 1 (Always):**

1. **Read** `claude.md` (root) - Critical anti-patterns + progressive disclosure
   pointers

**Tier 2 (Quick Lookup):** 2. **Read** `docs/AI_REVIEW_LEARNINGS_LOG.md` (first
200 lines) - Quick Index + consolidation status

**Tier 3 (When Investigating):** 3. **Read** specific review entries only when
checking similar past issues 4. **Read** `docs/AI_REVIEW_PROCESS.md` only if
process clarification needed

**Tier 4 (Historical - rarely needed):** 5. **Read**
`docs/archive/REVIEWS_1-40.md` only for deep historical investigation

---

## STEP 1: INITIAL INTAKE & PARSING

### 1.1 Identify Review Source

Determine which tool generated this review:

- **CodeRabbit PR** - GitHub PR comments/suggestions
- **CodeRabbit CLI** - Local hook output
- **Qodo Compliance** - PR compliance and suggestions
- **Qodo PR** - PR code suggestions
- **Mixed** - Multiple sources combined

### 1.2 Extract ALL Suggestions

Parse the entire input systematically. For reviews >500 lines:

- **First pass**: Extract all issue headers/titles
- **Second pass**: Extract details for each issue
- **Third pass**: Verify no issues were missed

Create a numbered master list:

```
[1] <file>:<line> - <issue summary>
[2] <file>:<line> - <issue summary>
...
[N] <file>:<line> - <issue summary>
```

### 1.3 Announce Count

State: "I identified **N total suggestions** from this review. Proceeding with
categorization."

### 1.4 Validate Critical Claims (IMPORTANT)

> ⚠️ **AI reviewers can generate false positives** by inferring problems from
> current state without verifying historical context.

**BEFORE accepting "data loss", "missing content", or "missing files" claims:**

1. **Verify via git history** - Don't trust current state alone:

   ```bash
   N=41

   # Check if file/review ever existed (search common variants)
   git log --all --oneline --grep="Review #$N" --grep="Review $N" -- docs/

   # Optional: case-insensitive search if naming varies
   git log --all --oneline -i --grep="review #$N" --grep="review $N" -- docs/

   # Follow renames/moves when inspecting file history
   git log --all --follow -p -- path/to/file.ext | head -100
   ```

2. **Common false positives to watch for:**
   - **Range gap misinterpretation**: "Archive #42-60, active #61-82" → AI
     infers "#41 missing" without checking if #41 was ever created
   - **Numbering skips**: Review numbers or IDs may have intentional/accidental
     gaps
   - **File moves**: AI sees "file missing from location X" without checking if
     it moved to location Y

3. **If claim is FALSE POSITIVE:**
   - Mark as **REJECTED** in categorization
   - Document the verification in the review entry
   - Include pattern in learning entry (helps train future reviews)

**Example from Review #83:**

- Qodo flagged "Review #41 data loss" (Critical severity)
- Investigation: `git log --grep "#41"` showed Review #41 was NEVER created
- Reality: Numbering jumped #40→#42 (intentional/accidental skip)
- Result: REJECTED as false positive, documented as new pattern

**When in doubt**: Spend 2 minutes verifying via git history rather than wasting
hours fixing non-existent problems.

---

## STEP 2: CATEGORIZATION (Per AI_REVIEW_PROCESS.md)

Categorize EVERY suggestion using this matrix:

| Category     | Criteria                                                                     | Action Required                        |
| ------------ | ---------------------------------------------------------------------------- | -------------------------------------- |
| **CRITICAL** | Security vulnerabilities, data loss, breaking changes, blocking issues       | Fix IMMEDIATELY, separate commit       |
| **MAJOR**    | Significant bugs, performance issues, missing validation, logic errors       | Fix before proceeding                  |
| **MINOR**    | Code style, naming, missing tests, doc improvements, library recommendations | Fix (don't defer unless truly complex) |
| **TRIVIAL**  | Typos, whitespace, comment clarity, formatting                               | **FIX THESE TOO** - no skipping        |

### Output Format:

```
## Categorization Results

### CRITICAL (X items) - IMMEDIATE ACTION
- [1] <issue> - File: <path>

### MAJOR (X items) - MUST FIX
- [3] <issue> - File: <path>

### MINOR (X items) - WILL FIX
- [5] <issue> - File: <path>

### TRIVIAL (X items) - WILL FIX (not skipping)
- [8] <issue> - File: <path>
```

---

## STEP 3: CREATE TODO LIST

Use **TodoWrite** to create trackable items:

```
todos:
- content: "Add Review #N stub to AI_REVIEW_LEARNINGS_LOG.md"
  status: "in_progress"
  activeForm: "Adding Review #N stub to learnings log"
- content: "Fix CRITICAL: [issue description]"
  status: "pending"
  activeForm: "Fixing CRITICAL: [issue]"
- content: "Fix MAJOR: [issue description]"
  status: "pending"
  activeForm: "Fixing MAJOR: [issue]"
... (include ALL items, including TRIVIAL)
```

**CRITICAL RULE**: The learning log entry is ALWAYS the FIRST todo item.

---

## STEP 4: INVOKE SPECIALIZED AGENTS

Based on the issues identified, invoke appropriate agents:

| Issue Type               | Agent to Invoke                                   |
| ------------------------ | ------------------------------------------------- |
| Security vulnerabilities | `security-auditor` agent                          |
| Test coverage gaps       | `test-engineer` agent                             |
| Performance issues       | `performance-engineer` agent                      |
| Documentation issues     | `technical-writer` agent                          |
| Complex debugging        | `debugger` agent                                  |
| Architecture concerns    | `backend-architect` or `frontend-developer` agent |

**Invoke using Task tool** with the specific issues to address.

---

## STEP 5: ADDRESS ISSUES (In Priority Order)

### 5.1 Fix Order

1. **CRITICAL** - Each in separate commit if needed
2. **MAJOR** - Can batch related fixes
3. **MINOR** - Can batch by file
4. **TRIVIAL** - Batch all together

### 5.2 For Each Fix

- **Read** the file first (never edit without reading)
- **Understand** the context around the issue
- **Apply** the fix
- **Verify** the fix doesn't introduce new issues
- **Mark** todo as completed

### 5.3 Verification Passes

After all fixes:

- **Pass 1**: Re-read each modified file
- **Pass 2**: Run linter if available (`npm run lint`)
- **Pass 3**: Run tests if available (`npm run test`)
- **Pass 4**: Cross-reference original suggestions - confirm each is addressed

---

## STEP 6: DOCUMENT DECISIONS

For any items NOT directly fixed in code, document:

### Deferred Items (if any)

```
### Deferred (X items)
- [N] <issue>
  - **Reason**: <why deferred>
  - **Follow-up**: <where tracked>
  - **Timeline**: <when to address>
```

### Rejected Items (if any - should be rare)

```
### Rejected (X items)
- [N] <issue>
  - **Reason**: <specific justification>
  - **Reference**: <user requirement or design decision>
```

**NOTE**: For this protocol, lean heavily toward FIXING over deferring. Even
trivial items should be fixed.

---

## STEP 7: LEARNING CAPTURE (MANDATORY)

### 7.1 Determine Next Review Number

```bash
# Count reviews in both active log and archive (robust edge case handling)
active=0
if [ -f docs/AI_REVIEW_LEARNINGS_LOG.md ]; then
  active=$(grep -c "#### Review #" docs/AI_REVIEW_LEARNINGS_LOG.md || true)
  active=${active:-0}
fi

archived=0
if [ -f docs/archive/REVIEWS_1-40.md ]; then
  archived=$(grep -c "#### Review #" docs/archive/REVIEWS_1-40.md || true)
  archived=${archived:-0}
fi

echo "Total reviews: $((active + archived))"
```

Add 1 to the total to get the next review number.

### 7.2 Create Learning Entry

Add to `AI_REVIEW_LEARNINGS_LOG.md`:

```markdown
#### Review #N: <Brief Description> (YYYY-MM-DD)

**Source:** CodeRabbit PR / Qodo Compliance / Mixed **PR/Branch:**
<branch name or PR number> **Suggestions:** X total (Critical: X, Major: X,
Minor: X, Trivial: X)

**Patterns Identified:**

1. [Pattern name]: [Description]
   - Root cause: [Why this happened]
   - Prevention: [What to add/change]

**Resolution:**

- Fixed: X items
- Deferred: X items (with tracking)
- Rejected: X items (with justification)

**Key Learnings:**

- <Learning 1>
- <Learning 2>
```

### 7.3 Update Quick Index

If a new pattern category emerges, add it to the Quick Pattern Index section.

### 7.4 Update Consolidation Counter

If "Reviews since last consolidation" reaches 10+, note that consolidation is
due.

### 7.5 Health Check (Every 10 Reviews)

Check document health metrics:

```bash
wc -l docs/AI_REVIEW_LEARNINGS_LOG.md
```

**Archival Criteria** (ALL must be true before archiving reviews):

1. Log exceeds 1500 lines
2. Reviews have been consolidated into claude.md Section 4
3. At least 10 reviews in the batch being archived
4. Archive to `docs/archive/REVIEWS_X-Y.md`

If criteria met, archive oldest consolidated batch and update Tiered Access
table.

---

## STEP 8: FINAL SUMMARY

Provide structured output:

```markdown
## PR Review Processing Complete

### Statistics

- **Total Suggestions:** N
- **Fixed:** N (X Critical, X Major, X Minor, X Trivial)
- **Deferred:** N
- **Rejected:** N

### Files Modified

- `path/to/file1.ts` - [issues fixed]
- `path/to/file2.md` - [issues fixed]

### Agents Invoked

- `security-auditor` - for [issues]
- `test-engineer` - for [issues]

### Learning Entry

- Added Review #N to AI_REVIEW_LEARNINGS_LOG.md

### Verification Status

- [ ] All original suggestions cross-referenced
- [ ] Linter passing (or N/A)
- [ ] Tests passing (or N/A)
- [ ] Learning entry created

### Ready for Commit

<commit message suggestion following project conventions>
```

---

## STEP 9: COMMIT

Create commit(s) following project conventions:

- **Prefix**: `fix:` for bug fixes, `docs:` for documentation
- **Body**: Reference the review source and summary
- **Separate commits** for Critical fixes if needed

---

## IMPORTANT RULES

1. **NEVER skip trivial items** - Fix everything
2. **ALWAYS create learning entry FIRST** - Before any fixes
3. **ALWAYS read files before editing** - No blind edits
4. **ALWAYS verify fixes** - Multiple passes
5. **ALWAYS use TodoWrite** - Track every item
6. **ALWAYS invoke specialized agents** - When issue matches their domain
7. **NEVER silently ignore** - Document all decisions
8. **MONITOR document health** - Archive when all criteria in Step 7.5 are met

## Anti-Patterns to Avoid

- ❌ Skipping trivial items ("not worth fixing")
- ❌ Deferring minor items without strong justification
- ❌ Editing files without reading first
- ❌ Forgetting learning entry
- ❌ Not using TodoWrite for tracking
- ❌ Not invoking specialist agents when applicable
- ❌ Single-pass parsing of large reviews (500+ lines)
- ❌ Trusting AI claims about "missing data" without git verification

---

## Quick Reference

### Commands to Run

```bash
# Get next review number
grep -c "#### Review #" docs/AI_REVIEW_LEARNINGS_LOG.md

# After fixes
npm run lint
npm run test
npm run patterns:check
```

### Files to Update

1. All files mentioned in review (fixes)
2. `docs/AI_REVIEW_LEARNINGS_LOG.md` (learning entry - MANDATORY)
3. Update consolidation counter if reviews since last > 10

### Agents Available

| Agent                  | Use For                          |
| ---------------------- | -------------------------------- |
| `security-auditor`     | Security vulnerabilities         |
| `test-engineer`        | Test coverage gaps               |
| `performance-engineer` | Performance issues               |
| `technical-writer`     | Documentation issues             |
| `debugger`             | Complex debugging                |
| `backend-architect`    | Architecture concerns (backend)  |
| `frontend-developer`   | Architecture concerns (frontend) |
| `code-reviewer`        | General code quality             |

---

## ⚠️ Update Dependencies

When updating this command (steps, rules, protocol), also update:

| Document                                | What to Update              | Why                                          |
| --------------------------------------- | --------------------------- | -------------------------------------------- |
| `.claude/commands/fetch-pr-feedback.md` | Step 5 (invoked steps list) | fetch-pr-feedback auto-invokes this protocol |
| `docs/SLASH_COMMANDS_REFERENCE.md`      | `/pr-review` section        | Documentation of this command                |
| `docs/AI_REVIEW_PROCESS.md`             | Related workflow sections   | Process documentation                        |

**Why this matters:** This is the core PR review protocol. Changes here affect
all commands that invoke it.

---

## NOW: Ready to process PR review feedback

Paste the review feedback below, or say "fetch" and I'll grab it from the
current PR.

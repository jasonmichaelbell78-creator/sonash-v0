# PR Code Review Processor

You are about to process AI code review feedback. This is a **standardized, thorough review protocol** that ensures every issue is caught, addressed, and documented.

---

## STEP 0: CONTEXT LOADING (Tiered Access)

Before processing, load context using the tiered model:

**Tier 1 (Always):**
1. **Read** `claude.md` (root) Section 4 - Distilled anti-patterns (~150 lines)

**Tier 2 (Quick Lookup):**
2. **Read** `docs/AI_REVIEW_LEARNINGS_LOG.md` (first 200 lines) - Quick Index + consolidation status

**Tier 3 (When Investigating):**
3. **Read** specific review entries only when checking similar past issues
4. **Read** `docs/AI_REVIEW_PROCESS.md` only if process clarification needed

**Tier 4 (Historical - rarely needed):**
5. **Read** `docs/archive/REVIEWS_1-40.md` only for deep historical investigation

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
State: "I identified **N total suggestions** from this review. Proceeding with categorization."

---

## STEP 2: CATEGORIZATION (Per AI_REVIEW_PROCESS.md)

Categorize EVERY suggestion using this matrix:

| Category | Criteria | Action Required |
|----------|----------|-----------------|
| **CRITICAL** | Security vulnerabilities, data loss, breaking changes, blocking issues | Fix IMMEDIATELY, separate commit |
| **MAJOR** | Significant bugs, performance issues, missing validation, logic errors | Fix before proceeding |
| **MINOR** | Code style, naming, missing tests, doc improvements, library recommendations | Fix (don't defer unless truly complex) |
| **TRIVIAL** | Typos, whitespace, comment clarity, formatting | **FIX THESE TOO** - no skipping |

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

| Issue Type | Agent to Invoke |
|------------|-----------------|
| Security vulnerabilities | `security-auditor` agent |
| Test coverage gaps | `test-engineer` agent |
| Performance issues | `performance-engineer` agent |
| Documentation issues | `technical-writer` agent |
| Complex debugging | `debugger` agent |
| Architecture concerns | `backend-architect` or `frontend-developer` agent |

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

**NOTE**: For this protocol, lean heavily toward FIXING over deferring. Even trivial items should be fixed.

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

**Source:** CodeRabbit PR / Qodo Compliance / Mixed
**PR/Branch:** <branch name or PR number>
**Suggestions:** X total (Critical: X, Major: X, Minor: X, Trivial: X)

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
If "Reviews since last consolidation" reaches 10+, note that consolidation is due.

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

If criteria met, archive oldest consolidated batch and update Tiered Access table.

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

---

## NOW: Paste the review feedback below and I will process it using this protocol.

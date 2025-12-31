# PR Workflow Checklist - MANDATORY FOR ALL PHASES

**Purpose**: This checklist ensures EVERY phase (PR1-PR8) follows the complete workflow from implementation through review to between-PR cleanup.

**⚠️ CRITICAL**: Print this checklist and check off each step. Skipping steps leads to incomplete work, regressions, and scope creep.

---

## 📋 The Complete PR Workflow

```
┌─────────────────────────────────────────────────────────────┐
│  PHASE WORKFLOW (Do this for EVERY PR)                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1️⃣  IMPLEMENTATION (Master PR Implementer Prompt)          │
│      ├─ Print IMPL_CAPABILITIES line                       │
│      ├─ Parse inputs (PR goal, CANON IDs)                  │
│      ├─ Run baseline (lint, test)                          │
│      ├─ Implement changes                                  │
│      ├─ Run final verification                             │
│      └─ Output strict format (PR_HEADER, FILES_CHANGED...) │
│                                                             │
│  2️⃣  REVIEW PROMPT R1 (Self-Review)                         │
│      ├─ Check: Does it satisfy CANON IDs?                  │
│      ├─ Check: New duplication created?                    │
│      ├─ Check: SSR/boundary issues?                        │
│      ├─ Check: Security regressions?                       │
│      ├─ Check: Test coverage adequate?                     │
│      └─ Output: MUST_FIX, SHOULD_FIX, MERGE_DECISION       │
│                                                             │
│  3️⃣  REVIEW PROMPT R2 (Hallucination Check)                 │
│      ├─ Verify each claim with file+symbol                 │
│      ├─ Ground truth check (files exist, changes real)     │
│      └─ Output: PROVEN vs UNPROVEN                         │
│                                                             │
│  4️⃣  BETWEEN-PR CHECKLIST                                   │
│      ├─ Step 1: Rebase + Sanity Build                      │
│      ├─ Step 2: Document Canonical Surface                 │
│      ├─ Step 3: Run Grep Guardrails                        │
│      └─ Step 4: Update Tracking Document                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 1️⃣ IMPLEMENTATION PHASE

### Required First Line
```
IMPL_CAPABILITIES: repo_checkout=yes, run_commands=yes, package_manager="npm", limitations="None"
```

### Steps

- [ ] **PARSE INPUTS**
  - [ ] Restate PR title + goal (1-2 sentences)
  - [ ] List CANON IDs you will satisfy
  - [ ] List expected files to touch

- [ ] **BASELINE** (if not done this session)
  - [ ] Run: `npm run lint`
  - [ ] Run: `npm run test`
  - [ ] Run: `npm run typecheck` (if exists)
  - [ ] Record any pre-existing failures

- [ ] **IMPLEMENTATION LOOP**
  - [ ] For each CANON finding (in dependency order):
    - [ ] Implement smallest coherent change
    - [ ] Run targeted checks (lint/test relevant parts)
    - [ ] Fix failures immediately

- [ ] **FINAL VERIFICATION**
  - [ ] Run: `npm run lint`
  - [ ] Run: `npm run test`
  - [ ] Run: `npm run typecheck` (if available)
  - [ ] Run: `npm run build` (catches Next.js issues)
  - [ ] If coverage mentioned: `npm run test:coverage`

- [ ] **OUTPUT FORMAT** (STRICT)
  - [ ] PR_HEADER
  - [ ] FILES_CHANGED
  - [ ] CANONICAL_FINDINGS_SATISFIED (each CANON)
  - [ ] COMMANDS_RUN
  - [ ] METRICS (tests, errors, warnings, files, lines, coverage)
  - [ ] NOTES_FOR_REVIEWERS (risks, mitigations, followups)
  - [ ] DIFF_SUMMARY (5-12 bullets)

---

## 2️⃣ REVIEW PROMPT R1 (Self-Review)

**Do this AFTER implementation, BEFORE committing.**

### Checks

- [ ] **Does the PR actually satisfy the PR_OBJECT goal and the included CANON IDs?**
  - [ ] All CANON items addressed (implemented or verified)
  - [ ] PR goal achieved

- [ ] **Did it accidentally create new duplication or new "second patterns"?**
  - [ ] No competing utility functions
  - [ ] No alternative implementations of same logic

- [ ] **Any Next.js boundary issues introduced (server/client, SSR hazards)?**
  - [ ] No `window` access in server components
  - [ ] No React hooks in server components
  - [ ] No SSR crashes from client-only APIs

- [ ] **Security regressions (App Check assumptions, rules alignment, client trust boundary)?**
  - [ ] No weakening of security posture
  - [ ] Server still enforces all critical validation
  - [ ] Client doesn't bypass security checks

- [ ] **Tests: do they cover the risky path or just the happy path?**
  - [ ] Error cases tested
  - [ ] Edge cases covered
  - [ ] Critical paths have tests

### Output

- [ ] Document: **MUST_FIX** items
- [ ] Document: **SHOULD_FIX** items
- [ ] Document: **NICE_TO_HAVE** items
- [ ] Make decision: **MERGE** or **DO_NOT_MERGE**

---

## 3️⃣ REVIEW PROMPT R2 (Hallucination Check)

**Do this AFTER R1, BEFORE committing.**

### Task

For each claimed improvement:

- [ ] Point to **concrete file path**
- [ ] Point to **symbol(s)** that changed
- [ ] Describe **what behavior changed** (1 sentence)
- [ ] If cannot ground it, label "UNPROVEN"

### Verification Commands

```bash
# Verify files exist
ls -lh <file1> <file2> <file3>

# Verify line counts match claims
wc -l <files>

# Verify symbols exist
grep -c "functionName\|className" <file>

# Verify behavior changes
git diff HEAD~1 <file>
```

### Output

- [ ] Document: **PROVEN** claims (with file+symbol evidence)
- [ ] Document: **UNPROVEN** claims (needs investigation)
- [ ] Document: **HALLUCINATION RISK** assessment (HIGH/MEDIUM/LOW)

---

## 4️⃣ BETWEEN-PR CHECKLIST

**Do this AFTER R1 and R2 pass, BEFORE starting next phase.**

### Step 1: Rebase + Sanity Build

- [ ] `git pull origin <branch>`
- [ ] `npm run lint` (0 errors expected)
- [ ] `npm run test` (all passing expected)
- [ ] `npm run build` (catches Next.js boundary issues)

### Step 2: Lock the Canonical Surface

- [ ] Document in EIGHT_PHASE_REFACTOR_PLAN.md:
  - [ ] **What Became Canonical** (file + exported symbol)
  - [ ] **What Is Now Forbidden** (old pattern to avoid)
  - [ ] **Verification Commands** (grep commands with expected results)

Example format:
```markdown
**Canonical Surface Locked** (YYYY-MM-DD):

**What Became Canonical**:
- Journal writes: `hooks/use-journal.ts::useJournal().addEntry()`

**What Is Now Forbidden**:
- Direct Firestore writes: `setDoc(doc(db, 'users/...'))` - bypasses validation

**Verification Commands**:
- `grep -r "setDoc.*users" components/` → 0 results
```

### Step 3: Run Grep Guardrails

- [ ] Run verification commands from canonical surface
- [ ] Document results (expected vs actual)
- [ ] If drift detected, fix immediately

Example commands:
```bash
# Old Firestore paths
grep -r "users/\${" .
grep -r "/journalEntries" .

# Direct callables usage
grep -r "httpsCallable(" .

# Auth listeners (if standardized)
grep -r "onAuthStateChanged(" hooks/
```

### Step 4: Update the Tracking Document

- [ ] Mark phase as COMPLETE in EIGHT_PHASE_REFACTOR_PLAN.md
- [ ] Update overall progress percentage
- [ ] Update phase header (Status, Completion %, Completed date)
- [ ] Add "What Was Accomplished" section
- [ ] Check all acceptance criteria boxes

---

## 🚨 COMMON MISTAKES TO AVOID

### ❌ DON'T DO THIS:
- Skip the IMPL_CAPABILITIES line
- Skip the strict output format
- Skip Review Prompts R1 and R2
- Skip the Between-PR Checklist
- Commit without running all verification steps
- Start next phase without documenting canonical surface

### ✅ DO THIS:
- Follow the workflow in order (1 → 2 → 3 → 4)
- Check off each item on this list
- Document everything (grep commands, decisions, risks)
- Run all tests and builds before committing
- Update tracking document immediately after completion
- Lock canonical surface before moving on

---

## 📝 WORKFLOW TEMPLATE (Copy/Paste)

Use this template for each phase:

```markdown
# Phase [N] Implementation

## 1️⃣ IMPLEMENTATION

IMPL_CAPABILITIES: repo_checkout=yes, run_commands=yes, package_manager="npm", limitations="None"

### PR_HEADER
PR_ID: PR[N] | TITLE: [title] | BUCKET: [bucket]

### FILES_CHANGED
- [file]: [reason]

### CANONICAL_FINDINGS_SATISFIED
[For each CANON...]

### COMMANDS_RUN
- Baseline: [status]
- After changes: [status]

### METRICS
- Tests: X → Y
- Lint: X → Y
- Files: N changed

### NOTES_FOR_REVIEWERS
- Risks: [list]
- Followups: [list]

## 2️⃣ REVIEW R1

### MUST_FIX
- [items]

### SHOULD_FIX
- [items]

### MERGE_DECISION
[MERGE/DO_NOT_MERGE + reasoning]

## 3️⃣ REVIEW R2

### PROVEN
- [file+symbol evidence]

### HALLUCINATION RISK
[HIGH/MEDIUM/LOW]

## 4️⃣ BETWEEN-PR CHECKLIST

### Step 1: Build ✅
- lint: [status]
- test: [status]
- build: [status]

### Step 2: Canonical Surface ✅
- Documented: [yes/no]

### Step 3: Grep Guardrails ✅
- Results: [summary]

### Step 4: Tracking Updated ✅
- Phase marked COMPLETE: [yes/no]
```

---

## 🎯 SUCCESS CRITERIA

You've successfully completed a phase when:

✅ All 4 workflow steps done (Implementation → R1 → R2 → Between-PR)
✅ All checkboxes in this document checked
✅ All tests passing
✅ Build successful
✅ Canonical surface documented
✅ Tracking document updated
✅ Grep guardrails run and passing
✅ No MUST_FIX items remaining
✅ No UNPROVEN claims

**Only then** can you start the next phase.

---

**Last Updated**: 2025-12-30
**Document Version**: 1.0
**Related**: IMPLEMENTATION_PROMPTS.md, EIGHT_PHASE_REFACTOR_PLAN.md

# PR Workflow Checklist - MANDATORY FOR ALL PHASES

**Document Version**: 2.0
**Created**: 2025-12-30
**Last Updated**: 2026-01-02
**Status**: ACTIVE

---

## 📋 Purpose & Scope

This checklist ensures EVERY phase (PR1-PR8) follows the complete workflow from implementation through review to between-PR cleanup.

**⚠️ CRITICAL**: Print this checklist and check off each step. Skipping steps leads to incomplete work, regressions, and scope creep.

**Related Documents**:
- [GLOBAL_SECURITY_STANDARDS.md](./GLOBAL_SECURITY_STANDARDS.md) - Security requirements for ALL code
- [AI_REVIEW_PROCESS.md](../AI_REVIEW_PROCESS.md) - Processing AI review feedback
- [AI_WORKFLOW.md](../AI_WORKFLOW.md) - Deliverable Audit procedure

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
│      ├─ Step 4: Update Tracking Document                   │
│      └─ Step 5: Run Deliverable Audit (MANDATORY)          │
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

- [ ] **SECURITY CHECK** (MANDATORY - see [GLOBAL_SECURITY_STANDARDS.md](./GLOBAL_SECURITY_STANDARDS.md))
  - [ ] Rate Limiting: Will new endpoints need limits?
  - [ ] Input Validation: Will new inputs need validation?
  - [ ] Secrets: Any new API keys or secrets needed?
  - [ ] OWASP: Any security-sensitive changes?

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
  - [ ] All 4 GLOBAL_SECURITY_STANDARDS met (rate limiting, input validation, secrets, OWASP)

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

**Important**: Replace `<placeholders>` with actual file names and patterns from your phase. Supplement generic commands with phase-specific CANON verification patterns.

```bash
# Generic Verification (use for all phases)
# ----------------------------------------

# Verify files exist
ls -lh <file1> <file2> <file3>

# Verify line counts match claims
wc -l <files>

# Verify symbols exist
grep -c "functionName\|className" <file>

# Verify behavior changes
git diff HEAD~1 <file>

# Phase-Specific Verification Examples
# -------------------------------------
# Use patterns from your phase's "Canonical Surface" or "Verification Commands" section

# Example (Phase 1): Verify deprecated patterns removed
grep -r "FirestoreService.saveJournalEntry" components/
grep -r "setDoc.*users/.*journal" components/

# Example (Phase 3): Verify SSR-safe localStorage usage
grep -r "localStorage\\.getItem\|localStorage\\.setItem" components/ lib/
# Expected: 0 results (all should use lib/utils/storage.ts)

# Example (Phase 3): Verify error handling uses type guards
grep -r "error\\.code ===" components/ hooks/
# Expected: 0 results (all should use isFirebaseError() first)

# Add your phase-specific patterns here:
# grep -r "<forbidden-pattern>" <search-path>
# grep -c "<canonical-pattern>" <file>
```

**How to find phase-specific patterns**:
1. Open `EIGHT_PHASE_REFACTOR_PLAN.md`
2. Find your phase's "Canonical Surface Locked" section
3. Copy the verification commands from "Verification Commands" subsection
4. Run each command and verify the expected results match actual results

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

### Step 5: Run Deliverable Audit (MANDATORY)

**See**: [AI_WORKFLOW.md](../AI_WORKFLOW.md) → "MANDATORY: Deliverable Audit Procedure"

- [ ] Gather original goals, acceptance criteria, deliverables list
- [ ] Verify each deliverable exists, is complete, meets criteria
- [ ] Check for gaps (missing items, unmet criteria)
- [ ] Document findings in "What Was Accomplished"
- [ ] Address any gaps before marking complete
- [ ] Run procedure gap analysis (cross-reference dependencies)

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
✅ Security standards verified (GLOBAL_SECURITY_STANDARDS.md)
✅ All tests passing
✅ Build successful
✅ Canonical surface documented
✅ Tracking document updated
✅ Grep guardrails run and passing
✅ No MUST_FIX items remaining
✅ No UNPROVEN claims
✅ **Deliverable audit passed** (all deliverables verified)
✅ **Procedure gap analysis complete** (cross-references checked)

**Only then** can you start the next phase.

---

## 🗓️ Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 2.0 | 2026-01-02 | Standardized structure per Phase 4 migration | Claude |
| 1.1 | 2026-01-01 | Added security checks and deliverable audit steps | Development Team |
| 1.0 | 2025-12-30 | Initial checklist created | Development Team |

---

## 🤖 AI Instructions

**When using this checklist:**

1. **Follow steps in order** - Do not skip steps
2. **Check off each item** as you complete it
3. **Document blockers** in the template if you can't proceed
4. **Run verification commands** exactly as specified
5. **Complete deliverable audit** before marking phase complete

---

## 📝 Update Triggers

**Update this document when:**
- ✅ New mandatory steps discovered during implementation
- ✅ Verification commands need updating
- ✅ New security checks required
- ✅ Template format improvements identified

---

**END OF DOCUMENT**

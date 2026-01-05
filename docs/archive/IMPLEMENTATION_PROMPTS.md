# Implementation Prompts for 8-Phase Refactoring Plan

**Document Version**: 2.1
**Created**: 2025-12-30
**Last Updated**: 2026-01-05
**Status**: ARCHIVED

---

## ⚠️ SUPERSEDED NOTICE

**This document has been archived** as of 2026-01-05.

**Reason**: The EIGHT_PHASE_REFACTOR_PLAN.md that this document supported has been completed and archived. These implementation prompts are preserved for historical reference but are no longer actively used.

**Superseded by**: Multi-AI review framework templates in `docs/templates/`:
- [MULTI_AI_CODE_REVIEW_PLAN_TEMPLATE.md](./templates/MULTI_AI_CODE_REVIEW_PLAN_TEMPLATE.md) - Code review process
- [MULTI_AI_REFACTOR_PLAN_TEMPLATE.md](./templates/MULTI_AI_REFACTOR_PLAN_TEMPLATE.md) - Refactoring process
- [MULTI_AI_REVIEW_COORDINATOR.md](./MULTI_AI_REVIEW_COORDINATOR.md) - Review coordination

**For current workflows, see**:
- [PR_WORKFLOW_CHECKLIST.md](./PR_WORKFLOW_CHECKLIST.md) - Current PR workflow
- [AI_REVIEW_PROCESS.md](./AI_REVIEW_PROCESS.md) - Current review process

---

## 📋 Purpose & Scope

This document contains reusable prompts for implementing and reviewing each phase of the refactoring plan.

**Related Documents**:
- [EIGHT_PHASE_REFACTOR_PLAN.md](./archive/completed-plans/EIGHT_PHASE_REFACTOR_PLAN.md) - Master tracking document (archived)
- **[PR_WORKFLOW_CHECKLIST.md](./PR_WORKFLOW_CHECKLIST.md) - START HERE! Complete workflow with checkboxes**

---

## 🚨 CRITICAL: READ THIS FIRST

**⚠️ The PR workflow has 4 MANDATORY steps that must be done IN ORDER:**

```
1️⃣  IMPLEMENTATION (Master PR Implementer Prompt below)
     ↓
2️⃣  REVIEW R1 (Self-review - catch regressions)
     ↓
3️⃣  REVIEW R2 (Hallucination check - verify claims)
     ↓
4️⃣  BETWEEN-PR CHECKLIST (Lock canonical surface, run guardrails)
```

**DO NOT SKIP STEPS**. Skipping leads to:
- ❌ Incomplete work
- ❌ Regressions
- ❌ Scope creep
- ❌ Pattern drift
- ❌ False claims

**See [PR_WORKFLOW_CHECKLIST.md](./PR_WORKFLOW_CHECKLIST.md) for the complete checklist with checkboxes.**

---

## Table of Contents

1. [Master PR Implementer Prompt](#master-pr-implementer-prompt) - Step 1: Implementation
2. [Review Prompt R1](#review-prompt-r1) - Step 2: Self-review
3. [Review Prompt R2](#review-prompt-r2) - Step 3: Hallucination check
4. [Between-PR Checklist](#between-pr-checklist) - Step 4: Post-completion

**→ For a printable checklist, see [PR_WORKFLOW_CHECKLIST.md](./PR_WORKFLOW_CHECKLIST.md)**

---

# Master PR Implementer Prompt

**Usage**: Use this prompt for implementing any of the 8 phases (PR1-PR8). Combine with the specific PR payload from EIGHT_PHASE_REFACTOR_PLAN.md.

---

## ROLE

You are the Implementation Engineer for a single PR in a Next.js (App Router) + React + TypeScript + Firebase repo. You are executing one PR from a deduped refactor plan focused on cross-cutting duplication/inconsistency.

---

## INPUTS (I WILL PROVIDE)

1. **PR_OBJECT** (JSON) - From EIGHT_PHASE_REFACTOR_PLAN.md
2. **CANON_FINDINGS_JSONL** (one JSON object per line) - Canonical findings to satisfy in this PR

---

## HARD RULES

- **Do NOT re-audit the whole repo**. Implement ONLY what's required by PR_OBJECT + CANON_FINDINGS_JSONL.
- **Do NOT expand scope**. If you discover extra refactors, list them under FOLLOWUPS and stop there.
- **Keep PR small**: Target ≤ 10 files changed. If you must exceed, split into PRa/PRb and implement only PRa.
- **Evidence discipline**: Every claim about a change must cite file path + symbol name you touched.
- **No rewrites**. Prefer extraction + mechanical migration.
- **No secrets**. Never print env values or keys.
- **Decision Discipline**: When you encounter an architectural blocker or ambiguous requirement:
  1. **Do NOT guess or pick the "easiest" option** - document all viable approaches
  2. **Use structured decision framework**: List 2-4 options with pros/cons/trade-offs
  3. **Document decision criteria**: Security, user impact, development velocity, risk management
  4. **Make a recommendation** with clear rationale, but mark as "NEEDS APPROVAL" if it affects security posture or user experience
  5. **Update tracking document** with the decision, decision owner, timeline, and fallback plan
  6. **Example**: See CANON-0002 App Check decision in EIGHT_PHASE_REFACTOR_PLAN.md (Options A/B/C analysis → Option D hybrid)

---

## REQUIRED FIRST LINE

Print exactly:

```
IMPL_CAPABILITIES: repo_checkout=<yes/no>, run_commands=<yes/no>, package_manager="<npm|pnpm|yarn|unknown>", limitations="<one sentence>"
```

### IF repo_checkout=no OR run_commands=no

Return only:

```
BLOCKERS (bullets)
```

And STOP.

---

## PROCESS (STRICT)

### 1) PARSE INPUTS

- Restate PR title + goal (1–2 sentences)
- List CANON IDs you will satisfy
- List expected files to touch (best guess)

### 2) BASELINE (if not already done this session)

Run:
```bash
npm run lint
npm run test
```

If a typecheck script exists, also run it:
```bash
npm run typecheck  # or tsc --noEmit
```

Record any pre-existing failures under **BASELINE_FAILURES**.

### 3) IMPLEMENTATION LOOP

For each CANON finding (in dependency order):

1. Implement the smallest coherent change that satisfies its `suggested_fix`
2. Prefer shared helpers/utilities when `duplication_cluster` indicates a cluster
3. After each coherent chunk, run targeted checks (lint/typecheck/tests relevant)
4. Fix failures immediately before moving on

### 4) FINAL VERIFICATION (required)

Run:
```bash
npm run lint
npm run test
npm run typecheck  # or tsc --noEmit (if available)
```

If any CANON `acceptance_tests` mention coverage, also run:
```bash
npm run test:coverage
```

### 5) OUTPUT FORMAT (STRICT)

Return exactly these sections:

#### PR_HEADER
```
PR_ID: <pr_id> | TITLE: <title> | BUCKET: <bucket>
```

#### FILES_CHANGED
```
- <file>: <why>
```

#### CANONICAL_FINDINGS_SATISFIED

For each CANON-XXXX:
- What changed (file + symbol)
- Behavior change: yes/no
- How to verify (1–2 bullets)

#### COMMANDS_RUN
```
- Baseline: (short status)
- After changes: (short status)
```

#### METRICS
```
- Tests: X passed → Y passed (net +Z or -Z)
- Type errors: X → Y
- Lint warnings: X → Y
- Files changed: N files
- Lines added/removed: +X / -Y (net impact)
- Test coverage: X% → Y% (if measured)
```

#### NOTES_FOR_REVIEWERS
```
- Risks + mitigations
- Followups (out of scope items discovered)
```

#### DIFF_SUMMARY
```
- 5–12 bullets, no giant diffs/logs
```

---

# Review Prompt R1

**Purpose**: Self-review the PR after implementation (diff-focused).

**Usage**: Use this after completing any phase to catch regressions, scope creep, and hidden duplication.

---

## ROLE

You are a senior reviewer. Your job is to catch regressions, scope creep, and hidden duplication.

---

## INPUTS

I will paste:
1. The PR diff summary (or changed file list)
2. Key code snippets
3. Command outputs

---

## CHECKS (in order)

1. **Does the PR actually satisfy the PR_OBJECT goal and the included CANON IDs?**
2. **Did it accidentally create new duplication or new "second patterns"?**
3. **Any Next.js boundary issues introduced (server/client, SSR hazards)?**
4. **Security regressions (App Check assumptions, rules alignment, client trust boundary)?**
5. **Tests: do they cover the risky path or just the happy path?**

---

## OUTPUT FORMAT

### MUST_FIX
```
- (bullets: file+symbol)
```

### SHOULD_FIX
```
- (bullets)
```

### NICE_TO_HAVE
```
- (bullets)
```

### MERGE_DECISION
```
MERGE / DO_NOT_MERGE + 1 sentence
```

---

# Review Prompt R2

**Purpose**: Hallucination / false-positive guardrail check.

**Usage**: Use this to verify all claims from implementation are actually true.

---

## ROLE

You are an adversarial verifier. Assume prior claims may be wrong.

---

## INPUTS

I will paste:
- The PR_OBJECT
- The CANON items referenced
- The changed files

---

## TASK

For each claimed improvement, validate it by pointing to:

- **Concrete file path(s)** AND
- **Symbol(s)** that changed
- **What behavior changed** (1 sentence)

If you cannot ground it, label it "UNPROVEN".

---

## OUTPUT FORMAT

### PROVEN
```
- (bullets with file+symbol)
```

### UNPROVEN
```
- (bullets with what evidence is missing)
```

### RISKY_SIDE_EFFECTS
```
- (bullets)
```

---

# Between-PR Checklist

**Purpose**: Steps to take after completing each phase, before starting the next.

**⚠️ CRITICAL**: Do this EVERY time you finish a phase. Do not skip.

---

## 1) Rebase + Sanity Build

### Commands
```bash
# Pull latest
git pull origin main

# Run all quality checks
npm run lint
npm run test
npm run build  # HIGH VALUE: catches Next.js boundary mistakes
```

### Why
Catches "PR compiles but breaks the app router build" issues early.

---

## 2) Lock the New Canonical Surface

### Action
Document the new canonical surface in EIGHT_PHASE_REFACTOR_PLAN.md using this format:

```markdown
**Canonical Surface Locked** (YYYY-MM-DD):

**What Became Canonical**:
- [Specific API/pattern]: [File path + exported symbol]
- Example: Journal writes: `hooks/use-journal.ts::useJournal().createEntry()`

**What Is Now Forbidden**:
- [Old pattern to avoid]: [Why it's forbidden]
- Example: Direct Firestore writes: `setDoc(doc(db, 'users/...'))` - bypasses validation and rate limiting

**Verification Commands**:
- `grep -r "pattern-to-avoid" .` should return zero results in relevant directories
```

### Example
After completing Phase 1 (Journal Write Surface):

```markdown
**Canonical Surface Locked** (2025-12-30):

**What Became Canonical**:
- Journal writes: `hooks/use-journal.ts::useJournal().createEntry()`
- Journal updates: `hooks/use-journal.ts::useJournal().updateEntry()`
- Journal deletes: `hooks/use-journal.ts::useJournal().softDelete()`

**What Is Now Forbidden**:
- Direct `setDoc(doc(db, 'users/${userId}/journalEntries/...'))` in components
- Calling Cloud Functions directly with `httpsCallable(functions, 'saveJournalEntry')`
- Reason: Bypasses client-side rate limiting and validation

**Verification Commands**:
- `grep -r "setDoc.*journalEntries" components/` → 0 results
- `grep -r "httpsCallable.*Journal" components/` → 0 results
```

### Why
Prevents the next AI PR from reintroducing the old pattern. Makes the "canonical surface" concrete and greppable.

---

## 3) Grep Guardrails to Prevent Drift

### Action
After PRs that change a "surface" (Firestore paths, callables, auth), do 2–3 quick searches to ensure the old path/pattern is gone.

### Examples
```bash
# Old Firestore paths
grep -r "users/\${" .
grep -r "/journalEntries" .
grep -r "/journal" .

# Direct callables usage (if you standardized on a wrapper)
grep -r "httpsCallable(" .

# Auth listeners (if you standardized on provider)
grep -r "onAuthStateChanged(" hooks/
```

### Why
This is the fastest way to stop "cross-cutting inconsistency" from creeping back.

---

## 4) Update the Tracking Document

### Action
Update **EIGHT_PHASE_REFACTOR_PLAN.md**:

1. Mark CANON items as ✅ DONE
2. Fill in "What Was Accomplished" with:
   - Files changed + line numbers
   - Symbols created/modified
   - Commit SHAs
   - Dates
3. Fill in "What Was NOT Accomplished" (if anything skipped)
4. Fill in "Reasoning & Decisions" (explain why choices made)
5. Complete gap analysis (intended vs. actual)
6. Update phase status (PENDING → IN_PROGRESS → COMPLETE)
7. Update overall completion percentage in header
8. Append to Status History Log (Appendix E)

### Commit
```bash
git add docs/EIGHT_PHASE_REFACTOR_PLAN.md
git commit -m "docs: Update Phase X status - completed CANONs X, Y, Z"
```

### Why
Do NOT ask the aggregator model to re-scan the whole repo between PRs. Instead, feed it the PR diff summary + changed files + any new helper APIs. Re-aggregating wastes tokens and causes dedupe noise.

---

## 5) Run One Targeted Manual Smoke Test

### Action
Pick a small scenario tied to the PR (2–3 minutes):

| Phase | Smoke Test |
|-------|-----------|
| **PR1** | Create/edit journal entry; ensure it persists |
| **PR2** | Verify unified service works for reads |
| **PR3** | Check no SSR crashes; error guards work |
| **PR4** | Test rate limiting (rapid submits) |
| **PR5** | Submit a growth card entry |
| **PR6** | Verify quote/slogan rotation is deterministic |
| **PR7** | Run test suite; check coverage improved |
| **PR8** | Sign in/out; verify no auth state flicker |

### Why
Tests don't catch everything with Firebase + UI state.

---

## 6) When to Do a "Bigger" Step (Occasionally)

### After PR1 / PR2 (security + write surfaces)

Do a slightly heavier pass:

1. **Verify Firestore Rules + App Check behavior** in your expected envs (dev/stage/prod)
2. **If using emulators**: Run emulator tests or a quick manual emulator session

**Because**: These PRs change trust boundaries and are the easiest to "think" you fixed while leaving a bypass.

### Every ~3 PRs: Dependency/lockfile cleanup

```bash
npm dedupe  # if you're getting dependency churn
```

Ensure lockfile is stable and committed correctly.

---

## Optional But Powerful: Refactor Guardrails Doc

### Action
Create a single file `REFACTOR_RULES.md` that lists:

- Canonical Firestore service boundaries
- Canonical auth state source
- Canonical callable wrapper
- **Forbidden patterns** (direct SDK in UI, raw path strings, etc.)

### Usage
Paste it into each implementer prompt as a short "read-only" context.

---

# Additional Notes

## For Multi-AI Pipeline

If using multiple AIs (Claude, GPT, Gemini) across sessions:

1. **Always reference EIGHT_PHASE_REFACTOR_PLAN.md first**
2. **Check current phase status** before starting work
3. **Read gap analysis** from previous phases to avoid repeating mistakes
4. **Update tracking document** immediately after completing work
5. **Never skip between-PR checklist**

## Branch Strategy

If using feature branches → main:
```bash
# Create feature branch for each phase
git checkout -b phase-1-security-hardening

# Work on phase...

# When complete, create PR
git push origin phase-1-security-hardening
# Create PR via GitHub UI or gh CLI

# After merge, start next phase
git checkout main
git pull origin main
git checkout -b phase-2-firebase-access
```

If using stacked PRs:
```bash
# Each phase builds on previous
git checkout -b phase-1-security-hardening
# Complete Phase 1...

git checkout -b phase-2-firebase-access
# Phase 2 includes Phase 1 changes

# Mark in PR description: "Depends on #123 (Phase 1)"
```

---

## 🗓️ Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 2.0 | 2026-01-02 | Standardized structure per Phase 4 migration | Claude |
| 1.0 | 2025-12-30 | Initial prompts document | Development Team |

---

## 🤖 AI Instructions

**When using these prompts:**

1. **Use Master PR Implementer Prompt** for any phase implementation
2. **Always run Review R1** after implementing (self-review)
3. **Always run Review R2** after R1 (hallucination check)
4. **Complete Between-PR Checklist** before starting next phase
5. **Reference PR_WORKFLOW_CHECKLIST.md** for checkboxes

---

## 📝 Update Triggers

**Update this document when:**
- ✅ Prompt format needs adjustment based on results
- ✅ New checks need adding to review prompts
- ✅ Between-PR checklist needs new steps
- ✅ New lessons learned from using the prompts

---

**END OF DOCUMENT**

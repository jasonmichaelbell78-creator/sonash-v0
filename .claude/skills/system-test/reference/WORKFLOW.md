<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-18
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Comprehensive Audit — Complete Interactive Workflow

Full reference for the 23-domain interactive comprehensive audit skill (v4.0).
This document describes every step, every decision point, and every interaction
in the audit lifecycle.

---

## Table of Contents

- [0. Invocation](#0-invocation)
- [1. Initialization](#1-initialization)
- [2. Pre-Flight](#2-pre-flight-domains-0-1)
- [3. Domain Execution Loop](#3-domain-execution-loop-domains-2-19)
  - [3a. Announce](#3a-announce)
  - [3b. Execute](#3b-execute)
  - [3c. Present Findings](#3c-present-findings)
  - [3d. Individual Finding Review](#3d-individual-finding-review)
  - [3e. Domain Summary](#3e-domain-summary)
  - [3f. Session Boundary Check](#3f-session-boundary-check)
- [4. Cross-Domain Analysis](#4-cross-domain-analysis-domain-20-part-1)
- [5. Self-Audit](#5-self-audit-domain-21)
- [6. Deferred Finding Revisit](#6-deferred-finding-revisit)
- [7. Final Report](#7-final-report-domain-20-part-2)
- [8. TDMS Sync](#8-tdms-sync)
- [9. Sentry Verification](#9-sentry-verification-domain-22)
- [10. Wrap-Up](#10-wrap-up)
- [Edge Cases & Recovery](#edge-cases--recovery)
- [Finding JSONL Schema](#finding-jsonl-schema)
- [Glossary](#glossary)

---

## 0. Invocation

```
/system-test                     # Fresh audit — full run from Domain 0
/system-test --resume            # Resume from PLAN_INDEX.md checkpoint
/system-test --domain 7          # Run single domain (re-runs)
/system-test --from 5 --to 11    # Run a range (session-scoped)
/system-test --dry-run           # Show checks without executing
/system-test --batch             # Accept all findings without review
```

### Flag Reference

| Flag              | Behavior                                                |
| ----------------- | ------------------------------------------------------- |
| _(none)_          | Fresh audit — full run from Domain 0                    |
| `--resume`        | Read PLAN_INDEX.md, pick up from last completed domain  |
| `--domain N`      | Run single domain only (for re-runs or targeted checks) |
| `--from N --to M` | Run a range (for session-scoped work)                   |
| `--dry-run`       | Show what would be checked, don't execute               |
| `--batch`         | Accept all findings without individual review           |

---

## 1. Initialization

Runs on **every invocation** regardless of mode.

### Steps

```
1a. Detect mode (fresh / resume / targeted)
1b. If resume:
    → Read PLAN_INDEX.md
    → Show progress summary
    → INTERACTIVE DECISION 1: Confirm resume point
1c. Create/verify directory structure:
    docs/audits/comprehensive/audit-YYYY-MM-DD/
    ├── PLAN_INDEX.md             (master tracking — recovery anchor)
    ├── SUMMARY.md                (final report — written at end)
    ├── unified-findings.jsonl    (merged — written at end)
    └── domains/
        ├── d00-self-validation.jsonl
        ├── d01-prerequisites.jsonl
        ├── d02-build.jsonl
        ├── ...
        └── d22-sentry.jsonl
1d. Write PLAN_INDEX.md skeleton (all 23 domains, status: pending)
1e. Commit: "system-test: initialize audit-YYYY-MM-DD"
```

### INTERACTIVE DECISION 1 — Session Context

```
┌─────────────────────────────────────────────────┐
│  Comprehensive Audit — 23 Domains, ~100 checks  │
│                                                  │
│  Recommended session allocation:                 │
│  Session 1: Domains 0-4   (foundation)           │
│  Session 2: Domains 5-7   (lint, UI, functions)  │
│  Session 3: Domains 8-11  (security, rules)      │
│  Session 4: Domains 12-16 (perf, docs, PWA)      │
│  Session 5: Domains 17-19 (prior audits, admin)  │
│  Session 6: Domains 20-22 (report, self-audit)   │
│                                                  │
│  Which session are we running?                   │
│  ○ Session 1 (Domains 0-4)  [Recommended]        │
│  ○ Session 2 (Domains 5-7)                       │
│  ○ Session 3 (Domains 8-11)                      │
│  ○ Full run (all 23 — long session)              │
│  ○ Other                                         │
└─────────────────────────────────────────────────┘
```

---

## 2. Pre-Flight (Domains 0-1)

### Domain 0: Self-Validation

Always runs, even on resume. No findings generated — this is a meta-check.

```
Check 0.1: Skill loaded correctly (all 23 domains defined)
Check 0.2: Output directory exists and is writable
Check 0.3: TDMS accessible (can read MASTER_DEBT.jsonl)
Check 0.4: Git working tree clean (or warn)
Check 0.5: Required tools available (next, tsc, npm, firebase)
Check 0.6: PLAN_INDEX.md written (skeleton created successfully)
```

Output: Pass/fail table displayed to user.

### Domain 1: Prerequisites

```
Check 1.1: next build exits 0 (with timing)
Check 1.2: tsc --noEmit exits 0 (no type errors)
Check 1.3: npm audit (capture severity counts)
Check 1.4: Node version matches engines field in package.json
Check 1.5: Firebase CLI available and project configured
```

### INTERACTIVE DECISION 2 — Pre-Flight Results

```
┌─────────────────────────────────────────────┐
│  Pre-Flight Results                          │
│                                              │
│  ✅ Self-validation: 5/5 passed              │
│  ✅ next build: exit 0 (47s)                 │
│  ✅ tsc --noEmit: exit 0                     │
│  ⚠️  npm audit: 2 high, 10 moderate          │
│  ✅ Node v22.22.0 matches engines            │
│                                              │
│  Findings from pre-flight: 1                 │
│  → D01-001 [S1] npm audit: 2 high-severity   │
│    vulnerabilities in production deps         │
│                                              │
│  Suggestion: The 2 high vulns are in         │
│  nth-check (ReDoS) and postcss (path         │
│  traversal). Both are build-time only.       │
│  Recommend S2 if not in production bundle.   │
│                                              │
│  ○ Continue to domain execution              │
│  ○ Fix issues first, then retry              │
│  ○ Abort audit                               │
└─────────────────────────────────────────────┘
```

→ Commit checkpoint after pre-flight.

---

## 3. Domain Execution Loop (Domains 2-19)

This is the core loop. Repeats for each domain in sequence.

### 3a. Announce

Display domain header with context to help the user understand what's coming.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Domain 7: Cloud Functions                 [8/23]

  Risk Level: HIGH
  Reason: Largest subsystem (5000+ lines), handles all server-side logic
  Expected Findings: 5-10

  Checks planned:
  7.1  Rate limiter constant drift (client vs server values)
  7.2  Soft-delete TOCTOU race condition
  7.3  Missing return-after-throw patterns
  7.4  Input validation completeness (all onCall functions)
  7.5  Admin authorization consistency (role checks)
  7.6  Error response information leakage
  7.7  Scheduled function error handling
  7.8  Migration function edge cases

  Key files:
  • functions/src/index.ts (486 lines)
  • functions/src/admin.ts (3100+ lines)
  • functions/src/scheduled.ts
  • functions/src/security-logger.ts
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### INTERACTIVE DECISION 3 — Domain Start

```
○ Proceed with Domain 7  [Recommended]
○ Skip this domain (mark skipped in PLAN_INDEX.md)
○ Reorder (run a different domain first)
```

### 3b. Execute

For each check in the domain:

1. **Read** relevant files
2. **Run** relevant commands (build, lint, grep, static analysis)
3. **Analyze** output against expected behavior
4. **Generate** raw findings with evidence

Each finding gets a preliminary assignment:

```jsonl
{
  "id": "COMP-2026-02-18-D07-003",
  "domain": 7,
  "domain_name": "Cloud Functions",
  "check_id": "7.2",
  "severity": "S1",
  "effort": "E2",
  "title": "Soft-delete race: read-then-write without transaction",
  "description": "softDeleteJournalEntry reads the document to check isDeleted, then writes the update in a separate operation. Two concurrent calls could both pass the isDeleted guard.",
  "file": "functions/src/index.ts",
  "line": 287,
  "evidence": "Lines 287-310: const doc = await docRef.get(); ... await docRef.update({isDeleted: true})",
  "category": "correctness"
}
```

### 3c. Present Findings

Show summary table, then offer review mode choice.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Domain 7 Results: 7 findings

  🔴 S0 (critical):  0
  🟡 S1 (high):      3
  🔵 S2 (medium):    2
  ⚪ S3 (low):       2

  ID       Sev  Title                              File:Line
  D07-001  S1   Rate limiter constant drift         index.ts:45
  D07-002  S1   Missing return after throw           index.ts:162
  D07-003  S1   Soft-delete TOCTOU race             index.ts:287
  D07-004  S2   Admin auth check inconsistency      admin.ts:89
  D07-005  S2   Scheduled fn swallows errors        scheduled.ts:34
  D07-006  S3   Unused import in admin.ts           admin.ts:3
  D07-007  S3   Console.log left in migration fn    index.ts:510
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### INTERACTIVE DECISION 4 — Review Mode

```
How would you like to review these 7 findings?

○ Individual review (one-by-one with full detail)  [Recommended]
○ Batch accept all
○ Batch accept, flag exceptions (name the ones to discuss)
○ Show full detail for all, then decide
```

### 3d. Individual Finding Review

For each finding, present **full context with suggestion and options**.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Finding D07-003                           [3/7]

  Severity: S1 (high)     Effort: E2 (hours)
  Category: correctness   Check: 7.2

  Title: Soft-delete race: read-then-write without transaction

  Description:
  softDeleteJournalEntry reads the document to check isDeleted,
  then writes the update in a separate operation. Two concurrent
  calls could both pass the isDeleted guard and both attempt to
  soft-delete, potentially causing duplicate Sentry events or
  incorrect audit trail entries.

  File: functions/src/index.ts:287-310

  Evidence:
  │ 287 │ const docRef = db.collection("users").doc(uid)...
  │ 288 │ const doc = await docRef.get();
  │ 289 │ if (!doc.exists) throw new HttpsError(...);
  │ 290 │ const data = doc.data();
  │ 291 │ if (data.isDeleted) throw new HttpsError(...);
  │ ...
  │ 310 │ await docRef.update({ isDeleted: true, ... });

  ┌─────────────────────────────────────────────┐
  │  SUGGESTION                                 │
  │                                             │
  │  Recommendation: ACCEPT at S1               │
  │                                             │
  │  Reasoning: This is a real TOCTOU race.     │
  │  While unlikely in normal usage (users      │
  │  don't double-click delete rapidly), it     │
  │  could be triggered by:                     │
  │  • Network retry logic                      │
  │  • Malicious concurrent requests            │
  │  • Mobile app backgrounding/resuming        │
  │                                             │
  │  Suggested fix: Wrap lines 287-310 in a     │
  │  Firestore transaction:                     │
  │    await db.runTransaction(async (t) => {   │
  │      const doc = await t.get(docRef);       │
  │      if (doc.data().isDeleted) throw ...;   │
  │      t.update(docRef, {isDeleted: true});   │
  │    });                                      │
  │                                             │
  │  Counter-argument: If this function is      │
  │  only called from UI with debounce, the     │
  │  practical risk is low. Could be S2.        │
  │                                             │
  │  Similar pattern found in:                  │
  │  • saveJournalEntry (line 163) — same issue │
  │  • saveDailyLog (line 77) — already uses tx │
  └─────────────────────────────────────────────┘
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### INTERACTIVE DECISION 5 — Per-Finding Verdict

```
┌─────────────────────────────────────────────────┐
│  What would you like to do with D07-003?        │
│                                                  │
│  ○ Accept as-is (S1, E2)  [Recommended]          │
│  ○ Accept, change severity                       │
│    → S0 (critical) / S2 (medium) / S3 (low)     │
│  ○ Accept, change effort                         │
│    → E0 (minutes) / E1 (<1hr) / E3 (days)       │
│  ○ Reject (false positive)                       │
│  ○ Defer (revisit later)                         │
│  ○ Discuss (tell me more about this finding)     │
└─────────────────────────────────────────────────┘
```

**If user chooses "Reject":**

```
┌─────────────────────────────────────────────────┐
│  Why is D07-003 a false positive?                │
│                                                  │
│  ○ Already fixed in a pending PR                 │
│  ○ By design — explain:                          │
│  ○ Not applicable to our use case because:       │
│  ○ Duplicate of another finding:                 │
│  ○ Other (free text)                             │
└─────────────────────────────────────────────────┘
```

**If user chooses "Discuss":**

The skill provides additional context:

- More surrounding code (expanded line range)
- Detailed risk scenario walkthrough
- Whether other projects commonly have this pattern
- Links to relevant documentation or OWASP references
- Related TDMS entries if they exist

Then re-presents the same decision.

**Running tally after each decision:**

```
  Progress: 3/7 reviewed  │  ✅ 2 accepted  │  ❌ 0 rejected  │  ⏸ 1 deferred
```

### 3e. Domain Summary

After all findings in a domain are reviewed:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Domain 7: Cloud Functions — COMPLETE

  Total findings:  7
  Accepted:        5  (2×S1, 2×S2, 1×S3)
  Rejected:        1  (D07-006 — unused import already in lint backlog)
  Deferred:        1  (D07-004 — needs design discussion first)

  Written to: domains/d07-cloud-functions.jsonl

  Cumulative audit progress:
  ████████████░░░░░░░░░░░░  8/23 domains (35%)
  Total accepted findings:  31

  Time spent on Domain 7: ~12 minutes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### INTERACTIVE DECISION 6 — Post-Domain

```
○ Continue to Domain 8: Security Headers & CSP  [Recommended]
○ Re-review Domain 7 (change some decisions)
○ Pause here (save checkpoint, end session)
```

→ Commit: `system-test: Domain 7 — Cloud Functions [8/23]` → Update
PLAN_INDEX.md (mark Domain 7 as ✅ Complete, update counts)

### 3f. Session Boundary Check

After every domain, the skill checks:

- Have we reached the session's planned endpoint?
- Have we completed 15+ domains without a push? (git hygiene)
- Is the conversation getting long? (compaction risk)

If any trigger fires:

### INTERACTIVE DECISION 7 — Session Boundary

```
┌─────────────────────────────────────────────────┐
│  Session 2 planned endpoint reached              │
│                                                  │
│  Completed this session: Domains 5, 6, 7         │
│  Findings this session:  18 accepted              │
│  Cumulative:             43 accepted (8/23)       │
│                                                  │
│  Suggestion: Good stopping point. Domain 7 was   │
│  the heaviest domain. Session 3 (security) is    │
│  best started fresh with full context.           │
│                                                  │
│  ○ End session here (commit + push)  [Recommended]│
│  ○ Continue into Session 3 domains               │
│  ○ Re-run a domain from this session             │
└─────────────────────────────────────────────────┘
```

If ending session:

```
  ✅ Checkpoint committed: abc1234
  ✅ Pushed to remote branch
  ✅ PLAN_INDEX.md updated

  Resume next session with:
    /system-test --resume

  Next session starts at: Domain 8 (Security Headers & CSP)
```

---

## 4. Cross-Domain Analysis (Domain 20, Part 1)

After all execution domains (2-19) are complete, scan for patterns.

```
Scanning 150+ accepted findings across 18 domains...

Cross-Cutting Patterns Detected:

Pattern 1: "Missing validation at boundaries" (8 findings, 4 domains)
  → D07-001, D07-004, D08-002, D09-003, D09-005, D10-001, D11-002, D11-004
  → Systemic: Input validation is inconsistent between client and server
  → Suggestion: Create a shared validation schema (Zod) used by both sides
  → Estimated effort if addressed systemically: E3 (days) vs E2×8 individually

Pattern 2: "Inconsistent error handling" (5 findings, 3 domains)
  → D07-002, D07-005, D08-004, D12-001, D12-003
  → Systemic: Some errors swallowed, some thrown, some logged — no strategy
  → Suggestion: Adopt a unified error handling pattern (already partially exists
    in callable-errors.ts — extend it)
  → Estimated effort: E2 (hours)

Pattern 3: "Documentation drift" (6 findings, 2 domains)
  → D14-001 through D14-006
  → Systemic: Docs reference old patterns the code has evolved past
  → Suggestion: Run doc-optimizer skill after code changes
  → Estimated effort: E1 (< 1 hour)
```

### INTERACTIVE DECISION 8 — Cross-Cutting Findings

For each pattern:

```
┌─────────────────────────────────────────────────┐
│  Pattern 1: Missing validation at boundaries    │
│  8 findings across 4 domains                     │
│                                                  │
│  Suggestion: Promote to a standalone "systemic" │
│  finding. Addressing this as one unit (shared   │
│  Zod schemas) is more efficient than 8 separate │
│  fixes.                                         │
│                                                  │
│  ○ Promote to standalone finding  [Recommended]  │
│  ○ Note only (mention in report, not a finding)  │
│  ○ Dismiss (these are coincidental, not systemic)│
└─────────────────────────────────────────────────┘
```

---

## 5. Self-Audit (Domain 21)

The skill audits **its own execution** for completeness and quality.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Domain 21: Post-Test Self-Audit

  Checking audit completeness...

  ✅ All 23 domains executed (0 skipped)
  ✅ Every check ID in the skill was actually run
  ⚠️  Domain 15 (PWA) had 0 findings — suspicious?
  ✅ Severity distribution reasonable (bell curve, not all S3)
  ✅ No duplicate finding IDs
  ✅ All JSONL files are valid JSON Lines format
  ⚠️  3 deferred findings never revisited (D04-002, D07-004, D09-003)
  ✅ PLAN_INDEX.md matches actual file state on disk
  ✅ Total finding count matches sum of domain files

  Self-audit findings: 2

  SA-001 [S3] Domain 15 had 0 findings
    Suggestion: PWA manifest has known issues (JPG icons, no maskable
    icon, no service worker). Zero findings suggests checks may have
    been too shallow. Consider re-running Domain 15 with expanded checks.

  SA-002 [S3] 3 deferred findings never revisited
    Suggestion: Present these now for final disposition before the
    report is generated. They'll appear as "deferred" in the report
    otherwise, which leaves open items.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### INTERACTIVE DECISION 9 — Self-Audit Results

```
┌─────────────────────────────────────────────────┐
│  Self-audit found 2 items. What would you like? │
│                                                  │
│  ○ Accept both, move to final report             │
│  ○ Re-run Domain 15 with deeper checks           │
│  ○ Revisit the 3 deferred findings now           │
│  ○ Both: re-run D15 AND revisit deferred         │
└─────────────────────────────────────────────────┘
```

---

## 6. Deferred Finding Revisit

If deferred findings exist and the user chose to revisit them:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Deferred Findings: 3 items

  1. D04-002 [S2] Three-way version mismatch (firebase packages)
     Deferred in Session 1. Reason: "Need to check if upgrade is safe"

     Update since deferral: Domain 7 (Cloud Functions) found no
     issues caused by the version mismatch. This may be cosmetic.

     Suggestion: Downgrade to S3 and accept.
     ○ Accept at S2 (original)
     ○ Accept at S3 (downgraded)
     ○ Reject (cosmetic, not actionable)

  2. D07-004 [S2] Admin auth check inconsistency
     Deferred in Session 2. Reason: "Needs design discussion"

     Update since deferral: Domain 11 (Auth) confirmed all admin
     routes do check isAdmin. The inconsistency is in HOW they
     check (some use helper, some inline). Functional but messy.

     Suggestion: Accept at S3 (style issue, not security).
     ○ Accept at S2 (original)
     ○ Accept at S3 (downgraded)
     ○ Reject (acceptable variation)

  3. D09-003 [S1] Firestore rule allows wider read than intended
     Deferred in Session 3. Reason: "Need to verify with production data"

     No new information available. This finding stands as-is.

     Suggestion: Accept at S1. This is a real permission over-grant.
     ○ Accept at S1 (original)
     ○ Accept at S2 (downgraded)
     ○ Reject (intended behavior)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Each deferred finding gets the full verdict flow (same as section 3d).

---

## 7. Final Report (Domain 20, Part 2)

Generate `SUMMARY.md` with the following structure:

```markdown
# Comprehensive Audit Report — 2026-02-18

## Executive Summary

- 23 domains audited across N sessions
- **XXX findings** accepted (XX S0, XX S1, XX S2, XX S3)
- **XX findings** rejected as false positives
- **XX findings** deferred (XX later resolved, XX remain open)
- **X cross-cutting patterns** identified
- Estimated total remediation effort: ~XX hours

## Severity Distribution

S0 ████░░░░░░░░░░░░ XX (XX%) S1 ████████░░░░░░░░ XX (XX%) S2 ██████████████░░ XX
(XX%) S3 ████████████████ XX (XX%)

## Risk Matrix

| Domain           | Risk Level | Finding Count | Critical Path? |
| ---------------- | ---------- | ------------- | -------------- |
| Cloud Functions  | HIGH       | XX            | Yes            |
| Firestore Rules  | HIGH       | XX            | Yes            |
| Security Headers | MEDIUM     | XX            | No             |
| ...              | ...        | ...           | ...            |

## Top 10 Priority Findings

(Ranked by severity × effort × cross-domain impact)

1. ...

## Cross-Cutting Patterns

1. Missing validation at boundaries (8 findings, 4 domains)
2. ...

## Per-Domain Breakdown

| #   | Domain          | Findings | S0  | S1  | S2  | S3  | Effort |
| --- | --------------- | -------- | --- | --- | --- | --- | ------ |
| 0   | Self-Validation | 0        | -   | -   | -   | -   | -      |
| ... | ...             | ...      | ..  | ..  | ..  | ..  | ...    |

## Recommendations (Priority Order)

1. [S0/S1] Fix critical security findings first (list)
2. [Systemic] Address cross-cutting validation pattern
3. [Quick wins] S3/E0 items that take minutes
4. [Planned] Schedule S2/E2+ items for next sprint

## Rejected Findings (Transparency Log)

| ID  | Title | Reason | Decided By |
| --- | ----- | ------ | ---------- |

## Self-Audit Results

(From Domain 21 — audit quality metrics)

## Appendix

- Links to individual domain JSONL files
- PLAN_INDEX.md final state
- Session timeline
```

### INTERACTIVE DECISION 10 — Final Report

```
┌─────────────────────────────────────────────────┐
│  Final report generated: SUMMARY.md             │
│  XXX findings, XX pages                          │
│                                                  │
│  ○ Approve report as-is  [Recommended]           │
│  ○ Edit executive summary                        │
│  ○ Add/remove sections                           │
│  ○ Add notes before finalizing                   │
└─────────────────────────────────────────────────┘
```

→ Commit: `system-test: final report — XXX findings across 23 domains`

---

## 8. TDMS Sync

Preview what would change in MASTER_DEBT.jsonl, then ask.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  TDMS Sync Preview

  New findings to add:           XXX
  Already in TDMS (duplicates):  XX   (will skip)
  Would update existing:         XX   (severity changed)

  Current TDMS: 2656 items (298 resolved)
  After sync:   ~XXXX items

  Deduplication method:
  Match on file + title similarity (>80% fuzzy match) to avoid
  creating duplicate entries for issues already tracked.

  Sample new entry:
  {"id":"COMP-2026-02-18-D07-003","severity":"S1","effort":"E2",
   "title":"Soft-delete TOCTOU race","source":"system-test",
   "domain":"cloud-functions","file":"functions/src/index.ts:287"}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### INTERACTIVE DECISION 11 — TDMS Sync

```
┌─────────────────────────────────────────────────┐
│  Sync findings to TDMS?                          │
│                                                  │
│  ○ Sync all new findings  [Recommended]          │
│  ○ Preview full diff first, then decide          │
│  ○ Sync S0+S1 only (critical/high)              │
│  ○ Skip sync (findings stay in JSONL only)       │
└─────────────────────────────────────────────────┘
```

---

## 9. Sentry Verification (Domain 22)

Optional domain — requires network access to Sentry.

```
Checks:
22.1  Sentry DSN configured in environment
22.2  Client logger (lib/logger.ts) connects to Sentry
22.3  Server logger (functions/src/security-logger.ts) connects to Sentry
22.4  PII redaction equivalence: client SENSITIVE_KEYS vs server SENSITIVE_KEYS
22.5  Dual-logger architecture consistency (same Sentry project?)
22.6  Source maps uploaded for production debugging
22.7  Alert rules configured for S0/S1 error patterns
```

### INTERACTIVE DECISION 12 — Sentry Access

```
┌─────────────────────────────────────────────────┐
│  Domain 22 requires Sentry access for some      │
│  checks. Others can run offline.                │
│                                                  │
│  Suggestion: Run offline checks (code analysis) │
│  now. Network checks can be done separately     │
│  if/when Sentry credentials are available.      │
│                                                  │
│  ○ Run offline checks only  [Recommended]        │
│  ○ Run all checks (need DSN access)              │
│  ○ Skip Domain 22 entirely                       │
└─────────────────────────────────────────────────┘
```

---

## 10. Wrap-Up

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  COMPREHENSIVE AUDIT COMPLETE

  Duration:   N sessions over N days
  Domains:    23/23 ✅
  Findings:   XXX accepted, XX rejected, XX deferred→resolved

  Report:
    docs/audits/comprehensive/audit-2026-02-18/SUMMARY.md

  Data:
    docs/audits/comprehensive/audit-2026-02-18/unified-findings.jsonl
    docs/audits/comprehensive/audit-2026-02-18/domains/ (23 files)

  TDMS:
    XXX items synced to MASTER_DEBT.jsonl

  All files committed and pushed.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Edge Cases & Recovery

| Situation                        | Behavior                                                                                                  |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Build fails in Domain 2          | Offer: fix first, skip dependent domains, or abort. Domain 3 (tests) cannot run without successful build. |
| Domain has 0 findings            | Self-audit (Domain 21) flags as suspicious. User decides if genuinely clean or checks need deepening.     |
| User rejects ALL findings        | All recorded as rejected with reasons. Domain still counts as complete. Noted in report transparency log. |
| Compaction mid-domain            | Read PLAN_INDEX.md. Last complete domain is checkpoint. Current domain re-runs from scratch.              |
| User wants to re-run a domain    | Allowed. Clears that domain's JSONL. Re-executes all checks, re-presents for review.                      |
| Finding duplicates existing TDMS | Skipped during sync with note. Shown in sync preview so user is aware.                                    |
| User says "stop" mid-review      | Remaining findings in current domain marked as deferred. Commit what's reviewed. Resume later.            |
| Network error on git push        | Retry 4× with exponential backoff (2s, 4s, 8s, 16s). If all fail, save locally and advise manual push.    |
| Check requires network we lack   | Run offline analysis only. Finding notes "network check skipped" with limitation documented.              |
| TDMS file is locked or corrupt   | Skip sync, write findings to JSONL only. Advise user to fix TDMS and run sync manually.                   |
| User disagrees with suggestion   | User decision is always final. Skill records the override with original suggestion for transparency.      |

---

## Anti-Compaction Guardrails

### Layer 1: File-First Architecture

Every piece of content goes to disk immediately. Nothing exists only in context.
The conversation is a coordination layer; the files ARE the audit.

### Layer 2: Incremental Git Commits

Commit after every completed domain. Each commit is a checkpoint. Worst case:
lose 1 domain of in-progress work. Pattern:
`system-test: Domain N — <name> [M/23]`

### Layer 3: PLAN_INDEX.md as Recovery Anchor

Single file tracks all progress. After compaction, read this one file to know
exactly where to resume. Updated after every domain.

### Layer 4: Domain Independence

Each domain is self-contained. No domain depends on reading another domain's
findings to execute. Cross-references use stable IDs only.

### Recovery Protocol

```
1. Read PLAN_INDEX.md → identify last ✅ Complete domain
2. Read last completed domain's JSONL → verify it's intact
3. Resume from next domain number
4. No re-reading of already-completed domains needed
```

---

## Finding JSONL Schema

Every finding across all domains uses this schema:

```jsonl
{
  "id": "COMP-2026-02-18-D07-003",
  "domain": 7,
  "domain_name": "Cloud Functions",
  "check_id": "7.2",
  "severity": "S1",
  "effort": "E2",
  "category": "correctness",
  "title": "Soft-delete race: read-then-write without transaction",
  "description": "Full description of the finding...",
  "file": "functions/src/index.ts",
  "line": 287,
  "evidence": "Relevant code or command output...",
  "suggested_fix": "Wrap in Firestore transaction",
  "status": "accepted",
  "original_severity": "S1",
  "user_severity_override": null,
  "rejection_reason": null,
  "deferral_reason": null,
  "user_notes": null,
  "suggestion_text": "Accept at S1. Real TOCTOU race...",
  "counter_argument": "Low practical risk with UI debounce...",
  "related_findings": [
    "D07-001"
  ],
  "detected_at": "2026-02-18T14:32:00Z",
  "reviewed_at": "2026-02-18T14:33:15Z"
}
```

### Field Reference

| Field                    | Type     | Required | Description                                                                                       |
| ------------------------ | -------- | -------- | ------------------------------------------------------------------------------------------------- |
| `id`                     | string   | Yes      | Unique ID: `COMP-{date}-D{NN}-{NNN}`                                                              |
| `domain`                 | number   | Yes      | Domain number (0-22)                                                                              |
| `domain_name`            | string   | Yes      | Human-readable domain name                                                                        |
| `check_id`               | string   | Yes      | Which check found this (e.g., "7.2")                                                              |
| `severity`               | string   | Yes      | Final severity after user review: S0/S1/S2/S3                                                     |
| `effort`                 | string   | Yes      | Estimated fix effort: E0/E1/E2/E3                                                                 |
| `category`               | string   | Yes      | One of: security, correctness, performance, maintainability, accessibility, config, documentation |
| `title`                  | string   | Yes      | Short title (< 80 chars)                                                                          |
| `description`            | string   | Yes      | Full description                                                                                  |
| `file`                   | string   | Yes      | File path relative to repo root                                                                   |
| `line`                   | number   | No       | Line number (if applicable)                                                                       |
| `evidence`               | string   | Yes      | Code snippet or command output proving the issue                                                  |
| `suggested_fix`          | string   | No       | How to fix it                                                                                     |
| `status`                 | string   | Yes      | `accepted` / `rejected` / `deferred`                                                              |
| `original_severity`      | string   | No       | If user changed severity, what it was originally                                                  |
| `user_severity_override` | string   | No       | User's chosen severity if different                                                               |
| `rejection_reason`       | string   | No       | Why rejected (if status=rejected)                                                                 |
| `deferral_reason`        | string   | No       | Why deferred (if status=deferred)                                                                 |
| `user_notes`             | string   | No       | Any notes the user added                                                                          |
| `suggestion_text`        | string   | No       | The recommendation shown to user                                                                  |
| `counter_argument`       | string   | No       | The counter-argument shown to user                                                                |
| `related_findings`       | string[] | No       | IDs of related findings in other domains                                                          |
| `detected_at`            | string   | Yes      | ISO 8601 timestamp of detection                                                                   |
| `reviewed_at`            | string   | No       | ISO 8601 timestamp of user review                                                                 |

---

## Severity & Effort Scales

### Severity

| Level | Name     | Meaning                                        | Response Time   |
| ----- | -------- | ---------------------------------------------- | --------------- |
| S0    | Critical | Security breach, data loss, app crash          | Fix immediately |
| S1    | High     | Significant bug, security risk, major UX issue | Fix this sprint |
| S2    | Medium   | Moderate issue, tech debt, minor UX problem    | Schedule fix    |
| S3    | Low      | Cosmetic, optimization, nice-to-have           | Backlog         |

### Effort

| Level | Name    | Meaning                        |
| ----- | ------- | ------------------------------ |
| E0    | Minutes | Quick fix, config change       |
| E1    | < 1 hr  | Small code change, one file    |
| E2    | Hours   | Multi-file change, some design |
| E3    | Days    | Major refactor, new subsystem  |

---

## Glossary

| Term   | Meaning                                                     |
| ------ | ----------------------------------------------------------- |
| TDMS   | Technical Debt Management System (`MASTER_DEBT.jsonl`)      |
| S0-S3  | Severity scale: S0=critical → S3=low                        |
| E0-E3  | Effort scale: E0=minutes → E3=days                          |
| JSONL  | JSON Lines — one JSON object per line                       |
| TOCTOU | Time-of-check-to-time-of-use race condition                 |
| DSN    | Data Source Name (Sentry connection string)                 |
| CANON  | Canonical decision document (CANON-XXXX references in code) |
| PWA    | Progressive Web App                                         |
| CSP    | Content Security Policy                                     |
| PII    | Personally Identifiable Information                         |
| ReDoS  | Regular Expression Denial of Service                        |
| SBOM   | Software Bill of Materials                                  |
| OWASP  | Open Web Application Security Project                       |
| WCAG   | Web Content Accessibility Guidelines                        |
| oklch  | CSS color function (Oklab Lightness, Chroma, Hue)           |

---

## Session Allocation Reference

| Session | Domains | Focus Area              | Risk Level | Est. Findings | Notes                              |
| ------- | ------- | ----------------------- | ---------- | ------------- | ---------------------------------- |
| 1       | 0-4     | Foundation              | LOW        | 5-15          | Build/test/deps — mostly automated |
| 2       | 5-7     | Lint, UI, Cloud Fns     | HIGH       | 20-35         | Domain 7 is the heaviest           |
| 3       | 8-11    | Security, Rules, Auth   | HIGH       | 15-25         | Security-critical domains          |
| 4       | 12-16   | Perf, Config, Docs, PWA | MEDIUM     | 15-25         | Broad coverage, moderate depth     |
| 5       | 17-19   | Prior Audits, Admin     | MEDIUM     | 10-20         | Cross-referencing + admin panel    |
| 6       | 20-22   | Report, Self-Audit      | LOW        | 5-10          | Synthesis + quality check          |

---

## Dependency Graph

```
Domain 0 (Self-Validation)
  └→ Domain 1 (Prerequisites)
       └→ Domain 2 (Build) ─── must pass before ──→ Domain 3 (Tests)
            │
            ├→ Domain 4 (Dependencies)     ← independent
            ├→ Domain 5 (Lint)             ← independent
            ├→ Domain 6 (UI)              ← independent
            ├→ Domain 7 (Cloud Functions)  ← independent
            ├→ Domain 8 (Security Headers) ← independent
            ├→ Domain 9 (Firestore Rules)  ← independent
            ├→ Domain 10 (Env/Config)      ← independent
            ├→ Domain 11 (Auth)            ← independent
            ├→ Domain 12 (Performance)     ← independent
            ├→ Domain 13 (Config Files)    ← independent
            ├→ Domain 14 (Documentation)   ← independent
            ├→ Domain 15 (PWA)             ← independent
            ├→ Domain 16 (TDMS)            ← independent
            ├→ Domain 17 (Prior Audits)    ← independent
            ├→ Domain 18 (Admin Panel)     ← independent
            └→ Domain 19 (Data Integrity)  ← independent

Domain 20 (Report) ← depends on Domains 2-19 complete
Domain 21 (Self-Audit) ← depends on Domain 20
Domain 22 (Sentry) ← independent, can run anytime after Domain 0
```

---

## Version History

| Version | Date       | Description                                                |
| ------- | ---------- | ---------------------------------------------------------- |
| 1.0     | 2026-02-18 | Initial workflow document for v4.0 (23-domain interactive) |

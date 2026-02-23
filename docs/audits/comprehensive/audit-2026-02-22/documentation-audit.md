<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-22
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Documentation Audit Report — SoNash v0

**Audit Date:** 2026-02-22 **Auditor:** docs-auditor agent **Scope:** docs/,
.claude/, README.md, CLAUDE.md, SESSION_CONTEXT.md, ROADMAP.md,
docs/agent_docs/, docs/technical-debt/ **Project Stack:** Next.js 16.1.1, React
19.2.3, Firebase 12.6.0, Tailwind CSS 4.1.9, Zod 4.2.1

---

## 1. Executive Summary

The SoNash documentation ecosystem is large (289 active + 102 archived
documents) and generally well-organized with a mature 5-tier classification
system and automated generation tooling (`npm run docs:index`). The project
demonstrates strong documentation culture: AI workflow guides, session context,
ADR templates, and cross-doc dependency checks all exist.

However, the audit uncovered **12 concrete findings** across five categories:

1. **Architecture doc vs. reality divergence** — The most critical gap.
   `ARCHITECTURE.md` shows outdated security rule snippets (journal allows
   direct writes) and a fabricated Cloud Functions folder structure
   (`functions/src/utils/`, `functions/src/journal/`, `functions/src/admin/`)
   that does not match the real codebase.

2. **Stale counts and metrics** — README.md reports `89/91 passing (97.8%)`
   tests; the current count is `293/294`. README also claims
   `24 specialized AI agents` and `23 task-specific skills`; the actual counts
   are 25 agents and 59 skill files.

3. **Duplicate canonical file** — Both `CLAUDE.md` (the actual project
   instructions) and `claude.md` (a byte-for-byte copy) exist in the repo root.
   README links to `claude.md` while the real file is `CLAUDE.md`.

4. **Broken cross-reference** — `docs/DOCUMENTATION_STANDARDS.md` lists
   `MULTI_AI_REVIEW_COORDINATOR.md` as a Tier 4 reference document, but this
   file does not exist anywhere in the project.

5. **Implementation status mismatch** — README Roadmap Module Mapping table
   marks the `Growth` tab as `Planned` behind a feature flag, but
   `components/notebook/pages/growth-page.tsx` and full growth components
   (`SpotCheckCard`, `NightReviewCard`, `GratitudeCard`, `Step1WorksheetCard`)
   are already implemented.

**Overall Documentation Health:** Good structure, meaningful gaps in accuracy
and sync.

---

## 2. Top Findings Table

| #   | Finding                                                                                                    | Severity | Effort | File(s)                         |
| --- | ---------------------------------------------------------------------------------------------------------- | -------- | ------ | ------------------------------- |
| F1  | ARCHITECTURE.md shows stale Firestore security rules that contradict actual `firestore.rules`              | S1       | E2     | ARCHITECTURE.md                 |
| F2  | ARCHITECTURE.md shows fabricated Cloud Functions folder structure                                          | S1       | E2     | ARCHITECTURE.md                 |
| F3  | README test count stale (89/91 vs actual 293/294)                                                          | S2       | E0     | README.md                       |
| F4  | Duplicate CLAUDE.md / claude.md files with inconsistent references                                         | S2       | E1     | CLAUDE.md, claude.md, README.md |
| F5  | README agent/skill counts wrong (24/23 vs actual 25/59)                                                    | S2       | E0     | README.md                       |
| F6  | DOCUMENTATION_STANDARDS.md references non-existent MULTI_AI_REVIEW_COORDINATOR.md                          | S2       | E0     | docs/DOCUMENTATION_STANDARDS.md |
| F7  | README Growth tab marked "Planned/feature-flagged" but is implemented                                      | S2       | E1     | README.md                       |
| F8  | DEVELOPMENT.md project structure missing lib/utils/, lib/contexts/, lib/hooks/, lib/db/                    | S2       | E1     | DEVELOPMENT.md                  |
| F9  | ROADMAP.md "Last Updated: Session #151" — no date, 30+ sessions stale                                      | S2       | E0     | ROADMAP.md                      |
| F10 | App Check disabled in production but documented as enabled (README, ARCHITECTURE.md)                       | S2       | E1     | README.md, ARCHITECTURE.md      |
| F11 | ADR directory has only 1 archived ADR-001; no active ADRs despite significant architectural decisions made | S3       | E3     | docs/decisions/                 |
| F12 | ARCHITECTURE.md `FirestoreService` shown as class but actual implementation is factory function pattern    | S3       | E1     | ARCHITECTURE.md                 |

---

## 3. Detailed Findings (Grouped by Severity)

### S1 — High Severity

---

#### F1: ARCHITECTURE.md Firestore Security Rules are Dangerously Stale

**File:** `ARCHITECTURE.md` (lines 210–258)

**Description:** `ARCHITECTURE.md` displays Firestore security rules in a code
block that permits direct client writes to the `journal` collection:

```javascript
// From ARCHITECTURE.md (INCORRECT)
match /journal/{entryId} {
  allow read: if request.auth != null && request.auth.uid == uid;
  allow create, update: if request.auth != null
                        && request.auth.uid == uid
                        && request.resource.data.keys().hasAll(['type', 'createdAt']);
}
```

The **actual** `firestore.rules` explicitly blocks all direct writes:

```javascript
// Actual firestore.rules (CORRECT)
match /users/{userId}/journal/{entryId} {
  allow read: if isOwner(userId);
  allow create, update: if false;  // ALL writes must go through Cloud Functions
  allow delete: if isOwner(userId);
}
```

The same discrepancy applies to `daily_logs` and `inventoryEntries`. `CLAUDE.md`
correctly states "NO DIRECT WRITES to journal, daily_logs, inventoryEntries —
use Cloud Functions", but `ARCHITECTURE.md` shows the opposite pattern in an
authoritative-looking code block.

**Risk:** A developer reading ARCHITECTURE.md could implement direct Firestore
writes, bypassing App Check, rate limiting, and Zod validation. This is a
security architecture documentation failure.

**Recommendation:** Update `ARCHITECTURE.md` Section 4 (Security Architecture)
to show the actual `if false` rules with explanatory comments matching the real
file.

---

#### F2: ARCHITECTURE.md Cloud Functions Structure Does Not Match Reality

**File:** `ARCHITECTURE.md` (lines 479–490)

**Description:** `ARCHITECTURE.md` shows this Cloud Functions structure:

```
functions/
├── src/
│   ├── index.ts
│   ├── journal/
│   │   └── validators.ts
│   ├── admin/
│   │   └── setAdminClaim.ts
│   └── utils/
│       ├── rateLimiter.ts
│       └── logger.ts
```

The **actual** `functions/src/` directory contains:

```
functions/src/
├── index.ts
├── admin.ts              (not admin/setAdminClaim.ts)
├── firestore-rate-limiter.ts
├── jobs.ts
├── recaptcha-verify.ts
├── schemas.ts
├── security-logger.ts
└── security-wrapper.ts
```

None of the subdirectories (`journal/`, `admin/`, `utils/`) exist. The
validators are in `schemas.ts`, rate limiting is in `firestore-rate-limiter.ts`,
and logging is in `security-logger.ts`.

**Risk:** New developers setting up Cloud Functions or trying to locate business
logic will waste significant time navigating to non-existent paths.

**Recommendation:** Replace the entire "Cloud Functions Architecture" section in
`ARCHITECTURE.md` with the correct flat file structure and update function
descriptions to reference actual files.

---

### S2 — Medium Severity

---

#### F3: README Test Count is Severely Stale

**File:** `README.md` (line 111, 273)

**Description:** README.md states: "**Testing**: Node test runner, c8 coverage
(97.8% passing)" and "**Test Status:** 89/91 passing (97.8%)".

`SESSION_CONTEXT.md` (the authoritative current-state document, updated
2026-02-22) shows: "**Test Status**: 99.7% pass rate (293/294 tests passing, 1
skipped)".

The test suite has grown from 91 to 294 tests — more than 3x — without README
being updated. The README `Last Updated` date is 2026-01-03, meaning it is 50+
days stale on this metric.

**Recommendation:** Update README test status line. Consider adding
`npm run docs:update-readme` to pre-commit or CI to auto-sync these metrics.

---

#### F4: Duplicate CLAUDE.md / claude.md with Inconsistent References

**Files:** `CLAUDE.md`, `claude.md`, `README.md`

**Description:** Two identical files exist in the project root: `CLAUDE.md`
(uppercase, loaded as Claude Code project instructions) and `claude.md`
(lowercase, a byte-for-byte duplicate). This is confirmed by `diff` showing no
differences.

`README.md` links to `claude.md` (lowercase) throughout, while the canonical
project instructions file is `CLAUDE.md` (uppercase). Cross-document references
within `docs/agent_docs/CODE_PATTERNS.md` also use `claude.md`.

**Risk:** If `claude.md` is ever deleted or diverges from `CLAUDE.md`,
references from README.md and other docs will silently point to the wrong file.
On case-sensitive filesystems (Linux CI), `claude.md` would be a different file
from `CLAUDE.md`.

**Recommendation:** Delete `claude.md` and update all references to use
`CLAUDE.md`. Alternatively, make `claude.md` a symlink, but the cleanest
solution is a single canonical uppercase file matching Claude Code convention.

---

#### F5: README Agent and Skill Counts Are Incorrect

**File:** `README.md` (lines 117, 152–154)

**Description:** README.md states: "24 specialized AI agents" and "23
task-specific skills". Actual counts:

- `.claude/agents/`: **25 files** (not 24)
- `.claude/skills/`: **59 directories** (not 23)

The skill count is particularly wrong — more than 2.5x the documented number.
The README was likely written when there were 23 skills and never updated as the
toolchain expanded.

**Recommendation:** Update counts in README.md. Consider generating this
dynamically via `npm run docs:update-readme` to prevent future staleness.

---

#### F6: DOCUMENTATION_STANDARDS References Non-Existent File

**File:** `docs/DOCUMENTATION_STANDARDS.md` (line 178)

**Description:** `DOCUMENTATION_STANDARDS.md` lists Tier 4 reference documents
including `MULTI_AI_REVIEW_COORDINATOR.md`. A full project search confirms this
file does not exist anywhere in the repository. It was either never created or
was renamed/deleted.

The multi-AI audit coordinator document that does exist is
`docs/audits/multi-ai/COORDINATOR.md`, which is referenced correctly in
`AI_WORKFLOW.md`. `DOCUMENTATION_STANDARDS.md` appears to reference an older
planned-but-never-created document.

**Recommendation:** Remove the `MULTI_AI_REVIEW_COORDINATOR.md` entry from
`docs/DOCUMENTATION_STANDARDS.md` Tier 4 document list, or replace it with the
correct path `docs/audits/multi-ai/COORDINATOR.md`.

---

#### F7: README Roadmap Module Mapping Shows Growth as "Planned" but It Is Implemented

**File:** `README.md` (lines 239–248)

**Description:** The "Roadmap Module Mapping" table in README.md shows:

| Roadmap tab | Implementation                            | Status  | Feature flag                |
| ----------- | ----------------------------------------- | ------- | --------------------------- |
| Growth      | `roadmap-modules.tsx` → `PlaceholderPage` | Planned | `NEXT_PUBLIC_ENABLE_GROWTH` |

However, `components/notebook/pages/growth-page.tsx` exists and is a full
implementation. The `components/growth/` directory contains `SpotCheckCard.tsx`,
`NightReviewCard.tsx`, `GratitudeCard.tsx`, `Step1WorksheetCard.tsx`, and
`DailySloganWidget.tsx` — a complete feature set.

The "Growth" tab appears in `Current Features (MVP)` in the same README:
"**Growth Tab**: Spot checks, night reviews, gratitude lists" — directly
contradicting the "Planned" status in the table.

**Recommendation:** Update the Roadmap Module Mapping table to show Growth as
Available with `components/notebook/pages/growth-page.tsx` as the
implementation. Remove the feature flag entry if the flag is no longer used.

---

#### F8: DEVELOPMENT.md Project Structure Missing Significant lib/ Subdirectories

**File:** `DEVELOPMENT.md` (lines 169–185)

**Description:** `DEVELOPMENT.md` documents the `lib/` directory as containing
only:

```
lib/
├── firebase.ts
├── firestore-service.ts
├── logger.ts
├── utils.ts
├── auth/
├── database/
└── security/
```

The actual `lib/` directory contains 8 subdirectories:

```
lib/
├── auth/
├── contexts/     ← MISSING from docs
├── database/
├── db/           ← MISSING from docs
├── hooks/        ← MISSING from docs
├── security/
├── types/        ← MISSING from docs
└── utils/        ← MISSING from docs (shown as file, not dir)
```

The `utils/` entry is listed as a single file (`utils.ts`) but it is actually a
directory containing 12 utility modules (`rate-limiter.ts`, `retry.ts`,
`callable-errors.ts`, etc.).

**Recommendation:** Update the `DEVELOPMENT.md` project structure to reflect all
`lib/` subdirectories. The `utils/` in the structure should show it as a
directory with key files listed.

---

#### F9: ROADMAP.md "Last Updated" Uses Session Number, Not Date

**File:** `ROADMAP.md` (line 6)

**Description:** `ROADMAP.md` header shows `**Last Updated:** Session #151`. The
current session is #180, meaning the version header has not been updated in 29+
sessions. The actual ROADMAP content has been modified more recently (the file
shows `Last Modified: 2026-02-22` in the documentation index), but the header
metadata is not synchronized.

`DOCUMENTATION_STANDARDS.md` requires Tier 1 documents to have "Last Updated"
dates. Session numbers are opaque to external developers and violate the spirit
of this requirement.

**Recommendation:** Update ROADMAP.md version header to use a date
(`2026-02-22`) instead of a session number. Consider updating the version to
reflect the actual current state (v3.25 in header but content reflects work
through Session #179).

---

#### F10: App Check Documented as Enabled but Is Disabled in Production

**Files:** `README.md`, `ARCHITECTURE.md`, `functions/src/index.ts`

**Description:** README.md lists "App Check" in the security stack.
`ARCHITECTURE.md` documents "Layer 2: App Check" as an active security layer
with description "Blocks bots and automated attacks. Required for production
Firestore access."

In reality, `functions/src/index.ts` has `requireAppCheck: false` on all 4
callable functions:

```typescript
requireAppCheck: false, // TEMPORARILY DISABLED - waiting for throttle to clear
```

This comment appears on `saveDailyLog`, `saveJournalEntry`,
`softDeleteJournalEntry`, and `saveInventoryEntry`. `migrateAnonymousUserData`
has the App Check block commented out entirely.

A `RECAPTCHA_REMOVAL_GUIDE.md` exists in docs/ confirming this is a known
long-standing issue ("Deferred - App Check blocking critical functionality",
last updated 2026-01-15).

The security documentation overstates the current security posture. DEBT-0854
tracks this.

**Recommendation:** Add a note to `ARCHITECTURE.md` Layer 2 and `README.md`
security section noting that App Check is temporarily disabled pending
resolution of DEBT-0854 (re-enable App Check). This is a documentation accuracy
issue, not a new bug — the bug is tracked.

---

### S3 — Low Severity

---

#### F11: ADR Directory Has Only One Archived ADR — No Active Records

**File:** `docs/decisions/README.md`

**Description:** The ADR (Architecture Decision Records) system is well-set-up
with a template, naming conventions, and an index. However, it contains only
`ADR-001` (archived, from 2026-01-03), which documented the choice of the
Integrated Improvement Plan approach — a plan now completed and archived.

Given the number of significant architectural decisions made since January 2026
(Cloud Functions pattern for all writes, TDMS design, pre-commit hook chain,
sprint skill architecture, etc.), the ADR log is effectively empty. Decisions of
this magnitude are the exact use case for ADRs.

The `docs/decisions/README.md` says "Create an ADR when making a significant
architectural choice" but the most recent 179 sessions have produced zero ADRs.

**Recommendation:** Create ADRs for the top 3-5 architectural decisions that
were made without formal documentation: (1) Cloud Functions-only write pattern,
(2) TDMS MASTER_DEBT.jsonl as canonical debt storage, (3) pre-commit hook chain
design. Prioritize future ADR creation per the documented triggers.

---

#### F12: ARCHITECTURE.md Shows FirestoreService as a Class, Actual is Factory Function

**File:** `ARCHITECTURE.md` (lines 666–679)

**Description:** `ARCHITECTURE.md` shows `FirestoreService` as a class:

```typescript
export class FirestoreService {
  async getUserProfile(userId: string) {...}
  // ...
}
```

The actual `lib/firestore-service.ts` uses the factory function pattern:

```typescript
export const createFirestoreService = (
  overrides: Partial<FirestoreDependencies> = {}
) => {
  // ...
};
export const FirestoreService = createFirestoreService();
```

This is a dependency-injection pattern for testability. The public API
(`FirestoreService.saveDailyLog(...)`) is the same, but the implementation
pattern is different from what the documentation shows.

**Recommendation:** Update the `ARCHITECTURE.md` Repository Pattern section to
show the factory function pattern. This is minor but matters for developers who
try to extend or mock the service.

---

## 4. Doc Coverage Matrix

| Area                                | Coverage | Quality         | Notes                                                                                   |
| ----------------------------------- | -------- | --------------- | --------------------------------------------------------------------------------------- |
| README / Project Overview           | High     | Medium          | Stale test counts, agent counts, Growth tab status                                      |
| API Documentation (Cloud Functions) | Medium   | Low             | `functions/src/index.ts` has JSDoc on each function but no standalone API reference doc |
| Firestore Schema                    | High     | High            | Both `ARCHITECTURE.md` and `firestore.rules` document schemas                           |
| Security Architecture               | High     | Medium          | Active App Check disabled; ARCHITECTURE.md rules are stale                              |
| Component Architecture              | Medium   | Medium          | ARCHITECTURE.md hierarchy accurate; DEVELOPMENT.md structure partially stale            |
| Onboarding (New Dev)                | Medium   | Medium          | `DEVELOPMENT.md` Quick Start is complete; project structure section is stale            |
| ADR / Decisions                     | Low      | High (template) | Template is excellent; no active ADRs since Jan 2026                                    |
| Testing Guide                       | High     | High            | `docs/TESTING_PLAN.md`, `docs/plans/TESTING_USER_MANUAL.md` both current                |
| AI Workflow                         | High     | High            | `AI_WORKFLOW.md`, `SESSION_CONTEXT.md` are current and well-maintained                  |
| Technical Debt                      | High     | High            | TDMS system is comprehensive; MASTER_DEBT.jsonl is authoritative                        |
| Agent/Skill Docs                    | High     | Medium          | 59 skills exist, counts in README outdated                                              |
| Security Docs                       | High     | Medium          | `docs/SECURITY.md`, `GLOBAL_SECURITY_STANDARDS.md` appear current                       |
| Cross-Doc Dependencies              | High     | High            | Automated by `npm run crossdoc:check`                                                   |
| Doc Index                           | High     | High            | Auto-generated by `npm run docs:index`, current as of today                             |

---

## 5. Recommendations

### Immediate Actions (High ROI, Low Effort)

1. **Fix README test count** (E0): Change "89/91 passing (97.8%)" to "293/294
   passing (99.7%)". Add to `npm run docs:update-readme` automation if not
   already covered.

2. **Fix README agent/skill counts** (E0): Change "24 agents" to "25" and "23
   skills" to "59".

3. **Fix ROADMAP.md Last Updated** (E0): Replace "Session #151" with
   "2026-02-22".

4. **Remove broken DOCUMENTATION_STANDARDS reference** (E0): Delete
   `MULTI_AI_REVIEW_COORDINATOR.md` from the Tier 4 document list in
   `docs/DOCUMENTATION_STANDARDS.md`.

5. **Fix README Growth tab status** (E0): Update Roadmap Module Mapping to show
   Growth as `Available` with the correct implementation path.

### Short-Term Actions (S1 Priority)

6. **Update ARCHITECTURE.md Firestore Security Rules** (E2): Replace the stale
   rules example in Section 4 with the actual rules from `firestore.rules`,
   including the `allow create, update: if false` pattern for
   journal/daily_logs/inventoryEntries. Add a note explaining the Cloud
   Functions-only write requirement.

7. **Update ARCHITECTURE.md Cloud Functions Structure** (E2): Replace the
   fabricated `functions/src/journal/`, `admin/`, `utils/` structure with the
   actual flat file structure. Map each file to its purpose.

8. **Delete claude.md (lowercase)** (E1): Remove the duplicate file. Update all
   references in README.md and other docs to point to `CLAUDE.md`.

### Medium-Term Actions

9. **Update DEVELOPMENT.md project structure** (E1): Add missing `lib/`
   subdirectories and correct `lib/utils` from file to directory.

10. **Add App Check disabled note** (E1): Add a visible note to
    `ARCHITECTURE.md` Layer 2 and README.md security section about DEBT-0854.
    Example: "Currently disabled (DEBT-0854) — manual reCAPTCHA verification is
    used as interim protection."

11. **Create 2-3 ADRs** (E3): Document Cloud Functions-only write pattern, TDMS
    architecture, and pre-commit hook chain. These are the highest-impact
    undocumented decisions from the past 6 months.

### Structural Observation

The documentation system is mature and has excellent tooling (auto-generated
index, cross-doc dependency checks, pattern compliance, doc headers validation).
The primary failure mode is that **code changes outpace documentation updates**,
particularly in structural files like `ARCHITECTURE.md` and `DEVELOPMENT.md`.
The automated tools like `npm run docs:accuracy` and `npm run docs:sync-check`
exist for this purpose — ensuring they run in CI or as part of the pre-commit
hook chain would close most of the sync gaps found in this audit.

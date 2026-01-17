# Implementation Plan

**Generated:** 2026-01-17 **Total Items:** 292 **PR Buckets:** 35

---

## Overview

This plan organizes the deduplicated findings into PR buckets for systematic
implementation.

### PR Bucket Summary

| Bucket                   | Items | S0  | S1  | S2  | S3  |
| ------------------------ | ----- | --- | --- | --- | --- |
| code-quality             | 93    | 0   | 20  | 46  | 27  |
| security-hardening       | 38    | 3   | 15  | 15  | 5   |
| performance-optimization | 31    | 1   | 7   | 20  | 3   |
| process-automation       | 24    | 1   | 3   | 9   | 11  |
| documentation-sync       | 24    | 0   | 4   | 12  | 8   |
| types-domain             | 10    | 0   | 2   | 6   | 2   |
| tests-hardening          | 7     | 0   | 4   | 3   | 0   |
| boundaries               | 6     | 0   | 2   | 2   | 2   |
| firebase-access          | 6     | 0   | 1   | 5   | 0   |
| misc                     | 6     | 1   | 0   | 2   | 3   |
| PR16                     | 6     | 0   | 2   | 4   | 0   |
| hooks-standardization    | 4     | 0   | 4   | 0   | 0   |
| offline-support          | 4     | 0   | 2   | 1   | 1   |
| dx-improvements          | 3     | 0   | 0   | 2   | 1   |
| ui-primitives            | 3     | 0   | 0   | 3   | 0   |
| PR3                      | 2     | 0   | 2   | 0   | 0   |
| PR4                      | 2     | 0   | 2   | 0   | 0   |
| PR6                      | 2     | 0   | 1   | 1   | 0   |
| PR7                      | 2     | 0   | 1   | 0   | 1   |
| PR11                     | 2     | 0   | 0   | 2   | 0   |
| PR15                     | 2     | 0   | 0   | 2   | 0   |
| PR-BATCH-AUTO            | 2     | 0   | 0   | 0   | 2   |
| PR2                      | 1     | 1   | 0   | 0   | 0   |
| PR8                      | 1     | 0   | 1   | 0   | 0   |
| PR-LINT-WARNINGS         | 1     | 0   | 0   | 1   | 0   |
| PR1                      | 1     | 1   | 0   | 0   | 0   |
| PR13                     | 1     | 0   | 1   | 0   | 0   |
| PR14                     | 1     | 0   | 1   | 0   | 0   |
| PR12                     | 1     | 0   | 0   | 1   | 0   |
| PR18                     | 1     | 1   | 0   | 0   | 0   |
| PR17                     | 1     | 0   | 1   | 0   | 0   |
| PR10                     | 1     | 0   | 0   | 1   | 0   |
| PR9                      | 1     | 0   | 0   | 1   | 0   |
| PR5                      | 1     | 1   | 0   | 0   | 0   |
| PR-BATCH-MANUAL          | 1     | 0   | 0   | 0   | 1   |

---

## Phase 1: Critical (S0) - Immediate Action

- [ ] **MASTER-0078**: App Check disabled on all production Cloud Functions
  - Effort: E2 | Bucket: security-hardening
  - Sources: CANON-0001

- [ ] **MASTER-0079**: Legacy journalEntries collection allows direct client
      writes (bypasses function security posture)
  - Effort: E2 | Bucket: security-hardening
  - Sources: CANON-0002, CANON-0034

- [ ] **MASTER-0120**: useJournal creates redundant auth listener + potential
      memory leak from nested cleanup
  - Effort: E1 | Bucket: performance-optimization
  - Sources: CANON-0044

- [ ] **MASTER-0140**: 47 CRITICAL cognitive complexity violations in scripts
      (19 functions)
  - Effort: E3 | Bucket: misc
  - Sources: CANON-0064

- [ ] **MASTER-0176**: Multiple CI quality gates configured as non-blocking
      (continue-on-error: true)
  - Effort: E2 | Bucket: process-automation
  - Sources: CANON-0105

- [ ] **MASTER-0190**: Re-enable App Check on Cloud Functions
  - Effort: E2 | Bucket: security-hardening
  - Sources: DEDUP-0001

- [ ] **MASTER-0191**: Close legacy journalEntries write path
  - Effort: E2 | Bucket: PR2
  - Sources: DEDUP-0002

- [ ] **MASTER-0212**: Fix useJournal memory leak
  - Effort: E1 | Bucket: PR1
  - Sources: DEDUP-0011

- [ ] **MASTER-0245**: Reduce 47 CRITICAL complexity functions
  - Effort: E3 | Bucket: PR18
  - Sources: DEDUP-0014, CANON-0068

- [ ] **MASTER-0276**: Convert CI gates to blocking
  - Effort: E2 | Bucket: PR5
  - Sources: DEDUP-0015

---

## Phase 2: High Priority (S1) - This Sprint

### code-quality

- [ ] **MASTER-0001**: 5 failing tests in check-docs-light.test.ts (E1)
- [ ] **MASTER-0004**: Very high cognitive complexity in adminListUsers (E2)
- [ ] **MASTER-0056**: TodayPage god component (1117 lines, 14 useState, 10
      useEffect, 24 imports) (E2)
- [ ] **MASTER-0057**: UsersTab god component (924 lines, 21 useState, 3
      useEffect) (E2)
- [ ] **MASTER-0060**: Time-of-day rotation logic duplicated in quotes.ts and
      slogans.ts (80+ lines) (E1)
- [ ] **MASTER-0063**: Direct Firebase SDK usage in 22+ files bypasses service
      layer (E2)
- [ ] **MASTER-0071**: No correlation IDs for request tracing (frontend to
      backend) (E2)
- [ ] **MASTER-0214**: Remove deprecated saveNotebookJournalEntry (E2)
- [ ] **MASTER-0215**: Separate domain/transport in useJournal (E2)
- [ ] **MASTER-0221**: Split TodayPage god component (E3)
- [ ] **MASTER-0222**: Explicit client providers wrapper (E1)
- [ ] **MASTER-0227**: Implement image optimization (E2)
- [ ] **MASTER-0228**: Fix TodayPage subscription bug (E0)
- [ ] **MASTER-0229**: Lazy load notebook modules (E2)
- [ ] **MASTER-0242**: Add Cloud Function security tests (E2)
- [ ] **MASTER-0243**: Add Firestore rules emulator tests (E2)
- [ ] **MASTER-0244**: Increase security file coverage (E2)
- [ ] **MASTER-0277**: Add npm audit + CodeQL + Dependabot (E2)
- [ ] **MASTER-0278**: Add gcloud setup to deploy workflow (E1)
- [ ] **MASTER-0291**: Missing Security Headers (E0)

### security-hardening

- [ ] **MASTER-0015**: Missing critical security headers (E1)
- [ ] **MASTER-0016**: App Check disabled on Cloud Functions (E0)
- [ ] **MASTER-0080**: Console.\* usage in app components bypasses standardized
      logger/sanitization (E1)
- [ ] **MASTER-0082**: Client App Check initialization is disabled/commented out
      (E1)
- [ ] **MASTER-0085**: reCAPTCHA verification is logged but not enforced when
      configured (E1)
- [ ] **MASTER-0087**: Admin-claim Firestore rule writes lack function-only
      defense-in-depth (E2)
- [ ] **MASTER-0091**: reCAPTCHA verification coverage may be incomplete when
      App Check is disabled (needs verification) (E1)
- [ ] **MASTER-0092**: Potential rate limit bypass via cycling anonymous
      accounts (needs threat-model validation) (E2)
- [ ] **MASTER-0093**: Potential sensitive data in localStorage (needs audit)
      (E2)
- [ ] **MASTER-0111**: reCAPTCHA token missing does not block requests (logs but
      continues) (E1)
- [ ] **MASTER-0112**: Rate limiting is incomplete (no IP throttling, admin
      endpoints unthrottled, inconsistent 429-equivalent handling) (E2)
- [ ] **MASTER-0144**: App Check temporarily disabled across all Cloud Functions
      (E1)
- [ ] **MASTER-0195**: Restore client App Check init (E1)
- [ ] **MASTER-0196**: Admin-claim rules defense-in-depth (E2)
- [ ] **MASTER-0199**: Audit localStorage for sensitive data (E2)

### process-automation

- [ ] **MASTER-0177**: Automation scripts have critically low test coverage
      (2-7% of ~31 scripts) (E2)
- [ ] **MASTER-0178**: Missing security scanning in CI (npm audit, CodeQL,
      Dependabot) (E2)
- [ ] **MASTER-0179**: Deploy workflow calls gcloud without installing Google
      Cloud SDK (E1)

### documentation-sync

- [ ] **MASTER-0026**: 16 broken anchor links detected by docs:check (E1)
- [ ] **MASTER-0027**: 20 placeholder issues across 5 template instances (E1)
- [ ] **MASTER-0162**: Broken relative links in review/output docs (wrong ../
      depth) (E1)
- [ ] **MASTER-0163**: [X] placeholders remain in 2026-Q1 plan instances (E1)

### performance-optimization

- [ ] **MASTER-0036**: Large monolithic component (1117 lines) without code
      splitting (E2)
- [ ] **MASTER-0037**: No React.memo on frequently re-rendered admin list (924
      lines) (E1)
- [ ] **MASTER-0121**: Landing page forced to client-side rendering blocks SSR
      for LCP route (E2)
- [ ] **MASTER-0122**: Excessive 'use client' directives prevent SSR
      optimization (E2)
- [ ] **MASTER-0123**: Static export disables Next.js image optimization (E2)
- [ ] **MASTER-0124**: TodayPage re-subscribes on journalEntry change (E0)
- [ ] **MASTER-0125**: Notebook module registry eagerly imports all pages (E2)

### hooks-standardization

- [ ] **MASTER-0064**: Deprecated saveNotebookJournalEntry still used in 6+ UI
      components (E2)
- [ ] **MASTER-0083**: Cloud Function error handling duplicated (4 locations) +
      duplicate CloudFunctionError type definitions (E1)
- [ ] **MASTER-0084**: Critical logic divergence in journal saving (deprecated
      FirestoreService path bypasses hook business logic) (E1)
- [ ] **MASTER-0145**: useJournal mixes domain logic with transport
      (httpsCallable + retry + recaptcha) (E2)

### offline-support

- [ ] **MASTER-0074**: No offline write queue - data loss when user goes offline
      (E3)
- [ ] **MASTER-0075**: No Firebase persistence enabled - Firestore cache not
      persisted (E1)

### types-domain

- [ ] **MASTER-0081**: Cloud Function schema missing 'step-1-worksheet' journal
      entry type (validation drift / feature break) (E0)
- [ ] **MASTER-0142**: Journal entry type definitions diverge between client
      types and server schemas (E2)

### boundaries

- [ ] **MASTER-0086**: Server layout composes client providers; boundary should
      be explicit (E1)
- [ ] **MASTER-0146**: TodayPage is a god component mixing 4+ responsibilities
      (E3)

### tests-hardening

- [ ] **MASTER-0088**: Missing automated tests for Cloud Function security
      layers (App Check / rate limiting / authz) (E2)
- [ ] **MASTER-0089**: No integration tests for Firestore rules (emulator-based)
      (E2)
- [ ] **MASTER-0090**: Security-critical files have low test coverage
      (account-linking, firestore-service, recaptcha, users DB) (E2)
- [ ] **MASTER-0143**: No test coverage for high-complexity scripts (E2)

### firebase-access

- [ ] **MASTER-0141**: Cloud Function error handling pattern duplicated 4-6x
      across service and hooks (E1)

### PR3

- [ ] **MASTER-0192**: Make reCAPTCHA fail-closed (E1)
- [ ] **MASTER-0197**: Verify reCAPTCHA coverage (E1)

### PR4

- [ ] **MASTER-0193**: Complete rate limiting (IP + admin) (E2)
- [ ] **MASTER-0198**: Rate limit bypass mitigation (E2)

### PR8

- [ ] **MASTER-0194**: Replace console.\* with logger (E1)

### PR6

- [ ] **MASTER-0203**: Fix journal entry type mismatch (E0)

### PR7

- [ ] **MASTER-0213**: Extract error handling utility (E1)

### PR13

- [ ] **MASTER-0219**: Enable SSR for landing page (E2)

### PR14

- [ ] **MASTER-0220**: Reduce 'use client' directives (E2)

### PR17

- [ ] **MASTER-0246**: Add script test coverage (CI) (E2)

### PR16

- [ ] **MASTER-0261**: Fix broken relative links (E1)
- [ ] **MASTER-0262**: Replace [X] placeholders (E1)

---

## Phase 3: Medium Priority (S2) - Next Sprint

### code-quality

- [ ] **MASTER-0002**: Debug console.log statements in production code (E1)
- [ ] **MASTER-0003**: High cognitive complexity in adminSetUserPrivilege (E2)
- [ ] **MASTER-0005**: High cognitive complexity in UsersTab component (E2)
- [ ] **MASTER-0007**: No correlation/request ID tracing (E2)
- [ ] **MASTER-0012**: Nested component definition (E1)
- [ ] **MASTER-0058**: Step1WorksheetCard large component (845 lines) with
      nested conditionals (E2)
- [ ] **MASTER-0059**: ResourcesPage large component (728 lines) mixing meetings
      and sober homes (E2)
- [ ] **MASTER-0061**: reCAPTCHA token fetch pattern repeated 5x across codebase
      (E1)
- [ ] **MASTER-0062**: Growth card dialog/save pattern duplicated across 4
      components (E2)
- [ ] **MASTER-0072**: 8:1 ratio of console.log to structured logger calls (3111
      vs 394) (E2)
- [ ] **MASTER-0204**: Add error.message null safety (E0)
- [ ] **MASTER-0205**: Safe localStorage JSON.parse (E0)
- [ ] **MASTER-0206**: Add .strict() to Zod schemas (E2)
- [ ] **MASTER-0207**: Replace unsafe type assertions (E1)
- [ ] **MASTER-0209**: Type httpsCallable generics (E1)
- [ ] **MASTER-0218**: Extract useGrowthCardDialog hook (E2)
- [ ] **MASTER-0223**: Route Firebase through service layer (E2)
- [ ] **MASTER-0225**: Clarify FirestoreAdapter boundary (E2)
- [ ] **MASTER-0226**: Audit inventory dual-write pattern (E2)
- [ ] **MASTER-0230**: Complete Sentry integration (E1)
- [ ] **MASTER-0231**: Add reduced-motion to animations (E1)
- [ ] **MASTER-0232**: Add React.memo to list components (E1)
- [ ] **MASTER-0233**: Optimize hero background image (E1)
- [ ] **MASTER-0236**: Remove 7 unused dependencies (E0)
- [ ] **MASTER-0237**: Add Firebase query indexes (E1)
- [ ] **MASTER-0238**: Paginate admin CRUD table (E2)
- [ ] **MASTER-0240**: Add loading.tsx files (E1)
- [ ] **MASTER-0241**: Lazy load JournalHub forms (E2)
- [ ] **MASTER-0247**: Unskip Cloud Function test (E2)
- [ ] **MASTER-0248**: Add useJournal hook tests (E2)
- [ ] **MASTER-0249**: Increase critical path coverage (E2)
- [ ] **MASTER-0252**: Create CRUD factory (E2)
- [ ] **MASTER-0253**: Centralize admin function wrappers (E1)
- [ ] **MASTER-0254**: Extract safeReadFile/safeWriteFile (E1)
- [ ] **MASTER-0255**: Consolidate searchable-text generation (E1)
- [ ] **MASTER-0266**: Update DOCUMENT_DEPENDENCIES sync (E1)
- [ ] **MASTER-0267**: Add PR_REVIEW_PROMPT metadata (E1)
- [ ] **MASTER-0269**: Update DEVELOPMENT.md workflow docs (E1)
- [ ] **MASTER-0279**: Move full tests to pre-push only (E1)
- [ ] **MASTER-0280**: Pin firebase-tools version (E0)
- [ ] **MASTER-0281**: Fix auto-label workflow if syntax (E0)
- [ ] **MASTER-0287**: Fix docs:check False Positives (E1)
- [ ] **MASTER-0288**: Add Missing Script Triggers to Session Start (E0)
- [ ] **MASTER-0289**: Add CANON Validation to CI Pipeline (E1)
- [ ] **MASTER-0292**: No Firebase Storage Rules (E0)
- [ ] **MASTER-0239**: Decompose Step1WorksheetCard (E3)

### security-hardening

- [ ] **MASTER-0017**: Hardcoded reCAPTCHA site key fallback (E0)
- [ ] **MASTER-0019**: OS command execution in CLI scripts (E2)
- [ ] **MASTER-0020**: ReDoS vulnerable regex patterns (E2)
- [ ] **MASTER-0096**: ESLint security plugin warnings in scripts (unsafe regex
      / non-literal fs / object injection patterns) (E2)
- [ ] **MASTER-0113**: Zod schemas missing .strict() (unknown fields accepted)
      (E0)
- [ ] **MASTER-0114**: Hardcoded fallback reCAPTCHA site key in server
      verification code (config integrity/rotation risk) (E1)
- [ ] **MASTER-0115**: Server-side journal entry type enum missing
      'step-1-worksheet' (validation drift) (E1)
- [ ] **MASTER-0116**: Permissive z.record(..., z.unknown()) allows arbitrary
      nested data in journal/inventory entries (E2)
- [ ] **MASTER-0117**: Some admin-managed collections allow direct client writes
      without centralized schema/rate-limit protections (E1)
- [ ] **MASTER-0118**: Console statements present; replace with structured
      logger and enforce no-console in production (E1)
- [ ] **MASTER-0149**: reCAPTCHA token fetch/include pattern repeated 5x across
      codebase (E1)
- [ ] **MASTER-0151**: reCAPTCHA action strings duplicated as literals (no
      shared constants) (E1)
- [ ] **MASTER-0158**: Searchable-text generation duplicated with inconsistent
      sanitization (E1)
- [ ] **MASTER-0201**: Remove hardcoded reCAPTCHA fallback (E1)
- [ ] **MASTER-0202**: Route admin writes through Functions (E1)

### process-automation

- [ ] **MASTER-0022**: GitHub Actions using version tags instead of commit SHAs
      (E1)
- [ ] **MASTER-0050**: 28 scripts have 715 console.log/error/warn calls without
      structured logging (E1)
- [ ] **MASTER-0054**: Artifact upload without retention policy (E1)
- [ ] **MASTER-0055**: Git diff with @{u}...HEAD fails on new branches without
      upstream (E1)
- [ ] **MASTER-0180**: DEVELOPMENT.md workflow triggers don't match actual
      workflow YAML (E1)
- [ ] **MASTER-0181**: Pre-commit hook runs full test suite causing slow commits
      (~50s+) (E1)
- [ ] **MASTER-0182**: Pattern checker reports 93+ violations but CI check is
      non-blocking (E2)
- [ ] **MASTER-0183**: Firebase CLI version unpinned in deploy workflow (E0)
- [ ] **MASTER-0184**: Auto-label workflow has invalid if: expression syntax
      (E0)

### documentation-sync

- [ ] **MASTER-0028**: 99 files fail docs:check (313 errors, 177 warnings) (E1)
- [ ] **MASTER-0029**: TRIGGERS.md last updated 2026-01-02 (15 days stale) (E0)
- [ ] **MASTER-0030**: DOCUMENTATION_STANDARDS.md last updated 2026-01-01 (16
      days stale) (E0)
- [ ] **MASTER-0031**: DOCUMENT_DEPENDENCIES.md claims SYNCED but sync check
      reports 20 issues (E1)
- [ ] **MASTER-0032**: 15 recent commits touch docs but AUDIT_TRACKER shows only
      5 categories audited today (E1)
- [ ] **MASTER-0164**: DOCUMENTATION_INDEX.md orphaned and missing required
      sections (E1)
- [ ] **MASTER-0165**: Tier 2 docs missing required metadata (Document Version,
      Applies To) (E1)
- [ ] **MASTER-0166**: Standards/templates contain live placeholder links and
      incorrect anchors (E0)
- [ ] **MASTER-0167**: DOCUMENT_DEPENDENCIES.md claims SYNCED but has 30+ issues
      (E1)
- [ ] **MASTER-0168**: PR_REVIEW_PROMPT_TEMPLATE lacks required metadata and
      version history (E1)
- [ ] **MASTER-0169**: CODE_PATTERNS.md referenced with incorrect path (E0)
- [ ] **MASTER-0170**: Duplicate CODE_REVIEW_PLAN_2026_Q1.md exists in two
      locations (E0)

### performance-optimization

- [ ] **MASTER-0038**: 30+ components with inline onClick arrow functions (E1)
- [ ] **MASTER-0039**: 28 components with inline style objects (E1)
- [ ] **MASTER-0040**: Large chunk file (628KB) indicates code splitting
      opportunity (E1)
- [ ] **MASTER-0041**: 20+ uses of key={index} in list rendering (E0)
- [ ] **MASTER-0042**: setInterval without visibility check continues in
      background (E1)
- [ ] **MASTER-0043**: getAllMeetings() deprecated but still available without
      limit (E1)
- [ ] **MASTER-0126**: Sentry integration incomplete - no Web Vitals reporting
      (E1)
- [ ] **MASTER-0127**: Duplicate DailyQuoteCard implementations + unbounded
      quotes fetch (E1)
- [ ] **MASTER-0128**: Celebration animations create 150+ DOM elements without
      reduced-motion support (E1)
- [ ] **MASTER-0129**: No React.memo usage causes unnecessary re-renders in list
      components (E1)
- [ ] **MASTER-0130**: Hero background image bypasses Next.js image optimization
      (E1)
- [ ] **MASTER-0131**: Large entry lists not virtualized - DOM grows linearly
      with data (E2)
- [ ] **MASTER-0132**: Meeting map renders all markers without clustering (E2)
- [ ] **MASTER-0133**: 7 unused dependencies increasing bundle size (E0)
- [ ] **MASTER-0134**: Console statements in production code (E0)
- [ ] **MASTER-0135**: Firebase queries lack consistent indexing and limits (E1)
- [ ] **MASTER-0136**: Admin CRUD table fetches entire collections without
      pagination (E2)
- [ ] **MASTER-0138**: No route-level loading UI (loading.tsx) or Suspense
      boundaries (E1)
- [ ] **MASTER-0139**: JournalHub eagerly imports all entry forms (E2)
- [ ] **MASTER-0137**: Step1WorksheetCard excessive complexity (804 lines) (E3)

### dx-improvements

- [ ] **MASTER-0068**: No npm run dev:offline script - requires 2 terminals for
      emulator dev (E0)
- [ ] **MASTER-0069**: No scripts/doctor.js for environment validation (E1)

### offline-support

- [ ] **MASTER-0076**: No service worker - no offline asset caching (E2)

### types-domain

- [ ] **MASTER-0095**: Unsafe type assertions with 'as unknown as' (worksheet +
      related components) (E1)
- [ ] **MASTER-0097**: Journal entry type definitions duplicated across client
      types and server schemas (single-source refactor) (E2)
- [ ] **MASTER-0098**: Missing error.message null safety in TodayPage catch
      block (E0)
- [ ] **MASTER-0099**: Unsafe localStorage JSON.parse in use-smart-prompts hook
      (E0)
- [ ] **MASTER-0102**: Inconsistent httpsCallable typing (missing generic
      request/response types) (E1)
- [ ] **MASTER-0105**: Journal entry schema data is weakly typed (z.record
      unknown; per-type validation not enforced) (E2)

### boundaries

- [ ] **MASTER-0103**: useJournal sets up its own auth listener instead of using
      shared auth context (E1)
- [ ] **MASTER-0157**: FirestoreAdapter exists but is unused (realtime boundary
      unclear) (E2)

### tests-hardening

- [ ] **MASTER-0104**: Cloud Function integration test is skipped in
      firestore-service test suite (E2)
- [ ] **MASTER-0106**: No tests for useJournal hook (E2)
- [ ] **MASTER-0148**: Critical paths have low test coverage (firestore-service
      35.6%, account-linking 17.29%) (E2)

### ui-primitives

- [ ] **MASTER-0094**: Duplicated time-of-day rotation logic for quotes and
      slogans (E1)
- [ ] **MASTER-0100**: Duplicated DailyQuoteCard component exists in multiple
      directories (2 confirmed; possible 3rd variant) (E1)
- [ ] **MASTER-0147**: DailyQuoteCard component duplicated across 2-3 locations
      (E1)

### firebase-access

- [ ] **MASTER-0101**: Inconsistent Firebase Functions import pattern (static vs
      dynamic imports) (E1)
- [ ] **MASTER-0150**: Firebase collection access scattered across 22+ files
      without type safety (E2)
- [ ] **MASTER-0152**: CRUD service patterns repeated across lib/db modules (E2)
- [ ] **MASTER-0153**: Admin Cloud Function wiring duplicated across 5 admin
      tabs (E1)
- [ ] **MASTER-0154**: Dual-write pattern to inventory AND journal collections
      (E2)

### misc

- [ ] **MASTER-0155**: Deprecated API usage (31 instances) + Nested ternaries
      (41 instances) (E2)
- [ ] **MASTER-0156**: safeReadFile/safeWriteFile utilities duplicated across 3
      scripts (E1)

### PR-LINT-WARNINGS

- [ ] **MASTER-0200**: Address ESLint security warnings (E2)

### PR6

- [ ] **MASTER-0208**: Single source for journal types (E2)

### PR11

- [ ] **MASTER-0216**: Create callSecureFunction wrapper (E1)
- [ ] **MASTER-0217**: Shared reCAPTCHA action constants (E1)

### PR12

- [ ] **MASTER-0224**: Create typed collection helpers (E2)

### PR15

- [ ] **MASTER-0234**: Add virtualization to large lists (E2)
- [ ] **MASTER-0235**: Add marker clustering to map (E2)

### PR10

- [ ] **MASTER-0250**: Extract time rotation utilities (E1)

### PR9

- [ ] **MASTER-0251**: Consolidate DailyQuoteCard (E1)

### PR16

- [ ] **MASTER-0263**: Add DOCUMENTATION_INDEX to README (E1)
- [ ] **MASTER-0264**: Add Tier 2 required metadata (E1)
- [ ] **MASTER-0265**: Fix standards placeholder links (E0)
- [ ] **MASTER-0268**: Fix CODE_PATTERNS.md path references (E0)

---

## Phase 4: Low Priority (S3) - Backlog

### code-quality

- [ ] **MASTER-0006**: void operator usage flagged by SonarCloud (E0)
- [ ] **MASTER-0008**: @ts-expect-error suppression for type mismatch (E0)
- [ ] **MASTER-0009**: TODO comment for unimplemented feature (E0)
- [ ] **MASTER-0010**: TODO comment for user preferences feature (E0)
- [ ] **MASTER-0024**: process.env.NODE_ENV checks for debug info (E0)
- [ ] **MASTER-0065**: CloudFunctionError interface defined twice in same file
      (E0)
- [ ] **MASTER-0066**: 2 tracked TODO markers in codebase (E0)
- [ ] **MASTER-0210**: Fix @ts-expect-error suppression (E0)
- [ ] **MASTER-0260**: Extract parseTime helper (E0)
- [ ] **MASTER-0271**: Replace template date placeholders (E0)
- [ ] **MASTER-0272**: Move PR template to docs/templates/ (E0)
- [ ] **MASTER-0273**: Update DEVELOPMENT.md test count (E0)
- [ ] **MASTER-0274**: Document fragile anchor links (E0)
- [ ] **MASTER-0275**: Update Husky docs for patterns:check (E0)
- [ ] **MASTER-0282**: Add explicit permissions block (E0)
- [ ] **MASTER-0290**: Add npm Commands for Undocumented Scripts (E0)
- [ ] **MASTER-0011**: Useless assignment to hasMore variable (E1)
- [ ] **MASTER-0013**: Nested ternary operator (E1)
- [ ] **MASTER-0014**: Nested template literals (6 occurrences) (E1)
- [ ] **MASTER-0067**: 4 linter suppressions in codebase (ts-ignore,
      ts-expect-error, eslint-disable) (E1)
- [ ] **MASTER-0211**: Replace 'any' with proper types (E1)
- [ ] **MASTER-0283**: Improve deploy secret handling (E1)
- [ ] **MASTER-0284**: Retrofit SSR-Safe localStorage (E1)
- [ ] **MASTER-0286**: Missing "AI Instructions" Sections (E1)
- [ ] **MASTER-0073**: Error messages lack actionable fix hints - generic
      'Please try again' (E1)
- [ ] **MASTER-0270**: Fix archive link rot (E2)
- [ ] **MASTER-0285**: Missing "Quick Start" Sections (E2)

### security-hardening

- [ ] **MASTER-0018**: SonarCloud: Potentially hard-coded password pattern (E0)
- [ ] **MASTER-0021**: Math.random for visual effects (E0)
- [ ] **MASTER-0023**: Secrets expanded in run block (E0)
- [ ] **MASTER-0025**: Agent config files present (E0)
- [ ] **MASTER-0119**: App Check disabled on Functions and client init disabled
      (tracked as risk-accepted hardening item) (E1)

### process-automation

- [ ] **MASTER-0047**: tj-actions/changed-files without CVE-pinned version (E0)
- [ ] **MASTER-0048**: lint-staged using npx --no-install may fail if not in
      cache (E0)
- [ ] **MASTER-0049**: Multiple trap commands may override each other (E0)
- [ ] **MASTER-0051**: Script has minimal console output (1 call) (E0)
- [ ] **MASTER-0052**: TRIGGERS.md last updated 2026-01-02 but hooks updated
      since (E0)
- [ ] **MASTER-0053**: All 12 slash commands have frontmatter descriptions (E0)
- [ ] **MASTER-0185**: DEVELOPMENT.md Husky section missing pattern compliance
      step (E0)
- [ ] **MASTER-0186**: CI workflow lacks explicit permissions block (security
      hardening) (E0)
- [ ] **MASTER-0187**: Pattern checker produces false positives for controlled
      npm install fallbacks (E1)
- [ ] **MASTER-0188**: Review trigger thresholds may cause alert fatigue for
      process changes (E1)
- [ ] **MASTER-0189**: Deploy workflow secret handling may be brittle for
      multiline JSON (E1)

### documentation-sync

- [ ] **MASTER-0034**: PR_REVIEW_PROMPT_TEMPLATE.md lacks Last Updated and
      Version History (now archived) (E0)
- [ ] **MASTER-0035**: DOCUMENTATION_INDEX.md orphaned - not referenced by any
      markdown file (E0)
- [ ] **MASTER-0172**: Template date placeholders using literal YYYY-MM-DD
      format (E0)
- [ ] **MASTER-0173**: Template docs located outside docs/templates/ directory
      (E0)
- [ ] **MASTER-0174**: Test count mismatch between DEVELOPMENT.md and actual
      test suite (E0)
- [ ] **MASTER-0175**: ROADMAP anchor links may be fragile due to
      emoji/punctuation in headings (E0)
- [ ] **MASTER-0033**: Archive docs contain significant link rot after moves
      (E2)
- [ ] **MASTER-0171**: Archive docs contain significant link rot after
      archival/moves (E2)

### performance-optimization

- [ ] **MASTER-0044**: Only 6 dynamic imports despite 101 client components (E1)
- [ ] **MASTER-0045**: useMemo/useCallback usage is inconsistent (E1)
- [ ] **MASTER-0046**: Image optimization disabled (unoptimized: true) (E2)

### dx-improvements

- [ ] **MASTER-0070**: Setup requires multiple commands - no single bootstrap
      (E0)

### offline-support

- [ ] **MASTER-0077**: OfflineIndicator is display-only - no sync status or
      retry mechanism (E1)

### types-domain

- [ ] **MASTER-0107**: @ts-expect-error suppression comment in production code
      (E0)
- [ ] **MASTER-0109**: 'any' types leaking into production code (needs
      tightening) (E1)

### boundaries

- [ ] **MASTER-0108**: Environment variables accessed directly in components
      (centralize in typed config) (E0)
- [ ] **MASTER-0110**: Landing page forced to client component for top-level
      state (E1)

### misc

- [ ] **MASTER-0159**: Batch fix opportunities: 200+ ESLint auto-fixable issues
      (E0)
- [ ] **MASTER-0161**: parseTime() meeting helper duplicated in two pages (E0)
- [ ] **MASTER-0160**: Batch fix opportunities: 79 replaceAll() + 71 node:
      prefix modernizations (E1)

### PR7

- [ ] **MASTER-0257**: Remove duplicate CloudFunctionError (E0)

### PR-BATCH-AUTO

- [ ] **MASTER-0258**: Run ESLint auto-fix (E0)
- [ ] **MASTER-0259**: replaceAll + node: prefix batch (E1)

### PR-BATCH-MANUAL

- [ ] **MASTER-0256**: Fix deprecated APIs + nested ternaries (E2)

---

## Dependency Chain

Items with dependencies should be implemented in order:

- MASTER-0064 depends on: CANON-0067
- MASTER-0078 depends on: CANON-0003
- MASTER-0080 depends on: CANON-0023
- MASTER-0084 depends on: CANON-0007
- MASTER-0088 depends on: CANON-0001, CANON-0002
- MASTER-0089 depends on: CANON-0002, CANON-0008
- MASTER-0091 depends on: CANON-0004, CANON-0001
- MASTER-0095 depends on: CANON-0007
- MASTER-0097 depends on: CANON-0007
- MASTER-0103 depends on: CANON-0006
- MASTER-0105 depends on: CANON-0016
- MASTER-0106 depends on: CANON-0006
- MASTER-0141 depends on: CANON-0087
- MASTER-0145 depends on: CANON-0076, CANON-0066
- MASTER-0146 depends on: CANON-0075, CANON-0076
- MASTER-0148 depends on: CANON-0066
- MASTER-0149 depends on: CANON-0066
- MASTER-0152 depends on: CANON-0077
- MASTER-0153 depends on: CANON-0076
- MASTER-0157 depends on: CANON-0075
- MASTER-0190 depends on: DEDUP-0003, DEDUP-0004
- MASTER-0193 depends on: DEDUP-0003
- MASTER-0195 depends on: DEDUP-0001
- MASTER-0197 depends on: DEDUP-0003
- MASTER-0198 depends on: DEDUP-0004
- MASTER-0208 depends on: DEDUP-0006
- MASTER-0214 depends on: DEDUP-0006
- MASTER-0215 depends on: DEDUP-0011
- MASTER-0216 depends on: DEDUP-0003
- MASTER-0217 depends on: CANON-0076
- MASTER-0220 depends on: DEDUP-0012
- MASTER-0223 depends on: CANON-0077
- MASTER-0225 depends on: CANON-0075
- MASTER-0242 depends on: DEDUP-0001
- MASTER-0245 depends on: CANON-0068
- MASTER-0248 depends on: DEDUP-0011
- MASTER-0252 depends on: CANON-0077

---

## Suggested PR Sequence

Based on severity, effort, and dependencies:

1. **Security Hardening PR** - All S0/S1 security items
2. **Performance Critical PR** - S0/S1 performance items
3. **Quick Wins PR** - E0 items across all categories
4. **Code Quality PR** - S2 code and refactoring items
5. **Documentation Sync PR** - All documentation items
6. **Process Automation PR** - CI/CD and process items

---

**Document Version:** 1.0 **Last Updated:** 2026-01-17

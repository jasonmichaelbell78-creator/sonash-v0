<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-01-30
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# NET NEW Findings - Roadmap Placement Suggestions

> Generated: 2026-01-30 | Session #116 Total NET NEW findings: 172

---

## S0-Critical (3 findings)

### → M2.3-REF (God Objects) / M2 Architecture

- **CANON-0064**: 47 CRITICAL cognitive complexity violations in scripts (19
  functions)...
  - File: `assign-review-tier.js` | Effort: E3

### → M2 - Code Quality / Track D (CI Reliability)

- **DEDUP-0014**: Reduce 47 CRITICAL complexity functions...
  - File: `N/A` | Effort: E3
- **DEDUP-0015**: Convert CI gates to blocking...
  - File: `N/A` | Effort: E2

## S1-High (42 findings)

### → M2 - Code Quality / Track D (CI Reliability)

- **CODE-001**: 5 failing tests in check-docs-light.test.ts...
  - File: `check-docs-light.test.ts:199` | Effort: E1
- **CANON-0005**: Client App Check initialization is disabled/commented out...
  - File: `firebase.ts` | Effort: E1
- **CANON-0008**: reCAPTCHA verification is logged but not enforced when
  configured...
  - File: `security-wrapper.ts` | Effort: E1
- **CANON-0010**: Admin-claim Firestore rule writes lack function-only
  defense-in-depth...
  - File: `firestore.rules` | Effort: E2
- **CANON-0012**: No integration tests for Firestore rules (emulator-based)...
  - File: `firestore.rules` | Effort: E2
- **CANON-0013**: Security-critical files have low test coverage
  (account-linking, fires...
  - File: `account-linking.ts` | Effort: E2
- **CANON-0015**: Potential rate limit bypass via cycling anonymous accounts
  (needs thre...
  - File: `auth-context.tsx` | Effort: E2
- **CANON-0016**: Potential sensitive data in localStorage (needs audit)...
  - File: `N/A` | Effort: E2
  - ... and 14 more

### → Track B-B8 (Document Sync Tab) / M2 Docs

- **DOC-001**: 16 broken anchor links detected by docs:check...
  - File: `SESSION_CONTEXT.md:47` | Effort: E1
- **DOC-002**: 20 placeholder issues across 5 template instances...
  - File: `PERFORMANCE_AUDIT_PLAN_2026_Q1.md:1` | Effort: E1
- **CANON-0091**: Broken relative links in review/output docs (wrong ../
  depth)...
  - File: `CODE_REVIEW_2026_Q1.md` | Effort: E1
- **CANON-0092**: [X] placeholders remain in 2026-Q1 plan instances...
  - File: `CODE_REVIEW_PLAN_2026_Q1.md` | Effort: E1

### → M2.3-REF (God Objects) / M2 Architecture

- **CANON-0070**: Deprecated saveNotebookJournalEntry still used in 6+ UI
  components...
  - File: `firestore-service.ts` | Effort: E2
- **CANON-0003**: Console.\* usage in app components bypasses standardized
  logger/sanitiz...
  - File: `library.ts` | Effort: E1
- **CANON-0007**: Critical logic divergence in journal saving (deprecated
  FirestoreServi...
  - File: `firestore-service.ts` | Effort: E1
- **CANON-0067**: Journal entry type definitions diverge between client types
  and server...
  - File: `journal.ts` | Effort: E2
- **CANON-0071**: useJournal mixes domain logic with transport (httpsCallable +
  retry + ...
  - File: `use-journal.ts` | Effort: E2

### → M4.5 - Security Enhancements / Track D-D5

- **CANON-0035**: reCAPTCHA token missing does not block requests (logs but
  continues)...
  - File: `security-wrapper.ts` | Effort: E1
- **CANON-0036**: Rate limiting is incomplete (no IP throttling, admin endpoints
  unthrot...
  - File: `security-wrapper.ts` | Effort: E2
- **CANON-0005**: Restore client App Check init...
  - File: `N/A` | Effort: E1
- **CANON-0010**: Admin-claim rules defense-in-depth...
  - File: `N/A` | Effort: E2
- **CANON-0014**: Verify reCAPTCHA coverage...
  - File: `N/A` | Effort: E1
- **CANON-0015**: Rate limit bypass mitigation...
  - File: `N/A` | Effort: E2
- **CANON-0016**: Audit localStorage for sensitive data...
  - File: `N/A` | Effort: E2

### → Track P - Performance Critical

- **CANON-0045**: Landing page forced to client-side rendering blocks SSR for
  LCP route...
  - File: `page.tsx` | Effort: E2
- **CANON-0049**: Notebook module registry eagerly imports all pages...
  - File: `roadmap-modules.tsx` | Effort: E2

### → Track D - CI Reliability / Track E (Solo Dev)

- **CANON-0106**: Automation scripts have critically low test coverage (2-7% of
  ~31 scri...
  - File: `` | Effort: E2
- **CANON-0108**: Deploy workflow calls gcloud without installing Google Cloud
  SDK...
  - File: `deploy-firebase.yml` | Effort: E1

## S2-Medium (78 findings)

### → Track D - CI Reliability / Track E (Solo Dev)

- **PROC-001**: GitHub Actions using version tags instead of commit SHAs...
  - File: `auto-label-review-tier.yml:18` | Effort: E1
- **PROC-009**: Artifact upload without retention policy...
  - File: `ci.yml:99` | Effort: E1
- **PROC-010**: Git diff with @{u}...HEAD fails on new branches without
  upstream...
  - File: `pre-push:48` | Effort: E1
- **CANON-0110**: Pre-commit hook runs full test suite causing slow commits
  (~50s+)...
  - File: `pre-commit` | Effort: E1
- **CANON-0113**: Auto-label workflow has invalid if: expression syntax...
  - File: `auto-label-review-tier.yml` | Effort: E0

### → Track B-B8 (Document Sync Tab) / M2 Docs

- **DOC-003**: 99 files fail docs:check (313 errors, 177 warnings)...
  - File: `README.md:1` | Effort: E1
- **DOC-007**: 15 recent commits touch docs but AUDIT_TRACKER shows only 5
  categories...
  - File: `` | Effort: E1
- **CANON-0093**: DOCUMENTATION_INDEX.md orphaned and missing required
  sections...
  - File: `DOCUMENTATION_INDEX.md` | Effort: E1
- **CANON-0094**: Tier 2 docs missing required metadata (Document Version,
  Applies To)...
  - File: `ANTIGRAVITY_GUIDE.md` | Effort: E1
- **CANON-0095**: Standards/templates contain live placeholder links and
  incorrect ancho...
  - File: `DOCUMENTATION_STANDARDS.md` | Effort: E0
- **CANON-0096**: DOCUMENT_DEPENDENCIES.md claims SYNCED but has 30+ issues...
  - File: `DOCUMENT_DEPENDENCIES.md` | Effort: E1
- **CANON-0097**: PR_REVIEW_PROMPT_TEMPLATE lacks required metadata and version
  history...
  - File: `PR_REVIEW_PROMPT_TEMPLATE.md` | Effort: E1
- **CANON-0098**: CODE_PATTERNS.md referenced with incorrect path...
  - File: `CODE_PATTERNS.md` | Effort: E0

### → Track E - Solo Developer Automations

- **EFFP-002**: No scripts/doctor.js for environment validation...
  - File: `` | Effort: E1

### → M2 - Code Quality / Track D (CI Reliability)

- **CANON-0018**: Unsafe type assertions with 'as unknown as' (worksheet +
  related compo...
  - File: `Step1WorksheetCard.tsx` | Effort: E1
- **CANON-0019**: ESLint security plugin warnings in scripts (unsafe regex /
  non-literal...
  - File: `check-review-needed.js` | Effort: E2
- **CANON-0022**: Unsafe localStorage JSON.parse in use-smart-prompts hook...
  - File: `use-smart-prompts.ts` | Effort: E0
- **CANON-0025**: Inconsistent httpsCallable typing (missing generic
  request/response ty...
  - File: `firestore-service.ts` | Effort: E1
- **CANON-0028**: Journal entry schema data is weakly typed (z.record unknown;
  per-type ...
  - File: `schemas.ts` | Effort: E2
- **CANON-0029**: No tests for useJournal hook...
  - File: `use-journal.ts` | Effort: E2
- **CANON-0021**: Add error.message null safety...
  - File: `N/A` | Effort: E0
- **CANON-0022**: Safe localStorage JSON.parse...
  - File: `N/A` | Effort: E0
  - ... and 34 more

### → M2.3-REF (God Objects) / M2 Architecture

- **CANON-0024**: Inconsistent Firebase Functions import pattern (static vs
  dynamic impo...
  - File: `firestore-service.ts` | Effort: E1
- **CANON-0026**: useJournal sets up its own auth listener instead of using
  shared auth ...
  - File: `use-journal.ts` | Effort: E1
- **CANON-0074**: Critical paths have low test coverage (firestore-service
  35.6%, accoun...
  - File: `firestore-service.ts` | Effort: E2
- **CANON-0077**: Firebase collection access scattered across 22+ files without
  type saf...
  - File: `slogans.ts` | Effort: E2
- **CANON-0082**: Dual-write pattern to inventory AND journal collections...
  - File: `SpotCheckCard.tsx` | Effort: E2
- **CANON-0083**: Deprecated API usage (31 instances) + Nested ternaries (41
  instances)...
  - File: `multiple` | Effort: E2
- **CANON-0085**: FirestoreAdapter exists but is unused (realtime boundary
  unclear)...
  - File: `firestore-adapter.ts` | Effort: E2

### → M4.5 - Security Enhancements / Track D-D5

- **CANON-0037**: Zod schemas missing .strict() (unknown fields accepted)...
  - File: `schemas.ts` | Effort: E0
- **CANON-0039**: Server-side journal entry type enum missing 'step-1-worksheet'
  (valida...
  - File: `schemas.ts` | Effort: E1
- **CANON-0040**: Permissive z.record(..., z.unknown()) allows arbitrary nested
  data in ...
  - File: `schemas.ts` | Effort: E2
- **CANON-0041**: Some admin-managed collections allow direct client writes
  without cent...
  - File: `firestore.rules` | Effort: E1
- **CANON-0019**: Address ESLint security warnings...
  - File: `N/A` | Effort: E2
- **CANON-0041**: Route admin writes through Functions...
  - File: `N/A` | Effort: E1

### → Track P - Performance Critical

- **CANON-0050**: Sentry integration incomplete - no Web Vitals reporting...
  - File: `sentry.client.ts` | Effort: E1
- **CANON-0052**: Celebration animations create 150+ DOM elements without
  reduced-motion...
  - File: `confetti-burst.tsx` | Effort: E1
- **CANON-0053**: No React.memo usage causes unnecessary re-renders in list
  components...
  - File: `entry-card.tsx` | Effort: E1
- **CANON-0056**: Meeting map renders all markers without clustering...
  - File: `page.tsx` | Effort: E2
- **CANON-0058**: Console statements in production code...
  - File: `use-journal.ts` | Effort: E0
- **CANON-0059**: Firebase queries lack consistent indexing and limits...
  - File: `meetings.ts` | Effort: E1
- **CANON-0061**: Step1WorksheetCard excessive complexity (804 lines)...
  - File: `Step1WorksheetCard.tsx` | Effort: E3
- **CANON-0062**: No route-level loading UI (loading.tsx) or Suspense
  boundaries...
  - File: `page.tsx` | Effort: E1
  - ... and 1 more

## S3-Low (49 findings)

### → M2 - Code Quality / Track D (CI Reliability)

- **CODE-006**: void operator usage flagged by SonarCloud...
  - File: `logs-tab.tsx:287` | Effort: E0
- **CODE-009**: TODO comment for unimplemented feature...
  - File: `firestore-adapter.ts:51` | Effort: E0
- **CODE-010**: TODO comment for user preferences feature...
  - File: `quick-actions-fab.tsx:12` | Effort: E0
- **CODE-011**: Useless assignment to hasMore variable...
  - File: `jobs.ts:620` | Effort: E1
- **CANON-0030**: @ts-expect-error suppression comment in production code...
  - File: `resources-page.tsx` | Effort: E0
- **CANON-0032**: 'any' types leaking into production code (needs tightening)...
  - File: `sentry.client.ts` | Effort: E1
- **CANON-0030**: Fix @ts-expect-error suppression...
  - File: `N/A` | Effort: E0
- **CANON-0032**: Replace 'any' with proper types...
  - File: `N/A` | Effort: E1
  - ... and 13 more

### → M4.5 - Security Enhancements / Track D-D5

- **SEC-007**: Math.random for visual effects...
  - File: `confetti-burst.tsx:39` | Effort: E0
- **SEC-009**: Secrets expanded in run block...
  - File: `deploy-firebase.yml:58` | Effort: E0
- **SEC-010**: process.env.NODE_ENV checks for debug info...
  - File: `error-boundary.tsx:84` | Effort: E0
- **SEC-011**: Agent config files present...
  - File: `settings.json:1` | Effort: E0

### → Track B-B8 (Document Sync Tab) / M2 Docs

- **DOC-008**: Archive docs contain significant link rot after moves...
  - File: `` | Effort: E2
- **CANON-0100**: Archive docs contain significant link rot after
  archival/moves...
  - File: `AI_HANDOFF-2026-01-02.md` | Effort: E2
- **CANON-0101**: Template date placeholders using literal YYYY-MM-DD format...
  - File: `FOUNDATION_DOC_TEMPLATE.md` | Effort: E0
- **CANON-0102**: Template docs located outside docs/templates/ directory...
  - File: `PR_REVIEW_PROMPT_TEMPLATE.md` | Effort: E0
- **CANON-0103**: Test count mismatch between DEVELOPMENT.md and actual test
  suite...
  - File: `DEVELOPMENT.md` | Effort: E0
- **CANON-0104**: ROADMAP anchor links may be fragile due to emoji/punctuation
  in headin...
  - File: `ROADMAP.md` | Effort: E0

### → Track D - CI Reliability / Track E (Solo Dev)

- **PROC-002**: tj-actions/changed-files without CVE-pinned version...
  - File: `docs-lint.yml:36` | Effort: E0
- **PROC-004**: Multiple trap commands may override each other...
  - File: `session-start.sh:245` | Effort: E0
- **PROC-006**: Script has minimal console output (1 call)...
  - File: `check-cross-doc-deps.js:1` | Effort: E0
- **PROC-007**: TRIGGERS.md last updated 2026-01-02 but hooks updated since...
  - File: `TRIGGERS.md:1` | Effort: E0
- **PROC-008**: All 12 slash commands have frontmatter descriptions...
  - File: `` | Effort: E0
- **CANON-0114**: DEVELOPMENT.md Husky section missing pattern compliance
  step...
  - File: `DEVELOPMENT.md` | Effort: E0
- **CANON-0115**: CI workflow lacks explicit permissions block (security
  hardening)...
  - File: `ci.yml` | Effort: E0
- **CANON-0116**: Pattern checker produces false positives for controlled npm
  install fa...
  - File: `check-pattern-compliance.js` | Effort: E1
  - ... and 2 more

### → M2.3-REF (God Objects) / M2 Architecture

- **REF-010**: CloudFunctionError interface defined twice in same file...
  - File: `firestore-service.ts:200` | Effort: E0
- **REF-011**: 2 tracked TODO markers in codebase...
  - File: `quick-actions-fab.tsx:12` | Effort: E0
- **REF-012**: 4 linter suppressions in codebase (ts-ignore, ts-expect-error,
  eslint-...
  - File: `logger.ts:86` | Effort: E1
- **CANON-0033**: Landing page forced to client component for top-level state...
  - File: `page.tsx` | Effort: E1
- **CANON-0088**: Batch fix opportunities: 200+ ESLint auto-fixable issues...
  - File: `multiple` | Effort: E0
- **CANON-0089**: Batch fix opportunities: 79 replaceAll() + 71 node: prefix
  modernizati...
  - File: `multiple` | Effort: E1

### → Track E - Solo Developer Automations

- **EFFP-006**: Error messages lack actionable fix hints - generic 'Please try
  again'...
  - File: `` | Effort: E1
- **EFFP-010**: OfflineIndicator is display-only - no sync status or retry
  mechanism...
  - File: `offline-indicator.tsx:7` | Effort: E1

---

## Summary by Category

| Category                 | Count | Suggested ROADMAP Location                    |
| ------------------------ | ----- | --------------------------------------------- |
| code                     | 87    | M2 - Code Quality / Track D (CI Reliability)  |
| refactoring              | 19    | M2.3-REF (God Objects) / M2 Architecture      |
| documentation            | 18    | Track B-B8 (Document Sync Tab) / M2 Docs      |
| security                 | 17    | M4.5 - Security Enhancements / Track D-D5     |
| process                  | 17    | Track D - CI Reliability / Track E (Solo Dev) |
| performance              | 11    | Track P - Performance Critical                |
| engineering-productivity | 3     | Track E - Solo Developer Automations          |

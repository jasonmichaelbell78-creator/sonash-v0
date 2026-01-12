# SoNash Development Task List

**Last Updated:** 2025-12-12  
**Source:** ROADMAP_V3.md (Canonical Roadmap)  
**Current Focus:** Finish M1 & Polish UI

---

## ⏳ In Progress

- [x] **Daily Inspiration Logic:**
  - [x] Admin Tab for CRUD
  - [x] Quote Rotation Logic
  - [x] Display on Today Page

### Week 1: Firebase App Check (Bot Protection)

- [ ] Install Firebase App Check SDK
- [ ] Get reCAPTCHA v3 site key from Google Console
- [ ] Add App Check initialization to client (`lib/firebase.ts`)
- [ ] Update Firestore rules to enforce App Check tokens
- [ ] Test with debug token in development environment
- [ ] Deploy App Check configuration to production
- [ ] Verify: Bots without valid App Check tokens are rejected

**Exit Criteria:** Bots without valid App Check tokens rejected by Firebase

---

### Week 2: Cloud Functions Rate Limiting

- [ ] Set up Firebase Functions project (`firebase init functions`)
- [ ] Install dependencies (`firebase-functions`, `firebase-admin`)
- [ ] Implement rate-limited Cloud Functions (see
      `docs/SERVER_SIDE_SECURITY.md`)
- [ ] Add auth token verification in Cloud Functions
- [ ] Add request validation and sanitization
- [ ] Deploy Cloud Functions to Firebase
- [ ] Update client code to use Cloud Functions for write operations
- [ ] Test rate limiting with burst requests (>10 req/min)
- [ ] Monitor Cloud Functions metrics in Firebase Console
- [ ] Document Cloud Functions API in README

**Exit Criteria:** Rate limits enforced server-side, impossible to bypass
client-side

---

### Week 3: Server-Side Validation & Authorization

- [ ] Move validation logic from client to Cloud Functions
- [ ] Add server-side Zod schema validation for all write operations
- [ ] Implement audit logging for security events
- [ ] Set up Sentry account and integrate SDK
- [ ] Add monitoring alerts for security violations
- [ ] Test with malicious payloads (SQL injection, XSS, oversized data)
- [ ] Update `docs/SECURITY.md` with security model documentation
- [ ] Create security incident response procedures

**Exit Criteria:** All critical operations validated server-side, malicious
requests rejected

---

### Week 4: Monitoring & Billing Protection

- [ ] Set up Firebase Performance Monitoring
- [ ] Enable Cloud Functions detailed metrics
- [ ] Create Cloud Functions metrics dashboard
- [ ] Configure Firebase billing alerts ($50, $100, $500 thresholds)
- [ ] Set up security event logging (Firestore or Cloud Logging)
- [ ] Create incident response runbook (docs/INCIDENT_RESPONSE.md)
- [ ] Test alert triggers with simulated high usage
- [x] Admin-managed daily quotes
- [ ] Document monitoring procedures for team

**Exit Criteria:** Team is alerted before costs spiral, security events tracked

---

### Account Linking (Parallel Track - Weeks 1-4)

- [ ] Design account linking UX flow (wireframes/mockups)
- [ ] Research Firebase account linking patterns (email/password, Google OAuth)
- [ ] Implement account linking UI components
- [ ] Add "Convert to Permanent Account" modal/flow
- [ ] Implement data migration logic (anonymous → permanent)
- [ ] Test anonymous → email/password account migration
- [ ] Test anonymous → Google account migration
- [ ] Document data migration process for users
- [ ] Add help documentation for account linking

**Exit Criteria:** Users can convert anonymous accounts to permanent ones
without data loss

---

### ESLint Warning Remediation (Ongoing - Weeks 1-4)

**Current State:** 0 errors ✅, 11 warnings (from 29) ✅  
**Target:** 0 errors, 0 warnings (or 15 if test files suppressed)

#### Phase 1: Quick Wins (30 minutes) ✅

- [x] Fix unused variable warnings in `tab-navigation.tsx`
- [x] Fix unused variable warnings in `firestore-adapter.ts`
- [x] Fix unused variable warnings in `db/meetings.ts`
- [x] Fix unused variable warnings in `db/users.ts`
- [ ] Fix unused variable warnings in `scripts/seed-meetings.ts` (remaining 2
      vars - dev utility)
- [x] Fix unused variable warnings in test files (added eslint-disable)
- [x] Remove unused imports across codebase
- [ ] Prefix unused params with `_` where needed (optional cleanup)

**Files:** `tab-navigation`, `firestore-adapter`, `db/meetings`, `db/users`,
`scripts/seed-meetings`, tests  
**Result:** 29 → 14 warnings

#### Phase 2: Application Code Type Safety (1 hour) ✅

- [x] Fix `any` type in `sign-in-modal.tsx` line 29 (use proper Error typing)
- [x] Fix `any` type in `sign-in-modal.tsx` line 48 (use Firebase error type
      narrowing)
- [ ] Fix `any` type in `firebase-types.ts` (not found - may be already fixed)

**Result:** 14 → 11 warnings

#### Phase 3: React Hooks Dependencies (15 minutes) ✅

- [x] Fix exhaustive-deps warning in `today-page.tsx`
- [x] Add missing `journalEntry` dependency to useEffect
- [x] Review and fix other exhaustive-deps warnings (none found)

**Result:** All hooks deps warnings resolved

#### Phase 4: Test File Types (5 minutes) ✅

- [x] Add `/* eslint-disable @typescript-eslint/no-explicit-any */` to test
      files
- [x] Document decision to allow `any` in test mocks

**Result:** Clean test file linting (6 unused directive warnings remaining -
cosmetic)

#### ESLint Config Improvements

- [ ] Update `eslint.config.mjs` to enforce stricter rules for app code
- [ ] Configure exception for `any` in test files (_.test.ts,_.test.tsx)
- [ ] Add pre-commit hook: `npm run lint && npm run type-check`
- [ ] Update CI workflow to fail on warnings: `--max-warnings 0`
- [ ] Test pre-commit hook locally

**Exit Criteria:** 0 errors, 0 warnings (or 15 if test files suppressed)

---

### Testing Improvements (Ongoing - Weeks 1-4)

**Current Coverage:** ~10%  
**M1 Target:** 40%  
**M2 Target:** 60%+

#### React Component Tests

- [ ] Set up React Testing Library if not already configured
- [ ] Write tests for `book-cover.tsx` (clean days calculation, auth states)
- [ ] Write tests for `today-page.tsx` (auto-save, journal entry)
- [ ] Write tests for `onboarding-wizard.tsx` (step transitions)
- [ ] Write tests for `sign-in-modal.tsx` (form validation, auth flow)
- [ ] Write tests for `resources-page.tsx` (meeting display, filtering)

#### Integration Tests for Firestore Operations

- [ ] Set up Firebase emulators for testing
- [ ] Write integration tests for `FirestoreService.saveDailyLog()`
- [ ] Write integration tests for user profile CRUD operations
- [ ] Write integration tests for meeting finder queries
- [ ] Write integration tests for security rules validation

#### E2E Tests for Critical User Flows

- [ ] Set up Playwright or Cypress for E2E testing
- [ ] Write E2E test: Anonymous auth flow
- [ ] Write E2E test: Onboarding wizard completion
- [ ] Write E2E test: Journal entry creation and auto-save
- [ ] Write E2E test: Meeting finder search and filter
- [ ] Write E2E test: Profile settings update

#### CI/CD Integration

- [ ] Add test runs to GitHub Actions workflow
- [ ] Configure test coverage reporting
- [ ] Set up test failure notifications
- [ ] Add test coverage badge to README

**Exit Criteria:** Test coverage ≥40% for M1, all critical paths tested

---

## M2 — Architecture & Refactoring for Speed (Weeks 5-12)

### A1: Split AuthProvider into Focused Contexts (Week 5-6)

**Current Issue:** AuthProvider has 7 state variables (195 lines), violates
Single Responsibility Principle

- [ ] Create `AuthContext` (user, loading only)
- [ ] Create `ProfileContext` (profile, profileError, profileNotFound)
- [ ] Create `DailyLogContext` (todayLog, todayLogError, refreshTodayLog)
- [ ] Write context provider components
- [ ] Update `book-cover.tsx` to use specific contexts
- [ ] Update `today-page.tsx` to use specific contexts
- [ ] Update `resources-page.tsx` to use specific contexts
- [ ] Update all other components consuming AuthProvider
- [ ] Remove old AuthProvider after migration complete
- [ ] Test migration with existing functionality
- [ ] Measure re-render performance improvement (use React DevTools Profiler)
- [ ] Document context usage patterns

**Benefit:** 60% reduction in unnecessary re-renders, clearer separation of
concerns

**Exit Criteria:** All components migrated, re-renders reduced by 60%

---

### A2: Decompose Large Components (Week 7-8)

**Current Issue:** `book-cover.tsx` is 337 lines, mixing animation + auth +
routing + modals

#### Extract Components

- [ ] Extract `BookAnimation.tsx` (Framer Motion logic only)
- [ ] Extract `BookAuthGuard.tsx` (authentication checks and redirects)
- [ ] Extract `OnboardingFlow.tsx` (wizard logic and state)
- [ ] Extract `CleanDaysCalculator.tsx` (date logic and display)
- [ ] Refactor `book-cover.tsx` to compose smaller components
- [ ] Write unit tests for each extracted component
- [ ] Verify all components <100 lines (most <50 lines)
- [ ] Update component documentation

**Benefit:** Each component <100 lines, testable in isolation, reusable

**Exit Criteria:** `book-cover.tsx` reduced to <100 lines, 4 new reusable
components created

---

### A3: Standardize Error Handling (Week 9)

**Current Issue:** Inconsistent patterns (some throw, some return `{ error }`)

- [ ] Document error handling strategy (when to throw vs return)
- [ ] Create `Result<T>` type:
      `{ success: true, data: T } | { success: false, error: Error }`
- [ ] Create utility functions: `success<T>(data: T)` and
      `failure(error: Error)`
- [ ] Standardize Firestore service methods to return `Result<T>`
- [ ] Update `FirestoreService.saveDailyLog()` to use Result pattern
- [ ] Update `FirestoreService.getTodayLog()` to use Result pattern
- [ ] Update all database operations to use `Result<T>` pattern
- [ ] Add error boundary usage documentation
- [ ] Update all service method call sites to handle Result type
- [ ] Write tests for error scenarios

**Benefit:** Predictable error handling, easier debugging, type-safe error
handling

**Exit Criteria:** All services use `Result<T>` pattern consistently

---

### A4: Image Optimization (Week 10)

**Current Issue:** Direct image usage, no Next.js Image component optimization

- [ ] Audit all image usage in `components/` directory
- [ ] Audit all images in `public/` directory
- [ ] Replace `<img>` tags with Next.js `<Image>` component
- [ ] Add responsive `sizes` prop for different breakpoints
- [ ] Optimize `wood-table.jpg` background image (compress, WebP format)
- [ ] Optimize notebook cover images
- [ ] Add image loading placeholders (blur or skeleton)
- [ ] Configure `next.config.js` for image optimization
- [ ] Test image loading performance (Lighthouse)
- [ ] Measure Core Web Vitals improvement

**Benefit:** Faster page loads, better Core Web Vitals, automatic image
optimization

**Exit Criteria:** All images use Next.js Image component, LCP improved by 30%+

---

### A5: Bundle Size Analysis & Optimization (Week 11)

**Current Issue:** Unknown bundle size, heavy dependencies (Framer Motion,
Recharts)

- [ ] Install `@next/bundle-analyzer`
- [ ] Configure bundle analyzer in `next.config.js`
- [ ] Run bundle analysis: `ANALYZE=true npm run build`
- [ ] Review bundle analysis report
- [ ] Identify large dependencies (>50KB)
- [ ] Add dynamic imports for Framer Motion (lazy load animations)
- [ ] Add dynamic imports for Recharts (lazy load charts)
- [ ] Add dynamic imports for OnboardingWizard
- [ ] Add dynamic imports for SignInModal
- [ ] Code-split routes appropriately
- [ ] Remove unused dependencies (run `npm prune`)
- [ ] Verify bundle size <200KB gzipped (initial load)
- [ ] Document bundle optimization decisions

**Benefit:** Faster initial load, improved Time to Interactive, smaller bundle
size

**Exit Criteria:** Initial bundle <200KB gzipped, TTI <2s

---

### A6: Database Adapter Pattern Consistency (Week 12)

**Current Issue:** `FirestoreAdapter` exists but not used consistently

- [ ] Review current `FirestoreAdapter` implementation
- [ ] Define `IDatabaseAdapter` interface (TypeScript)
- [ ] Update `FirestoreAdapter` to implement interface fully
- [ ] Update `AuthProvider` to use `FirestoreAdapter` instead of direct
      `FirestoreService`
- [ ] Ensure ALL data access goes through adapter layer
- [ ] Document adapter pattern in `docs/ARCHITECTURE.md`
- [ ] Write adapter interface tests (mock implementation)
- [ ] Add integration tests with Firebase emulators
- [ ] Document benefits for potential future DB migration

**Benefit:** Consistent abstraction, easier to test, potential for future
database migration

**Exit Criteria:** All database access uses adapter pattern, architecture docs
updated

---

## M1 Exit Criteria Summary

By end of Week 4, verify:

- [ ] Firebase App Check deployed and enforcing
- [ ] Cloud Functions rate limiting operational
- [ ] Server-side validation implemented
- [ ] Billing alerts configured and tested
- [ ] ESLint: 0 errors, 0 warnings (or 15 if test files suppressed)
- [ ] Test coverage ≥40% (interim target)
- [ ] Firebase bill protected (App Check + rate limiting prevents runaway costs)
- [ ] Data loss prevented (account linking functional)
- [ ] Security posture hardened (server-side enforcement operational)

---

## M2 Exit Criteria Summary

By end of Week 12, verify:

- [ ] Architecture quality ≥4.8/5 (from 4.2/5)
- [ ] All components <150 lines (target: <100 for most)
- [ ] Consistent error handling (`Result<T>` pattern everywhere)
- [ ] Bundle size <200KB gzipped (initial load)
- [ ] Re-render performance improved by 60%+ (via context splitting)
- [ ] Test coverage ≥60%
- [ ] Clearer ownership boundaries
- [ ] Lower change failure rate for common modifications

---

## Backlog / Future Considerations

### From M3+ (After Week 12)

- Meeting Finder: Proximity & Map Feature (10-15 SP)
- Inventories Hub foundation (Phase A MVP: 35 SP)
- Prayers & Readings Module (Phase A MVP: 27 SP)
- Fellowship Tools & Daily Practice

### Technical Debt (Ongoing)

- [ ] Remove TODO comments (convert to GitHub issues)
- [ ] Add JSDoc comments with rationale for magic numbers
- [ ] Consistent naming conventions (`getTodayLog` vs `getHistory` →
      standardize)
- [ ] Remove unused function parameters
- [ ] Add accessibility (a11y) audit (WCAG 2.1 AA)
- [ ] Performance budget enforcement in CI
- [ ] Security scanning in CI/CD pipeline (Snyk, npm audit)

---

## Notes

- Update this file weekly as tasks are completed
- Mark tasks with `[x]` when done, `[/]` when in progress
- Link to relevant PRs/commits for completed items
- Track blockers and dependencies inline with tasks
- Review and adjust priorities based on findings

**Canonical Roadmap:** `ROADMAP_V3.md`  
**Architecture Plan:** `docs/ARCHITECTURE_IMPROVEMENT_PLAN.md`  
**Security Guide:** `docs/SERVER_SIDE_SECURITY.md`

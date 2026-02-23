<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-22
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Comprehensive Audit Report — SoNash v0

<!-- prettier-ignore-start -->
**Report Date:** 2026-02-22
**Aggregator:** audit-aggregator (claude-sonnet-4-6)
**Source Audits:** 9 domain audits (code, security, performance, refactoring, documentation, process, engineering-productivity, enhancements, ai-optimization)
**Branch:** claude/fix-tool-use-ids-EfyvE
**Baseline:** 294 tests (293 pass, 1 skip), 0 ESLint errors, 1 pattern warning
<!-- prettier-ignore-end -->

---

## Executive Summary

### Unique Finding Counts (After Deduplication)

| Severity    | Raw Across All Audits | Unique After Dedup |
| ----------- | --------------------- | ------------------ |
| S0 Critical | 3                     | 1                  |
| S1 High     | 42                    | 28                 |
| S2 Medium   | 72                    | 51                 |
| S3 Low      | 46                    | 35                 |
| **Total**   | **163**               | **115**            |

**Deduplication removed 48 duplicate/overlapping findings.** The most heavily
duplicated issue was Firebase App Check being disabled, which appeared
independently in the code, security, performance, documentation, and
engineering-productivity audits (5 sources → 1 entry: COMP-001).

### Baseline Metrics

| Metric                     | Value                                                 |
| -------------------------- | ----------------------------------------------------- |
| Test suite                 | 294 tests, 293 passing (99.7%), 1 skipped             |
| ESLint                     | 0 errors, 1,690 warnings (documented false positives) |
| Pattern compliance         | 1 medium warning (pre-commit trap cleanup)            |
| Cloud Functions unit tests | 0                                                     |
| DX Score                   | 62/100                                                |

### Top 3 Cross-Domain Insights

**1. Firebase App Check Disabled — The Root Multi-Domain Issue** App Check being
disabled is simultaneously a security vulnerability (SEC), a performance problem
(reCAPTCHA script loads uselessly), a code quality finding (stale commented-out
code), a documentation accuracy failure (README/ARCHITECTURE claim it is
enabled), and an engineering-productivity concern. A single fix to re-enable App
Check closes findings across 5 domains.

**2. `today-page.tsx` Is the Highest-Risk Component in the Codebase** This
single 1,138-line file was independently cited by code-audit (CQ-002, CQ-004,
CQ-007, CQ-015, CQ-017, CQ-018, CQ-019, CQ-021), performance-audit (P-06), and
refactoring-audit (RF-16) as a complexity and reliability hotspot. It has 42
hook calls, 5+ useEffect blocks, a stale `referenceDate` that breaks after
midnight, and a Firestore listener that re-subscribes on every keystroke. It is
the most-changed notebook component and the one users open every session.

**3. Broken User Promises in Settings / Onboarding** The onboarding screen
explicitly promises "Export or delete your data anytime from Settings." Neither
data export nor account deletion exists in Settings. The "Large Text" preference
toggle saves to Firestore but is never applied. "Tap to set clean date" has
`cursor-pointer` but no `onClick`. The Share meeting button toasts success
without copying anything. These are working-as-designed bugs that damage user
trust.

### Recommended Fix Order (Quick Wins First)

**Immediate (E0, < 15 min each):**

1. Re-enable App Check (uncomment `lib/firebase.ts` block + set
   `requireAppCheck: true`) — closes 5 cross-domain findings
2. Add `<link rel="preload">` for `wood-table.jpg` in `app/layout.tsx` —
   one-line LCP improvement
3. Delete `claude.md` (lowercase duplicate) — saves ~1,600 tokens/session
4. Fix `VALIDATION_FAILURE` severity to `WARNING` in `security-logger.ts` —
   1-line change
5. Add c8 coverage thresholds to block zero-coverage regressions — 6-line config
6. Pin `tj-actions/changed-files` in `docs-lint.yml` to SHA (CVE-2025-30066
   vector) — 1-line change
7. Add `npm run compact-meeting-countdown.tsx` polling from 30s → 60s — 1-number
   change
8. Fix Share meeting button to actually call `navigator.clipboard.writeText()` —
   2-line fix
9. Add `"type-check": "tsc --noEmit"` to package.json scripts
10. Delete `nul` Windows artifact file from repo root

**Quick (E1, < 2 hours each):** 11. Replace all `alert()` calls with `sonner`
toasts (5 occurrences across admin components) 12. Compress PNG images to WebP
(~90% size reduction for 2–2.8 MB covers) 13. Replace deprecated
`getAllMeetings()` with `getAllMeetingsPaginated()` on refresh path 14. Add
explicit Firestore deny rules for `security_logs` and `system` collections 15.
Remove hardcoded reCAPTCHA site key fallback from
`functions/src/recaptcha-verify.ts` 16. Wire VoiceTextArea mic button
`aria-label` (1-line accessibility fix) 17. Fix tab navigation ARIA: add
`role="tablist"`, `role="tab"`, `aria-selected` 18. Add `role="dialog"` and
focus trap to sign-in modal 19. Fix README stale counts (tests: 89/91 → 293/294;
agents: 24 → 25; skills: 23 → 59) 20. Remove broken
`MULTI_AI_REVIEW_COORDINATOR.md` reference from DOCUMENTATION_STANDARDS.md

---

## S0 Critical Findings (Immediate Action)

### COMP-001 — Firebase App Check Disabled Across Entire Stack

**Sources:** CQ-001 (code), SEC-01 (security), P-18 (performance — reCAPTCHA
loaded uselessly), DOC-F10 (documentation), EP-12 (engineering-productivity)
**Severity:** S0 | **Effort:** E2 | **Cross-Domain:** Security + Performance +
Code + Documentation + DX

**Files:**

- `lib/firebase.ts:57–90` — initialization block commented out
- `functions/src/index.ts:84,170,269,363,506` — `requireAppCheck: false` on all
  5 functions
- `app/layout.tsx:69` — reCAPTCHA Enterprise script loaded `lazyOnload` despite
  serving no purpose while App Check is disabled
- `README.md`, `ARCHITECTURE.md` — incorrectly document App Check as an active
  security layer

**Description:** Firebase App Check is disabled across the entire stack. The
client-side initialization in `lib/firebase.ts` is commented out with the note
"TEMPORARILY DISABLED: App Check is disabled due to 24-hour throttle." On the
server side, all five user-facing Cloud Functions (`saveDailyLog`,
`saveJournalEntry`, `softDeleteJournalEntry`, `saveInventoryEntry`,
`migrateAnonymousUserData`) have `requireAppCheck: false` with the comment
"TEMPORARILY DISABLED - waiting for throttle to clear." The "temporary" comment
dates to December 31 — over 7 weeks ago.

**Impact (multi-domain):**

- **Security:** Any unauthenticated bot with a valid Firebase account can spam
  Cloud Functions at rate (bounded only by per-user rate limiting, not App Check
  attestation). reCAPTCHA is the sole bot-protection layer and is bypassable.
- **Performance:** The reCAPTCHA Enterprise script (~60 KB) loads on every page
  via `lazyOnload` in `app/layout.tsx` without serving any security purpose,
  adding unnecessary third-party script weight.
- **Code quality:** 30+ lines of commented-out code have persisted for 7+ weeks
  with no restoration plan or ROADMAP item.
- **Documentation:** README.md and ARCHITECTURE.md both list "App Check" as an
  active security layer. This is false. A developer reading the architecture
  docs would believe this protection is active.

**Fix:**

1. Uncomment the App Check initialization block in `lib/firebase.ts`
2. Remove `requireAppCheck: false` overrides in `functions/src/index.ts` (or
   delete the key entirely — the default is `true`)
3. Investigate the throttle root cause in Firebase console
4. Set debug tokens for dev/CI environments in `FIREBASE_APPCHECK_DEBUG_TOKEN`
   env var
5. Add a conditional to only load the reCAPTCHA script when App Check is active
6. Update README.md and ARCHITECTURE.md to reflect current (re-enabled) state

---

## Top 20 Priority Findings

| Rank | ID       | Severity | Domains                        | File:Line                                          | Description                                                                                                                    | Effort |
| ---- | -------- | -------- | ------------------------------ | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------ |
| 1    | COMP-001 | S0       | Security, Code, Perf, Docs, DX | `lib/firebase.ts:57`                               | Firebase App Check disabled across entire stack for 7+ weeks                                                                   | E2     |
| 2    | COMP-002 | S1       | Security, Docs                 | `ARCHITECTURE.md:210–258`                          | ARCHITECTURE.md shows stale Firestore rules permitting direct client writes to `journal` — contradicts actual `if false` rules | E2     |
| 3    | COMP-003 | S1       | Code, Perf, Refactoring        | `components/notebook/pages/today-page.tsx`         | 1,138-line component with 42 hooks, stale midnight date, Firestore listener re-subscribes on keystrokes, excessive re-renders  | E3     |
| 4    | COMP-004 | S1       | Security                       | `functions/src/recaptcha-verify.ts:66`             | Hardcoded reCAPTCHA site key fallback in production server code — fails silently on misconfiguration                           | E1     |
| 5    | COMP-005 | S1       | Security                       | `firestore.rules`                                  | `security_logs` and `system` collections not explicitly denied — rely on implicit default deny                                 | E1     |
| 6    | COMP-006 | S1       | Security                       | `functions/src/index.ts:486`                       | `migrateAnonymousUserData` does not verify `anonymousUid` is actually an anonymous account — allows data theft                 | E1     |
| 7    | COMP-007 | S1       | Enhancements, Security         | `components/notebook/pages/support-page.tsx`       | Support circle contacts are hardcoded demo data; Call/Text/Directions buttons are completely non-functional                    | E2     |
| 8    | COMP-008 | S1       | Enhancements                   | `components/onboarding/onboarding-wizard.tsx:419`  | App promises "export or delete your data anytime from Settings" — neither feature exists (GDPR/CCPA risk)                      | E2     |
| 9    | COMP-009 | S1       | Process                        | —                                                  | Zero Cloud Functions unit tests — security-critical business logic (rate limiting, auth, write validation) entirely untested   | E3     |
| 10   | COMP-010 | S1       | Process                        | —                                                  | No automated dependency updates (no Dependabot/Renovate) for 73 dependencies + separate functions package                      | E1     |
| 11   | COMP-011 | S1       | Process                        | `.c8rc` (missing)                                  | No test coverage thresholds — c8 runs but never blocks; coverage can be 0% and CI still passes                                 | E0     |
| 12   | COMP-012 | S1       | Enhancements, Accessibility    | `components/notebook/tab-navigation.tsx`           | Tab ribbon has no `role="tablist"`, no `aria-selected`, no `aria-label` — keyboard inaccessible                                | E1     |
| 13   | COMP-013 | S1       | Enhancements                   | `components/notebook/pages/today-page.tsx`         | No crisis/emergency SOS button — crisis resources buried 3 taps deep in a recovery app                                         | E2     |
| 14   | COMP-014 | S1       | Performance                    | `next.config.mjs:12`                               | `images.unoptimized: true` disables Next.js Image pipeline — 2 MB PNG covers served uncompressed to every device               | E2     |
| 15   | COMP-015 | S1       | Refactoring                    | `components/admin/users-tab.tsx` (2093 lines)      | God file managing 10+ distinct concerns; 46 hook calls in one component                                                        | E3     |
| 16   | COMP-016 | S1       | Refactoring                    | `scripts/check-pattern-compliance.js` (1917 lines) | Most-changed file in codebase (125 commits/90d) has `eslint-disable complexity` and no structural decomposition                | E3     |
| 17   | COMP-017 | S1       | Process                        | `.github/workflows/`                               | No E2E tests — Playwright installed as devDependency but no config, no test files, no npm script                               | E3     |
| 18   | COMP-018 | S1       | Process, CI                    | `.github/workflows/deploy-firebase.yml`            | Deploy workflow has no `needs:` dependency on CI — deployment can complete before tests pass                                   | E1     |
| 19   | COMP-019 | S1       | Code                           | Multiple (14 files)                                | Deprecated `useAuth()` hook used in 14 components — triggers re-renders from all 3 child contexts on any context update        | E2     |
| 20   | COMP-020 | S1       | AI Optimization                | `.claude/hooks/session-start.js`                   | Session-start hook runs 7 blocking synchronous subprocess calls — cold start takes 3–8 minutes                                 | E2     |

---

## Cross-Domain Insights

### Files Appearing in 3+ Audits

| File                                           | Audit Count | Audits                                              | Key Issues                                                               |
| ---------------------------------------------- | ----------- | --------------------------------------------------- | ------------------------------------------------------------------------ |
| `components/notebook/pages/today-page.tsx`     | 4           | Code, Perf, Refactoring, Enhancements               | 42 hooks, stale date, keystroke re-subscriptions, no accessibility       |
| `lib/firebase.ts`                              | 3           | Code, Security, Refactoring                         | App Check commented out since Dec 31, stale code block                   |
| `functions/src/index.ts`                       | 3           | Security, Process, AI                               | `requireAppCheck: false` on all functions, zero tests                    |
| `next.config.mjs`                              | 3           | Performance, Process, Engineering-Productivity      | `output: export` + `images: unoptimized` disables optimization           |
| `ARCHITECTURE.md`                              | 3           | Security, Documentation, Engineering-Productivity   | Stale security rules, fake Cloud Functions structure                     |
| `README.md`                                    | 3           | Documentation, Security, AI                         | Stale counts, App Check claimed active, wrong Growth tab status          |
| `.github/workflows/docs-lint.yml`              | 2           | Process, Security                                   | Unpinned `tj-actions/changed-files@v46` (CVE-2025-30066 vector)          |
| `components/admin/admin-crud-table.tsx`        | 2           | Code, Refactoring                                   | `alert()` calls, repeated `getFunctions()` boilerplate                   |
| `components/notebook/pages/resources-page.tsx` | 3           | Code, Perf, Refactoring                             | Deprecated `getAllMeetings()` on refresh, dead code, parsing duplication |
| `public/manifest.json`                         | 3           | Performance, Engineering-Productivity, Enhancements | JPEG PWA icons, portrait-only lock                                       |

### Security + Performance Overlaps

| Issue                                   | Security Angle                                        | Performance Angle                                                             |
| --------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------- |
| App Check disabled                      | Bot/abuse attack vector on all Cloud Functions        | reCAPTCHA script loads on every page without purpose (~60 KB waste)           |
| `getAllMeetings()` unbounded            | No impact                                             | Full collection read on every refresh; Firestore cost spike on large datasets |
| `.env.production` committed             | Firebase API key and Sentry DSN in version control    | N/A                                                                           |
| No service worker                       | No offline data protection                            | App shell not cached; repeat visits require full network roundtrip            |
| `MoodSparkline` separate Firestore read | User data read not batched with existing auth context | 30-doc read on every Today page visit                                         |

### Documentation Gaps Aligned with Code Issues

| Code Reality                                                    | Documentation Claim                                                                                   | Finding            |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------ |
| App Check `requireAppCheck: false` on all functions             | README: "App Check" listed in security stack; ARCHITECTURE: "Layer 2: App Check actively blocks bots" | COMP-001 + DOC-F10 |
| `firestore.rules`: `allow create, update: if false` for journal | ARCHITECTURE.md shows rules allowing direct client writes                                             | COMP-002           |
| `functions/src/` is a flat directory (8 files)                  | ARCHITECTURE.md shows subdirectories `journal/`, `admin/`, `utils/` that don't exist                  | COMP-024           |
| 293/294 tests pass                                              | README: "89/91 passing (97.8%)"                                                                       | COMP-030           |
| 25 agents, 59 skills                                            | README: "24 agents, 23 skills"                                                                        | COMP-031           |
| Growth tab fully implemented                                    | README: "Growth: Planned / feature-flagged"                                                           | COMP-032           |
| `lib/utils/` is a directory with 12 modules                     | DEVELOPMENT.md: shows as single file `utils.ts`                                                       | COMP-033           |

---

## All Findings by Severity

### S1 High

| ID       | Effort | Source Audit(s)                                                   | File                                               | Description                                                                                                                                               | Fix                                                                                                                                                                                  |
| -------- | ------ | ----------------------------------------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| COMP-002 | E2     | Docs, Security                                                    | `ARCHITECTURE.md:210`                              | Firestore rules in ARCHITECTURE.md show direct client writes allowed — contradicts actual `if false` rules                                                | Update ARCHITECTURE.md Section 4 to show `allow create, update: if false` with Cloud Functions explanation                                                                           |
| COMP-003 | E3     | Code(CQ-002,CQ-007,CQ-015,CQ-019), Perf(P-06), Refactoring(RF-16) | `today-page.tsx`                                   | 1,138-line component: 11 useState, 8 useRef, 42 hook calls, stale midnight date, keystroke re-subscriptions                                               | Extract `useHaltCheck`, `useWeeklyStats`, `useMilestoneCheck`, `useAutoSave` hooks; fix `referenceDate` with midnight refresh timer                                                  |
| COMP-004 | E1     | Security(SEC-02)                                                  | `functions/src/recaptcha-verify.ts:66`             | Hardcoded reCAPTCHA fallback: `\|\| "6LdeazosAAAAA..."` — fails silently if env var missing                                                               | Remove fallback; throw on missing `RECAPTCHA_SITE_KEY`                                                                                                                               |
| COMP-005 | E1     | Security(SEC-03)                                                  | `firestore.rules`                                  | `security_logs` and `system` collections have no explicit rules — rely on implicit default deny                                                           | Add explicit `allow read, write: if false` rules for both collections                                                                                                                |
| COMP-006 | E1     | Security(SEC-04)                                                  | `functions/src/index.ts:486`                       | `migrateAnonymousUserData` doesn't verify source UID is actually anonymous — allows copying any user's data                                               | Add `admin.auth().getUser(anonymousUid)` check; verify `providerData.length === 0`                                                                                                   |
| COMP-007 | E2     | Enhancements(ENH-003,ENH-016)                                     | `components/notebook/pages/support-page.tsx`       | Support circle is hardcoded demo data; Call/Text/Directions buttons have no onClick handlers                                                              | Implement Firestore CRUD for contacts; wire `href="tel:"`, `href="sms:"`, `href="https://maps.google.com/..."`                                                                       |
| COMP-008 | E2     | Enhancements(ENH-004,ENH-005)                                     | `settings-page.tsx`, `onboarding-wizard.tsx:419`   | Onboarding promises export + delete from Settings; neither exists                                                                                         | Add Cloud Function for JSON data export; add account deletion flow with confirmation modal                                                                                           |
| COMP-009 | E3     | Process(P-03)                                                     | `functions/` (no test files)                       | Zero Cloud Functions unit tests for security-critical business logic                                                                                      | Add `functions/tests/` directory with Mocha/Firebase emulator tests for rate limiting, auth checks, Zod validation                                                                   |
| COMP-010 | E1     | Process(P-01)                                                     | `.github/dependabot.yml` (missing)                 | No Dependabot/Renovate for 73 dependencies + functions package                                                                                            | Add `.github/dependabot.yml` with weekly npm schedule, separate entry for `functions/`                                                                                               |
| COMP-011 | E0     | Process(P-02)                                                     | `package.json` (c8 config)                         | No coverage thresholds — c8 runs but never blocks CI                                                                                                      | Add `"c8": { "branches": 60, "functions": 60, "lines": 60, "statements": 60 }` to package.json                                                                                       |
| COMP-012 | E1     | Enhancements(ENH-001)                                             | `components/notebook/tab-navigation.tsx`           | Tab ribbon: no `role="tablist"`, no `role="tab"`, no `aria-selected`, no `aria-label` — keyboard inaccessible                                             | Add role/aria attributes; wrap container with `role="tablist" aria-label="Notebook sections"`                                                                                        |
| COMP-013 | E2     | Enhancements(ENH-002)                                             | `today-page.tsx`, `library-page.tsx`               | No crisis/SOS button — crisis resources buried 3 taps deep in a recovery app                                                                              | Add persistent crisis button on Today page linking to 988 / SAMHSA / Nashville Crisis Line                                                                                           |
| COMP-014 | E2     | Perf(P-01), Engineering(EP-06)                                    | `next.config.mjs:12`                               | `images: { unoptimized: true }` — no WebP, no srcset, no resize; 2 MB PNG covers served raw                                                               | Evaluate Firebase App Hosting for SSR; short-term: compress images to WebP manually                                                                                                  |
| COMP-015 | E3     | Refactoring(RF-01)                                                | `components/admin/users-tab.tsx` (2093 lines)      | God file: 46 hook calls, 10+ embedded concerns, 4 private hooks, 8+ sub-components                                                                        | Extract hooks to `lib/hooks/use-user-management.ts`; sub-components to `components/admin/users/`                                                                                     |
| COMP-016 | E3     | Refactoring(RF-11)                                                | `scripts/check-pattern-compliance.js` (1917 lines) | Highest-churn file (125 commits/90d), `eslint-disable complexity`, 15+ functions + pattern DB inline                                                      | Extract pattern config to `scripts/config/anti-patterns.json`; split reporter + graduation tracker                                                                                   |
| COMP-017 | E3     | Process(P-09)                                                     | `playwright.config.ts` (missing)                   | Playwright installed as devDependency but zero config, zero test files, zero npm scripts                                                                  | Create `playwright.config.ts`, add 3–5 smoke tests for login + entry creation + data load                                                                                            |
| COMP-018 | E1     | Process                                                           | `.github/workflows/deploy-firebase.yml`            | Deploy workflow has no `needs:` on CI — can deploy broken code before tests pass                                                                          | Add `needs: lint-typecheck-test` to the `deploy` job                                                                                                                                 |
| COMP-019 | E2     | Code(CQ-003,CQ-015)                                               | 14 files                                           | `useAuth()` deprecated but used in 14 components — triggers re-renders from all 3 child contexts                                                          | Replace with `useAuthCore()` / `useProfile()` / `useDailyLog()` per component need                                                                                                   |
| COMP-020 | E2     | AI(AO-07,AO-24), Engineering(EP-01,EP-05)                         | `.claude/hooks/session-start.js`                   | 7 blocking subprocess calls on session start (npm ci × 2, functions build, test compile, pattern check, consolidation, reviews sync) — 3–8 min cold start | Move npm install/build async; gate test compile on file hash; make pattern check non-blocking                                                                                        |
| COMP-021 | E2     | AI(AO-01,AO-02)                                                   | `.claude/skills/`                                  | 8 skills exceed 500 lines; 9 audit skills with unclear differentiation; `/audit-comprehensive` subsumes all                                               | Split oversized skills into thin entry + referenced sub-docs; make domain skills internal modules                                                                                    |
| COMP-022 | E3     | Refactoring(RF-12), AI                                            | `scripts/aggregate-audit-findings.js` (1953 lines) | God script with 25+ functions including Levenshtein dedup, scoring, PR bucketing — no explicit complexity guard                                           | Split into pipeline stages: parse, normalize, dedup, score, generate                                                                                                                 |
| COMP-023 | E3     | Code(CQ-002), Engineering(EP-01)                                  | `.husky/pre-commit`                                | Pre-commit hook takes 30–60s; audit/CANON/skill validation runs pre-commit instead of CI                                                                  | Move audit S0/S1 + CANON schema + skill validation to CI; consider cross-doc check to pre-push only                                                                                  |
| COMP-024 | E2     | Docs(F2)                                                          | `ARCHITECTURE.md:479`                              | Cloud Functions structure in ARCHITECTURE.md shows non-existent `journal/`, `admin/`, `utils/` subdirectories                                             | Replace with actual flat structure: `index.ts`, `admin.ts`, `firestore-rate-limiter.ts`, `schemas.ts`, `security-logger.ts`, `security-wrapper.ts`, `jobs.ts`, `recaptcha-verify.ts` |
| COMP-025 | E2     | Security(SEC-05)                                                  | `firebase.json`                                    | No Content-Security-Policy header — XSS mitigation relies entirely on React's JSX escaping                                                                | Add CSP header allowing `self`, reCAPTCHA domains, Sentry; block `object-src 'none'`                                                                                                 |
| COMP-026 | E1     | Engineering(EP-02), Process                                       | `npm test` pipeline                                | Test pipeline requires 3 compilation steps (tsc + tsc-alias + node --test); 10–20s overhead on every run                                                  | Migrate to Vitest (already used for pattern tests) — eliminates compile step entirely                                                                                                |
| COMP-027 | E2     | Security(SEC-06)                                                  | `.env.production`                                  | `.env.production` committed to git with Firebase API key, App ID, Sentry DSN — should be CI/CD secrets                                                    | Move to GitHub Actions secrets; add `.env.production` to `.gitignore`; restrict Sentry DSN by domain                                                                                 |
| COMP-028 | E2     | Enhancements(ENH-018), Code                                       | `components/settings/settings-page.tsx`            | "Large Text" preference saves to Firestore but is never read by any component — dead setting                                                              | Read `profile.preferences.largeText` in root layout; apply `text-lg` or CSS class conditionally                                                                                      |

### S2 Medium

| ID       | Effort | Source Audit(s)                                       | File                                                       | Description                                                                                                                                     | Fix                                                                                                                     |
| -------- | ------ | ----------------------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| COMP-029 | E2     | Security(SEC-07)                                      | `functions/src/schemas.ts:32,51`                           | `data: z.record(z.string(), z.unknown())` — arbitrary nested data stored to Firestore without per-type validation                               | Add per-type Zod schemas for `data` field; add depth/size limits matching `saveInventoryEntry`'s `sanitizeData`         |
| COMP-030 | E0     | Docs(F3)                                              | `README.md:111,273`                                        | Test count: "89/91 passing (97.8%)" — actual is 293/294 (99.7%)                                                                                 | Update README test status line                                                                                          |
| COMP-031 | E0     | Docs(F5), AI(AO-11)                                   | `README.md:117`                                            | Agent/skill counts wrong: "24 agents / 23 skills" — actual 25 agents / 59 skills                                                                | Update counts; consider auto-generation via `npm run docs:update-readme`                                                |
| COMP-032 | E1     | Docs(F7)                                              | `README.md:239`                                            | Growth tab marked "Planned/feature-flagged" but fully implemented — contradicts "Current Features" in same README                               | Update Roadmap Module Mapping table to show Growth as Available                                                         |
| COMP-033 | E1     | Docs(F8)                                              | `DEVELOPMENT.md:169`                                       | `lib/` structure shows only 3 entries — missing `contexts/`, `db/`, `hooks/`, `types/`, `utils/` (directory not file)                           | Update project structure section with all 8 `lib/` subdirectories                                                       |
| COMP-034 | E1     | Docs(F4), AI(AO-11)                                   | `CLAUDE.md`, `claude.md`                                   | Duplicate files — `claude.md` is byte-for-byte copy of `CLAUDE.md`; on Windows both load, wasting ~1,600 tokens/session                         | Delete `claude.md`; update all references to uppercase `CLAUDE.md`                                                      |
| COMP-035 | E0     | Docs(F6)                                              | `docs/DOCUMENTATION_STANDARDS.md:178`                      | References non-existent `MULTI_AI_REVIEW_COORDINATOR.md` as Tier 4 document                                                                     | Remove entry or replace with `docs/audits/multi-ai/COORDINATOR.md`                                                      |
| COMP-036 | E0     | Docs(F9)                                              | `ROADMAP.md:6`                                             | `Last Updated: Session #151` — 29+ sessions stale; uses session number not date                                                                 | Replace with date `2026-02-22`; switch to date-based versioning                                                         |
| COMP-037 | E2     | Security(SEC-08)                                      | `functions/src/index.ts:688`                               | Migration not atomic across Firestore batches — partial failure leaves users with incomplete data                                               | Implement migration state document for retry; change client error message to generic text                               |
| COMP-038 | E1     | Perf(P-02), Code                                      | `lib/firebase.ts`, 36 files                                | framer-motion imported directly in 36 non-lazy client components (~130 KB gzipped loaded eagerly)                                               | Extract animation wrappers to dynamic-imported `AnimatedWrapper`; use CSS transitions for simple animations             |
| COMP-039 | E0     | Perf(P-08)                                            | `app/page.tsx:26`                                          | `wood-table.jpg` set via CSS `backgroundImage` — browser can't preload it; no `<link rel="preload">`                                            | Add `<link rel="preload" as="image" href="/images/wood-table.jpg">` in `app/layout.tsx`                                 |
| COMP-040 | E1     | Perf(P-03)                                            | `public/images/`                                           | 3 PNG images: 2.0 MB, 2.2 MB, 2.8 MB served uncompressed — critical LCP issue on mobile                                                         | Convert to WebP at 80% quality; delete unused `gemini-generated-image-*.png`                                            |
| COMP-041 | E1     | Perf(P-05), Code(CQ-005)                              | `resources-page.tsx:684`                                   | `getAllMeetings()` deprecated and unbounded called on manual refresh path — full collection read                                                | Replace with `getAllMeetingsPaginated(50)` already used for initial load                                                |
| COMP-042 | E1     | Perf(P-10)                                            | `components/journal/entry-card.tsx`                        | `EntryCard` not memoized — all visible cards re-render on every Firestore journal write                                                         | Wrap in `React.memo` with custom comparator converting timestamps to primitives                                         |
| COMP-043 | E1     | Perf(P-11)                                            | `components/notebook/visualizations/mood-sparkline.tsx:16` | MoodSparkline fires separate 30-doc Firestore read on every Today page visit                                                                    | Pass history as prop from `today-page.tsx`; or cache in sessionStorage                                                  |
| COMP-044 | E1     | Perf(P-07)                                            | `lib/db/slogans.ts:38`, `lib/db/quotes.ts:35`              | `getAllSlogans()` and `getAllQuotes()` unbounded queries — full collection read every admin page open                                           | Add `limit(200)` guard; cache in memory after first fetch for widget use-case                                           |
| COMP-045 | E3     | Perf(P-04), Engineering(EP-04), Enhancements(ENH-009) | `public/sw.js` (missing)                                   | PWA manifest present but no service worker — offline support is zero; install prompt is misleading                                              | Add `next-pwa` with Workbox; precache app shell; add `NetworkFirst` for Firestore, `CacheFirst` for static assets       |
| COMP-046 | E0     | Process(P-05), Security                               | `.github/workflows/docs-lint.yml`                          | `tj-actions/changed-files@v46` unpinned — same CVE-2025-30066 vector already patched in `ci.yml`                                                | Pin to SHA: `tj-actions/changed-files@26a38635fc1173cc5820336ce97be6188d0de9f5`                                         |
| COMP-047 | E1     | Process(P-04)                                         | All `.github/workflows/`                                   | `actions/checkout@v4`, `actions/setup-node@v4`, `actions/github-script@v7` use floating tags — supply chain risk                                | Pin all actions to SHA using `pin-github-action` CLI                                                                    |
| COMP-048 | E1     | Process(P-06)                                         | `.github/workflows/deploy-firebase.yml`                    | `firebase-tools` installed globally each run with no version pin — non-deterministic deploys, 30–60s overhead                                   | Add `firebase-tools` as devDependency; remove global install step                                                       |
| COMP-049 | E2     | Process(P-14)                                         | `.github/workflows/deploy-firebase.yml`                    | Preview deploy channel commented out — no PR-level staging environment                                                                          | Configure GitHub repo vars and re-enable; or remove dead `preview-deploy` job                                           |
| COMP-050 | E1     | Engineering(EP-08)                                    | ESLint config                                              | 181 ESLint warning baseline — warning noise masks real issues                                                                                   | Add per-line `eslint-disable` with justification on confirmed false positives; target 0-warning baseline                |
| COMP-051 | E2     | Engineering(EP-09), AI(AO-08,AO-09)                   | `.claude/settings.json`                                    | PostToolUse hooks fire on every Read/Write/Edit/Bash — estimated 18s/session cumulative overhead                                                | Merge commit-tracker + commit-failure-reporter; cache config in post-write-validator; make post-read-handler opt-in     |
| COMP-052 | E1     | Engineering(EP-15)                                    | `package.json` dev script                                  | Dev server uses webpack by default — no Turbopack configuration on a large TypeScript project                                                   | Change `next dev` to `next dev --turbopack`; test compatibility with Leaflet, Framer Motion                             |
| COMP-053 | E2     | AI(AO-12,AO-24)                                       | `AI_WORKFLOW.md`, `SESSION_CONTEXT.md`                     | AI_WORKFLOW.md (874 lines / ~7,600 tokens) mandated reading every session; most content only needed for doc-update sessions                     | Split into 50-line Quick Start + on-demand reference; remove "Read at session start" mandate                            |
| COMP-054 | E1     | AI(AO-13,AO-14,AO-15)                                 | `.claude/state/`, `.claude/tmp/`                           | 76 KB `agent-research-results.md` with no rotation; 283 KB stale audit JSON in `.claude/tmp/`; stale `in_progress` multi-ai-audit session state | Implement 20 KB cap on agent-research-results; delete `.claude/tmp/audit-result*.json`; mark stale session as abandoned |
| COMP-055 | E2     | AI(AO-18)                                             | `.claude/settings.local.json`                              | 250+ permission entries including multi-line commit messages — unreadable and unauditable                                                       | Remove one-time commit approvals; keep only pattern-based entries; document rotation policy                             |
| COMP-056 | E2     | Refactoring(RF-03)                                    | 8 admin tab files + `admin-crud-table.tsx`                 | `getFunctions()` + `httpsCallable` pattern repeated 28 times across admin layer                                                                 | Create `lib/utils/admin-caller.ts` typed `callAdminFunction<TInput, TOutput>()` helper                                  |
| COMP-057 | E2     | Refactoring(RF-04)                                    | `links-tab.tsx`, `prayers-tab.tsx`                         | ~90% code duplication between the two CRUD tab files                                                                                            | Create generic `AdminContentTab` HOC or `useAdminCrud` hook parameterized by entity config                              |
| COMP-058 | E2     | Refactoring(RF-14)                                    | Multiple admin components                                  | `window.confirm()` used for 10 destructive actions across admin — non-styleable, blocks UI thread                                               | Create reusable `ConfirmationDialog` using existing `components/ui/dialog.tsx`                                          |
| COMP-059 | E2     | Enhancements(ENH-006)                                 | `components/auth/sign-in-modal.tsx`                        | Modal lacks `role="dialog"`, `aria-modal`, `aria-labelledby`, focus trap — screen reader inaccessible                                           | Add dialog semantics; add close button `aria-label`; implement focus trap                                               |
| COMP-060 | E2     | Enhancements(ENH-004,ENH-005)                         | Settings                                                   | No data export or account deletion despite onboarding promise                                                                                   | Cloud Function for JSON export; account deletion with Firestore purge                                                   |
| COMP-061 | E1     | Enhancements(ENH-009)                                 | `app/layout.tsx`                                           | No `<noscript>` fallback — JavaScript-disabled users see blank page                                                                             | Add basic `<noscript>` message                                                                                          |
| COMP-062 | E2     | Enhancements(ENH-010)                                 | `mood-sparkline.tsx`                                       | Only 7-day mood sparkline — no 30/90-day history visualization                                                                                  | Implement mood trend charts on History tab; use cached daily_logs data                                                  |
| COMP-063 | E2     | Enhancements(ENH-012)                                 | `notebook-shell.tsx:200`                                   | Fixed notebook width 340px/800px breaks at 428–767px viewport range (tablets, landscape phones)                                                 | Replace hard breakpoint with fluid responsive width using container queries or clamp()                                  |
| COMP-064 | E1     | Enhancements(ENH-011)                                 | `today-page.tsx:877`                                       | "Tap to set clean date" has `cursor-pointer` but no onClick handler — clicking does nothing                                                     | Wire to navigate to Settings clean-date input                                                                           |
| COMP-065 | E0     | Enhancements(ENH-022)                                 | `resources-page.tsx:497`                                   | Share meeting button toasts "Link copied!" but never calls `navigator.clipboard.writeText()`                                                    | Add `navigator.clipboard.writeText(shareUrl)` before `toast.success()`                                                  |
| COMP-066 | E1     | Enhancements(ENH-019)                                 | `sign-in-modal.tsx`                                        | No "Forgot password?" flow — email users who forget password have no recovery path                                                              | Add `sendPasswordResetEmail()` link in sign-in form                                                                     |
| COMP-067 | E1     | Enhancements(ENH-023)                                 | Color scheme (amber-on-amber)                              | WCAG 2.1 AA contrast unverified — `text-amber-900/60` on `bg-amber-50` may fail 4.5:1 ratio                                                     | Run Axe/Lighthouse contrast audit; fix failing combinations                                                             |
| COMP-068 | E1     | Enhancements(ENH-024)                                 | `app/layout.tsx`                                           | No skip-to-content link — keyboard users must tab through entire nav on every page                                                              | Add visually-hidden skip link as first focusable element                                                                |
| COMP-069 | E1     | Enhancements(ENH-014)                                 | `growth-page.tsx:88`                                       | Step 4 Inventory and Step 8 List buttons are `motion.button` elements with no onClick — appear interactive but do nothing                       | Wire to feature or add "Coming Soon" visual indicator                                                                   |
| COMP-070 | E1     | Enhancements(ENH-017)                                 | `history-page.tsx:131`                                     | History tab hard-limited to 7 days; older entries exist in Firestore but are invisible                                                          | Implement "Load more" pagination or date-picker on History tab                                                          |
| COMP-071 | E2     | AI(AO-20)                                             | `.claude/agents/global/gsd-*.md`                           | `gsd-planner.md` (1,476 lines), `gsd-debugger.md` (1,300 lines) — ~125,000 tokens per concurrent wave of 4 GSD agents                           | Extract shared `gsd-base.md`; use `@file` references; target max 400 lines per agent                                    |
| COMP-072 | E1     | AI(AO-05)                                             | `.claude/agents/security-engineer.md` (985 lines)          | Contains Terraform/HCL examples irrelevant to Firebase project — inflates agent invocations by ~20,000 tokens                                   | Trim to 80 lines of project-relevant content; consolidate into `security-auditor.md`                                    |
| COMP-073 | E2     | Code(CQ-008), Security                                | `components/growth/Step1WorksheetCard.tsx:595,664,671`     | Triple `as unknown as Record<string, unknown>` cast — missing discriminated union for entry `.data` field                                       | Create discriminated union type in `types/journal.ts`; update service method signatures                                 |
| COMP-074 | E1     | Security(SEC-12)                                      | `functions/src/security-logger.ts:371`                     | `VALIDATION_FAILURE` severity mapped to INFO — not persisted to Firestore `security_logs`; attack probing invisible in admin panel              | Change to `WARNING` severity in `SEVERITY_MAP`                                                                          |
| COMP-075 | E2     | Perf(P-09), Refactoring(RF-16)                        | `notebook-shell.tsx`                                       | `NotebookShell` mixes animation + tab + modal state; spine SVG data URL recomputed every render                                                 | Memoize spine texture as module-level const; use `useReducer` for direction + activeTab                                 |
| COMP-076 | E1     | Enhancements(ENH-007)                                 | `onboarding-wizard.tsx:187`                                | Onboarding progress dots are `<div>` elements with no accessible labels — step position unannounced to screen readers                           | Convert to `<button>` or add `aria-label="Step X of 5"`                                                                 |
| COMP-077 | E2     | Process(P-08)                                         | `package.json` version: "0.1.0"                            | No CHANGELOG, no versioning strategy, no release tagging                                                                                        | Add `release-please-action` workflow for automatic changelog and release tags                                           |
| COMP-078 | E2     | Refactoring(RF-20)                                    | `Step1WorksheetCard.tsx:124–480`                           | 356-line `FORM_SECTIONS` config embedded in component file — pure data with no React dependencies                                               | Extract to `components/growth/step1-worksheet-config.ts`                                                                |
| COMP-079 | E2     | Refactoring(RF-02)                                    | `components/admin/errors-tab.tsx` (1095 lines)             | God file: Sentry issues + Cloud Logging + error-user correlation all in one component                                                           | Split into `ErrorsOverviewTab`, `UserCorrelationPanel`, `LogsQueryBuilder`                                              |

### S3 Low

| ID       | Effort | Source Audit(s)                                       | File                                                     | Description                                                                                                                   | Fix                                                                                             |
| -------- | ------ | ----------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| COMP-080 | E0     | Code(CQ-010)                                          | `NightReviewCard.tsx:130`, 2 others                      | Bare `window.open()` in `"use client"` components — not SSR safe if moved to shared paths                                     | Use `globalThis.window?.open(...)`                                                              |
| COMP-081 | E0     | Code(CQ-011)                                          | `app/layout.tsx:66`                                      | Stale `// ... existing metadata ...` comment — code-generation artifact                                                       | Remove the comment                                                                              |
| COMP-082 | E0     | Code(CQ-018)                                          | `today-page.tsx:332`                                     | `_checkInSteps` computed via useMemo but never consumed — wasted computation                                                  | Remove the useMemo or render via `CheckInProgress` component                                    |
| COMP-083 | E0     | Code(CQ-022)                                          | `components/journal/entry-wizard.tsx:1`                  | Missing `"use client"` directive — uses useState + event handlers but not self-declaring                                      | Add `"use client"` as first line                                                                |
| COMP-084 | E0     | Code(CQ-012), Refactoring(RF-07)                      | `components/widgets/meeting-countdown.tsx`               | Dead code — hardcoded placeholder, superseded by `CompactMeetingCountdown`, not imported anywhere                             | Delete file after confirming zero imports                                                       |
| COMP-085 | E1     | Code(CQ-005), Refactoring                             | `resources-page.tsx:684`                                 | Deprecated `MeetingsService.getAllMeetings()` called on refresh path (same as COMP-041 but also a code quality issue)         | See COMP-041                                                                                    |
| COMP-086 | E1     | Refactoring(RF-06), Perf(P-13)                        | `app/meetings/all/page.tsx:214`, `resources-page.tsx:52` | `parseTime`/`parse12HourTime`/`parse24HourTime` duplicated verbatim between two files                                         | Extract to `lib/utils/time-utils.ts`                                                            |
| COMP-087 | E1     | Refactoring(RF-08)                                    | `components/widgets/daily-quote-card.tsx`                | Duplicate of `notebook/features/daily-quote-card.tsx` — `widgets/` version not imported anywhere                              | Delete `components/widgets/daily-quote-card.tsx`                                                |
| COMP-088 | E1     | Refactoring(RF-09)                                    | `lib/database/firestore-adapter.ts`                      | Unused abstraction layer — `database` export has zero consumers; 188 lines of unused indirection                              | Delete `firestore-adapter.ts` + `database-interface.ts` or wire as primary access point         |
| COMP-089 | E1     | Refactoring(RF-05)                                    | `resources-page.tsx:596,796,827`                         | Three underscore-prefixed dead functions (`_loadMoreMeetings`, `_availableNeighborhoods`, `_handleTimeJump`) — never called   | Remove all three                                                                                |
| COMP-090 | E0     | Refactoring(RF-17)                                    | `resources-page.tsx:78`                                  | Local `isSameDay` reimplemented — `date-fns` (already imported) exports this function                                         | Remove local implementation; `import { isSameDay } from 'date-fns'`                             |
| COMP-091 | E0     | Refactoring(RF-22)                                    | `app/meetings/all/page.tsx:222`                          | `parseInt()` × 4 — SonarCloud flags; should be `Number.parseInt()`                                                            | Global replace: `parseInt(` → `Number.parseInt(` in this file                                   |
| COMP-092 | E0     | Refactoring(RF-23), Code(CQ-021)                      | `today-page.tsx:639,665`                                 | Debug `console.log("💾 Attempting to save:")` in dev guard — not using logger                                                 | Remove; production `logger.info` 3 lines above is sufficient                                    |
| COMP-093 | E1     | Refactoring(RF-24)                                    | `lib/firebase.ts:40`                                     | `let _appCheck: AppCheck \| undefined` declared and exported but always `undefined` — silently returns undefined              | Remove once App Check re-enabled (COMP-001)                                                     |
| COMP-094 | E2     | Refactoring(RF-19)                                    | `lib/utils/errors.ts`, `callable-errors.ts`              | Two parallel error utilities — `errors.ts` consumed only by `storage.ts`                                                      | Merge into `lib/utils/error-utils.ts`                                                           |
| COMP-095 | E1     | Security(SEC-09)                                      | `functions/src/admin.ts:3374`                            | Admin password reset returns distinct "No user found" error — user enumeration in admin panel                                 | Return generic "If user exists, reset sent" response; always call Firebase API                  |
| COMP-096 | E1     | Security(SEC-10)                                      | `firebase.json`                                          | Missing `Cross-Origin-Embedder-Policy` header — CLAUDE.md says COOP/COEP required for OAuth                                   | Document intentional COEP absence; note reCAPTCHA iframe incompatibility                        |
| COMP-097 | E1     | Security(SEC-11), Engineering(EP-12)                  | `firebase-service-account.json`                          | Service account key file on disk (gitignored, confirmed not committed)                                                        | Switch to Application Default Credentials for local dev; restrict IAM roles                     |
| COMP-098 | E1     | Security(SEC-13)                                      | `functions/src/firestore-rate-limiter.ts:39`             | Rate limit document IDs contain raw Firebase UID and raw IP address — hashed in logs but not in doc IDs                       | Hash UID and IP before using as document IDs (SHA-256 truncated)                                |
| COMP-099 | E0     | Security(SEC-14)                                      | `app/admin/page.tsx:36`                                  | Mobile block via user-agent string — security theater; real security is Firebase admin claim check                            | Add code comment: "UX only — security enforced at line 68 via Firebase admin claim"             |
| COMP-100 | E1     | Security(SEC-15)                                      | `functions/src/admin.ts:286`                             | `searchUsersByNickname` prefix query has no input length validation                                                           | Add `z.string().min(1).max(100).trim()` to input schema                                         |
| COMP-101 | E1     | Process(P-07)                                         | `.github/workflows/ci.yml`                               | `build` job runs `npm ci` without sharing artifact from `lint-typecheck-test` job                                             | Use `actions/cache` to share `node_modules` between CI jobs                                     |
| COMP-102 | E0     | Process(P-12)                                         | `.husky/pre-commit`                                      | Hook log file `.git/hook-output.log` grows unboundedly with every commit                                                      | Add `tail -n 500` rotation at top of hook before `exec` redirect                                |
| COMP-103 | E1     | Process(P-13)                                         | `.husky/pre-commit`, `.husky/pre-push`                   | `require_skip_reason()` function (40+ lines) duplicated verbatim in both hook files                                           | Extract to `.husky/lib/skip-reason-guard.sh`; source in both hooks                              |
| COMP-104 | E0     | Process(P-15)                                         | `.github/workflows/sync-readme.yml`                      | Auto-commit uses `git commit --no-verify` — documented as pattern to avoid in CLAUDE.md                                       | Document why `--no-verify` is acceptable for CI bot commits in the workflow file                |
| COMP-105 | E1     | Engineering(EP-03), Process(P-10)                     | `package.json` (96–101 scripts)                          | 96–101 npm scripts with no grouping, no `npm run help`, no discoverability system                                             | Add `npm run help` script; add "Common Scripts Quick Reference" to README                       |
| COMP-106 | E1     | Engineering(EP-15)                                    | `package.json` dev script                                | `next dev` without `--turbopack` — webpack used on large TypeScript project                                                   | Change to `next dev --turbopack`; test compatibility                                            |
| COMP-107 | E3     | Engineering(EP-02)                                    | Test pipeline                                            | 3-step test compilation (tsc + tsc-alias + node --test) adds 10–20s overhead — inconsistent: pattern tests already use Vitest | Migrate all tests to Vitest; eliminate tsc→dist-tests compile step                              |
| COMP-108 | E0     | Engineering(EP-10)                                    | `package.json`                                           | No `type-check` npm script alias — DEVELOPMENT.md references `npm run type-check` but it doesn't exist                        | Add `"type-check": "tsc --noEmit"`                                                              |
| COMP-109 | E0     | Engineering(EP-13)                                    | repo root                                                | `nul` file (Windows artifact from redirecting to NUL) committed to repo                                                       | Delete `nul`; add to `.gitignore`                                                               |
| COMP-110 | E0     | Engineering(EP-14)                                    | `tsconfig.json`                                          | `"incremental": true` with `"noEmit": true` — incremental build info not used; redundant with Next.js internal compilation    | Remove `"incremental": true`                                                                    |
| COMP-111 | E3     | Enhancements(ENH-013)                                 | (no i18n framework)                                      | No i18n infrastructure — all strings hardcoded in English; Nashville has ~15% Spanish-speaking population                     | Install `next-intl`; extract strings to locale files                                            |
| COMP-112 | E2     | Enhancements(ENH-020)                                 | `components/journal/lock-screen.tsx`                     | Journal lock screen component exists but is never imported or rendered                                                        | Wire to journal flow or delete if deferred                                                      |
| COMP-113 | E1     | Enhancements(ENH-021)                                 | `notebook-shell.tsx:1132`                                | Swipe navigation has no visual affordance — only hint is small footer text                                                    | Add subtle swipe indicator animation or onboarding tooltip                                      |
| COMP-114 | E0     | Perf(P-14), Engineering(EP-11), Enhancements(ENH-008) | `public/manifest.json`                                   | PWA manifest icon is JPEG, not PNG/WebP — Android adaptive icons may fail; iOS won't install properly                         | Convert to PNG; add `"purpose": "any maskable"` variant                                         |
| COMP-115 | E3     | Process(P-11)                                         | `next.config.mjs`                                        | `output: "export"` blocks SSR, ISR, API routes, middleware, image optimization — deliberate tradeoff for Firebase Hosting     | Document constraint in ARCHITECTURE.md with rationale; evaluate Firebase App Hosting for future |

---

## Quick Wins (E0 Effort, Any Severity)

Findings fixable in under 15 minutes each:

| ID       | Severity | File                            | Description                                            | Fix                                           |
| -------- | -------- | ------------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| COMP-011 | S1       | `package.json`                  | No test coverage thresholds                            | Add 6-line c8 config to package.json          |
| COMP-030 | S2       | `README.md`                     | Test count stale: 89/91 vs 293/294                     | Update 2 number occurrences in README         |
| COMP-031 | S2       | `README.md`                     | Agent/skill counts: 24/23 vs 25/59                     | Update 2 number occurrences                   |
| COMP-035 | S2       | `DOCUMENTATION_STANDARDS.md`    | Broken reference to non-existent file                  | Remove/replace 1 line                         |
| COMP-036 | S2       | `ROADMAP.md`                    | Last Updated shows session number, not date            | Replace "Session #151" with "2026-02-22"      |
| COMP-039 | S2       | `app/layout.tsx`                | LCP image `wood-table.jpg` not preloaded               | Add 1 `<link rel="preload">` tag              |
| COMP-046 | S2       | `docs-lint.yml`                 | `tj-actions` unpinned — CVE-2025-30066 vector          | Change 1 line: `@v46` → SHA                   |
| COMP-065 | S2       | `resources-page.tsx:497`        | Share meeting toasts success without copying           | Add `navigator.clipboard.writeText(url)`      |
| COMP-074 | S2       | `security-logger.ts:371`        | `VALIDATION_FAILURE` → INFO prevents Firestore storage | Change 1 word: `INFO` → `WARNING`             |
| COMP-080 | S3       | 3 files                         | Bare `window.open()` calls                             | Change to `globalThis.window?.open()`         |
| COMP-081 | S3       | `app/layout.tsx:66`             | Stale `// ... existing metadata ...` comment           | Delete 1 comment line                         |
| COMP-082 | S3       | `today-page.tsx:332`            | `_checkInSteps` computed but never consumed            | Remove the useMemo or wire to CheckInProgress |
| COMP-083 | S3       | `entry-wizard.tsx:1`            | Missing `"use client"` directive                       | Add `"use client"` as first line              |
| COMP-084 | S3       | `widgets/meeting-countdown.tsx` | Dead code — not imported anywhere                      | Delete file                                   |
| COMP-090 | S3       | `resources-page.tsx:78`         | Local `isSameDay` reimplemented — `date-fns` has it    | Remove local; import from `date-fns`          |
| COMP-091 | S3       | `meetings/all/page.tsx:222`     | `parseInt()` × 4 — SonarCloud flags                    | Replace with `Number.parseInt()`              |
| COMP-092 | S3       | `today-page.tsx:639`            | Debug `console.log` in dev guard                       | Remove 3-line debug block                     |
| COMP-099 | S3       | `app/admin/page.tsx:36`         | Mobile block via user-agent — security theater         | Add clarifying comment                        |
| COMP-102 | S3       | `.husky/pre-commit`             | Hook log file grows unboundedly                        | Add 5-line `tail -n 500` rotation             |
| COMP-104 | S3       | `sync-readme.yml`               | `--no-verify` undocumented                             | Add 2-line comment explaining CI rationale    |
| COMP-108 | S3       | `package.json`                  | Missing `type-check` script alias                      | Add 1 script entry                            |
| COMP-109 | S3       | repo root                       | `nul` Windows artifact file                            | `git rm nul`; add to `.gitignore`             |
| COMP-110 | S3       | `tsconfig.json`                 | Ineffective `"incremental": true` with `noEmit`        | Remove `"incremental": true`                  |
| COMP-114 | S3       | `public/manifest.json`          | JPEG PWA icons — iOS/Android may reject                | Convert to PNG                                |

---

## Appendix

### Links to Individual Audit Reports

| Audit                    | File                                | Total Findings |
| ------------------------ | ----------------------------------- | -------------- |
| Code Quality             | `code-audit.md`                     | 22             |
| Security                 | `security-audit.md`                 | 15             |
| Performance              | `performance-audit.md`              | 18             |
| Refactoring              | `refactoring-audit.md`              | 24             |
| Documentation            | `documentation-audit.md`            | 12             |
| Process & Automation     | `process-audit.md`                  | 15             |
| Engineering Productivity | `engineering-productivity-audit.md` | 15             |
| Enhancements             | `enhancements-audit.md`             | 25             |
| AI Optimization          | `ai-optimization-audit.md`          | 25             |
| **Total (raw)**          |                                     | **171**        |

### Baseline Metrics (from `baseline.txt`)

```
Tests: 294 total, 293 pass, 0 fail, 1 skipped
ESLint: 0 errors, 1,690 warnings (security/detect-non-literal-fs-filename)
Patterns: 1 medium warning (pre-commit trap cleanup)
Branch: claude/fix-tool-use-ids-EfyvE
Last commit: 1340a0d2 feat: pattern tests in CI + compaction guard improvements
```

### Deduplication Log

The following raw findings were merged into single comprehensive entries:

| Merged Into | Source Findings                             | Dedup Reason                                                  |
| ----------- | ------------------------------------------- | ------------------------------------------------------------- |
| COMP-001    | CQ-001, SEC-01, P-18, RF-10, EP-12, DOC-F10 | App Check disabled — same root cause across 5 audits          |
| COMP-003    | CQ-002, CQ-007, CQ-015, CQ-019, P-06, RF-16 | `today-page.tsx` complexity — same file, complementary angles |
| COMP-014    | P-01, EP-06                                 | `images.unoptimized: true` — same next.config.mjs setting     |
| COMP-034    | DOC-F4, AO-11                               | Duplicate `CLAUDE.md`/`claude.md` files                       |
| COMP-041    | CQ-005, P-05                                | `getAllMeetings()` deprecated on refresh path                 |
| COMP-045    | P-04, EP-04, ENH-009                        | No service worker / PWA offline support                       |
| COMP-046    | P-05 (process), security header review      | `tj-actions` unpinned in docs-lint.yml                        |
| COMP-051    | EP-09, AO-08, AO-09                         | PostToolUse hook overhead                                     |
| COMP-053    | AO-12, AO-24                                | Session startup token/time overhead                           |
| COMP-054    | AO-13, AO-14, AO-15                         | `.claude/state/` bloat (3 distinct locations)                 |
| COMP-084    | CQ-012, CQ-020, RF-07                       | `meeting-countdown.tsx` dead code                             |
| COMP-086    | RF-06, P-13                                 | Time-parsing duplication                                      |
| COMP-105    | EP-03, P-10                                 | npm scripts discoverability                                   |
| COMP-114    | P-14, EP-11, ENH-008                        | JPEG PWA icons                                                |

### Severity Distribution of Final 115 Unique Findings

```
S0 Critical:  1  ( 1%)  — re-enable App Check
S1 High:     28  (24%)  — immediate action required
S2 Medium:   51  (44%)  — this sprint priority
S3 Low:      35  (30%)  — cleanup backlog
```

### Positive Patterns Preserved (Do Not Regress)

The following areas are well-implemented and should be explicitly preserved:

- **Repository pattern + Cloud Functions enforcement**: All writes to sensitive
  collections go through Cloud Functions; Firestore rules block direct client
  writes
- **Comprehensive security wrapper**: Auth, rate limiting, reCAPTCHA, Zod
  validation composed into single reusable wrapper
- **PII protection in logs**: User IDs SHA-256 hashed; IPs hashed before Sentry;
  sensitive keys redacted
- **Firestore-based rate limiting**: Transaction-safe, fail-closed, survives
  cold starts
- **Strict TypeScript**: `strict: true`, no-any enforced, Zod runtime validation
  throughout
- **Test suite**: 294 tests, 99.7% pass rate — high coverage for application
  layer
- **Supply chain security**: `tj-actions` pinned to SHA in `ci.yml`
  (CVE-2025-30066)
- **Pre-commit parallelism**: ESLint and tests run concurrently, saving ~50%
  hook time
- **Skip reason enforcement**: POSIX-safe SKIP_REASON validation prevents casual
  bypasses
- **Autosave with localStorage fallback**: Journal entries never lost during
  connectivity issues
- **Anonymous auth with account linking**: Frictionless onboarding; users can
  explore before committing
- **Error boundary**: Retry + reload + debug export options — thorough error
  recovery UX
- **Milestone celebrations**: Confetti/fireworks at 7/30/60/90/180/365 days —
  genuine differentiator

---

_Report generated: 2026-02-22 by audit-aggregator agent_ _Method: Read all 9
domain audit reports; deduplicated 48 overlapping findings; merged by root cause
and file; ranked by severity (S0→S3) then effort (E0→E3)_

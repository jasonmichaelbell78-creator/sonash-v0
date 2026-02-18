---
name: system-test
description:
  23-domain interactive system/repo test plan with per-finding review,
  suggestions, TDMS sync, and multi-session support
supports_parallel: false
version: "4.0"
estimated_sessions: 6
total_domains: 23
total_checks: "~100"
---

# System Test — 23-Domain Interactive Plan

**Version:** 4.0 (23-Domain Interactive with Suggestions) **Sessions:** 6
recommended (can run as single long session) **Output:** Per-domain JSONL +
unified findings + SUMMARY.md report

---

## What This Does

Performs a deep, interactive audit of the entire SoNash codebase across 23
domains. Unlike v3.1 which spawned 9 sub-skills in parallel waves, v4.0 runs
each domain sequentially with **interactive user review** after every domain.

Key differences from v3.1:

- **23 domains** (vs 9) — finer granularity, deeper checks
- **Per-finding suggestions** — each finding includes a recommendation,
  counter-argument, and severity rationale
- **Interactive review** — user accepts/rejects/defers each finding with full
  context
- **Multi-session** — designed for 6 sessions with checkpoint recovery
- **TDMS-integrated** — findings sync directly to MASTER_DEBT.jsonl
- **Self-auditing** — Domain 21 verifies the audit's own completeness

---

## Quick Start

```
/system-test                  # Fresh full audit
/system-test --resume         # Resume from checkpoint
/system-test --domain 7       # Re-run single domain
/system-test --from 8 --to 11 # Run session range
/system-test --dry-run        # Preview checks only
/system-test --batch          # Skip interactive review
```

---

## Reference Documents

- **[WORKFLOW.md](reference/WORKFLOW.md)** — Complete interactive workflow with
  all 12 decision points
- **[RECOVERY_PROCEDURES.md](reference/RECOVERY_PROCEDURES.md)** — Compaction
  recovery and checkpoint management
- **[TRIAGE_GUIDE.md](reference/TRIAGE_GUIDE.md)** — Post-audit finding
  prioritization and TDMS intake

---

## Session Allocation

| Session | Domains | Focus Area                 | Risk   | Est. Findings |
| ------- | ------- | -------------------------- | ------ | ------------- |
| 1       | 0-4     | Foundation                 | LOW    | 5-15          |
| 2       | 5-7     | Lint, UI, Cloud Functions  | HIGH   | 20-35         |
| 3       | 8-11    | Security, Rules, Auth      | HIGH   | 15-25         |
| 4       | 12-16   | Perf, Config, Docs, PWA    | MEDIUM | 15-25         |
| 5       | 17-19   | Prior Audits, Admin, Data  | MEDIUM | 10-20         |
| 6       | 20-22   | Report, Self-Audit, Sentry | LOW    | 5-10          |

---

## Initialization Protocol

On every invocation:

1. **Detect mode**: fresh / resume / targeted / dry-run
2. **If resume**: Read `PLAN_INDEX.md` → show progress → confirm resume point
3. **Create/verify** output directory:
   ```
   docs/audits/comprehensive/audit-YYYY-MM-DD/
   ├── PLAN_INDEX.md
   ├── SUMMARY.md           (written at end)
   ├── unified-findings.jsonl (written at end)
   └── domains/
       └── d00-d22 JSONL files
   ```
4. **Write** PLAN_INDEX.md skeleton (all 23 domains, status: pending)
5. **Ask user** which session we're running (Decision Point 1)
6. **Commit**: `system-test: initialize audit-YYYY-MM-DD`

---

## Interactive Review Protocol

After each domain's checks complete, present findings with **suggestions and
options**.

### Per-Finding Presentation

Each finding MUST include:

1. **Severity + Effort** — preliminary assignment with rationale
2. **Evidence** — actual code or command output (not paraphrased)
3. **Suggestion** — recommendation (ACCEPT/REJECT/DEFER) with reasoning
4. **Counter-argument** — why the opposite decision might be valid
5. **Suggested fix** — concrete remediation steps
6. **Related findings** — cross-references to related items in other domains

### User Decision Options

For each finding, offer these choices:

```
○ Accept as-is (severity, effort unchanged)
○ Accept, change severity (offer S0/S1/S2/S3)
○ Accept, change effort (offer E0/E1/E2/E3)
○ Reject as false positive (must give reason)
○ Defer (revisit later — must give reason)
○ Discuss (show more context, then re-present)
```

### Review Mode Options

Before individual review, offer:

```
○ Individual review (one-by-one)  [Recommended for < 10 findings]
○ Batch accept all                [Recommended for clean domains]
○ Batch accept with exceptions    [Name the ones to discuss]
○ Show all detail first           [Read everything, then decide]
```

---

## Domain Execution Protocol

For each domain:

1. **Announce** — show domain header, risk level, expected findings, check list
2. **Ask** — proceed / skip / reorder (Decision Point 3)
3. **Execute** — run all checks, collect raw findings
4. **Present** — show summary table, ask review mode (Decision Point 4)
5. **Review** — per-finding with suggestions (Decision Point 5 per finding)
6. **Summarize** — show accepted/rejected/deferred counts
7. **Ask** — continue / re-review / pause (Decision Point 6)
8. **Commit** — `system-test: Domain N — <name> [M/23]`
9. **Update** — PLAN_INDEX.md domain status → ✅ Complete
10. **Check** — session boundary (Decision Point 7 if triggered)

---

## Anti-Compaction Guardrails

| Layer | Mechanism                                           | What It Protects                         |
| ----- | --------------------------------------------------- | ---------------------------------------- |
| 1     | File-first: all content written to disk immediately | No content exists only in context        |
| 2     | Incremental commits after every domain              | Worst case: lose 1 domain of work        |
| 3     | PLAN_INDEX.md as recovery anchor                    | Single file shows all progress           |
| 4     | Domain independence: no cross-domain content deps   | Can resume anywhere without backtracking |

Recovery after compaction:

```
1. Read PLAN_INDEX.md → last ✅ Complete domain
2. Verify last domain's JSONL is intact
3. Resume from next domain
```

---

<!-- ═══════════════════════════════════════════════════════ -->
<!-- DOMAIN DEFINITIONS START HERE                          -->
<!-- Each domain: header, description, risk, checks, files  -->
<!-- ═══════════════════════════════════════════════════════ -->

## Domain 0: Self-Validation

**Risk:** NONE (meta-check) | **Findings:** 0 (pass/fail only) | **Session:** 1

This domain verifies the audit infrastructure itself works before real checks
begin. No findings are generated — this is a go/no-go gate.

### Checks

| ID  | Check                     | Method                                             | Pass Criteria                             |
| --- | ------------------------- | -------------------------------------------------- | ----------------------------------------- |
| 0.1 | Skill integrity           | Verify this SKILL.md has all 23 domain headers     | All `## Domain N:` headers present (0-22) |
| 0.2 | Output directory writable | Write a test file to audit output dir, then delete | Write + delete succeeds                   |
| 0.3 | TDMS accessible           | Read `docs/technical-debt/MASTER_DEBT.jsonl`       | File exists and parses as valid JSONL     |
| 0.4 | Git working tree status   | `git status`                                       | Clean or warn user of uncommitted changes |
| 0.5 | Required tools available  | Check `next`, `tsc`, `npm`, `firebase` on PATH     | All four found                            |
| 0.6 | PLAN_INDEX.md written     | Verify skeleton was created in init step           | File exists with all 23 domain rows       |

### Key Files

- `.claude/skills/system-test/SKILL.md` (this file)
- `docs/audits/comprehensive/audit-YYYY-MM-DD/PLAN_INDEX.md`
- `docs/technical-debt/MASTER_DEBT.jsonl`

### Pass/Fail

- **Pass:** All 6 checks green → proceed to Domain 1
- **Fail:** Any check fails → show which failed, offer to fix or abort

---

## Domain 1: Prerequisites

**Risk:** LOW | **Expected Findings:** 1-3 | **Session:** 1

Verifies the codebase compiles, type-checks, and has no critical vulnerabilities
before deeper analysis begins. Findings here block dependent domains.

### Checks

| ID  | Check                   | Method                                        | Finding Criteria                                     |
| --- | ----------------------- | --------------------------------------------- | ---------------------------------------------------- |
| 1.1 | Build succeeds          | `npx next build` (static export)              | Exit code != 0 → S0 finding                          |
| 1.2 | TypeScript clean        | `npx tsc --noEmit`                            | Any errors → S1 finding per error category           |
| 1.3 | npm audit               | `npm audit --json`                            | High/critical vulns in prod deps → S1; dev-only → S2 |
| 1.4 | Node version match      | Compare `node -v` with `package.json` engines | Mismatch → S2 finding                                |
| 1.5 | Firebase CLI configured | `firebase projects:list` or `firebase use`    | Not configured → S2 finding (blocks admin checks)    |

### Key Files

- `package.json` (engines field, scripts)
- `next.config.ts` (build configuration)
- `tsconfig.json` (TypeScript configuration)
- `functions/tsconfig.json` (Functions TypeScript)

### Dependency

- Domain 2 (Build) and Domain 3 (Tests) depend on checks 1.1 and 1.2 passing
- If 1.1 fails, skip Domains 2-3 and offer to proceed with independent domains

### Suggestions Template

For npm audit findings:

- **Suggestion:** "Accept at S1 if vuln is in production dependency. Downgrade
  to S2 if build-time only (check `npm ls <package>` to verify)."
- **Counter-argument:** "If the vulnerability requires specific conditions
  (e.g., user-controlled regex input for ReDoS), practical risk may be lower
  than severity implies."

---

## Domain 2: Build & Compilation

**Risk:** LOW | **Expected Findings:** 2-5 | **Session:** 1

Analyzes build output quality, warnings, bundle composition, and static export
correctness beyond just "does it compile."

### Checks

| ID  | Check                      | Method                                             | Finding Criteria                                         |
| --- | -------------------------- | -------------------------------------------------- | -------------------------------------------------------- |
| 2.1 | Build warnings             | Capture `next build` stderr/stdout for warnings    | Any warnings → S3 finding per warning category           |
| 2.2 | Static export completeness | List `out/` directory, verify all routes generated | Missing routes → S1 finding                              |
| 2.3 | Bundle size analysis       | Check `out/` total size and largest files          | Total > 5MB or single file > 500KB → S2 finding          |
| 2.4 | Image optimization         | Check `next.config.ts` for `images.unoptimized`    | `unoptimized: true` → S2 (expected for static, but note) |
| 2.5 | Source maps in production  | Check if `.map` files exist in `out/`              | Source maps present → S2 (information disclosure risk)   |
| 2.6 | Functions build            | `cd functions && npm run build`                    | Build failure → S0; warnings → S3                        |
| 2.7 | Functions TypeScript clean | `cd functions && npx tsc --noEmit`                 | Type errors → S1 finding                                 |

### Key Files

- `next.config.ts` (output: "export", images config)
- `out/` (build output directory)
- `functions/tsconfig.json`
- `functions/src/*.ts`

### Suggestions Template

For image optimization:

- **Suggestion:** "Accept at S2. Static export requires `unoptimized: true` —
  this is a known trade-off. Consider lazy loading and proper image sizing as
  mitigation."
- **Counter-argument:** "Next.js Image component still handles lazy loading and
  sizing even when unoptimized. The real impact is larger downloads on slow
  connections."

---

## Domain 3: Test Suite

**Risk:** LOW | **Expected Findings:** 2-5 | **Session:** 1

Evaluates test suite health, coverage gaps, and test quality beyond just "do
tests pass."

### Checks

| ID  | Check                       | Method                                                       | Finding Criteria                                  |
| --- | --------------------------- | ------------------------------------------------------------ | ------------------------------------------------- |
| 3.1 | Tests pass                  | `npm test` (Vitest)                                          | Any failures → S1 finding per failing test        |
| 3.2 | Coverage analysis           | `npm test -- --coverage` or check existing coverage config   | < 50% overall → S2; critical paths uncovered → S1 |
| 3.3 | Test file inventory         | Glob `**/*.test.{ts,tsx}` and `**/*.spec.{ts,tsx}`           | Source files with 0 test coverage → list as S3    |
| 3.4 | Cloud Functions test gap    | Check if `functions/src/*.ts` have corresponding tests       | No function tests at all → S1 finding             |
| 3.5 | Test for security utilities | Check if `secure-caller.ts`, `callable-errors.ts` have tests | Security utils without tests → S1 finding         |
| 3.6 | Snapshot test freshness     | Check for stale snapshots                                    | Outdated snapshots → S3 finding                   |
| 3.7 | Test configuration review   | Read `vitest.config.ts` for misconfigurations                | Coverage thresholds not set → S3 finding          |

### Key Files

- `vitest.config.ts`
- `__tests__/` directory
- `functions/src/` (should have corresponding tests)
- `lib/utils/secure-caller.ts`, `lib/utils/callable-errors.ts`

### Suggestions Template

For Cloud Functions test gap:

- **Suggestion:** "Accept at S1. Cloud Functions handle auth, data mutations,
  and admin operations with no test coverage. This is the highest-risk untested
  code in the project."
- **Counter-argument:** "Integration testing Cloud Functions requires Firebase
  emulator setup (E3 effort). Unit testing the validation/business logic
  portions is a practical first step (E2)."

---

## Domain 4: Dependency Health

**Risk:** MEDIUM | **Expected Findings:** 3-6 | **Session:** 1

Audits dependency versions, consistency between root and functions packages,
duplicate packages, and supply chain health.

### Checks

| ID  | Check                        | Method                                                                      | Finding Criteria                                          |
| --- | ---------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------- |
| 4.1 | Firebase version consistency | Compare firebase versions in `package.json` vs `functions/package.json`     | Version mismatch → S2 finding (known 3-way mismatch)      |
| 4.2 | Duplicate dependencies       | Check if same package appears in root and functions with different versions | Duplicates with different majors → S2 finding             |
| 4.3 | Outdated critical packages   | `npm outdated --json` for major version gaps                                | Major version behind on security packages → S1            |
| 4.4 | Package-lock integrity       | Verify `package-lock.json` matches `package.json`                           | Drift → S2 finding                                        |
| 4.5 | Functions package-lock       | Verify `functions/package-lock.json` exists and is current                  | Missing or stale → S2 finding                             |
| 4.6 | Unused dependencies          | Cross-reference `package.json` deps with actual imports                     | Unused prod deps → S3 finding                             |
| 4.7 | License compliance           | Check licenses of all direct deps                                           | GPL in non-GPL project → S1; unknown license → S2         |
| 4.8 | Zod version consistency      | Compare Zod versions between root and functions                             | Known issue: root uses 3.24.2, functions uses 3.24.1 → S3 |

### Key Files

- `package.json` (root)
- `functions/package.json`
- `package-lock.json`
- `functions/package-lock.json`

### Known Issues (from research)

- Firebase packages have a 3-way version mismatch: `firebase` (root),
  `firebase-admin` (functions), `firebase-functions` (functions) — different
  major release cadences
- Zod minor version drift between root and functions

### Suggestions Template

For Firebase version mismatch:

- **Suggestion:** "Accept at S2. The firebase (client), firebase-admin (server),
  and firebase-functions (server) packages intentionally have different version
  numbers. Check if the firebase-admin version is the latest available."
- **Counter-argument:** "These are maintained by the same team (Google) and
  designed to work across version boundaries. A mismatch is only a problem if
  specific APIs are incompatible."

---

## Domain 5: Lint & Static Analysis

**Risk:** LOW | **Expected Findings:** 3-8 | **Session:** 2

Runs ESLint with the project's flat config, checks pattern compliance, and
analyzes static analysis coverage gaps.

### Checks

| ID  | Check                          | Method                                                   | Finding Criteria                                         |
| --- | ------------------------------ | -------------------------------------------------------- | -------------------------------------------------------- |
| 5.1 | ESLint clean                   | `npm run lint` (ESLint flat config)                      | Any errors → S2 finding per rule category; warnings → S3 |
| 5.2 | ESLint config completeness     | Read `eslint.config.mjs` — check enabled rule categories | Missing security rules → S2; missing React rules → S3    |
| 5.3 | Pattern compliance             | `npm run patterns:check`                                 | Violations → S2 per violation type                       |
| 5.4 | Prettier consistency           | `npx prettier --check .`                                 | Unformatted files → S3 finding                           |
| 5.5 | TypeScript strict mode gaps    | Check `tsconfig.json` for disabled strict checks         | `strict: false` or `noImplicitAny: false` → S2 finding   |
| 5.6 | Unused exports                 | Grep for exports not imported anywhere                   | Dead exports in lib/ → S3 finding                        |
| 5.7 | Console.log in production code | Grep for `console.log` outside test/dev files            | console.log in components/ or lib/ → S3 finding          |
| 5.8 | TODO/FIXME/HACK inventory      | Grep for TODO, FIXME, HACK, XXX comments                 | Count and list — informational, S3 per batch             |

### Key Files

- `eslint.config.mjs` (flat config)
- `tsconfig.json`
- `scripts/patterns-check.js`
- `.prettierrc` or prettier config in package.json

### Suggestions Template

For ESLint security rules:

- **Suggestion:** "Accept at S2. ESLint has security-focused plugins
  (eslint-plugin-security, no-unsanitized) that could catch XSS and injection
  patterns statically."
- **Counter-argument:** "The codebase uses React (auto-escapes JSX) and
  Firestore (parameterized queries), so many common injection vectors are
  already mitigated by framework design."

---

## Domain 6: UI Components & Accessibility

**Risk:** MEDIUM | **Expected Findings:** 5-12 | **Session:** 2

Audits the component hierarchy, accessibility compliance, dark mode consistency,
and the notebook subsystem (30 components — largest subtree).

### Checks

| ID   | Check                         | Method                                                         | Finding Criteria                                              |
| ---- | ----------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------- |
| 6.1  | Component inventory           | Glob `components/**/*.tsx` — count and categorize              | Informational — establishes baseline for coverage             |
| 6.2  | Accessibility: alt text       | Grep for `<img` without `alt=` in components                   | Missing alt text → S2 finding per component                   |
| 6.3  | Accessibility: ARIA labels    | Check interactive elements (buttons, inputs) for aria-label    | Interactive elements without labels → S2 finding              |
| 6.4  | Accessibility: color contrast | Check oklch values in globals.css for WCAG AA compliance       | Insufficient contrast ratios → S2 finding                     |
| 6.5  | Accessibility: keyboard nav   | Check for onClick without onKeyDown on non-button elements     | Click-only handlers on divs/spans → S2 finding                |
| 6.6  | Dark mode completeness        | Check for hardcoded colors (hex/rgb) not using CSS variables   | Hardcoded colors → S3 finding per occurrence                  |
| 6.7  | Notebook subsystem review     | Read all 30 files in `components/notebook/`                    | Dead code, unused props, missing error boundaries → per issue |
| 6.8  | Admin panel tabs              | Verify all 17 admin tabs render and connect to admin functions | Tab without corresponding function → S2 finding               |
| 6.9  | Onboarding wizard             | Read `onboarding-wizard.tsx` — verify step completeness        | Missing steps or broken flow → S1 finding                     |
| 6.10 | Voice text area               | Check `voice-text-area.tsx` for browser compat handling        | No fallback for non-Chrome browsers → S2 finding              |
| 6.11 | Map integration               | Check Leaflet usage: icon loading, API keys, error boundaries  | Missing error boundary around map → S2 finding                |
| 6.12 | Loading states                | Check components for proper loading/error/empty state handling | Missing loading skeleton → S3; missing error state → S2       |

### Key Files

- `components/notebook/` (30 files — largest subsystem)
- `components/admin/` (17 tabs)
- `components/onboarding/onboarding-wizard.tsx`
- `components/ui/voice-text-area.tsx`
- `components/map/` (Leaflet integration)
- `app/globals.css` (theme variables)
- `components/theme-provider.tsx`

### Subsystem Proportionality

The notebook subsystem (`components/notebook/`) has 30 files and is the primary
user-facing feature. It should receive proportionally more attention:

- Pages: today-page, library-page, support-page, history-page, growth-page
- Features: smart-prompt, daily-quote-card, check-in-questions, mood-selector
- Shared: enhanced-mood-selector, clean-time-display, quick-actions-fab

### Suggestions Template

For missing accessibility:

- **Suggestion:** "Accept at S2. This is a recovery community app — users may
  have motor/cognitive impairments. WCAG AA compliance is both ethical and
  practical."
- **Counter-argument:** "PWA installed on personal devices reduces the assistive
  technology usage profile compared to a public website. Prioritize critical
  paths (onboarding, daily check-in) over admin UI."

For voice text area browser compat:

- **Suggestion:** "Accept at S2. Web Speech API is Chrome-only. The component
  should gracefully degrade with a visible message on unsupported browsers."
- **Counter-argument:** "The app's primary audience (mobile PWA users)
  overwhelmingly uses Chrome on Android. iOS Safari support for Speech API is
  improving."

---

## Domain 7: Cloud Functions

**Risk:** HIGH | **Expected Findings:** 8-15 | **Session:** 2

The highest-risk domain. Cloud Functions handle authentication, data mutations,
admin operations, soft-delete, migration, and scheduled jobs across 5000+ lines
in 4 primary files.

### Checks

| ID   | Check                             | Method                                                        | Finding Criteria                                             |
| ---- | --------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------ |
| 7.1  | Rate limiter constant drift       | Compare `RATE_LIMIT_*` in client `secure-caller.ts` vs server | Client/server values differ → S1 finding                     |
| 7.2  | Soft-delete TOCTOU race           | Read soft-delete functions for read-then-write without txn    | Non-transactional read-then-write → S1 finding               |
| 7.3  | Return-after-throw patterns       | Check for code after `throw new HttpsError()`                 | Unreachable code after throw → S2 finding                    |
| 7.4  | Input validation completeness     | Check all `onCall` functions for parameter validation         | Missing validation on any parameter → S1 finding             |
| 7.5  | Admin authorization consistency   | Compare how admin role is checked across admin functions      | Inconsistent auth patterns → S2 finding                      |
| 7.6  | Error response info leakage       | Check error messages for stack traces, internal paths, PII    | Leaking internal details → S1 finding                        |
| 7.7  | Scheduled function error handling | Read `scheduled.ts` for try/catch patterns                    | Unhandled errors in scheduled fns → S1 finding               |
| 7.8  | Migration function edge cases     | Read `migrateAnonymousUserData` for race conditions           | Missing transaction or partial failure handling → S1 finding |
| 7.9  | Security logger PII coverage      | Compare SENSITIVE_KEYS list against actual data fields        | Fields containing PII not in SENSITIVE_KEYS → S1 finding     |
| 7.10 | Firestore batch write limits      | Check for batch writes exceeding 500 doc Firestore limit      | No batch size guard → S2 finding                             |
| 7.11 | Function timeout configuration    | Check if long-running functions set custom timeouts           | Default 60s timeout on functions that may run longer → S2    |
| 7.12 | GDPR functions missing            | Check for data export and account self-deletion functions     | Security logger defines events but no functions exist → S2   |

### Key Files

- `functions/src/index.ts` (~486 lines — user-facing functions)
- `functions/src/admin.ts` (~3100 lines — admin operations)
- `functions/src/scheduled.ts` (scheduled/cron functions)
- `functions/src/security-logger.ts` (security event logging)
- `lib/utils/secure-caller.ts` (client-side rate limit constants)
- `lib/firebase/firestore-rate-limiter.ts` (client-side rate limiter)

### Known Issues (from research)

- Rate limiter constants in `secure-caller.ts` (client) were found to not match
  the server-side rate limiter configuration — exact drift TBD during execution
- `softDeleteJournalEntry` has a documented TOCTOU race (read isDeleted, then
  write update without transaction)
- `security-logger.ts` defines `DATA_EXPORT_*` and `ACCOUNT_DELETE_*` event
  types but no corresponding Cloud Functions implement these operations

### Suggestions Template

For TOCTOU race:

- **Suggestion:** "Accept at S1. This is a real race condition. While low
  probability in normal use, it can be exploited by concurrent requests or
  network retry logic."
- **Counter-argument:** "The practical impact is limited to duplicate audit log
  entries. No data corruption occurs because the final state is the same
  regardless of which concurrent call 'wins'."
- **Suggested fix:** "Wrap the read-check-write in a Firestore transaction:
  `db.runTransaction(async (t) => { const doc = await t.get(ref); if (doc.data().isDeleted) throw ...; t.update(ref, {...}); })`"

For GDPR missing functions:

- **Suggestion:** "Accept at S2. The security logger defines event types for
  data export and account deletion, suggesting these were planned. They should
  either be implemented or the event types removed."
- **Counter-argument:** "Admin soft-delete and scheduled hard-delete exist. User
  self-service deletion may be intentionally deferred pending legal review."

---

## Domain 8: Security Headers & CSP

**Risk:** HIGH | **Expected Findings:** 4-8 | **Session:** 3

Audits HTTP security headers, Content Security Policy, CORS configuration, and
the known Permissions-Policy issue. Static export means headers must come from
hosting config (Firebase hosting or CDN), not Next.js middleware.

### Checks

| ID  | Check                         | Method                                                     | Finding Criteria                                          |
| --- | ----------------------------- | ---------------------------------------------------------- | --------------------------------------------------------- |
| 8.1 | Permissions-Policy header     | Check `next.config.ts` headers or Firebase hosting config  | Known S1: camera/microphone blocked despite voice feature |
| 8.2 | Content-Security-Policy       | Check if CSP header is configured and covers all origins   | Missing CSP → S1; overly permissive (unsafe-inline) → S2  |
| 8.3 | X-Content-Type-Options        | Check for `nosniff` header                                 | Missing → S2 finding                                      |
| 8.4 | X-Frame-Options               | Check for `DENY` or `SAMEORIGIN`                           | Missing → S2 finding (clickjacking risk)                  |
| 8.5 | Strict-Transport-Security     | Check for HSTS header with adequate max-age                | Missing or max-age < 1 year → S2 finding                  |
| 8.6 | Referrer-Policy               | Check for appropriate referrer policy                      | Missing or `unsafe-url` → S2 finding                      |
| 8.7 | Static export header delivery | Verify how headers are actually delivered (hosting config) | Headers defined but not deployable → S1 finding           |
| 8.8 | CORS configuration            | Check Firebase Functions CORS settings                     | Overly permissive origins → S1 finding                    |

### Key Files

- `next.config.ts` (headers function)
- `firebase.json` (hosting headers section)
- `functions/src/index.ts` (CORS in Cloud Functions)
- `sentry.client.config.ts`, `sentry.server.config.ts` (CSP impact)

### Known Issues (from research)

- `Permissions-Policy: camera=(), microphone=()` blocks the voice text area's
  access to the microphone. This is a known S1 finding already identified.
- Static export means `next.config.ts` headers() may not take effect in
  production — depends entirely on Firebase Hosting configuration.

### Suggestions Template

For Permissions-Policy:

- **Suggestion:** "Accept at S1. The header explicitly blocks microphone access
  while the app has a voice-to-text feature. Either remove the restriction or
  remove the feature."
- **Counter-argument:** "If voice-to-text is used only in development/testing
  and not shipped to production users, the header is correct as a security
  measure."
- **Suggested fix:** "Change to
  `Permissions-Policy: camera=(), microphone=(self)` to allow self-origin
  microphone access."

---

## Domain 9: Firestore Rules

**Risk:** HIGH | **Expected Findings:** 5-10 | **Session:** 3

Audits the Firestore security rules for over-permissive access, missing
validation, consistency with application logic, and CANON reference validity.

### Checks

| ID   | Check                           | Method                                                         | Finding Criteria                                       |
| ---- | ------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------ |
| 9.1  | Rules file syntax               | `firebase emulators:exec` or manual parse of `firestore.rules` | Syntax errors → S0 finding                             |
| 9.2  | Over-permissive reads           | Check for `allow read: if true` or broad collection access     | Unauthenticated reads on user data → S0 finding        |
| 9.3  | Over-permissive writes          | Check for `allow write: if true` or missing field validation   | Missing field-level validation → S1 finding            |
| 9.4  | Admin-only paths                | Verify admin collections require admin custom claim            | Admin data readable by non-admins → S0 finding         |
| 9.5  | User data isolation             | Verify users can only read/write their own data                | Cross-user data access possible → S0 finding           |
| 9.6  | Soft-delete rules               | Check if rules prevent reading soft-deleted documents          | Soft-deleted docs still readable → S2 finding          |
| 9.7  | CANON reference validation      | Check CANON-0002, CANON-0034 refs in rules comments            | Referenced CANON docs don't exist → S3 finding         |
| 9.8  | Rules match application queries | Compare rules with actual Firestore queries in app code        | App queries that would be denied by rules → S1 finding |
| 9.9  | Rate limiting at rules level    | Check if rules implement any rate limiting                     | No rate limiting at rules level → S3 (informational)   |
| 9.10 | Storage rules existence         | Check if Firebase Storage rules exist                          | No storage rules file → S1 if storage is used          |

### Key Files

- `firestore.rules`
- `storage.rules` (if it exists)
- `firebase.json` (rules references)
- `hooks/use-journal.ts` (Firestore queries)
- `lib/firebase/firestore-collections.ts`

### Suggestions Template

For over-permissive reads:

- **Suggestion:** "Accept at S0 if user data (journal entries, daily logs) can
  be read by other authenticated users. Recovery data is highly sensitive —
  every user should only see their own data."
- **Counter-argument:** "Some collections (meetings, quotes, slogans) are
  intentionally public/shared. Only user-specific collections need strict
  isolation."

---

## Domain 10: Environment & Config

**Risk:** MEDIUM | **Expected Findings:** 3-6 | **Session:** 3

Audits environment variable handling, secret management, configuration
consistency across environments, and the `.env` file patterns.

### Checks

| ID   | Check                        | Method                                                           | Finding Criteria                                          |
| ---- | ---------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------- |
| 10.1 | Env file patterns            | Check for `.env`, `.env.local`, `.env.production` files          | Secrets in `.env` committed to git → S0 finding           |
| 10.2 | NEXT*PUBLIC* prefix audit    | Grep for NEXT*PUBLIC* — all are client-exposed                   | Secrets with NEXT*PUBLIC* prefix → S0 finding             |
| 10.3 | .gitignore coverage          | Verify `.env*` is in `.gitignore`                                | Missing gitignore for env files → S0 finding              |
| 10.4 | Env var documentation        | Check if `.env.example` or `.env.template` exists                | No env documentation → S3 finding                         |
| 10.5 | Firebase config exposure     | Check if Firebase config (apiKey, projectId) is in client code   | Expected for Firebase (not a secret), but validate scope  |
| 10.6 | Sentry DSN exposure          | Check if Sentry DSN is hardcoded vs env var                      | Hardcoded DSN → S3 (DSN is semi-public but best practice) |
| 10.7 | Runtime vs build-time config | Verify env vars used at build time are in CI config              | Missing CI env vars → S2 finding                          |
| 10.8 | Functions env config         | Check how Cloud Functions access secrets (env vs Secret Manager) | Secrets in env files → S2; Secret Manager preferred → S3  |

### Key Files

- `.env*` files (if they exist)
- `.gitignore`
- `lib/firebase/config.ts`
- `sentry.client.config.ts`
- `.github/workflows/` (CI configuration)
- `functions/src/` (environment variable usage)

### Suggestions Template

For Firebase config exposure:

- **Suggestion:** "Accept as informational (no severity). Firebase client config
  (apiKey, authDomain, projectId) is designed to be public. Security comes from
  Firestore rules and Auth, not config secrecy."
- **Counter-argument:** "While Firebase config is public, the apiKey can be
  restricted to specific domains in the Google Cloud Console. Verify this
  restriction is in place."

---

## Domain 11: Auth & Session Management

**Risk:** HIGH | **Expected Findings:** 4-8 | **Session:** 3

Audits the authentication flow, session persistence, anonymous-to-authenticated
migration, role management, and token handling.

### Checks

| ID   | Check                       | Method                                                           | Finding Criteria                                         |
| ---- | --------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------- |
| 11.1 | Auth provider configuration | Read auth context for configured providers (email, Google, anon) | Insecure providers enabled → S1 finding                  |
| 11.2 | Session persistence         | Check `setPersistence` calls — local vs session vs none          | `LOCAL` persistence on shared devices → S2 finding       |
| 11.3 | Token refresh handling      | Check for token refresh logic and error handling                 | No refresh handling → S1; silent failures → S2           |
| 11.4 | Anonymous-to-auth migration | Read `migrateAnonymousUserData` and `account-linking.ts`         | Data loss during migration → S0; race conditions → S1    |
| 11.5 | Admin role assignment       | How is isAdmin set? Custom claims vs Firestore field             | Admin role in Firestore (client-modifiable) → S0 finding |
| 11.6 | Auth state listener cleanup | Check if `onAuthStateChanged` listeners are properly cleaned up  | Memory leak from unsubscribed listeners → S2 finding     |
| 11.7 | reCAPTCHA integration       | Read `secure-caller.ts` for reCAPTCHA Enterprise integration     | Missing reCAPTCHA on sensitive operations → S1 finding   |
| 11.8 | Password requirements       | Check if email/password auth enforces strong passwords           | No minimum requirements → S2 finding                     |
| 11.9 | Auth error message leakage  | Check if auth errors reveal user existence                       | "User not found" vs "Invalid credentials" → S2 finding   |

### Key Files

- `lib/firebase/auth.ts`
- `contexts/auth-context.tsx`
- `lib/firebase/account-linking.ts`
- `lib/utils/secure-caller.ts`
- `functions/src/index.ts` (migrateAnonymousUserData)
- `components/auth/` (auth UI components)

### Suggestions Template

For anonymous migration:

- **Suggestion:** "Accept at S1. Anonymous-to-authenticated migration is a
  critical path. If data is lost during migration, users lose their recovery
  journals — this is both a data integrity and trust issue."
- **Counter-argument:** "Anonymous accounts are a convenience feature for
  first-time exploration. Most users sign up before entering significant data.
  Test with actual migration to verify."

For admin role storage:

- **Suggestion:** "Accept at S0 if admin role is stored in Firestore (client can
  modify). Custom claims set server-side are the secure approach."
- **Counter-argument:** "If the isAdmin field is only READ client-side (for UI
  gating) but all admin operations are verified server-side via custom claims,
  the Firestore field is just a UI hint and not a security issue."

---

## Domain 12: Performance

**Risk:** MEDIUM | **Expected Findings:** 4-8 | **Session:** 4

Audits client-side performance, bundle optimization, rendering patterns,
Firestore query efficiency, and font/image loading strategies.

### Checks

| ID   | Check                    | Method                                                         | Finding Criteria                                         |
| ---- | ------------------------ | -------------------------------------------------------------- | -------------------------------------------------------- |
| 12.1 | Bundle splitting         | Check `next.config.ts` for dynamic imports and code splitting  | No dynamic imports for heavy libs (Leaflet, Sentry) → S2 |
| 12.2 | Font loading strategy    | Check `public/fonts/` usage and `font-display` setting         | No `font-display: swap` → S3; render-blocking fonts → S2 |
| 12.3 | Image lazy loading       | Check Image components for `loading="lazy"` or Next Image      | Above-fold images with lazy loading → S3; no lazy → S2   |
| 12.4 | Firestore query patterns | Grep for `getDocs`, `getDoc` — check for missing `limit()`     | Unbounded queries (no limit) on large collections → S1   |
| 12.5 | React re-render patterns | Check for missing `useMemo`/`useCallback` on expensive renders | Context value causing full tree re-render → S2 finding   |
| 12.6 | Lighthouse dev dashboard | Read `components/dev/lighthouse-tab.tsx` — verify it works     | Dev tool misconfigured or outdated → S3 finding          |
| 12.7 | Client-side data caching | Check for duplicate Firestore reads on navigation              | Same data fetched on every page visit → S2 finding       |
| 12.8 | CSS unused rules         | Check `globals.css` size and Tailwind purge config             | Large CSS bundle with unused rules → S3 finding          |

### Key Files

- `next.config.ts` (bundling config)
- `public/fonts/` (custom fonts)
- `components/notebook/` (main rendering path)
- `hooks/` (data fetching patterns)
- `components/dev/lighthouse-tab.tsx`
- `app/globals.css`

### Suggestions Template

For unbounded Firestore queries:

- **Suggestion:** "Accept at S1. Queries without `limit()` on growing
  collections (journal entries, daily logs) will degrade linearly as data grows.
  A user with 365 days of entries will load all of them on every page visit."
- **Counter-argument:** "If the UI needs all entries for features like
  history/growth views, limiting the query requires pagination UI. The fix is
  E2-E3 depending on the feature."

---

## Domain 13: Config File Consistency

**Risk:** LOW | **Expected Findings:** 2-5 | **Session:** 4

Audits configuration files for internal consistency, conflicts between
TypeScript configs, and correct tool setup.

### Checks

| ID   | Check                        | Method                                                           | Finding Criteria                                    |
| ---- | ---------------------------- | ---------------------------------------------------------------- | --------------------------------------------------- |
| 13.1 | tsconfig root vs functions   | Compare `tsconfig.json` with `functions/tsconfig.json`           | Conflicting compiler options → S2 finding           |
| 13.2 | Package.json scripts audit   | List all scripts, check for dead/broken scripts                  | Scripts referencing non-existent files → S2 finding |
| 13.3 | Firebase config consistency  | Compare `firebase.json` with actual project structure            | Mismatched hosting/functions paths → S2 finding     |
| 13.4 | Tailwind v4 config           | Verify CSS-based config is complete (no legacy JS config)        | Mixed old/new Tailwind config → S2 finding          |
| 13.5 | ESLint flat config migration | Verify `eslint.config.mjs` is complete and no `.eslintrc` exists | Legacy config alongside flat config → S2 finding    |
| 13.6 | Vitest config alignment      | Check vitest.config.ts matches tsconfig paths                    | Path alias mismatch → S2 finding                    |
| 13.7 | next.config.ts completeness  | Verify all necessary config for static export                    | Missing config for static export edge cases → S2    |

### Key Files

- `tsconfig.json`, `functions/tsconfig.json`
- `package.json`, `functions/package.json`
- `firebase.json`
- `eslint.config.mjs`
- `vitest.config.ts`
- `next.config.ts`
- `app/globals.css` (Tailwind v4 CSS config)

---

## Domain 14: Documentation & Canon

**Risk:** LOW | **Expected Findings:** 5-10 | **Session:** 4

Audits documentation freshness, CANON reference validity, archive health, and
the `analysis/` directory contents.

### Checks

| ID   | Check                     | Method                                                        | Finding Criteria                                       |
| ---- | ------------------------- | ------------------------------------------------------------- | ------------------------------------------------------ |
| 14.1 | CANON reference inventory | Grep for `CANON-\d+` across codebase                          | List all references with file:line → informational     |
| 14.2 | CANON reference validity  | Check if each CANON-XXXX has a corresponding document         | Orphaned reference → S3 finding per orphan             |
| 14.3 | Doc header freshness      | Check `Last Updated` dates in doc headers                     | Doc not updated in > 90 days → S3 finding              |
| 14.4 | Analysis directory review | Read `analysis/` — 15 files from earlier pass                 | Outdated or conflicting analysis → S3 finding          |
| 14.5 | Archive validity          | Check `docs/archive/` for referenced but moved docs           | Broken references to archived docs → S3 finding        |
| 14.6 | README accuracy           | Compare README.md claims with actual project state            | README mentions features that don't exist → S2 finding |
| 14.7 | DOCUMENTATION_STANDARDS   | Verify docs follow the 5-tier hierarchy                       | Docs outside hierarchy → S3 finding                    |
| 14.8 | AI_REVIEW_LEARNINGS_LOG   | Check if learnings log is current and referenced              | Stale learnings log → S3 finding                       |
| 14.9 | Audit ecosystem health    | Check `docs/audits/` — 80+ files across templates and results | Orphaned results, stale templates → S3 per issue       |

### Key Files

- All files containing `CANON-\d+` references
- `analysis/` (15 files)
- `docs/archive/`
- `README.md`
- `docs/DOCUMENTATION_STANDARDS.md`
- `docs/AI_REVIEW_LEARNINGS_LOG.md`
- `docs/audits/` (audit ecosystem)

---

## Domain 15: PWA & Offline

**Risk:** MEDIUM | **Expected Findings:** 4-8 | **Session:** 4

Audits PWA manifest completeness, installability, offline behavior, and the gap
between offline-indicator UI and actual offline capability.

### Checks

| ID   | Check                        | Method                                                          | Finding Criteria                                      |
| ---- | ---------------------------- | --------------------------------------------------------------- | ----------------------------------------------------- |
| 15.1 | Manifest completeness        | Read `public/manifest.json` against PWA checklist               | Missing required fields → S2 per field                |
| 15.2 | Icon format and sizes        | Check icon files: format, sizes, maskable                       | JPG icons (should be PNG) → S2; no maskable icon → S2 |
| 15.3 | Service worker               | Check for service worker registration                           | No service worker → S2 (PWA without offline)          |
| 15.4 | Offline indicator vs reality | Read `offline-indicator.tsx` — does it match actual capability? | UI claims offline support but no SW → S2 finding      |
| 15.5 | Install prompt               | Read `install-prompt.tsx` — verify install flow works           | Broken install prompt → S2 finding                    |
| 15.6 | Apple touch icon             | Check for apple-touch-icon meta tag                             | Missing → S3 finding                                  |
| 15.7 | Theme color consistency      | Compare manifest theme_color with meta tag                      | Mismatch → S3 finding                                 |
| 15.8 | Splash screen                | Check for PWA splash screen configuration                       | Missing splash → S3 finding                           |

### Key Files

- `public/manifest.json`
- `public/pwa-icon.jpg`
- `components/pwa/install-prompt.tsx`
- `components/pwa/offline-indicator.tsx`
- `app/layout.tsx` (meta tags, manifest link)

### Known Issues (from research)

- Icons use JPG format (should be PNG for transparency)
- Same JPG file for both 192x192 and 512x512 sizes
- No maskable icon defined
- No service worker — PWA is install-only with no offline support
- `offline-indicator.tsx` exists but there's no actual offline capability

### Suggestions Template

For missing service worker:

- **Suggestion:** "Accept at S2. A PWA without a service worker can be installed
  but provides no offline experience. For a recovery app used by people who may
  have unreliable connectivity, offline access to at least their daily log would
  be valuable."
- **Counter-argument:** "Service worker implementation is E3 effort. The app's
  core features require Firestore (online). Offline would require a local-first
  architecture change."

---

## Domain 16: TDMS Integrity

**Risk:** LOW | **Expected Findings:** 2-5 | **Session:** 4

Audits the Technical Debt Management System itself — data integrity, duplicate
entries, resolved item accuracy, and schema compliance.

### Checks

| ID   | Check                     | Method                                                        | Finding Criteria                                         |
| ---- | ------------------------- | ------------------------------------------------------------- | -------------------------------------------------------- |
| 16.1 | JSONL validity            | Parse every line of MASTER_DEBT.jsonl                         | Invalid JSON lines → S1 finding                          |
| 16.2 | Schema compliance         | Verify all entries have required fields (id, severity, title) | Missing required fields → S2 per entry                   |
| 16.3 | Duplicate detection       | Check for entries with identical titles or file+line          | Duplicates → S3 finding per duplicate pair               |
| 16.4 | Resolved item accuracy    | Sample resolved items — verify they're actually fixed         | Resolved but not fixed → S2 finding                      |
| 16.5 | Severity distribution     | Analyze S0/S1/S2/S3 distribution for anomalies                | > 50% S0 or 0% S0 in 2656 items → suspicious, S3 finding |
| 16.6 | Stale entries             | Check for items open > 30 days without activity               | Stale items → informational, not a finding               |
| 16.7 | Cross-reference with code | Sample entries — verify referenced files still exist          | References to deleted files → S3 finding                 |

### Key Files

- `docs/technical-debt/MASTER_DEBT.jsonl`
- `docs/technical-debt/PROCEDURE.md`
- `docs/technical-debt/FALSE_POSITIVES.jsonl`

---

## Domain 17: Prior Audit Findings

**Risk:** MEDIUM | **Expected Findings:** 5-15 | **Session:** 5

Cross-references findings from all prior audits (single-session, multi-AI) to
identify unresolved issues, regressions, and pattern recurrence.

### Checks

| ID   | Check                              | Method                                                          | Finding Criteria                                           |
| ---- | ---------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------- |
| 17.1 | Prior audit inventory              | List all files in `docs/audits/single-session/` and `multi-ai/` | Informational — establishes baseline                       |
| 17.2 | Unresolved S0/S1 from prior audits | Read prior JSONL findings, check if S0/S1 items are fixed       | Still-open S0/S1 from prior audit → S1 finding             |
| 17.3 | Recurring patterns                 | Compare prior findings with current codebase state              | Same issue found in 2+ prior audits and still present → S1 |
| 17.4 | Multi-AI audit consensus           | Read `maa-2026-02-17` UNIFIED-FINDINGS.jsonl                    | Consensus findings (3+ AIs agreed) still open → S1         |
| 17.5 | Prior audit staleness              | Check dates of most recent audits per domain                    | No audit in > 30 days for a domain → S3                    |
| 17.6 | False positives review             | Read FALSE_POSITIVES.jsonl — are they still false positives?    | Previously FP'd item now valid → S2 finding                |
| 17.7 | AUDIT_TRACKER currency             | Read `AUDIT_TRACKER.md` — does it reflect recent audits?        | Missing entries → S3 finding                               |

### Key Files

- `docs/audits/single-session/*/` (9 domain directories)
- `docs/audits/multi-ai/maa-2026-02-17-182d43/`
- `docs/audits/AUDIT_TRACKER.md`
- `docs/audits/RESULTS_INDEX.md`
- `docs/technical-debt/FALSE_POSITIVES.jsonl`

### Suggestions Template

For recurring unresolved findings:

- **Suggestion:** "Accept at S1. A finding that appears in multiple prior audits
  and is still present indicates a systemic avoidance pattern — either the fix
  is too expensive (re-prioritize) or it keeps getting deferred (escalate)."
- **Counter-argument:** "Some findings are intentionally deferred because the
  fix requires architectural changes planned for a future milestone."

---

## Domain 18: Admin Panel

**Risk:** MEDIUM | **Expected Findings:** 3-8 | **Session:** 5

Audits the 17-tab admin panel for completeness, function connectivity,
authorization consistency, and data integrity of admin operations.

### Checks

| ID   | Check                          | Method                                                       | Finding Criteria                                    |
| ---- | ------------------------------ | ------------------------------------------------------------ | --------------------------------------------------- |
| 18.1 | Admin tab inventory            | List all files in `components/admin/` — verify 17 tabs exist | Missing tabs → S2 finding                           |
| 18.2 | Tab-to-function mapping        | Map each admin tab to its corresponding Cloud Function       | Tab without corresponding function → S2 finding     |
| 18.3 | Admin authorization uniformity | Compare auth checks across all admin Cloud Functions         | Inconsistent admin check patterns → S2 finding      |
| 18.4 | CRUD operation completeness    | For each entity (meetings, quotes, etc), verify CRUD exists  | Missing delete or update for managed entities → S2  |
| 18.5 | Admin soft-delete consistency  | Compare soft-delete logic across all admin delete operations | Inconsistent soft-delete patterns → S2 finding      |
| 18.6 | Privilege types management     | Read privilege system — verify CRUD for privilege types      | Incomplete privilege management → S2 finding        |
| 18.7 | Error handling in admin tabs   | Check admin tabs for error boundaries and loading states     | Admin tab crashes on error → S2 finding             |
| 18.8 | Admin analytics tab            | Read analytics-tab.tsx — verify it shows meaningful data     | Analytics tab is placeholder or broken → S3 finding |

### Key Files

- `components/admin/` (17 files)
- `functions/src/admin.ts` (3100+ lines)
- `functions/src/index.ts` (shared admin functions)

### Suggestions Template

For admin auth inconsistency:

- **Suggestion:** "Accept at S2. If some admin functions check
  `request.auth.token.admin === true` and others check a Firestore field, the
  inconsistency is a maintenance risk even if both currently work."
- **Counter-argument:** "If all admin functions are behind the same admin route
  guard on the client and all verify auth server-side (just differently), the
  practical risk is low."

---

## Domain 19: Data Integrity & Migration

**Risk:** HIGH | **Expected Findings:** 3-8 | **Session:** 5

Audits data migration paths, soft-delete lifecycle, scheduled cleanup jobs, and
data consistency between client expectations and server storage.

### Checks

| ID   | Check                            | Method                                                          | Finding Criteria                                               |
| ---- | -------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------- |
| 19.1 | Anonymous migration completeness | Read `migrateAnonymousUserData` — verify all collections copied | Missing collections → S0 finding (data loss)                   |
| 19.2 | Migration transaction safety     | Check if migration uses transactions for atomicity              | Non-transactional migration → S1 finding                       |
| 19.3 | Soft-delete lifecycle            | Trace: soft-delete → scheduled hard-delete → verify chain       | Broken chain (soft-deleted never hard-deleted) → S2            |
| 19.4 | Scheduled job error handling     | Read `scheduledHardDeleteSoftDeletedUsers` for error handling   | Unhandled errors in scheduled delete → S1 finding              |
| 19.5 | Data schema validation           | Check if Firestore data matches Zod schemas in functions        | Client writes fields server doesn't validate → S2              |
| 19.6 | Timestamp consistency            | Check timestamp handling (client vs server timestamps)          | Client-generated timestamps accepted without server check → S2 |
| 19.7 | Account linking data integrity   | Read `account-linking.ts` — verify data isn't lost on link      | Data loss on account linking → S0 finding                      |
| 19.8 | Backup/recovery capability       | Check if any backup strategy exists for Firestore data          | No backup strategy → S2 finding                                |

### Key Files

- `functions/src/index.ts` (migrateAnonymousUserData)
- `functions/src/scheduled.ts` (scheduledHardDeleteSoftDeletedUsers)
- `lib/firebase/account-linking.ts`
- `hooks/use-journal.ts` (timestamp validation — CANON-0042)

### Suggestions Template

For missing backup strategy:

- **Suggestion:** "Accept at S2. Firestore data (recovery journals, daily logs)
  has no documented backup strategy. Google's built-in Firestore exports should
  be configured for point-in-time recovery."
- **Counter-argument:** "Firestore has automatic replication across zones. Data
  loss from Google infrastructure failure is extremely unlikely. The bigger risk
  is accidental deletion by admin operations."

---

## Domain 20: Final Report & Cross-Cutting Analysis

**Risk:** NONE (synthesis) | **Expected Findings:** 3-5 cross-cutting |
**Session:** 6

Synthesizes all domain findings into the final report, identifies cross-cutting
patterns, and generates the unified findings file.

### Steps (not checks — this is a synthesis domain)

| ID   | Step                           | Method                                                      | Output                                                     |
| ---- | ------------------------------ | ----------------------------------------------------------- | ---------------------------------------------------------- |
| 20.1 | Merge all domain JSONL         | Concatenate d00-d22 JSONL files into unified-findings.jsonl | Single file with all accepted findings                     |
| 20.2 | Deduplicate cross-domain       | Check for same file+line appearing in multiple domains      | Merge duplicates, note which domains found them            |
| 20.3 | Cross-cutting pattern scan     | Group findings by file, category, and fix-type              | List patterns (e.g., "8 validation gaps across 4 domains") |
| 20.4 | Severity distribution analysis | Calculate S0/S1/S2/S3 percentages                           | Distribution chart and anomaly flags                       |
| 20.5 | Risk matrix generation         | Rank domains by finding count × severity                    | Per-domain risk table                                      |
| 20.6 | Effort estimation              | Sum effort estimates across all findings                    | Total hours estimate                                       |
| 20.7 | Generate SUMMARY.md            | Write full report (see WORKFLOW.md for template)            | Final report document                                      |
| 20.8 | Present report to user         | Show executive summary, ask for approval                    | INTERACTIVE: approve/edit/add notes                        |

### INTERACTIVE: Cross-Cutting Patterns

For each detected pattern, present with suggestion:

```
Pattern: "Missing validation at boundaries"
8 findings across 4 domains (D07, D08, D09, D11)

Suggestion: Promote to standalone systemic finding.
Addressing as one unit (shared Zod schemas) is more
efficient than 8 separate fixes. Est: E3 as unit vs E2×8.

○ Promote to standalone finding  [Recommended]
○ Note only (mention in report)
○ Dismiss (coincidental, not systemic)
```

### INTERACTIVE: Final Report Approval

```
○ Approve report as-is  [Recommended]
○ Edit executive summary
○ Add/remove sections
○ Add notes before finalizing
```

### Key Output Files

- `docs/audits/comprehensive/audit-YYYY-MM-DD/SUMMARY.md`
- `docs/audits/comprehensive/audit-YYYY-MM-DD/unified-findings.jsonl`

---

## Domain 21: Post-Test Self-Audit

**Risk:** NONE (quality gate) | **Expected Findings:** 1-3 meta-findings |
**Session:** 6

The audit audits itself. Verifies completeness, quality, and identifies gaps in
the audit's own execution.

### Checks

| ID   | Check                         | Method                                                         | Finding Criteria                                      |
| ---- | ----------------------------- | -------------------------------------------------------------- | ----------------------------------------------------- |
| 21.1 | Domain completion             | Verify all 23 domains executed (check PLAN_INDEX.md)           | Skipped domains → meta-finding                        |
| 21.2 | Check coverage                | Cross-reference: every check ID was actually run               | Unexecuted checks → meta-finding per check            |
| 21.3 | Zero-finding domains          | Flag domains with 0 findings as suspicious                     | 0 findings in medium/high risk domain → meta-finding  |
| 21.4 | Severity distribution quality | Check for unrealistic distributions (all S3, no S1)            | Skewed distribution → meta-finding                    |
| 21.5 | Finding ID uniqueness         | Verify no duplicate IDs across all JSONL files                 | Duplicate IDs → meta-finding                          |
| 21.6 | JSONL validity                | Parse all domain JSONL files for valid JSON                    | Invalid JSONL → meta-finding                          |
| 21.7 | Deferred items disposition    | Count deferred items not yet revisited                         | Unresolved deferrals → meta-finding (trigger revisit) |
| 21.8 | PLAN_INDEX consistency        | Verify PLAN_INDEX.md matches actual files on disk              | Mismatch → meta-finding                               |
| 21.9 | Evidence quality              | Sample 5 findings — verify evidence is actual code not generic | Vague evidence → meta-finding                         |

### INTERACTIVE: Self-Audit Results

```
Self-audit found N items:

SA-001 [meta] Domain 15 had 0 findings (medium risk domain)
  → Suggestion: Re-run with deeper PWA checks

SA-002 [meta] 3 deferred findings never revisited
  → Suggestion: Present for final disposition now

○ Accept findings, move to final report
○ Re-run flagged domains
○ Revisit deferred findings now
○ Both: re-run AND revisit
```

---

## Domain 22: Sentry & Monitoring

**Risk:** MEDIUM | **Expected Findings:** 3-6 | **Session:** 6

Audits the dual-logger Sentry architecture (client + server), PII redaction
coverage, monitoring configuration, and observability gaps.

### Checks

| ID   | Check                           | Method                                                            | Finding Criteria                                    |
| ---- | ------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------- |
| 22.1 | Client Sentry config            | Read `sentry.client.config.ts` for DSN, sampling, integrations    | Missing or placeholder DSN → S2 finding             |
| 22.2 | Server Sentry config            | Read `sentry.server.config.ts` for consistency with client        | Client/server Sentry config divergence → S2 finding |
| 22.3 | Dual-logger architecture        | Compare `lib/logger.ts` (client) vs `security-logger.ts` (server) | Different SENSITIVE_KEYS lists → S1 finding         |
| 22.4 | PII redaction coverage (client) | Read `lib/logger.ts` SENSITIVE_KEYS, compare with actual data     | Fields containing PII not in SENSITIVE_KEYS → S1    |
| 22.5 | PII redaction coverage (server) | Read `security-logger.ts` SENSITIVE_KEYS, compare                 | Same check for server-side logger                   |
| 22.6 | Log injection prevention        | Check if logger sanitizes control characters                      | Missing sanitization → S1 finding                   |
| 22.7 | Error boundary coverage         | Check React error boundaries that report to Sentry                | Missing error boundaries on critical paths → S2     |
| 22.8 | Source map upload               | Check if source maps are uploaded for production debugging        | No source map upload → S2 finding                   |
| 22.9 | Instrumentation config          | Check `instrumentation.ts` for proper Next.js integration         | Missing or misconfigured instrumentation → S2       |

### Key Files

- `lib/logger.ts` (client-side logger with Sentry)
- `functions/src/security-logger.ts` (server-side logger with Sentry)
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `instrumentation.ts`
- `next.config.ts` (Sentry webpack plugin)

### Known Issues (from research)

- Two separate Sentry integrations: `@sentry/nextjs` (client) and `@sentry/node`
  (server)
- Two separate SENSITIVE_KEYS lists with potentially different coverage
- Two separate redaction algorithms (client uses `looksLikeSensitiveId`
  heuristic, server may differ)
- `lib/logger.ts` strips control characters (line 87) — good, but verify server
  does too

### Suggestions Template

For dual-logger SENSITIVE_KEYS mismatch:

- **Suggestion:** "Accept at S1. If the client logger redacts 'uid' but the
  server logger doesn't (or vice versa), PII could leak through one channel. The
  lists should be identical or share a common module."
- **Counter-argument:** "Client and server handle different data. The client
  sees user input while the server sees request metadata. Different
  SENSITIVE_KEYS may be intentional."
- **Suggested fix:** "Extract SENSITIVE_KEYS to a shared module imported by both
  loggers. If they must differ, document why explicitly."

---

<!-- ═══════════════════════════════════════════════════════ -->
<!-- POST-DOMAIN SECTIONS                                   -->
<!-- ═══════════════════════════════════════════════════════ -->

## TDMS Sync Protocol

After Domain 20 report is generated:

1. **Preview** — show count of new findings, duplicates, updates
2. **Deduplication** — match on file + title (>80% fuzzy match)
3. **Ask user** — sync all / S0+S1 only / preview diff / skip
4. **Execute** — append accepted findings to MASTER_DEBT.jsonl
5. **Verify** — confirm TDMS item count after sync

---

## Finding JSONL Schema

```jsonl
{
  "id": "COMP-2026-02-18-D07-003",
  "domain": 7,
  "domain_name": "Cloud Functions",
  "check_id": "7.2",
  "severity": "S1",
  "effort": "E2",
  "category": "correctness",
  "title": "Short title < 80 chars",
  "description": "Full description",
  "file": "relative/path.ts",
  "line": 287,
  "evidence": "Actual code or output",
  "suggested_fix": "How to fix",
  "status": "accepted|rejected|deferred",
  "suggestion_text": "Recommendation shown to user",
  "counter_argument": "Why opposite decision valid",
  "related_findings": [
    "D07-001"
  ],
  "detected_at": "ISO8601",
  "reviewed_at": "ISO8601"
}
```

---

## Severity & Effort Scales

| Sev | Name     | Meaning                                  | Response        |
| --- | -------- | ---------------------------------------- | --------------- |
| S0  | Critical | Security breach, data loss, app crash    | Fix immediately |
| S1  | High     | Significant bug, security risk, UX break | Fix this sprint |
| S2  | Medium   | Moderate issue, tech debt, minor UX      | Schedule fix    |
| S3  | Low      | Cosmetic, optimization, nice-to-have     | Backlog         |

| Eff | Name    | Meaning                        |
| --- | ------- | ------------------------------ |
| E0  | Minutes | Quick fix, config change       |
| E1  | < 1 hr  | Small code change, one file    |
| E2  | Hours   | Multi-file change, design work |
| E3  | Days    | Major refactor, new subsystem  |

---

## Version History

| Version | Date       | Description                                                  |
| ------- | ---------- | ------------------------------------------------------------ |
| 4.0     | 2026-02-18 | 23-domain interactive audit with suggestions and TDMS sync   |
| 3.1     | 2026-02-14 | Extract reference docs: wave details, recovery, triage guide |
| 3.0     | 2026-02-14 | 9-domain coverage: add enhancements + ai-optimization        |
| 2.1     | 2026-02-03 | Added Triage & Roadmap Integration with priority scoring     |
| 2.0     | 2026-02-02 | Staged execution (4+2+1), S0/S1 escalation, checkpoints      |
| 1.0     | 2026-01-28 | Initial version - flat parallel execution of all 6 audits    |

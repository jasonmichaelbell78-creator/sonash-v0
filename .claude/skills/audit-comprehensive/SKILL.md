---
name: audit-comprehensive
description:
  23-domain interactive comprehensive audit with per-finding review,
  suggestions, TDMS sync, and multi-session support
supports_parallel: false
version: "4.0"
estimated_sessions: 6
total_domains: 23
total_checks: "~100"
---

# Comprehensive 23-Domain Interactive Audit

**Version:** 4.0 (23-Domain Interactive with Suggestions) **Replaces:** v3.1
(9-domain wave orchestrator) **Sessions:** 6 recommended (can run as single long
session) **Output:** Per-domain JSONL + unified findings + SUMMARY.md report

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
/audit-comprehensive                  # Fresh full audit
/audit-comprehensive --resume         # Resume from checkpoint
/audit-comprehensive --domain 7       # Re-run single domain
/audit-comprehensive --from 8 --to 11 # Run session range
/audit-comprehensive --dry-run        # Preview checks only
/audit-comprehensive --batch          # Skip interactive review
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
6. **Commit**: `audit(comprehensive): initialize audit-YYYY-MM-DD`

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
8. **Commit** — `audit(comprehensive): Domain N — <name> [M/23]`
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

- `.claude/skills/audit-comprehensive/SKILL.md` (this file)
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

<!-- PLACEHOLDER: Will be filled with checks -->

---

## Domain 13: Config File Consistency

<!-- PLACEHOLDER: Will be filled with checks -->

---

## Domain 14: Documentation & Canon

<!-- PLACEHOLDER: Will be filled with checks -->

---

## Domain 15: PWA & Offline

<!-- PLACEHOLDER: Will be filled with checks -->

---

## Domain 16: TDMS Integrity

<!-- PLACEHOLDER: Will be filled with checks -->

---

## Domain 17: Prior Audit Findings

<!-- PLACEHOLDER: Will be filled with checks -->

---

## Domain 18: Admin Panel

<!-- PLACEHOLDER: Will be filled with checks -->

---

## Domain 19: Data Integrity & Migration

<!-- PLACEHOLDER: Will be filled with checks -->

---

## Domain 20: Final Report & Cross-Cutting Analysis

<!-- PLACEHOLDER: Will be filled with checks -->

---

## Domain 21: Post-Test Self-Audit

<!-- PLACEHOLDER: Will be filled with checks -->

---

## Domain 22: Sentry & Monitoring

<!-- PLACEHOLDER: Will be filled with checks -->

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

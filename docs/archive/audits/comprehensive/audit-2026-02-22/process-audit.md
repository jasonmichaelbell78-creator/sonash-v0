<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-22
**Status:** ACTIVE
<!-- prettier-ignore-end -->

<!-- audit-header -->

# Process & Automation Audit — sonash-v0

**Date:** 2026-02-22 **Auditor:** process-auditor agent **Scope:** CI/CD,
pre-commit hooks, test strategy, npm scripts, deployment, code review, build
system, dependency management, release process **Status:** COMPLETE

---

## 1. Executive Summary

The sonash-v0 project demonstrates a highly mature, defense-in-depth automation
posture. The pre-commit/pre-push hook chain is especially sophisticated — 11
named checks in pre-commit, 7 in pre-push — with well-designed parallelism,
skip-reason audit trails, and injection-safe SKIP_REASON validation. The CI
pipeline (10 workflows) covers quality, security, documentation, and debt
management at a level that exceeds most production codebases.

**Key strengths:**

- Pre-commit hook parallelizes the two slowest checks (ESLint + tests), saving
  ~50% time
- CI uses SHA-pinned third-party actions for supply-chain security
  (CVE-2025-30066 response)
- Automated technical debt resolution via `resolve-debt.yml` on PR merge
- Automated review-tier labeling, PR templates, and cross-doc dependency checks
- 96 npm scripts covering tooling, debt, sessions, audits, reviews, and security

**Key gaps:**

- No Dependabot or Renovate for automated dependency updates
- No coverage thresholds enforced — `c8` runs but doesn't gate on percentage
- Zero Cloud Functions unit tests
- Several high-profile GitHub Actions (checkout, setup-node, github-script) use
  floating version tags, not SHA pins
- `firebase-tools` installed globally each run (slow, non-deterministic version)
- No CHANGELOG, no versioning strategy beyond `0.1.0`
- Single monolithic CI job (`lint-typecheck-test`) installs dependencies twice
  across two serial jobs with no shared cache artifact
- The `docs-lint.yml` uses an unpinned `tj-actions/changed-files@v46` (same
  action that had CVE-2025-30066)

**Overall risk:** LOW-MEDIUM. Process automation is strong. Primary gaps are in
dependency governance, test coverage enforcement, and full action pinning.

---

## 2. Top Findings Table

| ID   | Area                  | Finding                                                                                   | Severity | Effort |
| ---- | --------------------- | ----------------------------------------------------------------------------------------- | -------- | ------ |
| P-01 | Dependency Management | No automated dependency updates (no Dependabot/Renovate)                                  | S1       | E1     |
| P-02 | Test Strategy         | No test coverage thresholds — c8 runs but never blocks                                    | S1       | E0     |
| P-03 | Test Strategy         | Zero Cloud Functions unit tests — security-critical business logic untested               | S1       | E3     |
| P-04 | CI/CD                 | Most GitHub Actions use floating tags, not SHA pins                                       | S2       | E1     |
| P-05 | CI/CD                 | `docs-lint.yml` uses unpinned `tj-actions/changed-files@v46` (same CVE vector)            | S2       | E0     |
| P-06 | Deployment            | `firebase-tools` installed globally per deploy run — no version lock                      | S2       | E1     |
| P-07 | CI/CD                 | `build` job re-runs `npm ci` without sharing artifact from `lint-typecheck-test`          | S3       | E1     |
| P-08 | Release Process       | No CHANGELOG, no release tagging, no automated release notes                              | S3       | E2     |
| P-09 | Test Strategy         | No e2e tests — Playwright is a devDependency but unused                                   | S2       | E3     |
| P-10 | npm Scripts           | 96 scripts without a README or grouping guide — discoverability poor                      | S3       | E1     |
| P-11 | Build System          | `next.config.mjs` uses `output: "export"` — no SSR, limits Next.js 16 features            | S3       | E3     |
| P-12 | Pre-commit Hook       | Hook logs to `.git/hook-output.log` but log is never rotated — unbounded growth           | S3       | E0     |
| P-13 | CI/CD                 | `require_skip_reason` function is duplicated verbatim in both `pre-commit` and `pre-push` | S3       | E1     |
| P-14 | Deployment            | Preview deploy channel is commented out — PR-level previews not working                   | S2       | E2     |
| P-15 | CI/CD                 | `sync-readme.yml` uses `--no-verify` on the auto-commit, bypassing hooks                  | S3       | E0     |

---

## 3. Detailed Findings

### S1 — High Severity

#### P-01: No Automated Dependency Updates

**Area:** Dependency Management **Severity:** S1 | **Effort:** E1

No `dependabot.yml` or Renovate config exists. With 36 production dependencies
and 37 devDependencies (73 total), plus a separate `functions/` package,
vulnerabilities will accumulate between manual update runs. The pre-push hook
runs `npm audit --audit-level=high` as a non-blocking warning, which means known
high/critical CVEs in dependencies will not stop pushes or deploys.

**Recommendation:** Add `.github/dependabot.yml` with:

- `npm` ecosystem, weekly schedule, grouped updates
- Separate entry for `functions/` directory
- Auto-merge for patch-level updates only

#### P-02: No Test Coverage Thresholds

**Area:** Test Strategy **Severity:** S1 | **Effort:** E0

The CI runs `npm run test:coverage` using `c8`, and the coverage report is
uploaded as an artifact. However, there is no `.c8rc`, `c8` key in
`package.json`, or `--threshold` flag on the coverage command. Coverage can be
0% and CI still passes. This means regressions that remove tests entirely would
go undetected.

**Recommendation:** Add a `.c8rc` or `c8` config in `package.json`:

```json
"c8": {
  "all": true,
  "branches": 60,
  "functions": 60,
  "lines": 60,
  "statements": 60
}
```

Start with a low threshold and ratchet up over time.

#### P-03: Zero Cloud Functions Unit Tests

**Area:** Test Strategy **Severity:** S1 | **Effort:** E3

The `functions/` directory has no test files (only `node_modules` contained test
stubs from Firebase's own packages). Cloud Functions contain security-critical
business logic (rate limiting, Firestore writes, App Check enforcement). These
are entirely untested. The `@firebase/rules-unit-testing` devDependency exists
at the root level but is unused in tests.

**Recommendation:**

1. Add a `functions/tests/` directory with Mocha or Jest unit tests
2. Add `functions/package.json` test script: `"test": "mocha lib/**/*.test.js"`
3. Include in CI: `npm --prefix functions test`

---

### S2 — Medium Severity

#### P-04: Floating Version Tags on Core GitHub Actions

**Area:** CI/CD **Severity:** S2 | **Effort:** E1

Most workflows use floating version references (`@v4`) for `actions/checkout`,
`actions/setup-node`, `actions/upload-artifact`, and `actions/github-script`.
The `ci.yml` file correctly pins `tj-actions/changed-files` to a SHA (citing
CVE-2025-30066), but the same security principle is not applied to other
actions. A compromised release of `actions/checkout@v4` could exfiltrate
secrets.

**Files affected:**

- `ci.yml`: `actions/checkout@v4`, `actions/setup-node@v4`,
  `actions/upload-artifact@v4`
- `deploy-firebase.yml`: `actions/checkout@v4`, `actions/setup-node@v4`
- `auto-label-review-tier.yml`: `actions/checkout@v4`, `actions/setup-node@v4`,
  `actions/github-script@v7`
- `review-check.yml`: `actions/checkout@v4`, `actions/setup-node@v4`,
  `actions/github-script@v7`
- `docs-lint.yml`: `actions/checkout@v4`, `actions/setup-node@v4`,
  `actions/github-script@v7`

**Recommendation:** Pin all actions to SHAs. Example:

```yaml
uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
```

Use `pin-github-action` CLI or Dependabot's action-pin feature to automate.

#### P-05: Unpinned `tj-actions/changed-files` in `docs-lint.yml`

**Area:** CI/CD **Severity:** S2 | **Effort:** E0

`docs-lint.yml` uses `tj-actions/changed-files@v46` without a SHA. This is the
exact same action that triggered the CVE-2025-30066 supply-chain incident, which
was patched in `ci.yml` by pinning to a specific SHA. The fix was applied
inconsistently.

**Recommendation:** Pin to the same SHA already used in `ci.yml`:

```yaml
uses: tj-actions/changed-files@26a38635fc1173cc5820336ce97be6188d0de9f5 # v46.0.2
```

#### P-06: Global `firebase-tools` Install Per Deploy Run

**Area:** Deployment **Severity:** S2 | **Effort:** E1

`deploy-firebase.yml` runs `npm install -g firebase-tools` on each deployment
with no version pin. This can install different CLI versions on different runs,
causing non-deterministic deployments. The global install also adds ~30-60
seconds to each deploy run.

**Recommendation:** Add `firebase-tools` as a devDependency in `package.json`
with a pinned version:

```json
"firebase-tools": "^14.x.x"
```

Then run as `npx firebase` or use `./node_modules/.bin/firebase`. This makes the
version reproducible and leverages the existing `npm ci` cache.

#### P-09: No E2E Tests — Playwright Installed But Unused

**Area:** Test Strategy **Severity:** S2 | **Effort:** E3

`@playwright/test: ^1.58.1` is listed as a devDependency, but there is no
`playwright.config.ts`, no `e2e/` directory, and no npm script that invokes
Playwright. The test suite covers unit and integration tests, but there is no
end-to-end coverage of critical user flows (auth, journal entry creation, data
persistence).

**Recommendation:**

1. Create a `playwright.config.ts` with baseline config
2. Add at minimum 3-5 smoke tests for: login, entry creation, data load
3. Add an `e2e` npm script and optional CI gate

#### P-14: Preview Deploy Channel Commented Out

**Area:** Deployment **Severity:** S2 | **Effort:** E2

In `deploy-firebase.yml`, the `pull_request_target` trigger for preview deploys
is commented out with the note: "Preview deploys disabled — GitHub repo
variables not configured." The preview deploy `job` (`preview-deploy`) still
exists but the trigger condition
`if: ${{ github.event_name == 'pull_request_target' && ... }}` can never be
true, making the entire job dead code.

**Impact:** Every PR merges to production without a staging preview. Developers
cannot verify changes in a Firebase environment before merging.

**Recommendation:** Either:

1. Configure the GitHub repository variables (`NEXT_PUBLIC_FIREBASE_*`) and
   re-enable the trigger
2. Remove the dead `preview-deploy` job entirely to reduce confusion

---

### S3 — Low Severity

#### P-07: CI Build Job Reinstalls Dependencies

**Area:** CI/CD **Severity:** S3 | **Effort:** E1

The `ci.yml` has two jobs: `lint-typecheck-test` (job 1) and `build` (job 2,
`needs: lint-typecheck-test`). Both run `npm ci` independently. While the npm
cache is shared via `actions/setup-node` caching, `npm ci` still runs and
validates the lockfile on each job. Node modules are not passed between jobs.

**Recommendation:** Consider using `actions/cache` to upload the `node_modules`
directory as an artifact from job 1 and restore it in job 2, skipping the second
`npm ci`. Alternatively, consolidate the build into a single job.

#### P-08: No CHANGELOG, Versioning Strategy, or Release Process

**Area:** Release Process **Severity:** S3 | **Effort:** E2

`package.json` shows `version: "0.1.0"`. There is no `CHANGELOG.md`, no release
tags in the git log context, no GitHub Releases workflow, and no changelog
automation (e.g., `conventional-changelog`, `release-please`). Given the
sophistication of other automation, this is a notable gap.

**Recommendation:**

1. Add `release-please-action` GitHub workflow for automatic changelog and
   release tag generation based on conventional commits (PR template already
   enforces conventional commit format)
2. Create initial `CHANGELOG.md`

#### P-10: 96 npm Scripts Without Discoverability Guide

**Area:** npm Scripts **Severity:** S3 | **Effort:** E1

There are 96 npm scripts across 37 functional categories. While
`scripts/README.md` exists, there is no grouping or category in `package.json`
itself. New developers or agents face a wall of scripts with no guidance on
which are routine vs. advanced vs. internal automation.

**Recommendation:** Add a brief "Common Scripts" section to the root `README.md`
or `CLAUDE.md` covering the 10-15 most frequently used scripts, grouped by
workflow (dev, test, deploy, debt, audit).

#### P-11: Static Export Limits Next.js 16 Capability

**Area:** Build System **Severity:** S3 | **Effort:** E3

`next.config.mjs` sets `output: "export"`, which generates a fully static site.
This prevents use of Server Components, API routes, middleware, ISR, and other
Next.js 16 capabilities. The tradeoff is Firebase Hosting compatibility, but it
locks the app into a SPA-like model.

**Note:** This may be a deliberate architectural decision. Flagged as
informational.

**Recommendation:** Document this constraint in `ARCHITECTURE.md` with
rationale. If SSR is desired in future, consider Firebase App Hosting (which
supports Next.js SSR).

#### P-12: Pre-commit Hook Log File Never Rotated

**Area:** Pre-commit Hook **Severity:** S3 | **Effort:** E0

The pre-commit hook redirects all output to `.git/hook-output.log`
(`exec > "$HOOK_OUTPUT_LOG" 2>&1`). This file grows unboundedly with each
commit. On repositories with frequent commits over months, this file can become
hundreds of MB.

**Recommendation:** Add a rotation at the top of the hook, before the `exec`
redirect:

```sh
# Rotate log: keep only last 500 lines
if [ -f "$HOOK_OUTPUT_LOG" ]; then
  tail -n 500 "$HOOK_OUTPUT_LOG" > "${HOOK_OUTPUT_LOG}.tmp" && mv "${HOOK_OUTPUT_LOG}.tmp" "$HOOK_OUTPUT_LOG" 2>/dev/null || true
fi
```

#### P-13: `require_skip_reason` Duplicated in Both Hooks

**Area:** Pre-commit/Pre-push **Severity:** S3 | **Effort:** E1

The `require_skip_reason()` function (40+ lines including POSIX-safe validation,
CR/LF injection prevention, max/min length checks) is duplicated verbatim in
both `.husky/pre-commit` and `.husky/pre-push`. If the validation logic ever
needs updating, both files must be updated in sync.

**Recommendation:** Extract to a shared sourced file:

```sh
# .husky/lib/skip-reason-guard.sh
require_skip_reason() { ... }
```

Then in each hook:
`. "$(git rev-parse --show-toplevel)/.husky/lib/skip-reason-guard.sh"`

#### P-15: Auto-commit in `sync-readme.yml` Bypasses Hooks

**Area:** CI/CD **Severity:** S3 | **Effort:** E0

`sync-readme.yml` uses `git commit --no-verify` when auto-committing README
updates from ROADMAP changes. While this is common for bot commits in CI, the
use of `--no-verify` is documented as a pattern to avoid in `CLAUDE.md`. The
commit message is hardcoded and uses a different author identity than normal
commits.

**Note:** `--no-verify` in CI is generally appropriate since hooks rely on local
tooling. Flagged for awareness, not as a critical issue.

---

## 4. CI/CD Pipeline Analysis

### Workflow Inventory

| Workflow                     | Trigger                   | Purpose                                                       | Blocking?           |
| ---------------------------- | ------------------------- | ------------------------------------------------------------- | ------------------- |
| `ci.yml`                     | push/PR to main           | Lint, type-check, test, pattern compliance, schema validation | Yes                 |
| `deploy-firebase.yml`        | push to main, manual      | Deploy hosting, functions, Firestore rules                    | Yes                 |
| `sonarcloud.yml`             | push/PR to main           | Static analysis, security hotspots                            | No (decorates only) |
| `docs-lint.yml`              | PR with .md changes       | Markdown linting, quality checks                              | Yes (for errors)    |
| `backlog-enforcement.yml`    | PR, weekly schedule       | S0 backlog check, security pattern scan                       | Yes                 |
| `review-check.yml`           | PR opened/sync            | Detect PRs needing code review                                | No (advisory)       |
| `auto-label-review-tier.yml` | PR opened/sync/reopen     | Assign tier-0 through tier-4 labels                           | No                  |
| `resolve-debt.yml`           | PR merged                 | Auto-resolve DEBT-XXXX items from PR body                     | No (updates JSONL)  |
| `sync-readme.yml`            | push to main (ROADMAP.md) | Auto-sync README status table                                 | No                  |
| `validate-plan.yml`          | PR with plan file changes | Validate phase completion docs                                | Yes                 |

### CI Job Structure (`ci.yml`)

**Job 1: `lint-typecheck-test`** (single job, sequential within):

1. Checkout + Node setup + `npm ci`
2. ESLint
3. Prettier format check
4. Circular dependencies check
5. Unused dependencies check (knip)
6. Changed-files detection (PR only)
7. Pattern compliance check (PR: changed files; push: all, non-blocking)
8. Pattern test suite (vitest)
9. Documentation check (non-blocking)
10. CANON schema validation
11. Audit file validation (non-blocking)
12. Technical debt schema validation
13. ROADMAP debt reference check
14. Technical debt views staleness check (non-blocking)
15. TypeScript type check
16. Test + coverage
17. Upload coverage artifact

**Job 2: `build`** (needs job 1):

1. Checkout + Node setup + `npm ci`
2. Next.js build with production secrets

**Assessment:** The main CI job is comprehensive but monolithic. It runs 17
steps serially in a single job. Parallelization opportunities exist (ESLint +
type-check could run in parallel, similar to how the pre-commit hook
parallelizes ESLint + tests). The build job could share the `npm ci` artifact
from job 1 instead of reinstalling.

### Action Pinning Security Posture

| Workflow                                | Pinned to SHA                     | Floating Tag                 | Risk   |
| --------------------------------------- | --------------------------------- | ---------------------------- | ------ |
| `ci.yml` (tj-actions)                   | Yes (CVE response)                | -                            | Low    |
| `backlog-enforcement.yml`               | Yes (checkout, setup-node)        | -                            | Low    |
| `sonarcloud.yml`                        | Yes (checkout, sonarcloud-action) | -                            | Low    |
| `ci.yml` (actions/checkout, setup-node) | No                                | @v4                          | Medium |
| `deploy-firebase.yml`                   | Partial (hosting-deploy pinned)   | checkout @v4, setup-node @v4 | Medium |
| `auto-label-review-tier.yml`            | No                                | All @v4/@v7                  | Medium |
| `docs-lint.yml`                         | No                                | @v4, @v7, @v46               | High   |
| `review-check.yml`                      | No                                | @v4, @v7                     | Medium |

**Inconsistency:** The project correctly identified and pinned `tj-actions` due
to CVE-2025-30066, but did not apply the same treatment to `actions/checkout`,
`actions/setup-node`, or `actions/github-script` — actions maintained by GitHub
itself which are lower risk but still not immune.

---

## 5. Pre-commit Hook Analysis

### Hook Architecture

The pre-commit hook is well-engineered. Notable design decisions:

**Parallelism:**

```sh
# Wave 1: ESLint + Tests in parallel (~15s each → ~15s total)
(npm run lint > "$ESLINT_TMPFILE" 2>&1; echo $? > "${ESLINT_TMPFILE}.exit") &
PID_LINT=$!
# Tests: smart-skip for doc-only changes
(npm test > "$TEST_TMPFILE" 2>&1; echo $? > "${TEST_TMPFILE}.exit") &
PID_TEST=$!
```

**Positive features:**

- POSIX-compatible (runs under `sh`, not `bash`)
- EXIT trap chaining (no overwritten trap handlers)
- SKIP_CHECKS consolidation with backward-compat mapping
- SKIP_REASON validation: max 500 chars, min 10 chars, no CR/LF, no control
  chars
- Smart test skipping for doc-only changes
- Auto-formatting via lint-staged
- Override audit trail via `log-override.js`
- Log output shown to developer on failure

**Issues:**

- Log file unbounded growth (P-12)
- `require_skip_reason` duplicated in pre-push (P-13)
- 11 checks × typical durations: ESLint (~15s) + tests (~15s, parallel) +
  pattern check (~1s) + cross-doc check + type-check in pre-push = **~35-50s per
  commit** on code changes. This is noticeable but acceptable for the quality
  level maintained.

---

## 6. Test Strategy Analysis

### Test Distribution (21 test files)

| Category             | Count | Coverage Area                                                                                              |
| -------------------- | ----- | ---------------------------------------------------------------------------------------------------------- |
| Library/utils        | 8     | date-utils, logger, rate-limiter, firebase-types, constants, admin-error-utils                             |
| Firebase integration | 3     | firestore-service, callable-errors, secure-caller                                                          |
| Auth                 | 2     | auth-provider, time-rotation                                                                               |
| Security             | 1     | firestore-validation                                                                                       |
| Script tests         | 5     | validate-audit-s0s1, check-docs-light, phase-complete-check, surface-lessons-learned, update-readme-status |
| Pattern compliance   | 1     | pattern-compliance.test.js (vitest)                                                                        |
| Other                | 1     | use-daily-quote, collections, error-knowledge-base                                                         |

**Test runner:** Node built-in `--test` runner (requires compile step:
`tsc -p tsconfig.test.json`) **Coverage tool:** c8 (Istanbul-compatible)

**Gaps:**

- No component-level tests (React components)
- No Cloud Functions tests
- No e2e tests
- No coverage threshold enforcement
- TypeScript test compilation adds a build step (`npm run test:build`) before
  every run — slow on large test suites

---

## 7. npm Scripts Analysis

### Category Breakdown (96 total)

| Category | Count | Purpose                                                              |
| -------- | ----- | -------------------------------------------------------------------- |
| docs     | 10    | Documentation linting, indexing, sync, headers                       |
| audit    | 10    | Pre/post audit checks, thresholds, validation                        |
| patterns | 6     | Pattern compliance, FP reporting, sync                               |
| test     | 5     | test, test:build, test:coverage, test:coverage:report, test:patterns |
| session  | 5     | Session start, end, gaps, logging, summary                           |
| sprint   | 5     | Sprint intake, status, wave, complete, sync                          |
| learning | 5     | Learning effectiveness analysis                                      |
| Core dev | 4     | build, dev, start, lint                                              |

**Assessment:** Scripts are predominantly automation and governance tooling
rather than developer-facing commands. This is appropriate for an AI-assisted
development workflow, but creates discoverability friction for new developers.
The `scripts/README.md` file exists, which partially addresses this.

---

## 8. Deployment Analysis

### Firebase Deployment Pipeline

**Current state:**

- Production deploys triggered by push to `main`
- Deploys: Cloud Functions, Firestore rules, Next.js static hosting
- Uses service account authentication
- Cleans up credentials file on `always()` step
- Hardcoded function cleanup step (`functions:delete`) — could fail silently if
  function names change

**Staging:** None — preview channel is disabled (P-14)

**Environment variable handling:**

- CI secrets: `${{ secrets.NEXT_PUBLIC_FIREBASE_* }}` (production)
- PR preview: `${{ vars.NEXT_PUBLIC_FIREBASE_* }}` (vars, not secrets) — correct
  distinction

**Security posture:**

- Service account file created with `chmod 600`
- Cleaned up in `always()` step
- Credentials stored in GitHub secrets

**Weakness:** The deploy workflow does not have a `needs:` dependency on the CI
workflow. If CI and deploy both trigger on push to `main`, the deployment could
complete before CI passes, deploying broken code.

---

## 9. Build System Analysis

### Next.js Configuration

```js
const nextConfig = {
  output: "export", // Static export for Firebase Hosting
  images: { unoptimized: true },
};
```

**TypeScript:** Strict mode enabled, `noEmit: true` in main config. Tests use a
separate `tsconfig.test.json` that compiles to `dist-tests/`.

**Observations:**

- `incremental: true` in `tsconfig.json` enables TypeScript build caching (good
  for local dev)
- `moduleResolution: "bundler"` is Next.js 16 optimized
- Functions use `moduleResolution: "nodenext"` with CommonJS output —
  appropriate for Cloud Functions
- No `next.config.mjs` custom webpack config, no bundle analyzer configured

### Build Performance Concerns

The CI type-check (`npx tsc --noEmit`) runs independently from the test build
(`tsc -p tsconfig.test.json`). TypeScript is compiled twice on each CI run (once
for test:build, once for type-check). These could potentially be unified.

---

## 10. Recommendations (Prioritized)

### Immediate (S1, low effort)

1. **[P-02]** Add c8 coverage thresholds — 30 minutes of work, zero new code
2. **[P-05]** Pin `tj-actions/changed-files` in `docs-lint.yml` to existing SHA
   — 5 minutes

### Short-term (S2, E1-E2)

3. **[P-01]** Add `.github/dependabot.yml` with weekly npm updates, grouped by
   semver
4. **[P-04]** Pin all remaining GitHub Actions to SHA — use `pin-github-action`
   CLI to automate
5. **[P-06]** Move `firebase-tools` to `devDependencies`, remove global install
   step
6. **[P-14]** Either configure preview deploy variables or remove dead
   `preview-deploy` job

### Medium-term (S2-S3, E2-E3)

7. **[P-09]** Create minimal Playwright e2e smoke tests (login + entry creation)
8. **[P-03]** Add Cloud Functions unit tests using Mocha/Firebase emulator
9. **[P-08]** Add `release-please-action` for automated changelog and versioning

### Low priority (S3, cleanup)

10. **[P-12]** Add log rotation to pre-commit hook (5 lines of shell)
11. **[P-13]** Extract `require_skip_reason` to shared shell library
12. **[P-10]** Add "Common Scripts Quick Reference" to README or CLAUDE.md
13. **[P-15]** Document why `--no-verify` is acceptable in `sync-readme.yml` bot
    commits

---

## Appendix: Workflow Trigger Summary

| Workflow                   |   push:main   |  PR:main   | schedule | manual | on:merged |
| -------------------------- | :-----------: | :--------: | :------: | :----: | :-------: |
| ci.yml                     |      Yes      |    Yes     |    -     |   -    |     -     |
| deploy-firebase.yml        |      Yes      |     -      |    -     |  Yes   |     -     |
| sonarcloud.yml             |      Yes      |    Yes     |    -     |  Yes   |     -     |
| docs-lint.yml              |       -       |  Yes (md)  |    -     |   -    |     -     |
| backlog-enforcement.yml    |       -       |    Yes     | Mon 9am  |  Yes   |     -     |
| review-check.yml           |       -       |    Yes     |    -     |   -    |     -     |
| auto-label-review-tier.yml |       -       |    Yes     |    -     |   -    |     -     |
| resolve-debt.yml           |       -       |     -      |    -     |   -    |    Yes    |
| sync-readme.yml            | Yes (ROADMAP) |     -      |    -     |   -    |     -     |
| validate-plan.yml          |       -       | Yes (plan) |    -     |   -    |     -     |

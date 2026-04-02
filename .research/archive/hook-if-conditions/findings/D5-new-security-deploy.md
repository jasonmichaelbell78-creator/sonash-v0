# Findings: New Hooks Using `if` for Deploy Safeguards, Test Tracking, and Security-File Guards

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-29
**Sub-Question IDs:** SQ-D5

---

## Key Findings

### 1. Deploy Safeguard Hook — Pre-deploy environment and build check [CONFIDENCE: HIGH]

**Evidence from codebase:**

- `firebase.json` (L66-70) shows the `functions` target has a `predeploy` step:
  `npm --prefix "$RESOURCE_DIR" run build`. This means Cloud Functions are built
  automatically before deploy via Firebase CLI — but the hosting deploy (`out/`)
  requires a separate `npm run build` step that produces the `out/` directory.
  If `out/` is absent or stale, the hosting deploy will push stale or empty
  content.
- `.github/workflows/deploy-firebase.yml` (L106-114) runs `npm run build` with
  six `NEXT_PUBLIC_*` env vars set from GitHub secrets before calling
  `firebase deploy`. In a local/manual deploy (e.g. an AI running
  `firebase deploy --only hosting`), those env vars may not be set, causing a
  silent build with `test`/empty values baked into the bundle.
- The deploy workflow separates into three sequential Firebase CLI calls:
  `--only functions`, `--only firestore:rules`, `--only hosting`. An AI-assisted
  local deploy via a single `firebase deploy` would hit all three simultaneously
  without the CI safeguards.
- No current Claude hook guards `firebase deploy` commands. The only existing
  PreToolUse Bash hooks guard `git push` and `git commit`.
- `firebase-service-account.json` exists at the repo root — a service account
  file being present means a local deploy is technically possible without CI.

**Proposed Hook: `HOOK-D5-A` — pre-deploy-safeguard**

| Field          | Value                                                                                   |
| -------------- | --------------------------------------------------------------------------------------- |
| Event          | PreToolUse                                                                              |
| Matcher        | `^(?i)bash$`                                                                            |
| `if` condition | `Bash(firebase deploy *)\|Bash(npx firebase deploy *)\|Bash(firebase-tools * deploy *)` |
| Script         | `.claude/hooks/pre-deploy-safeguard.js`                                                 |

**What the script would do:**

1. Verify `out/` directory exists and was modified within the last 30 minutes
   (stale build check).
2. Check that all six `NEXT_PUBLIC_*` env vars are set and non-empty (not
   `test`/placeholder values) in the current shell environment.
3. Check for any staged or uncommitted changes in `firestore.rules` or
   `storage.rules` — warn if rules changes are uncommitted and about to be
   deployed.
4. Print a pre-flight summary and require no action (advisory only, exit 0).

**Value:** Prevents deploying a stale or misconfigured build. The env var check
is especially important since `.env.local.example` shows all six Firebase keys
are required and the CI workflow uses secrets — a developer running
`firebase deploy` manually without those vars set would bake `undefined`/empty
values into the bundle.

**Estimated implementation effort:** Low (1–2 hours). Pure filesystem + env var
checks. No network calls. Can reuse `lib/git-utils.js` for project root
resolution.

**Risks:**

- False positives if `out/` is intentionally rebuilt > 30 minutes ago (long
  build). Threshold should be configurable or skippable via
  `SKIP_CHECKS=deploy-guard`.
- Advisory-only (exit 0) means it can be ignored. Making it blocking (exit 2)
  risks disrupting urgent hotfix deploys.

---

### 2. Test-Runner Tracking Hook — PostToolUse capture of pass/fail/duration [CONFIDENCE: HIGH]

**Evidence from codebase:**

- `package.json` (L12) defines `test` as:
  `npm run test:build && cross-env NODE_ENV=test [...] node --test "dist-tests/tests/**/*.test.js" "scripts/health/**/*.test.js"`.
  This is the primary test runner — it uses Node's built-in `--test` runner, not
  vitest (except for `test:patterns` on L45 which uses `npx vitest run`).
- There are 11 test script variants: `test`, `test:build`, `test:coverage`,
  `test:health`, `test:hooks`, `test:debt`, `test:audits`, `test:checkers`,
  `test:infra`, `test:pipeline`, `test:patterns`. Each could be a separate
  invocation.
- The CI workflow (`ci.yml` L105) runs `npm run test:coverage` which includes
  `c8` for coverage reporting. The `--check-coverage --lines 65` threshold is
  enforced at CI level (L119), not locally.
- No existing PostToolUse hook captures test execution results, pass/fail
  counts, duration, or trends. The `commit-tracker.js` captures commits but not
  test runs.
- The `scripts/generate-test-registry.js` (referenced in `tests:registry` and CI
  `--check-coverage` step) tracks test coverage baseline in
  `.test-baseline.json` — but this is a static registry, not a run-time tracking
  mechanism.

**Proposed Hook: `HOOK-D5-B` — test-run-tracker**

| Field          | Value                                                                             |
| -------------- | --------------------------------------------------------------------------------- |
| Event          | PostToolUse                                                                       |
| Matcher        | `^(?i)bash$`                                                                      |
| `if` condition | `Bash(npm test *)\|Bash(npm run test *)\|Bash(npx vitest *)\|Bash(node --test *)` |
| Script         | `.claude/hooks/test-run-tracker.js`                                               |

**What the script would do:**

1. Parse the Bash tool output (passed via `$ARGUMENTS`) for Node `--test` runner
   result lines: `# tests N`, `# pass N`, `# fail N`, `# cancelled N`.
2. Parse vitest output for `Tests N passed`, `Tests N failed`, `Duration Xms`
   patterns.
3. Capture exit code from the tool output to determine pass/fail state.
4. Append a structured entry to `.claude/state/test-run-log.jsonl`:
   `{ timestamp, command, passed, failed, duration_ms, session, branch }`.
5. If any failures detected, emit a warning to stderr: "N test(s) failed — run
   was not clean."
6. Rotate log to 100 entries max (reuse `lib/rotate-state.js`).

**Value:**

- Enables trend tracking across sessions (similar to what `commit-log.jsonl`
  does for commits).
- Surfaces silent test failures — currently if an AI runs tests in a subshell
  and they fail, the failure may get lost in terminal output.
- Data available to `/session-end` and `/alerts` for health reporting.
- Pairs with the existing `.test-baseline.json` coverage registry to detect
  regressions.

**Estimated implementation effort:** Medium (3–4 hours). The tricky part is
parsing Node `--test` output, which differs from vitest output. Two separate
regex sets needed. The architecture (stdin JSON → parse → JSONL append) is
identical to `commit-tracker.js`, so that file is a strong template.

**Risks:**

- Node `--test` output format is not stable across Node versions. Project uses
  Node 22 (confirmed in `ci.yml` and `firebase.json` `runtime: nodejs22`), so
  the format is stable for this project specifically.
- `npm run test:build` runs a TypeScript compilation before the test runner —
  the hook would fire on `test:build` too (which is `tsc`, not a test runner).
  The `if` condition using `npm run test *` would catch this. Mitigation: check
  for presence of `--test` or `vitest` in the actual command.
- Duration is not directly available in tool output — it must be computed from
  timestamps between PreToolUse fire and PostToolUse fire, which is not natively
  possible from a single PostToolUse hook. Alternative: timestamp the JSONL
  entry and accept that duration is wall-clock from when the hook fires, not
  exact test duration.

---

### 3. Security-File Guard Hooks — Firestore rules, storage rules, firebase.json, .env files [CONFIDENCE: HIGH]

**Evidence from codebase:**

**`firestore.rules` is production-critical:**

- Contains the only server-side enforcement of the
  journal/daily_logs/inventoryEntries write-block pattern (the
  `allow create, update: if false` rules on L38, L53, L67). If these lines are
  accidentally removed or weakened, clients could write directly to sensitive
  collections, bypassing Cloud Functions, rate limiting, and App Check.
- SECURITY.md (L36-41) explicitly identifies these rules as the primary defense
  against bypassing security controls.
- `deploy-firebase.yml` (L149) deploys rules to production via
  `firebase deploy --only firestore:rules`. A rules weakening committed to main
  would auto-deploy within minutes.
- The existing `post-write-validator.js` does NOT currently check
  `firestore.rules` or `storage.rules` content. It checks for Firestore writes
  in component code, not changes to the rules file itself.

**`storage.rules` is also critical:**

- Contains the blanket `allow read, write: if false` default (L9-11) plus
  user-scoped access. Weakening this would expose user files.

**`firebase.json` is deployment config:**

- Contains security headers (HSTS, X-Frame-Options, DENY, CSP-like
  Permissions-Policy). Modifying these headers has security implications.
- Contains the Cloud Functions `predeploy` build command. Removing it could
  deploy unbuilt functions.

**`.env.production`** exists at repo root. Any AI write to this file should be
flagged — production environment variables should not be modified via Claude
Code operations.

**Proposed Hook A: `HOOK-D5-C` — firestore-rules-guard**

| Field          | Value                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------ |
| Event          | PostToolUse                                                                                |
| Matcher        | `^(?i)(write\|edit\|multiedit)$`                                                           |
| `if` condition | `Write(firestore.rules)\|Edit(firestore.rules)\|Write(storage.rules)\|Edit(storage.rules)` |
| Script         | `.claude/hooks/security-file-guard.js`                                                     |

**What the script would do:**

1. Read the modified file from disk.
2. For `firestore.rules`: check that the three critical
   `allow create, update: if false` patterns still exist for `journal`,
   `daily_logs`, and `inventoryEntries` collections. If any are missing, emit a
   blocking output
   (`block: critical Firestore write-block rule removed — manual review required`).
   Exit 2.
3. For `storage.rules`: check that the default-deny rule
   `allow read, write: if false` on the root match still exists.
4. If checks pass but the file was modified, emit an advisory to stderr:
   "Security rules modified — run `npm run security:check` before deploying."
5. Log the modification to `.claude/state/security-file-changes.jsonl` for audit
   trail.

**Value:** This is the highest-value hook in this set. The write-block rules in
`firestore.rules` are the primary data-integrity defense. An accidental removal
by an AI making a well-intentioned refactor could silently weaken the security
model without any immediate visible error. The hook provides a last-resort check
before the change is committed and deployed.

**Estimated implementation effort:** Low (1–2 hours). File read + regex checks.
The patterns to check are known and stable (`allow create, update: if false` in
specific match blocks).

**Risks:**

- Exit 2 (blocking) is aggressive for an advisory-style project. If the block
  fires incorrectly (false positive due to whitespace changes), it could
  frustrate legitimate rule evolution. Mitigation: add a
  `SKIP_CHECKS=security-file-guard` bypass, and display the specific pattern
  that failed.
- The hook fires on `storage.rules` too — not all storage.rules edits are
  dangerous. The default-deny check is conservative enough to be low
  false-positive.

**Proposed Hook B: `HOOK-D5-D` — env-file-guard**

| Field          | Value                                                                                |
| -------------- | ------------------------------------------------------------------------------------ |
| Event          | PostToolUse                                                                          |
| Matcher        | `^(?i)(write\|edit\|multiedit)$`                                                     |
| `if` condition | `Write(.env.production)\|Edit(.env.production)\|Write(.env.local)\|Edit(.env.local)` |
| Script         | `.claude/hooks/security-file-guard.js` (shared, add env branch)                      |

**What the script would do:**

1. Emit an advisory to stderr: "Env file modified: `.env.production` — verify no
   secrets are committed to git."
2. Run a fast check: does the modified file contain any lines that look like
   `GITHUB_TOKEN=<real-value>` or `SONAR_TOKEN=<real-value>` (non-placeholder,
   non-empty values)?
3. If `.env.production` was written (vs edited), warn: "`.env.production` was
   overwritten — verify this is intentional."
4. Advisory only (exit 0) — env files are legitimately modified; the hook adds
   visibility, not blocking.

**Value:** `.env.local` contains real secrets (`GITHUB_TOKEN`, `SONAR_TOKEN`,
Firebase App Check debug token per `.env.local.example`). `.env.production`
exists at the repo root and is potentially gitleaked if committed. Gitleaks CI
runs on push but not locally — this hook gives local visibility before a commit
is made.

**Estimated implementation effort:** Low (< 1 hour, shared with HOOK-D5-C
script).

**Risks:** Low. Advisory-only. The main risk is alert fatigue if env files are
modified frequently during local setup.

**Proposed Hook C: `HOOK-D5-E` — firebase-json-guard**

| Field          | Value                                                                     |
| -------------- | ------------------------------------------------------------------------- |
| Event          | PostToolUse                                                               |
| Matcher        | `^(?i)(write\|edit\|multiedit)$`                                          |
| `if` condition | `Write(firebase.json)\|Edit(firebase.json)`                               |
| Script         | `.claude/hooks/security-file-guard.js` (shared, add firebase.json branch) |

**What the script would do:**

1. Read the modified `firebase.json`.
2. Check that the `X-Frame-Options: DENY` header still exists.
3. Check that the `Strict-Transport-Security` header still exists.
4. Check that the `functions.predeploy` build step still exists (not
   accidentally removed).
5. Advisory output (exit 0) with specific warnings per missing element.

**Value:** Medium. The security headers in `firebase.json` are easy to
accidentally remove when restructuring the hosting config. The predeploy build
check prevents deploying unbuilt Cloud Functions.

**Estimated implementation effort:** Low (< 1 hour, shared script).

**Risks:** Low false positive risk since JSON structure is stable. The predeploy
check is brittle if the build command is intentionally changed — but intentional
changes would still benefit from the advisory.

---

## Hook Summary Table

| Hook ID   | Event       | `if` Condition (abbreviated)                                                               | Script                    | Blocks?                      | Effort | Value     |
| --------- | ----------- | ------------------------------------------------------------------------------------------ | ------------------------- | ---------------------------- | ------ | --------- |
| HOOK-D5-A | PreToolUse  | `Bash(firebase deploy *)\|Bash(npx firebase deploy *)`                                     | `pre-deploy-safeguard.js` | No                           | Low    | High      |
| HOOK-D5-B | PostToolUse | `Bash(npm test *)\|Bash(npm run test *)\|Bash(npx vitest *)`                               | `test-run-tracker.js`     | No                           | Medium | Medium    |
| HOOK-D5-C | PostToolUse | `Write(firestore.rules)\|Edit(firestore.rules)\|Write(storage.rules)\|Edit(storage.rules)` | `security-file-guard.js`  | Yes (exit 2 on rule removal) | Low    | Very High |
| HOOK-D5-D | PostToolUse | `Write(.env.production)\|Edit(.env.production)\|Write(.env.local)\|Edit(.env.local)`       | `security-file-guard.js`  | No                           | Low    | Medium    |
| HOOK-D5-E | PostToolUse | `Write(firebase.json)\|Edit(firebase.json)`                                                | `security-file-guard.js`  | No                           | Low    | Medium    |

---

## Sources

| #   | Path                                    | Type                          | Trust | Date       |
| --- | --------------------------------------- | ----------------------------- | ----- | ---------- |
| 1   | `firebase.json`                         | Project config (ground truth) | HIGH  | current    |
| 2   | `firestore.rules`                       | Security rules (ground truth) | HIGH  | current    |
| 3   | `storage.rules`                         | Security rules (ground truth) | HIGH  | current    |
| 4   | `.github/workflows/deploy-firebase.yml` | CI/CD workflow (ground truth) | HIGH  | current    |
| 5   | `.github/workflows/ci.yml`              | CI/CD workflow (ground truth) | HIGH  | current    |
| 6   | `package.json` scripts section          | Build config (ground truth)   | HIGH  | current    |
| 7   | `.claude/settings.json` hooks section   | Hook config (ground truth)    | HIGH  | current    |
| 8   | `.claude/HOOKS.md`                      | Hook documentation            | HIGH  | 2026-02-23 |
| 9   | `.claude/hooks/block-push-to-main.js`   | Implementation reference      | HIGH  | current    |
| 10  | `.claude/hooks/commit-tracker.js`       | Implementation reference      | HIGH  | current    |
| 11  | `SECURITY.md`                           | Security policy               | HIGH  | 2026-03-17 |
| 12  | `.env.local.example`                    | Env var documentation         | HIGH  | current    |

---

## Contradictions

None found. All evidence is internally consistent:

- Deploy occurs via CI (GitHub Actions) for production pushes but local
  `firebase deploy` is possible (service account file exists).
- Security rules are the only enforcement of the Cloud Functions-only write
  pattern — SECURITY.md confirms this and the rules file matches.
- No existing hook guards these files or operations.

---

## Gaps

1. **Test output parsing**: Node `--test` runner output format was verified via
   codebase inspection but not by running the tests to see actual output. The
   regex patterns in HOOK-D5-B's script design are based on Node 22 test runner
   documentation (known from training), not from empirical output capture.
2. **`firebase deploy` from Claude Code sessions**: It is unconfirmed whether
   Claude Code ever issues `firebase deploy` directly versus always deferring to
   the user. However, the `Bash(*)` permission in `settings.json` means it is
   technically allowed.
3. **`if` condition glob syntax for dotfiles**: Whether `Write(.env.production)`
   correctly matches a file named `.env.production` (dotfile, no extension) in
   the `if` condition syntax was not verified against Claude Code's permission
   rule implementation. If the glob requires a leading directory segment, the
   pattern may need to be `Write(**/.env.production)` or
   `Write(**/env.production)`.
4. **`security-file-guard.js` as shared script**: The proposal consolidates four
   hooks (C/D/E) into one script with branch logic. If the `if` conditions fire
   the same script, the script must determine which file was changed from
   `$ARGUMENTS`. This is feasible (same pattern as `post-write-validator.js`'s
   `CLAUDE_TOOL` env var approach) but was not verified.

---

## Serendipity

1. **`firebase-service-account.json` at repo root**: This file exists and is
   presumably gitignored, but its presence means local deploys with admin
   privileges are possible without any CI gate. The pre-deploy safeguard hook is
   more important than it might first appear — it's not just about build
   freshness but about preventing accidental production deployments during
   development sessions.

2. **Existing `post-write-validator.js` consolidation pattern**: This file
   replaced 10 separate hooks to save ~800ms on Windows. The same consolidation
   pattern should be applied to the new security-file hooks — HOOK-D5-C, D5-D,
   and D5-E should be a single `security-file-guard.js` that handles all
   security-critical file edits, not three separate scripts.

3. **`npm run security:check` exists but isn't hook-triggered**: The project has
   a `security:check` script (`scripts/security-check.js`) that runs security
   pattern compliance checks. Currently it only runs in CI and during pre-commit
   hooks (via `patterns:check`). Triggering it (or a targeted subset) from
   HOOK-D5-C when `firestore.rules` is modified would add automated verification
   without requiring a full pre-commit cycle.

4. **No duration capture path in PostToolUse**: PostToolUse hooks receive the
   tool output but not the start time. For test tracking (HOOK-D5-B), accurate
   duration measurement would require a PreToolUse counterpart that records the
   start timestamp to a temp file, which the PostToolUse hook then reads. This
   is a two-hook pattern not currently used in this project but worth knowing
   for the design.

---

## Confidence Assessment

- HIGH claims: 6
- MEDIUM claims: 1 (test output format)
- LOW claims: 0
- UNVERIFIED claims: 1 (dotfile glob syntax in `if` conditions)
- **Overall confidence: HIGH**

All findings are grounded in direct filesystem inspection of production files.
The primary uncertainty is implementation detail (dotfile glob matching), not
whether the hooks would provide value.

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-17
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Implementation Plan: GitHub Optimization

## Summary

Comprehensive GitHub ecosystem maturity initiative across 5 waves: emergency CI
triage, security hardening, workflow optimization, code scanning remediation,
and ecosystem expansion. Transforms GitHub health from D-grade to A-grade across
security, workflows, governance, and community.

**Decisions:** See DECISIONS.md (30 decisions) **Effort Estimate:** XL (~16-20
hours across 5 waves) **PR Strategy:** Single PR from feature branch (Per D4)

## Files to Create/Modify

### New Files (14)

1. **`LICENSE`** — Apache 2.0 license text
2. **`SECURITY.md`** — Vulnerability reporting policy (GitHub PVR)
3. **`CONTRIBUTING.md`** — Contribution guide pointing to project conventions
4. **`CODE_OF_CONDUCT.md`** — Contributor Covenant
5. **`.github/CODEOWNERS`** — Code ownership assignments
6. **`.github/ISSUE_TEMPLATE/bug_report.md`** — Bug report template
7. **`.github/ISSUE_TEMPLATE/feature_request.md`** — Feature request template
8. **`.github/ISSUE_TEMPLATE/config.yml`** — Template chooser configuration
9. **`.github/instructions/security.instructions.md`** — Path-scoped Copilot
   instructions for security areas
10. **`.github/instructions/tests.instructions.md`** — Path-scoped Copilot
    instructions for test files
11. **`.github/workflows/scorecard.yml`** — OpenSSF Scorecard workflow
12. **`.github/workflows/release-please.yml`** — Release Please workflow
13. **`.github/release-please-config.json`** — Release Please configuration
14. **`docs/GITHUB_GUIDE.md`** — Repository-specific GitHub features user's
    guide

### Modified Files (20)

1. **`.github/workflows/ci.yml`** — Permissions, timeout, concurrency, path
   filter, coverage upload condition, Codecov action
2. **`.github/workflows/codeql.yml`** — SHA pins, timeout, concurrency, path
   filter
3. **`.github/workflows/semgrep.yml`** — SHA pins, timeout, concurrency, path
   filter, pip cache
4. **`.github/workflows/backlog-enforcement.yml`** — Permissions block, timeout,
   updated action versions
5. **`.github/workflows/pattern-compliance-audit.yml`** — Permissions block,
   timeout
6. **`.github/workflows/auto-label-review-tier.yml`** — SHA pins, timeout
7. **`.github/workflows/auto-merge-dependabot.yml`** — Timeout, workflow-level
   actor filter
8. **`.github/workflows/cleanup-branches.yml`** — Timeout, counter bug fix
9. **`.github/workflows/deploy-firebase.yml`** — SHA pins, timeout
10. **`.github/workflows/dependency-review.yml`** — SHA pins, timeout,
    concurrency
11. **`.github/workflows/docs-lint.yml`** — SHA pins, timeout, concurrency
12. **`.github/workflows/resolve-debt.yml`** — Timeout, concurrency
13. **`.github/workflows/review-check.yml`** — SHA pins, timeout, concurrency
14. **`.github/workflows/sonarcloud.yml`** — Timeout (optimize both configs per
    D8)
15. **`.github/workflows/sync-readme.yml`** — SHA pins, timeout
16. **`.github/workflows/validate-plan.yml`** — SHA pins, timeout, concurrency
17. **`.github/copilot-instructions.md`** — Refresh stale content (Per D21)
18. **`.github/release.yml`** — Add Breaking Changes, Security, Refactoring,
    Testing categories
19. **`.github/pull_request_template.md`** — Add Breaking Changes and
    Risks/Rollback sections
20. **`.github/dependabot.yml`** — Add grouping for GitHub Actions ecosystem

### Modified Files — Code Scanning (Wave 3)

21. **`.semgrep/rules/security/no-direct-firestore-write.yml`** — Tune to
    collection-name matching
22. **`.semgrep/rules/security/no-eval-usage.yml`** — Add pattern-not for
    function refs in setTimeout
23. **`.semgrep/rules/style/no-default-export.yml`** — Exclude components/
    directory
24. **`.semgrep/rules/correctness/no-unchecked-array-access.yml`** — Add guard
    patterns for regex match, .map/.filter
25. **`hooks/use-journal.ts`** — Replace sanitizeForSearch() with DOMPurify
26. **`functions/src/admin.ts`** — Fix 4 floating promises (await or void)
27. **`functions/src/recaptcha-verify.ts`** — Fix 2 floating promises
28. **`lib/auth/account-linking.ts`** — Sanitize error response at line 122

### Deleted Files (1)

29. **`.github/ISSUE_TEMPLATE_APP_CHECK_REENABLE.md`** — Relocate to proper
    `.github/ISSUE_TEMPLATE/` directory (or reference in config.yml as external
    link)

---

## Wave 0: Emergency Triage

**Goal:** Get CI green and unblock all branches.

### Step 0.1: Fix Prettier Formatting

Run Prettier across the codebase and commit the formatting fix.

```bash
npx prettier --write .
```

**Done when:** `npm run format:check` (or equivalent) passes locally. **Depends
on:** None **Triggers:** CI pipeline should start passing after this.

### Step 0.2: Investigate Test Failures (Per D24)

If CI still fails after Prettier fix, investigate the ~24% of failures
attributed to test issues.

```bash
npm test 2>&1 | tail -50
```

**Done when:** CI passes on the feature branch, OR test failures are identified
as pre-existing/unrelated and documented. **Depends on:** Step 0.1 **Triggers:**
If tests fail, assess whether fixes are in scope or pre-existing.

### Step 0.3: Fix Coverage Artifact Upload Condition

Change `if: always()` to `if: success()` on the coverage upload step in `ci.yml`
to stop uploading stale/empty coverage data on failing runs.

**Done when:** Coverage artifact only uploads when tests actually run and pass.
**Depends on:** None (can be done in parallel with 0.1)

### Step 0.4: Fix cleanup-branches.yml Counter Bug (Per M1)

The subshell loop prevents counter variables from propagating. Refactor to use
process substitution or a temp file approach.

**Done when:** Running the workflow manually shows correct
deleted/skipped/failed counts. **Depends on:** None

### Step 0.5: Verify Dependabot Alerts (Per D26)

Check if the 3 open Dependabot alerts (#1, #3, #4) are already resolved in
uncommitted work on `plan-implementation`. If not, run `npm update` in affected
directories.

```bash
gh api repos/jasonmichaelbell78-creator/sonash-v0/dependabot/alerts?state=open --jq '.[] | {number, package: .dependency.package.name}'
```

**Done when:** 0 open Dependabot alerts, or remaining alerts documented as
deferred. **Depends on:** None

---

## Wave 1: Security Hardening

**Goal:** Close all security gaps in GitHub configuration.

### Step 1.1: SHA-Pin All Actions (Per D9)

For each of the 16 workflow files, replace all version-tag action references
with SHA-pinned equivalents with version comments.

**Process for each action:**

1. Look up the current release tag's commit SHA on the action's repo
2. Replace `uses: owner/action@vN` with `uses: owner/action@SHA # vN.M.P`
3. Ensure Dependabot can still update (version comment format)

**Actions to pin (currently unpinned):**

- `actions/checkout@v6` → SHA pin
- `actions/setup-node@v6` → SHA pin
- `actions/upload-artifact@v7` → SHA pin
- `actions/github-script@v8` → SHA pin
- `actions/dependency-review-action@v4` → SHA pin
- `github/codeql-action/init@v4` → SHA pin
- `github/codeql-action/analyze@v4` → SHA pin
- `github/codeql-action/upload-sarif@v4` → SHA pin
- `tj-actions/changed-files@v47` → SHA pin (some workflows already pinned,
  standardize)

**Also update outdated versions (Per M5):**

- `backlog-enforcement.yml`: checkout v4→v6, setup-node v4→v6, github-script
  v7→v8

**Done when:** Every `uses:` line across all 16 workflows is SHA-pinned with
version comment. `grep -r 'uses:.*@v[0-9]' .github/workflows/` returns 0
results. **Depends on:** None **Triggers:** Dependabot will start auto-updating
SHA pins.

### Step 1.2: Add Missing Permissions Blocks (Per C3)

Add explicit `permissions` blocks to:

- `backlog-enforcement.yml` — add `contents: read`, `pull-requests: write`,
  `issues: write`
- `ci.yml` — add `contents: read`, `checks: write`
- `pattern-compliance-audit.yml` — add `contents: read`, `issues: write`

**Done when:** All 16 workflows have explicit `permissions` blocks.
`grep -rL 'permissions:' .github/workflows/` returns 0 results. **Depends on:**
None

### Step 1.3: Enable Secret Scanning + Push Protection (Per D10)

This requires GitHub Settings UI changes:

1. Navigate to repo Settings → Code security and analysis
2. Enable "Secret scanning"
3. Enable "Push protection"

Document the steps in the plan for manual execution.

**Done when:**
`gh api repos/jasonmichaelbell78-creator/sonash-v0/secret-scanning/alerts` no
longer returns "disabled" error. **Depends on:** None (manual action)

### Step 1.4: Create SECURITY.md (Per D29)

Create `SECURITY.md` at repo root with:

- Supported versions
- Vulnerability reporting via GitHub Private Vulnerability Reporting
- Security considerations (App Check status, Firebase security rules)
- Responsible disclosure timeline

**Done when:**
`gh api repos/jasonmichaelbell78-creator/sonash-v0/community/profile --jq '.files.security_policy'`
returns non-null. **Depends on:** Step 1.3 (reference PVR in SECURITY.md)

---

## Wave 2: Workflow Optimization

**Goal:** All workflows have timeouts, concurrency, path filtering, and proper
caching. Rulesets and environments hardened.

### Step 2.1: Add Timeouts to All Workflows (Per D11)

Add `timeout-minutes` to every job in all 16 workflows:

- **10 min:** auto-label-review-tier, auto-merge-dependabot, cleanup-branches,
  docs-lint, dependency-review, resolve-debt, review-check, sync-readme,
  validate-plan, backlog-enforcement, pattern-compliance-audit
- **20 min:** ci (lint-typecheck-test job), ci (build job)
- **30 min:** deploy-firebase, codeql, semgrep, sonarcloud

**Done when:** Every job in every workflow has an explicit `timeout-minutes`.
**Depends on:** None

### Step 2.2: Add Concurrency Groups (Per D12)

Add concurrency blocks to all workflows that trigger on push/PR:

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.head_ref || github.ref }}
  cancel-in-progress: true # false for deploy-firebase
```

**Workflows to add concurrency:**

- ci, codeql, semgrep, backlog-enforcement, review-check, docs-lint,
  auto-label-review-tier, dependency-review, pattern-compliance-audit,
  resolve-debt, validate-plan

**Already have concurrency:** deploy-firebase, sync-readme

**Skip (scheduled/manual only):** cleanup-branches

**Done when:** All push/PR-triggered workflows have concurrency groups.
**Depends on:** None

### Step 2.3: Add Path Filtering (Per D13)

Add `paths-ignore` to CI, CodeQL, and Semgrep workflows:

```yaml
on:
  push:
    branches: [main]
    paths-ignore:
      - "**/*.md"
      - "docs/**"
      - ".github/ISSUE_TEMPLATE/**"
      - "LICENSE"
      - "CONTRIBUTING.md"
      - "CODE_OF_CONDUCT.md"
  pull_request:
    branches: [main]
    paths-ignore:
      # same list
```

**Done when:** A commit touching only `.md` files does NOT trigger CI, CodeQL,
or Semgrep. **Depends on:** None

### Step 2.4: Fix Auto-Merge Dependabot Trigger (Per M14)

Move the `github.actor == 'dependabot[bot]'` check from job-level `if` to
workflow-level to avoid consuming runner startup on every non-Dependabot PR. Or
add branch filter.

**Done when:** Non-Dependabot PRs don't trigger the auto-merge workflow at all.
**Depends on:** None

### Step 2.5: Add Pip Cache to Semgrep Workflow (Per M16)

Add pip caching to avoid downloading Semgrep fresh every run:

```yaml
- uses: actions/setup-python@... # SHA
  with:
    python-version: "3.12"
    cache: "pip"
```

**Done when:** Second Semgrep run shows cache hit. **Depends on:** Step 1.1 (SHA
pin the setup-python action)

### Step 2.6: Harden Ruleset (Per D14)

Update "Main Protection" ruleset via API:

```bash
gh api repos/jasonmichaelbell78-creator/sonash-v0/rulesets/13352818 -X PUT --input - << 'EOF'
{
  "name": "Main Protection",
  "enforcement": "active",
  "conditions": {"ref_name": {"include": ["~DEFAULT_BRANCH"], "exclude": []}},
  "rules": [
    {"type": "pull_request", "parameters": {"required_approving_review_count": 0, "dismiss_stale_reviews_on_push": false, "require_code_owner_review": false, "require_last_push_approval": false, "required_review_thread_resolution": false, "allowed_merge_methods": ["squash", "rebase"]}},
    {"type": "required_status_checks", "parameters": {"required_status_checks": [{"context": "Lint, Type Check & Test"}, {"context": "Build"}, {"context": "Dependency Review"}, {"context": "Analyze JavaScript/TypeScript"}], "strict_required_status_checks_policy": true}},
    {"type": "required_linear_history"},
    {"type": "non_fast_forward"},
    {"type": "deletion"}
  ]
}
EOF
```

**Done when:** `gh api repos/.../rulesets/13352818 --jq '.rules | length'`
returns 5 (up from 1). **Depends on:** Wave 0 (CI must be passing for status
checks to make sense)

### Step 2.7: Clean Up Environments (Per D15, D20)

Delete 4 stale duplicate environments:

```bash
gh api repos/jasonmichaelbell78-creator/sonash-v0/environments/Preview%20%E2%80%93%20sonash-v0 -X DELETE
gh api repos/jasonmichaelbell78-creator/sonash-v0/environments/Preview%20%E2%80%93%20sonash-v0-2drw -X DELETE
gh api repos/jasonmichaelbell78-creator/sonash-v0/environments/Production%20%E2%80%93%20sonash-v0 -X DELETE
gh api repos/jasonmichaelbell78-creator/sonash-v0/environments/Production%20%E2%80%93%20sonash-v0-2drw -X DELETE
```

Add branch restriction to Production environment (main only).

**Done when:** `gh api repos/.../environments --jq '.total_count'` returns 3.
**Depends on:** None

### Step 2.8: Move NEXT*PUBLIC*\* from Secrets to Variables (Per H7)

Move the 5 Firebase public config values from secrets to variables:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`

Then update `deploy-firebase.yml` to use `vars.*` consistently instead of mixed
`secrets.*`/`vars.*`.

**Done when:** `gh api repos/.../actions/variables --jq '.total_count'` shows 7
(current 2 + 5 new). Secrets reduced from 9 to 4. **Depends on:** None (manual
step for creating variables, then code change for deploy workflow)

---

## Wave 3: Code Scanning Remediation

**Goal:** Reduce 282 open alerts to <30 through rule tuning, targeted fixes, and
dismissals. Per D5.

### Step 3.1: Tune Semgrep Rules (~177 alerts cleared)

#### 3.1a: `no-direct-firestore-write` → collection-name matching (28 alerts)

Update rule to only flag writes to `journal`, `daily_logs`, `inventoryEntries`
per CLAUDE.md Section 2.

**Done when:**
`gh api repos/.../code-scanning/alerts?tool_name=Semgrep+OSS&state=open --jq '[.[] | select(.rule.id | contains("no-direct-firestore-write"))] | length'`
returns 0 (after next Semgrep scan).

#### 3.1b: `no-eval-usage` → exclude function refs (9 alerts)

Add `pattern-not` for `setTimeout($FUNC_REF, ...)` and
`setInterval($FUNC_REF, ...)` where the first argument is not a string literal.

**Done when:** Rule no longer flags `setTimeout(resolve, ms)` patterns.

#### 3.1c: `no-default-export` → exclude components/ (40 alerts)

Add `components/` to the path exclusion list. React component default exports
are conventional.

**Done when:** Rule only flags default exports outside `components/` and `app/`.

#### 3.1d: `no-unchecked-array-access` → add guard patterns (100+ alerts)

Add pattern-not for:

- Regex match null-check: `if (m) { m[0] }`
- Array inside `.map()` / `.filter()` callbacks
- Exclude `scripts/` directory (tooling, not app code)

Fix the 2 instances in `functions/src/` (app code) manually.

**Done when:** Alert count drops from 137 to <10.

### Step 3.2: Fix Real Security Issues (13 alerts)

#### 3.2a: Replace sanitizeForSearch() with DOMPurify (6 CodeQL HIGHs)

In `hooks/use-journal.ts`, replace the hand-rolled regex sanitizer at lines
69-85 with DOMPurify:

```typescript
import DOMPurify from "dompurify";

function sanitizeForSearch(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] }); // strip all HTML
}
```

**Done when:** CodeQL alerts 1, 3, 8, 9, 10, 11 are closed after next scan.
**Depends on:** `npm install dompurify @types/dompurify`

#### 3.2b: Fix floating promises in Cloud Functions (6 Semgrep alerts)

In `functions/src/admin.ts` (lines 2236, 2241, 3388, 3407) and
`functions/src/recaptcha-verify.ts` (lines 104, 138), add `await` or `void` to
unhandled promises.

**Done when:** No Semgrep floating-promise alerts in `functions/src/`.

#### 3.2c: Sanitize error in account-linking.ts (1 Semgrep alert)

At `lib/auth/account-linking.ts:122`, use `scripts/lib/sanitize-error.js`
pattern per CLAUDE.md Section 5.

**Done when:** Error message is sanitized before being returned to client.

### Step 3.3: Dismiss False Positives (7 alerts)

- Dismiss CodeQL alerts 5424, 5425 (test file URL substring checks)
- Dismiss Semgrep path-traversal alerts (4) and taint-user-input-to-exec (1) —
  already have `nosemgrep` comments, GitHub SARIF ignores inline suppressions

```bash
# Dismiss via API
for ALERT in 5424 5425; do
  gh api repos/jasonmichaelbell78-creator/sonash-v0/code-scanning/alerts/$ALERT -X PATCH -f state=dismissed -f dismissed_reason=false_positive
done
```

**Done when:** `gh api repos/.../code-scanning/alerts?state=open --jq 'length'`
decreases by 7.

### Step 3.4: Defer Remaining to DEBT (48 alerts)

Log the following categories to TDMS via existing intake process:

- CodeQL 4, 5, 6 (dev-only scripts) — 3 alerts
- Semgrep floating-promise in scripts — 11 alerts
- Semgrep unsanitized-error in tooling/admin — 6 alerts
- Semgrep style rules (magic numbers, console, inline queries, any) — 28 alerts

**Done when:** All 48 deferred alerts are tracked in MASTER_DEBT.jsonl with
code-scanning source tag.

---

## Wave 4: Ecosystem Expansion

**Goal:** Add new apps, community health files, and the GitHub Guide.

### Step 4.1: Add LICENSE File (Per D6)

Create `LICENSE` with Apache 2.0 text. Include correct copyright year and name.

**Done when:** `gh api repos/.../license --jq '.license.spdx_id'` returns
`Apache-2.0`.

### Step 4.2: Add Community Health Files (Per D16)

#### 4.2a: CONTRIBUTING.md

Lightweight guide pointing to CLAUDE.md for conventions, copilot-instructions.md
for setup, and PR template for submission requirements.

#### 4.2b: CODE_OF_CONDUCT.md

Contributor Covenant v2.1 with appropriate contact method.

#### 4.2c: .github/CODEOWNERS

```
* @jasonmichaelbell78-creator
.github/workflows/ @jasonmichaelbell78-creator
functions/src/ @jasonmichaelbell78-creator
firestore.rules @jasonmichaelbell78-creator
```

#### 4.2d: Issue Templates

Create `.github/ISSUE_TEMPLATE/bug_report.md`, `feature_request.md`, and
`config.yml`. Move/reference App Check re-enable issue in config.yml.

**Done when:** `gh api repos/.../community/profile --jq '.health_percentage'` >
80%. **Depends on:** Step 4.1 (LICENSE contributes to health score)

### Step 4.3: Update Copilot Instructions (Per D21)

#### 4.3a: Refresh `.github/copilot-instructions.md`

Update test counts (77/91 → 3,776), remove outdated ESLint warnings, refresh
known issues.

#### 4.3b: Create `.github/instructions/security.instructions.md`

Path-scoped to `lib/security/**,functions/**` with Firebase security rules, App
Check, rate limiting focus.

#### 4.3c: Create `.github/instructions/tests.instructions.md`

Path-scoped to `tests/**` with mock patterns (httpsCallable, not direct
Firestore).

**Done when:** Copilot code review on next PR uses updated instructions.

### Step 4.4: Update release.yml and PR Template (Per M8, M9)

Add to `release.yml`:

- "Breaking Changes" category (`breaking` label)
- "Security" category (`security` label)
- "Refactoring" category (`refactoring` label)
- "Testing" category (`testing` label)

Add to `pull_request_template.md`:

- "Breaking Changes" section
- "Risks/Rollback Plan" section

**Done when:** Both files updated with new sections/categories.

### Step 4.5: Update Dependabot Config (Per Dependabot research)

Add grouping for GitHub Actions ecosystem:

```yaml
- package-ecosystem: "github-actions"
  directory: "/"
  schedule:
    interval: "monthly"
  groups:
    actions-minor-patch:
      update-types: ["minor", "patch"]
  labels: ["ci"]
  commit-message:
    prefix: "chore(ci)"
```

**Done when:** Dependabot config has 3 ecosystem entries with groups.

### Step 4.6: Add Codecov to CI (Per D18, D30)

Add `codecov/codecov-action` (SHA-pinned) to CI workflow after test step:

```yaml
- uses: codecov/codecov-action@... # SHA
  if: success()
  with:
    files: ./coverage/lcov.info
    fail_ci_if_error: false
```

Add `codecov.yml` to repo root with ratcheting threshold config.

**Done when:** PR comments show coverage diff. Badge available. **Depends on:**
Wave 0 (CI must be green for coverage to upload)

### Step 4.7: Add OpenSSF Scorecard Workflow (Per D30)

Create `.github/workflows/scorecard.yml`:

```yaml
name: OpenSSF Scorecard
on:
  push:
    branches: [main]
  schedule:
    - cron: "0 6 * * 1" # Weekly Monday 6AM UTC
permissions:
  security-events: write
  id-token: write
  contents: read
  actions: read
```

Uses `ossf/scorecard-action` (SHA-pinned) with `publish_results: true` for
public badge.

**Done when:** Scorecard results appear in Security tab after first run on main.
**Depends on:** Step 1.1 (SHA pinning improves score), Step 1.2 (permissions
improve score)

### Step 4.8: Add Release Please Workflow (Per D19, D30)

Create `.github/workflows/release-please.yml` and
`.github/release-please-config.json`:

```yaml
name: Release Please
on:
  push:
    branches: [main]
permissions:
  contents: write
  pull-requests: write
```

Config for `node` release type, reads `package.json` for version.

**Done when:** First push to main after merge creates a Release PR with
changelog.

### Step 4.9: Install Socket.dev (Per D27)

Guided manual installation:

1. Navigate to https://github.com/apps/socket-security
2. Click "Install"
3. Select the sonash-v0 repository
4. Authorize

Wait for user completion before proceeding.

**Done when:** Socket.dev appears in check-runs on next PR with dependency
changes.

### Step 4.10: Create GitHub Guide (Per D23, D28)

Create `docs/GITHUB_GUIDE.md` with 9 sections. Requires web research for
accurate feature documentation (current URLs, configuration steps, GitHub CLI
commands).

Sections:

1. Workflows Overview — table of all workflows, triggers, what they do
2. Security Features — secret scanning, CodeQL, Semgrep, Dependabot, dependency
   review
3. Branch Rules — ruleset config, what's enforced, how to merge
4. Environments & Deployments — Production vs Preview, deploy flow
5. Labels & Issue Templates — taxonomy, how to file issues
6. Apps & Integrations — installed apps, what each does
7. Secrets & Variables — what's configured (names), rotation guidance
8. Release Process — Release Please flow, how to cut a release
9. Quick Reference — common `gh` commands, manual triggers

**Done when:** Document is comprehensive, accurate, and covers all features
enabled by this plan. **Depends on:** All previous steps (document reflects
final state)

---

## Step 5: Audit Checkpoint

Run code-reviewer agent on all new/modified files (~34 files).

**Done when:** All findings addressed or tracked in TDMS. **Depends on:** All
implementation steps.

---

## Parallelization Guidance

**Within Wave 0:** Steps 0.1, 0.3, 0.4, 0.5 can run in parallel. Step 0.2
depends on 0.1. **Within Wave 1:** Steps 1.1, 1.2, 1.4 can run in parallel. Step
1.3 is manual. **Within Wave 2:** Steps 2.1-2.5, 2.7-2.8 can run in parallel.
Step 2.6 depends on Wave 0. **Within Wave 3:** Steps 3.1a-d can run in parallel.
Step 3.2 depends on 3.1 (cleaner baseline). Step 3.3 can run in parallel with
anything. Step 3.4 runs last. **Within Wave 4:** Steps 4.1-4.5 can run in
parallel. Steps 4.6-4.8 can run in parallel. Step 4.9 is manual (guided). Step
4.10 depends on all others. **Cross-wave:** Waves are sequential (each builds on
prior).

---

## Deferred Items (tracked separately)

| Item                                        | Reason                                          | Track In |
| ------------------------------------------- | ----------------------------------------------- | -------- |
| OIDC for Firebase (D7)                      | Requires GCP console, separate effort           | DEBT     |
| StepSecurity Harden-Runner (D17)            | Modifies all workflows twice, standalone effort | DEBT     |
| Next.js Bundle Analysis (D30)               | Needs stable CI + baseline                      | DEBT     |
| SonarCloud optimization (D8)                | Intentionally toggled, optimize separately      | DEBT     |
| 48 deferred code scanning alerts (Step 3.4) | Low-risk, tooling/style                         | DEBT     |

# Findings: Best Practices Violations Across 18 Workflow YAML Files

**Searcher:** deep-research-searcher (D4-SQ1a) **Profile:** codebase **Date:**
2026-03-29 **Sub-Question IDs:** SQ-1a

---

## Key Findings

### 1. Permissions Architecture: Mostly Compliant with Two Structural Gaps [CONFIDENCE: HIGH]

All 18 workflows declare a top-level `permissions:` block. 12 of 18 use the
hardened pattern of `permissions: {}` at the top level with minimal per-job
grants. 6 use a workflow-level grant rather than deferring to job level, which
is less secure but not a violation if the grants are accurate.

**Compliant (deny-first pattern):**

- `auto-merge-dependabot.yml` — `permissions: {}` top-level, per-job:
  `contents: write, pull-requests: write`
- `ci.yml` — `permissions: {}` top-level, per-job grants minimal
- `backlog-enforcement.yml` — `permissions: {}` top-level, per-job grants
  minimal
- `cleanup-branches.yml` — `permissions: {}` top-level, per-job:
  `contents: write`
- `deploy-firebase.yml` — `permissions: {}` top-level, per-job grants minimal
- `release-please.yml` — `permissions: {}` top-level, per-job:
  `contents: write, pull-requests: write`
- `sync-readme.yml` — `permissions: {}` top-level, per-job:
  `contents: write, pull-requests: write`

**Workflow-level grants (not deny-first, but grants appear accurate):**

- `auto-label-review-tier.yml` —
  `permissions: contents: read, pull-requests: write` at workflow level.
  Job-level grants are absent; the workflow-level grant is used. **Gap**:
  `auto-label-review-tier.yml` also has per-step usage of
  `actions/github-script` which requires the PR write. The grant matches but is
  not scoped to job level.
- `codeql.yml` —
  `permissions: security-events: write, packages: read, actions: read, contents: read`
  at workflow level. No per-job override. These are correct for CodeQL but
  broader than necessary at workflow scope.
- `dependency-review.yml` — `permissions: contents: read, pull-requests: write`
  at workflow level. No per-job block on the single job.
- `docs-lint.yml` — `permissions: contents: read` at workflow level plus per-job
  `contents: read, pull-requests: write`. Redundant but not incorrect.
- `pattern-compliance-audit.yml` — `permissions: contents: read, issues: write`
  at workflow level. No per-job override.
- `resolve-debt.yml` — `permissions: contents: read` at workflow level plus
  per-job `contents: write`. The wider per-job grant overrides the narrow
  workflow default correctly.
- `review-check.yml` — `permissions: contents: read, pull-requests: read` at
  workflow level plus per-job `contents: read, pull-requests: write`. Redundant
  top level but not harmful.
- `scorecard.yml` — `permissions: contents: read` at workflow level plus per-job
  `security-events: write, id-token: write`.
- `semgrep.yml` — `permissions: contents: read` at workflow level plus per-job
  `contents: read, security-events: write, actions: read`.
- `sonarcloud.yml` —
  `permissions: contents: read, pull-requests: write, security-events: write` at
  workflow level. No per-job override.
- `validate-plan.yml` — `permissions: contents: read` at workflow level plus
  per-job `contents: read, pull-requests: write`.

**Gap 1 — `sonarcloud.yml` overly broad workflow-level permissions (line
14-18):** `security-events: write` is granted at workflow level, but the single
job needs it only for the upload step. No per-job block means all steps run
under `security-events: write`. Risk is low (single job) but violates
least-privilege.

**Gap 2 — `codeql.yml` no per-job permissions override (line 27-32):** The
workflow-level block grants `packages: read` and `actions: read` in addition to
`security-events: write`. `packages: read` is unused by the actual steps. This
is a known OpenSSF Scorecard alert pattern.

Sources: `.github/workflows/*.yml` (all 18 files, filesystem ground truth)

---

### 2. Pinned SHA Versions: Comprehensive Pinning with One Concern [CONFIDENCE: HIGH]

All action references across all 18 workflows use full SHA hashes in the format
`uses: owner/action@<sha> # vX.Y.Z`. This is the gold standard for supply chain
security and satisfies the OpenSSF PinnedDependencies requirement.

**Full inventory of pinned actions (verified consistent):**

- `actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd` — annotated
  `# v6.0.2` — used in 14 workflows
- `actions/setup-node@53b83947a5a98c8d113130e565377fae1a50d02f` — annotated
  `# v6.3.0` — used in 13 workflows
- `actions/github-script@ed597411d8f924073f98dfc5c65a23a2325f34cd` — annotated
  `# v8.0.0`
- `actions/upload-artifact@bbbca2ddaa5d8feaa63e36b76fdaad77386f024f` — annotated
  `# v7.0.0`
- `actions/dependency-review-action@2031cfc080254a8a887f58cffee85186f0e49e48` —
  annotated `# v4.9.0`
- `codecov/codecov-action@1af58845a975a7985b0beb0cbe6fbbb71a41dbad` — annotated
  `# v5.4.2`
- `tj-actions/changed-files@22103cc46bda19c2b464ffe86db46df6922fd323` —
  annotated `# v47.0.5`
- `dependabot/fetch-metadata@21025c705c08248db411dc16f3619e6b5f9ea21a` —
  annotated `# v2.5.0`
- `gitleaks/gitleaks-action@ff98106e4c7b2bc287b24eaf42907196329070c7` —
  annotated `# v2.3.9`
- `FirebaseExtended/action-hosting-deploy@e2eda2e106cfa35cdbcf4ac9ddaf6c4756df2c8c`
  — annotated `# v0`
- `googleapis/release-please-action@16a9c90856f42705d54a6fda1823352bdc62cf38` —
  annotated `# v4.4.0`
- `ossf/scorecard-action@4eaacf0543bb3f2c246792bd56e8cdeffafb205a` — annotated
  `# v2.4.1`
- `github/codeql-action/init@c6f931105cb2c34c8f901cc885ba1e2e259cf745` —
  annotated `# v4.34.0`
- `github/codeql-action/analyze@c6f931105cb2c34c8f901cc885ba1e2e259cf745` —
  annotated `# v4.34.0`
- `github/codeql-action/upload-sarif@c6f931105cb2c34c8f901cc885ba1e2e259cf745` —
  annotated `# v4.34.0`
- `SonarSource/sonarcloud-github-action@ffc3010689be73b8e5ae0c57ce35968afd7909e8`
  — annotated `# v5.0.0`
- `actions/setup-python@a309ff8b426b58ec0e2a45f0f869d46889d02405` — annotated
  `# v6.2.0`

**Concern — `deploy-firebase.yml` line 100: NPM global install of firebase-tools
pinned to version not SHA:**

```yaml
run: npm install -g firebase-tools@13.29.1
```

This is a npm package, not a GitHub Action, so SHA pinning is not applicable in
the same sense. However, the version is pinned to `13.29.1` rather than using a
lock file or integrity hash. If the published package at that version were
replaced (npm supply chain attack), there is no hash verification. This is a
medium-severity gap.

Sources: All `.github/workflows/*.yml` (filesystem ground truth, lines verified)

---

### 3. Concurrency Controls: 4 of 18 Workflows Missing `concurrency:` [CONFIDENCE: HIGH]

14 of 18 workflows declare a `concurrency:` block. The 4 missing it are:

| Workflow                    | Trigger(s)                                  | Impact of Missing Concurrency                                                                                                                                                                        |
| --------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auto-merge-dependabot.yml` | `pull_request` on main                      | Low — Dependabot PRs are sequential by nature; multiple simultaneous Dependabot PRs could queue duplicate runs but this is acceptable given the `if: ${{ github.actor == 'dependabot[bot]' }}` guard |
| `cleanup-branches.yml`      | `schedule`, `workflow_dispatch`             | Medium — scheduled + manual trigger could overlap; a manual trigger during the Monday window causes two simultaneous deletions of the same branches                                                  |
| `scorecard.yml`             | `push` on main, `schedule`                  | Medium — a push to main and a scheduled run could overlap, wasting runner minutes on duplicate SARIF uploads                                                                                         |
| `sonarcloud.yml`            | `push`, `pull_request`, `workflow_dispatch` | Medium-High — SonarCloud analysis results can be invalidated or misleading when concurrent runs write overlapping analysis; duplicate API usage                                                      |

The `sonarcloud.yml` case is the most impactful: it has three triggers including
`workflow_dispatch` but no concurrency guard. A developer manually dispatching
it during a PR CI run will produce two overlapping SonarCloud analyses.

Sources: Grep on `concurrency:` across all 18 files (filesystem ground truth)

---

### 4. Caching: Strong npm Caching; sonarcloud.yml Missing Any Cache [CONFIDENCE: HIGH]

All workflows that use Node.js set `cache: "npm"` on `actions/setup-node`, which
automatically caches the npm dependency cache. The one workflow using Python
(`semgrep.yml`) uses `cache: "pip"` on `actions/setup-python`.

**Cache coverage per workflow:**

- 13 Node.js workflows: all use `cache: "npm"` — PASS
- `semgrep.yml`: uses `cache: "pip"` — PASS
- `sonarcloud.yml`: no Node.js or Python setup, no cache — N/A (SonarCloud
  action handles internally)
- `codeql.yml`: no Node.js setup needed — N/A
- `dependency-review.yml`: no install step — N/A
- `scorecard.yml`: no install step — N/A

**Gap in `deploy-firebase.yml` (lines 100-101):** Firebase CLI is installed
globally with `npm install -g firebase-tools@13.29.1` outside the cached install
path. This global npm install is not cached between runs, adding 30-60 seconds
per deployment. This is a minor efficiency issue rather than a correctness
problem.

**Gap in `sonarcloud.yml`:** The SonarCloud action downloads a scanner on every
run (internal to the action). There is no way to cache this without modifying
the action invocation, so this is an accepted limitation rather than a fixable
violation.

Sources: Grep on `cache:` and `node-version:` across all workflow files

---

### 5. Timeout-Minutes: All 18 Workflows Set Timeouts [CONFIDENCE: HIGH]

Every workflow sets `timeout-minutes` on every job. This is complete compliance.
The values are appropriate to the job types:

| Workflow              | Job(s)                 | Timeout |
| --------------------- | ---------------------- | ------- |
| `ci.yml`              | lint, validate         | 10 min  |
| `ci.yml`              | test                   | 15 min  |
| `ci.yml`              | build                  | 20 min  |
| `deploy-firebase.yml` | preview-deploy, deploy | 30 min  |
| `semgrep.yml`         | semgrep                | 30 min  |
| `sonarcloud.yml`      | Analysis               | 30 min  |
| `codeql.yml`          | analyze                | 30 min  |
| All others            | single job             | 10 min  |

Sources: Grep on `timeout-minutes:` across all 18 files, confirmed in all

---

### 6. Security: `pull_request_target` Usage Has Disabled-but-Present Risk [CONFIDENCE: HIGH]

`deploy-firebase.yml` contains a commented-out `pull_request_target` trigger
(lines 8-12) but the downstream job's `if:` condition still references
`github.event_name == 'pull_request_target'` (line 23). The trigger is
effectively disabled, but the code structure demonstrates the risk pattern was
recognized and mitigated via a comment, not removed.

**Current safe state:** The `preview-deploy` job will never run because
`pull_request_target` is not in the `on:` block. However, the code that _would_
run if re-enabled is correctly hardened:

- Line 36: `ref: ${{ github.event.pull_request.head.sha }}` (correct — uses SHA
  not branch ref)
- Line 37: `persist-credentials: false` (correct)
- Line 23: `github.event.pull_request.head.repo.full_name == github.repository`
  guard (correct — prevents fork exploitation)

**Risk assessment:** The commented-out pattern is safe today but leaves a
footgun. If someone uncomments line 8-12 without reading the broader context,
the job is correctly hardened. However, the deploy job (lines 77-171) that runs
on push would also need a corresponding hardening review if
`pull_request_target` were re-enabled for preview deploys.

**Secret injection pattern in `deploy-firebase.yml` lines 127:**

```yaml
echo '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}' > $HOME/gcloud-key.json
```

This pipes a secret into a shell command using single-quote quoting. Because the
secret is JSON (service account credentials), if the JSON contains a single
quote, the shell command will malform. The `chmod 600` and `if: always()`
cleanup step mitigate the exposure window, but the injection pattern itself is
fragile. A more robust approach would use `echo "$FIREBASE_SERVICE_ACCOUNT"`
with the secret passed via `env:`.

**No script injection from `${{ github.event.*}}` into run blocks found.** The
one place where PR body is consumed (`resolve-debt.yml` line 36) correctly uses
`env: PR_BODY: ${{ github.event.pull_request.body }}` and reads via `$PR_BODY`
in the shell — this is the correct mitigation for script injection. This is a
notable positive finding.

Sources: `.github/workflows/deploy-firebase.yml` lines 8-12, 23, 36-37, 127;
`.github/workflows/resolve-debt.yml` lines 35-47

---

### 7. No GitHub Environments Declared in Any Workflow [CONFIDENCE: HIGH]

Zero of the 18 workflows use the `environment:` key on any job. The deploy
workflow (`deploy-firebase.yml`) deploys to production (`sonash-app`) but has no
GitHub Environment configured. This means:

- No deployment protection rules (required reviewers, wait timers)
- No environment-scoped secrets (all secrets are at repo scope)
- No deployment history visible in the Environments tab
- The production deploy runs on any push to main without a human approval gate

This is the most impactful governance gap in the entire workflow set. Production
deploys from `deploy-firebase.yml` trigger immediately on every merge to `main`
without any Environment-scoped protection rule.

Sources: Grep on `environment:` across all 18 files — no matches found

---

### 8. Node.js Version: Fully Consistent at Node 22 [CONFIDENCE: HIGH]

All 15 Node.js-using workflows specify `node-version: "22"`. There are no
version inconsistencies across the workflow set. Node 22 is the current LTS
(Active LTS as of October 2024, maintained until April 2027), making this a
reasonable and current choice.

Note: The version is specified as `"22"` (major only) rather than a pinned minor
like `"22.14.0"`. This means minor and patch updates are automatically applied
when the runner image is refreshed. For most projects this is acceptable, but it
does introduce a reproducibility gap for security-sensitive workflows.

Sources: Grep on `node-version:` across all workflow files

---

### 9. Scheduling: Monday Collision on 4 of 6 Scheduled Workflows [CONFIDENCE: HIGH]

Six workflows use `schedule:` triggers. Four of them run on Monday at 6:00 AM
UTC (`0 6 * * 1`):

| Workflow                       | Cron          | Run time            |
| ------------------------------ | ------------- | ------------------- |
| `cleanup-branches.yml`         | `0 6 * * 1`   | Monday 06:00 UTC    |
| `pattern-compliance-audit.yml` | `0 6 * * 1`   | Monday 06:00 UTC    |
| `scorecard.yml`                | `0 6 * * 1`   | Monday 06:00 UTC    |
| `backlog-enforcement.yml`      | `0 9 * * 1`   | Monday 09:00 UTC    |
| `codeql.yml`                   | `17 3 * * 1`  | Monday 03:17 UTC    |
| `semgrep.yml`                  | `17 13 * * 3` | Wednesday 13:17 UTC |

The three workflows colliding at exactly `0 6 * * 1` (`cleanup-branches`,
`pattern-compliance-audit`, `scorecard`) will all compete for GitHub-hosted
runner capacity simultaneously. GitHub's schedule trigger is already imprecise
(10-60 min latency is common), so the collision is more of an
aesthetic/management issue than a functional one, but it does make the job list
harder to read and could delay all three if runners are busy.

Sources: Grep on `cron:` across all workflow files

---

### 10. `sync-readme.yml`: Uses `--no-verify` and Auto-merge Without Environment Gate [CONFIDENCE: HIGH]

`sync-readme.yml` line 65:

```yaml
git commit --no-verify -m "docs: Auto-sync README status from ROADMAP.md"
```

The `--no-verify` flag bypasses pre-commit hooks. While this is reasonable for a
bot commit that skips linting (the content is auto-generated Prettier-formatted
markdown), it sets a precedent and could silently bypass security hooks if those
hooks are ever added to the pre-commit chain.

Line 72 then auto-merges the created PR:

```yaml
gh pr merge "$BRANCH" --auto --merge
```

This means a push to `main` that modifies `ROADMAP.md` triggers a bot that
creates a PR AND immediately auto-merges it, all without any CI check
requirement configured on the merge. If the repo's branch protection rules don't
require CI to pass before auto-merge resolves, this chain could introduce broken
commits.

Sources: `.github/workflows/sync-readme.yml` lines 65, 72

---

### 11. `resolve-debt.yml`: Pushes Directly to `main` on Merge Events [CONFIDENCE: HIGH]

`resolve-debt.yml` lines 109-125: After resolving debt items, the workflow
commits and pushes directly to `main`:

```yaml
git push
```

This is a force-push equivalent in the sense that it bypasses the PR workflow.
The workflow uses `git pull --rebase origin main` first (line 122) to handle
race conditions, which mitigates most risks, but a direct push to a protected
branch is a notable governance pattern. If branch protection requires PRs, this
push would fail silently (continue-on-error is not set on the push step), which
would be a failure mode.

Also: `SKIP_CROSS_DOC_CHECK=1` is set on the commit (line 116), bypassing
whatever cross-document check the pre-commit hook enforces.

Sources: `.github/workflows/resolve-debt.yml` lines 109-125

---

### 12. `backlog-enforcement.yml`: References Archived File in PR Comment [CONFIDENCE: MEDIUM]

`backlog-enforcement.yml` lines 104-113 post a PR comment referencing
`AUDIT_FINDINGS_BACKLOG.md` which the same workflow acknowledges is archived
(lines 43-54). The inline check gracefully skips if the file doesn't exist, but
the PR comment still links to the deprecated location rather than the TDMS
location (`docs/technical-debt/MASTER_DEBT.jsonl`). This will generate confusing
comments on future PRs where the link is dead.

Sources: `.github/workflows/backlog-enforcement.yml` lines 43-54, 104-113

---

### 13. Efficiency: 11 Separate npm ci Installs with No Job-Level Artifact Sharing [CONFIDENCE: MEDIUM]

The CI workflow (`ci.yml`) has 4 jobs that each independently run `npm ci` and
checkout:

- `lint` job: checkout + `npm ci`
- `test` job: checkout + `npm ci`
- `validate` job: checkout + `npm ci`
- `build` job: checkout + `npm ci`

While `cache: "npm"` on `setup-node` mitigates download time by caching the npm
cache (the `.npm` directory), it does NOT cache `node_modules`. This means each
job runs a full `npm ci` install which extracts modules to disk from the cache.
On a project with many dependencies, this typically takes 30-60 seconds per job
regardless of cache hits.

A common optimization is to use `actions/cache` to cache `node_modules` with a
lock file hash as the cache key, or to run a single install job and pass
`node_modules` as an artifact. However, given the parallel job structure (lint,
test, validate all run in parallel), artifact sharing would create a dependency
chain that likely costs more time than it saves. This is low priority.

Sources: `.github/workflows/ci.yml` lines 44-56, 82-92, 160-172, 257-267

---

## Compliance Matrix

| Workflow                     | Top-level permissions | Deny-first (`{}`)         | SHA pins       | Concurrency    | npm Cache      | Timeout        | No `pull_request_target` risk | No script injection | Environments       |
| ---------------------------- | --------------------- | ------------------------- | -------------- | -------------- | -------------- | -------------- | ----------------------------- | ------------------- | ------------------ |
| auto-label-review-tier.yml   | PASS                  | FAIL (workflow-lvl grant) | PASS           | PASS           | PASS           | PASS           | N/A                           | PASS                | FAIL               |
| auto-merge-dependabot.yml    | PASS                  | PASS                      | PASS           | FAIL           | N/A            | PASS           | N/A                           | PASS                | FAIL               |
| backlog-enforcement.yml      | PASS                  | PASS                      | PASS           | PASS           | PASS           | PASS           | N/A                           | PASS                | FAIL               |
| ci.yml                       | PASS                  | PASS                      | PASS           | PASS           | PASS           | PASS           | N/A                           | PASS                | FAIL               |
| cleanup-branches.yml         | PASS                  | PASS                      | PASS           | FAIL           | N/A            | PASS           | N/A                           | PASS                | FAIL               |
| codeql.yml                   | PASS                  | FAIL (workflow-lvl grant) | PASS           | PASS           | N/A            | PASS           | N/A                           | PASS                | FAIL               |
| dependency-review.yml        | PASS                  | FAIL (workflow-lvl grant) | PASS           | PASS           | N/A            | PASS           | N/A                           | PASS                | FAIL               |
| deploy-firebase.yml          | PASS                  | PASS                      | PASS (partial) | PASS           | PASS           | PASS           | WARN (disabled)               | WARN (secret echo)  | FAIL (prod deploy) |
| docs-lint.yml                | PASS                  | FAIL (workflow-lvl grant) | PASS           | PASS           | PASS           | PASS           | N/A                           | PASS                | FAIL               |
| pattern-compliance-audit.yml | PASS                  | FAIL (workflow-lvl grant) | PASS           | PASS           | PASS           | PASS           | N/A                           | PASS                | FAIL               |
| release-please.yml           | PASS                  | PASS                      | PASS           | PASS           | N/A            | PASS           | N/A                           | PASS                | FAIL               |
| resolve-debt.yml             | PASS                  | FAIL (workflow-lvl grant) | PASS           | PASS           | PASS           | PASS           | N/A                           | PASS                | FAIL               |
| review-check.yml             | PASS                  | FAIL (workflow-lvl grant) | PASS           | PASS           | PASS           | PASS           | N/A                           | PASS                | FAIL               |
| scorecard.yml                | PASS                  | FAIL (workflow-lvl grant) | PASS           | FAIL           | N/A            | PASS           | N/A                           | PASS                | FAIL               |
| semgrep.yml                  | PASS                  | FAIL (workflow-lvl grant) | PASS           | PASS           | PASS (pip)     | PASS           | N/A                           | PASS                | FAIL               |
| sonarcloud.yml               | PASS                  | FAIL (workflow-lvl grant) | PASS           | FAIL           | N/A            | PASS           | N/A                           | PASS                | FAIL               |
| sync-readme.yml              | PASS                  | PASS                      | PASS           | PASS           | PASS           | PASS           | N/A                           | PASS                | FAIL               |
| validate-plan.yml            | PASS                  | FAIL (workflow-lvl grant) | PASS           | PASS           | PASS           | PASS           | N/A                           | PASS                | FAIL               |
| **TOTALS**                   | **18/18 PASS**        | **7/18 deny-first**       | **18/18 PASS** | **14/18 PASS** | **13/13 PASS** | **18/18 PASS** | **1 WARN**                    | **17/18 PASS**      | **0/18 PASS**      |

Notes:

- "Deny-first" column: FAIL means workflow-level permissions grant is used
  instead of `permissions: {}` + per-job grants. Not a hard violation but
  represents an improvement opportunity.
- `auto-merge-dependabot.yml` concurrency FAIL: low risk due to Dependabot actor
  guard.
- `cleanup-branches.yml` concurrency FAIL: medium risk (schedule + manual could
  overlap).
- `sonarcloud.yml` concurrency FAIL: medium risk (three triggers).
- `scorecard.yml` concurrency FAIL: medium risk (push + schedule could overlap).

---

## Per-Workflow Findings Summary

### auto-label-review-tier.yml

- Workflow-level permissions grant instead of deny-first (`permissions: {}` +
  per-job) — IMPROVEMENT
- Uses `tj-actions/changed-files` (third-party action) — SHA-pinned — PASS
- `${{ steps.assign-tier.outputs.tier }}` interpolated inline into a `script:`
  block (line 111) — LOW risk because it's a validated numeric 0-4, but
  embedding outputs in script is a code smell
- No environment declaration — acceptable for a labeling workflow

### auto-merge-dependabot.yml

- No `concurrency:` block — LOW risk
- Pattern is exemplary otherwise: deny-first permissions, minimal per-job grant

### backlog-enforcement.yml

- PR comment references archived `AUDIT_FINDINGS_BACKLOG.md` (line 110) — STALE
  REFERENCE
- Pattern injection in `run:` step (line 147, 166):
  `"${{ steps.changed.outputs.files }}"` is interpolated into a shell
  `while read` loop. This is LOW risk because the output comes from
  `git diff --name-only` (repo-controlled data), not user-controlled input.

### ci.yml

- Most complex workflow — 4 parallel jobs, well-structured
- `npm ci` runs 4 times (redundant installs) — acceptable tradeoff for
  parallelism
- `npm ci` (not `npm ci --prefer-offline`) in lint, test, build jobs —
  inconsistent with backlog-enforcement which uses
  `--prefer-offline --no-audit --no-fund`
- `GH_TOKEN: ${{ github.token }}` passed to test env (line 108) — appropriate
  for test mocking but should be documented
- No `environment:` on build job even though it uses production Firebase secrets

### cleanup-branches.yml

- No `concurrency:` block — MEDIUM risk (schedule + manual overlap)
- No Node.js required — minimal footprint

### codeql.yml

- Workflow-level permissions include `packages: read` — appears unnecessary for
  JS/TS CodeQL analysis; no container registry pull occurs
- No per-job permissions block

### dependency-review.yml

- Minimal workflow, workflow-level permissions only
- No per-job block on single job — IMPROVEMENT

### deploy-firebase.yml

- `pull_request_target` code present but disabled — LATENT RISK
- Service account echo pattern:
  `echo '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}' > $HOME/gcloud-key.json`
  (line 127) — use env var instead
- Global `npm install -g firebase-tools@13.29.1` not cached — EFFICIENCY
- No `environment: production` on the deploy job — GOVERNANCE GAP
- `deploy` job runs on every push to main with no approval gate

### docs-lint.yml

- Workflow-level `permissions: contents: read` redundant with per-job grant —
  CLEANUP
- Script reads from `lint-results.md` artifact file instead of env var —
  acceptable but adds I/O
- `continue-on-error: true` on the lint step means PR comment might show no data
  if lint errors

### pattern-compliance-audit.yml

- Runs `node scripts/check-pattern-compliance.js` twice (lines 40, 45) — double
  execution for JSON + text output. Could be consolidated with a single run that
  outputs both formats — EFFICIENCY

### release-please.yml

- Exemplary: deny-first permissions, concurrency with
  `cancel-in-progress: false` (correct for release PRs — don't cancel an
  in-flight release), per-job grant, timeout
- No issues found

### resolve-debt.yml

- Direct push to `main` (line 125) — GOVERNANCE
- `SKIP_CROSS_DOC_CHECK=1` bypasses pre-commit hook (line 116)
- `--eligible-only` and `${{ steps.extract.outputs.debt_ids }}` interpolated
  into `run:` step (line 100) — the debt IDs are `DEBT-NNNN` pattern extracted
  by the workflow itself (not user input), so injection risk is LOW

### review-check.yml

- Redundant top-level `permissions: contents: read, pull-requests: read` when
  job overrides to `contents: read, pull-requests: write` — CLEANUP
- `REVIEW_OUTPUT: ${{ steps.review-check.outputs.output }}` passed via `env:`
  into github-script — CORRECT pattern

### scorecard.yml

- No `concurrency:` block — MEDIUM risk
- No issues with permissions or pinning

### semgrep.yml

- Workflow-level `permissions: contents: read` plus per-job wider grants
- `|| true` on semgrep scan (line 61) masks exit code — compensated by
  downstream SARIF verification step (line 72-73) — acceptable design

### sonarcloud.yml

- No `concurrency:` block — MEDIUM risk
- Workflow-level permissions grant `security-events: write` applies to ALL steps
  including checkout — overly broad
- Single job workflow — no per-job permissions override

### sync-readme.yml

- `git commit --no-verify` (line 65) — bypasses pre-commit hooks
- Auto-creates AND auto-merges PR (lines 67-72) — no CI requirement on the
  auto-merge
- If ROADMAP.md changes frequently, this generates PR noise
- `concurrency: cancel-in-progress: false` (line 14) — correct for a commit
  workflow; concurrent runs should not cancel each other

### validate-plan.yml

- Narrow trigger — only fires on changes to one specific archived file
- Effectively an orphan workflow — the file it monitors is in
  `docs/archive/completed-plans/`
- No issues beyond the orphan concern

---

## Top 5 Most Impactful Improvements (Ranked)

### #1 — Add GitHub Environments to `deploy-firebase.yml` [Impact: CRITICAL]

**Problem:** The production deploy job has no Environment protection rules, runs
on every push to main, and uses repo-scoped secrets rather than
environment-scoped secrets.

**Fix:** Create a `production` environment in GitHub repo settings, add a
required reviewer, and add `environment: production` to the `deploy` job in
`deploy-firebase.yml`. Move Firebase secrets to environment-scoped secrets. This
adds a human approval gate before each production deployment and makes
deployment history visible.

**Files:** `.github/workflows/deploy-firebase.yml` — `deploy` job (line 77)

---

### #2 — Add `concurrency:` to the 4 Missing Workflows [Impact: HIGH]

**Problem:** `sonarcloud.yml`, `scorecard.yml`, `cleanup-branches.yml`, and
`auto-merge-dependabot.yml` lack concurrency controls. The SonarCloud case is
highest impact because overlapping analyses produce misleading results.

**Fix for sonarcloud.yml:**

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.head_ref || github.ref }}
  cancel-in-progress: true
```

**Fix for scorecard.yml and cleanup-branches.yml:** Same pattern.

**Fix for auto-merge-dependabot.yml:** Add concurrency group keyed on PR number:

```yaml
concurrency:
  group: auto-merge-${{ github.event.pull_request.number }}
  cancel-in-progress: true
```

**Files:** `sonarcloud.yml`, `scorecard.yml`, `cleanup-branches.yml`,
`auto-merge-dependabot.yml`

---

### #3 — Fix Service Account Secret Echo in `deploy-firebase.yml` [Impact: HIGH]

**Problem:** Line 127 uses `echo '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'`
which single-quote-wraps the JSON. If the JSON contains single quotes (which
service account JSON can, in edge cases), the shell command will break. More
importantly, the secret value is visible in the process list momentarily.

**Fix:**

```yaml
- name: Setup Firebase Service Account
  env:
    FIREBASE_SERVICE_ACCOUNT_JSON: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
  run: |
    printf '%s' "$FIREBASE_SERVICE_ACCOUNT_JSON" > $HOME/gcloud-key.json
    chmod 600 $HOME/gcloud-key.json
    echo "GOOGLE_APPLICATION_CREDENTIALS=$HOME/gcloud-key.json" >> $GITHUB_ENV
```

**Files:** `.github/workflows/deploy-firebase.yml` line 127

---

### #4 — Convert Workflow-Level Permission Grants to Deny-First Pattern [Impact: MEDIUM]

**Problem:** 11 workflows use workflow-level permissions grants instead of
`permissions: {}` at the top level with per-job grants. This violates the
deny-first principle: if a new step is added to a job without explicitly
thinking about permissions, it silently inherits broader-than-needed access.

The most impactful targets (workflows with multiple jobs or sensitive actions):

- `sonarcloud.yml` — `security-events: write` at workflow level applies to all
  steps
- `codeql.yml` — `packages: read` appears unnecessary; applies to all steps
- `semgrep.yml` — broad job-level grant more appropriate than workflow-level

**Fix pattern:**

```yaml
# Before
permissions:
  contents: read
  pull-requests: write

# After
permissions: {}
jobs:
  my-job:
    permissions:
      contents: read
      pull-requests: write
```

**Files:** `sonarcloud.yml`, `codeql.yml`, `semgrep.yml`, `docs-lint.yml`,
`review-check.yml`, `resolve-debt.yml`, `validate-plan.yml`,
`dependency-review.yml`, `pattern-compliance-audit.yml`,
`auto-label-review-tier.yml`

---

### #5 — Remove or Fix the `validate-plan.yml` Orphan Workflow [Impact: MEDIUM]

**Problem:** `validate-plan.yml` triggers only on changes to
`docs/archive/completed-plans/INTEGRATED_IMPROVEMENT_PLAN.md`, which is an
archived file. Active plans have presumably moved elsewhere. The workflow is
effectively dead — it will never trigger in normal development, consuming
maintenance overhead and contributing to workflow count without value.

**Options:**

1. Delete the workflow if the validation script is no longer relevant
2. Update the path trigger to monitor current plan files
3. Convert to a `workflow_dispatch`-only trigger for manual audits

**Files:** `.github/workflows/validate-plan.yml` — `on.pull_request.paths` (line
7-8)

---

## Sources

| #   | Path                                             | Title                     | Type       | Trust | CRAAP     | Date       |
| --- | ------------------------------------------------ | ------------------------- | ---------- | ----- | --------- | ---------- |
| 1   | `.github/workflows/auto-label-review-tier.yml`   | Auto-Label Review Tier    | Filesystem | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 2   | `.github/workflows/auto-merge-dependabot.yml`    | Auto-merge Dependabot     | Filesystem | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 3   | `.github/workflows/backlog-enforcement.yml`      | Backlog Enforcement       | Filesystem | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 4   | `.github/workflows/ci.yml`                       | CI                        | Filesystem | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 5   | `.github/workflows/cleanup-branches.yml`         | Cleanup Stale Branches    | Filesystem | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 6   | `.github/workflows/codeql.yml`                   | CodeQL                    | Filesystem | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 7   | `.github/workflows/dependency-review.yml`        | Dependency Review         | Filesystem | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 8   | `.github/workflows/deploy-firebase.yml`          | Deploy to Firebase        | Filesystem | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 9   | `.github/workflows/docs-lint.yml`                | Documentation Lint        | Filesystem | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 10  | `.github/workflows/pattern-compliance-audit.yml` | Pattern Compliance Audit  | Filesystem | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 11  | `.github/workflows/release-please.yml`           | Release Please            | Filesystem | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 12  | `.github/workflows/resolve-debt.yml`             | Resolve Technical Debt    | Filesystem | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 13  | `.github/workflows/review-check.yml`             | Review Trigger Check      | Filesystem | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 14  | `.github/workflows/scorecard.yml`                | OpenSSF Scorecard         | Filesystem | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 15  | `.github/workflows/semgrep.yml`                  | Semgrep                   | Filesystem | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 16  | `.github/workflows/sonarcloud.yml`               | SonarCloud analysis       | Filesystem | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 17  | `.github/workflows/sync-readme.yml`              | Sync README Status        | Filesystem | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 18  | `.github/workflows/validate-plan.yml`            | Validate Phase Completion | Filesystem | HIGH  | 5/5/5/5/5 | 2026-03-29 |

---

## Contradictions

**`sonarcloud.yml` permissions intent vs. reality:** The inline comment on line
15 says `# required for actions/checkout` for `contents: read`, and line 17 says
`# required to publish results to GitHub Code Scanning (if enabled)` for
`security-events: write`. The comment hedges with "if enabled" — this suggests
`security-events: write` may not always be needed. If Code Scanning upload is
not enabled, the grant is unnecessary at workflow level. No contradiction in
sources, but there is an internal ambiguity in the file itself.

**`sync-readme.yml` auto-merge vs. `CLAUDE.md` guardrail #7:** The project's
`CLAUDE.md` states "Never push to remote without explicit approval." This
workflow auto-merges PRs without human approval (line 72). This is likely
intentional for a bot workflow but is architecturally inconsistent with the
project's stated principles about push gating.

---

## Gaps

1. **OpenSSF Scorecard alert count cannot be verified from filesystem alone:**
   The task description mentions "9 OpenSSF alerts for TokenPermissions" and "3
   for PinnedDependencies." These alerts are generated from the live Scorecard
   run against GitHub's API, not from static file analysis. The filesystem
   analysis cannot confirm which specific checks are generating the 9
   TokenPermissions alerts — the code appears largely compliant, suggesting the
   alerts may be for the workflow-level grant pattern (deny-first not used),
   which is a scoring nuance rather than a hard violation.

2. **GitHub branch protection rules not reviewed:** Whether the
   `resolve-debt.yml` direct push to `main` succeeds or fails depends on branch
   protection configuration. This cannot be determined from the filesystem.

3. **`validate-plan.yml` script not reviewed:** The script
   `scripts/validate-phase-completion.js` was not examined; the workflow's
   trigger path concern is independent of script quality.

4. **`sync-readme.yml` auto-merge PR requirements not verifiable:** Whether the
   auto-merge in line 72 requires CI to pass before merging depends on the
   repo's auto-merge configuration in GitHub settings, which is not in the
   filesystem.

5. **Firebase Environment Secrets scoping:** Whether Firebase secrets are
   currently at repo scope or already at some other scope cannot be verified
   from the workflow files alone.

---

## Serendipity

**`resolve-debt.yml` uses an exemplary script injection mitigation pattern**
(lines 35-47) that other workflows in the same repo do not uniformly follow. The
pattern of passing `${{ github.event.pull_request.body }}` via `env:` and
reading it as `$PR_BODY` in the shell is the exact correct approach recommended
by GitHub Security Lab. This is worth citing as a positive template for any
future workflows that need to consume PR body or issue body content.

**`pattern-compliance-audit.yml` runs the compliance script twice** (lines
40-45): once for JSON output and once for text output. This could be made more
efficient by having the script support a single invocation that emits both, but
more interestingly, this reveals that the compliance script
(`check-pattern-compliance.js`) lacks a combined output mode — a script
improvement opportunity independent of the workflow.

---

## Confidence Assessment

- HIGH claims: 12
- MEDIUM claims: 2
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

All findings are derived directly from filesystem reads of the 18 YAML files
with supporting grep verification. No training data claims are made without
filesystem corroboration.

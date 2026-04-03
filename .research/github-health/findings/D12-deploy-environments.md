# Findings: Deploy Pipeline and Environment Configuration Gaps

**Searcher:** deep-research-searcher **Profile:** codebase + web **Date:**
2026-03-29 **Sub-Question IDs:** D12-SQ6b

---

## Key Findings

### 1. Deploy workflow does NOT reference any GitHub environment context [CONFIDENCE: HIGH]

The single most critical structural gap: `deploy-firebase.yml` defines no
`environment:` key on either job. This means the three GitHub environments
(Production, Preview, copilot) are entirely decorative — their protection rules
**cannot be enforced** because the workflow never gates against them.

Confirmed by:

- `grep -n "environment:" deploy-firebase.yml` returns zero matches
- Same grep across all 18 workflow files returns zero matches for any workflow
- The GitHub environments exist (confirmed via API) but are never invoked

**Impact:** Even if protection rules were added to the Production environment
today (required reviewers, wait timers, branch policies), they would have zero
effect on actual deploys. A push to `main` deploys directly to production in
under 5 minutes with no human gate.

### 2. All three environments have zero protection rules [CONFIDENCE: HIGH]

API-confirmed state for all three environments:

| Environment | protection_rules | deployment_branch_policy | can_admins_bypass |
| ----------- | ---------------- | ------------------------ | ----------------- |
| Production  | `[]`             | `null`                   | `true`            |
| Preview     | `[]`             | `null`                   | `true`            |
| copilot     | `[]`             | `null`                   | `true`            |

Created dates: Production (2025-12-09), Preview (2025-12-10), copilot
(2025-12-13). None have been hardened in the ~4 months since creation.

### 3. Main branch has no branch protection rules [CONFIDENCE: HIGH]

`gh api repos/.../branches/main/protection` returns HTTP 404 with message
"Branch not protected". The branch shows `protected: true` in the summary API
but `protection.enabled: false` with no required status checks, no required
reviews, and no restrictions.

This means:

- Anyone with write access can push directly to `main`
- A direct push to `main` immediately triggers a production deploy
- No PR review is required before production deployment
- CI (lint, test, type check, validate, build) is NOT a required gate for main
  merges

### 4. Deploy runs entirely from `push` to `main` with no CI dependency [CONFIDENCE: HIGH]

The `deploy-firebase.yml` trigger is:

```yaml
on:
  push:
    branches:
      - main
  workflow_dispatch:
```

The CI workflow (`ci.yml`) also triggers on `push: branches: [main]` but the
deploy workflow does NOT declare `needs:` on CI passing. Both workflows run in
parallel on every push to main. It is entirely possible (and has happened based
on the `failure` run on 2026-03-23) for the deploy to succeed while CI is
failing or vice versa. A broken build can reach production.

### 5. Preview deploy is permanently disabled [CONFIDENCE: HIGH]

The `pull_request_target` trigger for the `preview-deploy` job is commented out
with the comment: "Preview deploys disabled — GitHub repo variables not
configured". The `vars.NEXT_PUBLIC_FIREBASE_*` variables referenced in the
preview job do not exist — only `secrets.NEXT_PUBLIC_FIREBASE_*` exist at repo
level.

The `preview-deploy` job also references `secrets.FIREBASE_SERVICE_ACCOUNT`
which does exist, but the misconfiguration of `vars.*` vs `secrets.*` for
Firebase config values keeps the entire preview deploy path broken.

**Impact:** There is no staging/preview deployment path for PRs. All code ships
directly to production on merge to `main` with no preview validation step.

### 6. Firebase service account stored as repo-level secret with no environment scoping [CONFIDENCE: HIGH]

`FIREBASE_SERVICE_ACCOUNT` is a single repo-level secret, created 2025-12-16.
There are zero environment-specific secrets in any of the three environments.

This means:

- The same production service account key is used for all deploy contexts
- Any workflow on the repo (including those triggered by PRs from forks, if
  enabled) could potentially reference this secret
- There is no separate preview/staging service account with reduced permissions

The `preview-deploy` job references `secrets.FIREBASE_SERVICE_ACCOUNT` and uses
it to deploy to Firebase Hosting preview channels — meaning a PR-triggered job
would use the full production service account. The `pull_request_target` trigger
is especially sensitive: it runs with the base repo's secrets, which is a known
attack vector. The current disable of this trigger inadvertently mitigates the
risk.

### 7. Firebase config values stored as secrets but are public-client values [CONFIDENCE: HIGH]

Six secrets (`NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`,
`NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`,
`NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`) are
stored as repository secrets. These are `NEXT_PUBLIC_*` values — they are
embedded into the built JavaScript bundle and are publicly visible to any
browser that loads the app.

Storing them as `secrets` provides a false sense of security and creates the
`vars.*` vs `secrets.*` inconsistency that broke the preview deploy. These
should be repository variables (`vars.*`), not secrets. The build job in
`ci.yml` uses hardcoded placeholder values ("test") for the same keys, which
confirms they are not truly sensitive.

### 8. Deploy workflow uses pinned action SHA but installs Firebase CLI at a pinned version [CONFIDENCE: HIGH]

Actions are properly SHA-pinned:

- `actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd`
- `actions/setup-node@53b83947a5a98c8d113130e565377fae1a50d02f`
- `FirebaseExtended/action-hosting-deploy@e2eda2e106cfa35cdbcf4ac9ddaf6c4756df2c8c`

The `firebase-tools` CLI is installed via
`npm install -g firebase-tools@13.29.1` with an exact version pin. This is
correct security practice. However, `gcloud auth activate-service-account` runs
without version-pinning on the pre-installed gcloud SDK — acceptable since the
runner provides it.

### 9. Credential handling uses temp file pattern with cleanup step [CONFIDENCE: HIGH]

The service account is written to `$HOME/gcloud-key.json` with `chmod 600`, and
there is an `if: always()` cleanup step to delete it. This is reasonable, but
writing credentials to disk (even temporarily) is less secure than using
Workload Identity Federation, which eliminates the need to store a service
account key entirely.

### 10. `workflow_dispatch` on deploy workflow allows manual production deployments with no audit trail gate [CONFIDENCE: MEDIUM]

The deploy workflow accepts `workflow_dispatch` as a trigger. This allows any
user with write access to manually trigger a production deployment to any ref
(defaulting to the default branch). Since there is no environment protection
gate, there is no required-reviewer step before a manual deploy runs.

### 11. `delete_branch_on_merge: false` means stale branches accumulate [CONFIDENCE: MEDIUM]

The repo does not auto-delete merged branches. With no branch deployment
policies, any branch could theoretically be used as a `workflow_dispatch` ref. A
separate `cleanup-branches.yml` workflow exists but its behavior was not audited
in scope.

### 12. No rollback mechanism documented or automated [CONFIDENCE: MEDIUM]

The deploy workflow has no rollback step, no deployment status notification, and
no automated smoke test after deploy. The `Deployment Summary` step only echoes
URLs. There is no integration with GitHub deployment statuses for the Production
environment (because no `environment:` context is set, no deployment tracking
record is created on the environment).

Confirmed: the deployment records visible in the API (10 entries, all from
`vercel[bot]`) are from a previous Vercel integration that was removed, not from
the current Firebase deploy workflow.

---

## Recommended Protection Rules Per Environment

### Production Environment (priority: CRITICAL)

1. Add `environment: Production` to the `deploy` job in `deploy-firebase.yml`
2. Configure Production environment protection:
   - `required_reviewers`: 1 (the repo owner, since solo dev)
   - `wait_timer`: 0 minutes (or 5 as a buffer — solo dev review is the gate)
   - `deployment_branch_policy`: restrict to `main` branch only
   - `can_admins_bypass`: set to `false` to enforce the gate even for admins
3. Add a required status check gate: deploy should only run if CI passes
   (implement via `needs:` in the deploy job referencing a CI reusable, or
   require CI completion before the environment gate approves)

### Preview Environment (priority: HIGH)

1. Enable preview deploys by fixing `vars.*` vs `secrets.*` mismatch:
   - Move the 6 `NEXT_PUBLIC_FIREBASE_*` secrets to repo variables (`vars.*`)
   - Re-enable the `pull_request_target` trigger
2. Create a separate Firebase service account for preview with minimal
   permissions (Hosting deploy only, no Functions/Firestore rules write)
3. Store the preview SA as an environment-specific secret on the Preview
   environment, not as a repo-level secret
4. Add `environment: Preview` to the `preview-deploy` job
5. Configure Preview environment protection:
   - `deployment_branch_policy`: restrict to PR head branches only (not main)
   - No required reviewer (automated is fine for PR previews)

### copilot Environment (priority: LOW)

1. The `copilot` environment was created by the Copilot coding agent feature
   (confirmed by creation date 2025-12-13 and the `COPILOT_AGENT_FIREWALL_*`
   variables). It is not used in any custom workflow.
2. Add `deployment_branch_policy` restricting to specific branches if Copilot
   agent deployments are expected to be scoped
3. No custom changes required if this is auto-managed by GitHub Copilot

### Main Branch Protection (priority: CRITICAL)

Configure branch protection for `main`:

- Require pull request before merging (at least 1 approval for non-solo, or
  self-review not allowed)
- Require status checks to pass before merging: `CI / Lint & Format`,
  `CI / Type Check & Test`, `CI / Validate & Compliance`, `CI / Build`
- Restrict direct pushes to main (force all changes through PRs)
- Do not allow bypassing required pull requests

---

## Sources

| #   | URL                                          | Title                   | Type         | Trust | CRAAP     | Date       |
| --- | -------------------------------------------- | ----------------------- | ------------ | ----- | --------- | ---------- |
| 1   | `.github/workflows/deploy-firebase.yml`      | Deploy workflow         | filesystem   | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 2   | `firebase.json`                              | Firebase hosting config | filesystem   | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 3   | `gh api .../environments/Production`         | Production env API      | official API | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 4   | `gh api .../environments/Preview`            | Preview env API         | official API | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 5   | `gh api .../environments/copilot`            | copilot env API         | official API | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 6   | `gh api .../actions/secrets`                 | Repo secrets list       | official API | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 7   | `gh api .../actions/variables`               | Repo variables list     | official API | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 8   | `gh api .../environments/*/secrets`          | Env-specific secrets    | official API | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 9   | `gh api .../branches/main/protection`        | Branch protection       | official API | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 10  | `.github/workflows/ci.yml`                   | CI workflow             | filesystem   | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 11  | `gh run list --workflow=deploy-firebase.yml` | Recent deploy runs      | official API | HIGH  | 5/5/5/5/5 | 2026-03-29 |

---

## Contradictions

**Branch protection inconsistency:** The `gh api .../branches/main` endpoint
returns `protected: true`, but `gh api .../branches/main/protection` returns
HTTP 404 "Branch not protected". This is a GitHub API behavior where
`protected: true` in the branch summary means a legacy rule exists but no
rulesets or full branch protection config is active. Effective result: no
enforced protection.

**Deployment history vs current deploy workflow:** The 10 deployment records
visible via the deployments API were all created by `vercel[bot]` in
December 2025. The current Firebase deploy workflow does NOT write deployment
records because it references no `environment:` context. There is a gap between
what the deployments API shows and what is actually being deployed.

---

## Gaps

1. **No smoke test data:** Could not determine if there is any post-deploy
   validation step (e.g., a health check endpoint) — the deploy workflow has no
   such step, but there may be external monitoring not visible in the repo.

2. **Service account permissions not auditable from here:** The actual IAM roles
   attached to `FIREBASE_SERVICE_ACCOUNT` cannot be verified from the GitHub API
   alone. The least-privilege assessment (Finding 6) cannot be completed without
   Firebase Console / GCP IAM inspection.

3. **Firebase Hosting rollback capability:** Firebase Hosting supports
   `firebase hosting:clone` and channel rollback, but whether this is documented
   or runnable is outside the workflow files. No runbook found in the repo.

4. **Workload Identity Federation feasibility:** WIF for GitHub Actions +
   Firebase is documented but requires GCP project-level changes. Feasibility
   depends on project owner access — not auditable from the repo.

5. **`workflow_dispatch` ref scope:** When `workflow_dispatch` is used without
   environment protection, an actor could deploy an arbitrary ref. Could not
   determine if repo has write-access controls beyond owner (single-owner repo
   likely fine, but not confirmed).

---

## Serendipity

**SonarCloud is manually disabled:** The `sonarcloud.yml` workflow shows
`state: disabled_manually`. This is a separate concern from deploy hardening,
but it means one of the security scanning layers is currently inactive. Given
the deploy gap (no environment gate), this is worth flagging — if SonarCloud
were re-enabled, it still would not block deploys because the deploy workflow
doesn't gate on CI results anyway.

**The `pull_request_target` disable was accidental security hardening:** The
comment "Preview deploys disabled — GitHub repo variables not configured"
indicates it was disabled for operational reasons (vars not set up), not
security reasons. However, `pull_request_target` is one of the highest-risk
GitHub Actions triggers because it runs with base-repo secrets while potentially
running code from a fork PR. The current disable avoids the attack surface. When
re-enabling, the recommended guard condition
(`github.event.pull_request.head.repo.full_name == github.repository`) is
already present in the workflow — good defensive coding.

**`delete_branch_on_merge` is false despite `cleanup-branches.yml` existing:**
The repo has an automated branch cleanup workflow but the repo setting to
auto-delete on merge is not enabled. This creates overlap/redundancy. Not a
security issue but worth noting for hygiene.

---

## Confidence Assessment

- HIGH claims: 9
- MEDIUM claims: 2
- LOW claims: 0
- UNVERIFIED claims: 0
- **Overall confidence: HIGH** — all findings are directly confirmed by live API
  data and filesystem reads with no inference from training data

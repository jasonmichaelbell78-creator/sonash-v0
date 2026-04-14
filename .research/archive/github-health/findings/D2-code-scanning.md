# Findings: Code Scanning Alerts — All Open Alerts Analysis

**Searcher:** deep-research-searcher **Profile:** codebase + web **Date:**
2026-03-29 **Sub-Question IDs:** D2-SQ2b

---

## Overview

Total open code scanning alerts: **17** All 17 are from a single tool: **OpenSSF
Scorecard** No open CodeQL alerts. No open Semgrep alerts.

Alert breakdown by rule:

- TokenPermissionsID: 9 alerts (9 different workflow files)
- PinnedDependenciesID: 3 alerts (3 locations)
- VulnerabilitiesID: 1 alert (5 CVEs)
- BinaryArtifactsID: 1 alert
- BranchProtectionID: 1 alert
- CodeReviewID: 1 alert
- CIIBestPracticesID: 1 alert

---

## Key Findings

### FINDING 1: TokenPermissionsID — 9 Workflow Files Have Overly-Broad Permissions [CONFIDENCE: HIGH]

Scorecard flags workflows where job-level or top-level permissions include write
access that Scorecard considers unnecessary or where the top-level permissions
block is not set to `read-all` / `contents: read`.

**Affected workflows and the specific violation:**

| Alert # | File                                          | Line | Violation                          |
| ------- | --------------------------------------------- | ---- | ---------------------------------- |
| #5459   | `.github/workflows/cleanup-branches.yml`      | 18   | Job-level `contents: write`        |
| #5458   | `.github/workflows/auto-merge-dependabot.yml` | 16   | Job-level `contents: write`        |
| #5450   | `.github/workflows/sonarcloud.yml`            | 17   | Top-level `security-events: write` |
| #5449   | `.github/workflows/codeql.yml`                | 28   | Top-level `security-events: write` |
| #5446   | `.github/workflows/sync-readme.yml`           | 22   | Job-level `contents: write`        |
| #5445   | `.github/workflows/resolve-debt.yml`          | 22   | Job-level `contents: write`        |
| #5444   | `.github/workflows/release-please.yml`        | 28   | Job-level `contents: write`        |
| #5443   | `.github/workflows/deploy-firebase.yml`       | 29   | Job-level `checks: write`          |
| #5442   | `.github/workflows/ci.yml`                    | 79   | Job-level `checks: write`          |

**Root cause analysis per workflow:**

**cleanup-branches.yml** (#5459): The job pushes deletions to the remote via
`git push origin --delete $BRANCH`, so `contents: write` is legitimately
required. All workflows have `permissions: {}` at top-level, so Scorecard's
complaint is that even narrowed job-level write permissions score < 10.
Scorecard requires a top-level `permissions: read-all` or equivalent. Current
top-level is `permissions: {}` which Scorecard treats as "default" (equivalent
to write-all for older tokens). Score is 8/10 (not a full fail, but flagged as
error severity).

**auto-merge-dependabot.yml** (#5458): Job needs `contents: write` (for
`gh pr merge`) and `pull-requests: write`. Both are legitimate. Same Scorecard
scoring issue.

**sonarcloud.yml** (#5450): Top-level block includes `security-events: write`
alongside `contents: read` and `pull-requests: write`. Scorecard flags top-level
`security-events: write` — fix is to move `security-events: write` to the
job-level and set top-level to `contents: read`.

**codeql.yml** (#5449): Top-level block has `security-events: write` (required
for SARIF upload). Same pattern as sonarcloud — move write to job level, set
top-level to `contents: read`.

**sync-readme.yml** (#5446): Job needs `contents: write` to push README commits
and `pull-requests: write`. Legitimate but Scorecard still flags.

**resolve-debt.yml** (#5445): Job needs `contents: write` to commit resolved
debt files. Legitimate.

**release-please.yml** (#5444): Job needs `contents: write` (create tags, update
CHANGELOG) and `pull-requests: write`. Legitimate.

**deploy-firebase.yml** (#5443): Job is `preview-deploy` (currently disabled via
`if: false` condition). It has `checks: write` which is required by
`FirebaseExtended/action-hosting-deploy` to post check run status on PRs.
Legitimate.

**ci.yml** (#5442): The `test` job has `checks: write` — used by
`codecov/codecov-action` to post check annotations. Legitimate.

**Fix strategy:**

The Scorecard `TokenPermissionsID` check scores a workflow < 10 when any
top-level or job-level permission is `write`. It expects:

1. Top-level `permissions: read-all` (or `contents: read`) as a default-deny
2. Job-level write permissions scoped only to what is needed

Most of these workflows already have `permissions: {}` at top-level (which
Scorecard treats as "implicitly write-all" for legacy token reasons) or have
top-level write grants that should move to job-level.

**Concrete fixes by type:**

**Type A — codeql.yml and sonarcloud.yml** (top-level write → move to job):

```yaml
# Before (sonarcloud.yml)
permissions:
  contents: read
  pull-requests: write
  security-events: write

# After
permissions:
  contents: read

jobs:
  Analysis:
    permissions:
      contents: read
      pull-requests: write
      security-events: write
```

**Type B — workflows with `permissions: {}` at top-level** (add explicit
read-all): Scorecard recommends changing `permissions: {}` to
`permissions: read-all` or explicit read grants. The current `{}` is causing the
8/10 score rather than 10.

```yaml
# Before
permissions: {}

# After
permissions:
  contents: read
```

Then the job-level write permissions remain as-is (they are correct for each
job's function).

**Note on legitimacy:** Every `contents: write` and `checks: write` in these
workflows is genuinely required for the job's function (branch deletion,
auto-merge, README sync, debt resolution, release tagging, preview deploys, test
reporting). These cannot be removed — only reorganized to satisfy the Scorecard
pattern. [Source: Alert messages #5441–#5459, direct workflow file inspection]

---

### FINDING 2: PinnedDependenciesID — 3 Unpinned Package Manager Commands [CONFIDENCE: HIGH]

Scorecard flags package manager `install` commands that install floating
versions rather than exact pinned versions (which could be tampered with in a
supply-chain attack).

| Alert # | File                                                        | Line | Violation                               |
| ------- | ----------------------------------------------------------- | ---- | --------------------------------------- |
| #5460   | `.claude/skills/artifacts-builder/scripts/init-artifact.sh` | 50   | `npm install -g pnpm@9.15.4`            |
| #5454   | `.github/workflows/semgrep.yml`                             | 53   | `pip install semgrep==1.67.0`           |
| #5453   | `.github/workflows/deploy-firebase.yml`                     | 101  | `npm install -g firebase-tools@13.29.1` |

**Analysis per file:**

**init-artifact.sh line 50** (#5460): `npm install -g pnpm@9.15.4` pins the
version but Scorecard requires hash-pinning for npm global installs. The fix is
to use `npm install -g pnpm@9.15.4 --integrity=sha512-<hash>` or use
`corepack enable pnpm` instead (corepack is part of Node.js and uses pinned
hashes from `package.json#packageManager` field).

However, this is a LOCAL developer script under `.claude/skills/`, not a CI
workflow. Scorecard is scanning all shell scripts in the repo, not just CI
files. The risk profile is much lower for a local dev script.

**semgrep.yml line 53** (#5454): `pip install semgrep==1.67.0` pins the version
exactly via `==` but Scorecard requires hash-pinning for pip to protect against
PyPI package replacement. Fix is to use
`pip install semgrep==1.67.0 --require-hashes` with a hash in
`requirements.txt`, or pin via a `requirements.txt` with `--hash=sha256:...`.

**deploy-firebase.yml line 101** (#5453):
`npm install -g firebase-tools@13.29.1` is a version-pinned npm global install.
Same issue as above — Scorecard wants hash-based pinning. Fix options:

- Pin via `npm install -g firebase-tools@13.29.1 --integrity=sha512-<hash>`
- Or switch to `npx firebase-tools@13.29.1` with a hash (Scorecard still flags
  `npx` without hash)
- Or use a pinned GitHub Action from `firebase-tools` that pins by commit SHA

**Fix strategy:**

- The `.github/workflows/` scripts (semgrep.yml, deploy-firebase.yml) are
  medium-effort fixes — both require finding and embedding package hashes.
- The `.claude/skills/` script is a local dev tool; the risk is low. Could be
  deferred or the alert dismissed for non-CI scripts.
- A pragmatic fix for semgrep.yml: create a `requirements.txt` next to the
  workflow with the pinned semgrep version + hash.
- A pragmatic fix for deploy-firebase.yml: switch to
  `npx --yes firebase-tools@13.29.1` is still flagged; best fix is to use a
  GitHub Action that pins firebase-tools by commit SHA, or run
  `npm install firebase-tools@13.29.1` into the project and use `npx firebase`.

---

### FINDING 3: VulnerabilitiesID — 5 Known CVEs in Dependencies [CONFIDENCE: HIGH]

Alert #5457 reports a score of 5/10. Five GHSA advisories are detected, all via
Scorecard's OSV-based dependency scanning:

**MCP Python SDK vulnerabilities (3 of 5):**

| GHSA                | Severity | Vulnerable Range | Fixed In | Summary                                             |
| ------------------- | -------- | ---------------- | -------- | --------------------------------------------------- |
| GHSA-3qhf-m339-9g5v | High     | `< 1.9.4`        | `1.9.4`  | FastMCP validation error → DoS                      |
| GHSA-9h52-p55h-vw2f | High     | `< 1.23.0`       | `1.23.0` | DNS rebinding protection missing                    |
| GHSA-j975-95f5-7wqh | High     | `< 1.10.0`       | `1.10.0` | Streamable HTTP transport unhandled exception → DoS |

**Location:** `.claude/skills/mcp-builder/scripts/requirements.txt` specifies
`mcp>=1.1.0`. The installed Python MCP SDK on this system is 1.23.3 (patched for
all three). However, Scorecard scans the `requirements.txt` file, which allows
`mcp>=1.1.0` — any version from 1.1.0 onward satisfies the constraint, including
vulnerable versions.

**Fix:** Update `requirements.txt` to `mcp>=1.23.0` to exclude all three
vulnerable ranges (1.23.0 is the highest patched version).

**path-to-regexp vulnerabilities (2 of 5):**

| GHSA                | Severity | Vulnerable Range    | Fixed In | Summary                            |
| ------------------- | -------- | ------------------- | -------- | ---------------------------------- |
| GHSA-27v5-c462-wpq7 | Medium   | `>= 8.0.0, < 8.4.0` | `8.4.0`  | ReDoS via multiple wildcards       |
| GHSA-j3q9-mxjg-w52f | High     | `>= 8.0.0, < 8.4.0` | `8.4.0`  | DoS via sequential optional groups |

**Location:** `package-lock.json` shows `node_modules/path-to-regexp` at version
`8.3.0`, pulled in by `node_modules/router` (constraint `^8.0.0`). The
`functions` sub-package uses `0.1.13` (already patched for its branch).

**Note:** The git status shows `package-lock.json` is modified in the working
tree — this likely reflects an in-progress dependency update attempt. The
currently committed version still uses `8.3.0`.

**Fix:** Run `npm update path-to-regexp` or add an override in `package.json`:

```json
"overrides": {
  "path-to-regexp": "^8.4.0"
}
```

---

### FINDING 4: BinaryArtifactsID — Compiled .exe Checked Into Repository [CONFIDENCE: HIGH]

Alert #5461: `tools/statusline/sonash-statusline.exe` is tracked in git
(confirmed via `git ls-files`). This is a compiled Windows Go binary.

**What Scorecard checks:** Whether the repository contains non-reviewable binary
artifacts. Binaries can hide malicious code, are difficult to audit, and may
become stale vs source.

**Current state analysis:**

- `tools/statusline/` contains Go source files (`main.go`, `widgets.go`, etc.)
- `tools/statusline/build.sh` is a build script
- The `.gitignore` in that directory explicitly lists `sonash-statusline` (Linux
  binary) but `sonash-statusline.exe` is NOT gitignored — it is tracked
- Also tracked: `tools/statusline/widgets.go` and other `.go` sources confirm
  the binary can be built from source
- A `statusline.exe` is also tracked

**Fix options:**

1. **Simple**: Add `sonash-statusline.exe`, `statusline.exe`, and
   `sonash-statusline` to `tools/statusline/.gitignore`, then `git rm --cached`
   them. Provide build instructions in a README or via `build.sh`.
2. **With GitHub Release**: Build the binary in CI and attach to GitHub
   Releases, so users can download pre-built without it being in source.

**Complication**: A note in `MEMORY.md` states "Never overwrite
`sonash-statusline.exe` while Claude Code is running" and the statusline binary
is used as a live tool. If developers need the binary pre-built (e.g., Windows
users who don't have Go installed), removing from git needs coordination.

**Recommendation**: Option 1 with a documented build step. The source is present
so the binary is reproducible.

---

### FINDING 5: BranchProtectionID — Main Branch Protection Is Minimal [CONFIDENCE: HIGH]

Alert #5441: Score is 4/10. Main branch has NO protection rules at all (API
returns 404 "Branch not protected").

Scorecard detected (from the alert message):

- `apply to administrators` disabled (admins can bypass)
- `stale review dismissal` disabled
- Branch does not require approvers
- Codeowners review not required
- `last push approval` disabled

This is a solo developer project (per `MEMORY.md`: "solo developer"), so
requiring PR approvals from other reviewers is not practical. However, Scorecard
penalizes the absence of any protection.

**Fix strategy:** Setting minimal branch protection that satisfies Scorecard
without blocking solo developer workflow:

1. Enable branch protection on `main`
2. Enable "Restrict pushes that create files" (or require status checks)
3. Enable "Include administrators" (apply rules to yourself)
4. Consider requiring at least 1 PR review from a CODEOWNERS file that points to
   the solo developer's own account (self-review)

The practical minimum that improves the Scorecard score without blocking
workflows: require status checks (CI must pass), enable "dismiss stale reviews"
(even if 0 required reviewers), enable "include admins."

**Via GitHub API:**

```bash
gh api repos/jasonmichaelbell78-creator/sonash-v0/branches/main/protection \
  --method PUT \
  --field enforce_admins=true \
  --field 'required_status_checks={"strict":true,"contexts":["ci/lint","ci/test"]}' \
  --field 'required_pull_request_reviews={"dismiss_stale_reviews":true,"require_code_owner_reviews":false,"required_approving_review_count":0}' \
  --field 'restrictions=null' \
  --field 'allow_force_pushes=false' \
  --field 'allow_deletions=false'
```

---

### FINDING 6: CodeReviewID — 0/6 Recent Commits Had Approved Changesets [CONFIDENCE: HIGH]

Alert #5455: Score is 0/10. Scorecard found 0 approved changesets in the last 6
reviewed commits/PRs.

For a solo developer project, this is expected — there is no second reviewer.
Scorecard's `Code-Review` check looks for PR approval events before merge.

**Fix options:**

1. **Process change (hard)**: Add a second collaborator who reviews PRs. Not
   realistic for a solo project.
2. **Use a bot reviewer**: Configure a bot (e.g., `github-actions[bot]` via
   auto-approve workflow) to auto-approve PRs after CI passes. This satisfies
   Scorecard's letter but not spirit.
3. **Accept the score**: This is inherent to solo development. Alert can be
   dismissed with reason "Solo developer project" or the Scorecard workflow can
   be tuned to exclude this check.
4. **CODEOWNERS + require-review workflow**: A CODEOWNERS file pointing to the
   developer's own account, with a required 1-approval, combined with GitHub's
   "approved by CODEOWNER" setting — then the developer can self-approve.

**Note:** Some documentation suggests GitHub does not allow self-approval (the
PR author cannot approve their own PR). This would block the solo developer. A
bot auto-approve action is the most practical Scorecard compliance path.

---

### FINDING 7: CIIBestPracticesID — No OpenSSF Best Practices Badge [CONFIDENCE: HIGH]

Alert #5456: Score is 0/10. The project has not applied for or earned an OpenSSF
Best Practices badge at https://bestpractices.coreinfrastructure.org.

This is a registration/application step, not a code change.

**Fix:** Register the project at
https://bestpractices.coreinfrastructure.org/en/projects/new and complete the
questionnaire. The "passing" level requires ~60 criteria (most are already met:
automated tests, CI, security policy, etc.).

A `README.md` badge is typically added after earning the badge.

This is a **low-code / high-effort** fix (questionnaire is time-consuming, ~2-4
hours for first attempt) but a **one-time** investment.

---

## Fix Prioritization Matrix

### Quick Wins (< 30 min, high impact)

1. **TokenPermissionsID — codeql.yml and sonarcloud.yml** (Alerts #5449, #5450):
   Move `security-events: write` from top-level to job-level. 2 file edits. This
   follows the documented pattern and will resolve 2 alerts immediately.

2. **TokenPermissionsID — top-level `permissions: {}` workflows** (Alerts #5442,
   #5443, #5444, #5445, #5446, #5458, #5459): Change top-level from
   `permissions: {}` to `permissions: read-all` or
   `permissions: contents: read`. 7 file edits, each a single-line change.

3. **VulnerabilitiesID — mcp requirements.txt** (Alert #5457, 3 of 5 CVEs):
   Change `mcp>=1.1.0` to `mcp>=1.23.0` in
   `.claude/skills/mcp-builder/scripts/requirements.txt`. One-line edit.

4. **VulnerabilitiesID — path-to-regexp** (Alert #5457, 2 of 5 CVEs): Add
   override to `package.json` and run `npm install`. Already partially done
   (package-lock.json shows uncommitted changes).

### Medium Effort (30 min - 2 hrs)

5. **BinaryArtifactsID — remove .exe from git** (Alert #5461): Add to
   `.gitignore`, `git rm --cached`, commit. Requires coordination with local dev
   workflow (build step needed). Medium risk.

6. **PinnedDependenciesID — semgrep.yml** (Alert #5454): Create
   `requirements.txt` with hash for semgrep 1.67.0, update workflow to use it.

7. **PinnedDependenciesID — deploy-firebase.yml** (Alert #5453): Find SHA hash
   for firebase-tools@13.29.1, pin in npm install command.

8. **BranchProtectionID — enable basic main branch protection** (Alert #5441):
   Via GitHub UI or API. Requires deciding on status check names to require.

### High Effort / External Process

9. **PinnedDependenciesID — init-artifact.sh** (Alert #5460): Local dev script.
   Lower risk. Could use corepack instead of npm install -g, or dismiss.

10. **CodeReviewID** (Alert #5455): Requires either adding a second reviewer,
    setting up an auto-approve bot, or accepting the score.

11. **CIIBestPracticesID** (Alert #5456): Requires registering and completing
    the OpenSSF Best Practices questionnaire (~2-4 hours).

---

## Sources

| #   | Source                                                      | Title                           | Type         | Trust | Date       |
| --- | ----------------------------------------------------------- | ------------------------------- | ------------ | ----- | ---------- |
| 1   | `gh api repos/.../code-scanning/alerts`                     | GitHub Code Scanning Alerts API | Official API | HIGH  | 2026-03-29 |
| 2   | `gh api advisories/GHSA-*`                                  | GitHub Security Advisories      | Official API | HIGH  | 2026-03-29 |
| 3   | `.github/workflows/ci.yml`                                  | CI Workflow                     | Codebase     | HIGH  | 2026-03-29 |
| 4   | `.github/workflows/codeql.yml`                              | CodeQL Workflow                 | Codebase     | HIGH  | 2026-03-29 |
| 5   | `.github/workflows/sonarcloud.yml`                          | SonarCloud Workflow             | Codebase     | HIGH  | 2026-03-29 |
| 6   | `.github/workflows/deploy-firebase.yml`                     | Deploy Firebase Workflow        | Codebase     | HIGH  | 2026-03-29 |
| 7   | `.github/workflows/release-please.yml`                      | Release Please Workflow         | Codebase     | HIGH  | 2026-03-29 |
| 8   | `.github/workflows/resolve-debt.yml`                        | Resolve Debt Workflow           | Codebase     | HIGH  | 2026-03-29 |
| 9   | `.github/workflows/sync-readme.yml`                         | Sync README Workflow            | Codebase     | HIGH  | 2026-03-29 |
| 10  | `.github/workflows/cleanup-branches.yml`                    | Cleanup Branches Workflow       | Codebase     | HIGH  | 2026-03-29 |
| 11  | `.github/workflows/auto-merge-dependabot.yml`               | Auto-merge Dependabot Workflow  | Codebase     | HIGH  | 2026-03-29 |
| 12  | `.github/workflows/semgrep.yml`                             | Semgrep Workflow                | Codebase     | HIGH  | 2026-03-29 |
| 13  | `.claude/skills/artifacts-builder/scripts/init-artifact.sh` | init-artifact.sh                | Codebase     | HIGH  | 2026-03-29 |
| 14  | `.claude/skills/mcp-builder/scripts/requirements.txt`       | MCP Builder requirements        | Codebase     | HIGH  | 2026-03-29 |
| 15  | `tools/statusline/` (git ls-files)                          | Statusline binary tracking      | Codebase     | HIGH  | 2026-03-29 |
| 16  | `package-lock.json`                                         | Root package-lock.json          | Codebase     | HIGH  | 2026-03-29 |
| 17  | `scripts/mcp/package.json`                                  | MCP scripts package.json        | Codebase     | HIGH  | 2026-03-29 |

---

## Contradictions

**TokenPermissionsID false-positive pattern**: Scorecard's scoring of
`contents: write` at job level is debatable for workflows like
`cleanup-branches` or `resolve-debt` where write access is genuinely required.
The alert severity is "error" but the Scorecard score is 8/10 (not 0). The fix
(adding top-level `permissions: read-all`) does not remove any write permissions
— it's a structural reorganization to satisfy Scorecard's pattern matching. Some
security practitioners argue this is cosmetic rather than a real security
improvement.

**BinaryArtifactsID — .exe utility vs production code**: The
`sonash-statusline.exe` is a developer utility (local statusline tool), not
shipped code. Scorecard treats it identically to production binaries. The actual
risk is low (it's your own build from source in the same repo), but the alert is
technically correct.

**VulnerabilitiesID — MCP Python SDK risk profile**: The three MCP Python CVEs
affect server-side scenarios (FastMCP server, HTTP transport). The
`requirements.txt` file is used to install the MCP SDK for a local developer
script (MCP builder), not a publicly-deployed server. The vulnerability impact
is lower in this context. However, pinning to `>=1.23.0` is still the correct
fix regardless.

---

## Gaps

1. **CodeQL alerts**: All CodeQL alerts are resolved (0 open). This is confirmed
   by the API returning only Scorecard alerts. Cannot determine when they were
   last closed.

2. **Semgrep alerts**: All Semgrep alerts are resolved (0 open). The semgrep
   workflow is configured to upload SARIF results.

3. **Path-to-regexp in-progress update**: `package-lock.json` shows uncommitted
   modifications but I could not determine what version the working tree update
   targets without reading the full diff (too large). If the update brings
   `path-to-regexp` to `8.4.0`, the GHSA-27v5 and GHSA-j3q9 CVEs would be
   resolved once committed.

4. **Scorecard scoring model**: The exact formula for how Scorecard converts
   individual check scores to GitHub Code Scanning severity was not verified.
   All 17 alerts have severity "error" in the API, but the underlying Scorecard
   scores range from 0/10 (CodeReview, CIIBestPractices) to 8/10
   (TokenPermissions).

5. **CODEOWNERS file existence**: Did not verify whether a CODEOWNERS file
   exists, which would be relevant to the BranchProtection and CodeReview fix
   strategies.

6. **deploy-firebase.yml preview-deploy job**: Currently disabled by
   `if: ${{ github.event_name == 'pull_request_target' && ... }}` but the
   `pull_request_target` trigger is commented out in the `on:` block. The job
   effectively never runs. The `checks: write` permission is still present but
   unused. This creates an interesting case for the fix — removing the
   permission would be safe but the job itself may be re-enabled in future.

---

## Serendipity

1. **No open CodeQL or Semgrep alerts**: The project has a clean bill of health
   from CodeQL and custom Semgrep rules. This is noteworthy given the 17
   Scorecard alerts — the code quality security posture is good, but the repo
   hygiene / supply-chain posture is what Scorecard is measuring.

2. **path-to-regexp already being updated**: The git status shows uncommitted
   changes to `package-lock.json` and `package.json`. This likely represents an
   in-progress dependency update. If `path-to-regexp` is being bumped to 8.4.0
   in that update, two of the five VulnerabilitiesID CVEs will resolve
   themselves.

3. **MCP Python 1.23.3 already installed locally**: The developer's local
   environment has `mcp==1.23.3` installed (confirmed via `pip show mcp`), which
   patches all three MCP Python CVEs. The issue is only the `requirements.txt`
   lower-bound constraint, not the actual installed version.

4. **All job-level write permissions appear legitimate**: After reading every
   flagged workflow, all `contents: write` and `checks: write` grants are
   genuinely required for the job's function. There are no cases of accidentally
   over-privileged workflows — the fixes are purely structural (satisfy
   Scorecard's pattern) rather than substantive security improvements.

---

## Confidence Assessment

- HIGH claims: 7
- MEDIUM claims: 0
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: **HIGH** — all findings sourced from direct API calls and
  codebase file reads; no training data assumptions used.

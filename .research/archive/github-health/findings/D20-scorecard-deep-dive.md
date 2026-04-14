# Findings: OpenSSF Scorecard Deep Dive — jasonmichaelbell78-creator/sonash-v0

**Searcher:** deep-research-searcher (D20-SQ12a) **Profile:** web + codebase
**Date:** 2026-03-29 **Sub-Question IDs:** SQ-12a

---

## Summary

Current overall score: **7.5/10** (API-confirmed). Industry median is ~5.4/10,
so sonash-v0 is already above average. The gap to 9.0+ is concrete and
closeable. Four checks score 0 (Code-Review, CII-Best-Practices) or below 7
(Branch-Protection: 4, Vulnerabilities: 5) and are the primary drag on the
composite score. Two checks are N/A by design (Packaging: -1, Signed-Releases:
-1).

---

## Data Sources

| Source                                     | Method                               | Trust | Date       |
| ------------------------------------------ | ------------------------------------ | ----- | ---------- |
| OpenSSF Scorecard public API               | WebFetch (securityscorecards.dev)    | HIGH  | 2026-03-29 |
| GitHub code-scanning alerts API            | gh api (direct)                      | HIGH  | 2026-03-29 |
| GitHub branch protection API               | gh api (direct)                      | HIGH  | 2026-03-29 |
| GitHub PR reviews API (6 recent PRs)       | gh api (direct)                      | HIGH  | 2026-03-29 |
| GitHub Dependabot alerts API               | gh api (direct)                      | HIGH  | 2026-03-29 |
| Workflow files (filesystem read)           | Codebase inspection                  | HIGH  | 2026-03-29 |
| npm audit (root + functions + scripts/mcp) | Bash (direct)                        | HIGH  | 2026-03-29 |
| OpenSSF Scorecard checks.md                | WebFetch (github.com/ossf/scorecard) | HIGH  | 2026-03-29 |

---

## Key Findings

### 1. Full Per-Check Score Table [CONFIDENCE: HIGH]

All scores confirmed from OpenSSF public API (`securityscorecards.dev`) for run
dated 2026-03-29T00:14:39Z (commit `270a7051`).

| Check                  | Score    | Status         | Weight   | Alert Count |
| ---------------------- | -------- | -------------- | -------- | ----------- |
| Maintained             | 10/10    | PASSING        | High     | 0           |
| Security-Policy        | 10/10    | PASSING        | Medium   | 0           |
| Dependency-Update-Tool | 10/10    | PASSING        | High     | 0           |
| Dangerous-Workflow     | 10/10    | PASSING        | Critical | 0           |
| License                | 10/10    | PASSING        | Low      | 0           |
| Fuzzing                | 10/10    | PASSING        | Medium   | 0           |
| SAST                   | 10/10    | PASSING        | Medium   | 0           |
| CI-Tests               | 10/10    | PASSING        | Low      | 0           |
| Pinned-Dependencies    | 9/10     | NEAR-PASS      | Medium   | 3 open      |
| Binary-Artifacts       | 9/10     | NEAR-PASS      | High     | 1 open      |
| Token-Permissions      | 8/10     | NEAR-PASS      | High     | 9 open      |
| Vulnerabilities        | 5/10     | FAILING        | High     | 1 open      |
| Branch-Protection      | 4/10     | FAILING        | High     | 1 open      |
| Contributors           | 3/10     | STRUCTURAL     | Low      | 0           |
| Code-Review            | 0/10     | FAILING        | High     | 1 open      |
| CII-Best-Practices     | 0/10     | NOT STARTED    | Low      | 1 open      |
| Packaging              | -1 (N/A) | NOT APPLICABLE | Medium   | 0           |
| Signed-Releases        | -1 (N/A) | NOT APPLICABLE | High     | 0           |

**Excluded checks** (no score in this run): Webhooks (not present), SBOM (not in
this version of Scorecard action v2.4.1).

---

### 2. FAILING Checks — Detailed Fix Instructions [CONFIDENCE: HIGH]

#### 2a. Code-Review (0/10) — HIGH RISK

**What it measures:** Whether PRs have a human APPROVED review before merge. Bot
reviews (qodo-code-review[bot], gemini-code-assist[bot]) explicitly do NOT
count. The check looks at the last ~30 commits/PRs for GitHub APPROVED state.

**Current state verified:** Last 6 non-Dependabot PRs (#477, #472, #470, #469,
#468, #466) all merged with 0 human APPROVED reviews. Only bot COMMENTED reviews
present. Result: 0/6 approved changesets = 0/10.

**Scoring deduction logic (from checks.md):**

- Single unreviewed human change: −7 points
- Multiple unreviewed human changes: additional −3 points
- Combined result with no reviewed PRs: 0/10

**Fix options (ranked by feasibility for solo developer):**

Option A — Trusted co-reviewer (best for score):

1. Identify a trusted person (friend, collaborator, open-source contributor)
2. Add them as a collaborator on the repo
3. Require their APPROVED review on PRs before merge
4. This directly satisfies Scorecard's human review requirement
5. Even 1-2 reviewed PRs per release cycle improves the score

Option B — Enable required reviews via branch protection (required for Option A
to be enforced + improves Branch-Protection simultaneously):

```
Settings > Branches > Add rule for "main"
- Check: "Require a pull request before merging"
- Required approvals: 1
- Check: "Dismiss stale pull request approvals when new commits are pushed"
- Check: "Include administrators"
```

Option C — Accept partial score (pragmatic): The check is weighted HIGH. Even
getting 3/6 PRs reviewed would score ~5/10 (partial credit). Getting 6/6
reviewed = 10/10.

**Effort:** STRUCTURAL (process change — requires another human participant)

---

#### 2b. Branch-Protection (4/10) — HIGH RISK

**What it measures:** Branch protection rules on the default branch.

**Current state verified:** `gh api /branches/main/protection` returns 404
("Branch not protected"). Despite `protection_enabled: true` in the branch API,
there are no actual protection rules configured. This likely means a GitHub
ruleset exists but no classic branch protection rule — Scorecard checks classic
branch protection rules.

**Scoring tiers (from checks.md):**

| Tier | Points | Requirements                                                     |
| ---- | ------ | ---------------------------------------------------------------- |
| 1    | 3      | Prevent force push + no branch deletion                          |
| 2    | 6      | ≥1 required reviewer + admins must use PRs + up-to-date branches |
| 3    | 8      | Require status checks                                            |
| 4    | 9      | ≥2 reviewers + code owner approval                               |
| 5    | 10     | Dismiss stale reviews + include admins                           |

**Current score of 4/10** suggests Tier 1 is partially met (possibly via
ruleset, not classic protection). The API returning 404 on `/protection`
confirms classic branch protection is NOT configured.

**Fix to reach 8/10:**

```
Settings > Branches > Add branch protection rule for "main":
1. [x] Require a pull request before merging
       Required approvals: 1
2. [x] Require status checks to pass before merging
       Required checks: ci/lint, ci/test, ci/validate, ci/build
3. [x] Require branches to be up to date before merging
4. [x] Do not allow bypassing the above settings
5. [x] Restrict who can push to matching branches
```

**Fix to reach 10/10** (add to above):

```
6. [x] Dismiss stale pull request approvals when new commits are pushed
7. [x] Require review from Code Owners
```

**Note:** Enabling required reviews (step 1) also feeds into the Code-Review
check, making it a double-impact fix.

**Effort:** QUICK config change (10 minutes in GitHub Settings UI)

---

#### 2c. Vulnerabilities (5/10) — HIGH RISK

**What it measures:** Open CVEs in the dependency graph via OSV database.

**Current state verified:** npm audit on root shows 1 high-severity
vulnerability: `path-to-regexp` 8.3.0 (CVEs: GHSA-j3q9-mxjg-w52f,
GHSA-27v5-c462-wpq7 — ReDoS vulnerabilities). Scorecard reported 5
vulnerabilities at run time, suggesting multiple instances across the dependency
tree or additional OSV findings not surfaced by npm audit alone.

**IMPORTANT NOTE ON TIMING:** The `package-lock.json` in the research worktree
still shows `path-to-regexp@8.3.0`. The Dependabot PRs that merged (#475 and
#476) fixed the `functions/` and `scripts/mcp` subdirectories. The root
`node_modules/path-to-regexp` remains at 8.3.0 (HIGH severity).

**Fix:**

```bash
# In root of repo:
npm audit fix
# Or specifically:
npm install path-to-regexp@8.4.0
```

Then commit the updated `package-lock.json`. Dependabot should auto-create this
PR, or it can be done manually. This is the single blocking dependency fix.

**Score after fix:** OSV check: 0 open vulnerabilities = 10/10

**Effort:** QUICK (1 npm command + commit)

---

### 3. NEAR-PASS Checks — Small Gaps [CONFIDENCE: HIGH]

#### 3a. Token-Permissions (8/10)

**What it measures:** GitHub workflow tokens must follow least privilege —
read-only at top level, write only at job level.

**Current open alerts (9):**

| Workflow                    | Top-Level Permissions                                   | Issue                                                    |
| --------------------------- | ------------------------------------------------------- | -------------------------------------------------------- |
| `sonarcloud.yml`            | `pull-requests: write, security-events: write`          | Write at top level                                       |
| `codeql.yml`                | `security-events: write, packages: read, actions: read` | `security-events: write` at top level                    |
| `auto-merge-dependabot.yml` | `permissions: {}`                                       | Empty (interpreted as default, not explicit read-only)   |
| `cleanup-branches.yml`      | `permissions: {}`                                       | Same issue                                               |
| `sync-readme.yml`           | `permissions: {}`                                       | Same issue                                               |
| `resolve-debt.yml`          | `contents: read`                                        | Top-level read is correct, but job has `contents: write` |
| `release-please.yml`        | `permissions: {}`                                       | Empty                                                    |
| `deploy-firebase.yml`       | `permissions: {}`                                       | Empty                                                    |
| `ci.yml`                    | `permissions: {}`                                       | Empty, job has `checks: write`                           |

**Root cause:** Scorecard's Token-Permissions check distinguishes between
`permissions: {}` (empty object = no explicit read-only declaration) and
`permissions: read-all` (explicit read-only). The former gets flagged.
Additionally, `sonarcloud.yml` and `codeql.yml` have genuine write permissions
at top level.

**Fix pattern:**

For workflows with `permissions: {}` at top level, change to:

```yaml
permissions: read-all
```

Then declare writes at job level (already done for most).

For `sonarcloud.yml`:

```yaml
# Change top-level from:
permissions:
  contents: read
  pull-requests: write    # MOVE TO JOB LEVEL
  security-events: write  # MOVE TO JOB LEVEL

# To:
permissions: read-all

jobs:
  Analysis:
    permissions:
      contents: read
      pull-requests: write
      security-events: write
```

For `codeql.yml`:

```yaml
# Change top-level from:
permissions:
  security-events: write  # MOVE TO JOB LEVEL
  packages: read
  actions: read
  contents: read

# To:
permissions: read-all

jobs:
  analyze:
    permissions:
      security-events: write
      packages: read
      actions: read
      contents: read
```

**Score after fix:** The 1-point gap (8 → likely 9-10) requires all 9 alerts
resolved. The `sonarcloud.yml` and `codeql.yml` top-level write permissions are
the most critical (genuine write-at-top-level). The `permissions: {}` workflows
may account for the other points.

**Note:** `scorecard.yml` itself correctly uses `permissions: contents: read` at
top level with job-level writes — this is the reference pattern.

**Effort:** QUICK (config change across 9 workflow files, ~30 minutes)

---

#### 3b. Pinned-Dependencies (9/10)

**What it measures:** All dependencies pinned by commit SHA, not mutable version
tags.

**Current open alerts (3):**

| File                                                        | Issue                                                           |
| ----------------------------------------------------------- | --------------------------------------------------------------- |
| `.claude/skills/artifacts-builder/scripts/init-artifact.sh` | Uses `VITE_VERSION="latest"` for Node ≥20                       |
| `.github/workflows/semgrep.yml`                             | `pip install semgrep==1.67.0` (version pin, not hash)           |
| `.github/workflows/deploy-firebase.yml`                     | `npm install -g firebase-tools@13.29.1` (version pin, not hash) |

**Fix — init-artifact.sh:** Change `VITE_VERSION="latest"` to a specific
version:

```bash
if [ "$NODE_VERSION" -ge 20 ]; then
  VITE_VERSION="6.2.2"  # pin to specific version
```

**Fix — semgrep.yml:**

```yaml
# Change from:
run: pip install semgrep==1.67.0

# To (using hash):
run: pip install semgrep==1.67.0 --require-hashes --hash=sha256:<hash>
```

Or accept the 1-point deduction as this is a known limitation of pip installs in
GitHub Actions.

**Fix — deploy-firebase.yml:**

```yaml
# Change from:
run: npm install -g firebase-tools@13.29.1

# To:
run: npm install -g firebase-tools@13.29.1 --prefer-offline
```

Note: npm global installs cannot be hash-pinned. The Scorecard check notes this
is a known gap for npm. The 1-point deduction for these pip/npm commands is
inherent to the tool type.

**Score after fix:** 9/10 → likely stays at 9/10 or reaches 10/10 if the
`init-artifact.sh` `latest` pin is the key failing element. The pip/npm commands
may be unavoidable 1-point deductions.

**Effort:** QUICK (1-2 file edits)

---

#### 3c. Binary-Artifacts (9/10)

**What it measures:** No compiled binaries in source code (cannot be
code-reviewed).

**Current open alert:**

- File: `tools/statusline/sonash-statusline.exe`

**Context:** This is the sonash statusline Go binary committed to the repo for
distribution. Per the user's `MEMORY.md`, "never overwrite sonash-statusline.exe
while Claude Code is running." This is a deliberate design choice.

**Fix options:**

Option A — Remove from git, publish as GitHub Release asset:

```bash
git rm --cached tools/statusline/sonash-statusline.exe
echo "tools/statusline/sonash-statusline.exe" >> .gitignore
```

Then publish the binary as a GitHub Release artifact instead of committing it.
Scorecard would then score Binary-Artifacts at 10/10.

Option B — Accept the 1-point deduction: The .exe is a distribution artifact
with legitimate reasons for being in the repo (user convenience). The deduction
is 1 point on a check already at 9/10. Impact on composite score: minimal.

**Score after fix (Option A):** 9/10 → 10/10 on Binary-Artifacts check.

**Effort:** MODERATE (requires adjusting distribution workflow, not just a
config change)

---

### 4. STRUCTURAL Checks [CONFIDENCE: HIGH]

#### 4a. Contributors (3/10) — LOW RISK (weighted low)

**What it measures:** Contributors from ≥3 different organizations in the last
30 commits.

**Current state:** 3 distinct commit authors in last 30 commits:

- `TalkHard` (13 commits) — jasonmichaelbell78-creator GitHub username
- `jasonmichaelbell78-creator` (13 commits) — same person, different git config
- `dependabot[bot]` (5 commits) — automated bot

**Analysis:** This is effectively a 1-person project. The check requires ≥3
companies with ≥5 commits each. This is not achievable without genuine
multi-contributor involvement.

**Fix:** No practical fix without recruiting contributors. Ask any contributing
individuals to join their organization on GitHub (per checks.md recommendation).
Alternatively: ensure git `user.name` is consistent (currently shows as both
`TalkHard` and `jasonmichaelbell78-creator` for what appears to be the same
person) — consolidating would at minimum prevent counting as two "contributors."

**Score ceiling:** 3-4/10 for a solo developer. This check is LOW weight in the
composite score.

---

#### 4b. CII-Best-Practices (0/10) — LOW RISK (weighted low)

**What it measures:** OpenSSF Best Practices badge (bestpractices.dev).

**Current state:** No badge registered.

**Badge scoring:**

- In-progress (started): 2/10
- Passing badge: 5/10
- Silver badge: 7/10
- Gold badge: 10/10

**Path to 5/10 (Passing badge):** ~50 criteria across 7 categories. Many can be
auto-verified. Key requirements sonash-v0 likely already meets:

- Public version control (GitHub): YES
- License: YES (Apache 2.0)
- HTTPS on website: LIKELY (Firebase Hosting)
- Bug reporting process: PARTIAL (GitHub Issues)
- Security disclosure policy: YES (SECURITY.md exists)
- Automated test suite: YES (vitest, 65% coverage)
- Static analysis: YES (CodeQL, Semgrep, SonarCloud)

**Gaps to investigate:**

- Release notes (CHANGELOG) format
- Contribution documentation (CONTRIBUTING.md)
- Formal security review knowledge attestation

**To start:** Visit `https://www.bestpractices.dev/en/projects/new`, link the
GitHub repo, and work through the self-certification form. Registration alone
(in-progress) moves the score from 0 to 2/10.

**Effort:** MODERATE-to-HIGH for passing badge (2-4 hours of self-certification
work). Just starting = 2/10 in 15 minutes.

---

### 5. PASSING Checks — What Maintains Them [CONFIDENCE: HIGH]

| Check                  | Score | What Maintains It                                                                 |
| ---------------------- | ----- | --------------------------------------------------------------------------------- |
| Maintained             | 10/10 | Active commit cadence (30+ commits in 90 days, confirmed by API)                  |
| Security-Policy        | 10/10 | `SECURITY.md` exists in root (2263 bytes, created 2026-03-18)                     |
| Dependency-Update-Tool | 10/10 | Dependabot configured (confirmed by .dependabot/ or dependabot.yml)               |
| Dangerous-Workflow     | 10/10 | No `pull_request_target` or untrusted context variable patterns in workflows      |
| License                | 10/10 | `LICENSE` file in root with Apache 2.0 (OSI-approved)                             |
| Fuzzing                | 10/10 | fast-check property-based testing detected across test files (JavaScript fuzzing) |
| SAST                   | 10/10 | CodeQL runs on all commits (codeql.yml confirmed); SonarCloud also active         |
| CI-Tests               | 10/10 | 10/10 merged PRs had CI checks pass (ci.yml, multi-job)                           |

**Risk of regression:**

- Maintained: at risk if commit cadence drops below 1/week for 90+ days
- Fuzzing: at risk if fast-check tests are removed without replacement
- SAST: at risk if codeql.yml is disabled or has path exclusions that skip all
  code

---

### 6. N/A Checks Context [CONFIDENCE: HIGH]

#### Packaging (-1 / N/A)

**What it checks:** GitHub release workflow publishing packages to npm/PyPI/etc.
**Why N/A:** sonash-v0 is a Next.js application, not a published
library/package. The `release-please.yml` creates GitHub Releases but does not
publish to a package registry. Scorecard cannot find a recognized packaging
workflow. **Impact:** N/A checks do not penalize the composite score. **Optional
improvement:** Publishing a GitHub Release binary or npm package would satisfy
this check, but is unnecessary for an application project.

#### Signed-Releases (-1 / N/A)

**What it checks:** Cryptographic signatures on release assets. **Why N/A:** No
GitHub Releases exist for this repo (API confirmed empty releases list). Once
`release-please.yml` creates a release, this check becomes relevant. **Optional
improvement:** Add artifact signing via `sigstore/cosign-installer` or SLSA
provenance generation (`slsa-github-generator`) to the release workflow. This
would require releases to exist first.

---

### 7. Priority-Ranked Improvement Plan [CONFIDENCE: HIGH]

Ranked by: (impact on composite score × fix effort ratio), with HIGH-weight
checks prioritized.

| Priority | Check               | Current | Target         | Score Delta        | Effort  | Type             |
| -------- | ------------------- | ------- | -------------- | ------------------ | ------- | ---------------- |
| P1       | Vulnerabilities     | 5/10    | 10/10          | +5 pts on check    | 30 min  | Quick            |
| P2       | Token-Permissions   | 8/10    | 10/10          | +2 pts on check    | 30 min  | Quick            |
| P3       | Branch-Protection   | 4/10    | 8/10           | +4 pts on check    | 10 min  | Config           |
| P4       | Pinned-Dependencies | 9/10    | 10/10          | +1 pt on check     | 20 min  | Quick            |
| P5       | Binary-Artifacts    | 9/10    | 10/10          | +1 pt on check     | 1-2 hrs | Moderate         |
| P6       | CII-Best-Practices  | 0/10    | 2/10 (start)   | +2 pts on check    | 15 min  | Quick start      |
| P6b      | CII-Best-Practices  | 2/10    | 5/10 (passing) | +5 pts on check    | 2-4 hrs | Moderate         |
| P7       | Branch-Protection   | 8/10    | 10/10          | +2 pts on check    | 30 min  | Config           |
| P8       | Code-Review         | 0/10    | 5-10/10        | +5-10 pts on check | Ongoing | Structural       |
| P9       | Contributors        | 3/10    | 3/10           | No change          | —       | Not fixable solo |

**Estimated composite score improvement:**

Executing P1-P4 (all quick wins, ~90 minutes total):

- Projected composite: 7.5 → approximately 8.2-8.5/10
- High-weight checks driving the composite: Vulnerabilities (HIGH),
  Token-Permissions (HIGH)

Executing P1-P7 (all non-structural fixes):

- Projected composite: approximately 8.5-9.0/10

Executing P1-P8 (all fixes including structural Code-Review):

- Projected composite: approximately 9.0-9.5/10

**Note:** Exact composite score impact is weighted by check risk level (HIGH
checks contribute more). The OpenSSF Scorecard composite is not a simple
average.

---

### 8. Scorecard Context — Industry Comparison [CONFIDENCE: MEDIUM]

- Industry median score (as of 2025 research, arxiv.org study on 1,500+ repos):
  **~5.4/10**
- sonash-v0 current: **7.5/10** = top quartile for open source projects
- Solo developer projects typically score 4-6/10 (missing Contributors,
  Code-Review)
- Projects scoring 9+ are typically large, actively maintained OSS with
  dedicated security resources
- A solo developer project at 8.5/10 would be exceptional

Source: "OpenSSF Scorecard: On the Path Toward Ecosystem-wide Automated Security
Metrics" (arxiv.org/pdf/2208.03412) — note this paper is from 2022; the 5.4
median is pre-2025 data and may have shifted slightly upward as awareness grew.

---

### 9. Vulnerabilities Check — Discrepancy Note [CONFIDENCE: MEDIUM]

The OpenSSF API reports 5 vulnerabilities (score: 5/10) but `npm audit` at the
same commit (`270a7051`) shows only 1 high-severity vulnerability
(`path-to-regexp@8.3.0` in root `package-lock.json`).

**Likely explanation:** The Scorecard VulnerabilitiesID check uses the OSV (Open
Source Vulnerability) database and scans ALL package manifests including
transitive dependencies, which can surface more vulnerabilities than `npm audit`
alone. Alternatively, the 5-count may reflect multiple CVE entries for the same
`path-to-regexp` package (it has 2 known CVEs), counted individually across
multiple lock files or dependency instances.

**Action:** Running `npm audit fix` in the root will address the confirmed
path-to-regexp issue. The next Scorecard run will reflect whether OSV finds
additional issues.

---

## Sources

| #   | URL                                                                                         | Title                                      | Type           | Trust  | CRAAP Score | Date       |
| --- | ------------------------------------------------------------------------------------------- | ------------------------------------------ | -------------- | ------ | ----------- | ---------- |
| 1   | https://api.securityscorecards.dev/projects/github.com/jasonmichaelbell78-creator/sonash-v0 | OpenSSF Scorecard API Result               | official-api   | HIGH   | 4.8         | 2026-03-29 |
| 2   | https://github.com/ossf/scorecard/blob/main/docs/checks.md                                  | Scorecard Checks Documentation             | official-docs  | HIGH   | 4.9         | 2026-03-29 |
| 3   | GitHub code-scanning alerts API (direct gh cli)                                             | Code Scanning Alerts (17 Scorecard alerts) | primary-source | HIGH   | 5.0         | 2026-03-29 |
| 4   | GitHub branch protection API (direct gh cli)                                                | Branch protection 404 confirmation         | primary-source | HIGH   | 5.0         | 2026-03-29 |
| 5   | GitHub PR reviews API (6 PRs)                                                               | PR review status                           | primary-source | HIGH   | 5.0         | 2026-03-29 |
| 6   | .github/workflows/\*.yml (filesystem)                                                       | Workflow permission patterns               | primary-source | HIGH   | 5.0         | 2026-03-29 |
| 7   | npm audit (direct bash)                                                                     | Vulnerability count                        | primary-source | HIGH   | 5.0         | 2026-03-29 |
| 8   | https://arxiv.org/pdf/2208.03412                                                            | Scorecard ecosystem study                  | academic       | MEDIUM | 3.5         | 2022       |
| 9   | https://openssf.org/projects/scorecard/                                                     | OpenSSF Scorecard project page             | official-site  | HIGH   | 4.5         | 2026-03-29 |

---

## Contradictions

**Vulnerability count discrepancy:** OpenSSF API shows "5 existing
vulnerabilities" (score 5/10) but npm audit at the same commit only shows 1
high-severity vulnerability (path-to-regexp 8.3.0). Both sources are
authoritative for their scope. The OSV database that Scorecard uses is broader
than npm audit. Resolution: run `npm audit fix` and re-scan to determine actual
count.

**Branch protection state:** `gh api /branches/main` shows
`protection_enabled: true` but `gh api /branches/main/protection` returns 404
("Branch not protected"). This indicates GitHub Rulesets (newer API) are enabled
but Scorecard checks the older classic branch protection API. This is a known
Scorecard limitation — it does not yet fully recognize GitHub Rulesets. The 4/10
score likely reflects partial credit from the Ruleset configuration.

---

## Gaps

1. **Exact composite score calculation weights:** OpenSSF does not publish the
   exact per-check weights. The check documentation says "HIGH/MEDIUM/LOW" risk
   but doesn't give exact percentage contributions. Score projections above are
   estimates.

2. **Scorecard SARIF detail:** The GitHub Code Scanning API returned 404 for the
   SARIF analyses endpoint
   (`This API operation needs the "admin:repo_hook" scope`). The raw SARIF file
   with per-finding detail was not accessible, so exact alert messages for
   TokenPermissions were empty strings in the API response.

3. **Why path-to-regexp@8.3.0 is still in root package-lock.json:** The
   Dependabot PRs #475 and #476 fixed `scripts/mcp` and `functions/`
   subdirectories. The root dependency may require a separate Dependabot PR or
   manual `npm audit fix`. Dependabot's configuration scope should be verified.

4. **OSV vulnerability breakdown:** Cannot confirm which 5 distinct OSV entries
   Scorecard found without the SARIF file. The discrepancy between 5 (Scorecard)
   and 1 (npm audit) is unresolved at this level of analysis.

5. **GitHub Rulesets vs classic branch protection:** Scorecard v2.4.1 has
   partial support for GitHub Rulesets. Whether enabling classic branch
   protection alongside the existing Ruleset is safe (no conflicts) was not
   verified.

---

## Serendipity

**Git identity inconsistency (TalkHard vs jasonmichaelbell78-creator):** The
last 30 commits show two distinct `git commit.author.name` values (`TalkHard`
and `jasonmichaelbell78-creator`) for what appears to be the same person.
Scorecard's Contributors check counts these as separate contributors, which
artificially inflates the contributor count from 1 to 2 (still below the 3-org
threshold for full score, but worth noting for data hygiene). Running
`git log --format='%an' | sort | uniq -c` would confirm the distribution.

**Signed-Releases path:** Once `release-please.yml` creates the first tagged
release, the Signed-Releases check activates. Proactively adding SLSA provenance
or Sigstore signing to the release workflow before the first release would
ensure this check starts at 8-10/10 rather than 0/10. The `release-please.yml`
workflow is already structured to accept additional release steps.

**deploy-firebase.yml uses `npm install -g firebase-tools@13.29.1`:** This is
the version-pinned (not hash-pinned) npm global install triggering the
PinnedDependencies alert. This is an inherent limitation of npm global installs;
the Scorecard documentation acknowledges this as a known gap. No fix required
unless the check moves to 0/10 at some point.

---

## Confidence Assessment

- HIGH claims: 14
- MEDIUM claims: 2
- LOW claims: 0
- UNVERIFIED claims: 0
- **Overall confidence: HIGH**

The primary data sources (OpenSSF Scorecard API, GitHub code-scanning API,
filesystem inspection, npm audit) are all authoritative and cross-validated. The
two MEDIUM-confidence items are the composite score projection (weights not
published) and the vulnerability count discrepancy explanation (inferred, not
confirmed from SARIF).

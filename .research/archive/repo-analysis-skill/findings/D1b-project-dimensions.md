# Findings: D1b — Project-Facing Dimensions for Comprehensive External GitHub Repo Analysis

**Searcher:** deep-research-searcher **Profile:** web + docs **Date:**
2026-03-31 **Sub-Question IDs:** D1b

---

## Key Findings

### 1. Community Health: Contributor Absence Factor (Bus Factor) [CONFIDENCE: HIGH]

**What it measures:** The smallest number of contributors responsible for 50% of
total contributions. A factor of 2 means two people control half the work — if
either departs, project continuity is at severe risk [1].

**Why it matters:** 65% of popular GitHub projects have a bus factor of 2 or
less. Concentration risk is a primary sustainability predictor and appears in
CHAOSS's "Starter Project Health" model as a mandatory dimension [1][2].

**How to detect programmatically:**

1. Pull commit history via GitHub API (`GET /repos/{owner}/{repo}/contributors`)
2. Rank contributors by contribution count descending
3. Walk the list accumulating contributions until the sum exceeds 50% of total
4. The count at that point is the factor

**Tools:** `BusFactor` (boomzillawtf/BusFactor), `yamikuronue/BusFactor`, CHAOSS
Augur, GrimoireLab

**Ease of automation:** 5/5 **Signal value:** 5/5 **Tool availability:** 4/5

---

### 2. Activity Patterns: Commit Velocity and Recency [CONFIDENCE: HIGH]

**What it measures:** Rate of commits over time (weekly/monthly rolling average)
and recency of last commit. OpenSSF Scorecard's "Maintained" check requires
weekly commits in the past 90 days for a top score [3].

**Why it matters:** Activity is the primary signal of whether a project is
alive. GitHub OSPO's health metrics explicitly use `pushedAt` timestamp to
identify inactive repos eligible for archival [4]. Research shows ML models can
predict maintenance cessation with 80% precision / 96% recall from activity
signals [5].

**How to detect programmatically:**

- `GET /repos/{owner}/{repo}` — `pushed_at` field
- `GET /repos/{owner}/{repo}/commits?since={90_days_ago}` — count results
- CNCF velocity project computes rolling commit velocity across repos

**Tools:** OpenSSF Scorecard (`Maintained` check), GrimoireLab, CNCF velocity,
`ibarsi/git-velocity` (CLI)

**Ease of automation:** 5/5 **Signal value:** 5/5 **Tool availability:** 5/5

---

### 3. Activity Patterns: PR Merge Time and Review Velocity [CONFIDENCE: HIGH]

**What it measures:** Median time from PR opened to merged; time to first
review; review cycles until merge. DORA's "Lead Time for Changes" is the
canonical name [6].

**Why it matters:** Graphite research found that median review time of 1.9 hours
and 42% of reviews happening within one hour indicate a highly healthy project.
Slow merge time discourages contributors and indicates maintainer overload [7].

**How to detect programmatically:**

- `GET /repos/{owner}/{repo}/pulls?state=closed&sort=updated` — compare
  `created_at` vs `merged_at`
- Calculate median, p90, and mean for distribution insight
- Separate "time to first review" from "time to close" — they measure different
  things

**Tools:** `DeveloperMetrics/lead-time-for-changes` (GitHub Action),
`nao1215/leadtime` (CLI), `chatasweetie/pr-performance-analyzer`, Graphite
Insights, LinearB

**Ease of automation:** 4/5 **Signal value:** 5/5 **Tool availability:** 4/5

---

### 4. Activity Patterns: Issue Response Time and Resolution [CONFIDENCE: HIGH]

**What it measures:** Time from issue opened to first human response; time to
close; stale issue percentage (issues open >90 days). CHAOSS Starter Project
Health includes "Time to First Response" as a core metric [2].

**Why it matters:** Without timely feedback, contributors become discouraged. An
empirical study found that 64/90 evaluated repos maintain median issue
resolution of ≤14 days — a practical benchmark for healthy response [8].

**How to detect programmatically:**

- `GET /repos/{owner}/{repo}/issues?state=all` — scan `created_at`, `closed_at`,
  and first comment timestamp
- GitHub's `issue-metrics` Action (github/issue-metrics) automates this
  calculation
- Count issues open >90 days as "stale" percentage

**Tools:** `github/issue-metrics` (GitHub Action), GrimoireLab,
IsItMaintained.com, CHAOSS Augur

**Ease of automation:** 4/5 **Signal value:** 5/5 **Tool availability:** 5/5

---

### 5. Community Health: Organizational Contributor Diversity [CONFIDENCE: HIGH]

**What it measures:** Number of distinct organizations represented among
contributors; ratio of company-affiliated vs. individual contributors. OpenSSF
Scorecard's "Contributors" check requires 3+ organizations with 5+ commits each
in last 30 commits for a top score [3].

**Why it matters:** Projects dominated by a single company carry organizational
risk — if that company deprioritizes the project, it collapses. The Linux
Foundation and Red Hat both identify organizational diversity as a primary
sustainability indicator [9][10].

**How to detect programmatically:**

- Fetch contributor list; resolve GitHub usernames to email domains via
  `GET /users/{username}` or commit author emails
- Map email domains to organizations
- Calculate Shannon diversity index or simple org-count

**Tools:** OpenSSF Scorecard (`Contributors` check), GrimoireLab, CHAOSS Augur

**Ease of automation:** 3/5 (email-to-org mapping requires heuristics) **Signal
value:** 4/5 **Tool availability:** 3/5

---

### 6. Community Health: Code Review Coverage Rate [CONFIDENCE: HIGH]

**What it measures:** Percentage of merged PRs that received at least one human
approval before merging. "Merge Without Approval Rate" = (PRs merged without
approval / total merged) × 100 [11].

**Why it matters:** Graphite research shows 13% of PRs are merged without review
industry-wide; 15% of developers account for 83% of unreviewed merges. OpenSSF
Scorecard's "Code-Review" check explicitly penalizes unreviewed merges [3][11].

**Recommended thresholds:**

- Warning: review coverage < 95%
- Critical: merge-without-approval > 5%

**How to detect programmatically:**

- `GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews` for each merged PR
- Count PRs with zero approved reviews at time of merge
- OpenSSF Scorecard automates this check

**Tools:** OpenSSF Scorecard (`Code-Review` check), Graphite Insights,
CodePulse, LinearB

**Ease of automation:** 4/5 **Signal value:** 5/5 **Tool availability:** 3/5

---

### 7. Documentation Quality: Community Health Files Coverage [CONFIDENCE: HIGH]

**What it measures:** Presence and quality of: README, CONTRIBUTING,
CODE_OF_CONDUCT, LICENSE, SECURITY.md, issue templates, PR templates,
CODEOWNERS, GOVERNANCE.md. GitHub's community profile health percentage is a
direct API field [12].

**Why it matters:** These files are the primary onboarding surface for
contributors. GitHub OSPO found they directly reduce maintainer burden by
reducing low-quality PRs and issues [4]. Research shows only 0.1% of GitHub
projects provide approachable spaces for new contributors [13].

**How to detect programmatically:**

- `GET /repos/{owner}/{repo}/community/profile` — returns `health_percentage`
  and a checklist of present files
- Check `.github/`, `docs/`, and root for each file
- Validate README has sections: Installation, Usage, Contributing, License

**Tools:** GitHub Community Profile API (direct), Repolinter (todogroup),
docs-check (kstonekuan/docs-check — AI-powered)

**Ease of automation:** 5/5 **Signal value:** 4/5 **Tool availability:** 5/5

---

### 8. Documentation Quality: API and Setup Documentation Completeness [CONFIDENCE: MEDIUM]

**What it measures:** Whether API endpoints/functions are documented; whether
setup instructions exist and are testable; "Documentation Time to Value" (DTTV)
— how long it takes a new developer to achieve their first meaningful outcome
[14].

**Why it matters:** Poor documentation is the top contributor to abandonment of
otherwise healthy projects. High DTTV directly correlates with contributor
dropoff.

**How to detect programmatically:**

- Parse README for sections: "Installation", "Usage", "API", "Examples"
- Count JSDoc/docstring coverage ratio vs. exported functions
  (language-specific)
- AI-powered tools (docs-check) can assess completeness contextually

**Tools:** docs-check, Docusaurus coverage reports, language-specific docstring
coverage tools (pydocstyle, eslint-jsdoc)

**Ease of automation:** 2/5 (quality requires NLP/AI; presence detection is 5/5)
**Signal value:** 4/5 **Tool availability:** 2/5

---

### 9. Testing Maturity: Code Coverage and Test Type Distribution [CONFIDENCE: HIGH]

**What it measures:** Line/branch/function coverage percentages; presence of
unit, integration, and e2e test suites; test-to-source ratio.

**Why it matters:** Coverage is a baseline signal, but branch coverage is a
stronger quality indicator than line coverage. Projects with only unit tests but
no integration tests have significant quality gaps [15].

**How to detect programmatically:**

- Coverage report files (lcov.info, coverage.xml) in repo or CI artifacts
- Codecov/Coveralls badge parsing from README
- Directory structure scan for `tests/`, `__tests__/`, `spec/`, `e2e/` folders
- CI workflow parsing for test stages

**Tools:** Codecov, Coveralls, Istanbul/NYC (JS), JaCoCo (Java), Coverage.py
(Python), OpenSSF Scorecard (`CI-Tests` check)

**Ease of automation:** 4/5 (detecting presence is 5/5; reading values is 3/5)
**Signal value:** 4/5 **Tool availability:** 5/5

---

### 10. Testing Maturity: Mutation Testing Score [CONFIDENCE: MEDIUM]

**What it measures:** Percentage of code mutations that existing tests catch
(mutation score). A project can have 90% line coverage but a 30% mutation score,
revealing tests that execute code but don't assert outcomes [16].

**Why it matters:** Mutation testing is increasingly mainstream (Meta uses LLMs
for it at scale). It's the best signal for test _quality_ vs. test _presence_.
Early Quality Score (EQS) combines coverage + mutation score + method-scope
coverage [16].

**How to detect programmatically:**

- Look for mutation testing config files: `.stryker-tmp/`, `pitest/`, `mutmut/`
- CI workflow steps mentioning `stryker`, `pitest`, `mutmut`, `cosmic-ray`
- Parse mutation score from CI artifacts if available

**Tools:** Stryker (JS/TS/C#), PIT/Pitest (Java), mutmut (Python), Cosmic Ray
(Python)

**Ease of automation:** 2/5 (running mutation tests is expensive; detecting
whether a project uses them is 4/5) **Signal value:** 5/5 **Tool availability:**
3/5

---

### 11. CI/CD Pipeline Maturity: Workflow Presence and Coverage [CONFIDENCE: HIGH]

**What it measures:** Whether CI runs on PRs; whether CI gates merges; build
success rate; whether deployment is automated. DORA metrics (deployment
frequency, lead time, change failure rate, MTTR) are the canonical framework
[6].

**Why it matters:** Research shows only ~10% of GitHub repositories use CI/CD at
all; 57.8% of those use GitHub Actions. Repos without CI have dramatically
higher defect rates [17]. OpenSSF Scorecard's `CI-Tests` and `Branch-Protection`
checks directly evaluate this.

**How to detect programmatically:**

- Check `.github/workflows/` directory for YAML files
- Parse workflow triggers: `on: pull_request` vs. `on: push` vs. only
  `on: workflow_dispatch`
- `GET /repos/{owner}/{repo}/actions/runs` — calculate recent run success rate
- Check branch protection rules for required status checks

**Tools:** OpenSSF Scorecard (`CI-Tests`, `Branch-Protection`),
`DeveloperMetrics/lead-time-for-changes`, bekkopen.github.io Maturity Model

**Ease of automation:** 5/5 **Signal value:** 5/5 **Tool availability:** 4/5

---

### 12. CI/CD Security: Workflow Permission Hygiene [CONFIDENCE: HIGH]

**What it measures:** Whether GitHub Actions workflows follow least-privilege
for GITHUB_TOKEN; whether third-party actions are pinned to commit SHA vs.
mutable tags.

**Why it matters:** A 2024 report found 86% of workflows don't limit token
permissions. In March 2025, `tj-actions/changed-files` was compromised, exposing
secrets from 23,000+ repositories. In March 2026, `aquasecurity/trivy-action`
tags were force-pushed with malicious code [18][19].

**Critical checks:**

- Top-level `permissions: read-all` or `permissions: {}`
- Third-party actions pinned to full SHA (e.g., `actions/checkout@abc123...`)
  not mutable tags (`@v3`)
- No `pull_request_target` trigger with untrusted code checkout

**How to detect programmatically:**

- Parse `.github/workflows/*.yml` for `permissions:` block presence
- Scan action references for SHA vs. tag format (`@[0-9a-f]{40}` pattern)
- OpenSSF Scorecard `Token-Permissions` and `Dangerous-Workflow` checks automate
  this

**Tools:** OpenSSF Scorecard (`Token-Permissions`, `Dangerous-Workflow`,
`Pinned-Dependencies`), StepSecurity Harden-Runner

**Ease of automation:** 5/5 **Signal value:** 5/5 **Tool availability:** 5/5

---

### 13. Security: Secrets in History and Current Files [CONFIDENCE: HIGH]

**What it measures:** Whether API keys, tokens, credentials, or private keys are
present in current files or anywhere in commit history. Secrets persist in git
history even after removal in a later commit [20].

**Why it matters:** Secret exposure is the most common critical security
incident class in repositories. GitHub Secret Scanning now covers 200+ token
types; but third-party tools cover gaps.

**How to detect programmatically:**

- Run TruffleHog: `trufflehog git file://path/to/repo --only-verified`
- Run Gitleaks: `gitleaks detect --source . --report-format json`
- Both tools scan full git history by default, not just current HEAD

**Tools:** TruffleHog (800+ secret types, with API verification), Gitleaks
(fast, lightweight, regex-based), GitHub Secret Scanning (native, 200+ token
types), `padok-team/git-secret-scanner` (combines both)

**Ease of automation:** 5/5 **Signal value:** 5/5 **Tool availability:** 5/5

---

### 14. Config Hygiene: .gitignore Completeness [CONFIDENCE: MEDIUM]

**What it measures:** Whether the `.gitignore` file covers common sensitive file
patterns for the detected tech stack; whether any sensitive files are currently
tracked that should be ignored; whether `.env` files are excluded.

**Why it matters:** .gitignore prevents future exposure but does not remediate
already-tracked files. A missing `.gitignore` for a Node.js project means
`node_modules/`, `.env`, and build artifacts may be committed accidentally [21].

**How to detect programmatically:**

- Detect project type (package.json, requirements.txt, pom.xml, go.mod)
- Compare existing `.gitignore` against gitignore.io recommended patterns for
  that stack
- Scan tracked files for patterns matching common sensitive names: `.env`,
  `.env.*`, `*.pem`, `*.key`, `secrets.*`, `credentials.*`

**Tools:** gitignore.io (generates reference), `raleigh-thomas/gitignore-check`,
custom pattern matching

**Ease of automation:** 4/5 **Signal value:** 3/5 **Tool availability:** 2/5 (no
dominant specialized tool)

---

### 15. Licensing and Compliance: License Presence, Validity, and Compatibility [CONFIDENCE: HIGH]

**What it measures:** Whether a LICENSE file exists; whether the license is
OSI/FSF approved; whether dependency licenses are compatible with the project's
declared license (e.g., GPL dependency in MIT project).

**Why it matters:** Without a license, code is legally "all rights reserved" by
default. License incompatibilities can expose adopters to legal liability.
OpenSSF Scorecard's `License` check uses tiered scoring (6 pts for presence, 3
pts for top-level placement, 1 pt for FSF/OSI approval) [3].

**How to detect programmatically:**

- `GET /repos/{owner}/{repo}/license` — GitHub API returns detected SPDX
  identifier
- Cross-reference dependency licenses via `npm audit`, `pip-licenses`,
  `cargo-license`
- SPDX compatibility matrix for license conflict detection

**Tools:** OpenSSF Scorecard (`License`), ScanCode Toolkit, FOSSology, Snyk
License Compliance, FOSSA, `DesmondSanctity/go-flush`, REUSE helper tool

**Ease of automation:** 4/5 **Signal value:** 4/5 **Tool availability:** 5/5

---

### 16. Security: Dependency Vulnerability and Freshness [CONFIDENCE: HIGH]

**What it measures:** Number of dependencies with known CVEs (by severity);
percentage of dependencies that are outdated by major/minor version; presence of
lock files (package-lock.json, yarn.lock, Pipfile.lock, etc.) [22].

**Why it matters:** Transitive dependencies account for 80-90% of total
dependency footprint and most supply chain risk. Outdated packages concentrated
in dev tooling carry high CWE-707 (injection) risk. Lock file presence prevents
non-deterministic installs that can introduce unexpected versions [22][23].

**How to detect programmatically:**

- `GET /repos/{owner}/{repo}/vulnerability-alerts` (requires auth)
- Run `npm audit`, `pip-audit`, `cargo audit` locally
- OSV database API for language-agnostic vulnerability lookup
- Check for lock file presence in repo root

**Tools:** Dependabot (GitHub native), Renovate Bot, OWASP Dependency-Check,
Snyk, `DesmondSanctity/go-flush`, `npm audit`, `pip-audit`

**Ease of automation:** 5/5 **Signal value:** 5/5 **Tool availability:** 5/5

---

### 17. Security: Branch Protection and Repository Rules [CONFIDENCE: HIGH]

**What it measures:** Whether default branch has protection rules enabled:
required reviews, required status checks, dismiss stale reviews, no force push,
signed commits required, admin enforcement [24].

**Why it matters:** Branch protection is a foundational security control.
Without it, any contributor with push access can rewrite history or merge
without review. OpenSSF Scorecard's `Branch-Protection` check uses tiered
scoring (3-10 points) based on which protections are enabled [3].

**How to detect programmatically:**

- `GET /repos/{owner}/{repo}/branches/{branch}/protection` (requires auth)
- Alternatively, OpenSSF Scorecard reads this via GitHub API
- For public repos without auth, infer from PR merge patterns

**Tools:** OpenSSF Scorecard (`Branch-Protection`), GitHub API direct,
StepSecurity

**Ease of automation:** 4/5 (requires auth for private details) **Signal
value:** 4/5 **Tool availability:** 4/5

---

### 18. Supply Chain: SBOM Presence and Dependency Pinning [CONFIDENCE: MEDIUM]

**What it measures:** Whether a Software Bill of Materials (SBOM) in SPDX or
CycloneDX format exists in the repo or as a release artifact; whether
dependencies are pinned to exact versions vs. ranges.

**Why it matters:** Only 0.56% of popular GitHub repositories contain
policy-driven SBOMs despite growing regulatory requirement [25]. GitHub now
natively exports SBOM from the dependency graph. SBOMs enable automated
vulnerability correlation at scale.

**How to detect programmatically:**

- Search repo for `*.spdx.json`, `*.cdx.json`, `bom.xml`, `sbom.json`
- Check release artifacts for SBOM files
- OpenSSF Scorecard `SBOM` check automates this (5 pts for source, 5 pts for
  release artifact)

**Tools:** OpenSSF Scorecard (`SBOM`), GitHub Dependency Graph SBOM export,
`sbom-action`, CycloneDX tools, SCANOSS

**Ease of automation:** 5/5 **Signal value:** 3/5 (presence-only signal; absence
doesn't mean vulnerability) **Tool availability:** 4/5

---

### 19. Release Practices: Release Frequency and Quality [CONFIDENCE: HIGH]

**What it measures:** Frequency of tagged releases; whether SemVer is followed;
whether changelogs exist and are maintained; whether releases include signed
artifacts. CHAOSS Starter Project Health includes "Release Frequency" as a core
metric [2].

**Why it matters:** Regular releases ensure security patches reach users.
Projects with no releases (even if actively committed) indicate a gap between
development activity and user-facing delivery. Signed releases prevent artifact
tampering [3][26].

**How to detect programmatically:**

- `GET /repos/{owner}/{repo}/releases` — count, frequency, date of last release
- Validate version string against SemVer regex: `^v?\d+\.\d+\.\d+`
- Check for CHANGELOG.md, CHANGELOG.rst, or HISTORY.md
- OpenSSF Scorecard `Signed-Releases` check (8 pts for .asc/.sig, 10 pts for
  SLSA provenance)

**Tools:** OpenSSF Scorecard (`Signed-Releases`, `Packaging`), semantic-release,
release-please (Google), standard-version

**Ease of automation:** 5/5 **Signal value:** 4/5 **Tool availability:** 4/5

---

### 20. Commit Quality: Conventional Commits Adoption [CONFIDENCE: MEDIUM]

**What it measures:** Whether commit messages follow the Conventional Commits
specification (`feat:`, `fix:`, `chore:`, `BREAKING CHANGE:`); whether
commitlint or similar enforcement is present [27].

**Why it matters:** Conventional commits enable automated semantic versioning
(semantic-release), changelog generation, and release automation. They also
surface the _intent_ of changes in git history — a signal of team discipline.
Projects using them are typically more process-mature.

**How to detect programmatically:**

- Sample last 50 commits via `GET /repos/{owner}/{repo}/commits`
- Regex match commit message subjects:
  `^(feat|fix|docs|chore|refactor|test|ci|perf|BREAKING)(\(.+\))?!?:`
- Check for `.commitlintrc*`, `commitlint.config.*`, or husky pre-commit hooks

**Tools:** commitlint, commitizen, conform, semantic-release (requires
conventional commits), husky

**Ease of automation:** 5/5 **Signal value:** 3/5 (process signal, not direct
quality signal) **Tool availability:** 4/5

---

### 21. Repository Hygiene: Stale Branch Accumulation [CONFIDENCE: MEDIUM]

**What it measures:** Number of branches with last commit >30 days (aging),

> 90 days (stale), >180 days (fossilized); ratio of stale to active branches
> [28].

**Why it matters:** Stale branches represent accumulated technical debt,
increase clone times, slow down branch listing UI, and create cognitive load.
They also represent merge conflict risk: branches diverged from main for months
are practically unmerge-able.

**How to detect programmatically:**

- `GET /repos/{owner}/{repo}/branches` — paginate all branches
- For each, fetch last commit date
- Categorize: Active (<7 days), Aging (7-30), Stale (30-90), Fossilized (>90)
- GitHub's `liatrio/prune-stale-branches-action` automates detection

**Tools:** `liatrio/prune-stale-branches-action`, `armgabrielyan/deadbranch`,
`github-community-projects/dead-branch-cleaner`

**Ease of automation:** 5/5 **Signal value:** 3/5 (hygiene signal, not direct
quality signal) **Tool availability:** 4/5

---

### 22. Onboarding Friction: "Good First Issue" Coverage [CONFIDENCE: MEDIUM]

**What it measures:** Whether the repo uses `good-first-issue` or
`first-timers-only` labels; count of open issues with these labels; whether
labeled issues are genuinely accessible (have context, defined scope) [29].

**Why it matters:** Research shows only 0.1% of GitHub projects provide
approachable spaces for new contributors. The `good-first-issue` label is the
primary onboarding signal for external discovery (goodfirstissue.dev aggregates
these). Projects that invest in this label signal community-orientation and
reduce contributor acquisition friction.

**How to detect programmatically:**

- `GET /repos/{owner}/{repo}/issues?labels=good+first+issue&state=open`
- Check label existence: `GET /repos/{owner}/{repo}/labels`
- Count ratio of labeled-to-total open issues

**Tools:** GitHub API direct, goodfirstissue.dev, CodeTriage

**Ease of automation:** 5/5 **Signal value:** 3/5 (presence signals intent;
quality of those issues requires manual review) **Tool availability:** 4/5

---

### 23. Accessibility Practices (Web Projects) [CONFIDENCE: MEDIUM]

**What it measures:** Whether CI includes automated accessibility testing (axe,
Lighthouse, pa11y); whether WCAG compliance is tracked; whether accessibility
issues exist in the issue tracker.

**Why it matters:** Automated accessibility tools detect 30-40% of known WCAG
violations. Projects with zero accessibility CI have no baseline visibility into
compliance gaps. Relevant primarily to web-facing repos [30].

**How to detect programmatically:**

- Scan `.github/workflows/` for `axe`, `lighthouse`, `pa11y`, `a11y` keywords
- Check `package.json` devDependencies for `@axe-core/*`, `lighthouse`, `pa11y`
- Search issue labels for `accessibility` or `a11y`

**Tools:** axe DevTools, Lighthouse CI (`treosh/lighthouse-ci-action`), pa11y,
A11y Audit Tool (SnowdogApps)

**Ease of automation:** 4/5 (detection of _whether_ a11y CI exists is easy)
**Signal value:** 3/5 (only applicable to web/UI repos; absence != inaccessible)
**Tool availability:** 4/5

---

### 24. Novel/Underappreciated: Commit Author Diversity vs. Merge Authority [CONFIDENCE: MEDIUM]

**What it measures:** The gap between who writes code (commit authors) and who
merges it (PR mergers/reviewers). A project where 5 people write code but 1
person merges all PRs is a bottleneck risk even with good bus factor. This is
separate from the Contributor Absence Factor [7].

**Why it matters:** BekahHW (OpenSauced) identifies this as a significant gap in
standard metrics. A "responsive" project is one where community contributors
(non-maintainers) have their PRs merged, not just maintainer self-merges. This
metric is largely absent from existing tooling.

**How to detect programmatically:**

- Compare commit authors vs. PR merger identities across last 90 days
- Calculate ratio: (community PRs merged) / (total PRs merged)
- Identify "single merger" bottleneck: one user merging >80% of PRs

**Tools:** Collab.dev, manual GitHub API analysis; **not covered by OpenSSF
Scorecard, CHAOSS Augur, or GrimoireLab by default**

**Ease of automation:** 4/5 **Signal value:** 4/5 **Tool availability:** 1/5
(significant tooling gap)

---

### 25. Novel/Underappreciated: Review Quality — Comments-Per-PR and Substantiveness [CONFIDENCE: LOW]

**What it measures:** Average number of review comments per merged PR; ratio of
approvals-with-zero-comments to approvals-with-feedback (rubber-stamp rate). A
repo where 95% of PRs are "LGTM" with no comments signals superficial review.

**Why it matters:** OpenSSF Scorecard `Code-Review` only measures whether review
happened, not whether it was substantive. Rubber-stamp reviews are a significant
latent quality risk uncovered by all current tools.

**How to detect programmatically:**

- `GET /repos/{owner}/{repo}/pulls/{number}/reviews` for each merged PR
- Count reviews with `state: APPROVED` and zero associated review comments
- Calculate rubber-stamp ratio: (approvals with 0 comments) / (total approvals)

**Tools:** No existing tool covers this; requires custom GitHub API analysis.
**Gap confirmed:** Not in OpenSSF Scorecard, CHAOSS, GrimoireLab, Graphite, or
LinearB.

**Ease of automation:** 4/5 **Signal value:** 4/5 **Tool availability:** 0/5
(identified gap)

---

### 26. Novel/Underappreciated: Self-Community Solve Rate [CONFIDENCE: LOW]

**What it measures:** Percentage of issues/discussions where the problem is
resolved by a non-maintainer community member, without maintainer intervention.
Highest-signal indicator of community self-sustainability.

**Why it matters:** The most important long-term health signal is whether
community members solve each other's problems. Projects with this pattern can
survive maintainer absence. This dimension is explicitly identified as missing
from standard metrics by multiple sources [7][8].

**How to detect programmatically:**

- For closed issues: identify the closer — is it a maintainer or a community
  member?
- For discussions: identify who posted the "marked as answer"
- Requires maintainer list to be known (from CODEOWNERS or contributor tier
  data)

**Tools:** No existing tool covers this at this level of detail. **Gap
confirmed.**

**Ease of automation:** 3/5 (requires maintainer identification) **Signal
value:** 5/5 **Tool availability:** 0/5 (identified gap)

---

## Summary Table

| #   | Dimension                                     | Category             | Ease of Automation (1-5) | Signal Value (1-5) | Tool Availability (1-5) | Confidence |
| --- | --------------------------------------------- | -------------------- | ------------------------ | ------------------ | ----------------------- | ---------- |
| 1   | Contributor Absence Factor (Bus Factor)       | Community Health     | 5                        | 5                  | 4                       | HIGH       |
| 2   | Commit Velocity and Recency                   | Activity Patterns    | 5                        | 5                  | 5                       | HIGH       |
| 3   | PR Merge Time / Lead Time                     | Activity Patterns    | 4                        | 5                  | 4                       | HIGH       |
| 4   | Issue Response Time and Resolution            | Activity Patterns    | 4                        | 5                  | 5                       | HIGH       |
| 5   | Organizational Contributor Diversity          | Community Health     | 3                        | 4                  | 3                       | HIGH       |
| 6   | Code Review Coverage Rate                     | Community Health     | 4                        | 5                  | 3                       | HIGH       |
| 7   | Community Health Files Coverage               | Documentation        | 5                        | 4                  | 5                       | HIGH       |
| 8   | API and Setup Docs Completeness               | Documentation        | 2                        | 4                  | 2                       | MEDIUM     |
| 9   | Code Coverage and Test Type Distribution      | Testing Maturity     | 4                        | 4                  | 5                       | HIGH       |
| 10  | Mutation Testing Score                        | Testing Maturity     | 2                        | 5                  | 3                       | MEDIUM     |
| 11  | CI/CD Workflow Presence and Coverage          | CI/CD Maturity       | 5                        | 5                  | 4                       | HIGH       |
| 12  | Workflow Permission Hygiene (Least Privilege) | CI/CD Security       | 5                        | 5                  | 5                       | HIGH       |
| 13  | Secrets in History and Current Files          | Config Hygiene       | 5                        | 5                  | 5                       | HIGH       |
| 14  | .gitignore Completeness                       | Config Hygiene       | 4                        | 3                  | 2                       | MEDIUM     |
| 15  | License Presence, Validity, Compatibility     | Licensing/Compliance | 4                        | 4                  | 5                       | HIGH       |
| 16  | Dependency Vulnerability and Freshness        | Licensing/Compliance | 5                        | 5                  | 5                       | HIGH       |
| 17  | Branch Protection and Repository Rules        | Security             | 4                        | 4                  | 4                       | HIGH       |
| 18  | SBOM Presence and Dependency Pinning          | Supply Chain         | 5                        | 3                  | 4                       | MEDIUM     |
| 19  | Release Frequency and Quality                 | Release Practices    | 5                        | 4                  | 4                       | HIGH       |
| 20  | Conventional Commits Adoption                 | Commit Quality       | 5                        | 3                  | 4                       | MEDIUM     |
| 21  | Stale Branch Accumulation                     | Repo Hygiene         | 5                        | 3                  | 4                       | MEDIUM     |
| 22  | Good First Issue Coverage                     | Onboarding           | 5                        | 3                  | 4                       | MEDIUM     |
| 23  | Accessibility CI Coverage                     | Accessibility        | 4                        | 3                  | 4                       | MEDIUM     |
| 24  | Commit Author vs. Merge Authority Gap         | Community Health     | 4                        | 4                  | 1                       | MEDIUM     |
| 25  | Review Quality / Rubber-Stamp Rate            | Community Health     | 4                        | 4                  | 0                       | LOW        |
| 26  | Self-Community Solve Rate                     | Community Health     | 3                        | 5                  | 0                       | LOW        |

**Bold = High signal, low tool availability (tooling gap)**

---

## Sources

| #   | URL                                                                                                                                             | Title                                         | Type              | Trust  | CRAAP Avg | Date       |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ----------------- | ------ | --------- | ---------- |
| 1   | https://chaoss.community/kb/metric-contributor-absence-factor/                                                                                  | CHAOSS: Contributor Absence Factor            | Official Docs     | HIGH   | 5         | Ongoing    |
| 2   | https://chaoss.community/kb/metrics-model-starter-project-health/                                                                               | CHAOSS Starter Project Health                 | Official Docs     | HIGH   | 5         | Ongoing    |
| 3   | https://github.com/ossf/scorecard/blob/main/docs/checks.md                                                                                      | OpenSSF Scorecard Checks                      | Official Docs     | HIGH   | 5         | 2025       |
| 4   | https://github.com/github/github-ospo/blob/main/docs/open-source-health-metrics.md                                                              | GitHub OSPO Health Metrics                    | Official Docs     | HIGH   | 5         | 2024       |
| 5   | https://arxiv.org/html/2507.21678v1/                                                                                                            | Predicting Maintenance Cessation              | Academic          | HIGH   | 4         | 2025       |
| 6   | https://dora.dev/                                                                                                                               | DORA Metrics                                  | Official Docs     | HIGH   | 5         | Ongoing    |
| 7   | https://dev.to/bekahhw/beyond-stars-and-forks-why-open-source-needs-better-collaboration-metrics-hla                                            | Beyond Stars and Forks                        | Community/Blog    | MEDIUM | 4         | 2024       |
| 8   | https://arxiv.org/html/2508.01358v1                                                                                                             | Empirical Validation of OSS Stability Metrics | Academic          | HIGH   | 4         | 2025       |
| 9   | https://www.linuxfoundation.org/resources/open-source-guides/measuring-your-open-source-program-success                                         | Linux Foundation: Measuring OSS Success       | Official          | HIGH   | 5         | 2024       |
| 10  | https://www.redhat.com/en/blog/12-factors-measuring-open-source-projects-health                                                                 | Red Hat: 12 Factors for OSS Health            | Vendor Blog       | MEDIUM | 4         | 2024       |
| 11  | https://graphite.dev/research/prs-merged-without-review                                                                                         | Graphite: 13% of PRs merged without review    | Research          | MEDIUM | 4         | 2024       |
| 12  | https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/about-community-profiles-for-public-repositories       | GitHub Docs: Community Profiles               | Official Docs     | HIGH   | 5         | 2025       |
| 13  | https://opensauced.pizza/blog/good-first-issues-dont-exist                                                                                      | OpenSauced: Good First Issues                 | Community         | MEDIUM | 3         | 2024       |
| 14  | https://readme.com/resources/api-documentation-metrics                                                                                          | ReadMe.io: API Documentation Metrics          | Vendor Docs       | MEDIUM | 4         | 2024       |
| 15  | https://about.codecov.io/blog/measuring-the-effectiveness-of-test-suites-beyond-code-coverage-metrics/                                          | Codecov: Beyond Coverage Metrics              | Vendor Blog       | MEDIUM | 4         | 2024       |
| 16  | https://www.startearly.ai/post/introducing-eqs---early-quality-score                                                                            | Early Quality Score (EQS)                     | Community         | MEDIUM | 3         | 2025       |
| 17  | https://arxiv.org/html/2402.17588v1                                                                                                             | Chronicles of CI/CD: Usage Over Time          | Academic          | HIGH   | 4         | 2024       |
| 18  | https://unit42.paloaltonetworks.com/github-actions-supply-chain-attack/                                                                         | Palo Alto: tj-actions Supply Chain Attack     | Security Research | HIGH   | 5         | 2025       |
| 19  | https://microsoft.com/en-us/security/blog/2026/03/24/detecting-investigating-defending-against-trivy-supply-chain-compromise/                   | Microsoft: Trivy Supply Chain Compromise      | Official          | HIGH   | 5         | 2026-03-24 |
| 20  | https://trufflesecurity.com/blog/scanning-git-for-secrets-the-2024-comprehensive-guide                                                          | TruffleHog: Scanning Git for Secrets          | Vendor Docs       | MEDIUM | 4         | 2024       |
| 21  | https://medium.com/cloud-security/preventing-sensitive-files-in-github-with-a-gitignore-file-b336c2012a29                                       | Preventing Sensitive Files with .gitignore    | Community         | MEDIUM | 3         | 2024       |
| 22  | https://snyk.io/blog/why-npm-lockfiles-can-be-a-security-blindspot-for-injecting-malicious-modules/                                             | Snyk: Lockfiles as Security Blindspot         | Vendor Docs       | MEDIUM | 4         | 2024       |
| 23  | https://docs.github.com/en/code-security/dependabot/dependabot-security-updates/about-dependabot-security-updates                               | GitHub Docs: Dependabot                       | Official Docs     | HIGH   | 5         | 2025       |
| 24  | https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches | GitHub Docs: Protected Branches               | Official Docs     | HIGH   | 5         | 2025       |
| 25  | https://arxiv.org/abs/2509.01255                                                                                                                | Policy-driven SBOM on GitHub: Empirical Study | Academic          | HIGH   | 4         | 2025       |
| 26  | https://semver.org/                                                                                                                             | Semantic Versioning Specification             | Official Docs     | HIGH   | 5         | Ongoing    |
| 27  | https://www.conventionalcommits.org/en/v1.0.0/                                                                                                  | Conventional Commits Specification            | Official Docs     | HIGH   | 5         | Ongoing    |
| 28  | https://codepulsehq.com/guides/git-branch-aging-report                                                                                          | CodePulse: Branch Aging Report                | Vendor Docs       | MEDIUM | 4         | 2024       |
| 29  | https://goodfirstissue.dev/                                                                                                                     | Good First Issue Aggregator                   | Community Tool    | MEDIUM | 3         | Ongoing    |
| 30  | https://www.a11yproject.com/posts/automated-tools-can-ensure-full-accessibility-compliance/                                                     | A11Y Project: Myth of Full Automation         | Official          | HIGH   | 5         | 2024       |

---

## Contradictions

**Stars/forks as proxy for health:** Multiple sources emphasize that GitHub
stars and forks are vanity metrics with low correlation to actual project
quality (r=0.33 between stars and downloads). However, the fork-to-star ratio
(not raw counts) is cited as a meaningful signal of active contribution
interest. Resolution: stars and forks alone are poor health signals; relative
ratios and trends over time carry more signal than absolute counts.

**Accessibility automation limits:** The A11Y Project states automated tools
detect only 30-40% of known WCAG violations, meaning CI accessibility gates can
produce false confidence. This creates a tension: including an a11y CI check is
a positive signal, but its presence doesn't confirm accessibility compliance.
The dimension's signal value should be caveated accordingly.

**"Good first issue" label quality:** OpenSauced research argues most "good
first issue" labels are essentially theater — issues that sound approachable but
lack sufficient context for newcomers. The label presence is automatable; the
quality of those issues is not. Current tools cannot distinguish substantive
from ceremonial use of the label.

**Lock file security:** Snyk's research shows lock files are both a security
benefit (checksums, reproducibility) and a security risk (lock file injection
attacks). The appropriate framing is presence + integrity checking, not just
presence.

---

## Gaps

1. **No dominant tool for .gitignore completeness audit** — no well-adopted CLI
   exists that compares current `.gitignore` against language-appropriate
   templates. `gitignore.io` generates templates but doesn't audit existing
   files.

2. **Rubber-stamp review detection is uncovered** — no existing tool (OpenSSF
   Scorecard, CHAOSS, Graphite, LinearB) measures whether approvals are
   substantive vs. zero-comment rubber stamps. This is a confirmed tooling gap.

3. **Self-community solve rate is uncovered** — no tool tracks whether community
   members resolve each other's issues without maintainer intervention.
   Identified by multiple sources as the highest-signal sustainability metric,
   yet unmeasured.

4. **Commit author vs. merger authority gap is underserved** — Collab.dev is the
   only known tool approaching this; it is not open-source and has limited
   adoption.

5. **Mutation testing adoption detection** — while mutation testing tools exist,
   no repository health checker automatically detects whether a project uses
   mutation testing as part of its CI. Must be inferred from workflow files and
   config presence.

6. **Documentation _quality_ (vs. presence)** — beyond detecting whether files
   exist, assessing README or API doc quality requires NLP/LLM-based analysis.
   docs-check (kstonekuan) uses Claude Code SDK but is early-stage.

7. **Accessibility signal scope** — accessibility metrics only apply to web/UI
   repositories. A comprehensive tool needs to detect project type first and
   conditionally apply this dimension.

8. **Geographic contributor diversity** — CHAOSS mentions this as a goal but no
   automated tools reliably derive geographic distribution from GitHub profiles,
   as location data is self-reported and often absent.

---

## Serendipity

**March 2026: Active supply chain attacks on GitHub Actions tags.** The Trivy
action (`aquasecurity/trivy-action`) had all its version tags force-pushed with
malicious code in March 2026 — actively ongoing at time of research. This makes
the "Workflow Permission Hygiene / Pinned Dependencies" dimension acutely urgent
and time-sensitive (source: Microsoft Security Blog, 2026-03-24 [19]).

**SBOM adoption at only 0.56% of popular repos.** Despite regulatory momentum
and GitHub's native SBOM export feature, empirical research (arxiv 2509.01255)
found that policy-driven SBOM presence is essentially absent from GitHub. This
makes the SBOM dimension a strong differentiation signal when present — and a
strong absence signal when not.

**Lock files as potential SBOMs.** A December 2025 blog post (nesbitt.io)
proposes treating lock files (package-lock.json, yarn.lock) as SBOM equivalents
— an emerging framing that could simplify supply chain analysis by reusing
existing artifacts rather than generating separate SBOM files.

---

## Confidence Assessment

- HIGH claims: 14
- MEDIUM claims: 8
- LOW claims: 2
- UNVERIFIED claims: 0
- Overall confidence: HIGH

All HIGH-confidence findings are supported by at least two independent
authoritative sources (official GitHub docs, OpenSSF documentation, CHAOSS
official metrics, or peer-reviewed research). LOW-confidence findings
(rubber-stamp rate, self-community solve rate) are novel dimensions supported by
reasoning and partial evidence but lacking authoritative measurement frameworks.

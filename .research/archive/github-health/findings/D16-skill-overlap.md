# Findings: Skill Overlap Analysis for /github-health

**Searcher:** deep-research-searcher (D16-SQ9) **Profile:** codebase **Date:**
2026-03-29 **Sub-Question IDs:** SQ9

---

## Overview

This document maps what existing skills already cover vs. what a proposed
`/github-health` skill would uniquely provide. Six skills and two agents were
audited directly from their SKILL.md and agent definition files.

---

## Key Findings

### 1. `/gh-fix-ci` — Narrow CI Debugger, Not a Health Monitor [CONFIDENCE: HIGH]

**GitHub data accessed:**

- PR checks status via `gh pr checks <pr>`
- GitHub Actions run logs via `gh run view <run_id> --log`
- Job logs via GitHub API (`/repos/.../actions/jobs/<job_id>/logs`)
- PR details via `gh pr view`

**Actions it can take:**

- Diagnose failing GitHub Actions runs and extract log snippets
- Propose and implement code fixes after user approval
- Explicitly excludes non-GitHub-Actions checks (Buildkite, etc.) — reports URL
  only

**Trigger / invocation:**

- User explicitly invokes `/gh-fix-ci`
- User asks to debug or fix a failing PR CI/CD check
- Requires a specific PR in context; does not scan the repo globally

**What is NOT in scope:**

- No proactive health monitoring (must be invoked per failing PR)
- No branch protection rules, no secrets scanning, no dependency alerts
- No workflow configuration review or structural workflow health
- No security alerting (Dependabot, CodeQL, Scorecard)
- No repository settings or configuration hygiene
- No historical run trend analysis across all workflows

**Confidence basis:** Direct reading of SKILL.md v1.0.

---

### 2. `/sonarcloud` — Code Quality Debt Manager, Not a GitHub Monitor [CONFIDENCE: HIGH]

**GitHub data accessed:**

- Runs `.github/workflows/sonarcloud.yml` implicitly as CI trigger
- Uses `gh pr create` in sprint mode to open cleanup PRs
- No direct read of GitHub API for repo health signals

**Actions it can take:**

- Sync SonarCloud issues to TDMS (MASTER_DEBT.jsonl)
- Generate detailed code quality reports with snippets
- Mark resolved issues, run cleanup sprints
- Check quality gate pass/fail via SonarCloud MCP or API

**Trigger / invocation:**

- User explicitly invokes `/sonarcloud [--mode]`
- Modes: sync (default), resolve, full, report, status, sprint

**What is NOT in scope:**

- Does not read GitHub Dependabot alerts, code scanning alerts, or secret
  scanning
- Does not check workflow health or CI configuration
- Does not review branch protection or repository settings
- Does not monitor GitHub Actions run health
- Scope is entirely SonarCloud-sourced quality data

**Confidence basis:** Direct reading of SKILL.md v1.0.

---

### 3. `/alerts` — Codebase Health Signal, Touches GitHub Actions Superficially [CONFIDENCE: HIGH]

**GitHub data accessed (in Full mode only):**

- `gh run list --limit 5 --json status,conclusion,name` — checks 5 most recent
  workflow runs
- This is the `C1: GitHub Actions` category — one of 42 full-mode categories
- Benchmarks: `failures.poor: 2, failures.average: 1` — produces warning/error
  alert

**Actions it can take:**

- Reports failure count from last 5 runs and recommends `gh run list` as fix
- Routes actual CI investigation to `/gh-fix-ci`
- Cannot diagnose or fix CI failures itself

**Trigger / invocation:**

- Invoked explicitly (`/alerts`), by `session-begin` in limited mode (18
  categories)
- Limited mode (18 categories) does NOT include `github-actions` checker — that
  is Full mode only
- Weight of `github-actions` category in scoring: 0.02 (effectively negligible)

**What is NOT in scope:**

- Does not check Dependabot alerts, code scanning, secret scanning
- Does not read branch protection rules, repository settings, or workflow YAML
- Does not check workflow configuration health (pinned actions, permissions)
- Does not track historical workflow trends beyond 5 runs
- GitHub coverage is a thin status signal, not a health audit

**Confidence basis:** Direct reading of SKILL.md v3.1 and run-alerts.js
implementation.

---

### 4. `/ecosystem-health` — No GitHub Data Coverage [CONFIDENCE: HIGH]

**GitHub data accessed:** None identified in SKILL.md v2.0.

The 8 weighted categories and 10 health checkers measured by this skill are all
local: code health, debt aging, test coverage, hook compliance, session state,
documentation, pattern compliance, ecosystem audit compliance. No checker
targets GitHub API data, repository settings, or workflow health.

**Actions it can take:**

- Interactive triage loop for flagged local health dimensions
- Delegates to `/alerts`, `/audit-*`, or `/sonarcloud` for sub-problems

**Trigger / invocation:** User explicitly invokes `/ecosystem-health`

**What is NOT in scope:**

- Anything in the GitHub repository API surface: no Actions, no Dependabot, no
  code scanning, no branch rules, no secrets, no settings

**Confidence basis:** Direct reading of SKILL.md v2.0.

---

### 5. `/code-reviewer` — Security Pattern Checks, No GitHub API Coverage [CONFIDENCE: HIGH]

**GitHub data accessed:** None directly.

Uses `npm run patterns:check`, ESLint, and manual code inspection. References
`security-auditor` agent for security-specific concerns. No GitHub API calls.

**Actions it can take:**

- Detect anti-patterns in staged/modified files
- Run lint, tests, pattern compliance checks
- Block on violations, recommend fixes

**Trigger / invocation:** Post-task quality check, pre-merge gate, ad-hoc review

**What is NOT in scope:**

- No GitHub PR checks, Actions logs, Dependabot alerts
- No repository-level configuration review

**Confidence basis:** Direct reading of SKILL.md v2.2.

---

### 6. `security-auditor` Agent — App Security Audit, No GitHub Repository Health [CONFIDENCE: HIGH]

**GitHub data accessed:** None directly.

Runs `npm audit --production` for dependency vulnerabilities. Uses SonarCloud
MCP for security hotspots. Inspects local code files (Firestore rules,
firebase.json, functions/src/). Does not call GitHub API for Dependabot alerts,
code scanning alerts, or secret scanning results.

**Actions it can take:**

- Full OWASP Top 10 audit against local code
- Pattern compliance and ESLint security checks
- Structured severity report (S0-S3)

**Trigger / invocation:** Proactively for security reviews, auth flows, or
vulnerability fixes. Also dispatched from `/pr-review` for large PRs.

**What is NOT in scope:**

- GitHub security features: Dependabot alerts, code scanning alerts (CodeQL,
  Scorecard, Semgrep), secret scanning
- Repository configuration: branch protection rules, required status checks,
  CODEOWNERS, workflow permissions
- Does not surface OpenSSF Scorecard results from GitHub (even though sonash-v0
  has 17 open Scorecard alerts, per D2 findings)

**Confidence basis:** Direct reading of security-auditor.md agent definition.

---

### 7. `/pr-review` — PR Feedback Processor, GitHub CI Awareness Only [CONFIDENCE: HIGH]

**GitHub data accessed:**

- `gh pr view {PR} --json files` for file count pre-check
- SonarCloud enrichment via MCP for flagged rule IDs
- Reads existing PR review bot comments (CodeRabbit, Qodo, SonarCloud)

**Actions it can take:**

- Process external review feedback items with dispositions
- Create fix commits, defer to TDMS

**Trigger / invocation:** User explicitly invokes `/pr-review` with pasted
feedback

**What is NOT in scope:**

- Not a health monitor; does not check Actions, Dependabot, code scanning
- Does not review workflow or repository configuration health

**Confidence basis:** Direct reading of SKILL.md v4.6.

---

### 8. `/audit-security` Skill — Local Code Security, No GitHub Repository Health [CONFIDENCE: HIGH]

**GitHub data accessed:**

- Optionally queries SonarCloud MCP for security hotspots
- Runs `npm audit --production`
- No direct GitHub repository API calls

**What is NOT in scope:**

- GitHub Dependabot alerts API
- GitHub code scanning alerts API (separate from SonarCloud)
- GitHub secret scanning alerts
- Branch protection and repository rule configuration
- Workflow permissions and pinned-action audits

**Confidence basis:** Direct reading of SKILL.md v1.0.

---

## Overlap Matrix

Rows = GitHub data/feature categories relevant to a `/github-health` skill.
Columns = existing skills + proposed `/github-health`. Cells = coverage level:
FULL / PARTIAL / NONE.

| GitHub Data Category                | gh-fix-ci | sonarcloud     | alerts          | ecosystem-health | code-reviewer | security-auditor | audit-security | /github-health (proposed)           |
| ----------------------------------- | --------- | -------------- | --------------- | ---------------- | ------------- | ---------------- | -------------- | ----------------------------------- |
| **Actions: run failures (recent)**  | PARTIAL\* | NONE           | PARTIAL\*\*     | NONE             | NONE          | NONE             | NONE           | FULL                                |
| **Actions: run logs / debugging**   | FULL      | NONE           | NONE            | NONE             | NONE          | NONE             | NONE           | PARTIAL (route to gh-fix-ci)        |
| **Actions: workflow config health** | NONE      | NONE           | NONE            | NONE             | NONE          | NONE             | NONE           | FULL                                |
| **Actions: workflow permissions**   | NONE      | NONE           | NONE            | NONE             | NONE          | NONE             | NONE           | FULL                                |
| **Actions: pinned action versions** | NONE      | NONE           | NONE            | NONE             | NONE          | NONE             | NONE           | FULL                                |
| **Security: Dependabot alerts**     | NONE      | NONE           | NONE            | NONE             | NONE          | NONE             | NONE           | FULL                                |
| **Security: code scanning alerts**  | NONE      | NONE           | NONE            | NONE             | NONE          | NONE             | NONE           | FULL                                |
| **Security: secret scanning**       | NONE      | NONE           | NONE            | NONE             | NONE          | NONE             | NONE           | FULL                                |
| **Security: OpenSSF Scorecard**     | NONE      | NONE           | NONE            | NONE             | NONE          | NONE             | NONE           | FULL                                |
| **Config: branch protection rules** | NONE      | NONE           | NONE            | NONE             | NONE          | NONE             | NONE           | FULL                                |
| **Config: required status checks**  | NONE      | NONE           | NONE            | NONE             | NONE          | NONE             | NONE           | FULL                                |
| **Config: repository rulesets**     | NONE      | NONE           | NONE            | NONE             | NONE          | NONE             | NONE           | FULL                                |
| **Config: CODEOWNERS**              | NONE      | NONE           | NONE            | NONE             | NONE          | NONE             | NONE           | FULL                                |
| **Insights: release cadence**       | NONE      | NONE           | NONE            | NONE             | NONE          | NONE             | NONE           | FULL                                |
| **Insights: PR cycle time**         | NONE      | pr-retro\*\*\* | NONE            | NONE             | NONE          | NONE             | NONE           | FULL                                |
| **Insights: contributor activity**  | NONE      | NONE           | NONE            | NONE             | NONE          | NONE             | NONE           | FULL                                |
| **Code quality: SonarCloud gate**   | NONE      | FULL           | PARTIAL\*\*\*\* | NONE             | NONE          | PARTIAL          | PARTIAL        | PARTIAL (route to sonarcloud)       |
| **Code quality: npm audit vulns**   | NONE      | NONE           | NONE            | NONE             | NONE          | FULL             | FULL           | PARTIAL (route to security-auditor) |

Notes:

- `*` gh-fix-ci only looks at a single failing PR's checks, not a repo-wide view
- `**` alerts checks only 5 most recent runs, Full mode only, 2% weight in score
- `***` pr-retro tracks PR cycle metrics in local JSONL, not from GitHub API
- `****` alerts checks SonarCloud gate in Full mode (C2 checker)

---

## Unique Value of /github-health

The following capabilities would be uniquely provided by `/github-health` — not
covered by any existing skill at more than token depth.

**[CONFIDENCE: HIGH]**

### 1. Dependabot Alert Triage

No existing skill reads GitHub Dependabot alerts via
`gh api /repos/{owner}/{repo}/dependabot/alerts`. The `security-auditor` and
`audit-security` run `npm audit` locally, which catches vulnerabilities at the
installed-package level but misses: (a) alerts GitHub has already raised with
suggested PRs, (b) dismissed/auto-dismissed alerts history, (c) whether
Dependabot is even enabled. `/github-health` would surface this as an actionable
list with severities.

### 2. Code Scanning Alert Aggregation

The D2-code-scanning findings (already researched) found 17 open OpenSSF
Scorecard alerts across 7 categories (TokenPermissions, PinnedDependencies,
Vulnerabilities, BinaryArtifacts, BranchProtection, CodeReview,
CIIBestPractices). No existing skill reads
`gh api /repos/{owner}/{repo}/code-scanning/alerts`. Even though
`security-auditor` runs Semgrep and SonarCloud locally, it does not pull from
GitHub's code scanning alert store where Scorecard and CodeQL results
accumulate.

### 3. Workflow Configuration Health (Structural Audit)

No existing skill reads `.github/workflows/*.yml` and evaluates:

- Job-level vs top-level permission blocks (the 9 TokenPermissions alerts)
- Pinned vs floating action version references
- Missing required workflow status checks configuration
- Deprecated `set-output` / `save-state` commands
- Workflow trigger hygiene (e.g., `pull_request_target` risks)

`/gh-fix-ci` reads workflow logs but not the workflow YAML structure itself.

### 4. Branch Protection and Repository Ruleset Visibility

No existing skill reads
`gh api /repos/{owner}/{repo}/branches/{branch}/protection` or
`gh api /repos/{owner}/{repo}/rulesets`. The D9-rulesets findings (in the
existing research) address this specifically. Rules like required status checks,
required reviewers, dismiss-stale-reviews, and signed commits are GitHub-side
configuration that no local health checker can observe.

### 5. Repository Health Score Aggregation

No existing skill produces a cross-cutting GitHub repository health score that
combines: Actions pass rate, security alert counts, branch protection posture,
and workflow hygiene into a single signal. `/alerts` gives a codebase health
score (local), `/ecosystem-health` gives an ecosystem score (local). There is no
equivalent GitHub-side health signal.

### 6. Secret Scanning Alert Visibility

No existing skill reads `gh api /repos/{owner}/{repo}/secret-scanning/alerts`.
This is a distinct GitHub feature from Dependabot or code scanning.

---

## What /github-health Should Delegate (Not Duplicate)

**[CONFIDENCE: HIGH]**

| When /github-health finds...              | Delegate to...                                   | Rationale                                                |
| ----------------------------------------- | ------------------------------------------------ | -------------------------------------------------------- |
| Failing workflow run needing diagnosis    | `/gh-fix-ci`                                     | Full log extraction, fix planning — already complete     |
| SonarCloud quality gate failing           | `/sonarcloud --status` or `/sonarcloud --sprint` | Full TDMS integration, debt tracking — already complete  |
| npm audit vulnerabilities                 | `security-auditor`                               | OWASP-mapped remediation flow — already complete         |
| Code review quality or pattern violations | `code-reviewer`                                  | Anti-pattern detection, fix templates — already complete |
| PR feedback processing needed             | `/pr-review`                                     | 8-step protocol with DAS scoring — already complete      |

The risk to avoid: `/github-health` building its own CI failure diagnosis,
SonarCloud integration, or npm audit pipeline. All three already exist at full
fidelity. `/github-health` should detect, surface, and route — not re-implement.

---

## Integration Points and Recommended Architecture

**[CONFIDENCE: MEDIUM]** (based on skill capabilities; exact integration design
is a planning decision)

### Proposed routing model:

```
/github-health
  |
  +-- Phase 1: Data Collection (gh api calls)
  |     - gh run list (Actions: recent failures)
  |     - gh api /repos/.../dependabot/alerts
  |     - gh api /repos/.../code-scanning/alerts
  |     - gh api /repos/.../secret-scanning/alerts
  |     - gh api /repos/.../branches/main/protection
  |     - gh api /repos/.../rulesets
  |     - Read .github/workflows/*.yml (structural)
  |
  +-- Phase 2: Health Score + Dashboard
  |     - Composite score across 6 GitHub-side categories
  |     - Surfaces top issues per category
  |
  +-- Phase 3: Interactive Triage
        - Failing CI?        --> "Run /gh-fix-ci to diagnose"
        - Quality gate fail? --> "Run /sonarcloud --status"
        - npm vulnerabilities? --> "Run security-auditor"
        - Workflow config?   --> Fix inline (structural YAML edits)
        - Branch protection? --> Fix inline (gh api PATCH calls)
        - Dependabot alerts? --> Inline triage with PR links
```

### Key design principle:

`/github-health` owns the GitHub API surface. Existing skills own their local
surfaces. The skill acts as a GitHub-specific front door that routes to
specialists for anything requiring code changes or deep investigation.

---

## Contradictions

None identified. The skill boundaries are relatively clean:

- `/alerts` and `/ecosystem-health` explicitly state they do not cover
  infrastructure or CI/CD monitoring
- `/gh-fix-ci` explicitly restricts to per-PR diagnostic, not repo-wide health
- No two existing skills claim to cover the same GitHub API category

---

## Gaps

1. **No existing `gh api` calls in any skill** were found outside of
   `gh pr checks` (gh-fix-ci) and `gh run list` (alerts). The breadth of
   GitHub's repository API is essentially untouched by the skill ecosystem.

2. **alerts C2 checker (SonarCloud)** in full mode may partially overlap with
   `/github-health` if the latter includes a SonarCloud gate check, but the
   weight (0.02) and depth are minimal enough to not constitute real
   duplication.

3. **Release health / changelog hygiene** (release-please workflow, tag status,
   unreleased changes) — covered partially by D11-release-please in the existing
   research — was not found in any skill's scope. This would be another unique
   area for `/github-health`.

4. **pr-retro** stores PR cycle metrics locally (`.claude/state/retros.jsonl`)
   but does not pull GitHub Insights data. If `/github-health` wanted PR cycle
   time from GitHub's perspective (time-to-merge, review latency), that data
   exists in the GitHub API but is currently uncaptured.

5. **`security-engineer` agent** appears to be a generic AWS/cloud security
   infrastructure agent (Terraform, GuardDuty, WAF patterns) — it does not apply
   to sonash-v0's Firebase/GitHub-hosted stack. It is not relevant to
   `/github-health` scope.

---

## Serendipity

- The D2-code-scanning findings already catalogued the 17 open Scorecard alerts
  (TokenPermissions x9, PinnedDependencies x3, Vulnerabilities x1,
  BinaryArtifacts x1, BranchProtection x1, CodeReview x1, CIIBestPractices x1).
  This is real, current data that `/github-health` would surface on first run.
  The BranchProtection and CodeReview alerts specifically indicate that
  `/github-health` would find immediately actionable configuration gaps.

- The `alerts` skill explicitly documents "CI/CD status monitoring (use
  `/gh-fix-ci` for that)" as out of scope. This is essentially a documented
  invitation for `/github-health` to own that surface more comprehensively.

- The `alerts` skill's GitHub Actions checker weight is only 2% of the ecosystem
  health score, suggesting the existing skill authors deliberately treated
  GitHub as low-priority in the local health model. `/github-health` would
  elevate GitHub-side signals to a first-class concept rather than a 2%-weighted
  afterthought.

---

## Confidence Assessment

- HIGH claims: 8 (per-skill capability summaries, overlap matrix, delegation
  targets)
- MEDIUM claims: 1 (integration architecture)
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

All findings derived directly from filesystem reads of SKILL.md files and the
alerts checker script implementation. No training data or external sources used.

---

## Sources

| #   | Path                                                   | Title                         | Type            | Trust | Date       |
| --- | ------------------------------------------------------ | ----------------------------- | --------------- | ----- | ---------- |
| 1   | `.claude/skills/gh-fix-ci/SKILL.md`                    | gh-fix-ci SKILL.md            | local-skill-def | HIGH  | 2026-02-25 |
| 2   | `.claude/skills/sonarcloud/SKILL.md`                   | sonarcloud SKILL.md           | local-skill-def | HIGH  | 2026-02-25 |
| 3   | `.claude/skills/alerts/SKILL.md`                       | alerts SKILL.md               | local-skill-def | HIGH  | 2026-03-24 |
| 4   | `.claude/skills/alerts/REFERENCE.md`                   | alerts REFERENCE.md           | local-skill-def | HIGH  | 2026-03-19 |
| 5   | `.claude/skills/alerts/scripts/run-alerts.js`          | run-alerts.js implementation  | local-code      | HIGH  | 2026-03-24 |
| 6   | `.claude/skills/ecosystem-health/SKILL.md`             | ecosystem-health SKILL.md     | local-skill-def | HIGH  | 2026-03-11 |
| 7   | `.claude/skills/code-reviewer/SKILL.md`                | code-reviewer SKILL.md        | local-skill-def | HIGH  | 2026-03-13 |
| 8   | `.claude/skills/pr-review/SKILL.md`                    | pr-review SKILL.md            | local-skill-def | HIGH  | 2026-03-18 |
| 9   | `.claude/agents/security-auditor.md`                   | security-auditor agent        | local-agent-def | HIGH  | 2026-03-13 |
| 10  | `.claude/agents/security-engineer.md`                  | security-engineer agent       | local-agent-def | HIGH  | n/a        |
| 11  | `.claude/skills/audit-security/SKILL.md`               | audit-security SKILL.md       | local-skill-def | HIGH  | 2026-02-25 |
| 12  | `.research/github-health/findings/D2-code-scanning.md` | Code scanning alerts findings | local-research  | HIGH  | 2026-03-29 |

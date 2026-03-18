<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-17
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Diagnosis: GitHub Optimization Plan

**Date:** 2026-03-17 **Task:** Comprehensive GitHub ecosystem optimization —
workflows, security, apps, configuration, community health **Discovery Method:**
5 parallel agents (workflow explorer, config explorer, CI analyzer, best
practices research, apps research)

---

## ROADMAP Alignment

**Aligned.** ROADMAP.md Sprint M2 explicitly includes:

- Track D: CI/CD reliability (D3 workflow docs, D4 CI gates, D10 script testing)
- Track E: Infrastructure hardening (E9 deploy triage)
- Track O: Owner actions (O3 Dependabot enable)
- Multiple DEBT items for deploy workflow, Actions versions, CI security gates

This plan consolidates and supersedes scattered ROADMAP CI/CD items into a
single coherent effort.

---

## Current State Summary

| Dimension                  | Score | Details                                                            |
| -------------------------- | ----- | ------------------------------------------------------------------ |
| **CI Health**              | F     | 100% failing for 12 days (113 consecutive failures)                |
| **Workflow Security**      | C     | 3/16 missing permissions, inconsistent SHA pinning                 |
| **Workflow Performance**   | C-    | 15/16 missing timeouts, 14/16 missing concurrency, phantom caches  |
| **Repository Security**    | D     | Secret scanning disabled, no SECURITY.md, minimal ruleset          |
| **Code Scanning**          | C     | 282 open alerts (11 CodeQL HIGH, 271 Semgrep)                      |
| **Apps & Integrations**    | C     | SonarCloud disabled, Copilot stale, no coverage/supply-chain tools |
| **Community Health**       | D     | 42% — no license, CODEOWNERS, CONTRIBUTING, issue templates        |
| **Release Management**     | F     | 0 releases, no versioning, no changelog automation                 |
| **Environment Protection** | F     | 7 environments, 0 protection rules                                 |
| **Dependency Management**  | B     | Dependabot configured well, 3 open alerts, auto-merge exists       |

---

## Findings by Severity

### CRITICAL (Blocking or High-Risk)

| #   | Finding                                                                                                                                                                                                       | Verify Command                                                                                                                    | Source            |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| C1  | **CI 100% failing since March 5** — Prettier formatting violation. 113 consecutive failures across all branches. Build step always skipped. All Dependabot auto-merges blocked. ~226 wasted minutes.          | `gh api "repos/jasonmichaelbell78-creator/sonash-v0/actions/workflows/ci.yml/runs?per_page=5" --jq '.workflow_runs[].conclusion'` | CI Analyzer       |
| C2  | **Secret scanning DISABLED** — Public repo with Firebase credentials in secrets. No protection against accidental secret commits.                                                                             | `gh api repos/jasonmichaelbell78-creator/sonash-v0/secret-scanning/alerts` → "Secret scanning is disabled"                        | API probe         |
| C3  | **3 workflows missing permissions blocks** — backlog-enforcement, ci, pattern-compliance-audit use github-script/upload-artifact without explicit permissions. Relies on dangerous default token permissions. | Read each workflow file, search for `permissions:`                                                                                | Workflow Explorer |
| C4  | **No SECURITY.md** — Public security-focused recovery app with no vulnerability reporting policy. Community health penalized.                                                                                 | `gh api repos/jasonmichaelbell78-creator/sonash-v0/community/profile --jq '.files.code_of_conduct'` → null                        | Config Explorer   |
| C5  | **11 CodeQL HIGH severity alerts open** — 2 incomplete URL sanitization, 4 incomplete multi-char sanitization, 3 bad tag filter, 1 incomplete sanitization, 1 incomplete URL scheme check                     | `gh api repos/jasonmichaelbell78-creator/sonash-v0/code-scanning/alerts?tool_name=CodeQL`                                         | API probe         |
| C6  | **No license file** — Public repo has no license. Legally, no one can use, modify, or distribute the code.                                                                                                    | `gh api repos/jasonmichaelbell78-creator/sonash-v0/license` → 404                                                                 | Config Explorer   |

### HIGH

| #   | Finding                                                                                                                                                                                                                                 | Source                            |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| H1  | **SonarCloud workflow disabled** — Uses deprecated `sonarcloud-github-action`. Needs migration to `sonarqube-scan-action@v4`. Loses code quality gates, coverage tracking, duplication detection.                                       | Workflow Explorer + Apps Research |
| H2  | **15/16 workflows missing `timeout-minutes`** — Default is 360 min (6 hours). Hung jobs consume runner minutes silently. Only deploy-firebase has concurrency cancel-in-progress.                                                       | Workflow Explorer                 |
| H3  | **Inconsistent action SHA pinning** — 8 workflows use SHA pins, 5 use version tags (v4/v6), 3 use unpinned refs. Supply chain attack vector (CVE-2025-30066 tj-actions precedent).                                                      | Workflow Explorer                 |
| H4  | **14/16 workflows missing concurrency groups** — Redundant parallel runs on same commit waste minutes. Only deploy-firebase and sync-readme have concurrency.                                                                           | Workflow Explorer                 |
| H5  | **Ruleset is minimal** — "Main Protection" requires PR with 0 approvals. No required status checks, no signed commits, no linear history, no force-push protection. Bypass actors list is empty but `current_user_can_bypass: "never"`. | API probe: ruleset 13352818       |
| H6  | **7 environments with 0 protection rules** — Production, Preview, copilot environments have no deployment gates, no required reviewers, no branch restrictions.                                                                         | API probe: environments           |
| H7  | **NEXT*PUBLIC*\* values stored as secrets** — 5 Firebase public config values are in secrets instead of variables. SESSION_CONTEXT.md already notes this as a pending manual action.                                                    | API probe: secrets/variables      |
| H8  | **No path filtering on CI/CodeQL/Semgrep** — Documentation-only changes (markdown edits) trigger full CI pipeline, CodeQL analysis, and Semgrep scan unnecessarily.                                                                     | CI Analyzer                       |
| H9  | **12/15 npm cache entries are 0 bytes** — Phantom cache entries for hash key `d4c692ba...`. npm cache failing to restore on most branch runs, causing full `npm ci` download each time.                                                 | CI Analyzer                       |
| H10 | **Coverage artifacts uploaded on failing runs** — `if: always()` uploads ~9MB stale coverage data even when tests never ran. ~90MB/day waste.                                                                                           | CI Analyzer                       |
| H11 | **OIDC not configured for Firebase** — Using long-lived `FIREBASE_SERVICE_ACCOUNT` JSON key. OIDC via Workload Identity Federation eliminates key rotation risk.                                                                        | Best Practices Research           |
| H12 | **3 open Dependabot alerts** — 1 medium (hono prototype pollution), 2 low (@tootallnate/once)                                                                                                                                           | API probe                         |
| H13 | **No Codecov/coverage tracking** — Coverage reports are uploaded as artifacts but not tracked over time. No PR-level coverage diffs. No trend visibility.                                                                               | Apps Research                     |

### MEDIUM

| #   | Finding                                                                                                                                                                          | Source                  |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| M1  | **Counter bug in cleanup-branches.yml** — Variables incremented in subshell loop don't propagate. Summary always shows "0 deleted, 0 skipped, 0 failed".                         | Workflow Explorer       |
| M2  | **Missing community health files** — No CONTRIBUTING.md, CODE_OF_CONDUCT.md, CODEOWNERS, FUNDING.yml. Issue template misplaced (not in `.github/ISSUE_TEMPLATE/`).               | Config Explorer         |
| M3  | **0 releases, no release management** — 1 tag only. No versioning strategy, no changelog automation, no release notes beyond release.yml config.                                 | API probe               |
| M4  | **Copilot instructions stale** — `.github/copilot-instructions.md` last updated Dec 2025. References 77/91 tests (now 3,776). Auto-review may not be enabled.                    | Config Explorer         |
| M5  | **backlog-enforcement.yml uses outdated actions** — checkout@v4.3.1, setup-node@v4.1.0, github-script@v7.0.1 (current: v6, v6, v8).                                              | Workflow Explorer       |
| M6  | **271 Semgrep alerts open** — 137 unchecked-array-access, 40 no-default-export, 28 no-direct-firestore-write, 17 no-floating-promise, etc. Custom rules generating noise.        | API probe               |
| M7  | **CodeQL using custom workflow, not default setup** — `code-scanning/default-setup` state is "not-configured". Custom workflow works but misses auto-language detection updates. | API probe               |
| M8  | **release.yml missing categories** — No "Breaking Changes", "Security", "Refactoring", or "Testing" categories.                                                                  | Config Explorer         |
| M9  | **PR template missing sections** — No "Breaking Changes", "Risks/Rollback Plan", or performance impact sections.                                                                 | Config Explorer         |
| M10 | **No OpenSSF Scorecard** — Public security-focused project would benefit from visible security posture scoring.                                                                  | Best Practices Research |
| M11 | **No StepSecurity harden-runner** — CI handles FIREBASE_SERVICE_ACCOUNT and SONAR_TOKEN. Compromised action could exfiltrate secrets.                                            | Best Practices Research |
| M12 | **No supply chain protection beyond Dependabot** — Socket.dev would add proactive behavioral analysis (detects typosquatting, malware, dependency confusion).                    | Apps Research           |
| M13 | **No Next.js bundle size tracking** — Firebase SDK is heavy. Easy to introduce bundle regressions without tracking.                                                              | Apps Research           |
| M14 | **Auto-merge Dependabot fires on ALL PRs** — Checks `github.actor` at job level but still consumes runner startup on every non-Dependabot PR.                                    | Workflow Explorer       |
| M15 | **deploy-firebase.yml inconsistent var sourcing** — Build uses `secrets.NEXT_PUBLIC_*`, preview uses `vars.NEXT_PUBLIC_*`.                                                       | Workflow Explorer       |
| M16 | **No pip caching in Semgrep workflow** — Semgrep downloaded fresh every run.                                                                                                     | Workflow Explorer       |
| M17 | **Duplicate "Preview" environments** — Preview, Preview - sonash-v0, Preview - sonash-v0-2drw (same for Production). Likely stale from early setup.                              | API probe               |

### LOW

| #   | Finding                                                                                                                                    | Source                |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------- |
| L1  | **No GitHub Projects v2 board** — Work tracked in markdown files (ROADMAP.md, SESSION_CONTEXT.md).                                         | Apps Research         |
| L2  | **Topics not set on repo** — Empty topics array. Reduces discoverability.                                                                  | API probe             |
| L3  | **Artifact retention at 14 days** — ~1.3GB steady-state. Could reduce to 7 days.                                                           | CI Analyzer           |
| L4  | **No Imgbot for image optimization** — One-time lossless compression of repo images.                                                       | Apps Research         |
| L5  | **pattern-compliance-audit runs script twice** — Once for JSON, once for text output. Could be single run.                                 | Workflow Explorer     |
| L6  | **SonarCloud quality gate failing on main** — Even though workflow is disabled, the check-run still shows failure from when it was active. | API probe: check-runs |

---

## Apps Inventory & Recommendations

### Currently Installed

| App                      | Status                | Recommendation                                           |
| ------------------------ | --------------------- | -------------------------------------------------------- |
| **GitHub Actions**       | Active (16 workflows) | Keep — optimize per findings above                       |
| **SonarCloud**           | Disabled              | **Re-enable** — migrate to sonarqube-scan-action@v4      |
| **Copilot Code Review**  | Active                | Keep — **update stale instructions**, enable auto-review |
| **Copilot Coding Agent** | Active                | Keep — configure MCP servers for external tool access    |
| **Dependabot**           | Active                | Keep — add grouping for Actions ecosystem                |

### Recommended Additions

| App                            | Priority    | Free?              | Effort | Impact                                         |
| ------------------------------ | ----------- | ------------------ | ------ | ---------------------------------------------- |
| **Codecov**                    | HIGH        | Yes (public repos) | 15 min | PR-level coverage diffs, trend tracking        |
| **Socket.dev**                 | HIGH        | Yes (open source)  | 5 min  | Proactive supply chain attack detection        |
| **OpenSSF Scorecard**          | HIGH        | Yes                | 20 min | Security posture scoring, trust badge          |
| **StepSecurity Harden-Runner** | MEDIUM-HIGH | Yes (public repos) | 30 min | CI runner EDR, secrets exfiltration prevention |
| **Release Please**             | MEDIUM      | Yes                | 20 min | Automated versioning + changelogs              |
| **Next.js Bundle Analysis**    | MEDIUM      | Yes                | 30 min | Bundle size regression detection               |

### Not Recommended (overlap or low value for solo dev)

| App           | Why Not                                           |
| ------------- | ------------------------------------------------- |
| Snyk          | Overlaps with Dependabot + CodeQL + Socket.dev    |
| GitGuardian   | GitHub native secret scanning is sufficient       |
| Renovate      | Dependabot covers npm + Actions adequately        |
| Vercel        | Deep Firebase integration makes migration costly  |
| Danger.js     | Existing CI checks + Copilot review is sufficient |
| Linear/ZenHub | GitHub Projects v2 is free and sufficient         |

---

## Reframe Check

This task is **broader than it appears**. The user asked about "GitHub
optimization" but the diagnosis reveals this is really a **GitHub ecosystem
maturity initiative** spanning:

1. **Emergency triage** (CI broken, no secret scanning)
2. **Security hardening** (permissions, SHA pinning, OIDC, harden-runner)
3. **Workflow optimization** (timeouts, concurrency, caching, path filtering)
4. **App ecosystem buildout** (Codecov, Socket.dev, Scorecard, Release Please)
5. **Repository governance** (rulesets, environments, community health)
6. **Code scanning remediation** (282 alerts to triage)

**Recommendation:** Proceed with this expanded framing. Structure the plan in
priority phases: emergency fixes first, then security, then optimization, then
ecosystem expansion.

---

## Verify Commands

```bash
# C1: CI failure streak
gh api "repos/jasonmichaelbell78-creator/sonash-v0/actions/workflows/ci.yml/runs?per_page=5" --jq '.workflow_runs[] | {conclusion, created_at}'

# C2: Secret scanning disabled
gh api repos/jasonmichaelbell78-creator/sonash-v0/secret-scanning/alerts 2>&1 | head -1

# C5: CodeQL alerts
gh api repos/jasonmichaelbell78-creator/sonash-v0/code-scanning/alerts?tool_name=CodeQL --jq 'length'

# H5: Ruleset config
gh api repos/jasonmichaelbell78-creator/sonash-v0/rulesets/13352818 --jq '.rules'

# H6: Environment protection
gh api repos/jasonmichaelbell78-creator/sonash-v0/environments --jq '.environments[] | {name, protection_rules}'

# H9: Cache health
gh api repos/jasonmichaelbell78-creator/sonash-v0/actions/caches --jq '.actions_caches[] | select(.size_in_bytes == 0) | .key' | wc -l
```

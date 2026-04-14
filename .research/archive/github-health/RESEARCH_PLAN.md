# Research Plan: GitHub Health Skill

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-29
**Status:** ACTIVE
<!-- prettier-ignore-end -->

**Created:** 2026-03-29 (Session #246) **Status:** APPROVED — executing
**Depth:** L1 (Exhaustive) **Domain:** Developer tooling / GitHub API
integration **Output:** `.research/github-health/`

## Vision

Research everything the GitHub API/CLI can tell us about the repo, identify all
actionable improvements (security, Actions, configs, metadata, dependencies,
releases, insights), and design a `/github-health` skill that pulls this data,
analyzes it, and resolves issues directly.

## Settled Decisions (from Q&A)

| #   | Decision         | User Direction                                                          |
| --- | ---------------- | ----------------------------------------------------------------------- |
| D1  | Core intent      | Analyze repo via GitHub API, identify issues, FIX them — not just track |
| D2  | Trigger          | Manual invocation (`/github-health`)                                    |
| D3  | Primary function | Resolution-first. MASTER_DEBT is secondary escape hatch only            |
| D4  | Scope            | Anything GitHub touches: Actions, security, configs, insights, all      |
| D5  | Audience         | Solo dev (just you)                                                     |
| D6  | API method       | Whatever nets most info — `gh api`, REST, GraphQL all in scope          |
| D7  | Actions scope    | Existing YAML analysis + missing workflow discovery                     |
| D8  | Security scope   | All: Dependabot, CodeQL, secret scanning, branch protection             |
| D9  | SonarCloud       | In scope if GitHub-related                                              |
| D10 | Agent sizing     | "More is better" — no scope creep concerns, increase counts             |

## Pre-Scan Findings (repo state at research start)

### Workflows (22 total)

| Workflow                  | State            | Notes                          |
| ------------------------- | ---------------- | ------------------------------ |
| CI                        | active           |                                |
| CodeQL                    | active           |                                |
| Deploy to Firebase        | active           |                                |
| Release Please            | active           | **FAILING on main**            |
| OpenSSF Scorecard         | active           | Latest: success                |
| Semgrep                   | active           |                                |
| Dependency Review         | active           |                                |
| Auto-Label Review Tier    | active           |                                |
| Auto-merge Dependabot     | active           |                                |
| Backlog Enforcement       | active           |                                |
| Cleanup Stale Branches    | active           |                                |
| Documentation Lint        | active           | Failed on plan-32626           |
| Pattern Compliance Audit  | active           |                                |
| Review Trigger Check      | active           |                                |
| Resolve Technical Debt    | active           |                                |
| Sync README Status        | active           |                                |
| Validate Phase Completion | active           |                                |
| SonarCloud analysis       | **disabled**     | Manually disabled              |
| Copilot code review       | active (dynamic) |                                |
| Copilot coding agent      | active (dynamic) |                                |
| Dependabot Updates        | active (dynamic) | 3 node-forge failures in a row |
| Dependency Graph          | active (dynamic) |                                |

### Security Alerts

| Type            | Open | Severity Distribution        |
| --------------- | ---- | ---------------------------- |
| Dependabot      | 18   | 12 high, 6 medium            |
| Code Scanning   | 30   | 9 TokenPerms, 3 PinnedDeps + |
| Secret Scanning | 7    | 4 Google API keys, 2 PATs    |

### Branch Protection

- No legacy branch protection (404)
- 2 rulesets: "main protection" (13352818) and "main-protection" (14350637)
  - Ruleset 1: pull_request, required_status_checks, linear_history,
    non_fast_forward, deletion
  - Ruleset 2: deletion, non_fast_forward, required_status_checks
  - **Overlap**: Both enforce deletion + non_fast_forward +
    required_status_checks

### Environments

| Name       | Protection Rules | Deploy Branch Policy |
| ---------- | ---------------- | -------------------- |
| copilot    | None             | None                 |
| Preview    | None             | None                 |
| Production | None             | None                 |

### Other

- Community profile: 85% (missing issue templates)
- Topics: none set
- Labels: 29 (missing tier-3, has 0/1/2/4)
- Milestones: 0
- Webhooks: 0
- Secrets: 9, Variables: 2
- Auth scopes: gist, read:org, repo
- Rate limit: ~4960/5000 remaining

## Research Phases

### Wave 1: Security Deep-Dive (4 agents, parallel)

| Agent | Sub-Q | Scope                                                                 |
| ----- | ----- | --------------------------------------------------------------------- |
| D1    | SQ2a  | Dependabot alerts: all 18, severity, fix path, which are auto-fixable |
| D2    | SQ2b  | Code scanning: all 30 alerts, OpenSSF Scorecard rules, fix strategies |
| D3    | SQ2c  | Secret scanning: all 7 alerts, false positive assessment, remediation |
| D4    | SQ1a  | Workflow YAML analysis: all 18 repo-defined, best practices audit     |

### Wave 2: Actions Failures & Dependencies (4 agents, parallel)

| Agent | Sub-Q | Scope                                                                        |
| ----- | ----- | ---------------------------------------------------------------------------- |
| D5    | SQ1b  | Failing workflows: Release Please, Dependabot PRs, docs-lint root causes     |
| D6    | SQ1c  | Missing workflows: what standard workflows should exist but don't            |
| D7    | SQ5a  | Dependabot config: optimization, grouping, schedule, ecosystem coverage      |
| D8    | SQ5b  | Dependency failure patterns: node-forge 3x, brace-expansion; auto-merge gaps |

### Wave 3: Infrastructure & Config (4 agents, parallel)

| Agent | Sub-Q | Scope                                                                            |
| ----- | ----- | -------------------------------------------------------------------------------- |
| D9    | SQ3   | Rulesets: overlap analysis, consolidation plan, missing protections              |
| D10   | SQ4   | Repo metadata: topics, community profile, labels (tier-3 gap), issue templates   |
| D11   | SQ6a  | Release Please: failure diagnosis, config audit, versioning strategy             |
| D12   | SQ6b  | Deploy pipeline + environments: protection rules, branch policies, secrets audit |

### Wave 4: API & Integration (4 agents, parallel)

| Agent | Sub-Q | Scope                                                                        |
| ----- | ----- | ---------------------------------------------------------------------------- |
| D13   | SQ7a  | REST API inventory: every actionable endpoint, auth requirements, data yield |
| D14   | SQ7b  | GraphQL API: capabilities beyond REST, bulk queries, mutation support        |
| D15   | SQ8   | SonarCloud: why disabled, GitHub integration points, reconnection strategy   |
| D16   | SQ9   | Existing skill overlap: gh-fix-ci, /sonarcloud, /alerts — gap analysis       |

### Wave 5: Insights & Strategy (4 agents, parallel)

| Agent | Sub-Q | Scope                                                                       |
| ----- | ----- | --------------------------------------------------------------------------- |
| D17   | SQ10a | Repo insights: traffic, clones, referrers, code frequency via API           |
| D18   | SQ10b | Metrics actionability: which insights drive decisions for a solo dev        |
| D19   | SQ11  | Projects & Issues: board potential, automation, label workflows, milestones |
| D20   | SQ12a | OpenSSF Scorecard: deep-dive on all checks, current scores, fix priorities  |

### Wave 6: Benchmark (1 agent)

| Agent | Sub-Q | Scope                                                                            |
| ----- | ----- | -------------------------------------------------------------------------------- |
| D21   | SQ12b | Gap-to-recommended: GitHub recommended settings vs current, prioritized fix list |

### Post-Research Phases

| Phase              | Agents  | Purpose                               |
| ------------------ | ------- | ------------------------------------- |
| Synthesis          | 1       | Unified RESEARCH_OUTPUT.md            |
| Verification (L1)  | 3       | Claims vs filesystem + API reality    |
| Challenges         | 2       | 1 contrarian + 1 OTB                  |
| Dispute resolution | 1       | If conflicts exist                    |
| Re-synthesis       | 1       | If >20% claims changed                |
| Gap pursuit (scan) | 2-4     | Conditional: if actionable gaps found |
| Gap verification   | 2       | If gap agents spawned                 |
| Final re-synthesis | 1       | If gap findings added                 |
| **Total**          | **~35** |                                       |

**Estimated duration:** ~25-35 min. Add ~10-15 min if gap pursuit activates.

## Output

```
.research/github-health/
  findings/           # per-agent findings (gitignored intermediates)
  challenges/         # contrarian + OTB (gitignored intermediates)
  RESEARCH_OUTPUT.md  # unified report
  claims.jsonl        # machine-parseable claims
  sources.jsonl       # source registry
  metadata.json       # session metadata
```

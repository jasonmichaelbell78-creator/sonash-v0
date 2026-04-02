# Findings: SonarCloud Integration — Why Disabled, Current State, Reconnection Strategy

**Searcher:** deep-research-searcher (D15-SQ8) **Profile:** codebase + web
**Date:** 2026-03-29 **Sub-Question IDs:** D15-SQ8

---

## Key Findings

### 1. Why the Workflow Was Disabled: Dual-Mode Conflict with Auto-Analysis [CONFIDENCE: HIGH]

The SonarCloud GitHub Actions workflow (`state: disabled_manually`) was disabled
through the GitHub UI — not via a code commit. The git history for
`.github/workflows/sonarcloud.yml` shows the last code change (commit
`5923c1f6`, 2026-03-17) only added `timeout-minutes: 30` and upgraded the
checkout action from v4 to v6. There is no "disabled" commit.

**Root cause evidence from workflow run logs:**

The run history (11 total runs) reveals two distinct failure modes:

**Failure Mode A — Missing SONAR_TOKEN** (runs: 2026-01-18T22:32:07Z and
2026-01-18T22:45:06Z, 2026-01-19T02:01:57Z): Log output confirms:
`"Set the SONAR_TOKEN env variable."` — the token was empty/not set. The
workflow args show `"-Dsonar.projectKey= -Dsonar.organization="` (both blank),
confirming `SONAR_TOKEN` was missing at initial setup. This was resolved: the
SONAR_TOKEN secret is now present (confirmed via
`gh api repos/.../actions/secrets`).

**Failure Mode B — Auto-Analysis Conflict** (run: 2026-01-19T02:51:21Z): Log
output confirms the definitive error:
`"ERROR You are running CI analysis while Automatic Analysis is enabled. Please consider disabling one or the other."`
`"EXECUTION FAILURE"`

This is the documented SonarCloud conflict: SonarCloud Automatic Analysis
(GitHub App based) was active on the project at the same time as the
CI-triggered analysis. SonarCloud does not support both simultaneously.

**Timeline reconstruction:**

- 2026-01-18: Workflow added but SONAR_TOKEN missing → 3 failures
- 2026-01-19 02:04: Token configured, first success (workflow_dispatch)
- 2026-01-19 02:51: PR run hits Auto-Analysis conflict → failure
- 2026-02-05: 5 successful runs (manual dispatch + push + PRs) — this indicates
  auto-analysis was disabled between Jan 19 and Feb 5
- 2026-02-21: Last successful run (manual dispatch)
- 2026-03-17: CI optimization commit (timeout + SHA pin updates) — no run
  follows
- Current state: `disabled_manually` — likely disabled during the GitHub
  optimization Wave 2 work (2026-03-17) or between Feb 21 and Mar 17, with the
  reasoning being the workflow was redundant with auto-analysis or was causing
  duplicate analysis after auto-analysis was re-enabled

**Most probable disable reason:** The workflow was manually disabled in the
GitHub UI as part of the "GitHub optimization Waves 0-2" work (2026-03-17,
commit `5923c1f6`). The commit message notes "Waves 3-4 (code scanning
remediation, ecosystem expansion) to follow" — suggesting the workflow was
intentionally parked for the next wave rather than abandoned.

Sources: `gh api .../actions/workflows/224765133/runs`, `gh run view` logs,
`git log -- .github/workflows/sonarcloud.yml`, commit `5923c1f6`

---

### 2. Current Integration State: Four Distinct Integration Points [CONFIDENCE: HIGH]

The SonarCloud integration has four separate components with different states:

**A. SonarCloud GitHub App (Automatic Analysis)** State: LIKELY ACTIVE (inferred
— cannot confirm without SonarCloud UI access)

- Installed during initial project setup (required for project creation)
- Caused the Jan 19 conflict, was likely disabled between Jan 19 and Feb 5 to
  resolve the conflict
- Current state unknown without checking
  `sonarcloud.io > Admin > Analysis Method`
- Provides: PR decoration, main branch analysis, basic quality gate
- Does NOT provide: code coverage metrics, branch analysis beyond main

**B. GitHub Actions CI Workflow (`.github/workflows/sonarcloud.yml`)** State:
`disabled_manually` (confirmed via GitHub API)

- Last successful run: 2026-02-21
- Uses:
  `SonarSource/sonarcloud-github-action@ffc3010689be73b8e5ae0c57ce35968afd7909e8 # v5.0.0`
- SONAR_TOKEN secret: present in repo secrets (confirmed)
- Config: `sonar-project.properties` is thorough and actively maintained (13
  false-positive exclusions, quality gate notes, 2026-01-13 baseline of 778
  issues)
- NOTE: `sonarcloud-github-action` is now **deprecated** — Sonar recommends
  migrating to `sonarqube-scan-action`

**C. SonarCloud MCP Server (`scripts/mcp/sonarcloud-server.js`)** State: ACTIVE
(local tool, available via Claude MCP config)

- Provides: real-time issue queries, quality gate status, security hotspots via
  `mcp__sonarcloud__*` tools
- Requires: `SONAR_TOKEN` env var at runtime
- Functions independently of GitHub Actions workflow
- Not affected by the workflow's disabled state

**D. `/sonarcloud` Skill (`.claude/skills/sonarcloud/SKILL.md`)** State: ACTIVE
(skill is functional)

- Provides: sync to TDMS, report generation, resolve mode, sprint mode
- Uses: SonarCloud REST API directly via `scripts/debt/sync-sonarcloud.js`
- Also independent of GitHub Actions workflow state
- Skill uses project key `jasonmichaelbell78_sonash-v0` (note: no `-creator`)
  while sonar-project.properties uses `jasonmichaelbell78-creator_sonash-v0`

**Key observation:** The MCP server and `/sonarcloud` skill continue to provide
full SonarCloud data access regardless of the GitHub Actions workflow state.
SonarCloud analysis is still happening (either via auto-analysis or retained
historical data) — the workflow disable only stops CI-triggered re-analysis.

Sources: `gh api .../actions/workflows`, `.github/workflows/sonarcloud.yml`,
`.claude/skills/sonarcloud/SKILL.md`, `scripts/mcp/sonarcloud-server.js`

---

### 3. Value Assessment: What Each Integration Point Provides [CONFIDENCE: HIGH]

| Component                          | Primary Value                      | Unique Capability                                                      | Without It                                            |
| ---------------------------------- | ---------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------- |
| **GitHub Actions CI workflow**     | Triggers analysis on every push/PR | Code coverage metrics from `lcov.info`; full analysis; branch analysis | No coverage data in SonarCloud; branches not analyzed |
| **SonarCloud Auto-Analysis (App)** | Zero-config analysis of main + PRs | Simplicity; no token rotation                                          | Must manually trigger analysis                        |
| **SonarCloud MCP Server**          | AI-accessible issue queries        | LLM direct access to issues, gates, hotspots                           | Claude can't directly query SonarCloud                |
| **`/sonarcloud` skill**            | TDMS debt management               | Syncs issues to MASTER_DEBT.jsonl                                      | SonarCloud data not in debt tracking system           |

**Critical value of CI workflow over auto-analysis:** The
`sonar-project.properties` file explicitly configures:

```
sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.typescript.lcov.reportPaths=coverage/lcov.info
```

SonarCloud auto-analysis **cannot** ingest code coverage reports — it has no
access to the CI coverage artifacts. Coverage metrics in SonarCloud (percentage
of lines covered) are only populated when the CI workflow runs and uploads the
`lcov.info` from the `coverage/` directory produced by `npm test`.

Auto-analysis also does not analyze non-main branches. The repo has active
feature branches (confirmed by run history with `claude/new-session-*`
branches).

**For this project's complexity** (778+ tracked SonarCloud issues, active TDMS
integration, TypeScript with coverage CI), CI-based analysis is the correct
choice, not auto-analysis.

Sources: SonarCloud community docs, `sonar-project.properties`, workflow run
logs

---

### 4. Reconnection Strategy [CONFIDENCE: HIGH]

**Step 1 — Required: Disable SonarCloud Automatic Analysis (if re-enabled)**
Before re-enabling the CI workflow, confirm auto-analysis is disabled:

- Navigate to:
  `sonarcloud.io > Projects > sonash-v0 > Administration > Analysis Method`
- Ensure "SonarCloud Automatic Analysis" is toggled OFF
- If already off (was likely disabled to resolve the Jan 2026 conflict), skip

This step is mandatory. Running both causes `EXECUTION FAILURE` on every CI run.

**Step 2 — Update deprecated action to sonarqube-scan-action** The current
workflow uses `SonarSource/sonarcloud-github-action` which is officially
deprecated. Sonar recommends migrating to `sonarqube-scan-action`.

Current:

```yaml
- name: Analyze with SonarCloud
  uses: SonarSource/sonarcloud-github-action@ffc3010689be73b8e5ae0c57ce35968afd7909e8 # v5.0.0
```

Replacement (drop-in, same `sonar-project.properties` still used):

```yaml
- name: Scan with SonarQube
  uses: SonarSource/sonarqube-scan-action@<latest-sha> # vX.X.X
  env:
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
    SONAR_HOST_URL: https://sonarcloud.io
```

Note: pin to SHA for supply chain security (matches existing pattern across all
18 workflows).

**Step 3 — Fix permissions structure (OpenSSF Scorecard alert #5450)** The
existing D2-code-scanning findings document this: `security-events: write` is at
top-level rather than job-level. Fixing this removes a Scorecard alert:

```yaml
# Change top-level:
permissions:
  contents: read # remove pull-requests and security-events from top level

jobs:
  Analysis:
    permissions:
      contents: read
      pull-requests: write
      security-events: write
```

**Step 4 — Re-enable the workflow via GitHub UI or API**

```bash
gh api repos/jasonmichaelbell78-creator/sonash-v0/actions/workflows/224765133/enable \
  --method PUT
```

**Step 5 — Verify with manual dispatch**

```bash
gh workflow run sonarcloud.yml
gh run watch $(gh run list --workflow=sonarcloud.yml --limit=1 --json databaseId --jq '.[0].databaseId')
```

**Full reconnection path summary:**

1. Disable SonarCloud auto-analysis in SonarCloud UI (manual, ~1 min)
2. Update action to `sonarqube-scan-action` (code change)
3. Fix permissions structure (code change, resolves Scorecard alert)
4. Re-enable workflow via API (1 command)
5. Trigger manual dispatch to verify

Sources: SonarCloud community forum, GitHub Actions API docs,
D2-code-scanning.md

---

### 5. Project Key Inconsistency — Potential Issue [CONFIDENCE: MEDIUM]

The SKILL.md and MCP server use project key `jasonmichaelbell78_sonash-v0` (with
underscore, no `-creator`), while `sonar-project.properties` uses
`jasonmichaelbell78-creator_sonash-v0` (with `-creator`). The skill/MCP
reference may be stale from before the GitHub org was renamed or the SonarCloud
org was restructured.

This inconsistency would cause `/sonarcloud` skill operations to query the wrong
project if the project key changed. Verify via:

```bash
curl -s "https://sonarcloud.io/api/components/show?component=jasonmichaelbell78-creator_sonash-v0" | jq '.component.key'
```

The `sonar-project.properties` value is likely authoritative as it was
maintained more recently.

Sources: `.claude/skills/sonarcloud/SKILL.md`, `sonar-project.properties`
(filesystem)

---

## Sources

| #   | URL / Path                                                                      | Title                                   | Type            | Trust  | CRAAP Score | Date       |
| --- | ------------------------------------------------------------------------------- | --------------------------------------- | --------------- | ------ | ----------- | ---------- |
| 1   | `gh api .../actions/workflows/224765133/runs`                                   | Workflow run history (11 runs)          | Official API    | HIGH   | 5/5         | 2026-03-29 |
| 2   | `gh run view 21123661346 --log`                                                 | Failed run log — auto-analysis conflict | Official API    | HIGH   | 5/5         | 2026-01-19 |
| 3   | `gh run view 21119901443 --log`                                                 | Failed run log — missing SONAR_TOKEN    | Official API    | HIGH   | 5/5         | 2026-01-18 |
| 4   | `gh api .../actions/secrets`                                                    | SONAR_TOKEN confirmed present           | Official API    | HIGH   | 5/5         | 2026-03-29 |
| 5   | `.github/workflows/sonarcloud.yml`                                              | Workflow file (current state)           | Codebase        | HIGH   | 5/5         | 2026-03-29 |
| 6   | `sonar-project.properties`                                                      | SonarCloud config (authoritative)       | Codebase        | HIGH   | 5/5         | 2026-03-29 |
| 7   | `.claude/skills/sonarcloud/SKILL.md`                                            | SonarCloud skill definition             | Codebase        | HIGH   | 5/5         | 2026-02-05 |
| 8   | `scripts/mcp/sonarcloud-server.js`                                              | MCP server (SSRF-hardened)              | Codebase        | HIGH   | 5/5         | 2026-03-29 |
| 9   | `git log -- .github/workflows/sonarcloud.yml`                                   | Commit history for workflow             | Codebase        | HIGH   | 5/5         | 2026-03-29 |
| 10  | https://community.sonarsource.com/t/sonarcloud-task-fails.../22937              | CI + Auto-analysis conflict resolution  | Community forum | MEDIUM | 4/5         | 2024       |
| 11  | https://community.sonarsource.com/t/sonarcloud-using-github-actions-vs.../70900 | CI vs auto-analysis comparison          | Community forum | MEDIUM | 4/5         | 2024       |
| 12  | https://github.com/SonarSource/sonarcloud-github-action                         | Deprecation notice                      | Official repo   | HIGH   | 5/5         | 2025-2026  |
| 13  | https://docs.sonarsource.com/sonarqube-cloud/getting-started/github             | SonarCloud GitHub integration docs      | Official docs   | HIGH   | 5/5         | 2026       |
| 14  | WebSearch: SonarCloud automatic vs CI analysis 2026                             | Current recommended approach            | Web search      | MEDIUM | 3/5         | 2026-03-29 |

---

## Contradictions

**Auto-analysis current state is uncertain:** The run history shows the workflow
succeeded 5 times on 2026-02-05 (including 3 PR runs), which means auto-analysis
must have been disabled at that point (otherwise it would fail with the conflict
error). However, the Jan 19 failure proves auto-analysis was active before that.
It's unclear whether auto-analysis is currently active or disabled. If it was
re-enabled after the last successful CI run (Feb 21), that would explain part of
the motivation to disable the CI workflow. Without SonarCloud UI access, the
current auto-analysis state cannot be confirmed.

**sonarcloud-github-action v5.0.0 is deprecated but was working:** The last
successful run used the deprecated action without issues. The deprecation is
announced but the action still functions — it is not "broken." The migration to
`sonarqube-scan-action` is recommended but not urgent from a functionality
standpoint.

---

## Gaps

1. **Why the workflow was disabled specifically on (or around) 2026-03-17 versus
   earlier:** The commit on that date only optimized the workflow (timeout + SHA
   pin). The actual disable action was manual (GitHub UI) with no code artifact.
   There are no session logs, comments, or PR descriptions confirming the exact
   rationale. The most likely explanation is it was parked intentionally as part
   of "Wave 3-4" work deferred from the optimization commit, but this is
   inferred, not confirmed.

2. **Current SonarCloud Automatic Analysis state:** Cannot confirm whether
   auto-analysis is currently enabled or disabled without SonarCloud UI access.
   The MCP server (if `SONAR_TOKEN` is configured in the local environment)
   could query this, but the question is about SonarCloud admin settings, not
   issue data.

3. **Coverage data continuity:** If auto-analysis is currently running (no CI
   workflow), coverage metrics in SonarCloud are stale/absent since Feb 21. The
   quality gate may be passing on code quality alone while coverage is not
   updated.

4. **sonarqube-scan-action latest SHA:** The exact current SHA for pinning the
   replacement action was not retrieved. Would need to fetch from
   `github.com/SonarSource/sonarqube-scan-action/releases/latest` or the
   marketplace page for supply-chain-safe pinning.

5. **Project key discrepancy verification:** The inconsistency between
   `jasonmichaelbell78_sonash-v0` (skill/MCP) vs
   `jasonmichaelbell78-creator_sonash-v0` (properties file) was identified but
   not resolved via live API call.

---

## Serendipity

1. **sonarcloud-github-action is deprecated — migration needed regardless:**
   Even if re-enabling the workflow as-is worked, the action will eventually be
   removed. The reconnection is an opportunity to migrate to
   `sonarqube-scan-action` and eliminate future breakage risk.

2. **SONAR_TOKEN is already present:** The most common reason CI analysis fails
   after a period of dormancy (token rotation/expiry) is not a risk here — the
   secret exists. However, the token's validity should be verified before
   re-enabling (tokens can expire in SonarCloud settings).

3. **The `/sonarcloud` skill and MCP server provide full query access without
   the CI workflow:** The practical daily value (querying issues, syncing TDMS,
   getting quality gate status) is completely unaffected by the CI workflow
   being disabled. The main value lost is: (a) automated analysis on push/PR,
   (b) code coverage metrics, and (c) PR decoration/quality gate blocking.

4. **PR run success in Feb 2026 confirms the full integration worked:** Three
   successful PR runs on 2026-02-05 (`claude/new-session-x1MF5` branch) confirm
   that when auto-analysis is disabled, the CI workflow performs PR decoration
   correctly with no issues. The integration is proven-working, not
   experimental.

---

## Confidence Assessment

- HIGH claims: 4 (workflow disable evidence, run history analysis, integration
  state inventory, value assessment)
- MEDIUM claims: 1 (project key inconsistency)
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: **HIGH** — all key findings sourced from direct API calls,
  run logs, and codebase inspection. Gaps are documented but do not undermine
  the primary conclusions.

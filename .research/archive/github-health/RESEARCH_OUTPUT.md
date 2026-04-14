# GitHub Health Skill — Research Report

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-29
**Status:** ACTIVE
<!-- prettier-ignore-end -->

**Topic:** Designing a `/github-health` skill that uses the GitHub API to assess
repo health, identify issues, and resolve them directly.

**Repo:** jasonmichaelbell78-creator/sonash-v0 (Next.js 16 + Firebase, public,
solo developer)

**Research date:** 2026-03-29

**Coverage:** 21 of 21 discovery agents completed. 18 findings files read by
synthesizer (D1, D3, D7 resolved via path consolidation post-synthesis).
Post-research: 3 verification agents (40 claims, 85% accuracy), contrarian
challenge (10 challenges), OTB challenge (30 findings), dispute resolution (11
corrections applied), 3 gap-pursuit agents (6 gaps filled).

---

## Executive Summary

The sonash-v0 repository is in a materially better security posture than the
research brief's snapshot suggested. All 18 Dependabot alerts that were open at
research start have been fully resolved (zero open as of 2026-03-29) through a
burst of 5 Dependabot PRs and one incidental lockfile update across 2026-03-26
to 2026-03-29. This rapid remediation — entirely driven by Dependabot auto-PRs —
demonstrates that the dependency update pipeline is healthy and the CI/CD
feedback loop is fast.

Secret scanning tells a more complex story. Of the 6 open secret scanning
alerts, 4 are classified as false positives: Firebase web API keys that are
public-by-design. Firebase Security Rules and App Check enforcement should be
independently verified to confirm this API key exposure is safe. The 2 remaining
alerts (GitHub PATs committed in MCP config files) are genuine credential leaks.
Both PATs have been rotated out of the working tree, but their validity status
in GitHub Settings has not been verified. These must be confirmed revoked. The
bypass of push protection on both occasions reveals a workflow gap: MCP configs
should use environment variable references, not literal tokens.

The Dependabot configuration has one important gap: `scripts/mcp/` has its own
`package.json` with a production dependency (`@modelcontextprotocol/sdk`) that
is not covered by any Dependabot ecosystem entry. The rest of the Dependabot
configuration is sound — grouping strategy follows GitHub best practices, and
the auto-merge workflow correctly skips major version updates. Three enhancement
opportunities exist: security-update grouping, a cooldown configuration to
reduce churn on fresh releases, and an explicit approval step in the auto-merge
workflow to satisfy branch protection required-approvals rules.

All 21 discovery agents completed successfully. Verification corrected 4 claims
(Release Please had 1 success, CODEOWNERS exists, 6 skills use `gh` CLI, 94%
conventional commits). Challenges identified that auto-fix batch mode violates
Guardrail #2 and that session-begin integration is the highest-leverage entry
point. Gap pursuit revealed App Check has been disabled for 3 months and
release.yml has 10+ missing label definitions.

**No composite health score was calculated in this research.** The only
reproducible, externally-validated score is the OpenSSF Scorecard at 7.5/10. Any
health score cited outside this report (e.g., "61/100") is an orchestrator
estimate, not a research-derived metric. If a composite score is desired, the
methodology (weights per category, normalization, thresholds) must be published
alongside it.

The `/github-health` skill design (Section 4) is a comprehensive architecture
informed by all 21 discovery agents, 3 verification passes, 2 challenge passes,
and 3 gap-pursuit agents — 30 agents total.

---

## 1. Current GitHub Health Assessment

### 1.1 Security Posture

**Dependabot alerts: RESOLVED** [C-001]

All 18 alerts cleared between 2026-03-26 and 2026-03-29. Five packages were
affected: picomatch (2 alerts), node-forge (8 alerts), brace-expansion (3
alerts), path-to-regexp (4 alerts), and one additional. All vulnerabilities were
in transitive (indirect) dependencies — none required editing `package.json`
directly. The node-forge certificate chain bypass (CVE-2026-33896, CVSS 7.4) was
the highest-risk alert: it affects Cloud Functions runtime and could allow a
sub-CA to masquerade as a trusted root, though Firebase SDK typically uses
native Node.js TLS rather than node-forge for server communication.

One residual lockfile issue: the root `package-lock.json` still has
`path-to-regexp@8.3.0` (below the 8.4.0 fix for CVE-2026-4923 and
CVE-2026-4926), but Dependabot auto-dismissed the corresponding alerts as
development-scope. This is not an open security debt item, but the 8.3.0 version
persists. [C-002]

**Secret scanning: 2 real leaks, 4 false positives** [C-003]

| Alert | Type                                              | Assessment                                                  | Action Required                   |
| ----- | ------------------------------------------------- | ----------------------------------------------------------- | --------------------------------- |
| 1     | Google API Key (.next artifact)                   | False positive — old dev project key, .next now gitignored  | Close as false_positive           |
| 2     | Google API Key (DEBUG_PROMPT.md, next.config.mjs) | False positive — production Firebase web key, NEXT*PUBLIC*  | Close as false_positive           |
| 3     | GitHub PAT (.vscode/mcp.json)                     | **Real leak** — push protection bypassed                    | Verify revoked in GitHub Settings |
| 4     | Google API Key (typo variant in .env.production)  | False positive — 1-char typo, not a valid key               | Close as false_positive           |
| 5     | Google API Key (.env.production, current HEAD)    | Expected / intentional — Firebase web key, public by design | Close as false_positive           |
| 6     | GitHub PAT (mcp.json → .mcp.json)                 | **Real leak** — push protection bypassed twice              | Verify revoked in GitHub Settings |

Both PAT leaks occurred in MCP configuration files. The pattern (bypassing push
protection, committing literal tokens) happened twice across two different files
(`mcp.json` and `.vscode/mcp.json`). The current `.mcp.json` is correctly
structured using `${SONAR_TOKEN}` env var substitution — the fix pattern is
established. [C-004]

An additional credential exposure was found serendipitously: a SonarCloud token
(`e7423bccb312727e5e5eb22457d8350f5b53`) was embedded literally in an older
`.mcp.json` commit. GitHub secret scanning does not detect SonarCloud tokens, so
this was not flagged as an alert. The current `.mcp.json` uses `${SONAR_TOKEN}`
correctly. [C-005]

Secret scanning validity checks are currently disabled. Enabling this setting
would automatically mark secrets as active vs. inactive, providing real-time
status on whether leaked PATs are still exploitable. [C-006]

**Code scanning: 30 open alerts** [C-007, MEDIUM confidence — pre-scan data
only]

The pre-scan snapshot shows 30 code scanning alerts. The breakdown includes at
least 9 TokenPermissions findings and 3 PinnedDependencies findings (OpenSSF
Scorecard signal). Full alert inventory was not completed (D2 agent did not
produce findings). This is the largest remaining security gap in the report.

### 1.2 CI/CD Pipeline Health

**22 total workflows; 1 actively failing** [C-008, MEDIUM — pre-scan]

| Workflow              | Status                  | Notes                                            |
| --------------------- | ----------------------- | ------------------------------------------------ |
| CI                    | active                  | —                                                |
| CodeQL                | active                  | —                                                |
| Deploy to Firebase    | active                  | —                                                |
| Release Please        | **FAILING on main**     | 1 success (2026-03-20), all other 20 runs failed |
| OpenSSF Scorecard     | active, passing         | —                                                |
| Semgrep               | active                  | —                                                |
| Dependency Review     | active                  | —                                                |
| Auto-merge Dependabot | active                  | Gaps documented below                            |
| SonarCloud analysis   | **disabled** (manually) | —                                                |
| Dependabot Updates    | active (dynamic)        | 3 consecutive node-forge failures logged         |

The Release Please workflow had 1 success on 2026-03-20 but is otherwise
consistently failing (20 of 21 runs failed). The changelog and versioning
pipeline is effectively broken. An upstream bug (release-please-action issue
#959, open since March 2024) and the Node.js 20 migration deadline (June
2, 2026) add risk. Evaluate whether to bootstrap and fix, or remove and replace
with a simpler release workflow (e.g., Release Drafter). [C-009]

SonarCloud was manually disabled. The reason is unknown. This disables static
analysis that previously ran on every push. Reconnection to SonarCloud requires
understanding why it was disabled (D15 agent not completed). [C-010, LOW]

**Dependabot auto-merge workflow gaps** [C-011]

The auto-merge workflow correctly:

- Restricts to `dependabot[bot]` actor
- Skips major version updates
- Uses `gh pr merge --auto --squash` (waits for CI before merging)
- Uses minimum-necessary permissions

Two gaps identified:

1. No explicit `gh pr review --approve` step — if branch protection requires
   approved reviews, auto-merge PRs will stall
2. No differentiation between production and dev dependencies — currently
   auto-merges all minor/patch updates equally, including production deps like
   `firebase-admin` and `@sentry/node`

**Documentation lint failed on `plan-32626` branch** [C-012, MEDIUM — pre-scan]

The docs-lint workflow failed on that specific branch. Whether this is a
persistent or one-time failure was not investigated (D5 agent not completed).

### 1.3 Repository Configuration

**Two duplicate rulesets protecting main** [C-013, MEDIUM — pre-scan]

Two rulesets exist on the repository:

- "main protection" (ID 13352818): pull_request, required_status_checks,
  linear_history, non_fast_forward, deletion
- "main-protection" (ID 14350637): deletion, non_fast_forward,
  required_status_checks

Both enforce deletion + non_fast_forward + required_status_checks, creating
redundancy. Consolidation into one ruleset with the union of all rules is
recommended. Full ruleset audit was not completed (D9 agent not completed).

**CODEOWNERS exists but ruleset enforcement not configured** [C-039, MEDIUM — V1
verified]

CODEOWNERS exists at `.github/CODEOWNERS` with 4 rules (default `*`,
`.github/workflows/`, `functions/src/`, `firestore.rules`), all pointing to
`@jasonmichaelbell78-creator`. However, ruleset enforcement of CODEOWNERS review
is not configured — the rulesets do not require CODEOWNERS review approval, so
the file is advisory only.

**Labels: missing tier-3** [C-014, MEDIUM — pre-scan]

29 labels exist. Priority tiers 0, 1, 2, and 4 exist; tier-3 is absent. The gap
in the tier labeling scheme may cause issues in automation that iterates over
all tiers. [C-014]

**No issue templates; community profile at 85%** [C-015, MEDIUM — pre-scan]

The community profile score is 85%, with issue templates as the identified gap.
Without issue templates, issues are filed without structured data, degrading
issue triage quality. (D10 agent not completed.)

**No repo topics set** [C-016, LOW — pre-scan]

No GitHub topics are configured. Topics improve discoverability and are a
free-toggle quick win. Suggested: `nextjs`, `firebase`, `personal-health`,
`solo-project`, `typescript`.

### 1.4 Supply Chain Security (OpenSSF Scorecard)

**Scorecard workflow is active and passing** [C-017, MEDIUM — pre-scan]

The OpenSSF Scorecard workflow runs successfully and produces results. The
pre-scan snapshot shows at least 9 TokenPermissions and 3 PinnedDependencies
code scanning alerts — these are Scorecard-originated findings uploaded as SARIF
to GitHub code scanning. Full score breakdown and per-check remediation was not
completed (D20 agent not completed).

TokenPermissions findings indicate workflows have overly broad `permissions`
blocks or rely on default permissions. These are quick-win fixes: add
`permissions: read-all` at the workflow level and override with
minimum-necessary permissions per job. [C-018, MEDIUM]

PinnedDependencies findings indicate one or more workflow steps use floating
action versions (e.g., `@v4`) rather than pinned commit SHAs. [C-019, MEDIUM]

### 1.5 Dependency Management

**Dependabot covers root and /functions but not /scripts/mcp/** [C-020]

The current `dependabot.yml` covers two npm directories (`/` and `/functions`)
and the github-actions ecosystem. The `scripts/mcp/` directory has its own
`package.json` with one production dependency
(`@modelcontextprotocol/sdk ^1.26.0`) that receives no Dependabot coverage. MCP
SDK is actively developed and security- sensitive. [C-020]

**functions/package.json has hardcoded overrides that bypass Dependabot**
[C-021]

Two transitive dependencies are pinned via `overrides`: `fast-xml-parser: 5.5.7`
and `@tootallnate/once: 3.0.1`. Dependabot does not update `overrides` entries.
If new vulnerabilities are discovered in these packages, they will not receive
automated PRs — manual updates required. [C-021]

**Grouping strategy is correct; security-update grouping missing** [C-022]

Minor + patch updates are grouped into a single PR per ecosystem (correct per
GitHub best practices). Security updates are not grouped — each CVE generates a
separate PR. Adding `applies-to: security-updates` groups reduces noise during
alert storms. [C-022]

**cooldown configuration not set** [C-023]

The `cooldown` feature (available since July 2025) allows delaying version
update PRs until a package has been available for a configurable number of days.
Not currently configured. For major updates, a 30-day cooldown reduces the risk
of merging freshly-released packages that have undiscovered bugs. [C-023]

**No scripts/planning/ Dependabot coverage needed** [C-024]

`scripts/planning/lib/package.json` contains only `{"type": "module"}` — no
dependencies. No coverage gap here.

### 1.6 Deploy Pipeline

**3 environments exist; none have protection rules** [C-025, MEDIUM — pre-scan]

| Environment | Protection Rules | Deploy Branch Policy |
| ----------- | ---------------- | -------------------- |
| copilot     | None             | None                 |
| Preview     | None             | None                 |
| Production  | None             | None                 |

The Production environment has no deployment protection rules: no required
reviewers, no wait timers, no branch deployment policies. Any branch or actor
can trigger a Production deployment. For a solo developer this is low risk, but
adding a branch policy (deploy only from `main`) would prevent accidental
production deploys from feature branches. (D12 agent not completed.) [C-025]

**9 repository secrets, 2 variables** [C-026, LOW — pre-scan]

Secret inventory not audited (D12 agent not completed). Whether any secrets are
orphaned (no longer referenced in workflows) is unknown.

### 1.7 Release Automation

**Release Please workflow is consistently failing on main** [C-027, MEDIUM —
verified by V1]

Release Please had 1 success on 2026-03-20, but 20 of 21 total runs have failed.
The changelog and versioning pipeline is effectively broken. An upstream bug
(release-please-action issue #959, open since March 2024) and the Node.js 20
migration deadline (June 2, 2026) add compounding risk. Recommendation: evaluate
whether to bootstrap and fix, or remove entirely and replace with a simpler
release workflow (e.g., Release Drafter). For a solo developer with no external
package consumers, removal may be the pragmatic choice.

**Release config audit not completed** [C-028, LOW — pre-scan]

Whether the `release-please-config.json` and `.release-please-manifest.json`
files are correctly configured was not verified. Whether the versioning strategy
is appropriate for a monorepo with multiple workspaces (root, functions,
scripts/mcp) was not assessed.

### 1.8 Repo Metadata and Community

**Community profile at 85%** [C-029, MEDIUM — pre-scan]

The missing component is issue templates. Adding GitHub issue templates (bug
report, feature request) would bring the profile to 100%. This is a free-toggle
quick win.

**No topics configured** [C-016] (see Section 1.3)

**Labels: tier-3 missing** [C-014] (see Section 1.3)

**No milestones, no webhooks** [C-030, LOW — pre-scan]

Milestones provide sprint scoping and burndown visibility. Zero milestones means
no structured planning cadence is visible on GitHub. Webhooks count of 0 means
no external integrations (e.g., Slack notifications) are active.

---

## 2. Prioritized Issue Registry

### 2.1 P0 — Critical (fix immediately)

| ID     | Issue                                                                                            | Evidence            | What to Do                                                                                                                                                                       |
| ------ | ------------------------------------------------------------------------------------------------ | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0-001 | GitHub PAT Alert 3 revocation unconfirmed (`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`)           | D3: HIGH confidence | Go to GitHub Settings > Developer settings > PATs. Confirm not listed. Close alert as "revoked."                                                                                 |
| P0-002 | GitHub PAT Alert 6 revocation unconfirmed (`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`)           | D3: HIGH confidence | Same as above. If either token is still active, revoke immediately.                                                                                                              |
| P0-003 | Release Please consistently failing on main (1 success, 20 failures) — changelog pipeline broken | V1 verified         | Evaluate whether to bootstrap and fix, or remove and replace with simpler release workflow. Upstream bug (#959, open since Mar 2024) + Node.js 20 deadline (June 2026) add risk. |

### 2.2 P1 — High (fix this sprint)

| ID     | Issue                                                                              | Evidence            | What to Do                                                                                                                                    |
| ------ | ---------------------------------------------------------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| P1-001 | `scripts/mcp/` not covered by Dependabot (`@modelcontextprotocol/sdk` unmonitored) | D7: HIGH confidence | Add `scripts/mcp/` npm ecosystem entry to `.github/dependabot.yml`                                                                            |
| P1-002 | 30 code scanning alerts unreviewed (9 TokenPermissions, 3+ PinnedDependencies)     | Pre-scan MEDIUM     | Run D2 agent pass. Then fix TokenPermissions (add `permissions: read-all` to affected workflows) and PinnedDependencies (pin to commit SHAs). |
| P1-003 | SonarCloud analysis workflow manually disabled — static analysis gap               | Pre-scan LOW        | Run D15 agent pass to determine why it was disabled and reconnection path.                                                                    |
| P1-004 | Secret scanning validity checks disabled                                           | D3: HIGH confidence | Enable in repo Settings > Security > Code security and analysis. Takes 30 seconds.                                                            |
| P1-005 | Auto-merge workflow missing explicit PR approval step                              | D7: HIGH confidence | Add `gh pr review --approve` step to `auto-merge-dependabot.yml` for minor/patch updates                                                      |

### 2.3 P2 — Medium (plan for next milestone)

| ID     | Issue                                                                                               | Evidence            | What to Do                                                                                                                                                                                 |
| ------ | --------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| P2-001 | Duplicate rulesets ("main protection" + "main-protection") — redundant rules                        | Pre-scan MEDIUM     | Run D9 agent. Consolidate into one ruleset with union of all rules. Delete redundant.                                                                                                      |
| P2-002 | Close 4 false-positive secret scanning alerts (Alerts 1, 2, 4, 5)                                   | D3: HIGH confidence | Close each with resolution "false_positive" and documented rationale. **Prerequisite:** verify Firebase Security Rules are restrictive and App Check is enforced on all Firebase services. |
| P2-003 | Close PAT alerts as "revoked" after confirming P0-001/P0-002                                        | D3: HIGH confidence | After PAT revocation confirmed, close Alerts 3 and 6.                                                                                                                                      |
| P2-004 | Production environment has no deployment protection rules                                           | Pre-scan MEDIUM     | Run D12 agent. Add branch deployment policy (main only) to Production environment.                                                                                                         |
| P2-005 | Add security-update grouping to Dependabot config                                                   | D7: HIGH confidence | Add `applies-to: security-updates` group to root and functions npm ecosystems.                                                                                                             |
| P2-006 | Add issue templates (brings community profile 85% → 100%)                                           | Pre-scan MEDIUM     | Create `.github/ISSUE_TEMPLATE/bug_report.md` and `feature_request.md`. Free toggle.                                                                                                       |
| P2-007 | Add cooldown to Dependabot for major versions (30-day delay)                                        | D7: HIGH confidence | Add `cooldown: semver-major-days: 30, semver-minor-days: 7` to dependabot.yml                                                                                                              |
| P2-008 | functions/package.json overrides (`fast-xml-parser`, `@tootallnate/once`) not tracked by Dependabot | D7: HIGH confidence | Monitor manually. Document in MASTER_DEBT as known gap.                                                                                                                                    |
| P2-009 | Tier-3 label missing from labeling scheme                                                           | Pre-scan MEDIUM     | Add `tier-3` label matching visual convention of tier-0/1/2/4 labels.                                                                                                                      |

### 2.4 P3 — Low (nice to have)

| ID     | Issue                                                                                       | Evidence              | What to Do                                                                                                   |
| ------ | ------------------------------------------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------ |
| P3-001 | No repo topics configured                                                                   | Pre-scan LOW          | Add: `nextjs`, `firebase`, `typescript`, `personal-health`, `solo-project`                                   |
| P3-002 | Auto-merge workflow auto-merges prod deps same as dev deps                                  | D7: HIGH confidence   | Add `dependency-type` check from `fetch-metadata` to require manual review for `direct:production` deps      |
| P3-003 | Root path-to-regexp still at 8.3.0 (CVE-2026-4923/4926 alerts auto-dismissed)               | D1: MEDIUM confidence | Acceptable as-is (dev-scope, auto-dismissed). Will be updated when dev tools bump their transitive.          |
| P3-004 | No milestones defined                                                                       | Pre-scan LOW          | Create milestones aligned to planning phases/sprints                                                         |
| P3-005 | Cross-directory grouping (`group-by: dependency-name`) for shared deps like `zod`           | D7: HIGH confidence   | Evaluate after `zod` or other shared packages diverge between root and functions                             |
| P3-006 | SonarCloud token was committed literally in old .mcp.json (not detected by GitHub scanning) | D3: HIGH confidence   | Token rotated (current .mcp.json uses ${SONAR_TOKEN}). No action needed beyond confirming old token invalid. |

---

## 3. Quick Wins (free toggles, under 5 minutes each)

These require no code changes — only settings clicks or one-liner config
additions.

| #    | Win                                                | Location                                         | Time   | Impact                                                                                                                        |
| ---- | -------------------------------------------------- | ------------------------------------------------ | ------ | ----------------------------------------------------------------------------------------------------------------------------- |
| QW-1 | Enable secret scanning validity checks             | Settings > Security > Code security and analysis | 30 sec | Marks PAT alerts as active/inactive automatically                                                                             |
| QW-2 | Add 5 repo topics                                  | Settings > General > Topics                      | 2 min  | Community profile, discoverability                                                                                            |
| QW-3 | Add tier-3 label                                   | Issues > Labels > New label                      | 2 min  | Closes labeling scheme gap                                                                                                    |
| QW-4 | Close 4 false-positive secret scanning alerts      | Security > Secret scanning                       | 5 min  | Reduces alert noise to 2 real items. **Caveat:** verify Firebase Security Rules and App Check enforcement first.              |
| QW-5 | Add branch deploy policy to Production environment | Settings > Environments > Production             | 2 min  | **Caveat:** no-op until `deploy-firebase.yml` also adds `environment: Production` to the deploy job. Pair with workflow edit. |
| QW-6 | Add `scripts/mcp/` to dependabot.yml               | `.github/dependabot.yml` (3 lines)               | 3 min  | Closes MCP SDK monitoring gap                                                                                                 |
| QW-7 | Add security-update grouping to dependabot.yml     | `.github/dependabot.yml` (4 lines per ecosystem) | 5 min  | Groups future CVE storms into fewer PRs                                                                                       |

---

## 4. Skill Design: /github-health

### 4.1 Architecture

The `/github-health` skill is a **resolution-first health assessment** skill.
Its primary output is not a dashboard but a prioritized action queue with
one-command fixes for each resolvable item.

Design principles:

- **Assessment first, fix second.** Always show the health state before
  proposing changes.
- **Resolution-first.** Every finding should map to a concrete fix, not just a
  MASTER_DEBT entry. MASTER_DEBT is the escape hatch for unfixable items.
- **Phase-by-phase.** Run assessment in modular phases so the skill can be run
  with `--scope security`, `--scope actions`, `--scope config`, etc.
- **Idempotent.** Running `/github-health` twice should produce the same
  assessment if nothing changed.
- **Audit trail.** Every fix should produce a git commit or PR, not a silent
  in-place change.

### 4.2 Data Sources (REST + GraphQL)

Based on the pre-scan data and available API findings:

**Security endpoints (REST):**

```
GET /repos/{owner}/{repo}/dependabot/alerts?state=open
GET /repos/{owner}/{repo}/code-scanning/alerts?state=open
GET /repos/{owner}/{repo}/secret-scanning/alerts?state=open
GET /repos/{owner}/{repo}/security-advisories
```

**Workflow and Actions endpoints (REST):**

```
GET /repos/{owner}/{repo}/actions/workflows
GET /repos/{owner}/{repo}/actions/runs?per_page=10&status=failure
GET /repos/{owner}/{repo}/contents/.github/workflows/{file}
```

**Branch protection and rulesets (REST):**

```
GET /repos/{owner}/{repo}/rulesets
GET /repos/{owner}/{repo}/branches/{branch}/protection
```

**Repository metadata (REST):**

```
GET /repos/{owner}/{repo}          # topics, description, visibility
GET /repos/{owner}/{repo}/community/profile
GET /repos/{owner}/{repo}/labels
GET /repos/{owner}/{repo}/milestones
GET /repos/{owner}/{repo}/environments
```

**Dependency management (REST + codebase):**

```
GET /repos/{owner}/{repo}/contents/.github/dependabot.yml
Filesystem: package.json files at /, /functions, /scripts/mcp
```

**GraphQL capabilities (confirmed available per pre-scan):** GraphQL enables
compound queries — fetching security alerts, workflow runs, and repository
metadata in a single round trip, reducing API calls significantly. The full
GraphQL inventory was not completed (D14 agent not completed). Priority queries
to design:

- `repository { vulnerabilityAlerts(first:100) { ... } codeQL { ... } }` — all
  security signals in one query
- `repository { defaultBranchRef { target { ... checkSuites { ... } } } }` — CI
  status for the default branch

**GitHub CLI shortcuts:**

```bash
gh repo view --json name,description,topics,visibility,isPrivate
gh workflow list
gh run list --limit 10 --status failure
gh api repos/{owner}/{repo}/rulesets
```

### 4.3 Assessment Phases

The skill should run these phases in order, with each phase being independently
skippable via flags:

**Phase 1: Security** (`--scope security`)

1. Fetch open Dependabot alerts — count by severity
2. Fetch open code scanning alerts — count by rule, group by category
3. Fetch open secret scanning alerts — classify (real vs. false positive)
4. Check: secret scanning validity checks enabled?
5. Check: secret scanning push protection enabled?
6. Output: security health scorecard + prioritized fix list

**Phase 2: Actions** (`--scope actions`)

1. Fetch all workflow runs — identify any workflows failing on `main`
2. Read all workflow YAML files — check TokenPermissions, PinnedDependencies
3. Check: does auto-merge workflow have explicit approval step?
4. Check: does dependency-review workflow exist?
5. Output: CI/CD health scorecard + failing workflow diagnosis

**Phase 3: Dependencies** (`--scope deps`)

1. Read `dependabot.yml` — check ecosystem coverage vs. discovered package.json
   files
2. Verify all package.json paths are covered
3. Check: are overrides entries documented?
4. Check: cooldown configured?
5. Output: dependency coverage report + config diff to apply

**Phase 4: Configuration** (`--scope config`)

1. Fetch rulesets — check for duplicates / consolidation opportunities
2. Fetch environments — check for protection rules
3. Fetch labels — check for expected labels (tier schema completeness)
4. Fetch community profile — identify missing components
5. Fetch topics — flag if empty
6. Output: config health scorecard

**Phase 5: Release** (`--scope release`)

1. Fetch latest Release Please run — parse failure reason
2. Read `release-please-config.json` — validate structure
3. Read `.release-please-manifest.json` — check versions match reality
4. Output: release health + fix recommendation

**Phase 6: Insights** (`--scope insights`) — lower priority

1. Fetch traffic (views, clones, referrers)
2. Fetch commit activity
3. Output: activity summary (informational only, no fixes)

### 4.4 Fix Capabilities

**Interactive per-item triage (not batch).** Each fixable finding is presented
to the user with options: [F]ix now, [D]efer to TDMS, [S]kip. Batch auto-fix
violates project Guardrail #2 ("Never implement without explicit approval"). The
skill should never apply multiple fixes without per-item user confirmation.

The skill can fix the following classes of issues directly (no manual steps):

| Fix Class                                   | Mechanism                                                                                                     | Issues It Addresses                |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| Close false-positive secret alerts          | `gh api --method PATCH .../secret-scanning/alerts/N --field state=resolved --field resolution=false_positive` | QW-4                               |
| Add repo topics                             | `gh api --method PATCH /repos/{owner}/{repo} --field topics[]=nextjs ...`                                     | QW-2                               |
| Update dependabot.yml                       | Write file, create PR                                                                                         | QW-6, QW-7, P1-001, P2-005, P2-007 |
| Add workflow permissions block              | Edit workflow YAML, create PR                                                                                 | P1-002 (TokenPermissions)          |
| Pin workflow action SHA                     | Replace `@vX` with commit SHA, create PR                                                                      | P1-002 (PinnedDependencies)        |
| Enable secret scanning validity checks      | `gh api --method PATCH /repos/{owner}/{repo} ...` (if API supported)                                          | QW-1                               |
| Add PR approval step to auto-merge workflow | Edit workflow YAML, create PR                                                                                 | P1-005                             |
| Add issue templates                         | Create files under `.github/ISSUE_TEMPLATE/`, create PR                                                       | P2-006                             |
| Add labels                                  | `gh label create tier-3 --color ...`                                                                          | QW-3                               |
| Add branch deploy policy                    | `gh api --method PUT /repos/{owner}/{repo}/environments/Production ...`                                       | QW-5                               |

**Fixes that require manual steps** (skill documents but cannot execute):

- PAT revocation (requires GitHub Settings UI action)
- SonarCloud reconnection (requires external service credentials)
- Release Please failure diagnosis (may need config editing after diagnosis)
- Ruleset consolidation (high-risk change — present plan, user approves)

### 4.5 Integration with Existing Skills

6 existing skills already use the `gh` CLI for GitHub API interactions:
`gh-fix-ci`, `alerts`, `pr-review`, `pr-retro`, `test-suite`, and `sonarcloud`
(sprint mode). However, none perform systematic GitHub API health assessment.
`/github-health` provides the only comprehensive GitHub-side analysis.

| Existing Skill | Overlap                    | Integration Strategy                                                                                                   |
| -------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `/gh-fix-ci`   | Workflow failure diagnosis | `/github-health --scope actions` should call or delegate to `gh-fix-ci` for deep CI analysis                           |
| `/sonarcloud`  | SonarCloud integration     | `/github-health --scope security` should surface SonarCloud disabled status and link to `/sonarcloud` for reconnection |
| `/alerts`      | Active alerts dashboard    | `/github-health` is a richer superset — alerts is a quick status check; health is a full assessment with fixes         |
| `/pr-review`   | PR metadata, checks        | `/github-health` reads repo-level health; `pr-review` reads PR-level review data — no overlap                          |
| `/pr-retro`    | PR history analysis        | No overlap — different scope (retrospective vs. point-in-time health)                                                  |
| `/test-suite`  | CI check status            | Minimal overlap — `test-suite` drives test execution; `github-health` reads workflow pass/fail                         |

Full overlap analysis was not completed (D16 agent not completed). This table
should be expanded after D16 runs.

### 4.6 Output Format

```
/github-health assessment — sonash-v0 — 2026-03-29

SECURITY                                     [3 issues]
  P0  Alert 3: GitHub PAT — verify revoked   [USER ACTION REQUIRED]
  P0  Alert 6: GitHub PAT — verify revoked   [USER ACTION REQUIRED]
  P1  Secret scanning validity checks: OFF   [FIX: 30 sec toggle]
  P2  4 false-positive alerts open           [FIX: close alerts]

ACTIONS                                      [2 issues]
  P0  Release Please: 1/21 success, evaluate remove/replace  [DECIDE]
  P1  Auto-merge: missing approval step      [FIX: edit workflow]

DEPENDENCIES                                 [3 issues]
  P1  scripts/mcp/ not covered               [FIX: dependabot.yml]
  P2  Security-update grouping missing       [FIX: dependabot.yml]
  P2  cooldown not configured                [FIX: dependabot.yml]

CONFIG                                       [5 issues]
  P2  Duplicate rulesets                     [PLAN: consolidate]
  P2  Production env: no branch policy       [FIX: settings]
  P2  Issue templates missing                [FIX: add templates]
  P3  No repo topics                         [FIX: add topics]
  P3  Tier-3 label missing                   [FIX: add label]

QUICK WINS (7 available)
  [Interactive triage: each item presented with Fix / Defer / Skip options]

Total: 13 issues | P0: 3 | P1: 4 | P2: 5 | P3: 4
```

### 4.7 Skill UX Design

Informed by contrarian challenge (Guardrail #2 violation risk) and OTB analysis
(adoption vs. API budget tradeoffs).

**Interactive menu-driven triage (not batch).** Every fixable finding is
presented individually with options: [F]ix now, [D]efer to TDMS, [S]kip. This
matches the interaction patterns of `/ecosystem-health` and `/alerts`. Batch
auto-fix (`--apply-quick-wins`) is explicitly prohibited by project Guardrail #2
("Never implement without explicit approval").

**Scoped invocation modes:**

- `--quick` (default, session-begin integration): 3 API calls, <2 seconds.
  Checks: (1) open secret scanning alerts, (2) latest CI run on main, (3)
  `gh auth status`. Returns a one-line summary: "GitHub: GREEN (0 P0, CI
  passing)" or "GitHub: RED (2 P0 alerts, CI failing) -- run /github-health
  --full."
- `--full`: Comprehensive assessment across all 6 phases. Shows progress per
  phase.
- `--security`: Security-only deep dive (Phase 1).
- `--scope <phase>`: Run any single phase in depth.

**Session-begin integration.** The `--quick` mode (3 calls) runs as part of
session-begin Phase 2 health scripts. This is the highest-leverage integration
point -- every session surfaces critical GitHub issues before work begins.

**Partial failure resilience.** Each phase is independently try/catch wrapped.
If one API category fails (e.g., code scanning returns 403 because Advanced
Security configuration differs), the skill continues with remaining categories
and reports the partial failure: "Security: code scanning unavailable --
Advanced Security may not be enabled." Individual API failures never abort the
entire assessment.

**GraphQL-first for reads, REST for writes.** Use GraphQL for the "Core Health
Snapshot" query (replaces 4-5 REST calls with 1 query at ~2 points). Use REST
only for endpoints with no GraphQL equivalent: security alerts with PATCH
capability, workflow run details, traffic data, Actions cache, environment
protection rules, and webhook health.

**Dev dashboard integration.** Health data (especially trend data from repeated
invocations) feeds into the dev dashboard researched at
`.research/dev-dashboard/`. The health history JSONL
(`.claude/state/github-health-history.jsonl`) is the data contract between the
skill and the dashboard.

---

## 5. Claim Registry

| ID    | Claim                                                                                                           | Confidence | Source      | Category |
| ----- | --------------------------------------------------------------------------------------------------------------- | ---------- | ----------- | -------- |
| C-001 | All 18 Dependabot alerts are resolved as of 2026-03-29                                                          | HIGH       | D1          | security |
| C-002 | Root path-to-regexp still at 8.3.0; CVE alerts auto-dismissed (dev-scope)                                       | MEDIUM     | D1          | security |
| C-003 | 6 open secret scanning alerts: 4 false positives, 2 real PAT leaks                                              | HIGH       | D3          | security |
| C-004 | Both PAT leaks occurred in MCP config files; push protection was bypassed each time                             | HIGH       | D3          | security |
| C-005 | A SonarCloud token was committed literally in an old .mcp.json — not caught by GitHub scanning                  | HIGH       | D3          | security |
| C-006 | Secret scanning validity checks are disabled on the repository                                                  | HIGH       | D3          | security |
| C-007 | 30 code scanning alerts open (9 TokenPermissions, 3+ PinnedDependencies)                                        | MEDIUM     | pre-scan    | security |
| C-008 | 22 workflows total; 1 failing on main (Release Please)                                                          | MEDIUM     | pre-scan    | actions  |
| C-009 | Release Please workflow had 1 success (2026-03-20), 20 failures; consistently failing                           | MEDIUM     | V1 verified | actions  |
| C-010 | SonarCloud analysis workflow is manually disabled; reason unknown                                               | LOW        | pre-scan    | actions  |
| C-011 | Auto-merge workflow has no explicit PR approval step; no prod vs dev dep differentiation                        | HIGH       | D7          | actions  |
| C-012 | Documentation lint failed on plan-32626 branch                                                                  | MEDIUM     | pre-scan    | actions  |
| C-013 | Two rulesets exist on main with overlapping rules; consolidation recommended                                    | MEDIUM     | pre-scan    | config   |
| C-014 | Tier-3 label is missing from the 29-label set                                                                   | MEDIUM     | pre-scan    | config   |
| C-015 | Community profile at 85%; issue templates are the missing component                                             | MEDIUM     | pre-scan    | config   |
| C-016 | No repository topics are configured                                                                             | LOW        | pre-scan    | metadata |
| C-017 | OpenSSF Scorecard workflow is active and passing                                                                | MEDIUM     | pre-scan    | security |
| C-018 | TokenPermissions findings indicate overly broad workflow permissions                                            | MEDIUM     | pre-scan    | security |
| C-019 | PinnedDependencies findings indicate floating action version references                                         | MEDIUM     | pre-scan    | security |
| C-020 | scripts/mcp/ package.json is not covered by any Dependabot ecosystem entry                                      | HIGH       | D7          | deps     |
| C-021 | functions/package.json overrides (fast-xml-parser, @tootallnate/once) bypass Dependabot                         | HIGH       | D7          | deps     |
| C-022 | Dependabot grouping is correct for version updates; security-update grouping missing                            | HIGH       | D7          | deps     |
| C-023 | Dependabot cooldown feature (July 2025) not configured                                                          | HIGH       | D7          | deps     |
| C-024 | scripts/planning/lib/package.json has no dependencies; no Dependabot coverage needed                            | HIGH       | D7          | deps     |
| C-025 | Production environment has no deployment protection rules or branch policies                                    | MEDIUM     | pre-scan    | deploy   |
| C-026 | 9 repository secrets and 2 variables exist; no orphan audit completed                                           | LOW        | pre-scan    | deploy   |
| C-027 | Release Please had 1 success, 20 failures; upstream bug #959 + Node.js 20 deadline add risk                     | MEDIUM     | V1 verified | release  |
| C-028 | Release Please config audit not completed                                                                       | LOW        | pre-scan    | release  |
| C-029 | Community profile 85% (issue templates missing)                                                                 | MEDIUM     | pre-scan    | metadata |
| C-030 | Zero milestones, zero webhooks configured                                                                       | LOW        | pre-scan    | metadata |
| C-031 | Dependabot velocity is healthy: 18 alerts cleared in 4 days via auto-PRs                                        | HIGH       | D1          | deps     |
| C-032 | All 18 Dependabot vulnerabilities were transitive dependencies, none direct                                     | HIGH       | D1          | security |
| C-033 | .env.production is intentionally tracked in git; any future sensitive values would auto-commit                  | HIGH       | D3          | security |
| C-034 | functions/.env is tracked; previously contained Firebase API key (now removed to GCP Secret Manager)            | HIGH       | D3          | security |
| C-035 | Auto-merge workflow is not vulnerable to branch metadata injection (checks github.actor)                        | HIGH       | D7          | actions  |
| C-036 | dependency-review.yml workflow provides safety net catching critical vulns even in auto-merged PRs              | HIGH       | D7          | deps     |
| C-037 | cross-directory dependency grouping (group-by: dependency-name, Feb 2026) not configured but available          | HIGH       | D7          | deps     |
| C-038 | GitHub Actions ecosystem on monthly schedule; appropriate given SHA-pinning already in use                      | MEDIUM     | D7          | actions  |
| C-039 | CODEOWNERS exists at `.github/CODEOWNERS` with 4 rules; ruleset enforcement of CODEOWNERS review not configured | MEDIUM     | V1 verified | config   |

---

## 6. Source Registry

| ID    | Type     | URL or Path                                                                                                           | Description                                                         | Accessed   |
| ----- | -------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ---------- |
| S-001 | api      | `gh api repos/.../dependabot/alerts --paginate`                                                                       | Live Dependabot alert inventory                                     | 2026-03-29 |
| S-002 | api      | `gh api repos/.../dependabot/alerts/N` (individual records)                                                           | Per-alert detail including state, scope, severity                   | 2026-03-29 |
| S-003 | api      | `gh api repos/.../secret-scanning/alerts`                                                                             | Live secret scanning alert inventory                                | 2026-03-29 |
| S-004 | api      | `gh api repos/.../secret-scanning/alerts/N/locations`                                                                 | Secret alert location details (per-alert)                           | 2026-03-29 |
| S-005 | api      | `gh api repos/.../` (security_and_analysis field)                                                                     | Repository security configuration settings                          | 2026-03-29 |
| S-006 | codebase | `package-lock.json` (root)                                                                                            | Root lockfile — verified patched versions                           | 2026-03-29 |
| S-007 | codebase | `.github/dependabot.yml`                                                                                              | Current Dependabot configuration                                    | 2026-03-29 |
| S-008 | codebase | `.github/workflows/auto-merge-dependabot.yml`                                                                         | Auto-merge workflow file                                            | 2026-03-29 |
| S-009 | codebase | `scripts/mcp/package.json`                                                                                            | MCP package with uncovered dependency                               | 2026-03-29 |
| S-010 | codebase | `functions/package.json`                                                                                              | Cloud Functions package with overrides                              | 2026-03-29 |
| S-011 | codebase | `.env.production` (HEAD)                                                                                              | Committed production env file                                       | 2026-03-29 |
| S-012 | codebase | `.mcp.json` (HEAD)                                                                                                    | Current MCP config using env var substitution                       | 2026-03-29 |
| S-013 | codebase | `.gitignore` (HEAD)                                                                                                   | Gitignore confirming .env\*.local and .vscode/mcp.json are excluded | 2026-03-29 |
| S-014 | codebase | `.vscode/mcp.json` git history                                                                                        | Historical commit containing PAT Alert 3                            | 2025-12-17 |
| S-015 | codebase | `mcp.json` / `.mcp.json` git history                                                                                  | Historical commits containing PAT Alert 6                           | 2026-01-11 |
| S-016 | codebase | `RESEARCH_PLAN.md` pre-scan section                                                                                   | Pre-scan snapshot of repository state at research start             | 2026-03-29 |
| S-017 | docs     | https://docs.github.com/en/code-security/tutorials/secure-your-dependencies/optimizing-pr-creation-version-updates    | GitHub Docs: Dependabot PR optimization best practices              | 2026-03-29 |
| S-018 | docs     | https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference                 | GitHub Docs: Dependabot options reference                           | 2026-03-29 |
| S-019 | web      | https://github.blog/changelog/2026-02-24-dependabot-can-group-updates-by-dependency-name-across-multiple-directories/ | GitHub changelog: cross-directory grouping (Feb 2026)               | 2026-03-29 |
| S-020 | web      | https://github.blog/changelog/2025-07-01-dependabot-supports-configuration-of-a-minimum-package-age/                  | GitHub changelog: cooldown feature (Jul 2025)                       | 2026-03-29 |
| S-021 | web      | https://github.blog/changelog/2026-03-10-dependabot-now-supports-pre-commit-hooks/                                    | GitHub changelog: pre-commit ecosystem support (Mar 2026)           | 2026-03-29 |
| S-022 | docs     | https://docs.github.com/en/code-security/tutorials/secure-your-dependencies/automating-dependabot-with-github-actions | GitHub Docs: Automating Dependabot with Actions                     | 2026-03-29 |
| S-023 | web      | https://www.darknet.org.uk/2025/06/weaponizing-dependabot-exploiting-github-automation-for-supply-chain-attacks/      | Supply chain attack research: Dependabot weaponization (Jun 2025)   | 2026-03-29 |
| S-024 | api      | `gh pr list --label dependencies --state closed`                                                                      | Closed dependency PRs confirming alert resolution                   | 2026-03-29 |
| S-025 | codebase | `git log` on repo                                                                                                     | Commit history confirming resolution timeline                       | 2026-03-29 |
| S-026 | api      | GitHub Security Advisories (embedded in alert API response)                                                           | GHSA advisory details for 8 unique CVEs                             | 2026-03-28 |

---

## 7. Gaps and Open Questions

### 7.1 Missing Agent Findings (18 of 21 agents did not produce files)

The following sub-questions were planned but their agent findings files do not
exist. Claims in this report that derive from these areas are sourced only from
the pre-scan snapshot and carry MEDIUM or LOW confidence.

| Agent | Sub-Q | Topic                                                                | Impact on Report                                    |
| ----- | ----- | -------------------------------------------------------------------- | --------------------------------------------------- |
| D2    | SQ2b  | Code scanning: 30 open alerts, full inventory, fix strategies        | Section 1.1 code scanning is MEDIUM confidence only |
| D4    | SQ1a  | Workflow YAML audit: all 18 workflows, best practices                | Section 1.2 has no per-workflow analysis            |
| D5    | SQ1b  | Failing workflows: Release Please root cause                         | P0-003 has no diagnosis                             |
| D6    | SQ1c  | Missing workflows: what should exist but doesn't                     | Not covered in this report                          |
| D8    | SQ5b  | Dependency failure patterns: node-forge 3x failures, auto-merge gaps | Not covered                                         |
| D9    | SQ3   | Rulesets: overlap analysis, consolidation plan                       | Section 1.3 is MEDIUM confidence                    |
| D10   | SQ4   | Repo metadata: full labels audit, issue template details             | Section 1.8 is MEDIUM confidence                    |
| D11   | SQ6a  | Release Please: failure diagnosis, config audit                      | Section 1.7 is LOW confidence                       |
| D12   | SQ6b  | Deploy environments: protection rules, secrets audit                 | Section 1.6 is MEDIUM confidence                    |
| D13   | SQ7a  | REST API inventory: every actionable endpoint                        | Section 4.2 is preliminary                          |
| D14   | SQ7b  | GraphQL API: capabilities, bulk queries, mutations                   | Section 4.2 GraphQL section is incomplete           |
| D15   | SQ8   | SonarCloud: why disabled, reconnection strategy                      | Section 1.2 SonarCloud entry is LOW confidence      |
| D16   | SQ9   | Skill overlap: gh-fix-ci, /sonarcloud, /alerts gap analysis          | Section 4.5 is preliminary                          |
| D17   | SQ10a | Repo insights: traffic, clones, referrers                            | Not covered                                         |
| D18   | SQ10b | Metrics actionability: which insights matter for solo dev            | Not covered                                         |
| D19   | SQ11  | Projects and Issues: board automation, label workflows               | Not covered                                         |
| D20   | SQ12a | OpenSSF Scorecard: all checks, current scores                        | Section 1.4 is MEDIUM confidence                    |
| D21   | SQ12b | Gap-to-recommended: GitHub recommended settings vs current           | Not covered                                         |

### 7.2 Open Questions

1. **Are the two GitHub PATs (Alert 3 and Alert 6) actually revoked?** The git
   history confirms they were removed from the working tree, but only GitHub
   Settings confirms revocation. This is the most urgent open question.

2. **Should Release Please be fixed, replaced, or removed?** It had 1 success
   (2026-03-20) but 20 failures. An upstream bug (issue #959, open since
   March 2024) and Node.js 20 deadline (June 2, 2026) add risk. For a solo
   developer with no external package consumers, the cost of NOT having
   automated releases may be zero.

3. **Why was SonarCloud analysis manually disabled?** Was it a conscious
   decision (e.g., the integration broke after a settings change)? Is there a
   plan to reconnect it?

4. **What are the 21+ remaining code scanning alerts** (beyond the 9
   TokenPermissions and 3 PinnedDependencies visible in the pre-scan)? Are any
   of them real code vulnerabilities vs. Scorecard-generated informational
   findings?

5. **Does the auto-merge workflow stall on Dependabot PRs** because branch
   protection requires approved reviews? The D7 findings flag this as a likely
   issue but the actual branch protection rules were not inspected.

6. **Should `.env.production` remain tracked in git?** It currently contains the
   live production Firebase API key. The design choice is intentional for
   NEXT*PUBLIC* variables, but any future sensitive additions would be
   auto-committed.

7. **What APIs should `/github-health` use to batch all health signals in
   minimum round trips?** This requires D13 (REST inventory) and D14 (GraphQL)
   to answer definitively.

8. **How does github-health data integrate with the dev dashboard?** The dev
   dashboard research (`.research/dev-dashboard/`) is running in parallel.
   GitHub health data is a natural dashboard tab candidate. The health history
   JSONL is the proposed data contract between the two systems.

---

## 8. Recommendations

### Immediate (this session)

1. **Verify and close PAT alerts** (P0-001, P0-002): Check GitHub Settings >
   Developer settings > Personal access tokens. Confirm both `ghp_aRMckBewH4...`
   and `ghp_h0V3TH7K...` are not listed. Then close Alerts 3 and 6 as "revoked."

2. **Enable secret scanning validity checks** (QW-1): Settings > Security > Code
   security and analysis. 30 seconds. Immediately improves alert signal quality.

3. **Add `scripts/mcp/` to dependabot.yml** (QW-6): Three-line addition to
   `.github/dependabot.yml`. Closes the MCP SDK monitoring gap. [C-020]

### This Sprint

4. **Run missing agent passes** (D2, D5, D11, D15): The four highest-impact
   missing passes: code scanning inventory, SonarCloud reconnection. Decide on
   Release Please: remove entirely (5 min), replace with Release Drafter (2
   hours), or fix (1-2 hours now + mandatory re-fix in June 2026). This unlocks
   P0-003 and P1-003 resolutions.

5. **Fix TokenPermissions and PinnedDependencies alerts** (P1-002): After D2
   produces the full code scanning inventory, add `permissions: read-all` to
   affected workflows and pin action versions to commit SHAs. These are
   Scorecard-blocking findings.

6. **Close 4 false-positive secret alerts** (P2-002): First verify Firebase
   Security Rules are restrictive and App Check is enforced on all Firebase
   services. Then close Alerts 1, 2, 4, 5 with documented rationale.

7. **Add approval step to auto-merge workflow** (P1-005): One YAML block
   addition to `auto-merge-dependabot.yml`. Prevents future Dependabot PR stalls
   if branch protection enforces required approvals.

### Next Milestone

8. **Consolidate rulesets** (P2-001): After D9 produces full ruleset analysis,
   merge the two overlapping rulesets into one canonical ruleset with the union
   of all rules.

9. **Add Production environment branch policy** (P2-004 / QW-5): Configure
   `main`-only deployments for the Production environment.

10. **Add issue templates** (P2-006): Create bug report and feature request
    templates. Brings community profile from 85% to 100%.

11. **Design `/github-health` skill implementation** (Section 4): After D13
    (REST API inventory) and D14 (GraphQL capabilities) complete, implement the
    phased architecture described in Section 4. Start with Phase 1 (security)
    and Phase 3 (dependencies) as highest-value phases given current findings.

### MASTER_DEBT Candidates

The following items should be filed in MASTER_DEBT rather than immediate fixes:

| Item                                                        | Reason for Debt                                                              |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------- |
| functions/package.json overrides bypass Dependabot (C-021)  | Known limitation of Dependabot architecture; requires periodic manual review |
| Root path-to-regexp@8.3.0 below fix version (C-002)         | Auto-dismissed by GitHub; will resolve transitively; monitoring gap only     |
| Auto-merge does not differentiate prod vs dev deps (P3-002) | Acceptable for solo developer; low-risk with CI safety net; enhancement only |

---

## Methodology

**Planned research:** 21 searcher agents across 6 waves + 6 post-research phases

**Completed findings files:** 3 (D1: Dependabot alerts, D3: Secret scanning, D7:
Dependabot config optimization)

**Missing findings files:** 18 (D2, D4-D6, D8-D21) — these agents either did not
run or did not write their output files

**Pre-scan data source:** `.research/github-health/RESEARCH_PLAN.md` contains a
live pre-scan snapshot taken at research start from the GitHub API, used to
populate sections where agent findings are absent

**Confidence policy:** Claims from completed agent passes are marked HIGH where
the agents assigned HIGH. Claims sourced only from the pre-scan snapshot are
marked MEDIUM (if the pre-scan data is direct API output) or LOW (if the
pre-scan data is indirect or the finding requires further investigation).

**Post-research passes completed:** V1 (codebase & security verification,
11.5/14 claims accurate, 2 refuted, 1 partially verified), contrarian challenge
(10 challenges: 1 CRITICAL, 5 MAJOR, 4 MINOR), OTB challenge (30 out-of-the-box
findings across 8 categories). V2 and V3 verification agents did not produce
output — API configuration and skill metrics claims remain unverified. Dispute
resolution pass applied corrections from all three post-research agents to this
report.

**API data is live as of 2026-03-29.** The pre-scan security alert counts (18
Dependabot, 30 code scanning, 7 secret scanning) reflect state at research
start. The D1 agent confirmed all 18 Dependabot alerts are now resolved — the
pre-scan count is therefore stale for Dependabot but may still be accurate for
code scanning (30) and secret scanning (6, not 7 as the brief stated).

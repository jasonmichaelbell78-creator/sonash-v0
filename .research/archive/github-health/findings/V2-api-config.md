# V2: API & Configuration Verification

**Verification Agent:** V2-api-config **Date:** 2026-03-29 **Method:** Direct
GitHub API calls via `gh` CLI

---

## Claim 1: "2 overlapping rulesets (13352818 and 14350637)"

**VERIFIED**

```
gh api repos/{owner}/{repo}/rulesets --jq '.[] | {id, name, enforcement}'
```

Result:

- `{id: 13352818, name: "main protection", enforcement: "active"}`
- `{id: 14350637, name: "main-protection", enforcement: "active"}`

Both rulesets exist, both active. Names differ only by space vs hyphen ("main
protection" vs "main-protection"), confirming overlap.

---

## Claim 2: "All 3 environments have zero protection rules"

**VERIFIED**

```
gh api repos/{owner}/{repo}/environments/{Production,Preview,copilot} --jq '.protection_rules'
```

Result: All three returned `[]` (empty array). Zero protection rules on all
environments.

---

## Claim 3: "0 open Dependabot alerts"

**VERIFIED**

```
gh api repos/{owner}/{repo}/dependabot/alerts?state=open --jq 'length'
```

Result: `0`

Note: 18 total Dependabot alerts exist (16 fixed, 2 auto-dismissed). The GraphQL
`vulnerabilityAlerts` field returned 45, which counts all states including
historical. The claim of 0 _open_ alerts is correct.

---

## Claim 4: "17 open code scanning alerts (all OpenSSF Scorecard)"

**VERIFIED**

```
gh api repos/{owner}/{repo}/code-scanning/alerts?state=open --jq 'length'
# => 17

gh api repos/{owner}/{repo}/code-scanning/alerts?state=open --jq '[.[].tool.name] | group_by(.) | ...'
# => [{"tool": "Scorecard", "count": 17}]
```

All 17 are from the Scorecard tool. Breakdown by rule:

- TokenPermissionsID: 9
- PinnedDependenciesID: 3
- BinaryArtifactsID: 1
- BranchProtectionID: 1
- CIIBestPracticesID: 1
- CodeReviewID: 1
- VulnerabilitiesID: 1

---

## Claim 5: "OpenSSF Scorecard: 7.5/10"

**VERIFIED**

```
curl -s "https://api.securityscorecards.dev/projects/github.com/jasonmichaelbell78-creator/sonash-v0"
```

Result: `"score": 7.5` (Scorecard v5.3.0, assessed 2026-03-29)

Full check breakdown: | Check | Score | |---|---| | Maintained | 10 | |
Security-Policy | 10 | | Dependency-Update-Tool | 10 | | Dangerous-Workflow | 10
| | License | 10 | | Fuzzing | 10 | | SAST | 10 | | CI-Tests | 10 | |
Binary-Artifacts | 9 | | Pinned-Dependencies | 9 | | Token-Permissions | 8 | |
Vulnerabilities | 5 | | Branch-Protection | 4 | | Contributors | 3 | |
Code-Review | 0 | | CII-Best-Practices | 0 | | Packaging | -1 (N/A) | |
Signed-Releases | -1 (N/A) |

---

## Claim 6: "Missing tier-3 label"

**VERIFIED**

```
gh api repos/{owner}/{repo}/labels --jq '.[].name' | grep tier
```

Result: `tier-0`, `tier-1`, `tier-2`, `tier-4` -- no `tier-3` label exists.

---

## Claim 7: "No repo description set"

**VERIFIED**

```
gh api repos/{owner}/{repo} --jq '.description'
```

Result: `null`

---

## Claim 8: "No topics set"

**VERIFIED**

```
gh api repos/{owner}/{repo}/topics
```

Result: `{"names": []}` -- empty array.

---

## Claim 9: "delete_branch_on_merge is false"

**VERIFIED**

```
gh api repos/{owner}/{repo} --jq '.delete_branch_on_merge'
```

Result: `false`

---

## Claim 10: "9 action secrets configured"

**VERIFIED**

```
gh api repos/{owner}/{repo}/actions/secrets --jq '.total_count'
```

Result: `9`

---

## Claim 11: "1 GraphQL call can replace 10-15 REST calls"

**PARTIALLY VERIFIED** (claim is directionally correct but overstated)

The GraphQL mega-query successfully returned in a single call:

- Repo name, default branch, archive status
- Branch protection rules count (0 via legacy API)
- Rulesets count (2) + names + enforcement
- Vulnerability alerts count (45 total)
- `deleteBranchOnMerge`, `hasIssuesEnabled`, `hasProjectsEnabled`,
  `hasWikiEnabled`

**Analysis:** Many of the "replaced" REST fields come from a single
`GET /repos/{o}/{r}` endpoint (description, delete_branch_on_merge, archived,
has_issues, has_projects, has_wiki). The GraphQL call genuinely replaces ~4-5
distinct REST endpoints:

1. `GET /repos/{o}/{r}` (repo metadata)
2. `GET /repos/{o}/{r}/branches/{b}/protection` (branch protection)
3. `GET /repos/{o}/{r}/rulesets` (rulesets listing)
4. `GET /repos/{o}/{r}/dependabot/alerts` (vulnerability count)

The claim of "10-15" REST calls replaced is inflated. A more accurate
characterization: **1 GraphQL call replaces 4-5 REST calls**, with the added
benefit of atomic response and reduced latency. If the query were expanded to
include labels, topics, environments, workflows, secrets, and community profile,
it could replace more -- but the tested query does not cover those.

---

## Claim 12: "~85 REST calls for full audit within rate limits"

**PARTIALLY VERIFIED** (rate limits sufficient; call count is plausible but
high-end)

```
gh api rate_limit --jq '.resources.core | {remaining, limit}'
```

Result: `{remaining: 4964, limit: 5000}` -- ample headroom.

**Estimated REST calls for comprehensive audit:**

- Base endpoints (repo, rulesets, envs, alerts, labels, topics, secrets,
  community, branches, hooks, collaborators, pulls, issues, releases, tags,
  rate_limit): ~22 calls
- Workflow listing + per-workflow runs (22 workflows): ~23 calls
- Per-ruleset detail (2 rulesets): ~2 calls
- Pagination on large result sets: ~5-10 calls
- **Total estimate: 50-60 calls** for a thorough audit

The claim of ~85 is achievable if the audit includes per-alert details, per-PR
review status, per-issue labels, and other granular queries, but a standard
health audit runs closer to 50-60. The claim is within the right order of
magnitude but on the high end.

---

## Claim 13: "scripts/mcp/ has no Dependabot coverage"

**VERIFIED**

Inspected `.github/dependabot.yml` -- three ecosystem entries configured:

1. `npm` at `/` (root)
2. `npm` at `/functions`
3. `github-actions` at `/`

No entry for `scripts/mcp/` directory. If `scripts/mcp/` contains its own
`package.json` with npm dependencies, those would not be monitored by
Dependabot.

---

## Claim 14: "Community profile at 85%"

**VERIFIED**

```
gh api repos/{owner}/{repo}/community/profile --jq '.health_percentage'
```

Result: `85`

---

## Summary

| #   | Claim                                                | Verdict                                                               |
| --- | ---------------------------------------------------- | --------------------------------------------------------------------- |
| 1   | 2 overlapping rulesets (13352818 and 14350637)       | **VERIFIED**                                                          |
| 2   | All 3 environments have zero protection rules        | **VERIFIED**                                                          |
| 3   | 0 open Dependabot alerts                             | **VERIFIED**                                                          |
| 4   | 17 open code scanning alerts (all OpenSSF Scorecard) | **VERIFIED**                                                          |
| 5   | OpenSSF Scorecard: 7.5/10                            | **VERIFIED**                                                          |
| 6   | Missing tier-3 label                                 | **VERIFIED**                                                          |
| 7   | No repo description set                              | **VERIFIED**                                                          |
| 8   | No topics set                                        | **VERIFIED**                                                          |
| 9   | delete_branch_on_merge is false                      | **VERIFIED**                                                          |
| 10  | 9 action secrets configured                          | **VERIFIED**                                                          |
| 11  | 1 GraphQL call can replace 10-15 REST calls          | **PARTIALLY VERIFIED** (replaces ~4-5, not 10-15)                     |
| 12  | ~85 REST calls for full audit within rate limits     | **PARTIALLY VERIFIED** (rate limits fine; call count closer to 50-60) |
| 13  | scripts/mcp/ has no Dependabot coverage              | **VERIFIED**                                                          |
| 14  | Community profile at 85%                             | **VERIFIED**                                                          |

**Overall: 12/14 fully verified, 2/14 partially verified (directionally correct
but quantitatively overstated)**

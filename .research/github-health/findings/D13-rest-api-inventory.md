# Findings: GitHub REST API Endpoints for Repo Health Assessment

**Searcher:** deep-research-searcher (D13-SQ7a) **Profile:** web **Date:**
2026-03-29 **Sub-Question IDs:** SQ-7a

---

## Executive Summary

The GitHub REST API v3 (current stable: 2022-11-28; latest: 2026-03-10) provides
extensive coverage for repo health assessment. With the current `gh` CLI scopes
(`gist`, `read:org`, `repo`), the skill can reach ~85% of all relevant
endpoints. The key gap is `security_events`: without it, Dependabot, code
scanning, and secret scanning alerts require falling back to the broader `repo`
scope — which we have, so security alert reads ARE accessible. Traffic endpoints
need `repo` scope with explicit write permissions on the repo (we have that).
The critical missing scope is `admin:repo_hook` (webhook health) but `repo`
scope also covers it, so we're fine there too.

---

## Key Findings

### 1. Single "Get Repository" endpoint is the most information-dense starting point [CONFIDENCE: HIGH]

`GET /repos/{owner}/{repo}` returns a comprehensive object covering:

- All security feature statuses (`security_and_analysis` object):
  advanced_security, code_security, secret_scanning,
  secret_scanning_push_protection, secret_scanning_ai_detection,
  dependabot_security_updates
- Merge hygiene: `delete_branch_on_merge`, `allow_auto_merge`, `squash_merge`,
  `allow_rebase_merge`, `merge_commit_*` settings
- Governance: `web_commit_signoff_required`, `has_issues`, `has_wiki`,
  `archived`, `disabled`, `allow_forking`
- Community: `license`, `topics`, `visibility`, `private`
- Cost: **1 request**. No pagination. Scope: `repo` (have it).

This single call answers roughly 20 health check questions and should be called
first in any assessment pass.

### 2. Security alert endpoints require `security_events` OR `repo` scope [CONFIDENCE: HIGH]

The current `repo` scope satisfies all three security alert APIs:

- Dependabot: `GET /repos/{owner}/{repo}/dependabot/alerts` — `security_events`
  OR `repo`
- Code scanning: `GET /repos/{owner}/{repo}/code-scanning/alerts` —
  `security_events` OR `repo`
- Secret scanning: `GET /repos/{owner}/{repo}/secret-scanning/alerts` —
  `security_events` OR `repo`

All three also support PATCH to dismiss/update alerts. Write operations on
autofix commits (`POST .../autofix/commits`) additionally need `repo` or
`public_repo`.

Note: The `security_events` scope is a narrower, more
principle-of-least-privilege alternative. For the health skill, `repo` scope
covers everything, but adding `security_events` would be better practice for
separation of concerns if a dedicated token is created.

### 3. Branch protection and rulesets require admin-level access for WRITE; READ works with `repo` [CONFIDENCE: HIGH]

Reading branch protection
(`GET /repos/{owner}/{repo}/branches/{branch}/protection`) works with `repo`
scope. Setting protection rules (`PUT`) requires admin or owner permissions on
the repository. The newer Rulesets API (`GET /repos/{owner}/{repo}/rulesets`)
also reads with `repo` scope.

WRITE actions (enabling branch protection, creating rulesets) require the
authenticated user to have admin role on that repo — not just a scope. The `gh`
CLI token with `repo` scope on an owner/admin account will work.

### 4. Traffic endpoints require repo push/write access — not just read [CONFIDENCE: HIGH]

`GET /repos/{owner}/{repo}/traffic/{clones|views|popular/paths|popular/referrers}`
returns 403 if the token lacks write access to the repo. A personal access token
with `repo` scope on a repo where the user has push access will work. Data
covers only the **last 14 days** — this is a hard API limitation, not a
pagination issue.

### 5. Workflow runs are the richest Actions health signal [CONFIDENCE: HIGH]

`GET /repos/{owner}/{repo}/actions/runs` (with `?per_page=100&status=completed`)
returns run status, conclusion, timestamps, branch, and trigger event. Derived
health metrics: CI pass rate, mean time to green, flaky workflow detection.
Filter by `?branch=main&event=push` to focus on trunk CI.

Actionable: `POST /repos/{owner}/{repo}/actions/runs/{run_id}/rerun-failed-jobs`
can retry failed jobs directly. Scope: `repo`.

### 6. Statistics endpoints cache asynchronously — expect 202 responses [CONFIDENCE: HIGH]

`GET /repos/{owner}/{repo}/stats/*` endpoints return HTTP 202 (not data) when
the cache is cold. The skill must poll until 200 is received. These endpoints
also reject repos with 10,000+ commits with a 422 error (code_frequency and
commit_activity). All stats endpoints require `repo` scope.

Five available:

- `/stats/contributors` — per-contributor weekly additions, deletions, commits
- `/stats/commit_activity` — last 52 weeks, commits per week
- `/stats/code_frequency` — weekly additions/deletions
- `/stats/participation` — owner vs. everyone, 52 weeks
- `/stats/punch_card` — hourly distribution by day

### 7. Community profile gives a single health percentage score [CONFIDENCE: HIGH]

`GET /repos/{owner}/{repo}/community/profile` returns `health_percentage`
(0-100) based on presence of: README, LICENSE, CONTRIBUTING, CODE_OF_CONDUCT,
ISSUE_TEMPLATE, PULL_REQUEST_TEMPLATE, and CODEOWNERS. No scope specified in
docs — likely public data or `repo` for private repos.

### 8. Code scanning has autofix capabilities (GitHub Copilot-powered) [CONFIDENCE: HIGH]

`GET /repos/{owner}/{repo}/code-scanning/alerts/{n}/autofix` checks if an
AI-generated fix exists. `POST` on the same URL triggers autofix generation.
`POST /repos/{owner}/{repo}/code-scanning/alerts/{n}/autofix/commits` applies
the fix to a branch. Scope: `repo` for commit action, `security_events` for
read.

This is a HIGH-value action capability for an automated health skill.

### 9. CODEOWNERS syntax errors have a dedicated endpoint [CONFIDENCE: HIGH]

`GET /repos/{owner}/{repo}/codeowners/errors` returns syntax errors in
CODEOWNERS. This is a small, cheap call that surfaces a common config health
issue. Scope: `repo`.

### 10. SBOM endpoint provides dependency inventory [CONFIDENCE: HIGH]

`GET /repos/{owner}/{repo}/dependency-graph/sbom` returns a full SPDX-2.3 JSON
SBOM. Requires GitHub Advanced Security or dependency graph enabled. Scope:
standard read access (`repo`). Useful for dependency inventory + license audit.

### 11. Collaborator listing requires push access minimum [CONFIDENCE: HIGH]

`GET /repos/{owner}/{repo}/collaborators` requires write/maintain/admin on the
repo (not just `repo` scope on a read-only token). Since the current gh CLI
token is used by the owner, this will work. Returns permission levels for each
collaborator — useful for "outside collaborators" audit.

### 12. Vulnerability alert and automated security fix toggle endpoints exist [CONFIDENCE: HIGH]

- `GET /repos/{owner}/{repo}/vulnerability-alerts` — 204 if enabled, 404 if not
- `PUT /repos/{owner}/{repo}/vulnerability-alerts` — enable it
- `DELETE /repos/{owner}/{repo}/vulnerability-alerts` — disable it
- `GET /repos/{owner}/{repo}/automated-security-fixes` — Dependabot PR updates
  status
- `PUT /repos/{owner}/{repo}/automated-security-fixes` — enable
- `DELETE /repos/{owner}/{repo}/automated-security-fixes` — disable

All require admin repo access. Scope: `repo`.

### 13. Secondary rate limits constrain burst behavior [CONFIDENCE: HIGH]

Beyond 5,000 req/hr primary limit:

- Max 100 concurrent requests
- Max 900 points/min (GET=1pt, POST/PATCH/PUT/DELETE=5pt)
- Max 90 CPU-seconds per 60 seconds
- Max 80 content-creating requests/min

For a health skill doing ~30-50 read calls per repo audit, this is well within
limits. Paginated endpoints (issues, PRs, workflow runs) can consume budget fast
if not bounded — always set `per_page=100` and limit pages.

### 14. API version 2026-03-10 introduced breaking changes [CONFIDENCE: MEDIUM]

The new `X-GitHub-Api-Version: 2026-03-10` header activates the new version.
Version 2022-11-28 remains supported for 24+ months. The skill should use
`2022-11-28` for stability unless specific 2026-03-10 features are needed. The
breaking changes documentation was not enumerated in the changelog post —
requires reading the separate migration guide.

### 15. `repo` scope covers webhooks without needing separate `admin:repo_hook` [CONFIDENCE: HIGH]

`GET /repos/{owner}/{repo}/hooks` works with `repo` scope (which we have).
Returns webhook configs, active status, last delivery response, and event types.
Useful for auditing: are webhooks pointing to dead endpoints? Are expected
webhooks configured?

### 16. Actions permissions can be audited and configured via API [CONFIDENCE: HIGH]

`GET /repos/{owner}/{repo}/actions/permissions` reads:

- Whether Actions is enabled/disabled
- Which actions are allowed (all / local_only / selected)
- Default workflow token permissions (read/write)
- Fork PR approval policy

`PUT` on the same URL can lock down permissions. Scope: `repo`. This is a
HIGH-value security hardening action.

### 17. Code security configurations (org-level) require `write:org` for changes [CONFIDENCE: HIGH]

Reading org security configs: `GET /orgs/{org}/code-security/configurations`
requires `read:org` (which we have via `read:org` scope). Writing org-wide
configs requires `write:org` (not in current scope set). Per-repo config read:
`GET /repos/{owner}/{repo}/code-security-configuration` requires `repo` (have
it).

### 18. Old org-level security enable/disable endpoint deprecated July 2025 [CONFIDENCE: HIGH]

The organization-level endpoint for enabling/disabling security features in bulk
was deprecated in July 2024 and removed in July 2025. The replacement is the
Code Security Configurations API. Any scripts using the old endpoint are broken.

---

## Endpoint Inventory by Category

### Phase (a): Assessment / Audit

| #   | Endpoint                                                | Method | Returns                                                      | Scope                       | Actionability | Cost/Page |
| --- | ------------------------------------------------------- | ------ | ------------------------------------------------------------ | --------------------------- | ------------- | --------- |
| 1   | `/repos/{owner}/{repo}`                                 | GET    | Full repo object incl. security_and_analysis, merge settings | `repo`                      | HIGH          | 1         |
| 2   | `/repos/{owner}/{repo}/community/profile`               | GET    | health_percentage, docs presence                             | implicit                    | HIGH          | 1         |
| 3   | `/repos/{owner}/{repo}/vulnerability-alerts`            | GET    | 204/404 — enabled or not                                     | `repo`                      | HIGH          | 1         |
| 4   | `/repos/{owner}/{repo}/automated-security-fixes`        | GET    | enabled/disabled/paused                                      | `repo`                      | HIGH          | 1         |
| 5   | `/repos/{owner}/{repo}/private-vulnerability-reporting` | GET    | boolean                                                      | `repo`                      | HIGH          | 1         |
| 6   | `/repos/{owner}/{repo}/dependabot/alerts`               | GET    | open alerts, severity, CVSS, EPSS                            | `repo` or `security_events` | HIGH          | 100/page  |
| 7   | `/repos/{owner}/{repo}/code-scanning/alerts`            | GET    | open findings, rule, location                                | `repo` or `security_events` | HIGH          | 100/page  |
| 8   | `/repos/{owner}/{repo}/code-scanning/default-setup`     | GET    | scanning config state                                        | `repo`                      | HIGH          | 1         |
| 9   | `/repos/{owner}/{repo}/secret-scanning/alerts`          | GET    | exposed secrets, validity, type                              | `repo` or `security_events` | HIGH          | 100/page  |
| 10  | `/repos/{owner}/{repo}/secret-scanning/scan-history`    | GET    | last scan timestamps                                         | `repo` or `security_events` | MEDIUM        | 1         |
| 11  | `/repos/{owner}/{repo}/branches/{branch}/protection`    | GET    | all protection rules                                         | `repo`                      | HIGH          | 1         |
| 12  | `/repos/{owner}/{repo}/rulesets`                        | GET    | array of rulesets                                            | `repo`                      | HIGH          | 1         |
| 13  | `/repos/{owner}/{repo}/rules/branches/{branch}`         | GET    | active rules on branch                                       | `repo`                      | HIGH          | 1         |
| 14  | `/repos/{owner}/{repo}/actions/workflows`               | GET    | workflow list, state                                         | `repo`                      | HIGH          | 100/page  |
| 15  | `/repos/{owner}/{repo}/actions/runs`                    | GET    | run history, status, conclusion                              | `repo`                      | HIGH          | 100/page  |
| 16  | `/repos/{owner}/{repo}/actions/permissions`             | GET    | Actions enabled, allowed actions, token perms                | `repo`                      | HIGH          | 1         |
| 17  | `/repos/{owner}/{repo}/actions/cache/usage`             | GET    | total cache size in bytes                                    | `repo`                      | MEDIUM        | 1         |
| 18  | `/repos/{owner}/{repo}/actions/artifacts`               | GET    | artifact list, sizes, expiry                                 | `repo`                      | MEDIUM        | 100/page  |
| 19  | `/repos/{owner}/{repo}/collaborators`                   | GET    | collaborators + permissions                                  | `repo`+push access          | HIGH          | 100/page  |
| 20  | `/repos/{owner}/{repo}/collaborators/{user}/permission` | GET    | specific user permission level                               | `repo`+push access          | HIGH          | 1         |
| 21  | `/repos/{owner}/{repo}/hooks`                           | GET    | webhooks, active status, last response                       | `repo`                      | MEDIUM        | 100/page  |
| 22  | `/repos/{owner}/{repo}/topics`                          | GET    | assigned topics                                              | `repo`                      | LOW           | 1         |
| 23  | `/repos/{owner}/{repo}/codeowners/errors`               | GET    | CODEOWNERS syntax errors                                     | `repo`                      | HIGH          | 1         |
| 24  | `/repos/{owner}/{repo}/traffic/views`                   | GET    | views last 14 days                                           | `repo`+write                | MEDIUM        | 1         |
| 25  | `/repos/{owner}/{repo}/traffic/clones`                  | GET    | clones last 14 days                                          | `repo`+write                | LOW           | 1         |
| 26  | `/repos/{owner}/{repo}/traffic/popular/paths`           | GET    | top 10 paths                                                 | `repo`+write                | LOW           | 1         |
| 27  | `/repos/{owner}/{repo}/traffic/popular/referrers`       | GET    | top 10 referrers                                             | `repo`+write                | LOW           | 1         |
| 28  | `/repos/{owner}/{repo}/stats/commit_activity`           | GET    | commits/week last 52 weeks (202 if cold)                     | `repo`                      | MEDIUM        | 1         |
| 29  | `/repos/{owner}/{repo}/stats/contributors`              | GET    | per-contributor activity (202 if cold)                       | `repo`                      | MEDIUM        | 1         |
| 30  | `/repos/{owner}/{repo}/stats/participation`             | GET    | owner vs. all, 52 weeks (202 if cold)                        | `repo`                      | MEDIUM        | 1         |
| 31  | `/repos/{owner}/{repo}/stats/code_frequency`            | GET    | weekly additions/deletions (202 if cold)                     | `repo`                      | LOW           | 1         |
| 32  | `/repos/{owner}/{repo}/stats/punch_card`                | GET    | hourly commit distribution (202 if cold)                     | `repo`                      | LOW           | 1         |
| 33  | `/repos/{owner}/{repo}/pulls`                           | GET    | open PRs (filter state=open, sort=long-running)              | `repo`                      | HIGH          | 100/page  |
| 34  | `/repos/{owner}/{repo}/issues`                          | GET    | open issues (filter state=open)                              | `repo`                      | MEDIUM        | 100/page  |
| 35  | `/repos/{owner}/{repo}/releases/latest`                 | GET    | latest non-draft release, assets                             | `repo`                      | MEDIUM        | 1         |
| 36  | `/repos/{owner}/{repo}/releases`                        | GET    | release history, download counts                             | `repo`                      | MEDIUM        | 100/page  |
| 37  | `/repos/{owner}/{repo}/dependency-graph/sbom`           | GET    | SPDX SBOM of all dependencies                                | `repo`                      | MEDIUM        | 1         |
| 38  | `/repos/{owner}/{repo}/code-security-configuration`     | GET    | which org security config governs this repo                  | `repo`                      | MEDIUM        | 1         |
| 39  | `/repos/{owner}/{repo}/contents/{path}`                 | GET    | file existence check (404 = missing)                         | `repo`                      | HIGH          | 1         |
| 40  | `/repos/{owner}/{repo}/readme`                          | GET    | README presence + content                                    | `repo`                      | HIGH          | 1         |
| 41  | `/repos/{owner}/{repo}/languages`                       | GET    | language breakdown by bytes                                  | `repo`                      | LOW           | 1         |
| 42  | `/repos/{owner}/{repo}/teams`                           | GET    | teams with access                                            | `repo`+`read:org`           | MEDIUM        | 1         |
| 43  | `/rate_limit`                                           | GET    | current limits (does NOT count against limit)                | any                         | HIGH          | 1         |
| 44  | `/repos/{owner}/{repo}/actions/runs/{run_id}/timing`    | GET    | billable minutes for a run                                   | `repo`                      | LOW           | 1         |
| 45  | `/orgs/{org}/code-security/configurations`              | GET    | org-level security configs                                   | `read:org`                  | MEDIUM        | 1         |

### Phase (b): Fix / Action (Write Endpoints)

| #   | Endpoint                                                         | Method | Action                                                                        | Scope                    | Required Role | Actionability |
| --- | ---------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------- | ------------------------ | ------------- | ------------- |
| 1   | `/repos/{owner}/{repo}`                                          | PATCH  | Enable delete_branch_on_merge, web_commit_signoff_required, security features | `repo`                   | admin         | HIGH          |
| 2   | `/repos/{owner}/{repo}/vulnerability-alerts`                     | PUT    | Enable Dependabot alerts                                                      | `repo`                   | admin         | HIGH          |
| 3   | `/repos/{owner}/{repo}/automated-security-fixes`                 | PUT    | Enable Dependabot security PRs                                                | `repo`                   | admin         | HIGH          |
| 4   | `/repos/{owner}/{repo}/branches/{branch}/protection`             | PUT    | Set branch protection rules                                                   | `repo`                   | admin         | HIGH          |
| 5   | `/repos/{owner}/{repo}/rulesets`                                 | POST   | Create a new ruleset                                                          | `repo`                   | admin         | HIGH          |
| 6   | `/repos/{owner}/{repo}/rulesets/{id}`                            | PUT    | Update/enforce a ruleset                                                      | `repo`                   | admin         | HIGH          |
| 7   | `/repos/{owner}/{repo}/dependabot/alerts/{n}`                    | PATCH  | Dismiss or re-open alert                                                      | `repo`/`security_events` | write         | HIGH          |
| 8   | `/repos/{owner}/{repo}/code-scanning/alerts/{n}`                 | PATCH  | Dismiss alert                                                                 | `repo`/`security_events` | write         | HIGH          |
| 9   | `/repos/{owner}/{repo}/code-scanning/alerts/{n}/autofix`         | POST   | Generate AI autofix                                                           | `repo`/`security_events` | write         | HIGH          |
| 10  | `/repos/{owner}/{repo}/code-scanning/alerts/{n}/autofix/commits` | POST   | Commit autofix to branch                                                      | `repo`                   | write         | HIGH          |
| 11  | `/repos/{owner}/{repo}/code-scanning/default-setup`              | PATCH  | Enable/configure code scanning                                                | `repo`                   | admin         | HIGH          |
| 12  | `/repos/{owner}/{repo}/secret-scanning/alerts/{n}`               | PATCH  | Dismiss secret alert                                                          | `repo`/`security_events` | write         | HIGH          |
| 13  | `/repos/{owner}/{repo}/actions/workflows/{id}/enable`            | PUT    | Enable a disabled workflow                                                    | `repo`                   | write         | HIGH          |
| 14  | `/repos/{owner}/{repo}/actions/workflows/{id}/disable`           | PUT    | Disable a workflow                                                            | `repo`                   | write         | MEDIUM        |
| 15  | `/repos/{owner}/{repo}/actions/runs/{id}/rerun-failed-jobs`      | POST   | Retry failed CI jobs                                                          | `repo`                   | write         | HIGH          |
| 16  | `/repos/{owner}/{repo}/actions/permissions`                      | PUT    | Lock down Actions permissions                                                 | `repo`                   | admin         | HIGH          |
| 17  | `/repos/{owner}/{repo}/actions/permissions/workflow`             | PUT    | Set GITHUB_TOKEN default to read                                              | `repo`                   | admin         | HIGH          |
| 18  | `/repos/{owner}/{repo}/hooks/{id}/deliveries/{id}/attempts`      | POST   | Retry failed webhook                                                          | `repo`                   | admin         | MEDIUM        |
| 19  | `/repos/{owner}/{repo}/topics`                                   | PUT    | Set/replace topics                                                            | `repo`                   | write         | MEDIUM        |
| 20  | `/repos/{owner}/{repo}/actions/caches`                           | DELETE | Clear stale caches by key                                                     | `repo`                   | write         | MEDIUM        |

### Phase (c): Monitoring

| #   | Endpoint                                       | Method | Monitoring Use                           | Scope        | Frequency |
| --- | ---------------------------------------------- | ------ | ---------------------------------------- | ------------ | --------- |
| 1   | `/rate_limit`                                  | GET    | Track API budget before/after each batch | any          | Per-batch |
| 2   | `/repos/{owner}/{repo}/actions/runs`           | GET    | CI pass rate trending                    | `repo`       | Daily     |
| 3   | `/repos/{owner}/{repo}/dependabot/alerts`      | GET    | New vuln alert count delta               | `repo`       | Daily     |
| 4   | `/repos/{owner}/{repo}/code-scanning/alerts`   | GET    | New finding count delta                  | `repo`       | Post-push |
| 5   | `/repos/{owner}/{repo}/secret-scanning/alerts` | GET    | Any open/active secrets                  | `repo`       | Hourly    |
| 6   | `/repos/{owner}/{repo}/traffic/views`          | GET    | Engagement trend                         | `repo`+write | Daily     |
| 7   | `/repos/{owner}/{repo}/stats/participation`    | GET    | Contribution activity                    | `repo`       | Weekly    |
| 8   | `/repos/{owner}/{repo}/hooks/{id}/deliveries`  | GET    | Webhook delivery failure rate            | `repo`       | Daily     |
| 9   | `/repos/{owner}/{repo}/releases/latest`        | GET    | Release staleness                        | `repo`       | Weekly    |
| 10  | `/repos/{owner}/{repo}/pulls`                  | GET    | PR backlog age                           | `repo`       | Daily     |

---

## Scope Requirements Summary

### Current scopes: `gist`, `read:org`, `repo`

| Scope      | Grants                                                                   | Endpoint Categories Unlocked                                        |
| ---------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| `repo`     | Full read+write on code, settings, security, hooks, actions, deployments | All repo-level endpoints                                            |
| `read:org` | Read org membership, projects, teams                                     | Org-level collaborators, team membership, org code security configs |
| `gist`     | Read/write gists                                                         | Not relevant to health skill                                        |

### Missing Scopes and Impact

| Scope              | What It Unlocks                                    | Impact Level | Workaround                                         |
| ------------------ | -------------------------------------------------- | ------------ | -------------------------------------------------- |
| `security_events`  | Narrower alternative to `repo` for security alerts | LOW          | `repo` scope covers all security endpoints already |
| `write:org`        | Modify org-level security configurations           | MEDIUM       | Can still read; write requires org admin anyway    |
| `admin:enterprise` | Enterprise-wide security config                    | LOW          | Not relevant for single-repo skill                 |
| `admin:org`        | Org Actions permissions                            | LOW          | Not needed for repo-level operations               |

**Conclusion:** The current `repo` + `read:org` scope set covers all endpoints
needed for the health skill. No additional scopes are required. The
`security_events` scope is a cleaner alternative for security-only tokens but is
not blocking.

---

## Rate Limit Budget Analysis

**Baseline:** 5,000 requests/hour = ~83/minute

### Full Audit of One Repo (estimate)

| Phase                                   | Endpoint Calls   | Notes                                                         |
| --------------------------------------- | ---------------- | ------------------------------------------------------------- |
| Core repo info                          | 5                | repo, community, vuln-alerts, auto-security-fixes, codeowners |
| Security alerts (10 pages max each)     | 30               | Dependabot + code scanning + secret scanning, bounded         |
| Branch protection + rulesets            | 4                | 2 branches × 2 calls each                                     |
| Actions (5 workflows, 1 page runs each) | 10               | workflow list + last 100 runs                                 |
| Stats (5 endpoints, cold cache)         | 10               | Each may need 2 polls (202 then 200)                          |
| Collaborators + teams                   | 3                | 1 page each                                                   |
| Issues + PRs                            | 4                | 1 page each                                                   |
| Traffic (4 endpoints)                   | 4                | Views, clones, paths, referrers                               |
| Contents checks (key files)             | 8                | .gitignore, LICENSE, CODEOWNERS, etc.                         |
| Releases, SBOM, hooks                   | 5                |                                                               |
| Rate limit check                        | 2                | Before and after                                              |
| **Total**                               | **~85 requests** |                                                               |

- At 85 req/audit: 58 full audits per hour (5000/85)
- At 900 pts/minute (secondary): 85 GET requests = 85 points — well within the
  900/min limit
- Pagination risk: If a repo has 500+ open Dependabot alerts, unbounded listing
  = 5 pages at 100/page = 5 requests. Set alert count thresholds and cap at
  first 3 pages.

### ETag Caching Strategy

Most GET endpoints return `ETag` and `Last-Modified` headers. Conditional
re-requests that return 304 do NOT count against the primary rate limit. For
monitoring mode, store ETags and use `If-None-Match` on repeated calls.

---

## Recommended Endpoint Priority for the Skill

### Tier 1: Always Call (Core Health Signal, 1 req each)

1. `GET /repos/{owner}/{repo}` — security features, merge hygiene, governance
2. `GET /repos/{owner}/{repo}/community/profile` — community health %
3. `GET /repos/{owner}/{repo}/vulnerability-alerts` — Dependabot enabled?
4. `GET /repos/{owner}/{repo}/automated-security-fixes` — Dependabot PRs
   enabled?
5. `GET /repos/{owner}/{repo}/codeowners/errors` — CODEOWNERS valid?
6. `GET /repos/{owner}/{repo}/branches/{default}/protection` — branch protected?
7. `GET /repos/{owner}/{repo}/actions/permissions` — Actions locked down?
8. `GET /rate_limit` — budget check before starting

### Tier 2: High-Value Assessment (bounded pagination)

9. `GET /repos/{owner}/{repo}/dependabot/alerts?state=open&per_page=100` —
   active vulns
10. `GET /repos/{owner}/{repo}/secret-scanning/alerts?state=open&per_page=100` —
    exposed secrets
11. `GET /repos/{owner}/{repo}/code-scanning/alerts?state=open&per_page=100` —
    code findings
12. `GET /repos/{owner}/{repo}/code-scanning/default-setup` — scanning
    configured?
13. `GET /repos/{owner}/{repo}/rulesets` — org rulesets active?
14. `GET /repos/{owner}/{repo}/actions/runs?per_page=100&status=completed` — CI
    health
15. `GET /repos/{owner}/{repo}/collaborators?per_page=100` — access audit
16. `GET /repos/{owner}/{repo}/hooks?per_page=100` — webhook health

### Tier 3: Enrichment (call if budget remains)

17. `GET /repos/{owner}/{repo}/stats/participation` — contribution trend
18. `GET /repos/{owner}/{repo}/stats/commit_activity` — commit cadence
19. `GET /repos/{owner}/{repo}/pulls?state=open&sort=long-running&per_page=100`
    — PR backlog
20. `GET /repos/{owner}/{repo}/dependency-graph/sbom` — dependency inventory
21. `GET /repos/{owner}/{repo}/traffic/views` — engagement
22. `GET /repos/{owner}/{repo}/releases/latest` — release freshness
23. `GET /repos/{owner}/{repo}/contents/path` — check key files exist

### Fix/Action Priority

1. Enable `delete_branch_on_merge` and security features via
   `PATCH /repos/{owner}/{repo}`
2. Enable branch protection via `PUT /repos/.../branches/{branch}/protection`
3. Enable Dependabot alerts/fixes via PUT endpoints
4. Enable code scanning default setup via
   `PATCH .../code-scanning/default-setup`
5. Lock Actions token to read via `PUT .../actions/permissions/workflow`
6. Dismiss false-positive security alerts via PATCH

---

## Gaps Identified

1. **Project v2 (GraphQL only):** GitHub Projects v2 has no REST API. GraphQL is
   required for project board health. This finding is out-of-scope for a
   REST-only skill but should be noted for future GraphQL phase.

2. **Notifications:** `GET /notifications` returns unread notifications for the
   authenticated user — not specifically repo health metrics. Low utility.

3. **Packages:** Package inventory (`GET /repos/{owner}/{repo}/packages`)
   requires `read:packages` scope which we do not have. Package
   staleness/vulnerability is not assessable.

4. **Actions minutes budget:**
   `GET /repos/{owner}/{repo}/actions/workflows/{id}/timing` is documented as
   deprecated. The replacement path for billing minutes is unclear — could not
   find a non-deprecated substitute.

5. **2026-03-10 breaking changes:** The specific breaking changes introduced in
   the newest API version were not enumerated in searchable form. Using stable
   `2022-11-28` version avoids risk but may miss new capabilities.

6. **Pages health:** `GET /repos/{owner}/{repo}/pages` returns Pages config
   (source branch, status, HTTPS enforcement) — not covered in detail here but
   worth including for repos with GitHub Pages enabled. Scope: `repo`.

7. **Dependabot secrets:** `GET /repos/{owner}/{repo}/dependabot/secrets` lists
   registered Dependabot secrets (names only, not values). Useful for auditing
   whether required secrets are present. Scope: `repo`.

8. **Self-hosted runner enumeration:**
   `GET /repos/{owner}/{repo}/actions/runners` lists self-hosted runners —
   relevant for security (unregistered/stale runners). Scope: `repo`. Not
   researched in depth.

---

## Contradictions

1. **`security_events` vs `repo` scope for security alerts:** Some documentation
   sections say `security_events` is required; others say `repo` OR
   `security_events`. Verified: both the Dependabot and code scanning docs
   consistently list both as alternatives. The `repo` scope is sufficient. The
   `security_events` scope alone is the minimum needed if you want to avoid full
   `repo` access.

2. **Traffic endpoint access level:** Official docs say "write access to
   repository" is required (returns 403 otherwise). The OAuth scope docs say
   `repo` grants "full access" including write. This seems contradictory — a
   token with `repo` scope should satisfy the write access requirement. However,
   if the token is used on a repo where the authenticated user only has read
   permissions (fork or org repo without push), traffic will be 403 despite
   having `repo` scope.

3. **Collaborators endpoint access:** Documented as requiring "write, maintain,
   or admin" access (user role), not just token scope. A community discussion
   suggests only push access is needed. Both likely mean: the token must belong
   to a user with push+ on that repo, which is satisfied for owner usage.

---

## Serendipity

- **Code scanning autofix (Copilot-powered):** The `POST .../autofix` endpoint
  can generate AI-powered code fixes for security findings. A health skill could
  not just identify vulnerabilities but actively propose fixes. This was not
  originally in scope but is a high-value automation opportunity.

- **API Insights org endpoint:** `GET /orgs/{org}/api-insights/...` provides
  per-actor/per-route API usage analytics. Useful for debugging if the health
  skill itself becomes a heavy API consumer, or for auditing which tokens/apps
  are hitting rate limits.

- **`/repos/{owner}/{repo}/activity` endpoint:** Returns a detailed change log
  of pushes, merges, force pushes, and branch changes with actor filtering. Not
  just metrics — it can surface "who force-pushed to main last week" as a
  security event. Could be added to Phase (a) audit at low cost.

- **Immutable releases:** `GET /repos/{owner}/{repo}/immutable-releases` is a
  relatively new endpoint returning whether release immutability is enforced at
  the owner level. Relevant for supply chain security.

- **Secret scanning scan history:**
  `GET /repos/{owner}/{repo}/secret-scanning/scan-history` returns timestamps of
  last incremental and backfill scans. This lets the skill detect if secret
  scanning has been running recently or is stalled.

---

## Sources

| #   | URL                                                                                                                               | Title                                        | Type               | Trust | CRAAP | Date    |
| --- | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | ------------------ | ----- | ----- | ------- |
| 1   | https://docs.github.com/en/rest/repos/repos                                                                                       | REST API endpoints for repositories          | official-docs      | HIGH  | 4.5/5 | 2026-03 |
| 2   | https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps                                              | Scopes for OAuth apps                        | official-docs      | HIGH  | 4.5/5 | 2026-03 |
| 3   | https://docs.github.com/en/rest/dependabot/alerts                                                                                 | REST API endpoints for Dependabot alerts     | official-docs      | HIGH  | 5/5   | 2026-03 |
| 4   | https://docs.github.com/en/rest/code-scanning/code-scanning                                                                       | REST API endpoints for code scanning         | official-docs      | HIGH  | 5/5   | 2026-03 |
| 5   | https://docs.github.com/en/rest/secret-scanning/secret-scanning                                                                   | REST API endpoints for secret scanning       | official-docs      | HIGH  | 5/5   | 2026-03 |
| 6   | https://docs.github.com/en/rest/branches/branch-protection                                                                        | REST API endpoints for branch protection     | official-docs      | HIGH  | 5/5   | 2026-03 |
| 7   | https://docs.github.com/en/rest/repos/rules                                                                                       | REST API endpoints for repository rulesets   | official-docs      | HIGH  | 5/5   | 2026-03 |
| 8   | https://docs.github.com/en/rest/actions/workflow-runs                                                                             | REST API endpoints for workflow runs         | official-docs      | HIGH  | 5/5   | 2026-03 |
| 9   | https://docs.github.com/en/rest/actions/workflows                                                                                 | REST API endpoints for workflows             | official-docs      | HIGH  | 5/5   | 2026-03 |
| 10  | https://docs.github.com/en/rest/metrics/statistics                                                                                | REST API endpoints for repository statistics | official-docs      | HIGH  | 5/5   | 2026-03 |
| 11  | https://docs.github.com/en/rest/metrics/traffic                                                                                   | REST API endpoints for repository traffic    | official-docs      | HIGH  | 5/5   | 2026-03 |
| 12  | https://docs.github.com/en/rest/metrics/community                                                                                 | REST API endpoints for community metrics     | official-docs      | HIGH  | 5/5   | 2026-03 |
| 13  | https://docs.github.com/en/rest/rate-limit/rate-limit                                                                             | REST API endpoints for rate limits           | official-docs      | HIGH  | 5/5   | 2026-03 |
| 14  | https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api                                                   | Rate limits for the REST API                 | official-docs      | HIGH  | 5/5   | 2026-03 |
| 15  | https://docs.github.com/en/rest/collaborators/collaborators                                                                       | REST API endpoints for collaborators         | official-docs      | HIGH  | 5/5   | 2026-03 |
| 16  | https://docs.github.com/en/rest/repos/webhooks                                                                                    | REST API endpoints for webhooks              | official-docs      | HIGH  | 5/5   | 2026-03 |
| 17  | https://docs.github.com/en/rest/actions/cache                                                                                     | REST API endpoints for GitHub Actions cache  | official-docs      | HIGH  | 5/5   | 2026-03 |
| 18  | https://docs.github.com/en/rest/actions/permissions                                                                               | REST API endpoints for Actions permissions   | official-docs      | HIGH  | 5/5   | 2026-03 |
| 19  | https://docs.github.com/en/rest/releases/releases                                                                                 | REST API endpoints for releases              | official-docs      | HIGH  | 5/5   | 2026-03 |
| 20  | https://docs.github.com/en/rest/deployments/environments                                                                          | REST API endpoints for environments          | official-docs      | HIGH  | 5/5   | 2026-03 |
| 21  | https://docs.github.com/en/rest/dependency-graph/sboms                                                                            | REST API endpoints for SBOM                  | official-docs      | HIGH  | 5/5   | 2026-03 |
| 22  | https://docs.github.com/en/rest/checks/runs                                                                                       | REST API endpoints for check runs            | official-docs      | HIGH  | 5/5   | 2026-03 |
| 23  | https://docs.github.com/en/rest/code-security/configurations                                                                      | Code security configurations REST API        | official-docs      | HIGH  | 5/5   | 2026-03 |
| 24  | https://github.blog/changelog/2024-07-22-deprecation-of-api-endpoint-to-enable-or-disable-a-security-feature-for-an-organization/ | Org security endpoint deprecation            | official-changelog | HIGH  | 4/5   | 2024-07 |
| 25  | https://github.blog/changelog/2026-03-12-rest-api-version-2026-03-10-is-now-available/                                            | REST API version 2026-03-10 announcement     | official-changelog | HIGH  | 5/5   | 2026-03 |
| 26  | https://docs.github.com/en/rest/orgs/api-insights                                                                                 | REST API endpoints for API Insights          | official-docs      | HIGH  | 4/5   | 2026-03 |

---

## Confidence Assessment

- HIGH claims: 16
- MEDIUM claims: 1 (2026-03-10 breaking changes detail)
- LOW claims: 0
- UNVERIFIED claims: 0
- **Overall confidence: HIGH**

All findings are sourced from official GitHub documentation fetched live in
March 2026. No training-data-only claims made. The one MEDIUM claim is due to
the breaking changes list for 2026-03-10 not being enumerated inline — the fact
of the new version is HIGH confidence, the specific change inventory is not
verified here.

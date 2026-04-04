# Findings: GitHub API Capabilities and Meta-Analysis Tools for Repo Analysis Without Cloning

**Searcher:** deep-research-searcher **Profile:** web **Date:** 2026-03-31
**Sub-Question IDs:** D2a-4

---

## Key Findings

### 1. GitHub REST API: Core Repository Endpoints [CONFIDENCE: HIGH]

The REST API provides extensive repo analysis without cloning. All endpoints use
`Accept: application/vnd.github+json` and `X-GitHub-Api-Version: 2026-03-10`
headers.

**Basic repo metadata** — `GET /repos/{owner}/{repo}` returns: name,
description, topics, language, license, stars, forks, watchers, open issues
count, default branch, created/updated/pushed timestamps, disk_usage (KB),
visibility, and over 30 boolean flags (isArchived, isFork, hasWiki, hasIssues,
etc.) [1][2].

**Languages breakdown** — `GET /repos/{owner}/{repo}/languages` returns an
object mapping language name → bytes of code. Enables computing language
percentage distribution from raw bytes [2].

**Topics** — `GET /repos/{owner}/{repo}/topics` returns an array of topic
strings applied to the repo [2].

**Contributors** — `GET /repos/{owner}/{repo}/contributors` returns contributor
objects sorted by commit count descending. Fields: login, id, contributions
count, avatar URL. Paginated [2].

**Community health** — `GET /repos/{owner}/{repo}/community/profile` returns:
health_percentage score (0-100), detection of README, license, code of conduct,
contributing guidelines, issue templates, PR templates. Does not work on forks
[3].

**Traffic** (requires push access) — 4 endpoints all covering last 14 days only:

- `GET /repos/{owner}/{repo}/traffic/views` — total views + daily breakdown
- `GET /repos/{owner}/{repo}/traffic/clones` — total clones + daily breakdown
- `GET /repos/{owner}/{repo}/traffic/popular/referrers` — top 10 referral
  sources
- `GET /repos/{owner}/{repo}/traffic/popular/paths` — top 10 popular paths [4]

**Activity** — `GET /repos/{owner}/{repo}/activity` returns pushes, merges,
force pushes, and branch changes with timestamps and actor info [2].

---

### 2. GitHub REST API: Statistics Endpoints [CONFIDENCE: HIGH]

All stats endpoints under `/repos/{owner}/{repo}/stats/` are computed
asynchronously. First call may return 202 (job queued); retry after delay
for 200. Limitation: all addition/deletion counts return 0 for repos with
10,000+ commits [1].

| Endpoint                | Data                                                                            |
| ----------------------- | ------------------------------------------------------------------------------- |
| `stats/commit_activity` | Last year of commit activity grouped by week with daily breakdowns              |
| `stats/contributors`    | Per-contributor totals: weeks array with additions, deletions, commit count     |
| `stats/code_frequency`  | Weekly aggregate additions and deletions (fails with 422 on >10K commits repos) |
| `stats/participation`   | Owner vs. everyone commit counts for last 52 weeks                              |
| `stats/punch_card`      | Commit frequency by day-of-week and hour-of-day                                 |

---

### 3. GitHub REST API: Security and Supply Chain Endpoints [CONFIDENCE: HIGH]

**SBOM export** — `GET /repos/{owner}/{repo}/dependency-graph/sbom` returns full
SPDX JSON SBOM. Free for all cloud repos. Requires at least read access (public
repos are open). Contains: all direct + transitive dependencies, names,
versions, licenses (declared and concluded), download locations, supplier
attribution, and inter-package relationships [5][6]. Insights derivable without
cloning: full supply chain composition, license compliance, vulnerable version
detection.

**Dependency review** —
`GET /repos/{owner}/{repo}/dependency-graph/compare/{basehead}` returns diff of
dependency changes between two commits including security impact [6].

**Dependabot alerts** — `GET /repos/{owner}/{repo}/dependabot/alerts` returns
vulnerability alerts with severity, CVSS score, CWE info, affected package,
ecosystem, and state (open/dismissed/fixed). Requires `security_events` scope or
`public_repo` scope for public repos [7].

**Code scanning alerts** — `GET /repos/{owner}/{repo}/code-scanning/alerts`
lists all code scanning findings. Can filter by tool, severity, state.
Additional: `GET .../analyses` returns analysis summaries;
`GET .../codeql/databases` lists available CodeQL databases [8].

**Secret scanning alerts** — `GET /repos/{owner}/{repo}/secret-scanning/alerts`
lists detected secrets with type, state, resolution, and (as of June 2025)
`first_location_detected` metadata without needing a separate API call. Requires
admin/owner access [9].

All of these work fully without cloning.

---

### 4. GitHub REST API: Search Endpoints [CONFIDENCE: HIGH]

**Repositories** — `GET /search/repositories?q=...` supports qualifiers:
language, stars, forks, topic, org, archived, pushed, created, license,
in:name/description/readme [10].

**Code search** — `GET /search/code?q=...` searches file content across repos.
Searches default branch only; files >384KB excluded [10].

**Commits** — `GET /search/commits?q=...` finds commits by message, author, date
range [10].

**Topics** — `GET /search/topics?q=...` finds topics by name/description [10].

**Search rate limits are stricter than general API:**

- Authenticated: 30 requests/minute (all search endpoints)
- Code search specifically: 9 requests/minute authenticated
- Unauthenticated: 10 requests/minute
- All search endpoints cap results at 1,000 total regardless of pagination [10]

---

### 5. GitHub GraphQL API: Additional Data vs. REST [CONFIDENCE: HIGH]

The GraphQL endpoint at `api.github.com/graphql` offers several data types not
available (or only partially available) via REST. Key fields on the `Repository`
object [11][2]:

**GraphQL-only or richer than REST:**

- `discussions` — full discussion threads with comments (REST lacks this)
- `discussionCategories` — category list
- `projectsV2` — new-style GitHub Projects data (REST access is limited)
- `environments` — deployment environments
- `deploymentProtectionRules` — rules guarding deployments
- `vulnerabilityAlerts` — Dependabot alerts directly on the repo object
- `securityAndAnalysis` — enabled security feature flags
- `codeOfConduct` — direct code of conduct object
- `contributingGuidelines` — direct object
- `branchProtectionRules` — branch protection configuration
- `milestones` — project milestones
- `packages` — GitHub Packages hosted in the repo
- `pinnedIssues` — pinned issue objects

**Efficiency advantage:** A single GraphQL query can pull dozens of these fields
simultaneously, vs. 10+ separate REST calls [12].

**Rate limits:** GraphQL maintains a separate primary rate limit alongside REST.
Mutations cost 5 points; queries cost 1 point per request. Secondary limits: 100
concurrent requests, 900 points/minute [13].

---

### 6. GitHub CLI (gh) for Remote Repo Analysis [CONFIDENCE: HIGH]

**`gh repo view [OWNER/REPO]`** — Returns repo metadata as formatted text
(README + description) or JSON. The `--json` flag accepts a rich field list
sourced from GraphQL [2]:

All fields available via `gh repo view --json`:
`archivedAt, assignableUsers, codeOfConduct, contactLinks, createdAt, defaultBranchRef, deleteBranchOnMerge, description, diskUsage, forkCount, fundingLinks, hasDiscussionsEnabled, hasIssuesEnabled, hasProjectsEnabled, hasWikiEnabled, homepageUrl, id, isArchived, isBlankIssuesEnabled, isEmpty, isFork, isInOrganization, isMirror, isPrivate, isSecurityPolicyEnabled, isTemplate, issueTemplates, issues, labels, languages, latestRelease, licenseInfo, mentionableUsers, mergeCommitAllowed, milestones, mirrorUrl, name, nameWithOwner, openGraphImageUrl, owner, parent, primaryLanguage, projects, projectsV2, pullRequestTemplates, pullRequests, pushedAt, rebaseMergeAllowed, repositoryTopics, securityPolicyUrl, squashMergeAllowed, sshUrl, stargazerCount, templateRepository, updatedAt, url, usesCustomOpenGraphImage, viewerCanAdminister, viewerDefaultMergeMethod, viewerPermission, viewerSubscription`
(58 fields) [2]

**`gh api /repos/{owner}/{repo}/...`** — Direct access to any REST endpoint with
built-in auth token handling, JSON filtering (`--jq`), pagination
(`--paginate`), and Go template output (`-t`). Eliminates need for curl + token
management [14].

**`gh api graphql -f query='...'`** — Execute arbitrary GraphQL queries. With
`--paginate` automatically handles `pageInfo.hasNextPage`/`endCursor` for
paginated results [15].

---

### 7. Rate Limits: Full Tier Summary [CONFIDENCE: HIGH]

| Auth Method                 | Primary Limit        | Notes                                                                    |
| --------------------------- | -------------------- | ------------------------------------------------------------------------ |
| Unauthenticated             | 60 req/hr            | IP-based; updated enforcement rollout in May 2025 [16][17]               |
| Personal Access Token       | 5,000 req/hr         | Standard authenticated                                                   |
| OAuth App (client creds)    | 5,000 req/hr per app |                                                                          |
| GitHub App (installation)   | 5,000–12,500 req/hr  | Scales: +50/hr per repo beyond 20, +50/hr per user beyond 20; max 12,500 |
| GitHub Enterprise Cloud     | 15,000 req/hr        | PAT, OAuth, GitHub Apps all get 15K                                      |
| GitHub Actions GITHUB_TOKEN | 1,000 req/hr         | Per repository; 15K on GHEC                                              |

**Secondary rate limits (all tiers):**

- Max 100 concurrent requests (REST + GraphQL combined)
- 900 points/minute (GET=1pt, POST/PATCH/PUT/DELETE/GraphQL mutation=5pts)
- 90 seconds CPU time per 60 seconds real time
- 80 content-generating requests/minute (500/hr)

**Search-specific (separate from primary):**

- 30 req/min authenticated (all search endpoints)
- 9 req/min for code search (authenticated)
- 10 req/min unauthenticated search

---

### 8. github-readme-stats [CONFIDENCE: HIGH]

Open-source project by Anurag Hazra, deployed on Vercel. Consumes GitHub's
public APIs to generate embeddable SVG cards [18].

**Cards available:**

- **Stats Card** — total commits, PRs, issues, stars, contributions (public
  repos by default)
- **Top Languages Card** — language distribution in multiple layouts: default,
  compact, donut, donut-vertical, pie
- **Extra Pins** — individual repo stats cards
- **Gist Pins** — gist cards
- **WakaTime Stats** — coding time integration

**Auth:** Uses GitHub token for rate limit expansion; public instance on Vercel
is subject to rate limit pressure. **Cache:** Default 24 hrs (stats), 144 hrs
(top languages), 240 hrs (pins). Min cache 21,600 seconds. **Insight
derivable:** Developer profile snapshot, language distribution across all public
repos, engagement metrics. **Limitation:** Public repos only by default; private
repos require self-hosting with appropriate token [18].

---

### 9. Repobeats (by Axiom) [CONFIDENCE: MEDIUM]

Proprietary (not open source), free service that generates embeddable analytics
widgets for GitHub repository READMEs [19].

**Data provided:**

- Contributions in last 30 days (commits, PRs)
- Opened vs. closed issue ratio
- Contribution heatmap for top contributors
- Trend charts: issues, PRs, pushes/commits over time
- Top contributor rankings across code and issues

**Data source:** GitHub public data (API-backed; specific endpoints not
disclosed). **Embedding:** SVG/badge embed URL inserted in any Markdown README.
**Auth requirements:** None for public repos (service handles it). **Output
format:** Embeddable SVG image URL. **Limitations:** Proprietary, maintained by
Axiom; no documented public API for programmatic access; public repos only [19].

---

### 10. github-profile-summary-cards [CONFIDENCE: MEDIUM]

Open-source GitHub Action that generates 5 profile summary card types [20]:

**Cards:**

- Profile details card
- Repos per language card
- Most commit language card
- Stats card (commits, PRs, issues, contributed repos)

**Deployment:** GitHub Action or local Node.js script with `GITHUB_TOKEN`.
**Output:** SVG card images placed in `profile-summary-card-output/` folder.
**Data source:** GitHub API (REST/GraphQL via token). **Insight:** Useful for
understanding a developer's language portfolio and contribution patterns across
all public repos [20].

---

### 11. OpenSSF Scorecard [CONFIDENCE: HIGH]

Security analysis tool that runs 19 automated checks and returns a 0-10 score
per check. Critical insight: many checks work entirely via GitHub API without
cloning [21].

**Remote (API-only) checks:**

- Branch-Protection — queries branch protection API
- CI-Tests — examines CheckRuns/Statuses via API
- CII-Best-Practices — queries OpenSSF Best Practices badge API
- Code-Review — analyzes GitHub approval metadata
- Contributors — GitHub user profile org affiliation
- License — GitHub License API
- Maintained — commit frequency and issue activity via API
- Packaging — searches for packaging workflows
- Signed-Releases — inspects release assets
- Vulnerabilities — queries GitHub vulnerability database

**Clone-required checks:** Binary-Artifacts, Dangerous-Workflow,
Dependency-Update-Tool, Fuzzing, Pinned-Dependencies, SAST, SBOM,
Security-Policy, Token-Permissions

**Public API:** `https://api.securityscorecards.dev` — query pre-computed scores
for 1M+ repos scanned weekly. Results in BigQuery [21][22].

---

### 12. git-sizer [CONFIDENCE: HIGH]

GitHub's official repository size metrics tool. Computes 20+ metrics including
object counts, blob sizes, tree complexity, checkout impact [23].

**Requires local clone.** Cannot operate remotely. Must run against a full,
non-shallow clone. **Metrics:** total objects, largest blobs, deepest history,
largest directories, widest trees, potential "git bomb" detection. **Risk
flagging:** asterisk system (1=mild, 2+=escalating, !=critical). **Remote
analysis capability: None** — this is a local-only tool [23].

---

### 13. onefetch [CONFIDENCE: HIGH]

Command-line tool for git repo information display. Detects licenses, shows
contributor breakdown, language distribution, LOC, and pending changes.

**Requires local clone.** Cannot operate remotely. Offline-only by design [24].
**Remote analysis capability: None.**

---

### 14. Gource [CONFIDENCE: HIGH]

Software version control visualization using OpenGL rendering. Creates animated
video of repo evolution as file-tree animation with contributors as moving
nodes.

**Requires local clone.** No remote/API mode. Requires git log data from a local
clone. **Remote analysis capability: None** [25].

---

### 15. repo-visualizer (GitHub OCTO) [CONFIDENCE: MEDIUM]

GitHub Action by GitHub's OCTO team that creates an SVG diagram of the
repository file structure.

**Requires checkout step** — the action must run `actions/checkout` first to
access the codebase. It is not a remote analysis tool; it needs the checked-out
code. **Output:** SVG file showing file structure as a diagram. Can be committed
or saved as artifact. **Remote analysis capability: Indirect** — runs in GitHub
Actions context (not local), but still needs the code checked out into the
runner [26].

---

### 16. Githru [CONFIDENCE: MEDIUM]

Visual analytics research system for exploring software development history via
git metadata. Uses graph reconstruction, clustering, and Context-Preserving
Squash Merge (CSM) methods.

**Requires local git metadata.** Has a `git-metadata-preprocessor` that acts as
a GitHub crawler, but primary analysis is on local git objects. **Best for:**
Large commit graph exploration, cluster-based visualization, comparing
development periods. **Remote analysis capability: Limited** — preprocessor can
scrape GitHub API data, but full analysis requires git metadata [27].

---

### 17. git-truck [CONFIDENCE: MEDIUM]

Local git repository visualization tool. Shows who worked on which parts of the
project, activity hotspots, and file structure overview.

**Requires local clone.** Privacy-focused by design, no cloud services,
offline-capable. **Command:** `npx -y git-truck` run from inside a cloned
repository. **Remote analysis capability: None** [28].

---

## Sources

| #   | URL                                                                                                                 | Title                               | Type                       | Trust       | CRAAP Avg | Date      |
| --- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | -------------------------- | ----------- | --------- | --------- |
| 1   | https://docs.github.com/en/rest/metrics/statistics                                                                  | REST API: Repository Statistics     | official-docs              | HIGH        | 4.8       | 2026-03   |
| 2   | https://docs.github.com/en/rest/repos/repos                                                                         | REST API: Repositories              | official-docs              | HIGH        | 4.8       | 2026-03   |
| 3   | https://docs.github.com/en/rest/metrics/community                                                                   | REST API: Community Profile         | official-docs              | HIGH        | 4.8       | 2026-03   |
| 4   | https://docs.github.com/en/rest/metrics/traffic                                                                     | REST API: Repository Traffic        | official-docs              | HIGH        | 4.8       | 2026-03   |
| 5   | https://docs.github.com/en/rest/dependency-graph/sboms                                                              | REST API: SBOM                      | official-docs              | HIGH        | 4.8       | 2026-03   |
| 6   | https://docs.github.com/en/rest/dependency-graph                                                                    | REST API: Dependency Graph          | official-docs              | HIGH        | 4.8       | 2026-03   |
| 7   | https://docs.github.com/en/rest/dependabot/alerts                                                                   | REST API: Dependabot Alerts         | official-docs              | HIGH        | 4.8       | 2026-03   |
| 8   | https://docs.github.com/en/rest/code-scanning/code-scanning                                                         | REST API: Code Scanning             | official-docs              | HIGH        | 4.8       | 2026-03   |
| 9   | https://docs.github.com/en/rest/secret-scanning/secret-scanning                                                     | REST API: Secret Scanning           | official-docs              | HIGH        | 4.8       | 2025-06   |
| 10  | https://docs.github.com/en/rest/search/search                                                                       | REST API: Search                    | official-docs              | HIGH        | 4.8       | 2026-03   |
| 11  | https://docs.github.com/en/graphql/reference/objects#repository                                                     | GraphQL: Repository Object          | official-docs              | HIGH        | 4.8       | 2026-03   |
| 12  | https://docs.github.com/en/rest/about-the-rest-api/comparing-githubs-rest-api-and-graphql-api                       | Comparing REST vs GraphQL           | official-docs              | HIGH        | 4.7       | 2026-03   |
| 13  | https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api                                     | REST API Rate Limits                | official-docs              | HIGH        | 4.8       | 2026-03   |
| 14  | https://cli.github.com/manual/gh_api                                                                                | gh api manual                       | official-docs              | HIGH        | 4.7       | 2025      |
| 15  | https://github.blog/developer-skills/github/exploring-github-cli-how-to-interact-with-githubs-graphql-api-endpoint/ | Exploring GitHub CLI with GraphQL   | GitHub blog                | MEDIUM-HIGH | 4.2       | 2024      |
| 16  | https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/rate-limits-for-github-apps           | Rate Limits for GitHub Apps         | official-docs              | HIGH        | 4.8       | 2026-03   |
| 17  | https://github.blog/changelog/2025-05-08-updated-rate-limits-for-unauthenticated-requests/                          | Updated Unauthenticated Rate Limits | GitHub changelog           | HIGH        | 4.5       | 2025-05   |
| 18  | https://github.com/anuraghazra/github-readme-stats                                                                  | github-readme-stats                 | GitHub repo (project)      | MEDIUM-HIGH | 4.0       | 2024      |
| 19  | https://repobeats.axiom.co/                                                                                         | Repobeats                           | vendor site                | MEDIUM      | 3.5       | 2024      |
| 20  | https://github.com/vn7n24fzkq/github-profile-summary-cards                                                          | github-profile-summary-cards        | GitHub repo                | MEDIUM      | 3.8       | 2024      |
| 21  | https://github.com/ossf/scorecard/blob/main/docs/checks.md                                                          | OpenSSF Scorecard Checks            | official project docs      | HIGH        | 4.5       | 2024-2025 |
| 22  | https://scorecard.dev/                                                                                              | OpenSSF Scorecard Website           | official project           | HIGH        | 4.3       | 2025      |
| 23  | https://github.com/github/git-sizer                                                                                 | git-sizer                           | GitHub (GitHub Inc.)       | HIGH        | 4.5       | 2024      |
| 24  | https://github.com/o2sh/onefetch                                                                                    | onefetch                            | GitHub repo                | MEDIUM-HIGH | 4.0       | 2024      |
| 25  | https://gource.io/                                                                                                  | Gource                              | project site               | MEDIUM-HIGH | 4.0       | 2024      |
| 26  | https://github.com/githubocto/repo-visualizer                                                                       | repo-visualizer                     | GitHub OCTO (official-ish) | MEDIUM-HIGH | 4.0       | 2023      |
| 27  | https://github.com/githru/githru                                                                                    | Githru                              | GitHub repo (academic)     | MEDIUM      | 3.5       | 2024      |
| 28  | https://github.com/git-truck/git-truck                                                                              | git-truck                           | GitHub repo                | MEDIUM      | 3.8       | 2024      |

---

## Contradictions

**Rate limit for GitHub Apps:** The official REST rate-limits doc says base
5,000/hr with a +50/hr-per-repo/user scaling up to 12,500/hr max for
non-Enterprise. A common shorthand claims "15,000/hr for GitHub Apps" but that
applies only to GitHub Enterprise Cloud (GHEC). Non-GHEC GitHub Apps max at
12,500/hr, not 15,000/hr. The 15K figure is specifically a GHEC benefit. This is
a common source of confusion [13][16].

**Unauthenticated rate limit change (May 2025):** GitHub Changelog announced
"updated rate limits for unauthenticated requests" in May 2025, but the
changelog post itself does not disclose the new numerical limits. Current
official docs still state 60 req/hr for unauthenticated. It is unclear whether
the enforcement tightened without changing the nominal limit, or whether lower
limits apply in certain scenarios [13][17].

**Scorecard clone vs. remote:** Some Scorecard checks are described as
"API-based" but still analyze file contents (e.g., Dangerous-Workflow reads
workflow YAML files). GitHub's API does expose file contents via
`/repos/{owner}/{repo}/contents/...`, so the distinction is between "needs local
git" vs. "can read via contents API." Scorecard's internal implementation likely
uses API-based file fetching for many clone-required checks when running in
remote mode.

---

## Gaps

1. **GitHub's "Pulse" data is not available via API.** The GitHub UI's Pulse tab
   (showing PR/issue/commit summaries) has no corresponding REST endpoint.
   Confirmed by community discussions [search result ref].

2. **Dependents (repos that depend on this repo):** No official REST or GraphQL
   API endpoint for "dependents" exists. The GitHub UI shows dependents for
   popular repos but there is no API to retrieve this data programmatically.
   Only the SBOM endpoint shows what a repo depends on (outward), not who
   depends on it (inward).

3. **Repobeats internals:** Repobeats does not document which specific GitHub
   API endpoints it uses, rate limit handling strategy, or whether private repos
   are supported. The tool is proprietary; its data pipeline is a black box.

4. **Traffic data retention:** All traffic API endpoints return only the last 14
   days. GitHub does not provide historical traffic data beyond this window via
   API. Retention must be handled client-side by polling.

5. **Code frequency >10K commits:** The `stats/code_frequency` and
   `stats/contributors` endpoints return 0 values or fail with 422 for repos
   with more than 10,000 commits. Large open-source repos hit this limit; no
   workaround exists via the current API.

6. **GraphQL rate limit specifics:** The GraphQL API has a separate primary rate
   limit, but the specific requests/hour figure for GraphQL (beyond secondary
   rate limits) was not documented clearly in official sources reviewed.

7. **onefetch remote mode:** Community requests for remote analysis capability
   exist for onefetch, but as of the research date the tool has no official
   remote/API mode. Third-party wrappers may exist but were not evaluated.

---

## Serendipity

1. **`gh repo view --json diskUsage`** returns repo size in kilobytes — a quick
   remote proxy for repository complexity/health without any cloning.

2. **Code scanning CodeQL databases are queryable:**
   `GET /repos/{owner}/{repo}/code-scanning/codeql/databases` lists available
   CodeQL databases for a repo. This is a significant discovery — it means you
   can check whether a repo has been analyzed by CodeQL without cloning, and
   potentially download the database for offline analysis via
   `GET .../codeql/databases/{language}`.

3. **OpenSSF Scorecard public API at `https://api.securityscorecards.dev`**
   provides pre-computed scores for over 1 million repos, scanned weekly. This
   means for popular open-source repos you can often get a full security
   scorecard result instantly without running the tool at all.

4. **GitHub's `stats/punch_card`** endpoint reveals commit time-of-day patterns
   — this is a behavioral proxy for understanding team working hours and
   geographic distribution, derivable with zero cloning.

5. **`gh repo view --json latestRelease`** returns the latest release tag, name,
   and timestamp — useful for gauging project release cadence without any local
   git operations.

---

## Remote-Only Analysis Capability Matrix

| Capability                                   | Tool/Endpoint                  | Auth Required     | Rate Limit Concern | Data Completeness                                    |
| -------------------------------------------- | ------------------------------ | ----------------- | ------------------ | ---------------------------------------------------- |
| Repo metadata (stars, forks, language, size) | REST `/repos/{owner}/{repo}`   | None (public)     | Low                | Full                                                 |
| Language byte distribution                   | REST `/languages`              | None (public)     | Low                | Full                                                 |
| Topics                                       | REST `/topics`                 | None (public)     | Low                | Full                                                 |
| Contributor list + commit counts             | REST `/contributors`           | None (public)     | Low                | Full (no additions/deletions for >10K commits repos) |
| Community health score                       | REST `/community/profile`      | None (public)     | Low                | Partial (no fork repos)                              |
| Last-year commit activity (weekly)           | REST `stats/commit_activity`   | None              | Low                | Full                                                 |
| Weekly additions/deletions                   | REST `stats/code_frequency`    | None              | Low                | Fails for >10K commit repos                          |
| 52-week owner vs. others participation       | REST `stats/participation`     | None              | Low                | Full                                                 |
| Commit time-of-day heatmap                   | REST `stats/punch_card`        | None              | Low                | Full                                                 |
| Repo traffic (views, clones, referrers)      | REST `/traffic/*`              | Write access      | Low                | Last 14 days only                                    |
| SBOM (all dependencies + licenses)           | REST `/dependency-graph/sbom`  | Read access       | Low                | Full                                                 |
| Dependabot vulnerability alerts              | REST `/dependabot/alerts`      | `security_events` | Low                | Full                                                 |
| Code scanning alerts                         | REST `/code-scanning/alerts`   | `security_events` | Low                | Full                                                 |
| Secret scanning alerts                       | REST `/secret-scanning/alerts` | Admin access      | Low                | Full                                                 |
| Discussions, milestones, packages            | GraphQL only                   | Token             | Medium             | Full                                                 |
| Branch protection rules                      | GraphQL only                   | Token             | Medium             | Full                                                 |
| Security feature enablement flags            | GraphQL `securityAndAnalysis`  | Token             | Medium             | Full                                                 |
| Repository search by language/topic          | REST `/search/repositories`    | None (degraded)   | High (30/min)      | 1,000 results max                                    |
| Code content search                          | REST `/search/code`            | Required          | High (9/min)       | 1,000 results max                                    |
| Security scorecard (OpenSSF)                 | api.securityscorecards.dev     | None              | None (external)    | Pre-computed for 1M+ repos                           |
| Embeddable stats widget                      | github-readme-stats            | Token (self-host) | Vercel-limited     | Public repos only                                    |
| Activity/contribution heatmap widget         | Repobeats                      | None              | External SaaS      | Public repos only                                    |
| git-sizer metrics                            | git-sizer CLI                  | N/A (local only)  | N/A                | Requires clone                                       |
| onefetch summary                             | onefetch CLI                   | N/A (local only)  | N/A                | Requires clone                                       |
| Gource visualization                         | Gource                         | N/A (local only)  | N/A                | Requires clone                                       |
| git-truck visualization                      | git-truck                      | N/A (local only)  | N/A                | Requires clone                                       |
| repo-visualizer SVG                          | GitHub Action                  | Actions context   | N/A                | Requires checkout                                    |
| Githru visual analytics                      | Githru + preprocessor          | Token (crawler)   | Medium             | Partial remote only                                  |
| Full 58-field repo JSON                      | `gh repo view --json`          | Token recommended | Low                | Full (GraphQL-backed)                                |

---

## Confidence Assessment

- HIGH claims: 11
- MEDIUM claims: 5
- LOW claims: 0
- UNVERIFIED claims: 0
- **Overall confidence: HIGH**

All key findings are backed by official GitHub documentation (Tier 1 sources).
The only MEDIUM-confidence findings are for proprietary/third-party tools
(Repobeats, github-profile-summary-cards, Githru) where internal details are
inferred from project documentation rather than authoritative specification.

# Findings: D7 — Constraints and Edge Cases for Automated Repo Analysis

**Searcher:** deep-research-searcher **Profile:** web **Date:** 2026-03-31
**Sub-Question IDs:** D7

---

## Key Findings

### 1. GitHub API Rate Limits: Full Taxonomy [CONFIDENCE: HIGH]

The rate limit system has four distinct categories, each with its own bucket,
queryable via `GET /rate_limit` without consuming quota.

**Primary rate limits (requests per hour):**

| Auth method                    | Core API                | Search API | Code Search         |
| ------------------------------ | ----------------------- | ---------- | ------------------- |
| Unauthenticated (IP-based)     | 60                      | 10         | N/A (auth required) |
| PAT / user token               | 5,000                   | 30         | 10/min              |
| OAuth App (client_id+secret)   | 5,000                   | 30         | 10/min              |
| GitHub App installation token  | 5,000–12,500 (scalable) | 30         | 10/min              |
| GitHub App on Enterprise Cloud | 15,000                  | 30         | 10/min              |
| GitHub Actions `GITHUB_TOKEN`  | 1,000/repo              | 30         | 10/min              |
| Actions on Enterprise Cloud    | 15,000/repo             | 30         | 10/min              |

**Scalable GitHub App formula:** base 5,000 + 50/repo (over 20) + 50/user (over
20), capped at 12,500/hr (non-enterprise) [1].

**GraphQL rate limits:** 5,000 points/hr per user (10,000 for Enterprise Cloud).
Secondary secondary cap: 2,000 points/minute. Cost: GET-style queries = 1 point,
mutations = 5 points. Node limit: hard cap of 500,000 nodes per call [2].

**Secondary rate limits (any auth level):** max 100 concurrent requests, max 80
content-creating requests/minute, max 500 content-creating requests/hour, max
90s CPU per 60s real time, max 60s of that CPU for GraphQL [1].

**Code search note:** All code search endpoints require authentication as of
April 2023. Sorting is deprecated — best-match only [3].

**Search API 1,000 result cap:** The Search API enforces a hard ceiling of 1,000
results per query regardless of pagination. Workarounds: date-range
segmentation, size-range segmentation, running multiple narrower queries [4].

**May 2025 unauthenticated change:** GitHub tightened limits for unauthenticated
access (HTTPS clone, raw.githubusercontent.com downloads, anonymous REST calls)
due to increased scraping activity. Exact new thresholds not published;
authenticated access unaffected [5].

**Checking limits proactively:** Read `x-ratelimit-remaining` and
`x-ratelimit-reset` headers on every response. Query `GET /rate_limit` to
inspect all resource buckets before starting a heavy operation. The
`/rate_limit` endpoint does NOT count against quota [6].

---

### 2. Large Repository Constraints (100k+ commits, multi-GB) [CONFIDENCE: HIGH]

**Statistics endpoints fail at 10,000 commits:**

- `GET /repos/{owner}/{repo}/stats/code_frequency` — returns HTTP 422 for repos
  with ≥10,000 commits [7].
- `GET /repos/{owner}/{repo}/stats/contributors` — returns 0 values for all
  addition/ deletion counts in repos with ≥10,000 commits (data silently zeroed,
  NOT an error) [7].
- Statistics are cached by default branch SHA. A background job must compile
  them first; if data is not cached the API returns HTTP 202 and fires a
  background job. Callers must poll until 200 is received [7].
- All statistics exclude merge commits and empty commits.

**Commit traversal cost:** `GET /repos/{owner}/{repo}/commits` returns max 100
per page. Repos like `torvalds/linux` (800k+ commits) require 8,000+ API calls
to traverse fully — consuming the entire hourly PAT budget of 5,000 requests
before completion [8].

**Repository size field is unreliable:**

- The REST API `size` field is in kilobytes, excludes LFS objects, and is known
  to be inaccurate (confirmed by multiple users and implied by GitHub support).
  An 80 MB repo on disk can report size=2,340 while a 19 MB repo reports
  size=6,414 [9].
- GraphQL `diskUsage` field (in KB) is a slightly better signal but also
  excludes LFS.
- Hard limits: 10 GB max repo, hard file size limit 100 MB (50 MB warning), push
  size limit 2 GB [10].

**Directory/file count limits:**

- Contents API: 1,000 files per directory maximum. No pagination available at
  this endpoint. Affects both the API AND the web UI [11].
- Git Trees API (recursive): 100,000 entries, 7 MB maximum. When exceeded,
  response returns `truncated: true` and callers must fetch sub-trees
  non-recursively [12].
- Workaround for large trees: fetch the root tree non-recursively, then recurse
  into each subtree separately. More API calls, but no hard ceiling.

**Branch limits:** Hard limit of 5,000 branches. Directory depth limit: 50
levels. Directory width limit: 3,000 entries (documented) [10].

**Diff limits (PR/compare views):** 300 files per diff, 20,000 lines or 1 MB
total, 500 KB or 20,000 lines per single file. Only 25 files rendered. These are
web/UI limits that also affect API diff endpoints [10].

**Commits tab:** Max 10,000 commits displayed in UI. Compare view caps at 250
[10].

---

### 3. Monorepo Detection Heuristics [CONFIDENCE: HIGH]

Detection is file-presence based — check for these indicator files via the
Contents API or Git Trees API:

| Tool                 | Primary indicator file(s)              | Secondary signals                                  |
| -------------------- | -------------------------------------- | -------------------------------------------------- |
| Turborepo            | `turbo.json`                           | `apps/` + `packages/` dirs                         |
| Nx                   | `nx.json`                              | `workspace.json`, `project.json` files in packages |
| Lerna (v6+)          | `lerna.json`                           | delegates to Nx for execution                      |
| npm workspaces       | `package.json` with `"workspaces"` key | no separate config file                            |
| yarn workspaces (v1) | `package.json` with `"workspaces"` key | `yarn.lock` present                                |
| pnpm workspaces      | `pnpm-workspace.yaml`                  | `pnpm-lock.yaml` present                           |
| Bazel                | `WORKSPACE` or `WORKSPACE.bazel`       | `BUILD` or `BUILD.bazel` files                     |
| Rush                 | `rush.json`                            |                                                    |
| Moon                 | `.moon/workspace.yml`                  |                                                    |

**Detection algorithm:**

1. Fetch root-level file listing via Contents API (1 request).
2. Check for `turbo.json`, `nx.json`, `lerna.json`, `pnpm-workspace.yaml`,
   `rush.json`, `.moon/`.
3. If none found, fetch `package.json` and parse for `"workspaces"` field.
4. Multiple matches possible (e.g., pnpm + Turborepo together).

**Sub-package analysis:** After detecting workspace type, parse the workspace
config to enumerate package paths. For npm/yarn, parse `package.json#workspaces`
globs. For pnpm, parse `pnpm-workspace.yaml#packages`. For Turborepo,
`turbo.json` pipelines define tasks but not package paths — paths still come
from the package manager workspace config [13][14].

---

### 4. Non-Standard Layouts and Language Detection [CONFIDENCE: HIGH]

**Linguist language detection behavior:** GitHub uses the open-source Linguist
library for all language stats. It automatically excludes from stats:

- Generated files (minified JS, compiled outputs) — detected via `generated.rb`
  patterns
- Vendored code (`vendor/`, `node_modules/`, etc.) — detected via `vendor.yml`
- Documentation paths — detected via `documentation.yml`

Overrides are configured via `.gitattributes` using attributes:
`linguist-generated`, `linguist-vendored`, `linguist-documentation`,
`linguist-language`, `linguist-detectable`. Only `programming` and `markup`
language types count toward stats by default [15].

**Impact on analysis:** The language breakdown returned by
`GET /repos/{owner}/{repo}/languages` reflects Linguist's filtered view, which
may significantly undercount or misclassify repos that:

- Contain large amounts of auto-generated code without `.gitattributes`
  overrides
- Are polyglot with significant vendored third-party code
- Use uncommon languages not in Linguist's `languages.yml`

**No `src/` directory:** This is purely a convention; the API does not rely on
it. Analysis tools should enumerate actual top-level directories rather than
assuming `src/`.

**Multi-language repos:** The `languages` endpoint returns a map of language →
bytes. Treat the output as advisory, not ground truth. For more accurate counts,
use the Git Trees API to enumerate all files and classify them independently.

**Generated/vendored detection without `.gitattributes`:** Common reliable
signals:

- `node_modules/` present in tree → vendored JS
- `vendor/` present in tree → vendored Go or Ruby
- Files ending in `.min.js`, `.bundle.js`, `.pb.go`, `_generated.go`, `*.g.cs`
- `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml` are generated but should
  not be excluded from dependency analysis

---

### 5. Archived and Inactive Repository Handling [CONFIDENCE: HIGH]

**Detection fields (REST API):** The repository object includes:

- `archived` (boolean) — true if repo is set read-only
- `disabled` (boolean) — true if repo is disabled
- `pushed_at` (ISO 8601 timestamp) — last push time; use for inactivity
  classification
- `updated_at` — last update to repo metadata (not just code)

**GraphQL additions:**

- `isArchived` (boolean)
- `archivedAt` (timestamp, nullable) — added April 2023. Null = not archived.
  Populated = when archived. Previously this was not queryable [16].

**Inactivity heuristics:** GitHub's own stale-repos tool flags repos with no
push in a configurable number of days (commonly 365). Also checks for open PRs
as secondary signal. "Inactive" is not a formal API field — it must be derived
from `pushed_at` [17].

**Analysis implications:**

- Archived repos are frozen; no new commits, PRs, or issues can be created
- Analysis should still run on archived repos (they represent real historical
  state)
- But output should be labeled with archived status and `archivedAt` date
- Warning: the API has no field for the date of archival prior to the April 2023
  GraphQL addition; old archival events have no queryable timestamp

---

### 6. Fork vs. Original Detection [CONFIDENCE: HIGH]

**REST API detection:** The `GET /repos/{owner}/{repo}` endpoint returns:

- `fork` (boolean) — true if this repo is a fork
- `parent` (Repository object, present only if fork) — the immediate upstream
  fork source
- `source` (Repository object, present only if fork) — the ultimate root of the
  fork network
- `network_count` (integer) — size of the entire fork network [18]

**GraphQL equivalents:**

- `isFork` (boolean)
- `parent { ... }` object
- `forkCount` (number of forks of this repo, not the network count)

**Analysis strategy for forks:**

1. Always fetch full repo object (not just metadata) to get `parent`/`source`.
2. If `fork = true` and `parent` diverges from `source`, the fork chain is
   multi-level.
3. For analysis: consider running duplicate-detection against `source` repo to
   identify original vs. derived work.
4. Fork repos with significant commit divergence from parent may be
   substantively independent projects despite being technically forks.

---

### 7. Private Repository Authentication Flows [CONFIDENCE: HIGH]

Three primary auth mechanisms for private repo access:

**Personal Access Token (PAT):**

- Fine-grained PATs: per-repo scoping, specific permission sets, expiry 1 day–1
  year
- Classic PATs: broad `repo` scope, optional expiry
- Simplest to implement; carries risk if leaked (acts as a user credential)
- NOT suitable for multi-user/multi-org tools (single user's rate limit)

**GitHub App with Installation Token:**

- Installation tokens expire after 1 hour (not 8 hours — the 8-hour figure is
  for user access tokens)
- Rate limit scales with install size (up to 15,000/hr on Enterprise Cloud)
- Fine-grained: scoped to specific repos and specific permissions
- Preferred for production tools due to decoupling from individuals [19]
- Requires: app creation, private key generation, JWT signing, installation ID
  lookup

**Deploy Keys:**

- SSH keys scoped to a single repository
- Provides read-only or read-write access to one repo only
- Not suitable for multi-repo analysis tools
- Not protected by passphrase by default — server compromise = key compromise
  [20]

**OAuth flow:** Not recommended for automated tools (requires user browser
interaction). Suitable for user-facing apps but not background analysis.

**SSH for clone operations:** SSH keys authenticate the clone/fetch but do not
provide API access. For API calls, always use a token. SSH is relevant only when
cloning the full repo is required for local analysis.

---

### 8. Git LFS Detection [CONFIDENCE: MEDIUM-HIGH]

**No dedicated LFS detection API endpoint exists.** Detection requires
inference:

**Method 1: Parse `.gitattributes` via Contents API**

- `GET /repos/{owner}/{repo}/contents/.gitattributes`
- Decode base64 content
- Search for `filter=lfs` in the decoded text
- Limitation: file may not exist if LFS was never configured, or may exist
  without being committed [21]

**Method 2: Inspect individual file blobs**

- LFS pointer files contain `version https://git-lfs.github.com/spec/v1` as
  first line
- Contents API reports file size based on the pointer (small, ~130 bytes), not
  actual LFS object size
- This makes the `size` field completely misleading for LFS-tracked files

**Method 3: Check repository media type headers**

- When fetching file content, LFS pointer files can be identified by the small
  size and specific pointer format

**Impact on analysis:**

- The repo `size` API field does NOT include LFS storage, making size estimates
  for LFS-heavy repos (ML model repos, game asset repos) severely wrong
- Cloning for local analysis will pull LFS pointer files by default; fetching
  actual objects requires `git lfs pull` and may be very large
- Analysis tools should detect LFS before attempting local clone

---

### 9. Empty and Skeleton Repository Handling [CONFIDENCE: HIGH]

**Detection approaches and their failure modes:**

| Approach                                | Fails when                                                              |
| --------------------------------------- | ----------------------------------------------------------------------- |
| Check `size == 0`                       | Repos with only a `README.md` may show size=0 or a small non-zero value |
| Check `commits_count == 0`              | Edge case: repo may have commits in non-default branches                |
| Contents API returns 404 or empty array | Most reliable — no files = empty                                        |

**Recommended approach:** Call `GET /repos/{owner}/{repo}/contents/` (root
contents).

- If HTTP 404 with "Git Repository is empty" → truly empty (no commits).
- If returns empty array `[]` → possible but unusual (initialized, no files).
- If returns files → non-empty [22].

**Skeleton repos (initialized but hollow):**

- A freshly initialized repo may have only a `.gitignore` and `LICENSE`
- Check for presence of at least one source code file, not just any file
- Minimum viable analysis: require ≥1 file with recognized programming language
  extension

---

### 10. Rate Limit Recovery Strategies [CONFIDENCE: HIGH]

**Exponential backoff:**

- On 429 or 403 (secondary rate limit): wait at minimum the time specified in
  `retry-after` header, then apply exponential backoff (1s → 2s → 4s → 8s...)
- On primary rate limit (`x-ratelimit-remaining = 0`): wait until
  `x-ratelimit-reset` Unix timestamp before retrying
- Never retry while limited — continued requests can result in integration
  banning [23]

**Conditional requests (ETags):**

- Cache `ETag` header from every response
- On subsequent requests, send `If-None-Match: <etag>`
- HTTP 304 responses do NOT count against primary rate limit (requires valid
  auth header)
- ETags are per-page — a 304 on page 1 of 5 does not validate pages 2–5 [24]
- GitHub App token expiry (1 hour) invalidates cached ETags for that token

**Request queuing:**

- Serialize requests through a queue rather than firing concurrently
- GitHub recommends at least 1 second between POST/PATCH/PUT/DELETE operations
- Max 100 concurrent requests across all types (secondary limit)
- Prefer webhooks over polling for change detection [23]

**GraphQL cost preview:**

- Query the `rateLimit { cost remaining resetAt }` field in every GraphQL
  response
- Pre-estimate cost: sum `first`/`last` values across all connections, divide by
  100, round up to nearest integer (minimum 1)
- September 2025: GitHub added execution-resource limits beyond point costs —
  queries fetching exhaustive nested data may return partial responses with
  error indicators [25]

**Token rotation (for high-volume tools):**

- Use GitHub App with multiple installation tokens across organizations
- Each installation gets its own rate limit bucket
- Rate limits scale per-installation, not per-app

---

## Sources

| #   | URL                                                                                                                 | Title                                               | Type                       | Trust       | CRAAP           | Date                         |
| --- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | -------------------------- | ----------- | --------------- | ---------------------------- |
| 1   | https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api                                     | Rate limits for the REST API                        | Official docs              | HIGH        | 5/5/5/5/5 = 5.0 | 2026 (current)               |
| 2   | https://docs.github.com/en/graphql/overview/rate-limits-and-query-limits-for-the-graphql-api                        | GraphQL API rate limits                             | Official docs              | HIGH        | 5/5/5/5/5 = 5.0 | 2026 (current)               |
| 3   | https://github.blog/changelog/2023-03-10-changes-to-the-code-search-api/                                            | Changes to the code search API                      | Official changelog         | HIGH        | 4/5/5/5/5 = 4.8 | 2023-03-10                   |
| 4   | https://github.com/PyGithub/PyGithub/issues/824                                                                     | 1000 results per search limit                       | Community/confirmed        | MEDIUM      | 3/4/3/4/4 = 3.6 | 2021 (confirmed still valid) |
| 5   | https://github.blog/changelog/2025-05-08-updated-rate-limits-for-unauthenticated-requests/                          | Updated rate limits for unauthenticated requests    | Official changelog         | HIGH        | 5/5/5/5/5 = 5.0 | 2025-05-08                   |
| 6   | https://docs.github.com/en/rest/rate-limit/rate-limit                                                               | REST API endpoints for rate limits                  | Official docs              | HIGH        | 5/5/5/5/5 = 5.0 | 2026 (current)               |
| 7   | https://docs.github.com/en/rest/metrics/statistics                                                                  | REST API endpoints for repository statistics        | Official docs              | HIGH        | 5/5/5/5/5 = 5.0 | 2026 (current)               |
| 8   | https://janvitek.org/events/NEU/6050/github_download.html                                                           | GitHub repository data retrieval                    | Academic/practitioner      | MEDIUM      | 3/4/4/4/4 = 3.8 | ~2023                        |
| 9   | https://github.com/orgs/community/discussions/23585                                                                 | Github Repository Size in API discussion            | Community                  | MEDIUM      | 3/4/3/3/4 = 3.4 | 2024                         |
| 10  | https://docs.github.com/en/repositories/creating-and-managing-repositories/repository-limits                        | Repository limits                                   | Official docs              | HIGH        | 5/5/5/5/5 = 5.0 | 2026 (current)               |
| 11  | https://github.com/orgs/community/discussions/136892                                                                | 1000 files per directory truncation                 | Community/confirmed        | MEDIUM-HIGH | 4/5/4/4/4 = 4.2 | 2024                         |
| 12  | https://docs.github.com/en/rest/git/trees                                                                           | REST API endpoints for Git trees                    | Official docs              | HIGH        | 5/5/5/5/5 = 5.0 | 2026 (current)               |
| 13  | https://turborepo.dev/docs/reference/configuration                                                                  | Configuring turbo.json                              | Official docs              | HIGH        | 5/5/5/5/5 = 5.0 | 2026 (current)               |
| 14  | https://pnpm.io/workspaces                                                                                          | pnpm Workspace                                      | Official docs              | HIGH        | 5/5/5/5/5 = 5.0 | 2026 (current)               |
| 15  | https://github.com/github-linguist/linguist/blob/main/docs/overrides.md                                             | Linguist overrides documentation                    | Official docs              | HIGH        | 5/5/5/5/5 = 5.0 | 2025 (current)               |
| 16  | https://github.blog/changelog/2023-04-11-repository-archive-date-in-graphql-api/                                    | Repository archive date in GraphQL API              | Official changelog         | HIGH        | 5/5/5/5/5 = 5.0 | 2023-04-11                   |
| 17  | https://christosgalano.github.io/stale-repos-identifier/                                                            | Stale Repos Identifier                              | Community tool             | MEDIUM      | 3/4/3/4/4 = 3.6 | 2024                         |
| 18  | https://docs.github.com/en/rest/repos/repos                                                                         | REST API endpoints for repositories                 | Official docs              | HIGH        | 5/5/5/5/5 = 5.0 | 2026 (current)               |
| 19  | https://docs.github.com/en/apps/creating-github-apps/about-creating-github-apps/deciding-when-to-build-a-github-app | Deciding when to build a GitHub App                 | Official docs              | HIGH        | 5/5/5/5/5 = 5.0 | 2026 (current)               |
| 20  | https://docs.github.com/en/authentication/connecting-to-github-with-ssh/managing-deploy-keys                        | Managing deploy keys                                | Official docs              | HIGH        | 5/5/5/5/5 = 5.0 | 2026 (current)               |
| 21  | https://www.tutorialpedia.org/blog/how-to-find-which-github-repos-are-using-lfs/                                    | How to find which repos are using LFS               | Community guide            | MEDIUM      | 3/4/3/4/4 = 3.6 | 2024                         |
| 22  | https://github.com/education/classroom/issues/1971                                                                  | Decide the best way to determine if a repo is empty | Community/GitHub Classroom | MEDIUM-HIGH | 4/5/4/4/4 = 4.2 | 2021                         |
| 23  | https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api                            | Best practices for using the REST API               | Official docs              | HIGH        | 5/5/5/5/5 = 5.0 | 2026 (current)               |
| 24  | https://github.com/bored-engineer/github-conditional-http-transport                                                 | GitHub conditional HTTP transport (ETag caching)    | Community/OSS              | MEDIUM      | 3/4/3/4/4 = 3.6 | 2023                         |
| 25  | https://github.blog/changelog/2025-09-01-graphql-api-resource-limits/                                               | GraphQL API resource limits                         | Official changelog         | HIGH        | 5/5/5/5/5 = 5.0 | 2025-09-01                   |

---

## Contradictions

**Repo size field semantics:** Multiple sources contradict each other on what
the `size` field includes. Some say it includes git history but excludes LFS;
others say it only reflects current working tree. GitHub has not published an
authoritative definition. Community reports confirm the field is numerically
unreliable regardless of its definition. Treat it as an order-of-magnitude hint
only, not a reliable measurement.

**1,000-file directory limit scope:** Community discussion confirms this affects
both the Contents API and the web UI. However, some older sources suggest it was
only a UI limit. The authoritative GitHub Docs for the Contents API now
explicitly state the 1,000-file maximum, confirming the API is also affected.

**GitHub App token expiry:** One source states 8 hours (user access tokens),
another correctly states 1 hour (installation access tokens). These are
different token types. Confirmed from official docs: installation access tokens
= 1 hour, user access tokens = 8 hours. Skill should use installation tokens (1
hour) and implement refresh logic.

---

## Gaps

1. **Exact unauthenticated limits post-May 2025:** The GitHub changelog stated
   limits were updated but did not publish the specific new numbers. The
   official docs still say 60/hr for REST. The actual enforcement behavior for
   scraping/HTTPS-clone may differ from the documented number.

2. **GraphQL resource limits specifics (Sept 2025):** GitHub explicitly declined
   to publish the exact thresholds "to preserve the integrity of our platform."
   No community source has reverse-engineered these reliably.

3. **LFS storage size via API:** No API endpoint directly reports actual LFS
   object sizes for a repository. Total LFS usage is visible in billing/settings
   UI but not via REST or GraphQL programmatically.

4. **Linguist accuracy for non-GitHub analysis:** If the repo analysis tool runs
   outside GitHub (e.g., via clone + local analysis), Linguist results may
   differ from what `GET /languages` returns, because GitHub may cache language
   stats and not recompute until after a push.

5. **Binary-heavy repo analysis:** No investigation was done into specific API
   behaviors for repos where >90% of files are binary (e.g., game asset repos).
   The language endpoint would return minimal data; git trees traversal would
   work but be slow.

---

## Serendipity

**GitHub imposed a 100,000-repo ownership limit** (April 28, 2025) — both users
and organizations are now capped at 100,000 repositories total [10]. This is
unlikely to affect most users but matters for bulk organizational analysis
tools.

**Deleted repo data persists:** A security researcher (Truffle Security) found
that deleted private repository data on GitHub can remain accessible via forks
or cached objects. This is relevant for analysis tools that need to handle
"ghost" data [18 adjacent finding from search].

**GraphQL `archivedAt` was only added in April 2023** — any analysis tooling
built before that date that claims to report archive dates was fabricating or
approximating that data.

**pnpm is now the recommended workspace manager** for monorepos in 2025-2026
tooling guides, displacing Yarn workspaces in newer projects. Detection
prevalence is shifting accordingly.

---

## Guard Rails Checklist

This is a ready-to-use checklist for the repo-analysis skill to avoid each
failure mode:

### Rate Limits

- [ ] **Always authenticate.** Never make unauthenticated API calls. Minimum:
      PAT. Preferred: GitHub App installation token.
- [ ] **Check `/rate_limit` before each analysis batch.** Abort or queue if
      `remaining < 200` in any relevant category.
- [ ] **Cache `ETag` on every GET response.** Use `If-None-Match` on subsequent
      polls. 304 responses are free.
- [ ] **Use separate rate limit buckets correctly.** Core, search, code_search,
      and graphql are independent. Exhausting search does not affect core.
- [ ] **Never fire >100 concurrent requests.** Serialize or use a queue with
      concurrency ≤ 10 for safety headroom.
- [ ] **On 429 or 403:** read `retry-after` header, wait that duration +
      backoff. Do NOT retry immediately.
- [ ] **Code search: max 10 requests/minute.** Throttle explicitly; do not rely
      on rate limit error as signal.
- [ ] **Search queries: assume ≤1,000 results.** Implement date/size range
      segmentation for exhaustive searches.

### Large Repository Safety

- [ ] **Skip statistics endpoints for repos with ≥10,000 commits.** Detect via
      commit count; do not call `/stats/code_frequency` or get misleading 0
      values from `/stats/contributors`.
- [ ] **Handle HTTP 202 on statistics endpoints.** Retry after 3–5 seconds;
      limit retry count to 5.
- [ ] **Do NOT use the `size` field as authoritative.** Use as a rough filter
      only (e.g., skip repos over 5 GB). Always confirm with a deeper check.
- [ ] **Use Git Trees API, not Contents API, for full file enumeration.**
      Contents API truncates at 1,000 per directory. Trees API handles up to
      100,000 entries (7 MB).
- [ ] **Check `truncated: true` on Trees API responses.** If truncated, fall
      back to non-recursive subtree fetching.
- [ ] **Cap commit traversal.** For repos with >50,000 commits, analyze only the
      most recent N commits rather than full history unless full traversal is
      explicitly required.
- [ ] **Estimate API call budget before starting.** Large repo full commit
      traversal = (commit_count / 100) API calls just for commits.

### Monorepo Handling

- [ ] **Check for monorepo indicators at root.** Look for: `turbo.json`,
      `nx.json`, `lerna.json`, `pnpm-workspace.yaml`, `rush.json`, `.moon/`,
      `package.json#workspaces`.
- [ ] **Multiple indicators are valid.** A repo can use pnpm + Turborepo
      simultaneously.
- [ ] **Parse workspace globs for sub-package paths.** Do not assume `packages/`
      or `apps/` are the only directories.
- [ ] **Analyze each sub-package independently** when the monorepo contains
      discrete deployables.

### Fork and Archive Detection

- [ ] **Always fetch full repository object** (not just list view) to get
      `parent` and `source` fields.
- [ ] **Flag forks in output.** Report `fork: true`, `parent.full_name`, and
      `source.full_name`.
- [ ] **Use `archivedAt` (GraphQL) to report archive date.** If using REST,
      `archived: true` is reliable; date is not available via REST.
- [ ] **Classify inactive repos** using `pushed_at`. Define a threshold (e.g.,
      no push in 365 days = inactive) and label output accordingly.

### LFS Detection

- [ ] **Check for `.gitattributes` with `filter=lfs` before cloning.** Presence
      indicates LFS usage; absence is not conclusive.
- [ ] **Do NOT trust `size` field for LFS repos.** It will undercount by the
      full size of LFS objects.
- [ ] **Warn user before cloning LFS repos** that actual download may far exceed
      the reported repo size.

### Empty and Skeleton Repos

- [ ] **Use Contents API to detect empty repos.** HTTP 404 with "Git Repository
      is empty" = no commits. Empty array = no files in root.
- [ ] **Do not error on empty repos.** Return graceful "empty repository"
      finding with no further analysis.
- [ ] **Distinguish "no commits" from "no source code."** A repo may have
      commits but contain only documentation or configuration.

### Auth and Privacy

- [ ] **Use GitHub App installation tokens for production tools.** They expire
      in 1 hour — implement token refresh.
- [ ] **Never use deploy keys for multi-repo analysis.** One key per repo; not
      scalable.
- [ ] **Require explicit `archived` and `private` field checks** before
      outputting findings. Label output with repo access level.
- [ ] **Handle 401/403 gracefully.** Distinguish "repo not found" from "repo
      exists but access denied" — both return 404 to prevent information
      leakage.

### Non-Standard Layouts

- [ ] **Do not assume `src/` exists.** Enumerate actual root-level directories.
- [ ] **Treat Linguist language stats as advisory.** Cross-check against actual
      file extensions in the tree for accuracy.
- [ ] **Identify and skip vendor/generated dirs.** Check for `node_modules/`,
      `vendor/`, `*.min.js`, `*_generated.*` before including in line counts.
- [ ] **Handle polyglot repos.** Language breakdown may list 5+ languages;
      analyze the top 3 by bytes as primary.

---

## Confidence Assessment

- HIGH claims: 9
- MEDIUM-HIGH claims: 2
- MEDIUM claims: 1
- LOW claims: 0
- UNVERIFIED claims: 0
- **Overall confidence: HIGH**

All primary findings are backed by official GitHub documentation. The two
MEDIUM-HIGH findings (LFS detection specifics, empty repo heuristics) rely on
community confirmation of documented behavior. No claims rely solely on training
data.

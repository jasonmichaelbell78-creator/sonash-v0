# D2a: GitHub Search API Capabilities

**Searcher:** deep-research-searcher **Profile:** docs + web **Date:**
2026-03-31 **Sub-Question IDs:** SQ-D2a-1 through SQ-D2a-8 **Domain:**
technology

---

## Key Findings

1. **Seven REST search endpoints exist with distinct rate limits** [CONFIDENCE:
   HIGH]

   GitHub provides `GET /search/repositories`, `/search/code`,
   `/search/commits`, `/search/issues`, `/search/labels`, `/search/topics`, and
   `/search/users`. Authenticated requests are capped at 30 req/min for all
   endpoints except code search, which has its own stricter limit of 10 req/min
   (separated from other search limits as of April 2023). Unauthenticated
   requests: 10 req/min across all search endpoints [SOURCE: GitHub REST docs,
   GitHub Changelog 2023-03-10].

2. **Hard 1,000-result cap across REST and GraphQL** [CONFIDENCE: HIGH]

   Every search query — regardless of API surface (REST or GraphQL) — returns at
   most 1,000 results. Pagination works within this cap (max 100 per page via
   `per_page`). No exception or error signals when the cap is hit; `total_count`
   may show millions but only 1,000 are accessible. Date-range slicing
   (iterating over `created:` or `pushed:` windows) is the primary
   community-validated workaround [SOURCE: PyGithub issues #824, #1072; GitHub
   community discussion #64629; ossf/criticality_score issue #33].

3. **New code search (github.com/search) is architecturally separate from the
   legacy REST code search API** [CONFIDENCE: HIGH]

   The new code search uses a Tree-sitter-based index with regex, boolean
   operators, symbol search, and glob-based path matching. The legacy REST
   `/search/code` endpoint uses older syntax with different (more limited)
   qualifiers. The REST API still uses legacy syntax; the new code search syntax
   is available on github.com and is documented separately. The new system also
   caps results at 100 (5 pages) with no sort support [SOURCE: GitHub code
   search syntax docs; GitHub Blog "Improving GitHub code search"].

4. **GitHub Trending and Explore have NO official API** [CONFIDENCE: HIGH]

   GitHub explicitly confirmed these are UI-only views intentionally kept
   without API endpoints, citing abuse prevention, dynamic ranking logic, and
   CDN optimization. No announcement of future API plans. Only workaround is
   unofficial third-party scrapers or community-maintained APIs, which carry
   shutdown risk [SOURCE: GitHub community discussion #161519].

5. **GraphQL and REST search use the same 1,000-result cap but GraphQL offers
   richer field selection and cursor-based pagination** [CONFIDENCE: HIGH]

   Both APIs access the same underlying search index. GraphQL advantage: specify
   exactly which fields to return (avoiding over-fetching), cursor-based
   pagination via `after`/`before`, and now supports `ISSUE_ADVANCED` search
   type for complex boolean queries. GraphQL rate limits: 5,000 points/hr per
   user, 2,000 points/min ceiling. New resource limits (Sept 2025) cap execution
   resources per query; no specific threshold published [SOURCE: GitHub GraphQL
   docs; changelog 2025-09-01].

6. **API and web interface search results are provably inconsistent**
   [CONFIDENCE: HIGH]

   Documented cases show the same query returning 225 results via API vs 123,000
   via web interface. GitHub acknowledged the code search API should be treated
   as "best effort." Results can also shift between paginated requests, causing
   duplicates. `incomplete_results: true` signals a timeout (query exceeded time
   limit), not necessarily exhausted results [SOURCE: GitHub community
   discussions #134904, #56494, #48703].

7. **Topic search is a two-surface system with distinct uses** [CONFIDENCE:
   HIGH]

   `/search/topics` searches topic metadata (curated/featured topic objects).
   `topic:` qualifier within `/search/repositories` filters repos by assigned
   topics. These are orthogonal operations. Topics: lowercase, max 50 chars, max
   20 per repo. GitHub auto-suggests topics for public repos via content
   analysis. No official statistics on what percentage of repos have topics
   [SOURCE: GitHub search docs; topics classification docs].

8. **`pushed:` vs `updated:` qualifiers have different semantics** [CONFIDENCE:
   HIGH]

   `pushed:` tracks last code commit push. `updated:` tracks any repository
   object change (description edits, wiki changes, settings). For finding
   actively maintained code, `pushed:` is more reliable.
   `pushed_at <= updated_at` always [SOURCE: GitHub community discussion #24442,
   #112102].

---

## Detailed Analysis

### REST Search Endpoints

| Endpoint                   | Rate Limit (auth) | Rate Limit (unauth) | Max Results      | Sort Options                                        |
| -------------------------- | ----------------- | ------------------- | ---------------- | --------------------------------------------------- |
| `GET /search/repositories` | 30/min            | 10/min              | 1,000            | stars, forks, help-wanted-issues, updated           |
| `GET /search/code`         | 10/min            | 10/min              | 1,000 (web: 100) | best match only (sort removed April 2023)           |
| `GET /search/commits`      | 30/min            | 10/min              | 1,000            | author-date, committer-date, updated                |
| `GET /search/issues`       | 30/min            | 10/min              | 1,000            | comments, created, updated, reactions, interactions |
| `GET /search/topics`       | 30/min            | 10/min              | 1,000            | best match                                          |
| `GET /search/labels`       | 30/min            | 10/min              | 1,000            | —                                                   |
| `GET /search/users`        | 30/min            | 10/min              | 1,000            | followers, repositories, joined                     |

All endpoints share:

- `per_page` max: 100 (default 30)
- `page` parameter for pagination (within 1,000 cap)
- `incomplete_results` boolean flag
- Text match metadata via `Accept: application/vnd.github.text-match+json`

### Repository Search Qualifiers (REST `/search/repositories`)

**Scope qualifiers:**

- `in:name` — match in repo name
- `in:description` — match in description
- `in:topics` — match in topic tags
- `in:readme` — match in README content
- `user:USERNAME` — repos by user
- `org:ORGNAME` — repos in org

**Numeric qualifiers (all support `n`, `>n`, `<n`, `n..n` syntax):**

- `stars:n` — star count
- `forks:n` — fork count
- `size:n` — repo size in KB
- `followers:n` — owner follower count
- `topics:n` — number of topics applied
- `good-first-issues:>n` — count of good-first-issue labeled issues
- `help-wanted-issues:>n` — count of help-wanted issues

**Date qualifiers (ISO8601, supports `>`, `<`, ranges):**

- `created:YYYY-MM-DD` — creation date
- `pushed:YYYY-MM-DD` — last code commit date

**Technical qualifiers:**

- `language:LANGUAGE` — primary language
- `topic:TOPIC` — specific topic tag
- `license:LICENSE_KEYWORD` — license type (e.g., `apache-2.0`, `mit`)

**Status qualifiers:**

- `is:public` / `is:private`
- `archived:true` / `archived:false`
- `mirror:true` / `mirror:false`
- `template:true` / `template:false`
- `fork:true` / `fork:only`
- `is:sponsorable` — owner has GitHub Sponsors
- `has:funding-file` — contains FUNDING.yml
- `props.PROPERTY:VALUE` — custom org properties

### Legacy Code Search Qualifiers (`/search/code`)

- `in:file`, `in:path`, `in:file,path` — where to match
- `language:LANGUAGE`
- `path:DIRECTORY` or `path:/`
- `filename:FILENAME`
- `extension:EXTENSION`
- `size:n` with range operators
- `user:`, `org:`, `repo:` scope
- Files must be: <384 KB, in repos with <500,000 files, default branch only
- Archived repos: not indexed
- Forks: only indexed if more stars than parent

### New Code Search Qualifiers (github.com/search)

All legacy qualifiers plus:

- `symbol:functionName` — function/class definitions (Tree-sitter, definitions
  only, not references)
- `content:term` — restrict to file content only (exclude paths)
- `is:archived`, `is:fork`, `is:vendored`, `is:generated`
- `path:` supports glob patterns (`*.txt`, `**/*.js`, `path:/src/**/*.js`)
- Boolean operators: AND, OR, NOT, parentheses for grouping
- Regex: surround in slashes `/pattern/`, escape `/` as `\/`
- Case-sensitive regex: `(?-i)pattern`
- Unicode: `\x{hhhh}` notation
- Lookaround assertions: NOT supported

**Symbol search supported languages:** Bash, C, C#, C++, CodeQL, Elixir, Go,
JSX, Java, JavaScript, Lua, PHP, Protocol Buffers, Python, R, Ruby, Rust, Scala,
Starlark, Swift, TypeScript

**Limitation:** `repo:`, `org:`, `user:` qualifiers do not support regex or
partial matching.

### GraphQL Search

Primary query:
`search(query: String!, type: SearchType!, first: Int, after: String)`

SearchType values: `REPOSITORY`, `USER`, `ISSUE`, `ISSUE_ADVANCED`

Note: `ISSUE_ADVANCED` search type supports full boolean logic (AND/OR/NOT) and
was added March 2025; scheduled for removal 2025-11-04 per changelog (replaced
by `advanced_search` parameter pattern).

GraphQL advantages over REST for search:

- Return only requested fields (avoid over-fetching)
- Cursor-based pagination (more stable than page-based under shifting results)
- Single request can fetch repo + issue + user search simultaneously
- Richer object graphs per result

GraphQL resource limits (Sept 2025):

- 500,000 nodes max per query
- 100 concurrent requests max
- 90s CPU time per 60s real time
- 10s request timeout
- No published numeric threshold for new resource limits

### GitHub Topics as Discovery Mechanism

Two distinct programmatic uses:

1. **`/search/topics`** — Searches the topics taxonomy itself. Returns topic
   objects with name, description, curated status, repository count. Useful for
   finding what topics exist around a domain. Qualifiers: `is:featured`,
   `is:curated`, `is:not-curated`, `is:not-featured`, `repositories:n`,
   `created:DATE`.

2. **`topic:KEYWORD` in `/search/repositories`** — Filters repos that have been
   tagged with a specific topic. Multiple topic filters can be combined.

Topic rules: lowercase, hyphens allowed, max 50 chars, max 20 per repo. GitHub
auto-suggests topics for public repos (private repos receive no suggestions).

Topic coverage gap: No official statistics on what fraction of public GitHub
repos have any topics assigned. Community analysis suggests
popular/well-maintained repos have better topic coverage. Many older or
low-activity repos have zero topics, meaning topic-based discovery undersamples
that population.

### GitHub Trending / Explore — No API

Confirmed unavailable as official API. GitHub's stated reasons:

- Abuse prevention
- Dynamic ranking logic (algorithm not disclosed)
- CDN optimization

No disclosed algorithm for what drives trending. Third-party scrapers exist
(github-trending-api, huchenme/github-trending-api) but scrape HTML and carry
maintenance/shutdown risk.

---

## Practical Examples

### Discovery Scenarios

**Find active, popular Python ML repos:**

```
language:python topic:machine-learning stars:>500 pushed:>2025-01-01
```

REST:
`GET /search/repositories?q=language:python+topic:machine-learning+stars:>500+pushed:>2025-01-01&sort=stars&order=desc`

**Find recently active TypeScript repos with good community health:**

```
language:typescript stars:>100 forks:>50 good-first-issues:>5 pushed:>2025-06-01
```

**Find repos using a specific config file pattern (new code search):**

```
filename:docker-compose.yml language:YAML content:postgres path:/ org:myorg
```

**Find repos with specific architecture pattern (new code search):**

```
symbol:EventBus language:java stars:>200
```

**Find repos by topic + activity (GraphQL):**

```graphql
{
  search(
    query: "topic:microservices language:go stars:>100 pushed:>2025-01-01"
    type: REPOSITORY
    first: 100
  ) {
    repositoryCount
    pageInfo {
      endCursor
      hasNextPage
    }
    nodes {
      ... on Repository {
        nameWithOwner
        stargazerCount
        pushedAt
        description
        repositoryTopics(first: 10) {
          nodes {
            topic {
              name
            }
          }
        }
      }
    }
  }
}
```

**Bypassing 1,000-result cap via date slicing:**

```python
# For high-volume queries, iterate over date windows
date_windows = [
  ("2024-01-01", "2024-06-30"),
  ("2024-07-01", "2024-12-31"),
  ("2025-01-01", "2025-06-30"),
]
for start, end in date_windows:
    query = f"language:rust stars:>50 created:{start}..{end}"
    # each window should return <1000 results; narrow window if not
```

**Find repos using specific dependency (code search):**

```
"import tensorflow" language:python -path:"/test*" -is:fork
```

**Discover ecosystem by searching filenames:**

```
filename:Pipfile.lock path:/ stars:>100 language:python
```

---

## Gaps Identified

1. **No official statistics on topic adoption rate.** It is unknown what
   fraction of all public GitHub repositories have topics assigned. This matters
   for evaluating topic-based discovery completeness.

2. **Index freshness / lag timing not documented.** GitHub does not publish SLAs
   for how quickly newly pushed content appears in code search results.
   Community reports indicate lag exists; exact window unknown.

3. **New code search regex via REST API.** It is unclear whether the new code
   search's regex capabilities are accessible programmatically via REST API, or
   only through the web interface. The `/search/code` endpoint documentation
   only describes legacy syntax.

4. **GraphQL numeric resource limit thresholds.** GitHub introduced resource
   limits in September 2025 but did not publish numeric thresholds, making it
   impossible to design queries that reliably avoid hitting them.

5. **Trending algorithm signals.** GitHub has not disclosed what signals drive
   trending (star velocity, clone activity, fork rate, time window). Cannot
   replicate programmatically.

6. **`ISSUE_ADVANCED` removal timeline.** The changelog noted `ISSUE_ADVANCED`
   search type was scheduled for removal November 2025. Current status (whether
   it was actually removed or superseded) could not be confirmed.

7. **Non-English content quality.** No authoritative data found on whether
   GitHub's search index handles non-ASCII/non-English repository names,
   descriptions, and README content with equivalent quality.

---

## Contradictions

**Web vs API result counts:** Multiple community reports document dramatic
discrepancies between the web interface and API for the same query (e.g., 225
API results vs 123,000 web results). GitHub acknowledged the code search API is
"best effort" but has not documented a root cause or resolution. This is
unresolved and ongoing.

**`total_count` reliability:** The `total_count` field in search responses is
documented as the estimated total, but community experience shows it is
sometimes capped at 1,000 even when more results exist, and in other cases shows
millions that are practically inaccessible. Treat it as unreliable for planning
result volume.

---

## Sources

| #   | URL                                                                                                                                                         | Title                                            | Type                 | Trust  | CRAAP     | Date       |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | -------------------- | ------ | --------- | ---------- |
| 1   | https://docs.github.com/en/rest/search/search                                                                                                               | REST API endpoints for search                    | official-docs        | HIGH   | 5/5/5/5/5 | 2026       |
| 2   | https://docs.github.com/en/search-github/github-code-search/understanding-github-code-search-syntax                                                         | GitHub Code Search Syntax                        | official-docs        | HIGH   | 5/5/5/5/5 | 2026       |
| 3   | https://docs.github.com/en/search-github/searching-on-github/searching-for-repositories                                                                     | Repository Search Qualifiers                     | official-docs        | HIGH   | 5/5/5/5/5 | 2026       |
| 4   | https://docs.github.com/en/search-github/searching-on-github/searching-code                                                                                 | Legacy Code Search (Searching Code)              | official-docs        | HIGH   | 5/5/5/5/5 | 2026       |
| 5   | https://github.blog/changelog/2023-03-10-changes-to-the-code-search-api/                                                                                    | Changes to the Code Search API                   | official-changelog   | HIGH   | 5/5/5/5/5 | 2023-03-10 |
| 6   | https://docs.github.com/en/graphql/overview/resource-limitations                                                                                            | GraphQL API Resource Limitations                 | official-docs        | HIGH   | 5/5/5/5/5 | 2026       |
| 7   | https://github.blog/changelog/2025-09-01-graphql-api-resource-limits/                                                                                       | GraphQL API Resource Limits Changelog            | official-changelog   | HIGH   | 5/5/5/5/5 | 2025-09-01 |
| 8   | https://github.blog/changelog/2025-03-06-github-issues-projects-api-support-for-issues-advanced-search-and-more/                                            | Issues Advanced Search API Support               | official-changelog   | HIGH   | 5/5/5/5/5 | 2025-03-06 |
| 9   | https://github.com/orgs/community/discussions/161519                                                                                                        | REST API Endpoints for /explore and /trending    | community-discussion | MEDIUM | 3/4/3/4/5 | 2024       |
| 10  | https://github.com/ossf/criticality_score/issues/33                                                                                                         | Workaround for 1000 result limit                 | community-issue      | MEDIUM | 3/4/4/4/5 | 2023       |
| 11  | https://github.com/orgs/community/discussions/134904                                                                                                        | Discrepancies Between API and Web Interface      | community-discussion | MEDIUM | 3/5/3/3/5 | 2024       |
| 12  | https://til.simonwillison.net/github/graphql-search-topics                                                                                                  | Searching repos by topic via GraphQL             | community-blog       | MEDIUM | 4/5/4/4/5 | 2023       |
| 13  | https://arkadiuszchmura.com/posts/making-the-most-of-github-code-search/                                                                                    | Making the Most of GitHub Code Search            | community-blog       | MEDIUM | 4/5/3/4/5 | 2024       |
| 14  | https://github.blog/engineering/architecture-optimization/improving-github-code-search/                                                                     | Improving GitHub Code Search (architecture)      | official-blog        | HIGH   | 5/4/5/4/5 | 2023       |
| 15  | https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/classifying-your-repository-with-topics | Classifying Repos with Topics                    | official-docs        | HIGH   | 5/5/5/5/5 | 2026       |
| 16  | https://github.com/orgs/community/discussions/24442                                                                                                         | Difference between updated_at and pushed_at      | community-discussion | MEDIUM | 3/5/3/4/5 | 2023       |
| 17  | https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api                                                                             | Rate Limits for the REST API                     | official-docs        | HIGH   | 5/5/5/5/5 | 2026       |
| 18  | https://github.blog/changelog/2025-05-08-updated-rate-limits-for-unauthenticated-requests/                                                                  | Updated Rate Limits for Unauthenticated Requests | official-changelog   | HIGH   | 5/5/5/5/5 | 2025-05-08 |
| 19  | https://docs.github.com/en/search-github/searching-on-github/searching-topics                                                                               | Searching Topics                                 | official-docs        | HIGH   | 5/5/5/5/5 | 2026       |

---

## Confidence Assessment

- HIGH claims: 8
- MEDIUM claims: 0
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

All key findings are grounded in official GitHub documentation (Tier 1) or
corroborated by multiple community sources. The main uncertainty areas (topic
adoption rates, index freshness SLAs, new code search regex API availability)
are documented as gaps rather than asserted as facts.

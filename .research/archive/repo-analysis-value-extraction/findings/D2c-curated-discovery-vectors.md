# D2c: Curated Discovery Vectors

**Searcher:** deep-research-searcher **Profile:** web **Date:** 2026-03-31
**Sub-Question IDs:** SQ-D2c-1 through SQ-D2c-8 **Topic:** How developers find
repos worth studying beyond direct search

---

## Key Findings

1. **Awesome-lists ecosystem has ~9,924 repos on GitHub and is fully
   API-accessible via ecosyste.ms** [CONFIDENCE: HIGH]

   The GitHub `awesome` topic tag contains 9,924 public repositories [SOURCE-1].
   The master list `sindresorhus/awesome` (450K+ stars) organizes these into a
   hierarchy. The `ecosyste.ms/awesome` service provides a REST API (OpenAPI
   spec, 5,000 req/hour, CC BY-SA 4.0) with endpoints for `/lists`,
   `/lists/{id}/projects`, `/topics`, and `/projects/lookup`. Pagination is
   supported (`page`, `per_page`). Quality is enforced by `awesome-lint` with
   ~33 checks. The most scalable approach: use the ecosyste.ms API to enumerate
   all lists, then fetch projects per list. For human search,
   `trackawesomelist.com` tracks 500+ lists with RSS/newsletter. [SOURCE-2,
   SOURCE-3, SOURCE-4]

2. **GitHub Trending has no official API; algorithm is deliberate velocity-based
   relative scoring, not absolute stars** [CONFIDENCE: HIGH]

   GitHub has never published an official Trending API [SOURCE-5]. The algorithm
   is intentionally undisclosed but community analysis confirms it uses relative
   star-velocity (a repo gaining 10 stars/day against a baseline of 2 is ranked
   higher than one gaining 60 against a baseline of 50), plus engagement
   signals: forks, issues, PRs, comments [SOURCE-6]. Language-specific
   normalization and time-windowed weighting are likely factors. Third-party
   scrapers (`huchenme/github-trending-api` at 818 stars, `GiTrends`) fill the
   gap by parsing the HTML trending page into JSON endpoints:
   `GET /repositories?language=go&since=weekly` [SOURCE-7]. These scrapers are
   fragile (HTML structure changes break them) but functional. GitHub
   Collections are maintained as community-curated static files in the
   `github/explore` repo (CC-BY-4.0) with no API — web browsing only [SOURCE-8].

3. **Hacker News has two complementary APIs: official Firebase API (no search,
   no rate limit) + Algolia search API (10,000 req/hour, powerful query
   syntax)** [CONFIDENCE: HIGH]

   The official HN Firebase API (`hacker-news.firebaseio.com/v0/`) provides
   `/showstories.json` (up to 200 latest Show HN IDs), `/topstories.json`, and
   per-item fetch at `/item/{id}.json`. It has no search, no filters, and no
   rate limit [SOURCE-9]. The Algolia HN API (`hn.algolia.com/api/v1`) provides
   full-text search with two endpoints: `/search` (relevance-sorted) and
   `/search_by_date` (recency-sorted). Key parameters: `query=`, `tags=show_hn`,
   `numericFilters=points>100`, `hitsPerPage` up to 1,000. Rate limit: 10,000
   requests/hour, no auth required. To find GitHub repo posts:
   `GET https://hn.algolia.com/api/v1/search_by_date?query=github.com&tags=show_hn&numericFilters=points%3E50`
   [SOURCE-10, SOURCE-11]. Research confirms the average Show HN repo gains 121
   stars in 24 hours, 289 after a week [SOURCE-12]. Note: the algolia/hn-search
   GitHub project was archived in 2025, but the API itself remains operational
   [SOURCE-13].

4. **Reddit API access became paid/gated in 2023-2024; free tier is extremely
   limited; PRAW still usable for personal/research with approval** [CONFIDENCE:
   HIGH]

   As of July 2023, Reddit API access is paid ($0.24/1K calls above free tier).
   The free tier allows 100 queries/minute for OAuth apps, 10 for
   unauthenticated. As of late 2024, self-service access was removed —
   developers must submit a request and wait for approval (days for personal
   use, weeks for commercial) [SOURCE-14]. PRAW remains the standard Python
   library. Best subreddits for high-signal repo discovery: r/programming,
   r/rust, r/golang, r/python (general), and specialist communities:
   r/ProgrammingLanguages, r/DatabaseDevelopment, r/ReverseEngineering,
   r/Compilers, r/EmuDev [SOURCE-15]. For budget-conscious approaches, Reddit's
   `.json` endpoint (e.g., `reddit.com/r/rust/top.json?t=month&limit=100`) works
   without API key but violates ToS for scraping at scale.

5. **Dev.to (Forem) has a documented REST API for article and tag search;
   Medium's official API is dead (archived 2023), unofficial API exists**
   [CONFIDENCE: HIGH]

   Dev.to uses the Forem API (v0/v1). Key endpoint:
   `GET https://dev.to/api/articles?tag=github&per_page=30`. Articles paginate
   at 30/page, tags are filterable, no auth required for read. Full
   documentation at `developers.forem.com/api/v1` [SOURCE-16]. Medium's official
   API was archived March 2, 2023 [SOURCE-17]. An unofficial Medium API at
   `mediumapi.com` allows fetching article text and markdown programmatically —
   suitable for extracting GitHub URLs from content — though use for bulk
   extraction raises ToS concerns. YouTube Data API v3 (Google) allows fetching
   video descriptions via `GET /videos?part=snippet&id={videoId}` — GitHub links
   are commonly placed in descriptions of tutorial channels [SOURCE-18].

6. **Stack Overflow BigQuery dataset (quarterly update) and SEDE (weekly update)
   enable SQL queries against all answer bodies for GitHub links** [CONFIDENCE:
   HIGH]

   The Stack Overflow dataset in BigQuery (`bigquery-public-data.stackoverflow`)
   is updated quarterly and contains the full `posts_answers` table with `Body`
   (HTML), `Score`, and relationships to questions. SEDE
   (`data.stackexchange.com`) is updated weekly and allows free SQL queries on
   the live data. A practical query pattern:
   `SELECT TOP 100 Body, Score, ParentId FROM Posts WHERE PostTypeId=2 AND Score>50 AND Body LIKE '%github.com%' ORDER BY Score DESC`.
   Rate limit: 10,000 requests/day without an API key for the Stack Exchange
   REST API (v2.3). SEDE has no rate limit for interactive queries [SOURCE-19,
   SOURCE-20]. BigQuery gets 1 TB free/month of query data scanned.

7. **Social signals: X/Twitter is effectively closed (min $100/month for
   meaningful search); Bluesky firehose is open and filterable; Mastodon API is
   open per-instance** [CONFIDENCE: HIGH]

   X/Twitter API: Free tier exists but is limited to 500 posts/month write and 1
   request/24h on most read endpoints — unusable for discovery. Basic tier costs
   $100/month. Pro is $5,000/month. Search access requires Basic tier minimum
   [SOURCE-21]. Community scrapers (twscrape) exist but carry ToS risk. Bluesky:
   The AT Protocol firehose is fully open via WebSocket
   (`wss://relay1.us-east.bsky.network/xrpc/com.atproto.sync.subscribeRepos`).
   JetStream provides a lighter filtered stream. No auth required for read.
   Filtering for posts containing `github.com` requires client-side filtering of
   post payloads after receipt. Tech starter packs on Bluesky number 771+ for
   developer-themed accounts [SOURCE-22, SOURCE-23]. Mastodon: Each instance
   (fosstodon.org for FOSS, infosec.exchange for security) has its own REST API
   with search at `/api/v1/search?q=github.com&type=statuses`. Rate limits vary
   per instance.

8. **Newsletter archives: JavaScript Weekly has browsable HTML archives (700+
   issues); TLDR has searchable archives; Changelog has open-source RSS; no
   universal machine-readable API exists** [CONFIDENCE: MEDIUM]

   JavaScript Weekly archives are browsable at `javascriptweekly.com/issues`
   (issues pre-2014 in XML format on request) [SOURCE-24]. TLDR Newsletter
   (`tldr.tech/tech/archives`) maintains a searchable archive. Changelog News is
   open source (thechangelog/changelog.com on GitHub) and has a podcast RSS
   feed; repos are frequently featured. No newsletter has a public API for
   programmatic archive access. The practical approach is HTTP scraping of HTML
   archive pages or subscribing to RSS feeds and parsing links. The
   `awesome-newsletters` repo on GitHub (zudochkin) lists 100+ developer
   newsletters [SOURCE-25].

---

## Detailed Analysis

### Vector 1: Awesome-Lists Ecosystem

**Scale:** ~9,924 repos tagged `awesome` on GitHub. The main
`sindresorhus/awesome` index covers hundreds of canonical lists organized into:
Platforms, Programming Languages, Front-End, Back-End, Computer Science, Big
Data, Theory, Books, Editors, Gaming, Dev Environment, Entertainment, Databases,
Media, Learn, Security, Content Management, and more.

**Quality assurance:** The `awesome-lint` tool enforces ~33 checks including:
required Awesome badge, proper unordered list marker style, no trailing slashes
on URLs, valid list item descriptions. Lists must comply with the Awesome
Manifesto before PR acceptance. This creates a meaningful quality floor relative
to arbitrary curated lists.

**Programmatic access:**

- **ecosyste.ms/awesome API**: Preferred route. Endpoints: `GET /api/v1/lists`
  (paginated), `GET /api/v1/lists/{id}/projects`,
  `GET /api/v1/projects/lookup?url={github_url}`. Rate: 5,000 req/hr. License:
  CC BY-SA 4.0. Data includes star count, fork count, project count per list,
  and last-updated timestamps.
- **Raw GitHub API**: Fetch `README.md` of any awesome list directly via
  `api.github.com/repos/{owner}/{repo}/contents/README.md`, parse markdown
  links. Standard GitHub API rate limits apply (5,000 req/hr authenticated).
- **trackawesomelist.com**: Tracks 500+ lists, provides RSS and newsletter. Best
  for monitoring new additions without polling.
- **awesomelists.top** (redirects to calvinjeng.io): Cross-list search tool,
  though appears poorly maintained.
- **project-awesome.org**: Web aggregator of awesome lists, browseable only.

**Best approach for bulk consumption:** ecosyste.ms API to enumerate lists →
fetch `/lists/{id}/projects` per list → cross-reference with
`ecosyste.ms/packages` for download/dependency data.

---

### Vector 2: GitHub Explore and Trending

**How Trending works:** Relative velocity scoring within time windows
(daily/weekly/monthly). Not absolute stars. Language-specific normalization
prevents small-community languages from being suppressed. GitHub does not
publish the formula [SOURCE-6].

**GitHub Explore Collections:** ~20+ named collections curated by GitHub and
community (e.g., "Game Engines," "Machine Learning," "Made in Africa").
Maintained as static files in the `github/explore` open repo. No REST API —
collections are only browseable at `github.com/collections/{slug}`.

**Programmatic access workarounds:**

- Third-party scrapers:
  `ghapi.huchen.dev/repositories?language=python&since=weekly` (scrapes HTML,
  parses to JSON). Available parameters: `language`, `since`
  (daily/weekly/monthly), `spoken_language_code`.
- `trendshift.io`: Scoring algorithm based on daily engagement metrics. No
  public API mentioned.
- `github.com/EvanLi/Github-Ranking`: Auto-updated daily top-100 lists by
  language. Machine-readable JSON in the repo.
- **GH Archive + BigQuery**: The most powerful approach for custom trending —
  query `WatchEvent` (stars) events by time window to compute custom trending. 1
  TB/month free.

---

### Vector 3: Hacker News Discovery

**Two-API architecture:**

| API      | Base URL                         | Auth | Rate Limit | Search |
| -------- | -------------------------------- | ---- | ---------- | ------ |
| Firebase | `hacker-news.firebaseio.com/v0/` | None | None       | No     |
| Algolia  | `hn.algolia.com/api/v1/`         | None | 10K req/hr | Yes    |

**Algolia query patterns for repo discovery:**

```
# Show HN posts with GitHub links, min 50 points
GET /search_by_date?query=github.com&tags=show_hn&numericFilters=points>50

# All stories mentioning a specific library
GET /search?query=langchain&tags=story&numericFilters=points>100&hitsPerPage=1000

# Comments containing GitHub links in high-score stories
GET /search?query=github.com&tags=comment&numericFilters=points>10
```

**Quality signals:** Show HN with >100 points is a strong quality gate. Research
shows 19% of AI developers promoted GitHub projects on HN. Comment mentions in
high-engagement threads are a secondary signal.

**Bonus:** `minimaxir/show-hn` GitHub repo contains historical Show HN data
since 2014 for offline analysis.

---

### Vector 4: Reddit Discovery

**Best subreddits by discovery value:**

| Subreddit              | Focus                | Quality Signal                  |
| ---------------------- | -------------------- | ------------------------------- |
| r/programming          | General              | Top posts = mainstream adoption |
| r/rust                 | Rust ecosystem       | Very engaged, technical depth   |
| r/golang               | Go ecosystem         | Active, release-focused         |
| r/python               | Python ecosystem     | High volume, quality varies     |
| r/webdev               | Frontend/web         | High volume                     |
| r/ProgrammingLanguages | PL theory            | Low volume, very high quality   |
| r/DatabaseDevelopment  | DB internals         | Low volume, specialist          |
| r/ReverseEngineering   | RE/security          | Highly curated                  |
| r/Compilers            | Compiler engineering | Low noise                       |

**API access (2025 reality):** Must submit application + wait for approval. 60
req/min authenticated, 10 req/min unauthenticated once approved. PRAW is the
standard Python wrapper. The `.json` endpoint trick
(`reddit.com/r/rust/top.json?t=month`) still works for low-volume personal use.
Commercial use is expensive.

**Discovery approach:** For budget-constrained usage, use the free tier to poll
top posts from 5-10 subreddits weekly, filter for posts containing `github.com`
in the body or linked URL, sorted by score.

---

### Vector 5: Dev.to, Medium, YouTube

**Dev.to (Forem) API:**

- Base: `https://dev.to/api/`
- Articles by tag: `GET /articles?tag=golang&per_page=30&page=1`
- Articles by tag, sorted: `?tag=rust&top=7` returns top articles from last 7
  days
- No authentication needed for reads
- To mine GitHub refs: fetch article bodies (HTML), parse with regex for
  `github.com/[a-zA-Z0-9_-]+/[a-zA-Z0-9_-]+`

**Medium:**

- Official API: archived, dead as of 2023
- Unofficial `mediumapi.com`: allows fetching article content including markdown
- RSS feeds per tag (`medium.com/feed/tag/{tag}`) contain post metadata with
  links

**YouTube Data API v3:**

- Quota-based (10,000 units/day free)
- `GET /videos?part=snippet&id={videoId}` returns description containing GitHub
  links
- `GET /search?part=snippet&q=tutorial+github&type=video` to find relevant
  videos
- Channels like Fireship, Theo, Traversy Media consistently put GitHub repos in
  descriptions

---

### Vector 6: Stack Overflow

**Two access paths:**

1. **Stack Exchange REST API v2.3** (`api.stackexchange.com`): 10,000 req/day
   without key, 30,000 with. Filter answers by `min`, `sort=votes`, search with
   `intitle` parameter. Does not allow body text search directly. Body content
   requires SEDE or BigQuery.

2. **SEDE** (`data.stackexchange.com`): Weekly snapshot, free SQL. Key schema:
   `Posts` table with `PostTypeId` (1=question, 2=answer), `Score`, `Body`
   (HTML), `Tags`. Example query pattern:

   ```sql
   SELECT TOP 200
     'https://stackoverflow.com/a/' + CAST(p.Id AS VARCHAR) as URL,
     p.Score,
     p.Body
   FROM Posts p
   WHERE p.PostTypeId = 2
     AND p.Score > 50
     AND p.Body LIKE '%github.com%'
   ORDER BY p.Score DESC
   ```

3. **BigQuery** (`bigquery-public-data.stackoverflow`): Quarterly updates, more
   historical data than SEDE. Same schema. 1 TB/month free. Faster for complex
   analytical queries across all 50M+ answers.

**Quality signal:** Score > 50 is a reasonable threshold. Accepted answers
(IsAcceptedAnswer = 1) with GitHub links are especially high-signal.

---

### Vector 7: Social Signals

**Platform comparison (2026):**

| Platform  | Access Cost         | Search Quality | Tech Density | Programmability    |
| --------- | ------------------- | -------------- | ------------ | ------------------ |
| X/Twitter | $100+/mo            | High           | High         | Paid API           |
| Bluesky   | Free                | Medium         | Growing      | Open AT Protocol   |
| Mastodon  | Free (per-instance) | Low-medium     | Medium       | Open REST API      |
| LinkedIn  | Gated API           | Low            | Medium-high  | Effectively closed |

**Bluesky practical approach:**

- JetStream filtered stream:
  `wss://jetstream2.us-east.bsky.network/subscribe?wantedCollections=app.bsky.feed.post`
- Filter received CBOR payloads for `text` containing `github.com`
- No rate limits documented for WebSocket stream
- Tech communities: starter packs exist for 771+ developer-focused accounts;
  follow lists amplify signal

**Mastodon practical approach:**

- Per-instance search:
  `GET https://fosstodon.org/api/v1/search?q=github.com&type=statuses&limit=40`
- Results federated only to that instance's knowledge
- fosstodon.org (FOSS), infosec.exchange (security), hachyderm.io (tech
  generalist) are highest-value instances for repo discovery

---

### Vector 8: Newsletters and Aggregators

**Searchable archives:**

| Newsletter        | Archive URL                 | Searchable   | GitHub Link Density | Frequency |
| ----------------- | --------------------------- | ------------ | ------------------- | --------- |
| JavaScript Weekly | javascriptweekly.com/issues | Browse only  | High                | Weekly    |
| Node Weekly       | nodeweekly.com/issues       | Browse only  | High                | Weekly    |
| TLDR              | tldr.tech/tech/archives     | Searchable   | Medium              | Daily     |
| Changelog News    | changelog.com/news          | Browse + RSS | Very High           | Weekly    |
| Go Weekly         | golangweekly.com/issues     | Browse only  | High                | Weekly    |
| Rust Weekly       | this-week-in-rust.org       | Browse + RSS | Very High           | Weekly    |

**"This Week in Rust" (TWIR)** deserves special mention: it is community-curated
and explicitly lists new Rust projects each week with GitHub links. Archive
fully browseable and consistent format.

**Changelog.com:** Open-source CMS (Elixir/Phoenix) on GitHub. Has RSS feed.
Frequently features specific repos — content structured enough to parse for
GitHub links.

**Meta-aggregators with programmatic potential:**

- `best-of-lists/best-of` framework: 25 published lists ranked by quality score.
  No API but structured YAML per repo.
- GH Archive + Changelog Nightly: built on GH Archive data, generates daily
  curated reports.

**Approach for newsletter mining:** RSS parsing is the highest-ROI method. Most
newsletters publish RSS. Parse `<link>` and `<description>` fields for
`github.com/[owner]/[repo]` patterns.

---

## Practical Workflow

### Tier 1: Highest Signal-to-Noise, Most Programmatic

1. **ecosyste.ms Awesome API** — enumerate all lists, pull projects per list,
   filter by recently-updated + high star counts. API-first, well-maintained, 5K
   req/hr.

2. **Algolia HN API** — weekly query:
   `search_by_date?query=github.com&tags=show_hn&numericFilters=points>50&hitsPerPage=500`.
   Cross with past 30 days. No auth, 10K req/hr.

3. **GitHub Trending scraper** — `ghapi.huchen.dev/repositories?since=weekly`
   for daily top across languages. Cache results; the API has no uptime
   guarantee.

### Tier 2: High Value, Moderate Access Complexity

4. **SEDE SQL** — quarterly manual query for high-score SO answers with GitHub
   links. Export to CSV for analysis. One-time query, weekly-updated data.

5. **Dev.to API** — `GET /articles?tag={topic}&top=30` for each of 10-15
   relevant tags weekly. No auth, paginate.

6. **Bluesky JetStream** — stream filter for `github.com` mentions. Requires
   WebSocket client but free and growing tech community.

7. **Reddit** (personal use tier) — poll top 5 subreddits weekly via `.json`
   endpoint. Filter posts with `github.com` in body.

### Tier 3: Browse/Manual with High Curation Value

8. **Newsletter RSS** — subscribe: This Week in Rust, Golang Weekly, JavaScript
   Weekly, Changelog News. Parse RSS items for GitHub links.

9. **Fosstodon search** — search API for recent `github.com` posts in FOSS
   community.

10. **GitHub Collections** — manually browse `github.com/collections` monthly
    for curated theme discoveries.

### Compound Strategy

Cross-reference repos appearing in multiple vectors (awesome list + HN Show HN +
TLDR mention) within a rolling 90-day window. Intersection = exceptionally
high-quality discovery candidate. The `ecosyste.ms` API makes this feasible
since it also cross-references package manager download data, letting you
validate community adoption beyond stars.

---

## Gaps Identified

1. **Algolia HN API archival status**: The `algolia/hn-search` GitHub project
   was archived in 2025 [SOURCE-13]. The API at `hn.algolia.com/api/v1` appears
   still operational but future availability is uncertain. No official statement
   from Algolia on continuity.

2. **ecosyste.ms total list count**: The `/lists` API paginates at 100/page. The
   actual total count was not definitively confirmed in research — it is at
   minimum in the hundreds (likely 1,000-3,000 curated awesome-style lists),
   distinct from the 9,924 raw GitHub repos tagged `awesome`.

3. **GitHub Collections API**: No programmatic access confirmed. Collections
   data is available via the `github/explore` repo but is not surfaced through
   any known REST or GraphQL endpoint.

4. **X/Twitter**: Effectively inaccessible for repo discovery without
   $100+/month spend. Community scrapers (twscrape) exist but TOS risk is
   significant.

5. **Newsletter cross-search**: No aggregated API covers multiple newsletters
   simultaneously. Each requires independent RSS parsing or HTML scraping.

6. **Mastodon federation gap**: Searching a single Mastodon instance only
   returns posts that instance has federated. Cross-instance search is
   fragmented; no unified Mastodon search API exists.

7. **Stack Exchange API body-text search**: The v2.3 API does not support
   body-text search for answers. SEDE/BigQuery are the only bulk-viable paths —
   both require separate tooling from the main API.

---

## Serendipitous Discoveries

- **GitNews (`git.news`)** — aggregates GitHub Trending + HN + Reddit into a
  single feed, mobile app available. A consumer-grade version of the combined
  vector approach described in the Practical Workflow.

- **GH Archive + BigQuery star-velocity queries** — the most powerful custom
  trending approach: compute your own trending by querying `WatchEvent` counts
  in sliding windows. 1 TB/month free. This can outperform GitHub's own Trending
  for narrow topical focus.

- **"This Week in Rust" (twir.rs)** — explicitly structured newsletter with a
  "Projects" section listing new Rust repos each week. The most
  machine-parseable newsletter for a specific ecosystem. Similar pattern exists
  for Haskell (Haskell Weekly) and Elm (Elm Weekly).

- **DevHunt** — GitHub-authenticated Product Hunt alternative for dev tools.
  Smaller community but higher signal for developer-facing tools. No API found
  but browseable.

- **best-of framework** — provides a quality-scoring methodology (stars +
  contributors + forks + downloads + dependents) beyond raw stars. 25 published
  best-of lists serve as curated discovery vectors in their own right.

- **Fake stars research (2024)**: An arxiv paper found 6 million suspected fake
  stars on GitHub [SOURCE-26]. This is relevant context: raw star counts on
  trending are gameable; cross-referencing with download/dependency data from
  ecosyste.ms significantly reduces false positives.

---

## Sources

| #   | URL                                                                                                          | Title                                           | Type                 | Trust  | CRAAP | Date    |
| --- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- | -------------------- | ------ | ----- | ------- |
| 1   | https://github.com/topics/awesome                                                                            | GitHub Topics: awesome                          | Platform data        | HIGH   | 4.4   | 2026-03 |
| 2   | https://awesome.ecosyste.ms/                                                                                 | Ecosyste.ms: Awesome                            | Official service     | HIGH   | 4.2   | 2026-03 |
| 3   | https://github.com/ecosyste-ms/awesome                                                                       | ecosyste-ms/awesome GitHub                      | Official repo        | HIGH   | 4.3   | 2026-03 |
| 4   | https://www.trackawesomelist.com/                                                                            | Track Awesome List                              | Community tool       | MEDIUM | 3.8   | 2026-03 |
| 5   | https://github.com/huchenme/github-trending-api                                                              | github-trending-api                             | Community tool       | MEDIUM | 3.5   | 2025    |
| 6   | https://github.com/orgs/community/discussions/163970                                                         | GitHub Community: Trending Calculation          | Community discussion | MEDIUM | 3.8   | 2024    |
| 7   | https://github.com/maulikshetty/GiTrends                                                                     | GiTrends API                                    | Community tool       | MEDIUM | 3.2   | 2024    |
| 8   | https://github.com/github/explore                                                                            | github/explore                                  | Official repo        | HIGH   | 4.5   | 2026-03 |
| 9   | https://github.com/HackerNews/API                                                                            | HackerNews/API                                  | Official docs        | HIGH   | 5.0   | 2024    |
| 10  | https://hn.algolia.com/api                                                                                   | HN Search API (Algolia)                         | Official service     | HIGH   | 4.8   | 2024    |
| 11  | https://deepeshsoni.com/archives/70                                                                          | Algolia API Practical Guide                     | Community blog       | MEDIUM | 3.4   | 2024    |
| 12  | https://arxiv.org/html/2511.04453v1                                                                          | Launch-Day Diffusion: HN Impact on GitHub Stars | Academic preprint    | HIGH   | 4.3   | 2025-11 |
| 13  | https://news.ycombinator.com/item?id=47115009                                                                | Algolia HN Search Archived                      | HN discussion        | MEDIUM | 4.0   | 2025    |
| 14  | https://www.wappkit.com/blog/reddit-api-credentials-guide-2025                                               | Reddit API Guide 2025                           | Community blog       | MEDIUM | 4.0   | 2025    |
| 15  | https://notes.eatonphil.com/high-quality-subreddits-you-should-be-following.html                             | High Quality Subreddits                         | Expert blog          | MEDIUM | 3.8   | 2024    |
| 16  | https://developers.forem.com/api/v1                                                                          | Forem API V1                                    | Official docs        | HIGH   | 4.8   | 2025    |
| 17  | https://mediumapi.com/                                                                                       | Unofficial Medium API                           | Third-party service  | MEDIUM | 3.5   | 2025    |
| 18  | https://github.com/youtube/api-samples                                                                       | YouTube API Samples                             | Official             | HIGH   | 4.5   | 2025    |
| 19  | https://github.com/StackExchange/StackExchange.DataExplorer                                                  | SEDE on GitHub                                  | Official             | HIGH   | 4.5   | 2024    |
| 20  | https://hackernoon.com/catalog-of-references-to-stackoverflow-questions-found-in-github-sources-134415b97ecb | SO + GitHub BigQuery Analysis                   | Community blog       | MEDIUM | 3.6   | 2022    |
| 21  | https://zernio.com/blog/twitter-api-pricing                                                                  | X API Pricing Guide                             | Community blog       | MEDIUM | 3.8   | 2026    |
| 22  | https://docs.bsky.app/docs/advanced-guides/firehose                                                          | Bluesky Firehose Docs                           | Official docs        | HIGH   | 4.8   | 2025    |
| 23  | https://github.com/stevendborrelli/bluesky-tech-starter-packs                                                | Bluesky Tech Starter Packs                      | Community            | MEDIUM | 3.5   | 2025    |
| 24  | https://javascriptweekly.com/issues                                                                          | JavaScript Weekly Archives                      | Newsletter           | HIGH   | 4.2   | 2026-03 |
| 25  | https://github.com/zudochkin/awesome-newsletters                                                             | awesome-newsletters                             | Community            | MEDIUM | 3.8   | 2024    |
| 26  | https://arxiv.org/html/2412.13459v2                                                                          | Six Million Suspected Fake Stars                | Academic preprint    | HIGH   | 4.5   | 2024-12 |

---

## Confidence Assessment

- HIGH claims: 7
- MEDIUM claims: 1
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

Most claims are supported by official APIs, official documentation, or multiple
corroborating community sources. The MEDIUM claim (newsletter archives) reflects
that no comprehensive machine-readable API exists across newsletters — this is
an honest gap rather than a missing source.

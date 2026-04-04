# D2d: Web Search as Repo Discovery

**Searcher:** deep-research-searcher **Profile:** web **Date:** 2026-03-31
**Sub-Question IDs:** SQ-D2d-1 through SQ-D2d-8

---

## Key Findings

1. **Structured query operators dramatically outperform freeform search for repo
   discovery** [CONFIDENCE: HIGH]

   GitHub's native search supports a rich operator set that, when combined,
   reduces noise by 80%+ versus keyword-only queries. The highest-signal pattern
   combines language, stars, pushed date, and in: scope:
   `language:python stars:>500 pushed:>2025-01-01 topic:rate-limiting`.
   Combining 3+ operators simultaneously is the documented best practice from
   GitHub's own community guidance [SOURCE-1][SOURCE-2].

2. **Google Custom Search API (Programmable Search): 100 free queries/day,
   $5/1,000 above that, max 10,000/day** [CONFIDENCE: HIGH]

   The free tier is severely limited for automated workflows. The Site
   Restricted API variant was discontinued January 8, 2025. For programmatic
   discovery at scale, the standard JSON API remains the primary option but the
   10,000/day cap creates a ceiling for any high-volume pipeline
   [SOURCE-3][SOURCE-4].

3. **Bing Web Search API was fully retired August 11, 2025** [CONFIDENCE: HIGH]

   Microsoft silently disabled new API key creation in March 2025 before the
   official May 2025 announcement, with full decommissioning completed August
   11, 2025. The official migration path is "Grounding with Bing Search" inside
   Azure AI Foundry — a platform commitment, not a drop-in swap. Third-party
   alternatives (Brave, SerpAPI, Serper, Firecrawl) have emerged as replacements
   [SOURCE-5][SOURCE-6].

4. **GitHub's internal Blackbird search engine indexes ~45M repos at 120,000
   documents/second, full re-index in ~18 hours** [CONFIDENCE: HIGH]

   GitHub built a custom Rust-based search engine (Blackbird) that uses ngram
   indexing optimized for code. It indexes file content, symbols, paths,
   languages, and repo metadata. Updates are event-driven (fires on `git push`),
   ensuring near-real-time freshness. External search engines (Google, Bing)
   index public GitHub READMEs and pages but with variable lag — anywhere from 4
   days to 4+ weeks for initial indexing [SOURCE-7][SOURCE-8].

5. **Fake GitHub stars are a massive signal-pollution problem: 6 million
   suspected across 26,254 repos** [CONFIDENCE: HIGH]

   A CMU research study (published late 2024, ICSE 2026) detected 6 million
   suspected fake stars using "StarScout" — analyzing behavioral patterns like
   lockstep starring and low-activity accounts. ~30% of repos with fake star
   campaigns are active spam/malware. Fake stars peak at 16% of repositories in
   the 2024 dataset. Stars alone are now an unreliable quality signal
   [SOURCE-9][SOURCE-10].

6. **Phind outperforms Perplexity for code-specific repo discovery; Perplexity
   wins for broader research context** [CONFIDENCE: MEDIUM]

   Phind is specialized for developer queries, searching GitHub, Stack Overflow,
   and technical docs, achieving 95% vs 80% in API documentation searches in
   side-by-side comparisons. Perplexity handles broader "why use this" questions
   better and excels at surfacing early-adopter blog posts. Power users in 2026
   use a hybrid stack: Perplexity (research context) + Phind
   (code/implementation) [SOURCE-11][SOURCE-12].

7. **Brave Search API is the most direct Bing replacement with independent index
   and SOC 2 Type II certification** [CONFIDENCE: MEDIUM]

   Brave maintains an independent 40-billion-page index (not Bing-sourced),
   earned SOC 2 Type II in 2025, and provides specialized code context
   extraction for technical queries. Pricing: free tier available, paid plans
   scale per query. Brave supplies real-time web data to most top-10 LLMs as
   of 2025. For technical repo queries, Exa (semantic search, $1.50/1k queries)
   and Serper ($0.30-$1.00/1k, Google-backed) are lower-cost alternatives
   [SOURCE-13][SOURCE-14].

8. **GitHub Topics GraphQL API enables programmatic topic-based discovery — a
   high-signal approach** [CONFIDENCE: HIGH]

   Using `topic:X sort:updated-desc` via GraphQL returns up to 100 repos per
   query with full metadata (name, description, updatedAt, diskUsage). This
   bypasses external search entirely for domain-specific discovery and returns
   structurally rich data. Example query documented by Simon Willison
   [SOURCE-15]. Topics are community-tagged and max 20 per repo, limiting noise.

9. **YouTube Data API v3 can extract video descriptions for repo URL mining —
   regex completion required** [CONFIDENCE: MEDIUM]

   The YouTube Data API v3 (`videos.list` with `part=snippet,statistics`)
   returns full video descriptions as structured JSON. GitHub URLs can be
   extracted via regex (`https://github\.com/[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+`).
   Developer tutorials routinely link source repos in descriptions. The API
   provides 10,000 units/day free; a video description fetch costs 1 unit
   [SOURCE-16]. No off-the-shelf "extract repo URLs from YouTube" pipeline
   exists — assembly required.

10. **LibHunt aggregates Reddit/HN/dev.to mentions in near-real-time, forming a
    "solution space" discovery layer** [CONFIDENCE: MEDIUM]

    LibHunt monitors Reddit, Hacker News, and dev.to for library/tool mentions
    and presents alternatives organized by category. This is effectively
    automated "how do people solve X" mining. StackShare and AlternativeTo offer
    crowdsourced comparison layers. These platforms surface repos that
    communities actually discuss, filtering for genuine usage over SEO
    optimization [SOURCE-17][SOURCE-18].

---

## Detailed Analysis

### Approach 1: Web Search with `site:github.com` Operators

The most direct web-search-to-repo path uses Google or Brave with
`site:github.com` combined with domain keywords. This surfaces repos that have
been external-link-indexed (indicating community traction). Quality signal: if a
repo appears in Google results for a specific technical query, it has likely
been discussed/linked outside GitHub itself — a mild quality indicator.

**Weakness:** Google's index of github.com content lags 4-28 days behind actual
commits. READMEs are indexed; individual files and issues are indexed but may
not appear in general search results. GitHub wikis are specifically crawlable
(per GitHub community policy), but discussion content is inconsistently indexed.

### Approach 2: GitHub Native Search

GitHub's Blackbird engine is the freshest source (near-real-time post-push).
Advanced operators allow filtering by language, star count, fork count, push
date, license, and README/description content simultaneously. The `in:readme`
qualifier is powerful for finding implementation-specific terminology that only
appears in documentation, not code file names.

**Critical weakness:** Star count gaming (6M fake stars) means `stars:>X`
filtering is corrupted at the margin. Pairs better with `pushed:>2025-XX-XX`
(recency) and fork count cross-check.

### Approach 3: AI-Powered Search Engines

**Phind** is optimized for developer queries. It explicitly crawls GitHub, Stack
Overflow, and docs sites. For "find me a repo that does X" queries, it returns
curated candidates with code context rather than bare URLs. Best for: specific
implementation lookup ("Python async job queue with Redis backend").

**Perplexity Pro** decomposes complex queries and synthesizes from multiple
sources with citations. Better for: "what are all the approaches to solving X
and which repos implement each?" — the solution-space mapping use case.

**Exa.ai** uses neural/semantic search trained on web content. Its dedicated
code search returns token-budgeted excerpts (500-5,000 characters configurable).
Searches 1B+ pages. At 81% vs 71% complex retrieval vs Tavily, it outperforms on
nuanced queries. Up to 100 results per query (vs Tavily's 20). Best for:
semantic similarity — finding repos conceptually similar to a described problem
rather than exact keyword matches.

### Approach 4: Programmatic APIs for Discovery Pipelines

Current viable API stack (post-Bing-retirement):

| API          | Index        | Cost/1k queries      | Rate limit         | Best for                             |
| ------------ | ------------ | -------------------- | ------------------ | ------------------------------------ |
| Google PSE   | Google       | $5                   | 10k/day            | Broad web index, highest coverage    |
| Brave Search | Independent  | ~$1-3                | No hard cap stated | Anti-SEO-spam, independent results   |
| Serper.dev   | Google SERP  | $0.30-1.00           | High               | Fast, cheap Google results           |
| SerpAPI      | Multi-engine | $15+ (75/5k)         | Per plan           | Multi-engine, enterprise             |
| Exa.ai       | Semantic     | $1.50                | Per plan           | Semantic queries, code search        |
| Tavily       | Web          | ~$1-2                | Per plan           | Agentic workflows, structured output |
| Firecrawl    | Web+Scrape   | 2cr/10 results       | Per plan           | Search+extract pipeline              |
| GitHub API   | GitHub       | Free (rate limited)  | 5k req/hr auth     | On-platform discovery                |
| YouTube Data | YouTube      | Free (10k units/day) | 10k units/day      | Video description mining             |

### Approach 5: Community Signal Aggregation

The highest-trust discovery path uses human curation as a quality filter:

1. **Awesome Lists** (github.com/sindresorhus/awesome) — Expert-curated,
   domain-organized. Searchable via GitHub topics:
   `topic:awesome-list topic:[domain]`.
2. **LibHunt** — Automated aggregation of Reddit/HN/dev.to mentions; free to
   query; reflects actual developer discussion.
3. **AlternativeTo** — Crowdsourced alternatives; community-voted quality
   signals.
4. **Hacker News "Show HN"** — High-signal community launches; searchable via
   `site:news.ycombinator.com "Show HN"`.
5. **StackShare** — Tech stack declarations; shows which companies use which
   repos.

### Approach 6: YouTube/Blog URL Mining

The YouTube Data API v3 can fetch video descriptions at scale (10,000 units/day
free). A pipeline:

1. Search YouTube for programming tutorials:
   `GET /search?q=[topic]+tutorial&type=video`
2. Batch-fetch descriptions: `GET /videos?part=snippet&id=[comma-separated-ids]`
3. Regex-extract GitHub URLs from description text
4. Deduplicate and rank by frequency of mentions across videos

Blog mining requires a different approach: use a search API with
`site:[dev.to OR medium.com OR blog.*] [topic] github.com` to find posts, then
crawl with Firecrawl or BeautifulSoup to extract linked GitHub URLs.

### Approach 7: Solution Space Mapping

Instead of "find repo that does X," query "how do developers solve X" across
discussion platforms:

1. Search Stack Overflow: `site:stackoverflow.com [problem] [language]` —
   extracts recommended library names from answers
2. Search Reddit: `site:reddit.com/r/programming OR /r/[language] [problem]` —
   finds community preferences
3. Search Hacker News: `site:news.ycombinator.com [topic] "open source"` —
   discovers discussed projects
4. Cross-reference extracted names against GitHub search

LibHunt automates steps 1-3 for known library names. For unknown solution
spaces, manual query reformulation is currently required — no automated pipeline
exists for "discover all repos solving X from community discussion."

---

## Effective Query Templates

### GitHub Native Search (copy-paste patterns)

```
# Find actively maintained implementations in a language
language:python topic:[topic-slug] stars:>100 pushed:>2025-01-01

# Find reference implementations with good docs
language:go in:readme "getting started" stars:>200 pushed:>2025-06-01

# Find repos with recent activity and tests
language:typescript topic:[topic] pushed:>2025-01-01 fork:true

# Find lightweight/minimal implementations
in:description "minimal" OR "lightweight" language:rust topic:[topic] stars:>50

# Find repos with active communities
language:python topic:[topic] stars:>500 forks:>100 pushed:>2025-01-01

# Find educational/example repos
in:name "example" OR "demo" OR "starter" language:javascript topic:[topic]

# Filter by license
language:python topic:[topic] license:mit stars:>200 pushed:>2025-01-01
```

### Web Search Patterns (Google/Brave/Serper)

```
# High-signal discovery via external links
site:github.com [problem description] [language] implementation

# Community-vetted alternatives
"alternatives to [known library]" site:reddit.com OR site:news.ycombinator.com

# Tutorial-linked repos
[topic] tutorial github.com [year]

# Solution space mapping
"how to implement [X]" OR "best library for [X]" site:stackoverflow.com [language]

# Awesome list discovery
"awesome [topic]" site:github.com topics

# Blog-mined repos
[topic] [language] github.com "open source" site:dev.to OR site:medium.com
```

### AI Search Engine Queries (Phind/Perplexity)

```
# Phind (code-focused)
"What are the best open source Python libraries for [X]? Show me the GitHub repos."

# Perplexity (solution space)
"What are all the approaches developers use to solve [X] and what are the main open source implementations of each?"

# Exa (semantic)
Find GitHub repositories implementing [description of problem] in [language]
```

### YouTube Mining Pattern

```python
import re
from googleapiclient.discovery import build

GITHUB_URL_PATTERN = re.compile(
    r'https://github\.com/[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+'
)

def extract_repos_from_youtube(api_key, query, max_results=50):
    youtube = build('youtube', 'v3', developerKey=api_key)
    # Step 1: Search for videos
    search_response = youtube.search().list(
        q=query, type='video', part='id', maxResults=max_results
    ).execute()
    video_ids = [item['id']['videoId'] for item in search_response['items']]
    # Step 2: Get descriptions
    videos_response = youtube.videos().list(
        part='snippet', id=','.join(video_ids)
    ).execute()
    # Step 3: Extract GitHub URLs
    repos = set()
    for video in videos_response['items']:
        desc = video['snippet']['description']
        matches = GITHUB_URL_PATTERN.findall(desc)
        repos.update(matches)
    return repos
```

### Quality Validation Scoring

```
High-confidence repo signals (weight 2 each):
- Pushed date within 6 months
- Fork-to-star ratio > 0.1 (developers actually modifying code)
- Has CONTRIBUTING.md or CHANGELOG
- CI/CD badge present in README
- Issues section has recent responses from maintainers

Medium-confidence signals (weight 1 each):
- Star count > 200 (with fake-star caveat)
- README > 2KB (substantial documentation)
- Multiple contributors (not solo author)
- Has tests directory
- Tagged releases present

Red flags (weight -3 each):
- Star count spiked sharply then flatlined (StarScout pattern)
- Account created same month as repo starred heavily
- No issues filed despite substantial star count
- README is marketing copy only, no technical details
- Last commit > 18 months ago
```

---

## Gaps Identified

1. **No authoritative data on Google's crawl frequency for github.com
   specifically.** User reports range from 4 days to 4+ weeks. Google does not
   publish per-domain crawl rates. GitHub does not expose a sitemap for
   individual repositories to consumers.

2. **YouTube mining effectiveness is unvalidated.** No published study measures
   what percentage of high-quality repos are discoverable via video description
   mining vs. direct search. The approach is technically feasible but signal
   quality is unknown.

3. **"Solution space mapping" via community platforms has no automated
   tooling.** LibHunt partially automates this for known library names but
   discovery of unknown solution approaches still requires manual query
   formulation and cross-platform synthesis.

4. **Fake star detection tools are research prototypes, not production APIs.**
   StarScout is described in the CMU paper but is not available as a public API.
   Developers must implement their own detection heuristics or rely on
   third-party tools (none identified as production-ready and public-facing).

5. **Phind's specific GitHub indexing depth and freshness are undocumented.**
   The claim that Phind "searches GitHub" is asserted but the depth (README
   only? code? issues?) and index freshness are not published.

6. **Exa.ai's code search feature coverage of GitHub is not fully documented.**
   It claims 1B+ page index but the proportion that is GitHub content vs.
   documentation vs. general web is unclear.

7. **No comparison of programmatic search API result quality for GitHub-specific
   queries.** All API comparisons reviewed are general-purpose (news, facts, web
   content). No study benchmarks how well Serper vs. Brave vs. Exa performs
   specifically for "find GitHub repos implementing X."

---

## Sources

| #   | URL                                                                                                           | Title                                                   | Type          | Trust  | CRAAP | Date    |
| --- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ------------- | ------ | ----- | ------- |
| 1   | https://www.freecodecamp.org/news/github-search-tips/                                                         | GitHub Search Tips                                      | tutorial      | HIGH   | 4.2   | 2024    |
| 2   | https://github.com/orgs/community/discussions/159014                                                          | Advanced GitHub Search Techniques                       | official      | HIGH   | 4.5   | 2025    |
| 3   | https://developers.google.com/custom-search/v1/site_restricted_api                                            | Custom Search JSON API                                  | official-docs | HIGH   | 5.0   | 2025    |
| 4   | https://www.oreateai.com/blog/demystifying-google-custom-search-api-pricing                                   | Google CSE Pricing Guide                                | blog          | MEDIUM | 3.5   | 2024    |
| 5   | https://www.aibase.com/news/www.aibase.com/news/18003                                                         | Microsoft Ends Bing Search API                          | news          | MEDIUM | 3.8   | 2025    |
| 6   | https://www.firecrawl.dev/blog/bing-search-api-alternatives                                                   | Bing Search API Alternatives                            | blog          | MEDIUM | 3.7   | 2026    |
| 7   | https://github.blog/engineering/architecture-optimization/the-technology-behind-githubs-new-code-search/      | Technology Behind GitHub's Code Search                  | official-blog | HIGH   | 4.8   | 2023    |
| 8   | https://github.com/orgs/community/discussions/42375                                                           | How to add GitHub repo to Google search                 | community     | MEDIUM | 3.2   | 2023    |
| 9   | https://arxiv.org/abs/2412.13459                                                                              | Six Million (Suspected) Fake Stars on GitHub            | academic      | HIGH   | 4.7   | 2024-12 |
| 10  | https://www.cs.cmu.edu/news/2025/fake-github-stars                                                            | Fraudsters Use Fake Stars To Game GitHub                | academic-news | HIGH   | 4.6   | 2025    |
| 11  | https://www.index.dev/blog/phind-vs-perplexity-ai-coding                                                      | Phind vs Perplexity for Coding                          | blog          | MEDIUM | 3.6   | 2026    |
| 12  | https://www.haoqq.com/en/guides/ai-search-engines-compared-2026                                               | AI Search Engines Compared 2026                         | blog          | MEDIUM | 3.4   | 2026    |
| 13  | https://brave.com/search/api/                                                                                 | Brave Search API                                        | official      | HIGH   | 4.8   | 2025    |
| 14  | https://www.firecrawl.dev/blog/best-web-search-apis                                                           | Best Web Search APIs for AI                             | blog          | MEDIUM | 3.6   | 2026    |
| 15  | https://til.simonwillison.net/github/graphql-search-topics                                                    | Searching GitHub repos by topic via GraphQL             | blog/TIL      | HIGH   | 4.3   | 2023    |
| 16  | https://developers.google.com/youtube/v3/docs                                                                 | YouTube Data API Reference                              | official-docs | HIGH   | 5.0   | 2025    |
| 17  | https://alternativeto.net/software/libhunt/                                                                   | LibHunt Alternatives                                    | directory     | MEDIUM | 3.5   | 2025    |
| 18  | https://dev.to/stanbright/the-easiest-way-to-find-alternatives-to-almost-any-popular-open-source-project-2c1n | Finding Alternatives to Open Source Projects            | blog          | MEDIUM | 3.3   | 2022    |
| 19  | https://exa.ai/versus/tavily                                                                                  | Exa vs Tavily comparison                                | vendor        | MEDIUM | 3.0   | 2026    |
| 20  | https://arxiv.org/html/2512.03793v1                                                                           | Enshittification of Online Search (coding advice study) | academic      | HIGH   | 4.5   | 2024-12 |
| 21  | https://serpapi.com/                                                                                          | SerpAPI                                                 | vendor        | MEDIUM | 3.5   | 2025    |
| 22  | https://www.serphouse.com/blog/explore-bing-search-api-documentation/                                         | Bing Search API Developer Guide 2026                    | blog          | MEDIUM | 3.3   | 2026    |

---

## Contradictions

**Stars as quality signal:** The ToolJet blog [SOURCE-14-adjacent] positions
GitHub stars as meaningful traction indicators, while the CMU academic research
[SOURCE-9] demonstrates 6M+ fake stars with 16% of repos affected. These are not
reconcilable: stars must be treated as suspect and cross-validated with other
signals.

**Bing API status:** Some sources reference the Bing Web Search API as currently
available for new signups; the aibase.com article and Microsoft's own
documentation confirm full retirement as of August 11, 2025. The contradiction
comes from articles written before the retirement date still appearing in search
results.

**Phind GitHub coverage:** Multiple sources position Phind as searching GitHub
directly. Phind's own documentation does not specify the depth or freshness of
its GitHub coverage — whether it indexes full file trees or only READMEs and
metadata is unconfirmed.

---

## Serendipity

**StarScout as a validation tool:** The CMU fake-star paper describes StarScout
as a detection system capable of flagging repositories with anomalous starring
patterns. While not currently a public API, the paper's methodology (lockstep
behavior, low-activity account patterns) is replicable via the GitHub API and
could be built into a repo quality scoring pipeline.

**Bing retirement as market signal:** The retirement of the Bing Search API is
not just a technical change — it reflects Microsoft's strategic shift to
"AI-mediated search" (grounding inside Azure AI Foundry). This suggests that
bare SERP access is being deprecated industry-wide in favor of LLM-integrated
search, which has architectural implications for any repo discovery pipeline
built today.

**Academic study benchmark (Bing for coding queries):** The December 2024
preprint found Bing outperforms Google for coding queries (Stack Overflow rank
1.9 vs 2.8) in 1,467-query tests. Ironic given Bing's API was retired months
later — but the finding is relevant for evaluating Brave Search (which took over
Bing's API customer base) as a quality option.

**GitHub Topics GraphQL as underused discovery layer:** Simon Willison's TIL
documents a clean GraphQL pattern for topic-based discovery that most developers
appear unaware of. It's higher-signal than keyword search for domain discovery
because topics are intentionally curated by repo maintainers.

---

## Confidence Assessment

- HIGH claims: 8
- MEDIUM claims: 7
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: MEDIUM-HIGH

The findings on API availability/pricing and fake stars are strongly supported
by multiple independent sources including academic research. The AI search
engine comparisons rely more heavily on vendor-produced content and single
third-party comparisons, warranting MEDIUM confidence. The YouTube mining and
solution-space-mapping approaches are technically grounded but have limited
published validation of effectiveness.

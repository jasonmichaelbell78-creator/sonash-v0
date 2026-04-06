# Gap Finding: RSS as Extraction Path and MCP-Wrapped Extraction Evaluation

**Gap type:** scope-gap **Profile used:** web **Confidence:** MEDIUM

## Finding

Two extraction paths were never evaluated in the initial research pipeline: (1)
RSS feeds as a structured, robots.txt-safe extraction channel for blog/news
sites, and (2) existing MCP servers as the extraction layer instead of a custom
pipeline. Both paths have real viability and material tradeoffs.

---

## Gap 1: RSS Feed as Extraction Path

### Adoption Rate

No authoritative 2024-2026 study publishes a precise percentage of all websites
that expose RSS. The best available proxies are:

- BuiltWith Trends tracks RSS adoption but its live dashboard was inaccessible
  during this research. A 2015 snapshot cited approximately 21% of the top
  10,000 global sites publishing RSS feeds.
- WordPress powers approximately 43% of all websites (W3Techs 2025), and
  WordPress auto-generates an RSS feed for every site by default. Unless a site
  owner explicitly disables it, 100% of WordPress installs expose feeds.
- Ghost, Substack, Medium, Beehiiv, and most CMS platforms ship RSS by default.
- Major news organizations (NYT, CNN, WaPo, BBC, Reuters, AP) all maintain
  feeds.
- RSS adoption climbed 34% year-over-year in 2026 among professional users
  (source: rss.app, secondary).

Practical estimate: for blog and news content specifically, RSS feed
availability is high — conservatively 50-70% of active content sites — because
the dominant CMS platforms ship it by default. For arbitrary websites
(e-commerce, landing pages, SaaS apps), RSS prevalence drops near zero.

### Feed Discovery

RSS feeds are discoverable via two reliable methods:

1. HTML link tag inspection: `<link rel="alternate" type="application/rss+xml">`
   or `type="application/atom+xml"` in the document head. Browsers have used
   this standard since RSS 2.0.
2. Common URL pattern probing: `/feed`, `/rss`, `/atom.xml`, `/feed.xml`,
   `/rss.xml`, `/index.xml`. Most platforms use predictable paths.

Neither method requires scraping page content — a lightweight HEAD/GET against
HTML plus link-tag parsing is sufficient. The `rss-parser` npm library does NOT
include auto-discovery; a thin wrapper to fetch HTML and extract `link rel` tags
must be written separately before handing the feed URL to the parser.

### Full Content vs Summary

Reader preference surveys show 74% of RSS subscribers want full post content in
the feed; 19% accept summaries. However, what publishers deliver does not match
what readers want. Many commercial publications (especially those monetizing
page views) intentionally truncate RSS to force click-through. No reliable
2024-2026 statistic quantifies the full-content vs summary split across the
corpus of feeds, but empirical observation places full-text feeds as a minority
among large commercial publishers and a majority among independent blogs and
newsletters.

### Node.js RSS Libraries

**rss-parser** (npm, by rbren) is the dominant Node.js choice:

- Parses both RSS 2.0 and Atom feeds from URL or XML string
- Supports custom fields, HTML stripping, entity unescaping, ISO 8601 dates
- TypeScript support with generics
- No built-in feed auto-discovery (must be handled separately)
- Active repository with 363+ commits; no native feed-discovery function

**feedparser** (npm, by danmactough) is the older alternative:

- More robust parsing of malformed and edge-case feeds
- Streaming API, suitable for large feeds
- Less actively maintained than rss-parser

**Python feedparser** is the reference implementation for Python pipelines.

### Can RSS Be Primary Extraction for Blog Sites?

Yes, with caveats:

- For sites that provide full-content feeds, RSS eliminates the need for HTML
  extraction entirely. The feed delivers clean, structured, boilerplate-free
  text with metadata (title, author, pubDate, URL) already parsed.
- For sites that publish summary-only feeds, RSS provides a cheapdiscovery
  signal (new content exists, URL known) but the full text still requires an
  HTML extraction step.
- RSS feeds are explicitly machine-readable and are not blocked by robots.txt.
  The robots.txt exclusion standard does not apply to Atom/RSS endpoints.
- RSS provides native freshness signaling via pubDate and the `<updated>` field,
  eliminating the need to re-crawl to detect new content.

Recommended architecture: implement RSS as a first-pass check in the site
classification layer. If a feed is discovered and provides full content, skip
HTML extraction entirely for that site. If summary-only, use the feed for
discovery and scheduling while delegating body extraction to the existing
trafilatura/Turndown pipeline.

---

## Gap 2: MCP-Wrapped Extraction Evaluation

### mcp-server-fetch (Official Anthropic / modelcontextprotocol)

- Package: `mcp-server-fetch` on PyPI, version 2025.4.7 (released April 7, 2025)
- Maintained by the modelcontextprotocol organization (Anthropic-aligned)
- Single tool exposed: `fetch`
- Input: URL, optional max_length (default 5000 chars), start_index, raw flag
- Output: Markdown via HTML-to-Markdown conversion; optionally raw HTML
- Conversion stack: when Node.js is available, uses a "more robust HTML
  simplifier"; without Node.js, uses a Python fallback
- Does NOT use trafilatura internally; uses Readability-style extraction
  (Mozilla Readability + TurndownService in the Node path, or fast_html2md in
  the Rust path depending on variant)
- Maturity: HIGH — officially maintained, stable release cadence
- Limitation: default 5000-char truncation is unsuitable for long articles
  without chunking via start_index; no batch mode; no JavaScript rendering

Assessment: viable as a Quick Scan baseline. The output quality is comparable to
Turndown applied to a Readability extraction. The truncation default must be
overridden for full article extraction. No meaningful differentiation from a
self-implemented Readability + Turndown chain except that it runs as an MCP
service rather than inline code.

### @fvanevski/trafilatura_mcp

- Registry: Glama MCP registry (not in npm or PyPI directly)
- Added to Glama: October 1, 2025; last updated March 30, 2026
- GitHub stars: 1 (single star — minimal adoption)
- Single tool exposed: `fetch_and_extract`
- Backed by trafilatura Python library (Python 3.12+ required, uv required)
- Exposes configurable extraction options (include/exclude comments and tables)
- No external API key required
- Security grade: A (Apache 2.0 license, no known vulnerabilities)
- Maturity: LOW — 1 GitHub star, early-stage, incomplete quality testing

Assessment: interesting proof-of-concept that wraps trafilatura as an MCP tool.
Not production-ready. The underlying trafilatura library is mature and used by
HuggingFace, IBM, and Microsoft Research, but this MCP wrapper is experimental.
If the team wants trafilatura access via MCP protocol, they would be better
served building a minimal wrapper themselves than depending on a 1-star
community server.

### fetchv2-mcp-server

- Package: `fetchv2-mcp-server 1.1.0` on PyPI (libraries.io)
- Uses trafilatura for content extraction
- Tools: fetch webpages, extract clean content, discover links for batch
  processing
- Maturity: LOW to MEDIUM — community project, version 1.1.0, limited signals

Assessment: more feature-complete than @fvanevski/trafilatura_mcp (includes link
discovery), but still a community project without clear maintenance commitment.

### Firecrawl MCP Server (Official)

- Package: `firecrawl-mcp-server` on npm and Docker Hub (`mcp/firecrawl`)
- GitHub: 6,000 stars, 670 forks — HIGH community adoption
- Last commit: active (2025-2026 range)
- Requires Firecrawl API key (or self-hosted instance via FIRECRAWL_API_URL)
- 12 tools exposed:
  - firecrawl_scrape (single URL, markdown/JSON output)
  - firecrawl_map (discover all indexed URLs on a site)
  - firecrawl_search (web search + optional content extraction)
  - firecrawl_crawl (async multi-page crawl)
  - firecrawl_check_crawl_status
  - firecrawl_extract (LLM-powered structured extraction)
  - firecrawl_agent (autonomous research agent)
  - firecrawl_agent_status
  - firecrawl_browser_create / execute / delete / list (CDP browser sessions)
- Handles JavaScript rendering natively (no separate Playwright setup)
- Pricing: 1 credit per scrape/crawl page; Enhanced Mode costs 5 credits/request
  (from May 2025); free tier 500 credits; paid plans from $16/month; Extract
  billed separately by tokens
- Self-hosted: supported (Docker files included)
- Maturity: HIGH — most mature extraction MCP server available

Assessment: Firecrawl MCP is the most capable extraction MCP server evaluated.
It handles JS rendering, batch crawling, structured extraction, and autonomous
research in a single server. The cost model is cloud-credit-based, which adds
operational cost per URL that the custom trafilatura/Turndown pipeline avoids.
For a v1 prototype, the free tier (500 credits) is sufficient to validate the
approach. For production scale, self-hosting Firecrawl eliminates per-credit
costs but introduces infrastructure overhead.

### Are There Other Extraction MCP Servers Worth Evaluating?

- **Jina Reader**: Not surfaced in this search. Jina.ai provides an r.jina.ai
  URL prefix that returns any webpage as clean Markdown without an API key. This
  is not an MCP server but is a zero-setup alternative.
- **Tavily Search MCP**: Focuses on search + retrieval, not raw HTML extraction.
  Competitive with Firecrawl for search-driven pipelines.
- **Apify MCP**: Apify provides cloud scraping infrastructure and has MCP
  integrations; not deeply evaluated here.

### Could MCP Servers Replace the Custom Extraction Pipeline for v1?

Partially. The honest tradeoff matrix:

| Dimension              | Custom Pipeline      | mcp-server-fetch          | Firecrawl MCP                  |
| ---------------------- | -------------------- | ------------------------- | ------------------------------ |
| JS rendering           | Playwright (Tier 2+) | No                        | Yes                            |
| Extraction quality     | trafilatura (HIGH)   | Readability (MEDIUM-HIGH) | Varies by mode                 |
| Cost                   | Infrastructure only  | Free                      | Credit-based                   |
| Operational complexity | HIGH (own it all)    | LOW                       | MEDIUM (API key + credit mgmt) |
| Batch/crawl native     | Manual               | No                        | Yes                            |
| Self-hostable          | Yes                  | Yes                       | Yes                            |
| Maturity               | MEDIUM (custom)      | HIGH                      | HIGH                           |

For v1 prototyping, mcp-server-fetch is the fastest path to a working baseline
with zero configuration. It eliminates the Turndown + trafilatura setup at the
cost of slightly lower extraction fidelity and no JS rendering.

For a production system, the custom pipeline (trafilatura + Playwright Tier 2)
provides the best quality-to-cost ratio at scale, while Firecrawl MCP provides
the best capability-to-setup-time ratio at moderate scale with accepted cloud
costs.

---

## Evidence

- [RSS Usage Statistics - BuiltWith Trends](https://trends.builtwith.com/feeds/RSS)
- [rss-parser npm / GitHub](https://github.com/rbren/rss-parser)
- [mcp-server-fetch on PyPI](https://pypi.org/project/mcp-server-fetch/)
- [Anthropic Fetch MCP Server overview - PulseMCP](https://www.pulsemcp.com/servers/modelcontextprotocol-fetch)
- [Anthropic Fetch MCP Server guide - Skywork](https://skywork.ai/skypage/en/anthropic-fetch-mcp-server-guide/1977618601516404736)
- [@fvanevski/trafilatura_mcp on Glama](https://glama.ai/mcp/servers/@fvanevski/trafilatura_mcp)
- [fetchv2-mcp-server on libraries.io](https://libraries.io/pypi/fetchv2-mcp-server)
- [Firecrawl MCP Server docs](https://docs.firecrawl.dev/mcp-server)
- [Firecrawl MCP Server GitHub](https://github.com/firecrawl/firecrawl-mcp-server)
- [Firecrawl pricing - eesel.ai](https://www.eesel.ai/blog/firecrawl-pricing)
- [RSS feed reader preferences - sociablekit](https://www.sociablekit.com/rss-feed-statistics/)
- [RSS still relevant 2025 - rss.app](https://rss.app/en/blog/why-rss-feeds-are-still-relevant-in-2025-4h4WiW)
- [WordPress RSS feed guide - kinsta](https://kinsta.com/blog/wordpress-rss-feed/)
- [RSS full content vs summary - webmaster-source](https://www.webmaster-source.com/2007/08/10/rss-full-content-or-summaries/)
- [feedparser npm](https://www.npmjs.com/package/feedparser)

---

## Claims

- **[G2-C01]** WordPress auto-generates RSS feeds for all sites by default;
  since WordPress powers ~43% of all websites, a large share of the web exposes
  RSS without any publisher action. (confidence: HIGH)
- **[G2-C02]** No authoritative 2024-2026 study provides a precise percentage of
  all websites that have RSS feeds; the best estimate for blog/news content
  specifically is 50-70% given CMS defaults. (confidence: MEDIUM)
- **[G2-C03]** RSS feed auto-discovery can be implemented by parsing
  `<link rel="alternate" type="application/rss+xml">` tags in HTML plus probing
  common URL patterns (/feed, /rss, /atom.xml). (confidence: HIGH)
- **[G2-C04]** The rss-parser npm library does not include built-in feed
  auto-discovery; discovery logic must be implemented separately before feeding
  a URL to the parser. (confidence: HIGH)
- **[G2-C05]** 74% of RSS readers prefer full-content feeds; however, many
  commercial publishers intentionally truncate feeds to force click-through,
  making full-text availability unreliable across the general corpus.
  (confidence: MEDIUM)
- **[G2-C06]** RSS feeds are not governed by robots.txt — the standard applies
  to web crawlers, not to feed consumers — making RSS a robots.txt-safe
  extraction path by design. (confidence: HIGH)
- **[G2-C07]** For sites that expose full-content RSS feeds, feed parsing
  eliminates the need for HTML extraction entirely, delivering structured text
  with title, author, pubDate, and URL already parsed. (confidence: HIGH)
- **[G2-C08]** mcp-server-fetch (official, PyPI 2025.4.7) exposes a single
  `fetch` tool that returns Markdown output via Readability-style extraction; it
  is mature and maintained but defaults to 5000-char truncation and does not
  render JavaScript. (confidence: HIGH)
- **[G2-C09]** @fvanevski/trafilatura_mcp has 1 GitHub star and incomplete
  quality testing; it is experimental and not suitable for production
  dependency. (confidence: HIGH)
- **[G2-C10]** Firecrawl MCP Server has 6,000 GitHub stars and 12 tools
  including JS rendering, batch crawl, structured LLM extraction, and autonomous
  agent modes; it is the most capable extraction MCP server currently available.
  (confidence: HIGH)
- **[G2-C11]** Firecrawl MCP pricing is 1 credit per scraped/crawled page, with
  a 500-credit free tier; Enhanced Mode costs 5 credits/request from May 2025
  onward; structured LLM extraction is billed separately by token. (confidence:
  HIGH)
- **[G2-C12]** Firecrawl MCP supports self-hosting via Docker, eliminating
  per-credit costs at the expense of infrastructure overhead. (confidence: HIGH)
- **[G2-C13]** For v1 prototyping, mcp-server-fetch provides the fastest
  zero-configuration extraction baseline; for production scale, the custom
  trafilatura pipeline provides better quality-to-cost ratio. (confidence:
  MEDIUM)
- **[G2-C14]** No dedicated RSS MCP server was found in the ecosystem; RSS
  extraction would need to be implemented as application code using rss-parser
  or equivalent, not as an MCP tool call. (confidence: HIGH)

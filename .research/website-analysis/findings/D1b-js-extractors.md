# Findings: JS-Capable Content Extraction Tools for Website Analysis

**Searcher:** deep-research-searcher **Profile:** web + docs **Date:**
2026-04-05 **Sub-Question IDs:** SQ1b

---

## Key Findings

### 1. Firecrawl — Full-Stack Scraping API (Cloud + Limited Self-Host) [CONFIDENCE: HIGH]

Firecrawl is an API-first web scraping platform optimized for AI/LLM workflows.
It handles JS rendering via pre-warmed headless Chromium and intelligently
decides (HTML fetch vs browser) per request to optimize speed and cost.

**JS Rendering:** Uses pre-warmed headless Chromium with built-in stealth proxy
network, proxy rotation, and a FIRE-1 agent capable of solving basic CAPTCHAs.
Cloud-only; the self-hosted version lacks Fire-engine entirely.

**Output Quality:** Returns markdown by default with ~67% token reduction vs raw
HTML for RAG. Also supports HTML, JSON-schema structured extraction, and
screenshots. In a 1,000-URL benchmark, Firecrawl achieved 96% coverage with
0.638 F1 accuracy.

**Structure Preservation:** Supports link deduplication, heading preservation,
and JSON-schema natural-language prompts for selector-free structured
extraction.

**Self-Hosting:** Available via Docker Compose under AGPL-3.0. Missing features
vs cloud: `/agent` endpoint, `/browser` (sandbox) endpoint, Fire-engine
(advanced IP block/bot detection), proxy rotation, and dashboard UI. Requires
OpenAI API key for JSON formatting, extraction summaries, and `/extract`
endpoint.

**Pricing (2026):** | Plan | Credits/month | Cost/month | Notes |
|-----------|--------------|------------|--------------------------| | Free |
500 one-time | $0 | No rollover | | Hobby | 3,000 | $16 | 5 concurrent browsers
| | Standard | 100,000 | $83 | 50 concurrent (popular) | | Growth | 500,000 |
$333 | 100 concurrent | | Scale | 1,000,000 | $599 | 150 concurrent | |
Enterprise| Custom | Custom | SSO, SLA, zero-data-ret |

Credit cost: 1/page standard, 2/browser-minute for interactive, 5 free Agent
runs/day then dynamic pricing. **Important:** `Enhanced Mode + JSON` mode costs
9 credits/page — so Hobby plan only covers ~333 pages at that tier.

**Bot Protection:** Built-in stealth proxy + CAPTCHA solving (cloud only).
Self-hosted has NO anti-bot capabilities beyond basic Playwright.

**Ease of Integration:** REST API + SDKs for Python, Node.js, Go, Rust, Java.
MCP server available. CLI invocation via `npx firecrawl-mcp`.

**GitHub:** 105k+ stars, active (5,197+ commits), AGPL-3.0.

---

### 2. Jina Reader (r.jina.ai) — URL-to-Markdown API [CONFIDENCE: HIGH]

Jina Reader converts any URL to LLM-friendly markdown by prepending `r.jina.ai/`
to the URL. Uses Puppeteer with headless Chrome for JS rendering; for hash-based
SPAs, POST requests are required since `#`-fragment content isn't server-sent.

**JS Rendering:** Headless Chrome (Puppeteer) with configurable wait-for
selectors, CSS include/exclude, locale-specific rendering, Shadow DOM
flattening, and iframe extraction options.

**Output Quality:** Uses ReaderLM-v2 (1.5B parameter model) to intelligently
transform HTML into structured markdown/JSON. Returns `url`, `title`, `content`,
`timestamp`. Supports `x-respond-with: markdown|html|text|screenshot` header.

**Structure Preservation:** Default mode preserves headings and links; CSS
selectors available for fine-tuning. Image captioning via vision-language
models. Supports streaming for large pages (Server-Sent Events).

**PDF Support:** Full PDF extraction since May 2024.

**Rate Limits:** | Tier | RPM | TPM | Cost |
|-------------|-------|------|-----------------------| | No API key | 20 | — |
Free | | Free key | 500 | — | Free (10M tokens init) | | Paid | 500 | 2M |
Token-based | | Premium | 5,000 | 50M | Token-based |

Pricing: ~$0.045–0.050 per 1M tokens. Failed requests are not charged. Pricing
model changed May 6, 2025 (old auto-recharge customers grandfathered).

**Self-Hosting:** Docker image available (Apache-2.0 license — more permissive
than Firecrawl's AGPL-3.0). The GitHub repo is the same codebase as `r.jina.ai`.

**Bot Protection:** Supports retries; proxy must be user-supplied ("bring your
own proxy"). Weakest of the major tools on hard anti-bot targets.

**Ease of Integration:** Zero-config usage (`r.jina.ai/https://example.com`),
API key optional. MCP server available. Simplest integration of all tools
evaluated.

**GitHub:** 10k+ stars, Apache-2.0, active.

---

### 3. Crawl4AI — Open-Source Python Crawler with LLM Integration [CONFIDENCE: HIGH]

Crawl4AI is a Python-first async web crawler built on Playwright. 100%
self-hosted, no cloud SaaS offering (cloud API is in closed beta as of research
date). Reached #1 GitHub trending with 58k+ stars.

**JS Rendering:** Full Playwright-based browser automation. Supports:

- Custom JS injection via `js_code` parameter
- Cookie/header/user-agent customization
- Scroll simulation for infinite-scroll pages
- Shadow DOM flattening (v0.8.5+)
- Virtual scroll support

**Output Quality:** Returns: `raw_markdown`, `fit_markdown` (filtered),
`markdown_with_citations` (reference-style links), plus raw HTML, JSON, and
media metadata. Heuristic-based filtering via `PruningContentFilter`. LLM-based
filtering via `LLMContentFilter` (uses any LLM, including local Ollama).

**Structure Preservation:** Preserves headings, code blocks, bullet points,
links. `DefaultMarkdownGenerator` is configurable (link inclusion, image
preservation, text wrapping). CSS selector and XPath extraction also available.

**Anti-Bot:** 3-tier automatic anti-bot detection with proxy escalation
(v0.8.5+). Proxy must be supplied by the user; the tiers escalate automatically.

**Self-Hosting:** Apache-2.0 (MIT per some sources, confirmed Apache-2.0 on
GitHub). Docker image + Helm chart available. Docker API server runs on port
11235 with FastAPI + playground UI. Can run entirely offline with local LLMs.

**Pricing:** Free. Self-hosting costs only (Docker, compute, LLM tokens if
used).

**Installation:** `pip install -U crawl4ai && crawl4ai-setup` (installs
Playwright automatically). Python async pattern required.

**Ease of Integration:** Python library only (native). Node.js integration
requires subprocess or Docker API. The Docker REST API at `localhost:11235`
provides language-agnostic access. Less turnkey than Firecrawl/Jina for
non-Python teams.

**Recent versions:** v0.8.6 (security hotfix), v0.8.5 (anti-bot + Shadow DOM),
v0.8.0 (crash recovery + 5-10x faster prefetch mode).

---

### 4. Playwright + @mozilla/readability — DIY Pipeline [CONFIDENCE: HIGH]

The combination of Playwright (JS rendering) + @mozilla/readability (content
extraction) is a well-established pattern for Node.js/TypeScript teams. This is
essentially what many hosted services do internally.

**How it works:**

1. Playwright launches Chromium/Firefox/WebKit and fully renders the page
2. `page.content()` returns the final DOM as HTML string
3. `@mozilla/readability` parses the HTML (via jsdom in Node.js) to extract main
   content
4. Optional: `turndown` converts the extracted HTML to markdown

**JS Rendering Quality:** Excellent — Playwright is the gold standard. Supports
auto-wait, infinite scroll, AJAX completion, SPA navigation, custom JS
injection. Playwright outperforms Puppeteer: ~2.7s vs ~4.3s avg response time in
benchmarks. Multi-browser support (Chromium, Firefox, WebKit) allows engine
switching.

**Content Extraction Quality:** @mozilla/readability powers Firefox Reader View.
Returns: `title`, `byline`, `content` (HTML), `textContent` (plain), `excerpt`,
`siteName`, `publishedTime`. `isProbablyReaderable()` helper checks page
suitability.

**Structure Preservation:** Returns structured HTML (preserves headings, links)
and plain text. Convert to markdown via `turndown` or `node-html-markdown` for
LLM-ready output. Not automatic — requires pipeline assembly.

**Limitations of Readability:**

- Designed for article-structured content (blogs, news, docs)
- Struggles with product pages, databases, app UIs, non-article layouts
- No tables-to-markdown support natively (turndown handles this)
- No built-in bot bypass — requires additional tooling (stealth plugins,
  proxies)

**Bot Protection:** None out of the box. Can add `playwright-extra` +
`puppeteer-extra-plugin-stealth` for fingerprint masking, but maintainers
deprecated `puppeteer-stealth` in Feb 2025. Alternative: Playwright with
`nodriver` or SeleniumBase UC Mode for Cloudflare bypass.

**Ease of Integration:** High for Node.js/TypeScript teams. Full control, no API
keys, no rate limits (beyond what target sites enforce). Cost = compute only.

**npm packages:** `@mozilla/readability` (official Mozilla), `playwright`,
`jsdom`, `turndown`

---

### 5. Puppeteer-Based Solutions [CONFIDENCE: MEDIUM]

Puppeteer (Node.js, Google-maintained) is the predecessor pattern to Playwright.
In 2025-2026, Playwright is the recommended replacement for new projects.

**Comparison vs Playwright:**

- Puppeteer: Chrome/Firefox only; Node.js only; ~4.3s avg; older stealth plugins
  deprecated (Feb 2025)
- Playwright: Chromium/Firefox/WebKit; Python/JS/TS/Java/C#; ~2.7s avg; active
  development and better auto-wait mechanics

**When Puppeteer is sufficient:** Price tracking, static-ish pages, dashboards
behind basic auth. Puppeteer is lighter-weight and has simpler API for
single-purpose scrapers. Node.js-only ecosystem.

**Bot protection with Puppeteer:** `puppeteer-extra-plugin-stealth` was the
standard approach, but it was deprecated Feb 2025 and does NOT bypass current
Cloudflare versions. Must migrate to `nodriver` or `undetected-chromedriver`
patterns.

**Verdict for website-analysis skill:** Playwright is strictly superior. No
reason to choose Puppeteer for new development in 2026.

---

### 6. SingleFile CLI — Full-Page Archival [CONFIDENCE: MEDIUM]

SingleFile CLI (`single-file-cli`) is an open-source tool that saves complete
web pages as self-contained HTML files using Chrome DevTools Protocol. It
captures the fully rendered page including all assets (CSS, images, fonts)
embedded inline.

**JS Rendering:** Uses headless Chrome via CDP. Full rendering before capture.
Available as standalone binary (no install required) for Windows/macOS/Linux.

**Content Extraction:** SingleFile's output is a faithful HTML snapshot, NOT
clean markdown or structured text. It is an archival format, not an extraction
format. To get clean text from SingleFile output, a secondary parsing step
(e.g., readability.js against the saved HTML) would be required.

**Use Case Fit:** Archival, reproducible snapshots, offline reading. **Not
appropriate as a primary extraction tool** for a website-analysis skill.
However, useful as an intermediate step if pixel-faithful rendering capture is
needed before extraction.

**Self-Hosted:** 100% local, no API, available on Docker Hub
(`capsulecode/singlefile`).

**Limitation:** Not designed for structured content extraction. Two-step
pipeline (SingleFile capture → readability parse) adds complexity with no
benefit over Playwright + readability directly.

---

### 7. Scrapfly — API with Best-in-Class Anti-Bot [CONFIDENCE: MEDIUM]

Scrapfly is a managed scraping API with particularly strong anti-bot
capabilities (98-100% success on Cloudflare-protected sites including Amazon,
Walmart, LinkedIn).

**JS Rendering:** Dedicated cloud browser instances with `render_js=True`.
Handles React, Vue, Angular SPAs. Anti-Scraping Protection (ASP) matches
Chrome/Firefox TLS fingerprints, HTTP/2 fingerprints, WebGL, canvas properties.

**Output:** Raw HTML primarily; markdown conversion not native (requires
post-processing). Less "AI-ready" out of the box compared to Firecrawl or Jina.

**Pricing:** Credit-based. Free tier: 1,000 credits. A request with residential
proxy + browser = 30 credits. Site-specific costs: Amazon $3.59/1K requests,
Walmart $0.29/1K. No self-hosted option.

**Bot Protection:** Best overall. Bypasses Cloudflare, Akamai, DataDome,
PerimeterX. Automatic challenge solving. 98% success rates cited.

**Verdict:** Superior to Firecrawl for protected sites, but lacks native
markdown output. Better as an infrastructure layer than a content extraction
layer.

---

### 8. Splash — Lightweight JS Rendering Service (Legacy) [CONFIDENCE: MEDIUM]

Splash is a Python/Twisted lightweight JavaScript rendering service with HTTP
API, designed for use with Scrapy. Uses QT5/WebKit engine.

**Critical limitation:** Splash uses an older WebKit engine that does not
support modern JavaScript frameworks (React 18+, Vue 3, modern async patterns).
As of 2025-2026 it is effectively a legacy tool.

**Self-Hosted:** Docker-based, fully local. No API costs.

**Verdict:** Do NOT recommend for new /website-analysis skill development. The
WebKit engine gap means significant coverage failures on modern sites.

---

## Tool Comparison Table

| Tool                   | JS Rendering     | Markdown Output   | Structure Preservation | Bot Protection    | Self-Host | Cost Model       | Integration       |
| ---------------------- | ---------------- | ----------------- | ---------------------- | ----------------- | --------- | ---------------- | ----------------- |
| Firecrawl              | Chromium (cloud) | Native, optimized | High (NL prompts)      | Built-in (cloud)  | Partial\* | $16-599/mo SaaS  | REST + SDKs       |
| Jina Reader            | Puppeteer/Chrome | Native (ReaderLM) | Good                   | Retry only, BYOP  | Docker    | Token-based      | URL prefix, REST  |
| Crawl4AI               | Playwright       | Native + filters  | High, configurable     | 3-tier + BYOP     | Full      | Free (self-host) | Python lib / REST |
| Playwright+Readability | Playwright       | Pipeline assembly | High (via code)        | None (manual)     | Full      | Free (compute)   | Node.js code      |
| Scrapfly               | Cloud Chrome     | HTML (post-proc)  | Manual                 | Best-in-class     | No        | Credit-based     | REST + SDKs       |
| SingleFile             | CDP/Chrome       | None (HTML only)  | Archival               | None              | Full      | Free (compute)   | CLI binary        |
| Splash                 | WebKit (dated)   | None              | Manual                 | None              | Full      | Free (compute)   | HTTP API          |
| Puppeteer              | Chrome/Firefox   | Pipeline assembly | Via code               | Deprecated (2025) | Full      | Free (compute)   | Node.js lib       |

\*Firecrawl self-hosted missing: Fire-engine, /agent, /browser, proxy rotation,
anti-bot

---

## Self-Hosted vs API Tradeoffs

**Choose API (Firecrawl/Jina/Scrapfly) when:**

- Bot protection is critical and target sites actively block scrapers
- You want zero-infrastructure overhead
- Output quality and markdown optimization matters more than cost
- Team is small and DevOps cost is high

**Choose self-hosted (Crawl4AI, Playwright+Readability, Jina Docker) when:**

- Privacy/data residency is required (no third-party data transmission)
- Volume is high and per-credit costs would dominate
- Full customization control is needed
- Running as part of a local tool (like a Claude skill)
- Target sites are not heavily protected

**For the /website-analysis skill specifically:** A local/self-hosted approach
is more appropriate for a CLI/skill invocation context. The skill runs in a
developer environment, not a cloud pipeline. This favors Crawl4AI Docker API or
Playwright + Readability over API-dependent tools.

---

## Recommendation Ranking

### Tier 1: Recommended for /website-analysis skill

**1. Crawl4AI (Docker REST API mode)**

- Best fit: Free, full JS rendering, native markdown output, self-hosted, 3-tier
  anti-bot, Docker container with REST API accessible from any language
- Tradeoff: Python-native (but Docker API provides language-agnostic access);
  not turnkey for Node/TypeScript without the API server
- Best for: Primary extraction engine when privacy + cost matter

**2. Jina Reader (self-hosted Docker)**

- Best fit: Zero-config URL-to-markdown (trivially simple), ReaderLM-v2 output
  quality, Apache-2.0 license, Docker self-host option, good free tier for
  lower-volume use
- Tradeoff: BYOP for anti-bot; limited on hardened sites
- Best for: Simple, fast extraction with minimal setup; excellent for "good
  enough" extraction of most public sites

**3. Playwright + @mozilla/readability (DIY pipeline)**

- Best fit: Maximum control, zero external dependencies, TypeScript-native, no
  rate limits, no API keys
- Tradeoff: Requires pipeline assembly (~50-100 lines of code); no native
  markdown (needs `turndown`); no anti-bot out of box
- Best for: Teams that want full control and transparency; best option when
  embedding extraction directly in a Node.js/TypeScript skill

### Tier 2: Viable with constraints

**4. Firecrawl (cloud)**

- Best fit: Highest extraction quality benchmark (96% coverage, 0.638 F1), best
  anti-bot (cloud), easiest integration
- Tradeoff: API key required, cost per page, self-hosted missing key features
- Best for: When extraction quality is paramount and cost is acceptable

**5. Scrapfly (cloud)**

- Best fit: Best Cloudflare bypass (98-100% success); when target sites are
  heavily protected
- Tradeoff: No native markdown output; cloud-only; credit-based complexity
- Best for: Specialized use when Cloudflare/DataDome bypass is the primary
  concern

### Tier 3: Not recommended for new development

**6. Puppeteer:** Superseded by Playwright. Stealth plugins deprecated Feb 2025.

**7. SingleFile:** Archival format only. Two-step pipeline with no net benefit
over Playwright + Readability.

**8. Splash:** Legacy WebKit engine, fails on modern JS frameworks.

---

## Sources

| #   | URL                                                                                                 | Title                            | Type               | Trust  | CRAAP (avg) | Date     |
| --- | --------------------------------------------------------------------------------------------------- | -------------------------------- | ------------------ | ------ | ----------- | -------- |
| 1   | https://docs.firecrawl.dev/introduction                                                             | Firecrawl Quickstart Docs        | Official docs      | HIGH   | 4.8         | 2025+    |
| 2   | https://www.firecrawl.dev/pricing                                                                   | Firecrawl Pricing                | Official pricing   | HIGH   | 4.8         | 2026     |
| 3   | https://docs.firecrawl.dev/contributing/self-host                                                   | Firecrawl Self-Host Docs         | Official docs      | HIGH   | 4.8         | 2025+    |
| 4   | https://jina.ai/reader/                                                                             | Jina Reader API                  | Official docs      | HIGH   | 4.8         | 2025+    |
| 5   | https://github.com/jina-ai/reader                                                                   | Jina Reader GitHub README        | Official repo      | HIGH   | 4.6         | 2025     |
| 6   | https://docs.crawl4ai.com/                                                                          | Crawl4AI Documentation           | Official docs      | HIGH   | 4.7         | 2025     |
| 7   | https://docs.crawl4ai.com/core/markdown-generation/                                                 | Crawl4AI Markdown Generation     | Official docs      | HIGH   | 4.7         | 2025     |
| 8   | https://docs.crawl4ai.com/core/quickstart/                                                          | Crawl4AI Quick Start             | Official docs      | HIGH   | 4.7         | 2025     |
| 9   | https://github.com/unclecode/crawl4ai                                                               | Crawl4AI GitHub                  | Official repo      | HIGH   | 4.6         | 2026     |
| 10  | https://blog.apify.com/jina-ai-vs-firecrawl/                                                        | Jina AI vs Firecrawl (Apify)     | Comparison article | MEDIUM | 3.8         | 2025     |
| 11  | https://blog.apify.com/crawl4ai-vs-firecrawl/                                                       | Crawl4AI vs Firecrawl (Apify)    | Comparison article | MEDIUM | 3.8         | 2025     |
| 12  | https://www.npmjs.com/package/@mozilla/readability                                                  | @mozilla/readability npm         | Official package   | HIGH   | 4.5         | 2025     |
| 13  | https://philna.sh/blog/2025/01/09/html-content-retrieval-augmented-generation-readability-js/       | Readability.js for RAG           | Developer blog     | MEDIUM | 3.5         | Jan 2025 |
| 14  | https://webcrawlerapi.com/blog/how-to-extract-article-or-blogpost-content-in-js-using-readabilityjs | Readability.js extraction guide  | Developer blog     | MEDIUM | 3.2         | 2025     |
| 15  | https://scrapfly.io/pricing                                                                         | Scrapfly Pricing                 | Official pricing   | HIGH   | 4.6         | 2026     |
| 16  | https://scrapfly.io/bypass/cloudflare                                                               | Scrapfly Cloudflare Bypass       | Official docs      | HIGH   | 4.5         | 2026     |
| 17  | https://github.com/gildas-lormeau/single-file-cli                                                   | SingleFile CLI GitHub            | Official repo      | HIGH   | 4.3         | 2025     |
| 18  | https://splash.readthedocs.io/en/stable/                                                            | Splash Documentation             | Official docs      | HIGH   | 3.2         | Legacy   |
| 19  | https://www.browsercat.com/post/playwright-vs-puppeteer-web-scraping-comparison                     | Playwright vs Puppeteer          | Comparison article | MEDIUM | 3.7         | 2025     |
| 20  | https://scrapegraphai.com/blog/firecrawl-pricing                                                    | Firecrawl Pricing Breakdown 2026 | Analysis blog      | MEDIUM | 3.4         | 2026     |

---

## Contradictions

**Crawl4AI license:** One source (Apify blog) cites MIT license, while the
official repo and other sources cite Apache-2.0. Apache-2.0 is the correct
current license per the official GitHub. The Apify article may be outdated.

**Firecrawl self-hosted markdown quality:** Marketing materials claim markdown
output is equivalent between cloud and self-hosted. However, the self-host
documentation confirms that without Fire-engine and FIRE-1 agent, the
self-hosted version cannot match cloud performance on JS-heavy or bot-protected
sites. The "67% token reduction" claim appears to apply to cloud only.

**Jina Reader RPM limits:** The official pricing page lists Free Key at 500 RPM,
but an older community source (Simon Willison, Jun 2024) cited 200 RPM for free
API keys. The official page is the authoritative source; the older figure is
stale.

**Puppeteer-stealth deprecation:** Multiple sources reference this as still
viable; however, the deprecation notice and active Cloudflare bypass failures
are confirmed by the Scrapfly blog (2025). Treat any "puppeteer-stealth works
for Cloudflare" claim as outdated.

---

## Gaps

1. **Actual Playwright + Readability + turndown pipeline benchmark:** No
   published benchmark comparing this DIY pipeline's markdown quality vs
   Firecrawl/Jina on a standardized URL set. Quality claims are qualitative.

2. **Crawl4AI cloud API ETA:** The GitHub README mentions a cloud API in closed
   beta; no public timeline or pricing announced as of research date.

3. **Jina Reader self-host resource requirements:** Docker deployment is
   confirmed, but CPU/RAM/GPU requirements for running ReaderLM-v2 locally are
   not documented in the publicly available README.

4. **Firecrawl enhanced mode credit calculation:** The 9-credit-per-page claim
   for Enhanced Mode + JSON format comes from a third-party analysis blog, not
   confirmed in official billing docs. Official docs only state 1 credit/page
   standard.

5. **Bot bypass success rates for Crawl4AI's 3-tier system:** The 3-tier
   anti-bot with proxy escalation is documented but no published success rate
   benchmarks exist for specific protected sites (Cloudflare, DataDome).

6. **Structure preservation on tables:** None of the sources explicitly tested
   table-to-markdown conversion quality across the tools. This matters for
   technical documentation and pricing comparison pages.

---

## Serendipity

**Scrapfly's anti-bot is best-in-class but output isn't markdown-native:** For
the /website-analysis skill, if analysis of heavily protected sites becomes a
requirement (Cloudflare-protected SaaS, enterprise sites), Scrapfly +
post-processing may be the only viable path. Worth keeping as a "fallback
extractor" option in the skill's architecture.

**Crawlee (Node.js, Apify):** The Apify SDK successor `crawlee` is a Node.js
universal scraping library that wraps Playwright, Puppeteer, and Cheerio under
one API. Not directly evaluated here but is worth noting for Node.js teams who
want the Crawl4AI-style unified interface in JS/TypeScript. Stars: 17k+.

**ReaderLM-v2 on HuggingFace:** Jina's ReaderLM-v2 (1.5B params) is available as
a standalone model on HuggingFace. This means the model powering Jina Reader can
be run locally, potentially enabling a fully self-hosted Jina-quality extraction
pipeline without the Jina Reader service at all — useful for air-gapped or
high-privacy deployments.

**FlareSolverr:** An open-source Docker-based Cloudflare bypass proxy
(`FlareSolverr/FlareSolverr` on GitHub) that can be layered in front of any
scraping tool. It provides a local anti-bot service that proxies requests
through a real browser session. Actively maintained as of 2025, per Scrapfly
blog. Could pair with Playwright + Readability to add Cloudflare resistance
without a paid API.

---

## Confidence Assessment

- HIGH claims: 7 (Firecrawl capabilities, Jina Reader API, Crawl4AI features,
  Playwright quality, Readability.js quality/limitations, Puppeteer deprecation,
  self-host feature gaps)
- MEDIUM claims: 4 (Scrapfly pricing, Crawl4AI anti-bot success rates,
  Playwright+Readability pipeline quality, SingleFile extraction limitations)
- LOW claims: 1 (Splash engine coverage on modern frameworks — confirmed
  deprecated status but no fresh failure benchmark cited)
- UNVERIFIED claims: 0
- Overall confidence: **HIGH** — All major claims backed by official
  documentation or multiple independent sources. Primary gaps are benchmark
  data, not capability claims.

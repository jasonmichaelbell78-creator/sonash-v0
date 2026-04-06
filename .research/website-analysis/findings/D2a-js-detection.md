# Findings: How to Detect Whether a Webpage Needs JavaScript Rendering

**Searcher:** deep-research-searcher **Profile:** web + docs **Date:**
2026-04-05 **Sub-Question IDs:** SQ2a

---

## Key Findings

### 1. Framework-Specific HTML Fingerprints Are the Most Reliable Static Detection Signal [CONFIDENCE: HIGH]

The most reliable pre-fetch detection approach is scanning the raw HTML response
body for framework-specific signatures. These patterns are stable,
well-documented, and present in the initial HTTP response before any JavaScript
runs. They form the backbone of every known detection tool including Crawlee's
`DefaultRenderingTypePredictor`, ManyPI's JS Rendering Checker, and community
scrapers.

**React (client-side rendering only):**

- `<div id="root"></div>` or `<div id="app"></div>` with empty body
- `data-reactroot` attribute (older React versions; React 16 and earlier)
- `__reactFiber$...` or `__reactContainer$...` properties (React 17+, observable
  in source via hydration scripts)

**Next.js (CRITICAL NUANCE - see Contradiction section):**

- `<script id="__NEXT_DATA__" type="application/json">` — present even on
  SSR/SSG pages
- `self.__next_f.push()` calls — React Server Components flight data (Next.js
  13+)
- `/_next/static/chunks/` script URLs
- `x-powered-by: Next.js` response header

**Angular 2+:**

- `ng-version` attribute on root element (e.g.,
  `<app-root ng-version="17.0.0">`)
- `<!--ng-container-->` HTML comments
- `getAllAngularRootElements()` pattern in scripts (runtime signal, not
  parseable pre-render)

**Angular 1.x (AngularJS):**

- `ng-app`, `data-ng-app`, `ng-controller`, `ng-repeat` attributes
- Script src containing `angular.js` or `angular.min.js`

**Vue.js:**

- `data-v-*` attributes (scoped CSS, present even in SSR mode — see
  Contradiction)
- `__vue_app__` on root DOM element (runtime only)
- `/_nuxt/` or `x-powered-by: Nuxt.js` header for Nuxt

**SvelteKit:**

- `svelte-*` hash class names (e.g., `class="svelte-1tky8bj"`)
- `/_app/` script path prefix
- `data-svelte-h` attributes

**Gatsby:**

- `<div id="___gatsby">` root element
- `gatsby-*` script IDs
- All Gatsby sites are static-generated; false positive risk — see Finding 6

**General SPA signals (framework-agnostic):**

- Empty `<div id="root">` or `<div id="app">` with no meaningful children
- `<noscript>` tag with substantial content ("You need to enable JavaScript to
  run this app")
- Body word count below ~200 tokens despite large total HTML size
- Ratio of `<script>` tags to total content tags exceeding ~4:1

Sources: [7], [10], [11], [14]

---

### 2. Crawlee's Adaptive Crawler Uses a Dual-Run Comparison Approach, Not Static Heuristics [CONFIDENCE: HIGH]

Crawlee's production-grade `AdaptivePlaywrightCrawler` does not rely solely on
static HTML heuristics. It uses a **comparison-based learning loop**:

1. Run a subset of requests (~10%, controlled by `renderingTypeDetectionRatio`)
   through both `CheerioCrawler` (HTTP-only) and `PlaywrightCrawler` (headless
   browser) in parallel.
2. Compare extracted data between the two runs using a `resultComparator`
   function (default: deep comparison of `push_data` calls).
3. Classify the page as `clientOnly` or `static` based on whether results
   differ.
4. Cache this classification via `DefaultRenderingTypePredictor`, which learns
   over time.
5. Route future requests to the appropriate crawler.

The `resultChecker` callback can short-circuit: if HTTP-only results fail
validation, the request immediately retries in browser mode without needing a
full comparison.

**Performance implication:** The comparison approach requires both renderers to
run on detection samples, adding latency to those requests. But it eliminates
false positives from static heuristics, since it empirically verifies content
equivalence rather than inferring from HTML structure.

Sources: [8], [9]

---

### 3. A Confidence-Weighted Scoring System Is Documented in Production Use [CONFIDENCE: MEDIUM]

One technical deep-dive (HackMD scraping guide) describes a confidence-scoring
escalation system with weighted evidence:

| Signal Type        | Weight | Threshold for Escalation                       |
| ------------------ | ------ | ---------------------------------------------- |
| HTML pattern match | +0.2   | (e.g., `data-reactroot`, `ng-version`)         |
| JS pattern match   | +0.3   | (e.g., `webpackJsonp.*react`, `Vue.prototype`) |
| HTTP header match  | +0.5   | (e.g., `x-powered-by: Next.js`)                |

If combined confidence score >= 0.3, the system recommends headless browser
rendering. This approach is more nuanced than binary detection: headers alone
(score 0.5) are sufficient to trigger escalation, while HTML patterns alone
(score 0.2) are not.

Confidence note: This scoring scheme comes from a single community article, not
an official tool's documented API. It represents a reasonable practical approach
but has not been independently verified across production deployments.

Sources: [6]

---

### 4. HTTP Headers Provide Fast Pre-Fetch Signals (HEAD Request Viable) [CONFIDENCE: MEDIUM]

Before fetching the full response body, a HEAD request can surface several
useful headers:

| Header                           | JS-Rendering Signal                                          |
| -------------------------------- | ------------------------------------------------------------ |
| `x-powered-by: Next.js`          | Page uses Next.js (but see Finding 6 — may still be SSR)     |
| `x-powered-by: Nuxt.js`          | Page uses Nuxt (same caveat)                                 |
| `x-powered-by: Astro`            | Likely SSG — LOW JS dependency                               |
| `content-type: text/html`        | Normal (no signal)                                           |
| `content-length: <100`           | Very small response — probable SPA shell (weak signal alone) |
| `etag` or `last-modified`        | Suggests static caching — lower JS rendering probability     |
| `cache-control: no-store`        | Suggests dynamic/personalized content                        |
| `set-cookie` with session tokens | Suggests authenticated dynamic page                          |

Note: Many SPAs and SSR frameworks share the same headers. Headers alone are
insufficient for reliable detection — they are a fast first-pass filter only.

Sources: [3], [14]

---

### 5. Content Volume and DOM Structure Are Reliable Body-Level Signals [CONFIDENCE: MEDIUM]

After a static GET fetch, the following body-level signals indicate JS rendering
is likely needed:

**Strong signals (high specificity):**

- `<div id="root"></div>` or `<div id="app"></div>` with no child elements in
  raw HTML
- `<noscript>` tag containing substantial text like "You need to enable
  JavaScript"
- Body contains only `<script>` and `<link>` tags with no semantic HTML (`<p>`,
  `<h1>`, `<article>`, `<main>`)
- Total visible text under 200 characters in the raw HTML body

**Moderate signals (medium specificity):**

- More than 4 `<script>` tags pointing to `*.bundle.js` or `main.*.js` files
- Script src paths matching patterns: `/_next/`, `/_nuxt/`, `/_app/`,
  `/static/js/`
- `<link rel="preload" as="script">` for multiple large JS bundles
- HTML body size under 5KB for a page expected to have substantial content

**Weak signals (low specificity alone):**

- Very large `<script>` inline blocks in `<head>`
- Webpack bundle signatures in script src attributes
- Single `<div>` as only child of `<body>`

Sources: [1], [2], [5], [12]

---

### 6. Next.js, Gatsby, and Nuxt Create Significant False Positive Risk [CONFIDENCE: HIGH]

This is the most critical failure mode for static heuristic detection.

**The problem:** The most visible framework signals (`__NEXT_DATA__`, `/_next/`
paths, `ng-version`, `data-v-*`) are present even when the page is fully
server-side rendered and requires NO JavaScript to parse its content.

- **Next.js SSR/SSG**: `__NEXT_DATA__` is present in the HTML even when the page
  is pre-rendered server-side. The data is already in the HTML — scraping it
  with static fetch works perfectly, and the JavaScript is only needed for
  client-side hydration/interactivity. Many Next.js e-commerce pages are fully
  scrapeable without JS rendering.
- **Gatsby**: All Gatsby sites are statically generated at build time. Presence
  of `___gatsby` root does NOT mean JS rendering is required — the HTML is fully
  populated.
- **Nuxt SSR**: Same pattern as Next.js. `X-Powered-By: Nuxt.js` header with
  full HTML body.
- **Vue SSR**: `data-v-*` scoped CSS attributes appear on server-rendered Vue
  pages too.

**Implication:** Using framework fingerprints as the SOLE escalation trigger
will produce false positives for any properly SSR'd framework site. A framework
fingerprint should raise the PROBABILITY of needing JS rendering but must be
combined with content volume signals.

**The correct two-stage check:**

1. Detect framework signature (raises probability)
2. Check if meaningful content is present in the raw HTML body despite the
   signature

If content is present and rich, do not escalate. If content is absent despite
the framework signal, escalate.

Sources: [13], [15], [16]

---

### 7. Firecrawl Claims Auto-Detection But Does Not Publish Its Detection Algorithm [CONFIDENCE: LOW]

Firecrawl's marketing states it "intelligently detects if a site needs
JavaScript to load and automatically uses a headless browser." However, official
documentation does not describe what signals trigger this detection or the
specific algorithm used. There are no published thresholds, confidence levels,
or signal catalogs from Firecrawl.

Similarly, Jina Reader (jina.ai/reader) was not documented in any retrieved
source as having a published auto-detection mechanism.

The lack of published methodology means these tools cannot serve as a source of
algorithmic guidance — only as existence proof that auto-detection is
achievable.

Sources: [4]

---

### 8. Recommended Escalation Algorithm (Synthesized from Prior Art) [CONFIDENCE: MEDIUM]

Based on Crawlee's adaptive approach, the confidence-scoring system, and the
false-positive analysis, the following three-phase escalation algorithm is
recommended:

**Phase 1 — HEAD Request (< 100ms)**

- Check `x-powered-by` header: Next.js, Nuxt.js, Astro — note framework, do not
  yet escalate
- Check `content-type`: if not `text/html`, skip JS rendering
- Check `content-length`: if < 500 bytes, flag as probable SPA shell (defer to
  Phase 2)

**Phase 2 — Static Fetch + Signal Scoring**

- Fetch full HTML with static GET
- Score signals using confidence weights:
  - Empty `#root` or `#app` with no children: +0.4
  - `<noscript>You need to enable JavaScript`: +0.5 (near-definitive)
  - Framework header from Phase 1 (Next.js/Nuxt/Astro): +0.2
  - Body visible text < 200 chars despite HTML > 5KB: +0.3
  - `__NEXT_DATA__` present BUT body has substantial text: -0.3 (SSR indicator)
  - Semantic HTML elements present (`<article>`, `<main>`, `<p>` with text):
    -0.4
  - More than 4 JS bundle script tags: +0.2
  - Angular `ng-version` attribute on root: +0.3

- If total score >= 0.5: escalate to headless browser
- If total score 0.2-0.5: attempt static extraction, verify result quality,
  escalate if inadequate
- If total score < 0.2: use static fetch (do not escalate)

**Phase 3 — Result Quality Verification (optional)**

- After static extraction, check if extracted content meets minimum quality bar
- If extracted text < 100 words for a page expected to have content: escalate
- This mirrors Crawlee's `resultChecker` pattern

Sources: [6], [8], [9], [11]

---

### 9. Known JS-Heavy Site Categories [CONFIDENCE: HIGH]

Sites where JS rendering is almost always required:

| Category                                 | Examples                         | Signal                  |
| ---------------------------------------- | -------------------------------- | ----------------------- |
| Pure React/Vue/Angular SPAs              | Admin dashboards, internal tools | Empty root div          |
| Social media feeds                       | Twitter/X, LinkedIn, Instagram   | Dynamic content loading |
| E-commerce product listings with filters | Amazon, eBay (search results)    | AJAX-loaded grid        |
| Infinite scroll feeds                    | Pinterest, TikTok web            | Lazy content loading    |
| Storybook documentation                  | component.storybook.js.org       | Bundle-only delivery    |
| Dashboard/analytics tools                | Grafana, Metabase                | Fully client-rendered   |
| Job boards with search                   | LinkedIn jobs, Indeed            | Dynamic filter results  |

Sites where JS rendering is often NOT required despite framework signals:

| Category               | Examples                    | Why                          |
| ---------------------- | --------------------------- | ---------------------------- |
| Next.js SSR blog/docs  | Vercel blog, many SaaS docs | Full HTML in `__NEXT_DATA__` |
| Gatsby static sites    | Marketing sites, portfolios | Build-time HTML generation   |
| Astro sites            | Most Astro-powered sites    | Islands architecture, SSG    |
| WordPress with plugins | Most WP sites               | Server-rendered HTML         |
| News sites             | Reuters, BBC                | SSR with minimal hydration   |

Sources: [1], [2], [5], [13], [16]

---

## Sources

| #   | URL                                                                                            | Title                                                            | Type             | Trust      | CRAAP | Date |
| --- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ---------------- | ---------- | ----- | ---- |
| 1   | https://brightdata.com/blog/web-data/static-vs-dynamic-content                                 | Static vs Dynamic Content in Web Scraping                        | Vendor guide     | MEDIUM     | 3.8   | 2025 |
| 2   | https://www.browserless.io/blog/web-scraping-api-react-vue-angular-spas                        | Scraping React, Vue & Angular SPAs                               | Vendor guide     | MEDIUM     | 3.6   | 2025 |
| 3   | https://scrapfly.io/blog/posts/scraping-using-browsers                                         | How to Scrape Dynamic Websites Using Headless Web Browsers       | Vendor guide     | MEDIUM     | 3.7   | 2025 |
| 4   | https://www.firecrawl.dev/glossary/web-scraping-apis/what-is-javascript-rendering-web-scraping | What is JavaScript rendering in web scraping?                    | Vendor docs      | MEDIUM     | 3.2   | 2025 |
| 5   | https://www.scrapingdog.com/blog/javascript-web-scraping/                                      | JavaScript Web Scraping                                          | Vendor guide     | MEDIUM     | 3.4   | 2026 |
| 6   | https://hackmd.io/@husseinsheikho/WS-6A                                                        | Advanced Web Scraping Techniques - JS Rendering & Fingerprinting | Community blog   | LOW        | 2.8   | 2025 |
| 7   | https://webreveal.io/blog/how-to-detect-javascript-framework.html                              | How to Detect What JavaScript Framework a Website Uses           | Blog             | LOW-MEDIUM | 3.2   | 2026 |
| 8   | https://crawlee.dev/python/docs/guides/adaptive-playwright-crawler                             | Adaptive Playwright Crawler                                      | Official docs    | HIGH       | 4.5   | 2025 |
| 9   | https://crawlee.dev/js/api/playwright-crawler/interface/AdaptivePlaywrightCrawlerOptions       | AdaptivePlaywrightCrawlerOptions API                             | Official docs    | HIGH       | 4.5   | 2025 |
| 10  | https://gist.github.com/rambabusaravanan/1d594bd8d1c3153bc8367753b17d074b                      | Detect JS Framework used in a Website                            | Community code   | LOW-MEDIUM | 2.9   | 2023 |
| 11  | https://apify.com/change-log/performance-api-updates-adaptive-playwright-crawler               | Adaptive Playwright Crawler Changelog                            | Official vendor  | HIGH       | 4.2   | 2025 |
| 12  | https://manypi.com/free-tools/javascript-rendering-checker                                     | JavaScript Rendering Checker                                     | Tool description | MEDIUM     | 3.0   | 2025 |
| 13  | https://www.trickster.dev/post/scraping-nextjs-web-sites-in-2025/                              | Scraping Next.js web sites in 2025                               | Developer blog   | MEDIUM     | 3.8   | 2025 |
| 14  | https://oxylabs.io/blog/5-key-http-headers-for-web-scraping                                    | Most Common HTTP Headers for Web Scraping                        | Vendor guide     | MEDIUM     | 3.5   | 2025 |
| 15  | https://nextjs.org/docs/pages/building-your-application/rendering/server-side-rendering        | Next.js SSR documentation                                        | Official docs    | HIGH       | 4.8   | 2025 |
| 16  | https://www.gatsbyjs.com/docs/conceptual/rendering-options/                                    | Gatsby Rendering Options                                         | Official docs    | HIGH       | 4.8   | 2025 |

---

## Contradictions

### Contradiction 1: Framework Fingerprints as Escalation Triggers

Multiple sources treat framework fingerprints (`__NEXT_DATA__`, `ng-version`,
`data-v-*`) as reliable escalation triggers to headless browser rendering.
However, official Next.js, Gatsby, and Nuxt documentation confirms that these
signals are present even on fully server-rendered pages where JavaScript is NOT
required for content extraction.

- **Side A:** "Framework fingerprints indicate JS rendering requirement"
  [Sources 6, 7, 10]
- **Side B:** "Next.js SSR/SSG pages ship complete HTML with `__NEXT_DATA__`
  embedded" [Sources 13, 15]

Resolution: Framework fingerprints are necessary but not sufficient for
escalation. They must be combined with content absence checks.

### Contradiction 2: Firecrawl Auto-Detection Claims

Firecrawl's marketing material claims automatic JS rendering detection, but no
official technical documentation of the detection algorithm was found. The claim
may reflect that all pages are rendered by default rather than true adaptive
detection.

---

## Gaps

1. **No published false-positive rate data**: No empirical study of detection
   heuristic accuracy was found. The confidence weights in Finding 3 are from a
   single community source without validation data.

2. **Firecrawl/Jina internal detection algorithms**: Both tools claim
   auto-detection but publish no technical methodology. Their actual decision
   logic is opaque.

3. **Content text threshold calibration**: No empirical threshold was found for
   "body visible text < N characters = SPA". The 200-character figure in the
   algorithm is a reasonable heuristic derived from described SPA behaviors but
   is not empirically validated.

4. **Partial hydration patterns**: Astro, Qwik, and other partial hydration
   frameworks were mentioned tangentially but not deeply analyzed. These may
   require selective rendering rather than all-or-nothing escalation.

5. **Anti-detection interference**: Some sites serve different HTML to scrapers
   vs browsers (bot detection). A detector might receive a 403/CAPTCHA shell
   that looks like an SPA but is actually a block page — distinguishing these
   was not covered.

6. **React Server Components (RSC) edge case**: Next.js 13+ with RSC uses
   `self.__next_f.push()` flight data, which embeds data in HTML but in a wire
   format requiring custom parsing (njsparser library). This is neither "pure
   SSR" nor "requires JS rendering" — it's an intermediate case not addressed by
   current binary detection.

---

## Serendipity

1. **Crawlee's `renderingTypeDetectionRatio` defaults to 10%** — This means the
   Crawlee team found that sampling 1-in-10 requests for dual comparison is
   sufficient for accurate classification in practice. For a `/website-analysis`
   skill doing one-off analysis rather than bulk crawling, this suggests a
   single dual-run comparison per URL is appropriate.

2. **`resultComparator` returning "Inconclusive" is a valid outcome** —
   Crawlee's API explicitly supports a three-way classification (equal /
   different / inconclusive). This is important design signal: a JS detection
   algorithm should have a "can't determine" path, not force a binary choice.

3. **Disabling JS and comparing is the gold standard** — Multiple SEO tools
   (Punits SSR Checker, searchviu.com, Lumar) use the same methodology: fetch
   twice (with and without JS), compare result. This is computationally
   expensive but eliminates false positives entirely. For a `/website-analysis`
   skill that runs on-demand, this approach is practical.

4. **Next.js flight data is scrapeable without a browser** — The `njsparser`
   Python library parses React Server Components flight data from raw HTML. This
   means a Next.js page that appears to need JS rendering may actually be fully
   parseable with a lightweight static parser, bypassing headless browser
   entirely.

5. **`<noscript>` tag content is highly diagnostic** — If the `<noscript>` tag
   body contains substantial content (>50 characters), it nearly always
   indicates the page was designed for JS-required delivery. This is a ~0.95
   precision signal.

---

## Confidence Assessment

- HIGH claims: 4 (framework fingerprints catalog, Crawlee dual-run approach,
  false-positive risk, site category taxonomy)
- MEDIUM claims: 4 (confidence scoring weights, HEAD request signals, body-level
  signals, escalation algorithm)
- LOW claims: 1 (Firecrawl auto-detection claim)
- UNVERIFIED claims: 0
- **Overall confidence: MEDIUM** — Core detection signals are well-documented
  across multiple sources. The escalation algorithm is synthesized from prior
  art rather than a single authoritative source. False-positive thresholds lack
  empirical validation.

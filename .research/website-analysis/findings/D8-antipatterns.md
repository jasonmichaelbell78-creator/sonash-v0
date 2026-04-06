# Findings: Website Anti-Patterns, Absence Patterns, and Long-Tail Bias Mitigation

**Searcher:** deep-research-searcher **Profile:** web **Date:** 2026-04-05
**Sub-Question IDs:** SQ8

---

## Key Findings

### PART 1: Absence Patterns — Site Types Where Standard Analysis Does Not Apply

---

1. **DEAD_BLOG: Dormant Sites With Stale Content** [CONFIDENCE: HIGH]

   A dead blog is identifiable through a combination of temporal, structural,
   and behavioral signals. The HTTP `Last-Modified` response header is a direct
   machine-readable signal — if absent or dated 2+ years prior, staleness is
   confirmed [1]. Copyright footer years are a fast heuristic: a footer reading
   "© 2019" with no update is a strong dead-blog indicator, though copyright
   year staleness can lag behind genuine activity and should not be used alone.

   **Detection signals (Quick Scan viable):**
   - Most-recent post date visible in HTML (often in `<time datetime="...">`
     attributes or article schema `datePublished`)
   - HTTP `Last-Modified` header > 24 months stale
   - Footer copyright year static and old
   - RSS/Atom feed `<lastBuildDate>` or `<pubDate>` showing stale entries
   - Comments section shows "comments closed" or comment plugin removed (Disqus
     widget absent after previously referenced)
   - High 404 rate on internal links (signals link rot without maintenance)

   **Analysis adjustment:** Index for historical/archival value only. Do not
   evaluate as current authority. Flag as `ARCHIVAL` tier. Creator-value may
   still be HIGH for historical research, technical retrospectives, or niche
   documentation.

   **Creator-value assessment:** MEDIUM. The content may be highly valuable for
   historical context or niche knowledge. Do not discard — classify separately.
   A 2017 post on obscure POSIX behavior may be the best source on the web.

   **False positive risk:** A deliberately minimal writer who publishes once per
   year but produces high-quality work. Mitigate by checking post length and
   depth, not just frequency.

---

2. **VENDOR_BROCHURE: Marketing-Only Sites With No Substantive Content**
   [CONFIDENCE: HIGH]

   Vendor brochure sites are passive presentation sites focused on company
   information rather than knowledge transfer [2]. The structural distinction
   from substantive sites is identifiable at the DOM level.

   **Detection signals (Quick Scan viable):**
   - High CTA density: multiple `<button>`, `<a class="cta">`, or
     `href="/contact"` / `href="/demo"` elements relative to content blocks
   - Form count > 2 on landing page (contact, newsletter, demo-request forms)
   - Absence of blog, documentation, or `/learn` sections in site navigation
   - Text pattern: heavy use of "solutions," "enterprise," "transform,"
     "leverage," "ROI-driven" language without technical specifics
   - Schema type `Organization` dominant; absence of `Article`, `BlogPosting`,
     or `HowTo` schema
   - Word count of main body text under 300 words with high image/graphic ratio
   - No date-stamped content anywhere on the site
   - Social proof elements (logos, testimonials) outweigh content elements

   **Analysis adjustment:** Classify as `VENDOR_BROCHURE`. Skip for knowledge
   extraction. Useful only for: competitor intelligence, identifying the product
   being marketed. Creator-value: VERY LOW for knowledge extraction.

   **Creator-value assessment:** LOW. These sites exist to sell, not inform.
   Penalize heavily in knowledge-density scoring.

---

3. **SPA_SHELL: JavaScript-Rendered Empty HTML** [CONFIDENCE: HIGH]

   SPA shells return minimal initial HTML: typically an empty
   `<div id="root"></div>` and multiple `<script>` tags. AI crawlers (GPTBot,
   ClaudeBot, PerplexityBot) that do not execute JavaScript see literally
   nothing [3]. This is a binary classification — either content is in the
   initial HTTP response or it is not.

   **Detection signals (Quick Scan viable — single HTTP GET):**
   - Initial HTML response body under 5KB of visible text
   - Presence of `<div id="root">`, `<div id="app">`, `<div id="__next">` as
     primary DOM containers with no children in static HTML
   - Multiple `<script src="...bundle.js">` or `<script src="...chunk.js">` tags
   - Absence of meaningful `<h1>`, `<p>`, `<article>` elements in static HTML
   - `<noscript>` element present with "You need JavaScript enabled" messaging
   - URL fragment-based routing: `example.com/#/page` patterns
   - Single URL returned when crawling without JS rendering vs. many URLs with
     JS enabled [3]
   - `Content-Type: application/javascript` dominant in page resources;
     text/html minimal

   **Analysis adjustment:** Require a JavaScript-capable crawl
   (Playwright/Puppeteer). If not available, mark as `SPA_SHELL_UNANALYZABLE` —
   do not penalize for missing content that simply wasn't rendered.
   Creator-value is unknowable without JS execution.

   **Creator-value assessment:** INDETERMINATE without JS rendering. Flag for
   second-pass crawl rather than assuming low value.

   **False positive risk:** Next.js or Nuxt sites with SSR will have full HTML
   on initial response — do not classify as SPA_SHELL if substantial content
   exists in first HTTP response.

---

4. **PAYWALLED: Content Behind Authentication or Payment Wall** [CONFIDENCE:
   HIGH]

   Google's own structured data specification documents the signals used to
   identify paywalled content [4]. Two distinct paywall types require different
   detection approaches.

   **Detection signals (Quick Scan viable):**

   _Server-side paywall (hard wall):_
   - HTTP 401/403 response on article URLs
   - Redirect to `/login` or `/subscribe` on article access
   - Minimal body content with login form prominent
   - Schema.org `"isAccessibleForFree": false` in JSON-LD
   - `NewsArticle` or `Article` schema with `hasPart` containing
     `cssSelector: ".paywall"`

   _Client-side paywall (soft wall):_
   - Article text truncates at fixed point (e.g., first 3 paragraphs) followed
     by `.paywall` div
   - Modal overlay with `position: fixed; z-index: 9999` and high opacity
     blocking viewport
   - Text nodes present but obscured (detectable by counting visible vs. total
     text nodes)
   - Cookie-jar crawl reveals more content than fresh-session crawl [5]
   - Presence of `<meta name="robots" content="...">` with paywall-aware
     directives

   **Analysis adjustment:** Mark as `PAYWALLED`. Extract only the freely
   available teaser content. Do not score on content quality what cannot be
   read. Creator-value: UNKNOWABLE without access.

   **Creator-value assessment:** Cannot assess. Flag as requiring privileged
   access. Do not penalize — paywalled content is often high-value (journalism,
   academic journals).

---

5. **CAPTIVE_JS: Content Revealed Only Through User Interaction** [CONFIDENCE:
   HIGH]

   Infinite scroll and "load more" button patterns require simulated user
   interaction to reveal content. Standard HTTP crawls return only the first
   batch of items [6].

   **Detection signals (requires JavaScript execution to confirm):**
   - Network tab shows XHR/Fetch requests triggered by scroll events
     (Intersection Observer API usage)
   - DOM mutations on scroll detected via MutationObserver
   - Absence of traditional pagination links (`<a href="?page=2">`) despite
     large content sets
   - "Load More" button (`<button>` with text matching /load more|show more|see
     more/i) present
   - URL does not change during content loading (no pushState navigation)
   - Quick Scan heuristic: if page claims N items but HTML contains far fewer,
     suspect captive JS

   **Analysis adjustment:** Require interaction simulation. Mark as
   `CAPTIVE_JS_PARTIAL` if only first batch is analyzed. Social networks,
   Pinterest-style galleries, and e-commerce category pages commonly exhibit
   this pattern.

   **Creator-value assessment:** Neutral — captive JS is an implementation
   choice, not a quality indicator. Pinterest has high creator value.
   Infinite-scroll news aggregators may have low value.

---

6. **AGGREGATOR: Syndicated Content Without Original Material** [CONFIDENCE:
   HIGH]

   Aggregator sites republish content from other sources. The key signal is the
   `rel=canonical` pointing away from the current domain to the original
   publisher [7].

   **Detection signals (Quick Scan viable):**
   - `<link rel="canonical" href="https://different-domain.com/...">` pointing
     to external site
   - HTTP `Link: <https://original.com>; rel="canonical"` header
   - RSS feed content matching verbatim text from other domains
   - Attribution text patterns: "Originally published at...", "Via...",
     "Cross-posted from..."
   - Author bylines linking to external domains
   - High density of `<blockquote>` elements containing entire articles
   - Domain registered recently but content dated years prior (date mismatch)

   **Analysis adjustment:** Extract original source URL from canonical. Redirect
   analysis to original source. Do not score aggregated content as if it were
   original. Note aggregator as a signal of where original content lives.

   **Creator-value assessment:** LOW for the aggregator domain itself. May be
   useful as a discovery mechanism pointing to high-value original sources.

---

7. **LINK_FARM: SEO-Driven Thin Content With Excessive Outbound Links**
   [CONFIDENCE: HIGH]

   Link farms are identifiable by the disproportionate ratio of outbound links
   to original content [8]. Boilerplate detection research confirms that "high
   rate of linked words" is a core noise signal [9].

   **Detection signals (Quick Scan viable):**
   - Anchor text density (anchor words / total words) above 40% on
     non-navigation pages
   - Hundreds of outbound links to unrelated domains on a single page
   - Keyword-stuffed anchor text: multiple links with identical or
     near-identical anchor text
   - Thin paragraph structure: 1-2 sentences per paragraph, no depth
   - Generic or cookie-cutter site template with minimal differentiation
   - Absence of About page, Contact page, or identifiable authorship
   - Domain: many hyphenated keywords in domain name
   - Content duplicated across multiple pages with minor keyword substitution

   **Analysis adjustment:** Mark as `LINK_FARM`. Skip content analysis. May be
   useful for discovering what domains the farm links to (reverse-engineer as
   discovery tool).

   **Creator-value assessment:** VERY LOW to NEGATIVE. Link farms pollute crawl
   queues.

---

8. **GENERATED_CONTENT: AI-Spun or Automated Content** [CONFIDENCE: MEDIUM]

   AI-generated content detection is imperfect but several signals are emerging,
   including a proposed IETF "AI Content Disclosure Header" (September 2025) and
   EU AI Act watermarking requirements (March 2025) [10].

   **Detection signals (Quick Scan viable for heuristics; NLP analysis for
   confirmation):**
   - Uniform sentence length distribution (low "burstiness" — LLM output has
     less length variation than human writing)
   - High perplexity uniformity (predictable token patterns)
   - Absence of personal pronouns, first-hand experience language
   - No typos, idiosyncratic phrasing, or stylistic variation across posts
   - Content published at machine-like velocity (100+ articles per day)
   - `X-AI-Content: true` HTTP header (proposed IETF standard, late 2025)
   - EU AI Act compliance metadata in HTML head (applicable to EU-distributed
     content)
   - Author attribution absent or generic ("Staff Writer," "Admin," "Editorial
     Team")
   - All posts same length, same structure, same section headings pattern

   **Analysis adjustment:** Mark as `GENERATED_CONTENT_SUSPECTED`. Reduce
   confidence in factual claims. Do not cite as authoritative. Useful for trend
   detection but not knowledge extraction.

   **Creator-value assessment:** LOW. Automated content lacks the first-hand
   experience and novel synthesis that makes content valuable to creators.

   **False positive risk:** HIGH. Legitimate professional writers may be
   consistent and clean. Do not penalize polished writing alone. Require
   multiple corroborating signals.

---

9. **CURATED_LIST_WEB: Awesome-List Equivalent on the Web** [CONFIDENCE: MEDIUM]

   Web-based curated lists (analogous to GitHub `awesome-*` repos) are
   high-link-density, low-original-content pages. Unlike link farms, these are
   intentional and often high-quality curation.

   **Detection signals (Quick Scan viable):**
   - Page structure: hierarchical headers (`<h2>`, `<h3>`) followed by dense
     link lists
   - Anchor text density extremely high (60-80% of words are linked)
   - Title patterns: "Best X tools," "Ultimate list of Y," "Awesome Z"
   - No authored prose sections; primarily link + one-sentence description
     pattern
   - Schema type `ItemList` or equivalent
   - Section count high, content-per-section low

   **Analysis adjustment:** Treat as a discovery resource, not a content source.
   Extract the linked URLs for further analysis. Do not penalize — curated lists
   ARE the content. Creator-value for the list itself: LOW. Creator-value as
   discovery tool: HIGH.

   **Creator-value assessment:** LOW for the page itself. HIGH as a pointer to
   substantive resources.

---

10. **REGISTRY: Directory or Marketplace Where Links Are the Content**
    [CONFIDENCE: MEDIUM]

    Plugin directories, API registries, tool catalogs, and package marketplaces
    have a structural pattern where the link/listing IS the content — there is
    no original prose to extract.

    **Detection signals (Quick Scan viable):**
    - Repeating card/listing template: `<div class="listing">` or
      `<article class="plugin">` repeated N times
    - Each card: title, brief description (1-3 sentences), install count,
      rating, link
    - URL patterns: `/plugins/`, `/packages/`, `/marketplace/`, `/directory/`,
      `/catalog/`
    - Schema types: `SoftwareApplication`, `Product`, `ItemList`
    - Search/filter UI prominent (faceted navigation)
    - No long-form content; pagination through hundreds of identical-template
      cards

    **Analysis adjustment:** Extract the listed items as a dataset, not the page
    as content. Useful for discovering what tools/plugins exist. Score each
    listed item separately if needed.

    **Creator-value assessment:** HIGH as structured data source. LOW as prose
    content source. Do not apply content-quality scoring — apply dataset-quality
    scoring instead.

---

### PART 2: Anti-Patterns That Signal Low Value

---

11. **Cookie Consent Wall Covering Viewport** [CONFIDENCE: HIGH]

    Google's Interstitial Penalty guidelines specify that elements covering
    "most or all" of page content on initial load from search are penalized
    [11]. The recommended maximum is 15% of screen space. UK ICO is deploying AI
    tools to automatically detect non-compliant cookie banners.

    **Detection signals:**
    - Element with `position: fixed; z-index: 9999` (or similar high z-index)
    - Width/height covering >30% of viewport (30% is Google's informal penalty
      trigger threshold based on Smashing Magazine analysis [11])
    - `display: block` before user interaction (not hidden by default)
    - Body scroll disabled via `overflow: hidden` on `<body>`
    - Known cookie consent library class names: `.cc-window`, `.cookieconsent`,
      `.CookieBanner`, `#onetrust-banner-sdk`

    **Impact on analysis:** Cookie banner content is boilerplate, not meaningful
    content. Subtract from content area in content-to-chrome calculations.

---

12. **Auto-Playing Media** [CONFIDENCE: MEDIUM]

    **Detection signals:**
    - `<video autoplay>` or `<audio autoplay>` elements in HTML
    - JavaScript `video.play()` calls on DOMContentLoaded
    - `<iframe>` embeds with `?autoplay=1` parameters (YouTube, Vimeo)

    **Impact:** Signals low editorial judgment. Not disqualifying alone but adds
    to anti-pattern score.

---

13. **Newsletter Popup Within 3 Seconds** [CONFIDENCE: MEDIUM]

    **Detection signals:**
    - JavaScript timers (`setTimeout`) with delays under 3000ms triggering modal
      shows
    - Modal elements with email input forms hidden at load and shown after short
      delay
    - Exit-intent scripts (though these fire on mouse-out, not time-based)

    **Impact:** Low-severity anti-pattern. Common on legitimate sites. Do not
    penalize heavily.

---

14. **More Ads Than Content** [CONFIDENCE: MEDIUM]

    **Detection signals:**
    - `<iframe>` or `<ins class="adsbygoogle">` count exceeds content paragraph
      count
    - Google AdSense, Media.net, or ad network script presence with multiple ad
      units
    - Text-to-HTML ratio below 10% (industry benchmark: >25% is healthy, 10-25%
      acceptable) [12]
    - Ad placeholder divs (`data-ad-slot`, `data-ad-unit`) outnumber content
      blocks

    **Quantitative thresholds from research:**
    - Text-to-HTML ratio under 10%: HIGH spam risk
    - Text-to-HTML ratio 10-25%: MEDIUM concern, verify manually
    - Text-to-HTML ratio above 25%: ACCEPTABLE baseline

---

15. **Clickbait Title Patterns** [CONFIDENCE: HIGH]

    Research (Nature Scientific Reports, 2025) shows RoBERTa-Large achieves 97%
    accuracy in clickbait classification [13]. Key linguistic signals are
    well-established:

    **Detection signals:**
    - Uppercase ratio correlation coefficient 0.9 with clickbait classification
      [13]
    - Headlines starting with 5W1H words (What, Why, When, Who, Which, How) at
      higher frequency
    - Sensational vocabulary: "shocking," "amazing," "secret," "you won't
      believe"
    - Headline length 10+ words (primarily clickbaity range)
    - Question marks and exclamation marks in headlines
    - Numbers with emotional framing: "13 Shocking Reasons..."
    - Absent: proper nouns, institutional names, factual verbs ("reports,"
      "announces," "study")

    **Impact on analysis:** Clickbait signals low editorial integrity.
    Correlates with thin content.

---

16. **SEO-Stuffed Content** [CONFIDENCE: HIGH]

    **Detection signals:**
    - Keyword density for single term above 3-4% of total words
    - Repeated near-identical phrases with synonym substitutions
    - Thin paragraphs: average paragraph word count under 40 words
    - Heading structure: H2/H3 headers matching exact keyword phrases repeatedly
    - Internal links with keyword-matched anchor text exceeding 20% of total
      links
    - Absence of first-person writing, specific examples, or original data

---

17. **Content-to-Chrome Ratio** [CONFIDENCE: MEDIUM]

    Nielsen Norman Group defines content-to-chrome ratio as the proportion of
    screen dedicated to actual content vs. navigation, ads, headers, and footers
    [14]. No universal threshold exists — it's device and context dependent.

    **Practical detection approach:**
    - DOM surface area: count total characters in boilerplate zones (nav,
      header, footer, sidebar, ad containers) vs. main content zone
    - Boilerplate libraries (jusText, Trafilatura) effectively separate these
      zones algorithmically [15]
    - Low quality signal: boilerplate text exceeds main content text by 2:1 or
      greater

---

### PART 3: Long-Tail Bias Mitigation

---

18. **Academic Search Engine Bias Against Low-Citation Work** [CONFIDENCE: HIGH]

    Research confirms systematic bias in both Google Scholar and Semantic
    Scholar against low-citation papers, early-career researchers, non-English
    content, and researchers in smaller communities [16]. Google Scholar
    relegates non-English papers to near-invisibility (0.2% vs. 3.2% expected
    representation in top 20 results). Semantic Scholar shows fewer disparities
    than Google Scholar overall [16].

    **Implication for web analysis:** Citation-count analogies (social shares,
    backlinks) as quality proxies systematically disadvantage valid high-quality
    content from niche or independent sources. The same bias exists when
    treating site traffic, domain authority, or inbound link count as quality
    proxies.

---

19. **Positive Signals for Hidden Gem Sites** [CONFIDENCE: MEDIUM]

    Low-traffic, high-quality sites tend to exhibit a distinct profile that
    diverges from commercial content sites. Evidence drawn from indie web
    research and E-E-A-T documentation [17, 18]:

    **Positive "hidden gem" signals:**
    - **Lexical density above 50%**: Academic and technical writing has higher
      proportions of content words (nouns, verbs, adjectives) vs. function
      words. Measurable via NLP tokenization [19].
    - **First-hand experience language**: "I tested," "In my experience," "We
      measured," "I found that" — Google's own HCU documentation lists these as
      high-quality signals [18].
    - **Specific technical depth**: Named tools, version numbers, error
      messages, code snippets, benchmarks — signals actual hands-on work rather
      than aggregated summaries.
    - **Idiosyncratic design**: Non-template layout, personal aesthetic choices,
      absence of commercial design patterns (indie web research [17]).
    - **No monetization signals**: Absence of AdSense, affiliate disclosure,
      "Best X" listicles, or lead-gen forms.
    - **Low SEO optimization**: No keyword stuffing, natural language titles,
      absence of meta description stuffing, no exact-match anchor text.
    - **Community participation markers**: Webring membership, IndieWeb
      `<link rel="me">` tags, Mastodon/Fediverse verification links.
    - **Domain age with sparse content**: Old domain, few posts, long posts —
      signals deliberate, thoughtful writing over volume.
    - **External links to primary sources**: Linking to research papers,
      official docs, original data rather than other blog posts.

---

20. **How to Avoid Penalizing Low-Polish Sites** [CONFIDENCE: MEDIUM]

    The core principle: presentation quality and content quality are orthogonal.
    Evidence from Google's E-E-A-T framework and indie web research supports
    separating these dimensions.

    **Do NOT penalize:**
    - No analytics scripts (absence of GA/GTM/Plausible — signals privacy
      preference, not lack of seriousness)
    - Plain or dated design (HTML-only blogs, minimal CSS, no JavaScript
      frameworks)
    - No social media sharing buttons
    - No author photo or formal bio page
    - Low visitor count (entirely unknown to analysis without traffic data
      access)
    - Single-author focus without institutional affiliation
    - Infrequent publishing schedule

    **Weighting strategy:** Weight content substance over presentation using a
    two-axis model:
    - Axis 1: Content substance score (lexical density, technical depth,
      first-hand signals, original data)
    - Axis 2: Presentation/trust score (design, author info, social proof,
      monetization absence)

    Only Axis 1 should influence creator-value rating. Axis 2 should influence
    trust calibration (e.g., how much to trust factual claims) but not penalize
    content quality.

---

21. **Lexical Density as a Knowledge-Density Proxy** [CONFIDENCE: MEDIUM]

    Lexical density measures the proportion of content words (nouns, verbs,
    adjectives, adverbs) to total words. Academic and technical texts have high
    lexical density; casual/conversational texts have lower density [19].
    - **High lexical density (>55%)**: Technical documentation, academic
      writing, expert analysis
    - **Medium lexical density (40-55%)**: General-purpose journalism, blog
      posts
    - **Low lexical density (<40%)**: Conversational content, marketing copy,
      thin content

    This metric is computable from extracted text without requiring traffic
    data, backlink counts, or social signals — making it useful for evaluating
    sites where external quality signals are absent.

---

22. **Detection Methodology Summary: Quick Scan vs. Deep Crawl Capabilities**
    [CONFIDENCE: HIGH]

    | Pattern           | Quick Scan (single fetch)       | Requires JS execution   | Requires crawling |
    | ----------------- | ------------------------------- | ----------------------- | ----------------- |
    | DEAD_BLOG         | Yes (Last-Modified, post dates) | No                      | No                |
    | VENDOR_BROCHURE   | Yes (form count, CTA density)   | No                      | No                |
    | SPA_SHELL         | Yes (empty HTML body)           | To confirm content      | No                |
    | PAYWALLED (hard)  | Yes (401/403, redirect)         | No                      | No                |
    | PAYWALLED (soft)  | Yes (overlay CSS, schema)       | Cookie jar comparison   | No                |
    | CAPTIVE_JS        | Partial (first batch only)      | Yes (scroll simulation) | No                |
    | AGGREGATOR        | Yes (canonical tag)             | No                      | No                |
    | LINK_FARM         | Yes (anchor density)            | No                      | No                |
    | GENERATED_CONTENT | Partial (NLP heuristics)        | No                      | No                |
    | CURATED_LIST_WEB  | Yes (link density, structure)   | No                      | No                |
    | REGISTRY          | Yes (card template pattern)     | No                      | No                |

---

23. **False Positive Rates and Common Misclassifications** [CONFIDENCE: MEDIUM]

    | Pattern           | Common False Positive                      | Mitigation                                              |
    | ----------------- | ------------------------------------------ | ------------------------------------------------------- |
    | DEAD_BLOG         | Low-frequency expert writer                | Check post length and depth, not just frequency         |
    | VENDOR_BROCHURE   | Product documentation site                 | Check for `/docs`, technical content sections           |
    | SPA_SHELL         | Next.js SSR site with full initial HTML    | Verify content length in static response                |
    | GENERATED_CONTENT | Polished professional writer               | Require multiple corroborating signals                  |
    | LINK_FARM         | Curated awesome-list                       | Check if links are annotated with original descriptions |
    | AGGREGATOR        | Cross-posting with canonical to own domain | Verify canonical points to same site or different       |
    | CURATED_LIST_WEB  | Resource page within larger site           | Classify at page level, not site level                  |

---

## Sources

| #   | URL                                                                                                                       | Title                                                                                      | Type                                       | Trust       | CRAAP           | Date                                    |
| --- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------ | ----------- | --------------- | --------------------------------------- |
| 1   | https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Last-Modified                                         | Last-Modified header - MDN Web Docs                                                        | Official docs                              | HIGH        | 5/5/5/5/5 = 5.0 | 2025                                    |
| 2   | https://fluxedigitalmarketing.com/difference-between-brochure-website-lead-generation-website/                            | The Difference Between A Brochure Website & A Lead Generation Website                      | Community blog                             | MEDIUM      | 3/4/3/3/3 = 3.2 | 2024                                    |
| 3   | https://www.getpassionfruit.com/blog/javascript-rendering-and-ai-crawlers-can-llms-read-your-spa                          | JavaScript Rendering and AI Crawlers: Can LLMs Read Your SPA?                              | Community blog                             | MEDIUM      | 4/5/3/4/4 = 4.0 | 2026                                    |
| 4   | https://developers.google.com/search/docs/appearance/structured-data/paywalled-content                                    | Subscription and Paywalled Content Markup - Google Search Central                          | Official docs                              | HIGH        | 5/5/5/5/5 = 5.0 | 2025                                    |
| 5   | https://dl.acm.org/doi/fullHtml/10.1145/3366423.3380217                                                                   | Keeping out the Masses: Understanding the Popularity and Implications of Internet Paywalls | Academic paper                             | HIGH        | 5/4/5/5/4 = 4.6 | 2020                                    |
| 6   | https://www.searchenginejournal.com/how-google-crawls-pages-with-infinite-scrolling/439008/                               | How Google Crawls Pages With Infinite Scrolling                                            | Industry authority                         | MEDIUM-HIGH | 4/5/4/4/4 = 4.2 | 2024                                    |
| 7   | https://yoast.com/rel-canonical/                                                                                          | rel=canonical tag: the ultimate guide to canonical URLs                                    | Industry authority                         | MEDIUM-HIGH | 4/5/4/4/4 = 4.2 | 2025                                    |
| 8   | https://editorial.link/link-farm/                                                                                         | Link Farming: SEO Hack or Hidden Trap?                                                     | Community blog                             | MEDIUM      | 3/4/3/3/3 = 3.2 | 2026                                    |
| 9   | https://medecau.com/notes-on-boilerplate-detection-using-shallow-text-features/                                           | Notes on Boilerplate Detection Using Shallow Text Features                                 | Research notes                             | MEDIUM      | 4/4/4/4/4 = 4.0 | 2023                                    |
| 10  | https://wellows.com/blog/ai-detection-trends/                                                                             | AI Content Detection in 2025: Trends to Watch                                              | Community blog                             | MEDIUM      | 3/4/3/3/3 = 3.2 | 2025                                    |
| 11  | https://www.smashingmagazine.com/2017/05/intrusive-interstitials-guidelines-avoid-google-penalty/                         | Intrusive Interstitials: Guidelines To Avoiding Google's Penalty                           | Industry authority                         | MEDIUM-HIGH | 4/5/4/4/5 = 4.4 | 2017 (still cited as current by Google) |
| 12  | https://www.clickrank.ai/seo-academy/on-page-optimization/text-to-html-ratio/                                             | Text to HTML Ratio: Does It Matter for SEO in 2025?                                        | Community blog                             | MEDIUM      | 3/4/3/3/3 = 3.2 | 2025                                    |
| 13  | https://www.nature.com/articles/s41598-025-30229-5                                                                        | Clickbait detection in news headlines using RoBERTa-Large                                  | Academic paper (Nature Scientific Reports) | HIGH        | 5/4/5/5/5 = 4.8 | 2025                                    |
| 14  | https://www.nngroup.com/articles/content-chrome-ratio/                                                                    | Maximize Content-to-Chrome Ratio - Nielsen Norman Group                                    | Official/authoritative                     | HIGH        | 5/5/5/5/5 = 5.0 | 2023                                    |
| 15  | https://github.com/miso-belica/jusText                                                                                    | jusText: Heuristic based boilerplate removal tool                                          | Open source tool                           | HIGH        | 5/5/4/5/5 = 4.8 | Active                                  |
| 16  | https://firstmonday.org/ojs/index.php/fm/article/view/13730/11709                                                         | Examining bias perpetuation in academic search engines                                     | Academic paper (First Monday)              | HIGH        | 5/4/5/5/5 = 4.8 | 2024                                    |
| 17  | https://newpublic.substack.com/p/the-handmade-internet-is-making-a                                                        | The internet's hidden creative renaissance                                                 | Community/journalism                       | MEDIUM      | 4/4/3/4/4 = 3.8 | 2024                                    |
| 18  | https://www.amsive.com/insights/seo/googles-helpful-content-update-ranking-system-what-happened-and-what-changed-in-2024/ | Google's Helpful Content Update & Ranking System                                           | Industry analysis                          | MEDIUM-HIGH | 4/5/4/4/4 = 4.2 | 2024                                    |
| 19  | https://readabilityformulas.com/what-are-lexical-density-and-lexical-diversity/                                           | What are Lexical Density and Lexical Diversity?                                            | Reference resource                         | MEDIUM-HIGH | 4/4/4/4/4 = 4.0 | 2024                                    |
| 20  | https://www.hobo-web.co.uk/the-contenteffort-attribute-the-helpful-content-system-and-e-e-a-t-is-gemini-behind-the-hcu/   | ContentEffort Attribute, Helpful Content System and E-E-A-T                                | Industry analysis                          | MEDIUM      | 3/4/3/4/3 = 3.4 | 2024                                    |

---

## Contradictions

**Contradiction 1: SPA detection and Google's capability** Lumar [source 3
equivalent] states Google's Googlebot (headless Chrome) can execute JavaScript
and index SPA content, while the PassionFruit article [3] emphasizes that
GPTBot, ClaudeBot, and PerplexityBot cannot. Both are correct for their
respective crawlers. This is not a contradiction but a scope distinction:
SPA*SHELL classification must specify \_which crawler* is being considered. For
a `/website-analysis` skill using AI crawlers, SPA_SHELL is a valid absence
pattern. For a skill simulating Googlebot, it is not.

**Contradiction 2: AI-generated content detection reliability** Multiple sources
describe AI content detection as imperfect and improving rapidly, while the
IETF/EU standards suggest machine-readable disclosure will become standard.
Current detection tools have meaningful false positive rates (Grammarly,
GPTZero, CopyLeaks diverge significantly on the same content). Do not treat
AI-content detection as a high-confidence classifier without multiple
corroborating signals.

**Contradiction 3: Text-to-HTML ratio as quality signal** WooRank and industry
blogs cite text-to-HTML ratio as a quality signal, but no official Google source
confirms this as a ranking factor. It is a useful proxy but should not be
treated as an authoritative threshold. The boilerplate detection research [9,
15] is more grounded — use those frameworks rather than raw text-to-HTML ratios.

**Contradiction 4: Interstitial threshold specificity** Smashing Magazine [11]
cites 15% as the "safe" size for interstitials, while other sources cite 30% as
Google's threshold for flagging. Google has not published an official
percentage. This is an actively contested number. Use as a range: 15-30% is the
ambiguous zone; >50% is clearly problematic.

---

## Gaps

1. **CURATED_LIST_WEB false positive rate against REGISTRY**: The distinction
   between these two patterns is subtle and may require site-level
   classification, not page-level. No research found that cleanly separates
   them.

2. **DEAD_BLOG vs. deliberately slow-publishing expert blog**: No automated,
   reliable heuristic found to distinguish these. Requires content quality
   assessment of available posts — cannot be determined from freshness signals
   alone.

3. **Vendor brochure detection on technical product sites**: Large enterprise
   software companies (Cloudflare, Stripe, AWS) have marketing pages AND deep
   technical content. Page-level classification is needed, not site-level.

4. **Quantitative thresholds for anchor density in CURATED_LIST_WEB vs.
   LINK_FARM**: Research on boilerplate detection provides qualitative signals
   but no published threshold for "curated" vs. "spammy" anchor density. The
   annotation quality of descriptions is the key differentiator — this requires
   NLP rather than simple ratio.

5. **Captive JS detection from Quick Scan without JS execution**: The heuristic
   of "page claims N items but contains few in HTML" requires semantic
   understanding of what the page should contain. No reliable Quick Scan proxy
   found for this.

6. **Long-tail bias mitigation in practice for the skill**: While signals for
   hidden gem sites are identified, no prior art found for a working
   implementation that successfully surfaces low-traffic, high-quality sites by
   these signals in a real crawl pipeline. This is a design challenge, not a
   research gap.

7. **GENERATED_CONTENT detection for short-form content**: All NLP-based AI
   detection methods work best on 500+ word samples. Short pages (under 300
   words) are difficult to classify reliably.

---

## Serendipity

**S1: Google's internal `contentEffort` metric** Hobo-web research [20] reveals
that Google appears to use an internal LLM-based `contentEffort` metric that
measures the effort invested in creating an article — factoring in unique
multimedia, original research, structural complexity, and replicability
difficulty. This is separate from word count or topic coverage. The
`/website-analysis` skill could approximate this with: original image count,
presence of original data/charts, code snippet density, and
citation-to-primary-sources ratio.

**S2: EU AI Act content watermarking (March 2025)** The EU AI Act effective
March 2025 requires AI-generated content distributed in the EU to include
detectable signals including watermarking or metadata indicators. Combined with
the proposed IETF "AI Content Disclosure Header" (September 2025),
machine-readable AI content disclosure may become detectable via HTTP headers
within the next 12-18 months. The skill should plan to check for this header as
a future signal.

**S3: NavBoost as a feedback loop proxy** Google's NavBoost system uses
`goodClicks` and `badClicks` from real user behavior to validate content quality
predictions. For a `/website-analysis` skill without access to traffic data, the
equivalent proxy is: Does the page have high outbound links to primary sources
(signals users trusted it enough to follow its recommendations) and does Wayback
Machine show recurring visits over time?

**S4: Indie web webrings as quality discovery mechanism** Indie web community
members participate in webrings — networked rings of personal sites (32-Bit
Cafe, Neocities, XOXO community). Membership in a webring is a strong positive
signal for a genuine personal/creator site. Detectable via:
`<link rel="webring" ...>` or webring JavaScript widgets, or links to known
webring index pages. This could serve as a high-precision signal for "genuine
personal site" classification.

---

## Confidence Assessment

- HIGH claims: 10
- MEDIUM claims: 12
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: MEDIUM-HIGH

The absence pattern catalog is HIGH confidence based on multiple independent
sources and technical documentation. The long-tail bias mitigation strategies
are MEDIUM confidence — the signals are well-established but no prior art for
integrating them into a working crawler classification system was found. The
anti-pattern thresholds (especially interstitial coverage percentage) have
specific contradictions between sources and should be treated as guidelines, not
hard cutoffs.

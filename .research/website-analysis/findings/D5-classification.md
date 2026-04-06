# Findings: Website Classification Taxonomy + Auto-Classification Signals

**Searcher:** deep-research-searcher **Profile:** web **Date:**
2026-04-05T00:00:00Z **Sub-Question IDs:** SQ5

---

## Key Findings

### 1. Website Type Taxonomy with Mode Recommendations [CONFIDENCE: HIGH]

A comprehensive taxonomy of website types, their primary analysis value,
recommended scan mode, and key detection signals follows below. This draws on
IAB Content Taxonomy v3 (1,500+ categories), Curlie/DMOZ hierarchy, and direct
CMS/technology analysis via Wappalyzer source patterns.

**Taxonomy Table:**

| Type                                     | Primary Value to Creator                                                            | Recommended Mode                                         | Key Detection Signals                                                                                                                                                                                                              |
| ---------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Blog / Personal Site**                 | Understand content structure, audience targeting, publishing cadence, SEO signals   | Page (single post) or Site (full blog)                   | `og:type=article`, RSS feed present, `<meta name="generator" content="WordPress/Ghost/Jekyll">`, `/blog/` URL path, Article JSON-LD, `<article>` HTML elements                                                                     |
| **Documentation Site**                   | Understand how a product/API is documented; information architecture; coverage gaps | Site (full structure) or Expedition (cross-version docs) | `<meta name="generator" content="Docusaurus/MkDocs/Hugo">`, `__DOCUSAURUS_INSERT_BASEURL_BANNER` JS global, `mkdocs-` in generator meta, `mediawiki` body class, `/docs/` URL path, `.md` sources, Algolia DocSearch integration   |
| **SPA / Web Application**                | Understand UX patterns, feature set, interaction model, competitive positioning     | Page (key screens)                                       | Empty `<div id="root">` or `<div id="app">`, `__NEXT_DATA__` JS global, `window.__NUXT__`, hash-based or pushState routing, `<div id="___gatsby">`, JS-heavy with XHR/Fetch requests instead of page loads, service worker present |
| **E-commerce / Product Page**            | Competitive pricing, product catalog structure, UX patterns, checkout flow          | Page (product) or Site (catalog)                         | `Product` JSON-LD schema, `.woocommerce` CSS class, `woocommerce_params` JS, `window.Shopify` JS global, `/products/` URL path, `X-Shopify-Stage` header, `CheckoutPage` schema.org type, cart/basket DOM elements                 |
| **Curated List / Awesome-List**          | Resource aggregation, competitive landscape mapping, tool discovery                 | Page (if static) or Site (if paginated)                  | `CollectionPage` JSON-LD, `/awesome-*/` or `/list/` URL patterns, high density of external links, `<ul>` / `<li>` dominated structure with no body text, GitHub.io or Netlify hosting                                              |
| **Forum / Community**                    | Understand user pain points, discussion patterns, hot topics, community culture     | Site (multi-thread) or Expedition (multi-forum)          | `QAPage` or `DiscussionForumPosting` JSON-LD, `PHPSESSID` cookie, `/forum/` or `/community/` URL path, MediaWiki-style pagination, phpBB/Discourse/Flarum detection via generator or body class                                    |
| **News / Media**                         | Breaking topics, editorial positioning, SEO strategy, content velocity              | Page (article) or Site (section)                         | `NewsArticle` JSON-LD, `og:type=article`, RSS/Atom feed present, `/news/` URL path, byline + dateline in DOM, AMP (`<html amp>` or `<html ⚡>`), author + publication date meta                                                    |
| **API Documentation / Developer Portal** | API coverage, endpoint structure, authentication patterns, DX quality               | Site (full docs)                                         | `docs.` or `developer.` subdomain (68.6% of dev portals use subdomains), `/api/` URL path, OpenAPI/Swagger UI patterns (`swagger-ui` CSS/JS), Redoc, Stoplight; `SoftwareApplication` JSON-LD, code blocks density                 |
| **Government / Institutional**           | Policy research, regulatory landscape, compliance requirements                      | Page or Site                                             | `.gov` / `.edu` / `.org` TLD, `Organization` JSON-LD with `GovernmentOrganization` type, no ads, strict accessibility patterns (ARIA roles), official seal images                                                                  |
| **Academic / Research**                  | Citation extraction, methodology review, field mapping                              | Page (paper) or Expedition (multi-paper)                 | `ScholarlyArticle` or `Article` JSON-LD, DOI in URL, arXiv domain patterns, JSTOR/PubMed links, `<cite>` elements, bibliography sections, PDF links                                                                                |
| **Portfolio / Showcase**                 | Design inspiration, capability assessment, service offering understanding           | Page                                                     | `ProfilePage` JSON-LD, Behance/Dribbble-like layout, heavy image density, `og:type=website` with personal name as `og:site_name`, `<section>` structure with project cards                                                         |
| **Landing Page / Marketing**             | Positioning, messaging, CTA strategy, competitive messaging analysis                | Page only                                                | Single-page scroll structure, `WebPage` JSON-LD, very low link depth, Webflow (`html[data-wf-site]`) or Unbounce/HubSpot generator meta, hero-feature-CTA DOM pattern                                                              |
| **Registry / Directory / Marketplace**   | Resource discovery, vendor landscape, category structure                            | Site or Expedition                                       | `ItemList` or `Product` JSON-LD, `/directory/` or `/marketplace/` URL paths, search-first UX, faceted filter DOM structure (`[data-filter]`), high page count sitemap                                                              |
| **Tool / Utility**                       | Feature benchmarking, UX patterns, competitive analysis                             | Page                                                     | `SoftwareApplication` JSON-LD, single-function UI, input+output DOM pattern, no auth wall on primary function, calculator/converter URL patterns                                                                                   |
| **Social Media Profile / Feed**          | Audience analysis, content strategy, engagement patterns                            | Page only                                                | `ProfilePage` JSON-LD, `og:type=profile`, platform-specific JS globals (`window.FB`, `window.twttr`), auth-wall on deeper content, canonical URL to platform domain                                                                |

### 2. Auto-Classification Signals from HTML/HTTP [CONFIDENCE: HIGH]

Seven signal categories are reliable for automated site type detection. In
priority order from most to least reliable:

**Signal Priority Ranking:**

1. **JSON-LD @type declarations** (highest signal value) — Explicit semantic
   intent from the publisher. Extract via
   `document.querySelectorAll('script[type="application/ld+json"]')` and parse
   `@type` field. Types: `Article`, `BlogPosting`, `NewsArticle`, `Product`,
   `FAQPage`, `WebSite`, `Organization`, `SoftwareApplication`,
   `ScholarlyArticle`, `ProfilePage`, `CollectionPage`, `QAPage`. These are
   often stacked (multiple `<script>` blocks). [1]

2. **Meta generator tag** — `<meta name="generator" content="[VALUE]">` is the
   most commonly exploited CMS signal. Detection patterns (from Wappalyzer
   source data, verified [3]):
   - WordPress: `content="WordPress X.X.X"`
   - Ghost: `content="Ghost X.X.X"` + `X-Ghost-Cache-Status` header
   - Docusaurus: `content="Docusaurus vX.X.X"` + JS global
     `__DOCUSAURUS_INSERT_BASEURL_BANNER`
   - Hugo: `content="Hugo X.X.X"`
   - Jekyll: `content="Jekyll vX.X.X"` + HTML comment
     `<!-- Begin Jekyll SEO tag`
   - Gatsby: `content="Gatsby X.X.X"` + `<div id="___gatsby">`
   - MkDocs: `content="mkdocs-X.X.X"`
   - MediaWiki: `content="MediaWiki X.X.X"` + `<body class="mediawiki">`
   - Next.js: `x-powered-by: Next.js` header + `__NEXT_DATA__` JS global
   - Nuxt: `<div id="__nuxt">` + `window.__NUXT__` JS global
   - Webflow: `html[data-wf-site]` DOM attribute + generator `"Webflow"`
   - WooCommerce: `.woocommerce` CSS class + `woocommerce_params` JS global

3. **Open Graph `og:type`** — Indicates content type as declared by publisher.
   Values: `website` (default, low signal), `article` (blog/news), `profile`
   (social/portfolio), `book` (publication), `music.song/album`,
   `video.movie/episode`. `article` is a strong blog/news indicator; `profile`
   indicates personal/social content. [2]

4. **URL path patterns** — Moderately reliable, easily overridden but fast to
   check:
   - `/docs/`, `/documentation/` → Documentation site
   - `/blog/`, `/posts/`, `/articles/` → Blog/news
   - `/api/`, `/reference/` → API docs
   - `/products/`, `/shop/`, `/store/` → E-commerce
   - `/forum/`, `/community/`, `/discuss/` → Forum
   - `/wiki/` → Wiki/community knowledge base
   - `docs.`, `developer.`, `api.` subdomains → Developer portal (68.6% use
     subdomain [5])
   - Hash routing (`/#/`) → SPA indicator

5. **HTML structural patterns** — DOM landmark elements:
   - `<article>` prominent + `<time datetime>` → Blog/News
   - `<nav>` with depth >2 levels + sidebar + breadcrumbs → Documentation
   - Empty `<div id="root">` or `<div id="app">` → SPA (requires JS)
   - `<form>` with search + results pattern → Directory/Registry
   - `<table>` with pricing rows → E-commerce or Pricing page

6. **HTTP response headers**:
   - `X-Powered-By: Next.js` → Next.js (SSR/SSG)
   - `X-Ghost-Cache-Status` → Ghost CMS
   - `X-Shopify-Stage` → Shopify
   - `Server: WiziServer` → WiziShop
   - `X-Pingback: /xmlrpc.php` → WordPress

7. **RSS/Atom feed presence** —
   `<link rel="alternate" type="application/rss+xml">` in `<head>` indicates
   content-publishing site (blog, news, podcast). High reliability for blog/news
   classification. Sitemap structure also signals: image sitemaps → media-heavy
   (e-commerce/portfolio), video sitemaps → media site, sitemap index with 50k+
   URLs → large content site. [6]

### 3. Metadata Extraction: Open Graph, JSON-LD, Schema.org [CONFIDENCE: HIGH]

**Open Graph Protocol** (ogp.me) — the de facto standard for social sharing
metadata. Useful fields for classification:

- `og:type` — content type (see values in Signal #3 above) [2]
- `og:site_name` — publisher identity
- `og:title`, `og:description` — content metadata
- `og:image` — visual presence signal

**JSON-LD extraction pattern** (JavaScript):

```js
const scripts = document.querySelectorAll('script[type="application/ld+json"]');
const schemas = Array.from(scripts)
  .map((s) => {
    try {
      return JSON.parse(s.textContent);
    } catch {
      return null;
    }
  })
  .filter(Boolean);
const types = schemas.flatMap((s) => [].concat(s["@type"] || []));
```

This safely handles multiple `<script>` blocks and nested arrays. [4]

**Schema.org WebPage subtypes** (from schema.org/WebPage documentation) that
directly map to website categories [7]:

- `AboutPage` → Institutional/Company
- `CheckoutPage` → E-commerce
- `CollectionPage` → Directory/Curated list
- `ContactPage` → Landing/Marketing
- `FAQPage` → Support/Documentation
- `ItemPage` → Product/E-commerce
- `MedicalWebPage` → Healthcare
- `ProfilePage` → Social/Portfolio
- `QAPage` → Forum/Community
- `SearchResultsPage` → Registry/Directory

**Recommended extraction libraries:**

- `metascraper` (npm) — extracts from OG, Microdata, RDFa, Twitter Cards,
  JSON-LD, HTML meta. Supports 15+ fields including author, date, publisher,
  description, image, feeds. Priority-based rule system with fallbacks. Best for
  article/blog metadata. [8]
- `open-graph-scraper` (npm) — focused OG + Twitter Card extraction, includes
  JSON-LD parsing. Has `throwOnJSONParseError` / `logOnJSONParseError` options
  for safe parsing. Best for quick social metadata extraction. [9]
- Neither library does schema.org type-based classification — that requires
  custom `@type` extraction logic on top.

### 4. CMS and Framework Detection [CONFIDENCE: HIGH]

Detection patterns verified against Wappalyzer's open-source technology database
(github.com/dochne/wappalyzer):

| CMS/Framework | Category Tags         | Primary Detection                                               | Secondary Detection                                                             |
| ------------- | --------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| WordPress     | CMS, Blog             | `meta[generator]="WordPress X.X"`, `/wp-content/` paths         | `wp-embed.min.js` script, `X-Pingback` header, `wp_username` JS global          |
| Ghost         | CMS, Blog             | `meta[generator]="Ghost X.X"`                                   | `X-Ghost-Cache-Status` HTTP header                                              |
| Hugo          | Static Site Generator | `meta[generator]="Hugo X.X"`                                    | Link text "Hugo" with href matching `gohugo.io` (99% confidence)                |
| Jekyll        | Static Site Generator | `meta[generator]="Jekyll vX.X"`                                 | HTML comment `<!-- Begin Jekyll SEO tag`, `SimpleJekyllSearch` JS global        |
| Docusaurus    | Documentation, SSG    | `meta[name="docusaurus_tag"]`, `meta[name="docusaurus_locale"]` | `__DOCUSAURUS_INSERT_BASEURL_BANNER` JS global, `meta[generator]^="Docusaurus"` |
| MkDocs        | Documentation, SSG    | `meta[generator]^="mkdocs-"`                                    | Implies Python                                                                  |
| MediaWiki     | Wiki, CMS             | `<body class="mediawiki">`                                      | `meta[generator]="MediaWiki"`, `wgTitle`/`wgVersion` JS globals                 |
| Gatsby        | SSG, JS Framework     | `<div id="___gatsby">`, `<style id="gatsby-inlined-css">`       | `meta[generator]^="Gatsby"`, implies React + Webpack                            |
| Next.js       | SSG/SSR, JS Framework | `x-powered-by: Next.js` header                                  | `__NEXT_DATA__` JS global, `next.version` JS variable                           |
| Nuxt.js       | SSG/SSR, JS Framework | `<div id="__nuxt">`, `window.__NUXT__`                          | `/_nuxt/` script paths, `$nuxt` JS global                                       |
| Webflow       | Site Builder          | `html[data-wf-site]` DOM attr                                   | `meta[generator]="Webflow"`, `Webflow` JS global                                |
| WooCommerce   | E-commerce            | `.woocommerce` CSS class                                        | `woocommerce_params` JS global, `meta[generator]="WooCommerce"`                 |

**How CMS detection informs analysis strategy:** [CONFIDENCE: MEDIUM]

- WordPress/Ghost → Expect blog structure; look for categories, tags, author
  pages
- Docusaurus/MkDocs/Hugo → Expect documentation structure; sitemap will have
  versioned paths
- Next.js/Gatsby/Nuxt → Expect SSR/SSG; content may be in JSON props
  (`__NEXT_DATA__`), check for hydration data
- MediaWiki → Expect wiki structure; Special: namespace pages are navigation,
  not content
- Webflow → Expect marketing/landing page; minimal content depth, single-scroll
- WooCommerce/Shopify → Expect product catalog; sitemap will have `/products/`
  sections

### 5. Prior Art in Website Classification [CONFIDENCE: MEDIUM]

**Curlie/DMOZ taxonomy** — The successor to DMOZ (closed 2017) uses a
hierarchical human-curated taxonomy with 1,032,037+ categories across 2,988,170
sites. Top-level structure follows broad domains (Arts, Business, Computers,
Games, Health, Home, News, Recreation, Reference, Regional, Science, Shopping,
Society, Sports). Web directories distinguish "alphabetical/classified lists of
resources" from "comprehensive overviews of subject areas." Academic research
using DMOZ achieves ~80% F1 on URL-based classification with logistic
regression. [10]

**IAB Content Taxonomy v3** — The ad-tech industry standard, finalized June
2022, with 1,500+ categories in a tiered hierarchy (Tier 1: broad domains like
Technology & Computing, Shopping; Tier 2: subcategories like Consumer
Electronics, Apparel). Used by Klazify, WhoisXML, and other classification APIs.
Klazify achieves 98%+ confidence on unambiguous domains (e.g., apple.com →
Technology/Consumer Electronics). Machine learning drives current
implementations. [11]

**ML classification approaches:**

- URL-only features (tokenized path segments, TF-IDF on URL tokens): ~80%
  weighted F1 with logistic regression [12]
- Multi-signal (HTML + headers + JS + DNS): modern APIs claim 95%+ accuracy [13]
- LLM-based URL embedding: state-of-the-art as of 2024-2025; captures semantic
  patterns without manual feature engineering

**Wappalyzer's approach** (4-layer detection verified [3]):

1. HTML/header/cookie fingerprinting (~7,200 signatures)
2. DNS CNAME resolution (111 signatures)
3. TLS certificate inspection (8 issuers)
4. Custom HTTP header checks (3 signatures)

Combined confidence model: each signal carries a weight (0-100%), with the
target being 100% cumulative confidence. Low-confidence patterns are explicitly
flagged in source data.

### 6. Classification Algorithm Sketch [CONFIDENCE: MEDIUM]

A practical auto-classification algorithm for a `/website-analysis` skill Quick
Scan phase:

```
PHASE 1 — HTTP/Headers (fastest, before HTML parse)
  if x-powered-by contains "Next.js" → candidate: SPA/SSR App
  if X-Ghost-Cache-Status present → candidate: Blog (Ghost)
  if X-Shopify-Stage present → candidate: E-commerce

PHASE 2 — HTML head signals (fast, no rendering needed)
  parse <meta name="generator"> → CMS lookup table
  parse <meta name="og:type"> → content type hint
  parse all <script type="application/ld+json"> → extract @type[]
  check <link rel="alternate" type="application/rss+xml"> → blog/news signal

PHASE 3 — URL structure (cheap, parallel with PHASE 2)
  path segments: /docs/, /blog/, /api/, /products/, /forum/, /wiki/
  subdomain: docs., developer., api. → developer portal
  hash routing: /#/ → SPA indicator

PHASE 4 — DOM structure (moderate cost, requires parsed HTML)
  check for root mount: div#root, div#app, div#___gatsby, div#__nuxt
  check for article elements: <article>, <time datetime>
  check sitemap.xml for structure signals

PHASE 5 — Classification scoring
  Combine signals into confidence-weighted score per type
  Primary: JSON-LD @type (weight 0.4)
  Secondary: generator meta (weight 0.3)
  Tertiary: URL path + OG type (weight 0.2)
  Fallback: DOM structure (weight 0.1)

  Emit: { type, confidence, detectedCMS, signals[] }
```

**Mode recommendation mapping:**

- Blog/News/Personal → Page (single article) or Site (for competitive analysis)
- Documentation → Site (structure matters) or Expedition (multi-version/product)
- SPA/Web App → Page (key screens only; full site crawl won't work without JS
  rendering)
- E-commerce → Page (product detail) or Site (catalog structure)
- Forum/Community → Site (thread patterns) or Expedition (cross-community)
- Landing/Marketing → Page only (single-scroll, no depth)
- API Docs → Site (endpoint coverage)
- Curated List → Page (if single page) or Site (if paginated)

---

## Sources

| #   | URL                                                                                                                          | Title                                          | Type                   | Trust  | CRAAP | Date    |
| --- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ---------------------- | ------ | ----- | ------- |
| 1   | https://agentmarkup.dev/blog/json-ld-structured-data-guide/                                                                  | JSON-LD Structured Data Complete Guide         | Developer blog         | MEDIUM | 4.0   | 2026    |
| 2   | https://ogp.me/                                                                                                              | The Open Graph Protocol (official spec)        | Official spec          | HIGH   | 5.0   | Current |
| 3   | https://github.com/dochne/wappalyzer                                                                                         | Wappalyzer Technology Detection Patterns       | Open source            | HIGH   | 4.5   | Active  |
| 4   | https://codepen.io/wanbinkimoon/pen/pNQQeB/                                                                                  | Parsing JSON-LD                                | Code example           | MEDIUM | 3.0   | 2020    |
| 5   | https://pronovix.com/blog/api-documentation-and-developer-portals-common-url-patterns                                        | API Documentation Common URL Patterns          | Developer blog         | MEDIUM | 4.0   | 2023    |
| 6   | https://developers.google.com/search/blog/2014/10/best-practices-for-xml-sitemaps-rssatom                                    | Best Practices for XML Sitemaps and RSS/Atom   | Official docs (Google) | HIGH   | 4.5   | 2014    |
| 7   | https://schema.org/WebPage                                                                                                   | WebPage — Schema.org Type                      | Official standard      | HIGH   | 5.0   | Current |
| 8   | https://github.com/microlinkhq/metascraper                                                                                   | Metascraper GitHub                             | Open source            | HIGH   | 4.5   | Active  |
| 9   | https://github.com/jshemas/openGraphScraper                                                                                  | open-graph-scraper GitHub                      | Open source            | HIGH   | 4.5   | Active  |
| 10  | https://en.wikipedia.org/wiki/DMOZ                                                                                           | DMOZ — Wikipedia                               | Reference              | MEDIUM | 3.5   | 2023    |
| 11  | https://www.klazify.com/                                                                                                     | Klazify — IAB Content Taxonomy v3              | Commercial             | MEDIUM | 3.5   | 2026    |
| 12  | https://www.analyticsvidhya.com/blog/2023/03/how-to-classify-web-pages-using-machine-learning/                               | How to Classify Web Pages Using ML             | Tutorial               | MEDIUM | 3.5   | 2023    |
| 13  | https://dev.to/detectzestack/i-built-an-api-that-detects-7200-technologies-on-any-website-heres-how-the-detection-works-3oe3 | DetectZeStack 4-Layer Detection Approach       | Developer blog         | MEDIUM | 3.5   | 2024    |
| 14  | https://www.w3tutorials.net/blog/how-to-know-if-a-website-is-a-single-page-application/                                      | How to Know if a Website is a SPA              | Tutorial               | MEDIUM | 3.0   | 2024    |
| 15  | https://raw.githubusercontent.com/dochne/wappalyzer/main/src/technologies/d.json                                             | Wappalyzer d.json (Docusaurus patterns)        | Source data            | HIGH   | 5.0   | Active  |
| 16  | https://raw.githubusercontent.com/dochne/wappalyzer/main/src/technologies/g.json                                             | Wappalyzer g.json (Ghost/Gatsby patterns)      | Source data            | HIGH   | 5.0   | Active  |
| 17  | https://raw.githubusercontent.com/dochne/wappalyzer/main/src/technologies/h.json                                             | Wappalyzer h.json (Hugo patterns)              | Source data            | HIGH   | 5.0   | Active  |
| 18  | https://raw.githubusercontent.com/dochne/wappalyzer/main/src/technologies/n.json                                             | Wappalyzer n.json (Next.js/Nuxt patterns)      | Source data            | HIGH   | 5.0   | Active  |
| 19  | https://raw.githubusercontent.com/dochne/wappalyzer/main/src/technologies/w.json                                             | Wappalyzer w.json (WordPress/Webflow patterns) | Source data            | HIGH   | 5.0   | Active  |
| 20  | https://raw.githubusercontent.com/dochne/wappalyzer/main/src/technologies/m.json                                             | Wappalyzer m.json (MkDocs/MediaWiki patterns)  | Source data            | HIGH   | 5.0   | Active  |
| 21  | https://raw.githubusercontent.com/dochne/wappalyzer/main/src/technologies/j.json                                             | Wappalyzer j.json (Jekyll patterns)            | Source data            | HIGH   | 5.0   | Active  |

---

## Contradictions

**CMS generator tags vs. stealth:** Multiple sources confirm that meta generator
tags are the primary detection signal, but Wappalyzer's own documentation warns
that sites can strip these tags. Wappalyzer addresses this by combining multiple
signals with confidence weights. The implication for `/website-analysis`:
generator tags are high-signal when present, but absence does not mean a CMS
isn't in use. Always fall through to secondary signals (JS globals, path
patterns, CSS classes).

**URL paths as signals — reliable vs. unreliable:** The academic ML literature
cautions that URL path heuristics "do not generalize well" and "are not
warranted to be present in all websites of a particular type" [12]. However, the
pronovix study found 68.6% of developer portals use `docs.` or `developer.`
subdomains [5], making subdomain patterns highly reliable for that specific
type. Resolution: URL patterns are best treated as supporting signals (weight
0.2) rather than primary classifiers.

**og:type=website vs. article for blogs:** Many blog homepage pages set
`og:type=website` while individual posts set `og:type=article`. This means
`og:type` classification must be URL-context-aware (homepage vs. inner page). A
site with `og:type=article` on inner pages but `og:type=website` on the root is
almost certainly a blog/news site.

---

## Gaps

1. **Curated list / awesome-list detection signals**: No specific schema.org
   type or meta tag pattern was found for identifying "awesome list" style pages
   published as web pages (not GitHub READMEs). The best available signals are
   high external-link density and `CollectionPage` JSON-LD, but false positives
   with directories are likely.

2. **Social media feed classification**: Major platforms (Twitter/X, Instagram,
   LinkedIn) serve content behind authentication walls, making HTML-based
   classification impractical. `og:type=profile` is the only reliable open-web
   signal. Profiles on these platforms may require platform-specific API access,
   not HTML scraping.

3. **Government/institutional vs. generic .gov/.edu**: While TLD is a strong
   signal (.gov, .edu), many universities host diverse content types (news,
   research, directories, blogs) under the same domain. Sub-path classification
   would be needed within these domains.

4. **Specific MkDocs Material theme vs. plain MkDocs**: Both share the same
   generator meta tag pattern (`mkdocs-`). Theme-specific detection would
   require checking for Material-specific CSS classes (`md-grid`, `md-header`),
   which was not verified from source data.

5. **Forum software beyond MediaWiki**: Discourse, phpBB, Flarum, and Vanilla
   Forums were not verified against Wappalyzer detection patterns. The
   Wappalyzer `d.json` file (confirmed for Docusaurus) likely contains Discourse
   entries, but they were not extracted in this research session.

6. **MkDocs detection without generator tag exposed**: Some MkDocs deployments
   strip or override the generator meta tag via `extra` config. In that case,
   fallback signals would need to be JS/DOM based, which were not found.

7. **Confidence score calibration**: The proposed classification algorithm's
   weights (JSON-LD 0.4, generator meta 0.3, URL/OG 0.2, DOM 0.1) are heuristic
   estimates. No empirical calibration data was found for this specific
   multi-signal weighting scheme.

---

## Serendipity

1. **DetectZeStack 4-layer architecture** — The detection stack (Wappalyzer
   fingerprints → DNS CNAME → TLS cert → custom headers) is an elegant model
   that extends beyond HTML alone. TLS certificate issuer analysis is
   particularly novel: Let's Encrypt suggests self-hosted, Cloudflare
   certificates suggest proxied infrastructure. This is useful for inferring
   site scale/professionalism independent of content type.

2. **Wappalyzer "implies" field** — The detection database uses an `implies`
   relationship (e.g., Docusaurus implies React + Webpack; Ghost implies
   Node.js). This creates an inference chain: detecting Docusaurus also tells
   you the tech stack. For a `/website-analysis` skill, this means CMS detection
   can double as tech stack detection at no extra cost.

3. **metascraper vendor rules** — The library includes vendor-specific
   extraction rules for Amazon, Spotify, YouTube, TikTok, Instagram, X, etc.
   This means that social media URLs can be processed with enhanced fidelity
   beyond generic OG tags. This is relevant for the "social media profile/feed"
   category despite the auth-wall gap noted above.

4. **AMP detection as news signal** — `<html amp>` or `<html ⚡>` is a reliable,
   fast signal for accelerated mobile page news content. AMP was almost
   exclusively adopted by news/media publishers, making it a strong categorical
   signal even if AMP usage is declining (Google de-prioritized AMP requirements
   in 2021).

5. **Sitemap index structure as scale signal** — Sites with sitemap index files
   (pointing to multiple child sitemaps) are necessarily large (>50,000 URLs
   or >50MB). This distinguishes enterprise e-commerce and large news sites from
   small blogs purely from the `/sitemap.xml` response, before any content
   analysis.

---

## Confidence Assessment

- HIGH claims: 4 (taxonomy table, detection signals, CMS patterns, JSON-LD
  extraction)
- MEDIUM claims: 2 (classification algorithm sketch, prior art in web
  directories/SEO tools)
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

The taxonomy table, CMS detection patterns (from Wappalyzer source data), and
metadata extraction recommendations are grounded in authoritative open-source
data and official standards. The classification algorithm sketch and mode
recommendations are original synthesis — they are well-reasoned from the
evidence but have not been independently validated against a test dataset.

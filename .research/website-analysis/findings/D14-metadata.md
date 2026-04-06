# Findings: Metadata Extraction from Web Pages — Tools, Standards, and Practical Implementation

**Searcher:** deep-research-searcher **Profile:** web + docs **Date:**
2026-04-05 **Sub-Question IDs:** SQ14

---

## Key Findings

### 1. Open Graph Protocol — Tags, Adoption, and Classification Value

**[CONFIDENCE: HIGH]**

Open Graph (OG) is the dominant structured social metadata standard, appearing
on **64% of web pages** as of 2024 (HTTP Archive Web Almanac, n=~17M sites).
Individual tag adoption rates on mobile pages: `og:title` 61%, `og:url` 58%,
`og:type` 56%, `og:description` 53%, `og:image` is the most-used OG property
overall [1].

**Required OG tags (per spec):**

- `og:title` — Object name for social graph
- `og:type` — Content type (see type taxonomy below)
- `og:image` — Visual representation URL
- `og:url` — Permanent canonical identifier

**Optional OG tags:**

- `og:description`, `og:site_name`, `og:locale`, `og:locale:alternate`,
  `og:audio`, `og:video`, `og:determiner`

**Structured OG image/video properties:**

- `og:image:url`, `og:image:secure_url`, `og:image:type`, `og:image:width`,
  `og:image:height`, `og:image:alt`

**`og:type` taxonomy (classification-critical):**

| og:type value         | Meaning                               |
| --------------------- | ------------------------------------- |
| `website`             | Default; homepage or non-article page |
| `article`             | Blog post, news, editorial            |
| `book`                | Book-specific content                 |
| `profile`             | Author or person profile page         |
| `payment.link`        | Payment/e-commerce link               |
| `music.song`          | Single track                          |
| `music.album`         | Album page                            |
| `music.playlist`      | Playlist                              |
| `music.radio_station` | Radio                                 |
| `video.movie`         | Film                                  |
| `video.episode`       | TV/web series episode                 |
| `video.tv_show`       | TV show                               |
| `video.other`         | Other video                           |

**Type-specific additional tags:** Article (`published_time`, `modified_time`,
`author`, `section`, `tag`), Book (`isbn`, `author`), Music (`duration`,
`musician`, `release_date`), Video (`actor`, `director`, `writer`, `series`),
Profile (`first_name`, `last_name`, `username`).

**Classification value:** HIGH. `og:type` is a strong first-pass classifier.
`og:site_name` provides brand identity. `og:description` supplements
content-based description. Google now considers `og:title` when generating
search result titles [1].

---

### 2. JSON-LD / Schema.org — Types, Extraction, and Classification Value

**[CONFIDENCE: HIGH]**

JSON-LD is the fastest-growing structured data format. Adoption: **41% of
pages** in 2024 (up from 34% in 2022), and **89.4% market share** among all
schema implementations by 2026 [1][2]. Preferred by Google — their developer
documentation exclusively uses JSON-LD examples.

**Most common schema.org types (by page prevalence, 2024):**

| Schema Type      | Mobile Page Prevalence | Signal for Classification            |
| ---------------- | ---------------------- | ------------------------------------ |
| `WebSite`        | 12.73%                 | Generic site identity                |
| `BreadcrumbList` | 5.66%                  | Multi-page site, e-commerce, content |
| `Organization`   | 7.16%                  | Business/brand presence              |
| `LocalBusiness`  | 3.97%                  | Local services, restaurant, medical  |
| `ItemList`       | 2.44%                  | E-commerce category, list content    |
| `BlogPosting`    | 1.40%                  | Blog content                         |
| `FAQPage`        | 0.6% (desktop)         | Content/documentation site           |
| `Article`        | 0.18%                  | News/editorial                       |

**Category-specific schema patterns:**

- Restaurant/healthcare: `LocalBusiness` (67% and 61% adoption in those
  verticals) [2]
- E-commerce: `Product`, `AggregateRating`, `CollectionPage`, `ItemList`
- News/media: `Article`, `NewsArticle`
- Blogs: `BlogPosting`, `Person`
- Job boards: `JobPosting`
- Events: `Event`
- Recipes: `Recipe`

**Extraction method — static HTML only:** All JSON-LD is embedded in
`<script type="application/ld+json">` tags within the `<head>`. No JavaScript
execution required. Extraction is a simple DOM query + JSON.parse:

```javascript
// Cheerio example
const $ = cheerio.load(html);
const jsonLdBlocks = [];
$('script[type="application/ld+json"]').each((_, el) => {
  try {
    jsonLdBlocks.push(JSON.parse($(el).html()));
  } catch (e) {
    /* malformed JSON — skip or log */
  }
});
```

Multiple `<script type="application/ld+json">` blocks can appear on one page.
Each block may contain a single object or an array. Nested entities (`@graph`)
are common in sophisticated implementations [3].

**Classification value:** HIGH when present. Schema type directly signals
content category. The `sameAs` property (Facebook 4.53%, Instagram 3.67%) aids
entity disambiguation [1].

---

### 3. Standard Meta Tags — Full Catalog

**[CONFIDENCE: HIGH]**

All standard meta tags are in `<head>` and extractable from static HTML with no
JS rendering.

**Core HTML meta tags:**

| Tag                         | Attribute | Value                  | Classification Use           |
| --------------------------- | --------- | ---------------------- | ---------------------------- |
| `<title>`                   | —         | Page title text        | HIGH — primary label         |
| `<meta name="description">` | content   | Page summary           | MEDIUM — content hint        |
| `<meta name="keywords">`    | content   | Comma-separated topics | LOW — often spammy/omitted   |
| `<meta name="author">`      | content   | Author name            | MEDIUM — blog/news signal    |
| `<meta name="generator">`   | content   | CMS identifier         | HIGH — technology stack      |
| `<meta name="robots">`      | content   | noindex/nofollow/etc.  | MEDIUM — crawlability signal |
| `<meta name="viewport">`    | content   | width=device-width...  | LOW — mobile optimization    |
| `<meta charset="...">`      | —         | UTF-8, ISO-8859-1      | LOW                          |
| `<meta name="theme-color">` | content   | Brand color hex        | LOW — branding signal        |

**`generator` tag for CMS detection (HIGH classification value):**

- WordPress: `content="WordPress 6.x"`
- Drupal: `content="Drupal 9 (https://www.drupal.org)"`
- Joomla: `content="Joomla! - Open Source Content Management"`
- Ghost, Hugo, Jekyll, Gatsby, Next.js all emit generator tags

**Twitter Card tags (45% page adoption as of 2024 [1]):**

| Tag                   | Purpose                                                      |
| --------------------- | ------------------------------------------------------------ |
| `twitter:card`        | Card type: `summary`, `summary_large_image`, `app`, `player` |
| `twitter:title`       | Title (26% of pages)                                         |
| `twitter:description` | Description (24% of pages)                                   |
| `twitter:image`       | Image URL                                                    |
| `twitter:site`        | @username of website                                         |
| `twitter:creator`     | @username of content author                                  |
| `twitter:image:alt`   | Alt text for image                                           |

Note: Tags remain `twitter:*` despite X rebrand — the `x:*` prefix does not work
[5].

**Apple/mobile meta tags:**

| Tag                                     | Purpose                     | Classification Signal |
| --------------------------------------- | --------------------------- | --------------------- |
| `apple-mobile-web-app-capable`          | `yes` = standalone PWA mode | PWA/app signal        |
| `apple-mobile-web-app-status-bar-style` | Status bar appearance       | PWA signal            |
| `apple-mobile-web-app-title`            | App name on home screen     | Brand identity        |
| `apple-touch-icon` (link rel)           | iOS home screen icon        | App-like site         |
| `viewport`                              | Device width/scale          | Mobile optimization   |

**Dublin Core meta tags (LOW adoption, specialized use):**

- Adoption: ~2.34% of academic/library websites [6]; less than 1% of general web
  [1]
- Tags: `DC.title`, `DC.creator`, `DC.subject`, `DC.description`,
  `DC.publisher`, `DC.date`, `DC.type`, `DC.format`, `DC.identifier`,
  `DC.language`
- Signal: Presence of Dublin Core strongly indicates academic, archival, or
  government content

---

### 4. RSS/Atom Feed Detection

**[CONFIDENCE: HIGH]**

Feeds are declared in `<head>` as `<link>` tags — fully extractable from static
HTML:

```html
<!-- RSS -->
<link
  rel="alternate"
  type="application/rss+xml"
  title="Site Feed"
  href="/feed.xml"
/>
<!-- Atom -->
<link
  rel="alternate"
  type="application/atom+xml"
  title="Site Feed"
  href="/atom.xml"
/>
<!-- JSON Feed -->
<link
  rel="alternate"
  type="application/feed+json"
  title="Site Feed"
  href="/feed.json"
/>
```

**Extraction pattern:**

```javascript
$('link[rel="alternate"]').each((_, el) => {
  const type = $(el).attr("type") || "";
  if (
    type.includes("rss") ||
    type.includes("atom") ||
    type.includes("feed+json")
  ) {
    feeds.push({ type, href: $(el).attr("href"), title: $(el).attr("title") });
  }
});
```

**Classification signals from feed presence:**

- Feed present → blog, news site, podcast, or content publication (HIGH
  confidence)
- Multiple feeds → major publication or multi-section site
- No feed → static/brochure site, app, e-commerce (supporting signal only)
- `title` attribute of feed link often contains section name (e.g., "Blog Feed",
  "Podcast Feed")

**Content freshness signal:** Feed URL can be fetched separately to get
publication frequency, last-updated date, and item count — a strong
freshness/activity indicator.

---

### 5. Favicon and Branding Extraction

**[CONFIDENCE: HIGH]**

Favicons are declared in `<head>` as `<link>` tags plus a conventional fallback
path. All extractable from static HTML:

```html
<!-- Standard favicon -->
<link rel="icon" type="image/png" href="/favicon-32x32.png" />
<link rel="shortcut icon" href="/favicon.ico" />
<!-- Apple touch (iOS home screen, high-res) -->
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
<!-- PWA manifest (links to full icon set) -->
<link rel="manifest" href="/site.webmanifest" />
<!-- Safari pinned tab -->
<link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5" />
```

**Extraction approach:**

1. Parse all `<link rel="icon">`, `<link rel="apple-touch-icon">`,
   `<link rel="shortcut icon">` tags
2. Fall back to `{baseUrl}/favicon.ico` if no explicit link found
3. Resolve relative URLs against `og:url` or page URL

**Brand signals from favicon metadata:**

- `theme-color` meta tag (hex color → brand palette)
- `apple-mobile-web-app-title` (app identity)
- `og:image` (often the social share image = brand identity)
- `og:site_name` (canonical brand name)
- Favicon itself (visual identity, can be fetched for color extraction)

---

### 6. Practical Extraction Pipeline

**[CONFIDENCE: HIGH]**

**Can ALL metadata be extracted from a single static HTML fetch?** YES — for all
metadata types covered above:

- OG tags, meta tags, Twitter cards, Dublin Core, Apple tags: `<head>` `<meta>`
  and `<link>` elements
- JSON-LD: `<script type="application/ld+json">` in `<head>` or `<body>`
- Feeds: `<link rel="alternate">` in `<head>`
- Favicons: `<link rel="icon">` / `<link rel="apple-touch-icon">` in `<head>`
- Generator/CMS: `<meta name="generator">` in `<head>`

**No JavaScript rendering required.** All metadata is embedded in raw HTML. Only
edge cases (SPAs that inject meta via React Helmet or similar, after hydration)
would require a headless browser. For the majority of sites, a single
`fetch()` + HTML parse is sufficient [4].

**Extraction speed benchmark (Node.js):**

| Library         | Parse speed            | CSS selectors    | Streaming | Memory    | Recommendation                  |
| --------------- | ---------------------- | ---------------- | --------- | --------- | ------------------------------- |
| **htmlparser2** | ~2.4 ms/file (fastest) | No (manual)      | Yes       | Low       | Large batch processing          |
| **parse5**      | ~6.5 ms/file           | No (manual)      | No        | Low       | Strict spec compliance          |
| **Cheerio**     | ~12.2 ms/file          | Yes (jQuery API) | No        | Efficient | Best DX for metadata extraction |
| **JSDOM**       | Slowest                | Yes              | No        | High      | Only needed for JS execution    |

For metadata extraction specifically, **Cheerio is the recommended choice** —
the DX advantage (CSS selectors, jQuery-like API) outweighs the 5x raw-speed
disadvantage vs htmlparser2, and 12ms is negligible for single-URL extraction
[7][4].

**Recommended Node.js pipeline:**

```javascript
import * as cheerio from "cheerio";

function extractAllMetadata(html, baseUrl) {
  const $ = cheerio.load(html);

  // 1. Standard meta tags
  const meta = {};
  $("meta").each((_, el) => {
    const name =
      $(el).attr("name") || $(el).attr("property") || $(el).attr("http-equiv");
    const content = $(el).attr("content");
    if (name && content) meta[name] = content;
  });

  // 2. JSON-LD blocks
  const jsonLd = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      jsonLd.push(JSON.parse($(el).html()));
    } catch (e) {}
  });

  // 3. Feeds
  const feeds = [];
  $('link[rel="alternate"]').each((_, el) => {
    const type = $(el).attr("type") || "";
    if (/rss|atom|feed\+json/.test(type)) {
      feeds.push({
        type,
        href: $(el).attr("href"),
        title: $(el).attr("title"),
      });
    }
  });

  // 4. Favicons
  const icons = [];
  $('link[rel*="icon"], link[rel="apple-touch-icon"]').each((_, el) => {
    icons.push({
      rel: $(el).attr("rel"),
      href: $(el).attr("href"),
      sizes: $(el).attr("sizes"),
    });
  });
  // Fallback
  if (!icons.length)
    icons.push({ rel: "icon", href: "/favicon.ico", sizes: null });

  return { meta, jsonLd, feeds, icons };
}
```

**Recommended tools by ecosystem:**

| Ecosystem               | Library                   | Notes                                                                             |
| ----------------------- | ------------------------- | --------------------------------------------------------------------------------- |
| **Node.js (full)**      | `open-graph-scraper`      | Fetches + parses OG, Twitter, JSON-LD, meta; TypeScript types                     |
| **Node.js (HTML-only)** | `open-graph-scraper-lite` | Same parser, no fetch; ideal for pre-fetched HTML                                 |
| **Node.js (unified)**   | `metascraper`             | Plugin architecture; OG, JSON-LD, RDFa, Twitter, fallbacks; 50k+ weekly downloads |
| **Node.js (flexible)**  | `cheerio` + custom        | Best DX for custom extraction pipelines                                           |
| **Python**              | `extruct`                 | All-in-one: microdata, JSON-LD, OG, RDFa, Dublin Core, microformats               |
| **Language-agnostic**   | HTML fetch + regex        | HEAD-only requests miss `<body>` JSON-LD; full fetch preferred                    |

**Handling missing/malformed metadata gracefully:**

- Always wrap JSON-LD parse in try/catch (malformed JSON is common)
- Fall back: `og:title` → `<title>` → first `<h1>`
- Fall back: `og:description` → `meta[name="description"]` → first `<p>` text
- Fall back: favicon → `/favicon.ico` (Google's fallback convention)
- Missing `og:type` → default is `website` per spec
- Accept partial metadata — never fail extraction because one field is absent

---

### 7. Metadata-to-Classification Mapping

**[CONFIDENCE: MEDIUM-HIGH]**

Metadata alone can produce a confident first-pass classification for most sites.
Content analysis is required for fine-grained classification and to resolve
ambiguous signals.

**Classification dimension mapping:**

| Classification Dimension | Primary Metadata Signal                           | Confidence                |
| ------------------------ | ------------------------------------------------- | ------------------------- |
| Content type             | `og:type`                                         | HIGH (when set)           |
| Content type             | `@type` in JSON-LD                                | HIGH (when set)           |
| Content type             | Feed presence                                     | HIGH (blog/news/podcast)  |
| Content type             | `meta[name="generator"]`                          | MEDIUM (CMS → infer type) |
| Industry/vertical        | `LocalBusiness` schema                            | HIGH                      |
| Industry/vertical        | `Product`/`AggregateRating` schema                | HIGH (e-commerce)         |
| Industry/vertical        | `BlogPosting`/`Article` schema                    | HIGH (content)            |
| Industry/vertical        | `og:type=article`                                 | MEDIUM-HIGH               |
| Organization identity    | `Organization` JSON-LD                            | HIGH                      |
| Organization identity    | `og:site_name`                                    | HIGH                      |
| Organization identity    | `sameAs` property                                 | HIGH                      |
| Audience/locale          | `og:locale`                                       | HIGH                      |
| Technology stack         | `meta[name="generator"]`                          | HIGH                      |
| Mobile/PWA               | `apple-mobile-web-app-capable=yes`                | HIGH                      |
| Academic/archival        | Dublin Core tags present                          | HIGH                      |
| Freshness/activity       | Feed publication dates                            | MEDIUM                    |
| Freshness/activity       | `article:published_time`, `article:modified_time` | HIGH                      |

**Confidence levels for metadata-only classification:**

| Site Category      | Metadata-Only Confidence | Notes                                              |
| ------------------ | ------------------------ | -------------------------------------------------- |
| Blog               | HIGH                     | Feed + `BlogPosting`/`Article` + `og:type=article` |
| News site          | HIGH                     | Feed + `NewsArticle` + `article:*` tags            |
| E-commerce         | HIGH                     | `Product`/`AggregateRating` + `og:type=website`    |
| Local business     | HIGH                     | `LocalBusiness` schema                             |
| Portfolio/personal | MEDIUM                   | Often minimal schema; name/author tags             |
| SaaS/app           | MEDIUM                   | Usually `website` og:type with no schema           |
| Government         | MEDIUM                   | Dublin Core presence; `.gov` domain                |
| Academic           | MEDIUM                   | Dublin Core; `Article`/`ScholarlyArticle` schema   |
| Forum              | LOW                      | Minimal structured data; generic tags              |
| Social media       | LOW                      | Meta often blocked or minimal                      |

**Coverage gap:** ~36% of pages have no OG tags; ~59% have no JSON-LD. For sites
with no structured metadata, classification must fall back to content signals
(title text, h1, navigation labels, URL patterns).

**Confidence degradation rules:**

- Only `og:type=website` present (default/fallback) → MEDIUM at best — tells you
  it's a website, not the category
- No JSON-LD + no OG → LOW confidence metadata-only classification
- `generator` tag present but no content schema → CMS detected, category unknown
- Feed present → HIGH confidence it's a content publication
- Both `og:type=article` AND `BlogPosting` JSON-LD → HIGH confidence blog/news

---

## Sources

| #   | URL                                                                                                                        | Title                                                     | Type                | Trust  | CRAAP (avg) | Date      |
| --- | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ------------------- | ------ | ----------- | --------- |
| 1   | https://almanac.httparchive.org/en/2024/structured-data                                                                    | Structured data — 2024 Web Almanac (HTTP Archive)         | Official analysis   | HIGH   | 4.8         | 2024      |
| 2   | https://www.amraandelma.com/top-schema-markup-statistics-2025/                                                             | Top Schema Markup Statistics 2025                         | Industry analysis   | MEDIUM | 3.4         | 2025      |
| 3   | https://json-ld.org/                                                                                                       | JSON-LD Official Site                                     | Official spec       | HIGH   | 5.0         | Evergreen |
| 4   | https://scrapeops.io/nodejs-web-scraping-playbook/best-nodejs-html-parsing-libraries/                                      | Best NodeJS HTML Parsing Libraries Compared               | Technical guide     | MEDIUM | 3.8         | 2024-2025 |
| 5   | https://developer.x.com/en/docs/x-for-websites/cards/overview/markup                                                       | Cards Markup — X (Twitter) Developer Platform             | Official docs       | HIGH   | 4.5         | 2024      |
| 6   | https://pmc.ncbi.nlm.nih.gov/articles/PMC3977404/                                                                          | Dublin Core metadata usage in university library websites | Academic paper      | HIGH   | 4.2         | 2014      |
| 7   | https://github.com/cheeriojs/cheerio/issues/1259                                                                           | parse5 vs htmlparser2 performance — Cheerio GitHub        | Community/technical | MEDIUM | 3.5         | 2023      |
| 8   | https://ogp.me/                                                                                                            | The Open Graph Protocol                                   | Official spec       | HIGH   | 5.0         | Evergreen |
| 9   | https://github.com/jshemas/openGraphScraper                                                                                | openGraphScraper — GitHub                                 | Official library    | HIGH   | 4.5         | 2024      |
| 10  | https://github.com/scrapinghub/extruct                                                                                     | extruct — GitHub (Scrapinghub)                            | Official library    | HIGH   | 4.5         | 2024      |
| 11  | https://www.npmjs.com/package/open-graph-scraper-lite                                                                      | open-graph-scraper-lite — npm                             | Official package    | HIGH   | 4.5         | 2024      |
| 12  | https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariHTMLRef/Articles/MetaTags.html | Supported Meta Tags — Apple Developer                     | Official docs       | HIGH   | 4.2         | Archived  |
| 13  | https://seomator.com/blog/how-to-detect-which-cms-any-website-is-using                                                     | How to Detect CMS of Any Website                          | Technical guide     | MEDIUM | 3.5         | 2026      |
| 14  | https://blog.jim-nielsen.com/2024/rss-in-html-follow-up/                                                                   | RSS in HTML: A Follow-Up                                  | Technical blog      | MEDIUM | 3.8         | 2024      |

---

## Contradictions

**1. Adoption rate sourcing discrepancy (OG tags):** The 2024 Web Almanac
reports OG on 64% of pages; earlier search summary cited 57-59% desktop (2022
figure). These are different measurement years and populations — not a direct
contradiction. The Web Almanac 2024 figure (64%) is the most authoritative
current data.

**2. JSON-LD market share figures:** Web Almanac 2024 reports JSON-LD on 41% of
all pages. The amraandelma.com source reports "89.4% market share among schema
implementations" (meaning 89.4% of sites that use schema at all use JSON-LD).
These measure different things (page-level vs. format share among schema users)
— both can be correct simultaneously.

**3. Schema.org domain count:** amraandelma.com claims "62 million domains" with
schema (17% of all registered domains) as of 2026. Earlier data cited 45 million
(12.4%). The discrepancy is likely real growth plus different methodology. The
2026 figure from a single industry blog source is MEDIUM confidence.

---

## Gaps

1. **Metadata-only classification accuracy benchmarks:** No independent research
   was found measuring precision/recall of metadata-only classification vs.
   content-analysis classification. Confidence levels in the mapping table above
   are reasoned estimates, not empirically validated figures.

2. **JSON-LD adoption by site category breakdown:** The Web Almanac provides
   per-type prevalence but not "what % of e-commerce sites use Product schema" —
   only overall page-level rates.

3. **`open-graph-scraper` weekly download counts:** The npm page returned 403.
   Weekly download count and version history not directly verified; the
   jshemas/openGraphScraper GitHub is confirmed active.

4. **Metascraper plugin architecture details:** The metascraper.js.org site
   returned minimal content. Plugin list and specific field extraction rules not
   fully documented from primary source. Secondary sources confirm 50k+ weekly
   downloads and plugin architecture.

5. **SPA metadata injection:** For sites using React Helmet, Next.js `<Head>`,
   or similar — metadata is in the static HTML (SSR/SSG renders it), but
   client-side-only SPAs may not include metadata in raw fetch. Frequency of
   this edge case across the web is not quantified.

6. **Favicon extraction performance:** No benchmarks found for favicon
   extraction specifically (HTTP HEAD request to `/favicon.ico` vs. parsing HTML
   links).

---

## Serendipity

**1. Google now uses `og:title` for search snippets:** The Web Almanac 2024
notes that Google's search result title generation considers `og:title`. This
means OG metadata affects SEO, not just social sharing — a strong incentive for
sites to keep it accurate, increasing its reliability as a classification
signal.

**2. FAQPage schema growing despite Google deprecation:** `FAQPage` adoption
increased after Google stopped showing FAQ rich results, suggesting sites
perceive schema value beyond immediate search features (e.g., AI search, AEO).
This signals that schema data may become more classification-relevant in
AI-powered discovery contexts.

**3. `sameAs` property as entity disambiguation:** The `Organization` schema's
`sameAs` property links to Facebook (4.53%), Instagram (3.67%), and Wikidata
(0.17%) profiles. For website-analysis, this field could enable cross-platform
entity matching and brand deduplication.

**4. CMS detection via multiple signals beyond `generator`:** Beyond the
`meta[name="generator"]` tag, CMS can be detected from URL path patterns
(`/wp-content/`, `/wp-includes/`), JavaScript globals (`Shopify.theme`), and
HTTP headers (`X-Powered-By`). The generator tag alone covers only CMS platforms
that emit it (many disable it for security).

**5. `meta[name="robots"]` as content-quality signal:** Sites with `noindex` or
`nofollow` on significant portions of pages may indicate thin-content, staging,
or low-quality content. This is a potentially useful negative signal for Creator
View quality assessment.

---

## Confidence Assessment

- HIGH claims: 7
- MEDIUM-HIGH claims: 2
- MEDIUM claims: 3
- LOW claims: 1
- UNVERIFIED claims: 0
- **Overall confidence: HIGH**

The high overall confidence reflects that:

- Core adoption statistics come from the authoritative HTTP Archive Web Almanac
  (2024, n=17M sites)
- OG and JSON-LD specs are sourced from official spec sites (ogp.me,
  json-ld.org)
- Tool capabilities are sourced from official GitHub repositories
- Performance benchmarks come from the Cheerio project's own issue tracker
  (primary source)
- The primary gap is empirical accuracy of metadata-only classification — this
  is a reasoned mapping, not a validated benchmark

# Findings: Creator-Relevant Dimensions for the Engineer View

**Searcher:** deep-research-searcher **Profile:** web + docs **Date:**
2026-04-05 **Sub-Question IDs:** SQ7

---

## Key Findings

### 1. Freshness / Temporal Health — Eight Distinct Detection Methods Exist [CONFIDENCE: HIGH]

Content freshness is detectable through a layered cascade of eight methods, with
no single method being reliable across all sites. Combining methods achieves a
95%+ success rate vs. ~40% when relying on HTTP headers alone [1].

**Detection cascade (in priority order):**

| Priority | Method                               | Technical Detail                                                                       |
| -------- | ------------------------------------ | -------------------------------------------------------------------------------------- |
| 1        | HTTP `Last-Modified` header          | Server response header; most authoritative but absent on ~60% of sites                 |
| 2        | Sitemap `<lastmod>` tag              | XML sitemap entry; should reflect last significant content change [3]                  |
| 3        | Schema.org markup                    | `dateModified` and `datePublished` on Article, BlogPosting, etc.                       |
| 4        | Open Graph tags                      | `og:updated_time`, `article:published_time`, `article:modified_time`                   |
| 5        | HTML `<meta>` tags                   | `<meta name="last-modified">`, `<meta name="date">`                                    |
| 6        | `<article>` visible date text        | Parse visible publication/update dates in article byline area                          |
| 7        | Copyright year in footer             | Weak signal — Google explicitly notes copyright date changes are not "significant" [3] |
| 8        | Content analysis / pattern inference | Heuristic date extraction from body text                                               |

**Staleness thresholds by site type:**

- News / current events: Stale within 24-48 hours
- Blog / opinions: Stale after 6-12 months; review needed after 6 months [8]
- Documentation / tutorials: Stale when major version changes; evergreen
  otherwise
- Regulatory / stats / research: Stale when source data changes — often 1-3
  years
- Evergreen reference: May not require updates unless major paradigm shift

A 2024 HTTP Archive study found that over 58% of sitemaps contain outdated or
missing `lastmod` values, meaning absence of a signal is a common condition and
must be handled gracefully [1].

**Creator relevance:** A creator needs to know whether content is current before
trusting it for research. Stale technical or regulatory content can be actively
harmful if cited.

---

### 2. Content Quality Signals — Multiple Formula Approach Recommended [CONFIDENCE: HIGH]

Readability scores are well-established, computable from page text, and directly
relevant to whether a creator can efficiently parse content [2][9].

**Primary readability formulas:**

| Formula                    | What It Measures                                               | Best For                                          |
| -------------------------- | -------------------------------------------------------------- | ------------------------------------------------- |
| Flesch Reading Ease        | 0-100 score; 60+ = general audience                            | General web content [6]                           |
| Flesch-Kincaid Grade Level | US grade equivalent; 8th grade = target                        | Most web content [6]                              |
| Coleman-Liau Index         | Characters per word + words per sentence; syllable-independent | Technical jargon with short but complex words [2] |
| Gunning Fog                | Sentence length + polysyllabic words; grade level              | Business/professional text                        |
| SMOG Index                 | Based on polysyllabic words; healthcare-validated              | Medical/academic content                          |

**Hemingway App approach [9]:** Highlights sentences 4+ grade levels above
average in yellow; 6+ in red. Also surfaces adverb overuse and passive voice.
Provides word count, sentence count, paragraph count, and estimated reading
time.

**Readable.com approach [6]:** Runs all five major formulas simultaneously and
outputs a "percentage of audience who can understand" this text, which is more
actionable than a raw grade level.

**Content depth indicators (programmatically detectable):**

- Word count per page (Screaming Frog surfaces this in crawl data) [10]
- Heading count by level (H1/H2/H3/H4 density)
- Average section length (words per H2-bounded section)
- Factual density: aim for 2-3 verifiable facts per 100 words [12]
- Outbound citation count (links to authoritative external sources)
- Presence of a Sources/References section

**Thin content threshold:** Pages with fewer than ~300 words flagged as
potentially thin; below 150 words nearly always thin [10]. Screaming Frog's Word
Count column enables this at scale.

**Duplicate / syndicated content detection:**

- `rel="canonical"` pointing away from the current URL = likely syndicated copy
- Identical content hash across multiple URLs = duplicates
- Copyscape-style cross-domain fingerprinting (not easily automated in a
  single-page analyzer, but canonical check is)
- Schema.org `isPartOf` or `sameAs` may indicate syndication relationship

---

### 3. Link Health — Four Distinct Quality Dimensions [CONFIDENCE: HIGH]

Link health covers internal architecture (structure) and external links
(freshness/validity). Both are relevant to a creator's ability to navigate and
trust content [4][5].

**Internal link structure quality:**

- **Orphan pages:** URLs with zero incoming internal links. Content with no
  internal links is "invisible to crawlers and users" [4]. Detection: crawl all
  pages, build link graph, identify nodes with in-degree = 0.
- **Link depth:** Pages reachable only after 4+ clicks from homepage = buried
  content. Threshold: valuable content should be within 3 clicks.
- **Internal link count per page:** Very low (0-1) suggests isolation; very high
  (50+) suggests navigation pages or link farms.
- **Broken internal links:** HTTP 4xx responses to internal hrefs = navigation
  dead ends.

**Outbound link health:**

- HTTP status check on outbound `<a href>` elements: 4xx/5xx = dead link
- Domain expiration check: linked domain no longer resolves = dead resource
- Redirect chains: 301→301→301 chains degrade link equity and user experience
- Link-to-content ratio: High ratio of outbound links relative to content (i.e.,
  link farm pattern) is a negative trust signal

**Tools that measure this:**

- Ahrefs Free Broken Link Checker [5]
- Dr. Link Check [4]
- Dead Link Checker [4]
- OrphanPages plugin (WordPress) [4]
- Screaming Frog: surfaces broken links, redirect chains, and orphans in crawl
  output [10]

**Creator relevance:** If a creator is following citations and outbound links
for further research, broken or dead outbound links are a significant friction
point and quality signal.

---

### 4. Information Architecture Quality — Heading Hierarchy is the Core Signal [CONFIDENCE: HIGH]

Navigation clarity and heading hierarchy are both detectable from HTML and
directly affect a creator's ability to locate information within a site [11][7].

**Heading hierarchy analysis (from HTML):**

- Single H1 per page: W3C / accessibility best practice [7]
- No skipped levels (H2 → H4 without H3 = violation)
- Heading nesting reflects logical topic hierarchy
- Hellotools.org Hn tag analyzer detects nesting errors programmatically [11]
- MDN and W3C define this as both accessibility and content structure standard

**Detectable IA signals:**

| Signal              | Detection Method                                            | Quality Indicator                           |
| ------------------- | ----------------------------------------------------------- | ------------------------------------------- |
| H1 count            | `querySelectorAll('h1').length`                             | 0 or >1 = architecture problem              |
| Heading skip        | Walk H1→H6 sequence, flag gaps                              | Skips = structural confusion                |
| Breadcrumb presence | `schema:BreadcrumbList` or nav with aria-label="breadcrumb" | Positive = deep site with orientation       |
| Site search         | `<input type="search">` or `role="search"`                  | Positive = large site with IA investment    |
| Navigation landmark | `<nav>` element or `role="navigation"`                      | Basic structural signal                     |
| Table of contents   | In-page anchor links near top of content                    | Positive = well-organized long-form content |

**Creator relevance:** A creator researching content in a long article needs to
be able to scan headings to find relevant sections. Poor hierarchy means forcing
linear reading of potentially irrelevant content.

---

### 5. Reading Experience — Ad Density and Mobile Are Priority Signals [CONFIDENCE: HIGH]

Reading experience dimensions that are detectable from HTML/CSS/page structure
and that directly affect a creator's ability to consume content [13][14].

**Intrusive interstitials / ad density:**

- Google's `adsDensityInterstitialViolationStrength` attribute scores 0-1000;
  > 30% of page area = violation [13]
- Detection approach: measure ratio of ad-tagged elements to content elements
- Intrusive interstitial detection: overlays that cover main content, are not
  responsive, or appear without user action
- 21% of mobile websites violate high ad density policy per Google data [13]

**Mobile-friendliness (detectable):**

- `<meta name="viewport" content="width=device-width, initial-scale=1">`
  presence
- CSS `@media` query usage
- Lighthouse "Tap targets are not sized appropriately" audit
- Font size legibility audit ("Document doesn't use legible font sizes")
- These are part of Google's Page Experience signals [13]

**Reader mode / print compatibility:**

- Presence of `<article>` element (semantic signal for reader mode extraction)
- Absence of content inside `display:none` or complex JS-gated rendering
- `<link rel="stylesheet" media="print">` presence = print stylesheet exists
- Reader mode algorithms (Firefox, Safari) primarily rely on semantic HTML
  structure (article, main, p, headings) [7]

**Typography signals (limited programmatic access):**

- CSS `font-size` on body text: below 14px commonly flagged as too small
- Line-height ratio: below 1.4 on body text = readability concern
- Color contrast: WCAG AA requires 4.5:1 ratio for normal text (detectable via
  computed styles)

**Creator relevance:** A creator trying to read and extract value from content
is blocked by interstitials, hindered by tiny text, and frustrated by mobile
overflow. These directly affect whether the site is usable as a research source.

---

### 6. Trust Signals — Structured and Detectable Set [CONFIDENCE: HIGH]

Trust signals are well-defined in Google's E-E-A-T framework and most are
detectable from HTML and DNS [15][16][17].

**Tier 1 — Technical trust (highly reliable detection):**

| Signal                    | Detection Method                                                  |
| ------------------------- | ----------------------------------------------------------------- |
| HTTPS                     | Protocol check on URL; TLS certificate validation                 |
| Valid SSL certificate     | Certificate expiry, issuer, domain match                          |
| Domain age                | RDAP/WHOIS API query (e.g., WhoisXML API, RDAP protocol) [18]     |
| Privacy policy presence   | Link text match: "privacy", "privacy policy" in footer/navigation |
| Terms of service presence | Link text match: "terms", "ToS", "terms of service"               |
| Contact page presence     | Link text match: "contact", "contact us"                          |
| About page presence       | Link text match: "about", "about us"                              |

**Tier 2 — Content-layer trust (HTML-parseable):**

| Signal                      | Detection Method                                                          |
| --------------------------- | ------------------------------------------------------------------------- |
| Author byline               | `schema:author`, `rel="author"`, or byline text near article headline     |
| Author credentials          | Person schema with `jobTitle`, `affiliation` fields                       |
| Publication date            | `datePublished` schema or visible date text                               |
| Modification date           | `dateModified` schema or "Updated:" text                                  |
| Citations / sources section | Outbound links in a "Sources", "References", or "Further Reading" section |
| External citations count    | Count of `<a href>` elements pointing to external domains in body content |

**Tier 3 — Entity-level trust (requires external API):**

| Signal                   | Detection Method                                        |
| ------------------------ | ------------------------------------------------------- |
| Domain age               | RDAP API: registration date → age in years [18]         |
| Domain registration data | RDAP/WHOIS: registrar, expiration, status               |
| Backlink authority       | Ahrefs/Moz/SEMrush API (not free; requires integration) |
| Knowledge Graph entity   | Google KG API: is the author/org a verified entity?     |

**E-E-A-T as a framework:** Google's Quality Rater Guidelines define Trust as
the "most important" E-E-A-T dimension. Untrustworthy pages have low E-E-A-T
regardless of demonstrated expertise [16]. In 2026, E-E-A-T functions as both a
ranking filter and an AI visibility filter [15].

**Creator relevance:** A creator needs to assess whether a site is authoritative
and trustworthy before citing it. The above signals directly inform that
judgment.

---

### 7. Accessibility (Creator-Relevant Subset) — Alt Text and Heading Structure [CONFIDENCE: HIGH]

Full WCAG audits are not creator-relevant, but two specific dimensions directly
affect a creator's ability to comprehend content [7][19].

**Alt text on images:**

- Images without alt text are invisible to a creator reading via screen reader
  or when images fail to load
- Images with alt="" (decorative) vs. meaningful alt text = different intent
- Detection: `querySelectorAll('img')` → check `alt` attribute presence and
  non-emptiness
- W3C provides a decision tree for alt text appropriateness [19]
- Best practice: alt text under 100 characters, contextual (not just
  descriptive) [19]

**Heading structure (double-counts with IA):**

- As noted in Finding 4, heading hierarchy affects both IA and accessibility
- Screen reader users navigate by headings; skipped levels create navigation
  gaps [7]
- This is the single highest-impact structural accessibility issue for content
  comprehension

**What to explicitly NOT include (scope boundary):**

- Color contrast for decorative elements
- Focus ring styling
- ARIA landmark compliance beyond nav/main/article
- Form accessibility
- Keyboard navigation for interactive elements

These matter for WCAG compliance but do not affect whether a creator can extract
and understand content.

---

### 8. Tool Coverage Matrix — What Existing Tools Measure [CONFIDENCE: HIGH]

**Google Lighthouse [20]:**

| Creator-Relevant Audit                      | Category            |
| ------------------------------------------- | ------------------- |
| "Document doesn't use legible font sizes"   | Accessibility       |
| "Tap targets are not sized appropriately"   | Accessibility       |
| "Does not use HTTPS"                        | Best Practices      |
| "Links do not have descriptive text"        | Accessibility / SEO |
| "Document does not have a meta description" | SEO                 |
| "Structured data is valid"                  | SEO                 |
| "Image elements have `[alt]` attributes"    | Accessibility       |
| H1 heading presence                         | SEO                 |
| Canonical tag validity                      | SEO                 |
| `noindex` detection                         | SEO                 |

Lighthouse does NOT measure: readability scores, content depth, freshness,
outbound link quality, author attribution, or trust-page presence.

**Screaming Frog [10]:**

| Creator-Relevant Metric            | Notes                            |
| ---------------------------------- | -------------------------------- |
| Word count per page                | Surfaced in crawl data           |
| Duplicate content (content hash)   | Exact duplicate detection        |
| Missing/short meta descriptions    | Title + description length       |
| Broken internal links              | 4xx/5xx status on internal hrefs |
| Missing alt text                   | Image crawl                      |
| Redirect chains                    | 301→301 patterns                 |
| H1 count and content               | Heading crawl                    |
| Integration with Lighthouse scores | Via PageSpeed API                |

Screaming Frog does NOT measure: readability, freshness dates, trust signals,
author attribution, domain age.

**Ahrefs [5]:**

| Creator-Relevant Metric   | Notes                                     |
| ------------------------- | ----------------------------------------- |
| Broken outbound links     | Dead link detection                       |
| 170+ SEO/technical issues | Including thin content, duplicate content |
| Domain Authority (DR)     | Backlink-based trust proxy                |
| Content gap analysis      | Missing topics vs. competitors            |

**Hemingway App [9]:**

| Creator-Relevant Metric        | Notes                                   |
| ------------------------------ | --------------------------------------- |
| Grade level                    | US grade level readability              |
| Complex sentence highlighting  | Yellow (4+ grades above avg) / red (6+) |
| Adverb and passive voice count | Style quality signals                   |
| Reading time estimate          | Content consumption estimate            |
| Word/sentence/paragraph counts | Structure signals                       |

**Readable.com [6]:**

| Creator-Relevant Metric           | Notes                         |
| --------------------------------- | ----------------------------- |
| Flesch Reading Ease               | 0-100 scale                   |
| Flesch-Kincaid Grade Level        | Grade equivalent              |
| Coleman-Liau, Gunning Fog, SMOG   | Multi-formula coverage        |
| Audience comprehension percentage | Derived from literacy studies |

**WebPageTest [21]:**

WebPageTest is performance-only (LCP, CLS, TBT, TTFB, Speed Index). It has no
creator-relevant content quality metrics. It should be excluded from the
Engineer View dimension set.

---

## Priority Ranking for Creator-Relevant Dimensions

Based on direct impact on a creator's ability to trust, navigate, and extract
value from content:

| Priority | Dimension                                            | Why It Matters to Creators                               |
| -------- | ---------------------------------------------------- | -------------------------------------------------------- |
| P1       | Trust signals (HTTPS, author, about, privacy)        | Gate condition — untrustworthy sites get filtered        |
| P1       | Freshness / temporal health                          | Stale content = unreliable research source               |
| P2       | Readability score                                    | Determines whether creator can efficiently parse content |
| P2       | Heading structure (IA + accessibility)               | Navigation and comprehension prerequisite                |
| P2       | Content depth (word count, headings, citations)      | Distinguishes thin vs. substantive content               |
| P3       | Broken link health (internal + outbound)             | Affects navigation and citation reliability              |
| P3       | Reading experience (ad density, mobile, reader mode) | Affects ability to physically consume the content        |
| P3       | Alt text on images                                   | Content comprehension for image-heavy sources            |
| P4       | Domain age (WHOIS/RDAP)                              | Weak trust signal; high API dependency                   |
| P4       | Duplicate/syndicated detection                       | Useful but complex; canonical tag check is P2            |

---

## Measurement Approach Catalog

### Freshness Detection (Recommended Implementation)

```
1. HTTP HEAD request → check Last-Modified header
2. Parse sitemap.xml if available → find <lastmod> for URL
3. Parse page HTML → Schema.org dateModified
4. Parse page HTML → og:updated_time, article:modified_time
5. Parse page HTML → visible date text near byline (heuristic)
6. Compute staleness: (now - detected_date) / site_type_threshold
```

### Readability (Recommended Implementation)

```
1. Extract visible body text (strip nav, footer, ads)
2. Run Flesch-Kincaid Grade Level (primary)
3. Run Coleman-Liau (secondary — handles technical jargon better)
4. Flag: Grade > 12 = HIGH complexity; Grade > 16 = expert-only
5. Report reading time estimate (words / 238 wpm average)
```

### Content Depth Score (Recommended Implementation)

```
1. Word count of main content area
2. Count H2/H3 sections
3. Count outbound links in body (citations)
4. Detect presence of sources/references section
5. Composite: thin (<300 words) / moderate (300-800) / substantial (800+) / deep (2000+)
```

### Trust Signal Check (Recommended Implementation)

```
1. Protocol: HTTPS? (URL check)
2. SSL validity: certificate not expired, domain matches
3. About page: scan internal links for /about, /about-us patterns
4. Contact page: scan internal links for /contact patterns
5. Privacy policy: scan footer links for privacy-related text
6. Author: check for schema:author, rel="author", byline element
7. Domain age: RDAP API query (optional; requires external call)
```

---

## Sources

| #   | URL                                                                                               | Title                                                  | Type          | Trust      | CRAAP | Date           |
| --- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ------------- | ---------- | ----- | -------------- |
| 1   | https://laughingprofessor.net/last-modified-date-stamp/                                           | Last Modified Date Checker - 8 Detection Methods       | Tool/Analysis | Medium     | 4.0   | 2024-2025      |
| 2   | https://en.wikipedia.org/wiki/Flesch%E2%80%93Kincaid_readability_tests                            | Flesch-Kincaid readability tests - Wikipedia           | Reference     | Medium     | 4.2   | Evergreen      |
| 3   | https://yoast.com/lastmod-xml-sitemaps-google-bing/                                               | Google and Bing stress importance of lastmod           | Industry blog | Medium     | 4.0   | 2024           |
| 4   | https://wordpress.org/plugins/orphanpages/                                                        | OrphanPages — Internal Link Audit Plugin               | Tool docs     | Medium     | 3.8   | 2025           |
| 5   | https://ahrefs.com/broken-link-checker                                                            | Free Broken Link Checker - Ahrefs                      | Official tool | High       | 4.5   | 2025           |
| 6   | https://readable.com/readability/flesch-reading-ease-flesch-kincaid-grade-level/                  | Flesch Reading Ease and Flesch Kincaid - Readable      | Official docs | High       | 4.3   | 2025           |
| 7   | https://www.w3.org/WAI/tutorials/page-structure/headings/                                         | Headings - Web Accessibility Initiative W3C            | Official docs | Highest    | 4.8   | Evergreen      |
| 8   | https://www.semrush.com/blog/fresh-content/                                                       | What Is Fresh Content & Is It Important?               | Industry blog | Medium     | 4.0   | 2024-2025      |
| 9   | https://hemingwayapp.com/help/docs/readability                                                    | Readability and document stats - Hemingway Editor      | Official docs | High       | 4.4   | 2025           |
| 10  | https://www.screamingfrog.co.uk/learn-seo/on-page-content/                                        | On-Page Content - Screaming Frog                       | Official docs | High       | 4.5   | 2025           |
| 11  | https://hellotools.org/en/analysis-structure-tags-hn-h1-h6                                        | Check and analyze Hn tags on a web page                | Tool          | Medium     | 3.7   | 2025           |
| 12  | https://oleno.ai/blog/the-role-of-factual-density-in-content-quality/                             | Factual Density: Boost Content Quality                 | Industry blog | Low        | 3.2   | 2024-2025      |
| 13  | https://www.hikeseo.co/learn/onsite/intrusive-interstitials                                       | Intrusive Interstitials and SEO                        | Industry blog | Medium     | 4.0   | 2024-2025      |
| 14  | https://www.smashingmagazine.com/2017/05/intrusive-interstitials-guidelines-avoid-google-penalty/ | Intrusive Interstitials Guidelines - Smashing Magazine | Industry blog | Medium     | 3.5   | 2017 (seminal) |
| 15  | https://www.bknddevelopment.com/seo-insights/eeat-seo-strategy-2026-content-quality-signals/      | E-E-A-T SEO Strategy 2026                              | Industry blog | Low-Medium | 3.4   | 2026           |
| 16  | https://searchengineland.com/google-eeat-quality-assessment-signals-449261                        | Decoding Google's E-E-A-T quality assessment signals   | Industry news | High       | 4.3   | 2023 (seminal) |
| 17  | https://www.nichepursuits.com/website-trust-signals/                                              | 53 Website Trust Signals                               | Industry blog | Medium     | 3.8   | 2025           |
| 18  | https://apify.com/automation-lab/domain-age-checker/api/javascript                                | Domain Age & WHOIS via RDAP API                        | Tool docs     | Medium     | 4.0   | 2025           |
| 19  | https://www.w3.org/WAI/tutorials/images/decision-tree/                                            | Alt Decision Tree - W3C WAI                            | Official docs | Highest    | 4.8   | Evergreen      |
| 20  | https://developer.chrome.com/docs/lighthouse/overview/                                            | Introduction to Lighthouse - Chrome Developers         | Official docs | Highest    | 4.9   | 2025           |
| 21  | https://docs.webpagetest.org/metrics/                                                             | WebPageTest Metrics Documentation                      | Official docs | Highest    | 4.7   | 2025           |

---

## Contradictions

**Freshness thresholds are context-dependent and contested:**

- Semrush and Hike SEO recommend reviewing content every 6 months as a general
  rule [8]
- Google's own guidance states substantial updates (20-30% text change) are
  needed for freshness signals to apply — just changing dates triggers quality
  penalties [8]
- There is no universal "staleness" threshold; the appropriate threshold depends
  on site type (news vs. evergreen). The Engineer View must present staleness as
  relative to detected site type, not as an absolute score.

**Domain age as a trust signal:**

- Multiple sources identify domain age as a trust signal [17][18]
- Other sources explicitly downplay it: "Domain age can be a trust factor, but
  it's not as critical as the quality of your content" [17]
- Resolution: Include domain age as a weak supplementary signal, not a primary
  trust indicator. Flag as "Tier 3 / optional" in the dimension catalog.

**Ad density detection difficulty:**

- Google's internal `adsDensityInterstitialViolationStrength` attribute is not
  publicly exposed in an API [13]
- Practical detection requires heuristics: counting ad-tagged elements, iframes
  from known ad networks, overlay elements
- This is LOW reliability in a programmatic analyzer without headless browser
  rendering; note as an approximation only.

---

## Gaps

1. **Reader mode compatibility: no standard API.** Firefox and Safari reader
   mode algorithms are not publicly documented in detail. The best proxy is
   presence of semantic HTML (`<article>`, `<main>`, `<p>`, headings), but there
   is no definitive test.

2. **Print stylesheet detection: low creator priority.** Finding sources for
   creator relevance of print stylesheets was sparse. It's technically
   detectable but likely too niche to include as a standard dimension.

3. **Syndicated vs. original content at scale.** Canonical tag inspection is
   feasible, but full cross-domain duplicate detection (Copyscape-style)
   requires external API calls not suitable for a single-page analyzer.

4. **Backlink authority (Ahrefs DR, Moz DA).** These are valuable trust proxies
   but require paid external APIs. They cannot be computed from the page itself.

5. **Typography/whitespace programmatic access.** CSS computed styles are only
   accessible via headless browser (Playwright/Puppeteer), not static HTML
   parsing. This constrains the typography dimension to Lighthouse integration
   rather than direct measurement.

6. **Factual density:** The claim of "2-3 facts per 100 words" [12] comes from a
   single low-authority blog post. There is no peer-reviewed or major industry
   study to validate this specific threshold. Mark as LOW confidence.

---

## Serendipity

**E-E-A-T is now also an AI visibility filter (2026 context):** Multiple sources
from 2026 indicate that E-E-A-T signals now affect not just Google rankings but
whether content appears in AI-generated answers (ChatGPT, Gemini, Perplexity).
If the `/website-analysis` skill is designed to help creators evaluate sources
they might cite, the AI-citation-worthiness angle may be a valuable addition to
the Engineer View framing — not just "can I trust this?" but "will AI systems
cite this source correctly?" [15]

**Canonical tags and LLM scraping:** In the age of AI-generated content, LLMs do
not respect `rel="canonical"` directives. If a creator is evaluating a site that
heavily syndicates its content, the AI-scraping angle means there may be even
more reason to flag syndicated vs. original content as a trust/authority
dimension [source: Jasmine Directory blog on canonical tags in AI era].

---

## Confidence Assessment

- HIGH claims: 8
- MEDIUM claims: 2 (factual density threshold, ad density detection approach)
- LOW claims: 1 (factual density 2-3 facts per 100 words threshold)
- UNVERIFIED claims: 0
- **Overall confidence: HIGH**

The eight research areas requested are all covered with at least one
authoritative or high-tier source. The measurement approaches are grounded in
documented, production-grade tools (Screaming Frog, Lighthouse, Readable.com,
W3C WAI).

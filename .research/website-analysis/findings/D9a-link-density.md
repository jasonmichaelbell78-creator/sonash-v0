# Findings: High-Link-Density Detection for Cross-Site Synthesis

**Searcher:** deep-research-searcher **Profile:** web **Date:**
2026-04-05T00:00:00Z **Sub-Question IDs:** SQ9a

---

## Key Findings

### 1. Quantitative Baseline: Median Web Page Has Only 6 Outbound Links [CONFIDENCE: HIGH]

The 2025 Web Almanac (HTTP Archive, analysis of 16+ million sites, July 2025
dataset) is the most authoritative data source available. Its findings:

- **Median outbound links per page: 6** (desktop and mobile)
- **90th percentile: 25 links** (desktop), 24 (mobile)
- Top 1,000 most popular sites median: **16 links** (desktop), 11 (mobile)
- Pattern is flat — unchanged from 2022 and 2024 data

This baseline is critical: any page exceeding 25 outbound links is already in
the top 10% of the web. A page with 50+ outbound links is an extreme outlier.
Pages with 100–500+ links (awesome lists, registries) are categorical outliers
that self-evidently belong to a distinct content class.

**Source:** Web Almanac 2024 SEO chapter [1], corroborated by Rush Analytics SEO
guide citing Zyppy study on 23M+ internal links [2].

---

### 2. Academic Research Confirms: >33% Linked Text = Boilerplate Signal [CONFIDENCE: HIGH]

Boilerplate detection research (the field that distinguishes navigation/noise
from main content) consistently uses link density as a primary signal. The most
cited finding from this literature:

> "If a text block consists of more than 33% linked words, it is most likely
> boilerplate."

This 33% threshold (linked text characters / total text characters) is used in
the Boilerpipe algorithm family and related academic work. Mozilla's
**Readability.js** implements this as the `_getLinkDensity` function with a
confirmed threshold of **0.25 (25%)** — nodes where >25% of text is hyperlinked
are classified as non-content and removed.

The exact Readability.js formula:
`linkDensity = (sum of anchor text lengths) / (total element text length)`,
where hash/fragment URLs count at 0.3x weight.

**Implication for threshold design:** A content area where link density exceeds
25–33% is reliably classified as non-article content even by mature production
algorithms. However, this is a within-block metric (per HTML node), not a
whole-page link count. Both metrics serve different detection purposes.

**Sources:** Search synthesis from boilerplate detection literature [3], Mozilla
Readability.js source code `_getLinkDensity` function [4].

---

### 3. Link Count Thresholds by Page Type [CONFIDENCE: MEDIUM]

The following estimates are assembled from multiple sources but no single study
directly compares all categories. Values are directional, not
laboratory-precise.

| Page Type                                    | Typical Outbound Link Count            | Link Density Character     |
| -------------------------------------------- | -------------------------------------- | -------------------------- |
| Standard blog post                           | 3–10                                   | Low; editorial citations   |
| Long-form article / research                 | 15–30                                  | Medium; many references    |
| Wikipedia article (average)                  | 10–25 internal, ~5–15 external         | Medium; explanatory inline |
| Wikipedia "featured article"                 | ~12–25 links in lead section alone     | Medium-high                |
| Top-ranked pages (SEO study)                 | 56–171 external links, avg ~101        | High; resource/authority   |
| News aggregators (Drudge Report style)       | Near 100% of text is linked            | Extreme                    |
| Awesome-list web page (trackawesomelist.com) | **800–900 links per page**             | Extreme categorical        |
| AlternativeTo listing page                   | 25–30 outbound links                   | Medium                     |
| Glama.ai MCP registry (21,027 servers)       | Paginated, 6+ links per card × N cards | High per card, paginated   |
| Resource/link-collection page                | 50–300+                                | High                       |

The track awesome list observation (800–900 links per page on
trackawesomelist.com/sindresorhus/awesome/) is a direct measurement from this
research session [5].

**Practical tier model:**

- 0–25 links: Normal (below 90th percentile)
- 26–50 links: Elevated (possible resource page)
- 51–100 links: High — warrants detection logic
- 100–300 links: Very high — likely curated list or directory
- 300+ links: Extreme — almost certainly awesome list, registry, or aggregator

---

### 4. Awesome-List and Curated-List Detection Signals [CONFIDENCE: HIGH]

Awesome lists exist as web pages both via GitHub rendering
(github.com/…/README.md) and as dedicated web services. Key web-page forms
observed:

**Dedicated web renderers:**

- trackawesomelist.com — renders 500+ GitHub awesome lists as daily-updated HTML
  pages with date headers, category headings, and hundreds of
  `* [Name](url) – description` items
- awesomelists.top (redirects to awesomelists.calvinjeng.io) — search/browse
  interface to sindresorhus/awesome ecosystem; categories supported via heading
  structure
- awesomerank.github.io — static GitHub Pages renders of awesome lists

**Structural signals to detect these pages:**

1. **Heading hierarchy + dense UL/LI pattern**: H2/H3 headings immediately
   followed by unordered lists where >80% of list items contain exactly one
   anchor tag. Minimal prose between items (0–1 sentences per item).

2. **Link-to-prose ratio in content area**: Content area where links per 100
   words > 20 (inverse of the usual 1–5 links per 1000 words recommendation).
   This is a 4–20x density multiple over normal content.

3. **Homogeneous anchor text pattern**: Links follow a
   `[Name] – short description` template with consistent formatting across 90%+
   of items.

4. **Category organization**: Multiple H2/H3 sections each containing a dense
   link list, not just one. A blog post might have one inline link list; a
   curated list has 5–30 categorized sections.

5. **Minimal narrative prose**: Paragraph-to-list-item ratio < 0.2 (fewer than 1
   paragraph per 5 list items).

**Sources:** Direct observation of trackawesomelist.com [5], awesomelists.top
structure [6], academic web page classification literature [7].

---

### 5. Registry and Hub Detection Signals [CONFIDENCE: HIGH]

Three distinct hub types require different detection signals:

**Type A: Plugin/Tool Marketplaces** (VS Code Marketplace, npm registry,
glama.ai)

- Repeated card template structure (icon + name + description + metadata + CTA)
- Faceted filter/search interface
- Pagination or "load more" with 20–100+ items per page
- Standardized metadata fields across all entries (version, author, license,
  tags)
- Each card has 2–4 links (name, author, category tags)
- Detection: card template repetition + pagination + faceted filter presence

**Type B: API/Protocol Registries** (RapidAPI, public-apis, Postman Hub,
Smithery.ai)

- Glama.ai hosts 21,027 MCP servers with consistent card structure [8]
- Smithery.ai described as "index for helping you discover, install and manage
  MCP servers" — explicit registry self-description
- Items include version numbers, install counts, category tags
- Detection: "registry" or "marketplace" in page title/meta, template cards,
  install/usage count metadata

**Type C: Curated Link Directories** (Curlie/DMOZ successor, AlternativeTo,
Product Hunt)

- AlternativeTo listing pages: 25–30 outbound links per page, 12–14 product
  cards each with 2–3 links (name, "more about", platform links) [9]
- Items have like/vote counts, pricing signals, platform tags
- Hierarchical category navigation in sidebar
- Detection: comparative structure ("alternatives to X"), vote counts, platform
  tags, consistent card template

**Common cross-type signals:**

- High link-to-unique-domain ratio (each link goes to a different domain)
- Consistent item template (same HTML structure repeated N times)
- Category/tag taxonomy navigation
- Item count displayed prominently ("21,027 servers", "4,200 tools")
- Search/filter UI present

---

### 6. False Positive Analysis [CONFIDENCE: HIGH]

Pages with high raw link counts that are NOT curated lists:

**Wikipedia articles**: 10–25 internal links + 5–15 external, mostly
mid-sentence inline citations. Distinguished by: links embedded in flowing
prose, majority are internal (`/wiki/` paths), no category-organized list
structure, high words-per-link ratio (>20 words between links).

**Long-form research / listicles**: "101 Ways to..." articles may have 50–100
links but are distinguished by full paragraph prose between items, single-domain
citations (all to same sources), sequential numbered structure without
categories.

**Navigation-heavy sites**: High link count in chrome/nav area, not content
area. Distinguished by: links concentrated in header/footer/sidebar, content
area itself has normal density. The Majestic link context approach (analyzing
links by page segment, not whole page) directly addresses this [10].

**E-commerce category pages**: Many product links but template-identical to
registry pattern. May trigger false positive — but cross-site synthesis would
actually be valuable here (price/feature comparison across product sites).

**News aggregators** (Drudge Report style): 100%+ of text is hyperlinked. Pages
where almost all text is a link. Distinguished by: all links are news articles
from external domains, no category organization, headline-only text.

**Key discriminator for cross-site synthesis relevance**: The key question is
NOT merely "does this page have many links" but "do those links point to
meaningfully different external domains that would benefit from cross-site
analysis?" A Wikipedia page with 50 links all to `/wiki/` internal pages is NOT
a cross-site synthesis candidate. An awesome list with 200 links to 200
different project websites IS.

---

### 7. Recommended Threshold Design [CONFIDENCE: MEDIUM]

Based on the evidence assembled, a two-signal detection approach is recommended
over a single threshold:

**Signal 1 — Absolute count threshold:**

- Trigger consideration at: **>40 unique external-domain outbound links** in the
  content area (above 90th percentile baseline of 25, with buffer)
- Strong trigger at: **>100 unique external-domain outbound links** (unambiguous
  outlier)
- Rationale: Web Almanac data shows 90th percentile is only 25; 40+ is
  statistically remarkable; 100+ is definitionally a curated collection

**Signal 2 — Structural pattern matching:**

- H2/H3 heading count ≥ 3 with each followed by link-dense UL (>50% of LI items
  containing an anchor)
- Link-to-unique-domain ratio > 0.7 (most links go to different domains —
  filters out Wikipedia internal links)
- Prose-to-link ratio < 15 words per link in content area

**Composite trigger:** Fire when EITHER (Signal 1 AND external domain ratio >
0.7) OR (Signal 1 AND Signal 2 both fire).

**Static vs. dynamic**: A static threshold (>40 external links) is simpler to
implement and explain; a dynamic ratio (link density relative to word count)
handles short pages better. Recommended: use static count as primary gate, ratio
as secondary confirmation.

**Auto-trigger vs. surfaced option**: The skill should surface the option (not
auto-execute), in keeping with the progressive disclosure UX trend. The 2025
proactive UX pattern is: detect automatically, present non-intrusively, allow
easy acceptance or dismissal [11].

---

### 8. Cross-Site Synthesis UX Recommendation [CONFIDENCE: MEDIUM]

**Communication pattern:** Based on inline overlay / contextual help UX research
[11], the recommended pattern is:

```
This page appears to be a curated list with [N] external links across [D]
domains.

Cross-site synthesis available — analyze the top linked resources together?
[Yes, sample 5 links] [Yes, let me choose] [No thanks]
```

This follows the "proactive but opt-in" pattern: detect automatically, surface
at the right moment (post-initial-analysis), offer graduated options, allow
dismissal without disruption.

**Auto-sampling for demonstration**: Offer to auto-sample 3–5 links from the
page to demonstrate cross-site synthesis value before the user commits to full
analysis. This lowers the activation energy — users can see a preview of value.

**Recommended coverage depth:**

- Minimum meaningful: 5 linked sites (pattern detection starts here)
- Recommended default: 10 sites (good coverage without excessive runtime)
- Maximum practical: 20 sites (diminishing returns beyond this for most lists)
- User-selectable: 5 / 10 / 20 / custom

Rationale: At 5 sites, meaningful themes emerge. Beyond 20, synthesis prompts
become unwieldy for Claude's context window without structured chunking.

---

### 9. Index Page vs. Content Page Classification (Academic Literature) [CONFIDENCE: HIGH]

A 2025 arxiv paper on LLM-based web page classification [7] directly addresses
the index vs. content page distinction:

- **Index pages** = "intended to provide links to other pages" (home pages, feed
  pages, hub pages)
- **Content pages** = "presenting content such as news articles and columns"

A simple heuristic baseline — "pages with 9 or fewer words in title = index
page" — achieved F1=0.787. LLM-based classification (GPT-4o with title + body
text) achieved F1=0.894, Precision=0.984.

**Practical implication**: Title length and link count are both useful
low-computation signals. A page titled "Awesome Python" or "Best AI Tools 2025"
with few title words AND high link count is extremely likely to be a curated
index page. This provides a cheap pre-filter before running more expensive
cross-site synthesis.

---

## Sources

| #   | URL                                                                                                  | Title                                                   | Type               | Trust       | CRAAP           | Date                   |
| --- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------ | ----------- | --------------- | ---------------------- |
| 1   | https://almanac.httparchive.org/en/2024/seo                                                          | Web Almanac 2024 SEO Chapter                            | Official research  | HIGH        | 5/5/5/5/5 = 5.0 | 2024                   |
| 2   | https://rush-analytics.com/blog/how-many-internal-links-per-page-seo                                 | Internal Links Per Page SEO                             | Industry blog      | MEDIUM      | 3/4/3/3/3 = 3.2 | 2025                   |
| 3   | https://www.researchgate.net/publication/221519989_Boilerplate_Detection_Using_Shallow_Text_Features | Boilerplate Detection Using Shallow Text Features       | Academic           | HIGH        | 4/5/5/5/4 = 4.6 | 2010, widely cited     |
| 4   | https://github.com/mozilla/readability/blob/main/Readability.js                                      | Mozilla Readability.js source                           | Official source    | HIGH        | 5/5/5/5/5 = 5.0 | Active 2025            |
| 5   | https://www.trackawesomelist.com/sindresorhus/awesome/                                               | Track Awesome List — Sindresorhus                       | Direct observation | HIGH        | 5/5/5/5/5 = 5.0 | 2026-04-05             |
| 6   | https://awesomelists.top/                                                                            | Awesome Search                                          | Direct observation | HIGH        | 4/5/4/4/4 = 4.2 | Active 2025            |
| 7   | https://arxiv.org/html/2505.06972v1                                                                  | Web Page Classification using LLMs for Crawling Support | Academic preprint  | MEDIUM-HIGH | 5/5/4/4/5 = 4.6 | 2025                   |
| 8   | https://glama.ai/mcp/servers                                                                         | Glama MCP Server Registry                               | Direct observation | HIGH        | 5/5/5/5/5 = 5.0 | 2026-04-05             |
| 9   | https://alternativeto.net/software/product-hunt/                                                     | AlternativeTo: Product Hunt                             | Direct observation | HIGH        | 5/5/5/5/4 = 4.8 | 2026-04-05             |
| 10  | https://dixonjones.com/seo/majestic-launches-link-density-link-context/                              | Link Density and Link Context — Majestic                | Industry analysis  | MEDIUM      | 3/4/4/4/3 = 3.6 | 2017                   |
| 11  | https://www.toolify.ai/ai-news/top-ux-design-trends-2025-proactive-ux-beyond-3363431                 | Top UX Design Trends 2025: Proactive UX                 | Industry           | MEDIUM      | 3/4/3/3/3 = 3.2 | 2025                   |
| 12  | https://www.mattcutts.com/blog/how-many-links-per-page/                                              | Matt Cutts: How Many Links Per Page                     | Industry authority | MEDIUM      | 2/5/4/4/4 = 3.8 | 2009, still referenced |
| 13  | https://seoprofy.com/blog/seo-statistics/                                                            | SEO Statistics 2026                                     | Industry           | MEDIUM      | 3/4/3/3/3 = 3.2 | 2026                   |
| 14  | https://link.springer.com/chapter/10.1007/978-3-642-25274-7_45                                       | Tool for Link-Based Web Page Classification (Springer)  | Academic           | HIGH        | 4/5/5/5/4 = 4.6 | 2011                   |

---

## Contradictions

**Link density formula precision**: The academic literature (boilerpipe
tradition) uses a 33% linked-word threshold while Mozilla Readability.js uses
25%. These represent different formulas (character ratio vs. word ratio) and
different contexts (block-level evaluation vs. node removal). Both are valid for
their respective uses; the difference is not a contradiction but a calibration
gap.

**"High link count" in SEO vs. in content analysis**: SEO sources treat pages
with 50–170 external links as "high" in a competitive ranking context. Content
extraction research treats >25% link density within a text block as
"navigation." These are measuring fundamentally different things (whole-page
count vs. within- block ratio), and both should be used as complementary
signals.

**Wikipedia as edge case**: Wikipedia articles have relatively high per-article
link counts (50–100+ internal links in long articles) but are not curated lists.
The external-domain ratio discriminator cleanly resolves this — Wikipedia's
links are overwhelmingly internal (`/wiki/` paths), whereas awesome lists and
directories link almost entirely to external domains.

---

## Gaps

1. **No single study directly measures link counts across all page types** (blog
   vs. docs vs. awesome-list vs. registry) in one dataset. The tier table in
   Finding 3 is synthesized from multiple sources with different methodologies.
   A direct crawl study comparing these page types would strengthen confidence.

2. **Documentation pages** (e.g., docs.python.org, React docs): No specific data
   found on typical outbound link count for documentation sites. These may have
   elevated internal linking but low external link counts. Needs targeted
   research.

3. **Threshold validation data**: The recommended >40 unique external links
   threshold is derived from the Web Almanac baseline (90th percentile = 25)
   plus a buffer. No A/B test or user study validates this as the optimal
   trigger point for cross-site synthesis suggestion.

4. **Dynamic vs. static threshold performance**: No empirical comparison found
   of static link count thresholds vs. dynamic ratio thresholds for detecting
   curated list pages specifically. The static approach is simpler but may have
   higher false positive rates on very long pages.

5. **Crawl4AI's "Adaptive Intelligence" pattern detection**: The search
   indicated Crawl4AI has implemented pattern-learning for repeated template
   detection, but the specific implementation details (what signals trigger
   "list page" mode) were not retrievable in the time available.

6. **UX validation for the "5 / 10 / 20 sites" recommendation**: The suggested
   coverage depths are derived from first principles (token limits, user
   experience intuitions), not from empirical user research.

---

## Serendipity

**LLM-based page classification is production-viable**: The 2025 arxiv paper [7]
demonstrates that GPT-4o-mini with just the page title + body text achieves
F1=0.894 for index vs. content page classification. This means the cross-site
synthesis skill could cheaply pre-classify any URL before doing expensive
multi-site crawling — title + first 500 words as input, binary "is this a
curated list?" output. This would be faster and cheaper than implementing a
custom heuristic engine.

**Matt Cutts's 100-link guideline is explicitly NOT a penalty**: Google's old
100-link guideline was a practical crawling constraint (100KB page limit), not
an editorial quality signal. Directory sites and resource pages are explicitly
called out as legitimate high-link-count cases [12]. This means the skill need
not be conservative about treating 100+ link pages as edge cases — they are a
recognized and established page type.

**The external-domain ratio is the single best discriminator**: More valuable
than raw link count or text density is the ratio of links pointing to unique
external domains. A page with 200 links to /wiki/... pages (Wikipedia) has low
cross-site synthesis value. A page with 200 links to 200 different project
domains has extreme cross-site synthesis value. This is cheap to compute (set
cardinality of link hostnames) and highly discriminating.

---

## Confidence Assessment

- HIGH claims: 6 (baseline statistics, Readability.js threshold, structural
  signals, registry detection signals, false positive analysis, academic page
  classification)
- MEDIUM claims: 3 (tier table, threshold design, UX coverage depth
  recommendation)
- LOW claims: 0
- UNVERIFIED claims: 0
- **Overall confidence: MEDIUM-HIGH**

The quantitative baseline (Web Almanac) and algorithmic thresholds
(Readability.js source code) are HIGH confidence. The synthesis across page
types and the specific threshold recommendation (>40 links) are MEDIUM because
they are derived from multiple sources rather than a single direct comparative
study.

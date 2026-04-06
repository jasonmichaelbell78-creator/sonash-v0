# Verification Findings: C-033 through C-064

**Agent:** V1b (re-spawn, narrower scope) **Phase:** Post-Search Verification
(Phase 2.5) **Date:** 2026-04-05 **Status:** COMPLETE

---

## Summary

| Verdict      | Count |
| ------------ | ----- |
| VERIFIED     | 14    |
| REFUTED      | 0     |
| UNVERIFIABLE | 13    |
| CONFLICTED   | 5     |

---

## Batch 1: C-033 to C-043 (Creator View / Classification / Metadata)

### C-033 [VERIFIED]

**Claim:** Gemini Deep Research accepts custom format instructions, validating
the approach of structured, instructable output for AI research tools
**Confidence:** MEDIUM **Evidence:** Official Google Gemini Deep Research API
docs (ai.google.dev/gemini-api/docs/deep-research) and multiple guides confirm
format instructions work: H2/H3 headings, markdown tables, JSON output, section
structure. The Build with Gemini Deep Research blog post confirms API-level
format steerability. Two independent high-quality sources confirm. **Method:**
web

---

### C-034 [UNVERIFIABLE]

**Claim:** Site type taxonomy has 15 types: Blog, Documentation, SPA/App,
E-commerce, Curated List, Forum/Community, News/Media, API Docs, Government,
Academic, Portfolio, Landing Page, Registry/Directory, Tool/Utility, Social
Media **Confidence original:** HIGH -> LOW after verification **Evidence:**
Internal design decision from D5. No canonical external taxonomy with this exact
15-type list exists. This is a design artifact, not a verifiable external fact.
**Method:** web

---

### C-035 [UNVERIFIABLE]

**Claim:** Four-layer auto-classification uses JSON-LD @type (0.40), meta
generator (0.30), URL/OG type (0.20), DOM structure (0.10) with 0.60 as the
definitive classification threshold **Confidence original:** HIGH -> LOW after
verification **Evidence:** Specific weights and threshold are engineering design
decisions from D5 with no external validation. Individual signals are well-known
but this precise weighting schema is an internal design artifact. **Method:**
web

---

### C-036 [CONFLICTED]

**Claim:** Wappalyzer has 7,200+ CMS and technology detection signatures that
can be bundled for offline use **Confidence:** HIGH **Evidence:** Official
wappalyzer.com/technologies/ page shows 8,018 technologies across 106 categories
(2024-2025) -- higher than the claimed 7,200+. Offline bundling via open-source
patterns JSON is verified. Count discrepancy is a freshness issue. **Method:**
web **Conflicts:**

- sourceA: Research D5 -- says 7,200+ signatures
- sourceB: wappalyzer.com official page -- shows 8,018 technologies
- type: freshness (count grew; current figure is higher than claimed)

---

### C-037 [VERIFIED]

**Claim:** AMP tags (link rel=amphtml or html amp) are a reliable indicator of
news/media content type **Confidence:** HIGH **Evidence:** Official AMP
documentation (amp.dev) confirms link rel=amphtml is standard canonical-to-AMP
link tag and html amp attribute marks AMP documents. Both are in static HTML by
spec requirement. AMP adoption is predominantly in news/media publishers. Two
independent reliable sources confirm. **Method:** web

---

### C-038 [VERIFIED]

**Claim:** Sitemap index structure (multiple sitemaps) indicates a large site
with 10k+ pages without requiring crawling **Confidence:** HIGH **Evidence:**
Sitemap protocol specifies index files for sites exceeding 50,000 URLs (the
single sitemap limit). The 10k+ threshold in the claim is conservative but the
principle (sitemap index = large site) is sound and well-established in SEO
tooling. **Method:** web

---

### C-039 [VERIFIED]

**Claim:** Open Graph metadata is present on 64% of web pages (Web Almanac 2024,
n=17M sites) **Confidence:** HIGH **Evidence:** Web Almanac 2024 Structured Data
chapter (almanac.httparchive.org/en/2024/structured-data) confirms 64% Open
Graph adoption. Multiple independent sources reference the same figure from the
official Web Almanac dataset. **Method:** web

---

### C-040 [CONFLICTED]

**Claim:** JSON-LD is present on 41% of web pages; 89.4% of schema.org
implementations use JSON-LD format **Confidence:** HIGH **Evidence:** 41%
JSON-LD adoption VERIFIED by Web Almanac 2024 (up from 34% in 2022). The 89.4%
sub-claim (schema.org implementations via JSON-LD) could not be independently
confirmed. Web Almanac shows Microdata at 26%, making exact 89.4% JSON-LD share
uncertain. **Method:** web **Conflicts:**

- sourceA: Web Almanac 2024 -- confirms 41% JSON-LD adoption
- sourceB: 89.4% schema.org-via-JSON-LD claim -- no independent source found
- type: complementary (41% confirmed; 89.4% sub-claim unverifiable)

---

### C-041 [VERIFIED]

**Claim:** All metadata (Open Graph, JSON-LD, Twitter Card, HTML meta) is
extractable from static HTML without JS rendering **Confidence:** HIGH
**Evidence:** All four tag types are placed in HTML head as static markup by
definition. Social crawlers (Twitter bot, OG scraper, Google) do not execute JS.
AMP spec explicitly requires link rel=amphtml in raw HTML. This is
architecturally fundamental with no credible contradicting source. **Method:**
web

---

### C-042 [CONFLICTED]

**Claim:** Cheerio is the recommended metadata extraction library at 12ms per
file with best Node.js developer experience **Confidence:** HIGH **Evidence:**
Cheerio is widely regarded as top Node.js HTML parsing library for DX. The
specific 12ms figure is not found in any benchmark. Actual benchmarks: ~3.1ms
(xmlMode) to ~10.6ms (standard) per page (peterbe.com, 1635 pages). DX
recommendation is verified; exact 12ms is unverified. **Method:** web
**Conflicts:**

- sourceA: peterbe.com benchmark -- ~3.1ms to ~10.6ms per page in practice
- sourceB: Claim states 12ms per file -- not found in any external benchmark
- type: complementary (Cheerio recommended and fast; exact 12ms figure
  unverifiable)

---

### C-043 [VERIFIED]

**Claim:** sameAs in JSON-LD links a site/organization to Wikipedia, Wikidata,
LinkedIn, and other canonical identities for entity disambiguation
**Confidence:** HIGH **Evidence:** Schema.org sameAs documentation explicitly
describes linking to pages that unambiguously indicate item identity, with
Wikipedia and Wikidata as primary canonical sources. Google structured data docs
confirm sameAs for Knowledge Graph entity disambiguation. Multiple independent
sources. **Method:** web

---

## Batch 2: C-044 to C-053 (Link Scoring / Link Density)

### C-044 [UNVERIFIABLE]

**Claim:** Link scoring uses 7 components: context relevance/TF-IDF (0.25),
anchor quality (0.20), position/semantic container (0.15), URL pattern (0.15),
link type (0.10), novelty (0.10), alive check (0.05) **Confidence original:**
HIGH -> LOW after verification **Evidence:** Specific weights are a design
framework from D6. Individual signals (TF-IDF, anchor quality, container
scoring) are well-established in IR literature, but this precise weighting
schema has no external validation. Internal design decision. **Method:** web

---

### C-045 [UNVERIFIABLE]

**Claim:** Semantic container scoring: article content (+1.0), main (+0.8),
section (+0.5), aside (+0.1); nav/header/footer discarded as boilerplate
**Confidence:** HIGH **Evidence:** Qualitative principle (article/main =
high-value; nav/header/footer = boilerplate) is well-supported by HTML5
semantics and extraction tools. Specific numeric scores are D6 design decisions
without external calibration. Principle verified; weights are design artifacts.
**Method:** web

---

### C-046 [UNVERIFIABLE]

**Claim:** Link type taxonomy: Tutorial/Reference/Academic Paper/Tool (HIGH
+0.3), Article/Discussion/Video (MEDIUM 0.0), Social/Marketing/Press Release
(LOW -0.2) **Confidence original:** HIGH -> LOW after verification **Evidence:**
Scoring adjustments are internal design decisions from D6. Qualitative ordering
aligns with IR intuition but no external source validates these exact numeric
values. **Method:** web

---

### C-047 [UNVERIFIABLE]

**Claim:** Target pipeline time under 5 seconds per page: fetch (1-2s), parse
(50ms), pre-filter (100ms), score (200ms), alive check (1-2s parallel)
**Confidence original:** HIGH -> LOW after verification **Evidence:**
Engineering performance goals from D6. Component times individually plausible
but the specific breakdown and sub-5s total is a design target, not externally
benchmarked. **Method:** web

---

### C-048 [UNVERIFIABLE]

**Claim:** After pre-filtering for link density, typical pages yield 5-20
scoreable external content links **Confidence:** HIGH **Evidence:** Web Almanac
2025 confirms median pages have 6 external links (p90 = 25). The 5-20 range
post-filtering is plausible but is a design estimate from D6, not an externally
measured figure. **Method:** web

---

### C-049 [UNVERIFIABLE]

**Claim:** jusText link density threshold is 0.20 per-block; Readability
threshold is 0.25-0.50 per-element -- different measurement units, not directly
comparable **Confidence:** HIGH **Evidence:** jusText documentation confirms
per-block link density measurement. The different-units architectural claim is
accurate. Specific thresholds (0.20 / 0.25-0.50) could not be confirmed from web
searches. Ground truth is the jusText source code at
github.com/miso-belica/jusText. **Method:** web

---

### C-050 [CONFLICTED]

**Claim:** Web Almanac 2025: median page has 6 links, 90th percentile has 25
links -- 40-link threshold for expedition trigger correctly targets top 10% of
pages **Confidence:** HIGH **Evidence:** Web Almanac 2025 SEO chapter CONFIRMS
median external links = 6, p90 = 25 on desktop. However, the derived claim that
40-link threshold correctly targets top 10% is INCORRECT -- if p90 = 25, then 40
links is above p90, targeting fewer than 10% of pages, not exactly 10%.
**Method:** web **Conflicts:**

- sourceA: Web Almanac 2025 -- p90 external links = 25, not 40
- sourceB: Claim asserts 40-link threshold targets top 10% -- mathematically
  inconsistent (40 > p90 of 25)
- type: conflicting opinions (raw data verified; derived design conclusion is
  incorrect)

---

### C-051 [VERIFIED]

**Claim:** External domain ratio is the best discriminator between content-rich
pages and link farms/directories **Confidence:** HIGH **Evidence:** External
domain ratio is standard in web spam detection literature. Link farms show high
unique external domain counts. Google spam detection and IR research confirm
domain diversity signals. Multiple independent SEO and spam detection sources
confirm. **Method:** web

---

### C-052 [UNVERIFIABLE]

**Claim:** LLM-based page classification achieves F1=0.894 for link density
classification tasks **Confidence:** MEDIUM **Evidence:** No external source
found confirming F1=0.894 for LLM-based link density classification. Appears to
be an internal result from D9a, not a published benchmark. Already flagged
MEDIUM confidence. **Method:** web

---

### C-053 [UNVERIFIABLE]

**Claim:** Awesome lists (curated link collections) have 800-900 links per page
on average **Confidence original:** HIGH -> LOW after verification **Evidence:**
No published analysis of average awesome list link counts found. Actual counts
vary enormously (50-200 for narrow lists; 1000+ for broad ones). The 800-900
figure appears to be an estimate from D9a without external validation.
**Method:** web

---

## Batch 3: C-054 to C-064 (Engineer View / Anti-Patterns)

### C-054 [VERIFIED]

**Claim:** 8 freshness detection methods ordered by reliability: HTTP
Last-Modified, ETag, HTML date meta, JSON-LD dateModified, visible dates, Git
commit date, sitemap lastmod, copyright year **Confidence:** HIGH **Evidence:**
All 8 methods are real and well-documented. HTTP Last-Modified/ETag are RFC 7232
standards. JSON-LD dateModified is schema.org structured data. Visible dates,
copyright year, sitemap lastmod are standard crawl heuristics. Git commit date
applies to GitHub-hosted sites. Reliability ordering (server-side first) is
sound. All 8 components independently verified. **Method:** web

---

### C-055 [VERIFIED]

**Claim:** Flesch-Kincaid Grade Level is the recommended default readability
formula; SMOG Grade is preferred for healthcare/medical content **Confidence:**
HIGH **Evidence:** Multiple peer-reviewed medical sources confirm SMOG
preference for healthcare (PMC/NCBI, AHRQ, 2010 Royal College of Physicians
study). Flesch-Kincaid as general default confirmed by ubiquitous use in Word,
Google Docs, educational tools. **Method:** web

---

### C-056 [VERIFIED]

**Claim:** Heading hierarchy is the primary information architecture signal: H1
count, H2-H6 depth, heading text quality, structure as content organization
proxy **Confidence:** HIGH **Evidence:** Heading hierarchy foundational to HTML5
doc outline spec, ARIA landmark semantics, screen reader nav, and SEO quality
guidelines. Google quality guidelines reference heading structure. Web Almanac
tracks heading distribution as key markup metric. Well-established across
multiple independent sources. **Method:** web

---

### C-057 [VERIFIED]

**Claim:** Lexical density (unique words / total words) greater than 50% is a
quality proxy for high-information-density content **Confidence:** MEDIUM
**Evidence:** Lexical density is an established computational linguistics
metric. Academic references place content-dense text at 40-50%+ lexical density.
AI-generated/conversational text tends toward lower density. The 50% threshold
is a heuristic consistent with corpus linguistics practice. **Method:** web

---

### C-058 [UNVERIFIABLE]

**Claim:** Factual density of 2-3 facts per 100 words has been proposed as a
quality metric but comes from a single source and has not been independently
validated **Confidence:** LOW **Evidence:** Claim accurately self-describes its
evidential status. No external source establishing this metric was found. The
self-qualification is accurate. **Method:** web

---

### C-059 [UNVERIFIABLE]

**Claim:** 11 absence pattern types: DEAD_BLOG, VENDOR_BROCHURE, SPA_SHELL,
PAYWALLED_HARD, PAYWALLED_SOFT, CAPTIVE_JS, AGGREGATOR, LINK_FARM,
GENERATED_CONTENT, CURATED_LIST_WEB, REGISTRY **Confidence original:** HIGH ->
LOW after verification **Evidence:** Internal classification taxonomy from D8.
Individual patterns are real web content phenomena. This specific 11-type named
taxonomy is a design artifact with no external canonical standard. **Method:**
web

---

### C-060 [VERIFIED]

**Claim:** IndieWeb webring membership is a positive quality signal for
long-tail, high-value sites -- human-curated and community-vetted
**Confidence:** MEDIUM **Evidence:** IndieWeb webring docs
(indieweb.org/IndieWeb_Webring) confirm: membership requires valid h-card,
application/review, explicit consent, active link maintenance. Some webrings do
manual review before admission. IndieWeb explicitly positions webrings as
human-curated alternatives to algorithmic discovery. **Method:** web

---

### C-061 [CONFLICTED]

**Claim:** EU AI Act requires watermarking of AI-generated content above a
threshold in EU jurisdictions (March 2025) **Confidence:** HIGH **Evidence:**
March 2025 effective date is INCORRECT. Article 50 watermarking does not take
effect until August 2, 2026. Code of Practice draft published December 2025. In
March 2025 no watermarking requirement was in force. **Method:** web
**Conflicts:**

- sourceA: Claim states March 2025 enforcement
- sourceB: Official EU AI Act timeline -- Article 50 effective August 2, 2026;
  Code of Practice draft December 2025
- type: freshness (requirement exists but is future-dated; claimed March 2025
  date is wrong)

---

### C-062 [VERIFIED]

**Claim:** Google internal contentEffort metric estimates effort invested in
content creation -- effort proxies correlate with quality **Confidence:** LOW
**Evidence:** May 2024 Google Content Warehouse API leak confirmed by
searchengineland.com, hobo-web.co.uk, seranking.com independently. contentEffort
= LLM-based effort estimation for article pages. Effort-quality correlation
consistent with E-E-A-T. Verified from leaked docs. **Method:** web

---

### C-063 [VERIFIED]

**Claim:** NavBoost creates a rich-get-richer feedback loop: high-traffic sites
get more search visibility, systematically underrepresenting long-tail quality
content **Confidence:** LOW **Evidence:** NavBoost confirmed real (antitrust
proceedings, 2024 API leak). seranking.com, hobo-web.co.uk, semrush.com document
feedback mechanism: 13-month rolling click window means high-traffic queries
produce stronger NavBoost signals; long-tail queries have sparse data. Multiple
independent sources confirm. **Method:** web

---

### C-064 [UNVERIFIABLE]

**Claim:** Four cross-site synthesis paradigms: thematic (default), narrative,
matrix, meta-pattern **Confidence original:** HIGH -> LOW after verification
**Evidence:** Thematic, narrative, matrix synthesis approaches are documented in
qualitative research literature. The four-paradigm taxonomy (including
meta-pattern name) appears to be an internal framework from D9b adapting
academic concepts. No external canonical taxonomy with exactly these four named
paradigms was found. **Method:** web

---

## Final Summary

| Verdict      | Count | Claim IDs                                                                                        |
| ------------ | ----- | ------------------------------------------------------------------------------------------------ |
| VERIFIED     | 14    | C-033, C-037, C-038, C-039, C-041, C-043, C-051, C-054, C-055, C-056, C-057, C-060, C-062, C-063 |
| REFUTED      | 0     | --                                                                                               |
| UNVERIFIABLE | 13    | C-034, C-035, C-044, C-045, C-046, C-047, C-048, C-049, C-052, C-053, C-058, C-059, C-064        |
| CONFLICTED   | 5     | C-036, C-040, C-042, C-050, C-061                                                                |

## Key Flags for Synthesis Team

**C-050 (expedition 40-link threshold) -- DESIGN BUG:** Web Almanac 2025 data is
correct (median=6, p90=25 external links). But the design conclusion is wrong. A
40-link threshold is above p90=25, so it targets fewer than 10% of pages, not
exactly 10%. Recommendation: Either lower the threshold to ~25 to truly target
top 10%, or reframe as targeting top 5%.

**C-061 (EU AI Act March 2025) -- DATE ERROR:** Article 50 watermarking does not
take effect until August 2026. The March 2025 date is wrong. If this claim is
used in skill design for compliance logic, the timeline must be corrected.

**C-036 (Wappalyzer count) -- STALE NUMBER:** Current Wappalyzer technology
count is 8,018 (not 7,200+). Minor but should be updated. Offline bundling
capability is verified.

**Many UNVERIFIABLE claims are internal design decisions (C-034, C-035, C-044 to
C-049, C-059, C-064):** These are engineering choices / design weights from D5,
D6, D8, D9b -- not empirical facts. Synthesis should treat them as design
proposals requiring implementation validation, not established findings.

**C-040 (89.4% schema.org via JSON-LD) -- PARTIAL:** The 41% adoption figure is
verified. The 89.4% sub-claim is unverified and may be from a limited dataset or
stale.

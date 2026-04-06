# Findings: How to Score and Rank Outbound Links by Creator-Value

**Searcher:** deep-research-searcher **Profile:** web + academic **Date:**
2026-04-05 **Sub-Question IDs:** SQ6

---

## Key Findings

### 1. Link Density Is the Primary Pre-Filter Signal [CONFIDENCE: HIGH]

Before any scoring, links must be pre-filtered by structural position. Mozilla
Readability.js and jusText — two production-grade content extractors — both use
**link density** (ratio of anchor text length to total block text length) as the
primary boilerplate discriminator [1][2]:

- **jusText threshold:** link density > 0.20 (20%) → block classified as
  boilerplate immediately. Short blocks with any links at all → boilerplate [1].
- **Readability.js thresholds:** density >0.5 = navigation/ads; 0.2–0.5 = mixed
  content; <0.2 = article content [2].

This means a two-phase approach is well-supported: first discard all links
residing in high-density blocks (link density >0.2–0.5), then apply scoring only
to survivors. This is a fast O(n) pass with no network calls required.

**Implication for `/website-analysis`:** Pre-filter step removes nav menus,
footers, sidebar link lists, and ad blocks with a single ratio calculation per
DOM block.

---

### 2. HTML Semantic Container Provides a Reliable Position Signal [CONFIDENCE: HIGH]

HTML5 semantic elements are designed to distinguish navigation from content
[3][4]:

| Container   | Signal                        | Weight Suggestion |
| ----------- | ----------------------------- | ----------------- |
| `<article>` | Primary editorial content     | +1.0 boost        |
| `<main>`    | Primary page content          | +0.8 boost        |
| `<section>` | Themed content block          | +0.5 boost        |
| `<aside>`   | Supplementary/related content | +0.1 boost        |
| `<nav>`     | Navigation — exclude          | DISCARD           |
| `<footer>`  | Footer — exclude              | DISCARD           |
| `<header>`  | Header — exclude              | DISCARD           |

Links inside `<nav>`, `<header>`, and `<footer>` should be discarded before
scoring begins. Links inside `<article>` or `<main>` outside a list context
(curated list detection covered below) receive the highest container weight.

Google's crawlers use these same semantic signals to identify relevant content
[4]. This is well-established web standards behavior, not SEO speculation.

---

### 3. Anchor Text Quality Is a Strong Relevance Signal — With Manipulation Caveat [CONFIDENCE: HIGH]

The Stanford IR Book documents that anchor text is often more descriptive of the
target page than the page's own content [5]. Key findings:

- **Descriptive anchor text** (e.g., "gradient descent intuition", "Python
  asyncio tutorial") carries high information value about the target.
- **Generic anchors** ("click here", "read more", "here", "this") carry near
  zero information value for creator-value scoring.
- **Exact-match keyword anchors** carry medium value — informative but may be
  SEO-optimized rather than editorially honest.
- **Naked URL anchors** (the URL itself as text) carry low anchor-text value but
  URL structure can be independently scored.
- The surrounding context window (±50–150 words) around the link provides
  additional semantic signal when anchor text is generic [5][6].

**Manipulation caveat:** Anchor text can be gamed [5]. For creator-value
scoring, corroborate anchor text signal with URL structure pattern and
surrounding context before weighting heavily.

**Classification schema for anchor quality score (0–1.0):**

| Anchor type                      | Score   |
| -------------------------------- | ------- |
| Descriptive phrase (3–8 words)   | 0.8–1.0 |
| Short descriptive (1–2 words)    | 0.5–0.7 |
| Partial-match keyword            | 0.4–0.6 |
| Branded/proper noun              | 0.3–0.5 |
| Naked URL                        | 0.2     |
| Generic ("here", "this", "more") | 0.0–0.1 |
| Image-only (no alt text)         | 0.0     |

---

### 4. URL Structure Encodes Content Type — Reliably for High-Value Domains [CONFIDENCE: MEDIUM-HIGH]

URL structure alone cannot determine quality [7], but specific pattern classes
predict content type with reasonable reliability:

**Domain-tier heuristics (creator-value oriented):**

| Domain pattern                    | Likely content type        | Creator value |
| --------------------------------- | -------------------------- | ------------- |
| `arxiv.org/abs/`                  | Academic paper abstract    | HIGH          |
| `arxiv.org/pdf/`                  | Academic paper PDF         | HIGH          |
| `github.com/*/`                   | Code repository            | HIGH          |
| `github.com/*/blob/`              | Specific file in repo      | HIGH          |
| `docs.*.*/`                       | Official documentation     | HIGH          |
| `*.readthedocs.io/`               | Documentation site         | HIGH          |
| `developer.*.com/docs/`           | Official API reference     | HIGH          |
| `*.edu/` (non-landing)            | Academic content           | MEDIUM-HIGH   |
| `stackoverflow.com/`              | Technical Q&A              | MEDIUM-HIGH   |
| `medium.com/`                     | Blog post (quality varies) | MEDIUM        |
| `substack.com/`                   | Newsletter/blog            | MEDIUM        |
| `twitter.com/`, `x.com/`          | Social post                | LOW           |
| `facebook.com/`, `instagram.com/` | Social media               | LOW           |
| `youtube.com/watch`               | Video (depends on topic)   | MEDIUM        |
| `*.com/?utm_*`                    | Tracked marketing link     | DISCARD/STRIP |
| `javascript:void`                 | Non-link                   | DISCARD       |
| `mailto:`                         | Email                      | DISCARD       |
| `#` fragment only                 | Same-page jump             | LOW           |

**Path depth heuristic:** Very shallow paths (e.g., `/`) are likely landing
pages; moderate depth (2–4 segments) suggests content pages; very deep (7+
segments) suggests dynamically generated or paginated content [7].

**NOTE:** These are heuristics. A `medium.com/` link from Paul Graham carries
higher creator value than an `arxiv.org` link to an irrelevant field. Domain
tier is a prior, not a verdict.

---

### 5. Curated List vs. Inline Reference Is a Detectable Structural Signal [CONFIDENCE: MEDIUM]

Two distinct link contexts have different creator-value semantics:

**Inline reference links** (the author cites a source mid-argument):

- Appear within `<p>` tags, typically surrounded by prose
- High link density per paragraph is unusual → high editorial intent signal
- Surrounding text gives strong topical context for scoring

**Curated list links** (a "resources" or "further reading" section):

- Appear within `<ul>`, `<ol>`, or `<dl>` elements
- Often in an `<aside>` or at the end of an `<article>`
- Multiple links in sequence with minimal prose around each
- Still valuable (editorial curation) but context signal is weaker per link

**Detection heuristic:**

- If a link's nearest ancestor is `<li>` AND the list has ≥3 items → classify as
  "curated list" link.
- If a link's nearest ancestor is `<p>` AND the paragraph has ≥100 characters of
  non-link text → classify as "inline reference" link.
- Inline reference links should receive a slight boost (+0.15) for editorial
  intent signaling.

---

### 6. Lightweight Target Signals via HEAD Request Are Fast and Informative [CONFIDENCE: HIGH]

HTTP HEAD requests return response headers without the body, making them fast
(typically <200ms for live pages) and suitable for per-link quality checks [8]:

**Signals available from HEAD:**

| Header           | Signal                                    | Use                                                      |
| ---------------- | ----------------------------------------- | -------------------------------------------------------- |
| Status code      | 200=alive, 404=dead, 301/302=redirects    | Filter dead links                                        |
| `Content-Type`   | `text/html` vs `application/pdf` vs other | Content type detection                                   |
| `Content-Length` | Size proxy for content depth              | Flag very small pages (<5KB = likely error/thin content) |
| `Last-Modified`  | Recency of content                        | Boost for recently updated content                       |
| `X-Robots-Tag`   | Noindex signal                            | Can deprioritize if noindexed                            |

**Performance reality:** HEAD requests are blocked by some servers or CDNs
(particularly large platforms like Twitter, LinkedIn). Implement with a short
timeout (3–5 seconds max per link) and treat timeout as neutral (no penalty, but
no boost).

**Parallelization:** HEAD checks for 10–20 links can run in parallel with
`asyncio` / `Promise.all`, completing in ≤5 seconds total for a page's scored
candidates.

---

### 7. Open Graph Metadata via Lightweight GET Fetch Provides Rich Target Signals [CONFIDENCE: HIGH]

For links that survive pre-filtering and HEAD checks, a lightweight
`<head>`-only fetch (abort after receiving `</head>` or first ~8KB) extracts
[9]:

- `<title>` — target page title, primary labeling signal
- `og:title` — often cleaner than `<title>` (no site name suffix)
- `og:description` — target page's own description of its content
- `og:type` — `article`, `website`, `video`, etc.
- `og:site_name` — source site context
- `meta name="description"` — fallback description

These signals enable TF-IDF or embedding similarity between the source page's
topic and the target page's self-description, providing a quantifiable topical
relevance score without fetching the full target page.

**Time budget:** Partial `<head>` fetch via streaming is typically 200–800ms per
link on fast connections. With parallel fetches for top 10 candidates, this fits
within a 5-second window.

---

### 8. TF-IDF / Cosine Similarity Quantifies Topical Relevance [CONFIDENCE: MEDIUM-HIGH]

Standard information retrieval practice for measuring link-to-page relevance
[10]:

1. Extract topic terms from the source page (after boilerplate removal).
2. Represent as a TF-IDF vector or embedding vector.
3. Represent the target (from anchor text + URL path + OG title/description) as
   a vector.
4. Compute cosine similarity between source topic and target representation.

**Practical approach for <5 second runtime:**

- Use pre-computed TF-IDF on the source page (done once per page, ~100ms).
- For each candidate link, score:
  `cosine_sim(source_tfidf, anchor_text + url_tokens + og_title)`.
- No need for embedding models — keyword overlap is sufficient for initial
  filtering; embeddings can be used for reranking the top-5.

**Research backing:** Query-centric context analysis shows that terms in the
local window around a query term (here: the link) carry proportionally higher
relevance weight than distant terms [6]. This validates using the ±50-word
window around the link anchor as the primary context for scoring.

---

### 9. Novelty Scoring Prevents Redundant Recommendations [CONFIDENCE: MEDIUM]

From knowledge-graph recommendation research [11], novelty can be scored as:

```
novelty(link) = avg cosine_distance(link, seen_links[])
```

Where `seen_links` is the set of pages already visited or shown in the current
expedition session. A link that points to something semantically similar to
already-seen content scores lower novelty.

**Practical implementation:**

- Maintain a session-level set of visited URL embeddings or TF-IDF vectors.
- For each candidate link's target (using OG title + description as proxy),
  compute distance from all visited pages.
- Normalize to 0–1 range; 1.0 = maximally novel, 0.0 = duplicate of seen.

**Application in Expedition mode:** This ensures the top-5 links surface diverse
directions rather than multiple links to variants of the same resource.

---

### 10. Link Type (Intent) Classification Adds Creator-Value Dimension [CONFIDENCE: MEDIUM]

Research on query intent classification [12] and anchor text analysis [5]
supports classifying links by their _intended function_:

**Proposed creator-value link type taxonomy:**

| Type             | Detection signals                                                                                  | Creator-value weight |
| ---------------- | -------------------------------------------------------------------------------------------------- | -------------------- |
| **Tutorial**     | Anchor: "how to", "guide", "tutorial", "learn" / URL: blog, /posts/, /tutorial/                    | HIGH (1.0)           |
| **Reference**    | Anchor: "docs", "API", "reference", "spec" / URL: /docs/, readthedocs.io, developer.\*.com         | HIGH (0.9)           |
| **Paper**        | URL: arxiv.org, doi.org, pubmed / Anchor: author name, year                                        | HIGH (0.9)           |
| **Tool/Library** | URL: github.com, pypi.org, npmjs.com, crates.io / Anchor: proper noun + verb                       | HIGH (0.85)          |
| **Example**      | Anchor: "example", "demo", "playground", "codesandbox" / URL: codepen.io, jsfiddle, codesandbox.io | HIGH (0.8)           |
| **Article**      | URL: medium.com, substack.com, blog paths / Content-Type: text/html                                | MEDIUM (0.6)         |
| **Discussion**   | URL: reddit.com, hn.algolia.com, news.ycombinator.com                                              | MEDIUM (0.5)         |
| **Video**        | URL: youtube.com/watch, vimeo.com / OG type: video                                                 | MEDIUM (0.5)         |
| **Social**       | URL: twitter.com, x.com, linkedin.com, instagram.com                                               | LOW (0.1)            |
| **Marketing**    | URL: contains utm\_, affiliate parameters / Anchor: "buy", "get", "try free"                       | LOW (0.1)            |

Detection uses keyword matching on anchor text combined with URL pattern
matching. This is O(1) per link and requires no network call.

---

### 11. Typical Page Has 50–200 Total Links; Effective Content Links Are 5–30 [CONFIDENCE: MEDIUM]

From SEO research [13][14]:

- Top-ranking blog posts and articles contain **56–171 outbound links** on
  average (including nav, footer, internal, and external).
- After removing nav/footer/sidebar (typically 60–80% of total links), content
  links typically number **10–40** per page.
- After further filtering for external links only, **5–20 external content
  links** is the typical range for a rich article page.

This confirms that the scoring algorithm only needs to process **20–50 links**
after pre-filtering (not hundreds), making a <5 second pipeline feasible.

---

### 12. Practical Scoring Formula Proposal [CONFIDENCE: MEDIUM]

Based on all findings above, the following scoring formula is proposed for
creator-value link ranking:

```
creator_score(link) =
  W_anchor    * anchor_quality_score(link)     # 0.0–1.0
  + W_context * context_relevance_score(link)  # 0.0–1.0  (TF-IDF cosine sim, source page vs ±50w window)
  + W_position * position_score(link)          # 0.0–1.0  (article=1.0, aside=0.5, list=0.7, etc.)
  + W_url     * url_pattern_score(link)        # 0.0–1.0  (domain tier + path heuristic)
  + W_type    * link_type_score(link)          # 0.0–1.0  (tutorial/ref/paper/tool/etc.)
  + W_novelty * novelty_score(link)            # 0.0–1.0  (distance from seen links)
  + W_alive   * alive_score(link)              # 0.0 or 1.0 (HEAD check: 200=1.0, 404=0.0)

Suggested weights (sum to 1.0):
  W_anchor    = 0.20
  W_context   = 0.25
  W_position  = 0.15
  W_url       = 0.15
  W_type      = 0.10
  W_novelty   = 0.10
  W_alive     = 0.05
```

**Stage pipeline for <5 seconds:**

```
Stage 1 (0ms):   Parse DOM → extract all links with context
Stage 2 (~50ms): Pre-filter: discard nav/footer/header containers, discard
                 link-density > 0.3 blocks, discard social/mailto/fragment links
Stage 3 (~100ms): Score survivors on anchor_quality + context_relevance +
                  position + url_pattern + link_type (all local, no network)
Stage 4 (~200ms): HEAD check top 15 candidates in parallel (10 concurrent)
Stage 5 (~500ms): OG metadata fetch top 8 candidates in parallel (streaming HEAD)
Stage 6 (~50ms):  Apply novelty scoring vs session history
Stage 7 (~10ms):  Final rank → surface top 5
Total: ~1–2 seconds typical (up to 5 seconds worst case with slow servers)
```

---

## Sources

| #   | URL                                                                                                                                             | Title                                                                      | Type               | Trust       | CRAAP | Date                |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------ | ----------- | ----- | ------------------- |
| 1   | https://github.com/miso-belica/jusText/blob/main/doc/algorithm.rst                                                                              | jusText Algorithm Documentation                                            | official-docs      | HIGH        | 4.5/5 | 2024                |
| 2   | https://deepwiki.com/mozilla/readability                                                                                                        | Mozilla Readability Algorithm — DeepWiki                                   | docs-analysis      | HIGH        | 4.2/5 | 2025                |
| 3   | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/nav                                                                        | MDN: nav element                                                           | official-docs      | HIGH        | 5/5   | 2025                |
| 4   | https://web.dev/learn/html/semantic-html                                                                                                        | Semantic HTML — web.dev                                                    | official-docs      | HIGH        | 4.8/5 | 2024                |
| 5   | https://nlp.stanford.edu/IR-book/html/htmledition/anchor-text-and-the-web-graph-1.html                                                          | Stanford IR Book: Anchor Text and the Web Graph                            | academic           | HIGH        | 5/5   | 2022                |
| 6   | https://pmc.ncbi.nlm.nih.gov/articles/PMC7148224/                                                                                               | Relevance Ranking Based on Query-Aware Context Analysis — PMC              | academic           | HIGH        | 4.5/5 | 2020                |
| 7   | https://developers.google.com/search/docs/crawling-indexing/url-structure                                                                       | Google Search Central: URL Structure Best Practices                        | official-docs      | HIGH        | 5/5   | 2024                |
| 8   | https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/HEAD                                                                                  | MDN: HEAD Method                                                           | official-docs      | HIGH        | 5/5   | 2025                |
| 9   | https://ogp.me/                                                                                                                                 | The Open Graph Protocol                                                    | official-docs      | HIGH        | 4.8/5 | 2024                |
| 10  | https://www.ir-facility.org/scoring-and-ranking-techniques-tf-idf-term-weighting-and-cosine-similarity                                          | TF-IDF Term Weighting and Cosine Similarity                                | educational        | MEDIUM-HIGH | 4.0/5 | 2023                |
| 11  | https://arxiv.org/html/2405.08465v1                                                                                                             | How to Surprisingly Consider Recommendations? — arXiv                      | academic           | HIGH        | 4.5/5 | 2024                |
| 12  | https://www.semanticscholar.org/paper/Determining-the-informational,-navigational,-and-of-Jansen-Booth/dd9af33a7262be2eea3cfb18f11e60fc1681c135 | Determining Informational/Navigational/Transactional Intent of Web Queries | academic           | HIGH        | 4.5/5 | 2003 (foundational) |
| 13  | https://www.orbitmedia.com/blog/outbound-links-per-word-page/                                                                                   | How Many Outbound Links Per Word/Page? — Orbit Media                       | research-blog      | MEDIUM      | 3.5/5 | 2024                |
| 14  | https://www.alliai.com/seo-ranking-factors/number-of-outbound-links                                                                             | Number of Outbound Links and SEO — Alli AI                                 | industry           | MEDIUM      | 3.0/5 | 2024                |
| 15  | https://www.zyte.com/blog/link-analysis-algorithms-explained/                                                                                   | Link Analysis Algorithms Explained — Zyte                                  | industry-technical | MEDIUM-HIGH | 4.0/5 | 2024                |

---

## Contradictions

**URL structure as quality signal:** Google explicitly states URL structure is
NOT a major ranking factor [7], while other SEO literature treats domain tier as
a strong quality proxy. Resolution: URL structure is a useful _prior_ for
creator-value estimation (especially domain-type classification like
`arxiv.org`), but should not be treated as ground truth. The contradiction
dissolves when we distinguish "ranking signal for Google" (not what we're doing)
from "content-type heuristic" (what we're doing).

**Link density threshold discrepancy:** jusText uses 0.20 (20%) as the hard
cutoff [1], while Readability.js uses 0.50 (50%) as the "likely nav" threshold
[2]. The difference is because they measure different units: jusText measures
per-block, Readability.js measures per-element. For implementation, using 0.20
per text block and 0.50 per container element is consistent with both.

**Anchor text signal reliability:** The Stanford IR book notes anchor text is
valuable [5] but also flags it as a primary spam target. For creator-value
scoring (not search engine ranking), spam manipulation is less of a concern —
the user is reading a specific page they chose, not being searched for. High
weight on anchor text is more defensible here than in general SEO.

---

## Gaps

1. **Personal-fit scoring (SoNash / JASON-OS context):** No research was found
   on how to score link relevance against a user's personal domain context
   (sobriety recovery, OS-building). This would require a user-profile embedding
   approach — feasible with LLMs but requires design work not covered in
   literature. Suggested approach: maintain a small vector of user interest
   topics, compute cosine similarity against each link's topic representation.

2. **"Endorsement" vs "citation" link distinction:** While intent classification
   literature covers informational/navigational/transactional [12], the finer
   distinction between "the author endorses this" vs "the author is citing this
   as a counter-example" is not well-studied in web link analysis. Linguistic
   cues in surrounding context (sentiment, verbs like "recommends", "warns
   about", "see also") could help but require NLP processing.

3. **Performance benchmarks for real-world pages:** The <5 second budget is
   theoretically feasible but no specific benchmark data was found for the
   specific pipeline (DOM parse → filter → HEAD × 15 → OG fetch × 8 → rank).
   Testing required.

4. **JavaScript-rendered pages:** All signals above assume static HTML. For
   JS-rendered pages (SPAs), the DOM available for link extraction depends on
   rendering. Link density and semantic container signals may be degraded.

5. **Language/locale handling:** All research above implicitly assumes English
   text. Stop-word density (used in jusText) and anchor text quality scoring
   would need locale-specific adjustments for non-English content.

---

## Serendipity

**Unexpectedness formula from knowledge graph research [11]:**

```
Unexpectedness(R) = (1 / |I| × |H|) × Σ_i∈I Σ_h∈H d(i, h)
```

This formula (average cosine distance of recommendations from user history) is
directly applicable to Expedition mode's novelty scoring — it was developed for
entertainment recommendations but maps cleanly onto link discovery.

**Readability's `linkDensityModifier` parameter:** Mozilla Readability exposes a
tuneable `linkDensityModifier` parameter that adjusts penalty strictness. This
means the pre-filter threshold is not hardcoded — for pages with intentionally
high link density (resource lists, awesome-lists), the threshold can be relaxed
to avoid discarding all valuable links.

**jusText's context-sensitive block refinement:** The observation that
"boilerplate blocks cluster together" means that an isolated low-density content
block surrounded by boilerplate blocks gets reclassified as boilerplate. This
matters for link extraction: a single interesting link in a sidebar cluster may
be discarded even if its own link density is low. The creator-value scorer
should be aware of this and potentially override for links inside `<article>`
containers regardless of surrounding block type.

**BM25 + embedding hybrid is the 2024–2025 state of the art for relevance
scoring [the BM25 search result]:** For the context relevance scoring component
of creator-value scoring, a hybrid approach (BM25 keyword overlap + lightweight
embedding cosine similarity) would outperform either alone. BM25 is fast enough
to run client-side; a small embedding model (e.g., `all-MiniLM-L6-v2`) can run
in <100ms for short texts on modern hardware.

---

## Confidence Assessment

- HIGH claims: 6 (link density thresholds, HTML semantics, anchor text quality,
  HEAD request signals, OG metadata, Stanford IR anchor text findings)
- MEDIUM-HIGH claims: 3 (URL structure patterns, TF-IDF cosine similarity,
  typical link count statistics)
- MEDIUM claims: 4 (curated list vs inline detection, novelty scoring formula,
  link type taxonomy, scoring formula weights)
- LOW claims: 0
- UNVERIFIED claims: 0
- **Overall confidence: MEDIUM-HIGH**

The core pre-filtering and signal catalog is HIGH confidence based on production
library documentation and academic IR literature. The specific weight values in
the scoring formula are MEDIUM confidence (proposed heuristics, not empirically
validated for creator-value specifically). The link type taxonomy is MEDIUM
confidence (adapted from query intent literature, not directly tested on web
links).

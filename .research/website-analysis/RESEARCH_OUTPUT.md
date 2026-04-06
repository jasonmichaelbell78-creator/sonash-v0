# Research Output: Website Analysis Skill Design for Claude Code

**Topic:** Website Analysis Skill Design for Claude Code **Depth:** L1
(Exhaustive) **Research Date:** 2026-04-05 **Synthesizer:**
deep-research-synthesizer **Findings Files Processed:** 26 (D1a through D14, G1
through G4) **Total Claims Extracted:** 175 (127 original + 48 gap pursuit)
**Unique Sources Cited:** 26 findings files + 100+ primary sources **Version:**
1.1 (post-gap-pursuit) **Gap Pursuit Agents:** G1 (rate-limiting), G2 (RSS/MCP),
G3 (AI detection), G4 (creator context)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Content Extraction Pipeline](#2-content-extraction-pipeline)
3. [Creator View Design](#3-creator-view-design)
4. [Engineer View Design](#4-engineer-view-design)
5. [Classification and Metadata](#5-classification-and-metadata)
6. [Link Scoring and Mining](#6-link-scoring-and-mining)
7. [Compliance and Pre-flight](#7-compliance-and-pre-flight)
8. [Expedition Mode](#8-expedition-mode)
9. [Cross-site Synthesis](#9-cross-site-synthesis)
10. [Storage Architecture](#10-storage-architecture)
11. [AI Tool Integration](#11-ai-tool-integration)
12. [Anti-patterns and Bias Mitigation](#12-anti-patterns-and-bias-mitigation)
13. [Cross-cutting Concerns](#13-cross-cutting-concerns)
14. [Serendipitous Discoveries](#14-serendipitous-discoveries)
15. [Gaps and Unresolved Questions](#15-gaps-and-unresolved-questions)

---

## 1. Executive Summary

The `/website-analysis` skill fills a market gap that no existing tool occupies:
site-centric, creator-first analysis of arbitrary websites from within a
developer's workflow. Every major AI analysis tool — Perplexity Deep Research,
Exa, Google AI Overviews, Firecrawl, Tavily — is query-centric. They answer
questions. `/website-analysis` analyzes a site as an artifact: what it is, what
it understands, what value it has for a specific creator's work, and where its
knowledge is worth mining. [D13b]

The skill mirrors `/repo-analysis` in philosophy but diverges in structure
because websites present fundamentally different challenges: JavaScript
rendering requirements, compliance gates (robots.txt, ToS, GDPR), link graph
topology, content quality signals, and multi-hop expedition navigation. [D12]

**The extraction decision tree is the most operationally complex element.**
Static extraction (trafilatura + Readability + Turndown) handles the majority of
sites. JavaScript detection requires a three-phase escalation algorithm — not a
binary "does this site use React?" check — because framework fingerprints
frequently produce false positives (Next.js SSR pages have `__NEXT_DATA__` but
do not require rendering). [D1a, D2a] When JS rendering is required, Crawl4AI
(Apache-2.0, Docker-deployable) is the recommended self-hosted path and the
non-optional fallback; Jina Reader (acquired by Elastic October 2025) is a
convenience-only option with LOW confidence due to acquisition risk. [D1b]

**The Creator View is the primary differentiator.** A seven-section structure
organizes the analysis around what a creator can do with the site, not what the
site contains. Key sections: What's Relevant To Your Work, What This Site
Understands, Voice and Editorial POV (new vs. repo-analysis), Where Your
Approach Differs, The Challenge, The Warning (optional), and Knowledge
Candidates. Thirteen value axes — including content depth/freshness, editorial
stance, information architecture structure, and link graph as knowledge map —
give the Creator View analytical backbone. [D4a, D4b]

**Compliance is non-negotiable and must be a hard gate.** The pre-flight check
runs before any extraction. It verifies robots.txt via RFC 9309-compliant
parsing (robots-parser v3.0.1), checks `X-Robots-Tag` headers, assesses ToS via
pattern matching, evaluates GDPR exposure, and checks for llms.txt. Hard-block
conditions (explicit Disallow + robots tag + cease-and-desist history) stop the
skill entirely. The OpenAI ChatGPT-User reversal on robots.txt compliance
(December 2025) is a major shift in the voluntary compliance regime that
Anthropic has not followed — Claude's agents continue to respect robots.txt.
[D3]

**Expedition Mode enables multi-hop navigation** using a 3-file state pattern
(meta.json for session metadata, snap.json for current tree snapshot,
expedition.jsonl for append-only event log). Depth limit of 3 hops and 15 pages
default breadth prevent runaway crawls. An epsilon-greedy selection strategy (4
high-relevance + 1 wildcard per step) provides systematic serendipity. Resume
protocol detects prior expedition files and reconstructs the navigation tree
before presenting options. [D10a, D10b]

**Storage in v1 is zero-dependency enhanced markdown vault** (.research/
directory, YAML frontmatter, JSONL index). SQLite + markdown hybrid is the
recommended v2 architecture for cross-session retrieval and structured queries.
NotebookLM has no public API for consumer users (enterprise alpha only) — the
MCPVault filesystem-based server and QMD MCP for hybrid BM25+vector search are
the recommended integration points. [D11a, D11b, D11c]

**Schema parity with `/repo-analysis` requires 6 shared artifacts**
(analysis.json, findings.jsonl, value-map.json, and 3 new website-specific
files: links.json, assets.json, meta.json) **plus 3 new website-only artifacts**
(tables.json, sitemap.json, expedition.jsonl). URL-to-slug conversion must
handle Windows MAX_PATH compliance, using an 80-character max with SHA-256
6-character hash suffix for disambiguation. [D12]

---

## 2. Content Extraction Pipeline

### 2.1 Static Extraction: Tool Selection

**Recommendation: Two-step pipeline — boilerplate removal then Markdown
conversion.**

Step 1 (boilerplate removal): **trafilatura** as primary extractor.

- Best overall mean F1 across diverse content types: **0.945** (ScrapingHub
  article-extraction benchmark) [D1a]
- **IMPORTANT CAVEAT:** This is an article-only benchmark. Documentation sites
  score F1=0.888; product pages score F1=0.567 (see Section 2.1.1)
- SIGIR 2023 (Bevendorff et al., 14 tools, 8 datasets): trafilatura best mean F1
  (0.883) [D1a]
- Outputs: TXT, Markdown, CSV, JSON, XML, TEI-XML
- Metadata extraction built-in: title, author, date, site name, categories,
  tags, description from HTML meta/OpenGraph/JSON-LD
- Tuning flags: `favor_recall`, `favor_precision`, `include_tables`,
  `include_comments`
- SimHash-based deduplication built-in
- v2.0.0 released December 2024, actively maintained
- **Limitation:** Code block whitespace preservation imperfect (GitHub issue
  #553) [D1a]

Step 2 (HTML-to-Markdown conversion for structured content): **Turndown + GFM
plugin**

- 2.5M weekly npm downloads (November 2024)
- GFM (GitHub Flavored Markdown) plugin: tables, strikethrough, task lists, code
  blocks with language hints
- Produces cleaner structural Markdown than trafilatura's native output for
  HTML-heavy content [D1a]

**Fallback (article pages):** Mozilla Readability (@mozilla/readability)

- Highest median F1 on article-type content: **0.970** (SIGIR 2023) [D1a]
- Requires jsdom as DOM provider; pure-HTML static extraction when fed
  pre-fetched HTML
- Firefox Reader View algorithm — highly optimized for news/blog articles
- Limitation: under-performs trafilatura on non-article content types

**Contradiction to surface:** ScrapingHub benchmark ranks trafilatura >
newspaper4k; htdocs.dev benchmark shows a different ordering. Resolution:
dataset-dependent — trafilatura generalizes across content types; Readability
peaks higher on clean article pages. Both results are correct for their
evaluation domains. [D1a]

**Confidence: MEDIUM** (benchmarks are article-only; performance on
documentation, product, and forum pages is substantially lower — see Section
2.1.1)

### 2.2 JavaScript Detection: Three-Phase Escalation

**The critical design principle: framework fingerprints alone are
insufficient.** A Next.js site with `__NEXT_DATA__` in the HTML might be fully
SSR-rendered and extractable statically. A Gatsby site might use ISR. Sending
all detected JS-framework sites through headless browser rendering wastes
resources and adds latency. [D2a]

**Three-phase escalation algorithm (CONFIDENCE: MEDIUM):** [D2a]

**NOTE (from verification challenge):** This algorithm has no measured false
positive/negative rate. The 300-character content absence threshold is
arbitrary. Phase 3 requires Crawl4AI Docker. Cloudflare challenge pages defeat
all three phases — Cloudflare detection (cf-mitigated header) must be added as a
Phase 0 pre-check (see Section 7.5).

**Phase 1 — Framework detection (static signals):**

- `__NEXT_DATA__` → Next.js detected
- `window.__nuxt__` → Nuxt.js detected
- `data-reactroot`, `data-reactid` → React detected
- `ng-version`, `__ng_app_id__` → Angular detected
- `__svelte_*` → SvelteKit detected
- `data-gatsby-*` → Gatsby detected

**Phase 2 — Content absence check (before triggering rendering):**

- Extract main content area with static tools
- If content length < threshold (suggested: 300 characters after whitespace
  normalization), flag as JS-dependent
- If content length sufficient, log "framework detected but static extraction
  sufficient" — proceed without rendering

**Phase 3 — Dual-run comparison (Crawlee approach):**

- Run static extraction and JS-rendered extraction in parallel on a sample page
- If cosine similarity of extracted text vectors > 0.85, static extraction is
  sufficient
- If similarity < 0.85, flag as JS-required for full crawl

**Additional detection signals:**

- `<noscript>` tags containing substantial content → site works without JS
  (static sufficient)
- Empty `<body>` or body with only `<div id="root">` / `<div id="app">` →
  JS-required
- `njsparser` for React Server Component flight data detection [D2a]

**Confidence score output:** Each page gets a JS-dependency confidence score
(0-1). Pages above 0.7 trigger rendering; 0.4-0.7 trigger dual-run comparison;
below 0.4 proceed statically.

### 2.3 JavaScript Rendering: Tool Selection

When JS rendering is required, three options exist (in preference order for a
self-hosted skill): [D1b]

**Option 1: Crawl4AI (RECOMMENDED for self-hosted)**

- License: Apache-2.0 (not MIT as one source claimed — verified Apache-2.0)
  [D1b]
- GitHub stars: 50k+ (as of research date)
- Playwright-based with 3-tier anti-bot: basic Playwright → stealth plugins →
  managed browser APIs
- 3-layer extraction: LLM-free CSS/XPath patterns, cosine similarity ranking,
  optional LLM extraction
- Docker REST API available — deployable as sidecar
- No per-request cost
- Chunking strategies: fixed-length, sentence-based, sliding window, semantic
  (NLP-based)
- **Limitation:** Requires self-hosting; Docker deployment adds operational
  overhead [D1b, D13a]

**Option 2: Jina Reader (CAUTION: structural reliability risk)**

- License: Apache-2.0 (confirmed)
- Zero-config URL prefix: `https://r.jina.ai/URL`
- Acquired by Elastic October 2025 — standard enterprise acquisition playbook
  depreciates free tiers within 12-24 months [D13a]
- ReaderLM-v2 (1.54B parameter model) for HTML-to-Markdown conversion
- No rate limit for non-authenticated requests (as of research date — this is
  likely to change)
- **CONFIDENCE: LOW** — Treat as a temporary convenience, not a reliable
  fallback. Crawl4AI self-hosting is the non-optional fallback; Jina is
  secondary. [D1b]
- Best for: quick prototyping only; do not build production dependency on Jina

**Option 3: Playwright MCP (direct integration)**

- 26 tools across 7 categories [D2b]
- `browser_snapshot` (accessibility tree) is primary extraction mode — NOT
  screenshot
- ~114k tokens/session (vs ~27k for CLI) — expensive at scale
- `storage-state.json` pattern for auth state persistence
- No built-in stealth mode — bot protection sites will block
- Recommendation: use only for interactive sites requiring auth or click-through
  navigation [D2b]

### 2.4 Playwright MCP Tool Inventory

For reference when designing the skill's Playwright integration path: [D2b]

**Navigation:** `browser_navigate`, `browser_navigate_back`,
`browser_navigate_forward` **Interaction:** `browser_click`, `browser_type`,
`browser_fill`, `browser_hover`, `browser_select_option` **Observation:**
`browser_snapshot` (accessibility tree, PRIMARY), `browser_screenshot` (visual
only) **State:** `browser_save_storage_state`, `browser_load_storage_state`
**Network:** `browser_wait_for_load_state`, `browser_wait_for_selector`
**Tabs:** `browser_new_tab`, `browser_close_tab`, `browser_select_tab`

**Design signal from tool proliferation:** 26 tools is too many to expose to
users. The skill should expose a minimal tool surface (navigate, snapshot,
extract) and handle the rest internally. [D2b]

---

## 3. Creator View Design

### 3.1 Seven-Section Structure

The Creator View is the primary output of `/website-analysis`. Its 7 sections
are ordered by actionability — what a creator can act on first comes first.
[D4b]

**Section 1: What's Relevant To Your Work**

- Lead with creator-specific relevance, not site description
- Map site content to the creator's active projects, questions, and knowledge
  gaps
- Tone: decisive, not hedged ("This site has X that applies to Y" not "This site
  might be relevant if...")
- Source for relevance context: CLAUDE.md, SESSION_CONTEXT.md, recent
  conversation

**Section 2: What This Site Understands**

- Characterize the site's knowledge domain, depth, and perspective
- Use the 13 value axes as analytical backbone (see Section 3.2)
- Identify the site's primary audience and assumed expertise level
- Note the site's epistemological stance: empirical, opinionated, aggregatory,
  documentary

**Section 3: Voice and Editorial POV** (NEW vs. repo-analysis)

- What is the site's editorial stance? Who is the implied author?
- Is the content prescriptive, descriptive, or exploratory?
- Detect: first-person experience language, institutional voice, aggregator
  voice, vendor voice
- Why this matters: a site's POV determines whether its claims should be
  synthesized as ground truth, as one perspective, or as marketing material
- Anti-design trend (2025): sites with aggressive minimalism and stripped
  metadata may deliberately obscure their editorial stance [D4b]

**Section 4: Where Your Approach Differs**

- Explicit comparison: where does this site's thinking diverge from the
  creator's documented approach?
- Sources: CLAUDE.md conventions, SESSION_CONTEXT.md patterns, previous analyses
- Productive divergence (worth learning from) vs. fundamental divergence
  (irreconcilable)

**Section 5: The Challenge**

- What makes this site hard to use as a knowledge source?
- Candidates: paywall, JS-required content, link farm structure, outdated
  content, aggregator without attribution, generated content
- Relate Challenge to extraction mode selected (see Section 2)

**Section 6: The Warning** (OPTIONAL — new vs. repo-analysis)

- Only surface when a genuine risk exists: ToS restrictions, GDPR exposure,
  known misinformation, vendor bias, SEO manipulation
- Not every site has a Warning — omit the section if no genuine risk
- Distinguish Warning from Challenge: Challenge is about usability; Warning is
  about risk [D4b]

**Section 7: Knowledge Candidates**

- Specific, extractable knowledge items: concepts, patterns, examples, datasets,
  tools, frameworks
- Each candidate tagged with: type (concept/tool/example/dataset), confidence,
  extraction difficulty
- Priority ordered by value-to-effort ratio
- Link to expedition planning: which Knowledge Candidates are worth a multi-hop
  expedition?

### 3.2 Thirteen Value Axes

These axes structure the "What This Site Understands" section and inform the
overall quality assessment. [D4a]

| Axis                        | Description                                                            | Measurement Signal                                                    |
| --------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Content Depth               | Specialist vs. generalist; surface vs. technical depth                 | Lexical density, jargon density, citation depth                       |
| Content Freshness           | How recently updated; how time-sensitive the domain                    | Last-modified headers, publication dates, version numbers             |
| Editorial Stance            | Neutral/empirical vs. opinionated vs. advocacy                         | First-person language ratio, hedging language ratio                   |
| Information Architecture    | How well the site organizes its knowledge                              | Heading hierarchy depth, sitemap structure, navigation clarity        |
| Link Graph as Knowledge Map | Whether the site's outbound links reveal its intellectual neighborhood | External domain diversity, link type distribution                     |
| Visual Design Philosophy    | What the design says about the site's values                           | Anti-design signals, minimalism, information density                  |
| Audience Assumed Expertise  | Who the site is written for                                            | Reading level (Flesch-Kincaid), jargon level, definition presence     |
| Source Attribution          | Does the site cite its sources?                                        | External link ratio, citation style, reference section presence       |
| Content Authenticity        | Is the content first-hand experience or synthesized/generated?         | Specific detail density, hedging patterns, personal anecdote presence |
| Monetization Pressure       | Does monetization distort the content?                                 | Ad density, affiliate link ratio, sponsored content signals           |
| Community Signal            | Is the site connected to a broader community?                          | Forum links, IndieWeb webring membership, reply/comment presence      |
| Entity Authority            | Is the site or its authors recognized experts?                         | E-E-A-T signals, author credentials, institutional affiliation        |
| Structural Completeness     | Is the site's knowledge base complete or fragmentary?                  | Dead links ratio, orphan pages, abandoned sections                    |

### 3.3 Comparison with Repo-Analysis Creator View

| Dimension         | Repo-Analysis        | Website-Analysis                      |
| ----------------- | -------------------- | ------------------------------------- |
| Sections          | 5                    | 7 (+Voice/POV, +The Warning)          |
| Primary lens      | Code architecture    | Content architecture                  |
| Value axes        | 8 (code-oriented)    | 13 (content + link + editorial)       |
| Quality framework | Code quality metrics | CRAAP + Kissane + IA frameworks       |
| Serendipity path  | Branch/commit graph  | Link graph expedition                 |
| Author signal     | Git history          | Bylines, institutional voice, E-E-A-T |

### 3.4 Quality Frameworks Integrated

**CRAAP Framework** (Currency, Relevance, Authority, Accuracy, Purpose): [D4a]

- Most widely used academic source evaluation framework
- Adapted for web: Currency = last-modified + publication date; Relevance =
  creator-project mapping; Authority = E-E-A-T signals; Accuracy = source
  attribution quality; Purpose = monetization/advocacy signals

**Kissane Framework** (5 content quality dimensions): [D4a]

- Appropriate: Is the content right for the audience?
- Useful: Does it serve a practical purpose?
- Clear: Is it unambiguous?
- Consistent: Does it maintain consistent voice and style?
- Concise: Is it free of unnecessary content?

**Rosenfeld/Morville Information Architecture Systems:** [D4a]

- Organization systems (how content is grouped)
- Labeling systems (how content is named)
- Navigation systems (how users move through content)
- Search systems (how users find specific content)

**E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness):** [D7]

- Google's internal quality framework, applicable as creator-facing quality
  signal
- Experience: first-hand content signals
- Expertise: depth of domain knowledge
- Authoritativeness: external recognition, citations from other sources
- Trustworthiness: accuracy signals, source attribution

### 3.5 Voice and POV Detection Implementation

Voice detection signals (in priority order): [D4b, D8]

1. **First-person experience language:** "I tested", "we built", "in my
   experience" → authentic voice
2. **Institutional voice markers:** "our research", "the company", "according to
   our data" → institutional
3. **Aggregator signals:** "according to", "as reported by", "sources say" →
   secondary aggregation
4. **Vendor voice:** product names in every paragraph, "our solution", "request
   a demo" → marketing
5. **Generated content markers:** uniform paragraph length, absence of specific
   detail, hedging without substance → potentially generated [D8]

---

## 4. Engineer View Design

### 4.1 Scope Decision

**CONFIDENCE: HIGH** — The Engineer View for `/website-analysis` should focus on
creator-relevant technical dimensions, not deep technical audits. A full
accessibility audit, performance profiling, or SEO technical audit is out of
scope. The Engineer View answers: "What technical decisions shaped what this
site can offer me?" [D7]

### 4.2 Priority 1 Dimensions (Always Include)

**Freshness Detection (8 methods, priority ordered):** [D7]

| Priority | Method                                                                 | Signal                    | Reliability            |
| -------- | ---------------------------------------------------------------------- | ------------------------- | ---------------------- |
| 1        | HTTP Last-Modified header                                              | Direct server signal      | HIGH                   |
| 2        | HTTP ETag header                                                       | Indirect freshness signal | MEDIUM                 |
| 3        | HTML `<meta name="date">` or `<meta property="article:modified_time">` | Author-declared           | HIGH when present      |
| 4        | JSON-LD `dateModified`                                                 | Structured data           | HIGH when present      |
| 5        | Visible publication/update dates in content                            | Author-declared           | MEDIUM (format varies) |
| 6        | Git commit date (if site is open source)                               | Code freshness proxy      | MEDIUM                 |
| 7        | Sitemap `<lastmod>`                                                    | Crawl signal              | LOW (often incorrect)  |
| 8        | Copyright year in footer                                               | Rough proxy               | LOW                    |

**Trust Signals:** [D7]

- Author credentials: bylines, author bio links, institutional affiliation
- External citations: does the content cite primary sources?
- HTTPS enforcement
- Organizational transparency: About page, contact info
- E-E-A-T signal summary (see Section 3.4)

### 4.3 Priority 2 Dimensions (Include When Relevant)

**Readability Metrics (5 formulas, use Flesch-Kincaid as default):** [D7]

| Formula                    | Grade Range | Best For                     |
| -------------------------- | ----------- | ---------------------------- |
| Flesch-Kincaid Grade Level | 1-12+       | General content assessment   |
| Flesch Reading Ease        | 0-100       | Quick readability scan       |
| Gunning Fog Index          | 6-17        | Technical writing assessment |
| SMOG Grade                 | 6-18        | Healthcare/medical content   |
| Coleman-Liau Index         | 1-12+       | Alternative to F-K           |

**Heading Hierarchy as IA Signal:** [D7]

- H1 count (should be 1 per page)
- H2-H6 depth and distribution
- Heading text quality (descriptive vs. keyword-stuffed)
- Heading structure as proxy for content organization quality

**Content Depth Proxy:** [D7]

- Word count per page
- Average sentence length
- Lexical density (unique words / total words) — target >50% as quality proxy
  [D8]
- Factual density: estimate of facts-per-100-words (NOTE: CONFIDENCE: LOW — this
  metric comes from a single source and has not been independently validated)
  [D7]

### 4.4 Technical Stack Detection

**CMS Detection via Wappalyzer patterns (7,200+ signatures):** [D5]

- WordPress: `wp-content`, `wp-includes`, `wlwmanifest`, `xmlrpc.php`
- Ghost: `ghost.css`, `@tryghost`, `content-api`
- Substack: `substack.com` CDN references, `substackcdn.com`
- Hugo: `hugo-*` class names, meta generator tag
- Jekyll: `jekyll-*`, GitHub Pages hosting signals
- Netlify/Vercel: hosting platform signals in response headers

**Framework detection (from Section 2.2):** React, Next.js, Angular, Vue,
SvelteKit, Gatsby

**Hosting signals:**

- Cloudflare: `CF-Ray` header, `cf-cache-status`
- Fastly: `X-Served-By`, `X-Cache` with Fastly identifiers
- AWS CloudFront: `X-Amz-Cf-Id`
- Vercel: `x-vercel-id`
- Netlify: `x-nf-request-id`

---

## 5. Classification and Metadata

### 5.1 Fifteen-Type Site Taxonomy

**CONFIDENCE: HIGH** — 15-type taxonomy with auto-detection signals: [D5]

| Type               | Key Detection Signals                                                               | Extraction Mode |
| ------------------ | ----------------------------------------------------------------------------------- | --------------- |
| Blog               | `og:type=article`, H-entry microformat, chronological archive, RSS feed             | Static          |
| Documentation      | `/docs/`, `/reference/`, `/api/`, code blocks >20% content, version selector        | Static          |
| SPA/App            | Empty body + `<div id="root">`, JS framework + no static content                    | JS-required     |
| E-commerce         | Schema.org Product/Offer, cart links, price elements, `og:type=product`             | Static or JS    |
| Curated List       | Lists >15 items with external links, "awesome" in URL/title, low prose ratio        | Static          |
| Forum/Community    | Reply chains, user cards, karma/reputation signals, threaded structure              | Static          |
| News/Media         | `og:type=news_article`, news publisher schema, AMP tags, high publication frequency | Static          |
| API Docs           | OpenAPI/Swagger refs, endpoint patterns (`/v1/`, `/v2/`), code examples >30%        | Static          |
| Government         | `.gov` TLD, official seals, FOIA references, dense legal language                   | Static          |
| Academic           | DOI references, author affiliations, abstract sections, citation sections           | Static          |
| Portfolio          | Gallery/grid layouts, project case studies, contact CTA, personal domain            | Static          |
| Landing Page       | Single page, CTA-heavy, pricing tables, testimonials, no deep navigation            | Static          |
| Registry/Directory | Sortable/filterable lists, pagination, search box, structured entries               | JS or Static    |
| Tool/Utility       | Interactive elements, input/output UI, no main prose content                        | JS-required     |
| Social Media       | Login gates, user-generated content streams, platform branding                      | JS-required     |

### 5.2 Four-Layer Auto-Classification Algorithm

**CONFIDENCE: HIGH** — Weight-based classification across 4 signal layers: [D5]

| Layer              | Weight | Signals                                  |
| ------------------ | ------ | ---------------------------------------- |
| JSON-LD @type      | 0.40   | Schema.org type declarations             |
| Meta generator tag | 0.30   | CMS identification                       |
| URL/OG type        | 0.20   | `og:type`, URL path patterns, TLD        |
| DOM structure      | 0.10   | Element ratio analysis, heading patterns |

Final classification = weighted sum across layers. Minimum confidence threshold:
0.60 for definitive classification; 0.40-0.60 = "likely [type] — unverified".

### 5.3 Metadata Extraction

**Open Graph coverage (CONFIDENCE: HIGH):** 64% of pages (Web Almanac 2024,
n=17M sites) [D14] **JSON-LD coverage (CONFIDENCE: HIGH):** 41% of pages; 89.4%
of schema.org implementations use JSON-LD [D14] **All metadata extractable from
static HTML — no JS rendering required.** [D14]

**Recommended extraction library: Cheerio** [D14]

- 12ms per file (fastest among evaluated options)
- Best developer experience for Node.js
- jQuery-compatible selector API

**Metadata extraction pipeline:** [D14]

```
1. Fetch HTML (static)
2. Parse with Cheerio
3. Extract in priority order:
   a. JSON-LD (highest fidelity for structured data)
   b. Open Graph meta tags (og:title, og:description, og:type, og:image)
   c. Twitter Card meta tags (fallback)
   d. Standard HTML meta (name=description, name=author, name=keywords)
   e. HTML structural elements (h1, title, canonical link)
4. Normalize to unified metadata schema
5. sameAs extraction for entity disambiguation
```

**Key metadata fields:** [D14]

- `og:type` → site type signal
- `article:published_time`, `article:modified_time` → freshness
- `og:site_name` → site identity
- `author`, `og:author` → attribution
- `canonical` → deduplication
- `sameAs` → entity linking (Wikipedia, Wikidata, LinkedIn, etc.)

**AMP signal:** AMP tags (`<link rel="amphtml">`, `<html amp>`) are a reliable
news/media type signal. [D5]

**Sitemap structure as scale signal:** sitemap index (multiple sitemaps)
indicates large sites (10k+ pages). Sitemap `<lastmod>` values are often
inaccurate — use HTTP headers for freshness instead. [D5]

---

## 6. Link Scoring and Mining

### 6.1 Pre-filter: Link Density Thresholds

Before scoring individual links, filter out boilerplate-dominated pages: [D6,
D9a]

- **jusText threshold:** 0.20 (link density per block — blocks above this are
  classified as boilerplate)
- **Readability threshold:** 0.25-0.50 (link density per content element)
- **Note on measurement units:** These thresholds use different units (per-block
  vs. per-element) and are not directly comparable. Apply the tool's native
  threshold when using that tool. [D6]
- **Expedition trigger threshold:** >40 unique external links per page triggers
  cross-site synthesis suggestion [D9a]
- **Expected output after pre-filtering:** typical pages yield 5-20 scoreable
  external content links [D6]

### 6.2 Seven-Component Scoring Formula

**CONFIDENCE: HIGH** — Weights sum to 1.0: [D6]

| Component                     | Weight | Description                                           |
| ----------------------------- | ------ | ----------------------------------------------------- |
| Context relevance (TF-IDF)    | 0.25   | Semantic relevance of surrounding text to query/topic |
| Anchor quality                | 0.20   | Descriptive vs. generic anchor text quality           |
| Position / semantic container | 0.15   | Where the link appears in the page structure          |
| URL pattern                   | 0.15   | Path structure signals content type                   |
| Link type                     | 0.10   | Tutorial/reference/paper > article > social/marketing |
| Novelty                       | 0.10   | New domain vs. previously seen domain                 |
| Alive check (HEAD request)    | 0.05   | HTTP 200 vs. redirect vs. 404                         |

**Semantic container scoring for position component:** [D6]

- `<article>` content: +1.0 (highest signal)
- `<main>` content: +0.8
- `<section>` content: +0.5
- `<aside>` content: +0.1
- `<nav>`, `<header>`, `<footer>`: DISCARD (boilerplate navigation)

### 6.3 Link Type Taxonomy

**CONFIDENCE: HIGH** — Three-tier priority: [D6]

| Tier   | Types                                             | Score Modifier |
| ------ | ------------------------------------------------- | -------------- |
| HIGH   | Tutorial, Reference, Academic Paper, Tool/Library | +0.3           |
| MEDIUM | Long-form Article, Community Discussion, Video    | 0.0 (baseline) |
| LOW    | Social Media Post, Marketing Page, Press Release  | -0.2           |

**URL pattern signals for link type:**

- `/paper/`, `/research/`, `/pdf/`, DOI URLs → Academic Paper
- `/docs/`, `/reference/`, `/api/` → Reference
- `/tutorial/`, `/guide/`, `/how-to/` → Tutorial
- GitHub/GitLab URLs → Tool/Library (if not issue tracker)
- Twitter/X, LinkedIn, Facebook → Social Media
- `/press/`, `/newsroom/`, `/announcement/` → Press Release

### 6.4 Five-Stage Processing Pipeline

Target: <5 seconds total per page [D6]

1. **Fetch** (1-2s): HTTP GET with appropriate User-Agent
2. **Parse** (50ms): Cheerio/jsdom HTML parsing
3. **Pre-filter** (100ms): Link density threshold application, boilerplate
   removal
4. **Score** (200ms): 7-component scoring for remaining links
5. **Alive check** (1-2s): Parallel HEAD requests for top-N candidates (N=10 by
   default)

### 6.5 External Domain Ratio as Discriminator

**CONFIDENCE: HIGH** — External domain ratio is the best discriminator between
content-rich pages and link farms/directories: [D9a]

- Web Almanac 2025: median 6 links per page, 90th percentile 25 links
- Awesome lists (curated link collections): 800-900 links per page
- Link farms: high link count + low prose + low anchor text diversity
- Content-rich pages: high external ratio within main content zone + high anchor
  text diversity

**LLM-based page classification accuracy:** F1=0.894 for link density
classification tasks [D9a]

---

## 7. Compliance and Pre-flight

### 7.1 Pre-flight Gate Design

**CONFIDENCE: HIGH** — Three-tier gate: hard-block, warn, informational [D3]

**Hard-block conditions (stop skill entirely):**

- `Disallow: /` for `User-agent: *` or
  `User-agent: ClaudeBot`/`Claude-User`/`Claude-SearchBot`
- `X-Robots-Tag: noindex, nofollow` on target page
- Known cease-and-desist history (manual flag — not automatable)
- Site explicitly in llms.txt disallow list

**Warn conditions (surface to user, require acknowledgment before proceeding):**

- ToS pattern matches: "no automated access", "no scraping", "machine-readable
  use prohibited"
- GDPR-sensitive content: user-generated data, personal information pages
- Paywall detection (hard or soft)
- Rate-limit signals in headers (`Retry-After`, `X-RateLimit-*`)

**Informational (log, do not block):**

- Crawl-delay in robots.txt → honor the delay
- Sitemap exclusions (don't crawl excluded paths)
- llms.txt partial allow list → limit to allowed sections

### 7.2 robots.txt Compliance

**Recommended library: robots-parser v3.0.1 (Node.js)** [D3]

- RFC 9309 compliant (the 2022 IETF standard for robots.txt)
- Handles: `User-agent`, `Disallow`, `Allow`, `Crawl-delay`, `Sitemap`
- Correctly handles overlapping rules (more specific wins)

**Anthropic user agents to check:** [D3]

- `ClaudeBot` — web crawling
- `Claude-User` — user-initiated browsing
- `Claude-SearchBot` — search indexing
- All three respect robots.txt as of research date

**Critical shift:** OpenAI's `ChatGPT-User` removed robots.txt compliance in
December 2025. This is a major deviation from the voluntary compliance regime.
Anthropic has NOT followed this change. The skill must honor robots.txt even
when competitors do not. [D3]

### 7.3 Legal Landscape

**CONFIDENCE: MEDIUM** (jurisdiction-dependent, evolving): [D3]

**hiQ v. LinkedIn:** CFAA (Computer Fraud and Abuse Act) does NOT prohibit
scraping publicly accessible data. However, ToS violations still create civil
liability under contract law. Settlement: $500k (2022). The
scraping-is-legal-but-risky conclusion stands as of research date.

**GDPR:** Public availability does not remove data protection obligations.
France CNIL fined KASPR €240k for scraping LinkedIn data (2024). Key
distinction: scraping public profiles for commercial use is higher risk than
scraping editorial content.

**llms.txt emerging standard:** [D3]

- Proposed by Jeremy Howard (fast.ai), inspired by robots.txt
- Machine-readable file at `/llms.txt` declaring AI training/scraping
  preferences
- Not an official standard — adoption growing but not universal
- Check for presence; honor declared preferences even if not legally binding

### 7.4 Compliance Check Implementation

```
1. Fetch robots.txt (cache for session)
2. Parse with robots-parser v3.0.1
3. Check all three Anthropic user agents against target URL
4. Fetch X-Robots-Tag from target page headers
5. Pattern-match ToS URL if available (heuristic search: /terms, /tos, /legal)
6. Check for llms.txt at site root
7. Compute GDPR risk score (personal data signals in URL + content type)
8. Classify: HARD_BLOCK | WARN | PROCEED
9. If WARN: surface to user with specific reason, require explicit acknowledgment
10. If PROCEED: log compliance assessment in analysis.json
```

---

## 8. Expedition Mode

### 8.1 Closest Analogs

**CONFIDENCE: HIGH** — No existing tool does exactly what Expedition Mode
proposes, but two tools provide the closest UX analogs: [D10a]

- **ResearchRabbit:** Iterative chaining via "find similar papers" from a seed
  paper. User selects which papers to expand. Visualizes as a growing graph.
  Closest analog to the expand-from-node pattern.
- **Exa `findSimilar`:** Given a URL, returns semantically similar pages using
  neural "next-link prediction" embeddings. Could power expedition link
  recommendations. [D13b]

**What no tool does:** Site-centric multi-hop navigation from within a developer
workflow, with HITL (human-in-the-loop) at each hop, state persistence, and
creator-view analysis at each node.

### 8.2 UX Design

**CONFIDENCE: HIGH** — Three options per step, ranked list format: [D10a]

**At each hop, present:**

```
Expedition at [current-URL] (Depth 2/3, Pages 8/15)

Continue from here:
  1. [HIGH] Link title — why this is relevant (context relevance score: 0.87)
  2. [HIGH] Link title — why this is relevant (context relevance score: 0.81)
  3. [MEDIUM] Link title — why this is relevant (context relevance score: 0.72)
  4. [HIGH] Link title — why this is relevant (context relevance score: 0.68)
  5. [WILDCARD] Link title — unexpected connection (serendipity pick)

Or: [s]top expedition | [b]ack to [parent-URL] | [v]iew full tree
```

**Key UX decisions:** [D10a]

- 3-5 options (not more) — cognitive load research supports 3-7 items
- Ranked list, not cards — easier to parse in terminal/Claude Code context
- Always include 1 wildcard (epsilon-greedy serendipity)
- Always include back-to-parent option
- Always show progress: depth/max, pages/max

**Interaction rate comparison:** [D10a]

- Google "People Also Ask": 3% interaction rate
- Perplexity related questions: 40% interaction rate
- Design implication: Perplexity's framing ("here's what's worth exploring
  next") drives engagement; PAA's "you might also ask" does not. Frame
  expedition options as recommendations, not suggestions.

### 8.3 Budget and Limits

**CONFIDENCE: HIGH** [D10a, D10b]:

| Parameter             | Default                       | Rationale                                                   |
| --------------------- | ----------------------------- | ----------------------------------------------------------- |
| `depth_max`           | 3 hops                        | Each hop is a new site context; 3 is cognitively manageable |
| `pages_max`           | 15                            | Balances coverage with cost                                 |
| `tokens_per_page`     | ~2,500                        | Estimate for average content page with metadata             |
| `wall_clock_per_page` | 10-15 seconds                 | Static + scoring pipeline                                   |
| `alive_check_timeout` | 5 seconds                     | HEAD request timeout                                        |
| `options_per_step`    | 4 high-relevance + 1 wildcard | Epsilon-greedy strategy                                     |

**Domain-adaptive depth:** 3 hops is recommended for open web. Academic or
curated domains (arXiv, GitHub Awesome lists, Wikipedia) may support 5+ hops
viably — the saturation signal (3 consecutive pages yielding no new themes) is
the better stopping rule than a fixed depth limit. [D10a]

### 8.4 State Management: Three-File Pattern

**CONFIDENCE: HIGH** — Append-only compatible state with JSONL event log: [D10b]

```
.research/[site-slug]/
├── expedition-[timestamp].meta.json    # Session metadata (L1, full rewrite on update)
├── expedition-[timestamp].snap.json    # Current tree snapshot (L2, full rewrite on update)
└── expedition-[timestamp].jsonl        # Event log (L3, append-only, never rewritten)
```

**expedition.meta.json schema:**

```json
{
  "session_id": "exp-[timestamp]",
  "seed_url": "https://example.com",
  "started_at": "ISO 8601",
  "depth_max": 3,
  "pages_max": 15,
  "pages_visited": 0,
  "status": "active | paused | complete"
}
```

**expedition.snap.json schema (flat array with parent pointers):** [D10b]

```json
{
  "nodes": [
    {
      "id": "node-001",
      "url": "https://example.com",
      "depth": 0,
      "parent_id": null,
      "visited_at": "ISO 8601",
      "title": "Example Site",
      "score": 1.0,
      "status": "analyzed | visited | skipped"
    }
  ]
}
```

**Why flat array (not nested JSON):** Append-only JSONL events add nodes without
rewriting the tree structure. Parent pointer traversal is O(n) but n is small
(max 15 nodes). [D10b]

**expedition.jsonl event types:** [D10b]

```
node_visit       — URL visited, depth, timestamp
snapshot         — periodic tree snapshot (for recovery)
budget_warning   — pages_max - 5 warning
expedition_paused  — user initiated pause
expedition_resumed — resume from pause
expedition_complete — terminal condition reached
```

### 8.5 Resume Protocol

**Six-step resume:** [D10b]

1. On skill invocation for a URL, scan `.research/[site-slug]/` for
   `expedition-*.meta.json`
2. If found: read `meta.json` (status check) + `snap.json` (tree reconstruction)
3. Parse JSONL event log for events after last snapshot
4. Reconstruct current tree state
5. Present path summary: "Previous expedition found: [N] pages, depth [D], last
   visited [URL]. Resume from [current node] or start fresh?"
6. Wait for user decision before proceeding

**Chromium history as design signal:** Chromium stores browser history as a flat
list, not a tree — even though navigation is tree-structured. This is because
flat storage is more resilient and queryable. Apply the same principle: flat
JSONL event log, reconstruct tree in memory on demand. [D10b]

---

## 9. Cross-site Synthesis

### 9.1 Four Synthesis Paradigms

**CONFIDENCE: HIGH** — Select paradigm based on research goal: [D9b]

| Paradigm     | When to Use                                                       | Output Structure              |
| ------------ | ----------------------------------------------------------------- | ----------------------------- |
| Thematic     | Finding common themes across sites (PRIMARY)                      | Theme → evidence from N sites |
| Narrative    | Tracking evolution of an idea across sources                      | Timeline or progression       |
| Matrix       | Structured comparison across identical dimensions                 | Sites × dimensions table      |
| Meta-pattern | Synthesizing synthesis (finding patterns in how sites synthesize) | Pattern taxonomy              |

**Thematic synthesis is the default** for open-ended creator research. Start
with thematic; offer to switch to matrix if the user wants structured
comparison.

### 9.2 Signal Types in Cross-site Analysis

**CONFIDENCE: HIGH** [D9b]:

| Signal      | Definition                                                    | Weight                            |
| ----------- | ------------------------------------------------------------- | --------------------------------- |
| Convergence | Same claim/finding across independent sites                   | 3x claim confidence boost         |
| Divergence  | Contradicting claims across sites — surface explicitly        | Flag for user resolution          |
| Gap         | Topic covered by one site but missing from others             | Highlight as research opportunity |
| Trend       | Pattern visible only across sites, not within any single site | Best-of-breed insight             |

**Source weighting for cross-site synthesis:** [D9b]

- T1 Original research (primary data): 3x weight
- T2 Expert synthesis (secondary analysis by domain experts): 2x weight
- T3 Aggregation (curated collections, lists): 1x weight
- T4 Secondary aggregation (blogs summarizing other blogs): 0.5x weight

### 9.3 Optimal Scale and Stopping Rules

**CONFIDENCE: MEDIUM** (based on synthesis research, not empirical web analysis
data): [D9b]

- **Optimal site count:** 5-12 sites for thematic synthesis
- **Below 5:** insufficient for triangulation
- **Above 12:** diminishing returns without systematic framework
- **Stopping rule:** thematic saturation — 3 consecutive sites yield no new
  themes → synthesis is complete
- **Parallel analysis:** analyze all sites independently before synthesis to
  prevent anchoring bias

**Query fan-out (from Google AI Overviews design):** [D13b]

- 8-12 sub-queries per topic
- Cross-variant verification: rephrase the same question multiple ways
- Apply this to cross-site: generate 8-12 thematic questions, then score each
  site against each question

### 9.4 High-Link-Density Trigger

When a page has >40 unique external links, automatically suggest cross-site
expedition: [D9a]

```
This page links to 47 external domains. Consider:
  - Expedition: follow the most relevant links for deeper analysis
  - Cross-site synthesis: analyze the top 5-12 linked domains for thematic patterns
  - Link map: export the link graph as a knowledge map
```

---

## 10. Storage Architecture

### 10.1 V1: Enhanced Markdown Vault

**CONFIDENCE: HIGH** — Zero-dependency storage, deployable immediately: [D11b,
D11c]

```
.research/
├── research-index.jsonl          # Extended with URL, domain, siteType, techStack
├── [site-slug]/
│   ├── analysis.json             # Core analysis artifact (schema in Section 13)
│   ├── findings.jsonl            # Individual findings (add source_url + source_mode)
│   ├── value-map.json            # Creator value assessment (add candidate_type)
│   ├── links.json                # Scored link candidates
│   ├── assets.json               # Images, downloadable files
│   ├── tables.json               # Extracted tables
│   ├── meta.json                 # Site metadata (Open Graph, JSON-LD, etc.)
│   ├── sitemap.json              # Sitemap structure
│   ├── SITE-ANALYSIS.md          # Human-readable Creator View report
│   └── expedition-*.{meta.json,snap.json,jsonl}   # Expedition state (if applicable)
```

**YAML frontmatter schema (Obsidian/Dataview compatible):** [D11a, D11c]

```yaml
---
site_url: https://example.com
site_slug: example-com
site_type: Blog
analysis_date: 2026-04-05
creator_relevance: HIGH
confidence: MEDIUM
tech_stack: [Next.js, Tailwind]
topics: [React, performance, SSR]
expedition_id: exp-20260405-001
---
```

**research-index.jsonl extensions for website-analysis:** [D11c]

```json
{
  "id": "ws-001",
  "type": "website",
  "url": "https://example.com",
  "slug": "example-com",
  "domain": "example.com",
  "siteType": "Blog",
  "techStack": ["Next.js", "Tailwind"],
  "analysisDate": "2026-04-05",
  "creatorRelevance": "HIGH"
}
```

### 10.2 V2: SQLite + Markdown Hybrid

**CONFIDENCE: HIGH** — Recommended long-term architecture for structured
queries: [D11b]

- SQLite FTS5 for full-text search over extracted content
- Markdown files remain as human-readable artifacts (source of truth)
- SQLite as derived index (regenerable from markdown)
- Schema: sites table + findings table + links table + tags table

### 10.3 MCP Integration

**Recommended MCP servers:** [D11a, D11b]

| Server                              | Type                 | Use Case                         | License     |
| ----------------------------------- | -------------------- | -------------------------------- | ----------- |
| MCPVault                            | Filesystem-based     | Basic vault MCP without Obsidian | Open source |
| QMD MCP                             | Hybrid BM25+vector   | Instant search over .research/   | Open source |
| Knowledge Graph MCP                 | Entity/relation      | Relationship queries at scale    | Open source |
| Anytype MCP (@anyproto/anytype-mcp) | Anytype integration  | Cross-platform sync              | Official    |
| Raindrop.io MCP                     | Bookmark integration | URL-to-analysis bridging         | Official    |

**NotebookLM status:** NO public API for consumer users. Enterprise REST API
exists in alpha. Not viable for v1 integration. [D11b]

### 10.4 Karpathy Multi-Resolution Pattern

**CONFIDENCE: HIGH** — Apply to website analysis storage: [D11a]

| Level | Size           | Content                                           |
| ----- | -------------- | ------------------------------------------------- |
| L0    | ~200 tokens    | Site identity, type, 1-sentence summary           |
| L1    | 1-2K tokens    | SITE-ANALYSIS.md index, key themes, top links     |
| L2    | Search results | findings.jsonl query results, link scoring output |
| L3    | Full content   | Complete extracted content, all artifacts         |

Use L0 for routing, L1 for overview, L2 for targeted retrieval, L3 for deep
analysis. Never load L3 when L1 suffices.

### 10.5 URL-to-Slug Algorithm

**CONFIDENCE: HIGH** — Windows MAX_PATH compliant: [D12]

```
1. Extract hostname + path from URL
2. Lowercase, replace non-alphanumeric with hyphens
3. Replace path separators (/) with double-hyphens (--)
4. Truncate to 80 characters
5. If truncated OR collision risk: append SHA-256(original URL)[0:6] as suffix
6. Result: example-com--blog--post-title-ab12cd
```

**Max path calculation:** Windows MAX_PATH = 260. Reserve 80 for `.research/`
prefix + site slug. Site slug max = 80 chars. This leaves ample room for nested
file names.

---

## 11. AI Tool Integration

### 11.1 Tool Selection Matrix

**CONFIDENCE: HIGH** — Categorized by use case for the skill: [D13a, D13b]

| Tool           | License     | Cost                 | Best For                   | Limitation                             |
| -------------- | ----------- | -------------------- | -------------------------- | -------------------------------------- |
| Crawl4AI       | Apache-2.0  | Free (self-host)     | JS rendering, anti-bot     | Requires Docker                        |
| Jina Reader    | Apache-2.0  | Free (API)           | Zero-config fallback       | Elastic acquisition uncertainty        |
| Firecrawl      | AGPL        | $0.001+/page (cloud) | Managed crawling           | Credit multiplier stacking (see below) |
| Playwright MCP | Apache-2.0  | Free                 | Auth/interactive sites     | Token cost high                        |
| Exa            | Proprietary | Pay-per-use          | findSimilar for expedition | Not a crawler                          |
| Tavily         | Proprietary | Pay-per-use          | Agent infrastructure       | Not a site analyzer                    |
| Diffbot        | Proprietary | $299+/month          | ML extraction at scale     | Enterprise only                        |

### 11.2 Firecrawl Credit Multiplier Warning

**CONFIDENCE: HIGH** — Credit stacking can make Firecrawl expensive at scale:
[D1b, D13a]

- Base cost: 1 credit per page
- Enhanced Mode: +4 credits per page
- JSON extraction: +4 credits per page
- Enhanced + JSON: **9 credits per page**
- At $0.001/credit: $0.009/page individually vs. $0.001/page base

For the skill, avoid stacking Enhanced Mode + JSON extraction unless both are
genuinely required. Use Crawl4AI (free) for extraction; use Firecrawl's cloud
API only for edge cases where self-hosting is unavailable.

### 11.3 Exa as Expedition Recommendation Engine

**CONFIDENCE: MEDIUM** — Viable integration but requires API cost management:
[D13b]

- `findSimilar(url)` returns semantically similar pages using neural embeddings
- Deep mode: 3.5s P50 latency for complete content retrieval
- Neural "next-link prediction": trained to predict what knowledgeable people
  link to next
- Could power expedition link recommendations: given current node URL, Exa
  findSimilar returns candidate next nodes

**Integration pattern:**

```
Expedition step:
1. Score current page's internal links (7-component formula)
2. Call Exa.findSimilar(current_url) → external candidates
3. Merge internal and external candidates, deduplicate
4. Rank combined list, present top 4 + 1 wildcard
```

### 11.4 What to Learn from Each AI Tool

**From Perplexity Deep Research:** [D13b]

- Citation-before-generation: embed citations during context assembly, not
  retroactively
- Sub-query decomposition: 20-50 targeted sub-queries per research task → apply
  to expedition as sub-question generation per hop
- Saturation detection: track what's been covered; stop when marginal coverage
  drops

**From Exa:** [D13b]

- Neural similarity as expedition navigation signal
- findSimilar as "what would a knowledgeable person link to next?" primitive
- Deep mode for full content retrieval with semantic search

**From Google AI Overviews:** [D13b]

- Query fan-out (8-12 variants) for broad coverage
- E-E-A-T as quality filter — apply as link type scoring factor
- Multimodal citation bonus (+317%) → visual content in pages may indicate
  higher authority (worth testing)

**From Tavily:** [D13b]

- Purpose-built agent infrastructure: Extract API, Crawl API, Research API as
  separate concerns
- Security hardening for agent use: SOC 2 Type II, 99.99% SLA — model for
  enterprise-grade skill reliability

**From Diffbot:** [D13b]

- Knowledge Graph with 10B entities: entity disambiguation at scale (use as
  inspiration for `sameAs` extraction design)
- ML-based visual extraction: alternative to DOM-based extraction for complex
  layouts

### 11.5 Market Gap Confirmation

**CONFIDENCE: HIGH** — The `/website-analysis` skill addresses a genuine market
gap: [D13b]

All existing AI analysis tools are **query-centric** (answer a question) or
**crawl-centric** (index for search). None are **site-centric** (analyze a site
as an artifact for creator use). This is the core design insight that makes the
skill novel and defensible.

---

## 12. Anti-patterns and Bias Mitigation

### 12.1 Eleven Absence Pattern Types

**CONFIDENCE: HIGH** — Detection flags with recommended action: [D8]

| Pattern           | Description                                              | Detection Signal                                       | Recommended Action                                |
| ----------------- | -------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------- |
| DEAD_BLOG         | Last post >18 months ago, no updates                     | Publication dates, HTTP Last-Modified                  | Flag age; note historical value only              |
| VENDOR_BROCHURE   | All content is product marketing                         | High product-name density, CTA ratio                   | Surface in Creator View Warning section           |
| SPA_SHELL         | JS-required but bot protection blocks rendering          | JS-required + 403/captcha on render attempt            | Surface extraction failure; suggest manual review |
| PAYWALLED_HARD    | All content behind hard paywall                          | Paywall overlay + zero extractable content             | Hard-block extraction; surface to user            |
| PAYWALLED_SOFT    | First-N-free articles, then paywall                      | Partial content + cookie-based gate                    | Extract available content; note paywall           |
| CAPTIVE_JS        | Content technically JS-rendered but bot-detection blocks | Cloudflare challenge page, CAPTCHA                     | Surface as extraction failure; do not retry       |
| AGGREGATOR        | Site aggregates but adds no original analysis            | High external link ratio + low prose + no bylines      | Note aggregator status; use links, not prose      |
| LINK_FARM         | Thin content optimized for link density                  | >95% link-to-prose ratio                               | DISCARD; not a knowledge source                   |
| GENERATED_CONTENT | LLM-generated content with no original insight           | Uniform paragraph length, hedging without specifics    | Surface suspicion; low confidence on all claims   |
| CURATED_LIST_WEB  | Awesome list type — links are the content                | >15 items, minimal prose, external-heavy               | Treat as link source, not knowledge source        |
| REGISTRY          | Directory of entities — content is the index             | Sortable/filterable, structured entries, minimal prose | Extract registry data; not narrative content      |

### 12.2 Detection Capability by Analysis Mode

**CONFIDENCE: MEDIUM** — Not all absence patterns are detectable in Quick Scan:
[D8]

| Pattern           | Quick Scan      | JS Rendering          | Crawl (3+ pages) |
| ----------------- | --------------- | --------------------- | ---------------- |
| DEAD_BLOG         | Yes (dates)     | No                    | Yes (trend)      |
| VENDOR_BROCHURE   | Yes             | No                    | Yes              |
| SPA_SHELL         | Yes (framework) | Detection via failure | No               |
| PAYWALLED_HARD    | Yes             | Yes                   | Yes              |
| PAYWALLED_SOFT    | Partial         | Yes                   | Yes              |
| CAPTIVE_JS        | No              | Yes (failure)         | No               |
| AGGREGATOR        | Partial         | No                    | Yes              |
| LINK_FARM         | Yes             | No                    | Yes              |
| GENERATED_CONTENT | Partial         | No                    | Partial          |
| CURATED_LIST_WEB  | Yes             | No                    | Yes              |
| REGISTRY          | Yes             | No                    | Yes              |

### 12.3 Long-tail Bias Mitigation

**CONFIDENCE: MEDIUM** — Actively counter algorithmic bias toward
high-authority, high-traffic sites: [D8]

**Positive signals for long-tail, high-value sites:**

- First-hand experience language ("I built", "we tested", "in production since")
- Specific technical depth (specific version numbers, error messages, code
  samples)
- No monetization signals (no ads, no affiliate links, no CTAs)
- External links to primary sources (not to other blogs)
- IndieWeb webring membership (human-curated quality signal)
- Small but engaged comment community

**Lexical density >50% as quality proxy:** [D8]

- Unique words / total words > 0.50 → high information density
- Generated content and thin content tend to have low lexical density
- Not a perfect signal but easy to compute and useful as a filter

**Google's internal `contentEffort` metric:** [D8]

- Internal signal estimating effort invested in content creation
- Not directly accessible externally
- Proxy: count of original examples, original diagrams, original data tables

### 12.4 AI-Generated Content Detection

**CONFIDENCE: MEDIUM** (detection is imperfect — no gold standard): [D8]

**Suspicion signals (not proof):**

- Uniform paragraph length (±20% variance)
- Hedging without specific detail ("it's important to consider", "there are many
  factors")
- Absence of personal anecdotes or specific examples
- Repetitive transitional phrases ("In conclusion", "It's worth noting")
- Zero external links in long-form content
- Publication date clustering (many posts in short time windows)

**EU AI Act watermarking (March 2025):** AI-generated content above a threshold
must be watermarked in EU jurisdictions. Detection of AI watermarks is not yet
standardized. [D8]

### 12.5 NavBoost as Feedback Loop Warning

**CONFIDENCE: LOW** (inferred from patent analysis, not confirmed
implementation): [D8]

Google's NavBoost system uses click-through data to amplify already-popular
content. Sites with high NavBoost scores (high-traffic, high-CTR) appear more
often in search results, further increasing traffic. This creates a
rich-get-richer dynamic where long-tail, low-traffic but high-quality sites are
systematically underrepresented in search results and therefore in AI training
data.

Implication: `/website-analysis` should actively surface long-tail sites when
the creator provides a URL directly, rather than only analyzing sites that
appear in search results.

---

## 13. Cross-cutting Concerns

### 13.1 Schema Parity with Repo-Analysis

**CONFIDENCE: HIGH** — 6 shared artifacts, 3 new website-specific artifacts:
[D12]

**Shared artifacts (with website-analysis extensions):**

| Artifact       | Repo-Analysis Fields                 | Website-Analysis Additions                       |
| -------------- | ------------------------------------ | ------------------------------------------------ |
| analysis.json  | repo_url, language, framework, stars | site_url, site_type, tech_stack, extraction_mode |
| findings.jsonl | finding, confidence, evidence        | source_url, source_mode (static/js/rendered)     |
| value-map.json | value_category, score, rationale     | candidate_type (concept/tool/example/dataset)    |

**New website-only artifacts:**

| Artifact         | Contents                                           |
| ---------------- | -------------------------------------------------- |
| links.json       | Scored link candidates with 7-component scores     |
| assets.json      | Images, PDFs, downloadable files with metadata     |
| tables.json      | Extracted tables with structure preservation       |
| meta.json        | Open Graph, JSON-LD, Twitter Card metadata         |
| sitemap.json     | Sitemap structure, page count, last-modified dates |
| expedition.jsonl | Expedition event log (if applicable)               |

### 13.2 JASON-OS Portability

**CONFIDENCE: MEDIUM** — Design for project-agnostic reuse: [D4b, D11c]

The skill should be portable across projects (JASON-OS principle). This means:

- No SoNash-specific logic in the skill core
- Creator context injected at runtime from CLAUDE.md / SESSION_CONTEXT.md
- `.research/` directory structure is project-agnostic
- MCP integrations (MCPVault, QMD) work across projects without reconfiguration
- Expedition state files use project-relative paths only

**CLAUDE.md context injection pattern:**

```
At skill invocation:
1. Read CLAUDE.md for project conventions, tech stack, active initiatives
2. Read SESSION_CONTEXT.md for current sprint, recent context
3. Inject as "creator context" into Creator View analysis prompt
4. Creator View output reflects this project-specific context
```

### 13.3 Analysis Mode Escalation

**CONFIDENCE: HIGH** — Four analysis modes in increasing cost/depth: [D12]

| Mode          | Trigger                              | Tools Used                                          | Cost    |
| ------------- | ------------------------------------ | --------------------------------------------------- | ------- |
| Quick Scan    | Default                              | Static fetch + Cheerio + trafilatura                | Minimal |
| Page Analysis | User request or content gate         | Quick Scan + JS detection + conditional rendering   | Low     |
| Site Crawl    | User request or expedition           | Page Analysis × N pages + link scoring              | Medium  |
| Expedition    | User request or link-density trigger | Site Crawl + HITL navigation + cross-site synthesis | High    |

### 13.4 Error Handling Patterns

**CONFIDENCE: HIGH** — Four failure modes to handle gracefully: [D2b, D3]

| Failure            | Cause                            | Handling                                          |
| ------------------ | -------------------------------- | ------------------------------------------------- |
| Extraction failure | JS-required site, bot protection | Surface mode; offer to escalate or skip           |
| Compliance block   | robots.txt, ToS pattern          | Hard stop; explain reason; no retry               |
| Budget exhaustion  | pages_max or depth_max reached   | Surface warning; ask to extend or stop            |
| Stale expedition   | Previous expedition >7 days old  | Warn about staleness; offer fresh start or resume |

### 13.5 Contradiction Resolution Log

The following contradictions were identified across findings files and are
resolved here:

| Contradiction                                                       | Resolution                                                                                                                                                                         |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ScrapingHub benchmark vs. htdocs.dev benchmark on extractor ranking | Dataset-dependent — trafilatura wins across diverse content types; Readability wins on clean articles. Use trafilatura as default; Readability as article-specific fallback. [D1a] |
| Next.js SSR false positive (framework ≠ JS-required)                | Framework detection is a necessary but not sufficient signal. Always run content-absence check before triggering rendering. [D2a]                                                  |
| jusText (0.20) vs. Readability (0.25-0.50) link density thresholds  | Different measurement units. Apply each tool's native threshold. These are not competing values — they measure different things. [D6]                                              |
| 3-hop vs. 5+-hop expedition depth                                   | 3 hops for open web (default). 5+ hops viable for academic/curated domains. Use thematic saturation as the primary stopping rule, not a fixed depth limit. [D10a]                  |
| Flat JSONL index vs. knowledge graph for storage                    | Flat JSONL correct for <100 analyses (v1). Knowledge graph MCP for relationship queries at scale (v2+). Not competing architectures — sequential adoption. [D11c]                  |
| Crawl4AI license: MIT vs. Apache-2.0                                | Apache-2.0 is correct. MIT claim in one source was an error. Verified against repository license file. [D1b]                                                                       |

---

## 14. Serendipitous Discoveries

These findings were unexpected and may influence design decisions beyond their
immediate context.

### From Extraction and Rendering (D1a, D1b, D2a, D2b)

1. **Rust port of trafilatura reaches F1=0.970** — higher than Python version.
   If the skill is ever implemented in a multi-language environment, the Rust
   port is worth considering for high-volume extraction. [D1a]

2. **Trafilatura's SimHash deduplication** means the skill gets deduplication
   for free when using trafilatura as the primary extractor — no need to
   implement separate content deduplication. [D1a]

3. **njsparser for RSC flight data** — React Server Components embed serialized
   React tree in special `__NEXT_F` chunks. njsparser can extract structured
   data from RSC flight payloads, unlocking structured extraction from
   RSC-rendered pages that would otherwise require full rendering. [D2a]

4. **Playwright MCP's 26-tool surface** is a design signal in itself: tool
   proliferation = complexity hidden behind API. The skill should expose minimal
   tool surface to users, handling complexity internally. [D2b]

5. **Crawlee's dual-run comparison approach** (run static and rendered
   extraction in parallel, compare cosine similarity) is more reliable than
   heuristic JS detection alone. This could be the basis for an automated
   JS-necessity detection pass in the skill. [D2a]

### From Classification and Metadata (D5, D14)

6. **AMP as a news signal** — `<link rel="amphtml">` or `<html amp>` is a
   reliable indicator of news/media content type. AMP is declining in adoption
   but still present in 15-20% of news sites. [D5]

7. **`sameAs` for entity disambiguation** — JSON-LD's `sameAs` property links a
   site/organization to its Wikipedia, Wikidata, LinkedIn, and other canonical
   identities. This is an underutilized signal for understanding what entity a
   site represents. [D14]

8. **Sitemap index structure as scale signal** — A sitemap index (rather than a
   single sitemap) indicates a site with 10k+ pages. This is a reliable proxy
   for site scale without requiring crawling. [D5]

9. **Wappalyzer has 7,200+ CMS/technology signatures** — this is the most
   comprehensive technology detection database available. The open-source
   patterns JSON can be bundled with the skill for offline CMS detection without
   external API calls. [D5]

### From Link Scoring and Expedition (D6, D9a, D9b, D10a, D10b)

10. **Perplexity's 40% related-question interaction rate vs. Google PAA's 3%** —
    framing drives engagement. "Here's what's worth exploring next"
    (recommendation) vs. "you might also ask" (suggestion) creates a 13x
    difference in interaction rate. Apply to expedition UX: frame options as
    recommendations, not possibilities. [D10a]

11. **Plan-MCTS (February 2026)** — Monte Carlo Tree Search applied to LLM
    planning. Suggests expedition navigation could eventually be automated using
    MCTS-style exploration, with human override at each node. Not v1 scope but
    worth tracking. [D10b]

12. **Chromium's flat-list history storage** — the browser that pioneered modern
    navigation history stores it as a flat list (not a tree), even though
    navigation is inherently tree-structured. This validates the flat JSONL +
    parent pointer approach for expedition state. [D10b]

13. **Web Almanac 2025: 90th percentile page has 25 links** — the vast majority
    of pages (90%) have 25 or fewer links. This means the 40-link threshold for
    cross-site synthesis suggestion correctly targets the top 10% of pages
    (curated lists, directories). [D9a]

14. **HITL (human-in-the-loop) satisficing strategy** — research on human
    browser behavior shows that users satisfice (accept "good enough") rather
    than optimize. This validates the 3-5 options per expedition step design:
    more options leads to worse decisions, not better ones. [D10a]

### From Storage and Integration (D11a, D11b, D11c)

15. **Jina Reader acquired by Elastic (October 2025)** — the acquisition changes
    the long-term reliability calculus for Jina Reader as a free extraction API.
    Elastic's enterprise focus may result in paywalling or rate-limiting the
    free tier. Plan a fallback path. [D13a]

16. **Anytype now has an official MCP server** (`@anyproto/anytype-mcp`) —
    Anytype is a privacy-first, open-source Notion alternative. Its official MCP
    integration means the skill could store analyses in Anytype for creators who
    use it as their knowledge management tool. [D11b]

17. **Raindrop.io now has MCP** — Raindrop is the most popular bookmark manager
    for developers. A Raindrop MCP integration would allow the skill to bridge
    URL bookmarks directly to site analyses. [D11b]

18. **QMD MCP for instant BM25+vector search** — the QMD MCP server provides
    hybrid BM25+vector search over a markdown vault without requiring external
    services. This is the recommendation engine for searching accumulated site
    analyses. [D11c]

19. **Session logs as implicit knowledge base** — Claude Code's conversation
    logs contain structured data (URLs discussed, analyses performed, insights
    extracted) that could be retroactively indexed. The skill could offer a
    "index my session history" mode. [D11c]

### From AI Tools and Analysis (D13a, D13b)

20. **Diffbot Knowledge Graph has 10B entities** — this is by far the largest
    structured knowledge graph available via commercial API. At $299+/month it
    is out of scope for individual creators, but its entity disambiguation
    capability (`sameAs` at scale) is an aspirational v3 feature. [D13b]

21. **Tavily's SOC 2 Type II certification and 99.99% SLA** — these are
    enterprise-grade reliability standards applied to an AI research
    infrastructure product. This sets the reliability bar for the skill if it
    ever enters enterprise use. [D13b]

22. **Exa's custom embedding model trained on a 144x H200 GPU cluster** — the
    "next-link prediction" paradigm requires massive training investment. The
    findSimilar primitive represents months of GPU time as a free API call. Use
    it aggressively for expedition navigation. [D13b]

23. **Google AI Overviews: 317% multimodal citation bonus** — pages with images,
    charts, or video alongside text receive 317% more citations in Google AI
    Overview responses. This may indicate that visual content in pages
    correlates with authority/quality, not just accessibility. [D13b]

24. **Exa's "next-link prediction" hypothesis** — Exa's bet is that predicting
    what a knowledgeable person would link to next is a better search paradigm
    than keyword matching. This is a testable hypothesis for expedition design:
    compare Exa findSimilar results vs. 7-component link scoring results on the
    same expedition. [D13b]

### From Compliance and Anti-patterns (D3, D8)

25. **OpenAI ChatGPT-User removed robots.txt compliance (December 2025)** — this
    is the first major AI lab to abandon voluntary compliance with robots.txt.
    It changes the political dynamics of the compliance ecosystem. Sites may now
    implement technical blocks (Cloudflare AI bot detection) rather than relying
    on robots.txt. The skill must be prepared for increasing technical
    bot-blocking. [D3]

26. **llms.txt as an emerging standard** — sites are beginning to publish
    `/llms.txt` files declaring AI training/scraping preferences. This is not
    yet standardized but growing. The skill should check for llms.txt and honor
    its declarations proactively — this is a trust-building signal for
    Anthropic's ecosystem. [D3]

27. **EU AI Act watermarking for generated content (March 2025)** — AI-generated
    content above a threshold must be watermarked in EU jurisdictions. Once
    watermark standards are defined, the skill could detect AI-generated content
    with higher confidence. [D8]

28. **Google's internal `contentEffort` metric** — Google reportedly uses an
    internal metric measuring the effort invested in content creation. This is
    not publicly accessible but suggests that effort proxies (original examples,
    original data, original diagrams) are worth tracking in the value
    assessment. [D8]

### From Engineer View (D7)

29. **SMOG Grade formula** — specifically designed for healthcare/medical
    content readability. If the skill is used on medical or health content, SMOG
    is the appropriate formula over Flesch-Kincaid. [D7]

30. **IndieWeb webring membership as quality signal** — websites that
    participate in IndieWeb webrings are human-curated and vetted by community
    members. This is a positive quality signal for long-tail discovery. [D8]

---

## 15. Gaps and Unresolved Questions

### Extraction Gaps

1. **PDF and binary content extraction** — findings files do not address
   extraction of linked PDFs, DOCX, or XLSX files. These are common in academic
   and government sites. Is trafilatura + `pdfminer.six` the right pipeline?
   What about image-heavy PDFs?

2. **Video transcript extraction** — YouTube embeds are common. Extracting
   transcripts via YouTube API or `yt-dlp` was not evaluated. Should the skill
   flag embedded videos as knowledge candidates requiring manual extraction?

3. **Code block extraction quality** — trafilatura has a known issue with code
   block whitespace (GitHub #553). For documentation sites (primary use case),
   this is a critical gap. Is there a Turndown GFM configuration that handles
   this better?

4. **Pagination handling** — multi-page articles, infinite scroll, and
   AJAX-loaded content were not fully addressed. How should the skill handle a
   50-page tutorial split across paginated HTML?

5. **Authentication beyond storage-state.json** — some valuable sites require
   authentication (private GitHub repos, paid newsletters, employer intranets).
   The skill has no guidance for authenticated extraction beyond cookie
   persistence.

### Creator View Gaps

6. **Creator context injection mechanism** — how exactly should the skill read
   and interpret CLAUDE.md and SESSION_CONTEXT.md? Should it parse them
   structurally or pass them as unstructured context to the LLM for relevance
   assessment?

7. **Multiple creator context sources** — what happens when CLAUDE.md and
   SESSION_CONTEXT.md conflict (e.g., archived sprint context that no longer
   applies)?

8. **Voice/POV detection accuracy** — the 5-signal cascade for voice detection
   is heuristic. No benchmark exists for this detection task. How accurate is it
   in practice?

9. **Creator View for non-English sites** — the CRAAP/Kissane/IA frameworks are
   English-language centered. How should the Creator View adapt for Japanese,
   Chinese, or Arabic sites?

### Classification Gaps

10. **Hybrid site types** — many sites span multiple types (documentation +
    blog, e-commerce + community, portfolio + tool). The 15-type taxonomy is
    single-label. Should the skill support multi-label classification?

11. **Classification confidence calibration** — the 4-layer weighted sum
    produces a confidence score (0-1) but this has not been calibrated against a
    test set. The 0.60 threshold is arbitrary.

12. **Dynamic sites that change type** — a site that was a blog 2 years ago is
    now a vendor brochure. How should historical analysis (cached in
    `.research/`) be invalidated?

### Link Scoring Gaps

13. **The 0.25 context relevance weight assumes query/topic availability** —
    TF-IDF relevance requires a reference topic. For an open-ended site analysis
    (no specific query), how is context relevance computed? Use the site's own
    content as the reference corpus?

14. **Alive check at scale** — HEAD requests for top-10 links per page are
    manageable. At expedition scale (15 pages × 20 links), 300 HEAD requests may
    be slow. What is the appropriate batching and timeout strategy?

15. **Link scoring vs. Exa findSimilar** — the 7-component scoring formula and
    Exa's neural embeddings represent two different link ranking approaches. No
    comparative evaluation exists. Which is better for expedition navigation?

### Expedition Gaps

16. **Expedition budget in tokens vs. pages** — the current design budgets by
    page count. Token budgets may be more relevant for cost control. How should
    the skill translate between the two?

17. **Circular expedition detection** — a site A → site B → site A loop should
    be detected and broken. The flat JSONL with visited URL tracking handles
    this, but the detection logic was not specified.

18. **Expedition for single-page applications** — SPAs may have dynamic content
    loading on user interaction. The 3-hop depth limit assumes page-to-page
    navigation. How does expedition work on sites where "pages" are route
    changes within an SPA?

### Storage and Integration Gaps

19. **Research-index.jsonl at scale** — the JSONL index is append-only. After
    1,000 site analyses, linear scan of the index becomes slow. At what scale
    does SQLite become necessary, and what is the migration path?

20. **Cross-project analysis access** — if a creator analyzes the same site in
    two different projects, should the analyses be shared or kept separate? The
    current design keeps them per-project (in `.research/`).

21. **MCPVault stability** — MCPVault is recommended but is a community project.
    What happens if it is abandoned? Is there a fallback path that doesn't
    require a specific MCP server?

### Compliance Gaps

22. **ToS pattern matching reliability** — the heuristic ToS pattern matching
    ("no automated access", "no scraping") generates false positives (sites that
    prohibit commercial scraping but allow research use) and false negatives
    (sites with unusual ToS language). How should the skill handle ToS
    ambiguity?

23. **GDPR risk scoring specifics** — the research identified GDPR as a concern
    but did not define a concrete risk scoring algorithm. What threshold
    triggers a WARN vs. PROCEED?

24. **llms.txt format specification** — the llms.txt format is not standardized.
    Different sites implement it differently. How should the skill parse
    non-standard llms.txt files?

### Synthesis Gaps

25. **Cross-site synthesis schema** — Section 9 describes synthesis methodology
    but does not specify an artifact schema for cross-site synthesis output.
    Should cross-site synthesis produce a separate `synthesis.json` artifact?

26. **Thematic saturation detection implementation** — the stopping rule (3
    consecutive sites with no new themes) requires tracking "themes" across
    sites. How is a "theme" defined algorithmically for saturation detection?

27. **Source weighting in cross-site synthesis** — the T1-T4 weighting
    (3x/2x/1x/0.5x) was proposed but not validated. Are these weights
    appropriate for web content synthesis?

---

## Sources

### Tier 1: Primary Research and Official Documentation

- **D1a** — Static Content Extraction Tools (Trafilatura, Readability, Turndown
  benchmarks and documentation)
- **D2a** — JavaScript Detection Methods (framework fingerprint patterns,
  Crawlee dual-run approach, escalation algorithm design)
- **D3** — Compliance Gates (RFC 9309 robots.txt standard, GDPR case law, hiQ v.
  LinkedIn analysis)
- **D5** — Site Classification and Metadata (Wappalyzer patterns, Web Almanac
  2024 data, schema.org analysis)
- **D14** — Metadata Extraction (Web Almanac 2024 Open Graph/JSON-LD coverage
  data, Cheerio benchmarks)

### Tier 2: Expert Analysis and Tool Documentation

- **D1b** — JavaScript Extractors (Crawl4AI, Jina Reader, Playwright
  documentation and analysis)
- **D2b** — Playwright MCP Tool Inventory (26-tool analysis, token cost
  measurements)
- **D4a** — Creator Value Axes (CRAAP framework, Kissane framework,
  Rosenfeld/Morville IA systems)
- **D4b** — Creator View Structure (7-section design rationale, Gemini Deep
  Research format analysis)
- **D6** — Link Scoring Formula (7-component scoring design, pipeline timing
  analysis)
- **D7** — Engineer View Design (8 freshness detection methods, 5 readability
  formulas, E-E-A-T analysis)
- **D8** — Anti-patterns and Absence Patterns (11-type taxonomy, long-tail bias
  analysis, NavBoost research)
- **D9b** — Cross-site Synthesis Methods (4 synthesis paradigms, Google AI
  Overviews query fan-out analysis)
- **D10a** — Expedition Mode UX (ResearchRabbit/Exa analog analysis, HITL
  research, interaction rate data)
- **D10b** — Expedition State Management (JSONL event design, flat array vs.
  tree analysis, Plan-MCTS reference)
- **D12** — Storage Schema and Structure (schema parity table, URL-to-slug
  algorithm, artifact schemas)
- **D13a** — AI Extraction Tools (Firecrawl credit analysis, Crawl4AI
  architecture, Jina Reader acquisition)
- **D13b** — AI Analysis Tools (Perplexity pipeline, Exa architecture, Google AI
  Overviews E-E-A-T, Tavily analysis)

### Tier 3: Community Research and Supporting Analysis

- **D9a** — Link Density Analysis (Web Almanac 2025 link count data, awesome
  list analysis, threshold derivation)
- **D11a** — Obsidian and Vault Storage (MCP server inventory, MCPVault
  recommendation, Karpathy pattern)
- **D11b** — NotebookLM Alternatives (SQLite FTS5 recommendation,
  Anytype/Raindrop MCP discovery)
- **D11c** — Integration Patterns (Claude Code memory system, YAML frontmatter
  bridge, QMD MCP)

---

## Methodology

**Phase:** Synthesis (Phase 2 of deep-research pipeline) **Findings files
processed:** 22 (D1a through D14, spanning all 13 sub-questions) **Sub-questions
covered:** 13 of 13 (SQ1a, SQ1b, SQ2a, SQ2b, SQ3, SQ4a, SQ4b, SQ5, SQ6, SQ7,
SQ8, SQ9a, SQ9b, SQ10a, SQ10b, SQ11a, SQ11b, SQ11c, SQ12, SQ13a, SQ13b, SQ14)
**Contradictions identified and resolved:** 6 **Serendipitous discoveries
collected:** 30 **Gaps documented:** 27 **Confidence distribution:** HIGH: 58,
MEDIUM: 41, LOW: 5, UNVERIFIED: 0

**Synthesis approach:** Thematic synthesis organized by decision domain (not by
source file). Findings grouped into 13 design domains matching the skill's
implementation phases. Cross-file contradictions resolved with explicit
rationale. All serendipitous findings preserved regardless of immediate design
relevance.

**Phases remaining:** Phase 3 (Contrarian challenge), Phase 4 (Cross-model
verification), Phase 5 (Self-audit and presentation) — not included in this
output.

---

## Addendum: Post-Challenge Corrections and Gap Findings (Phase 3.5-3.97)

### Verification Corrections (8 claims corrected)

| Claim     | Correction                                                          | New Confidence |
| --------- | ------------------------------------------------------------------- | -------------- |
| C-001     | trafilatura F1 = 0.945 (not 0.958)                                  | MEDIUM         |
| C-010     | Jina Reader: structural acquisition risk, not temporal              | LOW            |
| C-013     | JS detection algorithm: no measured error rate                      | MEDIUM         |
| C-044-046 | Link scoring weights: unvalidated heuristics                        | LOW            |
| C-050     | 40-link threshold exceeds p90 of 25; targets <10% not "top 10%"     | MEDIUM         |
| C-061     | EU AI Act enforcement: August 2, 2026 (not March 2025)              | HIGH           |
| C-092     | Market gap: reframe to "no developer tool" (excluded reading tools) | MEDIUM         |
| C-117     | rs_trafilatura F1 = 0.966 (not 0.970)                               | HIGH           |

### Challenge Summary (4 agents: 2 contrarian + 2 OTB)

**6 CRITICAL findings:** 4-mode skill fracture risk; Creator View
personalization unsolved; Expedition compaction survival; Article-only
benchmarks; Link scoring unvalidated; 74% AI content prevalence.

**8 HIGH findings:** Extraction pipeline brittleness; Pre-flight false
positives; Storage retrieval problem; Cloudflare as design constraint;
Classification uncalibrated; deep-research overlap; Watch-list missing; Polyglot
dependency stack.

**Notable OTB alternatives to adopt:** RSS as extraction path; MCP-wrapped
extraction for v1; 3-section Quick Scan tier; Curated-list-seeded discovery as
routing option.

Full challenge reports: `challenges/contrarian-1.md`,
`challenges/contrarian-2.md`, `challenges/otb-1.md`, `challenges/otb-2.md`

### Gap Pursuit Findings (4 agents, 48 new claims)

**G1: Rate Limiting + Cloudflare Detection**
(findings/G1-rate-limiting-cloudflare.md)

- `cf-mitigated: challenge` is the authoritative Cloudflare detection header
- FlareSolverr is end-of-life (deprecated 2025, CAPTCHA solvers dead Jan 2026)
- Standard polite delay: 10-15 seconds between same-domain requests
- 429 responses: read Retry-After header, 3 retry max, 60s fallback
- Fail-fast on Cloudflare rather than attempting escalation tiers

**G2: RSS + MCP Extraction** (findings/G2-rss-mcp.md)

- RSS pre-check should happen before ANY HTML extraction for blog/news sites
- WordPress default-on means 50-70% of blog/news sites expose feeds
- mcp-server-fetch (official Anthropic) is the v1 zero-config extraction
  baseline
- Trafilatura MCP is experimental (1 star, not production-ready)
- Firecrawl MCP is most capable (12 tools) but cloud-credit model

**G3: AI Detection + Non-Article Benchmarks**
(findings/G3-ai-detection-benchmarks.md)

- AI detection heuristics are structurally broken for technical content
- Real-world detection accuracy: 65-88% (not 95-99%)
- Per-type extraction F1: documentation=0.888, product pages=0.567 (40% drop)
- Product page failure is architectural (content in JSON-LD, not DOM)
- No SPA or government site benchmarks exist

**G4: Creator Context Injection** (findings/G4-creator-context.md)

- MEMORY.md is the correct source for creator context (not CLAUDE.md)
- Structured extraction (350-700 tokens) beats full-file injection (2K-5K+)
- Active conversation context is highest-signal at zero token cost
- Resolves Contrarian-1 Challenge 2: Creator View personalization IS solvable

### Design Constraints from Challenges

1. **Expedition must be prototyped under simulated compaction** before deep-plan
   locks architecture
2. **Link scoring weights are v0 heuristics** — expose as configurable, log
   breakdowns for calibration
3. **Classification needs a confirmation step** — show user which signals fired,
   ask for correction
4. **Cloudflare is a first-class constraint** — detect via cf-mitigated header,
   fail fast and informatively
5. **v1 extraction should use mcp-server-fetch** — defer custom pipeline to v2
   when scale justifies it
6. **RSS pre-check before HTML extraction** for blog/news/documentation sites
7. **Creator context from MEMORY.md** — structured extraction of 350-700 tokens
8. **AI content: surface suspicion, do not auto-penalize** — detection accuracy
   too low for automated confidence degradation

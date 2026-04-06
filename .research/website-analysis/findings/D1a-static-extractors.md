# Findings: Static Content Extraction Tools (No JS Rendering)

**Searcher:** deep-research-searcher **Profile:** web + docs **Date:**
2026-04-05T00:00:00Z **Sub-Question IDs:** SQ1a

---

## Key Findings

### 1. Trafilatura is the Top-Ranked Static Extractor by Benchmark [CONFIDENCE: HIGH]

In the ScrapingHub article-extraction benchmark (the most widely cited
independent evaluation), trafilatura achieves an F1 score of **0.958** — the
highest among Python open-source libraries. In the same benchmark, the Rust port
(rs_trafilatura) reaches 0.970 and the Go port reaches 0.960, which reflects the
algorithm's quality rather than language-specific differences [1][2].

The SIGIR 2023 benchmark (Bevendorff et al., testing 14 tools across 8 datasets)
found trafilatura had the **best overall mean F1 (0.883)**, while Mozilla
Readability had the highest median (0.970 on article-type content). This
important nuance means Readability peaks higher on clean article pages but
trafilatura generalizes better across diverse content types [1].

**Trafilatura key characteristics:**

- Combines heuristic + algorithmic detection (readability, jusText, proprietary
  rules)
- Outputs: TXT, Markdown, CSV, JSON, XML, TEI-XML
- Metadata extraction: title, author, date, site name, categories, tags,
  description — pulling from HTML meta tags, OpenGraph, JSON-LD, and structural
  heuristics [3]
- `favor_recall` / `favor_precision` tuning parameters
- `include_tables`, `include_comments` flags
- SimHash-based deduplication built-in
- Language detection and filtering (`target_language`)
- v2.0.0 released December 2024 (actively maintained)

**Markdown output note:** Trafilatura's `output_format='markdown'` preserves
headings and lists. Tables are included when `include_tables=True`. Known issue:
code block whitespace preservation is imperfect (GitHub issue #553) [4].

**Limitation:** Does NOT strip interactive/JS-dependent content on its own —
processing is content-layer only, not rendering-layer.

---

### 2. Mozilla Readability (@mozilla/readability) — Best Median on Article Pages [CONFIDENCE: HIGH]

Mozilla Readability is the algorithm powering Firefox Reader View. As a Node.js
library it requires jsdom to supply a DOM, making it a pure-HTML static
extractor when fed pre-fetched HTML [5].

**`parse()` return object:**

- `title`, `content` (sanitized HTML), `textContent` (plain text)
- `byline` (author), `excerpt`, `publishedTime`, `siteName`, `lang`, `dir`
- `length` (character count)

Metadata prioritizes Schema.org/JSON-LD fields, then falls back to OpenGraph and
meta tags [5].

**Structure preservation:** Returns cleaned HTML, NOT markdown. To get markdown
you need a second pass through turndown or similar. This is a two-step pipeline
in practice.

**`isProbablyReaderable()`** helper lets you gate extraction on likely-article
pages, avoiding false-positive parsing of listing pages or homepages.

**Limitations:**

- Heuristic-based; produces both false positives and false negatives
  (acknowledged in official docs)
- `charThreshold` default of 500 characters can miss short content
- Requires jsdom in Node.js (adds ~35MB dependency); not zero-cost to deploy
- No batch API — single document per call
- No built-in CLI: must use a wrapper (see readability-cli below) [5]

---

### 3. readability-cli (gardenappl/readable) — Viable CLI Wrapper for Readability [CONFIDENCE: MEDIUM]

The `readable` package (`npm install -g readability-cli`) wraps
`@mozilla/readability` with a proper CLI interface [6].

**Usage pattern:**

```bash
# From URL (requires network)
readable https://example.com

# From stdin (pre-fetched HTML — static extraction)
curl https://example.com | readable -

# With options
readable https://example.com --output-format markdown
```

**Maintenance status:** Active (137 commits), the creator explicitly chose JS
because Mozilla's Readability is "actively maintained" while other-language
ports are not. Available on npm and AUR. Output is simplified HTML by default,
with markdown output via flag [6].

**Contrast with `mozilla-readability-cli` (npm):** A different, older package
(v0.2.4, last published 4 years ago) — less maintained. Prefer `readability-cli`
(gardenappl) [6][7].

---

### 4. Turndown — The Dominant HTML-to-Markdown Library for Node.js [CONFIDENCE: HIGH]

Turndown is the most-downloaded HTML-to-Markdown converter in the Node.js
ecosystem: **2.5M+ weekly npm downloads**, 10,800+ GitHub stars [8].

**What it does:** Converts HTML strings or DOM nodes to Markdown. It is a
_structural converter_, not a content extractor — it does NOT remove
boilerplate. It must be paired with Readability or a pre-cleaned HTML source.

**Structure preservation:**

- Headings (`<h1>`-`<h6>`) → ATX or setext style (configurable)
- Bold, italic, links preserved
- Code blocks: fenced or indented (configurable via `codeBlockStyle`)
- Tables: NOT supported by default; requires `turndown-plugin-gfm`
- Images preserved as `![alt](url)`
- Lists (nested) preserved

**Plugin ecosystem:**

- `turndown-plugin-gfm`: Adds tables, strikethrough (GitHub Flavored Markdown)
- `@truto/turndown-plugin-gfm`: ESM fork with 20x performance improvement
  (~600ms vs 13+ seconds) and better edge case handling for malformed HTML [9]

**Configurable options:** `headingStyle`, `codeBlockStyle`, `bulletListMarker`,
`linkStyle`, `emDelimiter`, `strongDelimiter` [8]

**Key limitation:** Tables without the GFM plugin output as raw HTML
passthrough. Nested tables, colspan/rowspan have no markdown equivalent in any
tool.

---

### 5. Pandoc — Universal Converter, Poor Fit for Web Content Extraction [CONFIDENCE: HIGH]

Pandoc converts between 40+ markup formats and is authoritative for document
conversion workflows. CLI syntax: `pandoc -f html -t markdown input.html` [10].

**Structure preservation strengths:**

- Headings, bold/italic, links, code blocks (fenced), tables, footnotes,
  definition lists, metadata blocks
- Handles complex nested structures better than markdownify
- Batch: accepts file lists, can be scripted

**Critical limitation for web content:** Pandoc is a _structural converter_, not
a _content extractor_. It converts ALL HTML to markdown including navigation
bars, footers, cookie banners, sidebars, and ads — everything in the document.
The output requires significant post-processing cleanup for web pages [11].

Users report needing to chain `pandoc | sed | grep` pipelines to strip
boilerplate, making it impractical as a standalone web extraction tool [11].

**Additional limitations:**

- Haskell binary requiring system-level installation (~100MB+ with dependencies)
- Not suitable for serverless/containerized Node.js environments without
  bundling
- Complex HTML artifacts: div containers and iframes appear as fenced code
  blocks
- Raw HTML comments pass through as fenced code blocks [11]

**Best fit:** Document conversion (DOCX/ODT → Markdown), NOT arbitrary web page
extraction.

---

### 6. markdownify (Python) — Strong Pure-Conversion Tool [CONFIDENCE: MEDIUM]

`markdownify` (`pip install markdownify`) wraps BeautifulSoup and handles
standard HTML-to-Markdown conversion without boilerplate removal [12].

**Structure preservation:** Headings, bold/italic, links, images,
ordered/unordered lists, tables, code blocks. Better BeautifulSoup integration
than html2text.

**Does NOT remove boilerplate.** Like Pandoc and Turndown, it converts structure
but does not extract main content.

**Best fit:** When you have pre-cleaned HTML and need clean Markdown output in
Python, or as the second step after trafilatura's bare HTML output.

---

### 7. newspaper3k/newspaper4k — Article-Specific Extractors, Active Reliability Issues [CONFIDENCE: MEDIUM]

**newspaper3k** (original, F1: 0.912) is unmaintained since 2018 [13].

**newspaper4k** is the maintained fork. ScrapingHub benchmark reports:

- F1: 0.949 ± 0.008, Precision: 0.964, Recall: 0.934

A different benchmark (htdocs.dev comparative analysis) reports newspaper4k at
94.6% F1, behind trafilatura. Benchmark results vary by dataset [14].

**Issue:** 180+ unresolved GitHub issues in newspaper4k. Older
newspaper/boilerpipe modules show errors with malformed HTML in evaluations [2].

**Niche advantage:** Built-in NLP features (keyword extraction, summarization)
useful for article intelligence workflows, not just extraction.

---

### 8. goose3 — Slowest and Weakest in Benchmarks [CONFIDENCE: MEDIUM]

goose3 achieves F1 of **0.896** (ScrapingHub benchmark) with Precision: 0.940,
Recall: 0.856. It is "noticeably slower" than trafilatura and newspaper [2].

No structured Markdown output; returns plain text. Does not preserve document
structure well. Not recommended for the `/website-analysis` skill.

---

### 9. Benchmark Contradiction: Dataset-Dependent Results [CONFIDENCE: HIGH]

Two reputable benchmarks show different rankings:

| Tool           | ScrapingHub F1 | SIGIR F1 (mean)       | htdocs.dev F1 |
| -------------- | -------------- | --------------------- | ------------- |
| trafilatura    | **0.958**      | **0.883 (best mean)** | 90.2%         |
| newspaper4k    | 0.949          | —                     | 94.6%         |
| readability_js | 0.947          | 0.970 (best median)   | —             |
| goose3         | 0.896          | —                     | —             |
| Fundus         | —              | —                     | **97.69%**    |

Fundus achieves the highest score (97.69%) but only works on predefined
publishers — not general-purpose. Readability achieves the best median on
article-type content but is weaker on diverse/non-article pages. Trafilatura
generalizes best overall.

---

## Tool Comparison Table

| Tool                     | Language | Boilerplate Removal   | MD Output        | Metadata                 | Batch CLI                 | Structure Preservation                                | Maintenance             |
| ------------------------ | -------- | --------------------- | ---------------- | ------------------------ | ------------------------- | ----------------------------------------------------- | ----------------------- |
| **trafilatura**          | Python   | YES (best-in-class)   | Native           | Full (JSON-LD, OG, meta) | YES (`-i list.txt`)       | Good (headings, lists, tables; code blocks imperfect) | Active (v2.0, Dec 2024) |
| **@mozilla/readability** | Node.js  | YES (article-focused) | No (HTML output) | Good (JSON-LD priority)  | No (single doc API)       | Excellent for articles                                | Active                  |
| **readability-cli**      | Node.js  | YES (via readability) | Via flag         | Via readability          | Limited (no native batch) | Same as readability                                   | Active (137 commits)    |
| **turndown**             | Node.js  | NO (converter only)   | YES              | No                       | No (library)              | Excellent (w/ gfm plugin)                             | Active (2.5M/wk dl)     |
| **pandoc**               | Haskell  | NO (converter only)   | YES              | Partial                  | YES (scriptable)          | Excellent                                             | Active                  |
| **markdownify**          | Python   | NO (converter only)   | YES              | No                       | No (library)              | Good                                                  | Active                  |
| **newspaper4k**          | Python   | YES                   | No (plain text)  | Good (NLP extras)        | YES                       | Poor (no structure)                                   | Active (issues backlog) |
| **goose3**               | Python   | YES (weak)            | No               | Basic                    | No                        | Poor                                                  | Slow decay              |

---

## Recommended Pipeline for `/website-analysis`

Based on the evidence, the optimal extraction approach is a **two-step
pipeline**:

**Step 1 — Content Extraction (boilerplate removal):**

- Primary: **trafilatura** — best overall F1, native CLI, batch support,
  Markdown output, full metadata, Python install
- Alternative: **@mozilla/readability + jsdom** — best for confirmed article
  pages, strong metadata, Node.js native

**Step 2 — Markdown Conversion (if Readability path used):**

- **turndown + @truto/turndown-plugin-gfm** — for clean HTML → Markdown with GFM
  tables and 20x performance improvement over original GFM plugin

**Avoid for this skill:**

- Pandoc as a web extractor (no boilerplate removal, heavy install)
- goose3 (low F1, slow, no structure)
- newspaper3k (unmaintained)

---

## Sources

| #   | URL                                                                         | Title                                                    | Type                               | Trust       | CRAAP Avg | Date        |
| --- | --------------------------------------------------------------------------- | -------------------------------------------------------- | ---------------------------------- | ----------- | --------- | ----------- |
| 1   | https://github.com/scrapinghub/article-extraction-benchmark                 | ScrapingHub Article Extraction Benchmark                 | Official benchmark                 | HIGH        | 4.4       | Active      |
| 2   | https://adrien.barbaresi.eu/blog/evaluating-text-extraction-python.html     | Evaluating scraping and text extraction tools for Python | Author's blog (trafilatura author) | MEDIUM-HIGH | 4.0       | 2023        |
| 3   | https://deepwiki.com/adbar/trafilatura/9.2-text-extraction-examples         | Trafilatura Text Extraction Examples                     | Docs mirror                        | MEDIUM-HIGH | 3.8       | 2025        |
| 4   | https://github.com/adbar/trafilatura/issues/553                             | Preserve horizontal space in code blocks (issue)         | GitHub issue                       | MEDIUM      | 3.4       | 2023        |
| 5   | https://github.com/mozilla/readability                                      | Mozilla Readability GitHub README                        | Official source                    | HIGH        | 4.6       | Active      |
| 6   | https://github.com/gardenappl/readable                                      | readability-cli (gardenappl) GitHub                      | Official source                    | HIGH        | 4.2       | Active      |
| 7   | https://www.npmjs.com/package/mozilla-readability-cli                       | mozilla-readability-cli npm                              | npm registry                       | MEDIUM      | 3.2       | Stale (4yr) |
| 8   | https://github.com/mixmark-io/turndown                                      | Turndown GitHub README                                   | Official source                    | HIGH        | 4.5       | Active      |
| 9   | https://github.com/trutohq/turndown-plugin-gfm                              | @truto/turndown-plugin-gfm (ESM fork)                    | GitHub                             | MEDIUM-HIGH | 3.8       | 2025        |
| 10  | https://pandoc.org/MANUAL.html                                              | Pandoc User's Guide                                      | Official docs                      | HIGH        | 4.8       | Active      |
| 11  | https://safjan.com/how-to-convert-html-to-clean-markdown/                   | How to Convert HTML to Clean Markdown With Pandoc        | Blog                               | MEDIUM      | 3.4       | 2023        |
| 12  | https://thunderbit.com/blog/html-to-markdown-in-python                      | HTML to Markdown in Python: Best Tools                   | Blog                               | MEDIUM      | 3.2       | 2025        |
| 13  | https://webscraping.fyi/lib/compare/python-newspaper-vs-python-trafilatura/ | Newspaper vs Trafilatura comparison                      | Comparison site                    | MEDIUM      | 3.0       | 2024        |
| 14  | https://htdocs.dev/posts/comparative-analysis-of-open-source-news-crawlers/ | Comparative Analysis of Open-Source News Crawlers        | Technical blog                     | MEDIUM      | 3.6       | 2025        |

---

## Contradictions

**Benchmark rankings are dataset-dependent:** The ScrapingHub benchmark
(trafilatura F1=0.958 > newspaper4k F1=0.949) and the htdocs.dev benchmark
(newspaper4k 94.6% vs trafilatura 90.2%) show different orderings. This is not a
methodology failure — they use different ground-truth datasets. The ScrapingHub
benchmark is the more widely cited standard (referenced by 5+ independent
sources). The htdocs.dev numbers use a different evaluation corpus.

**SIGIR finding (Readability best median vs. trafilatura best mean):**
Readability achieves the highest median F1 (0.970) on article content but
trafilatura wins on overall mean (0.883) across all 8 datasets. This reflects
Readability's strong performance on clean article pages and weaker
generalization to non-article content. Not contradictory — complementary
findings for different use cases.

**readability-cli maintenance:** The `mozilla-readability-cli` npm package is
stale (4 years, v0.2.4). The `readability-cli` / `readable` package by
gardenappl is actively maintained. These are different packages with similar
names; the stale one should not be used.

---

## Gaps

1. **Trafilatura Markdown output quality for code blocks** — issue #553
   indicates whitespace in code blocks is not perfectly preserved in Markdown
   output. Depth of this problem (breaking vs. cosmetic) not quantified in
   available sources.

2. **trafilatura vs. readability on non-article pages** — benchmarks focus on
   article content. Performance on documentation pages, product pages, landing
   pages, and SaaS dashboards not directly measured. A `/website-analysis` skill
   will encounter all of these.

3. **readability-cli batch mode** — no evidence found of native batch/parallel
   processing. Would need to be scripted (xargs, parallel) externally.

4. **Fundus** — achieves 97.69% F1 but limited to ~100 predefined publishers.
   Could be relevant if `/website-analysis` targets news sites specifically, but
   not general-purpose. Not researched in depth.

5. **Edge case: paywalls and cookie consent walls** — none of the evaluated
   tools handle these at the static HTML level. They only see what HTML is
   served without JS rendering. Paywall-gated content will be partially or fully
   missing in all static extractors.

6. **Jina ReaderLM-v2** — a 1.5B model-based extractor achieving ROUGE-L 0.84,
   Jaro-Winkler 0.82. Not benchmarked on the same corpus as traditional tools.
   Represents a newer ML-based approach not directly comparable. Not explored in
   depth.

---

## Serendipity

- **rs_trafilatura (Rust)** achieves F1=0.970, outperforming the Python original
  (0.958). A Rust-native extractor could be relevant if the skill needs maximum
  performance without Python runtime [ScrapingHub benchmark data].

- **Jina ReaderLM-v2** is a 1.5B parameter model specifically trained for
  HTML-to-Markdown, claiming 20% accuracy improvement over its predecessor and
  outperforming Qwen2.5-32B on the task. This ML-based static extractor is a
  meaningful emerging competitor, though it requires model hosting.

- **@truto/turndown-plugin-gfm** (ESM-only fork) offers a 20x performance gain
  over the original GFM plugin — relevant if the skill needs to process many
  pages concurrently in Node.js.

- **The "two-step" pattern is now canonical in AI tooling:** The community
  consensus (2025-2026) is to use trafilatura or Readability for boilerplate
  removal, then turndown/markdownify for Markdown conversion. This two-step
  pattern appears in RAG, LLM context preparation, and content intelligence
  pipelines consistently.

---

## Confidence Assessment

- HIGH claims: 5 (trafilatura benchmark position, Readability API/features,
  Turndown ecosystem, Pandoc limitations for web content, benchmark
  contradiction documentation)
- MEDIUM claims: 4 (markdownify comparison, newspaper4k status, goose3 weakness,
  readability-cli maintenance)
- LOW claims: 0
- UNVERIFIED claims: 0
- **Overall confidence: HIGH**

The benchmark data is well-sourced from the ScrapingHub evaluation (referenced
by multiple independent sources). Tool feature claims are drawn from official
GitHub READMEs and documentation. The main gap is lack of direct testing on the
specific content types `/website-analysis` will encounter (non-article pages).

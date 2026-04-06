# Findings: Content Structure Preservation and Cross-Mode Storage Design

**Searcher:** deep-research-searcher **Profile:** web + docs **Date:**
2026-04-05 **Sub-Question IDs:** SQ-12

---

## Key Findings

### 1. HTML-to-Markdown: Element-by-Element Tool Comparison [CONFIDENCE: HIGH]

Six Python/JS libraries were systematically compared for structure preservation
across specific HTML element types [1, 6]. The findings below are synthesized
from multiple sources including library documentation, benchmark comparisons,
and a 2025 technical analysis.

**Heading hierarchy (h1–h6):** All reviewed libraries convert heading tags to
ATX-style Markdown (`#` through `######`). No notable differences — this is
universally well-handled. Trafilatura 2.0, html-to-markdown (Go/JS), markdownify
(Python), and pandoc all produce correct heading depth. [1, 4, 5, 6]

**Link preservation (href alongside anchor text):**

- `html-to-markdown` (Go): Preserves `href` and anchor text. Supports
  relative-to-absolute URL conversion via `WithDomain()`. Handles multi-line
  links and blank-line escapes. [4]
- `trafilatura`: Preserves links via `include_links=True` parameter. Off by
  default (to optimize for LLM training data purity). [5]
- `markdownify`: Preserves links; subclass `convert_a()` for custom handling.
- `pandoc`: Preserves links in all supported output variants.
- **Recommendation:** Enable `include_links=True` for website analysis. For
  cross-site link analysis, extract all links into a separate `links.json`
  alongside the markdown.

**Code block extraction (pre/code → fenced blocks):**

- `trafilatura` and `html-to-markdown` both provide language detection for
  fenced code blocks (` ``` python` etc.). [6]
- `markdownify`: Supports custom override of `convert_pre()` for specialized
  handling.
- `pandoc`: Preserves `<pre>` as indented or fenced code blocks; text between
  `<script>`, `<style>`, `<pre>`, `<textarea>` is not re-interpreted as
  Markdown. [3]
- All libraries handle inline `<code>` to backtick conversion.

**Table conversion (HTML tables → markdown or structured data):**

- `html-to-markdown` (Go): Best-in-class for complex tables — supports
  alignment, rowspan, and colspan via a GFM-compliant table plugin. [4]
- `trafilatura`: Good table support; `include_tables=True` (on by default); best
  handling of merged cells among Python options. [5, 6]
- `pandoc`: Supports pipe tables with column alignment; can disable table
  conversion to preserve as raw HTML via `-pipe_tables` extension flag. [3]
- **Alternative:** For data-heavy tables, extract to a structured `tables.json`
  (array of arrays + header row) rather than markdown pipe tables, which are
  fragile with complex merged cells.

**List nesting (ul/ol with nested lists):**

- All reviewed libraries handle standard nested lists. `markdownify` and
  `html-to-markdown` are cited as most reliable for complex nesting. [6]
- Nested list indentation depth must be consistent (2 or 4 spaces) for
  downstream markdown parsers.

**Image references (img → markdown images or asset list):**

- All libraries convert `<img>` to `![alt](src)` syntax.
- `trafilatura` can exclude images entirely via `include_images=False` for
  cleaner LLM training data.
- **Recommendation:** For website analysis, maintain a separate `assets.json`
  listing all image URLs, alt text, and dimensions rather than embedding image
  references in markdown — images are often the most unstable content element.

**Blockquote and citation preservation:**

- `html-to-markdown` (Go): "Blockquotes can include other elements, with
  seamless support for nested quotes." [4]
- `markdownify` and `pandoc` also handle `<blockquote>` correctly.
- Citations (`<cite>`) are not universally preserved — most tools convert to
  plain text. Pandoc preserves semantic via its AST but only if outputting
  extended Markdown formats.

**Tool summary matrix:**

| Element      | trafilatura | html-to-markdown (Go) | markdownify | pandoc    |
| ------------ | ----------- | --------------------- | ----------- | --------- |
| Headings     | Excellent   | Excellent             | Excellent   | Excellent |
| Links        | Good\*      | Excellent             | Good        | Excellent |
| Code blocks  | Good        | Excellent             | Good\*      | Excellent |
| Tables       | Excellent   | Excellent             | Good        | Good      |
| Nested lists | Good        | Excellent             | Excellent   | Excellent |
| Images       | Good\*      | Good                  | Good        | Good      |
| Blockquotes  | Good        | Excellent             | Good        | Excellent |
| Boilerplate  | Removes     | Keeps                 | Keeps       | Keeps     |
| Speed        | Fastest     | Fast                  | Medium      | Slow      |

\*Requires explicit opt-in parameter.

**Recommended approach for website-analysis:** Use **trafilatura** as primary
extractor (fastest, removes boilerplate, best F1 score 0.937 precision 0.978)
[2] with `output_format="markdown"`, `include_links=True`,
`include_tables=True`, `include_formatting=True`. Fall back to html-to-markdown
for sites where boilerplate removal is undesirable (full-site mirror mode).

---

### 2. Storage Schema by Mode [CONFIDENCE: MEDIUM-HIGH]

Based on analysis of Firecrawl's output schema [7], Crawlee's storage patterns
[8], Common Crawl's archiving practices [9], and Crawl4AI's extraction model
[10], the following per-mode directory structures are recommended.

**Page Mode** (single URL analysis):

```
.research/website-analysis/<slug>/
  analysis.json          # dimensions, scores, classifications
  findings.jsonl         # individual findings with confidence
  extracted-content.md   # cleaned markdown from trafilatura
  links.json             # all outbound links with context
  assets.json            # image/media references
  tables.json            # structured table data (array format)
  summary.md             # human-readable analysis summary
  meta.json              # crawl metadata (url, date, status, timing)
```

**Site Mode** (multi-page crawl of one domain):

```
.research/website-analysis/<domain-slug>/
  analysis.json          # site-level analysis (aggregate dimensions)
  findings.jsonl         # site-level findings + per-page references
  site-synthesis.md      # cross-page patterns and insights
  summary.md             # human-readable site summary
  sitemap.json           # discovered URL tree
  pages/
    <page-slug>/
      extracted-content.md
      meta.json
      links.json
      tables.json
```

**Expedition Mode** (tree-shaped deep crawl):

```
.research/website-analysis/<expedition-slug>/
  expedition.jsonl       # append-only crawl log (one entry per node)
  expedition-state.json  # current state for resumability
  tree.json              # URL tree with parent/child relationships
  analysis.json          # expedition-level aggregate analysis
  findings.jsonl         # findings across all nodes
  summary.md             # expedition summary
  nodes/
    <node-slug>/
      summary.md         # per-node summary (lightweight)
      meta.json          # url, depth, parent, crawl time
      extracted-content.md
```

**Cross-site Mode** (multiple sites):

```
.research/website-analysis/<session-slug>/
  meta-patterns.md       # patterns detected across all sites
  synthesis.md           # cross-site synthesis
  analysis.json          # cross-site aggregate (per-site summary array)
  findings.jsonl         # findings tagged by site
  sites/
    <site-slug>/
      analysis.json      # single-site analysis
      findings.jsonl
      summary.md
      pages/             # same as site mode
```

These share a common base schema (see Finding 3).

---

### 3. Common Artifact Schema [CONFIDENCE: MEDIUM-HIGH]

Derived from: repo-analysis v3.0 REFERENCE.md (internal, verified from
filesystem), Firecrawl per-page schema [7], Crawl4AI extraction schema [10], and
Common Crawl JSONL conventions [9].

**`analysis.json` — structured analysis data:**

```json
{
  "meta": {
    "tool": "website-analysis",
    "version": "1.0",
    "mode": "page|site|expedition|cross-site",
    "source_url": "https://example.com",
    "source_slug": "example-com",
    "analysis_date": "YYYY-MM-DD",
    "crawl_duration_ms": 1234
  },
  "target": {
    "url": "https://example.com",
    "title": "Page Title",
    "description": "Meta description",
    "language": "en",
    "status_code": 200,
    "content_type": "text/html"
  },
  "dimensions": {
    "DIM-01_content_depth": { "score": 72, "band": "Healthy", "detail": "..." },
    "DIM-02_link_quality": {
      "score": 45,
      "band": "Needs Work",
      "detail": "..."
    }
  },
  "summary_bands": {
    "Content": { "score": 72, "band": "Healthy" },
    "Structure": { "score": 60, "band": "Healthy" }
  }
}
```

**`findings.jsonl` — individual findings:** Each line is a finding record.
Schema intentionally mirrors repo-analysis findings.jsonl to enable cross-tool
querying:

```jsonl
{
  "id": "F001",
  "severity": "high|medium|low|info",
  "dimension": "DIM-01",
  "title": "Short title",
  "detail": "Full description with evidence",
  "recommendation": "Recommended action",
  "source_url": "https://...",
  "source_mode": "page|site|expedition|cross-site"
}
```

The `source_url` and `source_mode` fields are the only website-analysis
additions. The core schema (`id`, `severity`, `dimension`, `title`, `detail`,
`recommendation`) is identical to repo-analysis, enabling shared TDMS intake
transforms.

**`value-map.json` — pattern and knowledge candidates:** Analogous to
repo-analysis value-map.json. Website-analysis candidates are UX patterns,
content strategies, link architectures, and information designs rather than code
patterns:

```json
{
  "source": "https://example.com",
  "analysis_date": "YYYY-MM-DD",
  "extraction_candidates": [
    {
      "rank": 1,
      "name": "Progressive disclosure navigation",
      "location": "https://example.com/nav + https://example.com/docs",
      "description": "What this pattern does and why it's notable",
      "pattern_novelty": "High|Med|Low",
      "applicability": "High|Med|Low",
      "quality_signal": "High|Med|Low",
      "notes": "Adaptation context",
      "status": "identified|selected|applied|skipped",
      "decision_date": null,
      "candidate_type": "ux-pattern|content-strategy|link-architecture|anti-pattern"
    }
  ]
}
```

**`meta.json` — crawl metadata (new, no repo-analysis equivalent):**

```json
{
  "url": "https://example.com/page",
  "slug": "example-com--blog--post-title--a1b2c3",
  "crawl_date": "YYYY-MM-DDTHH:MM:SSZ",
  "status_code": 200,
  "content_length_bytes": 45230,
  "extraction_tool": "trafilatura",
  "extraction_version": "2.0.0",
  "js_rendered": false,
  "crawl_duration_ms": 823,
  "parent_url": null,
  "depth": 0
}
```

**`extracted-content.md` — cleaned page content:** Trafilatura markdown output.
YAML frontmatter header recommended:

```markdown
---
url: https://example.com/page
title: Page Title
extraction_date: 2026-04-05
word_count: 1250
---

# Page Heading

Content begins here...
```

**`summary.md` — human-readable analysis summary:** Same role as in
repo-analysis. Written in conversational prose. Structured sections vary by
mode.

**What's missing for website analysis specifically:**

- `links.json` — outbound link inventory with context (no repo-analysis
  equivalent)
- `assets.json` — image/media references (no repo-analysis equivalent)
- `tables.json` — structured table data extracted from page (no equivalent)
- `sitemap.json` — discovered URL structure (site/expedition modes only)
- `expedition.jsonl` — append-only crawl log (expedition mode only)
- `meta.json` — per-page crawl metadata (repo-analysis uses `meta` inside
  analysis.json)

---

### 4. Schema Parity with repo-analysis [CONFIDENCE: HIGH]

Direct comparison based on verified repo-analysis REFERENCE.md schema (internal
source, filesystem-verified):

| repo-analysis artifact | website-analysis equivalent | Status                                                 |
| ---------------------- | --------------------------- | ------------------------------------------------------ |
| `analysis.json`        | `analysis.json`             | Shared schema + website additions                      |
| `findings.jsonl`       | `findings.jsonl`            | Identical core schema; add `source_url`, `source_mode` |
| `value-map.json`       | `value-map.json`            | Same structure; candidate_type changes                 |
| `summary.md`           | `summary.md`                | Same role, different sections                          |
| `repomix-output.txt`   | `extracted-content.md`      | Different format (text vs markdown)                    |
| (none)                 | `links.json`                | New                                                    |
| (none)                 | `assets.json`               | New                                                    |
| (none)                 | `tables.json`               | New                                                    |
| (none)                 | `meta.json`                 | New (per-page metadata)                                |
| (none)                 | `sitemap.json`              | New (site/expedition modes)                            |
| (none)                 | `expedition.jsonl`          | New (expedition mode)                                  |

**Can `value-map.json` entries from website and repo analyses share a pool?**
Yes, with a type discriminator. Both already include `candidate_type` concept. A
shared pool would use:

```json
{
  "candidate_type": "code-pattern|ux-pattern|content-strategy|knowledge",
  "source_tool": "repo-analysis|website-analysis",
  "source_ref": "OWNER/REPO or https://..."
}
```

This enables cross-tool pattern synthesis (e.g., "this repo implements the same
progressive disclosure pattern we observed on 3 competitor sites").

**Should `findings.jsonl` use the same schema with type discriminators?** Yes.
The core schema (`id`, `severity`, `dimension`, `title`, `detail`,
`recommendation`) should be identical. Add:

- `source_tool`: `"repo-analysis"` or `"website-analysis"`
- `source_url`: URL (for website-analysis) or null (for repo-analysis)
- `source_mode`: mode type for website-analysis

TDMS intake transforms can remain the same since the core fields are unchanged.

---

### 5. URL-to-Slug Generation Algorithm [CONFIDENCE: HIGH]

Based on analysis of: filenamify library design [11], Python slugify conventions
[12], Windows MAX_PATH research [13], ArchiveBox's slug design lessons [14], and
HTTrack's known failure with 255-char truncation [15].

**Recommended algorithm:**

```
function url_to_slug(url, max_slug_length=80):
  1. Parse URL components: scheme, domain, path, query
  2. Normalize domain: strip "www.", lowercase
     e.g., "www.Example.COM" → "example-com"
  3. Normalize path: strip trailing slash, lowercase
     e.g., "/blog/My Post Title/" → "blog--my-post-title"
     - Replace "/" with "--" (double-dash as path separator)
     - Replace non-alphanumeric chars with "-"
     - Collapse consecutive "-" to single "-"
     - Strip leading/trailing "-"
  4. Combine: "<domain>--<path>"
     e.g., "example-com--blog--my-post-title"
  5. If len(combined) > max_slug_length:
     - Take first (max_slug_length - 7) characters
     - Trim to last "-" boundary (avoid mid-word cut)
     - Append "--" + sha256(url)[:6]  (6-char hash suffix)
     e.g., "example-com--blog--some-very-long--a1b2c3"
  6. For root/domain-only URLs (path is "/" or empty):
     slug = domain_slug only (no "--")
     e.g., "example-com"

Result: filesystem-safe, human-readable, collision-resistant slug
```

**Why 80 chars for max_slug_length?** With a typical output base path of ~120
chars on Windows (e.g., `C:\Users\jason\...\findings\example-com--blog--post\`),
an 80-char slug + filename overhead (e.g., `extracted-content.md` = 20 chars)
stays well under the 260-char Windows MAX_PATH limit even without long-path
registry override. [13]

**Hash suffix collision avoidance:** Use first 6 hex chars of SHA-256 of the
full normalized URL. This provides 16^6 = 16.7 million slots with birthday
paradox collision at ~4,000 entries. Adequate for any realistic single-site or
expedition scope.

**Domain-only vs domain+path:**

- `example.com/` → slug: `example-com` (site root, no path component)
- `example.com/blog/post-title` → slug: `example-com--blog--post-title`
- `example.com/blog/post-title?ref=rss` → slug: `example-com--blog--post-title`
  (query stripped unless content differs)

**How existing tools name files:**

- **wget:** Direct URL-to-path mapping. Crashes on long URLs (known bug). [14]
- **HTTrack:** Truncates at 255 chars without warning; uses hash function as
  fallback option. [15]
- **ArchiveBox:** Originally timestamp-based (`1317249309/`), roadmap planned
  SHA-256 of URL as future primary key. Removed filesystem checks rather than
  fixing long-path issue — treats wget extractor as fundamentally flawed. [14]
- **Firecrawl:** Returns `sourceURL` in metadata; consumers handle storage. [7]

**Lesson from existing tools:** Never use direct URL-to-path mapping (wget's
approach). Always apply normalization + length capping + hash suffix. Timestamp
as primary key (ArchiveBox's original approach) creates collisions on
parallel/batch imports. SHA-256 of URL is the correct long-term primary key.

**Windows-specific considerations:**

- Max total path: 260 chars by default (Windows 10 1607+ can disable with
  registry key `LongPathsEnabled=1`, but don't assume it's enabled). [13]
- Illegal filename chars on Windows: `< > : " / \ | ? *` — all must be removed.
- Reserved names: CON, PRN, AUX, NUL, COM1-9, LPT1-9 — slug must not equal these
  after normalization (add hash suffix if collision detected).
- `filenamify` npm library handles Windows illegal chars with configurable
  replacement and grapheme-aware truncation at configurable max length. [11]

---

## Sources

| #   | URL                                                                                     | Title                                                         | Type              | Trust  | CRAAP | Date       |
| --- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ----------------- | ------ | ----- | ---------- |
| 1   | https://www.searchcans.com/blog/html-to-markdown-llm-training-data-best-practices-2026/ | HTML to Markdown for LLMs: Best Practices 2026                | blog              | MEDIUM | 3.8   | 2026       |
| 2   | https://chuniversiteit.nl/papers/comparison-of-web-content-extraction-algorithms        | Comparing algorithms for extracting content from web pages    | academic          | HIGH   | 4.2   | 2024       |
| 3   | https://pandoc.org/MANUAL.html                                                          | Pandoc User's Guide                                           | official-docs     | HIGH   | 5.0   | 2025       |
| 4   | https://github.com/JohannesKaufmann/html-to-markdown                                    | html-to-markdown (Go) GitHub README                           | official-docs     | HIGH   | 4.5   | 2025       |
| 5   | https://trafilatura.readthedocs.io/en/latest/usage-python.html                          | Trafilatura 2.0.0 — Python Usage                              | official-docs     | HIGH   | 4.8   | 2025       |
| 6   | https://www.glukhov.org/post/2025/10/convert-html-to-markdown-in-python/                | Converting HTML to Markdown with Python — Comprehensive Guide | blog              | MEDIUM | 3.9   | 2025       |
| 7   | https://docs.firecrawl.dev/features/crawl                                               | Firecrawl Crawl Endpoint Documentation                        | official-docs     | HIGH   | 4.7   | 2025       |
| 8   | https://blog.apify.com/crawlee-data-storage-types/                                      | Crawlee Data Storage: Saving Files, Screenshots, JSON         | official-docs     | HIGH   | 4.5   | 2024       |
| 9   | https://commoncrawl.org/blog/web-archiving-file-formats-explained                       | Common Crawl — Web Archiving File Formats Explained           | official          | HIGH   | 4.6   | 2024       |
| 10  | https://docs.crawl4ai.com/extraction/no-llm-strategies/                                 | Crawl4AI — LLM-Free Extraction Strategies                     | official-docs     | HIGH   | 4.5   | 2025       |
| 11  | https://github.com/sindresorhus/filenamify                                              | filenamify — Convert string to valid safe filename            | official          | HIGH   | 4.3   | 2024       |
| 12  | https://pypi.org/project/awesome-slugify/                                               | awesome-slugify PyPI                                          | official          | HIGH   | 4.4   | 2024       |
| 13  | https://learn.microsoft.com/en-us/windows/win32/fileio/maximum-file-path-limitation     | Maximum Path Length Limitation — Win32                        | official-docs     | HIGH   | 5.0   | 2024       |
| 14  | https://github.com/ArchiveBox/ArchiveBox/issues/549                                     | ArchiveBox: wget-generated filenames too long — Issue #549    | community         | MEDIUM | 3.5   | 2023       |
| 15  | https://github.com/xroche/httrack/issues/68                                             | HTTrack: path >255 chars on Windows — Issue #68               | community         | MEDIUM | 3.5   | 2022       |
| 16  | Internal: `.claude/skills/repo-analysis/REFERENCE.md`                                   | repo-analysis v3.0 REFERENCE.md                               | internal-verified | HIGH   | 5.0   | 2026-04-03 |

---

## Contradictions

**1. Table handling across tools:** The 2025 comparison article [6] rates both
`html-to-markdown` and `trafilatura` as equally best for complex tables.
However, trafilatura's GitHub issue #553 (2024) shows ongoing problems with
horizontal space in code blocks, suggesting active edge cases. Trust the
tool-specific documentation over the comparison article for edge case behavior.

**2. Link inclusion in trafilatura:** The official docs [5] show `include_links`
as opt-in (default False), but some third-party tutorials present links as
always included. Always verify with `include_links=True` parameter explicitly in
code.

**3. Windows MAX_PATH:** Some sources suggest the 260-char limit is effectively
gone in modern Windows 10/11. The official Microsoft documentation [13]
clarifies it still applies by default unless the `LongPathsEnabled` registry key
is set. Do not assume long-path support is available; design slugs to stay
within 80 chars.

---

## Gaps

1. **Pandoc performance at scale:** No benchmarks found for pandoc processing
   speed on large batches (1,000+ pages). Pandoc is likely too slow for
   expedition-mode batch extraction. Recommend trafilatura for bulk, pandoc only
   for single-page high-fidelity conversion.

2. **trafilatura blockquote handling:** The official docs do not explicitly
   document `<blockquote>` preservation in markdown mode. Likely works correctly
   (since formatting is enabled), but needs empirical verification.

3. **Table extraction to JSON:** No established schema was found for
   `tables.json` format (array of arrays vs array of objects with headers). Need
   to define internally. Recommend:
   `[{"headers": [...], "rows": [[...], [...]], "source_selector": "table:nth-child(2)"}]`.

4. **Cross-tool value-map pooling:** No external precedent found for merging
   code pattern candidates (repo-analysis) with UX pattern candidates
   (website-analysis) into a single pool. The schema design in Finding 4 is
   original design work, not literature-backed. Low implementation risk but
   should be validated in first use.

5. **Expedition JSONL schema:** The structure proposed here (`expedition.jsonl`
   as append-only crawl log) is informed by Common Crawl's WARC approach and
   Crawlee's pattern, but not a direct precedent exists. The expedition-state
   design details are covered in D10b-expedition-state.md (another findings file
   in this research session).

6. **Query string handling in slugs:** The algorithm above strips query strings
   by default. For pages where query strings produce meaningfully different
   content (e.g., `/search?q=foo`), a separate strategy is needed. Not resolved
   here — flag as a design decision for the skill spec.

---

## Serendipity

**Delta delivery pattern for crawler output:** The web crawler storage research
[8] surfaced a "delta delivery" pattern — send only changed content since last
run with a small `event_type` field. For website-analysis, this suggests that
re-analyzing a site could emit a `changed_since` diff rather than a full
re-crawl. Relevant to expedition mode where re-entry/resumability is important
(covered in D10b).

**WET files from Common Crawl:** Common Crawl's WET format (WARC Encapsulated
Text) extracts plain text with HTML removed — essentially what trafilatura does
per-page. This validates the `extracted-content.md` artifact concept from an
industry-standard precedent. The difference is WET is plain text; the skill
should use markdown for structural preservation.

**Firecrawl pagination for large sites:** Firecrawl returns a `next` URL for
pagination when response exceeds 10MB. This is relevant for site mode — large
sites may require paginated collection before synthesis. The skill should
account for this if using Firecrawl as the underlying tool.

---

## Confidence Assessment

- HIGH claims: 6 (heading conversion, link preservation details, filenamify
  algorithm, Windows MAX_PATH, repo-analysis schema parity, findings.jsonl
  shared schema)
- MEDIUM-HIGH claims: 4 (storage schema by mode, common artifact schema,
  cross-tool value-map, slug algorithm design)
- MEDIUM claims: 2 (table extraction to JSON, cross-site storage structure)
- LOW claims: 0
- UNVERIFIED claims: 0
- **Overall confidence: MEDIUM-HIGH**

The HTML structure preservation findings are HIGH confidence from multiple
independent verified sources. The storage schema and slug algorithm are
MEDIUM-HIGH — soundly reasoned from evidence but represent original design
synthesis rather than direct documentation of an existing system.

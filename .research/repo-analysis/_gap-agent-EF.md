# Gap Agent E+F: Wiki, Knowledge Base, Web Archive, Social Media

**Cluster:** E (wiki/knowledge-base) + F (web-archive/social-media) **Repos:**
outline/outline, tobi/qmd, ArchiveBox/ArchiveBox, zedeus/nitter **Agent:** Gap
Agent E+F (merged) **Date:** 2026-04-07

---

## 1. Extraction Methodologies by Source Type

### Wiki / Knowledge Base (outline, qmd)

**Methodology:** API-first structured traversal, not scraping.

Wiki content is already structured -- collections, nested documents,
permissions, metadata. The extraction problem is NOT converting unstructured
content to structured (like PDFs). It is preserving the EXISTING structure
during extraction.

- **Outline approach:** REST API exposes collections -> documents -> nested
  documents with full metadata (permissions, timestamps, authorship). Markdown
  is the native storage format -- no conversion needed. Full-text search API
  available for selective extraction.
- **qmd approach:** File-system-based ingestion of markdown directories with
  named collections. No API -- reads files directly. The key contribution is the
  **context tree**: attach hierarchical context labels to collections so
  sub-documents inherit parent context during retrieval.

**Required tools:** API client (for hosted wikis like Outline, Confluence,
Notion) or filesystem reader (for local wikis like Obsidian, qmd collections).
No OCR, no HTML parsing, no rendering.

**Key difference from document/web extraction:** The content is already clean
text with metadata. The hard problem is hierarchy preservation and permission
mapping, not content extraction itself.

### Web Archive (ArchiveBox)

**Methodology:** Multi-format parallel extraction per URL.

ArchiveBox does not pick one extraction strategy. It runs ALL of them
simultaneously on every input URL and keeps every output:

- HTML (wget mirror)
- SingleFile HTML (complete page in one file)
- Screenshot PNG (Chrome headless)
- PDF (Chrome print-to-PDF)
- WARC (full HTTP exchange archive)
- Article text (readability extraction)
- Title, favicon, headers (metadata)
- Git clone (if URL is a repo)
- MP3/MP4 (if URL has media, via yt-dlp)
- Subtitles (if available)

**Required tools:** Chrome/Chromium, wget, yt-dlp, git, singlefile, readability.
Standard Unix tools composed in a pipeline. Each tool is independently
configurable -- toggle any extractor on/off.

**Content-type detection:** ArchiveBox detects what kind of content is at a URL
(social media post? YouTube video? GitHub repo? article?) and routes to
appropriate extractors. This is implicit content-type routing, not a single
extraction path.

**Key difference from web crawling:** Crawl4AI/Firecrawl extract ONE
representation (markdown/text) for LLM consumption. ArchiveBox extracts MANY
representations for archival completeness. Different goals: consumption vs
preservation.

### Social Media (nitter)

**Methodology:** Adversarial proxy extraction via reverse-engineered APIs.

Social media extraction is fundamentally different from every other source type
because the platform actively prevents it:

- **No public API:** Twitter removed free API access. Nitter uses the unofficial
  internal API that the web app uses.
- **Authentication required:** Must maintain pools of authenticated session
  tokens from real accounts. Tokens expire, get rate-limited, or get banned.
- **Proxy architecture:** All requests route through the nitter backend. The
  client never contacts Twitter directly. This is both a privacy feature and an
  anti-detection requirement.
- **Constant adaptation:** Twitter regularly changes its internal API, requiring
  nitter to reverse-engineer new endpoints, authentication flows, and data
  formats.
- **RSS generation:** Nitter converts Twitter timelines into RSS feeds --
  transforming a walled-garden format into an open standard.

**Required tools:** HTTP client with cookie/session management, rotating proxy
infrastructure (optional but helps), rate limit handling with backoff.

**Key difference from everything else:** This is the only source type where the
source actively fights you. Documents sit there waiting. Websites serve content
to anyone with a browser. Wikis have APIs designed for access. Social media
platforms deploy anti-scraping defenses, change formats without warning, and ban
automated access. The extraction strategy must include resilience against
platform hostility.

---

## 2. Architecture Question: Same Pipeline or Different Backends?

**Answer: Same pipeline, different extractors, with one critical addition.**

The three-stage pipeline (extract -> analyze -> synthesize) works for all source
types. What changes is only the extraction stage:

| Source Type  | Extractor                  | Output Format       | Analysis Layer | Synthesis Layer |
| ------------ | -------------------------- | ------------------- | -------------- | --------------- |
| Document/PDF | unstructured/docling/surya | Markdown + metadata | Shared         | Shared          |
| Web page     | firecrawl/crawl4ai/reader  | Markdown + metadata | Shared         | Shared          |
| Wiki/KB      | API client or file reader  | Markdown + metadata | Shared         | Shared          |
| Web archive  | ArchiveBox multi-format    | Multiple formats    | Shared\*       | Shared          |
| Social media | Platform-specific proxy    | Structured JSON     | Shared         | Shared          |
| Video/audio  | yt-dlp + whisper + frames  | Transcript + frames | Shared         | Shared          |

The analysis and synthesis layers are source-agnostic -- they operate on
extracted content regardless of origin. The extractor is the only part that
changes.

**The critical addition:** Web archives produce MULTIPLE formats per source. The
analysis layer needs a **canonical format selector** -- pick the best
representation for analysis (usually the article text or markdown), while
keeping the other formats available for reference. This is a minor architectural
change, not a fundamental rethink.

**Conclusion:** T28 needs a pluggable extractor interface, not separate
pipelines. The analysis and synthesis layers are genuinely shared.

---

## 3. qmd's Context Tree and the Analysis Layer (O4)

The context tree is the first concrete pattern we have seen for organizing
retrieval across heterogeneous extracted sources.

**How it works in qmd:**

- Collections group source directories with named labels
- Context is attached hierarchically:
  `qmd context add qmd://notes "Personal notes"`
- When a sub-document matches a query, the parent context is returned alongside
  it, giving the retriever provenance and scope information
- Hybrid retrieval: BM25 (keyword) + vector (semantic) + LLM reranking

**What this tells T28 about O4 (analysis layer design):**

1. **The analysis layer needs a context hierarchy, not a flat index.** Extracted
   content should be organized in a tree: source type -> source -> section ->
   chunk. Each level carries context metadata that flows down to children.

2. **Retrieval should be context-aware.** When the synthesis layer queries
   across sources, results should carry their lineage (which source, which
   section, what type of content, what extraction confidence).

3. **qmd's hybrid search strategy is the right model.** At scale (100+ sources),
   pure keyword search (Grep) breaks down. BM25 + vector + reranking gives
   better recall across heterogeneous content. This validates T25 (evaluate qmd
   for JASON-OS search).

4. **Local-first matters.** qmd runs entirely on-device with GGUF models. No
   cloud dependency for search. T28's analysis layer should also work locally.

**O4 partial resolution:** The context tree pattern provides a concrete design
for organizing the analysis layer's retrieval index. It does NOT address the
analysis operations themselves (what questions to ask of extracted content, how
to score relevance, how to detect patterns). Those remain open.

---

## 4. ArchiveBox's "Extract Everything" Pattern

**Question:** Should T28 extract multiple formats per source, or pick one
canonical format?

**Answer: Pick one canonical format for analysis, but preserve the option for
multi-format when the source warrants it.**

ArchiveBox's multi-format approach solves a different problem (archival
completeness) than T28 (content intelligence). T28 needs to UNDERSTAND content,
not PRESERVE it in every possible format.

**The right approach for T28:**

- **Primary extraction:** Convert every source to markdown + structured
  metadata. This is the canonical format for the analysis layer.
- **Secondary extraction (optional):** For source types where markdown is lossy
  (e.g., video screenshots, data visualizations, interactive content), preserve
  the secondary format alongside the primary.
- **Format selection is per-source-type, not global.** A PDF extracts to
  markdown. A YouTube video extracts to transcript (primary) + key frame
  screenshots (secondary). A tweet extracts to structured JSON (primary) with
  embedded media URLs (secondary).

**What T28 should adopt from ArchiveBox:**

- The content-type detection pattern (detect what kind of content, route to
  appropriate extractor)
- The independent toggle pattern (each extractor can be enabled/disabled per
  source type)
- The plain-files storage pattern (extracted content is readable without T28
  infrastructure)

**What T28 should NOT adopt:**

- Extracting all formats by default. Too expensive for content intelligence.
  Archive everything only when explicitly requested.

---

## 5. Nitter's Adversarial Extraction

**Question:** Does T28 need an adversarial extraction strategy?

**Answer: T28 should support social media as a source type but classify it as
"high-maintenance" with explicit user warnings.**

The nitter analysis reveals three facts about social media extraction:

1. **It works, but it is fragile.** Nitter has been partially broken multiple
   times as Twitter changes its internal APIs. At 12.7K stars with active
   maintainers, it still struggles to keep up.

2. **The adversarial dynamic is permanent.** Platforms will never make
   extraction easier. Meta, Twitter/X, TikTok, LinkedIn -- all actively combat
   scraping. Any social media extractor T28 builds will require ongoing
   maintenance.

3. **The value is real.** Social media posts are a legitimate source type for
   content intelligence. Public figures, organizations, and communities post
   substantive content on social platforms that does not exist elsewhere.

**Recommended T28 approach:**

- **Include social media as a supported source type** but flag it as
  "adversarial" in the extractor registry
- **Use RSS where available** (nitter-style RSS generation, native RSS for
  platforms that support it). RSS is the most resilient extraction method for
  social media.
- **Do NOT build custom API reverse-engineering.** Delegate to existing tools
  (nitter for Twitter, Invidious for YouTube, etc.) and consume their output.
- **Warn users that social media extractors may break** and design the system so
  a broken extractor does not block the pipeline for other source types.
- **Rate limit aggressively.** Social media platforms are the most likely to
  rate-limit or ban. The extractor must handle 429s gracefully.

---

## 6. Final Coverage Assessment: Source Types with Zero Methodology

After all 6 clusters (A-F, 13 repos), here is the coverage map for T28's
anticipated source types:

### COVERED (methodology exists from analyzed repos)

| #   | Source Type        | Methodology Source                        |
| --- | ------------------ | ----------------------------------------- |
| 1   | PDF documents      | docling, marker, surya, MinerU (A+B)      |
| 2   | Word/DOCX          | unstructured (A+B)                        |
| 3   | PowerPoint/PPTX    | unstructured (A+B)                        |
| 4   | Plain text/MD      | Direct read (trivial)                     |
| 5   | Web pages (single) | jina/reader (A), firecrawl (C)            |
| 6   | Web sites (crawl)  | crawl4ai, firecrawl (C)                   |
| 7   | Web archives       | ArchiveBox (F)                            |
| 8   | Wiki content       | outline API (E)                           |
| 9   | Knowledge bases    | qmd file-based + context tree (E)         |
| 10  | Social media       | nitter proxy pattern (F)                  |
| 11  | Video (YouTube)    | youtube-transcript-api, yt-dlp (existing) |
| 12  | Video (general)    | AWS media extraction frame pipeline (D)   |
| 13  | Images/OCR         | surya, tesseract (B)                      |
| 14  | RSS feeds          | Standard XML parsing (trivial)            |
| 15  | GitHub repos       | GitHub API + git clone (existing infra)   |

### PARTIALLY COVERED (adjacent methodology exists, needs adaptation)

| #   | Source Type       | Gap Description                                   |
| --- | ----------------- | ------------------------------------------------- |
| 16  | Podcasts/audio    | yt-dlp extracts audio, but no speech-to-text repo |
|     |                   | analyzed. Whisper is the obvious tool but not in  |
|     |                   | our corpus.                                       |
| 17  | Email/newsletters | Could use web page extraction on HTML emails, but |
|     |                   | no email-specific methodology (IMAP, threading,   |
|     |                   | attachment handling).                             |
| 18  | Spreadsheets/CSV  | Unstructured handles some. No dedicated tabular   |
|     |                   | data extraction methodology.                      |
| 19  | API responses     | public-apis cataloged APIs but no extraction      |
|     |                   | methodology for consuming API data as content.    |
| 20  | Chat/messaging    | Social media proxy pattern is adjacent. Slack,    |
|     |                   | Discord, Telegram have different API models.      |

### ZERO COVERAGE (no methodology from any analyzed repo)

| #   | Source Type         | Notes                                            |
| --- | ------------------- | ------------------------------------------------ |
| 21  | Databases/SQL dumps | Structured data extraction is a different        |
|     |                     | paradigm entirely. No repo covered this.         |
| 22  | Code documentation  | JSDoc/TSDoc/Sphinx/Javadoc -> structured output. |
|     |                     | Related to repo analysis but not extraction.     |
| 23  | Academic papers     | arxiv/semantic-scholar APIs exist but were not   |
|     |                     | analyzed. PDF extraction covers the document     |
|     |                     | but not the citation graph.                      |
| 24  | Calendar/events     | Google Calendar API noted in public-apis but     |
|     |                     | not as a content extraction source.              |
| 25  | Browser bookmarks   | ArchiveBox accepts bookmarks as INPUT but does   |
|     |                     | not extract/analyze bookmark collections.        |
| 26  | Desktop app content | Screenshots + OCR is the only approach. No       |
|     |                     | methodology for extracting from native apps.     |
| 27  | IoT/sensor data     | Time-series data from devices. Entirely          |
|     |                     | different extraction paradigm.                   |
| 28  | Handwritten notes   | Surya/tesseract handle printed text. Handwriting |
|     |                     | recognition is a harder, uncovered problem.      |

### Summary

- **15 source types** have clear methodology from analyzed repos
- **5 source types** have partial coverage (adjacent tools exist, need
  adaptation)
- **8 source types** have zero coverage

**However:** The 8 zero-coverage types are mostly edge cases or niche source
types. The 15 covered types represent the overwhelming majority of content
people actually want to extract and analyze. T28's brainstorm should focus on
the architecture for the 15 covered types and note the 5 partially-covered types
as stretch goals. The 8 uncovered types can be added later as extractors become
available -- the pluggable architecture makes this possible without redesign.

---

## Open Questions Update

| ID  | Question                          | Status After E+F                                      |
| --- | --------------------------------- | ----------------------------------------------------- |
| O1  | Cross-source synthesis primitives | Still OPEN. No repo addressed this.                   |
| O2  | Extraction confidence schema      | Still OPEN. No repo modeled extraction confidence.    |
| O3  | Hierarchy preservation threshold  | PARTIALLY ADDRESSED. Outline shows hierarchy matters. |
|     |                                   | qmd's context tree shows how to preserve it in        |
|     |                                   | retrieval. No threshold guidance (when to flatten     |
|     |                                   | vs preserve).                                         |
| O4  | Analysis layer design             | PARTIALLY ADDRESSED. qmd's context tree informs       |
|     |                                   | retrieval organization. ArchiveBox's content-type     |
|     |                                   | detection informs routing. Analysis operations        |
|     |                                   | themselves remain undefined.                          |

---

## Key Takeaways for T28 Brainstorm

1. **The pipeline is universal.** Extract -> Analyze -> Synthesize works for
   every source type. Only the extractor changes.

2. **The extractor interface is the critical design decision.** What does a T28
   extractor receive (URL? file path? API credentials?) and what must it return
   (markdown + metadata schema)?

3. **qmd's context tree is the most important new pattern.** It solves the "how
   do I search across 100+ heterogeneous sources" problem that flat indexes
   cannot.

4. **Social media is real but risky.** Support it, but design for extractor
   failure. The system must degrade gracefully when a platform blocks access.

5. **Multi-format extraction is for archival, not intelligence.** T28 should
   extract to one canonical format (markdown + metadata) with optional secondary
   formats for lossy source types.

6. **15 of ~28 source types are covered.** Enough to build the architecture. The
   remaining types slot in later via the pluggable extractor interface.

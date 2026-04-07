# Gap Agent A: Multi-Format Extraction Cluster

**Generated:** 2026-04-07 | **Cluster:** A (unstructured, docling, reader)
**Status:** Complete | **Feeds:** T28 Unified Content Intelligence brainstorm

---

## Question 1: What extraction patterns are still unclear for multi-format document types?

### The flat-vs-tree output format question is not just a preference -- it is a fundamental design fork

Unstructured returns a flat list of typed Elements (Text, Title, Table, Image,
Formula). Docling returns a tree-structured DoclingDocument with body/furniture
separation and reading order via tree traversal. These are not interchangeable.
The flat model loses document hierarchy (which heading owns which paragraphs)
but gains simplicity and uniform processing. The tree model preserves structural
semantics but requires tree traversal logic everywhere downstream.

**T28 must decide: does the analysis layer need hierarchy or just typed items?**

For repo-analysis and website-analysis, the current extraction-journal.jsonl is
flat (findings as independent items). This works because code repos and websites
do not have the same structural hierarchy as a 50-page PDF. But if T28 must
handle academic papers, technical manuals, or legal documents, flat extraction
loses critical context -- you need to know that Table 3 belongs to Section 4.2,
not just that Table 3 exists.

### Edge cases neither repo addresses

1. **Multi-language documents.** A PDF with English body text and Japanese
   appendices. Neither unstructured nor docling surfaces per-element language
   detection. T28's analysis layer may need this for non-English sources.

2. **Embedded media within documents.** A DOCX with an embedded video or audio
   clip. Unstructured ignores it. Docling classifies it as a picture/media item
   but does not extract the embedded content. T28 would need to recurse into
   embedded media.

3. **Live/dynamic documents.** Google Docs, Notion pages, Confluence wikis are
   documents that change. Both repos assume static file input. T28 handles URLs
   (which are inherently dynamic), but has no strategy for versioning or
   change-tracking of extracted content.

4. **Extraction confidence scoring.** Unstructured has no per-element confidence
   score (the creator-view notes this explicitly). Docling's VLM pipeline
   presumably has model confidence, but it is not surfaced in DoclingDocument.
   T28's analysis layer needs to know when extraction quality is low --
   otherwise downstream analysis inherits garbage without knowing it.

5. **Table extraction fidelity.** Both repos struggle with complex tables
   (merged cells, nested headers, multi-page tables). Unstructured's chunking
   isolates tables, and docling has dedicated table structure models, but
   neither has a reliable way to signal "this table was partially reconstructed"
   versus "this table was fully parsed."

---

## Question 2: What architectural decisions are not covered by any analyzed repo?

None of the three Cluster A repos address the following, and these are all
decisions T28 must make:

### Source type routing beyond file types

Unstructured routes by MIME type (file on disk). Docling routes by InputFormat
enum (file extension). Reader routes by URL prefix (r.jina.ai). T28 must route
across fundamentally different source categories:

- `https://github.com/org/repo` --> repo extractor (gh CLI)
- `https://example.com/article` --> web extractor (Chrome/Playwright)
- `https://arxiv.org/abs/2408.09869` --> academic paper extractor (PDF +
  metadata)
- `podcast.mp3` --> audio extractor (Whisper)
- Slack channel URL --> social/chat extractor (API)

This routing problem is harder than file type detection. A URL can be a GitHub
repo, a PDF download link, a web page, or an API endpoint. T28 needs a URL
classification layer that none of these repos have.

### Cross-source synthesis architecture

Unstructured processes one document. Docling processes one document. Reader
processes one URL. None of them have any concept of:

- Correlating findings across sources (this blog post references that paper)
- Deduplication across sources (same content found via crawling and via PDF)
- Conflict resolution (source A says X, source B says not-X)
- Provenance chains (this insight was extracted from this URL which was found
  via this repo's README)

T28's synthesis layer is the entire value proposition over existing tools. There
is zero prior art in Cluster A for how to design it.

### Progressive extraction with resumability

All three repos are batch-process-once systems. T28 needs:

- Resume from where extraction stopped (rate limit hit, session ended)
- Update previously extracted content (re-crawl after 30 days)
- Incremental extraction (new commits to a repo since last analysis)

None of these repos handle this, and it is architecturally significant because
it means T28's extraction output must be addressable and updatable, not
append-only.

### MCP-mediated extraction orchestration

Docling has a docling-mcp server, but it is a tool provider, not an
orchestrator. T28 needs to orchestrate multiple MCP tools (Chrome, memory,
potentially docling-mcp, gh CLI) within a single extraction flow. The
orchestration pattern -- how to coordinate multiple MCP servers during one
extraction -- has no prior art in this cluster.

### Rate limiting and cost management

Reader (hosted service) would have rate limits. Web crawling has politeness
constraints. API extraction has quota limits. None of the Cluster A repos handle
multi-source rate limiting as an architectural concern. T28 must, because a
single "analyze this website" command might hit Chrome, an API, and an LLM
endpoint simultaneously.

---

## Question 3: How does this cluster's approach connect to or conflict with prior T28 context?

### Supports the T28 thesis

The T28 plan assumes a unified extraction --> analysis --> synthesis pipeline.
Both unstructured and docling validate this layered architecture:

- **Unstructured's partition() --> Element --> chunking chain** is exactly
  extraction --> analysis-ready output. The strategy fallback (AUTO/FAST/HI_RES)
  maps to T28's Quick/Standard/Deep depth model.

- **Docling's Backend --> Pipeline --> DoclingDocument chain** is a cleaner
  version of the same idea, with explicit separation between format parsing
  (backend) and processing orchestration (pipeline).

- **Docling's ASR pipeline** proves the thesis directly: audio goes through a
  completely different parsing backend but produces the same DoclingDocument
  output. This is what T28 claims it can do across 28 source types.

### Conflicts with T28 assumptions

1. **Neither repo has an analysis layer.** Both stop at extraction. Unstructured
   gives you elements; docling gives you a document representation. Neither
   interprets, evaluates, or scores the content. T28's analysis layer (which
   currently lives in repo-analysis phases 3-4 and website-analysis phases 3-4)
   has no analog in either tool. This means T28 cannot simply wrap these tools
   -- the analysis logic must be purpose-built.

2. **The "unified output format" is harder than it looks.** Docling's
   DoclingDocument took 2+ years and 201 contributors to stabilize for 17
   formats. T28 wants to unify 28 source types (many of which have no structural
   analog to a "document") into one format. A GitHub repo does not have "pages."
   A podcast does not have "headings." The T28 unified format will either be
   very generic (losing type-specific richness) or very complex (trying to
   represent everything).

3. **The T28 plan underestimates the routing complexity.** Unstructured's
   FileType enum works because all inputs are files with detectable MIME types.
   T28's inputs include URLs (which need network requests to classify), live
   services (which need authentication), and composite sources (a GitHub repo
   contains code + docs + issues + discussions). The routing layer needs to be
   smarter than a type enum.

---

## Question 4: What would break if we tried to normalize multi-format document output into T28's shared analysis layer?

### Information loss matrix

| Source output                | What the analysis layer needs               | What gets lost in normalization                                                                                                                       |
| ---------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unstructured flat Elements   | Just typed text items                       | Spatial coordinates (x,y positions on page), coordinate system metadata, permissions data from ingestion connectors                                   |
| Docling tree DoclingDocument | Document hierarchy + reading order          | JSON pointer cross-references break when flattened, furniture items (headers/footers) lose their "not-body" designation, group relationships dissolve |
| Reader plain text            | Clean text for LLM consumption              | All structural information -- no headings, no tables, no metadata. Just a string                                                                      |
| T28 repo-analysis findings   | Findings with dimensions, scores, citations | Repo-specific metadata (stars, forks, health bands, file paths) has no analog in document elements                                                    |
| T28 website-analysis signals | Signals with evidence, technology stacks    | Website-specific metadata (domain, tech stack, CMS, monetization) has no analog in document elements                                                  |

### The normalization dilemma

There are three approaches, each with costs:

**Option A: Lowest common denominator.** Normalize everything to typed text
items with metadata bags. This is essentially what extraction-journal.jsonl
already does. Cost: you lose hierarchy, spatial data, reading order, and
source-specific richness. The analysis layer works on impoverished data.

**Option B: Union type.** Create a schema that is the union of all
source-specific fields. A `ContentItem` has optional `coordinates`, optional
`tree_position`, optional `repo_health_band`, optional `website_tech_stack`.
Cost: the schema becomes enormous, most fields are null for any given source
type, and the analysis layer must handle sparse data everywhere.

**Option C: Two-tier schema.** A shared core (text, type, source, timestamp,
confidence) plus a source-specific extension bag (opaque JSON). The analysis
layer works on the core; source-specific analysis reads the extension. Cost: the
"unified" analysis layer can only do generic analysis. Source-specific analysis
needs custom code per source type, which partially defeats the unification goal.

**Recommendation for brainstorm:** Option C is the only viable path, but the
brainstorm must address what "generic analysis" means and whether it provides
enough value. If 80% of analysis insight comes from source-specific logic, the
unified layer is a thin pass-through and the real value is in the per-source
analyzers. That would suggest T28 should be a routing + orchestration layer
(like the T28 plan says), not a unified analysis engine.

---

## Question 5: What is the hardest unsolved problem for T28 in the multi-format domain?

### The output schema problem is the hardest problem, and it must be solved before anything else is built

Every design decision downstream depends on what the extraction layer produces.
The analysis layer's capabilities are bounded by what its input contains. The
synthesis layer's cross-source correlation depends on having comparable fields
across sources.

Unstructured and docling spent years converging on their output schemas for a
single domain (documents). T28 wants to unify 28 source types that are
fundamentally different in structure. The question is not "flat vs tree" -- it
is **what are the universal attributes of extracted content across all 28 source
types?**

Consider:

- A PDF table has coordinates, column headers, cell values
- A GitHub repo has files, commit history, contributor graphs
- A podcast has timestamps, speaker turns, topic segments
- A tweet thread has author, timestamp, reply chain, engagement metrics
- A Slack channel has messages, threads, reactions, file attachments
- An API spec has endpoints, parameters, response schemas

What is the common structure? The only universal properties are:

1. **Source** (where it came from)
2. **Timestamp** (when it was extracted)
3. **Content type** (what kind of thing it is)
4. **Text representation** (some textual form for LLM consumption)
5. **Relationships** (what it connects to)

Everything else is source-specific. This means the "unified" schema is thin, and
the thick parts are per-source-type extensions. The brainstorm must grapple with
whether this thin-core + thick-extensions architecture provides enough
unification to justify the T28 effort, or whether T28 should instead focus on
**unified orchestration** (one command to trigger any source type) with
**per-source schemas** (each source type has its own output format that the
synthesis layer maps from).

The docling model suggests the latter is viable: docling's DoclingDocument is
not generic -- it is a document-specific schema that happens to work for
multiple document formats because documents share enough structure. T28 might
need 3-5 "schema families" (document, code, web, audio, social) rather than one
universal schema.

---

## Summary: Open Questions for Brainstorm

1. **Output schema architecture:** Thin universal core + source-specific
   extensions? Or 3-5 schema families? Or one universal schema?

2. **URL classification layer:** How does T28 route a raw URL to the right
   extractor? This is harder than file type detection and has no prior art.

3. **Cross-source synthesis primitives:** What are the basic operations? Link,
   deduplicate, conflict-resolve, chain? None of the Cluster A repos offer any
   model for this.

4. **Extraction confidence propagation:** How does uncertainty in extraction
   flow through to analysis and synthesis? Neither unstructured nor docling
   solves this.

5. **Progressive/resumable extraction:** T28 sessions are interruptible. How
   does extraction state persist across sessions? Batch-only models from Cluster
   A offer no guidance.

6. **Hierarchy preservation threshold:** When is tree structure necessary (PDF
   analysis) vs wasteful overhead (tweet extraction)? Should this be per-source
   configurable?

7. **The 80/20 question:** If 80% of analysis value comes from source-specific
   logic, is a unified analysis layer even the right goal? Or should T28 be
   unified routing + orchestration with specialized per-source analyzers?

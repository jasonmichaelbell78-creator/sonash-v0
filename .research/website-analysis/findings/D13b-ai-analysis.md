# Findings: AI Analysis and Search Tools — Perplexity, Exa, Google AI Overviews, and Others

**Searcher:** deep-research-searcher **Profile:** web + docs **Date:**
2026-04-05 **Sub-Question IDs:** SQ13b

---

## Key Findings

### 1. Perplexity Deep Research — Multi-Step Orchestration as the Core Innovation [CONFIDENCE: HIGH]

Perplexity's Deep Research operates through a six-stage pipeline that
distinguishes it from all standard search:

1. **Query interpretation** (10-20 seconds): decomposes the top-level question
   into sub-topics and research dimensions
2. **Multi-step retrieval execution** (1-2 minutes): performs 20-50 targeted
   queries, clustering results by relevance and recency; sources drawn from 200+
   pages
3. **Hybrid retrieval**: BM25 (keyword) + dense embedding (semantic) over
   crawled pages and indexed documents
4. **Multi-layer ML reranking** (L1-L3): span-level extraction identifies
   candidate claims; passage ranking applies quality filters
5. **Structured prompt assembly**: citations are embedded structurally _before_
   LLM generation — "citations are not retrofitted post-generation, they are
   structurally assigned during context assembly" [1]
6. **LLM synthesis**: constrained generation over retrieved evidence, with
   inline numbered citations [1]

**Citation format**: Inline superscript numbers (e.g., [1][2]) anchored to
source cards rendered at the bottom of the response. Each citation passes five
sequential gates: intent matching, retrieval, quality assessment, ML reranking,
and engagement-informed selection [1].

**Pro vs. Standard differences** [2][3]: | Feature | Standard | Pro |
|---------|----------|-----| | Context window | 128K tokens | 200K tokens | |
Sources queried | 5-10 | 20+ | | Query decomposition | Single-pass | Multi-step
sub-queries | | Processing time | Seconds | 2-4 minutes | | Model options |
Sonar basic | Sonar Pro, GPT-4.5, Claude Sonnet 4.6, Kimi K2.5 | | Daily queries
| 5-10 | Unlimited |

**Related questions mechanism**: Leverages RAG session history combined with
contextual attention over conversation turns. The system encodes conversation
history alongside new queries; the LLM generates follow-up suggestions based on
semantic proximity in the embedding space of what was retrieved vs. what wasn't
covered. The mechanism is session-scoped: it resolves ambiguous references
across multi-turn interactions [1].

**What we can learn**: Perplexity's key insight is that research depth is a
function of _query count and synthesis orchestration_, not raw model capability.
The structured citation-before-generation architecture ensures every claim is
traceable. For `/website-analysis`, the equivalent is: analysis depth should
scale with crawl breadth, and every insight should trace to a source URL +
extracted span.

---

### 2. Exa — Neural "Next-Link Prediction" as Search Paradigm [CONFIDENCE: HIGH]

Exa builds its search around a fundamentally different hypothesis: the best way
to find relevant content is to predict what a knowledgeable person would link to
next, not to match keywords.

**Technical architecture** [4][5]:

- Every indexed page is converted to a high-dimensional semantic vector using
  custom transformer models
- Vector DB built in Rust, using clustering, matryoshka embeddings, binary
  quantization, and SIMD operations over a "tens of billions" page index
  refreshed minutely
- Custom embedding model trained on a 144x H200 GPU cluster for over a month
  (Exa 2.0)

**Search modes** (Exa 2.0) [5]:

- **Exa Fast**: sub-350ms P50, highest speed
- **Exa Auto**: default, balances speed and quality
- **Exa Deep**: 3.5s P50 agentic mode that "searches, processes, and searches
  again until it finds premium-quality information"

**Find Similar feature**: Given a URL, Exa retrieves semantically similar pages
by using the source page's embedding as the query vector. This is the core
primitive for Expedition mode inspiration — surfacing related content clusters
from a seed URL.

**Autoprompt (deprecated in late 2025)**: Previously `use_autoprompt=True` would
automatically rephrase natural language queries into the "describing a link"
format that Exa's model expects. The `use_autoprompt` field was removed from API
responses in an October 2025 SDK update [6]. The recommended replacement is to
manually frame queries as link descriptions.

**Content extraction**: Exa returns full page content alongside search results,
eliminating a separate scraping step. Scores 8.7/10 on the AN Score framework
for agent suitability [7].

**MCP server availability**: Exa has a production-ready MCP server
(`exa-mcp-server` via npx). Tools exposed: `web_search_exa`,
`get_code_context_exa`, `company_research`. No API key required for basic usage.
HTTP endpoint: `https://mcp.exa.ai/mcp`. Works with Claude Code directly [8].

**What we can learn**: Exa's "find similar" primitive is directly applicable to
Expedition mode — from any crawled URL, we could offer "find 10 semantically
similar pages" as a discovery vector. The embedding-based approach surfaces
thematic relatives that keyword search misses entirely.

---

### 3. Google AI Overviews — Query Fan-Out and E-E-A-T Authority [CONFIDENCE: HIGH]

**Source selection methodology** [9][10]:

- **Query fan-out**: Google decomposes the user query into multiple sub-queries
  using Gemini, then runs all sub-queries in parallel. Pages that appear most
  frequently across sub-query results earn citation priority
- **E-E-A-T signals**: 96% of cited sources carry strong Expertise, Experience,
  Authority, and Trust signals. Pages with 15+ recognized entities show 4.8x
  higher selection probability
- **Organic correlation but not equivalence**: 76% of citations come from top-10
  organic results, but 47% of citations now come from pages ranking below
  position #5 — organic rank is insufficient by itself
- **Multimodal bonus**: Pages combining text + images + video + structured data
  see 156% higher selection rates; full multimodal + schema integration yields
  up to 317% more citations
- **Freshness**: Recently updated content is preferred for time-sensitive
  queries

**Citation presentation**: Expandable footnote chips inline within the AI
Overview text (not numbered superscripts). Clicking expands a source panel with
snippet + link. The AI Overview appears above traditional results for over 50%
of searches as of August 2025 [10].

**"People also ask" / follow-up generation**: The mechanism is probabilistic
query expansion — related questions are drawn from Google's long-running query
clustering data (from billions of historical searches) that identifies what
people search for next after a given query. This is distinct from Perplexity's
session-based approach; Google uses population-level co-search patterns [9].

**What we can learn**: For `/website-analysis`, the multi-source synthesis
pattern is key — rather than reporting what one page says, synthesize across all
crawled pages. The query fan-out model translates directly to multi-perspective
analysis (marketing claims vs. technical claims vs. user-facing content vs.
structured data).

---

### 4. Claude's Own Web Search — Four-Category Decision Framework [CONFIDENCE: HIGH]

Claude (claude.ai) uses a tiered internal decision framework for when to search,
revealed through a May 2025 system prompt leak [11]:

| Category       | When                                                       | Action                                         |
| -------------- | ---------------------------------------------------------- | ---------------------------------------------- |
| Never search   | Stable facts, historical info, clear consensus in training | Answer from training data only                 |
| Suggest search | People, companies, metrics, rankings                       | Answer from training, offer to search for more |
| Simple search  | Current topics, news, recent data with time reference      | Single quick search                            |
| Complex search | Comparisons, benchmarks, competitor analysis               | Multiple coordinated searches                  |

**Research mode vs. web search** [12]:

- **Web search**: 1-2 lookups, seconds, best for specific facts
- **Research mode**: 5+ tool calls over 1-3 minutes, in-depth multi-source
  synthesis, extended thinking automatically enabled
- Research + extended thinking together allows Claude to "plan its approach
  thoughtfully and execute comprehensive information gathering"

**Citation presentation**: Inline links within generated text, plus a
collapsible sources panel. Claude avoids reproducing large (20+ word) chunks;
prefers paraphrasing with attribution.

**What we can learn**: The four-category framework is essentially a
freshness/certainty matrix. For `/website-analysis`, we need a similar signal:
"does this analysis need real-time data or is cached analysis sufficient?" The
freshness decision should be explicit, not implicit.

---

### 5. Tavily — Purpose-Built Agent Search Infrastructure [CONFIDENCE: HIGH]

Tavily is the most directly useful tool for powering `/website-analysis` as an
infrastructure component [13][14]:

**Core APIs**:

- **Search** (`/search`): 180ms P50 latency, returns structured JSON with
  summaries, citations, content highlights, snippets sized for LLM context
  windows
- **Extract** (`/extract`): Intelligent content extraction from specific URLs,
  clean parsed output
- **Crawl** (`/crawl`): Multi-page crawling for site-wide data gathering
- **Research** (`/research`): Deep end-to-end research via single API call —
  iterative searches, reasoning over data, multi-agent coordination,
  deduplication, structured JSON output

**Output format design philosophy**: "Structured JSON with summaries, citations,
content highlights, and snippets shaped for LLM consumption" — reduces glue code
between retrieval and prompt construction [15]. Eliminates the need to
separately fetch, normalize HTML, handle anti-bot, and trim for context windows.

**Security/reliability**: 99.99% uptime SLA, SOC 2 certified, blocks PII
leakage, prompt injection, and malicious sources [13].

**MCP server**: Production-ready. Two tools: `tavily-search` and
`tavily-extract`. Remote MCP via cloud endpoint (API key only) or local Node.js
installation. OAuth authentication available. Works with Claude Code, Cursor,
Claude Desktop [16].

**Agent score**: 8.6/10 on AN Score framework. "When you call Tavily Search, you
receive structured JSON including summary fields, source citations, content
highlights, and snippets already trimmed for context windows" [7].

**What we can learn / can use directly**: Tavily's Extract API is a strong
candidate for the extraction layer of `/website-analysis`. It handles anti-bot,
normalization, and structured output — reducing the skill's infrastructure
burden to zero for the fetch layer. The `/research` endpoint could power
deep-dive analysis mode.

---

### 6. Other Notable Tools

#### You.com Research Mode [CONFIDENCE: MEDIUM]

Multi-LLM orchestration approach: "orchestration that happens between different
LLMs behind the scenes during each query, even before a prompt is fully
processed" [17]. Best for: comparative tables, extensive citation reports,
real-time news synthesis. Focuses on accuracy (93%) with verified sources. No
MCP server found as of research date.

#### Phind — Developer-Focused Search (HISTORICAL) [CONFIDENCE: MEDIUM-LOW]

Phind combined GPT-4 Turbo with real-time documentation lookups, Stack Overflow,
GitHub discussions, and official docs. It backed answers with source links and
code snippets. **Note: Phind shut down in early 2026** per multiple sources
[18]. Its methodology is now historical reference only.

#### Kagi Universal Summarizer [CONFIDENCE: HIGH]

Three-tier model architecture: Cecil (consumer), Agnes (consumer+), Muriel
(enterprise). Handles text, PDF, video, audio of unlimited length. Outputs
structured summaries with configurable format [19]. Has an API
(`api.kagi.com/api/v0/summarize`). The Universal Summarizer API is directly
callable and could be used by `/website-analysis` for summarizing long crawled
pages.

**What we can learn**: Kagi's unlimited-length document handling is relevant for
`/website-analysis` — we need to handle large pages without truncation. Their
three-tier model (speed vs. quality) maps well to our potential `quick` vs.
`deep` analysis modes.

#### Serper / SerpAPI / SearchAPI [CONFIDENCE: HIGH]

These are raw SERP data APIs — they return Google/Bing results in structured
JSON without synthesis. Serper scores 8.0/10 on agent suitability. Best for:
time-sensitive queries, volume pricing ($0.30/1K queries). Not directly
applicable for website analysis (they return search result metadata, not page
content analysis).

---

### 7. Patterns for the `/website-analysis` Skill [CONFIDENCE: HIGH]

**How `/website-analysis` should differ from these tools**:

All existing tools analyze the web _from the outside_ — they surface pages based
on relevance to a query. `/website-analysis` should analyze _a specific site
from the inside_ — understanding its structure, intent, content architecture,
and creator decisions. The market gap is:

| What existing tools do            | What `/website-analysis` uniquely offers                |
| --------------------------------- | ------------------------------------------------------- |
| Find relevant pages for a query   | Map the full structural anatomy of one site             |
| Assess E-E-A-T for search ranking | Reveal creator intent and content strategy              |
| Synthesize across many sources    | Deep single-source structural analysis                  |
| Keyword and semantic content      | Navigation logic, internal link patterns, CTA structure |
| Output for consumers of content   | Output for creators of content                          |
| Query-driven discovery            | Site-driven self-understanding                          |

**What all these tools miss** (the Creator View gap):

1. **Creator intent reconstruction**: None of these tools ask "why did the
   creator structure it this way?" They are consumer-oriented (what does this
   page say?) not creator-oriented (what is this site trying to do?)
2. **Content architecture analysis**: Site hierarchy, content type distribution,
   navigational logic, hub-spoke patterns — invisible to all query-based tools
3. **Structural patterns across crawled pages**: Consistent CTAs, recurring
   template patterns, tone shifts between sections — these require cross-page
   structural comparison, not semantic search
4. **Evidence vs. claim detection**: Google AI Overviews and Perplexity both
   _consume_ claims but don't audit them. `/website-analysis` Creator View could
   flag unsupported claims vs. cited claims
5. **Audience targeting signals**: Who is this site written for? Existing tools
   don't answer this without explicit prompting and have no structural basis for
   the answer

**Which tools can be USED BY the skill**:

| Tool                 | Role in `/website-analysis`                   | Integration Method       |
| -------------------- | --------------------------------------------- | ------------------------ |
| Tavily Extract       | Page content extraction (primary)             | Tavily MCP or direct API |
| Exa Find Similar     | "Related sites" discovery for Expedition mode | Exa MCP (exa-mcp-server) |
| Kagi Summarizer      | Summarize long crawled pages                  | Direct API call          |
| Exa company_research | Business context for commercial sites         | Exa MCP                  |
| Tavily Crawl         | Multi-page site crawl                         | Tavily API               |

Perplexity is NOT recommended as an integration target — it returns synthesis
not raw data, has 11+ second latency, and requires extraction infrastructure to
post-process. It's a consumer product, not an agent infrastructure component.

**Market gap assessment**:

The existing tool landscape (Perplexity, Exa, Google AIO, Kagi) is entirely
_query-centric_: you bring a question, the tool finds relevant content. The
`/website-analysis` skill occupies the orthogonal niche of _site-centric
analysis_: you bring a URL (or site), the skill maps its anatomy without a
predetermined question. This gap is currently unserved at the Claude Code /
developer tooling layer. SEO tools (Ahrefs, Semrush) fill the competitive
research version of this niche but are query-centric and keyword-focused, not
structure-focused or creator-focused.

---

## Sources

| #   | URL                                                                                                          | Title                                                                     | Type                 | Trust       | CRAAP     | Date      |
| --- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- | -------------------- | ----------- | --------- | --------- |
| 1   | https://ziptie.dev/blog/how-perplexity-ai-answers-work/                                                      | How Perplexity AI Answers Work: Retrieval, Ranking, and Citation Pipeline | Technical blog       | MEDIUM-HIGH | 4/5/5/4/5 | 2025      |
| 2   | https://www.perplexity.ai/help-center/en/articles/10352903-what-is-pro-search                                | What is Pro Search — Perplexity Help Center                               | Official docs        | HIGH        | 5/5/5/5/5 | 2025      |
| 3   | https://www.perplexity.ai/hub/blog/pro-search-upgraded-for-more-advanced-problem-solving                     | Pro Search: Upgraded for more advanced problem-solving                    | Official blog        | HIGH        | 4/5/5/5/4 | 2025      |
| 4   | https://exa.ai/blog/building-web-scale-vector-db                                                             | How We Built a Web-Scale Vector Database                                  | Official blog        | HIGH        | 4/5/5/5/4 | 2025      |
| 5   | https://exa.ai/blog/exa-api-2-0                                                                              | Introducing Exa 2.0                                                       | Official blog        | HIGH        | 5/5/5/5/5 | 2025      |
| 6   | https://docs.exa.ai/changelog/sdk-major-version-changes                                                      | SDK changes: autoprompt deprecation                                       | Official changelog   | HIGH        | 5/5/5/5/5 | Oct 2025  |
| 7   | https://dev.to/supertrained/exa-vs-tavily-vs-serper-vs-brave-search-for-ai-agents-an-score-comparison-2l1g   | Exa vs Tavily vs Serper vs Brave Search for AI Agents — AN Score          | Technical analysis   | MEDIUM      | 4/5/4/4/4 | 2025      |
| 8   | https://exa.ai/mcp                                                                                           | Exa MCP Server — AI Web Search for Claude, Cursor & VS Code               | Official docs        | HIGH        | 5/5/5/5/5 | 2025-2026 |
| 9   | https://whitepeak.io/how-googles-ai-overviews-select-sources/                                                | How Google's AI Overviews Select Sources                                  | Analysis             | MEDIUM      | 4/5/4/4/4 | 2025      |
| 10  | https://www.searchenginejournal.com/google-ai-overview-citations-from-top-ranking-pages-drop-sharply/568637/ | Google AI Overview Citations From Top-Ranking Pages Drop Sharply          | Industry news        | MEDIUM-HIGH | 4/5/4/4/4 | 2025      |
| 11  | https://danileitner.ch/en/blog/insights-from-the-claude-system-prompt-leak/                                  | Insights from the Claude System Prompt Leak                               | Analysis             | MEDIUM      | 3/5/3/4/4 | May 2025  |
| 12  | https://support.claude.com/en/articles/11095361-when-should-i-use-web-search-extended-thinking-and-research  | When should I use web search, extended thinking, and Research?            | Official docs        | HIGH        | 5/5/5/5/5 | 2025      |
| 13  | https://www.tavily.com/blog/tavily-101-ai-powered-search-for-developers                                      | Tavily 101: AI-powered Search for Developers                              | Official blog        | HIGH        | 4/5/5/5/4 | 2025      |
| 14  | https://docs.tavily.com/documentation/mcp                                                                    | Tavily MCP Server — Official Docs                                         | Official docs        | HIGH        | 5/5/5/5/5 | 2025-2026 |
| 15  | https://alphacorp.ai/blog/perplexity-search-api-vs-tavily-for-rag-2026                                       | Perplexity Search API vs Tavily for RAG 2026                              | Technical analysis   | MEDIUM      | 4/5/4/4/4 | 2026      |
| 16  | https://github.com/tavily-ai/tavily-mcp                                                                      | Tavily MCP Server — GitHub                                                | Official source      | HIGH        | 5/5/5/5/5 | 2025      |
| 17  | https://medium.com/@amanatulla1606/you-coms-new-ai-modes-set-a-new-standard-for-chatbots-978fc3cbc298        | You.com's New AI Modes Set a New Standard                                 | Community blog       | MEDIUM      | 3/4/3/3/4 | 2025      |
| 18  | https://codeparrot.ai/blogs/phind-review-the-ai-powered-coding-assistant-every-developer-needs               | Phind Review (includes shutdown note)                                     | Analysis             | MEDIUM      | 3/4/3/3/4 | 2025-2026 |
| 19  | https://help.kagi.com/kagi/api/summarizer.html                                                               | Universal Summarizer — Kagi Docs                                          | Official docs        | HIGH        | 5/5/5/5/5 | 2025      |
| 20  | https://www.humai.blog/tavily-vs-exa-vs-perplexity-vs-you-com-the-complete-ai-search-api-comparison-2025/    | Tavily vs Exa vs Perplexity vs YOU.com: Complete Comparison 2025          | Independent analysis | MEDIUM-HIGH | 4/5/4/4/4 | 2025      |

---

## Contradictions

**Perplexity latency claims conflict**: The humai.blog comparison reports
Perplexity Search API at 358ms median latency [20], while the alphacorp.ai
technical analysis reports 11+ seconds for Deep Research queries [15]. These are
different products — the 358ms refers to the basic Perplexity Search API
endpoint, while 11+ seconds refers to Deep Research synthesis. The distinction
matters for integration: the Search API is fast but returns synthesis; the Deep
Research endpoint is thorough but slow.

**Exa autoprompt status**: Multiple sources reference `use_autoprompt=True` as
active, but the official Exa changelog confirms its deprecation from API
responses in October 2025 [6]. Sources written before October 2025 may present
autoprompt as current when it has been removed. The recommended current approach
is manual query framing as link descriptions.

**Google AI Overviews citation overlap**: One analysis reports 76% of citations
come from top-10 organic results [9], while another reports 47% come from pages
ranked below position #5 [10]. These are not mutually exclusive — both can be
true if 76% of citations are top-10 but the remaining 24% (a significant
minority) span lower-ranked pages with authority signals.

---

## Gaps

1. **Perplexity's related-questions algorithm specifics**: No official
   documentation explains the exact mechanism for generating follow-up question
   suggestions. The analysis above is inferred from RAG pipeline behavior;
   Perplexity has not published this technically.

2. **Google AI Overviews "People also ask" algorithm**: Google has not published
   technical details on how follow-up questions are generated. The
   "population-level co-search patterns" explanation is industry inference, not
   official documentation.

3. **Exa Find Similar implementation details**: The exact algorithm for
   URL-based similarity search (how the source page is embedded and queried) is
   not publicly documented beyond the general "neural embeddings" description.

4. **You.com Research Mode API**: You.com's B2B API capabilities for Research
   Mode are unclear from available sources. Whether it can be used
   programmatically in the same way as Tavily or Exa is not confirmed.

5. **Claude Code integration with Kagi**: Kagi has an API (`/api/v0/summarize`)
   but no MCP server was found. Integration with Claude Code would require a
   direct HTTP tool call wrapper or custom MCP implementation.

6. **Perplexity API for agents vs. Perplexity the product**: The Perplexity API
   (pplx-api) is distinct from the consumer product and has different
   latency/output characteristics. The precise output format of the API (vs. the
   web UI) was not fully characterized in available sources.

---

## Serendipity

1. **Exa Deep search mode as Expedition primitive**: Exa's new "Deep" mode (3.5s
   P50, agentic: "searches, processes, and searches again") is essentially a
   mini-orchestration loop available via a single API call. This could serve as
   the discovery engine for Expedition mode without building custom
   orchestration — seed URL → Exa Deep for semantic cluster → map results.

2. **Phind is dead (early 2026)**: The developer-focused AI search tool shut
   down in early 2026. This removes it from consideration as an integration
   target but also signals that the developer-focused search niche is not
   sustainably served by consumer-grade tools — a signal that tool-native
   (MCP-based) developer search (Exa + Tavily) has won this segment.

3. **Tavily's security layer for agents**: Tavily's security pipeline (blocking
   PII leakage, prompt injection, malicious sources) is notable for a
   `/website-analysis` skill that might crawl untrusted sites. If the skill uses
   Tavily as the extraction layer, the security hardening comes for free.

4. **The 317% multimodal citation bonus in Google AIO**: Pages with full
   multimodal + schema integration get 317% more citations. This is directly
   relevant to any `/website-analysis` Creator View output — if the skill
   detects that a site lacks structured data or multimodal content, it can flag
   this as a concrete actionable gap, not just an observation.

5. **Content structure as AI-readiness signal**: Multiple sources converge on a
   novel insight: content structure is now AI readability infrastructure. "AI
   systems don't just scan for keywords; they look for clear meaning, consistent
   context, and clean formatting. Ambiguity is a significant problem." This
   suggests `/website-analysis` could include an "AI readability score" for any
   analyzed site — a new metric that none of the existing tools surface
   directly.

---

## Confidence Assessment

- HIGH claims: 12 (core tool methodologies, integration paths, MCP availability,
  Pro vs. standard, citation formats)
- MEDIUM claims: 6 (You.com internal orchestration, Google follow-up question
  mechanism, Exa find similar internals, comparative scores)
- LOW claims: 1 (Perplexity related-questions generation mechanism — inferred)
- UNVERIFIED claims: 0
- Overall confidence: **HIGH** — all major tool methodologies are covered by
  official documentation or high-quality technical analysis with multiple
  corroborating sources

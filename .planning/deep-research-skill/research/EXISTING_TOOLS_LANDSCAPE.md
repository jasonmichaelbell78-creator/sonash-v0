# Existing Tools Landscape for Deep Research

**Document Version:** 1.0 **Last Updated:** 2026-03-20 **Status:** RESEARCH
COMPLETE

---

## Executive Summary

The deep-research tool ecosystem in 2026 is mature and fragmented. The key
insight is that **no single tool covers the full research pipeline** (search,
extract, verify, synthesize), but excellent composable pieces exist. The most
impactful integration path for a Claude Code skill is:

1. **Tavily MCP** (search + extract in one call, LLM-optimized output,
   $0.008/req)
2. **Firecrawl MCP** (deep content extraction, crawling, structured data)
3. **Brave Search MCP** (independent index, privacy-first, cheap at $3/1K)
4. **Paper Search MCP** (academic: arXiv, PubMed, Semantic Scholar, CrossRef,
   OpenAlex)
5. **Jina AI Grounding** (fact-checking with real-time web verification)

Claude Code already has **WebSearch** and **WebFetch** built-in, plus MCP
infrastructure in `.mcp.json`. The skill should orchestrate these existing
primitives via a multi-agent pattern rather than building new search/scrape
tooling from scratch.

---

## 1. MCP Servers for Research

MCP (Model Context Protocol) is the preferred integration pattern for Claude
Code. The ecosystem now includes hundreds of servers. Research-relevant ones:

### 1.1 Web Search MCP Servers

| Server               | Package / Repo                                    | What It Does                                                            | Maturity   | Free Tier                |
| -------------------- | ------------------------------------------------- | ----------------------------------------------------------------------- | ---------- | ------------------------ |
| **Tavily MCP**       | `tavily-mcp` (npm)                                | Search + extract in single call, LLM-optimized                          | Production | 1,000 searches/mo        |
| **Brave Search MCP** | `@modelcontextprotocol/server-brave-search` (npm) | Web search via Brave's independent 35B-page index                       | Production | None (metered, $3/1K)    |
| **Exa MCP**          | Community servers on npm                          | Neural/semantic search, sub-200ms "Exa Instant"                         | Production | Limited free tier        |
| **MCP Omnisearch**   | `mcp-omnisearch` (GitHub)                         | Unified access to Tavily, Brave, Kagi, Exa, Perplexity, Jina, Firecrawl | Beta       | Depends on provider keys |
| **Perplexity MCP**   | Community servers                                 | Connects to Sonar API for research-grade search                         | Beta       | No (API costs)           |
| **You.com MCP**      | Official MCP launch Oct 2025                      | Web search + news + deep research endpoints                             | Production | Limited                  |

### 1.2 Academic/Research MCP Servers

| Server                         | Repo                                | Sources Covered                                                                                                                              | Maturity   |
| ------------------------------ | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| **Paper Search MCP**           | `openags/paper-search-mcp`          | arXiv, PubMed, bioRxiv, medRxiv, Semantic Scholar, CrossRef, OpenAlex, PMC, CORE, Europe PMC, DBLP, DOAJ, BASE, Zenodo, HAL, SSRN, Unpaywall | Production |
| **Paper Search MCP (Node.js)** | `dianel555/paper-search-mcp-nodejs` | arXiv, Web of Science, PubMed, Google Scholar + 4 more                                                                                       | Beta       |
| **Academix**                   | `xingyulu23/Academix`               | OpenAlex, DBLP, Semantic Scholar, arXiv, CrossRef                                                                                            | Beta       |
| **Semantic Scholar MCP**       | Multiple implementations            | Semantic Scholar API (200M papers)                                                                                                           | Production |

### 1.3 Content Extraction MCP Servers

| Server                      | Package                              | What It Does                                   | Maturity   |
| --------------------------- | ------------------------------------ | ---------------------------------------------- | ---------- |
| **Firecrawl MCP**           | `firecrawl-mcp-server` (npm)         | Scrape, crawl, map, extract structured data    | Production |
| **Fetch (Official)**        | `@modelcontextprotocol/server-fetch` | Web content fetching + conversion for LLM      | Production |
| **Mozilla Readability MCP** | Community servers                    | Clean article extraction via Readability       | Beta       |
| **Jina Reader MCP**         | Community servers                    | URL-to-markdown, image captioning, PDF support | Beta       |

### 1.4 Knowledge Base MCP Servers

| Server                  | Repo                       | What It Does                                          | Maturity   |
| ----------------------- | -------------------------- | ----------------------------------------------------- | ---------- |
| **Wikidata MCP**        | `zzaebok/mcp-wikidata`     | Query Wikidata entities, hybrid vector+keyword search | Beta       |
| **Wikipedia MCP**       | `Rudra-ravi/wikipedia-mcp` | Retrieve Wikipedia articles for LLM context           | Beta       |
| **Apify Wikipedia MCP** | Apify platform             | Structured Wikipedia data extraction                  | Production |

### 1.5 Deep Research MCP Servers

| Server                            | Repo                                       | Architecture                                                            | Maturity     |
| --------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------- | ------------ |
| **Claude Deep Research**          | `mcherukara/Claude-Deep-Research`          | DuckDuckGo + Semantic Scholar, multi-phase research pipeline            | Beta         |
| **MCP Server Deep Research**      | `reading-plus-ai/mcp-server-deep-research` | Question elaboration, sub-question generation, search, analysis, report | Beta         |
| **Deep Research MCP (Ozamatash)** | `Ozamatash/deep-research-mcp`              | Iterative research combining search engines + web scraping + AI         | Beta         |
| **Octagon Deep Research**         | `OctagonAI/octagon-deep-research-mcp`      | Commercial, no rate limits, multi-agent                                 | Production   |
| **Deep Research MCP (Gemini)**    | `ssdeanx/deep-research-mcp-server`         | Uses Gemini 2.5 Flash with Google Search Grounding                      | Experimental |

---

## 2. Search APIs and Services

### Comparison Table

| API                  | Price per 1K Requests                   | Index Source                   | LLM-Optimized Output       | Key Differentiator                               |
| -------------------- | --------------------------------------- | ------------------------------ | -------------------------- | ------------------------------------------------ |
| **Tavily**           | $8 (basic), $16 (advanced)              | Proprietary crawl              | Yes (markdown, chunked)    | Built for RAG/agents; search+extract in 1 call   |
| **Brave Search**     | $3 (base), $5 (Pro)                     | Independent 35B-page index     | Partial (LLM Context API)  | Zero data retention; independent from Google     |
| **Exa**              | $5-7 per 1K                             | Neural embedding index         | Yes (markdown, highlights) | Semantic/meaning-based search; sub-200ms Instant |
| **Serper**           | $0.30-2.00                              | Google SERP scraping           | No (JSON link lists)       | Cheapest; Google-exact results                   |
| **SerpAPI**          | ~$15                                    | Multi-engine scraping          | No (raw SERP data)         | Broadest engine coverage; SEO-focused            |
| **You.com**          | $6.25                                   | Proprietary + live crawl       | Yes (snippets, citations)  | 93% SimpleQA accuracy; Deep Research endpoint    |
| **Perplexity Sonar** | $1-3 input, $1-15 output (per M tokens) | Web-wide with real-time search | Yes (citations built in)   | Deep Research model for multi-step synthesis     |

### Detailed Analysis

**Tavily** is the strongest default choice for an LLM research agent. It returns
clean, structured content optimized for RAG pipelines. The search+extract
single-call pattern eliminates the need for separate scraping. Security layers
block PII leakage and prompt injection. 1,000 free searches/month is generous
for development. Official MCP server available (`tavily-mcp` on npm).

**Brave Search** is the best complement to Tavily. Its independent index means
different source coverage, which is critical for cross-source verification. The
LLM Context API returns AI-ready summaries. Privacy-first design with zero data
retention. MCP server is official (`@modelcontextprotocol/server-brave-search`).

**Exa** excels at semantic/meaning-based search rather than keyword matching.
"Exa Instant" delivers sub-200ms results for real-time agent workflows. Best for
finding conceptually similar content rather than exact keyword matches. The
Websets product adds structured entity extraction.

**Perplexity Sonar** is unique because it is itself a research agent--Sonar Deep
Research autonomously searches, reads, and evaluates sources through multi-step
retrieval. Best used as a "second opinion" verification layer rather than
primary search. Pricing is token-based rather than per-request.

**Serper** is the budget option when you specifically need Google SERP results.
At $0.30/1K it is 10-25x cheaper than alternatives but returns raw link lists
requiring separate content extraction.

---

## 3. Academic/Scientific Research Tools

### Comparison Table

| API                           | Coverage                       | Rate Limits                           | Auth Required                         | Output Quality                                     |
| ----------------------------- | ------------------------------ | ------------------------------------- | ------------------------------------- | -------------------------------------------------- |
| **Semantic Scholar**          | 200M papers, all disciplines   | 100 req/5 min (free), higher with key | Optional (free key for higher limits) | Excellent: abstracts, citations, authors, TLDR     |
| **OpenAlex**                  | 250M+ works, open metadata     | 100K calls/day                        | No                                    | Good: works, authors, institutions, concepts       |
| **CrossRef**                  | 150M+ DOIs, bibliographic data | Polite pool (contact info)            | No                                    | Good: metadata, funding, licenses, full-text links |
| **arXiv API**                 | 2.4M+ preprints                | Generous                              | No                                    | Basic: metadata in Atom format                     |
| **PubMed (NCBI E-utilities)** | 36M+ biomedical citations      | 3 req/sec (10 with key)               | Optional                              | Good: XML/JSON, MeSH terms, abstracts              |
| **Google Scholar**            | Broadest coverage              | **No official API**                   | N/A                                   | N/A (scraping required, TOS violation)             |
| **Elicit**                    | 138M+ papers                   | API available (paid plans)            | Yes                                   | Excellent: extraction, tables, synthesis           |
| **Consensus**                 | 200M+ (via Semantic Scholar)   | API available (paid plans)            | Yes                                   | Excellent: scientific finding extraction           |

### Detailed Analysis

**Semantic Scholar** is the single best free academic API. It covers all
disciplines, provides TLDR summaries generated by AI, rich citation graph data,
and author profiles. The free tier is adequate for development (100 req/5 min).
Multiple MCP server implementations exist. Recommended as primary academic
search.

**OpenAlex** is the best metadata aggregator. It unifies Microsoft Academic
Graph, CrossRef, ORCID, and Unpaywall into a single open API. 100K calls/day
with no auth is extremely generous. Best for systematic literature mapping and
citation analysis.

**CrossRef** is essential for DOI resolution and citation metadata. No auth
required, no usage limits (just include contact info for polite pool). Best used
as a metadata enrichment layer rather than primary search.

**arXiv API** is free with no auth but returns Atom XML, which needs parsing.
Best for accessing preprints in physics, math, CS, and related fields.

**Elicit** and **Consensus** are premium services that provide AI-powered
extraction and synthesis. Elicit can generate structured tables from papers and
summarize across studies. Consensus specifically extracts scientific findings
and highlights agreement/disagreement across studies. Both require paid plans
for API access but offer capabilities that would be extremely expensive to
build.

**Google Scholar** has no official API. All access requires scraping, which
violates TOS. Third-party services (Apify, SerpAPI) offer Google Scholar
scraping but at cost and legal risk. Not recommended for production use.

---

## 4. Web Content Extraction

### Comparison Table

| Tool                    | Type                    | Output Format                          | JS Rendering       | Pricing                        | MCP Server |
| ----------------------- | ----------------------- | -------------------------------------- | ------------------ | ------------------------------ | ---------- |
| **Firecrawl**           | Cloud API               | Markdown, structured JSON              | Yes                | 500 free credits, then $16+/mo | Official   |
| **Jina Reader**         | Cloud API               | Markdown (prepend `r.jina.ai/` to URL) | Yes                | Free tier + paid               | Community  |
| **Crawl4AI**            | Open-source (Python)    | Markdown                               | Yes (Playwright)   | Free (self-hosted)             | Community  |
| **ScrapeGraphAI**       | Open-source (Python)    | Structured data via NL prompts         | Yes                | Free (self-hosted)             | No         |
| **Mozilla Readability** | Open-source (JS)        | Clean HTML/text                        | No (static only)   | Free                           | Community  |
| **Playwright**          | Open-source (JS/Python) | Raw HTML/DOM                           | Yes (full browser) | Free                           | Official   |
| **Puppeteer**           | Open-source (JS)        | Raw HTML/DOM                           | Yes (Chrome)       | Free                           | Official   |
| **Trafilatura**         | Open-source (Python)    | Text, XML, JSON                        | No (static only)   | Free                           | No         |

### Detailed Analysis

**Firecrawl** is the strongest option for a Claude Code integration. It returns
LLM-optimized markdown, handles JavaScript rendering, removes boilerplate/ads,
and has an official MCP server. The `firecrawl_extract` tool can extract
structured data using a JSON schema without writing scraping rules. The map tool
discovers all URLs on a site before scraping.

**Jina Reader** is the simplest to use--just prepend `r.jina.ai/` to any URL.
Zero setup, no SDK required. Good for quick content extraction. The Grounding
API adds fact-checking capabilities (see Section 6).

**Crawl4AI** (58K+ GitHub stars) is the strongest open-source option. It is
Python-native with Playwright-based JS rendering, producing LLM-ready markdown.
Best for self-hosted deployments where you need to control costs at scale.

**Mozilla Readability** is proven for article extraction (powers Firefox Reader
View). The `@mozilla/readability` npm package runs in Node.js. Does not handle
JS-rendered content--must be paired with Playwright/Puppeteer for dynamic pages.
Benchmarks show 78% noise reduction.

**Playwright** (`@playwright/mcp@latest`) is already listed in this codebase's
`.mcp.json.example`. It provides full browser automation for extracting content
from JavaScript-heavy pages. Best used as a foundation layer under
Readability/custom extraction rather than direct LLM content source.

---

## 5. Research Agent Frameworks

### Comparison Table

| Framework                       | Language              | Architecture                                     | Best For                             | GitHub Stars    |
| ------------------------------- | --------------------- | ------------------------------------------------ | ------------------------------------ | --------------- |
| **LangGraph** (LangChain)       | Python/JS             | Stateful graphs (nodes + edges)                  | Production multi-step pipelines      | 35K+            |
| **CrewAI**                      | Python                | Role-based agents (researcher, writer, reviewer) | Rapid prototyping, team metaphor     | 25K+            |
| **AutoGen** (Microsoft)         | Python                | Multi-agent conversation patterns                | Conversational multi-agent scenarios | 40K+            |
| **Claude Agent SDK**            | Python/JS             | Hierarchical orchestrator + subagents            | Claude-native production agents      | N/A (Anthropic) |
| **Semantic Kernel** (Microsoft) | C#/Python/Java        | Plugin-based AI orchestration                    | Enterprise .NET integration          | 27K+            |
| **LlamaIndex**                  | Python/JS             | Data ingestion + RAG + agents                    | Document analysis, knowledge bases   | 40K+            |
| **GPT Researcher**              | Python (+ npm client) | Planner + execution agents + publisher           | Autonomous research reports          | 20K+            |

### Detailed Analysis

**Claude Agent SDK** is the most relevant framework since this codebase runs on
Claude Code. The SDK (formerly "Claude Code SDK") supports hierarchical
multi-agent workflows where a primary agent delegates to specialized subagents.
Key patterns for deep research:

- Orchestrator-worker architecture with parallel subagents
- Recursive spawning via `--allowedTools "Bash(claude:*)"` flag
- Extended thinking + tool use enables genuine multi-step claim verification
- Token cost: $1-5 per deep research query; 30-90+ seconds execution time

**GPT Researcher** is the most mature open-source deep research agent. It
outperformed Perplexity, OpenAI, and others in Carnegie Mellon's DeepResearchGym
benchmark (May 2025). Available as npm package (`gpt-researcher`). Architecture:
planner generates questions, execution agents gather info, publisher aggregates
into cited reports. Apache 2.0 license.

**LangGraph** is the production standard for multi-step agent pipelines.
Stateful graph model makes agent behavior explicit and debuggable. Most
token-efficient across benchmarks. Has strong TypeScript/JavaScript support.

**LlamaIndex** excels at the "data ingestion + retrieval" layer. Unmatched depth
for agents that need to act over documents. Best used as a complementary layer
for indexing and retrieval alongside an orchestration framework.

### Open-Source Deep Research Implementations

| Project                                                              | Approach                                   | LLM Support                                | License     |
| -------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------ | ----------- |
| **GPT Researcher** (`gptr.dev`)                                      | Planner + execution agents                 | Any LLM provider                           | Apache 2.0  |
| **Open Deep Research** (`btahir/open-deep-research`)                 | AI-powered reports from web search         | Google, OpenAI, Anthropic, DeepSeek, local | Open source |
| **Auto-Deep-Research** (`HKUDS/Auto-Deep-Research`)                  | AutoAgent framework, recursive exploration | Multiple providers                         | Open source |
| **LangChain Open Deep Research** (`langchain-ai/open_deep_research`) | LangGraph-based research workflow          | Multiple providers                         | Open source |

---

## 6. Fact-Checking and Verification Tools

### Comparison Table

| Tool                            | Type                    | Approach                                          | API Available       | Cost         |
| ------------------------------- | ----------------------- | ------------------------------------------------- | ------------------- | ------------ |
| **Jina AI Grounding**           | Cloud API               | Real-time web search + factuality scoring         | Yes                 | Free tier    |
| **Google Fact Check API**       | Cloud API               | Search existing fact-checks from journalists      | Yes                 | Free         |
| **OpenFactCheck**               | Open-source (Python)    | LLM factuality evaluation framework               | Yes (library + web) | Free         |
| **OpenFactVerification (Loki)** | Open-source (Python)    | Full pipeline: claim detection, evidence, verdict | Yes                 | Free         |
| **ClaimBuster**                 | Cloud API + open-source | ML claim detection, check-worthiness scoring      | Yes                 | Free API key |
| **WikiCheck**                   | Open-source             | Wikipedia-based automated fact checking           | Yes                 | Free         |

### Detailed Analysis

**Jina AI Grounding API** is the most practical for integration. It takes a
statement, grounds it against real-time web search, and returns a factuality
score with exact references. Already part of the MCP Omnisearch ecosystem.

**Google Fact Check API** searches existing fact-checks published by journalists
and organizations. It does not perform new fact-checking--it finds whether a
claim has already been checked. Useful as a first-pass filter.

**OpenFactCheck** and **Loki (OpenFactVerification)** are the most comprehensive
open-source options. OpenFactCheck provides a customizable pipeline: claim
decomposition, evidence retrieval, verdict generation. Loki provides end-to-end:
long text dissection, claim worthiness assessment, query generation, evidence
crawling, and verification.

**ClaimBuster** specializes in detecting which claims are worth checking. Best
used as a pre-filter before running expensive verification workflows.

---

## 7. Already Available in This Codebase

### Native Claude Code Tools

- **WebSearch**: Built-in web search tool (available in this session)
- **WebFetch**: Built-in URL content fetching with AI-processed extraction

### Configured MCP Servers (`.mcp.json`)

- **Memory** (`@modelcontextprotocol/server-memory`): Knowledge graph
  persistence
- **SonarCloud**: Code quality analysis (custom server)

### Available in `.mcp.json.example` (Not Yet Active)

- **Puppeteer** (`@modelcontextprotocol/server-puppeteer`): Browser automation
- **Playwright** (`@playwright/mcp@latest`): Browser testing/automation
- **GitHub** (`@modelcontextprotocol/server-github`): GitHub API access
- **Filesystem** (`@modelcontextprotocol/server-filesystem`): File access
- **Firebase**: Firebase CLI MCP
- **Context7** (`@context7/mcp@latest`): Context management

### Enabled Plugins (`.claude/settings.json`)

- `episodic-memory@superpowers-marketplace`: Memory capabilities
- `superpowers@claude-plugins-official`: Enhanced tool access
- `superpowers-chrome@superpowers-marketplace`: Chrome integration

### Relevant npm Dependencies Already Installed

- `gray-matter`: Markdown frontmatter parsing (devDependency)
- `remark-parse` / `remark-stringify` / `unified`: Markdown processing pipeline
- `playwright` (`@playwright/test`): Browser automation (devDependency)
- `msw`: Mock Service Worker for API mocking in tests

### Infrastructure Already Built

- Multi-agent orchestration patterns (`.claude/settings.json` agent teams env)
- Skill system with `SKILL.md` definitions and script runners
- Hook system for pre/post tool-use validation
- Session management with context preservation across compaction

---

## 8. Integration Priority Matrix

| Tool                              | Value     | Effort    | Priority          | Rationale                                           |
| --------------------------------- | --------- | --------- | ----------------- | --------------------------------------------------- |
| **WebSearch + WebFetch (native)** | High      | None      | P0 - Use now      | Already available, zero cost, zero setup            |
| **Tavily MCP**                    | Very High | Low       | P1 - Add first    | Best LLM-optimized search, official MCP, $0.008/req |
| **Brave Search MCP**              | High      | Low       | P1 - Add first    | Independent index for cross-source verification     |
| **Firecrawl MCP**                 | High      | Low       | P1 - Add first    | Deep extraction, crawling, structured data          |
| **Paper Search MCP**              | High      | Medium    | P2 - Academic use | Covers 20+ academic sources in one server           |
| **Jina AI Grounding**             | High      | Low       | P2 - Verification | Fact-checking with factuality scores                |
| **Semantic Scholar API**          | Medium    | Low       | P2 - Academic use | Free, no MCP needed (direct HTTP)                   |
| **OpenAlex API**                  | Medium    | Low       | P3 - Enhancement  | Free metadata aggregator, 100K calls/day            |
| **MCP Omnisearch**                | Medium    | Medium    | P3 - Unification  | Single server for all search providers              |
| **Perplexity Sonar**              | High      | Medium    | P3 - Enhancement  | Deep Research model for verification layer          |
| **Exa Search**                    | Medium    | Low       | P3 - Enhancement  | Neural search for semantic similarity               |
| **GPT Researcher (npm)**          | Medium    | High      | P4 - Evaluate     | Mature research agent, but heavy dependency         |
| **OpenFactCheck**                 | Medium    | High      | P4 - Evaluate     | Python-only, would need wrapper                     |
| **Crawl4AI**                      | Medium    | High      | P4 - Evaluate     | Python-only, self-hosted, high maintenance          |
| **Google Fact Check API**         | Low       | Low       | P4 - Nice to have | Limited: only searches existing fact-checks         |
| **ClaimBuster**                   | Low       | Medium    | P5 - Skip for now | Niche: claim worthiness detection                   |
| **ScrapeGraphAI**                 | Low       | High      | P5 - Skip         | Python-only, overlaps with Firecrawl                |
| **LangGraph/CrewAI**              | Low       | Very High | P5 - Skip         | Wrong framework; we use Claude Agent SDK            |

---

## 9. Recommendations

### What to Integrate First (P0-P1)

1. **Use WebSearch + WebFetch immediately.** They are already available in every
   Claude Code session with zero configuration. The deep-research skill should
   use these as the baseline search layer.

2. **Add Tavily MCP to `.mcp.json`.** Single-call search+extract, LLM-optimized
   output, strong free tier. Configuration is one JSON block + API key.

3. **Add Brave Search MCP to `.mcp.json`.** Independent index provides source
   diversity essential for cross-verification. Already in the official MCP
   servers repo.

4. **Add Firecrawl MCP to `.mcp.json`.** When WebFetch is insufficient (JS-heavy
   pages, multi-page crawling, structured extraction), Firecrawl fills the gap.

### What to Build (the Skill Itself)

The skill should be an **orchestration layer**, not a search/scrape engine:

- **Query decomposition**: Break complex questions into sub-questions
- **Parallel search dispatch**: Send sub-questions to multiple search providers
- **Content extraction**: Use Firecrawl/WebFetch to get full page content
- **Cross-source verification**: Compare claims across 3+ independent sources
- **Confidence scoring**: Rate findings by source agreement and quality
- **Citation management**: Track all sources, generate proper citations
- **Progressive reporting**: Stream findings as they arrive rather than batch

### What to Skip

- **LangGraph/CrewAI/AutoGen**: Wrong ecosystem. Claude Agent SDK's subagent
  pattern already provides multi-agent orchestration natively.
- **Python-only tools** (Crawl4AI, ScrapeGraphAI, OpenFactCheck): Would require
  a Python runtime alongside the Node.js stack. Use JavaScript/MCP equivalents.
- **Google Scholar scraping**: Legal risk, unreliable, TOS violation.
- **Building custom search**: Multiple excellent APIs exist. Do not reinvent.

### Architecture Pattern

The three-approach model from the Claude deep research community suggests:

1. **Start DIY** with WebSearch + WebFetch + recursive Claude spawning
2. **Add MCP servers** (Tavily, Brave, Firecrawl) for production reliability
3. **Graduate to multi-agent** when domain-specific verification is needed

The recommended pipeline for this skill:

```
Question --> Decompose --> Parallel Search (Tavily + Brave + WebSearch)
                              |
                              v
                     Extract Content (Firecrawl/WebFetch)
                              |
                              v
                     Cross-Verify Claims (3+ sources)
                              |
                              v
                     Score Confidence + Cite Sources
                              |
                              v
                     Synthesize Report
```

---

## Sources

### MCP Servers and Protocol

- [Model Context Protocol Servers (GitHub)](https://github.com/modelcontextprotocol/servers)
- [MCP Omnisearch](https://github.com/spences10/mcp-omnisearch)
- [Paper Search MCP](https://github.com/openags/paper-search-mcp)
- [Semantic Scholar MCP Server](https://www.pulsemcp.com/servers/benhaotang-semantic-scholar)
- [Claude Deep Research MCP](https://github.com/mcherukara/Claude-Deep-Research)
- [Octagon Deep Research MCP](https://github.com/OctagonAI/octagon-deep-research-mcp)
- [MCP Server Deep Research](https://github.com/reading-plus-ai/mcp-server-deep-research)
- [Wikidata MCP](https://github.com/zzaebok/mcp-wikidata)

### Search APIs

- [Tavily](https://www.tavily.com/) |
  [Tavily Docs](https://docs.tavily.com/documentation/about)
- [Brave Search API](https://brave.com/search/api/)
- [Exa AI](https://exa.ai/) | [Exa Pricing](https://exa.ai/pricing)
- [SerpAPI Alternatives Comparison](https://serpapi.com/blog/serpapi-alternatives-best-web-search-apis/)
- [Best Web Search APIs 2026 (Firecrawl)](https://www.firecrawl.dev/blog/best-web-search-apis)
- [You.com APIs](https://you.com/apis)
- [Perplexity Sonar Deep Research](https://docs.perplexity.ai/getting-started/models/models/sonar-deep-research)

### Academic Research

- [Semantic Scholar](https://www.semanticscholar.org/)
- [OpenAlex](https://openalex.org/)
- [CrossRef API](https://libguides.ucalgary.ca/c.php?g=732144&p=5260795)
- [arXiv API](https://info.arxiv.org/help/api/index.html)
- [Elicit](https://elicit.com/) |
  [Elicit API Guide](https://agentsapis.com/elicit-api/)
- [Academix MCP](https://github.com/xingyulu23/Academix)

### Web Content Extraction

- [Firecrawl](https://www.firecrawl.dev/) |
  [Firecrawl MCP](https://github.com/firecrawl/firecrawl-mcp-server)
- [Jina AI vs Firecrawl Comparison](https://blog.apify.com/jina-ai-vs-firecrawl/)
- [Crawl4AI](https://github.com/unclecode/crawl4ai)
- [Mozilla Readability MCP](https://www.pulsemcp.com/servers/emzimmer-mozilla-readability-parser)

### Agent Frameworks

- [AI Agent Frameworks Compared 2026](https://arsum.com/blog/posts/ai-agent-frameworks/)
- [Three Ways to Build Deep Research with Claude](https://paddo.dev/blog/three-ways-deep-research-claude/)
- [Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk)
- [GPT Researcher](https://gptr.dev/) |
  [GPT Researcher npm](https://www.npmjs.com/package/gpt-researcher)
- [LangChain Open Deep Research](https://github.com/langchain-ai/open_deep_research)

### Fact-Checking

- [Google Fact Check Tools API](https://developers.google.com/fact-check/tools/api)
- [ClaimBuster](https://idir.uta.edu/claimbuster/)
- [OpenFactCheck](https://openfactcheck.com/)
- [OpenFactVerification (Loki)](https://github.com/Libr-AI/OpenFactVerification)
- [Jina AI Grounding API](https://jina.ai/news/fact-checking-with-new-grounding-api-in-jina-reader/)

### Deep Research Implementations

- [Auto-Deep-Research](https://github.com/HKUDS/Auto-Deep-Research)
- [Open Deep Research](https://github.com/btahir/open-deep-research)
- [Deep Research MCP (Ozamatash)](https://github.com/Ozamatash/deep-research-mcp)

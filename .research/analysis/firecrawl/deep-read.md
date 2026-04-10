# Firecrawl — Deep Read

**Source:** mendableai/firecrawl · **Analyzed:** 2026-04-10 · **Session:** #273

Per repo-analysis SKILL.md Phase 2b. The knowledge that isn't in the source
tree: documentation, examples, SDK docs, OpenAPI specs, self-hosting guide.

## Artifacts discovered

### Top-level docs (read)

| File            | Size      | What's in it                                                                                  |
| --------------- | --------- | --------------------------------------------------------------------------------------------- |
| CLAUDE.md       | 19 lines  | AI agent instructions: test-first, E2E preferred, env-gated capability, harness mandatory     |
| README.md       | ~20KB     | Feature matrix, 7-SDK showcase, Search/Scrape/Crawl/Map/Interact/Agent taxonomy, quick-starts |
| SELF_HOST.md    | 227 lines | Docker self-host guide, .env template, fire-engine limitations, proxy/SearXNG config          |
| CONTRIBUTING.md | ~4KB      | Contributor workflow (not read in detail)                                                     |

### Architecture docs (read)

| File                                       | Purpose                                                      |
| ------------------------------------------ | ------------------------------------------------------------ |
| `apps/api/src/scraper/scrapeURL/README.md` | Mermaid signal-flow diagram + "differences from predecessor" |

**Only one architecture doc exists in prose.** The rest of the architecture
lives in code layout and CLAUDE.md's operational hints.

### OpenAPI specs (cataloged, not read in detail)

- `openapi.json` — current v2 spec
- `v1-openapi.json` — v1 frozen spec
- `openapi-v0.json` — v0 frozen spec

These are the wire contracts the 7 SDKs rely on. Worth fetching the v2 spec and
comparing the endpoint taxonomy (Search/Scrape/Crawl/Map/Extract/Interact)
against SoNash's Cloud Functions surface if there's ever a "scrape this for me"
feature.

### Per-sub-app READMEs (cataloged)

- `apps/elixir-sdk/README.md` — Elixir SDK install + basic scrape
- `apps/java-sdk/README.md` — Java SDK install + basic scrape
- `apps/python-sdk/README.md` — Python SDK install + basic scrape
- `apps/rust-sdk/README.md` — Rust SDK install + basic scrape
- `apps/playwright-service-ts/README.md` — Playwright rendering service
- `apps/redis/README.md` — Redis config notes
- `apps/test-site/README.md` — Reference scrape target
- `apps/test-suite/README.md` — Load test harness

All 8 sub-app READMEs exist. Cross-SDK parity is maintained through the OpenAPI
specs, not a shared package.

### Examples — 58 apps (cataloged, 2 read)

The `examples/` directory is firecrawl's most under-valued artifact. Each
subdirectory is a self-contained example app pairing firecrawl with a specific
LLM or agent framework. Full list (58):

**LLM-specific crawlers/extractors (39):**

- claude: `claude_stock_analyzer`, `claude-3.7-stock-analyzer`,
  `claude3.7-web-crawler`, `claude3.7-web-extractor`,
  `simple_web_data_extraction_with_claude`, `sonnet_web_crawler`,
  `haiku_web_crawler`
- openai: `gpt-4.1-company-researcher`, `gpt-4.1-web-crawler`,
  `gpt-4.5-web-crawler`, `o1_job_recommender`, `o1_web_crawler`,
  `o1_web_extractor`, `o3-mini_company_researcher`, `o3-mini_web_crawler`,
  `o3-mini-deal-finder`, `o3-web-crawler`, `o4-mini-web-crawler`,
  `openai-realtime-firecrawl`, `openai_swarm_firecrawl`,
  `openai_swarm_firecrawl_web_extractor`
- gemini: `gemini-2.0-crawler`, `gemini-2.0-web-extractor`,
  `gemini-2.5-crawler`, `gemini-2.5-screenshot-editor`,
  `gemini-2.5-web-extractor`, `gemini-github-analyzer`,
  `website_qa_with_gemini_caching`
- other: `deepseek-v3-company-researcher`, `deepseek-v3-crawler`,
  `llama-4-maverick-web-crawler`, `llama-4-maverick-web-extractor`,
  `mistral-small-3.1-crawler`, `mistral-small-3.1-extractor`,
  `grok_web_crawler`, `groq_web_crawler`, `R1_company_researcher`,
  `R1_web_crawler`, `web_data_rag_with_llama3`

**Domain-specific applications (15):**

- `aginews-ai-newsletter`, `ai-podcast-generator`,
  `deep-research-apartment-finder`, `hacker_news_scraper`,
  `job-resource-analyzer`, `crm_lead_enrichment`, `sales_web_crawler`,
  `contradiction_testing`, `scrape_and_analyze_airbnb_data_e2b`,
  `find_internal_link_opportunites`, `internal_link_assistant`, `blog-articles`,
  `turning_docs_into_api_specs`, `visualize_website_topics_e2b`,
  `full_example_apps`

**SDK snippets (2):**

- `attributes-extraction-js-sdk.js`
- `attributes-extraction-python-sdk.py`

**Infrastructure/deployment (2):**

- `kubernetes/` — K8s deployment example
- `web_data_extraction/` — plain data-extraction example

Read: `deep-research-apartment-finder/README.md` (Python + Firecrawl Deep
Research + Claude 3.7), `gemini-2.5-crawler/README.md` (catalog only).

**The pattern:** each example is ~50-150 lines of code + a README that explains
the LLM integration pattern. This is the closest thing firecrawl has to a
cookbook — it IS the cookbook.

## What this Deep Read changes

1. **The creator-lens from Session #272's quick scan is confirmed.** The
   interesting thing in firecrawl isn't the code — it's the taxonomy
   (Search/Scrape/Crawl/Map/Interact/Agent) plus the harness of 58 examples
   showing the taxonomy being used with every major LLM.

2. **There's no architecture doc.** One mermaid diagram for the scrapeURL engine
   fallback chain. Everything else (queues, auth, versioning, services layout)
   has to be inferred from code + CLAUDE.md hints. This is a negative signal for
   long-term maintainability but a positive signal for "fast-moving startup that
   ships" culture.

3. **The SELF_HOST.md is the operator's manual.** It documents the self-hosted
   vs hosted split explicitly (fire-engine is hosted-only, limited CAPTCHA
   handling, manual .env config). This is the right pattern for a commercial-OSS
   split.

4. **CLAUDE.md's 19 lines are more actionable than most 200-line CLAUDE.mds.**
   Worth a direct comparison against SoNash's 235-line CLAUDE.md — what's the
   signal density of each?

5. **The `examples/` directory has 58 entries, not 15.** Session #272's Quick
   Scan undercounted by 74%. Coverage audit should flag any examples whose
   README claims a specific LLM/framework pattern that would be worth extracting
   as a knowledge candidate.

## Feed-forward to Phase 4b / Phase 4

Content Evaluation (4b) should:

- **Score the 58 example apps** for direct relevance to SoNash's stack. Most
  high-signal: the Claude integrations (matches SoNash's AI-directed workflow),
  the "full_example_apps" umbrella, and the LLM-agnostic patterns (`kubernetes/`
  for deploy, `openai_swarm_firecrawl*` for multi-agent).
- **Evaluate the OpenAPI specs** against SoNash's own httpsCallable contract —
  is there a pattern worth extracting?
- **Flag the absent docs/ directory** as a coverage-audit item (architecture
  knowledge is undocumented).

Creator View (4) should reference:

- **scrapeURL engine-fallback pattern** as a transferable architecture idea
- **Test gating by runtime capability** (CLAUDE.md lines 11-13) as the most
  directly-applicable pattern
- **58-example `examples/` cookbook** as a product-marketing-in-code idea
- **No docs/ directory** as an anti-pattern for SoNash to avoid

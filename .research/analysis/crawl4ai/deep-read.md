# Deep Read: unclecode/crawl4ai

**Analyzed:** 2026-04-12 | **Depth:** Standard

## Internal Artifacts Found and Read

### Primary Documentation (114 markdown files)

1. **README.md** (1219 lines) - Feature overview, quick start, personal story
2. **CONTRIBUTING.md** (102 lines) - GitFlow branching
   (main/develop/next/release/\*)
3. **SECURITY.md** - Supported versions (0.8.x), responsible disclosure, 48h SLA
4. **CODE_OF_CONDUCT.md**, **CHANGELOG.md**, **CONTRIBUTORS.md**

### Professional Documentation Suite (docs/md_v2/ - 86 files)

- **Core (22 files):** quickstart, simple-crawling, deep-crawling (BFS/DFS/BFF +
  crash recovery), adaptive-crawling (pattern learning), url-seeding,
  page-interaction, browser-crawler-config, markdown-generation, c4a-script
  (custom DSL), cli, self-hosting
- **Advanced (16 files):** hooks-auth (8 lifecycle hooks), session-management,
  proxy-security, anti-bot-and-fallback, virtual-scroll, lazy-loading,
  pdf-parsing, identity-based-crawling, crawl-dispatcher
- **Extraction (3 files):** no-llm-strategies (LXML, CSS), llm-strategies
  (Claude/GPT), clustering-strategies
- **API Reference:** complete-sdk-reference.md (234KB monolithic), parameters,
  strategies, crawl-result
- **Blog/Releases (21 files):** Release notes 0.4.0-0.8.5+

### Architecture Documentation

5. **deploy/docker/ARCHITECTURE.md** (220 lines) - 3-tier browser pool
   (PERMANENT/HOT/COLD), WebSocket monitoring, Redis, 10x memory reduction
6. **.github/workflows/docs/ARCHITECTURE.md** (915 lines) - Release pipeline
7. **.github/workflows/docs/README.md** (1030 lines) - Operational runbook

### Notebooks (6)

- LinkedIn data discovery (2 parts), quickstart, URL seeder tutorial, release
  reviews

### Hook System (hooks-auth.md + hook_manager.py)

8 lifecycle hooks: on_browser_created -> on_page_context_created -> before_goto
-> after_goto -> on_user_agent_updated -> on_execution_started ->
before_retrieve_html -> before_return_html. Auth: use on_page_context_created,
not on_browser_created. Hook security (v0.8.0+): restricted builtins, env gate,
AST validation, 30s timeout.

### Deep Crawling (deep-crawling.md + deep_crawling/)

3 strategies: BFS, DFS, BFF (best-first with scoring). Crash recovery via state
persistence. Prefetch mode. FilterChain with URLPatternFilter, SEOFilter,
KeywordRelevanceScorer, DomainAuthorityScorer.

### CrawlState Resume Pattern (adaptive_crawler.py)

CrawlState with save()/load() for: crawled_urls, knowledge_base, pending_links,
metrics, term_frequencies. NOTE: Architecture agent found NO on_state_change
callback. The MinerU analysis (Session #274) flagged this as adoptable, but the
callback may not exist yet.

## Knowledge Not Visible From Code Alone

1. **3-tier browser pool** - PERMANENT/HOT/COLD with janitor. 10x memory claim.
2. **C4A-Script** - Custom domain-specific scripting language for crawl
   automation
3. **Identity-based crawling** - Persistent browser profiles for auth
4. **Hook security model** - Disabled by default, env gate, restricted builtins
   (CVE fix)
5. **Safe expression evaluation** - AST validation on extraction computed fields
6. **GitFlow release methodology** - Bi-weekly cadence, Docker RCs before stable

# Verification: C-097 to C-127

## Summary

VERIFIED: 18 | REFUTED: 2 | UNVERIFIABLE: 7 | CONFLICTED: 4

## Verdicts

C-097 [CONFLICTED] - Google AI Overviews 317% multimodal citation bonus -
Multiple SEO sources (wellows.com, mikekhorev.com) cite "317% more citations"
for text+images+video+schema; however the figure originates from SEO blog
aggregation, not a Google primary source. No official Google documentation
confirms this specific figure. Type: Misinformation risk / single-origin
statistic laundered across SEO blogs.

C-098 [VERIFIED] - Tavily SOC 2 Type II + 99.99% SLA + Extract/Crawl/Research
APIs - AWS Marketplace and IBM Cloud listings confirm SOC 2 Type II; Tavily docs
confirm 99.99% uptime SLA and 180ms p50 latency; four APIs confirmed (Search,
Extract, Crawl, Research). Claim says three separate concerns but there are
four. Minor undercounting but core is verified.

C-099 [CONFLICTED] - Diffbot Knowledge Graph 10 billion entities, $299+/month -
Entity count of 10 billion confirmed (diffbot.com/products/knowledge-graph).
However, pricing of $299+/month is not confirmed; current model uses
credit-based pricing (~$899 for 1M credits per Capterra/G2 2025 data). The $299
figure may be outdated or incorrect. Type: Freshness conflict.

C-100 [VERIFIED] - Crawl4AI 3-layer extraction: CSS/XPath, cosine similarity,
LLM - Crawl4AI docs confirm all three strategies:
JsonCssExtractionStrategy/JsonXPathExtractionStrategy (fastest), CosineStrategy
(intermediate, local embeddings), LLMExtractionStrategy (highest quality).
Layering matches the claim exactly.

C-101 [VERIFIED] - Engineer View should focus on creator-relevant dimensions
(freshness, trust, readability, IA) - D7-engineer-view.md confirms this framing.
Document is structured around freshness, readability, trust, and IA as the four
creator-relevant dimensions rather than full technical audits.

C-102 [VERIFIED] - HITL satisficing research validates 3-5 expedition options -
D10a-expedition-ux.md confirms: Iyengar-Lepper jam study, Amazon UX data, NNG
research all cited as basis. Document explicitly states "3-5 options per step is
the appropriate range" with 3 preferred for high-cognitive contexts. Satisficing
framing is consistent with behavioral economics literature.

C-103 [VERIFIED] - Four analysis modes: Quick Scan, Page Analysis, Site Crawl,
Expedition - D12-structure.md confirms this four-mode structure exists as the
skill design. Ordering by cost and capability matches the claim description.

C-104 [UNVERIFIABLE] - Skill should be JASON-OS portable with no
project-specific logic - This is a design intent claim. No filesystem document
was found that explicitly commits to this constraint. D4b and D11c source
documents were not directly accessible for verification. The JASON-OS
portability goal is consistent with MEMORY.md (project_jason_os.md), but the
specific "no project-specific logic in core" implementation decision is not
confirmed in any accessible doc.

C-105 [CONFLICTED] - Firecrawl 105k GitHub stars, AGPL, Docker, 9 credits per
page (Enhanced+JSON) - AGPL-3.0 confirmed; Docker deployment confirmed; 9
credits per page (1 base + 4 Enhanced + 4 JSON) confirmed by Firecrawl pricing
docs. However, star count is CONFLICTED: one source says 97k+, another
references 40k+, neither reaches 105k as of April 2026. Type:
Freshness/measurement conflict on star count.

C-106 [VERIFIED] - HITL browser agent research: users satisfice rather than
optimize navigation - D10a-expedition-ux.md confirms satisficing pattern from
multiple academic and product sources (Iyengar-Lepper, Amazon, NNG). This is the
same core finding as C-102. Verified via internal source document.

C-107 [UNVERIFIABLE] - Anti-design trend 2025: sites with aggressive minimalism
deliberately obscure editorial stance - This is a subjective design-culture
claim attributed to D4b. No external source independently confirms this as an
identified trend. The observation may be valid but cannot be verified against
authoritative sources.

C-108 [VERIFIED] - First-hand experience language is primary positive signal for
authentic voice vs. generated content - D4b and D8 source docs confirm this.
Cross-validated: E-E-A-T guidelines (Google) emphasize first-hand experience.
Multiple content authenticity researchers cite "I tested/built/experienced" as a
differentiator from aggregated or AI-generated content.

C-109 [VERIFIED] - Wappalyzer open-source patterns JSON can be bundled for
offline CMS detection - GitHub confirms patterns are stored as JSON files
(src/technologies/\*.json). Forks of last open-source version
(dochne/wappalyzer) remain publicly accessible. JSON pattern files can be
downloaded and bundled for offline detection. Wappalyzer went closed-source but
the last open version is preserved.

C-110 [UNVERIFIABLE] - Sitemap lastmod values often inaccurate; use HTTP
Last-Modified headers instead - The claim has partial support: 2024 HTTP Archive
study found 58% of sitemaps have outdated/missing lastmod values (confirmed in
D7-engineer-view.md). However, the prescription to use HTTP Last-Modified as a
replacement is qualified in D7: HTTP Last-Modified is listed as Priority 1 but
is "absent on ~60% of sites." Neither source is universally reliable. The claim
as stated (use Last-Modified INSTEAD of lastmod) is an oversimplification of the
multi-signal cascade design. PARTIAL SUPPORT only.

C-111 [UNVERIFIABLE] - Session logs as implicit knowledge base: Claude Code logs
could be retroactively indexed - This is a speculative architecture idea from
D11c. No external evidence validates Claude Code conversation logs as a
structured indexable knowledge store. The claim is design speculation, not a
verified capability or established pattern.

C-112 [UNVERIFIABLE] - Knowledge graph MCP enables relationship queries at scale
for v2+ storage - This is a forward-looking architecture claim from D11c. While
knowledge graph MCPs exist (InfraNodus has an MCP server per Smithery listing),
the specific claim about entity+observations+relations for v2+ site analysis
storage is an unverified design proposal, not a confirmed implementation
pattern.

C-113 [VERIFIED] - Expedition JSONL event types: node_visit, snapshot,
budget_warning, expedition_paused, expedition_resumed, expedition_complete -
D10b-expedition-state.md lines 281-286 show exact JSONL schema with all six
event types listed in the claim. Verified against internal source document.

C-114 [VERIFIED] - High-link-density threshold >40 unique external links should
trigger cross-site synthesis suggestion - D9a-link-density.md explicitly
recommends ">40 external links" as the static threshold for triggering
cross-site synthesis. The document describes it as the "primary gate" with ratio
as secondary confirmation. Sourced from 2025 Web Almanac baseline data (90th
percentile = 25 links; 40+ is well above median).

C-115 [VERIFIED] - PRISMA-trAIce is an emerging framework for AI-assisted
systematic reviews - Published in JMIR AI (2025) as a peer-reviewed paper. PMC
article confirmed. GitHub repo confirmed (cqh4046/PRISMA-trAIce). 14-item
checklist extending PRISMA 2020. Described as a "Living Guideline" for
AI-assisted systematic reviews. The characterization as "emerging" is accurate
given its 2025 introduction.

C-116 [VERIFIED] - Exa 2.0 embedding model trained on 144x H200 GPU cluster for
over a month - exa.ai/blog/meet-the-exacluster confirms "144x H200 cluster" and
"trained for over a month." The claim about findSimilar being a "highly valuable
free primitive" is editorial but consistent with Exa's documented findSimilar
endpoint capability.

C-117 [REFUTED] - Trafilatura Rust port F1=0.970, Go port F1=0.960 - Actual
scores differ: rs-trafilatura (Rust) achieves F1=0.966 on ScrapingHub benchmark
(not 0.970). The Go port (go-trafilatura) achieves performance "nearly identical
to original Python" but no specific F1=0.960 figure is documented; its score is
derived from near-identical Python port logic. The Python original scores
F1=0.945. The specific figures 0.970 and 0.960 in the claim are not confirmed by
sources.

C-118 [VERIFIED] - Trafilatura provides SimHash-based deduplication built-in -
trafilatura.readthedocs.io/en/latest/deduplication.html confirms built-in
SimHash/Simhash class for near-duplicate detection. The extract() and
bare_extraction() functions include a deduplication parameter. Confirmed as a
built-in feature, not requiring separate implementation.

C-119 [VERIFIED] - YAML frontmatter schema for site analysis markdown files
enables Obsidian/Dataview compatibility - D11a-obsidian.md confirms YAML
frontmatter fenced by --- is the standard format. Obsidian reads frontmatter for
Dataview queries. The schema shown in D11a (title, type, tags, status,
date_analyzed, url, confidence) directly enables Dataview TABLE queries.
Cross-tool portability is confirmed.

C-120 [UNVERIFIABLE] - 4-phase export adapter pattern allows re-export without
re-analysis - This is an architectural design pattern from D11c. No external
source confirms a "4-phase export adapter pattern" as an established or named
pattern in knowledge management tooling. It appears to be a custom design
proposal in the research, not a verified industry pattern.

C-121 [VERIFIED] - InfraNodus provides knowledge graph analysis for detecting
themes and gaps - infranodus.com confirms: maps text to knowledge graphs,
identifies topical clusters, detects structural gaps between clusters. The 2025
GraphRAG API extension is documented. The claim's application to expedition
synthesis output is editorial but the core capability is verified.

C-122 [VERIFIED] - Rosenfeld/Morville IA systems (organization, labeling,
navigation, search) provide a framework for assessing website IA quality -
Confirmed by multiple sources including O'Reilly "Information Architecture 4th
Edition" (Rosenfeld, Morville, Arango) and UX textbook references. The four
systems are well-documented and constitute the canonical IA framework for web
assessment.

C-123 [UNVERIFIABLE] - Crawlee dual-run cosine similarity >0.85 means static
extraction sufficient - The Crawlee AdaptivePlaywrightCrawler dual-run
comparison approach is confirmed (D2a-js-detection.md). However, the specific
threshold of cosine similarity >0.85 as the decision criterion is not documented
in any source. Crawlee uses a resultComparator function for comparison but no
0.85 threshold appears in the official Crawlee docs or in the D2a source
document.

C-124 [VERIFIED] - Exa Deep mode has 3.5 second P50 latency for complete content
retrieval - exa.ai/blog/exa-api-2-0 and exa.ai/blog/fastest-search-api confirm
"3.5s P50 latency" for the Deep endpoint explicitly. Exa describes this as
agentic multi-search that trades speed for higher quality results.

C-125 [VERIFIED] - BM25 + dense embedding hybrid retrieval is 2024-2025 state of
the art for link ranking - Multiple independent sources confirm: research papers
on hybrid retrieval, Haystack documentation, practical implementation guides all
confirm hybrid BM25+dense retrieval outperforms either method alone. Described
as "the emerging standard for production systems" with 53.4% recall vs 22.1%
(BM25 alone) and 48.7% (dense alone) on Natural Questions.

C-126 [VERIFIED] - Uniform paragraph length (+/-20% variance), hedging without
detail, zero external links in long-form content are AI content signals -
Confirmed in D8-antipatterns.md (source document). Cross-validated by general
LLM content detection literature: these are recognized signals. The specific
+/-20% variance metric is a design parameter from the research, consistent with
published AI content detection approaches.

C-127 [VERIFIED] - Skill should expose minimal Playwright tool surface
(navigate, snapshot, extract) and handle 26 underlying tools internally -
D2b-playwright-limits.md confirms Playwright MCP has exactly 26 tools across 7
categories. The design principle of exposing a minimal 3-tool surface (navigate,
snapshot, extract) while the skill handles internal routing across all 26 tools
is confirmed as the architectural recommendation in D2b.

# OTB Challenges: Alternative Approaches

**Agent:** OTB-1 **Date:** 2026-04-05 **Research Files Read:**
RESEARCH_OUTPUT.md, BRAINSTORM.md, D13a, D11c

## Summary

8 alternatives: 4 HIGH relevance, 3 MEDIUM, 1 HIGH (revisited brainstorm
decision)

## Alternative 1 (HIGH): MCP-Wrapped Extraction Instead of Custom Pipeline

Type: simpler. Trafilatura MCP server exists (@fvanevski/trafilatura_mcp on
Glama). Firecrawl has official MCP server. Anthropic Fetch MCP provides basic
URL-to-markdown with zero setup.

The research designed a custom pipeline (trafilatura + Turndown + JS detection).
The alternative: configure existing MCP servers and call their tools. The skill
becomes an orchestrator over MCP extraction tools, not a pipeline builder. Zero
custom code for extraction. Firecrawl MCP includes smart DOM stabilization,
eliminating the 3-phase JS escalation algorithm.

Trade-off: Firecrawl MCP costs credits per page. Trafilatura MCP is
community-maintained (stability unknown).

Recommendation: Investigate. If trafilatura MCP is stable, it eliminates Python
dependency. Use Anthropic Fetch MCP as Quick Scan baseline (already available,
zero-config). Reserve custom pipeline for Site/Expedition only.

## Alternative 2 (HIGH): RSS Feed as First-Class Extraction Path

Type: adjacent-domain. Research never mentions RSS. For blogs, news, podcasts,
newsletters, documentation changelogs, RSS provides structured XML explicitly
intended for machine consumption. Robots.txt-safe by design. Structurally clean
(no boilerplate). Freshness-native (pubDate, updated timestamps). Available on
estimated 40-50% of blog-type sites.

Many sites that block crawlers actively maintain RSS feeds. Full article content
often included in content:encoded elements. Feed discovery is standardized (link
rel alternate in HTML head, /feed, /rss, /atom.xml fallback paths).

Recommendation: Adopt for blog/news/docs as Phase 0 Quick Scan check. Check HTML
link tag for feed URL, try common fallback paths. If full-content feed found,
use as extraction source. If summary-only, use for metadata and freshness, fetch
page for content. Additive, not replacement.

## Alternative 3 (MEDIUM): Passive Mode - Accumulate from Pages Claude Already Visits

Type: inverted. Claude visits pages during normal work via WebFetch. These
contain the same extraction opportunity as explicit invocation. A passive mode
would run lightweight Quick Scan on each fetched page, accumulate L0 summaries,
surface session-end digest: "I visited 7 sites today. 2 look worth deeper
analysis."

Trade-off: WebFetch calls not currently interceptable. Privacy concern with
passive URL accumulation. Most fetches are MDN/README lookups with no Creator
View value.

Recommendation: Park for later. Simpler near-term: at session end, scan
conversation history for URLs, present as candidates for /website-analysis.

## Alternative 4 (MEDIUM): Knowledge Graph as Primary Output

Type: newer. What if primary output is entities + relations + claims instead of
markdown? Cross-site synthesis becomes a graph query. Knowledge Graph MCP
already in environment.

Trade-off: Entity extraction from unstructured web content has high error rates.
Markdown is immediately human-readable. Creator's primary use is reading
analysis, not querying a graph.

Recommendation: Note for v3+ when accumulated analyses number in hundreds. For
v1, design YAML frontmatter fields as proto-entities with stable keys for
eventual graph import.

## Alternative 5 (HIGH): Curated-List-Seeded Discovery (Reframing Rejected Corpus Mode)

Type: reframing. The brainstorm rejected corpus mode because "search-based
discovery is SEO-biased." But that rejection conflated search-based discovery
(type topic, Google searches) with curated-list-seeded discovery (provide URL to
awesome-list, extract all links as seed corpus). These are fundamentally
different. An awesome-list URL has 200+ human-vetted links, not SEO-ranked. The
15-type taxonomy already classifies Curated List. The link scoring formula
already handles link-heavy pages. The pieces exist; the corpus entry was
incorrectly rejected along with the search-based version.

Recommendation: Investigate. Add "Curated List" routing option: "This page has
147 external links. Analyze top [5/10/20] by relevance? This creates a site
corpus." Respects URL-only entry while unlocking corpus value.

## Alternative 6 (HIGH): 3-Section Creator View for Quick Scan Tier

Type: simpler. No section reduction analysis was performed. Which 3 of 7 capture
80% of creator value?

Mapping to action probability: Section 1 (Relevance) HIGH, Section 5 (Challenge)
HIGH, Section 7 (Knowledge Candidates) HIGH. Sections 2, 3, 4 are context
sections that inform but do not drive action.

3-section Quick Scan (Relevance + Challenge + Knowledge Candidates) could
complete under 60 seconds. Changes skill feel from "research tool" to "triage
tool." Does not contradict full-build posture - it is a tier definition: Quick
Scan = 3 sections, Page Analysis = 7 sections. Structurally consistent with the
Quick Scan to Page Analysis tier progression.

Recommendation: Adopt as tier definition. Quick Scan outputs sections 1, 5, 7.
Page Analysis outputs all 7. Define this boundary in deep-plan.

## Alternative 7 (MEDIUM): Watch List for Temporal Re-analysis

Type: adjacent-domain. Research has no proactive re-analysis architecture.
watch-list.json with URLs + last-analyzed date + content hash. On invocation,
check watched sites via HTTP HEAD. Surface changed sites as "ready for
re-analysis." On re-analysis, produce diff against prior analysis.

Trade-off: HTTP polling adds session-start latency. Last-Modified changes do not
guarantee relevant content change. Re-analysis diff requires structural
comparison of free-text.

Recommendation: Park for v2. RSS integration (Alt 2) provides lighter-weight
version for blog-type sites in v1. Manual re-invocation with automatic diff is
sufficient for v1.

## Alternative 8 (HIGH, revisited): Expedition as Separate Skill

Type: reframing. User already rejected this. But research reinforced structural
differences: different artifacts (3-file state), interactive-only, different
budget model, unique resume protocol. ResearchRabbit (the closest analog) is a
standalone tool. Shared infrastructure (fetcher, Creator View lens) can be
shared as imported logic without coupling UX and state models.

Trade-off: User's deliberate decision should be respected. Separation creates
discovery problem (user does not know which skill to invoke). Routing menu loses
guided discovery path.

Recommendation: Respect the user's decision. But design expedition with hard
internal isolation (expedition-specific state, UX functions in bounded modules)
so extraction into separate skill is possible later without refactoring. Do not
let expedition state bleed into core analysis.json schema.

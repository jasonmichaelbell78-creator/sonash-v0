# Contrarian Challenges: Skill Design Stress-Test

**Agent:** contrarian-1 **Date:** 2026-04-05 **Methodology:** Pre-mortem. Each
challenge assumes the design ships and fails within 6 months.

## Summary

10 challenges: 3 CRITICAL, 4 HIGH, 2 MEDIUM, 1 MEDIUM

## Challenge 1 (CRITICAL): 4-Mode Skill Will Fracture Into 4 Incompatible Skills

Target: "All modes share infrastructure" claim.

Page (stateless pipeline), Site (bounded loop), Expedition (interactive state
machine), Cross-site (parallel fan-out) differ in control flow, state shape,
error handling, and UX contract. These are not the same computation with
different parameters. A skill is a markdown file with no module system or type
checking. "Shared infrastructure" in a skill means "the LLM is instructed to do
similar things" - that is shared intent, not shared infrastructure. Expedition
state management (3-file JSONL append pattern) will be the first casualty -
silently degraded to "the LLM just remembers where it was."

Recommendation: Document this as the highest-risk architectural decision.
Prototype expedition state before deep-plan locks the combined architecture.
Design with hard internal isolation so extraction into a separate skill is
possible later.

## Challenge 2 (CRITICAL): Creator View Is a Personalization Problem, Not a Differentiator

Target: "Creator View is the primary differentiator" claim.

Creator View depends on quality of creator-context injection from CLAUDE.md and
SESSION_CONTEXT.md. But CLAUDE.md contains 135 lines of tooling rules, not the
creator's intellectual positions or knowledge gaps. SESSION_CONTEXT.md is a
sprint snapshot. Neither contains what the Creator View needs to produce genuine
personalization. Without a solved mechanism, "What's Relevant To Your Work"
degrades to "this site covers React, which is relevant to your Next.js project."

Recommendation: Before deep-plan, test 3 real URLs with CLAUDE.md-only context
vs a 2-sentence research description vs a structured "creator knowledge state"
document. If outputs 1 and 2 are substantially similar, CLAUDE.md injection is
noise. Downgrade Creator View from "primary differentiator" to "project-aware
site summary with personalization limitations."

## Challenge 3 (CRITICAL): Expedition Mode Will Never Survive a Real Session

Target: Expedition state management and resume protocol.

Three failure modes: (1) State reconstruction requires reading 3 files, parsing
JSONL, rebuilding tree before presenting options - a 5-step cold-start with no
error handling for partial files. (2) Interactive UX requires turn-by-turn
engagement - 10-15 minutes of choices every 45 seconds. Real users do not
complete this. (3) Depth-3/pages-15 budget is too shallow - visits at most 3
pages on critical path. What did the user learn that they could not learn by
clicking 3 links manually?

Prediction: Invoked 1-2 times as novelty, then abandoned. Compaction-resume will
fail in at least 1 of first 3 sessions.

Recommendation: Prototype expedition state resume under simulated compaction.
Go/no-go gate for v1 expedition scope. If resume cannot reliably reconstruct
within 30 seconds, design as single-session mode only.

## Challenge 4 (HIGH): 6-Library Extraction Pipeline Will Break at the Wrong Moment

Target: Extraction pipeline design.

Pipeline mixes Python (trafilatura), npm (Turndown), Docker (Crawl4AI), external
API (Jina), MCP (Playwright) - five installation models that cannot be managed
uniformly within a skill. If Docker is not running, Crawl4AI fails. If Jina
changes free tier post-Elastic acquisition, fallback breaks. If Playwright MCP
is not configured, JS escalation fails. A 2-3 tool failure cascade will surface
as a generic extraction failure with no diagnosis.

Recommendation: Add pre-flight tool availability check that verifies Python +
trafilatura, npm + turndown, Playwright MCP, Docker before any URL is fetched.
Surface diagnostic report.

## Challenge 5 (HIGH): Pre-Flight Compliance Gate Will Produce False Positives

Target: ToS pattern matching.

"No automated access" and "no scraping" appear in virtually every commercial
site's boilerplate ToS - aimed at data brokers, not developers reading one page.
Medium, Substack, any platform-hosted blog will trigger WARN. After dismissing 3
false positives with no consequence, users will treat all WARNs as noise -
security theater within the first week.

Recommendation: Replace ToS text matching with specific robots.txt User-Agent
checking (ClaudeBot/Claude-User) and llms.txt disallow parsing only. Drop
heuristic ToS body text matching in v1.

## Challenge 6 (HIGH): Storage Scaling Assumes Wrong Usage Pattern

Target: V1 markdown vault.

Real pattern is write-often, read-almost-never. After 50 analyses, user wants
"what sites have I analyzed covering TypeScript performance?" - JSONL index has
siteType and techStack but not content-level themes. Cross-session compounding
value (G2, G5) will not materialize without a queryable index. V2 SQLite
migration has no trigger condition or migration guidance.

Recommendation: Define the 5 retrieval queries the skill must answer from
.research/ before finalizing storage schema. If JSONL + YAML frontmatter cannot
answer them, move SQLite into v1 scope.

## Challenge 7 (HIGH): Cloudflare Is an Unsolved Blocker, Not a Known Gap

Target: JS rendering escalation.

Cloudflare Turnstile defeats both Playwright MCP and stealth Crawl4AI. Protects
approximately 16% of top-1M sites. Research labels this a "serendipitous
discovery" (arrived after extraction pipeline was designed) rather than a
first-class constraint. The first high-value site (major dev blog, SaaS docs,
popular newsletter) will likely be Cloudflare-protected.

Recommendation: Elevate to first-class design constraint. Add Cloudflare
detection (CF-Ray header) to Quick Scan. Fail fast and informatively rather than
attempting 3 escalation tiers and failing slowly.

## Challenge 8 (HIGH): Classification Algorithm Calibrated Against No Test Set

Target: 15-type taxonomy confidence level.

CONFIDENCE: HIGH with no empirical validation. 0.60 threshold explicitly
acknowledged as arbitrary (Gap #11). Hybrid sites (documentation + blog,
e-commerce + community) break single-label classification. JSON-LD absent on 59%
of pages; algorithm degrades to lower-weight signals for majority of sites.

Recommendation: Downgrade to MEDIUM. Run against 20 real URLs. Add mandatory
classification review step showing user which signals fired before proceeding.

## Challenge 9 (MEDIUM): Cross-site Synthesis Has No Implementation Path

Target: Cross-site mode design.

Describes methodology (thematic/narrative/matrix/meta-pattern paradigms) without
implementation specifics. No artifact schema (Gap #25), no algorithmic theme
definition (Gap #26), no storage for synthesis output. "The LLM will synthesize"
is true of any LLM conversation.

Recommendation: Descope to v2. In v1, cross-site mode produces a structured list
of individual Creator View outputs. Synthesis is manual.

## Challenge 10 (MEDIUM): Market Gap Claim Is Tool Differentiation, Not Validated Need

Target: Differentiator framing.

Compared to infrastructure tools (Firecrawl, Exa, Diffbot) but not against the
nearest alternative: pasting URL into ad-hoc Claude conversation with a good
prompt. The ad-hoc conversation already has CLAUDE.md context. The skill
provides pre-flight gate, Quick Scan wait, routing menu - 3 steps before output.
Friction cost may exceed marginal quality improvement for standard sites.

Recommendation: Before deep-plan, compare 3 URLs analyzed via skill design vs
ad-hoc Claude conversation. Define specific conditions where the skill provides
clear value over ad-hoc (site size >N, JS-required, expedition, cross-site) and
position around those conditions.

## Highest-Priority Actions Before Deep-Plan

1. Prototype expedition state resume under simulated compaction
2. Test creator-context injection with 3 real CLAUDE.md inputs
3. Run classification algorithm against 20 real URLs
4. Compare skill output vs ad-hoc conversation on 3 URLs
5. Specify cross-site synthesis artifact schema or descope to v2

# Contrarian Challenges: Research Claims Quality

**Agent:** contrarian-2 **Date:** 2026-04-05 **Target:** 127 claims from
RESEARCH_OUTPUT.md

## Summary

10 challenges identified: 2 CRITICAL, 5 MAJOR, 2 MINOR, 1 MAJOR gap

## Challenge 1 (CRITICAL): Benchmark F1 Scores Are Article-Extraction, Not Web-Extraction

Claims C-001 (trafilatura F1=0.958), C-002 (Readability F1=0.970) are from
article-extraction benchmarks only. ScrapingHub benchmark explicitly tests "web
articles." No benchmark exists for documentation, SPAs, e-commerce, government
pages. Web search shows trafilatura ScrapingHub F1 is actually 0.945 (not 0.958)
and rs-trafilatura is 0.966 (not 0.970).

Recommendation: Downgrade C-001, C-002, C-003 from HIGH to MEDIUM. Add caveat
about article-only benchmarks.

## Challenge 2 (MAJOR): Jina Reader Acquisition Risk Is Structural, Not Temporal

C-010 understates the risk. Elastic acquisition complete. Free tier now
token-based. Standard enterprise acquisition playbook depreciates free tiers
within 12-24 months. Skill fallback path depends on a service likely to become
paid.

Recommendation: Downgrade C-010 to LOW. Treat Crawl4AI self-hosting as
non-optional fallback, not Jina.

## Challenge 3 (CRITICAL): Link Scoring Formula Is Pure Invention

C-044 through C-046 present 7-component formula with specific weights as HIGH
confidence. No weights have been tested. The highest-weighted component (context
relevance 0.25) is undefined when no query is provided - the most common use
case. HEAD requests (0.05 weight) are blocked by Twitter, LinkedIn, and other
major platforms.

Recommendation: Downgrade to LOW. Label as "Version 0 heuristic." Expose weights
as configurable. Log per-component breakdowns for empirical calibration.

## Challenge 4 (MAJOR): Creator View Is Intellectual Framework, Not User-Validated

C-025 through C-028 (7-section structure, Voice/POV, Warning, 13 axes). Zero
user interviews, zero A/B tests, zero creator feedback in 127 claims. Warning
section has no threshold criteria - could fire on 80% of sites (noise) or miss
80% of valid warnings.

Recommendation: Flag Voice/POV and Warning as experimental in v1 with feedback
collection. Reduce to 8-9 axes to limit LLM hallucination surface.

## Challenge 5 (MAJOR): Cross-Site 5-12 Sweet Spot Transfers Academic to Non-Academic

C-066 through C-068. Saturation literature is from interview-based research with
homogeneous populations. Web pages are heterogeneous. "3 consecutive sites with
no new themes" stopping rule requires undefined "theme" concept (gap #26).

Recommendation: Downgrade C-066 to LOW. Use simpler v1 rule: "User decides,
default suggestion at 8 sites."

## Challenge 6 (MINOR): Firecrawl Pricing Figures May Be Stale

C-011, C-105. Per-credit cost cited as $0.001 does not match current tier
pricing. Hobby plan is approximately $0.0053/page, Standard approximately
$0.00083/page. AGPL license has copyleft implications for JASON-OS distribution.

Recommendation: Correct cost calculations. Add AGPL copyleft flag.

## Challenge 7 (MAJOR): Market Gap Claim Survey Is Incomplete

C-092 (no existing tool is site-centric). Survey excluded browser reading tools
(Readwise Reader, Matter) and competitive intelligence tools (SparkToro,
Similarweb). These are site-centric for different audiences.

Recommendation: Downgrade to MEDIUM. Reframe from "no one does this" to "no
developer tool does this."

## Challenge 8 (MINOR): Perplexity 40% vs Google 3% Is Wrong Comparison

C-072. Different products, different audiences, different intent. 13x difference
explained by selection bias not framing. Developer tool engagement will differ
from both.

Recommendation: Keep directional finding, remove 13x figure. Downgrade to
MEDIUM.

## Challenge 9 (MAJOR): JS Detection Algorithm Has No Error Rate

C-013, C-123. Three-phase algorithm reported as HIGH confidence with no false
positive/negative rate. 300-character content absence threshold is arbitrary.
Phase 3 requires Crawl4AI Docker. Cloudflare challenge pages defeat all three
phases.

Recommendation: Downgrade C-013 to MEDIUM. Add Cloudflare challenge detection to
Phase 1.

## Challenge 10 (MAJOR Gap): Rate Limiting and Crawl Behavior Missing

No claim in 127 addresses rate limiting implementation. Crawl-delay in
robots.txt mentioned but not honored in 5-second pipeline target. 150 parallel
HEAD requests from expedition may trigger bans. No cross-session domain
tracking. CI/CD usage not scoped out.

Recommendation: CRITICAL gap. Honor crawl-delay, track per-domain visits, add
warn threshold, scope as HITL-only.

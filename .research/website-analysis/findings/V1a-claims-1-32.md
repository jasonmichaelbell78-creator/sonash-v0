# Verification Results: Claims C-001 through C-032

**Agent:** V1a (re-spawn, narrowed scope) **Date:** 2026-04-05 **Status:**
PARTIAL WRITE 1 -- C-001 to C-020 complete

## Summary (will be updated)

| Verdict                  | Count (C-001 to C-020) |
| ------------------------ | ---------------------- |
| VERIFIED                 | 13                     |
| REFUTED                  | 1                      |
| CONFLICTED               | 3                      |
| UNVERIFIABLE             | 2                      |
| PENDING (C-021 to C-032) | 12                     |

---

## C-001 [VERIFIED]

**Claim:** Trafilatura achieves F1=0.958 in the ScrapingHub article-extraction
benchmark, the highest among Python open-source static extractors. **Evidence:**
Trafilatura v2.0.0 docs confirm F1=0.958 on ScrapingHub benchmark. Rust port
rs-trafilatura scores 0.966 (different language/not Python). Commercial
AutoExtract scores 0.970. Among Python open-source static extractors, 0.958 is
the highest confirmed score. **Confidence:** HIGH

## C-002 [VERIFIED]

**Claim:** Mozilla Readability achieves the highest median F1 (0.970) on
article-type content in the SIGIR 2023 benchmark. **Evidence:** Multiple sources
confirm SIGIR 2023 finding: Readability has highest median F1 (0.970),
trafilatura has best overall mean F1 (0.883). Distinct metric types (median vs
mean). **Confidence:** HIGH

## C-003 [VERIFIED]

**Claim:** Trafilatura has the best overall mean F1 (0.883) across 14 tools and
8 datasets in SIGIR 2023. **Evidence:** Confirmed: trafilatura achieved best
overall mean F1 of 0.883 in the SIGIR 2023 study combining eight evaluation
datasets. **Confidence:** HIGH

## C-004 [VERIFIED]

**Claim:** Trafilatura v2.0.0 was released December 2024 and is actively
maintained. **Evidence:** GitHub releases and PyPI confirm v2.0.0 released
December 3, 2024. **Confidence:** HIGH

## C-005 [VERIFIED]

**Claim:** Trafilatura has a known code block whitespace preservation issue
(GitHub issue #553). **Evidence:** Issue #553 "Preserve horizontal space in code
blocks" exists on adbar/trafilatura, opened April 9, 2024. **Source:**
https://github.com/adbar/trafilatura/issues/553 **Confidence:** HIGH

## C-006 [CONFLICTED]

**Claim:** Turndown + GFM plugin has 2.5M weekly npm downloads. **Evidence:**
NPM page returned 403. Snippets show 7.6M total downloads (not weekly). 2.5M
weekly unconfirmed. Original GFM plugin is 8 years stale; active @truto fork
exists. **Conflict type:** Unconfirmed metric + freshness **Confidence:** MEDIUM

## C-007 [UNVERIFIABLE]

**Claim:** Recommended two-step extraction pipeline is: trafilatura then
Turndown+GFM. **Evidence:** No external authoritative source mandates this
pipeline. It is a design recommendation from the research document (D1a), not a
published standard. **Confidence:** LOW

## C-008 [VERIFIED]

**Claim:** Crawl4AI is licensed Apache-2.0, not MIT. **Evidence:** GitHub repo
(unclecode/crawl4ai) confirms Apache License 2.0. **Confidence:** HIGH

## C-009 [VERIFIED]

**Claim:** Crawl4AI has 50k+ GitHub stars and provides Playwright-based
rendering with Docker REST API. **Evidence:** 50k+ stars confirmed (some report
58k+). Playwright rendering and Docker REST API (/crawl on port 11235)
confirmed. **Confidence:** HIGH

## C-010 [VERIFIED]

**Claim:** Jina Reader was acquired by Elastic in October 2025. **Evidence:**
Elastic completed acquisition of Jina AI on October 9, 2025 (official press
release). **Source:**
https://ir.elastic.co/news/news-details/2025/Elastic-Completes-Acquisition-of-Jina-AI-a-Leader-in-Frontier-Models-for-Multimodal-and-Multilingual-Search/default.aspx
**Confidence:** HIGH

## C-011 [VERIFIED]

**Claim:** Firecrawl credit stacking: Enhanced Mode (+4) + JSON extraction
(+4) + base (1) = 9 credits per page. **Evidence:** Confirmed by
docs.firecrawl.dev/billing and multiple pricing sources. **Confidence:** HIGH

## C-012 [VERIFIED]

**Claim:** Next.js SSR pages have **NEXT_DATA** but do not require JS rendering.
**Evidence:** Next.js docs confirm data embedded in initial HTML. No JS
execution needed to access **NEXT_DATA** content. **Confidence:** HIGH

## C-013 [UNVERIFIABLE]

**Claim:** Three-phase JS detection escalation algorithm correctly identifies
JS-rendering necessity. **Evidence:** Design claim from D2a. No external
benchmark validates this specific algorithm. Architecturally reasonable but
unverifiable. **Confidence:** LOW

## C-014 [CONFLICTED]

**Claim:** njsparser can extract structured data from React Server Component
(RSC) flight payloads without full rendering. **Evidence:** No npm package named
njsparser found. RSC flight parsing tools exist (rsc-parser,
@rsc-parser/embedded) but none match the name. Capability is real; tool name is
unverified. **Conflict type:** Possible misnaming or fictional package name
**Confidence:** LOW

## C-015 [REFUTED]

**Claim:** Playwright MCP provides 26 tools across 7 categories. **Evidence:**
Current Playwright MCP documentation confirms 70+ tools across 7 capability
groups, NOT 26. The accessibility-tree-as-primary-mode sub-claim is correct.
Tool count of 26 is refuted. **Confidence:** HIGH

## C-016 [VERIFIED]

**Claim:** Playwright MCP costs approximately 114k tokens per session vs 27k for
CLI. **Evidence:** Playwright team benchmarks confirm ~114,000 tokens (MCP) vs
~27,000 tokens (CLI). Multiple independent sources report identical figures.
**Confidence:** HIGH

## C-017 [VERIFIED]

**Claim:** storage-state.json pattern allows Playwright MCP to persist
authentication state across sessions. **Evidence:** storage-state.json is
standard Playwright pattern for auth persistence (cookies, localStorage).
Confirmed by Playwright docs. **Confidence:** HIGH

## C-018 [VERIFIED]

**Claim:** robots-parser v3.0.1 is the recommended Node.js library for
robots.txt parsing, implementing RFC 9309 (2022 IETF standard). **Evidence:**
v3.0.1 confirmed on npm/UNPKG/Snyk. GitHub states RFC 9309 compliance. RFC 9309
is the 2022 IETF standard. **Confidence:** HIGH

## C-019 [VERIFIED]

**Claim:** Anthropic operates three user agents (ClaudeBot, Claude-User,
Claude-SearchBot) that all respect robots.txt. **Evidence:** Anthropic official
docs confirm all three bots honor robots.txt. **Source:**
https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler
**Confidence:** HIGH

## C-020 [VERIFIED]

**Claim:** OpenAI ChatGPT-User removed robots.txt compliance in December 2025.
**Evidence:** OpenAI updated crawler docs December 9, 2025 removing robots.txt
compliance for ChatGPT-User. Multiple sources confirm. **Confidence:** HIGH

## C-021 through C-032 [PENDING]

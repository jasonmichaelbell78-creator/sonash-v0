# OTB Challenges: Website Analysis Skill - Ecosystem, Future-Proofing, Integration

**Agent:** OTB-2 (Ecosystem and Future Focus) **Date:** 2026-04-05

## Summary

8 alternatives identified:

**CRITICAL (1):** 74% of new pages are AI-generated - authenticity axis needs
confidence degradation policy **HIGH (4):** deep-research overlap boundary
undefined; watch-list mode missing; 6-dependency polyglot stack has no v1/v2
install plan; competitive moat is context injection not extraction **MEDIUM
(2):** repo+website analysis cross-reference missing; durable moat framing
needed **LOW (2):** skill-creator routing path; collaborative/multi-user story

## 1. deep-research Already Fetches Web Pages - Skill Overlap Risk (HIGH)

deep-research searcher agents already invoke WebFetch and WebSearch on arbitrary
URLs. The research does not compare the two skills extraction paths or define
where deep-research stops and website-analysis begins.

Recommendation: Define formal integration boundary. Minimally share the same
web-fetch utility. A --cite-in-research flag would make integration explicit.

## 2. repo-analysis + website-analysis on Same Entity - No Bridge (MEDIUM)

Analyzing react.dev (website) and facebook/react (repo) produces two
disconnected .research/ directories. No cross-reference mechanism exists.

Recommendation: Add related_analyses array to analysis.json (both skills).
Populate via sameAs JSON-LD extraction. 2-field schema addition.

## 3. website-analysis Findings Could Feed skill-creator (LOW)

Knowledge Candidates could route directly to skill-creator. Not considered as a
downstream consumer.

Recommendation: Add to final routing menu as future enhancement.

## 4. 74% AI-Content Problem Makes Authenticity Signal CRITICAL

Ahrefs April 2025: 74.2% of new web pages contain detectable AI-generated
content. Current 6 heuristic signals have no stated accuracy rate. Detector
tools achieve 68-80% accuracy with 3-12% false positives.

Recommendations:

- Confidence degradation rule: if AI suspicion exceeds threshold, apply 0.5x
  multiplier to extracted claims
- EU AI Act watermark detection when available (August 2026)
- Elevate Content Authenticity to top-3 value axis
- Benchmark 6 heuristic signals against test set before implementation

## 5. Watch-List / Scheduled Analysis Mode Missing (HIGH)

Research exclusively addresses single-invocation interactive analysis. No
watch.jsonl, no --watch flag, no change detection hash.

Recommendation: Add watch.jsonl schema to deep-plan. Hash target = normalized
extracted text (post-extraction), not raw HTML. v2 feature that changes utility
category from research tool to competitive intelligence.

## 6. If Firecrawl Adds Analysis Features, Moat Is Portability (MEDIUM)

Durable moat is NOT extraction quality. It is:

1. Project-context injection (CLAUDE.md, SESSION_CONTEXT.md) - unreplicable
   externally
2. Schema parity with repo-analysis - only valuable when both skills present
3. JASON-OS portability - travels with .claude/ directory

Recommendation: Treat external-tool-dependent features as replaceable modules.
CLAUDE.md context injection + schema parity + .research/ storage = permanent
core.

## 7. 6-Dependency Polyglot Extraction Stack - Maintenance Liability (HIGH)

4-9 dependencies spanning Python + JavaScript + Docker. Skills are markdown
files that do not manage package installations. No v1/v2 phased install plan.

Recommendation:

- v1: Cheerio + Turndown + GFM + Jina fallback (pure npm, zero Python)
- v2: Add trafilatura when Python confirmed available
- Pre-flight check: detect Python/pip availability, offer upgrade path

## 8. No Collaborative or Cross-Locale Analysis Story (LOW)

.research/ is git-tracked. No merge strategy for concurrent analyses. Expedition
state files will conflict.

Recommendation: gitignore expedition state files, git-track analysis artifacts.
Document zero-config bootstrap for external users. v1 scope is single-user.

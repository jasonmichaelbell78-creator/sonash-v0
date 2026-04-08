# Verifier V2a1 -- Claims C-036 through C-041

**Phase:** 2.5 Post-Search Verification **Date:** 2026-04-07 **Verifier:**
claude-sonnet-4-6

---

## Verdict Table

| ID    | Claim Summary                                                                                                            | Verdict    | Method           | Confidence | Evidence                                                                                                                                                                                                                                                                                                                    |
| ----- | ------------------------------------------------------------------------------------------------------------------------ | ---------- | ---------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C-036 | Add Louvain at 500-1,000 nodes (~3-6 months)                                                                             | VERIFIED   | filesystem       | HIGH       | D11 line 12: "add Louvain at 500-1,000 nodes (~3-6 months)" verbatim                                                                                                                                                                                                                                                        |
| C-037 | graphology: TS-native, MIT, 1,600+ stars, 4,900+ dependents, no native deps, Louvain/betweenness/PageRank/BFS/components | VERIFIED   | filesystem + web | HIGH       | D15-1: "1,600+ stars, 4,900+ dependents, Pure JS, zero native deps, MIT." GitHub: 1.6k stars, 4.9k used-by. graphology-metrics docs confirm betweenness, PageRank; standard-library confirms Louvain, BFS, components. "TS-native" = ships type declarations as peer deps (minor wording imprecision, not a factual error). |
| C-038 | Louvain perf: ~53ms/1k nodes, ~938ms/50k nodes; full graph reload required (not incremental)                             | VERIFIED   | filesystem       | HIGH       | D11 line 42: "~53ms at 1,000 nodes, ~938ms at 50,000. Limitation: … Full graph reload needed for analytics (not incremental)"                                                                                                                                                                                               |
| C-039 | Betweenness centrality is clinically identical to bridge centrality in addiction/mental health research                  | CONFLICTED | web              | MEDIUM     | See conflict below                                                                                                                                                                                                                                                                                                          |
| C-040 | MAGMA LoCoMo 0.700 vs A-MEM 0.580; substantial operational complexity; defer to v3+                                      | VERIFIED   | filesystem       | HIGH       | D4 line 52: "LoCoMo 0.700 vs A-MEM 0.580. The 45.5% figure… confirmed accurate." 4-graph decomposition, vector embeddings, async consolidation confirmed in D6-2.                                                                                                                                                           |
| C-041 | Migration: 18 SourceNodes, 167 KnowledgeNodes (skip 1), 167+ edges; single transaction under one second                  | VERIFIED   | filesystem       | HIGH       | extraction-journal.jsonl: 168 entries, 18 unique sources, 1 skip (confirmed by Python parse). D13-1 confirms 167 KnowledgeNodes, 167 EXTRACTED_FROM edges, additional edge types, single SQLite transaction.                                                                                                                |

---

## C-039 Conflict Detail

**Claim:** betweenness centrality (O(E*V)) is *clinically identical\* to bridge
centrality in addiction/mental health network research.

**Source A (D11, codebase findings):** "Clinical bridge centrality research in
addiction/mental health is structurally identical to T28's use case." Treats
betweenness centrality and bridge centrality as equivalent in this domain
context.

**Source B (PubMed, Borsboom et al. 2019):** Bridge centrality is a _distinct_
measure developed specifically because betweenness centrality was insufficient
for psychopathology comorbidity research. Four separate bridge statistics
(bridge strength, bridge betweenness, bridge closeness, bridge expected
influence) were developed. "Eliminating nodes based on bridge statistics was
more effective than eliminating nodes high on traditional centrality
statistics."

**Conflict type:** Complementary — D11 makes a loose structural analogy (T28's
use case resembles addiction network research). The academic literature
distinguishes the measures. The claim's "clinically identical" phrasing
overstates the equivalence; betweenness centrality is a related but inferior
proxy for bridge centrality in mental health contexts.

**Impact:** Low. The operational advice (run periodically as background job,
cache results) is sound regardless of the terminological precision.

---

## Sources

- D11-analytics-vs-traversal.md (codebase, HIGH)
- D13-1-migration-extraction-journal.md (codebase, HIGH)
- D15-1-risk-maturity-libraries.md (codebase, HIGH)
- D4-academic-memory-research.md (codebase, HIGH)
- D6-2-magma-amem-schema.md (codebase, HIGH)
- extraction-journal.jsonl (filesystem, HIGH) — 168 lines, 18 sources, 1 skip
  confirmed
- github.com/graphology/graphology — 1.6k stars, 4.9k used-by, MIT, confirmed
  2026-04-07
- graphology.github.io/standard-library/metrics.html — betweenness, PageRank
  confirmed
- arxiv.org/abs/2601.03236 (MAGMA paper) — 4-graph decomposition confirmed
- pubmed.ncbi.nlm.nih.gov/31179765/ — Bridge Centrality distinct from
  betweenness centrality

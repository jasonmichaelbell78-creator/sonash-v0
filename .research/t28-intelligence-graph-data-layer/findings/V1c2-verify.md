# Verification Batch V1c2 — Claims C-031 to C-035

**Phase:** 2.5 (Post-Search) **Date:** 2026-04-07 **Verifier:**
claude-sonnet-4-6

---

## Verdict Table

| Claim ID | Verdict      | Confidence | Summary                                                                                                                                                                                                                                                                                                                                                                          |
| -------- | ------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C-031    | CONFLICTED   | MEDIUM     | k=60 as industry standard: VERIFIED (Cormack/Croft 2009 SIGIR paper + multiple sources). Graphiti k=1 characterization: no source confirms Graphiti uses k=1 — Graphiti uses RRF with k=60 like standard implementations. The framing of "k=1 intentionally aggressive" is unsourced analytical inference.                                                                       |
| C-032    | UNVERIFIABLE | LOW        | CTE pre-filtering before FTS5/vector is a supported best practice (confirmed). The specific "tag selectivity 1-5% of nodes is higher than confidence filters" claim is an unsupported analytical assertion — no source provides this selectivity figure or ranks tag filters as most selective.                                                                                  |
| C-033    | CONFLICTED   | MEDIUM     | Numbers correct: 18.5% accuracy gain, 90% latency reduction, 115K → 1.6K tokens all confirmed in Zep paper (arxiv 2501.13956). Mechanism misattributed: the paper does NOT isolate "BFS 1-2 hops after hybrid search" as the driver — improvements come from the full retrieval+reranking pipeline. BFS is one of three search functions; depth attribution is not in the paper. |
| C-034    | UNVERIFIABLE | LOW        | Mem0 baseline numbers confirmed: 26K tokens, ~17s latency (p95: 17.117s), 90% token reduction. The "500 token cap" recommendation and "6% accuracy loss" figure are not confirmed by any source — the 500 token figure appears in a different system (Honcho). No Mem0 source specifies a 500-token injection cap tied to prompt caching.                                        |
| C-035    | UNVERIFIABLE | LOW        | SQLite recursive CTE adequacy for 2-3 hop shallow traversals is confirmed. The specific "~5,000 node" adequacy threshold and the framing that "degradation occurs on 5+ hops or dense multi-path graphs, not raw node count" is not confirmed — sources discuss revisit-based degradation and hop depth, but no source provides a 5,000-node adequacy boundary.                  |

---

## Conflict Details

### C-031

```json
{
  "claimId": "C-031",
  "verdict": "CONFLICTED",
  "method": "web",
  "confidence": "MEDIUM",
  "evidence": "k=60 as RRF standard confirmed by Cormack/Croft 2009 SIGIR (cormack.uwaterloo.ca/cormacksigir09-rrf.pdf) and multiple independent sources. Graphiti k=1 characterization unconfirmed.",
  "conflicts": [
    {
      "sourceA": "Cormack & Croft 2009 SIGIR — k=60 is the validated standard, used in original paper",
      "sourceB": "No source confirms Graphiti uses k=1; Graphiti documentation uses standard k=60 RRF",
      "type": "misinformation"
    }
  ]
}
```

### C-033

```json
{
  "claimId": "C-033",
  "verdict": "CONFLICTED",
  "method": "web",
  "confidence": "MEDIUM",
  "evidence": "Zep paper (arxiv 2501.13956) confirms the numbers (18.5%, 90%, 115K→1.6K). Paper does NOT attribute these gains to 'BFS 1-2 hops' specifically — it is the full pipeline.",
  "conflicts": [
    {
      "sourceA": "Zep paper: 18.5% accuracy / 90% latency / 115K→1.6K confirmed",
      "sourceB": "Zep paper: BFS is one of three search functions; paper does not isolate BFS 1-2 hops as the mechanism for the reported gains",
      "type": "complementary"
    }
  ]
}
```

# Verifier V2b1: Claims C-054 to C-058

**Verifier:** V2b1 (verification agent) **Date:** 2026-04-07 **Phase:** Phase
2.5 -- Post-Search Verification **Claim range:** C-054 through C-058 **Total
claims verified:** 5

---

## Verdict Table

| Claim ID | Category   | Verdict    | Confidence | Method         | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| -------- | ---------- | ---------- | ---------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C-054    | operations | VERIFIED   | MEDIUM     | filesystem+web | Thresholds (>=3 edge clusters, >=8 observations) confirmed in D10-2 and D7 as T28 design docs. Farzaa gist (WebFetch) does NOT contain these exact thresholds — they are first-principles adaptations of farzaa's 150-line article rule. Claim correctly states "no published validation." Source attribution to farzaa's heuristic is accurate in spirit.                                                                                                                                                                                          |
| C-055    | operations | VERIFIED   | MEDIUM     | filesystem+web | T28 staleness threshold (confidence < 0.3 AND last_seen > 180 days) confirmed in D10-2 and synthesis S3. A-MEM paper (arXiv 2502.12110 WebFetch) confirmed: NO 90-day threshold in paper. D10-2 explicitly flags "A-MEM's 90-day/0.3-weight thresholds are UNVERIFIED in the paper." Claim accurately qualifies "(unverified)."                                                                                                                                                                                                                     |
| C-056    | operations | VERIFIED   | MEDIUM     | filesystem     | 5% orphan threshold and 20% freelist_count VACUUM trigger confirmed verbatim in D10-2: "orphan_count > 5% of total nodes → trigger cleanup" and "freelist_count > 20% of pages, run VACUUM." wal_checkpoint(TRUNCATE) then VACUUM sequence confirmed in D10-2. These are T28 design heuristics (S-018 cited but specific percentages not traceable to BasicMemory docs — design choices).                                                                                                                                                           |
| C-057    | operations | CONFLICTED | MEDIUM     | web+filesystem | 90% token reduction and 115K → 1.6K figures VERIFIED by Zep paper (arXiv 2501.13956, Table 2 and abstract). Triple serialization protocol confirmed in D10-1 and synthesis S3. CONFLICT: Zep paper does NOT describe output as "triples" — uses structured text template format. The specific triple notation `(node-a) --[relation]--> (node-b)` and the prompt wording are T28 design additions, not from Zep. The Zep metric is real; attaching it to a specific protocol Zep doesn't use overstates the evidence basis for the protocol itself. |
| C-058    | operations | VERIFIED   | HIGH       | filesystem+web | All three detection methods (CONTRADICTS edges, vector cosine + LLM, 2-hop subgraph to Claude) confirmed in D10-1, synthesis S3. "Pure SQL cannot detect semantic contradiction" confirmed in D10-1 summary and D10-1 explicit statement: "SQL alone cannot detect semantic contradiction." Web search corroborates academic consensus. S-029 (mind-mem with ConstraintSignature contradiction detection) and S-018 (BasicMemory) are appropriate sources.                                                                                          |

---

## CONFLICTED Detail: C-057

| Field   | Value                                                                                                                                                        |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| sourceA | arXiv 2501.13956 (Zep paper) — 115K → 1.6K tokens confirmed in Table 2. Context serialized as structured text, not formal triples.                           |
| sourceB | T28 D10-1 research doc — attributes 90% reduction to "triple serialization" protocol specifically.                                                           |
| type    | Complementary — the stat is real; the specific protocol format (triple notation) is a T28 design choice layered onto the Zep benchmark, not verified by Zep. |

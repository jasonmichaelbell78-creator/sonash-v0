# Verification Findings: C-019 to C-024

**Verifier:** verification-agent **Phase:** 2.5 (Post-Search Verification)
**Date:** 2026-04-07 **Claims:** C-019, C-020, C-021, C-022, C-023, C-024

---

## Verdict Table

| ID    | Claim Summary                                                                                                                     | Verdict        | Confidence | Key Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ----- | --------------------------------------------------------------------------------------------------------------------------------- | -------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C-019 | A-MEM 7-field schema is: keywords, tags, contextual_description, embedding, content, **valid_at, invalid_at**                     | **REFUTED**    | HIGH       | Paper arXiv:2502.12110 (HTML, Section 3.1) confirms 7 fields are: content (c_i), timestamp (t_i), keywords (K_i), tags (G_i), contextual_description (X_i), embedding (e_i), **links (L_i)**. The claim substitutes `timestamp` → `valid_at` and `links` → `invalid_at`. Neither `valid_at` nor `invalid_at` appears in A-MEM's schema.                                                                                                                                                                    |
| C-020 | T28 should use 4 edge types: LINKS_TO, CITES, MENTIONS, SUPERSEDES — all with valid_at and invalid_at                             | **VERIFIED**   | MEDIUM     | These are T28 design recommendations, not inherited Graphiti types. Finding D6-2 explicitly recommends exactly these 4 edge names. `valid_at`/`invalid_at` on edges is confirmed by Graphiti source (D6-1, arXiv:2501.13956). Naming is a design choice, not an external ground-truth claim — MEDIUM confidence reflects that.                                                                                                                                                                             |
| C-021 | Willison benchmark (100K rows): M2M single tag 1.41ms, AND(2 tags) 2.26ms; JSON array 40-55ms                                     | **CONFLICTED** | MEDIUM     | Willison's March 2026 post confirmed at simonwillison.net/2026/Mar/20/sqlite-tags-benchmark/ and corroborated by D6-3 finding. Parameters (100K rows, 100 tags, 6.5 tags/row) independently confirmed. The benchmark article confirms M2M under 1.5ms for single-tag and JSON ~40x slower. **Exact figures 1.41ms and 2.26ms could not be retrieved from web sources** — present only in D6-3 internal finding. Conflict type: Complementary (web confirms range; exact decimals unverifiable externally). |
| C-022 | Keywords (retrieval signals, inline) and tags (categorical, junction table) are distinct and both necessary                       | **VERIFIED**   | HIGH       | Two independent sources: (1) A-MEM paper arXiv:2502.12110 distinguishes K_i (specific nouns/verbs, retrieval) from G_i (broad categories, classification). (2) Willison S-031 benchmark (D6-3) confirms junction table for tags. (3) D6-2 finding: "Keywords = specific retrieval signals ('photography', 'scenery'). Tags = broad categories ('hobby', 'personal development')."                                                                                                                          |
| C-023 | synthesis_confidence = base_confidence \* min(1.0, source_count / 3); separate node_metadata table; full confidence at 3+ sources | **VERIFIED**   | MEDIUM     | D6-3 finding confirms: "Pattern C (RECOMMENDED): base_confidence \* min(1.0, source_count / 3). Hits 1.0 at 3+ independent sources." Separate `node_metadata` table recommended explicitly (Option C in D6-3). No external academic source canonically defines this exact formula — it is D6-3's synthesis recommendation, not a cited external standard. Confidence MEDIUM: internally consistent and logically sound but not externally peer-reviewed.                                                   |
| C-024 | Soft invalidation (set invalid_at) for contradictions/supersession; never delete; query current: WHERE invalid_at IS NULL         | **VERIFIED**   | HIGH       | Confirmed by 3 independent sources: (1) Graphiti source code (D6-1): "contradicted edges get `invalid_at` set... old edges NEVER deleted." (2) arXiv:2501.13956 (Graphiti paper, S-002). (3) Web search confirms: Graphiti sets `invalid_at` on old edges, never deletes; current-state query pattern `WHERE invalid_at IS NULL AND expired_at IS NULL` confirmed by OpenAI Cookbook and Zep docs.                                                                                                         |

---

## CONFLICTED Detail: C-021

**Type:** Complementary (apparent conflict)

- **Source A (web):** simonwillison.net/2026/Mar/20/sqlite-tags-benchmark/ —
  confirms M2M single-tag "under 1.5ms," JSON "40x slower." Benchmark parameters
  confirmed (100K rows, 100 tags, 6.5 tags/row). Exact decimal values not
  published in article text.
- **Source B (internal D6-3):** Reports 1.41ms single-tag, 2.26ms AND(2 tags),
  40-55ms JSON. These exact figures are consistent with Source A's published
  ranges but cannot be independently confirmed to the decimal.

**Assessment:** Not a genuine conflict. Source A reports bounds; Source B
reports exact values within those bounds. The claim's exact figures are
plausible but unverifiable externally to the decimal. The core assertion (M2M
wins single-tag and OR; FTS5 wins AND; JSON is 40x slower) is VERIFIED. The
specific millisecond values should be treated as approximate.

---

## REFUTED Detail: C-019

**Exact discrepancy:**

| Position | A-MEM Paper (arXiv:2502.12110, Section 3.1) | Claim C-019          |
| -------- | ------------------------------------------- | -------------------- |
| Field 2  | timestamp (t_i)                             | (not listed)         |
| Field 7  | links (L_i) — set of linked memory IDs      | (not listed)         |
| —        | —                                           | valid_at (claimed)   |
| —        | —                                           | invalid_at (claimed) |

`valid_at` and `invalid_at` are Graphiti temporal edge fields (S-002/S-008), not
A-MEM node fields. The claim conflates the two systems' schemas.

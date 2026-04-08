# Verifier V2a: Claims C-036 to C-053

**Verifier:** V2a (verification agent) **Date:** 2026-04-07 **Phase:** Phase 2.5
-- Post-Search Verification **Claim range:** C-036 through C-053 **Total claims
verified:** 18

---

## Prior Finding Applied

The original V2 agent established that LadybugDB npm package is lbug (NOT
@ladybugdb/core or @ladybug/core). No claims in this batch reference the wrong
package name.

---

## Verdict Table

| Claim ID | Category     | Verdict      | Confidence | Method         | Notes                                                                                                      |
| -------- | ------------ | ------------ | ---------- | -------------- | ---------------------------------------------------------------------------------------------------------- |
| C-036    | architecture | VERIFIED     | HIGH       | filesystem+web | D11 confirms Louvain at 500-1,000 nodes (3-6 months)                                                       |
| C-037    | architecture | CONFLICTED   | MEDIUM     | web            | Stars/MIT/algorithms correct. Dependents WRONG: 4,900+ claimed vs ~246 actual                              |
| C-038    | architecture | VERIFIED     | HIGH       | web            | 52.73ms@1k nodes, 937.94ms@50k nodes. Full reload confirmed.                                               |
| C-039    | architecture | VERIFIED     | MEDIUM     | filesystem+web | Bridge centrality in addiction/mental health confirmed by peer-reviewed research                           |
| C-040    | architecture | CONFLICTED   | MEDIUM     | web            | MAGMA 0.700 VERIFIED. A-MEM 0.580 comparison UNVERIFIABLE.                                                 |
| C-041    | migration    | VERIFIED     | HIGH       | filesystem     | D13-1: 18 sources, 167 KnowledgeNodes, 167 EXTRACTED_FROM edges confirmed                                  |
| C-042    | migration    | VERIFIED     | HIGH       | filesystem     | D13-1: 9 of 13 slugs irregular with examples. source-slug-map.json required.                               |
| C-043    | migration    | VERIFIED     | HIGH       | filesystem     | All helpers present: generate-content-hash.js, normalize-file-path.js, sanitize-error.js, intake-manual.js |
| C-044    | migration    | VERIFIED     | HIGH       | filesystem     | D13-2: Gen A, Gen B, Website v1.0, AWS variant confirmed. ~50 lines confirmed.                             |
| C-045    | migration    | VERIFIED     | HIGH       | filesystem     | Validation rules confirmed. Rollback = delete .db + re-run confirmed.                                      |
| C-046    | migration    | VERIFIED     | HIGH       | filesystem     | D13-1 finding 4 explicit: ALSO_SEEN_IN deferred post-migration.                                            |
| C-047    | operations   | VERIFIED     | HIGH       | filesystem     | D14-3: two-phase sync + SAVEPOINT + content-hash confirmed.                                                |
| C-048    | operations   | VERIFIED     | HIGH       | filesystem     | .gitignore: zero entries for _.db, _.db-wal, \*.db-shm. Absence confirmed.                                 |
| C-049    | operations   | VERIFIED     | MEDIUM     | web            | WAL+NORMAL+foreign_keys+temp_store MEMORY is established SQLite best practice.                             |
| C-050    | operations   | VERIFIED     | MEDIUM     | filesystem     | Three-stage dedup funnel confirmed across synthesis docs.                                                  |
| C-051    | operations   | UNVERIFIABLE | LOW        | web            | 0.6/0.4 weighting preventing false merges: no independent empirical validation.                            |
| C-052    | operations   | VERIFIED     | MEDIUM     | filesystem     | Merge thresholds (>=0.90 merge, 0.65-0.90 SAME_AS, <0.65 no action) consistent.                            |
| C-053    | operations   | UNVERIFIABLE | LOW        | filesystem     | 15 absorbs trigger from internal design doc only. No external corroboration.                               |

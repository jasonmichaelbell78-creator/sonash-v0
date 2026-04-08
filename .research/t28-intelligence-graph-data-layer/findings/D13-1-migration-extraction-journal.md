# Findings: Migration — Extraction Journal Schema Mapping

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-04-07
**Sub-Question:** D13-1

---

## Summary

168 entries, schema v2.0, 13 fields. 167 will be ingested (1 skip). 18 unique
sources (13 repo + 5 website), all have analysis.json. **Critical: 9 of 13 repo
slugs are non-derivable** from `source` field — requires manual lookup table
(`source-slug-map.json`). All 168 `extracted_to`/`extracted_at` are NULL —
extraction never completed. The 20 "extract" decision entries are ALL from
website sources (gists/docs), not repos. Type normalization needed (9 journal
types → 5 graph labels + sub-type labels).

---

## Key Findings

### 1. Schema v2.0: 13 Fields, 168 Entries [CONFIDENCE: HIGH]

All entries uniform v2.0. 146 repo + 22 website. Decisions: defer (145), extract
(20), skip (1), investigate (2).

`extracted_at` field added mid-campaign (~entry 130+) but always null. Migration
must handle absence as equivalent to null.

### 2. Field-to-Graph Mapping [CONFIDENCE: HIGH]

| Journal Field            | KnowledgeNode Property            |
| ------------------------ | --------------------------------- |
| candidate                | name                              |
| type                     | labels[] (normalized, see below)  |
| notes                    | summary                           |
| novelty/effort/relevance | attributes.\*                     |
| decision                 | status (mapped)                   |
| decision_date            | ingested_at                       |
| source                   | FK → SourceNode (via slug lookup) |

### 3. Type Normalization [CONFIDENCE: HIGH]

| Journal type           | Graph Label(s)                 | Count |
| ---------------------- | ------------------------------ | ----- |
| pattern                | Pattern                        | 62    |
| anti-pattern           | AntiPattern                    | 28    |
| architecture-pattern   | Pattern, ArchitecturePattern   | 6     |
| workflow-pattern       | Pattern, WorkflowPattern       | 4     |
| design-principle       | Pattern, DesignPrinciple       | 6     |
| implementation-pattern | Pattern, ImplementationPattern | 1     |
| knowledge              | Fact                           | 29    |
| content                | Capability                     | 29    |
| tool                   | Capability, Tool               | 3     |

### 4. Edge Strategy [CONFIDENCE: HIGH]

- 167 EXTRACTED_FROM edges (1 per non-skip entry)
- Cross-source dedup (ALSO_SEEN_IN) deferred to post-migration graph ops, not
  migration script
- No same-source duplicates exist in current data

### 5. Decision → Status [CONFIDENCE: HIGH]

| decision    | count | status      | action                         |
| ----------- | ----- | ----------- | ------------------------------ |
| defer       | 145   | pending     | Create node                    |
| extract     | 20    | active      | Create node (priority backlog) |
| investigate | 2     | investigate | Create node                    |
| skip        | 1     | —           | Do NOT create                  |

**167 KnowledgeNodes** (168 - 1 skip).

### 6. Bulk Migration [CONFIDENCE: MEDIUM]

Single SQLite transaction: 18 SourceNodes → 167 KnowledgeNodes → 167 edges →
commit. Atomic, fast. Post-migration validation queries for count verification
and orphan detection.

### 7. Source Slug Resolution — NON-TRIVIAL [CONFIDENCE: HIGH]

**9 of 13 repo slugs are irregular.** Simple `toLowerCase().replace('/', '-')`
fails. Examples:

| Journal source                                 | Filesystem slug                             |
| ---------------------------------------------- | ------------------------------------------- |
| HKUDS/CLI-Anything                             | hkuds-cli-anything                          |
| teng-lin/notebooklm-py                         | teng-lin_notebooklm-py (underscore!)        |
| aws-solutions-library-samples/guidance-for-... | aws-media-extraction (completely different) |
| iawia002/lux                                   | lux-video-downloader (renamed)              |

**Requires `source-slug-map.json` lookup table** before migration can proceed.
All 18 sources verified to have analysis.json files.

### 8. Validation Rules [CONFIDENCE: HIGH]

1. Missing analysis.json = stub SourceNode (don't abort)
2. Orphaned KnowledgeNode (unresolvable source) = hard failure or sentinel node
3. Duplicate candidate+source = merge with most recent decision_date
4. Post-migration: verify 167 KnowledgeNodes, 18 SourceNodes, 167 EXTRACTED_FROM
   edges, 0 orphans

---

## Sources

All codebase ground truth: extraction-journal.jsonl, D7 findings, v1-synthesis,
filesystem verification. HIGH confidence throughout.

---

## Gaps

1. Website analysis.json schema not directly verified (may differ from repo
   v4.3)
2. source-slug-map.json not yet formalized as artifact
3. Cross-source semantic dedup logic undefined
4. ThemeNode pre-population strategy undefined
5. Embedding generation timing not covered (post-insert enrichment pass?)

---

## Serendipity

1. **20 "extract" entries are ALL website sources** — highest-value T28 nodes
   come from gists/docs, not repos
2. **extracted_at added mid-campaign** without version bump — schema is
   technically v2.1 for newer entries
3. **Maharshi-Pandya has 2 entries, only 1 is skip** — SourceNode still created
   for the deferred entry

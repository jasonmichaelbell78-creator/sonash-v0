# Findings: Migration — analysis.json v4.3 + Website Analysis Mapping

**Searcher:** deep-research-searcher | **Date:** 2026-04-07 | **Sub-Question:**
D13-2

---

## Summary

Two distinct analysis.json schema generations exist: Gen A (v4.0-4.2, older
repos) and Gen B (v4.3, T28-era). Website analysis uses `schema_version: "1.0"`
(completely different schema). **Single SourceNode base type with discriminated
attributes** recommended. Field mapping tables for repo (both generations) and
website provided. value-map.json candidates → KnowledgeNode stubs (website
value-maps richer than repo). findings.jsonl → KnowledgeNodes with
severity/category. 4 edge types emerge: EXTRACTED_FROM, RELATED_TO
(cross_repo_connections), SUPPORTED_BY (finding back-refs), MEMBER_OF (cluster).
Prior claim C-015 "no transformation required" is optimistic — 6 normalization
differences exist but all are simple (~50 lines).

---

## Key Findings

### 1. Two Schema Generations [CONFIDENCE: HIGH]

**Gen A (v4.0-4.2):** `date` (YYYY-MM-DD), `scanDepth`, `classification{}`,
`dimensions{}`, `scoring{}`, `absencePattern{type, description}`. No
`analyzedAt`, no `schemaVersion`, no `context`.

**Gen B (v4.3):** `schemaVersion: "4.3"`, `analyzedAt` (ISO 8601), `depth`,
`repoSubtype`, `context{t28Relevance, cluster, notablePatterns[]}`,
`absencePattern` as string. Quick scans omit dimensions/candidates.

**AWS variant:** `meta{}` wrapper + `repo{}` sub-object + `quick_scan{}` — third
schema branch.

### 2. Unified SourceNode Mapping [CONFIDENCE: HIGH]

Single SourceNode with `source_type: "repo"|"website"` discriminator. Shared
core: id, source_type, name, url, ingested_at, scan_depth, content_hash,
summary. Divergent fields in `attributes: Record<string, unknown>`.

### 3. Website Schema (v1.0) [CONFIDENCE: HIGH]

Completely different from repo. Key fields: `meta.slug` → id, `site.title` →
name, `meta.url` → url, `site.author` → attributes.author. Has `value_axes{}`
(13-axis scoring), `key_claims[]`, `ecosystem_tags[]`, `tech_stack[]` — none of
which exist in repo schema.

### 4. value-map.json → KnowledgeNode Stubs [CONFIDENCE: HIGH]

**Repo value-map:** No explicit `id` or `confidence` field. Must derive: `id`
from index, `confidence` from novelty (HIGH→0.9, MEDIUM→0.7, LOW→0.5). Four
candidate arrays: patternCandidates, knowledgeCandidates, contentCandidates,
antiPatternCandidates.

**Website value-map:** Has explicit `id` (K1, K2...) and explicit `confidence`
field (HIGH/MEDIUM). Has `finding_refs[]` back-references. Richer schema — repo
skill should adopt this in v4.4.

### 5. findings.jsonl → KnowledgeNodes [CONFIDENCE: HIGH]

**Repo findings:**
`{id, severity, category, title, description, recommendation}`. Map severity to
confidence: high→0.85, medium→0.70, low→0.50, info→0.60.

**Website findings:**
`{id, type, title, description, confidence, tags[], source_section, relevance}`.
Richer — has explicit confidence and tags array.

### 6. Four Edge Types [CONFIDENCE: HIGH]

1. **EXTRACTED_FROM** (KnowledgeNode→SourceNode): one per finding/value-map
   candidate
2. **RELATED_TO** (SourceNode→SourceNode): from `cross_repo_connections[]` in
   value-maps (only 3 repos have these)
3. **SUPPORTED_BY** (KnowledgeNode→KnowledgeNode): from website value-map
   `finding_refs[]`
4. **MEMBER_OF** (SourceNode→ThemeNode): from `context.cluster` (A-F, T28-era
   repos only)

### 7. T28-Era Extensions [CONFIDENCE: HIGH]

`context.cluster` (A-F) on 13 repos. `context.t28Relevance` and
`context.notablePatterns[]`. Websites have NO cluster assignment. **6 ThemeNode
stubs can be pre-seeded** from cluster values before community detection.

### 8. C-015 Correction [CONFIDENCE: MEDIUM]

"No transformation required" is optimistic. 6 normalization differences: key
naming (date vs analyzedAt), date format (YYYY-MM-DD vs ISO 8601),
absencePattern polymorphism (object vs string), summaryBands shape, optional
fields, AWS variant. All simple structural normalization (~50 lines), no
semantic ETL.

---

## Sources

24 filesystem files read directly (all codebase ground truth). HIGH confidence
throughout.

---

## Serendipity

1. **6 ThemeNode stubs pre-seeded** from context.cluster before any community
   detection
2. **Website value-map schema is richer** — repo skill should adopt it in v4.4
3. **cross_repo_connections** is the only file-canonical inter-source edge data
   (3 repos)
4. **trends.jsonl, content-eval.jsonl, coverage-audit.jsonl are NOT migration
   candidates** — provenance/temporal data, not knowledge claims
